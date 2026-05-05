---
read_when:
    - Je hebt exacte configuratiesemantiek of standaardwaarden op veldniveau nodig
    - U valideert kanaal-, model-, Gateway- of toolconfiguratieblokken
summary: Gateway-configuratiereferentie voor OpenClaw-kernsleutels, standaardwaarden en links naar specifieke subsystemreferenties
title: Configuratiereferentie
x-i18n:
    generated_at: "2026-05-05T01:46:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82164a3ea7592f667573b643ee9e0ec840b9b622c9d86c382a3feaf192e75684
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Core configuratiereferentie voor `~/.openclaw/openclaw.json`. Zie [Configuratie](/nl/gateway/configuration) voor een taakgericht overzicht.

Behandelt de belangrijkste OpenClaw-configuratieoppervlakken en linkt door wanneer een subsysteem een eigen diepgaandere referentie heeft. Kanaal- en pluginbeheerde opdrachtcatalogi en diepe geheugen-/QMD-instellingen staan op hun eigen pagina's in plaats van op deze.

Codebron:

- `openclaw config schema` toont het live JSON Schema dat wordt gebruikt voor validatie en Control UI, met meegeleverde/plugin-/kanaalmetadata samengevoegd wanneer beschikbaar
- `config.schema.lookup` retourneert één padgebonden schemaknooppunt voor drill-downtooling
- `pnpm config:docs:check` / `pnpm config:docs:gen` valideren de baseline-hash van de configuratiedocumentatie tegen het huidige schemaoppervlak

Agent-opzoekpad: gebruik de `gateway`-toolactie `config.schema.lookup` voor
exacte documentatie en beperkingen op veldniveau vóór bewerkingen. Gebruik
[Configuratie](/nl/gateway/configuration) voor taakgerichte begeleiding en deze pagina
voor de bredere veldkaart, standaardwaarden en links naar subsysteemreferenties.

Specifieke diepe referenties:

- [Referentie voor geheugenconfiguratie](/nl/reference/memory-config) voor `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` en dreaming-configuratie onder `plugins.entries.memory-core.config.dreaming`
- [Slash-opdrachten](/nl/tools/slash-commands) voor de huidige ingebouwde + meegeleverde opdrachtcatalogus
- eigenaarskanaal-/pluginpagina's voor kanaalspecifieke opdrachtoppervlakken

Configuratie-indeling is **JSON5** (commentaar + afsluitende komma's toegestaan). Alle velden zijn optioneel — OpenClaw gebruikt veilige standaardwaarden wanneer ze worden weggelaten.

---

## Kanalen

Configuratiesleutels per kanaal zijn verplaatst naar een aparte pagina — zie
[Configuratie — kanalen](/nl/gateway/config-channels) voor `channels.*`,
inclusief Slack, Discord, Telegram, WhatsApp, Matrix, iMessage en andere
meegeleverde kanalen (authenticatie, toegangscontrole, meerdere accounts, mention-gating).

## Agentstandaardwaarden, meerdere agents, sessies en berichten

Verplaatst naar een aparte pagina — zie
[Configuratie — agents](/nl/gateway/config-agents) voor:

- `agents.defaults.*` (werkruimte, model, denken, Heartbeat, geheugen, media, skills, sandbox)
- `multiAgent.*` (multi-agentroutering en bindings)
- `session.*` (sessielevenscyclus, Compaction, pruning)
- `messages.*` (berichtbezorging, TTS, markdown-rendering)
- `talk.*` (Talk-modus)
  - `talk.speechLocale`: optionele BCP 47-locale-id voor Talk-spraakherkenning op iOS/macOS
  - `talk.silenceTimeoutMs`: wanneer niet ingesteld, behoudt Talk het standaard pauzevenster van het platform voordat het transcript wordt verzonden (`700 ms on macOS and Android, 900 ms on iOS`)

## Tools en aangepaste providers

Toolbeleid, experimentele schakelaars, providergebaseerde toolconfiguratie en aangepaste
provider- / base-URL-instelling zijn verplaatst naar een aparte pagina — zie
[Configuratie — tools en aangepaste providers](/nl/gateway/config-tools).

## Modellen

Providerdefinities, model-allowlists en aangepaste providerinstelling staan in
[Configuratie — tools en aangepaste providers](/nl/gateway/config-tools#custom-providers-and-base-urls).
De `models`-root beheert ook globaal gedrag voor de modelcatalogus.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: gedrag van providercatalogus (`merge` of `replace`).
- `models.providers`: aangepaste provider-map gesleuteld op provider-id.
- `models.pricing.enabled`: beheert de achtergrond-pricing-bootstrap die
  start nadat sidecars en kanalen het Gateway-ready-pad bereiken. Wanneer `false`,
  slaat de Gateway OpenRouter- en LiteLLM-prijscatalogusophalingen over; geconfigureerde
  `models.providers.*.models[].cost`-waarden blijven werken voor lokale kostenschattingen.

## MCP

Door OpenClaw beheerde MCP-serverdefinities staan onder `mcp.servers` en worden
gebruikt door embedded Pi en andere runtime-adapters. De opdrachten `openclaw mcp list`,
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
  Externe vermeldingen gebruiken `transport: "streamable-http"` of `transport: "sse"`;
  `type: "http"` is een CLI-native alias die `openclaw mcp set` en
  `openclaw doctor --fix` normaliseren naar het canonieke `transport`-veld.
- `mcp.sessionIdleTtlMs`: idle-TTL voor sessiegebonden meegeleverde MCP-runtimes.
  Eenmalige embedded runs vragen cleanup aan het einde van de run aan; deze TTL is de vangrail voor
  langlevende sessies en toekomstige aanroepers.
- Wijzigingen onder `mcp.*` worden hot toegepast door gecachte sessie-MCP-runtimes op te ruimen.
  De volgende tooldetectie/het volgende toolgebruik maakt ze opnieuw aan vanuit de nieuwe configuratie, zodat verwijderde
  `mcp.servers`-vermeldingen onmiddellijk worden opgeruimd in plaats van te wachten op idle-TTL.

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

- `allowBundled`: optionele allowlist alleen voor meegeleverde skills (beheerde/werkruimte-skills blijven onaangetast).
- `load.extraDirs`: extra gedeelde skill-roots (laagste prioriteit).
- `install.preferBrew`: wanneer true, geef de voorkeur aan Homebrew-installers wanneer `brew`
  beschikbaar is voordat wordt teruggevallen op andere installertypen.
- `install.nodeManager`: voorkeur voor Node-installer voor `metadata.openclaw.install`
  specs (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` schakelt een skill uit, zelfs als deze meegeleverd/geïnstalleerd is.
- `entries.<skillKey>.apiKey`: gemak voor skills die een primaire env-var declareren (platte-tekststring of SecretRef-object).

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
- Detectie accepteert native OpenClaw-plugins plus compatibele Codex-bundles en Claude-bundles, inclusief manifestloze Claude-default-layout-bundles.
- **Configuratiewijzigingen vereisen een Gateway-herstart.**
- `allow`: optionele allowlist (alleen vermelde plugins worden geladen). `deny` wint.
- `bundledDiscovery`: standaard ingesteld op `"allowlist"` voor nieuwe configuraties, zodat een niet-lege
  `plugins.allow` ook meegeleverde provider-plugins afschermt, inclusief web-search
  runtimeproviders. Doctor schrijft `"compat"` voor gemigreerde legacy-allowlist-
  configuraties om bestaand gedrag van meegeleverde providers te behouden totdat je opt-in doet.
- `plugins.entries.<id>.apiKey`: gemakveld voor API-sleutel op pluginniveau (wanneer ondersteund door de plugin).
- `plugins.entries.<id>.env`: plugin-scoped env-var-map.
- `plugins.entries.<id>.hooks.allowPromptInjection`: wanneer `false`, blokkeert core `before_prompt_build` en negeert prompt-wijzigende velden uit legacy `before_agent_start`, terwijl legacy `modelOverride` en `providerOverride` behouden blijven. Van toepassing op native plugin-hooks en ondersteunde door bundles geleverde hookmappen.
- `plugins.entries.<id>.hooks.allowConversationAccess`: wanneer `true`, mogen vertrouwde niet-meegeleverde plugins ruwe gespreksinhoud lezen uit getypeerde hooks zoals `llm_input`, `llm_output`, `before_agent_finalize` en `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: vertrouw deze plugin expliciet om per-run `provider`- en `model`-overrides aan te vragen voor achtergrondsubagent-runs.
- `plugins.entries.<id>.subagent.allowedModels`: optionele allowlist van canonieke `provider/model`-doelen voor vertrouwde subagent-overrides. Gebruik `"*"` alleen wanneer je bewust elk model wilt toestaan.
- `plugins.entries.<id>.config`: door plugin gedefinieerd configuratieobject (gevalideerd door native OpenClaw-plugin-schema wanneer beschikbaar).
- Account-/runtime-instellingen voor kanaalplugins staan onder `channels.<id>` en moeten worden beschreven door de metadata `channelConfigs` van het manifest van de beherende plugin, niet door een centraal OpenClaw-optieregister.
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl-instellingen voor web-fetch-provider.
  - `apiKey`: Firecrawl-API-sleutel (accepteert SecretRef). Valt terug op `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey` of `FIRECRAWL_API_KEY` env-var.
  - `baseUrl`: Firecrawl API-base-URL (standaard: `https://api.firecrawl.dev`; self-hosted overrides moeten private/interne endpoints targeten).
  - `onlyMainContent`: extraheer alleen de hoofdinhoud van pagina's (standaard: `true`).
  - `maxAgeMs`: maximale cacheleeftijd in milliseconden (standaard: `172800000` / 2 dagen).
  - `timeoutSeconds`: time-out voor scrape-aanvraag in seconden (standaard: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search-instellingen (Grok-webzoekopdracht).
  - `enabled`: schakel de X Search-provider in.
  - `model`: Grok-model om te gebruiken voor zoeken (bijv. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: memory-dreaming-instellingen. Zie [Dreaming](/nl/concepts/dreaming) voor fasen en drempels.
  - `enabled`: hoofdschakelaar voor dreaming (standaard `false`).
  - `frequency`: Cron-cadans voor elke volledige dreaming-sweep (standaard `"0 3 * * *"`).
  - `model`: optionele Dream Diary-subagent-modeloverride. Vereist `plugins.entries.memory-core.subagent.allowModelOverride: true`; combineer met `allowedModels` om doelen te beperken. Fouten door niet-beschikbare modellen worden één keer opnieuw geprobeerd met het standaardmodel van de sessie; trust- of allowlist-fouten vallen niet stilzwijgend terug.
  - fasebeleid en drempels zijn implementatiedetails (geen gebruikersgerichte configuratiesleutels).
- Volledige geheugenconfiguratie staat in [Referentie voor geheugenconfiguratie](/nl/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Ingeschakelde Claude-bundle-plugins kunnen ook embedded Pi-standaardwaarden bijdragen vanuit `settings.json`; OpenClaw past die toe als gesaneerde agentinstellingen, niet als ruwe OpenClaw-configuratiepatches.
- `plugins.slots.memory`: kies de actieve memory-plugin-id, of `"none"` om memory-plugins uit te schakelen.
- `plugins.slots.contextEngine`: kies de actieve context-engine-plugin-id; standaard `"legacy"` tenzij je een andere engine installeert en selecteert.

Zie [Plugins](/nl/tools/plugin).

---

## Toezeggingen

`commitments` beheert afgeleid follow-upgeheugen: OpenClaw kan check-ins detecteren uit gespreksbeurten en ze leveren via Heartbeat-runs.

- `commitments.enabled`: schakel verborgen LLM-extractie, opslag en Heartbeat-levering in voor afgeleide follow-up-toezeggingen. Standaard: `false`.
- `commitments.maxPerDay`: maximum aantal afgeleide follow-up-toezeggingen dat per agentsessie in een voortschrijdende dag wordt geleverd. Standaard: `3`.

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
- `tabCleanup` ruimt bijgehouden tabbladen van primaire agents op na inactiviteit of wanneer een sessie de limiet overschrijdt. Stel `idleMinutes: 0` of `maxTabsPerSession: 0` in om die afzonderlijke opschoonmodi uit te schakelen.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` is uitgeschakeld wanneer deze niet is ingesteld, zodat browsernavigatie standaard strikt blijft.
- Stel `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` alleen in wanneer je browsernavigatie via privénetwerken bewust vertrouwt.
- In strikte modus vallen externe CDP-profieleindpunten (`profiles.*.cdpUrl`) onder dezelfde blokkering voor privénetwerken tijdens bereikbaarheids- en detectiecontroles.
- `ssrfPolicy.allowPrivateNetwork` blijft ondersteund als verouderde alias.
- Gebruik in strikte modus `ssrfPolicy.hostnameAllowlist` en `ssrfPolicy.allowedHostnames` voor expliciete uitzonderingen.
- Externe profielen zijn attach-only (starten/stoppen/resetten uitgeschakeld).
- `profiles.*.cdpUrl` accepteert `http://`, `https://`, `ws://` en `wss://`. Gebruik HTTP(S) wanneer je wilt dat OpenClaw `/json/version` detecteert; gebruik WS(S) wanneer je provider je een directe DevTools-WebSocket-URL geeft.
- `remoteCdpTimeoutMs` en `remoteCdpHandshakeTimeoutMs` gelden voor externe en `attachOnly` CDP-bereikbaarheid plus aanvragen voor het openen van tabbladen. Beheerde loopback-profielen behouden lokale CDP-standaardwaarden.
- Als een extern beheerde CDP-service bereikbaar is via loopback, stel dan voor dat profiel `attachOnly: true` in; anders behandelt OpenClaw de loopback-poort als een lokaal beheerd browserprofiel en kan het lokale fouten over poorteigendom melden.
- `existing-session`-profielen gebruiken Chrome MCP in plaats van CDP en kunnen koppelen op de geselecteerde host of via een verbonden browser-Node.
- `existing-session`-profielen kunnen `userDataDir` instellen om een specifiek Chromium-gebaseerd browserprofiel te gebruiken, zoals Brave of Edge.
- `existing-session`-profielen behouden de huidige routelimieten van Chrome MCP: snapshot-/ref-gestuurde acties in plaats van CSS-selector-targeting, uploadhooks voor één bestand, geen overrides voor dialoogtime-outs, geen `wait --load networkidle`, en geen `responsebody`, PDF-export, downloadonderschepping of batchacties.
- Lokaal beheerde `openclaw`-profielen wijzen `cdpPort` en `cdpUrl` automatisch toe; stel `cdpUrl` alleen expliciet in voor externe CDP.
- Lokaal beheerde profielen kunnen `executablePath` instellen om de globale `browser.executablePath` voor dat profiel te overschrijven. Gebruik dit om één profiel in Chrome en een ander in Brave uit te voeren.
- Lokaal beheerde profielen gebruiken `browser.localLaunchTimeoutMs` voor Chrome CDP HTTP-detectie na het starten van het proces en `browser.localCdpReadyTimeoutMs` voor CDP-websocketgereedheid na het starten. Verhoog ze op tragere hosts waar Chrome succesvol start maar gereedheidscontroles met het opstarten racen. Beide waarden moeten positieve gehele getallen tot `120000` ms zijn; ongeldige configuratiewaarden worden geweigerd.
- Volgorde voor automatische detectie: standaardbrowser indien Chromium-gebaseerd → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` en `browser.profiles.<name>.executablePath` accepteren allebei `~` en `~/...` voor de thuismap van je OS vóór het starten van Chromium. Per-profiel `userDataDir` op `existing-session`-profielen wordt ook met tilde uitgebreid.
- Controleservice: alleen loopback (poort afgeleid van `gateway.port`, standaard `18791`).
- `extraArgs` voegt extra startvlaggen toe aan lokaal Chromium-opstarten (bijvoorbeeld `--disable-gpu`, venstergrootte of debugvlaggen).

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
- `assistant`: identiteitsoverschrijving voor Control UI. Valt terug op de identiteit van de actieve agent.

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

- `mode`: `local` (Gateway uitvoeren) of `remote` (verbinden met externe Gateway). Gateway weigert te starten tenzij dit `local` is.
- `port`: één gemultiplexte poort voor WS + HTTP. Voorrang: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (standaard), `lan` (`0.0.0.0`), `tailnet` (alleen Tailscale-IP), of `custom`.
- **Legacy bind-aliassen**: gebruik bind-moduswaarden in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), geen hostaliassen (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-opmerking**: de standaard `loopback`-bind luistert op `127.0.0.1` binnen de container. Met Docker bridge-netwerken (`-p 18789:18789`) komt verkeer binnen op `eth0`, waardoor de Gateway niet bereikbaar is. Gebruik `--network host`, of stel `bind: "lan"` in (of `bind: "custom"` met `customBindHost: "0.0.0.0"`) om op alle interfaces te luisteren.
- **Auth**: standaard vereist. Niet-loopback-binds vereisen Gateway-authenticatie. In de praktijk betekent dit een gedeelde token/wachtwoord of een identiteitsbewuste reverse proxy met `gateway.auth.mode: "trusted-proxy"`. De onboardingwizard genereert standaard een token.
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd (inclusief SecretRefs), stel `gateway.auth.mode` expliciet in op `token` of `password`. Opstart- en service-installatie-/reparatiestromen mislukken wanneer beide zijn geconfigureerd en de modus niet is ingesteld.
- `gateway.auth.mode: "none"`: expliciete modus zonder authenticatie. Gebruik alleen voor vertrouwde local loopback-opstellingen; dit wordt bewust niet aangeboden door onboardingprompts.
- `gateway.auth.mode: "trusted-proxy"`: delegeer browser-/gebruikersauthenticatie aan een identiteitsbewuste reverse proxy en vertrouw identiteitsheaders van `gateway.trustedProxies` (zie [Authenticatie via vertrouwde proxy](/nl/gateway/trusted-proxy-auth)). Deze modus verwacht standaard een **niet-loopback** proxybron; same-host loopback-reverse-proxy's vereisen expliciet `gateway.auth.trustedProxy.allowLoopback = true`. Interne same-host-aanroepers kunnen `gateway.auth.password` gebruiken als lokale directe fallback; `gateway.auth.token` blijft wederzijds exclusief met trusted-proxy-modus.
- `gateway.auth.allowTailscale`: wanneer `true`, kunnen Tailscale Serve-identiteitsheaders voldoen aan authenticatie voor de bedienings-UI/WebSocket (geverifieerd via `tailscale whois`). HTTP API-endpoints gebruiken die Tailscale-headerauthenticatie **niet**; ze volgen in plaats daarvan de normale HTTP-authenticatiemodus van de Gateway. Deze tokenloze stroom gaat ervan uit dat de Gateway-host vertrouwd is. Staat standaard op `true` wanneer `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: optionele limiter voor mislukte authenticatie. Wordt toegepast per client-IP en per auth-scope (shared-secret en device-token worden afzonderlijk bijgehouden). Geblokkeerde pogingen retourneren `429` + `Retry-After`.
  - Op het asynchrone Tailscale Serve-pad voor de bedienings-UI worden mislukte pogingen voor dezelfde `{scope, clientIp}` geserialiseerd voordat de fout wordt geschreven. Gelijktijdige slechte pogingen vanaf dezelfde client kunnen daardoor de limiter activeren op het tweede verzoek in plaats van dat beide er als gewone mismatches doorheen racen.
  - `gateway.auth.rateLimit.exemptLoopback` staat standaard op `true`; stel dit in op `false` wanneer je bewust wilt dat localhost-verkeer ook rate-limited wordt (voor testopstellingen of strikte proxydeployments).
- Browser-origin WS-authenticatiepogingen worden altijd gethrottled met loopback-vrijstelling uitgeschakeld (defense-in-depth tegen browsergebaseerde brute force op localhost).
- Op loopback worden die browser-origin-lockouts geïsoleerd per genormaliseerde `Origin`
  waarde, zodat herhaalde fouten vanaf één localhost-origin niet automatisch
  een andere origin buitensluiten.
- `tailscale.mode`: `serve` (alleen tailnet, loopback-bind) of `funnel` (publiek, vereist authenticatie).
- `controlUi.allowedOrigins`: expliciete allowlist voor browser-origins voor Gateway WebSocket-verbindingen. Vereist wanneer browserclients worden verwacht vanaf niet-loopback-origins.
- `controlUi.chatMessageMaxWidth`: optionele maximale breedte voor gegroepeerde chatberichten in de bedienings-UI. Accepteert begrensde CSS-breedtewaarden zoals `960px`, `82%`, `min(1280px, 82%)` en `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gevaarlijke modus die Host-header-originfallback inschakelt voor deployments die bewust vertrouwen op Host-header-originbeleid.
- `remote.transport`: `ssh` (standaard) of `direct` (ws/wss). Voor `direct` moet `remote.url` `ws://` of `wss://` zijn.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: client-side procesomgevings-
  break-glass-override die plaintext `ws://` naar vertrouwde private-netwerk-
  IP's toestaat; de standaard blijft loopback-only voor plaintext. Er is geen
  `openclaw.json`-equivalent, en browserconfiguratie voor private netwerken zoals
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` heeft geen effect op Gateway
  WebSocket-clients.
- `gateway.remote.token` / `.password` zijn credentialvelden voor externe clients. Ze configureren Gateway-authenticatie niet op zichzelf.
- `gateway.push.apns.relay.baseUrl`: basis-HTTPS-URL voor de externe APNs-relay die wordt gebruikt door officiële/TestFlight-iOS-builds nadat ze relay-backed registraties naar de Gateway publiceren. Deze URL moet overeenkomen met de relay-URL die in de iOS-build is gecompileerd.
- `gateway.push.apns.relay.timeoutMs`: time-out voor Gateway-naar-relay-verzending in milliseconden. Standaard `10000`.
- Relay-backed registraties worden gedelegeerd aan een specifieke Gateway-identiteit. De gekoppelde iOS-app haalt `gateway.identity.get` op, neemt die identiteit op in de relayregistratie en stuurt een registratiespecifieke verzendtoekenning door naar de Gateway. Een andere Gateway kan die opgeslagen registratie niet hergebruiken.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: tijdelijke env-overrides voor de relayconfiguratie hierboven.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: development-only nooduitgang voor loopback-HTTP-relay-URL's. Productierelay-URL's moeten op HTTPS blijven.
- `gateway.handshakeTimeoutMs`: pre-auth Gateway WebSocket-handshake-time-out in milliseconden. Standaard: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` krijgt voorrang wanneer dit is ingesteld. Verhoog dit op belaste of energiezuinige hosts waar lokale clients kunnen verbinden terwijl de opstartopwarming nog stabiliseert.
- `gateway.channelHealthCheckMinutes`: interval voor kanaal-health-monitor in minuten. Stel `0` in om health-monitor-herstarts globaal uit te schakelen. Standaard: `5`.
- `gateway.channelStaleEventThresholdMinutes`: drempel voor verouderde sockets in minuten. Houd dit groter dan of gelijk aan `gateway.channelHealthCheckMinutes`. Standaard: `30`.
- `gateway.channelMaxRestartsPerHour`: maximale health-monitor-herstarts per kanaal/account in een voortschrijdend uur. Standaard: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per kanaal voor health-monitor-herstarts terwijl de globale monitor ingeschakeld blijft.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per account voor multi-account-kanalen. Wanneer ingesteld, krijgt dit voorrang boven de override op kanaalniveau.
- Lokale Gateway-aanroeppaden kunnen `gateway.remote.*` alleen als fallback gebruiken wanneer `gateway.auth.*` niet is ingesteld.
- Als `gateway.auth.token` / `gateway.auth.password` expliciet is geconfigureerd via SecretRef en niet kan worden opgelost, faalt de oplossing gesloten (geen remote fallback-masking).
- `trustedProxies`: IP's van reverse proxy's die TLS beëindigen of forwarded-client-headers injecteren. Vermeld alleen proxy's die je beheert. Loopback-vermeldingen blijven geldig voor same-host proxy-/lokale-detectieopstellingen (bijvoorbeeld Tailscale Serve of een lokale reverse proxy), maar ze maken loopback-verzoeken **niet** geschikt voor `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: wanneer `true`, accepteert de Gateway `X-Real-IP` als `X-Forwarded-For` ontbreekt. Standaard `false` voor fail-closed-gedrag.
- `gateway.nodes.pairing.autoApproveCidrs`: optionele CIDR/IP-allowlist voor het automatisch goedkeuren van eerste node-devicepairing zonder aangevraagde scopes. Dit is uitgeschakeld wanneer niet ingesteld. Dit keurt operator-/browser-/bedienings-UI-/WebChat-pairing niet automatisch goed, en keurt rol-, scope-, metadata- of public-key-upgrades niet automatisch goed.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globale allow/deny-vormgeving voor gedeclareerde node-commands na pairing en evaluatie van de platform-allowlist. Gebruik `allowCommands` om je aan te melden voor gevaarlijke node-commands zoals `camera.snap`, `camera.clip` en `screen.record`; `denyCommands` verwijdert een command zelfs als een platformstandaard of expliciete allow het anders zou opnemen. Nadat een node zijn gedeclareerde commandlijst wijzigt, wijs die devicepairing af en keur deze opnieuw goed zodat de Gateway de bijgewerkte command-snapshot opslaat.
- `gateway.tools.deny`: extra toolnamen die worden geblokkeerd voor HTTP `POST /tools/invoke` (breidt de standaard-denylist uit).
- `gateway.tools.allow`: verwijder toolnamen uit de standaard HTTP-denylist.

</Accordion>

### OpenAI-compatibele endpoints

- Chat Completions: standaard uitgeschakeld. Schakel in met `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Verharding van URL-input voor Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Lege allowlists worden behandeld als niet ingesteld; gebruik `gateway.http.endpoints.responses.files.allowUrl=false`
    en/of `gateway.http.endpoints.responses.images.allowUrl=false` om URL-fetching uit te schakelen.
- Optionele header voor responseverharding:
  - `gateway.http.securityHeaders.strictTransportSecurity` (stel alleen in voor HTTPS-origins die je beheert; zie [Authenticatie via vertrouwde proxy](/nl/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Multi-instance-isolatie

Voer meerdere Gateways op één host uit met unieke poorten en state-dirs:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Gemaksflags: `--dev` (gebruikt `~/.openclaw-dev` + poort `19001`), `--profile <name>` (gebruikt `~/.openclaw-<name>`).

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
- `autoGenerate`: genereert automatisch een lokaal self-signed cert/key-paar wanneer expliciete bestanden niet zijn geconfigureerd; alleen voor lokaal/dev-gebruik.
- `certPath`: bestandssysteempad naar het TLS-certificaatbestand.
- `keyPath`: bestandssysteempad naar het private-key-bestand voor TLS; houd rechten beperkt.
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

- `mode`: bepaalt hoe configwijzigingen tijdens runtime worden toegepast.
  - `"off"`: negeer livewijzigingen; wijzigingen vereisen een expliciete herstart.
  - `"restart"`: herstart altijd het Gateway-proces bij een configuratiewijziging.
  - `"hot"`: pas wijzigingen binnen het proces toe zonder te herstarten.
  - `"hybrid"` (standaard): probeer eerst hot reload; val terug op herstart indien vereist.
- `debounceMs`: debouncevenster in ms voordat configuratiewijzigingen worden toegepast (niet-negatief geheel getal).
- `deferralTimeoutMs`: optionele maximale tijd in ms om te wachten op lopende bewerkingen voordat een herstart wordt geforceerd. Laat weg om de standaard begrensde wachttijd (`300000`) te gebruiken; stel in op `0` om onbeperkt te wachten en periodieke waarschuwingen over nog openstaande bewerkingen te loggen.

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

Authenticatie: `Authorization: Bearer <token>` of `x-openclaw-token: <token>`.
Hook-tokens in de querystring worden geweigerd.

Validatie- en veiligheidsnotities:

- `hooks.enabled=true` vereist een niet-lege `hooks.token`.
- `hooks.token` moet **verschillen** van `gateway.auth.token`; hergebruik van het Gateway-token wordt geweigerd.
- `hooks.path` kan niet `/` zijn; gebruik een toegewijd subpad zoals `/hooks`.
- Als `hooks.allowRequestSessionKey=true` is, beperk dan `hooks.allowedSessionKeyPrefixes` (bijvoorbeeld `["hook:"]`).
- Als een mapping of preset een getemplate `sessionKey` gebruikt, stel dan `hooks.allowedSessionKeyPrefixes` en `hooks.allowRequestSessionKey=true` in. Statische mappingsleutels vereisen die opt-in niet.

**Eindpunten:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` uit de request-payload wordt alleen geaccepteerd wanneer `hooks.allowRequestSessionKey=true` is (standaard: `false`).
- `POST /hooks/<name>` → opgelost via `hooks.mappings`
  - Door templates gerenderde mappingwaarden voor `sessionKey` worden behandeld als extern aangeleverd en vereisen ook `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` komt overeen met het subpad na `/hooks` (bijv. `/hooks/gmail` → `gmail`).
- `match.source` komt overeen met een payloadveld voor generieke paden.
- Templates zoals `{{messages[0].subject}}` lezen uit de payload.
- `transform` kan verwijzen naar een JS/TS-module die een hookactie retourneert.
  - `transform.module` moet een relatief pad zijn en blijft binnen `hooks.transformsDir` (absolute paden en path traversal worden geweigerd).
  - Houd `hooks.transformsDir` onder `~/.openclaw/hooks/transforms`; workspace-Skills-mappen worden geweigerd. Als `openclaw doctor` dit pad als ongeldig rapporteert, verplaats dan de transformatiemodule naar de hooks-transformatiemap of verwijder `hooks.transformsDir`.
- `agentId` routeert naar een specifieke agent; onbekende ID's vallen terug op de standaard.
- `allowedAgentIds`: beperkt expliciete routering (`*` of weggelaten = alles toestaan, `[]` = alles weigeren).
- `defaultSessionKey`: optionele vaste sessiesleutel voor hook-agent-runs zonder expliciete `sessionKey`.
- `allowRequestSessionKey`: sta `/hooks/agent`-aanroepers en templategestuurde mapping-sessiesleutels toe om `sessionKey` in te stellen (standaard: `false`).
- `allowedSessionKeyPrefixes`: optionele allowlist met prefixen voor expliciete `sessionKey`-waarden (request + mapping), bijv. `["hook:"]`. Deze wordt verplicht wanneer een mapping of preset een getemplate `sessionKey` gebruikt.
- `deliver: true` stuurt het uiteindelijke antwoord naar een kanaal; `channel` staat standaard op `last`.
- `model` overschrijft de LLM voor deze hook-run (moet toegestaan zijn als de modelcatalogus is ingesteld).

</Accordion>

### Gmail-integratie

- De ingebouwde Gmail-preset gebruikt `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Als je die routering per bericht behoudt, stel dan `hooks.allowRequestSessionKey: true` in en beperk `hooks.allowedSessionKeyPrefixes` zodat deze overeenkomt met de Gmail-namespace, bijvoorbeeld `["hook:", "hook:gmail:"]`.
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
- Alleen lokaal: houd `gateway.bind: "loopback"` aan (standaard).
- Niet-loopback-bindings: canvas-routes vereisen Gateway-authenticatie (token/wachtwoord/vertrouwde proxy), hetzelfde als andere Gateway-HTTP-oppervlakken.
- Node-WebViews sturen meestal geen authenticatieheaders; nadat een node is gekoppeld en verbonden, adverteert de Gateway node-scoped capability-URL's voor canvas-/A2UI-toegang.
- Capability-URL's zijn gebonden aan de actieve node-WS-sessie en verlopen snel. Een IP-gebaseerde fallback wordt niet gebruikt.
- Injecteert de live-reload-client in geserveerde HTML.
- Maakt automatisch een startbestand `index.html` aan wanneer de map leeg is.
- Serveert A2UI ook op `/__openclaw__/a2ui/`.
- Wijzigingen vereisen een herstart van de gateway.
- Schakel live reload uit voor grote mappen of `EMFILE`-fouten.

---

## Ontdekking

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
- `off`: onderdruk LAN-multicastadvertising zonder de plugininschakeling te wijzigen.
- De gebundelde `bonjour`-plugin start automatisch op macOS-hosts en is opt-in op Linux, Windows en gecontaineriseerde Gateway-deployments.
- De hostnaam is standaard de systeemhostnaam wanneer dit een geldig DNS-label is, met fallback naar `openclaw`. Overschrijf dit met `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Schrijft een unicast-DNS-SD-zone onder `~/.openclaw/dns/`. Combineer voor cross-network-ontdekking met een DNS-server (CoreDNS aanbevolen) + Tailscale split DNS.

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
- `shellEnv`: importeert ontbrekende verwachte sleutels uit je inlogshellprofiel.
- Zie [Omgeving](/nl/help/environment) voor de volledige voorrang.

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

Geheime verwijzingen zijn additief: plattetekstwaarden blijven werken.

### `SecretRef`

Gebruik een enkele objectvorm:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validatie:

- `provider`-patroon: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id-patroon: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: absolute JSON-pointer (bijvoorbeeld `"/providers/openai/apiKey"`)
- `source: "exec"` id-patroon: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` ids mogen geen met slashes gescheiden padsegmenten `.` of `..` bevatten (bijvoorbeeld `a/../b` wordt geweigerd)

### Ondersteund referentiegegevensoppervlak

- Canonieke matrix: [Referentiegegevensoppervlak voor SecretRef](/nl/reference/secretref-credential-surface)
- `secrets apply` richt zich op ondersteunde referentiegegevenspaden in `openclaw.json`.
- `auth-profiles.json`-verwijzingen zijn opgenomen in runtime-resolutie en auditdekking.

### Configuratie van geheime providers

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
- `exec`-provider vereist een absoluut `command`-pad en gebruikt protocolpayloads via stdin/stdout.
- Standaard worden symlink-commandopaden geweigerd. Stel `allowSymlinkCommand: true` in om symlinkpaden toe te staan terwijl het opgeloste doelpad wordt gevalideerd.
- Als `trustedDirs` is geconfigureerd, wordt de controle op vertrouwde mappen toegepast op het opgeloste doelpad.
- De `exec`-childomgeving is standaard minimaal; geef vereiste variabelen expliciet door met `passEnv`.
- Geheime verwijzingen worden tijdens activering opgelost in een in-memory snapshot; daarna lezen aanvraagpaden alleen de snapshot.
- Filtering van actieve oppervlakken wordt toegepast tijdens activering: onopgeloste verwijzingen op ingeschakelde oppervlakken laten opstarten/herladen mislukken, terwijl inactieve oppervlakken met diagnostiek worden overgeslagen.

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

- Profielen per agent worden opgeslagen in `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` ondersteunt verwijzingen op waardeniveau (`keyRef` voor `api_key`, `tokenRef` voor `token`) voor statische referentiegegevensmodi.
- Verouderde platte `auth-profiles.json`-toewijzingen zoals `{ "provider": { "apiKey": "..." } }` zijn geen runtime-indeling; `openclaw doctor --fix` herschrijft ze naar canonieke `provider:default` API-sleutelprofielen met een `.legacy-flat.*.bak`-back-up.
- OAuth-modusprofielen (`auth.profiles.<id>.mode = "oauth"`) ondersteunen geen door SecretRef ondersteunde auth-profielreferentiegegevens.
- Statische runtime-referentiegegevens komen uit in-memory opgeloste snapshots; verouderde statische `auth.json`-vermeldingen worden opgeschoond wanneer ze worden aangetroffen.
- Verouderde OAuth-imports komen uit `~/.openclaw/credentials/oauth.json`.
- Zie [OAuth](/nl/concepts/oauth).
- Runtimegedrag van geheimen en `audit/configure/apply`-hulpmiddelen: [Beheer van geheimen](/nl/gateway/secrets).

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

- `billingBackoffHours`: basisback-off in uren wanneer een profiel faalt door echte
  facturerings-/onvoldoende-tegoed-fouten (standaard: `5`). Expliciete factureringstekst kan
  hier nog steeds terechtkomen, zelfs bij `401`/`403`-reacties, maar providerspecifieke
  tekstmatchers blijven beperkt tot de provider die ze beheert (bijvoorbeeld OpenRouter
  `Key limit exceeded`). Opnieuw te proberen HTTP `402`-berichten voor gebruiksvensters of
  uitgavelimieten voor organisatie/werkruimte blijven in plaats daarvan in het `rate_limit`-pad.
- `billingBackoffHoursByProvider`: optionele overschrijvingen per provider voor factureringsback-offuren.
- `billingMaxHours`: maximum in uren voor exponentiële groei van factureringsback-off (standaard: `24`).
- `authPermanentBackoffMinutes`: basisback-off in minuten voor zeer betrouwbare `auth_permanent`-fouten (standaard: `10`).
- `authPermanentMaxMinutes`: maximum in minuten voor groei van `auth_permanent`-back-off (standaard: `60`).
- `failureWindowHours`: voortschrijdend venster in uren dat wordt gebruikt voor back-offtellers (standaard: `24`).
- `overloadedProfileRotations`: maximaal aantal auth-profielrotaties bij dezelfde provider voor overbelastingsfouten voordat wordt overgeschakeld naar model-fallback (standaard: `1`). Provider-bezet-vormen zoals `ModelNotReadyException` komen hier terecht.
- `overloadedBackoffMs`: vaste vertraging voordat een overbelaste provider-/profielrotatie opnieuw wordt geprobeerd (standaard: `0`).
- `rateLimitedProfileRotations`: maximaal aantal auth-profielrotaties bij dezelfde provider voor rate-limit-fouten voordat wordt overgeschakeld naar model-fallback (standaard: `1`). Die rate-limit-bucket omvat providergevormde tekst zoals `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` en `resource exhausted`.

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
- `maxFileBytes`: maximale actieve logbestandsgrootte in bytes vóór rotatie (positief geheel getal; standaard: `104857600` = 100 MB). OpenClaw bewaart maximaal vijf genummerde archieven naast het actieve bestand.
- `redactSensitive` / `redactPatterns`: best-effort masking voor console-uitvoer, bestandslogs, OTLP-logrecords en opgeslagen sessietranscripttekst. `redactSensitive: "off"` schakelt alleen dit algemene log-/transcriptbeleid uit; UI-/tool-/diagnostische veiligheidsoppervlakken redigeren nog steeds geheimen vóór verzending.

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
- `flags`: array met flag-strings die gerichte loguitvoer inschakelen (ondersteunt jokertekens zoals `"telegram.*"` of `"*"`).
- `stuckSessionWarnMs`: drempel voor leeftijd zonder voortgang in ms om langlopende verwerkingssessies te classificeren als `session.long_running`, `session.stalled` of `session.stuck`. Antwoord-, tool-, status-, blok- en ACP-voortgang resetten de timer; herhaalde `session.stuck`-diagnostiek gebruikt back-off zolang er niets verandert.
- `otel.enabled`: schakelt de OpenTelemetry-exportpipeline in (standaard: `false`). Zie [OpenTelemetry-export](/nl/gateway/opentelemetry) voor de volledige configuratie, signaalcatalogus en het privacymodel.
- `otel.endpoint`: collector-URL voor OTel-export.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: optionele signaalspecifieke OTLP-eindpunten. Wanneer ingesteld, overschrijven ze `otel.endpoint` alleen voor dat signaal.
- `otel.protocol`: `"http/protobuf"` (standaard) of `"grpc"`.
- `otel.headers`: extra HTTP/gRPC-metadataheaders die met OTel-exportaanvragen worden verzonden.
- `otel.serviceName`: servicenaam voor resource-attributen.
- `otel.traces` / `otel.metrics` / `otel.logs`: schakel trace-, metrics- of logexport in.
- `otel.sampleRate`: tracesamplingpercentage `0`–`1`.
- `otel.flushIntervalMs`: periodiek telemetry-flushinterval in ms.
- `otel.captureContent`: opt-in voor vastleggen van ruwe inhoud voor OTEL-spanattributen. Standaard uitgeschakeld. Boolean `true` legt niet-systeeminhoud van berichten/tools vast; met de objectvorm kun je `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` en `systemPrompt` expliciet inschakelen.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: omgevingsschakelaar voor de nieuwste experimentele GenAI-spanproviderattributen. Standaard behouden spans het legacy-attribuut `gen_ai.system` voor compatibiliteit; GenAI-metrics gebruiken begrensde semantische attributen.
- `OPENCLAW_OTEL_PRELOADED=1`: omgevingsschakelaar voor hosts die al een globale OpenTelemetry SDK hebben geregistreerd. OpenClaw slaat dan door de Plugin beheerde SDK-start/stop over terwijl diagnostische listeners actief blijven.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` en `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: signaalspecifieke eindpunt-env-vars die worden gebruikt wanneer de overeenkomende configuratiesleutel niet is ingesteld.
- `cacheTrace.enabled`: log cache-trace-snapshots voor embedded runs (standaard: `false`).
- `cacheTrace.filePath`: uitvoerpad voor cache-trace JSONL (standaard: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
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
- `auto.enabled`: schakel automatisch bijwerken op de achtergrond in voor package-installaties (standaard: `false`).
- `auto.stableDelayHours`: minimale vertraging in uren voordat automatisch toepassen op het stable-kanaal gebeurt (standaard: `6`; max: `168`).
- `auto.stableJitterHours`: extra uitrolspreidingsvenster in uren voor het stable-kanaal (standaard: `12`; max: `168`).
- `auto.betaCheckIntervalHours`: hoe vaak controles op het beta-kanaal worden uitgevoerd, in uren (standaard: `1`; max: `24`).

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

- `enabled`: globale ACP-functiegate (standaard: `true`; zet op `false` om ACP-dispatch- en spawnmogelijkheden te verbergen).
- `dispatch.enabled`: onafhankelijke gate voor ACP-sessiebeurtdispatch (standaard: `true`). Zet op `false` om ACP-opdrachten beschikbaar te houden terwijl uitvoering wordt geblokkeerd.
- `backend`: standaard ACP-runtime-backend-id (moet overeenkomen met een geregistreerde ACP-runtime-Plugin).
  Installeer eerst de backend-Plugin en, als `plugins.allow` is ingesteld, neem de backend-Plugin-id op (bijvoorbeeld `acpx`) anders wordt de ACP-backend niet geladen.
- `defaultAgent`: fallback-ACP-doelagent-id wanneer spawns geen expliciet doel opgeven.
- `allowedAgents`: allowlist van agent-id's die zijn toegestaan voor ACP-runtime-sessies; leeg betekent geen aanvullende beperking.
- `maxConcurrentSessions`: maximaal aantal gelijktijdig actieve ACP-sessies.
- `stream.coalesceIdleMs`: idle-flushvenster in ms voor gestreamde tekst.
- `stream.maxChunkChars`: maximale chunkgrootte voordat gestreamde blokprojectie wordt gesplitst.
- `stream.repeatSuppression`: onderdruk herhaalde status-/toolregels per beurt (standaard: `true`).
- `stream.deliveryMode`: `"live"` streamt incrementeel; `"final_only"` buffert tot terminale beurtgebeurtenissen.
- `stream.hiddenBoundarySeparator`: scheidingsteken vóór zichtbare tekst na verborgen toolgebeurtenissen (standaard: `"paragraph"`).
- `stream.maxOutputChars`: maximaal aantal assistentuitvoertekens dat per ACP-beurt wordt geprojecteerd.
- `stream.maxSessionUpdateChars`: maximaal aantal tekens voor geprojecteerde ACP-status-/updateregels.
- `stream.tagVisibility`: record van tagnamen naar booleaanse zichtbaarheidsoverschrijvingen voor gestreamde gebeurtenissen.
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
  - `"off"`: geen taglinetekst (bannertitel/-versie wordt nog steeds getoond).
- Om de volledige banner te verbergen (niet alleen taglines), stel env `OPENCLAW_HIDE_BANNER=1` in.

---

## Wizard

Metadata geschreven door CLI-begeleide instelstromen (`onboard`, `configure`, `doctor`):

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

- `sessionRetention`: hoelang voltooide geïsoleerde Cron-runsessies worden bewaard voordat ze uit `sessions.json` worden gesnoeid. Beheert ook opschoning van gearchiveerde verwijderde Cron-transcripten. Standaard: `24h`; zet op `false` om uit te schakelen.
- `runLog.maxBytes`: maximale grootte per run-logbestand (`cron/runs/<jobId>.jsonl`) vóór snoeien. Standaard: `2_000_000` bytes.
- `runLog.keepLines`: nieuwste regels die worden behouden wanneer run-log-snoeien wordt geactiveerd. Standaard: `2000`.
- `webhookToken`: bearer-token gebruikt voor Cron Webhook POST-bezorging (`delivery.mode = "webhook"`), als weggelaten wordt er geen auth-header verzonden.
- `webhook`: verouderde legacy fallback-Webhook-URL (http/https), alleen gebruikt voor opgeslagen jobs die nog `notify: true` hebben.

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

- `enabled`: schakel foutwaarschuwingen voor Cron-taken in (standaard: `false`).
- `after`: opeenvolgende fouten voordat een waarschuwing wordt geactiveerd (positief geheel getal, min: `1`).
- `cooldownMs`: minimaal aantal milliseconden tussen herhaalde waarschuwingen voor dezelfde taak (niet-negatief geheel getal).
- `includeSkipped`: tel opeenvolgende overgeslagen uitvoeringen mee voor de waarschuwingsdrempel (standaard: `false`). Overgeslagen uitvoeringen worden apart bijgehouden en hebben geen invloed op backoff voor uitvoeringsfouten.
- `mode`: aflevermodus — `"announce"` verzendt via een kanaalbericht; `"webhook"` plaatst op de geconfigureerde Webhook.
- `accountId`: optioneel account- of kanaal-id om de waarschuwingaflevering af te bakenen.

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
- `mode`: `"announce"` of `"webhook"`; gebruikt standaard `"announce"` wanneer er voldoende doelgegevens bestaan.
- `channel`: kanaal-override voor aflevering via announce. `"last"` hergebruikt het laatst bekende afleverkanaal.
- `to`: expliciet announce-doel of Webhook-URL. Vereist voor Webhook-modus.
- `accountId`: optionele account-override voor aflevering.
- Per taak overschrijft `delivery.failureDestination` deze globale standaard.
- Wanneer er geen globale of taakspecifieke foutbestemming is ingesteld, vallen taken die al via `announce` afleveren bij een fout terug op dat primaire announce-doel.
- `delivery.failureDestination` wordt alleen ondersteund voor `sessionTarget="isolated"`-taken, tenzij de primaire `delivery.mode` van de taak `"webhook"` is.

Zie [Cron-taken](/nl/automation/cron-jobs). Geïsoleerde Cron-uitvoeringen worden bijgehouden als [achtergrondtaken](/nl/automation/tasks).

---

## Templatevariabelen voor mediamodellen

Templateplaatsaanduidingen die worden uitgebreid in `tools.media.models[].args`:

| Variabele          | Beschrijving                                      |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Volledige body van inkomend bericht               |
| `{{RawBody}}`      | Ruwe body (zonder geschiedenis-/afzender-wrappers) |
| `{{BodyStripped}}` | Body waar groepsvermeldingen uit zijn verwijderd  |
| `{{From}}`         | Afzender-ID                                       |
| `{{To}}`           | Bestemmings-ID                                    |
| `{{MessageSid}}`   | Bericht-id van kanaal                             |
| `{{SessionId}}`    | UUID van huidige sessie                           |
| `{{IsNewSession}}` | `"true"` wanneer een nieuwe sessie is gemaakt     |
| `{{MediaUrl}}`     | Pseudo-URL van inkomende media                    |
| `{{MediaPath}}`    | Lokaal mediapad                                   |
| `{{MediaType}}`    | Mediatype (afbeelding/audio/document/…)           |
| `{{Transcript}}`   | Audiotranscript                                   |
| `{{Prompt}}`       | Opgeloste mediaprompt voor CLI-items              |
| `{{MaxChars}}`     | Opgelost maximumaantal uitvoertekens voor CLI-items |
| `{{ChatType}}`     | `"direct"` of `"group"`                           |
| `{{GroupSubject}}` | Groepsonderwerp (naar beste vermogen)             |
| `{{GroupMembers}}` | Voorbeeldweergave van groepsleden (naar beste vermogen) |
| `{{SenderName}}`   | Weergavenaam van afzender (naar beste vermogen)   |
| `{{SenderE164}}`   | Telefoonnummer van afzender (naar beste vermogen) |
| `{{Provider}}`     | Provider-hint (whatsapp, telegram, discord, enz.) |

---

## Configuratie-includes (`$include`)

Splits configuratie op in meerdere bestanden:

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

- Eén bestand: vervangt het bevattende object.
- Array van bestanden: diep samengevoegd op volgorde (latere waarden overschrijven eerdere).
- Zustersleutels: samengevoegd na includes (overschrijven inbegrepen waarden).
- Geneste includes: tot 10 niveaus diep.
- Paden: opgelost relatief aan het includende bestand, maar moeten binnen de configuratiemap op het hoogste niveau blijven (`dirname` van `openclaw.json`). Absolute/`../`-vormen zijn alleen toegestaan wanneer ze nog steeds binnen die grens worden opgelost.
- Door OpenClaw beheerde schrijfacties die slechts één top-level sectie wijzigen die door een single-file include wordt ondersteund, schrijven door naar dat inbegrepen bestand. Bijvoorbeeld: `plugins install` werkt `plugins: { $include: "./plugins.json5" }` bij in `plugins.json5` en laat `openclaw.json` intact.
- Root-includes, include-arrays en includes met zustersleutel-overschrijvingen zijn alleen-lezen voor door OpenClaw beheerde schrijfacties; die schrijfacties falen gesloten in plaats van de configuratie af te vlakken.
- Fouten: duidelijke berichten voor ontbrekende bestanden, parsefouten en circulaire includes.

---

_Gerelateerd: [Configuratie](/nl/gateway/configuration) · [Configuratievoorbeelden](/nl/gateway/configuration-examples) · [Doctor](/nl/gateway/doctor)_

## Gerelateerd

- [Configuratie](/nl/gateway/configuration)
- [Configuratievoorbeelden](/nl/gateway/configuration-examples)
