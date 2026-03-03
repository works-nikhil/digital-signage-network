import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const regionSchema = z.object({
  name: z.string().min(1),
  language_code: z.string().min(2).max(10),
  timezone: z.string().min(1),
});

export const deviceCreateSchema = z.object({
  name: z.string().min(1),
  region_id: z.coerce.number().int(),
  install_location: z.string().min(1),
  is_active: z.coerce.boolean().default(true),
});

export const playlistSchema = z.object({
  name: z.string().min(1),
  region_id: z
    .union([z.coerce.number().int(), z.literal('')])
    .optional()
    .transform((v) => (v === '' ? null : v)),
  is_active: z.coerce.boolean().default(true),
});

export const playlistItemSchema = z.object({
  playlist_id: z.string().uuid(),
  asset_id: z.string().uuid(),
  sort_order: z.coerce.number().int().default(0),
  duration_seconds: z.coerce.number().int().min(1).default(10),
  is_active: z.coerce.boolean().default(true),
  language_code: z.string().optional().nullable(),
  starts_at: z.string().optional().nullable(),
  ends_at: z.string().optional().nullable(),
});

export const assignmentSchema = z.object({
  device_id: z.string().uuid(),
  playlist_id: z.string().uuid(),
  priority: z.coerce.number().int().default(100),
  is_active: z.coerce.boolean().default(true),
  starts_at: z.string().optional().nullable(),
  ends_at: z.string().optional().nullable(),
});

export const assetInsertSchema = z.object({
  bucket: z.string().min(1),
  object_path: z.string().min(1),
  mime_type: z.string().min(1),
  bytes: z.coerce.number().int().nonnegative(),
  checksum: z.string().optional().nullable(),
});

export const signUrlSchema = z.object({
  bucket: z.string().min(1),
  object_path: z.string().min(1),
});

