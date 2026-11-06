import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export type AuthUser = { role: 'developer' };

const cookieName = 'sd_developer';
export const SESSION_COOKIE = cookieName;

function getSessionKey() {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.DEVELOPER_PASSWORD;
  if (!key) throw new Error('Настройте SUPABASE_SECRET_KEY или DEVELOPER_PASSWORD');
  return key;
}

function signature(value: string) {
  return createHmac('sha256', getSessionKey())
    .update('sd-session:' + value)
    .digest('hex');
}

export function passwordMatches(password: string): boolean {
  const expected = process.env.DEVELOPER_PASSWORD;
  if (!expected || typeof password !== 'string') return false;

  // Hash both values to fixed-length buffers before comparing in constant time.
  const suppliedDigest = createHash('sha256').update(password, 'utf8').digest();
  const expectedDigest = createHash('sha256').update(expected, 'utf8').digest();
  return timingSafeEqual(suppliedDigest, expectedDigest);
}

export function issueSession() {
  const expires = String(Date.now() + 3600000);
  return `${expires}.${signature(expires)}`;
}

export async function getSession(): Promise<AuthUser | null> {
  const value = (await cookies()).get(cookieName)?.value;
  if (!value) return null;

  const [exp, sig] = value.split('.');

  if (
    !/^\d+$/.test(exp) ||
    Number(exp) < Date.now() ||
    Number(exp) > Date.now() + 3600000 ||
    !sig ||
    !/^[0-9a-f]{64}$/.test(sig)
  ) {
    return null;
  }

  const expected = signature(exp);

  if (
    sig.length !== expected.length ||
    !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }

  return { role: 'developer' };
}

export async function requireAuth() {
  const user = await getSession();

  if (!user) throw new Error('UNAUTHORIZED');

  return user;
}
