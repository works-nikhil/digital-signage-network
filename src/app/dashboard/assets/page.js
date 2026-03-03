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
      <h1 className="text-xl font-semibold">Assets</h1>
      {error && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error.message}
        </div>
      )}
      <AssetsClient initialAssets={assets || []} />
    </div>
  );
}

