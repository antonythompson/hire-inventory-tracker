import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users } from '../../../db/schema';
import { verifyAuth } from '../../_middleware';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const auth = await verifyAuth(context.request, context.env.JWT_SECRET);

  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const db = drizzle(context.env.DB);

  const user = await db.select({
    id: users.id,
    email: users.email,
    username: users.username,
    name: users.name,
    role: users.role,
  }).from(users).where(eq(users.id, auth.userId)).get();

  if (!user) {
    return Response.json({ message: 'User not found' }, { status: 404 });
  }

  return Response.json(user);
};
