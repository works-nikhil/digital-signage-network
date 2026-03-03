'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { playlistItemSchema } from '@/lib/validation';

function normalizeDatetimeLocalToIso(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function PlaylistItemsClient({ playlistId, assets, initialItems }) {
  const [items, setItems] = useState(initialItems || []);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(playlistItemSchema),
    defaultValues: {
      playlist_id: playlistId,
      asset_id: '',
      sort_order: 0,
      duration_seconds: 10,
      is_active: true,
      language_code: '',
      starts_at: '',
      ends_at: '',
    },
  });

  async function onSubmit(values) {
    setError(null);

    const payload = {
      ...values,
      playlist_id: playlistId,
      language_code: values.language_code || null,
      starts_at: normalizeDatetimeLocalToIso(values.starts_at),
      ends_at: normalizeDatetimeLocalToIso(values.ends_at),
    };

    const parsed = playlistItemSchema.safeParse(payload);
    if (!parsed.success) {
      setError('Invalid input');
      return;
    }

    const res = await fetch('/api/playlist-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error || 'Failed to add item');
      return;
    }

    setItems(body.items || items);
    reset({
      playlist_id: playlistId,
      asset_id: '',
      sort_order: 0,
      duration_seconds: 10,
      is_active: true,
      language_code: '',
      starts_at: '',
      ends_at: '',
    });
  }

  async function removeItem(id) {
    setError(null);
    const prev = items;
    setItems((cur) => cur.filter((i) => i.id !== id));

    const res = await fetch(`/api/playlist-items/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setItems(prev);
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Failed to remove item');
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <table className="min-w-full text-xs bg-white rounded shadow overflow-hidden">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-3 py-2 text-left">Asset</th>
            <th className="px-3 py-2 text-left">Duration (s)</th>
            <th className="px-3 py-2 text-left">Sort</th>
            <th className="px-3 py-2 text-left">Lang</th>
            <th className="px-3 py-2 text-left">Window</th>
            <th className="px-3 py-2 text-left">Active</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id} className="border-b last:border-0">
              <td className="px-3 py-2">{i.assets?.object_path || i.asset_id}</td>
              <td className="px-3 py-2">{i.duration_seconds}</td>
              <td className="px-3 py-2">{i.sort_order}</td>
              <td className="px-3 py-2">{i.language_code || '-'}</td>
              <td className="px-3 py-2">
                {i.starts_at ? new Date(i.starts_at).toLocaleString() : 'Always'}
                {' – '}
                {i.ends_at ? new Date(i.ends_at).toLocaleString() : '∞'}
              </td>
              <td className="px-3 py-2">{i.is_active ? 'Yes' : 'No'}</td>
              <td className="px-3 py-2 text-right">
                <button
                  type="button"
                  onClick={() => removeItem(i.id)}
                  className="text-red-600 hover:underline"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td className="px-3 py-3 text-center text-gray-500" colSpan={7}>
                No items yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded shadow p-3 grid grid-cols-8 gap-3 text-xs items-end"
      >
        <input type="hidden" value={playlistId} {...register('playlist_id')} />

        <div className="col-span-3">
          <label className="block font-medium mb-1">Asset</label>
          <select
            className="block w-full rounded border px-2 py-1"
            {...register('asset_id')}
            required
          >
            <option value="">Select asset</option>
            {assets?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.object_path}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Duration</label>
          <input
            type="number"
            className="block w-full rounded border px-2 py-1"
            {...register('duration_seconds')}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Sort</label>
          <input
            type="number"
            className="block w-full rounded border px-2 py-1"
            {...register('sort_order')}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Language</label>
          <input
            className="block w-full rounded border px-2 py-1"
            {...register('language_code')}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Starts</label>
          <input
            type="datetime-local"
            className="block w-full rounded border px-2 py-1"
            {...register('starts_at')}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Ends</label>
          <input
            type="datetime-local"
            className="block w-full rounded border px-2 py-1"
            {...register('ends_at')}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" {...register('is_active')} />
            <span>Active</span>
          </label>
          <button
            disabled={isSubmitting}
            className="ml-auto rounded bg-blue-600 text-white px-3 py-1 disabled:opacity-50"
          >
            {isSubmitting ? 'Adding…' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );
}

