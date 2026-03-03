'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function AssetsClient({ initialAssets }) {
  const [assets, setAssets] = useState(initialAssets || []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const objectPath = `${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('signage-assets')
        .upload(objectPath, file, { upsert: false });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket: 'signage-assets',
          object_path: objectPath,
          mime_type: file.type || 'application/octet-stream',
          bytes: file.size,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || 'Failed to save asset row');
        return;
      }

      setAssets((prev) => [body.asset, ...prev]);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function preview(asset) {
    setError(null);
    const res = await fetch('/api/admin/storage/sign-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket: asset.bucket, object_path: asset.object_path }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error || 'Failed to create signed URL');
      return;
    }
    window.open(body.url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded shadow p-3 text-sm flex items-center justify-between">
        <div>
          <p className="font-medium mb-1">Upload asset</p>
          <p className="text-xs text-gray-500">
            Stored in private bucket &quot;signage-assets&quot;.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-xs">
          <span className="rounded bg-blue-600 text-white px-3 py-2 cursor-pointer hover:bg-blue-700">
            {uploading ? 'Uploading…' : 'Choose file'}
          </span>
          <input
            type="file"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {error && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-xs">
          {error}
        </div>
      )}

      <table className="min-w-full text-xs bg-white rounded shadow overflow-hidden">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-3 py-2 text-left">Path</th>
            <th className="px-3 py-2 text-left">MIME</th>
            <th className="px-3 py-2 text-left">Bytes</th>
            <th className="px-3 py-2 text-left">Created</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {assets.map((a) => (
            <tr key={a.id} className="border-b last:border-0">
              <td className="px-3 py-2">{a.object_path}</td>
              <td className="px-3 py-2">{a.mime_type}</td>
              <td className="px-3 py-2">{a.bytes}</td>
              <td className="px-3 py-2">
                {a.created_at ? new Date(a.created_at).toLocaleString() : '-'}
              </td>
              <td className="px-3 py-2 text-right">
                {a.mime_type?.startsWith('image/') && (
                  <button
                    type="button"
                    onClick={() => preview(a)}
                    className="text-blue-600 hover:underline"
                  >
                    Preview
                  </button>
                )}
              </td>
            </tr>
          ))}
          {!assets.length && (
            <tr>
              <td className="px-3 py-3 text-center text-gray-500" colSpan={5}>
                No assets yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

