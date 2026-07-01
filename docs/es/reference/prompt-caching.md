---
read_when:
    - Quieres reducir los costos de tokens del prompt con retención de caché
    - Necesitas comportamiento de caché por agente en configuraciones multiagente
    - Estás ajustando Heartbeat y la depuración de cache-ttl conjuntamente
summary: Parámetros de caché de prompts, orden de fusión, comportamiento del proveedor y patrones de ajuste
title: Almacenamiento en caché de prompts
x-i18n:
    generated_at: "2026-07-01T18:07:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3189cc734bbee14236e6303aca99aca512732989ffd01612ae635608a2471e60
    source_path: reference/prompt-caching.md
    workflow: 16
---

El almacenamiento en caché de prompts significa que el proveedor de modelos puede reutilizar prefijos de prompt sin cambios (normalmente instrucciones de sistema/desarrollador y otro contexto estable) entre turnos en lugar de volver a procesarlos cada vez. OpenClaw normaliza el uso del proveedor en `cacheRead` y `cacheWrite` cuando la API ascendente expone esos contadores directamente.

Las superficies de estado también pueden recuperar contadores de caché del registro de uso de la transcripción más reciente cuando faltan en la instantánea de la sesión en vivo, de modo que `/status` pueda seguir mostrando una línea de caché tras la pérdida parcial de metadatos de sesión. Los valores de caché en vivo no nulos existentes siguen teniendo prioridad sobre los valores de reserva de la transcripción.

Por qué importa: menor costo de tokens, respuestas más rápidas y rendimiento más predecible para sesiones de larga duración. Sin caché, los prompts repetidos pagan el costo completo del prompt en cada turno, incluso cuando la mayor parte de la entrada no cambió.

Las secciones siguientes cubren cada control relacionado con caché que afecta la reutilización de prompts y el costo de tokens.

Referencias de proveedores:

- Almacenamiento en caché de prompts de Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Almacenamiento en caché de prompts de OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Encabezados de API e IDs de solicitud de OpenAI: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- IDs de solicitud y errores de Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Controles principales

### `cacheRetention` (valor global predeterminado, modelo y por agente)

Establezca la retención de caché como valor global predeterminado para todos los modelos:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Sobrescriba por modelo:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Sobrescritura por agente:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Orden de combinación de configuración:

1. `agents.defaults.params` (valor global predeterminado — se aplica a todos los modelos)
2. `agents.defaults.models["provider/model"].params` (sobrescritura por modelo)
3. `agents.list[].params` (id de agente coincidente; sobrescribe por clave)

### `contextPruning.mode: "cache-ttl"`

Poda el contexto antiguo de resultados de herramientas después de las ventanas TTL de caché para que las solicitudes posteriores a un período de inactividad no vuelvan a almacenar en caché un historial sobredimensionado.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Consulte [Poda de sesiones](/es/concepts/session-pruning) para ver el comportamiento completo.

### Heartbeat para mantener caliente

Heartbeat puede mantener calientes las ventanas de caché y reducir escrituras de caché repetidas después de pausas de inactividad.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat por agente es compatible en `agents.list[].heartbeat`.

## Comportamiento del proveedor

### Anthropic (API directa)

- `cacheRetention` es compatible.
- Con perfiles de autenticación por clave de API de Anthropic, OpenClaw inicializa `cacheRetention: "short"` para referencias de modelo Anthropic cuando no está definido.
- Las respuestas nativas de Messages de Anthropic exponen tanto `cache_read_input_tokens` como `cache_creation_input_tokens`, por lo que OpenClaw puede mostrar tanto `cacheRead` como `cacheWrite`.
- Para solicitudes nativas de Anthropic, `cacheRetention: "short"` se asigna a la caché efímera predeterminada de 5 minutos, y `cacheRetention: "long"` se actualiza al TTL de 1 hora solo en hosts directos de `api.anthropic.com`.

### OpenAI (API directa)

- El almacenamiento en caché de prompts es automático en modelos recientes compatibles. OpenClaw no necesita inyectar marcadores de caché a nivel de bloque.
- OpenClaw usa `prompt_cache_key` para mantener estable el enrutamiento de caché entre turnos. Los hosts directos de OpenAI usan `prompt_cache_retention: "24h"` cuando se selecciona `cacheRetention: "long"`.
- Los proveedores de Completions compatibles con OpenAI reciben `prompt_cache_key` solo cuando su configuración de modelo establece explícitamente `compat.supportsPromptCacheKey: true`. El reenvío de retención larga es una capacidad separada: `cacheRetention: "long"` explícito envía `prompt_cache_retention: "24h"` solo cuando esa entrada de compatibilidad también admite retención larga de caché. Proveedores como Mistral pueden optar por claves de caché mientras establecen `compat.supportsLongCacheRetention: false` para suprimir el campo de retención larga. `cacheRetention: "none"` suprime ambos campos.
- Las respuestas de OpenAI exponen tokens de prompt en caché mediante `usage.prompt_tokens_details.cached_tokens` (o `input_tokens_details.cached_tokens` en eventos de Responses API). OpenClaw lo asigna a `cacheRead`.
- El uso de Responses de GPT-5.6 también puede exponer `input_tokens_details.cache_write_tokens`. OpenClaw lo asigna a `cacheWrite` y lo tarifa según la tasa de escritura de caché del modelo; las Responses que omiten el campo mantienen `cacheWrite` en `0`.
- OpenAI devuelve encabezados útiles de trazabilidad y límite de tasa, como `x-request-id`, `openai-processing-ms` y `x-ratelimit-*`, pero la contabilización de aciertos de caché debe provenir de la carga útil de uso, no de los encabezados.
- En la práctica, OpenAI suele comportarse como una caché de prefijo inicial, en lugar de una reutilización de historial completo móvil al estilo de Anthropic. Los turnos de texto con prefijos largos estables pueden quedar cerca de una meseta de `4864` tokens en caché en las sondas en vivo actuales, mientras que las transcripciones con muchas herramientas o estilo MCP suelen estabilizarse cerca de `4608` tokens en caché incluso en repeticiones exactas.

### Anthropic Vertex

- Los modelos Anthropic en Vertex AI (`anthropic-vertex/*`) admiten `cacheRetention` de la misma manera que Anthropic directo.
- `cacheRetention: "long"` se asigna al TTL real de 1 hora de caché de prompts en endpoints de Vertex AI.
- La retención de caché predeterminada para `anthropic-vertex` coincide con los valores predeterminados de Anthropic directo.
- Las solicitudes de Vertex se enrutan mediante conformado de caché consciente de límites para que la reutilización de caché permanezca alineada con lo que los proveedores reciben realmente.

### Amazon Bedrock

- Las referencias de modelo Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) admiten el paso explícito de `cacheRetention`.
- Los modelos Bedrock que no son de Anthropic se fuerzan a `cacheRetention: "none"` en tiempo de ejecución.

### Modelos OpenRouter

Para referencias de modelo `openrouter/anthropic/*`, OpenClaw inyecta `cache_control` de Anthropic en bloques de prompt de sistema/desarrollador para mejorar la reutilización de la caché de prompts solo cuando la solicitud aún apunta a una ruta verificada de OpenRouter (`openrouter` en su endpoint predeterminado, o cualquier proveedor/URL base que resuelva a `openrouter.ai`).

Para referencias de modelo `openrouter/deepseek/*`, `openrouter/moonshot*/*` y `openrouter/zai/*`, se permite `contextPruning.mode: "cache-ttl"` porque OpenRouter gestiona automáticamente el almacenamiento en caché de prompts del lado del proveedor. OpenClaw no inyecta marcadores `cache_control` de Anthropic en esas solicitudes.

La construcción de caché de DeepSeek es de mejor esfuerzo y puede tardar unos segundos. Un seguimiento inmediato aún puede mostrar `cached_tokens: 0`; verifique con una solicitud repetida con el mismo prefijo tras una breve espera y use `usage.prompt_tokens_details.cached_tokens` como señal de acierto de caché.

Si redirige el modelo a una URL de proxy arbitraria compatible con OpenAI, OpenClaw deja de inyectar esos marcadores de caché de Anthropic específicos de OpenRouter.

### Otros proveedores

Si el proveedor no admite este modo de caché, `cacheRetention` no tiene efecto.

### API directa de Google Gemini

- El transporte directo de Gemini (`api: "google-generative-ai"`) informa aciertos de caché mediante el `cachedContentTokenCount` ascendente; OpenClaw lo asigna a `cacheRead`.
- Cuando se establece `cacheRetention` en un modelo directo de Gemini, OpenClaw crea, reutiliza y actualiza automáticamente recursos `cachedContents` para prompts de sistema en ejecuciones de Google AI Studio. Esto significa que ya no necesita crear previamente un identificador de contenido en caché de forma manual.
- Aún puede pasar un identificador de contenido en caché de Gemini preexistente como `params.cachedContent` (o el legado `params.cached_content`) en el modelo configurado.
- Esto es independiente del almacenamiento en caché de prefijos de prompt de Anthropic/OpenAI. Para Gemini, OpenClaw administra un recurso nativo del proveedor `cachedContents` en lugar de inyectar marcadores de caché en la solicitud.

### Uso de Gemini CLI

- La salida `stream-json` de Gemini CLI puede exponer aciertos de caché mediante `stats.cached`; OpenClaw lo asigna a `cacheRead`. Las sobrescrituras heredadas de `--output-format json` usan la misma normalización de uso.
- Si la CLI omite un valor directo de `stats.input`, OpenClaw deriva los tokens de entrada de `stats.input_tokens - stats.cached`.
- Esto es solo normalización de uso. No significa que OpenClaw esté creando marcadores de caché de prompts al estilo Anthropic/OpenAI para Gemini CLI.

## Límite de caché del prompt de sistema

OpenClaw divide el prompt de sistema en un **prefijo estable** y un **sufijo volátil** separados por un límite interno de prefijo de caché. El contenido por encima del límite (definiciones de herramientas, metadatos de Skills, archivos del espacio de trabajo y otro contexto relativamente estático) se ordena para que permanezca idéntico byte a byte entre turnos. El contenido por debajo del límite (por ejemplo, `HEARTBEAT.md`, marcas de tiempo de ejecución y otros metadatos por turno) puede cambiar sin invalidar el prefijo en caché.

Decisiones clave de diseño:

- Los archivos estables de contexto de proyecto del espacio de trabajo se ordenan antes de `HEARTBEAT.md` para que los cambios frecuentes de Heartbeat no rompan el prefijo estable.
- El límite se aplica en el conformado de transporte de las familias Anthropic, OpenAI, Google y CLI para que todos los proveedores compatibles se beneficien de la misma estabilidad de prefijo.
- Las solicitudes de Codex Responses y Anthropic Vertex se enrutan mediante conformado de caché consciente de límites para que la reutilización de caché permanezca alineada con lo que los proveedores reciben realmente.
- Las huellas del prompt de sistema se normalizan (espacios en blanco, finales de línea, contexto añadido por hooks, ordenamiento de capacidades de ejecución) para que prompts semánticamente sin cambios compartan KV/caché entre turnos.

Si observa picos inesperados de `cacheWrite` después de un cambio de configuración o del espacio de trabajo, compruebe si el cambio queda por encima o por debajo del límite de caché. Mover el contenido volátil por debajo del límite (o estabilizarlo) suele resolver el problema.

## Guardas de estabilidad de caché de OpenClaw

OpenClaw también mantiene deterministas varias formas de carga útil sensibles a caché antes de que la solicitud llegue al proveedor:

- Los catálogos de herramientas MCP del paquete se ordenan de forma determinista antes del registro de herramientas, de modo que los cambios de orden de `listTools()` no alteren el bloque de herramientas ni rompan los prefijos de caché de prompts.
- Las sesiones heredadas con bloques de imagen persistidos mantienen intactos los **3 turnos completados más recientes**; los bloques de imagen más antiguos ya procesados pueden reemplazarse con un marcador para que los seguimientos con muchas imágenes no sigan reenviando cargas útiles obsoletas grandes.

## Patrones de ajuste

### Tráfico mixto (valor predeterminado recomendado)

Mantenga una línea base de larga duración en su agente principal, desactive el almacenamiento en caché en agentes de notificación con ráfagas:

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

### Línea base orientada a costo

- Establezca la línea base `cacheRetention: "short"`.
- Habilite `contextPruning.mode: "cache-ttl"`.
- Mantenga Heartbeat por debajo de su TTL solo para agentes que se benefician de cachés calientes.

## Diagnósticos de caché

OpenClaw expone diagnósticos dedicados de trazas de caché para ejecuciones de agentes integrados.

Para diagnósticos normales orientados al usuario, `/status` y otros resúmenes de uso pueden usar la última entrada de uso de la transcripción como fuente de reserva para `cacheRead` / `cacheWrite` cuando la entrada de sesión en vivo no tiene esos contadores.

## Pruebas de regresión en vivo

OpenClaw mantiene una puerta combinada de regresión de caché en vivo para prefijos repetidos, turnos de herramientas, turnos de imágenes, transcripciones de herramientas estilo MCP y un control sin caché de Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Ejecute la puerta en vivo acotada con:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

El archivo de referencia almacena las cifras en vivo observadas más recientes, además de los pisos de regresión específicos del proveedor que usa la prueba.
El ejecutor también usa IDs de sesión y espacios de nombres de prompts nuevos por ejecución para que el estado de caché anterior no contamine la muestra de regresión actual.

Estas pruebas intencionalmente no usan criterios de éxito idénticos entre proveedores.

### Expectativas en vivo de Anthropic

- Espera escrituras de calentamiento explícitas mediante `cacheWrite`.
- Espera una reutilización de historial casi completa en turnos repetidos porque el control de caché de Anthropic avanza el punto de corte de caché a través de la conversación.
- Las aserciones en vivo actuales todavía usan umbrales de tasa de aciertos altos para las rutas estable, de herramienta y de imagen.

### Expectativas en vivo de OpenAI

- Espera solo `cacheRead`. `cacheWrite` permanece en `0`.
- Trata la reutilización de caché en turnos repetidos como una meseta específica del proveedor, no como reutilización móvil de historial completo al estilo de Anthropic.
- Las aserciones en vivo actuales usan comprobaciones de piso conservadoras derivadas del comportamiento en vivo observado en `gpt-5.4-mini`:
  - prefijo estable: `cacheRead >= 4608`, tasa de aciertos `>= 0.90`
  - transcripción de herramienta: `cacheRead >= 4096`, tasa de aciertos `>= 0.85`
  - transcripción de imagen: `cacheRead >= 3840`, tasa de aciertos `>= 0.82`
  - transcripción estilo MCP: `cacheRead >= 4096`, tasa de aciertos `>= 0.85`

La verificación en vivo combinada reciente del 2026-04-04 llegó a:

- prefijo estable: `cacheRead=4864`, tasa de aciertos `0.966`
- transcripción de herramienta: `cacheRead=4608`, tasa de aciertos `0.896`
- transcripción de imagen: `cacheRead=4864`, tasa de aciertos `0.954`
- transcripción estilo MCP: `cacheRead=4608`, tasa de aciertos `0.891`

El tiempo reciente local de reloj de pared para la puerta combinada fue de aproximadamente `88s`.

Por qué difieren las aserciones:

- Anthropic expone puntos de corte de caché explícitos y reutilización móvil del historial de conversación.
- El almacenamiento en caché de prompts de OpenAI sigue siendo sensible al prefijo exacto, pero el prefijo reutilizable efectivo en el tráfico en vivo de Responses puede alcanzar una meseta antes que el prompt completo.
- Por eso, comparar Anthropic y OpenAI con un único umbral porcentual entre proveedores crea regresiones falsas.

### Configuración de `diagnostics.cacheTrace`

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

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Conmutadores de entorno (depuración puntual)

- `OPENCLAW_CACHE_TRACE=1` habilita el rastreo de caché.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` sobrescribe la ruta de salida.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` conmuta la captura de la carga útil completa de mensajes.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` conmuta la captura del texto del prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` conmuta la captura del prompt del sistema.

### Qué inspeccionar

- Los eventos de rastreo de caché son JSONL e incluyen instantáneas por etapas como `session:loaded`, `prompt:before`, `stream:context` y `session:after`.
- El impacto de tokens de caché por turno es visible en las superficies de uso normales mediante `cacheRead` y `cacheWrite` (por ejemplo, `/usage tokens`, `/status`, resúmenes de uso de sesión y diseños personalizados de `messages.usageTemplate`).
- Para Anthropic, espera tanto `cacheRead` como `cacheWrite` cuando el almacenamiento en caché está activo.
- Para OpenAI, espera `cacheRead` en aciertos de caché. GPT-5.6 Responses también puede informar `cacheWrite` mientras se escriben segmentos de prompt; otras cargas útiles de Responses que omiten el contador de escritura lo mantienen en `0`.
- Si necesitas rastreo de solicitudes, registra los IDs de solicitud y los encabezados de límite de tasa por separado de las métricas de caché. La salida actual de rastreo de caché de OpenClaw se centra en la forma del prompt/sesión y el uso normalizado de tokens, no en los encabezados sin procesar de respuesta del proveedor.

## Solución rápida de problemas

- `cacheWrite` alto en la mayoría de los turnos: comprueba si hay entradas volátiles del prompt del sistema y verifica que el modelo/proveedor admita tu configuración de caché.
- `cacheWrite` alto en Anthropic: a menudo significa que el punto de corte de caché está cayendo en contenido que cambia en cada solicitud.
- `cacheRead` bajo en OpenAI: verifica que el prefijo estable esté al principio, que el prefijo repetido tenga al menos 1024 tokens y que el mismo `prompt_cache_key` se reutilice para turnos que deberían compartir una caché.
- Sin efecto de `cacheRetention`: confirma que la clave del modelo coincida con `agents.defaults.models["provider/model"]`.
- Solicitudes de Bedrock Nova/Mistral con configuración de caché: se espera que el runtime fuerce a `none`.

Documentos relacionados:

- [Anthropic](/es/providers/anthropic)
- [Uso de tokens y costos](/es/reference/token-use)
- [Poda de sesión](/es/concepts/session-pruning)
- [Referencia de configuración de Gateway](/es/gateway/configuration-reference)

## Relacionado

- [Uso de tokens y costos](/es/reference/token-use)
- [Uso de API y costos](/es/reference/api-usage-costs)
