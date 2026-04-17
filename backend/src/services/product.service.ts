import { supabase } from '../database/supabase.js';
import path from 'path';

interface ProductVariationColor {
  name: string;
  stock: number;
  imageUrl?: string;
}

interface ProductVariation {
  size: string;
  stock?: number;
  colors: ProductVariationColor[];
}

export interface CreateProductInput {
  name: string;
  categoryId: string;
  subCategoryId?: string;
  gender?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  variations?: ProductVariation[];
}

export type UpdateProductInput = Partial<CreateProductInput>;

interface DbProduct {
  id: string;
  name: string;
  category_id?: string;
  sub_category_id?: string;
  gender?: string;
  price: number;
  stock: number;
  image_url?: string;
  variations?: ProductVariation[];
  [key: string]: unknown;
}

class ProductService {
  /**
   * Transform database product to API response format (camelCase)
   */
  private getAggregateStock(dbProduct: DbProduct): number {
    if (Array.isArray(dbProduct.variations) && dbProduct.variations.length > 0) {
      return dbProduct.variations.reduce(
        (sum, v) => sum + (v.stock ?? this.getVariationStock(v)),
        0
      );
    }
    return dbProduct.stock || 0;
  }

  private getVariationStock(variation: ProductVariation): number {
    if (Array.isArray(variation.colors) && variation.colors.length > 0) {
      return variation.colors.reduce((sum, c) => sum + (c.stock || 0), 0);
    }
    return variation.stock || 0;
  }

  private normalizeInputStock(input: CreateProductInput | UpdateProductInput): number {
    if (Array.isArray(input.variations) && input.variations.length > 0) {
      return input.variations.reduce(
        (sum, v) => sum + (v.stock ?? this.getVariationStock(v)),
        0
      );
    }
    return input.stock || 0;
  }

  private transformProduct(dbProduct: DbProduct): Record<string, unknown> {
    const variations = dbProduct.variations || [];
    const calculatedStock = this.getAggregateStock(dbProduct);
    
    return {
      ...dbProduct,
      imageUrl: dbProduct.image_url,
      categoryId: dbProduct.category_id,
      subCategoryId: dbProduct.sub_category_id,
      gender: dbProduct.gender || 'unisex',
      variations,
      stock: calculatedStock,
    };
  }

  /**
   * Transform array of products
   */
  private transformProducts(products: DbProduct[]): Record<string, unknown>[] {
    return products.map((p) => this.transformProduct(p));
  }
  /**
   * Upload file to Supabase Storage and return public URL
   */
  async uploadImage(file: Express.Multer.File): Promise<string> {
    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
    const filePath = `products/${fileName}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (error || !data) {
      throw new Error('Failed to upload image: ' + (error?.message || 'Unknown error'));
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }

  /**
   * Delete image from Supabase Storage
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract path from URL: .../product-images/products/filename.ext
      const urlParts = imageUrl.split('/product-images/');
      if (urlParts.length < 2) return;

      const filePath = urlParts[1];
      await supabase.storage.from('product-images').remove([filePath]);
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  }

  async getAll(search?: string, categoryId?: string, gender?: string, subCategoryId?: string) {
    let query = supabase
      .from('products')
      .select('*, categories(*), subcategories(*)');

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (gender) {
      query = query.eq('gender', gender);
    }

    if (subCategoryId) {
      query = query.eq('sub_category_id', subCategoryId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error('Failed to fetch products: ' + error.message);

    return this.transformProducts(data || []);
  }

  async getById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(*), subcategories(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new Error('Product not found');
    }

    return this.transformProduct(data);
  }

  async create(input: CreateProductInput) {
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name: input.name,
        category_id: input.categoryId,
        sub_category_id: input.subCategoryId,
        gender: input.gender || 'unisex',
        price: input.price,
        stock: this.normalizeInputStock(input),
        image_url: input.imageUrl,
        variations: input.variations || [],
      })
      .select('*, categories(*), subcategories(*)')
      .single();

    if (error || !product) {
      throw new Error('Failed to create product: ' + (error?.message || 'Unknown error'));
    }

    return this.transformProduct(product);
  }

  async update(id: string, input: UpdateProductInput) {
    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.categoryId !== undefined) updateData.category_id = input.categoryId;
    if (input.subCategoryId !== undefined) updateData.sub_category_id = input.subCategoryId;
    if (input.gender !== undefined) updateData.gender = input.gender;
    if (input.price !== undefined) updateData.price = input.price;
    if (input.stock !== undefined) updateData.stock = input.stock;
    if (input.imageUrl !== undefined) updateData.image_url = input.imageUrl;
    if (input.variations !== undefined) updateData.variations = input.variations;

    // Normalize stock to variation totals when variations are provided
    if (input.variations !== undefined) {
      updateData.stock = this.normalizeInputStock(input);
    }

    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select('*, categories(*), subcategories(*)')
      .single();

    if (error || !product) {
      throw new Error('Failed to update product: ' + (error?.message || 'Unknown error'));
    }

    return this.transformProduct(product);
  }

  async delete(id: string) {
    // Get product to delete associated image
    const { data: product } = await supabase
      .from('products')
      .select('image_url')
      .eq('id', id)
      .single();

    if (product?.image_url) {
      await this.deleteImage(product.image_url);
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error('Failed to delete product: ' + error.message);
    }
  }

  async getLowStockProducts(threshold: number = 5) {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(*)')
      .order('stock', { ascending: true });

    if (error) {
      throw new Error('Failed to fetch low stock products: ' + error.message);
    }

    const products = (data || []).map((p: DbProduct) => this.transformProduct(p));
    return products.filter((product) => (product.stock as number) <= threshold);
  }
}

export const productService = new ProductService();
