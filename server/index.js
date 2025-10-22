import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieSession from 'cookie-session';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';

// Load env from server/.env explicitly
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const app = express();
const PORT = process.env.PORT || 8787;
app.set('trust proxy', 1);

app.use(helmet());
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(cookieSession({
  name: 'sess',
  keys: [process.env.SESSION_SECRET || 'dev-secret-change'],
  sameSite: 'lax',
  httpOnly: true,
}));

// Tenant credentials and logo mapping from environment
// Comma-separated lists aligned by index: USERNAMES, PASSWORDS, LOGO_FILES, TENANT_NAMES
// Example:
// TENANT_USERS=zf,auteon
// TENANT_PASSWORDS=secret1,secret2
// TENANT_LOGOS=zf-logo.svg,auteon-logo.jpg
// TENANT_NAMES=ZF,Auteon
const users = (process.env.TENANT_USERS || '').split(',').map(s => s.trim()).filter(Boolean);
const passwords = (process.env.TENANT_PASSWORDS || '').split(',').map(s => s.trim()).filter(Boolean);
const logos = (process.env.TENANT_LOGOS || '').split(',').map(s => s.trim()).filter(Boolean);
const names = (process.env.TENANT_NAMES || '').split(',').map(s => s.trim()).filter(Boolean);

const tenantMap = new Map();
users.forEach((u, i) => {
  const pwd = passwords[i];
  const logo = logos[i];
  const tenantName = names[i] || u.toUpperCase();
  if (u && pwd && logo) {
    tenantMap.set(u, { password: pwd, logoFile: logo, tenantName });
  }
});

function ensureAuth(req, res, next) {
  if (req.session && req.session.user && tenantMap.has(req.session.user)) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

app.post('/api/login', (req, res) => {
  const { user, password } = req.body || {};
  if (!user || !password) return res.status(400).json({ error: 'Missing credentials' });
  const entry = tenantMap.get(user);
  if (!entry || entry.password !== password) return res.status(401).json({ error: 'Invalid credentials' });
  req.session.user = user;
  return res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

app.get('/api/me', ensureAuth, (req, res) => {
  const entry = tenantMap.get(req.session.user);
  res.json({ user: req.session.user, tenantName: entry?.tenantName || req.session.user.toUpperCase() });
});

app.get('/api/logo', ensureAuth, (req, res) => {
  const entry = tenantMap.get(req.session.user);
  if (!entry) return res.status(404).end();
  const logoPath = path.resolve(process.cwd(), 'src', 'assets', entry.logoFile);
  if (!fs.existsSync(logoPath)) return res.status(404).end();
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(logoPath);
});

// Serve static files in production
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  // In production, serve the built index.html
  if (fs.existsSync(distPath)) {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  
  // In development, let Vite handle it
  res.status(404).send('Not found - use Vite dev server');
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

// Contact endpoint (optional SMTP)
app.post('/api/contact', ensureAuth ? (req, res) => ensureAuth(req, res, async () => {}) : async (req, res) => {})

app.post('/api/contact', async (req, res) => {
  try {
    const { name, company, email, message } = req.body || {};
    if (!name || !email) return res.status(400).json({ ok: false, error: 'Missing name or email' });

    // Configure transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      } : undefined
    });

    const to = process.env.CONTACT_TO || 'fp@auteon.de';
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@auteon.de',
      to,
      subject: 'Interesse: Zugang zu Werkstatt-Daten',
      text: `Name: ${name}\nFirma: ${company || ''}\nE-Mail: ${email}\n\nNachricht:\n${message || ''}`
    });

    return res.json({ ok: true, id: info.messageId });
  } catch (e) {
    console.error('contact error', e);
    return res.status(500).json({ ok: false, error: 'Send failed' });
  }
});


