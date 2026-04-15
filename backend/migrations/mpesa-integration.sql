-- ================================================
-- M-PESA INTEGRATION UPDATE
-- Run this in your Supabase SQL Editor
-- ================================================

-- Add M-Pesa transaction columns to sales table
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS mpesa_checkout_request_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS mpesa_merchant_request_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS mpesa_receipt_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS mpesa_phone_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS mpesa_transaction_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);

-- Add index for M-Pesa receipt lookup
CREATE INDEX IF NOT EXISTS idx_sales_mpesa_receipt ON sales(mpesa_receipt_number);
CREATE INDEX IF NOT EXISTS idx_sales_mpesa_checkout ON sales(mpesa_checkout_request_id);
