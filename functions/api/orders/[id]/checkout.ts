import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import { orders, orderItems } from '../../../../db/schema';
import { verifyAuth } from '../../../_middleware';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// POST /api/orders/:id/checkout - Check out items
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
    return Response.json({ message: 'No items to check out' }, { status: 400 });
  }

  const db = drizzle(context.env.DB);
  const now = new Date().toISOString();

  // Update each item's checked out quantity
  for (const item of body.items) {
    await db.update(orderItems)
      .set({
        quantityCheckedOut: sql`${orderItems.quantityCheckedOut} + ${item.quantity}`,
        checkedOutBy: auth.userId,
        checkedOutAt: now,
      })
      .where(eq(orderItems.id, item.itemId));
  }

  // Update order status to 'out' and set out date
  await db.update(orders)
    .set({
      status: 'out',
      outDate: now,
      updatedAt: now,
    })
    .where(eq(orders.id, orderId));

  return Response.json({ success: true });
};
