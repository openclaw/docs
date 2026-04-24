---
read_when:
    - Atualizando o comportamento ou os padrões de retry do provedor
    - Depurando erros de envio para provedores ou limites de taxa
summary: Política de retry para chamadas de saída a provedores
title: Política de retry
x-i18n:
    generated_at: "2026-04-24T05:49:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 38811a6dabb0b60b71167ee4fcc09fb042f941b4bbb1cf8b0f5a91c3c93b2e75
    source_path: concepts/retry.md
    workflow: 15
---

## Objetivos

- Tentar novamente por requisição HTTP, não por fluxo de várias etapas.
- Preservar a ordenação tentando novamente apenas a etapa atual.
- Evitar duplicação de operações não idempotentes.

## Padrões

- Tentativas: 3
- Limite máximo de atraso: 30000 ms
- Jitter: 0.1 (10 por cento)
- Padrões por provedor:
  - Atraso mínimo do Telegram: 400 ms
  - Atraso mínimo do Discord: 500 ms

## Comportamento

### Provedores de modelo

- O OpenClaw deixa os SDKs dos provedores lidarem com retries curtos normais.
- Para SDKs baseados em Stainless, como Anthropic e OpenAI, respostas que permitem retry
  (`408`, `409`, `429` e `5xx`) podem incluir `retry-after-ms` ou
  `retry-after`. Quando essa espera é maior que 60 segundos, o OpenClaw injeta
  `x-should-retry: false` para que o SDK exponha o erro imediatamente e o
  failover de modelo possa alternar para outro perfil de autenticação ou modelo de fallback.
- Substitua o limite com `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Defina como `0`, `false`, `off`, `none` ou `disabled` para permitir que os SDKs respeitem internamente esperas longas de `Retry-After`.

### Discord

- Tenta novamente apenas em erros de limite de taxa (HTTP 429).
- Usa `retry_after` do Discord quando disponível; caso contrário, usa backoff exponencial.

### Telegram

- Tenta novamente em erros transitórios (429, timeout, connect/reset/closed, temporarily unavailable).
- Usa `retry_after` quando disponível; caso contrário, usa backoff exponencial.
- Erros de parsing de Markdown não tentam novamente; eles usam fallback para texto simples.

## Configuração

Defina a política de retry por provedor em `~/.openclaw/openclaw.json`:

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

- Retries se aplicam por requisição (envio de mensagem, upload de mídia, reação, enquete, sticker).
- Fluxos compostos não tentam novamente etapas já concluídas.

## Relacionado

- [Failover de modelo](/pt-BR/concepts/model-failover)
- [Fila de comandos](/pt-BR/concepts/queue)
