import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { formatDateTime } from '@/lib/formatDate';
import StatusBadge from '@/components/StatusBadge';
import DeviceDetailClient from '@/components/DeviceDetailClient';

export default async function DeviceDetailPage({ params }) {
  const { id } = await params;
  const supabase = await getServerSupabaseClient();

  const { data: device, error: deviceError } = await supabase
    .from('devices')
    .select('*, regions(name)')
    .eq('id', id)
    .single();

  if (!device) {
    notFound();
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from('device_playlist_assignments')
    .select('*, playlists(id, name, playlist_items(count))')
    .eq('device_id', id)
    .order('priority', { ascending: true });

  const { data: playlists } = await supabase
    .from('playlists')
    .select('id, name')
    .order('name', { ascending: true });

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/devices" className="text-blue-600 hover:underline">Devices</Link>
        <span>/</span>
        <span className="text-gray-700">{device.name}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{device.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {device.regions?.name || 'No region'}
              {device.install_location && <span className="ml-2">· {device.install_location}</span>}
            </p>
          </div>
          <StatusBadge lastSeenAt={device.last_seen_at} isActive={device.is_active} />
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <p className="text-gray-400 uppercase tracking-wide mb-0.5">Last seen</p>
            <p className="text-gray-700">{device.last_seen_at ? formatDateTime(device.last_seen_at) : 'Never'}</p>
          </div>
          <div>
            <p className="text-gray-400 uppercase tracking-wide mb-0.5">Last IP</p>
            <p className="text-gray-700 font-mono">{device.last_ip || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400 uppercase tracking-wide mb-0.5">Player version</p>
            <p className="text-gray-700 font-mono">{device.player_version || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400 uppercase tracking-wide mb-0.5">Last error</p>
            <p className="text-red-500 truncate" title={device.last_error}>{device.last_error || '—'}</p>
          </div>
        </div>
      </div>

      {(deviceError || assignmentsError) && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">
          {deviceError?.message || assignmentsError?.message}
        </div>
      )}

      <DeviceDetailClient
        deviceId={device.id}
        initialIsActive={device.is_active}
        playlists={playlists || []}
        initialAssignments={assignments || []}
      />
    </div>
  );
}
