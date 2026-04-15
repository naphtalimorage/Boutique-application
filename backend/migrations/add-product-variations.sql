-- Add variations column to products table
-- Structure: [{"size": "M", "stock": 50, "colors": [{"name": "Red", "stock": 20}, {"name": "Blue", "stock": 30}]}, {"size": "L", ...}]
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS variations JSONB DEFAULT '[]'::jsonb;
