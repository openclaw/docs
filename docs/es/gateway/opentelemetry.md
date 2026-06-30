---
read_when:
    - Quiere enviar métricas de uso del modelo de OpenClaw, flujo de mensajes o sesión a un recopilador de OpenTelemetry
    - Estás integrando trazas, métricas o registros en Grafana, Datadog, Honeycomb, New Relic, Tempo u otro backend OTLP
    - Necesitas los nombres exactos de las métricas, los nombres de los spans o las formas de los atributos para crear paneles o alertas
summary: Exporta diagnósticos de OpenClaw a recopiladores de OpenTelemetry o JSONL en stdout mediante el plugin diagnostics-otel
title: Exportación de OpenTelemetry
x-i18n:
    generated_at: "2026-06-30T13:47:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9cdac72cb4a2910e6ef52e60a5f2266a2667c53cf003d63908f04d284e427b0
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporta diagnósticos mediante el Plugin oficial `diagnostics-otel`
usando **OTLP/HTTP (protobuf)**. Los logs también se pueden escribir como JSONL en stdout para
canalizaciones de logs de contenedores y sandboxes. Cualquier recopilador o backend que acepte
OTLP/HTTP funciona sin cambios de código. Para logs en archivos locales y cómo leerlos,
consulta [Registro](/es/logging).

## Cómo encaja todo

- Los **eventos de diagnóstico** son registros estructurados en proceso emitidos por el
  Gateway y los plugins incluidos para ejecuciones de modelos, flujo de mensajes, sesiones, colas
  y exec.
- El **Plugin `diagnostics-otel`** se suscribe a esos eventos y los exporta como
  **métricas**, **trazas** y **logs** de OpenTelemetry sobre OTLP/HTTP. También puede
  duplicar registros de logs de diagnóstico en JSONL por stdout.
- Las **llamadas a proveedores** reciben un encabezado W3C `traceparent` desde el contexto
  de span de llamada de modelo de confianza de OpenClaw cuando el transporte del proveedor acepta
  encabezados personalizados. El contexto de traza emitido por plugins no se propaga.
- Los exportadores solo se adjuntan cuando tanto la superficie de diagnóstico como el Plugin están
  habilitados, por lo que el coste en proceso se mantiene cerca de cero de forma predeterminada.

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
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Métricas** | Contadores e histogramas para uso de tokens, coste, duración de ejecución, conmutación por error, uso de Skills, flujo de mensajes, eventos de Talk, carriles de cola, estado/recuperación de sesión, ejecución de herramientas, cargas sobredimensionadas, exec y presión de memoria. |
| **Trazas**  | Spans para uso de modelos, llamadas de modelos, ciclo de vida del harness, uso de Skills, ejecución de herramientas, exec, procesamiento de webhooks/mensajes, ensamblaje de contexto y bucles de herramientas.                                     |
| **Logs**    | Registros estructurados `logging.file` exportados por OTLP o JSONL en stdout cuando `diagnostics.otel.logs` está habilitado; los cuerpos de log se retienen salvo que la captura de contenido se habilite explícitamente.                           |

Activa o desactiva `traces`, `metrics` y `logs` de forma independiente. Las trazas y métricas
están activadas de forma predeterminada cuando `diagnostics.otel.enabled` es true. Los logs están desactivados de forma predeterminada y
se exportan solo cuando `diagnostics.otel.logs` es explícitamente `true`. La exportación de logs
usa OTLP de forma predeterminada; establece `diagnostics.otel.logsExporter` en `stdout` para JSONL en
stdout, o en `both` para enviar cada registro de log de diagnóstico a OTLP y stdout.

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

| Variable                                                                                                          | Propósito                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Sobrescribe `diagnostics.otel.endpoint`. Si el valor ya contiene `/v1/traces`, `/v1/metrics` o `/v1/logs`, se usa tal cual.                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Sobrescrituras de endpoints específicos de señal usadas cuando la clave de configuración `diagnostics.otel.*Endpoint` correspondiente no está definida. La configuración específica de señal prevalece sobre el env específico de señal, que prevalece sobre el endpoint compartido.                                                     |
| `OTEL_SERVICE_NAME`                                                                                               | Sobrescribe `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Sobrescribe el protocolo de transmisión (hoy solo se respeta `http/protobuf`).                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Establécelo en `gen_ai_latest_experimental` para emitir la forma de span experimental más reciente de inferencia GenAI, incluidos nombres de span `{gen_ai.operation.name} {gen_ai.request.model}`, tipo de span `CLIENT` y `gen_ai.provider.name` en lugar del `gen_ai.system` heredado. Las métricas GenAI siempre usan atributos semánticos acotados y de baja cardinalidad. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Establécelo en `1` cuando otro preload o proceso host ya haya registrado el SDK global de OpenTelemetry. Entonces el Plugin omite su propio ciclo de vida de NodeSDK, pero sigue conectando listeners de diagnóstico y respeta `traces`/`metrics`/`logs`.                                                                                   |

## Privacidad y captura de contenido

El contenido sin procesar de modelos/herramientas **no** se exporta de forma predeterminada. Los spans llevan
identificadores acotados (canal, proveedor, modelo, categoría de error, ids de solicitud solo con hash,
origen de herramienta, propietario de herramienta y nombre/origen de Skill) y nunca incluyen texto de prompt,
texto de respuesta, entradas de herramientas, salidas de herramientas, rutas de archivos de Skills ni claves de sesión.
Los registros de log OTLP conservan gravedad, logger, ubicación de código, contexto de traza de confianza
y atributos saneados de forma predeterminada, pero el cuerpo del mensaje de log sin procesar se exporta
solo cuando `diagnostics.otel.captureContent` se establece en booleano `true`. Las subclaves granulares
`captureContent.*` no habilitan los cuerpos de log. Las etiquetas que parecen claves
de sesión de agente con ámbito se sustituyen por `unknown`.
Las métricas de Talk exportan solo metadatos de evento acotados, como modo, transporte,
proveedor y tipo de evento. No incluyen transcripciones, cargas de audio,
ids de sesión, ids de turno, ids de llamada, ids de sala ni tokens de traspaso.

Las solicitudes salientes de modelo pueden incluir un encabezado W3C `traceparent`. Ese encabezado se
genera solo desde el contexto de traza de diagnóstico propiedad de OpenClaw para la llamada de modelo activa.
Los encabezados `traceparent` existentes proporcionados por el llamador se reemplazan, por lo que los plugins o
las opciones personalizadas de proveedor no pueden suplantar la ascendencia de trazas entre servicios.

Establece `diagnostics.otel.captureContent.*` en `true` solo cuando tu recopilador y
política de retención estén aprobados para texto de prompt, respuesta, herramienta o prompt del sistema.
Cada subclave es opt-in de forma independiente:

- `inputMessages` - contenido del prompt del usuario.
- `outputMessages` - contenido de la respuesta del modelo.
- `toolInputs` - cargas de argumentos de herramientas.
- `toolOutputs` - cargas de resultados de herramientas.
- `systemPrompt` - prompt de sistema/desarrollador ensamblado.
- `toolDefinitions` - nombres, descripciones y esquemas de herramientas del modelo.

Cuando cualquier subclave está habilitada, los spans de modelo y herramienta reciben atributos
`openclaw.content.*` acotados y redactados solo para esa clase. Usa el booleano
`captureContent: true` solo para capturas de diagnóstico amplias donde los cuerpos de mensajes de log OTLP
también estén aprobados para exportación.

El contenido de `toolInputs`/`toolOutputs` se captura para las ejecuciones de herramientas del runtime de agente integrado
(`openclaw.content.tool_input` en spans completados/de error,
`openclaw.content.tool_output` en spans completados). Las llamadas de herramientas de harness externos
(Codex, Claude CLI) emiten spans `tool.execution.*` sin cargas de contenido.
El contenido capturado viaja por un canal de confianza, solo para listeners, y nunca se coloca
en el bus público de eventos de diagnóstico.

## Muestreo y vaciado

- **Trazas:** `diagnostics.otel.sampleRate` (solo tramo raíz, `0.0` descarta todo,
  `1.0` conserva todo).
- **Métricas:** `diagnostics.otel.flushIntervalMs` (mínimo `1000`).
- **Registros:** los registros OTLP respetan `logging.level` (nivel de registro del archivo). Usan la
  ruta de redacción de registros diagnósticos, no el formato de consola. Las instalaciones de alto volumen
  deben preferir el muestreo/filtrado del recopilador OTLP frente al muestreo local.
  Establece `diagnostics.otel.logsExporter: "stdout"` cuando tu plataforma ya
  envía stdout/stderr a un procesador de registros y no tienes un recopilador de registros OTLP.
  Los registros de stdout son un objeto JSON por línea con `ts`, `signal`,
  `service.name`, severidad, cuerpo, atributos redactados y campos de traza confiables
  cuando estén disponibles.
- **Correlación de registros de archivo:** los registros de archivo JSONL incluyen `traceId`,
  `spanId`, `parentSpanId` y `traceFlags` de nivel superior cuando la llamada de registro lleva un
  contexto de traza diagnóstica válido, lo que permite a los procesadores de registros unir líneas de registro locales con
  tramos exportados.
- **Correlación de solicitudes:** las solicitudes HTTP del Gateway y los marcos WebSocket crean un
  ámbito interno de traza de solicitud. Los registros y eventos diagnósticos dentro de ese ámbito
  heredan la traza de la solicitud de forma predeterminada, mientras que los tramos de ejecución de agente y llamada a modelo se
  crean como hijos para que los encabezados `traceparent` del proveedor permanezcan en la misma traza.
- **Correlación de llamadas a modelo:** los tramos `openclaw.model.call` incluyen tamaños seguros de componentes de prompt
  de forma predeterminada e incluyen atributos de tokens por llamada cuando el
  resultado del proveedor expone el uso. `openclaw.model.usage` sigue siendo el tramo de contabilidad a nivel de ejecución
  para coste agregado, contexto y paneles de canales; permanece
  en la misma traza diagnóstica cuando el runtime emisor tiene contexto de traza confiable.

## Métricas exportadas

### Uso de modelos

- `openclaw.tokens` (contador, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (contador, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histograma, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histograma, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histograma, métrica de convenciones semánticas GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histograma, segundos, métrica de convenciones semánticas GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` opcional)
- `openclaw.model_call.duration_ms` (histograma, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, más `openclaw.errorCategory` y `openclaw.failureKind` en errores clasificados)
- `openclaw.model_call.request_bytes` (histograma, tamaño en bytes UTF-8 de la carga útil final de la solicitud al modelo; sin contenido sin procesar de la carga útil)
- `openclaw.model_call.response_bytes` (histograma, tamaño en bytes UTF-8 de las cargas útiles de fragmentos de respuesta transmitidos; el texto de alta frecuencia, el razonamiento y los deltas de llamadas a herramientas cuentan solo bytes `delta` incrementales; sin contenido sin procesar de la respuesta)
- `openclaw.model_call.time_to_first_byte_ms` (histograma, tiempo transcurrido antes del primer evento de respuesta transmitido)
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

### Conversación

- `openclaw.talk.event` (contador, attrs: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histograma, attrs: igual que `openclaw.talk.event`; emitido cuando un evento de Conversación informa duración)
- `openclaw.talk.audio.bytes` (histograma, attrs: igual que `openclaw.talk.event`; emitido para eventos de marcos de audio de Conversación que informan longitud en bytes)

### Colas y sesiones

- `openclaw.queue.lane.enqueue` (contador, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (contador, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histograma, attrs: `openclaw.lane` o `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histograma, attrs: `openclaw.lane`)
- `openclaw.session.state` (contador, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (contador, attrs: `openclaw.state`; emitido para contabilidad de sesiones obsoletas recuperables)
- `openclaw.session.stuck_age_ms` (histograma, attrs: `openclaw.state`; emitido para contabilidad de sesiones obsoletas recuperables)
- `openclaw.session.turn.created` (contador, attrs: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (contador, attrs: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (contador, attrs: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histograma, attrs: igual que el contador de recuperación correspondiente)
- `openclaw.run.attempt` (contador, attrs: `openclaw.attempt`)

### Telemetría de actividad de sesiones

`diagnostics.stuckSessionWarnMs` es el umbral de antigüedad sin progreso para los diagnósticos de
actividad de sesiones. Una sesión `processing` no envejece hacia este umbral
mientras OpenClaw observe progreso de respuesta, herramienta, estado, bloque o runtime ACP.
Los keepalives de escritura no se cuentan como progreso, por lo que un modelo o harness silencioso aún puede
detectarse.

OpenClaw clasifica las sesiones por el trabajo que todavía puede observar:

- `session.long_running`: el trabajo integrado activo, las llamadas a modelos o las llamadas a herramientas
  siguen progresando. Las llamadas a modelos con propietario que permanecen en silencio más allá de
  `diagnostics.stuckSessionWarnMs` también se informan como de larga duración antes de
  `diagnostics.stuckSessionAbortMs` para que los proveedores de modelos lentos o sin streaming no
  parezcan sesiones de Gateway bloqueadas mientras sigan siendo observables para abortar.
- `session.stalled`: existe trabajo activo, pero la ejecución activa no ha informado
  progreso reciente. Las llamadas a modelos con propietario cambian de `session.long_running` a
  `session.stalled` en o después de `diagnostics.stuckSessionAbortMs`; la actividad obsoleta de modelo/herramienta
  sin propietario no se trata como trabajo de larga duración inofensivo.
  Las ejecuciones integradas bloqueadas permanecen al principio solo en observación y luego abortan y drenan después de
  `diagnostics.stuckSessionAbortMs` sin progreso para que los turnos en cola detrás del
  lane puedan reanudarse. Cuando no se establece, el umbral de aborto usa de forma predeterminada la ventana
  extendida más segura de al menos 5 minutos y 3x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: contabilidad de sesión obsoleta sin trabajo activo, o una sesión
  en cola inactiva con actividad obsoleta de modelo/herramienta sin propietario. Esto libera el
  lane de sesión afectado inmediatamente después de que pasen las compuertas de recuperación.

La recuperación emite eventos estructurados `session.recovery.requested` y
`session.recovery.completed`. El estado de sesión diagnóstica se marca como inactivo
solo después de un resultado de recuperación mutante (`aborted` o `released`) y solo si la
misma generación de procesamiento sigue siendo la actual.

Solo `session.stuck` emite el contador `openclaw.session.stuck`, el
histograma `openclaw.session.stuck_age_ms` y el tramo `openclaw.session.stuck`.
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

### Ciclo de vida del harness

- `openclaw.harness.duration_ms` (histograma, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` en errores)

### Ejecución de herramientas

- `openclaw.tool.execution.duration_ms` (histograma, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, más `openclaw.errorCategory` en errores)
- `openclaw.tool.execution.blocked` (contador, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (histograma, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Internos de diagnósticos (memoria y bucle de herramientas)

- `openclaw.payload.large` (contador, attrs: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histograma, attrs: igual que `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (histograma, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histograma)
- `openclaw.memory.pressure` (contador, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (contador, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histograma, attrs: `openclaw.toolName`, `openclaw.outcome`)

## Tramos exportados

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
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (solo tamaños seguros de componentes, sin texto del prompt)
  - `openclaw.model_call.usage.*` y `gen_ai.usage.*` cuando el resultado de la llamada al modelo incluye uso del proveedor para esa llamada individual
  - `openclaw.provider.request_id_hash` (hash acotado basado en SHA del id de solicitud del proveedor ascendente; los ids sin procesar no se exportan)
  - Con `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, los spans de llamada al modelo usan el nombre de span de inferencia GenAI más reciente `{gen_ai.operation.name} {gen_ai.request.model}` y el tipo de span `CLIENT` en lugar de `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Al completarse: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - En error: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` opcional
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (sin prompt, historial, respuesta ni contenido de clave de sesión)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (sin mensajes del bucle, parámetros ni salida de herramienta)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Cuando la captura de contenido está habilitada explícitamente, los spans de modelo y herramienta también pueden
incluir atributos `openclaw.content.*` acotados y redactados para las clases de
contenido específicas que habilitaste.

## Catálogo de eventos de diagnóstico

Los eventos siguientes respaldan las métricas y spans anteriores. Los plugins también pueden suscribirse
a ellos directamente sin exportación OTLP.

**Uso del modelo**

- `model.usage` - tokens, coste, duración, contexto, proveedor/modelo/canal,
  ids de sesión. `usage` es la contabilidad de proveedor/turno para coste y telemetría;
  `context.used` es la instantánea actual de prompt/contexto y puede ser menor que
  el `usage.total` del proveedor cuando intervienen entrada en caché o llamadas de bucle de herramientas.

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
  opcional, proveedor/modelo/canal e id de ejecución. La finalización añade
  `durationMs`, `outcome`, `resultClassification` opcional, `yieldDetected`,
  y conteos de `itemLifecycle`. Los errores añaden `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, y
  `cleanupFailed` opcional.

**Exec**

- `exec.process.completed` - resultado terminal, duración, destino, modo, código de salida
  y tipo de fallo. El texto del comando y los directorios de trabajo no se
  incluyen.

## Sin exportador

Puedes mantener los eventos de diagnóstico disponibles para plugins o sumideros personalizados sin
ejecutar `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Para salida de depuración dirigida sin aumentar `logging.level`, usa indicadores de diagnóstico.
Los indicadores no distinguen mayúsculas y minúsculas y admiten comodines (por ejemplo, `telegram.*` o
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

La salida de indicadores va al archivo de registro estándar (`logging.file`) y sigue
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

- [Registro](/es/logging) - registros en archivo, salida de consola, seguimiento desde CLI y la pestaña Registros de Control UI
- [Detalles internos de registro de Gateway](/es/gateway/logging) - estilos de registro WS, prefijos de subsistema y captura de consola
- [Indicadores de diagnóstico](/es/diagnostics/flags) - indicadores de registro de depuración dirigidos
- [Exportación de diagnóstico](/es/gateway/diagnostics) - herramienta de paquete de soporte para operadores (separada de la exportación OTEL)
- [Referencia de configuración](/es/gateway/configuration-reference#diagnostics) - referencia completa de campos `diagnostics.*`
