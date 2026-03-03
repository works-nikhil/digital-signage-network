import Link from 'next/link';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import RegionForm from '@/components/RegionForm';

export default async function RegionsPage() {
  const supabase = await getServerSupabaseClient();
  const { data: regions, error } = await supabase
    .from('regions')
    .select('*')
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Regions</h1>
      </div>

      {error && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error.message}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <table className="min-w-full text-sm bg-white rounded shadow overflow-hidden">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Language</th>
                <th className="px-3 py-2 text-left font-medium">Timezone</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {regions?.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.language_code}</td>
                  <td className="px-3 py-2">{r.timezone}</td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/dashboard/regions/${r.id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {!regions?.length && (
                <tr>
                  <td
                    className="px-3 py-3 text-center text-black-500 text-sm"
                    colSpan={4}
                  >
                    No regions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded shadow p-4">
          <h2 className="text-sm font-semibold mb-3">Create region</h2>
          <RegionForm />
        </div>
      </div>
    </div>
  );
}

