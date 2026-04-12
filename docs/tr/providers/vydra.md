---
read_when:
    - OpenClaw'da Vydra medya üretimini istiyorsunuz
    - Vydra API anahtarı kurulumu rehberine ihtiyacınız var
summary: OpenClaw'da Vydra görüntü, video ve konuşma özelliklerini kullanın
title: Vydra
x-i18n:
    generated_at: "2026-04-12T23:33:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab623d14b656ce0b68d648a6393fcee3bb880077d6583e0d5c1012e91757f20e
    source_path: providers/vydra.md
    workflow: 15
---

# Vydra

Paketlenmiş Vydra Plugin'i şunları ekler:

- `vydra/grok-imagine` üzerinden görüntü üretimi
- `vydra/veo3` ve `vydra/kling` üzerinden video üretimi
- Vydra'nın ElevenLabs destekli TTS yolu üzerinden konuşma sentezi

OpenClaw, bu üç yetenek için de aynı `VYDRA_API_KEY` değerini kullanır.

<Warning>
Temel URL olarak `https://www.vydra.ai/api/v1` kullanın.

Vydra'nın apex ana makinesi (`https://vydra.ai/api/v1`) şu anda `www` adresine yönlendiriyor. Bazı HTTP istemcileri bu ana makine arası yönlendirmede `Authorization` üst bilgisini düşürür; bu da geçerli bir API anahtarını yanıltıcı bir kimlik doğrulama hatasına dönüştürür. Paketlenmiş Plugin bunu önlemek için doğrudan `www` temel URL'sini kullanır.
</Warning>

## Kurulum

<Steps>
  <Step title="Etkileşimli onboarding çalıştırın">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Veya ortam değişkenini doğrudan ayarlayın:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Varsayılan bir yetenek seçin">
    Aşağıdaki yeteneklerden birini veya birkaçını seçin (görüntü, video veya konuşma) ve eşleşen yapılandırmayı uygulayın.
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

    Mevcut paketlenmiş destek yalnızca metinden görüntü üretimidir. Vydra'nın barındırılan düzenleme yolları uzak görüntü URL'leri bekler ve OpenClaw henüz paketlenmiş Plugin'de Vydra'ya özgü bir yükleme köprüsü eklemez.

    <Note>
    Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Image Generation](/tr/tools/image-generation) bölümüne bakın.
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

    - `vydra/veo3`, yalnızca metinden videoya olarak paketlenmiştir.
    - `vydra/kling` şu anda uzak bir görüntü URL başvurusu gerektirir. Yerel dosya yüklemeleri baştan reddedilir.
    - Vydra'nın mevcut `kling` HTTP yolu, `image_url` mı yoksa `video_url` mi gerektirdiği konusunda tutarsız davranmıştır; paketlenmiş sağlayıcı aynı uzak görüntü URL'sini her iki alana da eşler.
    - Paketlenmiş Plugin temkinli davranır ve en-boy oranı, çözünürlük, filigran veya üretilen ses gibi belgelenmemiş stil ayarlarını iletmez.

    <Note>
    Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Video Generation](/tr/tools/video-generation) bölümüne bakın.
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
    - uzak bir görüntü URL'si kullanarak `vydra/kling` görüntüden videoya

    Gerektiğinde uzak görüntü fikstürünü geçersiz kılın:

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
    - Ses kimliği: `21m00Tcm4TlvDq8ikWAM`

    Paketlenmiş Plugin şu anda iyi çalıştığı bilinen tek bir varsayılan sesi sunar ve MP3 ses dosyaları döndürür.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Sağlayıcı dizini" href="/tr/providers/index" icon="list">
    Tüm kullanılabilir sağlayıcılara göz atın.
  </Card>
  <Card title="Görüntü üretimi" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görüntü aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference#agent-defaults" icon="gear">
    Ajan varsayılanları ve model yapılandırması.
  </Card>
</CardGroup>
