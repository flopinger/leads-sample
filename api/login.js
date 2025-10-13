export const config = { runtime: 'edge' };
import { getTenantMap, signJwt, setCookie } from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { user, password } = req.body || {};
  const map = getTenantMap();
  const entry = map.get((user || '').trim());
  if (!entry || entry.password !== password) return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  const token = signJwt({ user, tenantName: entry.tenantName });
  setCookie(res, 'auth', token, { maxAge: 60 * 60 * 24 * 7 });
  return res.json({ ok: true });
}


