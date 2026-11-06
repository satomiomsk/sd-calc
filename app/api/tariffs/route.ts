import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_TARIFFS } from '@/lib/tariffs';
import { requireAuth } from '@/lib/auth';
import { isSameOrigin } from '@/lib/request-origin';

export const runtime = 'nodejs';

// The tariff snapshot is maintained in lib/tariffs.ts and shipped with the app.
// Reading it never contacts Supabase.
export async function GET() {
  return NextResponse.json(DEFAULT_TARIFFS, {
    headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
  });
}

// Tariff edits are made in the GitHub source file and published with the site.
// Do not silently write them to Supabase.
export async function PUT(request: NextRequest) {
  try { await requireAuth(); }
  catch { return NextResponse.json({ error: 'Требуется вход разработчика' }, { status: 401 }); }
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Недопустимый источник' }, { status: 403 });
  return NextResponse.json(
    { error: 'Тарифы теперь хранятся в GitHub. Измените lib/tariffs.ts и опубликуйте новую версию сайта.' },
    { status: 409 },
  );
}
