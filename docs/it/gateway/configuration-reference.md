---
read_when:
    - Ti servono la semantica o i valori predefiniti esatti della configurazione a livello di campo
    - Stai convalidando blocchi di configurazione di canale, modello, Gateway o strumento
summary: Riferimento alla configurazione del Gateway per le chiavi principali di OpenClaw, i valori predefiniti e i link ai riferimenti dedicati dei sottosistemi
title: Riferimento di configurazione
x-i18n:
    generated_at: "2026-05-05T01:45:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82164a3ea7592f667573b643ee9e0ec840b9b622c9d86c382a3feaf192e75684
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Riferimento alla configurazione core per `~/.openclaw/openclaw.json`. Per una panoramica orientata alle attività, consulta [Configurazione](/it/gateway/configuration).

Copre le principali superfici di configurazione di OpenClaw e rimanda ad altre pagine quando un sottosistema ha un proprio riferimento più approfondito. I cataloghi dei comandi di proprietà di canali e plugin e le opzioni avanzate di memoria/QMD si trovano nelle rispettive pagine, non in questa.

Fonte di verità del codice:

- `openclaw config schema` stampa lo Schema JSON live usato per la validazione e la Control UI, con metadati inclusi/plugin/canale uniti quando disponibili
- `config.schema.lookup` restituisce un nodo schema con ambito per percorso per gli strumenti di approfondimento
- `pnpm config:docs:check` / `pnpm config:docs:gen` validano l'hash baseline della documentazione di configurazione rispetto alla superficie schema corrente

Percorso di lookup per agenti: usa l'azione dello strumento `gateway` `config.schema.lookup` per
documentazione e vincoli esatti a livello di campo prima delle modifiche. Usa
[Configurazione](/it/gateway/configuration) per una guida orientata alle attività e questa pagina
per la mappa più ampia dei campi, i valori predefiniti e i link ai riferimenti dei sottosistemi.

Riferimenti approfonditi dedicati:

- [Riferimento alla configurazione della memoria](/it/reference/memory-config) per `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e la configurazione di dreaming sotto `plugins.entries.memory-core.config.dreaming`
- [Comandi slash](/it/tools/slash-commands) per il catalogo corrente dei comandi integrati + inclusi
- pagine dei canali/plugin proprietari per le superfici di comando specifiche del canale

Il formato di configurazione è **JSON5** (commenti + virgole finali consentiti). Tutti i campi sono facoltativi: OpenClaw usa valori predefiniti sicuri quando omessi.

---

## Canali

Le chiavi di configurazione per canale sono state spostate in una pagina dedicata: consulta
[Configurazione — canali](/it/gateway/config-channels) per `channels.*`,
inclusi Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e altri
canali inclusi (autenticazione, controllo accessi, account multipli, gating delle menzioni).

## Valori predefiniti degli agenti, multi-agente, sessioni e messaggi

Spostato in una pagina dedicata: consulta
[Configurazione — agenti](/it/gateway/config-agents) per:

- `agents.defaults.*` (workspace, modello, ragionamento, heartbeat, memoria, media, skills, sandbox)
- `multiAgent.*` (routing multi-agente e binding)
- `session.*` (ciclo di vita della sessione, compaction, pruning)
- `messages.*` (consegna dei messaggi, TTS, rendering markdown)
- `talk.*` (modalità Talk)
  - `talk.speechLocale`: id locale BCP 47 opzionale per il riconoscimento vocale Talk su iOS/macOS
  - `talk.silenceTimeoutMs`: quando non impostato, Talk mantiene la finestra di pausa predefinita della piattaforma prima di inviare la trascrizione (`700 ms on macOS and Android, 900 ms on iOS`)

## Strumenti e provider personalizzati

La policy degli strumenti, i toggle sperimentali, la configurazione degli strumenti supportati da provider e la configurazione di
provider personalizzati / URL base sono stati spostati in una pagina dedicata: consulta
[Configurazione — strumenti e provider personalizzati](/it/gateway/config-tools).

## Modelli

Le definizioni dei provider, le allowlist dei modelli e la configurazione dei provider personalizzati si trovano in
[Configurazione — strumenti e provider personalizzati](/it/gateway/config-tools#custom-providers-and-base-urls).
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
- `models.providers`: mappa di provider personalizzati indicizzata per id provider.
- `models.pricing.enabled`: controlla il bootstrap dei prezzi in background che
  parte dopo che sidecar e canali raggiungono il percorso ready del Gateway. Quando `false`,
  il Gateway salta i fetch dei cataloghi prezzi OpenRouter e LiteLLM; i valori configurati
  `models.providers.*.models[].cost` continuano a funzionare per le stime dei costi locali.

## MCP

Le definizioni dei server MCP gestiti da OpenClaw si trovano sotto `mcp.servers` e sono
consumate da Pi integrato e da altri adapter runtime. I comandi `openclaw mcp list`,
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

- `mcp.servers`: definizioni denominate di server MCP stdio o remoti per runtime che
  espongono strumenti MCP configurati.
  Le voci remote usano `transport: "streamable-http"` o `transport: "sse"`;
  `type: "http"` è un alias nativo della CLI che `openclaw mcp set` e
  `openclaw doctor --fix` normalizzano nel campo canonico `transport`.
- `mcp.sessionIdleTtlMs`: TTL di inattività per runtime MCP inclusi con ambito sessione.
  Le esecuzioni integrate one-shot richiedono la pulizia a fine esecuzione; questo TTL è il backstop per
  sessioni di lunga durata e chiamanti futuri.
- Le modifiche sotto `mcp.*` vengono applicate a caldo eliminando i runtime MCP di sessione memorizzati nella cache.
  La successiva discovery/uso degli strumenti li ricrea dalla nuova configurazione, quindi le voci
  `mcp.servers` rimosse vengono raccolte immediatamente invece di attendere il TTL di inattività.

Consulta [MCP](/it/cli/mcp#openclaw-as-an-mcp-client-registry) e
[Backend CLI](/it/gateway/cli-backends#bundle-mcp-overlays) per il comportamento runtime.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
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

- `allowBundled`: allowlist opzionale solo per Skills inclusi (Skills gestiti/workspace non interessati).
- `load.extraDirs`: radici Skill condivise aggiuntive (precedenza più bassa).
- `install.preferBrew`: quando true, preferisce gli installer Homebrew quando `brew` è
  disponibile prima di ripiegare su altri tipi di installer.
- `install.nodeManager`: preferenza dell'installer node per le specifiche `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` disabilita una Skill anche se inclusa/installata.
- `entries.<skillKey>.apiKey`: scorciatoia per Skills che dichiarano una variabile env primaria (stringa in chiaro o oggetto SecretRef).

---

## Plugins

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
- La discovery accetta plugin nativi OpenClaw più bundle Codex compatibili e bundle Claude, inclusi i bundle Claude senza manifest con layout predefinito.
- **Le modifiche alla configurazione richiedono un riavvio del gateway.**
- `allow`: allowlist opzionale (carica solo i plugin elencati). `deny` prevale.
- `bundledDiscovery`: per le nuove configurazioni il valore predefinito è `"allowlist"`, quindi un
  `plugins.allow` non vuoto controlla anche i plugin provider inclusi, inclusi i provider runtime
  di web-search. Doctor scrive `"compat"` per le configurazioni allowlist legacy migrate
  per preservare il comportamento esistente dei provider inclusi finché non effettui l'opt-in.
- `plugins.entries.<id>.apiKey`: campo di comodità per la chiave API a livello di plugin (quando supportato dal plugin).
- `plugins.entries.<id>.env`: mappa di variabili env con ambito plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, core blocca `before_prompt_build` e ignora i campi che modificano i prompt da `before_agent_start` legacy, preservando `modelOverride` e `providerOverride` legacy. Si applica agli hook dei plugin nativi e alle directory hook fornite dai bundle supportati.
- `plugins.entries.<id>.hooks.allowConversationAccess`: quando `true`, i plugin non inclusi attendibili possono leggere il contenuto grezzo della conversazione da hook tipizzati come `llm_input`, `llm_output`, `before_agent_finalize` e `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: autorizza esplicitamente questo plugin a richiedere override `provider` e `model` per esecuzione per le esecuzioni di subagenti in background.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opzionale di target canonici `provider/model` per override di subagenti attendibili. Usa `"*"` solo quando vuoi intenzionalmente consentire qualsiasi modello.
- `plugins.entries.<id>.config`: oggetto di configurazione definito dal plugin (validato dallo schema del plugin nativo OpenClaw quando disponibile).
- Le impostazioni account/runtime dei plugin canale si trovano sotto `channels.<id>` e dovrebbero essere descritte dai metadati `channelConfigs` del manifest del plugin proprietario, non da un registro centrale di opzioni OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: impostazioni del provider web-fetch Firecrawl.
  - `apiKey`: chiave API Firecrawl (accetta SecretRef). Ripiega su `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` legacy o sulla variabile env `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base dell'API Firecrawl (predefinito: `https://api.firecrawl.dev`; gli override self-hosted devono puntare a endpoint privati/interni).
  - `onlyMainContent`: estrae solo il contenuto principale dalle pagine (predefinito: `true`).
  - `maxAgeMs`: età massima della cache in millisecondi (predefinito: `172800000` / 2 giorni).
  - `timeoutSeconds`: timeout della richiesta di scraping in secondi (predefinito: `60`).
- `plugins.entries.xai.config.xSearch`: impostazioni di xAI X Search (ricerca web Grok).
  - `enabled`: abilita il provider X Search.
  - `model`: modello Grok da usare per la ricerca (ad es. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: impostazioni di memory dreaming. Consulta [Dreaming](/it/concepts/dreaming) per fasi e soglie.
  - `enabled`: interruttore principale di dreaming (predefinito `false`).
  - `frequency`: cadenza cron per ogni sweep completo di dreaming (`"0 3 * * *"` per impostazione predefinita).
  - `model`: override opzionale del modello subagente Dream Diary. Richiede `plugins.entries.memory-core.subagent.allowModelOverride: true`; abbinalo a `allowedModels` per limitare i target. Gli errori di modello non disponibile riprovano una volta con il modello predefinito della sessione; gli errori di attendibilità o allowlist non ripiegano silenziosamente.
  - policy di fase e soglie sono dettagli implementativi (non chiavi di configurazione esposte all'utente).
- La configurazione completa della memoria si trova in [Riferimento alla configurazione della memoria](/it/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- I plugin bundle Claude abilitati possono anche contribuire valori predefiniti Pi integrati da `settings.json`; OpenClaw li applica come impostazioni agente sanificate, non come patch grezze alla configurazione OpenClaw.
- `plugins.slots.memory`: seleziona l'id del plugin di memoria attivo, oppure `"none"` per disabilitare i plugin di memoria.
- `plugins.slots.contextEngine`: seleziona l'id del plugin motore di contesto attivo; il valore predefinito è `"legacy"` a meno che non installi e selezioni un altro motore.

Consulta [Plugins](/it/tools/plugin).

---

## Impegni

`commitments` controlla la memoria di follow-up inferita: OpenClaw può rilevare check-in dai turni di conversazione e consegnarli tramite esecuzioni heartbeat.

- `commitments.enabled`: abilita estrazione LLM nascosta, archiviazione e consegna heartbeat per gli impegni di follow-up inferiti. Predefinito: `false`.
- `commitments.maxPerDay`: numero massimo di impegni di follow-up inferiti consegnati per sessione agente in un giorno mobile. Predefinito: `3`.

Consulta [Impegni inferiti](/it/concepts/commitments).

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
- Imposta `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` solo quando consideri intenzionalmente attendibile la navigazione del browser su rete privata.
- In modalità rigorosa, gli endpoint dei profili CDP remoti (`profiles.*.cdpUrl`) sono soggetti allo stesso blocco delle reti private durante i controlli di raggiungibilità/rilevamento.
- `ssrfPolicy.allowPrivateNetwork` resta supportato come alias legacy.
- In modalità rigorosa, usa `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` per eccezioni esplicite.
- I profili remoti sono solo in collegamento (avvio/arresto/reimpostazione disabilitati).
- `profiles.*.cdpUrl` accetta `http://`, `https://`, `ws://` e `wss://`.
  Usa HTTP(S) quando vuoi che OpenClaw rilevi `/json/version`; usa WS(S)
  quando il tuo provider ti fornisce un URL WebSocket DevTools diretto.
- `remoteCdpTimeoutMs` e `remoteCdpHandshakeTimeoutMs` si applicano alla raggiungibilità CDP remota e
  `attachOnly`, oltre che alle richieste di apertura delle schede. I profili local loopback gestiti
  mantengono i valori predefiniti CDP locali.
- Se un servizio CDP gestito esternamente è raggiungibile tramite loopback, imposta
  `attachOnly: true` per quel profilo; altrimenti OpenClaw tratta la porta loopback come un
  profilo browser locale gestito e potrebbe segnalare errori di proprietà della porta locale.
- I profili `existing-session` usano Chrome MCP invece di CDP e possono collegarsi
  sull'host selezionato o tramite un nodo browser connesso.
- I profili `existing-session` possono impostare `userDataDir` per indirizzare un profilo
  browser specifico basato su Chromium, come Brave o Edge.
- I profili `existing-session` mantengono gli attuali limiti di instradamento di Chrome MCP:
  azioni guidate da snapshot/riferimenti invece del targeting tramite selettori CSS, hook di caricamento
  di un solo file, nessuna sostituzione del timeout delle finestre di dialogo, nessun
  `wait --load networkidle` e nessuna azione `responsebody`, esportazione PDF,
  intercettazione dei download o azioni batch.
- I profili `openclaw` locali gestiti assegnano automaticamente `cdpPort` e `cdpUrl`; imposta
  `cdpUrl` esplicitamente solo per CDP remoto.
- I profili locali gestiti possono impostare `executablePath` per sovrascrivere il valore globale
  `browser.executablePath` per quel profilo. Usalo per eseguire un profilo in
  Chrome e un altro in Brave.
- I profili locali gestiti usano `browser.localLaunchTimeoutMs` per il rilevamento HTTP CDP di Chrome
  dopo l'avvio del processo e `browser.localCdpReadyTimeoutMs` per la disponibilità del websocket CDP
  dopo l'avvio. Aumentali su host più lenti dove Chrome
  si avvia correttamente ma i controlli di disponibilità competono con l'avvio. Entrambi i valori devono essere
  numeri interi positivi fino a `120000` ms; i valori di configurazione non validi vengono rifiutati.
- Ordine di rilevamento automatico: browser predefinito se basato su Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` e `browser.profiles.<name>.executablePath` accettano entrambi
  `~` e `~/...` per la directory home del tuo sistema operativo prima dell'avvio di Chromium.
  Anche `userDataDir` per profilo sui profili `existing-session` viene espanso con la tilde.
- Servizio di controllo: solo loopback (porta derivata da `gateway.port`, predefinita `18791`).
- `extraArgs` aggiunge flag di avvio extra all'avvio locale di Chromium (per esempio
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

- `seamColor`: colore di accento per la chrome UI dell'app nativa (tinta della bolla della modalità Talk, ecc.).
- `assistant`: sostituzione dell'identità nella UI di controllo. Ripiega sull'identità dell'agente attivo.

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

<Accordion title="Gateway field details">

- `mode`: `local` (esegui Gateway) o `remote` (connettiti al Gateway remoto). Gateway rifiuta l'avvio a meno che non sia `local`.
- `port`: singola porta multiplex per WS + HTTP. Precedenza: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predefinito), `lan` (`0.0.0.0`), `tailnet` (solo IP Tailscale) o `custom`.
- **Alias bind legacy**: usa i valori della modalità bind in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), non gli alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota Docker**: il bind predefinito `loopback` ascolta su `127.0.0.1` dentro il container. Con la rete bridge di Docker (`-p 18789:18789`), il traffico arriva su `eth0`, quindi il Gateway è irraggiungibile. Usa `--network host`, oppure imposta `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) per ascoltare su tutte le interfacce.
- **Autenticazione**: richiesta per impostazione predefinita. I bind non loopback richiedono l'autenticazione del Gateway. In pratica questo significa un token/password condiviso o un proxy inverso identity-aware con `gateway.auth.mode: "trusted-proxy"`. La procedura guidata di onboarding genera un token per impostazione predefinita.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` (inclusi i SecretRefs), imposta esplicitamente `gateway.auth.mode` su `token` o `password`. I flussi di avvio e installazione/riparazione del servizio falliscono quando entrambi sono configurati e la modalità non è impostata.
- `gateway.auth.mode: "none"`: modalità esplicita senza autenticazione. Usala solo per configurazioni local loopback attendibili; intenzionalmente non viene offerta dai prompt di onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega l'autenticazione browser/utente a un proxy inverso identity-aware e considera attendibili gli header di identità da `gateway.trustedProxies` (vedi [Autenticazione con proxy attendibile](/it/gateway/trusted-proxy-auth)). Questa modalità prevede per impostazione predefinita una sorgente proxy **non loopback**; i proxy inversi loopback sullo stesso host richiedono `gateway.auth.trustedProxy.allowLoopback = true` esplicito. I chiamanti interni sullo stesso host possono usare `gateway.auth.password` come fallback diretto locale; `gateway.auth.token` resta mutualmente esclusivo con la modalità trusted-proxy.
- `gateway.auth.allowTailscale`: quando `true`, gli header di identità Tailscale Serve possono soddisfare l'autenticazione Control UI/WebSocket (verificata tramite `tailscale whois`). Gli endpoint API HTTP **non** usano quell'autenticazione tramite header Tailscale; seguono invece la normale modalità di autenticazione HTTP del Gateway. Questo flusso senza token presuppone che l'host del Gateway sia attendibile. Il valore predefinito è `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitatore opzionale per autenticazioni fallite. Si applica per IP client e per ambito di autenticazione (shared-secret e device-token sono tracciati in modo indipendente). I tentativi bloccati restituiscono `429` + `Retry-After`.
  - Nel percorso asincrono Tailscale Serve Control UI, i tentativi falliti per lo stesso `{scope, clientIp}` vengono serializzati prima della scrittura dell'errore. Di conseguenza, tentativi errati concorrenti dallo stesso client possono far scattare il limitatore già alla seconda richiesta, invece di passare entrambi in parallelo come semplici mismatch.
  - `gateway.auth.rateLimit.exemptLoopback` ha valore predefinito `true`; imposta `false` quando vuoi intenzionalmente limitare anche il traffico localhost (per configurazioni di test o distribuzioni proxy rigorose).
- I tentativi di autenticazione WS con origine browser sono sempre soggetti a throttling con esenzione loopback disabilitata (difesa in profondità contro brute force localhost basati su browser).
- Su loopback, quei blocchi con origine browser sono isolati per valore `Origin`
  normalizzato, quindi fallimenti ripetuti da un'origine localhost non bloccano automaticamente
  un'origine diversa.
- `tailscale.mode`: `serve` (solo tailnet, bind loopback) o `funnel` (pubblico, richiede autenticazione).
- `controlUi.allowedOrigins`: allowlist esplicita delle origini browser per connessioni WebSocket al Gateway. Richiesta quando sono previsti client browser da origini non loopback.
- `controlUi.chatMessageMaxWidth`: larghezza massima opzionale per messaggi chat raggruppati nella Control UI. Accetta valori di larghezza CSS vincolati come `960px`, `82%`, `min(1280px, 82%)` e `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modalità pericolosa che abilita il fallback dell'origine tramite header Host per distribuzioni che si basano intenzionalmente sulla policy di origine dell'header Host.
- `remote.transport`: `ssh` (predefinito) o `direct` (ws/wss). Per `direct`, `remote.url` deve essere `ws://` o `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override di emergenza dell'ambiente di processo lato client
  che consente `ws://` in chiaro verso IP di reti private attendibili;
  il valore predefinito resta solo loopback per il testo in chiaro. Non esiste un equivalente in `openclaw.json`,
  e la configurazione di rete privata del browser come
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` non influisce sui client WebSocket
  del Gateway.
- `gateway.remote.token` / `.password` sono campi di credenziali del client remoto. Da soli non configurano l'autenticazione del Gateway.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS di base per il relay APNs esterno usato dalle build iOS ufficiali/TestFlight dopo che pubblicano registrazioni supportate da relay nel Gateway. Questo URL deve corrispondere all'URL del relay compilato nella build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout di invio dal Gateway al relay in millisecondi. Valore predefinito `10000`.
- Le registrazioni supportate da relay sono delegate a una specifica identità del Gateway. L'app iOS abbinata recupera `gateway.identity.get`, include quell'identità nella registrazione del relay e inoltra al Gateway una concessione di invio con ambito di registrazione. Un altro Gateway non può riutilizzare quella registrazione salvata.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env temporanei per la configurazione relay sopra.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: via di fuga solo per sviluppo per URL relay HTTP loopback. Gli URL relay di produzione dovrebbero rimanere su HTTPS.
- `gateway.handshakeTimeoutMs`: timeout dell'handshake WebSocket pre-autenticazione del Gateway in millisecondi. Predefinito: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ha precedenza quando impostato. Aumentalo su host carichi o poco potenti, dove i client locali possono connettersi mentre il warmup di avvio si sta ancora stabilizzando.
- `gateway.channelHealthCheckMinutes`: intervallo del monitor di salute dei canali in minuti. Imposta `0` per disabilitare globalmente i riavvii del monitor di salute. Predefinito: `5`.
- `gateway.channelStaleEventThresholdMinutes`: soglia socket obsoleto in minuti. Mantienila maggiore o uguale a `gateway.channelHealthCheckMinutes`. Predefinito: `30`.
- `gateway.channelMaxRestartsPerHour`: numero massimo di riavvii del monitor di salute per canale/account in un'ora mobile. Predefinito: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per canale dai riavvii del monitor di salute mantenendo abilitato il monitor globale.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per account per canali multi-account. Quando impostato, ha precedenza sull'override a livello di canale.
- I percorsi di chiamata del Gateway locale possono usare `gateway.remote.*` come fallback solo quando `gateway.auth.*` non è impostato.
- Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non risolto, la risoluzione fallisce in modo chiuso (nessun mascheramento tramite fallback remoto).
- `trustedProxies`: IP dei proxy inversi che terminano TLS o iniettano header del client inoltrato. Elenca solo proxy sotto il tuo controllo. Le voci loopback restano valide per configurazioni proxy/rilevamento locale sullo stesso host (per esempio Tailscale Serve o un proxy inverso locale), ma **non** rendono le richieste loopback idonee per `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando `true`, il Gateway accetta `X-Real-IP` se `X-Forwarded-For` manca. Predefinito `false` per comportamento fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist CIDR/IP opzionale per approvare automaticamente il primo abbinamento di dispositivi Node senza ambiti richiesti. È disabilitata se non impostata. Questo non approva automaticamente l'abbinamento di operator/browser/Control UI/WebChat e non approva automaticamente aggiornamenti di ruolo, ambito, metadati o chiave pubblica.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: modellamento globale allow/deny per i comandi Node dichiarati dopo l'abbinamento e la valutazione dell'allowlist di piattaforma. Usa `allowCommands` per abilitare esplicitamente comandi Node pericolosi come `camera.snap`, `camera.clip` e `screen.record`; `denyCommands` rimuove un comando anche se un'impostazione predefinita di piattaforma o un allow esplicito lo includerebbe altrimenti. Dopo che un Node cambia la propria lista di comandi dichiarati, rifiuta e riapprova l'abbinamento di quel dispositivo in modo che il Gateway salvi lo snapshot dei comandi aggiornato.
- `gateway.tools.deny`: nomi di tool aggiuntivi bloccati per HTTP `POST /tools/invoke` (estende la lista deny predefinita).
- `gateway.tools.allow`: rimuove nomi di tool dalla lista deny HTTP predefinita.

</Accordion>

### Endpoint compatibili con OpenAI

- Chat Completions: disabilitate per impostazione predefinita. Abilita con `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Hardening dell'input URL di Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Le allowlist vuote sono trattate come non impostate; usa `gateway.http.endpoints.responses.files.allowUrl=false`
    e/o `gateway.http.endpoints.responses.images.allowUrl=false` per disabilitare il recupero da URL.
- Header opzionale per l'hardening delle risposte:
  - `gateway.http.securityHeaders.strictTransportSecurity` (imposta solo per origini HTTPS sotto il tuo controllo; vedi [Autenticazione con proxy attendibile](/it/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento multi-istanza

Esegui più Gateway su un host con porte e directory di stato uniche:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flag di convenienza: `--dev` (usa `~/.openclaw-dev` + porta `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

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

- `enabled`: abilita la terminazione TLS sul listener del Gateway (HTTPS/WSS) (predefinito: `false`).
- `autoGenerate`: genera automaticamente una coppia certificato/chiave locale autofirmata quando non sono configurati file espliciti; solo per uso locale/dev.
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
  - `"hybrid"` (predefinito): prova prima l'hot reload; ripiega sul riavvio se necessario.
- `debounceMs`: finestra di debounce in ms prima che le modifiche alla configurazione vengano applicate (intero non negativo).
- `deferralTimeoutMs`: tempo massimo opzionale in ms da attendere per le operazioni in corso prima di forzare un riavvio. Omettilo per usare l'attesa limitata predefinita (`300000`); imposta `0` per attendere indefinitamente e registrare avvisi periodici di operazioni ancora in sospeso.

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
- `hooks.token` deve essere **distinto** da `gateway.auth.token`; il riutilizzo del token del Gateway viene rifiutato.
- `hooks.path` non può essere `/`; usa un sottopercorso dedicato come `/hooks`.
- Se `hooks.allowRequestSessionKey=true`, limita `hooks.allowedSessionKeyPrefixes` (per esempio `["hook:"]`).
- Se una mappatura o un preset usa un `sessionKey` basato su template, imposta `hooks.allowedSessionKeyPrefixes` e `hooks.allowRequestSessionKey=true`. Le chiavi di mappatura statiche non richiedono questa opzione esplicita.

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` dal payload della richiesta viene accettato solo quando `hooks.allowRequestSessionKey=true` (predefinito: `false`).
- `POST /hooks/<name>` → risolto tramite `hooks.mappings`
  - I valori `sessionKey` della mappatura renderizzati da template sono trattati come forniti esternamente e richiedono anche `hooks.allowRequestSessionKey=true`.

<Accordion title="Dettagli della mappatura">

- `match.path` corrisponde al sottopercorso dopo `/hooks` (ad es. `/hooks/gmail` → `gmail`).
- `match.source` corrisponde a un campo del payload per percorsi generici.
- Template come `{{messages[0].subject}}` leggono dal payload.
- `transform` può puntare a un modulo JS/TS che restituisce un'azione hook.
  - `transform.module` deve essere un percorso relativo e rimane all'interno di `hooks.transformsDir` (i percorsi assoluti e l'attraversamento vengono rifiutati).
  - Mantieni `hooks.transformsDir` sotto `~/.openclaw/hooks/transforms`; le directory Skills dell'area di lavoro vengono rifiutate. Se `openclaw doctor` segnala questo percorso come non valido, sposta il modulo di trasformazione nella directory delle trasformazioni degli hook o rimuovi `hooks.transformsDir`.
- `agentId` instrada verso un agente specifico; gli ID sconosciuti ricadono sul predefinito.
- `allowedAgentIds`: limita l'instradamento esplicito (`*` o omesso = consenti tutto, `[]` = nega tutto).
- `defaultSessionKey`: chiave di sessione fissa opzionale per le esecuzioni dell'agente hook senza `sessionKey` esplicito.
- `allowRequestSessionKey`: consente ai chiamanti di `/hooks/agent` e alle chiavi di sessione delle mappature guidate da template di impostare `sessionKey` (predefinito: `false`).
- `allowedSessionKeyPrefixes`: allowlist opzionale di prefissi per valori `sessionKey` espliciti (richiesta + mappatura), ad es. `["hook:"]`. Diventa obbligatoria quando una mappatura o un preset usa un `sessionKey` basato su template.
- `deliver: true` invia la risposta finale a un canale; `channel` usa `last` come predefinito.
- `model` sovrascrive l'LLM per questa esecuzione dell'hook (deve essere consentito se il catalogo dei modelli è impostato).

</Accordion>

### Integrazione Gmail

- Il preset Gmail integrato usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Se mantieni quell'instradamento per messaggio, imposta `hooks.allowRequestSessionKey: true` e limita `hooks.allowedSessionKeyPrefixes` in modo che corrisponda al namespace Gmail, per esempio `["hook:", "hook:gmail:"]`.
- Se hai bisogno di `hooks.allowRequestSessionKey: false`, sovrascrivi il preset con un `sessionKey` statico invece del predefinito basato su template.

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

- Il Gateway avvia automaticamente `gog gmail watch serve` all'avvio quando è configurato. Imposta `OPENCLAW_SKIP_GMAIL_WATCHER=1` per disabilitarlo.
- Non eseguire un `gog gmail watch serve` separato insieme al Gateway.

---

## Host canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Serve HTML/CSS/JS modificabili dall'agente e A2UI tramite HTTP sotto la porta del Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Solo locale: mantieni `gateway.bind: "loopback"` (predefinito).
- Bind non loopback: le rotte canvas richiedono l'autenticazione del Gateway (token/password/trusted-proxy), come le altre superfici HTTP del Gateway.
- Le WebView Node in genere non inviano header di autenticazione; dopo che un node è associato e connesso, il Gateway pubblicizza URL di capacità con ambito node per l'accesso a canvas/A2UI.
- Gli URL di capacità sono vincolati alla sessione WS del node attivo e scadono rapidamente. Il fallback basato su IP non viene usato.
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

- `minimal` (predefinito quando il plugin `bonjour` integrato è abilitato): omette `cliPath` + `sshPort` dai record TXT.
- `full`: include `cliPath` + `sshPort`; la pubblicità multicast LAN richiede comunque che il plugin `bonjour` integrato sia abilitato.
- `off`: sopprime la pubblicità multicast LAN senza modificare l'abilitazione del plugin.
- Il plugin `bonjour` integrato si avvia automaticamente sugli host macOS ed è opt-in su Linux, Windows e distribuzioni del Gateway containerizzate.
- Il nome host usa per impostazione predefinita il nome host di sistema quando è un'etichetta DNS valida, con fallback a `openclaw`. Sovrascrivi con `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Scrive una zona DNS-SD unicast sotto `~/.openclaw/dns/`. Per il rilevamento tra reti, abbinala a un server DNS (CoreDNS consigliato) + split DNS Tailscale.

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
- File `.env`: `.env` della CWD + `~/.openclaw/.env` (nessuno dei due sovrascrive le variabili esistenti).
- `shellEnv`: importa le chiavi previste mancanti dal profilo della shell di login.
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
- Esegui l'escape con `$${VAR}` per un valore letterale `${VAR}`.
- Funziona con `$include`.

---

## Segreti

I riferimenti ai segreti sono additivi: i valori in testo normale continuano a funzionare.

### `SecretRef`

Usa una forma di oggetto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validazione:

- Pattern di `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Pattern dell'id per `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- Id per `source: "file"`: puntatore JSON assoluto (per esempio `"/providers/openai/apiKey"`)
- Pattern dell'id per `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- Gli id di `source: "exec"` non devono contenere segmenti di percorso delimitati da slash `.` o `..` (per esempio `a/../b` viene rifiutato)

### Superficie delle credenziali supportata

- Matrice canonica: [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface)
- `secrets apply` prende di mira i percorsi delle credenziali `openclaw.json` supportati.
- I riferimenti `auth-profiles.json` sono inclusi nella risoluzione runtime e nella copertura di audit.

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
- I percorsi dei provider file ed exec falliscono in modo sicuro quando la verifica ACL di Windows non è disponibile. Imposta `allowInsecurePath: true` solo per percorsi attendibili che non possono essere verificati.
- Il provider `exec` richiede un percorso `command` assoluto e usa payload di protocollo su stdin/stdout.
- Per impostazione predefinita, i percorsi di comando symlink vengono rifiutati. Imposta `allowSymlinkCommand: true` per consentire percorsi symlink validando al contempo il percorso della destinazione risolta.
- Se `trustedDirs` è configurato, il controllo della directory attendibile si applica al percorso della destinazione risolta.
- L'ambiente figlio di `exec` è minimo per impostazione predefinita; passa esplicitamente le variabili richieste con `passEnv`.
- I riferimenti ai segreti vengono risolti al momento dell'attivazione in uno snapshot in memoria, poi i percorsi di richiesta leggono solo lo snapshot.
- Il filtro della superficie attiva si applica durante l'attivazione: i riferimenti non risolti sulle superfici abilitate fanno fallire l'avvio/ricaricamento, mentre le superfici inattive vengono saltate con diagnostica.

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

- I profili per agente sono archiviati in `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` supporta riferimenti a livello di valore (`keyRef` per `api_key`, `tokenRef` per `token`) per le modalità di credenziali statiche.
- Le mappe piatte legacy di `auth-profiles.json` come `{ "provider": { "apiKey": "..." } }` non sono un formato runtime; `openclaw doctor --fix` le riscrive in profili chiave API canonici `provider:default` con un backup `.legacy-flat.*.bak`.
- I profili in modalità OAuth (`auth.profiles.<id>.mode = "oauth"`) non supportano credenziali auth-profile basate su SecretRef.
- Le credenziali runtime statiche provengono da snapshot risolti in memoria; le voci statiche legacy di `auth.json` vengono ripulite quando rilevate.
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

- `billingBackoffHours`: backoff di base in ore quando un profilo fallisce a causa di veri errori di
  fatturazione/credito insufficiente (predefinito: `5`). Il testo esplicito sulla fatturazione può
  comunque arrivare qui anche nelle risposte `401`/`403`, ma i matcher di testo specifici del provider
  restano limitati al provider che li possiede (per esempio OpenRouter
  `Key limit exceeded`). I messaggi HTTP `402` ritentabili relativi alla finestra d'uso o
  al limite di spesa di organizzazione/workspace restano invece nel percorso `rate_limit`.
- `billingBackoffHoursByProvider`: override opzionali per provider per le ore di backoff di fatturazione.
- `billingMaxHours`: limite in ore per la crescita esponenziale del backoff di fatturazione (predefinito: `24`).
- `authPermanentBackoffMinutes`: backoff di base in minuti per errori `auth_permanent` ad alta affidabilità (predefinito: `10`).
- `authPermanentMaxMinutes`: limite in minuti per la crescita del backoff `auth_permanent` (predefinito: `60`).
- `failureWindowHours`: finestra mobile in ore usata per i contatori di backoff (predefinito: `24`).
- `overloadedProfileRotations`: numero massimo di rotazioni dei profili di autenticazione dello stesso provider per errori di sovraccarico prima di passare al fallback del modello (predefinito: `1`). Forme di provider occupato come `ModelNotReadyException` arrivano qui.
- `overloadedBackoffMs`: ritardo fisso prima di ritentare una rotazione di provider/profilo sovraccarico (predefinito: `0`).
- `rateLimitedProfileRotations`: numero massimo di rotazioni dei profili di autenticazione dello stesso provider per errori di limite di frequenza prima di passare al fallback del modello (predefinito: `1`). Questo bucket di limite di frequenza include testo con forma del provider come `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` e `resource exhausted`.

---

## Registrazione

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
- `redactSensitive` / `redactPatterns`: mascheramento best-effort per output della console, log su file, record di log OTLP e testo persistente delle trascrizioni delle sessioni. `redactSensitive: "off"` disabilita solo questa policy generale di log/trascrizione; le superfici di sicurezza UI/strumenti/diagnostica oscurano comunque i segreti prima dell'emissione.

---

## Diagnostica

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

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
- `flags`: array di stringhe di flag che abilitano l'output di log mirato (supporta caratteri jolly come `"telegram.*"` o `"*"`).
- `stuckSessionWarnMs`: soglia di età senza avanzamento in ms per classificare sessioni di elaborazione di lunga durata come `session.long_running`, `session.stalled` o `session.stuck`. Risposte, strumenti, stati, blocchi e avanzamento ACP reimpostano il timer; le diagnostiche `session.stuck` ripetute applicano backoff finché restano invariate.
- `otel.enabled`: abilita la pipeline di esportazione OpenTelemetry (predefinito: `false`). Per la configurazione completa, il catalogo dei segnali e il modello di privacy, consulta [esportazione OpenTelemetry](/it/gateway/opentelemetry).
- `otel.endpoint`: URL del collector per l'esportazione OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP opzionali specifici per segnale. Quando impostati, sostituiscono `otel.endpoint` solo per quel segnale.
- `otel.protocol`: `"http/protobuf"` (predefinito) o `"grpc"`.
- `otel.headers`: intestazioni di metadati HTTP/gRPC aggiuntive inviate con le richieste di esportazione OTel.
- `otel.serviceName`: nome del servizio per gli attributi della risorsa.
- `otel.traces` / `otel.metrics` / `otel.logs`: abilitano l'esportazione di tracce, metriche o log.
- `otel.sampleRate`: frequenza di campionamento delle tracce `0`-`1`.
- `otel.flushIntervalMs`: intervallo periodico di flush della telemetria in ms.
- `otel.captureContent`: acquisizione opzionale del contenuto grezzo per gli attributi degli span OTEL. Disattivata per impostazione predefinita. Il valore booleano `true` acquisisce contenuto di messaggi/strumenti non di sistema; la forma a oggetto consente di abilitare esplicitamente `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` e `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: interruttore d'ambiente per gli attributi più recenti e sperimentali del provider di span GenAI. Per impostazione predefinita gli span mantengono l'attributo legacy `gen_ai.system` per compatibilità; le metriche GenAI usano attributi semantici limitati.
- `OPENCLAW_OTEL_PRELOADED=1`: interruttore d'ambiente per host che hanno già registrato un SDK OpenTelemetry globale. OpenClaw salta quindi l'avvio/arresto dell'SDK di proprietà del Plugin mantenendo attivi i listener diagnostici.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` e `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variabili d'ambiente endpoint specifiche per segnale usate quando la chiave di configurazione corrispondente non è impostata.
- `cacheTrace.enabled`: registra snapshot della traccia cache per esecuzioni incorporate (predefinito: `false`).
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

- `channel`: canale di rilascio per installazioni npm/git: `"stable"`, `"beta"` o `"dev"`.
- `checkOnStart`: controlla gli aggiornamenti npm all'avvio del Gateway (predefinito: `true`).
- `auto.enabled`: abilita l'aggiornamento automatico in background per installazioni da pacchetto (predefinito: `false`).
- `auto.stableDelayHours`: ritardo minimo in ore prima dell'applicazione automatica sul canale stabile (predefinito: `6`; max: `168`).
- `auto.stableJitterHours`: finestra aggiuntiva in ore per distribuire il rollout del canale stabile (predefinito: `12`; max: `168`).
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

- `enabled`: gate globale della funzionalità ACP (predefinito: `true`; imposta `false` per nascondere dispatch ACP e controlli di spawn).
- `dispatch.enabled`: gate indipendente per il dispatch dei turni di sessione ACP (predefinito: `true`). Imposta `false` per mantenere disponibili i comandi ACP bloccandone l'esecuzione.
- `backend`: id del backend di runtime ACP predefinito (deve corrispondere a un Plugin di runtime ACP registrato).
  Installa prima il Plugin backend e, se `plugins.allow` è impostato, includi l'id del Plugin backend (per esempio `acpx`) altrimenti il backend ACP non verrà caricato.
- `defaultAgent`: id dell'agente ACP di destinazione di fallback quando gli spawn non specificano una destinazione esplicita.
- `allowedAgents`: allowlist degli id agente consentiti per le sessioni di runtime ACP; vuota significa nessuna restrizione aggiuntiva.
- `maxConcurrentSessions`: numero massimo di sessioni ACP attive contemporaneamente.
- `stream.coalesceIdleMs`: finestra di flush in inattività in ms per il testo trasmesso in streaming.
- `stream.maxChunkChars`: dimensione massima del chunk prima di dividere la proiezione del blocco in streaming.
- `stream.repeatSuppression`: sopprime righe di stato/strumento ripetute per turno (predefinito: `true`).
- `stream.deliveryMode`: `"live"` trasmette incrementalmente; `"final_only"` accumula fino agli eventi terminali del turno.
- `stream.hiddenBoundarySeparator`: separatore prima del testo visibile dopo eventi strumento nascosti (predefinito: `"paragraph"`).
- `stream.maxOutputChars`: numero massimo di caratteri dell'output dell'assistente proiettati per turno ACP.
- `stream.maxSessionUpdateChars`: numero massimo di caratteri per righe di stato/aggiornamento ACP proiettate.
- `stream.tagVisibility`: record di nomi tag in override booleani di visibilità per eventi in streaming.
- `runtime.ttlMinutes`: TTL di inattività in minuti per i worker di sessione ACP prima che siano idonei alla pulizia.
- `runtime.installCommand`: comando di installazione opzionale da eseguire durante il bootstrap di un ambiente di runtime ACP.

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
  - `"random"` (predefinito): slogan rotanti divertenti/stagionali.
  - `"default"`: slogan neutro fisso (`All your chats, one OpenClaw.`).
  - `"off"`: nessun testo di slogan (titolo/versione del banner comunque mostrati).
- Per nascondere l'intero banner (non solo gli slogan), imposta l'env `OPENCLAW_HIDE_BANNER=1`.

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

Consulta i campi identità di `agents.list` in [valori predefiniti degli agenti](/it/gateway/config-agents#agent-defaults).

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

- `sessionRetention`: per quanto tempo conservare le sessioni di esecuzione cron isolate completate prima della rimozione da `sessions.json`. Controlla anche la pulizia delle trascrizioni cron eliminate archiviate. Predefinito: `24h`; imposta `false` per disabilitare.
- `runLog.maxBytes`: dimensione massima per file di log di esecuzione (`cron/runs/<jobId>.jsonl`) prima della potatura. Predefinito: `2_000_000` byte.
- `runLog.keepLines`: righe più recenti conservate quando viene attivata la potatura del log di esecuzione. Predefinito: `2000`.
- `webhookToken`: bearer token usato per la consegna POST del Webhook cron (`delivery.mode = "webhook"`), se omesso non viene inviata alcuna intestazione di autenticazione.
- `webhook`: URL Webhook legacy deprecato di fallback (http/https) usato solo per job archiviati che hanno ancora `notify: true`.

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

- `maxAttempts`: numero massimo di tentativi per i job una tantum in caso di errori temporanei (predefinito: `3`; intervallo: `0`-`10`).
- `backoffMs`: array di ritardi di backoff in ms per ogni tentativo di ripetizione (predefinito: `[30000, 60000, 300000]`; 1-10 voci).
- `retryOn`: tipi di errore che attivano nuovi tentativi — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Ometti per riprovare tutti i tipi temporanei.

Si applica solo ai job Cron una tantum. I job ricorrenti usano una gestione degli errori separata.

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
- `after`: errori consecutivi prima che venga emesso un avviso (intero positivo, min: `1`).
- `cooldownMs`: millisecondi minimi tra avvisi ripetuti per lo stesso job (intero non negativo).
- `includeSkipped`: conteggia le esecuzioni saltate consecutive nella soglia di avviso (predefinito: `false`). Le esecuzioni saltate vengono tracciate separatamente e non influiscono sul backoff degli errori di esecuzione.
- `mode`: modalità di consegna — `"announce"` invia tramite un messaggio di canale; `"webhook"` pubblica sul Webhook configurato.
- `accountId`: account o ID canale facoltativo per limitare la consegna degli avvisi.

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

- Destinazione predefinita per le notifiche di errore Cron in tutti i job.
- `mode`: `"announce"` o `"webhook"`; il valore predefinito è `"announce"` quando esistono dati di destinazione sufficienti.
- `channel`: override del canale per la consegna announce. `"last"` riutilizza l'ultimo canale di consegna noto.
- `to`: destinazione announce esplicita o URL Webhook. Obbligatorio per la modalità Webhook.
- `accountId`: override facoltativo dell'account per la consegna.
- `delivery.failureDestination` per job sostituisce questo valore globale predefinito.
- Quando non è impostata né una destinazione di errore globale né una per job, i job che consegnano già tramite `announce` ripiegano su quella destinazione announce primaria in caso di errore.
- `delivery.failureDestination` è supportato solo per job con `sessionTarget="isolated"`, a meno che il `delivery.mode` primario del job sia `"webhook"`.

Vedi [Job Cron](/it/automation/cron-jobs). Le esecuzioni Cron isolate sono tracciate come [attività in background](/it/automation/tasks).

---

## Variabili del modello multimediale

Segnaposto dei template espansi in `tools.media.models[].args`:

| Variabile          | Descrizione                                      |
| ------------------ | ------------------------------------------------ |
| `{{Body}}`         | Corpo completo del messaggio in ingresso         |
| `{{RawBody}}`      | Corpo grezzo (senza wrapper di cronologia/mittente) |
| `{{BodyStripped}}` | Corpo con menzioni di gruppo rimosse             |
| `{{From}}`         | Identificatore del mittente                      |
| `{{To}}`           | Identificatore della destinazione                |
| `{{MessageSid}}`   | ID messaggio del canale                          |
| `{{SessionId}}`    | UUID della sessione corrente                     |
| `{{IsNewSession}}` | `"true"` quando viene creata una nuova sessione  |
| `{{MediaUrl}}`     | pseudo-URL dei contenuti multimediali in ingresso |
| `{{MediaPath}}`    | Percorso locale dei contenuti multimediali       |
| `{{MediaType}}`    | Tipo di contenuto multimediale (immagine/audio/documento/...) |
| `{{Transcript}}`   | Trascrizione audio                               |
| `{{Prompt}}`       | Prompt multimediale risolto per le voci CLI      |
| `{{MaxChars}}`     | Numero massimo risolto di caratteri in output per le voci CLI |
| `{{ChatType}}`     | `"direct"` o `"group"`                           |
| `{{GroupSubject}}` | Oggetto del gruppo (best effort)                 |
| `{{GroupMembers}}` | Anteprima dei membri del gruppo (best effort)    |
| `{{SenderName}}`   | Nome visualizzato del mittente (best effort)     |
| `{{SenderE164}}`   | Numero di telefono del mittente (best effort)    |
| `{{Provider}}`     | Suggerimento del provider (whatsapp, telegram, discord, ecc.) |

---

## Include di configurazione (`$include`)

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

**Comportamento di merge:**

- File singolo: sostituisce l'oggetto contenitore.
- Array di file: deep merge in ordine (i successivi sovrascrivono i precedenti).
- Chiavi sorelle: unite dopo gli include (sovrascrivono i valori inclusi).
- Include annidati: fino a 10 livelli di profondità.
- Percorsi: risolti in modo relativo al file che include, ma devono rimanere all'interno della directory di configurazione di primo livello (`dirname` di `openclaw.json`). Le forme assolute/`../` sono consentite solo quando vengono comunque risolte all'interno di quel limite.
- Le scritture di proprietà di OpenClaw che modificano solo una sezione di primo livello supportata da un include a file singolo scrivono direttamente in quel file incluso. Per esempio, `plugins install` aggiorna `plugins: { $include: "./plugins.json5" }` in `plugins.json5` e lascia intatto `openclaw.json`.
- Gli include root, gli array di include e gli include con override di chiavi sorelle sono di sola lettura per le scritture di proprietà di OpenClaw; tali scritture falliscono in modo chiuso invece di appiattire la configurazione.
- Errori: messaggi chiari per file mancanti, errori di parsing e include circolari.

---

_Correlati: [Configurazione](/it/gateway/configuration) · [Esempi di configurazione](/it/gateway/configuration-examples) · [Doctor](/it/gateway/doctor)_

## Correlati

- [Configurazione](/it/gateway/configuration)
- [Esempi di configurazione](/it/gateway/configuration-examples)
