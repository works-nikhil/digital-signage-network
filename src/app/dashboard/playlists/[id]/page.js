import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { formatDateTime } from '@/lib/formatDate';
import PlaylistEditor from '@/components/PlaylistEditor';
import PlaylistItemsClient from '@/components/PlaylistItemsClient';

export default async function PlaylistDetailPage({ params }) {
  const { id } = await params;
  const supabase = await getServerSupabaseClient();

  const { data: playlist, error: playlistError } = await supabase
    .from('playlists')
    .select('*, regions(id, name)')
    .eq('id', id)
    .single();

  if (!playlist) {
    notFound();
  }

  const [
    { data: regions },
    { data: items, error: itemsError },
    { data: assets },
    { data: assignments },
  ] = await Promise.all([
    supabase.from('regions').select('id, name').order('name', { ascending: true }),
    supabase
      .from('playlist_items')
      .select('*, assets(id, object_path, mime_type, bucket)')
      .eq('playlist_id', id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('assets')
      .select('id, object_path, mime_type, bucket')
      .order('created_at', { ascending: false }),
    supabase
      .from('device_playlist_assignments')
      .select('id, is_active, priority, devices(id, name, is_active, last_seen_at, regions(name))')
      .eq('playlist_id', id)
      .order('priority', { ascending: true }),
  ]);

  const regionName = playlist.regions?.name ?? null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/playlists" className="text-blue-600 hover:underline">
          Playlists
        </Link>
        <span>/</span>
        <span className="text-gray-700">{playlist.name}</span>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{playlist.name}</h1>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{playlist.id}</p>
            <p className="text-sm text-gray-500 mt-1">
              {regionName ? regionName : <span className="text-gray-300">No region</span>}
            </p>
          </div>
          <span className={
            playlist.is_active
              ? 'rounded-full px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700'
              : 'rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-500'
          }>
            {playlist.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 flex flex-wrap gap-4">
          <span>Updated: {playlist.updated_at ? formatDateTime(playlist.updated_at) : '–'}</span>
          <span>Created: {playlist.created_at ? formatDateTime(playlist.created_at) : '–'}</span>
          <span className="font-medium text-gray-600">{items?.length ?? 0} assets · {assignments?.length ?? 0} device{assignments?.length !== 1 ? 's' : ''} assigned</span>
        </div>
      </div>

      {(playlistError || itemsError) && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">
          {playlistError?.message || itemsError?.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-4">
          <PlaylistEditor playlist={playlist} regions={regions || []} />

          {/* Assigned devices panel */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Assigned Devices</h2>
              <span className="text-xs text-gray-400">{assignments?.length ?? 0}</span>
            </div>
            {!assignments?.length ? (
              <p className="px-4 py-4 text-xs text-gray-400">
                No devices assigned yet.{' '}
                <Link href="/dashboard/devices" className="text-blue-600 hover:underline">Go to Devices</Link> to assign this playlist.
              </p>
            ) : (
              <div className="divide-y divide-gray-50">
                {assignments.map((a) => {
                  const device = a.devices;
                  return (
                    <Link
                      key={a.id}
                      href={`/dashboard/devices/${device?.id}`}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{device?.name ?? a.id}</p>
                        <p className="text-xs text-gray-400 truncate">{device?.regions?.name ?? 'No region'}</p>
                      </div>
                      <span className={`ml-2 flex-shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-xs ${
                        a.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'
                      }`}>
                        {a.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Playlist items</h2>
          <PlaylistItemsClient
            playlistId={playlist.id}
            assets={assets || []}
            initialItems={items || []}
          />
        </div>
      </div>
    </div>
  );
}
