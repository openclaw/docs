---
read_when:
    - Vuoi usare la conversione da voce a testo di SenseAudio per gli allegati audio
    - È necessaria la variabile d’ambiente della chiave API SenseAudio o il percorso di configurazione audio
summary: Trascrizione vocale batch con SenseAudio per i messaggi vocali in entrata
title: SenseAudio
x-i18n:
    generated_at: "2026-07-12T07:28:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio trascrive l'audio in ingresso e gli allegati delle note vocali tramite la pipeline condivisa `tools.media.audio` di OpenClaw. OpenClaw invia l'audio in formato multipart all'endpoint di trascrizione compatibile con OpenAI e inserisce il testo restituito come `{{Transcript}}`, oltre a un blocco `[Audio]`.

| Proprietà            | Valore                                           |
| -------------------- | ------------------------------------------------ |
| ID del provider      | `senseaudio`                                     |
| Plugin               | incluso, `enabledByDefault: true`                |
| Contratto            | `mediaUnderstandingProviders` (audio)            |
| Variabile di ambiente per l'autenticazione | `SENSEAUDIO_API_KEY`          |
| Modello predefinito  | `senseaudio-asr-pro-1.5-260319`                  |
| URL predefinito      | `https://api.senseaudio.cn/v1`                   |
| Sito web             | [senseaudio.cn](https://senseaudio.cn)           |
| Documentazione       | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## Guida introduttiva

<Steps>
  <Step title="Imposta la chiave API">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Abilita il provider audio">
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
  <Step title="Invia una nota vocale">
    Invia un messaggio audio tramite qualsiasi canale connesso. OpenClaw carica
    l'audio su SenseAudio e utilizza la trascrizione nella pipeline di risposta.
  </Step>
</Steps>

## Opzioni

| Opzione    | Percorso                              | Descrizione                               |
| ---------- | ------------------------------------- | ----------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | ID del modello ASR di SenseAudio          |
| `language` | `tools.media.audio.models[].language` | Indicazione facoltativa della lingua      |
| `prompt`   | `tools.media.audio.prompt`            | Prompt facoltativo per la trascrizione    |
| `baseUrl`  | `tools.media.audio.baseUrl` o modello | Sostituisce la base compatibile con OpenAI |
| `headers`  | `tools.media.audio.request.headers`   | Intestazioni aggiuntive della richiesta   |

<Note>
In OpenClaw, SenseAudio supporta solo la conversione batch da voce a testo. La trascrizione
in tempo reale delle chiamate vocali continua a utilizzare provider che supportano lo STT in streaming.
</Note>

## Contenuti correlati

- [Comprensione dei contenuti multimediali (audio)](/it/nodes/audio)
- [Provider di modelli](/it/concepts/model-providers)
