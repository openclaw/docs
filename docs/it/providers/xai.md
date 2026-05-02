---
read_when:
    - Vuoi usare i modelli Grok in OpenClaw
    - Stai configurando l'autenticazione xAI o gli ID dei modelli
summary: Usare i modelli xAI Grok in OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-02T08:32:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f36b597fd5c47b61724080deb0d545bca024aca17744fc8aa6a0eb4872d12d2
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw include un Plugin provider `xai` in bundle per i modelli Grok.

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
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw usa l'API Responses di xAI come trasporto xAI incluso in bundle. La stessa
`XAI_API_KEY` può anche alimentare `web_search` basato su Grok, `x_search` di prima classe
e `code_execution` remoto.
Se archivi una chiave xAI in `plugins.entries.xai.config.webSearch.apiKey`,
il provider di modelli xAI incluso in bundle riusa quella chiave anche come fallback.
Imposta `plugins.entries.xai.config.webSearch.baseUrl` per instradare `web_search` Grok
e, per impostazione predefinita, `x_search` attraverso un proxy xAI Responses dell'operatore.
La configurazione di `code_execution` si trova in `plugins.entries.xai.config.codeExecution`.
</Note>

## Catalogo integrato

OpenClaw include queste famiglie di modelli xAI pronte all'uso:

| Famiglia       | ID modello                                                               |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Il Plugin risolve in avanti anche gli ID `grok-4*` e `grok-code-fast*` più recenti quando
seguono la stessa forma API.

<Tip>
`grok-4.3`, `grok-4-fast`, `grok-4-1-fast` e le varianti `grok-4.20-beta-*`
sono gli attuali riferimenti Grok con supporto per immagini nel catalogo incluso in bundle.
</Tip>

## Copertura delle funzionalità di OpenClaw

Il Plugin incluso in bundle mappa l'attuale superficie API pubblica di xAI sui contratti condivisi
di provider e strumenti di OpenClaw. Le capacità che non si adattano al contratto condiviso
(ad esempio TTS in streaming e voce in tempo reale) non sono esposte: vedi la tabella
seguente.

| Capacità xAI                | Superficie OpenClaw                       | Stato                                                               |
| --------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses            | provider di modelli `xai/<model>`         | Sì                                                                  |
| Ricerca web lato server     | provider `web_search` `grok`              | Sì                                                                  |
| Ricerca X lato server       | strumento `x_search`                      | Sì                                                                  |
| Esecuzione codice lato server | strumento `code_execution`              | Sì                                                                  |
| Immagini                    | `image_generate`                          | Sì                                                                  |
| Video                       | `video_generate`                          | Sì                                                                  |
| Text-to-speech batch        | `messages.tts.provider: "xai"` / `tts`    | Sì                                                                  |
| TTS in streaming            | —                                         | Non esposto; il contratto TTS di OpenClaw restituisce buffer audio completi |
| Speech-to-text batch        | `tools.media.audio` / comprensione media  | Sì                                                                  |
| Speech-to-text in streaming | Voice Call `streaming.provider: "xai"`    | Sì                                                                  |
| Voce in tempo reale         | —                                         | Non ancora esposta; contratto sessione/WebSocket diverso            |
| File / batch                | Solo compatibilità API generica dei modelli | Non è uno strumento OpenClaw di prima classe                      |

<Note>
OpenClaw usa le API REST image/video/TTS/STT di xAI per generazione media,
parlato e trascrizione batch, il WebSocket STT in streaming di xAI per la trascrizione
delle chiamate vocali live e l'API Responses per modelli, ricerca e strumenti
di esecuzione codice. Le funzionalità che richiedono contratti OpenClaw diversi, come
le sessioni vocali in tempo reale, sono documentate qui come capacità upstream invece
che come comportamento nascosto del Plugin.
</Note>

### Mappature modalità rapida

`/fast on` o `agents.defaults.models["xai/<model>"].params.fastMode: true`
riscrive le richieste native xAI come segue:

| Modello sorgente | Destinazione modalità rapida |
| ---------------- | ---------------------------- |
| `grok-3`         | `grok-3-fast`                |
| `grok-3-mini`    | `grok-3-mini-fast`           |
| `grok-4`         | `grok-4-fast`                |
| `grok-4-0709`    | `grok-4-fast`                |

### Alias di compatibilità legacy

Gli alias legacy vengono ancora normalizzati agli ID canonici inclusi in bundle:

| Alias legacy              | ID canonico                           |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Funzionalità

<AccordionGroup>
  <Accordion title="Ricerca web">
    Anche il provider di ricerca web `grok` incluso in bundle usa `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generazione video">
    Il Plugin `xai` incluso in bundle registra la generazione video tramite lo strumento condiviso
    `video_generate`.

    - Modello video predefinito: `xai/grok-imagine-video`
    - Modalità: text-to-video, image-to-video, generazione da immagine di riferimento, modifica video
      remota ed estensione video remota
    - Rapporti d'aspetto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Risoluzioni: `480P`, `720P`
    - Durata: 1-15 secondi per generazione/image-to-video, 1-10 secondi quando
      si usano ruoli `reference_image`, 2-10 secondi per l'estensione
    - Generazione da immagine di riferimento: imposta `imageRoles` su `reference_image` per
      ogni immagine fornita; xAI accetta fino a 7 immagini di questo tipo

    <Warning>
    I buffer video locali non sono accettati. Usa URL `http(s)` remoti per
    input di modifica/estensione video. Image-to-video accetta buffer di immagini locali perché
    OpenClaw può codificarli come URL dati per xAI.
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
    Vedi [Generazione video](/it/tools/video-generation) per parametri dello strumento condiviso,
    selezione del provider e comportamento di failover.
    </Note>

  </Accordion>

  <Accordion title="Generazione immagini">
    Il Plugin `xai` incluso in bundle registra la generazione immagini tramite lo strumento condiviso
    `image_generate`.

    - Modello immagine predefinito: `xai/grok-imagine-image`
    - Modello aggiuntivo: `xai/grok-imagine-image-pro`
    - Modalità: text-to-image e modifica da immagine di riferimento
    - Input di riferimento: una `image` o fino a cinque `images`
    - Rapporti d'aspetto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Risoluzioni: `1K`, `2K`
    - Numero: fino a 4 immagini

    OpenClaw richiede a xAI risposte immagine `b64_json` affinché i media generati possano essere
    archiviati e consegnati tramite il normale percorso degli allegati del canale. Le immagini
    di riferimento locali vengono convertite in URL dati; i riferimenti remoti `http(s)` vengono
    inoltrati invariati.

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
    xAI documenta anche `quality`, `mask`, `user` e ulteriori rapporti nativi
    come `1:2`, `2:1`, `9:20` e `20:9`. OpenClaw inoltra oggi solo i
    controlli immagine condivisi tra provider; le opzioni native non supportate
    sono intenzionalmente non esposte tramite `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Il Plugin `xai` incluso in bundle registra il text-to-speech tramite la superficie condivisa del provider `tts`.

    - Voci: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Voce predefinita: `eve`
    - Formati: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Lingua: codice BCP-47 o `auto`
    - Velocità: override della velocità nativo del provider
    - Il formato nota vocale Opus nativo non è supportato

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
    tramite WebSocket, ma il contratto del provider vocale di OpenClaw attualmente richiede
    un buffer audio completo prima della consegna della risposta.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Il Plugin `xai` incluso in bundle registra lo speech-to-text batch tramite la superficie
    di trascrizione per la comprensione media di OpenClaw.

    - Modello predefinito: `grok-stt`
    - Endpoint: REST xAI `/v1/stt`
    - Percorso di input: caricamento file audio multipart
    - Supportato da OpenClaw ovunque la trascrizione audio in ingresso usi
      `tools.media.audio`, inclusi segmenti di canali vocali Discord e
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

    La lingua può essere fornita tramite la configurazione audio media condivisa o per singola
    richiesta di trascrizione. I suggerimenti di prompt sono accettati dalla superficie OpenClaw
    condivisa, ma l'integrazione STT REST di xAI inoltra solo file, modello e
    lingua perché si mappano in modo chiaro all'attuale endpoint pubblico xAI.

  </Accordion>

  <Accordion title="Speech-to-text in streaming">
    Il Plugin `xai` incluso in bundle registra anche un provider di trascrizione in tempo reale
    per l'audio delle chiamate vocali live.

    - Endpoint: WebSocket xAI `wss://api.x.ai/v1/stt`
    - Codifica predefinita: `mulaw`
    - Frequenza di campionamento predefinita: `8000`
    - Endpointing predefinito: `800ms`
    - Trascrizioni intermedie: abilitate per impostazione predefinita

    Lo stream media Twilio di Voice Call invia frame audio G.711 µ-law, quindi il
    provider xAI può inoltrare quei frame direttamente senza transcodifica:

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

    La configurazione di proprietà del provider si trova sotto
    `plugins.entries.voice-call.config.streaming.providers.xai`. Le chiavi
    supportate sono `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` o
    `alaw`), `interimResults`, `endpointingMs` e `language`.

    <Note>
    Questo provider di streaming è per il percorso di trascrizione in tempo reale di Voice Call.
    La voce Discord attualmente registra segmenti brevi e usa invece il percorso di
    trascrizione batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Configurazione di x_search">
    Il Plugin xAI incluso espone `x_search` come strumento OpenClaw per cercare
    contenuti X (in precedenza Twitter) tramite Grok.

    Percorso di configurazione: `plugins.entries.xai.config.xSearch`

    | Chiave             | Tipo    | Predefinito        | Descrizione                          |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | Abilita o disabilita x_search        |
    | `model`            | string  | `grok-4-1-fast`    | Modello usato per le richieste x_search |
    | `baseUrl`          | string  | —                  | Override dell'URL di base xAI Responses |
    | `inlineCitations`  | boolean | —                  | Include citazioni inline nei risultati |
    | `maxTurns`         | number  | —                  | Numero massimo di turni di conversazione |
    | `timeoutSeconds`   | number  | —                  | Timeout della richiesta in secondi   |
    | `cacheTtlMinutes`  | number  | —                  | Durata della cache in minuti         |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                baseUrl: "https://api.x.ai/v1",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Configurazione dell'esecuzione del codice">
    Il Plugin xAI incluso espone `code_execution` come strumento OpenClaw per
    l'esecuzione remota di codice nell'ambiente sandbox di xAI.

    Percorso di configurazione: `plugins.entries.xai.config.codeExecution`

    | Chiave            | Tipo    | Predefinito              | Descrizione                          |
    | ----------------- | ------- | ------------------------ | ------------------------------------ |
    | `enabled`         | boolean | `true` (se la chiave è disponibile) | Abilita o disabilita l'esecuzione del codice |
    | `model`           | string  | `grok-4-1-fast`          | Modello usato per le richieste di esecuzione del codice |
    | `maxTurns`        | number  | —                        | Numero massimo di turni di conversazione |
    | `timeoutSeconds`  | number  | —                        | Timeout della richiesta in secondi   |

    <Note>
    Questa è esecuzione remota in sandbox xAI, non [`exec`](/it/tools/exec) locale.
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
    - Oggi l'autenticazione usa solo chiavi API. Non esiste ancora un flusso
      OAuth o con codice dispositivo xAI in OpenClaw.
    - `grok-4.20-multi-agent-experimental-beta-0304` non è supportato nel
      normale percorso del provider xAI perché richiede una diversa superficie API
      upstream rispetto al trasporto xAI standard di OpenClaw.
    - La voce xAI Realtime non è ancora registrata come provider OpenClaw. Richiede
      un contratto di sessione vocale bidirezionale diverso rispetto a STT batch o
      alla trascrizione in streaming.
    - `quality` per le immagini xAI, `mask` per le immagini e ulteriori proporzioni
      native non sono esposte finché lo strumento condiviso `image_generate` non avrà
      controlli corrispondenti tra provider.
  </Accordion>

  <Accordion title="Note avanzate">
    - OpenClaw applica automaticamente correzioni di compatibilità specifiche di xAI
      per schemi degli strumenti e chiamate agli strumenti nel percorso runner condiviso.
    - Le richieste native xAI impostano `tool_stream: true` per impostazione predefinita.
      Imposta `agents.defaults.models["xai/<model>"].params.tool_stream` su `false` per
      disabilitarlo.
    - Il wrapper xAI incluso rimuove flag rigorosi di schema degli strumenti non supportati e
      chiavi di payload di reasoning prima di inviare richieste native xAI.
    - `web_search`, `x_search` e `code_execution` sono esposti come strumenti OpenClaw.
      OpenClaw abilita lo specifico built-in xAI di cui ha bisogno dentro ogni richiesta
      dello strumento invece di collegare tutti gli strumenti nativi a ogni turno di chat.
    - Grok `web_search` legge `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` legge `plugins.entries.xai.config.xSearch.baseUrl`, poi
      ripiega sull'URL di base della ricerca web di Grok.
    - `x_search` e `code_execution` sono di proprietà del Plugin xAI incluso invece
      di essere hardcoded nel runtime del modello core.
    - `code_execution` è esecuzione remota in sandbox xAI, non
      [`exec`](/it/tools/exec) locale.
  </Accordion>
</AccordionGroup>

## Test live

I percorsi multimediali xAI sono coperti da test unitari e suite live opt-in. I comandi
live caricano i segreti dalla shell di login, incluso `~/.profile`, prima di
controllare `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Il file live specifico del provider sintetizza TTS normale, TTS PCM adatto alla telefonia,
trascrive audio tramite STT batch xAI, trasmette lo stesso PCM tramite STT xAI in tempo reale,
genera output text-to-image e modifica un'immagine di riferimento. Il file live condiviso
per le immagini verifica lo stesso provider xAI tramite il percorso di selezione runtime,
fallback, normalizzazione e allegato multimediale di OpenClaw.

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione dei modelli" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti dei modelli e comportamento di failover.
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
