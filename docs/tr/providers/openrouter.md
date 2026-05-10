---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - OpenClaw'da modelleri OpenRouter üzerinden çalıştırmak istiyorsunuz
    - Görsel oluşturma için OpenRouter kullanmak istiyorsunuz
    - Video oluşturma için OpenRouter kullanmak istiyorsunuz
summary: OpenClaw'da birçok modele erişmek için OpenRouter'ın birleşik API'sini kullanın
title: OpenRouter
x-i18n:
    generated_at: "2026-05-10T19:53:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5016c522cb2239dadebbfe63459d0e00f43b3dc76aa49cd5b4acfd542b31be71
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter, istekleri tek bir endpoint ve API anahtarı arkasındaki birçok modele yönlendiren **birleşik API** sağlar. OpenAI uyumludur, bu nedenle çoğu OpenAI SDK'sı temel URL değiştirilerek çalışır.

## Başlarken

<Steps>
  <Step title="API anahtarınızı alın">
    [openrouter.ai/keys](https://openrouter.ai/keys) adresinden bir API anahtarı oluşturun.
  </Step>
  <Step title="İlk kurulumu çalıştırın">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(İsteğe bağlı) Belirli bir modele geçin">
    İlk kurulum varsayılan olarak `openrouter/auto` kullanır. Daha sonra somut bir model seçin:

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
Model referansları `openrouter/<provider>/<model>` kalıbını izler. Kullanılabilir sağlayıcıların ve modellerin tam listesi için bkz. [/concepts/model-providers](/tr/concepts/model-providers).
</Note>

Paketle gelen yedek örnekler:

| Model ref                         | Notlar                         |
| --------------------------------- | ------------------------------ |
| `openrouter/auto`                 | OpenRouter otomatik yönlendirme |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI üzerinden Kimi K2.6  |
| `openrouter/moonshotai/kimi-k2.5` | MoonshotAI üzerinden Kimi K2.5  |

## Görüntü oluşturma

OpenRouter, `image_generate` aracını da destekleyebilir. `agents.defaults.imageGenerationModel` altında bir OpenRouter görüntü modeli kullanın:

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

OpenClaw, görüntü isteklerini OpenRouter'ın sohbet tamamlama görüntü API'sine `modalities: ["image", "text"]` ile gönderir. Gemini görüntü modelleri, desteklenen `aspectRatio` ve `resolution` ipuçlarını OpenRouter'ın `image_config` alanı üzerinden alır. Daha yavaş OpenRouter görüntü modelleri için `agents.defaults.imageGenerationModel.timeoutMs` kullanın; `image_generate` aracının çağrı başına `timeoutMs` parametresi yine önceliklidir.

## Video oluşturma

OpenRouter, eşzamansız `/videos` API'si üzerinden `video_generate` aracını da destekleyebilir. `agents.defaults.videoGenerationModel` altında bir OpenRouter video modeli kullanın:

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

OpenClaw, metinden videoya ve görüntüden videoya işleri OpenRouter'a gönderir, döndürülen `polling_url` adresini yoklar ve tamamlanan videoyu OpenRouter'ın `unsigned_urls` alanından veya belgelenmiş iş içerik endpoint'inden indirir. Referans görüntüler varsayılan olarak ilk/son kare görüntüleri olarak gönderilir; `reference_image` ile etiketlenen görüntüler OpenRouter giriş referansları olarak gönderilir. Paketle gelen varsayılan `google/veo-3.1-fast`, şu anda desteklenen 4/6/8 saniye süreleri, `720P`/`1080P` çözünürlükleri ve `16:9`/`9:16` en boy oranlarını bildirir. Üst akış video oluşturma API'si şu anda metin ve görüntü referanslarını kabul ettiği için video-video OpenRouter için kaydedilmemiştir.

## Metinden sese

OpenRouter, OpenAI uyumlu `/audio/speech` endpoint'i üzerinden TTS sağlayıcısı olarak da kullanılabilir.

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

## Kimlik doğrulama ve başlıklar

OpenRouter, altyapıda API anahtarınızla bir Bearer belirteci kullanır.

Gerçek OpenRouter isteklerinde (`https://openrouter.ai/api/v1`), OpenClaw ayrıca OpenRouter'ın belgelenmiş uygulama ilişkilendirme başlıklarını ekler:

| Başlık                    | Değer                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
OpenRouter sağlayıcısını başka bir proxy'ye veya temel URL'ye yönlendirirseniz OpenClaw, bu OpenRouter'a özgü başlıkları veya Anthropic önbellek işaretçilerini **eklemez**.
</Warning>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Yanıt önbelleğe alma">
    OpenRouter yanıt önbelleğe alma isteğe bağlıdır. Bunu OpenRouter modeli başına model parametreleriyle etkinleştirin:

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

    OpenClaw, `X-OpenRouter-Cache: true` ve yapılandırıldığında `X-OpenRouter-Cache-TTL` gönderir. `responseCacheClear: true`, geçerli istek için yenilemeye zorlar ve yerine gelen yanıtı depolar. Snake_case takma adları (`response_cache`, `response_cache_ttl_seconds` ve `response_cache_clear`) da kabul edilir.

    Bu, sağlayıcı istem önbelleğe alma işleminden ve OpenRouter'ın Anthropic `cache_control` işaretçilerinden ayrıdır. Özel proxy temel URL'lerinde değil, yalnızca doğrulanmış `openrouter.ai` rotalarında uygulanır.

  </Accordion>

  <Accordion title="Anthropic önbellek işaretçileri">
    Doğrulanmış OpenRouter rotalarında, Anthropic model referansları OpenClaw'ın sistem/geliştirici istem bloklarında daha iyi istem önbelleği yeniden kullanımı için kullandığı OpenRouter'a özgü Anthropic `cache_control` işaretçilerini korur.
  </Accordion>

  <Accordion title="Anthropic akıl yürütme ön doldurması">
    Doğrulanmış OpenRouter rotalarında, akıl yürütme etkinleştirilmiş Anthropic model referansları, istek OpenRouter'a ulaşmadan önce sondaki asistan ön doldurma dönüşlerini kaldırır; bu, Anthropic'in akıl yürütme konuşmalarının bir kullanıcı dönüşüyle bitmesi gereksinimiyle eşleşir.
  </Accordion>

  <Accordion title="Düşünme / akıl yürütme enjeksiyonu">
    Desteklenen `auto` olmayan rotalarda OpenClaw, seçili düşünme düzeyini OpenRouter proxy akıl yürütme yüklerine eşler. Desteklenmeyen model ipuçları ve `openrouter/auto` bu akıl yürütme enjeksiyonunu atlar. Hunter Alpha, eski yapılandırılmış model referansları için proxy akıl yürütmeyi de atlar; çünkü OpenRouter bu emekliye ayrılmış rota için akıl yürütme alanlarında nihai yanıt metni döndürebilir.
  </Accordion>

  <Accordion title="DeepSeek V4 akıl yürütme yeniden oynatması">
    Doğrulanmış OpenRouter rotalarında, `openrouter/deepseek/deepseek-v4-flash` ve `openrouter/deepseek/deepseek-v4-pro`, yeniden oynatılan asistan dönüşlerinde eksik `reasoning_content` alanını doldurur; böylece düşünme/araç konuşmaları DeepSeek V4'ün gerekli takip biçimini korur. OpenClaw bu rotalar için OpenRouter tarafından desteklenen `reasoning_effort` değerlerini gönderir; `xhigh` ilan edilen en yüksek düzeydir ve eski `max` geçersiz kılmaları `xhigh` değerine eşlenir.
  </Accordion>

  <Accordion title="Yalnızca OpenAI isteği şekillendirme">
    OpenRouter hâlâ proxy tarzı OpenAI uyumlu yol üzerinden çalışır, bu nedenle `serviceTier`, Responses `store`, OpenAI akıl yürütme uyumluluğu yükleri ve istem önbelleği ipuçları gibi yerel yalnızca OpenAI isteği şekillendirmeleri iletilmez.
  </Accordion>

  <Accordion title="Gemini destekli rotalar">
    Gemini destekli OpenRouter referansları proxy-Gemini yolunda kalır: OpenClaw burada Gemini düşünce imzası temizliğini korur, ancak yerel Gemini yeniden oynatma doğrulamasını veya bootstrap yeniden yazmalarını etkinleştirmez.
  </Accordion>

  <Accordion title="Sağlayıcı yönlendirme metadatası">
    Model parametreleri altında OpenRouter sağlayıcı yönlendirmesi geçirirseniz OpenClaw, paylaşılan akış sarmalayıcıları çalışmadan önce bunu OpenRouter yönlendirme metadatası olarak iletir.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration-reference" icon="gear">
    Aracılar, modeller ve sağlayıcılar için tam yapılandırma referansı.
  </Card>
</CardGroup>
