---
read_when:
    - Necesitas inspeccionar la salida sin procesar del modelo para detectar filtraciones de razonamiento
    - Quieres ejecutar el Gateway en modo de observación mientras iteras
    - Necesitas un flujo de trabajo de depuración repetible
summary: 'Herramientas de depuración: modo de observación, flujos sin procesar del modelo y rastreo de filtraciones de razonamiento'
title: Depuración
x-i18n:
    generated_at: "2026-05-03T21:33:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7230112013a8db8d6a3853b765f4302a61609051ac4ffaf35a6f09de328deafc
    source_path: help/debugging.md
    workflow: 16
---

Ayudantes de depuración para la salida en streaming, especialmente cuando un proveedor mezcla razonamiento en texto normal.

## Sobrescrituras de depuración en tiempo de ejecución

Usa `/debug` en el chat para establecer sobrescrituras de configuración **solo en tiempo de ejecución** (memoria, no disco).
`/debug` está deshabilitado de forma predeterminada; habilítalo con `commands.debug: true`.
Esto resulta útil cuando necesitas alternar ajustes poco comunes sin editar `openclaw.json`.

Ejemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` borra todas las sobrescrituras y vuelve a la configuración en disco.

## Salida de traza de sesión

Usa `/trace` cuando quieras ver líneas de traza/depuración propiedad del plugin en una sesión
sin activar el modo detallado completo.

Ejemplos:

```text
/trace
/trace on
/trace off
```

Usa `/trace` para diagnósticos de plugin, como resúmenes de depuración de Active Memory.
Sigue usando `/verbose` para la salida detallada normal de estado/herramientas, y sigue usando
`/debug` para sobrescrituras de configuración solo en tiempo de ejecución.

## Traza del ciclo de vida del plugin

Usa `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` cuando los comandos del ciclo de vida del plugin parezcan lentos
y necesites un desglose de fases integrado para metadatos de plugin, descubrimiento, registro,
espejo de tiempo de ejecución, mutación de configuración y trabajo de actualización. La traza es opcional y escribe
en stderr, por lo que la salida JSON del comando sigue siendo parseable.

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

Usa esto para investigar el ciclo de vida del plugin antes de recurrir a un perfilador de CPU.
Si el comando se ejecuta desde un checkout de código fuente, prefiere medir el tiempo de ejecución compilado
con `node dist/entry.js ...` después de `pnpm build`; `pnpm openclaw ...`
también mide la sobrecarga del ejecutor desde código fuente.

## Arranque de la CLI y perfilado de comandos

Usa el benchmark de arranque incluido cuando un comando parezca lento:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Para un perfilado puntual mediante el ejecutor normal desde código fuente, establece
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

El ejecutor desde código fuente añade flags de perfil de CPU de Node y escribe un `.cpuprofile` para el
comando. Usa esto antes de añadir instrumentación temporal al código del comando.

## Modo de observación del Gateway

Para iterar rápidamente, ejecuta el gateway bajo el observador de archivos:

```bash
pnpm gateway:watch
```

De forma predeterminada, esto inicia o reinicia una sesión tmux llamada
`openclaw-gateway-watch-main` (o una variante específica de perfil/puerto como
`openclaw-gateway-watch-dev-19001`) y se adjunta automáticamente desde terminales interactivos.
Las shells no interactivas, CI y llamadas exec de agentes permanecen desacopladas e imprimen
instrucciones para adjuntarse. Adjunta manualmente cuando sea necesario:

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

Deshabilita el adjuntado automático manteniendo la gestión de tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Perfila el tiempo de CPU del Gateway observado al depurar puntos calientes de arranque/tiempo de ejecución:

```bash
pnpm gateway:watch --benchmark
```

El wrapper de observación consume `--benchmark` antes de invocar el Gateway y escribe
un `.cpuprofile` de V8 por cada salida de proceso hijo del Gateway en
`.artifacts/gateway-watch-profiles/`. Detén o reinicia el gateway observado para
volcar el perfil actual, luego ábrelo con Chrome DevTools o Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Usa `--benchmark-dir <path>` cuando quieras guardar perfiles en otro lugar.
Usa `--benchmark-no-force` cuando quieras que el proceso hijo con benchmark omita la
limpieza de puerto predeterminada `--force` y falle rápido si el puerto del Gateway ya está en
uso.

El wrapper de tmux transporta selectores comunes de tiempo de ejecución que no son secretos, como
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` y `OPENCLAW_SKIP_CHANNELS` al panel. Pon
las credenciales de proveedor en tu perfil/configuración normal, o usa el modo sin procesar en primer plano
para secretos efímeros puntuales.
Si el Gateway observado sale durante el arranque, el observador ejecuta
`openclaw doctor --fix --non-interactive` una vez y reinicia el proceso hijo del Gateway.
Usa `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` cuando quieras el fallo de arranque original
sin el paso de reparación solo para desarrollo.
El panel tmux gestionado también usa de forma predeterminada logs de Gateway con color para mejorar la legibilidad;
establece `FORCE_COLOR=0` al iniciar `pnpm gateway:watch` para deshabilitar la salida ANSI.

El observador reinicia al detectar archivos relevantes para compilación en `src/`, archivos fuente de extensiones,
metadatos `package.json` y `openclaw.plugin.json` de extensiones, `tsconfig.json`,
`package.json` y `tsdown.config.ts`. Los cambios de metadatos de extensiones reinician el
gateway sin forzar una recompilación de `tsdown`; los cambios de código fuente y configuración aún
recompilan `dist` primero.

Añade cualquier flag de CLI del gateway después de `gateway:watch` y se transmitirá en
cada reinicio. Volver a ejecutar el mismo comando de observación recrea el panel tmux con nombre, y
el observador sin procesar aún mantiene su bloqueo de observador único, por lo que los procesos padre de observadores duplicados
se reemplazan en lugar de acumularse.

## Perfil de desarrollo + Gateway de desarrollo (--dev)

Usa el perfil de desarrollo para aislar el estado y levantar una configuración segura y desechable para
depuración. Hay **dos** flags `--dev`:

- **`--dev` global (perfil):** aísla el estado en `~/.openclaw-dev` y
  establece de forma predeterminada el puerto del gateway en `19001` (los puertos derivados se desplazan con él).
- **`gateway --dev`: indica al Gateway que cree automáticamente una configuración +
  espacio de trabajo predeterminados** cuando falten (y omita BOOTSTRAP.md).

Flujo recomendado (perfil de desarrollo + arranque de desarrollo):

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
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas se desplazan en consecuencia)

2. **Arranque de desarrollo** (`gateway --dev`)
   - Escribe una configuración mínima si falta (`gateway.mode=local`, bind loopback).
   - Establece `agent.workspace` en el espacio de trabajo de desarrollo.
   - Establece `agent.skipBootstrap=true` (sin BOOTSTRAP.md).
   - Inicializa los archivos del espacio de trabajo si faltan:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identidad predeterminada: **C3‑PO** (droide de protocolo).
   - Omite proveedores de canales en modo desarrollo (`OPENCLAW_SKIP_CHANNELS=1`).

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

`--reset` borra la configuración, credenciales, sesiones y el espacio de trabajo de desarrollo (usando
`trash`, no `rm`), y luego recrea la configuración de desarrollo predeterminada.

<Tip>
Si un gateway que no es de desarrollo ya está ejecutándose (launchd o systemd), detenlo primero:

```bash
openclaw gateway stop
```

</Tip>

## Registro del stream sin procesar (OpenClaw)

OpenClaw puede registrar el **stream del asistente sin procesar** antes de cualquier filtrado/formato.
Esta es la mejor forma de ver si el razonamiento llega como deltas de texto plano
(o como bloques de pensamiento separados).

Habilítalo mediante CLI:

```bash
pnpm gateway:watch --raw-stream
```

Sobrescritura de ruta opcional:

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

Para capturar **fragmentos OpenAI-compat sin procesar** antes de que se parseen en bloques,
pi-mono expone un registrador independiente:

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
- Si compartes logs, elimina primero secretos e información de identificación personal.

## Relacionado

- [Solución de problemas](/es/help/troubleshooting)
- [Preguntas frecuentes](/es/help/faq)
