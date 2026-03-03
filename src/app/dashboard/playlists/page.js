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
    .select('id, name, is_active, region_id, regions(name), created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Playlists</h1>
      </div>

      {error && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error.message}
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <table className="min-w-full text-sm bg-white rounded shadow overflow-hidden">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Region</th>
                <th className="px-3 py-2 text-left font-medium">Active</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {playlists?.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2">{p.regions?.name || '-'}</td>
                  <td className="px-3 py-2">
                    {p.is_active ? (
                      <span className="text-green-700 text-xs">Active</span>
                    ) : (
                      <span className="text-gray-500 text-xs">Inactive</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/dashboard/playlists/${p.id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {!playlists?.length && (
                <tr>
                  <td className="px-3 py-3 text-center text-gray-500" colSpan={4}>
                    No playlists yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-sm font-semibold mb-3">Create playlist</h2>
          <PlaylistCreateForm regions={regions || []} />
        </div>
      </div>
    </div>
  );
}

