'use client';

import { useEffect, useState } from 'react';
import { formatDateTime } from '@/lib/formatDate';

function formatRelative(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return formatDateTime(dateStr);
}

export default function LastSeen({ lastSeenAt }) {
  const [text, setText] = useState(() => formatRelative(lastSeenAt));

  useEffect(() => {
    setText(formatRelative(lastSeenAt));
    const id = setInterval(() => setText(formatRelative(lastSeenAt)), 60000);
    return () => clearInterval(id);
  }, [lastSeenAt]);

  return <span className="text-gray-700">{text}</span>;
}
