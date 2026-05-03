---
read_when:
    - Você quer enviar métricas de uso do modelo, de fluxo de mensagens ou de sessão do OpenClaw para um coletor OpenTelemetry
    - Você está integrando traces, métricas ou logs ao Grafana, Datadog, Honeycomb, New Relic, Tempo ou outro backend OTLP
    - Você precisa dos nomes exatos das métricas, dos nomes dos spans ou das estruturas de atributos para criar painéis ou alertas
summary: Exporte diagnósticos do OpenClaw para qualquer coletor OpenTelemetry por meio do Plugin diagnostics-otel (OTLP/HTTP)
title: Exportação do OpenTelemetry
x-i18n:
    generated_at: "2026-05-03T21:32:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8091aa633a3e10593681f94913a858587a5dc69d9947e0c0d4132f6e897b00b
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporta diagnósticos por meio do plugin oficial `diagnostics-otel`
usando **OTLP/HTTP (protobuf)**. Qualquer coletor ou backend que aceite OTLP/HTTP
funciona sem alterações de código. Para logs em arquivo locais e como lê-los, consulte
[Logging](/pt-BR/logging).

## Como tudo se encaixa

- **Eventos de diagnóstico** são registros estruturados, em processo, emitidos pelo
  Gateway e pelos plugins incluídos para execuções de modelo, fluxo de mensagens, sessões, filas
  e exec.
- O **plugin `diagnostics-otel`** assina esses eventos e os exporta como
  **métricas**, **traces** e **logs** do OpenTelemetry por OTLP/HTTP.
- **Chamadas de provedor** recebem um cabeçalho W3C `traceparent` do contexto de span
  confiável de chamada de modelo do OpenClaw quando o transporte do provedor aceita cabeçalhos
  personalizados. O contexto de trace emitido por plugin não é propagado.
- Exportadores só são anexados quando a superfície de diagnósticos e o plugin estão
  habilitados, então o custo em processo permanece próximo de zero por padrão.

## Início rápido

Para instalações empacotadas, instale o plugin primeiro:

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

Você também pode habilitar o plugin pela CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
No momento, `protocol` aceita apenas `http/protobuf`. `grpc` é ignorado.
</Note>

## Sinais exportados

| Sinal       | O que entra nele                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Métricas** | Contadores e histogramas para uso de tokens, custo, duração da execução, fluxo de mensagens, pistas de fila, estado de sessão, exec e pressão de memória. |
| **Traces**  | Spans para uso de modelo, chamadas de modelo, ciclo de vida do harness, execução de ferramenta, exec, processamento de webhook/mensagem, montagem de contexto e loops de ferramentas. |
| **Logs**    | Registros estruturados de `logging.file` exportados por OTLP quando `diagnostics.otel.logs` está habilitado.                                         |

Alterne `traces`, `metrics` e `logs` de forma independente. Todos os três ficam ativados por padrão
quando `diagnostics.otel.enabled` é verdadeiro.

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

### Variáveis de ambiente

| Variável                                                                                                          | Finalidade                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Sobrescreve `diagnostics.otel.endpoint`. Se o valor já contiver `/v1/traces`, `/v1/metrics` ou `/v1/logs`, ele será usado como está.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Sobrescritas de endpoint específicas por sinal, usadas quando a chave de configuração `diagnostics.otel.*Endpoint` correspondente não está definida. A configuração específica por sinal vence o env específico por sinal, que vence o endpoint compartilhado. |
| `OTEL_SERVICE_NAME`                                                                                               | Sobrescreve `diagnostics.otel.serviceName`.                                                                                                                                                                                                    |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Sobrescreve o protocolo de transporte (hoje, apenas `http/protobuf` é respeitado).                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Defina como `gen_ai_latest_experimental` para emitir o atributo experimental mais recente de span GenAI (`gen_ai.provider.name`) em vez do legado `gen_ai.system`. Métricas GenAI sempre usam atributos semânticos limitados e de baixa cardinalidade, independentemente disso. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Defina como `1` quando outro preload ou processo host já tiver registrado o SDK global do OpenTelemetry. O plugin então pula seu próprio ciclo de vida do NodeSDK, mas ainda conecta listeners de diagnóstico e respeita `traces`/`metrics`/`logs`. |

## Privacidade e captura de conteúdo

Conteúdo bruto de modelo/ferramenta **não** é exportado por padrão. Spans carregam identificadores
limitados (canal, provedor, modelo, categoria de erro, ids de solicitação apenas com hash)
e nunca incluem texto de prompt, texto de resposta, entradas de ferramenta, saídas de ferramenta ou
chaves de sessão.

Solicitações de modelo de saída podem incluir um cabeçalho W3C `traceparent`. Esse cabeçalho é
gerado apenas a partir do contexto de trace de diagnóstico pertencente ao OpenClaw para a chamada de modelo
ativa. Cabeçalhos `traceparent` existentes fornecidos pelo chamador são substituídos, então plugins ou
opções personalizadas de provedor não conseguem falsificar ancestralidade de trace entre serviços.

Defina `diagnostics.otel.captureContent.*` como `true` somente quando seu coletor e
sua política de retenção forem aprovados para texto de prompt, resposta, ferramenta ou prompt de sistema.
Cada subchave é opcional de forma independente:

- `inputMessages` — conteúdo do prompt do usuário.
- `outputMessages` — conteúdo da resposta do modelo.
- `toolInputs` — payloads de argumentos de ferramenta.
- `toolOutputs` — payloads de resultados de ferramenta.
- `systemPrompt` — prompt de sistema/desenvolvedor montado.

Quando qualquer subchave está habilitada, spans de modelo e ferramenta recebem atributos
`openclaw.content.*` limitados e redigidos apenas para essa classe.

## Amostragem e flush

- **Traces:** `diagnostics.otel.sampleRate` (somente span raiz, `0.0` descarta tudo,
  `1.0` mantém tudo).
- **Métricas:** `diagnostics.otel.flushIntervalMs` (mínimo `1000`).
- **Logs:** logs OTLP respeitam `logging.level` (nível de log de arquivo). Eles usam o
  caminho de redação de registros de log de diagnóstico, não a formatação do console. Instalações de
  alto volume devem preferir amostragem/filtragem no coletor OTLP em vez de amostragem local.
- **Correlação de logs em arquivo:** logs de arquivo JSONL incluem `traceId`,
  `spanId`, `parentSpanId` e `traceFlags` no nível superior quando a chamada de log carrega um contexto
  válido de trace de diagnóstico, o que permite que processadores de log associem linhas de log locais a
  spans exportados.
- **Correlação de solicitações:** solicitações HTTP do Gateway e frames WebSocket criam um
  escopo interno de trace de solicitação. Logs e eventos de diagnóstico dentro desse escopo
  herdam o trace da solicitação por padrão, enquanto spans de execução de agente e chamada de modelo são
  criados como filhos para que cabeçalhos `traceparent` do provedor permaneçam no mesmo trace.

## Métricas exportadas

### Uso de modelo

- `openclaw.tokens` (contador, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (contador, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histograma, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histograma, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histograma, métrica de convenções semânticas GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histograma, segundos, métrica de convenções semânticas GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` opcional)
- `openclaw.model_call.duration_ms` (histograma, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, mais `openclaw.errorCategory` e `openclaw.failureKind` em erros classificados)
- `openclaw.model_call.request_bytes` (histograma, tamanho em bytes UTF-8 do payload final de solicitação ao modelo; sem conteúdo bruto do payload)
- `openclaw.model_call.response_bytes` (histograma, tamanho em bytes UTF-8 de eventos de resposta de modelo transmitidos por streaming; sem conteúdo bruto da resposta)
- `openclaw.model_call.time_to_first_byte_ms` (histograma, tempo decorrido antes do primeiro evento de resposta transmitido por streaming)

### Fluxo de mensagens

- `openclaw.webhook.received` (contador, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (contador, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histograma, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (contador, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (contador, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histograma, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (contador, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histograma, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Filas e sessões

- `openclaw.queue.lane.enqueue` (contador, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (contador, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histograma, attrs: `openclaw.lane` ou `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histograma, attrs: `openclaw.lane`)
- `openclaw.session.state` (contador, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (contador, attrs: `openclaw.state`; emitido apenas para bookkeeping de sessão obsoleta sem trabalho ativo)
- `openclaw.session.stuck_age_ms` (histograma, attrs: `openclaw.state`; emitido apenas para bookkeeping de sessão obsoleta sem trabalho ativo)
- `openclaw.run.attempt` (contador, attrs: `openclaw.attempt`)

### Telemetria de atividade de sessão

`diagnostics.stuckSessionWarnMs` é o limite de idade sem progresso para diagnósticos
de atividade de sessão. Uma sessão `processing` não avança em direção a esse limite
enquanto o OpenClaw observa progresso de resposta, ferramenta, status, bloco ou runtime ACP.
Keepalives de digitação não contam como progresso, então um modelo ou harness silencioso ainda pode
ser detectado.

OpenClaw classifica sessões pelo trabalho que ainda consegue observar:

- `session.long_running`: trabalho incorporado ativo, chamadas de modelo ou chamadas de ferramenta
  ainda estão progredindo.
- `session.stalled`: há trabalho ativo, mas a execução ativa não relatou
  progresso recente. Execuções incorporadas paralisadas permanecem inicialmente somente observação e depois
  abortam e drenam após pelo menos 10 minutos e 5x `diagnostics.stuckSessionWarnMs`
  sem progresso, para que turnos enfileirados atrás da lane possam retomar.
- `session.stuck`: controle de sessão obsoleto sem trabalho ativo. Isso libera
  a lane da sessão afetada imediatamente.

Somente `session.stuck` emite o contador `openclaw.session.stuck`, o
histograma `openclaw.session.stuck_age_ms` e o span `openclaw.session.stuck`.
Diagnósticos repetidos de `session.stuck` fazem backoff enquanto a sessão permanece
inalterada, então dashboards devem alertar sobre aumentos sustentados, e não sobre cada
tick de Heartbeat. Para o seletor de configuração e os padrões, consulte
[Referência de configuração](/pt-BR/gateway/configuration-reference#diagnostics).

### Ciclo de vida do harness

- `openclaw.harness.duration_ms` (histograma, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` em erros)

### Exec

- `openclaw.exec.duration_ms` (histograma, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Internos de diagnóstico (memória e loop de ferramentas)

- `openclaw.memory.heap_used_bytes` (histograma, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histograma)
- `openclaw.memory.pressure` (contador, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (contador, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histograma, attrs: `openclaw.toolName`, `openclaw.outcome`)

## Spans exportados

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` por padrão, ou `gen_ai.provider.name` quando as convenções semânticas mais recentes de GenAI são habilitadas
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` por padrão, ou `gen_ai.provider.name` quando as convenções semânticas mais recentes de GenAI são habilitadas
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` e `openclaw.failureKind` opcional em erros
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (hash limitado baseado em SHA do id de solicitação do provedor upstream; ids brutos não são exportados)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Na conclusão: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Em erro: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` opcional
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (sem conteúdo de prompt, histórico, resposta ou chave de sessão)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (sem mensagens de loop, params ou saída de ferramenta)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Quando a captura de conteúdo é explicitamente habilitada, spans de modelo e ferramenta também podem
incluir atributos `openclaw.content.*` limitados e redigidos para as classes
de conteúdo específicas que você habilitou.

## Catálogo de eventos de diagnóstico

Os eventos abaixo dão suporte às métricas e spans acima. Plugins também podem assinar
esses eventos diretamente sem exportação OTLP.

**Uso do modelo**

- `model.usage` — tokens, custo, duração, contexto, provedor/modelo/canal,
  ids de sessão. `usage` é a contabilidade de provedor/turno para custo e telemetria;
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

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  ciclo de vida por execução para o harness do agente. Inclui `harnessId`, `pluginId`
  opcional, provedor/modelo/canal e id da execução. A conclusão adiciona
  `durationMs`, `outcome`, `resultClassification` opcional, `yieldDetected`
  e contagens de `itemLifecycle`. Erros adicionam `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` e
  `cleanupFailed` opcional.

**Exec**

- `exec.process.completed` — resultado terminal, duração, destino, modo, código
  de saída e tipo de falha. O texto do comando e diretórios de trabalho não são
  incluídos.

## Sem um exportador

Você pode manter eventos de diagnóstico disponíveis para plugins ou coletores personalizados sem
executar `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Para saída de depuração direcionada sem aumentar `logging.level`, use flags de diagnóstico.
As flags não diferenciam maiúsculas de minúsculas e oferecem suporte a curingas (por exemplo, `telegram.*` ou
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Ou como uma substituição de env pontual:

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

- [Logging](/pt-BR/logging) — logs em arquivo, saída do console, acompanhamento pela CLI e a aba Logs da Control UI
- [Internos de logging do Gateway](/pt-BR/gateway/logging) — estilos de log WS, prefixos de subsistema e captura de console
- [Flags de diagnóstico](/pt-BR/diagnostics/flags) — flags de log de depuração direcionadas
- [Exportação de diagnóstico](/pt-BR/gateway/diagnostics) — ferramenta de pacote de suporte para operadores (separada da exportação OTEL)
- [Referência de configuração](/pt-BR/gateway/configuration-reference#diagnostics) — referência completa dos campos `diagnostics.*`
