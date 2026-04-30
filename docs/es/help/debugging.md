---
read_when:
    - Es necesario inspeccionar la salida sin procesar del modelo para detectar filtraciones de razonamiento
    - Desea ejecutar el Gateway en modo de observación mientras itera
    - Necesitas un flujo de trabajo de depuración repetible
summary: 'Herramientas de depuración: modo de observación, flujos sin procesar del modelo y seguimiento de fugas de razonamiento'
title: Depuración
x-i18n:
    generated_at: "2026-04-30T05:45:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3c4ba151cf1ef1dd689077cee93467b7bc77b765665231028941a345b5345ea
    source_path: help/debugging.md
    workflow: 16
---

Ayudantes de depuración para la salida de streaming, especialmente cuando un proveedor mezcla razonamiento en el texto normal.

## Sobrescrituras de depuración en tiempo de ejecución

Usa `/debug` en el chat para establecer sobrescrituras de configuración **solo en tiempo de ejecución** (memoria, no disco).
`/debug` está desactivado de forma predeterminada; actívalo con `commands.debug: true`.
Esto es útil cuando necesitas alternar ajustes poco comunes sin editar `openclaw.json`.

Ejemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` borra todas las sobrescrituras y vuelve a la configuración en disco.

## Salida de traza de sesión

Usa `/trace` cuando quieras ver líneas de traza/depuración propiedad del Plugin en una sesión
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

## Traza del ciclo de vida de Plugin

Usa `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` cuando los comandos del ciclo de vida de Plugin se sientan lentos
y necesites un desglose integrado de fases para metadatos de Plugin, descubrimiento, registro,
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

Usa esto para investigar el ciclo de vida de Plugin antes de recurrir a un perfilador de CPU.
Si el comando se ejecuta desde un checkout de código fuente, prefiere medir el runtime construido
con `node dist/entry.js ...` después de `pnpm build`; `pnpm openclaw ...`
también mide la sobrecarga del ejecutor desde código fuente.

## Temporización temporal de depuración de CLI

OpenClaw conserva `src/cli/debug-timing.ts` como un pequeño ayudante para investigación
local. Intencionalmente no está conectado de forma predeterminada al arranque de CLI, al enrutamiento de comandos
ni a ningún comando. Úsalo solo mientras depuras un comando lento, y luego
elimina la importación y los intervalos antes de aterrizar el cambio de comportamiento.

Usa esto cuando un comando es lento y necesitas un desglose rápido de fases antes de
decidir si usar un perfilador de CPU o corregir un subsistema específico.

### Agregar intervalos temporales

Agrega el ayudante cerca del código que estás investigando. Por ejemplo, al depurar
`openclaw models list`, un parche temporal en
`src/commands/models/list.list-command.ts` podría verse así:

```ts
// Temporary debugging only. Remove before landing.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

Directrices:

- Prefija los nombres de fases temporales con `debug:`.
- Agrega solo unos pocos intervalos alrededor de las secciones sospechosas de lentitud.
- Prefiere fases amplias como `registry`, `auth_store` o `rows` en lugar de nombres de ayudantes.
- Usa `time()` para trabajo síncrono y `timeAsync()` para promesas.
- Mantén stdout limpio. El ayudante escribe en stderr, por lo que la salida JSON del comando sigue siendo
  analizable.
- Elimina las importaciones e intervalos temporales antes de abrir el PR de corrección final.
- Incluye la salida de temporización o un breve resumen en el issue o PR que explique
  la optimización.

### Ejecutar con salida legible

El modo legible es el mejor para la depuración en vivo:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Salida de ejemplo de una investigación temporal de `models list`:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

Hallazgos de esta salida:

| Fase                                     |     Tiempo | Qué significa                                                                                                        |
| ---------------------------------------- | ---------: | -------------------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | La carga del almacén de perfiles de autenticación es el mayor costo y debería investigarse primero.                  |
| `debug:models:list:ensure_models_json`   |       5.0s | Sincronizar `models.json` es lo bastante costoso como para inspeccionar la caché o las condiciones de omisión.       |
| `debug:models:list:load_model_registry`  |       5.9s | La construcción del registro y el trabajo de disponibilidad del proveedor también son costos significativos.          |
| `debug:models:list:read_registry_models` |       2.4s | Leer todos los modelos del registro no es gratuito y puede importar para `--all`.                                     |
| fases de anexado de filas                | 3.2s total | Construir cinco filas mostradas todavía tarda varios segundos, así que la ruta de filtrado merece una revisión mayor. |
| `debug:models:list:print_model_table`    |        0ms | El renderizado no es el cuello de botella.                                                                           |

Esos hallazgos bastan para guiar el siguiente parche sin mantener código de temporización en
rutas de producción.

### Ejecutar con salida JSON

Usa el modo JSON cuando quieras guardar o comparar datos de temporización:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

Cada línea de stderr es un objeto JSON:

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### Limpiar antes de aterrizar

Antes de abrir el PR final:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

El comando no debería devolver sitios de llamada de instrumentación temporal, a menos que el PR
esté agregando explícitamente una superficie de diagnósticos permanente. Para correcciones normales de rendimiento,
mantén solo el cambio de comportamiento, las pruebas y una nota breve con la evidencia de temporización.

Para puntos críticos de CPU más profundos, usa perfilado de Node (`--cpu-prof`) o un
perfilador externo en lugar de agregar más envoltorios de temporización.

## Modo de observación del Gateway

Para una iteración rápida, ejecuta el Gateway bajo el observador de archivos:

```bash
pnpm gateway:watch
```

De forma predeterminada, esto inicia o reinicia una sesión tmux llamada
`openclaw-gateway-watch-main` (o una variante específica de perfil/puerto como
`openclaw-gateway-watch-dev-19001`) y se adjunta automáticamente desde terminales interactivas.
Los shells no interactivos, CI y las llamadas exec de agentes permanecen separados e imprimen
instrucciones de adjunto en su lugar. Adjunta manualmente cuando sea necesario:

```bash
tmux attach -t openclaw-gateway-watch-main
```

El panel tmux ejecuta el observador sin procesar:

```bash
node scripts/watch-node.mjs gateway --force
```

Usa el modo en primer plano cuando no quieras tmux:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Desactiva el adjunto automático mientras mantienes la gestión de tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

El envoltorio tmux transporta selectores comunes de runtime no secretos, como
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` y `OPENCLAW_SKIP_CHANNELS`, al panel. Pon
las credenciales de proveedor en tu perfil/configuración normal, o usa el modo sin procesar en primer plano
para secretos efímeros puntuales.

El observador se reinicia ante archivos relevantes para la compilación bajo `src/`, archivos fuente de extensiones,
metadatos `package.json` y `openclaw.plugin.json` de extensiones, `tsconfig.json`,
`package.json` y `tsdown.config.ts`. Los cambios de metadatos de extensiones reinician el
Gateway sin forzar una recompilación de `tsdown`; los cambios de fuente y configuración siguen
reconstruyendo `dist` primero.

Agrega cualquier bandera de CLI de Gateway después de `gateway:watch` y se pasarán en
cada reinicio. Volver a ejecutar el mismo comando de observación recrea el panel tmux nombrado, y
el observador sin procesar aún mantiene su bloqueo de observador único para que los padres observadores duplicados
se reemplacen en lugar de acumularse.

## Perfil de desarrollo + Gateway de desarrollo (--dev)

Usa el perfil de desarrollo para aislar el estado y levantar una configuración segura y desechable para
depurar. Hay **dos** banderas `--dev`:

- **`--dev` global (perfil):** aísla el estado bajo `~/.openclaw-dev` y
  establece de forma predeterminada el puerto del Gateway en `19001` (los puertos derivados se desplazan con él).
- **`gateway --dev`: indica al Gateway que cree automáticamente una configuración + espacio de trabajo predeterminados** cuando falten (y omite BOOTSTRAP.md).

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
   - `OPENCLAW_GATEWAY_PORT=19001` (el navegador/canvas se desplazan en consecuencia)

2. **Arranque de desarrollo** (`gateway --dev`)
   - Escribe una configuración mínima si falta (`gateway.mode=local`, vincula local loopback).
   - Establece `agent.workspace` en el espacio de trabajo de desarrollo.
   - Establece `agent.skipBootstrap=true` (sin BOOTSTRAP.md).
   - Si faltan, inicializa los archivos del espacio de trabajo:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identidad predeterminada: **C3‑PO** (droide de protocolo).
   - Omite los proveedores de canal en modo de desarrollo (`OPENCLAW_SKIP_CHANNELS=1`).

Flujo de restablecimiento (inicio limpio):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` es una bandera de perfil **global** y algunos ejecutores la consumen. Si necesitas explicitarlo, usa la forma con variable de entorno:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` borra configuración, credenciales, sesiones y el espacio de trabajo de desarrollo (usando
`trash`, no `rm`), y luego recrea la configuración de desarrollo predeterminada.

<Tip>
Si ya hay un Gateway que no es de desarrollo en ejecución (launchd o systemd), detenlo primero:

```bash
openclaw gateway stop
```

</Tip>

## Registro de stream sin procesar (OpenClaw)

OpenClaw puede registrar el **stream del asistente sin procesar** antes de cualquier filtrado/formato.
Esta es la mejor manera de ver si el razonamiento está llegando como deltas de texto sin formato
(o como bloques de pensamiento separados).

Habilítalo mediante la CLI:

```bash
pnpm gateway:watch --raw-stream
```

Anulación opcional de ruta:

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

Para capturar **fragmentos sin procesar compatibles con OpenAI** antes de que se analicen en bloques,
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

- Los registros de transmisión sin procesar pueden incluir prompts completos, salida de herramientas y datos de usuario.
- Mantén los registros en local y elimínalos después de la depuración.
- Si compartes registros, elimina primero los secretos y los datos personales.

## Relacionado

- [Solución de problemas](/es/help/troubleshooting)
- [Preguntas frecuentes](/es/help/faq)
