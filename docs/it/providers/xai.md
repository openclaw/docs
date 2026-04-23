---
read_when:
    - Vuoi usare i modelli Grok in OpenClaw
    - Stai configurando l'autenticazione xAI o gli id dei modelli
summary: Usare i modelli xAI Grok in OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-23T08:35:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a9fd184bab6f7ab363487332752141212a89c7380f6f91a659c78bcc470c9b
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw include un plugin provider `xai` per i modelli Grok.

## Per iniziare

<Steps>
  <Step title="Crea una chiave API">
    Crea una chiave API nella [console xAI](https://console.x.ai/).
  </Step>
  <Step title="Imposta la tua chiave API">
    Imposta `XAI_API_KEY`, oppure esegui:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Scegli un modello">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw usa la xAI Responses API come trasporto xAI incluso. La stessa
`XAI_API_KEY` può anche alimentare `web_search` supportato da Grok, `x_search`
di prima classe e `code_execution` remoto.
Se memorizzi una chiave xAI in `plugins.entries.xai.config.webSearch.apiKey`,
anche il provider di modelli xAI incluso riutilizza quella chiave come fallback.
La configurazione di `code_execution` si trova in `plugins.entries.xai.config.codeExecution`.
</Note>

## Catalogo modelli incluso

OpenClaw include queste famiglie di modelli xAI già pronte all'uso:

| Famiglia       | Id modello                                                               |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Il plugin risolve in forward anche gli id più recenti `grok-4*` e `grok-code-fast*` quando
seguono la stessa forma API.

<Tip>
`grok-4-fast`, `grok-4-1-fast` e le varianti `grok-4.20-beta-*` sono gli
attuali ref Grok con supporto immagini nel catalogo incluso.
</Tip>

## Copertura delle funzionalità OpenClaw

Il plugin incluso mappa l'attuale superficie API pubblica di xAI sui contratti condivisi di
provider e strumenti di OpenClaw dove il comportamento si adatta in modo pulito.

| Capacità xAI               | Superficie OpenClaw                       | Stato                                                               |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | provider di modelli `xai/<model>`         | Sì                                                                  |
| Ricerca web lato server    | provider `web_search` `grok`              | Sì                                                                  |
| Ricerca X lato server      | strumento `x_search`                      | Sì                                                                  |
| Esecuzione codice lato server | strumento `code_execution`              | Sì                                                                  |
| Immagini                   | `image_generate`                          | Sì                                                                  |
| Video                      | `video_generate`                          | Sì                                                                  |
| Text-to-speech batch       | `messages.tts.provider: "xai"` / `tts`    | Sì                                                                  |
| TTS in streaming           | —                                         | Non esposto; il contratto TTS di OpenClaw restituisce buffer audio completi |
| Speech-to-text batch       | `tools.media.audio` / media understanding | Sì                                                                  |
| Speech-to-text in streaming | Voice Call `streaming.provider: "xai"`   | Sì                                                                  |
| Voce realtime              | —                                         | Non ancora esposto; contratto diverso di sessione/WebSocket         |
| File / batch               | Solo compatibilità generica con l'API dei modelli | Non è uno strumento OpenClaw di prima classe                  |

<Note>
OpenClaw usa le API REST di xAI per immagini/video/TTS/STT per generazione media,
speech e trascrizione batch, il WebSocket STT in streaming di xAI per la trascrizione live
delle chiamate vocali, e la Responses API per strumenti di modello, ricerca e
esecuzione del codice. Le funzionalità che richiedono contratti OpenClaw diversi, come
le sessioni vocali realtime, sono documentate qui come capacità upstream invece di
essere nascoste come comportamento del plugin.
</Note>

### Mappature della modalità rapida

`/fast on` oppure `agents.defaults.models["xai/<model>"].params.fastMode: true`
riscrive le richieste xAI native come segue:

| Modello sorgente | Destinazione fast-mode |
| ---------------- | ---------------------- |
| `grok-3`         | `grok-3-fast`          |
| `grok-3-mini`    | `grok-3-mini-fast`     |
| `grok-4`         | `grok-4-fast`          |
| `grok-4-0709`    | `grok-4-fast`          |

### Alias di compatibilità legacy

Gli alias legacy continuano a normalizzarsi agli id canonici inclusi:

| Alias legacy              | Id canonico                           |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Funzionalità

<AccordionGroup>
  <Accordion title="Ricerca web">
    Il provider `grok` di ricerca web incluso usa anch'esso `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generazione video">
    Il plugin `xai` incluso registra la generazione video tramite lo
    strumento condiviso `video_generate`.

    - Modello video predefinito: `xai/grok-imagine-video`
    - Modalità: text-to-video, image-to-video, modifica video remota ed estensione
      video remota
    - Rapporti d'aspetto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Risoluzioni: `480P`, `720P`
    - Durata: 1-15 secondi per generazione/image-to-video, 2-10 secondi per
      estensione

    <Warning>
    I buffer video locali non sono accettati. Usa URL remoti `http(s)` per
    gli input di modifica/estensione video. Image-to-video accetta buffer di immagini locali perché
    OpenClaw può codificarli come data URL per xAI.
    </Warning>

    Per usare xAI come provider video predefinito:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    Vedi [Video Generation](/it/tools/video-generation) per i parametri condivisi dello strumento,
    la selezione del provider e il comportamento di failover.
    </Note>

  </Accordion>

  <Accordion title="Generazione immagini">
    Il plugin `xai` incluso registra la generazione di immagini tramite lo
    strumento condiviso `image_generate`.

    - Modello immagine predefinito: `xai/grok-imagine-image`
    - Modello aggiuntivo: `xai/grok-imagine-image-pro`
    - Modalità: text-to-image e modifica con immagine di riferimento
    - Input di riferimento: una `image` o fino a cinque `images`
    - Rapporti d'aspetto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Risoluzioni: `1K`, `2K`
    - Quantità: fino a 4 immagini

    OpenClaw chiede a xAI risposte immagine `b64_json` così i media generati possono essere
    archiviati e consegnati tramite il normale percorso degli allegati del canale. Le
    immagini di riferimento locali vengono convertite in data URL; i riferimenti remoti `http(s)` vengono
    inoltrati così come sono.

    Per usare xAI come provider di immagini predefinito:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI documenta anche `quality`, `mask`, `user` e rapporti nativi aggiuntivi
    come `1:2`, `2:1`, `9:20` e `20:9`. Oggi OpenClaw inoltra solo i
    controlli immagine condivisi cross-provider; le opzioni native non supportate
    vengono intenzionalmente non esposte tramite `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Il plugin `xai` incluso registra il text-to-speech tramite la superficie
    condivisa del provider `tts`.

    - Voci: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Voce predefinita: `eve`
    - Formati: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Lingua: codice BCP-47 oppure `auto`
    - Velocità: override della velocità nativa del provider
    - Il formato di nota vocale Opus nativo non è supportato

    Per usare xAI come provider TTS predefinito:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw usa l'endpoint batch `/v1/tts` di xAI. xAI offre anche TTS in streaming
    su WebSocket, ma il contratto del provider speech di OpenClaw attualmente si aspetta
    un buffer audio completo prima della consegna della risposta.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Il plugin `xai` incluso registra lo speech-to-text batch tramite la
    superficie di trascrizione media-understanding di OpenClaw.

    - Modello predefinito: `grok-stt`
    - Endpoint: xAI REST `/v1/stt`
    - Percorso di input: upload di file audio multipart
    - Supportato da OpenClaw ovunque la trascrizione audio in ingresso usi
      `tools.media.audio`, inclusi segmenti dei canali vocali Discord e
      allegati audio dei canali

    Per forzare xAI per la trascrizione audio in ingresso:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    La lingua può essere fornita tramite la configurazione condivisa dei media audio o per richiesta
    di trascrizione. I suggerimenti di prompt sono accettati dalla superficie condivisa di OpenClaw,
    ma l'integrazione REST STT di xAI inoltra solo file, modello e
    lingua perché questi corrispondono in modo pulito all'attuale endpoint pubblico di xAI.

  </Accordion>

  <Accordion title="Speech-to-text in streaming">
    Il plugin `xai` incluso registra anche un provider di trascrizione realtime
    per l'audio live delle chiamate vocali.

    - Endpoint: WebSocket xAI `wss://api.x.ai/v1/stt`
    - Codifica predefinita: `mulaw`
    - Frequenza di campionamento predefinita: `8000`
    - Endpointing predefinito: `800ms`
    - Trascrizioni intermedie: abilitate per impostazione predefinita

    Lo stream media Twilio di Voice Call invia frame audio G.711 µ-law, quindi il
    provider xAI può inoltrare direttamente quei frame senza transcodifica:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    La configurazione posseduta dal provider si trova in
    `plugins.entries.voice-call.config.streaming.providers.xai`. Le
    chiavi supportate sono `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` oppure
    `alaw`), `interimResults`, `endpointingMs` e `language`.

    <Note>
    Questo provider di streaming è per il percorso di trascrizione realtime di Voice Call.
    La voce Discord attualmente registra segmenti brevi e usa invece il percorso batch di
    trascrizione `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Configurazione di x_search">
    Il plugin xAI incluso espone `x_search` come strumento OpenClaw per cercare
    contenuti su X (ex Twitter) tramite Grok.

    Percorso di configurazione: `plugins.entries.xai.config.xSearch`

    | Chiave             | Tipo    | Predefinito        | Descrizione                            |
    | ------------------ | ------- | ------------------ | -------------------------------------- |
    | `enabled`          | boolean | —                  | Abilita o disabilita `x_search`        |
    | `model`            | string  | `grok-4-1-fast`    | Modello usato per le richieste `x_search` |
    | `inlineCitations`  | boolean | —                  | Include citazioni inline nei risultati |
    | `maxTurns`         | number  | —                  | Numero massimo di turni di conversazione |
    | `timeoutSeconds`   | number  | —                  | Timeout della richiesta in secondi     |
    | `cacheTtlMinutes`  | number  | —                  | Time-to-live della cache in minuti     |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Configurazione di Code execution">
    Il plugin xAI incluso espone `code_execution` come strumento OpenClaw per
    esecuzione remota del codice nell'ambiente sandbox di xAI.

    Percorso di configurazione: `plugins.entries.xai.config.codeExecution`

    | Chiave            | Tipo    | Predefinito                | Descrizione                                  |
    | ----------------- | ------- | -------------------------- | -------------------------------------------- |
    | `enabled`         | boolean | `true` (se la chiave è disponibile) | Abilita o disabilita code execution |
    | `model`           | string  | `grok-4-1-fast`            | Modello usato per le richieste di code execution |
    | `maxTurns`        | number  | —                          | Numero massimo di turni di conversazione     |
    | `timeoutSeconds`  | number  | —                          | Timeout della richiesta in secondi           |

    <Note>
    Questa è esecuzione remota nel sandbox xAI, non [`exec`](/it/tools/exec) locale.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Limiti noti">
    - L'autenticazione oggi è solo tramite chiave API. In
      OpenClaw non esiste ancora un flusso xAI OAuth o con codice dispositivo.
    - `grok-4.20-multi-agent-experimental-beta-0304` non è supportato nel
      normale percorso del provider xAI perché richiede una superficie API upstream
      diversa dal trasporto xAI standard di OpenClaw.
    - La voce Realtime di xAI non è ancora registrata come provider OpenClaw. Ha
      bisogno di un diverso contratto di sessione vocale bidirezionale rispetto a STT batch o
      trascrizione in streaming.
    - `quality` immagine xAI, `mask` immagine e rapporti d'aspetto aggiuntivi solo nativi non sono
      esposti finché lo strumento condiviso `image_generate` non avrà i corrispondenti
      controlli cross-provider.
  </Accordion>

  <Accordion title="Note avanzate">
    - OpenClaw applica automaticamente fix di compatibilità specifici xAI per schema degli strumenti e chiamate agli strumenti
      sul percorso shared runner.
    - Le richieste xAI native usano per impostazione predefinita `tool_stream: true`. Imposta
      `agents.defaults.models["xai/<model>"].params.tool_stream` su `false` per
      disabilitarlo.
    - Il wrapper xAI incluso rimuove flag strict dello schema degli strumenti non supportati e
      chiavi del payload di ragionamento prima di inviare richieste xAI native.
    - `web_search`, `x_search` e `code_execution` sono esposti come strumenti
      OpenClaw. OpenClaw abilita il built-in xAI specifico di cui ha bisogno dentro ogni richiesta di strumento
      invece di allegare tutti gli strumenti nativi a ogni turno di chat.
    - `x_search` e `code_execution` sono posseduti dal plugin xAI incluso invece di
      essere hardcodati nel runtime core del modello.
    - `code_execution` è esecuzione remota nel sandbox xAI, non
      [`exec`](/it/tools/exec) locale.
  </Accordion>
</AccordionGroup>

## Test live

I percorsi media xAI sono coperti da test unitari e suite live opt-in. I comandi
live caricano i secret dalla tua shell di login, incluso `~/.profile`, prima di
controllare `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Il file live specifico del provider sintetizza TTS normale, TTS PCM adatto alla
telefonia, trascrive audio tramite STT batch xAI, trasmette lo stesso PCM tramite STT realtime xAI,
genera output text-to-image e modifica un'immagine di riferimento. Il
file live condiviso delle immagini verifica lo stesso provider xAI tramite la
selezione runtime di OpenClaw, il fallback, la normalizzazione e il percorso degli allegati media.

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei model ref e comportamento di failover.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri dello strumento video condiviso e selezione del provider.
  </Card>
  <Card title="Tutti i provider" href="/it/providers/index" icon="grid-2">
    La panoramica più ampia dei provider.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e correzioni.
  </Card>
</CardGroup>
