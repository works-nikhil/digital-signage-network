'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { formatDateTime } from '@/lib/formatDate';
import { zodResolver } from '@hookform/resolvers/zod';
import { playlistItemUpdateSchema } from '@/lib/validation';

function normalizeDatetimeLocalToIso(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function toDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

const defaultRow = () => ({
  asset_id: '',
  sort_order: 0,
  duration_seconds: 10,
  is_active: true,
  language_code: '',
  starts_at: '',
  ends_at: '',
});

export default function PlaylistItemsClient({ playlistId, assets, initialItems }) {
  const [items, setItems] = useState(initialItems || []);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [addRows, setAddRows] = useState([defaultRow()]);
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  async function handleBatchAdd(e) {
    e.preventDefault();
    setError(null);
    setSubmittingAdd(true);

    const rowsWithAsset = addRows.filter((r) => r.asset_id);
    if (!rowsWithAsset.length) {
      setError('Select at least one asset.');
      setSubmittingAdd(false);
      return;
    }

    const payload = {
      playlist_id: playlistId,
      items: rowsWithAsset.map((r) => ({
        asset_id: r.asset_id,
        sort_order: Number(r.sort_order) || 0,
        duration_seconds: Number(r.duration_seconds) || 10,
        is_active: !!r.is_active,
        language_code: r.language_code || null,
        starts_at: normalizeDatetimeLocalToIso(r.starts_at),
        ends_at: normalizeDatetimeLocalToIso(r.ends_at),
      })),
    };

    const res = await fetch('/api/playlist-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({}));
    setSubmittingAdd(false);

    if (!res.ok) {
      setError(body.error || 'Failed to add items');
      return;
    }

    setItems(body.items || items);
    setAddRows([defaultRow()]);
    setError(null);
  }

  function addRow() {
    setAddRows((prev) => [...prev, defaultRow()]);
  }

  function updateAddRow(index, field, value) {
    setAddRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function removeAddRow(index) {
    if (addRows.length <= 1) return;
    setAddRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveEdit(values) {
    if (!editingItem) return;
    setError(null);
    setEditSubmitting(true);

    const payload = {
      duration_seconds: Number(values.duration_seconds) || 10,
      sort_order: Number(values.sort_order) ?? editingItem.sort_order,
      is_active: !!values.is_active,
      language_code: values.language_code || null,
      starts_at: normalizeDatetimeLocalToIso(values.starts_at),
      ends_at: normalizeDatetimeLocalToIso(values.ends_at),
    };

    const parsed = playlistItemUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.errors?.[0]?.message || 'Invalid input');
      setEditSubmitting(false);
      return;
    }

    const res = await fetch(`/api/playlist-items/${editingItem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });

    const body = await res.json().catch(() => ({}));
    setEditSubmitting(false);
    if (!res.ok) {
      setError(body.error || 'Failed to update item');
      return;
    }

    setItems(body.items || items);
    setEditingItem(null);
    setError(null);
  }

  async function removeItem(id) {
    setError(null);
    const prev = items;
    setItems((cur) => cur.filter((i) => i.id !== id));

    const res = await fetch(`/api/playlist-items/${id}`, { method: 'DELETE' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setItems(prev);
      setError(body.error || 'Failed to remove item');
    } else if (body.items) {
      setItems(body.items);
    }
  }

  async function openPreview(asset) {
    if (!asset?.bucket || !asset?.object_path) return;
    setError(null);
    const res = await fetch('/api/admin/storage/sign-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket: asset.bucket, object_path: asset.object_path }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Failed to create preview URL');
      return;
    }
    if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {editingItem && (
        <div className="bg-white rounded shadow p-4 border border-blue-100">
          <h3 className="text-sm font-semibold mb-3">Edit item</h3>
          <EditItemForm
            item={editingItem}
            onSave={saveEdit}
            onCancel={() => setEditingItem(null)}
            isSubmitting={editSubmitting}
          />
        </div>
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Asset</th>
              <th className="px-3 py-2 text-left font-medium">MIME</th>
              <th className="px-3 py-2 text-left font-medium">Duration</th>
              <th className="px-3 py-2 text-left font-medium">Sort</th>
              <th className="px-3 py-2 text-left font-medium">Lang</th>
              <th className="px-3 py-2 text-left font-medium">Window</th>
              <th className="px-3 py-2 text-left font-medium">Active</th>
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b last:border-0">
                <td className="px-3 py-2">
                  <span className="text-gray-800">{i.assets?.object_path || i.asset_id}</span>
                  {i.assets?.mime_type?.startsWith('image/') && (
                    <button
                      type="button"
                      onClick={() => openPreview(i.assets)}
                      className="ml-1 text-blue-600 hover:underline"
                    >
                      Preview
                    </button>
                  )}
                </td>
                <td className="px-3 py-2 text-gray-600">{i.assets?.mime_type || '–'}</td>
                <td className="px-3 py-2">{i.duration_seconds}s</td>
                <td className="px-3 py-2">{i.sort_order}</td>
                <td className="px-3 py-2">{i.language_code || '–'}</td>
                <td className="px-3 py-2">
                  {i.starts_at ? formatDateTime(i.starts_at) : 'Always'}
                  {' – '}
                  {i.ends_at ? formatDateTime(i.ends_at) : '∞'}
                </td>
                <td className="px-3 py-2">{i.is_active ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2 text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(i)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
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
                <td className="px-3 py-6 text-center text-gray-500" colSpan={8}>
                  No items yet. Add assets below to build this playlist.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded shadow p-4">
        <h3 className="text-sm font-semibold mb-3">Add assets to playlist</h3>
        {(!assets || !assets.length) && (
          <p className="text-xs text-gray-500 mb-3">
            No assets in the library yet. Upload files from the <Link href="/dashboard/assets" className="text-blue-600 hover:underline">Assets</Link> page first.
          </p>
        )}
        <form onSubmit={handleBatchAdd} className="space-y-3">
          {addRows.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-2 sm:grid-cols-8 gap-2 text-xs items-end border-b border-gray-100 pb-3 last:border-0 last:pb-0"
            >
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Asset</label>
                <select
                  className="block w-full rounded border px-2 py-1.5 text-sm"
                  value={row.asset_id}
                  onChange={(e) => updateAddRow(index, 'asset_id', e.target.value)}
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
                <label className="block font-medium mb-1">Duration (s)</label>
                <input
                  type="number"
                  min={1}
                  className="block w-full rounded border px-2 py-1.5 text-sm"
                  value={row.duration_seconds}
                  onChange={(e) => updateAddRow(index, 'duration_seconds', e.target.value)}
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Sort</label>
                <input
                  type="number"
                  className="block w-full rounded border px-2 py-1.5 text-sm"
                  value={row.sort_order}
                  onChange={(e) => updateAddRow(index, 'sort_order', e.target.value)}
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Lang</label>
                <input
                  type="text"
                  className="block w-full rounded border px-2 py-1.5 text-sm"
                  placeholder="en"
                  value={row.language_code}
                  onChange={(e) => updateAddRow(index, 'language_code', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1">
                <label className="inline-flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={row.is_active}
                    onChange={(e) => updateAddRow(index, 'is_active', e.target.checked)}
                  />
                  <span>Active</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                {addRows.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeAddRow(index)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Remove row
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={addRow}
              className="rounded border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50"
            >
              Add another
            </button>
            <button
              type="submit"
              disabled={submittingAdd}
              className="rounded bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {submittingAdd ? 'Adding…' : 'Add to playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditItemForm({ item, onSave, onCancel, isSubmitting }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(playlistItemUpdateSchema),
    defaultValues: {
      duration_seconds: item.duration_seconds ?? 10,
      sort_order: item.sort_order ?? 0,
      is_active: !!item.is_active,
      language_code: item.language_code || '',
      starts_at: toDatetimeLocal(item.starts_at),
      ends_at: toDatetimeLocal(item.ends_at),
    },
  });

  function submit(values) {
    onSave(values);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
      <div>
        <label className="block font-medium mb-1">Duration (s)</label>
        <input
          type="number"
          min={1}
          className="block w-full rounded border px-2 py-1.5"
          {...register('duration_seconds')}
        />
        {errors.duration_seconds && (
          <p className="text-red-600 text-xs mt-0.5">{errors.duration_seconds.message}</p>
        )}
      </div>
      <div>
        <label className="block font-medium mb-1">Sort order</label>
        <input type="number" className="block w-full rounded border px-2 py-1.5" {...register('sort_order')} />
      </div>
      <div>
        <label className="block font-medium mb-1">Language</label>
        <input className="block w-full rounded border px-2 py-1.5" {...register('language_code')} />
      </div>
      <div className="sm:col-span-2">
        <label className="block font-medium mb-1">Starts at</label>
        <input type="datetime-local" className="block w-full rounded border px-2 py-1.5" {...register('starts_at')} />
      </div>
      <div className="sm:col-span-2">
        <label className="block font-medium mb-1">Ends at</label>
        <input type="datetime-local" className="block w-full rounded border px-2 py-1.5" {...register('ends_at')} />
        {errors.ends_at && (
          <p className="text-red-600 text-xs mt-0.5">{errors.ends_at.message}</p>
        )}
      </div>
      <div className="col-span-2 sm:col-span-4 flex items-center gap-3">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" {...register('is_active')} />
          <span>Active</span>
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
