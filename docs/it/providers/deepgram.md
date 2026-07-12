---
read_when:
    - Vuoi usare la trascrizione vocale di Deepgram per gli allegati audio
    - Desideri la trascrizione in streaming di Deepgram per le chiamate vocali
    - Ti serve un rapido esempio di configurazione di Deepgram
summary: Trascrizione con Deepgram per i messaggi vocali in entrata
title: Deepgram
x-i18n:
    generated_at: "2026-07-12T07:24:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b0f407829ba47344ad92c5fe63aacd0ce234909c439c96370e7bd900cadff8b
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram è un'API di conversione da voce a testo. OpenClaw la utilizza per la trascrizione
dell'audio in ingresso e delle note vocali tramite `tools.media.audio` e per lo STT in streaming
delle chiamate vocali tramite `plugins.entries.voice-call.config.streaming`.

La trascrizione in batch carica il file audio completo su Deepgram e inserisce
la trascrizione nella pipeline di risposta (`{{Transcript}}` + blocco `[Audio]`).
Lo streaming delle chiamate vocali inoltra in tempo reale i frame G.711 u-law tramite
l'endpoint WebSocket `listen` di Deepgram ed emette trascrizioni parziali e finali
man mano che Deepgram le restituisce.

| Dettaglio          | Valore                                                     |
| ------------------ | ---------------------------------------------------------- |
| Sito web           | [deepgram.com](https://deepgram.com)                       |
| Documentazione     | [developers.deepgram.com](https://developers.deepgram.com) |
| Autenticazione     | `DEEPGRAM_API_KEY`                                         |
| Modello predefinito | `nova-3`                                                  |

## Guida introduttiva

<Steps>
  <Step title="Imposta la chiave API">
    ```bash
    DEEPGRAM_API_KEY=dg_...
    ```
  </Step>
  <Step title="Abilita il provider audio">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Invia una nota vocale">
    Invia un messaggio audio tramite qualsiasi canale connesso. OpenClaw lo trascrive
    tramite Deepgram e inserisce la trascrizione nella pipeline di risposta.
  </Step>
</Steps>

## Opzioni di configurazione

| Opzione    | Percorso                              | Descrizione                                     |
| ---------- | ------------------------------------- | ----------------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | ID del modello Deepgram (predefinito: `nova-3`) |
| `language` | `tools.media.audio.models[].language` | Indicazione della lingua (facoltativa)           |

`providerOptions.deepgram` integra parametri di query aggiuntivi direttamente nella
richiesta `/listen` di Deepgram, quindi è possibile utilizzare qualsiasi nome di parametro
supportato da Deepgram (ad esempio `detect_language`, `punctuate`, `smart_format`):

<Tabs>
  <Tab title="Con indicazione della lingua">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Con opzioni Deepgram">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## STT in streaming delle chiamate vocali

Il Plugin `deepgram` incluso registra anche un provider di trascrizione in tempo reale
per il Plugin delle chiamate vocali.

| Impostazione       | Percorso di configurazione                                               | Valore predefinito                     |
| ------------------ | ------------------------------------------------------------------------ | -------------------------------------- |
| Chiave API         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey`  | Utilizza in alternativa `DEEPGRAM_API_KEY` |
| Modello            | `...deepgram.model`                                                      | `nova-3`                               |
| Lingua             | `...deepgram.language`                                                   | (non impostata)                        |
| Codifica           | `...deepgram.encoding`                                                   | `mulaw`                                |
| Frequenza di campionamento | `...deepgram.sampleRate`                                         | `8000`                                 |
| Rilevamento della fine del parlato | `...deepgram.endpointingMs`                                | `800`                                  |
| Risultati intermedi | `...deepgram.interimResults`                                            | `true`                                 |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Le chiamate vocali ricevono l'audio telefonico come G.711 u-law a 8 kHz. Il provider
di streaming Deepgram utilizza per impostazione predefinita `encoding: "mulaw"` e
`sampleRate: 8000`, quindi i frame multimediali di Twilio possono essere inoltrati direttamente.
</Note>

## Note

<AccordionGroup>
  <Accordion title="Autenticazione">
    L'autenticazione segue l'ordine standard di autenticazione dei provider. `DEEPGRAM_API_KEY` è
    il percorso più semplice.
  </Accordion>
  <Accordion title="Proxy ed endpoint personalizzati">
    Quando utilizzi un proxy, sostituisci gli endpoint o le intestazioni tramite
    `tools.media.audio.baseUrl` e `tools.media.audio.headers`.
  </Accordion>
  <Accordion title="Comportamento dell'output">
    L'output segue le stesse regole audio degli altri provider (limiti di dimensione, timeout,
    inserimento della trascrizione).
  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Strumenti multimediali" href="/it/tools/media-overview" icon="photo-film">
    Panoramica della pipeline di elaborazione di audio, immagini e video.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione, incluse le impostazioni degli strumenti multimediali.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e passaggi per il debug.
  </Card>
  <Card title="Domande frequenti" href="/it/help/faq" icon="circle-question">
    Domande frequenti sulla configurazione di OpenClaw.
  </Card>
</CardGroup>
