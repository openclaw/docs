---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - OpenClaw'da OpenRouter üzerinden modeller çalıştırmak istiyorsunuz
    - Görüntü oluşturma için OpenRouter kullanmak istiyorsunuz
    - OpenRouter'ı video oluşturma için kullanmak istiyorsunuz
summary: OpenClaw'da birçok modele erişmek için OpenRouter'ın birleşik API'sini kullanın
title: OpenRouter
x-i18n:
    generated_at: "2026-04-30T09:41:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 47206ce7279eb8a38f71b5c40d34646ad01df2cac25860b629951f9cec73270f
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter, istekleri tek bir endpoint ve API anahtarının arkasında birçok modele yönlendiren **birleşik bir API** sağlar. OpenAI uyumludur, bu nedenle çoğu OpenAI SDK'sı temel URL değiştirilerek çalışır.

## Başlarken

<Steps>
  <Step title="API anahtarınızı alın">
    [openrouter.ai/keys](https://openrouter.ai/keys) adresinde bir API anahtarı oluşturun.
  </Step>
  <Step title="Onboarding'i çalıştırın">
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
Model referansları `openrouter/<provider>/<model>` kalıbını izler. Kullanılabilir sağlayıcıların ve modellerin tam listesi için bkz. [/concepts/model-providers](/tr/concepts/model-providers).
</Note>

Birlikte gelen yedek örnekleri:

| Model referansı                  | Notlar                            |
| --------------------------------- | --------------------------------- |
| `openrouter/auto`                 | OpenRouter otomatik yönlendirmesi |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI üzerinden Kimi K2.6    |

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

OpenClaw, görüntü isteklerini `modalities: ["image", "text"]` ile OpenRouter'ın sohbet tamamlama görüntü API'sine gönderir. Gemini görüntü modelleri, desteklenen `aspectRatio` ve `resolution` ipuçlarını OpenRouter'ın `image_config` alanı üzerinden alır. Daha yavaş OpenRouter görüntü modelleri için `agents.defaults.imageGenerationModel.timeoutMs` kullanın; `image_generate` aracının çağrı başına `timeoutMs` parametresi yine de önceliklidir.

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

OpenClaw, metinden videoya ve görüntüden videoya işleri OpenRouter'a gönderir, döndürülen `polling_url` değerini yoklar ve tamamlanan videoyu OpenRouter'ın `unsigned_urls` değerlerinden veya belgelenmiş iş içeriği endpoint'inden indirir. Referans görüntüler varsayılan olarak ilk/son kare görüntüleri olarak gönderilir; `reference_image` ile etiketlenen görüntüler OpenRouter giriş referansları olarak gönderilir. Birlikte gelen `google/veo-3.1-fast` varsayılanı, şu anda desteklenen 4/6/8 saniyelik süreleri, `720P`/`1080P` çözünürlükleri ve `16:9`/`9:16` en-boy oranlarını bildirir. Yukarı akış video oluşturma API'si şu anda metin ve görüntü referanslarını kabul ettiği için OpenRouter için videodan videoya kayıtlı değildir.

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

OpenRouter, perde arkasında API anahtarınızla bir Bearer token kullanır.

Gerçek OpenRouter isteklerinde (`https://openrouter.ai/api/v1`), OpenClaw ayrıca OpenRouter'ın belgelenmiş uygulama-atıf başlıklarını ekler:

| Başlık                    | Değer                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
OpenRouter sağlayıcısını başka bir proxy'ye veya temel URL'ye yönlendirirseniz OpenClaw bu OpenRouter'a özgü başlıkları veya Anthropic önbellek işaretleyicilerini **eklemez**.
</Warning>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Anthropic önbellek işaretleyicileri">
    Doğrulanmış OpenRouter rotalarında, Anthropic model referansları OpenClaw'ın system/developer istem bloklarında daha iyi istem önbelleği yeniden kullanımı için kullandığı OpenRouter'a özgü Anthropic `cache_control` işaretleyicilerini korur.
  </Accordion>

  <Accordion title="Düşünme / akıl yürütme enjeksiyonu">
    Desteklenen `auto` dışı rotalarda OpenClaw, seçili düşünme düzeyini OpenRouter proxy akıl yürütme yüklerine eşler. Desteklenmeyen model ipuçları ve `openrouter/auto` bu akıl yürütme enjeksiyonunu atlar. Hunter Alpha da eski yapılandırılmış model referansları için proxy akıl yürütmeyi atlar, çünkü OpenRouter bu emekli rota için akıl yürütme alanlarında nihai yanıt metni döndürebilir.
  </Accordion>

  <Accordion title="Yalnızca OpenAI istek biçimlendirmesi">
    OpenRouter hâlâ proxy tarzı OpenAI uyumlu yoldan çalışır, bu nedenle `serviceTier`, Responses `store`, OpenAI akıl yürütme uyumluluk yükleri ve istem önbelleği ipuçları gibi yerel yalnızca OpenAI istek biçimlendirmesi iletilmez.
  </Accordion>

  <Accordion title="Gemini destekli rotalar">
    Gemini destekli OpenRouter referansları proxy-Gemini yolunda kalır: OpenClaw burada Gemini düşünce imzası temizliğini korur, ancak yerel Gemini yeniden oynatma doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmez.
  </Accordion>

  <Accordion title="Sağlayıcı yönlendirme meta verileri">
    Model parametreleri altında OpenRouter sağlayıcı yönlendirmesi geçirirseniz OpenClaw bunu, paylaşılan akış sarmalayıcıları çalışmadan önce OpenRouter yönlendirme meta verisi olarak iletir.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Agents, modeller ve sağlayıcılar için tam yapılandırma başvurusu.
  </Card>
</CardGroup>
