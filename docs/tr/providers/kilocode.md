---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - OpenClaw'da modelleri Kilo Gateway aracılığıyla çalıştırmak istiyorsunuz
summary: OpenClaw'da birçok modele erişmek için Kilo Gateway'in birleşik API'sini kullanın
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-06T17:59:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6105f5aafa0a36de2b140909e8dd21234aa8284259367a49c67d7040eaa0a93c
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway, istekleri tek bir uç nokta ve API anahtarı arkasındaki birçok modele yönlendiren **birleşik API** sağlar. OpenAI uyumludur, bu nedenle çoğu OpenAI SDK'sı temel URL değiştirilerek çalışır.

| Özellik | Değer                              |
| -------- | ---------------------------------- |
| Sağlayıcı | `kilocode`                         |
| Kimlik Doğrulama     | `KILOCODE_API_KEY`                 |
| API      | OpenAI uyumlu                  |
| Temel URL | `https://api.kilo.ai/api/gateway/` |

## Başlarken

<Steps>
  <Step title="Hesap oluşturun">
    [app.kilo.ai](https://app.kilo.ai) adresine gidin, oturum açın veya bir hesap oluşturun, ardından API Anahtarları'na gidip yeni bir anahtar oluşturun.
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

Varsayılan model, Kilo Gateway tarafından yönetilen ve sağlayıcıya ait akıllı yönlendirme modeli olan `kilocode/kilo/auto` modelidir.

<Note>
OpenClaw, `kilocode/kilo/auto` değerini kararlı varsayılan başvuru olarak ele alır, ancak bu rota için kaynağa dayalı bir görevden üst akış modeline eşleme yayımlamaz. `kilocode/kilo/auto` arkasındaki tam üst akış yönlendirmesi OpenClaw içinde sabit kodlanmış değildir; Kilo Gateway'e aittir.
</Note>

## Yerleşik katalog

OpenClaw, başlangıçta Kilo Gateway'den kullanılabilir modelleri dinamik olarak keşfeder. Hesabınızla kullanılabilen modellerin tam listesini görmek için `/models kilocode` kullanın.

Gateway üzerinde kullanılabilen herhangi bir model `kilocode/` ön ekiyle kullanılabilir:

| Model ref                              | Notlar                              |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | Varsayılan — akıllı yönlendirme            |
| `kilocode/anthropic/claude-sonnet-4`   | Kilo üzerinden Anthropic                 |
| `kilocode/openai/gpt-5.5`              | Kilo üzerinden OpenAI                    |
| `kilocode/google/gemini-3-pro-preview` | Kilo üzerinden Google                    |
| ...ve çok daha fazlası                       | Tümünü listelemek için `/models kilocode` kullanın |

<Tip>
Başlangıçta OpenClaw, `GET https://api.kilo.ai/api/gateway/models` sorgusu yapar ve keşfedilen modelleri statik yedek kataloğun önüne birleştirir. Paketlenmiş yedek her zaman `input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000` ve `maxTokens: 128000` ile `kilocode/kilo/auto` (`Kilo Auto`) içerir.
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
  <Accordion title="Taşıma ve uyumluluk">
    Kilo Gateway kaynakta OpenRouter uyumlu olarak belgelenmiştir, bu nedenle yerel OpenAI istek şekillendirmesi yerine proxy tarzı OpenAI uyumlu yolda kalır.

    - Gemini destekli Kilo ref'leri proxy-Gemini yolunda kalır, bu nedenle OpenClaw yerel Gemini yeniden oynatma doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmeden Gemini düşünce imzası temizliğini burada korur.
    - Kilo Gateway, arka planda API anahtarınızla bir Bearer belirteci kullanır.

  </Accordion>

  <Accordion title="Akış sarmalayıcı ve reasoning">
    Kilo'nun paylaşılan akış sarmalayıcısı, sağlayıcı uygulama başlığını ekler ve desteklenen somut model ref'leri için proxy reasoning yüklerini normalleştirir.

    <Warning>
    `kilocode/kilo/auto` ve diğer proxy-reasoning-desteklenmeyen ipuçları reasoning enjeksiyonunu atlar. Reasoning desteğine ihtiyacınız varsa `kilocode/anthropic/claude-sonnet-4` gibi somut bir model ref'i kullanın.
    </Warning>

  </Accordion>

  <Accordion title="Sorun giderme">
    - Model keşfi başlangıçta başarısız olursa OpenClaw, `kilocode/kilo/auto` içeren paketlenmiş statik kataloğa geri döner.
    - API anahtarınızın geçerli olduğunu ve Kilo hesabınızda istenen modellerin etkin olduğunu doğrulayın.
    - Gateway bir daemon olarak çalıştığında, `KILOCODE_API_KEY` değerinin bu işlem tarafından kullanılabilir olduğundan emin olun; örneğin `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Tam OpenClaw yapılandırma başvurusu.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway panosu, API anahtarları ve hesap yönetimi.
  </Card>
</CardGroup>
