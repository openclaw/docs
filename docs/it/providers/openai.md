---
read_when:
    - Vuoi usare i modelli OpenAI in OpenClaw
    - Vuoi l'autenticazione con abbonamento Codex invece delle chiavi API
    - Hai bisogno di un comportamento di esecuzione dell'agente GPT-5 più rigoroso
summary: Usa OpenAI tramite chiavi API o abbonamento Codex in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T18:21:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f099227b8c8be3a4e919ea286fcede1e4e47be60c7593eb63b4cbbe85aa8389
    source_path: providers/openai.md
    workflow: 15
---

OpenAI fornisce API per sviluppatori per i modelli GPT. OpenClaw supporta tre percorsi della famiglia OpenAI. Il prefisso del modello seleziona il percorso:

- **Chiave API** — accesso diretto a OpenAI Platform con fatturazione a consumo (modelli `openai/*`)
- **Abbonamento Codex tramite PI** — accesso con login ChatGPT/Codex e abbonamento (modelli `openai-codex/*`)
- **Harness app-server Codex** — esecuzione nativa dell'app-server Codex (modelli `openai/*` più `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI supporta esplicitamente l'uso di OAuth con abbonamento in strumenti e flussi di lavoro esterni come OpenClaw.

Provider, modello, runtime e canale sono livelli separati. Se queste etichette si stanno
confondendo, leggi [Runtime degli agenti](/it/concepts/agent-runtimes) prima di
modificare la configurazione.

## Scelta rapida

| Obiettivo                                      | Usa                                                      | Note                                                                         |
| ---------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Fatturazione diretta con chiave API            | `openai/gpt-5.5`                                         | Imposta `OPENAI_API_KEY` o esegui l'onboarding della chiave API OpenAI.      |
| GPT-5.5 con autenticazione tramite abbonamento ChatGPT/Codex | `openai-codex/gpt-5.5`                                   | Percorso PI predefinito per Codex OAuth. Migliore prima scelta per configurazioni con abbonamento. |
| GPT-5.5 con comportamento nativo dell'app-server Codex | `openai/gpt-5.5` più `embeddedHarness.runtime: "codex"` | Forza l'harness app-server Codex per quel riferimento di modello.            |
| Generazione o modifica di immagini             | `openai/gpt-image-2`                                     | Funziona sia con `OPENAI_API_KEY` sia con OpenAI Codex OAuth.                |

<Note>
GPT-5.5 è disponibile sia tramite accesso diretto a OpenAI Platform con chiave API sia
tramite percorsi con abbonamento/OAuth. Usa `openai/gpt-5.5` per traffico diretto con `OPENAI_API_KEY`,
`openai-codex/gpt-5.5` per Codex OAuth tramite PI, oppure
`openai/gpt-5.5` con `embeddedHarness.runtime: "codex"` per l'harness
nativo dell'app-server Codex.
</Note>

<Note>
Abilitare il Plugin OpenAI, o selezionare un modello `openai-codex/*`, non
abilita il Plugin integrato dell'app-server Codex. OpenClaw abilita quel Plugin solo
quando selezioni esplicitamente l'harness Codex nativo con
`embeddedHarness.runtime: "codex"` o usi un riferimento legacy `codex/*`.
</Note>

## Copertura delle funzionalità OpenClaw

| Funzionalità OpenAI         | Superficie OpenClaw                                        | Stato                                                  |
| --------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses            | provider di modelli `openai/<model>`                       | Sì                                                     |
| Modelli con abbonamento Codex | `openai-codex/<model>` con OAuth `openai-codex`         | Sì                                                     |
| Harness app-server Codex    | `openai/<model>` con `embeddedHarness.runtime: codex`      | Sì                                                     |
| Ricerca web lato server     | strumento nativo OpenAI Responses                          | Sì, quando la ricerca web è abilitata e nessun provider è fissato |
| Immagini                    | `image_generate`                                           | Sì                                                     |
| Video                       | `video_generate`                                           | Sì                                                     |
| Sintesi vocale testo-voce   | `messages.tts.provider: "openai"` / `tts`                  | Sì                                                     |
| Speech-to-text batch        | `tools.media.audio` / comprensione dei media               | Sì                                                     |
| Speech-to-text in streaming | Voice Call `streaming.provider: "openai"`                  | Sì                                                     |
| Voce realtime               | Voice Call `realtime.provider: "openai"` / Control UI Talk | Sì                                                     |
| Embedding                   | provider di embedding della memoria                        | Sì                                                     |

## Per iniziare

Scegli il metodo di autenticazione preferito e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Chiave API (OpenAI Platform)">
    **Ideale per:** accesso API diretto e fatturazione a consumo.

    <Steps>
      <Step title="Ottieni la tua chiave API">
        Crea o copia una chiave API dalla [dashboard OpenAI Platform](https://platform.openai.com/api-keys).
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

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.5` | API diretta OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | API diretta OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    `openai/*` è il percorso diretto con chiave API OpenAI, a meno che tu non forzi esplicitamente
    l'harness dell'app-server Codex. Usa `openai-codex/*` per Codex OAuth tramite
    il runner PI predefinito, oppure usa `openai/gpt-5.5` con
    `embeddedHarness.runtime: "codex"` per l'esecuzione nativa dell'app-server Codex.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **non** espone `openai/gpt-5.3-codex-spark`. Le richieste API OpenAI live rifiutano quel modello e anche il catalogo Codex corrente non lo espone.
    </Warning>

  </Tab>

  <Tab title="Abbonamento Codex">
    **Ideale per:** usare il tuo abbonamento ChatGPT/Codex invece di una chiave API separata. Codex cloud richiede l'accesso con ChatGPT.

    <Steps>
      <Step title="Esegui Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oppure esegui direttamente OAuth:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Per configurazioni headless o ostili al callback, aggiungi `--device-code` per accedere con un flusso ChatGPT device-code invece del callback browser localhost:

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

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | ChatGPT/Codex OAuth tramite PI | login Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harness app-server Codex | autenticazione app-server Codex |

    <Note>
    Continua a usare l'id provider `openai-codex` per i comandi auth/profile. Il
    prefisso di modello `openai-codex/*` è anche il percorso PI esplicito per Codex OAuth.
    Non seleziona né abilita automaticamente l'harness integrato dell'app-server Codex.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    L'onboarding non importa più materiale OAuth da `~/.codex`. Accedi con OAuth nel browser (predefinito) o con il flusso device-code sopra — OpenClaw gestisce le credenziali risultanti nel proprio archivio auth dell'agente.
    </Note>

    ### Indicatore di stato

    La chat `/status` mostra quale runtime del modello è attivo per la sessione corrente.
    L'harness PI predefinito appare come `Runtime: OpenClaw Pi Default`. Quando è
    selezionato l'harness integrato dell'app-server Codex, `/status` mostra
    `Runtime: OpenAI Codex`. Le sessioni esistenti mantengono il proprio harness id registrato, quindi usa
    `/new` o `/reset` dopo aver modificato `embeddedHarness` se vuoi che `/status`
    rifletta una nuova scelta PI/Codex.

    ### Limite della finestra di contesto

    OpenClaw tratta i metadati del modello e il limite di contesto del runtime come valori separati.

    Per `openai-codex/gpt-5.5` tramite Codex OAuth:

    - `contextWindow` nativo: `1000000`
    - limite predefinito `contextTokens` del runtime: `272000`

    Il limite predefinito più piccolo offre in pratica migliori caratteristiche di latenza e qualità. Sovrascrivilo con `contextTokens`:

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
    Usa `contextWindow` per dichiarare i metadati nativi del modello. Usa `contextTokens` per limitare il budget di contesto del runtime.
    </Note>

    ### Recupero del catalogo

    OpenClaw usa i metadati del catalogo Codex upstream per `gpt-5.5` quando sono
    presenti. Se la discovery Codex live omette la riga `openai-codex/gpt-5.5` mentre
    l'account è autenticato, OpenClaw sintetizza quella riga del modello OAuth così
    che Cron, sottoagente e le esecuzioni del modello predefinito configurato non falliscano con
    `Unknown model`.

  </Tab>
</Tabs>

## Generazione di immagini

Il Plugin integrato `openai` registra la generazione di immagini tramite lo strumento `image_generate`.
Supporta sia la generazione di immagini OpenAI con chiave API sia la
generazione di immagini tramite Codex OAuth usando lo stesso riferimento di modello `openai/gpt-image-2`.

| Capacità                  | Chiave API OpenAI                   | Codex OAuth                          |
| ------------------------- | ----------------------------------- | ------------------------------------ |
| Riferimento modello       | `openai/gpt-image-2`                | `openai/gpt-image-2`                 |
| Autenticazione            | `OPENAI_API_KEY`                    | accesso OpenAI Codex OAuth           |
| Trasporto                 | OpenAI Images API                   | backend Codex Responses              |
| Immagini massime per richiesta | 4                              | 4                                    |
| Modalità modifica         | Abilitata (fino a 5 immagini di riferimento) | Abilitata (fino a 5 immagini di riferimento) |
| Override dimensioni       | Supportati, incluse dimensioni 2K/4K | Supportati, incluse dimensioni 2K/4K |
| Rapporto d'aspetto / risoluzione | Non inoltrati a OpenAI Images API | Mappati a una dimensione supportata quando sicuro |

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

`gpt-image-2` è il valore predefinito sia per la generazione text-to-image di OpenAI sia per la
modifica di immagini. `gpt-image-1` resta utilizzabile come override esplicito del modello, ma i nuovi
flussi di lavoro OpenAI per immagini dovrebbero usare `openai/gpt-image-2`.

Per le installazioni con Codex OAuth, mantieni lo stesso ref `openai/gpt-image-2`. Quando è configurato un
profilo OAuth `openai-codex`, OpenClaw risolve quel token di accesso OAuth memorizzato e invia le richieste di immagini tramite il backend Codex Responses. Non prova prima `OPENAI_API_KEY` e non usa in silenzio una chiave API come fallback per quella richiesta. Configura invece esplicitamente `models.providers.openai` con una chiave API,
un base URL personalizzato o un endpoint Azure quando vuoi usare il percorso diretto OpenAI Images API.
Se quell'endpoint immagini personalizzato si trova su una LAN fidata o su un indirizzo privato, imposta anche
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw continua a bloccare gli endpoint immagini OpenAI-compatibili privati/interni a meno che questo opt-in non sia presente.

Genera:

```
/tool image_generate model=openai/gpt-image-2 prompt="Un raffinato poster di lancio per OpenClaw su macOS" size=3840x2160 count=1
```

Modifica:

```
/tool image_generate model=openai/gpt-image-2 prompt="Mantieni la forma dell'oggetto, cambia il materiale in vetro traslucido" image=/path/to/reference.png size=1024x1536
```

## Generazione di video

Il Plugin integrato `openai` registra la generazione di video tramite lo strumento `video_generate`.

| Capacità         | Valore                                                                            |
| ---------------- | --------------------------------------------------------------------------------- |
| Modello predefinito | `openai/sora-2`                                                                |
| Modalità         | Da testo a video, da immagine a video, modifica di un singolo video              |
| Input di riferimento | 1 immagine o 1 video                                                          |
| Override dimensioni | Supportati                                                                     |
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
Vedi [Generazione di video](/it/tools/video-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Contributo al prompt GPT-5

OpenClaw aggiunge un contributo condiviso al prompt GPT-5 per le esecuzioni della famiglia GPT-5 tra provider. Si applica per id modello, quindi `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` e altri ref GPT-5 compatibili ricevono lo stesso overlay. I modelli GPT-4.x meno recenti no.

L'harness Codex nativo integrato usa lo stesso comportamento GPT-5 e lo stesso overlay Heartbeat tramite le istruzioni developer dell'app-server Codex, quindi le sessioni `openai/gpt-5.x` forzate tramite `embeddedHarness.runtime: "codex"` mantengono lo stesso follow-through e la stessa guida Heartbeat proattiva anche se Codex possiede il resto del prompt dell'harness.

Il contributo GPT-5 aggiunge un contratto di comportamento con tag per persistenza della persona, sicurezza di esecuzione, disciplina degli strumenti, forma dell'output, controlli di completamento e verifica. Il comportamento specifico del canale per risposte e messaggi silenziosi resta nel system prompt condiviso di OpenClaw e nella policy di consegna in uscita. La guida GPT-5 è sempre abilitata per i modelli corrispondenti. Il livello di stile di interazione amichevole è separato e configurabile.

| Valore                 | Effetto                                     |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (predefinito) | Abilita il livello di stile di interazione amichevole |
| `"on"`                 | Alias di `"friendly"`                       |
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
I valori non distinguono tra maiuscole e minuscole a runtime, quindi sia `"Off"` sia `"off"` disabilitano il livello di stile amichevole.
</Tip>

<Note>
Il valore legacy `plugins.entries.openai.config.personality` viene ancora letto come fallback di compatibilità quando l'impostazione condivisa `agents.defaults.promptOverlays.gpt5.personality` non è impostata.
</Note>

## Voce e parlato

<AccordionGroup>
  <Accordion title="Sintesi vocale (TTS)">
    Il Plugin integrato `openai` registra la sintesi vocale per la superficie `messages.tts`.

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voice | `messages.tts.providers.openai.voice` | `coral` |
    | Speed | `messages.tts.providers.openai.speed` | (non impostato) |
    | Instructions | `messages.tts.providers.openai.instructions` | (non impostato, solo `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` per note vocali, `mp3` per file |
    | API key | `messages.tts.providers.openai.apiKey` | Usa come fallback `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

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
    Imposta `OPENAI_TTS_BASE_URL` per sovrascrivere il base URL TTS senza influire sull'endpoint API della chat.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Il Plugin integrato `openai` registra lo speech-to-text batch tramite
    la superficie di trascrizione per la comprensione dei media di OpenClaw.

    - Modello predefinito: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Percorso di input: upload di file audio multipart
    - Supportato da OpenClaw ovunque la trascrizione audio in ingresso usi
      `tools.media.audio`, inclusi segmenti di canali vocali Discord e allegati
      audio dei canali

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
    configurazione condivisa dei media audio o dalla richiesta di trascrizione per chiamata.

  </Accordion>

  <Accordion title="Trascrizione realtime">
    Il Plugin integrato `openai` registra la trascrizione realtime per il Plugin Voice Call.

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Language | `...openai.language` | (non impostato) |
    | Prompt | `...openai.prompt` | (non impostato) |
    | Silence duration | `...openai.silenceDurationMs` | `800` |
    | VAD threshold | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | Usa come fallback `OPENAI_API_KEY` |

    <Note>
    Usa una connessione WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Questo provider di streaming è per il percorso di trascrizione realtime di Voice Call; la voce Discord attualmente registra brevi segmenti e usa invece il percorso di trascrizione batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voce realtime">
    Il Plugin integrato `openai` registra la voce realtime per il Plugin Voice Call.

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voice | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | VAD threshold | `...openai.vadThreshold` | `0.5` |
    | Silence duration | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | Usa come fallback `OPENAI_API_KEY` |

    <Note>
    Supporta Azure OpenAI tramite le chiavi di configurazione `azureEndpoint` e `azureDeployment`. Supporta la chiamata bidirezionale degli strumenti. Usa il formato audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Il provider integrato `openai` può usare una risorsa Azure OpenAI per la generazione di immagini
sovrascrivendo il base URL. Nel percorso di generazione immagini, OpenClaw
rileva gli hostname Azure su `models.providers.openai.baseUrl` e passa
automaticamente alla forma di richiesta Azure.

<Note>
La voce realtime usa un percorso di configurazione separato
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e non è influenzata da `models.providers.openai.baseUrl`. Vedi l'accordion **Voce
realtime** in [Voce e parlato](#voice-and-speech) per le impostazioni Azure.
</Note>

Usa Azure OpenAI quando:

- Hai già un abbonamento, quota o contratto enterprise Azure OpenAI
- Hai bisogno della residenza dei dati regionale o dei controlli di conformità forniti da Azure
- Vuoi mantenere il traffico all'interno di una tenancy Azure esistente

### Configurazione

Per la generazione di immagini Azure tramite il provider integrato `openai`, punta
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

OpenClaw riconosce questi suffissi host Azure per il percorso Azure di generazione immagini:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Per le richieste di generazione immagini su un host Azure riconosciuto, OpenClaw:

- Invia l'header `api-key` invece di `Authorization: Bearer`
- Usa percorsi con scope di deployment (`/openai/deployments/{deployment}/...`)
- Aggiunge `?api-version=...` a ogni richiesta

Gli altri base URL (OpenAI pubblico, proxy OpenAI-compatibili) mantengono la forma standard della richiesta immagini OpenAI.

<Note>
L'instradamento Azure per il percorso di generazione immagini del provider `openai` richiede
OpenClaw 2026.4.22 o successivo. Le versioni precedenti trattano qualsiasi
`openai.baseUrl` personalizzato come endpoint OpenAI pubblico e falliscono con i deployment
immagini Azure.
</Note>

### Versione API

Imposta `AZURE_OPENAI_API_VERSION` per fissare una specifica versione preview o GA di Azure
per il percorso di generazione immagini Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Il valore predefinito è `2024-12-01-preview` quando la variabile non è impostata.

### I nomi dei modelli sono nomi di deployment

Azure OpenAI collega i modelli ai deployment. Per le richieste di generazione immagini Azure
instradate tramite il provider integrato `openai`, il campo `model` in OpenClaw
deve essere il **nome del deployment Azure** configurato nel portale Azure, non
l'id pubblico del modello OpenAI.

Se crei un deployment chiamato `gpt-image-2-prod` che serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Un poster pulito" size=1024x1024 count=1
```

La stessa regola del nome del deployment si applica alle chiamate di generazione immagini instradate tramite
il provider integrato `openai`.

### Disponibilità regionale

La generazione immagini Azure è attualmente disponibile solo in un sottoinsieme di regioni
(ad esempio `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Controlla l'elenco aggiornato delle regioni Microsoft prima di creare un
deployment e conferma che il modello specifico sia offerto nella tua regione.

### Differenze dei parametri

Azure OpenAI e OpenAI pubblico non accettano sempre gli stessi parametri immagine.
Azure può rifiutare opzioni che OpenAI pubblico consente (ad esempio certi
valori `background` su `gpt-image-2`) o esporle solo su specifiche versioni
del modello. Queste differenze dipendono da Azure e dal modello sottostante, non da
OpenClaw. Se una richiesta Azure fallisce con un errore di validazione, controlla
l'insieme di parametri supportato dal tuo specifico deployment e dalla versione API nel
portale Azure.

<Note>
Azure OpenAI usa trasporto nativo e comportamento compat, ma non riceve
gli header nascosti di attribuzione di OpenClaw — vedi l'accordion **Percorsi nativi vs OpenAI-compatible**
in [Configurazione avanzata](#advanced-configuration).

Per traffico chat o Responses su Azure (oltre la generazione di immagini), usa il
flusso di onboarding o una configurazione provider Azure dedicata — `openai.baseUrl` da solo
non applica la forma API/auth di Azure. Esiste un provider separato
`azure-openai-responses/*`; vedi
l'accordion Compaction lato server qui sotto.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Trasporto (WebSocket vs SSE)">
    OpenClaw usa WebSocket-first con fallback SSE (`"auto"`) sia per `openai/*` sia per `openai-codex/*`.

    In modalità `"auto"`, OpenClaw:
    - Riprova un errore iniziale WebSocket prima di passare a SSE
    - Dopo un errore, segna WebSocket come degradato per ~60 secondi e usa SSE durante il cool-down
    - Collega header stabili di identità di sessione e turno per retry e reconnessioni
    - Normalizza i contatori d'uso (`input_tokens` / `prompt_tokens`) tra le varianti di trasporto

    | Value | Behavior |
    |-------|----------|
    | `"auto"` (predefinito) | WebSocket prima, fallback SSE |
    | `"sse"` | Forza solo SSE |
    | `"websocket"` | Forza solo WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
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
    - [Risposte API in streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Warm-up WebSocket">
    OpenClaw abilita il warm-up WebSocket per impostazione predefinita per `openai/*` e `openai-codex/*` per ridurre la latenza del primo turno.

    ```json5
    // Disabilita warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modalità veloce">
    OpenClaw espone un toggle condiviso per la modalità veloce per `openai/*` e `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando abilitata, OpenClaw mappa la modalità veloce all'elaborazione prioritaria OpenAI (`service_tier = "priority"`). I valori `service_tier` esistenti vengono preservati e la modalità veloce non riscrive `reasoning` né `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Gli override di sessione hanno la precedenza sulla configurazione. Cancellare l'override di sessione nella UI Sessions riporta la sessione al valore predefinito configurato.
    </Note>

  </Accordion>

  <Accordion title="Elaborazione prioritaria (service_tier)">
    L'API OpenAI espone l'elaborazione prioritaria tramite `service_tier`. Impostala per modello in OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
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
    Per i modelli direct OpenAI Responses (`openai/*` su `api.openai.com`), il wrapper di stream Pi-harness del Plugin OpenAI abilita automaticamente la Compaction lato server:

    - Forza `store: true` (a meno che la compat del modello non imposti `supportsStore: false`)
    - Inserisce `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predefinito: 70% di `contextWindow` (oppure `80000` quando non disponibile)

    Questo si applica al percorso integrato Pi harness e agli hook provider OpenAI usati dalle esecuzioni embedded. L'harness nativo dell'app-server Codex gestisce il proprio contesto tramite Codex ed è configurato separatamente con `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Abilita esplicitamente">
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
                "openai/gpt-5.5": {
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
                "openai/gpt-5.5": {
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
    `responsesServerCompaction` controlla solo l'inserimento di `context_management`. I modelli direct OpenAI Responses continuano comunque a forzare `store: true` a meno che la compat non imposti `supportsStore: false`.
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
    - Non tratta più un turno di sola pianificazione come progresso riuscito quando è disponibile un'azione strumento
    - Riprova il turno con un indirizzamento agisci-ora
    - Abilita automaticamente `update_plan` per lavori sostanziali
    - Mostra uno stato bloccato esplicito se il modello continua a pianificare senza agire

    <Note>
    Limitato solo alle esecuzioni GPT-5 della famiglia OpenAI e Codex. Gli altri provider e le famiglie di modelli meno recenti mantengono il comportamento predefinito.
    </Note>

  </Accordion>

  <Accordion title="Percorsi nativi vs OpenAI-compatible">
    OpenClaw tratta in modo diverso gli endpoint direct OpenAI, Codex e Azure OpenAI rispetto ai proxy generici OpenAI-compatible `/v1`:

    **Percorsi nativi** (`openai/*`, Azure OpenAI):
    - Mantengono `reasoning: { effort: "none" }` solo per i modelli che supportano l'effort `none` di OpenAI
    - Omettono il reasoning disabilitato per modelli o proxy che rifiutano `reasoning.effort: "none"`
    - Impostano per default gli schema degli strumenti in modalità strict
    - Collegano header nascosti di attribuzione solo su host nativi verificati
    - Mantengono la forma di richiesta solo OpenAI (`service_tier`, `store`, reasoning-compat, hint della cache del prompt)

    **Percorsi proxy/compatibili:**
    - Usano un comportamento compat più permissivo
    - Rimuovono `store` di Completions dai payload `openai-completions` non nativi
    - Accettano JSON pass-through avanzato `params.extra_body`/`params.extraBody` per proxy Completions OpenAI-compatible
    - Non forzano schema degli strumenti strict né header solo nativi

    Azure OpenAI usa trasporto nativo e comportamento compat, ma non riceve gli header nascosti di attribuzione.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, ref del modello e comportamento di failover.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagini e selezione del provider.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli dell'autenticazione e regole di riutilizzo delle credenziali.
  </Card>
</CardGroup>
