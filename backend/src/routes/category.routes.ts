import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { createCategorySchema } from '../validations/index.js';

const router = Router();

// Public access
router.get('/', categoryController.getAll);

// Protected routes - admin only
router.use(authenticate);
router.post('/', authorize('admin'), validate(createCategorySchema), categoryController.create);

export default router;
