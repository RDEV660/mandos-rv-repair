import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { verifyToken } from './_lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!verifyToken(req.headers.authorization)) return res.status(401).json({ error: 'Unauthorized' });

  const { filename, dataUrl, folder } = req.body || {};
  if (!filename || !dataUrl || !dataUrl.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Invalid upload payload' });
  }

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 80);
  const sub = (folder || 'uploads').replace(/[^a-zA-Z0-9/_-]/g, '');
  const base64 = dataUrl.split(',')[1];
  const buffer = Buffer.from(base64, 'base64');
  const ext = safeName.includes('.') ? '' : '.png';

  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`mandos/${sub}/${Date.now()}-${safeName}${ext}`, buffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: dataUrl.slice(5, dataUrl.indexOf(';')),
      });
      return res.status(200).json({ url: blob.url, path: blob.url });
    }

    // Local dev: save under assets/uploads
    const dir = path.join(process.cwd(), 'assets', sub);
    fs.mkdirSync(dir, { recursive: true });
    const localName = `${Date.now()}-${safeName}${ext}`;
    const full = path.join(dir, localName);
    fs.writeFileSync(full, buffer);
    const publicPath = `assets/${sub}/${localName}`;
    return res.status(200).json({ url: `/${publicPath}`, path: publicPath });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
}
