import { getServerSupabaseClient } from '@/lib/supabase/server';

export async function requireSession() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return { supabase, session };
}

export async function requireAdmin() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { ok: false, status: 401, supabase };
  }

  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  if (error || !isAdmin) {
    return { ok: false, status: 403, supabase };
  }

  return { ok: true, status: 200, supabase, session };
}

