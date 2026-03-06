import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const BUCKET = 'signage-assets';

function getS3Client() {
  const endpoint = process.env.SUPABASE_S3_ENDPOINT;
  const accessKeyId = process.env.SUPABASE_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SUPABASE_S3_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Missing S3 env: SUPABASE_S3_ENDPOINT, SUPABASE_S3_ACCESS_KEY_ID, SUPABASE_S3_SECRET_ACCESS_KEY'
    );
  }

  return new S3Client({
    region: 'us-east-1',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

/**
 * Upload a file to the signage-assets bucket via Supabase S3-compatible API.
 * @param {string} objectPath - Object key (e.g. "1234567890-filename.pdf")
 * @param {Buffer | Uint8Array | Blob} body - File contents
 * @param {{ contentType?: string }} options - Optional Content-Type
 * @returns {Promise<void>}
 */
export async function uploadToSignageAssets(objectPath, body, options = {}) {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: objectPath,
    Body: body,
    ContentType: options.contentType || 'application/octet-stream',
  });
  await client.send(command);
}

export { BUCKET as SIGNAGE_ASSETS_BUCKET };
