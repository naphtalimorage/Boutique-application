# 🔧 M-Pesa Production Setup Guide

## Phase 1: Database Setup

Run this SQL in your **Supabase SQL Editor**:

1. Go to https://supabase.com → Your Project → **SQL Editor**
2. Click **"New Query"**
3. Open file: `backend/migrations/mpesa-production-ready.sql`
4. Copy and paste the SQL, then click **Run**

This will create:
- `payment_status` column in `sales` table
- `mpesa_transactions` table for tracking all M-Pesa callbacks
- Indexes for fast lookups
- Triggers for automatic `updated_at` timestamps

---

## Phase 2: Environment Variables

Update your `backend/.env` file:

```env
# M-Pesa Daraja API Credentials
MPESA_CONSUMER_KEY=your_consumer_key_from_safaricom
MPESA_CONSUMER_SECRET=your_consumer_secret_from_safaricom
MPESA_BUSINESS_SHORTCODE=your_shortcode
MPESA_ACCOUNT_NUMBER=your_business_number
MPESA_PASSKEY=your_live_passkey_from_safaricom  # ← IMPORTANT: Get this from Safaricom portal!
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback  # ← Must be HTTPS and publicly accessible
MPESA_ENVIRONMENT=production  # Change to 'sandbox' for testing
```

### **How to Get Your M-Pesa Credentials:**

1. Go to https://developer.safaricom.co.ke/
2. Create an account and log in
3. Create a new app → Get Consumer Key & Secret
4. Get your Shortcode from Safaricom
5. **Get Passkey:**
   - For **Sandbox**: Available in Safaricom developer portal
   - For **Production**: Sent to your registered email when you go live

### **IMPORTANT Notes:**

- **`MPESA_PASSKEY` is currently a placeholder** - STK Push WILL FAIL until you set the real passkey
- **Callback URL must be HTTPS** and publicly accessible (not localhost or ngrok)
- For testing, use `MPESA_ENVIRONMENT=sandbox` with sandbox credentials

---

## Phase 3: Deployment Checklist

### **Callback URL Requirements:**
- ✅ Must be HTTPS (Safaricom won't call HTTP endpoints)
- ✅ Must be publicly accessible (not localhost)
- ✅ Must return `{ "ResultCode": 0, "ResultDesc": "Accepted" }` to Safaricom
- ✅ Should validate Safaricom IP addresses (done in code)

### **For Production Deployment:**

1. **Deploy backend** to a service with a public HTTPS URL:
   - Railway, Render, AWS, DigitalOcean, etc.
   - Make sure port is accessible

2. **Update callback URL** in `.env`:
   ```env
   MPESA_CALLBACK_URL=https://your-backend-railway.app/api/mpesa/callback
   ```

3. **Test in Sandbox first**:
   ```env
   MPESA_ENVIRONMENT=sandbox
   ```

4. **Go Live** with production credentials:
   ```env
   MPESA_ENVIRONMENT=production
   ```

---

## Phase 4: Testing M-Pesa Integration

### **Sandbox Testing:**

1. Use sandbox credentials from Safaricom developer portal
2. Test phone numbers provided by Safaricom
3. Set `MPESA_ENVIRONMENT=sandbox`
4. Make a test payment through the app

### **Production Testing:**

1. Use real production credentials
2. Set `MPESA_ENVIRONMENT=production`
3. Make a small test payment (Ksh 1-10)
4. Check that:
   - STK Push appears on phone
   - Payment confirmation shows success
   - Sale status updates to "paid"
   - Email notification sent with M-Pesa receipt number
   - Product stock updated

---

## Phase 5: Monitoring & Troubleshooting

### **Check M-Pesa Transaction Status:**

```sql
-- View recent M-Pesa transactions
SELECT * FROM mpesa_transactions 
ORDER BY created_at DESC 
LIMIT 10;

-- View failed payments
SELECT * FROM mpesa_transactions 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

### **Common Issues:**

| Issue | Solution |
|-------|----------|
| STK Push not sent | Check `MPESA_PASSKEY` is correct |
| Callback not received | Verify `MPESA_CALLBACK_URL` is HTTPS and publicly accessible |
| Payment stuck in "pending" | Check Safaricom dashboard, may need manual reconciliation |
| Duplicate transactions | Idempotency is built-in, check `mpesa_transactions` table |

### **Logs to Check:**

Backend console will show:
- `📱 M-Pesa STK Push: 2547XX...` - STK Push initiated
- `📞 M-Pesa Callback: ...` - Callback received from Safaricom
- `✅ M-Pesa Payment Success: ...` - Payment confirmed
- `❌ M-Pesa Payment Failed: ...` - Payment failed

---

## 🎉 You're Ready!

Once you've completed all phases, your M-Pesa integration will be **production-ready** with:

✅ **Reliable callback handling** - Source of truth for payment confirmation  
✅ **Idempotency** - No duplicate transactions  
✅ **IP validation** - Secure callback verification  
✅ **Retry logic** - Resilient to transient errors  
✅ **Proper error handling** - Clear error messages  
✅ **Pending state tracking** - Know exactly what's happening  
✅ **Stock management** - Auto-update on successful payment  
✅ **Email notifications** - With M-Pesa receipt numbers  

Good luck! 🚀
