---
read_when:
    - Você quer enviar uso de modelo, fluxo de mensagens ou métricas de sessão do OpenClaw para um coletor OpenTelemetry
    - Você está conectando traces, métricas ou logs ao Grafana, Datadog, Honeycomb, New Relic, Tempo ou outro backend OTLP
    - Você precisa dos nomes exatos de métricas, nomes de spans ou formatos de atributos para criar dashboards ou alertas
summary: Exporte os diagnósticos do OpenClaw para qualquer coletor OpenTelemetry via o plugin diagnostics-otel (OTLP/HTTP)
title: Exportação OpenTelemetry
x-i18n:
    generated_at: "2026-04-26T11:29:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63fe66de2d046255a0e5b0eee8bbead2c9d278b8911bdc09bfee1e9c59294418
    source_path: gateway/opentelemetry.md
    workflow: 15
---

O OpenClaw exporta diagnósticos por meio do plugin integrado `diagnostics-otel`
usando **OTLP/HTTP (protobuf)**. Qualquer coletor ou backend que aceite OTLP/HTTP
funciona sem mudanças de código. Para logs locais em arquivo e como lê-los, veja
[Logs](/pt-BR/logging).

## Como isso se encaixa

- **Eventos de diagnóstico** são registros estruturados em processo emitidos pelo
  Gateway e por Plugins integrados para execuções de modelo, fluxo de mensagens, sessões, filas
  e exec.
- O **plugin `diagnostics-otel`** assina esses eventos e os exporta como
  **métricas**, **traces** e **logs** do OpenTelemetry via OTLP/HTTP.
- **Chamadas a providers** recebem um header W3C `traceparent` do contexto
  confiável de span de chamada de modelo do OpenClaw quando o transporte do provider aceita
  headers personalizados. Contexto de trace emitido por Plugin não é propagado.
- Exportadores só são anexados quando tanto a superfície de diagnósticos quanto o plugin estão
  ativados, então o custo em processo permanece próximo de zero por padrão.

## Início rápido

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

Você também pode ativar o plugin pela CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` atualmente oferece suporte apenas a `http/protobuf`. `grpc` é ignorado.
</Note>

## Sinais exportados

| Sinal       | O que entra nele                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Métricas** | Contadores e histogramas para uso de tokens, custo, duração de execução, fluxo de mensagens, lanes de fila, estado de sessão, exec e pressão de memória. |
| **Traces**  | Spans para uso de modelo, chamadas de modelo, ciclo de vida de harness, execução de ferramentas, exec, processamento de Webhook/mensagem, montagem de contexto e loops de ferramenta. |
| **Logs**    | Registros estruturados de `logging.file` exportados via OTLP quando `diagnostics.otel.logs` está ativado.                                  |

Ative/desative `traces`, `metrics` e `logs` independentemente. Os três ficam ativados por padrão
quando `diagnostics.otel.enabled` é true.

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
      protocol: "http/protobuf", // grpc é ignorado
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // sampler de span raiz, 0.0..1.0
      flushIntervalMs: 60000, // intervalo de exportação de métricas (mín. 1000ms)
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

| Variável                                                                                                          | Finalidade                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Substitui `diagnostics.otel.endpoint`. Se o valor já contiver `/v1/traces`, `/v1/metrics` ou `/v1/logs`, ele é usado como está.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Substituições de endpoint específicas por sinal usadas quando a chave de config correspondente `diagnostics.otel.*Endpoint` não está definida. Config específica por sinal vence env específica por sinal, que vence o endpoint compartilhado. |
| `OTEL_SERVICE_NAME`                                                                                               | Substitui `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Substitui o protocolo de transporte (apenas `http/protobuf` é respeitado hoje).                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Defina como `gen_ai_latest_experimental` para emitir o atributo mais recente experimental de span GenAI (`gen_ai.provider.name`) em vez do legado `gen_ai.system`. Métricas GenAI sempre usam atributos semânticos limitados e de baixa cardinalidade. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Defina como `1` quando outro preload ou processo host já tiver registrado o SDK global do OpenTelemetry. O plugin então ignora seu próprio ciclo de vida de NodeSDK, mas ainda conecta listeners de diagnóstico e respeita `traces`/`metrics`/`logs`. |

## Privacidade e captura de conteúdo

Conteúdo bruto de modelo/ferramenta **não** é exportado por padrão. Spans carregam
identificadores limitados (canal, provider, modelo, categoria de erro, ids de requisição somente em hash)
e nunca incluem texto do prompt, texto da resposta, entradas de ferramenta, saídas de ferramenta ou
chaves de sessão.

Requisições de modelo de saída podem incluir um header W3C `traceparent`. Esse header é
gerado apenas a partir do contexto de trace de diagnóstico controlado pelo OpenClaw para a chamada
ativa do modelo. Headers `traceparent` já fornecidos pelo chamador são substituídos, então Plugins ou
opções personalizadas de provider não podem falsificar ancestralidade de trace entre serviços.

Defina `diagnostics.otel.captureContent.*` como `true` apenas quando seu coletor e
política de retenção estiverem aprovados para texto de prompt, resposta, ferramenta ou prompt de sistema.
Cada subchave é opt-in independentemente:

- `inputMessages` — conteúdo do prompt do usuário.
- `outputMessages` — conteúdo da resposta do modelo.
- `toolInputs` — payloads de argumentos de ferramenta.
- `toolOutputs` — payloads de resultado de ferramenta.
- `systemPrompt` — prompt de sistema/desenvolvedor montado.

Quando qualquer subchave está ativada, spans de modelo e ferramenta recebem atributos
`openclaw.content.*` limitados e redigidos apenas para essa classe.

## Sampling e flush

- **Traces:** `diagnostics.otel.sampleRate` (apenas span raiz, `0.0` descarta tudo,
  `1.0` mantém tudo).
- **Métricas:** `diagnostics.otel.flushIntervalMs` (mínimo `1000`).
- **Logs:** logs OTLP respeitam `logging.level` (nível de log do arquivo). A
  redação do console **não** se aplica a logs OTLP. Instalações de alto volume devem
  preferir sampling/filtragem no coletor OTLP em vez de sampling local.

## Métricas exportadas

### Uso de modelo

- `openclaw.tokens` (contador, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (contador, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histograma, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histograma, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histograma, métrica de convenções semânticas GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histograma, segundos, métrica de convenções semânticas GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, opcional `error.type`)

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
- `openclaw.session.stuck` (contador, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histograma, attrs: `openclaw.state`)
- `openclaw.run.attempt` (contador, attrs: `openclaw.attempt`)

### Ciclo de vida do harness

- `openclaw.harness.duration_ms` (histograma, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` em erros)

### Exec

- `openclaw.exec.duration_ms` (histograma, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Internos de diagnóstico (memória e loop de ferramenta)

- `openclaw.memory.heap_used_bytes` (histograma, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (histograma)
- `openclaw.memory.pressure` (contador, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (contador, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (histograma, attrs: `openclaw.toolName`, `openclaw.outcome`)

## Spans exportados

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` por padrão, ou `gen_ai.provider.name` quando as convenções semânticas GenAI mais recentes estiverem ativadas
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` por padrão, ou `gen_ai.provider.name` quando as convenções semânticas GenAI mais recentes estiverem ativadas
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.provider.request_id_hash` (hash limitado baseado em SHA do id de requisição do provider upstream; ids brutos não são exportados)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Na conclusão: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - Em erro: `openclaw.harness.phase`, `openclaw.errorCategory`, opcional `openclaw.harness.cleanup_failed`
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
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (sem mensagens do loop, params ou saída de ferramenta)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Quando a captura de conteúdo está explicitamente ativada, spans de modelo e ferramenta também podem
incluir atributos `openclaw.content.*` limitados e redigidos para as classes específicas
de conteúdo que você escolheu incluir.

## Catálogo de eventos de diagnóstico

Os eventos abaixo sustentam as métricas e spans acima. Plugins também podem assinar
esses eventos diretamente sem exportação OTLP.

**Uso de modelo**

- `model.usage` — tokens, custo, duração, contexto, provider/model/channel,
  ids de sessão. `usage` é a contabilidade do provider/turno para custo e telemetria;
  `context.used` é o snapshot atual de prompt/contexto e pode ser menor que
  `usage.total` do provider quando entrada em cache ou chamadas de loop de ferramenta estão envolvidas.

**Fluxo de mensagens**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Fila e sessão**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` (contadores agregados: webhooks/fila/sessão)

**Ciclo de vida do harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  ciclo de vida por execução do harness do agente. Inclui `harnessId`, `pluginId`
  opcional, provider/model/channel e id da execução. A conclusão adiciona
  `durationMs`, `outcome`, `resultClassification` opcional, `yieldDetected`
  e contagens de `itemLifecycle`. Erros adicionam `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` e
  `cleanupFailed` opcional.

**Exec**

- `exec.process.completed` — resultado final, duração, alvo, modo, código de
  saída e tipo de falha. Texto de comando e diretórios de trabalho não
  são incluídos.

## Sem exportador

Você pode manter eventos de diagnóstico disponíveis para Plugins ou sinks personalizados sem
executar `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Para saída de depuração direcionada sem aumentar `logging.level`, use flags de
diagnóstico. Flags não diferenciam maiúsculas de minúsculas e oferecem suporte a curingas (por exemplo `telegram.*` ou
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Ou como uma substituição única por env:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

A saída da flag vai para o arquivo de log padrão (`logging.file`) e ainda é
redigida por `logging.redactSensitive`. Guia completo:
[Flags de diagnóstico](/pt-BR/diagnostics/flags).

## Desativar

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Você também pode deixar `diagnostics-otel` fora de `plugins.allow`, ou executar
`openclaw plugins disable diagnostics-otel`.

## Relacionados

- [Logs](/pt-BR/logging) — logs em arquivo, saída do console, tail pela CLI e a aba Logs da Control UI
- [Internals de logs do Gateway](/pt-BR/gateway/logging) — estilos de log WS, prefixos de subsistema e captura do console
- [Flags de diagnóstico](/pt-BR/diagnostics/flags) — flags de log de depuração direcionadas
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics) — ferramenta de bundle de suporte para operadores (separada da exportação OTEL)
- [Referência de configuração](/pt-BR/gateway/configuration-reference#diagnostics) — referência completa dos campos `diagnostics.*`
