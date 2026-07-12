---
read_when:
    - Atualização do comportamento ou dos padrões de repetição de tentativas do provedor
    - Depuração de erros de envio do provedor ou limites de taxa
summary: Política de novas tentativas para chamadas de saída ao provedor
title: Política de novas tentativas
x-i18n:
    generated_at: "2026-07-11T23:55:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be2bcb5af829b90042bfcbc5c0e5f5cc5a3cb03dd5472737c80fa0f15803361
    source_path: concepts/retry.md
    workflow: 16
---

## Objetivos

- Repetir por solicitação HTTP, não por fluxo de várias etapas.
- Preservar a ordem repetindo apenas a etapa atual.
- Evitar a duplicação de operações não idempotentes.

## Padrões

| Configuração             | Padrão    |
| ------------------------ | --------- |
| Tentativas               | 3         |
| Limite máximo de espera  | 30000 ms  |
| Jitter                   | 0.1 (10%) |
| Espera mínima do Telegram | 400 ms   |
| Espera mínima do Discord | 500 ms    |

## Comportamento

### Provedores de modelos

- O OpenClaw permite que os SDKs dos provedores tratem as repetições curtas normais.
- Para SDKs baseados no Stainless, como os da Anthropic e da OpenAI, as respostas que permitem repetição (`408`, `409`, `429` e `5xx`) podem incluir `retry-after-ms` ou `retry-after`. Quando essa espera excede 60 segundos, o OpenClaw injeta `x-should-retry: false` para que o SDK apresente o erro imediatamente e o failover de modelo possa alternar para outro perfil de autenticação ou modelo de contingência.
- Substitua o limite com `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`. Defina como `0`, `false`, `off`, `none` ou `disabled` para permitir que os SDKs respeitem internamente esperas longas de `Retry-After`.

### Discord

- Repete em caso de erros de limite de taxa (HTTP 429), tempos limite de solicitação, respostas HTTP 5xx e falhas transitórias de transporte, como falhas de consulta de DNS, redefinições de conexão, fechamentos de socket e falhas de busca.
- Usa o `retry_after` do Discord quando disponível; caso contrário, usa recuo exponencial.

### Telegram

- Repete em caso de erros transitórios (429, tempo limite, conexão/redefinição/fechamento, indisponibilidade temporária).
- Usa `retry_after` quando disponível; caso contrário, usa recuo exponencial.
- Erros de análise de HTML/Markdown não são repetidos; eles usam texto simples como alternativa na primeira tentativa.

## Configuração

Defina a política de repetição por provedor em `~/.openclaw/openclaw.json`:

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

- As repetições se aplicam por solicitação (envio de mensagem, upload de mídia, reação, enquete, figurinha).
- Fluxos compostos não repetem etapas concluídas.

## Relacionado

- [Failover de modelo](/pt-BR/concepts/model-failover)
- [Fila de comandos](/pt-BR/concepts/queue)
