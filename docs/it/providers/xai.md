---
read_when:
    - Si desidera utilizzare i modelli Grok in OpenClaw
    - Si sta configurando l’autenticazione xAI o gli ID dei modelli
summary: Usare i modelli xAI Grok in OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-07-16T14:53:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c78617876f18fbb51bd3c8485f764a5b456b6d746476142bb0c5ecdb3decfb3a
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw include un plugin provider `xai` integrato per i modelli Grok. Il
percorso consigliato è Grok OAuth con un abbonamento SuperGrok o X Premium
idoneo. Gateway, configurazione, instradamento e strumenti rimangono locali; solo le richieste
Grok vengono inviate all'API di xAI.

OAuth non richiede una chiave API xAI né l'app Grok Build. xAI potrebbe comunque
mostrare Grok Build nella schermata di consenso perché OpenClaw utilizza il client
OAuth condiviso di xAI.

## Configurazione

<Steps>
  <Step title="Nuova installazione">
    Eseguire l'onboarding con l'installazione del daemon, quindi scegliere xAI/Grok OAuth nel
    passaggio relativo a modello/autenticazione:

    ```bash
    openclaw onboard --install-daemon
    ```

    Su un VPS o tramite SSH, selezionare direttamente xAI OAuth; utilizza la verifica
    tramite codice del dispositivo e non richiede un callback localhost:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="Installazione esistente">
    Accedere solo a xAI; non ripetere l'intero onboarding unicamente per connettere Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Impostare separatamente Grok come modello predefinito:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Ripetere l'intero onboarding solo se si desidera intenzionalmente modificare Gateway,
    daemon, canale, workspace o altre opzioni di configurazione.

  </Step>
  <Step title="Percorso con chiave API">
    La configurazione tramite chiave API continua a funzionare per le chiavi di xAI Console e per le superfici multimediali
    che richiedono una configurazione del provider basata su chiave:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="Scelta di un modello">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw utilizza l'API Responses di xAI come trasporto xAI integrato. La stessa
credenziale proveniente da `openclaw models auth login --provider xai --method oauth` o
`--method api-key` alimenta anche `web_search` (id provider `grok`), `x_search`,
`code_execution`, sintesi/trascrizione vocale e generazione di immagini/video xAI. Se si
memorizza una chiave xAI in `plugins.entries.xai.config.webSearch.apiKey`, anche il
provider di modelli xAI integrato la riutilizza come fallback.
</Note>

## Risoluzione dei problemi OAuth

- Per SSH, Docker, VPS o altre configurazioni remote, utilizzare
  `openclaw models auth login --provider xai --method oauth`; impiega
  la verifica tramite codice del dispositivo, non un callback localhost.
- Se l'accesso riesce ma Grok non è il modello predefinito, eseguire
  `openclaw models set xai/grok-4.3`.
- Esaminare i profili di autenticazione xAI salvati:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI decide quali account possono ricevere token API OAuth. Se un account
  non è idoneo, utilizzare il percorso con chiave API o verificare l'abbonamento sul lato xAI.

<Tip>
Utilizzare `xai-oauth` quando si accede da SSH, Docker o un VPS. OpenClaw mostra un
URL e un codice breve; completare l'accesso in qualsiasi browser locale mentre il processo
remoto interroga xAI in attesa del completamento dello scambio del token.
</Tip>

## Catalogo integrato

ID selezionabili nei selettori di modelli. Il plugin continua a risolvere gli ID meno recenti di Grok 3,
Grok 4, Grok 4 Fast, Grok 4.1 Fast e Grok Code per le configurazioni esistenti;
consultare [compatibilità legacy e alias mobili](#legacy-compatibility-and-moving-aliases).

| Famiglia       | ID modello                                                   |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5` (alias: `grok-4.5-latest`, `grok-build-latest`) |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3` (alias: `grok-4.3-latest`, `grok-latest`)       |
| Grok 4.20      | `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`   |

<Tip>
Utilizzare `grok-4.5` per chat generali, programmazione e attività agentiche, ove disponibile.
Grok 4.3 rimane l'impostazione predefinita sicura a livello regionale; `grok-build-0.1` ed entrambe
le varianti datate di Grok 4.20 rimangono selezionabili.
</Tip>

## Copertura delle funzionalità

Il plugin integrato mappa le API xAI supportate sui contratti condivisi di provider e
strumenti di OpenClaw. Le funzionalità che non rientrano nel contratto condiviso sono elencate
di seguito o nella sezione relativa ai limiti noti.

| Funzionalità xAI           | Superficie OpenClaw                     | Stato                                                |
| -------------------------- | --------------------------------------- | ---------------------------------------------------- |
| Chat / Responses           | Provider di modelli `xai/<model>`            | Sì                                                   |
| Ricerca web lato server    | Provider `web_search` `grok`            | Sì                                                   |
| Ricerca X lato server      | Strumento `x_search`                         | Sì                                                   |
| Esecuzione di codice lato server | Strumento `code_execution`                   | Sì                                                   |
| Immagini                   | `image_generate`                        | Sì                                                   |
| Video                      | `video_generate`                        | Sì                                                   |
| Sintesi vocale in batch    | `messages.tts.provider: "xai"` / `tts`  | Sì                                                   |
| TTS in streaming           | `textToSpeechStream`                    | Sì, tramite `wss://api.x.ai/v1/tts` (non voce in tempo reale) |
| Riconoscimento vocale in batch | Comprensione multimediale `tools.media.audio` | Sì                                                   |
| Riconoscimento vocale in streaming | Voice Call `streaming.provider: "xai"`  | Sì                                                   |
| Voce in tempo reale        | Talk `talk.realtime.provider: "xai"`    | Sì; inoltro tramite Gateway per i nodi Talk nativi   |
| File / batch               | Solo compatibilità con l'API generica dei modelli | Non è uno strumento OpenClaw di prima classe         |

<Note>
OpenClaw utilizza le API REST di xAI per immagini/video/TTS/STT per la generazione multimediale e
la trascrizione in batch, il WebSocket STT in streaming di xAI per la trascrizione
in tempo reale delle chiamate vocali, il WebSocket Grok Voice Agent di xAI per le sessioni Talk in tempo reale
e l'API Responses per chat, ricerca e strumenti di esecuzione del codice.
</Note>

### Compatibilità legacy della modalità rapida

`/fast on` o `agents.defaults.models["xai/<model>"].params.fastMode: true`
continua a riscrivere le configurazioni xAI meno recenti come indicato di seguito. Questi ID di destinazione vengono
mantenuti solo per compatibilità; utilizzare i modelli attualmente selezionabili per le nuove
configurazioni.

| Modello di origine | Destinazione modalità rapida |
| ------------------ | ---------------------------- |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Compatibilità legacy e alias mobili

Gli alias meno recenti vengono normalizzati come segue:

| Alias legacy                                                  | ID normalizzato   |
| ------------------------------------------------------------- | ---------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825` | `grok-build-0.1` |

Gli ID datati 0309 sono le voci selezionabili del catalogo. OpenClaw invia tutti gli altri
alias correnti di Grok 4.20 senza modifiche, affinché xAI mantenga il controllo della semantica degli alias
stabili, più recenti, beta, sperimentali e datati. Anche l'alias globale `grok-latest`
viene mantenuto senza modifiche.

xAI ha ritirato i seguenti ID esatti. OpenClaw li conserva come righe di compatibilità nascoste
per le configurazioni distribuite, con i limiti e i prezzi delle relative destinazioni
di reindirizzamento correnti:

| ID ritirati                                                          | Comportamento corrente           |
| -------------------------------------------------------------------- | -------------------------------- |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`    | Grok 4.3 con ragionamento `low`    |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3` | Grok 4.3 con ragionamento disabilitato |
| `grok-code-fast-1`                                                   | Grok Build 0.1                   |
| `grok-imagine-image-pro`                                             | Grok Imagine Image Quality       |

`openclaw doctor --fix` aggiorna le impostazioni predefinite persistenti degli strumenti server xAI e lo
slug ritirato per le immagini di qualità, rimuove le righe obsolete del catalogo generato e corregge
i metadati di contesto obsoleti nelle righe 4.20 attive. Non vincola gli alias 4.20
`beta-latest` attivi a un'istantanea datata.

## Funzionalità

<Warning>
  `x_search` e `code_execution` vengono eseguiti sui server di xAI. xAI addebita $5 ogni 1.000
  chiamate agli strumenti, oltre ai token di input e output del modello. Quando l'impostazione
  `enabled` di ciascuno strumento è omessa, OpenClaw lo rende disponibile solo per un modello xAI attivo.
  Un provider di modelli noto non xAI richiede un valore `enabled: true` esplicito per ciascuno strumento;
  un provider mancante o non risolto provoca un errore in modalità chiusa. L'autenticazione xAI è sempre obbligatoria
  e `enabled: false` disabilita lo strumento per ogni provider.
</Warning>

<AccordionGroup>
  <Accordion title="Ricerca web">
    Il provider di ricerca web `grok` integrato preferisce xAI OAuth, quindi ricorre
    a `XAI_API_KEY` o a una chiave di ricerca web del plugin:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generazione video">
    Il plugin `xai` integrato registra la generazione video tramite lo strumento
    condiviso `video_generate`.

    - Modello predefinito: `xai/grok-imagine-video`
    - Modello aggiuntivo: `xai/grok-imagine-video-1.5`
    - Modalità classiche: da testo a video, da immagine a video, generazione da immagini di riferimento,
      modifica di video remoti ed estensione di video remoti
    - Modalità Video 1.5: solo da immagine a video, con esattamente un'immagine del primo fotogramma
    - Proporzioni: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`;
      le modalità classica e Video 1.5 da immagine a video ereditano le proporzioni dell'immagine sorgente quando
      omesse
    - Risoluzioni: modalità classica `480P`/`720P`; Video 1.5 supporta anche `1080P`; tutte
      le modalità di generazione utilizzano per impostazione predefinita `480P`
    - Durata: 1-15 secondi per la generazione/da immagine a video, 1-10 secondi quando
      si utilizzano i ruoli classici `reference_image`, 2-10 secondi per l'estensione classica
    - Generazione da immagini di riferimento: impostare `imageRoles` su `reference_image` per
      ogni immagine fornita; xAI accetta fino a 7 immagini di questo tipo
    - La modifica/estensione video eredita le proporzioni e la risoluzione del video di input;
      queste operazioni non accettano sostituzioni della geometria
    - Timeout predefinito dell'operazione: 600 secondi, salvo che sia impostato `video_generate.timeoutMs`
      o `agents.defaults.videoGenerationModel.timeoutMs`

    <Warning>
    I buffer video locali non sono accettati. Utilizzare URL `http(s)` remoti per gli input di
    modifica/estensione video. La modalità da immagine a video accetta buffer di immagini locali perché
    OpenClaw li codifica come URL di dati per xAI.
    </Warning>

    Video 1.5 riconosce anche gli identificatori `grok-imagine-video-1.5-preview` e
    `grok-imagine-video-1.5-2026-05-30` di xAI. OpenClaw inoltra
    l'identificatore selezionato senza modificarlo, ma applica la stessa convalida che accetta solo immagini.

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
    Consultare [Generazione video](/it/tools/video-generation) per i parametri condivisi dello strumento,
    la selezione del provider e il comportamento di failover.
    </Note>

  </Accordion>

  <Accordion title="Generazione di immagini">
    Il plugin `xai` integrato registra la generazione di immagini tramite lo strumento
    condiviso `image_generate`.

    - Modello di immagini predefinito: `xai/grok-imagine-image`
    - Modello aggiuntivo: `xai/grok-imagine-image-quality`
    - Modalità: conversione da testo a immagine e modifica di immagini di riferimento
    - Input di riferimento: un `image` o fino a tre `images`
    - Proporzioni: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Risoluzioni: `1K`, `2K`
    - Quantità: fino a 4 immagini
    - Timeout predefinito dell'operazione: 600 secondi, a meno che non sia impostato `image_generate.timeoutMs`
      o `agents.defaults.imageGenerationModel.timeoutMs`

    OpenClaw richiede a xAI risposte di immagini `b64_json`, affinché i contenuti multimediali generati possano essere
    archiviati e recapitati tramite il normale percorso degli allegati del canale. Le immagini di
    riferimento locali vengono convertite in URL di dati; i riferimenti `http(s)` remoti
    vengono inoltrati senza modifiche.

    Per utilizzare xAI come provider di immagini predefinito:

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
    xAI documenta anche `quality`, `mask`, `user` e una proporzione `auto`.
    Attualmente OpenClaw inoltra solo i controlli delle immagini condivisi tra provider;
    queste opzioni native non sono esposte tramite `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Sintesi vocale">
    Il plugin `xai` incluso registra la sintesi vocale tramite l'interfaccia
    condivisa del provider `tts`.

    - Voci: catalogo live autenticato di xAI; elencarlo con
      `openclaw infer tts voices --provider xai`
    - Voci di riserva offline: `ara`, `eve`, `leo`, `rex`, `sal`
    - Voce predefinita: `eve`
    - Gli ID delle voci personalizzate dell'account vengono inoltrati anche quando sono assenti dalla
      risposta del catalogo integrato
    - Formati: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Lingua: codice BCP-47 o `auto`
    - Velocità: sostituzione della velocità nativa del provider
    - Il formato nativo delle note vocali Opus non è supportato

    Per utilizzare xAI come provider TTS predefinito:

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
    OpenClaw utilizza l'endpoint batch `/v1/tts` di xAI per la sintesi con buffering,
    il rilevamento autenticato del catalogo `/v1/tts/voices` e il protocollo nativo
    `wss://api.x.ai/v1/tts` per la sintesi in streaming. Lo streaming è limitato
    all'host nativo `api.x.ai`, pertanto i valori `baseUrl` personalizzati vengono rifiutati in questo
    percorso. Utilizza i controlli esistenti per lingua, voce, codec e velocità; per
    frequenza di campionamento e velocità in bit si applicano i valori predefiniti di xAI. La sintesi di file audio rispetta tutti
    i codec configurati. Le destinazioni per note vocali utilizzano MP3 per lo streaming e il fallback
    con buffering, poiché i codec non elaborati di xAI non contengono metadati relativi a codec/frequenza. Lo
    stream invia `text.delta` e quindi
    `text.done`, riceve `audio.delta`, `audio.done` o `error` e applica un
    `timeoutMs` di inattività che viene aggiornato per ogni blocco audio. È distinto dalle
    sessioni vocali in tempo reale. Consultare il contratto dell'[API TTS in streaming](https://docs.x.ai/developers/rest-api-reference/inference/voice) di xAI.
    </Note>

  </Accordion>

  <Accordion title="Trascrizione vocale">
    Il plugin `xai` incluso registra la trascrizione vocale in batch tramite l'interfaccia
    di trascrizione per la comprensione dei contenuti multimediali di OpenClaw.

    - Endpoint: REST xAI `/v1/stt`
    - Percorso di input: caricamento multipart di file audio
    - Selezione del modello: xAI sceglie internamente il modello di trascrizione;
      l'endpoint non dispone di un selettore del modello
    - Utilizzato ovunque la trascrizione dell'audio in ingresso legga `tools.media.audio`,
      inclusi i segmenti dei canali vocali Discord e gli allegati audio dei canali

    Per imporre l'uso di xAI per la trascrizione dell'audio in ingresso:

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

    La lingua può essere specificata tramite la configurazione condivisa dei contenuti multimediali audio o per ogni
    richiesta di trascrizione. L'interfaccia condivisa di OpenClaw accetta suggerimenti per il prompt,
    ma l'integrazione STT REST di xAI inoltra solo il file e la lingua,
    poiché questi corrispondono all'attuale endpoint pubblico di xAI.

  </Accordion>

  <Accordion title="Trascrizione vocale in streaming">
    Il plugin `xai` incluso registra anche un provider di trascrizione in tempo reale
    per l'audio delle chiamate vocali in diretta.

    - Endpoint: WebSocket xAI `wss://api.x.ai/v1/stt`
    - Codifica predefinita: `mulaw`
    - Frequenza di campionamento predefinita: `8000`
    - Rilevamento della fine dell'enunciato predefinito: `800ms`
    - Trascrizioni intermedie: abilitate per impostazione predefinita

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
    `plugins.entries.voice-call.config.streaming.providers.xai`. Le chiavi
    supportate sono `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` o
    `alaw`), `interimResults`, `endpointingMs` e `language`.

    <Note>
    Questo provider di streaming è destinato al percorso di trascrizione in tempo reale di Voice Call.
    La funzionalità vocale di Discord registra brevi segmenti e utilizza invece il percorso di trascrizione
    batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voce in tempo reale (Talk)">
    Il plugin `xai` incluso registra le sessioni in tempo reale di Grok Voice Agent per
    la modalità Talk tramite il contratto condiviso `registerRealtimeVoiceProvider`.

    - Endpoint: `wss://api.x.ai/v1/realtime?model=<voice-model>`
    - Modello predefinito: `grok-voice-latest`
    - Voce predefinita: `eve`
    - Trasporto: `gateway-relay` (percorsi di inoltro per iOS, Android e Control UI)
    - Audio: PCM16 a 24 kHz o G.711 µ-law a 8 kHz
    - Interruzione: il VAD del server xAI interrompe la risposta; OpenClaw cancella la riproduzione in coda
      e tronca la cronologia del provider non ancora riprodotta

    Configurare Talk sul Gateway:

    ```json5
    {
      talk: {
        realtime: {
          provider: "xai",
          mode: "realtime",
          transport: "gateway-relay",
          brain: "agent-consult",
          providers: {
            xai: {
              model: "grok-voice-latest",
              voice: "eve",
              // Abilitare solo se la riproduzione della sessione lato provider è accettabile.
              sessionResumption: false,
            },
          },
        },
      },
      env: { XAI_API_KEY: "xai-..." },
    }
    ```

    La configurazione di proprietà del provider viene risolta anche da
    `plugins.entries.voice-call.config.realtime.providers.xai` quando Voice Call
    o i selettori condivisi in tempo reale riutilizzano la stessa mappa dei provider. Le chiavi supportate sono
    `apiKey`, `baseUrl`, `model`, `voice`, `vadThreshold`, `silenceDurationMs`,
    `prefixPaddingMs`, `reasoningEffort` e `sessionResumption`.
    `reasoningEffort` accetta solo `high` o `none`, in conformità con l'API Voice Agent di xAI.

    Il VAD del server di xAI crea sempre le risposte e gestisce l'interruzione dell'audio.
    Utilizzare `consultRouting: "provider-direct"`; l'instradamento forzato delle trascrizioni e la disattivazione
    dell'interruzione dell'audio in ingresso non sono supportati dal protocollo Voice Agent di xAI.

    <Note>
    OAuth di xAI o `XAI_API_KEY` possono autenticare la voce in tempo reale. WebRTC gestito dal
    browser non fa ancora parte dell'interfaccia di questo provider; utilizzare Talk tramite gateway-relay sui
    Node nativi o il percorso di inoltro di Control UI.
    </Note>

    <Note>
    `sessionResumption` assume come valore predefinito `false`. Quando è impostato su `true`, OpenClaw richiede
    a xAI di conservare uno stato della sessione sufficiente per riprendere la stessa conversazione dopo una
    riconnessione, quindi si riconnette con l'ID conversazione restituito. Lasciarlo
    disabilitato quando la riproduzione/conservazione lato provider non è accettabile; i socket
    interrotti generano quindi un errore in modo sicuro anziché avviare silenziosamente una nuova conversazione.
    </Note>

  </Accordion>

  <Accordion title="Configurazione di x_search">
    Il plugin xAI incluso espone `x_search` come strumento OpenClaw per
    cercare contenuti di X (precedentemente Twitter) tramite Grok.

    Percorso di configurazione: `plugins.entries.xai.config.xSearch`

    | Chiave            | Tipo    | Valore predefinito        | Descrizione                                      |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`         | booleano | Automatico per i modelli xAI | Disabilitare o abilitare per un provider noto non xAI |
    | `model`           | stringa | `grok-4.3`                | Modello utilizzato per le richieste x_search     |
    | `baseUrl`         | stringa | -                         | Sostituzione dell'URL di base di xAI Responses   |
    | `inlineCitations` | booleano | -                         | Includere citazioni inline nei risultati         |
    | `maxTurns`        | numero  | -                         | Numero massimo di turni della conversazione      |
    | `timeoutSeconds`  | numero  | `30`                      | Timeout della richiesta in secondi               |
    | `cacheTtlMinutes` | numero  | `15`                      | Durata della cache in minuti                     |

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

    | Chiave           | Tipo    | Valore predefinito       | Descrizione                                      |
    | ---------------- | ------- | ------------------------ | ------------------------------------------------ |
    | `enabled`        | booleano | Automatico per i modelli xAI | Disabilitare o abilitare per un provider noto non xAI |
    | `model`          | stringa | `grok-4.3`               | Modello utilizzato per le richieste di esecuzione del codice |
    | `maxTurns`       | numero  | -                        | Numero massimo di turni della conversazione      |
    | `timeoutSeconds` | numero  | `30`                     | Timeout della richiesta in secondi               |

    <Note>
    Si tratta di un'esecuzione remota nella sandbox di xAI, non di [`exec`](/it/tools/exec) locale.
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

  <Accordion title="Limiti noti">
    - L'autenticazione xAI può usare una chiave API, una variabile di ambiente, la configurazione di fallback del plugin
      oppure OAuth con un account xAI idoneo. OAuth usa la verifica tramite codice del dispositivo
      senza callback localhost. xAI decide quali account
      possono ricevere token API OAuth e la pagina di consenso potrebbe mostrare Grok Build
      anche se OpenClaw non richiede l'app Grok Build.
    - OpenClaw attualmente non espone la famiglia di modelli multi-agente di xAI. xAI
      distribuisce questi modelli tramite l'API Responses, ma non accettano
      gli strumenti lato client o personalizzati usati dal ciclo agente condiviso di OpenClaw.
      Consultare le
      [limitazioni multi-agente di xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - La voce Realtime di xAI attualmente espone solo il trasporto Talk tramite relay del Gateway.
      Le sessioni WebSocket del provider gestite dal browser non sono ancora integrate nella Control UI.
    - L'immagine xAI `quality`, l'immagine `mask` e le proporzioni aggiuntive disponibili solo in modalità nativa
      non vengono esposte finché lo strumento condiviso `image_generate` non dispone dei corrispondenti
      controlli multiprovider.
  </Accordion>

  <Accordion title="Note avanzate">
    - OpenClaw applica automaticamente le correzioni di compatibilità specifiche di xAI
      per gli schemi e le chiamate degli strumenti nel percorso del runner condiviso.
    - Le richieste native xAI usano per impostazione predefinita `tool_stream: true`. Impostare
      `agents.defaults.models["xai/<model>"].params.tool_stream` su `false`
      per disabilitarlo.
    - Il wrapper xAI incluso rimuove i limiti del conteggio contains non supportati negli schemi
      e le chiavi del payload *effort* di ragionamento non supportate prima di inviare richieste
      native xAI. Grok 4.5 supporta un impegno basso, medio e
      alto (predefinito: alto). Grok 4.3 supporta nessuno, basso, medio e alto
      (predefinito: basso). Gli altri modelli xAI capaci di ragionamento non espongono un
      controllo configurabile dell'impegno, ma richiedono comunque
      `include: ["reasoning.encrypted_content"]` affinché il ragionamento crittografato precedente
      possa essere riprodotto nei turni successivi.
    - `web_search`, `x_search` e `code_execution` sono esposti come strumenti di OpenClaw.
      OpenClaw associa alla richiesta di ciascuno strumento solo la specifica funzionalità integrata di xAI
      necessaria, anziché associare tutti gli strumenti nativi a ogni
      turno della chat.
    - Grok `web_search` legge `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` legge `plugins.entries.xai.config.xSearch.baseUrl`, quindi
      usa come fallback l'URL di base della ricerca web di Grok.
    - `x_search` e `code_execution` sono gestiti dal plugin xAI incluso
      anziché essere codificati direttamente nel runtime principale dei modelli.
    - `code_execution` è un'esecuzione nella sandbox remota di xAI, non
      [`exec`](/it/tools/exec) locale.
  </Accordion>
</AccordionGroup>

## Test live

I percorsi multimediali di xAI sono coperti da unit test e suite live facoltative. Esportare
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

Il file live specifico del provider sintetizza il normale TTS e il TTS PCM
adatto alla telefonia, trascrive l'audio tramite lo STT batch di xAI, trasmette lo stesso PCM in streaming tramite lo
STT realtime di xAI, genera output da testo a immagine e modifica un'immagine di riferimento.
Il file live condiviso per le immagini verifica lo stesso provider xAI tramite il percorso di
selezione del runtime, fallback, normalizzazione e allegato multimediale di OpenClaw. Il
caso facoltativo Video 1.5 invia un'immagine generata per il primo fotogramma a 1080P e
verifica il download del video completato.

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri dello strumento video condiviso e selezione del provider.
  </Card>
  <Card title="Tutti i provider" href="/it/providers/index" icon="grid-2">
    La panoramica generale dei provider.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e relative soluzioni.
  </Card>
</CardGroup>
