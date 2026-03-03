import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { regionSchema } from '@/lib/validation';

export async function PUT(request, { params }) {
  const { ok, status, supabase } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status });
  }

  const body = await request.json().catch(() => null);
  const parsed = regionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('regions')
    .update(parsed.data)
    .eq('id', Number(params.id))
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ region: data });
}

