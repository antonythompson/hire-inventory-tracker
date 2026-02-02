import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import { orders, orderItems } from '../../../../db/schema';
import { verifyAuth } from '../../../_middleware';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// POST /api/orders/:id/checkin - Check in items
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = await verifyAuth(context.request, context.env.JWT_SECRET);
  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const orderId = parseInt(context.params.id as string);
  const body = await context.request.json() as {
    items: Array<{ itemId: number; quantity: number }>;
  };

  if (!body.items || body.items.length === 0) {
    return Response.json({ message: 'No items to check in' }, { status: 400 });
  }

  const db = drizzle(context.env.DB);
  const now = new Date().toISOString();

  // Update each item's checked in quantity
  for (const item of body.items) {
    await db.update(orderItems)
      .set({
        quantityCheckedIn: sql`${orderItems.quantityCheckedIn} + ${item.quantity}`,
        checkedInBy: auth.userId,
        checkedInAt: now,
      })
      .where(eq(orderItems.id, item.itemId));
  }

  // Check if all items are fully returned
  const allItems = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId)).all();

  const allReturned = allItems.every(
    (item) => (item.quantityCheckedIn || 0) >= (item.quantityCheckedOut || 0)
  );

  const partialReturn = allItems.some(
    (item) => (item.quantityCheckedIn || 0) > 0 && (item.quantityCheckedIn || 0) < (item.quantityCheckedOut || 0)
  );

  // Update order status
  let newStatus: string;
  if (allReturned) {
    newStatus = 'returned';
  } else if (partialReturn || body.items.length > 0) {
    newStatus = 'partial_return';
  } else {
    newStatus = 'out';
  }

  await db.update(orders)
    .set({
      status: newStatus,
      actualReturnDate: allReturned ? now : null,
      updatedAt: now,
    })
    .where(eq(orders.id, orderId));

  return Response.json({ success: true });
};
