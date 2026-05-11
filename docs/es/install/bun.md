---
read_when:
    - Quieres el ciclo de desarrollo local más rápido (bun + watch)
    - Tuviste problemas con la instalación, los parches o los scripts de ciclo de vida de Bun
summary: 'Flujo de trabajo de Bun (experimental): instalaciones y aspectos a tener en cuenta frente a pnpm'
title: Bun (experimental)
x-i18n:
    generated_at: "2026-05-11T20:39:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: d97a7da26520d66e6033065c50d6490c869ace3d5f0b25aafcd196074cf7df7c
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **no se recomienda para el runtime de Gateway** (problemas conocidos con WhatsApp y Telegram). Usa Node para producción.
</Warning>

Bun es un runtime local opcional para ejecutar TypeScript directamente (`bun run ...`, `bun --watch ...`). El gestor de paquetes predeterminado sigue siendo `pnpm`, que es totalmente compatible y lo usan las herramientas de documentación. Bun no puede usar `pnpm-lock.yaml` y lo ignorará.

## Instalar

<Steps>
  <Step title="Instalar dependencias">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` están ignorados por git, así que no hay cambios en el repo. Para omitir por completo las escrituras del archivo de bloqueo:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Compilar y probar">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Scripts de ciclo de vida

Bun bloquea los scripts de ciclo de vida de las dependencias a menos que se confíe explícitamente en ellos. Para este repo, los scripts que se bloquean con frecuencia no son necesarios:

- `baileys` `preinstall` -- comprueba que la versión mayor de Node sea >= 20 (OpenClaw usa Node 24 de forma predeterminada y aún admite Node 22 LTS, actualmente `22.16+`)
- `protobufjs` `postinstall` -- emite advertencias sobre esquemas de versión incompatibles (sin artefactos de compilación)

Si encuentras un problema de runtime que requiere estos scripts, confía en ellos explícitamente:

```sh
bun pm trust baileys protobufjs
```

## Advertencias

Algunos scripts aún tienen pnpm codificado directamente (por ejemplo, `docs:build`, `ui:*`, `protocol:check`). Ejecútalos mediante pnpm por ahora.

## Relacionado

- [Resumen de instalación](/es/install)
- [Node.js](/es/install/node)
- [Actualizar](/es/install/updating)
