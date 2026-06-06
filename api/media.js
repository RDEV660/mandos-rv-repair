import { Readable } from 'stream';
import { get } from '@vercel/blob';
import { BLOB_ACCESS } from './_lib/blob.js';

function isAllowedPathname(pathname) {
  return typeof pathname === 'string' && /^mandos\/[a-zA-Z0-9/_\-.]+$/.test(pathname);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const pathname = url.searchParams.get('pathname');
  if (!isAllowedPathname(pathname)) {
    return res.status(400).json({ error: 'Invalid pathname' });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: 'Blob storage not configured' });
  }

  try {
    const result = await get(pathname, {
      access: BLOB_ACCESS,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return res.status(404).end();
    }

    res.setHeader('Content-Type', result.blob.contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    if (result.blob.etag) res.setHeader('ETag', result.blob.etag);

    Readable.fromWeb(result.stream).pipe(res);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to load media' });
  }
}
