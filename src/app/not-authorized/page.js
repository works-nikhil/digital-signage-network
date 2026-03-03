import Link from 'next/link';

export default function NotAuthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="bg-white shadow rounded p-6 max-w-md text-center">
        <h1 className="text-xl font-semibold mb-2">403 – Forbidden</h1>
        <p className="text-sm text-gray-600 mb-4">
          You are signed in but do not have admin access.
        </p>
        <Link
          href="/me"
          className="text-sm text-blue-600 hover:underline"
        >
          Check my user details →
        </Link>
      </div>
    </div>
  );
}

