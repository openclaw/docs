---
read_when:
    - Necesitas inspeccionar la salida sin procesar del modelo para detectar fugas de razonamiento
    - Quieres ejecutar el Gateway en modo watch mientras iteras
    - Necesitas un flujo de depuración repetible
summary: 'Herramientas de depuración: modo watch, streams sin procesar del modelo y rastreo de fugas de razonamiento'
title: Depuración
x-i18n:
    generated_at: "2026-04-12T23:28:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc31ce9b41e92a14c4309f32df569b7050b18024f83280930e53714d3bfcd5cc
    source_path: help/debugging.md
    workflow: 15
---

# Depuración

Esta página cubre ayudantes de depuración para la salida en streaming, especialmente cuando un proveedor mezcla razonamiento en texto normal.

## Anulaciones de depuración en tiempo de ejecución

Usa `/debug` en el chat para establecer anulaciones de configuración **solo en tiempo de ejecución** (memoria, no disco).
`/debug` está deshabilitado de forma predeterminada; actívalo con `commands.debug: true`.
Esto es útil cuando necesitas alternar ajustes poco comunes sin editar `openclaw.json`.

Ejemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` borra todas las anulaciones y vuelve a la configuración en disco.

## Salida de trazas de sesión

Usa `/trace` cuando quieras ver líneas de traza/depuración propiedad de plugins en una sesión
sin activar el modo detallado completo.

Ejemplos:

```text
/trace
/trace on
/trace off
```

Usa `/trace` para diagnósticos de plugins, como los resúmenes de depuración de Active Memory.
Sigue usando `/verbose` para la salida normal detallada de estado/herramientas, y sigue usando
`/debug` para anulaciones de configuración solo en tiempo de ejecución.

## Modo watch del Gateway

Para iterar rápidamente, ejecuta el Gateway bajo el observador de archivos:

```bash
pnpm gateway:watch
```

Esto corresponde a:

```bash
node scripts/watch-node.mjs gateway --force
```

El observador reinicia ante archivos relevantes para la compilación en `src/`, archivos fuente de extensiones,
metadatos de `package.json` y `openclaw.plugin.json` de extensiones, `tsconfig.json`,
`package.json` y `tsdown.config.ts`. Los cambios en metadatos de extensiones reinician el
Gateway sin forzar una recompilación de `tsdown`; los cambios en código fuente y configuración siguen
recompilando `dist` primero.

Agrega cualquier flag de CLI del Gateway después de `gateway:watch` y se pasarán en cada
reinicio. Volver a ejecutar el mismo comando watch para el mismo repositorio/conjunto de flags ahora
reemplaza el observador anterior en lugar de dejar procesos padre de observación duplicados.

## Perfil de desarrollo + Gateway de desarrollo (`--dev`)

Usa el perfil de desarrollo para aislar el estado y levantar una configuración segura y desechable para
depuración. Hay **dos** flags `--dev`:

- **`--dev` global (perfil):** aísla el estado en `~/.openclaw-dev` y
  usa por defecto el puerto `19001` para el Gateway (los puertos derivados se desplazan con él).
- **`gateway --dev`:** indica al Gateway que cree automáticamente una configuración +
  workspace predeterminados cuando falten (y omita `BOOTSTRAP.md`).

Flujo recomendado (perfil de desarrollo + bootstrap de desarrollo):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Si todavía no tienes una instalación global, ejecuta la CLI con `pnpm openclaw ...`.

Qué hace esto:

1. **Aislamiento de perfil** (`--dev` global)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas se desplazan en consecuencia)

2. **Bootstrap de desarrollo** (`gateway --dev`)
   - Escribe una configuración mínima si falta (`gateway.mode=local`, bind loopback).
   - Establece `agent.workspace` al workspace de desarrollo.
   - Establece `agent.skipBootstrap=true` (sin `BOOTSTRAP.md`).
   - Inicializa los archivos del workspace si faltan:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identidad predeterminada: **C3‑PO** (droide de protocolo).
   - Omite los proveedores de canales en modo desarrollo (`OPENCLAW_SKIP_CHANNELS=1`).

Flujo de restablecimiento (inicio limpio):

```bash
pnpm gateway:dev:reset
```

Nota: `--dev` es un flag de perfil **global** y algunos runners lo consumen.
Si necesitas especificarlo explícitamente, usa la forma con variable de entorno:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` borra la configuración, credenciales, sesiones y el workspace de desarrollo (usando
`trash`, no `rm`), y luego vuelve a crear la configuración de desarrollo predeterminada.

Consejo: si ya se está ejecutando un Gateway que no es de desarrollo (`launchd/systemd`), detenlo primero:

```bash
openclaw gateway stop
```

## Registro de stream sin procesar (OpenClaw)

OpenClaw puede registrar el **stream sin procesar del asistente** antes de cualquier filtrado/formateo.
Esta es la mejor manera de ver si el razonamiento llega como deltas de texto plano
(o como bloques de pensamiento separados).

Actívalo mediante la CLI:

```bash
pnpm gateway:watch --raw-stream
```

Anulación de ruta opcional:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Variables de entorno equivalentes:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Archivo predeterminado:

`~/.openclaw/logs/raw-stream.jsonl`

## Registro de fragmentos sin procesar (pi-mono)

Para capturar **fragmentos OpenAI-compat sin procesar** antes de que se analicen en bloques,
pi-mono expone un registrador separado:

```bash
PI_RAW_STREAM=1
```

Ruta opcional:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Archivo predeterminado:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Nota: esto solo se emite en procesos que usan el proveedor
> `openai-completions` de pi-mono.

## Notas de seguridad

- Los registros de streams sin procesar pueden incluir prompts completos, salida de herramientas y datos del usuario.
- Mantén los registros en local y elimínalos después de depurar.
- Si compartes registros, primero elimina secretos y PII.
