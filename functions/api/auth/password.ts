import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users } from '../../../db/schema';
import { verifyAuth, hashPassword } from '../../_middleware';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// PUT /api/auth/password - Change own password
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const auth = await verifyAuth(context.request, context.env.JWT_SECRET);
  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await context.request.json() as {
    currentPassword: string;
    newPassword: string;
  };

  if (!body.currentPassword || !body.newPassword) {
    return Response.json({ message: 'Current and new password required' }, { status: 400 });
  }

  if (body.newPassword.length < 6) {
    return Response.json({ message: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const db = drizzle(context.env.DB);

  const user = await db.select().from(users).where(eq(users.id, auth.userId)).get();
  if (!user) {
    return Response.json({ message: 'User not found' }, { status: 404 });
  }

  // Verify current password
  const currentHash = await hashPassword(body.currentPassword);
  if (currentHash !== user.passwordHash) {
    return Response.json({ message: 'Current password is incorrect' }, { status: 400 });
  }

  const newHash = await hashPassword(body.newPassword);

  await db.update(users).set({
    passwordHash: newHash,
  }).where(eq(users.id, auth.userId));

  return Response.json({ success: true });
};
