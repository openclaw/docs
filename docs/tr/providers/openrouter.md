---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - OpenClaw'da OpenRouter üzerinden modeller çalıştırmak istiyorsunuz
    - Görüntü oluşturma için OpenRouter kullanmak istiyorsunuz
    - Video üretimi için OpenRouter'ı kullanmak istiyorsunuz
summary: OpenClaw’da çok sayıda modele erişmek için OpenRouter’ın birleşik API’sini kullanın
title: OpenRouter
x-i18n:
    generated_at: "2026-05-04T07:08:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6b7299408aa0de7530e2248c7fa5dae8c09095e2d20a0e9d12a64cab83966fc
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter, istekleri tek bir endpoint ve API anahtarı arkasındaki birçok modele yönlendiren **birleşik API** sağlar. OpenAI uyumludur, bu nedenle çoğu OpenAI SDK'sı temel URL değiştirilerek çalışır.

## Başlarken

<Steps>
  <Step title="API anahtarınızı alın">
    [openrouter.ai/keys](https://openrouter.ai/keys) adresinde bir API anahtarı oluşturun.
  </Step>
  <Step title="Onboarding çalıştırın">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(İsteğe bağlı) Belirli bir modele geçin">
    Onboarding varsayılan olarak `openrouter/auto` kullanır. Daha sonra somut bir model seçin:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## Yapılandırma örneği

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Model referansları

<Note>
Model referansları `openrouter/<provider>/<model>` kalıbını izler. Kullanılabilir sağlayıcıların ve modellerin tam listesi için [/concepts/model-providers](/tr/concepts/model-providers) bölümüne bakın.
</Note>

Birlikte gelen fallback örnekleri:

| Model referansı                  | Notlar                              |
| --------------------------------- | ----------------------------------- |
| `openrouter/auto`                 | OpenRouter otomatik yönlendirme     |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI üzerinden Kimi K2.6      |

## Görsel oluşturma

OpenRouter, `image_generate` aracını da destekleyebilir. `agents.defaults.imageGenerationModel` altında bir OpenRouter görsel modeli kullanın:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw, görsel isteklerini `modalities: ["image", "text"]` ile OpenRouter'ın sohbet tamamlama görsel API'sine gönderir. Gemini görsel modelleri, desteklenen `aspectRatio` ve `resolution` ipuçlarını OpenRouter'ın `image_config` alanı üzerinden alır. Daha yavaş OpenRouter görsel modelleri için `agents.defaults.imageGenerationModel.timeoutMs` kullanın; `image_generate` aracının çağrı başına `timeoutMs` parametresi yine de önceliklidir.

## Video oluşturma

OpenRouter, asenkron `/videos` API'si aracılığıyla `video_generate` aracını da destekleyebilir. `agents.defaults.videoGenerationModel` altında bir OpenRouter video modeli kullanın:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw, metinden videoya ve görselden videoya işlerini OpenRouter'a gönderir, döndürülen `polling_url` değerini yoklar ve tamamlanan videoyu OpenRouter'ın `unsigned_urls` alanından veya belgelenmiş iş içeriği endpoint'inden indirir. Referans görseller varsayılan olarak ilk/son kare görselleri şeklinde gönderilir; `reference_image` ile etiketlenmiş görseller OpenRouter giriş referansları olarak gönderilir. Birlikte gelen `google/veo-3.1-fast` varsayılanı, şu anda desteklenen 4/6/8 saniye süreleri, `720P`/`1080P` çözünürlükleri ve `16:9`/`9:16` en boy oranlarını bildirir. Video oluşturma API'si şu anda metin ve görsel referanslarını kabul ettiği için video-to-video OpenRouter için kaydedilmez.

## Metinden konuşmaya

OpenRouter, OpenAI uyumlu `/audio/speech` endpoint'i aracılığıyla TTS sağlayıcısı olarak da kullanılabilir.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

`messages.tts.providers.openrouter.apiKey` atlanırsa TTS, `models.providers.openrouter.apiKey` değerini, ardından `OPENROUTER_API_KEY` değerini yeniden kullanır.

## Kimlik doğrulama ve üstbilgiler

OpenRouter, arka planda API anahtarınızla bir Bearer belirteci kullanır.

Gerçek OpenRouter isteklerinde (`https://openrouter.ai/api/v1`), OpenClaw ayrıca OpenRouter'ın belgelenmiş uygulama atıf üstbilgilerini ekler:

| Üstbilgi                 | Değer                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
OpenRouter sağlayıcısını başka bir proxy'ye veya temel URL'ye yönlendirirseniz OpenClaw, bu OpenRouter'a özgü üstbilgileri veya Anthropic cache işaretleyicilerini eklemez.
</Warning>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Yanıt önbelleğe alma">
    OpenRouter yanıt önbelleğe alma isteğe bağlıdır. Bunu model parametreleriyle her OpenRouter modeli için etkinleştirin:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw, `X-OpenRouter-Cache: true` ve yapılandırıldığında `X-OpenRouter-Cache-TTL` gönderir. `responseCacheClear: true`, geçerli istek için yenilemeyi zorlar ve yerine gelen yanıtı depolar. Snake_case alias'ları (`response_cache`, `response_cache_ttl_seconds` ve `response_cache_clear`) da kabul edilir.

    Bu, sağlayıcı prompt önbelleğe almasından ve OpenRouter'ın Anthropic `cache_control` işaretleyicilerinden ayrıdır. Özel proxy temel URL'lerinde değil, yalnızca doğrulanmış `openrouter.ai` rotalarında uygulanır.

  </Accordion>

  <Accordion title="Anthropic cache işaretleyicileri">
    Doğrulanmış OpenRouter rotalarında, Anthropic model referansları OpenClaw'un sistem/geliştirici prompt bloklarında daha iyi prompt-cache yeniden kullanımı için kullandığı OpenRouter'a özgü Anthropic `cache_control` işaretleyicilerini korur.
  </Accordion>

  <Accordion title="Anthropic akıl yürütme ön doldurması">
    Doğrulanmış OpenRouter rotalarında, akıl yürütme etkin Anthropic model referansları, istek OpenRouter'a ulaşmadan önce sondaki assistant ön doldurma dönüşlerini bırakır; bu, Anthropic'in akıl yürütme konuşmalarının bir kullanıcı dönüşüyle bitmesi gerekliliğiyle eşleşir.
  </Accordion>

  <Accordion title="Düşünme / akıl yürütme enjeksiyonu">
    Desteklenen `auto` dışı rotalarda OpenClaw, seçilen düşünme düzeyini OpenRouter proxy akıl yürütme payload'larına eşler. Desteklenmeyen model ipuçları ve `openrouter/auto` bu akıl yürütme enjeksiyonunu atlar. Hunter Alpha ayrıca, eski yapılandırılmış model referansları için proxy akıl yürütmeyi atlar; çünkü OpenRouter, bu emekliye ayrılmış rota için akıl yürütme alanlarında nihai yanıt metni döndürebilir.
  </Accordion>

  <Accordion title="DeepSeek V4 akıl yürütme yeniden oynatması">
    Doğrulanmış OpenRouter rotalarında, `openrouter/deepseek/deepseek-v4-flash` ve `openrouter/deepseek/deepseek-v4-pro`, yeniden oynatılan assistant dönüşlerinde eksik `reasoning_content` alanını doldurur; böylece düşünme/araç konuşmaları DeepSeek V4'ün gerekli takip biçimini korur.
  </Accordion>

  <Accordion title="Yalnızca OpenAI istek şekillendirme">
    OpenRouter hâlâ proxy tarzı OpenAI uyumlu yoldan çalışır; bu nedenle `serviceTier`, Responses `store`, OpenAI akıl yürütme uyumluluk payload'ları ve prompt-cache ipuçları gibi yerel yalnızca OpenAI istek şekillendirmeleri iletilmez.
  </Accordion>

  <Accordion title="Gemini destekli rotalar">
    Gemini destekli OpenRouter referansları proxy-Gemini yolunda kalır: OpenClaw burada Gemini thought-signature temizliğini korur, ancak yerel Gemini yeniden oynatma doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmez.
  </Accordion>

  <Accordion title="Sağlayıcı yönlendirme meta verileri">
    Model parametreleri altında OpenRouter sağlayıcı yönlendirmesi geçirirseniz OpenClaw, paylaşılan stream sarmalayıcıları çalışmadan önce bunu OpenRouter yönlendirme meta verileri olarak iletir.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve failover davranışını seçme.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration-reference" icon="gear">
    Agent'lar, modeller ve sağlayıcılar için tam yapılandırma referansı.
  </Card>
</CardGroup>
