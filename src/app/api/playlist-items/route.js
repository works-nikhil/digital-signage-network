import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { playlistItemSchema } from '@/lib/validation';

export async function POST(request) {
  const { ok, status, supabase } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status });
  }

  const body = await request.json().catch(() => null);
  const parsed = playlistItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const insert = {
    playlist_id: parsed.data.playlist_id,
    asset_id: parsed.data.asset_id,
    sort_order: parsed.data.sort_order,
    duration_seconds: parsed.data.duration_seconds,
    is_active: parsed.data.is_active,
    language_code: parsed.data.language_code,
    starts_at: parsed.data.starts_at,
    ends_at: parsed.data.ends_at,
  };

  const { error: insertError } = await supabase.from('playlist_items').insert(insert);
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  const { data: items, error } = await supabase
    .from('playlist_items')
    .select('*, assets(object_path, mime_type)')
    .eq('playlist_id', parsed.data.playlist_id)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ items });
}

