---
read_when:
    - Investigación de un bloqueo del cargador tsx/esbuild que menciona un helper __name faltante
summary: Bloqueo histórico de Node + tsx "__name is not a function" y su causa
title: Fallo de Node + tsx
x-i18n:
    generated_at: "2026-07-05T11:17:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97d2f62d24860cee65753027ba84c14c8d4ffb910ee17bb0032cf0409c427589
    source_path: debug/node-issue.md
    workflow: 16
---

# Fallo de Node + tsx "\_\_name is not a function"

## Estado

Resuelto. Este fallo no se reproduce en la versión actual de `tsx` fijada en
`package.json` (`4.22.3`) ni en las versiones actuales de Node. Se conserva aquí por si una
actualización futura de `tsx`/esbuild lo reintroduce.

## Síntoma original

Ejecutar los scripts de desarrollo de OpenClaw mediante `tsx` fallaba al iniciar con:

```text
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (src/logging/subsystem.ts)
    at <caller> (src/agents/auth-profiles/constants.ts)
```

Se omiten los números de línea; ambos archivos han cambiado desde el fallo original
y las líneas específicas ya no coinciden.

Esto apareció después de que los scripts de desarrollo cambiaran de Bun a `tsx` (`2871657e`,
2026-01-06) para hacer que Bun fuera opcional. La ruta equivalente basada en Bun no fallaba.
Se observó originalmente en Node v25.3.0 en macOS; se consideró probable que otras plataformas que ejecutan
Node 25 también estuvieran afectadas.

## Causa

`tsx` transforma TS/ESM mediante esbuild con `keepNames: true` codificado de forma rígida en
sus opciones de transformación. Esa configuración hace que esbuild envuelva las declaraciones de funciones/clases
con nombre en una llamada a un auxiliar `__name` para que `fn.name` sobreviva a la minificación
y el empaquetado. El fallo significa que el auxiliar faltaba o estaba sombreado en el sitio de llamada
de ese módulo en la combinación afectada de `tsx`/Node, por lo que `__name(...)`
lanzaba un error en lugar de devolver el valor envuelto.

## Comprobación de reproducción actual

```bash
node --version
pnpm install
node --import tsx src/entry.ts status
```

Reproducción aislada mínima (carga solo el módulo del seguimiento de pila original):

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

Actualmente, ambos comandos terminan correctamente. Si alguno vuelve a lanzar `__name is not a
function`, captura la versión exacta de Node, la versión de `tsx`
(`node_modules/tsx/package.json`) y el seguimiento de pila completo antes de informar upstream.

## Soluciones temporales (si el fallo vuelve)

- Ejecuta los scripts de desarrollo con Bun en lugar de `node --import tsx`.
- Ejecuta `pnpm tsgo` para la comprobación de tipos y luego ejecuta la salida compilada en lugar del
  código fuente mediante `tsx`:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Prueba una versión diferente de `tsx` (`pnpm add -D tsx@<version>` es un cambio de dependencia
  y necesita aprobación según la política del repositorio) para hacer una bisección y comprobar si la versión de esbuild
  que incluye volvió a introducir el error.
- Prueba en otra versión mayor/menor de Node para ver si el fallo es específico de la versión.

## Referencias

- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Relacionado

- [Instalación de Node.js](/es/install/node)
- [Solución de problemas de Gateway](/es/gateway/troubleshooting)
