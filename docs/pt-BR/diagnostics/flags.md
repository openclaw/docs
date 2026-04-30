---
read_when:
    - Você precisa de logs de depuração direcionados sem aumentar os níveis globais de log
    - É necessário capturar logs específicos do subsistema para o suporte
summary: Flags de diagnóstico para logs de depuração direcionados
title: Sinalizadores de diagnóstico
x-i18n:
    generated_at: "2026-04-30T09:46:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 486051e54c456dedcae5dce59e253add3554d8417660bfc97a75d21fa5fdd6f5
    source_path: diagnostics/flags.md
    workflow: 16
---

Sinalizadores de diagnóstico permitem ativar logs de depuração direcionados sem habilitar logs detalhados em todos os lugares. Os sinalizadores são opcionais e não têm efeito a menos que um subsistema os verifique.

## Como funciona

- Sinalizadores são strings (sem diferenciar maiúsculas de minúsculas).
- Você pode ativar sinalizadores na configuração ou por meio de uma substituição de env.
- Curingas são compatíveis:
  - `telegram.*` corresponde a `telegram.http`
  - `*` ativa todos os sinalizadores

## Habilitar via configuração

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Vários sinalizadores:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

Reinicie o Gateway depois de alterar os sinalizadores.

## Substituição por env (uso único)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Desativar todos os sinalizadores:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Artefatos de linha do tempo

O sinalizador `timeline` grava eventos estruturados de tempo de inicialização e execução para
harnesses externos de QA:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

Você também pode ativá-lo na configuração:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

O caminho do arquivo da linha do tempo ainda vem de
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. Quando `timeline` é ativado apenas pela
configuração, os primeiros spans de carregamento da configuração não são emitidos porque o OpenClaw
ainda não leu a configuração; os spans de inicialização subsequentes usam o sinalizador da configuração.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` e
`OPENCLAW_DIAGNOSTICS=*` também ativam a linha do tempo porque ativam todos os
sinalizadores de diagnóstico. Prefira `timeline` quando você quiser apenas o artefato
de tempo em JSONL.

Registros da linha do tempo usam o envelope `openclaw.diagnostics.v1`. Eventos podem incluir
IDs de processos, nomes de fases, nomes de spans, durações, IDs de plugins, contagens de dependências,
amostras de atraso do loop de eventos, nomes de operações de provedores, estado de saída de processos filhos
e nomes/mensagens de erros de inicialização. Trate arquivos de linha do tempo como artefatos locais
de diagnóstico; revise-os antes de compartilhá-los fora da sua máquina.

## Para onde vão os logs

Sinalizadores emitem logs no arquivo padrão de logs de diagnóstico. Por padrão:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Se você definir `logging.file`, use esse caminho em vez disso. Os logs são JSONL (um objeto JSON por linha). A redação ainda se aplica com base em `logging.redactSensitive`.

## Extrair logs

Escolha o arquivo de log mais recente:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filtre por diagnósticos HTTP do Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Ou acompanhe enquanto reproduz:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Para Gateways remotos, você também pode usar `openclaw logs --follow` (veja [/cli/logs](/pt-BR/cli/logs)).

## Observações

- Se `logging.level` estiver definido acima de `warn`, esses logs podem ser suprimidos. O padrão `info` funciona bem.
- É seguro deixar sinalizadores ativados; eles só afetam o volume de logs do subsistema específico.
- Use [/logging](/pt-BR/logging) para alterar destinos, níveis e redação de logs.

## Relacionado

- [Diagnósticos do Gateway](/pt-BR/gateway/diagnostics)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
