import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from .env.local in project root
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const app = express();
const PORT = process.env.PORT || 8787;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;
let supabase = null;

if (supabaseUrl && supabaseServiceRole) {
  supabase = createClient(supabaseUrl, supabaseServiceRole, {
    auth: { persistSession: false }
  });
  console.log('✅ Supabase connected:', supabaseUrl);
} else {
  console.warn('⚠️  Supabase credentials not found. Using fallback auth.');
}

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(cookieParser());

// JWT helpers
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'dev-secret-change';

function signJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyJwt(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Middleware to check authentication
function ensureAuth(req, res, next) {
  const token = req.cookies.auth;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  const decoded = verifyJwt(token);
  if (!decoded) return res.status(401).json({ error: 'Invalid token' });
  
  req.user = decoded;
  next();
}

// Login endpoint with Supabase
app.post('/api/login', async (req, res) => {
  try {
    const { user, password } = req.body || {};
    const username = (user || '').trim();

    if (!username || !password) {
      return res.status(400).json({ ok: false, error: 'Missing credentials' });
    }

    // Try Supabase first
    let entry = null;
    if (supabase) {
      const { data, error } = await supabase
        .from('tenants')
        .select('password, tenant_name, active')
        .eq('username', username)
        .maybeSingle();

      if (!error && data && data.active !== false) {
        entry = { password: data.password, tenantName: data.tenant_name };
      }
    }

    // Check password
    if (!entry || entry.password !== password) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = signJwt({ user: username, tenantName: entry.tenantName });
    
    // Set cookie
    res.cookie('auth', token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      sameSite: 'lax',
      path: '/'
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  res.clearCookie('auth', { path: '/' });
  res.json({ ok: true });
});

// Me endpoint - includes API data
app.get('/api/me', ensureAuth, async (req, res) => {
  try {
    // Fetch API key and usage data from Supabase
    if (supabase) {
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('api_key, api_usage, api_limit, api_validto')
        .eq('username', req.user.user)
        .single();

      if (!error && tenant) {
        return res.json({
          user: req.user.user,
          tenantName: req.user.tenantName || req.user.user.toUpperCase(),
          apiKey: tenant.api_key,
          apiUsage: tenant.api_usage,
          apiLimit: tenant.api_limit,
          apiValidTo: tenant.api_validto
        });
      }
    }

    // Fallback without API data
    res.json({
      user: req.user.user,
      tenantName: req.user.tenantName || req.user.user.toUpperCase()
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.json({
      user: req.user.user,
      tenantName: req.user.tenantName || req.user.user.toUpperCase()
    });
  }
});

// Logo endpoint
app.get('/api/logo', ensureAuth, async (req, res) => {
  try {
    // Get tenant info from Supabase
    if (supabase) {
      const { data, error } = await supabase
        .from('tenants')
        .select('logo_file')
        .eq('username', req.user.user)
        .maybeSingle();

      if (!error && data && data.logo_file) {
        const logoPath = path.resolve(__dirname, '../src/assets', data.logo_file);
        if (fs.existsSync(logoPath)) {
          res.setHeader('Cache-Control', 'no-store');
          return res.sendFile(logoPath);
        }
      }
    }
    
    return res.status(404).end();
  } catch (error) {
    console.error('Logo error:', error);
    return res.status(500).end();
  }
});

// Contact endpoint (placeholder)
app.post('/api/contact', async (req, res) => {
  try {
    const { name, company, email, message } = req.body || {};
    if (!name || !email) {
      return res.status(400).json({ ok: false, error: 'Missing name or email' });
    }
    
    console.log('Contact form submission:', { name, company, email, message });
    return res.json({ ok: true, id: 'local-dev-' + Date.now() });
  } catch (error) {
    console.error('Contact error:', error);
    return res.status(500).json({ ok: false, error: 'Send failed' });
  }
});

// Import API routes
import apiRoutes from './api-routes.js';

// Mount API v1 routes
app.use('/api/v1', apiRoutes);

app.listen(PORT, () => {
  console.log('🚀 Local API server running on http://localhost:' + PORT);
  console.log('📡 Frontend should be on http://localhost:5173');
  console.log('🔑 Supabase URL:', supabaseUrl || 'Not configured');
  console.log('📚 API Documentation: http://localhost:5173/api-docs');
  console.log('🔌 API Endpoints:');
  console.log('   GET  /api/v1/workshops');
  console.log('   GET  /api/v1/workshops/:id');
  console.log('   GET  /api/v1/foundings');
  console.log('   GET  /api/v1/management-changes');
  console.log('   GET  /api/v1/usage');
});

