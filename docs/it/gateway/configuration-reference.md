---
read_when:
    - Servono la semantica esatta della configurazione a livello di campo o i valori predefiniti
    - Stai convalidando blocchi di configurazione di canale, modello, Gateway o strumento
summary: Riferimento alla configurazione del Gateway per le chiavi fondamentali di OpenClaw, i valori predefiniti e i collegamenti ai riferimenti dedicati dei sottosistemi
title: Riferimento di configurazione
x-i18n:
    generated_at: "2026-05-10T19:34:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71a9b9ba64b334086a3e32fd9255eb45f9089818a1798a4d542d39d586d53fd9
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Riferimento alla configurazione di base per `~/.openclaw/openclaw.json`. Per una panoramica orientata alle attività, vedi [Configurazione](/it/gateway/configuration).

Copre le principali superfici di configurazione di OpenClaw e rimanda ad altri riferimenti quando un sottosistema ha un proprio approfondimento. I cataloghi dei comandi gestiti da canali e Plugin e le opzioni avanzate di memoria/QMD risiedono nelle rispettive pagine, invece che in questa.

Fonte del codice:

- `openclaw config schema` stampa lo schema JSON live usato per la validazione e la Control UI, con metadati bundled/Plugin/canale uniti quando disponibili
- `config.schema.lookup` restituisce un singolo nodo dello schema limitato al percorso per gli strumenti di approfondimento
- `pnpm config:docs:check` / `pnpm config:docs:gen` validano l'hash della baseline della documentazione di configurazione rispetto alla superficie dello schema corrente

Percorso di lookup dell'agente: usa l'azione dello strumento `gateway` `config.schema.lookup` per
documentazione e vincoli esatti a livello di campo prima delle modifiche. Usa
[Configurazione](/it/gateway/configuration) per una guida orientata alle attività e questa pagina
per la mappa dei campi più ampia, i valori predefiniti e i link ai riferimenti dei sottosistemi.

Riferimenti approfonditi dedicati:

- [Riferimento alla configurazione della memoria](/it/reference/memory-config) per `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e configurazione di Dreaming sotto `plugins.entries.memory-core.config.dreaming`
- [Comandi slash](/it/tools/slash-commands) per il catalogo corrente dei comandi integrati + bundled
- pagine dei canali/Plugin proprietari per le superfici dei comandi specifiche del canale

Il formato di configurazione è **JSON5** (commenti + virgole finali consentiti). Tutti i campi sono facoltativi: OpenClaw usa valori predefiniti sicuri quando vengono omessi.

---

## Canali

Le chiavi di configurazione per canale sono state spostate in una pagina dedicata: vedi
[Configurazione - canali](/it/gateway/config-channels) per `channels.*`,
inclusi Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e altri
canali bundled (autenticazione, controllo accessi, multi-account, gating delle menzioni).

## Valori predefiniti degli agenti, multi-agente, sessioni e messaggi

Spostato in una pagina dedicata: vedi
[Configurazione - agenti](/it/gateway/config-agents) per:

- `agents.defaults.*` (workspace, modello, thinking, heartbeat, memoria, media, Skills, sandbox)
- `multiAgent.*` (routing e binding multi-agente)
- `session.*` (ciclo di vita della sessione, Compaction, potatura)
- `messages.*` (consegna dei messaggi, TTS, rendering markdown)
- `talk.*` (modalità Talk)
  - `talk.consultThinkingLevel`: override del livello di thinking per l'intera esecuzione dell'agente OpenClaw dietro le consulenze realtime di Control UI Talk
  - `talk.consultFastMode`: override fast-mode one-shot per le consulenze realtime di Control UI Talk
  - `talk.speechLocale`: id locale BCP 47 facoltativo per il riconoscimento vocale Talk su iOS/macOS
  - `talk.silenceTimeoutMs`: quando non impostato, Talk mantiene la finestra di pausa predefinita della piattaforma prima di inviare la trascrizione (`700 ms on macOS and Android, 900 ms on iOS`)

## Strumenti e provider personalizzati

La policy degli strumenti, i toggle sperimentali, la configurazione degli strumenti basata su provider e la configurazione di provider personalizzati / URL di base sono stati spostati in una pagina dedicata: vedi
[Configurazione - strumenti e provider personalizzati](/it/gateway/config-tools).

## Modelli

Le definizioni dei provider, le allowlist dei modelli e la configurazione dei provider personalizzati risiedono in
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
- `models.providers.*.localService`: gestore di processo on-demand facoltativo per
  server di modelli locali. OpenClaw verifica l'endpoint di integrità configurato, avvia
  il `command` assoluto quando necessario, attende la readiness, poi invia la richiesta del modello. Vedi [Servizi di modelli locali](/it/gateway/local-model-services).
- `models.pricing.enabled`: controlla il bootstrap dei prezzi in background che
  parte dopo che sidecar e canali raggiungono il percorso pronto del Gateway. Quando `false`,
  il Gateway salta i fetch dei cataloghi prezzi di OpenRouter e LiteLLM; i valori
  `models.providers.*.models[].cost` configurati continuano a funzionare per le stime dei costi locali.

## MCP

Le definizioni dei server MCP gestite da OpenClaw risiedono sotto `mcp.servers` e sono
consumate da Pi integrato e da altri adattatori runtime. I comandi `openclaw mcp list`,
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
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: definizioni di server MCP stdio o remoti nominati per runtime che
  espongono strumenti MCP configurati.
  Le voci remote usano `transport: "streamable-http"` o `transport: "sse"`;
  `type: "http"` è un alias nativo della CLI che `openclaw mcp set` e
  `openclaw doctor --fix` normalizzano nel campo canonico `transport`.
- `mcp.sessionIdleTtlMs`: TTL di inattività per runtime MCP bundled con ambito di sessione.
  Le esecuzioni integrate one-shot richiedono pulizia a fine esecuzione; questo TTL è il fallback per
  sessioni a lunga durata e futuri chiamanti.
- Le modifiche sotto `mcp.*` si applicano a caldo eliminando i runtime MCP di sessione in cache.
  La successiva discovery/uso degli strumenti li ricrea dalla nuova configurazione, quindi le voci
  `mcp.servers` rimosse vengono eliminate immediatamente invece di attendere il TTL di inattività.

Vedi [MCP](/it/cli/mcp#openclaw-as-an-mcp-client-registry) e
[backend CLI](/it/gateway/cli-backends#bundle-mcp-overlays) per il comportamento runtime.

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

- `allowBundled`: allowlist facoltativa solo per Skills bundled (Skills gestite/workspace non interessate).
- `load.extraDirs`: root di Skills condivise aggiuntive (precedenza più bassa).
- `load.allowSymlinkTargets`: root di destinazione reali attendibili in cui i symlink delle Skills possono
  risolversi quando il link risiede fuori dalla sua root sorgente configurata.
- `install.preferBrew`: quando true, preferisce gli installer Homebrew quando `brew` è
  disponibile prima di ricorrere ad altri tipi di installer.
- `install.nodeManager`: preferenza dell'installer Node per le specifiche
  `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: consente ai client Gateway `operator.admin`
  attendibili di installare archivi zip privati preparati tramite `skills.upload.*`
  (predefinito: false). Abilita solo il percorso degli archivi caricati; le installazioni normali da ClawHub
  non lo richiedono.
- `entries.<skillKey>.enabled: false` disabilita una Skill anche se bundled/installata.
- `entries.<skillKey>.apiKey`: comodità per Skills che dichiarano una variabile env primaria (stringa in chiaro o oggetto SecretRef).

---

## Plugin

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    bundledDiscovery: "allowlist",
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

- Caricati da `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, più `plugins.load.paths`.
- La discovery accetta Plugin OpenClaw nativi più bundle Codex compatibili e bundle Claude, inclusi bundle Claude con layout predefinito senza manifest.
- **Le modifiche alla configurazione richiedono un riavvio del gateway.**
- `allow`: allowlist facoltativa (vengono caricati solo i Plugin elencati). `deny` prevale.
- `bundledDiscovery`: predefinito a `"allowlist"` per le nuove configurazioni, quindi un
  `plugins.allow` non vuoto controlla anche i Plugin provider bundled, inclusi i provider runtime
  di ricerca web. Doctor scrive `"compat"` per le configurazioni con allowlist legacy migrate
  per preservare il comportamento esistente dei provider bundled finché non scegli di aderire.
- `plugins.entries.<id>.apiKey`: campo di comodità per chiave API a livello di Plugin (quando supportato dal Plugin).
- `plugins.entries.<id>.env`: mappa di variabili env con ambito Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, il core blocca `before_prompt_build` e ignora i campi che mutano il prompt da `before_agent_start` legacy, preservando al contempo `modelOverride` e `providerOverride` legacy. Si applica agli hook dei Plugin nativi e alle directory hook fornite da bundle supportati.
- `plugins.entries.<id>.hooks.allowConversationAccess`: quando `true`, Plugin non bundled attendibili possono leggere il contenuto grezzo della conversazione da hook tipizzati come `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` e `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: considera esplicitamente attendibile questo Plugin per richiedere override `provider` e `model` per esecuzione nelle esecuzioni di subagenti in background.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist facoltativa di target canonici `provider/model` per override di subagenti attendibili. Usa `"*"` solo quando vuoi intenzionalmente consentire qualsiasi modello.
- `plugins.entries.<id>.llm.allowModelOverride`: considera esplicitamente attendibile questo Plugin per richiedere override del modello per `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: allowlist facoltativa di target canonici `provider/model` per override di completamento LLM di Plugin attendibili. Usa `"*"` solo quando vuoi intenzionalmente consentire qualsiasi modello.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: considera esplicitamente attendibile questo Plugin per eseguire `api.runtime.llm.complete` su un id agente non predefinito.
- `plugins.entries.<id>.config`: oggetto di configurazione definito dal Plugin (validato dallo schema del Plugin OpenClaw nativo quando disponibile).
- Le impostazioni account/runtime del Plugin canale risiedono sotto `channels.<id>` e dovrebbero essere descritte dai metadati `channelConfigs` del manifest del Plugin proprietario, non da un registro centrale delle opzioni OpenClaw.

### Configurazione del Plugin harness Codex

Il Plugin bundled `codex` possiede le impostazioni dell'harness nativo del server app Codex sotto
`plugins.entries.codex.config`. Vedi
[Riferimento harness Codex](/it/plugins/codex-harness-reference) per l'intera superficie di configurazione
e [harness Codex](/it/plugins/codex-harness) per il modello runtime.

`codexPlugins` si applica solo alle sessioni che selezionano l'harness Codex nativo.
Non abilita i Plugin Codex per Pi, normali esecuzioni del provider OpenAI, binding di conversazione
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
            allow_destructive_actions: false,
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

- `plugins.entries.codex.config.codexPlugins.enabled`: abilita il supporto nativo per
  plugin/app Codex per l'harness Codex. Predefinito: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  criterio predefinito per le azioni distruttive per le elicitazioni delle app
  plugin migrate. Predefinito: `false`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: abilita una
  voce plugin migrata quando anche `codexPlugins.enabled` globale è true.
  Predefinito: `true` per le voci esplicite.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  identità stabile del marketplace. V1 supporta solo `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: identità
  stabile del plugin Codex dalla migrazione, per esempio `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  override per-plugin per le azioni distruttive. Quando omesso, viene usato il
  valore globale `allow_destructive_actions`.

`codexPlugins.enabled` è la direttiva di abilitazione globale. Le voci plugin
esplicite scritte dalla migrazione sono l'insieme durevole di installazione e
idoneità alla riparazione. `plugins["*"]` non è supportato, non esiste uno
switch `install`, e i valori locali `marketplacePath` non sono intenzionalmente
campi di configurazione perché sono specifici dell'host.

I controlli di prontezza `app/list` vengono memorizzati nella cache per un'ora e
aggiornati in modo asincrono quando diventano obsoleti. La configurazione app
del thread Codex viene calcolata alla creazione della sessione dell'harness
Codex, non a ogni turno; usa `/new`, `/reset` o un riavvio del gateway dopo aver
modificato la configurazione dei plugin nativi.

- `plugins.entries.firecrawl.config.webFetch`: impostazioni del provider di recupero web Firecrawl.
  - `apiKey`: chiave API Firecrawl (accetta SecretRef). Ripiega su `plugins.entries.firecrawl.config.webSearch.apiKey`, sul valore legacy `tools.web.fetch.firecrawl.apiKey` o sulla variabile env `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL di base dell'API Firecrawl (predefinito: `https://api.firecrawl.dev`; gli override self-hosted devono puntare a endpoint privati/interni).
  - `onlyMainContent`: estrae solo il contenuto principale dalle pagine (predefinito: `true`).
  - `maxAgeMs`: età massima della cache in millisecondi (predefinito: `172800000` / 2 giorni).
  - `timeoutSeconds`: timeout della richiesta di scraping in secondi (predefinito: `60`).
- `plugins.entries.xai.config.xSearch`: impostazioni di xAI X Search (ricerca web Grok).
  - `enabled`: abilita il provider X Search.
  - `model`: modello Grok da usare per la ricerca (ad es. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: impostazioni di dreaming della memoria. Consulta [Dreaming](/it/concepts/dreaming) per fasi e soglie.
  - `enabled`: switch principale del dreaming (predefinito `false`).
  - `frequency`: cadenza cron per ogni scansione completa di dreaming (`"0 3 * * *"` per impostazione predefinita).
  - `model`: override facoltativo del modello del sottoagente Dream Diary. Richiede `plugins.entries.memory-core.subagent.allowModelOverride: true`; abbinalo a `allowedModels` per limitare le destinazioni. Gli errori di modello non disponibile riprovano una volta con il modello predefinito della sessione; gli errori di attendibilità o allowlist non effettuano fallback silenziosi.
  - il criterio di fase e le soglie sono dettagli di implementazione (non chiavi di configurazione esposte all'utente).
- La configurazione completa della memoria si trova in [Riferimento della configurazione della memoria](/it/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- I plugin del bundle Claude abilitati possono anche contribuire impostazioni predefinite Pi incorporate da `settings.json`; OpenClaw le applica come impostazioni agente sanificate, non come patch grezze alla configurazione OpenClaw.
- `plugins.slots.memory`: scegli l'id del plugin di memoria attivo, oppure `"none"` per disabilitare i plugin di memoria.
- `plugins.slots.contextEngine`: scegli l'id del plugin del motore di contesto attivo; il valore predefinito è `"legacy"` a meno che tu non installi e selezioni un altro motore.

Consulta [Plugin](/it/tools/plugin).

---

## Impegni

`commitments` controlla la memoria di follow-up dedotta: OpenClaw può rilevare check-in dai turni di conversazione e consegnarli tramite esecuzioni heartbeat.

- `commitments.enabled`: abilita estrazione LLM nascosta, archiviazione e consegna heartbeat degli impegni di follow-up dedotti. Predefinito: `false`.
- `commitments.maxPerDay`: numero massimo di impegni di follow-up dedotti consegnati per sessione agente in un giorno mobile. Predefinito: `3`.

Consulta [Impegni dedotti](/it/concepts/commitments).

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
- `tabCleanup` recupera le schede tracciate dell'agente primario dopo il tempo
  di inattività o quando una sessione supera il suo limite. Imposta
  `idleMinutes: 0` o `maxTabsPerSession: 0` per disabilitare quelle singole
  modalità di pulizia.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` è disabilitato quando non è impostato, quindi la navigazione del browser resta rigorosa per impostazione predefinita.
- Imposta `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` solo quando consideri intenzionalmente attendibile la navigazione del browser sulla rete privata.
- In modalità rigorosa, gli endpoint dei profili CDP remoti (`profiles.*.cdpUrl`) sono soggetti allo stesso blocco della rete privata durante i controlli di raggiungibilità/rilevamento.
- `ssrfPolicy.allowPrivateNetwork` resta supportato come alias legacy.
- In modalità rigorosa, usa `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` per eccezioni esplicite.
- I profili remoti sono solo attach-only (avvio/arresto/reset disabilitati).
- `profiles.*.cdpUrl` accetta `http://`, `https://`, `ws://` e `wss://`.
  Usa HTTP(S) quando vuoi che OpenClaw rilevi `/json/version`; usa WS(S)
  quando il tuo provider ti fornisce un URL WebSocket DevTools diretto.
- `remoteCdpTimeoutMs` e `remoteCdpHandshakeTimeoutMs` si applicano alla
  raggiungibilità CDP remota e `attachOnly` più alle richieste di apertura
  schede. I profili local loopback gestiti mantengono i valori predefiniti CDP
  locali.
- Se un servizio CDP gestito esternamente è raggiungibile tramite loopback,
  imposta `attachOnly: true` per quel profilo; altrimenti OpenClaw tratta la
  porta loopback come un profilo browser gestito localmente e può segnalare
  errori di proprietà della porta locale.
- I profili `existing-session` usano Chrome MCP invece di CDP e possono collegarsi
  sull'host selezionato o tramite un nodo browser connesso.
- I profili `existing-session` possono impostare `userDataDir` per indirizzare un
  profilo browser specifico basato su Chromium, come Brave o Edge.
- I profili `existing-session` mantengono gli attuali limiti di routing di Chrome MCP:
  azioni guidate da snapshot/ref invece del targeting tramite selettori CSS,
  hook di caricamento di un solo file, nessun override del timeout delle finestre
  di dialogo, nessun `wait --load networkidle` e nessun `responsebody`,
  esportazione PDF, intercettazione download o azioni batch.
- I profili `openclaw` locali gestiti assegnano automaticamente `cdpPort` e
  `cdpUrl`; imposta esplicitamente `cdpUrl` solo per CDP remoto.
- I profili locali gestiti possono impostare `executablePath` per sovrascrivere
  il valore globale `browser.executablePath` per quel profilo. Usalo per eseguire
  un profilo in Chrome e un altro in Brave.
- I profili locali gestiti usano `browser.localLaunchTimeoutMs` per il rilevamento
  HTTP CDP di Chrome dopo l'avvio del processo e `browser.localCdpReadyTimeoutMs`
  per la prontezza del websocket CDP post-avvio. Aumentali su host più lenti
  dove Chrome si avvia correttamente ma i controlli di prontezza entrano in gara
  con l'avvio. Entrambi i valori devono essere interi positivi fino a `120000`
  ms; i valori di configurazione non validi vengono rifiutati.
- Ordine di rilevamento automatico: browser predefinito se basato su Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` e `browser.profiles.<name>.executablePath` accettano entrambi
  `~` e `~/...` per la directory home del tuo OS prima dell'avvio di Chromium.
  Anche `userDataDir` per profilo sui profili `existing-session` viene espanso con tilde.
- Servizio di controllo: solo loopback (porta derivata da `gateway.port`, predefinita `18791`).
- `extraArgs` aggiunge flag di avvio aggiuntivi all'avvio locale di Chromium (per esempio
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

- `seamColor`: colore di accento per il chrome UI dell'app nativa (tinta della bolla Talk Mode, ecc.).
- `assistant`: override dell'identità della Control UI. Ripiega sull'identità dell'agente attivo.

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
      url: "ws://gateway.tailnet:18789",
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
      // Remove tools from the default HTTP deny list
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

<Accordion title="Dettagli dei campi Gateway">

- `mode`: `local` (esegue il gateway) o `remote` (si connette al gateway remoto). Gateway rifiuta di avviarsi a meno che non sia `local`.
- `port`: singola porta multiplex per WS + HTTP. Precedenza: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predefinito), `lan` (`0.0.0.0`), `tailnet` (solo IP Tailscale) o `custom`.
- **Alias bind legacy**: usa i valori della modalità bind in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), non gli alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota Docker**: il bind predefinito `loopback` resta in ascolto su `127.0.0.1` all'interno del container. Con il networking bridge di Docker (`-p 18789:18789`), il traffico arriva su `eth0`, quindi il gateway non è raggiungibile. Usa `--network host`, oppure imposta `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) per restare in ascolto su tutte le interfacce.
- **Auth**: richiesto per impostazione predefinita. I bind non loopback richiedono l'autenticazione del gateway. In pratica ciò significa un token/password condiviso o un reverse proxy identity-aware con `gateway.auth.mode: "trusted-proxy"`. La procedura guidata di onboarding genera un token per impostazione predefinita.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` (inclusi SecretRef), imposta esplicitamente `gateway.auth.mode` su `token` o `password`. I flussi di avvio e di installazione/riparazione del servizio falliscono quando entrambi sono configurati e la modalità non è impostata.
- `gateway.auth.mode: "none"`: modalità esplicita senza autenticazione. Usala solo per configurazioni trusted local loopback; questa modalità non viene intenzionalmente proposta dai prompt di onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega l'autenticazione browser/utente a un reverse proxy identity-aware e considera attendibili gli header di identità provenienti da `gateway.trustedProxies` (vedi [Auth con proxy attendibile](/it/gateway/trusted-proxy-auth)). Questa modalità si aspetta per impostazione predefinita una sorgente proxy **non loopback**; i reverse proxy loopback sullo stesso host richiedono `gateway.auth.trustedProxy.allowLoopback = true` esplicito. I chiamanti interni sullo stesso host possono usare `gateway.auth.password` come fallback diretto locale; `gateway.auth.token` resta mutuamente esclusivo con la modalità trusted-proxy.
- `gateway.auth.allowTailscale`: quando `true`, gli header di identità Tailscale Serve possono soddisfare l'autenticazione della Control UI/WebSocket (verificata tramite `tailscale whois`). Gli endpoint API HTTP **non** usano quella autenticazione basata su header Tailscale; seguono invece la normale modalità di autenticazione HTTP del gateway. Questo flusso senza token presume che l'host del gateway sia attendibile. Il valore predefinito è `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limiter opzionale per autenticazioni non riuscite. Si applica per IP client e per ambito di autenticazione (shared-secret e device-token sono tracciati indipendentemente). I tentativi bloccati restituiscono `429` + `Retry-After`.
  - Nel percorso asincrono della Control UI Tailscale Serve, i tentativi non riusciti per lo stesso `{scope, clientIp}` vengono serializzati prima della scrittura del fallimento. Tentativi errati simultanei dallo stesso client possono quindi far scattare il limiter alla seconda richiesta invece di passare entrambi come semplici mismatch concorrenti.
  - `gateway.auth.rateLimit.exemptLoopback` ha valore predefinito `true`; impostalo a `false` quando vuoi intenzionalmente limitare anche il traffico localhost (per configurazioni di test o distribuzioni proxy rigorose).
- I tentativi di autenticazione WS con origine browser sono sempre sottoposti a throttling con esenzione loopback disabilitata (difesa in profondità contro brute force su localhost basati su browser).
- Su loopback, quei lockout con origine browser sono isolati per valore `Origin`
  normalizzato, quindi fallimenti ripetuti da un'origine localhost non bloccano
  automaticamente un'origine diversa.
- `tailscale.mode`: `serve` (solo tailnet, bind loopback) o `funnel` (pubblico, richiede autenticazione).
- `tailscale.preserveFunnel`: quando `true` e `tailscale.mode = "serve"`, OpenClaw
  controlla `tailscale funnel status` prima di riapplicare Serve all'avvio e lo salta
  se una route Funnel configurata esternamente copre già la porta del gateway.
  Valore predefinito `false`.
- `controlUi.allowedOrigins`: allowlist esplicita delle origini browser per le connessioni WebSocket al Gateway. Richiesta quando sono previsti client browser da origini non loopback.
- `controlUi.chatMessageMaxWidth`: larghezza massima opzionale per i messaggi chat raggruppati della Control UI. Accetta valori CSS vincolati di larghezza come `960px`, `82%`, `min(1280px, 82%)` e `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modalità pericolosa che abilita il fallback dell'origine basato sull'header Host per distribuzioni che si basano intenzionalmente sulla policy di origine dell'header Host.
- `remote.transport`: `ssh` (predefinito) o `direct` (ws/wss). Per `direct`, `remote.url` deve essere `ws://` o `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override break-glass
  dell'ambiente di processo lato client che consente `ws://` in chiaro verso IP
  di reti private attendibili; il valore predefinito resta solo loopback per il testo in chiaro. Non esiste un equivalente in `openclaw.json`
  e la configurazione di rete privata del browser, come
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, non influisce sui client
  WebSocket del Gateway.
- `gateway.remote.token` / `.password` sono campi credenziali del client remoto. Non configurano da soli l'autenticazione del gateway.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base per il relay APNs esterno usato dalle build iOS ufficiali/TestFlight dopo la pubblicazione sul gateway di registrazioni basate su relay. Questo URL deve corrispondere all'URL del relay compilato nella build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout di invio gateway-relay in millisecondi. Valore predefinito `10000`.
- Le registrazioni basate su relay vengono delegate a una specifica identità del gateway. L'app iOS abbinata recupera `gateway.identity.get`, include tale identità nella registrazione relay e inoltra al gateway una concessione di invio con ambito di registrazione. Un altro gateway non può riutilizzare quella registrazione archiviata.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env temporanei per la configurazione relay sopra.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: via di fuga solo per sviluppo per URL relay HTTP loopback. Gli URL relay di produzione devono restare su HTTPS.
- `gateway.handshakeTimeoutMs`: timeout dell'handshake WebSocket pre-auth del Gateway in millisecondi. Predefinito: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ha precedenza quando impostato. Aumentalo su host carichi o a bassa potenza in cui i client locali possono connettersi mentre il warmup di avvio si sta ancora stabilizzando.
- `gateway.channelHealthCheckMinutes`: intervallo del monitor di salute del canale in minuti. Imposta `0` per disabilitare globalmente i riavvii del monitor di salute. Predefinito: `5`.
- `gateway.channelStaleEventThresholdMinutes`: soglia di socket obsoleto in minuti. Mantienila maggiore o uguale a `gateway.channelHealthCheckMinutes`. Predefinito: `30`.
- `gateway.channelMaxRestartsPerHour`: numero massimo di riavvii del monitor di salute per canale/account in un'ora mobile. Predefinito: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per canale dai riavvii del monitor di salute mantenendo abilitato il monitor globale.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per account per canali multi-account. Quando impostato, ha precedenza sull'override a livello di canale.
- I percorsi di chiamata del gateway locale possono usare `gateway.remote.*` come fallback solo quando `gateway.auth.*` non è impostato.
- Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non viene risolto, la risoluzione fallisce in modo chiuso (nessun mascheramento tramite fallback remoto).
- `trustedProxies`: IP dei reverse proxy che terminano TLS o iniettano header del client inoltrato. Elenca solo proxy che controlli. Le voci loopback sono comunque valide per configurazioni proxy/rilevamento locale sullo stesso host (per esempio Tailscale Serve o un reverse proxy locale), ma **non** rendono le richieste loopback idonee per `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando `true`, il gateway accetta `X-Real-IP` se `X-Forwarded-For` manca. Predefinito `false` per un comportamento fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist CIDR/IP opzionale per approvare automaticamente il primo pairing del dispositivo nodo senza ambiti richiesti. È disabilitata quando non impostata. Questo non approva automaticamente il pairing di operatore/browser/Control UI/WebChat e non approva automaticamente aggiornamenti di ruolo, ambito, metadati o chiave pubblica.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: modellazione globale allow/deny per i comandi nodo dichiarati dopo il pairing e la valutazione della allowlist della piattaforma. Usa `allowCommands` per optare per comandi nodo pericolosi come `camera.snap`, `camera.clip` e `screen.record`; `denyCommands` rimuove un comando anche se un valore predefinito della piattaforma o un allow esplicito lo includerebbe altrimenti. Dopo che un nodo modifica il proprio elenco di comandi dichiarati, rifiuta e riapprova quel pairing del dispositivo in modo che il gateway memorizzi lo snapshot aggiornato dei comandi.
- `gateway.tools.deny`: nomi di tool aggiuntivi bloccati per HTTP `POST /tools/invoke` (estende la deny list predefinita).
- `gateway.tools.allow`: rimuove nomi di tool dalla deny list HTTP predefinita.

</Accordion>

### Endpoint compatibili con OpenAI

- Chat Completions: disabilitate per impostazione predefinita. Abilita con `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Rafforzamento dell'input URL di Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Le allowlist vuote vengono trattate come non impostate; usa `gateway.http.endpoints.responses.files.allowUrl=false`
    e/o `gateway.http.endpoints.responses.images.allowUrl=false` per disabilitare il recupero degli URL.
- Header opzionale di rafforzamento della risposta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (imposta solo per origini HTTPS che controlli; vedi [Auth con proxy attendibile](/it/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento multi-istanza

Esegui più gateway su un solo host con porte e directory di stato univoche:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flag di comodità: `--dev` (usa `~/.openclaw-dev` + porta `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

Vedi [Più Gateway](/it/gateway/multiple-gateways).

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

- `enabled`: abilita la terminazione TLS presso il listener del gateway (HTTPS/WSS) (predefinito: `false`).
- `autoGenerate`: genera automaticamente una coppia certificato/chiave locale autofirmata quando non sono configurati file espliciti; solo per uso locale/dev.
- `certPath`: percorso del filesystem al file del certificato TLS.
- `keyPath`: percorso del filesystem al file della chiave privata TLS; mantieni i permessi limitati.
- `caPath`: percorso opzionale del bundle CA per verifica client o catene di trust personalizzate.

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

- `mode`: controlla come vengono applicate le modifiche alla configurazione a runtime.
  - `"off"`: ignora le modifiche live; le modifiche richiedono un riavvio esplicito.
  - `"restart"`: riavvia sempre il processo gateway al cambio di configurazione.
  - `"hot"`: applica le modifiche in-process senza riavviare.
  - `"hybrid"` (predefinito): prova prima il reload hot; ripiega sul riavvio se necessario.
- `debounceMs`: finestra di debounce in ms prima che le modifiche alla configurazione vengano applicate (intero non negativo).
- `deferralTimeoutMs`: tempo massimo opzionale in ms per attendere le operazioni in corso prima di forzare un riavvio o un reload hot del canale. Omettilo per usare l'attesa limitata predefinita (`300000`); imposta `0` per attendere indefinitamente e registrare avvisi periodici ancora in sospeso.

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

Note su validazione e sicurezza:

- `hooks.enabled=true` richiede un `hooks.token` non vuoto.
- `hooks.token` deve essere **distinto** da `gateway.auth.token`; il riutilizzo del token del Gateway viene rifiutato.
- `hooks.path` non può essere `/`; usa un sottopercorso dedicato, ad esempio `/hooks`.
- Se `hooks.allowRequestSessionKey=true`, limita `hooks.allowedSessionKeyPrefixes` (ad esempio `["hook:"]`).
- Se una mappatura o un preset usa una `sessionKey` con template, imposta `hooks.allowedSessionKeyPrefixes` e `hooks.allowRequestSessionKey=true`. Le chiavi di mappatura statiche non richiedono questo opt-in.

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` dal payload della richiesta viene accettato solo quando `hooks.allowRequestSessionKey=true` (predefinito: `false`).
- `POST /hooks/<name>` → risolto tramite `hooks.mappings`
  - I valori `sessionKey` di mappatura renderizzati da template vengono trattati come forniti esternamente e richiedono anche `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` corrisponde al sottopercorso dopo `/hooks` (ad es. `/hooks/gmail` → `gmail`).
- `match.source` corrisponde a un campo del payload per percorsi generici.
- Template come `{{messages[0].subject}}` leggono dal payload.
- `transform` può puntare a un modulo JS/TS che restituisce un'azione hook.
  - `transform.module` deve essere un percorso relativo e resta all'interno di `hooks.transformsDir` (i percorsi assoluti e l'attraversamento vengono rifiutati).
  - Mantieni `hooks.transformsDir` sotto `~/.openclaw/hooks/transforms`; le directory Skills dell'area di lavoro vengono rifiutate. Se `openclaw doctor` segnala questo percorso come non valido, sposta il modulo di trasformazione nella directory delle trasformazioni degli hook o rimuovi `hooks.transformsDir`.
- `agentId` instrada a un agente specifico; gli ID sconosciuti ripiegano sul predefinito.
- `allowedAgentIds`: limita l'instradamento esplicito (`*` o omesso = consenti tutto, `[]` = nega tutto).
- `defaultSessionKey`: chiave di sessione fissa facoltativa per le esecuzioni dell'agente hook senza `sessionKey` esplicita.
- `allowRequestSessionKey`: consente ai chiamanti di `/hooks/agent` e alle chiavi di sessione di mappatura guidate da template di impostare `sessionKey` (predefinito: `false`).
- `allowedSessionKeyPrefixes`: allowlist facoltativa dei prefissi per valori `sessionKey` espliciti (richiesta + mappatura), ad es. `["hook:"]`. Diventa obbligatoria quando una mappatura o un preset usa una `sessionKey` con template.
- `deliver: true` invia la risposta finale a un canale; `channel` usa `last` come valore predefinito.
- `model` sovrascrive l'LLM per questa esecuzione hook (deve essere consentito se il catalogo dei modelli è impostato).

</Accordion>

### Integrazione Gmail

- Il preset Gmail integrato usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Se mantieni quell'instradamento per messaggio, imposta `hooks.allowRequestSessionKey: true` e limita `hooks.allowedSessionKeyPrefixes` in modo che corrisponda allo spazio dei nomi Gmail, ad esempio `["hook:", "hook:gmail:"]`.
- Se hai bisogno di `hooks.allowRequestSessionKey: false`, sovrascrivi il preset con una `sessionKey` statica invece del valore predefinito con template.

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

- Gateway avvia automaticamente `gog gmail watch serve` all'avvio quando è configurato. Imposta `OPENCLAW_SKIP_GMAIL_WATCHER=1` per disabilitarlo.
- Non eseguire un `gog gmail watch serve` separato insieme al Gateway.

---

## Host del plugin Canvas

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

- Serve HTML/CSS/JS modificabili dall'agente e A2UI su HTTP sotto la porta del Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Solo locale: mantieni `gateway.bind: "loopback"` (predefinito).
- Bind non loopback: le route canvas richiedono l'autenticazione del Gateway (token/password/trusted-proxy), come le altre superfici HTTP del Gateway.
- Le WebView Node in genere non inviano intestazioni di autenticazione; dopo che un nodo è associato e connesso, il Gateway pubblicizza URL di capability con ambito nodo per l'accesso canvas/A2UI.
- Gli URL di capability sono vincolati alla sessione WS del nodo attivo e scadono rapidamente. Il fallback basato su IP non viene usato.
- Inietta il client live-reload nell'HTML servito.
- Crea automaticamente uno starter `index.html` quando è vuoto.
- Serve anche A2UI su `/__openclaw__/a2ui/`.
- Le modifiche richiedono il riavvio del gateway.
- Disabilita il live reload per directory grandi o errori `EMFILE`.

---

## Individuazione

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

- `minimal` (predefinito quando il plugin `bonjour` incluso è abilitato): ometti `cliPath` + `sshPort` dai record TXT.
- `full`: includi `cliPath` + `sshPort`; la pubblicizzazione multicast LAN richiede comunque che il plugin `bonjour` incluso sia abilitato.
- `off`: sopprime la pubblicizzazione multicast LAN senza modificare l'abilitazione del plugin.
- Il plugin `bonjour` incluso si avvia automaticamente sugli host macOS ed è opt-in su Linux, Windows e distribuzioni Gateway containerizzate.
- Il nome host usa per impostazione predefinita il nome host di sistema quando è un'etichetta DNS valida, con fallback a `openclaw`. Sovrascrivi con `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Scrive una zona DNS-SD unicast sotto `~/.openclaw/dns/`. Per l'individuazione tra reti, abbina un server DNS (CoreDNS consigliato) + DNS split Tailscale.

Configurazione: `openclaw dns setup --apply`.

---

## Ambiente

### `env` (variabili di ambiente inline)

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

- Le variabili di ambiente inline vengono applicate solo se nell'ambiente del processo manca la chiave.
- File `.env`: `.env` nella CWD + `~/.openclaw/.env` (nessuno dei due sovrascrive le variabili esistenti).
- `shellEnv`: importa le chiavi previste mancanti dal profilo della tua shell di login.
- Vedi [Ambiente](/it/help/environment) per la precedenza completa.

### Sostituzione delle variabili di ambiente

Fai riferimento alle variabili di ambiente in qualsiasi stringa di configurazione con `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Corrispondono solo i nomi maiuscoli: `[A-Z_][A-Z0-9_]*`.
- Le variabili mancanti/vuote generano un errore al caricamento della configurazione.
- Usa l'escape con `$${VAR}` per un `${VAR}` letterale.
- Funziona con `$include`.

---

## Segreti

I riferimenti ai segreti sono additivi: i valori in testo normale continuano a funzionare.

### `SecretRef`

Usa una forma di oggetto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Convalida:

- Pattern di `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Pattern di id per `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id per `source: "file"`: puntatore JSON assoluto (ad esempio `"/providers/openai/apiKey"`)
- Pattern di id per `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- Gli id di `source: "exec"` non devono contenere segmenti di percorso delimitati da slash `.` o `..` (ad esempio `a/../b` viene rifiutato)

### Superficie delle credenziali supportata

- Matrice canonica: [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface)
- Le destinazioni di `secrets apply` supportano i percorsi delle credenziali di `openclaw.json`.
- I riferimenti di `auth-profiles.json` sono inclusi nella risoluzione runtime e nella copertura di audit.

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
- Il filtro della superficie attiva si applica durante l'attivazione: i riferimenti non risolti su superfici abilitate fanno fallire avvio/ricaricamento, mentre le superfici inattive vengono saltate con diagnostica.

---

## Archiviazione dell'autenticazione

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- I profili per agente vengono archiviati in `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` supporta riferimenti a livello di valore (`keyRef` per `api_key`, `tokenRef` per `token`) per le modalità di credenziali statiche.
- Le vecchie mappe piatte di `auth-profiles.json`, come `{ "provider": { "apiKey": "..." } }`, non sono un formato runtime; `openclaw doctor --fix` le riscrive in profili API-key canonici `provider:default` con un backup `.legacy-flat.*.bak`.
- I profili in modalità OAuth (`auth.profiles.<id>.mode = "oauth"`) non supportano credenziali del profilo di autenticazione basate su SecretRef.
- Le credenziali runtime statiche provengono da snapshot risolti in memoria; le vecchie voci statiche di `auth.json` vengono ripulite quando rilevate.
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

- `billingBackoffHours`: backoff di base in ore quando un profilo non riesce a causa di veri errori di fatturazione/credito insufficiente (predefinito: `5`). Il testo esplicito di fatturazione può comunque arrivare qui anche su risposte `401`/`403`, ma i matcher di testo specifici del provider restano limitati al provider che li possiede (per esempio OpenRouter `Key limit exceeded`). I messaggi HTTP `402` ritentabili relativi alla finestra di utilizzo o al limite di spesa dell'organizzazione/workspace restano invece nel percorso `rate_limit`.
- `billingBackoffHoursByProvider`: override opzionali per provider delle ore di backoff di fatturazione.
- `billingMaxHours`: limite in ore per la crescita esponenziale del backoff di fatturazione (predefinito: `24`).
- `authPermanentBackoffMinutes`: backoff di base in minuti per errori `auth_permanent` ad alta confidenza (predefinito: `10`).
- `authPermanentMaxMinutes`: limite in minuti per la crescita del backoff `auth_permanent` (predefinito: `60`).
- `failureWindowHours`: finestra mobile in ore usata per i contatori di backoff (predefinito: `24`).
- `overloadedProfileRotations`: numero massimo di rotazioni di profili di autenticazione dello stesso provider per errori di sovraccarico prima di passare al fallback del modello (predefinito: `1`). Forme di provider occupato come `ModelNotReadyException` arrivano qui.
- `overloadedBackoffMs`: ritardo fisso prima di riprovare una rotazione di provider/profilo sovraccarico (predefinito: `0`).
- `rateLimitedProfileRotations`: numero massimo di rotazioni di profili di autenticazione dello stesso provider per errori di limite di frequenza prima di passare al fallback del modello (predefinito: `1`). Quel bucket di limite di frequenza include testo modellato dal provider come `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` e `resource exhausted`.

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
- `consoleLevel` passa a `debug` quando è presente `--verbose`.
- `maxFileBytes`: dimensione massima in byte del file di log attivo prima della rotazione (intero positivo; predefinito: `104857600` = 100 MB). OpenClaw conserva fino a cinque archivi numerati accanto al file attivo.
- `redactSensitive` / `redactPatterns`: mascheramento best-effort per output della console, log su file, record di log OTLP e testo persistito della trascrizione della sessione. `redactSensitive: "off"` disabilita solo questa policy generale di log/trascrizione; le superfici di sicurezza di UI/strumenti/diagnostica continuano a oscurare i segreti prima dell'emissione.

---

## Diagnostica

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 600000,

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
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
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
- `flags`: array di stringhe di flag che abilitano output di log mirato (supporta wildcard come `"telegram.*"` o `"*"`).
- `stuckSessionWarnMs`: soglia di età senza progresso in ms per classificare le sessioni di elaborazione a lunga durata come `session.long_running`, `session.stalled` o `session.stuck`. Risposte, strumenti, stati, blocchi e progressi ACP reimpostano il timer; diagnostiche `session.stuck` ripetute applicano backoff finché non cambia nulla.
- `stuckSessionAbortMs`: soglia di età senza progresso in ms prima che il lavoro attivo bloccato idoneo possa essere interrotto e drenato per il ripristino. Quando non impostato, OpenClaw usa la finestra di esecuzione incorporata estesa più sicura di almeno 10 minuti e 5x `stuckSessionWarnMs`.
- `otel.enabled`: abilita la pipeline di esportazione OpenTelemetry (predefinito: `false`). Per la configurazione completa, il catalogo dei segnali e il modello di privacy, consulta [esportazione OpenTelemetry](/it/gateway/opentelemetry).
- `otel.endpoint`: URL del collector per l'esportazione OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP opzionali specifici per segnale. Quando impostati, sovrascrivono `otel.endpoint` solo per quel segnale.
- `otel.protocol`: `"http/protobuf"` (predefinito) o `"grpc"`.
- `otel.headers`: intestazioni di metadati HTTP/gRPC aggiuntive inviate con le richieste di esportazione OTel.
- `otel.serviceName`: nome del servizio per gli attributi della risorsa.
- `otel.traces` / `otel.metrics` / `otel.logs`: abilita l'esportazione di tracce, metriche o log.
- `otel.sampleRate`: frequenza di campionamento delle tracce `0`-`1`.
- `otel.flushIntervalMs`: intervallo periodico di flush della telemetria in ms.
- `otel.captureContent`: acquisizione opt-in del contenuto grezzo per gli attributi degli span OTEL. Disabilitata per impostazione predefinita. Il booleano `true` acquisisce contenuto non di sistema di messaggi/strumenti; la forma a oggetto consente di abilitare esplicitamente `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` e `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: interruttore d'ambiente per gli attributi del provider di span GenAI sperimentali più recenti. Per impostazione predefinita gli span mantengono l'attributo legacy `gen_ai.system` per compatibilità; le metriche GenAI usano attributi semantici limitati.
- `OPENCLAW_OTEL_PRELOADED=1`: interruttore d'ambiente per host che hanno già registrato un SDK OpenTelemetry globale. OpenClaw salta quindi avvio/arresto dell'SDK posseduto dal Plugin mantenendo attivi i listener diagnostici.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` e `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variabili d'ambiente endpoint specifiche per segnale usate quando la chiave di configurazione corrispondente non è impostata.
- `cacheTrace.enabled`: registra snapshot di traccia cache per esecuzioni incorporate (predefinito: `false`).
- `cacheTrace.filePath`: percorso di output per JSONL della traccia cache (predefinito: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controllano cosa viene incluso nell'output della traccia cache (tutti predefiniti: `true`).

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
- `auto.enabled`: abilita l'aggiornamento automatico in background per le installazioni da pacchetto (predefinito: `false`).
- `auto.stableDelayHours`: ritardo minimo in ore prima dell'applicazione automatica sul canale stabile (predefinito: `6`; max: `168`).
- `auto.stableJitterHours`: finestra aggiuntiva di distribuzione del rollout del canale stabile in ore (predefinito: `12`; max: `168`).
- `auto.betaCheckIntervalHours`: frequenza, in ore, con cui vengono eseguiti i controlli del canale beta (predefinito: `1`; max: `24`).

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
- `backend`: id predefinito del backend runtime ACP (deve corrispondere a un Plugin runtime ACP registrato).
  Installa prima il Plugin di backend e, se `plugins.allow` è impostato, includi l'id del Plugin di backend (per esempio `acpx`) altrimenti il backend ACP non verrà caricato.
- `defaultAgent`: id dell'agente di destinazione ACP di fallback quando gli spawn non specificano un target esplicito.
- `allowedAgents`: allowlist di id agente consentiti per le sessioni runtime ACP; vuoto significa nessuna restrizione aggiuntiva.
- `maxConcurrentSessions`: numero massimo di sessioni ACP attive simultaneamente.
- `stream.coalesceIdleMs`: finestra di flush in idle in ms per testo in streaming.
- `stream.maxChunkChars`: dimensione massima del chunk prima di dividere la proiezione del blocco in streaming.
- `stream.repeatSuppression`: sopprime righe di stato/strumento ripetute per turno (predefinito: `true`).
- `stream.deliveryMode`: `"live"` trasmette incrementalmente; `"final_only"` bufferizza fino agli eventi terminali del turno.
- `stream.hiddenBoundarySeparator`: separatore prima del testo visibile dopo eventi strumento nascosti (predefinito: `"paragraph"`).
- `stream.maxOutputChars`: numero massimo di caratteri dell'output dell'assistente proiettati per turno ACP.
- `stream.maxSessionUpdateChars`: numero massimo di caratteri per righe di stato/aggiornamento ACP proiettate.
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
  },
}
```

---

## Identità

Vedi i campi identità `agents.list` in [impostazioni predefinite degli agenti](/it/gateway/config-agents#agent-defaults).

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
    maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
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

- `sessionRetention`: per quanto tempo mantenere le sessioni isolate completate di esecuzione cron prima della rimozione da `sessions.json`. Controlla anche la pulizia delle trascrizioni cron eliminate archiviate. Predefinito: `24h`; impostare `false` per disabilitare.
- `runLog.maxBytes`: dimensione massima per file di log di esecuzione (`cron/runs/<jobId>.jsonl`) prima della rimozione. Predefinito: `2_000_000` byte.
- `runLog.keepLines`: righe più recenti mantenute quando viene attivata la rimozione del log di esecuzione. Predefinito: `2000`.
- `webhookToken`: token bearer usato per la consegna POST del Webhook cron (`delivery.mode = "webhook"`); se omesso, non viene inviato alcun header di autenticazione.
- `webhook`: URL del Webhook legacy di fallback deprecato (http/https) usato solo per i processi memorizzati che hanno ancora `notify: true`.

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

- `maxAttempts`: numero massimo di tentativi per i processi una tantum in caso di errori transitori (predefinito: `3`; intervallo: `0`-`10`).
- `backoffMs`: array di ritardi di backoff in ms per ogni nuovo tentativo (predefinito: `[30000, 60000, 300000]`; 1-10 voci).
- `retryOn`: tipi di errore che attivano nuovi tentativi - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omettere per riprovare tutti i tipi transitori.

Si applica solo ai processi cron una tantum. I processi ricorrenti usano una gestione degli errori separata.

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

- `enabled`: abilita gli avvisi di errore per i processi cron (predefinito: `false`).
- `after`: errori consecutivi prima dell'invio di un avviso (intero positivo, min: `1`).
- `cooldownMs`: millisecondi minimi tra avvisi ripetuti per lo stesso processo (intero non negativo).
- `includeSkipped`: conteggia le esecuzioni saltate consecutive nella soglia di avviso (predefinito: `false`). Le esecuzioni saltate vengono tracciate separatamente e non influiscono sul backoff degli errori di esecuzione.
- `mode`: modalità di consegna - `"announce"` invia tramite un messaggio di canale; `"webhook"` pubblica sul Webhook configurato.
- `accountId`: account o id di canale opzionale per limitare l'ambito della consegna dell'avviso.

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

- Destinazione predefinita per le notifiche di errore cron in tutti i processi.
- `mode`: `"announce"` o `"webhook"`; il valore predefinito è `"announce"` quando esistono dati di destinazione sufficienti.
- `channel`: override del canale per la consegna announce. `"last"` riutilizza l'ultimo canale di consegna noto.
- `to`: destinazione announce esplicita o URL del Webhook. Obbligatorio per la modalità Webhook.
- `accountId`: override dell'account opzionale per la consegna.
- `delivery.failureDestination` per processo sovrascrive questo valore predefinito globale.
- Quando non è impostata né una destinazione di errore globale né una per processo, i processi che consegnano già tramite `announce` usano come fallback quella destinazione announce primaria in caso di errore.
- `delivery.failureDestination` è supportato solo per i processi con `sessionTarget="isolated"`, a meno che il `delivery.mode` primario del processo non sia `"webhook"`.

Vedi [Processi Cron](/it/automation/cron-jobs). Le esecuzioni cron isolate vengono tracciate come [attività in background](/it/automation/tasks).

---

## Variabili di template del modello multimediale

Segnaposto di template espansi in `tools.media.models[].args`:

| Variabile          | Descrizione                                      |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Corpo completo del messaggio in ingresso          |
| `{{RawBody}}`      | Corpo grezzo (senza wrapper di cronologia/mittente) |
| `{{BodyStripped}}` | Corpo con menzioni di gruppo rimosse              |
| `{{From}}`         | Identificatore del mittente                       |
| `{{To}}`           | Identificatore della destinazione                 |
| `{{MessageSid}}`   | Id del messaggio di canale                        |
| `{{SessionId}}`    | UUID della sessione corrente                      |
| `{{IsNewSession}}` | `"true"` quando viene creata una nuova sessione   |
| `{{MediaUrl}}`     | Pseudo-URL del contenuto multimediale in ingresso |
| `{{MediaPath}}`    | Percorso locale del contenuto multimediale        |
| `{{MediaType}}`    | Tipo di contenuto multimediale (immagine/audio/documento/…) |
| `{{Transcript}}`   | Trascrizione audio                                |
| `{{Prompt}}`       | Prompt multimediale risolto per le voci CLI       |
| `{{MaxChars}}`     | Numero massimo risolto di caratteri di output per le voci CLI |
| `{{ChatType}}`     | `"direct"` o `"group"`                            |
| `{{GroupSubject}}` | Oggetto del gruppo (best effort)                  |
| `{{GroupMembers}}` | Anteprima dei membri del gruppo (best effort)     |
| `{{SenderName}}`   | Nome visualizzato del mittente (best effort)      |
| `{{SenderE164}}`   | Numero di telefono del mittente (best effort)     |
| `{{Provider}}`     | Suggerimento sul provider (whatsapp, telegram, discord, ecc.) |

---

## Inclusioni della configurazione (`$include`)

Suddividi la configurazione in più file:

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

**Comportamento di unione:**

- File singolo: sostituisce l'oggetto contenitore.
- Array di file: uniti in profondità nell'ordine indicato (i successivi sovrascrivono i precedenti).
- Chiavi sorelle: unite dopo le inclusioni (sovrascrivono i valori inclusi).
- Inclusioni annidate: fino a 10 livelli di profondità.
- Percorsi: risolti in modo relativo al file che include, ma devono rimanere all'interno della directory di configurazione di livello superiore (`dirname` di `openclaw.json`). Le forme assolute/`../` sono consentite solo quando vengono comunque risolte entro quel limite.
- Le scritture di proprietà di OpenClaw che modificano solo una sezione di primo livello basata su un'inclusione di un singolo file scrivono direttamente in quel file incluso. Ad esempio, `plugins install` aggiorna `plugins: { $include: "./plugins.json5" }` in `plugins.json5` e lascia intatto `openclaw.json`.
- Le inclusioni radice, gli array di inclusioni e le inclusioni con override di chiavi sorelle sono di sola lettura per le scritture di proprietà di OpenClaw; tali scritture falliscono in modo chiuso invece di appiattire la configurazione.
- Errori: messaggi chiari per file mancanti, errori di parsing e inclusioni circolari.

---

_Correlato: [Configurazione](/it/gateway/configuration) · [Esempi di configurazione](/it/gateway/configuration-examples) · [Doctor](/it/gateway/doctor)_

## Correlato

- [Configurazione](/it/gateway/configuration)
- [Esempi di configurazione](/it/gateway/configuration-examples)
