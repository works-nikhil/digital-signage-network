import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { assignmentSchema } from '@/lib/validation';

export async function POST(request) {
  const { ok, status, supabase } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status });
  }

  const body = await request.json().catch(() => null);
  const parsed = assignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const { error: upsertError } = await supabase
    .from('device_playlist_assignments')
    .upsert(
      {
        device_id: parsed.data.device_id,
        playlist_id: parsed.data.playlist_id,
        priority: parsed.data.priority,
        is_active: parsed.data.is_active,
        starts_at: parsed.data.starts_at,
        ends_at: parsed.data.ends_at,
      },
      { onConflict: 'device_id,playlist_id' }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 400 });
  }

  const { data: assignments, error } = await supabase
    .from('device_playlist_assignments')
    .select('*, playlists(name)')
    .eq('device_id', parsed.data.device_id)
    .order('priority', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ assignments });
}

