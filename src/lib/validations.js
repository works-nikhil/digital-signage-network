import { z } from 'zod';

export const regionSchema = z.object({
  name: z.string().min(1, 'Name required'),
  language_code: z.string().optional(),
  timezone: z.string().default('Asia/Kolkata'),
});

export const deviceSchema = z.object({
  name: z.string().min(1),
  region_id: z.number().int().positive(),
  install_location: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const playlistSchema = z.object({
  name: z.string().min(1),
  region_id: z.number().int().positive().optional().nullable(),
  is_active: z.boolean().default(true),
});

export const playlistItemSchema = z.object({
  asset_id: z.string().uuid(),
  sort_order: z.number().int().min(0).default(0),
  duration_seconds: z.number().int().min(1).default(10),
  is_active: z.boolean().default(true),
  language_code: z.string().optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
});

export const assignmentSchema = z.object({
  playlist_id: z.string().uuid(),
  priority: z.number().int().default(100),
  is_active: z.boolean().default(true),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
});

