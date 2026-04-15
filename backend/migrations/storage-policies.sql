-- Copy ONLY the code below this line

-- 1. Allow public read access
DROP POLICY IF EXISTS "Allow public read access to product images" ON storage.objects;
CREATE POLICY "Allow public read access to product images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- 2. Allow authenticated users to upload images
DROP POLICY IF EXISTS "Allow authenticated users to upload product images" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- 3. Allow authenticated users to update images
DROP POLICY IF EXISTS "Allow authenticated users to update product images" ON storage.objects;
CREATE POLICY "Allow authenticated users to update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');

-- 4. Allow authenticated users to delete images
DROP POLICY IF EXISTS "Allow authenticated users to delete product images" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- 5. Allow service role to upload/update/delete
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






const data = JSON.stringify({
  "Password": "MTc0Mzc5YmZiMjc5ZjlhYTliZGJjZjE1OGU5N2RkNzFhNDY3Y2QyZTBjODkzMDU5YjEwZjc4ZTZiNzJhZGExZWQyYzkxOTIwMjYwNDE0MDExOTUz",
  "BusinessShortCode": "174379",
  "Timestamp": "20260414011953",
  "Amount": "1",
  "PartyA": "254708374149",
  "PartyB": "174379",
  "TransactionType": "CustomerPayBillOnline",
  "PhoneNumber": "254708374149",
  "TransactionDesc": "Test",
  "AccountReference": "Test",
  "CallBackURL": "https://mydomain.com/mpesa-express-simulate/"
});

const options = {
hostname: "api.safaricom.co.ke",
path: "/YOUR_ENDPOINT",
method: "POST",
headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer <ACCESS_TOKEN>",
    "Content-Length": data.length
}
};

const req = https.request(options, res => {
let body = "";
res.on("data", chunk => {
    body += chunk;
});
res.on("end", () => {
    console.log(body);
});
});

req.on("error", error => {
console.error(error);
});

req.write(data);
req.end();


response= {
  "MerchantRequestID": "1a4f-4863-8aa2-946cae460f74106",
  "CheckoutRequestID": "ws_CO_14042026111954435708374149",
  "ResponseCode": "0",
  "ResponseDescription": "Success. Request accepted for processing",
  "CustomerMessage": "Success. Request accepted for processing"
}


​​also after purchasing the product it does not dynamically reduce the stock
