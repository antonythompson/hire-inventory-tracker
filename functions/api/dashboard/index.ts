import { drizzle } from 'drizzle-orm/d1';
import { eq, sql, lt, and, or } from 'drizzle-orm';
import { orders, orderItems } from '../../../db/schema';
import { verifyAuth } from '../../_middleware';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// GET /api/dashboard - Get dashboard stats
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const auth = await verifyAuth(context.request, context.env.JWT_SECRET);
  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const db = drizzle(context.env.DB);
  const today = new Date().toISOString().split('T')[0];

  // Count items currently out
  const itemsOutResult = await db
    .select({
      total: sql<number>`SUM(${orderItems.quantityCheckedOut} - ${orderItems.quantityCheckedIn})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      or(
        eq(orders.status, 'out'),
        eq(orders.status, 'partial_return')
      )
    )
    .get();

  // Count overdue orders
  const overdueResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(orders)
    .where(
      and(
        or(eq(orders.status, 'out'), eq(orders.status, 'partial_return')),
        lt(orders.expectedReturnDate, today)
      )
    )
    .get();

  // Count active orders (not completed)
  const activeResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(orders)
    .where(
      and(
        sql`${orders.status} != 'completed'`,
        sql`${orders.status} != 'returned'`
      )
    )
    .get();

  // Recent activity (last 10 check-ins/outs)
  const recentCheckouts = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      customerName: orders.customerName,
      timestamp: orderItems.checkedOutAt,
      type: sql<string>`'checkout'`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(sql`${orderItems.checkedOutAt} IS NOT NULL`)
    .orderBy(sql`${orderItems.checkedOutAt} DESC`)
    .limit(5)
    .all();

  const recentCheckins = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      customerName: orders.customerName,
      timestamp: orderItems.checkedInAt,
      type: sql<string>`'checkin'`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(sql`${orderItems.checkedInAt} IS NOT NULL`)
    .orderBy(sql`${orderItems.checkedInAt} DESC`)
    .limit(5)
    .all();

  // Combine and sort recent activity
  const recentActivity = [...recentCheckouts, ...recentCheckins]
    .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
    .slice(0, 10)
    .map((item) => ({
      id: item.id,
      type: item.type as 'checkout' | 'checkin',
      orderName: item.customerName,
      itemCount: 1, // Simplified - could aggregate by order/timestamp
      timestamp: item.timestamp,
    }));

  return Response.json({
    itemsOut: itemsOutResult?.total || 0,
    overdueOrders: overdueResult?.count || 0,
    activeOrders: activeResult?.count || 0,
    recentActivity,
  });
};
