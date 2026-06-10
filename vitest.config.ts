/**
 * vitest.config.ts — Configuración de pruebas unitarias.
 *
 * Define el entorno de ejecución de los tests (Node) y el patrón de archivos
 * de prueba. Las pruebas validan mecánicamente que las funciones principales
 * de la capa de utilidades y lógica se comporten como se espera.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Entorno Node: las utilidades probadas son puras y no requieren DOM.
    environment: 'node',
    // Solo se ejecutan archivos *.test.ts dentro de src/.
    include: ['src/**/*.test.ts'],
    globals: true
  }
});
