---
read_when:
    - Debes inspeccionar la salida sin procesar del modelo para detectar filtraciones de razonamiento
    - Desea ejecutar el Gateway en modo de observación mientras itera
    - Necesitas un flujo de trabajo de depuración repetible
summary: 'Herramientas de depuración: modo de observación, flujos sin procesar del modelo y rastreo de filtraciones de razonamiento'
title: Depuración
x-i18n:
    generated_at: "2026-05-05T01:46:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d86bd9b5dd08615d3c283f3fcb2a885f5134fa7e1cdece86b6a796d08a659ec
    source_path: help/debugging.md
    workflow: 16
---

Ayudantes de depuración para salida en streaming, especialmente cuando un proveedor mezcla razonamiento en texto normal.

## Sobrescrituras de depuración en tiempo de ejecución

Usa `/debug` en el chat para establecer sobrescrituras de configuración **solo en tiempo de ejecución** (memoria, no disco).
`/debug` está deshabilitado de forma predeterminada; habilítalo con `commands.debug: true`.
Esto resulta útil cuando necesitas activar o desactivar ajustes poco conocidos sin editar `openclaw.json`.

Ejemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` borra todas las sobrescrituras y vuelve a la configuración guardada en disco.

## Salida de traza de sesión

Usa `/trace` cuando quieras ver líneas de traza/depuración propias del Plugin en una sesión
sin activar el modo detallado completo.

Ejemplos:

```text
/trace
/trace on
/trace off
```

Usa `/trace` para diagnósticos de Plugin, como resúmenes de depuración de Active Memory.
Sigue usando `/verbose` para la salida detallada normal de estado/herramientas, y sigue usando
`/debug` para sobrescrituras de configuración solo en tiempo de ejecución.

## Traza de ciclo de vida del Plugin

Usa `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` cuando los comandos de ciclo de vida del Plugin se sientan lentos
y necesites un desglose integrado por fases para metadatos de Plugin, descubrimiento, registro,
espejo de tiempo de ejecución, mutación de configuración y trabajo de actualización. La traza es opcional y escribe
en stderr, por lo que la salida de comandos JSON sigue siendo parseable.

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

Usa esto para investigar el ciclo de vida del Plugin antes de recurrir a un perfilador de CPU.
Si el comando se ejecuta desde un checkout de código fuente, prefiere medir el tiempo de ejecución compilado
con `node dist/entry.js ...` después de `pnpm build`; `pnpm openclaw ...`
también mide la sobrecarga del ejecutor de código fuente.

## Perfilado de inicio de CLI y comandos

Usa el benchmark de inicio incluido cuando un comando se sienta lento:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Para perfilado puntual mediante el ejecutor de código fuente normal, establece
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

El ejecutor de código fuente agrega marcas de perfilado de CPU de Node y escribe un `.cpuprofile` para el
comando. Usa esto antes de agregar instrumentación temporal al código del comando.

Para bloqueos de inicio que parezcan trabajo síncrono del sistema de archivos o del cargador de módulos,
agrega la marca de traza de E/S síncrona de Node mediante el ejecutor de código fuente:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` habilita esta marca de forma predeterminada para el hijo observado del Gateway.
Establece `OPENCLAW_TRACE_SYNC_IO=0` para suprimir la salida de traza de E/S síncrona de Node en modo de observación.

## Modo de observación del Gateway

Para iteración rápida, ejecuta el gateway bajo el observador de archivos:

```bash
pnpm gateway:watch
```

De forma predeterminada, esto inicia o reinicia una sesión de tmux llamada
`openclaw-gateway-watch-main` (o una variante específica de perfil/puerto como
`openclaw-gateway-watch-dev-19001`) y se adjunta automáticamente desde terminales interactivos.
Los shells no interactivos, CI y llamadas exec de agentes permanecen desacoplados e imprimen
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

Deshabilita el autoacoplamiento mientras mantienes la gestión de tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Perfila el tiempo de CPU del Gateway observado al depurar puntos críticos de inicio/tiempo de ejecución:

```bash
pnpm gateway:watch --benchmark
```

El contenedor de observación consume `--benchmark` antes de invocar el Gateway y escribe
un `.cpuprofile` de V8 por cada salida del hijo del Gateway bajo
`.artifacts/gateway-watch-profiles/`. Detén o reinicia el gateway observado para
volcar el perfil actual, luego ábrelo con Chrome DevTools o Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Usa `--benchmark-dir <path>` cuando quieras perfiles en otro lugar.
Usa `--benchmark-no-force` cuando quieras que el hijo medido omita la limpieza de puerto
`--force` predeterminada y falle rápido si el puerto del Gateway ya está en
uso.
El modo benchmark suprime de forma predeterminada el ruido de traza de E/S síncrona. Establece
`OPENCLAW_TRACE_SYNC_IO=1` con `--benchmark` cuando quieras explícitamente tanto perfiles de CPU
como trazas de pila de E/S síncrona de Node. En modo benchmark, esos bloques de traza
se escriben en `gateway-watch-output.log` bajo el directorio de benchmark y
se filtran del panel de terminal; los registros normales del Gateway siguen visibles.

El contenedor de tmux lleva selectores comunes de tiempo de ejecución no secretos como
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` y `OPENCLAW_SKIP_CHANNELS` al panel. Pon
las credenciales del proveedor en tu perfil/configuración normal, o usa el modo en primer plano sin procesar
para secretos efímeros puntuales.
Si el Gateway observado sale durante el inicio, el observador ejecuta
`openclaw doctor --fix --non-interactive` una vez y reinicia el hijo del Gateway.
Usa `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` cuando quieras el fallo de inicio original
sin el pase de reparación solo para desarrollo.
El panel de tmux gestionado también usa por defecto registros del Gateway con color para legibilidad;
establece `FORCE_COLOR=0` al iniciar `pnpm gateway:watch` para deshabilitar la salida ANSI.

El observador reinicia ante archivos relevantes para compilación bajo `src/`, archivos fuente de extensiones,
metadatos de `package.json` y `openclaw.plugin.json` de extensiones, `tsconfig.json`,
`package.json` y `tsdown.config.ts`. Los cambios de metadatos de extensiones reinician el
gateway sin forzar una recompilación de `tsdown`; los cambios de fuente y configuración aún
recompilan `dist` primero.

Agrega cualquier marca de CLI del gateway después de `gateway:watch` y se pasarán en
cada reinicio. Volver a ejecutar el mismo comando de observación recrea el panel de tmux nombrado, y
el observador sin procesar aún conserva su bloqueo de observador único para que los padres observadores duplicados
se reemplacen en lugar de acumularse.

## Perfil de desarrollo + gateway de desarrollo (--dev)

Usa el perfil de desarrollo para aislar el estado y levantar una configuración segura y descartable para
depuración. Hay **dos** marcas `--dev`:

- **`--dev` global (perfil):** aísla el estado bajo `~/.openclaw-dev` y
  establece por defecto el puerto del gateway en `19001` (los puertos derivados se desplazan con él).
- **`gateway --dev`: le dice al Gateway que cree automáticamente una configuración predeterminada +
  espacio de trabajo** cuando falten (y que omita BOOTSTRAP.md).

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
   - Escribe una configuración mínima si falta (`gateway.mode=local`, enlazar a loopback).
   - Establece `agent.workspace` en el espacio de trabajo de desarrollo.
   - Establece `agent.skipBootstrap=true` (sin BOOTSTRAP.md).
   - Inicializa los archivos del espacio de trabajo si faltan:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identidad predeterminada: **C3‑PO** (androide de protocolo).
   - Omite proveedores de canales en modo de desarrollo (`OPENCLAW_SKIP_CHANNELS=1`).

Flujo de restablecimiento (inicio limpio):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` es una marca de perfil **global** y algunos ejecutores la consumen. Si necesitas escribirlo explícitamente, usa la forma de variable de entorno:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` borra configuración, credenciales, sesiones y el espacio de trabajo de desarrollo (usando
`trash`, no `rm`), y luego recrea la configuración de desarrollo predeterminada.

<Tip>
Si ya hay un gateway que no es de desarrollo en ejecución (launchd o systemd), detenlo primero:

```bash
openclaw gateway stop
```

</Tip>

## Registro de stream sin procesar (OpenClaw)

OpenClaw puede registrar el **stream sin procesar del asistente** antes de cualquier filtrado/formateo.
Esta es la mejor manera de ver si el razonamiento llega como deltas de texto plano
(o como bloques de pensamiento separados).

Habilítalo mediante CLI:

```bash
pnpm gateway:watch --raw-stream
```

Sobrescritura opcional de ruta:

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

Para capturar **fragmentos sin procesar compatibles con OpenAI** antes de que se parseen en bloques,
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

- Los registros de stream sin procesar pueden incluir prompts completos, salida de herramientas y datos de usuario.
- Mantén los registros locales y elimínalos después de depurar.
- Si compartes registros, elimina primero secretos y PII.

## Relacionado

- [Solución de problemas](/es/help/troubleshooting)
- [Preguntas frecuentes](/es/help/faq)
