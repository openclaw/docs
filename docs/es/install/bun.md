---
read_when:
    - Quieres el ciclo de desarrollo local más rápido (bun + watch)
    - Encontraste problemas con la instalación, los parches o los scripts de ciclo de vida de Bun
summary: 'Flujo de trabajo de Bun (experimental): instalaciones y advertencias frente a pnpm'
title: Bun (experimental)
x-i18n:
    generated_at: "2026-06-27T11:46:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c31f2c09f3c1f99ae1a306184a86f2240b0c0f4f655c2759f5aeb6bac6b745a
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **no se recomienda para el runtime del Gateway** (problemas conocidos con WhatsApp y Telegram). Usa Node en producción.
</Warning>

Bun es un runtime local opcional para ejecutar TypeScript directamente (`bun run ...`, `bun --watch ...`). El gestor de paquetes predeterminado sigue siendo `pnpm`, que cuenta con soporte completo y se usa en las herramientas de documentación. Bun no puede usar `pnpm-lock.yaml` y lo ignorará.

## Instalación

<Steps>
  <Step title="Install dependencies">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` están ignorados por git, así que no hay cambios innecesarios en el repositorio. Para omitir por completo las escrituras del archivo de bloqueo:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Build and test">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Scripts del ciclo de vida

Bun bloquea los scripts del ciclo de vida de las dependencias a menos que se confíe explícitamente en ellos. Para este repositorio, los scripts que se bloquean habitualmente no son necesarios:

- `baileys` `preinstall` -- comprueba que la versión principal de Node sea >= 20 (OpenClaw usa Node 24 de forma predeterminada y sigue siendo compatible con Node 22 LTS, actualmente `22.19+`)
- `protobufjs` `postinstall` -- emite advertencias sobre esquemas de versión incompatibles (sin artefactos de compilación)

Si encuentras un problema de runtime que requiere estos scripts, confía en ellos explícitamente:

```sh
bun pm trust baileys protobufjs
```

## Consideraciones

Algunos scripts todavía tienen pnpm codificado directamente (por ejemplo, `check:docs`, `ui:*`, `protocol:check`). Por ahora, ejecútalos mediante pnpm.

## Relacionado

- [Resumen de instalación](/es/install)
- [Node.js](/es/install/node)
- [Actualización](/es/install/updating)
