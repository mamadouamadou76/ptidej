import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, message } = req.body as { type?: string; message?: string };

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message requis' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Configuration serveur manquante' });
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: "P'tit Déj — Formulaire", email: 'mamadouamadou76@gmail.com' },
      to: [{ email: 'mamadouamadou76@gmail.com', name: 'Mamadou' }],
      subject: `${type ?? 'Message'} — P'tit Déj`,
      textContent: message.trim(),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Brevo error:', err);
    return res.status(502).json({ error: 'Échec envoi email' });
  }

  return res.status(200).json({ ok: true });
}
