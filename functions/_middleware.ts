// Auth middleware helper

export type UserRole = 'admin' | 'manager' | 'staff';

export interface AuthPayload {
  userId: number;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export async function verifyAuth(request: Request, secret: string): Promise<AuthPayload | null> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyToken(token, secret);
    return payload;
  } catch {
    return null;
  }
}

async function verifyToken(token: string, secret: string): Promise<AuthPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const message = `${headerB64}.${payloadB64}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signature = Uint8Array.from(atob(signatureB64), (c) => c.charCodeAt(0));
  const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(message));

  if (!valid) {
    throw new Error('Invalid signature');
  }

  const payload = JSON.parse(atob(payloadB64)) as AuthPayload;

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return payload;
}

// Helper to hash passwords (use this when creating users)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
