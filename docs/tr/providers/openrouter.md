---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - OpenClaw içinde modelleri OpenRouter üzerinden çalıştırmak istiyorsunuz
summary: OpenClaw içinde birçok modele erişmek için OpenRouter'ın birleşik API'sini kullanma
title: OpenRouter
x-i18n:
    generated_at: "2026-04-12T23:32:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9083c30b9e9846a9d4ef071c350576d4c3083475f4108871eabbef0b9bb9a368
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter, istekleri tek bir
uç nokta ve API anahtarı arkasında birçok modele yönlendiren **birleşik bir API** sağlar. OpenAI uyumludur, bu yüzden çoğu OpenAI SDK'sı taban URL'si değiştirilerek çalışır.

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

## Model başvuruları

<Note>
Model başvuruları `openrouter/<provider>/<model>` düzenini izler. Kullanılabilir
sağlayıcıların ve modellerin tam listesi için [/concepts/model-providers](/tr/concepts/model-providers) bölümüne bakın.
</Note>

## Kimlik doğrulama ve üst bilgiler

OpenRouter, arka planda API anahtarınızla birlikte bir Bearer token kullanır.

Gerçek OpenRouter isteklerinde (`https://openrouter.ai/api/v1`), OpenClaw ayrıca
OpenRouter'ın belgelenmiş uygulama ilişkilendirme üst bilgilerini de ekler:

| Üst bilgi                 | Değer                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
OpenRouter sağlayıcısını başka bir proxy'ye veya taban URL'ye yönlendirirseniz, OpenClaw
bu OpenRouter'a özgü üst bilgileri veya Anthropic önbellek işaretleyicilerini **eklemez**.
</Warning>

## Gelişmiş notlar

<AccordionGroup>
  <Accordion title="Anthropic önbellek işaretleyicileri">
    Doğrulanmış OpenRouter yollarında, Anthropic model başvuruları
    sistem/geliştirici istem bloklarında daha iyi istem önbelleği yeniden kullanımı için OpenClaw'ın kullandığı
    OpenRouter'a özgü Anthropic `cache_control` işaretleyicilerini korur.
  </Accordion>

  <Accordion title="Thinking / reasoning enjeksiyonu">
    Desteklenen `auto` olmayan yollarda OpenClaw, seçilen düşünme düzeyini
    OpenRouter proxy reasoning yüklerine eşler. Desteklenmeyen model ipuçları ve
    `openrouter/auto`, bu reasoning enjeksiyonunu atlar.
  </Accordion>

  <Accordion title="Yalnızca OpenAI'ye özgü istek şekillendirme">
    OpenRouter yine proxy tarzı OpenAI uyumlu yol üzerinden çalışır; bu nedenle
    `serviceTier`, Responses `store`,
    OpenAI reasoning uyumluluk yükleri ve istem önbelleği ipuçları gibi yalnızca yerel OpenAI'ye özgü istek şekillendirmeleri iletilmez.
  </Accordion>

  <Accordion title="Gemini destekli yollar">
    Gemini destekli OpenRouter başvuruları proxy-Gemini yolunda kalır: OpenClaw burada
    Gemini thought-signature temizliğini korur, ancak yerel Gemini
    yeniden oynatma doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmez.
  </Accordion>

  <Accordion title="Sağlayıcı yönlendirme metadata'sı">
    Model parametreleri altında OpenRouter sağlayıcı yönlendirmesi geçirirseniz, OpenClaw
    paylaşılan akış sarmalayıcıları çalışmadan önce bunu OpenRouter yönlendirme metadata'sı olarak iletir.
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
