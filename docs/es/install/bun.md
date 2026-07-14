---
read_when:
    - Quieres instalar dependencias o ejecutar scripts de paquetes con Bun
    - Se han producido problemas con los scripts de instalación, parcheo o ciclo de vida de Bun
summary: Flujo de trabajo con Bun para instalaciones y scripts de paquetes; Node es necesario en tiempo de ejecución
title: Bun
x-i18n:
    generated_at: "2026-07-14T13:46:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: b822f700123b91c785eb881ebf28a63e77915b46dfd44beb9dbf63fb71aaa0d2
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun no puede ejecutar la CLI ni el Gateway de OpenClaw porque no proporciona la API `node:sqlite` requerida. Instale una versión compatible de Node para todos los comandos de ejecución de OpenClaw.
</Warning>

Bun se puede seguir utilizando como instalador de dependencias y ejecutor de scripts de paquetes opcional. El gestor de paquetes predeterminado sigue siendo `pnpm`, que es totalmente compatible y se utiliza en las herramientas de documentación. Bun no puede utilizar `pnpm-lock.yaml` y lo ignora.

## Instalación

<Steps>
  <Step title="Instalar las dependencias">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` se ignoran mediante Git, por lo que no se generan cambios en el repositorio. Para omitir por completo las escrituras en el archivo de bloqueo:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Compilar y probar">
    ```sh
    bun run build
    bun run vitest run
    ```

    Los comandos que inician OpenClaw deben seguir ejecutándose mediante Node.

  </Step>
</Steps>

## Scripts del ciclo de vida

Bun bloquea los scripts del ciclo de vida de las dependencias salvo que se confíe explícitamente en ellos. En este repositorio, los scripts que se bloquean habitualmente no son necesarios:

- `baileys` `preinstall`: comprueba que la versión principal de Node sea >= 20 (OpenClaw requiere Node 22.22.3+, 24.15+ o 25.9+, y se recomienda Node 24)
- `protobufjs` `postinstall`: emite advertencias sobre esquemas de versiones incompatibles (sin artefactos de compilación)

Si se produce un problema durante la ejecución que requiere estos scripts, confíe explícitamente en ellos:

```sh
bun pm trust baileys protobufjs
```

## Consideraciones

Algunos scripts de paquetes incorporan `pnpm` directamente en su código (por ejemplo, `check:docs`, `ui:*`, `protocol:check`). Al ejecutarlos mediante `bun run`, se sigue invocando `pnpm` en un shell, por lo que esos scripts deben ejecutarse directamente mediante `pnpm`.

## Contenido relacionado

- [Descripción general de la instalación](/es/install)
- [Node.js](/es/install/node)
- [Actualización](/es/install/updating)
