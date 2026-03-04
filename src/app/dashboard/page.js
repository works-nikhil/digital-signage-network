import Link from 'next/link';

// Simple dashboard home without fleet health widget
export default function DashboardHome() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>
      <p className="mb-4 text-sm text-gray-600">
        Manage regions, devices, playlists, assets, and playlist assignments.
      </p>
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

