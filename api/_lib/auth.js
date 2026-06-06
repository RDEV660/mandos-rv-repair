import crypto from 'crypto';

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function secret() {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'change-me-in-vercel-env';
}

export function signToken() {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `admin:${exp}`;
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('hex');
  return `${exp}.${sig}`;
}

export function verifyToken(header) {
  if (!header || !header.startsWith('Bearer ')) return false;
  const token = header.slice(7);
  const [expStr, sig] = token.split('.');
  const exp = Number(expStr);
  if (!exp || !sig || Date.now() > exp) return false;
  const expected = crypto.createHmac('sha256', secret()).update(`admin:${exp}`).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function checkPassword(password) {
  const expected = process.env.ADMIN_PASSWORD || 'MandoAdmin2026!';
  if (!password || password.length !== expected.length) {
    // still run compare to reduce timing leaks when lengths differ
    const dummy = expected;
    try {
      crypto.timingSafeEqual(Buffer.from(password || ''), Buffer.from(dummy));
    } catch {
      return false;
    }
    return false;
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(password), Buffer.from(expected));
  } catch {
    return false;
  }
}
