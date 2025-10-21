export const config = { runtime: 'nodejs' };
import { getSupabaseAdmin } from '../_supabase.js';

// API Key authentication (same as workshops.js)
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

  if (tenant.api_validto) {
    const validTo = new Date(tenant.api_validto);
    if (validTo < new Date()) {
      return { error: 'API key expired', status: 403 };
    }
  }

  if (tenant.api_limit && tenant.api_usage >= tenant.api_limit) {
    return { error: 'API limit reached', status: 429 };
  }

  return { tenant };
}

async function incrementUsage(apiKey, count) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  try {
    await supabase.rpc('increment_api_usage', {
      p_api_key: apiKey,
      p_count: count
    });
  } catch (error) {
    console.error('Error incrementing usage:', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await authenticateApiKey(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const supabase = getSupabaseAdmin();
  const { search, dateFrom, dateTo, limit = 100, offset = 0 } = req.query;

  try {
    let query = supabase
      .from('events')
      .select('*, workshop:workshops(*)', { count: 'exact' })
      .eq('event_type', 'founding');

    if (search) {
      query = query.or(`company_name.ilike.%${search}%,city.ilike.%${search}%`);
    }
    if (dateFrom) {
      query = query.gte('event_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('event_date', dateTo);
    }

    const limitNum = Math.min(parseInt(limit) || 100, 1000);
    const offsetNum = parseInt(offset) || 0;
    query = query.range(offsetNum, offsetNum + limitNum - 1);

    const { data: events, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    const apiKey = req.headers['x-api-key'];
    await incrementUsage(apiKey, events.length);

    return res.json({
      metadata: {
        total: count,
        returned: events.length,
        offset: offsetNum,
        limit: limitNum
      },
      data: events
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

