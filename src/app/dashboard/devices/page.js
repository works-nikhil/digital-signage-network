import Link from 'next/link';
import { getFleetCounts, getDevicesList } from '@/lib/fleet';
import StatusBadge from '@/components/StatusBadge';
import LastSeen from '@/components/LastSeen';
import DevicesFilter from '@/components/DevicesFilter';

const PAGE_SIZE = 25;
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
        <h1 className="text-xl font-semibold">Devices</h1>
        <Link
          href="/dashboard/devices/new"
          className="rounded bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700"
        >
          New device
        </Link>
      </div>

      {/* Fleet summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow p-3 border border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
          <p className="text-lg font-semibold text-gray-900">{counts.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 border border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Active</p>
          <p className="text-lg font-semibold text-gray-900">{counts.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 border border-green-50">
          <p className="text-xs text-green-700 uppercase tracking-wide">Online</p>
          <p className="text-lg font-semibold text-green-700">{counts.online}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 border border-red-50">
          <p className="text-xs text-red-700 uppercase tracking-wide">Offline</p>
          <p className="text-lg font-semibold text-red-700">{counts.offline}</p>
        </div>
      </div>

      <DevicesFilter currentFilter={filter} currentPage={page} />

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-900">Name</th>
              <th className="px-3 py-2 text-left font-medium text-gray-900">Region</th>
              <th className="px-3 py-2 text-left font-medium text-gray-900">Status</th>
              <th className="px-3 py-2 text-left font-medium text-gray-900">Last seen</th>
              <th className="px-3 py-2 text-left font-medium text-gray-900">Player</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id} className="border-b last:border-0 hover:bg-gray-50/50">
                <td className="px-3 py-2 text-gray-900">{d.name}</td>
                <td className="px-3 py-2 text-gray-700">{d.regions?.name ?? '—'}</td>
                <td className="px-3 py-2">
                  <StatusBadge lastSeenAt={d.last_seen_at} isActive={d.is_active} />
                </td>
                <td className="px-3 py-2">
                  <LastSeen lastSeenAt={d.last_seen_at} />
                </td>
                <td className="px-3 py-2 text-gray-600">{d.player_version ?? '—'}</td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/dashboard/devices/${d.id}`}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {devices.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                  No devices match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-600">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/dashboard/devices?filter=${filter}&page=${page - 1}`}
                className="rounded border px-3 py-1 hover:bg-gray-100"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/devices?filter=${filter}&page=${page + 1}`}
                className="rounded border px-3 py-1 hover:bg-gray-100"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
