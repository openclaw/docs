---
read_when:
    - Je hebt exacte configuratiesemantiek of standaardwaarden op veldniveau nodig
    - U valideert kanaal-, model-, Gateway- of toolconfiguratieblokken
summary: Gateway-configuratiereferentie voor OpenClaw-kernsleutels, standaardwaarden en links naar specifieke subsysteemreferenties
title: Configuratiereferentie
x-i18n:
    generated_at: "2026-05-12T00:58:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b8e31f7a6ed82faf3b5a50daa286bb6fce0c2e4452ae81a8e792a437004ad54
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Kernconfiguratiereferentie voor `~/.openclaw/openclaw.json`. Zie [Configuratie](/nl/gateway/configuration) voor een taakgericht overzicht.

Behandelt de belangrijkste OpenClaw-configuratieoppervlakken en linkt door wanneer een subsysteem een eigen diepgaandere referentie heeft. Kanaal- en pluginbeheerde opdrachtcatalogi en diepgaande geheugen-/QMD-instellingen staan op hun eigen pagina's in plaats van op deze pagina.

Codewaarheid:

- `openclaw config schema` drukt het live JSON Schema af dat wordt gebruikt voor validatie en Control UI, met gebundelde/plugin-/kanaalmetadata samengevoegd wanneer beschikbaar
- `config.schema.lookup` retourneert één padgebonden schemaknooppunt voor drill-downtooling
- `pnpm config:docs:check` / `pnpm config:docs:gen` valideren de baselinehash van de configuratiedocumentatie tegen het huidige schemaoppervlak

Opzoekpad voor agents: gebruik de `gateway`-toolactie `config.schema.lookup` voor
exacte veldniveau-documentatie en beperkingen vóór bewerkingen. Gebruik
[Configuratie](/nl/gateway/configuration) voor taakgerichte begeleiding en deze pagina
voor de bredere veldenkaart, standaardwaarden en links naar subsysteemreferenties.

Toegewijde diepgaande referenties:

- [Referentie voor geheugenconfiguratie](/nl/reference/memory-config) voor `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` en Dreaming-configuratie onder `plugins.entries.memory-core.config.dreaming`
- [Slash-opdrachten](/nl/tools/slash-commands) voor de huidige ingebouwde + gebundelde opdrachtcatalogus
- eigenaarspagina's van kanalen/plugins voor kanaalspecifieke opdrachtoppervlakken

Configuratie-indeling is **JSON5** (opmerkingen + afsluitende komma's toegestaan). Alle velden zijn optioneel - OpenClaw gebruikt veilige standaardwaarden wanneer ze worden weggelaten.

---

## Kanalen

Configuratiesleutels per kanaal zijn verplaatst naar een toegewijde pagina - zie
[Configuratie - kanalen](/nl/gateway/config-channels) voor `channels.*`,
inclusief Slack, Discord, Telegram, WhatsApp, Matrix, iMessage en andere
gebundelde kanalen (auth, toegangscontrole, meerdere accounts, vermeldingsgating).

## Agentstandaardwaarden, meerdere agents, sessies en berichten

Verplaatst naar een toegewijde pagina - zie
[Configuratie - agents](/nl/gateway/config-agents) voor:

- `agents.defaults.*` (werkruimte, model, denken, Heartbeat, geheugen, media, skills, sandbox)
- `multiAgent.*` (routering en bindingen voor meerdere agents)
- `session.*` (sessielevenscyclus, Compaction, snoeien)
- `messages.*` (berichtbezorging, TTS, markdownweergave)
- `talk.*` (Talk-modus)
  - `talk.consultThinkingLevel`: override voor denkniveau voor de volledige OpenClaw-agentrun achter realtime consults van Control UI Talk
  - `talk.consultFastMode`: eenmalige fast-mode-override voor realtime consults van Control UI Talk
  - `talk.speechLocale`: optionele BCP 47-locale-id voor Talk-spraakherkenning op iOS/macOS
  - `talk.silenceTimeoutMs`: wanneer niet ingesteld, behoudt Talk het platformstandaard pauzevenster voordat het transcript wordt verzonden (`700 ms on macOS and Android, 900 ms on iOS`)

## Tools en aangepaste providers

Toolbeleid, experimentele schakelaars, providerondersteunde toolconfiguratie en aangepaste
provider-/basis-URL-instelling zijn verplaatst naar een toegewijde pagina - zie
[Configuratie - tools en aangepaste providers](/nl/gateway/config-tools).

## Modellen

Providerdefinities, model-allowlists en aangepaste providerinstellingen staan in
[Configuratie - tools en aangepaste providers](/nl/gateway/config-tools#custom-providers-and-base-urls).
De `models`-root beheert ook globaal gedrag van de modelcatalogus.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: gedrag van providercatalogus (`merge` of `replace`).
- `models.providers`: aangepaste providermap, gesleuteld op provider-id.
- `models.providers.*.localService`: optionele procesmanager op aanvraag voor
  lokale modelservers. OpenClaw controleert het geconfigureerde health-eindpunt, start
  de absolute `command` wanneer nodig, wacht op gereedheid en verzendt daarna het modelverzoek.
  Zie [Lokale modelservices](/nl/gateway/local-model-services).
- `models.pricing.enabled`: beheert de achtergrondbootstrap voor prijzen die
  start nadat sidecars en kanalen het Gateway-gereedpad bereiken. Wanneer `false`,
  slaat de Gateway het ophalen van OpenRouter- en LiteLLM-prijscatalogi over; geconfigureerde
  waarden voor `models.providers.*.models[].cost` blijven werken voor lokale kostenramingen.

## MCP

Door OpenClaw beheerde MCP-serverdefinities staan onder `mcp.servers` en worden
gebruikt door embedded Pi en andere runtime-adapters. De opdrachten `openclaw mcp list`,
`show`, `set` en `unset` beheren dit blok zonder tijdens configuratiebewerkingen verbinding te maken met de
doelserver.

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

- `mcp.servers`: benoemde stdio- of remote MCP-serverdefinities voor runtimes die
  geconfigureerde MCP-tools beschikbaar maken.
  Remote-items gebruiken `transport: "streamable-http"` of `transport: "sse"`;
  `type: "http"` is een CLI-native alias die `openclaw mcp set` en
  `openclaw doctor --fix` normaliseren naar het canonieke `transport`-veld.
- `mcp.sessionIdleTtlMs`: idle-TTL voor sessiegebonden gebundelde MCP-runtimes.
  Eenmalige embedded runs vragen opschoning aan het einde van de run aan; deze TTL is de achtervang voor
  langlevende sessies en toekomstige callers.
- Wijzigingen onder `mcp.*` worden hot-applied door MCP-runtimes in gecachte sessies te verwijderen.
  De volgende tooldiscovery/-gebruik maakt ze opnieuw aan vanuit de nieuwe configuratie, zodat verwijderde
  `mcp.servers`-items direct worden opgeschoond in plaats van te wachten op de idle-TTL.

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

- `allowBundled`: optionele allowlist alleen voor gebundelde skills (beheerde/werkruimte-skills blijven onaangetast).
- `load.extraDirs`: extra gedeelde skill-roots (laagste prioriteit).
- `load.allowSymlinkTargets`: vertrouwde echte doelroots waarnaar skill-symlinks mogen
  resolven wanneer de link buiten de geconfigureerde bronroot staat.
- `install.preferBrew`: wanneer true, geef de voorkeur aan Homebrew-installers wanneer `brew`
  beschikbaar is voordat wordt teruggevallen op andere installertypen.
- `install.nodeManager`: voorkeur voor node-installer voor `metadata.openclaw.install`
  specificaties (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: sta vertrouwde `operator.admin` Gateway-clients toe
  privé-ziparchieven te installeren die zijn gestaged via `skills.upload.*`
  (standaard: false). Dit schakelt alleen het pad voor geüploade archieven in; normale ClawHub-
  installaties vereisen dit niet.
- `entries.<skillKey>.enabled: false` schakelt een skill uit, zelfs als deze gebundeld/geïnstalleerd is.
- `entries.<skillKey>.apiKey`: gemak voor skills die een primaire env-var declareren (plaintext string of SecretRef-object).

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
- Discovery accepteert native OpenClaw-plugins plus compatibele Codex-bundels en Claude-bundels, inclusief manifestloze Claude-bundels met standaardlay-out.
- **Configuratiewijzigingen vereisen een gateway-herstart.**
- `allow`: optionele allowlist (alleen vermelde plugins worden geladen). `deny` wint.
- `bundledDiscovery`: standaard `"allowlist"` voor nieuwe configuraties, zodat een niet-lege
  `plugins.allow` ook gebundelde providerplugins gate, inclusief web-search
  runtimeproviders. Doctor schrijft `"compat"` voor gemigreerde verouderde allowlist-
  configuraties om bestaand gedrag van gebundelde providers te behouden totdat je je aanmeldt.
- `plugins.entries.<id>.apiKey`: gemakveld voor API-sleutel op pluginniveau (wanneer ondersteund door de plugin).
- `plugins.entries.<id>.env`: env-var-map met pluginscope.
- `plugins.entries.<id>.hooks.allowPromptInjection`: wanneer `false`, blokkeert core `before_prompt_build` en negeert promptmuterende velden uit legacy `before_agent_start`, terwijl legacy `modelOverride` en `providerOverride` behouden blijven. Geldt voor native pluginhooks en ondersteunde door bundels geleverde hookmappen.
- `plugins.entries.<id>.hooks.allowConversationAccess`: wanneer `true`, mogen vertrouwde niet-gebundelde plugins ruwe conversatie-inhoud lezen uit getypte hooks zoals `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` en `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: vertrouw deze plugin expliciet om per-run `provider`- en `model`-overrides aan te vragen voor achtergrondsubagentruns.
- `plugins.entries.<id>.subagent.allowedModels`: optionele allowlist van canonieke `provider/model`-doelen voor vertrouwde subagent-overrides. Gebruik `"*"` alleen wanneer je bewust elk model wilt toestaan.
- `plugins.entries.<id>.llm.allowModelOverride`: vertrouw deze plugin expliciet om modeloverrides aan te vragen voor `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: optionele allowlist van canonieke `provider/model`-doelen voor vertrouwde LLM-voltooiingsoverrides van plugins. Gebruik `"*"` alleen wanneer je bewust elk model wilt toestaan.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: vertrouw deze plugin expliciet om `api.runtime.llm.complete` uit te voeren tegen een niet-standaard agent-id.
- `plugins.entries.<id>.config`: door plugin gedefinieerd configuratieobject (gevalideerd door native OpenClaw-pluginschema wanneer beschikbaar).
- Account-/runtime-instellingen van kanaalplugins staan onder `channels.<id>` en moeten worden beschreven door de `channelConfigs`-metadata van het manifest van de eigenaarplugin, niet door een centraal OpenClaw-optieregister.

### Configuratie van Codex-harnasplugin

De gebundelde `codex`-plugin beheert native Codex-app-serverharnasinstellingen onder
`plugins.entries.codex.config`. Zie
[Codex-harnasreferentie](/nl/plugins/codex-harness-reference) voor het volledige configuratie-
oppervlak en [Codex-harnas](/nl/plugins/codex-harness) voor het runtimemodel.

`codexPlugins` is alleen van toepassing op sessies die het native Codex-harnas selecteren.
Het schakelt geen Codex-plugins in voor Pi, normale OpenAI-providerruns, ACP-
conversatiebindingen of een niet-Codex-harnas.

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

- `plugins.entries.codex.config.codexPlugins.enabled`: schakelt native Codex
  plugin-/app-ondersteuning in voor de Codex-harness. Standaard: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  standaardbeleid voor destructieve acties voor gemigreerde plugin-app-elicitations.
  Standaard: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: schakelt een
  gemigreerde pluginvermelding in wanneer globale `codexPlugins.enabled` ook true is.
  Standaard: `true` voor expliciete vermeldingen.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  stabiele marketplace-identiteit. V1 ondersteunt alleen `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: stabiele
  Codex-pluginidentiteit uit migratie, bijvoorbeeld `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  override per Plugin voor beleid voor destructieve acties. Wanneer dit is weggelaten,
  wordt de globale waarde `allow_destructive_actions` gebruikt.

`codexPlugins.enabled` is de globale inschakelrichtlijn. Expliciete pluginvermeldingen
die door migratie worden geschreven, vormen de duurzame set voor installatie en herstelgeschiktheid.
`plugins["*"]` wordt niet ondersteund, er is geen `install`-schakelaar, en lokale
`marketplacePath`-waarden zijn opzettelijk geen configuratievelden omdat ze
hostspecifiek zijn.

Gereedheidscontroles van `app/list` worden één uur gecachet en asynchroon vernieuwd
wanneer ze verouderd zijn. Codex-thread-appconfiguratie wordt berekend bij het
opzetten van de Codex-harnesssessie, niet bij elke beurt; gebruik `/new`, `/reset`,
of een Gateway-herstart na het wijzigen van native pluginconfiguratie.

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl-instellingen voor web-fetchprovider.
  - `apiKey`: Firecrawl-API-sleutel (accepteert SecretRef). Valt terug op `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey`, of de env var `FIRECRAWL_API_KEY`.
  - `baseUrl`: basis-URL van de Firecrawl-API (standaard: `https://api.firecrawl.dev`; self-hosted overrides moeten naar private/interne endpoints wijzen).
  - `onlyMainContent`: extraheer alleen de hoofdinhoud van pagina's (standaard: `true`).
  - `maxAgeMs`: maximale cacheleeftijd in milliseconden (standaard: `172800000` / 2 dagen).
  - `timeoutSeconds`: time-out voor scrapeverzoek in seconden (standaard: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search-instellingen (Grok-webzoekfunctie).
  - `enabled`: schakel de X Search-provider in.
  - `model`: Grok-model om voor zoeken te gebruiken (bijv. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: instellingen voor memory dreaming. Zie [Dreaming](/nl/concepts/dreaming) voor fasen en drempels.
  - `enabled`: hoofdschakelaar voor dreaming (standaard `false`).
  - `frequency`: Cron-cadans voor elke volledige dreaming-sweep (standaard `"0 3 * * *"`).
  - `model`: optionele model-override voor Dream Diary-subagent. Vereist `plugins.entries.memory-core.subagent.allowModelOverride: true`; combineer met `allowedModels` om doelen te beperken. Fouten door niet-beschikbare modellen worden één keer opnieuw geprobeerd met het standaardmodel van de sessie; vertrouwens- of allowlistfouten vallen niet stilzwijgend terug.
  - fasebeleid en drempels zijn implementatiedetails (geen gebruikersgerichte configuratiesleutels).
- Volledige geheugenconfiguratie staat in [Referentie voor geheugenconfiguratie](/nl/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Ingeschakelde Claude-bundelplugins kunnen ook ingesloten Pi-standaarden uit `settings.json` bijdragen; OpenClaw past die toe als opgeschoonde agentinstellingen, niet als ruwe OpenClaw-configuratiepatches.
- `plugins.slots.memory`: kies de actieve geheugen-plugin-id, of `"none"` om geheugenplugins uit te schakelen.
- `plugins.slots.contextEngine`: kies de actieve contextengine-plugin-id; standaard is `"legacy"`, tenzij je een andere engine installeert en selecteert.

Zie [Plugins](/nl/tools/plugin).

---

## Toezeggingen

`commitments` beheert afgeleid opvolggeheugen: OpenClaw kan check-ins uit gespreksbeurten detecteren en ze via Heartbeat-runs afleveren.

- `commitments.enabled`: schakel verborgen LLM-extractie, opslag en Heartbeat-aflevering in voor afgeleide opvolgtoezeggingen. Standaard: `false`.
- `commitments.maxPerDay`: maximaal aantal afgeleide opvolgtoezeggingen dat per agentsessie in een rollende dag wordt afgeleverd. Standaard: `3`.

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
- `tabCleanup` ruimt gevolgde tabbladen van primaire agents op na inactiviteit of wanneer een
  sessie de limiet overschrijdt. Stel `idleMinutes: 0` of `maxTabsPerSession: 0` in om
  die afzonderlijke opruimmodi uit te schakelen.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` is uitgeschakeld wanneer niet ingesteld, zodat browsernavigatie standaard strikt blijft.
- Stel `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` alleen in wanneer je private-netwerkbrowsernavigatie bewust vertrouwt.
- In strikte modus vallen externe CDP-profielendpoints (`profiles.*.cdpUrl`) onder dezelfde private-netwerkblokkering tijdens bereikbaarheids-/detectiecontroles.
- `ssrfPolicy.allowPrivateNetwork` blijft ondersteund als legacy alias.
- Gebruik in strikte modus `ssrfPolicy.hostnameAllowlist` en `ssrfPolicy.allowedHostnames` voor expliciete uitzonderingen.
- Externe profielen zijn alleen attach-only (start/stop/reset uitgeschakeld).
- `profiles.*.cdpUrl` accepteert `http://`, `https://`, `ws://`, en `wss://`.
  Gebruik HTTP(S) wanneer je wilt dat OpenClaw `/json/version` detecteert; gebruik WS(S)
  wanneer je provider je een directe DevTools-WebSocket-URL geeft.
- `remoteCdpTimeoutMs` en `remoteCdpHandshakeTimeoutMs` gelden voor externe en
  `attachOnly` CDP-bereikbaarheid plus aanvragen voor het openen van tabbladen. Beheerde local loopback-
  profielen behouden lokale CDP-standaarden.
- Als een extern beheerde CDP-service bereikbaar is via loopback, stel dan voor dat
  profiel `attachOnly: true` in; anders behandelt OpenClaw de loopbackpoort als een
  lokaal beheerd browserprofiel en kan het fouten over lokaal poorteigendom melden.
- `existing-session`-profielen gebruiken Chrome MCP in plaats van CDP en kunnen koppelen op
  de geselecteerde host of via een verbonden browsernode.
- `existing-session`-profielen kunnen `userDataDir` instellen om een specifiek
  Chromium-gebaseerd browserprofiel te targeten, zoals Brave of Edge.
- `existing-session`-profielen behouden de huidige Chrome MCP-routelimieten:
  snapshot-/ref-gestuurde acties in plaats van targeting met CSS-selectors, uploadhooks
  voor één bestand, geen overrides voor dialoogtime-outs, geen `wait --load networkidle`, en geen
  `responsebody`, PDF-export, downloadonderschepping, of batchacties.
- Lokale beheerde `openclaw`-profielen wijzen `cdpPort` en `cdpUrl` automatisch toe; stel
  `cdpUrl` alleen expliciet in voor externe CDP.
- Lokale beheerde profielen kunnen `executablePath` instellen om de globale
  `browser.executablePath` voor dat profiel te overschrijven. Gebruik dit om één profiel in
  Chrome en een ander in Brave uit te voeren.
- Lokale beheerde profielen gebruiken `browser.localLaunchTimeoutMs` voor Chrome CDP HTTP-
  detectie na het starten van het proces en `browser.localCdpReadyTimeoutMs` voor
  CDP-websocketgereedheid na het starten. Verhoog ze op langzamere hosts waar Chrome
  succesvol start maar gereedheidscontroles met het opstarten concurreren. Beide waarden moeten
  positieve integers tot `120000` ms zijn; ongeldige configuratiewaarden worden geweigerd.
- Volgorde voor automatische detectie: standaardbrowser indien Chromium-gebaseerd → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` en `browser.profiles.<name>.executablePath` accepteren allebei
  `~` en `~/...` voor de thuismap van je OS vóór het starten van Chromium.
  Per-profiel `userDataDir` op `existing-session`-profielen wordt ook met tilde uitgebreid.
- Besturingsservice: alleen loopback (poort afgeleid van `gateway.port`, standaard `18791`).
- `extraArgs` voegt extra launchflags toe aan lokale Chromium-startup (bijvoorbeeld
  `--disable-gpu`, venstergrootte, of debugflags).

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

- `seamColor`: accentkleur voor native app-UI-chrome (tint van Talk Mode-bubbel, enz.).
- `assistant`: override voor Control UI-identiteit. Valt terug op actieve agentidentiteit.

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

<Accordion title="Details van Gateway-velden">

- `mode`: `local` (Gateway uitvoeren) of `remote` (verbinden met externe Gateway). Gateway weigert te starten tenzij dit `local` is.
- `port`: enkele gemultiplexte poort voor WS + HTTP. Voorrang: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (standaard), `lan` (`0.0.0.0`), `tailnet` (alleen Tailscale-IP), of `custom`.
- **Verouderde bind-aliassen**: gebruik bind-moduswaarden in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), geen hostaliassen (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-opmerking**: de standaard `loopback`-bind luistert op `127.0.0.1` binnen de container. Met Docker bridge-netwerken (`-p 18789:18789`) komt verkeer binnen op `eth0`, waardoor de Gateway onbereikbaar is. Gebruik `--network host`, of stel `bind: "lan"` in (of `bind: "custom"` met `customBindHost: "0.0.0.0"`) om op alle interfaces te luisteren.
- **Auth**: standaard vereist. Niet-loopback-binds vereisen Gateway-auth. In de praktijk betekent dit een gedeelde token/wachtwoord of een identiteitsbewuste reverse proxy met `gateway.auth.mode: "trusted-proxy"`. De onboardingwizard genereert standaard een token.
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd (inclusief SecretRefs), stel `gateway.auth.mode` dan expliciet in op `token` of `password`. Opstart- en service-installatie-/reparatiestromen mislukken wanneer beide zijn geconfigureerd en de modus niet is ingesteld.
- `gateway.auth.mode: "none"`: expliciete modus zonder auth. Gebruik alleen voor vertrouwde local loopback-configuraties; dit wordt bewust niet aangeboden door onboardingprompts.
- `gateway.auth.mode: "trusted-proxy"`: delegeer browser-/gebruikers-auth aan een identiteitsbewuste reverse proxy en vertrouw identiteitsheaders van `gateway.trustedProxies` (zie [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth)). Deze modus verwacht standaard een **niet-loopback** proxybron; reverse proxy's op dezelfde host via loopback vereisen expliciet `gateway.auth.trustedProxy.allowLoopback = true`. Interne aanroepers op dezelfde host kunnen `gateway.auth.password` gebruiken als lokale directe fallback; `gateway.auth.token` blijft wederzijds exclusief met de trusted-proxy-modus.
- `gateway.auth.allowTailscale`: wanneer `true`, kunnen identiteitsheaders van Tailscale Serve voldoen aan Control UI/WebSocket-auth (geverifieerd via `tailscale whois`). HTTP API-eindpunten gebruiken die Tailscale-header-auth **niet**; ze volgen in plaats daarvan de normale HTTP-authmodus van de Gateway. Deze tokenloze stroom gaat ervan uit dat de Gateway-host vertrouwd is. Standaard `true` wanneer `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: optionele limiter voor mislukte auth. Geldt per client-IP en per auth-scope (shared-secret en device-token worden afzonderlijk bijgehouden). Geblokkeerde pogingen retourneren `429` + `Retry-After`.
  - Op het asynchrone Tailscale Serve Control UI-pad worden mislukte pogingen voor dezelfde `{scope, clientIp}` geserialiseerd voordat de fout wordt weggeschreven. Gelijktijdige slechte pogingen van dezelfde client kunnen daardoor de limiter activeren bij de tweede aanvraag, in plaats van dat beide als gewone mismatches doorlopen.
  - `gateway.auth.rateLimit.exemptLoopback` is standaard `true`; stel in op `false` wanneer je bewust ook localhost-verkeer wilt rate-limiten (voor testconfiguraties of strikte proxy-implementaties).
- WS-authpogingen vanuit browser-origins worden altijd gethrottled met loopback-vrijstelling uitgeschakeld (verdediging in de diepte tegen browsergebaseerde localhost-bruteforce).
- Op loopback worden die lockouts vanuit browser-origins geïsoleerd per genormaliseerde `Origin`
  waarde, zodat herhaalde mislukkingen van één localhost-origin niet automatisch
  een andere origin buitensluiten.
- `tailscale.mode`: `serve` (alleen tailnet, loopback-bind) of `funnel` (publiek, vereist auth).
- `tailscale.preserveFunnel`: wanneer `true` en `tailscale.mode = "serve"`, controleert OpenClaw
  `tailscale funnel status` voordat Serve opnieuw wordt toegepast bij het opstarten, en slaat
  dit over als een extern geconfigureerde Funnel-route de Gateway-poort al dekt.
  Standaard `false`.
- `controlUi.allowedOrigins`: expliciete toegestane lijst voor browser-origins voor Gateway WebSocket-verbindingen. Vereist wanneer browserclients worden verwacht vanaf niet-loopback-origins.
- `controlUi.chatMessageMaxWidth`: optionele maximale breedte voor gegroepeerde Control UI-chatberichten. Accepteert begrensde CSS-breedtewaarden zoals `960px`, `82%`, `min(1280px, 82%)` en `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gevaarlijke modus die Host-header-originfallback inschakelt voor implementaties die bewust vertrouwen op Host-header-originbeleid.
- `remote.transport`: `ssh` (standaard) of `direct` (ws/wss). Voor `direct` moet `remote.url` `ws://` of `wss://` zijn.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: break-glass-override via client-side procesomgeving
  die plaintext `ws://` toestaat naar vertrouwde privé-netwerk-IP's; standaard blijft plaintext alleen loopback. Er is geen `openclaw.json`
  equivalent, en browserconfiguratie voor privé-netwerken zoals
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` heeft geen invloed op Gateway
  WebSocket-clients.
- `gateway.remote.token` / `.password` zijn credentialvelden voor externe clients. Ze configureren Gateway-auth niet op zichzelf.
- `gateway.push.apns.relay.baseUrl`: basis-HTTPS-URL voor de externe APNs-relay die wordt gebruikt door officiële/TestFlight-iOS-builds nadat ze relay-backed registraties naar de Gateway publiceren. Deze URL moet overeenkomen met de relay-URL die in de iOS-build is gecompileerd.
- `gateway.push.apns.relay.timeoutMs`: verzendtimeout van Gateway naar relay in milliseconden. Standaard `10000`.
- Relay-backed registraties worden gedelegeerd aan een specifieke Gateway-identiteit. De gekoppelde iOS-app haalt `gateway.identity.get` op, neemt die identiteit op in de relayregistratie en stuurt een registratiespecifieke verzendmachtiging door naar de Gateway. Een andere Gateway kan die opgeslagen registratie niet hergebruiken.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: tijdelijke omgevingsoverschrijvingen voor de relayconfiguratie hierboven.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ontsnappingsroute alleen voor ontwikkeling voor loopback-HTTP-relay-URL's. Productierelay-URL's moeten HTTPS blijven gebruiken.
- `gateway.handshakeTimeoutMs`: pre-auth Gateway WebSocket-handshaketimeout in milliseconden. Standaard: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` heeft voorrang wanneer ingesteld. Verhoog dit op belaste of low-powered hosts waar lokale clients kunnen verbinden terwijl de opstartopwarming nog bezig is.
- `gateway.channelHealthCheckMinutes`: interval voor de healthmonitor van kanalen in minuten. Stel `0` in om herstarts door de healthmonitor globaal uit te schakelen. Standaard: `5`.
- `gateway.channelStaleEventThresholdMinutes`: drempel voor stale sockets in minuten. Houd dit groter dan of gelijk aan `gateway.channelHealthCheckMinutes`. Standaard: `30`.
- `gateway.channelMaxRestartsPerHour`: maximaal aantal herstarts door de healthmonitor per kanaal/account in een rolling hour. Standaard: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per kanaal voor herstarts door de healthmonitor terwijl de globale monitor ingeschakeld blijft.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per account voor kanalen met meerdere accounts. Wanneer ingesteld, heeft dit voorrang op de override op kanaalniveau.
- Lokale Gateway-aanroeppaden kunnen `gateway.remote.*` alleen als fallback gebruiken wanneer `gateway.auth.*` niet is ingesteld.
- Als `gateway.auth.token` / `gateway.auth.password` expliciet is geconfigureerd via SecretRef en niet kan worden opgelost, faalt de oplossing gesloten (geen maskering door externe fallback).
- `trustedProxies`: IP's van reverse proxy's die TLS beëindigen of forwarded-client-headers injecteren. Vermeld alleen proxy's die je beheert. Loopback-items blijven geldig voor proxy-/lokale-detectieconfiguraties op dezelfde host (bijvoorbeeld Tailscale Serve of een lokale reverse proxy), maar ze maken loopback-aanvragen **niet** geschikt voor `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: wanneer `true`, accepteert de Gateway `X-Real-IP` als `X-Forwarded-For` ontbreekt. Standaard `false` voor fail-closed gedrag.
- `gateway.nodes.pairing.autoApproveCidrs`: optionele CIDR/IP-toegestane lijst voor het automatisch goedkeuren van eerste node-device-pairing zonder gevraagde scopes. Dit is uitgeschakeld wanneer niet ingesteld. Dit keurt operator-/browser-/Control UI-/WebChat-pairing niet automatisch goed, en keurt geen rol-, scope-, metadata- of public-key-upgrades automatisch goed.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globale allow/deny-vormgeving voor gedeclareerde node-commando's na pairing en platform-allowlist-evaluatie. Gebruik `allowCommands` om gevaarlijke node-commando's zoals `camera.snap`, `camera.clip` en `screen.record` expliciet toe te staan; `denyCommands` verwijdert een commando zelfs als een platformstandaard of expliciete allow het anders zou opnemen. Nadat een node zijn gedeclareerde commandolijst wijzigt, wijs die device-pairing af en keur deze opnieuw goed zodat de Gateway de bijgewerkte commandosnapshot opslaat.
- `gateway.tools.deny`: extra toolnamen die worden geblokkeerd voor HTTP `POST /tools/invoke` (breidt de standaard deny-lijst uit).
- `gateway.tools.allow`: verwijder toolnamen uit de standaard HTTP-deny-lijst.

</Accordion>

### OpenAI-compatibele eindpunten

- Chat Completions: standaard uitgeschakeld. Schakel in met `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Verharding voor URL-invoer van Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Lege allowlists worden behandeld als niet ingesteld; gebruik `gateway.http.endpoints.responses.files.allowUrl=false`
    en/of `gateway.http.endpoints.responses.images.allowUrl=false` om URL-ophalen uit te schakelen.
- Optionele header voor response-verharding:
  - `gateway.http.securityHeaders.strictTransportSecurity` (stel alleen in voor HTTPS-origins die je beheert; zie [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Multi-instance-isolatie

Voer meerdere Gateways uit op één host met unieke poorten en state dirs:

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

- `enabled`: schakelt TLS-terminatie in bij de Gateway-listener (HTTPS/WSS) (standaard: `false`).
- `autoGenerate`: genereert automatisch een lokaal self-signed cert/key-paar wanneer expliciete bestanden niet zijn geconfigureerd; alleen voor lokaal/dev-gebruik.
- `certPath`: bestandssysteempad naar het TLS-certificaatbestand.
- `keyPath`: bestandssysteempad naar het TLS-private-keybestand; houd permissies beperkt.
- `caPath`: optioneel CA-bundlepad voor clientverificatie of aangepaste trust chains.

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
  - `"restart"`: herstart altijd het Gateway-proces bij een configuratiewijziging.
  - `"hot"`: pas wijzigingen in-process toe zonder opnieuw te starten.
  - `"hybrid"` (standaard): probeer eerst hot reload; val terug op herstart als dat vereist is.
- `debounceMs`: debouncevenster in ms voordat configuratiewijzigingen worden toegepast (niet-negatief geheel getal).
- `deferralTimeoutMs`: optionele maximale tijd in ms om te wachten op lopende bewerkingen voordat een herstart of channel hot reload wordt geforceerd. Laat weg om de standaard begrensde wachttijd (`300000`) te gebruiken; stel `0` in om onbeperkt te wachten en periodiek waarschuwingen voor nog lopende bewerkingen te loggen.

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
Hooktokens in querystrings worden geweigerd.

Validatie- en veiligheidsnotities:

- `hooks.enabled=true` vereist een niet-lege `hooks.token`.
- `hooks.token` moet **verschillen** van `gateway.auth.token`; hergebruik van de Gateway-token wordt geweigerd.
- `hooks.path` kan niet `/` zijn; gebruik een toegewijd subpad zoals `/hooks`.
- Als `hooks.allowRequestSessionKey=true`, beperk dan `hooks.allowedSessionKeyPrefixes` (bijvoorbeeld `["hook:"]`).
- Als een mapping of preset een getemplate `sessionKey` gebruikt, stel dan `hooks.allowedSessionKeyPrefixes` en `hooks.allowRequestSessionKey=true` in. Statische mappingsleutels vereisen die opt-in niet.

**Eindpunten:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` uit de aanvraagpayload wordt alleen geaccepteerd wanneer `hooks.allowRequestSessionKey=true` (standaard: `false`).
- `POST /hooks/<name>` → opgelost via `hooks.mappings`
  - Door templates gerenderde mappingwaarden voor `sessionKey` worden behandeld als extern aangeleverd en vereisen ook `hooks.allowRequestSessionKey=true`.

<Accordion title="Mappingdetails">

- `match.path` matcht het subpad na `/hooks` (bijv. `/hooks/gmail` → `gmail`).
- `match.source` matcht een payloadveld voor generieke paden.
- Templates zoals `{{messages[0].subject}}` lezen uit de payload.
- `transform` kan verwijzen naar een JS/TS-module die een hookactie retourneert.
  - `transform.module` moet een relatief pad zijn en blijft binnen `hooks.transformsDir` (absolute paden en traversal worden geweigerd).
  - Houd `hooks.transformsDir` onder `~/.openclaw/hooks/transforms`; workspace-skillmappen worden geweigerd. Als `openclaw doctor` dit pad als ongeldig rapporteert, verplaats de transformmodule dan naar de transformmap voor hooks of verwijder `hooks.transformsDir`.
- `agentId` routeert naar een specifieke agent; onbekende ID's vallen terug op de standaardwaarde.
- `allowedAgentIds`: beperkt expliciete routering (`*` of weggelaten = alles toestaan, `[]` = alles weigeren).
- `defaultSessionKey`: optionele vaste sessiesleutel voor hook-agentruns zonder expliciete `sessionKey`.
- `allowRequestSessionKey`: sta aanroepers van `/hooks/agent` en templategestuurde mappingsessiesleutels toe om `sessionKey` in te stellen (standaard: `false`).
- `allowedSessionKeyPrefixes`: optionele allowlist met prefixen voor expliciete `sessionKey`-waarden (aanvraag + mapping), bijv. `["hook:"]`. Dit wordt vereist wanneer een mapping of preset een getemplate `sessionKey` gebruikt.
- `deliver: true` stuurt het uiteindelijke antwoord naar een kanaal; `channel` gebruikt standaard `last`.
- `model` overschrijft de LLM voor deze hookrun (moet toegestaan zijn als de modelcatalogus is ingesteld).

</Accordion>

### Gmail-integratie

- De ingebouwde Gmail-preset gebruikt `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Als je die routering per bericht behoudt, stel dan `hooks.allowRequestSessionKey: true` in en beperk `hooks.allowedSessionKeyPrefixes` zodat die overeenkomen met de Gmail-namespace, bijvoorbeeld `["hook:", "hook:gmail:"]`.
- Als je `hooks.allowRequestSessionKey: false` nodig hebt, overschrijf de preset dan met een statische `sessionKey` in plaats van de getemplate standaardwaarde.

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
- Voer geen afzonderlijke `gog gmail watch serve` uit naast de Gateway.

---

## Canvas-pluginhost

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
- Niet-loopback-binds: canvasroutes vereisen Gateway-authenticatie (token/wachtwoord/vertrouwde proxy), hetzelfde als andere Gateway HTTP-oppervlakken.
- Node WebViews sturen doorgaans geen auth-headers; nadat een node is gekoppeld en verbonden, adverteert de Gateway node-gescopete capability-URL's voor canvas-/A2UI-toegang.
- Capability-URL's zijn gebonden aan de actieve node-WS-sessie en verlopen snel. IP-gebaseerde fallback wordt niet gebruikt.
- Injecteert een live-reloadclient in geserveerde HTML.
- Maakt automatisch een starter-`index.html` aan wanneer leeg.
- Serveert ook A2UI op `/__openclaw__/a2ui/`.
- Wijzigingen vereisen een Gateway-herstart.
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

- `minimal` (standaard wanneer de gebundelde `bonjour`-plugin is ingeschakeld): laat `cliPath` + `sshPort` weg uit TXT-records.
- `full`: neem `cliPath` + `sshPort` op; LAN-multicastadvertising vereist nog steeds dat de gebundelde `bonjour`-plugin is ingeschakeld.
- `off`: onderdruk LAN-multicastadvertising zonder plugininschakeling te wijzigen.
- De gebundelde `bonjour`-plugin start automatisch op macOS-hosts en is opt-in op Linux, Windows en gecontaineriseerde Gateway-deployments.
- Hostnaam gebruikt standaard de systeemhostnaam wanneer die een geldig DNS-label is, met fallback naar `openclaw`. Overschrijf met `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Schrijft een unicast DNS-SD-zone onder `~/.openclaw/dns/`. Voor detectie tussen netwerken combineer je dit met een DNS-server (CoreDNS aanbevolen) + Tailscale split DNS.

Instellen: `openclaw dns setup --apply`.

---

## Omgeving

### `env` (inline env-vars)

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

- Inline env-vars worden alleen toegepast als de process-env de sleutel mist.
- `.env`-bestanden: CWD `.env` + `~/.openclaw/.env` (geen van beide overschrijft bestaande vars).
- `shellEnv`: importeert ontbrekende verwachte sleutels uit je login-shellprofiel.
- Zie [Omgeving](/nl/help/environment) voor de volledige prioriteitsvolgorde.

### Vervanging van env-vars

Verwijs naar env-vars in elke configuratiereeks met `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Alleen namen in hoofdletters worden gematcht: `[A-Z_][A-Z0-9_]*`.
- Ontbrekende/lege vars veroorzaken een fout bij het laden van de configuratie.
- Escape met `$${VAR}` voor een letterlijke `${VAR}`.
- Werkt met `$include`.

---

## Geheimen

Secret refs zijn additief: plattetekstwaarden blijven werken.

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
- `source: "exec"` ids mogen geen `.`- of `..`-padsegmenten bevatten die door slashes zijn gescheiden (bijvoorbeeld `a/../b` wordt geweigerd)

### Ondersteund credential-oppervlak

- Canonieke matrix: [SecretRef Credential Surface](/nl/reference/secretref-credential-surface)
- `secrets apply` richt zich op ondersteunde credential-paden in `openclaw.json`.
- `auth-profiles.json`-refs worden opgenomen in runtime-resolutie en auditdekking.

### Configuratie van secret providers

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

- De `file`-provider ondersteunt `mode: "json"` en `mode: "singleValue"` (`id` moet `"value"` zijn in singleValue-modus).
- Paden van file- en exec-providers falen gesloten wanneer Windows-ACL-verificatie niet beschikbaar is. Stel `allowInsecurePath: true` alleen in voor vertrouwde paden die niet kunnen worden geverifieerd.
- De `exec`-provider vereist een absoluut `command`-pad en gebruikt protocolpayloads op stdin/stdout.
- Standaard worden symlink-commandopaden geweigerd. Stel `allowSymlinkCommand: true` in om symlinkpaden toe te staan terwijl het opgeloste doelpad wordt gevalideerd.
- Als `trustedDirs` is geconfigureerd, wordt de trusted-dir-controle toegepast op het opgeloste doelpad.
- De child-omgeving van `exec` is standaard minimaal; geef vereiste variabelen expliciet door met `passEnv`.
- Secret refs worden tijdens activering opgelost naar een in-memory snapshot; daarna lezen aanvraagpaden alleen de snapshot.
- Active-surface-filtering wordt toegepast tijdens activering: onopgeloste refs op ingeschakelde oppervlakken laten opstarten/herladen mislukken, terwijl inactieve oppervlakken met diagnostiek worden overgeslagen.

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

- Per-agent-profielen worden opgeslagen op `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` ondersteunt refs op waardeniveau (`keyRef` voor `api_key`, `tokenRef` voor `token`) voor statische credential-modi.
- Legacy platte `auth-profiles.json`-maps zoals `{ "provider": { "apiKey": "..." } }` zijn geen runtime-indeling; `openclaw doctor --fix` herschrijft ze naar canonieke `provider:default` API-key-profielen met een `.legacy-flat.*.bak`-back-up.
- Profielen in OAuth-modus (`auth.profiles.<id>.mode = "oauth"`) ondersteunen geen door SecretRef ondersteunde auth-profile-credentials.
- Statische runtime-credentials komen uit in-memory opgeloste snapshots; legacy statische `auth.json`-vermeldingen worden opgeschoond wanneer ze worden gevonden.
- Legacy OAuth-imports komen uit `~/.openclaw/credentials/oauth.json`.
- Zie [OAuth](/nl/concepts/oauth).
- Runtimegedrag van geheimen en tooling voor `audit/configure/apply`: [Geheimenbeheer](/nl/gateway/secrets).

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

- `billingBackoffHours`: basis-backoff in uren wanneer een profiel faalt door echte
  facturerings-/onvoldoende-kredietfouten (standaard: `5`). Expliciete factureringstekst kan
  hier nog steeds terechtkomen, zelfs bij `401`/`403`-responses, maar providerspecifieke tekst-
  matchers blijven beperkt tot de provider die ze bezit (bijvoorbeeld OpenRouter
  `Key limit exceeded`). Retrybare HTTP `402`-berichten voor gebruiksvensters of
  bestedingslimieten voor organisatie/werkruimte blijven in plaats daarvan in het `rate_limit`-pad.
- `billingBackoffHoursByProvider`: optionele overrides per provider voor factureringsbackoff-uren.
- `billingMaxHours`: limiet in uren voor exponentiële groei van factureringsbackoff (standaard: `24`).
- `authPermanentBackoffMinutes`: basis-backoff in minuten voor `auth_permanent`-fouten met hoge betrouwbaarheid (standaard: `10`).
- `authPermanentMaxMinutes`: limiet in minuten voor `auth_permanent`-backoffgroei (standaard: `60`).
- `failureWindowHours`: rollend venster in uren dat wordt gebruikt voor backoff-tellers (standaard: `24`).
- `overloadedProfileRotations`: maximale auth-profielrotaties bij dezelfde provider voor overbelastingsfouten voordat wordt overgeschakeld naar model-fallback (standaard: `1`). Provider-bezet-vormen zoals `ModelNotReadyException` komen hier terecht.
- `overloadedBackoffMs`: vaste vertraging voordat een overbelaste provider/profielrotatie opnieuw wordt geprobeerd (standaard: `0`).
- `rateLimitedProfileRotations`: maximale auth-profielrotaties bij dezelfde provider voor rate-limit-fouten voordat wordt overgeschakeld naar model-fallback (standaard: `1`). Die rate-limit-bucket omvat providergevormde tekst zoals `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` en `resource exhausted`.

---

## Logregistratie

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
- `consoleLevel` wordt verhoogd naar `debug` bij `--verbose`.
- `maxFileBytes`: maximale actieve logbestandsgrootte in bytes vóór rotatie (positief geheel getal; standaard: `104857600` = 100 MB). OpenClaw bewaart maximaal vijf genummerde archieven naast het actieve bestand.
- `redactSensitive` / `redactPatterns`: best-effort maskering voor console-uitvoer, bestandslogs, OTLP-logrecords en blijvend opgeslagen sessietranscripttekst. `redactSensitive: "off"` schakelt alleen dit algemene log-/transcriptbeleid uit; UI-/tool-/diagnostische veiligheidsoppervlakken redigeren nog steeds geheimen vóór uitstoot.

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
- `stuckSessionWarnMs`: drempel voor leeftijd zonder voortgang in ms om langlopende verwerkende sessies te classificeren als `session.long_running`, `session.stalled` of `session.stuck`. Antwoord-, tool-, status-, blok- en ACP-voortgang resetten de timer; herhaalde `session.stuck`-diagnostiek past backoff toe zolang er niets verandert.
- `stuckSessionAbortMs`: drempel voor leeftijd zonder voortgang in ms voordat geschikt vastgelopen actief werk abort-drained mag worden voor herstel. Wanneer dit niet is ingesteld, gebruikt OpenClaw het veiligere uitgebreide venster voor ingebedde runs van minimaal 10 minuten en 5x `stuckSessionWarnMs`.
- `otel.enabled`: schakelt de OpenTelemetry-exportpipeline in (standaard: `false`). Zie [OpenTelemetry-export](/nl/gateway/opentelemetry) voor de volledige configuratie, signaalcatalogus en het privacymodel.
- `otel.endpoint`: collector-URL voor OTel-export.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: optionele signaalspecifieke OTLP-eindpunten. Wanneer ingesteld, overschrijven ze `otel.endpoint` alleen voor dat signaal.
- `otel.protocol`: `"http/protobuf"` (standaard) of `"grpc"`.
- `otel.headers`: extra HTTP/gRPC-metadataheaders die met OTel-exportrequests worden verzonden.
- `otel.serviceName`: servicenaam voor resource-attributen.
- `otel.traces` / `otel.metrics` / `otel.logs`: schakel trace-, metrics- of logexport in.
- `otel.sampleRate`: trace-samplingrate `0`-`1`.
- `otel.flushIntervalMs`: periodiek telemetry-flushinterval in ms.
- `otel.captureContent`: opt-in vastlegging van ruwe content voor OTEL-spanattributen. Standaard uit. Booleaanse waarde `true` legt niet-systeem-bericht-/toolcontent vast; met de objectvorm kun je `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` en `systemPrompt` expliciet inschakelen.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: omgevingsschakelaar voor nieuwste experimentele GenAI-spanproviderattributen. Standaard behouden spans het legacy `gen_ai.system`-attribuut voor compatibiliteit; GenAI-metrics gebruiken begrensde semantische attributen.
- `OPENCLAW_OTEL_PRELOADED=1`: omgevingsschakelaar voor hosts die al een globale OpenTelemetry-SDK hebben geregistreerd. OpenClaw slaat dan het starten/afsluiten van de Plugin-eigen SDK over terwijl diagnostische listeners actief blijven.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` en `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: signaalspecifieke eindpunt-env-vars die worden gebruikt wanneer de overeenkomende configuratiesleutel niet is ingesteld.
- `cacheTrace.enabled`: log cachetrace-snapshots voor ingebedde runs (standaard: `false`).
- `cacheTrace.filePath`: uitvoerpad voor cachetrace-JSONL (standaard: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: bepalen wat wordt opgenomen in cachetrace-uitvoer (allemaal standaard: `true`).

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
- `checkOnStart`: controleer op npm-updates wanneer de Gateway start (standaard: `true`).
- `auto.enabled`: schakel automatische updates op de achtergrond in voor pakketinstallaties (standaard: `false`).
- `auto.stableDelayHours`: minimale vertraging in uren voordat automatische toepassing op het stabiele kanaal plaatsvindt (standaard: `6`; max: `168`).
- `auto.stableJitterHours`: extra uitrolspreidingsvenster in uren voor het stabiele kanaal (standaard: `12`; max: `168`).
- `auto.betaCheckIntervalHours`: hoe vaak controles voor het bètakanaal worden uitgevoerd in uren (standaard: `1`; max: `24`).

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

- `enabled`: globale ACP-featuregate (standaard: `true`; stel in op `false` om ACP-dispatch- en spawnmogelijkheden te verbergen).
- `dispatch.enabled`: onafhankelijke gate voor ACP-sessieturndispatch (standaard: `true`). Stel in op `false` om ACP-commando's beschikbaar te houden terwijl uitvoering wordt geblokkeerd.
- `backend`: standaard ACP-runtimebackend-id (moet overeenkomen met een geregistreerde ACP-runtime-Plugin).
  Installeer eerst de backend-Plugin en, als `plugins.allow` is ingesteld, neem de backend-Plugin-id op (bijvoorbeeld `acpx`) anders wordt de ACP-backend niet geladen.
- `defaultAgent`: fallback ACP-doelagent-id wanneer spawns geen expliciet doel specificeren.
- `allowedAgents`: allowlist van agent-id's die zijn toegestaan voor ACP-runtimesessies; leeg betekent geen aanvullende beperking.
- `maxConcurrentSessions`: maximaal aantal gelijktijdig actieve ACP-sessies.
- `stream.coalesceIdleMs`: idle-flushvenster in ms voor gestreamde tekst.
- `stream.maxChunkChars`: maximale chunkgrootte voordat de projectie van gestreamde blokken wordt gesplitst.
- `stream.repeatSuppression`: onderdruk herhaalde status-/toolregels per turn (standaard: `true`).
- `stream.deliveryMode`: `"live"` streamt incrementeel; `"final_only"` buffert tot terminale events van de turn.
- `stream.hiddenBoundarySeparator`: scheidingsteken vóór zichtbare tekst na verborgen tool-events (standaard: `"paragraph"`).
- `stream.maxOutputChars`: maximum aantal assistant-uitvoertekens geprojecteerd per ACP-turn.
- `stream.maxSessionUpdateChars`: maximum aantal tekens voor geprojecteerde ACP-status-/updateregels.
- `stream.tagVisibility`: record van tagnamen naar booleaanse zichtbaarheids-overrides voor gestreamde events.
- `runtime.ttlMinutes`: idle TTL in minuten voor ACP-sessieworkers voordat ze in aanmerking komen voor opschoning.
- `runtime.installCommand`: optioneel installatiecommando dat wordt uitgevoerd bij het bootstrappen van een ACP-runtimeomgeving.

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

- `cli.banner.taglineMode` beheert de stijl van de bannerslogan:
  - `"random"` (standaard): roterende grappige/seizoensgebonden slogans.
  - `"default"`: vaste neutrale slogan (`All your chats, one OpenClaw.`).
  - `"off"`: geen slogantekst (bannertitel/-versie blijft zichtbaar).
- Stel env `OPENCLAW_HIDE_BANNER=1` in om de volledige banner te verbergen (niet alleen slogans).

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

Zie `agents.list`-identiteitsvelden onder [Agent-standaarden](/nl/gateway/config-agents#agent-defaults).

---

## Bridge (legacy, verwijderd)

Huidige builds bevatten de TCP-bridge niet meer. Nodes verbinden via de Gateway WebSocket. `bridge.*`-sleutels maken geen deel meer uit van het configuratieschema (validatie faalt totdat ze zijn verwijderd; `openclaw doctor --fix` kan onbekende sleutels verwijderen).

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

- `sessionRetention`: hoelang voltooide geïsoleerde Cron-uitvoeringssessies worden bewaard voordat ze uit `sessions.json` worden verwijderd. Bepaalt ook het opschonen van gearchiveerde verwijderde Cron-transcripties. Standaard: `24h`; stel in op `false` om uit te schakelen.
- `runLog.maxBytes`: maximale grootte per uitvoeringslogbestand (`cron/runs/<jobId>.jsonl`) voordat er wordt opgeschoond. Standaard: `2_000_000` bytes.
- `runLog.keepLines`: nieuwste regels die worden behouden wanneer opschoning van het uitvoeringslog wordt geactiveerd. Standaard: `2000`.
- `webhookToken`: bearer-token gebruikt voor aflevering van Cron-Webhook-POST (`delivery.mode = "webhook"`); als dit wordt weggelaten, wordt er geen auth-header verzonden.
- `webhook`: verouderde oude fallback-Webhook-URL (http/https), alleen gebruikt voor opgeslagen taken die nog steeds `notify: true` hebben.

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

Geldt alleen voor eenmalige Cron-taken. Terugkerende taken gebruiken aparte foutafhandeling.

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

- `enabled`: schakel foutmeldingen voor Cron-taken in (standaard: `false`).
- `after`: opeenvolgende fouten voordat een melding wordt geactiveerd (positief geheel getal, min: `1`).
- `cooldownMs`: minimumaantal milliseconden tussen herhaalde meldingen voor dezelfde taak (niet-negatief geheel getal).
- `includeSkipped`: tel opeenvolgende overgeslagen uitvoeringen mee voor de meldingsdrempel (standaard: `false`). Overgeslagen uitvoeringen worden apart bijgehouden en hebben geen invloed op backoff voor uitvoeringsfouten.
- `mode`: aflevermodus - `"announce"` verzendt via een kanaalbericht; `"webhook"` post naar de geconfigureerde Webhook.
- `accountId`: optionele account- of kanaal-id om de aflevering van meldingen af te bakenen.

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

- Standaardbestemming voor Cron-foutmeldingen voor alle taken.
- `mode`: `"announce"` of `"webhook"`; standaard `"announce"` wanneer er voldoende doelgegevens bestaan.
- `channel`: kanaaloverschrijving voor aflevering via announce. `"last"` hergebruikt het laatst bekende afleverkanaal.
- `to`: expliciet announce-doel of Webhook-URL. Vereist voor Webhook-modus.
- `accountId`: optionele accountoverschrijving voor aflevering.
- Per-taak `delivery.failureDestination` overschrijft deze globale standaard.
- Wanneer er geen globale of per-taak foutbestemming is ingesteld, vallen taken die al via `announce` afleveren bij een fout terug op dat primaire announce-doel.
- `delivery.failureDestination` wordt alleen ondersteund voor taken met `sessionTarget="isolated"`, tenzij de primaire `delivery.mode` van de taak `"webhook"` is.

Zie [Cron-taken](/nl/automation/cron-jobs). Geïsoleerde Cron-uitvoeringen worden bijgehouden als [achtergrondtaken](/nl/automation/tasks).

---

## Sjabloonvariabelen voor mediamodel

Sjabloonplaatsaanduidingen die worden uitgebreid in `tools.media.models[].args`:

| Variabele          | Beschrijving                                      |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Volledige binnenkomende berichttekst              |
| `{{RawBody}}`      | Ruwe tekst (geen geschiedenis-/afzenderwrappers)  |
| `{{BodyStripped}}` | Tekst waaruit groepsvermeldingen zijn verwijderd  |
| `{{From}}`         | Afzender-ID                                       |
| `{{To}}`           | Bestemmings-ID                                    |
| `{{MessageSid}}`   | Kanaalbericht-id                                  |
| `{{SessionId}}`    | Huidige sessie-UUID                               |
| `{{IsNewSession}}` | `"true"` wanneer een nieuwe sessie is aangemaakt  |
| `{{MediaUrl}}`     | Binnenkomende media-pseudo-URL                    |
| `{{MediaPath}}`    | Lokaal mediapad                                   |
| `{{MediaType}}`    | Mediatype (afbeelding/audio/document/…)           |
| `{{Transcript}}`   | Audiotranscriptie                                 |
| `{{Prompt}}`       | Opgeloste mediaprompt voor CLI-items              |
| `{{MaxChars}}`     | Opgelost maximumaantal uitvoertekens voor CLI-items |
| `{{ChatType}}`     | `"direct"` of `"group"`                           |
| `{{GroupSubject}}` | Groepsonderwerp (naar beste vermogen)             |
| `{{GroupMembers}}` | Voorbeeldweergave van groepsleden (naar beste vermogen) |
| `{{SenderName}}`   | Weergavenaam van afzender (naar beste vermogen)   |
| `{{SenderE164}}`   | Telefoonnummer van afzender (naar beste vermogen) |
| `{{Provider}}`     | Providerhint (whatsapp, telegram, discord, enz.)  |

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

**Samenvoeggedrag:**

- Enkel bestand: vervangt het bevattende object.
- Array met bestanden: diep samengevoegd op volgorde (later overschrijft eerder).
- Sibling-sleutels: samengevoegd na includes (overschrijven opgenomen waarden).
- Geneste includes: tot 10 niveaus diep.
- Paden: opgelost relatief aan het includende bestand, maar moeten binnen de hoogste configuratiemap blijven (`dirname` van `openclaw.json`). Absolute/`../`-vormen zijn alleen toegestaan wanneer ze nog steeds binnen die grens worden opgelost.
- Door OpenClaw beheerde schrijfacties die slechts één topniveausectie wijzigen die wordt ondersteund door een include met één bestand, schrijven door naar dat opgenomen bestand. Bijvoorbeeld: `plugins install` werkt `plugins: { $include: "./plugins.json5" }` bij in `plugins.json5` en laat `openclaw.json` intact.
- Root-includes, include-arrays en includes met sibling-overschrijvingen zijn alleen-lezen voor door OpenClaw beheerde schrijfacties; die schrijfacties falen gesloten in plaats van de configuratie vlak te maken.
- Fouten: duidelijke berichten voor ontbrekende bestanden, parseerfouten en circulaire includes.

---

_Gerelateerd: [Configuratie](/nl/gateway/configuration) · [Configuratievoorbeelden](/nl/gateway/configuration-examples) · [Doctor](/nl/gateway/doctor)_

## Gerelateerd

- [Configuratie](/nl/gateway/configuration)
- [Configuratievoorbeelden](/nl/gateway/configuration-examples)
