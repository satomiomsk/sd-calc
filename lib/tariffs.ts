import type { Operation, Category } from "./calculator";
export type TariffRule = { operation: Operation; category: Category; from: number; to: number | null; fixed: number; percent: number; minimum: number };
export type TariffSnapshot = { rules: TariffRule[]; updatedAt: string | null; version: number };
const row = (operation: Operation, category: Category, from: number, to: number | null, fixed: number, percent = 0, minimum = 0): TariffRule => ({ operation, category, from, to, fixed, percent, minimum });
export const DEFAULT_TARIFFS: TariffSnapshot = { updatedAt: null, version: 0, rules: [
 row('sale','apartment',0,999999.99,60000), row('sale','apartment',1000000,null,50000,1.5),
 row('sale','country',0,499999,55000), row('sale','country',500000,999999,70000), row('sale','country',1000000,null,55000,1.5),
 row('sale','garage',0,499999,30000), row('sale','garage',500000,null,30000,1.5), row('sale','commercial',0,null,59000,2.5),
 row('purchase','apartment',0,999999.99,34000), row('purchase','apartment',1000000,null,24000,1),
 row('purchase','country',0,499999,40000), row('purchase','country',500000,999999,50000), row('purchase','country',1000000,null,35000,1,60000),
 row('purchase','garage',0,499999,27000), row('purchase','garage',500000,null,27000,1), row('purchase','commercial',0,null,0,1.5), row('purchase','land',0,null,25000,1),
] };
export const CATEGORY_LABELS: Record<Category,string> = { apartment:'Квартира / жилое помещение', country:'Загородная недвижимость', garage:'Гараж / парковочное место', commercial:'Коммерческая недвижимость', land:'Земельный участок с ипотекой на строительство' };
export function validateTariffs(value: unknown): asserts value is TariffSnapshot {
 if (!value || typeof value !== 'object') throw new Error('Некорректные условия');
 const v = value as TariffSnapshot;
 if (!Number.isSafeInteger(v.version) || v.version < 0 || !(v.updatedAt === null || (typeof v.updatedAt === 'string' && Number.isFinite(Date.parse(v.updatedAt)))) || !Array.isArray(v.rules) || v.rules.length < 9 || v.rules.length > 100) throw new Error('Некорректный формат тарифов');
 for (const r of v.rules) {
  if (!r || !['sale','purchase'].includes(r.operation) || !Object.hasOwn(CATEGORY_LABELS,r.category) || (r.operation==='sale' && r.category==='land')) throw new Error('Неизвестный тип тарифа');
  for (const n of [r.from,r.fixed,r.percent,r.minimum,...(r.to===null?[]:[r.to])]) if (typeof n !== 'number' || !Number.isFinite(n) || n<0 || n>Number.MAX_SAFE_INTEGER) throw new Error('Значения должны быть неотрицательными числами');
  if (r.percent>100 || (r.to!==null && r.to<r.from)) throw new Error('Проверьте процент и границы стоимости');
 }
 for (const op of ['sale','purchase'] as const) for (const cat of Object.keys(CATEGORY_LABELS) as Category[]) {
  if(op==='sale' && cat==='land') continue;
  const rows=v.rules.filter(r=>r.operation===op && r.category===cat).sort((a,b)=>a.from-b.from);
  if (!rows.length) throw new Error('Нужен тариф для каждого типа недвижимости');
  for(let i=1;i<rows.length;i++) if(rows[i-1].to===null || rows[i].from<=rows[i-1].to!) throw new Error('Диапазоны стоимости не должны пересекаться');
 }
}
