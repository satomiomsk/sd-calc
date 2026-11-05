import 'server-only';
import { validateTariffs, type TariffSnapshot } from '@/lib/tariffs';

// Server-only access: the Supabase secret key must never be exposed to the browser.
const TABLE = 'calculator_settings';
function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Supabase не настроен: проверьте серверные переменные окружения');
  return { url, key };
}
function headers(key: string, extra: Record<string,string> = {}) {
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...extra };
}
export async function readSourceTariffRecord(): Promise<{ id: string; snapshot: TariffSnapshot }> {
  const {url,key}=config();
  const response=await fetch(`${url}/rest/v1/${TABLE}?select=id,rules&limit=2`, {
    headers: headers(key), cache:'no-store', signal:AbortSignal.timeout(10000), redirect:'error'
  });
  if(!response.ok) throw new Error(`Supabase read failed (${response.status})`);
  const rows=await response.json();
  if (!Array.isArray(rows) || rows.length !== 1) throw new Error('В calculator_settings должна быть ровно одна запись тарифов');
  const id = rows[0]?.id;
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) {
    throw new Error('В calculator_settings отсутствует корректный UUID записи');
  }
  const raw=rows[0].rules;
  const snapshot:unknown=typeof raw==='string'?JSON.parse(raw):raw;
  validateTariffs(snapshot);
  return {id,snapshot};
}
export async function saveSourceTariffs(recordId:string,snapshot:TariffSnapshot) {
  validateTariffs(snapshot);
  if (!/^[0-9a-f-]{36}$/i.test(recordId)) throw new Error('Некорректный UUID записи Supabase');
  const {url,key}=config();
  const response=await fetch(`${url}/rest/v1/${TABLE}?id=eq.${encodeURIComponent(recordId)}`, {
    method:'PATCH', headers:headers(key,{Prefer:'return=minimal'}),
    body:JSON.stringify({rules:snapshot}), cache:'no-store', signal:AbortSignal.timeout(10000), redirect:'error'
  });
  if(!response.ok) throw new Error(`Supabase write failed (${response.status})`);
}
export async function cachedSourceTariffs() { return (await readSourceTariffRecord()).snapshot; }
