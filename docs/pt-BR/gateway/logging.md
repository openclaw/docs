---
read_when:
    - Alterando a saída ou os formatos de log
    - Depuração da saída da CLI ou do Gateway
summary: Superfícies de registro, logs em arquivo, estilos de log WS e formatação do console
title: Registro em log do Gateway
x-i18n:
    generated_at: "2026-05-06T09:04:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 078b4196ef1c5af5f7f0a4253f704d90d474a3ff668ec555559cab56cbcb15c6
    source_path: gateway/logging.md
    workflow: 16
---

# Logs

Para uma visão geral voltada ao usuário (CLI + Interface de Controle + configuração), consulte [/logging](/pt-BR/logging).

O OpenClaw tem duas "superfícies" de log:

- **Saída do console** (o que você vê no terminal / Interface de Depuração).
- **Logs em arquivo** (linhas JSON) gravados pelo logger do Gateway.

Na inicialização, o Gateway registra o modelo de agente padrão resolvido junto com os
padrões de modo que afetam novas sessões, por exemplo:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` vem do agente padrão, dos parâmetros do modelo ou do padrão global do agente;
quando não está definido, o resumo de inicialização mostra `medium`. `fast` vem do
agente padrão ou dos parâmetros `fastMode` do modelo.

## Logger baseado em arquivo

- O arquivo de log rotativo padrão fica em `/tmp/openclaw/` (um arquivo por dia): `openclaw-YYYY-MM-DD.log`
  - A data usa o fuso horário local do host do Gateway.
- Arquivos de log ativos giram em `logging.maxFileBytes` (padrão: 100 MB), mantendo
  até cinco arquivos numerados e continuando a gravar em um novo arquivo ativo.
- O caminho e o nível do arquivo de log podem ser configurados via `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

O formato do arquivo é um objeto JSON por linha.

A aba Logs da Interface de Controle acompanha este arquivo via Gateway (`logs.tail`).
A CLI pode fazer o mesmo:

```bash
openclaw logs --follow
```

**Verboso vs. níveis de log**

- **Logs em arquivo** são controlados exclusivamente por `logging.level`.
- `--verbose` afeta apenas a **verbosidade do console** (e o estilo de log WS); ele **não**
  aumenta o nível de log do arquivo.
- Para capturar detalhes somente verbosos em logs em arquivo, defina `logging.level` como `debug` ou
  `trace`.
- O registro em trace também inclui resumos de tempo de diagnóstico para caminhos críticos selecionados,
  como a preparação de factories de ferramentas de Plugin. Consulte
  [/tools/plugin#slow-plugin-tool-setup](/pt-BR/tools/plugin#slow-plugin-tool-setup).

## Captura do console

A CLI captura `console.log/info/warn/error/debug/trace` e os grava nos logs em arquivo,
enquanto ainda imprime em stdout/stderr.

Você pode ajustar a verbosidade do console independentemente via:

- `logging.consoleLevel` (padrão `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redação

O OpenClaw pode mascarar tokens sensíveis antes que a saída de log ou transcrição saia do
processo. Esta política de redação de logs é aplicada a destinos de texto de console,
log em arquivo, registro de log OTLP e transcrição de sessão, então valores secretos
correspondentes são mascarados antes que linhas JSONL ou mensagens sejam gravadas em disco.

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: matriz de strings regex (substitui os padrões)
  - Use strings regex brutas (auto `gi`), ou `/pattern/flags` se precisar de flags personalizadas.
  - Correspondências são mascaradas mantendo os primeiros 6 + últimos 4 caracteres (comprimento >= 18), caso contrário `***`.
  - Os padrões cobrem atribuições comuns de chaves, flags de CLI, campos JSON, cabeçalhos bearer, blocos PEM, prefixos populares de tokens e nomes de campos de credenciais de pagamento, como número do cartão, CVC/CVV, token de pagamento compartilhado e credencial de pagamento.

Alguns limites de segurança sempre fazem redação independentemente de `logging.redactSensitive`.
Isso inclui eventos de chamadas de ferramenta da Interface de Controle, saída da ferramenta
`sessions_history`, exportações de suporte de diagnóstico, observações de erro de provedores,
exibição de comandos de aprovação de exec e logs do protocolo WebSocket do Gateway. Essas superfícies ainda podem usar
`logging.redactPatterns` como padrões adicionais, mas `redactSensitive: "off"`
não faz com que emitam segredos brutos.

## Logs WebSocket do Gateway

O Gateway imprime logs do protocolo WebSocket em dois modos:

- **Modo normal (sem `--verbose`)**: apenas resultados RPC "interessantes" são impressos:
  - erros (`ok=false`)
  - chamadas lentas (limite padrão: `>= 50ms`)
  - erros de análise
- **Modo verboso (`--verbose`)**: imprime todo o tráfego de requisição/resposta WS.

### Estilo de log WS

`openclaw gateway` oferece suporte a uma alternância de estilo por Gateway:

- `--ws-log auto` (padrão): o modo normal é otimizado; o modo verboso usa saída compacta
- `--ws-log compact`: saída compacta (requisição/resposta pareadas) quando verboso
- `--ws-log full`: saída completa por frame quando verboso
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

## Formatação do console (logging de subsistema)

O formatador do console é **compatível com TTY** e imprime linhas consistentes com prefixo.
Loggers de subsistema mantêm a saída agrupada e fácil de examinar.

Comportamento:

- **Prefixos de subsistema** em cada linha (por exemplo, `[gateway]`, `[canvas]`, `[tailscale]`)
- **Cores de subsistema** (estáveis por subsistema) além de coloração por nível
- **Cor quando a saída é um TTY ou o ambiente parece um terminal rico** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respeita `NO_COLOR`
- **Prefixos de subsistema encurtados**: remove `gateway/` + `channels/` iniciais, mantém os últimos 2 segmentos (por exemplo, `whatsapp/outbound`)
- **Sub-loggers por subsistema** (prefixo automático + campo estruturado `{ subsystem }`)
- **`logRaw()`** para saída QR/UX (sem prefixo, sem formatação)
- **Estilos de console** (por exemplo, `pretty | compact | json`)
- **Nível de log do console** separado do nível de log do arquivo (o arquivo mantém detalhes completos quando `logging.level` está definido como `debug`/`trace`)
- **Corpos de mensagens do WhatsApp** são registrados em `debug` (use `--verbose` para vê-los)

Isso mantém os logs em arquivo existentes estáveis enquanto torna a saída interativa fácil de examinar.

## Relacionado

- [Logs](/pt-BR/logging)
- [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry)
- [Exportação de diagnóstico](/pt-BR/gateway/diagnostics)
