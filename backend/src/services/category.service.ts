import { supabase } from '../database/supabase';

class CategoryService {
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new Error('Failed to fetch categories: ' + error.message);
    }

    return data || [];
  }

  async create(name: string) {
    const { data: category, error } = await supabase
      .from('categories')
      .insert({ name })
      .select()
      .single();

    if (error || !category) {
      throw new Error('Failed to create category: ' + (error?.message || 'Unknown error'));
    }

    return category;
  }
}

export const categoryService = new CategoryService();
