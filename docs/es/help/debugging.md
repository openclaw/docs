---
read_when:
    - Necesitas inspeccionar la salida sin procesar del modelo para detectar filtraciones de razonamiento
    - Quieres ejecutar el Gateway en modo de observación mientras iteras
    - Necesitas un flujo de trabajo de depuración repetible
summary: 'Herramientas de depuración: modo de observación, flujos sin procesar del modelo y rastreo de filtración de razonamiento'
title: Depuración
x-i18n:
    generated_at: "2026-07-05T11:21:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b3ab71fdd5781b5ad0e5b75aa33bd93fa9cf6c668c7a26bc7217cd6a5f299cd
    source_path: help/debugging.md
    workflow: 16
---

Ayudantes de depuración para salida en streaming, iteración del Gateway y perfilado de arranque.

## Overrides de depuración en tiempo de ejecución

`/debug` establece overrides de configuración **solo en tiempo de ejecución** (memoria, no disco). Deshabilitado de forma predeterminada; habilítalo con `commands.debug: true`.

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` borra todos los overrides y vuelve a la configuración en disco.

## Salida de traza de sesión

`/trace` muestra líneas de traza/depuración propiedad del Plugin para una sesión sin habilitar el modo detallado completo. Úsalo para diagnósticos de Plugin, como resúmenes de depuración de Active Memory; usa `/verbose` para la salida normal de estado/herramientas.

```text
/trace
/trace on
/trace off
```

## Traza del ciclo de vida del Plugin

Establece `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` para obtener un desglose fase por fase de metadatos del Plugin, descubrimiento, registro, espejo de tiempo de ejecución, mutación de configuración y trabajo de actualización. Escribe en stderr, por lo que la salida JSON de comandos sigue siendo analizable.

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Usa esto antes de recurrir a un perfilador de CPU. Desde un checkout de código fuente, mide el runtime compilado con `node dist/entry.js ...` después de `pnpm build`; `pnpm openclaw ...` también mide la sobrecarga del ejecutor desde código fuente.

## Arranque de CLI y perfilado de comandos

Benchmarks de arranque incluidos en el repositorio:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Para perfilado puntual mediante el ejecutor normal desde código fuente, establece `OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

El ejecutor desde código fuente agrega flags de perfil de CPU de Node y escribe un `.cpuprofile` para el comando. Usa esto antes de agregar instrumentación temporal al código de comandos.

Para bloqueos de arranque que parecen trabajo síncrono del sistema de archivos o del cargador de módulos, agrega el flag de traza de E/S síncrona de Node mediante el ejecutor desde código fuente:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` deja este flag deshabilitado de forma predeterminada para el proceso hijo observado del Gateway; establece `OPENCLAW_TRACE_SYNC_IO=1` cuando también quieras salida de traza de E/S síncrona en modo de observación.

## Modo de observación del Gateway

```bash
pnpm gateway:watch
```

De forma predeterminada, esto inicia o reinicia una sesión tmux llamada `openclaw-gateway-watch-<profile>` (por ejemplo, `openclaw-gateway-watch-main`), con un sufijo de puerto como `openclaw-gateway-watch-dev-19001` agregado solo cuando `OPENCLAW_GATEWAY_PORT` difiere del puerto predeterminado `18789`. Se adjunta automáticamente desde terminales interactivas; shells no interactivas, CI y llamadas de ejecución de agentes permanecen separadas e imprimen instrucciones de adjunción en su lugar:

```bash
tmux attach -t openclaw-gateway-watch-main
```

El panel de tmux ejecuta el observador bruto:

```bash
node scripts/watch-node.mjs gateway --force
```

Modo en primer plano sin tmux:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Conserva la gestión de tmux pero deshabilita la adjunción automática:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Perfila el tiempo de CPU del Gateway observado al depurar puntos calientes de arranque/runtime:

```bash
pnpm gateway:watch --benchmark
```

El wrapper de observación consume `--benchmark` antes de invocar el Gateway y escribe un `.cpuprofile` de V8 por cada salida del proceso hijo del Gateway bajo `.artifacts/gateway-watch-profiles/`. Detén o reinicia el gateway observado para vaciar el perfil actual y luego ábrelo con Chrome DevTools o Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: escribe perfiles en otro lugar.
- `--benchmark-no-force`: omite la limpieza de puerto predeterminada de `--force` y falla rápido si el puerto del Gateway ya está en uso.

El modo benchmark suprime de forma predeterminada el ruido de trazas de E/S síncrona. Establece `OPENCLAW_TRACE_SYNC_IO=1` con `--benchmark` para obtener tanto perfiles de CPU como trazas de pila de E/S síncrona; en modo benchmark, esos bloques de traza van a `gateway-watch-output.log` bajo el directorio de benchmark (filtrados del panel de terminal), mientras que los logs normales del Gateway permanecen visibles.

El wrapper de tmux transporta al panel selectores comunes de runtime que no son secretos, incluidos `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` y `OPENCLAW_SKIP_CHANNELS`. Coloca las credenciales de proveedores en tu perfil/configuración normal, o usa el modo bruto en primer plano para secretos efímeros puntuales.

Si el Gateway observado sale durante el arranque, el observador ejecuta `openclaw doctor --fix --non-interactive` una vez y reinicia el proceso hijo del Gateway. Establece `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` para ver el fallo de arranque original sin la pasada de reparación solo para desarrollo.

El panel tmux gestionado usa logs de Gateway con color de forma predeterminada; establece `FORCE_COLOR=0` al iniciar `pnpm gateway:watch` para deshabilitar la salida ANSI.

El observador reinicia ante archivos relevantes para la compilación bajo `src/`, archivos fuente de extensiones, metadatos `package.json` y `openclaw.plugin.json` de extensiones, `tsconfig.json`, `package.json` y `tsdown.config.ts`. Los cambios de metadatos de extensiones reinician el gateway sin forzar una recompilación; los cambios de código fuente y configuración siguen recompilando `dist` primero.

Agrega flags de CLI del gateway después de `gateway:watch` y se transmitirán en cada reinicio. Volver a ejecutar el mismo comando de observación recrea el panel tmux nombrado; el observador bruto mantiene un bloqueo de observador único para que los procesos padre de observadores duplicados se reemplacen en lugar de acumularse.

## Perfil de desarrollo + gateway de desarrollo (--dev)

Dos flags `--dev` **separados**:

- **`--dev` global (perfil):** aísla el estado bajo `~/.openclaw-dev` y establece de forma predeterminada el puerto del gateway en `19001` (los puertos derivados se desplazan con él).
- **`gateway --dev`:** indica al Gateway que cree automáticamente una configuración + espacio de trabajo predeterminados cuando falten (y que omita bootstrap).

Flujo recomendado (perfil de desarrollo + bootstrap de desarrollo):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Sin una instalación global, ejecuta la CLI mediante `pnpm openclaw ...`.

Lo que hace esto:

1. **Aislamiento de perfil** (`--dev` global)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (los puertos de navegador/canvas se desplazan en consecuencia)

2. **Bootstrap de desarrollo** (`gateway --dev`)
   - Escribe una configuración mínima si falta (`gateway.mode=local`, enlace loopback).
   - Establece `agents.defaults.workspace` en el espacio de trabajo de desarrollo y `agents.defaults.skipBootstrap=true`.
   - Si faltan, inicializa los archivos del espacio de trabajo: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`.
   - Identidad predeterminada: **C3-PO** (droide de protocolo).
   - `pnpm gateway:dev` también establece `OPENCLAW_SKIP_CHANNELS=1` para omitir proveedores de canales.

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

`--reset` borra configuración, credenciales, sesiones y el espacio de trabajo de desarrollo (movido a la papelera, no eliminado), y luego recrea la configuración de desarrollo predeterminada.

<Tip>
Si ya hay un gateway no de desarrollo en ejecución (launchd o systemd), detenlo primero:

```bash
openclaw gateway stop
```

</Tip>

## Registro del flujo bruto

OpenClaw puede registrar el **flujo bruto del asistente** antes de cualquier filtrado/formato. Esta es la mejor manera de ver si el razonamiento llega como deltas de texto plano (o como bloques de pensamiento separados).

Habilítalo mediante CLI:

```bash
pnpm gateway:watch --raw-stream
```

Override de ruta opcional:

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

- Los logs del flujo bruto pueden incluir prompts completos, salida de herramientas y datos de usuario.
- Mantén los logs locales y elimínalos después de depurar.
- Si compartes logs, elimina primero secretos y PII.

## Depuración en VSCode

Los mapas de código fuente son necesarios porque la compilación aplica hashes a los nombres de archivo generados. El `launch.json` incluido apunta al servicio Gateway:

1. **Recompilar y depurar Gateway** - elimina `/dist` y recompila con la depuración habilitada antes de iniciar el Gateway.
2. **Depurar Gateway** - depura una compilación existente sin tocar `/dist`.

### Configuración

1. Abre **Ejecutar y depurar** (barra de actividad, o `Ctrl`+`Shift`+`D`).
2. Selecciona **Recompilar y depurar Gateway** y presiona **Iniciar depuración**.

Para gestionar manualmente el ciclo de compilación/depuración en su lugar:

1. Habilita los mapas de código fuente en una terminal:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Recompila: `pnpm clean:dist && pnpm build`
3. Selecciona **Depurar Gateway** y presiona **Iniciar depuración**.

Establece puntos de interrupción en archivos TypeScript de `src/`; el depurador los asigna al JavaScript compilado mediante mapas de código fuente.

### Notas

- **Recompilar y depurar Gateway** elimina `/dist` y ejecuta un `pnpm build` completo con mapas de código fuente en cada inicio.
- **Depurar Gateway** puede iniciar/detener sin afectar `/dist`, pero tú gestionas el ciclo de compilación en una terminal separada.
- Edita `args` de `launch.json` para depurar otros subcomandos de CLI.
- Para usar la CLI compilada en otras tareas (por ejemplo, `dashboard --no-open` si tu sesión de depuración genera un nuevo token de autenticación), ejecútala desde otra terminal: `node ./openclaw.mjs` o un alias como `alias openclaw-build="node $(pwd)/openclaw.mjs"`.

## Relacionado

- [Solución de problemas](/es/help/troubleshooting)
- [Preguntas frecuentes](/es/help/faq)
