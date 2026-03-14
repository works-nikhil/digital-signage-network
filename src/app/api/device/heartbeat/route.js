import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceSupabaseClient } from '@/lib/supabase/admin';

const HEARTBEAT_BODY_LIMIT = 2048; // 2KB max
const SIGNED_URL_EXPIRY_SECONDS = 300; // 5 min

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

/**
 * Resolve the effective playlist for a device: active assignment in window, then
 * active playlist items in window with assets. Optionally adds signed_url per asset.
 */
async function resolveEffectivePlaylist(supabase, deviceId) {
  const now = new Date().toISOString();

  const { data: assignments, error: assignErr } = await supabase
    .from('device_playlist_assignments')
    .select('playlist_id')
    .eq('device_id', deviceId)
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order('priority', { ascending: true });
    // .limit(1);

  if (assignErr || !assignments?.length) {
    return null;
  }

  const playlistId = assignments[0].playlist_id;

  const { data: playlist, error: playlistErr } = await supabase
    .from('playlists')
    .select('id, name, updated_at')
    .eq('id', playlistId)
    .maybeSingle();

  if (playlistErr || !playlist) {
    return null;
  }

  const { data: rows, error: itemsErr } = await supabase
    .from('playlist_items')
    .select('id, sort_order, duration_seconds, is_active, language_code, starts_at, ends_at, assets(id, bucket, object_path, mime_type, bytes)')
    .eq('playlist_id', playlistId)
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (itemsErr) {
    return { id: playlist.id, name: playlist.name, updated_at: playlist.updated_at, items: [] };
  }

  const items = (rows || []).map((row) => {
    const asset = row.assets
      ? {
          id: row.assets.id,
          bucket: row.assets.bucket,
          object_path: row.assets.object_path,
          mime_type: row.assets.mime_type,
          bytes: row.assets.bytes,
        }
      : null;
    return {
      id: row.id,
      sort_order: row.sort_order,
      duration_seconds: row.duration_seconds,
      is_active: row.is_active,
      language_code: row.language_code,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      asset,
    };
  });

  const withSignedUrls = await Promise.all(
    items.map(async (item) => {
      if (!item.asset?.bucket || !item.asset?.object_path) return item;
      try {
        const { data: signed } = await supabase.storage
          .from(item.asset.bucket)
          .createSignedUrl(item.asset.object_path, SIGNED_URL_EXPIRY_SECONDS);
        return {
          ...item,
          asset: { ...item.asset, signed_url: signed?.signedUrl ?? null },
        };
      } catch {
        return item;
      }
    })
  );

  return {
    id: playlist.id,
    name: playlist.name,
    updated_at: playlist.updated_at,
    items: withSignedUrls,
  };
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
      .select('id, last_seen_at')
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

    const playlist = await resolveEffectivePlaylist(supabase, device_id);

    return NextResponse.json({
      ok: true,
      device_id: data.id,
      last_seen_at: data.last_seen_at,
      playlist,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
