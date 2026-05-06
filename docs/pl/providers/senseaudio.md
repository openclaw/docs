---
read_when:
    - Chcesz używać zamiany mowy na tekst SenseAudio dla załączników audio
    - Wymagana jest zmienna środowiskowa klucza API SenseAudio albo ścieżka konfiguracji audio
summary: Wsadowa transkrypcja mowy na tekst SenseAudio dla przychodzących notatek głosowych
title: SenseAudio
x-i18n:
    generated_at: "2026-05-06T09:27:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: f53af21c746cdd44c71485cbad669f4a01a6e5be956675c73831e7b5f15df8c4
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio może transkrybować przychodzące załączniki audio i notatki głosowe przez współdzielony potok `tools.media.audio` OpenClaw. OpenClaw wysyła wieloczęściowe audio do zgodnego z OpenAI punktu końcowego transkrypcji i wstrzykuje zwrócony tekst jako `{{Transcript}}` oraz blok `[Audio]`.

| Właściwość    | Wartość                                          |
| ------------- | ------------------------------------------------ |
| Identyfikator dostawcy | `senseaudio`                            |
| Plugin        | wbudowany, `enabledByDefault: true`              |
| Kontrakt      | `mediaUnderstandingProviders` (audio)            |
| Zmienna środowiskowa uwierzytelniania | `SENSEAUDIO_API_KEY` |
| Domyślny model | `senseaudio-asr-pro-1.5-260319`                 |
| Domyślny URL  | `https://api.senseaudio.cn/v1`                   |
| Witryna       | [senseaudio.cn](https://senseaudio.cn)           |
| Dokumentacja  | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## Pierwsze kroki

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
    Wyślij wiadomość audio przez dowolny połączony kanał. OpenClaw przesyła
    audio do SenseAudio i używa transkrypcji w potoku odpowiedzi.
  </Step>
</Steps>

## Opcje

| Opcja      | Ścieżka                               | Opis                                |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Identyfikator modelu ASR SenseAudio |
| `language` | `tools.media.audio.models[].language` | Opcjonalna podpowiedź językowa      |
| `prompt`   | `tools.media.audio.prompt`            | Opcjonalny prompt transkrypcji      |
| `baseUrl`  | `tools.media.audio.baseUrl` lub model | Zastąp zgodną z OpenAI bazę         |
| `headers`  | `tools.media.audio.request.headers`   | Dodatkowe nagłówki żądania          |

<Note>
SenseAudio w OpenClaw obsługuje tylko wsadowe STT. Transkrypcja w czasie rzeczywistym połączeń głosowych
nadal używa dostawców z obsługą strumieniowego STT.
</Note>

## Powiązane

- [Rozumienie mediów (audio)](/pl/nodes/audio)
- [Dostawcy modeli](/pl/concepts/model-providers)
