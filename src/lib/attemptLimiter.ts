/**
 * attemptLimiter.ts — Freno progresivo para intentos repetidos (login, código
 * de verificación, reenvíos).
 *
 * IMPORTANTE: corre en el navegador, así que solo frena el uso normal y los
 * errores de tipeo repetidos; quien automatiza peticiones directas a InsForge lo
 * salta. La protección real contra fuerza bruta debe estar en el backend.
 *
 * Tras `maxAttempts` fallos seguidos se bloquea `baseLockMs`, y el bloqueo se
 * duplica con cada fallo adicional hasta `maxLockMs`. Si pasa `resetAfterMs`
 * sin fallos, el contador se reinicia.
 */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LimiterOptions {
  maxAttempts?: number;
  baseLockMs?: number;
  maxLockMs?: number;
  resetAfterMs?: number;
  now?: () => number;
}

interface LimiterState {
  failures: number;
  lastFailure: number;
  lockedUntil: number;
}

export interface LimiterCheck {
  allowed: boolean;
  retryAfterMs: number;
}

const memoryStore = (): KeyValueStore => {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k)
  };
};

/** Almacenamiento del navegador con respaldo en memoria si no está disponible. */
export function browserStore(): KeyValueStore {
  const fallback = memoryStore();
  return {
    getItem(k) {
      try { return localStorage.getItem(k); } catch (_) { return fallback.getItem(k); }
    },
    setItem(k, v) {
      try { localStorage.setItem(k, v); } catch (_) { fallback.setItem(k, v); }
    },
    removeItem(k) {
      try { localStorage.removeItem(k); } catch (_) { fallback.removeItem(k); }
    }
  };
}

export function createAttemptLimiter(
  store: KeyValueStore,
  action: string,
  identity: string,
  options: LimiterOptions = {}
) {
  const {
    maxAttempts = 5,
    baseLockMs = 30_000,
    maxLockMs = 15 * 60_000,
    resetAfterMs = 15 * 60_000,
    now = Date.now
  } = options;
  const key = `tapasel_rl:${action}:${identity.trim().toLowerCase()}`;

  const read = (): LimiterState => {
    try {
      const raw = store.getItem(key);
      if (raw) {
        const s = JSON.parse(raw) as LimiterState;
        if (Number.isFinite(s.failures) && Number.isFinite(s.lockedUntil)) return s;
      }
    } catch (_) { /* estado corrupto: se ignora */ }
    return { failures: 0, lastFailure: 0, lockedUntil: 0 };
  };

  return {
    /** ¿Se puede intentar ahora? Si no, cuánto falta. */
    check(): LimiterCheck {
      const s = read();
      const t = now();
      if (s.lockedUntil > t) return { allowed: false, retryAfterMs: s.lockedUntil - t };
      if (s.failures > 0 && t - s.lastFailure > resetAfterMs) store.removeItem(key);
      return { allowed: true, retryAfterMs: 0 };
    },
    /** Registra un intento fallido y aplica el bloqueo si corresponde. */
    recordFailure(): LimiterCheck {
      let s = read();
      const t = now();
      if (s.failures > 0 && t - s.lastFailure > resetAfterMs) {
        s = { failures: 0, lastFailure: 0, lockedUntil: 0 };
      }
      const failures = s.failures + 1;
      let lockedUntil = 0;
      if (failures >= maxAttempts) {
        lockedUntil = t + Math.min(baseLockMs * 2 ** (failures - maxAttempts), maxLockMs);
      }
      try { store.setItem(key, JSON.stringify({ failures, lastFailure: t, lockedUntil })); } catch (_) { /* sin persistencia */ }
      return lockedUntil > t ? { allowed: false, retryAfterMs: lockedUntil - t } : { allowed: true, retryAfterMs: 0 };
    },
    /** Limpia el contador tras un intento correcto. */
    reset() {
      store.removeItem(key);
    }
  };
}

/** Texto para el usuario: "Demasiados intentos. Intente de nuevo en 45 s." */
export function formatLockMessage(retryAfterMs: number): string {
  const secs = Math.ceil(retryAfterMs / 1000);
  const wait = secs >= 60 ? `${Math.ceil(secs / 60)} min` : `${secs} s`;
  return `Demasiados intentos. Intente de nuevo en ${wait}.`;
}
