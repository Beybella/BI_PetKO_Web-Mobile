# 🐾 PetKO Dashboard

A business intelligence dashboard for **PetKO**, a small pet shop. Built with Laravel 12, React 19, Recharts, and Vite — using CSV files as the data layer.

---

## Features

- **📊 Analytics** — Sales trends, category breakdown, day-of-week analysis, top products, and monthly summary with PDF export
- **🧾 POS (Point of Sale)** — Product browser with category filters, cart with discount support, cash/change calculator, and printable receipts. Every transaction is recorded to the sales CSV and deducts stock automatically
- **📦 Inventory Management** — Full CRUD (add, edit, delete, restock) with search and category filter. Stats show total SKUs, units, cost value, and retail value
- **⚠️ Low Stock Alerts** — Critical and warning lists with stock progress bars, units needed, estimated restock cost per item, category breakdown chart, and sort/filter controls
- **📅 Daily Summary** — Today's sales, expenses, net income, and top item at a glance. Includes an expense logger to record fees, utilities, and other costs directly to the CSV
- **🌙 Dark Mode** — Toggle in the top bar

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Backend   | Laravel 12, PHP 8.2               |
| Frontend  | React 19, Vite 7                  |
| Charts    | Recharts                          |
| PDF       | jsPDF                             |
| Styling   | Custom CSS (Plus Jakarta Sans)    |
| Data      | CSV files (no database required)  |

---

## Getting Started

### Requirements
- PHP 8.2+
- Composer
- Node.js + npm

### Setup

```bash
cd petko-dashboard

# Install dependencies
composer install
npm install

# Environment setup
cp .env.example .env
php artisan key:generate
php artisan migrate
```

Place your CSV data files in `storage/app/`:
- `petKO.csv` — sales data (columns: `Date, Item, Amount`)
- `inventoryPetKO.csv` — inventory (columns: `Item_ID, Category, Item_Name, Brand, Unit_Cost, Retail_Price, Stock_Level, Reorder_Level`)

### Run

Open two terminals inside `petko-dashboard`:

```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Backend
php artisan serve
```

Then open [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## Project Structure

```
petko-dashboard/
├── app/Http/Controllers/
│   ├── InventoryController.php   # CRUD + restock
│   ├── SalesController.php       # Analytics summary
│   ├── PosController.php         # Checkout + CSV write
│   └── ExpensesController.php    # Expense logging + daily summary
├── resources/js/components/
│   ├── Analytics.jsx             # Charts + PDF export
│   ├── Inventory.jsx             # Inventory table + modals
│   ├── LowStock.jsx              # Stock alerts
│   ├── POS.jsx                   # Point of sale
│   ├── Cart.jsx                  # Cart + payment
│   ├── Receipt.jsx               # Receipt + print
│   ├── DailySummary.jsx          # Daily recap + expense form
│   └── Dashboard.jsx             # Layout + navigation
└── routes/api.php                # API routes
```

---

## License

MIT
