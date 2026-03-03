'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'inactive', label: 'Inactive' },
];

export default function DevicesFilter({ currentFilter, currentPage }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map(({ value, label }) => {
        const isActive = currentFilter === value;
        const href = value === 'all'
          ? `${pathname}?page=1`
          : `${pathname}?filter=${value}&page=1`;
        return (
          <Link
            key={value}
            href={href}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
