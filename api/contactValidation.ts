export const CONTACT_TYPES = ['Signalement de bug', 'Message'] as const;
export const MAX_CONTACT_MESSAGE_LENGTH = 4000;

export interface ContactPayload {
  type: typeof CONTACT_TYPES[number];
  message: string;
}

export function validateContactPayload(body: unknown): ContactPayload | null {
  if (!body || typeof body !== 'object') return null;
  const candidate = body as Record<string, unknown>;
  if (typeof candidate.message !== 'string' || typeof candidate.type !== 'string') return null;
  const message = candidate.message.trim();
  if (!message || message.length > MAX_CONTACT_MESSAGE_LENGTH) return null;
  if (!CONTACT_TYPES.includes(candidate.type as ContactPayload['type'])) return null;
  return { type: candidate.type as ContactPayload['type'], message };
}
