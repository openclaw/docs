---
read_when:
    - Sie möchten SenseAudio-Spracherkennung für Audioanhänge
    - Sie benötigen die Umgebungsvariable für den SenseAudio-API-Schlüssel oder den Pfad zur Audiokonfiguration
summary: SenseAudio-Batch-Transkription für eingehende Sprachnachrichten
title: SenseAudio
x-i18n:
    generated_at: "2026-05-06T07:01:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: f53af21c746cdd44c71485cbad669f4a01a6e5be956675c73831e7b5f15df8c4
    source_path: providers/senseaudio.md
    workflow: 16
    postprocess_version: locale-links-v1
---

SenseAudio kann eingehende Audio- und Sprachnachrichten-Anhänge über OpenClaws gemeinsame `tools.media.audio`-Pipeline transkribieren. OpenClaw sendet Audiodaten als Multipart an den OpenAI-kompatiblen Transkriptions-Endpunkt und fügt den zurückgegebenen Text als `{{Transcript}}` plus einen `[Audio]`-Block ein.

| Eigenschaft              | Wert                                             |
| ------------------------ | ------------------------------------------------ |
| Provider-ID              | `senseaudio`                                     |
| Plugin                   | gebündelt, `enabledByDefault: true`              |
| Contract                 | `mediaUnderstandingProviders` (Audio)            |
| Auth-Umgebungsvariable   | `SENSEAUDIO_API_KEY`                             |
| Standardmodell           | `senseaudio-asr-pro-1.5-260319`                  |
| Standard-URL             | `https://api.senseaudio.cn/v1`                   |
| Website                  | [senseaudio.cn](https://senseaudio.cn)           |
| Dokumentation            | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## Erste Schritte

<Steps>
  <Step title="Legen Sie Ihren API-Schlüssel fest">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Aktivieren Sie den Audio-Provider">
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
  <Step title="Senden Sie eine Sprachnachricht">
    Senden Sie eine Audionachricht über einen beliebigen verbundenen Kanal. OpenClaw lädt die
    Audiodaten zu SenseAudio hoch und verwendet das Transkript in der Antwort-Pipeline.
  </Step>
</Steps>

## Optionen

| Option     | Pfad                                  | Beschreibung                                      |
| ---------- | ------------------------------------- | ------------------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | SenseAudio-ASR-Modell-ID                          |
| `language` | `tools.media.audio.models[].language` | Optionaler Sprachhinweis                          |
| `prompt`   | `tools.media.audio.prompt`            | Optionaler Transkriptions-Prompt                  |
| `baseUrl`  | `tools.media.audio.baseUrl` or model  | OpenAI-kompatible Basis überschreiben             |
| `headers`  | `tools.media.audio.request.headers`   | Zusätzliche Request-Header                        |

<Note>
SenseAudio ist in OpenClaw nur Batch-STT. Die Echtzeit-Transkription von Voice Calls
verwendet weiterhin Provider mit Streaming-STT-Unterstützung.
</Note>

## Verwandt

- [Medienverständnis (Audio)](/de/nodes/audio)
- [Modell-Provider](/de/concepts/model-providers)
