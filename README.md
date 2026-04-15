# Lin Collection Inventory & Sales Tracking Application

A full-stack, production-ready web application for boutique inventory and sales tracking with real-time insights, seamless product management, and email notifications.

## 🚀 Features

### Customer-Facing Website
- **Product Catalog**: Browse products by category with search functionality
- **Responsive Design**: Mobile-first, modern UI with Tailwind CSS
- **Real-time Stock**: Display stock availability and low stock alerts
- **Category Filtering**: Dynamic categories loaded from database

### Admin & Staff Dashboard
- **Secure Authentication**: JWT-based login with role-based access (Admin/Staff)
- **Dashboard Overview**: Total products, sales, revenue, and low stock alerts
- **Product Management**: Add, edit, delete products with image URLs
- **Inventory Tracking**: Real-time stock monitoring with alerts
- **Sales Recording**: Record sales with optional price override
- **Sales History**: Filter by date, view total revenue
- **CSV Export**: Export sales reports for analysis

### Email Notifications
- **Sale Notifications**: Automatic email on every sale
- **Daily Summary**: Optional daily sales summary emails
- **Low Stock Alerts**: Notifications when products run low

### Security & Performance
- **Password Hashing**: bcrypt for secure password storage
- **JWT Authentication**: Token-based auth with expiration
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Zod schemas for rigorous validation
- **Error Handling**: Comprehensive error responses

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for blazing fast development
- **Tailwind CSS** for styling
- **React Router** for routing
- **Axios** for API calls
- **shadcn/ui** components

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Supabase** (PostgreSQL) database
- **JWT** for authentication
- **bcrypt** for password hashing
- **Nodemailer** for email delivery
- **Zod** for validation

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- SMTP credentials (Gmail, SendGrid, etc.)

## 🚀 Getting Started

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd boutique-application
\`\`\`

### 2. Set Up Supabase

1. Create a Supabase project at https://supabase.com
2. Run the migration script to create tables:

\`\`\`bash
cd backend
npm run migrate
\`\`\`

Or manually execute the SQL from `backend/src/database/migrate.ts` in your Supabase SQL editor.

### 3. Configure Backend

\`\`\`bash
cd backend
cp .env.example .env
\`\`\`

Edit `.env` with your credentials:

\`\`\`env
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
OWNER_EMAIL=owner@boutique.com
FRONTEND_URL=http://localhost:5173
\`\`\`

### 4. Start Backend

\`\`\`bash
cd backend
npm run dev
\`\`\`

Backend runs on `http://localhost:5000`

### 5. Configure Frontend

\`\`\`bash
# In root directory
cp .env.example .env  # if needed
\`\`\`

The `.env` file should contain:
\`\`\`env
VITE_API_URL=http://localhost:5000/api
\`\`\`

### 6. Start Frontend

\`\`\`bash
npm install
npm run dev
\`\`\`

Frontend runs on `http://localhost:5173`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile (requires auth)

### Products
- `GET /api/products` - Get all products (public, supports search & category filter)
- `GET /api/products/:id` - Get product by ID (public)
- `POST /api/products` - Create product (requires auth)
- `PUT /api/products/:id` - Update product (requires auth)
- `DELETE /api/products/:id` - Delete product (admin only)

### Categories
- `GET /api/categories` - Get all categories (public)
- `POST /api/categories` - Create category (admin only)

### Sales
- `POST /api/sales` - Record a sale (requires auth)
- `GET /api/sales` - Get sales history (requires auth, supports date filters)
- `GET /api/sales/export/csv` - Export sales as CSV (requires auth)
- `GET /api/sales/dashboard/stats` - Get dashboard statistics (requires auth)

## 👥 User Roles

### Admin
- Full access to all features
- Can create/edit/delete products and categories
- Can record sales and view sales history
- Can export reports

### Staff
- Can view and edit products
- Can record sales
- Cannot delete products or create categories
- Cannot access admin-only features

## 🐳 Docker Deployment

### Build and Run with Docker Compose

\`\`\`bash
docker-compose up --build
\`\`\`

This will:
- Build frontend and backend images
- Start both services
- Frontend accessible at `http://localhost`
- Backend accessible at `http://localhost:5000`

### Individual Docker Builds

\`\`\`bash
# Frontend
docker build -t boutique-frontend .
docker run -p 80:80 boutique-frontend

# Backend
cd backend
docker build -t boutique-backend .
docker run -p 5000:5000 --env-file .env boutique-backend
\`\`\`

## 📊 Database Schema

### Users
- `id` (UUID, primary key)
- `name` (VARCHAR)
- `email` (VARCHAR, unique)
- `password` (VARCHAR, hashed)
- `role` (VARCHAR: 'admin' or 'staff')
- `created_at`, `updated_at` (TIMESTAMP)

### Categories
- `id` (UUID, primary key)
- `name` (VARCHAR, unique)
- `created_at` (TIMESTAMP)

### Products
- `id` (UUID, primary key)
- `name` (VARCHAR)
- `category_id` (UUID, foreign key)
- `price` (DECIMAL)
- `stock` (INTEGER)
- `image_url` (TEXT)
- `created_at`, `updated_at` (TIMESTAMP)

### Sales
- `id` (UUID, primary key)
- `product_id` (UUID, foreign key)
- `quantity` (INTEGER)
- `total_price` (DECIMAL)
- `created_at` (TIMESTAMP)

## 🔧 Production Deployment

### Frontend (Vercel/Netlify)

\`\`\`bash
npm run build
# Deploy dist/ folder
\`\`\`

### Backend (Railway/Heroku/Render)

1. Set environment variables in your platform
2. Deploy the `backend` folder
3. Ensure Supabase is accessible

### Environment Variables for Production

**Backend:**
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET` (use a strong random string)
- SMTP credentials
- `OWNER_EMAIL`
- `NODE_ENV=production`

**Frontend:**
- `VITE_API_URL=https://your-backend-url.com/api`

## 🎨 UI/UX Features

- **Mobile-First Design**: Fully responsive on all devices
- **Sidebar Navigation**: Collapsible sidebar for dashboard
- **Toast Notifications**: Visual feedback for all actions
- **Loading States**: Skeleton loaders for better UX
- **Error States**: Clear error messages and recovery options
- **Modern Cards**: Clean card-based layout with shadows
- **Color-Coded Badges**: Stock levels, categories, and statuses

## 📈 Bonus Features

✅ **Low Stock Alerts**: Visual indicators and email notifications
✅ **CSV Export**: Download sales reports in CSV format
✅ **Role-Based Permissions**: Different access levels for Admin/Staff
✅ **Date Filtering**: Filter sales by date range
✅ **Search & Filtering**: Product search and category filtering
✅ **Dashboard Analytics**: Real-time statistics and insights

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based authorization
- Input validation with Zod
- Rate limiting on API endpoints
- CORS protection
- Helmet.js security headers
- Environment variable protection

## 🐛 Troubleshooting

### Backend won't start
- Check Supabase credentials in `.env`
- Ensure port 5000 is available
- Run `npm install` in backend directory

### Frontend can't connect to backend
- Verify `VITE_API_URL` in `.env`
- Check CORS settings in backend
- Ensure backend is running

### Email notifications not working
- Verify SMTP credentials
- For Gmail, use App Passwords (not account password)
- Check `OWNER_EMAIL` is set correctly

### Database errors
- Run migration script to create tables
- Check Supabase service role key has proper permissions
- Verify database connection

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues or questions, please open an issue on the repository.

---

Built with ❤️ for boutique owners who need efficient inventory management
