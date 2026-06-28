---
read_when:
    - Giden yanıtlar için Inworld konuşma sentezi istiyorsunuz
    - Inworld'den PCM telefon sesi veya OGG_OPUS sesli not çıktısına ihtiyacınız var
summary: OpenClaw yanıtları için Inworld akışlı metinden sese dönüştürme
title: Inworld
x-i18n:
    generated_at: "2026-06-28T01:10:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea65903945586516b51b239f0671b9e59dac92f302442f3cb629f66b68338cfb
    source_path: providers/inworld.md
    workflow: 16
---

Inworld, akış tabanlı bir metinden konuşmaya (TTS) sağlayıcısıdır. OpenClaw içinde
giden yanıt sesini (varsayılan olarak MP3, sesli notlar için OGG_OPUS)
ve Voice Call gibi telefon kanalları için PCM sesi sentezler.

OpenClaw, Inworld'ün akış tabanlı TTS uç noktasına gönderim yapar, dönen
base64 ses parçalarını tek bir arabellek halinde birleştirir ve sonucu
standart yanıt-sesi işlem hattına verir.

| Özellik      | Değer                                                           |
| ------------- | --------------------------------------------------------------- |
| Sağlayıcı kimliği   | `inworld`                                                       |
| Plugin        | resmi harici paket                                       |
| Sözleşme      | `speechProviders` (yalnızca TTS)                                    |
| Kimlik doğrulama ortam değişkeni  | `INWORLD_API_KEY` (HTTP Basic, Base64 pano kimlik bilgisi)     |
| Temel URL      | `https://api.inworld.ai`                                        |
| Varsayılan ses | `Sarah`                                                         |
| Varsayılan model | `inworld-tts-1.5-max`                                           |
| Çıktı        | MP3 (varsayılan), OGG_OPUS (sesli notlar), PCM 22050 Hz (telefon) |
| Web sitesi       | [inworld.ai](https://inworld.ai)                                |
| Belgeler          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Plugin yükle

Resmi Plugin'i yükleyin, ardından Gateway'i yeniden başlatın:

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## Başlarken

<Steps>
  <Step title="API anahtarınızı ayarlayın">
    Kimlik bilgisini Inworld panonuzdan (Workspace > API Keys) kopyalayın
    ve bir ortam değişkeni olarak ayarlayın. Değer, HTTP Basic kimlik bilgisi
    olarak aynen gönderilir; bu yüzden yeniden Base64 ile kodlamayın veya
    bearer belirtecine dönüştürmeyin.

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
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
              speakerVoiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Bir mesaj gönderin">
    Bağlı herhangi bir kanal üzerinden bir yanıt gönderin. OpenClaw, sesi
    Inworld ile sentezler ve MP3 olarak (veya kanal sesli not bekliyorsa
    OGG_OPUS olarak) teslim eder.
  </Step>
</Steps>

## Yapılandırma seçenekleri

| Seçenek           | Yol                                            | Açıklama                                                       |
| ---------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`         | `messages.tts.providers.inworld.apiKey`         | Base64 pano kimlik bilgisi. `INWORLD_API_KEY` değerine geri döner.     |
| `baseUrl`        | `messages.tts.providers.inworld.baseUrl`        | Inworld API temel URL'sini geçersiz kılar (varsayılan `https://api.inworld.ai`). |
| `speakerVoiceId` | `messages.tts.providers.inworld.speakerVoiceId` | Ses tanımlayıcısı (varsayılan `Sarah`).                               |
| `modelId`        | `messages.tts.providers.inworld.modelId`        | TTS model kimliği (varsayılan `inworld-tts-1.5-max`).                     |
| `temperature`    | `messages.tts.providers.inworld.temperature`    | Örnekleme sıcaklığı `0..2` (isteğe bağlı).                           |

## Notlar

<AccordionGroup>
  <Accordion title="Kimlik doğrulama">
    Inworld, tek bir Base64 ile kodlanmış kimlik bilgisi dizesiyle HTTP Basic
    kimlik doğrulaması kullanır. Bunu Inworld panosundan aynen kopyalayın.
    Sağlayıcı bunu ek kodlama yapmadan `Authorization: Basic <apiKey>` olarak
    gönderir; bu yüzden kendiniz Base64 ile kodlamayın ve bearer tarzı bir
    belirteç geçirmeyin. Aynı uyarı için [TTS kimlik doğrulama notları](/tr/tools/tts#inworld-primary)
    bölümüne bakın.
  </Accordion>
  <Accordion title="Modeller">
    Desteklenen model kimlikleri: `inworld-tts-1.5-max` (varsayılan),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Ses çıktıları">
    Yanıtlar varsayılan olarak MP3 kullanır. Kanal hedefi `voice-note`
    olduğunda OpenClaw, sesin yerel bir ses balonu olarak çalması için
    Inworld'den `OGG_OPUS` ister. Telefon sentezi, telefon köprüsünü beslemek
    için 22050 Hz'de ham `PCM` kullanır.
  </Accordion>
  <Accordion title="Özel uç noktalar">
    API ana makinesini `messages.tts.providers.inworld.baseUrl` ile geçersiz kılın.
    Sondaki eğik çizgiler istekler gönderilmeden önce kaldırılır.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Metinden konuşmaya" href="/tr/tools/tts" icon="waveform-lines">
    TTS genel bakışı, sağlayıcılar ve `messages.tts` yapılandırması.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    `messages.tts` ayarları dahil tam yapılandırma başvurusu.
  </Card>
  <Card title="Sağlayıcılar" href="/tr/providers" icon="grid">
    Desteklenen tüm OpenClaw sağlayıcıları.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve hata ayıklama adımları.
  </Card>
</CardGroup>
