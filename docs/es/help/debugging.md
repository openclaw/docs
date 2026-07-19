---
read_when:
    - Necesita inspeccionar la salida sin procesar del modelo para detectar filtraciones del razonamiento.
    - Quieres ejecutar el Gateway en modo de supervisión mientras haces cambios iterativos
    - Necesita un flujo de trabajo de depuración repetible
summary: 'Herramientas de depuración: modo de observación, flujos sin procesar del modelo y rastreo de filtraciones del razonamiento'
title: Depuración
x-i18n:
    generated_at: "2026-07-19T02:00:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dc06b15958dc4a7607a9bce98794e61d82bba42fd943419cd00ca8bceef0b7c4
    source_path: help/debugging.md
    workflow: 16
---

Herramientas auxiliares de depuración para la salida en streaming, la iteración del Gateway y la generación de perfiles de inicio.

## Sustituciones de depuración en tiempo de ejecución

`/debug` establece sustituciones de configuración **solo en tiempo de ejecución** (en memoria, no en disco). Están deshabilitadas de forma predeterminada; se habilitan con `commands.debug: true`.

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` borra todas las sustituciones y vuelve a la configuración almacenada en disco.

## Salida de seguimiento de sesión

`/trace` muestra las líneas de seguimiento y depuración gestionadas por el plugin para una sesión sin habilitar el modo detallado completo. Se utiliza para diagnósticos de plugins, como los resúmenes de depuración de Active Memory; se utiliza `/verbose` para la salida normal de estado y herramientas.

```text
/trace
/trace on
/trace off
```

## Seguimiento del ciclo de vida de los plugins

Establezca `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` para obtener un desglose fase por fase de los metadatos, la detección, el registro, el reflejo en tiempo de ejecución, la modificación de la configuración y las tareas de actualización de los plugins. Escribe en stderr, por lo que la salida JSON de los comandos sigue siendo analizable.
Los errores de carga de plugins incluyen su seguimiento de pila mientras este seguimiento está habilitado.

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Utilice esto antes de recurrir a un generador de perfiles de CPU. Desde un checkout del código fuente, mida el entorno de ejecución compilado con `node dist/entry.js ...` después de `pnpm build`; `pnpm openclaw ...` también mide la sobrecarga del ejecutor del código fuente.

Para medir los tiempos de carga síncrona de módulos, utilice la superficie de diagnóstico compartida en lugar de una variable de entorno independiente y exclusiva para plugins:

```bash
OPENCLAW_DIAGNOSTICS=plugin.load-profile openclaw plugins list
```

## Inicio de la CLI y generación de perfiles de comandos

Pruebas de rendimiento de inicio incluidas en el repositorio:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Para generar un perfil puntual mediante el ejecutor habitual del código fuente, establezca `OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

El ejecutor del código fuente añade indicadores de perfil de CPU de Node y escribe un `.cpuprofile` para el comando. Utilice esto antes de añadir instrumentación temporal al código del comando.

Para bloqueos de inicio que parezcan deberse a operaciones síncronas del sistema de archivos o del cargador de módulos, añada el indicador de seguimiento de E/S síncrona de Node mediante el ejecutor del código fuente:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` deja este indicador deshabilitado de forma predeterminada para el proceso secundario del Gateway supervisado; establezca `OPENCLAW_TRACE_SYNC_IO=1` si también desea obtener la salida del seguimiento de E/S síncrona en el modo de supervisión.

## Modo de supervisión del Gateway

```bash
pnpm gateway:watch
```

De forma predeterminada, esto inicia o reinicia una sesión de tmux denominada `openclaw-gateway-watch-<profile>` (por ejemplo, `openclaw-gateway-watch-main`), con un sufijo de puerto como `openclaw-gateway-watch-dev-19001` añadido solo cuando `OPENCLAW_GATEWAY_PORT` difiere del puerto predeterminado `18789`. Se conecta automáticamente desde terminales interactivos; los shells no interactivos, la CI y las llamadas de ejecución de agentes permanecen desconectados y muestran instrucciones para conectarse:

```bash
tmux attach -t openclaw-gateway-watch-main
# Leer la salida reciente sin conectarse
tmux capture-pane -ep -t openclaw-gateway-watch-main -S -200
```

El panel utiliza `remain-on-exit` de tmux, por lo que los errores de inicio permanecen disponibles para conectarse a la sesión o capturarlos, en lugar de eliminarla. Al volver a ejecutar `pnpm gateway:watch`, se vuelve a generar ese panel.

El panel de tmux ejecuta el supervisor sin procesar:

```bash
node scripts/watch-node.mjs gateway --force
```

Antes de supervisar el puerto configurado o predeterminado, el contenedor de tmux detiene el servicio Gateway instalado del perfil activo. De este modo, el puerto queda disponible para el supervisor del código fuente sin que launchd, systemd o Scheduled Task reinicien y sustituyan el proceso. El servicio permanece instalado; restáurelo después de la sesión de supervisión con:

```bash
pnpm openclaw gateway start
```

Cuando un `--port` o `OPENCLAW_GATEWAY_PORT` explícito difiere del puerto efectivo del servicio instalado, el contenedor deja el servicio en ejecución para que ambos Gateways puedan funcionar en paralelo.

Modo en primer plano sin tmux:

```bash
pnpm gateway:watch:raw
# o
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

El modo sin procesar no gestiona el servicio instalado. Ejecute primero `pnpm openclaw gateway stop` cuando utilice el mismo puerto.

Mantener la gestión de tmux, pero deshabilitar la conexión automática:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Genere un perfil del tiempo de CPU del Gateway supervisado al depurar puntos críticos de inicio o tiempo de ejecución:

```bash
pnpm gateway:watch --benchmark
```

El contenedor de supervisión consume `--benchmark` antes de invocar el Gateway y escribe un `.cpuprofile` de V8 por cada finalización del proceso secundario del Gateway en `.artifacts/gateway-watch-profiles/`. Detenga o reinicie el Gateway supervisado para volcar el perfil actual y, a continuación, ábralo con Chrome DevTools o Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: escribir los perfiles en otra ubicación.
- `--benchmark-no-force`: omitir la limpieza predeterminada del puerto `--force` y fallar de inmediato si el puerto del Gateway ya está en uso.

El modo de pruebas de rendimiento suprime de forma predeterminada la salida excesiva del seguimiento de E/S síncrona. Establezca `OPENCLAW_TRACE_SYNC_IO=1` con `--benchmark` para obtener tanto perfiles de CPU como seguimientos de pila de E/S síncrona; en el modo de pruebas de rendimiento, esos bloques de seguimiento se escriben en `gateway-watch-output.log` dentro del directorio de pruebas de rendimiento (se filtran del panel de la terminal), mientras que los registros normales del Gateway permanecen visibles.

El contenedor de tmux transfiere al panel los selectores habituales no secretos del entorno de ejecución, incluidos `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` y `OPENCLAW_SKIP_CHANNELS`. Guarde las credenciales del proveedor en el perfil o la configuración habituales, o utilice el modo en primer plano sin procesar para secretos efímeros puntuales.

Si el Gateway supervisado finaliza durante el inicio, el supervisor ejecuta `openclaw doctor --fix --non-interactive` una vez y reinicia el proceso secundario del Gateway. Establezca `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` para ver el error de inicio original sin la fase de reparación exclusiva para desarrollo.

El panel de tmux gestionado muestra de forma predeterminada los registros del Gateway en color; establezca `FORCE_COLOR=0` al iniciar `pnpm gateway:watch` para deshabilitar la salida ANSI.

El supervisor se reinicia cuando cambian los archivos relevantes para la compilación en `src/`, los archivos de código fuente de extensiones, los metadatos `package.json` y `openclaw.plugin.json` de extensiones, `tsconfig.json`, `package.json` y `tsdown.config.ts`. Los cambios en los metadatos de las extensiones reinician el Gateway sin forzar una nueva compilación; los cambios en el código fuente y la configuración siguen compilando primero `dist`.

Añada indicadores de la CLI del Gateway después de `gateway:watch` y se transferirán en cada reinicio. Al volver a ejecutar el mismo comando de supervisión, se vuelve a generar el panel de tmux con el nombre especificado; el supervisor sin procesar mantiene un bloqueo de supervisor único para sustituir los procesos supervisores principales duplicados en lugar de acumularlos.

## Perfil de desarrollo + Gateway de desarrollo (--dev)

Dos indicadores `--dev` **independientes**:

- **`--dev` global (perfil):** aísla el estado en `~/.openclaw-dev` y establece de forma predeterminada el puerto del Gateway en `19001` (los puertos derivados se desplazan con él).
- **`gateway --dev`:** indica al Gateway que cree automáticamente una configuración y un espacio de trabajo predeterminados cuando no existan (y que omita la inicialización).

Flujo recomendado (perfil de desarrollo + inicialización de desarrollo):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Sin una instalación global, ejecute la CLI mediante `pnpm openclaw ...`.

Qué hace esto:

1. **Aislamiento del perfil** (`--dev` global)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (los puertos del navegador y del lienzo se desplazan en consecuencia)

2. **Inicialización de desarrollo** (`gateway --dev`)
   - Escribe una configuración mínima si no existe (`gateway.mode=local`, enlace a la interfaz de bucle invertido).
   - Establece `agents.defaults.workspace` en el espacio de trabajo de desarrollo y `agents.defaults.skipBootstrap=true`.
   - Crea los archivos iniciales del espacio de trabajo si no existen: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`.
   - Identidad predeterminada: **C3-PO** (droide de protocolo).
   - `pnpm gateway:dev` también establece `OPENCLAW_SKIP_CHANNELS=1` para omitir los proveedores de canales.

Flujo de restablecimiento (inicio desde cero):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` es un indicador de perfil **global** y algunos ejecutores lo consumen. Si necesita especificarlo explícitamente, utilice la forma de variable de entorno:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` borra la configuración, las credenciales, las sesiones y el espacio de trabajo de desarrollo (se trasladan a la papelera, no se eliminan) y, a continuación, vuelve a crear la configuración de desarrollo predeterminada.

<Tip>
Si ya se está ejecutando un Gateway que no es de desarrollo (launchd o systemd), deténgalo primero:

```bash
openclaw gateway stop
```

</Tip>

## Registro del flujo sin procesar

OpenClaw puede registrar el **flujo sin procesar del asistente** antes de cualquier filtrado o formato. Esta es la mejor forma de comprobar si el razonamiento llega como incrementos de texto sin formato (o como bloques de pensamiento independientes).

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

- Los registros del flujo sin procesar pueden incluir prompts completos, la salida de herramientas y datos de usuarios.
- Mantenga los registros en el entorno local y elimínelos después de la depuración.
- Si comparte los registros, elimine primero los secretos y la información de identificación personal.

## Depuración en VSCode

Los mapas de código fuente son necesarios porque la compilación aplica hashes a los nombres de los archivos generados. El archivo `launch.json` incluido está orientado al servicio Gateway:

1. **Recompilar y depurar el Gateway** - elimina `/dist`, vuelve a compilar con la depuración habilitada y, a continuación, inicia el Gateway.
2. **Depurar el Gateway** - depura una compilación existente sin modificar `/dist`.

### Configuración

1. Abra **Run and Debug** (en la barra de actividades o con `Ctrl`+`Shift`+`D`).
2. Seleccione **Rebuild and Debug Gateway** y pulse **Start Debugging**.

Para gestionar manualmente el ciclo de compilación y depuración:

1. Habilite los mapas de código fuente en una terminal:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Vuelva a compilar: `pnpm clean:dist && pnpm build`
3. Seleccione **Debug Gateway** y pulse **Start Debugging**.

Establezca puntos de interrupción en los archivos TypeScript de `src/`; el depurador los asignará al JavaScript compilado mediante los mapas de código fuente.

### Notas

- **Rebuild and Debug Gateway** elimina `/dist` y ejecuta una compilación completa mediante `pnpm build` con mapas de código fuente en cada inicio.
- **Debug Gateway** puede iniciarse y detenerse sin afectar a `/dist`, pero el ciclo de compilación debe gestionarse en una terminal independiente.
- Edite `args` en `launch.json` para depurar otros subcomandos de la CLI.
- Para utilizar la CLI compilada en otras tareas (por ejemplo, `dashboard --no-open` si la sesión de depuración genera un nuevo token de autenticación), ejecútela desde otra terminal: `node ./openclaw.mjs` o un alias como `alias openclaw-build="node $(pwd)/openclaw.mjs"`.

## Contenido relacionado

- [Solución de problemas](/es/help/troubleshooting)
- [Preguntas frecuentes](/es/help/faq)
