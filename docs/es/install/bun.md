---
read_when:
    - Quieres el ciclo de desarrollo local más rápido (bun + watch)
    - Tienes problemas con los scripts de instalación, parcheo o ciclo de vida de Bun
summary: 'Flujo de trabajo con Bun (experimental): instalación y aspectos problemáticos frente a pnpm'
title: Bun (experimental)
x-i18n:
    generated_at: "2026-07-11T23:12:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b836be354166ceb073d170e472e8b69c3f517e754fe71417df1d85d27a18ae94
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun no se recomienda para ejecutar el Gateway (debido a problemas conocidos con WhatsApp y Telegram). Use Node en producción.
</Warning>

Bun es un entorno de ejecución local opcional para ejecutar TypeScript directamente (`bun run ...`, `bun --watch ...`). El gestor de paquetes predeterminado sigue siendo `pnpm`, que cuenta con compatibilidad total y se utiliza en las herramientas de documentación. Bun no puede utilizar `pnpm-lock.yaml` y lo ignora.

## Instalación

<Steps>
  <Step title="Instalar las dependencias">
    ```sh
    bun install
    ```

    `bun.lock` y `bun.lockb` se ignoran mediante git, por lo que no generan cambios en el repositorio. Para omitir por completo la escritura de archivos de bloqueo:

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

## Scripts del ciclo de vida

Bun bloquea los scripts del ciclo de vida de las dependencias salvo que se confíe explícitamente en ellos. En este repositorio, los scripts que suelen bloquearse no son necesarios:

- `baileys` `preinstall`: comprueba que la versión principal de Node sea >= 20 (OpenClaw requiere Node 22.19+ o 23.11+, y se recomienda Node 24)
- `protobufjs` `postinstall`: muestra advertencias sobre esquemas de versiones incompatibles (sin artefactos de compilación)

Si encuentra un problema de ejecución que requiera estos scripts, confíe explícitamente en ellos:

```sh
bun pm trust baileys protobufjs
```

## Consideraciones

Algunos scripts de paquetes incluyen `pnpm` de forma fija internamente (por ejemplo, `check:docs`, `ui:*` y `protocol:check`). Al ejecutarlos mediante `bun run`, se sigue invocando `pnpm` desde el shell, por lo que es mejor ejecutarlos directamente mediante `pnpm`.

## Contenido relacionado

- [Descripción general de la instalación](/es/install)
- [Node.js](/es/install/node)
- [Actualización](/es/install/updating)
