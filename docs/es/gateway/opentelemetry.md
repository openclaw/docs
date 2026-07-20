---
read_when:
    - Quiere enviar métricas de uso de modelos, flujo de mensajes o sesiones de OpenClaw a un recopilador de OpenTelemetry
    - Está conectando trazas, métricas o registros a Grafana, Datadog, Honeycomb, New Relic, Tempo u otro backend OTLP
    - Necesita los nombres exactos de las métricas, los nombres de los intervalos o las estructuras de los atributos para crear paneles o alertas.
summary: Exporta los diagnósticos de OpenClaw a recopiladores de OpenTelemetry o a JSONL en stdout mediante el plugin diagnostics-otel
title: Exportación de OpenTelemetry
x-i18n:
    generated_at: "2026-07-20T00:49:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6ed37f094c6c151379d8e0aaa2633b3ebebdb08b7dcbc9403c4bdeb6e5b8cf76
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporta diagnósticos mediante el plugin oficial `diagnostics-otel`
usando **OTLP/HTTP (protobuf)**. Los registros también pueden escribirse como JSONL en stdout para
pipelines de registros de contenedores y sandboxes. Cualquier recopilador o backend que acepte
OTLP/HTTP funciona sin cambios en el código. Para los registros en archivos locales, consulte
[Registro](/es/logging).

- Los **eventos de diagnóstico** son registros estructurados dentro del proceso emitidos por el
  Gateway y los plugins incluidos para ejecuciones de modelos, flujo de mensajes, sesiones, colas
  y exec.
- **`diagnostics-otel`** se suscribe a esos eventos y los exporta como
  **métricas**, **trazas** y **registros** mediante OTLP/HTTP, y puede
  reflejar los registros en JSONL en stdout.
- Las **llamadas al proveedor** reciben un encabezado W3C `traceparent` del
  contexto de span de confianza de la llamada al modelo de OpenClaw cuando el transporte del proveedor acepta encabezados
  personalizados. El contexto de traza emitido por plugins no se propaga.
- Los exportadores solo se adjuntan cuando tanto la superficie de diagnósticos como el plugin están
  habilitados, por lo que el coste dentro del proceso se mantiene cercano a cero de forma predeterminada.

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

También puede habilitar el plugin desde la CLI: `openclaw plugins enable diagnostics-otel`.

<Note>
`protocol` solo admite `http/protobuf`. Dado que `traces` y `metrics` están habilitados de forma predeterminada, cualquier otro valor (incluido `grpc`) cancela toda la suscripción de diagnostics-otel con una advertencia `unsupported protocol`; esto también detiene la exportación de registros a stdout. Establezca explícitamente `traces: false` y `metrics: false` si solo desea `logsExporter: "stdout"` con un valor de protocolo distinto de OTLP.
</Note>

## Señales exportadas

| Señal       | Qué contiene                                                                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Métricas** | Contadores/histogramas de uso de tokens, coste, duración de la ejecución, conmutación por error, uso de Skills, flujo de mensajes, eventos de Talk, carriles de colas, estado/recuperación de sesiones, ejecución de herramientas, exec, memoria, actividad y estado de los exportadores. |
| **Trazas**  | Spans de uso de modelos, llamadas a modelos, ciclo de vida del arnés, uso de Skills, ejecución de herramientas, exec, procesamiento de webhooks/mensajes, ensamblaje de contexto y bucles de herramientas.                                                      |
| **Registros** | Registros estructurados `logging.file` exportados mediante OTLP o como JSONL en stdout cuando `diagnostics.otel.logs` está habilitado; los cuerpos de los registros se omiten salvo que la captura de contenido se habilite explícitamente.                          |

Active o desactive `traces`, `metrics` y `logs` de forma independiente. Las trazas y las métricas
están activadas de forma predeterminada cuando `diagnostics.otel.enabled` es verdadero; los registros están desactivados de forma predeterminada
y solo se exportan cuando `diagnostics.otel.logs` es explícitamente `true`. La exportación de registros
usa OTLP de forma predeterminada; establezca `diagnostics.otel.logsExporter` en `stdout` para usar JSONL en
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
      protocol: "http/protobuf", // grpc deshabilita la exportación OTLP
      serviceName: "openclaw-gateway", // si no se establece, usa OTEL_SERVICE_NAME y después "openclaw"
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // muestreador de spans raíz, 0.0..1.0
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

| Variable                                                                                                          | Finalidad                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Valor alternativo para `diagnostics.otel.endpoint` cuando la clave de configuración no está establecida.                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Valores alternativos de endpoint específicos de cada señal, utilizados cuando la clave de configuración `diagnostics.otel.*Endpoint` correspondiente no está establecida. La configuración específica de la señal tiene prioridad sobre la variable de entorno específica de la señal, que a su vez tiene prioridad sobre el endpoint compartido.                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Valor alternativo para `diagnostics.otel.serviceName` cuando la clave de configuración no está establecida. El nombre de servicio predeterminado es `openclaw`.                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Valor alternativo para el protocolo de transmisión cuando `diagnostics.otel.protocol` no está establecido. Solo `http/protobuf` habilita la exportación.                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Establezca en `gen_ai_latest_experimental` para emitir la forma más reciente de los spans de inferencia GenAI: nombres de span `{gen_ai.operation.name} {gen_ai.request.model}`, tipo de span `CLIENT` y `gen_ai.provider.name` en lugar del `gen_ai.system` heredado. Las métricas de GenAI siempre usan atributos acotados y de baja cardinalidad. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Establezca en `1` cuando otra precarga o proceso host ya haya registrado el SDK global de OpenTelemetry. En ese caso, el plugin omite su propio ciclo de vida de NodeSDK, pero sigue conectando los listeners de diagnóstico y respetando `traces`/`metrics`/`logs`.                                                                                    |

## Privacidad y captura de contenido

El contenido sin procesar de modelos y herramientas **no** se exporta de forma predeterminada. Los spans incluyen identificadores
acotados (canal, proveedor, modelo, categoría de error, identificadores de solicitudes solo como hash,
origen de la herramienta, propietario de la herramienta, nombre/origen de la Skill) y nunca incluyen texto del prompt,
texto de la respuesta, entradas de herramientas, salidas de herramientas, rutas de archivos de Skills ni claves de sesión.
Los valores que parecen claves de sesión de agente con ámbito (por ejemplo, que comienzan por
`agent:`) se sustituyen por `unknown` en los atributos de baja cardinalidad. Los registros OTLP
conservan de forma predeterminada la gravedad, el logger, la ubicación en el código, el contexto de traza de confianza y
los atributos saneados; el cuerpo del mensaje de registro sin procesar solo se exporta
cuando `diagnostics.otel.captureContent` es el booleano `true`. Las subclaves granulares
`captureContent.*` nunca habilitan los cuerpos de los registros. Las métricas de Talk solo exportan
metadatos acotados del evento (modo, transporte, proveedor y tipo de evento), sin
transcripciones, cargas de audio, identificadores de sesión, identificadores de turno, identificadores de llamada, identificadores de sala ni
tokens de transferencia.

Las solicitudes salientes al modelo pueden incluir un encabezado W3C `traceparent` generado únicamente
a partir del contexto de traza de diagnóstico propiedad de OpenClaw para la llamada activa al modelo.
Los encabezados `traceparent` existentes proporcionados por el llamador se sustituyen, por lo que los plugins o
las opciones de proveedores personalizados no pueden falsificar la ascendencia de trazas entre servicios.

Establezca `diagnostics.otel.captureContent.*` en `true` únicamente cuando el recopilador
y la política de retención estén aprobados para texto de prompts, respuestas, herramientas o
prompts del sistema. Cada subclave es independiente:

- `inputMessages` - contenido del prompt del usuario.
- `outputMessages` - contenido de la respuesta del modelo.
- `toolInputs` - cargas de argumentos de herramientas.
- `toolOutputs` - cargas de resultados de herramientas.
- `systemPrompt` - prompt del sistema/desarrollador ensamblado.
- `toolDefinitions` - nombres, descripciones y esquemas de las herramientas del modelo.

Cuando se habilita cualquier subclave, los spans de modelos y herramientas reciben atributos
`openclaw.content.*` acotados y censurados solo para esa clase.

<Note>
El booleano `captureContent: true` habilita conjuntamente `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions` y los cuerpos de los registros OTLP, pero **no** `systemPrompt`; establezca `captureContent.systemPrompt: true` explícitamente si también necesita el prompt del sistema ensamblado.
</Note>

El contenido de `toolInputs`/`toolOutputs` se captura para las ejecuciones de herramientas
del runtime de agente integrado (`openclaw.content.tool_input` y
`gen_ai.tool.call.arguments` en spans completados/con errores;
`openclaw.content.tool_output` y `gen_ai.tool.call.result` en spans
completados). Los nombres `openclaw.content.*` siguen siendo los nombres estables de atributos de OpenClaw;
las copias `gen_ai.tool.call.*` los reflejan para visores nativos de semconv.
Las llamadas a herramientas de arneses externos (Codex, Claude CLI) emiten
spans `tool.execution.*` sin cargas de contenido. El contenido capturado se transmite por un
canal de confianza exclusivo para listeners y nunca se coloca en el bus público de eventos de
diagnóstico.

## Muestreo y vaciado

- **Trazas:** `diagnostics.otel.sampleRate` establece un `TraceIdRatioBasedSampler`
  solo en el intervalo raíz (`0.0` descarta todo, `1.0` conserva todo). Si no se establece, se usa el valor predeterminado
  del SDK de OpenTelemetry (siempre activo).
- **Métricas:** `diagnostics.otel.flushIntervalMs` (limitado a un mínimo de
  `1000`); si no se establece, se usa el valor predeterminado de exportación periódica del SDK.
- **Registros:** los registros OTLP respetan `logging.level` (nivel de registro de archivo) y usan la
  ruta de censura de registros de diagnóstico, no el formato de consola. Las instalaciones
  de gran volumen deben preferir el muestreo o filtrado del recopilador OTLP al
  muestreo local. Establezca `diagnostics.otel.logsExporter: "stdout"` cuando la plataforma
  ya envíe stdout/stderr a un procesador de registros y no haya ningún recopilador
  de registros OTLP. Los registros de stdout contienen un objeto JSON por línea con `ts`, `signal`,
  `service.name`, gravedad, cuerpo, atributos censurados y campos de traza
  de confianza cuando estén disponibles.
- **Correlación de registros de archivo:** los registros de archivo JSONL incluyen `traceId`,
  `spanId`, `parentSpanId` y `traceFlags` en el nivel superior cuando la llamada de registro contiene un contexto
  válido de traza de diagnóstico, lo que permite a los procesadores de registros asociar las líneas de registro locales con
  los intervalos exportados.
- **Correlación de solicitudes:** las solicitudes HTTP y las tramas WebSocket del Gateway crean
  un ámbito interno de traza de solicitud. Los registros y eventos de diagnóstico dentro de ese
  ámbito heredan la traza de la solicitud de forma predeterminada, mientras que los intervalos de ejecución
  del agente y de llamada al modelo se crean como secundarios, para que los encabezados `traceparent` del proveedor permanezcan en la
  misma traza.
- **Correlación de llamadas al modelo:** los intervalos `openclaw.model.call` incluyen de forma predeterminada los tamaños seguros
  de los componentes del prompt y atributos de tokens por llamada cuando el resultado del proveedor
  expone el uso. `openclaw.model.usage` sigue siendo el intervalo de contabilización
  de la ejecución para los paneles de costes agregados, contexto y canales, y
  permanece en la misma traza de diagnóstico cuando el entorno de ejecución emisor tiene un contexto
  de traza de confianza.

### Unidades de observación de llamadas al modelo

Cada intervalo `openclaw.model.call` identifica lo que mide su ciclo de vida mediante
`openclaw.model_call.observation_unit`:

- `request` - una solicitud observable al modelo/proveedor. Las llamadas nativas al modelo
  integrado usan esta unidad, y los exportadores interpretan la ausencia de un valor como `request` para
  mantener la compatibilidad con emisores antiguos o externos.
- `turn` - un turno opaco de la CLI del agente que puede contener solicitudes ocultas al modelo,
  reintentos, trabajo de herramientas o trabajo en segundo plano. Las llamadas de la CLI de Claude Code y del servidor de aplicaciones
  Codex usan esta unidad.

Ambas unidades siguen siendo intervalos de llamada al modelo para que los sistemas de trazas puedan representar la entrada,
la salida, el uso y la jerarquía del modelo. Los intervalos de solicitud usan la operación de GenAI derivada de la API
(`chat`, `generate_content` o `text_completion`), mientras que los intervalos de turno usan
`gen_ai.operation.name = invoke_agent`. Ambos contribuyen a
`gen_ai.client.operation.duration`, donde el nombre de la operación mantiene separada la latencia de las
solicitudes directas de la latencia del turno completo. Las métricas OTEL de llamadas al modelo de OpenClaw
también incluyen `openclaw.model_call.observation_unit`; las métricas de llamadas al modelo de Prometheus
exponen la etiqueta equivalente `observation_unit`.

### Fidelidad de las llamadas al modelo de la CLI de Claude Code

Los turnos de la CLI de Claude Code emiten un intervalo `openclaw.model.call` sintético
en el nivel del turno. No son intervalos de solicitudes HTTP de Anthropic. Usan `openclaw.api =
claude-code`, `openclaw.model_call.observation_unit = turn` e identifican
la operación como `gen_ai.operation.name = invoke_agent`. Identifican
el límite de la CLI de OpenClaw mediante
`openclaw.transport`:

- `stdio` - proceso local de Claude Code de una sola ejecución.
- `stdio-live` - un turno en una sesión stdio persistente y administrada de Claude.
- `paired-node-cli` - ejecución de Claude Code de una sola vez delegada a un
  nodo emparejado.

Los diagnósticos de la CLI de Claude solo se instancian mientras el despachador de diagnósticos
del proceso está habilitado y hay conectado un receptor de eventos interno o de confianza.
Cuando no hay ningún plugin de observabilidad ni otro receptor activo, los turnos de la CLI de Claude omiten
la jerarquía sintética de trazas, los búferes de contenido y la
contabilización de bytes del flujo de diagnóstico. Cuando la captura de contenido está habilitada, los campos del prompt y del prompt del sistema
tienen un límite de 128 KiB cada uno; la salida del asistente tiene un límite de 128 KiB distribuido entre
un máximo de 200 sobres, con 16 KiB y un elemento reservados para una respuesta alternativa
final visible. Un marcador registra el truncamiento cuando se alcanza el límite.

OpenClaw asigna a los turnos de la CLI de Claude la misma jerarquía de propiedad que usan otros
entornos de ejecución de agentes: `openclaw.harness.run` (`openclaw.harness.id = claude-cli`)
contiene `openclaw.run`, que contiene el intervalo `openclaw.model.call`
de Claude. Los intervalos del arnés y de la ejecución son límites sintéticos de los turnos de OpenClaw, no
fases internas de Claude Code. Los turnos de una sola ejecución y los turnos stdio administrados usan la misma
jerarquía; un reintento real de una sesión nueva crea otro elemento secundario de llamada al modelo dentro
de la misma ejecución de OpenClaw.

El intervalo comienza cuando OpenClaw admite el turno preparado de la CLI y solo termina después de que
ese turno finaliza correctamente o falla. En las sesiones administradas, un resultado correcto provisional
no termina el intervalo mientras Claude notifique agentes o
flujos de trabajo en segundo plano que mantienen el resultado; el resultado final posterior al vaciado sí lo termina. La cancelación, el tiempo de espera agotado, el fallo del proceso,
el fallo de salida/análisis y otros fallos del turno terminan el mismo intervalo con un error.

Claude Code informa del uso por mensaje del asistente y también puede informar del uso acumulado
en su resultado final. La contabilización de respuestas de OpenClaw sigue usando el
último mensaje del asistente para que no cambie la semántica de costes existente; el
intervalo de llamada al modelo en el nivel del turno usa el uso acumulado final cuando está disponible,
incluidos los tokens de lectura y creación de caché.

Para estos intervalos de la CLI, los campos de bytes y tiempo describen el límite observable de la
CLI de OpenClaw:

- `openclaw.model_call.request_bytes` es el tamaño UTF-8 del valor del prompt
  enviado mediante stdin/argv en una sola ejecución, o del sobre JSONL de usuario de stdio administrado. No
  es el tamaño de la solicitud oculta al modelo de Claude Code.
- `openclaw.model_call.response_bytes` es el tamaño UTF-8 de stdout de la CLI de Claude
  observado durante el turno. No es el tamaño de la respuesta HTTP de Anthropic.
- `openclaw.model_call.time_to_first_byte_ms` es el tiempo hasta la primera salida observable
  de stdout o stderr de la CLI de Claude. No es el TTFB de red.

Con los campos granulares `captureContent` correspondientes habilitados, el intervalo exporta
el prompt efectivo que OpenClaw envía a Claude Code, el prompt del sistema que OpenClaw añade y el texto, razonamiento e identidad de llamadas a herramientas visibles del asistente mediante
`gen_ai.input.messages`, `gen_ai.output.messages` y
`gen_ai.system_instructions`. Los argumentos de las herramientas, las firmas opacas de razonamiento y
los resultados de las herramientas se omiten del sobre del asistente de Claude. OpenClaw no
afirma tener acceso al prompt privado del sistema de Claude Code, la carga útil oculta de solicitudes reanudadas o
compactadas, los esquemas nativos de herramientas internas, la solicitud HTTP sin procesar de Anthropic,
los reintentos internos, el identificador de solicitud ascendente ni el TTFB real de red. Como
Claude Code no expone con precisión sus definiciones nativas efectivas de herramientas,
estos intervalos no rellenan `gen_ai.tool.definitions`.

Los intervalos de herramientas del arnés externo de Claude siguen conteniendo solo metadatos, incluso cuando está
habilitada la captura de contenido de herramientas. Como ocurre con todos los intervalos de modelo, el contenido capturado de la CLI de Claude usa
la ruta exclusiva para receptores de confianza y los límites existentes de censura y tamaño
del exportador; el contenido permanece desactivado de forma predeterminada.

## Métricas exportadas

### Uso del modelo

- `openclaw.tokens` (contador, atrib.: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (contador, atrib.: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histograma, atrib.: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histograma, atrib.: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histograma, métrica de convenciones semánticas de GenAI, atrib.: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histograma, segundos, métrica de convenciones semánticas de GenAI para solicitudes al modelo y turnos sintéticos del agente; atrib.: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` opcional; las observaciones de turnos usan `gen_ai.operation.name = invoke_agent`)
- `openclaw.model_call.duration_ms` (histograma, atrib.: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, `openclaw.model_call.observation_unit`, además de `openclaw.errorCategory` y `openclaw.failureKind` en errores clasificados)
- `openclaw.model_call.request_bytes` (histograma, tamaño en bytes UTF-8 de la carga útil final de la solicitud al modelo; para la CLI de Claude Code, la entrada o el sobre observable del prompt descrito anteriormente; sin contenido de carga útil sin procesar)
- `openclaw.model_call.response_bytes` (histograma, tamaño en bytes UTF-8 de las cargas útiles de los fragmentos de respuesta transmitidos; los deltas de alta frecuencia de texto, razonamiento y llamadas a herramientas solo cuentan los bytes incrementales de `delta`; para la CLI de Claude Code, bytes de stdout observados; sin contenido de respuesta sin procesar)
- `openclaw.model_call.time_to_first_byte_ms` (histograma, tiempo transcurrido antes del primer evento de respuesta transmitida; para la CLI de Claude Code, primera salida observable de la CLI en lugar del TTFB de red)
- `openclaw.model.failover` (contador, atrib.: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (contador, atrib.: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, `openclaw.agent` opcional, `openclaw.toolName` opcional)

### Flujo de mensajes

- `openclaw.webhook.received` (contador, atrib.: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (contador, atrib.: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histograma, atrib.: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (contador, atrib.: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (contador, atrib.: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (contador, atrib.: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (contador, atrib.: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (histograma, atrib.: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (contador, atrib.: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histograma, atrib.: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (contador, atrib.: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histograma, atrib.: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Conversación

- `openclaw.talk.event` (contador, atrib.: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histograma, atrib.: los mismos que `openclaw.talk.event`; se emite cuando un evento de Conversación informa de la duración)
- `openclaw.talk.audio.bytes` (histograma, atrib.: los mismos que `openclaw.talk.event`; se emite para eventos de tramas de audio de Conversación que informan de la longitud en bytes)

### Colas y sesiones

- `openclaw.queue.lane.enqueue` (contador, atributos: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (contador, atributos: `openclaw.lane`)
- `openclaw.queue.depth` (histograma, atributos: `openclaw.lane` o `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histograma, atributos: `openclaw.lane`)
- `openclaw.session.state` (contador, atributos: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (contador, atributos: `openclaw.state`; se emite para registros internos recuperables de sesiones obsoletas)
- `openclaw.session.stuck_age_ms` (histograma, atributos: `openclaw.state`; se emite para registros internos recuperables de sesiones obsoletas)
- `openclaw.session.turn.created` (contador, atributos: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (contador, atributos: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (contador, atributos: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histograma, atributos: los mismos que el contador de recuperación correspondiente)
- `openclaw.run.attempt` (contador, atributos: `openclaw.attempt`)

### Telemetría de actividad de las sesiones

Una sesión `processing` no avanza hacia el umbral de actividad integrado mientras OpenClaw observa progreso de respuesta, herramienta, estado, bloque o entorno de ejecución ACP. Las señales de mantenimiento de escritura no cuentan como progreso, por lo que aún se puede detectar un modelo o arnés silencioso.

OpenClaw clasifica las sesiones según el trabajo que aún puede observar:

- `session.long_running`: el trabajo integrado activo, las llamadas al modelo o las llamadas a herramientas
  aún progresan. Las llamadas silenciosas al modelo con propietario también se notifican como de larga duración antes del umbral de cancelación integrado, por lo que los proveedores de modelos lentos o sin transmisión no parecen sesiones del Gateway bloqueadas mientras se pueda observar su cancelación.
- `session.stalled`: existe trabajo activo, pero la ejecución activa no ha notificado
  progreso reciente. Las llamadas al modelo con propietario cambian de `session.long_running` a
  `session.stalled` al alcanzar o superar el umbral de cancelación integrado; la actividad
  obsoleta de modelos o herramientas sin propietario no se considera trabajo de larga duración inofensivo.
  Las ejecuciones integradas bloqueadas permanecen inicialmente en modo de solo observación y, después,
  al superar el umbral de cancelación sin progreso, se cancelan y vacían para que puedan reanudarse
  los turnos en cola detrás del carril.
- `session.stuck`: registros internos de sesión obsoletos sin trabajo activo, o una sesión
  inactiva en cola con actividad obsoleta de modelos o herramientas sin propietario. Esto libera el
  carril de sesión afectado inmediatamente después de que se superen las comprobaciones de recuperación.

La recuperación emite eventos estructurados `session.recovery.requested` y
`session.recovery.completed`. El estado de diagnóstico de la sesión se marca como inactivo
solo después de un resultado de recuperación que modifica el estado (`aborted` o `released`) y únicamente si
la misma generación de procesamiento sigue vigente.

Solo `session.stuck` emite el contador `openclaw.session.stuck`, el
histograma `openclaw.session.stuck_age_ms` y el tramo `openclaw.session.stuck`.
Los diagnósticos `session.stuck` repetidos aplican una espera incremental mientras la sesión
permanece sin cambios, por lo que los paneles deben generar alertas ante aumentos sostenidos, en lugar de
hacerlo en cada ciclo de Heartbeat. Para consultar el parámetro de configuración y los valores predeterminados, véase
[Referencia de configuración](/es/gateway/configuration-reference#diagnostics).

Las advertencias de actividad también emiten:

- `openclaw.liveness.warning` (contador, atributos: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histograma, atributos: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histograma, atributos: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histograma, atributos: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histograma, atributos: `openclaw.liveness.reason`)

### Ciclo de vida del arnés

- `openclaw.harness.duration_ms` (histograma, atributos: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` en caso de error)

### Ejecución de herramientas y detección de bucles

- `openclaw.tool.execution.duration_ms` (histograma, atributos: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, además de `openclaw.errorCategory` en caso de error)
- `openclaw.tool.execution.blocked` (contador, atributos: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)
- `openclaw.tool.loop` (contador, atributos: `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` opcional; se emite cuando se detecta un bucle repetitivo de llamadas a herramientas)

### Exec

- `openclaw.exec.duration_ms` (histograma, atributos: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Componentes internos de diagnóstico (memoria, cargas útiles y estado del exportador)

- `openclaw.payload.large` (contador, atributos: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histograma, atributos: los mismos que `openclaw.payload.large`)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (histogramas, sin atributos; muestras de memoria del proceso)
- `openclaw.memory.pressure` (contador, atributos: `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (contador, atributos: `openclaw.diagnostic.async_queue.drop_class`; descartes por contrapresión en la cola interna de diagnóstico)
- `openclaw.telemetry.exporter.events` (contador, atributos: `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, `openclaw.reason` opcional, `openclaw.errorCategory` opcional; autotelemetría del ciclo de vida y los fallos del exportador)

## Tramos exportados

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (entrada/salida/lectura de caché/escritura de caché/total)
  - `gen_ai.system` de forma predeterminada, o `gen_ai.provider.name` cuando se habilitan explícitamente las convenciones semánticas más recientes de GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` de forma predeterminada, o `gen_ai.provider.name` cuando se habilitan explícitamente las convenciones semánticas más recientes de GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, `openclaw.model_call.observation_unit` (`request` o `turn`)
  - `openclaw.errorCategory`, `error.type` y `openclaw.failureKind` opcional en caso de error
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (solo tamaños seguros de componentes, sin texto de instrucciones)
  - `openclaw.model_call.usage.*` y `gen_ai.usage.*` cuando el resultado contiene datos de uso para esa solicitud o para el turno agregado
  - Evento de tramo `openclaw.provider.request` con el atributo `openclaw.upstreamRequestIdHash` (acotado y basado en hash) cuando el resultado del proveedor ascendente expone un identificador de solicitud; nunca se exportan los identificadores sin procesar
  - Con `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, los tramos de solicitud usan el nombre de tramo de inferencia de GenAI más reciente, `{gen_ai.operation.name} {gen_ai.request.model}`. Los tramos de turno usan `invoke_agent` porque OpenClaw no atribuye un nombre de agente nativo desde el límite opaco de la CLI. Ambos usan el tipo de tramo `CLIENT` en lugar de `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Al finalizar: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - En caso de error: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` opcional
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `gen_ai.operation.name` (`execute_tool`), `openclaw.toolName`, `openclaw.tool.source`, `gen_ai.tool.call.id` opcional, `openclaw.tool.owner`, `openclaw.tool.params.*`
  - `openclaw.errorCategory`/`openclaw.errorCode` opcionales en caso de error, `openclaw.deniedReason` y `openclaw.outcome=blocked` cuando una política o el entorno aislado los deniega
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (sin contenido de instrucciones, historial, respuesta ni clave de sesión)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` opcional (sin mensajes de bucle, parámetros ni salida de herramientas)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.reason`, `openclaw.memory.rss_bytes`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.heap_total_bytes`, `openclaw.memory.external_bytes`, `openclaw.memory.array_buffers_bytes`, `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms` opcionales

Cuando la captura de contenido está habilitada explícitamente, los tramos de modelos y herramientas también pueden
incluir atributos `openclaw.content.*` acotados y censurados para las clases de
contenido específicas que se hayan seleccionado.

## Catálogo de eventos de diagnóstico

Los eventos siguientes respaldan las métricas y los tramos anteriores o están disponibles para la suscripción directa
de plugins. `run.progress` y `run.execution_phase` son señales de ciclo de vida
exclusivamente directas; el plugin diagnostics-otel no las exporta como
señales OTLP independientes. Los tipos de evento y los valores `run.execution_phase.phase` son
aditivos. Los consumidores de TypeScript deben conservar ramas predeterminadas en lugar de suponer
que cualquiera de las dos uniones será exhaustiva permanentemente.

**Uso del modelo**

- `model.usage` - tokens, coste, duración, contexto, proveedor/modelo/canal,
  identificadores de sesión. `usage` corresponde a la contabilización del proveedor/turno para el coste y la telemetría;
  `context.used` es la instantánea actual de instrucciones/contexto y puede ser inferior a
  `usage.total` del proveedor cuando intervienen entradas almacenadas en caché o llamadas de bucles de herramientas.

**Flujo de mensajes**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Cola y sesión**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `run.execution_phase` (hitos públicos de inicio del ejecutor integrado correlacionados con la sesión)
- `diagnostic.heartbeat` (contadores agregados: webhooks/cola/sesión)

**Ciclo de vida del arnés**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  ciclo de vida por ejecución del arnés del agente. Incluye `harnessId`, `pluginId`
  opcional, proveedor/modelo/canal e identificador de ejecución. La finalización añade
  `durationMs`, `outcome`, `resultClassification` opcional, `yieldDetected`
  y recuentos de `itemLifecycle`. Los errores añaden `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` y
  `cleanupFailed` opcional.

**Exec**

- `exec.process.completed` - resultado del terminal, duración, destino, modo, código
  de salida y tipo de fallo. No se incluyen el texto del comando ni los
  directorios de trabajo.
- `exec.approval.followup_suppressed` - seguimiento de aprobación obsoleta descartado
  después de que una sesión se volviera a vincular. Incluye `approvalId`, `reason`
  (`session_rebound`), `phase` (`direct_delivery` o `gateway_preflight`)
  y la marca de tiempo del distribuidor. No se incluyen las claves de sesión, las rutas ni el
  texto del comando.

## Sin un exportador

Mantenga los eventos de diagnóstico disponibles para los plugins o destinos personalizados sin ejecutar
`diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Para obtener resultados de depuración específicos sin aumentar `logging.level`, use indicadores de
diagnóstico. Los indicadores no distinguen entre mayúsculas y minúsculas y admiten comodines (`telegram.*` o
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

O como sustitución puntual mediante una variable de entorno:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

La salida de los indicadores se dirige al archivo de registro estándar (`logging.file`) y sigue
siendo censurada por `logging.redactSensitive`. Guía completa:
[Indicadores de diagnóstico](/es/diagnostics/flags).

## Desactivar

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

También puede omitir `diagnostics-otel` de `plugins.allow` o ejecutar
`openclaw plugins disable diagnostics-otel`.

## Contenido relacionado

- [Registro](/es/logging) - registros en archivos, salida de consola, seguimiento desde la CLI y pestaña Logs de la interfaz de control
- [Detalles internos del registro del Gateway](/es/gateway/logging) - estilos de registro de WS, prefijos de subsistemas y captura de consola
- [Indicadores de diagnóstico](/es/diagnostics/flags) - indicadores específicos del registro de depuración
- [Exportación de diagnósticos](/es/gateway/diagnostics) - herramienta de paquetes de soporte para operadores (independiente de la exportación de OTEL)
- [Referencia de configuración](/es/gateway/configuration-reference#diagnostics) - referencia completa del campo `diagnostics.*`
