-- ================================================
-- Boutique Application Database Schema
-- Run this in your Supabase SQL Editor
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- TABLES
-- ================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table (main categories like Clothes, Shoes, Accessories, etc.)
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subcategories table (sub-categories like T-shirts, Jeans, Trousers, Shorts for Clothes, etc.)
CREATE TABLE IF NOT EXISTS subcategories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, name)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sub_category_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  gender VARCHAR(50) DEFAULT 'unisex' CHECK (gender IN ('men', 'women', 'unisex', 'kids')),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- INDEXES
-- ================================================

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sub_category_id ON products(sub_category_id);
CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ================================================
-- TRIGGERS
-- ================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- SEED DATA
-- ================================================

-- Insert default categories
INSERT INTO categories (name) VALUES
  ('Clothes'),
  ('Shoes'),
  ('Accessories'),
  ('Bags'),
  ('Jewelry')
ON CONFLICT (name) DO NOTHING;

-- Insert default subcategories for Clothes
INSERT INTO subcategories (name, category_id) 
SELECT name, id FROM categories WHERE name = 'Clothes'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO subcategories (name, category_id)
SELECT subcat.name, cat.id
FROM categories cat
CROSS JOIN LATERAL (
  VALUES ('T-Shirts'), ('Shirts'), ('Jeans'), ('Trousers'), ('Shorts'), ('Dresses'), ('Skirts'), ('Jackets'), ('Hoodies'), ('Blazers')
) AS subcat(name)
WHERE cat.name = 'Clothes'
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert default subcategories for Shoes
INSERT INTO subcategories (name, category_id)
SELECT subcat.name, cat.id
FROM categories cat
CROSS JOIN LATERAL (
  VALUES ('Sneakers'), ('Formal Shoes'), ('Sandals'), ('Boots'), ('Heels'), ('Flats'), ('Loafers'), ('Athletic Shoes')
) AS subcat(name)
WHERE cat.name = 'Shoes'
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert default subcategories for Accessories
INSERT INTO subcategories (name, category_id)
SELECT subcat.name, cat.id
FROM categories cat
CROSS JOIN LATERAL (
  VALUES ('Belts'), ('Watches'), ('Sunglasses'), ('Hats'), ('Scarves'), ('Gloves'), ('Ties'), ('Wallets')
) AS subcat(name)
WHERE cat.name = 'Accessories'
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert default subcategories for Bags
INSERT INTO subcategories (name, category_id)
SELECT subcat.name, cat.id
FROM categories cat
CROSS JOIN LATERAL (
  VALUES ('Handbags'), ('Backpacks'), ('Crossbody Bags'), ('Wallet & Clutches'), ('Travel Bags'), ('Laptop Bags')
) AS subcat(name)
WHERE cat.name = 'Bags'
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert default subcategories for Jewelry
INSERT INTO subcategories (name, category_id)
SELECT subcat.name, cat.id
FROM categories cat
CROSS JOIN LATERAL (
  VALUES ('Rings'), ('Necklaces'), ('Earrings'), ('Bracelets'), ('Anklets'), ('Brooches')
) AS subcat(name)
WHERE cat.name = 'Jewelry'
ON CONFLICT (category_id, name) DO NOTHING;

-- ================================================
-- SUPABASE STORAGE BUCKET
-- ================================================

-- Create a public bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- Allow anyone to view product images
CREATE POLICY "Allow public read access to product images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- Allow authenticated users to update/delete their uploads
CREATE POLICY "Allow authenticated users to update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated users to delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Function to hash password (run this separately after inserting user)
-- You'll need to hash passwords in your application using bcrypt

-- ================================================
-- NOTES
-- ================================================
-- 1. After running this script, create an admin user through the registration API
-- 2. Update the user's role to 'admin' in the Supabase Table Editor
-- 3. All timestamps are automatically managed
-- 4. Foreign keys ensure data integrity
