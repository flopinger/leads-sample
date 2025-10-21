import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateAPIKey, trackAPIUsage, getRemainingQuota } from './api-middleware.js';
import { filterEmails } from '../src/utils/emailFilter.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

let supabase = null;
if (supabaseUrl && supabaseServiceRole) {
  supabase = createClient(supabaseUrl, supabaseServiceRole, {
    auth: { persistSession: false }
  });
}

// Helper function to clean data for export (same logic as frontend)
function cleanDataForExport(data) {
  if (!data) return data;
  
  const cleanedData = JSON.parse(JSON.stringify(data));
  
  // Filter emails from main email array
  if (cleanedData.email && Array.isArray(cleanedData.email)) {
    cleanedData.email = cleanedData.email.filter(email => !filterEmails([email]).length === 0);
  }
  
  // Process relationships array
  if (cleanedData.relationships && Array.isArray(cleanedData.relationships)) {
    cleanedData.relationships = cleanedData.relationships.map(rel => {
      // Rename NORTHDATA handle to HANDELSREGISTER
      if (rel.handle === 'NORTHDATA') {
        rel.handle = 'HANDELSREGISTER';
      }
      
      // Filter out fields containing *northdata* values and filter emails
      if (rel.source_data) {
        try {
          const sourceData = typeof rel.source_data === 'string' 
            ? JSON.parse(rel.source_data) 
            : rel.source_data;
          
          const cleanedSourceData = {};
          Object.keys(sourceData).forEach(key => {
            const value = sourceData[key];
            // Skip fields with *northdata* values
            if (typeof value === 'string' && value.toLowerCase().includes('*northdata*')) {
              return;
            }
            cleanedSourceData[key] = value;
          });
          
          // Filter emails from source_data
          const emailFields = ['email', 'email_1', 'email_2', 'email_3'];
          emailFields.forEach(field => {
            if (cleanedSourceData[field]) {
              delete cleanedSourceData[field];
            }
          });
          
          rel.source_data = JSON.stringify(cleanedSourceData);
        } catch (e) {
          console.warn('Failed to parse source_data for cleaning:', e);
        }
      }
      
      return rel;
    });
  }
  
  return cleanedData;
}

/**
 * GET /api/v1/workshops
 * Get workshops with filtering
 */
router.get('/workshops', authenticateAPIKey, async (req, res) => {
  try {
    const { 
      search, 
      city, 
      zipCode, 
      concept,
      limit = 100,
      offset = 0
    } = req.query;

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
      query = query.contains('concepts_networks', [concept]);
    }

    // Apply pagination
    const limitNum = Math.min(parseInt(limit) || 100, 1000); // Max 1000 per request
    const offsetNum = parseInt(offset) || 0;
    query = query.range(offsetNum, offsetNum + limitNum - 1);

    const { data: workshops, error, count } = await query;

    if (error) {
      return res.status(500).json({
        error: 'Database error',
        message: error.message
      });
    }

    // Clean data
    const cleanedWorkshops = workshops.map(w => cleanDataForExport(w));

    // Track usage
    await trackAPIUsage(req.apiTenant.username, cleanedWorkshops.length);

    // Get updated usage
    const remaining = getRemainingQuota(
      req.apiTenant.currentUsage + cleanedWorkshops.length,
      req.apiTenant.limit
    );

    // Response
    res.json({
      metadata: {
        total: count,
        returned: cleanedWorkshops.length,
        offset: offsetNum,
        limit: limitNum,
        usage: {
          current: req.apiTenant.currentUsage + cleanedWorkshops.length,
          limit: req.apiTenant.limit,
          remaining: remaining
        },
        filters: {
          search: search || null,
          city: city || null,
          zipCode: zipCode || null,
          concept: concept || null
        }
      },
      data: cleanedWorkshops
    });
  } catch (error) {
    console.error('API workshops error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/workshops/:id
 * Get single workshop by ID
 */
router.get('/workshops/:id', authenticateAPIKey, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: workshop, error } = await supabase
      .from('workshops')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !workshop) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Workshop not found'
      });
    }

    // Clean data
    const cleanedWorkshop = cleanDataForExport(workshop);

    // Track usage (1 record)
    await trackAPIUsage(req.apiTenant.username, 1);

    const remaining = getRemainingQuota(
      req.apiTenant.currentUsage + 1,
      req.apiTenant.limit
    );

    res.json({
      metadata: {
        usage: {
          current: req.apiTenant.currentUsage + 1,
          limit: req.apiTenant.limit,
          remaining: remaining
        }
      },
      data: cleanedWorkshop
    });
  } catch (error) {
    console.error('API workshop detail error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/foundings
 * Get company foundings with filtering
 */
router.get('/foundings', authenticateAPIKey, async (req, res) => {
  try {
    const { 
      search, 
      dateFrom,
      dateTo,
      limit = 100,
      offset = 0
    } = req.query;

    // Fetch foundings data
    const foundingsResponse = await fetch(`${req.protocol}://${req.get('host')}/foundings-data.json`);
    const foundingsEvents = await foundingsResponse.json();

    // Apply filters
    let filtered = foundingsEvents;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(event => 
        event.company_name?.toLowerCase().includes(searchLower) ||
        event.city?.toLowerCase().includes(searchLower)
      );
    }

    if (dateFrom) {
      filtered = filtered.filter(event => new Date(event.founding_date) >= new Date(dateFrom));
    }

    if (dateTo) {
      filtered = filtered.filter(event => new Date(event.founding_date) <= new Date(dateTo));
    }

    // Get unique workshop IDs
    const workshopIds = [...new Set(filtered.map(e => e.workshop_id))];

    // Fetch workshop data
    const { data: workshops, error } = await supabase
      .from('workshops')
      .select('*')
      .in('id', workshopIds);

    if (error) {
      return res.status(500).json({
        error: 'Database error',
        message: error.message
      });
    }

    // Clean workshops
    const cleanedWorkshops = workshops.map(w => cleanDataForExport(w));

    // Apply pagination
    const limitNum = Math.min(parseInt(limit) || 100, 1000);
    const offsetNum = parseInt(offset) || 0;
    const paginatedEvents = filtered.slice(offsetNum, offsetNum + limitNum);
    const paginatedWorkshops = cleanedWorkshops.filter(w => 
      paginatedEvents.some(e => e.workshop_id === w.id)
    );

    // Track usage (count of workshops returned)
    await trackAPIUsage(req.apiTenant.username, paginatedWorkshops.length);

    const remaining = getRemainingQuota(
      req.apiTenant.currentUsage + paginatedWorkshops.length,
      req.apiTenant.limit
    );

    res.json({
      metadata: {
        total: filtered.length,
        returned: paginatedEvents.length,
        workshops: paginatedWorkshops.length,
        offset: offsetNum,
        limit: limitNum,
        usage: {
          current: req.apiTenant.currentUsage + paginatedWorkshops.length,
          limit: req.apiTenant.limit,
          remaining: remaining
        },
        filters: {
          search: search || null,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null
        }
      },
      data: {
        events: paginatedEvents,
        workshops: paginatedWorkshops
      }
    });
  } catch (error) {
    console.error('API foundings error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/management-changes
 * Get management changes with filtering
 */
router.get('/management-changes', authenticateAPIKey, async (req, res) => {
  try {
    const { 
      search, 
      dateFrom,
      dateTo,
      limit = 100,
      offset = 0
    } = req.query;

    // Fetch management changes data
    const changesResponse = await fetch(`${req.protocol}://${req.get('host')}/management-changes.json`);
    const managementEvents = await changesResponse.json();

    // Apply filters
    let filtered = managementEvents;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(event => 
        event.company_name?.toLowerCase().includes(searchLower) ||
        event.city?.toLowerCase().includes(searchLower)
      );
    }

    if (dateFrom) {
      filtered = filtered.filter(event => new Date(event.event_date) >= new Date(dateFrom));
    }

    if (dateTo) {
      filtered = filtered.filter(event => new Date(event.event_date) <= new Date(dateTo));
    }

    // Get unique workshop IDs
    const workshopIds = [...new Set(filtered.map(e => e.workshop_id))];

    // Fetch workshop data
    const { data: workshops, error } = await supabase
      .from('workshops')
      .select('*')
      .in('id', workshopIds);

    if (error) {
      return res.status(500).json({
        error: 'Database error',
        message: error.message
      });
    }

    // Clean workshops
    const cleanedWorkshops = workshops.map(w => cleanDataForExport(w));

    // Apply pagination
    const limitNum = Math.min(parseInt(limit) || 100, 1000);
    const offsetNum = parseInt(offset) || 0;
    const paginatedEvents = filtered.slice(offsetNum, offsetNum + limitNum);
    const paginatedWorkshops = cleanedWorkshops.filter(w => 
      paginatedEvents.some(e => e.workshop_id === w.id)
    );

    // Track usage (count of workshops returned)
    await trackAPIUsage(req.apiTenant.username, paginatedWorkshops.length);

    const remaining = getRemainingQuota(
      req.apiTenant.currentUsage + paginatedWorkshops.length,
      req.apiTenant.limit
    );

    res.json({
      metadata: {
        total: filtered.length,
        returned: paginatedEvents.length,
        workshops: paginatedWorkshops.length,
        offset: offsetNum,
        limit: limitNum,
        usage: {
          current: req.apiTenant.currentUsage + paginatedWorkshops.length,
          limit: req.apiTenant.limit,
          remaining: remaining
        },
        filters: {
          search: search || null,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null
        }
      },
      data: {
        events: paginatedEvents,
        workshops: paginatedWorkshops
      }
    });
  } catch (error) {
    console.error('API management changes error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/usage
 * Get current API usage statistics
 */
router.get('/usage', authenticateAPIKey, async (req, res) => {
  try {
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('api_usage, api_limit, api_validto')
      .eq('username', req.apiTenant.username)
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Database error',
        message: error.message
      });
    }

    const remaining = getRemainingQuota(tenant.api_usage || 0, tenant.api_limit);

    res.json({
      usage: {
        current: tenant.api_usage || 0,
        limit: tenant.api_limit,
        remaining: remaining,
        percentage: tenant.api_limit ? ((tenant.api_usage || 0) / tenant.api_limit * 100).toFixed(2) : null
      },
      validity: {
        validTo: tenant.api_validto,
        isExpired: tenant.api_validto ? new Date() > new Date(tenant.api_validto) : false
      }
    });
  } catch (error) {
    console.error('API usage error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;

