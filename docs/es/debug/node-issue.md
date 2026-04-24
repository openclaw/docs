---
read_when:
    - Depurar scripts de desarrollo solo para Node o fallos en modo watch
    - Investigar fallos del cargador tsx/esbuild en OpenClaw
summary: Notas y soluciones alternativas para el fallo de Node + tsx `"__name is not a function"`
title: Fallo de Node + tsx
x-i18n:
    generated_at: "2026-04-24T05:27:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d043466f71eae223fa568a3db82e424580ce3269ca11d0e84368beefc25bd25
    source_path: debug/node-issue.md
    workflow: 15
---

# Fallo de Node + tsx `__name is not a function`

## Resumen

Ejecutar OpenClaw mediante Node con `tsx` falla al inicio con:

```
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
# en la raíz del repositorio
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
- Node 24: aún no instalado aquí; necesita verificación

## Notas / hipótesis

- `tsx` usa esbuild para transformar TS/ESM. `keepNames` de esbuild emite un helper `__name` y envuelve definiciones de funciones con `__name(...)`.
- El fallo indica que `__name` existe pero no es una función en tiempo de ejecución, lo que implica que el helper falta o fue sobrescrito para este módulo en la ruta del cargador de Node 25.
- Se han reportado problemas similares con el helper `__name` en otros consumidores de esbuild cuando el helper falta o se reescribe.

## Historial de regresión

- `2871657e` (2026-01-06): los scripts cambiaron de Bun a tsx para hacer que Bun fuera opcional.
- Antes de eso (ruta de Bun), `openclaw status` y `gateway:watch` funcionaban.

## Soluciones alternativas

- Usa Bun para scripts de desarrollo (reversión temporal actual).
- Usa `tsgo` para la comprobación de tipos del repositorio y luego ejecuta la salida compilada:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Nota histórica: aquí se usó `tsc` mientras se depuraba este problema de Node/tsx, pero las rutas actuales de comprobación de tipos del repositorio ahora usan `tsgo`.
- Desactiva `keepNames` de esbuild en el cargador TS si es posible (evita la inserción del helper `__name`); actualmente `tsx` no expone esto.
- Prueba Node LTS (22/24) con `tsx` para ver si el problema es específico de Node 25.

## Referencias

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Próximos pasos

- Reproducir en Node 22/24 para confirmar una regresión de Node 25.
- Probar `tsx` nightly o fijar una versión anterior si existe una regresión conocida.
- Si se reproduce en Node LTS, abrir una reproducción mínima aguas arriba con la traza de pila de `__name`.

## Relacionado

- [Instalación de Node.js](/es/install/node)
- [Solución de problemas del gateway](/es/gateway/troubleshooting)
