import { notFound } from 'next/navigation';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import PlaylistEditor from '@/components/PlaylistEditor';
import PlaylistItemsClient from '@/components/PlaylistItemsClient';

export default async function PlaylistDetailPage({ params }) {
  const supabase = await getServerSupabaseClient();

  const { data: playlist, error: playlistError } = await supabase
    .from('playlists')
    .select('*')
    .eq('id', params.id)
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
    .select('*, assets(object_path, mime_type)')
    .eq('playlist_id', params.id)
    .order('sort_order', { ascending: true });

  const { data: assets } = await supabase
    .from('assets')
    .select('id, object_path, mime_type')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">{playlist.name}</h1>
        <p className="text-sm text-gray-600">Playlist details and items</p>
      </div>

      {(playlistError || itemsError) && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">
          {playlistError?.message || itemsError?.message}
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-1">
          <PlaylistEditor playlist={playlist} regions={regions || []} />
        </div>
        <div className="col-span-2 space-y-3">
          <h2 className="text-sm font-semibold">Items</h2>
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

