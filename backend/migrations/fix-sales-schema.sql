ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mobile_money')),
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'cancelled')),
  ADD COLUMN IF NOT EXISTS mpesa_checkout_request_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS mpesa_merchant_request_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS mpesa_receipt_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS mpesa_phone_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS mpesa_transaction_date TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS sale_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_mpesa_receipt ON sales(mpesa_receipt_number);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method);

UPDATE sales SET total_amount = total_price WHERE total_amount IS NULL AND total_price IS NOT NULL;
UPDATE sales SET payment_method = 'cash' WHERE payment_method IS NULL;
UPDATE sales SET status = 'paid' WHERE status IS NULL;

INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal, created_at)
SELECT 
  s.id,
  s.product_id,
  s.quantity,
  ROUND(s.total_price::numeric / GREATEST(s.quantity, 1), 2),
  s.total_price,
  s.created_at
FROM sales s
WHERE s.product_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM sale_items si WHERE si.sale_id = s.id);
