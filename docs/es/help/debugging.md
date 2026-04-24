---
read_when:
    - Necesitas inspeccionar la salida sin procesar del modelo para detectar fugas de razonamiento
    - Quieres ejecutar Gateway en modo watch mientras iteras
    - Necesitas un flujo de depuración repetible
summary: 'Herramientas de depuración: modo watch, streams sin procesar del modelo y rastreo de fugas de razonamiento'
title: Depuración
x-i18n:
    generated_at: "2026-04-24T05:31:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d52070204e21cd7e5bff565fadab96fdeee0ad906c4c8601572761a096d9025
    source_path: help/debugging.md
    workflow: 15
---

Esta página cubre ayudas de depuración para la salida en streaming, especialmente cuando un
proveedor mezcla razonamiento en texto normal.

## Anulaciones de depuración en tiempo de ejecución

Usa `/debug` en el chat para establecer anulaciones de configuración **solo de tiempo de ejecución** (memoria, no disco).
`/debug` está desactivado de forma predeterminada; actívalo con `commands.debug: true`.
Esto es útil cuando necesitas alternar ajustes poco comunes sin editar `openclaw.json`.

Ejemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` borra todas las anulaciones y vuelve a la configuración en disco.

## Salida de rastreo de sesión

Usa `/trace` cuando quieras ver líneas de rastreo/depuración propiedad de Plugins en una sesión
sin activar el modo completamente verboso.

Ejemplos:

```text
/trace
/trace on
/trace off
```

Usa `/trace` para diagnósticos de Plugins como resúmenes de depuración de Active Memory.
Sigue usando `/verbose` para la salida normal detallada de estado/herramientas y sigue usando
`/debug` para anulaciones de configuración solo en tiempo de ejecución.

## Temporización temporal de depuración en la CLI

OpenClaw conserva `src/cli/debug-timing.ts` como una pequeña ayuda para
investigación local. Está intencionalmente desconectada del inicio de la CLI, del enrutamiento de comandos
y de cualquier comando de forma predeterminada. Úsala solo mientras depuras un comando lento y luego
elimina la importación y los spans antes de integrar el cambio de comportamiento.

Úsala cuando un comando sea lento y necesites un desglose rápido por fases antes de
decidir si usar un perfilador de CPU o corregir un subsistema específico.

### Agregar spans temporales

Agrega la ayuda cerca del código que estás investigando. Por ejemplo, mientras depuras
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

- Anteponer `debug:` a los nombres de fase temporales.
- Agregar solo unos pocos spans alrededor de secciones sospechosamente lentas.
- Preferir fases amplias como `registry`, `auth_store` o `rows` en lugar de nombres
  de helpers.
- Usar `time()` para trabajo sincrónico y `timeAsync()` para promesas.
- Mantener limpio stdout. La ayuda escribe en stderr, por lo que la salida JSON del comando sigue siendo analizable.
- Eliminar importaciones y spans temporales antes de abrir el PR final de la corrección.
- Incluir la salida de temporización o un breve resumen en el issue o PR que explique
  la optimización.

### Ejecutar con salida legible

El modo legible es el mejor para depuración en vivo:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Ejemplo de salida de una investigación temporal de `models list`:

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

Conclusiones de esta salida:

| Fase | Tiempo | Qué significa |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store` | 20.3s | La carga del almacén de perfiles de autenticación es el mayor costo y debería investigarse primero. |
| `debug:models:list:ensure_models_json` | 5.0s | La sincronización de `models.json` es lo bastante costosa como para inspeccionar caché o condiciones de omisión. |
| `debug:models:list:load_model_registry` | 5.9s | La construcción del registro y el trabajo de disponibilidad de proveedores también suponen un costo significativo. |
| `debug:models:list:read_registry_models` | 2.4s | Leer todos los modelos del registro no es gratis y puede importar para `--all`. |
| fases de agregado de filas | 3.2s total | Construir cinco filas mostradas sigue tardando varios segundos, así que la ruta de filtrado merece una inspección más cercana. |
| `debug:models:list:print_model_table` | 0ms | El renderizado no es el cuello de botella. |

Estas conclusiones bastan para orientar el siguiente parche sin mantener código de temporización en
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

### Limpiar antes de integrar

Antes de abrir el PR final:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

El comando no debería devolver sitios temporales de llamadas de instrumentación a menos que el PR
esté agregando explícitamente una superficie permanente de diagnóstico. Para correcciones normales de rendimiento,
conserva solo el cambio de comportamiento, las pruebas y una breve nota con la evidencia de temporización.

Para puntos críticos de CPU más profundos, usa perfilado de Node (`--cpu-prof`) o un
perfilador externo en lugar de agregar más wrappers de temporización.

## Modo watch de Gateway

Para iterar rápidamente, ejecuta Gateway bajo el observador de archivos:

```bash
pnpm gateway:watch
```

Esto se asigna a:

```bash
node scripts/watch-node.mjs gateway --force
```

El observador reinicia en archivos relevantes para la compilación bajo `src/`, archivos fuente de extensiones,
metadatos de extensiones `package.json` y `openclaw.plugin.json`, `tsconfig.json`,
`package.json` y `tsdown.config.ts`. Los cambios de metadatos de extensiones reinician el
gateway sin forzar una recompilación `tsdown`; los cambios en código fuente y configuración siguen
reconstruyendo `dist` primero.

Agrega cualquier flag de CLI de gateway después de `gateway:watch` y se pasará en
cada reinicio. Volver a ejecutar el mismo comando watch para el mismo conjunto de repositorio/flags ahora
reemplaza al observador anterior en lugar de dejar padres de observadores duplicados.

## Perfil de desarrollo + gateway de desarrollo (`--dev`)

Usa el perfil de desarrollo para aislar el estado y levantar una configuración
segura y desechable para depuración. Hay **dos** flags `--dev`:

- **`--dev` global (perfil):** aísla el estado en `~/.openclaw-dev` y
  establece por defecto el puerto del gateway en `19001` (los puertos derivados se desplazan con él).
- **`gateway --dev`:** indica a Gateway que cree automáticamente una configuración +
  espacio de trabajo predeterminados cuando falten (y omita `BOOTSTRAP.md`).

Flujo recomendado (perfil dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Si aún no tienes una instalación global, ejecuta la CLI con `pnpm openclaw ...`.

Qué hace esto:

1. **Aislamiento de perfil** (`--dev` global)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas también se desplazan)

2. **Bootstrap dev** (`gateway --dev`)
   - Escribe una configuración mínima si falta (`gateway.mode=local`, bind loopback).
   - Establece `agent.workspace` al espacio de trabajo dev.
   - Establece `agent.skipBootstrap=true` (sin `BOOTSTRAP.md`).
   - Inicializa los archivos del espacio de trabajo si faltan:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identidad predeterminada: **C3‑PO** (droide de protocolo).
   - Omite proveedores de canal en modo dev (`OPENCLAW_SKIP_CHANNELS=1`).

Flujo de reinicio (comienzo limpio):

```bash
pnpm gateway:dev:reset
```

Nota: `--dev` es una flag **global** de perfil y algunos runners la consumen.
Si necesitas expresarla explícitamente, usa la forma con variable de entorno:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` borra configuración, credenciales, sesiones y el espacio de trabajo dev (usando
`trash`, no `rm`), y luego recrea la configuración dev predeterminada.

Consejo: si ya se está ejecutando un gateway no dev (launchd/systemd), deténlo primero:

```bash
openclaw gateway stop
```

## Registro de stream sin procesar (OpenClaw)

OpenClaw puede registrar el **stream sin procesar del asistente** antes de cualquier filtrado/formateo.
Esta es la mejor manera de ver si el razonamiento está llegando como deltas de texto simples
(o como bloques de pensamiento separados).

Actívalo mediante CLI:

```bash
pnpm gateway:watch --raw-stream
```

Anulación opcional de la ruta:

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

- Los registros de stream sin procesar pueden incluir prompts completos, salida de herramientas y datos de usuario.
- Mantén los registros en local y elimínalos después de depurar.
- Si compartes registros, limpia primero secretos e información de identificación personal.

## Relacionado

- [Solución de problemas](/es/help/troubleshooting)
- [Preguntas frecuentes](/es/help/faq)
