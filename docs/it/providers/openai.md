---
read_when:
    - Vuoi usare i modelli OpenAI in OpenClaw
    - Vuoi l'autenticazione con abbonamento Codex invece delle chiavi API
    - Hai bisogno di un comportamento di esecuzione dell'agente GPT-5 più rigoroso
summary: Usa OpenAI tramite chiavi API o abbonamento Codex in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T13:58:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac42660234e1971440f6de3b04adb1d3a1fddca20219fb68936c36e4c2f95265
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI fornisce API per sviluppatori per i modelli GPT. OpenClaw supporta due percorsi di autenticazione:

  - **Chiave API** — accesso diretto a OpenAI Platform con fatturazione basata sull'utilizzo (modelli `openai/*`)
  - **Abbonamento Codex** — accesso ChatGPT/Codex con sottoscrizione (modelli `openai-codex/*`)

  OpenAI supporta esplicitamente l'uso dell'OAuth con abbonamento in strumenti e flussi di lavoro esterni come OpenClaw.

  ## Copertura delle funzionalità di OpenClaw

  | Funzionalità OpenAI       | Superficie OpenClaw                        | Stato                                                  |
  | ------------------------- | ----------------------------------------- | ------------------------------------------------------ |
  | Chat / Responses          | provider di modelli `openai/<model>`      | Sì                                                     |
  | Modelli con abbonamento Codex | provider di modelli `openai-codex/<model>` | Sì                                                  |
  | Ricerca web lato server   | Strumento nativo OpenAI Responses         | Sì, quando la ricerca web è abilitata e nessun provider è fissato |
  | Immagini                  | `image_generate`                          | Sì                                                     |
  | Video                     | `video_generate`                          | Sì                                                     |
  | Sintesi vocale            | `messages.tts.provider: "openai"` / `tts` | Sì                                                     |
  | Speech-to-text batch      | `tools.media.audio` / comprensione media  | Sì                                                     |
  | Speech-to-text in streaming | Voice Call `streaming.provider: "openai"` | Sì                                                   |
  | Voce realtime             | Voice Call `realtime.provider: "openai"`  | Sì                                                     |
  | Embeddings                | provider di embedding della memoria       | Sì                                                     |

  ## Per iniziare

  Scegli il metodo di autenticazione che preferisci e segui i passaggi di configurazione.

  <Tabs>
  <Tab title="Chiave API (OpenAI Platform)">
    **Ideale per:** accesso API diretto e fatturazione basata sull'utilizzo.

    <Steps>
      <Step title="Ottieni la tua chiave API">
        Crea o copia una chiave API dalla [dashboard di OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Oppure passa direttamente la chiave:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Riepilogo del percorso

    | Model ref | Percorso | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | API diretta di OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | API diretta di OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    L'accesso ChatGPT/Codex è instradato tramite `openai-codex/*`, non `openai/*`.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **non** espone `openai/gpt-5.3-codex-spark` sul percorso API diretto. Le richieste live alle API OpenAI rifiutano quel modello. Spark è solo Codex.
    </Warning>

  </Tab>

  <Tab title="Abbonamento Codex">
    **Ideale per:** usare il tuo abbonamento ChatGPT/Codex invece di una chiave API separata. Codex cloud richiede l'accesso con ChatGPT.

    <Steps>
      <Step title="Esegui l'OAuth di Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oppure esegui direttamente OAuth:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Per configurazioni headless o ostili al callback, aggiungi `--device-code` per accedere con un flusso device-code di ChatGPT invece del callback del browser localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Imposta il modello predefinito">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Riepilogo del percorso

    | Model ref | Percorso | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | OAuth ChatGPT/Codex | accesso Codex |
    | `openai-codex/gpt-5.3-codex-spark` | OAuth ChatGPT/Codex | accesso Codex (dipende dai diritti) |

    <Note>
    Questo percorso è intenzionalmente separato da `openai/gpt-5.4`. Usa `openai/*` con una chiave API per l'accesso diretto a Platform e `openai-codex/*` per l'accesso con abbonamento Codex.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Note>
    L'onboarding non importa più materiale OAuth da `~/.codex`. Accedi con OAuth nel browser (predefinito) o con il flusso device-code sopra — OpenClaw gestisce le credenziali risultanti nel proprio archivio di autenticazione dell'agente.
    </Note>

    ### Limite della finestra di contesto

    OpenClaw tratta i metadati del modello e il limite di contesto runtime come valori separati.

    Per `openai-codex/gpt-5.4`:

    - `contextWindow` nativo: `1050000`
    - limite predefinito runtime `contextTokens`: `272000`

    Il limite predefinito più piccolo offre in pratica caratteristiche migliori di latenza e qualità. Sostituiscilo con `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Usa `contextWindow` per dichiarare i metadati nativi del modello. Usa `contextTokens` per limitare il budget di contesto runtime.
    </Note>

  </Tab>
</Tabs>

## Generazione di immagini

Il Plugin `openai` incluso registra la generazione di immagini tramite lo strumento `image_generate`.

| Capacità                 | Valore                             |
| ------------------------ | ---------------------------------- |
| Modello predefinito      | `openai/gpt-image-2`               |
| Numero massimo di immagini per richiesta | 4                    |
| Modalità modifica        | Abilitata (fino a 5 immagini di riferimento) |
| Override delle dimensioni | Supportati, incluse dimensioni 2K/4K |
| Rapporto d'aspetto / risoluzione | Non inoltrati alla OpenAI Images API |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Vedi [Generazione di immagini](/it/tools/image-generation) per parametri condivisi dello strumento, selezione del provider e comportamento di failover.
</Note>

`gpt-image-2` è il valore predefinito sia per la generazione text-to-image di OpenAI sia per il
ritocco delle immagini. `gpt-image-1` resta utilizzabile come override esplicito del modello, ma i nuovi
flussi di lavoro per immagini OpenAI dovrebbero usare `openai/gpt-image-2`.

Genera:

```
/tool image_generate model=openai/gpt-image-2 prompt="Un raffinato poster di lancio per OpenClaw su macOS" size=3840x2160 count=1
```

Modifica:

```
/tool image_generate model=openai/gpt-image-2 prompt="Mantieni la forma dell'oggetto, cambia il materiale in vetro traslucido" image=/path/to/reference.png size=1024x1536
```

## Generazione video

Il Plugin `openai` incluso registra la generazione video tramite lo strumento `video_generate`.

| Capacità        | Valore                                                                            |
| --------------- | --------------------------------------------------------------------------------- |
| Modello predefinito | `openai/sora-2`                                                               |
| Modalità        | Text-to-video, image-to-video, modifica di un singolo video                      |
| Input di riferimento | 1 immagine o 1 video                                                         |
| Override delle dimensioni | Supportati                                                              |
| Altri override  | `aspectRatio`, `resolution`, `audio`, `watermark` vengono ignorati con un avviso dello strumento |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Vedi [Generazione video](/it/tools/video-generation) per parametri condivisi dello strumento, selezione del provider e comportamento di failover.
</Note>

## Contributo al prompt GPT-5

OpenClaw aggiunge un contributo condiviso al prompt GPT-5 per le esecuzioni della famiglia GPT-5 tra provider. Si applica per ID modello, quindi `openai/gpt-5.4`, `openai-codex/gpt-5.4`, `openrouter/openai/gpt-5.4`, `opencode/gpt-5.4` e altri riferimenti GPT-5 compatibili ricevono lo stesso overlay. I modelli GPT-4.x meno recenti no.

Il provider harness Codex nativo incluso (`codex/*`) usa lo stesso comportamento GPT-5 e l'overlay Heartbeat tramite istruzioni developer dell'app-server Codex, quindi le sessioni `codex/gpt-5.x` mantengono la stessa continuità di esecuzione e la stessa guida Heartbeat proattiva anche se Codex gestisce il resto del prompt harness.

Il contributo GPT-5 aggiunge un contratto di comportamento con tag per persistenza della persona, sicurezza di esecuzione, disciplina degli strumenti, forma dell'output, controlli di completamento e verifica. Il comportamento specifico del canale per risposte e messaggi silenziosi resta nel prompt di sistema condiviso di OpenClaw e nella policy di consegna in uscita. La guida GPT-5 è sempre abilitata per i modelli corrispondenti. Il livello di stile di interazione amichevole è separato e configurabile.

| Valore                 | Effetto                                     |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (predefinito) | Abilita il livello di stile di interazione amichevole |
| `"on"`                 | Alias per `"friendly"`                      |
| `"off"`                | Disabilita solo il livello di stile amichevole |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
I valori non distinguono tra maiuscole e minuscole a runtime, quindi `"Off"` e `"off"` disabilitano entrambi il livello di stile amichevole.
</Tip>

<Note>
Il valore legacy `plugins.entries.openai.config.personality` viene ancora letto come fallback di compatibilità quando l'impostazione condivisa `agents.defaults.promptOverlays.gpt5.personality` non è configurata.
</Note>

## Voce e parlato

<AccordionGroup>
  <Accordion title="Sintesi vocale (TTS)">
    Il Plugin `openai` incluso registra la sintesi vocale per la superficie `messages.tts`.

    | Impostazione | Percorso config | Predefinito |
    |---------|------------|---------|
    | Modello | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voce | `messages.tts.providers.openai.voice` | `coral` |
    | Velocità | `messages.tts.providers.openai.speed` | (non impostato) |
    | Istruzioni | `messages.tts.providers.openai.instructions` | (non impostato, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` per note vocali, `mp3` per file |
    | Chiave API | `messages.tts.providers.openai.apiKey` | Usa `OPENAI_API_KEY` come fallback |
    | URL base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Modelli disponibili: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voci disponibili: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Imposta `OPENAI_TTS_BASE_URL` per sostituire l'URL base TTS senza influire sull'endpoint API della chat.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Il Plugin `openai` incluso registra lo speech-to-text batch tramite
    la superficie di trascrizione per la comprensione dei media di OpenClaw.

    - Modello predefinito: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Percorso di input: caricamento file audio multipart
    - Supportato da OpenClaw ovunque la trascrizione audio in ingresso usi
      `tools.media.audio`, inclusi i segmenti dei canali vocali Discord e gli
      allegati audio dei canali

    Per forzare OpenAI per la trascrizione audio in ingresso:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Gli hint di lingua e prompt vengono inoltrati a OpenAI quando forniti dalla
    configurazione audio condivisa dei media o dalla richiesta di trascrizione per chiamata.

  </Accordion>

  <Accordion title="Trascrizione realtime">
    Il Plugin `openai` incluso registra la trascrizione realtime per il Plugin Voice Call.

    | Impostazione | Percorso config | Predefinito |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Lingua | `...openai.language` | (non impostato) |
    | Prompt | `...openai.prompt` | (non impostato) |
    | Durata del silenzio | `...openai.silenceDurationMs` | `800` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Chiave API | `...openai.apiKey` | Usa `OPENAI_API_KEY` come fallback |

    <Note>
    Usa una connessione WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Questo provider di streaming è per il percorso di trascrizione realtime di Voice Call; attualmente la voce Discord registra brevi segmenti e usa invece il percorso di trascrizione batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voce realtime">
    Il Plugin `openai` incluso registra la voce realtime per il Plugin Voice Call.

    | Impostazione | Percorso config | Predefinito |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Voce | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Durata del silenzio | `...openai.silenceDurationMs` | `500` |
    | Chiave API | `...openai.apiKey` | Usa `OPENAI_API_KEY` come fallback |

    <Note>
    Supporta Azure OpenAI tramite le chiavi di configurazione `azureEndpoint` e `azureDeployment`. Supporta il tool calling bidirezionale. Usa il formato audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Il provider `openai` incluso può indirizzare una risorsa Azure OpenAI per la
generazione di immagini sovrascrivendo l'URL base. Sul percorso di generazione
di immagini, OpenClaw rileva gli hostname Azure in `models.providers.openai.baseUrl` e passa
automaticamente alla forma di richiesta di Azure.

<Note>
La voce realtime usa un percorso di configurazione separato
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e non è influenzata da `models.providers.openai.baseUrl`. Vedi l'accordion **Voce
realtime** in [Voce e parlato](#voice-and-speech) per le relative
impostazioni Azure.
</Note>

Usa Azure OpenAI quando:

- Hai già una sottoscrizione, quota o contratto enterprise Azure OpenAI
- Hai bisogno della residenza regionale dei dati o dei controlli di conformità offerti da Azure
- Vuoi mantenere il traffico all'interno di una tenancy Azure esistente

### Configurazione

Per la generazione di immagini Azure tramite il provider `openai` incluso, punta
`models.providers.openai.baseUrl` alla tua risorsa Azure e imposta `apiKey` sulla
chiave Azure OpenAI (non una chiave OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw riconosce questi suffissi host Azure per il percorso Azure di
generazione di immagini:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Per le richieste di generazione di immagini su un host Azure riconosciuto, OpenClaw:

- Invia l'header `api-key` invece di `Authorization: Bearer`
- Usa percorsi con ambito deployment (`/openai/deployments/{deployment}/...`)
- Aggiunge `?api-version=...` a ogni richiesta

Gli altri URL base (OpenAI pubblico, proxy compatibili con OpenAI) mantengono la
forma standard delle richieste immagine OpenAI.

<Note>
Il routing Azure per il percorso di generazione di immagini del provider `openai` richiede
OpenClaw 2026.4.22 o successivo. Le versioni precedenti trattano qualsiasi
`openai.baseUrl` personalizzato come l'endpoint OpenAI pubblico e falliscono sui deployment
immagine Azure.
</Note>

### Versione API

Imposta `AZURE_OPENAI_API_VERSION` per fissare una specifica versione preview o GA di Azure
per il percorso di generazione di immagini Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Il valore predefinito è `2024-12-01-preview` quando la variabile non è impostata.

### I nomi dei modelli sono nomi di deployment

Azure OpenAI associa i modelli ai deployment. Per le richieste di generazione di immagini Azure
instradate tramite il provider `openai` incluso, il campo `model` in OpenClaw
deve essere il **nome del deployment Azure** configurato nel portale Azure, non
l'ID del modello OpenAI pubblico.

Se crei un deployment chiamato `gpt-image-2-prod` che serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Un poster pulito" size=1024x1024 count=1
```

La stessa regola del nome del deployment si applica alle chiamate di generazione di immagini
instradate tramite il provider `openai` incluso.

### Disponibilità regionale

La generazione di immagini Azure è attualmente disponibile solo in un sottoinsieme di regioni
(ad esempio `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Controlla l'elenco aggiornato delle regioni Microsoft prima di creare un
deployment e conferma che il modello specifico sia offerto nella tua regione.

### Differenze dei parametri

Azure OpenAI e OpenAI pubblico non accettano sempre gli stessi parametri immagine.
Azure può rifiutare opzioni consentite da OpenAI pubblico (per esempio alcuni
valori `background` su `gpt-image-2`) o esporle solo su specifiche versioni del modello.
Queste differenze dipendono da Azure e dal modello sottostante, non da
OpenClaw. Se una richiesta Azure fallisce con un errore di validazione, controlla
l'insieme di parametri supportato dal tuo specifico deployment e dalla versione API nel
portale Azure.

<Note>
Azure OpenAI usa trasporto e comportamento compat nativi ma non riceve
gli header di attribuzione nascosti di OpenClaw. Vedi l'accordion **Percorsi
nativi vs compatibili con OpenAI** in [Configurazione avanzata](#advanced-configuration)
per i dettagli.
</Note>

<Tip>
Per un provider Azure OpenAI Responses separato (distinto dal provider `openai`),
vedi i riferimenti di modello `azure-openai-responses/*` nell'accordion
[Compaction lato server](#server-side-compaction-responses-api).
</Tip>

<Note>
Il traffico Azure chat e Responses richiede configurazione provider/API specifica per Azure
oltre alla sovrascrittura dell'URL base. Se vuoi chiamate ai modelli Azure oltre alla generazione
di immagini, usa il flusso di onboarding o una configurazione provider che imposti la
forma API/autenticazione Azure appropriata invece di presumere che `openai.baseUrl` da solo
sia sufficiente.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Trasporto (WebSocket vs SSE)">
    OpenClaw usa prima WebSocket con fallback SSE (`"auto"`) sia per `openai/*` sia per `openai-codex/*`.

    In modalità `"auto"`, OpenClaw:
    - Riprova un errore iniziale WebSocket una volta prima di passare a SSE
    - Dopo un errore, contrassegna WebSocket come degradato per ~60 secondi e usa SSE durante il periodo di raffreddamento
    - Collega header stabili di identità di sessione e turno per retry e riconnessioni
    - Normalizza i contatori di utilizzo (`input_tokens` / `prompt_tokens`) tra le varianti di trasporto

    | Valore | Comportamento |
    |-------|----------|
    | `"auto"` (predefinito) | Prima WebSocket, fallback SSE |
    | `"sse"` | Forza solo SSE |
    | `"websocket"` | Forza solo WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentazione OpenAI correlata:
    - [Realtime API con WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Risposte API in streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Warm-up WebSocket">
    OpenClaw abilita il warm-up WebSocket per impostazione predefinita per `openai/*` per ridurre la latenza del primo turno.

    ```json5
    // Disabilita warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

<a id="openai-fast-mode"></a>

  <Accordion title="Modalità veloce">
    OpenClaw espone un interruttore condiviso della modalità veloce sia per `openai/*` sia per `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando è abilitata, OpenClaw mappa la modalità veloce all'elaborazione prioritaria di OpenAI (`service_tier = "priority"`). I valori `service_tier` esistenti vengono conservati e la modalità veloce non riscrive `reasoning` o `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Gli override di sessione hanno la precedenza sulla configurazione. Rimuovere l'override di sessione nell'interfaccia Sessions riporta la sessione al valore predefinito configurato.
    </Note>

  </Accordion>

  <Accordion title="Elaborazione prioritaria (service_tier)">
    L'API di OpenAI espone l'elaborazione prioritaria tramite `service_tier`. Impostala per modello in OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valori supportati: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` viene inoltrato solo agli endpoint nativi OpenAI (`api.openai.com`) e agli endpoint Codex nativi (`chatgpt.com/backend-api`). Se instradi uno dei due provider tramite un proxy, OpenClaw lascia `service_tier` invariato.
    </Warning>

  </Accordion>

  <Accordion title="Compaction lato server (Responses API)">
    Per i modelli OpenAI Responses diretti (`openai/*` su `api.openai.com`), OpenClaw abilita automaticamente Compaction lato server:

    - Forza `store: true` (a meno che la compatibilità del modello imposti `supportsStore: false`)
    - Inietta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predefinito: 70% di `contextWindow` (o `80000` quando non disponibile)

    <Tabs>
      <Tab title="Abilita esplicitamente">
        Utile per endpoint compatibili come Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Soglia personalizzata">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Disabilita">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` controlla solo l'iniezione di `context_management`. I modelli OpenAI Responses diretti continuano a forzare `store: true` a meno che la compatibilità non imposti `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modalità GPT agentica rigorosa">
    Per le esecuzioni della famiglia GPT-5 su `openai/*` e `openai-codex/*`, OpenClaw può usare un contratto di esecuzione incorporato più rigoroso:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Con `strict-agentic`, OpenClaw:
    - Non considera più un turno solo di pianificazione come progresso riuscito quando è disponibile un'azione tramite strumento
    - Riprova il turno con un indirizzamento act-now
    - Abilita automaticamente `update_plan` per lavoro sostanziale
    - Mostra uno stato di blocco esplicito se il modello continua a pianificare senza agire

    <Note>
    Limitato solo alle esecuzioni della famiglia GPT-5 di OpenAI e Codex. Gli altri provider e le famiglie di modelli meno recenti mantengono il comportamento predefinito.
    </Note>

  </Accordion>

  <Accordion title="Percorsi nativi vs compatibili con OpenAI">
    OpenClaw tratta gli endpoint diretti OpenAI, Codex e Azure OpenAI in modo diverso dai proxy generici compatibili con OpenAI `/v1`:

    **Percorsi nativi** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Mantengono `reasoning: { effort: "none" }` solo per i modelli che supportano l'effort `none` di OpenAI
    - Omettono il reasoning disabilitato per modelli o proxy che rifiutano `reasoning.effort: "none"`
    - Impostano gli schemi degli strumenti in modalità rigorosa per impostazione predefinita
    - Allegano header di attribuzione nascosti solo su host nativi verificati
    - Mantengono la forma delle richieste specifica di OpenAI (`service_tier`, `store`, compatibilità reasoning, hint della cache del prompt)

    **Percorsi proxy/compatibili:**
    - Usano un comportamento compat più permissivo
    - Non forzano schemi degli strumenti rigorosi né header solo nativi

    Azure OpenAI usa trasporto e comportamento compat nativi ma non riceve gli header di attribuzione nascosti.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti di modello e del comportamento di failover.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagine e selezione del provider.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli dell'autenticazione e regole di riutilizzo delle credenziali.
  </Card>
</CardGroup>
