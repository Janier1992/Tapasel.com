import { describe, it, expect } from 'vitest';
import { createAttemptLimiter, formatLockMessage, KeyValueStore } from './attemptLimiter';

const makeStore = (): KeyValueStore => {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

describe('createAttemptLimiter', () => {
  it('permite hasta maxAttempts-1 fallos y bloquea en el 5.º', () => {
    let t = 1_000_000;
    const l = createAttemptLimiter(makeStore(), 'login', 'a@b.co', { now: () => t });
    for (let i = 0; i < 4; i++) expect(l.recordFailure().allowed).toBe(true);
    const locked = l.recordFailure();
    expect(locked.allowed).toBe(false);
    expect(locked.retryAfterMs).toBe(30_000);
    expect(l.check().allowed).toBe(false);
    t += 30_001;
    expect(l.check().allowed).toBe(true);
  });

  it('duplica el bloqueo con cada fallo extra y respeta el máximo', () => {
    let t = 0;
    const l = createAttemptLimiter(makeStore(), 'login', 'a@b.co', { now: () => t, maxLockMs: 100_000 });
    for (let i = 0; i < 5; i++) l.recordFailure();
    t += 30_001;
    expect(l.recordFailure().retryAfterMs).toBe(60_000);
    t += 60_001;
    expect(l.recordFailure().retryAfterMs).toBe(100_000);
  });

  it('reinicia el contador pasado resetAfterMs sin fallos', () => {
    let t = 0;
    const l = createAttemptLimiter(makeStore(), 'login', 'a@b.co', { now: () => t });
    for (let i = 0; i < 4; i++) l.recordFailure();
    t += 16 * 60_000;
    expect(l.recordFailure().allowed).toBe(true);
    for (let i = 0; i < 3; i++) expect(l.recordFailure().allowed).toBe(true);
  });

  it('reset() limpia y la clave distingue acción y correo (sin mayúsculas)', () => {
    const store = makeStore();
    const a = createAttemptLimiter(store, 'login', 'A@B.co');
    const b = createAttemptLimiter(store, 'login', 'otro@b.co');
    const c = createAttemptLimiter(store, 'verify', 'a@b.co');
    for (let i = 0; i < 5; i++) a.recordFailure();
    expect(createAttemptLimiter(store, 'login', 'a@b.co').check().allowed).toBe(false);
    expect(b.check().allowed).toBe(true);
    expect(c.check().allowed).toBe(true);
    a.reset();
    expect(a.check().allowed).toBe(true);
  });

  it('tolera estado corrupto en el almacenamiento', () => {
    const store = makeStore();
    store.setItem('tapasel_rl:login:a@b.co', '{no es json');
    expect(createAttemptLimiter(store, 'login', 'a@b.co').check().allowed).toBe(true);
  });
});

describe('formatLockMessage', () => {
  it('muestra segundos o minutos', () => {
    expect(formatLockMessage(29_100)).toContain('30 s');
    expect(formatLockMessage(61_000)).toContain('2 min');
  });
});
