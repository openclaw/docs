---
read_when:
    - Investigación de un fallo del cargador de tsx/esbuild que menciona la ausencia del auxiliar __name
summary: Fallo histórico de Node + tsx «__name is not a function» y su causa
title: Fallo de Node + tsx
x-i18n:
    generated_at: "2026-07-11T23:05:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97d2f62d24860cee65753027ba84c14c8d4ffb910ee17bb0032cf0409c427589
    source_path: debug/node-issue.md
    workflow: 16
---

# Fallo de Node + tsx: "\_\_name is not a function"

## Estado

Resuelto. Este fallo no se reproduce con la versión actual de `tsx` fijada en
`package.json` (`4.22.3`) ni con las versiones actuales de Node. Se conserva aquí por si una
futura actualización de `tsx`/esbuild vuelve a introducirlo.

## Síntoma original

La ejecución de los scripts de desarrollo de OpenClaw mediante `tsx` fallaba durante el inicio con:

```text
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (src/logging/subsystem.ts)
    at <caller> (src/agents/auth-profiles/constants.ts)
```

Se omiten los números de línea; ambos archivos han cambiado desde el fallo original
y las líneas específicas ya no coinciden.

Esto apareció después de que los scripts de desarrollo cambiaran de Bun a `tsx` (`2871657e`,
2026-01-06) para que Bun fuera opcional. La ruta equivalente basada en Bun no fallaba.
Se observó originalmente con Node v25.3.0 en macOS; también se consideró probable que afectara
a otras plataformas que ejecutaran Node 25.

## Causa

`tsx` transforma TS/ESM mediante esbuild con `keepNames: true` establecido directamente en
sus opciones de transformación. Esa configuración hace que esbuild envuelva las declaraciones
de funciones y clases con nombre en una llamada a un auxiliar `__name`, para que `fn.name`
se conserve durante la minificación y el empaquetado. El fallo significa que el auxiliar
no estaba disponible o estaba oculto en el punto de llamada de ese módulo con la combinación
afectada de `tsx` y Node, por lo que `__name(...)` produjo una excepción en lugar de devolver
el valor envuelto.

## Comprobación actual de reproducción

```bash
node --version
pnpm install
node --import tsx src/entry.ts status
```

Reproducción mínima aislada (carga únicamente el módulo del seguimiento de pila original):

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

Actualmente, ambos comandos finalizan correctamente. Si alguno vuelve a producir
`__name is not a function`, recopile la versión exacta de Node, la versión de `tsx`
(`node_modules/tsx/package.json`) y el seguimiento de pila completo antes de informar
del problema al proyecto original.

## Soluciones alternativas (si el fallo reaparece)

- Ejecute los scripts de desarrollo con Bun en lugar de `node --import tsx`.
- Ejecute `pnpm tsgo` para comprobar los tipos y, después, ejecute la salida compilada en lugar
  del código fuente mediante `tsx`:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Pruebe otra versión de `tsx` (`pnpm add -D tsx@<version>` es un cambio
  de dependencia y requiere aprobación según la política del repositorio) para determinar mediante
  bisección si la versión de esbuild que incluye volvió a introducir el error.
- Pruebe con otra versión principal o secundaria de Node para comprobar si el fallo
  es específico de una versión.

## Referencias

- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Contenido relacionado

- [Instalación de Node.js](/es/install/node)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
