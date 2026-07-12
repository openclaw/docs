---
read_when:
    - Quieres reducir los costes de tokens del prompt mediante la retención de la caché
    - Necesitas un comportamiento de caché por agente en configuraciones multiagente
    - Estás ajustando conjuntamente la depuración de Heartbeat y de la TTL de la caché.
summary: Opciones de configuración del almacenamiento en caché de prompts, orden de fusión, comportamiento del proveedor y patrones de ajuste
title: Almacenamiento en caché de prompts
x-i18n:
    generated_at: "2026-07-11T23:29:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f3e6ba31517a598f22cfdbe04da746a756feadc7c4c376efaa4779cbf05b31
    source_path: reference/prompt-caching.md
    workflow: 16
---

El almacenamiento en caché de prompts permite que un proveedor de modelos reutilice un prefijo de prompt sin cambios (instrucciones del sistema/desarrollador, definiciones de herramientas y otro contexto estable) entre turnos, en lugar de volver a procesarlo en cada solicitud. Esto reduce el coste de los tokens y la latencia en sesiones de larga duración con contexto repetido.

OpenClaw normaliza el uso del proveedor en `cacheRead` y `cacheWrite` siempre que la API ascendente exponga esos contadores. Los resúmenes de uso (`/status` y similares) recurren a la última entrada de uso de la transcripción cuando la instantánea de la sesión activa carece de contadores de caché; un valor activo distinto de cero siempre prevalece sobre el valor alternativo.

Referencias de proveedores:

- [Almacenamiento en caché de prompts de Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Almacenamiento en caché de prompts de OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

## Controles principales

### `cacheRetention`

Valores: `"none" | "short" | "long"`. Se puede configurar como valor predeterminado global, por modelo y por agente.

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

Orden de combinación (prevalece el último):

1. `agents.defaults.params` - valor predeterminado global para todos los modelos
2. `agents.defaults.models["provider/model"].params` - anulación por modelo
3. `agents.list[].params` - anulación por agente, asociada mediante el identificador del agente

Fuente: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Recorta el contexto antiguo de resultados de herramientas una vez transcurrida la ventana de TTL de la caché, para que una solicitud posterior a un periodo de inactividad no vuelva a almacenar en caché un historial sobredimensionado.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Consulta [Recorte de sesiones](/es/concepts/session-pruning) para conocer el comportamiento completo.

### Mantenimiento en caliente mediante Heartbeat

Heartbeat puede mantener activas las ventanas de caché y reducir las escrituras repetidas en caché tras periodos de inactividad. Se puede configurar globalmente (`agents.defaults.heartbeat`) o por agente (`agents.list[].heartbeat`).

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Comportamiento de los proveedores

### Anthropic (API directa y Vertex AI)

- `cacheRetention` es compatible con los proveedores `anthropic` y `anthropic-vertex`, así como con los modelos Claude en `amazon-bedrock` y los endpoints personalizados compatibles con `anthropic-messages` cuando `cacheRetention` se establece explícitamente.
- Cuando no se establece, OpenClaw inicializa `cacheRetention: "short"` para Anthropic directo (solo para los proveedores `anthropic` y `anthropic-vertex`; las demás rutas de la familia Anthropic requieren un valor explícito).
- Las respuestas nativas de Anthropic Messages exponen `cache_read_input_tokens` y `cache_creation_input_tokens`, que se asignan a `cacheRead` y `cacheWrite`.
- `cacheRetention: "short"` se asigna a la caché efímera predeterminada de 5 minutos. `cacheRetention: "long"` solicita el TTL de 1 hora (`cache_control: { type: "ephemeral", ttl: "1h" }`) cuando se establece explícitamente. Una retención larga implícita o controlada por el entorno (`OPENCLAW_CACHE_RETENTION=long` sin un `cacheRetention` explícito) solo amplía el TTL a 1 hora en hosts de `api.anthropic.com` o Vertex AI (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`); los demás hosts conservan la caché de 5 minutos.

Fuente: `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (API directa)

- El almacenamiento en caché de prompts es automático en los modelos recientes compatibles; OpenClaw no inserta marcadores de caché por bloque.
- OpenClaw envía `prompt_cache_key` para mantener estable el enrutamiento de la caché entre turnos. Los hosts directos de `api.openai.com` lo reciben automáticamente. Los proxies compatibles con OpenAI (oMLX, llama.cpp y endpoints personalizados) deben incluir `compat.supportsPromptCacheKey: true` en la configuración del modelo para habilitarlo; esto nunca se detecta automáticamente en un proxy.
- `prompt_cache_retention: "24h"` solo se añade cuando se selecciona `cacheRetention: "long"` y el endpoint resuelto admite tanto la clave de caché como la retención larga (`compat.supportsLongCacheRetention`, `true` de forma predeterminada; los perfiles de compatibilidad de Together AI y Cloudflare la desactivan). `cacheRetention: "none"` suprime ambos campos.
- Los aciertos de caché aparecen mediante `usage.prompt_tokens_details.cached_tokens` (Chat Completions) o `input_tokens_details.cached_tokens` (Responses API), que se asignan a `cacheRead`.
- Las cargas útiles de Responses API también pueden exponer `input_tokens_details.cache_write_tokens`, que se asigna a `cacheWrite` y se factura según la tarifa de escritura en caché del modelo; las cargas útiles de Responses que omiten el campo mantienen `cacheWrite` en `0`. La API Chat Completions de OpenAI no documenta ni emite un contador `cache_write_tokens`, pero OpenClaw aun así lee `prompt_tokens_details.cache_write_tokens` en ella para proxies compatibles con OpenRouter y de estilo DeepSeek que informan de un recuento de escrituras independiente.
- En la práctica, OpenAI se comporta más como una caché del prefijo inicial que como la reutilización móvil del historial completo de Anthropic; consulta [Expectativas de OpenAI en producción](#openai-live-expectations) más adelante.

### Amazon Bedrock

- Las referencias de modelos Anthropic Claude (`amazon-bedrock/*anthropic.claude*`, además de los prefijos de perfiles de inferencia del sistema de AWS `us.`/`eu.`/`global.anthropic.claude*`) admiten el paso explícito de `cacheRetention`.
- Los modelos de Bedrock que no son de Anthropic (por ejemplo, `amazon.nova-*`) se resuelven sin retención de caché durante la ejecución, independientemente del valor configurado de `cacheRetention`.
- Los ARN opacos de perfiles de inferencia de aplicaciones de Bedrock (identificadores de perfil que no contienen `claude`) también se resuelven sin retención de caché, salvo que `cacheRetention` se establezca explícitamente, ya que la familia del modelo no puede inferirse únicamente a partir del ARN.

### OpenRouter

Para las referencias de modelos `openrouter/anthropic/*`, OpenClaw inserta marcadores `cache_control` de Anthropic en los bloques de prompts del sistema/desarrollador, pero solo cuando la solicitud sigue dirigida a una ruta de OpenRouter verificada (`openrouter` en su endpoint predeterminado, o cualquier proveedor/URL base que se resuelva en `openrouter.ai`). Redirigir el modelo a una URL de proxy arbitraria compatible con OpenAI detiene esta inserción.

`contextPruning.mode: "cache-ttl"` está permitido para las referencias de modelos `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` y `openrouter/zai/*`, porque estas rutas gestionan el almacenamiento en caché de prompts en el proveedor sin necesitar los marcadores insertados por OpenClaw.

Fuente: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

La creación de la caché de DeepSeek en OpenRouter se realiza con el mejor esfuerzo y puede tardar unos segundos; una solicitud de seguimiento inmediata puede seguir mostrando `cached_tokens: 0`. Verifícala con una solicitud repetida con el mismo prefijo tras una breve espera, usando `usage.prompt_tokens_details.cached_tokens` como señal de acierto de caché.

### Google Gemini (API directa)

- El transporte directo de Gemini (`api: "google-generative-ai"`) informa de los aciertos de caché mediante el valor ascendente `cachedContentTokenCount`, que se asigna a `cacheRead`.
- Familias de modelos aptas: `gemini-2.5*` y `gemini-3*` (se excluyen las variantes Live o de vista previa fuera de esa coincidencia de prefijo, por ejemplo, `gemini-live-2.5-flash-preview`).
- Cuando se establece `cacheRetention` en un modelo apto, OpenClaw crea, reutiliza y actualiza automáticamente un recurso `cachedContents` para el prompt del sistema; no se necesita ningún identificador manual de contenido almacenado en caché. El TTL es de `300s` para `cacheRetention: "short"` y de `3600s` para `"long"`.
- También puedes pasar un identificador preexistente de contenido almacenado en caché de Gemini mediante `params.cachedContent` (o el formato heredado `params.cached_content`); un identificador explícito omite por completo la ruta de gestión automática de la caché.
- Esto es independiente del almacenamiento en caché de prefijos de prompts de Anthropic/OpenAI: OpenClaw gestiona un recurso `cachedContents` nativo del proveedor para Gemini, en lugar de insertar marcadores de caché en línea.

Fuente: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### Proveedores con arnés de CLI (Claude Code, Gemini CLI)

Los backends de CLI que emiten eventos de uso JSONL (`jsonlDialect: "claude-stream-json"` o `"gemini-stream-json"`) pasan por un analizador de uso compartido que reconoce varias variantes de nombres de campos, incluido un contador simple `cached` que se asigna a `cacheRead`. Cuando la carga útil JSON de la CLI omite un campo directo de tokens de entrada, OpenClaw lo calcula como `input_tokens - cached`. Esto solo normaliza el uso; no crea marcadores de caché de prompts al estilo de Anthropic/OpenAI para estos modelos controlados mediante CLI.

Fuente: `src/agents/cli-output.ts` (`toCliUsage`).

### Otros proveedores

Si un proveedor no admite ninguno de los modos de caché anteriores, `cacheRetention` no tiene efecto.

## Límite de caché del prompt del sistema

OpenClaw divide el prompt del sistema en un **prefijo estable** y un **sufijo volátil** mediante un límite interno del prefijo de caché. El contenido situado por encima del límite (definiciones de herramientas, metadatos de Skills y archivos del espacio de trabajo) se ordena para permanecer idéntico byte por byte entre turnos. El contenido situado por debajo del límite (por ejemplo, `HEARTBEAT.md`, marcas de tiempo de ejecución y otros metadatos de cada turno) puede cambiar sin invalidar el prefijo almacenado en caché.

Decisiones clave de diseño:

- Los archivos estables de contexto del proyecto del espacio de trabajo se ordenan antes de `HEARTBEAT.md`, de modo que los cambios de Heartbeat no invaliden el prefijo estable.
- El límite se aplica a la conformación del transporte de las familias Anthropic y OpenAI, Google y la CLI, por lo que todos los proveedores compatibles se benefician de la misma estabilidad del prefijo.
- Las solicitudes de Codex Responses y Anthropic Vertex se enrutan mediante una conformación de caché consciente del límite, para que la reutilización de la caché permanezca alineada con lo que realmente reciben los proveedores.
- Las huellas digitales del prompt del sistema se normalizan (espacios en blanco, finales de línea, contexto añadido por hooks y ordenación de capacidades de ejecución), de modo que los prompts semánticamente idénticos compartan caché entre turnos.

Si observas aumentos inesperados de `cacheWrite` después de un cambio de configuración o del espacio de trabajo, comprueba si el cambio queda por encima o por debajo del límite de caché. Mover el contenido volátil por debajo del límite (o estabilizarlo) suele resolver el problema.

## Protecciones de estabilidad de caché de OpenClaw

- Los catálogos de herramientas MCP incluidos se ordenan de forma determinista (primero por nombre del servidor y después por nombre de la herramienta) antes de registrar las herramientas, de modo que los cambios en el orden de `listTools()` no modifiquen continuamente el bloque de herramientas ni invaliden los prefijos de la caché de prompts.
- Las sesiones heredadas con bloques de imágenes persistentes conservan intactos los **3 turnos completados más recientes** (se cuentan todos los turnos completados, no solo los que contienen imágenes). Los bloques de imágenes más antiguos que ya se hayan procesado se sustituyen por un marcador de texto, para que los seguimientos con muchas imágenes no sigan reenviando cargas útiles obsoletas de gran tamaño.

## Patrones de ajuste

### Tráfico mixto (valor predeterminado recomendado)

Mantén una base de larga duración en tu agente principal y desactiva el almacenamiento en caché en los agentes de notificación con actividad en ráfagas:

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

### Configuración base centrada en el coste

- Establece `cacheRetention: "short"` como valor base.
- Habilita `contextPruning.mode: "cache-ttl"`.
- Mantén Heartbeat por debajo del TTL solo para los agentes que se beneficien de las cachés activas.

## Pruebas de regresión en producción

OpenClaw ejecuta una única comprobación combinada de regresión de caché en producción que abarca prefijos repetidos, turnos de herramientas, turnos de imágenes, transcripciones de herramientas de estilo MCP y un control sin caché de Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Ejecútala con:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

El archivo de referencia almacena las cifras observadas más recientemente en producción, además de los umbrales mínimos de regresión específicos de cada proveedor que comprueba la prueba. Cada ejecución usa identificadores de sesión y espacios de nombres de prompts nuevos, específicos de esa ejecución, para que el estado previo de la caché no contamine la muestra actual. Anthropic y OpenAI aplican criterios distintos: no alcanzar el umbral mínimo de Anthropic constituye una regresión grave (la prueba falla), mientras que no alcanzar el umbral mínimo de OpenAI solo se supervisa (se registra como advertencia y la ejecución no falla). No comparten un único umbral común entre proveedores.

### Expectativas de Anthropic en producción

- Espere escrituras explícitas de calentamiento mediante `cacheWrite`.
- Espere una reutilización casi completa del historial en turnos repetidos, porque el control de caché de Anthropic desplaza el punto de interrupción de la caché a lo largo de la conversación.
- Los umbrales mínimos de referencia para las rutas estables, de herramientas, de imágenes y de estilo MCP son barreras estrictas contra regresiones.

### Expectativas en vivo de OpenAI

- Espere solo `cacheRead`; `cacheWrite` permanece en `0` en Chat Completions.
- Trate la reutilización de la caché en turnos repetidos como una meseta específica del proveedor, no como la reutilización móvil de todo el historial al estilo de Anthropic.
- Los umbrales mínimos solo se supervisan (un incumplimiento se registra como advertencia, no como fallo de prueba) y se derivan del comportamiento en vivo observado en `gpt-5.4-mini`:

| Escenario                  | Umbral mínimo de `cacheRead` | Umbral mínimo de tasa de aciertos |
| -------------------------- | ---------------------------: | --------------------------------: |
| Prefijo estable            |                        4,608 |                              0.90 |
| Transcripción de herramienta |                        4,096 |                              0.85 |
| Transcripción de imagen    |                        3,840 |                              0.82 |
| Transcripción de estilo MCP |                        4,096 |                              0.85 |

Las cifras de referencia observadas más recientemente (de `live-cache-regression-baseline.ts`) quedaron en: prefijo estable `cacheRead=4864`, tasa de aciertos `0.966`; transcripción de herramienta `cacheRead=4608`, tasa de aciertos `0.896`; transcripción de imagen `cacheRead=4864`, tasa de aciertos `0.954`; transcripción de estilo MCP `cacheRead=4608`, tasa de aciertos `0.891`.

Por qué difieren las aserciones: Anthropic expone puntos de interrupción explícitos de la caché y una reutilización móvil del historial de conversación, mientras que el prefijo reutilizable efectivo de OpenAI en el tráfico en vivo puede alcanzar una meseta antes de abarcar todo el prompt. Comparar ambos proveedores con un único umbral porcentual común genera falsas regresiones.

## Configuración de `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # opcional
    includeMessages: false # valor predeterminado: true
    includePrompt: false # valor predeterminado: true
    includeSystem: false # valor predeterminado: true
```

Valores predeterminados:

| Clave             | Valor predeterminado                         |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### Variables de entorno (depuración puntual)

| Variable                             | Efecto                                             |
| ------------------------------------ | -------------------------------------------------- |
| `OPENCLAW_CACHE_TRACE=1`             | Activa el seguimiento de la caché                  |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | Sobrescribe la ruta de salida                      |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Activa o desactiva la captura de la carga útil completa de los mensajes |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | Activa o desactiva la captura del texto del prompt |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Activa o desactiva la captura del prompt del sistema |

### Qué inspeccionar

- Los eventos de seguimiento de la caché están en formato JSONL, con instantáneas por etapas como `session:loaded`, `prompt:before`, `stream:context` y `session:after`.
- El impacto de los tokens de caché por turno es visible en las superficies de uso habituales: `cacheRead` y `cacheWrite` aparecen en `/usage tokens`, `/status`, los resúmenes de uso de las sesiones y los diseños personalizados de `messages.usageTemplate`.
- Para Anthropic, espere tanto `cacheRead` como `cacheWrite` cuando el almacenamiento en caché esté activo.
- Para OpenAI, espere `cacheRead` cuando haya aciertos de caché; `cacheWrite` solo se rellena en las cargas útiles de Responses API que lo incluyan (consulte [OpenAI](#openai-direct-api) más arriba).
- OpenAI también devuelve encabezados de seguimiento y límites de tasa, como `x-request-id`, `openai-processing-ms` y `x-ratelimit-*`; utilícelos para rastrear solicitudes, pero la contabilización de los aciertos de caché debe seguir obteniéndose de la carga útil de uso, no de los encabezados.

## Solución rápida de problemas

- **`cacheWrite` alto en la mayoría de los turnos**: compruebe si hay entradas volátiles en el prompt del sistema; verifique que el modelo o proveedor admita su configuración de caché.
- **`cacheWrite` alto en Anthropic**: a menudo significa que el punto de interrupción de la caché está situado en contenido que cambia con cada solicitud.
- **`cacheRead` bajo en OpenAI**: verifique que el prefijo estable esté al principio, que el prefijo repetido tenga al menos 1024 tokens y que se reutilice el mismo `prompt_cache_key` en los turnos que deban compartir una caché.
- **`cacheRetention` no tiene efecto**: confirme que la clave del modelo coincida con `agents.defaults.models["provider/model"]`.
- **Solicitudes de Bedrock Nova con configuración de caché**: es el comportamiento esperado; estas se resuelven sin retención de caché durante la ejecución.

Documentación relacionada:

- [Anthropic](/es/providers/anthropic)
- [Uso y costes de tokens](/es/reference/token-use)
- [Poda de sesiones](/es/concepts/session-pruning)
- [Referencia de configuración del Gateway](/es/gateway/configuration-reference)

## Contenido relacionado

- [Uso y costes de tokens](/es/reference/token-use)
- [Uso y costes de la API](/es/reference/api-usage-costs)
