import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { playlistItemUpdateSchema } from '@/lib/validation';

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { ok, status, supabase } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status });
  }

  const body = await request.json().catch(() => null);
  const parsed = playlistItemUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors?.[0]?.message || 'Invalid data' }, { status: 400 });
  }

  const updates = { ...parsed.data };
  if (updates.language_code === '') updates.language_code = null;
  if (updates.starts_at === '') updates.starts_at = null;
  if (updates.ends_at === '') updates.ends_at = null;

  const { data: updated, error: updateError } = await supabase
    .from('playlist_items')
    .update(updates)
    .eq('id', id)
    .select('*, assets(object_path, mime_type)')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: items, error: listError } = await supabase
    .from('playlist_items')
    .select('*, assets(object_path, mime_type)')
    .eq('playlist_id', updated.playlist_id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (listError) {
    return NextResponse.json({ items: [updated] });
  }
  return NextResponse.json({ item: updated, items });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const { ok, status, supabase } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status });
  }

  const { data: existing, error: fetchError } = await supabase
    .from('playlist_items')
    .select('id, playlist_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from('playlist_items')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  const { data: items, error } = await supabase
    .from('playlist_items')
    .select('*, assets(object_path, mime_type)')
    .eq('playlist_id', existing.playlist_id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ items });
}

