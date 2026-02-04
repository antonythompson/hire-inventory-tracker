import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import { catalogItems } from '../../../db/schema';
import { verifyAuth } from '../../_middleware';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// GET /api/items - List catalog items
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const auth = await verifyAuth(context.request, context.env.JWT_SECRET);
  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const db = drizzle(context.env.DB);

  const items = await db.select().from(catalogItems).orderBy(catalogItems.name).all();

  return Response.json(items);
};

// POST /api/items - Create catalog item (admin/manager only)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = await verifyAuth(context.request, context.env.JWT_SECRET);
  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Only admin and manager can create catalog items
  if (auth.role !== 'admin' && auth.role !== 'manager') {
    return Response.json({ message: 'Forbidden' }, { status: 403 });
  }

  const body = await context.request.json() as {
    name: string;
    category?: string;
    description?: string;
  };

  if (!body.name) {
    return Response.json({ message: 'Name required' }, { status: 400 });
  }

  const db = drizzle(context.env.DB);

  const [item] = await db.insert(catalogItems).values({
    name: body.name,
    category: body.category,
    description: body.description,
    isActive: true,
  }).returning({ id: catalogItems.id });

  return Response.json({ id: item.id });
};
