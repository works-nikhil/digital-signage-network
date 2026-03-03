import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getServerSupabaseClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }) {
  const supabase = await getServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?redirectTo=/dashboard');
  }

  const { data: isAdmin, error: isAdminError } = await supabase.rpc('is_admin');

  if (isAdminError || !isAdmin) {
    redirect('/not-authorized');
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  );
}

