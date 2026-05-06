---
read_when:
    - Você precisa de uma visão geral para iniciantes sobre os logs do OpenClaw
    - Você quer configurar níveis de log, formatos ou mascaramento
    - Você está solucionando problemas e precisa encontrar registros rapidamente
summary: Logs em arquivo, saída do console, acompanhamento pela CLI e aba Logs da Control UI
title: Registro em log
x-i18n:
    generated_at: "2026-05-06T17:58:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 218f68c5111b6de01dc14707dad132d15d5e78c8e906af8a5416e618807663ac
    source_path: logging.md
    workflow: 16
---

OpenClaw tem duas principais superfícies de log:

- **Logs em arquivo** (linhas JSON) gravados pelo Gateway.
- **Saída do console** exibida em terminais e na UI de depuração do Gateway.

A aba **Logs** da Control UI acompanha o log de arquivo do gateway. Esta página explica onde
os logs ficam, como lê-los e como configurar níveis e formatos de log.

## Onde os logs ficam

Por padrão, o Gateway grava um arquivo de log rotativo em:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

A data usa o fuso horário local do host do gateway.

Cada arquivo gira quando atinge `logging.maxFileBytes` (padrão: 100 MB).
O OpenClaw mantém até cinco arquivos numerados ao lado do arquivo ativo, como
`openclaw-YYYY-MM-DD.1.log`, e continua gravando em um novo log ativo em vez de
suprimir diagnósticos.

Você pode substituir isso em `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Como ler logs

### CLI: acompanhamento ao vivo (recomendado)

Use a CLI para acompanhar o arquivo de log do gateway via RPC:

```bash
openclaw logs --follow
```

Opções atuais úteis:

- `--local-time`: renderiza timestamps no seu fuso horário local
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flags padrão de RPC do Gateway
- `--expect-final`: flag de espera pela resposta final de RPC com suporte de agente (aceita aqui via a camada de cliente compartilhada)

Modos de saída:

- **Sessões TTY**: linhas de log bonitas, coloridas e estruturadas.
- **Sessões não TTY**: texto simples.
- `--json`: JSON delimitado por linhas (um evento de log por linha).
- `--plain`: força texto simples em sessões TTY.
- `--no-color`: desabilita cores ANSI.

Quando você passa um `--url` explícito, a CLI não aplica automaticamente credenciais
de configuração ou de ambiente; inclua `--token` por conta própria se o Gateway de destino
exigir autenticação.

No modo JSON, a CLI emite objetos marcados por `type`:

- `meta`: metadados do stream (arquivo, cursor, tamanho)
- `log`: entrada de log analisada
- `notice`: dicas de truncamento / rotação
- `raw`: linha de log não analisada

Se o Gateway local loopback implícito pedir pareamento, fechar durante a conexão
ou atingir timeout antes de `logs.tail` responder, `openclaw logs` volta automaticamente para o
log de arquivo configurado do Gateway. Destinos `--url` explícitos não usam
esse fallback.

Se o Gateway estiver inacessível, a CLI imprime uma dica curta para executar:

```bash
openclaw doctor
```

### Control UI (web)

A aba **Logs** da Control UI acompanha o mesmo arquivo usando `logs.tail`.
Veja [Control UI](/pt-BR/web/control-ui) para saber como abri-la.

### Logs somente de canal

Para filtrar atividade de canais (WhatsApp/Telegram/etc), use:

```bash
openclaw channels logs --channel whatsapp
```

## Formatos de log

### Logs em arquivo (JSONL)

Cada linha no arquivo de log é um objeto JSON. A CLI e a Control UI analisam essas
entradas para renderizar saída estruturada (hora, nível, subsistema, mensagem).

Registros JSONL de log em arquivo também incluem campos de nível superior filtráveis por máquina quando
disponíveis:

- `hostname`: nome do host do gateway.
- `message`: texto de mensagem de log achatado para busca de texto completo.
- `agent_id`: id do agente ativo quando a chamada de log carrega contexto de agente.
- `session_id`: id/chave da sessão ativa quando a chamada de log carrega contexto de sessão.
- `channel`: canal ativo quando a chamada de log carrega contexto de canal.

O OpenClaw preserva os argumentos originais de log estruturado junto com esses campos
para que analisadores existentes que leem chaves numeradas de argumento tslog continuem funcionando.

Atividades de conversa, voz em tempo real e sala gerenciada emitem registros delimitados de log de ciclo de vida
por esse mesmo pipeline de log em arquivo. Esses registros incluem tipo de evento,
modo, transporte, provedor e medições de tamanho/tempo quando disponíveis, mas omitem
texto de transcrição, payloads de áudio, ids de turno, ids de chamada e ids de item do provedor.

### Saída do console

Logs de console são **cientes de TTY** e formatados para legibilidade:

- Prefixos de subsistema (por exemplo, `gateway/channels/whatsapp`)
- Coloração de nível (info/warn/error)
- Modo compacto ou JSON opcional

A formatação do console é controlada por `logging.consoleStyle`.

### Logs WebSocket do Gateway

`openclaw gateway` também tem logs de protocolo WebSocket para tráfego RPC:

- modo normal: apenas resultados interessantes (erros, erros de análise, chamadas lentas)
- `--verbose`: todo o tráfego de requisição/resposta
- `--ws-log auto|compact|full`: escolha o estilo de renderização verbosa
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

- `logging.level`: nível de **logs em arquivo** (JSONL).
- `logging.consoleLevel`: nível de verbosidade do **console**.

Você pode substituir ambos pela variável de ambiente **`OPENCLAW_LOG_LEVEL`** (por exemplo, `OPENCLAW_LOG_LEVEL=debug`). A variável de ambiente tem precedência sobre o arquivo de configuração, então você pode aumentar a verbosidade para uma única execução sem editar `openclaw.json`. Você também pode passar a opção global da CLI **`--log-level <level>`** (por exemplo, `openclaw --log-level debug gateway run`), que substitui a variável de ambiente para esse comando.

`--verbose` afeta apenas a saída do console e a verbosidade dos logs WS; ele não altera
os níveis de log em arquivo.

### Correlação de rastreamento

Logs em arquivo são JSONL. Quando uma chamada de log carrega um contexto válido de rastreamento de diagnóstico,
o OpenClaw grava os campos de rastreamento como chaves JSON de nível superior (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) para que processadores externos de log possam correlacionar a linha
com spans OTEL e propagação `traceparent` do provedor.

Requisições HTTP do Gateway e frames WebSocket do Gateway estabelecem um escopo interno de rastreamento
de requisição. Logs e eventos de diagnóstico emitidos dentro desse escopo assíncrono herdam
o rastreamento da requisição quando não passam um contexto de rastreamento explícito. Rastreamentos de execução de agente e
de chamada de modelo se tornam filhos do rastreamento de requisição ativo, então logs locais,
snapshots de diagnóstico, spans OTEL e cabeçalhos `traceparent` confiáveis do provedor podem
ser unidos por `traceId` sem registrar conteúdo bruto de requisição ou de modelo.

Registros de log de ciclo de vida de conversa também fluem para logs OTLP quando a exportação de logs OpenTelemetry
está habilitada, usando os mesmos atributos delimitados dos logs em arquivo.

### Tamanho e tempo de chamada de modelo

Diagnósticos de chamada de modelo registram medições delimitadas de requisição/resposta sem
capturar conteúdo bruto de prompt ou resposta:

- `requestPayloadBytes`: tamanho em bytes UTF-8 do payload final da requisição ao modelo
- `responseStreamBytes`: tamanho em bytes UTF-8 dos eventos transmitidos de resposta do modelo
- `timeToFirstByteMs`: tempo decorrido antes do primeiro evento transmitido de resposta
- `durationMs`: duração total da chamada de modelo

Esses campos estão disponíveis para snapshots de diagnóstico, hooks de Plugin de chamada de modelo e
spans/métricas OTEL de chamada de modelo quando a exportação de diagnósticos está habilitada.

### Estilos do console

`logging.consoleStyle`:

- `pretty`: amigável para humanos, colorido, com timestamps.
- `compact`: saída mais compacta (melhor para sessões longas).
- `json`: JSON por linha (para processadores de log).

### Redação

O OpenClaw pode redigir tokens sensíveis antes que eles cheguem à saída do console, logs em arquivo,
registros de log OTLP, texto persistido de transcrição de sessão ou payloads de eventos de ferramenta
da Control UI (argumentos de início de ferramenta, payloads de resultado parcial/final, saída derivada de
exec e resumos de patch):

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: lista de strings regex para substituir o conjunto padrão. Padrões personalizados são aplicados sobre os padrões internos para payloads de ferramenta da Control UI, então adicionar um padrão nunca enfraquece a redação de valores já capturados pelos padrões.

Logs em arquivo e transcrições de sessão continuam sendo JSONL, mas valores secretos correspondentes são
mascarados antes que a linha ou mensagem seja gravada em disco. A redação é por melhor esforço:
ela se aplica a conteúdo de mensagem que contém texto e strings de log, não a todo
identificador ou campo de payload binário.

Os padrões internos cobrem credenciais comuns de API e nomes de campos de credenciais de pagamento,
como número do cartão, CVC/CVV, token de pagamento compartilhado e credencial de pagamento
quando aparecem como campos JSON, parâmetros de URL, flags da CLI ou atribuições.

`logging.redactSensitive: "off"` desabilita apenas esta política geral de logs/transcrições.
O OpenClaw ainda redige payloads de limite de segurança que podem ser mostrados a clientes de UI,
pacotes de suporte, observadores de diagnóstico, prompts de aprovação ou ferramentas de agente.
Exemplos incluem eventos de chamada de ferramenta da Control UI, saída de `sessions_history`,
exportações de suporte de diagnóstico, observações de erro de provedor, exibição de comando de aprovação de exec
e logs de protocolo WebSocket do Gateway. `logging.redactPatterns` personalizados
ainda podem adicionar padrões específicos do projeto nessas superfícies.

## Diagnósticos e OpenTelemetry

Diagnósticos são eventos estruturados e legíveis por máquina para execuções de modelo e
telemetria de fluxo de mensagens (Webhooks, enfileiramento, estado de sessão). Eles **não**
substituem logs — eles alimentam métricas, rastreamentos e exportadores. Eventos são emitidos
no processo, independentemente de você exportá-los ou não.

Duas superfícies adjacentes:

- **Exportação OpenTelemetry** — envie métricas, rastreamentos e logs por OTLP/HTTP para
  qualquer coletor ou backend compatível com OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, etc.). Configuração completa, catálogo de sinais,
  nomes de métricas/spans, variáveis de ambiente e modelo de privacidade ficam em uma página dedicada:
  [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry).
- **Flags de diagnóstico** — flags direcionadas de log de depuração que roteiam logs extras para
  `logging.file` sem elevar `logging.level`. Flags não diferenciam maiúsculas de minúsculas
  e aceitam curingas (`telegram.*`, `*`). Configure em `diagnostics.flags`
  ou via a substituição de ambiente `OPENCLAW_DIAGNOSTICS=...`. Guia completo:
  [Flags de diagnóstico](/pt-BR/diagnostics/flags).

Para habilitar eventos de diagnóstico para Plugins ou coletores personalizados sem exportação OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Para exportação OTLP para um coletor, veja [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry).

## Dicas de solução de problemas

- **Gateway inacessível?** Execute `openclaw doctor` primeiro.
- **Logs vazios?** Verifique se o Gateway está em execução e gravando no caminho de arquivo
  em `logging.file`.
- **Precisa de mais detalhes?** Defina `logging.level` como `debug` ou `trace` e tente novamente.

## Relacionados

- [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry) — exportação OTLP/HTTP, catálogo de métricas/spans, modelo de privacidade
- [Flags de diagnóstico](/pt-BR/diagnostics/flags) — flags direcionadas de log de depuração
- [Internos de logs do Gateway](/pt-BR/gateway/logging) — estilos de log WS, prefixos de subsistema e captura de console
- [Referência de configuração](/pt-BR/gateway/configuration-reference#diagnostics) — referência completa dos campos `diagnostics.*`
