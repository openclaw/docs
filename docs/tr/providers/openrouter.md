---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - OpenClaw içinde modelleri OpenRouter üzerinden çalıştırmak istiyorsunuz
    - Görüntü oluşturma için OpenRouter kullanmak istiyorsunuz
summary: OpenClaw içinde birçok modele erişmek için OpenRouter'ın birleşik API'sini kullanma
title: OpenRouter
x-i18n:
    generated_at: "2026-04-26T11:39:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5396b0a022746cf3dfc90fa2d0974ffe9798af1ac790e93d13398a9e622eceff
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter, istekleri tek bir uç nokta ve API anahtarı arkasında birçok modele yönlendiren **birleşik bir API** sağlar. OpenAI ile uyumludur, bu nedenle temel URL değiştirilerek çoğu OpenAI SDK'sı çalışır.

## Başlangıç

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
Model ref'leri `openrouter/<provider>/<model>` desenini izler. Kullanılabilir
sağlayıcıların ve modellerin tam listesi için bkz. [/concepts/model-providers](/tr/concepts/model-providers).
</Note>

Paketlenmiş geri dönüş örnekleri:

| Model ref                            | Notlar                         |
| ------------------------------------ | ------------------------------ |
| `openrouter/auto`                    | OpenRouter otomatik yönlendirme |
| `openrouter/moonshotai/kimi-k2.6`    | MoonshotAI üzerinden Kimi K2.6 |
| `openrouter/openrouter/healer-alpha` | OpenRouter Healer Alpha rotası |
| `openrouter/openrouter/hunter-alpha` | OpenRouter Hunter Alpha rotası |

## Görüntü oluşturma

OpenRouter, `image_generate` aracı için de arka uç olabilir. `agents.defaults.imageGenerationModel` altında bir OpenRouter görüntü modeli kullanın:

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

OpenClaw, görüntü isteklerini `modalities: ["image", "text"]` ile OpenRouter'ın chat completions image API'sine gönderir. Gemini görüntü modelleri, OpenRouter'ın `image_config` alanı üzerinden desteklenen `aspectRatio` ve `resolution` ipuçlarını alır. Daha yavaş OpenRouter görüntü modelleri için `agents.defaults.imageGenerationModel.timeoutMs` kullanın; `image_generate` aracının çağrı başına `timeoutMs` parametresi yine önceliklidir.

## Metinden konuşmaya

OpenRouter, OpenAI ile uyumlu
`/audio/speech` uç noktası üzerinden bir TTS sağlayıcısı olarak da kullanılabilir.

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

`messages.tts.providers.openrouter.apiKey` atlanırsa, TTS
`models.providers.openrouter.apiKey`, ardından `OPENROUTER_API_KEY` değerini yeniden kullanır.

## Kimlik doğrulama ve başlıklar

OpenRouter, arka planda API anahtarınızla birlikte bir Bearer token kullanır.

Gerçek OpenRouter isteklerinde (`https://openrouter.ai/api/v1`), OpenClaw ayrıca
OpenRouter'ın belgelenmiş uygulama ilişkilendirme başlıklarını da ekler:

| Başlık                    | Değer                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
OpenRouter sağlayıcısını başka bir proxy'ye veya temel URL'ye yeniden yönlendirirseniz, OpenClaw
bu OpenRouter'a özgü başlıkları veya Anthropic önbellek işaretleyicilerini **eklemez**.
</Warning>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Anthropic önbellek işaretleyicileri">
    Doğrulanmış OpenRouter rotalarında, Anthropic model ref'leri OpenClaw'ın
    sistem/geliştirici istem bloklarında daha iyi prompt-cache yeniden kullanımı
    için kullandığı OpenRouter'a özgü Anthropic `cache_control` işaretleyicilerini korur.
  </Accordion>

  <Accordion title="Düşünme / akıl yürütme ekleme">
    Desteklenen `auto` olmayan rotalarda OpenClaw, seçilen düşünme düzeyini
    OpenRouter proxy akıl yürütme yüklerine eşler. Desteklenmeyen model ipuçları ve
    `openrouter/auto` bu akıl yürütme eklemesini atlar.
  </Accordion>

  <Accordion title="Yalnızca OpenAI istek şekillendirmesi">
    OpenRouter yine proxy tarzı OpenAI uyumlu yol üzerinden çalışır, bu nedenle
    `serviceTier`, Responses `store`,
    OpenAI reasoning-compat yükleri ve prompt-cache ipuçları gibi yalnızca OpenAI'ye özgü doğal istek şekillendirmesi iletilmez.
  </Accordion>

  <Accordion title="Gemini destekli rotalar">
    Gemini destekli OpenRouter ref'leri proxy-Gemini yolunda kalır: OpenClaw
    burada Gemini düşünce-imzası temizliğini sürdürür, ancak doğal Gemini
    replay doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmez.
  </Accordion>

  <Accordion title="Sağlayıcı yönlendirme meta verileri">
    OpenRouter sağlayıcı yönlendirmesini model parametreleri altında iletirseniz, OpenClaw
    bunu paylaşılan akış sarmalayıcıları çalışmadan önce OpenRouter yönlendirme meta verileri olarak iletir.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration-reference" icon="gear">
    Agent'lar, modeller ve sağlayıcılar için tam yapılandırma referansı.
  </Card>
</CardGroup>
