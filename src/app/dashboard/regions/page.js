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
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Regions</h1>
        <p className="text-sm text-gray-500 mt-0.5">{regions?.length ?? 0} region{regions?.length !== 1 ? 's' : ''}</p>
      </div>

      {error && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm border border-red-100">
          {error.message}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Name</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Language</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Timezone</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {regions?.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs font-mono">{r.language_code}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{r.timezone}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/dashboard/regions/${r.id}`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                ))}
                {!regions?.length && (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-400 text-sm" colSpan={4}>
                      No regions yet. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold mb-3 text-gray-900">Create region</h2>
          <RegionForm />
        </div>
      </div>
    </div>
  );
}
