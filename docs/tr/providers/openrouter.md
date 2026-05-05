---
read_when:
    - Birden çok LLM için tek bir API anahtarı istiyorsunuz
    - OpenClaw'da OpenRouter aracılığıyla modeller çalıştırmak istiyorsunuz
    - Görüntü oluşturma için OpenRouter kullanmak istiyorsunuz
    - Video üretimi için OpenRouter kullanmak istiyorsunuz
summary: OpenClaw'da birçok modele erişmek için OpenRouter'ın birleşik API'sini kullanın
title: OpenRouter
x-i18n:
    generated_at: "2026-05-05T01:48:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2876669c6fcc958ac13c19930cd23977b8ec27ae57069d9231932cc13c75244
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter, istekleri tek bir uç nokta ve API anahtarı arkasındaki birçok modele yönlendiren **birleşik API** sağlar. OpenAI uyumludur, bu nedenle çoğu OpenAI SDK'sı temel URL değiştirilerek çalışır.

## Başlarken

<Steps>
  <Step title="API anahtarınızı alın">
    [openrouter.ai/keys](https://openrouter.ai/keys) adresinde bir API anahtarı oluşturun.
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

Paketle birlikte gelen yedek örnekler:

| Model referansı                 | Notlar                                      |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter otomatik yönlendirme |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI üzerinden Kimi K2.6     |

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

OpenClaw, görüntü isteklerini `modalities: ["image", "text"]` ile OpenRouter'ın sohbet tamamlama görüntü API'sine gönderir. Gemini görüntü modelleri, desteklenen `aspectRatio` ve `resolution` ipuçlarını OpenRouter'ın `image_config` değeri üzerinden alır. Daha yavaş OpenRouter görüntü modelleri için `agents.defaults.imageGenerationModel.timeoutMs` kullanın; `image_generate` aracının çağrı başına `timeoutMs` parametresi yine önceliklidir.

## Video oluşturma

OpenRouter, zaman uyumsuz `/videos` API'si üzerinden `video_generate` aracını da destekleyebilir. `agents.defaults.videoGenerationModel` altında bir OpenRouter video modeli kullanın:

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

OpenClaw, metinden videoya ve görüntüden videoya işleri OpenRouter'a gönderir, dönen `polling_url` değerini yoklar ve tamamlanan videoyu OpenRouter'ın `unsigned_urls` değerlerinden veya belgelenmiş iş içeriği uç noktasından indirir. Referans görüntüler varsayılan olarak ilk/son kare görüntüleri olarak gönderilir; `reference_image` ile etiketlenmiş görüntüler OpenRouter giriş referansları olarak gönderilir. Paketle gelen `google/veo-3.1-fast` varsayılanı, şu anda desteklenen 4/6/8 saniyelik süreleri, `720P`/`1080P` çözünürlükleri ve `16:9`/`9:16` en boy oranlarını duyurur. Yukarı akış video oluşturma API'si şu anda metin ve görüntü referanslarını kabul ettiği için video-video OpenRouter için kaydedilmemiştir.

## Metinden konuşmaya

OpenRouter, OpenAI uyumlu `/audio/speech` uç noktası üzerinden bir TTS sağlayıcısı olarak da kullanılabilir.

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

`messages.tts.providers.openrouter.apiKey` atlanırsa TTS, önce `models.providers.openrouter.apiKey` değerini, ardından `OPENROUTER_API_KEY` değerini yeniden kullanır.

## Kimlik doğrulama ve üstbilgiler

OpenRouter, arka planda API anahtarınızla bir Bearer belirteci kullanır.

Gerçek OpenRouter isteklerinde (`https://openrouter.ai/api/v1`), OpenClaw ayrıca OpenRouter'ın belgelenmiş uygulama ilişkilendirme üstbilgilerini ekler:

| Üstbilgi                    | Değer                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
OpenRouter sağlayıcısını başka bir proxy'ye veya temel URL'ye yönlendirirseniz, OpenClaw bu OpenRouter'a özgü üstbilgileri veya Anthropic önbellek işaretleyicilerini **eklemez**.
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

    OpenClaw `X-OpenRouter-Cache: true` ve yapılandırıldığında `X-OpenRouter-Cache-TTL` gönderir. `responseCacheClear: true`, geçerli istek için yenilemeyi zorlar ve yerine gelen yanıtı depolar. Snake_case takma adları (`response_cache`, `response_cache_ttl_seconds` ve `response_cache_clear`) da kabul edilir.

    Bu, sağlayıcı istem önbelleğe almadan ve OpenRouter'ın Anthropic `cache_control` işaretleyicilerinden ayrıdır. Özel proxy temel URL'lerinde değil, yalnızca doğrulanmış `openrouter.ai` rotalarında uygulanır.

  </Accordion>

  <Accordion title="Anthropic önbellek işaretleyicileri">
    Doğrulanmış OpenRouter rotalarında, Anthropic model referansları OpenClaw'ın sistem/geliştirici istem bloklarında daha iyi istem önbelleği yeniden kullanımı için kullandığı OpenRouter'a özgü Anthropic `cache_control` işaretleyicilerini korur.
  </Accordion>

  <Accordion title="Anthropic akıl yürütme ön doldurması">
    Doğrulanmış OpenRouter rotalarında, akıl yürütme etkin Anthropic model referansları, istek OpenRouter'a ulaşmadan önce sondaki asistan ön doldurma dönüşlerini düşürür; bu, Anthropic'in akıl yürütme konuşmalarının bir kullanıcı dönüşüyle bitmesi gereksinimiyle eşleşir.
  </Accordion>

  <Accordion title="Düşünme / akıl yürütme enjeksiyonu">
    Desteklenen `auto` olmayan rotalarda OpenClaw, seçilen düşünme düzeyini OpenRouter proxy akıl yürütme yüklerine eşler. Desteklenmeyen model ipuçları ve `openrouter/auto` bu akıl yürütme enjeksiyonunu atlar. Hunter Alpha da eski yapılandırılmış model referansları için proxy akıl yürütmeyi atlar; çünkü OpenRouter, kullanımdan kaldırılmış bu rota için akıl yürütme alanlarında son yanıt metni döndürebilir.
  </Accordion>

  <Accordion title="DeepSeek V4 akıl yürütme yeniden oynatımı">
    Doğrulanmış OpenRouter rotalarında `openrouter/deepseek/deepseek-v4-flash` ve `openrouter/deepseek/deepseek-v4-pro`, düşünme/araç konuşmalarının DeepSeek V4'ün gerekli takip biçimini koruması için yeniden oynatılan asistan dönüşlerinde eksik `reasoning_content` değerini doldurur. OpenClaw, bu rotalar için OpenRouter tarafından desteklenen `reasoning_effort` değerlerini gönderir; `xhigh` duyurulan en yüksek düzeydir ve eski `max` geçersiz kılmaları `xhigh` değerine eşlenir.
  </Accordion>

  <Accordion title="Yalnızca OpenAI istek şekillendirmesi">
    OpenRouter hâlâ proxy tarzı OpenAI uyumlu yoldan çalışır; bu nedenle `serviceTier`, Responses `store`, OpenAI akıl yürütme uyumluluğu yükleri ve istem önbelleği ipuçları gibi yerel yalnızca OpenAI istek şekillendirmesi iletilmez.
  </Accordion>

  <Accordion title="Gemini destekli rotalar">
    Gemini destekli OpenRouter referansları proxy-Gemini yolunda kalır: OpenClaw burada Gemini düşünce imzası temizliğini korur, ancak yerel Gemini yeniden oynatma doğrulamasını veya önyükleme yeniden yazmalarını etkinleştirmez.
  </Accordion>

  <Accordion title="Sağlayıcı yönlendirme meta verileri">
    Model parametreleri altında OpenRouter sağlayıcı yönlendirmesini geçirirseniz OpenClaw, paylaşılan akış sarmalayıcıları çalışmadan önce bunu OpenRouter yönlendirme meta verileri olarak iletir.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Aracılar, modeller ve sağlayıcılar için tam yapılandırma başvurusu.
  </Card>
</CardGroup>
