---
read_when:
    - Je hebt exacte configuratiesemantiek of standaardwaarden op veldniveau nodig
    - Je valideert configuratieblokken voor kanaal, model, Gateway of hulpmiddel
summary: Gateway-configuratiereferentie voor kernsleutels, standaardwaarden en links naar specifieke subsystemreferenties van OpenClaw
title: Configuratiereferentie
x-i18n:
    generated_at: "2026-05-02T22:19:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2963e01c73d1d3dbd218d76d0c0709f58f8b92e4b3d4606105cedd91571b5ed
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Kernconfiguratiereferentie voor `~/.openclaw/openclaw.json`. Zie [Configuratie](/nl/gateway/configuration) voor een taakgericht overzicht.

Behandelt de belangrijkste OpenClaw-configuratieoppervlakken en linkt door wanneer een subsysteem een eigen diepgaandere referentie heeft. Kanaal- en plugin-beheerde opdrachtcatalogi en diepe memory/QMD-instellingen staan op hun eigen pagina's in plaats van op deze.

Codewaarheid:

- `openclaw config schema` print het live JSON Schema dat wordt gebruikt voor validatie en Control UI, met gebundelde/plugin/kanaalmetadata samengevoegd wanneer beschikbaar
- `config.schema.lookup` retourneert één padgebonden schemaknooppunt voor drill-down tooling
- `pnpm config:docs:check` / `pnpm config:docs:gen` valideren de baseline-hash van de config-documentatie tegen het huidige schemaoppervlak

Agent-opzoekpad: gebruik de `gateway`-toolactie `config.schema.lookup` voor
exacte veldniveau-documentatie en beperkingen vóór bewerkingen. Gebruik
[Configuratie](/nl/gateway/configuration) voor taakgerichte richtlijnen en deze pagina
voor de bredere veldkaart, standaardwaarden en links naar subsysteemreferenties.

Specifieke diepe referenties:

- [Memory-configuratiereferentie](/nl/reference/memory-config) voor `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` en Dreaming-configuratie onder `plugins.entries.memory-core.config.dreaming`
- [Slash-opdrachten](/nl/tools/slash-commands) voor de huidige ingebouwde + gebundelde opdrachtcatalogus
- beherende kanaal-/pluginpagina's voor kanaalspecifieke opdrachtoppervlakken

Het configuratieformaat is **JSON5** (opmerkingen + afsluitende komma's toegestaan). Alle velden zijn optioneel — OpenClaw gebruikt veilige standaardwaarden wanneer ze worden weggelaten.

---

## Kanalen

Configuratiesleutels per kanaal zijn verplaatst naar een speciale pagina — zie
[Configuratie — kanalen](/nl/gateway/config-channels) voor `channels.*`,
inclusief Slack, Discord, Telegram, WhatsApp, Matrix, iMessage en andere
gebundelde kanalen (authenticatie, toegangscontrole, meerdere accounts, mention gating).

## Agentstandaardwaarden, multi-agent, sessies en berichten

Verplaatst naar een speciale pagina — zie
[Configuratie — agents](/nl/gateway/config-agents) voor:

- `agents.defaults.*` (workspace, model, denken, Heartbeat, memory, media, Skills, sandbox)
- `multiAgent.*` (multi-agent-routering en bindings)
- `session.*` (sessielevenscyclus, Compaction, pruning)
- `messages.*` (berichtbezorging, TTS, markdown-rendering)
- `talk.*` (Talk-modus)
  - `talk.speechLocale`: optionele BCP 47-locale-id voor Talk-spraakherkenning op iOS/macOS
  - `talk.silenceTimeoutMs`: wanneer niet ingesteld, behoudt Talk het platformstandaard pauzevenster voordat het transcript wordt verzonden (`700 ms on macOS and Android, 900 ms on iOS`)

## Tools en aangepaste providers

Toolbeleid, experimentele toggles, provider-backed toolconfiguratie en aangepaste
provider-/base-URL-instellingen zijn verplaatst naar een speciale pagina — zie
[Configuratie — tools en aangepaste providers](/nl/gateway/config-tools).

## Modellen

Providerdefinities, model-allowlists en aangepaste providerinstellingen staan in
[Configuratie — tools en aangepaste providers](/nl/gateway/config-tools#custom-providers-and-base-urls).
De root `models` beheert ook globaal modelcatalogusgedrag.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: providercatalogusgedrag (`merge` of `replace`).
- `models.providers`: aangepaste providermap, gesleuteld op provider-id.
- `models.pricing.enabled`: regelt de pricing-bootstrap op de achtergrond die
  start nadat sidecars en kanalen het Gateway-ready-pad bereiken. Wanneer `false`,
  slaat de Gateway het ophalen van OpenRouter- en LiteLLM-pricingcatalogi over; geconfigureerde
  `models.providers.*.models[].cost`-waarden blijven werken voor lokale kostenschattingen.

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

- `mcp.servers`: benoemde stdio- of externe MCP-serverdefinities voor runtimes die
  geconfigureerde MCP-tools beschikbaar maken.
  Externe items gebruiken `transport: "streamable-http"` of `transport: "sse"`;
  `type: "http"` is een CLI-native alias die `openclaw mcp set` en
  `openclaw doctor --fix` normaliseren naar het canonieke veld `transport`.
- `mcp.sessionIdleTtlMs`: idle-TTL voor sessiegebonden gebundelde MCP-runtimes.
  Eenmalige embedded runs vragen cleanup aan het einde van de run; deze TTL is de backstop voor
  langlevende sessies en toekomstige callers.
- Wijzigingen onder `mcp.*` worden hot-applied door gecachete sessie-MCP-runtimes op te ruimen.
  De volgende tooldiscovery/het volgende toolgebruik maakt ze opnieuw aan op basis van de nieuwe configuratie, zodat verwijderde
  `mcp.servers`-items onmiddellijk worden opgeschoond in plaats van te wachten op idle-TTL.

Zie [MCP](/nl/cli/mcp#openclaw-as-an-mcp-client-registry) en
[CLI-backends](/nl/gateway/cli-backends#bundle-mcp-overlays) voor runtimegedrag.

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

- `allowBundled`: optionele allowlist alleen voor gebundelde Skills (beheerde/workspace-Skills blijven onaangetast).
- `load.extraDirs`: extra gedeelde Skill-roots (laagste prioriteit).
- `install.preferBrew`: wanneer true, geef de voorkeur aan Homebrew-installers wanneer `brew`
  beschikbaar is voordat wordt teruggevallen op andere installertypen.
- `install.nodeManager`: voorkeur voor Node-installer voor `metadata.openclaw.install`
  specs (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` schakelt een Skill uit, zelfs als deze gebundeld/geïnstalleerd is.
- `entries.<skillKey>.apiKey`: gemak voor Skills die een primaire env-var declareren (plaintext-string of SecretRef-object).

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

- Geladen vanuit `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, plus `plugins.load.paths`.
- Discovery accepteert native OpenClaw-plugins plus compatibele Codex-bundles en Claude-bundles, inclusief manifestloze Claude default-layout-bundles.
- **Configuratiewijzigingen vereisen een Gateway-herstart.**
- `allow`: optionele allowlist (alleen vermelde plugins worden geladen). `deny` wint.
- `plugins.entries.<id>.apiKey`: gemakveld voor API-sleutel op pluginniveau (wanneer ondersteund door de plugin).
- `plugins.entries.<id>.env`: plugin-scoped env-var-map.
- `plugins.entries.<id>.hooks.allowPromptInjection`: wanneer `false`, blokkeert core `before_prompt_build` en negeert prompt-mutating velden van legacy `before_agent_start`, terwijl legacy `modelOverride` en `providerOverride` behouden blijven. Geldt voor native plugin-hooks en ondersteunde door bundles geleverde hookdirectories.
- `plugins.entries.<id>.hooks.allowConversationAccess`: wanneer `true`, mogen vertrouwde niet-gebundelde plugins ruwe gespreksinhoud lezen uit getypeerde hooks zoals `llm_input`, `llm_output`, `before_agent_finalize` en `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: vertrouw deze plugin expliciet om per-run `provider`- en `model`-overrides aan te vragen voor achtergrond-subagent-runs.
- `plugins.entries.<id>.subagent.allowedModels`: optionele allowlist van canonieke `provider/model`-doelen voor vertrouwde subagent-overrides. Gebruik `"*"` alleen wanneer je bewust elk model wilt toestaan.
- `plugins.entries.<id>.config`: door de plugin gedefinieerd configuratieobject (gevalideerd door native OpenClaw-plugin-schema wanneer beschikbaar).
- Account-/runtime-instellingen voor kanaalplugins staan onder `channels.<id>` en moeten worden beschreven door de manifestmetadata `channelConfigs` van de beherende plugin, niet door een centraal OpenClaw-optieregister.
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch-providerinstellingen.
  - `apiKey`: Firecrawl-API-sleutel (accepteert SecretRef). Valt terug op `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey` of env-var `FIRECRAWL_API_KEY`.
  - `baseUrl`: Firecrawl API base-URL (standaard: `https://api.firecrawl.dev`; self-hosted overrides moeten private/interne endpoints targeten).
  - `onlyMainContent`: extraheer alleen de hoofdinhoud van pagina's (standaard: `true`).
  - `maxAgeMs`: maximale cacheleeftijd in milliseconden (standaard: `172800000` / 2 dagen).
  - `timeoutSeconds`: time-out voor scrape-aanvragen in seconden (standaard: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search-instellingen (Grok-webzoekopdracht).
  - `enabled`: schakel de X Search-provider in.
  - `model`: Grok-model om te gebruiken voor zoeken (bijv. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: memory-Dreaming-instellingen. Zie [Dreaming](/nl/concepts/dreaming) voor fasen en drempels.
  - `enabled`: hoofdschakelaar voor Dreaming (standaard `false`).
  - `frequency`: Cron-cadans voor elke volledige Dreaming-sweep (`"0 3 * * *"` standaard).
  - `model`: optionele Dream Diary-subagent-modeloverride. Vereist `plugins.entries.memory-core.subagent.allowModelOverride: true`; combineer met `allowedModels` om doelen te beperken. Model-unavailable-fouten proberen één keer opnieuw met het standaardmodel van de sessie; vertrouwens- of allowlist-fouten vallen niet stilzwijgend terug.
  - fasebeleid en drempels zijn implementatiedetails (geen gebruikersgerichte configuratiesleutels).
- Volledige memory-configuratie staat in [Memory-configuratiereferentie](/nl/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Ingeschakelde Claude-bundle-plugins kunnen ook embedded Pi-standaardwaarden bijdragen vanuit `settings.json`; OpenClaw past die toe als opgeschoonde agentinstellingen, niet als ruwe OpenClaw-configuratiepatches.
- `plugins.slots.memory`: kies de actieve memory-plugin-id, of `"none"` om memory-plugins uit te schakelen.
- `plugins.slots.contextEngine`: kies de actieve context-engine-plugin-id; standaard `"legacy"` tenzij je een andere engine installeert en selecteert.

Zie [Plugins](/nl/tools/plugin).

---

## Commitments

`commitments` regelt afgeleide follow-up-memory: OpenClaw kan check-ins uit gespreksbeurten detecteren en die leveren via Heartbeat-runs.

- `commitments.enabled`: schakel verborgen LLM-extractie, opslag en Heartbeat-levering in voor afgeleide follow-up-commitments. Standaard: `false`.
- `commitments.maxPerDay`: maximum aantal afgeleide follow-up-commitments dat per agentsessie in een rollende dag wordt geleverd. Standaard: `3`.

Zie [Afgeleide commitments](/nl/concepts/commitments).

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
- `tabCleanup` wint bijgehouden tabbladen van de primaire agent terug na inactiviteit of wanneer een sessie de limiet overschrijdt. Stel `idleMinutes: 0` of `maxTabsPerSession: 0` in om die afzonderlijke opschoonmodi uit te schakelen.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` is uitgeschakeld wanneer dit niet is ingesteld, zodat browsernavigatie standaard strikt blijft.
- Stel `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` alleen in wanneer je browsernavigatie via het privénetwerk bewust vertrouwt.
- In strikte modus vallen externe CDP-profieleindpunten (`profiles.*.cdpUrl`) onder dezelfde privénetwerkblokkering tijdens bereikbaarheids- en detectiecontroles.
- `ssrfPolicy.allowPrivateNetwork` blijft ondersteund als verouderde alias.
- Gebruik in strikte modus `ssrfPolicy.hostnameAllowlist` en `ssrfPolicy.allowedHostnames` voor expliciete uitzonderingen.
- Externe profielen zijn alleen voor koppelen (starten/stoppen/resetten uitgeschakeld).
- `profiles.*.cdpUrl` accepteert `http://`, `https://`, `ws://` en `wss://`.
  Gebruik HTTP(S) wanneer je wilt dat OpenClaw `/json/version` ontdekt; gebruik WS(S)
  wanneer je provider je een directe DevTools WebSocket-URL geeft.
- `remoteCdpTimeoutMs` en `remoteCdpHandshakeTimeoutMs` gelden voor externe en
  `attachOnly` CDP-bereikbaarheid plus aanvragen voor het openen van tabbladen. Beheerde local loopback-
  profielen behouden lokale CDP-standaardwaarden.
- Als een extern beheerde CDP-service bereikbaar is via local loopback, stel dan voor dat
  profiel `attachOnly: true` in; anders behandelt OpenClaw de local loopback-poort als een
  lokaal beheerd browserprofiel en kan het lokale poorteigenaarschapsfouten melden.
- `existing-session`-profielen gebruiken Chrome MCP in plaats van CDP en kunnen koppelen op
  de geselecteerde host of via een verbonden browsernode.
- `existing-session`-profielen kunnen `userDataDir` instellen om een specifiek
  Chromium-gebaseerd browserprofiel te kiezen, zoals Brave of Edge.
- `existing-session`-profielen behouden de huidige Chrome MCP-routelimieten:
  snapshot-/ref-gestuurde acties in plaats van targeting met CSS-selectors, uploadhooks voor één bestand,
  geen overschrijvingen voor dialoogtime-outs, geen `wait --load networkidle` en geen
  `responsebody`, PDF-export, downloadinterceptie of batchacties.
- Lokaal beheerde `openclaw`-profielen wijzen `cdpPort` en `cdpUrl` automatisch toe; stel
  `cdpUrl` alleen expliciet in voor externe CDP.
- Lokaal beheerde profielen kunnen `executablePath` instellen om de globale
  `browser.executablePath` voor dat profiel te overschrijven. Gebruik dit om één profiel in
  Chrome en een ander in Brave uit te voeren.
- Lokaal beheerde profielen gebruiken `browser.localLaunchTimeoutMs` voor Chrome CDP HTTP-
  detectie na processtart en `browser.localCdpReadyTimeoutMs` voor
  CDP-websocketgereedheid na het starten. Verhoog deze op tragere hosts waar Chrome
  succesvol start maar gereedheidscontroles met het opstarten concurreren. Beide waarden moeten
  positieve gehele getallen tot `120000` ms zijn; ongeldige configuratiewaarden worden geweigerd.
- Automatische detectievolgorde: standaardbrowser indien Chromium-gebaseerd → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` en `browser.profiles.<name>.executablePath` accepteren beide
  `~` en `~/...` voor de thuismap van je OS vóór het starten van Chromium.
  Per-profiel `userDataDir` op `existing-session`-profielen wordt ook met tilde uitgebreid.
- Besturingsservice: alleen local loopback (poort afgeleid van `gateway.port`, standaard `18791`).
- `extraArgs` voegt extra startvlaggen toe aan lokale Chromium-start (bijvoorbeeld
  `--disable-gpu`, venstergrootte of debugvlaggen).

---

## Gebruikersinterface

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

- `seamColor`: accentkleur voor chrome van de native app-gebruikersinterface (tint van de Talk Mode-bubbel, enz.).
- `assistant`: identiteitsoverschrijving voor de Control UI. Valt terug op de identiteit van de actieve agent.

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

- `mode`: `local` (Gateway uitvoeren) of `remote` (verbinden met externe Gateway). Gateway weigert te starten tenzij dit `local` is.
- `port`: enkele gemultiplexte poort voor WS + HTTP. Voorrang: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (standaard), `lan` (`0.0.0.0`), `tailnet` (alleen Tailscale-IP) of `custom`.
- **Verouderde bind-aliassen**: gebruik bindmoduswaarden in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), geen hostaliassen (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-opmerking**: de standaard `loopback`-bind luistert op `127.0.0.1` binnen de container. Met Docker bridge-netwerken (`-p 18789:18789`) komt verkeer binnen op `eth0`, waardoor de Gateway onbereikbaar is. Gebruik `--network host`, of stel `bind: "lan"` in (of `bind: "custom"` met `customBindHost: "0.0.0.0"`) om op alle interfaces te luisteren.
- **Auth**: standaard vereist. Niet-loopback-binds vereisen Gateway-auth. In de praktijk betekent dit een gedeeld token/wachtwoord of een identity-aware reverse proxy met `gateway.auth.mode: "trusted-proxy"`. De onboardingwizard genereert standaard een token.
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd (inclusief SecretRefs), stel `gateway.auth.mode` dan expliciet in op `token` of `password`. Opstart- en service-installatie-/reparatiestromen mislukken wanneer beide zijn geconfigureerd en mode niet is ingesteld.
- `gateway.auth.mode: "none"`: expliciete modus zonder auth. Gebruik dit alleen voor vertrouwde local loopback-setups; dit wordt bewust niet aangeboden door onboardingprompts.
- `gateway.auth.mode: "trusted-proxy"`: delegeer browser-/gebruikersauth aan een identity-aware reverse proxy en vertrouw identiteitsheaders van `gateway.trustedProxies` (zie [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth)). Deze modus verwacht standaard een **niet-loopback** proxybron; same-host loopback reverse proxies vereisen expliciet `gateway.auth.trustedProxy.allowLoopback = true`. Interne same-host aanroepers kunnen `gateway.auth.password` gebruiken als lokale directe fallback; `gateway.auth.token` blijft wederzijds exclusief met trusted-proxy-modus.
- `gateway.auth.allowTailscale`: wanneer `true`, kunnen Tailscale Serve-identiteitsheaders voldoen aan Control UI/WebSocket-auth (geverifieerd via `tailscale whois`). HTTP API-endpoints gebruiken die Tailscale-headerauth **niet**; ze volgen in plaats daarvan de normale HTTP-authmodus van de Gateway. Deze tokenloze stroom gaat ervan uit dat de Gateway-host vertrouwd is. Staat standaard op `true` wanneer `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: optionele limiter voor mislukte auth. Geldt per client-IP en per authscope (shared-secret en device-token worden onafhankelijk bijgehouden). Geblokkeerde pogingen retourneren `429` + `Retry-After`.
  - Op het async Tailscale Serve Control UI-pad worden mislukte pogingen voor dezelfde `{scope, clientIp}` geserialiseerd voordat de fout wordt geschreven. Gelijktijdige slechte pogingen vanaf dezelfde client kunnen de limiter daardoor bij de tweede aanvraag activeren in plaats van beide als gewone mismatches te laten doorlopen.
  - `gateway.auth.rateLimit.exemptLoopback` staat standaard op `true`; stel dit in op `false` wanneer je bewust ook localhost-verkeer wilt rate-limiten (voor testsetups of strikte proxydeployments).
- Browser-origin WS-authpogingen worden altijd gethrottled met loopback-vrijstelling uitgeschakeld (defense-in-depth tegen browsergebaseerde localhost-bruteforce).
- Op loopback zijn die browser-origin-lockouts geïsoleerd per genormaliseerde `Origin`-waarde, zodat herhaalde fouten vanaf één localhost-origin niet automatisch een andere origin buitensluiten.
- `tailscale.mode`: `serve` (alleen tailnet, loopback-bind) of `funnel` (publiek, vereist auth).
- `controlUi.allowedOrigins`: expliciete allowlist voor browser-origins voor Gateway WebSocket-verbindingen. Vereist wanneer browserclients worden verwacht vanaf niet-loopback-origins.
- `controlUi.chatMessageMaxWidth`: optionele maximale breedte voor gegroepeerde Control UI-chatberichten. Accepteert begrensde CSS-breedtewaarden zoals `960px`, `82%`, `min(1280px, 82%)` en `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gevaarlijke modus die Host-header-originfallback inschakelt voor deployments die bewust vertrouwen op Host-header-originbeleid.
- `remote.transport`: `ssh` (standaard) of `direct` (ws/wss). Voor `direct` moet `remote.url` `ws://` of `wss://` zijn.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: client-side procesomgevings-override voor noodgevallen die plaintext `ws://` naar vertrouwde private-network-IP's toestaat; standaard blijft plaintext alleen toegestaan voor loopback. Er is geen `openclaw.json`-equivalent, en browser-private-network-configuratie zoals `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` heeft geen effect op Gateway WebSocket-clients.
- `gateway.remote.token` / `.password` zijn credentialvelden voor externe clients. Ze configureren Gateway-auth niet op zichzelf.
- `gateway.push.apns.relay.baseUrl`: basis-HTTPS-URL voor de externe APNs-relay die wordt gebruikt door officiële/TestFlight iOS-builds nadat ze relay-ondersteunde registraties naar de Gateway publiceren. Deze URL moet overeenkomen met de relay-URL die in de iOS-build is gecompileerd.
- `gateway.push.apns.relay.timeoutMs`: verzendtime-out van Gateway naar relay in milliseconden. Staat standaard op `10000`.
- Relay-ondersteunde registraties worden gedelegeerd aan een specifieke Gateway-identiteit. De gekoppelde iOS-app haalt `gateway.identity.get` op, neemt die identiteit op in de relayregistratie en stuurt een registratiespecifieke verzendgrant door naar de Gateway. Een andere Gateway kan die opgeslagen registratie niet hergebruiken.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: tijdelijke env-overrides voor de relayconfiguratie hierboven.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: development-only ontsnappingsluik voor loopback-HTTP-relay-URL's. Productie-relay-URL's moeten HTTPS blijven gebruiken.
- `gateway.handshakeTimeoutMs`: pre-auth Gateway WebSocket-handshake-time-out in milliseconden. Standaard: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` krijgt voorrang wanneer ingesteld. Verhoog dit op belaste of energiezuinige hosts waar lokale clients kunnen verbinden terwijl de opstart-warmup nog stabiliseert.
- `gateway.channelHealthCheckMinutes`: interval voor kanaal-health-monitor in minuten. Stel `0` in om health-monitor-herstarts globaal uit te schakelen. Standaard: `5`.
- `gateway.channelStaleEventThresholdMinutes`: drempel voor stale-sockets in minuten. Houd dit groter dan of gelijk aan `gateway.channelHealthCheckMinutes`. Standaard: `30`.
- `gateway.channelMaxRestartsPerHour`: maximaal aantal health-monitor-herstarts per kanaal/account in een rollend uur. Standaard: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per kanaal voor health-monitor-herstarts terwijl de globale monitor ingeschakeld blijft.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per account voor multi-account-kanalen. Wanneer ingesteld, krijgt dit voorrang boven de override op kanaalniveau.
- Lokale Gateway-aanroeppaden kunnen `gateway.remote.*` alleen als fallback gebruiken wanneer `gateway.auth.*` niet is ingesteld.
- Als `gateway.auth.token` / `gateway.auth.password` expliciet is geconfigureerd via SecretRef en niet kan worden opgelost, faalt resolutie gesloten (geen maskering door externe fallback).
- `trustedProxies`: IP's van reverse proxies die TLS beëindigen of forwarded-client-headers injecteren. Vermeld alleen proxies die je beheert. Loopback-items blijven geldig voor same-host proxy-/lokale-detectiesetups (bijvoorbeeld Tailscale Serve of een lokale reverse proxy), maar ze maken loopback-aanvragen **niet** geschikt voor `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: wanneer `true`, accepteert de Gateway `X-Real-IP` als `X-Forwarded-For` ontbreekt. Standaard `false` voor fail-closed-gedrag.
- `gateway.nodes.pairing.autoApproveCidrs`: optionele CIDR/IP-allowlist voor het automatisch goedkeuren van eerste node-device-pairing zonder aangevraagde scopes. Dit is uitgeschakeld wanneer niet ingesteld. Dit keurt operator-/browser-/Control UI-/WebChat-pairing niet automatisch goed, en keurt rol-, scope-, metadata- of public-key-upgrades niet automatisch goed.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globale allow/deny-vormgeving voor gedeclareerde nodecommands na pairing en evaluatie van de platform-allowlist. Gebruik `allowCommands` om in te tekenen op gevaarlijke nodecommands zoals `camera.snap`, `camera.clip` en `screen.record`; `denyCommands` verwijdert een command zelfs als een platformstandaard of expliciete allow het anders zou opnemen. Nadat een node zijn gedeclareerde commandlijst wijzigt, wijs je de device-pairing af en keur je die opnieuw goed, zodat de Gateway de bijgewerkte command-snapshot opslaat.
- `gateway.tools.deny`: extra toolnamen die worden geblokkeerd voor HTTP `POST /tools/invoke` (breidt de standaard denylist uit).
- `gateway.tools.allow`: verwijder toolnamen uit de standaard HTTP-denylist.

</Accordion>

### OpenAI-compatibele endpoints

- Chat Completions: standaard uitgeschakeld. Schakel in met `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Verharding van Responses-URL-invoer:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Lege allowlists worden behandeld als niet ingesteld; gebruik `gateway.http.endpoints.responses.files.allowUrl=false` en/of `gateway.http.endpoints.responses.images.allowUrl=false` om URL-fetching uit te schakelen.
- Optionele header voor responseverharding:
  - `gateway.http.securityHeaders.strictTransportSecurity` (stel alleen in voor HTTPS-origins die je beheert; zie [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Multi-instance-isolatie

Voer meerdere Gateways uit op één host met unieke poorten en state dirs:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Handige flags: `--dev` (gebruikt `~/.openclaw-dev` + poort `19001`), `--profile <name>` (gebruikt `~/.openclaw-<name>`).

Zie [Meerdere Gateways](/nl/gateway/multiple-gateways).

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

- `enabled`: schakelt TLS-beëindiging in bij de Gateway-listener (HTTPS/WSS) (standaard: `false`).
- `autoGenerate`: genereert automatisch een lokaal self-signed cert/key-paar wanneer expliciete bestanden niet zijn geconfigureerd; alleen voor lokaal/dev-gebruik.
- `certPath`: bestandssysteempad naar het TLS-certificaatbestand.
- `keyPath`: bestandssysteempad naar het TLS-private-key-bestand; houd permissies beperkt.
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
  - `"restart"`: herstart altijd het Gateway-proces bij configuratiewijziging.
  - `"hot"`: pas wijzigingen in-process toe zonder herstart.
  - `"hybrid"` (standaard): probeer eerst hot reload; val terug op herstart indien vereist.
- `debounceMs`: debouncevenster in ms voordat configuratiewijzigingen worden toegepast (niet-negatief geheel getal).
- `deferralTimeoutMs`: optionele maximale tijd in ms om te wachten op lopende bewerkingen voordat een herstart wordt geforceerd. Laat weg om de standaard begrensde wachttijd (`300000`) te gebruiken; stel in op `0` om onbeperkt te wachten en periodiek waarschuwingen voor nog lopende bewerkingen te loggen.

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
- `hooks.token` moet **verschillend** zijn van `gateway.auth.token`; hergebruik van het Gateway-token wordt geweigerd.
- `hooks.path` mag niet `/` zijn; gebruik een toegewezen subpad zoals `/hooks`.
- Als `hooks.allowRequestSessionKey=true`, beperk dan `hooks.allowedSessionKeyPrefixes` (bijvoorbeeld `["hook:"]`).
- Als een mapping of preset een getemplate `sessionKey` gebruikt, stel dan `hooks.allowedSessionKeyPrefixes` en `hooks.allowRequestSessionKey=true` in. Statische mappingsleutels vereisen die opt-in niet.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` uit de requestpayload wordt alleen geaccepteerd wanneer `hooks.allowRequestSessionKey=true` (standaard: `false`).
- `POST /hooks/<name>` → opgelost via `hooks.mappings`
  - Door templates gerenderde mappingwaarden voor `sessionKey` worden behandeld als extern aangeleverd en vereisen ook `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` matcht het subpad na `/hooks` (bijv. `/hooks/gmail` → `gmail`).
- `match.source` matcht een payloadveld voor generieke paden.
- Templates zoals `{{messages[0].subject}}` lezen uit de payload.
- `transform` kan verwijzen naar een JS/TS-module die een hookactie retourneert.
  - `transform.module` moet een relatief pad zijn en blijft binnen `hooks.transformsDir` (absolute paden en traversal worden geweigerd).
  - Houd `hooks.transformsDir` onder `~/.openclaw/hooks/transforms`; werkruimtemappen voor Skills worden geweigerd. Als `openclaw doctor` dit pad als ongeldig rapporteert, verplaats dan de transformmodule naar de transformmap voor hooks of verwijder `hooks.transformsDir`.
- `agentId` routeert naar een specifieke agent; onbekende ID's vallen terug op de standaardwaarde.
- `allowedAgentIds`: beperkt expliciete routering (`*` of weggelaten = alles toestaan, `[]` = alles weigeren).
- `defaultSessionKey`: optionele vaste sessiesleutel voor hookagent-runs zonder expliciete `sessionKey`.
- `allowRequestSessionKey`: sta toe dat aanroepers van `/hooks/agent` en templategestuurde mappingsessiesleutels `sessionKey` instellen (standaard: `false`).
- `allowedSessionKeyPrefixes`: optionele allowlist met prefixen voor expliciete `sessionKey`-waarden (request + mapping), bijv. `["hook:"]`. Dit wordt verplicht wanneer een mapping of preset een getemplate `sessionKey` gebruikt.
- `deliver: true` stuurt het uiteindelijke antwoord naar een kanaal; `channel` is standaard `last`.
- `model` overschrijft de LLM voor deze hook-run (moet toegestaan zijn als de modelcatalogus is ingesteld).

</Accordion>

### Gmail-integratie

- De ingebouwde Gmail-preset gebruikt `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Als je die routering per bericht behoudt, stel dan `hooks.allowRequestSessionKey: true` in en beperk `hooks.allowedSessionKeyPrefixes` zodat ze overeenkomen met de Gmail-namespace, bijvoorbeeld `["hook:", "hook:gmail:"]`.
- Als je `hooks.allowRequestSessionKey: false` nodig hebt, overschrijf dan de preset met een statische `sessionKey` in plaats van de getemplate standaardwaarde.

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

## Canvas-host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Serveert door agents bewerkbare HTML/CSS/JS en A2UI via HTTP onder de Gateway-poort:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Alleen lokaal: houd `gateway.bind: "loopback"` (standaard).
- Niet-loopback-binds: canvasroutes vereisen Gateway-authenticatie (token/wachtwoord/trusted-proxy), hetzelfde als andere HTTP-oppervlakken van de Gateway.
- Node WebViews sturen doorgaans geen authenticatieheaders; nadat een node is gekoppeld en verbonden, adverteert de Gateway node-scoped capability-URL's voor toegang tot canvas/A2UI.
- Capability-URL's zijn gebonden aan de actieve node-WS-sessie en verlopen snel. IP-gebaseerde fallback wordt niet gebruikt.
- Injecteert een live-reloadclient in geserveerde HTML.
- Maakt automatisch een starter-`index.html` aan wanneer leeg.
- Serveert A2UI ook op `/__openclaw__/a2ui/`.
- Wijzigingen vereisen een herstart van de Gateway.
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

- `minimal` (standaard): laat `cliPath` + `sshPort` weg uit TXT-records.
- `full`: neem `cliPath` + `sshPort` op.
- De hostnaam is standaard de systeemhostnaam wanneer die een geldig DNS-label is, met fallback naar `openclaw`. Overschrijf met `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Schrijft een unicast DNS-SD-zone onder `~/.openclaw/dns/`. Combineer dit voor cross-network-detectie met een DNS-server (CoreDNS aanbevolen) + Tailscale split DNS.

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
- Zie [Omgeving](/nl/help/environment) voor de volledige prioriteit.

### Vervanging van omgevingsvariabelen

Verwijs naar omgevingsvariabelen in elke configuratiestring met `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Alleen hoofdletternamen worden gematcht: `[A-Z_][A-Z0-9_]*`.
- Ontbrekende/lege variabelen veroorzaken een fout bij het laden van de configuratie.
- Escape met `$${VAR}` voor een letterlijke `${VAR}`.
- Werkt met `$include`.

---

## Geheimen

Secretrefs zijn additief: plaintext waarden blijven werken.

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
- `source: "exec"` ids mogen geen `.` of `..` slash-gescheiden padsegmenten bevatten (bijvoorbeeld `a/../b` wordt geweigerd)

### Ondersteund credential-oppervlak

- Canonieke matrix: [SecretRef Credential Surface](/nl/reference/secretref-credential-surface)
- `secrets apply` richt zich op ondersteunde `openclaw.json` credentialpaden.
- `auth-profiles.json`-refs zijn opgenomen in runtime-resolutie en auditdekking.

### Configuratie voor secret providers

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

Notities:

- De `file`-provider ondersteunt `mode: "json"` en `mode: "singleValue"` (`id` moet `"value"` zijn in singleValue-modus).
- Paden van file- en exec-providers failen gesloten wanneer Windows-ACL-verificatie niet beschikbaar is. Stel `allowInsecurePath: true` alleen in voor vertrouwde paden die niet kunnen worden geverifieerd.
- De `exec`-provider vereist een absoluut `command`-pad en gebruikt protocolpayloads op stdin/stdout.
- Standaard worden symlinkpaden voor commands geweigerd. Stel `allowSymlinkCommand: true` in om symlinkpaden toe te staan terwijl het opgeloste doelpad wordt gevalideerd.
- Als `trustedDirs` is geconfigureerd, geldt de trusted-dir-controle voor het opgeloste doelpad.
- De child-omgeving van `exec` is standaard minimaal; geef vereiste variabelen expliciet door met `passEnv`.
- Secretrefs worden tijdens activatie opgelost naar een in-memory snapshot; daarna lezen requestpaden alleen de snapshot.
- Filtering op actief oppervlak wordt toegepast tijdens activatie: onopgeloste refs op ingeschakelde oppervlakken laten startup/reload falen, terwijl inactieve oppervlakken met diagnostiek worden overgeslagen.

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
- `auth-profiles.json` ondersteunt refs op waardeniveau (`keyRef` voor `api_key`, `tokenRef` voor `token`) voor statische credentialmodi.
- Verouderde platte `auth-profiles.json`-maps zoals `{ "provider": { "apiKey": "..." } }` zijn geen runtime-formaat; `openclaw doctor --fix` herschrijft ze naar canonieke `provider:default` API-key-profielen met een `.legacy-flat.*.bak`-back-up.
- OAuth-modusprofielen (`auth.profiles.<id>.mode = "oauth"`) ondersteunen geen door SecretRef ondersteunde auth-profile-credentials.
- Statische runtime-credentials komen uit in-memory opgeloste snapshots; verouderde statische `auth.json`-items worden opgeschoond wanneer ze worden ontdekt.
- Verouderde OAuth-imports uit `~/.openclaw/credentials/oauth.json`.
- Zie [OAuth](/nl/concepts/oauth).
- Secrets-runtimegedrag en tooling voor `audit/configure/apply`: [Secrets Management](/nl/gateway/secrets).

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
  fouten met facturering/onvoldoende krediet (standaard: `5`). Expliciete factureringstekst kan
  hier nog steeds terechtkomen, zelfs bij `401`/`403`-responses, maar providerspecifieke tekst-
  matchers blijven beperkt tot de provider waartoe ze behoren (bijvoorbeeld OpenRouter
  `Key limit exceeded`). Opnieuw te proberen HTTP `402`-berichten over gebruiksvensters of
  bestedingslimieten voor organisatie/werkruimte blijven in plaats daarvan in het `rate_limit`-pad.
- `billingBackoffHoursByProvider`: optionele overrides per provider voor backoff-uren bij facturering.
- `billingMaxHours`: maximum in uren voor exponentiele groei van factureringsbackoff (standaard: `24`).
- `authPermanentBackoffMinutes`: basis-backoff in minuten voor zeer zekere `auth_permanent`-fouten (standaard: `10`).
- `authPermanentMaxMinutes`: maximum in minuten voor groei van `auth_permanent`-backoff (standaard: `60`).
- `failureWindowHours`: voortschrijdend venster in uren dat wordt gebruikt voor backoff-tellers (standaard: `24`).
- `overloadedProfileRotations`: maximum aantal rotaties van auth-profielen bij dezelfde provider voor overbelastingsfouten voordat wordt overgeschakeld naar modelfallback (standaard: `1`). Provider-bezet-vormen zoals `ModelNotReadyException` komen hier terecht.
- `overloadedBackoffMs`: vaste vertraging voordat een overbelaste provider/profielrotatie opnieuw wordt geprobeerd (standaard: `0`).
- `rateLimitedProfileRotations`: maximum aantal rotaties van auth-profielen bij dezelfde provider voor rate-limit-fouten voordat wordt overgeschakeld naar modelfallback (standaard: `1`). Die rate-limit-bucket bevat provider-vormige tekst zoals `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` en `resource exhausted`.

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
- `consoleLevel` gaat naar `debug` bij `--verbose`.
- `maxFileBytes`: maximale grootte van het actieve logbestand in bytes voor rotatie (positief geheel getal; standaard: `104857600` = 100 MB). OpenClaw bewaart maximaal vijf genummerde archieven naast het actieve bestand.
- `redactSensitive` / `redactPatterns`: best-effort maskering voor console-uitvoer, bestandslogs, OTLP-logrecords en opgeslagen sessietranscripttekst. `redactSensitive: "off"` schakelt alleen dit algemene log-/transcriptbeleid uit; UI-/tool-/diagnostische veiligheidsoppervlakken redigeren geheimen nog steeds voor verzending.

---

## Diagnostiek

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

- `enabled`: hoofdschakelaar voor instrumentatie-uitvoer (standaard: `true`).
- `flags`: array met flag-strings die gerichte loguitvoer inschakelen (ondersteunt wildcards zoals `"telegram.*"` of `"*"`).
- `stuckSessionWarnMs`: leeftijdsdrempel zonder voortgang in ms voor het classificeren van langlopende verwerkende sessies als `session.long_running`, `session.stalled` of `session.stuck`. Antwoord-, tool-, status-, block- en ACP-voortgang resetten de timer; herhaalde `session.stuck`-diagnostiek gebruikt backoff zolang er niets verandert.
- `otel.enabled`: schakelt de OpenTelemetry-exportpipeline in (standaard: `false`). Zie [OpenTelemetry-export](/nl/gateway/opentelemetry) voor de volledige configuratie, signaalcatalogus en het privacymodel.
- `otel.endpoint`: collector-URL voor OTel-export.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: optionele signaalspecifieke OTLP-eindpunten. Wanneer ingesteld, overschrijven ze `otel.endpoint` alleen voor dat signaal.
- `otel.protocol`: `"http/protobuf"` (standaard) of `"grpc"`.
- `otel.headers`: extra HTTP/gRPC-metadataheaders die met OTel-exportrequests worden verzonden.
- `otel.serviceName`: servicenaam voor resource-attributen.
- `otel.traces` / `otel.metrics` / `otel.logs`: schakelen trace-, metrics- of logexport in.
- `otel.sampleRate`: samplingpercentage voor traces `0`-`1`.
- `otel.flushIntervalMs`: periodiek interval voor telemetry-flush in ms.
- `otel.captureContent`: opt-in voor vastleggen van ruwe content voor OTEL-spanattributen. Staat standaard uit. Boolean `true` legt niet-systeem bericht-/toolcontent vast; met de objectvorm kun je `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` en `systemPrompt` expliciet inschakelen.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: omgevingsschakelaar voor de nieuwste experimentele GenAI-spanproviderattributen. Standaard behouden spans het legacy `gen_ai.system`-attribuut voor compatibiliteit; GenAI-metrics gebruiken begrensde semantische attributen.
- `OPENCLAW_OTEL_PRELOADED=1`: omgevingsschakelaar voor hosts die al een globale OpenTelemetry-SDK hebben geregistreerd. OpenClaw slaat dan het starten/stoppen van de SDK door de Plugin over terwijl diagnostische listeners actief blijven.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` en `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: signaalspecifieke endpoint-env-vars die worden gebruikt wanneer de overeenkomende configuratiesleutel niet is ingesteld.
- `cacheTrace.enabled`: log cache-trace-snapshots voor embedded runs (standaard: `false`).
- `cacheTrace.filePath`: uitvoerpad voor cache-trace-JSONL (standaard: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: bepalen wat wordt opgenomen in cache-trace-uitvoer (allemaal standaard: `true`).

---

## Bijwerken

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

- `channel`: releasekanaal voor npm-/git-installaties — `"stable"`, `"beta"` of `"dev"`.
- `checkOnStart`: controleer op npm-updates wanneer de Gateway start (standaard: `true`).
- `auto.enabled`: schakel automatische achtergrondupdates in voor pakketinstallaties (standaard: `false`).
- `auto.stableDelayHours`: minimale vertraging in uren voordat automatisch toepassen voor het stable-kanaal plaatsvindt (standaard: `6`; max: `168`).
- `auto.stableJitterHours`: extra spreidingsvenster voor rollout van het stable-kanaal in uren (standaard: `12`; max: `168`).
- `auto.betaCheckIntervalHours`: hoe vaak controles voor het beta-kanaal in uren worden uitgevoerd (standaard: `1`; max: `24`).

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

- `enabled`: globale ACP-featuregate (standaard: `true`; stel in op `false` om ACP-dispatch en spawn-mogelijkheden te verbergen).
- `dispatch.enabled`: onafhankelijke gate voor ACP-sessieturn-dispatch (standaard: `true`). Stel in op `false` om ACP-commando's beschikbaar te houden terwijl uitvoering wordt geblokkeerd.
- `backend`: standaard ACP-runtime-backend-id (moet overeenkomen met een geregistreerde ACP-runtime-Plugin).
  Installeer eerst de backend-Plugin en, als `plugins.allow` is ingesteld, neem dan de backend-Plugin-id op (bijvoorbeeld `acpx`), anders wordt de ACP-backend niet geladen.
- `defaultAgent`: fallback ACP-doelagent-id wanneer spawns geen expliciet doel specificeren.
- `allowedAgents`: allowlist van agent-id's die zijn toegestaan voor ACP-runtime-sessies; leeg betekent geen aanvullende beperking.
- `maxConcurrentSessions`: maximum aantal gelijktijdig actieve ACP-sessies.
- `stream.coalesceIdleMs`: idle-flushvenster in ms voor gestreamde tekst.
- `stream.maxChunkChars`: maximale chunkgrootte voordat gestreamde block-projectie wordt gesplitst.
- `stream.repeatSuppression`: onderdruk herhaalde status-/toolregels per turn (standaard: `true`).
- `stream.deliveryMode`: `"live"` streamt incrementeel; `"final_only"` buffert tot terminale turn-events.
- `stream.hiddenBoundarySeparator`: scheidingsteken voor zichtbare tekst na verborgen tool-events (standaard: `"paragraph"`).
- `stream.maxOutputChars`: maximaal aantal assistant-uitvoerkarakters dat per ACP-turn wordt geprojecteerd.
- `stream.maxSessionUpdateChars`: maximaal aantal karakters voor geprojecteerde ACP-status-/updateregels.
- `stream.tagVisibility`: record van tagnamen naar booleaanse zichtbaarheidsoverschrijvingen voor gestreamde events.
- `runtime.ttlMinutes`: idle-TTL in minuten voor ACP-sessieworkers voordat ze in aanmerking komen voor opschoning.
- `runtime.installCommand`: optionele installatieopdracht om uit te voeren bij het bootstrappen van een ACP-runtime-omgeving.

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

Metadata geschreven door begeleide setupflows van de CLI (`onboard`, `configure`, `doctor`):

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

Zie de identiteitsvelden van `agents.list` onder [Agentstandaarden](/nl/gateway/config-agents#agent-defaults).

---

## Bridge (legacy, verwijderd)

Huidige builds bevatten de TCP-bridge niet meer. Nodes verbinden via de Gateway-WebSocket. `bridge.*`-sleutels maken geen deel meer uit van het configuratieschema (validatie faalt totdat ze zijn verwijderd; `openclaw doctor --fix` kan onbekende sleutels verwijderen).

<Accordion title="Legacy bridge config (historische referentie)">

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

- `sessionRetention`: hoe lang voltooide geisoleerde cron-run-sessies worden bewaard voordat ze uit `sessions.json` worden opgeschoond. Regelt ook opschoning van gearchiveerde verwijderde cron-transcripten. Standaard: `24h`; stel in op `false` om uit te schakelen.
- `runLog.maxBytes`: maximale grootte per run-logbestand (`cron/runs/<jobId>.jsonl`) voor opschoning. Standaard: `2_000_000` bytes.
- `runLog.keepLines`: nieuwste regels die worden behouden wanneer run-logopschoning wordt geactiveerd. Standaard: `2000`.
- `webhookToken`: bearer-token gebruikt voor Cron-Webhook-POST-bezorging (`delivery.mode = "webhook"`), indien weggelaten wordt geen auth-header verzonden.
- `webhook`: verouderde legacy fallback-Webhook-URL (http/https) die alleen wordt gebruikt voor opgeslagen jobs die nog steeds `notify: true` hebben.

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

- `maxAttempts`: maximaal aantal nieuwe pogingen voor eenmalige taken bij tijdelijke fouten (standaard: `3`; bereik: `0`–`10`).
- `backoffMs`: array met backoff-vertragingen in ms voor elke nieuwe poging (standaard: `[30000, 60000, 300000]`; 1–10 items).
- `retryOn`: fouttypen die nieuwe pogingen activeren — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Laat weg om alle tijdelijke typen opnieuw te proberen.

Geldt alleen voor eenmalige Cron-taken. Terugkerende taken gebruiken afzonderlijke foutafhandeling.

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

- `enabled`: schakel foutmeldingen in voor Cron-taken (standaard: `false`).
- `after`: opeenvolgende fouten voordat een melding wordt verstuurd (positief geheel getal, min: `1`).
- `cooldownMs`: minimumaantal milliseconden tussen herhaalde meldingen voor dezelfde taak (niet-negatief geheel getal).
- `includeSkipped`: tel opeenvolgende overgeslagen uitvoeringen mee voor de meldingsdrempel (standaard: `false`). Overgeslagen uitvoeringen worden afzonderlijk bijgehouden en hebben geen invloed op backoff voor uitvoeringsfouten.
- `mode`: leveringsmodus — `"announce"` verstuurt via een kanaalbericht; `"webhook"` post naar de geconfigureerde Webhook.
- `accountId`: optionele account- of kanaal-id om meldingslevering af te bakenen.

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
- `mode`: `"announce"` of `"webhook"`; valt terug op `"announce"` wanneer er voldoende doelgegevens zijn.
- `channel`: kanaaloverschrijving voor announce-levering. `"last"` hergebruikt het laatst bekende leveringskanaal.
- `to`: expliciet announce-doel of Webhook-URL. Vereist voor Webhook-modus.
- `accountId`: optionele accountoverschrijving voor levering.
- Per-taak `delivery.failureDestination` overschrijft deze globale standaard.
- Wanneer er geen globale of per-taak foutbestemming is ingesteld, vallen taken die al via `announce` leveren bij een fout terug op dat primaire announce-doel.
- `delivery.failureDestination` wordt alleen ondersteund voor `sessionTarget="isolated"`-taken, tenzij de primaire `delivery.mode` van de taak `"webhook"` is.

Zie [Cron-taken](/nl/automation/cron-jobs). Geïsoleerde Cron-uitvoeringen worden bijgehouden als [achtergrondtaken](/nl/automation/tasks).

---

## Templatevariabelen voor mediamodellen

Templateplaatsaanduidingen die worden uitgebreid in `tools.media.models[].args`:

| Variabele          | Beschrijving                                      |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Volledige inkomende berichtinhoud                 |
| `{{RawBody}}`      | Ruwe inhoud (zonder geschiedenis-/afzenderwrappers) |
| `{{BodyStripped}}` | Inhoud waaruit groepsvermeldingen zijn verwijderd |
| `{{From}}`         | Afzender-ID                                       |
| `{{To}}`           | Bestemmings-ID                                    |
| `{{MessageSid}}`   | Kanaalbericht-id                                  |
| `{{SessionId}}`    | Huidige sessie-UUID                               |
| `{{IsNewSession}}` | `"true"` wanneer een nieuwe sessie is gemaakt     |
| `{{MediaUrl}}`     | Pseudo-URL voor inkomende media                   |
| `{{MediaPath}}`    | Lokaal mediapad                                   |
| `{{MediaType}}`    | Mediatype (afbeelding/audio/document/…)           |
| `{{Transcript}}`   | Audiotranscript                                   |
| `{{Prompt}}`       | Opgeloste mediaprompt voor CLI-items              |
| `{{MaxChars}}`     | Opgelost maximumaantal uitvoertekens voor CLI-items |
| `{{ChatType}}`     | `"direct"` of `"group"`                           |
| `{{GroupSubject}}` | Groepsonderwerp (naar beste vermogen)             |
| `{{GroupMembers}}` | Voorvertoning van groepsleden (naar beste vermogen) |
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

- Eén bestand: vervangt het omvattende object.
- Array van bestanden: wordt in volgorde diep samengevoegd (latere waarden overschrijven eerdere).
- Sleutels op hetzelfde niveau: worden na includes samengevoegd (overschrijven opgenomen waarden).
- Geneste includes: tot 10 niveaus diep.
- Paden: worden opgelost relatief aan het includende bestand, maar moeten binnen de configuratiemap op het hoogste niveau blijven (`dirname` van `openclaw.json`). Absolute/`../`-vormen zijn alleen toegestaan wanneer ze nog steeds binnen die grens oplossen.
- Door OpenClaw beheerde schrijfacties die slechts één sectie op het hoogste niveau wijzigen die door een include van één bestand wordt ondersteund, schrijven door naar dat opgenomen bestand. Bijvoorbeeld: `plugins install` werkt `plugins: { $include: "./plugins.json5" }` bij in `plugins.json5` en laat `openclaw.json` intact.
- Root-includes, include-arrays en includes met overschrijvingen op hetzelfde niveau zijn alleen-lezen voor door OpenClaw beheerde schrijfacties; die schrijfacties falen gesloten in plaats van de configuratie af te vlakken.
- Fouten: duidelijke berichten voor ontbrekende bestanden, parseerfouten en circulaire includes.

---

_Gerelateerd: [Configuratie](/nl/gateway/configuration) · [Configuratievoorbeelden](/nl/gateway/configuration-examples) · [Doctor](/nl/gateway/doctor)_

## Gerelateerd

- [Configuratie](/nl/gateway/configuration)
- [Configuratievoorbeelden](/nl/gateway/configuration-examples)
