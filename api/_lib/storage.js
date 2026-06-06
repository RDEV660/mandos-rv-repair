import fs from 'fs';
import path from 'path';
import { put, list } from '@vercel/blob';

const LIVE_FILE = 'data/site-content-live.json';
const DEFAULT_FILE = 'data/site-content.json';
const BLOB_PATHNAME = 'mandos/site-content.json';

function readJsonFile(filePath) {
  const full = path.join(process.cwd(), filePath);
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function writeJsonFile(filePath, data) {
  const full = path.join(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(data, null, 2), 'utf8');
}

async function readFromBlob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const { blobs } = await list({ prefix: 'mandos/', token: process.env.BLOB_READ_WRITE_TOKEN });
    const hit = blobs.find((b) => b.pathname === BLOB_PATHNAME) || blobs[0];
    if (!hit) return null;
    const res = await fetch(hit.url);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function writeToBlob(data) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return false;
  await put(BLOB_PATHNAME, JSON.stringify(data), {
    access: 'public',
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    allowOverwrite: true,
  });
  return true;
}

export async function getContent() {
  const fromBlob = await readFromBlob();
  if (fromBlob) return fromBlob;

  const livePath = path.join(process.cwd(), LIVE_FILE);
  if (fs.existsSync(livePath)) {
    try {
      return readJsonFile(LIVE_FILE);
    } catch {
      /* fall through */
    }
  }

  return readJsonFile(DEFAULT_FILE);
}

export async function saveContent(data) {
  const savedToBlob = await writeToBlob(data);
  if (!savedToBlob && process.env.VERCEL !== '1') {
    writeJsonFile(LIVE_FILE, data);
    return { storage: 'local' };
  }
  if (!savedToBlob) {
    throw new Error('Storage not configured. Add BLOB_READ_WRITE_TOKEN in Vercel environment variables.');
  }
  return { storage: 'blob' };
}
