---
read_when:
    - Atualização do comportamento de novas tentativas ou dos padrões do provedor
    - Depuração de erros de envio ou limites de taxa do provedor
summary: Política de novas tentativas para chamadas de saída para provedores
title: Política de novas tentativas
x-i18n:
    generated_at: "2026-05-02T05:45:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7720092499effdfa011fc0a0310adb2ecddca9e94f57f749794eab1c9ab4c922
    source_path: concepts/retry.md
    workflow: 16
---

## Metas

- Tentar novamente por solicitação HTTP, não por fluxo de várias etapas.
- Preservar a ordem tentando novamente apenas a etapa atual.
- Evitar duplicar operações não idempotentes.

## Padrões

- Tentativas: 3
- Limite máximo de atraso: 30000 ms
- Variação aleatória: 0.1 (10 por cento)
- Padrões de provedor:
  - Atraso mínimo do Telegram: 400 ms
  - Atraso mínimo do Discord: 500 ms

## Comportamento

### Provedores de modelos

- O OpenClaw permite que os SDKs de provedores lidem com tentativas curtas normais.
- Para SDKs baseados em Stainless, como Anthropic e OpenAI, respostas passíveis
  de nova tentativa (`408`, `409`, `429` e `5xx`) podem incluir `retry-after-ms` ou
  `retry-after`. Quando essa espera é maior que 60 segundos, o OpenClaw injeta
  `x-should-retry: false` para que o SDK exponha o erro imediatamente e o failover
  de modelo possa alternar para outro perfil de autenticação ou modelo alternativo.
- Substitua o limite com `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Defina como `0`, `false`, `off`, `none` ou `disabled` para permitir que os SDKs respeitem internamente longas
  esperas de `Retry-After`.

### Discord

- Tenta novamente em erros de limite de taxa (HTTP 429), tempos limite de solicitação, respostas HTTP 5xx
  e falhas transitórias de transporte, como falhas de consulta DNS, redefinições de
  conexão, fechamentos de socket e falhas de fetch.
- Usa `retry_after` do Discord quando disponível; caso contrário, usa backoff exponencial.

### Telegram

- Tenta novamente em erros transitórios (429, tempo limite, conexão/redefinição/fechado, temporariamente indisponível).
- Usa `retry_after` quando disponível; caso contrário, usa backoff exponencial.
- Erros de análise de Markdown não são tentados novamente; eles recorrem a texto simples.

## Configuração

Defina a política de novas tentativas por provedor em `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## Observações

- Novas tentativas se aplicam por solicitação (envio de mensagem, upload de mídia, reação, enquete, sticker).
- Fluxos compostos não tentam novamente etapas concluídas.

## Relacionado

- [Failover de modelos](/pt-BR/concepts/model-failover)
- [Fila de comandos](/pt-BR/concepts/queue)
