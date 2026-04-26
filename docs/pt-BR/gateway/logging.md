---
read_when:
    - Alterando saídas ou formatos de log
    - Depurando a saída da CLI ou do gateway
summary: Superfícies de log, logs em arquivo, estilos de log WS e formatação do console
title: Logs do Gateway
x-i18n:
    generated_at: "2026-04-26T11:28:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: c005cfc4cfe456b3734d3928a16c9cd131a2b465d46f2aba9c9c61db22dcc399
    source_path: gateway/logging.md
    workflow: 15
---

# Logs

Para uma visão geral voltada ao usuário (CLI + Control UI + config), veja [/logging](/pt-BR/logging).

O OpenClaw tem duas “superfícies” de log:

- **Saída do console** (o que você vê no terminal / Debug UI).
- **Logs em arquivo** (linhas JSON) gravados pelo logger do gateway.

## Logger baseado em arquivo

- O arquivo de log com rotação padrão fica em `/tmp/openclaw/` (um arquivo por dia): `openclaw-YYYY-MM-DD.log`
  - A data usa o fuso horário local do host do gateway.
- Arquivos de log ativos giram em `logging.maxFileBytes` (padrão: 100 MB), mantendo
  até cinco arquivos numerados e continuando a gravar em um novo arquivo ativo.
- O caminho e o nível do arquivo de log podem ser configurados em `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

O formato do arquivo é um objeto JSON por linha.

A aba Logs da Control UI faz tail desse arquivo via gateway (`logs.tail`).
A CLI pode fazer o mesmo:

```bash
openclaw logs --follow
```

**Verbose vs. níveis de log**

- **Logs em arquivo** são controlados exclusivamente por `logging.level`.
- `--verbose` afeta apenas a **verbosidade do console** (e o estilo de log WS); ele **não**
  aumenta o nível de log do arquivo.
- Para capturar detalhes apenas de verbose em logs de arquivo, defina `logging.level` como `debug` ou
  `trace`.

## Captura do console

A CLI captura `console.log/info/warn/error/debug/trace` e os grava em logs de arquivo,
continuando a imprimi-los em stdout/stderr.

Você pode ajustar a verbosidade do console independentemente por:

- `logging.consoleLevel` (padrão `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redação de resumo de ferramentas

Resumos detalhados de ferramentas (por exemplo `🛠️ Exec: ...`) podem mascarar tokens sensíveis antes de chegarem ao
fluxo do console. Isso é **somente para ferramentas** e não altera os logs em arquivo.

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: array de strings regex (substitui os padrões)
  - Use strings regex brutas (auto `gi`) ou `/pattern/flags` se você precisar de flags personalizadas.
  - Correspondências são mascaradas mantendo os 6 primeiros + 4 últimos caracteres (comprimento >= 18), caso contrário `***`.
  - Os padrões cobrem por padrão atribuições comuns de chaves, flags de CLI, campos JSON, headers bearer, blocos PEM e prefixos populares de tokens.

## Logs WebSocket do Gateway

O gateway imprime logs de protocolo WebSocket em dois modos:

- **Modo normal (sem `--verbose`)**: apenas resultados de RPC “interessantes” são impressos:
  - erros (`ok=false`)
  - chamadas lentas (limiar padrão: `>= 50ms`)
  - erros de parse
- **Modo verbose (`--verbose`)**: imprime todo o tráfego de requisição/resposta WS.

### Estilo de log WS

`openclaw gateway` oferece suporte a uma troca de estilo por gateway:

- `--ws-log auto` (padrão): o modo normal é otimizado; o modo verbose usa saída compacta
- `--ws-log compact`: saída compacta (requisição/resposta em pares) quando em verbose
- `--ws-log full`: saída completa por frame quando em verbose
- `--compact`: alias para `--ws-log compact`

Exemplos:

```bash
# otimizado (apenas erros/lentidão)
openclaw gateway

# mostra todo o tráfego WS (em pares)
openclaw gateway --verbose --ws-log compact

# mostra todo o tráfego WS (metadados completos)
openclaw gateway --verbose --ws-log full
```

## Formatação do console (logs por subsistema)

O formatador do console reconhece **TTY** e imprime linhas consistentes com prefixos.
Loggers de subsistema mantêm a saída agrupada e fácil de examinar.

Comportamento:

- **Prefixos de subsistema** em todas as linhas (por exemplo `[gateway]`, `[canvas]`, `[tailscale]`)
- **Cores de subsistema** (estáveis por subsistema) mais coloração por nível
- **Cor quando a saída é um TTY ou o ambiente parece um terminal avançado** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respeita `NO_COLOR`
- **Prefixos de subsistema encurtados**: remove `gateway/` + `channels/` iniciais, mantém os últimos 2 segmentos (por exemplo `whatsapp/outbound`)
- **Sub-loggers por subsistema** (prefixo automático + campo estruturado `{ subsystem }`)
- **`logRaw()`** para saída de QR/UX (sem prefixo, sem formatação)
- **Estilos de console** (por exemplo `pretty | compact | json`)
- **Nível de log do console** separado do nível de log do arquivo (o arquivo mantém detalhes completos quando `logging.level` está em `debug`/`trace`)
- **Corpos de mensagem do WhatsApp** são registrados em `debug` (use `--verbose` para vê-los)

Isso mantém os logs em arquivo existentes estáveis, ao mesmo tempo em que torna a saída interativa mais fácil de examinar.

## Relacionados

- [Logs](/pt-BR/logging)
- [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
