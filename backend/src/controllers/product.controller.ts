import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { productService } from '../services/product.service';
import { createProductSchema, updateProductSchema } from '../validations';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(jpe?g|png|gif|webp|svg)$/i;
    const allowedMimes = /^(image\/|image\/svg\+xml)/;
    const extname = allowedExtensions.test(file.originalname);
    const mimetype = allowedMimes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG images are allowed.'));
  },
});

export class ProductController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, categoryId } = req.query;
      const products = await productService.getAll(
        search as string,
        categoryId as string
      );
      res.status(200).json(products);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.getById(req.params.id as string);
      res.status(200).json(product);
    } catch (error) {
      const err = error as { message?: string };
      if (typeof err.message === 'string' && err.message.includes('not found')) {
        res.status(404).json({ error: err.message });
      } else {
        next(error);
      }
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    upload.single('image')(req, res, async (err: unknown) => {
      if (err) {
        const errorObj = err as { code?: string; message?: string };
        const message = errorObj.code === 'LIMIT_FILE_SIZE'
          ? 'Image file is too large. Maximum size is 2MB.'
          : errorObj.message || 'Image upload failed';
        return res.status(400).json({ error: message });
      }

      try {
        const validatedData = createProductSchema.parse(req.body);

        // Upload image if file was provided
        if (req.file) {
          const imageUrl = await productService.uploadImage(req.file);
          validatedData.imageUrl = imageUrl;
        }

        const product = await productService.create(validatedData);
        res.status(201).json(product);
      } catch (innerErr) {
        const errorObj = innerErr as { errors?: unknown };
        if (errorObj.errors) {
          res.status(400).json({ error: 'Validation error', details: errorObj.errors });
        } else {
          next(innerErr);
        }
      }
    });
  }

  async update(req: Request, res: Response, next: NextFunction) {
    upload.single('image')(req, res, async (err: unknown) => {
      if (err) {
        const errorObj = err as { code?: string; message?: string };
        const message = errorObj.code === 'LIMIT_FILE_SIZE'
          ? 'Image file is too large. Maximum size is 2MB.'
          : errorObj.message || 'Image upload failed';
        return res.status(400).json({ error: message });
      }

      try {
        const validatedData = updateProductSchema.parse(req.body);

        // Upload new image if file was provided
        if (req.file) {
          // Delete old image if it exists
          const existingProduct = await productService.getById(req.params.id as string);
          if (existingProduct.image_url && typeof existingProduct.image_url === 'string') {
            await productService.deleteImage(existingProduct.image_url);
          }

          const imageUrl = await productService.uploadImage(req.file);
          validatedData.imageUrl = imageUrl;
        }

        const product = await productService.update(req.params.id as string, validatedData);
        res.status(200).json(product);
      } catch (innerErr) {
        const err = innerErr as { message?: string; errors?: unknown };
        if (typeof err.message === 'string' && err.message.includes('not found')) {
          res.status(404).json({ error: err.message });
        } else if (err.errors) {
          res.status(400).json({ error: 'Validation error', details: err.errors });
        } else {
          next(innerErr);
        }
      }
    });
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await productService.delete(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const productController = new ProductController();
