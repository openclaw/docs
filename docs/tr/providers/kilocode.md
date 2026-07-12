---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - OpenClaw'da modelleri Kilo Gateway üzerinden çalıştırmak istiyorsunuz
summary: OpenClaw'da birçok modele erişmek için Kilo Gateway'in birleşik API'sini kullanın
title: Kilo Gateway
x-i18n:
    generated_at: "2026-07-12T12:40:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2108e1bb5b2430f42bf9e798da1d5e40448f05d396ab1710a0d6708961960756
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway, istekleri tek bir OpenAI uyumlu uç nokta ve API anahtarı üzerinden birçok modele yönlendirir.

| Özellik   | Değer                              |
| --------- | ---------------------------------- |
| Sağlayıcı | `kilocode`                         |
| Kimlik doğrulama | `KILOCODE_API_KEY`          |
| API       | OpenAI uyumlu                      |
| Temel URL | `https://api.kilo.ai/api/gateway/` |

## Plugin'i yükleme

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## Kurulum

<Steps>
  <Step title="Hesap oluşturun">
    [app.kilo.ai](https://app.kilo.ai) adresine gidin, oturum açın veya bir hesap oluşturun, ardından bir API anahtarı oluşturun.
  </Step>
  <Step title="İlk katılımı çalıştırın">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Alternatif olarak ortam değişkenini doğrudan ayarlayın:

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

## Varsayılan model ve katalog

Varsayılan model, sağlayıcı tarafından yönetilen akıllı yönlendirme modeli `kilocode/kilo/auto`'dur. OpenClaw bunun için
görevden üst sağlayıcı modele bir eşleme yayımlamaz; `kilo/auto` arkasındaki yönlendirme Kilo Gateway tarafından yönetilir.

OpenClaw başlangıçta `GET https://api.kilo.ai/api/gateway/models` sorgusu yapar ve keşfedilen modelleri
statik bir yedek kataloğun önüne ekleyerek birleştirir. Statik yedek yalnızca `kilocode/kilo/auto` (`Kilo Auto`,
`input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`, `maxTokens: 128000`) içerir.

Gateway üzerindeki her modele `kilocode/<upstream-id>` biçiminde erişilebilir (örneğin
`kilocode/anthropic/claude-sonnet-4`, `kilocode/openai/gpt-5.5`). Keşfedilen listenin tamamını görmek için `/models kilocode` veya
`openclaw models list --provider kilocode` komutunu çalıştırın.

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

## Davranış notları

<AccordionGroup>
  <Accordion title="Aktarım ve uyumluluk">
    Kilo Gateway, OpenRouter uyumludur; bu nedenle yerel OpenAI istek biçimlendirmesi yerine
    proxy tarzı OpenAI uyumlu istek yolunu kullanır (`store` yoktur, OpenAI akıl yürütme eforu yükü yoktur).

    - Gemini destekli Kilo referansları proxy-Gemini yolunda kalır: OpenClaw burada Gemini düşünce
      imzalarını temizler ancak yerel Gemini yeniden yürütme doğrulamasını veya başlangıç yeniden yazımlarını etkinleştirmez.
    - İstekler, API anahtarınızdan oluşturulan bir Bearer belirteci kullanır.

  </Accordion>

  <Accordion title="Akış sarmalayıcısı ve akıl yürütme">
    Kilo akış sarmalayıcısı, isteğe bir `X-KILOCODE-FEATURE` başlığı ekler (varsayılan `openclaw`;
    `KILOCODE_FEATURE` ortam değişkeniyle geçersiz kılınabilir) ve bunu destekleyen modeller için
    akıl yürütme eforu yüklerini normalleştirir.

    <Warning>
    `kilocode/kilo/auto` ve `x-ai/*` referanslarında akıl yürütme eforu ekleme işlemi atlanır. Akıl yürütme desteğine
    ihtiyacınız varsa `kilocode/anthropic/claude-sonnet-4` gibi belirli bir model referansı kullanın.
    </Warning>

  </Accordion>

  <Accordion title="Sorun giderme">
    - Başlangıçta model keşfi başarısız olursa OpenClaw, `kilocode/kilo/auto` içeren statik kataloğa geri döner.
    - API anahtarınızın geçerli olduğunu ve Kilo hesabınızda istediğiniz modellerin etkinleştirildiğini doğrulayın.
    - Gateway bir arka plan hizmeti olarak çalıştığında `KILOCODE_API_KEY` değişkeninin bu işlem tarafından erişilebilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).

  </Accordion>
</AccordionGroup>

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Eksiksiz OpenClaw yapılandırma başvurusu.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway kontrol paneli, API anahtarları ve hesap yönetimi.
  </Card>
</CardGroup>
