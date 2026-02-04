import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users (staff who can log in)
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  username: text('username').unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role', { enum: ['admin', 'manager', 'staff'] }).default('staff'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Item catalog (pre-defined hire items)
export const catalogItems = sqliteTable('catalog_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  category: text('category'),
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
});

// Orders
export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  customerEmail: text('customer_email'),
  deliveryAddress: text('delivery_address'),
  eventDate: text('event_date'),
  outDate: text('out_date'),
  expectedReturnDate: text('expected_return_date'),
  actualReturnDate: text('actual_return_date'),
  status: text('status', {
    enum: ['draft', 'confirmed', 'out', 'partial_return', 'returned', 'completed']
  }).default('draft'),
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Order line items
export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  catalogItemId: integer('catalog_item_id').references(() => catalogItems.id),
  customItemName: text('custom_item_name'),
  quantity: integer('quantity').default(1),
  quantityCheckedOut: integer('quantity_checked_out').default(0),
  quantityCheckedIn: integer('quantity_checked_in').default(0),
  checkedOutBy: integer('checked_out_by').references(() => users.id),
  checkedInBy: integer('checked_in_by').references(() => users.id),
  checkedOutAt: text('checked_out_at'),
  checkedInAt: text('checked_in_at'),
  notes: text('notes'),
});

// Type exports for use in the app
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type CatalogItem = typeof catalogItems.$inferSelect;
export type NewCatalogItem = typeof catalogItems.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
