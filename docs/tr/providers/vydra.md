---
read_when:
    - OpenClaw içinde Vydra medya oluşturma istiyorsunuz
    - Vydra API anahtarı kurulum rehberliğine ihtiyacınız var
summary: OpenClaw’da Vydra görüntü, video ve konuşma özelliklerini kullanın
title: Vydra
x-i18n:
    generated_at: "2026-06-28T01:13:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb1128d877e06a274fe07c42282a7990c322e4d88d4232a1cac78e54deaf163
    source_path: providers/vydra.md
    workflow: 16
---

Yerleşik Vydra Plugin şunları ekler:

- `vydra/grok-imagine` aracılığıyla görüntü oluşturma
- `vydra/veo3` ve `vydra/kling` aracılığıyla video oluşturma
- Vydra'nın ElevenLabs destekli TTS rotası aracılığıyla konuşma sentezi

OpenClaw, üç yeteneğin tümü için aynı `VYDRA_API_KEY` değerini kullanır.

| Özellik                       | Değer                                                                     |
| ----------------------------- | ------------------------------------------------------------------------- |
| Sağlayıcı kimliği             | `vydra`                                                                   |
| Plugin                        | yerleşik, `enabledByDefault: true`                                        |
| Kimlik doğrulama ortam değişkeni | `VYDRA_API_KEY`                                                        |
| İlk kurulum bayrağı           | `--auth-choice vydra-api-key`                                             |
| Doğrudan CLI bayrağı          | `--vydra-api-key <key>`                                                   |
| Sözleşmeler                   | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| Temel URL                     | `https://www.vydra.ai/api/v1` (`www` ana makinesini kullanın)             |

<Warning>
  Temel URL olarak `https://www.vydra.ai/api/v1` kullanın. Vydra'nın apex ana makinesi (`https://vydra.ai/api/v1`) şu anda `www` adresine yönlendiriyor. Bazı HTTP istemcileri bu ana makineler arası yönlendirmede `Authorization` bilgisini düşürür; bu da geçerli bir API anahtarını yanıltıcı bir kimlik doğrulama hatasına dönüştürür. Yerleşik plugin bunu önlemek için doğrudan `www` temel URL'sini kullanır.
</Warning>

## Kurulum

<Steps>
  <Step title="Run interactive onboarding">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Veya ortam değişkenini doğrudan ayarlayın:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Choose a default capability">
    Aşağıdaki yeteneklerden birini veya daha fazlasını seçin (görüntü, video ya da konuşma) ve eşleşen yapılandırmayı uygulayın.
  </Step>
</Steps>

## Yetenekler

<AccordionGroup>
  <Accordion title="Image generation">
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

    Mevcut yerleşik destek yalnızca metinden görüntüye yöneliktir. Vydra'nın barındırılan düzenleme rotaları uzak görüntü URL'leri bekler ve OpenClaw, yerleşik plugin içinde henüz Vydra'ya özgü bir yükleme köprüsü eklemez.

    <Note>
    Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Görüntü Oluşturma](/tr/tools/image-generation) bölümüne bakın.
    </Note>

  </Accordion>

  <Accordion title="Video generation">
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

    - `vydra/veo3` yalnızca metinden videoya olarak yerleşik gelir.
    - `vydra/kling` şu anda uzak bir görüntü URL referansı gerektirir. Yerel dosya yüklemeleri baştan reddedilir.
    - Vydra'nın mevcut `kling` HTTP rotası, `image_url` mı yoksa `video_url` mı gerektirdiği konusunda tutarsız davranmıştır; yerleşik sağlayıcı aynı uzak görüntü URL'sini iki alana da eşler.
    - Yerleşik plugin ihtiyatlı kalır ve en boy oranı, çözünürlük, filigran veya oluşturulan ses gibi belgelenmemiş stil ayarlarını iletmez.

    <Note>
    Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Video Oluşturma](/tr/tools/video-generation) bölümüne bakın.
    </Note>

  </Accordion>

  <Accordion title="Video live tests">
    Sağlayıcıya özgü canlı kapsam:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Yerleşik Vydra canlı dosyası artık şunları kapsar:

    - `vydra/veo3` metinden videoya
    - uzak bir görüntü URL'si kullanarak `vydra/kling` görüntüden videoya

    Gerektiğinde uzak görüntü fixture'ını geçersiz kılın:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Speech synthesis">
    Vydra'yı konuşma sağlayıcısı olarak ayarlayın:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              speakerVoiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    Varsayılanlar:

    - Model: `elevenlabs/tts`
    - Ses kimliği: `21m00Tcm4TlvDq8ikWAM`

    Yerleşik plugin şu anda bilinen, düzgün çalışan tek bir varsayılan sesi açığa çıkarır ve MP3 ses dosyaları döndürür.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Provider directory" href="/tr/providers/index" icon="list">
    Kullanılabilir tüm sağlayıcılara göz atın.
  </Card>
  <Card title="Image generation" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görüntü aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video generation" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Configuration reference" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Agent varsayılanları ve model yapılandırması.
  </Card>
</CardGroup>
