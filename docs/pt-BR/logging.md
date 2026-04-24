---
read_when:
    - Você precisa de uma visão geral amigável para iniciantes sobre logging
    - Você quer configurar níveis ou formatos de log
    - Você está solucionando problemas e precisa encontrar logs rapidamente
summary: 'Visão geral de logging: logs em arquivo, saída no console, acompanhamento pela CLI e a UI de Controle'
title: Visão geral de logging
x-i18n:
    generated_at: "2026-04-24T05:59:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b6f274600bcb9f5597c91aa6c30512871105a3e0de446773394abbe27276058
    source_path: logging.md
    workflow: 15
---

# Logging

O OpenClaw tem duas superfícies principais de logging:

- **Logs em arquivo** (linhas JSON) gravados pelo Gateway.
- **Saída no console** mostrada em terminais e na UI de Depuração do Gateway.

A aba **Logs** da UI de Controle acompanha o log em arquivo do gateway. Esta página explica onde
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

## Como ler os logs

### CLI: acompanhamento ao vivo (recomendado)

Use a CLI para acompanhar o arquivo de log do gateway via RPC:

```bash
openclaw logs --follow
```

Opções atuais úteis:

- `--local-time`: renderiza timestamps no seu fuso horário local
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flags padrão de RPC do Gateway
- `--expect-final`: flag de espera por resposta final de RPC com suporte de agente (aceita aqui pela camada compartilhada do cliente)

Modos de saída:

- **Sessões TTY**: linhas de log bonitas, coloridas e estruturadas.
- **Sessões não TTY**: texto simples.
- `--json`: JSON delimitado por linha (um evento de log por linha).
- `--plain`: força texto simples em sessões TTY.
- `--no-color`: desabilita cores ANSI.

Quando você passa um `--url` explícito, a CLI não aplica automaticamente
credenciais de configuração ou ambiente; inclua `--token` você mesmo se o Gateway de destino
exigir autenticação.

No modo JSON, a CLI emite objetos com tag `type`:

- `meta`: metadados do stream (arquivo, cursor, tamanho)
- `log`: entrada de log parseada
- `notice`: dicas de truncamento / rotação
- `raw`: linha de log não parseada

Se o Gateway local em loopback pedir pairing, `openclaw logs` usa fallback para
o arquivo de log local configurado automaticamente. Destinos explícitos com `--url` não
usam esse fallback.

Se o Gateway estiver inacessível, a CLI imprime uma dica curta para executar:

```bash
openclaw doctor
```

### UI de Controle (web)

A aba **Logs** da UI de Controle acompanha o mesmo arquivo usando `logs.tail`.
Consulte [/web/control-ui](/pt-BR/web/control-ui) para saber como abri-la.

### Logs apenas de canal

Para filtrar atividade de canal (WhatsApp/Telegram/etc), use:

```bash
openclaw channels logs --channel whatsapp
```

## Formatos de log

### Logs em arquivo (JSONL)

Cada linha no arquivo de log é um objeto JSON. A CLI e a UI de Controle fazem parse dessas
entradas para renderizar saída estruturada (hora, nível, subsistema, mensagem).

### Saída no console

Os logs do console têm **reconhecimento de TTY** e são formatados para legibilidade:

- Prefixos de subsistema (por exemplo `gateway/channels/whatsapp`)
- Coloração por nível (info/warn/error)
- Modo compacto ou JSON opcional

A formatação do console é controlada por `logging.consoleStyle`.

### Logs WebSocket do Gateway

`openclaw gateway` também tem logging de protocolo WebSocket para tráfego RPC:

- modo normal: apenas resultados interessantes (erros, erros de parsing, chamadas lentas)
- `--verbose`: todo o tráfego de requisição/resposta
- `--ws-log auto|compact|full`: escolhe o estilo de renderização detalhada
- `--compact`: alias para `--ws-log compact`

Exemplos:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Configurando logging

Toda a configuração de logging fica em `logging` em `~/.openclaw/openclaw.json`.

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

Você pode substituir ambos via variável de ambiente **`OPENCLAW_LOG_LEVEL`** (por exemplo `OPENCLAW_LOG_LEVEL=debug`). A variável de ambiente tem precedência sobre o arquivo de configuração, então você pode aumentar a verbosidade para uma única execução sem editar `openclaw.json`. Você também pode passar a opção global da CLI **`--log-level <level>`** (por exemplo, `openclaw --log-level debug gateway run`), que substitui a variável de ambiente para esse comando.

`--verbose` afeta apenas a saída no console e a verbosidade do log WS; ele não muda
os níveis de log em arquivo.

### Estilos de console

`logging.consoleStyle`:

- `pretty`: amigável para humanos, colorido e com timestamps.
- `compact`: saída mais enxuta (melhor para sessões longas).
- `json`: JSON por linha (para processadores de log).

### Redação

Resumos de ferramentas podem redigir tokens sensíveis antes de chegarem ao console:

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: lista de strings regex para substituir o conjunto padrão

A redação afeta **apenas a saída no console** e não altera os logs em arquivo.

## Diagnostics + OpenTelemetry

Diagnostics são eventos estruturados e legíveis por máquina para execuções de modelo **e**
telemetria de fluxo de mensagens (Webhooks, enfileiramento, estado de sessão). Eles **não**
substituem logs; existem para alimentar métricas, traces e outros exporters.

Eventos de Diagnostics são emitidos in-process, mas exporters só são anexados quando
diagnostics + o Plugin do exporter estão habilitados.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: o modelo de dados + SDKs para traces, métricas e logs.
- **OTLP**: o protocolo de rede usado para exportar dados OTel para um coletor/backend.
- Hoje, o OpenClaw exporta via **OTLP/HTTP (protobuf)**.

### Sinais exportados

- **Métricas**: contadores + histogramas (uso de tokens, fluxo de mensagens, enfileiramento).
- **Traces**: spans para uso de modelo + processamento de Webhook/mensagem.
- **Logs**: exportados por OTLP quando `diagnostics.otel.logs` está habilitado. O
  volume de logs pode ser alto; tenha em mente `logging.level` e filtros do exporter.

### Catálogo de eventos de diagnóstico

Uso de modelo:

- `model.usage`: tokens, custo, duração, contexto, provedor/modelo/canal, IDs de sessão.

Fluxo de mensagens:

- `webhook.received`: entrada de Webhook por canal.
- `webhook.processed`: Webhook tratado + duração.
- `webhook.error`: erros do handler de Webhook.
- `message.queued`: mensagem enfileirada para processamento.
- `message.processed`: resultado + duração + erro opcional.

Fila + sessão:

- `queue.lane.enqueue`: enqueue de lane da fila de comandos + profundidade.
- `queue.lane.dequeue`: dequeue de lane da fila de comandos + tempo de espera.
- `session.state`: transição de estado da sessão + motivo.
- `session.stuck`: aviso de sessão travada + idade.
- `run.attempt`: metadados de tentativa/retry de execução.
- `diagnostic.heartbeat`: contadores agregados (Webhooks/fila/sessão).

### Habilitar diagnostics (sem exporter)

Use isto se você quiser eventos de diagnostics disponíveis para Plugins ou sinks personalizados:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Flags de diagnostics (logs direcionados)

Use flags para ativar logs extras e direcionados de depuração sem aumentar `logging.level`.
As flags não diferenciam maiúsculas de minúsculas e oferecem suporte a curingas (por exemplo `telegram.*` ou `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Substituição via env (one-off):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Observações:

- Logs de flags vão para o arquivo de log padrão (o mesmo que `logging.file`).
- A saída ainda é redigida de acordo com `logging.redactSensitive`.
- Guia completo: [/diagnostics/flags](/pt-BR/diagnostics/flags).

### Exportar para OpenTelemetry

Diagnostics podem ser exportados via o Plugin `diagnostics-otel` (OTLP/HTTP). Isso
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
      "flushIntervalMs": 60000
    }
  }
}
```

Observações:

- Você também pode habilitar o Plugin com `openclaw plugins enable diagnostics-otel`.
- `protocol` atualmente oferece suporte apenas a `http/protobuf`. `grpc` é ignorado.
- Métricas incluem uso de tokens, custo, tamanho de contexto, duração de execução e contadores/histogramas de fluxo de mensagens (Webhooks, enfileiramento, estado de sessão, profundidade/espera de fila).
- Traces/métricas podem ser alternados com `traces` / `metrics` (padrão: ativado). Traces
  incluem spans de uso de modelo e também spans de processamento de Webhook/mensagem quando habilitados.
- Defina `headers` quando o seu coletor exigir autenticação.
- Variáveis de ambiente compatíveis: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### Métricas exportadas (nomes + tipos)

Uso de modelo:

- `openclaw.tokens` (contador, attrs: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (contador, attrs: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histograma, attrs: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histograma, attrs: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Fluxo de mensagens:

- `openclaw.webhook.received` (contador, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (contador, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histograma, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (contador, attrs: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (contador, attrs: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histograma, attrs: `openclaw.channel`,
  `openclaw.outcome`)

Filas + sessões:

- `openclaw.queue.lane.enqueue` (contador, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (contador, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histograma, attrs: `openclaw.lane` ou
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histograma, attrs: `openclaw.lane`)
- `openclaw.session.state` (contador, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (contador, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histograma, attrs: `openclaw.state`)
- `openclaw.run.attempt` (contador, attrs: `openclaw.attempt`)

### Spans exportados (nomes + principais atributos)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.sessionKey`, `openclaw.sessionId`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.sessionKey`, `openclaw.sessionId`,
    `openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`,
    `openclaw.sessionKey`, `openclaw.sessionId`

### Amostragem + flush

- Amostragem de trace: `diagnostics.otel.sampleRate` (0.0–1.0, apenas spans raiz).
- Intervalo de exportação de métricas: `diagnostics.otel.flushIntervalMs` (mínimo 1000ms).

### Observações sobre protocolo

- Endpoints OTLP/HTTP podem ser definidos por `diagnostics.otel.endpoint` ou
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Se o endpoint já contiver `/v1/traces` ou `/v1/metrics`, ele será usado como está.
- Se o endpoint já contiver `/v1/logs`, ele será usado como está para logs.
- `diagnostics.otel.logs` habilita exportação de logs OTLP para a saída do logger principal.

### Comportamento da exportação de logs

- Logs OTLP usam os mesmos registros estruturados gravados em `logging.file`.
- Respeitam `logging.level` (nível de log em arquivo). A redação do console **não** se aplica
  aos logs OTLP.
- Instalações de alto volume devem preferir amostragem/filtragem no coletor OTLP.

## Dicas de solução de problemas

- **Gateway inacessível?** Execute `openclaw doctor` primeiro.
- **Logs vazios?** Verifique se o Gateway está em execução e gravando no caminho
  em `logging.file`.
- **Precisa de mais detalhes?** Defina `logging.level` como `debug` ou `trace` e tente novamente.

## Relacionado

- [Internos de logging do Gateway](/pt-BR/gateway/logging) — estilos de log WS, prefixos de subsistema e captura de console
- [Diagnostics](/pt-BR/gateway/configuration-reference#diagnostics) — exportação OpenTelemetry e configuração de trace de cache
