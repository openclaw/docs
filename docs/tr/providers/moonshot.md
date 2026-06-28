---
read_when:
    - Moonshot K2 (Moonshot Open Platform) ile Kimi Coding kurulumu karşılaştırması
    - Ayrı uç noktaları, anahtarları ve model başvurularını anlamanız gerekir
    - İki sağlayıcıdan biri için kopyala/yapıştır yapılandırması istiyorsunuz
summary: Moonshot K2 ile Kimi Coding'i yapılandırma (ayrı sağlayıcılar + anahtarlar)
title: Moonshot AI
x-i18n:
    generated_at: "2026-06-28T01:11:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7365d7e843275750824a937553dcf535245146fb49fe00c622bf14b71d2dd17
    source_path: providers/moonshot.md
    workflow: 16
---

  Moonshot, OpenAI uyumlu uç noktalarla Kimi API’yi sağlar. Sağlayıcıyı yapılandırın ve varsayılan modeli `moonshot/kimi-k2.6` olarak ayarlayın ya da `kimi/kimi-for-coding` ile Kimi Coding kullanın.

  <Warning>
  Moonshot ve Kimi Coding **ayrı sağlayıcılardır**. Anahtarlar birbirinin yerine kullanılamaz, uç noktalar farklıdır ve model referansları farklıdır (`moonshot/...` ile `kimi/...`).
  </Warning>

  ## Yerleşik model kataloğu

  [//]: # "moonshot-kimi-k2-ids:start"

  | Model ref                         | Ad                     | Akıl yürütme | Girdi       | Bağlam  | Maksimum çıktı |
  | --------------------------------- | ---------------------- | ------------ | ----------- | ------- | -------------- |
  | `moonshot/kimi-k2.6`              | Kimi K2.6              | Hayır        | metin, görsel | 262,144 | 262,144        |
  | `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | Her zaman açık | metin, görsel | 262,144 | 262,144        |
  | `moonshot/kimi-k2.5`              | Kimi K2.5              | Hayır        | metin, görsel | 262,144 | 262,144        |
  | `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Evet         | metin       | 262,144 | 262,144        |
  | `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Evet         | metin       | 262,144 | 262,144        |
  | `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Hayır        | metin       | 256,000 | 16,384         |

  [//]: # "moonshot-kimi-k2-ids:end"

  Mevcut Moonshot barındırmalı K2 modelleri için katalog maliyet tahminleri, Moonshot’ın yayımlanmış kullandıkça öde ücretlerini kullanır: Kimi K2.7 Code önbellek isabeti için $0.19/MTok, girdi için $0.95/MTok ve çıktı için $4.00/MTok; Kimi K2.6 önbellek isabeti için $0.16/MTok, girdi için $0.95/MTok ve çıktı için $4.00/MTok; Kimi K2.5 önbellek isabeti için $0.10/MTok, girdi için $0.60/MTok ve çıktı için $3.00/MTok. Diğer eski katalog girdileri, yapılandırmada geçersiz kılmadığınız sürece sıfır maliyetli yer tutucuları korur.

  Kimi K2.7 Code her zaman yerel düşünmeyi kullanır. OpenClaw, bu model için yalnızca `on` düşünme durumunu sunar ve Moonshot’ın gerektirdiği şekilde dışa giden `thinking` ve `reasoning_effort` denetimlerini atlar. OpenClaw ayrıca K2.7’nin sağlayıcı varsayılanlarına sabitlediği örnekleme geçersiz kılmalarını da atlar. Kimi K2.6, onboarding varsayılanı olarak kalır.

  ## Başlarken

  Sağlayıcınızı seçin ve kurulum adımlarını izleyin.

  <Tabs>
  <Tab title="Moonshot API">
    **En uygun olduğu durum:** Moonshot Open Platform üzerinden Kimi K2 modelleri.

    <Steps>
      <Step title="Uç nokta bölgenizi seçin">
        | Kimlik doğrulama seçimi | Uç nokta                       | Bölge         |
        | ----------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`      | `https://api.moonshot.ai/v1`   | Uluslararası  |
        | `moonshot-api-key-cn`   | `https://api.moonshot.cn/v1`   | Çin           |
      </Step>
      <Step title="Onboarding’i çalıştırın">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Ya da Çin uç noktası için:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Varsayılan model ayarlayın">
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
      <Step title="Modellerin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Canlı smoke test çalıştırın">
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

        JSON yanıtı `provider: "moonshot"` ve `model: "kimi-k2.6"` bildirmelidir. Asistan transkript girdisi, Moonshot kullanım meta verisi döndürdüğünde normalize edilmiş token kullanımını ve tahmini maliyeti `usage.cost` altında saklar.
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
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
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
                id: "kimi-k2.7-code",
                name: "Kimi K2.7 Code",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 },
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
    Resmi plugin’i kurun, ardından Gateway’i yeniden başlatın:

    ```bash
    openclaw plugins install @openclaw/kimi-provider
    openclaw gateway restart
    ```
    **En uygun olduğu durum:** Kimi Coding uç noktası üzerinden kod odaklı görevler.

    <Note>
    Kimi Coding, Moonshot’tan (`moonshot/...`) farklı bir API anahtarı ve sağlayıcı öneki (`kimi/...`) kullanır. Kararlı API model referansı `kimi/kimi-for-coding`’dir; eski referanslar `kimi/kimi-code` ve `kimi/k2p5` kabul edilmeye devam eder ve bu API model kimliğine normalize edilir.
    </Note>

    <Steps>
      <Step title="Plugin'i yükleyin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        ```
      </Step>
      <Step title="İlk kurulumu çalıştırın">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Varsayılan bir model ayarlayın">
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

Moonshot Plugin'i, Moonshot web aramasıyla desteklenen bir `web_search` sağlayıcısı olarak **Kimi**'yi de kaydeder.

<Steps>
  <Step title="Etkileşimli web araması kurulumunu çalıştırın">
    ```bash
    openclaw configure --section web
    ```

    `plugins.entries.moonshot.config.webSearch.*` değerini depolamak için web araması bölümünde
    **Kimi**'yi seçin.

  </Step>
  <Step title="Web araması bölgesini ve modelini yapılandırın">
    Etkileşimli kurulum şunları sorar:

    | Ayar                | Seçenekler                                                           |
    | ------------------- | -------------------------------------------------------------------- |
    | API bölgesi         | `https://api.moonshot.ai/v1` (uluslararası) veya `https://api.moonshot.cn/v1` (Çin) |
    | Web arama modeli    | Varsayılan olarak `kimi-k2.6`                                        |

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
    Kimi K2.7 Code her zaman yerel düşünmeyi kullanır. Moonshot, istemcilerin bu
    model için `thinking` alanını atlamasını gerektirir; bu nedenle OpenClaw yalnızca `on`
    değerini sunar ve eski `off` ayarlarını yok sayar. K2.7 ayrıca `temperature`, `top_p`, `n`,
    `presence_penalty` ve `frequency_penalty` değerlerini sabitler; OpenClaw bu alanlar için yapılandırılmış
    geçersiz kılmaları atlar.

    Diğer Moonshot Kimi modelleri ikili yerel düşünmeyi destekler:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Bunu model başına `agents.defaults.models.<provider/model>.params` üzerinden yapılandırın:

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

    OpenClaw, bu modeller için çalışma zamanı `/think` düzeylerini eşler:

    | `/think` düzeyi     | Moonshot davranışı       |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Off olmayan herhangi bir düzey | `thinking.type=enabled`    |

    <Warning>
    Moonshot düşünme etkinleştirildiğinde, `tool_choice` değeri `auto` veya `none` olmalıdır. OpenClaw uyumsuz değerleri `auto` olarak normalleştirir. Buna, sabitlenmiş bir araç seçimini korumak için düşünme modu devre dışı bırakılamayan Kimi K2.7 Code da dahildir.
    </Warning>

    Kimi K2.6 ayrıca `reasoning_content` için çok turlu saklamayı denetleyen isteğe bağlı bir `thinking.keep` alanını kabul eder. Turlar arasında tam reasoning'i korumak için bunu `"all"` olarak ayarlayın; sunucu varsayılan stratejisini kullanmak için bunu belirtmeyin (veya `null` bırakın). OpenClaw, `thinking.keep` alanını yalnızca `moonshot/kimi-k2.6` için iletir ve diğer modellerden kaldırır. Kimi K2.7 Code, varsayılan olarak tam reasoning geçmişini korurken OpenClaw `thinking` alanının tamamını atlar.

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
    Moonshot Kimi, `functions.<name>:<index>` biçiminde yerel tool_call kimlikleri sunar. OpenAI-completions taşıması için OpenClaw, her yerel Kimi kimliğinin ilk oluşumunu korur ve sonraki yinelenenleri deterministik OpenAI tarzı `call_*` kimliklerine yeniden yazar. Eşleşen araç sonuçları aynı kimlikle yeniden eşlenir; böylece Kimi'nin ilk yerel kimliği kaldırılmadan yeniden oynatma benzersiz kalır.

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
    akış kullanım uyumluluğu bildirir. OpenClaw bunu uç nokta yeteneklerine
    bağlar; bu nedenle aynı yerel Moonshot ana makinelerini hedefleyen uyumlu
    özel sağlayıcı kimlikleri aynı akış kullanım davranışını devralır.

    Katalog K2.6 fiyatlandırmasıyla, giriş, çıkış ve cache-read token'larını
    içeren akış kullanımı ayrıca `/status`, `/usage full`, `/usage cost` ve
    transkript destekli oturum muhasebesi için yerel tahmini USD maliyetine
    dönüştürülür.

  </Accordion>

  <Accordion title="Uç nokta ve model ref başvurusu">
    | Sağlayıcı  | Model ref öneki | Uç nokta                      | Auth env var        |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Kimi Coding uç noktası        | `KIMI_API_KEY`      |
    | Web araması | N/A             | Moonshot API bölgesiyle aynı  | `KIMI_API_KEY` veya `MOONSHOT_API_KEY` |

    - Kimi web araması `KIMI_API_KEY` veya `MOONSHOT_API_KEY` kullanır ve varsayılan olarak `kimi-k2.6` modeliyle `https://api.moonshot.ai/v1` adresini kullanır.
    - Gerekirse fiyatlandırmayı ve bağlam metadata'sını `models.providers` içinde geçersiz kılın.
    - Moonshot bir model için farklı bağlam sınırları yayımlarsa `contextWindow` değerini buna göre ayarlayın.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve failover davranışını seçme.
  </Card>
  <Card title="Web araması" href="/tr/tools/web" icon="magnifying-glass">
    Kimi dahil web araması sağlayıcılarını yapılandırma.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcılar, modeller ve Plugin'ler için tam yapılandırma şeması.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API anahtarı yönetimi ve dokümantasyonu.
  </Card>
</CardGroup>
