import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { assetInsertSchema } from '@/lib/validation';
import { uploadToSignageAssets, SIGNAGE_ASSETS_BUCKET } from '@/lib/s3-storage';

export async function POST(request) {
  const { ok, status, supabase, session } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status });
  }

  const contentType = request.headers.get('content-type') || '';

  // Multipart: upload file via S3 then insert asset row
  if (contentType.includes('multipart/form-data')) {
    let formData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }

    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file in form (field name: file)' }, { status: 400 });
    }

    const objectPath = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const mimeType = file.type || 'application/octet-stream';
    const bytes = file.size;

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      await uploadToSignageAssets(objectPath, buffer, { contentType: mimeType });
    } catch (uploadErr) {
      const message = uploadErr.message || 'S3 upload failed';
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const { data, error } = await supabase
      .from('assets')
      .insert({
        bucket: SIGNAGE_ASSETS_BUCKET,
        object_path: objectPath,
        mime_type: mimeType,
        bytes,
        checksum: null,
        created_by: session.user.id,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ asset: data });
  }

  // JSON: legacy flow (register existing object path only)
  const body = await request.json().catch(() => null);
  const parsed = assetInsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('assets')
    .insert({
      bucket: parsed.data.bucket,
      object_path: parsed.data.object_path,
      mime_type: parsed.data.mime_type,
      bytes: parsed.data.bytes,
      checksum: parsed.data.checksum ?? null,
      created_by: session.user.id,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ asset: data });
}

