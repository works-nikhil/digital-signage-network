import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { getServiceSupabaseClient } from '@/lib/supabase/admin';
import { signUrlSchema } from '@/lib/validation';

async function ensureAdmin() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return { ok: false, status: 401 };

  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  if (error || isAdmin !== true) return { ok: false, status: 403 };

  return { ok: true, status: 200 };
}

export async function POST(request) {
  const auth = await ensureAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = signUrlSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const admin = getServiceSupabaseClient();
  const { data, error } = await admin.storage
    .from(parsed.data.bucket)
    .createSignedUrl(parsed.data.object_path, 60);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ url: data.signedUrl });
}

