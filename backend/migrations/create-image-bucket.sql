-- ================================================
-- IMAGE STORAGE BUCKET SETUP
-- Run this in your Supabase SQL Editor
-- ================================================

-- 1. Create the storage bucket (public, no file size limit at bucket level)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow ANYONE to view images (public bucket)
DROP POLICY IF EXISTS "Allow public read access to product images" ON storage.objects;
CREATE POLICY "Allow public read access to product images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- 3. Allow authenticated users to upload images
DROP POLICY IF EXISTS "Allow authenticated users to upload product images" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- 4. Allow authenticated users to update their uploads
DROP POLICY IF EXISTS "Allow authenticated users to update product images" ON storage.objects;
CREATE POLICY "Allow authenticated users to update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');

-- 5. Allow authenticated users to delete their uploads
DROP POLICY IF EXISTS "Allow authenticated users to delete product images" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- 6. Allow anonymous uploads (for service role key usage)
DROP POLICY IF EXISTS "Allow service role to upload product images" ON storage.objects;
CREATE POLICY "Allow service role to upload product images"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow service role to update product images" ON storage.objects;
CREATE POLICY "Allow service role to update product images"
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow service role to delete product images" ON storage.objects;
CREATE POLICY "Allow service role to delete product images"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'product-images');
