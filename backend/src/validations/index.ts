import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'staff']).optional(),
});

// Size and color variation schemas
const colorVariationSchema = z.object({
  name: z.string().min(1, 'Color name is required'),
  stock: z.number().int().nonnegative('Color stock must be non-negative'),
  imageUrl: z.string().optional(),
});

const sizeVariationSchema = z.object({
  size: z.string().min(1, 'Size name is required'),
  stock: z.number().int().nonnegative('Size stock must be non-negative'),
  colors: z.array(colorVariationSchema).min(1, 'At least one color is required'),
});

export const genderEnum = z.enum(['men', 'women', 'unisex', 'kids']).default('unisex');

export const createProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  categoryId: z.string().uuid('Invalid category ID'),
  subCategoryId: z.string().uuid('Invalid sub-category ID').optional(),
  gender: genderEnum,
  price: z.coerce.number().positive('Price must be positive'),
  stock: z.coerce.number().int().nonnegative('Stock must be non-negative'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  variations: z.array(sizeVariationSchema).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  categoryId: z.string().uuid().optional(),
  subCategoryId: z.string().uuid().optional(),
  gender: genderEnum.optional(),
  price: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().nonnegative().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  variations: z.array(sizeVariationSchema).optional(),
});

export const createSaleSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  priceOverride: z.number().positive().optional(),
  size: z.string().optional(),    // Size name
  color: z.string().optional(),   // Color name
});

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const createSubCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  categoryId: z.string().uuid('Invalid category ID'),
});

export const updateSubCategorySchema = z.object({
  name: z.string().min(2).optional(),
  categoryId: z.string().uuid().optional(),
});
