---
read_when:
    - Vuoi usare i modelli Grok in OpenClaw
    - Stai configurando l'autenticazione xAI o gli ID dei modelli
summary: Usa i modelli xAI Grok in OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-25T18:22:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 420f60d5e80964b926e50cf74cf414d11de1c30d3a4aa8917f1861e0d56ef5b9
    source_path: providers/xai.md
    workflow: 15
---

OpenClaw include un Plugin provider `xai` integrato per i modelli Grok.

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
OpenClaw usa l'API xAI Responses come trasporto xAI integrato. La stessa
`XAI_API_KEY` può anche alimentare `web_search` basato su Grok, `x_search`
di prima classe e `code_execution` remoto.
Se archivi una chiave xAI in `plugins.entries.xai.config.webSearch.apiKey`,
anche il provider di modelli xAI integrato riutilizza quella chiave come fallback.
La configurazione di `code_execution` si trova in `plugins.entries.xai.config.codeExecution`.
</Note>

## Catalogo integrato

OpenClaw include queste famiglie di modelli xAI out of the box:

| Famiglia       | ID modello                                                               |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Il plugin risolve anche in forward gli ID più recenti `grok-4*` e `grok-code-fast*` quando
seguono la stessa forma API.

<Tip>
`grok-4-fast`, `grok-4-1-fast` e le varianti `grok-4.20-beta-*` sono gli
attuali riferimenti Grok compatibili con immagini nel catalogo integrato.
</Tip>

## Copertura delle funzionalità di OpenClaw

Il plugin integrato mappa l'attuale superficie API pubblica di xAI sui contratti
condivisi di provider e strumenti di OpenClaw. Le funzionalità che non si adattano al contratto condiviso
(per esempio TTS in streaming e voce realtime) non vengono esposte — vedi la tabella
qui sotto.

| Funzionalità xAI            | Superficie OpenClaw                       | Stato                                                               |
| --------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses            | provider di modelli `xai/<model>`         | Sì                                                                  |
| Ricerca web lato server     | provider `web_search` `grok`              | Sì                                                                  |
| Ricerca X lato server       | strumento `x_search`                      | Sì                                                                  |
| Esecuzione di codice lato server | strumento `code_execution`           | Sì                                                                  |
| Immagini                    | `image_generate`                          | Sì                                                                  |
| Video                       | `video_generate`                          | Sì                                                                  |
| Text-to-speech batch        | `messages.tts.provider: "xai"` / `tts`    | Sì                                                                  |
| TTS in streaming            | —                                         | Non esposto; il contratto TTS di OpenClaw restituisce buffer audio completi |
| Speech-to-text batch        | `tools.media.audio` / comprensione media  | Sì                                                                  |
| Speech-to-text in streaming | Voice Call `streaming.provider: "xai"`    | Sì                                                                  |
| Voce realtime               | —                                         | Non ancora esposta; contratto di sessione/WebSocket differente      |
| File / batch                | Solo compatibilità API modello generica   | Non è uno strumento OpenClaw di prima classe                        |

<Note>
OpenClaw usa le API REST xAI per immagini/video/TTS/STT per la generazione media,
il parlato e la trascrizione batch, il WebSocket STT in streaming di xAI per la
trascrizione live delle chiamate vocali e l'API Responses per modello, ricerca e
strumenti di esecuzione del codice. Le funzionalità che richiedono contratti OpenClaw diversi, come
le sessioni vocali Realtime, sono documentate qui come capacità upstream invece
di essere comportamento nascosto del plugin.
</Note>

### Mappature della modalità fast

`/fast on` o `agents.defaults.models["xai/<model>"].params.fastMode: true`
riscrivono le richieste xAI native come segue:

| Modello sorgente | Destinazione modalità fast |
| ---------------- | -------------------------- |
| `grok-3`         | `grok-3-fast`              |
| `grok-3-mini`    | `grok-3-mini-fast`         |
| `grok-4`         | `grok-4-fast`              |
| `grok-4-0709`    | `grok-4-fast`              |

### Alias di compatibilità legacy

Gli alias legacy continuano a normalizzarsi negli ID canonici integrati:

| Alias legacy              | ID canonico                           |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Funzionalità

<AccordionGroup>
  <Accordion title="Ricerca web">
    Il provider di ricerca web `grok` integrato usa anch'esso `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generazione video">
    Il plugin `xai` integrato registra la generazione video tramite lo strumento condiviso
    `video_generate`.

    - Modello video predefinito: `xai/grok-imagine-video`
    - Modalità: text-to-video, image-to-video, generazione da immagine di riferimento, modifica
      video remota ed estensione video remota
    - Aspect ratio: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Risoluzioni: `480P`, `720P`
    - Durata: 1-15 secondi per generazione/image-to-video, 1-10 secondi quando
      si usano ruoli `reference_image`, 2-10 secondi per l'estensione
    - Generazione da immagine di riferimento: imposta `imageRoles` su `reference_image` per
      ogni immagine fornita; xAI accetta fino a 7 immagini di questo tipo

    <Warning>
    I buffer video locali non sono accettati. Usa URL remoti `http(s)` per
    gli input di modifica/estensione video. Image-to-video accetta buffer di immagini locali perché
    OpenClaw può codificarli come URL di dati per xAI.
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
    Il plugin `xai` integrato registra la generazione di immagini tramite lo strumento condiviso
    `image_generate`.

    - Modello immagine predefinito: `xai/grok-imagine-image`
    - Modello aggiuntivo: `xai/grok-imagine-image-pro`
    - Modalità: text-to-image e modifica con immagine di riferimento
    - Input di riferimento: una `image` o fino a cinque `images`
    - Aspect ratio: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Risoluzioni: `1K`, `2K`
    - Quantità: fino a 4 immagini

    OpenClaw chiede a xAI risposte immagine `b64_json` così i media generati possano essere
    archiviati e consegnati tramite il normale percorso degli allegati del canale. Le
    immagini di riferimento locali vengono convertite in URL di dati; i riferimenti remoti `http(s)` vengono
    passati così come sono.

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
    xAI documenta anche `quality`, `mask`, `user` e ulteriori ratio nativi
    come `1:2`, `2:1`, `9:20` e `20:9`. OpenClaw inoltra oggi solo i
    controlli immagine condivisi cross-provider; i controlli nativi non supportati
    sono intenzionalmente non esposti tramite `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Il plugin `xai` integrato registra il text-to-speech tramite la superficie condivisa del provider `tts`.

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
    OpenClaw usa l'endpoint batch `/v1/tts` di xAI. xAI offre anche TTS in streaming
    via WebSocket, ma il contratto attuale del provider speech di OpenClaw si aspetta
    un buffer audio completo prima della consegna della risposta.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Il plugin `xai` integrato registra lo speech-to-text batch tramite la superficie di trascrizione
    per la comprensione media di OpenClaw.

    - Modello predefinito: `grok-stt`
    - Endpoint: xAI REST `/v1/stt`
    - Percorso di input: upload di file audio multipart
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

    La lingua può essere fornita tramite la configurazione media audio condivisa o per richiesta di
    trascrizione. Gli hint di prompt sono accettati dalla superficie condivisa di OpenClaw,
    ma l'integrazione xAI REST STT inoltra solo file, modello e
    lingua perché corrispondono in modo pulito all'attuale endpoint pubblico xAI.

  </Accordion>

  <Accordion title="Speech-to-text in streaming">
    Il plugin `xai` integrato registra anche un provider di trascrizione realtime
    per l'audio live delle chiamate vocali.

    - Endpoint: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Codifica predefinita: `mulaw`
    - Frequenza di campionamento predefinita: `8000`
    - Endpointing predefinito: `800ms`
    - Trascrizioni intermedie: abilitate per impostazione predefinita

    Il media stream Twilio di Voice Call invia frame audio G.711 µ-law, quindi il
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
    `plugins.entries.voice-call.config.streaming.providers.xai`. Le chiavi
    supportate sono `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` o
    `alaw`), `interimResults`, `endpointingMs` e `language`.

    <Note>
    Questo provider in streaming è per il percorso di trascrizione realtime di Voice Call.
    Discord voice attualmente registra brevi segmenti e usa invece il percorso di
    trascrizione batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Configurazione di x_search">
    Il plugin xAI integrato espone `x_search` come strumento OpenClaw per cercare
    contenuti su X (precedentemente Twitter) tramite Grok.

    Percorso di configurazione: `plugins.entries.xai.config.xSearch`

    | Chiave             | Tipo    | Predefinito        | Descrizione                           |
    | ------------------ | ------- | ------------------ | ------------------------------------- |
    | `enabled`          | boolean | —                  | Abilita o disabilita x_search         |
    | `model`            | string  | `grok-4-1-fast`    | Modello usato per le richieste x_search |
    | `inlineCitations`  | boolean | —                  | Include citazioni inline nei risultati |
    | `maxTurns`         | number  | —                  | Numero massimo di turni di conversazione |
    | `timeoutSeconds`   | number  | —                  | Timeout della richiesta in secondi    |
    | `cacheTtlMinutes`  | number  | —                  | Time-to-live della cache in minuti    |

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

  <Accordion title="Configurazione di code execution">
    Il plugin xAI integrato espone `code_execution` come strumento OpenClaw per
    l'esecuzione remota di codice nell'ambiente sandbox di xAI.

    Percorso di configurazione: `plugins.entries.xai.config.codeExecution`

    | Chiave             | Tipo    | Predefinito                | Descrizione                                   |
    | ------------------ | ------- | -------------------------- | --------------------------------------------- |
    | `enabled`          | boolean | `true` (se la chiave è disponibile) | Abilita o disabilita l'esecuzione del codice |
    | `model`            | string  | `grok-4-1-fast`            | Modello usato per le richieste di esecuzione del codice |
    | `maxTurns`         | number  | —                          | Numero massimo di turni di conversazione      |
    | `timeoutSeconds`   | number  | —                          | Timeout della richiesta in secondi            |

    <Note>
    Si tratta di esecuzione remota nella sandbox di xAI, non di [`exec`](/it/tools/exec) locale.
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
    - L'autenticazione oggi supporta solo chiavi API. In OpenClaw non esiste ancora un flusso OAuth o device-code xAI.
    - `grok-4.20-multi-agent-experimental-beta-0304` non è supportato nel
      normale percorso del provider xAI perché richiede una diversa superficie API upstream
      rispetto al trasporto xAI standard di OpenClaw.
    - La voce Realtime di xAI non è ancora registrata come provider OpenClaw. Richiede
      un diverso contratto di sessione vocale bidirezionale rispetto a STT batch o
      trascrizione in streaming.
    - `quality` dell'immagine xAI, `mask` dell'immagine e ulteriori aspect ratio solo nativi non sono
      esposti finché lo strumento condiviso `image_generate` non avrà i corrispondenti
      controlli cross-provider.
  </Accordion>

  <Accordion title="Note avanzate">
    - OpenClaw applica automaticamente correzioni di compatibilità specifiche xAI per schema degli strumenti e tool-call
      nel percorso del runner condiviso.
    - Le richieste xAI native usano per impostazione predefinita `tool_stream: true`. Imposta
      `agents.defaults.models["xai/<model>"].params.tool_stream` su `false` per
      disabilitarlo.
    - Il wrapper xAI integrato rimuove i flag strict dello schema degli strumenti non supportati e
      le chiavi del payload di reasoning prima di inviare richieste xAI native.
    - `web_search`, `x_search` e `code_execution` sono esposti come strumenti OpenClaw.
      OpenClaw abilita il built-in xAI specifico di cui ha bisogno all'interno di ogni richiesta di strumento
      invece di collegare tutti gli strumenti nativi a ogni turno di chat.
    - `x_search` e `code_execution` appartengono al plugin xAI integrato invece di essere
      hardcoded nel runtime del modello core.
    - `code_execution` è esecuzione remota nella sandbox xAI, non
      [`exec`](/it/tools/exec) locale.
  </Accordion>
</AccordionGroup>

## Test live

I percorsi media xAI sono coperti da test unitari e suite live opzionali. I comandi
live caricano i segreti dalla tua shell di login, incluso `~/.profile`, prima di
sondare `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Il file live specifico del provider sintetizza TTS normale, TTS PCM adatto alla
telefonia, trascrive audio tramite STT batch xAI, trasmette in streaming lo stesso PCM tramite STT
realtime xAI, genera output text-to-image e modifica un'immagine di riferimento. Il
file live di immagini condivise verifica lo stesso provider xAI tramite la selezione runtime,
il fallback, la normalizzazione e il percorso degli allegati media di OpenClaw.

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti di modello e comportamento di failover.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Tutti i provider" href="/it/providers/index" icon="grid-2">
    La panoramica più ampia dei provider.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e correzioni.
  </Card>
</CardGroup>
