import { drizzle } from 'drizzle-orm/d1';
import { eq, sql, and, or, ne } from 'drizzle-orm';
import { orders, orderItems, catalogItems } from '../../../db/schema';
import { verifyAuth } from '../../_middleware';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// GET /api/orders - List orders
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const auth = await verifyAuth(context.request, context.env.JWT_SECRET);
  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(context.request.url);
  const status = url.searchParams.get('status');

  const db = drizzle(context.env.DB);

  let query = db.select({
    id: orders.id,
    customerName: orders.customerName,
    status: orders.status,
    eventDate: orders.eventDate,
    expectedReturnDate: orders.expectedReturnDate,
    itemCount: sql<number>`(SELECT COUNT(*) FROM order_items WHERE order_id = ${orders.id})`,
  }).from(orders);

  if (status === 'active') {
    query = query.where(
      and(
        ne(orders.status, 'completed'),
        ne(orders.status, 'returned')
      )
    ) as typeof query;
  } else if (status && status !== 'all') {
    query = query.where(eq(orders.status, status)) as typeof query;
  }

  const result = await query.orderBy(sql`${orders.createdAt} DESC`).all();

  return Response.json(result);
};

// POST /api/orders - Create order
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = await verifyAuth(context.request, context.env.JWT_SECRET);
  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await context.request.json() as {
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    deliveryAddress?: string;
    eventDate?: string;
    expectedReturnDate?: string;
    notes?: string;
    items?: Array<{
      catalogItemId?: number;
      customItemName?: string;
      quantity: number;
    }>;
  };

  if (!body.customerName) {
    return Response.json({ message: 'Customer name required' }, { status: 400 });
  }

  const db = drizzle(context.env.DB);

  const [order] = await db.insert(orders).values({
    customerName: body.customerName,
    customerPhone: body.customerPhone,
    customerEmail: body.customerEmail,
    deliveryAddress: body.deliveryAddress,
    eventDate: body.eventDate,
    expectedReturnDate: body.expectedReturnDate,
    notes: body.notes,
    status: 'draft',
    createdBy: auth.userId,
  }).returning({ id: orders.id });

  // Add items if provided
  if (body.items && body.items.length > 0) {
    await db.insert(orderItems).values(
      body.items.map((item) => ({
        orderId: order.id,
        catalogItemId: item.catalogItemId,
        customItemName: item.customItemName,
        quantity: item.quantity,
      }))
    );
  }

  return Response.json({ id: order.id });
};
