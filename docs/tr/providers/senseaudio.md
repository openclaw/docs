---
read_when:
    - Ses ekleri için SenseAudio konuşmadan metne dönüştürme özelliğini istiyorsunuz
    - SenseAudio API anahtarı ortam değişkeni veya ses yapılandırma yolu gerekir
summary: Gelen sesli notlar için SenseAudio toplu konuşmayı metne dönüştürme
title: SenseAudio
x-i18n:
    generated_at: "2026-05-06T09:28:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: f53af21c746cdd44c71485cbad669f4a01a6e5be956675c73831e7b5f15df8c4
    source_path: providers/senseaudio.md
    workflow: 16
    postprocess_version: locale-links-v1
---

SenseAudio, gelen ses ve sesli not eklerini OpenClaw'ın paylaşılan `tools.media.audio` işlem hattı üzerinden transkripsiyonlayabilir. OpenClaw, çok parçalı sesi OpenAI uyumlu transkripsiyon uç noktasına gönderir ve dönen metni `{{Transcript}}` olarak, ayrıca bir `[Audio]` bloğuyla enjekte eder.

| Özellik      | Değer                                            |
| ------------- | ------------------------------------------------ |
| Sağlayıcı kimliği   | `senseaudio`                                     |
| Plugin        | birlikte gelir, `enabledByDefault: true`                |
| Sözleşme      | `mediaUnderstandingProviders` (ses)            |
| Kimlik doğrulama ortam değişkeni  | `SENSEAUDIO_API_KEY`                             |
| Varsayılan model | `senseaudio-asr-pro-1.5-260319`                  |
| Varsayılan URL   | `https://api.senseaudio.cn/v1`                   |
| Web sitesi       | [senseaudio.cn](https://senseaudio.cn)           |
| Belgeler          | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## Başlarken

<Steps>
  <Step title="Set your API key">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Enable the audio provider">
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
  <Step title="Send a voice note">
    Bağlı herhangi bir kanal üzerinden sesli mesaj gönderin. OpenClaw sesi
    SenseAudio'ya yükler ve yanıt işlem hattında transkripti kullanır.
  </Step>
</Steps>

## Seçenekler

| Seçenek     | Yol                                  | Açıklama                         |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | SenseAudio ASR model kimliği             |
| `language` | `tools.media.audio.models[].language` | İsteğe bağlı dil ipucu              |
| `prompt`   | `tools.media.audio.prompt`            | İsteğe bağlı transkripsiyon prompt'u       |
| `baseUrl`  | `tools.media.audio.baseUrl` veya model  | OpenAI uyumlu tabanı geçersiz kıl |
| `headers`  | `tools.media.audio.request.headers`   | Ek istek üstbilgileri               |

<Note>
SenseAudio, OpenClaw içinde yalnızca toplu STT'dir. Sesli Arama gerçek zamanlı transkripsiyonu,
akış STT desteği olan sağlayıcıları kullanmaya devam eder.
</Note>

## İlgili

- [Medya anlama (ses)](/tr/nodes/audio)
- [Model sağlayıcıları](/tr/concepts/model-providers)
