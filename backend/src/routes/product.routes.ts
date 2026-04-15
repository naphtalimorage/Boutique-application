import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public access - anyone can view products
router.get('/', productController.getAll);
router.get('/:id', productController.getById);

// Protected routes - staff and admin only
router.use(authenticate);

// POST and PUT accept multipart/form-data for file uploads
router.post('/', authorize('admin', 'staff'), productController.create);
router.put('/:id', authorize('admin', 'staff'), productController.update);

// DELETE - admin and staff
router.delete('/:id', authorize('admin', 'staff'), productController.delete);

export default router;
