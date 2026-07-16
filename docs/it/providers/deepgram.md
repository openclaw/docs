---
read_when:
    - Si desidera utilizzare la trascrizione vocale di Deepgram per gli allegati audio
    - Si desidera la trascrizione in streaming di Deepgram per Voice Call
    - Ti serve un rapido esempio di configurazione di Deepgram
summary: Trascrizione Deepgram per i messaggi vocali in arrivo
title: Deepgram
x-i18n:
    generated_at: "2026-07-16T14:51:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 74652e089899423d117dae6267e7c9af09e52ec91ee15e3532fcb2d705f43099
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram è un'API di conversione da voce a testo. OpenClaw la utilizza per la trascrizione
dell'audio in ingresso e delle note vocali tramite `tools.media.audio` e per lo STT in streaming delle chiamate vocali
tramite `plugins.entries.voice-call.config.streaming`.

La trascrizione in batch carica il file audio completo su Deepgram e inserisce
la trascrizione nella pipeline di risposta (blocco `{{Transcript}}` + `[Audio]`).
Lo streaming delle chiamate vocali inoltra in tempo reale i frame G.711 u-law tramite
l'endpoint WebSocket `listen` di Deepgram ed emette trascrizioni parziali e finali man mano che Deepgram
le restituisce.

| Dettaglio      | Valore                                                     |
| -------------- | ---------------------------------------------------------- |
| Sito web       | [deepgram.com](https://deepgram.com)                       |
| Documentazione | [developers.deepgram.com](https://developers.deepgram.com) |
| Autenticazione | `DEEPGRAM_API_KEY`                                         |
| Modello predefinito | `nova-3`                                    |

## Guida introduttiva

<Steps>
  <Step title="Impostare la chiave API">
    ```bash
    DEEPGRAM_API_KEY=dg_...
    ```
  </Step>
  <Step title="Abilitare il provider audio">
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
  <Step title="Inviare una nota vocale">
    Inviare un messaggio audio tramite qualsiasi canale connesso. OpenClaw lo trascrive
    tramite Deepgram e inserisce la trascrizione nella pipeline di risposta.
  </Step>
</Steps>

## Opzioni di configurazione

| Opzione    | Percorso                              | Descrizione                           |
| ---------- | ------------------------------------- | ------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | ID del modello Deepgram (predefinito: `nova-3`) |
| `language` | `tools.media.audio.models[].language` | Indicazione della lingua (facoltativa) |

`providerOptions.deepgram` unisce i parametri di query aggiuntivi direttamente nella
richiesta `/listen` di Deepgram, pertanto è possibile usare qualsiasi nome di parametro supportato da Deepgram
(ad esempio `detect_language`, `punctuate`, `smart_format`):

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

Il plugin `deepgram` incluso registra anche un provider di trascrizione in tempo reale
per il plugin delle chiamate vocali.

| Impostazione        | Percorso di configurazione                                                | Valore predefinito                           |
| ------------------- | ------------------------------------------------------------------------- | -------------------------------------------- |
| Chiave API          | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Ripiega su `DEEPGRAM_API_KEY`                |
| URL di base         | `...deepgram.baseUrl`                                                   | `DEEPGRAM_BASE_URL` o l'API pubblica di Deepgram |
| Modello             | `...deepgram.model`                                                     | `nova-3`                           |
| Lingua              | `...deepgram.language`                                                  | (non impostata)                              |
| Codifica            | `...deepgram.encoding`                                                  | `mulaw`                           |
| Frequenza di campionamento | `...deepgram.sampleRate`                                           | `8000`                           |
| Rilevamento del termine | `...deepgram.endpointingMs`                                               | `800`                           |
| Risultati intermedi | `...deepgram.interimResults`                                            | `true`                           |

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

Per un [endpoint personalizzato di Deepgram](https://developers.deepgram.com/reference/custom-endpoints),
impostare `baseUrl` sulla radice dell'endpoint, includendo qualsiasi percorso di base ma non `/listen`.
Gli endpoint in tempo reale accettano `http://`, `https://`, `ws://` e `wss://`. HTTP
viene convertito in WS, HTTPS in WSS, mentre gli schemi WebSocket espliciti rimangono invariati.
Gli URL non validi e gli altri schemi causano un errore durante la configurazione della sessione.

<Note>
Le chiamate vocali ricevono audio telefonico G.711 u-law a 8 kHz. Il provider di streaming
Deepgram utilizza per impostazione predefinita `encoding: "mulaw"` e `sampleRate: 8000`, pertanto
i frame multimediali di Twilio possono essere inoltrati direttamente.
</Note>

## Note

<AccordionGroup>
  <Accordion title="Autenticazione">
    L'autenticazione segue l'ordine standard di autenticazione dei provider. `DEEPGRAM_API_KEY` è
    il percorso più semplice.
  </Accordion>
  <Accordion title="Proxy ed endpoint personalizzati">
    Quando si utilizza un proxy, sostituire gli endpoint o le intestazioni con `tools.media.audio.baseUrl` e
    `tools.media.audio.headers`.
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
    Problemi comuni e procedure di debug.
  </Card>
  <Card title="Domande frequenti" href="/it/help/faq" icon="circle-question">
    Domande frequenti sulla configurazione di OpenClaw.
  </Card>
</CardGroup>
