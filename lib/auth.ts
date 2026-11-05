import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export type AuthUser = { role: 'developer' };

const cookieName = 'sd_developer';
export const SESSION_COOKIE = cookieName;

function getSessionKey() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error('SUPABASE_SECRET_KEY не настроен');
  return key;
}

function signature(value: string) {
  return createHmac('sha256', getSessionKey())
    .update('sd-session:' + value)
    .digest('hex');
}

export async function passwordMatches(password: string): Promise<boolean> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) return false;

  try {
    const response = await fetch(
      `${url.replace(/\/+$/, '')}/rest/v1/rpc/verify_developer_password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ p_password: password }),
        cache: 'no-store',
      },
    );

    const result = await response.text();

    if (!response.ok) {
      console.error(
        '[developer-auth] Supabase error:',
        response.status,
        result.slice(0, 500),
      );
      return false;
    }

    console.log('[developer-auth] Supabase response:', result);
    return result.trim() === 'true';
  } catch (error) {
    console.error('[developer-auth] Request failed:', error);
    return false;
  }
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
