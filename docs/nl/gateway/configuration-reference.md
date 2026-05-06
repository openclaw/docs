---
read_when:
    - Je hebt exacte configuratiesemantiek op veldniveau of standaardwaarden nodig
    - Je valideert kanaal-, model-, Gateway- of toolconfiguratieblokken
summary: Gateway-configuratiereferentie voor OpenClaw-kernsleutels, standaardwaarden en links naar specifieke subsystemreferenties
title: Configuratiereferentie
x-i18n:
    generated_at: "2026-05-06T17:55:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e5f7c2246b28f801d527437ae6242686998f1e8b75fd3977723d240a760d859
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Kernconfiguratiereferentie voor `~/.openclaw/openclaw.json`. Zie [Configuratie](/nl/gateway/configuration) voor een taakgericht overzicht.

Behandelt de belangrijkste OpenClaw-configuratievlakken en linkt door wanneer een subsysteem een eigen diepgaandere referentie heeft. Kanaal- en Plugin-beheerde opdrachtcatalogi en diepe geheugen-/QMD-knoppen staan op hun eigen pagina's in plaats van op deze.

Codewaarheid:

- `openclaw config schema` drukt het live JSON Schema af dat wordt gebruikt voor validatie en Control UI, met gebundelde/Plugin-/kanaalmetadata samengevoegd wanneer beschikbaar
- `config.schema.lookup` retourneert één padgebonden schemaknooppunt voor drilldowntooling
- `pnpm config:docs:check` / `pnpm config:docs:gen` valideren de baselinehash van de configuratiedocumentatie tegen het huidige schemavlak

Agent-opzoekpad: gebruik de `gateway`-toolactie `config.schema.lookup` voor
exacte documentatie en beperkingen op veldniveau vóór bewerkingen. Gebruik
[Configuratie](/nl/gateway/configuration) voor taakgerichte begeleiding en deze pagina
voor de bredere veldkaart, standaardwaarden en links naar subsysteemreferenties.

Toegewijde diepe referenties:

- [Referentie voor geheugenconfiguratie](/nl/reference/memory-config) voor `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` en dreaming-configuratie onder `plugins.entries.memory-core.config.dreaming`
- [Slash-opdrachten](/nl/tools/slash-commands) voor de huidige ingebouwde + gebundelde opdrachtcatalogus
- beherende kanaal-/Plugin-pagina's voor kanaalspecifieke opdrachtvlakken

Configuratieformaat is **JSON5** (opmerkingen + afsluitende komma's toegestaan). Alle velden zijn optioneel - OpenClaw gebruikt veilige standaardwaarden wanneer ze worden weggelaten.

---

## Kanalen

Configuratiesleutels per kanaal zijn verplaatst naar een toegewijde pagina - zie
[Configuratie - kanalen](/nl/gateway/config-channels) voor `channels.*`,
waaronder Slack, Discord, Telegram, WhatsApp, Matrix, iMessage en andere
gebundelde kanalen (authenticatie, toegangscontrole, meerdere accounts, mention gating).

## Agent-standaardwaarden, multi-agent, sessies en berichten

Verplaatst naar een toegewijde pagina - zie
[Configuratie - agents](/nl/gateway/config-agents) voor:

- `agents.defaults.*` (werkruimte, model, denken, Heartbeat, geheugen, media, Skills, sandbox)
- `multiAgent.*` (multi-agentroutering en bindings)
- `session.*` (sessielevenscyclus, Compaction, snoeien)
- `messages.*` (berichtbezorging, TTS, markdown-rendering)
- `talk.*` (Talk-modus)
  - `talk.speechLocale`: optionele BCP 47-locale-id voor Talk-spraakherkenning op iOS/macOS
  - `talk.silenceTimeoutMs`: wanneer niet ingesteld, houdt Talk het standaard pauzevenster van het platform aan voordat het transcript wordt verzonden (`700 ms on macOS and Android, 900 ms on iOS`)

## Tools en aangepaste providers

Toolbeleid, experimentele toggles, provider-backed toolconfiguratie en aangepaste
provider-/base-URL-instelling zijn verplaatst naar een toegewijde pagina - zie
[Configuratie - tools en aangepaste providers](/nl/gateway/config-tools).

## Modellen

Providerdefinities, model-allowlists en aangepaste providerinstelling staan in
[Configuratie - tools en aangepaste providers](/nl/gateway/config-tools#custom-providers-and-base-urls).
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
- `models.providers`: aangepaste providermap gesleuteld op provider-id.
- `models.pricing.enabled`: beheert de prijsbootstrap op de achtergrond die
  start nadat sidecars en kanalen het Gateway-ready-pad bereiken. Wanneer `false`,
  slaat de Gateway prijs-catalogusfetches van OpenRouter en LiteLLM over; geconfigureerde
  `models.providers.*.models[].cost`-waarden blijven werken voor lokale kostenramingen.

## MCP

Door OpenClaw beheerde MCP-serverdefinities staan onder `mcp.servers` en worden
gebruikt door ingebedde Pi en andere runtime-adapters. De opdrachten `openclaw mcp list`,
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
  `openclaw doctor --fix` normaliseren naar het canonieke veld `transport`.
- `mcp.sessionIdleTtlMs`: idle TTL voor sessiegebonden gebundelde MCP-runtimes.
  Eenmalige ingebedde runs vragen opschoning aan het einde van de run; deze TTL is de fallback voor
  langlevende sessies en toekomstige aanroepers.
- Wijzigingen onder `mcp.*` worden hot-applied door gecachte sessie-MCP-runtimes te verwijderen.
  De volgende tooldiscovery/het volgende toolgebruik maakt ze opnieuw aan vanuit de nieuwe configuratie, zodat verwijderde
  `mcp.servers`-items onmiddellijk worden opgeschoond in plaats van te wachten op de idle TTL.

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

- `allowBundled`: optionele allowlist alleen voor gebundelde skills (beheerde/werkruimte-skills blijven onaangetast).
- `load.extraDirs`: extra gedeelde skill-roots (laagste prioriteit).
- `install.preferBrew`: wanneer true, geef de voorkeur aan Homebrew-installers wanneer `brew`
  beschikbaar is voordat wordt teruggevallen op andere installertypen.
- `install.nodeManager`: node-installervoorkeur voor `metadata.openclaw.install`
  specs (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` schakelt een skill uit, zelfs als die gebundeld/geïnstalleerd is.
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

- Geladen uit `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, plus `plugins.load.paths`.
- Discovery accepteert native OpenClaw-plugins plus compatibele Codex-bundels en Claude-bundels, inclusief manifestloze Claude-bundels met standaardlayout.
- **Configuratiewijzigingen vereisen een Gateway-herstart.**
- `allow`: optionele allowlist (alleen vermelde plugins laden). `deny` wint.
- `bundledDiscovery`: standaard `"allowlist"` voor nieuwe configuraties, zodat een niet-lege
  `plugins.allow` ook gebundelde providerplugins afschermt, inclusief web-search
  runtimeproviders. Doctor schrijft `"compat"` voor gemigreerde legacy-allowlist-
  configuraties om bestaand gedrag van gebundelde providers te behouden totdat je je aanmeldt.
- `plugins.entries.<id>.apiKey`: API-sleutelgemaksveld op Plugin-niveau (wanneer ondersteund door de Plugin).
- `plugins.entries.<id>.env`: Plugin-scoped env-var-map.
- `plugins.entries.<id>.hooks.allowPromptInjection`: wanneer `false`, blokkeert core `before_prompt_build` en negeert prompt-mutating velden van legacy `before_agent_start`, terwijl legacy `modelOverride` en `providerOverride` behouden blijven. Geldt voor native Plugin-hooks en ondersteunde door bundels geleverde hookmappen.
- `plugins.entries.<id>.hooks.allowConversationAccess`: wanneer `true`, mogen vertrouwde niet-gebundelde plugins ruwe gespreksinhoud lezen vanuit getypeerde hooks zoals `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` en `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: vertrouw deze Plugin expliciet om per-run `provider`- en `model`-overrides aan te vragen voor subagent-runs op de achtergrond.
- `plugins.entries.<id>.subagent.allowedModels`: optionele allowlist van canonieke `provider/model`-doelen voor vertrouwde subagent-overrides. Gebruik `"*"` alleen wanneer je bewust elk model wilt toestaan.
- `plugins.entries.<id>.config`: door de Plugin gedefinieerd configuratieobject (gevalideerd door native OpenClaw-Plugin-schema wanneer beschikbaar).
- Account-/runtime-instellingen voor kanaalplugins staan onder `channels.<id>` en moeten worden beschreven door de metadata `channelConfigs` van het manifest van de beherende Plugin, niet door een centraal OpenClaw-optieregister.
- `plugins.entries.firecrawl.config.webFetch`: instellingen voor de Firecrawl-web-fetch-provider.
  - `apiKey`: Firecrawl-API-sleutel (accepteert SecretRef). Valt terug op `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey` of `FIRECRAWL_API_KEY` env-var.
  - `baseUrl`: Firecrawl API-base-URL (standaard: `https://api.firecrawl.dev`; self-hosted overrides moeten naar private/interne endpoints wijzen).
  - `onlyMainContent`: extraheer alleen de hoofdinhoud uit pagina's (standaard: `true`).
  - `maxAgeMs`: maximale cacheleeftijd in milliseconden (standaard: `172800000` / 2 dagen).
  - `timeoutSeconds`: time-out voor scrapeverzoek in seconden (standaard: `60`).
- `plugins.entries.xai.config.xSearch`: instellingen voor xAI X Search (Grok-webzoekopdracht).
  - `enabled`: schakel de X Search-provider in.
  - `model`: Grok-model om te gebruiken voor zoeken (bijv. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: instellingen voor memory dreaming. Zie [Dreaming](/nl/concepts/dreaming) voor fasen en drempels.
  - `enabled`: hoofdschakelaar voor dreaming (standaard `false`).
  - `frequency`: cron-cadans voor elke volledige dreaming-sweep (standaard `"0 3 * * *"`).
  - `model`: optionele model-override voor de Dream Diary-subagent. Vereist `plugins.entries.memory-core.subagent.allowModelOverride: true`; combineer met `allowedModels` om doelen te beperken. Fouten door niet-beschikbare modellen proberen één keer opnieuw met het standaardmodel van de sessie; vertrouwens- of allowlist-fouten vallen niet stilzwijgend terug.
  - fasebeleid en drempels zijn implementatiedetails (geen gebruikersgerichte configuratiesleutels).
- Volledige geheugenconfiguratie staat in [Referentie voor geheugenconfiguratie](/nl/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Ingeschakelde Claude-bundelplugins kunnen ook ingebedde Pi-standaardwaarden bijdragen vanuit `settings.json`; OpenClaw past die toe als gesaneerde agent-instellingen, niet als ruwe OpenClaw-configuratiepatches.
- `plugins.slots.memory`: kies de actieve geheugen-Plugin-id, of `"none"` om geheugenplugins uit te schakelen.
- `plugins.slots.contextEngine`: kies de actieve context-engine-Plugin-id; standaard `"legacy"` tenzij je een andere engine installeert en selecteert.

Zie [Plugins](/nl/tools/plugin).

---

## Toezeggingen

`commitments` beheert afgeleid vervolggeheugen: OpenClaw kan check-ins uit gespreksbeurten detecteren en ze afleveren via Heartbeat-runs.

- `commitments.enabled`: schakel verborgen LLM-extractie, opslag en Heartbeat-bezorging in voor afgeleide vervolgtoezeggingen. Standaard: `false`.
- `commitments.maxPerDay`: maximaal aantal afgeleide vervolgtoezeggingen dat per agent-sessie in een voortschrijdende dag wordt bezorgd. Standaard: `3`.

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
- `tabCleanup` ruimt bijgehouden tabbladen van primaire agents op na inactiviteit of wanneer een
  sessie de limiet overschrijdt. Stel `idleMinutes: 0` of `maxTabsPerSession: 0` in om
  deze afzonderlijke opruimmodi uit te schakelen.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` is uitgeschakeld wanneer niet ingesteld, zodat browsernavigatie standaard strikt blijft.
- Stel `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` alleen in wanneer je browsernavigatie via een privénetwerk bewust vertrouwt.
- In strikte modus gelden voor externe CDP-profieleindpunten (`profiles.*.cdpUrl`) dezelfde blokkades voor privénetwerken tijdens bereikbaarheids- en detectiecontroles.
- `ssrfPolicy.allowPrivateNetwork` blijft ondersteund als legacy-alias.
- Gebruik in strikte modus `ssrfPolicy.hostnameAllowlist` en `ssrfPolicy.allowedHostnames` voor expliciete uitzonderingen.
- Externe profielen zijn alleen voor koppelen (starten/stoppen/resetten uitgeschakeld).
- `profiles.*.cdpUrl` accepteert `http://`, `https://`, `ws://` en `wss://`.
  Gebruik HTTP(S) wanneer je wilt dat OpenClaw `/json/version` detecteert; gebruik WS(S)
  wanneer je provider je een directe DevTools WebSocket-URL geeft.
- `remoteCdpTimeoutMs` en `remoteCdpHandshakeTimeoutMs` gelden voor externe en
  `attachOnly` CDP-bereikbaarheid plus aanvragen om tabbladen te openen. Beheerde local loopback-
  profielen behouden lokale CDP-standaarden.
- Als een extern beheerde CDP-service bereikbaar is via loopback, stel dan voor dat
  profiel `attachOnly: true` in; anders behandelt OpenClaw de loopback-poort als een
  lokaal beheerd browserprofiel en kan het fouten over lokaal poorteigendom melden.
- `existing-session`-profielen gebruiken Chrome MCP in plaats van CDP en kunnen koppelen op
  de geselecteerde host of via een verbonden browsernode.
- `existing-session`-profielen kunnen `userDataDir` instellen om een specifiek
  Chromium-gebaseerd browserprofiel te targeten, zoals Brave of Edge.
- `existing-session`-profielen behouden de huidige routelimieten van Chrome MCP:
  snapshot-/ref-gestuurde acties in plaats van CSS-selector-targeting, one-file upload-
  hooks, geen overschrijvingen van dialoogtime-outs, geen `wait --load networkidle` en geen
  `responsebody`, PDF-export, downloadinterceptie of batchacties.
- Lokaal beheerde `openclaw`-profielen wijzen `cdpPort` en `cdpUrl` automatisch toe; stel
  `cdpUrl` alleen expliciet in voor externe CDP.
- Lokaal beheerde profielen kunnen `executablePath` instellen om de globale
  `browser.executablePath` voor dat profiel te overschrijven. Gebruik dit om één profiel in
  Chrome en een ander in Brave uit te voeren.
- Lokaal beheerde profielen gebruiken `browser.localLaunchTimeoutMs` voor Chrome CDP HTTP-
  detectie na het starten van het proces en `browser.localCdpReadyTimeoutMs` voor
  CDP-websocketgereedheid na het starten. Verhoog deze op tragere hosts waar Chrome
  succesvol start maar gereedheidscontroles met het opstarten concurreren. Beide waarden moeten
  positieve gehele getallen tot `120000` ms zijn; ongeldige configuratiewaarden worden geweigerd.
- Automatische detectievolgorde: standaardbrowser als die Chromium-gebaseerd is → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` en `browser.profiles.<name>.executablePath` accepteren allebei
  `~` en `~/...` voor de thuismap van je besturingssysteem vóór het starten van Chromium.
  Per-profiel `userDataDir` op `existing-session`-profielen wordt ook met tilde uitgebreid.
- Besturingsservice: alleen loopback (poort afgeleid van `gateway.port`, standaard `18791`).
- `extraArgs` voegt extra startflags toe aan het lokaal opstarten van Chromium (bijvoorbeeld
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

- `seamColor`: accentkleur voor de UI-chrome van de native app (tint van Talk Mode-bubbel, enz.).
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

- `mode`: `local` (Gateway uitvoeren) of `remote` (verbinden met externe Gateway). Gateway weigert te starten tenzij `local`.
- `port`: enkele multiplexed poort voor WS + HTTP. Voorrang: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (standaard), `lan` (`0.0.0.0`), `tailnet` (alleen Tailscale-IP), of `custom`.
- **Verouderde bind-aliassen**: gebruik bind-moduswaarden in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), geen hostaliassen (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-opmerking**: de standaard `loopback`-bind luistert naar `127.0.0.1` binnen de container. Met Docker bridge-netwerken (`-p 18789:18789`) komt verkeer binnen op `eth0`, waardoor de Gateway onbereikbaar is. Gebruik `--network host`, of stel `bind: "lan"` in (of `bind: "custom"` met `customBindHost: "0.0.0.0"`) om op alle interfaces te luisteren.
- **Authenticatie**: standaard vereist. Niet-loopback-binds vereisen Gateway-authenticatie. In de praktijk betekent dat een gedeeld token/wachtwoord of een identiteitsbewuste reverse proxy met `gateway.auth.mode: "trusted-proxy"`. De onboardingwizard genereert standaard een token.
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd (inclusief SecretRefs), stel `gateway.auth.mode` dan expliciet in op `token` of `password`. Opstart- en service-installatie-/reparatiestromen mislukken wanneer beide zijn geconfigureerd en de modus niet is ingesteld.
- `gateway.auth.mode: "none"`: expliciete modus zonder authenticatie. Gebruik alleen voor vertrouwde local loopback-setups; dit wordt bewust niet aangeboden door onboardingprompts.
- `gateway.auth.mode: "trusted-proxy"`: delegeer browser-/gebruikersauthenticatie aan een identiteitsbewuste reverse proxy en vertrouw identiteitsheaders van `gateway.trustedProxies` (zie [Authenticatie via vertrouwde proxy](/nl/gateway/trusted-proxy-auth)). Deze modus verwacht standaard een **niet-loopback** proxybron; same-host loopback-reverse-proxy's vereisen expliciet `gateway.auth.trustedProxy.allowLoopback = true`. Interne same-host-aanroepers kunnen `gateway.auth.password` gebruiken als lokale directe fallback; `gateway.auth.token` blijft wederzijds exclusief met trusted-proxy-modus.
- `gateway.auth.allowTailscale`: wanneer `true`, kunnen Tailscale Serve-identiteitsheaders voldoen aan authenticatie voor de bedienings-UI/WebSocket (geverifieerd via `tailscale whois`). HTTP API-eindpunten gebruiken die Tailscale-headerauthenticatie **niet**; ze volgen in plaats daarvan de normale HTTP-authenticatiemodus van de Gateway. Deze tokenloze stroom veronderstelt dat de Gateway-host vertrouwd is. Standaard `true` wanneer `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: optionele limiter voor mislukte authenticatie. Geldt per client-IP en per authenticatiescope (shared-secret en device-token worden afzonderlijk bijgehouden). Geblokkeerde pogingen retourneren `429` + `Retry-After`.
  - Op het asynchrone Tailscale Serve-pad voor de bedienings-UI worden mislukte pogingen voor dezelfde `{scope, clientIp}` geserialiseerd voordat de mislukking wordt geschreven. Gelijktijdige onjuiste pogingen van dezelfde client kunnen daardoor de limiter al bij het tweede verzoek activeren, in plaats van dat beide als gewone mismatches tegelijk doorlopen.
  - `gateway.auth.rateLimit.exemptLoopback` is standaard `true`; stel in op `false` wanneer je bewust ook localhost-verkeer aan rate limiting wilt onderwerpen (voor testsetups of strikte proxydeployments).
- WS-authenticatiepogingen vanuit browser-origins worden altijd gethrottled met loopbackvrijstelling uitgeschakeld (defense-in-depth tegen browsergebaseerde brute force op localhost).
- Op loopback worden die lockouts vanuit browser-origins geïsoleerd per genormaliseerde `Origin`
  waarde, zodat herhaalde mislukkingen vanaf één localhost-origin niet automatisch
  een andere origin blokkeren.
- `tailscale.mode`: `serve` (alleen tailnet, loopback-bind) of `funnel` (publiek, vereist authenticatie).
- `controlUi.allowedOrigins`: expliciete allowlist voor browser-origins voor Gateway WebSocket-verbindingen. Vereist wanneer browserclients worden verwacht vanaf niet-loopback-origins.
- `controlUi.chatMessageMaxWidth`: optionele maximale breedte voor gegroepeerde chatberichten in de bedienings-UI. Accepteert begrensde CSS-breedtewaarden zoals `960px`, `82%`, `min(1280px, 82%)` en `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gevaarlijke modus die Host-header-originfallback inschakelt voor deployments die bewust vertrouwen op Host-header-originbeleid.
- `remote.transport`: `ssh` (standaard) of `direct` (ws/wss). Voor `direct` moet `remote.url` `ws://` of `wss://` zijn.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override via de client-side procesomgeving
  als noodgreep die plaintext `ws://` naar vertrouwde IP's in privé-netwerken
  toestaat; standaard blijft plaintext alleen toegestaan voor loopback. Er is geen
  equivalent in `openclaw.json`, en browserconfiguratie voor privé-netwerken zoals
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` heeft geen invloed op Gateway
  WebSocket-clients.
- `gateway.remote.token` / `.password` zijn credentialvelden voor externe clients. Ze configureren Gateway-authenticatie niet op zichzelf.
- `gateway.push.apns.relay.baseUrl`: basis-HTTPS-URL voor de externe APNs-relay die door officiële/TestFlight-iOS-builds wordt gebruikt nadat ze relay-ondersteunde registraties naar de Gateway publiceren. Deze URL moet overeenkomen met de relay-URL die in de iOS-build is gecompileerd.
- `gateway.push.apns.relay.timeoutMs`: verzendtime-out van Gateway naar relay in milliseconden. Standaard `10000`.
- Relay-ondersteunde registraties worden gedelegeerd aan een specifieke Gateway-identiteit. De gekoppelde iOS-app haalt `gateway.identity.get` op, neemt die identiteit op in de relayregistratie en stuurt een registratiegebonden verzendtoekenning door naar de Gateway. Een andere Gateway kan die opgeslagen registratie niet hergebruiken.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: tijdelijke env-overrides voor de relayconfiguratie hierboven.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: alleen-voor-ontwikkeling ontsnappingsluik voor loopback-HTTP-relay-URL's. Productierelay-URL's moeten HTTPS blijven gebruiken.
- `gateway.handshakeTimeoutMs`: pre-auth Gateway WebSocket-handshake-time-out in milliseconden. Standaard: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` heeft voorrang wanneer ingesteld. Verhoog dit op belaste of minder krachtige hosts waar lokale clients kunnen verbinden terwijl de opstart-warmup nog stabiliseert.
- `gateway.channelHealthCheckMinutes`: interval voor de gezondheidsmonitor van kanalen in minuten. Stel `0` in om herstarts door de gezondheidsmonitor globaal uit te schakelen. Standaard: `5`.
- `gateway.channelStaleEventThresholdMinutes`: drempel voor stale sockets in minuten. Houd dit groter dan of gelijk aan `gateway.channelHealthCheckMinutes`. Standaard: `30`.
- `gateway.channelMaxRestartsPerHour`: maximaal aantal herstarts door de gezondheidsmonitor per kanaal/account in een rollend uur. Standaard: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per kanaal voor herstarts door de gezondheidsmonitor terwijl de globale monitor ingeschakeld blijft.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per account voor kanalen met meerdere accounts. Wanneer ingesteld, heeft dit voorrang op de override op kanaalniveau.
- Lokale Gateway-aanroeppaden kunnen `gateway.remote.*` alleen als fallback gebruiken wanneer `gateway.auth.*` niet is ingesteld.
- Als `gateway.auth.token` / `gateway.auth.password` expliciet via SecretRef is geconfigureerd en niet kan worden opgelost, faalt de resolutie gesloten (geen maskering door externe fallback).
- `trustedProxies`: IP's van reverse proxy's die TLS beëindigen of forwarded-client-headers injecteren. Vermeld alleen proxy's die je beheert. Loopback-vermeldingen blijven geldig voor same-host proxy-/lokale-detectiesetups (bijvoorbeeld Tailscale Serve of een lokale reverse proxy), maar ze maken loopbackverzoeken **niet** geschikt voor `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: wanneer `true`, accepteert de Gateway `X-Real-IP` als `X-Forwarded-For` ontbreekt. Standaard `false` voor fail-closed gedrag.
- `gateway.nodes.pairing.autoApproveCidrs`: optionele CIDR/IP-allowlist voor het automatisch goedkeuren van eerste node-devicekoppeling zonder aangevraagde scopes. Dit is uitgeschakeld wanneer niet ingesteld. Dit keurt operator-/browser-/bedienings-UI-/WebChat-koppeling niet automatisch goed, en keurt ook geen upgrades van rollen, scopes, metadata of publieke sleutels automatisch goed.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globale allow/deny-vormgeving voor gedeclareerde node-commando's na koppeling en evaluatie van de platformallowlist. Gebruik `allowCommands` om gevaarlijke node-commando's zoals `camera.snap`, `camera.clip` en `screen.record` expliciet toe te staan; `denyCommands` verwijdert een commando zelfs als een platformstandaard of expliciete allow het anders zou opnemen. Nadat een node zijn gedeclareerde commandolijst wijzigt, wijs je die devicekoppeling af en keur je deze opnieuw goed, zodat de Gateway de bijgewerkte commandsnapshot opslaat.
- `gateway.tools.deny`: extra toolnamen die worden geblokkeerd voor HTTP `POST /tools/invoke` (breidt de standaard denylist uit).
- `gateway.tools.allow`: verwijder toolnamen uit de standaard HTTP-denylist.

</Accordion>

### OpenAI-compatibele eindpunten

- Chat Completions: standaard uitgeschakeld. Schakel in met `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Versteviging voor URL-invoer van responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Lege allowlists worden behandeld als niet ingesteld; gebruik `gateway.http.endpoints.responses.files.allowUrl=false`
    en/of `gateway.http.endpoints.responses.images.allowUrl=false` om URL-ophalen uit te schakelen.
- Optionele header voor response-versteviging:
  - `gateway.http.securityHeaders.strictTransportSecurity` (stel alleen in voor HTTPS-origins die je beheert; zie [Authenticatie via vertrouwde proxy](/nl/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolatie van meerdere instanties

Voer meerdere Gateways op één host uit met unieke poorten en state-dirs:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Gemaksvlaggen: `--dev` (gebruikt `~/.openclaw-dev` + poort `19001`), `--profile <name>` (gebruikt `~/.openclaw-<name>`).

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

- `enabled`: schakelt TLS-terminatie in bij de Gateway-listener (HTTPS/WSS) (standaard: `false`).
- `autoGenerate`: genereert automatisch een lokaal self-signed certificaat/sleutelpaar wanneer expliciete bestanden niet zijn geconfigureerd; alleen voor lokaal/dev-gebruik.
- `certPath`: bestandssysteempad naar het TLS-certificaatbestand.
- `keyPath`: bestandssysteempad naar het bestand met de TLS-private key; houd permissies beperkt.
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
  - `"off"`: negeer livebewerkingen; wijzigingen vereisen een expliciete herstart.
  - `"restart"`: herstart het Gateway-proces altijd bij configuratiewijziging.
  - `"hot"`: pas wijzigingen binnen het proces toe zonder herstart.
  - `"hybrid"` (standaard): probeer eerst hot reload; val terug op herstart indien vereist.
- `debounceMs`: debouncevenster in ms voordat configuratiewijzigingen worden toegepast (niet-negatief geheel getal).
- `deferralTimeoutMs`: optionele maximale tijd in ms om te wachten op lopende bewerkingen voordat een herstart wordt afgedwongen. Laat weg om de standaard begrensde wachttijd (`300000`) te gebruiken; stel `0` in om onbeperkt te wachten en periodieke waarschuwingen over nog lopende bewerkingen te loggen.

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
- `hooks.token` moet **verschillen** van `gateway.auth.token`; hergebruik van het Gateway-token wordt geweigerd.
- `hooks.path` mag niet `/` zijn; gebruik een toegewijd subpad zoals `/hooks`.
- Als `hooks.allowRequestSessionKey=true`, beperk dan `hooks.allowedSessionKeyPrefixes` (bijvoorbeeld `["hook:"]`).
- Als een mapping of preset een getemplate `sessionKey` gebruikt, stel dan `hooks.allowedSessionKeyPrefixes` en `hooks.allowRequestSessionKey=true` in. Statische mappingsleutels vereisen die opt-in niet.

**Eindpunten:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` uit de requestpayload wordt alleen geaccepteerd wanneer `hooks.allowRequestSessionKey=true` (standaard: `false`).
- `POST /hooks/<name>` → opgelost via `hooks.mappings`
  - Door templates gerenderde mappingwaarden voor `sessionKey` worden behandeld als extern aangeleverd en vereisen ook `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` komt overeen met het subpad na `/hooks` (bijv. `/hooks/gmail` → `gmail`).
- `match.source` komt overeen met een payloadveld voor generieke paden.
- Templates zoals `{{messages[0].subject}}` lezen uit de payload.
- `transform` kan verwijzen naar een JS/TS-module die een hookactie retourneert.
  - `transform.module` moet een relatief pad zijn en blijft binnen `hooks.transformsDir` (absolute paden en traversal worden geweigerd).
  - Houd `hooks.transformsDir` onder `~/.openclaw/hooks/transforms`; workspace-skillmappen worden geweigerd. Als `openclaw doctor` dit pad als ongeldig rapporteert, verplaats de transformmodule dan naar de hooks-transformmap of verwijder `hooks.transformsDir`.
- `agentId` routeert naar een specifieke agent; onbekende ID's vallen terug op de standaard.
- `allowedAgentIds`: beperkt expliciete routering (`*` of weggelaten = alles toestaan, `[]` = alles weigeren).
- `defaultSessionKey`: optionele vaste sessiesleutel voor hook-agentuitvoeringen zonder expliciete `sessionKey`.
- `allowRequestSessionKey`: sta aanroepers van `/hooks/agent` en templategestuurde mappingsessiesleutels toe om `sessionKey` in te stellen (standaard: `false`).
- `allowedSessionKeyPrefixes`: optionele allowlist met prefixen voor expliciete `sessionKey`-waarden (request + mapping), bijv. `["hook:"]`. Dit wordt verplicht wanneer een mapping of preset een getemplate `sessionKey` gebruikt.
- `deliver: true` stuurt het definitieve antwoord naar een kanaal; `channel` is standaard `last`.
- `model` overschrijft de LLM voor deze hookuitvoering (moet zijn toegestaan als de modelcatalogus is ingesteld).

</Accordion>

### Gmail-integratie

- De ingebouwde Gmail-preset gebruikt `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Als je die routering per bericht behoudt, stel dan `hooks.allowRequestSessionKey: true` in en beperk `hooks.allowedSessionKeyPrefixes` zodat deze overeenkomen met de Gmail-naamruimte, bijvoorbeeld `["hook:", "hook:gmail:"]`.
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
- Niet-loopback-binds: canvasroutes vereisen Gateway-auth (token/wachtwoord/trusted-proxy), net als andere Gateway-HTTP-oppervlakken.
- Node WebViews verzenden doorgaans geen auth-headers; nadat een Node is gekoppeld en verbonden, adverteert de Gateway Node-gescoped capability-URL's voor canvas-/A2UI-toegang.
- Capability-URL's zijn gebonden aan de actieve Node-WS-sessie en verlopen snel. IP-gebaseerde fallback wordt niet gebruikt.
- Injecteert live-reload-client in geserveerde HTML.
- Maakt automatisch een starter-`index.html` aan wanneer leeg.
- Serveert A2UI ook op `/__openclaw__/a2ui/`.
- Wijzigingen vereisen een Gateway-herstart.
- Schakel live reload uit voor grote mappen of `EMFILE`-fouten.

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

- `minimal` (standaard wanneer de gebundelde `bonjour`-Plugin is ingeschakeld): laat `cliPath` + `sshPort` weg uit TXT-records.
- `full`: neem `cliPath` + `sshPort` op; LAN-multicastadvertising vereist nog steeds dat de gebundelde `bonjour`-Plugin is ingeschakeld.
- `off`: onderdrukt LAN-multicastadvertising zonder de Plugin-inschakeling te wijzigen.
- De gebundelde `bonjour`-Plugin start automatisch op macOS-hosts en is opt-in op Linux, Windows en gecontaineriseerde Gateway-deployments.
- Hostnaam gebruikt standaard de systeemhostnaam wanneer die een geldig DNS-label is, met fallback naar `openclaw`. Overschrijf met `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Schrijft een unicast DNS-SD-zone onder `~/.openclaw/dns/`. Voor discovery over netwerken heen, combineer met een DNS-server (CoreDNS aanbevolen) + Tailscale split DNS.

Setup: `openclaw dns setup --apply`.

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

Verwijs naar omgevingsvariabelen in elke configuratietekenreeks met `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Alleen namen in hoofdletters komen overeen: `[A-Z_][A-Z0-9_]*`.
- Ontbrekende/lege variabelen veroorzaken een fout bij het laden van de configuratie.
- Escape met `$${VAR}` voor een letterlijke `${VAR}`.
- Werkt met `$include`.

---

## Geheimen

Geheime refs zijn additief: platte-tekstwaarden blijven werken.

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
- `source: "exec"` ids mogen geen door slashes gescheiden padsegmenten met `.` of `..` bevatten (bijvoorbeeld `a/../b` wordt geweigerd)

### Ondersteund referentieoppervlak voor credentials

- Canonieke matrix: [SecretRef-referentieoppervlak voor credentials](/nl/reference/secretref-credential-surface)
- `secrets apply` richt zich op ondersteunde credentialpaden in `openclaw.json`.
- `auth-profiles.json`-refs zijn opgenomen in runtime-resolutie en auditdekking.

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
- Paden van file- en exec-providers falen gesloten wanneer Windows ACL-verificatie niet beschikbaar is. Stel `allowInsecurePath: true` alleen in voor vertrouwde paden die niet kunnen worden geverifieerd.
- De `exec`-provider vereist een absoluut `command`-pad en gebruikt protocolpayloads op stdin/stdout.
- Standaard worden symlink-commandopaden geweigerd. Stel `allowSymlinkCommand: true` in om symlinkpaden toe te staan terwijl het opgeloste doelpad wordt gevalideerd.
- Als `trustedDirs` is geconfigureerd, wordt de trusted-dir-controle toegepast op het opgeloste doelpad.
- De child-omgeving van `exec` is standaard minimaal; geef vereiste variabelen expliciet door met `passEnv`.
- Secret refs worden tijdens activatie opgelost naar een in-memory snapshot; daarna lezen aanvraagpaden alleen de snapshot.
- Filtering op actief oppervlak wordt toegepast tijdens activatie: onopgeloste refs op ingeschakelde oppervlakken laten opstarten/herladen falen, terwijl inactieve oppervlakken met diagnostiek worden overgeslagen.

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

- Per-agentprofielen worden opgeslagen op `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` ondersteunt refs op waardeniveau (`keyRef` voor `api_key`, `tokenRef` voor `token`) voor statische credentialmodi.
- Verouderde platte `auth-profiles.json`-mappings zoals `{ "provider": { "apiKey": "..." } }` zijn geen runtimeformaat; `openclaw doctor --fix` herschrijft ze naar canonieke `provider:default` API-sleutelprofielen met een `.legacy-flat.*.bak`-back-up.
- Profielen in OAuth-modus (`auth.profiles.<id>.mode = "oauth"`) ondersteunen geen door SecretRef ondersteunde auth-profielcredentials.
- Statische runtimecredentials komen uit in-memory opgeloste snapshots; verouderde statische `auth.json`-vermeldingen worden opgeschoond wanneer ze worden gevonden.
- Verouderde OAuth-imports komen uit `~/.openclaw/credentials/oauth.json`.
- Zie [OAuth](/nl/concepts/oauth).
- Secrets-runtimegedrag en `audit/configure/apply`-tooling: [Secretsbeheer](/nl/gateway/secrets).

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

- `billingBackoffHours`: basisbackoff in uren wanneer een profiel faalt door echte
  facturerings-/onvoldoende-tegoedfouten (standaard: `5`). Expliciete factureringstekst kan
  hier nog steeds terechtkomen, zelfs bij `401`/`403`-reacties, maar providerspecifieke
  tekstmatchers blijven beperkt tot de provider die ze bezit (bijvoorbeeld OpenRouter
  `Key limit exceeded`). Opnieuw te proberen HTTP `402`-berichten voor gebruiksvensters of
  bestedingslimieten voor organisatie/werkruimte blijven in plaats daarvan in het `rate_limit`-pad.
- `billingBackoffHoursByProvider`: optionele overschrijvingen per provider voor factureringsbackoff in uren.
- `billingMaxHours`: limiet in uren voor exponentiële groei van factureringsbackoff (standaard: `24`).
- `authPermanentBackoffMinutes`: basisbackoff in minuten voor zeer betrouwbare `auth_permanent`-fouten (standaard: `10`).
- `authPermanentMaxMinutes`: limiet in minuten voor `auth_permanent`-backoffgroei (standaard: `60`).
- `failureWindowHours`: voortschrijdend venster in uren dat wordt gebruikt voor backofftellers (standaard: `24`).
- `overloadedProfileRotations`: maximumaantal auth-profielrotaties bij dezelfde provider voor overbelastingsfouten voordat wordt overgeschakeld naar modelterugval (standaard: `1`). Provider-bezet-vormen zoals `ModelNotReadyException` komen hier terecht.
- `overloadedBackoffMs`: vaste vertraging voordat een overbelaste provider-/profielrotatie opnieuw wordt geprobeerd (standaard: `0`).
- `rateLimitedProfileRotations`: maximumaantal auth-profielrotaties bij dezelfde provider voor rate-limitfouten voordat wordt overgeschakeld naar modelterugval (standaard: `1`). Die rate-limitbucket omvat provider-vormgegeven tekst zoals `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` en `resource exhausted`.

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

- Standaard logbestand: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Stel `logging.file` in voor een stabiel pad.
- `consoleLevel` gaat naar `debug` wanneer `--verbose` is ingesteld.
- `maxFileBytes`: maximale grootte van het actieve logbestand in bytes vóór rotatie (positief geheel getal; standaard: `104857600` = 100 MB). OpenClaw bewaart maximaal vijf genummerde archieven naast het actieve bestand.
- `redactSensitive` / `redactPatterns`: best-effort maskering voor console-uitvoer, bestandslogs, OTLP-logrecords en opgeslagen sessietranscripttekst. `redactSensitive: "off"` schakelt alleen dit algemene log-/transcriptbeleid uit; UI-/tool-/diagnostische veiligheidsoppervlakken redigeren geheimen nog steeds vóór verzending.

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
- `flags`: array met flagstrings die gerichte loguitvoer inschakelen (ondersteunt jokertekens zoals `"telegram.*"` of `"*"`).
- `stuckSessionWarnMs`: leeftijdsdrempel zonder voortgang in ms voor het classificeren van langlopende verwerkingssessies als `session.long_running`, `session.stalled` of `session.stuck`. Antwoorden, tools, status, blokken en ACP-voortgang resetten de timer; herhaalde `session.stuck`-diagnostiek gebruikt backoff zolang er niets verandert.
- `stuckSessionAbortMs`: leeftijdsdrempel zonder voortgang in ms voordat in aanmerking komend vastgelopen actief werk via abort-drain kan worden hersteld. Wanneer niet ingesteld gebruikt OpenClaw het veiligere verlengde venster voor embedded runs van ten minste 10 minuten en 5x `stuckSessionWarnMs`.
- `otel.enabled`: schakelt de OpenTelemetry-exportpipeline in (standaard: `false`). Zie [OpenTelemetry-export](/nl/gateway/opentelemetry) voor de volledige configuratie, signaalcatalogus en het privacymodel.
- `otel.endpoint`: collector-URL voor OTel-export.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: optionele signaalspecifieke OTLP-eindpunten. Wanneer ingesteld overschrijven ze `otel.endpoint` alleen voor dat signaal.
- `otel.protocol`: `"http/protobuf"` (standaard) of `"grpc"`.
- `otel.headers`: extra HTTP/gRPC-metadataheaders die met OTel-exportverzoeken worden verzonden.
- `otel.serviceName`: servicenaam voor resource-attributen.
- `otel.traces` / `otel.metrics` / `otel.logs`: schakel trace-, metrics- of logexport in.
- `otel.sampleRate`: trace-samplingrate `0`-`1`.
- `otel.flushIntervalMs`: periodiek telemetry-flushinterval in ms.
- `otel.captureContent`: opt-in vastleggen van ruwe inhoud voor OTEL-spanattributen. Standaard uitgeschakeld. Boolean `true` legt niet-systeem bericht-/toolinhoud vast; met de objectvorm kun je `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` en `systemPrompt` expliciet inschakelen.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: omgevingsschakelaar voor de nieuwste experimentele GenAI-spanproviderattributen. Standaard behouden spans het legacy-attribuut `gen_ai.system` voor compatibiliteit; GenAI-metrics gebruiken begrensde semantische attributen.
- `OPENCLAW_OTEL_PRELOADED=1`: omgevingsschakelaar voor hosts die al een globale OpenTelemetry-SDK hebben geregistreerd. OpenClaw slaat dan Plugin-eigen SDK-opstart/-afsluiting over terwijl diagnostische listeners actief blijven.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` en `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: signaalspecifieke eindpunt-env-vars die worden gebruikt wanneer de overeenkomende configuratiesleutel niet is ingesteld.
- `cacheTrace.enabled`: log cachetracesnapshots voor embedded runs (standaard: `false`).
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
- `auto.stableDelayHours`: minimale vertraging in uren voordat het stable-kanaal automatisch wordt toegepast (standaard: `6`; max: `168`).
- `auto.stableJitterHours`: extra uitrolspreidingsvenster in uren voor het stable-kanaal (standaard: `12`; max: `168`).
- `auto.betaCheckIntervalHours`: hoe vaak beta-kanaalcontroles worden uitgevoerd in uren (standaard: `1`; max: `24`).

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

- `enabled`: globale ACP-featuregate (standaard: `true`; stel in op `false` om ACP-dispatch en spawn-bediening te verbergen).
- `dispatch.enabled`: onafhankelijke gate voor ACP-sessiebeurtdispatch (standaard: `true`). Stel in op `false` om ACP-opdrachten beschikbaar te houden terwijl uitvoering wordt geblokkeerd.
- `backend`: standaard ACP-runtimebackend-id (moet overeenkomen met een geregistreerde ACP-runtime-Plugin).
  Installeer eerst de backend-Plugin en neem, als `plugins.allow` is ingesteld, de backend-Plugin-id op (bijvoorbeeld `acpx`), anders wordt de ACP-backend niet geladen.
- `defaultAgent`: fallback-ACP-doelagent-id wanneer spawns geen expliciet doel opgeven.
- `allowedAgents`: allowlist van agent-id's die zijn toegestaan voor ACP-runtimesessies; leeg betekent geen aanvullende beperking.
- `maxConcurrentSessions`: maximumaantal gelijktijdig actieve ACP-sessies.
- `stream.coalesceIdleMs`: idle-flushvenster in ms voor gestreamde tekst.
- `stream.maxChunkChars`: maximale chunkgrootte voordat gestreamde blokprojectie wordt opgesplitst.
- `stream.repeatSuppression`: onderdruk herhaalde status-/toolregels per beurt (standaard: `true`).
- `stream.deliveryMode`: `"live"` streamt incrementeel; `"final_only"` buffert tot terminale beurtgebeurtenissen.
- `stream.hiddenBoundarySeparator`: scheidingsteken vóór zichtbare tekst na verborgen toolgebeurtenissen (standaard: `"paragraph"`).
- `stream.maxOutputChars`: maximumaantal assistentuitvoertekens dat per ACP-beurt wordt geprojecteerd.
- `stream.maxSessionUpdateChars`: maximumaantal tekens voor geprojecteerde ACP-status-/updateregels.
- `stream.tagVisibility`: record van tagnamen naar booleaanse zichtbaarheidsoverschrijvingen voor gestreamde gebeurtenissen.
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
  - `"off"`: geen taglinetekst (bannertitel/-versie wordt nog steeds weergegeven).
- Stel env `OPENCLAW_HIDE_BANNER=1` in om de hele banner te verbergen (niet alleen taglines).

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

Zie de identiteitsvelden van `agents.list` onder [Agentstandaarden](/nl/gateway/config-agents#agent-defaults).

---

## Bridge (legacy, verwijderd)

Huidige builds bevatten de TCP-bridge niet meer. Nodes verbinden via de Gateway WebSocket. `bridge.*`-sleutels maken geen deel meer uit van het configuratieschema (validatie faalt totdat ze zijn verwijderd; `openclaw doctor --fix` kan onbekende sleutels verwijderen).

<Accordion title="Legacy bridgeconfiguratie (historische referentie)">

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

- `sessionRetention`: hoelang voltooide geïsoleerde Cron-uitvoersessies worden bewaard voordat ze uit `sessions.json` worden opgeschoond. Regelt ook het opruimen van gearchiveerde verwijderde Cron-transcripten. Standaard: `24h`; stel in op `false` om uit te schakelen.
- `runLog.maxBytes`: maximale grootte per uitvoerlogbestand (`cron/runs/<jobId>.jsonl`) voordat er wordt opgeschoond. Standaard: `2_000_000` bytes.
- `runLog.keepLines`: nieuwste regels die behouden blijven wanneer opschoning van uitvoerlogs wordt geactiveerd. Standaard: `2000`.
- `webhookToken`: bearer-token dat wordt gebruikt voor Cron Webhook POST-aflevering (`delivery.mode = "webhook"`); indien weggelaten wordt er geen auth-header verzonden.
- `webhook`: verouderde legacy fallback-Webhook-URL (http/https), alleen gebruikt voor opgeslagen taken die nog `notify: true` hebben.

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
- `mode`: `"announce"` of `"webhook"`; standaard `"announce"` wanneer er voldoende doelgegevens zijn.
- `channel`: kanaaloverride voor announce-aflevering. `"last"` hergebruikt het laatst bekende afleverkanaal.
- `to`: expliciet announce-doel of Webhook-URL. Vereist voor Webhook-modus.
- `accountId`: optionele accountoverride voor aflevering.
- Per-taak `delivery.failureDestination` overschrijft deze globale standaard.
- Wanneer er geen globale of per-taak foutbestemming is ingesteld, vallen taken die al via `announce` afleveren bij fouten terug op dat primaire announce-doel.
- `delivery.failureDestination` wordt alleen ondersteund voor `sessionTarget="isolated"`-taken, tenzij de primaire `delivery.mode` van de taak `"webhook"` is.

Zie [Cron-taken](/nl/automation/cron-jobs). Geïsoleerde Cron-uitvoeringen worden bijgehouden als [achtergrondtaken](/nl/automation/tasks).

---

## Sjabloonvariabelen voor mediamodellen

Sjabloonplaatshouders die worden uitgebreid in `tools.media.models[].args`:

| Variabele          | Beschrijving                                      |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Volledige binnenkomende berichttekst              |
| `{{RawBody}}`      | Ruwe tekst (zonder geschiedenis-/afzenderwrappers) |
| `{{BodyStripped}}` | Tekst waaruit groepsvermeldingen zijn verwijderd  |
| `{{From}}`         | Afzender-ID                                       |
| `{{To}}`           | Bestemmings-ID                                    |
| `{{MessageSid}}`   | Kanaalbericht-id                                  |
| `{{SessionId}}`    | Huidige sessie-UUID                               |
| `{{IsNewSession}}` | `"true"` wanneer een nieuwe sessie is aangemaakt  |
| `{{MediaUrl}}`     | Binnenkomende media-pseudo-URL                    |
| `{{MediaPath}}`    | Lokaal mediapad                                   |
| `{{MediaType}}`    | Mediatype (afbeelding/audio/document/…)           |
| `{{Transcript}}`   | Audiotranscript                                   |
| `{{Prompt}}`       | Opgeloste mediaprompt voor CLI-items              |
| `{{MaxChars}}`     | Opgelost maximaal aantal uitvoertekens voor CLI-items |
| `{{ChatType}}`     | `"direct"` of `"group"`                           |
| `{{GroupSubject}}` | Groepsonderwerp (best effort)                     |
| `{{GroupMembers}}` | Voorbeeldweergave van groepsleden (best effort)   |
| `{{SenderName}}`   | Weergavenaam van afzender (best effort)           |
| `{{SenderE164}}`   | Telefoonnummer van afzender (best effort)         |
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

**Merge-gedrag:**

- Eén bestand: vervangt het omvattende object.
- Array met bestanden: diep gemerged in volgorde (latere waarden overschrijven eerdere).
- Sleutels op hetzelfde niveau: gemerged na includes (overschrijven opgenomen waarden).
- Geneste includes: tot 10 niveaus diep.
- Paden: opgelost relatief ten opzichte van het include-bestand, maar moeten binnen de configuratiemap op het hoogste niveau blijven (`dirname` van `openclaw.json`). Absolute/`../`-vormen zijn alleen toegestaan wanneer ze nog steeds binnen die grens uitkomen.
- Schrijfacties van OpenClaw die slechts één top-level sectie wijzigen die wordt ondersteund door een include met één bestand, schrijven door naar dat opgenomen bestand. `plugins install` werkt bijvoorbeeld `plugins: { $include: "./plugins.json5" }` bij in `plugins.json5` en laat `openclaw.json` intact.
- Root-includes, include-arrays en includes met sibling-overrides zijn alleen-lezen voor schrijfacties van OpenClaw; die schrijfacties falen gesloten in plaats van de configuratie plat te maken.
- Fouten: duidelijke berichten voor ontbrekende bestanden, parseerfouten en circulaire includes.

---

_Gerelateerd: [Configuratie](/nl/gateway/configuration) · [Configuratievoorbeelden](/nl/gateway/configuration-examples) · [Doctor](/nl/gateway/doctor)_

## Gerelateerd

- [Configuratie](/nl/gateway/configuration)
- [Configuratievoorbeelden](/nl/gateway/configuration-examples)
