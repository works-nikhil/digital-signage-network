import Link from 'next/link';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { getFleetCounts } from '@/lib/fleet';

export default async function DashboardHome() {
  const supabase = await getServerSupabaseClient();

  const [
    fleetCounts,
    { count: assetCount },
    { count: playlistCount },
    { count: regionCount },
    { data: recentDevices },
    { data: recentPlaylists },
  ] = await Promise.all([
    getFleetCounts(),
    supabase.from('assets').select('id', { count: 'exact', head: true }),
    supabase.from('playlists').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('regions').select('id', { count: 'exact', head: true }),
    supabase
      .from('devices')
      .select('id, name, is_active, last_seen_at, regions(name), device_playlist_assignments(playlist_id, is_active, playlists(name))')
      .order('last_seen_at', { ascending: false, nullsFirst: false })
      .limit(5),
    supabase
      .from('playlists')
      .select('id, name, is_active, regions(name), playlist_items(count), device_playlist_assignments(count)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const ONLINE_THRESHOLD_MS = 12 * 60 * 1000;
  const now = Date.now();

  function isOnline(device) {
    if (!device.is_active || !device.last_seen_at) return false;
    return now - new Date(device.last_seen_at).getTime() <= ONLINE_THRESHOLD_MS;
  }

  function getActivePlaylistName(device) {
    const active = (device.device_playlist_assignments || []).find((a) => a.is_active);
    return active?.playlists?.name ?? null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of your digital signage network</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/dashboard/assets" className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-200 hover:shadow-sm transition-all group">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Assets</p>
          <p className="text-2xl font-bold text-gray-900">{assetCount ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1 group-hover:text-blue-500">Files uploaded →</p>
        </Link>
        <Link href="/dashboard/playlists" className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-200 hover:shadow-sm transition-all group">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Active Playlists</p>
          <p className="text-2xl font-bold text-gray-900">{playlistCount ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1 group-hover:text-blue-500">Manage playlists →</p>
        </Link>
        <Link href="/dashboard/devices" className="bg-white rounded-lg border border-gray-200 p-4 hover:border-green-200 hover:shadow-sm transition-all group">
          <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Online Devices</p>
          <p className="text-2xl font-bold text-green-700">{fleetCounts.online}</p>
          <p className="text-xs text-gray-400 mt-1">{fleetCounts.offline} offline · {fleetCounts.total} total</p>
        </Link>
        <Link href="/dashboard/regions" className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-200 hover:shadow-sm transition-all group">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Regions</p>
          <p className="text-2xl font-bold text-gray-900">{regionCount ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1 group-hover:text-blue-500">Manage regions →</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent devices */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recent Devices</h2>
            <Link href="/dashboard/devices" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(recentDevices || []).length === 0 && (
              <p className="px-4 py-5 text-sm text-gray-400 text-center">No devices yet.</p>
            )}
            {(recentDevices || []).map((d) => {
              const online = isOnline(d);
              const playlistName = getActivePlaylistName(d);
              return (
                <Link
                  key={d.id}
                  href={`/dashboard/devices/${d.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 truncate">{d.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {d.regions?.name ?? 'No region'}
                      {playlistName && (
                        <span className="ml-2 text-blue-500">▶ {playlistName}</span>
                      )}
                    </p>
                  </div>
                  <span className={`ml-3 flex-shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                    !d.is_active
                      ? 'bg-gray-100 text-gray-500'
                      : online
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                  }`}>
                    {!d.is_active ? 'Inactive' : online ? 'Online' : 'Offline'}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Active playlists */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Active Playlists</h2>
            <Link href="/dashboard/playlists" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(recentPlaylists || []).length === 0 && (
              <p className="px-4 py-5 text-sm text-gray-400 text-center">No active playlists yet.</p>
            )}
            {(recentPlaylists || []).map((p) => {
              const itemCount = p.playlist_items?.[0]?.count ?? 0;
              const deviceCount = p.device_playlist_assignments?.[0]?.count ?? 0;
              return (
                <Link
                  key={p.id}
                  href={`/dashboard/playlists/${p.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.regions?.name ?? 'No region'}</p>
                  </div>
                  <div className="ml-3 flex-shrink-0 flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-gray-100 rounded px-1.5 py-0.5">{itemCount} asset{itemCount !== 1 ? 's' : ''}</span>
                    <span className="bg-blue-50 text-blue-600 rounded px-1.5 py-0.5">{deviceCount} device{deviceCount !== 1 ? 's' : ''}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chain explainer */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">How it works</p>
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
            <span className="text-purple-600">🗂</span>
            <div>
              <p className="font-medium text-purple-800 text-xs">Assets</p>
              <p className="text-purple-600 text-xs">Images, videos</p>
            </div>
          </div>
          <span className="text-gray-400 text-lg">→</span>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            <span className="text-blue-600">📋</span>
            <div>
              <p className="font-medium text-blue-800 text-xs">Playlists</p>
              <p className="text-blue-600 text-xs">Ordered sequences</p>
            </div>
          </div>
          <span className="text-gray-400 text-lg">→</span>
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
            <span className="text-green-600">🖥</span>
            <div>
              <p className="font-medium text-green-800 text-xs">Devices</p>
              <p className="text-green-600 text-xs">Screens & displays</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
