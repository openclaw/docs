---
read_when:
    - Scegliere o cambiare modelli, configurare alias
    - Debug del failover dei modelli / "Tutti i modelli non sono riusciti"
    - Comprendere i profili di autenticazione e come gestirli
sidebarTitle: Models FAQ
summary: 'FAQ: impostazioni predefinite dei modelli, selezione, alias, cambio, failover e profili di autenticazione'
title: 'FAQ: modelli e autenticazione'
x-i18n:
    generated_at: "2026-05-05T01:47:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e60abcd6aa99121200de0e45cc3efa6334e668cbe6a4b590610c53d17e03a54
    source_path: help/faq-models.md
    workflow: 16
---

  Domande e risposte su modelli e profili di autenticazione. Per configurazione, sessioni, Gateway, canali e
  risoluzione dei problemi, consulta le [FAQ](/it/help/faq) principali.

  ## Modelli: predefiniti, selezione, alias, cambio

  <AccordionGroup>
  <Accordion title='Che cos’è il "modello predefinito"?'>
    Il modello predefinito di OpenClaw è quello che imposti come:

    ```
    agents.defaults.model.primary
    ```

    I modelli sono indicati come `provider/model` (esempio: `openai/gpt-5.5` o `openai-codex/gpt-5.5`). Se ometti il provider, OpenClaw prova prima un alias, poi una corrispondenza univoca del provider configurato per quell’esatto ID modello, e solo dopo ricade sul provider predefinito configurato come percorso di compatibilità deprecato. Se quel provider non espone più il modello predefinito configurato, OpenClaw ricade sul primo provider/modello configurato invece di mostrare un valore predefinito obsoleto di un provider rimosso. Dovresti comunque impostare **esplicitamente** `provider/model`.

  </Accordion>

  <Accordion title="Quale modello consigliate?">
    **Predefinito consigliato:** usa il modello di ultima generazione più potente disponibile nel tuo stack di provider.
    **Per agenti con strumenti abilitati o input non attendibili:** dai priorità alla potenza del modello rispetto al costo.
    **Per chat di routine/a basso rischio:** usa modelli di fallback più economici e instrada in base al ruolo dell’agente.

    MiniMax ha la propria documentazione: [MiniMax](/it/providers/minimax) e
    [modelli locali](/it/gateway/local-models).

    Regola pratica: usa il **miglior modello che puoi permetterti** per lavori ad alto rischio, e un modello più economico
    per chat di routine o riassunti. Puoi instradare i modelli per agente e usare sotto-agenti per
    parallelizzare attività lunghe (ogni sotto-agente consuma token). Vedi [Modelli](/it/concepts/models) e
    [Sotto-agenti](/it/tools/subagents).

    Avviso importante: i modelli più deboli o eccessivamente quantizzati sono più vulnerabili alla prompt
    injection e a comportamenti non sicuri. Vedi [Sicurezza](/it/gateway/security).

    Altro contesto: [Modelli](/it/concepts/models).

  </Accordion>

  <Accordion title="Come cambio modello senza cancellare la mia configurazione?">
    Usa i **comandi del modello** o modifica solo i campi **model**. Evita sostituzioni complete della configurazione.

    Opzioni sicure:

    - `/model` in chat (rapido, per sessione)
    - `openclaw models set ...` (aggiorna solo la configurazione del modello)
    - `openclaw configure --section model` (interattivo)
    - modifica `agents.defaults.model` in `~/.openclaw/openclaw.json`

    Evita `config.apply` con un oggetto parziale, a meno che tu non intenda sostituire l’intera configurazione.
    Per modifiche RPC, ispeziona prima con `config.schema.lookup` e preferisci `config.patch`. Il payload di lookup fornisce il percorso normalizzato, documentazione/vincoli di schema superficiali e riepiloghi immediati dei figli.
    per aggiornamenti parziali.
    Se hai sovrascritto la configurazione, ripristina da backup o riesegui `openclaw doctor` per riparare.

    Documentazione: [Modelli](/it/concepts/models), [Configura](/it/cli/configure), [Config](/it/cli/config), [Doctor](/it/gateway/doctor).

  </Accordion>

  <Accordion title="Posso usare modelli self-hosted (llama.cpp, vLLM, Ollama)?">
    Sì. Ollama è il percorso più semplice per i modelli locali.

    Configurazione più rapida:

    1. Installa Ollama da `https://ollama.com/download`
    2. Scarica un modello locale come `ollama pull gemma4`
    3. Se vuoi anche modelli cloud, esegui `ollama signin`
    4. Esegui `openclaw onboard` e scegli `Ollama`
    5. Scegli `Local` o `Cloud + Local`

    Note:

    - `Cloud + Local` ti dà i modelli cloud più i tuoi modelli Ollama locali
    - i modelli cloud come `kimi-k2.5:cloud` non richiedono un download locale
    - per il cambio manuale, usa `openclaw models list` e `openclaw models set ollama/<model>`

    Nota di sicurezza: i modelli più piccoli o fortemente quantizzati sono più vulnerabili alla prompt
    injection. Consigliamo vivamente **modelli grandi** per qualsiasi bot che possa usare strumenti.
    Se vuoi comunque usare modelli piccoli, abilita sandboxing e allowlist rigorose per gli strumenti.

    Documentazione: [Ollama](/it/providers/ollama), [Modelli locali](/it/gateway/local-models),
    [Provider di modelli](/it/concepts/model-providers), [Sicurezza](/it/gateway/security),
    [Sandboxing](/it/gateway/sandboxing).

  </Accordion>

  <Accordion title="Quali modelli usano OpenClaw, Flawd e Krill?">
    - Questi deployment possono differire e cambiare nel tempo; non esiste una raccomandazione fissa sul provider.
    - Controlla l’impostazione runtime corrente su ciascun Gateway con `openclaw models status`.
    - Per agenti sensibili alla sicurezza/con strumenti abilitati, usa il modello di ultima generazione più potente disponibile.

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

    Questi sono gli alias integrati. Alias personalizzati possono essere aggiunti tramite `agents.defaults.models`.

    Puoi elencare i modelli disponibili con `/model`, `/model list` o `/model status`.

    `/model` (e `/model list`) mostra un selettore compatto e numerato. Seleziona per numero:

    ```
    /model 3
    ```

    Puoi anche forzare uno specifico profilo di autenticazione per il provider (per sessione):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Suggerimento: `/model status` mostra quale agente è attivo, quale file `auth-profiles.json` viene usato e quale profilo di autenticazione verrà provato dopo.
    Mostra anche l’endpoint del provider configurato (`baseUrl`) e la modalità API (`api`) quando disponibili.

    **Come rimuovo il pin a un profilo impostato con @profile?**

    Riesegui `/model` **senza** il suffisso `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Se vuoi tornare al predefinito, sceglilo da `/model` (oppure invia `/model <default provider/model>`).
    Usa `/model status` per confermare quale profilo di autenticazione è attivo.

  </Accordion>

  <Accordion title="Posso usare GPT 5.5 per attività quotidiane e Codex 5.5 per programmare?">
    Sì. Tratta la scelta del modello e la scelta del runtime separatamente:

    - **Agente di coding Codex nativo:** imposta `agents.defaults.model.primary` su `openai/gpt-5.5` e `agents.defaults.agentRuntime.id` su `"codex"`. Accedi con `openclaw models auth login --provider openai-codex` quando vuoi l’autenticazione dell’abbonamento ChatGPT/Codex.
    - **Attività API OpenAI dirette tramite PI:** usa `/model openai/gpt-5.5` senza override del runtime Codex e configura `OPENAI_API_KEY`.
    - **OAuth Codex tramite PI:** usa `/model openai-codex/gpt-5.5` solo quando vuoi intenzionalmente il normale runner PI con OAuth Codex.
    - **Sotto-agenti:** instrada le attività di coding a un agente solo Codex con il proprio modello e il proprio valore predefinito `agentRuntime`.

    Vedi [Modelli](/it/concepts/models) e [Comandi slash](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Come configuro la modalità veloce per GPT 5.5?">
    Usa un toggle di sessione o un valore predefinito di configurazione:

    - **Per sessione:** invia `/fast on` mentre la sessione usa `openai/gpt-5.5` o `openai-codex/gpt-5.5`.
    - **Predefinito per modello:** imposta `agents.defaults.models["openai/gpt-5.5"].params.fastMode` o `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` su `true`.

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

    Per OpenAI, la modalità veloce corrisponde a `service_tier = "priority"` nelle richieste Responses native supportate. Gli override `/fast` di sessione hanno precedenza sui valori predefiniti di configurazione.

    Vedi [Thinking e modalità veloce](/it/tools/thinking) e [modalità veloce OpenAI](/it/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Perché vedo "Model ... is not allowed" e poi nessuna risposta?'>
    Se `agents.defaults.models` è impostato, diventa la **allowlist** per `/model` e qualsiasi
    override di sessione. Scegliere un modello che non è in quell’elenco restituisce:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Quell’errore viene restituito **invece di** una risposta normale. Soluzione: aggiungi il modello a
    `agents.defaults.models`, rimuovi la allowlist oppure scegli un modello da `/model list`.
    Se il comando includeva anche `--runtime codex`, aggiungi prima il modello e poi riprova
    lo stesso comando `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Perché vedo "Unknown model: minimax/MiniMax-M2.7"?'>
    Questo significa che il **provider non è configurato** (non è stata trovata alcuna configurazione provider MiniMax né alcun profilo di autenticazione), quindi il modello non può essere risolto.

    Checklist per risolvere:

    1. Aggiorna a una release OpenClaw corrente (oppure esegui dal sorgente `main`), poi riavvia il Gateway.
    2. Assicurati che MiniMax sia configurato (wizard o JSON), oppure che l’autenticazione MiniMax
       esista nelle variabili env/profili di autenticazione così che il provider corrispondente possa essere iniettato
       (`MINIMAX_API_KEY` per `minimax`, `MINIMAX_OAUTH_TOKEN` o OAuth MiniMax memorizzato
       per `minimax-portal`).
    3. Usa l’ID modello esatto (sensibile a maiuscole/minuscole) per il tuo percorso di autenticazione:
       `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed` per configurazione
       con chiave API, oppure `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` per configurazione OAuth.
    4. Esegui:

       ```bash
       openclaw models list
       ```

       e scegli dall’elenco (o `/model list` in chat).

    Vedi [MiniMax](/it/providers/minimax) e [Modelli](/it/concepts/models).

  </Accordion>

  <Accordion title="Posso usare MiniMax come predefinito e OpenAI per attività complesse?">
    Sì. Usa **MiniMax come predefinito** e cambia modello **per sessione** quando serve.
    I fallback servono per **errori**, non per "attività difficili", quindi usa `/model` o un agente separato.

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
    - Instrada per agente o usa `/agent` per cambiare

    Documentazione: [Modelli](/it/concepts/models), [Instradamento multi-agente](/it/concepts/multi-agent), [MiniMax](/it/providers/minimax), [OpenAI](/it/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt sono scorciatoie integrate?">
    Sì. OpenClaw include alcune abbreviazioni predefinite (applicate solo quando il modello esiste in `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` per configurazioni con chiave API, oppure `openai-codex/gpt-5.5` quando configurato per OAuth Codex
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Se imposti un tuo alias con lo stesso nome, il tuo valore ha la precedenza.

  </Accordion>

  <Accordion title="Come definisco/sovrascrivo le scorciatoie dei modelli (alias)?">
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

    Poi `/model sonnet` (o `/<alias>` quando supportato) si risolve in quell’ID modello.

  </Accordion>

  <Accordion title="Come aggiungo modelli da altri provider come OpenRouter o Z.AI?">
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
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Se fai riferimento a un provider/modello ma manca la chiave provider richiesta, riceverai un errore di autenticazione a runtime (ad es. `No API key found for provider "zai"`).

    **Nessuna chiave API trovata per il provider dopo l'aggiunta di un nuovo agent**

    Di solito significa che il **nuovo agent** ha un archivio di autenticazione vuoto. L'autenticazione è per agent e
    viene archiviata in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opzioni di correzione:

    - Esegui `openclaw agents add <id>` e configura l'autenticazione durante la procedura guidata.
    - Oppure copia solo i profili statici portabili `api_key` / `token` dall'archivio di autenticazione dell'agent principale all'archivio di autenticazione del nuovo agent.
    - Per i profili OAuth, accedi dal nuovo agent quando ha bisogno del proprio account; altrimenti OpenClaw può leggere dall'agent predefinito/principale senza clonare i refresh token.

    **Non** riutilizzare `agentDir` tra agent; causa collisioni di autenticazione/sessione.

  </Accordion>
</AccordionGroup>

## Failover dei modelli e "Tutti i modelli hanno fallito"

<AccordionGroup>
  <Accordion title="Come funziona il failover?">
    Il failover avviene in due fasi:

    1. **Rotazione dei profili di autenticazione** all'interno dello stesso provider.
    2. **Fallback del modello** al modello successivo in `agents.defaults.model.fallbacks`.

    I cooldown si applicano ai profili in errore (backoff esponenziale), quindi OpenClaw può continuare a rispondere anche quando un provider è soggetto a rate limit o a un errore temporaneo.

    Il bucket dei rate limit include più delle semplici risposte `429`. OpenClaw
    considera anche messaggi come `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` e i limiti periodici
    della finestra di utilizzo (`weekly/monthly limit reached`) come rate limit
    idonei al failover.

    Alcune risposte che sembrano legate alla fatturazione non sono `402` e alcune risposte HTTP `402`
    restano anch'esse in quel bucket transitorio. Se un provider restituisce
    testo esplicito di fatturazione su `401` o `403`, OpenClaw può comunque mantenerlo
    nella corsia della fatturazione, ma i matcher di testo specifici del provider restano limitati al
    provider che li possiede (per esempio OpenRouter `Key limit exceeded`). Se invece un messaggio `402`
    sembra un limite riprovabile della finestra di utilizzo o
    un limite di spesa di organizzazione/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw lo tratta come
    `rate_limit`, non come una disabilitazione prolungata per fatturazione.

    Gli errori di overflow del contesto sono diversi: firme come
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` o `ollama error: context length
    exceeded` restano nel percorso di Compaction/riprova invece di avanzare al
    fallback del modello.

    Il testo generico degli errori server è intenzionalmente più ristretto di "qualunque cosa con
    unknown/error al suo interno". OpenClaw tratta forme transitorie circoscritte al provider
    come `An unknown error occurred` nudo di Anthropic, `Provider returned error` nudo
    di OpenRouter, errori di stop reason come `Unhandled stop reason:
    error`, payload JSON `api_error` con testo server transitorio
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) ed errori di provider occupato come `ModelNotReadyException` come
    segnali di timeout/sovraccarico idonei al failover quando il contesto del provider
    corrisponde.
    Il testo generico di fallback interno come `LLM request failed with an unknown
    error.` resta conservativo e non attiva da solo il fallback del modello.

  </Accordion>

  <Accordion title='Che cosa significa "No credentials found for profile anthropic:default"?'>
    Significa che il sistema ha tentato di usare l'ID profilo di autenticazione `anthropic:default`, ma non è riuscito a trovare credenziali per esso nell'archivio di autenticazione previsto.

    **Checklist di correzione:**

    - **Conferma dove si trovano i profili di autenticazione** (percorsi nuovi rispetto a legacy)
      - Attuale: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (migrato da `openclaw doctor`)
    - **Conferma che la variabile d'ambiente sia caricata dal Gateway**
      - Se imposti `ANTHROPIC_API_KEY` nella shell ma esegui il Gateway tramite systemd/launchd, potrebbe non ereditarla. Inseriscila in `~/.openclaw/.env` oppure abilita `env.shellEnv`.
    - **Assicurati di modificare l'agent corretto**
      - Le configurazioni multi-agent implicano che possano esistere più file `auth-profiles.json`.
    - **Controllo di base dello stato modello/autenticazione**
      - Usa `openclaw models status` per vedere i modelli configurati e se i provider sono autenticati.

    **Checklist di correzione per "No credentials found for profile anthropic"**

    Significa che l'esecuzione è vincolata a un profilo di autenticazione Anthropic, ma il Gateway
    non riesce a trovarlo nel proprio archivio di autenticazione.

    - **Usa Claude CLI**
      - Esegui `openclaw models auth login --provider anthropic --method cli --set-default` sull'host del gateway.
    - **Se invece vuoi usare una chiave API**
      - Inserisci `ANTHROPIC_API_KEY` in `~/.openclaw/.env` sull'**host del gateway**.
      - Cancella qualsiasi ordine vincolato che forza un profilo mancante:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Conferma di eseguire i comandi sull'host del gateway**
      - In modalità remota, i profili di autenticazione risiedono sulla macchina gateway, non sul tuo laptop.

  </Accordion>

  <Accordion title="Perché ha provato anche Google Gemini ed è fallito?">
    Se la configurazione del modello include Google Gemini come fallback (o sei passato a una scorciatoia Gemini), OpenClaw lo proverà durante il fallback del modello. Se non hai configurato le credenziali Google, vedrai `No API key found for provider "google"`.

    Correzione: fornisci l'autenticazione Google oppure rimuovi/evita i modelli Google in `agents.defaults.model.fallbacks` / alias, così il fallback non instrada lì.

    **Richiesta LLM rifiutata: firma di thinking richiesta (Google Antigravity)**

    Causa: la cronologia della sessione contiene **blocchi di thinking senza firme** (spesso da
    uno stream interrotto/parziale). Google Antigravity richiede firme per i blocchi di thinking.

    Correzione: OpenClaw ora rimuove i blocchi di thinking non firmati per Google Antigravity Claude. Se il problema compare ancora, avvia una **nuova sessione** oppure imposta `/thinking off` per quell'agente.

  </Accordion>
</AccordionGroup>

## Profili di autenticazione: cosa sono e come gestirli

Correlato: [/concepts/oauth](/it/concepts/oauth) (flussi OAuth, archiviazione dei token, pattern multi-account)

<AccordionGroup>
  <Accordion title="What is an auth profile?">
    Un profilo di autenticazione è un record di credenziali con nome (OAuth o chiave API) associato a un provider. I profili si trovano in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Per ispezionare i profili salvati senza mostrare segreti, esegui `openclaw models auth list` (facoltativamente `--provider <id>` o `--json`). Consulta [CLI dei modelli](/it/cli/models#openclaw-models-auth-list) per i dettagli.

  </Accordion>

  <Accordion title="What are typical profile IDs?">
    OpenClaw usa ID con prefisso del provider come:

    - `anthropic:default` (comune quando non esiste un'identità email)
    - `anthropic:<email>` per identità OAuth
    - ID personalizzati che scegli tu (ad es. `anthropic:work`)

  </Accordion>

  <Accordion title="Can I control which auth profile is tried first?">
    Sì. La configurazione supporta metadati facoltativi per i profili e un ordinamento per provider (`auth.order.<provider>`). Questo **non** archivia segreti; mappa gli ID a provider/modalità e imposta l'ordine di rotazione.

    OpenClaw può saltare temporaneamente un profilo se si trova in un breve **cooldown** (limiti di frequenza/timeout/errori di autenticazione) o in uno stato **disabilitato** più lungo (fatturazione/crediti insufficienti). Per ispezionarlo, esegui `openclaw models status --json` e controlla `auth.unusableProfiles`. Regolazione: `auth.cooldowns.billingBackoffHours*`.

    I cooldown per limiti di frequenza possono essere limitati al modello. Un profilo in cooldown
    per un modello può comunque essere utilizzabile per un modello fratello sullo stesso provider,
    mentre le finestre di fatturazione/disabilitazione continuano a bloccare l'intero profilo.

    Puoi anche impostare una sovrascrittura dell'ordine **per agente** (archiviata nell'`auth-state.json` di quell'agente) tramite la CLI:

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Per indirizzare un agente specifico:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Per verificare cosa verrà effettivamente provato, usa:

    ```bash
    openclaw models status --probe
    ```

    Se un profilo archiviato viene omesso dall'ordine esplicito, la probe segnala
    `excluded_by_auth_order` per quel profilo invece di provarlo silenziosamente.

  </Accordion>

  <Accordion title="OAuth vs API key - what is the difference?">
    OpenClaw supporta entrambi:

    - **OAuth** spesso sfrutta l'accesso in abbonamento (dove applicabile).
    - Le **chiavi API** usano la fatturazione pay-per-token.

    La procedura guidata supporta esplicitamente Anthropic Claude CLI, OpenAI Codex OAuth e le chiavi API.

  </Accordion>
</AccordionGroup>

## Correlati

- [FAQ](/it/help/faq) — le FAQ principali
- [FAQ — avvio rapido e configurazione al primo avvio](/it/help/faq-first-run)
- [Selezione del modello](/it/concepts/model-providers)
- [Failover dei modelli](/it/concepts/model-failover)
