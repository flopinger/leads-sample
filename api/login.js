export const config = { runtime: 'nodejs' };
import { getTenantMapAsync, signJwt, setCookie } from './_utils.js';
import { getSupabaseAdmin } from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  // Parse JSON body (Vercel Node functions liefern keinen auto-geparsten Body)
  const raw = await new Promise((resolve) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => resolve(body));
  });
  let parsed = {};
  try { parsed = raw ? JSON.parse(raw) : {}; } catch {}
  const { user, password } = parsed || {};
  const username = (user || '').trim();

  // Prefer direkte Abfrage aus Supabase (robuster als Full-Table-Load)
  let entry = null;
  const supa = getSupabaseAdmin();
  if (supa && username) {
    const { data, error } = await supa
      .from('tenants')
      .select('password, tenant_name, active')
      .eq('username', username)
      .maybeSingle();
    if (!error && data && data.active !== false) {
      entry = { password: data.password, tenantName: data.tenant_name };
    }
  }
  if (!entry) {
    const map = await getTenantMapAsync();
    entry = map.get(username);
  }
  if (!entry || entry.password !== password) return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  const token = signJwt({ user: username, tenantName: entry.tenantName });
  setCookie(res, 'auth', token, { maxAge: 60 * 60 * 24 * 7 });
  return res.json({ ok: true });
}


