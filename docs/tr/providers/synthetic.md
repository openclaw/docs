---
read_when:
    - Synthetic’i model provider’ı olarak kullanmak istiyorsunuz
    - Synthetic API anahtarına veya base URL kurulumuna ihtiyacınız var
summary: OpenClaw’da Synthetic’in Anthropic uyumlu API’sini kullanın
title: Synthetic
x-i18n:
    generated_at: "2026-04-12T23:33:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c4d2c6635482e09acaf603a75c8a85f0782e42a4a68ef6166f423a48d184ffa
    source_path: providers/synthetic.md
    workflow: 15
---

# Synthetic

[Synthetic](https://synthetic.new), Anthropic uyumlu uç noktalar sunar.
OpenClaw bunu `synthetic` provider’ı olarak kaydeder ve Anthropic
Messages API’sini kullanır.

| Özellik  | Değer                                |
| -------- | ------------------------------------ |
| Provider | `synthetic`                          |
| Kimlik doğrulama | `SYNTHETIC_API_KEY`          |
| API      | Anthropic Messages                   |
| Temel URL | `https://api.synthetic.new/anthropic` |

## Başlarken

<Steps>
  <Step title="Bir API anahtarı alın">
    Synthetic hesabınızdan bir `SYNTHETIC_API_KEY` alın veya
    onboarding sihirbazının sizden bunu istemesine izin verin.
  </Step>
  <Step title="Onboarding'i çalıştırın">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Varsayılan modeli doğrulayın">
    Onboarding sonrasında varsayılan model şuna ayarlanır:
    ```
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
OpenClaw’ın Anthropic istemcisi base URL’ye otomatik olarak `/v1` ekler, bu yüzden
`https://api.synthetic.new/anthropic` kullanın (`/anthropic/v1` değil). Synthetic
base URL’sini değiştirirse `models.providers.synthetic.baseUrl` değerini geçersiz kılın.
</Warning>

## Yapılandırma örneği

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

## Model kataloğu

Tüm Synthetic modelleri `0` maliyet kullanır (girdi/çıktı/cache).

| Model Kimliği                                         | Bağlam penceresi | Maks token | Akıl yürütme | Girdi        |
| ----------------------------------------------------- | ---------------- | ---------- | ------------ | ------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                           | 192,000          | 65,536     | hayır        | text         |
| `hf:moonshotai/Kimi-K2-Thinking`                      | 256,000          | 8,192      | evet         | text         |
| `hf:zai-org/GLM-4.7`                                  | 198,000          | 128,000    | hayır        | text         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                     | 128,000          | 8,192      | hayır        | text         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                     | 128,000          | 8,192      | hayır        | text         |
| `hf:deepseek-ai/DeepSeek-V3.1`                        | 128,000          | 8,192      | hayır        | text         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`               | 128,000          | 8,192      | hayır        | text         |
| `hf:deepseek-ai/DeepSeek-V3.2`                        | 159,000          | 8,192      | hayır        | text         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                | 128,000          | 8,192      | hayır        | text         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8`| 524,000          | 8,192      | hayır        | text         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                 | 256,000          | 8,192      | hayır        | text         |
| `hf:moonshotai/Kimi-K2.5`                             | 256,000          | 8,192      | evet         | text + image |
| `hf:openai/gpt-oss-120b`                              | 128,000          | 8,192      | hayır        | text         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`               | 256,000          | 8,192      | hayır        | text         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`              | 256,000          | 8,192      | hayır        | text         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                 | 250,000          | 8,192      | hayır        | text + image |
| `hf:zai-org/GLM-4.5`                                  | 128,000          | 128,000    | hayır        | text         |
| `hf:zai-org/GLM-4.6`                                  | 198,000          | 128,000    | hayır        | text         |
| `hf:zai-org/GLM-5`                                    | 256,000          | 128,000    | evet         | text + image |
| `hf:deepseek-ai/DeepSeek-V3`                          | 128,000          | 8,192      | hayır        | text         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`               | 256,000          | 8,192      | evet         | text         |

<Tip>
Model başvuruları `synthetic/<modelId>` biçimini kullanır. Hesabınızda kullanılabilen tüm modelleri görmek için
`openclaw models list --provider synthetic` kullanın.
</Tip>

<AccordionGroup>
  <Accordion title="Model izin listesi">
    Bir model izin listesi etkinleştirirseniz (`agents.defaults.models`), kullanmayı planladığınız her
    Synthetic modelini ekleyin. İzin listesinde olmayan modeller ajandan gizlenir.
  </Accordion>

  <Accordion title="Temel URL geçersiz kılma">
    Synthetic API uç noktasını değiştirirse base URL’yi yapılandırmanızda geçersiz kılın:

    ```json5
    {
      models: {
        providers: {
          synthetic: {
            baseUrl: "https://new-api.synthetic.new/anthropic",
          },
        },
      },
    }
    ```

    OpenClaw’ın `/v1` ekini otomatik olarak eklediğini unutmayın.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model provider'ları" href="/tr/concepts/model-providers" icon="layers">
    Provider kuralları, model başvuruları ve failover davranışı.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Provider ayarları dahil tam yapılandırma şeması.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Synthetic panosu ve API belgeleri.
  </Card>
</CardGroup>
