import Link from 'next/link';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import PlaylistCreateForm from '@/components/PlaylistCreateForm';

export default async function PlaylistsPage() {
  const supabase = await getServerSupabaseClient();

  const { data: regions } = await supabase
    .from('regions')
    .select('id, name')
    .order('name', { ascending: true });

  const { data: playlists, error } = await supabase
    .from('playlists')
    .select('id, name, is_active, region_id, regions(name), created_at, playlist_items(count), device_playlist_assignments(count)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Playlists</h1>
          <p className="text-sm text-gray-500 mt-0.5">{playlists?.length ?? 0} total</p>
        </div>
      </div>

      {error && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error.message}
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Name</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Region</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Assets</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Devices</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Status</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {playlists?.map((p) => {
                  const itemCount = p.playlist_items?.[0]?.count ?? 0;
                  const deviceCount = p.device_playlist_assignments?.[0]?.count ?? 0;
                  return (
                    <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-2.5">
                        <Link href={`/dashboard/playlists/${p.id}`} className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{p.regions?.name || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                          itemCount > 0 ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-400'
                        }`}>
                          {itemCount} 
                          {/* {itemCount === 1 ? 'asset' : 'assets'} */}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                          deviceCount > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-400'
                        }`}>
                          {deviceCount} 
                          {/* {deviceCount === 1 ? 'device' : 'devices'} */}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {p.is_active ? (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">Active</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">Inactive</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link
                          href={`/dashboard/playlists/${p.id}`}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Open →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {!playlists?.length && (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-400 text-sm" colSpan={6}>
                      No playlists yet. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold mb-3 text-gray-900">Create playlist</h2>
          <PlaylistCreateForm regions={regions || []} />
        </div>
      </div>
    </div>
  );
}
