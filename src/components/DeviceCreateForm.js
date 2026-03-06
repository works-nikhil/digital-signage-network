'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { deviceCreateSchema } from '@/lib/validation';

export default function DeviceCreateForm({ regions }) {
  const [error, setError] = useState(null);
  const [createdKey, setCreatedKey] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(deviceCreateSchema),
    defaultValues: { is_active: true },
  });

  async function onSubmit(values) {
    setError(null);
    setCreatedKey(null);

    const parsed = deviceCreateSchema.safeParse(values);
    if (!parsed.success) {
      setError('Invalid input');
      return;
    }

    const res = await fetch('/api/admin/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error || 'Failed to create device');
      return;
    }

    setCreatedKey(body.device_key);
  }

  return (
    <div className="space-y-4">
      {createdKey && (
        <div className="rounded bg-green-50 border border-green-200 p-3 text-sm">
          <p className="font-medium mb-1">
            Device key (copy and store it now – it will not be shown again):
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs break-all bg-white border px-2 py-1 rounded">
              {createdKey}
            </code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(createdKey)}
              className="text-xs px-2 py-1 rounded bg-blue-600 text-white"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 max-w-xl">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            className="block w-full rounded border px-3 py-2 text-sm"
            {...register('name')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Region</label>
          <select
            className="block w-full rounded border px-3 py-2 text-sm"
            {...register('region_id')}
          >
            <option value="">Select region</option>
            {regions?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Install location
          </label>
          <input
            className="block w-full rounded border px-3 py-2 text-sm"
            {...register('install_location')}
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm mr-3">
          <input type="checkbox" {...register('is_active')} />
          <span>Active</span>
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Creating…' : 'Create device'}
        </button>
      </form>
    </div>
  );
}

