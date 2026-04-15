# Deployment Guide

This guide explains how to deploy the Boutique Application with:
- **Backend** on Render (Node.js API)
- **Frontend** on Vercel (React/Vite SPA)

## Architecture

```
Frontend (Vercel) → Backend (Render) → Database (Supabase)
```

---

## 1. Backend Deployment on Render

### Prerequisites
- Supabase project with database schema
- M-Pesa API credentials (if using payment features)

### Steps

1. **Connect Repository to Render**
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - **Name**: `boutique-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Region**: Choose closest to your users (e.g., Oregon)

3. **Set Environment Variables**

   Go to the "Environment" tab in Render and add:

   | Variable | Value | Description |
   |----------|-------|-------------|
   | `NODE_ENV` | `production` | Environment |
   | `PORT` | `10000` | Render requires this port |
   | `SUPABASE_URL` | `https://xxx.supabase.co` | Your Supabase URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | `your_key` | Your Supabase service role key |
   | `JWT_SECRET` | `random_secret` | Generate a strong random secret |
   | `JWT_EXPIRES_IN` | `7d` | Token expiration time |
   | `CORS_ORIGINS` | `https://your-app.vercel.app` | Your frontend URL |
   | `MPESA_CONSUMER_KEY` | `your_key` | M-Pesa consumer key |
   | `MPESA_CONSUMER_SECRET` | `your_secret` | M-Pesa consumer secret |
   | `MPESA_SHORTCODE` | `your_code` | M-Pesa shortcode |
   | `MPESA_PASSKEY` | `your_passkey` | M-Pesa passkey |
   | `MPESA_ENVIRONMENT` | `sandbox` | Use `production` for live |
   | `EMAIL_USER` | `your_email` | Email for notifications (optional) |
   | `EMAIL_PASS` | `your_password` | Email password (optional) |

4. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy your backend
   - Copy the backend URL: `https://boutique-backend.onrender.com`

---

## 2. Frontend Deployment on Vercel

### Steps

1. **Install Vercel CLI** (optional)
   ```bash
   npm install -g vercel
   ```

2. **Connect Repository to Vercel**
   - Go to https://vercel.com
   - Click "Add New..." → "Project"
   - Import your GitHub repository

3. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: Leave as root (frontend is at project root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Set Environment Variables**

   Go to Settings → Environment Variables and add:

   | Variable | Value | Description |
   |----------|-------|-------------|
   | `VITE_API_URL` | `https://boutique-backend.onrender.com/api` | Backend API URL |

   > **Important**: Replace `https://boutique-backend.onrender.com` with your actual Render backend URL

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your frontend
   - Copy the frontend URL: `https://boutique-application.vercel.app`

6. **Update CORS in Backend**
   - Go back to Render dashboard
   - Add your Vercel URL to `CORS_ORIGINS` environment variable
   - Redeploy backend service

---

## 3. Verify Deployment

### Health Check
```bash
curl https://boutique-backend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Frontend
- Visit your Vercel URL
- Test login, product management, and other features
- Check browser console for any CORS errors

---

## 4. Troubleshooting

### CORS Errors
- Ensure `CORS_ORIGINS` in Render includes your Vercel URL
- Restart the backend service after updating environment variables

### API Requests Failing
- Verify `VITE_API_URL` in Vercel matches your Render backend URL
- Check that the backend is running and healthy in Render dashboard

### Database Connection Issues
- Verify Supabase credentials in Render environment variables
- Check Supabase dashboard for connection limits

### M-Pesa Not Working
- Ensure all M-Pesa credentials are correct
- Verify `MPESA_ENVIRONMENT` is set correctly (`sandbox` or `production`)

---

## 5. Local Development

### Backend
```bash
cd backend
npm install
cp .env.example .env  # Update with your credentials
npm run dev
```

### Frontend
```bash
npm install
cp .env.example .env.local  # Update with your API URL
npm run dev
```

Update `.env.local` with:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 6. Continuous Deployment

Both Render and Vercel support automatic deployments:
- **Render**: Automatically deploys on push to main branch
- **Vercel**: Automatically deploys on push to main branch

To disable auto-deploy, adjust settings in each platform's dashboard.

---

## Architecture Notes

| Component | Platform | Reason |
|-----------|----------|--------|
| Frontend | Vercel | Fast CDN, perfect for React SPAs |
| Backend | Render | Full Node.js support, easy scaling |
| Database | Supabase | Managed PostgreSQL with realtime features |

This separation ensures:
- ✅ Optimal performance (CDN for static assets)
- ✅ Independent scaling (backend and frontend scale separately)
- ✅ Better security (database credentials only in backend)
- ✅ Easy maintenance (clear separation of concerns)
