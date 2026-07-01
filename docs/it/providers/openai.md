---
read_when:
    - Vuoi usare i modelli OpenAI in OpenClaw
    - Vuoi l'autenticazione tramite abbonamento Codex invece delle chiavi API
    - Hai bisogno di un comportamento di esecuzione degli agenti GPT-5 più rigoroso
summary: Usa OpenAI tramite chiavi API o abbonamento Codex in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-07-01T08:10:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7078798b1d73bd1efca4820eae6d3fb6510e802b2c9193d0c135d8ab28c58fca
    source_path: providers/openai.md
    workflow: 16
---

OpenAI fornisce API per sviluppatori per i modelli GPT, e Codex è disponibile anche come
agente di coding del piano ChatGPT tramite i client Codex di OpenAI. OpenClaw usa un unico
id provider, `openai`, per entrambe le forme di autenticazione.

OpenClaw usa `openai/*` come route canonica dei modelli OpenAI. I turni degli agenti incorporati
sui modelli OpenAI vengono eseguiti tramite il runtime nativo del server app Codex per
impostazione predefinita; l'autenticazione diretta con chiave API OpenAI resta disponibile per le superfici OpenAI
non agentiche come immagini, embedding, voce e realtime.

- **Modelli agente** - modelli `openai/*` tramite il runtime Codex; accedi con
  l'autenticazione Codex per usare l'abbonamento ChatGPT/Codex, oppure configura un backup
  con chiave API OpenAI compatibile con Codex quando vuoi intenzionalmente l'autenticazione con chiave API.
- **API OpenAI non agentiche** - accesso diretto a OpenAI Platform con fatturazione
  a consumo tramite `OPENAI_API_KEY` o onboarding con chiave API OpenAI.
- **Configurazione legacy** - i riferimenti ai modelli Codex legacy vengono riparati da
  `openclaw doctor --fix` in `openai/*` più il runtime Codex.

OpenAI supporta esplicitamente l'uso di OAuth in abbonamento in strumenti e workflow esterni come OpenClaw.

Provider, modello, runtime e canale sono livelli separati. Se queste etichette si
stanno confondendo, leggi [Runtime degli agenti](/it/concepts/agent-runtimes) prima di
modificare la configurazione.

## Scelta rapida

| Obiettivo                                             | Usa                                                      | Note                                                                  |
| ----------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Abbonamento ChatGPT/Codex con runtime Codex nativo    | `openai/gpt-5.5`                                         | Configurazione agente OpenAI predefinita. Accedi con l'autenticazione Codex. |
| Anteprima limitata GPT-5.6                            | `openai/gpt-5.6-sol`, `-terra`, o `-luna`                | Richiede un'organizzazione API approvata da OpenAI o uno workspace Codex. |
| Fatturazione diretta con chiave API per modelli agente | `openai/gpt-5.5` più un profilo con chiave API compatibile con Codex | Usa `auth.order.openai` per posizionare il backup dopo l'autenticazione in abbonamento. |
| Fatturazione diretta con chiave API tramite OpenClaw esplicito | `openai/gpt-5.5` più runtime provider/modello `openclaw` | Seleziona un normale profilo con chiave API `openai`.                 |
| Alias API ChatGPT Instant più recente                 | `openai/chat-latest`                                     | Solo chiave API diretta. Alias mobile per esperimenti, non il predefinito. |
| Autenticazione abbonamento ChatGPT/Codex tramite OpenClaw | `openai/gpt-5.5` più runtime provider/modello `openclaw` | Seleziona un profilo OAuth `openai` per la route di compatibilità.    |
| Generazione o modifica di immagini                    | `openai/gpt-image-2`                                     | Funziona con `OPENAI_API_KEY` oppure con OAuth OpenAI Codex.          |
| Immagini con sfondo trasparente                       | `openai/gpt-image-1.5`                                   | Usa `outputFormat=png` o `webp` e `openai.background=transparent`.    |

## Mappa dei nomi

I nomi sono simili ma non intercambiabili:

| Nome che vedi                           | Livello           | Significato                                                                                       |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | Prefisso provider | Route canonica dei modelli OpenAI; i turni agente usano il runtime Codex.                         |
| prefisso OpenAI Codex legacy            | Prefisso legacy   | Namespace precedente di modello/profilo. `openclaw doctor --fix` lo migra a `openai`.             |
| Plugin `codex`                          | Plugin            | Plugin OpenClaw incluso che fornisce il runtime nativo del server app Codex e i controlli chat `/codex`. |
| provider/modello `agentRuntime.id: codex` | Runtime agente   | Forza l'harness nativo del server app Codex per i turni incorporati corrispondenti.               |
| `/codex ...`                            | Set di comandi chat | Associa/controlla thread del server app Codex da una conversazione.                              |
| `runtime: "acp", agentId: "codex"`      | Route sessione ACP | Percorso di fallback esplicito che esegue Codex tramite ACP/acpx.                                 |

Questo significa che una configurazione può contenere intenzionalmente riferimenti a modelli `openai/*` mentre i profili di autenticazione
puntano a credenziali con chiave API oppure OAuth ChatGPT/Codex. Usa
`auth.order.openai` per la configurazione; `openclaw doctor --fix` riscrive i riferimenti ai modelli
Codex legacy legacy, gli id dei profili di autenticazione Codex legacy e
l'ordine di autenticazione Codex legacy nella route OpenAI canonica.

<Note>
GPT-5.5 è disponibile sia tramite accesso diretto con chiave API OpenAI Platform sia tramite
route in abbonamento/OAuth. Per abbonamento ChatGPT/Codex più esecuzione Codex
nativa, usa `openai/gpt-5.5`; ora la configurazione runtime non impostata seleziona l'harness Codex
per i turni agente OpenAI. Usa profili con chiave API OpenAI solo quando vuoi
l'autenticazione diretta con chiave API per un modello agente OpenAI.
</Note>

## Anteprima limitata GPT-5.6

OpenClaw riconosce i tre id modello GPT-5.6 pubblici:

- `openai/gpt-5.6-sol`
- `openai/gpt-5.6-terra`
- `openai/gpt-5.6-luna`

Tutti e tre espongono il ragionamento `max` nel catalogo attuale del server app Codex. L'
annuncio di lancio di OpenAI descrive Sol come il livello di punta, Terra come il
livello bilanciato e Luna come il livello veloce e a costo inferiore. Vedi
[l'annuncio di lancio di GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/)
e la [guida all'accesso all'anteprima](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

L'accesso è allowlist durante l'anteprima e può essere concesso separatamente per
API e Codex. Un piano ChatGPT a pagamento da solo non concede l'accesso. OpenClaw mantiene
`openai/gpt-5.5` come predefinito; selezionare un riferimento GPT-5.6 senza accesso restituisce
l'errore di accesso upstream invece di ricadere silenziosamente su un fallback.

<Note>
I turni dei modelli agente OpenAI richiedono il Plugin server app Codex incluso. La configurazione runtime
OpenClaw esplicita resta disponibile come route di compatibilità opt-in. Quando OpenClaw viene
selezionato esplicitamente con un profilo OAuth `openai`, OpenClaw mantiene il
riferimento modello pubblico come `openai/*` e instrada internamente tramite il trasporto
di autenticazione Codex. Esegui `openclaw doctor --fix` per riparare riferimenti ai modelli
Codex legacy obsoleti, `codex-cli/*` o vecchi pin di sessione runtime che non provengono da
configurazione runtime esplicita.
</Note>

## Copertura delle funzionalità OpenClaw

| Capacità OpenAI          | Superficie OpenClaw                                                                           | Stato                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Chat / Responses          | provider di modelli `openai/<model>`                                                          | Sì                                                                     |
| Modelli in abbonamento Codex | `openai/<model>` con OAuth OpenAI                                                          | Sì                                                                     |
| Riferimenti ai modelli Codex legacy | riferimenti ai modelli Codex legacy o `codex-cli/<model>`                             | Riparati da doctor in `openai/<model>`                                 |
| Harness server app Codex  | `openai/<model>` con runtime omesso o provider/modello `agentRuntime.id: codex`               | Sì                                                                     |
| Ricerca web lato server   | Strumento OpenAI Responses nativo                                                             | Sì, quando la ricerca web è abilitata e nessun provider è fissato      |
| Immagini                  | `image_generate`                                                                              | Sì                                                                     |
| Video                     | `video_generate`                                                                              | Sì                                                                     |
| Sintesi vocale            | `messages.tts.provider: "openai"` / `tts`                                                     | Sì                                                                     |
| Speech-to-text batch      | `tools.media.audio` / comprensione media                                                      | Sì                                                                     |
| Speech-to-text streaming  | Voice Call `streaming.provider: "openai"`                                                     | Sì                                                                     |
| Voce realtime             | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Sì (richiede crediti OpenAI Platform, non abbonamento Codex/ChatGPT)   |
| Embedding                 | provider di embedding della memoria                                                           | Sì                                                                     |

<Note>
  La voce OpenAI Realtime (usata da `realtime.provider: "openai"` di Voice Call e
  da Control UI Talk con `talk.realtime.provider: "openai"`) passa attraverso la
  **OpenAI Platform Realtime API** pubblica, che viene fatturata sui crediti
  OpenAI Platform anziché sulla quota di abbonamento Codex/ChatGPT. Un account
  con OAuth OpenAI valido che esegue senza problemi modelli chat basati su Codex
  necessita comunque di un profilo di autenticazione con chiave API OpenAI o di una chiave API Platform con fatturazione
  Platform finanziata per la voce Realtime.

Correzione: ricarica i crediti Platform su
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
per l'organizzazione che supporta le tue credenziali realtime. La voce Realtime accetta
il profilo di autenticazione con chiave API `openai` creato da `openclaw onboard --auth-choice openai-api-key`,
una `OPENAI_API_KEY` Platform configurata tramite `talk.realtime.providers.openai.apiKey`
per Control UI Talk, `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
per Voice Call, oppure la variabile d'ambiente `OPENAI_API_KEY`. I profili OAuth OpenAI
possono comunque eseguire modelli chat `openai/*` basati su Codex nella stessa
installazione OpenClaw, ma non configurano la voce Realtime.
</Note>

## Embedding della memoria

OpenClaw può usare OpenAI, oppure un endpoint di embedding compatibile con OpenAI, per
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
`documentInputType`. Vedi il [riferimento di configurazione della memoria](/it/reference/memory-config#provider-specific-config) per l'esempio completo.

## Per iniziare

Scegli il metodo di autenticazione che preferisci e segui i passaggi di configurazione.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Ideale per:** accesso diretto alle API e fatturazione a consumo.

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

    | Rif. modello           | Configurazione runtime     | Route                       | Autenticazione  |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | omessa / provider/modello `agentRuntime.id: "codex"` | harness app-server Codex | profilo OpenAI compatibile con Codex |
    | `openai/gpt-5.4-mini` | omessa / provider/modello `agentRuntime.id: "codex"` | harness app-server Codex | profilo OpenAI compatibile con Codex |
    | `openai/gpt-5.5`      | provider/modello `agentRuntime.id: "openclaw"`              | runtime incorporato OpenClaw      | profilo `openai` selezionato |

    <Note>
    I modelli agente `openai/*` usano l'harness app-server Codex. Per usare
    l'autenticazione con chiave API per un modello agente, crea un profilo con
    chiave API compatibile con Codex e ordinalo con `auth.order.openai`;
    `OPENAI_API_KEY` resta il fallback diretto per le superfici API OpenAI
    non agente. Esegui `openclaw doctor --fix` per migrare le voci legacy
    precedenti dell'ordine di autenticazione Codex.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Per provare l'attuale modello Instant di ChatGPT dall'API OpenAI, imposta il
    modello su `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` è un alias mobile. OpenAI lo documenta come il modello Instant
    più recente usato in ChatGPT e consiglia `gpt-5.5` per l'uso API in produzione,
    quindi mantieni `openai/gpt-5.5` come default stabile, a meno che tu non voglia
    esplicitamente quel comportamento dell'alias. L'alias attualmente accetta solo
    verbosità del testo `medium`, quindi OpenClaw normalizza gli override di
    verbosità del testo OpenAI incompatibili per questo modello.

    <Warning>
    OpenClaw **non** espone `gpt-5.3-codex-spark` sulla route diretta con chiave API OpenAI. È disponibile solo tramite le voci del catalogo di abbonamento Codex quando il tuo account con accesso effettuato lo espone.
    </Warning>

  </Tab>

  <Tab title="Abbonamento Codex">
    **Ideale per:** usare il tuo abbonamento ChatGPT/Codex con esecuzione app-server Codex nativa invece di una chiave API separata. Codex cloud richiede l'accesso a ChatGPT.

    <Steps>
      <Step title="Esegui Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Oppure esegui OAuth direttamente:

        ```bash
        openclaw models auth login --provider openai
        ```

        Per configurazioni headless o ostili ai callback, aggiungi `--device-code` per accedere con un flusso device-code di ChatGPT invece del callback del browser localhost:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Usa la route canonica del modello OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Non è richiesta alcuna configurazione runtime per il percorso predefinito.
        I turni agente OpenAI selezionano automaticamente il runtime app-server
        Codex nativo, e OpenClaw installa o ripara il Plugin Codex in bundle quando
        questa route viene scelta.
      </Step>
      <Step title="Verifica che l'autenticazione Codex sia disponibile">
        ```bash
        openclaw models list --provider openai
        ```

        Dopo l'avvio del gateway, invia `/codex status` o `/codex models`
        in chat per verificare il runtime app-server nativo.
      </Step>
    </Steps>

    ### Riepilogo delle route

    | Rif. modello | Configurazione runtime | Route | Autenticazione |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | omessa / provider/modello `agentRuntime.id: "codex"` | harness app-server Codex nativo | accesso Codex o profilo di autenticazione `openai` ordinato |
    | `openai/gpt-5.5` | provider/modello `agentRuntime.id: "openclaw"` | runtime incorporato OpenClaw con trasporto interno di autenticazione Codex | profilo OAuth `openai` selezionato |
    | rif. legacy Codex GPT-5.5 | riparato da doctor | route legacy riscritta in `openai/gpt-5.5` | profilo OAuth OpenAI migrato |
    | `codex-cli/gpt-5.5` | riparato da doctor | route CLI legacy riscritta in `openai/gpt-5.5` | autenticazione app-server Codex |

    <Warning>
    Preferisci `openai/gpt-5.5` per nuove configurazioni agente basate su
    abbonamento. I riferimenti GPT Codex legacy precedenti sono route legacy
    OpenClaw, non il percorso runtime Codex nativo; esegui `openclaw doctor --fix`
    quando vuoi migrarli ai riferimenti canonici `openai/*`.
    `gpt-5.3-codex-spark` resta limitato agli account il cui catalogo di
    abbonamento Codex pubblicizza quel modello; le chiavi API OpenAI dirette e
    i riferimenti Azure per quel modello restano soppressi.
    </Warning>

    <Note>
    Il prefisso legacy del modello Codex è una configurazione legacy riparata da
    doctor. Per la configurazione comune con abbonamento più runtime nativo,
    accedi con l'autenticazione Codex ma mantieni il riferimento modello come
    `openai/gpt-5.5`. La nuova configurazione deve mettere l'ordine di
    autenticazione agente OpenAI sotto `auth.order.openai`; doctor migra le voci
    legacy precedenti dell'ordine di autenticazione Codex.
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

    Con una chiave API di backup, mantieni il modello su `openai/gpt-5.5` e metti
    l'ordine di autenticazione sotto `openai`. OpenClaw proverà prima
    l'abbonamento, poi la chiave API, restando sull'harness Codex:

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
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    L'onboarding non importa più materiale OAuth da `~/.codex`. Accedi con OAuth tramite browser (predefinito) o con il flusso device-code sopra: OpenClaw gestisce le credenziali risultanti nel proprio archivio di autenticazione degli agenti.
    </Note>

    ### Controllare e recuperare il routing OAuth Codex

    Usa questi comandi per vedere quale modello, runtime e route di autenticazione
    sta usando il tuo agente predefinito:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Per un agente specifico, aggiungi `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Se una configurazione precedente contiene ancora riferimenti GPT Codex legacy o un pin di sessione
    runtime OpenAI obsoleto senza configurazione runtime esplicita, riparala:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Se `models auth list --provider openai` non mostra profili utilizzabili, accedi
    di nuovo:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Usa `--profile-id` quando vuoi più accessi OAuth Codex nello stesso
    agente e in seguito vuoi controllarli tramite l'ordine di autenticazione o `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` è la rotta del modello per i turni agente OpenAI tramite Codex. Esegui
    `openclaw doctor --fix` per migrare gli ID profilo legacy con prefisso OpenAI Codex e
    le voci di ordinamento precedenti prima di fare affidamento sull'ordine dei profili.

    ### Indicatore di stato

    Chat `/status` mostra quale runtime del modello è attivo per la sessione corrente.
    L'harness app-server Codex incluso appare come `Runtime: OpenAI Codex` per
    i turni modello agente OpenAI. I pin di sessione runtime OpenAI obsoleti vengono riparati in Codex a meno che
    la configurazione non imposti esplicitamente OpenClaw.

    ### Avviso di doctor

    Se riferimenti modello Codex legacy o pin runtime OpenAI obsoleti rimangono nella configurazione o
    nello stato della sessione, `openclaw doctor --fix` li riscrive in `openai/*` con il
    runtime Codex, a meno che OpenClaw non sia configurato esplicitamente.

    ### Limite della finestra di contesto

    OpenClaw tratta i metadati del modello e il limite di contesto del runtime come valori separati.

    Per `openai/gpt-5.5` tramite il catalogo OAuth Codex:

    - `contextWindow` nativa: `1000000`
    - Limite predefinito `contextTokens` del runtime: `272000`

    Il limite predefinito più piccolo offre in pratica migliori caratteristiche di latenza e qualità. Sovrascrivilo con `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          openai: {
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
    presenti. Se la discovery Codex live omette la riga `gpt-5.5` mentre
    l'account è autenticato, OpenClaw sintetizza quella riga modello OAuth in modo che
    le esecuzioni Cron, sotto-agente e con modello predefinito configurato non falliscano con
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticazione nativa dell'app-server Codex

L'harness app-server Codex nativo usa riferimenti modello `openai/*` più una configurazione
runtime omessa o `agentRuntime.id: "codex"` di provider/modello, ma la sua autenticazione è
comunque basata sull'account. OpenClaw seleziona l'autenticazione in questo ordine:

1. Profili di autenticazione OpenAI ordinati per l'agente, preferibilmente sotto
   `auth.order.openai`. Esegui `openclaw doctor --fix` per migrare gli ID profilo di autenticazione Codex
   legacy e l'ordine di autenticazione Codex legacy.
2. L'account esistente dell'app-server, ad esempio un accesso ChatGPT della CLI Codex locale.
3. Solo per avvii app-server stdio locali, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando l'app-server non segnala alcun account e richiede ancora
   l'autenticazione OpenAI.

Questo significa che un accesso con abbonamento ChatGPT/Codex locale non viene sostituito solo
perché anche il processo Gateway ha `OPENAI_API_KEY` per modelli OpenAI diretti
o embedding. Il fallback con chiave API di ambiente è solo il percorso stdio locale senza account; non
viene inviato alle connessioni app-server WebSocket. Quando viene selezionato un profilo Codex
in stile abbonamento, OpenClaw mantiene anche `CODEX_API_KEY` e `OPENAI_API_KEY`
fuori dal processo figlio app-server stdio generato e invia le credenziali selezionate
tramite la RPC di accesso dell'app-server. Quando quel profilo di abbonamento è bloccato da un
limite di utilizzo Codex, OpenClaw può ruotare al profilo con chiave API `openai:*`
successivo nell'ordine senza cambiare il modello selezionato o uscire dall'harness
Codex. Una volta trascorso il tempo di reset dell'abbonamento, il profilo di abbonamento è
di nuovo idoneo.

## Generazione di immagini

Il Plugin `openai` incluso registra la generazione di immagini tramite lo strumento `image_generate`.
Supporta sia la generazione di immagini con chiave API OpenAI sia la generazione di immagini
OAuth Codex tramite lo stesso riferimento modello `openai/gpt-image-2`.

| Funzionalità              | Chiave API OpenAI                  | OAuth Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Rif. modello              | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Autenticazione            | `OPENAI_API_KEY`                   | Accesso OAuth OpenAI Codex           |
| Trasporto                 | API OpenAI Images                  | Backend Codex Responses              |
| Immagini max per richiesta | 4                                  | 4                                    |
| Modalità di modifica      | Abilitata (fino a 5 immagini di riferimento) | Abilitata (fino a 5 immagini di riferimento) |
| Override delle dimensioni | Supportati, incluse dimensioni 2K/4K | Supportati, incluse dimensioni 2K/4K |
| Proporzioni / risoluzione | Non inoltrate all'API OpenAI Images | Mappate a una dimensione supportata quando è sicuro |

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
Vedi [Generazione di immagini](/it/tools/image-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

`gpt-image-2` è il valore predefinito sia per la generazione di immagini da testo
OpenAI sia per la modifica delle immagini. `gpt-image-1.5`, `gpt-image-1` e
`gpt-image-1-mini` restano utilizzabili come override espliciti del modello. Usa
`openai/gpt-image-1.5` per l'output PNG/WebP con sfondo trasparente; l'API
corrente `gpt-image-2` rifiuta `background: "transparent"`.

Per una richiesta con sfondo trasparente, gli agenti devono chiamare
`image_generate` con `model: "openai/gpt-image-1.5"`, `outputFormat: "png"` o
`"webp"` e `background: "transparent"`; la vecchia opzione provider
`openai.background` è ancora accettata. OpenClaw protegge anche le route
pubbliche OpenAI e OpenAI Codex OAuth riscrivendo le richieste trasparenti
predefinite `openai/gpt-image-2` in `gpt-image-1.5`; Azure e gli endpoint
personalizzati compatibili con OpenAI mantengono i nomi di distribuzione/modello
configurati.

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
Usa `--quality low|medium|high|auto` quando devi controllare la qualità e il
costo di OpenAI Images. Usa `--openai-moderation low|auto` per passare il
suggerimento di moderazione specifico del provider di OpenAI da `image generate`
o `image edit`.

Per le installazioni ChatGPT/Codex OAuth, mantieni lo stesso riferimento
`openai/gpt-image-2`. Quando è configurato un profilo OAuth `openai`, OpenClaw
risolve quel token di accesso OAuth memorizzato e invia le richieste di immagini
tramite il backend Codex Responses. Non prova prima `OPENAI_API_KEY` né ripiega
silenziosamente su una chiave API per quella richiesta. Configura
`models.providers.openai` esplicitamente con una chiave API, un URL di base
personalizzato o un endpoint Azure quando vuoi invece la route diretta dell'API
OpenAI Images.
Se quell'endpoint di immagini personalizzato si trova su un indirizzo LAN/privato
affidabile, imposta anche
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw mantiene
bloccati gli endpoint di immagini privati/interni compatibili con OpenAI a meno
che questo opt-in non sia presente.

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

| Funzionalità       | Valore                                                                            |
| ------------------ | --------------------------------------------------------------------------------- |
| Modello predefinito | `openai/sora-2`                                                                  |
| Modalità           | Da testo a video, da immagine a video, modifica di un singolo video               |
| Input di riferimento | 1 immagine o 1 video                                                            |
| Override delle dimensioni | Supportati per da testo a video e da immagine a video                    |
| Altri override     | `aspectRatio`, `resolution`, `audio`, `watermark` vengono ignorati con un avviso dello strumento |

Le richieste OpenAI da immagine a video usano `POST /v1/videos` con un
`input_reference` immagine. Le modifiche di un singolo video usano
`POST /v1/videos/edits` con il video caricato nel campo `video`.

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

OpenClaw aggiunge un contributo condiviso al prompt GPT-5 per le esecuzioni della famiglia GPT-5 sulle superfici di prompt assemblate da OpenClaw. Si applica in base all'ID del modello, quindi le route OpenClaw/provider come i riferimenti legacy pre-riparazione (riferimento legacy Codex GPT-5.5), `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` e altri riferimenti GPT-5 compatibili ricevono lo stesso overlay. I modelli GPT-4.x precedenti no.

L'harness Codex nativo incluso non riceve questo overlay GPT-5 di OpenClaw tramite le istruzioni per sviluppatori del server app Codex. Codex nativo mantiene il comportamento di base, modello e documenti di progetto di proprietà di Codex, mentre OpenClaw disabilita la personality integrata di Codex per i thread nativi, così i file di personality dell'area di lavoro dell'agente restano autorevoli. OpenClaw contribuisce solo il contesto di runtime, come consegna del canale, strumenti dinamici OpenClaw, delega ACP, contesto dell'area di lavoro e Skills OpenClaw.

Il contributo GPT-5 aggiunge un contratto di comportamento etichettato per la persistenza della persona, la sicurezza dell'esecuzione, la disciplina degli strumenti, la forma dell'output, i controlli di completamento e la verifica sui prompt corrispondenti assemblati da OpenClaw. Il comportamento specifico del canale per le risposte e i messaggi silenziosi resta nel prompt di sistema condiviso di OpenClaw e nella policy di recapito in uscita. Il livello di stile di interazione amichevole è separato e configurabile.

| Valore                 | Effetto                                      |
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
I valori non distinguono tra maiuscole e minuscole in fase di runtime, quindi `"Off"` e `"off"` disabilitano entrambi il livello di stile amichevole.
</Tip>

<Note>
Il valore legacy `plugins.entries.openai.config.personality` viene ancora letto come fallback di compatibilità quando l'impostazione condivisa `agents.defaults.promptOverlays.gpt5.personality` non è configurata.
</Note>

## Voce e parlato

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    Il Plugin `openai` in bundle registra la sintesi vocale per la superficie `messages.tts`.

    | Impostazione | Percorso di configurazione | Predefinito |
    |---------|------------|---------|
    | Modello | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voce | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | Velocità | `messages.tts.providers.openai.speed` | (non impostato) |
    | Istruzioni | `messages.tts.providers.openai.instructions` | (non impostato, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` per le note vocali, `mp3` per i file |
    | Chiave API | `messages.tts.providers.openai.apiKey` | Ripiega su `OPENAI_API_KEY` |
    | URL di base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Corpo extra | `messages.tts.providers.openai.extraBody` / `extra_body` | (non impostato) |

    Modelli disponibili: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voci disponibili: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` viene unito al JSON della richiesta `/audio/speech` dopo i campi generati da OpenClaw, quindi usalo per endpoint compatibili con OpenAI che richiedono chiavi aggiuntive come `lang`. Le chiavi di prototipo vengono ignorate.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Imposta `OPENAI_TTS_BASE_URL` per sostituire l'URL di base TTS senza influire sull'endpoint dell'API chat. OpenAI TTS e la voce Realtime sono entrambi configurati tramite una chiave API OpenAI Platform; le installazioni solo OAuth possono comunque usare modelli di chat basati su Codex, ma non il talk-back live di OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Il Plugin `openai` in bundle registra la trascrizione speech-to-text batch tramite
    la superficie di trascrizione di comprensione dei media di OpenClaw.

    - Modello predefinito: `gpt-4o-transcribe`
    - Endpoint: REST OpenAI `/v1/audio/transcriptions`
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

    Gli indizi di lingua e prompt vengono inoltrati a OpenAI quando forniti dalla
    configurazione condivisa dei media audio o dalla richiesta di trascrizione per chiamata.

  </Accordion>

  <Accordion title="Realtime transcription">
    Il Plugin `openai` in bundle registra la trascrizione Realtime per il Plugin Voice Call.

    | Impostazione | Percorso di configurazione | Predefinito |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Lingua | `...openai.language` | (non impostato) |
    | Prompt | `...openai.prompt` | (non impostato) |
    | Durata del silenzio | `...openai.silenceDurationMs` | `800` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Autenticazione | `...openai.apiKey`, `OPENAI_API_KEY`, oppure OAuth `openai` | Le chiavi API si connettono direttamente; OAuth emette un segreto client di trascrizione Realtime |

    <Note>
    Usa una connessione WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Quando è configurato solo OAuth `openai`, il Gateway emette un segreto client di trascrizione Realtime effimero prima di aprire il WebSocket. Questo provider di streaming è destinato al percorso di trascrizione Realtime di Voice Call; attualmente la voce Discord registra brevi segmenti e usa invece il percorso di trascrizione batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    Il Plugin `openai` in bundle registra la voce Realtime per il Plugin Voice Call.

    | Impostazione | Percorso config | Predefinito |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Voce | `...openai.voice` | `alloy` |
    | Temperatura (bridge di deployment Azure) | `...openai.temperature` | `0.8` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Durata del silenzio | `...openai.silenceDurationMs` | `500` |
    | Padding del prefisso | `...openai.prefixPaddingMs` | `300` |
    | Impegno di ragionamento | `...openai.reasoningEffort` | (non impostato) |
    | Autenticazione | profilo di autenticazione con chiave API `openai`, `...openai.apiKey` o `OPENAI_API_KEY` | Chiave API di OpenAI Platform richiesta; OpenAI OAuth non configura la voce Realtime |

    Voci Realtime integrate disponibili per `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI consiglia `marin` e `cedar` per la migliore qualità Realtime. Questo
    è un set separato rispetto alle voci Text-to-speech sopra; non dare per scontato che una voce TTS
    come `fable`, `nova` o `onyx` sia valida per le sessioni Realtime.

    <Note>
    I bridge realtime backend di OpenAI usano la forma di sessione WebSocket Realtime GA, che non accetta `session.temperature`. I deployment Azure OpenAI restano disponibili tramite `azureEndpoint` e `azureDeployment` e mantengono la forma di sessione compatibile con il deployment. Supporta chiamate di strumenti bidirezionali e audio G.711 u-law.
    </Note>

    <Note>
    La voce Realtime viene selezionata quando viene creata la sessione. OpenAI consente alla maggior parte
    dei campi della sessione di cambiare in seguito, ma la voce non può essere modificata dopo che il
    modello ha emesso audio in quella sessione. OpenClaw attualmente espone gli
    id delle voci Realtime integrate come stringhe.
    </Note>

    <Note>
    Control UI Talk usa sessioni realtime browser OpenAI con un segreto client
    effimero emesso dal Gateway e uno scambio SDP WebRTC diretto del browser verso la
    OpenAI Realtime API. Il Gateway emette quel segreto client con il profilo di autenticazione
    con chiave API `openai` selezionato o con la chiave API di OpenAI Platform configurata. Il relay del Gateway
    e i bridge WebSocket realtime backend di Voice Call usano lo stesso
    percorso di autenticazione solo con chiave API per gli endpoint OpenAI nativi. La verifica live del maintainer
    è disponibile con
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    i segmenti OpenAI verificano sia il bridge WebSocket backend sia lo scambio SDP
    WebRTC del browser senza registrare segreti.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Il provider `openai` incluso può puntare a una risorsa Azure OpenAI per la generazione
di immagini sovrascrivendo l'URL di base. Nel percorso di generazione immagini, OpenClaw
rileva gli hostname Azure su `models.providers.openai.baseUrl` e passa
automaticamente alla forma di richiesta di Azure.

<Note>
La voce Realtime usa un percorso di configurazione separato
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e non è influenzata da `models.providers.openai.baseUrl`. Vedi l'accordion **Voce Realtime**
in [Voce e parlato](#voice-and-speech) per le sue impostazioni Azure.
</Note>

Usa Azure OpenAI quando:

- Hai già una sottoscrizione, una quota o un accordo enterprise Azure OpenAI
- Hai bisogno della residenza regionale dei dati o dei controlli di conformità forniti da Azure
- Vuoi mantenere il traffico all'interno di una tenancy Azure esistente

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

OpenClaw riconosce questi suffissi host Azure per la route di generazione immagini
Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Per le richieste di generazione immagini su un host Azure riconosciuto, OpenClaw:

- Invia l'header `api-key` invece di `Authorization: Bearer`
- Usa percorsi con ambito deployment (`/openai/deployments/{deployment}/...`)
- Aggiunge `?api-version=...` a ogni richiesta
- Usa un timeout di richiesta predefinito di 600s per le chiamate di generazione immagini Azure.
  I valori `timeoutMs` per singola chiamata sovrascrivono comunque questo predefinito.

Gli altri URL di base (OpenAI pubblico, proxy compatibili con OpenAI) mantengono la forma
standard delle richieste immagine OpenAI.

<Note>
Il routing Azure per il percorso di generazione immagini del provider `openai` richiede
OpenClaw 2026.4.22 o versioni successive. Le versioni precedenti trattano qualsiasi
`openai.baseUrl` personalizzato come l'endpoint OpenAI pubblico e falliranno con i deployment
di immagini Azure.
</Note>

### Versione API

Imposta `AZURE_OPENAI_API_VERSION` per fissare una specifica versione Azure preview o GA
per il percorso di generazione immagini Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Il valore predefinito è `2024-12-01-preview` quando la variabile non è impostata.

### I nomi dei modelli sono nomi di deployment

Azure OpenAI collega i modelli ai deployment. Per le richieste di generazione immagini Azure
instradate tramite il provider `openai` incluso, il campo `model` in OpenClaw
deve essere il **nome del deployment Azure** che hai configurato nel portale Azure, non
l'id del modello OpenAI pubblico.

Se crei un deployment chiamato `gpt-image-2-prod` che serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La stessa regola del nome deployment si applica alle chiamate di generazione immagini instradate tramite
il provider `openai` incluso.

### Disponibilità regionale

La generazione di immagini Azure è attualmente disponibile solo in un sottoinsieme di regioni
(per esempio `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Controlla l'elenco attuale delle regioni Microsoft prima di creare un
deployment e conferma che il modello specifico sia offerto nella tua regione.

### Differenze nei parametri

Azure OpenAI e OpenAI pubblico non accettano sempre gli stessi parametri immagine.
Azure può rifiutare opzioni consentite da OpenAI pubblico (per esempio alcuni
valori `background` su `gpt-image-2`) o esporle solo su versioni specifiche
del modello. Queste differenze provengono da Azure e dal modello sottostante, non
da OpenClaw. Se una richiesta Azure fallisce con un errore di validazione, controlla il
set di parametri supportato dal tuo deployment specifico e dalla versione API nel
portale Azure.

<Note>
Azure OpenAI usa trasporto nativo e comportamento compatibile ma non riceve
gli header di attribuzione nascosti di OpenClaw — vedi l'accordion **Route native vs compatibili con OpenAI**
in [Configurazione avanzata](#advanced-configuration).

Per traffico chat o Responses su Azure (oltre alla generazione immagini), usa il
flusso di onboarding o una configurazione provider Azure dedicata — `openai.baseUrl` da solo
non seleziona la forma API/autenticazione Azure. Esiste un provider
`azure-openai-responses/*` separato; vedi
l'accordion Compaction lato server sotto.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Trasporto (WebSocket vs SSE)">
    OpenClaw usa prima WebSocket con fallback SSE (`"auto"`) per `openai/*`.

    In modalità `"auto"`, OpenClaw:
    - Riprova un errore WebSocket iniziale prima di passare a SSE
    - Dopo un errore, marca WebSocket come degradato per circa 60 secondi e usa SSE durante il raffreddamento
    - Allega header stabili di identità sessione e turno per i tentativi e le riconnessioni
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

    Documenti OpenAI correlati:
    - [Realtime API con WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Risposte API in streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Modalità rapida">
    OpenClaw espone un interruttore di modalità rapida condiviso per `openai/*`:

    - **Chat/UI:** `/fast status|auto|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando abilitata, OpenClaw mappa la modalità rapida all'elaborazione prioritaria di OpenAI (`service_tier = "priority"`). I valori `service_tier` esistenti vengono preservati e la modalità rapida non riscrive `reasoning` o `text.verbosity`. `fastMode: "auto"` avvia rapidamente le nuove chiamate al modello fino al limite automatico, poi avvia le successive chiamate di ritentativo, fallback, risultato strumento o continuazione senza modalità rapida. Il limite predefinito è 60 secondi; imposta `params.fastAutoOnSeconds` sul modello attivo per modificarlo.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    Le sovrascritture di sessione prevalgono sulla config. Cancellare la sovrascrittura di sessione nella UI Sessions riporta la sessione al predefinito configurato.
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
    Per i modelli OpenAI Responses diretti (`openai/*` su `api.openai.com`), il wrapper di stream OpenClaw del Plugin OpenAI abilita automaticamente la Compaction lato server:

    - Forza `store: true` (a meno che la compatibilità del modello imposti `supportsStore: false`)
    - Inietta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predefinito: 70% di `contextWindow` (o `80000` quando non disponibile)

    Questo si applica al percorso runtime OpenClaw integrato e agli hook del provider OpenAI usati dalle esecuzioni incorporate. L'harness app-server Codex nativo gestisce il proprio contesto tramite Codex ed è configurato dalla route agente predefinita di OpenAI o dalla policy runtime provider/modello.

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
    `responsesServerCompaction` controlla solo l'iniezione di `context_management`. I modelli OpenAI Responses diretti forzano comunque `store: true` a meno che la compatibilità imposti `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modalità GPT strict-agentic">
    Per le esecuzioni della famiglia GPT-5 su `openai/*`, OpenClaw può usare un contratto di esecuzione incorporato più rigoroso:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Con `strict-agentic`, OpenClaw:
    - Abilita automaticamente `update_plan` per lavori sostanziali
    - Ritenta i turni strutturalmente vuoti o solo di ragionamento con una continuazione con risposta visibile
    - Usa eventi di piano espliciti dell'harness quando l'harness selezionato li fornisce

    OpenClaw non classifica la prosa dell'assistente per decidere se un turno è un piano, un aggiornamento di avanzamento o una risposta finale.

    <Note>
    Limitato solo alle esecuzioni della famiglia GPT-5 di OpenAI e Codex. Altri provider e famiglie di modelli precedenti mantengono il comportamento predefinito.
    </Note>

  </Accordion>

  <Accordion title="Route native e compatibili con OpenAI">
    OpenClaw tratta gli endpoint diretti di OpenAI, Codex e Azure OpenAI in modo diverso dai proxy `/v1` generici compatibili con OpenAI:

    **Route native** (`openai/*`, Azure OpenAI):
    - Mantengono `reasoning: { effort: "none" }` solo per i modelli che supportano l'effort `none` di OpenAI
    - Omettono il ragionamento disabilitato per modelli o proxy che rifiutano `reasoning.effort: "none"`
    - Impostano per impostazione predefinita gli schemi degli strumenti in modalità rigorosa
    - Allegano header di attribuzione nascosti solo sugli host nativi verificati
    - Mantengono la definizione delle richieste specifica di OpenAI (`service_tier`, `store`, compatibilità del ragionamento, suggerimenti per la prompt-cache)

    **Route proxy/compatibili:**
    - Usano un comportamento di compatibilità meno rigido
    - Rimuovono `store` di Completions dai payload `openai-completions` non nativi
    - Accettano JSON avanzato inoltrato tramite `params.extra_body`/`params.extraBody` per proxy Completions compatibili con OpenAI
    - Accettano `params.chat_template_kwargs` per proxy Completions compatibili con OpenAI come vLLM
    - Non impongono schemi degli strumenti rigorosi né header solo nativi

    Azure OpenAI usa trasporto nativo e comportamento di compatibilità, ma non riceve gli header di attribuzione nascosti.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagini e selezione del provider.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli di autenticazione e regole di riutilizzo delle credenziali.
  </Card>
</CardGroup>
