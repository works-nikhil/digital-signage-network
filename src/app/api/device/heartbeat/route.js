import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceSupabaseClient } from '@/lib/supabase/admin';

const HEARTBEAT_BODY_LIMIT = 2048; // 2KB max

const heartbeatSchema = z.object({
  device_id: z.string().uuid(),
  player_version: z.string().max(100).optional(),
  last_error: z.string().max(2000).optional(),
});

function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return null;
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { ok: false, error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    const raw = await request.text();
    if (raw.length > HEARTBEAT_BODY_LIMIT) {
      return NextResponse.json(
        { ok: false, error: 'Payload too large' },
        { status: 413 }
      );
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    const parsed = heartbeatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { device_id, player_version, last_error } = parsed.data;
    const clientIp = getClientIp(request);

    const supabase = getServiceSupabaseClient();

    const update = {
      last_seen_at: new Date().toISOString(),
      ...(player_version !== undefined && { player_version }),
      ...(last_error !== undefined && { last_error }),
      ...(clientIp && { last_ip: clientIp }),
    };

    const { data, error } = await supabase
      .from('devices')
      .update(update)
      .eq('id', device_id)
      .eq('is_active', true)
      .select('id')
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: 'Device not found or inactive' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
