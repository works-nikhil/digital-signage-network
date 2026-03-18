'use client';

import { useMemo, useState } from 'react';
import { formatDateTime } from '@/lib/formatDate';

function toIsoOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function DeviceDetailClient({
  deviceId,
  initialIsActive,
  playlists,
  initialAssignments,
}) {
  const [isActive, setIsActive] = useState(!!initialIsActive);
  const [assignments, setAssignments] = useState(initialAssignments || []);
  const [error, setError] = useState(null);
  const playlistOptions = useMemo(() => playlists || [], [playlists]);

  async function toggleDeviceActive() {
    setError(null);
    const next = !isActive;
    setIsActive(next);

    const res = await fetch(`/api/devices/${deviceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: next }),
    });
    if (!res.ok) {
      setIsActive(!next);
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Failed to update device');
    }
  }

  async function addOrUpdateAssignment(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setError(null);

    const fd = new FormData(form);
    const payload = {
      device_id: deviceId,
      playlist_id: fd.get('playlist_id'),
      priority: fd.get('priority'),
      is_active: fd.get('is_active') === 'on',
      starts_at: toIsoOrNull(fd.get('starts_at')),
      ends_at: toIsoOrNull(fd.get('ends_at')),
    };

    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error || 'Failed to save assignment');
      return;
    }

    setAssignments(body.assignments || assignments);
    form.reset();
  }

  async function setAssignmentActive(id, nextActive) {
    setError(null);
    const prev = assignments;
    setAssignments((cur) =>
      cur.map((a) => (a.id === id ? { ...a, is_active: nextActive } : a))
    );

    const res = await fetch(`/api/assignments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: nextActive }),
    });
    if (!res.ok) {
      setAssignments(prev);
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Failed to update assignment');
    }
  }

  async function removeAssignment(id) {
    setError(null);
    const prev = assignments;
    setAssignments((cur) => cur.filter((a) => a.id !== id));

    const res = await fetch(`/api/assignments/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setAssignments(prev);
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Failed to remove assignment');
    }
  }

  return (
    <section className="space-y-4">
      {error && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Device activation toggle */}
      <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">Device status</p>
          <p className="text-xs text-gray-400">{isActive ? 'This device is active and will receive playlists.' : 'This device is inactive.'}</p>
        </div>
        <button
          type="button"
          onClick={toggleDeviceActive}
          className={`text-xs rounded px-3 py-1.5 border transition-colors ${
            isActive
              ? 'border-red-200 text-red-600 hover:bg-red-50'
              : 'border-green-200 text-green-600 hover:bg-green-50'
          }`}
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      {/* Assignments */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Playlist Assignments</h2>
          <span className="text-xs text-gray-400">{assignments.length} assigned</span>
        </div>

        {assignments.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Playlist</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Priority</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Schedule</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => {
                  const itemCount = a.playlists?.playlist_items?.[0]?.count ?? null;
                  return (
                    <tr key={a.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-2.5">
                        <div>
                          <p className="text-sm text-gray-900 font-medium">{a.playlists?.name || a.playlist_id}</p>
                          {itemCount !== null && (
                            <p className="text-xs text-gray-400">{itemCount} asset{itemCount !== 1 ? 's' : ''}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{a.priority}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {a.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">
                        {a.starts_at ? formatDateTime(a.starts_at) : 'Always'}
                        {' – '}
                        {a.ends_at ? formatDateTime(a.ends_at) : '∞'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setAssignmentActive(a.id, !a.is_active)}
                            className="text-blue-600 hover:underline text-xs"
                          >
                            {a.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAssignment(a.id)}
                            className="text-red-500 hover:underline text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {assignments.length === 0 && (
          <div className="bg-gray-50 rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center">
            <p className="text-sm text-gray-400">No playlists assigned yet.</p>
            <p className="text-xs text-gray-400 mt-1">Use the form below to assign a playlist to this device.</p>
          </div>
        )}

        {/* Add assignment form */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Assign a playlist</h3>
          <form
            onSubmit={addOrUpdateAssignment}
            className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs items-end"
          >
            <div className="col-span-2">
              <label className="block font-medium mb-1 text-gray-700">Playlist</label>
              <select
                name="playlist_id"
                className="block w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                required
              >
                <option value="">Select playlist…</option>
                {playlistOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-700">Priority</label>
              <input
                name="priority"
                type="number"
                defaultValue={100}
                className="block w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-700">Starts at</label>
              <input
                name="starts_at"
                type="datetime-local"
                className="block w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-700">Ends at</label>
              <input
                name="ends_at"
                type="datetime-local"
                className="block w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                <input type="checkbox" name="is_active" defaultChecked className="rounded" />
                <span>Active</span>
              </label>
              <button className="ml-auto rounded bg-blue-600 text-white px-3 py-1.5 text-sm hover:bg-blue-700 transition-colors">
                Assign
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
