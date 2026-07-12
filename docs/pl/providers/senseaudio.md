---
read_when:
    - Chcesz używać zamiany mowy na tekst SenseAudio dla załączników audio
    - Potrzebujesz zmiennej środowiskowej klucza API SenseAudio lub ścieżki konfiguracji audio
summary: Wsadowe przekształcanie mowy na tekst za pomocą SenseAudio dla przychodzących wiadomości głosowych
title: SenseAudio
x-i18n:
    generated_at: "2026-07-12T15:36:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio transkrybuje przychodzące załączniki audio i notatki głosowe za pośrednictwem współdzielonego potoku `tools.media.audio` OpenClaw. OpenClaw wysyła dane audio w formacie multipart do punktu końcowego transkrypcji zgodnego z OpenAI i wstawia zwrócony tekst jako `{{Transcript}}` wraz z blokiem `[Audio]`.

| Właściwość        | Wartość                                          |
| ----------------- | ------------------------------------------------ |
| Identyfikator dostawcy | `senseaudio`                                |
| Plugin            | wbudowany, `enabledByDefault: true`               |
| Kontrakt          | `mediaUnderstandingProviders` (audio)             |
| Zmienna środowiskowa uwierzytelniania | `SENSEAUDIO_API_KEY`           |
| Model domyślny    | `senseaudio-asr-pro-1.5-260319`                   |
| Domyślny adres URL | `https://api.senseaudio.cn/v1`                  |
| Witryna           | [senseaudio.cn](https://senseaudio.cn)            |
| Dokumentacja      | [senseaudio.cn/docs](https://senseaudio.cn/docs)  |

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Włącz dostawcę obsługi audio">
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
  <Step title="Wyślij notatkę głosową">
    Wyślij wiadomość audio za pośrednictwem dowolnego połączonego kanału. OpenClaw przesyła
    dane audio do SenseAudio i wykorzystuje transkrypcję w potoku odpowiedzi.
  </Step>
</Steps>

## Opcje

| Opcja      | Ścieżka                               | Opis                                |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Identyfikator modelu ASR SenseAudio |
| `language` | `tools.media.audio.models[].language` | Opcjonalna wskazówka dotycząca języka |
| `prompt`   | `tools.media.audio.prompt`            | Opcjonalna instrukcja transkrypcji  |
| `baseUrl`  | `tools.media.audio.baseUrl` lub model | Zastępuje bazowy adres zgodny z OpenAI |
| `headers`  | `tools.media.audio.request.headers`   | Dodatkowe nagłówki żądania          |

<Note>
W OpenClaw SenseAudio obsługuje wyłącznie wsadowe przetwarzanie mowy na tekst. Transkrypcja połączeń głosowych w czasie rzeczywistym
nadal korzysta z dostawców obsługujących strumieniowe przetwarzanie mowy na tekst.
</Note>

## Powiązane materiały

- [Rozpoznawanie multimediów (audio)](/pl/nodes/audio)
- [Dostawcy modeli](/pl/concepts/model-providers)
