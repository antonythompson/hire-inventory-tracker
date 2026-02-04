import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users } from '../../../db/schema';
import { verifyAuth, type UserRole } from '../../_middleware';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// GET /api/users/:id - Get single user (admin/manager only)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const auth = await verifyAuth(context.request, context.env.JWT_SECRET);
  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Only admin and manager can view users
  if (auth.role !== 'admin' && auth.role !== 'manager') {
    return Response.json({ message: 'Forbidden' }, { status: 403 });
  }

  const id = parseInt(context.params.id as string);
  const db = drizzle(context.env.DB);

  const user = await db.select({
    id: users.id,
    email: users.email,
    username: users.username,
    name: users.name,
    role: users.role,
    isActive: users.isActive,
    createdAt: users.createdAt,
  }).from(users).where(eq(users.id, id)).get();

  if (!user) {
    return Response.json({ message: 'User not found' }, { status: 404 });
  }

  return Response.json(user);
};

// PUT /api/users/:id - Update user (admin only)
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const auth = await verifyAuth(context.request, context.env.JWT_SECRET);
  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Only admin can edit users
  if (auth.role !== 'admin') {
    return Response.json({ message: 'Forbidden' }, { status: 403 });
  }

  const id = parseInt(context.params.id as string);
  const body = await context.request.json() as Partial<{
    email: string;
    username: string;
    name: string;
    role: UserRole;
    isActive: boolean;
  }>;

  const db = drizzle(context.env.DB);

  // Check if user exists
  const existingUser = await db.select().from(users).where(eq(users.id, id)).get();
  if (!existingUser) {
    return Response.json({ message: 'User not found' }, { status: 404 });
  }

  // Prevent admin from disabling themselves
  if (id === auth.userId && body.isActive === false) {
    return Response.json({ message: 'Cannot disable your own account' }, { status: 400 });
  }

  // Prevent admin from demoting themselves
  if (id === auth.userId && body.role && body.role !== 'admin') {
    return Response.json({ message: 'Cannot change your own role' }, { status: 400 });
  }

  // Check email uniqueness if changing
  if (body.email && body.email !== existingUser.email) {
    const emailExists = await db.select().from(users).where(eq(users.email, body.email)).get();
    if (emailExists) {
      return Response.json({ message: 'Email already in use' }, { status: 400 });
    }
  }

  // Check username uniqueness if changing
  if (body.username && body.username !== existingUser.username) {
    const usernameExists = await db.select().from(users).where(eq(users.username, body.username)).get();
    if (usernameExists) {
      return Response.json({ message: 'Username already in use' }, { status: 400 });
    }
  }

  await db.update(users).set({
    ...(body.email && { email: body.email }),
    ...(body.username !== undefined && { username: body.username || null }),
    ...(body.name && { name: body.name }),
    ...(body.role && { role: body.role }),
    ...(body.isActive !== undefined && { isActive: body.isActive }),
  }).where(eq(users.id, id));

  return Response.json({ success: true });
};

// DELETE /api/users/:id - Delete user (admin only)
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const auth = await verifyAuth(context.request, context.env.JWT_SECRET);
  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Only admin can delete users
  if (auth.role !== 'admin') {
    return Response.json({ message: 'Forbidden' }, { status: 403 });
  }

  const id = parseInt(context.params.id as string);

  // Prevent admin from deleting themselves
  if (id === auth.userId) {
    return Response.json({ message: 'Cannot delete your own account' }, { status: 400 });
  }

  const db = drizzle(context.env.DB);

  const existingUser = await db.select().from(users).where(eq(users.id, id)).get();
  if (!existingUser) {
    return Response.json({ message: 'User not found' }, { status: 404 });
  }

  await db.delete(users).where(eq(users.id, id));

  return Response.json({ success: true });
};
