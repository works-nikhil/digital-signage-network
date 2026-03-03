import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function DELETE(request, { params }) {
  const { ok, status, supabase } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status });
  }

  // Fetch playlist_id first so we can return updated list
  const { data: existing, error: fetchError } = await supabase
    .from('playlist_items')
    .select('id, playlist_id')
    .eq('id', params.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from('playlist_items')
    .delete()
    .eq('id', params.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  const { data: items, error } = await supabase
    .from('playlist_items')
    .select('*, assets(object_path, mime_type)')
    .eq('playlist_id', existing.playlist_id)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ items });
}

