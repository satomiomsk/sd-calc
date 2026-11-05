import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { cachedSourceTariffs, readSourceTariffRecord, saveSourceTariffs } from '@/lib/sd-source-tariffs';
import { requireAuth } from '@/lib/auth';
import { isSameOrigin } from '@/lib/request-origin';
import { validateTariffs } from '@/lib/tariffs';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return NextResponse.json(await cachedSourceTariffs(), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json(
      { error: 'Не удалось загрузить тарифы исходной базы. Используются сохранённые условия.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
export async function PUT(request: NextRequest) {
  try { await requireAuth(); }
  catch { return NextResponse.json({ error: 'Требуется вход разработчика' }, { status: 401 }); }
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Недопустимый источник' }, { status: 403 });
  let next: unknown;
  try {
    const text = await request.text();
    if (text.length > 64000) throw new Error('Слишком большой запрос');
    next = JSON.parse(text);
    validateTariffs(next);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Проверьте условия' }, { status: 400 });
  }
  try {
    validateTariffs(next);
    const current = await readSourceTariffRecord();
    if (current.snapshot.version !== next.version) {
      return NextResponse.json({ error: 'Условия уже изменены. Загрузите актуальную версию перед сохранением.' }, { status: 409 });
    }
    const snapshot = { ...next, version: current.snapshot.version + 1, updatedAt: new Date().toISOString() };
    await saveSourceTariffs(current.id, snapshot);
    revalidateTag('sd-source-tariffs', { expire: 0 });
    return NextResponse.json(snapshot, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Не удалось сохранить условия. Изменения не подтверждены.' }, { status: 503 });
  }
}
