import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { getServiceSupabaseClient } from '@/lib/supabase/admin';
import { deviceCreateSchema } from '@/lib/validation';

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

function generateDeviceKey() {
  return crypto.randomBytes(32).toString('hex'); // 64 chars
}

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export async function POST(request) {
  const auth = await ensureAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = deviceCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const deviceKey = generateDeviceKey();
  const deviceKeyHash = sha256Hex(deviceKey);

  const admin = getServiceSupabaseClient();
  const { data: device, error } = await admin
    .from('devices')
    .insert({
      name: parsed.data.name,
      region_id: parsed.data.region_id,
      install_location: parsed.data.install_location,
      is_active: parsed.data.is_active,
      device_key_hash: deviceKeyHash,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ device, device_key: deviceKey });
}

