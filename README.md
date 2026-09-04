# AgroMED Connect — Company Portal

A premium, data-driven company portal for agricultural businesses on AgroMED Connect, built with **React 18 + Vite + Tailwind CSS + Recharts + lucide-react**.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

Build for production:

```bash
npm run build
npm run preview
```

## What's included

- **Dashboard** — business overview, opportunity/request previews, smart insights
- **Farmer Opportunities** — demand-discovery feed with response actions
- **Farmer Requests** — request center with a detail panel and interaction history
- **Solution Center** — bundle products + services + guidance into one offer
- **Products, Orders, Agricultural Services** — core commerce management
- **Market Insights** — regional demand, crop trends, farmer problems, seasonal recommendations (charts via Recharts)
- **Inventory Intelligence** — stock value, turnover, low-stock recommendations
- **Promotions** — targeted campaigns with performance metrics
- **Reviews & Trust** — trust score, trust factors, customer feedback
- **Payments** — balance, pending payments, transaction history
- **Business Analytics** — revenue/order trend charts, export actions
- **Notifications, Company Profile, Verification, Team, Settings, Help Center, Contact Support**

All data lives in `src/data/mockData.js` — swap it for real API calls when you're ready to connect a backend.

## Design system

Tokens are defined in `tailwind.config.js`: a warm paper background, a deep moss-green primary, clay and wheat accents for demand/urgency signals, and Fraunces (serif) paired with Public Sans for an editorial-but-enterprise feel appropriate to an AgriTech B2B product. Shared UI primitives (`Card`, `Badge`, `Button`, `Table`, `StatCard`, etc.) live in `src/components/ui.jsx`.
