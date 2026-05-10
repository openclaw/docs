---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - Modelleri OpenClaw'da Kilo Gateway üzerinden çalıştırmak istiyorsunuz
summary: OpenClaw'da birçok modele erişmek için Kilo Gateway'in birleşik API'sini kullanın
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-10T19:52:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3de2d983a028082d0a897fdafa48ff1f2ad82f3aacec547763159db07adb00a2
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway, istekleri tek bir endpoint ve API anahtarı arkasındaki birçok modele yönlendiren **birleşik API** sağlar. OpenAI uyumludur; bu nedenle çoğu OpenAI SDK'sı, temel URL değiştirilerek çalışır.

| Özellik | Değer                              |
| -------- | ---------------------------------- |
| Sağlayıcı | `kilocode`                         |
| Kimlik doğrulama | `KILOCODE_API_KEY`                 |
| API      | OpenAI uyumlu                  |
| Temel URL | `https://api.kilo.ai/api/gateway/` |

## Başlangıç

<Steps>
  <Step title="Hesap oluşturun">
    [app.kilo.ai](https://app.kilo.ai) adresine gidin, oturum açın veya bir hesap oluşturun, ardından API Keys bölümüne gidip yeni bir anahtar oluşturun.
  </Step>
  <Step title="Onboarding'i çalıştırın">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Veya ortam değişkenini doğrudan ayarlayın:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Varsayılan model

Varsayılan model, Kilo Gateway tarafından yönetilen ve sağlayıcıya ait bir akıllı yönlendirme modeli olan `kilocode/kilo/auto` modelidir.

<Note>
OpenClaw, `kilocode/kilo/auto` değerini kararlı varsayılan referans olarak ele alır, ancak bu rota için kaynak destekli bir görevden üst akış modele eşleme yayımlamaz. `kilocode/kilo/auto` arkasındaki kesin üst akış yönlendirmesi Kilo Gateway'e aittir; OpenClaw içinde sabit kodlanmamıştır.
</Note>

## Yerleşik katalog

OpenClaw, başlangıçta Kilo Gateway üzerinden kullanılabilir modelleri dinamik olarak keşfeder. Hesabınızla kullanılabilen modellerin tam listesini görmek için `/models kilocode` kullanın.

Gateway üzerinde kullanılabilen herhangi bir model, `kilocode/` önekiyle kullanılabilir:

| Model referansı                                | Notlar                              |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | Varsayılan — akıllı yönlendirme            |
| `kilocode/anthropic/claude-sonnet-4`     | Kilo üzerinden Anthropic                 |
| `kilocode/openai/gpt-5.5`                | Kilo üzerinden OpenAI                    |
| `kilocode/google/gemini-3.1-pro-preview` | Kilo üzerinden Google                    |
| ...ve çok daha fazlası                         | Tümünü listelemek için `/models kilocode` kullanın |

<Tip>
Başlangıçta OpenClaw, `GET https://api.kilo.ai/api/gateway/models` sorgusunu yapar ve keşfedilen modelleri statik geri dönüş kataloğunun önüne ekleyerek birleştirir. Paketle gelen geri dönüş kataloğu, `input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000` ve `maxTokens: 128000` ile her zaman `kilocode/kilo/auto` (`Kilo Auto`) içerir.
</Tip>

## Yapılandırma örneği

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Aktarım ve uyumluluk">
    Kilo Gateway kaynakta OpenRouter uyumlu olarak belgelenmiştir; bu nedenle yerel OpenAI istek biçimlendirmesi yerine proxy tarzı OpenAI uyumlu yolda kalır.

    - Gemini destekli Kilo referansları proxy-Gemini yolunda kalır; bu nedenle OpenClaw, yerel Gemini yeniden oynatma doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmeden Gemini düşünce imzası temizliğini orada korur.
    - Kilo Gateway, arka planda API anahtarınızla birlikte Bearer token kullanır.

  </Accordion>

  <Accordion title="Akış sarmalayıcı ve akıl yürütme">
    Kilo'nun paylaşılan akış sarmalayıcısı, sağlayıcı uygulama başlığını ekler ve desteklenen somut model referansları için proxy akıl yürütme yüklerini normalleştirir.

    <Warning>
    `kilocode/kilo/auto` ve proxy akıl yürütmesi desteklenmeyen diğer ipuçları, akıl yürütme enjeksiyonunu atlar. Akıl yürütme desteğine ihtiyacınız varsa `kilocode/anthropic/claude-sonnet-4` gibi somut bir model referansı kullanın.
    </Warning>

  </Accordion>

  <Accordion title="Sorun giderme">
    - Başlangıçta model keşfi başarısız olursa OpenClaw, `kilocode/kilo/auto` içeren paketli statik kataloğa geri döner.
    - API anahtarınızın geçerli olduğunu ve Kilo hesabınızda istediğiniz modellerin etkinleştirildiğini doğrulayın.
    - Gateway bir daemon olarak çalıştığında, `KILOCODE_API_KEY` değerinin bu işlem tarafından kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Tam OpenClaw yapılandırma başvurusu.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway panosu, API anahtarları ve hesap yönetimi.
  </Card>
</CardGroup>
