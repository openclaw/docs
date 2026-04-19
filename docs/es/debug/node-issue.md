---
read_when:
    - Depuración de scripts de desarrollo solo con Node o fallos del modo de observación
    - Investigación de fallos del cargador tsx/esbuild en OpenClaw
summary: Notas sobre el fallo «__name is not a function» de Node + tsx y soluciones alternativas
title: Fallo de Node + tsx
x-i18n:
    generated_at: "2026-04-19T01:11:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca45c795c356ada8f81e75b394ec82743d3d1bf1bbe83a24ec6699946b920f01
    source_path: debug/node-issue.md
    workflow: 15
---

# Fallo de Node + tsx «\_\_name is not a function»

## Resumen

Ejecutar OpenClaw con Node usando `tsx` falla al iniciar con:

```bash
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Esto comenzó después de cambiar los scripts de desarrollo de Bun a `tsx` (commit `2871657e`, 2026-01-06). La misma ruta de ejecución funcionaba con Bun.

## Entorno

- Node: v25.x (observado en v25.3.0)
- tsx: 4.21.0
- SO: macOS (es probable que también se reproduzca en otras plataformas que ejecuten Node 25)

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

## Verificación de versión de Node

- Node 25.3.0: falla
- Node 22.22.0 (Homebrew `node@22`): falla
- Node 24: aún no está instalado aquí; necesita verificación

## Notas / hipótesis

- `tsx` usa esbuild para transformar TS/ESM. `keepNames` de esbuild emite un helper `__name` y envuelve las definiciones de funciones con `__name(...)`.
- El fallo indica que `__name` existe pero no es una función en tiempo de ejecución, lo que implica que el helper falta o fue sobrescrito para este módulo en la ruta del cargador de Node 25.
- Se han reportado problemas similares con el helper `__name` en otros consumidores de esbuild cuando el helper falta o fue reescrito.

## Historial de regresión

- `2871657e` (2026-01-06): los scripts cambiaron de Bun a tsx para que Bun fuera opcional.
- Antes de eso (ruta con Bun), `openclaw status` y `gateway:watch` funcionaban.

## Soluciones alternativas

- Usar Bun para los scripts de desarrollo (reversión temporal actual).
- Usar `tsgo` para la verificación de tipos del repositorio y luego ejecutar la salida compilada:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Nota histórica: aquí se usó `tsc` durante la depuración de este problema de Node/tsx, pero las rutas de verificación de tipos del repositorio ahora usan `tsgo`.
- Deshabilitar `keepNames` de esbuild en el cargador TS si es posible (evita la inserción del helper `__name`); actualmente tsx no expone esto.
- Probar Node LTS (22/24) con `tsx` para ver si el problema es específico de Node 25.

## Referencias

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Próximos pasos

- Reproducir en Node 22/24 para confirmar una regresión en Node 25.
- Probar `tsx` nightly o fijar una versión anterior si existe una regresión conocida.
- Si también se reproduce en Node LTS, abrir un caso mínimo reproducible aguas arriba con el stack trace de `__name`.
