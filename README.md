# 💧 AGUAS - Water Sales Management System

A professional web application built with **Next.js 16** for water sales and client management. Designed for adult users with clean, simple interface and powerful billing features.

## ✨ Key Features

- **Simple & Clean UI**: Professional white theme optimized for productivity
- **Billing Management**: Monthly billing schedule by client with customizable billing dates
- **Sales Tracking**: Full CRUD operations for sales, payments, and deliveries
- **Client Management**: Organize clients by sector with billing preferences
- **REST API**: Complete backend API for all operations
- **Database**: SQLite with Prisma ORM
- **Real-time Syncing**: React hooks for automatic data fetching
- **Responsive Design**: Works on desktop and tablets

## 🚀 Technology Stack

- **Framework:** Next.js 16.1.7 with Turbopack
- **Language:** TypeScript 5+
- **Database:** SQLite with Prisma ORM v6
- **Frontend:** React 19 with App Router
- **Styling:** Tailwind CSS v4
- **Node.js:** v24.11.1 (portable)
- **Runtime:** API Routes for backend

## 📋 Prerequisites

- **Node.js:** v24.11.1 or higher
- **npm:** 10.8.0 or higher
- **Git:** For version control

## 🛠️ Initial Setup

### 1. Configure Node.js (Windows Portable)

```powershell
$env:PATH = "$env:USERPROFILE\Downloads\node-v24.11.1-win-x64;" + $env:PATH
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

```bash
npx prisma migrate deploy
npx prisma generate
```

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000)

### Production Mode

```bash
npm run build
npm start
```

## 📁 Project Structure

```
agua/
├── app/                    # Next.js App Router
│   ├── api/               # REST API endpoints
│   │   ├── clients/       # Client management
│   │   ├── payments/      # Payment tracking
│   │   └── sales/         # Sales records
│   ├── page.tsx           # Main dashboard
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── BillingReport.tsx      # Monthly billing schedule
│   ├── SimpleSaleForm.tsx     # Sale entry form
│   ├── SimpleSalesList.tsx    # Sales history
│   └── SimpleClientManager.tsx # Client management
├── lib/                   # Utilities and services
│   ├── api-client.ts      # API client service
│   ├── hooks/useApi.ts    # Custom React hooks
│   ├── prisma.ts          # Prisma singleton
│   ├── types.ts           # TypeScript types
│   └── services/          # Business logic
├── context/               # React Context
├── prisma/               # Database
│   ├── schema.prisma     # Prisma schema
│   └── migrations/       # SQL migrations
└── public/               # Static assets
```

## 📊 Available API Endpoints

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/[id]` - Get client by ID
- `POST /api/clients` - Create new client
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Delete client

### Sales
- `GET /api/sales` - Get all sales
- `GET /api/sales/[id]` - Get sale by ID
- `POST /api/sales` - Create new sale
- `PUT /api/sales/[id]` - Update sale
- `DELETE /api/sales/[id]` - Delete sale

### Payments
- `GET /api/payments` - Get all payments
- `GET /api/payments/[id]` - Get payment by ID
- `POST /api/payments` - Record payment
- `PUT /api/payments/[id]` - Update payment
- `DELETE /api/payments/[id]` - Delete payment

## 🎯 Main Features

### 1. Dashboard Tabs

- **➕ Nueva Venta** - Quick sale entry form
- **📋 Historial** - Sales history with filtering
- **👥 Clientes** - Client management and configuration
- **💳 Facturación** - Monthly billing schedule by client

### 2. Billing System

Each client has a configurable `billingDay` (1-28) for monthly invoicing. The Facturación tab shows:
- Total sales per client per month
- Billing dates organized by client
- Ready-to-invoice totals

### 3. Data Management

- **Soft delete** for clients (marked as inactive)
- **Cascade delete** for sales items
- **Complete audit trail** in database migrations

## 🔧 Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Create production build
npm start         # Start production server
npm run lint      # Run ESLint
```

## 📦 Database Schema

### Core Tables

- **Client** - Customer information + billing date
- **Sale** - Transaction records with items
- **SaleItem** - Line items for each sale
- **Payment** - Payment records
- **Delivery** - Delivery tracking
- **User** - User accounts (future auth)

## 🎨 Design System

- **Colors**: Clean white backgrounds, blue accents, green for positive values
- **Layout**: Professional grid-based layouts
- **Typography**: Clear hierarchy with standard font sizes
- **Components**: Reusable, accessible UI elements
- **Responsive**: Mobile-first approach

## 🔐 Environment Variables

Create `.env.local`:

```env
DATABASE_URL="file:C:/Users/cpontigo/Desktop/Cristobal Cosas/agua/app.db"
```

## 📝 Git Repository

This project is version controlled with Git:

```bash
# View commit history
git log --oneline

# Create new branch
git checkout -b feature/your-feature

# Commit changes
git add .
git commit -m "feat: description of changes"

# Push to remote (when configured)
git push origin feature/your-feature
```

## 🚀 Deployment

### Local Production

```bash
npm run build
npm start
```

Server runs on `http://localhost:3000`

### Cloud Deployment (Future)

- Vercel (recommended for Next.js)
- Railway
- Render
- AWS/Azure/GCP

## 🐛 Troubleshooting

### Port 3000 Already in Use

```powershell
Get-Process -Name node | Stop-Process -Force
```

### Database Errors

```bash
npx prisma migrate deploy --force-reset
```

### Build Failures

```bash
rm -r .next node_modules
npm install
npm run build
```

## 📞 Support

For issues or questions:
1. Check database migrations in `prisma/migrations/`
2. Review API responses in Network tab
3. Check browser console for errors
4. Verify DATABASE_URL in `.env.local`

## 📄 License

Private project 2026

## 👨‍💼 Project Info

- **Purpose**: Water sales management for adult users
- **Status**: Active Development
- **Version**: 1.0.0
- **Last Updated**: March 23, 2026

## 📝 Available Scripts

- `npm run dev` - Development server with hot reload
- `npm run build` - Production build
- `npm start` - Start production server
- `npm run lint` - Run ESLint checks

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript in Next.js](https://nextjs.org/docs/getting-started/typescript)
- [Tailwind CSS](https://tailwindcss.com)
