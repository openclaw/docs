---
read_when:
    - Sono necessarie semantiche di configurazione o valori predefiniti esatti a livello di campo
    - Stai convalidando blocchi di configurazione di canale, modello, Gateway o strumento
summary: Riferimento alla configurazione del Gateway per le chiavi core di OpenClaw, i valori predefiniti e i link ai riferimenti dedicati dei sottosistemi
title: Riferimento di configurazione
x-i18n:
    generated_at: "2026-07-02T08:24:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b1d31c4c35f216480f4536a57bca50558a8d19dcf57dcf30be9033555c019d72
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Riferimento della configurazione core per `~/.openclaw/openclaw.json`. Per una panoramica orientata alle attività, vedi [Configurazione](/it/gateway/configuration).

Copre le principali superfici di configurazione di OpenClaw e rimanda ad altre pagine quando un sottosistema ha un proprio riferimento più approfondito. I cataloghi di comandi di proprietà dei canali e dei Plugin e le impostazioni avanzate di memoria/QMD vivono nelle rispettive pagine invece che in questa.

Fonte di verità del codice:

- `openclaw config schema` stampa lo JSON Schema live usato per la validazione e la Control UI, con i metadati di bundle/Plugin/canali uniti quando disponibili
- `config.schema.lookup` restituisce un nodo schema limitato a un percorso per gli strumenti di approfondimento
- `pnpm config:docs:check` / `pnpm config:docs:gen` validano l'hash baseline della documentazione di configurazione rispetto alla superficie dello schema corrente

Percorso di lookup dell'agente: usa l'azione strumento `gateway` `config.schema.lookup` per
documentazione e vincoli esatti a livello di campo prima delle modifiche. Usa
[Configurazione](/it/gateway/configuration) per indicazioni orientate alle attività e questa pagina
per la mappa più ampia dei campi, i valori predefiniti e i link ai riferimenti dei sottosistemi.

Riferimenti approfonditi dedicati:

- [Riferimento della configurazione della memoria](/it/reference/memory-config) per `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e la configurazione di Dreaming sotto `plugins.entries.memory-core.config.dreaming`
- [Comandi slash](/it/tools/slash-commands) per il catalogo corrente di comandi integrati + in bundle
- pagine dei canali/Plugin proprietari per superfici di comandi specifiche dei canali

Il formato della configurazione è **JSON5** (commenti + virgole finali consentiti). Tutti i campi sono facoltativi: OpenClaw usa valori predefiniti sicuri quando vengono omessi.

---

## Canali

Le chiavi di configurazione per canale sono state spostate in una pagina dedicata: vedi
[Configurazione - canali](/it/gateway/config-channels) per `channels.*`,
inclusi Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e altri
canali in bundle (autenticazione, controllo accessi, account multipli, gating delle menzioni).

## Valori predefiniti agente, multi-agente, sessioni e messaggi

Spostati in una pagina dedicata: vedi
[Configurazione - agenti](/it/gateway/config-agents) per:

- `agents.defaults.*` (workspace, modello, ragionamento, Heartbeat, memoria, media, Skills, sandbox)
- `multiAgent.*` (routing e associazioni multi-agente)
- `session.*` (ciclo di vita della sessione, Compaction, pruning)
- `messages.*` (consegna dei messaggi, TTS, rendering markdown)
- `talk.*` (modalità Talk)
  - `talk.consultThinkingLevel`: override del livello di ragionamento per l'intera esecuzione dell'agente OpenClaw dietro i consulti in tempo reale di Talk della Control UI
  - `talk.consultFastMode`: override one-shot della modalità veloce per i consulti in tempo reale di Talk della Control UI
  - `talk.speechLocale`: id locale BCP 47 facoltativo per il riconoscimento vocale di Talk su iOS/macOS
  - `talk.silenceTimeoutMs`: quando non impostato, Talk mantiene la finestra di pausa predefinita della piattaforma prima di inviare la trascrizione (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: fallback del relay Gateway per trascrizioni Talk in tempo reale finalizzate che saltano `openclaw_agent_consult`

## Strumenti e provider personalizzati

Policy degli strumenti, toggle sperimentali, configurazione degli strumenti basata su provider e
configurazione di provider personalizzati / URL di base sono stati spostati in una pagina dedicata: vedi
[Configurazione - strumenti e provider personalizzati](/it/gateway/config-tools).

## Modelli

Definizioni dei provider, allowlist dei modelli e configurazione dei provider personalizzati si trovano in
[Configurazione - strumenti e provider personalizzati](/it/gateway/config-tools#custom-providers-and-base-urls).
Anche la radice `models` gestisce il comportamento globale del catalogo modelli.

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
- `models.providers.*.localService`: process manager facoltativo on-demand per
  server di modelli locali. OpenClaw sonda l'endpoint di health configurato, avvia
  il `command` assoluto quando necessario, attende la readiness, poi invia la richiesta
  del modello. Vedi [Servizi di modelli locali](/it/gateway/local-model-services).
- `models.pricing.enabled`: controlla il bootstrap dei prezzi in background che
  parte dopo che sidecar e canali raggiungono il percorso ready del Gateway. Quando `false`,
  il Gateway salta i fetch dei cataloghi prezzi di OpenRouter e LiteLLM; i valori
  `models.providers.*.models[].cost` configurati continuano a funzionare per le stime dei costi locali.

## MCP

Le definizioni dei server MCP gestiti da OpenClaw vivono sotto `mcp.servers` e sono
consumate da OpenClaw incorporato e da altri adapter runtime. I comandi `openclaw mcp list`,
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

- `mcp.servers`: definizioni denominate di server MCP stdio o remoti per runtime che
  espongono strumenti MCP configurati.
  Le voci remote usano `transport: "streamable-http"` o `transport: "sse"`;
  `type: "http"` è un alias nativo della CLI che `openclaw mcp set` e
  `openclaw doctor --fix` normalizzano nel campo canonico `transport`.
- `mcp.servers.<name>.enabled`: imposta `false` per mantenere una definizione server salvata
  escludendola dalla discovery MCP incorporata di OpenClaw e dalla proiezione degli strumenti.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: timeout delle richieste MCP
  per server in secondi o millisecondi.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: timeout di connessione
  per server in secondi o millisecondi.
- `mcp.servers.<name>.supportsParallelToolCalls`: suggerimento di concorrenza facoltativo per
  adapter che possono scegliere se emettere chiamate parallele a strumenti MCP.
- `mcp.servers.<name>.auth`: imposta `"oauth"` per i server MCP HTTP che richiedono
  OAuth. Esegui `openclaw mcp login <name>` per archiviare i token nello stato di OpenClaw.
- `mcp.servers.<name>.oauth`: override facoltativi per scope OAuth, URL di redirect e
  URL dei metadati client.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: controlli TLS HTTP
  per endpoint privati e TLS reciproco.
- `mcp.servers.<name>.toolFilter`: selezione facoltativa degli strumenti per server. `include`
  limita gli strumenti MCP scoperti ai nomi corrispondenti; `exclude` nasconde i nomi
  corrispondenti. Le voci sono nomi esatti di strumenti MCP o semplici glob `*`. I server con
  risorse o prompt generano anche nomi di strumenti di utilità (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`) e quei nomi usano lo
  stesso filtro.
- `mcp.servers.<name>.codex`: controlli facoltativi della proiezione app-server Codex.
  Questo blocco è metadato OpenClaw solo per thread app-server Codex; non
  influisce su sessioni ACP, configurazione generica dell'harness Codex o altri adapter runtime.
  `codex.agents` non vuoto limita il server agli id agente OpenClaw elencati.
  Liste di agenti con ambito vuote, blank o non valide sono rifiutate dalla validazione della configurazione
  e omesse dal percorso di proiezione runtime invece di diventare globali.
  `codex.defaultToolsApprovalMode` emette il valore nativo Codex
  `default_tools_approval_mode` per quel server. OpenClaw rimuove il blocco `codex`
  prima di passare la configurazione nativa `mcp_servers` a Codex. Ometti il blocco per
  mantenere il server proiettato per ogni agente app-server Codex con il comportamento
  predefinito di approvazione MCP di Codex.
- `mcp.sessionIdleTtlMs`: TTL di inattività per runtime MCP in bundle con ambito di sessione.
  Le esecuzioni incorporate one-shot richiedono pulizia a fine run; questo TTL è il backstop per
  sessioni a lunga durata e chiamanti futuri.
- Le modifiche sotto `mcp.*` si applicano a caldo eliminando i runtime MCP di sessione memorizzati in cache.
  La discovery/l'uso successivo degli strumenti li ricrea dalla nuova configurazione, quindi le voci
  `mcp.servers` rimosse vengono raccolte immediatamente invece di attendere il TTL di inattività.
- La discovery runtime rispetta anche le notifiche di modifica della lista strumenti MCP eliminando
  il catalogo in cache per quella sessione. I server che pubblicizzano risorse o
  prompt ricevono strumenti di utilità per elencare/leggere risorse ed elencare/recuperare
  prompt. Errori ripetuti delle chiamate strumento mettono brevemente in pausa il server interessato prima
  che venga tentata un'altra chiamata.

Vedi [MCP](/it/cli/mcp#openclaw-as-an-mcp-client-registry) e
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

- `allowBundled`: allowlist facoltativa solo per Skills in bundle (Skills gestite/workspace non interessate).
- `load.extraDirs`: radici aggiuntive condivise delle skill (precedenza più bassa).
- `load.allowSymlinkTargets`: radici target reali attendibili in cui i symlink delle skill possono
  risolversi quando il link vive fuori dalla radice sorgente configurata.
- `workshop.allowSymlinkTargetWrites`: consente a Skill Workshop apply di scrivere
  attraverso target symlink già attendibili (predefinito: false).
- `install.preferBrew`: quando true, preferisce gli installer Homebrew quando `brew` è
  disponibile prima di ripiegare su altri tipi di installer.
- `install.nodeManager`: preferenza dell'installer Node per le specifiche `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: consente ai client Gateway `operator.admin` attendibili
  di installare archivi zip privati preparati tramite `skills.upload.*`
  (predefinito: false). Questo abilita solo il percorso degli archivi caricati; le normali installazioni ClawHub
  non lo richiedono.
- `entries.<skillKey>.enabled: false` disabilita una skill anche se in bundle/installata.
- `entries.<skillKey>.apiKey`: comodità per skill che dichiarano una variabile env primaria (stringa plaintext o oggetto SecretRef).

---

## Plugin

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

- Caricati da directory di pacchetto o bundle sotto `~/.openclaw/extensions` e `<workspace>/.openclaw/extensions`, più file o directory elencati in `plugins.load.paths`.
- Metti i file di plugin autonomi in `plugins.load.paths`; le radici delle estensioni rilevate automaticamente ignorano i file `.js`, `.mjs` e `.ts` di primo livello, così gli script di supporto in quelle radici non bloccano l'avvio.
- Il rilevamento accetta plugin OpenClaw nativi più bundle Codex compatibili e bundle Claude, inclusi i bundle Claude con layout predefinito senza manifesto.
- **Le modifiche alla configurazione richiedono il riavvio del Gateway.**
- `allow`: allowlist opzionale (vengono caricati solo i plugin elencati). `deny` ha la precedenza.
- `plugins.entries.<id>.apiKey`: campo di comodità per chiave API a livello di plugin (quando supportato dal plugin).
- `plugins.entries.<id>.env`: mappa di variabili d'ambiente con ambito del plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando è `false`, il core blocca `before_prompt_build` e ignora i campi che modificano il prompt da `before_agent_start` legacy, preservando al contempo `modelOverride` e `providerOverride` legacy. Si applica agli hook dei plugin nativi e alle directory di hook fornite da bundle supportati.
- `plugins.entries.<id>.hooks.allowConversationAccess`: quando è `true`, i plugin attendibili non inclusi nel bundle possono leggere il contenuto grezzo della conversazione da hook tipizzati come `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` e `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: considera esplicitamente attendibile questo plugin per richiedere override di `provider` e `model` per esecuzione nelle esecuzioni di subagenti in background.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opzionale di destinazioni canoniche `provider/model` per override attendibili dei subagenti. Usa `"*"` solo quando vuoi intenzionalmente consentire qualsiasi modello.
- `plugins.entries.<id>.llm.allowModelOverride`: considera esplicitamente attendibile questo plugin per richiedere override del modello per `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: allowlist opzionale di destinazioni canoniche `provider/model` per override attendibili di completamento LLM dei plugin. Usa `"*"` solo quando vuoi intenzionalmente consentire qualsiasi modello.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: considera esplicitamente attendibile questo plugin per eseguire `api.runtime.llm.complete` su un id agente non predefinito.
- `plugins.entries.<id>.config`: oggetto di configurazione definito dal plugin (validato dallo schema del plugin OpenClaw nativo quando disponibile).
- Le impostazioni account/runtime dei plugin di canale risiedono sotto `channels.<id>` e devono essere descritte dai metadati `channelConfigs` del manifesto del plugin proprietario, non da un registro centrale di opzioni OpenClaw.

### Configurazione del plugin dell'harness Codex

Il plugin `codex` incluso nel bundle possiede le impostazioni native dell'harness app-server Codex sotto
`plugins.entries.codex.config`. Vedi
[Riferimento dell'harness Codex](/it/plugins/codex-harness-reference) per la superficie di configurazione completa
e [Harness Codex](/it/plugins/codex-harness) per il modello runtime.

`codexPlugins` si applica solo alle sessioni che selezionano l'harness Codex nativo.
Non abilita i plugin Codex per le esecuzioni dei provider OpenClaw, i binding di conversazione
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

- `plugins.entries.codex.config.codexPlugins.enabled`: abilita il supporto
  nativo a plugin/app Codex per l'harness Codex. Predefinito: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  policy predefinita per azioni distruttive per le richieste migrate delle app plugin.
  Usa `true` per accettare schemi di approvazione Codex sicuri senza chiedere conferma, `false`
  per rifiutarli, `"auto"` per instradare le approvazioni richieste da Codex tramite le approvazioni
  dei plugin OpenClaw, oppure `"ask"` per chiedere conferma per ogni azione di scrittura/distruttiva
  del plugin senza approvazione durevole. La modalità `"ask"` cancella gli override durevoli
  di approvazione Codex per strumento per l'app interessata e seleziona il revisore umano
  delle approvazioni per quell'app prima dell'avvio del thread Codex.
  Predefinito: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: abilita una
  voce di plugin migrata quando anche `codexPlugins.enabled` globale è true.
  Predefinito: `true` per le voci esplicite.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  identità stabile del marketplace. La V1 supporta solo `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: identità
  stabile del plugin Codex dalla migrazione, per esempio `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  override per plugin delle azioni distruttive. Quando omesso, viene usato il valore globale
  `allow_destructive_actions`. Il valore per plugin accetta le stesse policy
  `true`, `false`, `"auto"` o `"ask"`.

Ogni app plugin ammessa che usa `"ask"` instrada le richieste di approvazione di quell'app
al revisore umano. Le altre app e le approvazioni di thread non app mantengono il revisore
configurato, quindi policy miste dei plugin non ereditano il comportamento `"ask"`.

`codexPlugins.enabled` è la direttiva di abilitazione globale. Le voci di plugin esplicite
scritte dalla migrazione sono l'insieme durevole di installazione e idoneità alla riparazione.
`plugins["*"]` non è supportato, non esiste uno switch `install` e i valori locali
`marketplacePath` non sono intenzionalmente campi di configurazione perché sono
specifici dell'host.

I controlli di prontezza `app/list` vengono memorizzati nella cache per un'ora e aggiornati
in modo asincrono quando diventano obsoleti. La configurazione dell'app del thread Codex viene calcolata
all'istituzione della sessione dell'harness Codex, non a ogni turno; usa `/new`, `/reset` o un riavvio del Gateway dopo aver modificato la configurazione nativa del plugin.

- `plugins.entries.firecrawl.config.webFetch`: impostazioni del provider web-fetch Firecrawl.
  - `apiKey`: chiave API Firecrawl opzionale per limiti più elevati (accetta SecretRef). Ripiega su `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` legacy o sulla variabile d'ambiente `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base dell'API Firecrawl (predefinito: `https://api.firecrawl.dev`; gli override self-hosted devono puntare a endpoint privati/interni).
  - `onlyMainContent`: estrae solo il contenuto principale dalle pagine (predefinito: `true`).
  - `maxAgeMs`: età massima della cache in millisecondi (predefinito: `172800000` / 2 giorni).
  - `timeoutSeconds`: timeout della richiesta di scraping in secondi (predefinito: `60`).
- `plugins.entries.xai.config.xSearch`: impostazioni di xAI X Search (ricerca web Grok).
  - `enabled`: abilita il provider X Search.
  - `model`: modello Grok da usare per la ricerca (ad es. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: impostazioni del dreaming della memoria. Vedi [Dreaming](/it/concepts/dreaming) per fasi e soglie.
  - `enabled`: switch principale del dreaming (predefinito `false`).
  - `frequency`: cadenza cron per ogni sweep completo di dreaming (`"0 3 * * *"` per impostazione predefinita).
  - `model`: override opzionale del modello del subagente Dream Diary. Richiede `plugins.entries.memory-core.subagent.allowModelOverride: true`; abbinalo a `allowedModels` per limitare le destinazioni. Gli errori di modello non disponibile riprovano una volta con il modello predefinito della sessione; gli errori di attendibilità o allowlist non fanno fallback silenzioso.
  - la policy di fase e le soglie sono dettagli di implementazione (non chiavi di configurazione visibili all'utente).
- La configurazione completa della memoria si trova in [Riferimento di configurazione della memoria](/it/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- I plugin dei bundle Claude abilitati possono anche contribuire impostazioni predefinite OpenClaw incorporate da `settings.json`; OpenClaw le applica come impostazioni agente sanificate, non come patch grezze alla configurazione OpenClaw.
- `plugins.slots.memory`: scegli l'id del plugin di memoria attivo, oppure `"none"` per disabilitare i plugin di memoria.
- `plugins.slots.contextEngine`: scegli l'id del plugin del motore di contesto attivo; il valore predefinito è `"legacy"` salvo che tu installi e selezioni un altro motore.

Vedi [Plugin](/it/tools/plugin).

---

## Impegni

`commitments` controlla la memoria di follow-up dedotta: OpenClaw può rilevare check-in dai turni di conversazione e consegnarli tramite esecuzioni Heartbeat.

- `commitments.enabled`: abilita estrazione LLM nascosta, archiviazione e consegna tramite Heartbeat per impegni di follow-up dedotti. Predefinito: `false`.
- `commitments.maxPerDay`: numero massimo di impegni di follow-up dedotti consegnati per sessione agente in un giorno mobile. Predefinito: `3`.

Vedi [Impegni dedotti](/it/concepts/commitments).

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
- `tabCleanup` recupera le schede dell'agente primario tracciate dopo il tempo di inattività o quando una
  sessione supera il proprio limite. Imposta `idleMinutes: 0` o `maxTabsPerSession: 0` per
  disabilitare queste singole modalità di pulizia.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` è disabilitato quando non è impostato, quindi la navigazione del browser resta rigorosa per impostazione predefinita.
- Imposta `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` solo quando consideri intenzionalmente attendibile la navigazione del browser nella rete privata.
- In modalità rigorosa, gli endpoint dei profili CDP remoti (`profiles.*.cdpUrl`) sono soggetti allo stesso blocco della rete privata durante i controlli di raggiungibilità/scoperta.
- `ssrfPolicy.allowPrivateNetwork` resta supportato come alias legacy.
- In modalità rigorosa, usa `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` per eccezioni esplicite.
- I profili remoti sono solo in modalità attach (avvio/arresto/reimpostazione disabilitati).
- `profiles.*.cdpUrl` accetta `http://`, `https://`, `ws://` e `wss://`.
  Usa HTTP(S) quando vuoi che OpenClaw scopra `/json/version`; usa WS(S)
  quando il tuo provider ti fornisce un URL WebSocket DevTools diretto.
- `remoteCdpTimeoutMs` e `remoteCdpHandshakeTimeoutMs` si applicano alle richieste di raggiungibilità
  CDP remote e `attachOnly`, oltre che all'apertura delle schede. I profili
  local loopback gestiti mantengono le impostazioni predefinite CDP locali.
- Se un servizio CDP gestito esternamente è raggiungibile tramite loopback, imposta
  `attachOnly: true` per quel profilo; in caso contrario OpenClaw tratta la porta loopback come un
  profilo browser gestito localmente e può segnalare errori di proprietà della porta locale.
- I profili `existing-session` usano Chrome MCP invece di CDP e possono collegarsi
  all'host selezionato o tramite un nodo browser connesso.
- I profili `existing-session` possono impostare `userDataDir` per puntare a uno specifico
  profilo di browser basato su Chromium, come Brave o Edge.
- I profili `existing-session` possono impostare `cdpUrl` quando Chrome è già in esecuzione
  dietro un endpoint di scoperta DevTools HTTP(S) o un endpoint WS(S) diretto. In quella
  modalità OpenClaw passa l'endpoint a Chrome MCP invece di usare la connessione automatica;
  `userDataDir` viene ignorato per gli argomenti di avvio di Chrome MCP.
- I profili `existing-session` mantengono gli attuali limiti di instradamento di Chrome MCP:
  azioni basate su snapshot/ref invece del targeting tramite selettore CSS, hook per il caricamento
  di un solo file, nessuna sovrascrittura del timeout dei dialoghi, nessun `wait --load networkidle` e nessuna
  `responsebody`, esportazione PDF, intercettazione dei download o azione batch.
- I profili `openclaw` gestiti localmente assegnano automaticamente `cdpPort` e `cdpUrl`; imposta
  `cdpUrl` esplicitamente solo per profili CDP remoti o collegamento a endpoint existing-session.
- I profili gestiti localmente possono impostare `executablePath` per sovrascrivere il
  `browser.executablePath` globale per quel profilo. Usalo per eseguire un profilo in
  Chrome e un altro in Brave.
- I profili gestiti localmente usano `browser.localLaunchTimeoutMs` per la scoperta HTTP CDP di Chrome
  dopo l'avvio del processo e `browser.localCdpReadyTimeoutMs` per la
  prontezza websocket CDP successiva all'avvio. Aumentali su host più lenti dove Chrome
  si avvia correttamente ma i controlli di prontezza entrano in competizione con lo startup. Entrambi i valori devono essere
  interi positivi fino a `120000` ms; i valori di configurazione non validi vengono rifiutati.
- Ordine di rilevamento automatico: browser predefinito se basato su Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` e `browser.profiles.<name>.executablePath` accettano entrambi
  `~` e `~/...` per la directory home del tuo sistema operativo prima dell'avvio di Chromium.
  Anche `userDataDir` per profilo nei profili `existing-session` viene espanso dalla tilde.
- Servizio di controllo: solo loopback (porta derivata da `gateway.port`, predefinita `18791`).
- `extraArgs` aggiunge flag di avvio extra allo startup locale di Chromium (ad esempio
  `--disable-gpu`, dimensionamento della finestra o flag di debug).

---

## UI

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

- `seamColor`: colore di accento per la cornice dell'interfaccia dell'app nativa (tinta della bolla della modalità Talk, ecc.).
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

- `mode`: `local` (esegue il gateway) o `remote` (si connette al gateway remoto). Gateway rifiuta l'avvio se non è `local`.
- `port`: singola porta multiplexed per WS + HTTP. Precedenza: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predefinito), `lan` (`0.0.0.0`), `tailnet` (solo IP Tailscale) o `custom`.
- **Alias bind legacy**: usa i valori della modalità bind in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), non gli alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota Docker**: il bind predefinito `loopback` ascolta su `127.0.0.1` dentro il container. Con la rete bridge di Docker (`-p 18789:18789`), il traffico arriva su `eth0`, quindi il gateway non è raggiungibile. Usa `--network host` oppure imposta `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) per ascoltare su tutte le interfacce.
- **Autenticazione**: richiesta per impostazione predefinita. I bind non-loopback richiedono l'autenticazione del gateway. In pratica significa un token/password condiviso oppure un reverse proxy consapevole dell'identità con `gateway.auth.mode: "trusted-proxy"`. La procedura guidata di onboarding genera un token per impostazione predefinita.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` (inclusi i SecretRefs), imposta esplicitamente `gateway.auth.mode` su `token` o `password`. I flussi di avvio e di installazione/riparazione del servizio falliscono quando entrambi sono configurati e la modalità non è impostata.
- `gateway.auth.mode: "none"`: modalità esplicita senza autenticazione. Usala solo per configurazioni local loopback attendibili; intenzionalmente non viene proposta dai prompt di onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega l'autenticazione browser/utente a un reverse proxy consapevole dell'identità e considera attendibili gli header di identità da `gateway.trustedProxies` (vedi [Autenticazione tramite proxy attendibile](/it/gateway/trusted-proxy-auth)). Questa modalità si aspetta per impostazione predefinita una sorgente proxy **non-loopback**; i reverse proxy loopback sullo stesso host richiedono `gateway.auth.trustedProxy.allowLoopback = true` esplicito. I chiamanti interni sullo stesso host possono usare `gateway.auth.password` come fallback diretto locale; `gateway.auth.token` resta mutuamente esclusivo con la modalità trusted-proxy.
- `gateway.auth.allowTailscale`: quando `true`, gli header di identità di Tailscale Serve possono soddisfare l'autenticazione di Control UI/WebSocket (verificata tramite `tailscale whois`). Gli endpoint API HTTP **non** usano quell'autenticazione tramite header Tailscale; seguono invece la normale modalità di autenticazione HTTP del gateway. Questo flusso senza token presuppone che l'host del gateway sia attendibile. Il valore predefinito è `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitatore opzionale per autenticazioni fallite. Si applica per IP client e per ambito di autenticazione (shared-secret e device-token sono tracciati indipendentemente). I tentativi bloccati restituiscono `429` + `Retry-After`.
  - Nel percorso asincrono Control UI di Tailscale Serve, i tentativi falliti per lo stesso `{scope, clientIp}` vengono serializzati prima della scrittura dell'errore. I tentativi errati concorrenti dallo stesso client possono quindi far scattare il limitatore alla seconda richiesta invece di passare entrambi in gara come semplici mancate corrispondenze.
  - `gateway.auth.rateLimit.exemptLoopback` è predefinito a `true`; imposta `false` quando vuoi intenzionalmente limitare anche il traffico localhost (per configurazioni di test o distribuzioni proxy rigorose).
- I tentativi di autenticazione WS con origine browser sono sempre limitati, con l'esenzione loopback disabilitata (difesa in profondità contro brute force localhost basati su browser).
- Su loopback, quei blocchi con origine browser sono isolati per valore `Origin`
  normalizzato, quindi fallimenti ripetuti da un'origine localhost non bloccano
  automaticamente un'origine diversa.
- `tailscale.mode`: `serve` (solo tailnet, bind loopback) o `funnel` (pubblico, richiede autenticazione).
- `tailscale.serviceName`: nome opzionale del servizio Tailscale per la modalità Serve, come
  `svc:openclaw`. Quando impostato, OpenClaw lo passa a `tailscale serve
--service` così la Control UI può essere esposta tramite un Service denominato invece
  del nome host del dispositivo. Il valore deve usare il formato nome Service
  `svc:<dns-label>` di Tailscale; l'avvio segnala l'URL del Service derivato.
- `tailscale.preserveFunnel`: quando `true` e `tailscale.mode = "serve"`, OpenClaw
  controlla `tailscale funnel status` prima di riapplicare Serve all'avvio e lo salta
  se una route Funnel configurata esternamente copre già la porta del gateway.
  Predefinito `false`.
- `controlUi.allowedOrigins`: allowlist esplicita delle origini browser per le connessioni WebSocket al Gateway. Richiesta per origini browser pubbliche non-loopback. I caricamenti UI privati same-origin da LAN/Tailnet da loopback, RFC1918/link-local, `.local`, `.ts.net` o host Tailscale CGNAT sono accettati senza abilitare il fallback dell'header Host.
- `controlUi.chatMessageMaxWidth`: larghezza massima opzionale per i messaggi chat raggruppati della Control UI. Accetta valori di larghezza CSS vincolati come `960px`, `82%`, `min(1280px, 82%)` e `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modalità pericolosa che abilita il fallback dell'origine basato sull'header Host per distribuzioni che si affidano intenzionalmente alla policy di origine dell'header Host.
- `remote.transport`: `ssh` (predefinito) o `direct` (ws/wss). Per `direct`, `remote.url` deve essere `wss://` per host pubblici; `ws://` in chiaro è accettato solo per loopback, LAN, link-local, `.local`, `.ts.net` e host Tailscale CGNAT.
- `remote.remotePort`: porta del gateway sull'host SSH remoto. Predefinita a `18789`; usala quando la porta del tunnel locale è diversa dalla porta del gateway remoto.
- `gateway.remote.token` / `.password` sono campi credenziale del client remoto. Da soli non configurano l'autenticazione del gateway.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base per il relay APNs esterno usato dopo che le build iOS supportate dal relay pubblicano le registrazioni sul gateway. Le build pubbliche dell'App Store usano il relay OpenClaw ospitato. Gli URL di relay personalizzati devono corrispondere a un percorso di build/distribuzione iOS deliberatamente separato il cui URL di relay punti a quel relay.
- `gateway.push.apns.relay.timeoutMs`: timeout di invio gateway-to-relay in millisecondi. Predefinito a `10000`.
- Le registrazioni supportate dal relay sono delegate a una specifica identità del gateway. L'app iOS associata recupera `gateway.identity.get`, include quell'identità nella registrazione del relay e inoltra al gateway una concessione di invio con ambito di registrazione. Un altro gateway non può riutilizzare quella registrazione salvata.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env temporanei per la configurazione del relay sopra.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: via di fuga solo per sviluppo per URL relay HTTP loopback. Gli URL relay di produzione dovrebbero restare su HTTPS.
- `gateway.handshakeTimeoutMs`: timeout dell'handshake WebSocket pre-autenticazione del Gateway in millisecondi. Predefinito: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ha precedenza quando impostato. Aumentalo su host carichi o a bassa potenza dove i client locali possono connettersi mentre il warmup di avvio si sta ancora stabilizzando.
- `gateway.channelHealthCheckMinutes`: intervallo del monitoraggio salute del canale in minuti. Imposta `0` per disabilitare globalmente i riavvii del monitoraggio salute. Predefinito: `5`.
- `gateway.channelStaleEventThresholdMinutes`: soglia socket obsoleta in minuti. Mantienila maggiore o uguale a `gateway.channelHealthCheckMinutes`. Predefinito: `30`.
- `gateway.channelMaxRestartsPerHour`: numero massimo di riavvii del monitoraggio salute per canale/account in un'ora mobile. Predefinito: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per canale dai riavvii del monitoraggio salute mantenendo abilitato il monitor globale.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per account per canali multi-account. Quando impostato, ha precedenza sull'override a livello di canale.
- I percorsi di chiamata del gateway locale possono usare `gateway.remote.*` come fallback solo quando `gateway.auth.*` non è impostato.
- Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non risolto, la risoluzione fallisce in modo chiuso (nessun mascheramento tramite fallback remoto).
- `trustedProxies`: IP dei reverse proxy che terminano TLS o inseriscono header del client inoltrato. Elenca solo proxy che controlli. Le voci loopback restano valide per configurazioni proxy/rilevamento locale sullo stesso host (per esempio Tailscale Serve o un reverse proxy locale), ma **non** rendono le richieste loopback idonee per `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando `true`, il gateway accetta `X-Real-IP` se `X-Forwarded-For` è mancante. Predefinito `false` per un comportamento fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist CIDR/IP opzionale per approvare automaticamente il primo pairing del dispositivo nodo senza ambiti richiesti. È disabilitata quando non impostata. Questo non approva automaticamente il pairing di operatore/browser/Control UI/WebChat e non approva automaticamente aggiornamenti di ruolo, ambito, metadati o chiave pubblica.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: modellazione globale allow/deny per comandi nodo dichiarati dopo il pairing e la valutazione dell'allowlist della piattaforma. Usa `allowCommands` per abilitare esplicitamente comandi nodo pericolosi come `camera.snap`, `camera.clip` e `screen.record`; `denyCommands` rimuove un comando anche se un valore predefinito della piattaforma o un allow esplicito lo includerebbe altrimenti. Dopo che un nodo cambia la sua lista di comandi dichiarati, rifiuta e riapprova il pairing di quel dispositivo così il gateway salva lo snapshot dei comandi aggiornato.
- `gateway.tools.deny`: nomi di strumenti aggiuntivi bloccati per HTTP `POST /tools/invoke` (estende la lista deny predefinita).
- `gateway.tools.allow`: rimuove nomi di strumenti dalla lista deny HTTP predefinita per
  chiamanti owner/admin. Questo non promuove i chiamanti `operator.write`
  portatori di identità ad accesso owner/admin; `cron`, `gateway` e `nodes` restano
  non disponibili ai chiamanti non-owner anche quando sono in allowlist.

</Accordion>

### Endpoint compatibili con OpenAI

- RPC HTTP admin: disattivato per impostazione predefinita come plugin `admin-http-rpc`. Abilita il plugin per registrare `POST /api/v1/admin/rpc`. Vedi [RPC HTTP admin](/it/plugins/admin-http-rpc).
- Chat Completions: disabilitato per impostazione predefinita. Abilita con `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Hardening dell'input URL per Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Le allowlist vuote sono trattate come non impostate; usa `gateway.http.endpoints.responses.files.allowUrl=false`
    e/o `gateway.http.endpoints.responses.images.allowUrl=false` per disabilitare il recupero degli URL.
- Header opzionale di hardening della risposta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (imposta solo per origini HTTPS che controlli; vedi [Autenticazione tramite proxy attendibile](/it/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento multi-istanza

Esegui più gateway su un host con porte e directory di stato univoche:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flag di comodità: `--dev` (usa `~/.openclaw-dev` + porta `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

Vedi [Gateway multipli](/it/gateway/multiple-gateways).

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

- `enabled`: abilita la terminazione TLS sul listener del gateway (HTTPS/WSS) (predefinito: `false`).
- `autoGenerate`: genera automaticamente una coppia cert/key locale autofirmata quando non sono configurati file espliciti; solo per uso locale/dev.
- `certPath`: percorso del filesystem al file del certificato TLS.
- `keyPath`: percorso del filesystem al file della chiave privata TLS; mantieni permessi restrittivi.
- `caPath`: percorso opzionale del bundle CA per la verifica client o catene di trust personalizzate.

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

- `mode`: controlla come le modifiche alla configurazione vengono applicate a runtime.
  - `"off"`: ignora le modifiche live; le modifiche richiedono un riavvio esplicito.
  - `"restart"`: riavvia sempre il processo Gateway al cambio di configurazione.
  - `"hot"`: applica le modifiche nel processo senza riavviare.
  - `"hybrid"` (predefinito): prova prima il ricaricamento hot; ripiega sul riavvio se necessario.
- `debounceMs`: finestra di debounce in ms prima che le modifiche alla configurazione vengano applicate (intero non negativo).
- `deferralTimeoutMs`: tempo massimo facoltativo in ms da attendere per le operazioni in corso prima di forzare un riavvio o il ricaricamento hot del canale. Omettilo per usare l'attesa limitata predefinita (`300000`); imposta `0` per attendere indefinitamente e registrare avvisi periodici sugli elementi ancora in sospeso.

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

Note di convalida e sicurezza:

- `hooks.enabled=true` richiede un `hooks.token` non vuoto.
- `hooks.token` dovrebbe essere distinto dall'autenticazione shared-secret attiva del Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); l'avvio registra un avviso di sicurezza non fatale quando rileva un riutilizzo.
- `openclaw security audit` segnala il riutilizzo dell'autenticazione hook/Gateway come rilievo critico, inclusa l'autenticazione tramite password del Gateway fornita solo al momento dell'audit (`--auth password --password <password>`). Esegui `openclaw doctor --fix` per ruotare un `hooks.token` persistente riutilizzato, quindi aggiorna i mittenti hook esterni affinché usino il nuovo token hook.
- `hooks.path` non può essere `/`; usa un sotto-percorso dedicato come `/hooks`.
- Se `hooks.allowRequestSessionKey=true`, limita `hooks.allowedSessionKeyPrefixes` (per esempio `["hook:"]`).
- Se una mappatura o un preset usa una `sessionKey` basata su template, imposta `hooks.allowedSessionKeyPrefixes` e `hooks.allowRequestSessionKey=true`. Le chiavi di mappatura statiche non richiedono questa abilitazione esplicita.

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` dal payload della richiesta viene accettato solo quando `hooks.allowRequestSessionKey=true` (predefinito: `false`).
- `POST /hooks/<name>` → risolto tramite `hooks.mappings`
  - I valori `sessionKey` della mappatura renderizzati da template sono trattati come forniti dall'esterno e richiedono anch'essi `hooks.allowRequestSessionKey=true`.

<Accordion title="Dettagli della mappatura">

- `match.path` corrisponde al sotto-percorso dopo `/hooks` (ad es. `/hooks/gmail` → `gmail`).
- `match.source` corrisponde a un campo del payload per percorsi generici.
- Template come `{{messages[0].subject}}` leggono dal payload.
- `transform` può puntare a un modulo JS/TS che restituisce un'azione hook.
  - `transform.module` deve essere un percorso relativo e rimanere all'interno di `hooks.transformsDir` (i percorsi assoluti e l'attraversamento vengono rifiutati).
  - Mantieni `hooks.transformsDir` sotto `~/.openclaw/hooks/transforms`; le directory Skills dell'area di lavoro vengono rifiutate. Se `openclaw doctor` segnala questo percorso come non valido, sposta il modulo di trasformazione nella directory delle trasformazioni hook oppure rimuovi `hooks.transformsDir`.
- `agentId` instrada a un agente specifico; gli ID sconosciuti ripiegano sull'agente predefinito.
- `allowedAgentIds`: limita l'instradamento effettivo degli agenti, incluso il percorso dell'agente predefinito quando `agentId` è omesso (`*` o omesso = consenti tutti, `[]` = nega tutti).
- `defaultSessionKey`: chiave di sessione fissa facoltativa per esecuzioni dell'agente hook senza `sessionKey` esplicita.
- `allowRequestSessionKey`: consente ai chiamanti di `/hooks/agent` e alle chiavi di sessione delle mappature guidate da template di impostare `sessionKey` (predefinito: `false`).
- `allowedSessionKeyPrefixes`: allowlist facoltativa di prefissi per valori `sessionKey` espliciti (richiesta + mappatura), ad es. `["hook:"]`. Diventa obbligatoria quando una mappatura o un preset usa una `sessionKey` basata su template.
- `deliver: true` invia la risposta finale a un canale; `channel` usa come predefinito `last`.
- `model` sovrascrive l'LLM per questa esecuzione hook (deve essere consentito se il catalogo dei modelli è impostato).

</Accordion>

### Integrazione Gmail

- Il preset Gmail integrato usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Se mantieni quell'instradamento per messaggio, imposta `hooks.allowRequestSessionKey: true` e limita `hooks.allowedSessionKeyPrefixes` in modo che corrisponda allo spazio dei nomi Gmail, per esempio `["hook:", "hook:gmail:"]`.
- Se ti serve `hooks.allowRequestSessionKey: false`, sovrascrivi invece il preset con una `sessionKey` statica al posto del valore predefinito basato su template.

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
- Bind non loopback: le route canvas richiedono l'autenticazione Gateway (token/password/trusted-proxy), come le altre superfici HTTP del Gateway.
- Le WebView Node in genere non inviano header di autenticazione; dopo che un nodo è associato e connesso, il Gateway pubblicizza URL di capability con ambito nodo per l'accesso canvas/A2UI.
- Gli URL di capability sono vincolati alla sessione WS del nodo attivo e scadono rapidamente. Il fallback basato su IP non viene usato.
- Inietta il client di ricaricamento live nell'HTML servito.
- Crea automaticamente un `index.html` iniziale quando è vuoto.
- Serve anche A2UI su `/__openclaw__/a2ui/`.
- Le modifiche richiedono un riavvio del Gateway.
- Disabilita il ricaricamento live per directory grandi o errori `EMFILE`.

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
- `off`: sopprime la pubblicità multicast LAN senza modificare l'abilitazione del Plugin.
- Il Plugin `bonjour` in bundle si avvia automaticamente sugli host macOS ed è opt-in su Linux, Windows e distribuzioni Gateway containerizzate.
- Il nome host usa come predefinito il nome host di sistema quando è un'etichetta DNS valida, ripiegando su `openclaw`. Sovrascrivi con `OPENCLAW_MDNS_HOSTNAME`.

### Ad area estesa (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Scrive una zona DNS-SD unicast in `~/.openclaw/dns/`. Per il rilevamento tra reti diverse, abbinala a un server DNS (CoreDNS consigliato) + DNS split Tailscale.

Configurazione: `openclaw dns setup --apply`.

---

## Ambiente

### `env` (variabili env inline)

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

- Le variabili env inline vengono applicate solo se nell'env del processo manca la chiave.
- File `.env`: `.env` della CWD + `~/.openclaw/.env` (nessuno dei due sovrascrive le variabili esistenti).
- `shellEnv`: importa le chiavi previste mancanti dal profilo della shell di login.
- Vedi [Ambiente](/it/help/environment) per la precedenza completa.

### Sostituzione delle variabili env

Fai riferimento alle variabili env in qualsiasi stringa di configurazione con `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Corrispondono solo nomi maiuscoli: `[A-Z_][A-Z0-9_]*`.
- Le variabili mancanti/vuote generano un errore al caricamento della configurazione.
- Usa l'escape con `$${VAR}` per un valore letterale `${VAR}`.
- Funziona con `$include`.

---

## Segreti

I riferimenti ai segreti sono additivi: i valori in testo normale continuano a funzionare.

### `SecretRef`

Usa una forma oggetto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validazione:

- pattern di `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- pattern dell'id con `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id con `source: "file"`: puntatore JSON assoluto (per esempio `"/providers/openai/apiKey"`)
- pattern dell'id con `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (supporta selettori in stile AWS `secret#json_key`)
- gli id con `source: "exec"` non devono contenere segmenti di percorso delimitati da slash `.` o `..` (per esempio `a/../b` viene rifiutato)

### Superficie delle credenziali supportata

- Matrice canonica: [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface)
- `secrets apply` punta ai percorsi delle credenziali supportati in `openclaw.json`.
- I riferimenti in `auth-profiles.json` sono inclusi nella risoluzione runtime e nella copertura di audit.

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
- Per impostazione predefinita, i percorsi comando con symlink vengono rifiutati. Imposta `allowSymlinkCommand: true` per consentire percorsi symlink validando al contempo il percorso di destinazione risolto.
- Se `trustedDirs` è configurato, il controllo delle directory attendibili si applica al percorso di destinazione risolto.
- L'ambiente figlio di `exec` è minimo per impostazione predefinita; passa esplicitamente le variabili richieste con `passEnv`.
- I riferimenti ai segreti vengono risolti al momento dell'attivazione in uno snapshot in memoria, poi i percorsi di richiesta leggono solo lo snapshot.
- Il filtro delle superfici attive si applica durante l'attivazione: i riferimenti non risolti su superfici abilitate causano il fallimento di avvio/ricaricamento, mentre le superfici inattive vengono saltate con diagnostica.

---

## Archiviazione auth

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
- `auth-profiles.json` supporta riferimenti a livello di valore (`keyRef` per `api_key`, `tokenRef` per `token`) per le modalità con credenziali statiche.
- Le mappe legacy piatte di `auth-profiles.json`, come `{ "provider": { "apiKey": "..." } }`, non sono un formato runtime; `openclaw doctor --fix` le riscrive in profili canonici con chiave API `provider:default`, con un backup `.legacy-flat.*.bak`.
- I profili in modalità OAuth (`auth.profiles.<id>.mode = "oauth"`) non supportano credenziali del profilo di autenticazione basate su SecretRef.
- Le credenziali runtime statiche provengono da snapshot risolti in memoria; le voci legacy statiche di `auth.json` vengono eliminate quando vengono rilevate.
- Le importazioni OAuth legacy provengono da `~/.openclaw/credentials/oauth.json`.
- Consulta [OAuth](/it/concepts/oauth).
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

- `billingBackoffHours`: backoff di base in ore quando un profilo fallisce a causa di veri errori
  di fatturazione/credito insufficiente (predefinito: `5`). Testo esplicito relativo alla fatturazione può
  comunque finire qui anche su risposte `401`/`403`, ma i matcher di testo specifici del provider
  restano limitati al provider che li possiede (per esempio OpenRouter
  `Key limit exceeded`). I messaggi HTTP `402` ritentabili relativi a finestra di utilizzo o
  limiti di spesa di organizzazione/workspace restano invece nel percorso `rate_limit`.
- `billingBackoffHoursByProvider`: override opzionali per provider per le ore di backoff di fatturazione.
- `billingMaxHours`: limite in ore per la crescita esponenziale del backoff di fatturazione (predefinito: `24`).
- `authPermanentBackoffMinutes`: backoff di base in minuti per errori `auth_permanent` ad alta confidenza (predefinito: `10`).
- `authPermanentMaxMinutes`: limite in minuti per la crescita del backoff `auth_permanent` (predefinito: `60`).
- `failureWindowHours`: finestra mobile in ore usata per i contatori di backoff (predefinito: `24`).
- `overloadedProfileRotations`: numero massimo di rotazioni dei profili di autenticazione dello stesso provider per errori di sovraccarico prima di passare al fallback del modello (predefinito: `1`). Forme di provider occupato come `ModelNotReadyException` finiscono qui.
- `overloadedBackoffMs`: ritardo fisso prima di ritentare una rotazione di provider/profilo sovraccarico (predefinito: `0`).
- `rateLimitedProfileRotations`: numero massimo di rotazioni dei profili di autenticazione dello stesso provider per errori di rate limit prima di passare al fallback del modello (predefinito: `1`). Quel bucket di rate limit include testo modellato dal provider come `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` e `resource exhausted`.

---

## Logging

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
- `consoleLevel` passa a `debug` quando si usa `--verbose`.
- `maxFileBytes`: dimensione massima del file di log attivo in byte prima della rotazione (intero positivo; predefinito: `104857600` = 100 MB). OpenClaw conserva fino a cinque archivi numerati accanto al file attivo.
- `redactSensitive` / `redactPatterns`: mascheramento best-effort per output della console, file di log, record di log OTLP e testo persistito della trascrizione della sessione. `redactSensitive: "off"` disabilita solo questa policy generale di log/trascrizioni; le superfici di sicurezza di UI/strumenti/diagnostica continuano a oscurare i segreti prima dell’emissione.

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

- `enabled`: interruttore principale per l’output della strumentazione (predefinito: `true`).
- `flags`: array di stringhe di flag che abilitano output di log mirato (supporta wildcard come `"telegram.*"` o `"*"`).
- `stuckSessionWarnMs`: soglia di età senza avanzamento in ms per classificare le sessioni di elaborazione a lunga durata come `session.long_running`, `session.stalled` o `session.stuck`. Risposta, strumento, stato, blocco e avanzamento ACP reimpostano il timer; le diagnostiche `session.stuck` ripetute applicano backoff finché non cambiano.
- `stuckSessionAbortMs`: soglia di età senza avanzamento in ms prima che il lavoro attivo bloccato idoneo possa essere drenato con interruzione per il ripristino. Se non impostata, OpenClaw usa la finestra incorporata estesa più sicura di almeno 5 minuti e 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: acquisisce uno snapshot di stabilità redatto prima di un OOM quando la pressione di memoria raggiunge `critical` (predefinito: `false`). Impostalo su `true` per aggiungere la scansione/scrittura del file del bundle di stabilità mantenendo gli eventi normali di pressione di memoria.
- `otel.enabled`: abilita la pipeline di esportazione OpenTelemetry (predefinito: `false`). Per la configurazione completa, il catalogo dei segnali e il modello di privacy, consulta [Esportazione OpenTelemetry](/it/gateway/opentelemetry).
- `otel.endpoint`: URL del collector per l’esportazione OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP opzionali specifici per segnale. Quando impostati, sovrascrivono `otel.endpoint` solo per quel segnale.
- `otel.protocol`: `"http/protobuf"` (predefinito) o `"grpc"`.
- `otel.headers`: header di metadati HTTP/gRPC aggiuntivi inviati con le richieste di esportazione OTel.
- `otel.serviceName`: nome del servizio per gli attributi delle risorse.
- `otel.traces` / `otel.metrics` / `otel.logs`: abilita l’esportazione di trace, metriche o log.
- `otel.logsExporter`: destinazione di esportazione dei log: `"otlp"` (predefinito), `"stdout"` per un oggetto JSON per riga stdout, oppure `"both"`.
- `otel.sampleRate`: tasso di campionamento dei trace `0`-`1`.
- `otel.flushIntervalMs`: intervallo di flush periodico della telemetria in ms.
- `otel.captureContent`: acquisizione opt-in del contenuto grezzo per gli attributi degli span OTEL. Disattivata per impostazione predefinita. Il booleano `true` acquisisce contenuto non di sistema di messaggi/strumenti; la forma oggetto consente di abilitare esplicitamente `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` e `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: interruttore di ambiente per la forma più recente sperimentale degli span di inferenza GenAI, inclusi nomi span `{gen_ai.operation.name} {gen_ai.request.model}`, tipo di span `CLIENT` e `gen_ai.provider.name` invece del legacy `gen_ai.system`. Per impostazione predefinita gli span mantengono `openclaw.model.call` e `gen_ai.system` per compatibilità; le metriche GenAI usano attributi semantici limitati.
- `OPENCLAW_OTEL_PRELOADED=1`: interruttore di ambiente per host che hanno già registrato un SDK OpenTelemetry globale. OpenClaw quindi salta l’avvio/arresto dell’SDK di proprietà del Plugin mantenendo attivi i listener diagnostici.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` e `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variabili d’ambiente endpoint specifiche per segnale usate quando la chiave di configurazione corrispondente non è impostata.
- `cacheTrace.enabled`: registra snapshot di trace della cache per esecuzioni incorporate (predefinito: `false`).
- `cacheTrace.filePath`: percorso di output per il JSONL del trace della cache (predefinito: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controllano cosa è incluso nell’output del trace della cache (tutti predefiniti: `true`).

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
- `checkOnStart`: verifica aggiornamenti npm all’avvio del Gateway (predefinito: `true`).
- `auto.enabled`: abilita l’aggiornamento automatico in background per installazioni da pacchetto (predefinito: `false`).
- `auto.stableDelayHours`: ritardo minimo in ore prima dell’applicazione automatica sul canale stabile (predefinito: `6`; max: `168`).
- `auto.stableJitterHours`: finestra aggiuntiva in ore per distribuire il rollout del canale stabile (predefinito: `12`; max: `168`).
- `auto.betaCheckIntervalHours`: frequenza in ore con cui vengono eseguiti i controlli del canale beta (predefinito: `1`; max: `24`).

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
- `dispatch.enabled`: gate indipendente per il dispatch dei turni di sessione ACP (predefinito: `true`). Imposta `false` per mantenere disponibili i comandi ACP bloccando l’esecuzione.
- `backend`: id del backend runtime ACP predefinito (deve corrispondere a un Plugin runtime ACP registrato).
  Installa prima il Plugin di backend e, se `plugins.allow` è impostato, includi l’id del Plugin di backend (per esempio `acpx`) altrimenti il backend ACP non verrà caricato.
- `defaultAgent`: id dell’agente ACP di fallback quando gli spawn non specificano un target esplicito.
- `allowedAgents`: allowlist di id agente consentiti per le sessioni runtime ACP; vuoto significa nessuna restrizione aggiuntiva.
- `maxConcurrentSessions`: numero massimo di sessioni ACP attive contemporaneamente.
- `stream.coalesceIdleMs`: finestra di flush inattivo in ms per testo in streaming.
- `stream.maxChunkChars`: dimensione massima del chunk prima di suddividere la proiezione del blocco in streaming.
- `stream.repeatSuppression`: sopprime righe di stato/strumenti ripetute per turno (predefinito: `true`).
- `stream.deliveryMode`: `"live"` invia in streaming in modo incrementale; `"final_only"` bufferizza fino agli eventi terminali del turno.
- `stream.hiddenBoundarySeparator`: separatore prima del testo visibile dopo eventi strumento nascosti (predefinito: `"paragraph"`).
- `stream.maxOutputChars`: numero massimo di caratteri di output dell’assistente proiettati per turno ACP.
- `stream.maxSessionUpdateChars`: numero massimo di caratteri per righe ACP di stato/aggiornamento proiettate.
- `stream.tagVisibility`: record di nomi tag verso override booleani di visibilità per eventi in streaming.
- `runtime.ttlMinutes`: TTL di inattività in minuti per worker di sessione ACP prima della pulizia idonea.
- `runtime.installCommand`: comando di installazione opzionale da eseguire durante il bootstrap di un ambiente runtime ACP.

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

- `cli.banner.taglineMode` controlla lo stile dello slogan del banner:
  - `"random"` (predefinito): slogan divertenti/stagionali a rotazione.
  - `"default"`: slogan neutro fisso (`All your chats, one OpenClaw.`).
  - `"off"`: nessun testo di slogan (titolo/versione del banner ancora mostrati).
- Per nascondere l'intero banner (non solo gli slogan), imposta la variabile d'ambiente `OPENCLAW_HIDE_BANNER=1`.

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

Le build attuali non includono più il bridge TCP. I nodi si connettono tramite il WebSocket del Gateway. Le chiavi `bridge.*` non fanno più parte dello schema di configurazione (la validazione fallisce finché non vengono rimosse; `openclaw doctor --fix` può eliminare le chiavi sconosciute).

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
    maxConcurrentRuns: 8, // predefinito; dispatch cron + esecuzione isolata di turni agente cron
    webhook: "https://example.invalid/legacy", // fallback deprecato per job memorizzati con notify:true
    webhookToken: "replace-with-dedicated-token", // token bearer opzionale per l'autenticazione webhook in uscita
    sessionRetention: "24h", // stringa di durata o false
    runLog: {
      maxBytes: "2mb", // predefinito 2_000_000 byte
      keepLines: 2000, // predefinito 2000
    },
  },
}
```

- `sessionRetention`: per quanto tempo conservare le sessioni isolate completate delle esecuzioni cron prima della rimozione da `sessions.json`. Controlla anche la pulizia delle trascrizioni cron eliminate archiviate. Predefinito: `24h`; imposta `false` per disabilitare.
- `runLog.maxBytes`: accettato per compatibilità con i log di esecuzione cron più vecchi basati su file. Predefinito: `2_000_000` byte.
- `runLog.keepLines`: righe più recenti della cronologia di esecuzione SQLite conservate per job. Predefinito: `2000`.
- `webhookToken`: token bearer usato per la consegna POST dei Webhook cron (`delivery.mode = "webhook"`); se omesso, non viene inviato alcun header di autenticazione.
- `webhook`: URL Webhook legacy deprecato di fallback (http/https) usato da `openclaw doctor --fix` per migrare job memorizzati che hanno ancora `notify: true`; la consegna runtime usa `delivery.mode="webhook"` per job più `delivery.to`, oppure `delivery.completionDestination` quando preserva la consegna degli annunci.

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

- `maxAttempts`: numero massimo di tentativi per i job cron in caso di errori transitori (predefinito: `3`; intervallo: `0`-`10`).
- `backoffMs`: array di ritardi di backoff in ms per ogni nuovo tentativo (predefinito: `[30000, 60000, 300000]`; 1-10 voci).
- `retryOn`: tipi di errore che attivano i nuovi tentativi - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Ometti per ritentare tutti i tipi transitori.

I job una tantum restano abilitati finché i tentativi non sono esauriti, poi vengono disabilitati mantenendo lo stato di errore finale. I job ricorrenti usano la stessa policy di nuovo tentativo transitorio per rieseguire dopo il backoff prima della successiva finestra pianificata; gli errori permanenti o i tentativi transitori esauriti tornano alla normale pianificazione ricorrente con backoff di errore.

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

- `enabled`: abilita gli avvisi di errore per i job cron (predefinito: `false`).
- `after`: errori consecutivi prima dell'invio di un avviso (intero positivo, min: `1`).
- `cooldownMs`: millisecondi minimi tra avvisi ripetuti per lo stesso job (intero non negativo).
- `includeSkipped`: conta le esecuzioni saltate consecutive verso la soglia di avviso (predefinito: `false`). Le esecuzioni saltate sono tracciate separatamente e non influiscono sul backoff degli errori di esecuzione.
- `mode`: modalità di consegna - `"announce"` invia tramite un messaggio di canale; `"webhook"` pubblica sul Webhook configurato.
- `accountId`: account o id canale opzionale per limitare l'ambito della consegna degli avvisi.

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

- Destinazione predefinita per le notifiche di errore cron su tutti i job.
- `mode`: `"announce"` o `"webhook"`; il valore predefinito è `"announce"` quando esistono dati di destinazione sufficienti.
- `channel`: override del canale per la consegna degli annunci. `"last"` riutilizza l'ultimo canale di consegna noto.
- `to`: destinazione annuncio esplicita o URL Webhook. Richiesto per la modalità Webhook.
- `accountId`: override account opzionale per la consegna.
- `delivery.failureDestination` per job sovrascrive questo valore predefinito globale.
- Quando non è impostata né una destinazione di errore globale né una per job, i job che consegnano già tramite `announce` usano come fallback quella destinazione primaria di annuncio in caso di errore.
- `delivery.failureDestination` è supportato solo per job `sessionTarget="isolated"`, a meno che il `delivery.mode` primario del job non sia `"webhook"`.

Vedi [Job Cron](/it/automation/cron-jobs). Le esecuzioni cron isolate sono tracciate come [attività in background](/it/automation/tasks).

---

## Variabili del template del modello multimediale

Placeholder di template espansi in `tools.media.models[].args`:

| Variabile          | Descrizione                                          |
| ------------------ | ---------------------------------------------------- |
| `{{Body}}`         | Corpo completo del messaggio in ingresso             |
| `{{RawBody}}`      | Corpo grezzo (senza wrapper di cronologia/mittente)  |
| `{{BodyStripped}}` | Corpo con menzioni di gruppo rimosse                 |
| `{{From}}`         | Identificatore del mittente                          |
| `{{To}}`           | Identificatore della destinazione                    |
| `{{MessageSid}}`   | Id messaggio del canale                              |
| `{{SessionId}}`    | UUID della sessione corrente                         |
| `{{IsNewSession}}` | `"true"` quando viene creata una nuova sessione      |
| `{{MediaUrl}}`     | Pseudo-URL multimediale in ingresso                  |
| `{{MediaPath}}`    | Percorso multimediale locale                         |
| `{{MediaType}}`    | Tipo di media (immagine/audio/documento/...)         |
| `{{Transcript}}`   | Trascrizione audio                                   |
| `{{Prompt}}`       | Prompt multimediale risolto per le voci CLI          |
| `{{MaxChars}}`     | Numero massimo di caratteri di output risolto per le voci CLI |
| `{{ChatType}}`     | `"direct"` o `"group"`                               |
| `{{GroupSubject}}` | Oggetto del gruppo (best effort)                     |
| `{{GroupMembers}}` | Anteprima dei membri del gruppo (best effort)        |
| `{{SenderName}}`   | Nome visualizzato del mittente (best effort)         |
| `{{SenderE164}}`   | Numero di telefono del mittente (best effort)        |
| `{{Provider}}`     | Suggerimento provider (whatsapp, telegram, discord, ecc.) |

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
- Array di file: deep-merge in ordine (i successivi sovrascrivono i precedenti).
- Chiavi sorelle: unite dopo gli include (sovrascrivono i valori inclusi).
- Include annidati: fino a 10 livelli di profondità.
- Percorsi: risolti relativamente al file che include, ma devono rimanere all'interno della directory di configurazione di primo livello (`dirname` di `openclaw.json`). Le forme assolute/`../` sono consentite solo quando si risolvono comunque entro quel limite. I percorsi non devono contenere byte nulli e devono essere rigorosamente più brevi di 4096 caratteri prima e dopo la risoluzione.
- Le scritture di proprietà di OpenClaw che modificano solo una sezione di primo livello supportata da un include a file singolo scrivono direttamente su quel file incluso. Per esempio, `plugins install` aggiorna `plugins: { $include: "./plugins.json5" }` in `plugins.json5` e lascia intatto `openclaw.json`.
- Gli include radice, gli array di include e gli include con override di chiavi sorelle sono di sola lettura per le scritture di proprietà di OpenClaw; tali scritture falliscono in modo chiuso invece di appiattire la configurazione.
- Errori: messaggi chiari per file mancanti, errori di parsing, include circolari, formato percorso non valido e lunghezza eccessiva.

---

_Correlato: [Configurazione](/it/gateway/configuration) · [Esempi di configurazione](/it/gateway/configuration-examples) · [Doctor](/it/gateway/doctor)_

## Correlati

- [Configurazione](/it/gateway/configuration)
- [Esempi di configurazione](/it/gateway/configuration-examples)
