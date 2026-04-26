---
read_when:
    - Giden yanıtlar için Inworld konuşma sentezi istiyorsunuz
    - Inworld'den PCM telefon veya OGG_OPUS sesli not çıktısına ihtiyacınız var
summary: OpenClaw yanıtları için Inworld akış tabanlı metinden sese dönüşüm
title: Inworld
x-i18n:
    generated_at: "2026-04-26T11:39:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c3908b6ab11fd7bd2e18e5c56d1fdc1ac2e52448538d31cc6c83c2c97917641
    source_path: providers/inworld.md
    workflow: 15
---

Inworld, akış tabanlı bir metinden sese dönüşüm (TTS) sağlayıcısıdır. OpenClaw içinde,
giden yanıt sesi (varsayılan olarak MP3, sesli notlar için OGG_OPUS)
ve Voice Call gibi telefon kanalları için PCM sesi sentezler.

OpenClaw, Inworld'ün akış tabanlı TTS uç noktasına istek gönderir, dönen
base64 ses parçalarını tek bir arabellekte birleştirir ve sonucu
standart yanıt-sesi işlem hattına teslim eder.

| Ayrıntı       | Değer                                                       |
| ------------- | ----------------------------------------------------------- |
| Web sitesi    | [inworld.ai](https://inworld.ai)                            |
| Belgeler      | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)  |
| Kimlik doğrulama | `INWORLD_API_KEY` (HTTP Basic, Base64 panosu kimlik bilgisi) |
| Varsayılan ses | `Sarah`                                                     |
| Varsayılan model | `inworld-tts-1.5-max`                                       |

## Başlangıç

<Steps>
  <Step title="API anahtarınızı ayarlayın">
    Kimlik bilgisini Inworld panonuzdan kopyalayın (Workspace > API Keys)
    ve bir env var olarak ayarlayın. Değer, HTTP Basic
    kimlik bilgisi olarak aynen gönderilir; bu nedenle tekrar Base64 kodlaması yapmayın ve bearer
    token'a dönüştürmeyin.

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="messages.tts içinde Inworld seçin">
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
    Bağlı herhangi bir kanal üzerinden bir yanıt gönderin. OpenClaw,
    sesi Inworld ile sentezler ve MP3 olarak teslim eder (veya kanal
    sesli not bekliyorsa OGG_OPUS olarak).
  </Step>
</Steps>

## Yapılandırma seçenekleri

| Seçenek       | Yol                                          | Açıklama                                                          |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Base64 pano kimlik bilgisi. Varsayılan olarak `INWORLD_API_KEY` kullanılır. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Inworld API temel URL'sini geçersiz kılar (varsayılan `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Ses tanımlayıcısı (varsayılan `Sarah`).                           |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | TTS model kimliği (varsayılan `inworld-tts-1.5-max`).             |
| `temperature` | `messages.tts.providers.inworld.temperature` | Örnekleme sıcaklığı `0..2` (isteğe bağlı).                        |

## Notlar

<AccordionGroup>
  <Accordion title="Kimlik doğrulama">
    Inworld, tek bir Base64 kodlu kimlik bilgisi
    dizesiyle HTTP Basic auth kullanır. Bunu aynen Inworld panosundan kopyalayın. Sağlayıcı bunu
    ek bir kodlama olmadan `Authorization: Basic <apiKey>` olarak gönderir, bu nedenle
    kendiniz Base64 kodlaması yapmayın ve bearer tarzı bir token geçmeyin.
    Aynı uyarı için bkz. [TTS auth notları](/tr/tools/tts#inworld-primary).
  </Accordion>
  <Accordion title="Modeller">
    Desteklenen model kimlikleri: `inworld-tts-1.5-max` (varsayılan),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Ses çıktıları">
    Yanıtlar varsayılan olarak MP3 kullanır. Kanal hedefi `voice-note`
    olduğunda OpenClaw, sesi yerel
    ses balonu olarak oynatmak için Inworld'den `OGG_OPUS` ister. Telefon sentezi, telefon
    köprüsünü beslemek için 22050 Hz'de ham `PCM` kullanır.
  </Accordion>
  <Accordion title="Özel uç noktalar">
    API ana bilgisayarını `messages.tts.providers.inworld.baseUrl` ile geçersiz kılın.
    İstekler gönderilmeden önce sondaki eğik çizgiler kaldırılır.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Metinden sese dönüşüm" href="/tr/tools/tts" icon="waveform-lines">
    TTS genel bakışı, sağlayıcılar ve `messages.tts` yapılandırması.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    `messages.tts` ayarları dahil tam yapılandırma başvurusu.
  </Card>
  <Card title="Sağlayıcılar" href="/tr/providers" icon="grid">
    Tüm paketlenmiş OpenClaw sağlayıcıları.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve hata ayıklama adımları.
  </Card>
</CardGroup>
