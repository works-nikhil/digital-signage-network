import { notFound } from 'next/navigation';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import DeviceDetailClient from '@/components/DeviceDetailClient';

export default async function DeviceDetailPage({ params }) {
  const supabase = await getServerSupabaseClient();

  const { data: device, error: deviceError } = await supabase
    .from('devices')
    .select('*, regions(name)')
    .eq('id', params.id)
    .single();

  if (!device) {
    notFound();
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from('device_playlist_assignments')
    .select('*, playlists(name)')
    .eq('device_id', params.id)
    .order('priority', { ascending: true });

  const { data: playlists } = await supabase
    .from('playlists')
    .select('id, name')
    .order('name', { ascending: true });

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold">{device.name}</h1>
        <p className="text-sm text-gray-600">
          {device.regions?.name || 'No region'} ·{' '}
          {device.install_location || 'No install location'}
        </p>
      </div>

      {(deviceError || assignmentsError) && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">
          {deviceError?.message || assignmentsError?.message}
        </div>
      )}

      <div className="bg-white rounded shadow p-4 text-sm space-y-1">
        <p>
          <span className="font-medium">Last seen:</span>{' '}
          {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : 'Never'}
        </p>
        <p>
          <span className="font-medium">Last IP:</span> {device.last_ip || '-'}
        </p>
        <p>
          <span className="font-medium">Player version:</span>{' '}
          {device.player_version || '-'}
        </p>
        <p>
          <span className="font-medium">Last error:</span> {device.last_error || '-'}
        </p>
      </div>

      <DeviceDetailClient
        deviceId={device.id}
        initialIsActive={device.is_active}
        playlists={playlists || []}
        initialAssignments={assignments || []}
      />
    </div>
  );
}

