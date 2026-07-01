---
read_when:
    - Quieres reducir los costos de tokens de prompt con retención de caché
    - Necesitas comportamiento de caché por agente en configuraciones multiagente
    - Estás ajustando juntos el heartbeat y la depuración de cache-ttl.
summary: Perillas de caché de prompts, orden de combinación, comportamiento del proveedor y patrones de ajuste
title: Almacenamiento en caché de prompts
x-i18n:
    generated_at: "2026-07-01T07:51:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dbbc46d5f726ae5e9b3bb51af0d271e49df768bc93de6e13b4c87519f0fca5c3
    source_path: reference/prompt-caching.md
    workflow: 16
---

El almacenamiento en caché de prompts significa que el proveedor del modelo puede reutilizar prefijos de prompt sin cambios (normalmente instrucciones del sistema/desarrollador y otro contexto estable) entre turnos en lugar de reprocesarlos cada vez. OpenClaw normaliza el uso del proveedor en `cacheRead` y `cacheWrite` cuando la API ascendente expone esos contadores directamente.

Las superficies de estado también pueden recuperar contadores de caché del registro
de uso de la transcripción más reciente cuando la instantánea de sesión en vivo no los incluye, de modo que `/status` pueda seguir
mostrando una línea de caché tras una pérdida parcial de metadatos de sesión. Los valores de caché en vivo existentes distintos de cero
siguen teniendo prioridad sobre los valores de reserva de la transcripción.

Por qué importa: menor costo en tokens, respuestas más rápidas y rendimiento más predecible para sesiones de larga duración. Sin caché, los prompts repetidos pagan el costo completo del prompt en cada turno, incluso cuando la mayor parte de la entrada no cambió.

Las secciones siguientes cubren todos los controles relacionados con la caché que afectan la reutilización de prompts y el costo de tokens.

Referencias de proveedores:

- Almacenamiento en caché de prompts de Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Almacenamiento en caché de prompts de OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Encabezados de API e IDs de solicitud de OpenAI: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- IDs de solicitud y errores de Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Controles principales

### `cacheRetention` (valor predeterminado global, modelo y por agente)

Establece la retención de caché como valor predeterminado global para todos los modelos:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Sobrescritura por modelo:

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

1. `agents.defaults.params` (valor predeterminado global — se aplica a todos los modelos)
2. `agents.defaults.models["provider/model"].params` (sobrescritura por modelo)
3. `agents.list[].params` (id de agente coincidente; sobrescribe por clave)

### `contextPruning.mode: "cache-ttl"`

Recorta el contexto antiguo de resultados de herramientas después de las ventanas TTL de caché para que las solicitudes posteriores a inactividad no vuelvan a almacenar en caché un historial sobredimensionado.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Consulta [Recorte de sesiones](/es/concepts/session-pruning) para ver el comportamiento completo.

### Heartbeat para mantener la caché caliente

Heartbeat puede mantener calientes las ventanas de caché y reducir escrituras de caché repetidas tras intervalos de inactividad.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat por agente se admite en `agents.list[].heartbeat`.

## Comportamiento del proveedor

### Anthropic (API directa)

- `cacheRetention` es compatible.
- Con perfiles de autenticación por clave de API de Anthropic, OpenClaw inicializa `cacheRetention: "short"` para referencias de modelos Anthropic cuando no está definido.
- Las respuestas nativas de Messages de Anthropic exponen tanto `cache_read_input_tokens` como `cache_creation_input_tokens`, por lo que OpenClaw puede mostrar tanto `cacheRead` como `cacheWrite`.
- Para solicitudes nativas de Anthropic, `cacheRetention: "short"` se asigna a la caché efímera predeterminada de 5 minutos, y `cacheRetention: "long"` se actualiza al TTL de 1 hora solo en hosts directos `api.anthropic.com`.

### OpenAI (API directa)

- El almacenamiento en caché de prompts es automático en modelos recientes compatibles. OpenClaw no necesita inyectar marcadores de caché a nivel de bloque.
- OpenClaw usa `prompt_cache_key` para mantener estable el enrutamiento de caché entre turnos. Los hosts directos de OpenAI usan `prompt_cache_retention: "24h"` cuando se selecciona `cacheRetention: "long"`.
- Los proveedores de Completions compatibles con OpenAI reciben `prompt_cache_key` solo cuando su configuración de modelo establece explícitamente `compat.supportsPromptCacheKey: true`. El reenvío de retención larga es una capacidad separada: `cacheRetention: "long"` explícito envía `prompt_cache_retention: "24h"` solo cuando esa entrada de compatibilidad también admite retención larga de caché. Proveedores como Mistral pueden optar por claves de caché mientras establecen `compat.supportsLongCacheRetention: false` para suprimir el campo de retención larga. `cacheRetention: "none"` suprime ambos campos.
- Las respuestas de OpenAI exponen tokens de prompt almacenados en caché mediante `usage.prompt_tokens_details.cached_tokens` (o `input_tokens_details.cached_tokens` en eventos de la Responses API). OpenClaw lo asigna a `cacheRead`.
- El uso de GPT-5.6 Responses también puede exponer `input_tokens_details.cache_write_tokens`. OpenClaw lo asigna a `cacheWrite` y le pone precio según la tarifa de escritura de caché del modelo; las Responses que omiten el campo mantienen `cacheWrite` en `0`.
- OpenAI devuelve encabezados útiles de trazabilidad y límite de tasa como `x-request-id`, `openai-processing-ms` y `x-ratelimit-*`, pero la contabilidad de aciertos de caché debe provenir de la carga útil de uso, no de los encabezados.
- En la práctica, OpenAI a menudo se comporta como una caché de prefijo inicial en lugar de una reutilización de historial completo móvil al estilo Anthropic. Los turnos de texto con prefijos largos estables pueden acercarse a una meseta de `4864` tokens almacenados en caché en las pruebas en vivo actuales, mientras que las transcripciones con muchas herramientas o de estilo MCP suelen estabilizarse cerca de `4608` tokens almacenados en caché incluso en repeticiones exactas.

### Anthropic Vertex

- Los modelos Anthropic en Vertex AI (`anthropic-vertex/*`) admiten `cacheRetention` del mismo modo que Anthropic directo.
- `cacheRetention: "long"` se asigna al TTL real de 1 hora de la caché de prompts en endpoints de Vertex AI.
- La retención de caché predeterminada para `anthropic-vertex` coincide con los valores predeterminados de Anthropic directo.
- Las solicitudes de Vertex se enrutan mediante conformación de caché consciente de límites para que la reutilización de caché permanezca alineada con lo que los proveedores reciben realmente.

### Amazon Bedrock

- Las referencias de modelos Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) admiten paso explícito de `cacheRetention`.
- Los modelos de Bedrock que no sean Anthropic se fuerzan a `cacheRetention: "none"` en tiempo de ejecución.

### Modelos OpenRouter

Para referencias de modelos `openrouter/anthropic/*`, OpenClaw inyecta
`cache_control` de Anthropic en bloques de prompt de sistema/desarrollador para mejorar la reutilización
de la caché de prompts solo cuando la solicitud sigue apuntando a una ruta OpenRouter verificada
(`openrouter` en su endpoint predeterminado, o cualquier proveedor/URL base que resuelva
a `openrouter.ai`).

Para referencias de modelos `openrouter/deepseek/*`, `openrouter/moonshot*/*` y `openrouter/zai/*`,
se permite `contextPruning.mode: "cache-ttl"` porque OpenRouter
gestiona automáticamente el almacenamiento en caché de prompts del lado del proveedor. OpenClaw no inyecta
marcadores `cache_control` de Anthropic en esas solicitudes.

La construcción de caché de DeepSeek es de mejor esfuerzo y puede tardar unos segundos. Un
seguimiento inmediato todavía puede mostrar `cached_tokens: 0`; verifica con una solicitud repetida
con el mismo prefijo tras un breve retraso y usa `usage.prompt_tokens_details.cached_tokens`
como señal de acierto de caché.

Si rediriges el modelo a una URL proxy arbitraria compatible con OpenAI, OpenClaw
deja de inyectar esos marcadores de caché Anthropic específicos de OpenRouter.

### Otros proveedores

Si el proveedor no admite este modo de caché, `cacheRetention` no tiene efecto.

### API directa de Google Gemini

- El transporte directo de Gemini (`api: "google-generative-ai"`) informa aciertos de caché
  mediante el `cachedContentTokenCount` ascendente; OpenClaw lo asigna a `cacheRead`.
- Cuando `cacheRetention` se establece en un modelo Gemini directo, OpenClaw crea, reutiliza y actualiza automáticamente recursos `cachedContents` para prompts de sistema
  en ejecuciones de Google AI Studio. Esto significa que ya no necesitas crear previamente un
  identificador de contenido en caché manualmente.
- Aún puedes pasar un identificador de contenido en caché de Gemini preexistente como
  `params.cachedContent` (o el legado `params.cached_content`) en el modelo
  configurado.
- Esto es independiente del almacenamiento en caché de prefijos de prompt de Anthropic/OpenAI. Para Gemini,
  OpenClaw gestiona un recurso `cachedContents` nativo del proveedor en lugar de
  inyectar marcadores de caché en la solicitud.

### Uso de Gemini CLI

- La salida `stream-json` de Gemini CLI puede exponer aciertos de caché mediante `stats.cached`;
  OpenClaw lo asigna a `cacheRead`. Las sobrescrituras heredadas de `--output-format json` usan
  la misma normalización de uso.
- Si la CLI omite un valor directo `stats.input`, OpenClaw deriva los tokens de entrada
  de `stats.input_tokens - stats.cached`.
- Esto solo es normalización de uso. No significa que OpenClaw esté creando
  marcadores de caché de prompts al estilo Anthropic/OpenAI para Gemini CLI.

## Límite de caché del prompt del sistema

OpenClaw divide el prompt del sistema en un **prefijo estable** y un **sufijo
volátil** separados por un límite interno de prefijo de caché. El contenido por encima del
límite (definiciones de herramientas, metadatos de Skills, archivos del espacio de trabajo y otro
contexto relativamente estático) se ordena para que permanezca idéntico byte a byte entre turnos.
El contenido por debajo del límite (por ejemplo `HEARTBEAT.md`, marcas de tiempo de ejecución y
otros metadatos por turno) puede cambiar sin invalidar el prefijo almacenado en caché.

Decisiones clave de diseño:

- Los archivos estables de contexto de proyecto del espacio de trabajo se ordenan antes de `HEARTBEAT.md` para que
  los cambios de Heartbeat no rompan el prefijo estable.
- El límite se aplica en conformación de transporte de las familias Anthropic, OpenAI, Google y
  CLI para que todos los proveedores compatibles se beneficien de la misma estabilidad de prefijo.
- Las solicitudes de Codex Responses y Anthropic Vertex se enrutan mediante
  conformación de caché consciente de límites para que la reutilización de caché permanezca alineada con lo que los proveedores
  reciben realmente.
- Las huellas digitales del prompt del sistema se normalizan (espacios en blanco, finales de línea,
  contexto agregado por hooks, ordenación de capacidades de ejecución) para que los prompts semánticamente sin cambios
  compartan KV/caché entre turnos.

Si ves picos inesperados de `cacheWrite` después de un cambio de configuración o del espacio de trabajo,
comprueba si el cambio queda por encima o por debajo del límite de caché. Mover
contenido volátil por debajo del límite (o estabilizarlo) suele resolver el
problema.

## Guardas de estabilidad de caché de OpenClaw

OpenClaw también mantiene deterministas varias formas de cargas útiles sensibles a la caché antes de que
la solicitud llegue al proveedor:

- Los catálogos de herramientas MCP del paquete se ordenan determinísticamente antes del registro
  de herramientas, de modo que los cambios de orden de `listTools()` no alteren el bloque de herramientas ni
  rompan los prefijos de caché de prompts.
- Las sesiones heredadas con bloques de imagen persistidos mantienen intactos los **3 turnos completados
  más recientes**; los bloques de imagen ya procesados más antiguos pueden
  reemplazarse con un marcador para que los seguimientos con muchas imágenes no sigan reenviando cargas útiles obsoletas grandes.

## Patrones de ajuste

### Tráfico mixto (valor predeterminado recomendado)

Mantén una línea base de larga duración en tu agente principal y desactiva la caché en agentes notificadores con ráfagas:

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

- Establece la línea base `cacheRetention: "short"`.
- Activa `contextPruning.mode: "cache-ttl"`.
- Mantén Heartbeat por debajo de tu TTL solo para agentes que se beneficien de cachés calientes.

## Diagnóstico de caché

OpenClaw expone diagnósticos dedicados de trazas de caché para ejecuciones de agentes integradas.

Para diagnósticos normales orientados al usuario, `/status` y otros resúmenes de uso pueden usar
la entrada de uso de transcripción más reciente como fuente de reserva para `cacheRead` /
`cacheWrite` cuando la entrada de sesión en vivo no tiene esos contadores.

## Pruebas de regresión en vivo

OpenClaw mantiene una compuerta combinada de regresión de caché en vivo para prefijos repetidos, turnos de herramientas, turnos de imagen, transcripciones de herramientas de estilo MCP y un control Anthropic sin caché.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Ejecuta la compuerta estrecha en vivo con:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

El archivo de referencia almacena los números en vivo observados más recientes, además de los umbrales mínimos de regresión específicos del proveedor que usa la prueba.
El ejecutor también usa IDs de sesión y espacios de nombres de prompt nuevos en cada ejecución para que el estado previo de la caché no contamine la muestra de regresión actual.

Estas pruebas intencionalmente no usan criterios de éxito idénticos entre proveedores.

### Expectativas en vivo de Anthropic

- Se esperan escrituras de calentamiento explícitas mediante `cacheWrite`.
- Se espera una reutilización de historial casi completa en turnos repetidos porque el control de caché de Anthropic avanza el punto de corte de la caché a través de la conversación.
- Las aserciones en vivo actuales aún usan umbrales de alta tasa de aciertos para rutas estables, de herramientas y de imágenes.

### Expectativas en vivo de OpenAI

- Se espera solo `cacheRead`. `cacheWrite` permanece en `0`.
- Trata la reutilización de caché en turnos repetidos como una meseta específica del proveedor, no como una reutilización móvil de historial completo al estilo de Anthropic.
- Las aserciones en vivo actuales usan comprobaciones de umbral mínimo conservadoras derivadas del comportamiento en vivo observado en `gpt-5.4-mini`:
  - prefijo estable: `cacheRead >= 4608`, tasa de aciertos `>= 0.90`
  - transcripción de herramienta: `cacheRead >= 4096`, tasa de aciertos `>= 0.85`
  - transcripción de imagen: `cacheRead >= 3840`, tasa de aciertos `>= 0.82`
  - transcripción de estilo MCP: `cacheRead >= 4096`, tasa de aciertos `>= 0.85`

La verificación en vivo combinada nueva del 2026-04-04 llegó a:

- prefijo estable: `cacheRead=4864`, tasa de aciertos `0.966`
- transcripción de herramienta: `cacheRead=4608`, tasa de aciertos `0.896`
- transcripción de imagen: `cacheRead=4864`, tasa de aciertos `0.954`
- transcripción de estilo MCP: `cacheRead=4608`, tasa de aciertos `0.891`

El tiempo de reloj local reciente para la puerta combinada fue de aproximadamente `88s`.

Por qué difieren las aserciones:

- Anthropic expone puntos de corte de caché explícitos y reutilización móvil del historial de conversación.
- La caché de prompts de OpenAI sigue siendo sensible al prefijo exacto, pero el prefijo reutilizable efectivo en tráfico en vivo de Responses puede alcanzar una meseta antes que el prompt completo.
- Por eso, comparar Anthropic y OpenAI con un único umbral porcentual entre proveedores genera regresiones falsas.

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
- El impacto por turno de tokens de caché es visible en las superficies de uso normales mediante `cacheRead` y `cacheWrite` (por ejemplo, `/usage full` y los resúmenes de uso de sesión).
- Para Anthropic, espera tanto `cacheRead` como `cacheWrite` cuando la caché está activa.
- Para OpenAI, espera `cacheRead` en aciertos de caché. GPT-5.6 Responses también puede informar `cacheWrite` mientras se escriben segmentos de prompt; otras cargas útiles de Responses que omiten el contador de escritura lo mantienen en `0`.
- Si necesitas rastreo de solicitudes, registra los IDs de solicitud y los encabezados de límite de tasa por separado de las métricas de caché. La salida actual de rastreo de caché de OpenClaw se centra en la forma del prompt/sesión y en el uso normalizado de tokens, no en encabezados sin procesar de respuestas del proveedor.

## Resolución rápida de problemas

- `cacheWrite` alto en la mayoría de los turnos: revisa si hay entradas volátiles del prompt del sistema y verifica que el modelo/proveedor admita tu configuración de caché.
- `cacheWrite` alto en Anthropic: a menudo significa que el punto de corte de la caché está cayendo en contenido que cambia en cada solicitud.
- `cacheRead` bajo en OpenAI: verifica que el prefijo estable esté al inicio, que el prefijo repetido tenga al menos 1024 tokens y que se reutilice el mismo `prompt_cache_key` en los turnos que deberían compartir una caché.
- Sin efecto de `cacheRetention`: confirma que la clave del modelo coincida con `agents.defaults.models["provider/model"]`.
- Solicitudes de Bedrock Nova/Mistral con configuración de caché: se espera que el runtime fuerce `none`.

Documentos relacionados:

- [Anthropic](/es/providers/anthropic)
- [Uso de tokens y costos](/es/reference/token-use)
- [Poda de sesión](/es/concepts/session-pruning)
- [Referencia de configuración de Gateway](/es/gateway/configuration-reference)

## Relacionado

- [Uso de tokens y costos](/es/reference/token-use)
- [Uso y costos de la API](/es/reference/api-usage-costs)
