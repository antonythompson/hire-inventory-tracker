import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { catalogItems } from '../../../db/schema';
import { verifyAuth } from '../../_middleware';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// PUT /api/items/:id - Update catalog item (admin/manager only)
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const auth = await verifyAuth(context.request, context.env.JWT_SECRET);
  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Only admin and manager can update catalog items
  if (auth.role !== 'admin' && auth.role !== 'manager') {
    return Response.json({ message: 'Forbidden' }, { status: 403 });
  }

  const id = parseInt(context.params.id as string);
  const body = await context.request.json() as Partial<{
    name: string;
    category: string;
    description: string;
    imageUrl: string;
    isActive: boolean;
  }>;

  const db = drizzle(context.env.DB);

  await db.update(catalogItems).set(body).where(eq(catalogItems.id, id));

  return Response.json({ success: true });
};

// DELETE /api/items/:id - Delete catalog item (admin/manager only)
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const auth = await verifyAuth(context.request, context.env.JWT_SECRET);
  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Only admin and manager can delete catalog items
  if (auth.role !== 'admin' && auth.role !== 'manager') {
    return Response.json({ message: 'Forbidden' }, { status: 403 });
  }

  const id = parseInt(context.params.id as string);
  const db = drizzle(context.env.DB);

  await db.delete(catalogItems).where(eq(catalogItems.id, id));

  return Response.json({ success: true });
};
