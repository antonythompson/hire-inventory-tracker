import { drizzle } from 'drizzle-orm/d1';
import { eq, or } from 'drizzle-orm';
import { users } from '../../../db/schema';
import type { UserRole } from '../../_middleware';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { identifier, password } = await context.request.json() as { identifier: string; password: string };

  if (!identifier || !password) {
    return Response.json({ message: 'Email/username and password required' }, { status: 400 });
  }

  const db = drizzle(context.env.DB);

  // Check both email and username
  const user = await db.select().from(users).where(
    or(eq(users.email, identifier), eq(users.username, identifier))
  ).get();

  if (!user) {
    return Response.json({ message: 'Invalid credentials' }, { status: 401 });
  }

  // Check if account is active
  if (!user.isActive) {
    return Response.json({ message: 'Account is disabled' }, { status: 401 });
  }

  // Simple password verification (in production, use proper hashing like bcrypt)
  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    return Response.json({ message: 'Invalid credentials' }, { status: 401 });
  }

  // Create JWT token with role
  const token = await createToken(
    { userId: user.id, email: user.email, role: user.role as UserRole },
    context.env.JWT_SECRET
  );

  return Response.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
    },
  });
};

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Simple hash verification using Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex === hash;
}

async function createToken(payload: { userId: number; email: string; role: UserRole }, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + 60 * 60 * 24 * 7, // 7 days
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header));
  const payloadB64 = btoa(JSON.stringify(tokenPayload));
  const message = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return `${message}.${signatureB64}`;
}
