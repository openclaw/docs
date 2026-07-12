---
read_when:
    - Scelta o cambio dei modelli, configurazione degli alias
    - Debug del failover del modello / "Tutti i modelli non hanno funzionato"
    - Comprendere i profili di autenticazione e come gestirli
sidebarTitle: Models FAQ
summary: 'FAQ: impostazioni predefinite dei modelli, selezione, alias, cambio, failover e profili di autenticazione'
title: 'Domande frequenti: modelli e autenticazione'
x-i18n:
    generated_at: "2026-07-12T07:06:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 071e89c01120849179d3bc372153eb2c76a0fa4e93846df42920f0d961d597df
    source_path: help/faq-models.md
    workflow: 16
---

  Domande e risposte su modelli e profili di autenticazione. Per configurazione, sessioni, Gateway, canali e
  risoluzione dei problemi, consulta le [domande frequenti principali](/it/help/faq).

  ## Modelli: impostazioni predefinite, selezione, alias e cambio

  <AccordionGroup>
  <Accordion title='Che cos'è il "modello predefinito"?'>
    Si imposta con:

    ```text
    agents.defaults.model.primary
    ```

    I modelli sono riferimenti `provider/model` (esempio: `openai/gpt-5.5`,
    `anthropic/claude-sonnet-4-6`). Imposta sempre `provider/model` in modo esplicito. Se
    ometti il provider, OpenClaw tenta prima una corrispondenza con un alias, poi una
    corrispondenza univoca tra i provider configurati per quell'ID modello, quindi
    utilizza il provider predefinito configurato (percorso di compatibilità
    deprecato). Se quel provider non dispone più del modello predefinito configurato,
    OpenClaw utilizza il primo provider/modello configurato invece di un'impostazione
    predefinita obsoleta.

  </Accordion>

  <Accordion title="Quale modello consigliate?">
    Usa il modello più potente e di ultima generazione offerto dal tuo insieme di
    provider, soprattutto per gli agenti che utilizzano strumenti o ricevono input
    non attendibili: i modelli meno potenti o eccessivamente quantizzati sono più
    vulnerabili alla prompt injection e a comportamenti non sicuri (consulta
    [Sicurezza](/it/gateway/security)). Assegna i modelli più economici alle
    conversazioni ordinarie o a basso rischio in base al ruolo dell'agente.

    Assegna i modelli per agente e usa sotto-agenti per parallelizzare le attività
    lunghe (ogni sotto-agente consuma i propri token). Consulta
    [Modelli](/it/concepts/models), [Sotto-agenti](/it/tools/subagents),
    [MiniMax](/it/providers/minimax) e [Modelli locali](/it/gateway/local-models).

  </Accordion>

  <Accordion title="Come posso cambiare modello senza cancellare la configurazione?">
    Modifica soltanto i campi del modello, evitando di sostituire l'intera
    configurazione.

    - `/model` nella chat (per sessione; consulta [Comandi slash](/it/tools/slash-commands))
    - `openclaw models set ...` (aggiorna soltanto la configurazione del modello)
    - `openclaw configure --section model` (interattivo)
    - modifica direttamente `agents.defaults.model` in `~/.openclaw/openclaw.json`

    Per le modifiche tramite RPC, esamina prima con `config.schema.lookup` (percorso
    normalizzato, documentazione sintetica dello schema e riepiloghi degli elementi
    figli), quindi preferisci `config.patch` a `config.apply` con un oggetto parziale.
    Se hai sovrascritto la configurazione, ripristinala dal backup oppure esegui
    `openclaw doctor` per correggerla.

    Documentazione: [Modelli](/it/concepts/models), [Configurazione](/it/cli/configure),
    [Configurazione](/it/cli/config), [Doctor](/it/gateway/doctor).

  </Accordion>

  <Accordion title="Posso usare modelli in hosting autonomo (llama.cpp, vLLM, Ollama)?">
    Sì: Ollama è il percorso più semplice. Configurazione rapida:

    1. Installa Ollama da `https://ollama.com/download`
    2. Scarica un modello locale, ad esempio `ollama pull gemma4`
    3. Per usare anche i modelli cloud, esegui `ollama signin`
    4. Esegui `openclaw onboard`, scegli `Ollama`, quindi `Local` o `Cloud + Local`

    `Cloud + Local` offre i modelli cloud insieme ai tuoi modelli Ollama locali;
    i modelli cloud come `kimi-k2.5:cloud` non richiedono alcun download locale. Per
    cambiare modello manualmente: `openclaw models list`, quindi
    `openclaw models set ollama/<model>`.

    I modelli più piccoli o fortemente quantizzati sono più vulnerabili alla prompt
    injection. Usa modelli di grandi dimensioni per qualsiasi bot che abbia accesso
    agli strumenti; se usi comunque modelli piccoli, abilita il sandboxing ed elenchi
    rigorosi degli strumenti consentiti.

    Documentazione: [Ollama](/it/providers/ollama),
    [Modelli locali](/it/gateway/local-models),
    [Provider di modelli](/it/concepts/model-providers),
    [Sicurezza](/it/gateway/security), [Sandboxing](/it/gateway/sandboxing).

  </Accordion>

  <Accordion title="Come posso cambiare modello al volo (senza riavviare)?">
    Invia `/model <name>` come messaggio autonomo. Consulta
    [Comandi slash](/it/tools/slash-commands) per l'elenco completo dei comandi,
    incluso il selettore numerato (`/model`, `/model list`, `/model 3`),
    `/model default` per rimuovere una sostituzione specifica della sessione e
    `/model status` per i dettagli sull'endpoint e sulla modalità API.

    Forza uno specifico profilo di autenticazione per sessione con `@profile`:

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Per rimuovere il vincolo a un profilo impostato con `@profile`, esegui nuovamente
    `/model` senza il suffisso (ad esempio `/model anthropic/claude-opus-4-6`) oppure
    scegli il valore predefinito da `/model`. Usa `/model status` per confermare il
    profilo di autenticazione attivo.

  </Accordion>

  <Accordion title="Se due provider espongono lo stesso ID modello, quale viene usato da /model?">
    `/model provider/model` seleziona esattamente il percorso di quel provider. Ad
    esempio, `qianfan/deepseek-v4-flash` e `deepseek/deepseek-v4-flash` sono
    riferimenti diversi anche se l'ID modello coincide: OpenClaw non cambia
    silenziosamente provider in base alla corrispondenza del solo ID.

    Un riferimento `/model` selezionato dall'utente applica regole rigorose per il
    fallback: se quel provider/modello diventa indisponibile, la risposta non riesce
    in modo visibile invece di utilizzare `agents.defaults.model.fallbacks`. Le
    catene di fallback configurate continuano ad applicarsi alle impostazioni
    predefinite configurate, ai modelli primari dei processi Cron e allo stato di
    fallback selezionato automaticamente. Quando un'esecuzione senza sostituzione
    specifica della sessione può utilizzare il fallback, OpenClaw tenta prima il
    provider/modello richiesto, poi i fallback configurati e infine il modello
    primario configurato; in questo modo gli ID modello semplici duplicati non
    ritornano direttamente al provider predefinito.

    Consulta [Modelli](/it/concepts/models) e
    [Failover dei modelli](/it/concepts/model-failover).

  </Accordion>

  <Accordion title="Posso usare GPT 5.5 per le attività quotidiane e Codex 5.5 per la programmazione?">
    Sì: la scelta del modello e quella del runtime sono separate:

    - **Agente di programmazione Codex nativo:** imposta
      `agents.defaults.model.primary` su `openai/gpt-5.5`. Accedi con
      `openclaw models auth login --provider openai` per l'autenticazione tramite
      abbonamento ChatGPT/Codex.
    - **Attività dirette dell'API OpenAI esterne al ciclo dell'agente:** configura
      `OPENAI_API_KEY` per immagini, embedding, sintesi vocale, comunicazioni in
      tempo reale e altre funzionalità dell'API OpenAI non relative agli agenti.
    - **Autenticazione dell'agente OpenAI tramite chiave API:**
      `/model openai/gpt-5.5` con un profilo di chiavi API `openai` ordinato.
    - **Sotto-agenti:** assegna le attività di programmazione a un agente incentrato
      su Codex con il proprio modello `openai/gpt-5.5`.

    Consulta [Modelli](/it/concepts/models) e
    [Comandi slash](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Come configuro la modalità rapida per GPT 5.5?">
    - **Per sessione:** invia `/fast on` mentre usi `openai/gpt-5.5`.
    - **Impostazione predefinita per modello:** imposta
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` su `true`.
    - **Limite automatico:** `/fast auto` o `params.fastMode: "auto"` esegue
      rapidamente le nuove chiamate al modello fino al limite, quindi esegue senza
      modalità rapida i successivi tentativi, fallback, chiamate con risultati degli
      strumenti o continuazioni. Il limite predefinito è 60 secondi; puoi
      sovrascriverlo con `params.fastAutoOnSeconds` sul modello.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    La modalità rapida corrisponde a `service_tier = "priority"` nelle richieste
    native OpenAI Responses; i valori `service_tier` esistenti vengono mantenuti e
    la modalità rapida non modifica `reasoning` o `text.verbosity`. Le sostituzioni
    `/fast` della sessione hanno la precedenza sulle impostazioni predefinite della
    configurazione.

    Consulta [Ragionamento e modalità rapida](/it/tools/thinking) e la sezione sulla
    modalità rapida nella configurazione avanzata della pagina del provider
    [OpenAI](/it/providers/openai).

  </Accordion>

  <Accordion title='Perché vedo "Model ... is not allowed" e poi non ricevo alcuna risposta?'>
    Se `agents.defaults.models` è impostato, diventa l'**elenco consentito** per
    `/model` e per le sostituzioni specifiche della sessione. Selezionare un modello
    esterno a tale elenco restituisce quanto segue invece di una risposta normale:

    ```text
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Soluzione: aggiungi il modello esatto ad `agents.defaults.models`, aggiungi un
    carattere jolly del provider come `"provider/*": {}` per i cataloghi dinamici,
    rimuovi l'elenco consentito oppure scegli un modello da `/model list`. Se il
    comando includeva anche `--runtime codex`, aggiorna prima l'elenco consentito,
    quindi ripeti lo stesso comando `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Perché vedo "Unknown model: minimax/MiniMax-M3"?'>
    Se usi una versione precedente di OpenClaw, esegui prima l'aggiornamento (oppure
    avvia dal sorgente `main`) e riavvia il Gateway: `MiniMax-M3` potrebbe non essere
    ancora presente nel catalogo della versione installata. In caso contrario, il
    provider MiniMax non è configurato (non è stata trovata alcuna voce del provider
    né alcun profilo di autenticazione), quindi il modello non può essere risolto.
    Consulta la sezione sulla risoluzione dei problemi nella pagina del provider
    [MiniMax](/it/providers/minimax) per l'elenco completo delle verifiche, la tabella
    degli ID provider/modello e un esempio di blocco di configurazione.

  </Accordion>

  <Accordion title="Posso usare MiniMax come modello predefinito e OpenAI per le attività complesse?">
    Sì. Usa MiniMax come modello predefinito e cambia modello per sessione: i
    fallback servono per gli errori, non per le "attività difficili", quindi usa
    `/model` o un agente separato.

    **Opzione A: cambio per sessione**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Quindi esegui `/model gpt`.

    **Opzione B: agenti separati** — L'agente A usa MiniMax come impostazione
    predefinita, mentre l'agente B usa OpenAI; instrada in base all'agente oppure usa
    `/agent` per cambiare.

    Documentazione: [Modelli](/it/concepts/models),
    [Instradamento multi-agente](/it/concepts/multi-agent),
    [MiniMax](/it/providers/minimax), [OpenAI](/it/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt sono scorciatoie integrate?">
    Sì: sono abbreviazioni integrate, applicate soltanto quando il modello di
    destinazione esiste in `agents.defaults.models`:

    | Alias | Viene risolto in |
    | --- | --- |
    | `opus` | `anthropic/claude-opus-4-8` |
    | `sonnet` | `anthropic/claude-sonnet-4-6` |
    | `gpt` | `openai/gpt-5.4` |
    | `gpt-mini` | `openai/gpt-5.4-mini` |
    | `gpt-nano` | `openai/gpt-5.4-nano` |
    | `gemini` | `google/gemini-3.1-pro-preview` |
    | `gemini-flash` | `google/gemini-3-flash-preview` |
    | `gemini-flash-lite` | `google/gemini-3.1-flash-lite` |

    Un tuo alias con lo stesso nome sostituisce quello integrato.

  </Accordion>

  <Accordion title="Come definisco o sostituisco le scorciatoie dei modelli (alias)?">
    Gli alias si trovano in `agents.defaults.models.<modelId>.alias`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
          },
        },
      },
    }
    ```

    A questo punto `/model sonnet` (oppure `/<alias>`, quando supportato) viene
    risolto nell'ID di quel modello.

  </Accordion>

  <Accordion title="Come aggiungo modelli di altri provider, come OpenRouter o Z.AI?">
    OpenRouter (pagamento per token; molti modelli):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (modelli GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5.1" },
          models: { "zai/glm-5.1": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    L'assenza della chiave di un provider per un provider/modello referenziato
    genera un errore di autenticazione in fase di esecuzione (ad esempio
    `No API key found for provider "zai"`).

    **Nessuna chiave API trovata per il provider dopo l'aggiunta di un nuovo agente**

    Un nuovo agente dispone di un archivio di autenticazione vuoto:
    l'autenticazione è specifica per agente ed è archiviata in:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Correzione: esegui `openclaw agents add <id>` e configura l'autenticazione nella procedura guidata, oppure
    copia dall'archivio dell'agente principale solo i profili statici portabili
    `api_key`/`token`. Per OAuth, accedi dal nuovo agente quando necessita di un
    proprio account. Consulta [Instradamento multi-agente](/it/concepts/multi-agent) per
    le regole complete sul riutilizzo di `agentDir` e sulla condivisione delle credenziali:
    non riutilizzare mai `agentDir` tra agenti.

  </Accordion>
</AccordionGroup>

## Failover dei modelli e "Tutti i modelli non hanno funzionato"

<AccordionGroup>
  <Accordion title="Come funziona il failover?">
    Due fasi:

    1. **Rotazione dei profili di autenticazione** all'interno dello stesso provider.
    2. **Fallback del modello** al modello successivo in `agents.defaults.model.fallbacks`.

    Ai profili che non funzionano vengono applicati periodi di attesa (backoff esponenziale),
    così OpenClaw continua a rispondere quando un provider applica limiti di frequenza
    o presenta problemi temporanei.

    La categoria dei limiti di frequenza include più del semplice `429`: `Too many concurrent
    requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai
    ... quota limit exceeded`, `resource exhausted` e i limiti periodici
    delle finestre di utilizzo (`weekly/monthly limit reached`) sono tutti considerati
    limiti di frequenza che giustificano il failover.

    Le risposte relative alla fatturazione non sono sempre `402` e alcuni `402` rimangono
    nella categoria transitoria/dei limiti di frequenza anziché in quella della fatturazione.
    Un testo esplicito relativo alla fatturazione in un `401`/`403` può comunque essere
    instradato alla categoria della fatturazione; i criteri testuali specifici del provider
    (ad esempio `Key limit exceeded` di OpenRouter) restano limitati al rispettivo provider.
    Un `402` che sembra indicare una finestra di utilizzo ritentabile o un limite di spesa
    dell'organizzazione/area di lavoro (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) viene trattato come `rate_limit`, non come
    una disabilitazione prolungata per motivi di fatturazione.

    Gli errori di superamento del contesto restano completamente esclusi dal percorso di
    fallback: firme come `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`, `input is
    too long for the model` o `ollama error: context length exceeded` vengono indirizzate
    alla Compaction e a un nuovo tentativo, anziché passare al modello di fallback successivo.

    Il testo generico degli errori del server è interpretato in modo più restrittivo rispetto
    a "qualsiasi cosa contenga unknown/error". Le forme transitorie specifiche del provider
    che vengono considerate segnali di failover includono: il semplice `An unknown error occurred`
    di Anthropic, il semplice `Provider returned error` di OpenRouter, errori relativi al motivo
    di arresto come `Unhandled stop reason: error`, payload JSON `api_error` con testo transitorio
    del server (`internal server error`, `unknown error, 520`, `upstream error`, `backend error`)
    ed errori di provider occupato come `ModelNotReadyException` quando il contesto del provider
    corrisponde. Il testo generico di fallback interno come `LLM request failed
    with an unknown error.` viene gestito in modo prudente e, da solo, non attiva il fallback.

  </Accordion>

  <Accordion title='Cosa significa "No credentials found for profile anthropic:default"?'>
    L'ID del profilo di autenticazione `anthropic:default` non contiene credenziali
    nell'archivio di autenticazione previsto.

    **Elenco di controllo per la correzione:**

    - Verifica dove si trovano i profili: percorso attuale:
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`; percorso precedente:
      `~/.openclaw/agent/*` (migrato da `openclaw doctor`).
    - Verifica che il Gateway carichi la variabile di ambiente. `ANTHROPIC_API_KEY`
      impostata solo nella shell non raggiungerà un Gateway eseguito tramite systemd/launchd:
      inseriscila in `~/.openclaw/.env` oppure abilita `env.shellEnv`.
    - Verifica di modificare l'agente corretto: le configurazioni multi-agente contengono
      più file `auth-profiles.json`.
    - Esegui `openclaw models status` per visualizzare i modelli configurati e lo stato
      dell'autenticazione del provider.

    **Per "No credentials found for profile anthropic" (senza suffisso e-mail):**

    L'esecuzione è vincolata a un profilo Anthropic che il Gateway non riesce a trovare.

    - Usa la CLI di Claude: esegui `openclaw models auth login --provider anthropic
      --method cli --set-default` sull'host del Gateway.
    - In alternativa, preferisci una chiave API: inserisci `ANTHROPIC_API_KEY` in
      `~/.openclaw/.env` sull'host del Gateway, quindi rimuovi qualsiasi ordine vincolato
      che imponga il profilo mancante:

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - Modalità remota: i profili di autenticazione si trovano sulla macchina del Gateway,
      non sul portatile; verifica di eseguire lì i comandi.

  </Accordion>

  <Accordion title="Perché ha provato anche Google Gemini senza riuscirci?">
    Se la configurazione dei modelli include Google Gemini come fallback (oppure hai
    selezionato una forma abbreviata di Gemini), OpenClaw lo prova durante il fallback.
    Se non sono configurate credenziali Google, viene restituito `No API key found for provider
    "google"`. Correzione: aggiungi l'autenticazione Google oppure rimuovi i modelli Google
    da `agents.defaults.model.fallbacks`/dagli alias.

    **Richiesta LLM rifiutata: firma di ragionamento obbligatoria (Google Antigravity)**

    Causa: la cronologia della sessione contiene blocchi di ragionamento privi di firma
    (spesso provenienti da uno stream interrotto o parziale); Google Antigravity richiede
    firme nei blocchi di ragionamento. OpenClaw rimuove i blocchi di ragionamento non firmati
    per Google Antigravity Claude; se il problema persiste, avvia una nuova sessione oppure
    imposta `/thinking off` per quell'agente.

  </Accordion>
</AccordionGroup>

## Profili di autenticazione: cosa sono e come gestirli

Correlato: [/concepts/oauth](/it/concepts/oauth) (flussi OAuth, archiviazione dei token, modelli con più account)

<AccordionGroup>
  <Accordion title="Che cos'è un profilo di autenticazione?">
    Un record di credenziali denominato (OAuth o chiave API) associato a un provider,
    archiviato in:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Esamina i profili salvati senza mostrare i segreti: `openclaw models auth
    list` (facoltativamente `--provider <id>` o `--json`). Consulta
    [CLI dei modelli](/it/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="Quali sono gli ID tipici dei profili?">
    Con prefisso del provider: `anthropic:default` (comune quando non esiste
    un'identità e-mail), `anthropic:<email>` per le identità OAuth oppure un ID
    personalizzato scelto dall'utente (ad esempio `anthropic:work`).

  </Accordion>

  <Accordion title="Posso controllare quale profilo di autenticazione viene provato per primo?">
    Sì. La configurazione `auth.order.<provider>` imposta l'ordine di rotazione per ogni
    provider (solo metadati, senza memorizzare segreti).

    OpenClaw può ignorare un profilo durante un breve **periodo di attesa** (limiti di frequenza,
    timeout, errori di autenticazione) o durante uno stato **disabilitato** più lungo
    (fatturazione/crediti insufficienti). Verifica con `openclaw models status
    --json` e controlla `auth.unusableProfiles`. Regola il comportamento con
    `auth.cooldowns.billingBackoffHours*`. I periodi di attesa dovuti ai limiti di frequenza
    possono essere specifici per modello: un profilo in attesa per un modello può comunque
    servire un modello correlato dello stesso provider; le finestre di fatturazione/disabilitazione
    bloccano l'intero profilo.

    Imposta un ordine alternativo per agente (memorizzato nel file `auth-state.json` dell'agente):

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic

    # Target a specific agent
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Verifica cosa verrà effettivamente provato: `openclaw models status --probe`. Un
    profilo memorizzato omesso da un ordine esplicito viene segnalato come
    `excluded_by_auth_order` anziché essere provato senza indicazioni.

  </Accordion>

  <Accordion title="OAuth e chiave API: qual è la differenza?">
    - **Accesso OAuth / CLI** utilizza spesso l'accesso in abbonamento quando il
      provider lo supporta. Per Anthropic, il backend CLI di Claude di OpenClaw
      utilizza `claude -p` di Claude Code, che Anthropic attualmente considera
      un utilizzo tramite Agent SDK/programmatico che attinge dai limiti di utilizzo
      dell'abbonamento. Consulta [Anthropic](/it/providers/anthropic) per lo stato attuale
      della sospensione della fatturazione e i collegamenti alle fonti.
    - **Le chiavi API** utilizzano la fatturazione per token.

    La procedura guidata supporta la CLI di Anthropic Claude, OAuth di OpenAI Codex
    e le chiavi API.

  </Accordion>
</AccordionGroup>

## Contenuti correlati

- [Domande frequenti](/it/help/faq) — le domande frequenti principali
- [Domande frequenti — avvio rapido e configurazione della prima esecuzione](/it/help/faq-first-run)
- [Selezione del modello](/it/concepts/model-providers)
- [Failover dei modelli](/it/concepts/model-failover)
