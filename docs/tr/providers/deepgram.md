---
read_when:
    - Ses ekleri için Deepgram konuşmadan metne özelliğini istiyorsunuz
    - Hızlı bir Deepgram yapılandırma örneğine ihtiyacınız var
summary: Gelen sesli notlar için Deepgram transkripsiyonu
title: Deepgram
x-i18n:
    generated_at: "2026-04-12T23:30:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 091523d6669e3d258f07c035ec756bd587299b6c7025520659232b1b2c1e21a5
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (Ses Transkripsiyonu)

Deepgram bir konuşmadan metne API'sidir. OpenClaw içinde **gelen ses/sesli not
transkripsiyonu** için `tools.media.audio` üzerinden kullanılır.

Etkinleştirildiğinde OpenClaw ses dosyasını Deepgram'e yükler ve transkripti
yanıt işlem hattına enjekte eder (`{{Transcript}}` + `[Audio]` bloğu). Bu **akışlı değildir**;
önceden kaydedilmiş transkripsiyon uç noktasını kullanır.

| Detail        | Value                                                      |
| ------------- | ---------------------------------------------------------- |
| Web sitesi    | [deepgram.com](https://deepgram.com)                       |
| Belgeler      | [developers.deepgram.com](https://developers.deepgram.com) |
| Kimlik doğrulama | `DEEPGRAM_API_KEY`                                      |
| Varsayılan model | `nova-3`                                                |

## Başlangıç

<Steps>
  <Step title="API anahtarınızı ayarlayın">
    Deepgram API anahtarınızı ortama ekleyin:

    ```
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
  <Step title="Bir sesli not gönderin">
    Bağlı herhangi bir kanal üzerinden bir sesli mesaj gönderin. OpenClaw bunu
    Deepgram aracılığıyla yazıya döker ve transkripti yanıt işlem hattına enjekte eder.
  </Step>
</Steps>

## Yapılandırma seçenekleri

| Seçenek          | Yol                                                          | Açıklama                               |
| ---------------- | ------------------------------------------------------------ | -------------------------------------- |
| `model`          | `tools.media.audio.models[].model`                           | Deepgram model kimliği (varsayılan: `nova-3`) |
| `language`       | `tools.media.audio.models[].language`                        | Dil ipucu (isteğe bağlı)               |
| `detect_language`| `tools.media.audio.providerOptions.deepgram.detect_language` | Dil algılamayı etkinleştirir (isteğe bağlı) |
| `punctuate`      | `tools.media.audio.providerOptions.deepgram.punctuate`       | Noktalama işaretlerini etkinleştirir (isteğe bağlı) |
| `smart_format`   | `tools.media.audio.providerOptions.deepgram.smart_format`    | Akıllı biçimlendirmeyi etkinleştirir (isteğe bağlı) |

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

## Notlar

<AccordionGroup>
  <Accordion title="Kimlik doğrulama">
    Kimlik doğrulama standart sağlayıcı kimlik doğrulama sırasını izler. En basit yol
    `DEEPGRAM_API_KEY` değeridir.
  </Accordion>
  <Accordion title="Proxy ve özel uç noktalar">
    Proxy kullanırken `tools.media.audio.baseUrl` ve
    `tools.media.audio.headers` ile uç noktaları veya başlıkları geçersiz kılın.
  </Accordion>
  <Accordion title="Çıktı davranışı">
    Çıktı, diğer sağlayıcılarla aynı ses kurallarını izler (boyut sınırları, zaman aşımları,
    transkript enjeksiyonu).
  </Accordion>
</AccordionGroup>

<Note>
Deepgram transkripsiyonu yalnızca **önceden kaydedilmiş** sesler içindir (gerçek zamanlı akış değil). OpenClaw
tam ses dosyasını Deepgram'e yükler ve konuşmaya enjekte etmeden önce tam transkripti
bekler.
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Medya araçları" href="/tools/media" icon="photo-film">
    Ses, görüntü ve video işleme işlem hattına genel bakış.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Medya aracı ayarları dahil tam yapılandırma başvurusu.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve hata ayıklama adımları.
  </Card>
  <Card title="SSS" href="/tr/help/faq" icon="circle-question">
    OpenClaw kurulumu hakkında sık sorulan sorular.
  </Card>
</CardGroup>
