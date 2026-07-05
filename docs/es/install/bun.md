---
read_when:
    - Quieres el ciclo de desarrollo local más rápido (bun + watch)
    - Te encontraste con problemas de instalación, parche o script de ciclo de vida de Bun
summary: 'Flujo de trabajo con Bun (experimental): instalaciones y aspectos a tener en cuenta frente a pnpm'
title: Bun (experimental)
x-i18n:
    generated_at: "2026-07-05T11:25:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b836be354166ceb073d170e472e8b69c3f517e754fe71417df1d85d27a18ae94
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun no se recomienda para el entorno de ejecución del gateway (problemas conocidos con WhatsApp y Telegram). Usa Node para producción.
</Warning>

Bun es un entorno de ejecución local opcional para ejecutar TypeScript directamente (`bun run ...`, `bun --watch ...`). El gestor de paquetes predeterminado sigue siendo `pnpm`, que es totalmente compatible y lo utiliza la herramienta de documentación. Bun no puede usar `pnpm-lock.yaml` y lo ignora.

## Instalación

<Steps>
  <Step title="Instalar dependencias">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` se ignoran en git, por lo que no hay cambios innecesarios en el repositorio. Para omitir por completo las escrituras del archivo de bloqueo:

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

Bun bloquea los scripts de ciclo de vida de dependencias salvo que se confíe explícitamente en ellos. Para este repositorio, los scripts que suelen bloquearse no son obligatorios:

- `baileys` `preinstall`: comprueba que la versión principal de Node sea >= 20 (OpenClaw requiere Node 22.19+ o 23.11+, con Node 24 recomendado)
- `protobufjs` `postinstall`: emite advertencias sobre esquemas de versión incompatibles (sin artefactos de compilación)

Si encuentras un problema en tiempo de ejecución que necesita estos scripts, confía explícitamente en ellos:

```sh
bun pm trust baileys protobufjs
```

## Advertencias

Algunos scripts de paquete tienen `pnpm` codificado internamente (por ejemplo, `check:docs`, `ui:*`, `protocol:check`). Ejecutarlos mediante `bun run` igualmente invoca `pnpm` en una shell, así que ejecuta esos directamente mediante `pnpm`.

## Relacionado

- [Resumen de instalación](/es/install)
- [Node.js](/es/install/node)
- [Actualización](/es/install/updating)
