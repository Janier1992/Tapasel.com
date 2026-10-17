-- 001_security_usuarios.sql
-- Endurece la tabla `usuarios` (rol y permisos). Ejecutar UNA vez en InsForge
-- (SQL editor o `insforge db query`). Revisar antes de aplicar.
--
-- Modelo: el navegador solo puede LEER su propio perfil. Crear perfiles o
-- cambiar roles lo hace un administrador (o el servidor con la clave admin,
-- que se salta RLS). Las cuentas nuevas quedan como 'PENDIENTE' hasta que un
-- administrador les asigne rol y permisos.

BEGIN;

ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check
  CHECK (rol IN ('ADMIN', 'CFO', 'RRHH', 'COO', 'PENDIENTE'));

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios FORCE ROW LEVEL SECURITY;

-- Cada usuario autenticado lee solo su propio perfil (por email del token).
DROP POLICY IF EXISTS usuarios_select_own ON usuarios;
CREATE POLICY usuarios_select_own ON usuarios FOR SELECT
  USING (lower(email) = lower(COALESCE(auth.jwt() ->> 'email', '')));

-- Sin políticas de INSERT/UPDATE/DELETE para el navegador: quedan denegadas.
-- NOTA: si `auth.jwt()` no existe en tu versión de InsForge, sustituir por la
-- función equivalente (ver skill `insforge-cli`) antes de aplicar.

COMMIT;
