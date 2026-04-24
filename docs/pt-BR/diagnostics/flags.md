---
read_when:
    - Você precisa de logs de depuração direcionados sem aumentar os níveis globais de log
    - Você precisa capturar logs específicos de subsistemas para suporte
summary: Sinalizadores de diagnóstico para logs de depuração direcionados
title: Sinalizadores de diagnóstico
x-i18n:
    generated_at: "2026-04-24T05:50:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7e5ec9c5e28ef51f1e617baf62412897df8096f227a74d86a0824e269aafd9d
    source_path: diagnostics/flags.md
    workflow: 15
---

Os sinalizadores de diagnóstico permitem ativar logs de depuração direcionados sem ativar log detalhado em todos os lugares. Os sinalizadores são opt-in e não têm efeito a menos que um subsistema os verifique.

## Como funciona

- Os sinalizadores são strings (sem diferenciar maiúsculas de minúsculas).
- Você pode ativar sinalizadores na configuração ou por uma substituição de ambiente.
- Curingas são compatíveis:
  - `telegram.*` corresponde a `telegram.http`
  - `*` ativa todos os sinalizadores

## Ativar por configuração

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

Reinicie o gateway após alterar os sinalizadores.

## Substituição por ambiente (pontual)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Desabilitar todos os sinalizadores:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Para onde os logs vão

Os sinalizadores emitem logs no arquivo padrão de logs de diagnóstico. Por padrão:

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

Ou acompanhe enquanto reproduz:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Para gateways remotos, você também pode usar `openclaw logs --follow` (consulte [/cli/logs](/pt-BR/cli/logs)).

## Observações

- Se `logging.level` estiver definido acima de `warn`, esses logs podem ser suprimidos. O padrão `info` é adequado.
- É seguro deixar os sinalizadores ativados; eles afetam apenas o volume de logs do subsistema específico.
- Use [/logging](/pt-BR/logging) para alterar destinos, níveis e redação dos logs.

## Relacionado

- [Diagnóstico do Gateway](/pt-BR/gateway/diagnostics)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
