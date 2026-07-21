---
read_when:
    - Quiere reducir los costes de tokens de los prompts mediante la retención de caché
    - Se necesita un comportamiento de caché por agente en configuraciones multiagente
    - Estás ajustando conjuntamente la depuración de Heartbeat y de la caché según el TTL.
summary: Controles de almacenamiento en caché de prompts, orden de fusión, comportamiento del proveedor y patrones de ajuste
title: Almacenamiento en caché de prompts
x-i18n:
    generated_at: "2026-07-21T09:12:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a9201ebc262f00311a512788e8aa2bf2091b6f31ad160b54925cceb2b74c7155
    source_path: reference/prompt-caching.md
    workflow: 16
---

El almacenamiento en caché de prompts permite que un proveedor de modelos reutilice un prefijo de prompt sin cambios (instrucciones del sistema/desarrollador, definiciones de herramientas y otro contexto estable) entre turnos, en lugar de volver a procesarlo en cada solicitud. Esto reduce el coste de tokens y la latencia en sesiones de larga duración con contexto repetido.

OpenClaw normaliza el uso del proveedor en `cacheRead` y `cacheWrite` siempre que la API ascendente exponga esos contadores. Los resúmenes de uso (`/status` y similares) recurren a la última entrada de uso de la transcripción cuando la instantánea de la sesión activa carece de contadores de caché; un valor activo distinto de cero siempre prevalece sobre el valor alternativo.

Referencias de proveedores:

- [Almacenamiento en caché de prompts de Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Almacenamiento en caché de prompts de OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

## Controles principales

### `cacheRetention`

Valores: `"none" | "short" | "long"`. Se puede configurar como valor predeterminado global, por modelo y por agente.
`"standard"` no es un alias; use `"short"` para la ventana de caché predeterminada del proveedor. Los valores no válidos se ignoran con una advertencia.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # sustituye el valor predeterminado global para este modelo
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # sustituye ambos valores predeterminados para este agente
```

Orden de combinación (el posterior prevalece):

1. `agents.defaults.params` - valor predeterminado global para todos los modelos
2. `agents.defaults.models["provider/model"].params` - sustitución por modelo
3. `agents.list[].params` - sustitución por agente, que se coteja mediante el id. del agente

Fuente: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Elimina el contexto antiguo de resultados de herramientas después de que venza la ventana TTL de la caché, de modo que una solicitud posterior a un periodo de inactividad no vuelva a almacenar en caché un historial sobredimensionado.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Consulte [Poda de sesiones](/es/concepts/session-pruning) para conocer el comportamiento completo.

### Mantenimiento en caliente mediante Heartbeat

Heartbeat puede mantener activas las ventanas de caché y reducir las escrituras repetidas en la caché después de intervalos de inactividad. Se puede configurar globalmente (`agents.defaults.heartbeat`) o por agente (`agents.list[].heartbeat`).

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Comportamiento de los proveedores

### Anthropic (API directa y Vertex AI)

- `cacheRetention` es compatible con los proveedores `anthropic` y `anthropic-vertex`, así como con los modelos Claude en `amazon-bedrock` y los endpoints personalizados compatibles con `anthropic-messages` cuando `cacheRetention` se establece explícitamente.
- Cuando no está establecido, OpenClaw inicializa `cacheRetention: "short"` para Anthropic directo (solo los proveedores `anthropic` y `anthropic-vertex`; las demás rutas de la familia Anthropic requieren un valor explícito).
- Las respuestas nativas de Anthropic Messages exponen `cache_read_input_tokens` y `cache_creation_input_tokens`, que se asignan a `cacheRead` y `cacheWrite`.
- `cacheRetention: "short"` se asigna a la caché efímera predeterminada de 5 minutos. `cacheRetention: "long"` solicita el TTL de 1 hora (`cache_control: { type: "ephemeral", ttl: "1h" }`) cuando se establece explícitamente. Una retención larga implícita o determinada por el entorno (`OPENCLAW_CACHE_RETENTION=long` sin un `cacheRetention` explícito) solo se amplía al TTL de 1 hora en hosts `api.anthropic.com` o Vertex AI (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`); los demás hosts mantienen la caché de 5 minutos.

Fuente: `packages/ai/src/transports/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (API directa)

- El almacenamiento en caché de prompts es automático en los modelos recientes compatibles; OpenClaw no inserta marcadores de caché a nivel de bloque.
- OpenClaw envía `prompt_cache_key` para mantener estable el enrutamiento de la caché entre turnos. Los hosts directos `api.openai.com` lo reciben automáticamente. Los proxies compatibles con OpenAI (oMLX, llama.cpp y endpoints personalizados) necesitan `compat.supportsPromptCacheKey: true` en la configuración del modelo para habilitarlo; nunca se detecta automáticamente en un proxy.
- `prompt_cache_retention: "24h"` solo se añade cuando se selecciona `cacheRetention: "long"` y el endpoint resuelto admite tanto la clave de caché como la retención larga (`compat.supportsLongCacheRetention`, verdadero de forma predeterminada; los perfiles de compatibilidad de Together AI y Cloudflare la deshabilitan). `cacheRetention: "none"` suprime ambos campos.
- Los aciertos de caché se presentan mediante `usage.prompt_tokens_details.cached_tokens` (Chat Completions) o `input_tokens_details.cached_tokens` (Responses API), que se asignan a `cacheRead`.
- Las cargas útiles de Responses API también pueden exponer `input_tokens_details.cache_write_tokens`, que se asigna a `cacheWrite` y se tarifica según la tarifa de escritura en caché del modelo; las cargas útiles de Responses que omiten el campo mantienen `cacheWrite` en `0`. La API Chat Completions de OpenAI no documenta ni emite un contador `cache_write_tokens`, pero OpenClaw sigue leyendo `prompt_tokens_details.cache_write_tokens` allí para los proxies compatibles con OpenRouter y de tipo DeepSeek que informan de un recuento de escrituras independiente.
- En la práctica, OpenAI se comporta más como una caché de prefijo inicial que como la reutilización móvil del historial completo de Anthropic; consulte [Expectativas de OpenAI en vivo](#openai-live-expectations) a continuación.

### Amazon Bedrock

- Las referencias a modelos Anthropic Claude (`amazon-bedrock/*anthropic.claude*`, además de los prefijos de perfiles de inferencia del sistema de AWS `us.`/`eu.`/`global.anthropic.claude*`) admiten el paso explícito de `cacheRetention`.
- Los modelos Bedrock que no son de Anthropic (por ejemplo, `amazon.nova-*`) se resuelven sin retención de caché durante la ejecución, independientemente de cualquier valor `cacheRetention` configurado.
- Los ARN opacos de perfiles de inferencia de aplicaciones de Bedrock (identificadores de perfil que no contienen `claude`) también se resuelven sin retención de caché, salvo que `cacheRetention` se establezca explícitamente, ya que la familia del modelo no puede inferirse únicamente a partir del ARN.

### OpenRouter

Para las referencias de modelo `openrouter/anthropic/*`, OpenClaw inserta marcadores `cache_control` de Anthropic en los bloques de prompts del sistema/desarrollador, pero solo cuando la solicitud sigue dirigiéndose a una ruta de OpenRouter verificada (`openrouter` en su endpoint predeterminado, o cualquier proveedor/URL base que se resuelva como `openrouter.ai`). Si se redirige el modelo a una URL de proxy arbitraria compatible con OpenAI, esta inserción deja de realizarse.

`contextPruning.mode: "cache-ttl"` está permitido para las referencias de modelo `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` y `openrouter/zai/*`, porque estas rutas gestionan el almacenamiento en caché de prompts del lado del proveedor sin necesitar los marcadores insertados por OpenClaw.

Fuente: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

La creación de la caché de DeepSeek en OpenRouter se realiza con el mejor esfuerzo y puede tardar unos segundos; una solicitud de seguimiento inmediata puede seguir mostrando `cached_tokens: 0`. Verifíquelo con una solicitud repetida que utilice el mismo prefijo tras una breve espera y use `usage.prompt_tokens_details.cached_tokens` como señal de acierto de caché.

### Google Gemini (API directa)

- El transporte directo de Gemini (`api: "google-generative-ai"`) informa de los aciertos de caché mediante el campo ascendente `cachedContentTokenCount`, que se asigna a `cacheRead`.
- Familias de modelos aptas: `gemini-2.5*` y `gemini-3*` (se excluyen las variantes Live/vista previa fuera de esa coincidencia de prefijo, por ejemplo, `gemini-live-2.5-flash-preview`).
- Cuando `cacheRetention` se establece en un modelo apto, OpenClaw crea, reutiliza y actualiza automáticamente un recurso `cachedContents` para el prompt del sistema, sin necesidad de un identificador manual de contenido almacenado en caché. El TTL es `300s` para `cacheRetention: "short"` y `3600s` para `"long"`.
- También se puede pasar un identificador de contenido almacenado en caché de Gemini preexistente como `params.cachedContent` (o el valor heredado `params.cached_content`); un identificador explícito omite por completo la ruta de gestión automática de la caché.
- Esto es independiente del almacenamiento en caché de prefijos de prompts de Anthropic/OpenAI: OpenClaw gestiona un recurso `cachedContents` nativo del proveedor para Gemini en lugar de insertar marcadores de caché en línea.

Fuente: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### Proveedores con arnés de CLI (Claude Code, Gemini CLI)

Los backends de CLI que emiten eventos de uso JSONL (`jsonlDialect: "claude-stream-json"` o `"gemini-stream-json"`) pasan por un analizador de uso compartido que reconoce diversas variantes de nombres de campo, incluido un contador `cached` simple que se asigna a `cacheRead`. Cuando la carga útil JSON de la CLI omite un campo directo de tokens de entrada, OpenClaw lo deriva como `input_tokens - cached`. Esto solo normaliza el uso; no crea marcadores de caché de prompts del tipo Anthropic/OpenAI para estos modelos controlados mediante CLI.

Fuente: `src/agents/cli-output.ts` (`toCliUsage`).

### Otros proveedores

Si un proveedor no admite ninguno de los modos de caché anteriores, `cacheRetention` no tiene efecto.

## Límite de caché del prompt del sistema

OpenClaw divide el prompt del sistema en un **prefijo estable** y un **sufijo volátil** mediante un límite interno de prefijo de caché. El contenido situado por encima del límite (definiciones de herramientas, metadatos de Skills y archivos del espacio de trabajo) se ordena para que permanezca idéntico byte por byte entre turnos. El contenido situado por debajo del límite (por ejemplo, `HEARTBEAT.md`, marcas de tiempo de ejecución y otros metadatos por turno) puede cambiar sin invalidar el prefijo almacenado en caché.

Decisiones de diseño clave:

- Los archivos estables de contexto del proyecto del espacio de trabajo se ordenan antes de `HEARTBEAT.md` para que las variaciones de Heartbeat no invaliden el prefijo estable.
- El límite se aplica a la conformación del transporte de las familias Anthropic y OpenAI, Google y CLI, por lo que todos los proveedores compatibles se benefician de la misma estabilidad del prefijo.
- Las solicitudes de Codex Responses y Anthropic Vertex se enrutan mediante una conformación de caché que tiene en cuenta el límite, para que la reutilización de la caché permanezca alineada con lo que los proveedores reciben realmente.
- Las huellas digitales del prompt del sistema se normalizan (espacios en blanco, finales de línea, contexto añadido por hooks y orden de capacidades de ejecución) para que los prompts sin cambios semánticos compartan la caché entre turnos.

Si se observan picos inesperados de `cacheWrite` después de un cambio en la configuración o el espacio de trabajo, compruebe si el cambio queda por encima o por debajo del límite de caché. Mover el contenido volátil por debajo del límite (o estabilizarlo) suele resolver el problema.

## Medidas de estabilidad de la caché de OpenClaw

- Los catálogos de herramientas MCP incluidos se ordenan de forma determinista (primero por nombre de servidor y después por nombre de herramienta) antes del registro de herramientas, para que los cambios de orden de `listTools()` no alteren el bloque de herramientas ni invaliden los prefijos de la caché de prompts.
- Las sesiones heredadas con bloques de imágenes persistentes mantienen intactos los **3 turnos completados más recientes** (se cuentan todos los turnos completados, no solo los que contienen imágenes). Los bloques de imágenes más antiguos que ya se hayan procesado se sustituyen por un marcador de texto, para que los seguimientos con muchas imágenes no sigan reenviando cargas útiles antiguas de gran tamaño.

## Patrones de ajuste

### Tráfico mixto (valor predeterminado recomendado)

Mantenga una configuración base de larga duración en el agente principal y deshabilite el almacenamiento en caché en los agentes de notificación con tráfico en ráfagas:

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

- Establezca el valor base `cacheRetention: "short"`.
- Habilite `contextPruning.mode: "cache-ttl"`.
- Mantenga Heartbeat por debajo del TTL solo para los agentes que se beneficien de cachés activas.

## Pruebas de regresión en vivo

OpenClaw ejecuta una única puerta combinada de regresión de caché en vivo que abarca prefijos repetidos, turnos de herramientas, turnos con imágenes, transcripciones de herramientas de tipo MCP y un control sin caché de Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Ejecútela con:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

El archivo de referencia almacena las cifras activas observadas más recientemente, junto con los mínimos de regresión específicos de cada proveedor con los que se compara la prueba. Cada ejecución utiliza identificadores de sesión y espacios de nombres de prompts nuevos y exclusivos para esa ejecución, de modo que el estado anterior de la caché no contamine la muestra actual. Anthropic y OpenAI aplican criterios diferentes: no alcanzar un mínimo de Anthropic constituye una regresión crítica (la prueba falla), mientras que no alcanzar un mínimo de OpenAI solo se supervisa (se registra como advertencia y la ejecución no falla). No comparten un único umbral común para ambos proveedores.

### Expectativas de Anthropic en producción

- Se esperan escrituras explícitas de calentamiento mediante `cacheWrite`.
- Se espera una reutilización casi completa del historial en turnos repetidos, porque el control de caché de Anthropic desplaza el punto de interrupción de la caché a lo largo de la conversación.
- Los mínimos de referencia para los carriles estable, de herramientas, de imágenes y de estilo MCP son barreras críticas contra regresiones.

### Expectativas de OpenAI en producción

- Se espera únicamente `cacheRead`; `cacheWrite` permanece en `0` en Chat Completions.
- La reutilización de la caché en turnos repetidos se considera una meseta específica del proveedor, no una reutilización móvil de todo el historial al estilo de Anthropic.
- Los mínimos solo se supervisan (si no se alcanza uno, se registra una advertencia, pero la prueba no falla) y se derivan del comportamiento observado en producción con `gpt-5.4-mini`:

| Escenario                    | Mínimo de `cacheRead` | Mínimo de tasa de aciertos |
| ---------------------------- | ----------------------------: | -------------------------: |
| Prefijo estable              |                         4,608 |                       0.90 |
| Transcripción de herramientas |                         4,096 |                       0.85 |
| Transcripción de imágenes    |                         3,840 |                       0.82 |
| Transcripción de estilo MCP  |                         4,096 |                       0.85 |

Las cifras de referencia observadas más recientemente (de `live-cache-regression-baseline.ts`) fueron: prefijo estable `cacheRead=4864`, tasa de aciertos `0.966`; transcripción de herramientas `cacheRead=4608`, tasa de aciertos `0.896`; transcripción de imágenes `cacheRead=4864`, tasa de aciertos `0.954`; transcripción de estilo MCP `cacheRead=4608`, tasa de aciertos `0.891`.

Motivo por el que las aserciones difieren: Anthropic expone puntos de interrupción de caché explícitos y una reutilización móvil del historial de conversación, mientras que el prefijo efectivamente reutilizable de OpenAI en el tráfico de producción puede estabilizarse antes de abarcar todo el prompt. Comparar ambos proveedores con un único umbral porcentual común produce falsas regresiones.

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

| Clave               | Valor predeterminado                         |
| ------------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### Variables de entorno (depuración puntual)

| Variable                             | Efecto                                             |
| ------------------------------------ | -------------------------------------------------- |
| `OPENCLAW_CACHE_TRACE=1`             | Activa el seguimiento de la caché                  |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | Sobrescribe la ruta de salida                      |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Activa o desactiva la captura completa de mensajes |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | Activa o desactiva la captura del texto del prompt |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Activa o desactiva la captura del prompt del sistema |

### Qué inspeccionar

- Los eventos de seguimiento de caché están en formato JSONL, con instantáneas por etapas como `session:loaded`, `prompt:before`, `stream:context` y `session:after`.
- El impacto de los tokens de caché por turno es visible en las superficies de uso habituales: `cacheRead` y `cacheWrite` aparecen en `/usage tokens`, `/status`, los resúmenes de uso de las sesiones y los diseños personalizados de `messages.usageTemplate`.
- Para Anthropic, se esperan tanto `cacheRead` como `cacheWrite` cuando la caché está activa.
- Para OpenAI, se espera `cacheRead` cuando hay aciertos de caché; `cacheWrite` solo se completa en las cargas útiles de la Responses API que lo incluyen (véase [OpenAI](#openai-direct-api) más arriba).
- OpenAI también devuelve encabezados de seguimiento y de límites de frecuencia, como `x-request-id`, `openai-processing-ms` y `x-ratelimit-*`; se pueden usar para seguir las solicitudes, pero la contabilización de aciertos de caché debe seguir obteniéndose de la carga útil de uso, no de los encabezados.

## Solución rápida de problemas

- **Valor alto de `cacheWrite` en la mayoría de los turnos**: compruebe si hay entradas variables en el prompt del sistema; verifique que el modelo o proveedor admita la configuración de caché.
- **Valor alto de `cacheWrite` en Anthropic**: suele significar que el punto de interrupción de la caché se sitúa en contenido que cambia con cada solicitud.
- **Valor bajo de `cacheRead` en OpenAI**: verifique que el prefijo estable esté al principio, que el prefijo repetido tenga al menos 1024 tokens y que se reutilice el mismo `prompt_cache_key` en los turnos que deban compartir una caché.
- **`cacheRetention` no produce ningún efecto**: confirme que la clave del modelo coincida con `agents.defaults.models["provider/model"]`.
- **Solicitudes de Bedrock Nova con configuración de caché**: es lo esperado; estas se resuelven sin conservar la caché durante la ejecución.

Documentación relacionada:

- [Anthropic](/es/providers/anthropic)
- [Uso y costes de tokens](/es/reference/token-use)
- [Depuración de sesiones](/es/concepts/session-pruning)
- [Referencia de configuración del Gateway](/es/gateway/configuration-reference)

## Contenido relacionado

- [Uso y costes de tokens](/es/reference/token-use)
- [Uso y costes de la API](/es/reference/api-usage-costs)
