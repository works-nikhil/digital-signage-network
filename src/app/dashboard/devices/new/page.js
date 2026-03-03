import { getServerSupabaseClient } from '@/lib/supabase/server';
import DeviceCreateForm from '@/components/DeviceCreateForm';

export default async function NewDevicePage() {
  const supabase = await getServerSupabaseClient();
  const { data: regions } = await supabase
    .from('regions')
    .select('id, name')
    .order('name', { ascending: true });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">New device</h1>
      <DeviceCreateForm regions={regions || []} />
    </div>
  );
}

