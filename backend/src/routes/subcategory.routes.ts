import { Router } from 'express';
import { subCategoryController } from '../controllers/subcategory.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { createSubCategorySchema, updateSubCategorySchema } from '../validations/index.js';

const router = Router();

router.get('/', subCategoryController.getAll);
router.get('/:id', subCategoryController.getById);

router.use(authenticate);
router.post('/', authorize('admin'), validate(createSubCategorySchema), subCategoryController.create);
router.put('/:id', authorize('admin'), validate(updateSubCategorySchema), subCategoryController.update);
router.delete('/:id', authorize('admin'), subCategoryController.delete);

export default router;