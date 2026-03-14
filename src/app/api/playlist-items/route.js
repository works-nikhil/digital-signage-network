import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { playlistItemSchema, playlistItemsBatchSchema } from '@/lib/validation';

function toInsert(row, playlistId) {
  return {
    playlist_id: playlistId,
    asset_id: row.asset_id,
    sort_order: row.sort_order ?? 0,
    duration_seconds: row.duration_seconds ?? 10,
    is_active: row.is_active ?? true,
    language_code: row.language_code || null,
    starts_at: row.starts_at || null,
    ends_at: row.ends_at || null,
  };
}

export async function POST(request) {
  const { ok, status, supabase } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const batchParsed = playlistItemsBatchSchema.safeParse(body);
  if (batchParsed.success) {
    const { playlist_id, items: rawItems } = batchParsed.data;
    const inserts = rawItems.map((row) => toInsert(row, playlist_id));

    const { error: insertError } = await supabase.from('playlist_items').insert(inserts);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    const { data: items, error } = await supabase
      .from('playlist_items')
      .select('*, assets(object_path, mime_type)')
      .eq('playlist_id', playlist_id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ items });
  }

  const parsed = playlistItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const insert = toInsert(parsed.data, parsed.data.playlist_id);

  const { error: insertError } = await supabase.from('playlist_items').insert(insert);
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  const { data: items, error } = await supabase
    .from('playlist_items')
    .select('*, assets(object_path, mime_type)')
    .eq('playlist_id', parsed.data.playlist_id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ items });
}

