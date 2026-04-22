---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - OpenClaw'da modelleri OpenRouter üzerinden çalıştırmak istiyorsunuz
summary: OpenClaw'da birçok modele erişmek için OpenRouter'ın birleşik API'sini kullanın
title: OpenRouter
x-i18n:
    generated_at: "2026-04-22T04:27:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a8d1e6191d98e3f5284ebc77e0b8b855a04f3fbed09786d6125b622333ac807
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter, istekleri tek bir uç nokta ve API anahtarı arkasında birçok modele yönlendiren **birleşik bir API** sağlar. OpenAI uyumludur, bu nedenle çoğu OpenAI SDK'sı base URL değiştirilerek çalışır.

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

## Model başvuruları

<Note>
Model başvuruları `openrouter/<provider>/<model>` kalıbını izler. Kullanılabilir
sağlayıcıların ve modellerin tam listesi için [/concepts/model-providers](/tr/concepts/model-providers) bölümüne bakın.
</Note>

Paketle birlikte gelen geri dönüş örnekleri:

| Model başvurusu                      | Notlar                        |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto`                    | OpenRouter otomatik yönlendirme |
| `openrouter/moonshotai/kimi-k2.6`    | MoonshotAI üzerinden Kimi K2.6 |
| `openrouter/openrouter/healer-alpha` | OpenRouter Healer Alpha rotası |
| `openrouter/openrouter/hunter-alpha` | OpenRouter Hunter Alpha rotası |

## Kimlik doğrulama ve başlıklar

OpenRouter arka planda API anahtarınızla bir Bearer token kullanır.

Gerçek OpenRouter isteklerinde (`https://openrouter.ai/api/v1`), OpenClaw ayrıca
OpenRouter'ın belgelenmiş uygulama atıf başlıklarını ekler:

| Başlık                   | Değer                 |
| ------------------------ | --------------------- |
| `HTTP-Referer`           | `https://openclaw.ai` |
| `X-OpenRouter-Title`     | `OpenClaw`            |
| `X-OpenRouter-Categories`| `cli-agent`           |

<Warning>
OpenRouter sağlayıcısını başka bir proxy'ye veya base URL'ye yeniden yönlendirirseniz, OpenClaw
bu OpenRouter'a özgü başlıkları veya Anthropic önbellek işaretleyicilerini **eklemez**.
</Warning>

## Gelişmiş notlar

<AccordionGroup>
  <Accordion title="Anthropic önbellek işaretleyicileri">
    Doğrulanmış OpenRouter rotalarında Anthropic model başvuruları,
    OpenClaw'un sistem/geliştirici istem bloklarında daha iyi prompt-cache yeniden kullanımı için
    kullandığı OpenRouter'a özgü Anthropic `cache_control` işaretleyicilerini korur.
  </Accordion>

  <Accordion title="Thinking / reasoning ekleme">
    Desteklenen `auto` olmayan rotalarda OpenClaw, seçilen thinking düzeyini
    OpenRouter proxy reasoning payload'larına eşler. Desteklenmeyen model ipuçları ve
    `openrouter/auto`, bu reasoning eklemesini atlar.
  </Accordion>

  <Accordion title="Yalnızca OpenAI'ye özgü istek şekillendirme">
    OpenRouter yine proxy tarzı OpenAI uyumlu yoldan geçtiği için,
    `serviceTier`, Responses `store`,
    OpenAI reasoning-compat payload'ları ve prompt-cache ipuçları gibi yerel yalnızca OpenAI'ye özgü istek şekillendirmeleri iletilmez.
  </Accordion>

  <Accordion title="Gemini tabanlı rotalar">
    Gemini tabanlı OpenRouter başvuruları proxy-Gemini yolunda kalır: OpenClaw burada
    Gemini düşünce imzası temizlemeyi korur, ancak yerel Gemini
    replay doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmez.
  </Accordion>

  <Accordion title="Sağlayıcı yönlendirme meta verisi">
    OpenRouter sağlayıcı yönlendirmesini model parametreleri altında geçirirseniz, OpenClaw
    bunu paylaşılan akış sarmalayıcıları çalışmadan önce OpenRouter yönlendirme meta verisi olarak iletir.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve failover davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Agent'lar, modeller ve sağlayıcılar için tam yapılandırma başvurusu.
  </Card>
</CardGroup>
