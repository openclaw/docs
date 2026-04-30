---
read_when:
    - Scegliere o cambiare modello, configurare gli alias
    - Debug del failover del modello / "Tutti i modelli hanno fallito"
    - Comprendere i profili di autenticazione e come gestirli
sidebarTitle: Models FAQ
summary: 'FAQ: impostazioni predefinite dei modelli, selezione, alias, cambio, commutazione in caso di errore e profili di autenticazione'
title: 'Domande frequenti: modelli e autenticazione'
x-i18n:
    generated_at: "2026-04-30T08:56:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: eaa72bf66d3f1528f95762e2a2763bc2f6bfddbc1d4c24a9ec2df7f943ebc14b
    source_path: help/faq-models.md
    workflow: 16
---

  Domande e risposte su modelli e profili di autenticazione. Per configurazione, sessioni, gateway, canali e
  risoluzione dei problemi, consulta la [FAQ](/it/help/faq) principale.

  ## Modelli: valori predefiniti, selezione, alias, cambio

  <AccordionGroup>
  <Accordion title='Che cos’è il "modello predefinito"?'>
    Il modello predefinito di OpenClaw è quello che imposti come:

    ```
    agents.defaults.model.primary
    ```

    I modelli sono indicati come `provider/model` (esempio: `openai/gpt-5.5` o `openai-codex/gpt-5.5`). Se ometti il provider, OpenClaw prova prima un alias, poi una corrispondenza univoca di provider configurato per quell’esatto ID modello, e solo dopo ricorre al provider predefinito configurato come percorso di compatibilità deprecato. Se quel provider non espone più il modello predefinito configurato, OpenClaw passa al primo provider/modello configurato invece di mostrare un valore predefinito obsoleto di un provider rimosso. Dovresti comunque impostare **esplicitamente** `provider/model`.

  </Accordion>

  <Accordion title="Quale modello consigli?">
    **Predefinito consigliato:** usa il modello di ultima generazione più potente disponibile nel tuo stack di provider.
    **Per agenti con strumenti abilitati o input non attendibile:** privilegia la potenza del modello rispetto al costo.
    **Per chat di routine/a basso rischio:** usa modelli fallback più economici e instrada in base al ruolo dell’agente.

    MiniMax ha la propria documentazione: [MiniMax](/it/providers/minimax) e
    [modelli locali](/it/gateway/local-models).

    Regola pratica: usa il **miglior modello che puoi permetterti** per il lavoro ad alto rischio, e un modello più economico
    per chat o riepiloghi di routine. Puoi instradare i modelli per agente e usare sotto-agenti per
    parallelizzare attività lunghe (ogni sotto-agente consuma token). Vedi [Modelli](/it/concepts/models) e
    [Sotto-agenti](/it/tools/subagents).

    Avviso importante: i modelli più deboli o troppo quantizzati sono più vulnerabili a prompt
    injection e comportamenti non sicuri. Vedi [Sicurezza](/it/gateway/security).

    Altro contesto: [Modelli](/it/concepts/models).

  </Accordion>

  <Accordion title="Come cambio modello senza cancellare la configurazione?">
    Usa i **comandi modello** o modifica solo i campi **model**. Evita sostituzioni complete della configurazione.

    Opzioni sicure:

    - `/model` in chat (rapido, per sessione)
    - `openclaw models set ...` (aggiorna solo la configurazione del modello)
    - `openclaw configure --section model` (interattivo)
    - modifica `agents.defaults.model` in `~/.openclaw/openclaw.json`

    Evita `config.apply` con un oggetto parziale, a meno che tu non intenda sostituire l’intera configurazione.
    Per modifiche RPC, ispeziona prima con `config.schema.lookup` e preferisci `config.patch`. Il payload di lookup fornisce il percorso normalizzato, documentazione/vincoli dello schema superficiale e riepiloghi immediati dei figli.
    per aggiornamenti parziali.
    Se hai sovrascritto la configurazione, ripristina da backup o riesegui `openclaw doctor` per ripararla.

    Documentazione: [Modelli](/it/concepts/models), [Configurazione guidata](/it/cli/configure), [Configurazione](/it/cli/config), [Doctor](/it/gateway/doctor).

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

    Nota di sicurezza: i modelli più piccoli o fortemente quantizzati sono più vulnerabili a prompt
    injection. Consigliamo vivamente **modelli grandi** per qualsiasi bot che possa usare strumenti.
    Se vuoi comunque usare modelli piccoli, abilita sandboxing e allowlist degli strumenti rigorose.

    Documentazione: [Ollama](/it/providers/ollama), [modelli locali](/it/gateway/local-models),
    [provider di modelli](/it/concepts/model-providers), [Sicurezza](/it/gateway/security),
    [Sandboxing](/it/gateway/sandboxing).

  </Accordion>

  <Accordion title="Quali modelli usano OpenClaw, Flawd e Krill?">
    - Queste distribuzioni possono differire e cambiare nel tempo; non esiste una raccomandazione fissa sul provider.
    - Controlla l’impostazione runtime corrente su ciascun gateway con `openclaw models status`.
    - Per agenti sensibili alla sicurezza o con strumenti abilitati, usa il modello di ultima generazione più potente disponibile.

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

    Suggerimento: `/model status` mostra quale agente è attivo, quale file `auth-profiles.json` è in uso e quale profilo di autenticazione verrà provato successivamente.
    Mostra anche l’endpoint del provider configurato (`baseUrl`) e la modalità API (`api`) quando disponibili.

    **Come rimuovo il pin di un profilo impostato con @profile?**

    Riesegui `/model` **senza** il suffisso `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Se vuoi tornare al valore predefinito, sceglilo da `/model` (oppure invia `/model <default provider/model>`).
    Usa `/model status` per confermare quale profilo di autenticazione è attivo.

  </Accordion>

  <Accordion title="Posso usare GPT 5.5 per le attività quotidiane e Codex 5.5 per il coding?">
    Sì. Impostane uno come predefinito e cambia quando serve:

    - **Cambio rapido (per sessione):** `/model openai/gpt-5.5` per le attività correnti con chiave API OpenAI diretta o `/model openai-codex/gpt-5.5` per le attività GPT-5.5 Codex OAuth.
    - **Predefinito:** imposta `agents.defaults.model.primary` su `openai/gpt-5.5` per l’uso con chiave API o su `openai-codex/gpt-5.5` per l’uso con GPT-5.5 Codex OAuth.
    - **Sotto-agenti:** instrada le attività di coding a sotto-agenti con un modello predefinito diverso.

    Vedi [Modelli](/it/concepts/models) e [comandi slash](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Come configuro la modalità veloce per GPT 5.5?">
    Usa un interruttore di sessione o un valore predefinito di configurazione:

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

    Per OpenAI, la modalità veloce corrisponde a `service_tier = "priority"` nelle richieste Responses native supportate. Le sovrascritture di sessione `/fast` prevalgono sui valori predefiniti di configurazione.

    Vedi [Ragionamento e modalità veloce](/it/tools/thinking) e [modalità veloce OpenAI](/it/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Perché vedo "Model ... is not allowed" e poi nessuna risposta?'>
    Se `agents.defaults.models` è impostato, diventa la **allowlist** per `/model` e qualsiasi
    override di sessione. Scegliere un modello che non è in quell’elenco restituisce:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Quell’errore viene restituito **invece di** una risposta normale. Correzione: aggiungi il modello a
    `agents.defaults.models`, rimuovi la allowlist o scegli un modello da `/model list`.

  </Accordion>

  <Accordion title='Perché vedo "Unknown model: minimax/MiniMax-M2.7"?'>
    Questo significa che il **provider non è configurato** (non è stata trovata alcuna configurazione del provider MiniMax o alcun profilo di autenticazione), quindi il modello non può essere risolto.

    Checklist di correzione:

    1. Aggiorna a una release OpenClaw corrente (o esegui dal sorgente `main`), poi riavvia il gateway.
    2. Assicurati che MiniMax sia configurato (wizard o JSON), oppure che l’autenticazione MiniMax
       esista in env/profili di autenticazione in modo che il provider corrispondente possa essere iniettato
       (`MINIMAX_API_KEY` per `minimax`, `MINIMAX_OAUTH_TOKEN` o OAuth MiniMax
       salvato per `minimax-portal`).
    3. Usa l’ID modello esatto (con distinzione tra maiuscole e minuscole) per il tuo percorso di autenticazione:
       `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed` per la configurazione
       con chiave API, oppure `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` per la configurazione OAuth.
    4. Esegui:

       ```bash
       openclaw models list
       ```

       e scegli dall’elenco (o `/model list` in chat).

    Vedi [MiniMax](/it/providers/minimax) e [Modelli](/it/concepts/models).

  </Accordion>

  <Accordion title="Posso usare MiniMax come predefinito e OpenAI per attività complesse?">
    Sì. Usa **MiniMax come predefinito** e cambia modello **per sessione** quando serve.
    I fallback servono per gli **errori**, non per le "attività difficili", quindi usa `/model` o un agente separato.

    **Opzione A: cambia per sessione**

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
    - `gpt` → `openai/gpt-5.5` per configurazioni con chiave API, oppure `openai-codex/gpt-5.5` quando configurato per Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Se imposti un tuo alias con lo stesso nome, il tuo valore ha la precedenza.

  </Accordion>

  <Accordion title="Come definisco/sovrascrivo le scorciatoie modello (alias)?">
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

    Quindi `/model sonnet` (o `/<alias>` quando supportato) viene risolto in quell’ID modello.

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

    **Nessuna chiave API trovata per il provider dopo aver aggiunto un nuovo agente**

    Di solito significa che il **nuovo agente** ha un archivio di autenticazione vuoto. L'autenticazione è per agente ed è
    archiviata in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opzioni di correzione:

    - Esegui `openclaw agents add <id>` e configura l'autenticazione durante la procedura guidata.
    - Oppure copia solo i profili statici portabili `api_key` / `token` dall'archivio di autenticazione dell'agente principale all'archivio di autenticazione del nuovo agente.
    - Per i profili OAuth, accedi dal nuovo agente quando gli serve il proprio account; altrimenti OpenClaw può leggere tramite l'agente predefinito/principale senza clonare i token di aggiornamento.

    **Non** riutilizzare `agentDir` tra agenti; causa collisioni di autenticazione/sessione.

  </Accordion>
</AccordionGroup>

## Failover del modello e "All models failed"

<AccordionGroup>
  <Accordion title="Come funziona il failover?">
    Il failover avviene in due fasi:

    1. **Rotazione del profilo di autenticazione** all'interno dello stesso provider.
    2. **Fallback del modello** al modello successivo in `agents.defaults.model.fallbacks`.

    I cooldown si applicano ai profili in errore (backoff esponenziale), così OpenClaw può continuare a rispondere anche quando un provider è soggetto a limitazione di frequenza o ha un errore temporaneo.

    Il bucket dei limiti di frequenza include più delle semplici risposte `429`. OpenClaw
    tratta anche messaggi come `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` e limiti periodici
    della finestra d'uso (`weekly/monthly limit reached`) come limiti di frequenza
    idonei al failover.

    Alcune risposte che sembrano relative alla fatturazione non sono `402`, e alcune risposte HTTP `402`
    restano comunque in quel bucket transitorio. Se un provider restituisce
    testo esplicito di fatturazione su `401` o `403`, OpenClaw può comunque mantenerlo
    nella corsia di fatturazione, ma i matcher di testo specifici del provider restano limitati al
    provider che li possiede (ad esempio OpenRouter `Key limit exceeded`). Se invece un messaggio `402`
    sembra una finestra d'uso ritentabile o
    un limite di spesa di organizzazione/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw lo tratta come
    `rate_limit`, non come una disabilitazione lunga per fatturazione.

    Gli errori di overflow del contesto sono diversi: firme come
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` o `ollama error: context length
    exceeded` restano nel percorso di Compaction/nuovo tentativo invece di far avanzare il
    fallback del modello.

    Il testo generico di errore server è intenzionalmente più ristretto di "qualsiasi cosa con
    unknown/error al suo interno". OpenClaw tratta come segnali di timeout/sovraccarico
    idonei al failover forme transitorie limitate al provider
    come `An unknown error occurred` nudo di Anthropic, `Provider returned error` nudo
    di OpenRouter, errori di motivo di arresto come `Unhandled stop reason:
    error`, payload JSON `api_error` con testo server transitorio
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) ed errori di provider occupato come `ModelNotReadyException`, quando il contesto del provider
    corrisponde.
    Il testo generico di fallback interno come `LLM request failed with an unknown
    error.` resta conservativo e da solo non attiva il fallback del modello.

  </Accordion>

  <Accordion title='Cosa significa "No credentials found for profile anthropic:default"?'>
    Significa che il sistema ha tentato di usare l'ID profilo di autenticazione `anthropic:default`, ma non è riuscito a trovare le credenziali nell'archivio di autenticazione previsto.

    **Checklist di correzione:**

    - **Conferma dove risiedono i profili di autenticazione** (percorsi nuovi e legacy)
      - Attuale: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (migrato da `openclaw doctor`)
    - **Conferma che la tua variabile di ambiente sia caricata dal Gateway**
      - Se imposti `ANTHROPIC_API_KEY` nella tua shell ma esegui il Gateway tramite systemd/launchd, potrebbe non ereditarla. Inseriscila in `~/.openclaw/.env` oppure abilita `env.shellEnv`.
    - **Assicurati di modificare l'agente corretto**
      - Le configurazioni multi-agente implicano che possano esserci più file `auth-profiles.json`.
    - **Controllo rapido dello stato modello/autenticazione**
      - Usa `openclaw models status` per vedere i modelli configurati e se i provider sono autenticati.

    **Checklist di correzione per "No credentials found for profile anthropic"**

    Significa che l'esecuzione è vincolata a un profilo di autenticazione Anthropic, ma il Gateway
    non riesce a trovarlo nel suo archivio di autenticazione.

    - **Usa Claude CLI**
      - Esegui `openclaw models auth login --provider anthropic --method cli --set-default` sull'host del gateway.
    - **Se vuoi usare invece una chiave API**
      - Inserisci `ANTHROPIC_API_KEY` in `~/.openclaw/.env` sull'**host del gateway**.
      - Cancella qualsiasi ordine vincolato che forzi un profilo mancante:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Conferma di eseguire i comandi sull'host del gateway**
      - In modalità remota, i profili di autenticazione risiedono sulla macchina del gateway, non sul tuo laptop.

  </Accordion>

  <Accordion title="Perché ha provato anche Google Gemini ed è fallito?">
    Se la configurazione del tuo modello include Google Gemini come fallback (oppure sei passato a una scorciatoia Gemini), OpenClaw lo proverà durante il fallback del modello. Se non hai configurato le credenziali Google, vedrai `No API key found for provider "google"`.

    Correzione: fornisci l'autenticazione Google, oppure rimuovi/evita i modelli Google in `agents.defaults.model.fallbacks` / alias, così il fallback non instraderà lì.

    **Richiesta LLM rifiutata: firma di ragionamento richiesta (Google Antigravity)**

    Causa: la cronologia della sessione contiene **blocchi di ragionamento senza firme** (spesso da
    uno stream interrotto/parziale). Google Antigravity richiede firme per i blocchi di ragionamento.

    Correzione: OpenClaw ora rimuove i blocchi di ragionamento non firmati per Google Antigravity Claude. Se appare ancora, avvia una **nuova sessione** oppure imposta `/thinking off` per quell'agente.

  </Accordion>
</AccordionGroup>

## Profili di autenticazione: cosa sono e come gestirli

Correlato: [/concepts/oauth](/it/concepts/oauth) (flussi OAuth, archiviazione dei token, pattern multi-account)

<AccordionGroup>
  <Accordion title="Cos'è un profilo di autenticazione?">
    Un profilo di autenticazione è un record di credenziali con nome (OAuth o chiave API) legato a un provider. I profili risiedono in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Quali sono gli ID profilo tipici?">
    OpenClaw usa ID con prefisso del provider come:

    - `anthropic:default` (comune quando non esiste un'identità email)
    - `anthropic:<email>` per identità OAuth
    - ID personalizzati scelti da te (ad es. `anthropic:work`)

  </Accordion>

  <Accordion title="Posso controllare quale profilo di autenticazione viene provato per primo?">
    Sì. La configurazione supporta metadati opzionali per i profili e un ordinamento per provider (`auth.order.<provider>`). Questo **non** archivia segreti; mappa gli ID a provider/modalità e imposta l'ordine di rotazione.

    OpenClaw può saltare temporaneamente un profilo se è in un breve **cooldown** (limiti di frequenza/timeout/errori di autenticazione) o in uno stato più lungo **disabilitato** (fatturazione/crediti insufficienti). Per ispezionarlo, esegui `openclaw models status --json` e controlla `auth.unusableProfiles`. Regolazione: `auth.cooldowns.billingBackoffHours*`.

    I cooldown dei limiti di frequenza possono avere ambito per modello. Un profilo in cooldown
    per un modello può essere ancora utilizzabile per un modello affine sullo stesso provider,
    mentre le finestre di fatturazione/disabilitazione continuano a bloccare l'intero profilo.

    Puoi anche impostare un override dell'ordine **per agente** (archiviato nel `auth-state.json` di quell'agente) tramite la CLI:

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

    Se un profilo archiviato viene omesso dall'ordine esplicito, probe segnala
    `excluded_by_auth_order` per quel profilo invece di provarlo silenziosamente.

  </Accordion>

  <Accordion title="OAuth e chiave API: qual è la differenza?">
    OpenClaw supporta entrambi:

    - **OAuth** spesso sfrutta l'accesso tramite abbonamento (ove applicabile).
    - Le **chiavi API** usano la fatturazione pay-per-token.

    La procedura guidata supporta esplicitamente Anthropic Claude CLI, OpenAI Codex OAuth e le chiavi API.

  </Accordion>
</AccordionGroup>

## Correlati

- [FAQ](/it/help/faq) — le FAQ principali
- [FAQ — avvio rapido e configurazione al primo avvio](/it/help/faq-first-run)
- [Selezione del modello](/it/concepts/model-providers)
- [Failover del modello](/it/concepts/model-failover)
