---
read_when:
    - Moonshot K2 (Moonshot Open Platform) ile Kimi Coding kurulumunu karşılaştırmak istiyorsunuz
    - Ayrı uç noktaları, anahtarları ve model referanslarını anlamanız gerekir
    - Her iki sağlayıcı için de kopyalayıp yapıştırabileceğiniz yapılandırma istiyorsunuz
summary: Moonshot K2 ile Kimi Coding'i yapılandırma (ayrı sağlayıcılar + anahtarlar)
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-12T12:43:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot, OpenAI uyumlu uç noktalarla Kimi API'sini sağlar. Moonshot Open Platform için
varsayılan modeli `moonshot/kimi-k2.6`, Kimi Coding içinse
`kimi/kimi-for-coding` olarak ayarlayın.

<Warning>
Moonshot ve Kimi Coding, her biri ayrı bir harici Plugin olarak sunulan **ayrı sağlayıcılardır**. Anahtarlar birbirinin yerine kullanılamaz, uç noktalar farklıdır ve model referansları farklıdır (`moonshot/...` ile `kimi/...`).
</Warning>

## Yerleşik model kataloğu

[//]: # "moonshot-kimi-k2-ids:start"

| Model referansı                    | Ad                     | Akıl yürütme | Girdi       | Bağlam  | Azami çıktı |
| ---------------------------------- | ---------------------- | ------------ | ----------- | ------- | ----------- |
| `moonshot/kimi-k2.6`               | Kimi K2.6              | Hayır        | metin, görsel | 262,144 | 262,144     |
| `moonshot/kimi-k2.7-code`          | Kimi K2.7 Code         | Her zaman açık | metin, görsel | 262,144 | 262,144     |
| `moonshot/kimi-k2.5`               | Kimi K2.5              | Hayır        | metin, görsel | 262,144 | 262,144     |
| `moonshot/kimi-k2-thinking`        | Kimi K2 Thinking       | Evet         | metin       | 262,144 | 262,144     |
| `moonshot/kimi-k2-thinking-turbo`  | Kimi K2 Thinking Turbo | Evet         | metin       | 262,144 | 262,144     |
| `moonshot/kimi-k2-turbo`           | Kimi K2 Turbo          | Hayır        | metin       | 256,000 | 16,384      |

[//]: # "moonshot-kimi-k2-ids:end"

Katalog maliyet tahminlerinde Moonshot'ın yayımladığı kullandıkça öde fiyatları kullanılır: Kimi
K2.7 Code için önbellek isabeti $0.19/MTok, girdi $0.95/MTok, çıktı $4.00/MTok; Kimi
K2.6 için önbellek isabeti $0.16/MTok, girdi $0.95/MTok, çıktı $4.00/MTok; Kimi K2.5
için önbellek isabeti $0.10/MTok, girdi $0.60/MTok, çıktı $3.00/MTok'tur. Diğer katalog
girdileri, yapılandırmada bunları geçersiz kılmadığınız sürece sıfır maliyetli yer tutucuları
korur.

Kimi K2.7 Code her zaman yerel düşünmeyi kullanır. OpenClaw bu model için yalnızca `on`
düşünme durumunu sunar ve Moonshot'ın gerektirdiği şekilde giden `thinking` ile
`reasoning_effort` alanlarını dahil etmez. Ayrıca K2.7'nin sağlayıcı varsayılanlarına
sabitlediği örnekleme geçersiz kılmalarını (`temperature`, `top_p`, `n`, `presence_penalty`,
`frequency_penalty`) da dahil etmez. Kimi K2.6, ilk kurulumun varsayılanı olmaya devam eder.

## Başlarken

Hem Moonshot hem de Kimi Coding harici Plugin'lerdir; ilk kuruluma başlamadan önce
bunlardan birini yükleyin.

<Tabs>
  <Tab title="Moonshot API">
    **En uygun kullanım:** Moonshot Open Platform üzerinden Kimi K2 modelleri.

    <Steps>
      <Step title="Plugin'i yükleyin">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Uç nokta bölgenizi seçin">
        | Kimlik doğrulama seçeneği | Uç nokta                       | Bölge        |
        | ------------------------- | ------------------------------ | ------------ |
        | `moonshot-api-key`        | `https://api.moonshot.ai/v1`   | Uluslararası |
        | `moonshot-api-key-cn`     | `https://api.moonshot.cn/v1`   | Çin          |
      </Step>
      <Step title="İlk kurulumu çalıştırın">
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
      <Step title="Canlı bir temel doğrulama testi çalıştırın">
        Normal oturumlarınıza dokunmadan model erişimini ve maliyet
        takibini doğrulamak istediğinizde yalıtılmış bir durum dizini kullanın:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON yanıtı `provider: "moonshot"` ve
        `model: "kimi-k2.6"` değerlerini bildirmelidir. Moonshot kullanım
        meta verilerini döndürdüğünde asistan transkript girdisi, normalleştirilmiş
        token kullanımını ve tahmini maliyeti `usage.cost` altında saklar.
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
    **En uygun kullanım:** Kimi Coding uç noktası üzerinden kod odaklı görevler.

    <Note>
    Kimi Coding, Moonshot'tan (`moonshot/...`) farklı bir API anahtarı ve sağlayıcı ön eki (`kimi/...`) kullanır. Kararlı model referansı `kimi/kimi-for-coding` şeklindedir; eski `kimi/kimi-code` ve `kimi/k2p5` referansları kabul edilmeye devam eder ve bu model kimliğine normalleştirilir.
    </Note>

    <Steps>
      <Step title="Plugin'i yükleyin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
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

Moonshot Plugin'i ayrıca Moonshot web aramasıyla desteklenen bir `web_search` sağlayıcısı olarak **Kimi**'yi kaydeder.

<Steps>
  <Step title="Etkileşimli web araması kurulumunu çalıştırın">
    ```bash
    openclaw configure --section web
    ```

    `plugins.entries.moonshot.config.webSearch.*` değerini saklamak için
    web araması bölümünde **Kimi**'yi seçin.

  </Step>
  <Step title="Web araması bölgesini ve modelini yapılandırın">
    Etkileşimli kurulum şunları sorar:

    | Ayar                | Seçenekler                                                              |
    | ------------------- | ----------------------------------------------------------------------- |
    | API bölgesi         | `https://api.moonshot.ai/v1` (uluslararası) veya `https://api.moonshot.cn/v1` (Çin) |
    | Web araması modeli  | Varsayılan olarak `kimi-k2.6`                                           |

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
    Kimi K2.7 Code her zaman yerel düşünmeyi kullanır. Moonshot, istemcilerin
    bu model için `thinking` alanını dahil etmemesini gerektirir; bu nedenle OpenClaw yalnızca `on`
    durumunu sunar ve eski `off` ayarlarını yok sayar. K2.7 ayrıca `temperature`, `top_p`, `n`,
    `presence_penalty` ve `frequency_penalty` değerlerini sabitler; OpenClaw bu alanlar için
    yapılandırılmış geçersiz kılmaları dahil etmez.

    Diğer Moonshot Kimi modelleri ikili yerel düşünmeyi destekler:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Bunu her model için `agents.defaults.models.<provider/model>.params` üzerinden yapılandırın:

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

    OpenClaw, bu modeller için çalışma zamanı `/think` düzeylerini şu şekilde eşler:

    | `/think` düzeyi      | Moonshot davranışı        |
    | -------------------- | ------------------------- |
    | `/think off`         | `thinking.type=disabled`  |
    | `off` dışındaki herhangi bir düzey | `thinking.type=enabled` |

    <Warning>
    Moonshot düşünmesi etkinleştirildiğinde `tool_choice`, `auto` veya `none` olmalıdır. Sabitlenmiş bir araç seçimi (`type: "tool"` veya `type: "function"`), istenen aracın yine de çalışması için düşünmeyi bunun yerine tekrar `disabled` durumuna zorlar; `tool_choice: "required"` ise bunun yerine `auto` değerine normalleştirilir. Bu, düşünme modu devre dışı bırakılamayan Kimi K2.7 Code dışındaki tüm Moonshot modelleri için geçerlidir; uyumsuz olduğunda bu modelin `tool_choice` değeri `auto` olarak normalleştirilir.
    </Warning>

    Kimi K2.6 ayrıca, `reasoning_content` öğesinin
    çok turlu saklanmasını denetleyen isteğe bağlı bir `thinking.keep` alanını kabul eder. Turlar arasında
    tüm akıl yürütmeyi korumak için bunu `"all"` olarak ayarlayın; sunucunun
    varsayılan stratejisini kullanmak için alanı belirtmeyin (veya `null` olarak bırakın). OpenClaw, `thinking.keep` alanını yalnızca
    `moonshot/kimi-k2.6` için iletir ve diğer modellerden kaldırır. OpenClaw,
    `thinking` alanının tamamını belirtmezken Kimi K2.7 Code varsayılan olarak
    tam akıl yürütme geçmişini korur.

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
    Moonshot Kimi, `functions.<name>:<index>` biçimindeki yerel tool_call kimliklerini sunar. OpenClaw, her yerel Kimi kimliğinin ilk örneğini korur ve sonraki yinelenenleri belirlenimci, OpenAI tarzı `call_*` kimlikleriyle yeniden yazar. Eşleşen araç sonuçları aynı kimlikle yeniden eşlenir; böylece Kimi'nin ilk yerel kimliği kaldırılmadan yeniden oynatma benzersiz kalır. Bu davranış, paketle birlikte sunulan Moonshot sağlayıcısına bağlıdır ve kullanıcı tarafından yapılandırılabilen bir ayar değildir.
  </Accordion>

  <Accordion title="Akış kullanımı uyumluluğu">
    Yerel Moonshot uç noktaları (`https://api.moonshot.ai/v1` ve
    `https://api.moonshot.cn/v1`) akış kullanımı uyumluluğunu desteklediğini bildirir.
    OpenClaw bunu sağlayıcı kimliğine göre değil, uç nokta ana makinesine göre belirler; dolayısıyla aynı yerel
    Moonshot ana makinesine yönlendirilmiş özel bir sağlayıcı kimliği, aynı
    akış kullanımı davranışını devralır.

    Katalogdaki K2.6 fiyatlandırmasıyla birlikte giriş, çıkış ve önbellekten okuma
    token'larını içeren akış kullanımı; `/status`, `/usage full`, `/usage cost` ve
    transkript destekli oturum muhasebesi için yerel tahmini USD maliyetine de
    dönüştürülür.

  </Accordion>

  <Accordion title="Uç nokta ve model başvurusu referansı">
    | Sağlayıcı   | Model başvurusu öneki | Uç nokta                      | Kimlik doğrulama ortam değişkeni |
    | ---------- | ---------------- | ------------------------------ | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Kimi Coding uç noktası         | `KIMI_API_KEY`      |
    | Web araması | Yok              | Moonshot API bölgesiyle aynı   | `KIMI_API_KEY` veya `MOONSHOT_API_KEY` |

    - Kimi web araması `KIMI_API_KEY` veya `MOONSHOT_API_KEY` kullanır ve varsayılan olarak `kimi-k2.6` modeliyle `https://api.moonshot.ai/v1` uç noktasını kullanır.
    - Gerekirse `models.providers` içinde fiyatlandırmayı ve bağlam meta verilerini geçersiz kılın.
    - Moonshot bir model için farklı bağlam sınırları yayımlarsa `contextWindow` değerini buna göre ayarlayın.

  </Accordion>
</AccordionGroup>

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Web araması" href="/tr/tools/web" icon="magnifying-glass">
    Kimi dâhil web araması sağlayıcılarını yapılandırma.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcılar, modeller ve Plugin'ler için eksiksiz yapılandırma şeması.
  </Card>
  <Card title="Moonshot Açık Platformu" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API anahtarı yönetimi ve belgeleri.
  </Card>
</CardGroup>
