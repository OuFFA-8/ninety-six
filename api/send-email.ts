import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'Server is missing RESEND_API_KEY' });
  }

  const { name, email, service, budget, message } = req.body ?? {};

  if (!name || !email || !service || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: 'Ninety Six <onboarding@resend.dev>',
      to: '96mrkt@gmail.com',
      replyTo: email,
      subject: `New brief from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nService: ${service}\nBudget: ${budget || 'Not specified'}\n\n${message}`,
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return res.status(500).json({ error: result.error.message });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend threw:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to send email' });
  }
}
