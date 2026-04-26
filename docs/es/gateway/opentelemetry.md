---
read_when:
    - Quieres enviar el uso de modelos, el flujo de mensajes o las métricas de sesión de OpenClaw a un recopilador de OpenTelemetry
    - Estás conectando traces, métricas o registros a Grafana, Datadog, Honeycomb, New Relic, Tempo u otro backend OTLP
    - Necesitas los nombres exactos de métricas, los nombres de spans o las formas de atributos para crear paneles o alertas
summary: Exportar diagnósticos de OpenClaw a cualquier recopilador de OpenTelemetry mediante el Plugin diagnostics-otel (OTLP/HTTP)
title: Exportación de OpenTelemetry
x-i18n:
    generated_at: "2026-04-26T11:29:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63fe66de2d046255a0e5b0eee8bbead2c9d278b8911bdc09bfee1e9c59294418
    source_path: gateway/opentelemetry.md
    workflow: 15
---

OpenClaw exporta diagnósticos mediante el Plugin incluido `diagnostics-otel`
usando **OTLP/HTTP (protobuf)**. Cualquier recopilador o backend que acepte OTLP/HTTP
funciona sin cambios de código. Para registros de archivos locales y cómo leerlos, consulta
[Logging](/es/logging).

## Cómo encaja todo

- **Los eventos de diagnóstico** son registros estructurados en proceso emitidos por el
  Gateway y los Plugins incluidos para ejecuciones de modelos, flujo de mensajes, sesiones,
  colas y exec.
- El **Plugin `diagnostics-otel`** se suscribe a esos eventos y los exporta como
  OpenTelemetry **metrics**, **traces** y **logs** mediante OTLP/HTTP.
- Las **llamadas al proveedor** reciben un encabezado W3C `traceparent` desde el
  contexto de span confiable de llamada de modelo de OpenClaw cuando el transporte del proveedor acepta
  encabezados personalizados. El contexto de trace emitido por Plugins no se propaga.
- Los exportadores solo se adjuntan cuando tanto la superficie de diagnósticos como el
  Plugin están habilitados, por lo que el coste en proceso se mantiene casi en cero de forma predeterminada.

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

También puedes habilitar el Plugin desde la CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` actualmente solo admite `http/protobuf`. `grpc` se ignora.
</Note>

## Señales exportadas

| Señal       | Qué incluye                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metrics** | Contadores e histogramas para uso de tokens, coste, duración de ejecución, flujo de mensajes, carriles de colas, estado de sesión, exec y presión de memoria. |
| **Traces**  | Spans para uso de modelos, llamadas de modelos, ciclo de vida del arnés, ejecución de herramientas, exec, procesamiento de Webhook/mensajes, ensamblado de contexto y bucles de herramientas. |
| **Logs**    | Registros estructurados de `logging.file` exportados mediante OTLP cuando `diagnostics.otel.logs` está habilitado.                        |

Activa o desactiva `traces`, `metrics` y `logs` de forma independiente. Los tres se activan de forma predeterminada
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
      protocol: "http/protobuf", // grpc se ignora
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // muestreador de span raíz, 0.0..1.0
      flushIntervalMs: 60000, // intervalo de exportación de métricas (mín. 1000ms)
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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Sobrescribe `diagnostics.otel.endpoint`. Si el valor ya contiene `/v1/traces`, `/v1/metrics` o `/v1/logs`, se usa tal cual.                                                                                                            |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Sobrescrituras de endpoint específicas de señal usadas cuando la clave de configuración coincidente `diagnostics.otel.*Endpoint` no está establecida. La configuración específica de señal prevalece sobre la variable de entorno específica de señal, que a su vez prevalece sobre el endpoint compartido. |
| `OTEL_SERVICE_NAME`                                                                                               | Sobrescribe `diagnostics.otel.serviceName`.                                                                                                                                                                                                 |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Sobrescribe el protocolo de transporte (hoy solo se respeta `http/protobuf`).                                                                                                                                                              |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Establécela en `gen_ai_latest_experimental` para emitir el atributo experimental más reciente de span GenAI (`gen_ai.provider.name`) en lugar del heredado `gen_ai.system`. Las métricas GenAI siempre usan atributos semánticos acotados y de baja cardinalidad. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Establécela en `1` cuando otra precarga u otro proceso host ya haya registrado el SDK global de OpenTelemetry. Entonces el Plugin omite su propio ciclo de vida de NodeSDK pero sigue conectando listeners de diagnóstico y respeta `traces`/`metrics`/`logs`. |

## Privacidad y captura de contenido

El contenido bruto de modelo/herramienta **no** se exporta de forma predeterminada. Los spans llevan
identificadores acotados (canal, proveedor, modelo, categoría de error, ids de solicitud solo con hash)
y nunca incluyen texto del prompt, texto de la respuesta, entradas de herramientas, salidas de herramientas ni
claves de sesión.

Las solicitudes salientes del modelo pueden incluir un encabezado W3C `traceparent`. Ese encabezado
se genera solo a partir del contexto de trace de diagnóstico propiedad de OpenClaw para la llamada de modelo
activa. Los encabezados `traceparent` proporcionados previamente por el llamador se reemplazan, de modo que los Plugins o
las opciones personalizadas del proveedor no pueden falsear ascendencia de trace entre servicios.

Establece `diagnostics.otel.captureContent.*` en `true` solo cuando tu recopilador y
tu política de retención estén aprobados para texto de prompt, respuesta, herramienta o prompt del sistema.
Cada subclave es optativa e independiente:

- `inputMessages` — contenido del prompt del usuario.
- `outputMessages` — contenido de la respuesta del modelo.
- `toolInputs` — cargas útiles de argumentos de herramientas.
- `toolOutputs` — cargas útiles de resultados de herramientas.
- `systemPrompt` — prompt ensamblado del sistema/desarrollador.

Cuando cualquier subclave está habilitada, los spans de modelo y herramientas reciben atributos
`openclaw.content.*` acotados y redactados solo para esa clase.

## Muestreo y vaciado

- **Traces:** `diagnostics.otel.sampleRate` (solo span raíz, `0.0` descarta todo,
  `1.0` conserva todo).
- **Metrics:** `diagnostics.otel.flushIntervalMs` (mínimo `1000`).
- **Logs:** los logs OTLP respetan `logging.level` (nivel de registro de archivo). La
  redacción de consola **no** se aplica a los logs OTLP. Las instalaciones de gran volumen deberían
  preferir el muestreo/filtrado del recopilador OTLP frente al muestreo local.

## Métricas exportadas

### Uso de modelos

- `openclaw.tokens` (contador, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (contador, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histograma, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histograma, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histograma, métrica de convenciones semánticas GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histograma, segundos, métrica de convenciones semánticas GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` opcional)

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

### Internos de diagnósticos (memoria y bucle de herramientas)

- `openclaw.memory.heap_used_bytes` (histograma, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histograma)
- `openclaw.memory.pressure` (contador, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (contador, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histograma, attrs: `openclaw.toolName`, `openclaw.outcome`)

## Spans exportados

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` de forma predeterminada, o `gen_ai.provider.name` cuando se habilitan las convenciones semánticas GenAI más recientes
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` de forma predeterminada, o `gen_ai.provider.name` cuando se habilitan las convenciones semánticas GenAI más recientes
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
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
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (sin mensajes de bucle, params ni salida de herramientas)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Cuando la captura de contenido se habilita explícitamente, los spans de modelo y herramientas también pueden
incluir atributos `openclaw.content.*` acotados y redactados para las clases
de contenido específicas que hayas activado.

## Catálogo de eventos de diagnóstico

Los eventos siguientes respaldan las métricas y spans anteriores. Los Plugins también pueden suscribirse
directamente a ellos sin exportación OTLP.

**Uso de modelos**

- `model.usage` — tokens, coste, duración, contexto, proveedor/modelo/canal,
  ids de sesión. `usage` es la contabilidad del proveedor/turno para coste y telemetría;
  `context.used` es la instantánea actual del prompt/contexto y puede ser menor que
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

**Ciclo de vida del arnés**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  ciclo de vida por ejecución del arnés del agente. Incluye `harnessId`, `pluginId`
  opcional, proveedor/modelo/canal e id de ejecución. La finalización añade
  `durationMs`, `outcome`, `resultClassification` opcional, `yieldDetected`
  y recuentos de `itemLifecycle`. Los errores añaden `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` y
  `cleanupFailed` opcional.

**Exec**

- `exec.process.completed` — resultado terminal, duración, destino, modo, código
  de salida y tipo de fallo. El texto del comando y los directorios de trabajo no se
  incluyen.

## Sin un exportador

Puedes mantener los eventos de diagnóstico disponibles para Plugins o sinks personalizados sin
ejecutar `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Para una salida de depuración específica sin aumentar `logging.level`, usa flags de
diagnóstico. Las flags no distinguen mayúsculas/minúsculas y admiten comodines (p. ej. `telegram.*` o
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

O como anulación puntual por variable de entorno:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

La salida de flags va al archivo de registro estándar (`logging.file`) y sigue
redactándose mediante `logging.redactSensitive`. Guía completa:
[Flags de diagnóstico](/es/diagnostics/flags).

## Desactivar

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

También puedes dejar `diagnostics-otel` fuera de `plugins.allow`, o ejecutar
`openclaw plugins disable diagnostics-otel`.

## Relacionado

- [Logging](/es/logging) — registros de archivos, salida de consola, seguimiento desde la CLI y la pestaña Logs de Control UI
- [Internos del registro del Gateway](/es/gateway/logging) — estilos de registro WS, prefijos de subsistema y captura de consola
- [Flags de diagnóstico](/es/diagnostics/flags) — flags de registro de depuración específicos
- [Exportación de diagnósticos](/es/gateway/diagnostics) — herramienta de paquete de soporte para operadores (separada de la exportación OTEL)
- [Referencia de configuración](/es/gateway/configuration-reference#diagnostics) — referencia completa de campos `diagnostics.*`
