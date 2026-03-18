'use client';

import { useState } from 'react';
import { formatDateTime } from '@/lib/formatDate';

function getFileName(path) {
  if (!path) return '—';
  return path.split('/').pop() || path;
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function MimeBadge({ mime }) {
  if (!mime) return <span className="text-gray-300 text-xs">—</span>;

  const map = {
    'image/jpeg': { label: 'JPEG', color: 'bg-yellow-50 text-yellow-700' },
    'image/jpg': { label: 'JPG', color: 'bg-yellow-50 text-yellow-700' },
    'image/png': { label: 'PNG', color: 'bg-blue-50 text-blue-700' },
    'image/gif': { label: 'GIF', color: 'bg-purple-50 text-purple-700' },
    'image/webp': { label: 'WEBP', color: 'bg-teal-50 text-teal-700' },
    'video/mp4': { label: 'MP4', color: 'bg-red-50 text-red-700' },
    'video/webm': { label: 'WEBM', color: 'bg-orange-50 text-orange-700' },
    'application/pdf': { label: 'PDF', color: 'bg-pink-50 text-pink-700' },
  };

  const entry = map[mime.toLowerCase()];
  const label = entry?.label ?? mime.split('/')[1]?.toUpperCase() ?? mime;
  const color = entry?.color ?? 'bg-gray-100 text-gray-600';

  return (
    <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

function FileIcon({ mime }) {
  if (!mime) return <span className="text-gray-300">📄</span>;
  if (mime.startsWith('image/')) return <span>🖼</span>;
  if (mime.startsWith('video/')) return <span>🎬</span>;
  if (mime === 'application/pdf') return <span>📕</span>;
  return <span className="text-gray-400">📄</span>;
}

const TYPE_FILTERS = ['all', 'image', 'video', 'other'];

export default function AssetsClient({ initialAssets }) {
  const [assets, setAssets] = useState(initialAssets || []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/assets', {
        method: 'POST',
        body: formData,
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || 'Upload failed');
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

  const filtered = assets.filter((a) => {
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'image' && a.mime_type?.startsWith('image/')) ||
      (typeFilter === 'video' && a.mime_type?.startsWith('video/')) ||
      (typeFilter === 'other' && !a.mime_type?.startsWith('image/') && !a.mime_type?.startsWith('video/'));

    const matchesSearch =
      !search ||
      getFileName(a.object_path).toLowerCase().includes(search.toLowerCase());

    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Upload bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-900">Upload asset</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Stored in private bucket &quot;signage-assets&quot;. Supported: images, videos, PDFs.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-xs flex-shrink-0">
          <span className={`rounded px-3 py-2 cursor-pointer text-sm transition-colors ${
            uploading
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}>
            {uploading ? 'Uploading…' : '+ Upload file'}
          </span>
          <input
            type="file"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
            accept="image/*,video/*,application/pdf"
          />
        </label>
      </div>

      {error && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Filters & search */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setTypeFilter(f)}
              className={`px-3 py-1 rounded-full text-xs transition-colors capitalize ${
                typeFilter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
          <span className="ml-2 text-xs text-gray-400">{filtered.length} file{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <input
          type="text"
          placeholder="Search by filename…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-gray-200 px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-blue-300"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">File</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Type</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Size</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">Uploaded</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none"><FileIcon mime={a.mime_type} /></span>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 font-medium truncate max-w-xs" title={a.object_path}>
                        {getFileName(a.object_path)}
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-xs">{a.object_path}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5"><MimeBadge mime={a.mime_type} /></td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{formatBytes(a.bytes)}</td>
                <td className="px-4 py-2.5 text-xs text-gray-500">
                  {a.created_at ? formatDateTime(a.created_at) : '—'}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {(a.mime_type?.startsWith('image/') || a.mime_type === 'application/pdf') && (
                    <button
                      type="button"
                      onClick={() => preview(a)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Preview
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td className="px-4 py-8 text-center text-gray-400 text-sm" colSpan={5}>
                  {assets.length === 0 ? 'No assets yet. Upload a file to get started.' : 'No files match your filter.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
