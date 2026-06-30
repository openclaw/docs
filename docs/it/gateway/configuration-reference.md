---
read_when:
    - Ti servono la semantica o i valori predefiniti esatti della configurazione a livello di campo
    - Stai convalidando blocchi di configurazione di canale, modello, gateway o strumento
summary: Riferimento alla configurazione del Gateway per le chiavi core di OpenClaw, i valori predefiniti e i link ai riferimenti dedicati dei sottosistemi
title: Riferimento di configurazione
x-i18n:
    generated_at: "2026-06-30T22:18:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c95497f4f76fd124505ffb9d0173e7e2adeeed82ee12812b2eca9673d5520fc4
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Riferimento alla configurazione core per `~/.openclaw/openclaw.json`. Per una panoramica orientata alle attività, consulta [Configurazione](/it/gateway/configuration).

Copre le principali superfici di configurazione di OpenClaw e rimanda ad altre pagine quando un sottosistema ha un proprio riferimento più approfondito. I cataloghi dei comandi di proprietà di canali e Plugin e le opzioni avanzate di memoria/QMD vivono nelle rispettive pagine invece che in questa.

Verità del codice:

- `openclaw config schema` stampa lo JSON Schema live usato per la validazione e la Control UI, con metadati bundled/Plugin/canale incorporati quando disponibili
- `config.schema.lookup` restituisce un nodo di schema limitato a un percorso per gli strumenti di drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` validano l'hash di riferimento della documentazione di configurazione rispetto alla superficie di schema corrente

Percorso di lookup dell'agente: usa l'azione strumento `gateway` `config.schema.lookup` per
documentazione e vincoli esatti a livello di campo prima delle modifiche. Usa
[Configurazione](/it/gateway/configuration) per indicazioni orientate alle attività e questa pagina
per la mappa più ampia dei campi, i valori predefiniti e i link ai riferimenti dei sottosistemi.

Riferimenti approfonditi dedicati:

- [Riferimento alla configurazione della memoria](/it/reference/memory-config) per `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e la configurazione di dreaming sotto `plugins.entries.memory-core.config.dreaming`
- [Comandi slash](/it/tools/slash-commands) per il catalogo attuale dei comandi integrati + bundled
- pagine dei canali/Plugin proprietari per le superfici di comandi specifiche del canale

Il formato di configurazione è **JSON5** (commenti + virgole finali consentiti). Tutti i campi sono facoltativi: OpenClaw usa valori predefiniti sicuri quando vengono omessi.

---

## Canali

Le chiavi di configurazione per canale sono state spostate in una pagina dedicata: consulta
[Configurazione - canali](/it/gateway/config-channels) per `channels.*`,
inclusi Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e altri
canali bundled (autenticazione, controllo accessi, multi-account, gating delle menzioni).

## Valori predefiniti degli agenti, multi-agente, sessioni e messaggi

Spostato in una pagina dedicata: consulta
[Configurazione - agenti](/it/gateway/config-agents) per:

- `agents.defaults.*` (workspace, modello, ragionamento, heartbeat, memoria, media, skills, sandbox)
- `multiAgent.*` (routing e binding multi-agente)
- `session.*` (ciclo di vita della sessione, Compaction, pruning)
- `messages.*` (consegna dei messaggi, TTS, rendering markdown)
- `talk.*` (modalità Talk)
  - `talk.consultThinkingLevel`: override del livello di ragionamento per l'intera esecuzione dell'agente OpenClaw dietro le consultazioni realtime di Control UI Talk
  - `talk.consultFastMode`: override fast-mode una tantum per le consultazioni realtime di Control UI Talk
  - `talk.speechLocale`: id locale BCP 47 facoltativo per il riconoscimento vocale Talk su iOS/macOS
  - `talk.silenceTimeoutMs`: quando non impostato, Talk mantiene la finestra di pausa predefinita della piattaforma prima di inviare la trascrizione (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: fallback del relay Gateway per le trascrizioni Talk realtime finalizzate che saltano `openclaw_agent_consult`

## Strumenti e provider personalizzati

La policy degli strumenti, i toggle sperimentali, la configurazione degli strumenti supportati da provider e la configurazione
di provider / URL di base personalizzati sono stati spostati in una pagina dedicata: consulta
[Configurazione - strumenti e provider personalizzati](/it/gateway/config-tools).

## Modelli

Le definizioni dei provider, le allowlist dei modelli e la configurazione dei provider personalizzati si trovano in
[Configurazione - strumenti e provider personalizzati](/it/gateway/config-tools#custom-providers-and-base-urls).
Anche la root `models` possiede il comportamento globale del catalogo dei modelli.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: comportamento del catalogo provider (`merge` o `replace`).
- `models.providers`: mappa dei provider personalizzati indicizzata per id provider.
- `models.providers.*.localService`: process manager on-demand facoltativo per
  server di modelli locali. OpenClaw verifica l'endpoint di health configurato, avvia
  il `command` assoluto quando necessario, attende la readiness, quindi invia la richiesta
  al modello. Consulta [Servizi di modelli locali](/it/gateway/local-model-services).
- `models.pricing.enabled`: controlla il bootstrap dei prezzi in background che
  parte dopo che sidecar e canali raggiungono il percorso pronto del Gateway. Quando è `false`,
  il Gateway salta i fetch dei cataloghi prezzi di OpenRouter e LiteLLM; i valori
  `models.providers.*.models[].cost` configurati continuano a funzionare per le stime dei costi locali.

## MCP

Le definizioni dei server MCP gestiti da OpenClaw vivono sotto `mcp.servers` e sono
consumate da OpenClaw integrato e da altri adapter runtime. I comandi `openclaw mcp list`,
`show`, `set` e `unset` gestiscono questo blocco senza connettersi al
server di destinazione durante le modifiche alla configurazione.

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        timeout: 20,
        connectTimeout: 5,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // Optional Codex app-server projection controls.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: definizioni di server MCP stdio o remoti con nome per runtime che
  espongono strumenti MCP configurati.
  Le voci remote usano `transport: "streamable-http"` o `transport: "sse"`;
  `type: "http"` è un alias nativo della CLI che `openclaw mcp set` e
  `openclaw doctor --fix` normalizzano nel campo canonico `transport`.
- `mcp.servers.<name>.enabled`: imposta `false` per mantenere una definizione server salvata
  escludendola dalla discovery MCP di OpenClaw integrato e dalla proiezione degli strumenti.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: timeout delle richieste MCP per server
  in secondi o millisecondi.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: timeout di connessione per server
  in secondi o millisecondi.
- `mcp.servers.<name>.supportsParallelToolCalls`: suggerimento di concorrenza facoltativo per
  adapter che possono scegliere se emettere chiamate parallele agli strumenti MCP.
- `mcp.servers.<name>.auth`: imposta `"oauth"` per server MCP HTTP che richiedono
  OAuth. Esegui `openclaw mcp login <name>` per archiviare i token nello stato di OpenClaw.
- `mcp.servers.<name>.oauth`: override facoltativi per scope OAuth, URL di redirect e URL dei
  metadati del client.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: controlli TLS HTTP
  per endpoint privati e TLS reciproco.
- `mcp.servers.<name>.toolFilter`: selezione facoltativa degli strumenti per server. `include`
  limita gli strumenti MCP scoperti ai nomi corrispondenti; `exclude` nasconde i nomi
  corrispondenti. Le voci sono nomi esatti di strumenti MCP o semplici glob `*`. I server con
  risorse o prompt generano anche nomi di strumenti utility (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), e quei nomi usano lo
  stesso filtro.
- `mcp.servers.<name>.codex`: controlli facoltativi della proiezione app-server Codex.
  Questo blocco è metadato OpenClaw solo per i thread app-server Codex; non
  influisce sulle sessioni ACP, sulla configurazione generica dell'harness Codex o su altri adapter runtime.
  `codex.agents` non vuoto limita il server agli id agente OpenClaw elencati.
  Liste di agenti scoped vuote, blank o non valide vengono rifiutate dalla validazione della configurazione
  e omesse dal percorso di proiezione runtime invece di diventare globali.
  `codex.defaultToolsApprovalMode` emette il valore nativo Codex
  `default_tools_approval_mode` per quel server. OpenClaw rimuove il blocco `codex`
  prima di passare la configurazione nativa `mcp_servers` a Codex. Ometti il blocco per
  mantenere il server proiettato per ogni agente app-server Codex con il comportamento
  di approvazione MCP predefinito di Codex.
- `mcp.sessionIdleTtlMs`: TTL di inattività per runtime MCP bundled con ambito sessione.
  Le esecuzioni integrate one-shot richiedono cleanup a fine esecuzione; questo TTL è il backstop per
  sessioni longeve e chiamanti futuri.
- Le modifiche sotto `mcp.*` si applicano a caldo eliminando i runtime MCP di sessione in cache.
  La successiva discovery/uso degli strumenti li ricrea dalla nuova configurazione, quindi le voci
  `mcp.servers` rimosse vengono ripulite immediatamente invece di attendere il TTL di inattività.
- La discovery runtime rispetta anche le notifiche di modifica dell'elenco strumenti MCP eliminando
  il catalogo in cache per quella sessione. I server che pubblicizzano risorse o
  prompt ottengono strumenti utility per elencare/leggere risorse ed elencare/recuperare
  prompt. Errori ripetuti di chiamata strumento mettono brevemente in pausa il server interessato prima che
  venga tentata un'altra chiamata.

Consulta [MCP](/it/cli/mcp#openclaw-as-an-mcp-client-registry) e
[Backend CLI](/it/gateway/cli-backends#bundle-mcp-overlays) per il comportamento runtime.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    workshop: {
      allowSymlinkTargetWrites: false,
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist facoltativa solo per skills bundled (skills gestite/workspace non interessate).
- `load.extraDirs`: root di skill condivise extra (precedenza più bassa).
- `load.allowSymlinkTargets`: root di destinazioni reali attendibili in cui i symlink delle skill possono
  risolversi quando il link vive fuori dalla root sorgente configurata.
- `workshop.allowSymlinkTargetWrites`: consente a Skill Workshop apply di scrivere
  attraverso destinazioni symlink già attendibili (predefinito: false).
- `install.preferBrew`: quando true, preferisce gli installer Homebrew quando `brew` è
  disponibile prima del fallback ad altri tipi di installer.
- `install.nodeManager`: preferenza dell'installer node per specifiche `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: consente ai client Gateway `operator.admin` attendibili
  di installare archivi zip privati predisposti tramite `skills.upload.*`
  (predefinito: false). Questo abilita solo il percorso degli archivi caricati; le normali installazioni ClawHub
  non lo richiedono.
- `entries.<skillKey>.enabled: false` disabilita una skill anche se bundled/installata.
- `entries.<skillKey>.apiKey`: scorciatoia per skills che dichiarano una variabile env primaria (stringa plaintext o oggetto SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Caricati da directory di pacchetti o bundle sotto `~/.openclaw/extensions` e `<workspace>/.openclaw/extensions`, oltre a file o directory elencati in `plugins.load.paths`.
- Inserisci i file di plugin autonomi in `plugins.load.paths`; le radici delle estensioni rilevate automaticamente ignorano i file `.js`, `.mjs` e `.ts` di primo livello, così gli script helper in quelle radici non bloccano l'avvio.
- Il rilevamento accetta plugin OpenClaw nativi più bundle Codex e bundle Claude compatibili, inclusi bundle Claude con layout predefinito senza manifesto.
- **Le modifiche alla configurazione richiedono il riavvio del Gateway.**
- `allow`: allowlist opzionale (vengono caricati solo i plugin elencati). `deny` prevale.
- `plugins.entries.<id>.apiKey`: campo di comodità per la chiave API a livello di plugin (quando supportato dal plugin).
- `plugins.entries.<id>.env`: mappa di variabili env con ambito del plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, il core blocca `before_prompt_build` e ignora i campi che modificano il prompt da `before_agent_start` legacy, preservando al contempo `modelOverride` e `providerOverride` legacy. Si applica agli hook dei plugin nativi e alle directory hook fornite da bundle supportate.
- `plugins.entries.<id>.hooks.allowConversationAccess`: quando `true`, i plugin attendibili non inclusi in bundle possono leggere il contenuto grezzo della conversazione da hook tipizzati come `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` e `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: considera esplicitamente attendibile questo plugin per richiedere override di `provider` e `model` per ogni esecuzione dei subagent in background.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opzionale di destinazioni canoniche `provider/model` per override attendibili dei subagent. Usa `"*"` solo quando vuoi intenzionalmente consentire qualsiasi modello.
- `plugins.entries.<id>.llm.allowModelOverride`: considera esplicitamente attendibile questo plugin per richiedere override del modello per `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: allowlist opzionale di destinazioni canoniche `provider/model` per override attendibili dei completamenti LLM dei plugin. Usa `"*"` solo quando vuoi intenzionalmente consentire qualsiasi modello.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: considera esplicitamente attendibile questo plugin per eseguire `api.runtime.llm.complete` su un id agente non predefinito.
- `plugins.entries.<id>.config`: oggetto di configurazione definito dal plugin (validato dallo schema del plugin OpenClaw nativo quando disponibile).
- Le impostazioni account/runtime dei plugin di canale vivono sotto `channels.<id>` e devono essere descritte dai metadati `channelConfigs` del manifesto del plugin proprietario, non da un registro centrale di opzioni OpenClaw.

### Configurazione del plugin harness Codex

Il plugin `codex` incluso possiede le impostazioni native dell'harness app-server Codex sotto
`plugins.entries.codex.config`. Vedi
[Riferimento harness Codex](/it/plugins/codex-harness-reference) per la superficie di configurazione completa
e [Harness Codex](/it/plugins/codex-harness) per il modello runtime.

`codexPlugins` si applica solo alle sessioni che selezionano l'harness Codex nativo.
Non abilita i plugin Codex per esecuzioni provider OpenClaw, associazioni di conversazione
ACP o qualsiasi harness non Codex.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled`: abilita il supporto nativo
  plugin/app Codex per l'harness Codex. Predefinito: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  criterio predefinito per azioni distruttive per elicitazioni di app plugin migrate.
  Usa `true` per accettare schemi di approvazione Codex sicuri senza chiedere conferma, `false`
  per rifiutarli, `"auto"` per instradare le approvazioni richieste da Codex tramite le approvazioni
  dei plugin OpenClaw, oppure `"always"` per chiedere conferma per ogni azione di scrittura/distruttiva
  del plugin senza approvazione durevole. La modalità `"always"` cancella gli override durevoli
  di approvazione Codex per-tool per l'app interessata prima di avviare il thread.
  Predefinito: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: abilita una
  voce plugin migrata quando anche `codexPlugins.enabled` globale è true.
  Predefinito: `true` per voci esplicite.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  identità marketplace stabile. V1 supporta solo `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: identità
  plugin Codex stabile dalla migrazione, ad esempio `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  override per-plugin delle azioni distruttive. Quando omesso, viene usato il valore globale
  `allow_destructive_actions`. Il valore per-plugin accetta gli stessi criteri
  `true`, `false`, `"auto"` o `"always"`.

`codexPlugins.enabled` è la direttiva globale di abilitazione. Le voci plugin
esplicite scritte dalla migrazione sono l'insieme durevole di idoneità per installazione e riparazione.
`plugins["*"]` non è supportato, non esiste un interruttore `install` e i valori locali
`marketplacePath` intenzionalmente non sono campi di configurazione perché sono
specifici dell'host.

I controlli di prontezza `app/list` vengono memorizzati in cache per un'ora e aggiornati
in modo asincrono quando diventano obsoleti. La configurazione app del thread Codex viene calcolata
all'istituzione della sessione dell'harness Codex, non a ogni turno; usa `/new`, `/reset` o un riavvio del Gateway
dopo aver modificato la configurazione dei plugin nativi.

- `plugins.entries.firecrawl.config.webFetch`: impostazioni del provider web-fetch Firecrawl.
  - `apiKey`: chiave API Firecrawl opzionale per limiti più alti (accetta SecretRef). Ripiega su `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` legacy o sulla variabile env `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base dell'API Firecrawl (predefinito: `https://api.firecrawl.dev`; gli override self-hosted devono puntare a endpoint privati/interni).
  - `onlyMainContent`: estrai solo il contenuto principale dalle pagine (predefinito: `true`).
  - `maxAgeMs`: età massima della cache in millisecondi (predefinito: `172800000` / 2 giorni).
  - `timeoutSeconds`: timeout della richiesta di scrape in secondi (predefinito: `60`).
- `plugins.entries.xai.config.xSearch`: impostazioni xAI X Search (ricerca web Grok).
  - `enabled`: abilita il provider X Search.
  - `model`: modello Grok da usare per la ricerca (ad es. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: impostazioni di memory dreaming. Vedi [Dreaming](/it/concepts/dreaming) per fasi e soglie.
  - `enabled`: interruttore principale del dreaming (predefinito `false`).
  - `frequency`: cadenza cron per ogni sweep completo di dreaming (`"0 3 * * *"` per impostazione predefinita).
  - `model`: override opzionale del modello del subagent Dream Diary. Richiede `plugins.entries.memory-core.subagent.allowModelOverride: true`; abbina con `allowedModels` per limitare le destinazioni. Gli errori di modello non disponibile riprovano una volta con il modello predefinito della sessione; gli errori di attendibilità o allowlist non fanno fallback silenziosamente.
  - criterio di fase e soglie sono dettagli di implementazione (non chiavi di configurazione rivolte all'utente).
- La configurazione completa della memoria vive in [Riferimento configurazione memoria](/it/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- I plugin bundle Claude abilitati possono anche contribuire predefiniti OpenClaw incorporati da `settings.json`; OpenClaw li applica come impostazioni agente sanificate, non come patch grezze alla configurazione OpenClaw.
- `plugins.slots.memory`: scegli l'id del plugin di memoria attivo, oppure `"none"` per disabilitare i plugin di memoria.
- `plugins.slots.contextEngine`: scegli l'id del plugin motore di contesto attivo; il valore predefinito è `"legacy"` a meno che tu non installi e selezioni un altro motore.

Vedi [Plugin](/it/tools/plugin).

---

## Impegni

`commitments` controlla la memoria di follow-up inferita: OpenClaw può rilevare check-in dai turni di conversazione e recapitarli tramite esecuzioni heartbeat.

- `commitments.enabled`: abilita estrazione LLM nascosta, archiviazione e recapito heartbeat per impegni di follow-up inferiti. Predefinito: `false`.
- `commitments.maxPerDay`: numero massimo di impegni di follow-up inferiti recapitati per sessione agente in un giorno mobile. Predefinito: `3`.

Vedi [Impegni inferiti](/it/concepts/commitments).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` disabilita `act:evaluate` e `wait --fn`.
- `tabCleanup` recupera le schede dell'agente primario tracciate dopo un periodo di inattività o quando una
  sessione supera il proprio limite. Imposta `idleMinutes: 0` o `maxTabsPerSession: 0` per
  disabilitare quelle singole modalità di pulizia.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` è disabilitato quando non impostato, quindi la navigazione del browser resta rigorosa per impostazione predefinita.
- Imposta `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` solo quando consideri intenzionalmente attendibile la navigazione del browser su rete privata.
- In modalità rigorosa, gli endpoint dei profili CDP remoti (`profiles.*.cdpUrl`) sono soggetti allo stesso blocco delle reti private durante i controlli di raggiungibilità/rilevamento.
- `ssrfPolicy.allowPrivateNetwork` resta supportato come alias legacy.
- In modalità rigorosa, usa `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` per eccezioni esplicite.
- I profili remoti consentono solo l'aggancio (avvio/arresto/reimpostazione disabilitati).
- `profiles.*.cdpUrl` accetta `http://`, `https://`, `ws://` e `wss://`.
  Usa HTTP(S) quando vuoi che OpenClaw rilevi `/json/version`; usa WS(S)
  quando il tuo provider fornisce un URL WebSocket DevTools diretto.
- `remoteCdpTimeoutMs` e `remoteCdpHandshakeTimeoutMs` si applicano alla raggiungibilità CDP remota e
  `attachOnly`, oltre alle richieste di apertura delle schede. I profili local loopback
  gestiti mantengono le impostazioni predefinite CDP locali.
- Se un servizio CDP gestito esternamente è raggiungibile tramite loopback, imposta
  `attachOnly: true` per quel profilo; altrimenti OpenClaw tratta la porta loopback come un
  profilo browser gestito localmente e può segnalare errori di proprietà della porta locale.
- I profili `existing-session` usano Chrome MCP invece di CDP e possono collegarsi
  all'host selezionato o tramite un nodo browser connesso.
- I profili `existing-session` possono impostare `userDataDir` per puntare a uno specifico
  profilo browser basato su Chromium, come Brave o Edge.
- I profili `existing-session` possono impostare `cdpUrl` quando Chrome è già in esecuzione
  dietro un endpoint di rilevamento HTTP(S) DevTools o un endpoint WS(S) diretto. In quella
  modalità OpenClaw passa l'endpoint a Chrome MCP invece di usare la connessione automatica;
  `userDataDir` viene ignorato per gli argomenti di avvio di Chrome MCP.
- I profili `existing-session` mantengono gli attuali limiti di instradamento di Chrome MCP:
  azioni basate su snapshot/ref invece del targeting con selettori CSS, hook di caricamento
  per un solo file, nessuna sovrascrittura del timeout delle finestre di dialogo, nessun
  `wait --load networkidle` e nessuna azione `responsebody`, esportazione PDF, intercettazione dei download o azione batch.
- I profili `openclaw` gestiti localmente assegnano automaticamente `cdpPort` e `cdpUrl`; imposta
  `cdpUrl` esplicitamente solo per profili CDP remoti o per l'aggancio a endpoint existing-session.
- I profili gestiti localmente possono impostare `executablePath` per sovrascrivere il
  `browser.executablePath` globale per quel profilo. Usalo per eseguire un profilo in
  Chrome e un altro in Brave.
- I profili gestiti localmente usano `browser.localLaunchTimeoutMs` per il rilevamento HTTP CDP
  di Chrome dopo l'avvio del processo e `browser.localCdpReadyTimeoutMs` per la
  disponibilità del websocket CDP dopo l'avvio. Aumentali su host più lenti dove Chrome
  si avvia correttamente ma i controlli di disponibilità entrano in competizione con l'avvio. Entrambi i valori devono essere
  interi positivi fino a `120000` ms; i valori di configurazione non validi vengono rifiutati.
- Ordine di rilevamento automatico: browser predefinito se basato su Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` e `browser.profiles.<name>.executablePath` accettano entrambi
  `~` e `~/...` per la directory home del tuo sistema operativo prima dell'avvio di Chromium.
  Anche `userDataDir` per profilo sui profili `existing-session` viene espanso dalla tilde.
- Servizio di controllo: solo loopback (porta derivata da `gateway.port`, predefinita `18791`).
- `extraArgs` aggiunge flag di avvio extra all'avvio locale di Chromium (per esempio
  `--disable-gpu`, dimensionamento della finestra o flag di debug).

---

## Interfaccia utente

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: colore di accento per il chrome dell'interfaccia utente dell'app nativa (tinta della bolla Talk Mode, ecc.).
- `assistant`: sovrascrittura dell'identità della Control UI. Ripiega sull'identità dell'agente attivo.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // chatMessageMaxWidth: "min(1280px, 82%)", // optional grouped chat message max-width
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://127.0.0.1:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list for owner/admin callers
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway field details">

- `mode`: `local` (esegui il Gateway) o `remote` (connettiti a un Gateway remoto). Il Gateway rifiuta l'avvio a meno che non sia `local`.
- `port`: porta singola multiplexed per WS + HTTP. Precedenza: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predefinito), `lan` (`0.0.0.0`), `tailnet` (solo IP Tailscale) o `custom`.
- **Alias bind legacy**: usa i valori della modalità bind in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), non gli alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota Docker**: il bind predefinito `loopback` ascolta su `127.0.0.1` dentro il container. Con il networking bridge di Docker (`-p 18789:18789`), il traffico arriva su `eth0`, quindi il Gateway non è raggiungibile. Usa `--network host`, oppure imposta `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) per ascoltare su tutte le interfacce.
- **Auth**: richiesta per impostazione predefinita. I bind non-loopback richiedono l'autenticazione del Gateway. In pratica significa un token/password condiviso o un reverse proxy consapevole dell'identità con `gateway.auth.mode: "trusted-proxy"`. La procedura guidata di onboarding genera un token per impostazione predefinita.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` (incluse le SecretRefs), imposta esplicitamente `gateway.auth.mode` su `token` o `password`. I flussi di avvio e di installazione/riparazione del servizio falliscono quando entrambi sono configurati e la modalità non è impostata.
- `gateway.auth.mode: "none"`: modalità esplicita senza auth. Usala solo per configurazioni local loopback fidate; intenzionalmente non viene proposta dai prompt di onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega l'autenticazione browser/utente a un reverse proxy consapevole dell'identità e considera attendibili gli header di identità da `gateway.trustedProxies` (vedi [Trusted Proxy Auth](/it/gateway/trusted-proxy-auth)). Questa modalità si aspetta per impostazione predefinita una sorgente proxy **non-loopback**; i reverse proxy loopback sullo stesso host richiedono `gateway.auth.trustedProxy.allowLoopback = true` esplicito. I chiamanti interni sullo stesso host possono usare `gateway.auth.password` come fallback diretto locale; `gateway.auth.token` resta mutualmente esclusivo con la modalità trusted-proxy.
- `gateway.auth.allowTailscale`: quando `true`, gli header di identità di Tailscale Serve possono soddisfare l'auth della Control UI/WebSocket (verificata tramite `tailscale whois`). Gli endpoint API HTTP **non** usano quell'auth tramite header Tailscale; seguono invece la normale modalità di auth HTTP del Gateway. Questo flusso senza token presuppone che l'host del Gateway sia attendibile. Il valore predefinito è `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitatore opzionale dei tentativi di auth falliti. Si applica per IP client e per ambito auth (shared-secret e device-token vengono tracciati indipendentemente). I tentativi bloccati restituiscono `429` + `Retry-After`.
  - Nel percorso asincrono della Control UI di Tailscale Serve, i tentativi falliti per lo stesso `{scope, clientIp}` vengono serializzati prima della scrittura dell'errore. Tentativi errati concorrenti dallo stesso client possono quindi far scattare il limitatore alla seconda richiesta, invece di procedere entrambi in parallelo come semplici mismatch.
  - `gateway.auth.rateLimit.exemptLoopback` ha valore predefinito `true`; imposta `false` quando vuoi intenzionalmente sottoporre a rate limit anche il traffico localhost (per configurazioni di test o deployment proxy rigorosi).
- I tentativi di auth WS da origine browser sono sempre limitati con l'esenzione loopback disabilitata (difesa in profondità contro brute force localhost basato su browser).
- Su loopback, quei blocchi da origine browser sono isolati per valore `Origin`
  normalizzato, quindi errori ripetuti da un'origine localhost non bloccano
  automaticamente un'origine diversa.
- `tailscale.mode`: `serve` (solo tailnet, bind loopback) o `funnel` (pubblico, richiede auth).
- `tailscale.serviceName`: nome opzionale del Service Tailscale per la modalità Serve, ad
  esempio `svc:openclaw`. Quando è impostato, OpenClaw lo passa a `tailscale serve
--service` così la Control UI può essere esposta tramite un Service denominato invece
  del nome host del dispositivo. Il valore deve usare il formato nome Service
  `svc:<dns-label>` di Tailscale; l'avvio segnala l'URL del Service derivato.
- `tailscale.preserveFunnel`: quando `true` e `tailscale.mode = "serve"`, OpenClaw
  controlla `tailscale funnel status` prima di riapplicare Serve all'avvio e lo salta
  se una route Funnel configurata esternamente copre già la porta del Gateway.
  Valore predefinito `false`.
- `controlUi.allowedOrigins`: allowlist esplicita delle origini browser per le connessioni WebSocket al Gateway. Richiesta per origini browser pubbliche non-loopback. I caricamenti UI LAN/Tailnet privati same-origin da loopback, RFC1918/link-local, `.local`, `.ts.net` o host Tailscale CGNAT sono accettati senza abilitare il fallback tramite header Host.
- `controlUi.chatMessageMaxWidth`: larghezza massima opzionale per i messaggi chat raggruppati della Control UI. Accetta valori CSS di larghezza vincolati come `960px`, `82%`, `min(1280px, 82%)` e `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modalità pericolosa che abilita il fallback dell'origine tramite header Host per deployment che si basano intenzionalmente sulla policy di origine dell'header Host.
- `remote.transport`: `ssh` (predefinito) o `direct` (ws/wss). Per `direct`, `remote.url` deve essere `wss://` per host pubblici; `ws://` in chiaro è accettato solo per loopback, LAN, link-local, `.local`, `.ts.net` e host Tailscale CGNAT.
- `remote.remotePort`: porta del Gateway sull'host SSH remoto. Valore predefinito `18789`; usala quando la porta del tunnel locale differisce dalla porta del Gateway remoto.
- `gateway.remote.token` / `.password` sono campi credenziali del client remoto. Da soli non configurano l'auth del Gateway.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS di base per il relay APNs esterno usato dopo che build iOS supportate da relay pubblicano le registrazioni sul Gateway. Le build pubbliche App Store/TestFlight usano il relay OpenClaw ospitato. Gli URL di relay personalizzati devono corrispondere a un percorso di build/deployment iOS deliberatamente separato il cui URL di relay punta a quel relay.
- `gateway.push.apns.relay.timeoutMs`: timeout di invio dal Gateway al relay in millisecondi. Valore predefinito `10000`.
- Le registrazioni supportate da relay sono delegate a una specifica identità del Gateway. L'app iOS associata recupera `gateway.identity.get`, include quell'identità nella registrazione del relay e inoltra al Gateway una concessione di invio con ambito di registrazione. Un altro Gateway non può riutilizzare quella registrazione salvata.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env temporanei per la configurazione relay sopra.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: via di fuga solo per sviluppo per URL relay HTTP loopback. Gli URL relay di produzione dovrebbero restare su HTTPS.
- `gateway.handshakeTimeoutMs`: timeout dell'handshake WebSocket pre-auth del Gateway in millisecondi. Predefinito: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ha precedenza quando impostato. Aumentalo su host carichi o poco potenti dove i client locali possono connettersi mentre il warmup di avvio si sta ancora stabilizzando.
- `gateway.channelHealthCheckMinutes`: intervallo del monitor di salute dei canali in minuti. Imposta `0` per disabilitare globalmente i riavvii del monitor di salute. Predefinito: `5`.
- `gateway.channelStaleEventThresholdMinutes`: soglia socket obsoleto in minuti. Mantienila maggiore o uguale a `gateway.channelHealthCheckMinutes`. Predefinito: `30`.
- `gateway.channelMaxRestartsPerHour`: numero massimo di riavvii del monitor di salute per canale/account in un'ora mobile. Predefinito: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per canale dai riavvii del monitor di salute mantenendo abilitato il monitor globale.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per account per canali multi-account. Quando impostato, ha precedenza sull'override a livello di canale.
- I percorsi di chiamata del Gateway locale possono usare `gateway.remote.*` come fallback solo quando `gateway.auth.*` non è impostato.
- Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non risolto, la risoluzione fallisce in modo chiuso (nessun masking tramite fallback remoto).
- `trustedProxies`: IP dei reverse proxy che terminano TLS o iniettano header del client inoltrato. Elenca solo proxy che controlli. Le voci loopback restano valide per configurazioni proxy/rilevamento locale sullo stesso host (ad esempio Tailscale Serve o un reverse proxy locale), ma **non** rendono le richieste loopback idonee per `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando `true`, il Gateway accetta `X-Real-IP` se `X-Forwarded-For` manca. Valore predefinito `false` per comportamento fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist CIDR/IP opzionale per approvare automaticamente il pairing iniziale di dispositivi nodo senza ambiti richiesti. È disabilitata quando non impostata. Non approva automaticamente il pairing operatore/browser/Control UI/WebChat e non approva automaticamente aggiornamenti di ruolo, ambito, metadati o chiave pubblica.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: modellazione globale allow/deny per i comandi nodo dichiarati dopo il pairing e la valutazione dell'allowlist della piattaforma. Usa `allowCommands` per accettare comandi nodo pericolosi come `camera.snap`, `camera.clip` e `screen.record`; `denyCommands` rimuove un comando anche se un valore predefinito della piattaforma o un allow esplicito lo includerebbe altrimenti. Dopo che un nodo modifica la propria lista di comandi dichiarati, rifiuta e riapprova il pairing di quel dispositivo così il Gateway salva lo snapshot dei comandi aggiornato.
- `gateway.tools.deny`: nomi di tool aggiuntivi bloccati per HTTP `POST /tools/invoke` (estende la lista deny predefinita).
- `gateway.tools.allow`: rimuove nomi di tool dalla lista deny HTTP predefinita per
  chiamanti owner/admin. Questo non eleva i chiamanti `operator.write` con identità
  ad accesso owner/admin; `cron`, `gateway` e `nodes` restano
  non disponibili ai chiamanti non-owner anche quando in allowlist.

</Accordion>

### Endpoint compatibili con OpenAI

- RPC HTTP admin: disattivato per impostazione predefinita come Plugin `admin-http-rpc`. Abilita il Plugin per registrare `POST /api/v1/admin/rpc`. Vedi [Admin HTTP RPC](/it/plugins/admin-http-rpc).
- Chat Completions: disabilitato per impostazione predefinita. Abilita con `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Rafforzamento dell'input URL per Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Le allowlist vuote sono trattate come non impostate; usa `gateway.http.endpoints.responses.files.allowUrl=false`
    e/o `gateway.http.endpoints.responses.images.allowUrl=false` per disabilitare il recupero URL.
- Header opzionale di rafforzamento delle risposte:
  - `gateway.http.securityHeaders.strictTransportSecurity` (imposta solo per origini HTTPS che controlli; vedi [Trusted Proxy Auth](/it/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento multi-istanza

Esegui più Gateway su un host con porte e directory di stato univoche:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flag di comodità: `--dev` (usa `~/.openclaw-dev` + porta `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

Vedi [Multiple Gateways](/it/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: abilita la terminazione TLS sul listener del Gateway (HTTPS/WSS) (predefinito: `false`).
- `autoGenerate`: genera automaticamente una coppia cert/key autofirmata locale quando non sono configurati file espliciti; solo per uso locale/dev.
- `certPath`: percorso del filesystem al file del certificato TLS.
- `keyPath`: percorso del filesystem al file della chiave privata TLS; mantieni permessi restrittivi.
- `caPath`: percorso opzionale del bundle CA per la verifica dei client o catene di trust personalizzate.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: controlla come vengono applicate le modifiche alla configurazione in fase di esecuzione.
  - `"off"`: ignora le modifiche live; le modifiche richiedono un riavvio esplicito.
  - `"restart"`: riavvia sempre il processo Gateway quando cambia la configurazione.
  - `"hot"`: applica le modifiche all'interno del processo senza riavviare.
  - `"hybrid"` (predefinito): prova prima il ricaricamento hot; ripiega sul riavvio se necessario.
- `debounceMs`: finestra di debounce in ms prima dell'applicazione delle modifiche alla configurazione (intero non negativo).
- `deferralTimeoutMs`: tempo massimo opzionale in ms da attendere per le operazioni in corso prima di forzare un riavvio o un ricaricamento hot del canale. Omettilo per usare l'attesa limitata predefinita (`300000`); imposta `0` per attendere indefinitamente e registrare avvisi periodici di operazioni ancora in sospeso.

---

## Hook

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Autenticazione: `Authorization: Bearer <token>` o `x-openclaw-token: <token>`.
I token degli hook nella stringa di query vengono rifiutati.

Note su convalida e sicurezza:

- `hooks.enabled=true` richiede un `hooks.token` non vuoto.
- `hooks.token` deve essere distinto dall'autenticazione shared-secret attiva del Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); all'avvio viene registrato un avviso di sicurezza non fatale quando viene rilevato il riutilizzo.
- `openclaw security audit` segnala il riutilizzo dell'autenticazione hook/Gateway come risultato critico, inclusa l'autenticazione con password del Gateway fornita solo al momento dell'audit (`--auth password --password <password>`). Esegui `openclaw doctor --fix` per ruotare un `hooks.token` persistito e riutilizzato, quindi aggiorna i mittenti esterni degli hook affinché usino il nuovo token hook.
- `hooks.path` non può essere `/`; usa un sottopercorso dedicato come `/hooks`.
- Se `hooks.allowRequestSessionKey=true`, limita `hooks.allowedSessionKeyPrefixes` (per esempio `["hook:"]`).
- Se una mappatura o un preset usa un `sessionKey` basato su template, imposta `hooks.allowedSessionKeyPrefixes` e `hooks.allowRequestSessionKey=true`. Le chiavi di mappatura statiche non richiedono questa adesione esplicita.

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` dal payload della richiesta viene accettato solo quando `hooks.allowRequestSessionKey=true` (predefinito: `false`).
- `POST /hooks/<name>` → risolto tramite `hooks.mappings`
  - I valori `sessionKey` della mappatura renderizzati da template sono trattati come forniti esternamente e richiedono anch'essi `hooks.allowRequestSessionKey=true`.

<Accordion title="Dettagli della mappatura">

- `match.path` corrisponde al sottopercorso dopo `/hooks` (ad es. `/hooks/gmail` → `gmail`).
- `match.source` corrisponde a un campo del payload per i percorsi generici.
- Template come `{{messages[0].subject}}` leggono dal payload.
- `transform` può puntare a un modulo JS/TS che restituisce un'azione hook.
  - `transform.module` deve essere un percorso relativo e resta all'interno di `hooks.transformsDir` (i percorsi assoluti e l'attraversamento delle directory vengono rifiutati).
  - Mantieni `hooks.transformsDir` sotto `~/.openclaw/hooks/transforms`; le directory delle Skills dello spazio di lavoro vengono rifiutate. Se `openclaw doctor` segnala questo percorso come non valido, sposta il modulo di trasformazione nella directory delle trasformazioni degli hook o rimuovi `hooks.transformsDir`.
- `agentId` instrada a un agente specifico; gli ID sconosciuti ripiegano sull'agente predefinito.
- `allowedAgentIds`: limita l'instradamento effettivo degli agenti, incluso il percorso dell'agente predefinito quando `agentId` viene omesso (`*` o omesso = consenti tutto, `[]` = nega tutto).
- `defaultSessionKey`: chiave di sessione fissa opzionale per le esecuzioni dell'agente hook senza `sessionKey` esplicito.
- `allowRequestSessionKey`: consente ai chiamanti di `/hooks/agent` e alle chiavi di sessione delle mappature guidate da template di impostare `sessionKey` (predefinito: `false`).
- `allowedSessionKeyPrefixes`: allowlist opzionale di prefissi per valori `sessionKey` espliciti (richiesta + mappatura), ad es. `["hook:"]`. Diventa obbligatoria quando una mappatura o un preset usa un `sessionKey` basato su template.
- `deliver: true` invia la risposta finale a un canale; `channel` è impostato per impostazione predefinita su `last`.
- `model` sostituisce l'LLM per questa esecuzione dell'hook (deve essere consentito se è impostato il catalogo dei modelli).

</Accordion>

### Integrazione Gmail

- Il preset Gmail integrato usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Se mantieni quell'instradamento per messaggio, imposta `hooks.allowRequestSessionKey: true` e limita `hooks.allowedSessionKeyPrefixes` in modo che corrisponda allo spazio dei nomi Gmail, per esempio `["hook:", "hook:gmail:"]`.
- Se ti serve `hooks.allowRequestSessionKey: false`, sovrascrivi il preset con una `sessionKey` statica invece del valore predefinito basato su template.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway avvia automaticamente `gog gmail watch serve` all'avvio quando configurato. Imposta `OPENCLAW_SKIP_GMAIL_WATCHER=1` per disabilitarlo.
- Non eseguire un `gog gmail watch serve` separato insieme al Gateway.

---

## Host del Plugin Canvas

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- Serve HTML/CSS/JS modificabili dall'agente e A2UI via HTTP sotto la porta del Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Solo locale: mantieni `gateway.bind: "loopback"` (predefinito).
- Bind non loopback: le route canvas richiedono l'autenticazione del Gateway (token/password/trusted-proxy), come le altre superfici HTTP del Gateway.
- Le WebView Node in genere non inviano header di autenticazione; dopo che un nodo è stato associato e connesso, il Gateway pubblicizza URL di capability con ambito del nodo per l'accesso a canvas/A2UI.
- Gli URL di capability sono vincolati alla sessione WS del nodo attivo e scadono rapidamente. Il fallback basato su IP non viene usato.
- Inietta il client live-reload nell'HTML servito.
- Crea automaticamente un `index.html` iniziale quando la directory è vuota.
- Serve anche A2UI su `/__openclaw__/a2ui/`.
- Le modifiche richiedono il riavvio del Gateway.
- Disabilita il live reload per directory di grandi dimensioni o errori `EMFILE`.

---

## Rilevamento

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (predefinito quando il Plugin `bonjour` in bundle è abilitato): omette `cliPath` + `sshPort` dai record TXT.
- `full`: include `cliPath` + `sshPort`; la pubblicità multicast LAN richiede comunque che il Plugin `bonjour` in bundle sia abilitato.
- `off`: sopprime la pubblicità multicast LAN senza cambiare l'abilitazione del Plugin.
- Il Plugin `bonjour` in bundle si avvia automaticamente sugli host macOS ed è opt-in su Linux, Windows e distribuzioni Gateway containerizzate.
- Il nome host usa per impostazione predefinita il nome host di sistema quando è un'etichetta DNS valida, altrimenti ripiega su `openclaw`. Sovrascrivi con `OPENCLAW_MDNS_HOSTNAME`.

### Area ampia (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Scrive una zona DNS-SD unicast in `~/.openclaw/dns/`. Per il rilevamento tra reti, abbinala a un server DNS (CoreDNS consigliato) + DNS suddiviso Tailscale.

Configurazione: `openclaw dns setup --apply`.

---

## Ambiente

### `env` (variabili d'ambiente inline)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Le variabili d'ambiente inline vengono applicate solo se nell'ambiente del processo manca la chiave.
- File `.env`: `.env` nella CWD + `~/.openclaw/.env` (nessuno dei due sovrascrive le variabili esistenti).
- `shellEnv`: importa le chiavi attese mancanti dal profilo della shell di login.
- Vedi [Ambiente](/it/help/environment) per la precedenza completa.

### Sostituzione delle variabili d'ambiente

Fai riferimento alle variabili d'ambiente in qualsiasi stringa di configurazione con `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Corrispondono solo i nomi in maiuscolo: `[A-Z_][A-Z0-9_]*`.
- Le variabili mancanti/vuote generano un errore al caricamento della configurazione.
- Esegui l'escape con `$${VAR}` per ottenere un `${VAR}` letterale.
- Funziona con `$include`.

---

## Segreti

I riferimenti ai segreti sono additivi: i valori in testo normale continuano a funzionare.

### `SecretRef`

Usa una sola forma di oggetto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validazione:

- Pattern di `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Pattern dell'id `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- Id `source: "file"`: puntatore JSON assoluto (per esempio `"/providers/openai/apiKey"`)
- Pattern dell'id `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (supporta selettori in stile AWS `secret#json_key`)
- Gli id `source: "exec"` non devono contenere segmenti di percorso delimitati da barre `.` o `..` (per esempio `a/../b` viene rifiutato)

### Superficie delle credenziali supportata

- Matrice canonica: [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface)
- `secrets apply` ha come destinazione i percorsi delle credenziali supportati in `openclaw.json`.
- I riferimenti in `auth-profiles.json` sono inclusi nella risoluzione in fase di esecuzione e nella copertura di audit.

### Configurazione dei provider di segreti

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Note:

- Il provider `file` supporta `mode: "json"` e `mode: "singleValue"` (`id` deve essere `"value"` in modalità singleValue).
- I percorsi dei provider file ed exec falliscono in modo chiuso quando la verifica ACL di Windows non è disponibile. Imposta `allowInsecurePath: true` solo per percorsi attendibili che non possono essere verificati.
- Il provider `exec` richiede un percorso `command` assoluto e usa payload di protocollo su stdin/stdout.
- Per impostazione predefinita, i percorsi dei comandi symlink vengono rifiutati. Imposta `allowSymlinkCommand: true` per consentire percorsi symlink convalidando al contempo il percorso di destinazione risolto.
- Se `trustedDirs` è configurato, il controllo della directory attendibile si applica al percorso di destinazione risolto.
- L'ambiente figlio di `exec` è minimo per impostazione predefinita; passa esplicitamente le variabili richieste con `passEnv`.
- I riferimenti ai segreti vengono risolti al momento dell'attivazione in uno snapshot in memoria, poi i percorsi delle richieste leggono solo lo snapshot.
- Il filtro della superficie attiva si applica durante l'attivazione: i riferimenti non risolti sulle superfici abilitate impediscono l'avvio/ricaricamento, mentre le superfici inattive vengono saltate con diagnostica.

---

## Archiviazione dell'autenticazione

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- I profili per agente sono archiviati in `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` supporta riferimenti a livello di valore (`keyRef` per `api_key`, `tokenRef` per `token`) per le modalità di credenziali statiche.
- Le mappe piatte legacy di `auth-profiles.json`, come `{ "provider": { "apiKey": "..." } }`, non sono un formato runtime; `openclaw doctor --fix` le riscrive in profili canonici con chiave API `provider:default` e un backup `.legacy-flat.*.bak`.
- I profili in modalità OAuth (`auth.profiles.<id>.mode = "oauth"`) non supportano credenziali di profilo di autenticazione basate su SecretRef.
- Le credenziali statiche runtime provengono da snapshot risolti in memoria; le voci statiche legacy di `auth.json` vengono ripulite quando vengono rilevate.
- Le importazioni OAuth legacy provengono da `~/.openclaw/credentials/oauth.json`.
- Vedi [OAuth](/it/concepts/oauth).
- Comportamento runtime dei segreti e strumenti `audit/configure/apply`: [Gestione dei segreti](/it/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: backoff di base in ore quando un profilo fallisce a causa di veri errori di fatturazione/credito insufficiente (predefinito: `5`). Il testo esplicito sulla fatturazione può comunque arrivare qui anche su risposte `401`/`403`, ma i matcher di testo specifici del provider restano limitati al provider a cui appartengono (per esempio OpenRouter `Key limit exceeded`). I messaggi HTTP `402` ritentabili relativi alla finestra di utilizzo o al limite di spesa di organizzazione/workspace restano invece nel percorso `rate_limit`.
- `billingBackoffHoursByProvider`: override facoltativi per provider delle ore di backoff di fatturazione.
- `billingMaxHours`: limite in ore per la crescita esponenziale del backoff di fatturazione (predefinito: `24`).
- `authPermanentBackoffMinutes`: backoff di base in minuti per errori `auth_permanent` ad alta confidenza (predefinito: `10`).
- `authPermanentMaxMinutes`: limite in minuti per la crescita del backoff `auth_permanent` (predefinito: `60`).
- `failureWindowHours`: finestra mobile in ore usata per i contatori di backoff (predefinito: `24`).
- `overloadedProfileRotations`: numero massimo di rotazioni dei profili di autenticazione dello stesso provider per errori di sovraccarico prima di passare al fallback del modello (predefinito: `1`). Forme di provider occupato come `ModelNotReadyException` arrivano qui.
- `overloadedBackoffMs`: ritardo fisso prima di riprovare una rotazione di provider/profilo sovraccaricato (predefinito: `0`).
- `rateLimitedProfileRotations`: numero massimo di rotazioni dei profili di autenticazione dello stesso provider per errori di limite di frequenza prima di passare al fallback del modello (predefinito: `1`). Quel bucket di limite di frequenza include testo in forma di provider come `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` e `resource exhausted`.

---

## Registrazione log

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- File di log predefinito: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Imposta `logging.file` per un percorso stabile.
- `consoleLevel` sale a `debug` quando viene usato `--verbose`.
- `maxFileBytes`: dimensione massima del file di log attivo in byte prima della rotazione (intero positivo; predefinito: `104857600` = 100 MB). OpenClaw conserva fino a cinque archivi numerati accanto al file attivo.
- `redactSensitive` / `redactPatterns`: mascheramento best-effort per output della console, log su file, record di log OTLP e testo persistito delle trascrizioni di sessione. `redactSensitive: "off"` disabilita solo questa policy generale per log/trascrizioni; le superfici di sicurezza di UI/strumenti/diagnostica continuano a oscurare i segreti prima dell'emissione.

---

## Diagnostica

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: interruttore principale per l'output di strumentazione (predefinito: `true`).
- `flags`: array di stringhe di flag che abilitano output di log mirato (supporta caratteri jolly come `"telegram.*"` o `"*"`).
- `stuckSessionWarnMs`: soglia di età senza avanzamento in ms per classificare le sessioni di elaborazione di lunga durata come `session.long_running`, `session.stalled` o `session.stuck`. Risposte, strumenti, stato, blocchi e avanzamento ACP azzerano il timer; diagnostiche `session.stuck` ripetute applicano backoff finché non cambiano.
- `stuckSessionAbortMs`: soglia di età senza avanzamento in ms prima che il lavoro attivo in stallo idoneo possa essere svuotato con abort per il recupero. Quando non è impostata, OpenClaw usa la finestra più sicura estesa per esecuzioni incorporate di almeno 5 minuti e 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: acquisisce uno snapshot di stabilità oscurato pre-OOM quando la pressione di memoria raggiunge `critical` (predefinito: `false`). Imposta su `true` per aggiungere la scansione/scrittura del file del bundle di stabilità mantenendo i normali eventi di pressione di memoria.
- `otel.enabled`: abilita la pipeline di esportazione OpenTelemetry (predefinito: `false`). Per configurazione completa, catalogo dei segnali e modello di privacy, vedi [Esportazione OpenTelemetry](/it/gateway/opentelemetry).
- `otel.endpoint`: URL del collector per l'esportazione OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP facoltativi specifici per segnale. Quando impostati, sovrascrivono `otel.endpoint` solo per quel segnale.
- `otel.protocol`: `"http/protobuf"` (predefinito) o `"grpc"`.
- `otel.headers`: intestazioni di metadati HTTP/gRPC aggiuntive inviate con le richieste di esportazione OTel.
- `otel.serviceName`: nome del servizio per gli attributi della risorsa.
- `otel.traces` / `otel.metrics` / `otel.logs`: abilita l'esportazione di tracce, metriche o log.
- `otel.logsExporter`: destinazione dell'esportazione dei log: `"otlp"` (predefinito), `"stdout"` per un oggetto JSON per riga stdout, o `"both"`.
- `otel.sampleRate`: frequenza di campionamento delle tracce `0`-`1`.
- `otel.flushIntervalMs`: intervallo periodico di flush della telemetria in ms.
- `otel.captureContent`: acquisizione opt-in del contenuto grezzo per gli attributi degli span OTEL. Per impostazione predefinita è disattivata. Il booleano `true` acquisisce contenuto non di sistema di messaggi/strumenti; la forma a oggetto consente di abilitare esplicitamente `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` e `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: interruttore di ambiente per la forma sperimentale più recente degli span di inferenza GenAI, inclusi nomi di span `{gen_ai.operation.name} {gen_ai.request.model}`, tipo di span `CLIENT` e `gen_ai.provider.name` invece del legacy `gen_ai.system`. Per impostazione predefinita gli span mantengono `openclaw.model.call` e `gen_ai.system` per compatibilità; le metriche GenAI usano attributi semantici limitati.
- `OPENCLAW_OTEL_PRELOADED=1`: interruttore di ambiente per host che hanno già registrato un SDK OpenTelemetry globale. OpenClaw quindi salta l'avvio/arresto dell'SDK di proprietà del Plugin mantenendo attivi i listener diagnostici.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` e `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variabili di ambiente endpoint specifiche per segnale usate quando la chiave di configurazione corrispondente non è impostata.
- `cacheTrace.enabled`: registra snapshot di traccia cache per esecuzioni incorporate (predefinito: `false`).
- `cacheTrace.filePath`: percorso di output per cache trace JSONL (predefinito: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controllano cosa viene incluso nell'output di cache trace (tutti predefiniti: `true`).

---

## Aggiornamento

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: canale di rilascio per installazioni npm/git - `"stable"`, `"beta"` o `"dev"`.
- `checkOnStart`: controlla gli aggiornamenti npm all'avvio del gateway (predefinito: `true`).
- `auto.enabled`: abilita l'aggiornamento automatico in background per installazioni da pacchetto (predefinito: `false`).
- `auto.stableDelayHours`: ritardo minimo in ore prima dell'applicazione automatica sul canale stable (predefinito: `6`; max: `168`).
- `auto.stableJitterHours`: finestra aggiuntiva di distribuzione del rollout del canale stable in ore (predefinito: `12`; max: `168`).
- `auto.betaCheckIntervalHours`: frequenza in ore dei controlli del canale beta (predefinito: `1`; max: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: gate globale della funzionalità ACP (predefinito: `true`; imposta `false` per nascondere dispatch ACP e affordance di spawn).
- `dispatch.enabled`: gate indipendente per il dispatch dei turni di sessione ACP (predefinito: `true`). Imposta `false` per mantenere disponibili i comandi ACP bloccandone l'esecuzione.
- `backend`: id del backend runtime ACP predefinito (deve corrispondere a un Plugin runtime ACP registrato).
  Installa prima il Plugin di backend e, se `plugins.allow` è impostato, includi l'id del Plugin di backend (per esempio `acpx`) altrimenti il backend ACP non verrà caricato.
- `defaultAgent`: id dell'agente ACP di fallback quando gli spawn non specificano un target esplicito.
- `allowedAgents`: allowlist di id agente consentiti per sessioni runtime ACP; vuota significa nessuna restrizione aggiuntiva.
- `maxConcurrentSessions`: numero massimo di sessioni ACP attive contemporaneamente.
- `stream.coalesceIdleMs`: finestra di flush inattiva in ms per il testo in streaming.
- `stream.maxChunkChars`: dimensione massima del chunk prima di dividere la proiezione del blocco in streaming.
- `stream.repeatSuppression`: sopprime righe di stato/strumento ripetute per turno (predefinito: `true`).
- `stream.deliveryMode`: `"live"` trasmette in modo incrementale; `"final_only"` accumula fino agli eventi terminali del turno.
- `stream.hiddenBoundarySeparator`: separatore prima del testo visibile dopo eventi strumento nascosti (predefinito: `"paragraph"`).
- `stream.maxOutputChars`: numero massimo di caratteri di output dell'assistente proiettati per turno ACP.
- `stream.maxSessionUpdateChars`: numero massimo di caratteri per righe di stato/aggiornamento ACP proiettate.
- `stream.tagVisibility`: record di nomi di tag su override booleani di visibilità per eventi in streaming.
- `runtime.ttlMinutes`: TTL inattivo in minuti per i worker di sessione ACP prima della pulizia idonea.
- `runtime.installCommand`: comando di installazione facoltativo da eseguire durante il bootstrap di un ambiente runtime ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` controlla lo stile della tagline del banner:
  - `"random"` (predefinito): tagline divertenti/stagionali a rotazione.
  - `"default"`: tagline neutra fissa (`All your chats, one OpenClaw.`).
  - `"off"`: nessun testo di tagline (titolo/versione del banner ancora mostrati).
- Per nascondere l'intero banner (non solo le tagline), imposta l'env `OPENCLAW_HIDE_BANNER=1`.

---

## Procedura guidata

Metadati scritti dai flussi di configurazione guidata della CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## Identità

Vedi i campi di identità `agents.list` in [Valori predefiniti degli agenti](/it/gateway/config-agents#agent-defaults).

---

## Bridge (legacy, rimosso)

Le build correnti non includono più il bridge TCP. I nodi si connettono tramite il WebSocket del Gateway. Le chiavi `bridge.*` non fanno più parte dello schema di configurazione (la validazione fallisce finché non vengono rimosse; `openclaw doctor --fix` può eliminare le chiavi sconosciute).

<Accordion title="Configurazione bridge legacy (riferimento storico)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: per quanto tempo conservare le sessioni di esecuzione Cron isolate completate prima di rimuoverle da `sessions.json`. Controlla anche la pulizia delle trascrizioni Cron eliminate e archiviate. Predefinito: `24h`; imposta `false` per disabilitare.
- `runLog.maxBytes`: accettato per compatibilità con i log di esecuzione Cron meno recenti basati su file. Predefinito: `2_000_000` byte.
- `runLog.keepLines`: righe più recenti della cronologia esecuzioni SQLite conservate per ogni job. Predefinito: `2000`.
- `webhookToken`: token bearer usato per la consegna POST del Webhook Cron (`delivery.mode = "webhook"`); se omesso, non viene inviato alcun header di autenticazione.
- `webhook`: URL Webhook legacy deprecato di fallback (http/https) usato da `openclaw doctor --fix` per migrare i job salvati che hanno ancora `notify: true`; la consegna runtime usa `delivery.mode="webhook"` specifico del job più `delivery.to`, oppure `delivery.completionDestination` quando conserva la consegna di annuncio.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: numero massimo di tentativi per i job Cron in caso di errori transitori (predefinito: `3`; intervallo: `0`-`10`).
- `backoffMs`: array di ritardi di backoff in ms per ogni tentativo (predefinito: `[30000, 60000, 300000]`; 1-10 voci).
- `retryOn`: tipi di errore che attivano i tentativi - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Ometti per ritentare tutti i tipi transitori.

I job una tantum restano abilitati finché i tentativi non sono esauriti, poi vengono disabilitati mantenendo lo stato di errore finale. I job ricorrenti usano la stessa policy di tentativi transitori per rieseguire dopo il backoff prima del prossimo slot pianificato; gli errori permanenti o i tentativi transitori esauriti tornano alla normale pianificazione ricorrente con backoff degli errori.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: abilita gli avvisi di errore per i job Cron (predefinito: `false`).
- `after`: errori consecutivi prima dell'invio di un avviso (intero positivo, min: `1`).
- `cooldownMs`: millisecondi minimi tra avvisi ripetuti per lo stesso job (intero non negativo).
- `includeSkipped`: conta le esecuzioni saltate consecutive nella soglia di avviso (predefinito: `false`). Le esecuzioni saltate sono tracciate separatamente e non influenzano il backoff degli errori di esecuzione.
- `mode`: modalità di consegna - `"announce"` invia tramite un messaggio di canale; `"webhook"` pubblica sul Webhook configurato.
- `accountId`: id account o canale opzionale per delimitare la consegna dell'avviso.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Destinazione predefinita per le notifiche di errore Cron su tutti i job.
- `mode`: `"announce"` o `"webhook"`; usa `"announce"` come predefinito quando esistono dati di destinazione sufficienti.
- `channel`: override del canale per la consegna di annuncio. `"last"` riusa l'ultimo canale di consegna noto.
- `to`: destinazione di annuncio esplicita o URL Webhook. Obbligatorio per la modalità Webhook.
- `accountId`: override account opzionale per la consegna.
- `delivery.failureDestination` per job sostituisce questo valore globale predefinito.
- Quando non è impostata né una destinazione di errore globale né una per job, i job che consegnano già tramite `announce` ripiegano su quella destinazione di annuncio primaria in caso di errore.
- `delivery.failureDestination` è supportato solo per job `sessionTarget="isolated"`, a meno che il `delivery.mode` primario del job sia `"webhook"`.

Vedi [Job Cron](/it/automation/cron-jobs). Le esecuzioni Cron isolate sono tracciate come [attività in background](/it/automation/tasks).

---

## Variabili del modello multimediale

Segnaposto template espansi in `tools.media.models[].args`:

| Variabile          | Descrizione                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Corpo completo del messaggio in ingresso          |
| `{{RawBody}}`      | Corpo grezzo (senza wrapper di cronologia/mittente) |
| `{{BodyStripped}}` | Corpo con le menzioni di gruppo rimosse           |
| `{{From}}`         | Identificatore del mittente                       |
| `{{To}}`           | Identificatore della destinazione                 |
| `{{MessageSid}}`   | id messaggio del canale                           |
| `{{SessionId}}`    | UUID della sessione corrente                      |
| `{{IsNewSession}}` | `"true"` quando viene creata una nuova sessione   |
| `{{MediaUrl}}`     | Pseudo-URL del media in ingresso                  |
| `{{MediaPath}}`    | Percorso locale del media                         |
| `{{MediaType}}`    | Tipo di media (immagine/audio/documento/…)        |
| `{{Transcript}}`   | Trascrizione audio                                |
| `{{Prompt}}`       | Prompt multimediale risolto per le voci CLI       |
| `{{MaxChars}}`     | Numero massimo di caratteri di output risolto per le voci CLI |
| `{{ChatType}}`     | `"direct"` o `"group"`                            |
| `{{GroupSubject}}` | Oggetto del gruppo (best effort)                  |
| `{{GroupMembers}}` | Anteprima dei membri del gruppo (best effort)     |
| `{{SenderName}}`   | Nome visualizzato del mittente (best effort)      |
| `{{SenderE164}}`   | Numero di telefono del mittente (best effort)     |
| `{{Provider}}`     | Suggerimento Provider (whatsapp, telegram, discord, ecc.) |

---

## Include di configurazione (`$include`)

Dividi la configurazione in più file:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Comportamento di merge:**

- File singolo: sostituisce l'oggetto contenitore.
- Array di file: merge profondo in ordine (gli elementi successivi sovrascrivono i precedenti).
- Chiavi sorelle: unite dopo gli include (sovrascrivono i valori inclusi).
- Include annidati: fino a 10 livelli di profondità.
- Percorsi: risolti relativamente al file che include, ma devono restare all'interno della directory di configurazione di livello superiore (`dirname` di `openclaw.json`). Le forme assolute/`../` sono consentite solo quando si risolvono comunque entro quel limite. I percorsi non devono contenere byte null e devono essere rigorosamente più corti di 4096 caratteri prima e dopo la risoluzione.
- Le scritture di proprietà di OpenClaw che modificano solo una sezione di primo livello supportata da un include a file singolo scrivono direttamente in quel file incluso. Per esempio, `plugins install` aggiorna `plugins: { $include: "./plugins.json5" }` in `plugins.json5` e lascia intatto `openclaw.json`.
- Gli include root, gli array di include e gli include con override tramite chiavi sorelle sono in sola lettura per le scritture di proprietà di OpenClaw; tali scritture falliscono in modo chiuso invece di appiattire la configurazione.
- Errori: messaggi chiari per file mancanti, errori di parsing, include circolari, formato percorso non valido e lunghezza eccessiva.

---

_Correlati: [Configurazione](/it/gateway/configuration) · [Esempi di configurazione](/it/gateway/configuration-examples) · [Doctor](/it/gateway/doctor)_

## Correlati

- [Configurazione](/it/gateway/configuration)
- [Esempi di configurazione](/it/gateway/configuration-examples)
