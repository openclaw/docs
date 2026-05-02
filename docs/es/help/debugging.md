---
read_when:
    - Debes inspeccionar la salida sin procesar del modelo para detectar filtraciones de razonamiento
    - Quieres ejecutar el Gateway en modo de observación mientras iteras
    - Necesitas un flujo de trabajo de depuración repetible
summary: 'Herramientas de depuración: modo de observación, flujos sin procesar del modelo y rastreo de fugas de razonamiento'
title: Depuración
x-i18n:
    generated_at: "2026-05-02T22:19:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a72a1508915e37ffdc5317889cdfde7024de3f5702739640abc2f03c3abadb7
    source_path: help/debugging.md
    workflow: 16
---

Ayudantes de depuración para la salida de streaming, especialmente cuando un proveedor mezcla razonamiento en el texto normal.

## Sustituciones de depuración en runtime

Usa `/debug` en el chat para establecer sustituciones de configuración **solo de runtime** (memoria, no disco).
`/debug` está deshabilitado de forma predeterminada; habilítalo con `commands.debug: true`.
Esto resulta útil cuando necesitas alternar ajustes poco comunes sin editar `openclaw.json`.

Ejemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` borra todas las sustituciones y vuelve a la configuración en disco.

## Salida de traza de sesión

Usa `/trace` cuando quieras ver líneas de traza/depuración propiedad del Plugin en una sesión
sin activar el modo completamente detallado.

Ejemplos:

```text
/trace
/trace on
/trace off
```

Usa `/trace` para diagnósticos de Plugin, como resúmenes de depuración de Active Memory.
Sigue usando `/verbose` para la salida detallada normal de estado/herramientas, y sigue usando
`/debug` para sustituciones de configuración solo de runtime.

## Traza del ciclo de vida de Plugin

Usa `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` cuando los comandos de ciclo de vida de Plugin se sientan lentos
y necesites un desglose de fases incorporado para metadatos de Plugin, descubrimiento, registro,
espejo de runtime, mutación de configuración y trabajo de actualización. La traza es opcional y escribe
en stderr, por lo que la salida JSON de comandos sigue siendo analizable.

Ejemplo:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

Salida de ejemplo:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Usa esto para investigar el ciclo de vida de Plugin antes de recurrir a un perfilador de CPU.
Si el comando se ejecuta desde un checkout de código fuente, prefiere medir el runtime compilado
con `node dist/entry.js ...` después de `pnpm build`; `pnpm openclaw ...`
también mide la sobrecarga del ejecutor desde código fuente.

## Inicio de la CLI y perfilado de comandos

Usa el benchmark de inicio incluido cuando un comando se sienta lento:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Para perfilado puntual mediante el ejecutor normal desde código fuente, establece
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

El ejecutor desde código fuente añade flags de perfil de CPU de Node y escribe un `.cpuprofile` para el
comando. Usa esto antes de añadir instrumentación temporal al código del comando.

## Modo de observación de Gateway

Para iterar rápidamente, ejecuta el Gateway bajo el observador de archivos:

```bash
pnpm gateway:watch
```

De forma predeterminada, esto inicia o reinicia una sesión de tmux llamada
`openclaw-gateway-watch-main` (o una variante específica de perfil/puerto como
`openclaw-gateway-watch-dev-19001`) y se adjunta automáticamente desde terminales interactivas.
Los shells no interactivos, CI y las llamadas de ejecución de agentes permanecen separados e imprimen
instrucciones para adjuntarse en su lugar. Adjunta manualmente cuando sea necesario:

```bash
tmux attach -t openclaw-gateway-watch-main
```

El panel de tmux ejecuta el observador sin procesar:

```bash
node scripts/watch-node.mjs gateway --force
```

Usa el modo en primer plano cuando no quieras tmux:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Deshabilita el auto-adjunto manteniendo la gestión de tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Perfila el tiempo de CPU del Gateway observado al depurar puntos calientes de inicio/runtime:

```bash
pnpm gateway:watch --benchmark
```

El wrapper de observación consume `--benchmark` antes de invocar el Gateway y escribe
un `.cpuprofile` de V8 por cada salida de proceso hijo del Gateway bajo
`.artifacts/gateway-watch-profiles/`. Detén o reinicia el gateway observado para
volcar el perfil actual, luego ábrelo con Chrome DevTools o Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Usa `--benchmark-dir <path>` cuando quieras los perfiles en otro lugar.

El wrapper de tmux traslada al panel selectores comunes de runtime no secretos, como
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` y `OPENCLAW_SKIP_CHANNELS`. Coloca las credenciales de proveedor
en tu perfil/configuración normal, o usa el modo sin procesar en primer plano
para secretos efímeros puntuales.
El panel de tmux gestionado también usa de forma predeterminada logs coloreados de Gateway para mejorar la legibilidad;
establece `FORCE_COLOR=0` al iniciar `pnpm gateway:watch` para deshabilitar la salida ANSI.

El observador se reinicia con archivos relevantes para la compilación bajo `src/`, archivos fuente de extensión,
`package.json` de extensión y metadatos `openclaw.plugin.json`, `tsconfig.json`,
`package.json` y `tsdown.config.ts`. Los cambios de metadatos de extensión reinician el
gateway sin forzar una reconstrucción de `tsdown`; los cambios de código fuente y configuración todavía
reconstruyen `dist` primero.

Añade cualquier flag de CLI de gateway después de `gateway:watch` y se pasará en
cada reinicio. Volver a ejecutar el mismo comando de observación recrea el panel de tmux nombrado, y
el observador sin procesar sigue manteniendo su bloqueo de observador único para que los padres de observador duplicados
se reemplacen en lugar de acumularse.

## Perfil de desarrollo + gateway de desarrollo (--dev)

Usa el perfil de desarrollo para aislar estado y levantar una configuración segura y desechable para
depuración. Hay **dos** flags `--dev`:

- **`--dev` global (perfil):** aísla el estado bajo `~/.openclaw-dev` y
  establece por defecto el puerto del gateway en `19001` (los puertos derivados se desplazan con él).
- **`gateway --dev`: indica al Gateway que cree automáticamente una configuración predeterminada +
  workspace** cuando falte (y omita BOOTSTRAP.md).

Flujo recomendado (perfil de desarrollo + bootstrap de desarrollo):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Si aún no tienes una instalación global, ejecuta la CLI mediante `pnpm openclaw ...`.

Qué hace esto:

1. **Aislamiento de perfil** (`--dev` global)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (navegador/canvas se desplazan en consecuencia)

2. **Bootstrap de desarrollo** (`gateway --dev`)
   - Escribe una configuración mínima si falta (`gateway.mode=local`, vincular a loopback).
   - Establece `agent.workspace` en el workspace de desarrollo.
   - Establece `agent.skipBootstrap=true` (sin BOOTSTRAP.md).
   - Inicializa los archivos del workspace si faltan:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identidad predeterminada: **C3‑PO** (droide de protocolo).
   - Omite proveedores de canales en modo de desarrollo (`OPENCLAW_SKIP_CHANNELS=1`).

Flujo de restablecimiento (inicio limpio):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` es un flag de perfil **global** y algunos ejecutores lo consumen. Si necesitas escribirlo explícitamente, usa la forma de variable de entorno:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` borra configuración, credenciales, sesiones y el workspace de desarrollo (usando
`trash`, no `rm`), y luego recrea la configuración de desarrollo predeterminada.

<Tip>
Si ya se está ejecutando un gateway que no es de desarrollo (launchd o systemd), detenlo primero:

```bash
openclaw gateway stop
```

</Tip>

## Registro de stream sin procesar (OpenClaw)

OpenClaw puede registrar el **stream sin procesar del asistente** antes de cualquier filtrado/formateo.
Esta es la mejor forma de ver si el razonamiento llega como deltas de texto plano
(o como bloques de pensamiento separados).

Habilítalo mediante la CLI:

```bash
pnpm gateway:watch --raw-stream
```

Sustitución opcional de ruta:

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

## Registro de chunk sin procesar (pi-mono)

Para capturar **chunks OpenAI compatibles sin procesar** antes de que se analicen en bloques,
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

> Nota: esto solo lo emiten procesos que usan el proveedor
> `openai-completions` de pi-mono.

## Notas de seguridad

- Los logs de stream sin procesar pueden incluir prompts completos, salida de herramientas y datos de usuario.
- Mantén los logs locales y elimínalos después de depurar.
- Si compartes logs, elimina primero secretos y PII.

## Relacionado

- [Solución de problemas](/es/help/troubleshooting)
- [Preguntas frecuentes](/es/help/faq)
