---
read_when:
    - Servono la semantica esatta della configurazione a livello di campo o i valori predefiniti
    - Stai convalidando blocchi di configurazione di canale, modello, Gateway o strumento
summary: Riferimento alla configurazione del Gateway per le chiavi principali di OpenClaw, i valori predefiniti e i link ai riferimenti dedicati dei sottosistemi
title: Riferimento di configurazione
x-i18n:
    generated_at: "2026-05-06T08:49:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 119194a7e041a7ca35b9dd1575c4f4c4d5c67f412cd3002e65bf5b706b210a90
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Riferimento alla configurazione core per `~/.openclaw/openclaw.json`. Per una panoramica orientata alle attività, vedi [Configurazione](/it/gateway/configuration).

Copre le principali superfici di configurazione di OpenClaw e rimanda ad altri riferimenti quando un sottosistema ha un riferimento più approfondito. I cataloghi dei comandi di proprietà di canali e plugin e le opzioni avanzate di memoria/QMD vivono nelle proprie pagine invece che in questa.

Fonte di verità nel codice:

- `openclaw config schema` stampa lo JSON Schema live usato per la convalida e la Control UI, con i metadati bundled/plugin/canale uniti quando disponibili
- `config.schema.lookup` restituisce un nodo schema limitato al percorso per strumenti di drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` convalidano l'hash baseline dei documenti di configurazione rispetto alla superficie schema corrente

Percorso di lookup dell'agente: usa l'azione dello strumento `gateway` `config.schema.lookup` per
documenti e vincoli esatti a livello di campo prima delle modifiche. Usa
[Configurazione](/it/gateway/configuration) per indicazioni orientate alle attività e questa pagina
per la mappa più ampia dei campi, i valori predefiniti e i link ai riferimenti dei sottosistemi.

Riferimenti avanzati dedicati:

- [Riferimento alla configurazione della memoria](/it/reference/memory-config) per `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e la configurazione Dreaming sotto `plugins.entries.memory-core.config.dreaming`
- [Comandi slash](/it/tools/slash-commands) per il catalogo corrente dei comandi integrati + bundled
- pagine del canale/plugin proprietario per superfici di comando specifiche del canale

Il formato di configurazione è **JSON5** (commenti + virgole finali consentiti). Tutti i campi sono opzionali: OpenClaw usa valori predefiniti sicuri quando omessi.

---

## Canali

Le chiavi di configurazione per canale sono state spostate in una pagina dedicata: vedi
[Configurazione - canali](/it/gateway/config-channels) per `channels.*`,
inclusi Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e altri
canali bundled (autenticazione, controllo accessi, multi-account, gating delle menzioni).

## Valori predefiniti degli agenti, multi-agente, sessioni e messaggi

Spostato in una pagina dedicata: vedi
[Configurazione - agenti](/it/gateway/config-agents) per:

- `agents.defaults.*` (workspace, modello, ragionamento, Heartbeat, memoria, media, Skills, sandbox)
- `multiAgent.*` (routing e binding multi-agente)
- `session.*` (ciclo di vita della sessione, Compaction, pruning)
- `messages.*` (consegna dei messaggi, TTS, rendering markdown)
- `talk.*` (modalità Talk)
  - `talk.speechLocale`: ID locale BCP 47 opzionale per il riconoscimento vocale Talk su iOS/macOS
  - `talk.silenceTimeoutMs`: quando non impostato, Talk mantiene la finestra di pausa predefinita della piattaforma prima di inviare la trascrizione (`700 ms on macOS and Android, 900 ms on iOS`)

## Strumenti e provider personalizzati

Policy degli strumenti, toggle sperimentali, configurazione degli strumenti basati su provider e configurazione
di provider personalizzati / URL di base sono stati spostati in una pagina dedicata: vedi
[Configurazione - strumenti e provider personalizzati](/it/gateway/config-tools).

## Modelli

Definizioni dei provider, allowlist dei modelli e configurazione dei provider personalizzati vivono in
[Configurazione - strumenti e provider personalizzati](/it/gateway/config-tools#custom-providers-and-base-urls).
Anche la radice `models` possiede il comportamento globale del catalogo modelli.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: comportamento del catalogo provider (`merge` o `replace`).
- `models.providers`: mappa dei provider personalizzati indicizzata per ID provider.
- `models.pricing.enabled`: controlla il bootstrap dei prezzi in background che
  parte dopo che sidecar e canali raggiungono il percorso Gateway pronto. Quando `false`,
  il Gateway salta i fetch dei cataloghi prezzi di OpenRouter e LiteLLM; i valori configurati
  `models.providers.*.models[].cost` continuano a funzionare per le stime di costo locali.

## MCP

Le definizioni dei server MCP gestiti da OpenClaw vivono sotto `mcp.servers` e sono
consumate da Pi incorporato e da altri adattatori runtime. I comandi `openclaw mcp list`,
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
- `mcp.sessionIdleTtlMs`: TTL di inattività per runtime MCP bundled limitati alla sessione.
  Le esecuzioni incorporate one-shot richiedono pulizia a fine esecuzione; questo TTL è il fallback per
  sessioni a lunga durata e chiamanti futuri.
- Le modifiche sotto `mcp.*` si applicano a caldo eliminando i runtime MCP di sessione in cache.
  La successiva discovery/uso degli strumenti li ricrea dalla nuova configurazione, quindi le voci
  `mcp.servers` rimosse vengono raccolte immediatamente invece di attendere il TTL di inattività.

Vedi [MCP](/it/cli/mcp#openclaw-as-an-mcp-client-registry) e
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

- `allowBundled`: allowlist opzionale solo per Skills bundled (Skills gestite/workspace non interessate).
- `load.extraDirs`: radici aggiuntive condivise per Skills (precedenza più bassa).
- `install.preferBrew`: quando true, preferisce gli installer Homebrew quando `brew` è
  disponibile prima di ripiegare su altri tipi di installer.
- `install.nodeManager`: preferenza dell'installer node per le specifiche `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` disabilita una skill anche se bundled/installata.
- `entries.<skillKey>.apiKey`: scorciatoia per Skills che dichiarano una variabile env primaria (stringa in chiaro o oggetto SecretRef).

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
- La discovery accetta plugin nativi OpenClaw più bundle Codex e bundle Claude compatibili, inclusi bundle Claude senza manifest con layout predefinito.
- **Le modifiche alla configurazione richiedono un riavvio del Gateway.**
- `allow`: allowlist opzionale (vengono caricati solo i plugin elencati). `deny` prevale.
- `bundledDiscovery`: il valore predefinito è `"allowlist"` per le nuove configurazioni, quindi un
  `plugins.allow` non vuoto controlla anche i plugin provider bundled, inclusi i provider runtime
  di ricerca web. Doctor scrive `"compat"` per configurazioni allowlist legacy migrate
  per preservare il comportamento esistente dei provider bundled finché non scegli di aderire.
- `plugins.entries.<id>.apiKey`: campo di comodità per chiavi API a livello di plugin (quando supportato dal plugin).
- `plugins.entries.<id>.env`: mappa di variabili env limitata al plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, core blocca `before_prompt_build` e ignora i campi che mutano il prompt da `before_agent_start` legacy, preservando `modelOverride` e `providerOverride` legacy. Si applica agli hook dei plugin nativi e alle directory hook fornite da bundle supportati.
- `plugins.entries.<id>.hooks.allowConversationAccess`: quando `true`, plugin non bundled attendibili possono leggere contenuto di conversazione grezzo da hook tipizzati come `llm_input`, `llm_output`, `before_agent_finalize` e `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: considera esplicitamente attendibile questo plugin per richiedere override di `provider` e `model` per esecuzione nelle esecuzioni di subagenti in background.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opzionale di target canonici `provider/model` per override attendibili dei subagenti. Usa `"*"` solo quando vuoi intenzionalmente consentire qualsiasi modello.
- `plugins.entries.<id>.config`: oggetto di configurazione definito dal plugin (convalidato dallo schema del plugin nativo OpenClaw quando disponibile).
- Le impostazioni account/runtime dei plugin canale vivono sotto `channels.<id>` e dovrebbero essere descritte dai metadati `channelConfigs` del manifest del plugin proprietario, non da un registro centrale di opzioni OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: impostazioni del provider web-fetch Firecrawl.
  - `apiKey`: chiave API Firecrawl (accetta SecretRef). Ripiega su `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` legacy o variabile env `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL di base dell'API Firecrawl (predefinito: `https://api.firecrawl.dev`; gli override self-hosted devono puntare a endpoint privati/interni).
  - `onlyMainContent`: estrae solo il contenuto principale dalle pagine (predefinito: `true`).
  - `maxAgeMs`: età massima della cache in millisecondi (predefinito: `172800000` / 2 giorni).
  - `timeoutSeconds`: timeout della richiesta di scraping in secondi (predefinito: `60`).
- `plugins.entries.xai.config.xSearch`: impostazioni di xAI X Search (ricerca web Grok).
  - `enabled`: abilita il provider X Search.
  - `model`: modello Grok da usare per la ricerca (ad es. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: impostazioni di Dreaming della memoria. Vedi [Dreaming](/it/concepts/dreaming) per fasi e soglie.
  - `enabled`: interruttore principale di Dreaming (predefinito `false`).
  - `frequency`: cadenza Cron per ogni sweep completo di Dreaming (`"0 3 * * *"` per impostazione predefinita).
  - `model`: override opzionale del modello subagente Dream Diary. Richiede `plugins.entries.memory-core.subagent.allowModelOverride: true`; abbinalo con `allowedModels` per limitare i target. Gli errori di modello non disponibile ritentano una volta con il modello predefinito della sessione; i fallimenti di attendibilità o allowlist non ripiegano silenziosamente.
  - policy delle fasi e soglie sono dettagli di implementazione (non chiavi di configurazione rivolte all'utente).
- La configurazione completa della memoria vive in [Riferimento alla configurazione della memoria](/it/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- I plugin bundle Claude abilitati possono anche contribuire valori predefiniti Pi incorporati da `settings.json`; OpenClaw li applica come impostazioni agente sanificate, non come patch di configurazione OpenClaw grezze.
- `plugins.slots.memory`: scegli l'ID del plugin di memoria attivo, oppure `"none"` per disabilitare i plugin di memoria.
- `plugins.slots.contextEngine`: scegli l'ID del plugin motore di contesto attivo; il valore predefinito è `"legacy"` a meno che tu installi e selezioni un altro motore.

Vedi [Plugin](/it/tools/plugin).

---

## Impegni

`commitments` controlla la memoria di follow-up inferita: OpenClaw può rilevare check-in dai turni di conversazione e consegnarli tramite esecuzioni Heartbeat.

- `commitments.enabled`: abilita estrazione LLM nascosta, archiviazione e consegna Heartbeat per impegni di follow-up inferiti. Predefinito: `false`.
- `commitments.maxPerDay`: numero massimo di impegni di follow-up inferiti consegnati per sessione agente in una giornata mobile. Predefinito: `3`.

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
- `tabCleanup` recupera le schede dell’agente principale tracciate dopo un periodo di inattività o quando una sessione supera il suo limite. Imposta `idleMinutes: 0` o `maxTabsPerSession: 0` per disabilitare quelle singole modalità di pulizia.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` è disabilitato quando non è impostato, quindi la navigazione del browser resta rigorosa per impostazione predefinita.
- Imposta `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` solo quando consideri intenzionalmente attendibile la navigazione del browser su rete privata.
- In modalità rigorosa, gli endpoint dei profili CDP remoti (`profiles.*.cdpUrl`) sono soggetti allo stesso blocco delle reti private durante i controlli di raggiungibilità/rilevamento.
- `ssrfPolicy.allowPrivateNetwork` resta supportato come alias legacy.
- In modalità rigorosa, usa `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` per eccezioni esplicite.
- I profili remoti sono solo attach-only (avvio/arresto/reimpostazione disabilitati).
- `profiles.*.cdpUrl` accetta `http://`, `https://`, `ws://` e `wss://`.
  Usa HTTP(S) quando vuoi che OpenClaw rilevi `/json/version`; usa WS(S)
  quando il tuo provider ti fornisce un URL WebSocket DevTools diretto.
- `remoteCdpTimeoutMs` e `remoteCdpHandshakeTimeoutMs` si applicano alla raggiungibilità CDP remota e
  `attachOnly`, oltre alle richieste di apertura schede. I profili loopback gestiti
  mantengono le impostazioni predefinite CDP locali.
- Se un servizio CDP gestito esternamente è raggiungibile tramite loopback, imposta
  `attachOnly: true` per quel profilo; altrimenti OpenClaw tratta la porta loopback come un
  profilo browser gestito localmente e può segnalare errori di proprietà della porta locale.
- I profili `existing-session` usano Chrome MCP invece di CDP e possono collegarsi
  sull’host selezionato o tramite un browser node connesso.
- I profili `existing-session` possono impostare `userDataDir` per puntare a uno specifico
  profilo browser basato su Chromium, come Brave o Edge.
- I profili `existing-session` mantengono gli attuali limiti di instradamento di Chrome MCP:
  azioni basate su snapshot/ref invece del targeting con selettori CSS, hook di caricamento
  a file singolo, nessuna sovrascrittura del timeout delle finestre di dialogo, nessun
  `wait --load networkidle` e nessuna azione `responsebody`, esportazione PDF, intercettazione download o batch.
- I profili `openclaw` gestiti localmente assegnano automaticamente `cdpPort` e `cdpUrl`; imposta
  `cdpUrl` esplicitamente solo per CDP remoto.
- I profili gestiti localmente possono impostare `executablePath` per sovrascrivere il valore globale
  `browser.executablePath` per quel profilo. Usalo per eseguire un profilo in
  Chrome e un altro in Brave.
- I profili gestiti localmente usano `browser.localLaunchTimeoutMs` per il rilevamento HTTP CDP di Chrome
  dopo l’avvio del processo e `browser.localCdpReadyTimeoutMs` per la prontezza
  del websocket CDP post-avvio. Aumentali sugli host più lenti dove Chrome
  si avvia correttamente ma i controlli di prontezza entrano in competizione con l’avvio. Entrambi i valori devono essere
  interi positivi fino a `120000` ms; i valori di configurazione non validi vengono rifiutati.
- Ordine di rilevamento automatico: browser predefinito se basato su Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` e `browser.profiles.<name>.executablePath` accettano entrambi
  `~` e `~/...` per la directory home del tuo sistema operativo prima dell’avvio di Chromium.
  Anche `userDataDir` per profilo nei profili `existing-session` viene espanso con la tilde.
- Servizio di controllo: solo loopback (porta derivata da `gateway.port`, predefinita `18791`).
- `extraArgs` aggiunge flag di avvio extra all’avvio locale di Chromium (ad esempio
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

- `seamColor`: colore di accento per la chrome dell’interfaccia utente dell’app nativa (tinta della bolla di Talk Mode, ecc.).
- `assistant`: override dell’identità della Control UI. Usa come fallback l’identità dell’agente attivo.

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

- `mode`: `local` (esegui il Gateway) o `remote` (connettiti al Gateway remoto). Il Gateway rifiuta di avviarsi a meno che non sia `local`.
- `port`: singola porta multiplexata per WS + HTTP. Precedenza: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predefinito), `lan` (`0.0.0.0`), `tailnet` (solo IP Tailscale) o `custom`.
- **Alias bind legacy**: usa i valori della modalita bind in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), non gli alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota Docker**: il bind predefinito `loopback` ascolta su `127.0.0.1` dentro il container. Con il networking bridge di Docker (`-p 18789:18789`), il traffico arriva su `eth0`, quindi il Gateway non e raggiungibile. Usa `--network host`, oppure imposta `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) per ascoltare su tutte le interfacce.
- **Auth**: richiesta per impostazione predefinita. I bind non loopback richiedono l'autenticazione del Gateway. In pratica questo significa un token/password condiviso oppure un reverse proxy consapevole dell'identita con `gateway.auth.mode: "trusted-proxy"`. La procedura guidata di onboarding genera un token per impostazione predefinita.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` (incluse le SecretRef), imposta esplicitamente `gateway.auth.mode` su `token` o `password`. I flussi di avvio e di installazione/riparazione del servizio falliscono quando entrambi sono configurati e la modalita non e impostata.
- `gateway.auth.mode: "none"`: modalita esplicita senza autenticazione. Usala solo per configurazioni local loopback attendibili; intenzionalmente non viene proposta dai prompt di onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega l'autenticazione browser/utente a un reverse proxy consapevole dell'identita e considera attendibili le intestazioni di identita da `gateway.trustedProxies` (vedi [Autenticazione tramite proxy attendibile](/it/gateway/trusted-proxy-auth)). Questa modalita si aspetta per impostazione predefinita una sorgente proxy **non loopback**; i reverse proxy loopback sullo stesso host richiedono `gateway.auth.trustedProxy.allowLoopback = true` esplicito. I chiamanti interni sullo stesso host possono usare `gateway.auth.password` come fallback diretto locale; `gateway.auth.token` resta mutuamente esclusivo con la modalita trusted-proxy.
- `gateway.auth.allowTailscale`: quando `true`, le intestazioni di identita di Tailscale Serve possono soddisfare l'autenticazione dell'interfaccia di controllo/WebSocket (verificata tramite `tailscale whois`). Gli endpoint API HTTP **non** usano tale autenticazione con intestazione Tailscale; seguono invece la normale modalita di autenticazione HTTP del Gateway. Questo flusso senza token presuppone che l'host del Gateway sia attendibile. Il valore predefinito e `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitatore opzionale per autenticazioni fallite. Si applica per IP client e per ambito di autenticazione (shared-secret e device-token sono tracciati indipendentemente). I tentativi bloccati restituiscono `429` + `Retry-After`.
  - Nel percorso asincrono dell'interfaccia di controllo Tailscale Serve, i tentativi falliti per lo stesso `{scope, clientIp}` vengono serializzati prima della scrittura dell'errore. Tentativi errati concorrenti dallo stesso client possono quindi far scattare il limitatore alla seconda richiesta invece di passare entrambi in gara come semplici mancati riscontri.
  - `gateway.auth.rateLimit.exemptLoopback` ha valore predefinito `true`; impostalo a `false` quando vuoi intenzionalmente limitare anche il traffico localhost (per configurazioni di test o deployment proxy rigorosi).
- I tentativi di autenticazione WS con origine browser sono sempre limitati con l'esenzione loopback disabilitata (difesa in profondita contro brute force su localhost basati su browser).
- Su loopback, quei blocchi con origine browser sono isolati per valore `Origin`
  normalizzato, quindi fallimenti ripetuti da un'origine localhost non bloccano
  automaticamente un'origine diversa.
- `tailscale.mode`: `serve` (solo tailnet, bind loopback) o `funnel` (pubblico, richiede autenticazione).
- `controlUi.allowedOrigins`: allowlist esplicita delle origini browser per le connessioni WebSocket del Gateway. Richiesta quando sono previsti client browser da origini non loopback.
- `controlUi.chatMessageMaxWidth`: larghezza massima opzionale per i messaggi chat raggruppati dell'interfaccia di controllo. Accetta valori CSS di larghezza vincolati come `960px`, `82%`, `min(1280px, 82%)` e `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modalita pericolosa che abilita il fallback dell'origine da intestazione Host per deployment che si affidano intenzionalmente alla policy di origine basata sull'intestazione Host.
- `remote.transport`: `ssh` (predefinito) o `direct` (ws/wss). Per `direct`, `remote.url` deve essere `ws://` o `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override di emergenza nell'ambiente di processo
  lato client che consente `ws://` in chiaro verso IP di rete privata attendibili;
  il valore predefinito resta solo loopback per il testo in chiaro. Non esiste un
  equivalente in `openclaw.json` e la configurazione di rete privata del browser come
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` non influisce sui client
  WebSocket del Gateway.
- `gateway.remote.token` / `.password` sono campi di credenziali del client remoto. Da soli non configurano l'autenticazione del Gateway.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS di base per il relay APNs esterno usato dalle build iOS ufficiali/TestFlight dopo che pubblicano registrazioni supportate da relay nel Gateway. Questo URL deve corrispondere all'URL del relay compilato nella build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout di invio dal Gateway al relay in millisecondi. Valore predefinito: `10000`.
- Le registrazioni supportate da relay sono delegate a una specifica identita del Gateway. L'app iOS associata recupera `gateway.identity.get`, include tale identita nella registrazione del relay e inoltra al Gateway una concessione di invio con ambito di registrazione. Un altro Gateway non puo riutilizzare quella registrazione memorizzata.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env temporanei per la configurazione relay sopra.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: via di uscita solo per sviluppo per URL relay HTTP loopback. Gli URL relay di produzione dovrebbero restare su HTTPS.
- `gateway.handshakeTimeoutMs`: timeout di handshake WebSocket pre-auth del Gateway in millisecondi. Predefinito: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ha precedenza quando impostato. Aumentalo su host carichi o a bassa potenza in cui i client locali possono connettersi mentre il warmup di avvio si sta ancora stabilizzando.
- `gateway.channelHealthCheckMinutes`: intervallo del monitor di salute del canale in minuti. Imposta `0` per disabilitare globalmente i riavvii del monitor di salute. Predefinito: `5`.
- `gateway.channelStaleEventThresholdMinutes`: soglia socket obsoleti in minuti. Mantienila maggiore o uguale a `gateway.channelHealthCheckMinutes`. Predefinito: `30`.
- `gateway.channelMaxRestartsPerHour`: numero massimo di riavvii del monitor di salute per canale/account in un'ora mobile. Predefinito: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per canale dai riavvii del monitor di salute mantenendo abilitato il monitor globale.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per account per canali multi-account. Quando impostato, ha precedenza sull'override a livello di canale.
- I percorsi di chiamata del Gateway locale possono usare `gateway.remote.*` come fallback solo quando `gateway.auth.*` non e impostato.
- Se `gateway.auth.token` / `gateway.auth.password` e configurato esplicitamente tramite SecretRef e non viene risolto, la risoluzione fallisce in modo chiuso (senza mascheramento tramite fallback remoto).
- `trustedProxies`: IP dei reverse proxy che terminano TLS o iniettano intestazioni del client inoltrato. Elenca solo proxy che controlli. Le voci loopback sono comunque valide per configurazioni di proxy/rilevamento locale sullo stesso host (per esempio Tailscale Serve o un reverse proxy locale), ma **non** rendono le richieste loopback idonee per `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando `true`, il Gateway accetta `X-Real-IP` se manca `X-Forwarded-For`. Predefinito `false` per un comportamento fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist opzionale CIDR/IP per approvare automaticamente il primo pairing di un dispositivo Node senza ambiti richiesti. E disabilitata quando non impostata. Questo non approva automaticamente il pairing operatore/browser/interfaccia di controllo/WebChat e non approva automaticamente upgrade di ruolo, ambito, metadati o chiave pubblica.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: modellazione globale allow/deny per i comandi Node dichiarati dopo il pairing e la valutazione della allowlist della piattaforma. Usa `allowCommands` per abilitare comandi Node pericolosi come `camera.snap`, `camera.clip` e `screen.record`; `denyCommands` rimuove un comando anche se un valore predefinito della piattaforma o un allow esplicito lo includerebbe altrimenti. Dopo che un Node modifica la propria lista di comandi dichiarati, rifiuta e riapprova quel pairing di dispositivo affinche il Gateway memorizzi lo snapshot dei comandi aggiornato.
- `gateway.tools.deny`: nomi di tool aggiuntivi bloccati per HTTP `POST /tools/invoke` (estende l'elenco deny predefinito).
- `gateway.tools.allow`: rimuove nomi di tool dall'elenco deny HTTP predefinito.

</Accordion>

### Endpoint compatibili con OpenAI

- Chat Completions: disabilitato per impostazione predefinita. Abilita con `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Irrigidimento dell'input URL di Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Le allowlist vuote sono trattate come non impostate; usa `gateway.http.endpoints.responses.files.allowUrl=false`
    e/o `gateway.http.endpoints.responses.images.allowUrl=false` per disabilitare il recupero URL.
- Intestazione opzionale di irrigidimento della risposta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (imposta solo per origini HTTPS che controlli; vedi [Autenticazione tramite proxy attendibile](/it/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento multi-istanza

Esegui piu Gateway su un host con porte e directory di stato univoche:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flag di comodita: `--dev` (usa `~/.openclaw-dev` + porta `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

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
- `autoGenerate`: genera automaticamente una coppia cert/key autofirmata locale quando i file espliciti non sono configurati; solo per uso locale/dev.
- `certPath`: percorso del filesystem al file del certificato TLS.
- `keyPath`: percorso del filesystem al file della chiave privata TLS; mantieni permessi restrittivi.
- `caPath`: percorso opzionale del bundle CA per la verifica client o catene di attendibilita personalizzate.

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
  - `"restart"`: riavvia sempre il processo Gateway a ogni modifica della configurazione.
  - `"hot"`: applica le modifiche nel processo senza riavviare.
  - `"hybrid"` (predefinito): prova prima l'hot reload; ripiega sul riavvio se richiesto.
- `debounceMs`: finestra di debounce in ms prima che le modifiche alla configurazione vengano applicate (intero non negativo).
- `deferralTimeoutMs`: tempo massimo opzionale in ms da attendere per le operazioni in corso prima di forzare un riavvio. Omettilo per usare l'attesa limitata predefinita (`300000`); imposta `0` per attendere indefinitamente e registrare avvisi periodici per operazioni ancora in sospeso.

---

## Agganci

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
I token dei ganci nella stringa di query vengono rifiutati.

Note su convalida e sicurezza:

- `hooks.enabled=true` richiede un `hooks.token` non vuoto.
- `hooks.token` deve essere **distinto** da `gateway.auth.token`; il riutilizzo del token del Gateway viene rifiutato.
- `hooks.path` non può essere `/`; usa un sottopercorso dedicato come `/hooks`.
- Se `hooks.allowRequestSessionKey=true`, limita `hooks.allowedSessionKeyPrefixes` (ad esempio `["hook:"]`).
- Se una mappatura o una preimpostazione usa un `sessionKey` basato su modello, imposta `hooks.allowedSessionKeyPrefixes` e `hooks.allowRequestSessionKey=true`. Le chiavi di mappatura statiche non richiedono questa adesione esplicita.

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` dal payload della richiesta viene accettato solo quando `hooks.allowRequestSessionKey=true` (predefinito: `false`).
- `POST /hooks/<name>` → risolto tramite `hooks.mappings`
  - I valori `sessionKey` della mappatura renderizzati da modello sono trattati come forniti esternamente e richiedono anche `hooks.allowRequestSessionKey=true`.

<Accordion title="Dettagli della mappatura">

- `match.path` corrisponde al sottopercorso dopo `/hooks` (ad es. `/hooks/gmail` → `gmail`).
- `match.source` corrisponde a un campo del payload per i percorsi generici.
- Modelli come `{{messages[0].subject}}` leggono dal payload.
- `transform` può puntare a un modulo JS/TS che restituisce un'azione del gancio.
  - `transform.module` deve essere un percorso relativo e resta dentro `hooks.transformsDir` (i percorsi assoluti e l'attraversamento vengono rifiutati).
  - Mantieni `hooks.transformsDir` sotto `~/.openclaw/hooks/transforms`; le directory Skills dell'area di lavoro vengono rifiutate. Se `openclaw doctor` segnala questo percorso come non valido, sposta il modulo di trasformazione nella directory delle trasformazioni dei ganci o rimuovi `hooks.transformsDir`.
- `agentId` instrada verso un agente specifico; gli ID sconosciuti ripiegano sul valore predefinito.
- `allowedAgentIds`: limita l'instradamento esplicito (`*` o omesso = consenti tutto, `[]` = nega tutto).
- `defaultSessionKey`: chiave di sessione fissa opzionale per le esecuzioni dell'agente dei ganci senza `sessionKey` esplicito.
- `allowRequestSessionKey`: consente ai chiamanti di `/hooks/agent` e alle chiavi di sessione della mappatura guidate da modello di impostare `sessionKey` (predefinito: `false`).
- `allowedSessionKeyPrefixes`: elenco consentito opzionale di prefissi per i valori `sessionKey` espliciti (richiesta + mappatura), ad es. `["hook:"]`. Diventa obbligatorio quando una mappatura o una preimpostazione usa un `sessionKey` basato su modello.
- `deliver: true` invia la risposta finale a un canale; `channel` usa `last` come predefinito.
- `model` sostituisce l'LLM per questa esecuzione del gancio (deve essere consentito se il catalogo dei modelli è impostato).

</Accordion>

### Integrazione Gmail

- La preimpostazione Gmail integrata usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Se mantieni quell'instradamento per messaggio, imposta `hooks.allowRequestSessionKey: true` e limita `hooks.allowedSessionKeyPrefixes` in modo che corrisponda allo spazio dei nomi Gmail, ad esempio `["hook:", "hook:gmail:"]`.
- Se ti serve `hooks.allowRequestSessionKey: false`, sostituisci la preimpostazione con un `sessionKey` statico invece del valore predefinito basato su modello.

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

- Gateway avvia automaticamente `gog gmail watch serve` all'avvio quando configurato. Imposta `OPENCLAW_SKIP_GMAIL_WATCHER=1` per disabilitare.
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

- Serve HTML/CSS/JS modificabili dall'agente e A2UI su HTTP sotto la porta del Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Solo locale: mantieni `gateway.bind: "loopback"` (predefinito).
- Binding non loopback: le route canvas richiedono l'autenticazione del Gateway (token/password/proxy attendibile), come le altre superfici HTTP del Gateway.
- Le WebView di Node in genere non inviano header di autenticazione; dopo che un nodo è associato e connesso, il Gateway pubblicizza URL di capacità con ambito nodo per l'accesso a canvas/A2UI.
- Gli URL di capacità sono vincolati alla sessione WS attiva del nodo e scadono rapidamente. Il ripiego basato su IP non viene usato.
- Inietta il client di ricaricamento live nell'HTML servito.
- Crea automaticamente un `index.html` iniziale quando vuoto.
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

- `minimal` (predefinito quando il Plugin `bonjour` incluso è abilitato): omette `cliPath` + `sshPort` dai record TXT.
- `full`: include `cliPath` + `sshPort`; la pubblicità multicast LAN richiede comunque che il Plugin `bonjour` incluso sia abilitato.
- `off`: sopprime la pubblicità multicast LAN senza modificare l'abilitazione del Plugin.
- Il Plugin `bonjour` incluso si avvia automaticamente sugli host macOS ed è opzionale su Linux, Windows e distribuzioni Gateway containerizzate.
- Il nome host usa come predefinito il nome host di sistema quando è un'etichetta DNS valida, altrimenti ripiega su `openclaw`. Sovrascrivi con `OPENCLAW_MDNS_HOSTNAME`.

### Ad area estesa (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Scrive una zona DNS-SD unicast sotto `~/.openclaw/dns/`. Per il rilevamento tra reti, abbina un server DNS (CoreDNS consigliato) + DNS suddiviso Tailscale.

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
- Consulta [Ambiente](/it/help/environment) per la precedenza completa.

### Sostituzione delle variabili env

Riferisci le variabili env in qualsiasi stringa di configurazione con `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Corrispondono solo i nomi maiuscoli: `[A-Z_][A-Z0-9_]*`.
- Le variabili mancanti/vuote generano un errore al caricamento della configurazione.
- Esegui l'escape con `$${VAR}` per un `${VAR}` letterale.
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
- Id per `source: "file"`: puntatore JSON assoluto (ad esempio `"/providers/openai/apiKey"`)
- Pattern dell'id per `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- Gli id per `source: "exec"` non devono contenere segmenti di percorso delimitati da slash `.` o `..` (ad esempio `a/../b` viene rifiutato)

### Superficie delle credenziali supportata

- Matrice canonica: [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface)
- `secrets apply` si rivolge ai percorsi delle credenziali supportati di `openclaw.json`.
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
- Per impostazione predefinita, i percorsi dei comandi symlink vengono rifiutati. Imposta `allowSymlinkCommand: true` per consentire i percorsi symlink mentre convalidi il percorso di destinazione risolto.
- Se `trustedDirs` è configurato, il controllo trusted-dir si applica al percorso di destinazione risolto.
- L'ambiente figlio di `exec` è minimo per impostazione predefinita; passa esplicitamente le variabili richieste con `passEnv`.
- I riferimenti ai segreti vengono risolti al momento dell'attivazione in uno snapshot in memoria, poi i percorsi delle richieste leggono solo lo snapshot.
- Il filtro della superficie attiva si applica durante l'attivazione: i riferimenti non risolti su superfici abilitate fanno fallire l'avvio/ricaricamento, mentre le superfici inattive vengono saltate con diagnostica.

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
- Le mappe piatte legacy di `auth-profiles.json` come `{ "provider": { "apiKey": "..." } }` non sono un formato runtime; `openclaw doctor --fix` le riscrive in profili API-key canonici `provider:default` con un backup `.legacy-flat.*.bak`.
- I profili in modalità OAuth (`auth.profiles.<id>.mode = "oauth"`) non supportano credenziali auth-profile basate su SecretRef.
- Le credenziali runtime statiche provengono da snapshot risolti in memoria; le voci statiche legacy di `auth.json` vengono ripulite quando rilevate.
- Import OAuth legacy da `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: backoff di base in ore quando un profilo non riesce a causa di veri errori di fatturazione/credito insufficiente (predefinito: `5`). Il testo esplicito di fatturazione può comunque arrivare qui anche su risposte `401`/`403`, ma i matcher di testo specifici del provider restano limitati al provider che li possiede (per esempio OpenRouter `Key limit exceeded`). I messaggi HTTP `402` ritentabili relativi alla finestra di utilizzo o ai limiti di spesa di organizzazione/workspace restano invece nel percorso `rate_limit`.
- `billingBackoffHoursByProvider`: override opzionali per provider per le ore di backoff di fatturazione.
- `billingMaxHours`: limite in ore per la crescita esponenziale del backoff di fatturazione (predefinito: `24`).
- `authPermanentBackoffMinutes`: backoff di base in minuti per errori `auth_permanent` ad alta affidabilità (predefinito: `10`).
- `authPermanentMaxMinutes`: limite in minuti per la crescita del backoff `auth_permanent` (predefinito: `60`).
- `failureWindowHours`: finestra mobile in ore usata per i contatori di backoff (predefinito: `24`).
- `overloadedProfileRotations`: numero massimo di rotazioni di profili di autenticazione dello stesso provider per errori di sovraccarico prima di passare al fallback del modello (predefinito: `1`). Forme di provider occupato come `ModelNotReadyException` arrivano qui.
- `overloadedBackoffMs`: ritardo fisso prima di ritentare una rotazione di provider/profilo sovraccarico (predefinito: `0`).
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
- `redactSensitive` / `redactPatterns`: mascheramento best-effort per output della console, log su file, record di log OTLP e testo persistente della trascrizione della sessione. `redactSensitive: "off"` disabilita solo questa policy generale per log/trascrizioni; le superfici di sicurezza UI/strumenti/diagnostica continuano a oscurare i segreti prima dell'emissione.

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
- `flags`: array di stringhe flag che abilitano output di log mirato (supporta wildcard come `"telegram.*"` o `"*"`).
- `stuckSessionWarnMs`: soglia di età senza avanzamento in ms per classificare sessioni di elaborazione di lunga durata come `session.long_running`, `session.stalled` o `session.stuck`. Risposta, strumento, stato, blocco e avanzamento ACP reimpostano il timer; le diagnostiche `session.stuck` ripetute aumentano il backoff finché restano invariate.
- `stuckSessionAbortMs`: soglia di età senza avanzamento in ms prima che il lavoro attivo bloccato idoneo possa essere svuotato con abort per il recupero. Quando non impostato, OpenClaw usa la finestra incorporata estesa più sicura di almeno 10 minuti e 5x `stuckSessionWarnMs`.
- `otel.enabled`: abilita la pipeline di esportazione OpenTelemetry (predefinito: `false`). Per la configurazione completa, il catalogo dei segnali e il modello di privacy, consulta [esportazione OpenTelemetry](/it/gateway/opentelemetry).
- `otel.endpoint`: URL del collector per l'esportazione OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP opzionali specifici per segnale. Quando impostati, sovrascrivono `otel.endpoint` solo per quel segnale.
- `otel.protocol`: `"http/protobuf"` (predefinito) o `"grpc"`.
- `otel.headers`: header di metadati HTTP/gRPC extra inviati con le richieste di esportazione OTel.
- `otel.serviceName`: nome del servizio per gli attributi della risorsa.
- `otel.traces` / `otel.metrics` / `otel.logs`: abilita l'esportazione di trace, metriche o log.
- `otel.sampleRate`: frequenza di campionamento delle trace `0`-`1`.
- `otel.flushIntervalMs`: intervallo periodico di flush della telemetria in ms.
- `otel.captureContent`: acquisizione opt-in di contenuto grezzo per gli attributi degli span OTEL. Disattivata per impostazione predefinita. Il booleano `true` acquisisce contenuto di messaggi/strumenti non di sistema; la forma a oggetto consente di abilitare esplicitamente `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` e `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: interruttore d'ambiente per gli attributi più recenti sperimentali del provider di span GenAI. Per impostazione predefinita, gli span mantengono l'attributo legacy `gen_ai.system` per compatibilità; le metriche GenAI usano attributi semantici limitati.
- `OPENCLAW_OTEL_PRELOADED=1`: interruttore d'ambiente per host che hanno già registrato un SDK OpenTelemetry globale. OpenClaw quindi salta avvio/arresto dell'SDK di proprietà del Plugin mantenendo attivi i listener diagnostici.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` e `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variabili d'ambiente endpoint specifiche per segnale usate quando la chiave di configurazione corrispondente non è impostata.
- `cacheTrace.enabled`: registra snapshot delle trace della cache per esecuzioni incorporate (predefinito: `false`).
- `cacheTrace.filePath`: percorso di output per JSONL delle trace della cache (predefinito: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controllano cosa è incluso nell'output delle trace della cache (tutti predefiniti: `true`).

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
- `checkOnStart`: controlla aggiornamenti npm all'avvio del Gateway (predefinito: `true`).
- `auto.enabled`: abilita l'aggiornamento automatico in background per installazioni da pacchetto (predefinito: `false`).
- `auto.stableDelayHours`: ritardo minimo in ore prima dell'applicazione automatica sul canale stabile (predefinito: `6`; massimo: `168`).
- `auto.stableJitterHours`: finestra extra in ore per distribuire il rollout del canale stabile (predefinito: `12`; massimo: `168`).
- `auto.betaCheckIntervalHours`: frequenza in ore con cui vengono eseguiti i controlli del canale beta (predefinito: `1`; massimo: `24`).

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
- `dispatch.enabled`: gate indipendente per il dispatch dei turni di sessione ACP (predefinito: `true`). Imposta `false` per mantenere disponibili i comandi ACP bloccando l'esecuzione.
- `backend`: ID predefinito del backend runtime ACP (deve corrispondere a un Plugin runtime ACP registrato).
  Installa prima il Plugin backend e, se `plugins.allow` è impostato, includi l'ID del Plugin backend (per esempio `acpx`) altrimenti il backend ACP non verrà caricato.
- `defaultAgent`: ID agente ACP target di fallback quando gli spawn non specificano un target esplicito.
- `allowedAgents`: allowlist di ID agente consentiti per sessioni runtime ACP; vuoto significa nessuna restrizione aggiuntiva.
- `maxConcurrentSessions`: numero massimo di sessioni ACP attive contemporaneamente.
- `stream.coalesceIdleMs`: finestra di flush in inattività in ms per testo in streaming.
- `stream.maxChunkChars`: dimensione massima del chunk prima di suddividere la proiezione del blocco in streaming.
- `stream.repeatSuppression`: sopprime righe di stato/strumento ripetute per turno (predefinito: `true`).
- `stream.deliveryMode`: `"live"` trasmette in modo incrementale; `"final_only"` bufferizza fino agli eventi terminali del turno.
- `stream.hiddenBoundarySeparator`: separatore prima del testo visibile dopo eventi strumento nascosti (predefinito: `"paragraph"`).
- `stream.maxOutputChars`: numero massimo di caratteri dell'output dell'assistente proiettati per turno ACP.
- `stream.maxSessionUpdateChars`: numero massimo di caratteri per righe ACP di stato/aggiornamento proiettate.
- `stream.tagVisibility`: record di nomi tag verso override booleani di visibilità per eventi in streaming.
- `runtime.ttlMinutes`: TTL di inattività in minuti per i worker di sessione ACP prima che siano idonei alla pulizia.
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
- Per nascondere l'intero banner (non solo le tagline), imposta la variabile d'ambiente `OPENCLAW_HIDE_BANNER=1`.

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

Consulta i campi identità di `agents.list` in [impostazioni predefinite degli agenti](/it/gateway/config-agents#agent-defaults).

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

- `sessionRetention`: per quanto tempo conservare le sessioni completate delle esecuzioni Cron isolate prima della rimozione da `sessions.json`. Controlla anche la pulizia delle trascrizioni Cron archiviate eliminate. Predefinito: `24h`; imposta `false` per disabilitare.
- `runLog.maxBytes`: dimensione massima per file di log di esecuzione (`cron/runs/<jobId>.jsonl`) prima della rimozione. Predefinito: `2_000_000` byte.
- `runLog.keepLines`: righe più recenti conservate quando viene attivata la rimozione dei log di esecuzione. Predefinito: `2000`.
- `webhookToken`: token bearer usato per la consegna POST del Webhook Cron (`delivery.mode = "webhook"`); se omesso, non viene inviato alcun header di autenticazione.
- `webhook`: URL Webhook di fallback legacy deprecato (http/https) usato solo per i job archiviati che hanno ancora `notify: true`.

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

- `maxAttempts`: numero massimo di tentativi per i job a esecuzione singola in caso di errori transitori (predefinito: `3`; intervallo: `0`-`10`).
- `backoffMs`: array di ritardi di backoff in ms per ogni tentativo (predefinito: `[30000, 60000, 300000]`; 1-10 voci).
- `retryOn`: tipi di errore che attivano i nuovi tentativi - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Ometti per ritentare tutti i tipi transitori.

Si applica solo ai job Cron a esecuzione singola. I job ricorrenti usano una gestione degli errori separata.

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
- `after`: errori consecutivi prima dell’invio di un avviso (intero positivo, minimo: `1`).
- `cooldownMs`: millisecondi minimi tra avvisi ripetuti per lo stesso job (intero non negativo).
- `includeSkipped`: conta le esecuzioni consecutive saltate ai fini della soglia di avviso (predefinito: `false`). Le esecuzioni saltate vengono tracciate separatamente e non influiscono sul backoff degli errori di esecuzione.
- `mode`: modalità di consegna - `"announce"` invia tramite un messaggio di canale; `"webhook"` pubblica sul Webhook configurato.
- `accountId`: account o id canale opzionale per delimitare la consegna degli avvisi.

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
- `channel`: override del canale per la consegna announce. `"last"` riutilizza l’ultimo canale di consegna noto.
- `to`: destinazione announce esplicita o URL Webhook. Obbligatorio per la modalità Webhook.
- `accountId`: override opzionale dell’account per la consegna.
- `delivery.failureDestination` per singolo job sostituisce questo valore globale predefinito.
- Quando non è impostata né una destinazione di errore globale né una per singolo job, i job che già consegnano tramite `announce` usano come fallback quella destinazione announce primaria in caso di errore.
- `delivery.failureDestination` è supportato solo per i job con `sessionTarget="isolated"`, a meno che la `delivery.mode` primaria del job non sia `"webhook"`.

Vedi [Job Cron](/it/automation/cron-jobs). Le esecuzioni Cron isolate sono tracciate come [attività in background](/it/automation/tasks).

---

## Variabili del modello media per i template

Segnaposto dei template espansi in `tools.media.models[].args`:

| Variabile          | Descrizione                                      |
| ------------------ | ------------------------------------------------ |
| `{{Body}}`         | Corpo completo del messaggio in ingresso         |
| `{{RawBody}}`      | Corpo grezzo (senza wrapper di cronologia/mittente) |
| `{{BodyStripped}}` | Corpo con menzioni di gruppo rimosse             |
| `{{From}}`         | Identificatore del mittente                      |
| `{{To}}`           | Identificatore della destinazione                |
| `{{MessageSid}}`   | id messaggio del canale                          |
| `{{SessionId}}`    | UUID della sessione corrente                     |
| `{{IsNewSession}}` | `"true"` quando viene creata una nuova sessione  |
| `{{MediaUrl}}`     | pseudo-URL media in ingresso                     |
| `{{MediaPath}}`    | percorso media locale                            |
| `{{MediaType}}`    | tipo di media (immagine/audio/documento/…)       |
| `{{Transcript}}`   | trascrizione audio                               |
| `{{Prompt}}`       | prompt media risolto per le voci CLI             |
| `{{MaxChars}}`     | caratteri massimi di output risolti per le voci CLI |
| `{{ChatType}}`     | `"direct"` o `"group"`                           |
| `{{GroupSubject}}` | oggetto del gruppo (al meglio possibile)         |
| `{{GroupMembers}}` | anteprima dei membri del gruppo (al meglio possibile) |
| `{{SenderName}}`   | nome visualizzato del mittente (al meglio possibile) |
| `{{SenderE164}}`   | numero di telefono del mittente (al meglio possibile) |
| `{{Provider}}`     | suggerimento del provider (whatsapp, telegram, discord, ecc.) |

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

**Comportamento di merge:**

- File singolo: sostituisce l’oggetto contenitore.
- Array di file: merge profondo nell’ordine indicato (quelli successivi sovrascrivono quelli precedenti).
- Chiavi sorelle: unite dopo le inclusioni (sovrascrivono i valori inclusi).
- Inclusioni annidate: fino a 10 livelli di profondità.
- Percorsi: risolti rispetto al file che include, ma devono restare dentro la directory di configurazione di livello superiore (`dirname` di `openclaw.json`). Le forme assolute/`../` sono consentite solo quando si risolvono comunque dentro quel perimetro.
- Le scritture di proprietà di OpenClaw che modificano solo una sezione di livello superiore supportata da un’inclusione a file singolo vengono scritte direttamente nel file incluso. Ad esempio, `plugins install` aggiorna `plugins: { $include: "./plugins.json5" }` in `plugins.json5` e lascia intatto `openclaw.json`.
- Le inclusioni root, gli array di inclusioni e le inclusioni con override di chiavi sorelle sono di sola lettura per le scritture di proprietà di OpenClaw; tali scritture falliscono in modo chiuso invece di appiattire la configurazione.
- Errori: messaggi chiari per file mancanti, errori di parsing e inclusioni circolari.

---

_Correlati: [Configurazione](/it/gateway/configuration) · [Esempi di configurazione](/it/gateway/configuration-examples) · [Doctor](/it/gateway/doctor)_

## Correlati

- [Configurazione](/it/gateway/configuration)
- [Esempi di configurazione](/it/gateway/configuration-examples)
