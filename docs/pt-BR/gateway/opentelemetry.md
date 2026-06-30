---
read_when:
    - Você deseja enviar métricas de uso do modelo, fluxo de mensagens ou sessão do OpenClaw para um coletor OpenTelemetry
    - Você está conectando traces, métricas ou logs ao Grafana, Datadog, Honeycomb, New Relic, Tempo ou outro backend OTLP
    - Você precisa dos nomes exatos das métricas, dos nomes dos spans ou dos formatos dos atributos para criar dashboards ou alertas
summary: Exporte diagnósticos do OpenClaw para coletores OpenTelemetry ou JSONL em stdout via Plugin diagnostics-otel
title: Exportação do OpenTelemetry
x-i18n:
    generated_at: "2026-06-30T13:54:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9cdac72cb4a2910e6ef52e60a5f2266a2667c53cf003d63908f04d284e427b0
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporta diagnósticos por meio do Plugin oficial `diagnostics-otel`
usando **OTLP/HTTP (protobuf)**. Logs também podem ser gravados como JSONL em stdout para
pipelines de logs de contêineres e sandboxes. Qualquer coletor ou backend que aceite
OTLP/HTTP funciona sem alterações de código. Para logs em arquivos locais e como lê-los,
consulte [Logs](/pt-BR/logging).

## Como tudo se encaixa

- **Eventos de diagnóstico** são registros estruturados, em processo, emitidos pelo
  Gateway e por plugins incluídos para execuções de modelo, fluxo de mensagens, sessões, filas
  e exec.
- O **Plugin `diagnostics-otel`** assina esses eventos e os exporta como
  **métricas**, **traces** e **logs** do OpenTelemetry via OTLP/HTTP. Ele também pode
  espelhar registros de log de diagnóstico para JSONL em stdout.
- **Chamadas de provedor** recebem um cabeçalho W3C `traceparent` do contexto de span
  confiável de chamada de modelo do OpenClaw quando o transporte do provedor aceita cabeçalhos
  personalizados. O contexto de trace emitido por Plugin não é propagado.
- Exportadores só são anexados quando tanto a superfície de diagnóstico quanto o Plugin estão
  habilitados, então o custo em processo permanece próximo de zero por padrão.

## Início rápido

Para instalações empacotadas, instale o Plugin primeiro:

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

Você também pode habilitar o Plugin pela CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
No momento, `protocol` aceita apenas `http/protobuf`. `grpc` é ignorado.
</Note>

## Sinais exportados

| Sinal       | O que entra nele                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Métricas** | Contadores e histogramas para uso de tokens, custo, duração de execução, failover, uso de Skills, fluxo de mensagens, eventos Talk, faixas de fila, estado/recuperação de sessão, execução de ferramenta, payloads grandes demais, exec e pressão de memória. |
| **Traces**  | Spans para uso de modelo, chamadas de modelo, ciclo de vida do harness, uso de Skills, execução de ferramenta, exec, processamento de webhook/mensagem, montagem de contexto e loops de ferramentas.                                                            |
| **Logs**    | Registros estruturados `logging.file` exportados via OTLP ou JSONL em stdout quando `diagnostics.otel.logs` está habilitado; corpos de log são retidos a menos que a captura de conteúdo seja explicitamente habilitada.                                |

Alterne `traces`, `metrics` e `logs` independentemente. Traces e métricas
ficam ativados por padrão quando `diagnostics.otel.enabled` é true. Logs ficam desativados por padrão e
são exportados somente quando `diagnostics.otel.logs` é explicitamente `true`. A exportação de logs
usa OTLP por padrão; defina `diagnostics.otel.logsExporter` como `stdout` para JSONL em
stdout, ou `both` para enviar cada registro de log de diagnóstico para OTLP e stdout.

## Referência de configuração

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

### Variáveis de ambiente

| Variável                                                                                                          | Finalidade                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Substitui `diagnostics.otel.endpoint`. Se o valor já contém `/v1/traces`, `/v1/metrics` ou `/v1/logs`, ele é usado como está.                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Substituições de endpoint específicas por sinal usadas quando a chave de configuração `diagnostics.otel.*Endpoint` correspondente não está definida. A configuração específica por sinal tem precedência sobre o env específico por sinal, que tem precedência sobre o endpoint compartilhado.                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Substitui `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Substitui o protocolo de transmissão (somente `http/protobuf` é respeitado hoje).                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Defina como `gen_ai_latest_experimental` para emitir o formato de span de inferência GenAI experimental mais recente, incluindo nomes de span `{gen_ai.operation.name} {gen_ai.request.model}`, tipo de span `CLIENT` e `gen_ai.provider.name` em vez do legado `gen_ai.system`. Métricas GenAI sempre usam atributos semânticos limitados e de baixa cardinalidade independentemente disso. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Defina como `1` quando outro preload ou processo host já registrou o SDK global do OpenTelemetry. Então o Plugin pula seu próprio ciclo de vida do NodeSDK, mas ainda conecta listeners de diagnóstico e respeita `traces`/`metrics`/`logs`.                                                                                                                    |

## Privacidade e captura de conteúdo

Conteúdo bruto de modelo/ferramenta **não** é exportado por padrão. Spans carregam
identificadores limitados (canal, provedor, modelo, categoria de erro, ids de requisição somente com hash,
origem da ferramenta, proprietário da ferramenta e nome/origem da skill) e nunca incluem texto de prompt,
texto de resposta, entradas de ferramenta, saídas de ferramenta, caminhos de arquivo de skill ou chaves de sessão.
Registros de log OTLP mantêm severidade, logger, local do código, contexto de trace confiável
e atributos sanitizados por padrão, mas o corpo bruto da mensagem de log é exportado
somente quando `diagnostics.otel.captureContent` é definido como booleano `true`. Subchaves granulares
`captureContent.*` não habilitam corpos de log. Rótulos que parecem
chaves de sessão de agente com escopo são substituídos por `unknown`.
Métricas Talk exportam apenas metadados de evento limitados, como modo, transporte,
provedor e tipo de evento. Elas não incluem transcrições, payloads de áudio,
ids de sessão, ids de turno, ids de chamada, ids de sala ou tokens de handoff.

Requisições de modelo de saída podem incluir um cabeçalho W3C `traceparent`. Esse cabeçalho é
gerado somente a partir do contexto de trace de diagnóstico pertencente ao OpenClaw para a chamada de modelo
ativa. Cabeçalhos `traceparent` fornecidos pelo chamador são substituídos, então plugins ou
opções personalizadas de provedor não podem falsificar ancestralidade de trace entre serviços.

Defina `diagnostics.otel.captureContent.*` como `true` somente quando seu coletor e sua
política de retenção forem aprovados para texto de prompt, resposta, ferramenta ou prompt de sistema.
Cada subchave é opt-in independentemente:

- `inputMessages` - conteúdo do prompt do usuário.
- `outputMessages` - conteúdo da resposta do modelo.
- `toolInputs` - payloads de argumentos de ferramenta.
- `toolOutputs` - payloads de resultados de ferramenta.
- `systemPrompt` - prompt de sistema/desenvolvedor montado.
- `toolDefinitions` - nomes, descrições e esquemas de ferramentas do modelo.

Quando qualquer subchave é habilitada, spans de modelo e ferramenta recebem atributos
`openclaw.content.*` limitados e redigidos apenas para essa classe. Use booleano
`captureContent: true` somente para capturas amplas de diagnóstico nas quais os corpos de mensagens de log OTLP
também foram aprovados para exportação.

O conteúdo de `toolInputs`/`toolOutputs` é capturado para as execuções de ferramentas do runtime
de agente integrado (`openclaw.content.tool_input` em spans concluídos/com erro,
`openclaw.content.tool_output` em spans concluídos). Chamadas de ferramenta de harness externo
(Codex, Claude CLI) emitem spans `tool.execution.*` sem payloads de conteúdo.
O conteúdo capturado trafega por um canal confiável somente para listeners e nunca é colocado
no barramento público de eventos de diagnóstico.

## Amostragem e flush

- **Traces:** `diagnostics.otel.sampleRate` (apenas span raiz, `0.0` descarta tudo,
  `1.0` mantém tudo).
- **Métricas:** `diagnostics.otel.flushIntervalMs` (mínimo `1000`).
- **Logs:** os logs OTLP respeitam `logging.level` (nível de log em arquivo). Eles usam o
  caminho de redação de registros de log de diagnóstico, não a formatação do console. Instalações de
  alto volume devem preferir amostragem/filtragem no coletor OTLP em vez de amostragem local.
  Defina `diagnostics.otel.logsExporter: "stdout"` quando sua plataforma já
  envia stdout/stderr para um processador de logs e você não tem um coletor de logs
  OTLP. Registros em stdout são um objeto JSON por linha com `ts`, `signal`,
  `service.name`, severidade, corpo, atributos redigidos e campos de trace confiáveis
  quando disponíveis.
- **Correlação de logs em arquivo:** logs de arquivo JSONL incluem `traceId`,
  `spanId`, `parentSpanId` e `traceFlags` no nível superior quando a chamada de log carrega um contexto
  de trace de diagnóstico válido, o que permite que processadores de logs juntem linhas de log locais com
  spans exportados.
- **Correlação de solicitações:** solicitações HTTP do Gateway e frames WebSocket criam um
  escopo interno de trace de solicitação. Logs e eventos de diagnóstico dentro desse escopo
  herdam o trace da solicitação por padrão, enquanto spans de execução de agente e chamada de modelo são
  criados como filhos para que cabeçalhos `traceparent` do provedor permaneçam no mesmo trace.
- **Correlação de chamadas de modelo:** spans `openclaw.model.call` incluem tamanhos seguros de
  componentes do prompt por padrão e incluem atributos de tokens por chamada quando o
  resultado do provedor expõe uso. `openclaw.model.usage` permanece o span de contabilidade
  em nível de execução para custo agregado, contexto e dashboards de canais; ele permanece
  no mesmo trace de diagnóstico quando o runtime emissor tem contexto de trace confiável.

## Métricas exportadas

### Uso de modelo

- `openclaw.tokens` (contador, atributos: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (contador, atributos: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histograma, atributos: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histograma, atributos: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histograma, métrica de convenções semânticas GenAI, atributos: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histograma, segundos, métrica de convenções semânticas GenAI, atributos: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` opcional)
- `openclaw.model_call.duration_ms` (histograma, atributos: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, mais `openclaw.errorCategory` e `openclaw.failureKind` em erros classificados)
- `openclaw.model_call.request_bytes` (histograma, tamanho em bytes UTF-8 do payload final da solicitação ao modelo; sem conteúdo bruto do payload)
- `openclaw.model_call.response_bytes` (histograma, tamanho em bytes UTF-8 dos payloads de chunks de resposta transmitida; deltas de texto, pensamento e chamada de ferramenta de alta frequência contam apenas bytes `delta` incrementais; sem conteúdo bruto da resposta)
- `openclaw.model_call.time_to_first_byte_ms` (histograma, tempo decorrido antes do primeiro evento de resposta transmitida)
- `openclaw.model.failover` (contador, atributos: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (contador, atributos: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, `openclaw.agent` opcional, `openclaw.toolName` opcional)

### Fluxo de mensagens

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
- `openclaw.talk.event.duration_ms` (histograma, atributos: os mesmos que `openclaw.talk.event`; emitido quando um evento Talk relata duração)
- `openclaw.talk.audio.bytes` (histograma, atributos: os mesmos que `openclaw.talk.event`; emitido para eventos de frame de áudio do Talk que relatam comprimento em bytes)

### Filas e sessões

- `openclaw.queue.lane.enqueue` (contador, atributos: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (contador, atributos: `openclaw.lane`)
- `openclaw.queue.depth` (histograma, atributos: `openclaw.lane` ou `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histograma, atributos: `openclaw.lane`)
- `openclaw.session.state` (contador, atributos: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (contador, atributos: `openclaw.state`; emitido para bookkeeping recuperável de sessões obsoletas)
- `openclaw.session.stuck_age_ms` (histograma, atributos: `openclaw.state`; emitido para bookkeeping recuperável de sessões obsoletas)
- `openclaw.session.turn.created` (contador, atributos: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (contador, atributos: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (contador, atributos: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histograma, atributos: os mesmos que o contador de recuperação correspondente)
- `openclaw.run.attempt` (contador, atributos: `openclaw.attempt`)

### Telemetria de atividade de sessão

`diagnostics.stuckSessionWarnMs` é o limite de idade sem progresso para diagnósticos de
atividade de sessão. Uma sessão `processing` não envelhece em direção a esse limite
enquanto o OpenClaw observa progresso de resposta, ferramenta, status, bloco ou runtime ACP.
Keepalives de digitação não são contados como progresso, então um modelo ou harness silencioso
ainda pode ser detectado.

O OpenClaw classifica sessões pelo trabalho que ainda consegue observar:

- `session.long_running`: trabalho embarcado ativo, chamadas de modelo ou chamadas de ferramenta
  ainda estão progredindo. Chamadas de modelo com dono que permanecem silenciosas após
  `diagnostics.stuckSessionWarnMs` também são relatadas como long-running antes de
  `diagnostics.stuckSessionAbortMs`, para que provedores de modelo lentos ou sem streaming não
  pareçam sessões de gateway travadas enquanto ainda permanecem observáveis para abortamento.
- `session.stalled`: existe trabalho ativo, mas a execução ativa não relatou
  progresso recente. Chamadas de modelo com dono mudam de `session.long_running` para
  `session.stalled` em ou após `diagnostics.stuckSessionAbortMs`; atividade obsoleta
  de modelo/ferramenta sem dono não é tratada como trabalho long-running inofensivo.
  Execuções embarcadas travadas permanecem inicialmente apenas observáveis e depois fazem abort-drain após
  `diagnostics.stuckSessionAbortMs` sem progresso para que turnos enfileirados atrás da
  lane possam retomar. Quando não definido, o limite de abortamento usa por padrão a janela
  estendida mais segura de pelo menos 5 minutos e 3x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: bookkeeping de sessão obsoleto sem trabalho ativo, ou uma sessão
  enfileirada ociosa com atividade obsoleta de modelo/ferramenta sem dono. Isso libera a
  lane de sessão afetada imediatamente após as portas de recuperação passarem.

A recuperação emite eventos estruturados `session.recovery.requested` e
`session.recovery.completed`. O estado de sessão de diagnóstico é marcado como ocioso
somente após um resultado de recuperação mutante (`aborted` ou `released`) e somente se a
mesma geração de processamento ainda estiver atual.

Somente `session.stuck` emite o contador `openclaw.session.stuck`, o
histograma `openclaw.session.stuck_age_ms` e o span `openclaw.session.stuck`.
Diagnósticos `session.stuck` repetidos recuam enquanto a sessão permanece
inalterada, então dashboards devem alertar sobre aumentos sustentados em vez de cada
tick de Heartbeat. Para o ajuste de configuração e os padrões, consulte
[Referência de configuração](/pt-BR/gateway/configuration-reference#diagnostics).

Avisos de atividade também emitem:

- `openclaw.liveness.warning` (contador, atributos: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histograma, atributos: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histograma, atributos: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histograma, atributos: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histograma, atributos: `openclaw.liveness.reason`)

### Ciclo de vida do harness

- `openclaw.harness.duration_ms` (histograma, atributos: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` em erros)

### Execução de ferramentas

- `openclaw.tool.execution.duration_ms` (histograma, atributos: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, mais `openclaw.errorCategory` em erros)
- `openclaw.tool.execution.blocked` (contador, atributos: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (histograma, atributos: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Internos de diagnóstico (memória e loop de ferramentas)

- `openclaw.payload.large` (contador, atributos: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histograma, atributos: os mesmos que `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (histograma, atributos: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histograma)
- `openclaw.memory.pressure` (contador, atributos: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (contador, atributos: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histograma, atributos: `openclaw.toolName`, `openclaw.outcome`)

## Spans exportados

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` por padrão, ou `gen_ai.provider.name` quando as convenções semânticas mais recentes do GenAI são habilitadas
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` por padrão, ou `gen_ai.provider.name` quando as convenções semânticas mais recentes do GenAI são habilitadas
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` e `openclaw.failureKind` opcional em erros
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (somente tamanhos seguros de componentes, sem texto do prompt)
  - `openclaw.model_call.usage.*` e `gen_ai.usage.*` quando o resultado da chamada ao modelo traz o uso do provedor para essa chamada individual
  - `openclaw.provider.request_id_hash` (hash limitado baseado em SHA do id de solicitação do provedor upstream; ids brutos não são exportados)
  - Com `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, spans de chamada ao modelo usam o nome de span de inferência GenAI mais recente `{gen_ai.operation.name} {gen_ai.request.model}` e o tipo de span `CLIENT` em vez de `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Na conclusão: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Em erro: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` opcional
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (sem conteúdo de prompt, histórico, resposta ou chave de sessão)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (sem mensagens de loop, parâmetros ou saída da ferramenta)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Quando a captura de conteúdo é habilitada explicitamente, spans de modelo e ferramenta também podem
incluir atributos `openclaw.content.*` limitados e redigidos para as classes
de conteúdo específicas que você habilitou.

## Catálogo de eventos de diagnóstico

Os eventos abaixo dão suporte às métricas e spans acima. Plugins também podem assiná-los
diretamente sem exportação OTLP.

**Uso do modelo**

- `model.usage` - tokens, custo, duração, contexto, provedor/modelo/canal,
  ids de sessão. `usage` é a contabilização de provedor/turno para custo e telemetria;
  `context.used` é o snapshot atual de prompt/contexto e pode ser menor que
  `usage.total` do provedor quando entrada em cache ou chamadas de loop de ferramentas estão envolvidas.

**Fluxo de mensagens**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Fila e sessão**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (contadores agregados: webhooks/fila/sessão)

**Ciclo de vida do harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  ciclo de vida por execução do harness do agente. Inclui `harnessId`, `pluginId`
  opcional, provedor/modelo/canal e id da execução. A conclusão adiciona
  `durationMs`, `outcome`, `resultClassification` opcional, `yieldDetected`
  e contagens de `itemLifecycle`. Erros adicionam `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` e
  `cleanupFailed` opcional.

**Exec**

- `exec.process.completed` - resultado terminal, duração, destino, modo, código
  de saída e tipo de falha. O texto do comando e os diretórios de trabalho não são
  incluídos.

## Sem um exportador

Você pode manter eventos de diagnóstico disponíveis para Plugins ou coletores personalizados sem
executar `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Para saída de depuração direcionada sem aumentar `logging.level`, use flags de diagnóstico.
Flags não diferenciam maiúsculas de minúsculas e aceitam curingas (por exemplo, `telegram.*` ou
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Ou como uma substituição pontual por env:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

A saída de flags vai para o arquivo de log padrão (`logging.file`) e ainda é
redigida por `logging.redactSensitive`. Guia completo:
[Flags de diagnóstico](/pt-BR/diagnostics/flags).

## Desabilitar

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Você também pode deixar `diagnostics-otel` fora de `plugins.allow`, ou executar
`openclaw plugins disable diagnostics-otel`.

## Relacionados

- [Logging](/pt-BR/logging) - logs de arquivo, saída do console, acompanhamento pela CLI e a aba Logs da Control UI
- [Internos de logging do Gateway](/pt-BR/gateway/logging) - estilos de log de WS, prefixos de subsistema e captura de console
- [Flags de diagnóstico](/pt-BR/diagnostics/flags) - flags direcionadas de log de depuração
- [Exportação de diagnóstico](/pt-BR/gateway/diagnostics) - ferramenta de pacote de suporte do operador (separada da exportação OTEL)
- [Referência de configuração](/pt-BR/gateway/configuration-reference#diagnostics) - referência completa de campos `diagnostics.*`
