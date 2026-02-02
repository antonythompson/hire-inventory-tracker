# Fanfare Inventory Tracker - Implementation Plan

## Overview
PWA for tracking hire equipment (chairs, tables, etc.) going out and returning. Built on Cloudflare's free tier.

## Tech Stack
| Layer | Technology |
|-------|------------|
| Hosting | Cloudflare Pages (static) + Workers (API) |
| Database | D1 (SQLite) |
| ORM | Drizzle |
| Frontend | Preact + Tailwind CSS |
| Auth | JWT tokens, password login |
| PWA | Service worker, manifest.json |

## Project Structure
```
fanfare-inventory-tracker/
├── public/                    # Static assets (copied to dist)
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # PWA icons
├── src/
│   ├── components/            # Preact components
│   │   ├── App.tsx
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Orders.tsx
│   │   ├── OrderDetail.tsx
│   │   ├── ItemCatalog.tsx
│   │   └── ChecklistModal.tsx
│   ├── api/                   # API client functions
│   ├── hooks/                 # Custom Preact hooks
│   ├── index.tsx              # Entry point
│   └── sw.ts                  # Service worker
├── functions/                 # Cloudflare Workers (API)
│   └── api/
│       ├── auth/
│       │   ├── login.ts
│       │   └── me.ts
│       ├── orders/
│       │   ├── index.ts       # GET all, POST new
│       │   └── [id].ts        # GET/PUT/DELETE single
│       ├── items/
│       │   └── index.ts       # Catalog CRUD
│       └── dashboard/
│           └── index.ts       # Dashboard stats
├── db/
│   ├── schema.ts              # Drizzle schema
│   └── migrations/            # SQL migrations
├── wrangler.toml              # Cloudflare config
├── vite.config.ts             # Build config
├── tailwind.config.js
├── package.json
└── tsconfig.json
```

## Database Schema

```sql
-- Users (staff who log in)
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Item catalog (pre-defined items)
CREATE TABLE catalog_items (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  is_active INTEGER DEFAULT 1
);

-- Orders
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  delivery_address TEXT,
  event_date TEXT,
  out_date TEXT,
  expected_return_date TEXT,
  actual_return_date TEXT,
  status TEXT CHECK(status IN ('draft', 'confirmed', 'out', 'partial_return', 'returned', 'completed')) DEFAULT 'draft',
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Order line items
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  catalog_item_id INTEGER REFERENCES catalog_items(id),
  custom_item_name TEXT,              -- For non-catalog items
  quantity INTEGER DEFAULT 1,
  quantity_checked_out INTEGER DEFAULT 0,
  quantity_checked_in INTEGER DEFAULT 0,
  checked_out_by INTEGER REFERENCES users(id),
  checked_in_by INTEGER REFERENCES users(id),
  checked_out_at TEXT,
  checked_in_at TEXT,
  notes TEXT
);
```

## Core Features

### 1. Authentication
- Login with email/password
- JWT stored in localStorage
- Auto-refresh on app load
- Logout clears token

### 2. Dashboard
- Items currently out (count by category)
- Overdue returns (expected_return_date < today, status = 'out')
- Recent activity (last 10 check-ins/outs)
- Quick links to active orders

### 3. Orders
- Create order with customer info (name, phone, address)
- Add items from catalog OR type custom item name
- Set event date, expected return date
- Order statuses: draft → confirmed → out → returned → completed

### 4. Check Out Flow
- Select order → "Check Out" button
- Modal shows all items with quantities
- "Check All Out" button (bulk) or individual checkboxes
- Records who checked out and when
- Updates order status to 'out'

### 5. Check In Flow
- Select order → "Check In" button
- Shows items with checked-out quantities
- "Check All In" button or individual
- Partial returns supported (status = 'partial_return')
- Records who checked in and when

### 6. Item Catalog
- CRUD for catalog items
- Categories (Furniture, Linen, Decor, etc.)
- Active/inactive toggle

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login, returns JWT |
| GET | /api/auth/me | Get current user |
| GET | /api/dashboard | Dashboard stats |
| GET | /api/orders | List orders (with filters) |
| POST | /api/orders | Create order |
| GET | /api/orders/:id | Get order with items |
| PUT | /api/orders/:id | Update order |
| DELETE | /api/orders/:id | Delete order |
| POST | /api/orders/:id/checkout | Bulk/individual checkout |
| POST | /api/orders/:id/checkin | Bulk/individual checkin |
| GET | /api/items | List catalog items |
| POST | /api/items | Create catalog item |
| PUT | /api/items/:id | Update catalog item |
| DELETE | /api/items/:id | Delete catalog item |

## PWA Features
- Offline-capable (service worker caches app shell)
- Install prompt on mobile
- App icons for home screen
- Works full-screen on mobile

## Implementation Phases

### Phase 1: Project Setup
- [ ] Create project directory and git repo
- [ ] Initialize wrangler project
- [ ] Set up Vite + Preact + Tailwind
- [ ] Configure D1 database
- [ ] Set up Drizzle ORM and schema

### Phase 2: Authentication
- [ ] Create users table and seed initial user
- [ ] Implement login endpoint with JWT
- [ ] Build login UI component
- [ ] Add auth middleware for protected routes
- [ ] Implement logout

### Phase 3: Item Catalog
- [ ] Implement catalog CRUD API
- [ ] Build catalog management UI
- [ ] Seed initial items (chairs, tables, covers, etc.)

### Phase 4: Orders
- [ ] Implement orders CRUD API
- [ ] Build order list view
- [ ] Build create/edit order form
- [ ] Build order detail view with items

### Phase 5: Check In/Out
- [ ] Implement checkout endpoint
- [ ] Implement checkin endpoint
- [ ] Build checkout modal UI
- [ ] Build checkin modal UI
- [ ] Handle partial returns

### Phase 6: Dashboard
- [ ] Implement dashboard stats endpoint
- [ ] Build dashboard UI
- [ ] Show overdue items
- [ ] Show recent activity

### Phase 7: PWA & Polish
- [ ] Add service worker
- [ ] Create manifest.json and icons
- [ ] Test offline functionality
- [ ] Mobile UI refinements
- [ ] Deploy to Cloudflare Pages

## Verification / Testing
1. **Local development:** `wrangler pages dev` to test locally
2. **Auth flow:** Login → verify token stored → protected routes work
3. **Order flow:** Create order → add items → check out → check in
4. **Dashboard:** Verify stats match actual data
5. **PWA:** Test install on mobile device, verify offline works
6. **Deploy:** Push to Cloudflare, verify production works

## Notes
- 2-3 users only, manually created in DB
- Basic customer info on orders (no separate customer database)
- Privacy: add delete order capability for GDPR compliance
- Free tier limits: 100k requests/day, 100k D1 writes/day (plenty for this use case)
