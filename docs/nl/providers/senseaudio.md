---
read_when:
    - Je wilt SenseAudio-spraak-naar-tekst voor audiobijlagen
    - Je hebt de env var voor de SenseAudio API-sleutel of het audioconfiguratiepad nodig
summary: SenseAudio batchgewijze spraak-naar-tekst voor inkomende spraaknotities
title: SenseAudio
x-i18n:
    generated_at: "2026-05-06T09:30:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: f53af21c746cdd44c71485cbad669f4a01a6e5be956675c73831e7b5f15df8c4
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio kan inkomende audio- en spraaknotitie-bijlagen transcriberen via OpenClaw's gedeelde `tools.media.audio`-pipeline. OpenClaw plaatst multipart-audio op het OpenAI-compatibele transcriptie-eindpunt en voegt de geretourneerde tekst in als `{{Transcript}}` plus een `[Audio]`-blok.

| Eigenschap      | Waarde                                            |
| ------------- | ------------------------------------------------ |
| Provider-id   | `senseaudio`                                     |
| Plugin        | gebundeld, `enabledByDefault: true`                |
| Contract      | `mediaUnderstandingProviders` (audio)            |
| Auth-env-var  | `SENSEAUDIO_API_KEY`                             |
| Standaardmodel | `senseaudio-asr-pro-1.5-260319`                  |
| Standaard-URL   | `https://api.senseaudio.cn/v1`                   |
| Website       | [senseaudio.cn](https://senseaudio.cn)           |
| Documentatie          | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## Aan de slag

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
  <Step title="Verzend een spraaknotitie">
    Verzend een audiobericht via een verbonden kanaal. OpenClaw uploadt de
    audio naar SenseAudio en gebruikt het transcript in de antwoordpipeline.
  </Step>
</Steps>

## Opties

| Optie     | Pad                                  | Beschrijving                         |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | SenseAudio ASR-model-id             |
| `language` | `tools.media.audio.models[].language` | Optionele taalhint              |
| `prompt`   | `tools.media.audio.prompt`            | Optionele transcriptieprompt       |
| `baseUrl`  | `tools.media.audio.baseUrl` of model  | Overschrijf de OpenAI-compatibele basis |
| `headers`  | `tools.media.audio.request.headers`   | Extra aanvraagheaders               |

<Note>
SenseAudio is in OpenClaw alleen batch-STT. Realtime transcriptie voor Voice Call
blijft providers met ondersteuning voor streaming-STT gebruiken.
</Note>

## Gerelateerd

- [Mediabegrip (audio)](/nl/nodes/audio)
- [Modelproviders](/nl/concepts/model-providers)
