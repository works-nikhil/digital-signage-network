import { getServerSupabaseClient } from '@/lib/supabase/server';
import AssetsClient from '@/components/AssetsClient';

export default async function AssetsPage() {
  const supabase = await getServerSupabaseClient();
  const { data: assets, error } = await supabase
    .from('assets')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Assets</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {assets?.length ?? 0} file{assets?.length !== 1 ? 's' : ''} in library
        </p>
      </div>
      {error && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm border border-red-100">
          {error.message}
        </div>
      )}
      <AssetsClient initialAssets={assets || []} />
    </div>
  );
}
