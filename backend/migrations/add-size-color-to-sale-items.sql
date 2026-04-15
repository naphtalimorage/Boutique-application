-- Add size and color columns to sale_items table
ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS size VARCHAR(50),
  ADD COLUMN IF NOT EXISTS color VARCHAR(50);

-- Add indexes for faster filtering by size/color
CREATE INDEX IF NOT EXISTS idx_sale_items_size ON sale_items(size);
CREATE INDEX IF NOT EXISTS idx_sale_items_color ON sale_items(color);

-- Add a comment to document the columns
COMMENT ON COLUMN sale_items.size IS 'Size of the product sold (e.g., XL, 42)';
COMMENT ON COLUMN sale_items.color IS 'Color of the product sold (e.g., Red, Blue)';
