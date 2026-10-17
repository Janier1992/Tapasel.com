-- 002_documentos_storage.sql
-- Guarda la ruta interna del archivo (bucket privado `documentos`) en lugar de
-- una URL pública. Ejecutar UNA vez en InsForge.

BEGIN;

ALTER TABLE documentos ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Los documentos subidos antes de esta migración guardaron una URL pública en
-- el comentario del historial de versiones. Se limpia para no dejar enlaces
-- vivos en la base de datos (revisar el resultado antes de COMMIT).
UPDATE documento_versiones
   SET comentario = regexp_replace(comentario, 'https?://\S+', '[enlace retirado]', 'g')
 WHERE comentario ~ 'https?://\S+/storage/';

COMMIT;
