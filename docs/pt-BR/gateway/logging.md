---
read_when:
    - Alterando a saída ou os formatos de log
    - Depuração da saída da CLI ou do Gateway
summary: Superfícies de registro, registros em arquivo, estilos de registro WS e formatação do console
title: Registro do Gateway
x-i18n:
    generated_at: "2026-05-05T01:46:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: d49ca112d3cc4ec76ecfc8b14d16dae64f74ca1f761fdb2b7bb470f73b66a246
    source_path: gateway/logging.md
    workflow: 16
---

# Logging

Para uma visão geral voltada ao usuário (CLI + interface de controle + configuração), consulte [/logging](/pt-BR/logging).

O OpenClaw tem duas “superfícies” de log:

- **Saída do console** (o que você vê no terminal / interface de depuração).
- **Logs de arquivo** (linhas JSON) gravados pelo registrador do Gateway.

Na inicialização, o Gateway registra o modelo de agente padrão resolvido junto com os
padrões de modo que afetam novas sessões, por exemplo:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` vem do agente padrão, dos parâmetros do modelo ou do padrão global do agente;
quando não está definido, o resumo de inicialização mostra `medium`. `fast` vem do
agente padrão ou dos parâmetros `fastMode` do modelo.

## Registrador baseado em arquivo

- O arquivo de log rotativo padrão fica em `/tmp/openclaw/` (um arquivo por dia): `openclaw-YYYY-MM-DD.log`
  - A data usa o fuso horário local do host do Gateway.
- Arquivos de log ativos são rotacionados em `logging.maxFileBytes` (padrão: 100 MB), mantendo
  até cinco arquivos numerados e continuando a gravar em um novo arquivo ativo.
- O caminho e o nível do arquivo de log podem ser configurados via `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

O formato do arquivo é um objeto JSON por linha.

A aba Logs da interface de controle acompanha esse arquivo via Gateway (`logs.tail`).
A CLI pode fazer o mesmo:

```bash
openclaw logs --follow
```

**Detalhado vs. níveis de log**

- **Logs de arquivo** são controlados exclusivamente por `logging.level`.
- `--verbose` afeta apenas a **verbosidade do console** (e o estilo de log WS); ele **não**
  aumenta o nível de log do arquivo.
- Para capturar detalhes exclusivos do modo detalhado nos logs de arquivo, defina `logging.level` como `debug` ou
  `trace`.
- O registro em nível trace também inclui resumos de tempo de diagnóstico para caminhos críticos selecionados,
  como a preparação de fábricas de ferramentas de Plugins. Consulte
  [/tools/plugin#slow-plugin-tool-setup](/pt-BR/tools/plugin#slow-plugin-tool-setup).

## Captura do console

A CLI captura `console.log/info/warn/error/debug/trace` e os grava nos logs de arquivo,
enquanto ainda imprime em stdout/stderr.

Você pode ajustar a verbosidade do console de forma independente via:

- `logging.consoleLevel` (padrão `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redação

O OpenClaw pode mascarar tokens sensíveis antes que a saída de log ou de transcrição saia do
processo. Essa política de redação de logs é aplicada aos destinos de texto do console,
log de arquivo, registro de log OTLP e transcrição de sessão, para que valores secretos correspondentes sejam
mascarados antes que linhas JSONL ou mensagens sejam gravadas em disco.

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: matriz de strings regex (substitui os padrões)
  - Use strings regex brutas (`gi` automático), ou `/pattern/flags` se precisar de flags personalizadas.
  - Correspondências são mascaradas mantendo os primeiros 6 + últimos 4 caracteres (comprimento >= 18), caso contrário `***`.
  - Os padrões cobrem atribuições comuns de chaves, flags de CLI, campos JSON, cabeçalhos bearer, blocos PEM, prefixos populares de tokens e nomes de campos de credenciais de pagamento, como número do cartão, CVC/CVV, token de pagamento compartilhado e credencial de pagamento.

Alguns limites de segurança sempre fazem redação, independentemente de `logging.redactSensitive`.
Isso inclui eventos de chamadas de ferramentas da interface de controle, saída da ferramenta `sessions_history`,
exportações de suporte a diagnósticos, observações de erros de provedores, exibição de comandos de aprovação de exec
e logs do protocolo WebSocket do Gateway. Essas superfícies ainda podem usar
`logging.redactPatterns` como padrões adicionais, mas `redactSensitive: "off"`
não faz com que elas emitam segredos brutos.

## Logs WebSocket do Gateway

O Gateway imprime logs do protocolo WebSocket em dois modos:

- **Modo normal (sem `--verbose`)**: apenas resultados RPC “interessantes” são impressos:
  - erros (`ok=false`)
  - chamadas lentas (limiar padrão: `>= 50ms`)
  - erros de análise
- **Modo detalhado (`--verbose`)**: imprime todo o tráfego de solicitação/resposta WS.

### Estilo de log WS

`openclaw gateway` oferece suporte a uma alternância de estilo por Gateway:

- `--ws-log auto` (padrão): o modo normal é otimizado; o modo detalhado usa saída compacta
- `--ws-log compact`: saída compacta (solicitação/resposta em pares) quando detalhado
- `--ws-log full`: saída completa por quadro quando detalhado
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

## Formatação do console (registro por subsistema)

O formatador do console é **compatível com TTY** e imprime linhas consistentes, com prefixos.
Registradores de subsistema mantêm a saída agrupada e fácil de examinar.

Comportamento:

- **Prefixos de subsistema** em cada linha (por exemplo, `[gateway]`, `[canvas]`, `[tailscale]`)
- **Cores de subsistema** (estáveis por subsistema), além de coloração por nível
- **Cor quando a saída é um TTY ou o ambiente parece um terminal avançado** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respeita `NO_COLOR`
- **Prefixos de subsistema encurtados**: remove `gateway/` + `channels/` iniciais, mantém os últimos 2 segmentos (por exemplo, `whatsapp/outbound`)
- **Sub-registradores por subsistema** (prefixo automático + campo estruturado `{ subsystem }`)
- **`logRaw()`** para saída de QR/UX (sem prefixo, sem formatação)
- **Estilos de console** (por exemplo, `pretty | compact | json`)
- **Nível de log do console** separado do nível de log do arquivo (o arquivo mantém detalhes completos quando `logging.level` está definido como `debug`/`trace`)
- **Corpos de mensagens do WhatsApp** são registrados em `debug` (use `--verbose` para vê-los)

Isso mantém os logs de arquivo existentes estáveis enquanto torna a saída interativa fácil de examinar.

## Relacionado

- [Logging](/pt-BR/logging)
- [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
