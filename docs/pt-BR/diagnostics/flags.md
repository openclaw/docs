---
read_when:
    - Você precisa de logs de depuração direcionados sem aumentar os níveis globais de registro
    - Você precisa capturar logs específicos do subsistema para suporte
summary: Sinalizadores de diagnóstico para logs de depuração direcionados
title: Sinalizadores de diagnóstico
x-i18n:
    generated_at: "2026-06-27T17:28:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c78c5c2f90fb1d601d0a3ef94919310759d58c9f9c70a093c91f31594bc777fb
    source_path: diagnostics/flags.md
    workflow: 16
---

Flags de diagnóstico permitem habilitar logs de depuração direcionados sem ativar logs detalhados em todos os lugares. As flags são opt-in e não têm efeito a menos que um subsistema as verifique.

## Como funciona

- Flags são strings (sem diferenciar maiúsculas de minúsculas).
- Você pode habilitar flags na configuração ou por meio de uma substituição via env.
- Caracteres curinga são compatíveis:
  - `telegram.*` corresponde a `telegram.http`
  - `*` habilita todas as flags

## Habilitar via configuração

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Múltiplas flags:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

Reinicie o Gateway depois de alterar as flags.

## Substituição via env (uso único)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Desabilitar todas as flags:

```bash
OPENCLAW_DIAGNOSTICS=0
```

`OPENCLAW_DIAGNOSTICS=0` é uma substituição de desabilitação em nível de processo: ela desabilita
flags tanto do env quanto da configuração para esse processo.

## Flags de perfilamento

Flags de perfilador habilitam intervalos de temporização direcionados sem aumentar os níveis
globais de log. Elas ficam desabilitadas por padrão.

Habilite todos os intervalos controlados por perfilador para uma execução do Gateway:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Habilite apenas intervalos de perfilador de envio de respostas:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Habilite apenas intervalos de perfilador de inicialização/ferramenta/thread do servidor de app Codex:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

Habilite flags de perfilador pela configuração:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Reinicie o Gateway depois de alterar flags de configuração. Para desabilitar uma flag de perfilador,
remova-a de `diagnostics.flags` e reinicie. Para desabilitar temporariamente todas as
flags de diagnóstico mesmo quando a configuração habilita flags de perfilador, inicie o processo com:

```bash
OPENCLAW_DIAGNOSTICS=0 openclaw gateway run
```

## Artefatos de linha do tempo

A flag `timeline` grava eventos estruturados de temporização de inicialização e runtime para
harnesses externos de QA:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

Você também pode habilitá-la na configuração:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

O caminho do arquivo de linha do tempo ainda vem de
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. Quando `timeline` é habilitada apenas pela
configuração, os primeiros intervalos de carregamento de configuração não são emitidos porque o OpenClaw
ainda não leu a configuração; os intervalos de inicialização subsequentes usam a flag da configuração.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` e
`OPENCLAW_DIAGNOSTICS=*` também habilitam a linha do tempo porque habilitam todas as
flags de diagnóstico. Prefira `timeline` quando você quiser apenas o artefato de temporização
JSONL.

Registros de linha do tempo usam o envelope `openclaw.diagnostics.v1`. Eventos podem incluir
IDs de processo, nomes de fase, nomes de intervalo, durações, IDs de plugin, contagens de dependências,
amostras de atraso do loop de eventos, nomes de operações de provedor, estado de saída de processo filho
e nomes/mensagens de erro de inicialização. Trate arquivos de linha do tempo como artefatos locais
de diagnóstico; revise-os antes de compartilhá-los fora da sua máquina.

## Para onde os logs vão

Flags emitem logs no arquivo de log de diagnóstico padrão. Por padrão:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Se você definir `logging.file`, use esse caminho em vez disso. Logs são JSONL (um objeto JSON por linha). A redação ainda se aplica com base em `logging.redactSensitive`.

## Extrair logs

Escolha o arquivo de log mais recente:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filtre diagnósticos HTTP do Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Filtre diagnósticos HTTP do Brave Search:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

Ou acompanhe enquanto reproduz:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Para Gateways remotos, você também pode usar `openclaw logs --follow` (veja [/cli/logs](/pt-BR/cli/logs)).

## Observações

- Se `logging.level` estiver definido acima de `warn`, esses logs podem ser suprimidos. O padrão `info` é adequado.
- `brave.http` registra URLs/parâmetros de consulta de solicitações do Brave Search, status/temporização de resposta e eventos de acerto/erro/gravação de cache. Ele não registra chaves de API nem corpos de resposta, mas consultas de pesquisa podem ser sensíveis.
- É seguro deixar flags habilitadas; elas afetam apenas o volume de log do subsistema específico.
- Use [/logging](/pt-BR/logging) para alterar destinos, níveis e redação de logs.

## Relacionado

- [Diagnósticos do Gateway](/pt-BR/gateway/diagnostics)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
