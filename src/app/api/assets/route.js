import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { assetInsertSchema } from '@/lib/validation';

export async function POST(request) {
  const { ok, status, supabase, session } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status });
  }

  const body = await request.json().catch(() => null);
  const parsed = assetInsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('assets')
    .insert({
      bucket: parsed.data.bucket,
      object_path: parsed.data.object_path,
      mime_type: parsed.data.mime_type,
      bytes: parsed.data.bytes,
      checksum: parsed.data.checksum ?? null,
      created_by: session.user.id,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ asset: data });
}

