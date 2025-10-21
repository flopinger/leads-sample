export const config = { runtime: 'nodejs' };
import { getSupabaseAdmin } from '../_supabase.js';

async function authenticateApiKey(req) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return { error: 'API key required', status: 401 };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { error: 'Service unavailable', status: 503 };
  }

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('username, api_usage, api_limit, api_validto, active')
    .eq('api_key', apiKey)
    .maybeSingle();

  if (error || !tenant || tenant.active === false) {
    return { error: 'Invalid API key', status: 403 };
  }

  return { tenant };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await authenticateApiKey(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { tenant } = auth;

  return res.json({
    usage: {
      current: tenant.api_usage || 0,
      limit: tenant.api_limit || null,
      remaining: tenant.api_limit ? Math.max(0, tenant.api_limit - (tenant.api_usage || 0)) : null,
      validTo: tenant.api_validto || null,
      isExpired: tenant.api_validto ? new Date(tenant.api_validto) < new Date() : false,
      isLimitReached: tenant.api_limit ? (tenant.api_usage || 0) >= tenant.api_limit : false
    }
  });
}

