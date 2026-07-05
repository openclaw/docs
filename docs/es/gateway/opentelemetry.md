---
read_when:
    - Quieres enviar el uso de modelos de OpenClaw, el flujo de mensajes o las métricas de sesión a un recopilador de OpenTelemetry
    - Está conectando trazas, métricas o registros a Grafana, Datadog, Honeycomb, New Relic, Tempo u otro backend OTLP
    - Necesitas los nombres exactos de las métricas, los nombres de los spans o las formas de los atributos para crear paneles o alertas
summary: Exporta diagnósticos de OpenClaw a recopiladores de OpenTelemetry o a JSONL en stdout mediante el plugin diagnostics-otel
title: Exportación de OpenTelemetry
x-i18n:
    generated_at: "2026-07-05T11:20:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e1ade877873729a7119cde3b819d82016cf4effad72af87e3c45bbc6cc3d48e
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporta diagnósticos mediante el Plugin oficial `diagnostics-otel`
usando **OTLP/HTTP (protobuf)**. Los registros también se pueden escribir como JSONL en stdout para
canalizaciones de registros de contenedores y sandboxes. Cualquier colector o backend que acepte
OTLP/HTTP funciona sin cambios de código. Para registros de archivos locales, consulta
[Registro](/es/logging).

- Los **eventos de diagnóstico** son registros estructurados en proceso emitidos por el
  Gateway y los plugins incluidos para ejecuciones de modelos, flujo de mensajes, sesiones, colas
  y exec.
- **`diagnostics-otel`** se suscribe a esos eventos y los exporta como
  **métricas**, **trazas** y **registros** de OpenTelemetry sobre OTLP/HTTP, y puede
  replicar registros en JSONL a stdout.
- Las **llamadas a proveedores** reciben un encabezado W3C `traceparent` desde el contexto
  del span de llamada a modelo de confianza de OpenClaw cuando el transporte del proveedor acepta
  encabezados personalizados. El contexto de traza emitido por plugins no se propaga.
- Los exportadores solo se adjuntan cuando tanto la superficie de diagnóstico como el Plugin están
  habilitados, por lo que el coste en proceso permanece cerca de cero de forma predeterminada.

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

O habilita el Plugin desde la CLI: `openclaw plugins enable diagnostics-otel`.

<Note>
`protocol` solo admite `http/protobuf`. Dado que `traces` y `metrics` están habilitados de forma predeterminada, cualquier otro valor (incluido `grpc`) cancela toda la suscripción de diagnostics-otel con una advertencia `unsupported protocol`; esto también detiene la exportación de registros a stdout. Define explícitamente `traces: false` y `metrics: false` si solo quieres `logsExporter: "stdout"` con un valor de protocolo que no sea OTLP.
</Note>

## Señales exportadas

| Señal       | Qué incluye                                                                                                                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Métricas** | Contadores/histogramas para uso de tokens, coste, duración de ejecución, conmutación por error, uso de Skills, flujo de mensajes, eventos de Talk, carriles de cola, estado/recuperación de sesión, ejecución de herramientas, exec, memoria, actividad y salud del exportador. |
| **Trazas**  | Spans para uso de modelos, llamadas a modelos, ciclo de vida del arnés, uso de Skills, ejecución de herramientas, exec, procesamiento de webhooks/mensajes, ensamblado de contexto y bucles de herramientas. |
| **Registros** | Registros estructurados de `logging.file` exportados por OTLP o JSONL a stdout cuando `diagnostics.otel.logs` está habilitado; los cuerpos de registro se retienen a menos que la captura de contenido esté habilitada explícitamente. |

Activa o desactiva `traces`, `metrics` y `logs` de forma independiente. Las trazas y métricas
están activadas de forma predeterminada cuando `diagnostics.otel.enabled` es true; los registros están desactivados
de forma predeterminada y solo se exportan cuando `diagnostics.otel.logs` es explícitamente `true`. La exportación de registros
usa OTLP de forma predeterminada; define `diagnostics.otel.logsExporter` como `stdout` para JSONL en
stdout, o `both` para ambos.

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
      protocol: "http/protobuf", // grpc disables OTLP export
      serviceName: "openclaw-gateway", // unset falls back to OTEL_SERVICE_NAME, then "openclaw"
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

| Variable                                                                                                          | Propósito                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Valor de reserva para `diagnostics.otel.endpoint` cuando la clave de configuración no está definida.                                                                                                                                                                                                           |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Valores de reserva de endpoints específicos de señal usados cuando la clave de configuración `diagnostics.otel.*Endpoint` correspondiente no está definida. La configuración específica de señal tiene prioridad sobre la variable de entorno específica de señal, que tiene prioridad sobre el endpoint compartido. |
| `OTEL_SERVICE_NAME`                                                                                               | Valor de reserva para `diagnostics.otel.serviceName` cuando la clave de configuración no está definida. El nombre de servicio predeterminado es `openclaw`.                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Valor de reserva para el protocolo de transporte cuando `diagnostics.otel.protocol` no está definido. Solo `http/protobuf` habilita la exportación.                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Define `gen_ai_latest_experimental` para emitir la forma más reciente de spans de inferencia GenAI: nombres de span `{gen_ai.operation.name} {gen_ai.request.model}`, tipo de span `CLIENT` y `gen_ai.provider.name` en lugar del `gen_ai.system` heredado. Las métricas GenAI siempre usan atributos acotados y de baja cardinalidad igualmente. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Define `1` cuando otra precarga o proceso host ya registró el SDK global de OpenTelemetry. Entonces el Plugin omite su propio ciclo de vida de NodeSDK, pero aun así conecta escuchas de diagnóstico y respeta `traces`/`metrics`/`logs`.                                                                      |

## Privacidad y captura de contenido

El contenido sin procesar de modelos/herramientas **no** se exporta de forma predeterminada. Los spans llevan
identificadores acotados (canal, proveedor, modelo, categoría de error, ids de solicitud solo con hash,
origen de herramienta, propietario de herramienta, nombre/origen de Skill) y nunca incluyen texto de prompt,
texto de respuesta, entradas de herramienta, salidas de herramienta, rutas de archivos de Skill ni claves de sesión.
Los valores que parecen claves de sesión de agente con ámbito (por ejemplo, que empiezan por
`agent:`) se reemplazan por `unknown` en atributos de baja cardinalidad. Los registros OTLP
conservan gravedad, logger, ubicación de código, contexto de traza de confianza y
atributos saneados de forma predeterminada; el cuerpo del mensaje de registro sin procesar solo se exporta
cuando `diagnostics.otel.captureContent` es booleano `true`. Las subclaves granulares
`captureContent.*` nunca habilitan los cuerpos de registros. Las métricas de Talk exportan solo
metadatos de eventos acotados (modo, transporte, proveedor, tipo de evento): sin
transcripciones, cargas de audio, ids de sesión, ids de turno, ids de llamada, ids de sala ni
tokens de transferencia.

Las solicitudes salientes a modelos pueden incluir un encabezado W3C `traceparent` generado solo
a partir del contexto de traza diagnóstica propiedad de OpenClaw para la llamada a modelo activa.
Los encabezados `traceparent` existentes suministrados por el llamador se reemplazan, por lo que los plugins u
opciones personalizadas de proveedores no pueden falsificar ascendencia de trazas entre servicios.

Define `diagnostics.otel.captureContent.*` como `true` solo cuando tu colector
y política de retención estén aprobados para texto de prompts, respuestas, herramientas o
prompts del sistema. Cada subclave es independiente:

- `inputMessages`: contenido del prompt del usuario.
- `outputMessages`: contenido de la respuesta del modelo.
- `toolInputs`: cargas de argumentos de herramientas.
- `toolOutputs`: cargas de resultados de herramientas.
- `systemPrompt`: prompt ensamblado del sistema/desarrollador.
- `toolDefinitions`: nombres, descripciones y esquemas de herramientas del modelo.

Cuando cualquier subclave está habilitada, los spans de modelos y herramientas reciben atributos
`openclaw.content.*` acotados y redactados solo para esa clase.

<Note>
El booleano `captureContent: true` habilita `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions` y los cuerpos de registros OTLP juntos, pero **no** `systemPrompt`; define `captureContent.systemPrompt: true` explícitamente si también necesitas el prompt del sistema ensamblado.
</Note>

El contenido de `toolInputs`/`toolOutputs` se captura para las ejecuciones de herramientas del
runtime de agente integrado (`openclaw.content.tool_input` en
spans completados/con error, `openclaw.content.tool_output` en spans completados).
Las llamadas a herramientas de arneses externos (Codex, Claude CLI) emiten spans `tool.execution.*`
sin cargas de contenido. El contenido capturado viaja por un canal de confianza,
solo para escuchas, y nunca se coloca en el bus público de eventos de diagnóstico.

## Muestreo y vaciado

- **Trazas:** `diagnostics.otel.sampleRate` establece un `TraceIdRatioBasedSampler`
  solo en el intervalo raíz (`0.0` descarta todo, `1.0` conserva todo). Si no se establece, usa el valor predeterminado
  del SDK de OpenTelemetry (siempre activado).
- **Métricas:** `diagnostics.otel.flushIntervalMs` (limitado a un mínimo de
  `1000`); si no se establece, usa el valor predeterminado de exportación periódica del SDK.
- **Registros:** los registros OTLP respetan `logging.level` (nivel de registro de archivo) y usan la
  ruta de censura de registros de diagnóstico, no el formato de consola. Las instalaciones de alto volumen
  deberían preferir el muestreo/filtrado del recopilador OTLP antes que el
  muestreo local. Establece `diagnostics.otel.logsExporter: "stdout"` cuando tu plataforma
  ya envía stdout/stderr a un procesador de registros y no tienes ningún recopilador
  de registros OTLP. Los registros de Stdout son un objeto JSON por línea con `ts`, `signal`,
  `service.name`, gravedad, cuerpo, atributos censurados y campos de traza
  de confianza cuando están disponibles.
- **Correlación de registros de archivo:** los registros de archivo JSONL incluyen `traceId`,
  `spanId`, `parentSpanId` y `traceFlags` de nivel superior cuando la llamada de registro lleva un contexto
  de traza de diagnóstico válido, lo que permite a los procesadores de registros unir líneas de registro locales con
  intervalos exportados.
- **Correlación de solicitudes:** las solicitudes HTTP del Gateway y los marcos WebSocket crean
  un alcance interno de traza de solicitud. Los registros y eventos de diagnóstico dentro de ese
  alcance heredan la traza de solicitud de forma predeterminada, mientras que los intervalos de ejecución de agente y llamada de modelo
  se crean como hijos para que los encabezados `traceparent` del proveedor permanezcan en la
  misma traza.
- **Correlación de llamadas de modelo:** los intervalos `openclaw.model.call` incluyen tamaños seguros de
  componentes de prompt de forma predeterminada y atributos de tokens por llamada cuando el resultado del proveedor
  expone el uso. `openclaw.model.usage` sigue siendo el intervalo de contabilidad
  a nivel de ejecución para el costo agregado, el contexto y los paneles de canal, y
  permanece en la misma traza de diagnóstico cuando el runtime emisor tiene un contexto
  de traza de confianza.

## Métricas exportadas

### Uso del modelo

- `openclaw.tokens` (contador, atributos: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (contador, atributos: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histograma, atributos: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histograma, atributos: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histograma, métrica de convenciones semánticas de GenAI, atributos: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histograma, segundos, métrica de convenciones semánticas de GenAI, atributos: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` opcional)
- `openclaw.model_call.duration_ms` (histograma, atributos: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, más `openclaw.errorCategory` y `openclaw.failureKind` en errores clasificados)
- `openclaw.model_call.request_bytes` (histograma, tamaño en bytes UTF-8 de la carga final de solicitud del modelo; sin contenido de carga sin procesar)
- `openclaw.model_call.response_bytes` (histograma, tamaño en bytes UTF-8 de las cargas de fragmentos de respuesta transmitida; los deltas de texto de alta frecuencia, pensamiento y llamada de herramienta cuentan solo los bytes incrementales de `delta`; sin contenido de respuesta sin procesar)
- `openclaw.model_call.time_to_first_byte_ms` (histograma, tiempo transcurrido antes del primer evento de respuesta transmitida)
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

### Talk

- `openclaw.talk.event` (contador, atributos: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histograma, atributos: los mismos que `openclaw.talk.event`; emitido cuando un evento de Talk informa duración)
- `openclaw.talk.audio.bytes` (histograma, atributos: los mismos que `openclaw.talk.event`; emitido para eventos de fotogramas de audio de Talk que informan longitud en bytes)

### Colas y sesiones

- `openclaw.queue.lane.enqueue` (contador, atributos: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (contador, atributos: `openclaw.lane`)
- `openclaw.queue.depth` (histograma, atributos: `openclaw.lane` o `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histograma, atributos: `openclaw.lane`)
- `openclaw.session.state` (contador, atributos: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (contador, atributos: `openclaw.state`; emitido para contabilidad de sesión obsoleta recuperable)
- `openclaw.session.stuck_age_ms` (histograma, atributos: `openclaw.state`; emitido para contabilidad de sesión obsoleta recuperable)
- `openclaw.session.turn.created` (contador, atributos: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (contador, atributos: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (contador, atributos: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histograma, atributos: los mismos que el contador de recuperación correspondiente)
- `openclaw.run.attempt` (contador, atributos: `openclaw.attempt`)

### Telemetría de actividad de sesión

`diagnostics.stuckSessionWarnMs` es el umbral de edad sin progreso para los diagnósticos
de actividad de sesión. Una sesión `processing` no envejece hacia este
umbral mientras OpenClaw observe progreso de respuesta, herramienta, estado, bloque o runtime
ACP. Los mantenimientos de escritura no cuentan como progreso, por lo que aún se puede detectar
un modelo o arnés silencioso.

OpenClaw clasifica las sesiones según el trabajo que todavía puede observar:

- `session.long_running`: el trabajo incrustado activo, las llamadas de modelo o las llamadas de herramienta
  siguen progresando. Las llamadas de modelo con propietario que permanecen en silencio pasado
  `diagnostics.stuckSessionWarnMs` también se informan como de larga ejecución antes de
  `diagnostics.stuckSessionAbortMs`, por lo que los proveedores de modelo lentos o sin transmisión
  no parecen sesiones de Gateway atascadas mientras se puedan observar para abortar.
- `session.stalled`: existe trabajo activo, pero la ejecución activa no ha informado
  progreso reciente. Las llamadas de modelo con propietario cambian de `session.long_running` a
  `session.stalled` en `diagnostics.stuckSessionAbortMs` o después; la actividad
  obsoleta de modelo/herramienta sin propietario no se trata como trabajo de larga ejecución inocuo.
  Las ejecuciones incrustadas atascadas permanecen al principio solo en observación y luego abortan y drenan después de
  `diagnostics.stuckSessionAbortMs` sin progreso para que los turnos en cola detrás
  del carril puedan reanudarse. Cuando no se establece, el umbral de aborto usa de forma predeterminada la ventana
  extendida más segura de al menos 5 minutos y 3 veces
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: contabilidad de sesión obsoleta sin trabajo activo, o una sesión
  en cola inactiva con actividad obsoleta de modelo/herramienta sin propietario. Esto libera el
  carril de sesión afectado inmediatamente después de que pasen las puertas de recuperación.

La recuperación emite eventos estructurados `session.recovery.requested` y
`session.recovery.completed`. El estado de sesión de diagnóstico se marca como inactivo
solo después de un resultado de recuperación mutante (`aborted` o `released`) y solo si
la misma generación de procesamiento sigue siendo la actual.

Solo `session.stuck` emite el contador `openclaw.session.stuck`, el
histograma `openclaw.session.stuck_age_ms` y el intervalo `openclaw.session.stuck`.
Los diagnósticos repetidos de `session.stuck` retroceden mientras la sesión permanece
sin cambios, por lo que los paneles deberían alertar ante aumentos sostenidos en lugar de
cada marca de Heartbeat. Para la opción de configuración y los valores predeterminados, consulta
[Referencia de configuración](/es/gateway/configuration-reference#diagnostics).

Las advertencias de actividad también emiten:

- `openclaw.liveness.warning` (contador, atributos: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histograma, atributos: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histograma, atributos: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histograma, atributos: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histograma, atributos: `openclaw.liveness.reason`)

### Ciclo de vida del arnés

- `openclaw.harness.duration_ms` (histograma, atributos: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` en errores)

### Ejecución de herramientas y detección de bucles

- `openclaw.tool.execution.duration_ms` (histograma, atributos: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, más `openclaw.errorCategory` en errores)
- `openclaw.tool.execution.blocked` (contador, atributos: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)
- `openclaw.tool.loop` (contador, atributos: `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` opcional; emitido cuando se detecta un bucle repetitivo de llamadas de herramienta)

### Exec

- `openclaw.exec.duration_ms` (histograma, atributos: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Diagnósticos internos (memoria, cargas, salud del exportador)

- `openclaw.payload.large` (contador, atributos: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histograma, atributos: los mismos que `openclaw.payload.large`)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (histogramas, sin atributos; muestras de memoria del proceso)
- `openclaw.memory.pressure` (contador, atributos: `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (contador, atributos: `openclaw.diagnostic.async_queue.drop_class`; descartes por contrapresión de cola de diagnóstico interna)
- `openclaw.telemetry.exporter.events` (contador, atributos: `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, `openclaw.reason` opcional, `openclaw.errorCategory` opcional; autotelemetría de ciclo de vida/fallo del exportador)

## Intervalos exportados

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (entrada/salida/cache_read/cache_write/total)
  - `gen_ai.system` de forma predeterminada, o `gen_ai.provider.name` cuando se opta por las convenciones semánticas GenAI más recientes
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` de forma predeterminada, o `gen_ai.provider.name` cuando se opta por las convenciones semánticas GenAI más recientes
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory`, `error.type` y `openclaw.failureKind` opcional en errores
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (solo tamaños de componentes seguros, sin texto del prompt)
  - `openclaw.model_call.usage.*` y `gen_ai.usage.*` cuando el resultado de llamada al modelo contiene el uso del proveedor para esa llamada individual
  - Evento de span `openclaw.provider.request` con el atributo `openclaw.upstreamRequestIdHash` (acotado, basado en hash) cuando el resultado del proveedor upstream expone un id de solicitud; los ids sin procesar nunca se exportan
  - Con `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, los spans de llamada al modelo usan el nombre de span de inferencia GenAI más reciente `{gen_ai.operation.name} {gen_ai.request.model}` y el tipo de span `CLIENT` en lugar de `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Al completarse: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - En caso de error: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` opcional
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner` opcional, `openclaw.tool.params.*`
  - `openclaw.errorCategory`/`openclaw.errorCode` opcional en errores, `openclaw.deniedReason` y `openclaw.outcome=blocked` cuando la política o el sandbox lo deniegan
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (sin prompt, historial, respuesta ni contenido de clave de sesión)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` opcional (sin mensajes de bucle, parámetros ni salida de herramienta)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.reason`, `openclaw.memory.rss_bytes`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.heap_total_bytes`, `openclaw.memory.external_bytes`, `openclaw.memory.array_buffers_bytes`, `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms` opcional

Cuando la captura de contenido está habilitada explícitamente, los spans de modelo y herramienta también pueden
incluir atributos `openclaw.content.*` acotados y redactados para las clases de
contenido específicas por las que optaste.

## Catálogo de eventos de diagnóstico

Los eventos siguientes respaldan las métricas y spans anteriores. Los Plugins también pueden
suscribirse a ellos directamente sin exportación OTLP.

**Uso del modelo**

- `model.usage` - tokens, coste, duración, contexto, proveedor/modelo/canal,
  ids de sesión. `usage` es la contabilidad de proveedor/turno para coste y telemetría;
  `context.used` es la instantánea actual de prompt/contexto y puede ser inferior al
  `usage.total` del proveedor cuando intervienen entradas en caché o llamadas de bucle de herramientas.

**Flujo de mensajes**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Cola y sesión**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (contadores agregados: webhooks/cola/sesión)

**Ciclo de vida del harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  ciclo de vida por ejecución para el harness del agente. Incluye `harnessId`, `pluginId`
  opcional, proveedor/modelo/canal e id de ejecución. La finalización añade
  `durationMs`, `outcome`, `resultClassification` opcional, `yieldDetected`
  y recuentos de `itemLifecycle`. Los errores añaden `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` y
  `cleanupFailed` opcional.

**Exec**

- `exec.process.completed` - resultado terminal, duración, destino, modo, código
  de salida y tipo de fallo. El texto del comando y los directorios de trabajo no se
  incluyen.
- `exec.approval.followup_suppressed` - seguimiento de aprobación obsoleto descartado
  tras un rebote de sesión. Incluye `approvalId`, `reason`
  (`session_rebound`), `phase` (`direct_delivery` o `gateway_preflight`)
  y la marca de tiempo del dispatcher. No se incluyen claves de sesión, rutas ni texto
  del comando.

## Sin un exportador

Mantén los eventos de diagnóstico disponibles para Plugins o receptores personalizados sin ejecutar
`diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Para una salida de depuración dirigida sin aumentar `logging.level`, usa las banderas de diagnóstico. Las banderas no distinguen entre mayúsculas y minúsculas y admiten comodines (`telegram.*` o
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

O como sobrescritura puntual de variable de entorno:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

La salida de banderas va al archivo de registro estándar (`logging.file`) y aun así
se redacta mediante `logging.redactSensitive`. Guía completa:
[Banderas de diagnóstico](/es/diagnostics/flags).

## Deshabilitar

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

O deja `diagnostics-otel` fuera de `plugins.allow`, o ejecuta
`openclaw plugins disable diagnostics-otel`.

## Relacionado

- [Registro](/es/logging) - registros en archivo, salida de consola, seguimiento desde CLI y la pestaña Registros de Control UI
- [Elementos internos del registro de Gateway](/es/gateway/logging) - estilos de registro de WS, prefijos de subsistema y captura de consola
- [Banderas de diagnóstico](/es/diagnostics/flags) - banderas de registro de depuración dirigido
- [Exportación de diagnóstico](/es/gateway/diagnostics) - herramienta de paquete de soporte para operadores (separada de la exportación OTEL)
- [Referencia de configuración](/es/gateway/configuration-reference#diagnostics) - referencia completa de campos `diagnostics.*`
