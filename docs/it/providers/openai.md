---
read_when:
    - Vuoi usare i modelli OpenAI in OpenClaw
    - Vuoi usare l'autenticazione tramite abbonamento Codex invece delle chiavi API
    - Ti serve un comportamento di esecuzione degli agenti GPT-5 più rigoroso
summary: Usa OpenAI tramite chiavi API o un abbonamento Codex in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-07T13:25:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a37c0b2c227674b6762aea70ce6d640d49044117c9244377058032ade561d6b
    source_path: providers/openai.md
    workflow: 16
---

OpenAI fornisce API per sviluppatori per i modelli GPT, e Codex è disponibile anche come agente di coding con piano
ChatGPT tramite i client Codex di OpenAI. OpenClaw mantiene separate queste
superfici in modo che la configurazione resti prevedibile.

OpenClaw usa `openai/*` come route canonica per i modelli OpenAI. I turni degli agenti
incorporati sui modelli OpenAI vengono eseguiti tramite il runtime app-server nativo di Codex per
impostazione predefinita; l'autenticazione diretta tramite chiave API OpenAI resta disponibile per le superfici
OpenAI non agenti, come immagini, embedding, voce e realtime.

- **Modelli agente** - modelli `openai/*` tramite il runtime Codex; accedi con
  l'autenticazione `openai-codex` per usare un abbonamento ChatGPT/Codex, oppure configura un
  profilo con chiave API `openai-codex` quando vuoi intenzionalmente l'autenticazione tramite chiave API.
- **API OpenAI non agenti** - accesso diretto a OpenAI Platform con fatturazione
  a consumo tramite `OPENAI_API_KEY` o onboarding con chiave API OpenAI.
- **Configurazione legacy** - i riferimenti ai modelli `openai-codex/*` vengono riparati da
  `openclaw doctor --fix` in `openai/*` più il runtime Codex.

OpenAI supporta esplicitamente l'uso di OAuth per abbonamenti in strumenti e workflow esterni come OpenClaw.

Provider, modello, runtime e canale sono livelli separati. Se queste etichette
si stanno mescolando, leggi [Runtime degli agenti](/it/concepts/agent-runtimes) prima di
modificare la configurazione.

## Scelta rapida

| Obiettivo                                             | Usa                                                     | Note                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| Abbonamento ChatGPT/Codex con runtime Codex nativo   | `openai/gpt-5.5`                                        | Configurazione agente OpenAI predefinita. Accedi con autenticazione `openai-codex`. |
| Fatturazione diretta con chiave API per modelli agente | `openai/gpt-5.5` più un profilo con chiave API `openai-codex` | Usa `auth.order.openai-codex` per preferire quel profilo.             |
| Fatturazione diretta con chiave API tramite PI esplicito | `openai/gpt-5.5` più `agentRuntime.id: "pi"`           | Seleziona un normale profilo con chiave API `openai`.                 |
| Alias API ChatGPT Instant più recente                | `openai/chat-latest`                                    | Solo chiave API diretta. Alias mobile per esperimenti, non il default. |
| Autenticazione abbonamento ChatGPT/Codex tramite PI esplicito | `openai/gpt-5.5` più `agentRuntime.id: "pi"`           | Seleziona un profilo di autenticazione `openai-codex` per la route di compatibilità. |
| Generazione o modifica di immagini                   | `openai/gpt-image-2`                                    | Funziona con `OPENAI_API_KEY` o con OpenAI Codex OAuth.               |
| Immagini con sfondo trasparente                      | `openai/gpt-image-1.5`                                  | Usa `outputFormat=png` o `webp` e `openai.background=transparent`.    |

## Mappa dei nomi

I nomi sono simili ma non intercambiabili:

| Nome che vedi                       | Livello             | Significato                                                                                       |
| ---------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Prefisso provider   | Route canonica per i modelli OpenAI; i turni degli agenti usano il runtime Codex.                 |
| `openai-codex`                     | Prefisso auth/profilo | Provider del profilo di autenticazione OpenAI Codex OAuth/abbonamento.                          |
| Plugin `codex`                     | Plugin              | Plugin OpenClaw incluso che fornisce il runtime app-server Codex nativo e i controlli chat `/codex`. |
| `agentRuntime.id: codex`           | Runtime agente      | Forza l'harness app-server Codex nativo per i turni incorporati.                                  |
| `/codex ...`                       | Set di comandi chat | Associa/controlla thread app-server Codex da una conversazione.                                   |
| `runtime: "acp", agentId: "codex"` | Route sessione ACP  | Percorso di fallback esplicito che esegue Codex tramite ACP/acpx.                                 |

Questo significa che una configurazione può contenere intenzionalmente sia riferimenti ai modelli `openai/*` sia
profili di autenticazione `openai-codex`. `openclaw doctor --fix` riscrive i riferimenti legacy ai modelli
`openai-codex/*` nella route canonica per i modelli OpenAI.

<Note>
GPT-5.5 è disponibile sia tramite accesso diretto con chiave API OpenAI Platform sia
tramite route di abbonamento/OAuth. Per abbonamento ChatGPT/Codex più esecuzione Codex
nativa, usa `openai/gpt-5.5`; la configurazione runtime non impostata ora seleziona l'harness Codex
per i turni degli agenti OpenAI. Usa profili con chiave API OpenAI solo quando vuoi
l'autenticazione diretta tramite chiave API per un modello agente OpenAI.
</Note>

<Note>
I turni dei modelli agente OpenAI richiedono il Plugin app-server Codex incluso. La configurazione
runtime PI esplicita resta disponibile come route di compatibilità opt-in. Quando PI viene
selezionato esplicitamente con un profilo di autenticazione `openai-codex`, OpenClaw mantiene il
riferimento pubblico del modello come `openai/*` e instrada PI internamente tramite il trasporto
legacy con autenticazione Codex. Esegui `openclaw doctor --fix` per riparare riferimenti ai modelli
`openai-codex/*` obsoleti o vecchi pin di sessione PI che non provengono da
configurazione runtime esplicita.
</Note>

## Copertura delle funzionalità OpenClaw

| Funzionalità OpenAI       | Superficie OpenClaw                                                | Stato                                                  |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | provider di modelli `openai/<model>`                              | Sì                                                     |
| Modelli in abbonamento Codex | `openai/<model>` con `openai-codex` OAuth                       | Sì                                                     |
| Riferimenti legacy ai modelli Codex | `openai-codex/<model>`                                    | Riparati da doctor in `openai/<model>`                 |
| Harness app-server Codex  | `openai/<model>` con runtime omesso o `agentRuntime.id: codex`     | Sì                                                     |
| Ricerca web lato server   | Strumento OpenAI Responses nativo                                  | Sì, quando la ricerca web è abilitata e nessun provider è bloccato |
| Immagini                  | `image_generate`                                                  | Sì                                                     |
| Video                     | `video_generate`                                                  | Sì                                                     |
| Sintesi vocale            | `messages.tts.provider: "openai"` / `tts`                         | Sì                                                     |
| Speech-to-text batch      | `tools.media.audio` / comprensione dei media                       | Sì                                                     |
| Speech-to-text in streaming | Voice Call `streaming.provider: "openai"`                       | Sì                                                     |
| Voce realtime             | Voice Call `realtime.provider: "openai"` / Control UI Talk        | Sì                                                     |
| Embedding                 | provider di embedding della memoria                                | Sì                                                     |

## Embedding della memoria

OpenClaw può usare OpenAI, o un endpoint di embedding compatibile con OpenAI, per
l'indicizzazione `memory_search` e gli embedding delle query:

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

Per endpoint compatibili con OpenAI che richiedono etichette di embedding asimmetriche, imposta
`queryInputType` e `documentInputType` sotto `memorySearch`. OpenClaw inoltra
questi valori come campi di richiesta `input_type` specifici del provider: gli embedding delle query usano
`queryInputType`; i blocchi di memoria indicizzati e l'indicizzazione batch usano
`documentInputType`. Consulta il [riferimento della configurazione della memoria](/it/reference/memory-config#provider-specific-config) per l'esempio completo.

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

    ### Riepilogo delle route

    | Riferimento modello    | Configurazione runtime      | Route                       | Autenticazione  |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | omessa / `agentRuntime.id: "codex"` | harness app-server Codex | profilo `openai-codex` |
    | `openai/gpt-5.4-mini` | omessa / `agentRuntime.id: "codex"` | harness app-server Codex | profilo `openai-codex` |
    | `openai/gpt-5.5`      | `agentRuntime.id: "pi"`              | runtime incorporato PI   | profilo `openai` o profilo `openai-codex` selezionato |

    <Note>
    I modelli agente `openai/*` usano l'harness app-server Codex. Per usare l'autenticazione tramite chiave API
    per un modello agente, crea un profilo con chiave API `openai-codex` e ordinalo
    con `auth.order.openai-codex`; `OPENAI_API_KEY` resta il fallback diretto
    per le superfici API OpenAI non agenti.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Per provare l'attuale modello Instant di ChatGPT dall'API OpenAI, imposta il modello
    su `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` è un alias mobile. OpenAI lo documenta come il modello Instant più recente
    usato in ChatGPT e consiglia `gpt-5.5` per l'uso in produzione dell'API, quindi
    mantieni `openai/gpt-5.5` come default stabile salvo tu voglia esplicitamente quel
    comportamento dell'alias. L'alias attualmente accetta solo verbosità del testo `medium`, quindi
    OpenClaw normalizza per questo modello gli override incompatibili della verbosità del testo OpenAI.

    <Warning>
    OpenClaw **non** espone `openai/gpt-5.3-codex-spark`. Le richieste live all'API OpenAI rifiutano quel modello, e nemmeno il catalogo Codex corrente lo espone.
    </Warning>

  </Tab>

  <Tab title="Abbonamento Codex">
    **Ideale per:** usare il tuo abbonamento ChatGPT/Codex con esecuzione app-server Codex nativa invece di una chiave API separata. Codex cloud richiede l'accesso a ChatGPT.

    <Steps>
      <Step title="Esegui Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oppure esegui OAuth direttamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Per configurazioni headless o ostili ai callback, aggiungi `--device-code` per accedere con un flusso device-code ChatGPT invece del callback del browser localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Usa la route canonica per i modelli OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Non è richiesta alcuna configurazione runtime per il percorso predefinito. I turni degli agenti OpenAI
        selezionano automaticamente il runtime nativo app-server Codex, e OpenClaw
        installa o ripara il Plugin Codex incluso quando viene scelto questo percorso.
      </Step>
      <Step title="Verifica che l'autenticazione Codex sia disponibile">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Dopo l'avvio del Gateway, invia `/codex status` o `/codex models`
        in chat per verificare il runtime nativo app-server.
      </Step>
    </Steps>

    ### Riepilogo dei percorsi

    | Riferimento modello | Configurazione runtime | Percorso | Autenticazione |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | omessa / `agentRuntime.id: "codex"` | Harness nativo app-server Codex | Accesso Codex o profilo `openai-codex` selezionato |
    | `openai/gpt-5.5` | `agentRuntime.id: "pi"` | Runtime incorporato PI con trasporto interno di autenticazione Codex | Profilo `openai-codex` selezionato |
    | `openai-codex/gpt-5.5` | riparato da doctor | Percorso legacy riscritto in `openai/gpt-5.5` | Profilo `openai-codex` esistente |

    <Warning>
    Non configurare riferimenti modello meno recenti `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` o
    `openai-codex/gpt-5.3*`. Gli account OAuth ChatGPT/Codex ora rifiutano
    questi modelli. Usa `openai/gpt-5.5`; i turni degli agenti OpenAI ora selezionano il runtime Codex
    per impostazione predefinita.
    </Warning>

    <Note>
    Continua a usare l'id provider `openai-codex` per i comandi di autenticazione/profilo. Il prefisso
    modello `openai-codex/*` è una configurazione legacy riparata da doctor. Per la
    configurazione comune con abbonamento e runtime nativo, accedi con `openai-codex`
    ma mantieni il riferimento modello come `openai/gpt-5.5`.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex" },
        },
      },
    }
    ```

    <Note>
    L'onboarding non importa più materiale OAuth da `~/.codex`. Accedi con OAuth nel browser (predefinito) o con il flusso con codice dispositivo sopra: OpenClaw gestisce le credenziali risultanti nel proprio archivio di autenticazione degli agenti.
    </Note>

    ### Controllare e recuperare l'instradamento OAuth Codex

    Usa questi comandi per vedere quale modello, runtime e percorso di autenticazione sta usando il tuo agente
    predefinito:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get agents.defaults.agentRuntime --json
    ```

    Per un agente specifico, aggiungi `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Se una configurazione meno recente contiene ancora `openai-codex/gpt-*` o un pin di sessione OpenAI PI
    obsoleto senza configurazione runtime esplicita, riparala:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Se `models auth list --provider openai-codex` non mostra alcun profilo utilizzabile, accedi
    di nuovo:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` resta l'id provider per autenticazione/profilo. `openai/*` è il
    percorso modello per i turni degli agenti OpenAI tramite Codex.

    ### Indicatore di stato

    La chat `/status` mostra quale runtime modello è attivo per la sessione corrente.
    L'harness app-server Codex incluso appare come `Runtime: OpenAI Codex` per
    i turni dei modelli agente OpenAI. I pin di sessione PI obsoleti vengono riparati in Codex salvo che
    la configurazione imposti esplicitamente PI.

    ### Avviso di doctor

    Se percorsi `openai-codex/*` o pin OpenAI PI obsoleti restano nella configurazione o
    nello stato della sessione, `openclaw doctor --fix` li riscrive in `openai/*` con il
    runtime Codex salvo che PI sia configurato esplicitamente.

    ### Limite della finestra di contesto

    OpenClaw tratta i metadati del modello e il limite di contesto del runtime come valori separati.

    Per `openai/gpt-5.5` tramite il catalogo OAuth Codex:

    - `contextWindow` nativo: `1000000`
    - Limite predefinito `contextTokens` del runtime: `272000`

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

    OpenClaw usa i metadati del catalogo upstream Codex per `gpt-5.5` quando sono
    presenti. Se il rilevamento live di Codex omette la riga `gpt-5.5` mentre
    l'account è autenticato, OpenClaw sintetizza quella riga del modello OAuth così che
    le esecuzioni Cron, sub-agent e con modello predefinito configurato non falliscano con
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticazione app-server Codex nativa

L'harness app-server Codex nativo usa riferimenti modello `openai/*` più una
configurazione runtime omessa o `agentRuntime.id: "codex"`, ma la sua autenticazione è comunque
basata sull'account. OpenClaw
seleziona l'autenticazione in questo ordine:

1. Un profilo di autenticazione OpenClaw `openai-codex` esplicito associato all'agente.
2. L'account esistente dell'app-server, come un accesso ChatGPT locale della CLI Codex.
3. Solo per avvii app-server stdio locali, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando l'app-server non segnala alcun account e richiede ancora
   l'autenticazione OpenAI.

Questo significa che un accesso locale con abbonamento ChatGPT/Codex non viene sostituito solo
perché il processo Gateway ha anche `OPENAI_API_KEY` per modelli OpenAI diretti
o embeddings. Il fallback con chiave API env è solo il percorso locale stdio senza account; non
viene inviato alle connessioni app-server WebSocket. Quando viene selezionato un profilo Codex
in stile abbonamento, OpenClaw mantiene anche `CODEX_API_KEY` e `OPENAI_API_KEY`
fuori dal processo figlio app-server stdio generato e invia le credenziali selezionate
tramite l'RPC di login dell'app-server.

## Generazione di immagini

Il Plugin `openai` incluso registra la generazione di immagini tramite lo strumento `image_generate`.
Supporta sia la generazione di immagini con chiave API OpenAI sia la generazione di immagini OAuth
Codex tramite lo stesso riferimento modello `openai/gpt-image-2`.

| Funzionalità                | Chiave API OpenAI                     | OAuth Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Riferimento modello                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Autenticazione                      | `OPENAI_API_KEY`                   | Accesso OAuth OpenAI Codex           |
| Trasporto                 | OpenAI Images API                  | Backend Codex Responses              |
| Numero massimo di immagini per richiesta    | 4                                  | 4                                    |
| Modalità modifica                 | Abilitata (fino a 5 immagini di riferimento) | Abilitata (fino a 5 immagini di riferimento)   |
| Override delle dimensioni            | Supportate, incluse dimensioni 2K/4K   | Supportate, incluse dimensioni 2K/4K     |
| Proporzioni / risoluzione | Non inoltrate a OpenAI Images API | Mappate a una dimensione supportata quando sicuro |

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

`gpt-image-2` è il valore predefinito sia per la generazione OpenAI da testo a immagine sia per la modifica di immagini. `gpt-image-1.5`, `gpt-image-1` e `gpt-image-1-mini` restano utilizzabili come override espliciti del modello. Usa `openai/gpt-image-1.5` per output PNG/WebP con sfondo trasparente; l'attuale API `gpt-image-2` rifiuta
`background: "transparent"`.

Per una richiesta con sfondo trasparente, gli agenti devono chiamare `image_generate` con
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` o `"webp"` e
`background: "transparent"`; la vecchia opzione provider `openai.background` è
ancora accettata. OpenClaw protegge anche le route pubbliche OpenAI e
OpenAI Codex OAuth riscrivendo le richieste trasparenti predefinite `openai/gpt-image-2`
in `gpt-image-1.5`; Azure e gli endpoint personalizzati compatibili con OpenAI mantengono
i nomi distribuzione/modello configurati.

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
`--openai-background` resta disponibile come alias specifico di OpenAI.

Per installazioni OAuth Codex, mantieni lo stesso riferimento `openai/gpt-image-2`. Quando è configurato un profilo OAuth
`openai-codex`, OpenClaw risolve quel token di accesso OAuth memorizzato
e invia le richieste di immagini tramite il backend Codex Responses. Non
prova prima `OPENAI_API_KEY` né passa silenziosamente a una chiave API per quella
richiesta. Configura esplicitamente `models.providers.openai` con una chiave API,
URL base personalizzato o endpoint Azure quando vuoi invece il percorso diretto OpenAI Images API.
Se quell'endpoint immagine personalizzato è su una LAN/indirizzo privato attendibile, imposta anche
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw mantiene
bloccati gli endpoint immagine privati/interni compatibili con OpenAI salvo che sia presente questo opt-in.

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

| Funzionalità       | Valore                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Modello predefinito    | `openai/sora-2`                                                                   |
| Modalità            | Da testo a video, da immagine a video, modifica di un singolo video                                  |
| Input di riferimento | 1 immagine o 1 video                                                                |
| Override delle dimensioni   | Supportati                                                                         |
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

OpenClaw aggiunge un contributo condiviso al prompt GPT-5 per le esecuzioni della famiglia GPT-5 tra provider. Si applica in base all'id modello, quindi `openai/gpt-5.5`, riferimenti legacy precedenti alla riparazione come `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` e altri riferimenti GPT-5 compatibili ricevono lo stesso overlay. I modelli GPT-4.x meno recenti no.

L'harness Codex nativo incluso usa lo stesso comportamento GPT-5 e lo stesso overlay Heartbeat tramite le istruzioni per sviluppatori app-server Codex, quindi le sessioni `openai/gpt-5.x` forzate tramite `agentRuntime.id: "codex"` mantengono la stessa guida su continuità operativa e Heartbeat proattivo anche se Codex possiede il resto del prompt dell'harness.

Il contributo GPT-5 aggiunge un contratto di comportamento con tag per persistenza della persona, sicurezza dell’esecuzione, disciplina degli strumenti, forma dell’output, controlli di completamento e verifica. Il comportamento di risposta specifico del canale e dei messaggi silenziosi resta nel prompt di sistema OpenClaw condiviso e nella policy di consegna in uscita. La guida GPT-5 è sempre abilitata per i modelli corrispondenti. Il livello di stile di interazione amichevole è separato e configurabile.

| Valore                 | Effetto                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (predefinito) | Abilita il livello di stile di interazione amichevole |
| `"on"`                 | Alias per `"friendly"`                      |
| `"off"`                | Disabilita solo il livello di stile amichevole |

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
I valori non distinguono tra maiuscole e minuscole a runtime, quindi `"Off"` e `"off"` disabilitano entrambi il livello di stile amichevole.
</Tip>

<Note>
Il valore legacy `plugins.entries.openai.config.personality` viene ancora letto come fallback di compatibilità quando l’impostazione condivisa `agents.defaults.promptOverlays.gpt5.personality` non è impostata.
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
    | Corpo aggiuntivo | `messages.tts.providers.openai.extraBody` / `extra_body` | (non impostato) |

    Modelli disponibili: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voci disponibili: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` viene unito al JSON della richiesta `/audio/speech` dopo i campi generati da OpenClaw, quindi usalo per endpoint compatibili con OpenAI che richiedono chiavi aggiuntive come `lang`. Le chiavi prototipo vengono ignorate.

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
    Imposta `OPENAI_TTS_BASE_URL` per sovrascrivere l’URL di base TTS senza influire sull’endpoint API di chat.
    </Note>

  </Accordion>

  <Accordion title="Da parlato a testo">
    Il Plugin `openai` incluso registra la trascrizione da parlato a testo in batch tramite
    la superficie di trascrizione per la comprensione dei media di OpenClaw.

    - Modello predefinito: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Percorso di input: caricamento di file audio multipart
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

    Lingua e suggerimenti del prompt vengono inoltrati a OpenAI quando forniti dalla
    configurazione dei media audio condivisa o dalla richiesta di trascrizione per singola chiamata.

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
    Usa una connessione WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Questo provider di streaming è destinato al percorso di trascrizione in tempo reale di Voice Call; la voce Discord attualmente registra brevi segmenti e usa invece il percorso di trascrizione batch `tools.media.audio`.
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
    Supporta Azure OpenAI tramite le chiavi di configurazione `azureEndpoint` e `azureDeployment` per bridge in tempo reale backend. Supporta la chiamata bidirezionale degli strumenti. Usa il formato audio G.711 u-law.
    </Note>

    <Note>
    Control UI Talk usa sessioni realtime nel browser OpenAI con un segreto client
    effimero emesso dal Gateway e uno scambio SDP WebRTC diretto dal browser verso la
    OpenAI Realtime API. La verifica live dei manutentori è disponibile con
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    il tratto OpenAI emette un segreto client in Node, genera un’offerta SDP browser
    con media da microfono fittizi, la invia a OpenAI e applica la risposta SDP
    senza registrare segreti.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Il provider `openai` incluso può puntare a una risorsa Azure OpenAI per la generazione
di immagini sovrascrivendo l’URL di base. Nel percorso di generazione immagini, OpenClaw
rileva i nomi host Azure su `models.providers.openai.baseUrl` e passa automaticamente
alla forma di richiesta di Azure.

<Note>
La voce in tempo reale usa un percorso di configurazione separato
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e non è influenzata da `models.providers.openai.baseUrl`. Vedi la fisarmonica **Voce in tempo reale**
in [Voce e parlato](#voice-and-speech) per le relative impostazioni Azure.
</Note>

Usa Azure OpenAI quando:

- Hai già una sottoscrizione, quota o contratto enterprise Azure OpenAI
- Ti servono residenza regionale dei dati o controlli di conformità forniti da Azure
- Vuoi mantenere il traffico all’interno di una tenancy Azure esistente

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

OpenClaw riconosce questi suffissi host Azure per la rotta di generazione immagini
Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Per le richieste di generazione immagini su un host Azure riconosciuto, OpenClaw:

- Invia l’intestazione `api-key` invece di `Authorization: Bearer`
- Usa percorsi con ambito deployment (`/openai/deployments/{deployment}/...`)
- Aggiunge `?api-version=...` a ogni richiesta
- Usa un timeout di richiesta predefinito di 600 s per le chiamate di generazione immagini Azure.
  I valori `timeoutMs` per singola chiamata sovrascrivono comunque questo valore predefinito.

Altri URL di base (OpenAI pubblico, proxy compatibili con OpenAI) mantengono la forma
standard della richiesta immagini OpenAI.

<Note>
Il routing Azure per il percorso di generazione immagini del provider `openai` richiede
OpenClaw 2026.4.22 o successivo. Le versioni precedenti trattano qualsiasi
`openai.baseUrl` personalizzato come l’endpoint OpenAI pubblico e falliranno contro i deployment
di immagini Azure.
</Note>

### Versione API

Imposta `AZURE_OPENAI_API_VERSION` per bloccare una versione Azure preview o GA specifica
per il percorso di generazione immagini Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Il valore predefinito è `2024-12-01-preview` quando la variabile non è impostata.

### I nomi dei modelli sono nomi di deployment

Azure OpenAI associa i modelli ai deployment. Per le richieste di generazione immagini Azure
instradate tramite il provider `openai` incluso, il campo `model` in OpenClaw
deve essere il **nome del deployment Azure** configurato nel portale Azure, non
l’id del modello OpenAI pubblico.

Se crei un deployment chiamato `gpt-image-2-prod` che serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La stessa regola del nome del deployment si applica alle chiamate di generazione immagini instradate tramite
il provider `openai` incluso.

### Disponibilità regionale

La generazione di immagini Azure è attualmente disponibile solo in un sottoinsieme di regioni
(per esempio `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Controlla l’elenco attuale delle regioni Microsoft prima di creare un
deployment e conferma che il modello specifico sia offerto nella tua regione.

### Differenze dei parametri

Azure OpenAI e OpenAI pubblico non accettano sempre gli stessi parametri immagine.
Azure può rifiutare opzioni consentite da OpenAI pubblico (per esempio alcuni
valori `background` su `gpt-image-2`) o esporle solo su versioni specifiche del modello.
Queste differenze derivano da Azure e dal modello sottostante, non da OpenClaw.
Se una richiesta Azure fallisce con un errore di validazione, controlla il set di
parametri supportato dal tuo deployment specifico e dalla tua versione API nel
portale Azure.

<Note>
Azure OpenAI usa trasporto nativo e comportamento di compatibilità ma non riceve
le intestazioni di attribuzione nascoste di OpenClaw — vedi la fisarmonica **Rotte native e compatibili con OpenAI**
in [Configurazione avanzata](#advanced-configuration).

Per traffico chat o Responses su Azure (oltre alla generazione immagini), usa il
flusso di onboarding o una configurazione provider Azure dedicata — `openai.baseUrl` da solo
non adotta la forma API/auth di Azure. Esiste un provider separato
`azure-openai-responses/*`; vedi la fisarmonica Compaction lato server qui sotto.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Trasporto (WebSocket vs SSE)">
    OpenClaw usa prima WebSocket con fallback SSE (`"auto"`) per `openai/*`.

    In modalità `"auto"`, OpenClaw:
    - Riprova una volta dopo un errore WebSocket iniziale prima di ripiegare su SSE
    - Dopo un errore, contrassegna WebSocket come degradato per circa 60 secondi e usa SSE durante il periodo di raffreddamento
    - Allega intestazioni stabili di identità sessione e turno per tentativi e riconnessioni
    - Normalizza i contatori d’uso (`input_tokens` / `prompt_tokens`) tra varianti di trasporto

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
    OpenClaw abilita il riscaldamento WebSocket per impostazione predefinita per `openai/*` per ridurre la latenza del primo turno.

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
    OpenClaw espone un interruttore condiviso per la modalità veloce per `openai/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Configurazione:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando è abilitata, OpenClaw mappa la modalità veloce sull'elaborazione prioritaria di OpenAI (`service_tier = "priority"`). I valori `service_tier` esistenti vengono preservati e la modalità veloce non riscrive `reasoning` né `text.verbosity`.

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
    Le sostituzioni della sessione hanno la precedenza sulla configurazione. La cancellazione della sostituzione della sessione nell'interfaccia Sessions riporta la sessione al valore predefinito configurato.
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
    Per i modelli OpenAI Responses diretti (`openai/*` su `api.openai.com`), il wrapper di streaming Pi-harness del Plugin OpenAI abilita automaticamente la Compaction lato server:

    - Forza `store: true` (a meno che la compatibilità del modello imposti `supportsStore: false`)
    - Inserisce `context_management: [{ type: "compaction", compact_threshold: ... }]`
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
    `responsesServerCompaction` controlla solo l'inserimento di `context_management`. I modelli OpenAI Responses diretti forzano comunque `store: true`, a meno che la compatibilità imposti `supportsStore: false`.
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
    - Non considera più un turno di sola pianificazione come avanzamento riuscito quando è disponibile un'azione dello strumento
    - Ritenta il turno con un indirizzamento ad agire subito
    - Abilita automaticamente `update_plan` per lavori sostanziali
    - Mostra uno stato bloccato esplicito se il modello continua a pianificare senza agire

    <Note>
    Limitato solo alle esecuzioni della famiglia GPT-5 di OpenAI e Codex. Gli altri provider e le famiglie di modelli precedenti mantengono il comportamento predefinito.
    </Note>

  </Accordion>

  <Accordion title="Rotte native e compatibili con OpenAI">
    OpenClaw tratta gli endpoint diretti OpenAI, Codex e Azure OpenAI in modo diverso dai proxy `/v1` generici compatibili con OpenAI:

    **Rotte native** (`openai/*`, Azure OpenAI):
    - Mantengono `reasoning: { effort: "none" }` solo per i modelli che supportano l'effort `none` di OpenAI
    - Omettono il reasoning disabilitato per modelli o proxy che rifiutano `reasoning.effort: "none"`
    - Impostano per impostazione predefinita gli schemi degli strumenti in modalità rigorosa
    - Allegano header di attribuzione nascosti solo sugli host nativi verificati
    - Mantengono il modellamento della richiesta specifico di OpenAI (`service_tier`, `store`, compatibilità del reasoning, suggerimenti per la cache del prompt)

    **Rotte proxy/compatibili:**
    - Usano un comportamento di compatibilità più permissivo
    - Rimuovono `store` di Completions dai payload `openai-completions` non nativi
    - Accettano il pass-through JSON avanzato `params.extra_body`/`params.extraBody` per proxy Completions compatibili con OpenAI
    - Accettano `params.chat_template_kwargs` per proxy Completions compatibili con OpenAI come vLLM
    - Non forzano schemi degli strumenti rigorosi o header solo nativi

    Azure OpenAI usa trasporto nativo e comportamento di compatibilità, ma non riceve gli header di attribuzione nascosti.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagine e selezione del provider.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli di autenticazione e regole di riuso delle credenziali.
  </Card>
</CardGroup>
