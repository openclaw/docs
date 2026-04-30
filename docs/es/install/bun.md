---
read_when:
    - Quieres el ciclo de desarrollo local más rápido (bun + watch)
    - Tienes problemas con scripts de instalación, parches o ciclo de vida de Bun
summary: 'Flujo de trabajo con Bun (experimental): instalaciones y consideraciones frente a pnpm'
title: Bun (experimental)
x-i18n:
    generated_at: "2026-04-30T05:46:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: d596c8fa9cc585e23184e7b983ec3842361eac807a1f3c12a0529631876db486
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **no se recomienda para el runtime de Gateway** (problemas conocidos con WhatsApp y Telegram). Usa Node para producción.
</Warning>

Bun es un runtime local opcional para ejecutar TypeScript directamente (`bun run ...`, `bun --watch ...`). El gestor de paquetes predeterminado sigue siendo `pnpm`, que cuenta con soporte completo y se usa en las herramientas de documentación. Bun no puede usar `pnpm-lock.yaml` y lo ignorará.

## Instalación

<Steps>
  <Step title="Instalar dependencias">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` están ignorados por git, así que no hay cambios innecesarios en el repositorio. Para omitir por completo la escritura del archivo de bloqueo:

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

Bun bloquea los scripts de ciclo de vida de dependencias a menos que se confíe explícitamente en ellos. Para este repositorio, los scripts bloqueados habitualmente no son necesarios:

- `@whiskeysockets/baileys` `preinstall` -- comprueba que la versión principal de Node sea >= 20 (OpenClaw usa Node 24 de forma predeterminada y sigue admitiendo Node 22 LTS, actualmente `22.14+`)
- `protobufjs` `postinstall` -- emite advertencias sobre esquemas de versiones incompatibles (sin artefactos de compilación)

Si encuentras un problema de runtime que requiere estos scripts, confía en ellos explícitamente:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Advertencias

Algunos scripts todavía tienen pnpm codificado de forma fija (por ejemplo `docs:build`, `ui:*`, `protocol:check`). Ejecútalos mediante pnpm por ahora.

## Relacionado

- [Descripción general de instalación](/es/install)
- [Node.js](/es/install/node)
- [Actualización](/es/install/updating)
