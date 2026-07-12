---
read_when:
    - Quieres enviar las métricas de uso de modelos, flujo de mensajes o sesiones de OpenClaw a un recopilador de OpenTelemetry
    - Estás conectando trazas, métricas o registros con Grafana, Datadog, Honeycomb, New Relic, Tempo u otro backend OTLP
    - Necesitas los nombres exactos de las métricas, los nombres de los intervalos o las estructuras de los atributos para crear paneles o alertas.
summary: Exporta los diagnósticos de OpenClaw a colectores de OpenTelemetry o a JSONL en stdout mediante el plugin diagnostics-otel
title: Exportación de OpenTelemetry
x-i18n:
    generated_at: "2026-07-11T23:07:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3f8a1b9e253000272def0fbd361cd311f6645b1aac5a6f06cff014b45e82388
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporta diagnósticos mediante el Plugin oficial `diagnostics-otel`
usando **OTLP/HTTP (protobuf)**. Los registros también se pueden escribir como JSONL en stdout para
canalizaciones de registros de contenedores y entornos aislados. Cualquier recopilador o backend que acepte
OTLP/HTTP funciona sin cambios en el código. Para los registros en archivos locales, consulta
[Registro](/es/logging).

- Los **eventos de diagnóstico** son registros estructurados dentro del proceso que emiten el
  Gateway y los plugins incluidos para ejecuciones de modelos, flujo de mensajes, sesiones, colas
  y exec.
- **`diagnostics-otel`** se suscribe a esos eventos y los exporta como
  **métricas**, **trazas** y **registros** de OpenTelemetry mediante OTLP/HTTP, y puede
  replicar los registros en stdout como JSONL.
- Las **llamadas a proveedores** reciben un encabezado W3C `traceparent` del
  contexto de intervalo de la llamada al modelo de confianza de OpenClaw cuando el transporte del proveedor acepta encabezados
  personalizados. El contexto de traza emitido por plugins no se propaga.
- Los exportadores solo se conectan cuando tanto la superficie de diagnóstico como el Plugin están
  habilitados, por lo que el coste dentro del proceso se mantiene cerca de cero de forma predeterminada.

## Inicio rápido

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

También puedes habilitar el Plugin desde la CLI: `openclaw plugins enable diagnostics-otel`.

<Note>
`protocol` solo admite `http/protobuf`. Dado que `traces` y `metrics` están habilitados de forma predeterminada, cualquier otro valor (incluido `grpc`) cancela toda la suscripción a diagnostics-otel con una advertencia `unsupported protocol`; esto también detiene la exportación de registros JSONL a stdout. Establece explícitamente `traces: false` y `metrics: false` si solo quieres `logsExporter: "stdout"` con un valor de protocolo distinto de OTLP.
</Note>

## Señales exportadas

| Señal       | Contenido                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Métricas** | Contadores e histogramas para uso de tokens, coste, duración de ejecuciones, conmutación por error, uso de Skills, flujo de mensajes, eventos de conversación, carriles de colas, estado y recuperación de sesiones, ejecución de herramientas, exec, memoria, actividad y estado de los exportadores. |
| **Trazas**  | Intervalos para uso de modelos, llamadas a modelos, ciclo de vida del entorno de ejecución, uso de Skills, ejecución de herramientas, exec, procesamiento de webhooks y mensajes, ensamblaje de contexto y bucles de herramientas.                                                      |
| **Registros**    | Registros estructurados de `logging.file` exportados mediante OTLP o como JSONL en stdout cuando `diagnostics.otel.logs` está habilitado; los cuerpos de los registros se omiten salvo que se habilite explícitamente la captura de contenido.                          |

Activa o desactiva `traces`, `metrics` y `logs` de forma independiente. Las trazas y las métricas
están activadas de forma predeterminada cuando `diagnostics.otel.enabled` es true; los registros están desactivados de forma predeterminada
y solo se exportan cuando `diagnostics.otel.logs` es explícitamente `true`. La exportación de registros
usa OTLP de forma predeterminada; establece `diagnostics.otel.logsExporter` en `stdout` para obtener JSONL en
stdout, o en `both` para ambos.

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
      protocol: "http/protobuf", // grpc deshabilita la exportación OTLP
      serviceName: "openclaw-gateway", // si no se establece, usa OTEL_SERVICE_NAME y después "openclaw"
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // muestreador de intervalos raíz, 0.0..1.0
      flushIntervalMs: 60000, // intervalo de exportación de métricas (mín. 1000 ms)
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

| Variable                                                                                                          | Propósito                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Valor alternativo para `diagnostics.otel.endpoint` cuando la clave de configuración no está definida.                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Valores alternativos de endpoint específicos de cada señal que se usan cuando la clave de configuración `diagnostics.otel.*Endpoint` correspondiente no está definida. La configuración específica de la señal tiene prioridad sobre la variable de entorno específica de la señal, que a su vez tiene prioridad sobre el endpoint compartido.                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Valor alternativo para `diagnostics.otel.serviceName` cuando la clave de configuración no está definida. El nombre de servicio predeterminado es `openclaw`.                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Valor alternativo para el protocolo de transporte cuando `diagnostics.otel.protocol` no está definido. Solo `http/protobuf` habilita la exportación.                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Establécela en `gen_ai_latest_experimental` para emitir la forma más reciente de los intervalos de inferencia de IA generativa: nombres de intervalo `{gen_ai.operation.name} {gen_ai.request.model}`, tipo de intervalo `CLIENT` y `gen_ai.provider.name` en lugar del antiguo `gen_ai.system`. Las métricas de IA generativa siempre usan atributos acotados y de baja cardinalidad. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Establécela en `1` cuando otra precarga o proceso anfitrión ya haya registrado el SDK global de OpenTelemetry. En ese caso, el Plugin omite su propio ciclo de vida de NodeSDK, pero sigue conectando los escuchas de diagnóstico y respetando `traces`/`metrics`/`logs`.                                                                                    |

## Privacidad y captura de contenido

El contenido sin procesar de modelos y herramientas **no** se exporta de forma predeterminada. Los intervalos incluyen identificadores
acotados (canal, proveedor, modelo, categoría de error, identificadores de solicitud solo como hash,
origen de la herramienta, propietario de la herramienta, nombre y origen de la Skill) y nunca incluyen texto de solicitudes,
texto de respuestas, entradas de herramientas, salidas de herramientas, rutas de archivos de Skills ni claves de sesión.
Los valores que parecen claves de sesión de agente con ámbito (por ejemplo, que comienzan por
`agent:`) se sustituyen por `unknown` en los atributos de baja cardinalidad. Los registros OTLP
conservan de forma predeterminada la gravedad, el registrador, la ubicación del código, el contexto de traza
de confianza y los atributos saneados; el cuerpo del mensaje de registro sin procesar solo se exporta
cuando `diagnostics.otel.captureContent` es el booleano `true`. Las subclaves granulares
`captureContent.*` nunca habilitan los cuerpos de los registros. Las métricas de conversación solo exportan
metadatos de eventos acotados (modo, transporte, proveedor y tipo de evento), sin
transcripciones, cargas de audio, identificadores de sesión, identificadores de turno, identificadores de llamada, identificadores de sala ni
tokens de transferencia.

Las solicitudes salientes a modelos pueden incluir un encabezado W3C `traceparent` generado únicamente
a partir del contexto de traza de diagnóstico propiedad de OpenClaw para la llamada activa al modelo.
Los encabezados `traceparent` existentes proporcionados por el llamador se sustituyen, por lo que los plugins o
las opciones personalizadas del proveedor no pueden falsificar la ascendencia de trazas entre servicios.

Establece `diagnostics.otel.captureContent.*` en `true` solo cuando tu recopilador
y tu política de retención estén aprobados para texto de solicitudes, respuestas, herramientas o
solicitudes del sistema. Cada subclave es independiente:

- `inputMessages`: contenido de la solicitud del usuario.
- `outputMessages`: contenido de la respuesta del modelo.
- `toolInputs`: cargas de argumentos de herramientas.
- `toolOutputs`: cargas de resultados de herramientas.
- `systemPrompt`: solicitud ensamblada del sistema o del desarrollador.
- `toolDefinitions`: nombres, descripciones y esquemas de herramientas del modelo.

Cuando se habilita alguna subclave, los intervalos de modelos y herramientas reciben atributos
`openclaw.content.*` acotados y censurados únicamente para esa clase.

<Note>
El booleano `captureContent: true` habilita conjuntamente `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions` y los cuerpos de registros OTLP, pero **no** `systemPrompt`; establece `captureContent.systemPrompt: true` explícitamente si también necesitas la solicitud del sistema ensamblada.
</Note>

El contenido de `toolInputs`/`toolOutputs` se captura para las ejecuciones de herramientas del
entorno de ejecución de agente integrado (`openclaw.content.tool_input` y
`gen_ai.tool.call.arguments` en intervalos completados o con error;
`openclaw.content.tool_output` y `gen_ai.tool.call.result` en intervalos completados).
Los nombres `openclaw.content.*` siguen siendo los nombres de atributos estables de OpenClaw;
las copias `gen_ai.tool.call.*` los replican para visores nativos de convenciones semánticas.
Las llamadas a herramientas de entornos de ejecución externos (Codex, Claude CLI) emiten
intervalos `tool.execution.*` sin cargas de contenido. El contenido capturado viaja por un
canal de confianza exclusivo para escuchas y nunca se coloca en el bus público de eventos de
diagnóstico.

## Muestreo y vaciado

- **Trazas:** `diagnostics.otel.sampleRate` establece un `TraceIdRatioBasedSampler`
  únicamente en el span raíz (`0.0` descarta todo, `1.0` conserva todo). Si no se
  establece, se usa el valor predeterminado del SDK de OpenTelemetry (siempre activo).
- **Métricas:** `diagnostics.otel.flushIntervalMs` (limitado a un mínimo de
  `1000`); si no se establece, se usa el valor predeterminado de exportación periódica del SDK.
- **Registros:** los registros OTLP respetan `logging.level` (nivel de registro del archivo) y usan la
  ruta de ocultación de datos de los registros de diagnóstico, no el formato de la consola. Las instalaciones
  de gran volumen deben preferir el muestreo o filtrado del recopilador OTLP al muestreo
  local. Establece `diagnostics.otel.logsExporter: "stdout"` cuando tu plataforma
  ya envíe stdout/stderr a un procesador de registros y no tengas ningún recopilador
  de registros OTLP. Los registros de stdout son un objeto JSON por línea con `ts`, `signal`,
  `service.name`, gravedad, cuerpo, atributos con datos ocultos y campos de traza
  de confianza cuando estén disponibles.
- **Correlación de registros de archivo:** los registros de archivos JSONL incluyen `traceId`,
  `spanId`, `parentSpanId` y `traceFlags` en el nivel superior cuando la llamada de registro contiene un
  contexto de traza de diagnóstico válido, lo que permite a los procesadores de registros asociar las líneas de registro locales con
  los spans exportados.
- **Correlación de solicitudes:** las solicitudes HTTP y las tramas WebSocket del Gateway crean
  un ámbito interno de traza de solicitud. Los registros y eventos de diagnóstico dentro de ese
  ámbito heredan de forma predeterminada la traza de la solicitud, mientras que los spans de ejecución del agente y de llamada
  al modelo se crean como secundarios para que los encabezados `traceparent` del proveedor permanezcan en la
  misma traza.
- **Correlación de llamadas al modelo:** los spans `openclaw.model.call` incluyen de forma predeterminada los tamaños seguros de los
  componentes del prompt y atributos de tokens por llamada cuando el resultado del proveedor
  expone el uso. `openclaw.model.usage` sigue siendo el span de contabilización
  a nivel de ejecución para los paneles de coste agregado, contexto y canal, y
  permanece en la misma traza de diagnóstico cuando el entorno de ejecución emisor tiene un
  contexto de traza de confianza.

## Métricas exportadas

### Uso del modelo

- `openclaw.tokens` (contador, atributos: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (contador, atributos: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histograma, atributos: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histograma, atributos: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histograma, métrica de convenciones semánticas de GenAI, atributos: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histograma, segundos, métrica de convenciones semánticas de GenAI, atributos: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` opcional)
- `openclaw.model_call.duration_ms` (histograma, atributos: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, además de `openclaw.errorCategory` y `openclaw.failureKind` en errores clasificados)
- `openclaw.model_call.request_bytes` (histograma, tamaño en bytes UTF-8 de la carga útil final de la solicitud al modelo; sin contenido de la carga útil sin procesar)
- `openclaw.model_call.response_bytes` (histograma, tamaño en bytes UTF-8 de las cargas útiles de los fragmentos de respuesta transmitidos; los deltas de texto, razonamiento y llamadas a herramientas de alta frecuencia solo cuentan los bytes incrementales de `delta`; sin contenido de respuesta sin procesar)
- `openclaw.model_call.time_to_first_byte_ms` (histograma, tiempo transcurrido antes del primer evento de respuesta transmitido)
- `openclaw.model.failover` (contador, atributos: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (contador, atributos: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, `openclaw.agent` opcional, `openclaw.toolName` opcional)

### Flujo de mensajes

- `openclaw.webhook.received` (contador, atributos: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (contador, atributos: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histograma, atributos: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (contador, atributos: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (contador, atributos: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (contador, atributos: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (contador, atributos: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (histograma, atributos: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (contador, atributos: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histograma, atributos: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (contador, atributos: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histograma, atributos: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Conversación

- `openclaw.talk.event` (contador, atributos: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histograma, atributos: los mismos que `openclaw.talk.event`; se emite cuando un evento de conversación informa de su duración)
- `openclaw.talk.audio.bytes` (histograma, atributos: los mismos que `openclaw.talk.event`; se emite para eventos de tramas de audio de conversación que informan de la longitud en bytes)

### Colas y sesiones

- `openclaw.queue.lane.enqueue` (contador, atributos: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (contador, atributos: `openclaw.lane`)
- `openclaw.queue.depth` (histograma, atributos: `openclaw.lane` o `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histograma, atributos: `openclaw.lane`)
- `openclaw.session.state` (contador, atributos: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (contador, atributos: `openclaw.state`; se emite para registros de control obsoletos de sesiones recuperables)
- `openclaw.session.stuck_age_ms` (histograma, atributos: `openclaw.state`; se emite para registros de control obsoletos de sesiones recuperables)
- `openclaw.session.turn.created` (contador, atributos: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (contador, atributos: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (contador, atributos: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histograma, atributos: los mismos que el contador de recuperación correspondiente)
- `openclaw.run.attempt` (contador, atributos: `openclaw.attempt`)

### Telemetría de actividad de sesiones

`diagnostics.stuckSessionWarnMs` es el umbral de antigüedad sin progreso para los diagnósticos
de actividad de las sesiones. Una sesión `processing` no avanza hacia este
umbral mientras OpenClaw observe progreso en la respuesta, las herramientas, el estado, los bloques o el entorno de ejecución
ACP. Las señales de mantenimiento de escritura no cuentan como progreso, por lo que aún se puede detectar
un modelo o sistema de ejecución silencioso.

OpenClaw clasifica las sesiones según el trabajo que todavía puede observar:

- `session.long_running`: el trabajo integrado activo, las llamadas al modelo o las llamadas a herramientas
  siguen progresando. Las llamadas al modelo con propietario que permanecen en silencio después de
  `diagnostics.stuckSessionWarnMs` también se notifican como de larga duración antes de
  `diagnostics.stuckSessionAbortMs`, para que los proveedores de modelos lentos o sin transmisión
  no parezcan sesiones del Gateway bloqueadas mientras su interrupción sea observable.
- `session.stalled`: existe trabajo activo, pero la ejecución activa no ha informado de
  progreso reciente. Las llamadas al modelo con propietario cambian de `session.long_running` a
  `session.stalled` al alcanzar o superar `diagnostics.stuckSessionAbortMs`; la
  actividad obsoleta de modelos o herramientas sin propietario no se considera trabajo de larga duración inofensivo.
  Las ejecuciones integradas bloqueadas permanecen al principio solo bajo observación y después pasan a interrupción y vaciado tras
  `diagnostics.stuckSessionAbortMs` sin progreso, para que los turnos en cola detrás
  del carril puedan reanudarse. Si no se establece, el umbral de interrupción usa de forma predeterminada la ventana ampliada
  más segura de al menos 5 minutos y 3 veces
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: registros de control obsoletos de la sesión sin trabajo activo, o una sesión
  inactiva en cola con actividad obsoleta de modelos o herramientas sin propietario. Esto libera el
  carril de sesión afectado inmediatamente después de superar las comprobaciones de recuperación.

La recuperación emite eventos estructurados `session.recovery.requested` y
`session.recovery.completed`. El estado de diagnóstico de la sesión se marca como inactivo
solo después de un resultado de recuperación que produzca cambios (`aborted` o `released`) y únicamente si
la misma generación de procesamiento sigue siendo la actual.

Solo `session.stuck` emite el contador `openclaw.session.stuck`, el
histograma `openclaw.session.stuck_age_ms` y el span `openclaw.session.stuck`.
Los diagnósticos repetidos de `session.stuck` reducen su frecuencia mientras la sesión permanece
sin cambios, por lo que los paneles deben generar alertas ante aumentos sostenidos y no ante
cada ciclo de Heartbeat. Para consultar la opción de configuración y sus valores predeterminados, consulta la
[referencia de configuración](/es/gateway/configuration-reference#diagnostics).

Las advertencias de actividad también emiten:

- `openclaw.liveness.warning` (contador, atributos: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histograma, atributos: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histograma, atributos: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histograma, atributos: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histograma, atributos: `openclaw.liveness.reason`)

### Ciclo de vida del sistema de ejecución

- `openclaw.harness.duration_ms` (histograma, atributos: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` en errores)

### Ejecución de herramientas y detección de bucles

- `openclaw.tool.execution.duration_ms` (histograma, atributos: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, además de `openclaw.errorCategory` en errores)
- `openclaw.tool.execution.blocked` (contador, atributos: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)
- `openclaw.tool.loop` (contador, atributos: `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` opcional; se emite cuando se detecta un bucle repetitivo de llamadas a herramientas)

### Exec

- `openclaw.exec.duration_ms` (histograma, atributos: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Componentes internos de diagnóstico (memoria, cargas útiles, estado del exportador)

- `openclaw.payload.large` (contador, atributos: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histograma, atributos: los mismos que `openclaw.payload.large`)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (histogramas, sin atributos; muestras de memoria del proceso)
- `openclaw.memory.pressure` (contador, atributos: `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (contador, atributos: `openclaw.diagnostic.async_queue.drop_class`; descartes internos por contrapresión de la cola de diagnóstico)
- `openclaw.telemetry.exporter.events` (contador, atributos: `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, `openclaw.reason` opcional, `openclaw.errorCategory` opcional; telemetría interna del ciclo de vida y los fallos del exportador)

## Spans exportados

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` de forma predeterminada, o `gen_ai.provider.name` cuando se habilitan las convenciones semánticas más recientes de GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` de forma predeterminada, o `gen_ai.provider.name` cuando se habilitan las convenciones semánticas más recientes de GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory`, `error.type` y el atributo opcional `openclaw.failureKind` en caso de error
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (solo tamaños seguros de los componentes, sin texto del prompt)
  - `openclaw.model_call.usage.*` y `gen_ai.usage.*` cuando el resultado de la llamada al modelo contiene datos de uso del proveedor para esa llamada individual
  - Evento de tramo `openclaw.provider.request` con el atributo `openclaw.upstreamRequestIdHash` (acotado y basado en hash) cuando el resultado del proveedor ascendente expone un identificador de solicitud; los identificadores sin procesar nunca se exportan
  - Con `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, los tramos de llamadas al modelo utilizan el nombre de tramo de inferencia más reciente de GenAI, `{gen_ai.operation.name} {gen_ai.request.model}`, y el tipo de tramo `CLIENT` en lugar de `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Al completarse: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - En caso de error: `openclaw.harness.phase`, `openclaw.errorCategory`, y el atributo opcional `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `gen_ai.operation.name` (`execute_tool`), `openclaw.toolName`, `openclaw.tool.source`, el atributo opcional `gen_ai.tool.call.id`, `openclaw.tool.owner`, `openclaw.tool.params.*`
  - Los atributos opcionales `openclaw.errorCategory`/`openclaw.errorCode` en caso de error; `openclaw.deniedReason` y `openclaw.outcome=blocked` cuando una política o el entorno aislado deniegan la operación
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.exit_signal`, `openclaw.exec.timed_out`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (sin contenido del prompt, del historial, de la respuesta ni de la clave de sesión)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, y el atributo opcional `openclaw.loop.paired_tool` (sin mensajes del bucle, parámetros ni resultados de herramientas)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.reason`, `openclaw.memory.rss_bytes`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.heap_total_bytes`, `openclaw.memory.external_bytes`, `openclaw.memory.array_buffers_bytes`, y los atributos opcionales `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms`

Cuando se habilita explícitamente la captura de contenido, los tramos de modelos y herramientas también pueden
incluir atributos `openclaw.content.*` acotados y censurados para las clases de
contenido específicas que haya habilitado.

## Catálogo de eventos de diagnóstico

Los eventos siguientes sirven de base para las métricas y los tramos anteriores. Los Plugins también pueden
suscribirse directamente a ellos sin exportación mediante OTLP.

**Uso del modelo**

- `model.usage`: tokens, coste, duración, contexto, proveedor/modelo/canal e
  identificadores de sesión. `usage` es la contabilización del proveedor/turno para costes y telemetría;
  `context.used` es la instantánea actual del prompt/contexto y puede ser inferior al
  valor `usage.total` del proveedor cuando intervienen entradas almacenadas en caché o llamadas del bucle de herramientas.

**Flujo de mensajes**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Cola y sesión**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (contadores agregados: Webhooks/cola/sesión)

**Ciclo de vida del entorno de ejecución**

- `harness.run.started` / `harness.run.completed` / `harness.run.error`:
  ciclo de vida de cada ejecución del entorno de ejecución del agente. Incluye `harnessId`, el atributo opcional
  `pluginId`, el proveedor/modelo/canal y el identificador de ejecución. Al completarse, añade
  `durationMs`, `outcome`, los atributos opcionales `resultClassification`, `yieldDetected`
  y los recuentos de `itemLifecycle`. Los errores añaden `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` y el atributo
  opcional `cleanupFailed`.

**Ejecución**

- `exec.process.completed`: resultado final del terminal, duración, destino, modo, código
  de salida y tipo de fallo. No se incluyen el texto del comando ni los directorios
  de trabajo.
- `exec.approval.followup_suppressed`: se descarta un seguimiento de aprobación obsoleto
  después de reasociar una sesión. Incluye `approvalId`, `reason`
  (`session_rebound`), `phase` (`direct_delivery` o `gateway_preflight`)
  y la marca de tiempo del despachador. No se incluyen las claves de sesión, las rutas ni el texto
  del comando.

## Sin un exportador

Mantenga los eventos de diagnóstico disponibles para Plugins o receptores personalizados sin ejecutar
`diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Para generar resultados de depuración específicos sin aumentar `logging.level`, utilice indicadores de
diagnóstico. Los indicadores no distinguen entre mayúsculas y minúsculas y admiten comodines (`telegram.*` o
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

O como una sobrescritura puntual mediante una variable de entorno:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Los resultados de los indicadores se escriben en el archivo de registro estándar (`logging.file`) y
`logging.redactSensitive` continúa censurándolos. Guía completa:
[Indicadores de diagnóstico](/es/diagnostics/flags).

## Deshabilitar

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

También puede omitir `diagnostics-otel` de `plugins.allow` o ejecutar
`openclaw plugins disable diagnostics-otel`.

## Contenido relacionado

- [Registro](/es/logging): registros en archivos, salida de consola, seguimiento desde la CLI y pestaña Registros de la interfaz de control
- [Funcionamiento interno del registro del Gateway](/es/gateway/logging): estilos de registro de WS, prefijos de subsistemas y captura de consola
- [Indicadores de diagnóstico](/es/diagnostics/flags): indicadores específicos para registros de depuración
- [Exportación de diagnósticos](/es/gateway/diagnostics): herramienta de paquetes de soporte para operadores (independiente de la exportación de OTEL)
- [Referencia de configuración](/es/gateway/configuration-reference#diagnostics): referencia completa de los campos `diagnostics.*`
