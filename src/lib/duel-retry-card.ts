export const DUEL_RETRY_CARD_PREFIX = 'levelup:duel_retry:';
export const DUEL_RETRY_CARD_TTL_MS = 15 * 60 * 1000;

export type DuelRetryCardPayload = {
  kind: 'duel_retry';
  version: 1;
  message: string;
  createdAt: string;
  expiresAt: string;
};

export function createDuelRetryCardContent(message: string, createdAt = new Date()) {
  const payload: DuelRetryCardPayload = {
    kind: 'duel_retry',
    version: 1,
    message: message.trim() || 'You tried to duel. Can we run it now?',
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + DUEL_RETRY_CARD_TTL_MS).toISOString()
  };

  return `${DUEL_RETRY_CARD_PREFIX}${JSON.stringify(payload)}`;
}

export function parseDuelRetryCardContent(content: string): DuelRetryCardPayload | null {
  if (!content?.startsWith(DUEL_RETRY_CARD_PREFIX)) return null;

  try {
    const payload = JSON.parse(content.slice(DUEL_RETRY_CARD_PREFIX.length));
    if (payload?.kind !== 'duel_retry' || payload?.version !== 1) return null;
    if (typeof payload.message !== 'string' || typeof payload.createdAt !== 'string' || typeof payload.expiresAt !== 'string') {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function getDuelRetryCardPreview(content: string) {
  return parseDuelRetryCardContent(content) ? 'Duel retry card' : content;
}
