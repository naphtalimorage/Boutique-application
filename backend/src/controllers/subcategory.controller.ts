import { subCategoryService } from '../services/subcategory.service.js';

class SubCategoryController {
  async getAll(req: any, res: any, next: any) {
    try {
      const { categoryId } = req.query;
      const subcategories = await subCategoryService.getAll(categoryId as string);
      res.json(subcategories);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: any, res: any, next: any) {
    try {
      const { id } = req.params;
      const subcategory = await subCategoryService.getById(id);
      res.json(subcategory);
    } catch (error) {
      next(error);
    }
  }

  async create(req: any, res: any, next: any) {
    try {
      const subcategory = await subCategoryService.create(req.body);
      res.status(201).json(subcategory);
    } catch (error) {
      next(error);
    }
  }

  async update(req: any, res: any, next: any) {
    try {
      const { id } = req.params;
      const subcategory = await subCategoryService.update(id, req.body);
      res.json(subcategory);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: any, res: any, next: any) {
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