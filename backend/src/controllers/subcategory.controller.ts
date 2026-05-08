import { Request, Response, NextFunction } from 'express';
import { subCategoryService } from '../services/subcategory.service.js';

class SubCategoryController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId } = req.query;
      const subcategories = await subCategoryService.getAll(categoryId as string);
      res.json(subcategories);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const subcategory = await subCategoryService.getById(id);
      res.json(subcategory);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const subcategory = await subCategoryService.create(req.body);
      res.status(201).json(subcategory);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const subcategory = await subCategoryService.update(id, req.body);
      res.json(subcategory);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await subCategoryService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const subCategoryController = new SubCategoryController();