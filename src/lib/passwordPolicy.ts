/** Política mínima de contraseña (debe coincidir con [auth.password] de insforge.toml). */
export const MIN_PASSWORD_LENGTH = 10;

export const PASSWORD_TOO_SHORT_MESSAGE =
  `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;

export function isPasswordLongEnough(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}
