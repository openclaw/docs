---
read_when:
    - Você precisa de uma visão geral para iniciantes sobre os logs do OpenClaw
    - Você quer configurar níveis, formatos ou mascaramento de logs
    - Você está solucionando problemas e precisa encontrar registros rapidamente
summary: Logs de arquivos, saída do console, acompanhamento da CLI em tempo real e a aba Logs da Control UI
title: Registro em log
x-i18n:
    generated_at: "2026-04-30T09:56:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 916fb03219d571f0302560a4cb6755940575c92fff0b4eab024b9dad53f841ce
    source_path: logging.md
    workflow: 16
---

OpenClaw tem duas principais superfícies de logs:

- **Logs de arquivo** (linhas JSON) gravados pelo Gateway.
- **Saída do console** exibida em terminais e na UI de Depuração do Gateway.

A aba **Logs** da UI de Controle acompanha o log de arquivo do gateway. Esta página explica onde
os logs ficam, como lê-los e como configurar níveis e formatos de log.

## Onde os logs ficam

Por padrão, o Gateway grava um arquivo de log rotativo em:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

A data usa o fuso horário local do host do gateway.

Cada arquivo rotaciona quando atinge `logging.maxFileBytes` (padrão: 100 MB).
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

### CLI: acompanhamento ao vivo (recomendado)

Use a CLI para acompanhar o arquivo de log do gateway via RPC:

```bash
openclaw logs --follow
```

Opções atuais úteis:

- `--local-time`: renderiza timestamps no seu fuso horário local
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flags padrão de RPC do Gateway
- `--expect-final`: flag de espera pela resposta final de RPC baseada em agente (aceita aqui pela camada de cliente compartilhada)

Modos de saída:

- **Sessões TTY**: linhas de log estruturadas, bonitas e colorizadas.
- **Sessões não TTY**: texto simples.
- `--json`: JSON delimitado por linha (um evento de log por linha).
- `--plain`: força texto simples em sessões TTY.
- `--no-color`: desativa cores ANSI.

Quando você passa um `--url` explícito, a CLI não aplica automaticamente credenciais de configuração ou
ambiente; inclua `--token` por conta própria se o Gateway de destino
exigir autenticação.

No modo JSON, a CLI emite objetos marcados por `type`:

- `meta`: metadados do stream (arquivo, cursor, tamanho)
- `log`: entrada de log analisada
- `notice`: dicas de truncamento / rotação
- `raw`: linha de log não analisada

Se o Gateway de local loopback implícito pedir pareamento, fechar durante a conexão
ou atingir tempo limite antes de `logs.tail` responder, `openclaw logs` recua automaticamente para o
log de arquivo do Gateway configurado. Destinos `--url` explícitos não usam
esse fallback.

Se o Gateway estiver inacessível, a CLI imprime uma dica curta para executar:

```bash
openclaw doctor
```

### UI de Controle (web)

A aba **Logs** da UI de Controle acompanha o mesmo arquivo usando `logs.tail`.
Veja [/web/control-ui](/pt-BR/web/control-ui) para saber como abri-la.

### Logs somente de canal

Para filtrar atividade de canal (WhatsApp/Telegram/etc), use:

```bash
openclaw channels logs --channel whatsapp
```

## Formatos de log

### Logs de arquivo (JSONL)

Cada linha no arquivo de log é um objeto JSON. A CLI e a UI de Controle analisam essas
entradas para renderizar saída estruturada (hora, nível, subsistema, mensagem).

Registros JSONL de log de arquivo também incluem campos de nível superior filtráveis por máquina quando
disponíveis:

- `hostname`: nome do host do gateway.
- `message`: texto da mensagem de log achatado para busca em texto completo.
- `agent_id`: id do agente ativo quando a chamada de log carrega contexto de agente.
- `session_id`: id/chave da sessão ativa quando a chamada de log carrega contexto de sessão.
- `channel`: canal ativo quando a chamada de log carrega contexto de canal.

O OpenClaw preserva os argumentos estruturados originais do log junto com esses campos
para que analisadores existentes que leem chaves numeradas de argumentos tslog continuem funcionando.

### Saída do console

Logs de console são **cientes de TTY** e formatados para legibilidade:

- Prefixos de subsistema (por exemplo, `gateway/channels/whatsapp`)
- Cores por nível (info/warn/error)
- Modo compacto ou JSON opcional

A formatação do console é controlada por `logging.consoleStyle`.

### Logs de WebSocket do Gateway

`openclaw gateway` também tem logging de protocolo WebSocket para tráfego RPC:

- modo normal: somente resultados interessantes (erros, erros de análise, chamadas lentas)
- `--verbose`: todo o tráfego de requisição/resposta
- `--ws-log auto|compact|full`: escolhe o estilo de renderização verbosa
- `--compact`: alias para `--ws-log compact`

Exemplos:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Configuração de logging

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

- `logging.level`: nível dos **logs de arquivo** (JSONL).
- `logging.consoleLevel`: nível de verbosidade do **console**.

Você pode sobrescrever ambos pela variável de ambiente **`OPENCLAW_LOG_LEVEL`** (por exemplo, `OPENCLAW_LOG_LEVEL=debug`). A variável de ambiente tem precedência sobre o arquivo de configuração, então você pode aumentar a verbosidade para uma única execução sem editar `openclaw.json`. Você também pode passar a opção global da CLI **`--log-level <level>`** (por exemplo, `openclaw --log-level debug gateway run`), que sobrescreve a variável de ambiente para esse comando.

`--verbose` afeta apenas a saída do console e a verbosidade de logs WS; ele não altera
níveis de log de arquivo.

### Correlação de traces

Logs de arquivo são JSONL. Quando uma chamada de log carrega um contexto válido de trace diagnóstico,
o OpenClaw grava os campos de trace como chaves JSON de nível superior (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) para que processadores externos de log possam correlacionar a linha
com spans OTEL e propagação de `traceparent` do provedor.

Requisições HTTP do Gateway e frames WebSocket do Gateway estabelecem um escopo interno de trace de requisição. Logs e eventos diagnósticos emitidos dentro desse escopo assíncrono herdam
o trace da requisição quando não passam um contexto de trace explícito. Traces de execução de agente e
chamadas de modelo se tornam filhos do trace de requisição ativo, então logs locais,
snapshots diagnósticos, spans OTEL e cabeçalhos `traceparent` de provedores confiáveis podem
ser unidos por `traceId` sem registrar conteúdo bruto de requisição ou de modelo.

### Tamanho e timing de chamada de modelo

Diagnósticos de chamada de modelo registram medições limitadas de requisição/resposta sem
capturar conteúdo bruto de prompt ou resposta:

- `requestPayloadBytes`: tamanho em bytes UTF-8 do payload final da requisição ao modelo
- `responseStreamBytes`: tamanho em bytes UTF-8 dos eventos transmitidos da resposta do modelo
- `timeToFirstByteMs`: tempo decorrido antes do primeiro evento transmitido de resposta
- `durationMs`: duração total da chamada de modelo

Esses campos ficam disponíveis para snapshots diagnósticos, hooks de plugin de chamada de modelo e
spans/métricas OTEL de chamada de modelo quando a exportação de diagnósticos está habilitada.

### Estilos de console

`logging.consoleStyle`:

- `pretty`: amigável para humanos, colorido, com timestamps.
- `compact`: saída mais enxuta (melhor para sessões longas).
- `json`: JSON por linha (para processadores de log).

### Redação

O OpenClaw pode redigir tokens sensíveis antes que cheguem à saída do console, logs de arquivo,
registros de log OTLP, texto persistido de transcrição de sessão ou payloads de eventos de ferramentas da UI de Controle
(argumentos de início de ferramenta, payloads de resultado parcial/final, saída derivada de
exec e resumos de patch):

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: lista de strings regex para sobrescrever o conjunto padrão. Padrões personalizados se aplicam além dos padrões integrados para payloads de ferramentas da UI de Controle, portanto adicionar um padrão nunca enfraquece a redação de valores já capturados pelos padrões.

Logs de arquivo e transcrições de sessão permanecem JSONL, mas valores secretos correspondentes são
mascarados antes que a linha ou mensagem seja gravada em disco. A redação é de melhor esforço:
ela se aplica a conteúdo de mensagens com texto e strings de log, não a todo
identificador ou campo de payload binário.

`logging.redactSensitive: "off"` desativa apenas esta política geral de logs/transcrições.
O OpenClaw ainda redige payloads de fronteira de segurança que podem ser exibidos a clientes de UI,
pacotes de suporte, observadores de diagnósticos, prompts de aprovação ou ferramentas de agente.
Exemplos incluem eventos de chamada de ferramenta da UI de Controle, saída de `sessions_history`,
exportações de suporte de diagnósticos, observações de erro de provedor, exibição de comando de aprovação de exec
e logs de protocolo WebSocket do Gateway. `logging.redactPatterns` personalizados
ainda podem adicionar padrões específicos do projeto nessas superfícies.

## Diagnósticos e OpenTelemetry

Diagnósticos são eventos estruturados, legíveis por máquina, para execuções de modelo e
telemetria de fluxo de mensagens (webhooks, enfileiramento, estado de sessão). Eles **não**
substituem logs — eles alimentam métricas, traces e exportadores. Eventos são emitidos
no processo, exporte-os ou não.

Duas superfícies adjacentes:

- **Exportação OpenTelemetry** — envie métricas, traces e logs via OTLP/HTTP para
  qualquer coletor ou backend compatível com OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, etc.). Configuração completa, catálogo de sinais,
  nomes de métricas/spans, variáveis de ambiente e modelo de privacidade ficam em uma página dedicada:
  [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry).
- **Flags de diagnósticos** — flags direcionadas de log de depuração que encaminham logs extras para
  `logging.file` sem aumentar `logging.level`. Flags não diferenciam maiúsculas de minúsculas
  e aceitam curingas (`telegram.*`, `*`). Configure em `diagnostics.flags`
  ou pela substituição de ambiente `OPENCLAW_DIAGNOSTICS=...`. Guia completo:
  [Flags de diagnósticos](/pt-BR/diagnostics/flags).

Para habilitar eventos de diagnósticos para plugins ou coletores personalizados sem exportação OTLP:

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
- [Flags de diagnósticos](/pt-BR/diagnostics/flags) — flags direcionadas de log de depuração
- [Internos de logging do Gateway](/pt-BR/gateway/logging) — estilos de log WS, prefixos de subsistema e captura do console
- [Referência de configuração](/pt-BR/gateway/configuration-reference#diagnostics) — referência completa de campos `diagnostics.*`
