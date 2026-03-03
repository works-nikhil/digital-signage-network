'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { playlistSchema } from '@/lib/validation';

export default function PlaylistCreateForm({ regions }) {
  const router = useRouter();
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(playlistSchema),
    defaultValues: { name: '', region_id: '', is_active: true },
  });

  async function onSubmit(values) {
    setError(null);
    const parsed = playlistSchema.safeParse(values);
    if (!parsed.success) {
      setError('Invalid input');
      return;
    }

    const res = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error || 'Failed to create playlist');
      return;
    }

    reset({ name: '', region_id: '', is_active: true });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 text-sm">
      {error && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-xs">
          {error}
        </div>
      )}
      <div>
        <label className="block font-medium mb-1">Name</label>
        <input
          className="block w-full rounded border px-3 py-2 text-sm"
          {...register('name')}
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Region (optional)</label>
        <select
          className="block w-full rounded border px-3 py-2 text-sm"
          {...register('region_id')}
        >
          <option value="">None</option>
          {regions?.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <label className="inline-flex items-center gap-2">
        <input type="checkbox" {...register('is_active')} />
        <span>Active</span>
      </label>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Creating…' : 'Create playlist'}
      </button>
    </form>
  );
}

