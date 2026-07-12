---
read_when:
    - Je wilt SenseAudio-spraak-naar-tekst voor audiobijlagen
    - Je hebt de omgevingsvariabele voor de SenseAudio-API-sleutel of het audioconfiguratiepad nodig
summary: SenseAudio-batchspraak-naar-tekst voor inkomende spraakberichten
title: SenseAudio
x-i18n:
    generated_at: "2026-07-12T09:20:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio transcribeert binnenkomende audio- en spraaknotitiebijlagen via de gedeelde `tools.media.audio`-pipeline van OpenClaw. OpenClaw verstuurt audio als multipart-gegevens naar het OpenAI-compatibele transcriptie-eindpunt en voegt de geretourneerde tekst in als `{{Transcript}}`, samen met een `[Audio]`-blok.

| Eigenschap      | Waarde                                            |
| --------------- | ------------------------------------------------- |
| Provider-id     | `senseaudio`                                      |
| Plugin          | meegeleverd, `enabledByDefault: true`             |
| Contract        | `mediaUnderstandingProviders` (audio)             |
| Omgevingsvariabele voor authenticatie | `SENSEAUDIO_API_KEY`          |
| Standaardmodel  | `senseaudio-asr-pro-1.5-260319`                   |
| Standaard-URL   | `https://api.senseaudio.cn/v1`                    |
| Website         | [senseaudio.cn](https://senseaudio.cn)            |
| Documentatie    | [senseaudio.cn/docs](https://senseaudio.cn/docs)  |

## Aan de slag

<Steps>
  <Step title="Stel uw API-sleutel in">
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
    audio naar SenseAudio en gebruikt het transcript in de antwoordpipeline.
  </Step>
</Steps>

## Opties

| Optie      | Pad                                   | Beschrijving                              |
| ---------- | ------------------------------------- | ----------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Model-id van SenseAudio ASR               |
| `language` | `tools.media.audio.models[].language` | Optionele taalaanwijzing                  |
| `prompt`   | `tools.media.audio.prompt`            | Optionele transcriptieprompt              |
| `baseUrl`  | `tools.media.audio.baseUrl` of model  | Overschrijf de OpenAI-compatibele basis-URL |
| `headers`  | `tools.media.audio.request.headers`   | Extra aanvraagheaders                     |

<Note>
SenseAudio ondersteunt in OpenClaw alleen batchgewijze spraak-naar-tekst. Realtime transcriptie
voor Voice Call blijft providers met ondersteuning voor streaming spraak-naar-tekst gebruiken.
</Note>

## Gerelateerd

- [Media-inzicht (audio)](/nl/nodes/audio)
- [Modelproviders](/nl/concepts/model-providers)
