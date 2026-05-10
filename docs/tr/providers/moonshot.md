---
read_when:
    - Moonshot K2 (Moonshot Open Platform) veya Kimi Coding kurulumu istiyorsunuz
    - Ayrı uç noktaları, anahtarları ve model referanslarını anlamanız gerekir
    - İki sağlayıcıdan herhangi biri için kopyala/yapıştır yapılandırması istiyorsunuz
summary: Moonshot K2 ile Kimi Coding'i yapılandırma (ayrı sağlayıcılar + anahtarlar)
title: Moonshot AI
x-i18n:
    generated_at: "2026-05-10T19:52:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6396d91ac8c1f698531ce067f79d4a4de7a5c7a166099c0fe4b7e5b78fde9e
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot, OpenAI uyumlu uç noktalarla Kimi API sağlar. Sağlayıcıyı yapılandırın ve varsayılan modeli `moonshot/kimi-k2.6` olarak ayarlayın ya da `kimi/kimi-for-coding` ile Kimi Coding kullanın.

<Warning>
Moonshot ve Kimi Coding **ayrı sağlayıcılardır**. Anahtarlar birbirinin yerine kullanılamaz, uç noktalar farklıdır ve model referansları farklıdır (`moonshot/...` ve `kimi/...`).
</Warning>

## Yerleşik model kataloğu

[//]: # "moonshot-kimi-k2-ids:start"

| Model referansı                   | Ad                    | Akıl yürütme | Girdi       | Bağlam  | Maks çıkış |
| --------------------------------- | --------------------- | ------------ | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6             | Hayır        | metin, görsel | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5             | Hayır        | metin, görsel | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking      | Evet         | metin       | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Evet        | metin       | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo         | Hayır        | metin       | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

Güncel Moonshot barındırmalı K2 modelleri için paketlenmiş maliyet tahminleri, Moonshot'ın yayımlanmış kullandıkça öde ücretlerini kullanır: Kimi K2.6 için $0.16/MTok önbellek isabeti, $0.95/MTok girdi ve $4.00/MTok çıktı; Kimi K2.5 için $0.10/MTok önbellek isabeti, $0.60/MTok girdi ve $3.00/MTok çıktı. Diğer eski katalog girdileri, yapılandırmada geçersiz kılmadığınız sürece sıfır maliyet yer tutucularını korur.

## Başlarken

Sağlayıcınızı seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Moonshot API">
    **En uygun olduğu kullanım:** Moonshot Open Platform üzerinden Kimi K2 modelleri.

    <Steps>
      <Step title="Choose your endpoint region">
        | Kimlik doğrulama seçimi | Uç nokta                       | Bölge         |
        | ----------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`      | `https://api.moonshot.ai/v1`   | Uluslararası  |
        | `moonshot-api-key-cn`   | `https://api.moonshot.cn/v1`   | Çin           |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Ya da Çin uç noktası için:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Run a live smoke test">
        Normal oturumlarınıza dokunmadan model erişimini ve maliyet takibini doğrulamak istediğinizde yalıtılmış bir durum dizini kullanın:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON yanıtı `provider: "moonshot"` ve `model: "kimi-k2.6"` bildirmelidir. Asistan döküm girdisi, Moonshot kullanım metaverisi döndürdüğünde normalleştirilmiş token kullanımını ve tahmini maliyeti `usage.cost` altında saklar.
      </Step>
    </Steps>

    ### Yapılandırma örneği

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
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
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
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
    **En uygun olduğu kullanım:** Kimi Coding uç noktası üzerinden kod odaklı görevler.

    <Note>
    Kimi Coding, Moonshot'tan (`moonshot/...`) farklı bir API anahtarı ve sağlayıcı öneki (`kimi/...`) kullanır. Kararlı API model referansı `kimi/kimi-for-coding` şeklindedir; eski referanslar `kimi/kimi-code` ve `kimi/k2p5` kabul edilmeye devam eder ve bu API model kimliğine normalleştirilir.
    </Note>

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-for-coding" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
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
          model: { primary: "kimi/kimi-for-coding" },
          models: {
            "kimi/kimi-for-coding": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi web araması

OpenClaw ayrıca Moonshot web araması tarafından desteklenen bir `web_search` sağlayıcısı olarak **Kimi** ile birlikte gelir.

<Steps>
  <Step title="Etkileşimli web araması kurulumunu çalıştır">
    ```bash
    openclaw configure --section web
    ```

    `plugins.entries.moonshot.config.webSearch.*` değerlerini saklamak için
    web araması bölümünde **Kimi** seçeneğini seçin.

  </Step>
  <Step title="Web araması bölgesini ve modelini yapılandır">
    Etkileşimli kurulum şunları sorar:

    | Ayar                | Seçenekler                                                           |
    | ------------------- | -------------------------------------------------------------------- |
    | API bölgesi         | `https://api.moonshot.ai/v1` (uluslararası) veya `https://api.moonshot.cn/v1` (Çin) |
    | Web araması modeli  | Varsayılan olarak `kimi-k2.6` kullanılır                             |

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
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
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

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Yerel düşünme modu">
    Moonshot Kimi ikili yerel düşünmeyi destekler:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Bunu model başına `agents.defaults.models.<provider/model>.params` aracılığıyla yapılandırın:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw ayrıca Moonshot için çalışma zamanı `/think` düzeylerini eşler:

    | `/think` düzeyi      | Moonshot davranışı         |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Off olmayan herhangi bir düzey | `thinking.type=enabled`    |

    <Warning>
    Moonshot düşünme etkinleştirildiğinde, `tool_choice` `auto` veya `none` olmalıdır. OpenClaw, uyumluluk için uyumsuz `tool_choice` değerlerini `auto` olarak normalleştirir.
    </Warning>

    Kimi K2.6 ayrıca `reasoning_content` için çok turlu saklamayı denetleyen
    isteğe bağlı bir `thinking.keep` alanını kabul eder. Turlar arasında tam
    akıl yürütmeyi korumak için bunu `"all"` olarak ayarlayın; sunucu
    varsayılan stratejisini kullanmak için bunu atlayın (veya `null` bırakın).
    OpenClaw, `thinking.keep` alanını yalnızca `moonshot/kimi-k2.6` için iletir
    ve diğer modellerden çıkarır.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Araç çağrısı kimliği temizleme">
    Moonshot Kimi, `functions.<name>:<index>` biçimindeki tool_call kimlikleri sunar. OpenClaw bunları değiştirmeden korur, böylece çok turlu araç çağrıları çalışmaya devam eder.

    Özel bir OpenAI uyumlu sağlayıcıda katı temizlemeyi zorlamak için `sanitizeToolCallIds: true` ayarlayın:

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Akış kullanım uyumluluğu">
    Yerel Moonshot uç noktaları (`https://api.moonshot.ai/v1` ve
    `https://api.moonshot.cn/v1`), paylaşılan `openai-completions` taşımasında
    akış kullanım uyumluluğunu duyurur. OpenClaw bunu uç nokta yeteneklerine göre
    belirler, bu yüzden aynı yerel Moonshot ana bilgisayarlarını hedefleyen uyumlu
    özel sağlayıcı kimlikleri aynı akış kullanım davranışını devralır.

    Paketle gelen K2.6 fiyatlandırmasıyla, giriş, çıkış ve önbellek okuma tokenlarını
    içeren akış kullanımı ayrıca `/status`, `/usage full`, `/usage cost` ve döküm
    destekli oturum muhasebesi için yerel tahmini USD maliyetine dönüştürülür.

  </Accordion>

  <Accordion title="Uç nokta ve model ref başvurusu">
    | Sağlayıcı   | Model ref öneki | Uç nokta                      | Kimlik doğrulama env var        |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Kimi Coding uç noktası          | `KIMI_API_KEY`      |
    | Web arama | N/A              | Moonshot API bölgesiyle aynı   | `KIMI_API_KEY` veya `MOONSHOT_API_KEY` |

    - Kimi web araması `KIMI_API_KEY` veya `MOONSHOT_API_KEY` kullanır ve varsayılan olarak `kimi-k2.6` modeliyle `https://api.moonshot.ai/v1` adresini kullanır.
    - Gerekirse fiyatlandırmayı ve bağlam meta verilerini `models.providers` içinde geçersiz kılın.
    - Moonshot bir model için farklı bağlam limitleri yayımlarsa, `contextWindow` değerini buna göre ayarlayın.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve yük devretme davranışını seçme.
  </Card>
  <Card title="Web arama" href="/tr/tools/web" icon="magnifying-glass">
    Kimi dahil web arama sağlayıcılarını yapılandırma.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcılar, modeller ve plugin'ler için tam config şeması.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API anahtarı yönetimi ve dokümantasyonu.
  </Card>
</CardGroup>
