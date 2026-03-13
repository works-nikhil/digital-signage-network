import { notFound } from 'next/navigation';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import RegionForm from '@/components/RegionForm';

export default async function RegionEditPage({ params }) {
  const { id } = await params;
  const supabase = await getServerSupabaseClient();

  const { data: region, error } = await supabase
    .from('regions')
    .select('*')
    .eq('id', Number(id))
    .single();

  if (!region) {
    notFound();
  }

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Edit region</h1>
        <p className="text-sm text-gray-600">{region.name}</p>
      </div>

      {error && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error.message}
        </div>
      )}

      <RegionForm initialValues={region} />
    </div>
  );
}

