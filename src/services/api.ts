import axios from 'axios';
import { getSupabaseClient } from '@/lib/supabase';
import type {
  User,
  Category,
  Product,
  Sale,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  CreateProductRequest,
  UpdateProductRequest,
  CreateSaleRequest,
  CreateMultiSaleRequest,
  DashboardStats,
} from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'https://boutique-application.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (Token expired or invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear all session data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userPassword');
      
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// Products API
export const productsAPI = {
  getAll: async (search?: string, categoryId?: string): Promise<Product[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (categoryId) params.append('categoryId', categoryId);
    const response = await api.get(`/products?${params.toString()}`);
    return response.data;
  },
  getById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  /**
   * Upload image directly to Supabase Storage, then create product with the image URL
   */
  createWithImage: async (productData: CreateProductRequest, imageFile: File): Promise<Product> => {
    const supabase = getSupabaseClient();

    // Check if user is authenticated with Supabase
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('No Supabase session. User needs to login first.');
    }

    const ext = imageFile.name.split('.').pop() || 'jpg';
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    console.log('Uploading to:', path);

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, imageFile, { contentType: imageFile.type });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload image: ' + uploadError.message);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(path);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get image URL');
    }

    console.log('✅ Image uploaded to Supabase:', urlData.publicUrl);

    // Create product with the image URL
    return api.post('/products', {
      ...productData,
      imageUrl: urlData.publicUrl,
    }).then(r => r.data);
  },
  create: async (data: FormData | CreateProductRequest): Promise<Product> => {
    const response = await api.post('/products', data);
    return response.data;
  },
  update: async (id: string, data: FormData | UpdateProductRequest): Promise<Product> => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};

// Categories API
export const categoriesAPI = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return response.data;
  },
  create: async (name: string): Promise<Category> => {
    const response = await api.post('/categories', { name });
    return response.data;
  },
};

// Sales API
export const salesAPI = {
  create: async (data: CreateSaleRequest): Promise<Sale> => {
    const response = await api.post('/sales', data);
    return response.data;
  },
  createMulti: async (data: CreateMultiSaleRequest): Promise<Sale> => {
    const response = await api.post('/sales/multi', data);
    return response.data;
  },
  updateStatus: async (id: string, status: 'pending' | 'paid' | 'cancelled'): Promise<Sale> => {
    const response = await api.patch(`/sales/${id}/status`, { status });
    return response.data;
  },
  getAll: async (startDate?: string, endDate?: string): Promise<Sale[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/sales?${params.toString()}`);
    return response.data;
  },
  exportCSV: async (): Promise<string> => {
    const response = await api.get('/sales/export/csv', { responseType: 'blob' });
    return URL.createObjectURL(response.data);
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/sales/dashboard/stats');
    return response.data;
  },
};

export default api;
