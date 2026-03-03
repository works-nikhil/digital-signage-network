'use client';

import { useEffect, useState } from 'react';

const DEFAULT_THRESHOLD_MS = 12 * 60 * 1000; // 12 minutes

export default function StatusBadge({ lastSeenAt, isActive = true, thresholdMs = DEFAULT_THRESHOLD_MS }) {
  const [online, setOnline] = useState(null);

  useEffect(() => {
    function compute() {
      if (!isActive) {
        setOnline(false);
        return;
      }
      if (!lastSeenAt) {
        setOnline(null);
        return;
      }
      const last = new Date(lastSeenAt).getTime();
      setOnline(Date.now() - last <= thresholdMs);
    }

    compute();
    const id = setInterval(compute, 30000);
    return () => clearInterval(id);
  }, [lastSeenAt, isActive, thresholdMs]);

  if (!isActive) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
        Inactive
      </span>
    );
  }

  if (!lastSeenAt || online === null) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
        {lastSeenAt ? 'Checking…' : 'Unknown'}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
        online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {online ? 'ONLINE' : 'OFFLINE'}
    </span>
  );
}

