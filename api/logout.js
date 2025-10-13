export const config = { runtime: 'edge' };
import { clearCookie } from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  clearCookie(res, 'auth');
  return res.json({ ok: true });
}


