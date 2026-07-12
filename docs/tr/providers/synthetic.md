---
read_when:
    - Synthetic'i bir model sağlayıcısı olarak kullanmak istiyorsunuz
    - Bir Synthetic API anahtarına veya temel URL yapılandırmasına ihtiyacınız var
summary: OpenClaw'da Synthetic'in Anthropic uyumlu API'sini kullanın
title: Sentetik
x-i18n:
    generated_at: "2026-07-12T12:44:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1882a34aa1ca52403b92effdbf3b753fd911575af6d8b8aa5d692245b8e8f1b
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new), Anthropic uyumlu uç noktalar sunar.
OpenClaw, bunu `synthetic` sağlayıcısı olarak paketler ve Anthropic
Messages API'sini kullanır.

| Özellik   | Değer                                 |
| --------- | ------------------------------------- |
| Sağlayıcı | `synthetic`                           |
| Kimlik doğrulama | `SYNTHETIC_API_KEY`           |
| API       | Anthropic Messages                    |
| Temel URL | `https://api.synthetic.new/anthropic` |

## Başlarken

<Steps>
  <Step title="Bir API anahtarı alın">
    Synthetic hesabınızdan bir `SYNTHETIC_API_KEY` alın veya ilk kurulumun
    sizden bir anahtar istemesine izin verin.
  </Step>
  <Step title="İlk kurulumu çalıştırın">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Varsayılan modeli doğrulayın">
    İlk kurulum, varsayılan modeli şu şekilde ayarlar:
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
OpenClaw'ın Anthropic istemcisi, temel URL'ye otomatik olarak `/v1` ekler; bu nedenle
`https://api.synthetic.new/anthropic` adresini kullanın (`/anthropic/v1` değil). Synthetic
temel URL'sini değiştirirse `models.providers.synthetic.baseUrl` değerini geçersiz kılın.
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

## Yerleşik katalog

Tüm Synthetic modellerinin maliyeti `0`'dır (girdi/çıktı/önbellek).

| Model kimliği                                          | Bağlam penceresi | Azami belirteç | Akıl yürütme | Girdi         |
| ------------------------------------------------------ | ---------------- | -------------- | ------------ | ------------- |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000          | 65,536         | hayır        | metin         |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000          | 8,192          | evet         | metin         |
| `hf:zai-org/GLM-4.7`                                   | 198,000          | 128,000        | hayır        | metin         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000          | 8,192          | hayır        | metin         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000          | 8,192          | hayır        | metin         |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000          | 8,192          | hayır        | metin         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000          | 8,192          | hayır        | metin         |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000          | 8,192          | hayır        | metin         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000          | 8,192          | hayır        | metin         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000          | 8,192          | hayır        | metin         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000          | 8,192          | hayır        | metin         |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000          | 8,192          | evet         | metin + görsel |
| `hf:openai/gpt-oss-120b`                               | 128,000          | 8,192          | hayır        | metin         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000          | 8,192          | hayır        | metin         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000          | 8,192          | hayır        | metin         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000          | 8,192          | hayır        | metin + görsel |
| `hf:zai-org/GLM-4.5`                                   | 128,000          | 128,000        | hayır        | metin         |
| `hf:zai-org/GLM-4.6`                                   | 198,000          | 128,000        | hayır        | metin         |
| `hf:zai-org/GLM-5`                                     | 256,000          | 128,000        | evet         | metin + görsel |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000          | 8,192          | hayır        | metin         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000          | 8,192          | evet         | metin         |

<Tip>
Model başvuruları `synthetic/<modelId>` biçimini kullanır. Hesabınızda
kullanılabilen tüm modelleri görmek için `openclaw models list --provider synthetic`
komutunu kullanın.
</Tip>

<AccordionGroup>
  <Accordion title="Model izin listesi">
    Bir model izin listesini (`agents.defaults.models`) etkinleştirirseniz kullanmayı
    planladığınız her Synthetic modelini ekleyin. İzin listesinde bulunmayan modeller
    ajandan gizlenir.
  </Accordion>

  <Accordion title="Temel URL'yi geçersiz kılma">
    Synthetic, API uç noktasını değiştirirse temel URL'yi geçersiz kılın:

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

    OpenClaw yine de `/v1` ekini otomatik olarak ekler.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcı kuralları, model başvuruları ve yük devretme davranışı.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcı ayarlarını içeren eksiksiz yapılandırma şeması.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Synthetic panosu ve API belgeleri.
  </Card>
</CardGroup>
