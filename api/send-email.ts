import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, service, budget, message } = req.body ?? {};

  if (!name || !email || !service || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await resend.emails.send({
      from: 'Ninety Six <onboarding@resend.dev>',
      to: '96mrkt@gmail.com',
      replyTo: email,
      subject: `New brief from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nService: ${service}\nBudget: ${budget || 'Not specified'}\n\n${message}`,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
