export const config = { runtime: 'nodejs' };
import { getCookie, verifyJwt, getTenantMap, getTenantMapAsync, resolveAsset } from './_utils.js';
import { getSupabaseAdmin } from './_supabase.js';
import fs from 'fs';

export default async function handler(req, res) {
  const token = getCookie(req, 'auth');
  const payload = token ? verifyJwt(token) : null;
  if (!payload) return res.status(401).end();
  const username = payload.user;
  let entry = null;
  const supa = getSupabaseAdmin();
  if (supa) {
    const { data, error } = await supa
      .from('tenants')
      .select('logo_file, tenant_name, active')
      .eq('username', username)
      .maybeSingle();
    if (!error && data && data.active !== false) {
      entry = { logoFile: data.logo_file, tenantName: data.tenant_name };
    }
  }
  if (!entry) {
    const map = await getTenantMapAsync();
    entry = map.get(username);
  }
  if (!entry) return res.status(404).end();
  const p = resolveAsset(entry.logoFile);
  if (!p) return res.status(404).end();
  res.setHeader('Cache-Control', 'no-store');
  fs.createReadStream(p).pipe(res);
}


