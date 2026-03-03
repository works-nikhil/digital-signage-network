'use client';

import { useMemo, useState } from 'react';

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
    setError(null);

    const fd = new FormData(e.currentTarget);
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
    e.currentTarget.reset();
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
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Device</h2>
        <button
          type="button"
          onClick={toggleDeviceActive}
          className="text-xs rounded px-3 py-1 border bg-white hover:bg-gray-50"
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Assignments</h2>
        </div>

        <table className="min-w-full text-xs bg-white rounded shadow overflow-hidden">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-2 text-left">Playlist</th>
              <th className="px-3 py-2 text-left">Priority</th>
              <th className="px-3 py-2 text-left">Active</th>
              <th className="px-3 py-2 text-left">Window</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="px-3 py-2">{a.playlists?.name || a.playlist_id}</td>
                <td className="px-3 py-2">{a.priority}</td>
                <td className="px-3 py-2">
                  {a.is_active ? 'Yes' : 'No'}
                </td>
                <td className="px-3 py-2">
                  {a.starts_at ? new Date(a.starts_at).toLocaleString() : 'Always'}
                  {' – '}
                  {a.ends_at ? new Date(a.ends_at).toLocaleString() : '∞'}
                </td>
                <td className="px-3 py-2 text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => setAssignmentActive(a.id, !a.is_active)}
                    className="text-blue-600 hover:underline"
                  >
                    {a.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAssignment(a.id)}
                    className="text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {!assignments.length && (
              <tr>
                <td className="px-3 py-3 text-center text-gray-500" colSpan={5}>
                  No assignments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <form
          onSubmit={addOrUpdateAssignment}
          className="bg-white rounded shadow p-3 grid grid-cols-6 gap-3 text-xs items-end"
        >
          <div className="col-span-2">
            <label className="block font-medium mb-1">Playlist</label>
            <select
              name="playlist_id"
              className="block w-full rounded border px-2 py-1"
              required
            >
              <option value="">Select playlist</option>
              {playlistOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Priority</label>
            <input
              name="priority"
              type="number"
              defaultValue={100}
              className="block w-full rounded border px-2 py-1"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Starts at</label>
            <input
              name="starts_at"
              type="datetime-local"
              className="block w-full rounded border px-2 py-1"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Ends at</label>
            <input
              name="ends_at"
              type="datetime-local"
              className="block w-full rounded border px-2 py-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1">
              <input type="checkbox" name="is_active" defaultChecked />
              <span>Active</span>
            </label>
            <button className="ml-auto rounded bg-blue-600 text-white px-3 py-1">
              Save
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

