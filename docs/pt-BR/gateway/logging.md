---
read_when:
    - Alteração da saída ou dos formatos de log
    - Depuração da saída da CLI ou do Gateway
summary: Superfícies de log, logs de arquivo, estilos de log WS e formatação do console
title: Logs do Gateway
x-i18n:
    generated_at: "2026-05-01T05:56:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: f843812a41c25f9ca1884543ad3a5663c8e0bc327027cbd2b58ea6557c466aa9
    source_path: gateway/logging.md
    workflow: 16
---

# Logs

Para uma visão geral voltada ao usuário (CLI + UI de Controle + configuração), consulte [/logging](/pt-BR/logging).

O OpenClaw tem duas “superfícies” de log:

- **Saída do console** (o que você vê no terminal / UI de Depuração).
- **Logs em arquivo** (linhas JSON) gravados pelo logger do Gateway.

## Logger baseado em arquivos

- O arquivo de log rotativo padrão fica em `/tmp/openclaw/` (um arquivo por dia): `openclaw-YYYY-MM-DD.log`
  - A data usa o fuso horário local do host do Gateway.
- Arquivos de log ativos rotacionam em `logging.maxFileBytes` (padrão: 100 MB), mantendo
  até cinco arquivos numerados e continuando a gravar em um novo arquivo ativo.
- O caminho e o nível do arquivo de log podem ser configurados via `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

O formato do arquivo é um objeto JSON por linha.

A aba Logs da UI de Controle acompanha esse arquivo via Gateway (`logs.tail`).
A CLI pode fazer o mesmo:

```bash
openclaw logs --follow
```

**Detalhado vs. níveis de log**

- **Logs em arquivo** são controlados exclusivamente por `logging.level`.
- `--verbose` afeta apenas a **verbosidade do console** (e o estilo de log WS); ele **não**
  aumenta o nível de log do arquivo.
- Para capturar detalhes que aparecem apenas no modo detalhado nos logs em arquivo, defina `logging.level` como `debug` ou
  `trace`.

## Captura do console

A CLI captura `console.log/info/warn/error/debug/trace` e os grava nos logs em arquivo,
enquanto ainda imprime em stdout/stderr.

Você pode ajustar a verbosidade do console de forma independente via:

- `logging.consoleLevel` (padrão `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redação

O OpenClaw pode mascarar tokens sensíveis antes que a saída de log ou transcrição saia do
processo. Essa política de redação de logs é aplicada a coletores de texto de console, log em arquivo, registros
de log OTLP e transcrições de sessão, para que valores secretos correspondentes sejam
mascarados antes que linhas JSONL ou mensagens sejam gravadas no disco.

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: array de strings regex (substitui os padrões)
  - Use strings regex brutas (auto `gi`) ou `/pattern/flags` se precisar de flags personalizadas.
  - Correspondências são mascaradas mantendo os primeiros 6 + últimos 4 caracteres (comprimento >= 18); caso contrário, `***`.
  - Os padrões cobrem atribuições comuns de chaves, flags de CLI, campos JSON, cabeçalhos bearer, blocos PEM, prefixos populares de token e nomes de campos de credenciais de pagamento, como número do cartão, CVC/CVV, token de pagamento compartilhado e credencial de pagamento.

Alguns limites de segurança sempre fazem redação, independentemente de `logging.redactSensitive`.
Isso inclui eventos de chamada de ferramenta da UI de Controle, saída da ferramenta `sessions_history`,
exportações de suporte de diagnósticos, observações de erros de provedores, exibição de comandos
de aprovação de execução e logs do protocolo WebSocket do Gateway. Essas superfícies ainda podem usar
`logging.redactPatterns` como padrões adicionais, mas `redactSensitive: "off"`
não faz com que emitam segredos brutos.

## Logs WebSocket do Gateway

O Gateway imprime logs do protocolo WebSocket em dois modos:

- **Modo normal (sem `--verbose`)**: apenas resultados RPC “interessantes” são impressos:
  - erros (`ok=false`)
  - chamadas lentas (limite padrão: `>= 50ms`)
  - erros de análise
- **Modo detalhado (`--verbose`)**: imprime todo o tráfego de requisição/resposta WS.

### Estilo de log WS

`openclaw gateway` oferece suporte a uma troca de estilo por Gateway:

- `--ws-log auto` (padrão): o modo normal é otimizado; o modo detalhado usa saída compacta
- `--ws-log compact`: saída compacta (requisição/resposta pareadas) quando detalhado
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

## Formatação do console (logs de subsistema)

O formatador de console é **ciente de TTY** e imprime linhas consistentes com prefixo.
Loggers de subsistema mantêm a saída agrupada e fácil de examinar.

Comportamento:

- **Prefixos de subsistema** em todas as linhas (por exemplo, `[gateway]`, `[canvas]`, `[tailscale]`)
- **Cores de subsistema** (estáveis por subsistema) mais cores de nível
- **Cor quando a saída é um TTY ou o ambiente parece um terminal rico** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respeita `NO_COLOR`
- **Prefixos de subsistema encurtados**: remove `gateway/` + `channels/` iniciais, mantém os últimos 2 segmentos (por exemplo, `whatsapp/outbound`)
- **Sub-loggers por subsistema** (prefixo automático + campo estruturado `{ subsystem }`)
- **`logRaw()`** para saída de QR/UX (sem prefixo, sem formatação)
- **Estilos de console** (por exemplo, `pretty | compact | json`)
- **Nível de log do console** separado do nível de log do arquivo (o arquivo mantém detalhes completos quando `logging.level` é definido como `debug`/`trace`)
- **Corpos de mensagens do WhatsApp** são registrados em `debug` (use `--verbose` para vê-los)

Isso mantém os logs em arquivo existentes estáveis enquanto torna a saída interativa fácil de examinar.

## Relacionado

- [Logs](/pt-BR/logging)
- [Exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
