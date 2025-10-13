export const config = { runtime: 'nodejs' };
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { name, company, email, message } = req.body || {};
    if (!name || !email) return res.status(400).json({ ok: false, error: 'Missing fields' });

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
    console.error('vercel contact error', e);
    return res.status(500).json({ ok: false, error: 'Send failed' });
  }
}


