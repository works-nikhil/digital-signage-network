'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard/regions', label: 'Regions' },
  { href: '/dashboard/devices', label: 'Devices' },
  { href: '/dashboard/playlists', label: 'Playlists' },
  { href: '/dashboard/assets', label: 'Assets' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r bg-white min-h-screen flex flex-col">
      <div className="px-4 py-4 font-semibold text-lg">Admin</div>
      <nav className="px-2 space-y-1 flex-1">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center px-3 py-2 rounded text-sm ${
                active
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <form action="/logout" method="post" className="px-2 pb-4">
        <button
          type="submit"
          className="w-full text-left px-3 py-2 rounded text-sm text-red-700 hover:bg-red-50"
        >
          Logout
        </button>
      </form>
    </aside>
  );
}

