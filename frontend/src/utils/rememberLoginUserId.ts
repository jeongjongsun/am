const STORAGE_KEY = 'am_login_remembered_user';

/** 아이디 기억하기 유지 기간 (밀리초) — 3일 */
const REMEMBER_TTL_MS = 3 * 24 * 60 * 60 * 1000;

interface StoredPayload {
  userId: string;
  expiresAt: number;
}

function parseStored(raw: string | null): StoredPayload | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (
      typeof v !== 'object' ||
      v === null ||
      typeof (v as StoredPayload).userId !== 'string' ||
      typeof (v as StoredPayload).expiresAt !== 'number'
    ) {
      return null;
    }
    return v as StoredPayload;
  } catch {
    return null;
  }
}

/** 만료되지 않은 저장 아이디가 있으면 반환하고, 만료·손상 시 항목을 제거한다. */
export function readRememberedLoginUserId(): string | null {
  if (typeof window === 'undefined') return null;
  const parsed = parseStored(window.localStorage.getItem(STORAGE_KEY));
  if (!parsed) {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
  if (Date.now() > parsed.expiresAt) {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
  const id = parsed.userId.trim();
  return id.length > 0 ? id : null;
}

export function writeRememberedLoginUserId(userId: string): void {
  if (typeof window === 'undefined') return;
  const id = userId.trim();
  if (!id) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  const payload: StoredPayload = {
    userId: id,
    expiresAt: Date.now() + REMEMBER_TTL_MS,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearRememberedLoginUserId(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
