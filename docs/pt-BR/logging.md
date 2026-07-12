---
read_when:
    - Você precisa de uma visão geral dos logs do OpenClaw adequada para iniciantes
    - Você quer configurar níveis, formatos ou ocultação de dados confidenciais nos logs
    - Você está solucionando problemas e precisa encontrar os logs rapidamente
summary: Logs em arquivo, saída do console, acompanhamento pela CLI e a aba Logs da interface de controle
title: Registro em log
x-i18n:
    generated_at: "2026-07-12T15:22:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: add41e125c22ca1b2343a3a1fb1e88e94ef9c81a07c48b9eb67f4d4b2510dd08
    source_path: logging.md
    workflow: 16
---

O OpenClaw tem duas superfícies principais de logs:

- **Logs em arquivo** (linhas JSON) gravados pelo Gateway.
- **Saída do console** no terminal que executa o Gateway.

A aba **Logs** da interface de controle acompanha continuamente o arquivo de log do Gateway. Esta página explica onde
os logs ficam, como lê-los e como configurar seus níveis e formatos.

## Onde os logs ficam

Por padrão, o Gateway grava um arquivo de log rotativo por dia:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

A data usa o fuso horário local do host do Gateway. Quando `/tmp/openclaw` não é seguro
ou está indisponível (e sempre no Windows), o OpenClaw usa, em vez disso, um diretório
`openclaw-<uid>` com escopo de usuário no diretório temporário do sistema operacional. Os arquivos de log datados são
removidos após 24 horas.

Cada arquivo é rotacionado quando a próxima gravação excederia `logging.maxFileBytes`
(padrão: 100 MB). O OpenClaw mantém até cinco arquivos numerados ao lado do
arquivo ativo, como `openclaw-YYYY-MM-DD.1.log`, e continua gravando em um novo
log ativo, em vez de suprimir diagnósticos.

Você pode substituir o caminho em `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Como ler os logs

### CLI: acompanhamento em tempo real (recomendado)

Acompanhe o arquivo de log do Gateway via RPC:

```bash
openclaw logs --follow
```

Opções:

| Sinalizador         | Padrão   | Comportamento                                                                         |
| ------------------- | -------- | ------------------------------------------------------------------------------------- |
| `--follow`          | desativado | Continua acompanhando; reconecta com espera progressiva após desconexão               |
| `--limit <n>`       | `200`    | Máximo de linhas por busca                                                            |
| `--max-bytes <n>`   | `250000` | Máximo de bytes lidos por busca                                                       |
| `--interval <ms>`   | `1000`   | Intervalo de consulta durante o acompanhamento                                        |
| `--json`            | desativado | JSON delimitado por linhas (um evento por linha)                                    |
| `--plain`           | desativado | Força texto simples em sessões TTY                                                  |
| `--no-color`        | —        | Desativa cores ANSI                                                                  |
| `--utc`             | desativado | Exibe carimbos de data/hora em UTC (o horário local é o padrão)                     |
| `--local-time`      | desativado | Grafia de compatibilidade aceita para o padrão de horário local; não tem outro efeito |
| `--url` / `--token` | —        | Sinalizadores RPC padrão do Gateway                                                   |
| `--timeout <ms>`    | `30000`  | Tempo limite do RPC do Gateway                                                        |
| `--expect-final`    | desativado | Sinalizador de espera pela resposta final do RPC baseado em agente (aceito aqui pela camada de cliente compartilhada) |

Modos de saída:

- **Sessões TTY**: linhas de log estruturadas, formatadas e coloridas.
- **Sessões não TTY**: texto simples.

Quando você fornece explicitamente `--url`, a CLI não aplica automaticamente as credenciais
da configuração ou do ambiente; inclua `--token` por conta própria, ou a chamada falhará com
`gateway url override requires explicit credentials`.

No modo JSON, a CLI emite objetos identificados por `type`:

- `meta`: metadados do fluxo (arquivo, origem, tipo de origem, serviço, cursor, tamanho)
- `log`: entrada de log analisada
- `notice`: avisos de truncamento/rotação
- `raw`: linha de log não analisada
- `error`: falhas de conexão com o Gateway (gravadas em stderr)

Se o Gateway de loopback local implícito solicitar pareamento, fechar durante a conexão
ou atingir o tempo limite antes de `logs.tail` responder, `openclaw logs` usará automaticamente como alternativa o
arquivo de log configurado do Gateway. Destinos `--url` explícitos não usam
essa alternativa. `openclaw logs --follow` é mais rigoroso: no Linux, ele usa o diário do Gateway
do systemd do usuário ativo por PID quando disponível; caso contrário, tenta novamente o
Gateway ativo com espera progressiva, em vez de acompanhar um arquivo lado a lado
potencialmente desatualizado.

Se o Gateway estiver inacessível, a CLI exibirá uma breve sugestão para executar:

```bash
openclaw doctor
```

### Interface de controle (web)

A aba **Logs** da interface de controle acompanha o mesmo arquivo usando `logs.tail`.
Consulte [Interface de controle](/pt-BR/web/control-ui) para saber como abri-la.

### Logs somente de canais

Para filtrar a atividade dos canais (WhatsApp/Telegram/etc.), use:

```bash
openclaw channels logs --channel whatsapp
```

O padrão de `--channel` é `all`; `--lines <n>` (padrão 200) e `--json` também estão
disponíveis.

## Formatos de log

### Logs em arquivo (JSONL)

Cada linha do arquivo de log é um objeto JSON. A CLI e a interface de controle analisam essas
entradas para exibir uma saída estruturada (horário, nível, subsistema, mensagem).

Os registros JSONL dos logs em arquivo também incluem campos de nível superior filtráveis por máquina quando
disponíveis:

- `hostname`: nome do host do Gateway.
- `message`: texto consolidado da mensagem de log para pesquisa de texto completo.
- `agent_id`: ID do agente ativo quando a chamada de log contém o contexto do agente.
- `session_id`: ID/chave da sessão ativa quando a chamada de log contém o contexto da sessão.
- `channel`: canal ativo quando a chamada de log contém o contexto do canal.

O OpenClaw preserva os argumentos estruturados originais do log juntamente com esses campos
para que os analisadores existentes que leem chaves numeradas de argumentos do tslog continuem funcionando.

As atividades de conversa, voz em tempo real e salas gerenciadas emitem registros delimitados de log
do ciclo de vida por meio desse mesmo pipeline de logs em arquivo. Esses registros incluem tipo de evento,
modo, transporte, provedor e medições de tamanho/tempo quando disponíveis, mas omitem
texto da transcrição, cargas úteis de áudio, IDs de turnos, IDs de chamadas e IDs de itens do provedor.

### Saída do console

Os logs do console são **compatíveis com TTY** e formatados para facilitar a leitura:

- Prefixos de subsistema (por exemplo, `gateway/channels/whatsapp`)
- Cores por nível (informação/aviso/erro)
- Modo compacto ou JSON opcional

A formatação do console é controlada por `logging.consoleStyle`.

### Logs de WebSocket do Gateway

`openclaw gateway` também tem registros do protocolo WebSocket para o tráfego RPC:

- modo normal: somente resultados relevantes (erros, erros de análise, chamadas lentas)
- `--verbose`: todo o tráfego de solicitação/resposta
- `--ws-log auto|compact|full`: seleciona o estilo de exibição detalhada
- `--compact`: alias de `--ws-log compact`

Exemplos:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Configuração dos logs

Toda a configuração de logs fica em `logging` no arquivo `~/.openclaw/openclaw.json`.

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

Níveis: `silent`, `fatal`, `error`, `warn`, `info`, `debug`, `trace`.

- `logging.level`: nível dos **logs em arquivo** (JSONL) (padrão: `info`).
- `logging.consoleLevel`: nível de detalhamento do **console**.

Você pode substituir ambos pela variável de ambiente **`OPENCLAW_LOG_LEVEL`** (por exemplo, `OPENCLAW_LOG_LEVEL=debug`). A variável de ambiente tem precedência sobre o arquivo de configuração, permitindo aumentar o detalhamento de uma única execução sem editar `openclaw.json`. Você também pode fornecer a opção global da CLI **`--log-level <level>`** (por exemplo, `openclaw --log-level debug gateway run`), que substitui a variável de ambiente para esse comando.

`--verbose` afeta apenas a saída do console e o detalhamento dos logs de WS; ele não altera
os níveis dos logs em arquivo.

### Diagnósticos direcionados do transporte de modelos

Ao depurar chamadas de provedores, use sinalizadores de ambiente direcionados, em vez de aumentar
todos os logs para `debug`:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Sinalizadores disponíveis:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: emite início da solicitação, resposta da busca, cabeçalhos do SDK,
  primeiro evento de streaming, conclusão do fluxo e erros de transporte no
  nível `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: inclui um resumo delimitado da carga útil da solicitação
  nos logs de solicitação do modelo.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: inclui todos os nomes de ferramentas expostos ao modelo no
  resumo da carga útil.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: inclui um instantâneo JSON com redação e tamanho
  limitado da carga útil. Use somente durante a depuração; os segredos são ocultados, mas prompts
  e textos de mensagens ainda podem estar presentes.
- `OPENCLAW_DEBUG_SSE=events`: emite o tempo do primeiro evento e da conclusão do fluxo.
- `OPENCLAW_DEBUG_SSE=peek`: também emite as cargas úteis dos primeiros cinco eventos SSE
  com redação e tamanho limitado por evento.
- `OPENCLAW_DEBUG_CODE_MODE=1`: emite diagnósticos da superfície de modelos no modo de código,
  inclusive quando as ferramentas nativas do provedor ficam ocultas porque o modo de código controla a
  superfície de ferramentas.

Esses sinalizadores registram informações por meio do sistema normal de logs do OpenClaw, portanto `openclaw logs --follow`
e a aba Logs da interface de controle os exibem. Sem os sinalizadores, os mesmos diagnósticos
permanecem disponíveis no nível `debug`.

Os metadados de início e resposta de `[model-fetch]` (provedor, API, modelo, status,
latência e campos da solicitação, como método, URL, tempo limite, proxy e política)
são sempre emitidos no nível `info`, independentemente de
`OPENCLAW_DEBUG_MODEL_TRANSPORT`, para que a higiene básica do transporte de modelos fique visível
sem sinalizadores de depuração.

### Correlação de rastreamento

Os logs em arquivo usam JSONL. Quando uma chamada de log contém um contexto válido de rastreamento de diagnóstico,
o OpenClaw grava os campos de rastreamento como chaves JSON de nível superior (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) para que processadores externos de logs possam correlacionar a linha
com spans OTEL e com a propagação de `traceparent` do provedor.

As solicitações HTTP e os quadros WebSocket do Gateway estabelecem um escopo interno de rastreamento
da solicitação. Logs e eventos de diagnóstico emitidos dentro desse escopo assíncrono herdam
o rastreamento da solicitação quando não fornecem um contexto de rastreamento explícito. Os rastreamentos da execução do agente e
das chamadas de modelo tornam-se filhos do rastreamento da solicitação ativa, permitindo que logs locais,
instantâneos de diagnóstico, spans OTEL e cabeçalhos `traceparent` de provedores confiáveis sejam
associados por `traceId` sem registrar o conteúdo bruto da solicitação ou do modelo.

Os registros de log do ciclo de vida de conversa também seguem para a exportação de logs do diagnostics-otel quando
a exportação de logs do OpenTelemetry está habilitada, usando os mesmos atributos delimitados dos logs em
arquivo. Configure `diagnostics.otel.logsExporter` para escolher OTLP, JSONL no stdout ou
ambos os destinos.

### Tamanho e tempo das chamadas de modelo

Os diagnósticos de chamadas de modelo registram medições delimitadas de solicitação/resposta sem
capturar o conteúdo bruto do prompt ou da resposta:

- `requestPayloadBytes`: tamanho em bytes UTF-8 da carga útil final da solicitação do modelo
- `responseStreamBytes`: tamanho em bytes UTF-8 das cargas úteis dos fragmentos transmitidos da resposta do modelo.
  Eventos de alta frequência de texto, raciocínio e deltas de chamadas de ferramentas contabilizam
  somente os bytes incrementais de `delta`, em vez dos instantâneos completos de `partial`.
- `timeToFirstByteMs`: tempo decorrido antes do primeiro evento de resposta transmitido
- `durationMs`: duração total da chamada de modelo

Esses campos ficam disponíveis para instantâneos de diagnóstico, hooks de Plugin de chamada de modelo e
spans/métricas OTEL de chamadas de modelo quando a exportação de diagnósticos está habilitada.

### Estilos do console

`logging.consoleStyle`:

- `pretty`: fácil de ler, colorido e com carimbos de data/hora.
- `compact`: saída mais condensada (ideal para sessões longas).
- `json`: JSON por linha (para processadores de logs).

### Redação

O OpenClaw pode ocultar tokens confidenciais antes que eles cheguem à saída do console, aos logs em arquivo,
aos registros de log OTLP, ao texto persistido da transcrição da sessão ou às cargas úteis de eventos de ferramentas
da interface de controle (argumentos de início da ferramenta, cargas úteis parciais/finais de resultados, saída
derivada da execução e resumos de patches):

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: lista de strings de expressões regulares que substitui o conjunto padrão para a saída de logs/transcrições. Para cargas úteis de ferramentas da interface de controle, os padrões personalizados são aplicados além dos padrões integrados, portanto adicionar um padrão nunca reduz a redação dos valores já identificados pelos padrões padrão.

Os logs em arquivo e as transcrições de sessão permanecem em JSONL, mas os valores secretos correspondentes são
mascarados antes que a linha ou mensagem seja gravada no disco. A redação é feita com o melhor esforço:
ela se aplica ao conteúdo textual das mensagens e às strings de log, não a todos os
campos de identificadores ou cargas úteis binárias.

Os padrões integrados abrangem credenciais comuns de API e nomes de campos de
credenciais de pagamento, como número do cartão, CVC/CVV, token de pagamento
compartilhado e credencial de pagamento, quando aparecem como campos JSON,
parâmetros de URL, flags da CLI ou atribuições.

`logging.redactSensitive: "off"` desativa apenas esta política geral de
logs/transcrições. O OpenClaw ainda oculta payloads de limites de segurança que
podem ser exibidos a clientes da interface, pacotes de suporte, observadores de
diagnóstico, solicitações de aprovação ou ferramentas do agente. Alguns exemplos
incluem eventos de chamadas de ferramentas da interface de controle, saída de
`sessions_history`, exportações de suporte de diagnóstico, observações de erros
de provedores, exibição de comandos para aprovação de execução e logs do
protocolo WebSocket do Gateway. Os `logging.redactPatterns` personalizados ainda
podem adicionar padrões específicos do projeto nessas superfícies.

## Diagnóstico e OpenTelemetry

Os diagnósticos são eventos estruturados e legíveis por máquina para execuções
de modelos e telemetria do fluxo de mensagens (webhooks, enfileiramento, estado
da sessão). Eles **não** substituem os logs — eles alimentam métricas, rastros e
exportadores. Por padrão, os eventos são emitidos no processo (defina
`diagnostics.enabled: false` para desativá-los); a exportação deles é separada.

Duas superfícies relacionadas:

- **Exportação do OpenTelemetry** — envie métricas, rastros e logs por OTLP/HTTP
  para qualquer coletor ou backend compatível com OpenTelemetry (Datadog,
  Grafana, Honeycomb, New Relic, Tempo etc.). A configuração completa, o catálogo
  de sinais, os nomes de métricas/spans, as variáveis de ambiente e o modelo de
  privacidade estão em uma página dedicada:
  [Exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry).
- **Flags de diagnóstico** — flags direcionadas de logs de depuração que
  encaminham logs adicionais para `logging.file` sem aumentar `logging.level`.
  As flags não diferenciam maiúsculas de minúsculas e aceitam curingas
  (`telegram.*`, `*`). Configure-as em `diagnostics.flags` ou pela substituição
  da variável de ambiente `OPENCLAW_DIAGNOSTICS=...`. Guia completo:
  [Flags de diagnóstico](/pt-BR/diagnostics/flags).

Para exportar via OTLP para um coletor, consulte
[Exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry).

## Dicas de solução de problemas

- **Não consegue acessar o Gateway?** Execute `openclaw doctor` primeiro.
- **Logs vazios?** Verifique se o Gateway está em execução e gravando no caminho
  de arquivo definido em `logging.file`.
- **Precisa de mais detalhes?** Defina `logging.level` como `debug` ou `trace` e
  tente novamente.

## Relacionados

- [Exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry) — exportação por OTLP/HTTP, catálogo de métricas/spans, modelo de privacidade
- [Flags de diagnóstico](/pt-BR/diagnostics/flags) — flags direcionadas de logs de depuração
- [Detalhes internos dos logs do Gateway](/pt-BR/gateway/logging) — estilos de logs de WS, prefixos de subsistemas e captura do console
- [Referência de configuração](/pt-BR/gateway/configuration-reference#diagnostics) — referência completa dos campos `diagnostics.*`
