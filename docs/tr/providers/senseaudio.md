---
read_when:
    - Ses ekleri için SenseAudio konuşmadan metne dönüştürme özelliğini kullanmak istiyorsunuz
    - SenseAudio API anahtarı ortam değişkenine veya ses yapılandırma yoluna ihtiyacınız var
summary: Gelen sesli notlar için SenseAudio toplu konuşmadan metne dönüştürme
title: SenseAudio
x-i18n:
    generated_at: "2026-07-12T12:44:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio, gelen ses ve sesli not eklerini OpenClaw'ın paylaşılan `tools.media.audio` işlem hattı üzerinden yazıya döker. OpenClaw, sesi çok parçalı biçimde OpenAI uyumlu transkripsiyon uç noktasına gönderir ve döndürülen metni `{{Transcript}}` ile bir `[Audio]` bloğu olarak ekler.

| Özellik              | Değer                                            |
| -------------------- | ------------------------------------------------ |
| Sağlayıcı kimliği    | `senseaudio`                                     |
| Plugin               | paketle birlikte gelir, `enabledByDefault: true` |
| Sözleşme             | `mediaUnderstandingProviders` (ses)              |
| Kimlik doğrulama ortam değişkeni | `SENSEAUDIO_API_KEY`                  |
| Varsayılan model     | `senseaudio-asr-pro-1.5-260319`                  |
| Varsayılan URL       | `https://api.senseaudio.cn/v1`                   |
| Web sitesi           | [senseaudio.cn](https://senseaudio.cn)           |
| Belgeler             | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## Başlarken

<Steps>
  <Step title="API anahtarınızı ayarlayın">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Ses sağlayıcısını etkinleştirin">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Bir sesli not gönderin">
    Bağlı herhangi bir kanal üzerinden sesli mesaj gönderin. OpenClaw, sesi
    SenseAudio'ya yükler ve transkripsiyonu yanıt işlem hattında kullanır.
  </Step>
</Steps>

## Seçenekler

| Seçenek    | Yol                                   | Açıklama                                  |
| ---------- | ------------------------------------- | ----------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | SenseAudio ASR model kimliği              |
| `language` | `tools.media.audio.models[].language` | İsteğe bağlı dil ipucu                    |
| `prompt`   | `tools.media.audio.prompt`            | İsteğe bağlı transkripsiyon istemi        |
| `baseUrl`  | `tools.media.audio.baseUrl` veya model| OpenAI uyumlu taban adresi geçersiz kılar |
| `headers`  | `tools.media.audio.request.headers`   | Ek istek üstbilgileri                     |

<Note>
SenseAudio, OpenClaw'da yalnızca toplu STT olarak kullanılabilir. Voice Call gerçek zamanlı transkripsiyonu,
akışlı STT desteği sunan sağlayıcıları kullanmaya devam eder.
</Note>

## İlgili içerikler

- [Medya anlama (ses)](/tr/nodes/audio)
- [Model sağlayıcıları](/tr/concepts/model-providers)
