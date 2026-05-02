---
read_when:
    - Você quer enviar o uso do modelo, o fluxo de mensagens ou as métricas de sessão do OpenClaw para um coletor OpenTelemetry
    - Você está conectando rastreamentos, métricas ou registros ao Grafana, Datadog, Honeycomb, New Relic, Tempo ou a outro back-end OTLP
    - Você precisa dos nomes exatos das métricas, dos nomes dos spans ou dos formatos dos atributos para criar dashboards ou alertas
summary: Exporte os diagnósticos do OpenClaw para qualquer coletor OpenTelemetry por meio do Plugin diagnostics-otel (OTLP/HTTP)
title: Exportação do OpenTelemetry
x-i18n:
    generated_at: "2026-05-02T20:47:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3287540a32b9b8400f227ab9400073e8145af89e5246e6af06945a96b751826f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw exporta diagnósticos por meio do Plugin oficial `diagnostics-otel`
usando **OTLP/HTTP (protobuf)**. Qualquer coletor ou backend que aceite OTLP/HTTP
funciona sem alterações de código. Para logs em arquivos locais e como lê-los, consulte
[Logging](/pt-BR/logging).

## Como tudo se encaixa

- **Eventos de diagnóstico** são registros estruturados, em processo, emitidos pelo
  Gateway e pelos Plugins incluídos para execuções de modelo, fluxo de mensagens, sessões, filas
  e exec.
- **Plugin `diagnostics-otel`** assina esses eventos e os exporta como
  **métricas**, **traces** e **logs** do OpenTelemetry via OTLP/HTTP.
- **Chamadas de provedores** recebem um cabeçalho W3C `traceparent` do contexto
  de span confiável de chamada de modelo do OpenClaw quando o transporte do provedor aceita cabeçalhos
  personalizados. O contexto de trace emitido por Plugin não é propagado.
- Exportadores só são anexados quando tanto a superfície de diagnósticos quanto o Plugin estão
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

| Sinal       | O que entra nele                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Métricas** | Contadores e histogramas para uso de tokens, custo, duração de execução, fluxo de mensagens, lanes de fila, estado de sessão, exec e pressão de memória. |
| **Traces**  | Spans para uso de modelo, chamadas de modelo, ciclo de vida do harness, execução de ferramentas, exec, processamento de Webhook/mensagens, montagem de contexto e loops de ferramentas. |
| **Logs**    | Registros `logging.file` estruturados exportados por OTLP quando `diagnostics.otel.logs` está habilitado.                                             |

Alterne `traces`, `metrics` e `logs` de forma independente. Todos os três ficam ativados
por padrão quando `diagnostics.otel.enabled` é true.

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

| Variável                                                                                                          | Finalidade                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Substitui `diagnostics.otel.endpoint`. Se o valor já contiver `/v1/traces`, `/v1/metrics` ou `/v1/logs`, ele será usado como está.                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Substituições de endpoint específicas de sinal usadas quando a chave de configuração `diagnostics.otel.*Endpoint` correspondente não está definida. A configuração específica de sinal prevalece sobre a variável de ambiente específica de sinal, que prevalece sobre o endpoint compartilhado. |
| `OTEL_SERVICE_NAME`                                                                                               | Substitui `diagnostics.otel.serviceName`.                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Substitui o protocolo de transmissão (somente `http/protobuf` é respeitado hoje).                                                                                                                                                               |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Defina como `gen_ai_latest_experimental` para emitir o atributo de span GenAI experimental mais recente (`gen_ai.provider.name`) em vez do legado `gen_ai.system`. Métricas GenAI sempre usam atributos semânticos limitados e de baixa cardinalidade, independentemente disso. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Defina como `1` quando outro preload ou processo host já tiver registrado o SDK global do OpenTelemetry. O Plugin então pula seu próprio ciclo de vida do NodeSDK, mas ainda conecta listeners de diagnóstico e respeita `traces`/`metrics`/`logs`. |

## Privacidade e captura de conteúdo

O conteúdo bruto de modelo/ferramenta **não** é exportado por padrão. Spans carregam identificadores limitados (canal, provedor, modelo, categoria de erro, ids de solicitação apenas em hash) e nunca incluem texto de prompt, texto de resposta, entradas de ferramenta, saídas de ferramenta ou chaves de sessão.

Solicitações de modelo de saída podem incluir um cabeçalho W3C `traceparent`. Esse cabeçalho é gerado apenas a partir do contexto de rastreamento diagnóstico pertencente ao OpenClaw para a chamada de modelo ativa. Cabeçalhos `traceparent` existentes fornecidos pelo chamador são substituídos, para que plugins ou opções personalizadas de provedor não possam falsificar ancestralidade de rastreamento entre serviços.

Defina `diagnostics.otel.captureContent.*` como `true` somente quando seu coletor e sua política de retenção estiverem aprovados para texto de prompt, resposta, ferramenta ou prompt de sistema. Cada subchave é ativada independentemente:

- `inputMessages` — conteúdo do prompt do usuário.
- `outputMessages` — conteúdo da resposta do modelo.
- `toolInputs` — cargas de argumentos da ferramenta.
- `toolOutputs` — cargas de resultado da ferramenta.
- `systemPrompt` — prompt de sistema/desenvolvedor montado.

Quando qualquer subchave é habilitada, spans de modelo e ferramenta recebem atributos `openclaw.content.*` limitados e redigidos apenas para essa classe.

## Amostragem e flush

- **Rastreamentos:** `diagnostics.otel.sampleRate` (somente span raiz, `0.0` descarta tudo, `1.0` mantém tudo).
- **Métricas:** `diagnostics.otel.flushIntervalMs` (mínimo `1000`).
- **Logs:** logs OTLP respeitam `logging.level` (nível de log em arquivo). Eles usam o caminho de redação de registros de log diagnósticos, não a formatação do console. Instalações de alto volume devem preferir amostragem/filtragem do coletor OTLP em vez de amostragem local.
- **Correlação de logs em arquivo:** logs em arquivo JSONL incluem `traceId`, `spanId`, `parentSpanId` e `traceFlags` no nível superior quando a chamada de log carrega um contexto de rastreamento diagnóstico válido, o que permite que processadores de log associem linhas de log locais a spans exportados.
- **Correlação de solicitações:** requisições HTTP do Gateway e quadros WebSocket criam um escopo interno de rastreamento de requisição. Logs e eventos diagnósticos dentro desse escopo herdam o rastreamento da requisição por padrão, enquanto spans de execução de agente e chamada de modelo são criados como filhos para que cabeçalhos `traceparent` do provedor permaneçam no mesmo rastreamento.

## Métricas exportadas

### Uso de modelo

- `openclaw.tokens` (contador, atributos: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (contador, atributos: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histograma, atributos: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histograma, atributos: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histograma, métrica de convenções semânticas GenAI, atributos: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histograma, segundos, métrica de convenções semânticas GenAI, atributos: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, `error.type` opcional)
- `openclaw.model_call.duration_ms` (histograma, atributos: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, além de `openclaw.errorCategory` e `openclaw.failureKind` em erros classificados)
- `openclaw.model_call.request_bytes` (histograma, tamanho em bytes UTF-8 da carga final da solicitação de modelo; sem conteúdo bruto da carga)
- `openclaw.model_call.response_bytes` (histograma, tamanho em bytes UTF-8 dos eventos de resposta de modelo transmitidos; sem conteúdo bruto da resposta)
- `openclaw.model_call.time_to_first_byte_ms` (histograma, tempo decorrido antes do primeiro evento de resposta transmitido)

### Fluxo de mensagens

- `openclaw.webhook.received` (contador, atributos: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (contador, atributos: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histograma, atributos: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (contador, atributos: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (contador, atributos: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histograma, atributos: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (contador, atributos: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histograma, atributos: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Filas e sessões

- `openclaw.queue.lane.enqueue` (contador, atributos: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (contador, atributos: `openclaw.lane`)
- `openclaw.queue.depth` (histograma, atributos: `openclaw.lane` ou `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histograma, atributos: `openclaw.lane`)
- `openclaw.session.state` (contador, atributos: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (contador, atributos: `openclaw.state`; emitido apenas para controle de sessão obsoleta sem trabalho ativo)
- `openclaw.session.stuck_age_ms` (histograma, atributos: `openclaw.state`; emitido apenas para controle de sessão obsoleta sem trabalho ativo)
- `openclaw.run.attempt` (contador, atributos: `openclaw.attempt`)

### Telemetria de atividade da sessão

`diagnostics.stuckSessionWarnMs` é o limite de idade sem progresso para diagnósticos de atividade da sessão. Uma sessão `processing` não avança em direção a esse limite enquanto o OpenClaw observa progresso de resposta, ferramenta, status, bloco ou runtime ACP. Keepalives de digitação não são contados como progresso, então um modelo ou harness silencioso ainda pode ser detectado.

O OpenClaw classifica sessões pelo trabalho que ainda consegue observar:

- `session.long_running`: trabalho incorporado ativo, chamadas de modelo ou chamadas de ferramenta
  ainda estão progredindo.
- `session.stalled`: há trabalho ativo, mas a execução ativa não relatou
  progresso recente.
- `session.stuck`: escrituração obsoleta de sessão sem trabalho ativo. Esta é a
  única classificação de vivacidade que libera a faixa de sessão afetada.

Somente `session.stuck` emite o contador `openclaw.session.stuck`, o
histograma `openclaw.session.stuck_age_ms` e o span `openclaw.session.stuck`.
Diagnósticos repetidos de `session.stuck` usam recuo enquanto a sessão permanece
inalterada, portanto dashboards devem alertar sobre aumentos sustentados, e não sobre cada
tick de Heartbeat. Para a opção de configuração e os padrões, consulte a
[Referência de configuração](/pt-BR/gateway/configuration-reference#diagnostics).

### Ciclo de vida do harness

- `openclaw.harness.duration_ms` (histograma, atributos: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` em erros)

### Execução

- `openclaw.exec.duration_ms` (histograma, atributos: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Componentes internos de diagnóstico (memória e loop de ferramentas)

- `openclaw.memory.heap_used_bytes` (histograma, atributos: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histograma)
- `openclaw.memory.pressure` (contador, atributos: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (contador, atributos: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histograma, atributos: `openclaw.toolName`, `openclaw.outcome`)

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
  - `openclaw.provider.request_id_hash` (hash limitado baseado em SHA do id da solicitação do provedor upstream; ids brutos não são exportados)
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
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (sem mensagens do loop, parâmetros ou saída de ferramenta)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Quando a captura de conteúdo é habilitada explicitamente, spans de modelo e ferramenta também podem
incluir atributos `openclaw.content.*` limitados e redigidos para as classes
de conteúdo específicas nas quais você optou.

## Catálogo de eventos de diagnóstico

Os eventos abaixo dão suporte às métricas e aos spans acima. Plugins também podem assinar
esses eventos diretamente sem exportação OTLP.

**Uso do modelo**

- `model.usage` — tokens, custo, duração, contexto, provedor/modelo/canal,
  ids de sessão. `usage` é a contabilização por provedor/turno para custo e telemetria;
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
  opcional, provedor/modelo/canal e id de execução. A conclusão adiciona
  `durationMs`, `outcome`, `resultClassification` opcional, `yieldDetected`
  e contagens de `itemLifecycle`. Erros adicionam `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` e
  `cleanupFailed` opcional.

**Execução**

- `exec.process.completed` — resultado terminal, duração, alvo, modo, código de saída
  e tipo de falha. O texto do comando e diretórios de trabalho não são
  incluídos.

## Sem um exportador

Você pode manter eventos de diagnóstico disponíveis para Plugins ou destinos personalizados sem
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

Ou como uma substituição pontual de env:

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

## Relacionado

- [Logs](/pt-BR/logging) — logs em arquivo, saída do console, acompanhamento pela CLI e a aba Logs da Control UI
- [Componentes internos de logs do Gateway](/pt-BR/gateway/logging) — estilos de log WS, prefixos de subsistema e captura do console
- [Flags de diagnóstico](/pt-BR/diagnostics/flags) — flags direcionadas de log de depuração
- [Exportação de diagnóstico](/pt-BR/gateway/diagnostics) — ferramenta de pacote de suporte para operadores (separada da exportação OTEL)
- [Referência de configuração](/pt-BR/gateway/configuration-reference#diagnostics) — referência completa dos campos `diagnostics.*`
