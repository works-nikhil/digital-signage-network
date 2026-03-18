import Link from 'next/link';
import { getFleetCounts, getDevicesList } from '@/lib/fleet';
import StatusBadge from '@/components/StatusBadge';
import LastSeen from '@/components/LastSeen';
import DevicesFilter from '@/components/DevicesFilter';

const PAGE_SIZE = 10;
const VALID_FILTERS = ['all', 'online', 'offline', 'inactive'];

export default async function DevicesPage({ searchParams }) {
  const params = await searchParams;
  const filter = VALID_FILTERS.includes(params?.filter) ? params.filter : 'all';
  const page = Math.max(1, parseInt(params?.page, 10) || 1);

  const [counts, list] = await Promise.all([
    getFleetCounts(),
    getDevicesList({ filter, page, pageSize: PAGE_SIZE }),
  ]);

  const { devices, totalCount, pageSize } = list;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Devices</h1>
          <p className="text-sm text-gray-500 mt-0.5">{counts.total} total</p>
        </div>
        <Link
          href="/dashboard/devices/new"
          className="rounded bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700 transition-colors"
        >
          + New device
        </Link>
      </div>

      {/* Fleet summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{counts.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Active</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{counts.active}</p>
        </div>
        <div className="bg-white rounded-lg border border-green-100 p-3">
          <p className="text-xs text-green-600 uppercase tracking-wide">Online</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{counts.online}</p>
        </div>
        <div className="bg-white rounded-lg border border-red-100 p-3">
          <p className="text-xs text-red-600 uppercase tracking-wide">Offline</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{counts.offline}</p>
        </div>
      </div>

      <DevicesFilter currentFilter={filter} currentPage={page} />

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Name</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Region</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Active Playlist</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Status</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Last seen</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Player</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => {
              const activeAssignment = (d.device_playlist_assignments || []).find((a) => a.is_active);
              const playlistName = activeAssignment?.playlists?.name ?? null;
              const totalAssignments = (d.device_playlist_assignments || []).length;
              return (
                <tr key={d.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{d.name}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{d.regions?.name ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-2.5">
                    {playlistName ? (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 rounded px-1.5 py-0.5">
                        <span>▶</span> {playlistName}
                        {totalAssignments > 1 && <span className="text-blue-400">+{totalAssignments - 1}</span>}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">No playlist</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge lastSeenAt={d.last_seen_at} isActive={d.is_active} />
                  </td>
                  <td className="px-4 py-2.5">
                    <LastSeen lastSeenAt={d.last_seen_at} />
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{d.player_version ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/dashboard/devices/${d.id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              );
            })}
            {devices.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-gray-400 text-sm" colSpan={7}>
                  No devices match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500 text-xs">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/dashboard/devices?filter=${filter}&page=${page - 1}`}
                className="rounded border border-gray-200 px-3 py-1 text-sm hover:bg-gray-100 transition-colors"
              >
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/devices?filter=${filter}&page=${page + 1}`}
                className="rounded border border-gray-200 px-3 py-1 text-sm hover:bg-gray-100 transition-colors"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
