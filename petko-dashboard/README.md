# 🐾 PetKO Dashboard

A full-stack business intelligence and operations system for **PetKO**, a small pet shop. Built with Laravel 12, React 19, and CSV-based data storage.

---

## Features

### 🔐 Authentication & Access Control
- Login page with email and password
- Role-based access control (RBAC) — **Admin** and **Staff** roles
- Session auto-logout after 1 hour of inactivity
- Auto-redirect to login on expired token (401 handling)
- Change password from the Users page
- Token-based authentication via Laravel Sanctum

### 📊 Analytics (Admin only)
- KPI cards: Total Sales, Total Transactions, Avg Daily Sales, Top Product
- Daily Sales trend — area chart with gradient fill
- Sales by Category — donut chart with percentage breakdown
- Sales by Day of Week — bar chart highlighting the busiest day
- Top Products — inline progress bar ranking
- Monthly Summary table — Revenue, Expenses, Net Income, Transactions
- Month filter buttons to drill down by period
- Low Stock alert strip showing critical items
- Export to PDF — Sales Report (KPIs, monthly summary, top products)
- Export to PDF — Inventory Report (full stock list with status)

### 🧾 POS — Point of Sale (Admin + Staff)
- Product browser with category tabs (Cat Food, Dog Food, Hygiene, Medical, Accessories, Treats/Snacks)
- Search by product name or brand
- Category icons for quick visual scanning
- In-cart badge showing quantity already added
- Out-of-stock products are disabled automatically
- Cart with quantity controls and editable price per item
- Discount field (peso amount deducted from total)
- Cash received input with live change calculation
- "Still needed" indicator if cash is insufficient
- Checkout writes each sale to `petKO.csv` and deducts stock from inventory instantly
- Printable receipt with transaction reference number, itemized list, discount, and change
- Print receipt opens a clean print-ready window

### 📦 Inventory Management (Admin + Staff)
- Full inventory table with ID, Category, Item Name, Brand, Cost, Retail Price, Profit Margin %, Stock, Reorder Level, Status
- Profit margin color-coded: green (≥30%), yellow (≥15%), red (<15%)
- Status badges: OK, Low, Reorder, Out
- Search by name or brand
- Filter by category
- Pagination (15 items per page)
- Add new item (Admin only) — saves directly to CSV
- Edit existing item (Admin only) — pre-filled form
- Delete item with confirmation (Admin only)
- Restock — add stock quantity (Admin + Staff)
- Summary cards: Total SKUs, Total Units, Cost Value, Retail Value

### ⚠️ Low Stock Alerts (Admin + Staff)
- KPI cards: Critical count, Warning count, Well Stocked count, Estimated Restock Cost
- Category breakdown bar chart showing which categories have the most critical items
- Sort by: Most Critical, Restock Cost, Name A–Z, Category
- Filter by category
- Per-item stock progress bar (stock vs reorder level)
- Units needed to reach 2× reorder level
- Estimated cost to restock each item

### 📅 Daily Summary (Admin only)
- Today's total sales, total expenses, net income, and top-selling item
- Today's sales list — all transactions recorded today
- Today's expenses list — all expenses logged today
- Log Expense form — category, description, and amount written directly to CSV

### 👥 User Management (Admin only)
- View all user accounts with name, email, role, and creation date
- Add new user — name, email, password, role (Admin or Staff)
- Remove user with confirmation (cannot delete own account)
- Change password form for the logged-in user

### 🌙 Dark Mode
- Toggle in the top bar (sun/moon icon)
- Persists across sessions via localStorage

### 🕐 Live Clock
- Real-time date and time displayed in the top bar, updates every second

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Backend   | Laravel 12, PHP 8.2               |
| Auth      | Laravel Sanctum (token-based)     |
| Frontend  | React 19, Vite 7                  |
| Charts    | Recharts                          |
| PDF       | jsPDF                             |
| Styling   | Custom CSS, Plus Jakarta Sans     |
| Data      | CSV files (no database for sales) |
| DB        | SQLite (users + sessions only)    |

---

## Default Accounts

| Role  | Email              | Password   |
|-------|--------------------|------------|
| Admin | admin@petko.com    | petko2026  |
| Staff | staff@petko.com    | staff2026  |

---

## Role Permissions

| Feature              | Admin | Staff |
|----------------------|-------|-------|
| Analytics            | ✅    | ❌    |
| POS                  | ✅    | ✅    |
| Inventory (view)     | ✅    | ✅    |
| Inventory (add/edit/delete) | ✅ | ❌ |
| Restock              | ✅    | ✅    |
| Low Stock            | ✅    | ✅    |
| Daily Summary        | ✅    | ❌    |
| User Management      | ✅    | ❌    |
| Export PDF           | ✅    | ❌    |

---

## Getting Started

### Requirements
- PHP 8.2+
- Composer
- Node.js + npm

### Setup

```bash
cd petko-dashboard

composer install
npm install

cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
```

Place your CSV data files in `storage/app/`:
- `petKO.csv` — sales & expenses (columns: `Date, Item, Amount`)
- `inventoryPetKO.csv` — inventory (columns: `Item_ID, Category, Item_Name, Brand, Unit_Cost, Retail_Price, Stock_Level, Reorder_Level`)

> The inventory CSV must have a header row. If it doesn't, prepend:
> `Item_ID,Category,Item_Name,Brand,Unit_Cost,Retail_Price,Stock_Level,Reorder_Level`

### Run

Open two terminals inside `petko-dashboard`:

```bash
# Terminal 1 — Frontend (Vite)
npm run dev

# Terminal 2 — Backend (Laravel)
php artisan serve
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## Project Structure

```
petko-dashboard/
├── app/Http/Controllers/
│   ├── AuthController.php        # Login, logout, change password, user management
│   ├── InventoryController.php   # CRUD + restock
│   ├── SalesController.php       # Analytics summary
│   ├── PosController.php         # Checkout, CSV write, stock deduction
│   └── ExpensesController.php    # Expense logging + daily summary
├── resources/js/
│   ├── context/AuthContext.jsx   # Auth state, session timeout, fetch interceptor
│   ├── components/
│   │   ├── App.jsx               # Auth gate (login vs dashboard)
│   │   ├── Dashboard.jsx         # Layout, sidebar, nav, dark mode, clock
│   │   ├── Login.jsx             # Login page
│   │   ├── Analytics.jsx         # Charts + PDF export
│   │   ├── Inventory.jsx         # Inventory table + modals
│   │   ├── LowStock.jsx          # Stock alerts + restock estimates
│   │   ├── POS.jsx               # Point of sale product browser
│   │   ├── Cart.jsx              # Cart + payment section
│   │   ├── Receipt.jsx           # Receipt + print
│   │   ├── DailySummary.jsx      # Daily recap + expense form
│   │   └── UserManagement.jsx    # User CRUD + change password
│   └── hooks/useApi.js           # Authenticated fetch hook
└── routes/api.php                # All API routes with auth + role middleware
```

---

## License

MIT
