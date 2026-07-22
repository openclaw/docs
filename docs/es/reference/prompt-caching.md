---
read_when:
    - Quiere reducir los costes de tokens del prompt mediante la retención de caché
    - Se necesita un comportamiento de caché por agente en configuraciones multiagente
    - Está ajustando conjuntamente la depuración de Heartbeat y de la TTL de la caché
summary: Opciones de configuración del almacenamiento en caché de prompts, orden de fusión, comportamiento del proveedor y patrones de ajuste
title: Almacenamiento en caché de prompts
x-i18n:
    generated_at: "2026-07-22T10:48:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99dfd3d226d37014110adf16818051236114dcb0277e9b4d13eaced0f1fc03aa
    source_path: reference/prompt-caching.md
    workflow: 16
---

El almacenamiento en caché de prompts permite que un proveedor de modelos reutilice un prefijo de prompt sin cambios (instrucciones del sistema/desarrollador, definiciones de herramientas y otro contexto estable) entre turnos, en lugar de volver a procesarlo en cada solicitud. Esto reduce el coste en tokens y la latencia en sesiones de larga duración con contexto repetido.

OpenClaw normaliza el uso del proveedor en `cacheRead` y `cacheWrite` siempre que la API de origen exponga esos contadores. Los resúmenes de uso (`/status` y similares) recurren a la última entrada de uso de la transcripción cuando la instantánea de la sesión activa no incluye contadores de caché; un valor activo distinto de cero siempre prevalece sobre el valor alternativo.

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

Orden de combinación (el último prevalece):

1. `agents.defaults.params` - valor predeterminado global para todos los modelos
2. `agents.defaults.models["provider/model"].params` - sustitución por modelo
3. `agents.entries.*.params` - sustitución por agente, según el id. del agente

Fuente: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Elimina del contexto los resultados antiguos de herramientas una vez transcurrida la ventana de TTL de la caché, para que una solicitud posterior a un periodo de inactividad no vuelva a almacenar en caché un historial sobredimensionado.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Consulte [Poda de sesiones](/es/concepts/session-pruning) para conocer el comportamiento completo.

### Mantenimiento en caliente mediante Heartbeat

Heartbeat puede mantener activas las ventanas de caché y reducir las escrituras repetidas en la caché después de periodos de inactividad. Se puede configurar globalmente (`agents.defaults.heartbeat`) o por agente (`agents.entries.*.heartbeat`).

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Comportamiento de los proveedores

### Anthropic (API directa y Vertex AI)

- `cacheRetention` es compatible con los proveedores `anthropic` y `anthropic-vertex`, y con los modelos Claude en `amazon-bedrock` y puntos de conexión personalizados compatibles con `anthropic-messages` cuando `cacheRetention` se establece explícitamente.
- Cuando no se establece, OpenClaw inicializa `cacheRetention: "short"` para Anthropic directo (solo los proveedores `anthropic` y `anthropic-vertex`; las demás rutas de la familia Anthropic requieren un valor explícito).
- Las respuestas nativas de Anthropic Messages exponen `cache_read_input_tokens` y `cache_creation_input_tokens`, que se asignan a `cacheRead` y `cacheWrite`.
- `cacheRetention: "short"` se asigna a la caché efímera predeterminada de 5 minutos. `cacheRetention: "long"` solicita el TTL de 1 hora (`cache_control: { type: "ephemeral", ttl: "1h" }`) cuando se establece explícitamente. Una retención larga implícita o determinada por el entorno (`OPENCLAW_CACHE_RETENTION=long` sin un `cacheRetention` explícito) solo pasa al TTL de 1 hora en hosts `api.anthropic.com` o Vertex AI (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`); los demás hosts mantienen la caché de 5 minutos.

Fuente: `packages/ai/src/transports/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (API directa)

- El almacenamiento en caché de prompts es automático en los modelos recientes compatibles; OpenClaw no inserta marcadores de caché por bloque.
- OpenClaw envía `prompt_cache_key` para mantener estable el enrutamiento de la caché entre turnos. Los hosts directos de `api.openai.com` lo reciben automáticamente. Los proxies compatibles con OpenAI (oMLX, llama.cpp y puntos de conexión personalizados) necesitan `compat.supportsPromptCacheKey: true` en la configuración del modelo para habilitarlo; nunca se detecta automáticamente en un proxy.
- `prompt_cache_retention: "24h"` solo se añade cuando se selecciona `cacheRetention: "long"` y el punto de conexión resuelto admite tanto la clave de caché como la retención larga (`compat.supportsLongCacheRetention`, verdadero de forma predeterminada; los perfiles de compatibilidad de Together AI y Cloudflare la deshabilitan). `cacheRetention: "none"` suprime ambos campos.
- Los aciertos de caché se muestran mediante `usage.prompt_tokens_details.cached_tokens` (Chat Completions) o `input_tokens_details.cached_tokens` (Responses API), que se asignan a `cacheRead`.
- Las cargas útiles de Responses API también pueden exponer `input_tokens_details.cache_write_tokens`, que se asigna a `cacheWrite` y se cobra según la tarifa de escritura en caché del modelo; las cargas útiles de Responses que omiten el campo mantienen `cacheWrite` en `0`. La API Chat Completions de OpenAI no documenta ni emite un contador `cache_write_tokens`, pero OpenClaw sigue leyendo `prompt_tokens_details.cache_write_tokens` allí para los proxies compatibles con OpenRouter y de estilo DeepSeek que notifican un recuento de escrituras independiente.
- En la práctica, OpenAI se comporta más como una caché del prefijo inicial que como la reutilización móvil del historial completo de Anthropic; consulte [Expectativas de OpenAI en entornos activos](#openai-live-expectations) más adelante.

### Amazon Bedrock

- Las referencias de modelos Anthropic Claude (`amazon-bedrock/*anthropic.claude*`, además de los prefijos de perfiles de inferencia del sistema AWS `us.`/`eu.`/`global.anthropic.claude*`) admiten el paso explícito de `cacheRetention`.
- Los modelos de Bedrock que no son de Anthropic (por ejemplo, `amazon.nova-*`) se resuelven sin retención de caché en tiempo de ejecución, independientemente del valor configurado de `cacheRetention`.
- Los ARN opacos de perfiles de inferencia de aplicaciones de Bedrock (identificadores de perfil que no contienen `claude`) también se resuelven sin retención de caché, salvo que `cacheRetention` se establezca explícitamente, ya que la familia del modelo no puede inferirse únicamente a partir del ARN.

### OpenRouter

Para las referencias de modelos `openrouter/anthropic/*`, OpenClaw inserta marcadores `cache_control` de Anthropic en los bloques de prompts del sistema/desarrollador, pero solo cuando la solicitud sigue dirigida a una ruta de OpenRouter verificada (`openrouter` en su punto de conexión predeterminado, o cualquier proveedor/URL base que se resuelva como `openrouter.ai`). Redirigir el modelo a una URL de proxy arbitraria compatible con OpenAI detiene esta inserción.

`contextPruning.mode: "cache-ttl"` se permite para las referencias de modelos `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` y `openrouter/zai/*`, porque estas rutas gestionan el almacenamiento en caché de prompts del lado del proveedor sin necesitar los marcadores insertados por OpenClaw.

Fuente: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

La creación de la caché de DeepSeek en OpenRouter se realiza con el mejor esfuerzo y puede tardar unos segundos; una solicitud de seguimiento inmediata aún puede mostrar `cached_tokens: 0`. Compruébelo con una solicitud repetida con el mismo prefijo después de una breve espera, utilizando `usage.prompt_tokens_details.cached_tokens` como señal de acierto de caché.

### Google Gemini (API directa)

- El transporte directo de Gemini (`api: "google-generative-ai"`) informa de los aciertos de caché mediante `cachedContentTokenCount` del servicio de origen, que se asigna a `cacheRead`.
- Familias de modelos aptas: `gemini-2.5*` y `gemini-3*` (se excluyen las variantes Live/de vista previa que no coincidan con ese prefijo; por ejemplo, `gemini-live-2.5-flash-preview`).
- Cuando `cacheRetention` se establece en un modelo apto, OpenClaw crea, reutiliza y actualiza automáticamente un recurso `cachedContents` para el prompt del sistema; no se necesita ningún identificador manual de contenido almacenado en caché. El TTL es `300s` para `cacheRetention: "short"` y `3600s` para `"long"`.
- También se puede proporcionar un identificador preexistente de contenido almacenado en caché de Gemini mediante `params.cachedContent` (o el antiguo `params.cached_content`); un identificador explícito omite por completo la ruta de gestión automática de la caché.
- Esto es independiente del almacenamiento en caché de prefijos de prompts de Anthropic/OpenAI: OpenClaw gestiona un recurso `cachedContents` nativo del proveedor para Gemini en lugar de insertar marcadores de caché en línea.

Fuente: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### Proveedores mediante arnés de CLI (Claude Code, Gemini CLI)

Los backends de CLI que emiten eventos de uso JSONL (`jsonlDialect: "claude-stream-json"` o `"gemini-stream-json"`) pasan por un analizador de uso compartido que reconoce diversas variantes de nombres de campos, incluido un contador simple `cached` que se asigna a `cacheRead`. Cuando la carga útil JSON de la CLI omite un campo directo de tokens de entrada, OpenClaw lo calcula como `input_tokens - cached`. Esto solo normaliza el uso; no crea marcadores de caché de prompts al estilo de Anthropic/OpenAI para estos modelos controlados mediante CLI.

Fuente: `src/agents/cli-output.ts` (`toCliUsage`).

### Otros proveedores

Si un proveedor no admite ninguno de los modos de caché anteriores, `cacheRetention` no tiene ningún efecto.

## Límite de caché del prompt del sistema

OpenClaw divide el prompt del sistema en un **prefijo estable** y un **sufijo variable** mediante un límite interno de prefijo de caché. El contenido situado por encima del límite (definiciones de herramientas, metadatos de Skills y archivos del espacio de trabajo) se ordena para que permanezca idéntico byte por byte entre turnos. El contenido situado por debajo del límite (por ejemplo, `HEARTBEAT.md`, marcas de tiempo de ejecución y otros metadatos por turno) puede cambiar sin invalidar el prefijo almacenado en caché.

Decisiones de diseño principales:

- Los archivos estables del contexto del proyecto en el espacio de trabajo se ordenan antes de `HEARTBEAT.md`, para que la actividad de Heartbeat no invalide el prefijo estable.
- El límite se aplica al procesamiento de transportes de la familia Anthropic, la familia OpenAI, Google y CLI, para que todos los proveedores compatibles se beneficien de la misma estabilidad del prefijo.
- Las solicitudes de Codex Responses y Anthropic Vertex se enrutan mediante un procesamiento de caché que tiene en cuenta el límite, para que la reutilización de la caché se mantenga alineada con lo que los proveedores reciben realmente.
- Las huellas digitales del prompt del sistema se normalizan (espacios en blanco, finales de línea, contexto añadido por enlaces y orden de capacidades en tiempo de ejecución) para que los prompts sin cambios semánticos compartan la caché entre turnos.

Si se observan picos inesperados de `cacheWrite` después de un cambio en la configuración o el espacio de trabajo, compruebe si el cambio queda por encima o por debajo del límite de caché. Mover el contenido variable por debajo del límite (o estabilizarlo) suele resolver el problema.

## Medidas de protección de OpenClaw para la estabilidad de la caché

- Los catálogos de herramientas MCP incluidos se ordenan de forma determinista (primero por nombre del servidor y después por nombre de la herramienta) antes del registro de herramientas, para que los cambios en el orden de `listTools()` no alteren el bloque de herramientas ni invaliden los prefijos de caché de los prompts.
- Las sesiones antiguas con bloques de imágenes persistentes mantienen intactos los **3 turnos completados más recientes** (se cuentan todos los turnos completados, no solo los que contienen imágenes). Los bloques de imágenes más antiguos que ya se hayan procesado se sustituyen por un marcador de texto, para que los seguimientos con muchas imágenes no sigan reenviando cargas útiles obsoletas de gran tamaño.

## Patrones de ajuste

### Tráfico mixto (valor predeterminado recomendado)

Mantenga una base de larga duración en el agente principal y deshabilite el almacenamiento en caché en los agentes de notificación con actividad en ráfagas:

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

### Configuración base que prioriza el coste

- Establezca `cacheRetention: "short"` como configuración base.
- Habilite `contextPruning.mode: "cache-ttl"`.
- Mantenga Heartbeat por debajo del TTL únicamente para los agentes que se beneficien de cachés activas.

## Pruebas de regresión en entornos activos

OpenClaw ejecuta una única comprobación combinada de regresión de caché en un entorno activo que abarca prefijos repetidos, turnos de herramientas, turnos con imágenes, transcripciones de herramientas al estilo de MCP y un control de Anthropic sin caché.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Ejecútela con:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

El archivo de referencia almacena las cifras en vivo observadas más recientemente, además de los mínimos de regresión específicos de cada proveedor con los que se compara la prueba. Cada ejecución utiliza identificadores de sesión y espacios de nombres de prompts nuevos para esa ejecución, de modo que el estado anterior de la caché no contamine la muestra actual. Anthropic y OpenAI aplican criterios diferentes: no alcanzar un mínimo de Anthropic constituye una regresión grave (la prueba falla), mientras que no alcanzar un mínimo de OpenAI solo se supervisa (se registra como advertencia y la ejecución no falla). No comparten un único umbral común entre proveedores.

### Expectativas en vivo de Anthropic

- Se esperan escrituras explícitas de calentamiento mediante `cacheWrite`.
- Se espera una reutilización casi completa del historial en turnos repetidos, porque el control de caché de Anthropic desplaza el punto de interrupción de la caché a lo largo de la conversación.
- Los mínimos de referencia para los carriles estable, de herramientas, de imágenes y de estilo MCP son barreras estrictas contra regresiones.

### Expectativas en vivo de OpenAI

- Se espera únicamente `cacheRead`; `cacheWrite` permanece en `0` en Chat Completions.
- La reutilización de la caché en turnos repetidos debe tratarse como una meseta específica del proveedor, no como una reutilización móvil del historial completo al estilo de Anthropic.
- Los mínimos solo se supervisan (un incumplimiento se registra como advertencia, no como un fallo de la prueba) y se derivan del comportamiento en vivo observado en `gpt-5.4-mini`:

| Escenario                   | Mínimo de `cacheRead` | Mínimo de tasa de aciertos |
| --------------------------- | ----------------------------: | -------------------------: |
| Prefijo estable             |                         4,608 |                       0.90 |
| Transcripción de herramienta |                         4,096 |                       0.85 |
| Transcripción de imagen     |                         3,840 |                       0.82 |
| Transcripción de estilo MCP |                         4,096 |                       0.85 |

Las cifras de referencia observadas más recientemente (de `live-cache-regression-baseline.ts`) fueron: prefijo estable `cacheRead=4864`, tasa de aciertos `0.966`; transcripción de herramienta `cacheRead=4608`, tasa de aciertos `0.896`; transcripción de imagen `cacheRead=4864`, tasa de aciertos `0.954`; transcripción de estilo MCP `cacheRead=4608`, tasa de aciertos `0.891`.

Motivo por el que las aserciones difieren: Anthropic expone puntos de interrupción explícitos de la caché y una reutilización móvil del historial de conversación, mientras que el prefijo efectivamente reutilizable de OpenAI en el tráfico en vivo puede estabilizarse antes de abarcar el prompt completo. Comparar ambos proveedores con un único umbral porcentual común entre proveedores produce regresiones falsas.

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

| Clave             | Valor predeterminado                          |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### Variables de entorno (depuración puntual)

| Variable                             | Efecto                                            |
| ------------------------------------ | ------------------------------------------------- |
| `OPENCLAW_CACHE_TRACE=1`             | Activa el seguimiento de la caché                 |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | Reemplaza la ruta de salida                       |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Activa o desactiva la captura de la carga útil completa de los mensajes |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | Activa o desactiva la captura del texto del prompt |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Activa o desactiva la captura del prompt del sistema |

### Qué inspeccionar

- Los eventos de seguimiento de la caché están en formato JSONL y contienen instantáneas por etapas como `session:loaded`, `prompt:before`, `stream:context` y `session:after`.
- El impacto por turno en los tokens de caché es visible en las superficies habituales de uso: `cacheRead` y `cacheWrite` aparecen en `/usage tokens`, `/status`, los resúmenes de uso de las sesiones y los diseños personalizados de `messages.usageTemplate`.
- Para Anthropic, se esperan tanto `cacheRead` como `cacheWrite` cuando la caché está activa.
- Para OpenAI, se espera `cacheRead` cuando hay aciertos de caché; `cacheWrite` solo se rellena en las cargas útiles de Responses API que lo incluyen (consulte [OpenAI](#openai-direct-api) más arriba).
- OpenAI también devuelve encabezados de seguimiento y de límite de solicitudes como `x-request-id`, `openai-processing-ms` y `x-ratelimit-*`; utilícelos para hacer el seguimiento de las solicitudes, pero la contabilización de los aciertos de caché debe seguir procediendo de la carga útil de uso, no de los encabezados.

## Solución rápida de problemas

- **Valor alto de `cacheWrite` en la mayoría de los turnos**: compruebe si hay entradas volátiles en el prompt del sistema; verifique que el modelo o proveedor admita la configuración de caché.
- **Valor alto de `cacheWrite` en Anthropic**: suele significar que el punto de interrupción de la caché recae sobre contenido que cambia con cada solicitud.
- **Valor bajo de `cacheRead` de OpenAI**: verifique que el prefijo estable esté al principio, que el prefijo repetido tenga al menos 1024 tokens y que se reutilice el mismo `prompt_cache_key` en los turnos que deben compartir una caché.
- **`cacheRetention` no tiene efecto**: confirme que la clave del modelo coincida con `agents.defaults.models["provider/model"]`.
- **Solicitudes de Bedrock Nova con configuración de caché**: es el comportamiento esperado; estas se resuelven sin retención de caché durante la ejecución.

Documentación relacionada:

- [Anthropic](/es/providers/anthropic)
- [Uso y costes de tokens](/es/reference/token-use)
- [Depuración de sesiones](/es/concepts/session-pruning)
- [Referencia de configuración del Gateway](/es/gateway/configuration-reference)

## Contenido relacionado

- [Uso y costes de tokens](/es/reference/token-use)
- [Uso y costes de la API](/es/reference/api-usage-costs)
