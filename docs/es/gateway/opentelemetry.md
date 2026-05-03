---
read_when:
    - Quieres enviar el uso del modelo, el flujo de mensajes o las métricas de sesión de OpenClaw a un recopilador de OpenTelemetry
    - Estás conectando trazas, métricas o registros a Grafana, Datadog, Honeycomb, New Relic, Tempo u otro backend OTLP
    - Necesitas los nombres exactos de las métricas, los nombres de los spans o las estructuras de los atributos para crear paneles o alertas
summary: Exporta los diagnósticos de OpenClaw a cualquier colector de OpenTelemetry mediante el Plugin diagnostics-otel (OTLP/HTTP)
title: Exportación de OpenTelemetry
x-i18n:
    generated_at: "2026-05-03T21:32:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8091aa633a3e10593681f94913a858587a5dc69d9947e0c0d4132f6e897b00b
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporta diagnósticos mediante el Plugin oficial `diagnostics-otel`
usando **OTLP/HTTP (protobuf)**. Cualquier collector o backend que acepte OTLP/HTTP
funciona sin cambios de código. Para registros de archivo locales y cómo leerlos, consulta
[Registro](/es/logging).

## Cómo encaja todo

- Los **eventos de diagnóstico** son registros estructurados en proceso emitidos por el
  Gateway y los Plugins incluidos para ejecuciones de modelo, flujo de mensajes, sesiones, colas
  y exec.
- El **Plugin `diagnostics-otel`** se suscribe a esos eventos y los exporta como
  **métricas**, **trazas** y **registros** de OpenTelemetry mediante OTLP/HTTP.
- Las **llamadas al proveedor** reciben un encabezado W3C `traceparent` desde el contexto
  de span de llamada a modelo confiable de OpenClaw cuando el transporte del proveedor acepta encabezados
  personalizados. El contexto de traza emitido por el Plugin no se propaga.
- Los exportadores solo se adjuntan cuando tanto la superficie de diagnóstico como el Plugin están
  habilitados, por lo que el costo en proceso se mantiene cercano a cero de forma predeterminada.

## Inicio rápido

Para instalaciones empaquetadas, instala primero el Plugin:

```bash
openclaw plugins install clawhub:@openclaw/diagnostics-otel
```

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
Actualmente, `protocol` solo admite `http/protobuf`. `grpc` se ignora.
</Note>

## Señales exportadas

| Señal       | Qué contiene                                                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Métricas** | Contadores e histogramas para uso de tokens, costo, duración de ejecución, flujo de mensajes, carriles de cola, estado de sesión, exec y presión de memoria. |
| **Trazas**  | Spans para uso de modelo, llamadas a modelo, ciclo de vida del harness, ejecución de herramientas, exec, procesamiento de Webhook/mensajes, ensamblaje de contexto y bucles de herramientas. |
| **Registros** | Registros estructurados `logging.file` exportados mediante OTLP cuando `diagnostics.otel.logs` está habilitado.                                  |

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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Sobrescrituras de endpoint específicas por señal que se usan cuando la clave de configuración `diagnostics.otel.*Endpoint` correspondiente no está definida. La configuración específica por señal prevalece sobre la variable de entorno específica por señal, que prevalece sobre el endpoint compartido. |
| `OTEL_SERVICE_NAME`                                                                                               | Sobrescribe `diagnostics.otel.serviceName`.                                                                                                                                                                                                |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Sobrescribe el protocolo de cableado (hoy solo se respeta `http/protobuf`).                                                                                                                                                                |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Configúralo en `gen_ai_latest_experimental` para emitir el atributo de span GenAI experimental más reciente (`gen_ai.provider.name`) en lugar del `gen_ai.system` heredado. Las métricas GenAI siempre usan atributos semánticos acotados y de baja cardinalidad, de todos modos. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Configúralo en `1` cuando otra precarga o proceso host ya haya registrado el SDK global de OpenTelemetry. El Plugin entonces omite su propio ciclo de vida de NodeSDK, pero sigue conectando listeners de diagnóstico y respetando `traces`/`metrics`/`logs`. |

## Privacidad y captura de contenido

El contenido bruto de modelos/herramientas **no** se exporta de forma predeterminada. Los spans llevan
identificadores acotados (canal, proveedor, modelo, categoría de error, identificadores de solicitud solo con hash)
y nunca incluyen texto de prompt, texto de respuesta, entradas de herramientas, salidas de herramientas ni
claves de sesión.

Las solicitudes salientes a modelos pueden incluir un encabezado W3C `traceparent`. Ese encabezado se
genera solo desde el contexto de traza de diagnóstico propiedad de OpenClaw para la llamada de modelo
activa. Los encabezados `traceparent` existentes proporcionados por el llamador se reemplazan, por lo que los Plugins o
las opciones personalizadas de proveedor no pueden suplantar la ascendencia de trazas entre servicios.

Configura `diagnostics.otel.captureContent.*` en `true` solo cuando tu collector y
tu política de retención estén aprobados para texto de prompt, respuesta, herramienta o prompt del sistema.
Cada subclave requiere aceptación explícita de forma independiente:

- `inputMessages` — contenido del prompt de usuario.
- `outputMessages` — contenido de la respuesta del modelo.
- `toolInputs` — cargas de argumentos de herramientas.
- `toolOutputs` — cargas de resultados de herramientas.
- `systemPrompt` — prompt de sistema/desarrollador ensamblado.

Cuando cualquier subclave está habilitada, los spans de modelo y herramienta reciben atributos acotados y redactados
`openclaw.content.*` solo para esa clase.

## Muestreo y vaciado

- **Trazas:** `diagnostics.otel.sampleRate` (solo root-span, `0.0` descarta todo,
  `1.0` conserva todo).
- **Métricas:** `diagnostics.otel.flushIntervalMs` (mínimo `1000`).
- **Registros:** los registros OTLP respetan `logging.level` (nivel de registro de archivo). Usan la
  ruta de redacción de registros de diagnóstico, no el formato de consola. Las instalaciones
  de alto volumen deberían preferir el muestreo/filtrado del collector OTLP en lugar del muestreo local.
- **Correlación de registros de archivo:** los registros de archivo JSONL incluyen `traceId`,
  `spanId`, `parentSpanId` y `traceFlags` de nivel superior cuando la llamada de registro lleva un contexto
  de traza de diagnóstico válido, lo que permite a los procesadores de registros unir líneas de registro locales con
  spans exportados.
- **Correlación de solicitudes:** las solicitudes HTTP del Gateway y los frames de WebSocket crean un
  ámbito interno de traza de solicitud. Los registros y eventos de diagnóstico dentro de ese ámbito
  heredan la traza de solicitud de forma predeterminada, mientras que los spans de ejecución de agente y de llamada a modelo se
  crean como hijos para que los encabezados `traceparent` del proveedor permanezcan en la misma traza.

## Métricas exportadas

### Uso de modelos

- `openclaw.tokens` (contador, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (contador, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histograma, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histograma, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histograma, métrica de convenciones semánticas GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histograma, segundos, métrica de convenciones semánticas GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` opcional)
- `openclaw.model_call.duration_ms` (histograma, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, más `openclaw.errorCategory` y `openclaw.failureKind` en errores clasificados)
- `openclaw.model_call.request_bytes` (histograma, tamaño en bytes UTF-8 de la carga final de la solicitud al modelo; sin contenido bruto de la carga)
- `openclaw.model_call.response_bytes` (histograma, tamaño en bytes UTF-8 de los eventos de respuesta del modelo transmitidos; sin contenido bruto de la respuesta)
- `openclaw.model_call.time_to_first_byte_ms` (histograma, tiempo transcurrido antes del primer evento de respuesta transmitido)

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
- `openclaw.session.stuck` (contador, attrs: `openclaw.state`; emitido solo para contabilidad de sesiones obsoletas sin trabajo activo)
- `openclaw.session.stuck_age_ms` (histograma, attrs: `openclaw.state`; emitido solo para contabilidad de sesiones obsoletas sin trabajo activo)
- `openclaw.run.attempt` (contador, attrs: `openclaw.attempt`)

### Telemetría de actividad de sesiones

`diagnostics.stuckSessionWarnMs` es el umbral de antigüedad sin progreso para diagnósticos de
actividad de sesiones. Una sesión `processing` no envejece hacia este umbral
mientras OpenClaw observa progreso en respuestas, herramientas, estado, bloques o runtime ACP.
Los keepalives de escritura no se cuentan como progreso, por lo que un modelo o harness silencioso aún puede
detectarse.

OpenClaw clasifica las sesiones por el trabajo que todavía puede observar:

- `session.long_running`: trabajo incrustado activo, llamadas al modelo o llamadas a herramientas
  siguen avanzando.
- `session.stalled`: existe trabajo activo, pero la ejecución activa no ha informado
  progreso reciente. Las ejecuciones incrustadas detenidas permanecen al principio solo en observación, luego
  pasan a abortar y drenar después de al menos 10 minutos y 5x `diagnostics.stuckSessionWarnMs`
  sin progreso para que los turnos en cola detrás del carril puedan reanudarse.
- `session.stuck`: contabilidad de sesión obsoleta sin trabajo activo. Esto libera
  de inmediato el carril de sesión afectado.

Solo `session.stuck` emite el contador `openclaw.session.stuck`, el
histograma `openclaw.session.stuck_age_ms` y el span `openclaw.session.stuck`.
Los diagnósticos repetidos de `session.stuck` aplican retroceso mientras la sesión permanece
sin cambios, por lo que los paneles deben alertar sobre aumentos sostenidos en lugar de cada
tick de Heartbeat. Para el ajuste de configuración y los valores predeterminados, consulta la
[Referencia de configuración](/es/gateway/configuration-reference#diagnostics).

### Ciclo de vida del arnés

- `openclaw.harness.duration_ms` (histograma, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` en errores)

### Exec

- `openclaw.exec.duration_ms` (histograma, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Componentes internos de diagnóstico (memoria y bucle de herramientas)

- `openclaw.memory.heap_used_bytes` (histograma, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histograma)
- `openclaw.memory.pressure` (contador, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (contador, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histograma, attrs: `openclaw.toolName`, `openclaw.outcome`)

## Spans exportados

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` de forma predeterminada, o `gen_ai.provider.name` cuando se habilitan las convenciones semánticas de GenAI más recientes
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` de forma predeterminada, o `gen_ai.provider.name` cuando se habilitan las convenciones semánticas de GenAI más recientes
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` y `openclaw.failureKind` opcional en errores
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (hash acotado basado en SHA del id de solicitud del proveedor ascendente; los ids sin procesar no se exportan)
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (sin prompt, historial, respuesta ni contenido de clave de sesión)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (sin mensajes del bucle, parámetros ni salida de herramienta)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Cuando la captura de contenido está habilitada explícitamente, los spans de modelo y herramienta también pueden
incluir atributos `openclaw.content.*` acotados y redactados para las clases de
contenido específicas por las que optaste.

## Catálogo de eventos de diagnóstico

Los eventos siguientes respaldan las métricas y los spans anteriores. Los Plugins también pueden suscribirse
a ellos directamente sin exportación OTLP.

**Uso del modelo**

- `model.usage` — tokens, costo, duración, contexto, proveedor/modelo/canal,
  ids de sesión. `usage` es la contabilidad de proveedor/turno para costo y telemetría;
  `context.used` es la instantánea actual de prompt/contexto y puede ser menor que
  el `usage.total` del proveedor cuando intervienen entradas en caché o llamadas de bucle de herramientas.

**Flujo de mensajes**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Cola y sesión**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (contadores agregados: webhooks/cola/sesión)

**Ciclo de vida del arnés**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  ciclo de vida por ejecución para el arnés del agente. Incluye `harnessId`, `pluginId`
  opcional, proveedor/modelo/canal e id de ejecución. La finalización añade
  `durationMs`, `outcome`, `resultClassification` opcional, `yieldDetected`
  y recuentos de `itemLifecycle`. Los errores añaden `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` y
  `cleanupFailed` opcional.

**Exec**

- `exec.process.completed` — resultado de terminal, duración, destino, modo, código
  de salida y tipo de fallo. No se incluyen el texto del comando ni los directorios
  de trabajo.

## Sin un exportador

Puedes mantener los eventos de diagnóstico disponibles para Plugins o receptores personalizados sin
ejecutar `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Para salida de depuración dirigida sin elevar `logging.level`, usa indicadores de diagnóstico.
Los indicadores no distinguen entre mayúsculas y minúsculas y admiten comodines (por ejemplo, `telegram.*` o
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

O como una sobrescritura de entorno puntual:

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

- [Registro](/es/logging) — registros de archivo, salida de consola, seguimiento desde la CLI y la pestaña Registros de la Control UI
- [Componentes internos de registro de Gateway](/es/gateway/logging) — estilos de registro WS, prefijos de subsistema y captura de consola
- [Indicadores de diagnóstico](/es/diagnostics/flags) — indicadores de registro de depuración dirigida
- [Exportación de diagnósticos](/es/gateway/diagnostics) — herramienta de paquete de soporte para operadores (separada de la exportación OTEL)
- [Referencia de configuración](/es/gateway/configuration-reference#diagnostics) — referencia completa de campos `diagnostics.*`
