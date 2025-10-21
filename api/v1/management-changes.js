export const config = { runtime: 'nodejs' };
import { getSupabaseAdmin } from '../_supabase.js';
import fs from 'fs';
import path from 'path';

// Load management changes data from JSON file
let managementData = null;
function loadManagementData() {
  if (!managementData) {
    try {
      const filePath = path.join(process.cwd(), 'public', 'management-changes.json');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      managementData = JSON.parse(fileContent);
    } catch (error) {
      console.error('Error loading management changes data:', error);
      managementData = [];
    }
  }
  return managementData;
}

// API Key authentication
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

  const { search, dateFrom, dateTo, limit = 100, offset = 0 } = req.query;

  try {
    // Load management changes from JSON
    const allChanges = loadManagementData();
    
    // Apply filters
    let filtered = allChanges;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(c => 
        c.company_name?.toLowerCase().includes(searchLower) ||
        c.city?.toLowerCase().includes(searchLower) ||
        c.manager_name?.toLowerCase().includes(searchLower)
      );
    }
    
    if (dateFrom) {
      filtered = filtered.filter(c => c.change_date >= dateFrom);
    }
    
    if (dateTo) {
      filtered = filtered.filter(c => c.change_date <= dateTo);
    }

    // Apply pagination
    const limitNum = Math.min(parseInt(limit) || 100, 1000);
    const offsetNum = parseInt(offset) || 0;
    const total = filtered.length;
    const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

    // Increment usage
    const apiKey = req.headers['x-api-key'];
    await incrementUsage(apiKey, paginated.length);

    return res.json({
      metadata: {
        total: total,
        returned: paginated.length,
        offset: offsetNum,
        limit: limitNum,
        filters: {
          search: search || null,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null
        }
      },
      data: paginated
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
