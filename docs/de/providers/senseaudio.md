---
read_when:
    - Sie möchten die Spracherkennung von SenseAudio für Audioanhänge verwenden.
    - Sie benötigen die Umgebungsvariable für den SenseAudio-API-Schlüssel oder den Pfad zur Audiokonfiguration.
summary: SenseAudio-Batch-Spracherkennung für eingehende Sprachnachrichten
title: SenseAudio
x-i18n:
    generated_at: "2026-07-12T02:06:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio transkribiert eingehende Audio- und Sprachnotizanhänge über die gemeinsame `tools.media.audio`-Pipeline von OpenClaw. OpenClaw sendet Audiodaten als Multipart-Anfrage an den OpenAI-kompatiblen Transkriptionsendpunkt und fügt den zurückgegebenen Text als `{{Transcript}}` sowie als `[Audio]`-Block ein.

| Eigenschaft   | Wert                                             |
| ------------- | ------------------------------------------------ |
| Provider-ID   | `senseaudio`                                     |
| Plugin        | gebündelt, `enabledByDefault: true`              |
| Vertrag       | `mediaUnderstandingProviders` (Audio)            |
| Auth.-Umgebungsvariable | `SENSEAUDIO_API_KEY`                   |
| Standardmodell | `senseaudio-asr-pro-1.5-260319`                 |
| Standard-URL  | `https://api.senseaudio.cn/v1`                   |
| Website       | [senseaudio.cn](https://senseaudio.cn)           |
| Dokumentation | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel festlegen">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Audio-Provider aktivieren">
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
  <Step title="Sprachnotiz senden">
    Senden Sie eine Audionachricht über einen beliebigen verbundenen Kanal. OpenClaw lädt die
    Audiodaten zu SenseAudio hoch und verwendet das Transkript in der Antwort-Pipeline.
  </Step>
</Steps>

## Optionen

| Option     | Pfad                                  | Beschreibung                              |
| ---------- | ------------------------------------- | ----------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | ID des SenseAudio-ASR-Modells             |
| `language` | `tools.media.audio.models[].language` | Optionaler Hinweis zur Sprache            |
| `prompt`   | `tools.media.audio.prompt`            | Optionaler Transkriptions-Prompt          |
| `baseUrl`  | `tools.media.audio.baseUrl` oder Modell | OpenAI-kompatible Basis-URL überschreiben |
| `headers`  | `tools.media.audio.request.headers`   | Zusätzliche Anfrage-Header                |

<Note>
SenseAudio unterstützt in OpenClaw nur Batch-STT. Die Echtzeittranskription für Sprachanrufe
verwendet weiterhin Provider mit Unterstützung für Streaming-STT.
</Note>

## Verwandte Themen

- [Medienverständnis (Audio)](/de/nodes/audio)
- [Modell-Provider](/de/concepts/model-providers)
