---
read_when:
    - Vuoi usare i modelli Grok in OpenClaw
    - Stai configurando l'autenticazione xAI o gli id dei modelli
summary: Usa i modelli xAI Grok in OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-24T08:59:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf125767e3123d6fbf000825323dc736712feea65582c1db9f7ffccc2bc20bb4
    source_path: providers/xai.md
    workflow: 15
---

OpenClaw include un Plugin provider `xai` bundle per i modelli Grok.

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
OpenClaw usa la xAI Responses API come trasporto xAI bundle. La stessa
`XAI_API_KEY` può anche alimentare `web_search` supportata da Grok, `x_search`
di prima classe e `code_execution` remoto.
Se memorizzi una chiave xAI sotto `plugins.entries.xai.config.webSearch.apiKey`,
anche il provider di modelli xAI bundle riusa quella chiave come fallback.
La configurazione di `code_execution` si trova sotto `plugins.entries.xai.config.codeExecution`.
</Note>

## Catalogo integrato

OpenClaw include queste famiglie di modelli xAI pronte all'uso:

| Famiglia       | ID modello                                                               |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Il Plugin risolve anche in forward id `grok-4*` e `grok-code-fast*` più recenti quando
seguono la stessa forma API.

<Tip>
`grok-4-fast`, `grok-4-1-fast` e le varianti `grok-4.20-beta-*` sono gli
attuali ref Grok con capacità immagine nel catalogo bundle.
</Tip>

## Copertura delle funzionalità OpenClaw

Il Plugin bundle mappa l'attuale superficie API pubblica di xAI sui contratti
condivisi di provider e strumenti di OpenClaw. Le capacità che non si adattano al contratto condiviso
(per esempio TTS in streaming e voce realtime) non vengono esposte — vedi la tabella
qui sotto.

| Capacità xAI                | Superficie OpenClaw                     | Stato                                                              |
| --------------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| Chat / Responses            | provider di modelli `xai/<model>`      | Sì                                                                 |
| Ricerca web lato server     | provider `web_search` `grok`           | Sì                                                                 |
| Ricerca X lato server       | strumento `x_search`                   | Sì                                                                 |
| Esecuzione di codice lato server | strumento `code_execution`         | Sì                                                                 |
| Immagini                    | `image_generate`                       | Sì                                                                 |
| Video                       | `video_generate`                       | Sì                                                                 |
| Text-to-speech batch        | `messages.tts.provider: "xai"` / `tts` | Sì                                                                 |
| TTS in streaming            | —                                      | Non esposto; il contratto TTS di OpenClaw restituisce buffer audio completi |
| Speech-to-text batch        | `tools.media.audio` / comprensione multimediale | Sì                                                         |
| Speech-to-text in streaming | Voice Call `streaming.provider: "xai"` | Sì                                                                 |
| Voce realtime               | —                                      | Non ancora esposta; contratto di sessione/WebSocket diverso        |
| File / batch                | Solo compatibilità con API modello generico | Non è uno strumento OpenClaw di prima classe                   |

<Note>
OpenClaw usa le API REST xAI per immagini/video/TTS/STT per generazione media,
voce e trascrizione batch, il WebSocket STT in streaming di xAI per la
trascrizione live delle voice call e la Responses API per gli strumenti di modello, ricerca e
esecuzione di codice. Le funzionalità che richiedono contratti OpenClaw diversi, come le
sessioni vocali Realtime, sono documentate qui come capacità upstream invece di essere un comportamento nascosto del Plugin.
</Note>

### Mappature della modalità fast

`/fast on` oppure `agents.defaults.models["xai/<model>"].params.fastMode: true`
riscrive le richieste xAI native come segue:

| Modello sorgente | Target modalità fast |
| ---------------- | -------------------- |
| `grok-3`         | `grok-3-fast`        |
| `grok-3-mini`    | `grok-3-mini-fast`   |
| `grok-4`         | `grok-4-fast`        |
| `grok-4-0709`    | `grok-4-fast`        |

### Alias legacy di compatibilità

Gli alias legacy continuano a normalizzarsi agli id canonici bundle:

| Alias legacy              | ID canonico                           |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Funzionalità

<AccordionGroup>
  <Accordion title="Ricerca web">
    Anche il provider bundle `grok` per la ricerca web usa `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generazione video">
    Il Plugin `xai` bundle registra la generazione video tramite lo
    strumento condiviso `video_generate`.

    - Modello video predefinito: `xai/grok-imagine-video`
    - Modalità: text-to-video, image-to-video, modifica video remota ed estensione video remota
    - Rapporti d'aspetto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Risoluzioni: `480P`, `720P`
    - Durata: 1-15 secondi per generazione/image-to-video, 2-10 secondi per estensione

    <Warning>
    I buffer video locali non sono accettati. Usa URL remoti `http(s)` per
    input di modifica/estensione video. Image-to-video accetta buffer immagine locali perché
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
    Vedi [Generazione video](/it/tools/video-generation) per i parametri condivisi dello strumento,
    la selezione del provider e il comportamento di failover.
    </Note>

  </Accordion>

  <Accordion title="Generazione immagini">
    Il Plugin `xai` bundle registra la generazione immagini tramite lo
    strumento condiviso `image_generate`.

    - Modello immagine predefinito: `xai/grok-imagine-image`
    - Modello aggiuntivo: `xai/grok-imagine-image-pro`
    - Modalità: text-to-image e modifica con immagine di riferimento
    - Input di riferimento: una `image` oppure fino a cinque `images`
    - Rapporti d'aspetto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Risoluzioni: `1K`, `2K`
    - Conteggio: fino a 4 immagini

    OpenClaw chiede a xAI risposte immagine `b64_json` in modo che i media generati possano essere
    archiviati e consegnati tramite il normale percorso degli allegati del canale. Le immagini
    locali di riferimento vengono convertite in data URL; i riferimenti remoti `http(s)` vengono
    inoltrati direttamente.

    Per usare xAI come provider immagine predefinito:

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
    come `1:2`, `2:1`, `9:20` e `20:9`. OpenClaw oggi inoltra solo i
    controlli immagine condivisi cross-provider; le manopole non supportate solo-native
    non vengono intenzionalmente esposte tramite `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Il Plugin `xai` bundle registra il text-to-speech tramite la superficie condivisa
    del provider `tts`.

    - Voci: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Voce predefinita: `eve`
    - Formati: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Lingua: codice BCP-47 o `auto`
    - Velocità: override della velocità nativa del provider
    - Il formato nativo Opus per note vocali non è supportato

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
    OpenClaw usa l'endpoint batch xAI `/v1/tts`. xAI offre anche TTS in streaming
    via WebSocket, ma il contratto del provider vocale di OpenClaw al momento si aspetta
    un buffer audio completo prima della consegna della risposta.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Il Plugin `xai` bundle registra lo speech-to-text batch tramite la
    superficie di trascrizione per la comprensione multimediale di OpenClaw.

    - Modello predefinito: `grok-stt`
    - Endpoint: xAI REST `/v1/stt`
    - Percorso di input: upload multipart del file audio
    - Supportato da OpenClaw ovunque la trascrizione audio in ingresso usi
      `tools.media.audio`, inclusi i segmenti dei canali vocali Discord e
      gli allegati audio dei canali

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

    La lingua può essere fornita tramite la configurazione multimediale audio condivisa o tramite la
    richiesta di trascrizione per chiamata. Gli hint di prompt sono accettati dalla superficie
    condivisa di OpenClaw, ma l'integrazione REST STT xAI inoltra solo file, modello e
    lingua perché questi mappano in modo pulito all'attuale endpoint pubblico xAI.

  </Accordion>

  <Accordion title="Speech-to-text in streaming">
    Il Plugin `xai` bundle registra anche un provider di trascrizione realtime
    per l'audio live delle voice call.

    - Endpoint: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Codifica predefinita: `mulaw`
    - Sample rate predefinito: `8000`
    - Endpointing predefinito: `800ms`
    - Trascrizioni intermedie: abilitate per impostazione predefinita

    Lo stream multimediale Twilio di Voice Call invia frame audio G.711 µ-law, quindi il
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

    La configurazione posseduta dal provider si trova sotto
    `plugins.entries.voice-call.config.streaming.providers.xai`. Le chiavi
    supportate sono `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` o
    `alaw`), `interimResults`, `endpointingMs` e `language`.

    <Note>
    Questo provider streaming è per il percorso di trascrizione realtime di Voice Call.
    La voce Discord attualmente registra segmenti brevi e usa invece il percorso batch
    di trascrizione `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Configurazione di x_search">
    Il Plugin xAI bundle espone `x_search` come strumento OpenClaw per cercare
    contenuti su X (ex Twitter) tramite Grok.

    Percorso di configurazione: `plugins.entries.xai.config.xSearch`

    | Chiave             | Tipo    | Predefinito        | Descrizione                         |
    | ------------------ | ------- | ------------------ | ----------------------------------- |
    | `enabled`          | boolean | —                  | Abilita o disabilita x_search       |
    | `model`            | string  | `grok-4-1-fast`    | Modello usato per le richieste x_search |
    | `inlineCitations`  | boolean | —                  | Include citazioni inline nei risultati |
    | `maxTurns`         | number  | —                  | Numero massimo di turni della conversazione |
    | `timeoutSeconds`   | number  | —                  | Timeout della richiesta in secondi  |
    | `cacheTtlMinutes`  | number  | —                  | Time-to-live della cache in minuti  |

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

  <Accordion title="Configurazione di code_execution">
    Il Plugin xAI bundle espone `code_execution` come strumento OpenClaw per
    l'esecuzione remota di codice nell'ambiente sandbox di xAI.

    Percorso di configurazione: `plugins.entries.xai.config.codeExecution`

    | Chiave             | Tipo    | Predefinito                 | Descrizione                            |
    | ------------------ | ------- | --------------------------- | -------------------------------------- |
    | `enabled`          | boolean | `true` (se la chiave è disponibile) | Abilita o disabilita l'esecuzione del codice |
    | `model`            | string  | `grok-4-1-fast`             | Modello usato per le richieste di esecuzione del codice |
    | `maxTurns`         | number  | —                           | Numero massimo di turni della conversazione |
    | `timeoutSeconds`   | number  | —                           | Timeout della richiesta in secondi     |

    <Note>
    Questa è esecuzione remota nella sandbox xAI, non [`exec`](/it/tools/exec) locale.
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
    - L'autenticazione oggi è solo con chiave API. In OpenClaw non esiste ancora un flusso xAI OAuth o device-code.
    - `grok-4.20-multi-agent-experimental-beta-0304` non è supportato sul
      normale percorso provider xAI perché richiede una superficie API upstream
      diversa dal trasporto xAI standard di OpenClaw.
    - La voce Realtime xAI non è ancora registrata come provider OpenClaw. Essa
      richiede un contratto di sessione vocale bidirezionale diverso dal STT batch o
      dalla trascrizione streaming.
    - `quality` immagine xAI, `mask` immagine e rapporti d'aspetto extra solo-native
      non vengono esposti finché lo strumento condiviso `image_generate` non avrà controlli cross-provider corrispondenti.
  </Accordion>

  <Accordion title="Note avanzate">
    - OpenClaw applica automaticamente correzioni di compatibilità specifiche xAI per schema e chiamata degli strumenti
      sul percorso del runner condiviso.
    - Le richieste xAI native usano per impostazione predefinita `tool_stream: true`. Imposta
      `agents.defaults.models["xai/<model>"].params.tool_stream` su `false` per
      disabilitarlo.
    - Il wrapper xAI bundle rimuove i flag rigorosi non supportati dello schema degli strumenti e
      le chiavi del payload di reasoning prima di inviare richieste xAI native.
    - `web_search`, `x_search` e `code_execution` sono esposti come strumenti OpenClaw.
      OpenClaw abilita lo specifico built-in xAI necessario dentro ogni richiesta di tool
      invece di collegare tutti gli strumenti nativi a ogni turno di chat.
    - `x_search` e `code_execution` sono di proprietà del Plugin xAI bundle invece di essere hardcoded nel runtime core del modello.
    - `code_execution` è esecuzione remota nella sandbox xAI, non
      [`exec`](/it/tools/exec) locale.
  </Accordion>
</AccordionGroup>

## Test live

I percorsi media xAI sono coperti da test unitari e suite live opt-in. I comandi
live caricano i secret dalla tua shell di login, incluso `~/.profile`, prima di
verificare `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Il file live specifico del provider sintetizza TTS normale, TTS PCM adatto alla
telefonia, trascrive audio tramite xAI batch STT, trasmette lo stesso PCM tramite xAI
realtime STT, genera output text-to-image e modifica un'immagine di riferimento. Il
file live immagine condiviso verifica lo stesso provider xAI tramite la selezione
runtime di OpenClaw, fallback, normalizzazione e percorso degli allegati multimediali.

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, model ref e comportamento di failover.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Tutti i provider" href="/it/providers/index" icon="grid-2">
    La panoramica più ampia dei provider.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e relative soluzioni.
  </Card>
</CardGroup>
