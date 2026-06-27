---
read_when:
    - Vuoi usare i modelli Grok in OpenClaw
    - Stai configurando l'autenticazione xAI o gli ID dei modelli
summary: Usare i modelli xAI Grok in OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-06-27T18:10:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b89c1037f9800366c03bdd1313a8c4ff05e8675effa60ed1e2985d38f045aad4
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw include un plugin provider `xai` integrato per i modelli Grok. Per la maggior parte
degli utenti, il percorso consigliato è Grok OAuth con un abbonamento SuperGrok o X Premium
idoneo. OpenClaw rimane local-first: il Gateway, la configurazione, il routing e gli
strumenti vengono eseguiti sulla tua macchina, mentre le richieste al modello Grok si autenticano tramite xAI
e vengono inviate all'API di xAI.

OAuth non richiede una chiave API xAI e non richiede l'app Grok Build.
xAI potrebbe comunque mostrare Grok Build nella schermata di consenso perché OpenClaw usa
il client OAuth condiviso di xAI.

## Scegli il tuo percorso di configurazione

Usa il percorso che corrisponde allo stato della tua installazione di OpenClaw:

<Steps>
  <Step title="Nuova installazione di OpenClaw">
    Esegui l'onboarding con installazione del daemon quando configuri un nuovo Gateway
    locale, poi scegli l'opzione OAuth xAI/Grok nel passaggio modello/autenticazione:

    ```bash
    openclaw onboard --install-daemon
    ```

    Su un VPS o tramite SSH, seleziona direttamente xAI OAuth; OpenClaw usa la verifica
    con codice dispositivo e non richiede un callback localhost:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    OAuth non richiede una chiave API xAI. OpenClaw non richiede l'app Grok
    Build. xAI potrebbe comunque etichettare l'app di consenso come Grok Build perché
    OpenClaw usa il client OAuth condiviso di xAI.

  </Step>
  <Step title="Installazione OpenClaw esistente">
    Se OpenClaw è già configurato, accedi solo a xAI. Non rieseguire l'onboarding completo
    né reinstallare il daemon solo per connettere Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Per rendere Grok il modello predefinito dopo l'accesso, applicalo separatamente:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Riesegui l'onboarding completo solo se vuoi intenzionalmente modificare Gateway,
    daemon, canale, workspace o altre scelte di configurazione.

  </Step>
  <Step title="Percorso con chiave API">
    La configurazione con chiave API funziona ancora per le chiavi xAI Console e per le superfici multimediali che
    richiedono una configurazione del provider basata su chiave:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
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
OpenClaw usa l'API Responses di xAI come trasporto xAI integrato. La stessa
credenziale di `openclaw models auth login --provider xai --method oauth` o
`openclaw models auth login --provider xai --method api-key` può anche alimentare `web_search`, `x_search`, `code_execution` remoto di prima classe e la generazione di immagini/video xAI.
La sintesi vocale e la trascrizione attualmente richiedono `XAI_API_KEY` o la configurazione del provider.
`web_search` basato su Grok preferisce xAI OAuth e ripiega su `XAI_API_KEY` o sulla
configurazione di ricerca web del plugin.
Se memorizzi una chiave xAI in `plugins.entries.xai.config.webSearch.apiKey`,
anche il provider di modelli xAI integrato riutilizza quella chiave come fallback.
Imposta `plugins.entries.xai.config.webSearch.baseUrl` per instradare `web_search` di Grok
e, per impostazione predefinita, `x_search` tramite un proxy xAI Responses dell'operatore.
La regolazione di `code_execution` si trova in `plugins.entries.xai.config.codeExecution`.
</Note>

## Risoluzione dei problemi OAuth

- Per configurazioni SSH, Docker, VPS o altre configurazioni remote, usa
  `openclaw models auth login --provider xai --method oauth`; xAI OAuth usa
  la verifica con codice dispositivo invece di un callback localhost.
- Se l'accesso riesce ma Grok non è il modello predefinito, esegui
  `openclaw models set xai/grok-4.3`.
- Per ispezionare i profili di autenticazione xAI salvati, esegui:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI decide quali account possono ricevere token API OAuth. Se un account non è
  idoneo, prova il percorso con chiave API o controlla l'abbonamento lato xAI.

<Tip>
Usa `xai-oauth` quando accedi da SSH, Docker o un VPS. OpenClaw stampa un
URL xAI e un codice breve; completa l'accesso in qualsiasi browser locale mentre il processo remoto
interroga xAI per lo scambio di token completato.
</Tip>

## Catalogo integrato

OpenClaw include i modelli chat xAI attuali pronti all'uso, ordinati dal più recente
al meno recente nei selettori di modelli:

| Famiglia       | ID modello                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

Il plugin risolve ancora in avanti gli slug più vecchi Grok 3, Grok 4, Grok 4 Fast, Grok 4.1
Fast e Grok Code per le configurazioni esistenti. Gli alias ufficiali Grok Code Fast
si normalizzano in `grok-build-0.1`; OpenClaw non mostra più gli altri slug upstream ritirati
nel catalogo selezionabile.

<Tip>
Usa `grok-4.3` per chat generica e `grok-build-0.1` per carichi di lavoro orientati a build/coding,
a meno che tu non abbia esplicitamente bisogno di un alias beta Grok 4.20.
</Tip>

## Copertura delle funzionalità OpenClaw

Il plugin integrato mappa l'attuale superficie API pubblica di xAI sui contratti condivisi
di provider e strumenti di OpenClaw. Le capacità che non si adattano al contratto condiviso
(ad esempio TTS in streaming e voce in tempo reale) non sono esposte - vedi la tabella
sotto.

| Capacità xAI               | Superficie OpenClaw                       | Stato                                                               |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | provider del modello `xai/<model>`        | Sì                                                                  |
| Ricerca web lato server    | provider `web_search` `grok`              | Sì                                                                  |
| Ricerca X lato server      | strumento `x_search`                      | Sì                                                                  |
| Esecuzione codice lato server | strumento `code_execution`              | Sì                                                                  |
| Immagini                   | `image_generate`                          | Sì                                                                  |
| Video                      | `video_generate`                          | Sì                                                                  |
| Sintesi vocale batch       | `messages.tts.provider: "xai"` / `tts`    | Sì                                                                  |
| TTS in streaming           | -                                         | Non esposto; il contratto TTS di OpenClaw restituisce buffer audio completi |
| Riconoscimento vocale batch | `tools.media.audio` / comprensione multimediale | Sì                                                            |
| Riconoscimento vocale in streaming | Voice Call `streaming.provider: "xai"` | Sì                                                            |
| Voce in tempo reale        | -                                         | Non ancora esposta; contratto sessione/WebSocket diverso            |
| File / batch               | Solo compatibilità API modello generica   | Non è uno strumento OpenClaw di prima classe                        |

<Note>
OpenClaw usa le API REST immagine/video/TTS/STT di xAI per la generazione multimediale,
la sintesi vocale e la trascrizione batch, il WebSocket STT in streaming di xAI per la trascrizione
di chiamate vocali live e l'API Responses per modello, ricerca e
strumenti di esecuzione codice. Le funzionalità che richiedono contratti OpenClaw diversi, come
le sessioni di voce in tempo reale, sono documentate qui come capacità upstream invece che
come comportamento nascosto del plugin.
</Note>

### Mappature modalità rapida

`/fast on` o `agents.defaults.models["xai/<model>"].params.fastMode: true`
riscrive le richieste xAI native come segue:

| Modello sorgente | Target modalità rapida |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Alias di compatibilità legacy

Gli alias legacy si normalizzano ancora negli ID integrati canonici:

| Alias legacy              | ID canonico                           |
| ------------------------- | ------------------------------------- |
| `grok-code-fast-1`        | `grok-build-0.1`                      |
| `grok-code-fast`          | `grok-build-0.1`                      |
| `grok-code-fast-1-0825`   | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Funzionalità

<AccordionGroup>
  <Accordion title="Ricerca web">
    Il provider di ricerca web `grok` integrato preferisce xAI OAuth, poi ripiega
    su `XAI_API_KEY` o su una chiave di ricerca web del plugin:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generazione video">
    Il plugin `xai` integrato registra la generazione video tramite lo strumento condiviso
    `video_generate`.

    - Modello video predefinito: `xai/grok-imagine-video`
    - Modalità: text-to-video, image-to-video, generazione con reference-image, modifica video remota
      ed estensione video remota
    - Proporzioni: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Risoluzioni: `480P`, `720P`
    - Durata: 1-15 secondi per generazione/image-to-video, 1-10 secondi quando
      si usano ruoli `reference_image`, 2-10 secondi per estensione
    - Generazione con reference-image: imposta `imageRoles` su `reference_image` per
      ogni immagine fornita; xAI accetta fino a 7 immagini di questo tipo
    - Timeout operativo predefinito: 600 secondi a meno che sia impostato `video_generate.timeoutMs`
      o `agents.defaults.videoGenerationModel.timeoutMs`

    <Warning>
    I buffer video locali non sono accettati. Usa URL `http(s)` remoti per gli input
    di modifica/estensione video. Image-to-video accetta buffer di immagini locali perché
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
    Vedi [Generazione video](/it/tools/video-generation) per i parametri dello strumento condiviso,
    la selezione del provider e il comportamento di failover.
    </Note>

  </Accordion>

  <Accordion title="Generazione immagini">
    Il plugin `xai` integrato registra la generazione di immagini tramite lo strumento condiviso
    `image_generate`.

    - Modello immagine predefinito: `xai/grok-imagine-image`
    - Modello aggiuntivo: `xai/grok-imagine-image-quality`
    - Modalità: text-to-image e modifica reference-image
    - Input di riferimento: una `image` o fino a cinque `images`
    - Proporzioni: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Risoluzioni: `1K`, `2K`
    - Conteggio: fino a 4 immagini
    - Timeout operativo predefinito: 600 secondi a meno che sia impostato `image_generate.timeoutMs`
      o `agents.defaults.imageGenerationModel.timeoutMs`

    OpenClaw richiede a xAI risposte immagine `b64_json` così i media generati possono essere
    archiviati e consegnati tramite il normale percorso degli allegati del canale. Le immagini di riferimento
    locali vengono convertite in URL dati; i riferimenti remoti `http(s)` vengono
    passati senza modifiche.

    Per usare xAI come provider immagini predefinito:

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
    controlli immagine condivisi tra provider; le manopole non supportate e
    solo native non sono intenzionalmente esposte tramite `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Da testo a voce">
    Il Plugin `xai` incluso registra la sintesi vocale tramite la superficie
    provider `tts` condivisa.

    - Voci: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Voce predefinita: `eve`
    - Formati: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Lingua: codice BCP-47 o `auto`
    - Velocità: override della velocità nativo del provider
    - Il formato nativo Opus per note vocali non è supportato

    Per usare xAI come provider TTS predefinito:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              speakerVoiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw usa l'endpoint batch `/v1/tts` di xAI. xAI offre anche TTS in streaming
    tramite WebSocket, ma il contratto del provider vocale di OpenClaw attualmente si aspetta
    un buffer audio completo prima della consegna della risposta.
    </Note>

  </Accordion>

  <Accordion title="Da voce a testo">
    Il Plugin `xai` incluso registra la trascrizione batch da voce a testo tramite la
    superficie di trascrizione per comprensione dei media di OpenClaw.

    - Modello predefinito: `grok-stt`
    - Endpoint: REST xAI `/v1/stt`
    - Percorso di input: caricamento file audio multipart
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

    La lingua può essere fornita tramite la configurazione media audio condivisa o per ogni
    richiesta di trascrizione. I suggerimenti di prompt sono accettati dalla superficie
    condivisa di OpenClaw, ma l'integrazione REST STT di xAI inoltra solo file, modello e
    lingua perché questi si mappano in modo pulito all'attuale endpoint pubblico xAI.

  </Accordion>

  <Accordion title="Da voce a testo in streaming">
    Il Plugin `xai` incluso registra anche un provider di trascrizione in tempo reale
    per l'audio delle chiamate vocali live.

    - Endpoint: WebSocket xAI `wss://api.x.ai/v1/stt`
    - Codifica predefinita: `mulaw`
    - Frequenza di campionamento predefinita: `8000`
    - Endpointing predefinito: `800ms`
    - Trascrizioni intermedie: abilitate per impostazione predefinita

    Il flusso media Twilio di Voice Call invia frame audio G.711 µ-law, quindi il
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

    La configurazione di proprietà del provider risiede sotto
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
    contenuti di X (precedentemente Twitter) tramite Grok.

    Percorso di configurazione: `plugins.entries.xai.config.xSearch`

    | Chiave             | Tipo    | Predefinito        | Descrizione                          |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | Abilita o disabilita x_search        |
    | `model`            | string  | `grok-4-1-fast`    | Modello usato per le richieste x_search |
    | `baseUrl`          | string  | -                  | Override dell'URL base di xAI Responses |
    | `inlineCitations`  | boolean | -                  | Include citazioni inline nei risultati |
    | `maxTurns`         | number  | -                  | Numero massimo di turni di conversazione |
    | `timeoutSeconds`   | number  | -                  | Timeout della richiesta in secondi   |
    | `cacheTtlMinutes`  | number  | -                  | Tempo di vita della cache in minuti  |

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

    | Chiave            | Tipo    | Predefinito        | Descrizione                              |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true` (se la chiave è disponibile) | Abilita o disabilita l'esecuzione del codice |
    | `model`           | string  | `grok-4-1-fast`    | Modello usato per le richieste di esecuzione del codice |
    | `maxTurns`        | number  | -                  | Numero massimo di turni di conversazione |
    | `timeoutSeconds`  | number  | -                  | Timeout della richiesta in secondi       |

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
    - L'autenticazione xAI può usare una chiave API, una variabile d'ambiente, un fallback
      della configurazione del Plugin o OAuth con un account xAI idoneo. OAuth usa la verifica
      con codice dispositivo senza callback localhost. xAI decide quali account possono ricevere
      token API OAuth, e la pagina di consenso può mostrare Grok Build anche se OpenClaw
      non richiede l'app Grok Build.
    - OpenClaw attualmente non espone la famiglia di modelli multi-agente xAI. xAI
      serve questi modelli tramite la Responses API, ma non accettano gli strumenti
      lato client o personalizzati usati dal loop agente condiviso di OpenClaw. Consulta le
      [limitazioni multi-agente di xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - La voce xAI Realtime non è ancora registrata come provider OpenClaw. Richiede
      un contratto di sessione vocale bidirezionale diverso da STT batch o dalla
      trascrizione in streaming.
    - `quality` dell'immagine xAI, `mask` dell'immagine e ulteriori rapporti d'aspetto
      solo nativi non sono esposti finché lo strumento condiviso `image_generate` non ha
      controlli corrispondenti tra provider.
  </Accordion>

  <Accordion title="Note avanzate">
    - OpenClaw applica automaticamente correzioni di compatibilità specifiche di xAI per schema strumenti e chiamate strumento
      nel percorso runner condiviso.
    - Le richieste xAI native usano per impostazione predefinita `tool_stream: true`. Imposta
      `agents.defaults.models["xai/<model>"].params.tool_stream` su `false` per
      disabilitarlo.
    - Il wrapper xAI incluso rimuove i flag strict di schema strumenti non supportati e
      le chiavi payload di reasoning *effort* prima di inviare richieste xAI native. Solo
      `grok-4.3` / `grok-4.3-*` dichiarano effort di reasoning configurabile; tutti
      gli altri modelli xAI con capacità di reasoning richiedono comunque
      `include: ["reasoning.encrypted_content"]` così il reasoning crittografato precedente
      può essere riprodotto nei turni successivi.
    - `web_search`, `x_search` e `code_execution` sono esposti come strumenti OpenClaw.
      OpenClaw abilita lo specifico strumento integrato xAI di cui ha bisogno dentro ogni richiesta
      dello strumento invece di collegare tutti gli strumenti nativi a ogni turno di chat.
    - Grok `web_search` legge `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` legge `plugins.entries.xai.config.xSearch.baseUrl`, poi
      ripiega sull'URL base della ricerca web Grok.
    - `x_search` e `code_execution` sono di proprietà del Plugin xAI incluso
      invece che codificati direttamente nel runtime del modello core.
    - `code_execution` è esecuzione remota nella sandbox xAI, non
      [`exec`](/it/tools/exec) locale.
  </Accordion>
</AccordionGroup>

## Test live

I percorsi media xAI sono coperti da test unitari e suite live opt-in. Esporta
`XAI_API_KEY` nell'ambiente del processo prima di eseguire probe live.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Il file live specifico del provider sintetizza TTS normale, TTS PCM adatto alla telefonia,
trascrive audio tramite STT batch xAI, trasmette lo stesso PCM tramite STT xAI
in tempo reale, genera output da testo a immagine e modifica un'immagine di riferimento. Il
file live immagine condiviso verifica lo stesso provider xAI tramite il percorso di
selezione runtime, fallback, normalizzazione e allegato media di OpenClaw.

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Tutti i provider" href="/it/providers/index" icon="grid-2">
    La panoramica più ampia sui provider.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e correzioni.
  </Card>
</CardGroup>
