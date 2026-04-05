---
read_when:
    - Synthetic'i bir model sağlayıcısı olarak kullanmak istiyorsunuz
    - Bir Synthetic API anahtarına veya base URL kurulumuna ihtiyacınız var
summary: Synthetic'in Anthropic uyumlu API'sini OpenClaw içinde kullanın
title: Synthetic
x-i18n:
    generated_at: "2026-04-05T14:05:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3495bca5cb134659cf6c54e31fa432989afe0cc04f53cf3e3146ce80a5e8af49
    source_path: providers/synthetic.md
    workflow: 15
---

# Synthetic

Synthetic, Anthropic uyumlu endpoint'ler sunar. OpenClaw bunu
`synthetic` sağlayıcısı olarak kaydeder ve Anthropic Messages API'sini kullanır.

## Hızlı kurulum

1. `SYNTHETIC_API_KEY` değerini ayarlayın (veya aşağıdaki sihirbazı çalıştırın).
2. Onboarding'i çalıştırın:

```bash
openclaw onboard --auth-choice synthetic-api-key
```

Varsayılan model şu şekilde ayarlanır:

```
synthetic/hf:MiniMaxAI/MiniMax-M2.5
```

## Config örneği

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

Not: OpenClaw'ın Anthropic istemcisi base URL'ye `/v1` ekler, bu yüzden
`https://api.synthetic.new/anthropic` kullanın (`/anthropic/v1` değil). Synthetic
base URL'sini değiştirirse `models.providers.synthetic.baseUrl` değerini geçersiz kılın.

## Model kataloğu

Aşağıdaki tüm modeller `0` maliyetini kullanır (girdi/çıktı/önbellek).

| Model ID                                               | Bağlam penceresi | Maks. token | Reasoning | Girdi        |
| ------------------------------------------------------ | ---------------- | ----------- | --------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192000           | 65536       | false     | text         |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256000           | 8192        | true      | text         |
| `hf:zai-org/GLM-4.7`                                   | 198000           | 128000      | false     | text         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128000           | 8192        | false     | text         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128000           | 8192        | false     | text         |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128000           | 8192        | false     | text         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128000           | 8192        | false     | text         |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159000           | 8192        | false     | text         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128000           | 8192        | false     | text         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524000           | 8192        | false     | text         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256000           | 8192        | false     | text         |
| `hf:moonshotai/Kimi-K2.5`                              | 256000           | 8192        | true      | text + image |
| `hf:openai/gpt-oss-120b`                               | 128000           | 8192        | false     | text         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256000           | 8192        | false     | text         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256000           | 8192        | false     | text         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250000           | 8192        | false     | text + image |
| `hf:zai-org/GLM-4.5`                                   | 128000           | 128000      | false     | text         |
| `hf:zai-org/GLM-4.6`                                   | 198000           | 128000      | false     | text         |
| `hf:zai-org/GLM-5`                                     | 256000           | 128000      | true      | text + image |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128000           | 8192        | false     | text         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256000           | 8192        | true      | text         |

## Notlar

- Model ref'leri `synthetic/<modelId>` kullanır.
- Bir model allowlist'i etkinleştirirseniz (`agents.defaults.models`), kullanmayı
  planladığınız her modeli ekleyin.
- Sağlayıcı kuralları için bkz. [Model sağlayıcıları](/tr/concepts/model-providers).
