---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - OpenClaw’da modelleri Kilo Gateway üzerinden çalıştırmak istiyorsunuz
summary: OpenClaw'da birçok modele erişmek için Kilo Gateway'in birleşik API'sini kullanın
title: Kilocode
x-i18n:
    generated_at: "2026-04-30T09:40:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: c51012b94d4b720795356b67c8482ae7ee0b37d401689e923be0b7732d77c4aa
    source_path: providers/kilocode.md
    workflow: 16
---

# Kilo Gateway

Kilo Gateway, istekleri tek bir uç noktanın ve API anahtarının arkasındaki birçok modele yönlendiren **birleşik bir API** sağlar. OpenAI uyumludur, bu nedenle çoğu OpenAI SDK'sı temel URL değiştirilerek çalışır.

| Özellik | Değer                              |
| -------- | ---------------------------------- |
| Sağlayıcı | `kilocode`                         |
| Kimlik doğrulama | `KILOCODE_API_KEY`                 |
| API      | OpenAI uyumlu                  |
| Temel URL | `https://api.kilo.ai/api/gateway/` |

## Başlarken

<Steps>
  <Step title="Hesap oluşturun">
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
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Varsayılan model

Varsayılan model, Kilo Gateway tarafından yönetilen, sağlayıcıya ait bir akıllı yönlendirme modeli olan `kilocode/kilo/auto` modelidir.

<Note>
OpenClaw, `kilocode/kilo/auto` değerini kararlı varsayılan başvuru olarak ele alır, ancak bu rota için kaynak destekli bir görevden üst modele eşleme yayımlamaz. `kilocode/kilo/auto` arkasındaki kesin üst yönlendirme OpenClaw içinde sabit kodlanmış değildir; Kilo Gateway'e aittir.
</Note>

## Yerleşik katalog

OpenClaw, başlangıçta Kilo Gateway'den kullanılabilir modelleri dinamik olarak keşfeder. Hesabınızla kullanılabilen modellerin tam listesini görmek için `/models kilocode` kullanın.

Gateway üzerinde kullanılabilen herhangi bir model `kilocode/` ön ekiyle kullanılabilir:

| Model başvurusu                        | Notlar                             |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | Varsayılan — akıllı yönlendirme    |
| `kilocode/anthropic/claude-sonnet-4`   | Kilo üzerinden Anthropic           |
| `kilocode/openai/gpt-5.5`              | Kilo üzerinden OpenAI              |
| `kilocode/google/gemini-3-pro-preview` | Kilo üzerinden Google              |
| ...ve çok daha fazlası                 | Tümünü listelemek için `/models kilocode` kullanın |

<Tip>
Başlangıçta OpenClaw, `GET https://api.kilo.ai/api/gateway/models` sorgusu yapar ve keşfedilen modelleri statik yedek katalogdan önce birleştirir. Birlikte gelen yedek katalog her zaman `input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000` ve `maxTokens: 128000` ile `kilocode/kilo/auto` (`Kilo Auto`) içerir.
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

    - Gemini destekli Kilo başvuruları proxy-Gemini yolunda kalır, bu nedenle OpenClaw yerel Gemini yeniden oynatma doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmeden Gemini düşünce imzası temizliğini burada korur.
    - Kilo Gateway, perde arkasında API anahtarınızla bir Bearer belirteci kullanır.

  </Accordion>

  <Accordion title="Akış sarmalayıcısı ve akıl yürütme">
    Kilo'nun paylaşılan akış sarmalayıcısı sağlayıcı uygulama başlığını ekler ve desteklenen somut model başvuruları için proxy akıl yürütme yüklerini normalleştirir.

    <Warning>
    `kilocode/kilo/auto` ve diğer proxy akıl yürütme desteklenmeyen ipuçları akıl yürütme eklemeyi atlar. Akıl yürütme desteğine ihtiyacınız varsa `kilocode/anthropic/claude-sonnet-4` gibi somut bir model başvurusu kullanın.
    </Warning>

  </Accordion>

  <Accordion title="Sorun giderme">
    - Başlangıçta model keşfi başarısız olursa OpenClaw, `kilocode/kilo/auto` içeren birlikte gelen statik kataloğa geri döner.
    - API anahtarınızın geçerli olduğunu ve Kilo hesabınızda istenen modellerin etkinleştirildiğini doğrulayın.
    - Gateway bir daemon olarak çalıştığında, `KILOCODE_API_KEY` değerinin bu işlem için kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya `env.shellEnv` üzerinden).

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Tam OpenClaw yapılandırma başvurusu.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway panosu, API anahtarları ve hesap yönetimi.
  </Card>
</CardGroup>
