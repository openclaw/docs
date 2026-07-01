---
read_when:
    - Quieres enviar métricas de uso del modelo, flujo de mensajes o sesiones de OpenClaw a un recopilador de OpenTelemetry
    - Estás conectando trazas, métricas o registros a Grafana, Datadog, Honeycomb, New Relic, Tempo u otro backend OTLP
    - Necesitas los nombres exactos de las métricas, los nombres de los spans o las formas de los atributos para crear paneles o alertas
summary: Exporta diagnósticos de OpenClaw a recopiladores OpenTelemetry o stdout JSONL mediante el Plugin diagnostics-otel
title: Exportación de OpenTelemetry
x-i18n:
    generated_at: "2026-07-01T05:29:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2e23876db9446a97545f01436326d08aadf222ec41a326749fd084779a7259f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporta diagnósticos mediante el Plugin oficial `diagnostics-otel`
usando **OTLP/HTTP (protobuf)**. Los registros también se pueden escribir como JSONL en stdout para
canalizaciones de registros de contenedores y sandboxes. Cualquier recopilador o backend que acepte
OTLP/HTTP funciona sin cambios de código. Para registros en archivos locales y cómo leerlos,
consulta [Registro](/es/logging).

## Cómo encaja todo

- Los **eventos de diagnóstico** son registros estructurados, en proceso, emitidos por el
  Gateway y los plugins incluidos para ejecuciones de modelos, flujo de mensajes, sesiones, colas
  y exec.
- El **Plugin `diagnostics-otel`** se suscribe a esos eventos y los exporta como
  **métricas**, **trazas** y **registros** de OpenTelemetry mediante OTLP/HTTP. También puede
  reflejar registros de diagnóstico en JSONL por stdout.
- Las **llamadas a proveedores** reciben un encabezado W3C `traceparent` desde el contexto
  de span de llamada de modelo de confianza de OpenClaw cuando el transporte del proveedor acepta encabezados
  personalizados. El contexto de traza emitido por plugins no se propaga.
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

| Señal       | Qué contiene                                                                                                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Métricas** | Contadores e histogramas de uso de tokens, coste, duración de ejecución, conmutación por error, uso de Skills, flujo de mensajes, eventos de Talk, carriles de cola, estado/recuperación de sesión, ejecución de herramientas, cargas sobredimensionadas, exec y presión de memoria. |
| **Trazas**  | Spans de uso de modelos, llamadas a modelos, ciclo de vida del harness, uso de Skills, ejecución de herramientas, exec, procesamiento de webhook/mensajes, ensamblaje de contexto y bucles de herramientas.                    |
| **Registros** | Registros estructurados de `logging.file` exportados mediante OTLP o JSONL por stdout cuando `diagnostics.otel.logs` está habilitado; los cuerpos de los registros se retienen salvo que la captura de contenido se habilite explícitamente. |

Activa o desactiva `traces`, `metrics` y `logs` de forma independiente. Las trazas y métricas
están activadas de forma predeterminada cuando `diagnostics.otel.enabled` es true. Los registros están desactivados de forma predeterminada y
se exportan solo cuando `diagnostics.otel.logs` es explícitamente `true`. La exportación de registros
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

| Variable                                                                                                          | Propósito                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Sobrescribe `diagnostics.otel.endpoint`. Si el valor ya contiene `/v1/traces`, `/v1/metrics` o `/v1/logs`, se usa tal cual.                                                                                                                                                                                                                                 |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Sobrescrituras de endpoint específicas de señal usadas cuando la clave de configuración `diagnostics.otel.*Endpoint` correspondiente no está definida. La configuración específica de señal prevalece sobre la variable de entorno específica de señal, que prevalece sobre el endpoint compartido.                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Sobrescribe `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                                 |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Sobrescribe el protocolo de transporte (hoy solo se respeta `http/protobuf`).                                                                                                                                                                                                                                                                               |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Establécelo en `gen_ai_latest_experimental` para emitir la forma experimental más reciente del span de inferencia GenAI, incluidos nombres de span `{gen_ai.operation.name} {gen_ai.request.model}`, tipo de span `CLIENT` y `gen_ai.provider.name` en lugar del `gen_ai.system` heredado. Las métricas GenAI siempre usan atributos semánticos acotados y de baja cardinalidad. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Establécelo en `1` cuando otra precarga o proceso host ya haya registrado el SDK global de OpenTelemetry. Entonces el Plugin omite su propio ciclo de vida de NodeSDK, pero aun así conecta los escuchas de diagnóstico y respeta `traces`/`metrics`/`logs`.                                                                                                |

## Privacidad y captura de contenido

El contenido sin procesar de modelos/herramientas **no** se exporta de forma predeterminada. Los spans llevan
identificadores acotados (canal, proveedor, modelo, categoría de error, ids de solicitud solo como hash,
origen de herramienta, propietario de herramienta y nombre/origen de skill) y nunca incluyen texto de prompts,
texto de respuestas, entradas de herramientas, salidas de herramientas, rutas de archivos de Skills ni claves de sesión.
Los registros OTLP conservan gravedad, logger, ubicación de código, contexto de traza de confianza
y atributos saneados de forma predeterminada, pero el cuerpo del mensaje de registro sin procesar se exporta
solo cuando `diagnostics.otel.captureContent` se establece en booleano `true`. Las subclaves granulares
`captureContent.*` no habilitan los cuerpos de registro. Las etiquetas que parecen
claves de sesión de agente con ámbito se sustituyen por `unknown`.
Las métricas de Talk exportan solo metadatos de evento acotados, como modo, transporte,
proveedor y tipo de evento. No incluyen transcripciones, cargas de audio,
ids de sesión, ids de turno, ids de llamada, ids de sala ni tokens de transferencia.

Las solicitudes salientes a modelos pueden incluir un encabezado W3C `traceparent`. Ese encabezado se
genera solo a partir del contexto de traza de diagnóstico propiedad de OpenClaw para la llamada activa al modelo.
Los encabezados `traceparent` existentes proporcionados por el llamador se reemplazan, por lo que los plugins u
opciones de proveedor personalizadas no pueden falsificar la ascendencia de trazas entre servicios.

Establece `diagnostics.otel.captureContent.*` en `true` solo cuando tu recopilador y
política de retención estén aprobados para texto de prompts, respuestas, herramientas o prompts de sistema.
Cada subclave es opt-in de forma independiente:

- `inputMessages` - contenido del prompt del usuario.
- `outputMessages` - contenido de la respuesta del modelo.
- `toolInputs` - cargas de argumentos de herramientas.
- `toolOutputs` - cargas de resultados de herramientas.
- `systemPrompt` - prompt de sistema/desarrollador ensamblado.
- `toolDefinitions` - nombres, descripciones y esquemas de herramientas del modelo.

Cuando se habilita cualquier subclave, los spans de modelo y herramienta reciben atributos
`openclaw.content.*` acotados y redactados solo para esa clase. Usa el booleano
`captureContent: true` solo para capturas amplias de diagnóstico donde los cuerpos de los mensajes de registro OTLP
también estén aprobados para exportación.

El contenido de `toolInputs`/`toolOutputs` se captura para las ejecuciones de herramientas del runtime de agente
integrado (`openclaw.content.tool_input` en spans completados/con error,
`openclaw.content.tool_output` en spans completados). Las llamadas a herramientas de harnesses externos
(Codex, Claude CLI) emiten spans `tool.execution.*` sin cargas de contenido.
El contenido capturado viaja por un canal de confianza, solo para escuchas, y nunca se coloca
en el bus público de eventos de diagnóstico.

## Muestreo y vaciado

- **Trazas:** `diagnostics.otel.sampleRate` (solo span raíz, `0.0` descarta todo,
  `1.0` conserva todo).
- **Métricas:** `diagnostics.otel.flushIntervalMs` (mínimo `1000`).
- **Registros:** los registros OTLP respetan `logging.level` (nivel de registro de archivo). Usan la
  ruta de censura de registros de diagnóstico, no el formato de consola. Las instalaciones de alto volumen
  deberían preferir el muestreo/filtrado del recopilador OTLP frente al muestreo local.
  Establece `diagnostics.otel.logsExporter: "stdout"` cuando tu plataforma ya
  envía stdout/stderr a un procesador de registros y no tienes un recopilador
  de registros OTLP. Los registros de stdout son un objeto JSON por línea con `ts`, `signal`,
  `service.name`, gravedad, cuerpo, atributos censurados y campos de traza de confianza
  cuando están disponibles.
- **Correlación de registros de archivo:** los registros de archivo JSONL incluyen `traceId`,
  `spanId`, `parentSpanId` y `traceFlags` de nivel superior cuando la llamada de registro lleva un
  contexto de traza de diagnóstico válido, lo que permite a los procesadores de registros unir líneas de registro locales con
  spans exportados.
- **Correlación de solicitudes:** las solicitudes HTTP del Gateway y los frames WebSocket crean un
  ámbito interno de traza de solicitud. Los registros y eventos de diagnóstico dentro de ese ámbito
  heredan la traza de solicitud de forma predeterminada, mientras que los spans de ejecución de agente y llamada de modelo se
  crean como hijos para que los encabezados `traceparent` del proveedor permanezcan en la misma traza.
- **Correlación de llamadas de modelo:** los spans `openclaw.model.call` incluyen tamaños seguros de
  componentes de prompt de forma predeterminada e incluyen atributos de tokens por llamada cuando el
  resultado del proveedor expone el uso. `openclaw.model.usage` sigue siendo el span de contabilidad
  de nivel de ejecución para el coste agregado, el contexto y los paneles de canales; permanece
  en la misma traza de diagnóstico cuando el runtime emisor tiene un contexto de traza
  de confianza.

## Métricas exportadas

### Uso del modelo

- `openclaw.tokens` (contador, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (contador, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histograma, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histograma, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histograma, métrica de convenciones semánticas de GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histograma, segundos, métrica de convenciones semánticas de GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` opcional)
- `openclaw.model_call.duration_ms` (histograma, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, más `openclaw.errorCategory` y `openclaw.failureKind` en errores clasificados)
- `openclaw.model_call.request_bytes` (histograma, tamaño en bytes UTF-8 de la carga final de solicitud del modelo; sin contenido sin procesar de la carga)
- `openclaw.model_call.response_bytes` (histograma, tamaño en bytes UTF-8 de las cargas de fragmentos de respuesta transmitida; los deltas de texto de alta frecuencia, razonamiento y llamada de herramienta cuentan solo bytes `delta` incrementales; sin contenido sin procesar de la respuesta)
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

### Conversación

- `openclaw.talk.event` (contador, attrs: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histograma, attrs: igual que `openclaw.talk.event`; emitido cuando un evento de conversación informa duración)
- `openclaw.talk.audio.bytes` (histograma, attrs: igual que `openclaw.talk.event`; emitido para eventos de frame de audio de conversación que informan longitud en bytes)

### Colas y sesiones

- `openclaw.queue.lane.enqueue` (contador, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (contador, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histograma, attrs: `openclaw.lane` o `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histograma, attrs: `openclaw.lane`)
- `openclaw.session.state` (contador, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (contador, attrs: `openclaw.state`; emitido para contabilidad recuperable de sesiones obsoletas)
- `openclaw.session.stuck_age_ms` (histograma, attrs: `openclaw.state`; emitido para contabilidad recuperable de sesiones obsoletas)
- `openclaw.session.turn.created` (contador, attrs: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (contador, attrs: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (contador, attrs: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histograma, attrs: igual que el contador de recuperación correspondiente)
- `openclaw.run.attempt` (contador, attrs: `openclaw.attempt`)

### Telemetría de actividad de sesión

`diagnostics.stuckSessionWarnMs` es el umbral de antigüedad sin progreso para diagnósticos
de actividad de sesión. Una sesión `processing` no avanza hacia este umbral
mientras OpenClaw observa progreso de respuesta, herramienta, estado, bloque o runtime ACP.
Los keepalives de escritura no se cuentan como progreso, por lo que un modelo o harness silencioso
aún puede detectarse.

OpenClaw clasifica las sesiones por el trabajo que todavía puede observar:

- `session.long_running`: el trabajo incrustado activo, las llamadas de modelo o las llamadas de herramienta
  siguen progresando. Las llamadas de modelo con propietario que permanecen silenciosas después de
  `diagnostics.stuckSessionWarnMs` también se notifican como de larga duración antes de
  `diagnostics.stuckSessionAbortMs` para que los proveedores de modelos lentos o sin streaming no
  parezcan sesiones de Gateway detenidas mientras sigan siendo observables para anulación.
- `session.stalled`: existe trabajo activo, pero la ejecución activa no ha informado
  progreso reciente. Las llamadas de modelo con propietario cambian de `session.long_running` a
  `session.stalled` en o después de `diagnostics.stuckSessionAbortMs`; la actividad
  obsoleta de modelo/herramienta sin propietario no se trata como trabajo de larga duración inofensivo.
  Las ejecuciones incrustadas detenidas permanecen primero solo en observación y luego se abortan-drenan después de
  `diagnostics.stuckSessionAbortMs` sin progreso para que los turnos en cola detrás del
  carril puedan reanudarse. Cuando no está configurado, el umbral de anulación usa de forma predeterminada la ventana
  extendida más segura de al menos 5 minutos y 3 veces
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: contabilidad de sesión obsoleta sin trabajo activo, o una sesión en cola
  inactiva con actividad de modelo/herramienta obsoleta sin propietario. Esto libera el
  carril de sesión afectado inmediatamente después de que pasen las puertas de recuperación.

La recuperación emite eventos estructurados `session.recovery.requested` y
`session.recovery.completed`. El estado de sesión de diagnóstico se marca como inactivo
solo después de un resultado de recuperación mutante (`aborted` o `released`) y solo si la
misma generación de procesamiento sigue siendo la actual.

Solo `session.stuck` emite el contador `openclaw.session.stuck`, el
histograma `openclaw.session.stuck_age_ms` y el span `openclaw.session.stuck`.
Los diagnósticos repetidos de `session.stuck` aplican retroceso mientras la sesión permanece
sin cambios, por lo que los paneles deberían alertar sobre aumentos sostenidos en lugar de cada
tick de Heartbeat. Para el ajuste de configuración y los valores predeterminados, consulta
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

### Componentes internos de diagnóstico (memoria y bucle de herramientas)

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
  - `openclaw.tokens.*` (entrada/salida/cache_read/cache_write/total)
  - `gen_ai.system` de forma predeterminada, o `gen_ai.provider.name` cuando se opta por usar las convenciones semánticas GenAI más recientes
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` de forma predeterminada, o `gen_ai.provider.name` cuando se opta por usar las convenciones semánticas GenAI más recientes
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` y `openclaw.failureKind` opcional en errores
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (solo tamaños seguros de componentes, sin texto del prompt)
  - `openclaw.model_call.usage.*` y `gen_ai.usage.*` cuando el resultado de la llamada al modelo lleva el uso del proveedor para esa llamada individual
  - `openclaw.provider.request_id_hash` (hash acotado basado en SHA del id de solicitud del proveedor ascendente; los ids sin procesar no se exportan)
  - Con `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, los spans de llamada al modelo usan el nombre de span de inferencia GenAI más reciente `{gen_ai.operation.name} {gen_ai.request.model}` y el tipo de span `CLIENT` en lugar de `openclaw.model.call`.
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

Cuando la captura de contenido está habilitada explícitamente, los spans de modelo y herramienta también pueden
incluir atributos `openclaw.content.*` acotados y censurados para las clases de
contenido específicas por las que optaste.

## Catálogo de eventos de diagnóstico

Los eventos siguientes respaldan las métricas y spans anteriores. Los plugins también pueden suscribirse
a ellos directamente sin exportación OTLP.

**Uso del modelo**

- `model.usage` - tokens, costo, duración, contexto, proveedor/modelo/canal,
  ids de sesión. `usage` es la contabilidad del proveedor/turno para costo y telemetría;
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

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  ciclo de vida por ejecución del arnés del agente. Incluye `harnessId`, `pluginId`
  opcional, proveedor/modelo/canal e id de ejecución. Al completarse agrega
  `durationMs`, `outcome`, `resultClassification` opcional, `yieldDetected`,
  y recuentos de `itemLifecycle`. Los errores agregan `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory`, y
  `cleanupFailed` opcional.

**Exec**

- `exec.process.completed` - resultado terminal, duración, destino, modo, código de
  salida y tipo de fallo. El texto del comando y los directorios de trabajo no se
  incluyen.
- `exec.approval.followup_suppressed` - seguimiento de aprobación obsoleto descartado después de
  un rebote de sesión. Incluye `approvalId`, `reason` (`session_rebound`),
  `phase` (`direct_delivery` o `gateway_preflight`) y la marca de tiempo del despachador.
  No se incluyen claves de sesión, rutas ni texto de comando.

## Sin un exportador

Puedes mantener los eventos de diagnóstico disponibles para plugins o receptores personalizados sin
ejecutar `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Para una salida de depuración dirigida sin aumentar `logging.level`, usa indicadores de diagnóstico.
Los indicadores no distinguen mayúsculas/minúsculas y admiten comodines (por ejemplo, `telegram.*` o
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

O como una anulación puntual mediante variable de entorno:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

La salida de indicadores va al archivo de registro estándar (`logging.file`) y sigue
censurada por `logging.redactSensitive`. Guía completa:
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

- [Registros](/es/logging) - registros en archivo, salida de consola, seguimiento de CLI y la pestaña Registros de la Control UI
- [Aspectos internos del registro del Gateway](/es/gateway/logging) - estilos de registro WS, prefijos de subsistema y captura de consola
- [Indicadores de diagnóstico](/es/diagnostics/flags) - indicadores de registro de depuración dirigido
- [Exportación de diagnóstico](/es/gateway/diagnostics) - herramienta de paquete de soporte para operadores (separada de la exportación OTEL)
- [Referencia de configuración](/es/gateway/configuration-reference#diagnostics) - referencia completa de campos `diagnostics.*`
