---
read_when:
    - Ses ekleri için Deepgram konuşmayı metne dönüştürme özelliğini istiyorsunuz
    - Sesli Arama için Deepgram akışlı transkripsiyonunu kullanmak istiyorsunuz
    - Hızlı bir Deepgram yapılandırma örneğine ihtiyacınız var
summary: Gelen sesli notlar için Deepgram transkripsiyonu
title: Deepgram
x-i18n:
    generated_at: "2026-07-12T12:08:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b0f407829ba47344ad92c5fe63aacd0ce234909c439c96370e7bd900cadff8b
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram, bir konuşmayı metne dönüştürme API'sidir. OpenClaw bunu `tools.media.audio`
üzerinden gelen ses/sesli not transkripsiyonu ve
`plugins.entries.voice-call.config.streaming` üzerinden Voice Call akışlı STT
için kullanır.

Toplu transkripsiyon, ses dosyasının tamamını Deepgram'a yükler ve
transkripti yanıt işlem hattına (`{{Transcript}}` + `[Audio]` bloğu) ekler.
Voice Call akışı, canlı G.711 u-law karelerini Deepgram'ın WebSocket `listen`
uç noktası üzerinden iletir ve Deepgram döndürdükçe kısmi/nihai transkriptleri
yayar.

| Ayrıntı        | Değer                                                      |
| -------------- | ---------------------------------------------------------- |
| Web sitesi     | [deepgram.com](https://deepgram.com)                       |
| Belgeler       | [developers.deepgram.com](https://developers.deepgram.com) |
| Kimlik doğrulama | `DEEPGRAM_API_KEY`                                       |
| Varsayılan model | `nova-3`                                                 |

## Başlarken

<Steps>
  <Step title="API anahtarınızı ayarlayın">
    ```bash
    DEEPGRAM_API_KEY=dg_...
    ```
  </Step>
  <Step title="Ses sağlayıcısını etkinleştirin">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Sesli not gönderin">
    Bağlı herhangi bir kanal üzerinden sesli mesaj gönderin. OpenClaw, mesajı
    Deepgram aracılığıyla metne dönüştürür ve transkripti yanıt işlem hattına ekler.
  </Step>
</Steps>

## Yapılandırma seçenekleri

| Seçenek    | Yol                                   | Açıklama                                   |
| ---------- | ------------------------------------- | ------------------------------------------ |
| `model`    | `tools.media.audio.models[].model`    | Deepgram model kimliği (varsayılan: `nova-3`) |
| `language` | `tools.media.audio.models[].language` | Dil ipucu (isteğe bağlı)                   |

`providerOptions.deepgram`, ek sorgu parametrelerini doğrudan Deepgram
`/listen` isteğine birleştirir; dolayısıyla Deepgram tarafından desteklenen
tüm parametre adları kullanılabilir (örneğin `detect_language`, `punctuate`,
`smart_format`):

<Tabs>
  <Tab title="Dil ipucuyla">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Deepgram seçenekleriyle">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Voice Call akışlı STT

Paketle birlikte gelen `deepgram` Plugin'i, Voice Call Plugin'i için gerçek
zamanlı bir transkripsiyon sağlayıcısı da kaydeder.

| Ayar            | Yapılandırma yolu                                                       | Varsayılan                           |
| --------------- | ----------------------------------------------------------------------- | ------------------------------------ |
| API anahtarı    | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | `DEEPGRAM_API_KEY` değerine geri döner |
| Model           | `...deepgram.model`                                                     | `nova-3`                             |
| Dil             | `...deepgram.language`                                                  | (ayarlanmamış)                       |
| Kodlama         | `...deepgram.encoding`                                                  | `mulaw`                              |
| Örnekleme hızı  | `...deepgram.sampleRate`                                                | `8000`                               |
| Uç nokta belirleme | `...deepgram.endpointingMs`                                          | `800`                                |
| Ara sonuçlar    | `...deepgram.interimResults`                                            | `true`                               |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Voice Call, telefon sesini 8 kHz G.711 u-law biçiminde alır. Deepgram akış
sağlayıcısının varsayılanları `encoding: "mulaw"` ve `sampleRate: 8000`
olduğundan Twilio medya kareleri doğrudan iletilebilir.
</Note>

## Notlar

<AccordionGroup>
  <Accordion title="Kimlik doğrulama">
    Kimlik doğrulama, standart sağlayıcı kimlik doğrulama sırasını izler.
    `DEEPGRAM_API_KEY` en basit yoldur.
  </Accordion>
  <Accordion title="Proxy ve özel uç noktalar">
    Proxy kullanırken uç noktaları veya üstbilgileri `tools.media.audio.baseUrl`
    ve `tools.media.audio.headers` ile geçersiz kılın.
  </Accordion>
  <Accordion title="Çıktı davranışı">
    Çıktı, diğer sağlayıcılarla aynı ses kurallarını izler (boyut sınırları,
    zaman aşımları, transkript ekleme).
  </Accordion>
</AccordionGroup>

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Medya araçları" href="/tr/tools/media-overview" icon="photo-film">
    Ses, görüntü ve video işleme hattına genel bakış.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Medya aracı ayarlarını içeren tam yapılandırma başvurusu.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve hata ayıklama adımları.
  </Card>
  <Card title="SSS" href="/tr/help/faq" icon="circle-question">
    OpenClaw kurulumu hakkında sık sorulan sorular.
  </Card>
</CardGroup>
