---
read_when:
    - Necesita inspeccionar la salida sin procesar del modelo para detectar filtraciones del razonamiento
    - Quieres ejecutar el Gateway en modo de supervisión mientras realizas iteraciones
    - Necesita un flujo de trabajo de depuración repetible
summary: 'Herramientas de depuración: modo de observación, flujos sin procesar del modelo y rastreo de filtraciones del razonamiento'
title: Depuración
x-i18n:
    generated_at: "2026-07-21T08:59:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 651976deb52841711f6c29be0a36359d5d05ef0b0bd21bba6f89620b5b024487
    source_path: help/debugging.md
    workflow: 16
---

Ayudantes de depuración para la salida en streaming, la iteración del Gateway y la elaboración de perfiles de inicio.

## Sobrescrituras de depuración en tiempo de ejecución

`/debug` establece sobrescrituras de configuración **solo para el tiempo de ejecución** (en memoria, no en disco). Está deshabilitado de forma predeterminada; se habilita con `commands.debug: true`.

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` borra todas las sobrescrituras y vuelve a la configuración almacenada en disco.

## Salida de seguimiento de sesión

`/trace` muestra las líneas de seguimiento/depuración gestionadas por plugins para una sesión sin habilitar el modo detallado completo. Se utiliza para diagnósticos de plugins, como los resúmenes de depuración de Active Memory; se usa `/verbose` para la salida normal de estado/herramientas.

```text
/trace
/trace on
/trace off
```

## Seguimiento del ciclo de vida de los plugins

Establezca `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` para obtener un desglose fase por fase de los metadatos, la detección, el registro, el reflejo del entorno de ejecución, la modificación de la configuración y las operaciones de actualización de los plugins. Escribe en stderr, de modo que la salida JSON de los comandos siga siendo analizable.
Los errores de carga de plugins incluyen su seguimiento de pila mientras este seguimiento está habilitado.

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Utilice esto antes de recurrir a un perfilador de CPU. Desde un checkout del código fuente, mida el entorno de ejecución compilado con `node dist/entry.js ...` después de `pnpm build`; `pnpm openclaw ...` también mide la sobrecarga del ejecutor de código fuente.

Para medir los tiempos de carga síncrona de módulos, utilice la superficie de diagnóstico compartida en lugar de un conmutador de entorno independiente exclusivo para plugins:

```bash
OPENCLAW_DIAGNOSTICS=plugin.load-profile openclaw plugins list
```

## Elaboración de perfiles del inicio y los comandos de la CLI

Pruebas de rendimiento de inicio incluidas en el repositorio:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Para elaborar un perfil puntual mediante el ejecutor de código fuente normal, establezca `OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

El ejecutor de código fuente añade indicadores de perfil de CPU de Node y escribe un `.cpuprofile` para el comando. Utilice esto antes de añadir instrumentación temporal al código del comando.

Para bloqueos durante el inicio que parezcan deberse a operaciones síncronas del sistema de archivos o del cargador de módulos, añada el indicador de seguimiento de E/S síncrona de Node mediante el ejecutor de código fuente:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` mantiene este indicador deshabilitado de forma predeterminada para el proceso secundario observado del Gateway; establezca `OPENCLAW_TRACE_SYNC_IO=1` cuando también se requiera la salida de seguimiento de E/S síncrona en modo de observación.

## Modo de observación del Gateway

```bash
pnpm gateway:watch
```

De forma predeterminada, esto inicia o reinicia una sesión de tmux denominada `openclaw-gateway-watch-<profile>` (por ejemplo, `openclaw-gateway-watch-main`), con un sufijo de puerto como `openclaw-gateway-watch-dev-19001` añadido solo cuando `OPENCLAW_GATEWAY_PORT` difiere del puerto predeterminado `18789`. Se conecta automáticamente desde terminales interactivos; los shells no interactivos, la Pipeline de CI y las llamadas de ejecución de agentes permanecen desconectados y muestran instrucciones para conectarse:

```bash
tmux attach -t openclaw-gateway-watch-main
# Leer la salida reciente sin conectarse
tmux capture-pane -ep -t openclaw-gateway-watch-main -S -200
```

El panel utiliza `remain-on-exit` de tmux, por lo que los errores de inicio siguen disponibles para conectarse o capturarlos, en lugar de eliminar la sesión. Volver a ejecutar `pnpm gateway:watch` reinicia ese panel.

El panel de tmux ejecuta el observador sin procesar:

```bash
node scripts/watch-node.mjs gateway --force
```

Antes de observar el puerto configurado/predeterminado, el contenedor de tmux detiene el servicio Gateway instalado del perfil activo. Esto cede el puerto al observador de código fuente sin que launchd, systemd o una tarea programada lo reinicien y lo sustituyan. El servicio permanece instalado; restáurelo después de la sesión de observación con:

```bash
pnpm openclaw gateway start
```

Cuando un `--port` o `OPENCLAW_GATEWAY_PORT` explícito difiere del puerto efectivo del servicio instalado, el contenedor mantiene el servicio en ejecución para que ambos Gateways puedan ejecutarse en paralelo.

Modo en primer plano sin tmux:

```bash
pnpm gateway:watch:raw
# o
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

El modo sin procesar no gestiona el servicio instalado. Ejecute primero `pnpm openclaw gateway stop` cuando utilice el mismo puerto.

Para mantener la gestión mediante tmux, pero deshabilitar la conexión automática:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Elabore un perfil del tiempo de CPU del Gateway observado al depurar puntos críticos de inicio/ejecución:

```bash
pnpm gateway:watch --benchmark
```

El contenedor de observación consume `--benchmark` antes de invocar el Gateway y escribe un `.cpuprofile` de V8 por cada salida del proceso secundario del Gateway en `.artifacts/gateway-watch-profiles/`. Detenga o reinicie el Gateway observado para volcar el perfil actual y ábralo después con Chrome DevTools o Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: escriba los perfiles en otra ubicación.
- `--benchmark-no-force`: omita la limpieza predeterminada del puerto `--force` y falle inmediatamente si el puerto del Gateway ya está en uso.

El modo de prueba de rendimiento suprime de forma predeterminada el exceso de mensajes del seguimiento de E/S síncrona. Establezca `OPENCLAW_TRACE_SYNC_IO=1` con `--benchmark` para obtener tanto perfiles de CPU como seguimientos de pila de E/S síncrona; en el modo de prueba de rendimiento, esos bloques de seguimiento se escriben en `gateway-watch-output.log` dentro del directorio de la prueba de rendimiento (filtrados del panel del terminal), mientras que los registros normales del Gateway siguen visibles.

El contenedor de tmux transfiere al panel selectores comunes y no secretos del entorno de ejecución, incluidos `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` y `OPENCLAW_SKIP_CHANNELS`. Guarde las credenciales del proveedor en el perfil o la configuración normales, o utilice el modo sin procesar en primer plano para secretos efímeros puntuales.

Si el Gateway observado termina durante el inicio, el observador ejecuta `openclaw doctor --fix --non-interactive` una vez y reinicia el proceso secundario del Gateway. Establezca `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` para ver el error de inicio original sin el proceso de reparación exclusivo para desarrollo.

El panel de tmux gestionado utiliza de forma predeterminada registros del Gateway con colores; establezca `FORCE_COLOR=0` al iniciar `pnpm gateway:watch` para deshabilitar la salida ANSI.

El observador se reinicia cuando cambian archivos relevantes para la compilación en `src/`, archivos de código fuente de extensiones, metadatos `package.json` y `openclaw.plugin.json` de extensiones, `tsconfig.json`, `package.json` y `tsdown.config.ts`. Los cambios en los metadatos de extensiones reinician el Gateway sin forzar una recompilación; los cambios en el código fuente y la configuración siguen recompilando primero `dist`.

Añada indicadores de la CLI del Gateway después de `gateway:watch` para transferirlos en cada reinicio. Volver a ejecutar el mismo comando de observación reinicia el panel de tmux con ese nombre; el observador sin procesar mantiene un bloqueo de observador único para sustituir los procesos principales de observadores duplicados en lugar de acumularlos.

## Perfil de desarrollo + Gateway de desarrollo (--dev)

Hay dos indicadores `--dev` **independientes**:

- **`--dev` global (perfil):** aísla el estado en `~/.openclaw-dev` y establece de forma predeterminada el puerto del Gateway en `19001` (los puertos derivados se desplazan con él).
- **`gateway --dev`:** indica al Gateway que cree automáticamente una configuración y un espacio de trabajo predeterminados cuando no existan (y que omita el arranque inicial).

Flujo recomendado (perfil de desarrollo + arranque inicial de desarrollo):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Sin una instalación global, ejecute la CLI mediante `pnpm openclaw ...`.

Lo que hace:

1. **Aislamiento del perfil** (`--dev` global)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (los puertos del navegador/lienzo se desplazan en consecuencia)

2. **Arranque inicial de desarrollo** (`gateway --dev`)
   - Escribe una configuración mínima si no existe (`gateway.mode=local`, vinculada a la interfaz de bucle invertido).
   - Establece `agents.defaults.workspace` en el espacio de trabajo de desarrollo y `agents.defaults.skipBootstrap=true`.
   - Inicializa los archivos del espacio de trabajo si no existen: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`.
   - Identidad predeterminada: **C3-PO** (droide de protocolo).
   - `pnpm gateway:dev` también establece `OPENCLAW_SKIP_CHANNELS=1` para omitir los proveedores de canales.

Los Gateways de desarrollo ignoran de forma predeterminada los activadores de entorno de canales, de modo que las credenciales heredadas del shell no conectan la instancia de desarrollo con servicios de canales reales. La configuración explícita de `channels.<id>` sigue funcionando. Pase `--dev-ambient-channels` con `--dev` para restaurar la configuración automática de canales basada en el entorno para esa ejecución.

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

`--reset` borra la configuración, las credenciales, las sesiones y el espacio de trabajo de desarrollo (los mueve a la papelera, no los elimina) y, a continuación, vuelve a crear la configuración de desarrollo predeterminada.

<Tip>
Si ya se está ejecutando un Gateway que no es de desarrollo (launchd o systemd), deténgalo primero:

```bash
openclaw gateway stop
```

</Tip>

## Registro del flujo sin procesar

OpenClaw puede registrar el **flujo sin procesar del asistente** antes de cualquier filtrado o formato. Esta es la mejor forma de comprobar si el razonamiento llega como deltas de texto sin formato (o como bloques de pensamiento independientes).

Habilítelo mediante la CLI:

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

- Los registros del flujo sin procesar pueden incluir instrucciones completas, salida de herramientas y datos de usuarios.
- Mantenga los registros en local y elimínelos después de la depuración.
- Si comparte los registros, elimine primero los secretos y la información de identificación personal.

## Depuración en VSCode

Los mapas de código fuente son necesarios porque la compilación aplica hashes a los nombres de los archivos generados. El archivo `launch.json` incluido contiene configuraciones para el servicio Gateway:

1. **Rebuild and Debug Gateway** - elimina `/dist` y vuelve a compilar con la depuración habilitada antes de iniciar el Gateway.
2. **Debug Gateway** - depura una compilación existente sin modificar `/dist`.

### Configuración

1. Abra **Run and Debug** (en la barra de actividades o con `Ctrl`+`Shift`+`D`).
2. Seleccione **Rebuild and Debug Gateway** y pulse **Start Debugging**.

Para gestionar manualmente el ciclo de compilación/depuración:

1. Habilite los mapas de código fuente en un terminal:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Vuelva a compilar: `pnpm clean:dist && pnpm build`
3. Seleccione **Debug Gateway** y pulse **Start Debugging**.

Establezca puntos de interrupción en los archivos TypeScript `src/`; el depurador los asigna al JavaScript compilado mediante mapas de código fuente.

### Notas

- **Rebuild and Debug Gateway** elimina `/dist` y ejecuta una compilación completa de `pnpm build` con mapas de código fuente en cada inicio.
- **Debug Gateway** puede iniciarse y detenerse sin afectar a `/dist`, pero el ciclo de compilación debe gestionarse en un terminal independiente.
- Edite `launch.json` `args` para depurar otros subcomandos de la CLI.
- Para utilizar la CLI compilada en otras tareas (por ejemplo, `dashboard --no-open` si la sesión de depuración genera un nuevo token de autenticación), ejecútela desde otro terminal: `node ./openclaw.mjs` o un alias como `alias openclaw-build="node $(pwd)/openclaw.mjs"`.

## Contenido relacionado

- [Solución de problemas](/es/help/troubleshooting)
- [Preguntas frecuentes](/es/help/faq)
