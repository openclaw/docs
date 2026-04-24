---
read_when:
    - Vuoi usare i modelli OpenAI in OpenClaw
    - Vuoi l'autenticazione tramite abbonamento Codex invece delle chiavi API
    - Ti serve un comportamento di esecuzione dell'agente GPT-5 più rigoroso
summary: Usa OpenAI tramite chiavi API o abbonamento Codex in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-24T08:57:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3d533338fa15d866bb69584706162ce099bb4a1edc9851183fb5442730ebdd9b
    source_path: providers/openai.md
    workflow: 15
---

OpenAI fornisce API per sviluppatori per i modelli GPT. OpenClaw supporta tre percorsi della famiglia OpenAI. Il prefisso del modello seleziona il percorso:

- **Chiave API** — accesso diretto alla OpenAI Platform con fatturazione a consumo (modelli `openai/*`)
- **Abbonamento Codex tramite PI** — accesso ChatGPT/Codex con abbonamento (`openai-codex/*` modelli)
- **Harness app-server Codex** — esecuzione nativa dell'app-server Codex (`openai/*` modelli più `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI supporta esplicitamente l'uso di OAuth in strumenti esterni e workflow come OpenClaw.

<Note>
GPT-5.5 è attualmente disponibile in OpenClaw tramite percorsi di abbonamento/OAuth:
`openai-codex/gpt-5.5` con il runner PI, oppure `openai/gpt-5.5` con
l'harness app-server Codex. L'accesso diretto con chiave API per `openai/gpt-5.5` è
supportato una volta che OpenAI abilita GPT-5.5 sull'API pubblica; fino ad allora usa un
modello abilitato API come `openai/gpt-5.4` per configurazioni `OPENAI_API_KEY`.
</Note>

<Note>
Abilitare il Plugin OpenAI, o selezionare un modello `openai-codex/*`, non
abilita il Plugin app-server Codex incluso. OpenClaw abilita quel Plugin solo
quando selezioni esplicitamente l'harness Codex nativo con
`embeddedHarness.runtime: "codex"` o usi un ref di modello legacy `codex/*`.
</Note>

## Copertura delle funzionalità OpenClaw

| Capacità OpenAI          | Superficie OpenClaw                                      | Stato                                                  |
| ------------------------ | -------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses         | provider di modelli `openai/<model>`                     | Sì                                                     |
| Modelli con abbonamento Codex | `openai-codex/<model>` con OAuth `openai-codex`    | Sì                                                     |
| Harness app-server Codex | `openai/<model>` con `embeddedHarness.runtime: codex`    | Sì                                                     |
| Web search lato server   | strumento nativo OpenAI Responses                        | Sì, quando la web search è abilitata e nessun provider è fissato |
| Immagini                 | `image_generate`                                         | Sì                                                     |
| Video                    | `video_generate`                                         | Sì                                                     |
| Text-to-speech           | `messages.tts.provider: "openai"` / `tts`                | Sì                                                     |
| Speech-to-text batch     | `tools.media.audio` / comprensione dei media             | Sì                                                     |
| Speech-to-text in streaming | Voice Call `streaming.provider: "openai"`            | Sì                                                     |
| Voce realtime            | Voice Call `realtime.provider: "openai"` / Control UI Talk | Sì                                                  |
| Embedding                | provider di embedding per la memoria                     | Sì                                                     |

## Per iniziare

Scegli il metodo di autenticazione che preferisci e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Chiave API (OpenAI Platform)">
    **Ideale per:** accesso diretto alle API e fatturazione a consumo.

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

    | Ref modello | Percorso | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | API diretta OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | API diretta OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | Futuro percorso API diretto quando OpenAI abiliterà GPT-5.5 sull'API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` è il percorso diretto OpenAI con chiave API, a meno che tu non forzi esplicitamente
    l'harness app-server Codex. GPT-5.5 stesso è attualmente disponibile solo tramite abbonamento/OAuth;
    usa `openai-codex/*` per OAuth Codex tramite il runner PI predefinito.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **non** espone `openai/gpt-5.3-codex-spark`. Le richieste live alle API OpenAI rifiutano quel modello e anche l'attuale catalogo Codex non lo espone.
    </Warning>

  </Tab>

  <Tab title="Abbonamento Codex">
    **Ideale per:** usare il tuo abbonamento ChatGPT/Codex invece di una chiave API separata. Codex cloud richiede l'accesso a ChatGPT.

    <Steps>
      <Step title="Esegui OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oppure esegui direttamente OAuth:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Per configurazioni headless o ostili ai callback, aggiungi `--device-code` per accedere con un flusso device-code ChatGPT invece del callback browser localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Imposta il modello predefinito">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Riepilogo del percorso

    | Ref modello | Percorso | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | OAuth ChatGPT/Codex tramite PI | accesso Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harness app-server Codex | auth app-server Codex |

    <Note>
    Continua a usare l'id provider `openai-codex` per i comandi auth/profile. Il
    prefisso modello `openai-codex/*` è anche il percorso PI esplicito per OAuth Codex.
    Non seleziona né auto-abilita l'harness app-server Codex incluso.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    L'onboarding non importa più materiale OAuth da `~/.codex`. Accedi con OAuth via browser (predefinito) o con il flusso device-code sopra — OpenClaw gestisce le credenziali risultanti nel proprio archivio auth dell'agente.
    </Note>

    ### Indicatore di stato

    La chat `/status` mostra quale harness embedded è attivo per la sessione
    corrente. L'harness PI predefinito appare come `Runner: pi (embedded)` e non
    aggiunge un badge separato. Quando viene selezionato l'harness app-server Codex incluso,
    `/status` aggiunge l'id dell'harness non-PI accanto a `Fast`, ad esempio
    `Fast · codex`. Le sessioni esistenti mantengono il loro id di harness registrato, quindi usa
    `/new` o `/reset` dopo aver cambiato `embeddedHarness` se vuoi che `/status`
    rifletta una nuova scelta PI/Codex.

    ### Limite della finestra di contesto

    OpenClaw tratta i metadati del modello e il limite runtime del contesto come valori separati.

    Per `openai-codex/gpt-5.5` tramite OAuth Codex:

    - `contextWindow` nativa: `1000000`
    - limite runtime predefinito `contextTokens`: `272000`

    Il limite predefinito più piccolo ha in pratica migliori caratteristiche di latenza e qualità. Sovrascrivilo con `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Usa `contextWindow` per dichiarare i metadati nativi del modello. Usa `contextTokens` per limitare il budget runtime del contesto.
    </Note>

  </Tab>
</Tabs>

## Generazione di immagini

Il Plugin `openai` incluso registra la generazione di immagini tramite lo strumento `image_generate`.
Supporta sia la generazione di immagini con chiave API OpenAI sia la generazione di immagini con OAuth Codex
tramite lo stesso ref di modello `openai/gpt-image-2`.

| Capacità                | Chiave API OpenAI                 | OAuth Codex                           |
| ----------------------- | --------------------------------- | ------------------------------------- |
| Ref modello             | `openai/gpt-image-2`              | `openai/gpt-image-2`                  |
| Auth                    | `OPENAI_API_KEY`                  | accesso OAuth OpenAI Codex            |
| Trasporto               | API OpenAI Images                 | backend Codex Responses               |
| Numero massimo di immagini per richiesta | 4               | 4                                     |
| Modalità modifica       | Abilitata (fino a 5 immagini di riferimento) | Abilitata (fino a 5 immagini di riferimento) |
| Override della dimensione | Supportati, incluse dimensioni 2K/4K | Supportati, incluse dimensioni 2K/4K |
| Aspect ratio / resolution | Non inoltrati alla OpenAI Images API | Mappati a una dimensione supportata quando sicuro |

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

`gpt-image-2` è il valore predefinito sia per la generazione text-to-image sia per il
fotoritocco su OpenAI. `gpt-image-1` resta utilizzabile come override esplicito del modello, ma i nuovi
workflow di immagini OpenAI dovrebbero usare `openai/gpt-image-2`.

Per installazioni con OAuth Codex, mantieni lo stesso ref `openai/gpt-image-2`. Quando un
profilo OAuth `openai-codex` è configurato, OpenClaw risolve quel token di accesso OAuth
memorizzato e invia le richieste di immagine tramite il backend Codex Responses. Non
prova prima `OPENAI_API_KEY` né usa silenziosamente il fallback a una chiave API per quella
richiesta. Configura `models.providers.openai` esplicitamente con una chiave API,
un base URL personalizzato o un endpoint Azure quando vuoi invece il percorso diretto OpenAI Images API.
Se quell'endpoint di immagini personalizzato è su una LAN fidata o a un indirizzo privato, imposta anche
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw continua a
bloccare endpoint di immagini interni/privati compatibili con OpenAI a meno che questo opt-in non sia
presente.

Generare:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Modificare:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Generazione video

Il Plugin `openai` incluso registra la generazione video tramite lo strumento `video_generate`.

| Capacità         | Valore                                                                            |
| ---------------- | --------------------------------------------------------------------------------- |
| Modello predefinito | `openai/sora-2`                                                                |
| Modalità         | Text-to-video, image-to-video, modifica di un singolo video                      |
| Input di riferimento | 1 immagine o 1 video                                                          |
| Override della dimensione | Supportati                                                               |
| Altri override   | `aspectRatio`, `resolution`, `audio`, `watermark` vengono ignorati con un avviso dello strumento |

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

OpenClaw aggiunge un contributo condiviso al prompt GPT-5 per le esecuzioni della famiglia GPT-5 su tutti i provider. Si applica in base all'id del modello, quindi `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` e altri ref GPT-5 compatibili ricevono lo stesso overlay. I modelli GPT-4.x più vecchi no.

L'harness Codex nativo incluso usa lo stesso comportamento GPT-5 e lo stesso overlay Heartbeat tramite le istruzioni developer dell'app-server Codex, quindi le sessioni `openai/gpt-5.x` forzate tramite `embeddedHarness.runtime: "codex"` mantengono la stessa guida di follow-through e Heartbeat proattivo anche se Codex possiede il resto del prompt dell'harness.

Il contributo GPT-5 aggiunge un contratto di comportamento con tag per persistenza della persona, sicurezza di esecuzione, disciplina degli strumenti, forma dell'output, controlli di completamento e verifica. Il comportamento specifico del canale per risposta e messaggi silenziosi resta nel prompt di sistema condiviso di OpenClaw e nella policy di recapito in uscita. La guida GPT-5 è sempre abilitata per i modelli corrispondenti. Il livello di stile di interazione amichevole è separato e configurabile.

| Valore                | Effetto                                          |
| --------------------- | ------------------------------------------------ |
| `"friendly"` (predefinito) | Abilita il livello di stile di interazione amichevole |
| `"on"`                | Alias per `"friendly"`                           |
| `"off"`               | Disabilita solo il livello di stile amichevole   |

<Tabs>
  <Tab title="Configurazione">
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
I valori non distinguono tra maiuscole e minuscole a runtime, quindi sia `"Off"` sia `"off"` disabilitano il livello di stile amichevole.
</Tip>

<Note>
Il legacy `plugins.entries.openai.config.personality` viene ancora letto come fallback di compatibilità quando l'impostazione condivisa `agents.defaults.promptOverlays.gpt5.personality` non è impostata.
</Note>

## Voce e speech

<AccordionGroup>
  <Accordion title="Sintesi vocale (TTS)">
    Il Plugin `openai` incluso registra la sintesi vocale per la superficie `messages.tts`.

    | Impostazione | Percorso di configurazione | Predefinito |
    |---------|------------|---------|
    | Modello | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voce | `messages.tts.providers.openai.voice` | `coral` |
    | Velocità | `messages.tts.providers.openai.speed` | (non impostato) |
    | Istruzioni | `messages.tts.providers.openai.instructions` | (non impostato, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` per note vocali, `mp3` per file |
    | Chiave API | `messages.tts.providers.openai.apiKey` | Fallback a `OPENAI_API_KEY` |
    | URL di base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

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
    Imposta `OPENAI_TTS_BASE_URL` per sovrascrivere l'URL di base del TTS senza influenzare l'endpoint API della chat.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Il Plugin `openai` incluso registra lo speech-to-text batch tramite
    la superficie di trascrizione della comprensione dei media di OpenClaw.

    - Modello predefinito: `gpt-4o-transcribe`
    - Endpoint: REST OpenAI `/v1/audio/transcriptions`
    - Percorso di input: upload multipart di file audio
    - Supportato da OpenClaw ovunque la trascrizione audio in entrata usi
      `tools.media.audio`, inclusi segmenti di canali vocali Discord e
      allegati audio dei canali

    Per forzare OpenAI per la trascrizione audio in entrata:

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

    I suggerimenti di lingua e prompt vengono inoltrati a OpenAI quando forniti dalla
    configurazione audio condivisa dei media o dalla richiesta di trascrizione per chiamata.

  </Accordion>

  <Accordion title="Trascrizione realtime">
    Il Plugin `openai` incluso registra la trascrizione realtime per il Plugin Voice Call.

    | Impostazione | Percorso di configurazione | Predefinito |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Lingua | `...openai.language` | (non impostato) |
    | Prompt | `...openai.prompt` | (non impostato) |
    | Durata del silenzio | `...openai.silenceDurationMs` | `800` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Chiave API | `...openai.apiKey` | Fallback a `OPENAI_API_KEY` |

    <Note>
    Usa una connessione WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Questo provider di streaming è per il percorso di trascrizione realtime di Voice Call; la voce Discord attualmente registra segmenti brevi e usa invece il percorso batch di trascrizione `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voce realtime">
    Il Plugin `openai` incluso registra la voce realtime per il Plugin Voice Call.

    | Impostazione | Percorso di configurazione | Predefinito |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voce | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Durata del silenzio | `...openai.silenceDurationMs` | `500` |
    | Chiave API | `...openai.apiKey` | Fallback a `OPENAI_API_KEY` |

    <Note>
    Supporta Azure OpenAI tramite le chiavi di configurazione `azureEndpoint` e `azureDeployment`. Supporta chiamate agli strumenti bidirezionali. Usa il formato audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Il provider `openai` incluso può puntare a una risorsa Azure OpenAI per la generazione
di immagini sovrascrivendo l'URL di base. Nel percorso di generazione immagini, OpenClaw
rileva gli hostname Azure su `models.providers.openai.baseUrl` e passa automaticamente
alla forma di richiesta di Azure.

<Note>
La voce realtime usa un percorso di configurazione separato
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e non è influenzata da `models.providers.openai.baseUrl`. Vedi l'accordion **Voce
realtime** sotto [Voce e speech](#voice-and-speech) per le impostazioni Azure.
</Note>

Usa Azure OpenAI quando:

- Hai già un abbonamento, quota o contratto enterprise Azure OpenAI
- Ti servono residenza dei dati regionale o controlli di conformità forniti da Azure
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

OpenClaw riconosce questi suffissi host Azure per il percorso di generazione immagini Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Per richieste di generazione immagini su un host Azure riconosciuto, OpenClaw:

- Invia l'header `api-key` invece di `Authorization: Bearer`
- Usa percorsi con ambito deployment (`/openai/deployments/{deployment}/...`)
- Aggiunge `?api-version=...` a ogni richiesta

Gli altri URL di base (OpenAI pubblico, proxy compatibili con OpenAI) mantengono la
forma standard della richiesta immagini OpenAI.

<Note>
L'instradamento Azure per il percorso di generazione immagini del provider `openai` richiede
OpenClaw 2026.4.22 o successivo. Le versioni precedenti trattano qualsiasi
`openai.baseUrl` personalizzato come l'endpoint OpenAI pubblico e falliscono contro i
deployment di immagini Azure.
</Note>

### Versione API

Imposta `AZURE_OPENAI_API_VERSION` per fissare una specifica versione preview o GA di Azure
per il percorso di generazione immagini Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Il valore predefinito è `2024-12-01-preview` quando la variabile non è impostata.

### I nomi dei modelli sono nomi di deployment

Azure OpenAI associa i modelli ai deployment. Per richieste di generazione immagini Azure
instradate tramite il provider `openai` incluso, il campo `model` in OpenClaw
deve essere il **nome del deployment Azure** che hai configurato nel portale Azure, non
l'id del modello OpenAI pubblico.

Se crei un deployment chiamato `gpt-image-2-prod` che serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La stessa regola del nome del deployment si applica alle chiamate di generazione immagini instradate tramite
il provider `openai` incluso.

### Disponibilità regionale

La generazione di immagini Azure è attualmente disponibile solo in un sottoinsieme di regioni
(ad esempio `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Controlla l'elenco aggiornato delle regioni Microsoft prima di creare un
deployment e conferma che il modello specifico sia offerto nella tua regione.

### Differenze nei parametri

Azure OpenAI e OpenAI pubblico non accettano sempre gli stessi parametri delle immagini.
Azure può rifiutare opzioni che OpenAI pubblico consente (ad esempio certi
valori di `background` su `gpt-image-2`) o esporle solo su specifiche versioni
del modello. Queste differenze dipendono da Azure e dal modello sottostante, non da
OpenClaw. Se una richiesta Azure fallisce con un errore di validazione, controlla il
set di parametri supportato dal tuo deployment e dalla tua versione API specifici nel
portale Azure.

<Note>
Azure OpenAI usa il trasporto nativo e il comportamento compat ma non riceve
gli header nascosti di attribuzione di OpenClaw — vedi l'accordion **Percorsi
nativi vs compatibili con OpenAI** sotto [Configurazione avanzata](#advanced-configuration).

Per il traffico chat o Responses su Azure (oltre alla generazione immagini), usa il
flusso di onboarding o una configurazione provider Azure dedicata — `openai.baseUrl` da solo
non seleziona la forma API/auth di Azure. Esiste un provider separato
`azure-openai-responses/*`; vedi
l'accordion Server-side compaction qui sotto.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Trasporto (WebSocket vs SSE)">
    OpenClaw usa WebSocket-first con fallback SSE (`"auto"`) sia per `openai/*` sia per `openai-codex/*`.

    In modalità `"auto"`, OpenClaw:
    - Ritenta un errore WebSocket iniziale una volta prima di usare il fallback a SSE
    - Dopo un errore, contrassegna WebSocket come degradato per ~60 secondi e usa SSE durante il cool-down
    - Collega header stabili di identità di sessione e turno per retry e reconnessioni
    - Normalizza i contatori d'uso (`input_tokens` / `prompt_tokens`) tra le varianti di trasporto

    | Valore | Comportamento |
    |-------|----------|
    | `"auto"` (predefinito) | Prima WebSocket, fallback a SSE |
    | `"sse"` | Forza solo SSE |
    | `"websocket"` | Forza solo WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentazione OpenAI correlata:
    - [Realtime API con WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming delle risposte API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Warm-up WebSocket">
    OpenClaw abilita per impostazione predefinita il warm-up WebSocket per `openai/*` e `openai-codex/*` per ridurre la latenza del primo turno.

    ```json5
    // Disabilita il warm-up
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

  <Accordion title="Modalità Fast">
    OpenClaw espone un toggle condiviso della modalità Fast per `openai/*` e `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Configurazione:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando è abilitata, OpenClaw mappa la modalità Fast all'elaborazione prioritaria di OpenAI (`service_tier = "priority"`). I valori `service_tier` esistenti vengono preservati e la modalità Fast non riscrive né `reasoning` né `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Gli override di sessione hanno la precedenza sulla configurazione. Cancellando l'override di sessione nella UI Sessions, la sessione torna al valore predefinito configurato.
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
          },
        },
      },
    }
    ```

    Valori supportati: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` viene inoltrato solo agli endpoint OpenAI nativi (`api.openai.com`) e agli endpoint Codex nativi (`chatgpt.com/backend-api`). Se instradi uno dei due provider tramite un proxy, OpenClaw lascia `service_tier` invariato.
    </Warning>

  </Accordion>

  <Accordion title="Compaction lato server (Responses API)">
    Per i modelli OpenAI Responses diretti (`openai/*` su `api.openai.com`), il wrapper di stream Pi-harness del Plugin OpenAI abilita automaticamente la Compaction lato server:

    - Forza `store: true` (a meno che la compat del modello imposti `supportsStore: false`)
    - Inietta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predefinito: 70% di `contextWindow` (oppure `80000` quando non disponibile)

    Questo si applica al percorso del Pi harness integrato e agli hook del provider OpenAI usati dalle esecuzioni embedded. L'harness app-server Codex nativo gestisce il proprio contesto tramite Codex ed è configurato separatamente con `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Abilitazione esplicita">
        Utile per endpoint compatibili come Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
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
      <Tab title="Disabilitazione">
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
    `responsesServerCompaction` controlla solo l'iniezione di `context_management`. I modelli OpenAI Responses diretti continuano comunque a forzare `store: true` a meno che la compat non imposti `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modalità GPT agentica rigorosa">
    Per le esecuzioni della famiglia GPT-5 su `openai/*`, OpenClaw può usare un contratto di esecuzione embedded più rigoroso:

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
    - Non tratta più un turno di solo piano come progresso riuscito quando è disponibile un'azione tramite strumento
    - Ritenta il turno con un indirizzamento ad agire subito
    - Abilita automaticamente `update_plan` per lavori sostanziali
    - Espone uno stato di blocco esplicito se il modello continua a pianificare senza agire

    <Note>
    Limitato solo alle esecuzioni OpenAI e Codex della famiglia GPT-5. Gli altri provider e le famiglie di modelli più vecchie mantengono il comportamento predefinito.
    </Note>

  </Accordion>

  <Accordion title="Percorsi nativi vs compatibili con OpenAI">
    OpenClaw tratta gli endpoint diretti OpenAI, Codex e Azure OpenAI in modo diverso dai proxy generici compatibili con OpenAI `/v1`:

    **Percorsi nativi** (`openai/*`, Azure OpenAI):
    - Mantengono `reasoning: { effort: "none" }` solo per i modelli che supportano il valore `none` di OpenAI per `effort`
    - Omettono il reasoning disabilitato per modelli o proxy che rifiutano `reasoning.effort: "none"`
    - Impostano per default gli schemi degli strumenti in modalità rigorosa
    - Collegano header nascosti di attribuzione solo su host nativi verificati
    - Mantengono la modellazione delle richieste solo-OpenAI (`service_tier`, `store`, compat reasoning, suggerimenti di prompt-cache)

    **Percorsi proxy/compatibili:**
    - Usano un comportamento compat più permissivo
    - Non forzano schemi rigorosi degli strumenti né header solo-nativi

    Azure OpenAI usa il trasporto nativo e il comportamento compat ma non riceve gli header nascosti di attribuzione.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, ref dei modelli e comportamento di failover.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento di immagini e selezione del provider.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli di autenticazione e regole di riutilizzo delle credenziali.
  </Card>
</CardGroup>
