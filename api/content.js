import { verifyToken } from './_lib/auth.js';
import { getContent, saveContent } from './_lib/storage.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const content = await getContent();
      return res.status(200).json(content);
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to load content' });
    }
  }

  if (req.method === 'PUT') {
    if (!verifyToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const meta = await saveContent(req.body);
      return res.status(200).json({ ok: true, ...meta });
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to save content' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
