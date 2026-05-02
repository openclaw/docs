---
read_when:
    - Você precisa de logs de depuração direcionados sem elevar os níveis globais de registro
    - Você precisa capturar logs específicos do subsistema para o suporte
summary: Sinalizadores de diagnóstico para logs de depuração direcionados
title: Flags de diagnóstico
x-i18n:
    generated_at: "2026-05-02T20:46:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1d0ff92d45cf1c5a12a7103ba5b97d656a55a13a7a4f2e86e26ba3a9cfae7687
    source_path: diagnostics/flags.md
    workflow: 16
---

Os sinalizadores de diagnóstico permitem ativar logs de depuração direcionados sem habilitar logs detalhados em todos os lugares. Os sinalizadores são opcionais e não têm efeito a menos que um subsistema os verifique.

## Como funciona

- Os sinalizadores são strings (sem diferenciar maiúsculas de minúsculas).
- Você pode ativar sinalizadores na configuração ou por meio de uma substituição de env.
- Curingas são compatíveis:
  - `telegram.*` corresponde a `telegram.http`
  - `*` ativa todos os sinalizadores

## Ativar via configuração

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
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

Reinicie o gateway após alterar os sinalizadores.

## Substituição por env (uso único)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Desativar todos os sinalizadores:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Artefatos de linha do tempo

O sinalizador `timeline` grava eventos estruturados de temporização de inicialização e execução para
estruturas externas de QA:

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

O caminho do arquivo de linha do tempo ainda vem de
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. Quando `timeline` é ativado apenas pela
configuração, os primeiros intervalos de carregamento da configuração não são emitidos porque o OpenClaw ainda
não leu a configuração; os intervalos subsequentes de inicialização usam o sinalizador da configuração.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` e
`OPENCLAW_DIAGNOSTICS=*` também ativam a linha do tempo porque ativam todos os
sinalizadores de diagnóstico. Prefira `timeline` quando você quiser apenas o
artefato de temporização JSONL.

Os registros de linha do tempo usam o envelope `openclaw.diagnostics.v1`. Eventos podem incluir
ids de processo, nomes de fase, nomes de intervalo, durações, ids de plugin, contagens de dependências,
amostras de atraso do loop de eventos, nomes de operações de provedores, estado de saída de processos filhos
e nomes/mensagens de erros de inicialização. Trate os arquivos de linha do tempo como
artefatos de diagnóstico locais; revise-os antes de compartilhá-los fora da sua máquina.

## Para onde vão os logs

Os sinalizadores emitem logs no arquivo de log de diagnóstico padrão. Por padrão:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Se você definir `logging.file`, use esse caminho em vez disso. Os logs são JSONL (um objeto JSON por linha). A redação ainda se aplica com base em `logging.redactSensitive`.

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

Para gateways remotos, você também pode usar `openclaw logs --follow` (consulte [/cli/logs](/pt-BR/cli/logs)).

## Observações

- Se `logging.level` estiver definido acima de `warn`, esses logs poderão ser suprimidos. O padrão `info` é adequado.
- `brave.http` registra URLs/parâmetros de consulta de solicitações do Brave Search, status/tempo de resposta e eventos de acerto/erro/gravação de cache. Ele não registra chaves de API nem corpos de resposta, mas consultas de busca podem ser sensíveis.
- É seguro deixar os sinalizadores ativados; eles afetam apenas o volume de logs do subsistema específico.
- Use [/logging](/pt-BR/logging) para alterar destinos, níveis e redação de logs.

## Relacionado

- [Diagnóstico do Gateway](/pt-BR/gateway/diagnostics)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
