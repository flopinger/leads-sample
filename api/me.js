export const config = { runtime: 'nodejs' };
import { getCookie, verifyJwt, getTenantMapAsync } from './_utils.js';
import { getSupabaseAdmin } from './_supabase.js';

export default async function handler(req, res) {
  const token = getCookie(req, 'auth');
  const payload = token ? verifyJwt(token) : null;
  if (!payload) return res.status(401).json({ ok: false });
  
  const map = await getTenantMapAsync();
  const entry = map.get(payload.user);
  
  // Fetch API data from Supabase
  const supabase = getSupabaseAdmin();
  let apiData = {};
  
  if (supabase) {
    try {
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('api_key, api_usage, api_limit, api_validto, logo_file, user_language')
        .eq('username', payload.user)
        .maybeSingle();
      
      if (!error && tenant) {
        apiData = {
          apiKey: tenant.api_key,
          apiUsage: tenant.api_usage,
          apiLimit: tenant.api_limit,
          apiValidTo: tenant.api_validto,
          logoFile: tenant.logo_file,
          userLanguage: tenant.user_language || 'en'
        };
      }
    } catch (error) {
      console.error('Error fetching API data:', error);
    }
  }
  
  return res.json({ 
    user: payload.user, 
    tenantName: entry?.tenantName || payload.tenantName || payload.user.toUpperCase(),
    ...apiData
  });
}


