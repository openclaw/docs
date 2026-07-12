---
read_when:
    - Você quer enviar métricas de uso do modelo, fluxo de mensagens ou sessões do OpenClaw para um coletor OpenTelemetry
    - Você está conectando traces, métricas ou logs ao Grafana, Datadog, Honeycomb, New Relic, Tempo ou a outro backend OTLP
    - Você precisa dos nomes exatos das métricas, dos spans ou dos formatos dos atributos para criar painéis ou alertas
summary: Exporte os diagnósticos do OpenClaw para coletores OpenTelemetry ou JSONL no stdout por meio do plugin diagnostics-otel
title: Exportação do OpenTelemetry
x-i18n:
    generated_at: "2026-07-11T23:57:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3f8a1b9e253000272def0fbd361cd311f6645b1aac5a6f06cff014b45e82388
    source_path: gateway/opentelemetry.md
    workflow: 16
---

O OpenClaw exporta diagnósticos por meio do plugin oficial `diagnostics-otel`
usando **OTLP/HTTP (protobuf)**. Os logs também podem ser gravados como JSONL na saída padrão para
pipelines de logs de contêineres e sandboxes. Qualquer coletor ou backend que aceite
OTLP/HTTP funciona sem alterações no código. Para logs em arquivos locais, consulte
[Logs](/pt-BR/logging).

- **Eventos de diagnóstico** são registros estruturados no processo, emitidos pelo
  Gateway e pelos plugins incluídos para execuções de modelos, fluxo de mensagens, sessões, filas
  e exec.
- **`diagnostics-otel`** assina esses eventos e os exporta como
  **métricas**, **rastreamentos** e **logs** do OpenTelemetry por OTLP/HTTP, além de poder
  espelhar registros de log como JSONL na saída padrão.
- **Chamadas de provedores** recebem um cabeçalho W3C `traceparent` do contexto
  confiável do span de chamada de modelo do OpenClaw quando o transporte do provedor aceita cabeçalhos
  personalizados. O contexto de rastreamento emitido por plugins não é propagado.
- Os exportadores são conectados somente quando tanto a superfície de diagnóstico quanto o plugin estão
  habilitados, portanto, por padrão, o custo no processo permanece próximo de zero.

## Início rápido

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

Ou habilite o plugin pela CLI: `openclaw plugins enable diagnostics-otel`.

<Note>
`protocol` aceita apenas `http/protobuf`. Como `traces` e `metrics` são habilitados por padrão, qualquer outro valor (incluindo `grpc`) interrompe toda a assinatura do diagnostics-otel com um aviso `unsupported protocol` — isso também interrompe a exportação de logs como JSONL na saída padrão. Defina explicitamente `traces: false` e `metrics: false` se você quiser apenas `logsExporter: "stdout"` com um valor de protocolo que não seja OTLP.
</Note>

## Sinais exportados

| Sinal       | O que ele contém                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Métricas** | Contadores/histogramas de uso de tokens, custo, duração da execução, failover, uso de Skills, fluxo de mensagens, eventos de conversação, faixas de filas, estado/recuperação de sessões, execução de ferramentas, exec, memória, atividade e integridade do exportador. |
| **Rastreamentos** | Spans de uso de modelos, chamadas de modelos, ciclo de vida do harness, uso de Skills, execução de ferramentas, exec, processamento de webhooks/mensagens, montagem de contexto e loops de ferramentas.                                                      |
| **Logs**    | Registros estruturados de `logging.file` exportados por OTLP ou como JSONL na saída padrão quando `diagnostics.otel.logs` está habilitado; os corpos dos logs são omitidos, a menos que a captura de conteúdo seja explicitamente habilitada.                          |

Alterne `traces`, `metrics` e `logs` de forma independente. Rastreamentos e métricas
ficam habilitados por padrão quando `diagnostics.otel.enabled` é `true`; os logs ficam desabilitados por padrão
e são exportados somente quando `diagnostics.otel.logs` é explicitamente `true`. A exportação de logs
usa OTLP por padrão; defina `diagnostics.otel.logsExporter` como `stdout` para JSONL na
saída padrão ou como `both` para ambos.

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
      protocol: "http/protobuf", // grpc desabilita a exportação OTLP
      serviceName: "openclaw-gateway", // se não definido, usa OTEL_SERVICE_NAME e, depois, "openclaw"
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // amostrador do span raiz, 0.0..1.0
      flushIntervalMs: 60000, // intervalo de exportação de métricas (mín. 1000 ms)
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

| Variável                                                                                                          | Finalidade                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Valor alternativo para `diagnostics.otel.endpoint` quando a chave de configuração não está definida.                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Valores alternativos de endpoint específicos de cada sinal, usados quando a chave de configuração `diagnostics.otel.*Endpoint` correspondente não está definida. A configuração específica do sinal tem precedência sobre a variável de ambiente específica do sinal, que tem precedência sobre o endpoint compartilhado.                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Valor alternativo para `diagnostics.otel.serviceName` quando a chave de configuração não está definida. O nome de serviço padrão é `openclaw`.                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Valor alternativo para o protocolo de transmissão quando `diagnostics.otel.protocol` não está definido. Somente `http/protobuf` habilita a exportação.                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Defina como `gen_ai_latest_experimental` para emitir o formato mais recente de span de inferência de IA generativa: nomes de span `{gen_ai.operation.name} {gen_ai.request.model}`, tipo de span `CLIENT` e `gen_ai.provider.name` em vez do `gen_ai.system` legado. As métricas de IA generativa sempre usam atributos limitados e de baixa cardinalidade. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Defina como `1` quando outro pré-carregamento ou processo hospedeiro já tiver registrado o SDK global do OpenTelemetry. Nesse caso, o plugin ignora seu próprio ciclo de vida do NodeSDK, mas ainda conecta os listeners de diagnóstico e respeita `traces`/`metrics`/`logs`.                                                                                    |

## Privacidade e captura de conteúdo

O conteúdo bruto de modelos/ferramentas **não** é exportado por padrão. Os spans carregam identificadores
limitados (canal, provedor, modelo, categoria de erro, IDs de solicitação somente como hash,
origem da ferramenta, responsável pela ferramenta, nome/origem da Skill) e nunca incluem texto do prompt,
texto da resposta, entradas de ferramentas, saídas de ferramentas, caminhos de arquivos de Skills ou chaves de sessão.
Valores que se parecem com chaves de sessão de agente com escopo (por exemplo, começando com
`agent:`) são substituídos por `unknown` nos atributos de baixa cardinalidade. Por padrão, os registros de log
OTLP mantêm gravidade, logger, localização no código, contexto de rastreamento confiável e
atributos sanitizados; o corpo bruto da mensagem de log é exportado somente
quando `diagnostics.otel.captureContent` é o booleano `true`. As subchaves granulares
`captureContent.*` nunca habilitam os corpos dos logs. As métricas de conversação exportam apenas
metadados limitados de eventos (modo, transporte, provedor, tipo de evento) — sem
transcrições, cargas úteis de áudio, IDs de sessão, IDs de turno, IDs de chamada, IDs de sala ou
tokens de transferência.

As solicitações de saída para modelos podem incluir um cabeçalho W3C `traceparent` gerado apenas
a partir do contexto de rastreamento de diagnóstico pertencente ao OpenClaw para a chamada de modelo ativa.
Cabeçalhos `traceparent` existentes fornecidos pelo chamador são substituídos, portanto plugins ou
opções personalizadas de provedores não podem falsificar a ancestralidade do rastreamento entre serviços.

Defina `diagnostics.otel.captureContent.*` como `true` somente quando seu coletor
e sua política de retenção estiverem aprovados para textos de prompts, respostas, ferramentas ou
prompts de sistema. Cada subchave é independente:

- `inputMessages` — conteúdo do prompt do usuário.
- `outputMessages` — conteúdo da resposta do modelo.
- `toolInputs` — cargas úteis dos argumentos da ferramenta.
- `toolOutputs` — cargas úteis dos resultados da ferramenta.
- `systemPrompt` — prompt de sistema/desenvolvedor montado.
- `toolDefinitions` — nomes, descrições e esquemas das ferramentas do modelo.

Quando qualquer subchave é habilitada, os spans de modelos e ferramentas recebem atributos
`openclaw.content.*` limitados e expurgados somente para essa classe.

<Note>
O booleano `captureContent: true` habilita em conjunto `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions` e os corpos dos logs OTLP, mas **não** `systemPrompt` — defina explicitamente `captureContent.systemPrompt: true` se você também precisar do prompt de sistema montado.
</Note>

O conteúdo de `toolInputs`/`toolOutputs` é capturado nas execuções de ferramentas do runtime
de agente integrado (`openclaw.content.tool_input` e
`gen_ai.tool.call.arguments` em spans concluídos/com erro;
`openclaw.content.tool_output` e `gen_ai.tool.call.result` em spans concluídos).
Os nomes `openclaw.content.*` permanecem como nomes estáveis de atributos do OpenClaw;
as cópias `gen_ai.tool.call.*` os espelham para visualizadores nativos de semconv.
Chamadas de ferramentas de harnesses externos (Codex, Claude CLI) emitem
spans `tool.execution.*` sem cargas úteis de conteúdo. O conteúdo capturado trafega por um
canal confiável, exclusivo para listeners, e nunca é colocado no barramento público de eventos
de diagnóstico.

## Amostragem e liberação

- **Rastreamentos:** `diagnostics.otel.sampleRate` define um `TraceIdRatioBasedSampler`
  somente no span raiz (`0.0` descarta todos, `1.0` mantém todos). Quando não
  definido, usa o padrão do SDK OpenTelemetry (sempre ativo).
- **Métricas:** `diagnostics.otel.flushIntervalMs` (limitado ao mínimo de
  `1000`); quando não definido, usa o padrão de exportação periódica do SDK.
- **Logs:** os logs OTLP respeitam `logging.level` (nível de log do arquivo) e
  usam o fluxo de redação de registros de log de diagnóstico, não a formatação
  do console. Instalações de alto volume devem preferir a amostragem/filtragem
  do coletor OTLP à amostragem local. Defina
  `diagnostics.otel.logsExporter: "stdout"` quando sua plataforma já envia
  stdout/stderr a um processador de logs e você não tem um coletor de logs
  OTLP. Os registros de stdout são um objeto JSON por linha, com `ts`, `signal`,
  `service.name`, severidade, corpo, atributos redigidos e campos confiáveis de
  rastreamento, quando disponíveis.
- **Correlação de logs de arquivo:** os logs de arquivo JSONL incluem
  `traceId`, `spanId`, `parentSpanId` e `traceFlags` no nível superior quando a
  chamada de log contém um contexto válido de rastreamento de diagnóstico,
  permitindo que processadores de logs associem linhas de log locais a spans
  exportados.
- **Correlação de solicitações:** solicitações HTTP e quadros WebSocket do
  Gateway criam um escopo interno de rastreamento de solicitação. Logs e
  eventos de diagnóstico dentro desse escopo herdam, por padrão, o
  rastreamento da solicitação, enquanto spans de execução do agente e de
  chamadas de modelo são criados como filhos, para que os cabeçalhos
  `traceparent` do provedor permaneçam no mesmo rastreamento.
- **Correlação de chamadas de modelo:** spans `openclaw.model.call` incluem, por
  padrão, tamanhos seguros dos componentes do prompt e atributos de tokens por
  chamada quando o resultado do provedor expõe o uso. `openclaw.model.usage`
  continua sendo o span de contabilização no nível da execução para painéis de
  custo agregado, contexto e canal, e permanece no mesmo rastreamento de
  diagnóstico quando o runtime emissor tem um contexto de rastreamento
  confiável.

## Métricas exportadas

### Uso do modelo

- `openclaw.tokens` (contador, atributos: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (contador, atributos: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histograma, atributos: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histograma, atributos: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histograma, métrica das convenções semânticas de GenAI, atributos: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histograma, segundos, métrica das convenções semânticas de GenAI, atributos: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` opcional)
- `openclaw.model_call.duration_ms` (histograma, atributos: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, além de `openclaw.errorCategory` e `openclaw.failureKind` em erros classificados)
- `openclaw.model_call.request_bytes` (histograma, tamanho em bytes UTF-8 da carga útil final da solicitação ao modelo; sem conteúdo bruto da carga útil)
- `openclaw.model_call.response_bytes` (histograma, tamanho em bytes UTF-8 das cargas úteis dos fragmentos de resposta transmitidos; deltas de texto, raciocínio e chamadas de ferramenta de alta frequência contam somente os bytes incrementais de `delta`; sem conteúdo bruto da resposta)
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

### Conversação

- `openclaw.talk.event` (contador, atributos: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histograma, atributos: os mesmos de `openclaw.talk.event`; emitido quando um evento de conversação informa a duração)
- `openclaw.talk.audio.bytes` (histograma, atributos: os mesmos de `openclaw.talk.event`; emitido para eventos de quadro de áudio de conversação que informam o tamanho em bytes)

### Filas e sessões

- `openclaw.queue.lane.enqueue` (contador, atributos: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (contador, atributos: `openclaw.lane`)
- `openclaw.queue.depth` (histograma, atributos: `openclaw.lane` ou `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histograma, atributos: `openclaw.lane`)
- `openclaw.session.state` (contador, atributos: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (contador, atributos: `openclaw.state`; emitido para registros de controle obsoletos e recuperáveis de sessões)
- `openclaw.session.stuck_age_ms` (histograma, atributos: `openclaw.state`; emitido para registros de controle obsoletos e recuperáveis de sessões)
- `openclaw.session.turn.created` (contador, atributos: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (contador, atributos: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (contador, atributos: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (histograma, atributos: os mesmos do contador de recuperação correspondente)
- `openclaw.run.attempt` (contador, atributos: `openclaw.attempt`)

### Telemetria de atividade das sessões

`diagnostics.stuckSessionWarnMs` é o limite de tempo sem progresso para
diagnósticos de atividade de sessões. Uma sessão `processing` não avança em
direção a esse limite enquanto o OpenClaw observa progresso de resposta,
ferramenta, status, bloco ou runtime ACP. Sinais de manutenção de digitação não
contam como progresso, portanto um modelo ou harness silencioso ainda pode ser
detectado.

O OpenClaw classifica as sessões pelo trabalho que ainda consegue observar:

- `session.long_running`: trabalhos incorporados ativos, chamadas de modelo ou
  chamadas de ferramenta ainda estão progredindo. Chamadas de modelo com
  proprietário que permanecem silenciosas além de
  `diagnostics.stuckSessionWarnMs` também são relatadas como de longa duração
  antes de `diagnostics.stuckSessionAbortMs`, para que provedores de modelo
  lentos ou sem streaming não pareçam sessões do Gateway paralisadas enquanto
  o cancelamento ainda pode ser observado.
- `session.stalled`: existe trabalho ativo, mas a execução ativa não relatou
  progresso recente. Chamadas de modelo com proprietário mudam de
  `session.long_running` para `session.stalled` ao atingir ou ultrapassar
  `diagnostics.stuckSessionAbortMs`; atividades obsoletas de modelo/ferramenta
  sem proprietário não são tratadas como trabalhos de longa duração
  inofensivos. Execuções incorporadas paralisadas permanecem inicialmente
  apenas sob observação e, depois, são canceladas e drenadas após
  `diagnostics.stuckSessionAbortMs` sem progresso, para que os turnos enfileirados
  atrás da faixa possam ser retomados. Quando não definido, o limite de
  cancelamento usa como padrão a janela estendida mais segura de pelo menos
  5 minutos e 3 vezes `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: registros de controle obsoletos de uma sessão sem trabalho
  ativo ou uma sessão ociosa enfileirada com atividade obsoleta de
  modelo/ferramenta sem proprietário. Isso libera imediatamente a faixa da
  sessão afetada após a aprovação das proteções de recuperação.

A recuperação emite eventos estruturados `session.recovery.requested` e
`session.recovery.completed`. O estado da sessão de diagnóstico só é marcado
como ocioso após um resultado de recuperação que cause alteração (`aborted` ou
`released`) e somente se a mesma geração de processamento ainda estiver atual.

Somente `session.stuck` emite o contador `openclaw.session.stuck`, o histograma
`openclaw.session.stuck_age_ms` e o span `openclaw.session.stuck`. Diagnósticos
repetidos de `session.stuck` aumentam progressivamente o intervalo enquanto a
sessão permanece inalterada, portanto os painéis devem alertar sobre aumentos
persistentes, e não sobre cada ciclo de Heartbeat. Para a opção de configuração
e os padrões, consulte a
[referência de configuração](/pt-BR/gateway/configuration-reference#diagnostics).

Os avisos de atividade também emitem:

- `openclaw.liveness.warning` (contador, atributos: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (histograma, atributos: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (histograma, atributos: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (histograma, atributos: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (histograma, atributos: `openclaw.liveness.reason`)

### Ciclo de vida do harness

- `openclaw.harness.duration_ms` (histograma, atributos: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` em erros)

### Execução de ferramentas e detecção de loops

- `openclaw.tool.execution.duration_ms` (histograma, atributos: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, além de `openclaw.errorCategory` em erros)
- `openclaw.tool.execution.blocked` (contador, atributos: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)
- `openclaw.tool.loop` (contador, atributos: `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` opcional; emitido quando um loop repetitivo de chamadas de ferramenta é detectado)

### Execução

- `openclaw.exec.duration_ms` (histograma, atributos: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Componentes internos de diagnóstico (memória, cargas úteis, integridade do exportador)

- `openclaw.payload.large` (contador, atributos: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (histograma, atributos: os mesmos de `openclaw.payload.large`)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (histogramas, sem atributos; amostras de memória do processo)
- `openclaw.memory.pressure` (contador, atributos: `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (contador, atributos: `openclaw.diagnostic.async_queue.drop_class`; descartes internos por contrapressão da fila de diagnóstico)
- `openclaw.telemetry.exporter.events` (contador, atributos: `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, `openclaw.reason` opcional, `openclaw.errorCategory` opcional; autotelemetria do ciclo de vida/falhas do exportador)

## Spans exportados

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` por padrão, ou `gen_ai.provider.name` quando houver adesão às convenções semânticas mais recentes de GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` por padrão, ou `gen_ai.provider.name` quando houver adesão às convenções semânticas mais recentes de GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory`, `error.type` e `openclaw.failureKind` opcional em caso de erros
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (somente tamanhos seguros dos componentes, sem texto do prompt)
  - `openclaw.model_call.usage.*` e `gen_ai.usage.*` quando o resultado da chamada ao modelo contém dados de uso do provedor para essa chamada específica
  - Evento de span `openclaw.provider.request` com o atributo `openclaw.upstreamRequestIdHash` (limitado e baseado em hash) quando o resultado do provedor upstream expõe um ID de solicitação; IDs brutos nunca são exportados
  - Com `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, os spans de chamadas ao modelo usam o nome de span de inferência GenAI mais recente, `{gen_ai.operation.name} {gen_ai.request.model}`, e o tipo de span `CLIENT` em vez de `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Na conclusão: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Em caso de erro: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` opcional
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `gen_ai.operation.name` (`execute_tool`), `openclaw.toolName`, `openclaw.tool.source`, `gen_ai.tool.call.id` opcional, `openclaw.tool.owner`, `openclaw.tool.params.*`
  - `openclaw.errorCategory`/`openclaw.errorCode` opcionais em caso de erros, `openclaw.deniedReason` e `openclaw.outcome=blocked` quando negado por uma política ou pelo sandbox
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (sem conteúdo de prompt, histórico, resposta ou chave de sessão)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, `openclaw.loop.paired_tool` opcional (sem mensagens do loop, parâmetros ou saída da ferramenta)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.reason`, `openclaw.memory.rss_bytes`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.heap_total_bytes`, `openclaw.memory.external_bytes`, `openclaw.memory.array_buffers_bytes`, `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms` opcionais

Quando a captura de conteúdo está explicitamente habilitada, os spans de modelos e ferramentas também podem
incluir atributos `openclaw.content.*` limitados e editados para as classes
específicas de conteúdo que você escolheu incluir.

## Catálogo de eventos de diagnóstico

Os eventos abaixo dão suporte às métricas e aos spans acima. Os Plugins também podem
assiná-los diretamente, sem exportação OTLP.

**Uso do modelo**

- `model.usage` — tokens, custo, duração, contexto, provedor/modelo/canal e
  IDs de sessão. `usage` é a contabilização do provedor/turno para custo e telemetria;
  `context.used` é o instantâneo atual do prompt/contexto e pode ser menor que
  `usage.total` do provedor quando há entrada em cache ou chamadas de loop de ferramentas.

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

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  ciclo de vida por execução do harness do agente. Inclui `harnessId`, `pluginId`
  opcional, provedor/modelo/canal e ID da execução. A conclusão adiciona
  `durationMs`, `outcome`, `resultClassification` opcional, `yieldDetected`
  e contagens de `itemLifecycle`. Os erros adicionam `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` e
  `cleanupFailed` opcional.

**Execução**

- `exec.process.completed` — resultado final do terminal, duração, destino, modo, código
  de saída e tipo de falha. O texto do comando e os diretórios de trabalho não são
  incluídos.
- `exec.approval.followup_suppressed` — acompanhamento de aprovação obsoleto descartado
  após a reassociação de uma sessão. Inclui `approvalId`, `reason`
  (`session_rebound`), `phase` (`direct_delivery` ou `gateway_preflight`)
  e o carimbo de data/hora do despachante. Chaves de sessão, rotas e texto do comando
  não são incluídos.

## Sem um exportador

Mantenha os eventos de diagnóstico disponíveis para Plugins ou coletores personalizados sem executar
`diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Para obter uma saída de depuração direcionada sem aumentar `logging.level`, use os sinalizadores de diagnóstico.
Os sinalizadores não diferenciam maiúsculas de minúsculas e aceitam curingas (`telegram.*` ou
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

A saída dos sinalizadores é gravada no arquivo de log padrão (`logging.file`) e continua
sendo editada por `logging.redactSensitive`. Guia completo:
[Sinalizadores de diagnóstico](/pt-BR/diagnostics/flags).

## Desabilitar

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Ou não inclua `diagnostics-otel` em `plugins.allow`, ou execute
`openclaw plugins disable diagnostics-otel`.

## Relacionados

- [Registro em log](/pt-BR/logging) — logs em arquivo, saída do console, acompanhamento pela CLI e a guia de logs da interface de controle
- [Funcionamento interno do registro em log do Gateway](/pt-BR/gateway/logging) — estilos de log de WS, prefixos de subsistemas e captura do console
- [Sinalizadores de diagnóstico](/pt-BR/diagnostics/flags) — sinalizadores direcionados de log de depuração
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics) — ferramenta de pacote de suporte para operadores (separada da exportação OTEL)
- [Referência de configuração](/pt-BR/gateway/configuration-reference#diagnostics) — referência completa dos campos `diagnostics.*`
