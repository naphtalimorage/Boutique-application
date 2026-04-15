import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createCategorySchema } from '../validations';

const router = Router();

// Public access
router.get('/', categoryController.getAll);

// Protected routes - admin only
router.use(authenticate);
router.post('/', authorize('admin'), validate(createCategorySchema), categoryController.create);

export default router;
