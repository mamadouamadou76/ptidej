import { validateContactPayload } from './contactValidation';

interface ApiRequest {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}

interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): unknown;
}

const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT = 5;
const requestsByIp = new Map<string, number[]>();

function isRateLimited(req: ApiRequest): boolean {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim()
    || req.socket?.remoteAddress
    || 'unknown';
  const now = Date.now();
  const recent = (requestsByIp.get(ip) ?? []).filter(time => now - time < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return true;
  recent.push(now);
  requestsByIp.set(ip, recent);
  return false;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const payload = validateContactPayload(req.body);
  if (!payload) return res.status(400).json({ error: 'Message ou catégorie invalide' });
  if (isRateLimited(req)) return res.status(429).json({ error: 'Trop de messages. Réessayez plus tard.' });

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Configuration serveur manquante' });

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: "P'tit Déj — Formulaire", email: 'mamadouamadou76@gmail.com' },
      to: [{ email: 'mamadouamadou76@gmail.com', name: 'Mamadou' }],
      subject: `${payload.type} — P'tit Déj`,
      textContent: payload.message,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Brevo error:', err);
    return res.status(502).json({ error: 'Échec envoi email' });
  }
  return res.status(200).json({ ok: true });
}
