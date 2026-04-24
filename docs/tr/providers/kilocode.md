---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - OpenClaw içinde Kilo Gateway üzerinden modeller çalıştırmak istiyorsunuz
summary: Birçok modele OpenClaw içinde erişmek için Kilo Gateway’in birleşik API’sini kullanın
title: Kilocode
x-i18n:
    generated_at: "2026-04-24T09:26:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa3c29e7b39b1dfb049444c7ef2759555bb3f94479622d58fa2aa8fd6389d01f
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway, birçok modele tek bir
uç nokta ve API anahtarı arkasından istek yönlendiren **birleşik bir API** sağlar. OpenAI ile uyumludur, bu nedenle çoğu OpenAI SDK’sı temel URL değiştirilerek çalışır.

| Özellik | Değer                              |
| -------- | ---------------------------------- |
| Sağlayıcı | `kilocode`                         |
| Kimlik doğrulama | `KILOCODE_API_KEY`                 |
| API      | OpenAI uyumlu                      |
| Base URL | `https://api.kilo.ai/api/gateway/` |

## Başlarken

<Steps>
  <Step title="Bir hesap oluşturun">
    [app.kilo.ai](https://app.kilo.ai) adresine gidin, oturum açın veya bir hesap oluşturun, ardından API Keys bölümüne gidip yeni bir anahtar üretin.
  </Step>
  <Step title="İlk kurulumu çalıştırın">
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

Varsayılan model, Kilo Gateway tarafından yönetilen sağlayıcıya ait akıllı yönlendirme
modeli `kilocode/kilo/auto`’dur.

<Note>
OpenClaw, `kilocode/kilo/auto` modelini kararlı varsayılan başvuru olarak ele alır, ancak bu yol için kaynak destekli bir görevden yukarı akış modele eşleme yayımlamaz. `kilocode/kilo/auto` arkasındaki tam yukarı akış yönlendirmesi OpenClaw içinde sabit kodlanmış değil, Kilo Gateway’e aittir.
</Note>

## Yerleşik katalog

OpenClaw, başlangıçta Kilo Gateway’den kullanılabilir modelleri dinamik olarak keşfeder. Hesabınızla kullanılabilen modellerin tam listesini görmek için
`/models kilocode` kullanın.

Gateway’de kullanılabilen herhangi bir model `kilocode/` önekiyle kullanılabilir:

| Model başvurusu                         | Notlar                             |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | Varsayılan — akıllı yönlendirme    |
| `kilocode/anthropic/claude-sonnet-4`   | Kilo üzerinden Anthropic           |
| `kilocode/openai/gpt-5.5`              | Kilo üzerinden OpenAI              |
| `kilocode/google/gemini-3-pro-preview` | Kilo üzerinden Google              |
| ...ve daha fazlası                     | Tümünü listelemek için `/models kilocode` kullanın |

<Tip>
Başlangıçta OpenClaw, `GET https://api.kilo.ai/api/gateway/models` sorgusu yapar ve
keşfedilen modelleri statik yedek kataloğun önüne birleştirir. Paketlenmiş yedek her zaman
`input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000` ve `maxTokens: 128000` ile
`kilocode/kilo/auto` (`Kilo Auto`) modelini içerir.
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
    Kilo Gateway, kaynakta OpenRouter uyumlu olarak belgelenmiştir, bu nedenle yerel OpenAI istek şekillendirmesi yerine
    proxy tarzı OpenAI uyumlu yol üzerinde kalır.

    - Gemini destekli Kilo başvuruları proxy-Gemini yolu üzerinde kalır, bu nedenle OpenClaw
      yerel Gemini yeniden oynatma doğrulamasını veya önyükleme yeniden yazımlarını etkinleştirmeden
      orada Gemini düşünce-imzası temizliğini korur.
    - Kilo Gateway arka planda API anahtarınızla bir Bearer token kullanır.

  </Accordion>

  <Accordion title="Akış sarmalayıcısı ve akıl yürütme">
    Kilo’nun paylaşılan akış sarmalayıcısı sağlayıcı uygulama üstbilgisini ekler ve
    desteklenen somut model başvuruları için proxy akıl yürütme yüklerini normalleştirir.

    <Warning>
    `kilocode/kilo/auto` ve proxy-akıl yürütmeyi desteklemeyen diğer ipuçları, akıl yürütme
    eklemeyi atlar. Akıl yürütme desteğine ihtiyacınız varsa
    `kilocode/anthropic/claude-sonnet-4` gibi somut bir model başvurusu kullanın.
    </Warning>

  </Accordion>

  <Accordion title="Sorun giderme">
    - Model keşfi başlangıçta başarısız olursa OpenClaw, `kilocode/kilo/auto` içeren paketlenmiş statik kataloğa geri döner.
    - API anahtarınızın geçerli olduğunu ve Kilo hesabınızda istenen modellerin etkin olduğunu doğrulayın.
    - Gateway bir daemon olarak çalışıyorsa, `KILOCODE_API_KEY` değişkeninin bu süreç için kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    OpenClaw için tam yapılandırma başvurusu.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway panosu, API anahtarları ve hesap yönetimi.
  </Card>
</CardGroup>
