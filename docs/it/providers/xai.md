---
read_when:
    - Vuoi utilizzare i modelli Grok in OpenClaw
    - Stai configurando l'autenticazione xAI o gli ID modello
summary: Usa i modelli xAI Grok in OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-07-12T07:27:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eba797fbb2f4f2a47c8e07daabe93ef4f6e5a8077d3c739b0f6b9c99283995e1
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw include un plugin del provider `xai` integrato per i modelli Grok. Il
percorso consigliato è Grok OAuth con un abbonamento SuperGrok o X Premium
idoneo. Gateway, configurazione, instradamento e strumenti rimangono locali;
solo le richieste Grok vengono inviate all'API di xAI.

OAuth non richiede una chiave API xAI né l'app Grok Build. xAI potrebbe comunque
mostrare Grok Build nella schermata di consenso perché OpenClaw utilizza il
client OAuth condiviso di xAI.

## Configurazione

<Steps>
  <Step title="Nuova installazione">
    Esegui la procedura di configurazione iniziale con l'installazione del
    demone, quindi scegli xAI/Grok OAuth nel passaggio relativo al modello e
    all'autenticazione:

    ```bash
    openclaw onboard --install-daemon
    ```

    Su un VPS o tramite SSH, seleziona direttamente xAI OAuth; utilizza la
    verifica tramite codice del dispositivo e non richiede un callback su
    localhost:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="Installazione esistente">
    Accedi soltanto a xAI; non eseguire nuovamente l'intera procedura di
    configurazione iniziale solo per connettere Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Imposta separatamente Grok come modello predefinito:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Esegui nuovamente l'intera procedura di configurazione iniziale solo se
    intendi modificare deliberatamente Gateway, demone, canale, spazio di
    lavoro o altre scelte di configurazione.

  </Step>
  <Step title="Percorso con chiave API">
    La configurazione con chiave API continua a funzionare per le chiavi della
    console xAI e per le funzionalità multimediali che richiedono una
    configurazione del provider basata su chiave:

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
OpenClaw utilizza l'API Responses di xAI come trasporto xAI integrato. La stessa
credenziale ottenuta tramite
`openclaw models auth login --provider xai --method oauth` o
`--method api-key` alimenta anche `web_search` (ID del provider `grok`),
`x_search`, `code_execution`, sintesi e trascrizione vocale e generazione di
immagini e video xAI. Se memorizzi una chiave xAI in
`plugins.entries.xai.config.webSearch.apiKey`, anche il provider di modelli xAI
integrato la riutilizza come opzione di riserva.
</Note>

## Risoluzione dei problemi OAuth

- Per SSH, Docker, VPS o altre configurazioni remote, utilizza
  `openclaw models auth login --provider xai --method oauth`; usa la verifica
  tramite codice del dispositivo, non un callback su localhost.
- Se l'accesso riesce ma Grok non è il modello predefinito, esegui
  `openclaw models set xai/grok-4.3`.
- Esamina i profili di autenticazione xAI salvati:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI decide quali account possono ricevere token API OAuth. Se un account non
  è idoneo, utilizza il percorso con chiave API oppure verifica l'abbonamento
  presso xAI.

<Tip>
Utilizza `xai-oauth` quando accedi da SSH, Docker o un VPS. OpenClaw visualizza
un URL e un breve codice; completa l'accesso in qualsiasi browser locale mentre
il processo remoto interroga periodicamente xAI per verificare il completamento
dello scambio del token.
</Tip>

## Catalogo integrato

ID selezionabili nei selettori dei modelli. Il plugin continua a risolvere gli
ID meno recenti di Grok 3, Grok 4, Grok 4 Fast, Grok 4.1 Fast e Grok Code per
le configurazioni esistenti; consulta
[compatibilità precedente e alias variabili](#legacy-compatibility-and-moving-aliases).

| Famiglia       | ID modello                                                    |
| -------------- | ------------------------------------------------------------- |
| Grok 4.5       | `grok-4.5` (alias: `grok-4.5-latest`, `grok-build-latest`)    |
| Grok Build 0.1 | `grok-build-0.1`                                              |
| Grok 4.3       | `grok-4.3` (alias: `grok-4.3-latest`, `grok-latest`)          |
| Grok 4.20      | `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`    |

<Tip>
Utilizza `grok-4.5` per chat generiche, programmazione e attività agentiche dove
è disponibile. Grok 4.3 rimane l'impostazione predefinita sicura a livello
regionale; `grok-build-0.1` ed entrambe le varianti datate di Grok 4.20
rimangono selezionabili.
</Tip>

## Copertura delle funzionalità

Il plugin integrato associa le API xAI supportate ai contratti condivisi di
OpenClaw per provider e strumenti. Le funzionalità che non rientrano nel
contratto condiviso sono elencate di seguito o nella sezione delle limitazioni
note.

| Funzionalità xAI                    | Superficie OpenClaw                            | Stato                                                                       |
| ----------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| Chat / Responses                    | Provider di modelli `xai/<model>`              | Sì                                                                          |
| Ricerca web lato server             | Provider `grok` di `web_search`                | Sì                                                                          |
| Ricerca X lato server               | Strumento `x_search`                           | Sì                                                                          |
| Esecuzione di codice lato server    | Strumento `code_execution`                     | Sì                                                                          |
| Immagini                            | `image_generate`                               | Sì                                                                          |
| Video                               | `video_generate`                               | Flusso di lavoro classico completo; Video 1.5 da immagine a video            |
| Sintesi vocale in batch             | `messages.tts.provider: "xai"` / `tts`         | Sì                                                                          |
| Sintesi vocale in streaming         | -                                              | Non ancora implementata dal provider xAI                                    |
| Riconoscimento vocale in batch      | Comprensione multimediale `tools.media.audio`  | Sì                                                                          |
| Riconoscimento vocale in streaming  | Chiamata vocale `streaming.provider: "xai"`    | Sì                                                                          |
| Voce in tempo reale                 | -                                              | Non ancora esposta; richiede un contratto di sessione/WebSocket differente  |
| File / batch                        | Solo compatibilità con l'API generica modelli  | Non è uno strumento OpenClaw di prima classe                                 |

<Note>
OpenClaw utilizza le API REST di xAI per immagini, video, sintesi vocale e
riconoscimento vocale per la generazione multimediale e la trascrizione in
batch, il WebSocket di riconoscimento vocale in streaming di xAI per la
trascrizione delle chiamate vocali in tempo reale e l'API Responses per chat,
ricerca e strumenti di esecuzione del codice.
</Note>

### Compatibilità precedente della modalità rapida

`/fast on` o `agents.defaults.models["xai/<model>"].params.fastMode: true`
continua a riscrivere le configurazioni xAI meno recenti come segue. Questi ID
di destinazione vengono mantenuti esclusivamente per compatibilità; utilizza i
modelli attualmente selezionabili per le nuove configurazioni.

| Modello sorgente | Destinazione modalità rapida |
| ---------------- | ---------------------------- |
| `grok-3`         | `grok-3-fast`                |
| `grok-3-mini`    | `grok-3-mini-fast`           |
| `grok-4`         | `grok-4-fast`                |
| `grok-4-0709`    | `grok-4-fast`                |

### Compatibilità precedente e alias variabili

Gli alias meno recenti vengono normalizzati come segue:

| Alias precedente                                               | ID normalizzato   |
| -------------------------------------------------------------- | ----------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825`  | `grok-build-0.1`  |

Gli ID datati 0309 sono le voci selezionabili del catalogo. OpenClaw invia
testualmente tutti gli altri alias correnti di Grok 4.20, affinché xAI mantenga
il controllo della semantica degli alias stabili, più recenti, beta,
sperimentali e datati. Anche l'alias globale `grok-latest` viene conservato
testualmente.

xAI ha ritirato i seguenti ID esatti. OpenClaw li mantiene come righe di
compatibilità nascoste per le configurazioni distribuite, con i limiti e i
prezzi delle rispettive destinazioni di reindirizzamento correnti:

| ID ritirati                                                           | Comportamento corrente                    |
| --------------------------------------------------------------------- | ----------------------------------------- |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`     | Grok 4.3 con ragionamento `low`           |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3`  | Grok 4.3 con ragionamento disabilitato    |
| `grok-code-fast-1`                                                    | Grok Build 0.1                            |
| `grok-imagine-image-pro`                                              | Grok Imagine Image Quality                |

`openclaw doctor --fix` aggiorna le impostazioni predefinite persistenti degli
strumenti server xAI e lo slug ritirato dell'immagine di qualità, rimuove le
righe obsolete del catalogo generato e corregge i metadati di contesto obsoleti
nelle righe 4.20 attive. Non vincola gli alias 4.20 `beta-latest` attivi a
un'istantanea datata.

## Funzionalità

<Warning>
  `x_search` e `code_execution` vengono eseguiti sui server di xAI. xAI addebita
  5 USD ogni 1.000 chiamate agli strumenti, oltre ai token di input e output
  del modello. Quando l'impostazione `enabled` di ciascuno strumento è omessa,
  OpenClaw lo espone solo per un modello xAI attivo. Un provider di modelli
  noto diverso da xAI richiede un'impostazione esplicita
  `enabled: true` per ogni strumento; un provider mancante o non risolto
  impedisce l'attivazione. L'autenticazione xAI è sempre obbligatoria e
  `enabled: false` disabilita lo strumento per ogni provider.
</Warning>

<AccordionGroup>
  <Accordion title="Ricerca web">
    Il provider di ricerca web `grok` integrato preferisce xAI OAuth, quindi
    utilizza come opzione di riserva `XAI_API_KEY` o una chiave di ricerca web
    del plugin:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generazione di video">
    Il plugin `xai` integrato registra la generazione di video tramite lo
    strumento condiviso `video_generate`.

    - Modello predefinito: `xai/grok-imagine-video`
    - Modello aggiuntivo: `xai/grok-imagine-video-1.5`
    - Modalità classiche: da testo a video, da immagine a video, generazione da
      immagine di riferimento, modifica di video remoto ed estensione di video
      remoto
    - Modalità Video 1.5: solo da immagine a video, con esattamente un'immagine
      per il primo fotogramma
    - Rapporti d'aspetto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`;
      quando omesso, il rapporto dell'immagine sorgente viene ereditato sia
      dalla modalità classica sia da Video 1.5 per la conversione da immagine
      a video
    - Risoluzioni: modalità classica `480P`/`720P`; Video 1.5 supporta anche
      `1080P`; tutte le modalità di generazione utilizzano `480P` come valore
      predefinito
    - Durata: 1-15 secondi per la generazione e la conversione da immagine a
      video, 1-10 secondi quando si utilizzano ruoli classici
      `reference_image`, 2-10 secondi per l'estensione classica
    - Generazione da immagini di riferimento: imposta `imageRoles` su
      `reference_image` per ogni immagine fornita; xAI accetta fino a 7 immagini
      di questo tipo
    - La modifica e l'estensione dei video ereditano il rapporto d'aspetto e la
      risoluzione del video di input; queste operazioni non accettano
      sostituzioni dei parametri geometrici
    - Timeout operativo predefinito: 600 secondi, a meno che non sia impostato
      `video_generate.timeoutMs` o
      `agents.defaults.videoGenerationModel.timeoutMs`

    <Warning>
    I buffer video locali non sono accettati. Utilizza URL `http(s)` remoti per
    gli input di modifica ed estensione dei video. La conversione da immagine a
    video accetta buffer di immagini locali perché OpenClaw li codifica come
    URL di dati per xAI.
    </Warning>

    Video 1.5 riconosce anche gli identificatori xAI
    `grok-imagine-video-1.5-preview` e
    `grok-imagine-video-1.5-2026-05-30`. OpenClaw inoltra senza modifiche
    l'identificatore selezionato, ma applica la stessa convalida riservata alle
    immagini.

    Per utilizzare xAI come provider video predefinito:

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
    Consulta [Generazione di video](/it/tools/video-generation) per i parametri
    condivisi dello strumento, la selezione del provider e il comportamento di
    failover.
    </Note>

  </Accordion>

  <Accordion title="Generazione di immagini">
    Il plugin `xai` integrato registra la generazione di immagini tramite lo
    strumento condiviso `image_generate`.

    - Modello di immagini predefinito: `xai/grok-imagine-image`
    - Modello aggiuntivo: `xai/grok-imagine-image-quality`
    - Modalità: da testo a immagine e modifica di un'immagine di riferimento
    - Input di riferimento: un campo `image` o fino a tre campi `images`
    - Rapporti d'aspetto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Risoluzioni: `1K`, `2K`
    - Quantità: fino a 4 immagini
    - Timeout predefinito dell'operazione: 600 secondi, salvo che sia impostato `image_generate.timeoutMs`
      o `agents.defaults.imageGenerationModel.timeoutMs`

    OpenClaw richiede a xAI risposte delle immagini in formato `b64_json`, affinché i contenuti multimediali generati possano essere
    archiviati e recapitati tramite il normale percorso degli allegati del canale. Le immagini di
    riferimento locali vengono convertite in URL di dati; i riferimenti remoti `http(s)`
    vengono trasmessi senza modifiche.

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
    xAI documenta anche `quality`, `mask`, `user` e un rapporto d'aspetto `auto`.
    Attualmente OpenClaw inoltra solo i controlli delle immagini condivisi tra provider;
    queste opzioni esclusive del provider nativo non sono esposte tramite `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Sintesi vocale">
    Il plugin `xai` incluso registra la sintesi vocale tramite l'interfaccia condivisa del provider `tts`.

    - Voci: catalogo live autenticato di xAI; elencarle con
      `openclaw infer tts voices --provider xai`
    - Voci di ripiego offline: `ara`, `eve`, `leo`, `rex`, `sal`
    - Voce predefinita: `eve`
    - Gli ID delle voci personalizzate dell'account vengono inoltrati anche quando sono assenti dalla
      risposta del catalogo integrato
    - Formati: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Lingua: codice BCP-47 o `auto`
    - Velocità: sostituzione della velocità nativa del provider
    - Il formato vocale Opus nativo per i messaggi vocali non è supportato

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
    OpenClaw usa l'endpoint batch `/v1/tts` e il catalogo autenticato
    `/v1/tts/voices` di xAI. xAI offre anche TTS in streaming tramite WebSocket, ma
    il provider xAI incluso non implementa ancora questo hook di streaming.
    </Note>

  </Accordion>

  <Accordion title="Trascrizione vocale">
    Il plugin `xai` incluso registra la trascrizione vocale batch tramite
    l'interfaccia di trascrizione per la comprensione dei contenuti multimediali di OpenClaw.

    - Endpoint: REST xAI `/v1/stt`
    - Percorso di input: caricamento di un file audio multipart
    - Selezione del modello: xAI sceglie internamente il modello di trascrizione;
      l'endpoint non dispone di un selettore del modello
    - Usato ovunque la trascrizione dell'audio in ingresso legga `tools.media.audio`,
      inclusi i segmenti dei canali vocali Discord e gli allegati audio dei canali

    Per forzare l'uso di xAI per la trascrizione dell'audio in ingresso:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
              },
            ],
          },
        },
      },
    }
    ```

    La lingua può essere fornita tramite la configurazione condivisa dei contenuti multimediali audio o nella richiesta
    di trascrizione di ciascuna chiamata. L'interfaccia condivisa di OpenClaw accetta indicazioni per il prompt,
    ma l'integrazione STT REST di xAI inoltra solo il file e la lingua,
    poiché sono gli unici parametri compatibili con l'attuale endpoint pubblico di xAI.

  </Accordion>

  <Accordion title="Trascrizione vocale in streaming">
    Il plugin `xai` incluso registra anche un provider di trascrizione in tempo reale
    per l'audio delle chiamate vocali live.

    - Endpoint: WebSocket xAI `wss://api.x.ai/v1/stt`
    - Codifica predefinita: `mulaw`
    - Frequenza di campionamento predefinita: `8000`
    - Rilevamento della fine del parlato predefinito: `800ms`
    - Trascrizioni provvisorie: abilitate per impostazione predefinita

    Il flusso multimediale Twilio di Voice Call invia frame audio G.711 mu-law, quindi il
    provider xAI inoltra direttamente tali frame senza transcodifica:

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

    La configurazione di proprietà del provider si trova in
    `plugins.entries.voice-call.config.streaming.providers.xai`. Le chiavi supportate
    sono `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` o
    `alaw`), `interimResults`, `endpointingMs` e `language`.

    <Note>
    Questo provider di streaming è destinato al percorso di trascrizione in tempo reale di Voice Call.
    Discord registra brevi segmenti e usa invece il percorso di trascrizione batch
    `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Configurazione di x_search">
    Il plugin xAI incluso espone `x_search` come strumento OpenClaw per
    cercare contenuti di X (in precedenza Twitter) tramite Grok.

    Percorso di configurazione: `plugins.entries.xai.config.xSearch`

    | Chiave            | Tipo    | Valore predefinito         | Descrizione                                                     |
    | ----------------- | ------- | -------------------------- | --------------------------------------------------------------- |
    | `enabled`         | boolean | Automatico per i modelli xAI | Disabilita oppure abilita esplicitamente per un provider non xAI noto |
    | `model`           | string  | `grok-4.3`                 | Modello usato per le richieste x_search                          |
    | `baseUrl`         | string  | -                          | Sostituzione dell'URL di base di xAI Responses                   |
    | `inlineCitations` | boolean | -                          | Include citazioni nel testo nei risultati                        |
    | `maxTurns`        | number  | -                          | Numero massimo di turni della conversazione                      |
    | `timeoutSeconds`  | number  | `30`                       | Timeout della richiesta in secondi                               |
    | `cacheTtlMinutes` | number  | `15`                       | Durata della cache in minuti                                     |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4.3",
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
    Il plugin xAI incluso espone `code_execution` come strumento OpenClaw per
    l'esecuzione remota del codice nell'ambiente sandbox di xAI.

    Percorso di configurazione: `plugins.entries.xai.config.codeExecution`

    | Chiave           | Tipo    | Valore predefinito         | Descrizione                                                     |
    | ---------------- | ------- | -------------------------- | --------------------------------------------------------------- |
    | `enabled`        | boolean | Automatico per i modelli xAI | Disabilita oppure abilita esplicitamente per un provider non xAI noto |
    | `model`          | string  | `grok-4.3`                 | Modello usato per le richieste di esecuzione del codice          |
    | `maxTurns`       | number  | -                          | Numero massimo di turni della conversazione                      |
    | `timeoutSeconds` | number  | `30`                       | Timeout della richiesta in secondi                               |

    <Note>
    Questa è un'esecuzione remota nella sandbox di xAI, non [`exec`](/it/tools/exec) locale.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4.3",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Limitazioni note">
    - L'autenticazione xAI può usare una chiave API, una variabile d'ambiente, la configurazione
      di ripiego del plugin oppure OAuth con un account xAI idoneo. OAuth usa la verifica tramite codice del dispositivo
      senza callback localhost. xAI decide quali account
      possono ricevere token API OAuth e la pagina di consenso può mostrare Grok Build,
      anche se OpenClaw non richiede l'app Grok Build.
    - Attualmente OpenClaw non espone la famiglia di modelli multiagente di xAI. xAI
      serve questi modelli tramite l'API Responses, ma non accettano
      gli strumenti lato client o personalizzati usati dal ciclo condiviso degli agenti di OpenClaw.
      Consultare le
      [limitazioni multiagente di xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - La voce in tempo reale di xAI non è ancora registrata come provider OpenClaw. Richiede
      un contratto di sessione vocale bidirezionale diverso da STT batch
      o dalla trascrizione in streaming.
    - I parametri `quality` e `mask` delle immagini xAI e il rapporto d'aspetto nativo `auto`
      non sono esposti finché lo strumento condiviso `image_generate` non dispone dei corrispondenti
      controlli comuni tra provider.
  </Accordion>

  <Accordion title="Note avanzate">
    - OpenClaw applica automaticamente le correzioni di compatibilità specifiche di xAI per gli schemi degli strumenti e le chiamate agli strumenti
      nel percorso condiviso del runner.
    - Le richieste xAI native impostano `tool_stream: true` per impostazione predefinita. Impostare
      `agents.defaults.models["xai/<model>"].params.tool_stream` su `false`
      per disabilitarlo.
    - Il wrapper xAI incluso rimuove i limiti non supportati del conteggio delle occorrenze negli schemi
      e le chiavi del payload relative all'*impegno* di ragionamento non supportate prima di inviare richieste
      xAI native. Grok 4.5 supporta un impegno basso, medio e
      alto (predefinito: alto). Grok 4.3 supporta nessun impegno, basso, medio e alto
      (predefinito: basso). Gli altri modelli xAI con capacità di ragionamento non espongono un
      controllo configurabile dell'impegno, ma richiedono comunque
      `include: ["reasoning.encrypted_content"]`, affinché il ragionamento cifrato precedente
      possa essere riutilizzato nei turni successivi.
    - `web_search`, `x_search` e `code_execution` sono esposti come strumenti OpenClaw.
      OpenClaw associa a ciascuna richiesta solo lo specifico strumento integrato di xAI necessario,
      anziché associare ogni strumento nativo a ogni turno della chat.
    - `web_search` di Grok legge `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` legge `plugins.entries.xai.config.xSearch.baseUrl`, quindi
      usa come ripiego l'URL di base della ricerca web di Grok.
    - `x_search` e `code_execution` appartengono al plugin xAI incluso,
      anziché essere codificati direttamente nel runtime principale del modello.
    - `code_execution` è un'esecuzione remota nella sandbox di xAI, non
      [`exec`](/it/tools/exec) locale.
  </Accordion>
</AccordionGroup>

## Test live

I percorsi multimediali xAI sono coperti da test unitari e suite live facoltative. Esportare
`XAI_API_KEY` nell'ambiente del processo prima di eseguire le verifiche live.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Il file live specifico del provider sintetizza il normale TTS, il TTS PCM
adatto alla telefonia, trascrive l'audio tramite lo STT batch di xAI, trasmette
in streaming lo stesso PCM tramite lo STT in tempo reale di xAI, genera output
da testo a immagine e modifica un'immagine di riferimento.
Il file live condiviso per le immagini verifica lo stesso provider xAI tramite
la selezione del runtime, il fallback, la normalizzazione e il percorso degli
allegati multimediali di OpenClaw. Il caso facoltativo Video 1.5 invia
un'immagine generata come primo fotogramma a 1080P e verifica il download del
video completato.

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Tutti i provider" href="/it/providers/index" icon="grid-2">
    Panoramica più ampia dei provider.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e relative soluzioni.
  </Card>
</CardGroup>
