---
read_when:
    - Sie möchten SenseAudio Speech-to-Text für Audioanhänge verwenden.
    - Sie benötigen die Umgebungsvariable für den SenseAudio-API-Schlüssel oder den Audiokonfigurationspfad.
summary: SenseAudio Batch-Speech-to-Text für eingehende Sprachnachrichten
title: SenseAudio
x-i18n:
    generated_at: "2026-04-25T13:55:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c39e195458af94f710eb31e46d588a2c61ffe1e3461a9156c9638adae9943f8
    source_path: providers/senseaudio.md
    workflow: 15
---

# SenseAudio

SenseAudio kann eingehende Audio-/Sprachnachrichten-Anhänge über die gemeinsame Pipeline `tools.media.audio` von OpenClaw transkribieren. OpenClaw sendet Multipart-Audio an den OpenAI-kompatiblen Transkriptionsendpunkt und fügt den zurückgegebenen Text als `{{Transcript}}` sowie als Block `[Audio]` ein.

| Detail        | Wert                                             |
| ------------- | ------------------------------------------------ |
| Website       | [senseaudio.cn](https://senseaudio.cn)           |
| Dokumentation | [senseaudio.cn/docs](https://senseaudio.cn/docs) |
| Authentifizierung | `SENSEAUDIO_API_KEY`                          |
| Standardmodell | `senseaudio-asr-pro-1.5-260319`                 |
| Standard-URL  | `https://api.senseaudio.cn/v1`                   |

## Erste Schritte

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
    Senden Sie eine Audionachricht über einen beliebigen verbundenen Kanal. OpenClaw lädt das Audio zu SenseAudio hoch und verwendet das Transkript in der Antwortpipeline.
  </Step>
</Steps>

## Optionen

| Option     | Pfad                                  | Beschreibung                                |
| ---------- | ------------------------------------- | ------------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | SenseAudio-ASR-Modell-ID                    |
| `language` | `tools.media.audio.models[].language` | Optionaler Sprachhinweis                    |
| `prompt`   | `tools.media.audio.prompt`            | Optionaler Prompt für die Transkription     |
| `baseUrl`  | `tools.media.audio.baseUrl` or model  | Überschreibt die OpenAI-kompatible Basis-URL |
| `headers`  | `tools.media.audio.request.headers`   | Zusätzliche Anfrage-Header                  |

<Note>
SenseAudio ist in OpenClaw nur Batch-STT. Die Echtzeittranskription für Voice Call verwendet weiterhin Anbieter mit Unterstützung für Streaming-STT.
</Note>
