---
read_when:
    - Je wilt SenseAudio-spraak-naar-tekst voor audiobijlagen
    - Je hebt de SenseAudio API-sleutel-omgevingsvariabele of het audioconfiguratiepad nodig
summary: SenseAudio-batchspraak-naar-tekst voor inkomende spraaknotities
title: SenseAudio
x-i18n:
    generated_at: "2026-04-29T23:13:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c39e195458af94f710eb31e46d588a2c61ffe1e3461a9156c9638adae9943f8
    source_path: providers/senseaudio.md
    workflow: 16
---

# SenseAudio

SenseAudio kan inkomende audio-/spraaknotitie-bijlagen transcriberen via
OpenClaw's gedeelde `tools.media.audio`-pijplijn. OpenClaw plaatst multipart-audio
naar het OpenAI-compatibele transcriptie-eindpunt en injecteert de geretourneerde tekst
als `{{Transcript}}` plus een `[Audio]`-blok.

| Detail        | Waarde                                           |
| ------------- | ------------------------------------------------ |
| Website       | [senseaudio.cn](https://senseaudio.cn)           |
| Documentatie  | [senseaudio.cn/docs](https://senseaudio.cn/docs) |
| Authenticatie | `SENSEAUDIO_API_KEY`                             |
| Standaardmodel | `senseaudio-asr-pro-1.5-260319`                 |
| Standaard-URL | `https://api.senseaudio.cn/v1`                   |

## Aan de Slag

<Steps>
  <Step title="Stel je API-sleutel in">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Schakel de audioprovider in">
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
  <Step title="Verstuur een spraaknotitie">
    Verstuur een audiobericht via een verbonden kanaal. OpenClaw uploadt de
    audio naar SenseAudio en gebruikt het transcript in de antwoordpijplijn.
  </Step>
</Steps>

## Opties

| Optie      | Pad                                   | Beschrijving                         |
| ---------- | ------------------------------------- | ------------------------------------ |
| `model`    | `tools.media.audio.models[].model`    | SenseAudio ASR-model-ID              |
| `language` | `tools.media.audio.models[].language` | Optionele taalhint                   |
| `prompt`   | `tools.media.audio.prompt`            | Optionele transcriptieprompt         |
| `baseUrl`  | `tools.media.audio.baseUrl` of model  | Overschrijf de OpenAI-compatibele basis |
| `headers`  | `tools.media.audio.request.headers`   | Extra aanvraagheaders                |

<Note>
SenseAudio is in OpenClaw alleen batch-STT. Realtime transcriptie voor Voice Call
blijft providers gebruiken met ondersteuning voor streaming-STT.
</Note>
