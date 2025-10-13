import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin } from './_supabase.js';

export function getTenantMap() {
  const map = new Map();
  const supa = getSupabaseAdmin();
  if (supa) {
    // Prefer Supabase when configured
    try {
      // @ts-ignore
      const { data, error } = supa.from('tenants').select('user,password,logo_file,tenant_name,active').eq('active', true);
      // Note: Supabase client returns a promise; but Vercel will await handler.
      // We return a placeholder map here; callers should use getTenantMapAsync when needed.
    } catch {}
  }
  const users = (process.env.TENANT_USERS || '').split(',').map(s => s.trim()).filter(Boolean);
  const passwords = (process.env.TENANT_PASSWORDS || '').split(',').map(s => s.trim()).filter(Boolean);
  const logos = (process.env.TENANT_LOGOS || '').split(',').map(s => s.trim()).filter(Boolean);
  const names = (process.env.TENANT_NAMES || '').split(',').map(s => s.trim()).filter(Boolean);
  users.forEach((u, i) => {
    const pwd = passwords[i];
    const logo = logos[i];
    const tenantName = names[i] || u.toUpperCase();
    if (u && pwd && logo) map.set(u, { password: pwd, logoFile: logo, tenantName });
  });
  return map;
}

export async function getTenantMapAsync() {
  const supa = getSupabaseAdmin();
  if (!supa) return getTenantMap();
  const map = new Map();
  const { data, error } = await supa.from('tenants').select('user,password,logo_file,tenant_name,active');
  if (!error && Array.isArray(data)) {
    data.filter(r => r.active !== false).forEach(r => {
      map.set(r.user, { password: r.password, logoFile: r.logo_file, tenantName: r.tenant_name });
    });
    return map;
  }
  return getTenantMap();
}

export function signJwt(payload) {
  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'dev-secret-change';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyJwt(token) {
  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'dev-secret-change';
  try { return jwt.verify(token, secret); } catch { return null; }
}

export function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  const match = raw.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

export function setCookie(res, name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`);
  parts.push('Path=/');
  parts.push('HttpOnly');
  parts.push('SameSite=Lax');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearCookie(res, name) {
  res.setHeader('Set-Cookie', `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
}

export function resolveAsset(file) {
  // Try src/assets first
  const p1 = path.resolve(process.cwd(), 'src', 'assets', file);
  if (fs.existsSync(p1)) return p1;
  // Fallback to public
  const p2 = path.resolve(process.cwd(), 'public', file);
  if (fs.existsSync(p2)) return p2;
  return null;
}


