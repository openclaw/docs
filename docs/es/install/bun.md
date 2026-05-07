---
read_when:
    - Quieres el ciclo de desarrollo local más rápido (bun + watch)
    - Encontraste problemas con la instalación, los parches o los scripts de ciclo de vida de Bun
summary: 'Flujo de trabajo de Bun (experimental): instalaciones y aspectos a tener en cuenta frente a pnpm'
title: Bun (experimental)
x-i18n:
    generated_at: "2026-05-07T13:19:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1637cb81310422b718934f9c2d1f506dec46f1624dd9ac850bed04321b863041
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **no se recomienda para el entorno de ejecución del Gateway** (problemas conocidos con WhatsApp y Telegram). Usa Node para producción.
</Warning>

Bun es un entorno de ejecución local opcional para ejecutar TypeScript directamente (`bun run ...`, `bun --watch ...`). El gestor de paquetes predeterminado sigue siendo `pnpm`, que cuenta con soporte completo y es usado por las herramientas de documentación. Bun no puede usar `pnpm-lock.yaml` y lo ignorará.

## Instalación

<Steps>
  <Step title="Instalar dependencias">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` están ignorados por git, así que no generan cambios en el repositorio. Para omitir por completo la escritura de lockfiles:

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

Bun bloquea los scripts de ciclo de vida de las dependencias salvo que se confíe explícitamente en ellos. Para este repositorio, los scripts que se bloquean con más frecuencia no son necesarios:

- `@whiskeysockets/baileys` `preinstall` -- comprueba que la versión mayor de Node sea >= 20 (OpenClaw usa Node 24 de forma predeterminada y sigue siendo compatible con Node 22 LTS, actualmente `22.16+`)
- `protobufjs` `postinstall` -- emite advertencias sobre esquemas de versión incompatibles (sin artefactos de compilación)

Si encuentras un problema en tiempo de ejecución que requiere estos scripts, confía en ellos explícitamente:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Advertencias

Algunos scripts todavía tienen pnpm codificado de forma fija (por ejemplo, `docs:build`, `ui:*`, `protocol:check`). Ejecútalos mediante pnpm por ahora.

## Relacionado

- [Resumen de instalación](/es/install)
- [Node.js](/es/install/node)
- [Actualizar](/es/install/updating)
