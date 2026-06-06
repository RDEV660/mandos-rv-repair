export const BLOB_ACCESS = 'private';

export function mediaUrl(pathname) {
  return `/api/media?pathname=${encodeURIComponent(pathname)}`;
}

export async function streamToText(stream) {
  const reader = stream.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}
