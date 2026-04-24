---
read_when:
    - Hai bisogno della semantica esatta o dei valori predefiniti dei campi di configurazione
    - Stai validando blocchi di configurazione di canale, modello, Gateway o strumento
summary: Riferimento della configurazione del Gateway per le chiavi principali di OpenClaw, i valori predefiniti e i link ai riferimenti dedicati dei sottosistemi
title: Riferimento della configurazione
x-i18n:
    generated_at: "2026-04-24T08:39:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc0d9feea2f2707f267d50ec83aa664ef503db8f9132762345cc80305f8bef73
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Riferimento della configurazione principale per `~/.openclaw/openclaw.json`. Per una panoramica orientata alle attività, vedi [Configurazione](/it/gateway/configuration).

Questa pagina copre le principali superfici di configurazione di OpenClaw e rimanda ad altre pagine quando un sottosistema ha un proprio riferimento più approfondito. **Non** cerca di includere inline ogni catalogo di comandi posseduto da canali/plugin o ogni opzione approfondita di memory/QMD in un'unica pagina.

Fonte di verità del codice:

- `openclaw config schema` stampa il JSON Schema live usato per la validazione e la UI Control, con i metadati bundled/plugin/channel uniti quando disponibili
- `config.schema.lookup` restituisce un singolo nodo di schema con ambito di percorso per strumenti di drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` convalidano l'hash baseline della documentazione di configurazione rispetto alla superficie dello schema corrente

Riferimenti dedicati approfonditi:

- [Riferimento configurazione della memoria](/it/reference/memory-config) per `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e la configurazione Dreaming sotto `plugins.entries.memory-core.config.dreaming`
- [Comandi slash](/it/tools/slash-commands) per il catalogo attuale dei comandi integrati + bundled
- pagine del canale/plugin proprietario per le superfici di comando specifiche del canale

Il formato di configurazione è **JSON5** (commenti + virgole finali consentiti). Tutti i campi sono facoltativi — OpenClaw usa valori predefiniti sicuri quando vengono omessi.

---

## Canali

Le chiavi di configurazione per canale sono state spostate in una pagina dedicata — vedi
[Configurazione — canali](/it/gateway/config-channels) per `channels.*`,
inclusi Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e altri
canali bundled (auth, controllo accessi, multi-account, controllo delle menzioni).

## Valori predefiniti dell'agente, multi-agent, sessioni e messaggi

Spostati in una pagina dedicata — vedi
[Configurazione — agenti](/it/gateway/config-agents) per:

- `agents.defaults.*` (spazio di lavoro, modello, ragionamento, Heartbeat, memoria, media, Skills, sandbox)
- `multiAgent.*` (instradamento e binding multi-agent)
- `session.*` (ciclo di vita della sessione, Compaction, potatura)
- `messages.*` (consegna dei messaggi, TTS, rendering Markdown)
- `talk.*` (modalità Talk)
  - `talk.silenceTimeoutMs`: quando non è impostato, Talk mantiene la finestra di pausa predefinita della piattaforma prima di inviare la trascrizione (`700 ms su macOS e Android, 900 ms su iOS`)

## Strumenti e provider personalizzati

Il criterio degli strumenti, i toggle sperimentali, la configurazione degli strumenti supportati da provider e la configurazione dei provider personalizzati / URL base
sono stati spostati in una pagina dedicata — vedi
[Configurazione — strumenti e provider personalizzati](/it/gateway/config-tools).

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // oppure stringa plaintext
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist facoltativa solo per le Skills bundled (le Skills gestite/dello spazio di lavoro non sono influenzate).
- `load.extraDirs`: radici di Skills condivise aggiuntive (precedenza più bassa).
- `install.preferBrew`: quando è true, preferisce gli installer Homebrew quando `brew` è
  disponibile prima di ripiegare su altri tipi di installer.
- `install.nodeManager`: preferenza dell'installer Node per le specifiche `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` disabilita una Skill anche se bundled/installata.
- `entries.<skillKey>.apiKey`: comodità per le Skills che dichiarano una variabile env primaria (stringa plaintext o oggetto SecretRef).

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

- Caricati da `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, più `plugins.load.paths`.
- L'individuazione accetta plugin OpenClaw nativi più bundle Codex compatibili e bundle Claude, inclusi i bundle Claude senza manifest con layout predefinito.
- **Le modifiche alla configurazione richiedono un riavvio del gateway.**
- `allow`: allowlist facoltativa (si caricano solo i plugin elencati). `deny` ha la precedenza.
- `plugins.entries.<id>.apiKey`: campo di comodità per la chiave API a livello plugin (quando supportato dal plugin).
- `plugins.entries.<id>.env`: mappa di variabili env con ambito plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, il core blocca `before_prompt_build` e ignora i campi che modificano il prompt dal legacy `before_agent_start`, preservando al tempo stesso il legacy `modelOverride` e `providerOverride`. Si applica agli hook plugin nativi e alle directory di hook fornite dal bundle supportato.
- `plugins.entries.<id>.subagent.allowModelOverride`: considera esplicitamente affidabile questo plugin per richiedere override per esecuzione di `provider` e `model` per esecuzioni di sottoagenti in background.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist facoltativa di destinazioni canoniche `provider/model` per override fidati dei sottoagenti. Usa `"*"` solo quando vuoi intenzionalmente consentire qualsiasi modello.
- `plugins.entries.<id>.config`: oggetto di configurazione definito dal plugin (convalidato dallo schema del plugin OpenClaw nativo quando disponibile).
- `plugins.entries.firecrawl.config.webFetch`: impostazioni del provider web-fetch Firecrawl.
  - `apiKey`: chiave API Firecrawl (accetta SecretRef). Usa come fallback `plugins.entries.firecrawl.config.webSearch.apiKey`, il legacy `tools.web.fetch.firecrawl.apiKey` o la variabile env `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base API Firecrawl (predefinito: `https://api.firecrawl.dev`).
  - `onlyMainContent`: estrai solo il contenuto principale dalle pagine (predefinito: `true`).
  - `maxAgeMs`: età massima della cache in millisecondi (predefinito: `172800000` / 2 giorni).
  - `timeoutSeconds`: timeout della richiesta di scraping in secondi (predefinito: `60`).
- `plugins.entries.xai.config.xSearch`: impostazioni di xAI X Search (ricerca web Grok).
  - `enabled`: abilita il provider X Search.
  - `model`: modello Grok da usare per la ricerca (ad es. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: impostazioni di Dreaming della memoria. Vedi [Dreaming](/it/concepts/dreaming) per fasi e soglie.
  - `enabled`: switch principale di Dreaming (predefinito `false`).
  - `frequency`: cadenza Cron per ogni sweep completo di Dreaming (predefinito `"0 3 * * *"`).
  - il criterio di fase e le soglie sono dettagli di implementazione (non chiavi di configurazione esposte all'utente).
- La configurazione completa della memoria si trova in [Riferimento configurazione della memoria](/it/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- I plugin bundle Claude abilitati possono anche contribuire con valori predefiniti Pi incorporati da `settings.json`; OpenClaw li applica come impostazioni dell'agente sanificate, non come patch grezze della configurazione OpenClaw.
- `plugins.slots.memory`: scegli l'id del plugin di memoria attivo, oppure `"none"` per disabilitare i plugin di memoria.
- `plugins.slots.contextEngine`: scegli l'id del plugin del motore di contesto attivo; il valore predefinito è `"legacy"` a meno che non installi e selezioni un altro motore.
- `plugins.installs`: metadati di installazione gestiti dalla CLI usati da `openclaw plugins update`.
  - Include `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Tratta `plugins.installs.*` come stato gestito; preferisci i comandi CLI alle modifiche manuali.

Vedi [Plugin](/it/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // attiva solo per accesso fidato a reti private
      // allowPrivateNetwork: true, // alias legacy
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` è disabilitato quando non impostato, quindi la navigazione del browser resta rigorosa per impostazione predefinita.
- Imposta `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` solo quando intendi fidarti intenzionalmente della navigazione del browser nella rete privata.
- In modalità rigorosa, gli endpoint di profilo CDP remoti (`profiles.*.cdpUrl`) sono soggetti allo stesso blocco di rete privata durante i controlli di raggiungibilità/individuazione.
- `ssrfPolicy.allowPrivateNetwork` resta supportato come alias legacy.
- In modalità rigorosa, usa `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` per eccezioni esplicite.
- I profili remoti sono solo attach (avvio/arresto/reset disabilitati).
- `profiles.*.cdpUrl` accetta `http://`, `https://`, `ws://` e `wss://`.
  Usa HTTP(S) quando vuoi che OpenClaw individui `/json/version`; usa WS(S)
  quando il tuo provider ti fornisce un URL WebSocket DevTools diretto.
- I profili `existing-session` usano Chrome MCP invece di CDP e possono collegarsi
  all'host selezionato o tramite un browser Node connesso.
- I profili `existing-session` possono impostare `userDataDir` per puntare a un profilo browser
  specifico basato su Chromium come Brave o Edge.
- I profili `existing-session` mantengono gli attuali limiti di instradamento di Chrome MCP:
  azioni basate su snapshot/ref invece del targeting tramite selettori CSS, hook di upload di un solo file,
  nessun override del timeout delle finestre di dialogo, nessun `wait --load networkidle`, e nessun
  `responsebody`, export PDF, intercettazione dei download o azioni batch.
- I profili locali gestiti `openclaw` assegnano automaticamente `cdpPort` e `cdpUrl`; imposta
  `cdpUrl` esplicitamente solo per CDP remoto.
- Ordine di rilevamento automatico: browser predefinito se basato su Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Servizio di controllo: solo loopback (porta derivata da `gateway.port`, predefinita `18791`).
- `extraArgs` aggiunge flag di avvio extra all'avvio locale di Chromium (ad esempio
  `--disable-gpu`, dimensionamento finestra o flag di debug).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, testo breve, URL immagine o data URI
    },
  },
}
```

- `seamColor`: colore di accento per il chrome della UI dell'app nativa (tinta della bolla in modalità Talk, ecc.).
- `assistant`: override dell'identità della UI Control. Usa come fallback l'identità dell'agente attivo.

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
      // password: "your-password", // oppure OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // per mode=trusted-proxy; vedi /gateway/trusted-proxy-auth
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
      // allowExternalEmbedUrls: false, // pericoloso: consente URL embed http(s) esterni assoluti
      // allowedOrigins: ["https://control.example.com"], // obbligatorio per Control UI non-loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // modalità pericolosa di fallback dell'origine tramite header Host
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
    // Facoltativo. Predefinito false.
    allowRealIpFallback: false,
    tools: {
      // Deny HTTP aggiuntivi per /tools/invoke
      deny: ["browser"],
      // Rimuove strumenti dalla denylist HTTP predefinita
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

<Accordion title="Dettagli dei campi del Gateway">

- `mode`: `local` (esegue il gateway) oppure `remote` (si connette a un gateway remoto). Il Gateway rifiuta di avviarsi a meno che non sia `local`.
- `port`: singola porta multiplexata per WS + HTTP. Precedenza: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predefinito), `lan` (`0.0.0.0`), `tailnet` (solo IP Tailscale) oppure `custom`.
- **Alias bind legacy**: usa i valori della modalità bind in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), non alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota Docker**: il bind predefinito `loopback` ascolta su `127.0.0.1` all'interno del container. Con il bridge networking Docker (`-p 18789:18789`), il traffico arriva su `eth0`, quindi il gateway non è raggiungibile. Usa `--network host`, oppure imposta `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) per ascoltare su tutte le interfacce.
- **Auth**: obbligatoria per impostazione predefinita. I bind non-loopback richiedono l'autenticazione del gateway. In pratica ciò significa un token/password condiviso oppure un proxy inverso identity-aware con `gateway.auth.mode: "trusted-proxy"`. Il wizard di onboarding genera un token per impostazione predefinita.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` (inclusi SecretRef), imposta esplicitamente `gateway.auth.mode` su `token` oppure `password`. I flussi di avvio e di installazione/riparazione del servizio falliscono quando entrambi sono configurati e la modalità non è impostata.
- `gateway.auth.mode: "none"`: modalità esplicita senza autenticazione. Usala solo per configurazioni fidate di loopback locale; questa modalità intenzionalmente non viene proposta dai prompt di onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega l'autenticazione a un proxy inverso identity-aware e considera affidabili gli header di identità da `gateway.trustedProxies` (vedi [Autenticazione Trusted Proxy](/it/gateway/trusted-proxy-auth)). Questa modalità si aspetta una sorgente proxy **non-loopback**; i proxy inversi loopback sullo stesso host non soddisfano l'autenticazione trusted-proxy.
- `gateway.auth.allowTailscale`: quando `true`, gli header di identità Tailscale Serve possono soddisfare l'autenticazione di Control UI/WebSocket (verificata tramite `tailscale whois`). Gli endpoint HTTP API **non** usano quell'autenticazione header di Tailscale; seguono invece la normale modalità di autenticazione HTTP del gateway. Questo flusso senza token presuppone che l'host del gateway sia fidato. Il valore predefinito è `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitatore facoltativo dei tentativi di autenticazione falliti. Si applica per IP client e per ambito auth (shared-secret e device-token sono tracciati indipendentemente). I tentativi bloccati restituiscono `429` + `Retry-After`.
  - Sul percorso asincrono Tailscale Serve Control UI, i tentativi falliti per lo stesso `{scope, clientIp}` vengono serializzati prima della scrittura dell'errore. I tentativi errati concorrenti dello stesso client possono quindi attivare il limitatore sulla seconda richiesta invece che attraversarlo entrambi come semplici mismatch.
  - `gateway.auth.rateLimit.exemptLoopback` ha valore predefinito `true`; impostalo su `false` quando vuoi intenzionalmente che anche il traffico localhost sia soggetto a rate limit (per configurazioni di test o deployment proxy rigorosi).
- I tentativi di autenticazione WS con origine browser vengono sempre limitati con l'esenzione loopback disabilitata (difesa in profondità contro brute force localhost basati su browser).
- Su loopback, quei lockout di origine browser sono isolati per valore `Origin`
  normalizzato, così errori ripetuti da un'origine localhost non bloccano automaticamente
  un'origine diversa.
- `tailscale.mode`: `serve` (solo tailnet, bind loopback) oppure `funnel` (pubblico, richiede auth).
- `controlUi.allowedOrigins`: allowlist esplicita delle origini browser per le connessioni Gateway WebSocket. Obbligatoria quando sono previsti client browser da origini non-loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modalità pericolosa che abilita il fallback dell'origine tramite header Host per deployment che si affidano intenzionalmente al criterio di origine basato su header Host.
- `remote.transport`: `ssh` (predefinito) oppure `direct` (ws/wss). Per `direct`, `remote.url` deve essere `ws://` oppure `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override break-glass lato client nel processo-ambiente
  che consente `ws://` in chiaro verso IP fidati di rete privata;
  il valore predefinito resta loopback-only per il traffico in chiaro. Non esiste un equivalente in `openclaw.json`,
  e la configurazione browser di rete privata come
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` non influisce sui client
  Gateway WebSocket.
- `gateway.remote.token` / `.password` sono campi credenziali del client remoto. Non configurano da soli l'autenticazione del gateway.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base per il relay APNs esterno usato dalle build iOS ufficiali/TestFlight dopo che pubblicano registrazioni supportate da relay nel gateway. Questo URL deve corrispondere all'URL relay compilato nella build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout di invio gateway-to-relay in millisecondi. Predefinito `10000`.
- Le registrazioni supportate da relay vengono delegate a una specifica identità gateway. L'app iOS associata recupera `gateway.identity.get`, include quell'identità nella registrazione relay e inoltra al gateway un grant di invio con ambito registrazione. Un altro gateway non può riutilizzare quella registrazione archiviata.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env temporanei per la configurazione relay sopra.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch solo per sviluppo per URL relay HTTP loopback. Gli URL relay di produzione dovrebbero restare su HTTPS.
- `gateway.channelHealthCheckMinutes`: intervallo del monitor di salute del canale in minuti. Imposta `0` per disabilitare globalmente i riavvii del monitor di salute. Predefinito: `5`.
- `gateway.channelStaleEventThresholdMinutes`: soglia di socket stale in minuti. Mantienila maggiore o uguale a `gateway.channelHealthCheckMinutes`. Predefinito: `30`.
- `gateway.channelMaxRestartsPerHour`: numero massimo di riavvii del monitor di salute per canale/account in un'ora mobile. Predefinito: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per canale dai riavvii del monitor di salute mantenendo abilitato il monitor globale.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per account per canali multi-account. Quando impostato, ha la precedenza sull'override a livello canale.
- I percorsi di chiamata del gateway locale possono usare `gateway.remote.*` come fallback solo quando `gateway.auth.*` non è impostato.
- Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non risolto, la risoluzione fallisce in modalità fail-closed (nessun fallback remoto che mascheri il problema).
- `trustedProxies`: IP di proxy inversi che terminano TLS o inseriscono header forwarded-client. Elenca solo proxy che controlli. Le voci loopback sono ancora valide per configurazioni di rilevamento same-host proxy/locale (ad esempio Tailscale Serve o un proxy inverso locale), ma **non** rendono idonee le richieste loopback a `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando `true`, il gateway accetta `X-Real-IP` se `X-Forwarded-For` manca. Il valore predefinito è `false` per comportamento fail-closed.
- `gateway.tools.deny`: nomi di strumenti aggiuntivi bloccati per HTTP `POST /tools/invoke` (estende la denylist predefinita).
- `gateway.tools.allow`: rimuove nomi di strumenti dalla denylist HTTP predefinita.

</Accordion>

### Endpoint compatibili con OpenAI

- Chat Completions: disabilitato per impostazione predefinita. Abilitalo con `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Hardening dell'input URL di Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Le allowlist vuote vengono trattate come non impostate; usa `gateway.http.endpoints.responses.files.allowUrl=false`
    e/o `gateway.http.endpoints.responses.images.allowUrl=false` per disabilitare il recupero URL.
- Header facoltativo di hardening della risposta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (impostalo solo per origini HTTPS che controlli; vedi [Autenticazione Trusted Proxy](/it/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento multi-instance

Esegui più gateway sullo stesso host con porte e directory di stato uniche:

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

- `enabled`: abilita la terminazione TLS al listener del gateway (HTTPS/WSS) (predefinito: `false`).
- `autoGenerate`: genera automaticamente una coppia locale cert/key self-signed quando i file espliciti non sono configurati; solo per uso locale/dev.
- `certPath`: percorso del file system al file certificato TLS.
- `keyPath`: percorso del file system alla chiave privata TLS; mantienilo con permessi limitati.
- `caPath`: percorso facoltativo al bundle CA per la verifica client o catene di trust personalizzate.

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
  - `"off"`: ignora le modifiche live; i cambiamenti richiedono un riavvio esplicito.
  - `"restart"`: riavvia sempre il processo gateway al cambio di configurazione.
  - `"hot"`: applica i cambiamenti in-process senza riavviare.
  - `"hybrid"` (predefinito): prova prima il hot reload; usa il fallback al riavvio se necessario.
- `debounceMs`: finestra di debounce in ms prima che le modifiche di configurazione vengano applicate (intero non negativo).
- `deferralTimeoutMs`: tempo massimo in ms da attendere per operazioni in corso prima di forzare un riavvio (predefinito: `300000` = 5 minuti).

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
        messageTemplate: "Da: {{messages[0].from}}\nOggetto: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Auth: `Authorization: Bearer <token>` oppure `x-openclaw-token: <token>`.
I token degli hook nella query string vengono rifiutati.

Note su validazione e sicurezza:

- `hooks.enabled=true` richiede un `hooks.token` non vuoto.
- `hooks.token` deve essere **distinto** da `gateway.auth.token`; il riutilizzo del token del Gateway viene rifiutato.
- `hooks.path` non può essere `/`; usa un sottopercorso dedicato come `/hooks`.
- Se `hooks.allowRequestSessionKey=true`, limita `hooks.allowedSessionKeyPrefixes` (ad esempio `["hook:"]`).
- Se una mapping o un preset usa un `sessionKey` con template, imposta `hooks.allowedSessionKeyPrefixes` e `hooks.allowRequestSessionKey=true`. Le chiavi statiche delle mapping non richiedono questo opt-in.

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` dal payload della richiesta viene accettato solo quando `hooks.allowRequestSessionKey=true` (predefinito: `false`).
- `POST /hooks/<name>` → risolto tramite `hooks.mappings`
  - I valori `sessionKey` delle mapping renderizzati da template vengono trattati come forniti esternamente e richiedono anch'essi `hooks.allowRequestSessionKey=true`.

<Accordion title="Dettagli delle mapping">

- `match.path` corrisponde al sotto-percorso dopo `/hooks` (ad es. `/hooks/gmail` → `gmail`).
- `match.source` corrisponde a un campo del payload per i percorsi generici.
- I template come `{{messages[0].subject}}` leggono dal payload.
- `transform` può puntare a un modulo JS/TS che restituisce un'azione hook.
  - `transform.module` deve essere un percorso relativo e rimanere all'interno di `hooks.transformsDir` (i percorsi assoluti e l'attraversamento vengono rifiutati).
- `agentId` instrada a un agente specifico; gli ID sconosciuti usano come fallback quello predefinito.
- `allowedAgentIds`: limita l'instradamento esplicito (`*` oppure omesso = consenti tutti, `[]` = nega tutti).
- `defaultSessionKey`: chiave di sessione fissa facoltativa per le esecuzioni dell'agente hook senza `sessionKey` esplicito.
- `allowRequestSessionKey`: consente ai chiamanti di `/hooks/agent` e alle chiavi di sessione delle mapping guidate da template di impostare `sessionKey` (predefinito: `false`).
- `allowedSessionKeyPrefixes`: allowlist facoltativa di prefissi per valori `sessionKey` espliciti (richiesta + mapping), ad es. `["hook:"]`. Diventa obbligatoria quando una qualsiasi mapping o preset usa un `sessionKey` con template.
- `deliver: true` invia la risposta finale a un canale; `channel` ha come predefinito `last`.
- `model` sovrascrive l'LLM per questa esecuzione hook (deve essere consentito se il catalogo modelli è impostato).

</Accordion>

### Integrazione Gmail

- Il preset Gmail integrato usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Se mantieni questo instradamento per messaggio, imposta `hooks.allowRequestSessionKey: true` e limita `hooks.allowedSessionKeyPrefixes` in modo che corrisponda allo spazio dei nomi Gmail, ad esempio `["hook:", "hook:gmail:"]`.
- Se ti serve `hooks.allowRequestSessionKey: false`, sovrascrivi il preset con un `sessionKey` statico invece del valore predefinito con template.

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

- Il Gateway avvia automaticamente `gog gmail watch serve` all'avvio quando configurato. Imposta `OPENCLAW_SKIP_GMAIL_WATCHER=1` per disabilitarlo.
- Non eseguire un `gog gmail watch serve` separato insieme al Gateway.

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // oppure OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Serve HTML/CSS/JS modificabili dall'agente e A2UI tramite HTTP sotto la porta del Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Solo locale: mantieni `gateway.bind: "loopback"` (predefinito).
- Bind non-loopback: i percorsi canvas richiedono l'auth del Gateway (token/password/trusted-proxy), come le altre superfici HTTP del Gateway.
- Le WebView dei Node in genere non inviano header auth; dopo che un Node è associato e connesso, il Gateway pubblicizza URL di capacità con ambito Node per l'accesso a canvas/A2UI.
- Gli URL di capacità sono legati alla sessione WS attiva del Node e scadono rapidamente. Non viene usato fallback basato su IP.
- Inserisce il client live-reload nell'HTML servito.
- Crea automaticamente un `index.html` iniziale quando è vuoto.
- Serve anche A2UI in `/__openclaw__/a2ui/`.
- Le modifiche richiedono un riavvio del gateway.
- Disabilita il live reload per directory grandi o errori `EMFILE`.

---

## Discovery

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

- `minimal` (predefinito): omette `cliPath` + `sshPort` dai record TXT.
- `full`: include `cliPath` + `sshPort`.
- Il nome host ha come predefinito `openclaw`. Sovrascrivilo con `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Scrive una zona DNS-SD unicast sotto `~/.openclaw/dns/`. Per discovery cross-network, abbinala a un server DNS (consigliato CoreDNS) + split DNS Tailscale.

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
- `shellEnv`: importa dal profilo della tua shell di login le chiavi attese mancanti.
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

- Vengono riconosciuti solo nomi maiuscoli: `[A-Z_][A-Z0-9_]*`.
- Variabili mancanti/vuote generano un errore al caricamento della configurazione.
- Effettua l'escape con `$${VAR}` per ottenere un letterale `${VAR}`.
- Funziona con `$include`.

---

## Secret

I riferimenti ai secret sono additivi: i valori plaintext continuano a funzionare.

### `SecretRef`

Usa un'unica forma oggetto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validazione:

- pattern `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- pattern `id` per `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `id` per `source: "file"`: JSON pointer assoluto (ad esempio `"/providers/openai/apiKey"`)
- pattern `id` per `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- gli `id` di `source: "exec"` non devono contenere segmenti di percorso slash-delimited `.` o `..` (ad esempio `a/../b` viene rifiutato)

### Superficie delle credenziali supportata

- Matrice canonica: [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface)
- `secrets apply` punta ai percorsi di credenziali supportati di `openclaw.json`.
- I ref di `auth-profiles.json` sono inclusi nella risoluzione a runtime e nella copertura audit.

### Configurazione dei provider secret

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // provider env esplicito facoltativo
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
- I percorsi dei provider file ed exec falliscono in modalità fail-closed quando la verifica ACL di Windows non è disponibile. Imposta `allowInsecurePath: true` solo per percorsi fidati che non possono essere verificati.
- Il provider `exec` richiede un `command` con percorso assoluto e usa payload di protocollo su stdin/stdout.
- Per impostazione predefinita, i percorsi di comando symlink vengono rifiutati. Imposta `allowSymlinkCommand: true` per consentire percorsi symlink convalidando al tempo stesso il percorso del target risolto.
- Se `trustedDirs` è configurato, il controllo della directory fidata si applica al percorso del target risolto.
- L'ambiente figlio di `exec` è minimo per impostazione predefinita; passa esplicitamente le variabili richieste con `passEnv`.
- I riferimenti ai secret vengono risolti al momento dell'attivazione in uno snapshot in memoria, poi i percorsi di richiesta leggono solo lo snapshot.
- Il filtraggio della superficie attiva si applica durante l'attivazione: i ref irrisolti sulle superfici abilitate causano il fallimento di avvio/reload, mentre le superfici inattive vengono saltate con diagnostica.

---

## Archiviazione auth

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
- `auth-profiles.json` supporta riferimenti a livello di valore (`keyRef` per `api_key`, `tokenRef` per `token`) per modalità di credenziali statiche.
- I profili in modalità OAuth (`auth.profiles.<id>.mode = "oauth"`) non supportano credenziali dei profili auth supportate da SecretRef.
- Le credenziali statiche a runtime provengono da snapshot risolti in memoria; le voci statiche legacy di `auth.json` vengono ripulite quando trovate.
- Le importazioni OAuth legacy provengono da `~/.openclaw/credentials/oauth.json`.
- Vedi [OAuth](/it/concepts/oauth).
- Comportamento runtime dei secret e tooling `audit/configure/apply`: [Gestione dei secret](/it/gateway/secrets).

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

- `billingBackoffHours`: backoff di base in ore quando un profilo fallisce per veri
  errori di fatturazione/credito insufficiente (predefinito: `5`). Testo esplicito di fatturazione può
  comunque finire qui anche su risposte `401`/`403`, ma i matcher testuali
  specifici del provider restano limitati al provider che li possiede (ad esempio OpenRouter
  `Key limit exceeded`). I messaggi ritentabili HTTP `402` di finestra d'uso o
  limite di spesa di organizzazione/workspace restano invece nel percorso `rate_limit`.
- `billingBackoffHoursByProvider`: override facoltativi per provider per le ore di backoff della fatturazione.
- `billingMaxHours`: limite in ore per la crescita esponenziale del backoff di fatturazione (predefinito: `24`).
- `authPermanentBackoffMinutes`: backoff di base in minuti per guasti `auth_permanent` ad alta confidenza (predefinito: `10`).
- `authPermanentMaxMinutes`: limite in minuti per la crescita del backoff `auth_permanent` (predefinito: `60`).
- `failureWindowHours`: finestra mobile in ore usata per i contatori di backoff (predefinito: `24`).
- `overloadedProfileRotations`: numero massimo di rotazioni dello stesso profilo auth-provider per errori di overload prima di passare al fallback del modello (predefinito: `1`). Le forme di provider occupato come `ModelNotReadyException` finiscono qui.
- `overloadedBackoffMs`: ritardo fisso prima di ritentare una rotazione di provider/profilo in overload (predefinito: `0`).
- `rateLimitedProfileRotations`: numero massimo di rotazioni dello stesso profilo auth-provider per errori di limite di frequenza prima di passare al fallback del modello (predefinito: `1`). Quel bucket di limite di frequenza include testo modellato dal provider come `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` e `resource exhausted`.

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
- `consoleLevel` passa a `debug` quando usi `--verbose`.
- `maxFileBytes`: dimensione massima del file di log in byte prima che le scritture vengano soppresse (intero positivo; predefinito: `524288000` = 500 MB). Usa rotazione log esterna per deployment di produzione.

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
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
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

- `enabled`: switch principale per l'output di strumentazione (predefinito: `true`).
- `flags`: array di stringhe flag che abilita output di log mirato (supporta wildcard come `"telegram.*"` oppure `"*"`).
- `stuckSessionWarnMs`: soglia di età in ms per emettere avvisi di sessione bloccata mentre una sessione resta nello stato di elaborazione.
- `otel.enabled`: abilita la pipeline di esportazione OpenTelemetry (predefinito: `false`).
- `otel.endpoint`: URL del collector per l'esportazione OTel.
- `otel.protocol`: `"http/protobuf"` (predefinito) oppure `"grpc"`.
- `otel.headers`: header di metadati HTTP/gRPC aggiuntivi inviati con le richieste di esportazione OTel.
- `otel.serviceName`: nome del servizio per gli attributi della risorsa.
- `otel.traces` / `otel.metrics` / `otel.logs`: abilitano l'esportazione di trace, metriche o log.
- `otel.sampleRate`: tasso di campionamento delle trace `0`–`1`.
- `otel.flushIntervalMs`: intervallo periodico di flush della telemetria in ms.
- `cacheTrace.enabled`: registra snapshot di cache trace per esecuzioni embedded (predefinito: `false`).
- `cacheTrace.filePath`: percorso di output per JSONL della cache trace (predefinito: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controllano cosa è incluso nell'output della cache trace (tutti predefiniti: `true`).

---

## Update

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

- `channel`: canale di release per installazioni npm/git — `"stable"`, `"beta"` oppure `"dev"`.
- `checkOnStart`: controlla gli aggiornamenti npm all'avvio del gateway (predefinito: `true`).
- `auto.enabled`: abilita l'auto-update in background per le installazioni di pacchetti (predefinito: `false`).
- `auto.stableDelayHours`: ritardo minimo in ore prima dell'applicazione automatica del canale stable (predefinito: `6`; max: `168`).
- `auto.stableJitterHours`: finestra aggiuntiva in ore per distribuire il rollout del canale stable (predefinito: `12`; max: `168`).
- `auto.betaCheckIntervalHours`: frequenza dei controlli del canale beta in ore (predefinito: `1`; max: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
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

- `enabled`: gate globale della funzionalità ACP (predefinito: `false`).
- `dispatch.enabled`: gate indipendente per il dispatch dei turni di sessione ACP (predefinito: `true`). Imposta `false` per mantenere disponibili i comandi ACP bloccando però l'esecuzione.
- `backend`: id del backend runtime ACP predefinito (deve corrispondere a un plugin runtime ACP registrato).
- `defaultAgent`: id dell'agente ACP di fallback quando gli spawn non specificano una destinazione esplicita.
- `allowedAgents`: allowlist di ID agente consentiti per le sessioni runtime ACP; vuoto significa nessuna restrizione aggiuntiva.
- `maxConcurrentSessions`: numero massimo di sessioni ACP attive contemporaneamente.
- `stream.coalesceIdleMs`: finestra di flush inattivo in ms per il testo trasmesso.
- `stream.maxChunkChars`: dimensione massima del chunk prima della divisione della proiezione del blocco trasmesso.
- `stream.repeatSuppression`: sopprime righe di stato/strumento ripetute per turno (predefinito: `true`).
- `stream.deliveryMode`: `"live"` trasmette incrementalmente; `"final_only"` bufferizza fino agli eventi terminali del turno.
- `stream.hiddenBoundarySeparator`: separatore prima del testo visibile dopo eventi di strumenti nascosti (predefinito: `"paragraph"`).
- `stream.maxOutputChars`: numero massimo di caratteri dell'output dell'assistente proiettati per turno ACP.
- `stream.maxSessionUpdateChars`: numero massimo di caratteri per le righe di stato/aggiornamento ACP proiettate.
- `stream.tagVisibility`: record da nomi tag a override booleani di visibilità per eventi trasmessi.
- `runtime.ttlMinutes`: TTL inattivo in minuti per i worker di sessione ACP prima che siano idonei alla pulizia.
- `runtime.installCommand`: comando di installazione facoltativo da eseguire quando si avvia un ambiente runtime ACP.

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

- `cli.banner.taglineMode` controlla lo stile del tagline del banner:
  - `"random"` (predefinito): tagline rotanti divertenti/stagionali.
  - `"default"`: tagline neutro fisso (`All your chats, one OpenClaw.`).
  - `"off"`: nessun testo tagline (titolo/versione del banner ancora mostrati).
- Per nascondere l'intero banner (non solo i tagline), imposta l'env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

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

## Identity

Vedi i campi di identità di `agents.list` in [Valori predefiniti dell'agente](/it/gateway/config-agents#agent-defaults).

---

## Bridge (legacy, rimosso)

Le build attuali non includono più il bridge TCP. I Node si connettono tramite il Gateway WebSocket. Le chiavi `bridge.*` non fanno più parte dello schema di configurazione (la validazione fallisce finché non vengono rimosse; `openclaw doctor --fix` può eliminare le chiavi sconosciute).

<Accordion title="Configurazione legacy del bridge (riferimento storico)">

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
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // fallback deprecato per job memorizzati notify:true
    webhookToken: "replace-with-dedicated-token", // token bearer facoltativo per auth webhook in uscita
    sessionRetention: "24h", // stringa durata oppure false
    runLog: {
      maxBytes: "2mb", // predefinito 2_000_000 byte
      keepLines: 2000, // predefinito 2000
    },
  },
}
```

- `sessionRetention`: per quanto tempo mantenere le sessioni completate delle esecuzioni Cron isolate prima della potatura da `sessions.json`. Controlla anche la pulizia delle trascrizioni Cron eliminate archiviate. Predefinito: `24h`; imposta `false` per disabilitare.
- `runLog.maxBytes`: dimensione massima per file di log di esecuzione (`cron/runs/<jobId>.jsonl`) prima della potatura. Predefinito: `2_000_000` byte.
- `runLog.keepLines`: righe più recenti conservate quando viene attivata la potatura del log di esecuzione. Predefinito: `2000`.
- `webhookToken`: token bearer usato per la consegna POST webhook di Cron (`delivery.mode = "webhook"`), se omesso non viene inviato alcun header auth.
- `webhook`: URL webhook di fallback legacy deprecato (http/https) usato solo per i job memorizzati che hanno ancora `notify: true`.

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

- `maxAttempts`: numero massimo di retry per i job one-shot in caso di errori transitori (predefinito: `3`; intervallo: `0`–`10`).
- `backoffMs`: array di ritardi di backoff in ms per ogni tentativo di retry (predefinito: `[30000, 60000, 300000]`; 1–10 voci).
- `retryOn`: tipi di errore che attivano i retry — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Ometti per ritentare tutti i tipi transitori.

Si applica solo ai job Cron one-shot. I job ricorrenti usano una gestione separata dei guasti.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: abilita gli avvisi di errore per i job Cron (predefinito: `false`).
- `after`: numero di errori consecutivi prima che venga emesso un avviso (intero positivo, min: `1`).
- `cooldownMs`: millisecondi minimi tra avvisi ripetuti per lo stesso job (intero non negativo).
- `mode`: modalità di consegna — `"announce"` invia tramite un messaggio di canale; `"webhook"` pubblica sul webhook configurato.
- `accountId`: ID facoltativo di account o canale per limitare la consegna dell'avviso.

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

- Destinazione predefinita per le notifiche di errore Cron per tutti i job.
- `mode`: `"announce"` oppure `"webhook"`; il valore predefinito è `"announce"` quando esistono dati di destinazione sufficienti.
- `channel`: override del canale per la consegna announce. `"last"` riusa l'ultimo canale di consegna noto.
- `to`: destinazione announce esplicita oppure URL webhook. Obbligatorio per la modalità webhook.
- `accountId`: override facoltativo dell'account per la consegna.
- `delivery.failureDestination` per job sovrascrive questo valore predefinito globale.
- Quando non è impostata né una destinazione di errore globale né una per job, i job che già consegnano tramite `announce` usano come fallback quella destinazione announce primaria in caso di errore.
- `delivery.failureDestination` è supportato solo per job `sessionTarget="isolated"` a meno che `delivery.mode` primario del job non sia `"webhook"`.

Vedi [Job Cron](/it/automation/cron-jobs). Le esecuzioni Cron isolate sono tracciate come [attività in background](/it/automation/tasks).

---

## Variabili template del modello media

Segnaposto template espansi in `tools.media.models[].args`:

| Variabile          | Descrizione                                      |
| ------------------ | ------------------------------------------------ |
| `{{Body}}`         | Corpo completo del messaggio in ingresso         |
| `{{RawBody}}`      | Corpo grezzo (senza wrapper cronologia/mittente) |
| `{{BodyStripped}}` | Corpo con le menzioni di gruppo rimosse          |
| `{{From}}`         | Identificatore del mittente                      |
| `{{To}}`           | Identificatore della destinazione                |
| `{{MessageSid}}`   | ID del messaggio del canale                      |
| `{{SessionId}}`    | UUID della sessione corrente                     |
| `{{IsNewSession}}` | `"true"` quando viene creata una nuova sessione  |
| `{{MediaUrl}}`     | Pseudo-URL del media in ingresso                 |
| `{{MediaPath}}`    | Percorso locale del media                        |
| `{{MediaType}}`    | Tipo di media (image/audio/document/…)           |
| `{{Transcript}}`   | Trascrizione audio                               |
| `{{Prompt}}`       | Prompt media risolto per le voci CLI             |
| `{{MaxChars}}`     | Numero massimo di caratteri in output risolto per le voci CLI |
| `{{ChatType}}`     | `"direct"` oppure `"group"`                      |
| `{{GroupSubject}}` | Oggetto del gruppo (best effort)                 |
| `{{GroupMembers}}` | Anteprima dei membri del gruppo (best effort)    |
| `{{SenderName}}`   | Nome visualizzato del mittente (best effort)     |
| `{{SenderE164}}`   | Numero di telefono del mittente (best effort)    |
| `{{Provider}}`     | Hint del provider (whatsapp, telegram, discord, ecc.) |

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

**Comportamento del merge:**

- File singolo: sostituisce l'oggetto contenitore.
- Array di file: deep-merge in ordine (i successivi sovrascrivono i precedenti).
- Chiavi sibling: unite dopo gli include (sovrascrivono i valori inclusi).
- Include annidati: fino a 10 livelli di profondità.
- Percorsi: risolti relativamente al file che include, ma devono restare all'interno della directory di configurazione di primo livello (`dirname` di `openclaw.json`). Le forme assolute/`../` sono consentite solo se si risolvono comunque all'interno di quel perimetro.
- Le scritture possedute da OpenClaw che modificano solo una sezione di primo livello supportata da un include a file singolo vengono propagate a quel file incluso. Ad esempio, `plugins install` aggiorna `plugins: { $include: "./plugins.json5" }` in `plugins.json5` e lascia intatto `openclaw.json`.
- Gli include radice, gli array di include e gli include con override sibling sono in sola lettura per le scritture possedute da OpenClaw; quelle scritture falliscono in modalità fail-closed invece di appiattire la configurazione.
- Errori: messaggi chiari per file mancanti, errori di parsing e include circolari.

---

_Correlati: [Configurazione](/it/gateway/configuration) · [Esempi di configurazione](/it/gateway/configuration-examples) · [Doctor](/it/gateway/doctor)_

## Correlati

- [Configurazione](/it/gateway/configuration)
- [Esempi di configurazione](/it/gateway/configuration-examples)
