---
read_when:
    - Quieres enviar el uso de modelos, el flujo de mensajes o las métricas de sesión de OpenClaw a un colector de OpenTelemetry
    - Estás conectando trazas, métricas o registros a Grafana, Datadog, Honeycomb, New Relic, Tempo u otro backend OTLP
    - Necesitas los nombres exactos de las métricas, los nombres de los spans o las formas de los atributos para crear paneles o alertas
summary: Exporta diagnósticos de OpenClaw a recopiladores de OpenTelemetry o a JSONL en stdout mediante el Plugin diagnostics-otel
title: Exportación de OpenTelemetry
x-i18n:
    generated_at: "2026-06-27T11:32:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 551de723eec13f73ee7a8614a9c0faa64dae52c5f5749fccfca8a347b3307355
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporta diagnósticos mediante el Plugin oficial `diagnostics-otel`
usando **OTLP/HTTP (protobuf)**. Los registros también pueden escribirse como JSONL en stdout para
canalizaciones de registros de contenedores y sandboxes. Cualquier recopilador o backend que acepte
OTLP/HTTP funciona sin cambios de código. Para registros en archivos locales y cómo leerlos,
consulta [Registro](/es/logging).

## Cómo encaja todo

- Los **eventos de diagnóstico** son registros estructurados, en proceso, emitidos por el
  Gateway y los plugins incluidos para ejecuciones de modelos, flujo de mensajes, sesiones, colas
  y exec.
- El **Plugin `diagnostics-otel`** se suscribe a esos eventos y los exporta como
  **métricas**, **trazas** y **registros** de OpenTelemetry mediante OTLP/HTTP. También puede
  reflejar registros de diagnóstico a JSONL en stdout.
- Las **llamadas de proveedor** reciben un encabezado W3C `traceparent` desde el contexto de tramo
  de llamada de modelo de confianza de OpenClaw cuando el transporte del proveedor acepta encabezados
  personalizados. El contexto de traza emitido por plugins no se propaga.
- Los exportadores solo se adjuntan cuando tanto la superficie de diagnóstico como el Plugin están
  habilitados, por lo que el coste en proceso permanece cerca de cero de forma predeterminada.

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

| Señal       | Qué contiene                                                                                                                                                                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Métricas** | Contadores e histogramas para uso de tokens, coste, duración de ejecución, conmutación por error, uso de Skills, flujo de mensajes, eventos de Talk, carriles de cola, estado/recuperación de sesión, ejecución de herramientas, cargas útiles sobredimensionadas, exec y presión de memoria. |
| **Trazas**  | Tramos para uso de modelos, llamadas de modelos, ciclo de vida del arnés, uso de Skills, ejecución de herramientas, exec, procesamiento de webhooks/mensajes, ensamblaje de contexto y bucles de herramientas.                                      |
| **Registros** | Registros estructurados `logging.file` exportados mediante OTLP o JSONL en stdout cuando `diagnostics.otel.logs` está habilitado; los cuerpos de registro se retienen salvo que la captura de contenido se habilite explícitamente.                 |

Activa `traces`, `metrics` y `logs` de forma independiente. Las trazas y las métricas
se activan de forma predeterminada cuando `diagnostics.otel.enabled` es true. Los registros se desactivan de forma predeterminada y
solo se exportan cuando `diagnostics.otel.logs` es explícitamente `true`. La exportación de registros
usa OTLP de forma predeterminada; establece `diagnostics.otel.logsExporter` en `stdout` para JSONL en
stdout, o en `both` para enviar cada registro de diagnóstico a OTLP y stdout.

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
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },
  },
}
```

### Variables de entorno

| Variable                                                                                                          | Propósito                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Sustituye `diagnostics.otel.endpoint`. Si el valor ya contiene `/v1/traces`, `/v1/metrics` o `/v1/logs`, se usa tal cual.                                                                                                                                                                                                                                    |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Sustituciones de endpoint específicas de señal usadas cuando la clave de configuración `diagnostics.otel.*Endpoint` correspondiente no está definida. La configuración específica de señal prevalece sobre la variable de entorno específica de señal, que prevalece sobre el endpoint compartido.                                                            |
| `OTEL_SERVICE_NAME`                                                                                               | Sustituye `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                                    |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Sustituye el protocolo de cable (hoy solo se respeta `http/protobuf`).                                                                                                                                                                                                                                                                                       |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Establece `gen_ai_latest_experimental` para emitir la forma experimental más reciente de tramos de inferencia GenAI, incluidos nombres de tramo `{gen_ai.operation.name} {gen_ai.request.model}`, tipo de tramo `CLIENT` y `gen_ai.provider.name` en lugar del `gen_ai.system` heredado. Las métricas GenAI siempre usan atributos semánticos acotados y de baja cardinalidad. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Establece `1` cuando otra precarga o proceso anfitrión ya registró el SDK global de OpenTelemetry. El Plugin entonces omite su propio ciclo de vida de NodeSDK, pero sigue conectando escuchas de diagnóstico y respeta `traces`/`metrics`/`logs`.                                                                  |

## Privacidad y captura de contenido

El contenido bruto de modelos/herramientas **no** se exporta de forma predeterminada. Los tramos llevan
identificadores acotados (canal, proveedor, modelo, categoría de error, ids de solicitud solo con hash,
origen de herramienta, propietario de herramienta y nombre/origen de skill) y nunca incluyen texto de prompt,
texto de respuesta, entradas de herramienta, salidas de herramienta, rutas de archivos de Skills ni claves de sesión.
Los registros OTLP conservan la gravedad, el registrador, la ubicación del código, el contexto de traza de confianza
y atributos saneados de forma predeterminada, pero el cuerpo bruto del mensaje de registro se exporta
solo cuando `diagnostics.otel.captureContent` se establece en booleano `true`. Las subclaves granulares
`captureContent.*` no habilitan los cuerpos de registro. Las etiquetas que parecen
claves de sesión de agente con ámbito se sustituyen por `unknown`.
Las métricas de Talk solo exportan metadatos de eventos acotados, como modo, transporte,
proveedor y tipo de evento. No incluyen transcripciones, cargas útiles de audio,
ids de sesión, ids de turno, ids de llamada, ids de sala ni tokens de transferencia.

Las solicitudes salientes de modelo pueden incluir un encabezado W3C `traceparent`. Ese encabezado se
genera solo desde el contexto de traza de diagnóstico propiedad de OpenClaw para la llamada de modelo activa.
Los encabezados `traceparent` suministrados por llamadores existentes se sustituyen, por lo que plugins u
opciones de proveedor personalizadas no pueden suplantar la ascendencia de trazas entre servicios.

Establece `diagnostics.otel.captureContent.*` en `true` solo cuando tu recopilador y
política de retención estén aprobados para texto de prompt, respuesta, herramienta o prompt del sistema.
Cada subclave es opt-in de forma independiente:

- `inputMessages` - contenido del prompt del usuario.
- `outputMessages` - contenido de la respuesta del modelo.
- `toolInputs` - cargas útiles de argumentos de herramientas.
- `toolOutputs` - cargas útiles de resultados de herramientas.
- `systemPrompt` - prompt de sistema/desarrollador ensamblado.
- `toolDefinitions` - nombres, descripciones y esquemas de herramientas del modelo.

Cuando se habilita cualquier subclave, los tramos de modelo y herramienta reciben atributos acotados y redactados
`openclaw.content.*` solo para esa clase. Usa el booleano
`captureContent: true` solo para capturas de diagnóstico amplias donde los cuerpos de mensajes de registro OTLP
también estén aprobados para exportación.

El contenido de `toolInputs`/`toolOutputs` se captura para las ejecuciones de herramientas del runtime
de agente integrado (`openclaw.content.tool_input` en tramos completados/con error,
`openclaw.content.tool_output` en tramos completados). Las llamadas de herramientas de arneses externos
(Codex, Claude CLI) emiten tramos `tool.execution.*` sin cargas útiles de contenido.
El contenido capturado viaja por un canal de confianza, solo para escuchas, y nunca se coloca
en el bus público de eventos de diagnóstico.

## Muestreo y vaciado

- **Trazas:** `diagnostics.otel.sampleRate` (solo tramo raíz, `0.0` descarta todo,
  `1.0` conserva todo).
- **Métricas:** `diagnostics.otel.flushIntervalMs` (mínimo `1000`).
- **Registros:** Los registros OTLP respetan `logging.level` (nivel de registro de archivo). Usan la
  ruta de redacción de registros de diagnóstico, no el formato de consola. Las instalaciones de alto volumen
  deberían preferir el muestreo/filtrado del recopilador OTLP al muestreo local.
  Establece `diagnostics.otel.logsExporter: "stdout"` cuando tu plataforma ya
  envía stdout/stderr a un procesador de registros y no tienes un recopilador de registros OTLP.
  Los registros de stdout son un objeto JSON por línea con `ts`, `signal`,
  `service.name`, gravedad, cuerpo, atributos redactados y campos de traza de confianza
  cuando estén disponibles.
- **Correlación de registros de archivo:** Los registros de archivo JSONL incluyen `traceId`,
  `spanId`, `parentSpanId` y `traceFlags` de nivel superior cuando la llamada de registro lleva un contexto
  de traza de diagnóstico válido, lo que permite a los procesadores de registros unir líneas de registros locales con
  tramos exportados.
- **Correlación de solicitudes:** Las solicitudes HTTP del Gateway y los frames de WebSocket crean un
  ámbito interno de traza de solicitud. Los registros y eventos de diagnóstico dentro de ese ámbito
  heredan la traza de solicitud de forma predeterminada, mientras que los tramos de ejecución de agente y llamada de modelo se
  crean como hijos para que los encabezados `traceparent` del proveedor permanezcan en la misma traza.

## Métricas exportadas

### Uso de modelos

- `openclaw.tokens` (contador, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (contador, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histograma, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histograma, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histograma, métrica de convenciones semánticas de GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histograma, segundos, métrica de convenciones semánticas de GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` opcional)
- `openclaw.model_call.duration_ms` (histograma, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, además de `openclaw.errorCategory` y `openclaw.failureKind` en errores clasificados)
- `openclaw.model_call.request_bytes` (histograma, tamaño en bytes UTF-8 de la carga útil final de la solicitud al modelo; sin contenido sin procesar de la carga útil)
- `openclaw.model_call.response_bytes` (histograma, tamaño en bytes UTF-8 de las cargas útiles de fragmentos de respuesta transmitidos; los deltas de texto de alta frecuencia, pensamiento y llamadas a herramientas cuentan solo bytes `delta` incrementales; sin contenido sin procesar de la respuesta)
- `openclaw.model_call.time_to_first_byte_ms` (histograma, tiempo transcurrido antes del primer evento de respuesta transmitida)
- `openclaw.model.failover` (contador, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (contador, attrs: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, `openclaw.agent` opcional, `openclaw.toolName` opcional)

### Flujo de mensajes

- `openclaw.webhook.received` (contador, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (contador, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histograma, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (contador, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (contador, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (contador, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (contador, attrs: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (histograma, attrs: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (contador, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histograma, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (contador, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histograma, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Talk

- `openclaw.talk.event` (contador, attrs: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histograma, attrs: igual que `openclaw.talk.event`; se emite cuando un evento de Talk informa duración)
- `openclaw.talk.audio.bytes` (histograma, attrs: igual que `openclaw.talk.event`; se emite para eventos de fotogramas de audio de Talk que informan longitud en bytes)

### Colas y sesiones

- `openclaw.queue.lane.enqueue` (contador, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (contador, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histograma, attrs: `openclaw.lane` o `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histograma, attrs: `openclaw.lane`)
- `openclaw.session.state` (contador, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (contador, attrs: `openclaw.state`; se emite para contabilidad de sesiones obsoleta recuperable)
- `openclaw.session.stuck_age_ms` (histograma, attrs: `openclaw.state`; se emite para contabilidad de sesiones obsoleta recuperable)
- `openclaw.session.turn.created` (contador, attrs: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (contador, attrs: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (contador, attrs: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histograma, attrs: igual que el contador de recuperación correspondiente)
- `openclaw.run.attempt` (contador, attrs: `openclaw.attempt`)

### Telemetría de actividad de sesión

`diagnostics.stuckSessionWarnMs` es el umbral de edad sin progreso para los diagnósticos
de actividad de sesión. Una sesión `processing` no avanza hacia este umbral
mientras OpenClaw observa progreso en respuestas, herramientas, estado, bloques o tiempo de ejecución ACP.
Los keepalives de escritura no se cuentan como progreso, por lo que un modelo o arnés silencioso
aún se puede detectar.

OpenClaw clasifica las sesiones según el trabajo que aún puede observar:

- `session.long_running`: el trabajo embebido activo, las llamadas al modelo o las llamadas a herramientas
  siguen avanzando. Las llamadas al modelo con propietario que permanecen silenciosas pasado
  `diagnostics.stuckSessionWarnMs` también se informan como de larga duración antes de
  `diagnostics.stuckSessionAbortMs`, de modo que los proveedores de modelos lentos o sin streaming
  no parezcan sesiones de gateway detenidas mientras sigan siendo observables para abortar.
- `session.stalled`: existe trabajo activo, pero la ejecución activa no ha informado
  progreso reciente. Las llamadas al modelo con propietario cambian de `session.long_running` a
  `session.stalled` en o después de `diagnostics.stuckSessionAbortMs`; la actividad obsoleta
  de modelo/herramienta sin propietario no se trata como trabajo de larga duración inocuo.
  Las ejecuciones embebidas detenidas permanecen primero en modo solo observación y luego abortan y drenan después de
  `diagnostics.stuckSessionAbortMs` sin progreso, para que los turnos en cola detrás del
  carril puedan reanudarse. Cuando no está definido, el umbral de aborto usa de forma predeterminada la ventana
  extendida más segura de al menos 5 minutos y 3 veces
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: contabilidad de sesión obsoleta sin trabajo activo, o una sesión
  en cola inactiva con actividad obsoleta de modelo/herramienta sin propietario. Esto libera el
  carril de sesión afectado inmediatamente después de que pasan las compuertas de recuperación.

La recuperación emite eventos estructurados `session.recovery.requested` y
`session.recovery.completed`. El estado de sesión de diagnóstico se marca como inactivo
solo después de un resultado de recuperación mutante (`aborted` o `released`) y solo si la
misma generación de procesamiento sigue siendo la actual.

Solo `session.stuck` emite el contador `openclaw.session.stuck`, el
histograma `openclaw.session.stuck_age_ms` y el span `openclaw.session.stuck`.
Los diagnósticos repetidos de `session.stuck` aplican retroceso mientras la sesión permanece
sin cambios, por lo que los paneles deben alertar sobre aumentos sostenidos en lugar de cada
tick de heartbeat. Para el control de configuración y los valores predeterminados, consulta
[Referencia de configuración](/es/gateway/configuration-reference#diagnostics).

Las advertencias de actividad también emiten:

- `openclaw.liveness.warning` (contador, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histograma, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histograma, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histograma, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histograma, attrs: `openclaw.liveness.reason`)

### Ciclo de vida del arnés

- `openclaw.harness.duration_ms` (histograma, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` en errores)

### Ejecución de herramientas

- `openclaw.tool.execution.duration_ms` (histograma, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, además de `openclaw.errorCategory` en errores)
- `openclaw.tool.execution.blocked` (contador, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (histograma, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Elementos internos de diagnóstico (memoria y bucle de herramientas)

- `openclaw.payload.large` (contador, attrs: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histograma, attrs: igual que `openclaw.payload.large`)
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
  - `openclaw.errorCategory` y `openclaw.failureKind` opcional en errores
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (hash acotado basado en SHA del id de solicitud del proveedor ascendente; los ids sin procesar no se exportan)
  - Con `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, los tramos de llamada de modelo usan el nombre de tramo de inferencia GenAI más reciente `{gen_ai.operation.name} {gen_ai.request.model}` y el tipo de tramo `CLIENT` en lugar de `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Al completarse: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - En caso de error: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` opcional
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`
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

Cuando la captura de contenido está habilitada explícitamente, los tramos de modelo y herramienta también pueden
incluir atributos `openclaw.content.*` acotados y redactados para las clases de
contenido específicas que habilitaste.

## Catálogo de eventos de diagnóstico

Los eventos siguientes respaldan las métricas y los tramos anteriores. Los Plugin también pueden suscribirse
a ellos directamente sin exportación OTLP.

**Uso del modelo**

- `model.usage` - tokens, costo, duración, contexto, proveedor/modelo/canal,
  ids de sesión. `usage` es la contabilidad por proveedor/turno para costo y telemetría;
  `context.used` es la instantánea actual del prompt/contexto y puede ser menor que
  `usage.total` del proveedor cuando intervienen entrada en caché o llamadas de bucle de herramientas.

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

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  ciclo de vida por ejecución para el arnés del agente. Incluye `harnessId`, `pluginId`
  opcional, proveedor/modelo/canal e id de ejecución. La finalización agrega
  `durationMs`, `outcome`, `resultClassification` opcional, `yieldDetected`,
  y recuentos de `itemLifecycle`. Los errores agregan `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` y
  `cleanupFailed` opcional.

**Exec**

- `exec.process.completed` - resultado terminal, duración, destino, modo, código de
  salida y tipo de fallo. No se incluyen el texto del comando ni los directorios de trabajo.

## Sin un exportador

Puedes mantener los eventos de diagnóstico disponibles para Plugin o receptores personalizados sin
ejecutar `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Para salida de depuración dirigida sin aumentar `logging.level`, usa marcas de diagnóstico.
Las marcas no distinguen entre mayúsculas y minúsculas y admiten comodines (por ejemplo, `telegram.*` o
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

O como anulación puntual de entorno:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

La salida de las marcas va al archivo de registro estándar (`logging.file`) y sigue
redactada por `logging.redactSensitive`. Guía completa:
[Marcas de diagnóstico](/es/diagnostics/flags).

## Deshabilitar

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

También puedes dejar `diagnostics-otel` fuera de `plugins.allow`, o ejecutar
`openclaw plugins disable diagnostics-otel`.

## Relacionado

- [Registro](/es/logging) - registros de archivo, salida de consola, seguimiento desde CLI y la pestaña Logs de Control UI
- [Aspectos internos del registro de Gateway](/es/gateway/logging) - estilos de registro WS, prefijos de subsistema y captura de consola
- [Marcas de diagnóstico](/es/diagnostics/flags) - marcas de registro de depuración dirigido
- [Exportación de diagnóstico](/es/gateway/diagnostics) - herramienta de paquete de soporte para operadores (separada de la exportación OTEL)
- [Referencia de configuración](/es/gateway/configuration-reference#diagnostics) - referencia completa de campos `diagnostics.*`
