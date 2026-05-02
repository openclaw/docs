---
read_when:
    - Birçok LLM için tek bir API anahtarı istersiniz
    - OpenClaw'da modelleri OpenRouter üzerinden çalıştırmak istiyorsunuz
    - Görsel oluşturma için OpenRouter kullanmak istiyorsunuz
    - Video oluşturma için OpenRouter kullanmak istiyorsunuz
summary: OpenClaw'da birçok modele erişmek için OpenRouter'ın birleşik API'sini kullanın
title: OpenRouter
x-i18n:
    generated_at: "2026-05-02T20:59:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e98b8b540265b6d11681390c02cb68312f33625bf223823a2dbca17e877c0422
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter, istekleri tek bir endpoint ve API anahtarının arkasındaki birçok modele yönlendiren **birleşik API** sağlar. OpenAI uyumludur, bu nedenle çoğu OpenAI SDK'sı temel URL değiştirilerek çalışır.

## Başlarken

<Steps>
  <Step title="Get your API key">
    [openrouter.ai/keys](https://openrouter.ai/keys) adresinde bir API anahtarı oluşturun.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Optional) Switch to a specific model">
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
Model referansları `openrouter/<provider>/<model>` desenini izler. Kullanılabilir sağlayıcıların ve modellerin tam listesi için [/concepts/model-providers](/tr/concepts/model-providers) bölümüne bakın.
</Note>

Paketlenmiş yedek örnekler:

| Model referansı                  | Notlar                              |
| -------------------------------- | ----------------------------------- |
| `openrouter/auto`                | OpenRouter otomatik yönlendirme     |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI üzerinden Kimi K2.6      |

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

OpenClaw, görüntü isteklerini `modalities: ["image", "text"]` ile OpenRouter'ın sohbet tamamlama görüntü API'sine gönderir. Gemini görüntü modelleri, desteklenen `aspectRatio` ve `resolution` ipuçlarını OpenRouter'ın `image_config` ayarı üzerinden alır. Daha yavaş OpenRouter görüntü modelleri için `agents.defaults.imageGenerationModel.timeoutMs` kullanın; `image_generate` aracının çağrı başına `timeoutMs` parametresi yine de önceliklidir.

## Video oluşturma

OpenRouter, asenkron `/videos` API'si üzerinden `video_generate` aracını da destekleyebilir. `agents.defaults.videoGenerationModel` altında bir OpenRouter video modeli kullanın:

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

OpenClaw, metinden videoya ve görüntüden videoya işleri OpenRouter'a gönderir, döndürülen `polling_url` adresini yoklar ve tamamlanan videoyu OpenRouter'ın `unsigned_urls` değerlerinden veya belgelenmiş iş içeriği endpoint'inden indirir. Referans görüntüler varsayılan olarak ilk/son kare görüntüleri şeklinde gönderilir; `reference_image` ile etiketlenen görüntüler OpenRouter giriş referansları olarak gönderilir. Paketlenmiş `google/veo-3.1-fast` varsayılanı şu anda desteklenen 4/6/8 saniye sürelerini, `720P`/`1080P` çözünürlüklerini ve `16:9`/`9:16` en boy oranlarını duyurur. Üst video oluşturma API'si şu anda metin ve görüntü referanslarını kabul ettiği için OpenRouter için videodan videoya kayıtlı değildir.

## Metinden konuşmaya

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

`messages.tts.providers.openrouter.apiKey` atlanırsa TTS önce `models.providers.openrouter.apiKey` değerini, ardından `OPENROUTER_API_KEY` değerini yeniden kullanır.

## Kimlik doğrulama ve başlıklar

OpenRouter, arka planda API anahtarınızla bir Bearer token kullanır.

Gerçek OpenRouter isteklerinde (`https://openrouter.ai/api/v1`), OpenClaw ayrıca OpenRouter'ın belgelenmiş uygulama atıf başlıklarını ekler:

| Başlık                    | Değer                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
OpenRouter sağlayıcısını başka bir proxy'ye veya temel URL'ye yönlendirirseniz OpenClaw, OpenRouter'a özgü bu başlıkları veya Anthropic önbellek işaretleyicilerini eklemez.
</Warning>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Anthropic cache markers">
    Doğrulanmış OpenRouter rotalarında, Anthropic model referansları, OpenClaw'ın sistem/geliştirici prompt bloklarında daha iyi prompt önbelleği yeniden kullanımı için kullandığı OpenRouter'a özgü Anthropic `cache_control` işaretleyicilerini korur.
  </Accordion>

  <Accordion title="Anthropic reasoning prefill">
    Doğrulanmış OpenRouter rotalarında, muhakeme etkinleştirilmiş Anthropic model referansları, istek OpenRouter'a ulaşmadan önce sondaki asistan ön doldurma dönüşlerini kaldırır; bu, Anthropic'in muhakeme konuşmalarının bir kullanıcı dönüşüyle bitmesi gereksinimiyle eşleşir.
  </Accordion>

  <Accordion title="Thinking / reasoning injection">
    Desteklenen `auto` olmayan rotalarda OpenClaw, seçilen düşünme düzeyini OpenRouter proxy muhakeme yüklerine eşler. Desteklenmeyen model ipuçları ve `openrouter/auto` bu muhakeme enjeksiyonunu atlar. Hunter Alpha da eski yapılandırılmış model referansları için proxy muhakemesini atlar, çünkü OpenRouter bu emekli rota için nihai yanıt metnini muhakeme alanlarında döndürebilir.
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning replay">
    Doğrulanmış OpenRouter rotalarında, `openrouter/deepseek/deepseek-v4-flash` ve `openrouter/deepseek/deepseek-v4-pro`, yeniden oynatılan asistan dönüşlerinde eksik `reasoning_content` değerini doldurur; böylece düşünme/araç konuşmaları DeepSeek V4'ün gerekli takip biçimini korur.
  </Accordion>

  <Accordion title="OpenAI-only request shaping">
    OpenRouter yine de proxy tarzı OpenAI uyumlu yoldan çalışır; bu nedenle `serviceTier`, Responses `store`, OpenAI muhakeme uyumluluk yükleri ve prompt önbelleği ipuçları gibi yalnızca OpenAI'ye özgü istek şekillendirmeleri iletilmez.
  </Accordion>

  <Accordion title="Gemini-backed routes">
    Gemini destekli OpenRouter referansları proxy-Gemini yolunda kalır: OpenClaw burada Gemini düşünce imzası temizliğini korur, ancak yerel Gemini yeniden oynatma doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmez.
  </Accordion>

  <Accordion title="Provider routing metadata">
    Model parametreleri altında OpenRouter sağlayıcı yönlendirmesi geçirirseniz OpenClaw bunu, paylaşılan akış sarmalayıcıları çalışmadan önce OpenRouter yönlendirme meta verisi olarak iletir.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve failover davranışını seçme.
  </Card>
  <Card title="Configuration reference" href="/tr/gateway/configuration-reference" icon="gear">
    Ajanlar, modeller ve sağlayıcılar için tam yapılandırma referansı.
  </Card>
</CardGroup>
