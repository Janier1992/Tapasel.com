import { describe, it, expect } from 'vitest';
import { isPasswordLongEnough, MIN_PASSWORD_LENGTH, PASSWORD_TOO_SHORT_MESSAGE } from './passwordPolicy';

describe('passwordPolicy', () => {
  it('exige el largo mínimo', () => {
    expect(isPasswordLongEnough('a'.repeat(MIN_PASSWORD_LENGTH - 1))).toBe(false);
    expect(isPasswordLongEnough('a'.repeat(MIN_PASSWORD_LENGTH))).toBe(true);
  });
  it('el mensaje menciona el mínimo', () => {
    expect(PASSWORD_TOO_SHORT_MESSAGE).toContain(String(MIN_PASSWORD_LENGTH));
  });
});
