# Quick Start Guide - Boutique Inventory & Sales Tracking

## 🚀 Get Started in 5 Minutes

### Step 1: Set Up Supabase (2 minutes)

1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to SQL Editor and run the following SQL to create tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert default categories
INSERT INTO categories (name) VALUES
  ('Clothes'),
  ('Shoes'),
  ('Accessories'),
  ('Bags'),
  ('Jewelry')
ON CONFLICT (name) DO NOTHING;
```

4. Go to Project Settings → API
5. Copy the Project URL and service_role key

### Step 2: Configure Backend (1 minute)

1. Open `backend/.env` file
2. Update these values:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=make-this-a-random-string
```

### Step 3: Install Dependencies & Start Backend (1 minute)

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev
```

Backend runs on http://localhost:5000

### Step 4: Start Frontend (1 minute)

```bash
# Terminal 2 - Frontend
cd ..  # Go back to root
npm install
npm run dev
```

Frontend runs on http://localhost:5173

### Step 5: Create Your First Admin Account

1. Go to http://localhost:5173/register
2. Register with your details
3. Manually update your role to 'admin' in Supabase Table Editor → users table
4. Login at http://localhost:5173/login

## 📝 Optional: Email Notifications

To enable email notifications:

1. For Gmail:
   - Go to your Google Account → Security
   - Enable 2-Step Verification
   - Generate an App Password at https://myaccount.google.com/apppasswords
   
2. Update `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
OWNER_EMAIL=owner@boutique.com
```

## 🎯 Using the Application

### As Admin/Staff:

1. **View Dashboard**: See overview of products, sales, and alerts
2. **Add Products**: 
   - Go to Products → Add Product
   - Fill in name, category, price, stock, and image URL
3. **Record Sales**:
   - Go to Sales → Record Sale
   - Select product and quantity
   - System auto-reduces stock and sends email
4. **View Sales History**:
   - Filter by date range
   - Export to CSV for reporting
5. **Manage Inventory**:
   - Low stock alerts shown on dashboard
   - Edit products to update stock levels

### As Customer:

1. **Browse Products**: View all products on homepage
2. **Search & Filter**: Use search bar and category dropdown
3. **Check Availability**: See stock status and prices

## 🐳 Docker Deployment (Optional)

To run with Docker Compose:

```bash
docker-compose up --build
```

- Frontend: http://localhost
- Backend: http://localhost:5000

## 🔧 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is available
netstat -ano | findstr :5000

# Kill the process if needed
taskkill /PID <PID> /F
```

### Frontend can't connect
- Verify backend is running on port 5000
- Check `VITE_API_URL=http://localhost:5000/api` in `.env`

### Can't register users
- Ensure Supabase tables are created
- Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in `.env`

## 📚 Project Structure

```
boutique-application/
├── src/                      # Frontend source
│   ├── components/          # Reusable UI components
│   ├── context/             # React contexts (Auth)
│   ├── pages/               # Page components
│   ├── services/            # API service layer
│   ├── types/               # TypeScript types
│   └── lib/                 # Utilities
├── backend/                  # Backend source
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth, validation, errors
│   │   ├── database/        # Supabase client
│   │   └── validations/     # Zod schemas
│   └── dist/                # Compiled JavaScript
└── public/                   # Static assets
```

## 🎉 You're All Set!

The application is now running and ready to use. Start by:
1. Adding some products
2. Recording test sales
3. Viewing dashboard analytics
4. Exporting sales reports

For detailed documentation, see README.md
