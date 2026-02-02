import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users } from '../../../db/schema';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { email, password } = await context.request.json() as { email: string; password: string };

  if (!email || !password) {
    return Response.json({ message: 'Email and password required' }, { status: 400 });
  }

  const db = drizzle(context.env.DB);

  const user = await db.select().from(users).where(eq(users.email, email)).get();

  if (!user) {
    return Response.json({ message: 'Invalid credentials' }, { status: 401 });
  }

  // Simple password verification (in production, use proper hashing like bcrypt)
  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    return Response.json({ message: 'Invalid credentials' }, { status: 401 });
  }

  // Create JWT token
  const token = await createToken(
    { userId: user.id, email: user.email },
    context.env.JWT_SECRET
  );

  return Response.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
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

async function createToken(payload: { userId: number; email: string }, secret: string): Promise<string> {
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
