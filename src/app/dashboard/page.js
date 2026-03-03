import Link from 'next/link';
import { getFleetCounts } from '@/lib/fleet';

export default async function DashboardHome() {
  const counts = await getFleetCounts();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>
      <p className="mb-4 text-sm text-gray-600">
        Manage regions, devices, playlists, assets, and playlist assignments.
      </p>

      {/* Fleet Health widget */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Fleet health</h2>
        <Link
          href="/dashboard/devices"
          className="inline-flex items-center gap-4 rounded-lg border bg-white p-4 shadow-sm hover:bg-gray-50 transition"
        >
          <span className="text-gray-600">
            <span className="font-medium text-gray-900">{counts.active}</span> active
          </span>
          <span className="text-green-600">
            <span className="font-medium">{counts.online}</span> online
          </span>
          <span className="text-red-600">
            <span className="font-medium">{counts.offline}</span> offline
          </span>
          <span className="text-xs text-gray-400">View devices →</span>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/regions"
          className="rounded border bg-white px-4 py-3 text-sm hover:bg-gray-50"
        >
          Regions
        </Link>
        <Link
          href="/dashboard/devices"
          className="rounded border bg-white px-4 py-3 text-sm hover:bg-gray-50"
        >
          Devices
        </Link>
        <Link
          href="/dashboard/playlists"
          className="rounded border bg-white px-4 py-3 text-sm hover:bg-gray-50"
        >
          Playlists
        </Link>
        <Link
          href="/dashboard/assets"
          className="rounded border bg-white px-4 py-3 text-sm hover:bg-gray-50"
        >
          Assets
        </Link>
      </div>
    </div>
  );
}

