---
read_when:
    - Alterar saída ou formatos de log
    - Depurando a saída da CLI ou do gateway
summary: Superfícies de log, logs em arquivo, estilos de log WS e formatação do console
title: Registro do Gateway
x-i18n:
    generated_at: "2026-06-27T17:31:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde5e589bb48cd8c41ac6dd0d74780fec1cc1ee79d82d433b4e7c7450dc5c8b6
    source_path: gateway/logging.md
    workflow: 16
---

# Registro de logs

Para uma visão geral voltada ao usuário (CLI + Control UI + configuração), consulte [/logging](/pt-BR/logging).

O OpenClaw tem duas "superfícies" de log:

- **Saída do console** (o que você vê no terminal / Debug UI).
- **Logs em arquivo** (linhas JSON) gravados pelo logger do Gateway.

Na inicialização, o Gateway registra o modelo de agente padrão resolvido junto com os
padrões de modo que afetam novas sessões, por exemplo:

```text
agent model: openai/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` vem do agente padrão, dos parâmetros do modelo ou do padrão global do agente;
quando não está definido, o resumo de inicialização mostra `medium`. `fast` vem do
agente padrão ou dos parâmetros `fastMode` do modelo.

## Logger baseado em arquivo

- O arquivo de log rotativo padrão fica em `/tmp/openclaw/` (um arquivo por dia): `openclaw-YYYY-MM-DD.log`
  - A data usa o fuso horário local do host do Gateway.
- Arquivos de log ativos rotacionam em `logging.maxFileBytes` (padrão: 100 MB), mantendo
  até cinco arquivos numerados e continuando a gravar em um novo arquivo ativo.
- O caminho e o nível do arquivo de log podem ser configurados via `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

O formato do arquivo é um objeto JSON por linha.

Os caminhos de código de conversa, voz em tempo real e sala gerenciada usam o logger de arquivo compartilhado para
registros de ciclo de vida delimitados. Esses registros destinam-se à depuração operacional
e à exportação de logs OTLP; texto de transcrição, payloads de áudio, ids de turno, ids de chamada e
ids de itens do provedor não são copiados para o registro de log.

A aba Logs da Control UI acompanha esse arquivo via Gateway (`logs.tail`).
A CLI pode fazer o mesmo:

```bash
openclaw logs --follow
```

**Detalhado vs. níveis de log**

- **Logs em arquivo** são controlados exclusivamente por `logging.level`.
- `--verbose` afeta apenas a **verbosidade do console** (e o estilo de log WS); ele **não**
  aumenta o nível de log do arquivo.
- Para capturar detalhes disponíveis apenas no modo detalhado em logs de arquivo, defina `logging.level` como `debug` ou
  `trace`.
- O registro de rastreamento também inclui resumos de temporização diagnóstica para caminhos críticos selecionados,
  como a preparação da fábrica de ferramentas de Plugin. Consulte
  [/tools/plugin#slow-plugin-tool-setup](/pt-BR/tools/plugin#slow-plugin-tool-setup).

## Captura do console

A CLI captura `console.log/info/warn/error/debug/trace` e os grava nos logs de arquivo,
enquanto ainda imprime em stdout/stderr.

Você pode ajustar a verbosidade do console independentemente via:

- `logging.consoleLevel` (padrão `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redação

O OpenClaw pode mascarar tokens sensíveis antes que a saída de log ou transcrição saia do
processo. Essa política de redação de logs é aplicada aos destinos de texto de console, log em arquivo, registro de log OTLP
e transcrição de sessão, para que valores secretos correspondentes sejam
mascarados antes que linhas JSONL ou mensagens sejam gravadas em disco.

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: array de strings regex (substitui os padrões)
  - Use strings regex brutas (`gi` automático), ou `/pattern/flags` se precisar de flags personalizadas.
  - Correspondências são mascaradas mantendo os primeiros 6 + últimos 4 caracteres (comprimento >= 18), caso contrário `***`.
  - Os padrões cobrem atribuições comuns de chaves, flags de CLI, campos JSON, cabeçalhos bearer, blocos PEM, prefixos populares de tokens e nomes de campos de credenciais de pagamento, como número do cartão, CVC/CVV, token de pagamento compartilhado e credencial de pagamento.

Alguns limites de segurança sempre redigem, independentemente de `logging.redactSensitive`.
Isso inclui eventos de chamadas de ferramentas da Control UI, saída da ferramenta `sessions_history`,
exportações de suporte de diagnóstico, observações de erro de provedor, exibição de comandos de aprovação de exec
e logs do protocolo WebSocket do Gateway. Essas superfícies ainda podem usar
`logging.redactPatterns` como padrões adicionais, mas `redactSensitive: "off"`
não faz com que emitam segredos brutos.

## Logs WebSocket do Gateway

O Gateway imprime logs do protocolo WebSocket em dois modos:

- **Modo normal (sem `--verbose`)**: apenas resultados RPC "interessantes" são impressos:
  - erros (`ok=false`)
  - chamadas lentas (limite padrão: `>= 50ms`)
  - erros de análise
- **Modo detalhado (`--verbose`)**: imprime todo o tráfego de solicitação/resposta WS.

### Estilo de log WS

`openclaw gateway` oferece suporte a uma opção de estilo por Gateway:

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

## Formatação do console (registro de subsistemas)

O formatador do console é **ciente de TTY** e imprime linhas consistentes, com prefixo.
Loggers de subsistema mantêm a saída agrupada e fácil de examinar.

Comportamento:

- **Prefixos de subsistema** em cada linha (por exemplo, `[gateway]`, `[canvas]`, `[tailscale]`)
- **Cores de subsistema** (estáveis por subsistema) mais coloração de nível
- **Cor quando a saída é um TTY ou o ambiente parece um terminal avançado** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respeita `NO_COLOR`
- **Prefixos de subsistema encurtados**: remove `gateway/` + `channels/` iniciais, mantém os últimos 2 segmentos (por exemplo, `whatsapp/outbound`)
- **Sub-loggers por subsistema** (prefixo automático + campo estruturado `{ subsystem }`)
- **`logRaw()`** para saída QR/UX (sem prefixo, sem formatação)
- **Estilos de console** (por exemplo, `pretty | compact | json`)
- **Nível de log do console** separado do nível de log do arquivo (o arquivo mantém todos os detalhes quando `logging.level` está definido como `debug`/`trace`)
- **Corpos de mensagens do WhatsApp** são registrados em `debug` (use `--verbose` para vê-los)

Isso mantém os logs de arquivo existentes estáveis enquanto torna a saída interativa fácil de examinar.

## Relacionados

- [Registro de logs](/pt-BR/logging)
- [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
