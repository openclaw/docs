---
read_when:
    - Você quer enviar métricas de uso de modelo, fluxo de mensagens ou sessão do OpenClaw para um coletor OpenTelemetry
    - Você está conectando traces, métricas ou logs ao Grafana, Datadog, Honeycomb, New Relic, Tempo ou outro backend OTLP
    - Você precisa dos nomes exatos das métricas, nomes de spans ou formatos de atributos para criar dashboards ou alertas
summary: Exporte diagnósticos do OpenClaw para coletores OpenTelemetry ou JSONL em stdout via Plugin diagnostics-otel
title: Exportação OpenTelemetry
x-i18n:
    generated_at: "2026-07-01T05:34:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2e23876db9446a97545f01436326d08aadf222ec41a326749fd084779a7259f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporta diagnósticos por meio do Plugin oficial `diagnostics-otel`
usando **OTLP/HTTP (protobuf)**. Os logs também podem ser gravados como JSONL em stdout para
pipelines de logs de contêineres e sandboxes. Qualquer coletor ou backend que aceite
OTLP/HTTP funciona sem alterações de código. Para logs em arquivos locais e como lê-los,
consulte [Registro em logs](/pt-BR/logging).

## Como tudo se encaixa

- **Eventos de diagnóstico** são registros estruturados, em processo, emitidos pelo
  Gateway e Plugins incluídos para execuções de modelo, fluxo de mensagens, sessões, filas
  e exec.
- **Plugin `diagnostics-otel`** assina esses eventos e os exporta como
  **métricas**, **rastreamentos** e **logs** do OpenTelemetry por OTLP/HTTP. Ele também pode
  espelhar registros de log de diagnóstico para JSONL em stdout.
- **Chamadas de provedor** recebem um cabeçalho W3C `traceparent` do contexto de span
  confiável de chamada de modelo do OpenClaw quando o transporte do provedor aceita cabeçalhos
  personalizados. O contexto de rastreamento emitido por Plugin não é propagado.
- Os exportadores só são anexados quando tanto a superfície de diagnósticos quanto o Plugin estão
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
No momento, `protocol` oferece suporte apenas a `http/protobuf`. `grpc` é ignorado.
</Note>

## Sinais exportados

| Sinal       | O que entra nele                                                                                                                                                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Métricas** | Contadores e histogramas para uso de tokens, custo, duração da execução, failover, uso de Skills, fluxo de mensagens, eventos de conversa, faixas de fila, estado/recuperação de sessão, execução de ferramentas, payloads grandes demais, exec e pressão de memória. |
| **Rastreamentos**  | Spans para uso de modelo, chamadas de modelo, ciclo de vida do harness, uso de Skills, execução de ferramentas, exec, processamento de webhook/mensagens, montagem de contexto e loops de ferramentas.                                                            |
| **Logs**    | Registros estruturados de `logging.file` exportados por OTLP ou JSONL em stdout quando `diagnostics.otel.logs` está habilitado; os corpos dos logs são retidos, a menos que a captura de conteúdo seja explicitamente habilitada.                                |

Alterne `traces`, `metrics` e `logs` de forma independente. Rastreamentos e métricas
ficam ativados por padrão quando `diagnostics.otel.enabled` é true. Logs ficam desativados por padrão e
são exportados apenas quando `diagnostics.otel.logs` é explicitamente `true`. A exportação de logs
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
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Substitui `diagnostics.otel.endpoint`. Se o valor já contiver `/v1/traces`, `/v1/metrics` ou `/v1/logs`, ele será usado como está.                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Substituições de endpoint específicas de sinal usadas quando a chave de configuração `diagnostics.otel.*Endpoint` correspondente não está definida. A configuração específica de sinal prevalece sobre a variável de ambiente específica de sinal, que prevalece sobre o endpoint compartilhado.                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Substitui `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Substitui o protocolo de transmissão (hoje, apenas `http/protobuf` é respeitado).                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Defina como `gen_ai_latest_experimental` para emitir o formato de span de inferência GenAI experimental mais recente, incluindo nomes de span `{gen_ai.operation.name} {gen_ai.request.model}`, tipo de span `CLIENT` e `gen_ai.provider.name` em vez do `gen_ai.system` legado. As métricas GenAI sempre usam atributos semânticos limitados e de baixa cardinalidade independentemente disso. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Defina como `1` quando outro preload ou processo host já tiver registrado o SDK global do OpenTelemetry. O Plugin então ignora seu próprio ciclo de vida NodeSDK, mas ainda conecta listeners de diagnóstico e respeita `traces`/`metrics`/`logs`.                                                                                                                    |

## Privacidade e captura de conteúdo

Conteúdo bruto de modelo/ferramenta **não** é exportado por padrão. Spans carregam
identificadores limitados (canal, provedor, modelo, categoria de erro, ids de solicitação somente com hash,
origem da ferramenta, proprietário da ferramenta e nome/origem da Skill) e nunca incluem texto do prompt,
texto da resposta, entradas de ferramenta, saídas de ferramenta, caminhos de arquivo de Skills ou chaves de sessão.
Registros de log OTLP mantêm severidade, logger, local do código, contexto de rastreamento confiável
e atributos sanitizados por padrão, mas o corpo bruto da mensagem de log é exportado
somente quando `diagnostics.otel.captureContent` está definido como booleano `true`. Subchaves granulares
`captureContent.*` não habilitam corpos de logs. Rótulos que se parecem com
chaves de sessão de agente com escopo são substituídos por `unknown`.
Métricas de conversa exportam apenas metadados de evento limitados, como modo, transporte,
provedor e tipo de evento. Elas não incluem transcrições, payloads de áudio,
ids de sessão, ids de turno, ids de chamada, ids de sala ou tokens de handoff.

Solicitações de modelo de saída podem incluir um cabeçalho W3C `traceparent`. Esse cabeçalho é
gerado apenas a partir do contexto de rastreamento de diagnóstico pertencente ao OpenClaw para a chamada de modelo
ativa. Cabeçalhos `traceparent` existentes fornecidos pelo chamador são substituídos, então Plugins ou
opções personalizadas de provedor não podem falsificar ancestralidade de rastreamento entre serviços.

Defina `diagnostics.otel.captureContent.*` como `true` somente quando seu coletor e
sua política de retenção forem aprovados para texto de prompt, resposta, ferramenta ou prompt de sistema.
Cada subchave é opt-in de forma independente:

- `inputMessages` - conteúdo do prompt do usuário.
- `outputMessages` - conteúdo da resposta do modelo.
- `toolInputs` - payloads de argumentos de ferramenta.
- `toolOutputs` - payloads de resultados de ferramenta.
- `systemPrompt` - prompt de sistema/desenvolvedor montado.
- `toolDefinitions` - nomes, descrições e esquemas de ferramentas do modelo.

Quando qualquer subchave está habilitada, spans de modelo e ferramenta recebem atributos
`openclaw.content.*` limitados e redigidos apenas para essa classe. Use o booleano
`captureContent: true` somente para capturas amplas de diagnósticos em que os corpos de mensagens de log OTLP
também sejam aprovados para exportação.

O conteúdo de `toolInputs`/`toolOutputs` é capturado para as execuções de ferramentas do runtime de agente
integrado (`openclaw.content.tool_input` em spans concluídos/com erro,
`openclaw.content.tool_output` em spans concluídos). Chamadas de ferramentas de harness externo
(Codex, Claude CLI) emitem spans `tool.execution.*` sem payloads de conteúdo.
O conteúdo capturado trafega em um canal confiável, apenas para listeners, e nunca é colocado
no barramento público de eventos de diagnóstico.

## Amostragem e envio

- **Rastreamentos:** `diagnostics.otel.sampleRate` (somente span raiz, `0.0` descarta tudo,
  `1.0` mantém tudo).
- **Métricas:** `diagnostics.otel.flushIntervalMs` (mínimo `1000`).
- **Logs:** logs OTLP respeitam `logging.level` (nível de log do arquivo). Eles usam o
  caminho de redação de registros de log de diagnóstico, não a formatação do console. Instalações
  de alto volume devem preferir amostragem/filtragem do coletor OTLP em vez de amostragem local.
  Defina `diagnostics.otel.logsExporter: "stdout"` quando sua plataforma já
  envia stdout/stderr para um processador de logs e você não tem um coletor de logs
  OTLP. Registros stdout são um objeto JSON por linha com `ts`, `signal`,
  `service.name`, severidade, corpo, atributos redigidos e campos de rastreamento confiáveis
  quando disponíveis.
- **Correlação de logs de arquivo:** logs de arquivo JSONL incluem `traceId`,
  `spanId`, `parentSpanId` e `traceFlags` no nível superior quando a chamada de log carrega um contexto
  de rastreamento de diagnóstico válido, o que permite que processadores de logs juntem linhas de log locais com
  spans exportados.
- **Correlação de solicitações:** solicitações HTTP do Gateway e quadros WebSocket criam um
  escopo interno de rastreamento de solicitação. Logs e eventos de diagnóstico dentro desse escopo
  herdam o rastreamento da solicitação por padrão, enquanto spans de execução do agente e de chamada de modelo são
  criados como filhos para que os cabeçalhos `traceparent` do provedor permaneçam no mesmo rastreamento.
- **Correlação de chamadas de modelo:** spans `openclaw.model.call` incluem tamanhos seguros de componentes do prompt
  por padrão e incluem atributos de tokens por chamada quando o resultado do
  provedor expõe uso. `openclaw.model.usage` continua sendo o span de contabilidade no nível da execução
  para custo agregado, contexto e painéis de canais; ele permanece
  no mesmo rastreamento de diagnóstico quando o runtime emissor tem contexto de rastreamento
  confiável.

## Métricas exportadas

### Uso de modelo

- `openclaw.tokens` (contador, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (contador, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histograma, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histograma, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histograma, métrica de convenções semânticas GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histograma, segundos, métrica de convenções semânticas GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` opcional)
- `openclaw.model_call.duration_ms` (histograma, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, mais `openclaw.errorCategory` e `openclaw.failureKind` em erros classificados)
- `openclaw.model_call.request_bytes` (histograma, tamanho em bytes UTF-8 da carga final da solicitação ao modelo; sem conteúdo bruto da carga)
- `openclaw.model_call.response_bytes` (histograma, tamanho em bytes UTF-8 das cargas de chunks de resposta transmitidos por streaming; deltas de texto, raciocínio e chamadas de ferramenta de alta frequência contam apenas bytes `delta` incrementais; sem conteúdo bruto da resposta)
- `openclaw.model_call.time_to_first_byte_ms` (histograma, tempo decorrido antes do primeiro evento de resposta transmitido por streaming)
- `openclaw.model.failover` (contador, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (contador, attrs: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, `openclaw.agent` opcional, `openclaw.toolName` opcional)

### Fluxo de mensagens

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
- `openclaw.talk.event.duration_ms` (histograma, attrs: mesmos de `openclaw.talk.event`; emitido quando um evento Talk relata duração)
- `openclaw.talk.audio.bytes` (histograma, attrs: mesmos de `openclaw.talk.event`; emitido para eventos de quadro de áudio Talk que relatam comprimento em bytes)

### Filas e sessões

- `openclaw.queue.lane.enqueue` (contador, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (contador, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histograma, attrs: `openclaw.lane` ou `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histograma, attrs: `openclaw.lane`)
- `openclaw.session.state` (contador, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (contador, attrs: `openclaw.state`; emitido para escrituração recuperável de sessão obsoleta)
- `openclaw.session.stuck_age_ms` (histograma, attrs: `openclaw.state`; emitido para escrituração recuperável de sessão obsoleta)
- `openclaw.session.turn.created` (contador, attrs: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (contador, attrs: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (contador, attrs: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histograma, attrs: mesmos do contador de recuperação correspondente)
- `openclaw.run.attempt` (contador, attrs: `openclaw.attempt`)

### Telemetria de atividade da sessão

`diagnostics.stuckSessionWarnMs` é o limite de idade sem progresso para diagnósticos
de atividade da sessão. Uma sessão `processing` não envelhece em direção a esse limite
enquanto o OpenClaw observa progresso de resposta, ferramenta, status, bloco ou runtime ACP.
Keepalives de digitação não são contados como progresso, então um modelo ou harness silencioso ainda pode
ser detectado.

O OpenClaw classifica sessões pelo trabalho que ele ainda consegue observar:

- `session.long_running`: trabalho incorporado ativo, chamadas de modelo ou chamadas de ferramenta
  ainda estão progredindo. Chamadas de modelo de propriedade do runtime que ficam silenciosas além de
  `diagnostics.stuckSessionWarnMs` também são relatadas como de longa duração antes de
  `diagnostics.stuckSessionAbortMs`, para que provedores de modelo lentos ou sem streaming não
  pareçam sessões de Gateway travadas enquanto continuam observáveis para abortar.
- `session.stalled`: existe trabalho ativo, mas a execução ativa não relatou
  progresso recente. Chamadas de modelo de propriedade do runtime mudam de `session.long_running` para
  `session.stalled` em ou após `diagnostics.stuckSessionAbortMs`; atividade
  obsoleta de modelo/ferramenta sem proprietário não é tratada como trabalho de longa duração inofensivo.
  Execuções incorporadas travadas permanecem inicialmente apenas em observação e depois fazem abort-drain após
  `diagnostics.stuckSessionAbortMs` sem progresso, para que turnos enfileirados atrás da
  lane possam retomar. Quando não definido, o limite de abortar assume como padrão a janela
  estendida mais segura de pelo menos 5 minutos e 3x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: escrituração de sessão obsoleta sem trabalho ativo, ou uma sessão
  enfileirada ociosa com atividade obsoleta de modelo/ferramenta sem proprietário. Isso libera a
  lane de sessão afetada imediatamente após os gates de recuperação passarem.

A recuperação emite eventos estruturados `session.recovery.requested` e
`session.recovery.completed`. O estado de sessão de diagnóstico é marcado como ocioso
somente após um resultado de recuperação mutante (`aborted` ou `released`) e somente se a
mesma geração de processamento ainda for atual.

Somente `session.stuck` emite o contador `openclaw.session.stuck`, o
histograma `openclaw.session.stuck_age_ms` e o span `openclaw.session.stuck`.
Diagnósticos `session.stuck` repetidos fazem backoff enquanto a sessão permanece
inalterada, então painéis devem alertar sobre aumentos sustentados em vez de cada
tick de Heartbeat. Para o controle de configuração e os padrões, consulte
[Referência de configuração](/pt-BR/gateway/configuration-reference#diagnostics).

Avisos de atividade também emitem:

- `openclaw.liveness.warning` (contador, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histograma, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histograma, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histograma, attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histograma, attrs: `openclaw.liveness.reason`)

### Ciclo de vida do harness

- `openclaw.harness.duration_ms` (histograma, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` em erros)

### Execução de ferramenta

- `openclaw.tool.execution.duration_ms` (histograma, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, mais `openclaw.errorCategory` em erros)
- `openclaw.tool.execution.blocked` (contador, attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (histograma, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Internos de diagnóstico (memória e loop de ferramentas)

- `openclaw.payload.large` (contador, attrs: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histograma, attrs: mesmos de `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (histograma, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histograma)
- `openclaw.memory.pressure` (contador, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (contador, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histograma, attrs: `openclaw.toolName`, `openclaw.outcome`)

## Spans exportados

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` por padrão, ou `gen_ai.provider.name` quando as convenções semânticas mais recentes de GenAI estiverem habilitadas
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` por padrão, ou `gen_ai.provider.name` quando as convenções semânticas mais recentes de GenAI estiverem habilitadas
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` e `openclaw.failureKind` opcional em erros
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (somente tamanhos seguros dos componentes, sem texto do prompt)
  - `openclaw.model_call.usage.*` e `gen_ai.usage.*` quando o resultado da chamada ao modelo carrega o uso do provedor para essa chamada individual
  - `openclaw.provider.request_id_hash` (hash limitado baseado em SHA do ID da solicitação do provedor upstream; IDs brutos não são exportados)
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
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (sem mensagens do loop, parâmetros ou saída da ferramenta)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Quando a captura de conteúdo está explicitamente habilitada, spans de modelo e ferramenta também podem
incluir atributos `openclaw.content.*` limitados e redigidos para as classes de
conteúdo específicas que você habilitou.

## Catálogo de eventos de diagnóstico

Os eventos abaixo dão suporte às métricas e aos spans acima. Plugins também podem se inscrever
diretamente neles sem exportação OTLP.

**Uso do modelo**

- `model.usage` - tokens, custo, duração, contexto, provedor/modelo/canal,
  IDs de sessão. `usage` é a contabilização de provedor/turno para custo e telemetria;
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
  ciclo de vida por execução para o harness do agente. Inclui `harnessId`, `pluginId` opcional,
  provedor/modelo/canal e ID da execução. A conclusão adiciona
  `durationMs`, `outcome`, `resultClassification` opcional, `yieldDetected`,
  e contagens de `itemLifecycle`. Erros adicionam `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` e
  `cleanupFailed` opcional.

**Exec**

- `exec.process.completed` - resultado terminal, duração, alvo, modo, código de saída
  e tipo de falha. Texto do comando e diretórios de trabalho não são
  incluídos.
- `exec.approval.followup_suppressed` - acompanhamento de aprovação obsoleto descartado após
  uma recuperação da sessão. Inclui `approvalId`, `reason` (`session_rebound`),
  `phase` (`direct_delivery` ou `gateway_preflight`) e o timestamp do dispatcher.
  Chaves de sessão, rotas e texto do comando não são incluídos.

## Sem um exportador

Você pode manter eventos de diagnóstico disponíveis para Plugins ou coletores personalizados sem
executar `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Para saída de depuração direcionada sem elevar `logging.level`, use flags de diagnóstico.
Flags não diferenciam maiúsculas de minúsculas e aceitam curingas (por exemplo, `telegram.*` ou
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Ou como uma substituição pontual por variável de ambiente:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

A saída das flags vai para o arquivo de log padrão (`logging.file`) e ainda é
redigida por `logging.redactSensitive`. Guia completo:
[Flags de diagnóstico](/pt-BR/diagnostics/flags).

## Desabilitar

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Você também pode deixar `diagnostics-otel` fora de `plugins.allow` ou executar
`openclaw plugins disable diagnostics-otel`.

## Relacionado

- [Logging](/pt-BR/logging) - logs em arquivo, saída do console, acompanhamento pela CLI e a aba Logs da interface de controle
- [Internos de logging do Gateway](/pt-BR/gateway/logging) - estilos de log WS, prefixos de subsistema e captura do console
- [Flags de diagnóstico](/pt-BR/diagnostics/flags) - flags direcionadas de log de depuração
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics) - ferramenta de pacote de suporte para operador (separada da exportação OTEL)
- [Referência de configuração](/pt-BR/gateway/configuration-reference#diagnostics) - referência completa dos campos `diagnostics.*`
