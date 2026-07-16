---
read_when:
    - Vuoi utilizzare i modelli OpenAI in OpenClaw
    - Si desidera usare l'autenticazione tramite abbonamento Codex anziché le chiavi API
    - È necessario un comportamento di esecuzione degli agenti GPT-5 più rigoroso
summary: Usare OpenAI in OpenClaw tramite chiavi API o un abbonamento Codex
title: OpenAI
x-i18n:
    generated_at: "2026-07-16T14:52:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 18efddc44f2b06ae9592cdbc01c0aadc4621ddf99e818793a4d835c741a2464e
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw utilizza un unico id provider, `openai`, sia per l'autenticazione diretta tramite chiave API sia per
l'autenticazione tramite abbonamento ChatGPT/Codex. `openai/*` è la route canonica del modello.
Per i turni dell'agente incorporato con il criterio di runtime non impostato o impostato su `auto`, i dati
della route di OpenAI determinano se OpenClaw può selezionare implicitamente il runtime app-server Codex incluso.
Il solo prefisso `openai/*` non seleziona un runtime.

- **Modelli dell'agente** - `openai/*` tramite il runtime selezionato dalla configurazione
  esplicita `agentRuntime` o dal criterio implicito della route di OpenAI. Accedere con
  l'autenticazione Codex per utilizzare l'abbonamento ChatGPT/Codex oppure configurare un profilo
  di autenticazione tramite chiave API quando si desidera la fatturazione basata sulla chiave.
- **API OpenAI non destinate agli agenti** - accesso diretto alla piattaforma OpenAI, con fatturazione in base all'uso,
  tramite `OPENAI_API_KEY` o un profilo di autenticazione tramite chiave API `openai`.
- **Configurazione legacy** - i riferimenti `codex/*` e `openai-codex/*` vengono corretti in
  `openai/*` più `agentRuntime.id: "codex"` con ambito limitato al modello da
  `openclaw doctor --fix`.

OpenAI supporta esplicitamente l'uso di OAuth degli abbonamenti in strumenti esterni e
flussi di lavoro come OpenClaw.

## Monitoraggio dell'utilizzo e dei costi

OpenClaw mantiene distinti la quota dell'abbonamento e la fatturazione delle API della piattaforma:

- OAuth ChatGPT/Codex mostra il piano di abbonamento, le finestre delle quote e il saldo dei crediti.
- `OPENAI_ADMIN_KEY` mostra 30 giorni di costi dell'organizzazione e utilizzo dei completamenti segnalati dal provider nella sezione **Utilizzo** dell'interfaccia di controllo, inclusi spesa giornaliera, totali di richieste/token, modelli principali e categorie di costo.
- `OPENAI_PROJECT_ID` limita facoltativamente la cronologia dell'API di amministrazione a un singolo progetto.
- OpenClaw non invia mai `OPENAI_API_KEY` o un profilo di inferenza `openai` alle API dell'organizzazione; tali credenziali possono appartenere a endpoint personalizzati, Azure o locali dell'agente.

Una chiave di amministrazione esplicita ha la precedenza su OAuth. La cronologia segnalata dal provider non viene unita al costo stimato da OpenClaw in base alle sessioni; può includere attività API di altri client e rettifiche di fatturazione lato provider.

La documentazione del [dashboard di utilizzo delle API](https://help.openai.com/en/articles/10478918) di OpenAI descrive i requisiti relativi al proprietario dell'organizzazione e all'autorizzazione esplicita per il dashboard di utilizzo necessari per accedere ai dati di utilizzo.

Provider, modello, runtime e canale sono livelli separati. Se queste etichette
vengono confuse, consultare [Runtime degli agenti](/it/concepts/agent-runtimes) prima di
modificare la configurazione.

## Scelta rapida

| Obiettivo                                         | Utilizzare                                                          | Note                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Abbonamento ChatGPT/Codex, runtime Codex nativo   | `openai/gpt-5.6-sol`                                               | Nuova configurazione dell'abbonamento; accedere con l'autenticazione Codex. |
| Fatturazione diretta tramite chiave API per i turni dell'agente | `openai/gpt-5.6` più un profilo di autenticazione tramite chiave API ordinato | Nuova configurazione della chiave API; l'id API diretto senza qualificatori viene risolto in Sol. |
| Scegliere un livello GPT-5.6 esatto               | `openai/gpt-5.6-sol`, `-terra` o `-luna`                         | Controllare `models list` per i livelli disponibili per questo account. |
| Account senza accesso a GPT-5.6                   | `openai/gpt-5.5`                                                   | Scelta esplicita di ripristino; OpenClaw non effettua un downgrade silenzioso. |
| Fatturazione diretta tramite chiave API, runtime OpenClaw esplicito | `openai/gpt-5.6` più `agentRuntime.id: "openclaw"` del provider/modello | Selezionare un normale profilo di chiave API `openai`. |
| Alias del modello ChatGPT Instant più recente     | `openai/chat-latest`                                               | Solo chiave API diretta; alias mobile, non l'impostazione predefinita stabile. |
| Generazione o modifica di immagini                | `openai/gpt-image-2`                                               | Funziona con `OPENAI_API_KEY` o OAuth Codex. |
| Immagini con sfondo trasparente                   | `openai/gpt-image-1.5`                                             | Impostare `outputFormat` su `png` o `webp` e `background=transparent`. |

## Mappa dei nomi

| Nome visualizzato                         | Livello           | Significato                                                                                |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | Prefisso del provider | Route canonica del modello OpenAI; i dati della route determinano il runtime implicito. |
| Plugin `codex`                          | Plugin            | Plugin incluso che fornisce il runtime app-server Codex nativo e i controlli chat `/codex`. |
| `agentRuntime.id: codex` del provider/modello | Runtime dell'agente | Impone l'infrastruttura app-server Codex nativa per i turni incorporati corrispondenti. |
| `/codex ...`                            | Insieme di comandi chat | Associa e controlla i thread dell'app-server Codex da una conversazione. |
| `runtime: "acp", agentId: "codex"`      | Route della sessione ACP | Percorso di fallback esplicito che esegue Codex tramite ACP/acpx. |

## Runtime implicito dell'agente

Quando il criterio `agentRuntime` del provider/modello non è impostato o è impostato su `auto`, il criterio
della route appartenente al provider OpenAI sceglie il runtime implicito in base
all'endpoint e all'adattatore effettivi:

| Dati della route effettiva                                                                                                                                             | Runtime implicito      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Endpoint HTTPS ufficiale esatto della piattaforma con `openai-responses` oppure endpoint HTTPS ufficiale esatto di ChatGPT con `openai-chatgpt-responses`; nessuna sostituzione della richiesta definita | Codex può essere selezionato |
| Adattatore `openai-completions` definito                                                                                                                                 | OpenClaw              |
| Endpoint personalizzato                                                                                                                                                | OpenClaw              |
| Endpoint ufficiale esatto esplicito che utilizza HTTP                                                                                                                   | Rifiutato              |
| Route con una sostituzione della richiesta del provider/modello definita                                                                                                | OpenClaw              |

Un valore `agentRuntime.id` esplicito e non predefinito del provider/modello rimane determinante.
Ad esempio, `agentRuntime.id: "openclaw"` mantiene su OpenClaw una route che altrimenti
sarebbe idonea per Codex, mentre `agentRuntime.id: "codex"` richiede Codex e genera un errore
in modalità fail-closed quando la route effettiva non è dichiarata compatibile con Codex.
La selezione del runtime non modifica il tipo di credenziale o la fatturazione: l'autenticazione
tramite chiave API della piattaforma e l'autenticazione tramite abbonamento ChatGPT/Codex rimangono distinte.

`openclaw doctor --fix` migra i riferimenti legacy ai modelli `codex/*` e `openai-codex/*`,
gli id legacy dei profili di autenticazione Codex e le voci legacy dell'ordine di autenticazione Codex
alla route canonica `openai`. I riferimenti ai modelli migrati ricevono
`agentRuntime.id: "codex"` con ambito limitato al modello; utilizzare `auth.order.openai` per la nuova configurazione dell'ordine di autenticazione.

<Note>
Una nuova configurazione OpenAI applica un modello primario GPT-5.6 solo quando non è
configurato alcun modello primario. L'aggiunta o l'aggiornamento dell'autenticazione OpenAI mantiene una selezione
esplicita esistente, incluso `openai/gpt-5.5`, a meno che non si utilizzi esplicitamente
`models auth login --set-default` o `models set`. Utilizzare un profilo di autenticazione tramite chiave API
solo quando si desidera l'autenticazione tramite chiave API per un modello dell'agente.
</Note>

## Anteprima limitata di GPT-5.6

OpenClaw riconosce gli id modello esatti `openai/gpt-5.6-sol`,
`openai/gpt-5.6-terra` e `openai/gpt-5.6-luna`. Tutti e tre espongono i livelli di ragionamento
`xhigh` e `max` nel catalogo attuale. OpenAI descrive Sol come
il livello di punta, Terra come il livello bilanciato e Luna come il livello rapido
e meno costoso. Consultare
[l'annuncio del lancio di GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/)
e la [guida all'accesso](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

Con l'autenticazione OpenAI diretta tramite chiave API, l'id `openai/gpt-5.6` senza qualificatori è un alias di
Sol ed è l'impostazione predefinita per le nuove configurazioni. Il catalogo Codex nativo non applica
lato client tale alias dell'API diretta; a seconda dell'accesso all'area di lavoro, può mostrare
gli id esatti di Sol, Terra e Luna. Di conseguenza, una nuova configurazione OAuth ChatGPT/Codex
utilizza `openai/gpt-5.6-sol`. Controllare l'account corrente con:

```bash
openclaw models list --provider openai
```

L'accesso all'organizzazione API e all'area di lavoro Codex può essere diverso. Se GPT-5.6 non è
disponibile, selezionare esplicitamente GPT-5.5:

```bash
openclaw models set openai/gpt-5.5
```

OpenClaw mostra l'errore di accesso upstream e non sostituisce silenziosamente una
selezione GPT-5.6 con GPT-5.5.

<Note>
Le route HTTPS ufficiali esatte idonee possono selezionare il Plugin app-server
Codex incluso quando il criterio di runtime non è impostato o è impostato su `auto`; le route Completions definite,
gli endpoint personalizzati e le sostituzioni del trasporto delle richieste rimangono su OpenClaw. Gli endpoint
HTTP ufficiali non crittografati vengono rifiutati. La configurazione esplicita del runtime del provider/modello rimane
determinante. Eseguire `openclaw doctor --fix` per correggere i riferimenti legacy obsoleti ai modelli Codex,
i riferimenti `codex-cli/*` o i vecchi vincoli delle sessioni di runtime non impostati da una
configurazione esplicita del runtime.
</Note>

## Copertura delle funzionalità di OpenClaw

| Funzionalità OpenAI         | Superficie OpenClaw                                                                              | Stato                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Chat / Responses          | provider di modelli `openai/<model>`                                                               | Sì                                                             |
| Modelli con abbonamento Codex | `openai/<model>` con OAuth OpenAI                                                            | Sì                                                             |
| Riferimenti ai modelli Codex legacy   | vecchi riferimenti ai modelli Codex, `codex-cli/<model>`                                                     | Riparati da doctor in `openai/<model>`                          |
| Harness app-server Codex  | route HTTPS compatibile con Codex con runtime non impostato/`auto`, oppure `agentRuntime.id: codex` esplicito  | Sì                                                             |
| Ricerca web lato server    | strumento nativo OpenAI Responses                                                                  | Sì, quando la ricerca web è abilitata e non è vincolato un altro provider |
| Immagini                    | `image_generate`                                                                              | Sì                                                             |
| Video                    | `video_generate`                                                                              | Sì                                                             |
| Sintesi vocale            | `messages.tts.provider: "openai"` / `tts`                                                     | Sì                                                             |
| Trascrizione vocale in batch      | `tools.media.audio` / comprensione dei contenuti multimediali                                                     | Sì                                                             |
| Trascrizione vocale in streaming  | Voice Call `streaming.provider: "openai"`                                                     | Sì                                                             |
| Voce in tempo reale            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Sì (chiave API OpenAI Platform)                                   |
| Embedding                | provider di embedding della memoria                                                                     | Sì                                                             |

<Note>
La voce in tempo reale di OpenAI passa attraverso l'**OpenAI Platform Realtime
API** pubblica e richiede una chiave API Platform. I token OAuth Codex autenticano
invece il backend ChatGPT Codex; non sono intercambiabili con le chiavi API
Platform per gli endpoint Realtime pubblici.

Se l'autenticazione tramite chiave API segnala l'assenza di fatturazione, ricaricare i crediti Platform su
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
per l'organizzazione associata alle credenziali in tempo reale quando si utilizza
l'autenticazione tramite chiave API. La voce in tempo reale accetta il profilo di autenticazione con chiave API `openai` creato da
`openclaw onboard --auth-choice openai-api-key`, una chiave API Platform impostata tramite
`talk.realtime.providers.openai.apiKey` per Control UI Talk, oppure
`plugins.entries.voice-call.config.realtime.providers.openai.apiKey` per Voice
Call, oppure la variabile di ambiente `OPENAI_API_KEY`.
</Note>

## Embedding della memoria

OpenClaw può utilizzare OpenAI, o un endpoint di embedding compatibile con OpenAI, per
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

Per gli endpoint compatibili con OpenAI che richiedono etichette di embedding asimmetriche, impostare
`queryInputType` e `documentInputType` in `memorySearch`. OpenClaw
le inoltra come campi della richiesta `input_type` specifici del provider: gli embedding
delle query utilizzano `queryInputType`; i frammenti di memoria indicizzati e l'indicizzazione in batch utilizzano
`documentInputType`. Consultare il
[Riferimento per la configurazione della memoria](/it/reference/memory-config#provider-specific-config)
per l'esempio completo.

## Introduzione

<Tabs>
  <Tab title="Chiave API (OpenAI Platform)">
    **Ideale per:** accesso diretto all'API e fatturazione basata sull'utilizzo.

    <Steps>
      <Step title="Ottenere la chiave API">
        Creare o copiare una chiave API dalla [dashboard OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Eseguire l'onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        In alternativa, passare direttamente la chiave:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verificare che il modello sia disponibile">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Riepilogo delle route

    | Riferimento del modello        | Criteri del runtime o caratteristiche della route                                 | Route                     | Autenticazione                              |
    | ---------------- | ------------------------------------------------------------- | ------------------------- | --------------------------------- |
    | `openai/gpt-5.6` | non impostato/`auto`, route nativa HTTPS ufficiale esatta, nessun override della richiesta | Può essere selezionato Codex     | Profilo di autenticazione con chiave API ordinato      |
    | `openai/gpt-5.6` | provider/modello `agentRuntime.id: "openclaw"`                  | runtime integrato di OpenClaw | Profilo con chiave API `openai` selezionato |
    | `openai/gpt-5.5` | provider/modello `agentRuntime.id` esplicito                     | runtime dell'agente selezionato    | Profilo con chiave API OpenAI selezionato   |
    | `openai/*`       | Completions definite, personalizzate o override della richiesta | runtime integrato di OpenClaw | Il tipo di credenziale rimane invariato |
    | `openai/*`       | endpoint HTTP ufficiale in testo non cifrato                  | Rifiutata                 | La credenziale non viene inviata             |

    <Note>
    Con il runtime non impostato o `auto`, solo una route nativa HTTPS ufficiale
    esatta e idonea può selezionare implicitamente l'harness app-server Codex. Per l'autenticazione
    tramite chiave API sul modello di un agente, creare un profilo di autenticazione con chiave API `openai` e ordinarlo con
    `auth.order.openai`; `OPENAI_API_KEY` rimane il fallback diretto per
    le superfici API OpenAI non relative agli agenti. Eseguire `openclaw doctor --fix` per migrare le precedenti
    voci legacy dell'ordine di autenticazione Codex.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
    }
    ```

    L'id diretto dell'API senza qualificatori `gpt-5.6` viene risolto nel livello Sol. Se questa
    organizzazione API non espone GPT-5.6, impostare esplicitamente il modello principale su
    `openai/gpt-5.5`.

    Per provare il modello Instant attuale di ChatGPT dall'API OpenAI, impostare il modello
    su `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` è un alias dinamico. Le nuove configurazioni con chiave API OpenAI utilizzano invece
    `openai/gpt-5.6`, il cui id diretto dell'API senza qualificatori viene risolto in Sol. I modelli
    principali espliciti esistenti, incluso `openai/gpt-5.5`, rimangono invariati. L'alias
    `chat-latest` accetta solo il livello di dettaglio del testo `medium`; per questo modello OpenClaw forza
    qualsiasi altro livello di dettaglio richiesto su `medium`.

    <Warning>
    OpenClaw **non** espone `gpt-5.3-codex-spark` sulla route diretta con
    chiave API OpenAI. È disponibile solo tramite le voci del catalogo dell'abbonamento Codex
    quando l'account connesso lo espone.
    </Warning>

  </Tab>

  <Tab title="Abbonamento Codex">
    **Ideale per:** utilizzare l'abbonamento ChatGPT/Codex con l'esecuzione nativa
    dell'app-server Codex anziché una chiave API separata. Codex cloud richiede
    l'accesso a ChatGPT.

    <Steps>
      <Step title="Eseguire OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        In alternativa, eseguire direttamente OAuth:

        ```bash
        openclaw models auth login --provider openai
        ```

        Per configurazioni headless o incompatibili con il callback, aggiungere `--device-code` per
        accedere con un flusso tramite codice del dispositivo ChatGPT anziché con il callback
        del browser localhost:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Utilizzare la route canonica del modello OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.6-sol
        ```

        Per questa route nativa HTTPS ufficiale esatta non è richiesta alcuna configurazione
        del runtime. Può selezionare automaticamente il runtime app-server Codex e
        OpenClaw installa o ripara il Plugin Codex incluso quando viene scelto tale runtime.
      </Step>
      <Step title="Verificare che l'autenticazione Codex sia disponibile">
        ```bash
        openclaw models list --provider openai
        ```

        Dopo l'avvio del Gateway, inviare `/codex status` o `/codex models`
        nella chat per verificare il runtime app-server nativo.
      </Step>
    </Steps>

    ### Riepilogo delle route

    | Riferimento del modello                | Criteri del runtime o caratteristiche della route                                 | Route                                                    | Autenticazione                                               |
    | ------------------------ | ------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.6-sol`     | non impostato/`auto`, route nativa HTTPS ufficiale esatta, nessun override della richiesta | Può essere selezionato Codex                                    | Accesso Codex o un profilo di autenticazione `openai` ordinato |
    | `openai/gpt-5.6-terra`   | non impostato/`auto`, route nativa HTTPS ufficiale esatta, nessun override della richiesta | Può essere selezionato Codex                                    | Accesso Codex quando il catalogo espone Terra       |
    | `openai/gpt-5.6-luna`    | non impostato/`auto`, route nativa HTTPS ufficiale esatta, nessun override della richiesta | Può essere selezionato Codex                                    | Accesso Codex quando il catalogo espone Luna        |
    | `openai/gpt-5.6-sol`     | provider/modello `agentRuntime.id: "openclaw"`                  | runtime integrato di OpenClaw, trasporto interno con autenticazione Codex | Profilo OAuth `openai` selezionato                    |
    | `openai/gpt-5.5`         | provider/modello `agentRuntime.id` esplicito                     | runtime dell'agente selezionato                                   | Profilo di autenticazione OpenAI selezionato                       |
    | `openai/*`               | Completions definite, personalizzate o override della richiesta | runtime integrato di OpenClaw                                | Il requisito delle credenziali rimane specifico della route      |
    | `openai/*`               | endpoint HTTP ufficiale in testo non cifrato                  | Rifiutata                                                 | La credenziale non viene inviata                              |
    | Riferimento legacy a Codex GPT-5.5 | riparato da doctor                                            | Riscritto in `openai/gpt-5.5`                            | Profilo OAuth OpenAI migrato                      |
    | `codex-cli/gpt-5.5`      | riparato da doctor                                            | Riscritto in `openai/gpt-5.5`                            | Autenticazione app-server Codex                              |

    <Warning>
    La nuova configurazione basata su abbonamento usa esattamente `openai/gpt-5.6-sol`; il
    catalogo Codex nativo può anche esporre riferimenti Terra o Luna esatti. Se
    l'account non espone GPT-5.6, selezionare esplicitamente `openai/gpt-5.5`. I riferimenti
    GPT Codex meno recenti sono route OpenClaw legacy, non il percorso del runtime
    Codex nativo; eseguire `openclaw doctor --fix` per migrarli senza aggiornare una
    selezione esplicita esistente di GPT-5.5. `gpt-5.3-codex-spark` resta limitato
    agli account il cui catalogo dell'abbonamento Codex lo pubblicizza; i riferimenti diretti
    tramite chiave API OpenAI e Azure rimangono nascosti.
    </Warning>

    <Note>
    La nuova configurazione deve inserire l'ordine di autenticazione dell'agente OpenAI in `auth.order.openai`;
    doctor migra le precedenti voci legacy dell'ordine di autenticazione Codex.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
    }
    ```

    Con una chiave API di riserva, mantenere il modello selezionato in `openai/*` e inserire
    l'ordine di autenticazione in `openai`. OpenClaw prova prima l'abbonamento, quindi
    la chiave API, rimanendo nell'harness Codex:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
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
    L'onboarding non importa più il materiale OAuth da `~/.codex`. Accedere con
    OAuth tramite browser (impostazione predefinita) o con il flusso del codice dispositivo descritto sopra; OpenClaw gestisce le
    credenziali risultanti nel proprio archivio di autenticazione degli agenti.
    </Note>

    ### Verificare e ripristinare il routing OAuth di Codex

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Per un agente specifico, aggiungere `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Se una configurazione meno recente contiene ancora riferimenti GPT Codex legacy o un'associazione obsoleta
    della sessione runtime OpenAI senza una configurazione esplicita del runtime, correggerla:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Se `models auth list --provider openai` non mostra alcun profilo utilizzabile, accedere
    nuovamente:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Usare `--profile-id` per più accessi OAuth Codex nello stesso agente, quindi
    gestirli tramite l'ordine di autenticazione o `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    Eseguire `openclaw doctor --fix` per migrare i precedenti ID profilo legacy con prefisso OpenAI Codex
    e le relative voci dell'ordine prima di affidarsi all'ordinamento dei profili.

    ### Indicatore di stato

    In chat, `/status` mostra quale runtime del modello è attivo per la sessione
    corrente. L'harness app-server Codex incluso appare come
    `Runtime: OpenAI Codex` quando viene selezionato da una route implicita idonea o da un criterio
    esplicito del runtime per provider/modello.

    ### Avviso di doctor

    Se nella configurazione o nello stato della sessione rimangono riferimenti legacy ai modelli Codex
    o associazioni obsolete del runtime OpenAI, `openclaw doctor --fix` li riscrive come `openai/*` con
    il runtime Codex, a meno che OpenClaw non sia configurato esplicitamente.

    ### Limite della finestra di contesto

    OpenClaw considera i metadati del modello e il limite di contesto del runtime come valori
    separati. Per `openai/gpt-5.5` tramite il catalogo OAuth Codex:

    - `contextWindow` nativo: `400000`
    - Limite `contextTokens` predefinito del runtime: `272000`

    In pratica, il limite predefinito più piccolo offre caratteristiche migliori in termini di latenza e qualità.
    È possibile sovrascriverlo con `contextTokens`:

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
    Usare `contextWindow` per dichiarare i metadati nativi del modello. Usare `contextTokens`
    per limitare il budget di contesto del runtime. La route diretta tramite chiave API OpenAI
    segnala un `contextWindow` nativo più ampio (`1000000`) per `gpt-5.5`; le due
    route vengono monitorate separatamente perché i cataloghi upstream sono diversi.
    </Note>

    ### Ripristino del catalogo

    OpenClaw usa i metadati del catalogo Codex upstream per `gpt-5.5` quando sono
    presenti. Se il rilevamento Codex in tempo reale omette la riga `gpt-5.5` mentre l'account
    è autenticato, OpenClaw sintetizza tale riga del modello OAuth affinché le esecuzioni cron,
    dei sotto-agenti e del modello predefinito configurato non restituiscano l'errore
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticazione nativa dell'app-server Codex

L'harness app-server Codex nativo usa riferimenti al modello `openai/*` quando viene selezionato implicitamente da una
route HTTPS ufficiale esatta e idonea oppure esplicitamente da
`agentRuntime.id: "codex"` del provider/modello. L'autenticazione rimane
basata sull'account. OpenClaw seleziona l'autenticazione nel seguente ordine:

1. Profili di autenticazione OpenAI ordinati per l'agente, preferibilmente in
   `auth.order.openai`. Eseguire `openclaw doctor --fix` per migrare i precedenti ID profilo
   di autenticazione Codex legacy e il relativo ordine.
2. L'account esistente dell'app-server, ad esempio un accesso ChatGPT
   della CLI Codex locale. Per la home isolata predefinita dell'agente, OpenClaw collega tale account
   CLI nativo all'app-server tramite la relativa RPC di accesso; non condivide la
   configurazione, i plugin o l'archivio dei thread della CLI.
3. Solo per gli avvii locali dell'app-server tramite stdio e solo quando l'app-server
   non segnala alcun account: `CODEX_API_KEY`, quindi `OPENAI_API_KEY`.

Un accesso locale con abbonamento ChatGPT/Codex non viene sostituito solo perché il
processo Gateway dispone anche di `OPENAI_API_KEY` per i modelli OpenAI diretti o
gli embedding. Il fallback tramite chiave API di ambiente si applica esclusivamente al percorso locale stdio senza account;
non viene mai inviato tramite connessioni WebSocket dell'app-server. Quando viene selezionato un
profilo Codex basato su abbonamento, OpenClaw esclude inoltre
`CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio app-server stdio avviato
e invia invece le credenziali selezionate tramite la RPC di accesso dell'app-server.

Quando tale profilo di abbonamento viene bloccato da un limite di utilizzo Codex, OpenClaw
contrassegna il profilo come bloccato fino all'ora di ripristino indicata da Codex e consente all'ordine di
autenticazione di passare al profilo `openai:*` successivo, senza modificare il modello selezionato
né uscire dall'harness Codex. Dopo l'ora di ripristino, il
profilo di abbonamento torna idoneo.

## Generazione di immagini

Il plugin `openai` incluso registra la generazione di immagini tramite lo
strumento `image_generate`. Supporta sia la generazione di immagini tramite chiave API OpenAI sia quella tramite OAuth Codex
con lo stesso riferimento al modello `openai/gpt-image-2`.

| Funzionalità              | Chiave API OpenAI                  | OAuth Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Riferimento del modello   | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Autenticazione            | `OPENAI_API_KEY`                   | Accesso OAuth OpenAI Codex            |
| Trasporto                 | API OpenAI Images                  | Backend Codex Responses              |
| Numero massimo di immagini per richiesta | 4                    | 4                                    |
| Modalità di modifica      | Abilitata (fino a 5 immagini di riferimento) | Abilitata (fino a 5 immagini di riferimento) |
| Dimensioni personalizzate | Supportate, incluse le dimensioni 2K/4K | Supportate, incluse le dimensioni 2K/4K |
| Proporzioni / risoluzione | Non inoltrate all'API OpenAI Images | Associate a una dimensione supportata quando è sicuro |

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
Consultare [Generazione di immagini](/it/tools/image-generation) per i parametri condivisi dello strumento,
la selezione del provider e il comportamento di failover.
</Note>

`gpt-image-2` è il valore predefinito per la generazione di immagini da testo e la modifica di immagini con OpenAI.
`gpt-image-1.5`, `gpt-image-1` e `gpt-image-1-mini` restano utilizzabili
come sostituzioni esplicite del modello. Usare `openai/gpt-image-1.5` per
un output PNG/WebP con sfondo trasparente; l'API `gpt-image-2` corrente rifiuta
`background: "transparent"`.

Per una richiesta con sfondo trasparente, chiamare `image_generate` con
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` o `"webp"` e
`background: "transparent"`; la precedente opzione del provider `openai.background` è
ancora accettata. OpenClaw protegge inoltre le route pubbliche OpenAI e OAuth OpenAI Codex
riscrivendo le richieste trasparenti predefinite `openai/gpt-image-2` come
`gpt-image-1.5`; Azure e gli endpoint personalizzati compatibili con OpenAI mantengono i
nomi di distribuzione/modello configurati.

La stessa impostazione è disponibile per le esecuzioni CLI headless:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "Un semplice adesivo circolare rosso su sfondo trasparente" \
  --json
```

Usare gli stessi flag `--output-format` e `--background` con
`openclaw infer image edit` quando si parte da un file di input.
`--openai-background` resta disponibile come alias specifico di OpenAI. Usare
`--quality low|medium|high|auto` per controllare la qualità e il costo di OpenAI Images.
Usare `--openai-moderation low|auto` per passare il suggerimento di moderazione di OpenAI da
`image generate` o `image edit`.

Per le installazioni OAuth ChatGPT/Codex, mantenere lo stesso riferimento `openai/gpt-image-2`. Quando
è configurato un profilo OAuth `openai`, OpenClaw risolve il token di accesso OAuth
archiviato e invia le richieste di immagini tramite il backend Codex Responses; non
prova prima `OPENAI_API_KEY` né esegue silenziosamente il fallback a una chiave API.
Configurare esplicitamente `models.providers.openai` con una chiave API, un URL di base
personalizzato o un endpoint Azure per usare invece la route diretta dell'API OpenAI Images.
Se tale endpoint personalizzato per le immagini si trova su una LAN o un indirizzo privato attendibile,
impostare anche `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw
mantiene bloccati gli endpoint privati/interni per immagini compatibili con OpenAI, a meno che non sia presente questa
abilitazione esplicita.

Generazione:

```
/tool image_generate model=openai/gpt-image-2 prompt="Un poster di lancio professionale per OpenClaw su macOS" size=3840x2160 count=1
```

Generazione di un PNG trasparente:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="Un semplice adesivo circolare rosso su sfondo trasparente" outputFormat=png background=transparent
```

Modifica:

```
/tool image_generate model=openai/gpt-image-2 prompt="Mantieni la forma dell'oggetto e cambia il materiale in vetro traslucido" image=/path/to/reference.png size=1024x1536
```

## Generazione di video

Il plugin `openai` incluso registra la generazione di video tramite lo
strumento `video_generate`.

| Funzionalità       | Valore                                                                             |
| ------------------ | ---------------------------------------------------------------------------------- |
| Modello predefinito | `openai/sora-2`                                                                   |
| Modalità           | Da testo a video, da immagine a video, modifica di un singolo video                |
| Input di riferimento | 1 immagine o 1 video                                                             |
| Dimensioni personalizzate | Supportate per la conversione da testo a video e da immagine a video       |
| Proporzioni        | Convertite nella dimensione supportata più vicina, non inoltrate direttamente      |
| Altre personalizzazioni | `resolution`, `audio`, `watermark` non sono supportate e vengono ignorate con un avviso dello strumento |

Le richieste OpenAI da immagine a video usano `POST /v1/videos` con un'immagine
`input_reference`. Le modifiche di un singolo video usano `POST /v1/videos/edits` con il
video caricato nel campo `video`.

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
Consultare [Generazione video](/it/tools/video-generation) per i parametri condivisi dello strumento,
la selezione del provider e il comportamento di failover.

Il provider OpenAI dichiara `supportsSize`, ma non `supportsAspectRatio` o
`supportsResolution`. Il livello di normalizzazione condiviso di OpenClaw converte un
`aspectRatio` richiesto nel valore OpenAI `size` corrispondente più vicino prima che la
richiesta raggiunga il provider, pertanto le richieste relative alle proporzioni in genere continuano a funzionare.
`resolution` non dispone di un fallback per le dimensioni e viene ignorato, con segnalazione al chiamante come
`Ignored unsupported overrides for openai/<model>: resolution=<value>`.
</Note>

## Contributo al prompt GPT-5

OpenClaw aggiunge un contributo condiviso al prompt GPT-5 per i modelli della famiglia GPT-5 sul
provider `openai` (inclusi i riferimenti Codex precedenti alla riparazione che vengono normalizzati
in `openai/*`). Gli altri provider che distribuiscono anche ID di modelli della famiglia GPT-5, come
OpenRouter o le route opencode, non ricevono questo overlay; viene abilitato in base
all'ID provider `openai`, non al solo ID modello. I modelli GPT-4.x precedenti non
lo ricevono mai.

L'harness nativo dell'app server Codex non riceve il contratto di comportamento relativo alla persona e alla
disciplina degli strumenti né l'overlay dello stile di interazione amichevole tramite
le istruzioni dello sviluppatore; Codex nativo mantiene il comportamento di base, del modello e
dei documenti di progetto gestito da Codex, mentre OpenClaw disabilita la personalità integrata di Codex per
i thread nativi, affinché i file della personalità dell'area di lavoro dell'agente rimangano autorevoli.
OpenClaw fornisce ai thread Codex nativi solo il contesto di runtime: distribuzione
al canale, strumenti dinamici di OpenClaw, delega ACP, contesto dell'area di lavoro e
Skills di OpenClaw. Il testo guida relativo all'Heartbeat proveniente dallo stesso contributo è
l'unica eccezione: le esecuzioni Heartbeat di Codex nativo lo ricevono, inserito come
istruzioni di collaborazione dedicate anziché tramite l'hook condiviso per il contributo
al prompt.

Il contributo GPT-5 aggiunge un contratto di comportamento con tag per la persistenza della persona,
la sicurezza dell'esecuzione, la disciplina degli strumenti, la struttura dell'output, i controlli
di completamento e la verifica nei prompt corrispondenti assemblati da OpenClaw. Il comportamento
specifico del canale per le risposte e i messaggi silenziosi rimane nel prompt di sistema condiviso di OpenClaw
e nei criteri di distribuzione in uscita. Il livello dello stile di interazione amichevole è
separato e configurabile.

| Valore                  | Effetto                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (predefinito) | Abilita il livello dello stile di interazione amichevole |
| `"on"`                 | Alias di `"friendly"`                      |
| `"off"`                | Disabilita solo il livello dello stile amichevole       |

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
Durante il runtime, i valori non distinguono tra maiuscole e minuscole, pertanto sia `"Off"` sia `"off"` disabilitano il
livello dello stile amichevole.
</Tip>

<Note>
Il valore precedente `plugins.entries.openai.config.personality` viene ancora letto come
fallback di compatibilità quando l'impostazione condivisa
`agents.defaults.promptOverlays.gpt5.personality` non è impostata.
</Note>

## Voce e parlato

<AccordionGroup>
  <Accordion title="Sintesi vocale (TTS)">
    Il Plugin incluso `openai` registra la sintesi vocale per la
    superficie `messages.tts`.

    | Impostazione      | Percorso di configurazione                                            | Valore predefinito                          |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | Modello        | `messages.tts.providers.openai.model`                  | `gpt-4o-mini-tts`                |
    | Voce        | `messages.tts.providers.openai.speakerVoice`           | `coral`                          |
    | Velocità        | `messages.tts.providers.openai.speed`                  | (non impostato)                          |
    | Istruzioni | `messages.tts.providers.openai.instructions`           | (non impostato, solo `gpt-4o-mini-tts`)  |
    | Formato       | `messages.tts.providers.openai.responseFormat`         | `opus` per i messaggi vocali, `mp3` per i file |
    | Chiave API      | `messages.tts.providers.openai.apiKey`                 | Usa come fallback `OPENAI_API_KEY`   |
    | URL di base     | `messages.tts.providers.openai.baseUrl`                | `https://api.openai.com/v1`      |
    | Corpo aggiuntivo   | `messages.tts.providers.openai.extraBody` / `extra_body` | (non impostato)                        |

    Modelli disponibili: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voci disponibili:
    `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`,
    `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` viene unito al JSON della richiesta `/audio/speech` dopo i
    campi generati da OpenClaw; usarlo quindi per gli endpoint compatibili con OpenAI che richiedono
    chiavi aggiuntive come `lang`. Le chiavi del prototipo vengono ignorate.

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
    Impostare `OPENAI_TTS_BASE_URL` per sostituire l'URL di base TTS senza influire
    sull'endpoint API della chat. Sia OpenAI TTS sia la voce Realtime vengono configurati
    tramite una chiave API di OpenAI Platform; le installazioni che usano esclusivamente OAuth possono comunque utilizzare
    modelli di chat basati su Codex, ma non la risposta vocale in tempo reale di OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Da parlato a testo">
    Il Plugin incluso `openai` registra la conversione batch da parlato a testo tramite
    la superficie di trascrizione per la comprensione dei contenuti multimediali di OpenClaw.

    - Modello predefinito: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Percorso di input: caricamento di un file audio multipart
    - Utilizzato ovunque la trascrizione dell'audio in ingresso legga `tools.media.audio`,
      inclusi i segmenti dei canali vocali Discord e gli allegati audio dei canali

    Per imporre l'uso di OpenAI per la trascrizione dell'audio in ingresso:

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

    Quando forniti dalla configurazione condivisa dei contenuti multimediali audio o dalla richiesta di trascrizione
    della singola chiamata, i suggerimenti relativi alla lingua e al prompt vengono inoltrati a OpenAI.

  </Accordion>

  <Accordion title="Trascrizione in tempo reale">
    Il Plugin incluso `openai` registra la trascrizione in tempo reale per il
    Plugin Voice Call.

    | Impostazione          | Percorso di configurazione                                                          | Valore predefinito |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | Modello            | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Lingua         | `...openai.language`                                                 | (non impostato) |
    | Prompt           | `...openai.prompt`                                                   | (non impostato) |
    | Durata del silenzio | `...openai.silenceDurationMs`                                        | `800`   |
    | Soglia VAD    | `...openai.vadThreshold`                                             | `0.5`   |
    | Autenticazione             | `...openai.apiKey`, `OPENAI_API_KEY` o profilo con chiave API `openai`    | È richiesta una chiave API di Platform |

    <Note>
    Utilizza una connessione WebSocket a `wss://api.openai.com/v1/realtime` con audio
    G.711 u-law (`g711_ulaw` / `audio/pcmu`). Per un profilo con chiave API `openai`,
    il Gateway genera un segreto client temporaneo per la trascrizione Realtime
    prima di aprire il WebSocket. Questo provider di streaming è destinato al percorso di trascrizione
    in tempo reale di Voice Call; attualmente la voce Discord registra brevi
    segmenti e utilizza invece il percorso di trascrizione batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voce in tempo reale">
    Il Plugin incluso `openai` registra la voce in tempo reale per il Plugin
    Voice Call.

    | Impostazione                               | Percorso di configurazione                                                              | Valore predefinito             |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | Modello                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2.1`  |
    | Voce                                  | `...openai.voice`                                                       | `alloy`             |
    | Temperatura (bridge di distribuzione Azure)  | `...openai.temperature`                                                 | `0.8`               |
    | Soglia VAD                          | `...openai.vadThreshold`                                                | `0.5`                |
    | Durata del silenzio                       | `...openai.silenceDurationMs`                                           | `500`                |
    | Padding del prefisso                         | `...openai.prefixPaddingMs`                                             | `300`                |
    | Impegno di ragionamento                       | `...openai.reasoningEffort`                                             | (non impostato)              |
    | Autenticazione                                   | profilo con chiave API `openai`, `...openai.apiKey` o `OPENAI_API_KEY` | È richiesta una chiave API di OpenAI Platform |

    Voci Realtime integrate disponibili per `gpt-realtime-2.1`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI consiglia `marin` e `cedar` per ottenere la migliore qualità Realtime. Questo
    insieme è distinto dalle voci di sintesi vocale indicate sopra; una voce riservata alla TTS
    come `fable`, `nova` o `onyx` non è valida per le sessioni Realtime.
    Impostare esplicitamente il modello su `gpt-realtime-2.1-mini` se si preferisce la
    variante Realtime 2.1 più piccola e meno costosa.

    <Note>
    **GPT-Live (di prossima disponibilità).** I modelli full-duplex `gpt-live-1` e
    `gpt-live-1-mini` di OpenAI hanno sostituito la modalità vocale di ChatGPT a luglio 2026; l'
    API per sviluppatori è in fase di distribuzione alle organizzazioni con accesso anticipato. OpenClaw
    riconosce la famiglia di modelli, ma non la esegue ancora: le sessioni GPT-Live sono
    esclusivamente WebRTC, gestiscono autonomamente l'alternanza dei turni (senza VAD) e delegano il lavoro dell'agente
    tramite un protocollo di eventi di passaggio che i trasporti in tempo reale di OpenClaw
    non implementano ancora. La configurazione di un modello `gpt-live-*` non riesce in modo sicuro e fornisce
    indicazioni sia sul bridge WebSocket sia sulle sessioni browser Talk, anziché
    connettere silenziosamente l'audio senza accesso all'agente. Durante l'accesso anticipato, anche l'accesso
    all'API è limitato per organizzazione OpenAI. Mantenere `gpt-realtime-2.1` (il
    valore predefinito) finché non sarà disponibile il supporto per GPT-Live.
    </Note>

    <Note>
    I bridge backend in tempo reale di OpenAI utilizzano la struttura della sessione WebSocket Realtime
    GA, che non accetta `session.temperature`. Le distribuzioni di Azure OpenAI
    rimangono disponibili tramite `azureEndpoint` e `azureDeployment` e
    mantengono la struttura della sessione compatibile con la distribuzione (incluso `temperature`).
    Supporta la chiamata bidirezionale degli strumenti e l'audio G.711 u-law.
    </Note>

    <Note>
    La voce in tempo reale viene selezionata al momento della creazione della sessione. OpenAI consente di modificare in seguito la maggior parte
    dei campi della sessione, ma la voce non può essere cambiata dopo che il
    modello ha emesso audio in quella sessione. Attualmente OpenClaw espone gli
    ID delle voci Realtime integrate come stringhe.
    </Note>

    <Note>
    La funzione Talk della Control UI utilizza sessioni in tempo reale OpenAI nel browser con un segreto client
    temporaneo coniato dal Gateway e uno scambio SDP WebRTC diretto dal browser
    con l'API Realtime di OpenAI. Il Gateway conia tale segreto client con
    la credenziale `openai` selezionata. Le chiavi configurate, i profili con chiave API e
    `OPENAI_API_KEY` hanno la precedenza; un profilo OAuth `openai` o un accesso
    Codex esterno costituisce il fallback. Il relay del Gateway e i bridge WebSocket in tempo reale
    del backend Voice Call usano lo stesso ordine delle credenziali per gli endpoint OpenAI nativi.
    La verifica live per i manutentori è disponibile con
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    i passaggi OpenAI verificano sia il bridge WebSocket del backend sia lo scambio SDP
    WebRTC del browser senza registrare segreti.
    Passare `--openai-only` per eseguire questi due passaggi senza credenziali Google.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Il provider `openai` incluso può indirizzare una risorsa Azure OpenAI per la generazione
di immagini sovrascrivendo l'URL di base. Nel percorso di generazione delle immagini, OpenClaw
rileva i nomi host Azure in `models.providers.openai.baseUrl` e passa
automaticamente al formato di richiesta di Azure.

<Note>
La voce in tempo reale utilizza un percorso di configurazione separato
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e non è interessata da `models.providers.openai.baseUrl`. Consultare il pannello **Voce in tempo
reale** in [Voce e sintesi vocale](#voice-and-speech) per le relative impostazioni
Azure.
</Note>

Utilizzare Azure OpenAI nei seguenti casi:

- È già disponibile una sottoscrizione, una quota o un contratto
  aziendale Azure OpenAI
- Sono necessari la residenza regionale dei dati o i controlli di conformità forniti da Azure
- Si desidera mantenere il traffico all'interno di un tenant Azure esistente

### Configurazione

Per la generazione di immagini Azure tramite il provider `openai` incluso, indirizzare
`models.providers.openai.baseUrl` alla propria risorsa Azure e impostare `apiKey` sulla
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

OpenClaw riconosce questi suffissi host Azure per il percorso di generazione
di immagini Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Per le richieste di generazione di immagini su un host Azure riconosciuto, OpenClaw:

- Invia l'header `api-key` invece di `Authorization: Bearer`
- Utilizza percorsi specifici per la distribuzione (`/openai/deployments/{deployment}/...`)
- Aggiunge `?api-version=...` a ogni richiesta
- Utilizza un timeout predefinito di 600s per le richieste di generazione di immagini Azure.
  I valori `timeoutMs` per singola chiamata continuano a sostituire questo valore predefinito.

Gli altri URL di base (OpenAI pubblico, proxy compatibili con OpenAI) mantengono il formato
standard delle richieste di immagini OpenAI.

<Note>
L'instradamento Azure per il percorso di generazione di immagini del provider `openai` richiede
OpenClaw 2026.4.22 o versione successiva. Le versioni precedenti trattano qualsiasi
`openai.baseUrl` personalizzato come l'endpoint OpenAI pubblico e non funzionano con le distribuzioni di immagini
Azure.
</Note>

### Versione API

Impostare `AZURE_OPENAI_API_VERSION` per fissare una specifica versione di anteprima o GA di Azure
per il percorso di generazione di immagini Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Quando la variabile non è impostata, il valore predefinito è `2024-12-01-preview`.

### I nomi dei modelli sono nomi di distribuzione

Azure OpenAI associa i modelli alle distribuzioni. Per le richieste di generazione di immagini Azure
instradate tramite il provider `openai` incluso, il campo `model` in OpenClaw
deve essere il **nome della distribuzione Azure** configurato nel portale Azure, non
l'ID pubblico del modello OpenAI.

Se si crea una distribuzione denominata `gpt-image-2-prod` che serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Un poster pulito" size=1024x1024 count=1
```

La stessa regola relativa al nome della distribuzione si applica a qualsiasi chiamata di generazione di immagini instradata
tramite il provider `openai` incluso.

### Disponibilità regionale

La generazione di immagini Azure è attualmente disponibile solo in un sottoinsieme di regioni
(ad esempio `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consultare l'elenco aggiornato delle regioni di Microsoft prima di creare una
distribuzione e verificare che il modello specifico sia disponibile nella propria regione.

### Differenze nei parametri

Azure OpenAI e OpenAI pubblico non accettano sempre gli stessi parametri per le immagini.
Azure potrebbe rifiutare opzioni consentite da OpenAI pubblico (ad esempio determinati
valori `background` in `gpt-image-2`) o renderle disponibili solo per versioni specifiche
del modello. Queste differenze derivano da Azure e dal modello sottostante, non da
OpenClaw. Se una richiesta Azure non riesce a causa di un errore di convalida, verificare nel
portale Azure l'insieme di parametri supportato dalla distribuzione e dalla versione API
specifiche.

<Note>
Azure OpenAI utilizza il trasporto nativo e il comportamento di compatibilità, ma non riceve
gli header di attribuzione nascosti di OpenClaw: consultare il pannello **Percorsi nativi e compatibili
con OpenAI** in [Configurazione avanzata](#advanced-configuration).

Per il traffico di chat o Responses su Azure (oltre alla generazione di immagini), utilizzare il
flusso di onboarding o una configurazione dedicata del provider Azure; `openai.baseUrl` da solo
non adotta il formato API/autenticazione di Azure. Esiste un provider
`azure-openai-responses/*` separato; consultare il pannello Compaction
lato server di seguito.
</Note>

## Configurazione avanzata

Gli esempi `params` per modello riportati di seguito definiscono la richiesta del provider incorporato
di OpenClaw. La loro configurazione costituisce un comportamento di richiesta definito esplicitamente, quindi un percorso
`auto` altrimenti idoneo rimane su OpenClaw anziché selezionare implicitamente Codex. L'harness
app-server nativo di Codex gestisce il proprio trasporto e le proprie impostazioni di richiesta; un valore
`agentRuntime.id: "codex"` esplicito non riesce in modo sicuro quando il percorso effettivo non è dichiarato
compatibile con Codex.

<AccordionGroup>
  <Accordion title="Trasporto (WebSocket o SSE)">
    OpenClaw utilizza prima WebSocket con fallback a SSE (`"auto"`) per `openai/*`.

    In modalità `"auto"`, OpenClaw:
    - Riprova una volta dopo un errore WebSocket iniziale prima di passare a SSE
    - Dopo un errore, contrassegna WebSocket come degradato per 60 secondi e utilizza SSE
      durante il periodo di attesa
    - Allega header stabili di identità della sessione e del turno per i nuovi tentativi e le
      riconnessioni
    - Normalizza i contatori di utilizzo (`input_tokens` / `prompt_tokens`) tra le
      varianti di trasporto

    | Valore                | Comportamento                          |
    | ---------------------- | ------------------------------------ |
    | `"auto"` (predefinito)   | Prima WebSocket, fallback a SSE     |
    | `"sse"`              | Forza solo SSE                    |
    | `"websocket"`        | Forza solo WebSocket              |

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

  <Accordion title="Modalità rapida">
    OpenClaw espone un interruttore condiviso per la modalità rapida per `openai/*`:

    - **Chat/UI:** `/fast status|auto|on|off`
    - **Configurazione:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando è abilitata, OpenClaw associa la modalità rapida all'elaborazione prioritaria di OpenAI
    (`service_tier = "priority"`). I valori `service_tier` esistenti vengono
    conservati e la modalità rapida non riscrive `reasoning` né
    `text.verbosity`. `fastMode: "auto"` avvia rapidamente le nuove chiamate al modello fino alla
    soglia automatica, quindi avvia le successive chiamate di nuovo tentativo, fallback, risultato dello strumento o
    continuazione senza modalità rapida. La soglia predefinita è 60 secondi;
    impostare `params.fastAutoOnSeconds` sul modello attivo per modificarla.

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
    Le sostituzioni della sessione hanno la precedenza sulla configurazione. La rimozione della sostituzione della sessione
    nell'interfaccia Sessions riporta la sessione al valore predefinito configurato.
    </Note>

  </Accordion>

  <Accordion title="Elaborazione prioritaria (service_tier)">
    L'API di OpenAI espone l'elaborazione prioritaria tramite `service_tier`. Impostarla per
    modello in OpenClaw:

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
    `serviceTier` viene inoltrato solo agli endpoint OpenAI nativi
    (`api.openai.com`) e agli endpoint Codex nativi (`chatgpt.com/backend-api`).
    Se uno dei due provider viene instradato tramite un proxy, OpenClaw lascia
    `service_tier` invariato.
    </Warning>

  </Accordion>

  <Accordion title="Compaction lato server (API Responses)">
    Per i modelli Responses OpenAI diretti (`openai/*` in `api.openai.com`), il
    wrapper di flusso OpenClaw del Plugin OpenAI abilita automaticamente la Compaction
    lato server:

    - Forza `store: true` (a meno che la compatibilità del modello non imposti `supportsStore: false`)
    - Inserisce `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Valore predefinito di `compact_threshold`: 70% di `contextWindow` (oppure `80000` quando
      non disponibile)

    Ciò si applica al percorso di runtime integrato di OpenClaw e agli hook del provider OpenAI
    utilizzati dalle esecuzioni incorporate. L'harness app-server nativo di Codex gestisce
    il proprio contesto tramite Codex e non è interessato da questa impostazione.

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
    `responsesServerCompaction` controlla solo l'inserimento di `context_management`.
    I modelli Responses OpenAI diretti continuano a forzare `store: true`, a meno che la compatibilità
    non imposti `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modalità GPT agentica rigorosa">
    Per i modelli della famiglia GPT-5 del provider `openai` eseguiti tramite il runtime incorporato
    di OpenClaw, OpenClaw utilizza già per impostazione predefinita un contratto di esecuzione più rigoroso denominato
    `strict-agentic`. Si attiva automaticamente ogni volta che il provider risolto è
    `openai` e l'ID del modello corrisponde alla famiglia GPT-5, a meno che la configurazione
    non lo disabiliti esplicitamente:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    L'impostazione esplicita di `"strict-agentic"` non produce alcun effetto in un percorso supportato (è
    già il valore predefinito) ed è inerte per le coppie provider/modello non supportate.

    Con `strict-agentic` attivo, OpenClaw:
    - Abilita automaticamente `update_plan` per attività sostanziali
    - Riprova i turni strutturalmente vuoti o contenenti solo ragionamento con una continuazione
      che fornisce una risposta visibile
    - Utilizza eventi espliciti del piano dell'harness quando l'harness selezionato
      li fornisce

    OpenClaw non classifica il testo dell'assistente per decidere se un turno sia un
    piano, un aggiornamento sullo stato di avanzamento o una risposta finale.

    <Note>
    Questo contratto risiede interamente nell'esecutore dell'agente incorporato di OpenClaw. Non si
    applica all'harness nativo app-server di Codex, che gestisce autonomamente
    il comportamento dei turni e dei piani; per le esecuzioni native di Codex, la selezione dell'harness conta più
    dell'impostazione del contratto di esecuzione.
    </Note>

  </Accordion>

  <Accordion title="Percorsi nativi e compatibili con OpenAI">
    OpenClaw gestisce gli endpoint diretti OpenAI, Codex e Azure OpenAI
    in modo diverso dai proxy generici `/v1` compatibili con OpenAI:

    **Percorsi nativi** (`openai/*`, Azure OpenAI):
    - Mantiene `reasoning: { effort: "none" }` solo per i modelli che supportano il livello
      di `none` di OpenAI
    - Omette il ragionamento disabilitato per i modelli o i proxy che rifiutano
      `reasoning.effort: "none"`
    - Imposta per impostazione predefinita gli schemi degli strumenti in modalità rigorosa
    - Aggiunge intestazioni di attribuzione nascoste solo sugli host nativi verificati (Azure
      OpenAI non riceve queste intestazioni, sebbene sia un percorso nativo)
    - Mantiene la strutturazione delle richieste specifica di OpenAI (`service_tier`, `store`,
      compatibilità del ragionamento, suggerimenti per la cache dei prompt)

    **Percorsi proxy/compatibili:**
    - Utilizza un comportamento di compatibilità meno rigoroso
    - Rimuove `store` di Completions dai payload `openai-completions` non nativi
    - Accetta JSON pass-through avanzato `params.extra_body`/`params.extraBody`
      per i proxy Completions compatibili con OpenAI
    - Accetta `params.chat_template_kwargs` per i proxy Completions compatibili con OpenAI,
      come vLLM
    - Non impone schemi degli strumenti rigorosi né intestazioni riservate ai percorsi nativi

  </Accordion>
</AccordionGroup>

## Argomenti correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento per le immagini e selezione del provider.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento per i video e selezione del provider.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli sull'autenticazione e regole per il riutilizzo delle credenziali.
  </Card>
</CardGroup>
