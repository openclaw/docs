---
read_when:
    - Scegliere o cambiare modello, configurare alias
    - Debug del failover dei modelli / "Tutti i modelli non sono riusciti"
    - Comprendere i profili di autenticazione e come gestirli
sidebarTitle: Models FAQ
summary: 'FAQ: valori predefiniti dei modelli, selezione, alias, cambio, failover e profili di autenticazione'
title: 'FAQ: modelli e autenticazione'
x-i18n:
    generated_at: "2026-06-27T17:37:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 048e031bb52d10572527d790fda3b63a0d74d08799e48128ea64c4c16ab1f423
    source_path: help/faq-models.md
    workflow: 16
---

  Domande e risposte su modelli e profili di autenticazione. Per configurazione, sessioni, Gateway, canali e
  risoluzione dei problemi, consulta le [FAQ](/it/help/faq) principali.

  ## Modelli: valori predefiniti, selezione, alias, cambio

  <AccordionGroup>
  <Accordion title='Che cos’è il "modello predefinito"?'>
    Il modello predefinito di OpenClaw è quello che imposti come:

    ```
    agents.defaults.model.primary
    ```

    I modelli sono indicati come `provider/model` (esempio: `openai/gpt-5.5` o `anthropic/claude-sonnet-4-6`). Se ometti il provider, OpenClaw prova prima un alias, poi una corrispondenza univoca con un provider configurato per quell’esatto ID modello, e solo dopo ripiega sul provider predefinito configurato come percorso di compatibilità deprecato. Se quel provider non espone più il modello predefinito configurato, OpenClaw ripiega sul primo provider/modello configurato invece di mostrare un vecchio valore predefinito di un provider rimosso. Dovresti comunque impostare **esplicitamente** `provider/model`.

  </Accordion>

  <Accordion title="Quale modello consigliate?">
    **Predefinito consigliato:** usa il modello di ultima generazione più potente disponibile nel tuo stack di provider.
    **Per agenti con strumenti abilitati o input non attendibile:** dai priorità alla potenza del modello rispetto al costo.
    **Per chat di routine/a basso rischio:** usa modelli di fallback più economici e instrada in base al ruolo dell’agente.

    MiniMax ha la propria documentazione: [MiniMax](/it/providers/minimax) e
    [Modelli locali](/it/gateway/local-models).

    Regola pratica: usa il **miglior modello che puoi permetterti** per lavori ad alto rischio e un modello
    più economico per chat o riepiloghi di routine. Puoi instradare i modelli per agente e usare sub-agenti per
    parallelizzare attività lunghe (ogni sub-agente consuma token). Vedi [Modelli](/it/concepts/models) e
    [Sub-agenti](/it/tools/subagents).

    Avviso importante: i modelli più deboli o sovra-quantizzati sono più vulnerabili a prompt
    injection e comportamenti non sicuri. Vedi [Sicurezza](/it/gateway/security).

    Maggiori dettagli: [Modelli](/it/concepts/models).

  </Accordion>

  <Accordion title="Come posso cambiare modello senza cancellare la mia configurazione?">
    Usa i **comandi modello** oppure modifica solo i campi **model**. Evita sostituzioni complete della configurazione.

    Opzioni sicure:

    - `/model` in chat (rapido, per sessione)
    - `openclaw models set ...` (aggiorna solo la configurazione del modello)
    - `openclaw configure --section model` (interattivo)
    - modifica `agents.defaults.model` in `~/.openclaw/openclaw.json`

    Evita `config.apply` con un oggetto parziale a meno che tu non intenda sostituire l’intera configurazione.
    Per modifiche RPC, ispeziona prima con `config.schema.lookup` e preferisci `config.patch`. Il payload di lookup ti fornisce il percorso normalizzato, documentazione/vincoli superficiali dello schema e riepiloghi immediati dei figli.
    per aggiornamenti parziali.
    Se hai sovrascritto la configurazione, ripristina da backup o riesegui `openclaw doctor` per ripararla.

    Documentazione: [Modelli](/it/concepts/models), [Configura](/it/cli/configure), [Configurazione](/it/cli/config), [Doctor](/it/gateway/doctor).

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

    - `Cloud + Local` ti offre modelli cloud più i tuoi modelli Ollama locali
    - i modelli cloud come `kimi-k2.5:cloud` non richiedono un download locale
    - per il cambio manuale, usa `openclaw models list` e `openclaw models set ollama/<model>`

    Nota sulla sicurezza: i modelli più piccoli o fortemente quantizzati sono più vulnerabili a prompt
    injection. Consigliamo vivamente **modelli grandi** per qualsiasi bot che possa usare strumenti.
    Se vuoi comunque modelli piccoli, abilita sandboxing e allowlist rigorose per gli strumenti.

    Documentazione: [Ollama](/it/providers/ollama), [Modelli locali](/it/gateway/local-models),
    [Provider di modelli](/it/concepts/model-providers), [Sicurezza](/it/gateway/security),
    [Sandboxing](/it/gateway/sandboxing).

  </Accordion>

  <Accordion title="Quali modelli usano OpenClaw, Flawd e Krill?">
    - Questi deployment possono differire e cambiare nel tempo; non esiste una raccomandazione fissa per il provider.
    - Controlla l’impostazione di runtime corrente su ciascun Gateway con `openclaw models status`.
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

    Questi sono gli alias integrati. Gli alias personalizzati possono essere aggiunti tramite `agents.defaults.models`.

    Puoi elencare i modelli disponibili con `/model`, `/model list` o `/model status`.

    `/model` (e `/model list`) mostra un selettore compatto e numerato. Seleziona per numero:

    ```
    /model 3
    ```

    Puoi anche forzare un profilo di autenticazione specifico per il provider (per sessione):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Suggerimento: `/model status` mostra quale agente è attivo, quale file `auth-profiles.json` viene usato e quale profilo di autenticazione verrà provato successivamente.
    Mostra anche l’endpoint del provider configurato (`baseUrl`) e la modalità API (`api`) quando disponibili.

    **Come posso sbloccare un profilo impostato con @profile?**

    Riesegui `/model` **senza** il suffisso `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Se vuoi tornare al valore predefinito, selezionalo da `/model` (oppure invia `/model <default provider/model>`).
    Usa `/model status` per confermare quale profilo di autenticazione è attivo.

  </Accordion>

  <Accordion title="Se due provider espongono lo stesso ID modello, quale usa /model?">
    `/model provider/model` seleziona quell’esatta route del provider per la sessione.

    Per esempio, `qianfan/deepseek-v4-flash` e `deepseek/deepseek-v4-flash` sono riferimenti modello diversi anche se entrambi contengono `deepseek-v4-flash`. OpenClaw non dovrebbe passare silenziosamente da un provider all’altro solo perché l’ID modello nudo corrisponde.

    Un riferimento `/model` selezionato dall’utente è rigoroso anche per la policy di fallback. Se quel provider/modello selezionato non è disponibile, la risposta fallisce in modo visibile invece di rispondere da `agents.defaults.model.fallbacks`. Le catene di fallback configurate si applicano comunque ai valori predefiniti configurati, ai primari dei job Cron e allo stato di fallback selezionato automaticamente.

    Se un’esecuzione avviata da un override non di sessione può usare il fallback, OpenClaw prova prima il provider/modello richiesto, poi i fallback configurati e solo dopo il primario configurato. Questo impedisce agli ID modello nudi duplicati di tornare direttamente al provider predefinito.

    Vedi [Modelli](/it/concepts/models) e [Failover dei modelli](/it/concepts/model-failover).

  </Accordion>

  <Accordion title="Posso usare GPT 5.5 per le attività quotidiane e Codex 5.5 per programmare?">
    Sì. Tratta la scelta del modello e la scelta del runtime separatamente:

    - **Agente di coding Codex nativo:** imposta `agents.defaults.model.primary` su `openai/gpt-5.5`. Accedi con `openclaw models auth login --provider openai` quando vuoi usare l’autenticazione tramite abbonamento ChatGPT/Codex.
    - **Attività API OpenAI dirette fuori dal loop dell’agente:** configura `OPENAI_API_KEY` per immagini, embedding, voce, realtime e altre superfici API OpenAI non agentiche.
    - **Autenticazione con chiave API per agente OpenAI:** usa `/model openai/gpt-5.5` con un profilo chiave API `openai` ordinato.
    - **Sub-agenti:** instrada le attività di coding a un agente focalizzato su Codex con il proprio modello `openai/gpt-5.5`.

    Vedi [Modelli](/it/concepts/models) e [Comandi slash](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Come configuro la modalità rapida per GPT 5.5?">
    Usa un toggle di sessione oppure un valore predefinito di configurazione:

    - **Per sessione:** invia `/fast on` mentre la sessione usa `openai/gpt-5.5`.
    - **Predefinito per modello:** imposta `agents.defaults.models["openai/gpt-5.5"].params.fastMode` su `true`.
    - **Soglia automatica:** usa `/fast auto` o `params.fastMode: "auto"` per avviare rapidamente le nuove chiamate al modello fino alla soglia automatica, poi avviare le successive chiamate di retry, fallback, risultato strumento o continuazione senza modalità rapida. La soglia predefinita è 60 secondi; imposta `params.fastAutoOnSeconds` sul modello attivo per modificarla.

    Esempio:

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

    Per OpenAI, la modalità rapida mappa a `service_tier = "priority"` nelle richieste Responses native supportate. Gli override `/fast` di sessione prevalgono sui valori predefiniti di configurazione. I turni dell’app-server Codex possono ricevere il tier solo all’inizio del turno, quindi `auto` si applica al turno modello successivo avviato da OpenClaw invece che dentro un turno app-server già in esecuzione.

    Vedi [Pensiero e modalità rapida](/it/tools/thinking) e [Modalità rapida OpenAI](/it/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Perché vedo "Model ... is not allowed" e poi nessuna risposta?'>
    Se `agents.defaults.models` è impostato, diventa la **allowlist** per `/model` e qualsiasi
    override di sessione. Scegliere un modello che non è in quell’elenco restituisce:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Quell’errore viene restituito **al posto di** una risposta normale. Correzione: aggiungi il modello esatto a
    `agents.defaults.models`, aggiungi un wildcard del provider come `"provider/*": {}` per cataloghi provider dinamici, rimuovi la allowlist oppure scegli un modello da `/model list`.
    Se il comando includeva anche `--runtime codex`, aggiorna prima la allowlist e poi riprova
    lo stesso comando `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Perché vedo "Unknown model: minimax/MiniMax-M3"?'>
    Questo significa che il **provider non è configurato** (non è stata trovata alcuna configurazione del provider MiniMax o alcun
    profilo di autenticazione), quindi il modello non può essere risolto.

    Checklist di correzione:

    1. Aggiorna a una release OpenClaw corrente (oppure esegui dal sorgente `main`), poi riavvia il Gateway.
    2. Assicurati che MiniMax sia configurato (wizard o JSON), oppure che l’autenticazione MiniMax
       esista in env/profili di autenticazione così che il provider corrispondente possa essere iniettato
       (`MINIMAX_API_KEY` per `minimax`, `MINIMAX_OAUTH_TOKEN` o OAuth MiniMax memorizzato
       per `minimax-portal`).
    3. Usa l’ID modello esatto (con distinzione tra maiuscole e minuscole) per il tuo percorso di autenticazione:
       `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` o
       `minimax/MiniMax-M2.7-highspeed` per la configurazione con chiave API, oppure
       `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` o
       `minimax-portal/MiniMax-M2.7-highspeed` per la configurazione OAuth.
    4. Esegui:

       ```bash
       openclaw models list
       ```

       e scegli dall’elenco (oppure `/model list` in chat).

    Vedi [MiniMax](/it/providers/minimax) e [Modelli](/it/concepts/models).

  </Accordion>

  <Accordion title="Posso usare MiniMax come predefinito e OpenAI per attività complesse?">
    Sì. Usa **MiniMax come predefinito** e cambia modello **per sessione** quando serve.
    I fallback servono per gli **errori**, non per "attività difficili", quindi usa `/model` o un agente separato.

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

    Quindi:

    ```
    /model gpt
    ```

    **Opzione B: agenti separati**

    - Agente A predefinito: MiniMax
    - Agente B predefinito: OpenAI
    - Instrada per agente o usa `/agent` per cambiare

    Documenti: [Modelli](/it/concepts/models), [Routing multi-agente](/it/concepts/multi-agent), [MiniMax](/it/providers/minimax), [OpenAI](/it/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt sono scorciatoie integrate?">
    Sì. OpenClaw include alcune abbreviazioni predefinite (applicate solo quando il modello esiste in `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-8`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite`

    Se imposti un alias con lo stesso nome, prevale il tuo valore.

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
          },
        },
      },
    }
    ```

    Quindi `/model sonnet` (o `/<alias>` quando supportato) si risolve in quell'ID modello.

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

    **Nessuna chiave API trovata per il provider dopo l'aggiunta di un nuovo agente**

    Di solito significa che il **nuovo agente** ha un archivio di autenticazione vuoto. L'autenticazione è per agente ed è
    archiviata in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opzioni di correzione:

    - Esegui `openclaw agents add <id>` e configura l'autenticazione durante la procedura guidata.
    - Oppure copia solo i profili statici portabili `api_key` / `token` dall'archivio di autenticazione dell'agente principale all'archivio di autenticazione del nuovo agente.
    - Per i profili OAuth, accedi dal nuovo agente quando deve usare il proprio account; altrimenti OpenClaw può leggere dal percorso dell'agente predefinito/principale senza clonare i refresh token.

    **Non** riutilizzare `agentDir` tra agenti; causa collisioni di autenticazione/sessione.

  </Accordion>
</AccordionGroup>

## Failover dei modelli e "All models failed"

<AccordionGroup>
  <Accordion title="Come funziona il failover?">
    Il failover avviene in due fasi:

    1. **Rotazione dei profili di autenticazione** all'interno dello stesso provider.
    2. **Fallback del modello** al modello successivo in `agents.defaults.model.fallbacks`.

    I cooldown si applicano ai profili in errore (backoff esponenziale), quindi OpenClaw può continuare a rispondere anche quando un provider è soggetto a limiti di frequenza o presenta errori temporanei.

    Il bucket dei limiti di frequenza include più delle semplici risposte `429`. OpenClaw
    tratta anche messaggi come `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` e i limiti periodici
    della finestra di utilizzo (`weekly/monthly limit reached`) come limiti di frequenza
    idonei al failover.

    Alcune risposte che sembrano di fatturazione non sono `402`, e anche alcune risposte HTTP `402`
    rimangono in quel bucket transitorio. Se un provider restituisce
    testo esplicito di fatturazione su `401` o `403`, OpenClaw può comunque mantenerlo nella
    corsia di fatturazione, ma i matcher testuali specifici del provider restano limitati al
    provider che li possiede (ad esempio OpenRouter `Key limit exceeded`). Se invece un messaggio `402`
    sembra un limite riprovabile della finestra di utilizzo o
    un limite di spesa dell'organizzazione/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw lo tratta come
    `rate_limit`, non come una disattivazione lunga per fatturazione.

    Gli errori di overflow del contesto sono diversi: firme come
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` o `ollama error: context length
    exceeded` restano nel percorso di Compaction/riprova invece di far avanzare il
    fallback del modello.

    Il testo generico degli errori server è intenzionalmente più ristretto di "qualsiasi cosa con
    unknown/error al suo interno". OpenClaw tratta come segnali
    di timeout/sovraccarico idonei al failover forme transitorie circoscritte al provider
    come l'Anthropic semplice `An unknown error occurred`, l'OpenRouter semplice
    `Provider returned error`, errori di motivo di arresto come `Unhandled stop reason:
    error`, payload JSON `api_error` con testo server transitorio
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) ed errori di provider occupato come `ModelNotReadyException`, quando il contesto del provider
    corrisponde.
    Il testo generico di fallback interno come `LLM request failed with an unknown
    error.` resta conservativo e non attiva da solo il fallback del modello.

  </Accordion>

  <Accordion title='Che cosa significa "No credentials found for profile anthropic:default"?'>
    Significa che il sistema ha tentato di usare l'ID profilo di autenticazione `anthropic:default`, ma non è riuscito a trovare le credenziali nell'archivio di autenticazione previsto.

    **Checklist di correzione:**

    - **Conferma dove risiedono i profili di autenticazione** (percorsi nuovi rispetto a legacy)
      - Attuale: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (migrato da `openclaw doctor`)
    - **Conferma che la tua variabile di ambiente sia caricata dal Gateway**
      - Se imposti `ANTHROPIC_API_KEY` nella tua shell ma esegui il Gateway tramite systemd/launchd, potrebbe non ereditarla. Inseriscila in `~/.openclaw/.env` o abilita `env.shellEnv`.
    - **Assicurati di modificare l'agente corretto**
      - Le configurazioni multi-agente indicano che possono esistere più file `auth-profiles.json`.
    - **Esegui un controllo rapido dello stato modello/autenticazione**
      - Usa `openclaw models status` per vedere i modelli configurati e se i provider sono autenticati.

    **Checklist di correzione per "No credentials found for profile anthropic"**

    Significa che l'esecuzione è vincolata a un profilo di autenticazione Anthropic, ma il Gateway
    non riesce a trovarlo nel proprio archivio di autenticazione.

    - **Usa Claude CLI**
      - Esegui `openclaw models auth login --provider anthropic --method cli --set-default` sull'host del gateway.
    - **Se invece vuoi usare una chiave API**
      - Inserisci `ANTHROPIC_API_KEY` in `~/.openclaw/.env` sull'**host del gateway**.
      - Cancella qualsiasi ordine fissato che forza un profilo mancante:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Conferma di eseguire i comandi sull'host del gateway**
      - In modalità remota, i profili di autenticazione risiedono sulla macchina del gateway, non sul tuo laptop.

  </Accordion>

  <Accordion title="Perché ha provato anche Google Gemini ed è fallito?">
    Se la configurazione del tuo modello include Google Gemini come fallback (o sei passato a un'abbreviazione Gemini), OpenClaw lo proverà durante il fallback del modello. Se non hai configurato le credenziali Google, vedrai `No API key found for provider "google"`.

    Correzione: fornisci l'autenticazione Google oppure rimuovi/evita modelli Google in `agents.defaults.model.fallbacks` / alias, così il fallback non instrada lì.

    **Richiesta LLM rifiutata: firma di ragionamento richiesta (Google Antigravity)**

    Causa: la cronologia della sessione contiene **blocchi di ragionamento senza firme** (spesso da
    uno stream interrotto/parziale). Google Antigravity richiede firme per i blocchi di ragionamento.

    Correzione: OpenClaw ora rimuove i blocchi di ragionamento non firmati per Google Antigravity Claude. Se il problema compare ancora, avvia una **nuova sessione** o imposta `/thinking off` per quell'agente.

  </Accordion>
</AccordionGroup>

## Profili di autenticazione: cosa sono e come gestirli

Correlato: [/concepts/oauth](/it/concepts/oauth) (flussi OAuth, archiviazione dei token, pattern multi-account)

<AccordionGroup>
  <Accordion title="Che cos'è un profilo di autenticazione?">
    Un profilo di autenticazione è un record di credenziali con nome (OAuth o chiave API) collegato a un provider. I profili risiedono in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Per ispezionare i profili salvati senza mostrare segreti, esegui `openclaw models auth list` (facoltativamente `--provider <id>` o `--json`). Vedi [CLI dei modelli](/it/cli/models#auth-profiles) per i dettagli.

  </Accordion>

  <Accordion title="Quali sono gli ID profilo tipici?">
    OpenClaw usa ID con prefisso del provider, come:

    - `anthropic:default` (comune quando non esiste un'identità email)
    - `anthropic:<email>` per identità OAuth
    - ID personalizzati che scegli (ad es. `anthropic:work`)

  </Accordion>

  <Accordion title="Posso controllare quale profilo di autenticazione viene provato per primo?">
    Sì. La configurazione supporta metadati facoltativi per i profili e un ordine per provider (`auth.order.<provider>`). Questo **non** archivia segreti; mappa gli ID a provider/modalità e imposta l'ordine di rotazione.

    OpenClaw può saltare temporaneamente un profilo se è in un breve **cooldown** (limiti di frequenza/timeout/errori di autenticazione) o in uno stato più lungo **disabilitato** (fatturazione/crediti insufficienti). Per ispezionarlo, esegui `openclaw models status --json` e controlla `auth.unusableProfiles`. Regolazione: `auth.cooldowns.billingBackoffHours*`.

    I cooldown dei limiti di frequenza possono essere circoscritti al modello. Un profilo in cooldown
    per un modello può essere ancora utilizzabile per un modello affine sullo stesso provider,
    mentre le finestre di fatturazione/disabilitazione bloccano comunque l'intero profilo.

    Puoi anche impostare una sovrascrittura dell'ordine **per agente** (archiviata nell'`auth-state.json` di quell'agente) tramite la CLI:

    ```bash
    # Predefinito sull'agente predefinito configurato (ometti --agent)
    openclaw models auth order get --provider anthropic

    # Blocca la rotazione su un singolo profilo (prova solo questo)
    openclaw models auth order set --provider anthropic anthropic:default

    # Oppure imposta un ordine esplicito (fallback all'interno del provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Cancella la sovrascrittura (torna a config auth.order / round-robin)
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

    Se un profilo archiviato è omesso dall'ordine esplicito, il probe segnala
    `excluded_by_auth_order` per quel profilo invece di provarlo silenziosamente.

  </Accordion>

  <Accordion title="OAuth vs chiave API: qual è la differenza?">
    OpenClaw supporta entrambi:

    - **Accesso OAuth / CLI** spesso sfrutta l'accesso in abbonamento dove il
      provider lo supporta. Per Anthropic, il backend Claude CLI di OpenClaw usa
      Claude Code `claude -p`; Anthropic attualmente lo tratta come utilizzo
      SDK/programmatico per agenti, con un credito mensile Agent SDK separato a partire
      dal 15 giugno 2026.
    - **Chiavi API** usano la fatturazione a pagamento per token.

    La procedura guidata supporta esplicitamente Anthropic Claude CLI, OpenAI Codex OAuth e le chiavi API.

  </Accordion>
</AccordionGroup>

## Correlati

- [FAQ](/it/help/faq) — le FAQ principali
- [FAQ — avvio rapido e configurazione al primo avvio](/it/help/faq-first-run)
- [Selezione del modello](/it/concepts/model-providers)
- [Failover del modello](/it/concepts/model-failover)
