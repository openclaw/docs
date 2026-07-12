---
read_when:
    - Necesitas inspeccionar la salida sin procesar del modelo para detectar filtraciones del razonamiento
    - Quieres ejecutar el Gateway en modo de vigilancia mientras realizas cambios iterativos
    - Necesitas un flujo de trabajo de depuración reproducible
summary: 'Herramientas de depuración: modo de observación, flujos sin procesar del modelo y rastreo de filtraciones del razonamiento'
title: Depuración
x-i18n:
    generated_at: "2026-07-11T23:09:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7723dfffdcd74e8e6b7bdec2507f9b008f5e0e8f82295a4e687f3b84f142df9
    source_path: help/debugging.md
    workflow: 16
---

Ayudantes de depuración para la salida en streaming, la iteración del Gateway y la generación de perfiles de inicio.

## Sobrescrituras de depuración en tiempo de ejecución

`/debug` establece sobrescrituras de configuración **solo para el tiempo de ejecución** (en memoria, no en disco). Está desactivado de forma predeterminada; actívelo con `commands.debug: true`.

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` borra todas las sobrescrituras y vuelve a la configuración almacenada en disco.

## Salida de trazas de sesión

`/trace` muestra las líneas de traza y depuración gestionadas por el plugin para una sesión, sin activar el modo detallado completo. Úselo para diagnósticos de plugins, como los resúmenes de depuración de Active Memory; use `/verbose` para la salida normal de estado y herramientas.

```text
/trace
/trace on
/trace off
```

## Traza del ciclo de vida de los plugins

Establezca `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` para obtener un desglose fase por fase del trabajo relacionado con los metadatos, el descubrimiento, el registro, la réplica en tiempo de ejecución, la modificación de la configuración y la actualización de los plugins. Escribe en stderr, por lo que la salida JSON del comando sigue siendo analizable.

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Use esto antes de recurrir a un generador de perfiles de CPU. Desde una copia de trabajo del código fuente, mida el entorno de ejecución compilado con `node dist/entry.js ...` después de `pnpm build`; `pnpm openclaw ...` también mide la sobrecarga del ejecutor del código fuente.

## Inicio de la CLI y generación de perfiles de comandos

Pruebas de rendimiento de inicio incluidas en el repositorio:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Para generar un perfil puntual mediante el ejecutor normal del código fuente, establezca `OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

El ejecutor del código fuente añade las opciones de perfil de CPU de Node y escribe un archivo `.cpuprofile` para el comando. Use esto antes de añadir instrumentación temporal al código del comando.

Para bloqueos durante el inicio que parezcan deberse a operaciones síncronas del sistema de archivos o del cargador de módulos, añada la opción de traza de E/S síncrona de Node mediante el ejecutor del código fuente:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` deja esta opción desactivada de forma predeterminada para el proceso secundario del Gateway supervisado; establezca `OPENCLAW_TRACE_SYNC_IO=1` cuando también quiera obtener la salida de la traza de E/S síncrona en el modo de supervisión.

## Modo de supervisión del Gateway

```bash
pnpm gateway:watch
```

De forma predeterminada, esto inicia o reinicia una sesión de tmux denominada `openclaw-gateway-watch-<profile>` (por ejemplo, `openclaw-gateway-watch-main`), con un sufijo de puerto como `openclaw-gateway-watch-dev-19001` añadido solo cuando `OPENCLAW_GATEWAY_PORT` difiere del puerto predeterminado `18789`. Se conecta automáticamente desde terminales interactivas; los shells no interactivos, la CI y las llamadas de ejecución de agentes permanecen desconectados y, en su lugar, muestran instrucciones para conectarse:

```bash
tmux attach -t openclaw-gateway-watch-main
```

El panel de tmux ejecuta el supervisor sin procesar:

```bash
node scripts/watch-node.mjs gateway --force
```

Detenga un servicio Gateway instalado antes de supervisar el mismo puerto:

```bash
pnpm openclaw gateway stop
```

La opción `--force` del supervisor libera el puerto actualmente en escucha, pero no desactiva un servicio supervisado. De lo contrario, un servicio de launchd, systemd o una tarea programada puede volver a iniciarse y sustituir al Gateway supervisado.

Modo en primer plano sin tmux:

```bash
pnpm gateway:watch:raw
# o
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Mantenga la gestión mediante tmux, pero desactive la conexión automática:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Genere un perfil del tiempo de CPU del Gateway supervisado al depurar puntos críticos del inicio o del tiempo de ejecución:

```bash
pnpm gateway:watch --benchmark
```

El contenedor de supervisión procesa `--benchmark` antes de invocar al Gateway y escribe un archivo `.cpuprofile` de V8 por cada finalización del proceso secundario del Gateway en `.artifacts/gateway-watch-profiles/`. Detenga o reinicie el Gateway supervisado para volcar el perfil actual y, después, ábralo con Chrome DevTools o Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: escribe los perfiles en otra ubicación.
- `--benchmark-no-force`: omite la limpieza predeterminada del puerto mediante `--force` y falla inmediatamente si el puerto del Gateway ya está en uso.

El modo de pruebas de rendimiento suprime de forma predeterminada el exceso de mensajes de la traza de E/S síncrona. Establezca `OPENCLAW_TRACE_SYNC_IO=1` junto con `--benchmark` para obtener tanto perfiles de CPU como trazas de pila de E/S síncrona; en el modo de pruebas de rendimiento, esos bloques de traza se escriben en `gateway-watch-output.log` dentro del directorio de las pruebas de rendimiento (y se filtran del panel de la terminal), mientras que los registros normales del Gateway siguen siendo visibles.

El contenedor de tmux transmite al panel los selectores habituales y no secretos del entorno de ejecución, incluidos `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` y `OPENCLAW_SKIP_CHANNELS`. Guarde las credenciales del proveedor en su perfil o configuración habitual, o use el modo sin procesar en primer plano para secretos efímeros puntuales.

Si el Gateway supervisado finaliza durante el inicio, el supervisor ejecuta `openclaw doctor --fix --non-interactive` una vez y reinicia el proceso secundario del Gateway. Establezca `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` para ver el fallo de inicio original sin la fase de reparación exclusiva del entorno de desarrollo.

El panel de tmux gestionado muestra de forma predeterminada los registros del Gateway en color; establezca `FORCE_COLOR=0` al iniciar `pnpm gateway:watch` para desactivar la salida ANSI.

El supervisor reinicia el proceso cuando cambian archivos relevantes para la compilación dentro de `src/`, archivos de código fuente de extensiones, los metadatos `package.json` y `openclaw.plugin.json` de las extensiones, `tsconfig.json`, `package.json` y `tsdown.config.ts`. Los cambios en los metadatos de las extensiones reinician el Gateway sin forzar una nueva compilación; los cambios en el código fuente y la configuración siguen recompilando primero `dist`.

Añada opciones de la CLI del Gateway después de `gateway:watch` para transmitirlas en cada reinicio. Volver a ejecutar el mismo comando de supervisión vuelve a crear el panel de tmux con el nombre correspondiente; el supervisor sin procesar mantiene un bloqueo de supervisor único, por lo que los procesos principales duplicados se sustituyen en lugar de acumularse.

## Perfil de desarrollo y Gateway de desarrollo (`--dev`)

Hay dos opciones `--dev` **independientes**:

- **`--dev` global (perfil):** aísla el estado en `~/.openclaw-dev` y establece de forma predeterminada el puerto del Gateway en `19001` (los puertos derivados se desplazan junto con él).
- **`gateway --dev`:** indica al Gateway que cree automáticamente una configuración y un espacio de trabajo predeterminados cuando no existan (y que omita la inicialización).

Flujo recomendado (perfil de desarrollo e inicialización de desarrollo):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Sin una instalación global, ejecute la CLI mediante `pnpm openclaw ...`.

Esto hace lo siguiente:

1. **Aislamiento del perfil** (`--dev` global)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (los puertos del navegador y del lienzo se desplazan en consecuencia)

2. **Inicialización de desarrollo** (`gateway --dev`)
   - Escribe una configuración mínima si no existe (`gateway.mode=local`, enlace a local loopback).
   - Establece `agents.defaults.workspace` en el espacio de trabajo de desarrollo y `agents.defaults.skipBootstrap=true`.
   - Crea los archivos iniciales del espacio de trabajo si no existen: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`.
   - Identidad predeterminada: **C3-PO** (droide de protocolo).
   - `pnpm gateway:dev` también establece `OPENCLAW_SKIP_CHANNELS=1` para omitir los proveedores de canales.

Flujo de restablecimiento (inicio desde cero):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` es una opción **global** de perfil y algunos ejecutores la consumen. Si necesita especificarla explícitamente, use la forma de variable de entorno:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` borra la configuración, las credenciales, las sesiones y el espacio de trabajo de desarrollo (se mueven a la papelera, no se eliminan) y, después, vuelve a crear la configuración de desarrollo predeterminada.

<Tip>
Si ya se está ejecutando un Gateway que no es de desarrollo (mediante launchd o systemd), deténgalo primero:

```bash
openclaw gateway stop
```

</Tip>

## Registro del flujo sin procesar

OpenClaw puede registrar el **flujo sin procesar del asistente** antes de cualquier filtrado o formato. Esta es la mejor manera de comprobar si el razonamiento llega como deltas de texto sin formato o como bloques de pensamiento independientes.

Actívelo mediante la CLI:

```bash
pnpm gateway:watch --raw-stream
```

Sobrescritura opcional de la ruta:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Variables de entorno equivalentes:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Archivo predeterminado: `~/.openclaw/logs/raw-stream.jsonl`

## Notas de seguridad

- Los registros del flujo sin procesar pueden incluir prompts completos, la salida de las herramientas y datos del usuario.
- Mantenga los registros localmente y elimínelos después de la depuración.
- Si comparte los registros, elimine primero los secretos y la información de identificación personal.

## Depuración en VSCode

Los mapas de código fuente son necesarios porque la compilación genera nombres de archivo con hashes. El archivo `launch.json` incluido apunta al servicio Gateway:

1. **Rebuild and Debug Gateway**: elimina `/dist` y vuelve a compilar con la depuración activada antes de iniciar el Gateway.
2. **Debug Gateway**: depura una compilación existente sin modificar `/dist`.

### Configuración

1. Abra **Run and Debug** (en la barra de actividades o con `Ctrl`+`Shift`+`D`).
2. Seleccione **Rebuild and Debug Gateway** y pulse **Start Debugging**.

Para gestionar manualmente el ciclo de compilación y depuración:

1. Active los mapas de código fuente en una terminal:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Vuelva a compilar: `pnpm clean:dist && pnpm build`
3. Seleccione **Debug Gateway** y pulse **Start Debugging**.

Establezca puntos de interrupción en los archivos TypeScript de `src/`; el depurador los asigna al JavaScript compilado mediante los mapas de código fuente.

### Notas

- **Rebuild and Debug Gateway** elimina `/dist` y ejecuta una compilación completa con `pnpm build` y mapas de código fuente en cada inicio.
- **Debug Gateway** puede iniciarse y detenerse sin afectar a `/dist`, pero debe gestionar el ciclo de compilación en otra terminal.
- Edite `args` en `launch.json` para depurar otros subcomandos de la CLI.
- Para usar la CLI compilada en otras tareas (por ejemplo, `dashboard --no-open` si la sesión de depuración genera un nuevo token de autenticación), ejecútela desde otra terminal: `node ./openclaw.mjs` o mediante un alias como `alias openclaw-build="node $(pwd)/openclaw.mjs"`.

## Contenido relacionado

- [Solución de problemas](/es/help/troubleshooting)
- [Preguntas frecuentes](/es/help/faq)
