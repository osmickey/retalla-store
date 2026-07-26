# Retalla — Full-Stack E-Commerce Store

A complete redesign of the Retalla online store: a modern storefront, an admin panel
to manage products and orders, and a Node.js/Express/MongoDB backend. Plain HTML,
CSS and JavaScript on the frontend — no build tools required.

## Project Structure

```
retalla/
├── server/              Node.js + Express + MongoDB backend
│   ├── config/db.js
│   ├── models/           User, Product, Order (Mongoose schemas)
│   ├── controllers/      Route handlers
│   ├── routes/            /api/auth, /api/products, /api/orders
│   ├── middleware/        JWT auth guard, admin guard, error handler
│   ├── seed/seed.js       Sample products + admin user
│   ├── server.js          App entry point (also serves /public)
│   └── .env.example
└── public/               Static frontend (served by Express)
    ├── index.html, shop.html, product.html, cart.html, checkout.html,
    │   login.html, register.html, account.html, order-success.html
    ├── css/style.css
    ├── js/                api.js, auth.js, cart.js, ui.js, and per-page scripts
    └── admin/             Admin panel (login, dashboard, products, orders)
```

## Prerequisites

- [Node.js](https://nodejs.org) 18+
- [MongoDB](https://www.mongodb.com/try/download/community) running locally, or a
  free [MongoDB Atlas](https://www.mongodb.com/atlas) connection string

## Setup

1. Install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Create your `.env` file from the example and fill in real values:
   ```bash
   cp .env.example .env
   ```
   At minimum set `MONGO_URI` (your MongoDB connection string) and `JWT_SECRET`
   (any long random string).

3. Seed sample products and an admin account:
   ```bash
   npm run seed
   ```
   This creates 16 sample products across all categories and an admin user using
   the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env` (defaults:
   `admin@retalla.in` / `Admin@12345` — **change this before deploying**).

4. Start the server:
   ```bash
   npm start
   ```
   or, for auto-reload during development:
   ```bash
   npm run dev
   ```

5. Open the app:
   - Storefront: http://localhost:5000
   - Admin panel: http://localhost:5000/admin

## Features

**Storefront**
- Home page with hero banner, category grid, best sellers, featured products, testimonials
- Category browsing and text search
- Product detail page with image gallery and quantity selector
- Cart (persisted in `localStorage`) and checkout with address + payment method
- Customer login/register (JWT-based) and order history

**Admin Panel**
- Secure admin-only login (same `/api/auth/login` endpoint, gated by `isAdmin`)
- Dashboard with total orders, products, revenue and pending-order stats
- Product management: add, edit, delete, filter/search, feature/best-seller flags
- Order management: view all orders, update status (Pending → Processing → Shipped → Delivered/Cancelled)

**Backend API**
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/products`, `GET /api/products/:id`, `GET /api/products/categories`
- `POST|PUT|DELETE /api/products/:id` (admin only)
- `POST /api/orders`, `GET /api/orders/myorders`, `GET /api/orders/:id`
- `GET /api/orders` (admin), `PUT /api/orders/:id/status` (admin)
- `GET /api/orders/stats/summary` (admin dashboard stats)

## Notes

- Product images in the seed data use placeholder URLs (picsum.photos) — replace
  the `image` field with your real product photo URLs via the admin panel.
- Shipping is free above Rs. 499, otherwise a flat Rs. 49 is charged (see
  `server/controllers/orderController.js`).
- To wipe seeded data: `npm run seed:destroy`.
