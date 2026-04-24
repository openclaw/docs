---
read_when:
    - Quieres reducir los costos de tokens de prompts con retención de caché
    - Necesitas comportamiento de caché por agente en configuraciones multiagente
    - Estás ajustando Heartbeat y la poda de cache-ttl conjuntamente
summary: Controles de caché de prompts, orden de fusión, comportamiento del proveedor y patrones de ajuste
title: Caché de prompts
x-i18n:
    generated_at: "2026-04-24T05:48:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534a5648db39dae0979bd8b84263f83332fbaa2dc2c0675409c307fa991c7c8
    source_path: reference/prompt-caching.md
    workflow: 15
---

El almacenamiento en caché de prompts significa que el proveedor del modelo puede reutilizar prefijos de prompt sin cambios (normalmente instrucciones de system/developer y otro contexto estable) entre turnos en lugar de reprocesarlos cada vez. OpenClaw normaliza el uso del proveedor en `cacheRead` y `cacheWrite` cuando la API ascendente expone directamente esos contadores.

Las superficies de estado también pueden recuperar contadores de caché del registro de uso más reciente de la transcripción
cuando la instantánea de sesión en vivo no los tiene, de modo que `/status` pueda seguir
mostrando una línea de caché después de una pérdida parcial de metadatos de sesión. Los valores existentes no nulos de caché en vivo siguen teniendo prioridad sobre los valores de reserva de la transcripción.

Por qué importa: menor costo de tokens, respuestas más rápidas y un rendimiento más predecible para sesiones de larga duración. Sin caché, los prompts repetidos pagan el costo completo del prompt en cada turno incluso cuando la mayor parte de la entrada no ha cambiado.

Esta página cubre todos los controles relacionados con la caché que afectan a la reutilización del prompt y al costo de tokens.

Referencias de proveedores:

- Caché de prompts de Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Caché de prompts de OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Encabezados de API y ID de solicitud de OpenAI: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- ID de solicitud y errores de Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Controles principales

### `cacheRetention` (valor predeterminado global, por modelo y por agente)

Establece la retención de caché como valor predeterminado global para todos los modelos:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Anula por modelo:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Anulación por agente:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Orden de fusión de configuración:

1. `agents.defaults.params` (valor predeterminado global — se aplica a todos los modelos)
2. `agents.defaults.models["provider/model"].params` (anulación por modelo)
3. `agents.list[].params` (id de agente coincidente; anula por clave)

### `contextPruning.mode: "cache-ttl"`

Poda el contexto antiguo de resultados de herramientas después de ventanas TTL de caché para que las solicitudes tras periodos de inactividad no vuelvan a almacenar en caché historial sobredimensionado.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Consulta [Poda de sesión](/es/concepts/session-pruning) para ver el comportamiento completo.

### Mantenimiento en caliente con Heartbeat

Heartbeat puede mantener calientes las ventanas de caché y reducir escrituras repetidas en caché tras periodos de inactividad.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Se admite Heartbeat por agente en `agents.list[].heartbeat`.

## Comportamiento del proveedor

### Anthropic (API directa)

- `cacheRetention` es compatible.
- Con perfiles de autenticación por clave API de Anthropic, OpenClaw inicializa `cacheRetention: "short"` para referencias de modelo Anthropic cuando no está establecido.
- Las respuestas nativas de Anthropic Messages exponen tanto `cache_read_input_tokens` como `cache_creation_input_tokens`, por lo que OpenClaw puede mostrar tanto `cacheRead` como `cacheWrite`.
- Para solicitudes nativas de Anthropic, `cacheRetention: "short"` se asigna a la caché efímera predeterminada de 5 minutos y `cacheRetention: "long"` se eleva al TTL de 1 hora solo en hosts directos `api.anthropic.com`.

### OpenAI (API directa)

- El almacenamiento en caché de prompts es automático en modelos recientes compatibles. OpenClaw no necesita inyectar marcadores de caché a nivel de bloque.
- OpenClaw usa `prompt_cache_key` para mantener estable el enrutamiento de caché entre turnos y usa `prompt_cache_retention: "24h"` solo cuando se selecciona `cacheRetention: "long"` en hosts directos de OpenAI.
- Las respuestas de OpenAI exponen tokens de prompt almacenados en caché mediante `usage.prompt_tokens_details.cached_tokens` (o `input_tokens_details.cached_tokens` en eventos de la API Responses). OpenClaw lo asigna a `cacheRead`.
- OpenAI no expone un contador separado de tokens escritos en caché, así que `cacheWrite` permanece en `0` en rutas OpenAI incluso cuando el proveedor está calentando una caché.
- OpenAI devuelve encabezados útiles de trazado y límite de tasa como `x-request-id`, `openai-processing-ms` y `x-ratelimit-*`, pero la contabilidad de aciertos de caché debe venir de la carga útil de uso, no de los encabezados.
- En la práctica, OpenAI suele comportarse como una caché de prefijo inicial en lugar de una reutilización de historial completo en movimiento al estilo Anthropic. Los turnos de texto estable con prefijos largos pueden alcanzar un plateau cercano a `4864` tokens almacenados en caché en sondeos en vivo actuales, mientras que las transcripciones pesadas en herramientas o de estilo MCP a menudo alcanzan un plateau cercano a `4608` tokens almacenados en caché incluso en repeticiones exactas.

### Anthropic Vertex

- Los modelos Anthropic en Vertex AI (`anthropic-vertex/*`) admiten `cacheRetention` igual que Anthropic directo.
- `cacheRetention: "long"` se asigna al TTL real de caché de prompt de 1 hora en endpoints de Vertex AI.
- La retención de caché predeterminada para `anthropic-vertex` coincide con los valores predeterminados directos de Anthropic.
- Las solicitudes de Vertex se enrutan mediante conformación de caché con conocimiento de límites para que la reutilización de caché siga alineada con lo que realmente reciben los proveedores.

### Amazon Bedrock

- Las referencias de modelo Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) admiten passthrough explícito de `cacheRetention`.
- Los modelos Bedrock no Anthropic se fuerzan a `cacheRetention: "none"` en tiempo de ejecución.

### Modelos Anthropic de OpenRouter

Para referencias de modelo `openrouter/anthropic/*`, OpenClaw inyecta
`cache_control` de Anthropic en bloques de prompt system/developer para mejorar la reutilización
de la caché de prompt solo cuando la solicitud sigue apuntando a una ruta verificada de OpenRouter
(`openrouter` en su endpoint predeterminado, o cualquier provider/base URL que se resuelva
a `openrouter.ai`).

Si vuelves a apuntar el modelo a una URL de proxy arbitraria compatible con OpenAI, OpenClaw
deja de inyectar esos marcadores de caché de Anthropic específicos de OpenRouter.

### Otros proveedores

Si el proveedor no admite este modo de caché, `cacheRetention` no tiene efecto.

### API directa de Google Gemini

- El transporte directo de Gemini (`api: "google-generative-ai"`) informa de aciertos de caché
  mediante `cachedContentTokenCount` ascendente; OpenClaw lo asigna a `cacheRead`.
- Cuando se establece `cacheRetention` en un modelo directo de Gemini, OpenClaw automáticamente
  crea, reutiliza y actualiza recursos `cachedContents` para system prompts
  en ejecuciones de Google AI Studio. Esto significa que ya no necesitas precrear
  manualmente un identificador de contenido en caché.
- Aún puedes pasar un identificador existente de contenido en caché de Gemini mediante
  `params.cachedContent` (o el heredado `params.cached_content`) en el modelo configurado.
- Esto es independiente del almacenamiento en caché de prefijo de prompt de Anthropic/OpenAI. Para Gemini,
  OpenClaw gestiona un recurso `cachedContents` nativo del proveedor en lugar de
  inyectar marcadores de caché en la solicitud.

### Uso JSON de Gemini CLI

- La salida JSON de Gemini CLI también puede mostrar aciertos de caché mediante `stats.cached`;
  OpenClaw lo asigna a `cacheRead`.
- Si la CLI omite un valor directo `stats.input`, OpenClaw deriva los tokens de entrada
  de `stats.input_tokens - stats.cached`.
- Esto es solo normalización de uso. No significa que OpenClaw esté creando
  marcadores de caché de prompt estilo Anthropic/OpenAI para Gemini CLI.

## Límite de caché del system prompt

OpenClaw divide el system prompt en un **prefijo estable** y un **sufijo
volátil** separados por un límite interno de prefijo de caché. El contenido por encima del
límite (definiciones de herramientas, metadatos de Skills, archivos del espacio de trabajo y otro
contexto relativamente estático) se ordena para permanecer idéntico byte a byte entre turnos.
El contenido por debajo del límite (por ejemplo `HEARTBEAT.md`, marcas de tiempo en tiempo de ejecución y
otros metadatos por turno) puede cambiar sin invalidar el prefijo
almacenado en caché.

Decisiones clave de diseño:

- Los archivos estables de contexto de proyecto del espacio de trabajo se ordenan antes de `HEARTBEAT.md`, de modo
  que el churn de Heartbeat no invalide el prefijo estable.
- El límite se aplica a través de Anthropic-family, OpenAI-family, Google y conformación de transporte CLI para que todos los proveedores compatibles se beneficien de la misma estabilidad de prefijo.
- Las solicitudes de Codex Responses y Anthropic Vertex se enrutan mediante
  conformación de caché con conocimiento de límites para que la reutilización de caché siga alineada con lo que realmente reciben los proveedores.
- Las huellas del system prompt se normalizan (espacios, finales de línea,
  contexto añadido por hooks, orden de capacidades de tiempo de ejecución) para que prompts semánticamente invariables compartan KV/caché entre turnos.

Si ves picos inesperados de `cacheWrite` tras un cambio de configuración o del espacio de trabajo,
comprueba si el cambio cae por encima o por debajo del límite de caché. Mover
contenido volátil por debajo del límite (o estabilizarlo) suele resolver el
problema.

## Protecciones de estabilidad de caché de OpenClaw

OpenClaw también mantiene deterministas varias formas de cargas útiles sensibles a la caché antes
de que la solicitud llegue al proveedor:

- Los catálogos de herramientas MCP agrupados se ordenan de forma determinista antes del
  registro de herramientas, para que los cambios de orden en `listTools()` no alteren el bloque de herramientas ni invaliden los prefijos de caché del prompt.
- Las sesiones heredadas con bloques de imagen persistidos mantienen intactos los **3 turnos completos
  más recientes**; los bloques de imagen más antiguos ya procesados pueden
  sustituirse por un marcador para que seguimientos pesados en imágenes no sigan reenviando grandes
  cargas útiles obsoletas.

## Patrones de ajuste

### Tráfico mixto (predeterminado recomendado)

Mantén una línea base de larga duración en tu agente principal y desactiva el almacenamiento en caché en agentes notificadores de ráfagas:

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

- Establece una línea base `cacheRetention: "short"`.
- Habilita `contextPruning.mode: "cache-ttl"`.
- Mantén Heartbeat por debajo de tu TTL solo para agentes que se beneficien de cachés calientes.

## Diagnósticos de caché

OpenClaw expone diagnósticos dedicados de rastreo de caché para ejecuciones incrustadas de agentes.

Para diagnósticos normales visibles para el usuario, `/status` y otros resúmenes de uso pueden usar
la última entrada de uso de la transcripción como fuente de reserva para `cacheRead` /
`cacheWrite` cuando la entrada de sesión en vivo no tiene esos contadores.

## Pruebas de regresión en vivo

OpenClaw mantiene una única puerta combinada de regresión de caché en vivo para prefijos repetidos, turnos de herramientas, turnos de imagen, transcripciones de herramientas estilo MCP y un control sin caché de Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Ejecuta la puerta estrecha en vivo con:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

El archivo de línea base almacena los números observados en vivo más recientes junto con los umbrales mínimos de regresión específicos del proveedor usados por la prueba.
El ejecutor también usa identificadores de sesión nuevos por ejecución y espacios de nombres de prompt para que el estado previo de caché no contamine la muestra actual de regresión.

Estas pruebas intencionadamente no usan criterios idénticos de éxito en todos los proveedores.

### Expectativas en vivo de Anthropic

- Espera escrituras explícitas de calentamiento mediante `cacheWrite`.
- Espera reutilización casi completa del historial en turnos repetidos porque el control de caché de Anthropic avanza el punto de ruptura de caché a través de la conversación.
- Las aserciones actuales en vivo siguen usando umbrales altos de tasa de aciertos para rutas estables, de herramientas y de imagen.

### Expectativas en vivo de OpenAI

- Espera solo `cacheRead`. `cacheWrite` permanece en `0`.
- Trata la reutilización de caché en turnos repetidos como un plateau específico del proveedor, no como reutilización de historial completo en movimiento al estilo Anthropic.
- Las aserciones actuales en vivo usan comprobaciones conservadoras de mínimos derivadas del comportamiento observado en vivo en `gpt-5.4-mini`:
  - prefijo estable: `cacheRead >= 4608`, tasa de aciertos `>= 0.90`
  - transcripción de herramientas: `cacheRead >= 4096`, tasa de aciertos `>= 0.85`
  - transcripción de imagen: `cacheRead >= 3840`, tasa de aciertos `>= 0.82`
  - transcripción estilo MCP: `cacheRead >= 4096`, tasa de aciertos `>= 0.85`

La verificación combinada en vivo más reciente del 2026-04-04 obtuvo:

- prefijo estable: `cacheRead=4864`, tasa de aciertos `0.966`
- transcripción de herramientas: `cacheRead=4608`, tasa de aciertos `0.896`
- transcripción de imagen: `cacheRead=4864`, tasa de aciertos `0.954`
- transcripción estilo MCP: `cacheRead=4608`, tasa de aciertos `0.891`

El tiempo reciente de reloj local para la puerta combinada fue de unos `88s`.

Por qué difieren las aserciones:

- Anthropic expone puntos de ruptura explícitos de caché y reutilización móvil del historial de conversación.
- El almacenamiento en caché de prompts de OpenAI sigue siendo sensible al prefijo exacto, pero el prefijo reutilizable efectivo en tráfico Responses en vivo puede alcanzar un plateau antes que el prompt completo.
- Por eso, comparar Anthropic y OpenAI con un único umbral porcentual entre proveedores crea falsas regresiones.

### Configuración `diagnostics.cacheTrace`

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

### Interruptores de entorno (depuración puntual)

- `OPENCLAW_CACHE_TRACE=1` habilita el rastreo de caché.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` anula la ruta de salida.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` activa o desactiva la captura completa de la carga útil de mensajes.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` activa o desactiva la captura del texto del prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` activa o desactiva la captura del system prompt.

### Qué inspeccionar

- Los eventos de rastreo de caché son JSONL e incluyen instantáneas por etapas como `session:loaded`, `prompt:before`, `stream:context` y `session:after`.
- El impacto por turno de los tokens de caché es visible en superficies normales de uso mediante `cacheRead` y `cacheWrite` (por ejemplo `/usage full` y resúmenes de uso de sesión).
- Para Anthropic, espera tanto `cacheRead` como `cacheWrite` cuando el almacenamiento en caché esté activo.
- Para OpenAI, espera `cacheRead` en aciertos de caché y que `cacheWrite` permanezca en `0`; OpenAI no publica un campo separado de tokens escritos en caché.
- Si necesitas trazado de solicitudes, registra ID de solicitud y encabezados de límite de tasa por separado de las métricas de caché. La salida actual de rastreo de caché de OpenClaw está centrada en la forma del prompt/sesión y el uso normalizado de tokens, no en encabezados sin procesar de respuesta del proveedor.

## Solución rápida de problemas

- `cacheWrite` alto en la mayoría de turnos: revisa entradas volátiles del system prompt y verifica que el modelo/proveedor sea compatible con tu configuración de caché.
- `cacheWrite` alto en Anthropic: suele significar que el punto de ruptura de caché está cayendo sobre contenido que cambia en cada solicitud.
- `cacheRead` bajo en OpenAI: verifica que el prefijo estable esté al principio, que el prefijo repetido tenga al menos 1024 tokens y que se reutilice la misma `prompt_cache_key` para turnos que deban compartir una caché.
- Sin efecto de `cacheRetention`: confirma que la clave del modelo coincide con `agents.defaults.models["provider/model"]`.
- Solicitudes Bedrock Nova/Mistral con configuración de caché: se espera forzado en tiempo de ejecución a `none`.

Documentación relacionada:

- [Anthropic](/es/providers/anthropic)
- [Uso de tokens y costos](/es/reference/token-use)
- [Poda de sesión](/es/concepts/session-pruning)
- [Referencia de configuración de Gateway](/es/gateway/configuration-reference)

## Relacionado

- [Uso de tokens y costos](/es/reference/token-use)
- [Uso y costos de API](/es/reference/api-usage-costs)
