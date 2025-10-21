export const config = { runtime: 'nodejs' };
import { getSupabaseAdmin } from '../_supabase.js';

// API Key authentication middleware
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

  // Check expiry
  if (tenant.api_validto) {
    const validTo = new Date(tenant.api_validto);
    if (validTo < new Date()) {
      return { error: 'API key expired', status: 403 };
    }
  }

  // Check limit
  if (tenant.api_limit && tenant.api_usage >= tenant.api_limit) {
    return { error: 'API limit reached', status: 429 };
  }

  return { tenant };
}

// Increment API usage
async function incrementUsage(apiKey, count) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  try {
    const { data } = await supabase.rpc('increment_api_usage', {
      p_api_key: apiKey,
      p_count: count
    });
    return data;
  } catch (error) {
    console.error('Error incrementing usage:', error);
  }
}

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate
  const auth = await authenticateApiKey(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const supabase = getSupabaseAdmin();
  const { search, city, zipCode, concept, limit = 100, offset = 0 } = req.query;

  try {
    // Build query
    let query = supabase
      .from('workshops')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,zip_code.ilike.%${search}%`);
    }
    if (city) {
      query = query.eq('city', city);
    }
    if (zipCode) {
      query = query.eq('zip_code', zipCode);
    }
    if (concept) {
      // Try both possible column names for concepts
      query = query.or(`concepts_networks.cs.{${concept}},concepts.cs.{${concept}}`);
    }

    // Apply pagination
    const limitNum = Math.min(parseInt(limit) || 100, 1000);
    const offsetNum = parseInt(offset) || 0;
    query = query.range(offsetNum, offsetNum + limitNum - 1);

    const { data: workshops, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      console.error('Query details:', { search, city, zipCode, concept, limit, offset });
      return res.status(500).json({ 
        error: 'Database error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // Increment usage
    const apiKey = req.headers['x-api-key'];
    await incrementUsage(apiKey, workshops.length);

    // Return response
    return res.json({
      metadata: {
        total: count,
        returned: workshops.length,
        offset: offsetNum,
        limit: limitNum
      },
      data: workshops
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

