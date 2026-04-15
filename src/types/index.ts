export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
}

export interface Category {
  id: string;
  name: string;
}

export interface ColorVariation {
  name: string;
  stock: number;
  imageUrl?: string;
}

export interface SizeVariation {
  size: string;
  stock: number;
  colors: ColorVariation[];
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  stock: number;
  imageUrl?: string;
  variations?: SizeVariation[];
  lowStockVariations?: Array<{
    size: string;
    stock: number;
    colors?: Array<{ name: string; stock: number }>;
  }>;
  category?: Category;
  categories?: Category; // From Supabase join query (singular category embedded)
  // Legacy snake_case fields (from API response)
  image_url?: string;
  category_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  size?: string;        // Size name
  color?: string;       // Color name
  product?: Product;
}

export interface Sale {
  id: string;
  totalAmount: number;
  paymentMethod: 'cash' | 'mobile_money';
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
  saleItems?: SaleItem[];
  // Legacy fields for backwards compatibility
  productId?: string;
  quantity?: number;
  totalPrice?: number;
  product?: Product;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreateProductRequest {
  name: string;
  categoryId: string;
  price: number;
  stock: number;
  imageUrl?: string;
  variations?: SizeVariation[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface CreateSaleRequest {
  productId: string;
  quantity: number;
  priceOverride?: number;
}

export interface SaleCartItem {
  productId: string;
  quantity: number;
  priceOverride?: number;
  size?: string;        // Size name (e.g., "XL", "42")
  color?: string;       // Color name (e.g., "Red", "Blue")
}

export interface CreateMultiSaleRequest {
  items: SaleCartItem[];
  paymentMethod: 'cash' | 'mobile_money';
}

export interface DashboardStats {
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  lowStockCount: number;
  recentSales: Sale[];
  lowStockProducts: Product[];
}
