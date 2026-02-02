import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { orderItems, catalogItems } from '../../../../db/schema';
import { verifyAuth } from '../../../_middleware';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// POST /api/orders/:id/items - Add item to order
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = await verifyAuth(context.request, context.env.JWT_SECRET);
  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const orderId = parseInt(context.params.id as string);
  const body = await context.request.json() as {
    catalogItemId?: number;
    customItemName?: string;
    quantity: number;
  };

  if (!body.catalogItemId && !body.customItemName) {
    return Response.json(
      { message: 'Either catalogItemId or customItemName is required' },
      { status: 400 }
    );
  }

  if (!body.quantity || body.quantity < 1) {
    return Response.json({ message: 'Quantity must be at least 1' }, { status: 400 });
  }

  const db = drizzle(context.env.DB);

  // If using catalog item, verify it exists and get its name
  let itemName: string | null = null;
  if (body.catalogItemId) {
    const catalogItem = await db
      .select()
      .from(catalogItems)
      .where(eq(catalogItems.id, body.catalogItemId))
      .get();

    if (!catalogItem) {
      return Response.json({ message: 'Catalog item not found' }, { status: 404 });
    }
    itemName = catalogItem.name;
  }

  // Insert the order item
  const result = await db.insert(orderItems).values({
    orderId,
    catalogItemId: body.catalogItemId || null,
    customItemName: body.customItemName || null,
    quantity: body.quantity,
    quantityCheckedOut: 0,
    quantityCheckedIn: 0,
  }).returning({ id: orderItems.id });

  return Response.json({ id: result[0].id });
};
