'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { playlistSchema } from '@/lib/validation';

export default function PlaylistEditor({ playlist, regions }) {
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(playlistSchema),
    defaultValues: {
      name: playlist.name || '',
      region_id: playlist.region_id ? String(playlist.region_id) : '',
      is_active: !!playlist.is_active,
    },
  });

  async function onSubmit(values) {
    setError(null);
    setSaved(false);
    const parsed = playlistSchema.safeParse(values);
    if (!parsed.success) {
      setError('Invalid input');
      return;
    }

    const res = await fetch(`/api/playlists/${playlist.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error || 'Failed to update playlist');
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded shadow p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Playlist settings</h2>
        {saved && <span className="text-xs text-green-700">Saved</span>}
      </div>
      {error && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-xs">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input className="block w-full rounded border px-3 py-2 text-sm" {...register('name')} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Region (optional)</label>
        <select className="block w-full rounded border px-3 py-2 text-sm" {...register('region_id')}>
          <option value="">None</option>
          {regions?.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('is_active')} />
        <span>Active</span>
      </label>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}

