-- Initial schema migration (idempotent)

-- Users (staff who can log in)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Item catalog (pre-defined hire items)
CREATE TABLE IF NOT EXISTS catalog_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  is_active INTEGER DEFAULT 1
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  catalog_item_id INTEGER REFERENCES catalog_items(id),
  custom_item_name TEXT,
  quantity INTEGER DEFAULT 1,
  quantity_checked_out INTEGER DEFAULT 0,
  quantity_checked_in INTEGER DEFAULT 0,
  checked_out_by INTEGER REFERENCES users(id),
  checked_in_by INTEGER REFERENCES users(id),
  checked_out_at TEXT,
  checked_in_at TEXT,
  notes TEXT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_expected_return ON orders(expected_return_date);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
