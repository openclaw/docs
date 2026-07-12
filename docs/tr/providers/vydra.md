---
read_when:
    - OpenClaw'da Vydra ile medya oluşturmak istiyorsunuz
    - Vydra API anahtarı kurulum kılavuzuna ihtiyacınız var
summary: OpenClaw'da Vydra görsel, video ve konuşma özelliklerini kullanma
title: Vydra
x-i18n:
    generated_at: "2026-07-12T12:42:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e775bdd6f4ec7d1f5189910af450b92d8d6e831c17c338271afee962636ba69f
    source_path: providers/vydra.md
    workflow: 16
---

Paketle birlikte gelen Vydra plugin'i şunları ekler:

- `vydra/grok-imagine` aracılığıyla görüntü oluşturma
- `vydra/veo3` (metinden videoya) ve `vydra/kling` (görüntüden videoya) aracılığıyla video oluşturma
- Vydra'nın ElevenLabs destekli TTS rotası aracılığıyla konuşma sentezi

OpenClaw, üç özelliğin tamamı için aynı `VYDRA_API_KEY` değerini kullanır.

| Özellik                | Değer                                                                     |
| ---------------------- | ------------------------------------------------------------------------- |
| Sağlayıcı kimliği      | `vydra`                                                                   |
| Plugin                 | paketle birlikte gelir, `enabledByDefault: true`                           |
| Kimlik doğrulama ortam değişkeni | `VYDRA_API_KEY`                                                  |
| İlk kurulum bayrağı    | `--auth-choice vydra-api-key`                                             |
| Doğrudan CLI bayrağı   | `--vydra-api-key <key>`                                                   |
| Sözleşmeler            | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| Temel URL              | `https://www.vydra.ai/api/v1` (`www` ana makinesini kullanın)             |

<Warning>
Temel URL olarak `https://www.vydra.ai/api/v1` kullanın. Vydra'nın kök ana makinesi (`https://vydra.ai/api/v1`) şu anda `www` adresine yönlendirilmektedir. Bazı HTTP istemcileri, ana makineler arası bu yönlendirmede `Authorization` başlığını kaldırır; bu da geçerli bir API anahtarının yanıltıcı bir kimlik doğrulama hatasına dönüşmesine neden olur. Paketle birlikte gelen plugin, bunu önlemek için yapılandırılmış tüm `vydra.ai` temel URL'lerini `www.vydra.ai` olarak normalleştirir.
</Warning>

## Kurulum

<Steps>
  <Step title="Etkileşimli ilk kurulumu çalıştırın">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Alternatif olarak ortam değişkenini doğrudan ayarlayın:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Varsayılan bir özellik seçin">
    Aşağıdaki özelliklerden (görüntü, video veya konuşma) birini ya da birkaçını seçin ve eşleşen yapılandırmayı uygulayın.
  </Step>
</Steps>

## Özellikler

<AccordionGroup>
  <Accordion title="Görüntü oluşturma">
    Varsayılan ve paketle birlikte gelen tek görüntü modeli:

    - `vydra/grok-imagine`

    Bunu varsayılan görüntü sağlayıcısı olarak ayarlayın:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    Paketle birlikte gelen destek yalnızca metinden görüntüye dönüştürme içindir ve istek başına en fazla bir görüntü oluşturur. Vydra'nın barındırılan düzenleme rotaları uzak görüntü URL'leri bekler ve paketle birlikte gelen plugin, Vydra'ya özgü bir yükleme köprüsü eklemez.

    <Note>
    Ortak araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Görüntü Oluşturma](/tr/tools/image-generation) bölümüne bakın.
    </Note>

  </Accordion>

  <Accordion title="Video oluşturma">
    Kayıtlı video modelleri:

    - Metinden videoya dönüştürme için `vydra/veo3` (görüntü referansı girdilerini reddeder)
    - Görüntüden videoya dönüştürme için `vydra/kling` (tam olarak bir uzak görüntü URL'si gerektirir)

    Vydra'yı varsayılan video sağlayıcısı olarak ayarlayın:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    Notlar:

    - `vydra/kling`, yerel dosya yüklemelerini en başta reddeder; yalnızca uzak bir görüntü URL'si referansı çalışır.
    - Vydra'nın `kling` HTTP rotası, `image_url` veya `video_url` alanlarından hangisini gerektirdiği konusunda tutarsız davranmıştır; paketle birlikte gelen sağlayıcı, aynı uzak görüntü URL'sini her iki alanda da gönderir.
    - Paketle birlikte gelen plugin ihtiyatlı davranır ve en-boy oranı, çözünürlük, filigran veya oluşturulan ses gibi belgelenmemiş stil ayarlarını iletmez.

    <Note>
    Ortak araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Video Oluşturma](/tr/tools/video-generation) bölümüne bakın.
    </Note>

  </Accordion>

  <Accordion title="Canlı video testleri">
    Sağlayıcıya özgü canlı test kapsamı:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Paketle birlikte gelen Vydra canlı test dosyası şunları kapsar:

    - `vydra/veo3` ile metinden videoya dönüştürme
    - Uzak bir görüntü URL'si kullanarak `vydra/kling` ile görüntüden videoya dönüştürme

    Gerektiğinde uzak görüntü test girdisini geçersiz kılın:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Konuşma sentezi">
    Vydra'yı konuşma sağlayıcısı olarak ayarlayın:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    Varsayılanlar:

    - Model: `elevenlabs/tts`
    - Ses kimliği: `21m00Tcm4TlvDq8ikWAM` ("Rachel")

    Paketle birlikte gelen plugin, doğrulanmış bu tek varsayılan sesi sunar ve MP3 ses dosyaları döndürür.

  </Accordion>
</AccordionGroup>

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Sağlayıcı dizini" href="/tr/providers/index" icon="list">
    Kullanılabilir tüm sağlayıcılara göz atın.
  </Card>
  <Card title="Görüntü oluşturma" href="/tr/tools/image-generation" icon="image">
    Ortak görüntü aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video oluşturma" href="/tr/tools/video-generation" icon="video">
    Ortak video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Aracı varsayılanları ve model yapılandırması.
  </Card>
</CardGroup>
