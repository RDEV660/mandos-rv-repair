/**
 * Local dev server — static site + admin API routes.
 * Run: npm run dev  →  http://localhost:3000
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import authHandler from './api/auth.js';
import contentHandler from './api/content.js';
import uploadHandler from './api/upload.js';
import mediaHandler from './api/media.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function mockReqRes(req, res, body) {
  const headers = {};
  const mockRes = {
    statusCode: 200,
    setHeader(k, v) { headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(obj) {
      res.writeHead(this.statusCode, { ...headers, 'Content-Type': 'application/json' });
      res.end(JSON.stringify(obj));
    },
    end(data) {
      res.writeHead(this.statusCode, headers);
      res.end(data || '');
    },
  };
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const mockReq = {
    method: req.method,
    headers: req.headers,
    body,
    url: url.pathname,
  };
  return { mockReq, mockRes };
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { resolve({}); }
    });
  });
}

function serveStatic(req, res) {
  let urlPath = new URL(req.url, `http://localhost:${PORT}`).pathname;
  if (urlPath === '/') urlPath = '/index.html';
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  const filePath = path.join(__dirname, decodeURIComponent(urlPath));
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403); return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404); return res.end('Not found');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/api/auth' && req.method === 'POST') {
    const body = await readBody(req);
    const { mockReq, mockRes } = mockReqRes(req, res, body);
    return authHandler(mockReq, mockRes);
  }
  if (url.pathname === '/api/content') {
    const body = req.method === 'PUT' ? await readBody(req) : {};
    const { mockReq, mockRes } = mockReqRes(req, res, body);
    return contentHandler(mockReq, mockRes);
  }
  if (url.pathname === '/api/upload' && req.method === 'POST') {
    const body = await readBody(req);
    const { mockReq, mockRes } = mockReqRes(req, res, body);
    return uploadHandler(mockReq, mockRes);
  }
  if (url.pathname === '/api/media' && req.method === 'GET') {
    const { mockReq, mockRes } = mockReqRes(req, res, {});
    mockReq.url = req.url;
    return mediaHandler(mockReq, mockRes);
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Mando's site + admin API → http://localhost:${PORT}`);
  console.log(`Owner dashboard → http://localhost:${PORT}/admin/`);
});
