---
read_when:
    - Debes inspeccionar la salida sin procesar del modelo para detectar filtraciones del razonamiento
    - Quieres ejecutar el Gateway en modo de observación mientras haces cambios iterativos
    - Necesitas un flujo de trabajo de depuración reproducible
summary: 'Herramientas de depuración: modo de observación, flujos sin procesar del modelo y rastreo de filtraciones del razonamiento'
title: Depuración
x-i18n:
    generated_at: "2026-07-12T14:36:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a7723dfffdcd74e8e6b7bdec2507f9b008f5e0e8f82295a4e687f3b84f142df9
    source_path: help/debugging.md
    workflow: 16
---

Ayudantes de depuración para la salida en streaming, la iteración del Gateway y la creación de perfiles de inicio.

## Sustituciones de depuración en tiempo de ejecución

`/debug` establece sustituciones de configuración **solo para el tiempo de ejecución** (en memoria, no en disco). Está deshabilitado de forma predeterminada; habilítelo con `commands.debug: true`.

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` borra todas las sustituciones y vuelve a la configuración almacenada en disco.

## Salida de rastreo de sesión

`/trace` muestra las líneas de rastreo/depuración pertenecientes al plugin para una sesión sin habilitar el modo detallado completo. Úselo para diagnósticos de plugins, como los resúmenes de depuración de Active Memory; use `/verbose` para la salida normal de estado/herramientas.

```text
/trace
/trace on
/trace off
```

## Rastreo del ciclo de vida de los plugins

Establezca `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` para obtener un desglose fase por fase de los metadatos, el descubrimiento, el registro, el reflejo del tiempo de ejecución, la modificación de la configuración y las tareas de actualización de los plugins. Se escribe en stderr, por lo que la salida JSON de los comandos sigue siendo analizable.

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="lectura de configuración" ms=6.83 status=ok command="instalación"
[plugins:lifecycle] phase="selección de ranura" ms=94.31 status=ok command="instalación" pluginId="tokenjuice"
[plugins:lifecycle] phase="actualización del registro" ms=51.56 status=ok command="instalación" reason="fuente-modificada"
```

Use esto antes de recurrir a un perfilador de CPU. Desde un checkout del código fuente, mida el tiempo de ejecución compilado con `node dist/entry.js ...` después de `pnpm build`; `pnpm openclaw ...` también mide la sobrecarga del ejecutor del código fuente.

## Creación de perfiles de inicio y comandos de la CLI

Pruebas comparativas de inicio incluidas en el repositorio:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Para crear un perfil puntual mediante el ejecutor normal del código fuente, establezca `OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

El ejecutor del código fuente añade indicadores de perfil de CPU de Node y escribe un archivo `.cpuprofile` para el comando. Use esto antes de añadir instrumentación temporal al código del comando.

Para bloqueos de inicio que parezcan deberse a operaciones síncronas del sistema de archivos o del cargador de módulos, añada el indicador de rastreo de E/S síncrona de Node mediante el ejecutor del código fuente:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` deja este indicador deshabilitado de forma predeterminada para el proceso secundario del Gateway supervisado; establezca `OPENCLAW_TRACE_SYNC_IO=1` cuando también quiera obtener la salida de rastreo de E/S síncrona en el modo de supervisión.

## Modo de supervisión del Gateway

```bash
pnpm gateway:watch
```

De forma predeterminada, esto inicia o reinicia una sesión de tmux denominada `openclaw-gateway-watch-<profile>` (por ejemplo, `openclaw-gateway-watch-main`), con un sufijo de puerto como `openclaw-gateway-watch-dev-19001` añadido solo cuando `OPENCLAW_GATEWAY_PORT` difiere del puerto predeterminado `18789`. Se conecta automáticamente desde terminales interactivos; los shells no interactivos, la CI y las llamadas de ejecución de agentes permanecen desconectados y muestran en su lugar instrucciones para conectarse:

```bash
tmux attach -t openclaw-gateway-watch-main
```

El panel de tmux ejecuta el supervisor sin procesar:

```bash
node scripts/watch-node.mjs gateway --force
```

Detenga un servicio de Gateway instalado antes de supervisar el mismo puerto:

```bash
pnpm openclaw gateway stop
```

El indicador `--force` del supervisor libera el listener actual, pero no deshabilita un servicio supervisado. De lo contrario, un servicio de launchd, systemd o Scheduled Task puede reiniciarse y sustituir al Gateway supervisado.

Modo en primer plano sin tmux:

```bash
pnpm gateway:watch:raw
# o
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Mantenga la gestión de tmux, pero deshabilite la conexión automática:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Cree un perfil del tiempo de CPU del Gateway supervisado al depurar puntos críticos del inicio o del tiempo de ejecución:

```bash
pnpm gateway:watch --benchmark
```

El contenedor de supervisión consume `--benchmark` antes de invocar el Gateway y escribe un archivo `.cpuprofile` de V8 por cada salida de un proceso secundario del Gateway en `.artifacts/gateway-watch-profiles/`. Detenga o reinicie el Gateway supervisado para volcar el perfil actual y, a continuación, ábralo con Chrome DevTools o Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: escribe los perfiles en otra ubicación.
- `--benchmark-no-force`: omite la liberación predeterminada del puerto con `--force` y falla de inmediato si el puerto del Gateway ya está en uso.

El modo de pruebas comparativas suprime de forma predeterminada el exceso de mensajes de rastreo de E/S síncrona. Establezca `OPENCLAW_TRACE_SYNC_IO=1` con `--benchmark` para obtener tanto perfiles de CPU como rastreos de pila de E/S síncrona; en el modo de pruebas comparativas, esos bloques de rastreo se envían a `gateway-watch-output.log` dentro del directorio de pruebas comparativas (filtrados del panel del terminal), mientras que los registros normales del Gateway permanecen visibles.

El contenedor de tmux transfiere al panel los selectores habituales de tiempo de ejecución que no contienen secretos, incluidos `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` y `OPENCLAW_SKIP_CHANNELS`. Guarde las credenciales del proveedor en su perfil/configuración habitual o use el modo sin procesar en primer plano para secretos efímeros puntuales.

Si el Gateway supervisado finaliza durante el inicio, el supervisor ejecuta `openclaw doctor --fix --non-interactive` una vez y reinicia el proceso secundario del Gateway. Establezca `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` para ver el fallo de inicio original sin la fase de reparación exclusiva para desarrollo.

El panel administrado de tmux usa de forma predeterminada registros del Gateway con colores; establezca `FORCE_COLOR=0` al iniciar `pnpm gateway:watch` para deshabilitar la salida ANSI.

El supervisor se reinicia cuando cambian archivos relevantes para la compilación en `src/`, archivos fuente de extensiones, los metadatos `package.json` y `openclaw.plugin.json` de extensiones, `tsconfig.json`, `package.json` y `tsdown.config.ts`. Los cambios en los metadatos de extensiones reinician el Gateway sin forzar una recompilación; los cambios en el código fuente y la configuración siguen recompilando primero `dist`.

Añada indicadores de la CLI del Gateway después de `gateway:watch` y se transferirán en cada reinicio. Volver a ejecutar el mismo comando de supervisión recrea el panel de tmux con nombre; el supervisor sin procesar mantiene un bloqueo de supervisor único para que los procesos padre duplicados se sustituyan en lugar de acumularse.

## Perfil de desarrollo + Gateway de desarrollo (--dev)

Dos indicadores `--dev` **independientes**:

- **`--dev` global (perfil):** aísla el estado en `~/.openclaw-dev` y establece de forma predeterminada el puerto del Gateway en `19001` (los puertos derivados cambian con él).
- **`gateway --dev`:** indica al Gateway que cree automáticamente una configuración y un espacio de trabajo predeterminados cuando falten (y omita el bootstrap).

Flujo recomendado (perfil de desarrollo + bootstrap de desarrollo):

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
   - `OPENCLAW_GATEWAY_PORT=19001` (los puertos del navegador/canvas cambian en consecuencia)

2. **Bootstrap de desarrollo** (`gateway --dev`)
   - Escribe una configuración mínima si falta (`gateway.mode=local`, vinculación a loopback).
   - Establece `agents.defaults.workspace` en el espacio de trabajo de desarrollo y `agents.defaults.skipBootstrap=true`.
   - Inicializa los archivos del espacio de trabajo si faltan: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`.
   - Identidad predeterminada: **C3-PO** (droide de protocolo).
   - `pnpm gateway:dev` también establece `OPENCLAW_SKIP_CHANNELS=1` para omitir los proveedores de canales.

Flujo de restablecimiento (inicio desde cero):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` es un indicador de perfil **global** que algunos ejecutores consumen. Si necesita especificarlo explícitamente, use la forma de variable de entorno:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` borra la configuración, las credenciales, las sesiones y el espacio de trabajo de desarrollo (se mueve a la papelera, no se elimina) y, a continuación, vuelve a crear la configuración de desarrollo predeterminada.

<Tip>
Si ya se está ejecutando un Gateway que no sea de desarrollo (launchd o systemd), deténgalo primero:

```bash
openclaw gateway stop
```

</Tip>

## Registro del stream sin procesar

OpenClaw puede registrar el **stream sin procesar del asistente** antes de cualquier filtrado o formato. Esta es la mejor forma de comprobar si el razonamiento llega como deltas de texto sin formato (o como bloques de pensamiento independientes).

Habilítelo mediante la CLI:

```bash
pnpm gateway:watch --raw-stream
```

Sustitución opcional de la ruta:

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

- Los registros del stream sin procesar pueden incluir prompts completos, la salida de herramientas y datos del usuario.
- Mantenga los registros localmente y elimínelos después de la depuración.
- Si comparte registros, elimine primero los secretos y la información de identificación personal.

## Depuración en VSCode

Se requieren mapas de código fuente porque la compilación aplica hashes a los nombres de archivo generados. El archivo `launch.json` incluido apunta al servicio del Gateway:

1. **Rebuild and Debug Gateway**: elimina `/dist` y recompila con la depuración habilitada antes de iniciar el Gateway.
2. **Debug Gateway**: depura una compilación existente sin modificar `/dist`.

### Configuración

1. Abra **Run and Debug** (en la Activity Bar o con `Ctrl`+`Shift`+`D`).
2. Seleccione **Rebuild and Debug Gateway** y pulse **Start Debugging**.

Para gestionar manualmente el ciclo de compilación/depuración:

1. Habilite los mapas de código fuente en un terminal:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Recompile: `pnpm clean:dist && pnpm build`
3. Seleccione **Debug Gateway** y pulse **Start Debugging**.

Establezca puntos de interrupción en los archivos TypeScript de `src/`; el depurador los asigna al JavaScript compilado mediante los mapas de código fuente.

### Notas

- **Rebuild and Debug Gateway** elimina `/dist` y ejecuta una compilación completa con `pnpm build` y mapas de código fuente en cada inicio.
- **Debug Gateway** puede iniciarse y detenerse sin afectar a `/dist`, pero deberá gestionar el ciclo de compilación en un terminal independiente.
- Edite los `args` de `launch.json` para depurar otros subcomandos de la CLI.
- Para usar la CLI compilada en otras tareas (por ejemplo, `dashboard --no-open` si la sesión de depuración genera un nuevo token de autenticación), ejecútela desde otro terminal: `node ./openclaw.mjs` o mediante un alias como `alias openclaw-build="node $(pwd)/openclaw.mjs"`.

## Contenido relacionado

- [Solución de problemas](/es/help/troubleshooting)
- [Preguntas frecuentes](/es/help/faq)
