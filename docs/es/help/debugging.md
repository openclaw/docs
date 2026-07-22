---
read_when:
    - Es necesario inspeccionar la salida sin procesar del modelo para detectar filtraciones del razonamiento.
    - Se desea ejecutar el Gateway en modo de supervisión mientras se realizan iteraciones
    - Se necesita un flujo de trabajo de depuración repetible
summary: 'Herramientas de depuración: modo de observación, flujos sin procesar del modelo y rastreo de filtraciones del razonamiento'
title: Depuración
x-i18n:
    generated_at: "2026-07-22T10:37:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 45a1196c03e4deede3ce47553e1b2b3e1903ee04fe6855d929e0c32bf4e5e686
    source_path: help/debugging.md
    workflow: 16
---

Ayudantes de depuración para la salida de streaming, la iteración del Gateway y la creación de perfiles de inicio.

## Invalidaciones de depuración en tiempo de ejecución

`/debug` establece invalidaciones de configuración **solo para el tiempo de ejecución** (en memoria, no en disco). Están deshabilitadas de forma predeterminada; habilítelas con `commands.debug: true`.

```text
/debug show
/debug set channels.whatsapp.responsePrefix="[openclaw]"
/debug unset channels.whatsapp.responsePrefix
/debug reset
```

`/debug reset` borra todas las invalidaciones y vuelve a la configuración almacenada en disco.

## Salida de seguimiento de sesión

`/trace` muestra las líneas de seguimiento/depuración pertenecientes al plugin para una sesión sin habilitar el modo detallado completo. Úselo para diagnósticos de plugins, como los resúmenes de depuración de Active Memory; use `/verbose` para la salida normal de estado/herramientas.

```text
/trace
/trace on
/trace off
```

## Seguimiento del ciclo de vida del plugin

Establezca `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` para obtener un desglose fase por fase de los metadatos del plugin, el descubrimiento, el registro, el reflejo del tiempo de ejecución, la modificación de la configuración y las tareas de actualización. Escribe en stderr, por lo que la salida JSON de los comandos continúa siendo analizable.
Los errores de carga de plugins incluyen su seguimiento de pila mientras este seguimiento está habilitado.

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Use esto antes de recurrir a un perfilador de CPU. Desde un checkout del código fuente, mida el tiempo de ejecución compilado con `node dist/entry.js ...` después de `pnpm build`; `pnpm openclaw ...` también mide la sobrecarga del ejecutor desde el código fuente.

Para medir los tiempos de carga síncrona de módulos, use la superficie de diagnóstico compartida en lugar de una variable de entorno independiente exclusiva para plugins:

```bash
OPENCLAW_DIAGNOSTICS=plugin.load-profile openclaw plugins list
```

## Inicio de la CLI y creación de perfiles de comandos

Pruebas de rendimiento de inicio incluidas en el repositorio:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Para crear un perfil puntual mediante el ejecutor normal desde el código fuente, establezca `OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

El ejecutor desde el código fuente añade indicadores de perfil de CPU de Node y escribe un `.cpuprofile` para el comando. Use esto antes de añadir instrumentación temporal al código del comando.

Para bloqueos durante el inicio que parezcan deberse a operaciones síncronas del sistema de archivos o del cargador de módulos, añada el indicador de seguimiento de E/S síncrona de Node mediante el ejecutor desde el código fuente:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` deja este indicador deshabilitado de forma predeterminada para el proceso hijo supervisado del Gateway; establezca `OPENCLAW_TRACE_SYNC_IO=1` cuando también quiera la salida de seguimiento de E/S síncrona en el modo de supervisión.

## Modo de supervisión del Gateway

```bash
pnpm gateway:watch
```

De forma predeterminada, esto inicia o reinicia una sesión de tmux llamada `openclaw-gateway-watch-<profile>` (por ejemplo, `openclaw-gateway-watch-main`), con un sufijo de puerto como `openclaw-gateway-watch-dev-19001` añadido únicamente cuando `OPENCLAW_GATEWAY_PORT` difiere del puerto predeterminado `18789`. Se conecta automáticamente desde terminales interactivos; los shells no interactivos, la CI y las llamadas de ejecución de agentes permanecen desconectados e imprimen instrucciones de conexión:

```bash
tmux attach -t openclaw-gateway-watch-main
# Leer la salida reciente sin conectarse
tmux capture-pane -ep -t openclaw-gateway-watch-main -S -200
```

El panel usa `remain-on-exit` de tmux, por lo que los errores de inicio siguen disponibles para conectarse o capturarlos, en lugar de eliminar la sesión. Al volver a ejecutar `pnpm gateway:watch`, se vuelve a generar ese panel.

El panel de tmux ejecuta el supervisor sin procesar:

```bash
node scripts/watch-node.mjs gateway --force
```

Antes de supervisar el puerto configurado/predeterminado, el contenedor de tmux detiene el servicio Gateway instalado del perfil activo. Esto cede el puerto al supervisor desde el código fuente sin que launchd, systemd o Scheduled Task lo reinicien y lo sustituyan. El servicio permanece instalado; restáurelo después de la sesión de supervisión con:

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

El modo sin procesar no administra el servicio instalado. Ejecute primero `pnpm openclaw gateway stop` cuando utilice el mismo puerto.

Mantenga la administración mediante tmux, pero deshabilite la conexión automática:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Cree un perfil del tiempo de CPU del Gateway supervisado al depurar puntos críticos de inicio/tiempo de ejecución:

```bash
pnpm gateway:watch --benchmark
```

El contenedor de supervisión consume `--benchmark` antes de invocar el Gateway y escribe un `.cpuprofile` de V8 por cada salida de un proceso hijo del Gateway en `.artifacts/gateway-watch-profiles/`. Detenga o reinicie el Gateway supervisado para volcar el perfil actual y, a continuación, ábralo con Chrome DevTools o Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: escriba los perfiles en otra ubicación.
- `--benchmark-no-force`: omita la limpieza predeterminada del puerto `--force` y falle de inmediato si el puerto del Gateway ya está en uso.

El modo de prueba de rendimiento suprime de forma predeterminada el exceso de mensajes de seguimiento de E/S síncrona. Establezca `OPENCLAW_TRACE_SYNC_IO=1` con `--benchmark` para obtener tanto perfiles de CPU como seguimientos de pila de E/S síncrona; en el modo de prueba de rendimiento, esos bloques de seguimiento se escriben en `gateway-watch-output.log` dentro del directorio de la prueba de rendimiento (filtrados del panel de la terminal), mientras los registros normales del Gateway permanecen visibles.

El contenedor de tmux transfiere al panel los selectores comunes no secretos del tiempo de ejecución, incluidos `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` y `OPENCLAW_SKIP_CHANNELS`. Guarde las credenciales del proveedor en el perfil o la configuración normales, o use el modo sin procesar en primer plano para secretos efímeros puntuales.

Si el Gateway supervisado se cierra durante el inicio, el supervisor ejecuta `openclaw doctor --fix --non-interactive` una vez y reinicia el proceso hijo del Gateway. Establezca `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` para ver el error de inicio original sin la fase de reparación exclusiva para desarrollo.

El panel administrado de tmux usa de forma predeterminada registros coloreados del Gateway; establezca `FORCE_COLOR=0` al iniciar `pnpm gateway:watch` para deshabilitar la salida ANSI.

El supervisor se reinicia cuando cambian los archivos relevantes para la compilación dentro de `src/`, los archivos fuente de extensiones, los metadatos `package.json` y `openclaw.plugin.json` de las extensiones, `tsconfig.json`, `package.json` y `tsdown.config.ts`. Los cambios en los metadatos de las extensiones reinician el Gateway sin forzar una recompilación; los cambios en el código fuente y la configuración siguen recompilando primero `dist`.

Añada indicadores de la CLI del Gateway después de `gateway:watch` y se transferirán en cada reinicio. Volver a ejecutar el mismo comando de supervisión regenera el panel de tmux con el nombre indicado; el supervisor sin procesar mantiene un bloqueo de supervisor único para que los procesos supervisores principales duplicados sean sustituidos en lugar de acumularse.

## Perfil de desarrollo + Gateway de desarrollo (--dev)

Dos indicadores `--dev` **independientes**:

- **`--dev` global (perfil):** aísla el estado en `~/.openclaw-dev` y establece de forma predeterminada el puerto del Gateway en `19001` (los puertos derivados cambian con él).
- **`gateway --dev`:** indica al Gateway que cree automáticamente una configuración y un espacio de trabajo predeterminados cuando falten (y que omita la inicialización).

Flujo recomendado (perfil de desarrollo + inicialización de desarrollo):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Sin una instalación global, ejecute la CLI mediante `pnpm openclaw ...`.

Funcionamiento:

1. **Aislamiento del perfil** (`--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (los puertos del navegador/lienzo cambian en consecuencia)

2. **Inicialización de desarrollo** (`gateway --dev`)
   - Escribe una configuración mínima si falta (`gateway.mode=local`, vinculada a la interfaz de bucle invertido).
   - Establece `agents.defaults.workspace` en el espacio de trabajo de desarrollo y `agents.defaults.skipBootstrap=true`.
   - Crea los archivos iniciales del espacio de trabajo si faltan: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`.
   - Identidad predeterminada: **C3-PO** (droide de protocolo).
   - `pnpm gateway:dev` también establece `OPENCLAW_SKIP_CHANNELS=1` para omitir los proveedores de canales.

De forma predeterminada, los Gateways de desarrollo ignoran los activadores de entorno de canales, por lo que las credenciales heredadas del shell no conectan la instancia de desarrollo con servicios de canales reales. La configuración explícita de `channels.<id>` sigue funcionando. Pase `--dev-ambient-channels` con `--dev` para restaurar la configuración automática de canales mediante el entorno durante esa ejecución.

Flujo de restablecimiento (inicio desde cero):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` es un indicador **global** de perfil que algunos ejecutores consumen. Si necesita especificarlo explícitamente, use la forma de variable de entorno:

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

OpenClaw puede registrar el **flujo sin procesar del asistente** antes de aplicar cualquier filtrado o formato. Esta es la mejor forma de comprobar si el razonamiento llega como deltas de texto sin formato (o como bloques de pensamiento independientes).

Habilítelo mediante la CLI:

```bash
pnpm gateway:watch --raw-stream
```

Invalidación opcional de la ruta:

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

- Los registros del flujo sin procesar pueden incluir prompts completos, la salida de herramientas y datos de usuario.
- Mantenga los registros en el equipo local y elimínelos después de la depuración.
- Si comparte los registros, elimine primero los secretos y la información de identificación personal.

## Depuración en VSCode

Los mapas de código fuente son obligatorios porque la compilación aplica hashes a los nombres de archivo generados. El `launch.json` incluido está orientado al servicio Gateway:

1. **Rebuild and Debug Gateway**: elimina `/dist`, recompila con la depuración habilitada y después inicia el Gateway.
2. **Debug Gateway**: depura una compilación existente sin modificar `/dist`.

### Configuración

1. Abra **Run and Debug** (en la barra de actividades o con `Ctrl`+`Shift`+`D`).
2. Seleccione **Rebuild and Debug Gateway** y pulse **Start Debugging**.

Como alternativa, para administrar manualmente el ciclo de compilación/depuración:

1. Habilite los mapas de código fuente en una terminal:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Recompile: `pnpm clean:dist && pnpm build`
3. Seleccione **Debug Gateway** y pulse **Start Debugging**.

Establezca puntos de interrupción en los archivos TypeScript de `src/`; el depurador los asigna al JavaScript compilado mediante mapas de código fuente.

### Notas

- **Rebuild and Debug Gateway** elimina `/dist` y ejecuta una compilación `pnpm build` completa con mapas de código fuente en cada inicio.
- **Debug Gateway** puede iniciarse y detenerse sin afectar a `/dist`, pero el ciclo de compilación se administra en una terminal independiente.
- Edite `launch.json` `args` para depurar otros subcomandos de la CLI.
- Para usar la CLI compilada en otras tareas (por ejemplo, `dashboard --no-open` si la sesión de depuración genera un nuevo token de autenticación), ejecútela desde otra terminal: `node ./openclaw.mjs` o un alias como `alias openclaw-build="node $(pwd)/openclaw.mjs"`.

## Contenido relacionado

- [Solución de problemas](/es/help/troubleshooting)
- [Preguntas frecuentes](/es/help/faq)
