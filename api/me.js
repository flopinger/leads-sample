import { getCookie, verifyJwt, getTenantMap } from './_utils.js';

export default async function handler(req, res) {
  const token = getCookie(req, 'auth');
  const payload = token ? verifyJwt(token) : null;
  if (!payload) return res.status(401).json({ ok: false });
  const map = getTenantMap();
  const entry = map.get(payload.user);
  return res.json({ user: payload.user, tenantName: entry?.tenantName || payload.tenantName || payload.user.toUpperCase() });
}


