export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-3">
        Digital Signage Admin
      </h1>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        Internal admin dashboard to manage regions, devices, playlists, assets,
        and device assignments.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <a
          href="/login"
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 text-center"
        >
          Go to login
        </a>
        <a
          href="/dashboard"
          className="px-4 py-2 rounded border border-gray-300 text-gray-800 text-sm font-medium hover:bg-gray-100 text-center"
        >
          Go to dashboard
        </a>
      </div>
    </div>
  );
}
