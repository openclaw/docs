---
read_when:
    - Alterando a saída ou os formatos de log
    - Depuração da saída da CLI ou do Gateway
summary: Superfícies de registro, registros em arquivo, estilos de registro WS e formatação do console
title: Registro em log do Gateway
x-i18n:
    generated_at: "2026-04-30T09:49:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ce9c78201d2e26760282b08eacb17826b1eac84e80b99d3a9d5cbff4078b5b3
    source_path: gateway/logging.md
    workflow: 16
---

# Registro em Log

Para uma visão geral voltada ao usuário (CLI + Interface de Controle + config), consulte [/logging](/pt-BR/logging).

O OpenClaw tem duas “superfícies” de log:

- **Saída do console** (o que você vê no terminal / Interface de Depuração).
- **Logs de arquivo** (linhas JSON) gravados pelo logger do Gateway.

## Logger baseado em arquivo

- O arquivo de log rotativo padrão fica em `/tmp/openclaw/` (um arquivo por dia): `openclaw-YYYY-MM-DD.log`
  - A data usa o fuso horário local do host do Gateway.
- Arquivos de log ativos são rotacionados em `logging.maxFileBytes` (padrão: 100 MB), mantendo
  até cinco arquivos numerados e continuando a gravar em um novo arquivo ativo.
- O caminho e o nível do arquivo de log podem ser configurados via `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

O formato do arquivo é um objeto JSON por linha.

A aba Logs da Interface de Controle acompanha esse arquivo via Gateway (`logs.tail`).
A CLI pode fazer o mesmo:

```bash
openclaw logs --follow
```

**Verbose vs. níveis de log**

- **Logs de arquivo** são controlados exclusivamente por `logging.level`.
- `--verbose` afeta apenas a **verbosidade do console** (e o estilo de log WS); ele **não**
  aumenta o nível de log do arquivo.
- Para capturar detalhes disponíveis apenas em modo verboso nos logs de arquivo, defina `logging.level` como `debug` ou
  `trace`.

## Captura do console

A CLI captura `console.log/info/warn/error/debug/trace` e grava isso nos logs de arquivo,
enquanto ainda imprime em stdout/stderr.

Você pode ajustar a verbosidade do console de forma independente via:

- `logging.consoleLevel` (padrão `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redação

O OpenClaw pode mascarar tokens sensíveis antes que a saída de log ou transcrição saia do
processo. Essa política de redação de logs é aplicada aos destinos de texto de console, log de arquivo, registros de log OTLP
e transcrições de sessão, de modo que valores secretos correspondentes sejam
mascarados antes que linhas JSONL ou mensagens sejam gravadas em disco.

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: array de strings regex (substitui os padrões)
  - Use strings regex brutas (`gi` automático), ou `/pattern/flags` se precisar de flags personalizadas.
  - Correspondências são mascaradas mantendo os primeiros 6 + últimos 4 caracteres (comprimento >= 18), caso contrário `***`.
  - Os padrões cobrem atribuições comuns de chaves, flags da CLI, campos JSON, cabeçalhos bearer, blocos PEM e prefixos populares de tokens.

Alguns limites de segurança sempre redigem, independentemente de `logging.redactSensitive`.
Isso inclui eventos de chamada de ferramenta da Interface de Controle, saída da ferramenta `sessions_history`,
exportações de suporte a diagnósticos, observações de erro de provedores, exibição de comando de aprovação de exec
e logs do protocolo WebSocket do Gateway. Essas superfícies ainda podem usar
`logging.redactPatterns` como padrões adicionais, mas `redactSensitive: "off"`
não faz com que emitam segredos brutos.

## Logs WebSocket do Gateway

O Gateway imprime logs do protocolo WebSocket em dois modos:

- **Modo normal (sem `--verbose`)**: apenas resultados RPC “interessantes” são impressos:
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

## Formatação do console (log por subsistema)

O formatador do console é **ciente de TTY** e imprime linhas consistentes, com prefixos.
Loggers de subsistema mantêm a saída agrupada e fácil de examinar.

Comportamento:

- **Prefixos de subsistema** em cada linha (por exemplo, `[gateway]`, `[canvas]`, `[tailscale]`)
- **Cores de subsistema** (estáveis por subsistema), além de coloração por nível
- **Cor quando a saída é um TTY ou o ambiente parece um terminal rico** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respeita `NO_COLOR`
- **Prefixos de subsistema encurtados**: remove `gateway/` + `channels/` iniciais, mantém os 2 últimos segmentos (por exemplo, `whatsapp/outbound`)
- **Sub-loggers por subsistema** (prefixo automático + campo estruturado `{ subsystem }`)
- **`logRaw()`** para saída de QR/UX (sem prefixo, sem formatação)
- **Estilos de console** (por exemplo, `pretty | compact | json`)
- **Nível de log do console** separado do nível de log do arquivo (o arquivo mantém todos os detalhes quando `logging.level` está definido como `debug`/`trace`)
- **Corpos de mensagens do WhatsApp** são registrados em `debug` (use `--verbose` para vê-los)

Isso mantém os logs de arquivo existentes estáveis enquanto torna a saída interativa fácil de examinar.

## Relacionados

- [Registro em Log](/pt-BR/logging)
- [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
