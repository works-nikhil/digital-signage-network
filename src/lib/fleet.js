import { getServerSupabaseClient } from '@/lib/supabase/server';

const ONLINE_THRESHOLD_MS = 12 * 60 * 1000; // 12 minutes
const DEFAULT_PAGE_SIZE = 25;

export function getThresholdIso() {
  return new Date(Date.now() - ONLINE_THRESHOLD_MS).toISOString();
}

/**
 * Server-only. Returns fleet counts for dashboard.
 * @returns {{ total: number, active: number, online: number, offline: number }}
 */
export async function getFleetCounts() {
  const supabase = await getServerSupabaseClient();
  const threshold = getThresholdIso();

  const [totalRes, activeRes, onlineRes] = await Promise.all([
    supabase.from('devices').select('id', { count: 'exact', head: true }),
    supabase.from('devices').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('devices')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('last_seen_at', threshold),
  ]);

  const total = totalRes.count ?? 0;
  const active = activeRes.count ?? 0;
  const online = onlineRes.count ?? 0;
  const offline = Math.max(0, active - online);

  return { total, active, online, offline };
}

/**
 * Server-only. Paginated device list with active playlist assignment.
 * @param {Object} opts
 * @param {string} [opts.filter] - 'all' | 'online' | 'offline' | 'inactive'
 * @param {number} [opts.page=1]
 * @param {number} [opts.pageSize=10]
 */
export async function getDevicesList(opts = {}) {
  const supabase = await getServerSupabaseClient();
  const filter = opts.filter || 'all';
  const page = Math.max(1, opts.page || 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize || DEFAULT_PAGE_SIZE));
  const threshold = getThresholdIso();

  let query = supabase
    .from('devices')
    .select(
      'id, name, region_id, is_active, last_seen_at, player_version, last_error, regions(name), device_playlist_assignments(playlist_id, is_active, playlists(name))',
      { count: 'exact' }
    );

  if (filter === 'online') {
    query = query.eq('is_active', true).gte('last_seen_at', threshold);
  } else if (filter === 'offline') {
    query = query
      .eq('is_active', true)
      .or(`last_seen_at.is.null,last_seen_at.lt.${threshold}`);
  } else if (filter === 'inactive') {
    query = query.eq('is_active', false);
  }

  query = query
    .order('last_seen_at', { ascending: true, nullsFirst: true })
    .order('name', { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data: devices, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    devices: devices ?? [],
    totalCount: count ?? 0,
    page,
    pageSize,
    thresholdMs: ONLINE_THRESHOLD_MS,
  };
}

export { ONLINE_THRESHOLD_MS };
