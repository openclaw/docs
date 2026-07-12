---
read_when:
    - Atualização do comportamento ou dos padrões de novas tentativas do provedor
    - Depuração de erros de envio do provedor ou limites de taxa
summary: Política de novas tentativas para chamadas de saída ao provedor
title: Política de novas tentativas
x-i18n:
    generated_at: "2026-07-12T15:07:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9be2bcb5af829b90042bfcbc5c0e5f5cc5a3cb03dd5472737c80fa0f15803361
    source_path: concepts/retry.md
    workflow: 16
---

## Objetivos

- Tentar novamente por requisição HTTP, não por fluxo de várias etapas.
- Preservar a ordem tentando novamente apenas a etapa atual.
- Evitar a duplicação de operações não idempotentes.

## Padrões

| Configuração            | Padrão    |
| ----------------------- | --------- |
| Tentativas              | 3         |
| Limite máximo de atraso | 30000 ms  |
| Jitter                  | 0.1 (10%) |
| Atraso mín. do Telegram | 400 ms    |
| Atraso mín. do Discord  | 500 ms    |

## Comportamento

### Provedores de modelos

- O OpenClaw permite que os SDKs dos provedores tratem as tentativas curtas normais.
- Para SDKs baseados em Stainless, como Anthropic e OpenAI, respostas que permitem nova tentativa (`408`, `409`, `429` e `5xx`) podem incluir `retry-after-ms` ou `retry-after`. Quando essa espera é superior a 60 segundos, o OpenClaw injeta `x-should-retry: false` para que o SDK retorne o erro imediatamente e o failover de modelo possa alternar para outro perfil de autenticação ou modelo alternativo.
- Substitua o limite com `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`. Defina-o como `0`, `false`, `off`, `none` ou `disabled` para permitir que os SDKs respeitem internamente longas esperas de `Retry-After`.

### Discord

- Tenta novamente em erros de limite de taxa (HTTP 429), tempos limite de requisição, respostas HTTP 5xx e falhas transitórias de transporte, como falhas de consulta DNS, redefinições de conexão, fechamentos de socket e falhas de fetch.
- Usa o `retry_after` do Discord quando disponível; caso contrário, usa recuo exponencial.

### Telegram

- Tenta novamente em erros transitórios (429, tempo limite, conexão/redefinição/fechamento, temporariamente indisponível).
- Usa `retry_after` quando disponível; caso contrário, usa recuo exponencial.
- Erros de análise de HTML/Markdown não são tentados novamente; eles recorrem a texto simples na primeira tentativa.

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

- As novas tentativas se aplicam por requisição (envio de mensagem, upload de mídia, reação, enquete, figurinha).
- Fluxos compostos não tentam novamente etapas concluídas.

## Relacionados

- [Failover de modelo](/pt-BR/concepts/model-failover)
- [Fila de comandos](/pt-BR/concepts/queue)
