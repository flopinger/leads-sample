export const config = { runtime: 'nodejs' };
import { getCookie, verifyJwt, resolveAsset } from './_utils.js';
import { getSupabaseAdmin } from './_supabase.js';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const token = getCookie(req, 'auth');
  const payload = token ? verifyJwt(token) : null;
  if (!payload) return res.status(401).end();
  const username = payload.user;
  const supa = getSupabaseAdmin();
  if (!supa) return res.status(500).json({ error: 'Supabase not configured' });
  const { data, error } = await supa
    .from('tenants')
    .select('logo_file, tenant_name, active')
    .eq('username', username)
    .maybeSingle();
  if (error) return res.status(500).json({ error: 'Database error' });
  if (!data || data.active === false) return res.status(404).end();
  const p = resolveAsset(data.logo_file);
  if (!p) return res.status(404).end();
  // Set content type based on file extension
  const ext = path.extname(p).toLowerCase();
  const mime = ext === '.svg'
    ? 'image/svg+xml'
    : ext === '.png'
    ? 'image/png'
    : ext === '.jpg' || ext === '.jpeg'
    ? 'image/jpeg'
    : 'application/octet-stream';
  res.setHeader('Content-Type', mime);
  res.setHeader('Cache-Control', 'no-store');
  fs.createReadStream(p).pipe(res);
}


