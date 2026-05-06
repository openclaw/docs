---
read_when:
    - Giden yanıtlar için Inworld konuşma sentezi istiyorsunuz
    - Inworld'den PCM telefon sesi veya OGG_OPUS sesli not çıktısına ihtiyacınız var
summary: OpenClaw yanıtları için Inworld akışlı metinden sese dönüştürme
title: Inworld
x-i18n:
    generated_at: "2026-05-06T09:28:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf291bab5da946262ecaf4263c188c168be08ddb43fda72f250b8f8db87b3ff
    source_path: providers/inworld.md
    workflow: 16
---

Inworld, akışlı metinden sese dönüştürme (TTS) sağlayıcısıdır. OpenClaw içinde
giden yanıt sesini (varsayılan olarak MP3, sesli notlar için OGG_OPUS)
ve Voice Call gibi telefon kanalları için PCM sesini sentezler.

OpenClaw, Inworld'ün akışlı TTS uç noktasına gönderi yapar, döndürülen
base64 ses parçalarını tek bir arabellekte birleştirir ve sonucu standart
yanıt-ses işlem hattına verir.

| Özellik       | Değer                                                           |
| ------------- | --------------------------------------------------------------- |
| Sağlayıcı kimliği | `inworld`                                                       |
| Plugin        | paketle birlikte gelir, `enabledByDefault: true`                |
| Sözleşme      | `speechProviders` (yalnızca TTS)                                |
| Kimlik doğrulama ortam değişkeni | `INWORLD_API_KEY` (HTTP Basic, Base64 kontrol paneli kimlik bilgisi) |
| Temel URL     | `https://api.inworld.ai`                                        |
| Varsayılan ses | `Sarah`                                                         |
| Varsayılan model | `inworld-tts-1.5-max`                                           |
| Çıkış         | MP3 (varsayılan), OGG_OPUS (sesli notlar), PCM 22050 Hz (telefon) |
| Web sitesi    | [inworld.ai](https://inworld.ai)                                |
| Belgeler      | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Başlarken

<Steps>
  <Step title="API anahtarınızı ayarlayın">
    Kimlik bilgisini Inworld kontrol panelinizden (Workspace > API Keys)
    kopyalayın ve bir ortam değişkeni olarak ayarlayın. Değer, HTTP Basic
    kimlik bilgisi olarak aynen gönderilir; bu nedenle yeniden Base64 ile
    kodlamayın veya bearer belirtecine dönüştürmeyin.

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
              voiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Bir mesaj gönderin">
    Bağlı herhangi bir kanal üzerinden yanıt gönderin. OpenClaw sesi
    Inworld ile sentezler ve MP3 olarak (veya kanal sesli not beklediğinde
    OGG_OPUS olarak) iletir.
  </Step>
</Steps>

## Yapılandırma seçenekleri

| Seçenek       | Yol                                          | Açıklama                                                          |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Base64 kontrol paneli kimlik bilgisi. `INWORLD_API_KEY` değerine geri döner. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Inworld API temel URL'sini geçersiz kılar (varsayılan `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Ses tanımlayıcısı (varsayılan `Sarah`).                           |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | TTS model kimliği (varsayılan `inworld-tts-1.5-max`).             |
| `temperature` | `messages.tts.providers.inworld.temperature` | Örnekleme sıcaklığı `0..2` (isteğe bağlı).                        |

## Notlar

<AccordionGroup>
  <Accordion title="Kimlik doğrulama">
    Inworld, tek bir Base64 kodlu kimlik bilgisi dizesiyle HTTP Basic kimlik
    doğrulaması kullanır. Bunu Inworld kontrol panelinden aynen kopyalayın.
    Sağlayıcı bunu başka bir kodlama yapmadan `Authorization: Basic <apiKey>`
    olarak gönderir; bu nedenle kendiniz Base64 ile kodlamayın ve bearer tarzı
    belirteç iletmeyin. Aynı vurgu için [TTS kimlik doğrulama notları](/tr/tools/tts#inworld-primary)
    bölümüne bakın.
  </Accordion>
  <Accordion title="Modeller">
    Desteklenen model kimlikleri: `inworld-tts-1.5-max` (varsayılan),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Ses çıkışları">
    Yanıtlar varsayılan olarak MP3 kullanır. Kanal hedefi `voice-note`
    olduğunda OpenClaw, sesin yerel bir ses balonu olarak oynatılması için
    Inworld'den `OGG_OPUS` ister. Telefon sentezi, telefon köprüsünü beslemek
    için 22050 Hz'de ham `PCM` kullanır.
  </Accordion>
  <Accordion title="Özel uç noktalar">
    API ana makinesini `messages.tts.providers.inworld.baseUrl` ile geçersiz kılın.
    İstekler gönderilmeden önce sondaki eğik çizgiler kaldırılır.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Metinden sese dönüştürme" href="/tr/tools/tts" icon="waveform-lines">
    TTS genel bakışı, sağlayıcılar ve `messages.tts` yapılandırması.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    `messages.tts` ayarları dahil tam yapılandırma başvurusu.
  </Card>
  <Card title="Sağlayıcılar" href="/tr/providers" icon="grid">
    Paketle birlikte gelen tüm OpenClaw sağlayıcıları.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve hata ayıklama adımları.
  </Card>
</CardGroup>
