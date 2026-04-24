---
read_when:
    - OpenClaw'da Vydra medya üretimi istiyorsunuz
    - Vydra API anahtarı kurulumu rehberine ihtiyacınız var
summary: OpenClaw'da Vydra görüntü, video ve speech kullanın
title: Vydra
x-i18n:
    generated_at: "2026-04-24T09:28:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85420c3f337c13313bf571d5ee92c1f1988ff8119d401e7ec0ea0db1e74d9b69
    source_path: providers/vydra.md
    workflow: 15
---

Paketlenmiş Vydra Plugin'i şunları ekler:

- `vydra/grok-imagine` üzerinden görüntü üretimi
- `vydra/veo3` ve `vydra/kling` üzerinden video üretimi
- Vydra'nın ElevenLabs destekli TTS yolu üzerinden speech sentezi

OpenClaw bu üç yetenek için de aynı `VYDRA_API_KEY` anahtarını kullanır.

<Warning>
Base URL olarak `https://www.vydra.ai/api/v1` kullanın.

Vydra'nın apex host'u (`https://vydra.ai/api/v1`) şu anda `www` adresine yönlendiriyor. Bazı HTTP istemcileri bu hostlar arası yönlendirmede `Authorization` başlığını düşürür; bu da geçerli bir API anahtarını yanıltıcı bir auth hatasına dönüştürür. Paketlenmiş Plugin bunu önlemek için doğrudan `www` base URL'sini kullanır.
</Warning>

## Kurulum

<Steps>
  <Step title="Etkileşimli ilk katılımı çalıştırın">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Veya ortam değişkenini doğrudan ayarlayın:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Varsayılan bir yetenek seçin">
    Aşağıdaki yeteneklerden birini veya birkaçını seçin (görüntü, video veya speech) ve eşleşen yapılandırmayı uygulayın.
  </Step>
</Steps>

## Yetenekler

<AccordionGroup>
  <Accordion title="Görüntü üretimi">
    Varsayılan görüntü modeli:

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

    Geçerli paketlenmiş destek yalnızca metinden görüntüye içindir. Vydra'nın barındırılan düzenleme rotaları uzak görüntü URL'leri bekler ve OpenClaw henüz paketlenmiş Plugin içinde Vydra'ya özgü bir yükleme köprüsü eklemez.

    <Note>
    Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için bkz. [Image Generation](/tr/tools/image-generation).
    </Note>

  </Accordion>

  <Accordion title="Video üretimi">
    Kayıtlı video modelleri:

    - metinden videoya için `vydra/veo3`
    - görüntüden videoya için `vydra/kling`

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

    - `vydra/veo3`, paketlenmiş olarak yalnızca metinden videoya sunulur.
    - `vydra/kling` şu anda uzak bir görüntü URL başvurusu gerektirir. Yerel dosya yüklemeleri baştan reddedilir.
    - Vydra'nın geçerli `kling` HTTP rotası, `image_url` mı yoksa `video_url` mu gerektirdiği konusunda tutarsız davranmıştır; paketlenmiş sağlayıcı aynı uzak görüntü URL'sini her iki alana da eşler.
    - Paketlenmiş Plugin temkinli kalır ve en-boy oranı, çözünürlük, filigran veya üretilmiş ses gibi belgelenmemiş stil ayarlarını iletmez.

    <Note>
    Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için bkz. [Video Generation](/tr/tools/video-generation).
    </Note>

  </Accordion>

  <Accordion title="Video canlı testleri">
    Sağlayıcıya özgü canlı kapsam:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Paketlenmiş Vydra canlı dosyası artık şunları kapsar:

    - `vydra/veo3` metinden videoya
    - uzak görüntü URL'si kullanan `vydra/kling` görüntüden videoya

    Gerektiğinde uzak görüntü fixture'ını geçersiz kılın:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Speech sentezi">
    Vydra'yı speech sağlayıcısı olarak ayarlayın:

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
    - Ses kimliği: `21m00Tcm4TlvDq8ikWAM`

    Paketlenmiş Plugin şu anda bilinen tek iyi varsayılan sesi açığa çıkarır ve MP3 ses dosyaları döndürür.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Sağlayıcı dizini" href="/tr/providers/index" icon="list">
    Kullanılabilir tüm sağlayıcılara göz atın.
  </Card>
  <Card title="Görüntü üretimi" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görüntü araç parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video araç parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Aracı varsayılanları ve model yapılandırması.
  </Card>
</CardGroup>
