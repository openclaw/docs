---
read_when:
    - OpenClaw'da Vydra medya üretimi istiyorsunuz
    - Vydra API anahtarı kurulum rehberliğine ihtiyacınız var
summary: OpenClaw’da Vydra görüntü, video ve konuşmayı kullanın
title: Vydra
x-i18n:
    generated_at: "2026-05-06T09:29:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e73121300fc3121124d15ecd285603032644c7d3886703776adc58c7115401a
    source_path: providers/vydra.md
    workflow: 16
---

Paketle birlikte gelen Vydra Plugin'i şunları ekler:

- `vydra/grok-imagine` ile görüntü oluşturma
- `vydra/veo3` ve `vydra/kling` ile video oluşturma
- Vydra'nın ElevenLabs destekli TTS rotası ile konuşma sentezi

OpenClaw, üç yeteneğin tamamı için aynı `VYDRA_API_KEY` değerini kullanır.

| Özellik                    | Değer                                                                     |
| -------------------------- | ------------------------------------------------------------------------- |
| Sağlayıcı kimliği          | `vydra`                                                                   |
| Plugin                     | paketle birlikte gelir, `enabledByDefault: true`                          |
| Kimlik doğrulama env var   | `VYDRA_API_KEY`                                                           |
| İlk kurulum bayrağı        | `--auth-choice vydra-api-key`                                             |
| Doğrudan CLI bayrağı       | `--vydra-api-key <key>`                                                   |
| Sözleşmeler                | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| Temel URL                  | `https://www.vydra.ai/api/v1` (`www` ana makinesini kullanın)             |

<Warning>
  Temel URL olarak `https://www.vydra.ai/api/v1` kullanın. Vydra'nın apex ana makinesi (`https://vydra.ai/api/v1`) şu anda `www` adresine yönlendiriyor. Bazı HTTP istemcileri bu çapraz ana makine yönlendirmesinde `Authorization` bilgisini düşürür; bu da geçerli bir API anahtarını yanıltıcı bir kimlik doğrulama hatasına dönüştürür. Paketle birlikte gelen Plugin bunu önlemek için doğrudan `www` temel URL'sini kullanır.
</Warning>

## Kurulum

<Steps>
  <Step title="Etkileşimli ilk kurulumu çalıştırın">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Ya da env var değerini doğrudan ayarlayın:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Varsayılan yetenek seçin">
    Aşağıdaki yeteneklerden birini veya daha fazlasını seçin (görüntü, video ya da konuşma) ve eşleşen yapılandırmayı uygulayın.
  </Step>
</Steps>

## Yetenekler

<AccordionGroup>
  <Accordion title="Görüntü oluşturma">
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

    Mevcut paketli destek yalnızca metinden görüntüyedir. Vydra'nın barındırılan düzenleme rotaları uzak görüntü URL'leri bekler ve OpenClaw, paketle birlikte gelen Plugin'de henüz Vydra'ya özgü bir yükleme köprüsü eklemez.

    <Note>
    Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Görüntü Oluşturma](/tr/tools/image-generation) bölümüne bakın.
    </Note>

  </Accordion>

  <Accordion title="Video oluşturma">
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
    - `vydra/kling` şu anda uzak bir görüntü URL referansı gerektirir. Yerel dosya yüklemeleri baştan reddedilir.
    - Vydra'nın mevcut `kling` HTTP rotası, `image_url` mı yoksa `video_url` mı gerektirdiği konusunda tutarsız olmuştur; paketle birlikte gelen sağlayıcı aynı uzak görüntü URL'sini iki alana da eşler.
    - Paketle birlikte gelen Plugin, temkinli kalır ve en boy oranı, çözünürlük, filigran veya oluşturulan ses gibi belgelenmemiş stil ayarlarını iletmez.

    <Note>
    Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Video Oluşturma](/tr/tools/video-generation) bölümüne bakın.
    </Note>

  </Accordion>

  <Accordion title="Video canlı testleri">
    Sağlayıcıya özgü canlı kapsam:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Paketle birlikte gelen Vydra canlı dosyası artık şunları kapsar:

    - `vydra/veo3` metinden videoya
    - uzak görüntü URL'si kullanan `vydra/kling` görüntüden videoya

    Gerektiğinde uzak görüntü fixture'ını geçersiz kılın:

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

    Paketle birlikte gelen Plugin şu anda bilinen ve iyi çalışan tek bir varsayılan sesi sunar ve MP3 ses dosyaları döndürür.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Sağlayıcı dizini" href="/tr/providers/index" icon="list">
    Mevcut tüm sağlayıcılara göz atın.
  </Card>
  <Card title="Görüntü oluşturma" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görüntü aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video oluşturma" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Aracı varsayılanları ve model yapılandırması.
  </Card>
</CardGroup>
