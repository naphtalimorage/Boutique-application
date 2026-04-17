import { supabase } from '../database/supabase.js';
import { emailService } from './email.service.js';

interface ProductVariationColor {
  name: string;
  stock: number;
}

interface ProductVariation {
  size: string;
  stock?: number;
  colors: ProductVariationColor[];
}

interface DbProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  variations?: ProductVariation[];
  image_url?: string;
  category_id?: string;
  [key: string]: unknown;
}

interface DbSaleItem {
  id?: string;
  sale_id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  size?: string | null;
  color?: string | null;
  products?: DbProduct;
  [key: string]: unknown;
}

interface DbSale {
  id: string;
  total_amount: number;
  total_price?: number;
  payment_method: string;
  status: string;
  created_at: string;
  sale_items?: DbSaleItem[];
  products?: DbProduct;
  [key: string]: unknown;
}

export interface SaleItemInput {
  productId: string;
  quantity: number;
  priceOverride?: number;
  size?: string;      // Size name
  color?: string;     // Color name
}

export interface CreateMultiSaleInput {
  items: SaleItemInput[];
  paymentMethod: 'cash' | 'mobile_money';
  mpesaData?: {
    checkoutRequestID: string;
    merchantRequestID: string;
    mpesaReceiptNumber: string;
    phoneNumber: string;
    transactionDate: string;
  };
}

class SaleService {
  /**
   * Transform database sale to API response format
   */
  private transformSale(dbSale: DbSale): Record<string, unknown> {
    return {
      id: dbSale.id,
      totalAmount: Number(dbSale.total_amount),
      paymentMethod: dbSale.payment_method || 'cash',
      status: dbSale.status || 'paid',
      createdAt: dbSale.created_at,
      saleItems: dbSale.sale_items?.map((item: DbSaleItem) => ({
        id: item.id,
        saleId: item.sale_id,
        productId: item.product_id,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        subtotal: Number(item.subtotal),
        size: item.size || undefined,
        color: item.color || undefined,
        product: item.products ? {
          ...item.products,
          imageUrl: item.products.image_url,
          categoryId: item.products.category_id,
        } : undefined,
      })),
      // Legacy fields for backwards compatibility
      productId: dbSale.product_id,
      quantity: dbSale.quantity,
      totalPrice: dbSale.total_price !== undefined ? Number(dbSale.total_price) : undefined,
      product: dbSale.products ? {
        ...dbSale.products,
        imageUrl: dbSale.products.image_url,
        categoryId: dbSale.products.category_id,
      } : undefined,
    };
  }

  /**
   * Transform array of sales
   */
  private transformSales(sales: DbSale[]): Record<string, unknown>[] {
    return sales.map((s) => this.transformSale(s));
  }
  /**
   * Create a single-item sale (backwards compatible)
   */
  async create(input: { productId: string; quantity: number; priceOverride?: number }, userId?: string) {
    const multiInput: CreateMultiSaleInput = {
      items: [{
        productId: input.productId,
        quantity: input.quantity,
        priceOverride: input.priceOverride,
      }],
      paymentMethod: 'cash',
    };
    return this.createMultiSale(multiInput, userId);
  }

  /**
   * Create a multi-product sale with payment tracking
   */
  async createMultiSale(input: CreateMultiSaleInput, _userId?: string) {
    void _userId;
    const { items, paymentMethod } = input;

    if (!items || items.length === 0) {
      throw new Error('At least one item is required');
    }

    // Validate all items and calculate total
    const validatedItems: Array<{
      product: DbProduct;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      size?: string;
      color?: string;
    }> = [];

    let totalAmount = 0;

    // Helper function to calculate effective stock from variations
    const calculateEffectiveStock = (dbProduct: DbProduct): number => {
      if (Array.isArray(dbProduct.variations) && dbProduct.variations.length > 0) {
        return dbProduct.variations.reduce((sum, v) => {
          if (Array.isArray(v.colors) && v.colors.length > 0) {
            return sum + v.colors.reduce((colorSum, c) => colorSum + (c.stock || 0), 0);
          }
          return sum + (v.stock || 0);
        }, 0);
      }
      return dbProduct.stock || 0;
    };

    for (const item of items) {
      // Get product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', item.productId)
        .single();
      const dbProduct = product as DbProduct | null;

      console.log(`[SALE DEBUG] Fetched product: ${product?.name}`);
      console.log(`  - DB stock column: ${product?.stock}`);
      console.log(`  - Variations: ${JSON.stringify(product?.variations)}`);

      if (productError || !product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      // Calculate effective stock
      const effectiveStock = calculateEffectiveStock(dbProduct);
      console.log(`  - Effective stock (calculated): ${effectiveStock}`);

      // If product has variations and size/color specified, validate against variation stock
      if (dbProduct?.variations && item.size && item.color) {
        const variation = dbProduct.variations.find((v) => v.size === item.size);
        if (!variation) {
          throw new Error(`Size "${item.size}" not found for "${dbProduct.name}"`);
        }

        const colorVariation = variation.colors.find((c) => c.name === item.color);
        if (!colorVariation) {
          throw new Error(`Color "${item.color}" not found for size "${item.size}" in "${dbProduct.name}"`);
        }

        // Check variation stock
        if (colorVariation.stock < item.quantity) {
          throw new Error(`Insufficient stock for "${dbProduct.name}" (${item.size}/${item.color}). Available: ${colorVariation.stock}`);
        }

        // Update the variation stock in the product object for later use
        dbProduct.variations = dbProduct.variations.map((v) => {
          if (v.size === item.size) {
            return {
              ...v,
              colors: v.colors.map((c) => {
                if (c.name === item.color) {
                  return { ...c, stock: c.stock - item.quantity };
                }
                return c;
              }),
            };
          }
          return v;
        });
      } else {
        // No variations or no size/color specified, check effective product stock
        if (!dbProduct) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        if (effectiveStock < item.quantity) {
          throw new Error(`Insufficient stock for "${dbProduct.name}". Available: ${effectiveStock}`);
        }
      }

      const unitPrice = item.priceOverride || dbProduct?.price || 0;
      const subtotal = unitPrice * item.quantity;

      validatedItems.push({ 
        product: dbProduct,
        quantity: item.quantity, 
        unitPrice, 
        subtotal,
        size: item.size,
        color: item.color,
      });
      totalAmount += subtotal;
    }

    // Create the sale record
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        total_amount: totalAmount,
        payment_method: paymentMethod,
        status: 'paid',
        mpesa_checkout_request_id: input.mpesaData?.checkoutRequestID,
        mpesa_merchant_request_id: input.mpesaData?.merchantRequestID,
        mpesa_receipt_number: input.mpesaData?.mpesaReceiptNumber,
        mpesa_phone_number: input.mpesaData?.phoneNumber,
        mpesa_transaction_date: input.mpesaData?.transactionDate,
      })
      .select()
      .single();

    if (saleError || !sale) {
      throw new Error('Failed to create sale: ' + (saleError?.message || 'Unknown error'));
    }

    // Create sale items and update stock
    for (const validatedItem of validatedItems) {
      // Create sale item with size and color
      const { error: itemError } = await supabase
        .from('sale_items')
        .insert({
          sale_id: sale.id,
          product_id: validatedItem.product.id,
          quantity: validatedItem.quantity,
          unit_price: validatedItem.unitPrice,
          subtotal: validatedItem.subtotal,
          size: validatedItem.size || null,
          color: validatedItem.color || null,
        });

      if (itemError) {
        throw new Error('Failed to create sale item: ' + itemError.message);
      }

      // CRITICAL: Update product stock
      console.log(`📦 Updating stock for product "${validatedItem.product.name}" (${validatedItem.product.id})`);
      console.log(`   Current stock: ${validatedItem.product.stock}`);
      console.log(`   Quantity sold: ${validatedItem.quantity}`);
      console.log(`   Has size/color: ${!!validatedItem.size}/${!!validatedItem.color}`);
      console.log(`   Has variations: ${!!validatedItem.product.variations}`);

      const updateData: Record<string, unknown> = {};
      let updatedVariations = validatedItem.product.variations as ProductVariation[] | undefined;

      // Helper to calculate stock from variations
      const calcStockFromVariations = (vars: ProductVariation[]) => {
        return vars.reduce((sum, v) => {
          if (Array.isArray(v.colors) && v.colors.length > 0) {
            return sum + v.colors.reduce((cs, c) => cs + (c.stock || 0), 0);
          }
          return sum + (v.stock || 0);
        }, 0);
      };

      // If product has variations, always update stock from variations
      if (Array.isArray(updatedVariations) && updatedVariations.length > 0) {
        if (validatedItem.size && validatedItem.color) {
          // Update specific variation
          console.log(`   Updating variations for size: ${validatedItem.size}, color: ${validatedItem.color}`);

          updatedVariations = updatedVariations.map((v) => {
            if (v.size === validatedItem.size) {
              const updatedColors = v.colors.map((c) => {
                if (c.name === validatedItem.color) {
                  console.log(`   Updating color "${c.name}" stock from ${c.stock} to ${c.stock - validatedItem.quantity}`);
                  return { ...c, stock: c.stock - validatedItem.quantity };
                }
                return c;
              });
              return {
                ...v,
                colors: updatedColors,
                stock: updatedColors.reduce((sum, color) => sum + (color.stock || 0), 0),
              };
            }
            return {
              ...v,
              stock: v.colors.reduce((sum, color) => sum + (color.stock || 0), 0),
            };
          });

          updateData.variations = updatedVariations;
          updateData.stock = calcStockFromVariations(updatedVariations);
          console.log(`  - Calculated new stock from variations: ${updateData.stock}`);
        } else {
          // No size/color provided but product has variations
          // Calculate stock from variations (minus sold quantity if applicable)
          const currentStock = calcStockFromVariations(updatedVariations);
          const newStock = currentStock - validatedItem.quantity;
          updateData.stock = newStock;
          console.log(`  - Updated stock from variations (no size/color specified): ${newStock}`);
        }
      } else {
        // No variations at all - use old logic
        updateData.stock = validatedItem.product.stock - validatedItem.quantity;
        console.log(`  - Updated stock directly: ${updateData.stock}`);
      }

      // Execute the stock update
      const { data: updatedProduct, error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', validatedItem.product.id)
        .select('stock, variations')
        .single();

      if (updateError) {
        console.error(`❌ Failed to update stock:`, updateError);
        throw new Error('Failed to update stock: ' + updateError.message);
      }

      console.log(`✅ Stock updated successfully!`);
      console.log(`   New stock in DB: ${updatedProduct.stock}`);
      if (updatedProduct.variations) {
        console.log(`   Updated variations:`, JSON.stringify(updatedProduct.variations, null, 2));
      }

      // Send email notification for each item
      try {
        const originalPrice = validatedItem.product.price;
        const unitPrice = validatedItem.unitPrice;

        await emailService.sendSaleNotification({
          productName: validatedItem.product.name,
          quantity: validatedItem.quantity,
          totalPrice: validatedItem.subtotal,
          unitPrice,
          originalPrice: originalPrice !== unitPrice ? originalPrice : undefined,
          timestamp: sale.created_at || new Date().toISOString(),
          paymentMethod,
          size: validatedItem.size,           // Add size to email
          color: validatedItem.color,         // Add color to email
          mpesaData: input.mpesaData ? {
            mpesaReceiptNumber: input.mpesaData.mpesaReceiptNumber,
            phoneNumber: input.mpesaData.phoneNumber,
            transactionDate: input.mpesaData.transactionDate,
          } : undefined,
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }
    }

    // Fetch complete sale with items
    const { data: saleWithItems } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          *,
          products (*, categories(*))
        )
      `)
      .eq('id', sale.id)
      .single();

    return this.transformSale(saleWithItems || sale);
  }

  /**
   * Get all sales with items
   */
  async getAll(startDate?: string, endDate?: string) {
    let query = supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          *,
          products (*, categories(*))
        )
      `)
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Failed to fetch sales: ' + error.message);
    }

    return this.transformSales(data || []);
  }

  /**
   * Update sale status (mark as paid)
   */
  async updateStatus(saleId: string, status: 'pending' | 'paid' | 'cancelled') {
    const { data: sale, error } = await supabase
      .from('sales')
      .update({ status })
      .eq('id', saleId)
      .select()
      .single();

    if (error || !sale) {
      throw new Error('Failed to update sale status: ' + (error?.message || 'Unknown error'));
    }

    return sale;
  }

  async getDashboardStats() {
    // Get total products
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Get total sales count and revenue
    const { data: salesStats } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('status', 'paid');

    const totalSales = salesStats?.length || 0;
    const totalRevenue = salesStats?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;

    // Get recent sales - transform to camelCase
    const { data: recentSalesRaw } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          *,
          products (*)
        )
      `)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(10);

    const recentSales = recentSalesRaw ? this.transformSales(recentSalesRaw) : [];

    // Get products and compute low stock based on aggregate variation stock
    const { data: productsRaw, error: productsError } = await supabase
      .from('products')
      .select('*, categories(*)');

    if (productsError) {
      throw new Error('Failed to fetch products for dashboard stats: ' + productsError.message);
    }

    const getAggregateStock = (product: DbProduct): number => {
      if (Array.isArray(product.variations) && product.variations.length > 0) {
        return product.variations.reduce(
          (sum, variation) => sum + ((variation.stock ?? variation.colors?.reduce((colorSum, c) => colorSum + (c.stock || 0), 0)) || 0),
          0
        );
      }
      return product.stock || 0;
    };

    const lowStockProductsAll = (productsRaw || [])
      .map((p: DbProduct) => {
        const aggregateStock = getAggregateStock(p);
        const product = {
          ...p,
          imageUrl: p.image_url,
          categoryId: p.category_id,
          stock: aggregateStock,
        } as Record<string, unknown>;

        if (p.variations && Array.isArray(p.variations) && p.variations.length > 0) {
          const lowStockVariations = p.variations
            .map((v) => ({
              size: v.size,
              stock: Array.isArray(v.colors)
                ? v.colors.reduce((sum, c) => sum + (c.stock || 0), 0)
                : v.stock || 0,
              colors: v.colors
                ?.map((c) => ({
                  name: c.name,
                  stock: c.stock,
                }))
                .filter((c) => c.stock <= 5),
            }))
            .filter((v) => v.stock <= 5 || (v.colors && v.colors.length > 0));

          (product as Record<string, unknown>).lowStockVariations = lowStockVariations;
        }

        return product;
      })
      .filter((product) => (product.stock as number) <= 5)
      .sort((a, b) => (a.stock as number) - (b.stock as number));

    const lowStockCount = lowStockProductsAll.length;
    const lowStockProducts = lowStockProductsAll.slice(0, 10);

    return {
      totalProducts: totalProducts || 0,
      totalSales,
      totalRevenue,
      lowStockCount: lowStockCount || 0,
      recentSales,
      lowStockProducts,
    };
  }

  async getSalesForCSV(startDate?: string, endDate?: string) {
    let query = supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          *,
          products (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Failed to fetch sales: ' + error.message);
    }

    return this.transformSales(data || []);
  }
}

export const saleService = new SaleService();
