---
read_when:
    - Você precisa de uma visão geral amigável para iniciantes sobre o registro de logs do OpenClaw
    - Você quer configurar níveis de log, formatos ou redação
    - Você está solucionando problemas e precisa encontrar logs rapidamente
summary: Logs de arquivos, saída do console, acompanhamento via CLI e a aba Registros da Control UI
title: Registro
x-i18n:
    generated_at: "2026-06-27T17:40:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caf2780dfeeaf29f4ee94429894a03422b211a4414e63062642d1134f38b6b3f
    source_path: logging.md
    workflow: 16
---

OpenClaw tem duas superfícies principais de log:

- **Logs em arquivo** (linhas JSON) gravados pelo Gateway.
- **Saída do console** exibida em terminais e na Interface de Depuração do Gateway.

A aba **Registros** da Interface de Controle acompanha o arquivo de log do Gateway em tempo real. Esta página explica onde
os logs ficam, como lê-los e como configurar níveis e formatos de log.

## Onde os logs ficam

Por padrão, o Gateway grava um arquivo de log rotativo em:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

A data usa o fuso horário local do host do gateway.

Cada arquivo faz rotação quando atinge `logging.maxFileBytes` (padrão: 100 MB).
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
- `--expect-final`: flag de espera pela resposta final de RPC apoiada por agente (aceita aqui via camada de cliente compartilhada)

Modos de saída:

- **Sessões TTY**: linhas de log estruturadas, bonitas e coloridas.
- **Sessões não TTY**: texto simples.
- `--json`: JSON delimitado por linha (um evento de log por linha).
- `--plain`: força texto simples em sessões TTY.
- `--no-color`: desativa cores ANSI.

Quando você passa um `--url` explícito, a CLI não aplica automaticamente credenciais
de configuração ou ambiente; inclua `--token` manualmente se o Gateway de destino
exigir autenticação.

No modo JSON, a CLI emite objetos marcados por `type`:

- `meta`: metadados do fluxo (arquivo, cursor, tamanho)
- `log`: entrada de log analisada
- `notice`: dicas de truncamento / rotação
- `raw`: linha de log não analisada

Se o Gateway local loopback implícito solicitar pareamento, fechar durante a conexão
ou atingir timeout antes que `logs.tail` responda, `openclaw logs` recorre automaticamente ao
arquivo de log do Gateway configurado. Destinos `--url` explícitos não usam
esse fallback. `openclaw logs --follow` é mais rigoroso: no Linux, ele usa o journal
Gateway ativo do user-systemd por PID quando disponível; caso contrário, continua tentando
o Gateway ao vivo em vez de seguir um arquivo lado a lado potencialmente obsoleto.

Se o Gateway estiver inacessível, a CLI imprime uma dica curta para executar:

```bash
openclaw doctor
```

### Interface de Controle (web)

A aba **Registros** da Interface de Controle acompanha o mesmo arquivo usando `logs.tail`.
Consulte [Interface de Controle](/pt-BR/web/control-ui) para saber como abri-la.

### Logs apenas de canais

Para filtrar atividade de canais (WhatsApp/Telegram/etc), use:

```bash
openclaw channels logs --channel whatsapp
```

## Formatos de log

### Logs em arquivo (JSONL)

Cada linha no arquivo de log é um objeto JSON. A CLI e a Interface de Controle analisam essas
entradas para renderizar saída estruturada (hora, nível, subsistema, mensagem).

Registros JSONL de logs em arquivo também incluem campos de nível superior filtráveis por máquina quando
disponíveis:

- `hostname`: nome do host do gateway.
- `message`: texto da mensagem de log achatado para busca de texto completo.
- `agent_id`: id do agente ativo quando a chamada de log carrega contexto de agente.
- `session_id`: id/chave da sessão ativa quando a chamada de log carrega contexto de sessão.
- `channel`: canal ativo quando a chamada de log carrega contexto de canal.

O OpenClaw preserva os argumentos estruturados originais do log junto a esses campos
para que analisadores existentes que leem chaves numeradas de argumentos tslog continuem funcionando.

Atividade de conversa, voz em tempo real e salas gerenciadas emite registros de log de ciclo de vida
limitados por esse mesmo pipeline de logs em arquivo. Esses registros incluem tipo de evento,
modo, transporte, provedor e medições de tamanho/tempo quando disponíveis, mas omitem
texto de transcrição, payloads de áudio, ids de turnos, ids de chamadas e ids de itens do provedor.

### Saída do console

Logs de console são **cientes de TTY** e formatados para legibilidade:

- Prefixos de subsistema (por exemplo, `gateway/channels/whatsapp`)
- Cores por nível (info/warn/error)
- Modo compacto ou JSON opcional

A formatação do console é controlada por `logging.consoleStyle`.

### Logs WebSocket do Gateway

`openclaw gateway` também tem logging do protocolo WebSocket para tráfego RPC:

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

- `logging.level`: nível dos **logs em arquivo** (JSONL).
- `logging.consoleLevel`: nível de verbosidade do **console**.

Você pode substituir ambos pela variável de ambiente **`OPENCLAW_LOG_LEVEL`** (por exemplo, `OPENCLAW_LOG_LEVEL=debug`). A variável de ambiente tem precedência sobre o arquivo de configuração, então você pode aumentar a verbosidade para uma única execução sem editar `openclaw.json`. Você também pode passar a opção global da CLI **`--log-level <level>`** (por exemplo, `openclaw --log-level debug gateway run`), que substitui a variável de ambiente para esse comando.

`--verbose` afeta apenas a saída do console e a verbosidade de logs WS; ele não altera
os níveis de logs em arquivo.

### Diagnósticos direcionados de transporte de modelo

Ao depurar chamadas de provedor, use flags de ambiente direcionadas em vez de elevar
todos os logs para `debug`:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Flags disponíveis:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: emite início de requisição, resposta de fetch, cabeçalhos do SDK,
  primeiro evento de streaming, conclusão do stream e erros de transporte no
  nível `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: inclui um resumo limitado do payload da requisição
  nos logs de requisição de modelo.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: inclui todos os nomes de ferramentas voltadas ao modelo
  no resumo do payload.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: inclui um snapshot JSON redigido e limitado
  do payload. Use apenas durante depuração; segredos são redigidos, mas prompts
  e texto de mensagens ainda podem estar presentes.
- `OPENCLAW_DEBUG_SSE=events`: emite temporização do primeiro evento e da conclusão do stream.
- `OPENCLAW_DEBUG_SSE=peek`: também emite os cinco primeiros payloads de evento SSE redigidos,
  limitados por evento.
- `OPENCLAW_DEBUG_CODE_MODE=1`: emite diagnósticos de superfície de modelo do modo de código,
  incluindo quando ferramentas nativas do provedor ficam ocultas porque o modo de código possui a
  superfície de ferramentas.

Essas flags registram por meio do logging normal do OpenClaw, então `openclaw logs --follow`
e a aba Registros da Interface de Controle as exibem. Sem as flags, os mesmos diagnósticos
permanecem disponíveis no nível `debug`.

Metadados de início e resposta `[model-fetch]` (provedor, API, modelo, status,
latência e campos de requisição como método, URL, timeout, proxy e política)
são sempre emitidos no nível `info` independentemente de
`OPENCLAW_DEBUG_MODEL_TRANSPORT`, então a higiene básica de transporte de modelo fica visível
sem flags de depuração.

### Correlação de rastreamento

Logs em arquivo são JSONL. Quando uma chamada de log carrega um contexto de rastreamento diagnóstico válido,
o OpenClaw grava os campos de rastreamento como chaves JSON de nível superior (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) para que processadores externos de log possam correlacionar a linha
com spans OTEL e propagação `traceparent` do provedor.

Requisições HTTP do Gateway e frames WebSocket do Gateway estabelecem um escopo interno de rastreamento
de requisição. Logs e eventos de diagnóstico emitidos dentro desse escopo assíncrono herdam
o rastreamento da requisição quando não passam um contexto de rastreamento explícito. Rastreamentos de execução de agente e
chamada de modelo se tornam filhos do rastreamento de requisição ativo, então logs locais,
snapshots de diagnóstico, spans OTEL e cabeçalhos `traceparent` confiáveis do provedor podem
ser unidos por `traceId` sem registrar conteúdo bruto de requisição ou de modelo.

Registros de log de ciclo de vida de conversa também fluem para a exportação de logs diagnostics-otel quando
a exportação de logs OpenTelemetry está habilitada, usando os mesmos atributos limitados dos logs em arquivo.
Configure `diagnostics.otel.logsExporter` para escolher OTLP, JSONL stdout ou
ambos os destinos.

### Tamanho e temporização de chamadas de modelo

Diagnósticos de chamada de modelo registram medições limitadas de requisição/resposta sem
capturar conteúdo bruto de prompt ou resposta:

- `requestPayloadBytes`: tamanho em bytes UTF-8 do payload final da requisição de modelo
- `responseStreamBytes`: tamanho em bytes UTF-8 dos payloads de chunks de resposta de modelo em streaming.
  Eventos de alta frequência de texto, raciocínio e delta de chamada de ferramenta contam
  apenas os bytes incrementais de `delta` em vez de snapshots `partial` completos.
- `timeToFirstByteMs`: tempo decorrido antes do primeiro evento de resposta em streaming
- `durationMs`: duração total da chamada de modelo

Esses campos ficam disponíveis para snapshots de diagnóstico, hooks de Plugin de chamada de modelo e
spans/métricas OTEL de chamada de modelo quando a exportação de diagnósticos está habilitada.

### Estilos de console

`logging.consoleStyle`:

- `pretty`: amigável para humanos, colorido, com timestamps.
- `compact`: saída mais compacta (melhor para sessões longas).
- `json`: JSON por linha (para processadores de log).

### Redação

O OpenClaw pode redigir tokens sensíveis antes que cheguem à saída do console, logs em arquivo,
registros de log OTLP, texto persistido de transcrição de sessão ou payloads de eventos de ferramenta
da Interface de Controle (argumentos de início de ferramenta, payloads de resultado parcial/final, saída
exec derivada e resumos de patch):

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: lista de strings regex para substituir o conjunto padrão. Padrões personalizados se aplicam além dos padrões integrados para payloads de ferramenta da Interface de Controle, então adicionar um padrão nunca enfraquece a redação de valores já capturados pelos padrões.

Logs em arquivo e transcrições de sessão permanecem JSONL, mas valores secretos correspondentes são
mascarados antes que a linha ou mensagem seja gravada em disco. A redação é de melhor esforço:
ela se aplica a conteúdo de mensagem com texto e strings de log, não a todo
identificador ou campo de payload binário.

Os padrões integrados cobrem credenciais comuns de API e nomes de campos de credenciais de pagamento
como número do cartão, CVC/CVV, token de pagamento compartilhado e credencial de pagamento
quando aparecem como campos JSON, parâmetros de URL, flags de CLI ou atribuições.

`logging.redactSensitive: "off"` desativa apenas esta política geral de
logs/transcrições. O OpenClaw ainda redige payloads de fronteira de segurança que podem ser mostrados a clientes
de UI, pacotes de suporte, observadores de diagnóstico, prompts de aprovação ou ferramentas de agente.
Exemplos incluem eventos de chamada de ferramenta da Interface de Controle, saída de `sessions_history`,
exportações de suporte de diagnóstico, observações de erro de provedor, exibição de comando de aprovação exec
e logs de protocolo WebSocket do Gateway. `logging.redactPatterns` personalizados
ainda podem adicionar padrões específicos do projeto nessas superfícies.

## Diagnósticos e OpenTelemetry

Diagnósticos são eventos estruturados e legíveis por máquina para execuções de modelo e
telemetria de fluxo de mensagens (webhooks, enfileiramento, estado de sessão). Eles **não**
substituem logs — eles alimentam métricas, rastreamentos e exportadores. Eventos são emitidos
no processo, independentemente de você exportá-los ou não.

Duas superfícies adjacentes:

- **Exportação OpenTelemetry** — envia métricas, rastreamentos e logs por OTLP/HTTP para
  qualquer coletor ou backend compatível com OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, etc.). Configuração completa, catálogo de sinais,
  nomes de métricas/spans, variáveis de ambiente e modelo de privacidade ficam em uma página dedicada:
  [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry).
- **Flags de diagnóstico** — flags direcionadas de log de depuração que roteiam logs extras para
  `logging.file` sem elevar `logging.level`. As flags não diferenciam maiúsculas de minúsculas
  e aceitam curingas (`telegram.*`, `*`). Configure em `diagnostics.flags`
  ou pela substituição de ambiente `OPENCLAW_DIAGNOSTICS=...`. Guia completo:
  [Flags de diagnóstico](/pt-BR/diagnostics/flags).

Para habilitar eventos de diagnóstico para Plugins ou destinos personalizados sem exportação OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Para exportação OTLP para um coletor, consulte [exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry).

## Dicas de solução de problemas

- **Gateway inacessível?** Execute `openclaw doctor` primeiro.
- **Logs vazios?** Verifique se o Gateway está em execução e gravando no caminho de arquivo
  em `logging.file`.
- **Precisa de mais detalhes?** Defina `logging.level` como `debug` ou `trace` e tente novamente.

## Relacionados

- [Exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry) — exportação OTLP/HTTP, catálogo de métricas/spans, modelo de privacidade
- [Flags de diagnóstico](/pt-BR/diagnostics/flags) — flags direcionadas de logs de depuração
- [Internos de logging do Gateway](/pt-BR/gateway/logging) — estilos de log WS, prefixos de subsistema e captura do console
- [Referência de configuração](/pt-BR/gateway/configuration-reference#diagnostics) — referência completa dos campos `diagnostics.*`
