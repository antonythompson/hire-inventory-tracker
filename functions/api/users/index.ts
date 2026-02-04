import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users } from '../../../db/schema';
import { verifyAuth, hashPassword, type UserRole } from '../../_middleware';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// GET /api/users - List all users (admin/manager only)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const auth = await verifyAuth(context.request, context.env.JWT_SECRET);
  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Only admin and manager can list users
  if (auth.role !== 'admin' && auth.role !== 'manager') {
    return Response.json({ message: 'Forbidden' }, { status: 403 });
  }

  const db = drizzle(context.env.DB);

  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    username: users.username,
    name: users.name,
    role: users.role,
    isActive: users.isActive,
    createdAt: users.createdAt,
  }).from(users).orderBy(users.name).all();

  return Response.json(allUsers);
};

// POST /api/users - Create user (admin/manager only)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = await verifyAuth(context.request, context.env.JWT_SECRET);
  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Only admin and manager can create users
  if (auth.role !== 'admin' && auth.role !== 'manager') {
    return Response.json({ message: 'Forbidden' }, { status: 403 });
  }

  const body = await context.request.json() as {
    email: string;
    username?: string;
    password: string;
    name: string;
    role: UserRole;
  };

  if (!body.email || !body.password || !body.name || !body.role) {
    return Response.json({ message: 'Email, password, name and role required' }, { status: 400 });
  }

  // Validate role based on creator's role
  const validRoles: UserRole[] = ['admin', 'manager', 'staff'];
  if (!validRoles.includes(body.role)) {
    return Response.json({ message: 'Invalid role' }, { status: 400 });
  }

  // Manager can only create staff
  if (auth.role === 'manager' && body.role !== 'staff') {
    return Response.json({ message: 'Managers can only create staff users' }, { status: 403 });
  }

  const db = drizzle(context.env.DB);

  // Check if email already exists
  const existingEmail = await db.select().from(users).where(eq(users.email, body.email)).get();
  if (existingEmail) {
    return Response.json({ message: 'Email already in use' }, { status: 400 });
  }

  // Check if username already exists (if provided)
  if (body.username) {
    const existingUsername = await db.select().from(users).where(eq(users.username, body.username)).get();
    if (existingUsername) {
      return Response.json({ message: 'Username already in use' }, { status: 400 });
    }
  }

  const passwordHash = await hashPassword(body.password);

  const [newUser] = await db.insert(users).values({
    email: body.email,
    username: body.username || null,
    passwordHash,
    name: body.name,
    role: body.role,
    isActive: true,
  }).returning({ id: users.id });

  return Response.json({ id: newUser.id });
};
