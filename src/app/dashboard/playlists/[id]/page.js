import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSupabaseClient } from '@/lib/supabase/server';
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

  const { data: regions } = await supabase
    .from('regions')
    .select('id, name')
    .order('name', { ascending: true });

  const { data: items, error: itemsError } = await supabase
    .from('playlist_items')
    .select('*, assets(id, object_path, mime_type, bucket)')
    .eq('playlist_id', id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  const { data: assets } = await supabase
    .from('assets')
    .select('id, object_path, mime_type, bucket')
    .order('created_at', { ascending: false });

  const regionName = playlist.regions?.name ?? null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/playlists" className="text-blue-600 hover:underline">
          Playlists
        </Link>
        <span>/</span>
      </div>

      <div className="bg-white rounded shadow p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{playlist.name}</h1>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">{playlist.id}</p>
            <p className="text-sm text-gray-600 mt-1">
              {regionName ? (
                <span>Region: {regionName}</span>
              ) : (
                <span className="text-gray-400">No region</span>
              )}
            </p>
          </div>
          <span
            className={
              playlist.is_active
                ? 'rounded px-2 py-1 text-xs font-medium bg-green-100 text-green-800'
                : 'rounded px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600'
            }
          >
            {playlist.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 flex flex-wrap gap-4">
          <span>Updated: {playlist.updated_at ? new Date(playlist.updated_at).toLocaleString() : '–'}</span>
          <span>Created: {playlist.created_at ? new Date(playlist.created_at).toLocaleString() : '–'}</span>
        </div>
      </div>

      {(playlistError || itemsError) && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">
          {playlistError?.message || itemsError?.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <PlaylistEditor playlist={playlist} regions={regions || []} />
        </div>
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold">Playlist items</h2>
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

