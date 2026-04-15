import { Request, Response } from 'express';
import { darajaService } from '../services/daraja.service.js';
import { supabase } from '../database/supabase.js';

interface MpesaProductVariationColor {
  name: string;
  stock: number;
}

interface MpesaProductVariation {
  size: string;
  colors: MpesaProductVariationColor[];
  stock?: number;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
};

export class MpesaController {
  /**
   * Initiate STK Push
   * Creates a pending sale record first, then triggers STK Push
   */
  async initiateSTKPush(req: Request, res: Response) {
    try {
      const { phoneNumber, amount, accountReference, transactionDesc, items, userId } = req.body;

      // Validate required fields
      if (!phoneNumber || !amount || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Missing required fields: phoneNumber, amount, items' });
      }

      // Create pending sale record FIRST
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          total_amount: amount,
          payment_method: 'mobile_money',
          status: 'pending',
          payment_status: 'pending',
          created_by: userId || null,
        })
        .select()
        .single();

      if (saleError || !sale) {
        throw new Error('Failed to create sale record: ' + (saleError?.message || 'Unknown error'));
      }

      // Create sale items
      for (const item of items) {
        const { error: itemError } = await supabase
          .from('sale_items')
          .insert({
            sale_id: sale.id,
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.unitPrice || 0,
            subtotal: item.subtotal || 0,
            size: item.size || null,
            color: item.color || null,
          });

        if (itemError) {
          throw new Error('Failed to create sale item: ' + itemError.message);
        }
      }

      // Initiate STK Push
      const stkResponse = await darajaService.initiateSTKPush({
        phoneNumber,
        amount,
        accountReference: accountReference || `Sale-${sale.id.substring(0, 8)}`,
        transactionDesc: transactionDesc || 'Payment for purchase',
      });

      // Store M-Pesa transaction record
      await supabase
        .from('mpesa_transactions')
        .insert({
          sale_id: sale.id,
          checkout_request_id: stkResponse.CheckoutRequestID,
          merchant_request_id: stkResponse.MerchantRequestID,
          phone_number: phoneNumber,
          amount,
          status: 'pending',
          callback_payload: null,
        });

      res.status(200).json({
        success: true,
        saleId: sale.id,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        message: stkResponse.CustomerMessage || 'STK Push sent successfully',
      });
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error('STK Push Error:', message);
      res.status(500).json({ error: message || 'Failed to initiate M-Pesa payment' });
    }
  }

  /**
   * Handle M-Pesa callback from Safaricom
   * This is the source of truth for payment confirmation
   */
  async handleCallback(req: Request, res: Response) {
    try {
      // Validate Safaricom IP (skip in sandbox for development)
      const clientIP = req.ip || req.connection?.remoteAddress || '';
      const isValidIP = darajaService.isValidSafaricomIP(clientIP.replace('::ffff:', ''));

      if (!isValidIP) {
        console.warn(`⚠️ M-Pesa callback from unauthorized IP: ${clientIP}`);
        return res.status(403).json({ ResultCode: 1, ResultDesc: 'Unauthorized IP' });
      }

      const callbackData = req.body;
      const parsedCallback = darajaService.handleSTKCallback(callbackData);

      console.log(`📞 M-Pesa Callback: ${parsedCallback.CheckoutRequestID} - ResultCode: ${parsedCallback.ResultCode}`);

      // Find the M-Pesa transaction
      const { data: mpesaTx, error: txError } = await supabase
        .from('mpesa_transactions')
        .select('*')
        .eq('checkout_request_id', parsedCallback.CheckoutRequestID)
        .single();

      if (txError || !mpesaTx) {
        console.warn(`⚠️ M-Pesa transaction not found: ${parsedCallback.CheckoutRequestID}`);
        // Still return success to Safaricom to prevent retries
        return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
      }

      // Check for idempotency - if already processed, return success
      if (mpesaTx.status !== 'pending') {
        console.log(`ℹ️ M-Pesa transaction already processed: ${parsedCallback.CheckoutRequestID}`);
        return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
      }

      // Update M-Pesa transaction record
      const updateData: Record<string, unknown> = {
        callback_payload: callbackData,
        result_code: parsedCallback.ResultCode?.toString(),
        result_desc: parsedCallback.ResultDesc,
      };

      let paymentStatus = 'failed';
      let saleStatus = 'failed';

      // Check if payment was successful
      if (parsedCallback.ResultCode === '0' && parsedCallback.metadata) {
        // Successful payment
        updateData.mpesa_receipt_number = parsedCallback.metadata.MpesaReceiptNumber || null;
        updateData.transaction_date = parsedCallback.metadata.TransactionDate 
          ? new Date(parsedCallback.metadata.TransactionDate as string).toISOString()
          : new Date().toISOString();
        updateData.status = 'completed';
        paymentStatus = 'completed';
        saleStatus = 'paid';

        console.log(`✅ M-Pesa Payment Success: ${updateData.mpesa_receipt_number}`);
      } else {
        // Failed payment
        updateData.status = 'failed';
        paymentStatus = 'failed';
        saleStatus = 'failed';

        console.log(`❌ M-Pesa Payment Failed: ${parsedCallback.ResultDesc}`);
      }

      // Update M-Pesa transaction
      await supabase
        .from('mpesa_transactions')
        .update(updateData)
        .eq('id', mpesaTx.id);

      // Update the associated sale
      if (mpesaTx.sale_id) {
        const { error: saleUpdateError } = await supabase
          .from('sales')
          .update({
            payment_status: paymentStatus,
            status: saleStatus,
            mpesa_checkout_request_id: parsedCallback.CheckoutRequestID,
            mpesa_merchant_request_id: parsedCallback.MerchantRequestID,
            mpesa_receipt_number: updateData.mpesa_receipt_number || null,
            mpesa_phone_number: mpesaTx.phone_number,
            mpesa_transaction_date: updateData.transaction_date || null,
          })
          .eq('id', mpesaTx.sale_id);

        if (saleUpdateError) {
          console.error('Failed to update sale:', saleUpdateError.message);
        }

        // If payment successful, update product stock
        if (paymentStatus === 'completed') {
          console.log(`📦 Updating stock for M-Pesa sale ${mpesaTx.sale_id}`);
          
          // Get sale items
          const { data: saleItems } = await supabase
            .from('sale_items')
            .select('product_id, quantity, size, color')
            .eq('sale_id', mpesaTx.sale_id);

          if (saleItems) {
            for (const item of saleItems) {
              // Get current product
              const { data: product } = await supabase
                .from('products')
                .select('stock, variations')
                .eq('id', item.product_id)
                .single();

              if (product) {
                console.log(`   Product: ${item.product_id}`);
                console.log(`   Current stock: ${product.stock}`);
                console.log(`   Quantity sold: ${item.quantity}`);
                console.log(`   Size/Color: ${item.size}/${item.color}`);

                let updatedVariations = Array.isArray(product.variations)
                  ? (product.variations as MpesaProductVariation[])
                  : [];
                let newStock = product.stock - item.quantity;

                // If product has variations, update specific variant and recompute totals
                if (updatedVariations.length > 0 && item.size && item.color) {
                  updatedVariations = updatedVariations.map((v) => {
                    if (v.size === item.size) {
                      const updatedColors = v.colors.map((c) => {
                        if (c.name === item.color) {
                          console.log(`   Updating color "${c.name}" stock from ${c.stock} to ${c.stock - item.quantity}`);
                          return { ...c, stock: c.stock - item.quantity };
                        }
                        return c;
                      });
                      return {
                        ...v,
                        colors: updatedColors,
                        stock: updatedColors.reduce((sum, c) => sum + (c.stock || 0), 0),
                      };
                    }
                    return {
                      ...v,
                      stock: v.colors.reduce((sum, c) => sum + (c.stock || 0), 0),
                    };
                  });

                  newStock = updatedVariations.reduce(
                    (sum, v) => sum + (v.stock || 0),
                    0
                  );
                }

                console.log(`   New stock: ${newStock}`);

                const { error: updateError } = await supabase
                  .from('products')
                  .update({
                    stock: newStock,
                    variations: updatedVariations,
                  })
                  .eq('id', item.product_id);

                if (updateError) {
                  console.error(`   ❌ Failed to update stock:`, updateError);
                } else {
                  console.log(`   ✅ Stock updated successfully`);
                }
              } else {
                console.warn(`   ⚠️ Product not found: ${item.product_id}`);
              }
            }
          }
        }
      }

      // Always return success to Safaricom to prevent retries
      res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error('M-Pesa Callback Error:', message);
      // Still return success to Safaricom
      res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }
  }

  /**
   * Get sale payment status by checkout request ID
   */
  async getPaymentStatus(req: Request, res: Response) {
    try {
      const { checkoutRequestId } = req.params;

      const { data: mpesaTx } = await supabase
        .from('mpesa_transactions')
        .select(`
          *,
          sales (
            id,
            status,
            payment_status,
            mpesa_receipt_number,
            mpesa_transaction_date
          )
        `)
        .eq('checkout_request_id', checkoutRequestId)
        .single();

      if (!mpesaTx) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.status(200).json({
        success: true,
        data: mpesaTx,
      });
    } catch (error: unknown) {
      res.status(500).json({ error: getErrorMessage(error) });
    }
  }

  /**
   * Query STK status (fallback if callback doesn't arrive)
   */
  async querySTKStatus(req: Request, res: Response) {
    try {
      const { checkoutRequestId } = req.body;

      if (!checkoutRequestId) {
        return res.status(400).json({ error: 'checkoutRequestId is required' });
      }

      const result = await darajaService.querySTKStatus(checkoutRequestId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      res.status(500).json({ error: getErrorMessage(error) });
    }
  }
}

export const mpesaController = new MpesaController();
