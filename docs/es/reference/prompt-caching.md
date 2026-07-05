---
read_when:
    - Quieres reducir los costos de tokens de las indicaciones con la retención de caché
    - Necesitas comportamiento de caché por agente en configuraciones multiagente
    - Estás ajustando juntos la depuración de heartbeat y cache-ttl
summary: Controles de caché de prompts, orden de fusión, comportamiento del proveedor y patrones de ajuste
title: Almacenamiento en caché de prompts
x-i18n:
    generated_at: "2026-07-05T11:44:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f3e6ba31517a598f22cfdbe04da746a756feadc7c4c376efaa4779cbf05b31
    source_path: reference/prompt-caching.md
    workflow: 16
---

El almacenamiento en caché de prompts permite que un proveedor de modelos reutilice un prefijo de prompt sin cambios (instrucciones de sistema/desarrollador, definiciones de herramientas, otro contexto estable) entre turnos en lugar de reprocesarlo en cada solicitud. Esto reduce el costo en tokens y la latencia en sesiones de larga duración con contexto repetido.

OpenClaw normaliza el uso del proveedor en `cacheRead` y `cacheWrite` siempre que la API upstream expone esos contadores. Los resúmenes de uso (`/status` y similares) recurren a la última entrada de uso de la transcripción cuando la instantánea de la sesión en vivo no tiene contadores de caché; un valor en vivo distinto de cero siempre prevalece sobre el valor de reserva.

Referencias de proveedores:

- [Almacenamiento en caché de prompts de Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Almacenamiento en caché de prompts de OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

## Controles principales

### `cacheRetention`

Valores: `"none" | "short" | "long"`. Configurable como valor predeterminado global, por modelo y por agente.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # overrides the global default for this model
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # overrides both defaults for this agent
```

Orden de combinación (lo posterior prevalece):

1. `agents.defaults.params` - valor predeterminado global para todos los modelos
2. `agents.defaults.models["provider/model"].params` - anulación por modelo
3. `agents.list[].params` - anulación por agente, coincidente por id de agente

Fuente: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Depura el contexto antiguo de resultados de herramientas después de que vence la ventana TTL de caché, de modo que una solicitud posterior a un periodo de inactividad no vuelva a almacenar en caché un historial sobredimensionado.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Consulta [Depuración de sesiones](/es/concepts/session-pruning) para ver el comportamiento completo.

### Mantener activo con Heartbeat

Heartbeat puede mantener calientes las ventanas de caché y reducir las escrituras repetidas en caché después de intervalos de inactividad. Configurable globalmente (`agents.defaults.heartbeat`) o por agente (`agents.list[].heartbeat`).

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Comportamiento de proveedores

### Anthropic (API directa y Vertex AI)

- `cacheRetention` es compatible con los proveedores `anthropic` y `anthropic-vertex`, y con modelos Claude en `amazon-bedrock` y endpoints personalizados compatibles con `anthropic-messages` cuando `cacheRetention` se define explícitamente.
- Cuando no se define, OpenClaw inicializa `cacheRetention: "short"` para Anthropic directo (solo proveedores `anthropic` y `anthropic-vertex`; otras rutas de la familia Anthropic requieren un valor explícito).
- Las respuestas nativas de Anthropic Messages exponen `cache_read_input_tokens` y `cache_creation_input_tokens`, asignados a `cacheRead` y `cacheWrite`.
- `cacheRetention: "short"` se asigna a la caché efímera predeterminada de 5 minutos. `cacheRetention: "long"` solicita el TTL de 1 hora (`cache_control: { type: "ephemeral", ttl: "1h" }`) cuando se define explícitamente. Una retención larga implícita/controlada por env (`OPENCLAW_CACHE_RETENTION=long` sin `cacheRetention` explícito) solo se actualiza al TTL de 1 hora en hosts `api.anthropic.com` o Vertex AI (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`); otros hosts conservan la caché de 5 minutos.

Fuente: `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (API directa)

- El almacenamiento en caché de prompts es automático en modelos recientes compatibles; OpenClaw no inyecta marcadores de caché a nivel de bloque.
- OpenClaw envía `prompt_cache_key` para mantener estable el enrutamiento de caché entre turnos. Los hosts directos `api.openai.com` obtienen esto automáticamente. Los proxies compatibles con OpenAI (oMLX, llama.cpp, endpoints personalizados) necesitan `compat.supportsPromptCacheKey: true` en la configuración del modelo para optar por habilitarlo; esto nunca se detecta automáticamente para un proxy.
- `prompt_cache_retention: "24h"` se añade solo cuando se selecciona `cacheRetention: "long"` y el endpoint resuelto admite tanto la clave de caché como la retención larga (`compat.supportsLongCacheRetention`, verdadero de forma predeterminada; los perfiles de compatibilidad de Together AI y Cloudflare la deshabilitan). `cacheRetention: "none"` suprime ambos campos.
- Los aciertos de caché aparecen mediante `usage.prompt_tokens_details.cached_tokens` (Chat Completions) o `input_tokens_details.cached_tokens` (Responses API), asignados a `cacheRead`.
- Las cargas útiles de Responses API también pueden exponer `input_tokens_details.cache_write_tokens`, asignado a `cacheWrite` y tarificado según la tarifa de escritura en caché del modelo; las cargas útiles de Responses que omiten el campo mantienen `cacheWrite` en `0`. La API Chat Completions de OpenAI no documenta ni emite un contador `cache_write_tokens`, pero OpenClaw todavía lee `prompt_tokens_details.cache_write_tokens` allí para proxies compatibles con OpenRouter y de estilo DeepSeek que informan un conteo de escritura separado.
- En la práctica, OpenAI se comporta más como una caché de prefijo inicial que como la reutilización móvil de historial completo de Anthropic; consulta [Expectativas en vivo de OpenAI](#openai-live-expectations) más abajo.

### Amazon Bedrock

- Las refs de modelo Anthropic Claude (`amazon-bedrock/*anthropic.claude*`, más prefijos de perfil de inferencia del sistema AWS `us.`/`eu.`/`global.anthropic.claude*`) admiten el paso explícito de `cacheRetention`.
- Los modelos Bedrock que no son Anthropic (por ejemplo `amazon.nova-*`) se resuelven sin retención de caché en tiempo de ejecución, independientemente de cualquier valor `cacheRetention` configurado.
- Los ARN opacos de perfiles de inferencia de aplicación de Bedrock (IDs de perfil que no contienen `claude`) también se resuelven sin retención de caché a menos que `cacheRetention` se defina explícitamente, ya que la familia de modelos no puede inferirse solo a partir del ARN.

### OpenRouter

Para refs de modelo `openrouter/anthropic/*`, OpenClaw inyecta marcadores `cache_control` de Anthropic en bloques de prompt de sistema/desarrollador, pero solo cuando la solicitud aún apunta a una ruta OpenRouter verificada (`openrouter` en su endpoint predeterminado, o cualquier proveedor/base URL que se resuelva a `openrouter.ai`). Reapuntar el modelo a una URL de proxy arbitraria compatible con OpenAI detiene esta inyección.

`contextPruning.mode: "cache-ttl"` está permitido para refs de modelo `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` y `openrouter/zai/*`, porque estas rutas gestionan el almacenamiento en caché de prompts del lado del proveedor sin necesitar los marcadores inyectados de OpenClaw.

Fuente: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

La construcción de caché de DeepSeek en OpenRouter es de mejor esfuerzo y puede tardar unos segundos; una solicitud de seguimiento inmediata aún puede mostrar `cached_tokens: 0`. Verifícalo con una solicitud repetida con el mismo prefijo después de una breve demora, usando `usage.prompt_tokens_details.cached_tokens` como señal de acierto de caché.

### Google Gemini (API directa)

- El transporte Gemini directo (`api: "google-generative-ai"`) informa aciertos de caché mediante el upstream `cachedContentTokenCount`, asignado a `cacheRead`.
- Familias de modelos elegibles: `gemini-2.5*` y `gemini-3*` (excluye variantes Live/preview fuera de esa coincidencia de prefijo, por ejemplo `gemini-live-2.5-flash-preview`).
- Cuando `cacheRetention` se define en un modelo elegible, OpenClaw crea, reutiliza y actualiza automáticamente un recurso `cachedContents` para el prompt del sistema; no se necesita un identificador manual de cached-content. El TTL es `300s` para `cacheRetention: "short"` y `3600s` para `"long"`.
- Todavía puedes pasar un identificador de cached-content de Gemini preexistente mediante `params.cachedContent` (o el legado `params.cached_content`); un identificador explícito omite por completo la ruta automática de gestión de caché.
- Esto es independiente del almacenamiento en caché de prefijos de prompt de Anthropic/OpenAI: OpenClaw gestiona un recurso `cachedContents` nativo del proveedor para Gemini en lugar de inyectar marcadores de caché en línea.

Fuente: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### Proveedores de arnés CLI (Claude Code, Gemini CLI)

Los backends CLI que emiten eventos de uso JSONL (`jsonlDialect: "claude-stream-json"` o `"gemini-stream-json"`) pasan por un analizador de uso compartido que reconoce varias variantes de nombres de campo, incluido un contador simple `cached` asignado a `cacheRead`. Cuando la carga útil JSON del CLI omite un campo directo de tokens de entrada, OpenClaw lo deriva como `input_tokens - cached`. Esto es solo normalización de uso; no crea marcadores de caché de prompts de estilo Anthropic/OpenAI para estos modelos controlados por CLI.

Fuente: `src/agents/cli-output.ts` (`toCliUsage`).

### Otros proveedores

Si un proveedor no admite ninguno de los modos de caché anteriores, `cacheRetention` no tiene efecto.

## Límite de caché del prompt del sistema

OpenClaw divide el prompt del sistema en un **prefijo estable** y un **sufijo volátil** en un límite interno de prefijo de caché. El contenido por encima del límite (definiciones de herramientas, metadatos de Skills, archivos del workspace) se ordena para permanecer idéntico byte a byte entre turnos. El contenido por debajo del límite (por ejemplo `HEARTBEAT.md`, marcas de tiempo de ejecución, otros metadatos por turno) puede cambiar sin invalidar el prefijo almacenado en caché.

Decisiones clave de diseño:

- Los archivos estables de contexto de proyecto del workspace se ordenan antes de `HEARTBEAT.md` para que la rotación de heartbeat no invalide el prefijo estable.
- El límite se aplica en la conformación de transporte de la familia Anthropic, la familia OpenAI, Google y CLI, de modo que todos los proveedores compatibles se beneficien de la misma estabilidad de prefijo.
- Las solicitudes de Codex Responses y Anthropic Vertex se enrutan mediante conformación de caché consciente del límite para que la reutilización de caché permanezca alineada con lo que los proveedores reciben realmente.
- Las huellas del prompt del sistema se normalizan (espacios en blanco, finales de línea, contexto añadido por hooks, ordenamiento de capacidades de runtime) para que prompts semánticamente sin cambios compartan caché entre turnos.

Si ves picos inesperados de `cacheWrite` después de un cambio de configuración o workspace, revisa si el cambio cae por encima o por debajo del límite de caché. Mover el contenido volátil por debajo del límite (o estabilizarlo) normalmente resuelve el problema.

## Guardas de estabilidad de caché de OpenClaw

- Los catálogos de herramientas MCP incluidos se ordenan de forma determinista (por nombre de servidor y luego por nombre de herramienta) antes del registro de herramientas, de modo que los cambios en el orden de `listTools()` no agiten el bloque de herramientas ni invaliden los prefijos de caché de prompts.
- Las sesiones heredadas con bloques de imagen persistidos mantienen intactos los **3 turnos completados más recientes** (contando todos los turnos completados, no solo los que contienen imágenes). Los bloques de imagen más antiguos ya procesados se reemplazan por un marcador de texto para que los seguimientos con muchas imágenes no sigan reenviando cargas útiles grandes obsoletas.

## Patrones de ajuste

### Tráfico mixto (valor predeterminado recomendado)

Mantén una línea base de larga duración en tu agente principal y deshabilita el almacenamiento en caché en agentes notificadores con ráfagas:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### Línea base priorizando costo

- Define la línea base `cacheRetention: "short"`.
- Habilita `contextPruning.mode: "cache-ttl"`.
- Mantén heartbeat por debajo de tu TTL solo para agentes que se benefician de cachés calientes.

## Pruebas de regresión en vivo

OpenClaw ejecuta una única puerta combinada de regresión de caché en vivo que cubre prefijos repetidos, turnos de herramientas, turnos de imágenes, transcripciones de herramientas de estilo MCP y un control sin caché de Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Ejecútala con:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

El archivo de línea base almacena los números en vivo observados más recientemente más los pisos de regresión específicos de proveedor contra los que verifica la prueba. Cada ejecución usa IDs de sesión y espacios de nombres de prompt nuevos por ejecución para que el estado de caché previo no contamine la muestra actual. Anthropic y OpenAI usan aplicación diferente: una falta de piso en Anthropic es una regresión dura (la prueba falla), mientras que una falta de piso en OpenAI es solo de observación (se registra como advertencia, no falla la ejecución). No comparten un único umbral entre proveedores.

### Expectativas en vivo de Anthropic

- Se esperan escrituras explícitas de calentamiento mediante `cacheWrite`.
- Se espera reutilización de historial casi completo en turnos repetidos, porque el control de caché de Anthropic avanza el punto de interrupción de caché a lo largo de la conversación.
- Los umbrales mínimos de referencia para carriles estables, de herramientas, de imágenes y de estilo MCP son barreras estrictas de regresión.

### Expectativas en vivo de OpenAI

- Se espera solo `cacheRead`; `cacheWrite` permanece en `0` en Chat Completions.
- Trata la reutilización de caché en turnos repetidos como una meseta específica del proveedor, no como una reutilización móvil de historial completo al estilo de Anthropic.
- Los umbrales mínimos son solo de observación (un incumplimiento se registra como advertencia, no como fallo de prueba), derivados del comportamiento en vivo observado en `gpt-5.4-mini`:

| Escenario                | Mínimo de `cacheRead` | Mínimo de tasa de aciertos |
| ------------------------ | --------------------: | -------------------------: |
| Prefijo estable          |                 4,608 |                       0.90 |
| Transcripción de herramienta |              4,096 |                       0.85 |
| Transcripción de imagen  |                 3,840 |                       0.82 |
| Transcripción de estilo MCP |               4,096 |                       0.85 |

Los números de referencia observados más recientemente (de `live-cache-regression-baseline.ts`) quedaron en: prefijo estable `cacheRead=4864`, tasa de aciertos `0.966`; transcripción de herramienta `cacheRead=4608`, tasa de aciertos `0.896`; transcripción de imagen `cacheRead=4864`, tasa de aciertos `0.954`; transcripción de estilo MCP `cacheRead=4608`, tasa de aciertos `0.891`.

Por qué difieren las aserciones: Anthropic expone puntos de interrupción de caché explícitos y reutilización móvil del historial de conversación, mientras que el prefijo reutilizable efectivo de OpenAI en tráfico en vivo puede estabilizarse antes que el prompt completo. Comparar los dos proveedores con un único umbral porcentual entre proveedores produce falsas regresiones.

## Configuración de `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

Valores predeterminados:

| Clave             | Valor predeterminado                         |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### Alternadores de entorno (depuración puntual)

| Variable                             | Efecto                                      |
| ------------------------------------ | ------------------------------------------- |
| `OPENCLAW_CACHE_TRACE=1`             | Habilita el rastreo de caché                |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | Sobrescribe la ruta de salida               |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Alterna la captura de la carga completa de mensajes |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | Alterna la captura del texto del prompt     |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Alterna la captura del prompt del sistema   |

### Qué inspeccionar

- Los eventos de traza de caché son JSONL con instantáneas por etapas como `session:loaded`, `prompt:before`, `stream:context` y `session:after`.
- El impacto de tokens de caché por turno es visible en las superficies de uso normales: `cacheRead` y `cacheWrite` aparecen en `/usage tokens`, `/status`, resúmenes de uso de sesión y diseños personalizados de `messages.usageTemplate`.
- Para Anthropic, espera tanto `cacheRead` como `cacheWrite` cuando el almacenamiento en caché esté activo.
- Para OpenAI, espera `cacheRead` en aciertos de caché; `cacheWrite` se rellena solo en cargas de la Responses API que lo incluyen (consulta [OpenAI](#openai-direct-api) arriba).
- OpenAI también devuelve encabezados de rastreo y límite de tasa como `x-request-id`, `openai-processing-ms` y `x-ratelimit-*`; úsalos para rastrear solicitudes, pero la contabilidad de aciertos de caché debe seguir viniendo de la carga de uso, no de los encabezados.

## Solución rápida de problemas

- **`cacheWrite` alto en la mayoría de los turnos**: comprueba si hay entradas volátiles del prompt del sistema; verifica que el modelo/proveedor admita tu configuración de caché.
- **`cacheWrite` alto en Anthropic**: a menudo significa que el punto de interrupción de caché está cayendo sobre contenido que cambia en cada solicitud.
- **`cacheRead` bajo en OpenAI**: verifica que el prefijo estable esté al principio, que el prefijo repetido tenga al menos 1024 tokens y que se reutilice el mismo `prompt_cache_key` para los turnos que deben compartir una caché.
- **Sin efecto de `cacheRetention`**: confirma que la clave del modelo coincida con `agents.defaults.models["provider/model"]`.
- **Solicitudes de Bedrock Nova con configuración de caché**: esperado; estas se resuelven sin retención de caché en tiempo de ejecución.

Documentos relacionados:

- [Anthropic](/es/providers/anthropic)
- [Uso y costos de tokens](/es/reference/token-use)
- [Poda de sesiones](/es/concepts/session-pruning)
- [Referencia de configuración de Gateway](/es/gateway/configuration-reference)

## Relacionado

- [Uso y costos de tokens](/es/reference/token-use)
- [Uso y costos de API](/es/reference/api-usage-costs)
