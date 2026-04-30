---
read_when:
    - Vuoi usare i modelli OpenAI in OpenClaw
    - Vuoi l'autenticazione tramite abbonamento Codex invece delle chiavi API
    - È necessario un comportamento di esecuzione più rigoroso dell'agente GPT-5
summary: Usa OpenAI tramite chiavi API o un abbonamento Codex in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-30T16:29:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e113f2418f82a8859f208f85efb55114bda7bc17beeb28f012b19e861609dad
    source_path: providers/openai.md
    workflow: 16
---

OpenAI fornisce API per sviluppatori per i modelli GPT, e Codex è disponibile anche come agente di coding del piano ChatGPT tramite i client Codex di OpenAI. OpenClaw mantiene separate queste superfici affinché la configurazione resti prevedibile.

OpenClaw supporta tre route della famiglia OpenAI. Il prefisso del modello seleziona la route provider/auth; un'impostazione di runtime separata seleziona chi esegue il ciclo agente incorporato:

- **Chiave API** — accesso diretto a OpenAI Platform con fatturazione basata sull'uso (modelli `openai/*`)
- **Abbonamento Codex tramite PI** — accesso ChatGPT/Codex con accesso in abbonamento (modelli `openai-codex/*`)
- **Harness app-server Codex** — esecuzione nativa app-server Codex (modelli `openai/*` più `agents.defaults.agentRuntime.id: "codex"`)

OpenAI supporta esplicitamente l'uso di OAuth in abbonamento in strumenti e workflow esterni come OpenClaw.

Provider, modello, runtime e canale sono livelli separati. Se queste etichette si stanno confondendo tra loro, leggi [Runtime degli agenti](/it/concepts/agent-runtimes) prima di modificare la configurazione.

## Scelta rapida

| Obiettivo                                     | Usa                                              | Note                                                                         |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Fatturazione diretta con chiave API           | `openai/gpt-5.5`                                 | Imposta `OPENAI_API_KEY` o esegui l'onboarding per la chiave API OpenAI.     |
| GPT-5.5 con autenticazione abbonamento ChatGPT/Codex | `openai-codex/gpt-5.5`                           | Route PI predefinita per OAuth Codex. Scelta iniziale migliore per configurazioni con abbonamento. |
| GPT-5.5 con comportamento nativo app-server Codex | `openai/gpt-5.5` più `agentRuntime.id: "codex"` | Forza l'harness app-server Codex per quel riferimento di modello.            |
| Generazione o modifica di immagini            | `openai/gpt-image-2`                             | Funziona con `OPENAI_API_KEY` o con OAuth OpenAI Codex.                      |
| Immagini con sfondo trasparente               | `openai/gpt-image-1.5`                           | Usa `outputFormat=png` o `webp` e `openai.background=transparent`.          |

## Mappa dei nomi

I nomi sono simili ma non intercambiabili:

| Nome che vedi                     | Livello           | Significato                                                                                       |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Prefisso provider | Route API diretta di OpenAI Platform.                                                             |
| `openai-codex`                     | Prefisso provider | Route OAuth/abbonamento OpenAI Codex tramite il normale runner PI di OpenClaw.                    |
| `codex` plugin                     | Plugin            | Plugin OpenClaw incluso che fornisce il runtime nativo app-server Codex e i controlli chat `/codex`. |
| `agentRuntime.id: codex`           | Runtime agente    | Forza l'harness nativo app-server Codex per i turni incorporati.                                  |
| `/codex ...`                       | Set di comandi chat | Associa/controlla thread app-server Codex da una conversazione.                                  |
| `runtime: "acp", agentId: "codex"` | Route sessione ACP | Percorso di fallback esplicito che esegue Codex tramite ACP/acpx.                                |

Questo significa che una configurazione può contenere intenzionalmente sia `openai-codex/*` sia il plugin `codex`. È valido quando vuoi OAuth Codex tramite PI e vuoi anche che siano disponibili i controlli chat nativi `/codex`. `openclaw doctor` avvisa riguardo a quella combinazione così puoi confermare che sia intenzionale; non la riscrive.

<Note>
GPT-5.5 è disponibile sia tramite accesso diretto con chiave API di OpenAI Platform sia tramite route abbonamento/OAuth. Usa `openai/gpt-5.5` per traffico diretto con `OPENAI_API_KEY`, `openai-codex/gpt-5.5` per OAuth Codex tramite PI, oppure `openai/gpt-5.5` con `agentRuntime.id: "codex"` per l'harness nativo app-server Codex.
</Note>

<Note>
Abilitare il plugin OpenAI, o selezionare un modello `openai-codex/*`, non abilita il plugin app-server Codex incluso. OpenClaw abilita quel plugin solo quando selezioni esplicitamente l'harness nativo Codex con `agentRuntime.id: "codex"` o usi un riferimento di modello legacy `codex/*`.
Se il plugin `codex` incluso è abilitato ma `openai-codex/*` viene ancora risolto tramite PI, `openclaw doctor` avvisa e lascia invariata la route.
</Note>

## Copertura delle funzionalità OpenClaw

| Capacità OpenAI          | Superficie OpenClaw                                        | Stato                                                  |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | Provider modello `openai/<model>`                          | Sì                                                     |
| Modelli abbonamento Codex | `openai-codex/<model>` con OAuth `openai-codex`            | Sì                                                     |
| Harness app-server Codex  | `openai/<model>` con `agentRuntime.id: codex`              | Sì                                                     |
| Ricerca web lato server   | Strumento nativo OpenAI Responses                          | Sì, quando la ricerca web è abilitata e nessun provider è vincolato |
| Immagini                  | `image_generate`                                           | Sì                                                     |
| Video                     | `video_generate`                                           | Sì                                                     |
| Text-to-speech            | `messages.tts.provider: "openai"` / `tts`                  | Sì                                                     |
| Speech-to-text batch      | `tools.media.audio` / comprensione dei media               | Sì                                                     |
| Speech-to-text in streaming | Voice Call `streaming.provider: "openai"`                | Sì                                                     |
| Voce realtime             | Voice Call `realtime.provider: "openai"` / Control UI Talk | Sì                                                     |
| Embeddings                | Provider embedding memoria                                 | Sì                                                     |

## Embedding memoria

OpenClaw può usare OpenAI, o un endpoint di embedding compatibile con OpenAI, per l'indicizzazione `memory_search` e gli embedding delle query:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

Per endpoint compatibili con OpenAI che richiedono etichette di embedding asimmetriche, imposta `queryInputType` e `documentInputType` sotto `memorySearch`. OpenClaw li inoltra come campi di richiesta `input_type` specifici del provider: gli embedding delle query usano `queryInputType`; i frammenti di memoria indicizzati e l'indicizzazione batch usano `documentInputType`. Consulta il [Riferimento configurazione memoria](/it/reference/memory-config#provider-specific-config) per l'esempio completo.

## Per iniziare

Scegli il metodo di autenticazione preferito e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Chiave API (OpenAI Platform)">
    **Ideale per:** accesso API diretto e fatturazione basata sull'uso.

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

    ### Riepilogo route

    | Riferimento modello    | Configurazione runtime      | Route                       | Auth             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omessa / `agentRuntime.id: "pi"`    | API diretta OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omessa / `agentRuntime.id: "pi"`    | API diretta OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Harness app-server Codex    | App-server Codex |

    <Note>
    `openai/*` è la route diretta con chiave API OpenAI, a meno che tu non forzi esplicitamente l'harness app-server Codex. Usa `openai-codex/*` per OAuth Codex tramite il runner PI predefinito, oppure usa `openai/gpt-5.5` con `agentRuntime.id: "codex"` per l'esecuzione nativa app-server Codex.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **non** espone `openai/gpt-5.3-codex-spark`. Le richieste API OpenAI live rifiutano quel modello, e neanche l'attuale catalogo Codex lo espone.
    </Warning>

  </Tab>

  <Tab title="Abbonamento Codex">
    **Ideale per:** usare il tuo abbonamento ChatGPT/Codex invece di una chiave API separata. Codex cloud richiede l'accesso a ChatGPT.

    <Steps>
      <Step title="Esegui OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oppure esegui OAuth direttamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Per configurazioni headless o ostili ai callback, aggiungi `--device-code` per accedere con un flusso di codice dispositivo ChatGPT invece del callback browser localhost:

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

    ### Riepilogo route

    | Riferimento modello | Configurazione runtime | Route | Auth |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | omessa / `runtime: "pi"` | OAuth ChatGPT/Codex tramite PI | Accesso Codex |
    | `openai-codex/gpt-5.4-mini` | omessa / `runtime: "pi"` | OAuth ChatGPT/Codex tramite PI | Accesso Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Ancora PI, a meno che un plugin non dichiari esplicitamente `openai-codex` | Accesso Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Harness app-server Codex | Auth app-server Codex |

    <Note>
    Continua a usare l'id provider `openai-codex` per i comandi auth/profilo. Il prefisso modello `openai-codex/*` è anche la route PI esplicita per OAuth Codex. Non seleziona né abilita automaticamente l'harness app-server Codex incluso.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    L'onboarding non importa più materiale OAuth da `~/.codex`. Accedi con OAuth tramite browser (predefinito) o con il flusso di codice dispositivo sopra: OpenClaw gestisce le credenziali risultanti nel proprio archivio auth degli agenti.
    </Note>

    ### Indicatore di stato

    Chat `/status` mostra quale runtime del modello è attivo per la sessione corrente.
    L'harness Pi predefinito appare come `Runtime: OpenClaw Pi Default`. Quando è selezionato
    l'harness app-server Codex incluso, `/status` mostra
    `Runtime: OpenAI Codex`. Le sessioni esistenti mantengono l'id dell'harness registrato, quindi usa
    `/new` o `/reset` dopo aver modificato `agentRuntime` se vuoi che `/status`
    rifletta una nuova scelta Pi/Codex.

    ### Avviso di Doctor

    Se il Plugin `codex` incluso è abilitato mentre è selezionata la route
    `openai-codex/*` di questa scheda, `openclaw doctor` avvisa che il modello
    viene ancora risolto tramite Pi. Mantieni invariata la configurazione quando quella è la
    route di autenticazione tramite abbonamento prevista. Passa a `openai/<model>` più
    `agentRuntime.id: "codex"` solo quando vuoi l'esecuzione nativa
    app-server Codex.

    ### Limite della finestra di contesto

    OpenClaw tratta i metadati del modello e il limite di contesto del runtime come valori separati.

    Per `openai-codex/gpt-5.5` tramite OAuth Codex:

    - `contextWindow` nativa: `1000000`
    - Limite predefinito `contextTokens` del runtime: `272000`

    Il limite predefinito più piccolo offre in pratica caratteristiche migliori di latenza e qualità. Sovrascrivilo con `contextTokens`:

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

    ### Ripristino del catalogo

    OpenClaw usa i metadati del catalogo Codex upstream per `gpt-5.5` quando sono
    presenti. Se la discovery Codex live omette la riga `openai-codex/gpt-5.5` mentre
    l'account è autenticato, OpenClaw sintetizza quella riga del modello OAuth in modo che
    le esecuzioni Cron, di sub-agent e con modello predefinito configurato non falliscano con
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticazione app-server Codex nativa

L'harness app-server Codex nativo usa riferimenti modello `openai/*` più
`agentRuntime.id: "codex"`, ma la sua autenticazione è ancora basata sull'account. OpenClaw
seleziona l'autenticazione in questo ordine:

1. Un profilo di autenticazione OpenClaw `openai-codex` esplicito associato all'agent.
2. L'account esistente dell'app-server, come un accesso ChatGPT locale tramite CLI Codex.
3. Solo per avvii app-server stdio locali, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando l'app-server segnala assenza di account e richiede ancora
   l'autenticazione OpenAI.

Questo significa che un accesso locale a un abbonamento ChatGPT/Codex non viene sostituito solo
perché anche il processo Gateway ha `OPENAI_API_KEY` per modelli OpenAI diretti
o embeddings. Il fallback tramite chiave API env è solo il percorso locale stdio senza account; non
viene inviato alle connessioni app-server WebSocket. Quando è selezionato un profilo Codex
in stile abbonamento, OpenClaw mantiene anche `CODEX_API_KEY` e `OPENAI_API_KEY`
fuori dal processo figlio app-server stdio generato e invia le credenziali selezionate
tramite l'RPC di login dell'app-server.

## Generazione di immagini

Il Plugin `openai` incluso registra la generazione di immagini tramite lo strumento `image_generate`.
Supporta sia la generazione di immagini con chiave API OpenAI sia la generazione di immagini
con OAuth Codex tramite lo stesso riferimento modello `openai/gpt-image-2`.

| Funzionalità              | Chiave API OpenAI                  | OAuth Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Riferimento modello       | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Autenticazione            | `OPENAI_API_KEY`                   | Accesso OAuth OpenAI Codex           |
| Trasporto                 | API OpenAI Images                  | Backend Codex Responses              |
| Immagini massime per richiesta | 4                              | 4                                    |
| Modalità modifica         | Abilitata (fino a 5 immagini di riferimento) | Abilitata (fino a 5 immagini di riferimento) |
| Override dimensione       | Supportati, incluse dimensioni 2K/4K | Supportati, incluse dimensioni 2K/4K |
| Proporzioni / risoluzione | Non inoltrate all'API OpenAI Images | Mappate a una dimensione supportata quando sicuro |

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
Vedi [Generazione di immagini](/it/tools/image-generation) per parametri condivisi degli strumenti, selezione del provider e comportamento di failover.
</Note>

`gpt-image-2` è il valore predefinito sia per la generazione OpenAI da testo a immagine sia per la modifica
delle immagini. `gpt-image-1.5`, `gpt-image-1` e `gpt-image-1-mini` restano utilizzabili come
override espliciti del modello. Usa `openai/gpt-image-1.5` per l'output
PNG/WebP con sfondo trasparente; l'API `gpt-image-2` attuale rifiuta
`background: "transparent"`.

Per una richiesta con sfondo trasparente, gli agent devono chiamare `image_generate` con
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` o `"webp"`, e
`background: "transparent"`; la vecchia opzione del provider `openai.background` è
ancora accettata. OpenClaw protegge anche le route pubbliche OpenAI e
OpenAI Codex OAuth riscrivendo le richieste trasparenti predefinite `openai/gpt-image-2`
in `gpt-image-1.5`; Azure e gli endpoint personalizzati compatibili con OpenAI mantengono
i nomi di deployment/modello configurati.

La stessa impostazione è esposta per le esecuzioni CLI headless:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Usa gli stessi flag `--output-format` e `--background` con
`openclaw infer image edit` quando parti da un file di input.
`--openai-background` rimane disponibile come alias specifico di OpenAI.

Per installazioni con OAuth Codex, mantieni lo stesso riferimento `openai/gpt-image-2`. Quando è
configurato un profilo OAuth `openai-codex`, OpenClaw risolve quel token di accesso OAuth
archiviato e invia le richieste di immagini tramite il backend Codex Responses. Non
prova prima `OPENAI_API_KEY` né passa silenziosamente a una chiave API per quella
richiesta. Configura esplicitamente `models.providers.openai` con una chiave API,
un URL base personalizzato o un endpoint Azure quando vuoi usare invece la route diretta dell'API OpenAI Images.
Se quell'endpoint immagini personalizzato è su una LAN/indirizzo privato attendibile, imposta anche
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw mantiene
bloccati gli endpoint immagini privati/interni compatibili con OpenAI a meno che questo opt-in non sia
presente.

Genera:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Genera un PNG trasparente:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Modifica:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Generazione video

Il Plugin `openai` incluso registra la generazione video tramite lo strumento `video_generate`.

| Funzionalità | Valore |
| ---------------- | --------------------------------------------------------------------------------- |
| Modello predefinito | `openai/sora-2` |
| Modalità | Da testo a video, da immagine a video, modifica di singolo video |
| Input di riferimento | 1 immagine o 1 video |
| Override delle dimensioni | Supportati |
| Altri override | `aspectRatio`, `resolution`, `audio`, `watermark` vengono ignorati con un avviso dello strumento |

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
Consulta [Generazione video](/it/tools/video-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Contributo al prompt GPT-5

OpenClaw aggiunge un contributo condiviso al prompt GPT-5 per le esecuzioni della famiglia GPT-5 tra provider. Si applica in base all'ID del modello, quindi `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` e altri riferimenti GPT-5 compatibili ricevono lo stesso overlay. I modelli GPT-4.x precedenti no.

L'harness Codex nativo incluso usa lo stesso comportamento GPT-5 e lo stesso overlay heartbeat tramite le istruzioni per sviluppatori dell'app-server Codex, quindi le sessioni `openai/gpt-5.x` forzate tramite `agentRuntime.id: "codex"` mantengono la stessa guida su completamento accurato e heartbeat proattivo, anche se Codex possiede il resto del prompt dell'harness.

Il contributo GPT-5 aggiunge un contratto di comportamento con tag per persistenza della persona, sicurezza di esecuzione, disciplina degli strumenti, forma dell'output, controlli di completamento e verifica. Il comportamento di risposta specifico per canale e dei messaggi silenziosi resta nel prompt di sistema condiviso di OpenClaw e nella policy di consegna in uscita. La guida GPT-5 è sempre abilitata per i modelli corrispondenti. Il livello di stile di interazione amichevole è separato e configurabile.

| Valore | Effetto |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (predefinito) | Abilita il livello di stile di interazione amichevole |
| `"on"` | Alias di `"friendly"` |
| `"off"` | Disabilita solo il livello di stile amichevole |

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
I valori non distinguono tra maiuscole e minuscole in fase di esecuzione, quindi `"Off"` e `"off"` disabilitano entrambi il livello di stile amichevole.
</Tip>

<Note>
Il valore legacy `plugins.entries.openai.config.personality` viene ancora letto come fallback di compatibilità quando l'impostazione condivisa `agents.defaults.promptOverlays.gpt5.personality` non è impostata.
</Note>

## Voce e parlato

<AccordionGroup>
  <Accordion title="Sintesi vocale (TTS)">
    Il Plugin `openai` incluso registra la sintesi vocale per la superficie `messages.tts`.

    | Impostazione | Percorso di configurazione | Predefinito |
    |---------|------------|---------|
    | Modello | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voce | `messages.tts.providers.openai.voice` | `coral` |
    | Velocità | `messages.tts.providers.openai.speed` | (non impostato) |
    | Istruzioni | `messages.tts.providers.openai.instructions` | (non impostato, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` per le note vocali, `mp3` per i file |
    | Chiave API | `messages.tts.providers.openai.apiKey` | Ripiega su `OPENAI_API_KEY` |
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
    Imposta `OPENAI_TTS_BASE_URL` per sovrascrivere l'URL di base TTS senza influire sull'endpoint dell'API di chat.
    </Note>

  </Accordion>

  <Accordion title="Da parlato a testo">
    Il Plugin `openai` incluso registra la trascrizione batch da parlato a testo tramite
    la superficie di trascrizione per la comprensione dei media di OpenClaw.

    - Modello predefinito: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Percorso di input: caricamento di file audio multipart
    - Supportato da OpenClaw ovunque la trascrizione audio in ingresso usi
      `tools.media.audio`, inclusi segmenti di canali vocali Discord e allegati audio
      dei canali

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

    La lingua e i suggerimenti del prompt vengono inoltrati a OpenAI quando forniti dalla
    configurazione multimediale audio condivisa o dalla richiesta di trascrizione per singola chiamata.

  </Accordion>

  <Accordion title="Trascrizione in tempo reale">
    Il Plugin `openai` incluso registra la trascrizione in tempo reale per il Plugin Voice Call.

    | Impostazione | Percorso di configurazione | Predefinito |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Lingua | `...openai.language` | (non impostato) |
    | Prompt | `...openai.prompt` | (non impostato) |
    | Durata del silenzio | `...openai.silenceDurationMs` | `800` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Chiave API | `...openai.apiKey` | Ripiega su `OPENAI_API_KEY` |

    <Note>
    Usa una connessione WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Questo provider di streaming è per il percorso di trascrizione in tempo reale di Voice Call; la voce Discord attualmente registra brevi segmenti e usa invece il percorso di trascrizione batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voce in tempo reale">
    Il Plugin `openai` incluso registra la voce in tempo reale per il Plugin Voice Call.

    | Impostazione | Percorso di configurazione | Predefinito |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voce | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Durata del silenzio | `...openai.silenceDurationMs` | `500` |
    | Chiave API | `...openai.apiKey` | Ripiega su `OPENAI_API_KEY` |

    <Note>
    Supporta Azure OpenAI tramite le chiavi di configurazione `azureEndpoint` e `azureDeployment` per i bridge backend in tempo reale. Supporta le chiamate bidirezionali agli strumenti. Usa il formato audio G.711 u-law.
    </Note>

    <Note>
    Control UI Talk usa sessioni OpenAI in tempo reale nel browser con un segreto
    client effimero coniato dal Gateway e uno scambio SDP WebRTC diretto dal browser verso la
    OpenAI Realtime API. La verifica live del maintainer è disponibile con
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    il ramo OpenAI conia un segreto client in Node, genera un'offerta SDP del browser
    con contenuti multimediali di microfono simulati, la invia a OpenAI e applica la risposta SDP
    senza registrare segreti nei log.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Il provider `openai` incluso può puntare a una risorsa Azure OpenAI per la generazione
di immagini sovrascrivendo l'URL di base. Nel percorso di generazione immagini, OpenClaw
rileva gli hostname Azure su `models.providers.openai.baseUrl` e passa automaticamente alla
forma di richiesta di Azure.

<Note>
La voce in tempo reale usa un percorso di configurazione separato
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e non è influenzata da `models.providers.openai.baseUrl`. Consulta l'accordion **Voce in tempo reale**
in [Voce e parlato](#voice-and-speech) per le relative
impostazioni Azure.
</Note>

Usa Azure OpenAI quando:

- Hai già una sottoscrizione, una quota o un contratto enterprise Azure OpenAI
- Hai bisogno della residenza regionale dei dati o dei controlli di conformità forniti da Azure
- Vuoi mantenere il traffico all'interno di un tenant Azure esistente

### Configurazione

Per la generazione di immagini Azure tramite il provider `openai` incluso, punta
`models.providers.openai.baseUrl` alla tua risorsa Azure e imposta `apiKey` sulla
chiave Azure OpenAI (non su una chiave OpenAI Platform):

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

OpenClaw riconosce questi suffissi host Azure per il percorso di generazione immagini
Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Per le richieste di generazione immagini su un host Azure riconosciuto, OpenClaw:

- Invia l'intestazione `api-key` invece di `Authorization: Bearer`
- Usa percorsi con ambito di deployment (`/openai/deployments/{deployment}/...`)
- Aggiunge `?api-version=...` a ogni richiesta
- Usa un timeout di richiesta predefinito di 600 s per le chiamate di generazione immagini Azure.
  I valori `timeoutMs` per singola chiamata sovrascrivono comunque questo predefinito.

Gli altri URL di base (OpenAI pubblico, proxy compatibili con OpenAI) mantengono la forma
standard delle richieste immagini OpenAI.

<Note>
Il routing Azure per il percorso di generazione immagini del provider `openai` richiede
OpenClaw 2026.4.22 o versione successiva. Le versioni precedenti trattano qualsiasi
`openai.baseUrl` personalizzato come l'endpoint OpenAI pubblico e non funzioneranno con i deployment
immagini Azure.
</Note>

### Versione API

Imposta `AZURE_OPENAI_API_VERSION` per fissare una specifica versione Azure preview o GA
per il percorso di generazione immagini Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Il valore predefinito è `2024-12-01-preview` quando la variabile non è impostata.

### I nomi dei modelli sono nomi di deployment

Azure OpenAI associa i modelli ai deployment. Per le richieste di generazione immagini Azure
instradate tramite il provider `openai` incluso, il campo `model` in OpenClaw
deve essere il **nome del deployment Azure** configurato nel portale Azure, non
l'id del modello OpenAI pubblico.

Se crei un deployment chiamato `gpt-image-2-prod` che serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La stessa regola del nome del deployment si applica alle chiamate di generazione immagini instradate tramite
il provider `openai` incluso.

### Disponibilità regionale

La generazione immagini Azure è attualmente disponibile solo in un sottoinsieme di regioni
(ad esempio `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Controlla l'elenco attuale delle regioni Microsoft prima di creare un
deployment e conferma che il modello specifico sia offerto nella tua regione.

### Differenze nei parametri

Azure OpenAI e OpenAI pubblico non accettano sempre gli stessi parametri immagine.
Azure può rifiutare opzioni consentite da OpenAI pubblico (ad esempio alcuni
valori `background` su `gpt-image-2`) o esporle solo su specifiche versioni del modello.
Queste differenze derivano da Azure e dal modello sottostante, non da
OpenClaw. Se una richiesta Azure non riesce con un errore di convalida, controlla il
set di parametri supportato dal tuo deployment specifico e dalla versione API nel
portale Azure.

<Note>
Azure OpenAI usa il trasporto nativo e il comportamento compat, ma non riceve
le intestazioni di attribuzione nascoste di OpenClaw: consulta l'accordion **Route native e compatibili con OpenAI**
in [Configurazione avanzata](#advanced-configuration).

Per il traffico chat o Responses su Azure (oltre alla generazione immagini), usa il
flusso di onboarding o una configurazione provider Azure dedicata: `openai.baseUrl` da solo
non adotta la forma API/autenticazione di Azure. Esiste un provider
`azure-openai-responses/*` separato; consulta
l'accordion sulla compaction lato server qui sotto.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Trasporto (WebSocket vs SSE)">
    OpenClaw usa prima WebSocket con fallback SSE (`"auto"`) sia per `openai/*` sia per `openai-codex/*`.

    In modalità `"auto"`, OpenClaw:
    - Ritenta un errore WebSocket iniziale prima di ripiegare su SSE
    - Dopo un errore, contrassegna WebSocket come degradato per ~60 secondi e usa SSE durante il periodo di raffreddamento
    - Allega intestazioni stabili di identità della sessione e del turno per tentativi e riconnessioni
    - Normalizza i contatori d'uso (`input_tokens` / `prompt_tokens`) tra le varianti di trasporto

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

  <Accordion title="Riscaldamento WebSocket">
    OpenClaw abilita il riscaldamento WebSocket per impostazione predefinita per `openai/*` e `openai-codex/*` per ridurre la latenza del primo turno.

    ```json5
    // Disable warm-up
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
    OpenClaw espone un interruttore condiviso per la modalità veloce per `openai/*` e `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Configurazione:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando è abilitata, OpenClaw mappa la modalità veloce sull'elaborazione prioritaria OpenAI (`service_tier = "priority"`). I valori `service_tier` esistenti vengono preservati e la modalità veloce non riscrive `reasoning` o `text.verbosity`.

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
    Le sovrascritture della sessione prevalgono sulla configurazione. Cancellare la sovrascrittura della sessione nella UI Sessions riporta la sessione al valore predefinito configurato.
    </Note>

  </Accordion>

  <Accordion title="Elaborazione prioritaria (service_tier)">
    L'API di OpenAI espone l'elaborazione prioritaria tramite `service_tier`. Impostala per modello in OpenClaw:

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
    Per i modelli OpenAI Responses diretti (`openai/*` su `api.openai.com`), il wrapper di streaming Pi-harness del Plugin OpenAI abilita automaticamente la compaction lato server:

    - Forza `store: true` (a meno che la compatibilità del modello imposti `supportsStore: false`)
    - Inietta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predefinito: 70% di `contextWindow` (o `80000` quando non disponibile)

    Questo si applica al percorso Pi harness integrato e agli hook del provider OpenAI usati dalle esecuzioni incorporate. L'harness nativo del server app Codex gestisce il proprio contesto tramite Codex ed è configurato separatamente con `agents.defaults.agentRuntime.id`.

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
    `responsesServerCompaction` controlla solo l'iniezione di `context_management`. I modelli OpenAI Responses diretti forzano comunque `store: true`, a meno che compat imposti `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modalità GPT strict-agentic">
    Per le esecuzioni della famiglia GPT-5 su `openai/*`, OpenClaw può usare un contratto di esecuzione incorporato più rigoroso:

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
    - Non considera più un turno solo di pianificazione come avanzamento riuscito quando è disponibile un'azione tramite strumento
    - Riprova il turno con un'indicazione per agire subito
    - Abilita automaticamente `update_plan` per lavori sostanziali
    - Mostra uno stato bloccato esplicito se il modello continua a pianificare senza agire

    <Note>
    Limitato solo alle esecuzioni della famiglia GPT-5 di OpenAI e Codex. Altri provider e famiglie di modelli precedenti mantengono il comportamento predefinito.
    </Note>

  </Accordion>

  <Accordion title="Route native vs compatibili con OpenAI">
    OpenClaw tratta gli endpoint diretti OpenAI, Codex e Azure OpenAI in modo diverso dai proxy `/v1` generici compatibili con OpenAI:

    **Route native** (`openai/*`, Azure OpenAI):
    - Mantengono `reasoning: { effort: "none" }` solo per i modelli che supportano l'effort `none` di OpenAI
    - Omettono il reasoning disabilitato per i modelli o i proxy che rifiutano `reasoning.effort: "none"`
    - Impostano gli schemi degli strumenti sulla modalità rigorosa per impostazione predefinita
    - Allegano header di attribuzione nascosti solo sugli host nativi verificati
    - Mantengono l'adattamento delle richieste specifico di OpenAI (`service_tier`, `store`, compatibilità del reasoning, suggerimenti per la cache dei prompt)

    **Route proxy/compatibili:**
    - Usano un comportamento di compatibilità più flessibile
    - Rimuovono `store` di Completions dai payload `openai-completions` non nativi
    - Accettano JSON pass-through avanzato `params.extra_body`/`params.extraBody` per proxy Completions compatibili con OpenAI
    - Accettano `params.chat_template_kwargs` per proxy Completions compatibili con OpenAI come vLLM
    - Non forzano schemi degli strumenti rigorosi né header solo nativi

    Azure OpenAI usa il trasporto nativo e il comportamento di compatibilità, ma non riceve gli header di attribuzione nascosti.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti dei modelli e del comportamento di failover.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi degli strumenti per immagini e selezione del provider.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi degli strumenti per video e selezione del provider.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli di autenticazione e regole di riuso delle credenziali.
  </Card>
</CardGroup>
