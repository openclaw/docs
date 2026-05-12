---
read_when:
    - Scegliere o cambiare modelli, configurare alias
    - Risoluzione dei problemi della commutazione in caso di errore dei modelli / "Tutti i modelli hanno fallito"
    - Comprendere i profili di autenticazione e come gestirli
sidebarTitle: Models FAQ
summary: 'FAQ: valori predefiniti dei modelli, selezione, alias, cambio, failover e profili di autenticazione'
title: 'FAQ: modelli e autenticazione'
x-i18n:
    generated_at: "2026-05-12T04:10:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: a42a8c24798908c7782a9f0c6f0af3fac0c1ad4e5f80d64778f6fd7e1e174f3b
    source_path: help/faq-models.md
    workflow: 16
---

  Q&A su modelli e profili di autenticazione. Per configurazione, sessioni, gateway, canali e
  risoluzione dei problemi, consulta le [FAQ](/it/help/faq) principali.

  ## Modelli: predefiniti, selezione, alias, cambio

  <AccordionGroup>
  <Accordion title='Qual è il "modello predefinito"?'>
    Il modello predefinito di OpenClaw è qualsiasi cosa tu imposti come:

    ```
    agents.defaults.model.primary
    ```

    I modelli sono referenziati come `provider/model` (esempio: `openai/gpt-5.5` o `anthropic/claude-sonnet-4-6`). Se ometti il provider, OpenClaw prova prima un alias, poi una corrispondenza univoca tra provider configurati per quell'id modello esatto, e solo dopo ripiega sul provider predefinito configurato come percorso di compatibilità deprecato. Se quel provider non espone più il modello predefinito configurato, OpenClaw ripiega sul primo provider/modello configurato invece di mostrare un valore predefinito obsoleto di un provider rimosso. Dovresti comunque impostare **esplicitamente** `provider/model`.

  </Accordion>

  <Accordion title="Quale modello consigli?">
    **Predefinito consigliato:** usa il modello di ultima generazione più potente disponibile nel tuo stack di provider.
    **Per agenti con strumenti abilitati o input non attendibili:** dai priorità alla potenza del modello rispetto al costo.
    **Per chat di routine/a basso rischio:** usa modelli di fallback più economici e instrada in base al ruolo dell'agente.

    MiniMax ha la propria documentazione: [MiniMax](/it/providers/minimax) e
    [modelli locali](/it/gateway/local-models).

    Regola pratica: usa il **miglior modello che puoi permetterti** per lavoro ad alto rischio, e un modello più economico
    per chat o riepiloghi di routine. Puoi instradare i modelli per agente e usare sotto-agenti per
    parallelizzare attività lunghe (ogni sotto-agente consuma token). Consulta [Modelli](/it/concepts/models) e
    [Sotto-agenti](/it/tools/subagents).

    Avviso importante: i modelli più deboli o eccessivamente quantizzati sono più vulnerabili alla prompt
    injection e a comportamenti non sicuri. Consulta [Sicurezza](/it/gateway/security).

    Maggiori dettagli: [Modelli](/it/concepts/models).

  </Accordion>

  <Accordion title="Come cambio modello senza cancellare la mia configurazione?">
    Usa i **comandi modello** o modifica solo i campi **model**. Evita sostituzioni complete della configurazione.

    Opzioni sicure:

    - `/model` nella chat (rapido, per sessione)
    - `openclaw models set ...` (aggiorna solo la configurazione del modello)
    - `openclaw configure --section model` (interattivo)
    - modifica `agents.defaults.model` in `~/.openclaw/openclaw.json`

    Evita `config.apply` con un oggetto parziale, a meno che tu non intenda sostituire l'intera configurazione.
    Per modifiche RPC, ispeziona prima con `config.schema.lookup` e preferisci `config.patch`. Il payload di lookup ti dà il percorso normalizzato, documentazione/vincoli di schema superficiali e riepiloghi immediati dei figli.
    per aggiornamenti parziali.
    Se hai sovrascritto la configurazione, ripristina da backup o esegui di nuovo `openclaw doctor` per riparare.

    Documentazione: [Modelli](/it/concepts/models), [Configurare](/it/cli/configure), [Configurazione](/it/cli/config), [Doctor](/it/gateway/doctor).

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

    - `Cloud + Local` ti dà modelli cloud più i tuoi modelli Ollama locali
    - i modelli cloud come `kimi-k2.5:cloud` non richiedono un download locale
    - per il cambio manuale, usa `openclaw models list` e `openclaw models set ollama/<model>`

    Nota di sicurezza: i modelli più piccoli o fortemente quantizzati sono più vulnerabili alla prompt
    injection. Consigliamo vivamente **modelli grandi** per qualsiasi bot che possa usare strumenti.
    Se vuoi comunque modelli piccoli, abilita sandboxing e allowlist degli strumenti rigorose.

    Documentazione: [Ollama](/it/providers/ollama), [modelli locali](/it/gateway/local-models),
    [provider di modelli](/it/concepts/model-providers), [Sicurezza](/it/gateway/security),
    [Sandboxing](/it/gateway/sandboxing).

  </Accordion>

  <Accordion title="Che cosa usano OpenClaw, Flawd e Krill per i modelli?">
    - Questi deployment possono differire e cambiare nel tempo; non esiste una raccomandazione fissa sul provider.
    - Controlla l'impostazione di runtime corrente su ciascun gateway con `openclaw models status`.
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

    Puoi anche forzare un profilo di autenticazione specifico per il provider (per sessione):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Suggerimento: `/model status` mostra quale agente è attivo, quale file `auth-profiles.json` viene usato e quale profilo di autenticazione sarà provato successivamente.
    Mostra anche l'endpoint del provider configurato (`baseUrl`) e la modalità API (`api`) quando disponibili.

    **Come rimuovo il pin da un profilo impostato con @profile?**

    Esegui di nuovo `/model` **senza** il suffisso `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Se vuoi tornare al valore predefinito, sceglilo da `/model` (o invia `/model <default provider/model>`).
    Usa `/model status` per confermare quale profilo di autenticazione è attivo.

  </Accordion>

  <Accordion title="Se due provider espongono lo stesso id modello, quale usa /model?">
    `/model provider/model` seleziona quella rotta provider esatta per la sessione.

    Per esempio, `qianfan/deepseek-v4-flash` e `deepseek/deepseek-v4-flash` sono riferimenti di modello diversi anche se entrambi contengono `deepseek-v4-flash`. OpenClaw non dovrebbe passare silenziosamente da un provider all'altro solo perché l'id modello semplice corrisponde.

    Un riferimento `/model` selezionato dall'utente è anche rigoroso per la policy di fallback. Se quel provider/modello selezionato non è disponibile, la risposta fallisce in modo visibile invece di rispondere da `agents.defaults.model.fallbacks`. Le catene di fallback configurate si applicano comunque ai valori predefiniti configurati, ai primari dei cron job e allo stato di fallback selezionato automaticamente.

    Se un'esecuzione avviata da un override non di sessione può usare il fallback, OpenClaw prova prima il provider/modello richiesto, poi i fallback configurati e solo dopo il primario configurato. Questo impedisce a id modello semplici duplicati di tornare direttamente al provider predefinito.

    Consulta [Modelli](/it/concepts/models) e [Failover del modello](/it/concepts/model-failover).

  </Accordion>

  <Accordion title="Posso usare GPT 5.5 per attività quotidiane e Codex 5.5 per la programmazione?">
    Sì. Tratta separatamente la scelta del modello e la scelta del runtime:

    - **Agente di programmazione Codex nativo:** imposta `agents.defaults.model.primary` su `openai/gpt-5.5`. Accedi con `openclaw models auth login --provider openai-codex` quando vuoi l'autenticazione tramite abbonamento ChatGPT/Codex.
    - **Attività dirette dell'API OpenAI fuori dal loop dell'agente:** configura `OPENAI_API_KEY` per immagini, embedding, voce, realtime e altre superfici API OpenAI non agente.
    - **Autenticazione con chiave API dell'agente OpenAI:** usa `/model openai/gpt-5.5` con un profilo chiave API `openai-codex` ordinato.
    - **Sotto-agenti:** instrada le attività di programmazione a un agente focalizzato su Codex con il proprio modello `openai/gpt-5.5`.

    Consulta [Modelli](/it/concepts/models) e [comandi slash](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Come configuro la modalità rapida per GPT 5.5?">
    Usa un toggle di sessione o un valore predefinito di configurazione:

    - **Per sessione:** invia `/fast on` mentre la sessione usa `openai/gpt-5.5`.
    - **Predefinito per modello:** imposta `agents.defaults.models["openai/gpt-5.5"].params.fastMode` su `true`.

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

    Per OpenAI, la modalità rapida mappa a `service_tier = "priority"` nelle richieste Responses native supportate. Gli override `/fast` di sessione prevalgono sui valori predefiniti di configurazione.

    Consulta [Pensiero e modalità rapida](/it/tools/thinking) e [modalità rapida OpenAI](/it/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Perché vedo "Model ... is not allowed" e poi nessuna risposta?'>
    Se `agents.defaults.models` è impostato, diventa la **allowlist** per `/model` e qualsiasi
    override di sessione. Scegliere un modello che non è in quella lista restituisce:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Quell'errore viene restituito **invece di** una risposta normale. Correzione: aggiungi il modello esatto a
    `agents.defaults.models`, aggiungi un wildcard del provider come `"provider/*": {}` per cataloghi provider dinamici, rimuovi la allowlist oppure scegli un modello da `/model list`.
    Se il comando includeva anche `--runtime codex`, aggiorna prima la allowlist e poi riprova
    lo stesso comando `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Perché vedo "Unknown model: minimax/MiniMax-M2.7"?'>
    Questo significa che il **provider non è configurato** (non è stata trovata alcuna configurazione provider MiniMax o alcun profilo di autenticazione),
    quindi il modello non può essere risolto.

    Checklist di correzione:

    1. Aggiorna a una versione OpenClaw corrente (o esegui dal sorgente `main`), poi riavvia il gateway.
    2. Assicurati che MiniMax sia configurato (wizard o JSON), o che l'autenticazione MiniMax
       esista nell'ambiente/nei profili di autenticazione così che il provider corrispondente possa essere iniettato
       (`MINIMAX_API_KEY` per `minimax`, `MINIMAX_OAUTH_TOKEN` o OAuth MiniMax archiviato
       per `minimax-portal`).
    3. Usa l'id modello esatto (con distinzione tra maiuscole e minuscole) per il tuo percorso di autenticazione:
       `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed` per una configurazione
       con chiave API, oppure `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` per una configurazione OAuth.
    4. Esegui:

       ```bash
       openclaw models list
       ```

       e scegli dalla lista (o `/model list` nella chat).

    Consulta [MiniMax](/it/providers/minimax) e [Modelli](/it/concepts/models).

  </Accordion>

  <Accordion title="Posso usare MiniMax come predefinito e OpenAI per attività complesse?">
    Sì. Usa **MiniMax come predefinito** e cambia modello **per sessione** quando necessario.
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

    Documentazione: [Modelli](/it/concepts/models), [Routing multi-agente](/it/concepts/multi-agent), [MiniMax](/it/providers/minimax), [OpenAI](/it/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt sono scorciatoie integrate?">
    Sì. OpenClaw include alcune abbreviazioni predefinite (applicate solo quando il modello esiste in `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-7`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Se imposti un alias personale con lo stesso nome, il tuo valore ha la precedenza.

  </Accordion>

  <Accordion title="How do I define/override model shortcuts (aliases)?">
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

    Poi `/model sonnet` (o `/<alias>` quando supportato) viene risolto in quell’ID modello.

  </Accordion>

  <Accordion title="How do I add models from other providers like OpenRouter or Z.AI?">
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

    Se fai riferimento a un provider/modello ma manca la chiave provider richiesta, riceverai un errore di autenticazione a runtime (ad esempio `No API key found for provider "zai"`).

    **Nessuna chiave API trovata per il provider dopo l’aggiunta di un nuovo agent**

    Di solito significa che il **nuovo agent** ha uno store di autenticazione vuoto. L’autenticazione è per agent e
    viene memorizzata in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opzioni di correzione:

    - Esegui `openclaw agents add <id>` e configura l’autenticazione durante la procedura guidata.
    - Oppure copia solo i profili `api_key` / `token` statici e portabili dallo store di autenticazione dell’agent principale allo store di autenticazione del nuovo agent.
    - Per i profili OAuth, accedi dal nuovo agent quando ha bisogno del proprio account; altrimenti OpenClaw può leggere dall’agent predefinito/principale senza clonare i refresh token.

    Non riutilizzare **mai** `agentDir` tra agent; causa collisioni di autenticazione/sessione.

  </Accordion>
</AccordionGroup>

## Failover del modello e "All models failed"

<AccordionGroup>
  <Accordion title="How does failover work?">
    Il failover avviene in due fasi:

    1. **Rotazione dei profili di autenticazione** all’interno dello stesso provider.
    2. **Fallback del modello** al modello successivo in `agents.defaults.model.fallbacks`.

    I cooldown si applicano ai profili in errore (backoff esponenziale), così OpenClaw può continuare a rispondere anche quando un provider è soggetto a rate limit o non funziona temporaneamente.

    Il bucket del rate limit include più delle semplici risposte `429`. OpenClaw
    tratta anche messaggi come `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` e i limiti periodici
    della finestra d’uso (`weekly/monthly limit reached`) come rate limit
    idonei al failover.

    Alcune risposte che sembrano di fatturazione non sono `402`, e anche alcune risposte HTTP `402`
    restano in quel bucket transitorio. Se un provider restituisce
    testo esplicito di fatturazione su `401` o `403`, OpenClaw può comunque mantenerlo nella
    corsia di fatturazione, ma i matcher di testo specifici del provider restano limitati al
    provider che li possiede (ad esempio OpenRouter `Key limit exceeded`). Se invece un messaggio `402`
    sembra un limite di finestra d’uso ritentabile o un
    limite di spesa dell’organizzazione/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw lo tratta come
    `rate_limit`, non come una disabilitazione di fatturazione prolungata.

    Gli errori di overflow del contesto sono diversi: firme come
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` o `ollama error: context length
    exceeded` restano nel percorso di Compaction/nuovo tentativo invece di far avanzare il fallback del modello.

    Il testo generico di errore server è intenzionalmente più ristretto di "qualsiasi cosa con
    unknown/error al suo interno". OpenClaw tratta come segnali di timeout/sovraccarico idonei al failover
    forme transitorie limitate al provider, come `An unknown error occurred` grezzo di Anthropic, `Provider returned error` grezzo di OpenRouter,
    errori di motivo di arresto come `Unhandled stop reason:
    error`, payload JSON `api_error` con testo server transitorio
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) ed errori di provider occupato come `ModelNotReadyException`,
    quando il contesto del provider corrisponde.
    Il testo generico di fallback interno come `LLM request failed with an unknown
    error.` resta conservativo e da solo non attiva il fallback del modello.

  </Accordion>

  <Accordion title='What does "No credentials found for profile anthropic:default" mean?'>
    Significa che il sistema ha tentato di usare l’ID del profilo di autenticazione `anthropic:default`, ma non è riuscito a trovare le credenziali nello store di autenticazione previsto.

    **Checklist di correzione:**

    - **Conferma dove si trovano i profili di autenticazione** (percorsi nuovi rispetto a quelli legacy)
      - Attuale: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (migrato da `openclaw doctor`)
    - **Conferma che la variabile d’ambiente sia caricata dal Gateway**
      - Se imposti `ANTHROPIC_API_KEY` nella shell ma esegui il Gateway tramite systemd/launchd, potrebbe non ereditarla. Inseriscila in `~/.openclaw/.env` o abilita `env.shellEnv`.
    - **Assicurati di modificare l’agent corretto**
      - Le configurazioni multi-agent indicano che possono esserci più file `auth-profiles.json`.
    - **Controlla rapidamente lo stato di modello/autenticazione**
      - Usa `openclaw models status` per vedere i modelli configurati e se i provider sono autenticati.

    **Checklist di correzione per "No credentials found for profile anthropic"**

    Significa che l’esecuzione è vincolata a un profilo di autenticazione Anthropic, ma il Gateway
    non riesce a trovarlo nel proprio store di autenticazione.

    - **Usa Claude CLI**
      - Esegui `openclaw models auth login --provider anthropic --method cli --set-default` sull’host del gateway.
    - **Se invece vuoi usare una chiave API**
      - Inserisci `ANTHROPIC_API_KEY` in `~/.openclaw/.env` sull’**host del gateway**.
      - Cancella qualsiasi ordine bloccato che forza un profilo mancante:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Conferma di eseguire i comandi sull’host del gateway**
      - In modalità remota, i profili di autenticazione risiedono sulla macchina gateway, non sul tuo laptop.

  </Accordion>

  <Accordion title="Why did it also try Google Gemini and fail?">
    Se la configurazione del modello include Google Gemini come fallback (o sei passato a una scorciatoia Gemini), OpenClaw lo proverà durante il fallback del modello. Se non hai configurato credenziali Google, vedrai `No API key found for provider "google"`.

    Correzione: fornisci l’autenticazione Google, oppure rimuovi/evita i modelli Google in `agents.defaults.model.fallbacks` / alias, così il fallback non instrada lì.

    **Richiesta LLM rifiutata: firma di thinking richiesta (Google Antigravity)**

    Causa: la cronologia della sessione contiene **blocchi thinking senza firme** (spesso da
    uno stream interrotto/parziale). Google Antigravity richiede firme per i blocchi thinking.

    Correzione: OpenClaw ora rimuove i blocchi thinking non firmati per Google Antigravity Claude. Se compare ancora, avvia una **nuova sessione** o imposta `/thinking off` per quell’agent.

  </Accordion>
</AccordionGroup>

## Profili di autenticazione: cosa sono e come gestirli

Correlato: [/concepts/oauth](/it/concepts/oauth) (flussi OAuth, archiviazione dei token, pattern multi-account)

<AccordionGroup>
  <Accordion title="What is an auth profile?">
    Un profilo di autenticazione è un record di credenziali denominato (OAuth o chiave API) associato a un provider. I profili risiedono in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Per ispezionare i profili salvati senza mostrare segreti, esegui `openclaw models auth list` (opzionalmente `--provider <id>` o `--json`). Consulta [Models CLI](/it/cli/models#auth-profiles) per i dettagli.

  </Accordion>

  <Accordion title="What are typical profile IDs?">
    OpenClaw usa ID con prefisso del provider come:

    - `anthropic:default` (comune quando non esiste un’identità email)
    - `anthropic:<email>` per identità OAuth
    - ID personalizzati scelti da te (ad esempio `anthropic:work`)

  </Accordion>

  <Accordion title="Can I control which auth profile is tried first?">
    Sì. La configurazione supporta metadati opzionali per i profili e un ordinamento per provider (`auth.order.<provider>`). Questo **non** archivia segreti; mappa gli ID a provider/modalità e imposta l’ordine di rotazione.

    OpenClaw può saltare temporaneamente un profilo se è in un breve **cooldown** (rate limit/timeout/errori di autenticazione) o in uno stato **disabilitato** più lungo (fatturazione/crediti insufficienti). Per ispezionarlo, esegui `openclaw models status --json` e controlla `auth.unusableProfiles`. Regolazione: `auth.cooldowns.billingBackoffHours*`.

    I cooldown di rate limit possono essere legati al modello. Un profilo in cooldown
    per un modello può ancora essere utilizzabile per un modello affine sullo stesso provider,
    mentre le finestre di fatturazione/disabilitazione bloccano comunque l’intero profilo.

    Puoi anche impostare un override dell’ordine **per agent** (memorizzato in `auth-state.json` di quell’agent) tramite CLI:

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

    Per scegliere come target un agent specifico:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Per verificare cosa verrà effettivamente provato, usa:

    ```bash
    openclaw models status --probe
    ```

    Se un profilo memorizzato viene omesso dall’ordine esplicito, probe segnala
    `excluded_by_auth_order` per quel profilo invece di provarlo in modo silenzioso.

  </Accordion>

  <Accordion title="OAuth vs API key - what is the difference?">
    OpenClaw supporta entrambi:

    - **OAuth** spesso sfrutta l’accesso in abbonamento (dove applicabile).
    - **Chiavi API** usano la fatturazione a pagamento per token.

    La procedura guidata supporta esplicitamente Anthropic Claude CLI, OpenAI Codex OAuth e chiavi API.

  </Accordion>
</AccordionGroup>

## Correlati

- [FAQ](/it/help/faq) — le FAQ principali
- [FAQ — avvio rapido e configurazione al primo avvio](/it/help/faq-first-run)
- [Selezione del modello](/it/concepts/model-providers)
- [Failover del modello](/it/concepts/model-failover)
