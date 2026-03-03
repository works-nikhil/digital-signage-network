'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { regionSchema } from '@/lib/validation';

export default function RegionForm({ initialValues }) {
  const router = useRouter();
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(regionSchema),
    defaultValues: initialValues || {
      name: '',
      language_code: 'en',
      timezone: 'Asia/Kolkata',
    },
  });

  async function onSubmit(values) {
    setError(null);
    const parsed = regionSchema.safeParse(values);
    if (!parsed.success) {
      setError('Invalid input');
      return;
    }

    const method = initialValues ? 'PUT' : 'POST';
    const url = initialValues
      ? `/api/regions/${initialValues.id}`
      : '/api/regions';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error || 'Failed to save region');
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {error && (
        <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-xs">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          className="block w-full rounded border px-3 py-2 text-sm"
          {...register('name')}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            Language code
          </label>
          <input
            className="block w-full rounded border px-3 py-2 text-sm"
            {...register('language_code')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Timezone</label>
          <input
            className="block w-full rounded border px-3 py-2 text-sm"
            {...register('timezone')}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {initialValues ? 'Update region' : 'Create region'}
      </button>
    </form>
  );
}

