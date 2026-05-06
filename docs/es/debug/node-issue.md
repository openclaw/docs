---
read_when:
    - Depuración de scripts de desarrollo solo para Node o fallos del modo de observación
    - Investigación de fallos del cargador de tsx/esbuild en OpenClaw
summary: Notas y soluciones alternativas para el fallo de Node + tsx "__name no es una función"
title: Fallo de Node + tsx
x-i18n:
    generated_at: "2026-05-06T17:55:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 808f04959c70c96c983fb2517234d4c06712049d7afebb9b1b4b340df75d7d70
    source_path: debug/node-issue.md
    workflow: 16
---

# Fallo de Node + tsx "\_\_name is not a function"

## Resumen

Ejecutar OpenClaw mediante Node con `tsx` falla al iniciar con:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Esto comenzó después de cambiar los scripts de desarrollo de Bun a `tsx` (commit `2871657e`, 2026-01-06). La misma ruta de runtime funcionaba con Bun.

## Entorno

- Node: v25.x (observado en v25.3.0)
- tsx: 4.21.0
- SO: macOS (la reproducción también es probable en otras plataformas que ejecuten Node 25)

## Reproducción (solo Node)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Reproducción mínima en el repositorio

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Comprobación de versión de Node

- Node 25.3.0: falla
- Node 22.22.0 (Homebrew `node@22`): falla
- Node 24: aún no está instalado aquí; necesita verificación

## Notas / hipótesis

- `tsx` usa esbuild para transformar TS/ESM. `keepNames` de esbuild emite un helper `__name` y envuelve las definiciones de funciones con `__name(...)`.
- El fallo indica que `__name` existe pero no es una función en runtime, lo que implica que el helper falta o se sobrescribe para este módulo en la ruta del cargador de Node 25.
- Se han informado problemas similares con el helper `__name` en otros consumidores de esbuild cuando el helper falta o se reescribe.

## Historial de regresión

- `2871657e` (2026-01-06): los scripts cambiaron de Bun a tsx para hacer que Bun fuera opcional.
- Antes de eso (ruta de Bun), `openclaw status` y `gateway:watch` funcionaban.

## Soluciones temporales

- Usa Bun para los scripts de desarrollo (reversión temporal actual).
- Usa `tsgo` para la comprobación de tipos del repositorio y luego ejecuta la salida compilada:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Nota histórica: aquí se usó `tsc` mientras se depuraba este problema de Node/tsx, pero las rutas de comprobación de tipos del repositorio ahora usan `tsgo`.
- Desactiva keepNames de esbuild en el cargador de TS si es posible (evita la inserción del helper `__name`); tsx actualmente no expone esto.
- Prueba Node LTS (22/24) con `tsx` para ver si el problema es específico de Node 25.

## Referencias

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Próximos pasos

- Reproducir en Node 22/24 para confirmar la regresión de Node 25.
- Probar `tsx` nightly o fijar a una versión anterior si existe una regresión conocida.
- Si se reproduce en Node LTS, abrir una reproducción mínima upstream con el stack trace de `__name`.

## Relacionado

- [Instalación de Node.js](/es/install/node)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
