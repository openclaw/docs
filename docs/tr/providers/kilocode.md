---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - Modelleri OpenClaw’da Kilo Gateway üzerinden çalıştırmak istiyorsunuz
summary: OpenClaw’da birçok modele erişmek için Kilo Gateway’nin birleşik API’sini kullanın
title: Kilocode
x-i18n:
    generated_at: "2026-04-12T23:31:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32946f2187f3933115341cbe81006718b10583abc4deea7440b5e56366025f4a
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway, istekleri tek bir uç nokta ve API anahtarı arkasında birçok modele yönlendiren **birleşik bir API** sağlar. OpenAI uyumludur, bu nedenle çoğu OpenAI SDK’si yalnızca base URL değiştirilerek çalışır.

| Özellik  | Değer                            |
| -------- | -------------------------------- |
| Provider | `kilocode`                       |
| Kimlik doğrulama | `KILOCODE_API_KEY`       |
| API      | OpenAI uyumlu                    |
| Temel URL | `https://api.kilo.ai/api/gateway/` |

## Başlarken

<Steps>
  <Step title="Bir hesap oluşturun">
    [app.kilo.ai](https://app.kilo.ai) adresine gidin, oturum açın veya bir hesap oluşturun, ardından API Keys bölümüne gidip yeni bir anahtar oluşturun.
  </Step>
  <Step title="Onboarding'i çalıştırın">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Ya da ortam değişkenini doğrudan ayarlayın:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Modelin kullanılabildiğini doğrulayın">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Varsayılan model

Varsayılan model, Kilo Gateway tarafından yönetilen provider sahipli akıllı yönlendirme modeli olan `kilocode/kilo/auto` modelidir.

<Note>
OpenClaw, `kilocode/kilo/auto` değerini kararlı varsayılan başvuru olarak ele alır, ancak bu rota için göreve göre yukarı akış model eşlemesini kaynak destekli olarak yayımlamaz. `kilocode/kilo/auto` arkasındaki tam yukarı akış yönlendirmesi OpenClaw içinde sabit kodlanmış değildir; Kilo Gateway’e aittir.
</Note>

## Kullanılabilir modeller

OpenClaw, başlangıçta kullanılabilir modelleri Kilo Gateway’den dinamik olarak keşfeder. Hesabınızla kullanılabilen modellerin tam listesini görmek için
`/models kilocode` kullanın.

Gateway’de kullanılabilen herhangi bir model, `kilocode/` önekiyle kullanılabilir:

| Model başvurusu                        | Notlar                           |
| -------------------------------------- | -------------------------------- |
| `kilocode/kilo/auto`                   | Varsayılan — akıllı yönlendirme  |
| `kilocode/anthropic/claude-sonnet-4`   | Kilo üzerinden Anthropic         |
| `kilocode/openai/gpt-5.4`              | Kilo üzerinden OpenAI            |
| `kilocode/google/gemini-3-pro-preview` | Kilo üzerinden Google            |
| ...ve daha fazlası                     | Tümünü listelemek için `/models kilocode` kullanın |

<Tip>
Başlangıçta OpenClaw, `GET https://api.kilo.ai/api/gateway/models` sorgusu yapar ve keşfedilen modelleri statik yedek katalogdan önce birleştirir. Paketli yedek her zaman `input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000` ve `maxTokens: 128000` ile `kilocode/kilo/auto` (`Kilo Auto`) içerir.
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
    Kilo Gateway, kaynakta OpenRouter uyumlu olarak belgelenmiştir; bu nedenle yerel OpenAI istek şekillendirmesi yerine proxy tarzı OpenAI uyumlu yolda kalır.

    - Gemini destekli Kilo başvuruları proxy-Gemini yolunda kalır; bu nedenle OpenClaw, yerel Gemini yeniden oynatma doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmeden Gemini düşünce imzası temizlemeyi burada sürdürür.
    - Kilo Gateway arka planda API anahtarınızla bir Bearer token kullanır.

  </Accordion>

  <Accordion title="Akış sarmalayıcısı ve akıl yürütme">
    Kilo’nun paylaşılan akış sarmalayıcısı provider uygulama üst bilgisini ekler ve desteklenen somut model başvuruları için proxy akıl yürütme payload’larını normalize eder.

    <Warning>
    `kilocode/kilo/auto` ve proxy akıl yürütmeyi desteklemeyen diğer ipuçları akıl yürütme eklemeyi atlar. Akıl yürütme desteğine ihtiyacınız varsa `kilocode/anthropic/claude-sonnet-4` gibi somut bir model başvurusu kullanın.
    </Warning>

  </Accordion>

  <Accordion title="Sorun giderme">
    - Başlangıçta model keşfi başarısız olursa OpenClaw, `kilocode/kilo/auto` içeren paketli statik kataloğa geri döner.
    - API anahtarınızın geçerli olduğunu ve Kilo hesabınızda istenen modellerin etkin olduğunu doğrulayın.
    - Gateway bir daemon olarak çalışıyorsa `KILOCODE_API_KEY` değerinin bu süreç için kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya `env.shellEnv` üzerinden).
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Provider’ları, model başvurularını ve failover davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration" icon="gear">
    OpenClaw için tam yapılandırma başvurusu.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway panosu, API anahtarları ve hesap yönetimi.
  </Card>
</CardGroup>
