import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service';
import { createCategorySchema } from '../validations';

export class CategoryController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await categoryService.getAll();
      res.status(200).json(categories);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createCategorySchema.parse(req.body);
      const category = await categoryService.create(validatedData.name);
      res.status(201).json(category);
    } catch (error) {
      const err = error as { errors?: unknown };
      if (err.errors) {
        res.status(400).json({ error: 'Validation error', details: err.errors });
      } else {
        next(error);
      }
    }
  }
}

export const categoryController = new CategoryController();
