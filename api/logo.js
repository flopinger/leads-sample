import { getCookie, verifyJwt, getTenantMap, resolveAsset } from './_utils.js';
import fs from 'fs';

export default async function handler(req, res) {
  const token = getCookie(req, 'auth');
  const payload = token ? verifyJwt(token) : null;
  if (!payload) return res.status(401).end();
  const map = getTenantMap();
  const entry = map.get(payload.user);
  if (!entry) return res.status(404).end();
  const p = resolveAsset(entry.logoFile);
  if (!p) return res.status(404).end();
  res.setHeader('Cache-Control', 'no-store');
  fs.createReadStream(p).pipe(res);
}


