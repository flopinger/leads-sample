import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

let supabase = null;
if (supabaseUrl && supabaseServiceRole) {
  supabase = createClient(supabaseUrl, supabaseServiceRole, {
    auth: { persistSession: false }
  });
}

/**
 * Middleware to authenticate API requests using API key
 */
export async function authenticateAPIKey(req, res, next) {
  try {
    // Get API key from header
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        message: 'Please provide an API key in the X-API-Key header or Authorization Bearer token'
      });
    }

    if (!supabase) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Database connection not available'
      });
    }

    // Validate API key in database
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('username, tenant_name, api_key, api_usage, api_limit, api_validto, active')
      .eq('api_key', apiKey)
      .maybeSingle();

    if (error || !tenant) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is not valid'
      });
    }

    // Check if tenant is active
    if (!tenant.active) {
      return res.status(403).json({
        error: 'Account inactive',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Check validity date
    if (tenant.api_validto) {
      const validTo = new Date(tenant.api_validto);
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Compare dates only, not time
      
      if (now > validTo) {
        return res.status(403).json({
          error: 'API key expired',
          message: `Your API key expired on ${validTo.toISOString().split('T')[0]}. Please contact support to renew.`,
          validTo: tenant.api_validto
        });
      }
    }

    // Check usage limit (will be checked again after counting records)
    if (tenant.api_limit !== null && tenant.api_limit !== undefined) {
      const currentUsage = tenant.api_usage || 0;
      if (currentUsage >= tenant.api_limit) {
        return res.status(429).json({
          error: 'API limit reached',
          message: `You have reached your API limit of ${tenant.api_limit} records.`,
          usage: currentUsage,
          limit: tenant.api_limit
        });
      }
    }

    // Attach tenant info to request
    req.apiTenant = {
      username: tenant.username,
      tenantName: tenant.tenant_name,
      apiKey: tenant.api_key,
      currentUsage: tenant.api_usage || 0,
      limit: tenant.api_limit,
      validTo: tenant.api_validto
    };

    next();
  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during authentication'
    });
  }
}

/**
 * Update API usage counter in database
 */
export async function trackAPIUsage(username, recordCount) {
  if (!supabase || !username || !recordCount) return;

  try {
    // Increment usage counter
    const { error } = await supabase.rpc('increment_api_usage', {
      p_username: username,
      p_count: recordCount
    });

    if (error) {
      // If RPC doesn't exist, fallback to manual update
      const { data: current } = await supabase
        .from('tenants')
        .select('api_usage')
        .eq('username', username)
        .single();

      const newUsage = (current?.api_usage || 0) + recordCount;

      await supabase
        .from('tenants')
        .update({ api_usage: newUsage })
        .eq('username', username);
    }
  } catch (error) {
    console.error('Error tracking API usage:', error);
  }
}

/**
 * Check if adding records would exceed limit
 */
export function wouldExceedLimit(currentUsage, limit, recordCount) {
  if (limit === null || limit === undefined) return false;
  return (currentUsage + recordCount) > limit;
}

/**
 * Get remaining API quota
 */
export function getRemainingQuota(currentUsage, limit) {
  if (limit === null || limit === undefined) return null;
  return Math.max(0, limit - currentUsage);
}

/**
 * Create RPC function in Supabase for atomic usage increment
 * Run this SQL in Supabase SQL Editor:
 * 
 * CREATE OR REPLACE FUNCTION increment_api_usage(p_username text, p_count bigint)
 * RETURNS void AS $$
 * BEGIN
 *   UPDATE tenants 
 *   SET api_usage = COALESCE(api_usage, 0) + p_count
 *   WHERE username = p_username;
 * END;
 * $$ LANGUAGE plpgsql;
 */

