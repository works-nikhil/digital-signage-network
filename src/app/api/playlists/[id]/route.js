import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { playlistSchema } from '@/lib/validation';

export async function PUT(request, { params }) {
  const { ok, status, supabase } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status });
  }

  const body = await request.json().catch(() => null);
  const parsed = playlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const update = {
    name: parsed.data.name,
    region_id: parsed.data.region_id ?? null,
    is_active: parsed.data.is_active,
  };

  const { data, error } = await supabase
    .from('playlists')
    .update(update)
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ playlist: data });
}

