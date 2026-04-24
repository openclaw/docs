---
read_when:
    - Quieres el ciclo local de desarrollo más rápido (bun + watch)
    - Has encontrado problemas con la instalación, los parches o los scripts de ciclo de vida de Bun
summary: 'Flujo de trabajo con Bun (experimental): instalación y consideraciones frente a pnpm'
title: Bun (experimental)
x-i18n:
    generated_at: "2026-04-24T05:33:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5637f64fe272faf74915e8de115f21fdf9c9dd0406e5c471932323b2c1d4c0bd
    source_path: install/bun.md
    workflow: 15
---

<Warning>
Bun **no se recomienda para el entorno de ejecución de Gateway** (problemas conocidos con WhatsApp y Telegram). Usa Node en producción.
</Warning>

Bun es un entorno de ejecución local opcional para ejecutar TypeScript directamente (`bun run ...`, `bun --watch ...`). El gestor de paquetes predeterminado sigue siendo `pnpm`, que es totalmente compatible y lo usa la herramienta de documentación. Bun no puede usar `pnpm-lock.yaml` y lo ignorará.

## Instalar

<Steps>
  <Step title="Instalar dependencias">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` están ignorados por git, así que no hay cambios en el repositorio. Para omitir por completo la escritura del lockfile:

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

Bun bloquea scripts de ciclo de vida de dependencias a menos que se confíe explícitamente en ellos. Para este repositorio, los scripts comúnmente bloqueados no son necesarios:

- `@whiskeysockets/baileys` `preinstall` -- comprueba que la versión principal de Node sea >= 20 (OpenClaw usa por defecto Node 24 y sigue siendo compatible con Node 22 LTS, actualmente `22.14+`)
- `protobufjs` `postinstall` -- emite advertencias sobre esquemas de versión incompatibles (sin artefactos de compilación)

Si encuentras un problema en tiempo de ejecución que requiera estos scripts, confía explícitamente en ellos:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Consideraciones

Algunos scripts todavía codifican `pnpm` de forma fija (por ejemplo `docs:build`, `ui:*`, `protocol:check`). Por ahora, ejecútalos con `pnpm`.

## Relacionado

- [Resumen de instalación](/es/install)
- [Node.js](/es/install/node)
- [Actualización](/es/install/updating)
