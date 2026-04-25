---
read_when:
    - Você precisa de uma visão geral de logs amigável para iniciantes
    - Você quer configurar níveis ou formatos de log
    - Você está solucionando problemas e precisa encontrar logs rapidamente
summary: 'Visão geral dos logs: logs em arquivo, saída no console, acompanhamento pela CLI e UI de controle'
title: Visão geral dos logs
x-i18n:
    generated_at: "2026-04-25T13:49:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: e16a8aa487616c338c625c55fdfcc604759ee7b1e235b0b318b36d7a6fb07ab8
    source_path: logging.md
    workflow: 15
---

# Logs

O OpenClaw tem duas superfícies principais de log:

- **Logs em arquivo** (linhas JSON) gravados pelo Gateway.
- **Saída no console** exibida em terminais e na UI de depuração do Gateway.

A aba **Logs** da UI de controle acompanha o log em arquivo do gateway. Esta página explica onde
os logs ficam, como lê-los e como configurar níveis e formatos de log.

## Onde os logs ficam

Por padrão, o Gateway grava um arquivo de log rotativo em:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

A data usa o fuso horário local do host do gateway.

Você pode substituir isso em `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Como ler logs

### CLI: acompanhamento em tempo real (recomendado)

Use a CLI para acompanhar o arquivo de log do gateway via RPC:

```bash
openclaw logs --follow
```

Opções úteis atuais:

- `--local-time`: renderiza timestamps no seu fuso horário local
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flags RPC padrão do Gateway
- `--expect-final`: flag de espera por resposta final de RPC com agente como backend (aceita aqui pela camada de cliente compartilhada)

Modos de saída:

- **Sessões TTY**: linhas de log estruturadas, bonitas e com cores.
- **Sessões não TTY**: texto simples.
- `--json`: JSON delimitado por linha (um evento de log por linha).
- `--plain`: força texto simples em sessões TTY.
- `--no-color`: desabilita cores ANSI.

Quando você passa um `--url` explícito, a CLI não aplica automaticamente credenciais de config ou
ambiente; inclua `--token` por conta própria se o Gateway de destino
exigir autenticação.

No modo JSON, a CLI emite objetos com tag `type`:

- `meta`: metadados do stream (arquivo, cursor, tamanho)
- `log`: entrada de log analisada
- `notice`: dicas de truncamento / rotação
- `raw`: linha de log não analisada

Se o Gateway local em loopback solicitar pareamento, `openclaw logs` usa fallback para
o arquivo de log local configurado automaticamente. Alvos explícitos com `--url` não
usam esse fallback.

Se o Gateway estiver inacessível, a CLI imprime uma dica curta para executar:

```bash
openclaw doctor
```

### UI de controle (web)

A aba **Logs** da UI de controle acompanha o mesmo arquivo usando `logs.tail`.
Consulte [/web/control-ui](/pt-BR/web/control-ui) para saber como abri-la.

### Logs somente de canal

Para filtrar atividade de canal (WhatsApp/Telegram/etc.), use:

```bash
openclaw channels logs --channel whatsapp
```

## Formatos de log

### Logs em arquivo (JSONL)

Cada linha no arquivo de log é um objeto JSON. A CLI e a UI de controle analisam essas
entradas para renderizar saída estruturada (hora, nível, subsistema, mensagem).

### Saída no console

Os logs do console são **sensíveis a TTY** e formatados para legibilidade:

- Prefixos de subsistema (por exemplo `gateway/channels/whatsapp`)
- Coloração por nível (info/warn/error)
- Modo compacto ou JSON opcional

A formatação do console é controlada por `logging.consoleStyle`.

### Logs WebSocket do Gateway

`openclaw gateway` também tem logging de protocolo WebSocket para tráfego RPC:

- modo normal: apenas resultados interessantes (erros, erros de parsing, chamadas lentas)
- `--verbose`: todo o tráfego de request/response
- `--ws-log auto|compact|full`: escolhe o estilo de renderização detalhada
- `--compact`: alias para `--ws-log compact`

Exemplos:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Configurando logs

Toda a configuração de logs fica em `logging` em `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Níveis de log

- `logging.level`: nível dos **logs em arquivo** (JSONL).
- `logging.consoleLevel`: nível de verbosidade do **console**.

Você pode substituir ambos pela variável de ambiente **`OPENCLAW_LOG_LEVEL`** (por exemplo, `OPENCLAW_LOG_LEVEL=debug`). A variável de ambiente tem precedência sobre o arquivo de configuração, então você pode aumentar a verbosidade para uma única execução sem editar `openclaw.json`. Você também pode passar a opção global da CLI **`--log-level <level>`** (por exemplo, `openclaw --log-level debug gateway run`), que substitui a variável de ambiente para esse comando.

`--verbose` afeta apenas a saída do console e a verbosidade do log WS; ele não altera
os níveis de log em arquivo.

### Estilos do console

`logging.consoleStyle`:

- `pretty`: amigável para humanos, colorido, com timestamps.
- `compact`: saída mais enxuta (melhor para sessões longas).
- `json`: JSON por linha (para processadores de log).

### Redação

Resumos de ferramenta podem redigir tokens sensíveis antes que cheguem ao console:

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: lista de strings regex para substituir o conjunto padrão

A redação afeta **apenas a saída do console** e não altera logs em arquivo.

## Diagnósticos + OpenTelemetry

Diagnósticos são eventos estruturados e legíveis por máquina para execuções de modelo **e**
telemetria de fluxo de mensagens (Webhooks, enfileiramento, estado de sessão). Eles **não**
substituem logs; existem para alimentar métricas, traces e outros exportadores.

Eventos de diagnóstico são emitidos em processo, mas exportadores só são anexados quando
diagnostics + o Plugin exportador estão habilitados.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: o modelo de dados + SDKs para traces, métricas e logs.
- **OTLP**: o protocolo wire usado para exportar dados OTel para um coletor/backend.
- O OpenClaw exporta via **OTLP/HTTP (protobuf)** hoje.

### Sinais exportados

- **Métricas**: contadores + histogramas (uso de tokens, fluxo de mensagens, enfileiramento).
- **Traces**: spans para uso de modelo + processamento de Webhook/mensagem.
- **Logs**: exportados por OTLP quando `diagnostics.otel.logs` está habilitado. O
  volume de logs pode ser alto; mantenha `logging.level` e filtros do exportador em mente.

### Catálogo de eventos de diagnóstico

Uso de modelo:

- `model.usage`: tokens, custo, duração, contexto, provider/model/channel, IDs de sessão.

Fluxo de mensagens:

- `webhook.received`: entrada de Webhook por canal.
- `webhook.processed`: Webhook tratado + duração.
- `webhook.error`: erros do manipulador de Webhook.
- `message.queued`: mensagem enfileirada para processamento.
- `message.processed`: resultado + duração + erro opcional.
- `message.delivery.started`: tentativa de entrega de saída iniciada.
- `message.delivery.completed`: tentativa de entrega de saída concluída + duração/contagem de resultados.
- `message.delivery.error`: tentativa de entrega de saída falhou + duração/categoria de erro limitada.

Fila + sessão:

- `queue.lane.enqueue`: enfileiramento da lane da fila de comandos + profundidade.
- `queue.lane.dequeue`: desenfileiramento da lane da fila de comandos + tempo de espera.
- `session.state`: transição de estado de sessão + motivo.
- `session.stuck`: aviso de sessão travada + idade.
- `run.attempt`: metadados de tentativa/repetição da execução.
- `diagnostic.heartbeat`: contadores agregados (Webhooks/fila/sessão).

Exec:

- `exec.process.completed`: resultado terminal do processo exec, duração, alvo, modo,
  código de saída e tipo de falha. Texto do comando e diretórios de trabalho não
  são incluídos.

### Habilitar diagnósticos (sem exportador)

Use isto se quiser eventos de diagnóstico disponíveis para plugins ou sinks personalizados:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Flags de diagnósticos (logs direcionados)

Use flags para ativar logs extras e direcionados de depuração sem elevar `logging.level`.
As flags não diferenciam maiúsculas de minúsculas e oferecem suporte a curingas (por exemplo, `telegram.*` ou `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Substituição por env (one-off):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Observações:

- Logs de flags vão para o arquivo de log padrão (o mesmo de `logging.file`).
- A saída continua sendo redigida de acordo com `logging.redactSensitive`.
- Guia completo: [/diagnostics/flags](/pt-BR/diagnostics/flags).

### Exportar para OpenTelemetry

Diagnósticos podem ser exportados pelo Plugin `diagnostics-otel` (OTLP/HTTP). Isso
funciona com qualquer coletor/backend OpenTelemetry que aceite OTLP/HTTP.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000,
      "captureContent": {
        "enabled": false,
        "inputMessages": false,
        "outputMessages": false,
        "toolInputs": false,
        "toolOutputs": false,
        "systemPrompt": false
      }
    }
  }
}
```

Observações:

- Você também pode habilitar o Plugin com `openclaw plugins enable diagnostics-otel`.
- `protocol` atualmente oferece suporte apenas a `http/protobuf`. `grpc` é ignorado.
- Métricas incluem uso de tokens, custo, tamanho de contexto, duração de execução e
  contadores/histogramas de fluxo de mensagem (Webhooks, enfileiramento, estado de sessão, profundidade/espera da fila).
- Traces/métricas podem ser ativados ou desativados com `traces` / `metrics` (padrão: ligados). Traces
  incluem spans de uso de modelo mais spans de processamento de Webhook/mensagem quando habilitados.
- Conteúdo bruto de modelo/ferramenta não é exportado por padrão. Use
  `diagnostics.otel.captureContent` apenas quando seu coletor e política de retenção
  estiverem aprovados para texto de prompt, resposta, ferramenta ou prompt do sistema.
- Defina `headers` quando seu coletor exigir autenticação.
- Variáveis de ambiente compatíveis: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.
- Defina `OPENCLAW_OTEL_PRELOADED=1` quando outro preload ou processo host já tiver
  registrado o SDK global do OpenTelemetry. Nesse modo, o Plugin não inicia
  nem encerra seu próprio SDK, mas ainda conecta listeners de diagnóstico do OpenClaw e
  respeita `diagnostics.otel.traces`, `metrics` e `logs`.

### Métricas exportadas (nomes + tipos)

Uso de modelo:

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Fluxo de mensagens:

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, attrs: `openclaw.channel`,
  `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attrs:
  `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
  `openclaw.errorCategory`)

Filas + sessões:

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` ou
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

Exec:

- `openclaw.exec.duration_ms` (histogram, attrs: `openclaw.exec.target`,
  `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Spans exportados (nomes + principais atributos)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`,
    `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system`, `gen_ai.request.model`, `gen_ai.operation.name`,
    `openclaw.provider`, `openclaw.model`, `openclaw.api`,
    `openclaw.transport`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`,
    `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`,
    `openclaw.failureKind`, `openclaw.exec.command_length`,
    `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
    `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`

Quando a captura de conteúdo está explicitamente habilitada, spans de modelo/ferramenta também podem incluir
atributos `openclaw.content.*` limitados e redigidos para as classes específicas
de conteúdo nas quais você optou entrar.

### Sampling + flushing

- Sampling de trace: `diagnostics.otel.sampleRate` (0.0–1.0, apenas spans raiz).
- Intervalo de exportação de métricas: `diagnostics.otel.flushIntervalMs` (mínimo de 1000ms).

### Observações sobre protocolo

- Endpoints OTLP/HTTP podem ser definidos por `diagnostics.otel.endpoint` ou
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Se o endpoint já contiver `/v1/traces` ou `/v1/metrics`, ele será usado como está.
- Se o endpoint já contiver `/v1/logs`, ele será usado como está para logs.
- `OPENCLAW_OTEL_PRELOADED=1` reutiliza um SDK OpenTelemetry registrado externamente
  para traces/métricas em vez de iniciar um NodeSDK pertencente ao Plugin.
- `diagnostics.otel.logs` habilita exportação de logs OTLP para a saída principal do logger.

### Comportamento da exportação de logs

- Logs OTLP usam os mesmos registros estruturados gravados em `logging.file`.
- Respeitam `logging.level` (nível de log em arquivo). A redação do console **não** se aplica
  a logs OTLP.
- Instalações com alto volume devem preferir sampling/filtragem no coletor OTLP.

## Dicas de solução de problemas

- **Gateway inacessível?** Execute `openclaw doctor` primeiro.
- **Logs vazios?** Verifique se o Gateway está em execução e gravando no caminho de arquivo
  em `logging.file`.
- **Precisa de mais detalhes?** Defina `logging.level` como `debug` ou `trace` e tente novamente.

## Relacionado

- [Internals de logging do Gateway](/pt-BR/gateway/logging) — estilos de log WS, prefixos de subsistema e captura de console
- [Diagnostics](/pt-BR/gateway/configuration-reference#diagnostics) — exportação OpenTelemetry e configuração de trace de cache
