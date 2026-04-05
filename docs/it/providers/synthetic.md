---
read_when:
    - Vuoi usare Synthetic come provider di modelli
    - Hai bisogno di configurare una API key o un base URL Synthetic
summary: Usa l'API compatibile con Anthropic di Synthetic in OpenClaw
title: Synthetic
x-i18n:
    generated_at: "2026-04-05T14:02:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3495bca5cb134659cf6c54e31fa432989afe0cc04f53cf3e3146ce80a5e8af49
    source_path: providers/synthetic.md
    workflow: 15
---

# Synthetic

Synthetic espone endpoint compatibili con Anthropic. OpenClaw lo registra come provider
`synthetic` e usa l'API Anthropic Messages.

## Configurazione rapida

1. Imposta `SYNTHETIC_API_KEY` (oppure esegui la procedura guidata qui sotto).
2. Esegui l'onboarding:

```bash
openclaw onboard --auth-choice synthetic-api-key
```

Il modello predefinito viene impostato su:

```
synthetic/hf:MiniMaxAI/MiniMax-M2.5
```

## Esempio di configurazione

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Nota: il client Anthropic di OpenClaw aggiunge `/v1` al base URL, quindi usa
`https://api.synthetic.new/anthropic` (non `/anthropic/v1`). Se Synthetic cambia
il suo base URL, sostituisci `models.providers.synthetic.baseUrl`.

## Catalogo dei modelli

Tutti i modelli qui sotto usano costo `0` (input/output/cache).

| ID modello                                             | Finestra di contesto | Max token | Reasoning | Input         |
| ------------------------------------------------------ | -------------------- | --------- | --------- | ------------- |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192000               | 65536     | false     | text          |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256000               | 8192      | true      | text          |
| `hf:zai-org/GLM-4.7`                                   | 198000               | 128000    | false     | text          |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128000               | 8192      | false     | text          |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128000               | 8192      | false     | text          |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128000               | 8192      | false     | text          |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128000               | 8192      | false     | text          |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159000               | 8192      | false     | text          |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128000               | 8192      | false     | text          |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524000               | 8192      | false     | text          |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256000               | 8192      | false     | text          |
| `hf:moonshotai/Kimi-K2.5`                              | 256000               | 8192      | true      | text + image  |
| `hf:openai/gpt-oss-120b`                               | 128000               | 8192      | false     | text          |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256000               | 8192      | false     | text          |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256000               | 8192      | false     | text          |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250000               | 8192      | false     | text + image  |
| `hf:zai-org/GLM-4.5`                                   | 128000               | 128000    | false     | text          |
| `hf:zai-org/GLM-4.6`                                   | 198000               | 128000    | false     | text          |
| `hf:zai-org/GLM-5`                                     | 256000               | 128000    | true      | text + image  |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128000               | 8192      | false     | text          |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256000               | 8192      | true      | text          |

## Note

- I model ref usano `synthetic/<modelId>`.
- Se abiliti una allowlist di modelli (`agents.defaults.models`), aggiungi ogni modello che
  prevedi di usare.
- Vedi [Provider di modelli](/concepts/model-providers) per le regole dei provider.
