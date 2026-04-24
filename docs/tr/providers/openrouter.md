---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - OpenClaw içinde OpenRouter üzerinden modeller çalıştırmak istiyorsunuz
    - OpenClaw içinde görüntü oluşturma için OpenRouter kullanmak istiyorsunuz
summary: Birçok modele OpenClaw içinde erişmek için OpenRouter’ın birleşik API’sini kullanın
title: OpenRouter
x-i18n:
    generated_at: "2026-04-24T09:27:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7516910f67a8adfb107d07cadd73c34ddd110422ecb90278025d4d6344937aac
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter, birçok modele tek bir
uç nokta ve API anahtarı arkasından istek yönlendiren **birleşik bir API** sağlar. OpenAI ile uyumludur, bu nedenle çoğu OpenAI SDK’sı temel URL değiştirilerek çalışır.

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

## Model başvuruları

<Note>
Model başvuruları `openrouter/<provider>/<model>` biçimini izler. Kullanılabilir
sağlayıcıların ve modellerin tam listesi için [/concepts/model-providers](/tr/concepts/model-providers) sayfasına bakın.
</Note>

Paketlenmiş yedek örnekler:

| Model başvurusu                       | Notlar                        |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto`                    | OpenRouter otomatik yönlendirme |
| `openrouter/moonshotai/kimi-k2.6`    | MoonshotAI üzerinden Kimi K2.6 |
| `openrouter/openrouter/healer-alpha` | OpenRouter Healer Alpha yolu  |
| `openrouter/openrouter/hunter-alpha` | OpenRouter Hunter Alpha yolu  |

## Görüntü oluşturma

OpenRouter, `image_generate` aracısını da destekleyebilir. `agents.defaults.imageGenerationModel` altında bir OpenRouter görüntü modeli kullanın:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw, görüntü isteklerini OpenRouter’ın chat completions image API’sine `modalities: ["image", "text"]` ile gönderir. Gemini görüntü modelleri, desteklenen `aspectRatio` ve `resolution` ipuçlarını OpenRouter’ın `image_config` alanı üzerinden alır.

## Kimlik doğrulama ve üstbilgiler

OpenRouter arka planda API anahtarınızla bir Bearer token kullanır.

Gerçek OpenRouter isteklerinde (`https://openrouter.ai/api/v1`), OpenClaw ayrıca
OpenRouter’ın belgelenmiş uygulama ilişkilendirme üstbilgilerini de ekler:

| Üstbilgi                  | Değer                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
OpenRouter sağlayıcısını başka bir proxy’ye veya temel URL’ye yönlendirirseniz, OpenClaw
bu OpenRouter’a özgü üstbilgileri veya Anthropic önbellek işaretleyicilerini **eklemez**.
</Warning>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Anthropic önbellek işaretleyicileri">
    Doğrulanmış OpenRouter yollarında, Anthropic model başvuruları,
    sistem/geliştirici istem bloklarında daha iyi istem önbelleği yeniden kullanımı için OpenClaw’un kullandığı
    OpenRouter’a özgü Anthropic `cache_control` işaretleyicilerini korur.
  </Accordion>

  <Accordion title="Thinking / akıl yürütme ekleme">
    Desteklenen `auto` olmayan yollarda OpenClaw, seçilen thinking düzeyini
    OpenRouter proxy akıl yürütme yüklerine eşler. Desteklenmeyen model ipuçları ve
    `openrouter/auto`, bu akıl yürütme eklemesini atlar.
  </Accordion>

  <Accordion title="Yalnızca OpenAI için istek şekillendirme">
    OpenRouter yine proxy tarzı OpenAI uyumlu yol üzerinden çalışır; bu nedenle
    `serviceTier`, Responses `store`,
    OpenAI akıl yürütme uyumluluk yükleri ve istem önbelleği ipuçları gibi yalnızca yerel OpenAI’ye özgü istek şekillendirme öğeleri iletilmez.
  </Accordion>

  <Accordion title="Gemini destekli yollar">
    Gemini destekli OpenRouter başvuruları proxy-Gemini yolu üzerinde kalır: OpenClaw
    burada Gemini düşünce-imzası temizliğini korur, ancak yerel Gemini
    yeniden oynatma doğrulamasını veya önyükleme yeniden yazımlarını etkinleştirmez.
  </Accordion>

  <Accordion title="Sağlayıcı yönlendirme metaverileri">
    Model parametreleri altında OpenRouter sağlayıcı yönlendirmesi geçirirseniz, OpenClaw
    bunu paylaşılan akış sarmalayıcıları çalışmadan önce OpenRouter yönlendirme metaverileri olarak iletir.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Aracılar, modeller ve sağlayıcılar için tam yapılandırma başvurusu.
  </Card>
</CardGroup>
