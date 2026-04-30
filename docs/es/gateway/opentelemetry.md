---
read_when:
    - Desea enviar el uso del modelo, el flujo de mensajes o las métricas de sesión de OpenClaw a un recopilador de OpenTelemetry
    - Estás integrando trazas, métricas o registros en Grafana, Datadog, Honeycomb, New Relic, Tempo u otro backend OTLP
    - Necesitas los nombres exactos de las métricas, los nombres de los spans o las formas de los atributos para crear paneles o alertas
summary: Exporta los diagnósticos de OpenClaw a cualquier colector de OpenTelemetry mediante el Plugin diagnostics-otel (OTLP/HTTP)
title: Exportación de OpenTelemetry
x-i18n:
    generated_at: "2026-04-30T05:43:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9d06589d281223ebb57e76f6f19441d30c138b9f7b0636198ab7bae5fad3c8a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporta diagnósticos mediante el plugin incluido `diagnostics-otel`
usando **OTLP/HTTP (protobuf)**. Cualquier colector o backend que acepte OTLP/HTTP
funciona sin cambios de código. Para registros locales en archivos y cómo leerlos, consulta
[Registro](/es/logging).

## Cómo encaja todo

- Los **eventos de diagnóstico** son registros estructurados en proceso emitidos por el
  Gateway y los plugins incluidos para ejecuciones de modelos, flujo de mensajes, sesiones, colas
  y exec.
- El **plugin `diagnostics-otel`** se suscribe a esos eventos y los exporta como
  **métricas**, **trazas** y **registros** de OpenTelemetry mediante OTLP/HTTP.
- Las **llamadas al proveedor** reciben un encabezado W3C `traceparent` desde el contexto
  de span de llamada a modelo de confianza de OpenClaw cuando el transporte del proveedor acepta
  encabezados personalizados. El contexto de traza emitido por plugins no se propaga.
- Los exportadores solo se adjuntan cuando tanto la superficie de diagnósticos como el plugin están
  habilitados, por lo que el costo en proceso se mantiene cercano a cero de forma predeterminada.

## Inicio rápido

```json5
{
  plugins: {
    allow: ["diagnostics-otel"],
    entries: {
      "diagnostics-otel": { enabled: true },
    },
  },
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      protocol: "http/protobuf",
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2,
      flushIntervalMs: 60000,
    },
  },
}
```

También puedes habilitar el plugin desde la CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
Actualmente `protocol` solo admite `http/protobuf`. `grpc` se ignora.
</Note>

## Señales exportadas

| Señal       | Qué contiene                                                                                                                                 |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Métricas** | Contadores e histogramas para uso de tokens, costo, duración de ejecuciones, flujo de mensajes, carriles de cola, estado de sesión, exec y presión de memoria. |
| **Trazas**  | Spans para uso de modelos, llamadas a modelos, ciclo de vida del arnés, ejecución de herramientas, exec, procesamiento de Webhook/mensajes, ensamblaje de contexto y bucles de herramientas. |
| **Registros** | Registros estructurados `logging.file` exportados mediante OTLP cuando `diagnostics.otel.logs` está habilitado.                              |

Activa o desactiva `traces`, `metrics` y `logs` de forma independiente. Los tres están activados de forma predeterminada
cuando `diagnostics.otel.enabled` es true.

## Referencia de configuración

```json5
{
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      tracesEndpoint: "http://otel-collector:4318/v1/traces",
      metricsEndpoint: "http://otel-collector:4318/v1/metrics",
      logsEndpoint: "http://otel-collector:4318/v1/logs",
      protocol: "http/protobuf", // grpc is ignored
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },
  },
}
```

### Variables de entorno

| Variable                                                                                                          | Propósito                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Sobrescribe `diagnostics.otel.endpoint`. Si el valor ya contiene `/v1/traces`, `/v1/metrics` o `/v1/logs`, se usa tal cual.                                                                                                                |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Sobrescrituras de endpoint específicas de señal usadas cuando la clave de configuración `diagnostics.otel.*Endpoint` correspondiente no está definida. La configuración específica de señal tiene prioridad sobre el entorno específico de señal, que tiene prioridad sobre el endpoint compartido. |
| `OTEL_SERVICE_NAME`                                                                                               | Sobrescribe `diagnostics.otel.serviceName`.                                                                                                                                                                                                |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Sobrescribe el protocolo de conexión (hoy solo se respeta `http/protobuf`).                                                                                                                                                                |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Configúralo en `gen_ai_latest_experimental` para emitir el atributo de span GenAI experimental más reciente (`gen_ai.provider.name`) en lugar del `gen_ai.system` heredado. Las métricas GenAI siempre usan atributos semánticos acotados y de baja cardinalidad. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Configúralo en `1` cuando otra precarga o proceso anfitrión ya haya registrado el SDK global de OpenTelemetry. Entonces el plugin omite su propio ciclo de vida de NodeSDK, pero sigue conectando escuchas de diagnóstico y respeta `traces`/`metrics`/`logs`. |

## Privacidad y captura de contenido

El contenido sin procesar de modelos/herramientas **no** se exporta de forma predeterminada. Los spans llevan
identificadores acotados (canal, proveedor, modelo, categoría de error, ids de solicitud solo con hash)
y nunca incluyen texto de prompts, texto de respuestas, entradas de herramientas, salidas de herramientas ni
claves de sesión.

Las solicitudes salientes a modelos pueden incluir un encabezado W3C `traceparent`. Ese encabezado se
genera solo a partir del contexto de traza de diagnóstico propiedad de OpenClaw para la llamada activa al modelo.
Los encabezados `traceparent` existentes proporcionados por el llamador se reemplazan, por lo que plugins u
opciones personalizadas de proveedor no pueden falsificar la ascendencia de trazas entre servicios.

Configura `diagnostics.otel.captureContent.*` en `true` solo cuando tu colector y
política de retención estén aprobados para texto de prompts, respuestas, herramientas o prompts del sistema.
Cada subclave es de participación explícita independiente:

- `inputMessages` — contenido del prompt del usuario.
- `outputMessages` — contenido de respuesta del modelo.
- `toolInputs` — cargas útiles de argumentos de herramientas.
- `toolOutputs` — cargas útiles de resultados de herramientas.
- `systemPrompt` — prompt de sistema/desarrollador ensamblado.

Cuando cualquier subclave está habilitada, los spans de modelos y herramientas reciben atributos
`openclaw.content.*` acotados y redactados solo para esa clase.

## Muestreo y vaciado

- **Trazas:** `diagnostics.otel.sampleRate` (solo span raíz, `0.0` descarta todo,
  `1.0` conserva todo).
- **Métricas:** `diagnostics.otel.flushIntervalMs` (mínimo `1000`).
- **Registros:** los registros OTLP respetan `logging.level` (nivel de registro de archivo). Usan la
  ruta de redacción de registros de diagnóstico, no el formato de consola. Las instalaciones de alto volumen
  deberían preferir el muestreo/filtrado del colector OTLP frente al muestreo local.
- **Correlación de registros de archivo:** los registros de archivo JSONL incluyen `traceId`,
  `spanId`, `parentSpanId` y `traceFlags` de nivel superior cuando la llamada de registro lleva un contexto
  de traza de diagnóstico válido, lo que permite que los procesadores de registros unan líneas de registro locales con
  spans exportados.
- **Correlación de solicitudes:** las solicitudes HTTP del Gateway y los frames WebSocket crean un
  ámbito interno de traza de solicitud. Los registros y eventos de diagnóstico dentro de ese ámbito
  heredan la traza de la solicitud de forma predeterminada, mientras que los spans de ejecución de agente y llamada a modelo se
  crean como hijos para que los encabezados `traceparent` del proveedor permanezcan en la misma traza.

## Métricas exportadas

### Uso del modelo

- `openclaw.tokens` (contador, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (contador, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histograma, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histograma, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histograma, métrica de convenciones semánticas GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histograma, segundos, métrica de convenciones semánticas GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` opcional)
- `openclaw.model_call.duration_ms` (histograma, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, más `openclaw.errorCategory` y `openclaw.failureKind` en errores clasificados)
- `openclaw.model_call.request_bytes` (histograma, tamaño en bytes UTF-8 de la carga útil final de solicitud al modelo; sin contenido sin procesar de la carga útil)
- `openclaw.model_call.response_bytes` (histograma, tamaño en bytes UTF-8 de eventos de respuesta del modelo transmitidos por streaming; sin contenido sin procesar de respuesta)
- `openclaw.model_call.time_to_first_byte_ms` (histograma, tiempo transcurrido antes del primer evento de respuesta transmitido por streaming)

### Flujo de mensajes

- `openclaw.webhook.received` (contador, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (contador, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histograma, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (contador, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (contador, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histograma, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (contador, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histograma, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Colas y sesiones

- `openclaw.queue.lane.enqueue` (contador, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (contador, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histograma, attrs: `openclaw.lane` o `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histograma, attrs: `openclaw.lane`)
- `openclaw.session.state` (contador, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (contador, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histograma, attrs: `openclaw.state`)
- `openclaw.run.attempt` (contador, attrs: `openclaw.attempt`)

### Ciclo de vida del arnés

- `openclaw.harness.duration_ms` (histograma, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` en errores)

### Exec

- `openclaw.exec.duration_ms` (histograma, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Elementos internos de diagnóstico (memoria y bucle de herramientas)

- `openclaw.memory.heap_used_bytes` (histograma, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histograma)
- `openclaw.memory.pressure` (contador, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (contador, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histograma, attrs: `openclaw.toolName`, `openclaw.outcome`)

## Spans exportados

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` de forma predeterminada, o `gen_ai.provider.name` cuando se activan las convenciones semánticas más recientes de GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` de forma predeterminada, o `gen_ai.provider.name` cuando se activan las convenciones semánticas más recientes de GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` y `openclaw.failureKind` opcional en errores
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (hash acotado basado en SHA del id de solicitud del proveedor upstream; los ids sin procesar no se exportan)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Al completarse: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - En error: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` opcional
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`, `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (sin contenido de prompt, historial, respuesta ni clave de sesión)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (sin mensajes de bucle, parámetros ni salida de herramienta)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Cuando la captura de contenido está habilitada explícitamente, los spans de modelo y herramienta también pueden
incluir atributos `openclaw.content.*` acotados y redactados para las clases
de contenido específicas que activaste.

## Catálogo de eventos de diagnóstico

Los eventos siguientes respaldan las métricas y spans anteriores. Los plugins también pueden suscribirse
a ellos directamente sin exportación OTLP.

**Uso del modelo**

- `model.usage` — tokens, costo, duración, contexto, proveedor/modelo/canal,
  ids de sesión. `usage` es la contabilidad por proveedor/turno para costo y telemetría;
  `context.used` es la instantánea actual de prompt/contexto y puede ser menor que
  `usage.total` del proveedor cuando hay entrada en caché o llamadas de bucle de herramientas implicadas.

**Flujo de mensajes**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Cola y sesión**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` (contadores agregados: Webhooks/cola/sesión)

**Ciclo de vida del harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  ciclo de vida por ejecución para el harness del agente. Incluye `harnessId`, `pluginId`
  opcional, proveedor/modelo/canal e id de ejecución. La finalización añade
  `durationMs`, `outcome`, `resultClassification` opcional, `yieldDetected`,
  y recuentos de `itemLifecycle`. Los errores añaden `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` y
  `cleanupFailed` opcional.

**Exec**

- `exec.process.completed` — resultado de terminal, duración, destino, modo, código
  de salida y tipo de fallo. El texto del comando y los directorios de trabajo no se
  incluyen.

## Sin exportador

Puedes mantener los eventos de diagnóstico disponibles para plugins o sinks personalizados sin
ejecutar `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Para salida de depuración dirigida sin aumentar `logging.level`, usa indicadores de diagnóstico.
Los indicadores no distinguen mayúsculas/minúsculas y admiten comodines (por ejemplo, `telegram.*` o
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

O como sobrescritura puntual de entorno:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

La salida de indicadores va al archivo de registro estándar (`logging.file`) y sigue estando
redactada por `logging.redactSensitive`. Guía completa:
[Indicadores de diagnóstico](/es/diagnostics/flags).

## Deshabilitar

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

También puedes dejar `diagnostics-otel` fuera de `plugins.allow`, o ejecutar
`openclaw plugins disable diagnostics-otel`.

## Relacionado

- [Registro](/es/logging) — registros de archivo, salida de consola, seguimiento desde CLI y la pestaña Registros de Control UI
- [Internos del registro de Gateway](/es/gateway/logging) — estilos de registro WS, prefijos de subsistema y captura de consola
- [Indicadores de diagnóstico](/es/diagnostics/flags) — indicadores de registro de depuración dirigida
- [Exportación de diagnóstico](/es/gateway/diagnostics) — herramienta de paquete de soporte para operadores (separada de la exportación OTEL)
- [Referencia de configuración](/es/gateway/configuration-reference#diagnostics) — referencia completa de campos `diagnostics.*`
