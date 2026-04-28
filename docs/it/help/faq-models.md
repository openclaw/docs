---
read_when:
    - Scelta o cambio dei modelli, configurazione degli alias
    - Debug del failover del modello / "Tutti i modelli hanno fallito"
    - Comprendere i profili di autenticazione e come gestirli
sidebarTitle: Models FAQ
summary: 'FAQ: valori predefiniti del modello, selezione, alias, cambio, failover e profili di autenticazione'
title: 'FAQ: modelli e autenticazione'
x-i18n:
    generated_at: "2026-04-25T18:20:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: e060b48951b76d76a7f613b2abe3fdd845e34ae9eb5cbb36f45544f114edace7
    source_path: help/faq-models.md
    workflow: 15
---

  Domande e risposte su modelli e profili di autenticazione. Per configurazione, sessioni, Gateway, canali e
  risoluzione dei problemi, vedi la [FAQ](/it/help/faq) principale.

  ## Modelli: valori predefiniti, selezione, alias, cambio

  <AccordionGroup>
  <Accordion title="Che cos'è il &quot;modello predefinito&quot;?">
    Il modello predefinito di OpenClaw è quello che imposti in:

    ```
    agents.defaults.model.primary
    ```

    I modelli sono referenziati come `provider/model` (esempio: `openai/gpt-5.5` o `openai-codex/gpt-5.5`). Se ometti il provider, OpenClaw prova prima un alias, poi una corrispondenza univoca con un provider configurato per quell'esatto id modello, e solo dopo ripiega sul provider predefinito configurato come percorso di compatibilità deprecato. Se quel provider non espone più il modello predefinito configurato, OpenClaw ripiega sul primo provider/modello configurato invece di mostrare un predefinito obsoleto di un provider rimosso. Dovresti comunque impostare **esplicitamente** `provider/model`.

  </Accordion>

  <Accordion title="Quale modello consigliate?">
    **Valore predefinito consigliato:** usa il modello più potente e di ultima generazione disponibile nel tuo stack di provider.
    **Per agenti con Tools abilitati o input non attendibili:** privilegia la qualità del modello rispetto al costo.
    **Per chat di routine/a basso rischio:** usa modelli di fallback più economici e instrada in base al ruolo dell'agente.

    MiniMax ha una propria documentazione: [MiniMax](/it/providers/minimax) e
    [Modelli locali](/it/gateway/local-models).

    Regola pratica: usa il **miglior modello che puoi permetterti** per lavori ad alto rischio, e un modello più economico
    per chat di routine o riepiloghi. Puoi instradare i modelli per agente e usare sotto-agenti per
    parallelizzare attività lunghe (ogni sotto-agente consuma token). Vedi [Modelli](/it/concepts/models) e
    [Sotto-agenti](/it/tools/subagents).

    Avviso importante: i modelli più deboli o eccessivamente quantizzati sono più vulnerabili al prompt
    injection e a comportamenti non sicuri. Vedi [Sicurezza](/it/gateway/security).

    Maggior contesto: [Modelli](/it/concepts/models).

  </Accordion>

  <Accordion title="Come cambio modello senza cancellare la mia configurazione?">
    Usa i **comandi model** oppure modifica solo i campi **model**. Evita sostituzioni complete della configurazione.

    Opzioni sicure:

    - `/model` in chat (rapido, per sessione)
    - `openclaw models set ...` (aggiorna solo la configurazione del modello)
    - `openclaw configure --section model` (interattivo)
    - modifica `agents.defaults.model` in `~/.openclaw/openclaw.json`

    Evita `config.apply` con un oggetto parziale a meno che tu non voglia sostituire l'intera configurazione.
    Per le modifiche RPC, ispeziona prima con `config.schema.lookup` e preferisci `config.patch`.
    Il payload di lookup ti fornisce il percorso normalizzato, documentazione/vincoli superficiali dello schema e riepiloghi dei figli immediati.
    per aggiornamenti parziali.
    Se hai sovrascritto la configurazione, ripristina da backup oppure esegui di nuovo `openclaw doctor` per ripararla.

    Documentazione: [Modelli](/it/concepts/models), [Configure](/it/cli/configure), [Config](/it/cli/config), [Doctor](/it/gateway/doctor).

  </Accordion>

  <Accordion title="Posso usare modelli self-hosted (llama.cpp, vLLM, Ollama)?">
    Sì. Ollama è il percorso più semplice per i modelli locali.

    Configurazione più rapida:

    1. Installa Ollama da `https://ollama.com/download`
    2. Scarica un modello locale, ad esempio `ollama pull gemma4`
    3. Se vuoi anche modelli cloud, esegui `ollama signin`
    4. Esegui `openclaw onboard` e scegli `Ollama`
    5. Scegli `Local` oppure `Cloud + Local`

    Note:

    - `Cloud + Local` ti offre modelli cloud più i tuoi modelli Ollama locali
    - i modelli cloud come `kimi-k2.5:cloud` non richiedono un pull locale
    - per il cambio manuale, usa `openclaw models list` e `openclaw models set ollama/<model>`

    Nota sulla sicurezza: i modelli più piccoli o fortemente quantizzati sono più vulnerabili al prompt
    injection. Consigliamo fortemente **modelli grandi** per qualsiasi bot che possa usare Tools.
    Se vuoi comunque modelli piccoli, abilita il sandboxing e allowlist di Tools rigorose.

    Documentazione: [Ollama](/it/providers/ollama), [Modelli locali](/it/gateway/local-models),
    [Provider di modelli](/it/concepts/model-providers), [Sicurezza](/it/gateway/security),
    [Sandboxing](/it/gateway/sandboxing).

  </Accordion>

  <Accordion title="Quali modelli usano OpenClaw, Flawd e Krill?">
    - Queste distribuzioni possono differire e cambiare nel tempo; non esiste una raccomandazione fissa sul provider.
    - Controlla l'impostazione runtime corrente su ogni Gateway con `openclaw models status`.
    - Per agenti sensibili alla sicurezza/con Tools abilitati, usa il modello più potente e di ultima generazione disponibile.
  </Accordion>

  <Accordion title="Come cambio modello al volo (senza riavviare)?">
    Usa il comando `/model` come messaggio autonomo:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Questi sono gli alias integrati. Puoi aggiungere alias personalizzati tramite `agents.defaults.models`.

    Puoi elencare i modelli disponibili con `/model`, `/model list` o `/model status`.

    `/model` (e `/model list`) mostra un selettore compatto numerato. Seleziona per numero:

    ```
    /model 3
    ```

    Puoi anche forzare un profilo di autenticazione specifico per il provider (per sessione):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Suggerimento: `/model status` mostra quale agente è attivo, quale file `auth-profiles.json` viene usato e quale profilo di autenticazione verrà provato successivamente.
    Mostra anche l'endpoint del provider configurato (`baseUrl`) e la modalità API (`api`) quando disponibili.

    **Come rimuovo il pin di un profilo impostato con @profile?**

    Esegui di nuovo `/model` **senza** il suffisso `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Se vuoi tornare al valore predefinito, selezionalo da `/model` (oppure invia `/model <provider/model predefinito>`).
    Usa `/model status` per confermare quale profilo di autenticazione è attivo.

  </Accordion>

  <Accordion title="Posso usare GPT 5.5 per le attività quotidiane e Codex 5.5 per la programmazione?">
    Sì. Impostane uno come predefinito e cambia secondo necessità:

    - **Cambio rapido (per sessione):** `/model openai/gpt-5.5` per le attività correnti con chiave API diretta OpenAI oppure `/model openai-codex/gpt-5.5` per attività GPT-5.5 Codex OAuth.
    - **Predefinito:** imposta `agents.defaults.model.primary` su `openai/gpt-5.5` per l'uso con chiave API oppure `openai-codex/gpt-5.5` per l'uso GPT-5.5 Codex OAuth.
    - **Sotto-agenti:** instrada le attività di programmazione verso sotto-agenti con un modello predefinito diverso.

    Vedi [Modelli](/it/concepts/models) e [Slash commands](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Come configuro la modalità veloce per GPT 5.5?">
    Usa un toggle di sessione oppure un valore predefinito nella configurazione:

    - **Per sessione:** invia `/fast on` mentre la sessione usa `openai/gpt-5.5` o `openai-codex/gpt-5.5`.
    - **Valore predefinito per modello:** imposta `agents.defaults.models["openai/gpt-5.5"].params.fastMode` oppure `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` su `true`.

    Esempio:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Per OpenAI, la modalità veloce corrisponde a `service_tier = "priority"` nelle richieste native Responses supportate. L'opzione di sessione `/fast` ha la precedenza sui valori predefiniti di configurazione.

    Vedi [Thinking and fast mode](/it/tools/thinking) e [OpenAI fast mode](/it/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Perché vedo "Model ... is not allowed" e poi nessuna risposta?'>
    Se `agents.defaults.models` è impostato, diventa la **allowlist** per `/model` e per qualsiasi
    override di sessione. Scegliere un modello che non è in quell'elenco restituisce:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Questo errore viene restituito **al posto** di una risposta normale. Correzione: aggiungi il modello a
    `agents.defaults.models`, rimuovi la allowlist, oppure scegli un modello da `/model list`.

  </Accordion>

  <Accordion title='Perché vedo "Unknown model: minimax/MiniMax-M2.7"?'>
    Questo significa che il **provider non è configurato** (non è stata trovata alcuna configurazione provider MiniMax o alcun
    profilo di autenticazione), quindi il modello non può essere risolto.

    Lista di controllo per la correzione:

    1. Aggiorna a una release corrente di OpenClaw (oppure esegui dal source `main`), poi riavvia il Gateway.
    2. Assicurati che MiniMax sia configurato (wizard o JSON), oppure che esista autenticazione MiniMax
       in env/profili di autenticazione così che il provider corrispondente possa essere iniettato
       (`MINIMAX_API_KEY` per `minimax`, `MINIMAX_OAUTH_TOKEN` o MiniMax
       OAuth salvato per `minimax-portal`).
    3. Usa l'id modello esatto (case-sensitive) per il tuo percorso auth:
       `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed` per configurazioni con chiave API,
       oppure `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` per configurazioni OAuth.
    4. Esegui:

       ```bash
       openclaw models list
       ```

       e scegli dall'elenco (oppure `/model list` in chat).

    Vedi [MiniMax](/it/providers/minimax) e [Modelli](/it/concepts/models).

  </Accordion>

  <Accordion title="Posso usare MiniMax come predefinito e OpenAI per attività complesse?">
    Sì. Usa **MiniMax come predefinito** e cambia modello **per sessione** quando serve.
    I fallback servono per gli **errori**, non per le "attività difficili", quindi usa `/model` o un agente separato.

    **Opzione A: cambio per sessione**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Poi:

    ```
    /model gpt
    ```

    **Opzione B: agenti separati**

    - Agente A predefinito: MiniMax
    - Agente B predefinito: OpenAI
    - Instrada per agente oppure usa `/agent` per cambiare

    Documentazione: [Modelli](/it/concepts/models), [Instradamento multi-agente](/it/concepts/multi-agent), [MiniMax](/it/providers/minimax), [OpenAI](/it/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt sono scorciatoie integrate?">
    Sì. OpenClaw include alcune abbreviazioni predefinite (applicate solo quando il modello esiste in `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` per configurazioni con chiave API, oppure `openai-codex/gpt-5.5` quando configurato per Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Se imposti un tuo alias con lo stesso nome, prevale il tuo valore.

  </Accordion>

  <Accordion title="Come definisco/sovrascrivo le scorciatoie del modello (alias)?">
    Gli alias provengono da `agents.defaults.models.<modelId>.alias`. Esempio:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Poi `/model sonnet` (oppure `/<alias>` quando supportato) viene risolto in quell'id modello.

  </Accordion>

  <Accordion title="Come aggiungo modelli da altri provider come OpenRouter o Z.AI?">
    OpenRouter (pay-per-token; molti modelli):

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
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Se fai riferimento a un `provider/model` ma manca la chiave richiesta del provider, otterrai un errore di autenticazione a runtime (ad esempio `No API key found for provider "zai"`).

    **Nessuna chiave API trovata per il provider dopo aver aggiunto un nuovo agente**

    Questo di solito significa che il **nuovo agente** ha un archivio auth vuoto. L'autenticazione è per agente ed è
    memorizzata in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opzioni per risolvere:

    - Esegui `openclaw agents add <id>` e configura l'autenticazione durante il wizard.
    - Oppure copia `auth-profiles.json` dalla `agentDir` dell'agente principale nella `agentDir` del nuovo agente.

    Non riutilizzare `agentDir` tra agenti; causa collisioni di autenticazione/sessione.

  </Accordion>
</AccordionGroup>

## Failover del modello e "Tutti i modelli hanno fallito"

<AccordionGroup>
  <Accordion title="Come funziona il failover?">
    Il failover avviene in due fasi:

    1. **Rotazione del profilo di autenticazione** all'interno dello stesso provider.
    2. **Fallback del modello** al modello successivo in `agents.defaults.model.fallbacks`.

    Ai profili che falliscono vengono applicati cooldown (exponential backoff), così OpenClaw può continuare a rispondere anche quando un provider è soggetto a rate limit o temporaneamente non funziona.

    Il bucket del rate limit include più delle semplici risposte `429`. OpenClaw
    tratta come rate limit meritevoli di failover anche messaggi come `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` e limiti periodici
    della finestra di utilizzo (`weekly/monthly limit reached`).

    Alcune risposte che sembrano di fatturazione non sono `402`, e anche alcune risposte HTTP `402`
    restano in quel bucket transitorio. Se un provider restituisce
    testo esplicito di fatturazione su `401` o `403`, OpenClaw può comunque mantenerlo
    nel percorso billing, ma i matcher di testo specifici del provider restano limitati al
    provider che li possiede (per esempio OpenRouter `Key limit exceeded`). Se invece un messaggio `402`
    assomiglia a un limite della finestra di utilizzo ritentabile o a un
    limite di spesa di organizzazione/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw lo tratta come
    `rate_limit`, non come una lunga disabilitazione per fatturazione.

    Gli errori di overflow del contesto sono diversi: firme come
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` o `ollama error: context length
    exceeded` restano nel percorso di Compaction/retry invece di avanzare al
    fallback del modello.

    Il testo generico degli errori server è intenzionalmente più ristretto di "qualsiasi cosa che
    contenga unknown/error". OpenClaw tratta invece forme transitorie limitate al provider
    come Anthropic bare `An unknown error occurred`, OpenRouter bare
    `Provider returned error`, errori di stop-reason come `Unhandled stop reason:
    error`, payload JSON `api_error` con testo di server transitorio
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) ed errori di provider occupato come `ModelNotReadyException` come
    segnali di timeout/sovraccarico meritevoli di failover quando il contesto del provider
    corrisponde.
    Il testo di fallback interno generico come `LLM request failed with an unknown
    error.` resta prudente e non attiva da solo il fallback del modello.

  </Accordion>

  <Accordion title='Che cosa significa "No credentials found for profile anthropic:default"?'>
    Significa che il sistema ha tentato di usare l'ID del profilo di autenticazione `anthropic:default`, ma non è riuscito a trovare credenziali per esso nell'archivio auth previsto.

    **Checklist di risoluzione:**

    - **Conferma dove si trovano i profili di autenticazione** (percorsi nuovi vs legacy)
      - Attuale: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (migrato da `openclaw doctor`)
    - **Conferma che la tua variabile env sia caricata dal Gateway**
      - Se imposti `ANTHROPIC_API_KEY` nella tua shell ma esegui il Gateway tramite systemd/launchd, potrebbe non ereditarla. Inseriscila in `~/.openclaw/.env` oppure abilita `env.shellEnv`.
    - **Assicurati di modificare l'agente corretto**
      - Le configurazioni multi-agente implicano che possano esistere più file `auth-profiles.json`.
    - **Controlla lo stato di modello/auth**
      - Usa `openclaw models status` per vedere i modelli configurati e se i provider sono autenticati.

    **Checklist di risoluzione per "No credentials found for profile anthropic"**

    Questo significa che l'esecuzione è bloccata su un profilo di autenticazione Anthropic, ma il Gateway
    non riesce a trovarlo nel proprio archivio auth.

    - **Usa Claude CLI**
      - Esegui `openclaw models auth login --provider anthropic --method cli --set-default` sull'host Gateway.
    - **Se invece vuoi usare una chiave API**
      - Inserisci `ANTHROPIC_API_KEY` in `~/.openclaw/.env` sull'**host Gateway**.
      - Cancella qualsiasi ordine fissato che forza un profilo mancante:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Conferma di eseguire i comandi sull'host Gateway**
      - In modalità remota, i profili di autenticazione risiedono sulla macchina Gateway, non sul tuo laptop.

  </Accordion>

  <Accordion title="Perché ha provato anche Google Gemini e ha fallito?">
    Se la configurazione del tuo modello include Google Gemini come fallback (oppure hai cambiato verso una scorciatoia Gemini), OpenClaw lo proverà durante il fallback del modello. Se non hai configurato le credenziali Google, vedrai `No API key found for provider "google"`.

    Correzione: fornisci l'autenticazione Google, oppure rimuovi/evita i modelli Google in `agents.defaults.model.fallbacks` / alias in modo che il fallback non venga instradato lì.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Causa: la cronologia della sessione contiene **blocchi thinking senza firme** (spesso da
    uno stream interrotto/parziale). Google Antigravity richiede firme per i blocchi thinking.

    Correzione: OpenClaw ora rimuove i blocchi thinking senza firma per Google Antigravity Claude. Se compare ancora, avvia una **nuova sessione** oppure imposta `/thinking off` per quell'agente.

  </Accordion>
</AccordionGroup>

## Profili di autenticazione: cosa sono e come gestirli

Correlato: [/concepts/oauth](/it/concepts/oauth) (flussi OAuth, archiviazione dei token, modelli multi-account)

<AccordionGroup>
  <Accordion title="Che cos'è un profilo di autenticazione?">
    Un profilo di autenticazione è un record di credenziali con nome (OAuth o chiave API) associato a un provider. I profili si trovano in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Quali sono gli ID profilo tipici?">
    OpenClaw usa ID con prefisso del provider come:

    - `anthropic:default` (comune quando non esiste un'identità email)
    - `anthropic:<email>` per identità OAuth
    - ID personalizzati che scegli tu (ad esempio `anthropic:work`)

  </Accordion>

  <Accordion title="Posso controllare quale profilo di autenticazione viene provato per primo?">
    Sì. La configurazione supporta metadati facoltativi per i profili e un ordinamento per provider (`auth.order.<provider>`). Questo **non** memorizza segreti; mappa gli ID a provider/modalità e imposta l'ordine di rotazione.

    OpenClaw può saltare temporaneamente un profilo se si trova in un breve **cooldown** (rate limit/timeout/errori auth) o in uno stato **disabled** più lungo (fatturazione/crediti insufficienti). Per ispezionarlo, esegui `openclaw models status --json` e controlla `auth.unusableProfiles`. Regolazione: `auth.cooldowns.billingBackoffHours*`.

    I cooldown dei rate limit possono essere limitati al modello. Un profilo in cooldown
    per un modello può essere ancora utilizzabile per un modello fratello sullo stesso provider,
    mentre le finestre billing/disabled continuano a bloccare l'intero profilo.

    Puoi anche impostare un override dell'ordine **per agente** (memorizzato nell'`auth-state.json` di quell'agente) tramite CLI:

    ```bash
    # Usa l'agente predefinito configurato (ometti --agent)
    openclaw models auth order get --provider anthropic

    # Blocca la rotazione su un singolo profilo (prova solo questo)
    openclaw models auth order set --provider anthropic anthropic:default

    # Oppure imposta un ordine esplicito (fallback all'interno del provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Cancella l'override (torna a config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Per puntare a un agente specifico:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Per verificare cosa verrà effettivamente provato, usa:

    ```bash
    openclaw models status --probe
    ```

    Se un profilo memorizzato è omesso dall'ordine esplicito, probe segnala
    `excluded_by_auth_order` per quel profilo invece di provarlo in silenzio.

  </Accordion>

  <Accordion title="OAuth vs chiave API - qual è la differenza?">
    OpenClaw supporta entrambi:

    - **OAuth** spesso sfrutta l'accesso in abbonamento (dove applicabile).
    - **Le chiavi API** usano la fatturazione pay-per-token.

    Il wizard supporta esplicitamente Anthropic Claude CLI, OpenAI Codex OAuth e chiavi API.

  </Accordion>
</AccordionGroup>

## Correlati

- [FAQ](/it/help/faq) — la FAQ principale
- [FAQ — avvio rapido e configurazione della prima esecuzione](/it/help/faq-first-run)
- [Selezione del modello](/it/concepts/model-providers)
- [Failover del modello](/it/concepts/model-failover)
