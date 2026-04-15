-- ================================================
-- MULTI-PRODUCT SALES UPDATE
-- Run this in your Supabase SQL Editor
-- ================================================

-- 1. Add payment method and status columns to existing sales table
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mobile_money')),
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'cancelled'));

-- 2. Create sale_items table for multi-product sales
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- 3. Migrate existing single-product sales to sale_items
INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal, created_at)
SELECT 
  s.id,
  s.product_id,
  s.quantity,
  ROUND(s.total_price / s.quantity, 2) as unit_price,
  s.total_price as subtotal,
  s.created_at
FROM sales s
WHERE NOT EXISTS (
  SELECT 1 FROM sale_items si WHERE si.sale_id = s.id
);

-- 4. Mark all existing sales as paid
UPDATE sales SET status = 'paid' WHERE status IS NULL OR status = 'pending';

-- 5. Drop the old product_id, quantity, total_price columns (we now use sale_items)
-- NOTE: We keep them for backwards compatibility but they're no longer used
