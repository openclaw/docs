---
read_when:
    - Je hebt exacte configuratiesemantiek of standaardwaarden op veldniveau nodig
    - Je valideert kanaal-, model-, Gateway- of toolconfiguratieblokken
summary: Gateway-configuratiereferentie voor kernsleutels van OpenClaw, standaardwaarden en links naar specifieke subsystemreferenties
title: Configuratiereferentie
x-i18n:
    generated_at: "2026-05-11T20:30:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71a9b9ba64b334086a3e32fd9255eb45f9089818a1798a4d542d39d586d53fd9
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Core-configreferentie voor `~/.openclaw/openclaw.json`. Zie [Configuratie](/nl/gateway/configuration) voor een taakgericht overzicht.

Behandelt de belangrijkste OpenClaw-configuratieoppervlakken en linkt door wanneer een subsysteem een eigen uitgebreidere referentie heeft. Kanaal- en Plugin-beheerde commandocatalogi en diepe memory/QMD-knoppen staan op hun eigen pagina's in plaats van op deze.

Codewaarheid:

- `openclaw config schema` drukt de live JSON Schema af die wordt gebruikt voor validatie en Control UI, met gebundelde/Plugin-/kanaalmetadata samengevoegd wanneer beschikbaar
- `config.schema.lookup` retourneert een padgescopeerde schemaknoop voor drill-down-tooling
- `pnpm config:docs:check` / `pnpm config:docs:gen` valideren de baseline-hash van de config-docs tegen het huidige schemaoppervlak

Agent-opzoekpad: gebruik de `gateway`-toolactie `config.schema.lookup` voor
exacte documentatie en beperkingen op veldniveau vóór bewerkingen. Gebruik
[Configuratie](/nl/gateway/configuration) voor taakgerichte begeleiding en deze pagina
voor de bredere veldkaart, standaardwaarden en links naar subsysteemreferenties.

Toegewijde diepe referenties:

- [Memory-configuratiereferentie](/nl/reference/memory-config) voor `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, en dreaming-configuratie onder `plugins.entries.memory-core.config.dreaming`
- [Slash-commando's](/nl/tools/slash-commands) voor de huidige ingebouwde + gebundelde commandocatalogus
- beherende kanaal-/Plugin-pagina's voor kanaalspecifieke commando-oppervlakken

Config-indeling is **JSON5** (commentaar + afsluitende komma's toegestaan). Alle velden zijn optioneel - OpenClaw gebruikt veilige standaardwaarden wanneer ze worden weggelaten.

---

## Kanalen

Per-kanaal-configuratiesleutels zijn verplaatst naar een toegewijde pagina - zie
[Configuratie - kanalen](/nl/gateway/config-channels) voor `channels.*`,
inclusief Slack, Discord, Telegram, WhatsApp, Matrix, iMessage en andere
gebundelde kanalen (authenticatie, toegangscontrole, meerdere accounts, mention gating).

## Agent-standaardwaarden, multi-agent, sessies en berichten

Verplaatst naar een toegewijde pagina - zie
[Configuratie - agents](/nl/gateway/config-agents) voor:

- `agents.defaults.*` (werkruimte, model, denken, Heartbeat, memory, media, Skills, sandbox)
- `multiAgent.*` (multi-agent-routering en bindingen)
- `session.*` (sessielevenscyclus, Compaction, pruning)
- `messages.*` (berichtbezorging, TTS, markdown-rendering)
- `talk.*` (Talk-modus)
  - `talk.consultThinkingLevel`: overschrijving van denkniveau voor de volledige OpenClaw-agent-run achter realtime consulten van Control UI Talk
  - `talk.consultFastMode`: eenmalige fast-mode-overschrijving voor realtime consulten van Control UI Talk
  - `talk.speechLocale`: optionele BCP 47-locale-id voor Talk-spraakherkenning op iOS/macOS
  - `talk.silenceTimeoutMs`: wanneer niet ingesteld, behoudt Talk het standaard pauzevenster van het platform voordat het transcript wordt verzonden (`700 ms on macOS and Android, 900 ms on iOS`)

## Tools en aangepaste providers

Toolbeleid, experimentele schakelaars, provider-backed toolconfiguratie en aangepaste
provider- / base-URL-instelling zijn verplaatst naar een toegewijde pagina - zie
[Configuratie - tools en aangepaste providers](/nl/gateway/config-tools).

## Modellen

Providerdefinities, model-allowlists en aangepaste providerinstellingen staan in
[Configuratie - tools en aangepaste providers](/nl/gateway/config-tools#custom-providers-and-base-urls).
De `models`-root beheert ook globaal modelcatalogusgedrag.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: providercatalogusgedrag (`merge` of `replace`).
- `models.providers`: aangepaste provider-map gesleuteld op provider-id.
- `models.providers.*.localService`: optionele procesmanager op aanvraag voor
  lokale modelservers. OpenClaw test het geconfigureerde health-endpoint, start
  de absolute `command` wanneer nodig, wacht op gereedheid en verzendt daarna de modelaanvraag.
  Zie [Lokale modelservices](/nl/gateway/local-model-services).
- `models.pricing.enabled`: beheert de pricing-bootstrap op de achtergrond die
  start nadat sidecars en kanalen het Gateway-ready-pad bereiken. Wanneer `false`,
  slaat de Gateway OpenRouter- en LiteLLM-pricing-catalogusfetches over; geconfigureerde
  `models.providers.*.models[].cost`-waarden blijven werken voor lokale kostenschattingen.

## MCP

Door OpenClaw beheerde MCP-serverdefinities staan onder `mcp.servers` en worden
gebruikt door ingebedde Pi en andere runtime-adapters. De commando's `openclaw mcp list`,
`show`, `set` en `unset` beheren dit blok zonder verbinding te maken met de
doelserver tijdens configuratiebewerkingen.

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

- `mcp.servers`: benoemde stdio- of externe MCP-serverdefinities voor runtimes die
  geconfigureerde MCP-tools beschikbaar maken.
  Externe items gebruiken `transport: "streamable-http"` of `transport: "sse"`;
  `type: "http"` is een CLI-native alias die `openclaw mcp set` en
  `openclaw doctor --fix` normaliseren naar het canonieke `transport`-veld.
- `mcp.sessionIdleTtlMs`: idle-TTL voor sessiegescopeerde gebundelde MCP-runtimes.
  Eenmalige ingebedde runs vragen opruiming aan run-einde aan; deze TTL is de terugval
  voor langlevende sessies en toekomstige callers.
- Wijzigingen onder `mcp.*` worden hot-applied door gecachte sessie-MCP-runtimes te verwijderen.
  De volgende tool discovery/use maakt ze opnieuw aan vanuit de nieuwe configuratie, zodat verwijderde
  `mcp.servers`-items direct worden opgeruimd in plaats van te wachten op de idle-TTL.

Zie [MCP](/nl/cli/mcp#openclaw-as-an-mcp-client-registry) en
[CLI-backends](/nl/gateway/cli-backends#bundle-mcp-overlays) voor runtimegedrag.

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

- `allowBundled`: optionele allowlist alleen voor gebundelde Skills (beheerde/werkruimte-Skills blijven onaangetast).
- `load.extraDirs`: extra gedeelde Skill-roots (laagste prioriteit).
- `load.allowSymlinkTargets`: vertrouwde echte doelroots waarnaar Skill-symlinks mogen
  verwijzen wanneer de link buiten de geconfigureerde bronroot staat.
- `install.preferBrew`: wanneer true, geef voorkeur aan Homebrew-installers wanneer `brew`
  beschikbaar is voordat wordt teruggevallen op andere installertypen.
- `install.nodeManager`: voorkeur voor Node-installer voor `metadata.openclaw.install`
  specs (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: sta vertrouwde `operator.admin` Gateway
  clients toe om privé-ziparchieven te installeren die via `skills.upload.*`
  zijn klaargezet (standaard: false). Dit schakelt alleen het uploaded-archive-pad in; normale ClawHub
  installs vereisen dit niet.
- `entries.<skillKey>.enabled: false` schakelt een Skill uit, zelfs als deze gebundeld/geïnstalleerd is.
- `entries.<skillKey>.apiKey`: gemak voor Skills die een primaire env-var declareren (plaintext string of SecretRef-object).

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

- Geladen vanuit `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, plus `plugins.load.paths`.
- Discovery accepteert native OpenClaw Plugins plus compatibele Codex-bundels en Claude-bundels, inclusief manifestloze Claude-default-layout-bundels.
- **Configwijzigingen vereisen een herstart van de Gateway.**
- `allow`: optionele allowlist (alleen vermelde Plugins laden). `deny` wint.
- `bundledDiscovery`: standaard `"allowlist"` voor nieuwe configuraties, zodat een niet-lege
  `plugins.allow` ook gebundelde provider-Plugins gate, inclusief web-search
  runtimeproviders. Doctor schrijft `"compat"` voor gemigreerde legacy allowlist-
  configuraties om bestaand gebundeld providergedrag te behouden totdat je je aanmeldt.
- `plugins.entries.<id>.apiKey`: gemakveld voor API-key op Plugin-niveau (wanneer ondersteund door de Plugin).
- `plugins.entries.<id>.env`: Plugin-gescopeerde env-var-map.
- `plugins.entries.<id>.hooks.allowPromptInjection`: wanneer `false`, blokkeert core `before_prompt_build` en negeert prompt-mutating velden van legacy `before_agent_start`, terwijl legacy `modelOverride` en `providerOverride` behouden blijven. Van toepassing op native Plugin-hooks en ondersteunde door bundels geleverde hookdirectories.
- `plugins.entries.<id>.hooks.allowConversationAccess`: wanneer `true`, mogen vertrouwde niet-gebundelde Plugins ruwe gespreksinhoud lezen vanuit getypeerde hooks zoals `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` en `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: vertrouw deze Plugin expliciet om per-run `provider`- en `model`-overschrijvingen aan te vragen voor achtergrond-subagent-runs.
- `plugins.entries.<id>.subagent.allowedModels`: optionele allowlist van canonieke `provider/model`-doelen voor vertrouwde subagent-overschrijvingen. Gebruik `"*"` alleen wanneer je bewust elk model wilt toestaan.
- `plugins.entries.<id>.llm.allowModelOverride`: vertrouw deze Plugin expliciet om modeloverschrijvingen aan te vragen voor `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: optionele allowlist van canonieke `provider/model`-doelen voor vertrouwde Plugin-LLM-voltooiingsoverschrijvingen. Gebruik `"*"` alleen wanneer je bewust elk model wilt toestaan.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: vertrouw deze Plugin expliciet om `api.runtime.llm.complete` uit te voeren tegen een niet-standaard agent-id.
- `plugins.entries.<id>.config`: door de Plugin gedefinieerd configobject (gevalideerd door native OpenClaw Plugin-schema wanneer beschikbaar).
- Account-/runtime-instellingen voor kanaal-Plugins staan onder `channels.<id>` en moeten worden beschreven door de `channelConfigs`-metadata van het manifest van de beherende Plugin, niet door een centraal OpenClaw-optieregister.

### Codex-harness-Plugin-configuratie

De gebundelde `codex`-Plugin beheert native Codex-app-server-harnessinstellingen onder
`plugins.entries.codex.config`. Zie
[Codex-harnessreferentie](/nl/plugins/codex-harness-reference) voor het volledige config-
oppervlak en [Codex-harness](/nl/plugins/codex-harness) voor het runtimemodel.

`codexPlugins` is alleen van toepassing op sessies die de native Codex-harness selecteren.
Het schakelt Codex-Plugins niet in voor Pi, normale OpenAI-provider-runs, ACP
conversation bindings of enige niet-Codex-harness.

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

- `plugins.entries.codex.config.codexPlugins.enabled`: schakelt native Codex
  plugin/app-ondersteuning in voor de Codex-harness. Standaard: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  standaardbeleid voor destructieve acties voor gemigreerde Plugin-app-elicitations.
  Standaard: `false`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: schakelt een
  gemigreerde Plugin-vermelding in wanneer globale `codexPlugins.enabled` ook true is.
  Standaard: `true` voor expliciete vermeldingen.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  stabiele marketplace-identiteit. V1 ondersteunt alleen `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: stabiele
  Codex Plugin-identiteit uit migratie, bijvoorbeeld `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  override per Plugin voor destructieve acties. Wanneer weggelaten, wordt de globale
  waarde `allow_destructive_actions` gebruikt.

`codexPlugins.enabled` is de globale inschakelrichtlijn. Expliciete Plugin-
vermeldingen die door migratie zijn geschreven, vormen de duurzame set voor installatie- en herstelgeschiktheid.
`plugins["*"]` wordt niet ondersteund, er is geen `install`-schakelaar, en lokale
`marketplacePath`-waarden zijn bewust geen configuratievelden omdat ze
hostspecifiek zijn.

Gereedheidscontroles voor `app/list` worden een uur gecachet en asynchroon
ververst wanneer ze verouderd zijn. Codex-thread-appconfiguratie wordt berekend bij het tot stand brengen van een Codex-harness-
sessie, niet bij elke beurt; gebruik `/new`, `/reset` of een gateway-
herstart na het wijzigen van native Plugin-configuratie.

- `plugins.entries.firecrawl.config.webFetch`: instellingen voor de Firecrawl web-fetch-provider.
  - `apiKey`: Firecrawl API-sleutel (accepteert SecretRef). Valt terug op `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey` of de env-var `FIRECRAWL_API_KEY`.
  - `baseUrl`: basis-URL van de Firecrawl API (standaard: `https://api.firecrawl.dev`; self-hosted overrides moeten naar private/interne endpoints verwijzen).
  - `onlyMainContent`: extraheer alleen de hoofdinhoud van pagina's (standaard: `true`).
  - `maxAgeMs`: maximale cacheleeftijd in milliseconden (standaard: `172800000` / 2 dagen).
  - `timeoutSeconds`: timeout voor scrape-aanvragen in seconden (standaard: `60`).
- `plugins.entries.xai.config.xSearch`: instellingen voor xAI X Search (Grok-webzoekopdracht).
  - `enabled`: schakel de X Search-provider in.
  - `model`: Grok-model om te gebruiken voor zoeken (bijv. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: instellingen voor memory dreaming. Zie [Dreaming](/nl/concepts/dreaming) voor fasen en drempels.
  - `enabled`: hoofdschakelaar voor dreaming (standaard `false`).
  - `frequency`: cron-cadans voor elke volledige dreaming-sweep (standaard `"0 3 * * *"`).
  - `model`: optionele model-override voor de Dream Diary-subagent. Vereist `plugins.entries.memory-core.subagent.allowModelOverride: true`; combineer met `allowedModels` om doelen te beperken. Fouten wegens niet-beschikbare modellen proberen het eenmaal opnieuw met het standaardsessiemodel; vertrouwens- of allowlist-fouten vallen niet stilzwijgend terug.
  - fasebeleid en drempels zijn implementatiedetails (geen gebruikersgerichte configuratiesleutels).
- Volledige geheugenconfiguratie staat in [Referentie voor geheugenconfiguratie](/nl/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Ingeschakelde Claude-bundelplugins kunnen ook ingebedde Pi-standaarden uit `settings.json` bijdragen; OpenClaw past die toe als opgeschoonde agentinstellingen, niet als ruwe OpenClaw-configuratiepatches.
- `plugins.slots.memory`: kies de actieve geheugenplugin-id, of `"none"` om geheugenplugins uit te schakelen.
- `plugins.slots.contextEngine`: kies de actieve context-engine-plugin-id; standaard `"legacy"` tenzij je een andere engine installeert en selecteert.

Zie [Plugins](/nl/tools/plugin).

---

## Toezeggingen

`commitments` beheert afgeleid opvolggeheugen: OpenClaw kan check-ins uit gespreksbeurten detecteren en ze leveren via Heartbeat-runs.

- `commitments.enabled`: schakel verborgen LLM-extractie, opslag en Heartbeat-levering in voor afgeleide opvolgtoezeggingen. Standaard: `false`.
- `commitments.maxPerDay`: maximaal aantal afgeleide opvolgtoezeggingen dat per agentsessie in een voortschrijdende dag wordt geleverd. Standaard: `3`.

Zie [Afgeleide toezeggingen](/nl/concepts/commitments).

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

- `evaluateEnabled: false` schakelt `act:evaluate` en `wait --fn` uit.
- `tabCleanup` ruimt gevolgde tabbladen van de primaire agent op na inactiviteit of wanneer een
  sessie de limiet overschrijdt. Stel `idleMinutes: 0` of `maxTabsPerSession: 0` in om
  die afzonderlijke opruimmodi uit te schakelen.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` is uitgeschakeld wanneer niet ingesteld, zodat browsernavigatie standaard strikt blijft.
- Stel `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` alleen in wanneer je browsernavigatie op een privénetwerk bewust vertrouwt.
- In strikte modus gelden voor remote CDP-profielendpoints (`profiles.*.cdpUrl`) dezelfde blokkades voor privénetwerken tijdens bereikbaarheids- en detectiecontroles.
- `ssrfPolicy.allowPrivateNetwork` blijft ondersteund als legacy alias.
- Gebruik in strikte modus `ssrfPolicy.hostnameAllowlist` en `ssrfPolicy.allowedHostnames` voor expliciete uitzonderingen.
- Remote profielen zijn alleen attach-only (starten/stoppen/resetten uitgeschakeld).
- `profiles.*.cdpUrl` accepteert `http://`, `https://`, `ws://` en `wss://`.
  Gebruik HTTP(S) wanneer je wilt dat OpenClaw `/json/version` detecteert; gebruik WS(S)
  wanneer je provider je een directe DevTools WebSocket-URL geeft.
- `remoteCdpTimeoutMs` en `remoteCdpHandshakeTimeoutMs` gelden voor remote en
  `attachOnly` CDP-bereikbaarheid plus aanvragen voor het openen van tabbladen. Beheerde local loopback-
  profielen behouden lokale CDP-standaarden.
- Als een extern beheerde CDP-service bereikbaar is via loopback, stel dan
  `attachOnly: true` voor dat profiel in; anders behandelt OpenClaw de loopback-poort als een
  lokaal beheerd browserprofiel en kan het fouten over eigenaarschap van lokale poorten melden.
- `existing-session`-profielen gebruiken Chrome MCP in plaats van CDP en kunnen koppelen op
  de geselecteerde host of via een verbonden browsernode.
- `existing-session`-profielen kunnen `userDataDir` instellen om een specifiek
  Chromium-gebaseerd browserprofiel te targeten, zoals Brave of Edge.
- `existing-session`-profielen behouden de huidige routelimieten van Chrome MCP:
  snapshot/ref-gestuurde acties in plaats van CSS-selector-targeting, one-file upload-
  hooks, geen overrides voor dialoogtimeouts, geen `wait --load networkidle` en geen
  `responsebody`, PDF-export, downloadinterceptie of batchacties.
- Lokaal beheerde `openclaw`-profielen wijzen `cdpPort` en `cdpUrl` automatisch toe; stel
  `cdpUrl` alleen expliciet in voor remote CDP.
- Lokaal beheerde profielen kunnen `executablePath` instellen om de globale
  `browser.executablePath` voor dat profiel te overschrijven. Gebruik dit om één profiel in
  Chrome en een ander in Brave uit te voeren.
- Lokaal beheerde profielen gebruiken `browser.localLaunchTimeoutMs` voor Chrome CDP HTTP-
  detectie na processtart en `browser.localCdpReadyTimeoutMs` voor
  CDP-websocketgereedheid na lancering. Verhoog ze op tragere hosts waar Chrome
  succesvol start maar gereedheidscontroles met het opstarten racen. Beide waarden moeten
  positieve gehele getallen tot `120000` ms zijn; ongeldige configuratiewaarden worden geweigerd.
- Volgorde voor automatische detectie: standaardbrowser indien Chromium-gebaseerd → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` en `browser.profiles.<name>.executablePath` accepteren beide
  `~` en `~/...` voor de homedirectory van je OS vóór het starten van Chromium.
  `userDataDir` per profiel op `existing-session`-profielen wordt ook met tilde uitgebreid.
- Besturingsservice: alleen loopback (poort afgeleid van `gateway.port`, standaard `18791`).
- `extraArgs` voegt extra launch-flags toe aan lokale Chromium-opstart (bijvoorbeeld
  `--disable-gpu`, venstergrootte of debugflags).

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

- `seamColor`: accentkleur voor native app-UI-chrome (Talk Mode-bubbeltint, enz.).
- `assistant`: override voor Control UI-identiteit. Valt terug op de actieve agentidentiteit.

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

<Accordion title="Gateway-velddetails">

- `mode`: `local` (gateway uitvoeren) of `remote` (verbinden met externe gateway). Gateway weigert te starten tenzij dit `local` is.
- `port`: enkele gemultiplexte poort voor WS + HTTP. Voorrang: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (standaard), `lan` (`0.0.0.0`), `tailnet` (alleen Tailscale-IP), of `custom`.
- **Verouderde bind-aliassen**: gebruik bind-moduswaarden in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), geen hostaliassen (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-opmerking**: de standaard `loopback`-bind luistert op `127.0.0.1` binnen de container. Met Docker bridge-netwerken (`-p 18789:18789`) komt verkeer binnen op `eth0`, waardoor de gateway onbereikbaar is. Gebruik `--network host`, of stel `bind: "lan"` in (of `bind: "custom"` met `customBindHost: "0.0.0.0"`) om op alle interfaces te luisteren.
- **Auth**: standaard vereist. Niet-loopback-binds vereisen gateway-auth. In de praktijk betekent dit een gedeeld token/wachtwoord of een identity-aware reverse proxy met `gateway.auth.mode: "trusted-proxy"`. De onboardingwizard genereert standaard een token.
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd (inclusief SecretRefs), stel `gateway.auth.mode` dan expliciet in op `token` of `password`. Opstart- en service-installatie-/reparatiestromen mislukken wanneer beide zijn geconfigureerd en modus niet is ingesteld.
- `gateway.auth.mode: "none"`: expliciete modus zonder auth. Gebruik alleen voor vertrouwde local loopback-configuraties; dit wordt bewust niet aangeboden door onboardingprompts.
- `gateway.auth.mode: "trusted-proxy"`: delegeer browser-/gebruikersauth aan een identity-aware reverse proxy en vertrouw identity-headers van `gateway.trustedProxies` (zie [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth)). Deze modus verwacht standaard een **niet-loopback** proxybron; same-host loopback reverse proxies vereisen expliciet `gateway.auth.trustedProxy.allowLoopback = true`. Interne same-host callers kunnen `gateway.auth.password` gebruiken als lokale directe fallback; `gateway.auth.token` blijft wederzijds exclusief met trusted-proxy-modus.
- `gateway.auth.allowTailscale`: wanneer `true`, kunnen Tailscale Serve-identity-headers voldoen aan Control UI/WebSocket-auth (geverifieerd via `tailscale whois`). HTTP API-eindpunten gebruiken die Tailscale-headerauth **niet**; ze volgen in plaats daarvan de normale HTTP-authmodus van de gateway. Deze tokenloze stroom gaat ervan uit dat de gatewayhost vertrouwd is. Staat standaard op `true` wanneer `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: optionele limiter voor mislukte auth. Wordt toegepast per client-IP en per auth-scope (shared-secret en device-token worden onafhankelijk bijgehouden). Geblokkeerde pogingen retourneren `429` + `Retry-After`.
  - Op het async Tailscale Serve Control UI-pad worden mislukte pogingen voor dezelfde `{scope, clientIp}` geserialiseerd voordat de fout wordt geschreven. Gelijktijdige slechte pogingen van dezelfde client kunnen de limiter daarom bij het tweede verzoek activeren in plaats van dat beide als gewone mismatches tegelijk doorgaan.
  - `gateway.auth.rateLimit.exemptLoopback` staat standaard op `true`; stel in op `false` wanneer je bewust ook localhost-verkeer wilt rate-limiten (voor testopstellingen of strikte proxydeployments).
- Browser-origin WS-authpogingen worden altijd beperkt met loopback-vrijstelling uitgeschakeld (defense-in-depth tegen browsergebaseerde localhost-bruteforce).
- Op loopback worden die browser-origin lockouts geïsoleerd per genormaliseerde `Origin`
  waarde, zodat herhaalde mislukkingen van één localhost-origin niet automatisch
  een andere origin buitensluiten.
- `tailscale.mode`: `serve` (alleen tailnet, loopback-bind) of `funnel` (publiek, vereist auth).
- `tailscale.preserveFunnel`: wanneer `true` en `tailscale.mode = "serve"`, controleert OpenClaw
  `tailscale funnel status` voordat Serve opnieuw wordt toegepast bij het opstarten en slaat
  dit over als een extern geconfigureerde Funnel-route de gatewaypoort al dekt.
  Standaard `false`.
- `controlUi.allowedOrigins`: expliciete browser-origin-allowlist voor Gateway WebSocket-verbindingen. Vereist wanneer browserclients worden verwacht vanaf niet-loopback-origins.
- `controlUi.chatMessageMaxWidth`: optionele max-width voor gegroepeerde Control UI-chatberichten. Accepteert begrensde CSS-breedtewaarden zoals `960px`, `82%`, `min(1280px, 82%)` en `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gevaarlijke modus die Host-header-origin-fallback inschakelt voor deployments die bewust vertrouwen op Host-header-originbeleid.
- `remote.transport`: `ssh` (standaard) of `direct` (ws/wss). Voor `direct` moet `remote.url` `ws://` of `wss://` zijn.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: client-side procesomgevingsvariabele
  als noodoverride die plaintext `ws://` toestaat naar vertrouwde privénetwerk-
  IP's; standaard blijft plaintext beperkt tot loopback. Er is geen `openclaw.json`
  equivalent, en browserconfiguratie voor privénetwerken zoals
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` heeft geen invloed op Gateway
  WebSocket-clients.
- `gateway.remote.token` / `.password` zijn credentialvelden voor externe clients. Ze configureren gateway-auth niet op zichzelf.
- `gateway.push.apns.relay.baseUrl`: basis-HTTPS-URL voor de externe APNs-relay die wordt gebruikt door officiële/TestFlight iOS-builds nadat ze relay-backed registraties naar de gateway publiceren. Deze URL moet overeenkomen met de relay-URL die in de iOS-build is gecompileerd.
- `gateway.push.apns.relay.timeoutMs`: verzendtimeout van gateway naar relay in milliseconden. Standaard `10000`.
- Relay-backed registraties worden gedelegeerd aan een specifieke gatewayidentity. De gekoppelde iOS-app haalt `gateway.identity.get` op, neemt die identity op in de relayregistratie en stuurt een registratiegebonden verzendtoekenning door naar de gateway. Een andere gateway kan die opgeslagen registratie niet hergebruiken.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: tijdelijke env-overrides voor de relayconfiguratie hierboven.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: alleen-ontwikkeling uitweg voor loopback-HTTP-relay-URL's. Productierelay-URL's moeten HTTPS blijven gebruiken.
- `gateway.handshakeTimeoutMs`: pre-auth Gateway WebSocket-handshake-timeout in milliseconden. Standaard: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` heeft voorrang wanneer ingesteld. Verhoog dit op belaste of low-powered hosts waar lokale clients kunnen verbinden terwijl de opstartwarmup nog stabiliseert.
- `gateway.channelHealthCheckMinutes`: interval van de kanaal-healthmonitor in minuten. Stel `0` in om herstarts door de healthmonitor globaal uit te schakelen. Standaard: `5`.
- `gateway.channelStaleEventThresholdMinutes`: stale-socket-drempel in minuten. Houd dit groter dan of gelijk aan `gateway.channelHealthCheckMinutes`. Standaard: `30`.
- `gateway.channelMaxRestartsPerHour`: maximaal aantal healthmonitor-herstarts per kanaal/account in een rollend uur. Standaard: `10`.
- `channels.<provider>.healthMonitor.enabled`: per-kanaal opt-out voor healthmonitor-herstarts terwijl de globale monitor ingeschakeld blijft.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: per-account override voor multi-account-kanalen. Wanneer ingesteld, heeft dit voorrang op de kanaalniveau-override.
- Lokale gateway-aanroeppaden kunnen `gateway.remote.*` alleen als fallback gebruiken wanneer `gateway.auth.*` niet is ingesteld.
- Als `gateway.auth.token` / `gateway.auth.password` expliciet is geconfigureerd via SecretRef en niet kan worden opgelost, mislukt resolutie gesloten (geen maskering door externe fallback).
- `trustedProxies`: reverse proxy-IP's die TLS beëindigen of forwarded-client-headers injecteren. Vermeld alleen proxies die je beheert. Loopback-items blijven geldig voor same-host proxy-/lokale-detectieopstellingen (bijvoorbeeld Tailscale Serve of een lokale reverse proxy), maar ze maken loopback-verzoeken **niet** geschikt voor `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: wanneer `true`, accepteert de gateway `X-Real-IP` als `X-Forwarded-For` ontbreekt. Standaard `false` voor fail-closed gedrag.
- `gateway.nodes.pairing.autoApproveCidrs`: optionele CIDR/IP-allowlist voor het automatisch goedkeuren van eerste node-device-pairing zonder aangevraagde scopes. Dit is uitgeschakeld wanneer niet ingesteld. Dit keurt operator-/browser-/Control UI-/WebChat-pairing niet automatisch goed, en keurt rol-, scope-, metadata- of public-key-upgrades niet automatisch goed.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globale allow/deny-vormgeving voor gedeclareerde nodecommando's na pairing en platform-allowlist-evaluatie. Gebruik `allowCommands` om gevaarlijke nodecommando's zoals `camera.snap`, `camera.clip` en `screen.record` expliciet toe te staan; `denyCommands` verwijdert een commando zelfs als een platformstandaard of expliciete allow het anders zou opnemen. Nadat een node zijn gedeclareerde commandolijst wijzigt, wijs je die device-pairing af en keur je deze opnieuw goed zodat de gateway de bijgewerkte commandosnapshot opslaat.
- `gateway.tools.deny`: extra toolnamen die worden geblokkeerd voor HTTP `POST /tools/invoke` (breidt standaard denylist uit).
- `gateway.tools.allow`: verwijder toolnamen uit de standaard HTTP-denylist.

</Accordion>

### OpenAI-compatibele eindpunten

- Chat Completions: standaard uitgeschakeld. Schakel in met `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Verharding van URL-invoer voor Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Lege allowlists worden behandeld als niet ingesteld; gebruik `gateway.http.endpoints.responses.files.allowUrl=false`
    en/of `gateway.http.endpoints.responses.images.allowUrl=false` om URL-fetching uit te schakelen.
- Optionele response-verhardingsheader:
  - `gateway.http.securityHeaders.strictTransportSecurity` (stel alleen in voor HTTPS-origins die je beheert; zie [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Multi-instance-isolatie

Voer meerdere gateways op één host uit met unieke poorten en state dirs:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Gemaksflags: `--dev` (gebruikt `~/.openclaw-dev` + poort `19001`), `--profile <name>` (gebruikt `~/.openclaw-<name>`).

Zie [Multiple Gateways](/nl/gateway/multiple-gateways).

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

- `enabled`: schakelt TLS-beëindiging in op de gateway-listener (HTTPS/WSS) (standaard: `false`).
- `autoGenerate`: genereert automatisch een lokaal self-signed cert/key-paar wanneer expliciete bestanden niet zijn geconfigureerd; alleen voor lokaal/dev-gebruik.
- `certPath`: bestandssysteempad naar het TLS-certificaatbestand.
- `keyPath`: bestandssysteempad naar het TLS-private-key-bestand; houd permissies beperkt.
- `caPath`: optioneel CA-bundelpad voor clientverificatie of aangepaste trust chains.

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

- `mode`: bepaalt hoe configuratiewijzigingen tijdens runtime worden toegepast.
  - `"off"`: negeer live wijzigingen; wijzigingen vereisen een expliciete herstart.
  - `"restart"`: herstart altijd het gatewayproces bij configuratiewijziging.
  - `"hot"`: pas wijzigingen in-process toe zonder herstart.
  - `"hybrid"` (standaard): probeer eerst hot reload; val terug op herstart indien nodig.
- `debounceMs`: debouncevenster in ms voordat configuratiewijzigingen worden toegepast (niet-negatief geheel getal).
- `deferralTimeoutMs`: optionele maximale wachttijd in ms voor in-flight operaties voordat een herstart of channel hot reload wordt geforceerd. Laat weg om de standaard begrensde wachttijd (`300000`) te gebruiken; stel in op `0` om onbeperkt te wachten en periodieke waarschuwingen over nog openstaande taken te loggen.

---

## Hooks

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

Auth: `Authorization: Bearer <token>` of `x-openclaw-token: <token>`.
Hooktokens in de querystring worden geweigerd.

Validatie- en veiligheidsnotities:

- `hooks.enabled=true` vereist een niet-lege `hooks.token`.
- `hooks.token` moet **verschillend** zijn van `gateway.auth.token`; hergebruik van het Gateway-token wordt geweigerd.
- `hooks.path` mag niet `/` zijn; gebruik een toegewijd subpad zoals `/hooks`.
- Als `hooks.allowRequestSessionKey=true`, beperk dan `hooks.allowedSessionKeyPrefixes` (bijvoorbeeld `["hook:"]`).
- Als een mapping of preset een gesjabloneerde `sessionKey` gebruikt, stel dan `hooks.allowedSessionKeyPrefixes` en `hooks.allowRequestSessionKey=true` in. Statische mappingsleutels vereisen die opt-in niet.

**Eindpunten:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` uit de requestpayload wordt alleen geaccepteerd wanneer `hooks.allowRequestSessionKey=true` (standaard: `false`).
- `POST /hooks/<name>` → opgelost via `hooks.mappings`
  - Door sjablonen gerenderde mappingwaarden voor `sessionKey` worden behandeld als extern aangeleverd en vereisen ook `hooks.allowRequestSessionKey=true`.

<Accordion title="Mappingdetails">

- `match.path` komt overeen met het subpad na `/hooks` (bijv. `/hooks/gmail` → `gmail`).
- `match.source` komt overeen met een payloadveld voor generieke paden.
- Sjablonen zoals `{{messages[0].subject}}` lezen uit de payload.
- `transform` kan verwijzen naar een JS/TS-module die een hookactie retourneert.
  - `transform.module` moet een relatief pad zijn en blijft binnen `hooks.transformsDir` (absolute paden en traversal worden geweigerd).
  - Houd `hooks.transformsDir` onder `~/.openclaw/hooks/transforms`; workspace-Skills-mappen worden geweigerd. Als `openclaw doctor` dit pad als ongeldig rapporteert, verplaats de transformmodule dan naar de hooks-transformmap of verwijder `hooks.transformsDir`.
- `agentId` routeert naar een specifieke agent; onbekende id's vallen terug op de standaard.
- `allowedAgentIds`: beperkt expliciete routering (`*` of weggelaten = alles toestaan, `[]` = alles weigeren).
- `defaultSessionKey`: optionele vaste sessiesleutel voor hook-agentuitvoeringen zonder expliciete `sessionKey`.
- `allowRequestSessionKey`: sta `/hooks/agent`-aanroepers en door sjablonen aangedreven mappingsessiesleutels toe om `sessionKey` in te stellen (standaard: `false`).
- `allowedSessionKeyPrefixes`: optionele allowlist met prefixen voor expliciete `sessionKey`-waarden (request + mapping), bijv. `["hook:"]`. Dit wordt verplicht wanneer een mapping of preset een gesjabloneerde `sessionKey` gebruikt.
- `deliver: true` stuurt het definitieve antwoord naar een kanaal; `channel` is standaard `last`.
- `model` overschrijft de LLM voor deze hookuitvoering (moet toegestaan zijn als de modelcatalogus is ingesteld).

</Accordion>

### Gmail-integratie

- De ingebouwde Gmail-preset gebruikt `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Als u die routering per bericht behoudt, stel dan `hooks.allowRequestSessionKey: true` in en beperk `hooks.allowedSessionKeyPrefixes` zodat deze overeenkomt met de Gmail-namespace, bijvoorbeeld `["hook:", "hook:gmail:"]`.
- Als u `hooks.allowRequestSessionKey: false` nodig hebt, overschrijf de preset dan met een statische `sessionKey` in plaats van de gesjabloneerde standaardwaarde.

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

- Gateway start `gog gmail watch serve` automatisch bij het opstarten wanneer dit is geconfigureerd. Stel `OPENCLAW_SKIP_GMAIL_WATCHER=1` in om dit uit te schakelen.
- Voer geen aparte `gog gmail watch serve` uit naast de Gateway.

---

## Canvas-Plugin-host

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

- Serveert door agents bewerkbare HTML/CSS/JS en A2UI via HTTP onder de Gateway-poort:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Alleen lokaal: houd `gateway.bind: "loopback"` (standaard).
- Niet-loopback-bindings: canvasroutes vereisen Gateway-authenticatie (token/wachtwoord/trusted proxy), hetzelfde als andere Gateway-HTTP-oppervlakken.
- Node WebViews sturen doorgaans geen authenticatieheaders; nadat een node is gekoppeld en verbonden, adverteert de Gateway node-scoped capability-URL's voor toegang tot canvas/A2UI.
- Capability-URL's zijn gebonden aan de actieve node-WS-sessie en verlopen snel. Een op IP gebaseerde fallback wordt niet gebruikt.
- Injecteert een live-reloadclient in geserveerde HTML.
- Maakt automatisch een starter-`index.html` wanneer leeg.
- Serveert A2UI ook op `/__openclaw__/a2ui/`.
- Wijzigingen vereisen een herstart van de gateway.
- Schakel live reload uit voor grote mappen of `EMFILE`-fouten.

---

## Detectie

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

- `minimal` (standaard wanneer de gebundelde `bonjour`-Plugin is ingeschakeld): laat `cliPath` + `sshPort` weg uit TXT-records.
- `full`: neem `cliPath` + `sshPort` op; LAN-multicastadvertising vereist nog steeds dat de gebundelde `bonjour`-Plugin is ingeschakeld.
- `off`: onderdruk LAN-multicastadvertising zonder Plugin-inschakeling te wijzigen.
- De gebundelde `bonjour`-Plugin start automatisch op macOS-hosts en is opt-in op Linux, Windows en gecontaineriseerde Gateway-deployments.
- Hostnaam is standaard de systeemhostnaam wanneer die een geldig DNS-label is, met fallback naar `openclaw`. Overschrijf met `OPENCLAW_MDNS_HOSTNAME`.

### Breed gebied (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Schrijft een unicast DNS-SD-zone onder `~/.openclaw/dns/`. Voor detectie over netwerken heen, combineer met een DNS-server (CoreDNS aanbevolen) + Tailscale split DNS.

Installatie: `openclaw dns setup --apply`.

---

## Omgeving

### `env` (inline omgevingsvariabelen)

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

- Inline omgevingsvariabelen worden alleen toegepast als de procesomgeving de sleutel mist.
- `.env`-bestanden: CWD `.env` + `~/.openclaw/.env` (geen van beide overschrijft bestaande variabelen).
- `shellEnv`: importeert ontbrekende verwachte sleutels uit je login-shellprofiel.
- Zie [Omgeving](/nl/help/environment) voor de volledige prioriteitsvolgorde.

### Vervanging van omgevingsvariabelen

Verwijs in elke configuratiereeks naar omgevingsvariabelen met `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Alleen hoofdletternamen komen overeen: `[A-Z_][A-Z0-9_]*`.
- Ontbrekende/lege variabelen geven een fout bij het laden van de configuratie.
- Escape met `$${VAR}` voor een letterlijke `${VAR}`.
- Werkt met `$include`.

---

## Geheimen

Geheimverwijzingen zijn additief: platte-tekstwaarden werken nog steeds.

### `SecretRef`

Gebruik één objectvorm:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validatie:

- `provider`-patroon: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id-patroon: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: absolute JSON-pointer (bijvoorbeeld `"/providers/openai/apiKey"`)
- `source: "exec"` id-patroon: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` ids mogen geen door schuine strepen gescheiden padsegmenten `.` of `..` bevatten (bijvoorbeeld `a/../b` wordt geweigerd)

### Ondersteund oppervlak voor referenties

- Canonieke matrix: [SecretRef-referentieoppervlak](/nl/reference/secretref-credential-surface)
- `secrets apply` richt zich op ondersteunde referentiepaden in `openclaw.json`.
- `auth-profiles.json`-verwijzingen zijn opgenomen in runtime-resolutie en auditdekking.

### Configuratie van geheimproviders

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

Opmerkingen:

- `file`-provider ondersteunt `mode: "json"` en `mode: "singleValue"` (`id` moet `"value"` zijn in singleValue-modus).
- Paden van file- en exec-providers falen gesloten wanneer Windows ACL-verificatie niet beschikbaar is. Stel `allowInsecurePath: true` alleen in voor vertrouwde paden die niet kunnen worden geverifieerd.
- `exec`-provider vereist een absoluut `command`-pad en gebruikt protocolpayloads op stdin/stdout.
- Standaard worden opdrachtpaden met symlinks geweigerd. Stel `allowSymlinkCommand: true` in om symlinkpaden toe te staan terwijl het opgeloste doelpad wordt gevalideerd.
- Als `trustedDirs` is geconfigureerd, wordt de trusted-dir-controle toegepast op het opgeloste doelpad.
- De child-omgeving van `exec` is standaard minimaal; geef vereiste variabelen expliciet door met `passEnv`.
- Geheimverwijzingen worden tijdens activatie opgelost naar een in-memory snapshot; daarna lezen aanvraagpaden alleen de snapshot.
- Filtering van actieve oppervlakken is van toepassing tijdens activatie: niet-opgeloste verwijzingen op ingeschakelde oppervlakken laten opstarten/herladen falen, terwijl inactieve oppervlakken met diagnostiek worden overgeslagen.

---

## Auth-opslag

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

- Profielen per agent worden opgeslagen op `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` ondersteunt verwijzingen op waardeniveau (`keyRef` voor `api_key`, `tokenRef` voor `token`) voor statische referentiemodi.
- Legacy platte `auth-profiles.json`-maps zoals `{ "provider": { "apiKey": "..." } }` zijn geen runtime-indeling; `openclaw doctor --fix` herschrijft ze naar canonieke `provider:default` API-key-profielen met een `.legacy-flat.*.bak`-back-up.
- Profielen in OAuth-modus (`auth.profiles.<id>.mode = "oauth"`) ondersteunen geen door SecretRef ondersteunde auth-profile-referenties.
- Statische runtime-referenties komen uit in-memory opgeloste snapshots; legacy statische `auth.json`-items worden verwijderd wanneer ze worden ontdekt.
- Legacy OAuth importeert uit `~/.openclaw/credentials/oauth.json`.
- Zie [OAuth](/nl/concepts/oauth).
- Runtimegedrag van geheimen en `audit/configure/apply`-tools: [Geheimenbeheer](/nl/gateway/secrets).

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

- `billingBackoffHours`: basis-backoff in uren wanneer een profiel mislukt door echte
  facturerings-/onvoldoende-tegoedfouten (standaard: `5`). Expliciete factureringstekst kan
  hier nog steeds terechtkomen, zelfs bij `401`/`403`-antwoorden, maar providerspecifieke
  tekstmatchers blijven beperkt tot de provider die ze bezit (bijvoorbeeld OpenRouter
  `Key limit exceeded`). Opnieuw te proberen HTTP `402`-berichten over gebruiksvensters of
  bestedingslimieten voor organisatie/werkruimte blijven in plaats daarvan in het pad
  `rate_limit`.
- `billingBackoffHoursByProvider`: optionele overschrijvingen per provider voor facturerings-backoffuren.
- `billingMaxHours`: bovengrens in uren voor exponentiële groei van facturerings-backoff (standaard: `24`).
- `authPermanentBackoffMinutes`: basis-backoff in minuten voor `auth_permanent`-mislukkingen met hoge betrouwbaarheid (standaard: `10`).
- `authPermanentMaxMinutes`: bovengrens in minuten voor groei van `auth_permanent`-backoff (standaard: `60`).
- `failureWindowHours`: voortschrijdend venster in uren dat wordt gebruikt voor backoff-tellers (standaard: `24`).
- `overloadedProfileRotations`: maximum aantal auth-profielrotaties binnen dezelfde provider voor overbelastingsfouten voordat wordt overgeschakeld naar model-fallback (standaard: `1`). Provider-bezet-vormen zoals `ModelNotReadyException` komen hier terecht.
- `overloadedBackoffMs`: vaste vertraging voordat een overbelaste provider-/profielrotatie opnieuw wordt geprobeerd (standaard: `0`).
- `rateLimitedProfileRotations`: maximum aantal auth-profielrotaties binnen dezelfde provider voor rate-limit-fouten voordat wordt overgeschakeld naar model-fallback (standaard: `1`). Die rate-limit-bucket bevat door providers gevormde tekst zoals `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` en `resource exhausted`.

---

## Logboekregistratie

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

- Standaard logbestand: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Stel `logging.file` in voor een stabiel pad.
- `consoleLevel` wordt verhoogd naar `debug` wanneer `--verbose`.
- `maxFileBytes`: maximale grootte van het actieve logbestand in bytes vóór rotatie (positief geheel getal; standaard: `104857600` = 100 MB). OpenClaw bewaart maximaal vijf genummerde archieven naast het actieve bestand.
- `redactSensitive` / `redactPatterns`: best-effort-maskering voor console-uitvoer, bestandslogs, OTLP-logrecords en opgeslagen sessietranscripttekst. `redactSensitive: "off"` schakelt alleen dit algemene log-/transcriptbeleid uit; UI-/tool-/diagnostische veiligheidsoppervlakken redigeren nog steeds geheimen vóór emissie.

---

## Diagnostiek

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

- `enabled`: hoofdschakelaar voor instrumentatie-uitvoer (standaard: `true`).
- `flags`: array van flagstrings die gerichte loguitvoer inschakelen (ondersteunt jokertekens zoals `"telegram.*"` of `"*"`).
- `stuckSessionWarnMs`: drempel voor leeftijd zonder voortgang in ms voor het classificeren van langlopende verwerkingssessies als `session.long_running`, `session.stalled` of `session.stuck`. Antwoord-, tool-, status-, blok- en ACP-voortgang resetten de timer; herhaalde `session.stuck`-diagnostiek neemt afstand terwijl er niets verandert.
- `stuckSessionAbortMs`: drempel voor leeftijd zonder voortgang in ms voordat in aanmerking komend vastgelopen actief werk via abort-drain kan worden hersteld. Wanneer niet ingesteld, gebruikt OpenClaw het veiligere uitgebreide venster voor ingebedde runs van ten minste 10 minuten en 5x `stuckSessionWarnMs`.
- `otel.enabled`: schakelt de OpenTelemetry-exportpipeline in (standaard: `false`). Zie [OpenTelemetry-export](/nl/gateway/opentelemetry) voor de volledige configuratie, signaalcatalogus en het privacymodel.
- `otel.endpoint`: collector-URL voor OTel-export.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: optionele signaalspecifieke OTLP-eindpunten. Wanneer ingesteld, overschrijven ze `otel.endpoint` alleen voor dat signaal.
- `otel.protocol`: `"http/protobuf"` (standaard) of `"grpc"`.
- `otel.headers`: extra HTTP-/gRPC-metadataheaders die met OTel-exportverzoeken worden meegestuurd.
- `otel.serviceName`: servicenaam voor resource-attributen.
- `otel.traces` / `otel.metrics` / `otel.logs`: trace-, metrics- of logexport inschakelen.
- `otel.sampleRate`: trace-samplingrate `0`-`1`.
- `otel.flushIntervalMs`: periodiek telemetry-flushinterval in ms.
- `otel.captureContent`: opt-in vastlegging van ruwe inhoud voor OTEL-spanattributen. Staat standaard uit. Booleaanse waarde `true` legt niet-systeeminhoud van berichten/tools vast; met de objectvorm kun je `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` en `systemPrompt` expliciet inschakelen.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: omgevingsschakelaar voor de nieuwste experimentele GenAI-spanproviderattributen. Standaard behouden spans het verouderde attribuut `gen_ai.system` voor compatibiliteit; GenAI-metrics gebruiken begrensde semantische attributen.
- `OPENCLAW_OTEL_PRELOADED=1`: omgevingsschakelaar voor hosts die al een globale OpenTelemetry-SDK hebben geregistreerd. OpenClaw slaat dan het starten/afsluiten van de Plugin-eigen SDK over terwijl diagnostische listeners actief blijven.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` en `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: signaalspecifieke endpoint-env-vars die worden gebruikt wanneer de overeenkomende configuratiesleutel niet is ingesteld.
- `cacheTrace.enabled`: cache-trace-snapshots loggen voor ingebedde runs (standaard: `false`).
- `cacheTrace.filePath`: uitvoerpad voor cache-trace-JSONL (standaard: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: bepalen wat wordt opgenomen in cache-trace-uitvoer (allemaal standaard: `true`).

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

- `channel`: releasekanaal voor npm-/git-installaties - `"stable"`, `"beta"` of `"dev"`.
- `checkOnStart`: controleren op npm-updates wanneer de Gateway start (standaard: `true`).
- `auto.enabled`: automatische update op de achtergrond inschakelen voor pakketinstallaties (standaard: `false`).
- `auto.stableDelayHours`: minimale vertraging in uren voordat auto-apply voor het stabiele kanaal plaatsvindt (standaard: `6`; max: `168`).
- `auto.stableJitterHours`: extra uitrolspreidingsvenster voor het stabiele kanaal in uren (standaard: `12`; max: `168`).
- `auto.betaCheckIntervalHours`: hoe vaak controles voor het bètakanaal worden uitgevoerd, in uren (standaard: `1`; max: `24`).

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

- `enabled`: globale ACP-functiepoort (standaard: `true`; stel in op `false` om ACP-dispatch- en spawn-mogelijkheden te verbergen).
- `dispatch.enabled`: onafhankelijke poort voor turn-dispatch van ACP-sessies (standaard: `true`). Stel in op `false` om ACP-opdrachten beschikbaar te houden terwijl uitvoering wordt geblokkeerd.
- `backend`: standaard ACP-runtimebackend-id (moet overeenkomen met een geregistreerde ACP-runtime-Plugin).
  Installeer eerst de backend-Plugin en, als `plugins.allow` is ingesteld, neem dan de backend-Plugin-id op (bijvoorbeeld `acpx`), anders wordt de ACP-backend niet geladen.
- `defaultAgent`: fallback ACP-doelagent-id wanneer spawns geen expliciet doel opgeven.
- `allowedAgents`: allowlist van agent-id's die zijn toegestaan voor ACP-runtimesessies; leeg betekent geen aanvullende beperking.
- `maxConcurrentSessions`: maximaal aantal gelijktijdig actieve ACP-sessies.
- `stream.coalesceIdleMs`: idle-flushvenster in ms voor gestreamde tekst.
- `stream.maxChunkChars`: maximale chunkgrootte voordat gestreamde blokprojectie wordt gesplitst.
- `stream.repeatSuppression`: herhaalde status-/toolregels per turn onderdrukken (standaard: `true`).
- `stream.deliveryMode`: `"live"` streamt incrementeel; `"final_only"` buffert tot terminale turn-events.
- `stream.hiddenBoundarySeparator`: scheidingsteken vóór zichtbare tekst na verborgen tool-events (standaard: `"paragraph"`).
- `stream.maxOutputChars`: maximaal aantal assistant-uitvoertekens dat per ACP-turn wordt geprojecteerd.
- `stream.maxSessionUpdateChars`: maximaal aantal tekens voor geprojecteerde ACP-status-/updateregels.
- `stream.tagVisibility`: record van tagnamen naar booleaanse zichtbaarheidsoverschrijvingen voor gestreamde events.
- `runtime.ttlMinutes`: idle-TTL in minuten voor ACP-sessieworkers voordat ze in aanmerking komen voor opschoning.
- `runtime.installCommand`: optionele installatieopdracht om uit te voeren bij het bootstrappen van een ACP-runtimeomgeving.

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

- `cli.banner.taglineMode` bepaalt de stijl van de banner-tagline:
  - `"random"` (standaard): roterende grappige/seizoensgebonden taglines.
  - `"default"`: vaste neutrale tagline (`All your chats, one OpenClaw.`).
  - `"off"`: geen tagline-tekst (bannertitel/-versie wordt nog steeds getoond).
- Om de volledige banner te verbergen (niet alleen taglines), stel env `OPENCLAW_HIDE_BANNER=1` in.

---

## Wizard

Metadata geschreven door begeleide CLI-installatiestromen (`onboard`, `configure`, `doctor`):

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

## Identiteit

Zie de identiteitsvelden van `agents.list` onder [Agent-standaarden](/nl/gateway/config-agents#agent-defaults).

---

## Bridge (legacy, verwijderd)

Huidige builds bevatten de TCP-bridge niet meer. Nodes verbinden via de Gateway WebSocket. `bridge.*`-sleutels maken geen deel meer uit van het configuratieschema (validatie mislukt totdat ze zijn verwijderd; `openclaw doctor --fix` kan onbekende sleutels verwijderen).

<Accordion title="Legacy bridge-configuratie (historische referentie)">

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
    maxConcurrentRuns: 2, // cron-dispatch + geïsoleerde cron-uitvoering van agent-turn
    webhook: "https://example.invalid/legacy", // verouderde fallback voor opgeslagen notify:true-taken
    webhookToken: "replace-with-dedicated-token", // optionele bearer-token voor uitgaande webhook-auth
    sessionRetention: "24h", // duurstring of false
    runLog: {
      maxBytes: "2mb", // standaard 2_000_000 bytes
      keepLines: 2000, // standaard 2000
    },
  },
}
```

- `sessionRetention`: hoelang voltooide geïsoleerde cron-uitvoersessies bewaard blijven voordat ze uit `sessions.json` worden opgeschoond. Regelt ook het opschonen van gearchiveerde verwijderde cron-transcripten. Standaard: `24h`; stel in op `false` om uit te schakelen.
- `runLog.maxBytes`: maximale grootte per uitvoerlogbestand (`cron/runs/<jobId>.jsonl`) voordat opschoning plaatsvindt. Standaard: `2_000_000` bytes.
- `runLog.keepLines`: nieuwste regels die behouden blijven wanneer opschoning van uitvoerlogs wordt geactiveerd. Standaard: `2000`.
- `webhookToken`: bearer-token dat wordt gebruikt voor POST-levering via cron-webhook (`delivery.mode = "webhook"`); als dit wordt weggelaten, wordt er geen auth-header verzonden.
- `webhook`: verouderde legacy fallback-webhook-URL (http/https), alleen gebruikt voor opgeslagen taken die nog steeds `notify: true` hebben.

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

- `maxAttempts`: maximaal aantal nieuwe pogingen voor eenmalige taken bij tijdelijke fouten (standaard: `3`; bereik: `0`-`10`).
- `backoffMs`: array met backoff-vertragingen in ms voor elke nieuwe poging (standaard: `[30000, 60000, 300000]`; 1-10 items).
- `retryOn`: fouttypen die nieuwe pogingen activeren - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Laat weg om alle tijdelijke typen opnieuw te proberen.

Alleen van toepassing op eenmalige cron-taken. Terugkerende taken gebruiken afzonderlijke foutafhandeling.

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

- `enabled`: schakel foutmeldingen in voor cron-taken (standaard: `false`).
- `after`: opeenvolgende fouten voordat een melding wordt verzonden (positief geheel getal, min: `1`).
- `cooldownMs`: minimaal aantal milliseconden tussen herhaalde meldingen voor dezelfde taak (niet-negatief geheel getal).
- `includeSkipped`: tel opeenvolgende overgeslagen uitvoeringen mee voor de meldingsdrempel (standaard: `false`). Overgeslagen uitvoeringen worden afzonderlijk bijgehouden en hebben geen invloed op backoff voor uitvoeringsfouten.
- `mode`: leveringsmodus - `"announce"` verzendt via een kanaalbericht; `"webhook"` plaatst naar de geconfigureerde webhook.
- `accountId`: optioneel account- of kanaal-ID om meldingslevering af te bakenen.

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

- Standaardbestemming voor cron-foutmeldingen over alle taken.
- `mode`: `"announce"` of `"webhook"`; standaard `"announce"` wanneer er voldoende doelgegevens bestaan.
- `channel`: kanaal-override voor announce-levering. `"last"` hergebruikt het laatst bekende leveringskanaal.
- `to`: expliciet announce-doel of webhook-URL. Vereist voor webhook-modus.
- `accountId`: optionele account-override voor levering.
- `delivery.failureDestination` per taak overschrijft deze globale standaard.
- Wanneer er geen globale of taakgebonden foutbestemming is ingesteld, vallen taken die al via `announce` leveren bij fouten terug op dat primaire announce-doel.
- `delivery.failureDestination` wordt alleen ondersteund voor taken met `sessionTarget="isolated"`, tenzij de primaire `delivery.mode` van de taak `"webhook"` is.

Zie [Cron-taken](/nl/automation/cron-jobs). Geïsoleerde cron-uitvoeringen worden bijgehouden als [achtergrondtaken](/nl/automation/tasks).

---

## Templatevariabelen voor mediamodellen

Templateplaatsaanduidingen die worden uitgebreid in `tools.media.models[].args`:

| Variabele          | Beschrijving                                     |
| ------------------ | ------------------------------------------------ |
| `{{Body}}`         | Volledige inkomende berichttekst                 |
| `{{RawBody}}`      | Ruwe tekst (zonder geschiedenis-/afzenderwrappers) |
| `{{BodyStripped}}` | Tekst waaruit groepsvermeldingen zijn verwijderd |
| `{{From}}`         | Afzenderidentificatie                            |
| `{{To}}`           | Bestemmingsidentificatie                         |
| `{{MessageSid}}`   | Kanaalbericht-ID                                 |
| `{{SessionId}}`    | Huidige sessie-UUID                              |
| `{{IsNewSession}}` | `"true"` wanneer een nieuwe sessie is aangemaakt |
| `{{MediaUrl}}`     | Inkomende media-pseudo-URL                       |
| `{{MediaPath}}`    | Lokaal mediapad                                  |
| `{{MediaType}}`    | Mediatype (image/audio/document/…)               |
| `{{Transcript}}`   | Audiotranscript                                  |
| `{{Prompt}}`       | Opgeloste mediaprompt voor CLI-items             |
| `{{MaxChars}}`     | Opgelost maximaal aantal uitvoertekens voor CLI-items |
| `{{ChatType}}`     | `"direct"` of `"group"`                          |
| `{{GroupSubject}}` | Groepsonderwerp (naar beste vermogen)            |
| `{{GroupMembers}}` | Voorvertoning van groepsleden (naar beste vermogen) |
| `{{SenderName}}`   | Weergavenaam van afzender (naar beste vermogen)  |
| `{{SenderE164}}`   | Telefoonnummer van afzender (naar beste vermogen) |
| `{{Provider}}`     | Providerhint (whatsapp, telegram, discord, etc.) |

---

## Configuratie-includes (`$include`)

Splits configuratie over meerdere bestanden:

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

**Merge-gedrag:**

- Enkel bestand: vervangt het omvattende object.
- Array van bestanden: deep-merged in volgorde (latere overschrijft eerdere).
- Zusterkeys: samengevoegd na includes (overschrijven opgenomen waarden).
- Geneste includes: tot 10 niveaus diep.
- Paden: worden opgelost relatief ten opzichte van het includende bestand, maar moeten binnen de config-hoofdmap blijven (`dirname` van `openclaw.json`). Absolute/`../`-vormen zijn alleen toegestaan wanneer ze nog steeds binnen die grens worden opgelost.
- Schrijfacties die eigendom zijn van OpenClaw en slechts één topniveausectie wijzigen die door een single-file include wordt ondersteund, schrijven door naar dat opgenomen bestand. Bijvoorbeeld: `plugins install` werkt `plugins: { $include: "./plugins.json5" }` bij in `plugins.json5` en laat `openclaw.json` intact.
- Root-includes, include-arrays en includes met zuster-overschrijvingen zijn alleen-lezen voor schrijfacties die eigendom zijn van OpenClaw; die schrijfacties falen gesloten in plaats van de config af te vlakken.
- Fouten: duidelijke berichten voor ontbrekende bestanden, parsefouten en circulaire includes.

---

_Gerelateerd: [Configuratie](/nl/gateway/configuration) · [Configuratievoorbeelden](/nl/gateway/configuration-examples) · [Doctor](/nl/gateway/doctor)_

## Gerelateerd

- [Configuratie](/nl/gateway/configuration)
- [Configuratievoorbeelden](/nl/gateway/configuration-examples)
