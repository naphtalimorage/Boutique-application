-- =====================================================
-- M-Pesa Production-Ready Migration
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Add payment_status column to sales table
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled'));

-- Set existing sales to completed
UPDATE sales SET payment_status = 'completed' WHERE status = 'paid' AND payment_status = 'pending';

-- 2. Create mpesa_transactions table for tracking all M-Pesa callbacks
CREATE TABLE IF NOT EXISTS mpesa_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  checkout_request_id VARCHAR(100) UNIQUE NOT NULL,
  merchant_request_id VARCHAR(100),
  mpesa_receipt_number VARCHAR(50),
  phone_number VARCHAR(20),
  transaction_date TIMESTAMP WITH TIME ZONE,
  amount DECIMAL(10, 2),
  result_code VARCHAR(10),
  result_desc TEXT,
  callback_payload JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'timeout')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_mpesa_transactions_checkout_id ON mpesa_transactions(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_transactions_merchant_id ON mpesa_transactions(merchant_request_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_transactions_receipt ON mpesa_transactions(mpesa_receipt_number);
CREATE INDEX IF NOT EXISTS idx_mpesa_transactions_status ON mpesa_transactions(status);
CREATE INDEX IF NOT EXISTS idx_mpesa_transactions_sale_id ON mpesa_transactions(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);

-- 4. Add comments
COMMENT ON COLUMN sales.payment_status IS 'Payment status: pending, completed, failed, cancelled';
COMMENT ON TABLE mpesa_transactions IS 'Tracks all M-Pesa STK Push transactions and callbacks';

-- 5. Create updated_at trigger for mpesa_transactions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mpesa_transactions_updated_at
  BEFORE UPDATE ON mpesa_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
