---
read_when:
    - Alterando saída ou formatos de logging
    - Depurando saída da CLI ou do gateway
summary: Superfícies de logging, logs em arquivo, estilos de log de WS e formatação de console
title: Logging do Gateway
x-i18n:
    generated_at: "2026-04-24T05:52:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17ecbb9b781734727fc7aa8e3b0a59bc7ea22b455affd02fbc2db924c144b9f3
    source_path: gateway/logging.md
    workflow: 15
---

# Logging

Para uma visão geral voltada ao usuário (CLI + UI de controle + configuração), consulte [/logging](/pt-BR/logging).

O OpenClaw tem duas “superfícies” de log:

- **Saída de console** (o que você vê no terminal / UI de depuração).
- **Logs em arquivo** (linhas JSON) gravados pelo logger do gateway.

## Logger baseado em arquivo

- O arquivo de log rotativo padrão fica em `/tmp/openclaw/` (um arquivo por dia): `openclaw-YYYY-MM-DD.log`
  - A data usa o fuso horário local do host do gateway.
- O caminho e o nível do arquivo de log podem ser configurados em `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

O formato do arquivo é um objeto JSON por linha.

A aba Logs da UI de controle acompanha esse arquivo pelo gateway (`logs.tail`).
A CLI pode fazer o mesmo:

```bash
openclaw logs --follow
```

**Detalhado vs. níveis de log**

- **Logs em arquivo** são controlados exclusivamente por `logging.level`.
- `--verbose` afeta apenas a **verbosidade do console** (e o estilo de log de WS); **não**
  eleva o nível de log em arquivo.
- Para capturar em logs de arquivo detalhes visíveis apenas no modo detalhado, defina `logging.level` como `debug` ou
  `trace`.

## Captura de console

A CLI captura `console.log/info/warn/error/debug/trace` e os grava nos logs em arquivo,
continuando a imprimi-los em stdout/stderr.

Você pode ajustar a verbosidade do console independentemente via:

- `logging.consoleLevel` (padrão `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redação de resumos de ferramentas

Resumos detalhados de ferramentas (por exemplo `🛠️ Exec: ...`) podem mascarar tokens sensíveis antes que cheguem ao
fluxo do console. Isso é **somente para ferramentas** e não altera os logs em arquivo.

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: array de strings regex (substitui os padrões padrão)
  - Use strings regex brutas (com `gi` automático) ou `/pattern/flags` se precisar de flags personalizadas.
  - Correspondências são mascaradas mantendo os primeiros 6 + últimos 4 caracteres (comprimento >= 18), caso contrário `***`.
  - Os padrões cobrem por padrão atribuições comuns de chave, flags de CLI, campos JSON, cabeçalhos bearer, blocos PEM e prefixos populares de token.

## Logs WebSocket do Gateway

O gateway imprime logs do protocolo WebSocket em dois modos:

- **Modo normal (sem `--verbose`)**: apenas resultados “interessantes” de RPC são impressos:
  - erros (`ok=false`)
  - chamadas lentas (limite padrão: `>= 50ms`)
  - erros de análise
- **Modo detalhado (`--verbose`)**: imprime todo o tráfego de solicitação/resposta de WS.

### Estilo de log de WS

`openclaw gateway` oferece suporte a uma troca de estilo por gateway:

- `--ws-log auto` (padrão): o modo normal é otimizado; o modo detalhado usa saída compacta
- `--ws-log compact`: saída compacta (solicitação/resposta pareadas) quando detalhado
- `--ws-log full`: saída completa por frame quando detalhado
- `--compact`: alias para `--ws-log compact`

Exemplos:

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## Formatação de console (logging de subsistema)

O formatador de console é **sensível a TTY** e imprime linhas consistentes com prefixos.
Loggers de subsistema mantêm a saída agrupada e fácil de examinar.

Comportamento:

- **Prefixos de subsistema** em cada linha (por exemplo `[gateway]`, `[canvas]`, `[tailscale]`)
- **Cores de subsistema** (estáveis por subsistema) mais coloração por nível
- **Cor quando a saída é um TTY ou quando o ambiente parece um terminal avançado** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respeitando `NO_COLOR`
- **Prefixos de subsistema encurtados**: remove `gateway/` + `channels/` do início, mantém os últimos 2 segmentos (por exemplo `whatsapp/outbound`)
- **Sub-loggers por subsistema** (prefixo automático + campo estruturado `{ subsystem }`)
- **`logRaw()`** para saída de QR/UX (sem prefixo, sem formatação)
- **Estilos de console** (por exemplo `pretty | compact | json`)
- **Nível de log do console** separado do nível de log em arquivo (o arquivo mantém todos os detalhes quando `logging.level` é definido como `debug`/`trace`)
- **Corpos de mensagem do WhatsApp** são registrados em `debug` (use `--verbose` para vê-los)

Isso mantém estáveis os logs em arquivo existentes, enquanto torna a saída interativa mais fácil de examinar.

## Relacionado

- [Visão geral de logging](/pt-BR/logging)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
