import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users } from '../../../../db/schema';
import { verifyAuth, hashPassword } from '../../../_middleware';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// PUT /api/users/:id/password - Change user's password (admin or self)
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const auth = await verifyAuth(context.request, context.env.JWT_SECRET);
  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const id = parseInt(context.params.id as string);

  // Only admin or the user themselves can change password
  if (auth.role !== 'admin' && auth.userId !== id) {
    return Response.json({ message: 'Forbidden' }, { status: 403 });
  }

  const body = await context.request.json() as {
    currentPassword?: string;
    newPassword: string;
  };

  if (!body.newPassword) {
    return Response.json({ message: 'New password required' }, { status: 400 });
  }

  if (body.newPassword.length < 6) {
    return Response.json({ message: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const db = drizzle(context.env.DB);

  const user = await db.select().from(users).where(eq(users.id, id)).get();
  if (!user) {
    return Response.json({ message: 'User not found' }, { status: 404 });
  }

  // If changing own password, verify current password
  if (auth.userId === id && auth.role !== 'admin') {
    if (!body.currentPassword) {
      return Response.json({ message: 'Current password required' }, { status: 400 });
    }
    const currentHash = await hashPassword(body.currentPassword);
    if (currentHash !== user.passwordHash) {
      return Response.json({ message: 'Current password is incorrect' }, { status: 400 });
    }
  }

  const newHash = await hashPassword(body.newPassword);

  await db.update(users).set({
    passwordHash: newHash,
  }).where(eq(users.id, id));

  return Response.json({ success: true });
};
