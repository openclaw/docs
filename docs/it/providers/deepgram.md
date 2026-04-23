---
read_when:
    - Vuoi Deepgram speech-to-text per gli allegati audio
    - Vuoi la trascrizione in streaming Deepgram per Voice Call
    - Hai bisogno di un rapido esempio di configurazione Deepgram
summary: Trascrizione Deepgram per i messaggi vocali in ingresso
title: Deepgram
x-i18n:
    generated_at: "2026-04-23T08:34:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b05f0f436a723c6e7697612afa0f8cb7e2b84a722d4ec12fae9c0bece945407
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (Trascrizione audio)

Deepgram è un’API speech-to-text. In OpenClaw viene usata per la
trascrizione in ingresso di audio/messaggi vocali tramite `tools.media.audio` e per la
STT in streaming di Voice Call tramite `plugins.entries.voice-call.config.streaming`.

Per la trascrizione batch, OpenClaw carica il file audio completo su Deepgram
e inietta la trascrizione nella pipeline di risposta (`{{Transcript}}` +
blocco `[Audio]`). Per lo streaming di Voice Call, OpenClaw inoltra frame live G.711
u-law tramite l’endpoint WebSocket `listen` di Deepgram ed emette trascrizioni parziali o
finali man mano che Deepgram le restituisce.

| Dettaglio     | Valore                                                     |
| ------------- | ---------------------------------------------------------- |
| Sito web      | [deepgram.com](https://deepgram.com)                       |
| Documentazione | [developers.deepgram.com](https://developers.deepgram.com) |
| Autenticazione | `DEEPGRAM_API_KEY`                                        |
| Modello predefinito | `nova-3`                                             |

## Per iniziare

<Steps>
  <Step title="Imposta la tua chiave API">
    Aggiungi la tua chiave API Deepgram all’ambiente:

    ```
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
  <Step title="Invia un messaggio vocale">
    Invia un messaggio audio tramite qualsiasi canale connesso. OpenClaw lo trascrive
    tramite Deepgram e inietta la trascrizione nella pipeline di risposta.
  </Step>
</Steps>

## Opzioni di configurazione

| Opzione           | Percorso                                                     | Descrizione                              |
| ----------------- | ------------------------------------------------------------ | ---------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | ID modello Deepgram (predefinito: `nova-3`) |
| `language`        | `tools.media.audio.models[].language`                        | Hint della lingua (facoltativo)          |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | Abilita il rilevamento della lingua (facoltativo) |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | Abilita la punteggiatura (facoltativo)   |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | Abilita la formattazione intelligente (facoltativo) |

<Tabs>
  <Tab title="Con hint della lingua">
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

## STT in streaming di Voice Call

Il plugin bundled `deepgram` registra anche un provider di trascrizione realtime
per il plugin Voice Call.

| Impostazione    | Percorso config                                                        | Predefinito                      |
| --------------- | ---------------------------------------------------------------------- | -------------------------------- |
| Chiave API      | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Usa come fallback `DEEPGRAM_API_KEY` |
| Modello         | `...deepgram.model`                                                    | `nova-3`                         |
| Lingua          | `...deepgram.language`                                                 | (non impostata)                  |
| Encoding        | `...deepgram.encoding`                                                 | `mulaw`                          |
| Frequenza di campionamento | `...deepgram.sampleRate`                                      | `8000`                           |
| Endpointing     | `...deepgram.endpointingMs`                                            | `800`                            |
| Risultati intermedi | `...deepgram.interimResults`                                        | `true`                           |

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
Voice Call riceve audio telefonico come G.711 u-law a 8 kHz. Il
provider di streaming Deepgram usa per impostazione predefinita `encoding: "mulaw"` e `sampleRate: 8000`, quindi i frame media Twilio possono essere inoltrati direttamente.
</Note>

## Note

<AccordionGroup>
  <Accordion title="Autenticazione">
    L’autenticazione segue l’ordine standard di autenticazione dei provider. `DEEPGRAM_API_KEY` è
    il percorso più semplice.
  </Accordion>
  <Accordion title="Proxy ed endpoint personalizzati">
    Sostituisci endpoint o header con `tools.media.audio.baseUrl` e
    `tools.media.audio.headers` quando usi un proxy.
  </Accordion>
  <Accordion title="Comportamento dell’output">
    L’output segue le stesse regole audio degli altri provider (limiti di dimensione, timeout,
    iniezione della trascrizione).
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Strumenti media" href="/it/tools/media-overview" icon="photo-film">
    Panoramica della pipeline di elaborazione audio, immagini e video.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione, incluse le impostazioni degli strumenti media.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e passaggi di debug.
  </Card>
  <Card title="FAQ" href="/it/help/faq" icon="circle-question">
    Domande frequenti sulla configurazione di OpenClaw.
  </Card>
</CardGroup>
