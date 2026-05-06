---
read_when:
    - Debes inspeccionar la salida sin procesar del modelo para detectar filtraciones de razonamiento
    - Quieres ejecutar el Gateway en modo de observación mientras iteras
    - Necesitas un flujo de trabajo de depuración repetible
summary: 'Herramientas de depuración: modo de observación, transmisiones sin procesar del modelo y rastreo de fugas de razonamiento'
title: Depuración
x-i18n:
    generated_at: "2026-05-06T09:04:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b59845244a1e2920ca15b9b85ce5b29424e3a1528eece8c18ddeab69feaf86f
    source_path: help/debugging.md
    workflow: 16
---

Ayudantes de depuración para la salida en streaming, especialmente cuando un proveedor mezcla el razonamiento en el texto normal.

## Sobrescrituras de depuración en tiempo de ejecución

Usa `/debug` en el chat para establecer sobrescrituras de configuración **solo en tiempo de ejecución** (memoria, no disco).
`/debug` está deshabilitado de forma predeterminada; habilítalo con `commands.debug: true`.
Esto es útil cuando necesitas activar o desactivar ajustes poco habituales sin editar `openclaw.json`.

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
sin activar el modo totalmente detallado.

Ejemplos:

```text
/trace
/trace on
/trace off
```

Usa `/trace` para diagnósticos de plugin, como resúmenes de depuración de Active Memory.
Sigue usando `/verbose` para la salida detallada normal de estado/herramientas, y sigue usando
`/debug` para sobrescrituras de configuración solo en tiempo de ejecución.

## Traza del ciclo de vida del Plugin

Usa `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` cuando los comandos del ciclo de vida de plugins parezcan lentos
y necesites un desglose de fases integrado para metadatos de plugin, descubrimiento, registro,
espejo de tiempo de ejecución, mutación de configuración y trabajo de actualización. La traza es opcional y escribe
en stderr, por lo que la salida JSON del comando sigue siendo analizable.

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

Usa esto para investigar el ciclo de vida de plugins antes de recurrir a un perfilador de CPU.
Si el comando se ejecuta desde un checkout de código fuente, prefiere medir el runtime compilado
con `node dist/entry.js ...` después de `pnpm build`; `pnpm openclaw ...`
también mide la sobrecarga del ejecutor desde código fuente.

## Arranque de la CLI y perfilado de comandos

Usa el benchmark de arranque incluido cuando un comando parezca lento:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Para perfilados puntuales mediante el ejecutor de código fuente normal, establece
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

El ejecutor de código fuente añade flags de perfil de CPU de Node y escribe un `.cpuprofile` para el
comando. Usa esto antes de añadir instrumentación temporal al código del comando.

Para bloqueos de arranque que parezcan trabajo síncrono del sistema de archivos o del cargador de módulos,
añade el flag de traza de E/S síncrona de Node mediante el ejecutor de código fuente:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` habilita este flag de forma predeterminada para el proceso hijo observado del Gateway.
Establece `OPENCLAW_TRACE_SYNC_IO=0` para suprimir la salida de traza de E/S síncrona de Node en modo watch.

## Modo watch del Gateway

Para iterar rápidamente, ejecuta el gateway bajo el observador de archivos:

```bash
pnpm gateway:watch
```

De forma predeterminada, esto inicia o reinicia una sesión tmux llamada
`openclaw-gateway-watch-main` (o una variante específica de perfil/puerto como
`openclaw-gateway-watch-dev-19001`) y se adjunta automáticamente desde terminales interactivas.
Las shells no interactivas, CI y las llamadas de ejecución de agentes permanecen separadas e imprimen
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

Perfila el tiempo de CPU del Gateway observado al depurar puntos calientes de arranque/runtime:

```bash
pnpm gateway:watch --benchmark
```

El wrapper de watch consume `--benchmark` antes de invocar el Gateway y escribe
un `.cpuprofile` de V8 por cada salida del proceso hijo del Gateway bajo
`.artifacts/gateway-watch-profiles/`. Detén o reinicia el gateway observado para
volcar el perfil actual y luego ábrelo con Chrome DevTools o Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Usa `--benchmark-dir <path>` cuando quieras perfiles en otro lugar.
Usa `--benchmark-no-force` cuando quieras que el proceso hijo evaluado omita la limpieza de puerto
`--force` predeterminada y falle rápido si el puerto del Gateway ya está en uso.
El modo benchmark suprime de forma predeterminada el ruido de trazas de E/S síncrona. Establece
`OPENCLAW_TRACE_SYNC_IO=1` con `--benchmark` cuando quieras explícitamente tanto perfiles de CPU
como trazas de pila de E/S síncrona de Node. En modo benchmark, esos bloques de traza
se escriben en `gateway-watch-output.log` bajo el directorio de benchmark y
se filtran del panel de terminal; los logs normales del Gateway siguen visibles.

El wrapper de tmux pasa al panel selectores comunes de runtime no secretos como
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` y `OPENCLAW_SKIP_CHANNELS`. Pon
las credenciales de proveedores en tu perfil/configuración normal, o usa el modo sin procesar en primer plano
para secretos efímeros puntuales.
Si el Gateway observado sale durante el arranque, el observador ejecuta
`openclaw doctor --fix --non-interactive` una vez y reinicia el proceso hijo del Gateway.
Usa `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` cuando quieras el fallo de arranque original
sin la pasada de reparación solo para desarrollo.
El panel tmux gestionado también usa de forma predeterminada logs coloreados del Gateway para facilitar la lectura;
establece `FORCE_COLOR=0` al iniciar `pnpm gateway:watch` para deshabilitar la salida ANSI.

El observador reinicia ante archivos relevantes para la compilación bajo `src/`, archivos fuente de extensiones,
metadatos `package.json` y `openclaw.plugin.json` de extensiones, `tsconfig.json`,
`package.json` y `tsdown.config.ts`. Los cambios de metadatos de extensiones reinician el
gateway sin forzar una recompilación de `tsdown`; los cambios de código fuente y configuración siguen
recompilando `dist` primero.

Añade cualquier flag de CLI del gateway después de `gateway:watch` y se pasará en
cada reinicio. Volver a ejecutar el mismo comando watch recrea el panel tmux nombrado, y
el observador sin procesar sigue manteniendo su bloqueo de observador único para que los padres de observador duplicados
se reemplacen en lugar de acumularse.

## Perfil dev + gateway dev (--dev)

Usa el perfil dev para aislar el estado y levantar una configuración segura y desechable para
depuración. Hay **dos** flags `--dev`:

- **`--dev` global (perfil):** aísla el estado bajo `~/.openclaw-dev` y
  establece el puerto del gateway en `19001` de forma predeterminada (los puertos derivados se desplazan con él).
- **`gateway --dev`: indica al Gateway que cree automáticamente una configuración +
  workspace predeterminados** cuando falten (y que omita BOOTSTRAP.md).

Flujo recomendado (perfil dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Si todavía no tienes una instalación global, ejecuta la CLI mediante `pnpm openclaw ...`.

Qué hace esto:

1. **Aislamiento de perfil** (`--dev` global)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas se desplazan en consecuencia)

2. **Bootstrap dev** (`gateway --dev`)
   - Escribe una configuración mínima si falta (`gateway.mode=local`, enlace a loopback).
   - Establece `agent.workspace` en el workspace dev.
   - Establece `agent.skipBootstrap=true` (sin BOOTSTRAP.md).
   - Inicializa los archivos del workspace si faltan:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identidad predeterminada: **C3-PO** (droide de protocolo).
   - Omite proveedores de canales en modo dev (`OPENCLAW_SKIP_CHANNELS=1`).

Flujo de reinicio (inicio limpio):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` es un flag de perfil **global** y algunos ejecutores lo consumen. Si necesitas escribirlo explícitamente, usa la forma con variable de entorno:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` borra la configuración, las credenciales, las sesiones y el workspace dev (usando
`trash`, no `rm`), y luego recrea la configuración dev predeterminada.

<Tip>
Si ya hay un gateway no dev en ejecución (launchd o systemd), detenlo primero:

```bash
openclaw gateway stop
```

</Tip>

## Registro de stream sin procesar (OpenClaw)

OpenClaw puede registrar el **stream sin procesar del asistente** antes de cualquier filtrado/formateo.
Esta es la mejor manera de ver si el razonamiento llega como deltas de texto plano
(o como bloques de pensamiento separados).

Habilítalo mediante la CLI:

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

## Registro de chunks sin procesar (pi-mono)

Para capturar **chunks sin procesar compatibles con OpenAI** antes de que se analicen en bloques,
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
- Si compartes logs, elimina primero secretos y PII.

## Depuración en VSCode

Los mapas de código fuente son necesarios para habilitar la depuración en IDE basados en VSCode porque muchos de los archivos generados terminan con nombres con hash como parte del proceso de compilación. Las configuraciones `launch.json` incluidas apuntan al servicio Gateway, pero pueden adaptarse rápidamente para otros propósitos:

1. **Recompilar y depurar Gateway** - Depura el servicio Gateway después de crear una nueva compilación
2. **Depurar Gateway** - Depura el servicio Gateway de una compilación preexistente

### Configuración

La configuración predeterminada **Recompilar y depurar Gateway** viene lista para usar; eliminará automáticamente la carpeta `/dist` y recompilará el proyecto con la depuración habilitada:

1. Abre el panel **Ejecutar y depurar** desde la barra de actividad o pulsa `Ctrl`+`Shift`+`D`
2. En el IDE, asegúrate de que **Recompilar y depurar Gateway** esté seleccionado en el desplegable de configuración y luego pulsa el botón **Iniciar depuración**

Alternativamente, si prefieres gestionar manualmente los procesos de compilación y depuración:

1. Abre una terminal y habilita los mapas de código fuente:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. En la misma terminal, recompila el proyecto: `pnpm clean:dist && pnpm build`
3. En el IDE, selecciona la opción **Depurar Gateway** en el desplegable de configuración **Ejecutar y depurar** y luego pulsa el botón **Iniciar depuración**

Ahora puedes establecer puntos de interrupción en tus archivos fuente TypeScript (directorio `src/`) y el depurador asignará correctamente los puntos de interrupción al JavaScript compilado mediante mapas de código fuente. Podrás inspeccionar variables, avanzar por el código y examinar pilas de llamadas como se espera.

### Notas

- Si usas la opción **"Recompilar y depurar Gateway"**, cada vez que se inicie el depurador eliminará por completo la carpeta `/dist` y ejecutará un `pnpm build` completo con mapas de código fuente habilitados antes de iniciar el Gateway
- Si usas la opción **"Depurar Gateway"**, las sesiones de depuración pueden iniciarse y detenerse en cualquier momento sin afectar a la carpeta `/dist`, pero debes usar un proceso de terminal independiente tanto para habilitar la depuración como para gestionar el ciclo de compilación
- Modifica los ajustes de `launch.json` para `args` para depurar otras secciones del proyecto
- Si necesitas usar la CLI compilada de OpenClaw para otras tareas (es decir, `dashboard --no-open` si tu sesión de depuración genera un nuevo token de autenticación), puedes ejecutarla en otra terminal como `node ./openclaw.mjs` o crear un alias de shell como `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## Relacionado

- [Solución de problemas](/es/help/troubleshooting)
- [Preguntas frecuentes](/es/help/faq)
