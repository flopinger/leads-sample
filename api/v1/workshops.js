export const config = { runtime: 'nodejs' };
import { getSupabaseAdmin } from '../_supabase.js';
import fs from 'fs';
import path from 'path';

// Load workshop data from JSON file
let workshopsData = null;
function loadWorkshopsData() {
  if (!workshopsData) {
    try {
      const filePath = path.join(process.cwd(), 'public', 'werkstatt-adressen-filtered-750.json');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      workshopsData = JSON.parse(fileContent);
    } catch (error) {
      console.error('Error loading workshops data:', error);
      workshopsData = [];
    }
  }
  return workshopsData;
}

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

// Helper to extract concepts from relationships
function extractConcepts(workshop) {
  const concepts = [];
  
  if (workshop.relationships && Array.isArray(workshop.relationships)) {
    for (const rel of workshop.relationships) {
      if (rel.handle === 'AUTOCREW') {
        try {
          const data = typeof rel.source_data === 'string' ? JSON.parse(rel.source_data) : rel.source_data;
          if (data.concept) {
            concepts.push(data.concept);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }
  
  return concepts;
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

  const { search, city, zipCode, concept, limit = 100, offset = 0 } = req.query;

  try {
    // Load workshops from JSON
    const allWorkshops = loadWorkshopsData();
    
    // Apply filters
    let filtered = allWorkshops;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(w => 
        w.name?.toLowerCase().includes(searchLower) ||
        w.city?.toLowerCase().includes(searchLower) ||
        w.zip_code?.toLowerCase().includes(searchLower)
      );
    }
    
    if (city) {
      filtered = filtered.filter(w => w.city === city);
    }
    
    if (zipCode) {
      filtered = filtered.filter(w => w.zip_code === zipCode);
    }
    
    if (concept) {
      filtered = filtered.filter(w => {
        const concepts = extractConcepts(w);
        return concepts.some(c => c.includes(concept));
      });
    }

    // Apply pagination
    const limitNum = Math.min(parseInt(limit) || 100, 1000);
    const offsetNum = parseInt(offset) || 0;
    const total = filtered.length;
    const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

    // Increment usage
    const apiKey = req.headers['x-api-key'];
    await incrementUsage(apiKey, paginated.length);

    // Return response
    return res.json({
      metadata: {
        total: total,
        returned: paginated.length,
        offset: offsetNum,
        limit: limitNum,
        filters: {
          search: search || null,
          city: city || null,
          zipCode: zipCode || null,
          concept: concept || null
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

