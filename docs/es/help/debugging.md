---
read_when:
    - Necesitas inspeccionar la salida sin procesar del modelo para detectar filtraciones de razonamiento
    - Quieres ejecutar el Gateway en modo de observación mientras iteras
    - Necesitas un flujo de trabajo de depuración repetible
summary: 'Herramientas de depuración: modo de observación, flujos de modelo sin procesar y rastreo de filtraciones de razonamiento'
title: Depuración
x-i18n:
    generated_at: "2026-06-27T11:40:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f643862e3d88801acabc98c72ac037dc582c2d44da339715ad70d169ca0819fe
    source_path: help/debugging.md
    workflow: 16
---

Ayudantes de depuración para salida en streaming, especialmente cuando un proveedor mezcla razonamiento en el texto normal.

## Sobrescrituras de depuración en runtime

Usa `/debug` en el chat para establecer sobrescrituras de configuración **solo en runtime** (memoria, no disco).
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
`/debug` para sobrescrituras de configuración solo en runtime.

## Traza del ciclo de vida del Plugin

Usa `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` cuando los comandos del ciclo de vida de plugins se sientan lentos
y necesites un desglose integrado por fases para metadatos de plugin, descubrimiento, registro,
espejo de runtime, mutación de configuración y trabajo de actualización. La traza es optativa y escribe
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

## Inicio de CLI y perfilado de comandos

Usa el benchmark de inicio incluido en el repositorio cuando un comando se sienta lento:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Para un perfilado puntual a través del ejecutor normal desde código fuente, establece
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

El ejecutor desde código fuente añade flags de perfil de CPU de Node y escribe un `.cpuprofile` para el
comando. Usa esto antes de añadir instrumentación temporal al código del comando.

Para bloqueos de inicio que parezcan trabajo síncrono del sistema de archivos o del cargador de módulos,
añade el flag de traza de E/S síncrona de Node a través del ejecutor desde código fuente:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` deja este flag deshabilitado de forma predeterminada para el hijo observado del
Gateway. Establece `OPENCLAW_TRACE_SYNC_IO=1` cuando quieras explícitamente la salida de traza de E/S
síncrona de Node en modo observación.

## Modo observación del Gateway

Para iterar rápido, ejecuta el gateway bajo el observador de archivos:

```bash
pnpm gateway:watch
```

De forma predeterminada, esto inicia o reinicia una sesión tmux llamada
`openclaw-gateway-watch-main` (o una variante específica de perfil/puerto como
`openclaw-gateway-watch-dev-19001`) y se adjunta automáticamente desde terminales interactivas.
Los shells no interactivos, CI y las llamadas exec de agentes permanecen desacoplados e imprimen
instrucciones para adjuntarse en su lugar. Adjunta manualmente cuando sea necesario:

```bash
tmux attach -t openclaw-gateway-watch-main
```

El panel tmux ejecuta el observador sin envoltorios:

```bash
node scripts/watch-node.mjs gateway --force
```

Usa el modo en primer plano cuando no quieras tmux:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Deshabilita la auto-adjunción mientras mantienes la gestión de tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Perfila el tiempo de CPU del Gateway observado al depurar puntos calientes de inicio/runtime:

```bash
pnpm gateway:watch --benchmark
```

El envoltorio de observación consume `--benchmark` antes de invocar el Gateway y escribe
un `.cpuprofile` de V8 por cada salida del hijo Gateway bajo
`.artifacts/gateway-watch-profiles/`. Detén o reinicia el gateway observado para
vaciar el perfil actual, luego ábrelo con Chrome DevTools o Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Usa `--benchmark-dir <path>` cuando quieras perfiles en otro lugar.
Usa `--benchmark-no-force` cuando quieras que el hijo medido omita la limpieza de puerto
`--force` predeterminada y falle rápido si el puerto del Gateway ya está en uso.
El modo benchmark suprime de forma predeterminada el ruido de traza de E/S síncrona. Establece
`OPENCLAW_TRACE_SYNC_IO=1` con `--benchmark` cuando quieras explícitamente tanto perfiles de CPU
como trazas de pila de E/S síncrona de Node. En modo benchmark, esos bloques de traza
se escriben en `gateway-watch-output.log` bajo el directorio de benchmark y se
filtran del panel de terminal; los logs normales del Gateway siguen visibles.

El envoltorio tmux transporta selectores comunes no secretos de runtime como
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` y `OPENCLAW_SKIP_CHANNELS` al panel. Pon
las credenciales de proveedor en tu perfil/configuración normal, o usa el modo sin envoltorios en primer plano
para secretos efímeros puntuales.
Si el Gateway observado sale durante el inicio, el observador ejecuta
`openclaw doctor --fix --non-interactive` una vez y reinicia el hijo Gateway.
Usa `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` cuando quieras el fallo de inicio original
sin el paso de reparación solo para desarrollo.
El panel tmux gestionado también usa de forma predeterminada logs del Gateway con color para facilitar la lectura;
establece `FORCE_COLOR=0` al iniciar `pnpm gateway:watch` para deshabilitar la salida ANSI.

El observador se reinicia con archivos relevantes para compilación bajo `src/`, archivos fuente de extensiones,
metadatos `package.json` y `openclaw.plugin.json` de extensiones, `tsconfig.json`,
`package.json` y `tsdown.config.ts`. Los cambios de metadatos de extensiones reinician el
gateway sin forzar una reconstrucción de `tsdown`; los cambios de código fuente y configuración todavía
reconstruyen `dist` primero.

Añade cualquier flag de CLI del gateway después de `gateway:watch` y se pasará en
cada reinicio. Volver a ejecutar el mismo comando de observación recrea el panel tmux nombrado, y
el observador sin envoltorios todavía mantiene su bloqueo de observador único, por lo que los padres observadores duplicados
se reemplazan en lugar de acumularse.

## Perfil de desarrollo + gateway de desarrollo (--dev)

Usa el perfil de desarrollo para aislar el estado y levantar una configuración segura y desechable para
depuración. Hay **dos** flags `--dev`:

- **`--dev` global (perfil):** aísla el estado bajo `~/.openclaw-dev` y
  establece de forma predeterminada el puerto del gateway en `19001` (los puertos derivados se desplazan con él).
- **`gateway --dev`: indica al Gateway que cree automáticamente una configuración + workspace predeterminados** cuando falten (y omita BOOTSTRAP.md).

Flujo recomendado (perfil de desarrollo + arranque de desarrollo):

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

2. **Arranque de desarrollo** (`gateway --dev`)
   - Escribe una configuración mínima si falta (`gateway.mode=local`, enlaza loopback).
   - Establece `agent.workspace` al workspace de desarrollo.
   - Establece `agent.skipBootstrap=true` (sin BOOTSTRAP.md).
   - Inicializa los archivos del workspace si faltan:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identidad predeterminada: **C3-PO** (droide de protocolo).
   - Omite proveedores de canal en modo desarrollo (`OPENCLAW_SKIP_CHANNELS=1`).

Flujo de restablecimiento (inicio limpio):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` es un flag de perfil **global** y algunos ejecutores lo consumen. Si necesitas escribirlo explícitamente, usa la forma con variable de entorno:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` borra configuración, credenciales, sesiones y el workspace de desarrollo (usando
`trash`, no `rm`), y luego recrea la configuración de desarrollo predeterminada.

<Tip>
Si ya hay un gateway que no es de desarrollo ejecutándose (launchd o systemd), detenlo primero:

```bash
openclaw gateway stop
```

</Tip>

## Registro de stream sin procesar (OpenClaw)

OpenClaw puede registrar el **stream sin procesar del asistente** antes de cualquier filtrado/formateo.
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

## Registro de chunks OpenAI-compatible sin procesar

Para capturar **chunks OpenAI-compat sin procesar** antes de que se analicen en bloques,
habilita el registrador de transporte:

```bash
OPENCLAW_RAW_STREAM=1
```

Ruta opcional:

```bash
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-openai-completions.jsonl
```

Archivo predeterminado:

`~/.openclaw/logs/raw-openai-completions.jsonl`

## Notas de seguridad

- Los logs de stream sin procesar pueden incluir prompts completos, salida de herramientas y datos de usuario.
- Mantén los logs locales y elimínalos después de depurar.
- Si compartes logs, elimina primero secretos e información personal identificable.

## Depuración en VSCode

Los mapas de código fuente son necesarios para habilitar la depuración en IDE basados en VSCode porque muchos de los archivos generados terminan con nombres con hash como parte del proceso de compilación. Las configuraciones `launch.json` incluidas apuntan al servicio Gateway, pero pueden adaptarse rápidamente para otros fines:

1. **Recompilar y depurar Gateway** - Depura el servicio Gateway después de crear una nueva compilación
2. **Depurar Gateway** - Depura el servicio Gateway de una compilación preexistente

### Configuración

La configuración predeterminada **Recompilar y depurar Gateway** incluye todo lo necesario; eliminará automáticamente la carpeta `/dist` y recompilará el proyecto con la depuración habilitada:

1. Abre el panel **Run and Debug** desde la barra de actividad o presiona `Ctrl`+`Shift`+`D`
2. En el IDE, asegúrate de que **Rebuild and Debug Gateway** esté seleccionado en el menú desplegable de configuración y luego presiona el botón **Start Debugging**

Alternativamente, si prefieres gestionar manualmente los procesos de compilación y depuración:

1. Abre una terminal y habilita los mapas de código fuente:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. En la misma terminal, recompila el proyecto: `pnpm clean:dist && pnpm build`
3. En el IDE, selecciona la opción **Debug Gateway** en el menú desplegable de configuración **Run and Debug** y luego presiona el botón **Start Debugging**

Ahora puedes establecer puntos de interrupción en tus archivos fuente TypeScript (directorio `src/`) y el depurador asignará correctamente los puntos de interrupción al JavaScript compilado mediante mapas de código fuente. Podrás inspeccionar variables, avanzar paso a paso por el código y examinar pilas de llamadas como se espera.

### Notas

- Si usas la opción **"Rebuild and Debug Gateway"**, cada vez que se lance el depurador eliminará por completo la carpeta `/dist` y ejecutará un `pnpm build` completo con mapas de código fuente habilitados antes de iniciar el Gateway
- Si usas la opción **"Debug Gateway"**, las sesiones de depuración pueden iniciarse y detenerse en cualquier momento sin afectar la carpeta `/dist`, pero debes usar un proceso de terminal separado tanto para habilitar la depuración como para gestionar el ciclo de compilación
- Modifica la configuración `launch.json` para `args` para depurar otras secciones del proyecto
- Si necesitas usar la CLI de OpenClaw compilada para otras tareas (es decir, `dashboard --no-open` si tu sesión de depuración genera un nuevo token de autenticación), puedes ejecutarla en otra terminal como `node ./openclaw.mjs` o crear un alias de shell como `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## Relacionado

- [Solución de problemas](/es/help/troubleshooting)
- [Preguntas frecuentes](/es/help/faq)
