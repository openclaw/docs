---
read_when:
    - Você precisa de uma visão geral dos logs do OpenClaw para iniciantes
    - Você quer configurar níveis de log, formatos ou mascaramento
    - Você está solucionando problemas e precisa encontrar registros rapidamente
summary: Registros de arquivo, saída do console, acompanhamento em tempo real pela CLI e a aba Registros da Interface de Controle
title: Registro em logs
x-i18n:
    generated_at: "2026-05-01T05:57:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41ce5b1ae30fe1ca65577abe387fc266bd281686acb10098f82b8e78dfaa357
    source_path: logging.md
    workflow: 16
---

OpenClaw tem duas superfícies principais de logs:

- **Logs em arquivo** (linhas JSON) gravados pelo Gateway.
- **Saída do console** exibida em terminais e na IU de Depuração do Gateway.

A aba **Logs** da IU de Controle acompanha o arquivo de log do gateway. Esta página explica onde
os logs ficam, como lê-los e como configurar níveis e formatos de log.

## Onde os logs ficam

Por padrão, o Gateway grava um arquivo de log rotativo em:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

A data usa o fuso horário local do host do gateway.

Cada arquivo é rotacionado quando atinge `logging.maxFileBytes` (padrão: 100 MB).
O OpenClaw mantém até cinco arquivos numerados ao lado do arquivo ativo, como
`openclaw-YYYY-MM-DD.1.log`, e continua gravando em um novo log ativo em vez de
suprimir diagnósticos.

Você pode sobrescrever isso em `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Como ler logs

### CLI: tail em tempo real (recomendado)

Use a CLI para acompanhar o arquivo de log do gateway via RPC:

```bash
openclaw logs --follow
```

Opções atuais úteis:

- `--local-time`: renderiza carimbos de data/hora no seu fuso horário local
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flags RPC padrão do Gateway
- `--expect-final`: flag de espera por resposta final RPC apoiada por agente (aceita aqui via camada de cliente compartilhada)

Modos de saída:

- **Sessões TTY**: linhas de log estruturadas, coloridas e bem formatadas.
- **Sessões não TTY**: texto simples.
- `--json`: JSON delimitado por linhas (um evento de log por linha).
- `--plain`: força texto simples em sessões TTY.
- `--no-color`: desativa cores ANSI.

Quando você passa um `--url` explícito, a CLI não aplica automaticamente credenciais
de configuração ou ambiente; inclua `--token` você mesmo se o Gateway de destino
exigir autenticação.

No modo JSON, a CLI emite objetos marcados por `type`:

- `meta`: metadados do fluxo (arquivo, cursor, tamanho)
- `log`: entrada de log analisada
- `notice`: dicas de truncamento / rotação
- `raw`: linha de log não analisada

Se o Gateway de local loopback implícito solicitar pareamento, fechar durante a conexão
ou exceder o tempo limite antes de `logs.tail` responder, `openclaw logs` volta automaticamente
para o arquivo de log do Gateway configurado. Destinos `--url` explícitos não usam
esse fallback.

Se o Gateway estiver inacessível, a CLI imprime uma dica curta para executar:

```bash
openclaw doctor
```

### IU de Controle (web)

A aba **Logs** da IU de Controle acompanha o mesmo arquivo usando `logs.tail`.
Veja [/web/control-ui](/pt-BR/web/control-ui) para saber como abri-la.

### Logs apenas de canais

Para filtrar atividade de canais (WhatsApp/Telegram/etc), use:

```bash
openclaw channels logs --channel whatsapp
```

## Formatos de log

### Logs em arquivo (JSONL)

Cada linha no arquivo de log é um objeto JSON. A CLI e a IU de Controle analisam essas
entradas para renderizar saída estruturada (hora, nível, subsistema, mensagem).

Registros JSONL de log em arquivo também incluem campos de nível superior filtráveis por máquina quando
disponíveis:

- `hostname`: nome do host do gateway.
- `message`: texto da mensagem de log achatado para busca em texto completo.
- `agent_id`: id do agente ativo quando a chamada de log carrega contexto de agente.
- `session_id`: id/chave da sessão ativa quando a chamada de log carrega contexto de sessão.
- `channel`: canal ativo quando a chamada de log carrega contexto de canal.

O OpenClaw preserva os argumentos de log estruturados originais junto desses campos
para que analisadores existentes que leem chaves de argumentos numeradas do tslog continuem funcionando.

### Saída do console

Logs do console são **cientes de TTY** e formatados para legibilidade:

- Prefixos de subsistema (por exemplo, `gateway/channels/whatsapp`)
- Coloração por nível (info/warn/error)
- Modo compacto ou JSON opcional

A formatação do console é controlada por `logging.consoleStyle`.

### Logs WebSocket do Gateway

`openclaw gateway` também tem logging de protocolo WebSocket para tráfego RPC:

- modo normal: apenas resultados interessantes (erros, erros de análise, chamadas lentas)
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

- `logging.level`: nível de **logs em arquivo** (JSONL).
- `logging.consoleLevel`: nível de verbosidade do **console**.

Você pode sobrescrever ambos por meio da variável de ambiente **`OPENCLAW_LOG_LEVEL`** (por exemplo, `OPENCLAW_LOG_LEVEL=debug`). A variável de ambiente tem precedência sobre o arquivo de configuração, então você pode aumentar a verbosidade para uma única execução sem editar `openclaw.json`. Você também pode passar a opção global da CLI **`--log-level <level>`** (por exemplo, `openclaw --log-level debug gateway run`), que sobrescreve a variável de ambiente para esse comando.

`--verbose` afeta apenas a saída do console e a verbosidade do log WS; ele não altera
os níveis de log em arquivo.

### Correlação de rastreamento

Logs em arquivo são JSONL. Quando uma chamada de log carrega um contexto de rastreamento diagnóstico válido,
o OpenClaw grava os campos de rastreamento como chaves JSON de nível superior (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) para que processadores externos de log possam correlacionar a linha
com spans OTEL e propagação de `traceparent` do provedor.

Requisições HTTP do Gateway e quadros WebSocket do Gateway estabelecem um escopo interno de rastreamento
de requisição. Logs e eventos diagnósticos emitidos dentro desse escopo assíncrono herdam
o rastreamento da requisição quando não passam um contexto de rastreamento explícito. Rastreamentos de execução de agente e
chamadas de modelo se tornam filhos do rastreamento de requisição ativo, para que logs locais,
snapshots diagnósticos, spans OTEL e cabeçalhos `traceparent` de provedores confiáveis possam
ser unidos por `traceId` sem registrar conteúdo bruto de requisição ou modelo.

### Tamanho e tempo de chamada de modelo

Diagnósticos de chamadas de modelo registram medições limitadas de requisição/resposta sem
capturar conteúdo bruto de prompt ou resposta:

- `requestPayloadBytes`: tamanho em bytes UTF-8 do payload final da requisição de modelo
- `responseStreamBytes`: tamanho em bytes UTF-8 dos eventos de resposta de modelo em streaming
- `timeToFirstByteMs`: tempo decorrido antes do primeiro evento de resposta em streaming
- `durationMs`: duração total da chamada de modelo

Esses campos ficam disponíveis para snapshots diagnósticos, hooks de plugins de chamada de modelo e
spans/métricas OTEL de chamada de modelo quando a exportação de diagnósticos está habilitada.

### Estilos de console

`logging.consoleStyle`:

- `pretty`: amigável para humanos, colorido, com carimbos de data/hora.
- `compact`: saída mais enxuta (melhor para sessões longas).
- `json`: JSON por linha (para processadores de log).

### Redação

O OpenClaw pode redigir tokens sensíveis antes que cheguem à saída do console, logs em arquivo,
registros de log OTLP, texto persistido de transcrição de sessão ou payloads de eventos de ferramenta
da IU de Controle (argumentos de início de ferramenta, payloads de resultado parcial/final, saída
exec derivada e resumos de patch):

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: lista de strings regex para sobrescrever o conjunto padrão. Padrões personalizados são aplicados sobre os padrões integrados para payloads de ferramenta da IU de Controle, então adicionar um padrão nunca enfraquece a redação de valores já capturados pelos padrões.

Logs em arquivo e transcrições de sessão continuam sendo JSONL, mas valores secretos correspondentes são
mascarados antes que a linha ou mensagem seja gravada no disco. A redação é de melhor esforço:
ela se aplica a conteúdo de mensagem com texto e strings de log, não a todo
identificador ou campo de payload binário.

Os padrões integrados cobrem credenciais comuns de API e nomes de campos de credenciais de pagamento
como número do cartão, CVC/CVV, token de pagamento compartilhado e credencial de pagamento
quando aparecem como campos JSON, parâmetros de URL, flags de CLI ou atribuições.

`logging.redactSensitive: "off"` desativa apenas essa política geral de log/transcrição.
O OpenClaw ainda redige payloads de fronteira de segurança que podem ser exibidos para clientes de IU,
pacotes de suporte, observadores de diagnósticos, prompts de aprovação ou ferramentas de agente.
Exemplos incluem eventos de chamada de ferramenta da IU de Controle, saída de `sessions_history`,
exportações de suporte de diagnósticos, observações de erro de provedor, exibição de comando de aprovação
exec e logs de protocolo WebSocket do Gateway. `logging.redactPatterns` personalizados
ainda podem adicionar padrões específicos do projeto nessas superfícies.

## Diagnósticos e OpenTelemetry

Diagnósticos são eventos estruturados e legíveis por máquina para execuções de modelo e
telemetria de fluxo de mensagens (webhooks, enfileiramento, estado de sessão). Eles **não**
substituem logs — eles alimentam métricas, rastreamentos e exportadores. Eventos são emitidos
em processo, quer você os exporte ou não.

Duas superfícies adjacentes:

- **Exportação do OpenTelemetry** — envia métricas, rastreamentos e logs por OTLP/HTTP para
  qualquer coletor ou backend compatível com OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, etc.). Configuração completa, catálogo de sinais,
  nomes de métricas/spans, variáveis de ambiente e modelo de privacidade ficam em uma página dedicada:
  [Exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry).
- **Flags de diagnóstico** — flags direcionadas de log de depuração que encaminham logs extras para
  `logging.file` sem aumentar `logging.level`. Flags não diferenciam maiúsculas de minúsculas
  e aceitam curingas (`telegram.*`, `*`). Configure em `diagnostics.flags`
  ou pela sobrescrita de ambiente `OPENCLAW_DIAGNOSTICS=...`. Guia completo:
  [Flags de diagnóstico](/pt-BR/diagnostics/flags).

Para habilitar eventos diagnósticos para plugins ou destinos personalizados sem exportação OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Para exportação OTLP para um coletor, veja [Exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry).

## Dicas de solução de problemas

- **Gateway inacessível?** Execute `openclaw doctor` primeiro.
- **Logs vazios?** Verifique se o Gateway está em execução e gravando no caminho do arquivo
  em `logging.file`.
- **Precisa de mais detalhes?** Defina `logging.level` como `debug` ou `trace` e tente novamente.

## Relacionados

- [Exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry) — exportação OTLP/HTTP, catálogo de métricas/spans, modelo de privacidade
- [Flags de diagnóstico](/pt-BR/diagnostics/flags) — flags direcionadas de log de depuração
- [Internos de logging do Gateway](/pt-BR/gateway/logging) — estilos de log WS, prefixos de subsistema e captura de console
- [Referência de configuração](/pt-BR/gateway/configuration-reference#diagnostics) — referência completa dos campos `diagnostics.*`
