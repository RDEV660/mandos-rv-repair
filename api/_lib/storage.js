import fs from 'fs';
import path from 'path';
import { put, get } from '@vercel/blob';
import { BLOB_ACCESS, streamToText } from './blob.js';
import siteContentDefault from '../../data/site-content.json' with { type: 'json' };

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
    const result = await get(BLOB_PATHNAME, {
      access: BLOB_ACCESS,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return JSON.parse(await streamToText(result.stream));
  } catch {
    return null;
  }
}

async function readFromStatic() {
  const host = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.SITE_URL || 'http://localhost:3000';
  const res = await fetch(`${host}/data/site-content.json`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

async function writeToBlob(data) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return false;
  await put(BLOB_PATHNAME, JSON.stringify(data), {
    access: BLOB_ACCESS,
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    allowOverwrite: true,
  });
  return true;
}

export async function getContent() {
  const fromBlob = await readFromBlob();
  if (fromBlob) return fromBlob;

  // Local dev: prefer live saves on disk
  if (process.env.VERCEL !== '1') {
    const livePath = path.join(process.cwd(), LIVE_FILE);
    if (fs.existsSync(livePath)) {
      try {
        return readJsonFile(LIVE_FILE);
      } catch {
        /* fall through */
      }
    }
    try {
      return readJsonFile(DEFAULT_FILE);
    } catch {
      /* fall through */
    }
  }

  // Vercel: bundled default, then static file on same deployment
  try {
    const fromStatic = await readFromStatic();
    if (fromStatic) return fromStatic;
  } catch {
    /* fall through */
  }

  return siteContentDefault;
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
