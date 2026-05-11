---
read_when:
    - Vuoi usare i modelli OpenAI in OpenClaw
    - Vuoi usare l'autenticazione con abbonamento Codex invece delle chiavi API
    - Serve un comportamento di esecuzione degli agenti GPT-5 più rigoroso
summary: Usa OpenAI tramite chiavi API o abbonamento Codex in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-11T20:34:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: d63b8eff93ecffd85c2110f42044c26621ff50eb62c35b7cc99a07f0e6be1ffb
    source_path: providers/openai.md
    workflow: 16
---

OpenAI fornisce API per sviluppatori per i modelli GPT, e Codex è disponibile anche come agente di coding del piano
ChatGPT tramite i client Codex di OpenAI. OpenClaw mantiene queste
superfici separate in modo che la configurazione resti prevedibile.

OpenClaw usa `openai/*` come route canonica dei modelli OpenAI. I turni degli agenti
incorporati sui modelli OpenAI vengono eseguiti tramite il runtime nativo app-server di Codex per
impostazione predefinita; l'autenticazione diretta con chiave API OpenAI resta disponibile per le superfici OpenAI
non agent come immagini, embedding, voce e realtime.

- **Modelli agent** - modelli `openai/*` tramite il runtime Codex; accedi con
  l'autenticazione Codex per usare l'abbonamento ChatGPT/Codex, oppure configura un backup
  compatibile con Codex basato su chiave API OpenAI quando vuoi intenzionalmente l'autenticazione con chiave API.
- **API OpenAI non agent** - accesso diretto a OpenAI Platform con fatturazione
  basata sull'uso tramite `OPENAI_API_KEY` o onboarding con chiave API OpenAI.
- **Configurazione legacy** - i riferimenti modello `openai-codex/*` vengono riparati da
  `openclaw doctor --fix` in `openai/*` più il runtime Codex.

OpenAI supporta esplicitamente l'uso OAuth in abbonamento in strumenti e workflow esterni come OpenClaw.

Provider, modello, runtime e canale sono livelli separati. Se queste etichette
si stanno confondendo tra loro, leggi [Runtime degli agenti](/it/concepts/agent-runtimes) prima di
modificare la configurazione.

## Scelta rapida

| Obiettivo                                             | Usa                                                      | Note                                                                  |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Abbonamento ChatGPT/Codex con runtime Codex nativo | `openai/gpt-5.5`                                         | Configurazione OpenAI agent predefinita. Accedi con l'autenticazione Codex. |
| Fatturazione diretta con chiave API per modelli agent | `openai/gpt-5.5` più un profilo con chiave API compatibile con Codex | Usa `auth.order.openai` per posizionare il backup dopo l'autenticazione in abbonamento. |
| Fatturazione diretta con chiave API tramite PI esplicito | `openai/gpt-5.5` più runtime provider/modello `pi`        | Seleziona un normale profilo con chiave API `openai`.                 |
| Alias API ChatGPT Instant più recente                | `openai/chat-latest`                                     | Solo chiave API diretta. Alias mobile per esperimenti, non predefinito. |
| Autenticazione abbonamento ChatGPT/Codex tramite PI esplicito | `openai/gpt-5.5` più runtime provider/modello `pi`        | Seleziona un profilo di autenticazione `openai-codex` per la route di compatibilità. |
| Generazione o modifica di immagini                   | `openai/gpt-image-2`                                     | Funziona con `OPENAI_API_KEY` o OpenAI Codex OAuth.                   |
| Immagini con sfondo trasparente                      | `openai/gpt-image-1.5`                                   | Usa `outputFormat=png` o `webp` e `openai.background=transparent`.    |

## Mappa dei nomi

I nomi sono simili ma non intercambiabili:

| Nome che vedi                           | Livello                    | Significato                                                                                                          |
| --------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `openai`                                | Prefisso provider          | Route canonica dei modelli OpenAI; i turni agent usano il runtime Codex.                                             |
| `openai-codex`                          | Prefisso auth/profilo legacy | Namespace precedente dei profili OAuth/abbonamento OpenAI Codex. I profili esistenti e `auth.order.openai-codex` funzionano ancora. |
| Plugin `codex`                          | Plugin                     | Plugin OpenClaw in bundle che fornisce il runtime nativo app-server Codex e i controlli chat `/codex`.               |
| provider/modello `agentRuntime.id: codex` | Runtime agent              | Forza l'harness nativo app-server Codex per i turni incorporati corrispondenti.                                      |
| `/codex ...`                            | Set di comandi chat        | Collega/controlla i thread app-server Codex da una conversazione.                                                    |
| `runtime: "acp", agentId: "codex"`      | Route sessione ACP         | Percorso di fallback esplicito che esegue Codex tramite ACP/acpx.                                                    |

Questo significa che una configurazione può contenere intenzionalmente riferimenti modello `openai/*` mentre i profili di autenticazione
puntano ancora a credenziali compatibili con Codex. Preferisci `auth.order.openai`
per le nuove configurazioni; i profili `openai-codex:*` esistenti e `auth.order.openai-codex`
restano supportati. `openclaw doctor --fix` riscrive i riferimenti modello legacy `openai-codex/*`
nella route canonica dei modelli OpenAI.

<Note>
GPT-5.5 è disponibile sia tramite accesso diretto con chiave API OpenAI Platform sia tramite
route abbonamento/OAuth. Per abbonamento ChatGPT/Codex più esecuzione Codex
nativa, usa `openai/gpt-5.5`; la configurazione runtime non impostata ora seleziona l'harness Codex
per i turni agent OpenAI. Usa profili con chiave API OpenAI solo quando vuoi
l'autenticazione diretta con chiave API per un modello agent OpenAI.
</Note>

<Note>
I turni dei modelli agent OpenAI richiedono il Plugin app-server Codex in bundle. La configurazione runtime
PI esplicita resta disponibile come route di compatibilità opt-in. Quando PI è
selezionato esplicitamente con un profilo di autenticazione `openai-codex`, OpenClaw mantiene il
riferimento modello pubblico come `openai/*` e instrada PI internamente tramite il trasporto legacy
di autenticazione Codex. Esegui `openclaw doctor --fix` per riparare riferimenti modello
`openai-codex/*` obsoleti o vecchi pin di sessione PI che non derivano da
configurazione runtime esplicita.
</Note>

## Copertura delle funzionalità OpenClaw

| Funzionalità OpenAI      | Superficie OpenClaw                                                               | Stato                                                  |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | provider modello `openai/<model>`                                                | Sì                                                     |
| Modelli in abbonamento Codex | `openai/<model>` con OAuth `openai-codex`                                      | Sì                                                     |
| Riferimenti modello Codex legacy | `openai-codex/<model>`                                                     | Riparati da doctor in `openai/<model>`                 |
| Harness app-server Codex  | `openai/<model>` con runtime omesso o provider/modello `agentRuntime.id: codex`  | Sì                                                     |
| Ricerca web lato server   | Strumento nativo OpenAI Responses                                                | Sì, quando la ricerca web è abilitata e non è fissato alcun provider |
| Immagini                  | `image_generate`                                                                 | Sì                                                     |
| Video                     | `video_generate`                                                                 | Sì                                                     |
| Sintesi vocale            | `messages.tts.provider: "openai"` / `tts`                                        | Sì                                                     |
| Speech-to-text batch      | `tools.media.audio` / comprensione media                                         | Sì                                                     |
| Speech-to-text in streaming | Voice Call `streaming.provider: "openai"`                                      | Sì                                                     |
| Voce realtime             | Voice Call `realtime.provider: "openai"` / Control UI Talk                       | Sì                                                     |
| Embedding                 | provider embedding memoria                                                       | Sì                                                     |

## Embedding memoria

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
questi valori come campi richiesta `input_type` specifici del provider: gli embedding delle query usano
`queryInputType`; i frammenti di memoria indicizzati e l'indicizzazione batch usano
`documentInputType`. Consulta il [riferimento di configurazione della memoria](/it/reference/memory-config#provider-specific-config) per l'esempio completo.

## Per iniziare

Scegli il metodo di autenticazione preferito e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Chiave API (OpenAI Platform)">
    **Ideale per:** accesso API diretto e fatturazione basata sull'uso.

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

    ### Riepilogo delle route

    | Riferimento modello    | Configurazione runtime     | Route                       | Auth             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | omesso / provider/modello `agentRuntime.id: "codex"` | Harness app-server Codex | Profilo OpenAI compatibile con Codex |
    | `openai/gpt-5.4-mini` | omesso / provider/modello `agentRuntime.id: "codex"` | Harness app-server Codex | Profilo OpenAI compatibile con Codex |
    | `openai/gpt-5.5`      | provider/modello `agentRuntime.id: "pi"`              | Runtime incorporato PI   | Profilo `openai` o profilo `openai-codex` selezionato |

    <Note>
    I modelli agent `openai/*` usano l'harness app-server Codex. Per usare l'autenticazione con chiave API
    per un modello agent, crea un profilo con chiave API compatibile con Codex e ordinalo
    con `auth.order.openai`; `OPENAI_API_KEY` resta il fallback diretto per le
    superfici API OpenAI non agent. Le voci `auth.order.openai-codex` precedenti funzionano ancora.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Per provare il modello Instant attuale di ChatGPT dall'API OpenAI, imposta il modello
    su `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` è un alias mobile. OpenAI lo documenta come il modello Instant più recente
    usato in ChatGPT e consiglia `gpt-5.5` per l'uso API in produzione, quindi
    mantieni `openai/gpt-5.5` come default stabile a meno che tu non voglia esplicitamente quel
    comportamento dell'alias. L'alias attualmente accetta solo la verbosità del testo `medium`, quindi
    OpenClaw normalizza gli override di verbosità del testo OpenAI incompatibili per questo
    modello.

    <Warning>
    OpenClaw **non** espone `openai/gpt-5.3-codex-spark`. Le richieste live all'API OpenAI rifiutano quel modello, e nemmeno il catalogo Codex attuale lo espone.
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **Ideale per:** usare il tuo abbonamento ChatGPT/Codex con l'esecuzione nativa dell'app-server Codex invece di una chiave API separata. Il cloud Codex richiede l'accesso a ChatGPT.

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oppure esegui OAuth direttamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Per configurazioni headless o ostili ai callback, aggiungi `--device-code` per accedere con un flusso di codice dispositivo ChatGPT invece del callback del browser localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Use the canonical OpenAI model route">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Non è richiesta alcuna configurazione runtime per il percorso predefinito. I turni dell'agente OpenAI
        selezionano automaticamente il runtime nativo dell'app-server Codex, e OpenClaw
        installa o ripara il Plugin Codex incluso quando viene scelto questo percorso.
      </Step>
      <Step title="Verify Codex auth is available">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Dopo l'avvio del Gateway, invia `/codex status` o `/codex models`
        nella chat per verificare il runtime nativo dell'app-server.
      </Step>
    </Steps>

    ### Riepilogo del percorso

    | Rif. modello | Configurazione runtime | Percorso | Auth |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | omessa / provider/modello `agentRuntime.id: "codex"` | Harness nativo dell'app-server Codex | Accesso Codex o profilo auth `openai` ordinato |
    | `openai/gpt-5.5` | provider/modello `agentRuntime.id: "pi"` | Runtime incorporato PI con trasporto interno Codex-auth | Profilo `openai-codex` selezionato |
    | `openai-codex/gpt-5.5` | riparato da doctor | Percorso legacy riscritto in `openai/gpt-5.5` | Profilo `openai-codex` esistente |

    <Warning>
    Non configurare riferimenti modello meno recenti `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` o
    `openai-codex/gpt-5.3*`. Gli account OAuth ChatGPT/Codex ora rifiutano
    quei modelli. Usa `openai/gpt-5.5`; i turni dell'agente OpenAI ora selezionano il runtime Codex
    per impostazione predefinita.
    </Warning>

    <Note>
    Il prefisso modello `openai-codex/*` è una configurazione legacy riparata da doctor. Per
    la configurazione comune con abbonamento più runtime nativo, accedi con l'auth Codex
    ma mantieni il riferimento modello come `openai/gpt-5.5`. La nuova configurazione dovrebbe mettere l'ordine auth
    dell'agente OpenAI sotto `auth.order.openai`; le voci più vecchie `auth.order.openai-codex`
    restano valide.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    Con un backup tramite chiave API, mantieni il modello su `openai/gpt-5.5` e metti
    l'ordine auth sotto `openai`. OpenClaw proverà prima l'abbonamento, poi
    la chiave API, rimanendo sull'harness Codex:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai-codex:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    L'onboarding non importa più materiale OAuth da `~/.codex`. Accedi con OAuth nel browser (predefinito) o con il flusso di codice dispositivo sopra: OpenClaw gestisce le credenziali risultanti nel proprio archivio auth degli agenti.
    </Note>

    ### Controllare e recuperare il routing OAuth Codex

    Usa questi comandi per vedere quale modello, runtime e percorso auth sta usando
    il tuo agente predefinito:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Per un agente specifico, aggiungi `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Se una configurazione più vecchia contiene ancora `openai-codex/gpt-*` o un pin di sessione OpenAI PI
    obsoleto senza configurazione runtime esplicita, riparala:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Se `models auth list --provider openai-codex` non mostra profili utilizzabili, accedi
    di nuovo:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai/*` è il percorso modello per i turni dell'agente OpenAI tramite Codex. L'id provider
    auth/profilo `openai-codex` resta accettato per profili esistenti
    e liste CLI.

    ### Indicatore di stato

    La chat `/status` mostra quale runtime modello è attivo per la sessione corrente.
    L'harness app-server Codex incluso appare come `Runtime: OpenAI Codex` per
    i turni del modello agente OpenAI. I pin di sessione PI obsoleti vengono riparati a Codex salvo che
    la configurazione fissi esplicitamente PI.

    ### Avviso di doctor

    Se percorsi `openai-codex/*` o pin OpenAI PI obsoleti restano nella configurazione o
    nello stato della sessione, `openclaw doctor --fix` li riscrive in `openai/*` con il
    runtime Codex salvo che PI sia configurato esplicitamente.

    ### Limite della finestra di contesto

    OpenClaw tratta i metadati del modello e il limite di contesto runtime come valori separati.

    Per `openai/gpt-5.5` tramite il catalogo OAuth Codex:

    - `contextWindow` nativo: `1000000`
    - Limite `contextTokens` runtime predefinito: `272000`

    In pratica, il limite predefinito più piccolo offre migliori caratteristiche di latenza e qualità. Sovrascrivilo con `contextTokens`:

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
    Usa `contextWindow` per dichiarare i metadati nativi del modello. Usa `contextTokens` per limitare il budget di contesto runtime.
    </Note>

    ### Recupero del catalogo

    OpenClaw usa i metadati del catalogo Codex upstream per `gpt-5.5` quando sono
    presenti. Se la discovery Codex live omette la riga `gpt-5.5` mentre
    l'account è autenticato, OpenClaw sintetizza quella riga del modello OAuth affinché
    le esecuzioni Cron, dei sub-agent e del modello predefinito configurato non falliscano con
    `Unknown model`.

  </Tab>
</Tabs>

## Auth nativa dell'app-server Codex

L'harness nativo dell'app-server Codex usa riferimenti modello `openai/*` più una configurazione
runtime omessa o provider/modello `agentRuntime.id: "codex"`, ma la sua auth è
comunque basata sull'account. OpenClaw seleziona l'auth in questo ordine:

1. Profili auth OpenAI ordinati per l'agente, preferibilmente sotto
   `auth.order.openai`. I profili `openai-codex:*` esistenti e
   `auth.order.openai-codex` restano validi per installazioni più vecchie.
2. L'account esistente dell'app-server, come un accesso ChatGPT locale della CLI Codex.
3. Solo per avvii dell'app-server stdio locale, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando l'app-server non segnala alcun account e richiede ancora
   l'auth OpenAI.

Ciò significa che un accesso locale con abbonamento ChatGPT/Codex non viene sostituito solo
perché il processo Gateway ha anche `OPENAI_API_KEY` per modelli OpenAI diretti
o embedding. Il fallback con chiave API env è solo il percorso locale stdio senza account; non
viene inviato alle connessioni app-server WebSocket. Quando viene selezionato un profilo Codex
in stile abbonamento, OpenClaw tiene anche `CODEX_API_KEY` e `OPENAI_API_KEY`
fuori dal processo figlio app-server stdio generato e invia le credenziali selezionate
tramite la RPC di login dell'app-server. Quando quel profilo di abbonamento è bloccato da un
limite d'uso Codex, OpenClaw può ruotare al successivo profilo con chiave API `openai:*`
ordinato senza cambiare il modello selezionato o uscire dall'harness Codex.
Una volta trascorso il tempo di reset dell'abbonamento, il profilo dell'abbonamento torna
idoneo.

## Generazione di immagini

Il Plugin `openai` incluso registra la generazione di immagini tramite lo strumento `image_generate`.
Supporta sia la generazione di immagini con chiave API OpenAI sia la generazione di immagini
con OAuth Codex tramite lo stesso riferimento modello `openai/gpt-image-2`.

| Capacità                | Chiave API OpenAI                     | OAuth Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Rif. modello                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                   | Accesso OAuth OpenAI Codex           |
| Trasporto                 | API OpenAI Images                  | Backend Codex Responses              |
| Numero massimo di immagini per richiesta    | 4                                  | 4                                    |
| Modalità di modifica                 | Abilitata (fino a 5 immagini di riferimento) | Abilitata (fino a 5 immagini di riferimento)   |
| Override delle dimensioni            | Supportati, incluse dimensioni 2K/4K   | Supportati, incluse dimensioni 2K/4K     |
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
Consulta [Generazione di immagini](/it/tools/image-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

`gpt-image-2` è il valore predefinito sia per la generazione testo-immagine OpenAI sia per la modifica di immagini.
`gpt-image-1.5`, `gpt-image-1` e `gpt-image-1-mini` restano utilizzabili come
override espliciti del modello. Usa `openai/gpt-image-1.5` per output
PNG/WebP con sfondo trasparente; l'API corrente `gpt-image-2` rifiuta
`background: "transparent"`.

Per una richiesta con sfondo trasparente, gli agenti dovrebbero chiamare `image_generate` con
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` o `"webp"`, e
`background: "transparent"`; l'opzione provider più vecchia `openai.background` è
ancora accettata. OpenClaw protegge anche le route pubbliche OpenAI e
OpenAI Codex OAuth riscrivendo le richieste trasparenti predefinite `openai/gpt-image-2`
in `gpt-image-1.5`; Azure e gli endpoint personalizzati compatibili con OpenAI mantengono
i nomi di deployment/modello configurati.

La stessa impostazione è esposta per esecuzioni CLI headless:

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

Per installazioni OAuth Codex, mantieni lo stesso riferimento `openai/gpt-image-2`. Quando è
configurato un profilo OAuth `openai-codex`, OpenClaw risolve quel token di accesso OAuth
archiviato e invia le richieste di immagini tramite il backend Codex Responses. Non
prova prima `OPENAI_API_KEY` né ripiega silenziosamente su una chiave API per quella
richiesta. Configura esplicitamente `models.providers.openai` con una chiave API,
un URL base personalizzato o un endpoint Azure quando vuoi invece il percorso diretto dell'API OpenAI Images.
Se quell'endpoint immagini personalizzato si trova su una LAN/indirizzo privato attendibile, imposta anche
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw mantiene
bloccati gli endpoint immagini privati/interni compatibili con OpenAI salvo che sia presente questo opt-in.

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

## Generazione di video

Il plugin `openai` incluso registra la generazione video tramite lo strumento `video_generate`.

| Capacità          | Valore                                                                             |
| ----------------- | ---------------------------------------------------------------------------------- |
| Modello predefinito | `openai/sora-2`                                                                  |
| Modalità          | Da testo a video, da immagine a video, modifica di un singolo video                |
| Input di riferimento | 1 immagine o 1 video                                                            |
| Override delle dimensioni | Supportati                                                                 |
| Altri override    | `aspectRatio`, `resolution`, `audio`, `watermark` vengono ignorati con un avviso dello strumento |

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
Vedi [Generazione video](/it/tools/video-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Contributo al prompt GPT-5

OpenClaw aggiunge un contributo condiviso al prompt GPT-5 per le esecuzioni della famiglia GPT-5 tra provider. Si applica in base all'id del modello, quindi `openai/gpt-5.5`, riferimenti legacy pre-riparazione come `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` e altri riferimenti GPT-5 compatibili ricevono lo stesso overlay. I modelli GPT-4.x precedenti no.

L'harness Codex nativo incluso usa lo stesso comportamento GPT-5 e lo stesso overlay Heartbeat tramite le istruzioni per sviluppatori dell'app-server Codex, quindi le sessioni `openai/gpt-5.x` instradate tramite Codex mantengono la stessa guida di follow-through e Heartbeat proattivo, anche se Codex possiede il resto del prompt dell'harness.

Il contributo GPT-5 aggiunge un contratto di comportamento con tag per persistenza della persona, sicurezza dell'esecuzione, disciplina degli strumenti, forma dell'output, controlli di completamento e verifica. Il comportamento di risposta specifico del canale e dei messaggi silenziosi resta nel prompt di sistema condiviso di OpenClaw e nella policy di consegna in uscita. La guida GPT-5 è sempre abilitata per i modelli corrispondenti. Il livello di stile di interazione amichevole è separato e configurabile.

| Valore                 | Effetto                                      |
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
I valori non distinguono tra maiuscole e minuscole a runtime, quindi `"Off"` e `"off"` disabilitano entrambi il livello di stile amichevole.
</Tip>

<Note>
Il valore legacy `plugins.entries.openai.config.personality` viene ancora letto come fallback di compatibilità quando l'impostazione condivisa `agents.defaults.promptOverlays.gpt5.personality` non è impostata.
</Note>

## Voce e parlato

<AccordionGroup>
  <Accordion title="Sintesi vocale (TTS)">
    Il plugin `openai` incluso registra la sintesi vocale per la superficie `messages.tts`.

    | Impostazione | Percorso di configurazione | Predefinito |
    |---------|------------|---------|
    | Modello | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voce | `messages.tts.providers.openai.voice` | `coral` |
    | Velocità | `messages.tts.providers.openai.speed` | (non impostato) |
    | Istruzioni | `messages.tts.providers.openai.instructions` | (non impostato, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` per note vocali, `mp3` per file |
    | Chiave API | `messages.tts.providers.openai.apiKey` | Ripiega su `OPENAI_API_KEY` |
    | URL di base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Corpo extra | `messages.tts.providers.openai.extraBody` / `extra_body` | (non impostato) |

    Modelli disponibili: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voci disponibili: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` viene unito al JSON della richiesta `/audio/speech` dopo i campi generati da OpenClaw, quindi usalo per endpoint compatibili con OpenAI che richiedono chiavi aggiuntive come `lang`. Le chiavi prototype vengono ignorate.

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
    Imposta `OPENAI_TTS_BASE_URL` per sovrascrivere l'URL di base TTS senza influire sull'endpoint API della chat. OpenAI TTS è comunque configurato tramite una chiave API; per il talk-back live solo OAuth, usa il percorso voce Realtime invece del parlato STT -> TTS in modalità agente.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Il plugin `openai` incluso registra lo speech-to-text batch tramite
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

    I suggerimenti di lingua e prompt vengono inoltrati a OpenAI quando forniti dalla
    configurazione media audio condivisa o dalla richiesta di trascrizione per chiamata.

  </Accordion>

  <Accordion title="Trascrizione in tempo reale">
    Il plugin `openai` incluso registra la trascrizione in tempo reale per il Plugin Voice Call.

    | Impostazione | Percorso di configurazione | Predefinito |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Lingua | `...openai.language` | (non impostato) |
    | Prompt | `...openai.prompt` | (non impostato) |
    | Durata del silenzio | `...openai.silenceDurationMs` | `800` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Autenticazione | `...openai.apiKey`, `OPENAI_API_KEY`, o OAuth `openai-codex` | Le chiavi API si connettono direttamente; OAuth emette un client secret per la trascrizione Realtime |

    <Note>
    Usa una connessione WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Quando è configurato solo OAuth `openai-codex`, il Gateway emette un client secret effimero per la trascrizione Realtime prima di aprire il WebSocket. Questo provider di streaming è per il percorso di trascrizione in tempo reale di Voice Call; la voce Discord attualmente registra segmenti brevi e usa invece il percorso di trascrizione batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voce in tempo reale">
    Il plugin `openai` incluso registra la voce in tempo reale per il Plugin Voice Call.

    | Impostazione | Percorso di configurazione | Predefinito |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Voce | `...openai.voice` | `alloy` |
    | Temperatura (bridge di deployment Azure) | `...openai.temperature` | `0.8` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Durata del silenzio | `...openai.silenceDurationMs` | `500` |
    | Padding del prefisso | `...openai.prefixPaddingMs` | `300` |
    | Sforzo di ragionamento | `...openai.reasoningEffort` | (non impostato) |
    | Autenticazione | `...openai.apiKey`, `OPENAI_API_KEY`, o OAuth `openai-codex` | Browser Talk e i bridge backend non Azure possono usare Codex OAuth |

    Voci Realtime integrate disponibili per `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI consiglia `marin` e `cedar` per la migliore qualità Realtime. Questo
    è un set separato dalle voci di sintesi vocale sopra; non presumere che una
    voce TTS come `fable`, `nova` o `onyx` sia valida per le sessioni Realtime.

    <Note>
    I bridge realtime backend OpenAI usano la forma di sessione WebSocket Realtime GA, che non accetta `session.temperature`. I deployment Azure OpenAI restano disponibili tramite `azureEndpoint` e `azureDeployment` e mantengono la forma di sessione compatibile con il deployment. Supporta la chiamata bidirezionale degli strumenti e l'audio G.711 u-law.
    </Note>

    <Note>
    La voce Realtime viene selezionata quando la sessione viene creata. OpenAI consente di modificare
    la maggior parte dei campi della sessione in seguito, ma la voce non può essere cambiata dopo che il
    modello ha emesso audio in quella sessione. OpenClaw attualmente espone gli
    id delle voci Realtime integrate come stringhe.
    </Note>

    <Note>
    Control UI Talk usa sessioni realtime browser OpenAI con un client secret
    effimero emesso dal Gateway e uno scambio WebRTC SDP diretto del browser con la
    OpenAI Realtime API. Quando non è configurata alcuna chiave API OpenAI diretta, il
    Gateway può emettere quel client secret con il profilo OAuth `openai-codex`
    selezionato. Il relay Gateway e i bridge WebSocket realtime backend di Voice Call usano
    lo stesso fallback OAuth per gli endpoint OpenAI nativi. La verifica live del maintainer
    è disponibile con
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    le tratte OpenAI verificano sia il bridge WebSocket backend sia lo scambio
    WebRTC SDP del browser senza registrare segreti.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Il provider `openai` incluso può indirizzare una risorsa Azure OpenAI per la generazione di immagini
sovrascrivendo l'URL di base. Nel percorso di generazione delle immagini, OpenClaw
rileva gli hostname Azure su `models.providers.openai.baseUrl` e passa
automaticamente alla forma di richiesta di Azure.

<Note>
La voce in tempo reale usa un percorso di configurazione separato
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e non è influenzata da `models.providers.openai.baseUrl`. Vedi l'accordion **Voce in tempo reale** sotto [Voce e parlato](#voice-and-speech) per le sue impostazioni Azure.
</Note>

Usa Azure OpenAI quando:

- Hai già una sottoscrizione, una quota o un contratto enterprise Azure OpenAI
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

OpenClaw riconosce questi suffissi host Azure per la route di generazione di immagini Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Per le richieste di generazione di immagini su un host Azure riconosciuto, OpenClaw:

- Invia l'header `api-key` invece di `Authorization: Bearer`
- Usa percorsi con ambito di deployment (`/openai/deployments/{deployment}/...`)
- Aggiunge `?api-version=...` a ogni richiesta
- Usa un timeout di richiesta predefinito di 600s per le chiamate di generazione di immagini Azure.
  I valori `timeoutMs` per singola chiamata sovrascrivono comunque questo valore predefinito.

Altri URL di base (OpenAI pubblico, proxy compatibili con OpenAI) mantengono la forma
standard della richiesta di immagini OpenAI.

<Note>
Il routing Azure per il percorso di generazione di immagini del provider `openai` richiede
OpenClaw 2026.4.22 o versione successiva. Le versioni precedenti trattano qualsiasi
`openai.baseUrl` personalizzato come l'endpoint OpenAI pubblico e falliranno con i
deployment di immagini Azure.
</Note>

### Versione API

Imposta `AZURE_OPENAI_API_VERSION` per fissare una specifica versione preview o GA di Azure
per il percorso di generazione immagini di Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Il valore predefinito è `2024-12-01-preview` quando la variabile non è impostata.

### I nomi dei modelli sono nomi di distribuzioni

Azure OpenAI associa i modelli alle distribuzioni. Per le richieste di generazione immagini di Azure
instradate tramite il provider `openai` incluso, il campo `model` in OpenClaw
deve essere il **nome della distribuzione Azure** configurato nel portale Azure, non
l'id pubblico del modello OpenAI.

Se crei una distribuzione chiamata `gpt-image-2-prod` che serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La stessa regola del nome della distribuzione si applica alle chiamate di generazione immagini instradate tramite
il provider `openai` incluso.

### Disponibilità regionale

La generazione immagini di Azure è attualmente disponibile solo in un sottoinsieme di regioni
(ad esempio `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Controlla l'elenco attuale delle regioni Microsoft prima di creare una
distribuzione e conferma che il modello specifico sia offerto nella tua regione.

### Differenze nei parametri

Azure OpenAI e OpenAI pubblico non accettano sempre gli stessi parametri per le immagini.
Azure può rifiutare opzioni consentite da OpenAI pubblico (ad esempio determinati
valori di `background` su `gpt-image-2`) o esporle solo su versioni specifiche del
modello. Queste differenze provengono da Azure e dal modello sottostante, non da
OpenClaw. Se una richiesta Azure non riesce con un errore di validazione, controlla il
set di parametri supportato dalla tua distribuzione specifica e dalla versione API nel
portale Azure.

<Note>
Azure OpenAI usa il trasporto nativo e il comportamento di compatibilità, ma non riceve
gli header di attribuzione nascosti di OpenClaw: vedi il riquadro **Rotte native e compatibili con OpenAI**
in [Configurazione avanzata](#advanced-configuration).

Per il traffico chat o Responses su Azure (oltre alla generazione immagini), usa il
flusso di onboarding o una configurazione dedicata del provider Azure: `openai.baseUrl` da solo
non applica la forma API/auth di Azure. Esiste un provider separato
`azure-openai-responses/*`; vedi
il riquadro Compaction lato server qui sotto.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Trasporto (WebSocket vs SSE)">
    OpenClaw usa prima WebSocket con fallback SSE (`"auto"`) per `openai/*`.

    In modalità `"auto"`, OpenClaw:
    - Riprova un errore WebSocket iniziale prima di passare a SSE
    - Dopo un errore, contrassegna WebSocket come degradato per circa 60 secondi e usa SSE durante il periodo di raffreddamento
    - Allega header stabili di identità della sessione e del turno per tentativi e riconnessioni
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
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentazione OpenAI correlata:
    - [API Realtime con WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Risposte API in streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Modalità veloce">
    OpenClaw espone un interruttore condiviso per la modalità veloce per `openai/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Configurazione:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando è abilitata, OpenClaw mappa la modalità veloce sull'elaborazione prioritaria di OpenAI (`service_tier = "priority"`). I valori `service_tier` esistenti vengono preservati e la modalità veloce non riscrive `reasoning` o `text.verbosity`.

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
    Le sostituzioni di sessione prevalgono sulla configurazione. La cancellazione della sostituzione di sessione nell'interfaccia Sessions riporta la sessione al valore predefinito configurato.
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

  <Accordion title="Compaction lato server (API Responses)">
    Per i modelli OpenAI Responses diretti (`openai/*` su `api.openai.com`), il wrapper di stream Pi-harness del Plugin OpenAI abilita automaticamente la Compaction lato server:

    - Forza `store: true` (a meno che la compatibilità del modello imposti `supportsStore: false`)
    - Inserisce `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Valore predefinito di `compact_threshold`: 70% di `contextWindow` (o `80000` quando non disponibile)

    Questo si applica al percorso Pi harness integrato e agli hook del provider OpenAI usati dalle esecuzioni incorporate. L'harness app-server nativo di Codex gestisce il proprio contesto tramite Codex ed è configurato dalla rotta agente predefinita di OpenAI o dalla policy di runtime provider/modello.

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
    `responsesServerCompaction` controlla solo l'iniezione di `context_management`. I modelli OpenAI Responses diretti forzano comunque `store: true` a meno che la compatibilità non imposti `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modalità GPT strict-agentic">
    Per esecuzioni della famiglia GPT-5 su `openai/*`, OpenClaw può usare un contratto di esecuzione incorporato più rigoroso:

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
    - Non considera più un turno con solo piano come avanzamento riuscito quando è disponibile un'azione strumento
    - Riprova il turno con un'indicazione ad agire subito
    - Abilita automaticamente `update_plan` per lavori sostanziali
    - Mostra uno stato bloccato esplicito se il modello continua a pianificare senza agire

    <Note>
    Limitato solo alle esecuzioni della famiglia GPT-5 di OpenAI e Codex. Gli altri provider e le famiglie di modelli precedenti mantengono il comportamento predefinito.
    </Note>

  </Accordion>

  <Accordion title="Rotte native e compatibili con OpenAI">
    OpenClaw tratta gli endpoint OpenAI, Codex e Azure OpenAI diretti in modo diverso dai proxy `/v1` generici compatibili con OpenAI:

    **Rotte native** (`openai/*`, Azure OpenAI):
    - Mantengono `reasoning: { effort: "none" }` solo per i modelli che supportano lo sforzo `none` di OpenAI
    - Omettono il reasoning disabilitato per modelli o proxy che rifiutano `reasoning.effort: "none"`
    - Impostano per impostazione predefinita gli schemi degli strumenti in modalità rigorosa
    - Allegano header di attribuzione nascosti solo su host nativi verificati
    - Mantengono la modellazione delle richieste specifica di OpenAI (`service_tier`, `store`, compatibilità del reasoning, suggerimenti per la cache dei prompt)

    **Rotte proxy/compatibili:**
    - Usano un comportamento di compatibilità più permissivo
    - Rimuovono `store` di Completions dai payload `openai-completions` non nativi
    - Accettano JSON pass-through avanzato `params.extra_body`/`params.extraBody` per proxy Completions compatibili con OpenAI
    - Accettano `params.chat_template_kwargs` per proxy Completions compatibili con OpenAI come vLLM
    - Non forzano schemi degli strumenti rigorosi o header solo nativi

    Azure OpenAI usa il trasporto nativo e il comportamento di compatibilità, ma non riceve gli header di attribuzione nascosti.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Generazione immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi degli strumenti per immagini e selezione del provider.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi degli strumenti per video e selezione del provider.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli di autenticazione e regole di riutilizzo delle credenziali.
  </Card>
</CardGroup>
