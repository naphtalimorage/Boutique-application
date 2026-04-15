import { Request, Response, NextFunction } from 'express';
import { saleService } from '../services/sale.service';
import { createSaleSchema } from '../validations';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
  };
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
};

export class SaleController {
  /**
   * Create a single-item sale (backwards compatible)
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createSaleSchema.parse(req.body);
      const userId = (req as AuthenticatedRequest).user?.id;
      const sale = await saleService.create(validatedData, userId);
      res.status(201).json(sale);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      if (message.includes('not found')) {
        res.status(404).json({ error: message });
      } else if (message.includes('Insufficient stock')) {
        res.status(400).json({ error: message });
      } else if (typeof error === 'object' && error !== null && 'errors' in error) {
        res.status(400).json({ error: 'Validation error', details: (error as { errors: unknown }).errors });
      } else {
        next(error);
      }
    }
  }

  /**
   * Create a multi-product sale
   */
  async createMulti(req: Request, res: Response, next: NextFunction) {
    try {
      const { items, paymentMethod, mpesaData } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'At least one item is required' });
      }

      if (!paymentMethod || !['cash', 'mobile_money'].includes(paymentMethod)) {
        return res.status(400).json({ error: 'Payment method must be "cash" or "mobile_money"' });
      }

      // Validate each item
      for (const item of items) {
        if (!item.productId || !item.quantity || item.quantity < 1) {
          return res.status(400).json({ error: 'Each item must have a valid productId and quantity' });
        }
      }

      // For mobile_money, require M-Pesa transaction data
      if (paymentMethod === 'mobile_money' && !mpesaData?.checkoutRequestID) {
        return res.status(400).json({ error: 'M-Pesa transaction data is required for mobile money payments' });
      }

      const userId = (req as AuthenticatedRequest).user?.id;
      const sale = await saleService.createMultiSale({ items, paymentMethod, mpesaData }, userId);
      res.status(201).json(sale);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      if (message.includes('not found')) {
        res.status(404).json({ error: message });
      } else if (message.includes('Insufficient stock')) {
        res.status(400).json({ error: message });
      } else {
        next(error);
      }
    }
  }

  /**
   * Get all sales
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const sales = await saleService.getAll(startDate as string, endDate as string);
      res.status(200).json(sales);
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Update sale status (mark as paid)
   */
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      if (!['pending', 'paid', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be "pending", "paid", or "cancelled"' });
      }

      const sale = await saleService.updateStatus(req.params.id as string, status);
      res.status(200).json(sale);
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Export sales to CSV
   */
  async exportCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const sales = await saleService.getSalesForCSV(startDate as string, endDate as string);

      // Convert to CSV
      const csvRows = [
        'Date,Payment Method,Status,Product,Category,Quantity,Unit Price,Subtotal,Total Amount',
      ];

      for (const sale of sales) {
        const date = new Date(sale.created_at).toLocaleString();
        const paymentMethod = sale.payment_method === 'mobile_money' ? 'Mobile Money' : 'Cash';
        const status = sale.status.charAt(0).toUpperCase() + sale.status.slice(1);
        const totalAmount = Number(sale.total_amount).toFixed(2);

        if (sale.sale_items && sale.sale_items.length > 0) {
          for (const item of sale.sale_items) {
            const productName = item.products?.name || 'Unknown';
            const category = item.products?.categories?.name || 'Uncategorized';
            const quantity = item.quantity;
            const unitPrice = Number(item.unit_price).toFixed(2);
            const subtotal = Number(item.subtotal).toFixed(2);
            csvRows.push(`"${date}","${paymentMethod}","${status}","${productName}","${category}",${quantity},${unitPrice},${subtotal},${totalAmount}`);
          }
        }
      }

      const csv = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sales-report.csv');
      res.status(200).send(csv);
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await saleService.getDashboardStats();
      res.status(200).json(stats);
    } catch (error: unknown) {
      next(error);
    }
  }
}

export const saleController = new SaleController();
