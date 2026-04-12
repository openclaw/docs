---
read_when:
    - Moonshot K2 (Moonshot Open Platform) ile Kimi Coding kurulumu istiyorsunuz
    - Ayrı uç noktaları, anahtarları ve model başvurularını anlamanız gerekiyor
    - Her iki sağlayıcı için de kopyala/yapıştır yapılandırma istiyorsunuz
summary: Moonshot K2 ile Kimi Coding'i yapılandırın (ayrı sağlayıcılar + anahtarlar)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-12T23:31:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f261f83a9b37e4fffb0cd0803e0c64f27eae8bae91b91d8a781a030663076f8
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot, OpenAI uyumlu uç noktalarla Kimi API'sini sağlar. Sağlayıcıyı yapılandırın
ve varsayılan modeli `moonshot/kimi-k2.5` olarak ayarlayın veya
`kimi/kimi-code` ile Kimi Coding kullanın.

<Warning>
Moonshot ve Kimi Coding **ayrı sağlayıcılardır**. Anahtarlar birbirinin yerine kullanılamaz, uç noktalar farklıdır ve model başvuruları farklıdır (`moonshot/...` ile `kimi/...`).
</Warning>

## Yerleşik model kataloğu

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | Ad                     | Akıl yürütme | Girdi       | Bağlam  | Maksimum çıktı |
| --------------------------------- | ---------------------- | ------------ | ----------- | ------- | -------------- |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Hayır        | text, image | 262,144 | 262,144        |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Evet         | text        | 262,144 | 262,144        |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Evet         | text        | 262,144 | 262,144        |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Hayır        | text        | 256,000 | 16,384         |

[//]: # "moonshot-kimi-k2-ids:end"

## Başlangıç

Sağlayıcınızı seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Moonshot API">
    **Şunun için en iyisi:** Moonshot Open Platform üzerinden Kimi K2 modelleri.

    <Steps>
      <Step title="Uç nokta bölgenizi seçin">
        | Kimlik doğrulama seçimi | Uç nokta                     | Bölge         |
        | ----------------------- | ---------------------------- | ------------- |
        | `moonshot-api-key`      | `https://api.moonshot.ai/v1` | Uluslararası  |
        | `moonshot-api-key-cn`   | `https://api.moonshot.cn/v1` | Çin           |
      </Step>
      <Step title="Onboarding çalıştırın">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Veya Çin uç noktası için:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Varsayılan bir model ayarlayın">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.5" },
            },
          },
        }
        ```
      </Step>
      <Step title="Modellerin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
    </Steps>

    ### Yapılandırma örneği

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.5" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **Şunun için en iyisi:** Kimi Coding uç noktası üzerinden kod odaklı görevler.

    <Note>
    Kimi Coding, Moonshot'tan (`moonshot/...`) farklı bir API anahtarı ve sağlayıcı öneki (`kimi/...`) kullanır. Eski model başvurusu `kimi/k2p5`, uyumluluk kimliği olarak kabul edilmeye devam eder.
    </Note>

    <Steps>
      <Step title="Onboarding çalıştırın">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Varsayılan bir model ayarlayın">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### Yapılandırma örneği

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi web araması

OpenClaw ayrıca Moonshot web araması tarafından desteklenen bir `web_search`
sağlayıcısı olarak **Kimi** sunar.

<Steps>
  <Step title="Etkileşimli web arama kurulumunu çalıştırın">
    ```bash
    openclaw configure --section web
    ```

    Web araması bölümünde **Kimi** seçerek
    `plugins.entries.moonshot.config.webSearch.*` değerlerini depolayın.

  </Step>
  <Step title="Web arama bölgesini ve modelini yapılandırın">
    Etkileşimli kurulum şunları sorar:

    | Ayar              | Seçenekler                                                            |
    | ----------------- | --------------------------------------------------------------------- |
    | API bölgesi       | `https://api.moonshot.ai/v1` (uluslararası) veya `https://api.moonshot.cn/v1` (Çin) |
    | Web arama modeli  | Varsayılan olarak `kimi-k2.5`                                         |

  </Step>
</Steps>

Yapılandırma `plugins.entries.moonshot.config.webSearch` altında bulunur:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // veya KIMI_API_KEY / MOONSHOT_API_KEY kullanın
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.5",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## Gelişmiş

<AccordionGroup>
  <Accordion title="Yerel düşünme modu">
    Moonshot Kimi ikili yerel düşünmeyi destekler:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Bunu `agents.defaults.models.<provider/model>.params` üzerinden model başına yapılandırın:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.5": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw, Moonshot için çalışma zamanı `/think` düzeylerini de eşler:

    | `/think` düzeyi    | Moonshot davranışı         |
    | ------------------ | -------------------------- |
    | `/think off`       | `thinking.type=disabled`   |
    | Off dışındaki her düzey | `thinking.type=enabled` |

    <Warning>
    Moonshot düşünmesi etkinleştirildiğinde `tool_choice` değeri `auto` veya `none` olmalıdır. OpenClaw, uyumluluk için uyumsuz `tool_choice` değerlerini `auto` olarak normalize eder.
    </Warning>

  </Accordion>

  <Accordion title="Akış kullanımı uyumluluğu">
    Yerel Moonshot uç noktaları (`https://api.moonshot.ai/v1` ve
    `https://api.moonshot.cn/v1`), paylaşılan `openai-completions` taşımasında
    akış kullanımı uyumluluğunu duyurur. OpenClaw bunu uç nokta
    yeteneklerine göre anahtarlar, bu nedenle aynı yerel Moonshot ana bilgisayarlarını hedefleyen
    uyumlu özel sağlayıcı kimlikleri aynı akış kullanımı davranışını devralır.
  </Accordion>

  <Accordion title="Uç nokta ve model başvurusu başvurusu">
    | Sağlayıcı    | Model başvurusu öneki | Uç nokta                     | Kimlik doğrulama ortam değişkeni |
    | ------------ | --------------------- | ---------------------------- | -------------------------------- |
    | Moonshot     | `moonshot/`           | `https://api.moonshot.ai/v1` | `MOONSHOT_API_KEY`               |
    | Moonshot CN  | `moonshot/`           | `https://api.moonshot.cn/v1` | `MOONSHOT_API_KEY`               |
    | Kimi Coding  | `kimi/`               | Kimi Coding uç noktası       | `KIMI_API_KEY`                   |
    | Web araması  | N/A                   | Moonshot API bölgesi ile aynı | `KIMI_API_KEY` veya `MOONSHOT_API_KEY` |

    - Kimi web araması `KIMI_API_KEY` veya `MOONSHOT_API_KEY` kullanır ve varsayılan olarak `https://api.moonshot.ai/v1` ile `kimi-k2.5` modelini kullanır.
    - Gerekirse `models.providers` içinde fiyatlandırma ve bağlam meta verilerini geçersiz kılın.
    - Moonshot bir model için farklı bağlam sınırları yayınlarsa `contextWindow` değerini buna göre ayarlayın.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve devralma davranışını seçme.
  </Card>
  <Card title="Web araması" href="/tools/web-search" icon="magnifying-glass">
    Kimi dahil web arama sağlayıcılarını yapılandırma.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcılar, modeller ve Plugin'ler için tam yapılandırma şeması.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API anahtarı yönetimi ve belgeler.
  </Card>
</CardGroup>
