---
read_when:
    - Giden yanıtlar için Inworld konuşma sentezi istiyorsunuz
    - Inworld'den PCM telefon sesi veya OGG_OPUS sesli not çıktısı almanız gerekir
summary: OpenClaw yanıtları için Inworld akışlı metinden konuşmaya dönüştürme
title: Inworld
x-i18n:
    generated_at: "2026-07-12T12:42:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 443797be3eec0f63c52a7b6b697abb85b15db9b878174f6f6b70ddec474e6326
    source_path: providers/inworld.md
    workflow: 16
---

Inworld, akışlı bir metinden sese (TTS) sağlayıcısıdır. OpenClaw'da giden yanıt sesini (varsayılan olarak MP3, sesli notlar için OGG_OPUS) ve Voice Call gibi telefon kanalları için ham PCM sesini sentezler.

OpenClaw, Inworld'ün akışlı TTS uç noktasına istek gönderir, döndürülen base64 ses parçalarını tek bir arabellekte birleştirir ve sonucu standart yanıt sesi işlem hattına aktarır.

| Özellik        | Değer                                                           |
| -------------- | --------------------------------------------------------------- |
| Sağlayıcı kimliği | `inworld`                                                    |
| Plugin         | resmî harici paket (`@openclaw/inworld-speech`)                  |
| Sözleşme       | `speechProviders` (yalnızca TTS)                                 |
| Kimlik doğrulama ortam değişkeni | `INWORLD_API_KEY` (HTTP Basic, Base64 pano kimlik bilgisi) |
| Temel URL      | `https://api.inworld.ai`                                        |
| Varsayılan ses | `Sarah`                                                         |
| Varsayılan model | `inworld-tts-1.5-max`                                         |
| Çıktı          | MP3 (varsayılan), OGG_OPUS (sesli notlar), PCM 22050 Hz (telefon) |
| Web sitesi     | [inworld.ai](https://inworld.ai)                                |
| Belgeler       | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Plugin'i yükleme

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## Başlarken

<Steps>
  <Step title="API anahtarınızı ayarlayın">
    Kimlik bilgisini Inworld panonuzdan (Workspace > API Keys) kopyalayın ve ortam değişkeni olarak ayarlayın. Değer, HTTP Basic kimlik bilgisi olarak aynen gönderilir; bu nedenle değeri yeniden Base64 ile kodlamayın veya bearer token'a dönüştürmeyin.

    ```bash
    INWORLD_API_KEY=<panodan-alınan-base64-kimlik-bilgisi>
    ```

  </Step>
  <Step title="messages.tts içinde Inworld'ü seçin">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              voiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Mesaj gönderin">
    Bağlı herhangi bir kanal üzerinden yanıt gönderin. OpenClaw, sesi Inworld ile sentezler ve MP3 olarak (veya kanal sesli not beklediğinde OGG_OPUS olarak) iletir.
  </Step>
</Steps>

## Yapılandırma seçenekleri

| Seçenek       | Yol                                          | Açıklama                                                            |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Base64 pano kimlik bilgisi. Belirtilmezse `INWORLD_API_KEY` kullanılır. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Inworld API temel URL'sini geçersiz kılar (varsayılan `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Ses tanımlayıcısı (varsayılan `Sarah`). Eski takma ad: `speakerVoiceId`. |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | TTS model kimliği (varsayılan `inworld-tts-1.5-max`).                |
| `temperature` | `messages.tts.providers.inworld.temperature` | Örnekleme sıcaklığı, `0` (hariç) ile `2` arasında (isteğe bağlı).    |

## Notlar

<AccordionGroup>
  <Accordion title="Kimlik doğrulama">
    Inworld, Base64 ile kodlanmış tek bir kimlik bilgisi dizesiyle HTTP Basic kimlik doğrulaması kullanır. Bu değeri Inworld panosundan aynen kopyalayın. Sağlayıcı, değeri başka bir kodlama uygulamadan `Authorization: Basic <apiKey>` olarak gönderir; bu nedenle değeri kendiniz Base64 ile kodlamayın ve bearer biçiminde bir token iletmeyin. Aynı uyarı için [TTS kimlik doğrulama notlarına](/tr/tools/tts#inworld-primary) bakın.
  </Accordion>
  <Accordion title="Modeller">
    Desteklenen model kimlikleri: `inworld-tts-1.5-max` (varsayılan), `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Ses çıktıları">
    Yanıtlar varsayılan olarak MP3 kullanır. Kanal hedefi `voice-note` olduğunda OpenClaw, sesin yerel bir sesli mesaj balonu olarak oynatılması için Inworld'den `OGG_OPUS` ister. Telefon sentezi, telefon köprüsünü beslemek için 22050 Hz'de ham `PCM` kullanır.
  </Accordion>
  <Accordion title="Özel uç noktalar">
    API ana makinesini `messages.tts.providers.inworld.baseUrl` ile geçersiz kılın. İstekler gönderilmeden önce sondaki eğik çizgiler kaldırılır.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Metinden sese" href="/tr/tools/tts" icon="waveform-lines">
    TTS genel bakışı, sağlayıcılar ve `messages.tts` yapılandırması.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    `messages.tts` ayarlarını içeren eksiksiz yapılandırma başvurusu.
  </Card>
  <Card title="Sağlayıcılar" href="/tr/providers" icon="grid">
    Desteklenen tüm OpenClaw sağlayıcıları.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve hata ayıklama adımları.
  </Card>
</CardGroup>
