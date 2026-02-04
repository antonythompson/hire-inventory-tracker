import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { orders, orderItems, catalogItems } from '../../../db/schema';
import { verifyAuth } from '../../_middleware';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// GET /api/orders/:id - Get single order with items
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const auth = await verifyAuth(context.request, context.env.JWT_SECRET);
  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const id = parseInt(context.params.id as string);
  const db = drizzle(context.env.DB);

  const order = await db.select().from(orders).where(eq(orders.id, id)).get();

  if (!order) {
    return Response.json({ message: 'Order not found' }, { status: 404 });
  }

  // Get items with catalog item names
  const items = await db
    .select({
      id: orderItems.id,
      catalogItemId: orderItems.catalogItemId,
      customItemName: orderItems.customItemName,
      quantity: orderItems.quantity,
      quantityCheckedOut: orderItems.quantityCheckedOut,
      quantityCheckedIn: orderItems.quantityCheckedIn,
      notes: orderItems.notes,
      catalogItemName: catalogItems.name,
    })
    .from(orderItems)
    .leftJoin(catalogItems, eq(orderItems.catalogItemId, catalogItems.id))
    .where(eq(orderItems.orderId, id))
    .all();

  return Response.json({
    ...order,
    items: items.map((item) => ({
      id: item.id,
      name: item.catalogItemName || item.customItemName || 'Unknown Item',
      quantity: item.quantity,
      quantityCheckedOut: item.quantityCheckedOut,
      quantityCheckedIn: item.quantityCheckedIn,
      notes: item.notes,
    })),
  });
};

// PUT /api/orders/:id - Update order
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const auth = await verifyAuth(context.request, context.env.JWT_SECRET);
  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const id = parseInt(context.params.id as string);
  const body = await context.request.json() as Partial<{
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    deliveryAddress: string;
    eventDate: string;
    expectedReturnDate: string;
    status: string;
    notes: string;
  }>;

  const db = drizzle(context.env.DB);

  await db.update(orders).set({
    ...body,
    updatedAt: new Date().toISOString(),
  }).where(eq(orders.id, id));

  return Response.json({ success: true });
};

// DELETE /api/orders/:id - Delete order (admin/manager only)
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const auth = await verifyAuth(context.request, context.env.JWT_SECRET);
  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Only admin and manager can delete orders
  if (auth.role !== 'admin' && auth.role !== 'manager') {
    return Response.json({ message: 'Forbidden' }, { status: 403 });
  }

  const id = parseInt(context.params.id as string);
  const db = drizzle(context.env.DB);

  // Delete order items first (cascade should handle this but being explicit)
  await db.delete(orderItems).where(eq(orderItems.orderId, id));
  await db.delete(orders).where(eq(orders.id, id));

  return Response.json({ success: true });
};
