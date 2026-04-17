import { supabase } from '../database/supabase.js';

interface SubCategory {
  id: string;
  name: string;
  category_id: string;
  created_at?: string;
}

export interface CreateSubCategoryInput {
  name: string;
  categoryId: string;
}

export type UpdateSubCategoryInput = Partial<CreateSubCategoryInput>;

class SubCategoryService {
  async getAll(categoryId?: string) {
    let query = supabase
      .from('subcategories')
      .select('*, categories(name)');

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) {
      throw new Error('Failed to fetch subcategories: ' + error.message);
    }

    return data || [];
  }

  async getById(id: string) {
    const { data, error } = await supabase
      .from('subcategories')
      .select('*, categories(name)')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new Error('SubCategory not found');
    }

    return data;
  }

  async create(input: CreateSubCategoryInput) {
    const { data: subcategory, error } = await supabase
      .from('subcategories')
      .insert({
        name: input.name,
        category_id: input.categoryId,
      })
      .select('*, categories(name)')
      .single();

    if (error || !subcategory) {
      throw new Error('Failed to create subcategory: ' + (error?.message || 'Unknown error'));
    }

    return subcategory;
  }

  async update(id: string, input: UpdateSubCategoryInput) {
    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.categoryId !== undefined) updateData.category_id = input.categoryId;

    const { data: subcategory, error } = await supabase
      .from('subcategories')
      .update(updateData)
      .eq('id', id)
      .select('*, categories(name)')
      .single();

    if (error || !subcategory) {
      throw new Error('Failed to update subcategory: ' + (error?.message || 'Unknown error'));
    }

    return subcategory;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from('subcategories')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error('Failed to delete subcategory: ' + error.message);
    }
  }
}

export const subCategoryService = new SubCategoryService();