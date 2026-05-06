---
read_when:
    - Vuoi la trascrizione vocale SenseAudio per gli allegati audio
    - È necessaria la variabile d'ambiente per la chiave API di SenseAudio o il percorso della configurazione audio
summary: Trascrizione batch da parlato a testo di SenseAudio per note vocali in entrata
title: SenseAudio
x-i18n:
    generated_at: "2026-05-06T09:06:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: f53af21c746cdd44c71485cbad669f4a01a6e5be956675c73831e7b5f15df8c4
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio può trascrivere audio in ingresso e allegati di note vocali tramite la pipeline condivisa `tools.media.audio` di OpenClaw. OpenClaw invia audio multipart all'endpoint di trascrizione compatibile con OpenAI e inserisce il testo restituito come `{{Transcript}}` più un blocco `[Audio]`.

| Proprietà         | Valore                                           |
| ----------------- | ------------------------------------------------ |
| ID provider       | `senseaudio`                                     |
| Plugin            | integrato, `enabledByDefault: true`              |
| Contratto         | `mediaUnderstandingProviders` (audio)            |
| Variabile env auth | `SENSEAUDIO_API_KEY`                            |
| Modello predefinito | `senseaudio-asr-pro-1.5-260319`                |
| URL predefinito   | `https://api.senseaudio.cn/v1`                   |
| Sito web          | [senseaudio.cn](https://senseaudio.cn)           |
| Documentazione    | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## Per iniziare

<Steps>
  <Step title="Imposta la tua chiave API">
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
    l'audio su SenseAudio e usa la trascrizione nella pipeline di risposta.
  </Step>
</Steps>

## Opzioni

| Opzione    | Percorso                              | Descrizione                                 |
| ---------- | ------------------------------------- | ------------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | ID modello ASR SenseAudio                   |
| `language` | `tools.media.audio.models[].language` | Indicazione facoltativa della lingua        |
| `prompt`   | `tools.media.audio.prompt`            | Prompt di trascrizione facoltativo          |
| `baseUrl`  | `tools.media.audio.baseUrl` or model  | Sovrascrive la base compatibile con OpenAI |
| `headers`  | `tools.media.audio.request.headers`   | Header di richiesta aggiuntivi              |

<Note>
SenseAudio è solo STT batch in OpenClaw. La trascrizione in tempo reale delle Voice Call
continua a usare provider con supporto STT in streaming.
</Note>

## Correlati

- [Comprensione dei media (audio)](/it/nodes/audio)
- [Provider di modelli](/it/concepts/model-providers)
