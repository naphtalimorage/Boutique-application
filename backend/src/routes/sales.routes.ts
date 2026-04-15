import { Router } from 'express';
import { saleController } from '../controllers/sale.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createSaleSchema } from '../validations';

const router = Router();

// All sales routes require authentication
router.use(authenticate);

// Single-item sale (backwards compatible)
router.post('/', authorize('admin', 'staff'), validate(createSaleSchema), saleController.create);

// Multi-product sale
router.post('/multi', authorize('admin', 'staff'), saleController.createMulti);

// Update sale status
router.patch('/:id/status', authorize('admin', 'staff'), saleController.updateStatus);

// Get all sales
router.get('/', authorize('admin', 'staff'), saleController.getAll);

// Export CSV
router.get('/export/csv', authorize('admin', 'staff'), saleController.exportCSV);

// Dashboard stats
router.get('/dashboard/stats', authorize('admin', 'staff'), saleController.getDashboardStats);

export default router;
