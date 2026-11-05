import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
export type AuthUser = { role: 'developer' };
const cookieName='sd_developer';
export const SESSION_COOKIE=cookieName;
function signature(value:string) { const key=process.env.DEVELOPER_PASSWORD; if(!key) throw new Error('Пароль разработчика не настроен'); return createHmac('sha256',key).update('sd-session:'+value).digest('hex'); }
export function passwordMatches(password:string) { const expected=process.env.DEVELOPER_PASSWORD; if(!expected) return false; const a=createHmac('sha256',expected).update(password).digest(); const b=createHmac('sha256',expected).update(expected).digest(); return timingSafeEqual(a,b); }
export function issueSession() { const expires=String(Date.now()+3600000);return `${expires}.${signature(expires)}`; }
export async function getSession():Promise<AuthUser|null> { const value=(await cookies()).get(cookieName)?.value; if(!value) return null; const [exp,sig]=value.split('.'); if(!/^\d+$/.test(exp)||Number(exp)<Date.now()||Number(exp)>Date.now()+3600000||!sig||! /^[0-9a-f]{64}$/.test(sig)) return null; const expected=signature(exp); if(sig.length!==expected.length||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected))) return null;return {role:'developer'}; }
export async function requireAuth() { const user=await getSession();if(!user) throw new Error('UNAUTHORIZED');return user; }
