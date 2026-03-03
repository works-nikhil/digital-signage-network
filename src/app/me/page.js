import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSupabaseClient } from '@/lib/supabase/server';

export default async function MePage() {
  const supabase = await getServerSupabaseClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?redirectTo=/me');
  }

  const { data: isAdminResult, error: isAdminError } = await supabase.rpc(
    'is_admin'
  );

  let profile = null;
  let profileError = null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();
    profile = data;
    profileError = error;
  } catch (e) {
    profileError = { message: String(e.message || e) };
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Your user details</h1>
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:underline"
          >
            → Dashboard
          </Link>
        </div>

        <section className="bg-white rounded-lg shadow p-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-700 border-b pb-1">
            Session (auth)
          </h2>
          <dl className="text-sm grid gap-1">
            <div className="flex gap-2">
              <dt className="text-gray-500 w-28 shrink-0">User ID</dt>
              <dd className="font-mono text-xs break-all">{session.user.id}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500 w-28 shrink-0">Email</dt>
              <dd>{session.user.email ?? '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500 w-28 shrink-0">Session error</dt>
              <dd>{sessionError ? String(sessionError.message) : 'None'}</dd>
            </div>
          </dl>
        </section>

        <section className="bg-white rounded-lg shadow p-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-700 border-b pb-1">
            is_admin() RPC
          </h2>
          <dl className="text-sm grid gap-1">
            <div className="flex gap-2">
              <dt className="text-gray-500 w-28 shrink-0">Result (raw)</dt>
              <dd className="font-mono">
                {JSON.stringify(isAdminResult)} (
                {typeof isAdminResult})
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500 w-28 shrink-0">Error</dt>
              <dd>
                {isAdminError ? (
                  <span className="text-red-600">
                    {isAdminError.message}
                  </span>
                ) : (
                  'None'
                )}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500 w-28 shrink-0">Treated as admin?</dt>
              <dd>
                {isAdminError ? (
                  <span className="text-red-600">No (RPC error)</span>
                ) : isAdminResult ? (
                  <span className="text-green-600">Yes</span>
                ) : (
                  <span className="text-amber-600">No (false/null)</span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className="bg-white rounded-lg shadow p-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-700 border-b pb-1">
            profiles row (id = your user id)
          </h2>
          {profileError && (
            <p className="text-sm text-red-600">{profileError.message}</p>
          )}
          {profile ? (
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
              {JSON.stringify(profile, null, 2)}
            </pre>
          ) : !profileError ? (
            <p className="text-sm text-amber-600">
              No row found. Add a profiles row with id = your User ID and role =
              &apos;admin&apos;.
            </p>
          ) : null}
        </section>

        <p className="text-xs text-gray-500">
          If &quot;Treated as admin?&quot; is No, fix the is_admin() function or
          profiles row in Supabase, then sign out and sign in again.
        </p>
      </div>
    </div>
  );
}
