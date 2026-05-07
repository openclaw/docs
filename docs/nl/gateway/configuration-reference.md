---
read_when:
    - Je hebt exacte configuratiesemantiek of standaardwaarden op veldniveau nodig
    - Je valideert kanaal-, model-, Gateway- of toolconfiguratieblokken
summary: Gateway-configuratiereferentie voor kern-OpenClaw-sleutels, standaardwaarden en koppelingen naar specifieke subsysteemreferenties
title: Configuratiereferentie
x-i18n:
    generated_at: "2026-05-07T13:17:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b279c3e74fd6f7de01d63b642ab17aaaac65c39b855efc745eadc121adbf1fb
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Kernconfiguratiereferentie voor `~/.openclaw/openclaw.json`. Zie [Configuratie](/nl/gateway/configuration) voor een taakgericht overzicht.

Behandelt de belangrijkste OpenClaw-configuratievlakken en linkt door wanneer een subsysteem een eigen diepere referentie heeft. Kanaal- en Plugin-beheerde opdrachtcatalogi en diepe geheugen-/QMD-knoppen staan op hun eigen pagina's in plaats van op deze.

Codewaarheid:

- `openclaw config schema` drukt het live JSON-schema af dat wordt gebruikt voor validatie en Control UI, met gebundelde/Plugin-/kanaalmetadata samengevoegd wanneer beschikbaar
- `config.schema.lookup` retourneert één padgebonden schemaknooppunt voor drill-downtooling
- `pnpm config:docs:check` / `pnpm config:docs:gen` valideren de baselinehash van de configuratiedocumentatie tegen het huidige schema-oppervlak

Agent-opzoekpad: gebruik de `gateway`-toolactie `config.schema.lookup` voor
exacte documentatie en beperkingen op veldniveau voordat je bewerkingen uitvoert. Gebruik
[Configuratie](/nl/gateway/configuration) voor taakgerichte begeleiding en deze pagina
voor de bredere veldkaart, standaardwaarden en links naar subsysteemreferenties.

Speciale diepe referenties:

- [Referentie voor geheugenconfiguratie](/nl/reference/memory-config) voor `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, en dreaming-configuratie onder `plugins.entries.memory-core.config.dreaming`
- [Slash-opdrachten](/nl/tools/slash-commands) voor de huidige ingebouwde + gebundelde opdrachtcatalogus
- beherende kanaal-/Plugin-pagina's voor kanaalspecifieke opdrachtvlakken

De configuratie-indeling is **JSON5** (opmerkingen + afsluitende komma's toegestaan). Alle velden zijn optioneel - OpenClaw gebruikt veilige standaardwaarden wanneer ze worden weggelaten.

---

## Kanalen

Configuratiesleutels per kanaal zijn verplaatst naar een speciale pagina - zie
[Configuratie - kanalen](/nl/gateway/config-channels) voor `channels.*`,
inclusief Slack, Discord, Telegram, WhatsApp, Matrix, iMessage en andere
gebundelde kanalen (authenticatie, toegangscontrole, meerdere accounts, vermeldingspoort).

## Agentstandaardwaarden, multi-agent, sessies en berichten

Verplaatst naar een speciale pagina - zie
[Configuratie - agents](/nl/gateway/config-agents) voor:

- `agents.defaults.*` (werkruimte, model, denken, Heartbeat, geheugen, media, Skills, sandbox)
- `multiAgent.*` (multi-agentroutering en bindingen)
- `session.*` (sessielevenscyclus, Compaction, pruning)
- `messages.*` (berichtbezorging, TTS, markdownrendering)
- `talk.*` (Talk-modus)
  - `talk.speechLocale`: optionele BCP 47-locale-id voor Talk-spraakherkenning op iOS/macOS
  - `talk.silenceTimeoutMs`: wanneer niet ingesteld, behoudt Talk het standaard pauzevenster van het platform voordat het transcript wordt verzonden (`700 ms on macOS and Android, 900 ms on iOS`)

## Tools en aangepaste providers

Toolbeleid, experimentele schakelaars, provider-ondersteunde toolconfiguratie en installatie van
aangepaste provider / basis-URL zijn verplaatst naar een speciale pagina - zie
[Configuratie - tools en aangepaste providers](/nl/gateway/config-tools).

## Modellen

Providerdefinities, modeltoelatingslijsten en aangepaste providerconfiguratie staan in
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

- `models.mode`: provider-catalogusgedrag (`merge` of `replace`).
- `models.providers`: aangepaste provider-map, gesleuteld op provider-id.
- `models.pricing.enabled`: beheert de achtergrond-pricingbootstrap die
  start nadat sidecars en kanalen het Gateway-ready-pad bereiken. Wanneer `false`,
  slaat de Gateway OpenRouter- en LiteLLM-prijscatalogusopvragingen over; geconfigureerde
  `models.providers.*.models[].cost`-waarden blijven werken voor lokale kostenschattingen.

## MCP

Door OpenClaw beheerde MCP-serverdefinities staan onder `mcp.servers` en worden
gebruikt door ingebedde Pi en andere runtimeadapters. De opdrachten `openclaw mcp list`,
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
- `mcp.sessionIdleTtlMs`: idle-TTL voor sessiegebonden gebundelde MCP-runtimes.
  Eenmalige ingebedde runs vragen om cleanup aan het einde van de run; deze TTL is de terugval voor
  langlevende sessies en toekomstige callers.
- Wijzigingen onder `mcp.*` worden hot-toegepast door gecachete sessie-MCP-runtimes af te voeren.
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

- `allowBundled`: optionele toelatingslijst alleen voor gebundelde skills (beheerde/werkruimte-skills niet beïnvloed).
- `load.extraDirs`: extra gedeelde skill-roots (laagste prioriteit).
- `install.preferBrew`: wanneer true, geef de voorkeur aan Homebrew-installers wanneer `brew`
  beschikbaar is voordat wordt teruggevallen op andere installertypen.
- `install.nodeManager`: voorkeur voor Node-installer voor `metadata.openclaw.install`
  specificaties (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` schakelt een skill uit, zelfs als deze gebundeld/geïnstalleerd is.
- `entries.<skillKey>.apiKey`: gemak voor skills die een primaire omgevingsvariabele declareren (plaintext string of SecretRef-object).

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
- Detectie accepteert native OpenClaw-plugins plus compatibele Codex-bundels en Claude-bundels, inclusief manifestloze Claude-bundels met standaardlayout.
- **Configuratiewijzigingen vereisen een herstart van de Gateway.**
- `allow`: optionele toelatingslijst (alleen vermelde plugins worden geladen). `deny` wint.
- `bundledDiscovery`: standaard `"allowlist"` voor nieuwe configuraties, zodat een niet-lege
  `plugins.allow` ook gebundelde provider-plugins poort, inclusief web-search
  runtimeproviders. Doctor schrijft `"compat"` voor gemigreerde legacy-toelatingslijst-
  configuraties om bestaand gebundeld providergedrag te behouden totdat je je aanmeldt.
- `plugins.entries.<id>.apiKey`: gemakveld voor API-sleutel op Plugin-niveau (wanneer ondersteund door de Plugin).
- `plugins.entries.<id>.env`: Plugin-scoped omgevingsvariabelemap.
- `plugins.entries.<id>.hooks.allowPromptInjection`: wanneer `false`, blokkeert core `before_prompt_build` en negeert prompt-muterende velden van legacy `before_agent_start`, terwijl legacy `modelOverride` en `providerOverride` behouden blijven. Van toepassing op native Plugin-hooks en ondersteunde door bundels geleverde hookmappen.
- `plugins.entries.<id>.hooks.allowConversationAccess`: wanneer `true`, mogen vertrouwde niet-gebundelde plugins ruwe gespreksinhoud lezen vanuit getypeerde hooks zoals `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` en `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: vertrouw deze Plugin expliciet om per-run `provider`- en `model`-overrides aan te vragen voor achtergrond-subagentruns.
- `plugins.entries.<id>.subagent.allowedModels`: optionele toelatingslijst van canonieke `provider/model`-doelen voor vertrouwde subagent-overrides. Gebruik `"*"` alleen wanneer je bewust elk model wilt toestaan.
- `plugins.entries.<id>.config`: door Plugin gedefinieerd configuratieobject (gevalideerd door native OpenClaw-Plugin-schema wanneer beschikbaar).
- Account-/runtime-instellingen voor kanaal-plugins staan onder `channels.<id>` en moeten worden beschreven door de `channelConfigs`-metadata van het manifest van de beherende Plugin, niet door een centraal OpenClaw-optieregister.
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch-providerinstellingen.
  - `apiKey`: Firecrawl API-sleutel (accepteert SecretRef). Valt terug op `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey`, of de omgevingsvariabele `FIRECRAWL_API_KEY`.
  - `baseUrl`: basis-URL voor Firecrawl API (standaard: `https://api.firecrawl.dev`; self-hosted overrides moeten privé/interne endpoints targeten).
  - `onlyMainContent`: extraheer alleen de hoofdinhoud van pagina's (standaard: `true`).
  - `maxAgeMs`: maximale cacheleeftijd in milliseconden (standaard: `172800000` / 2 dagen).
  - `timeoutSeconds`: time-out voor scrapeverzoek in seconden (standaard: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok websearch)-instellingen.
  - `enabled`: schakel de X Search-provider in.
  - `model`: Grok-model dat voor zoeken moet worden gebruikt (bijv. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: instellingen voor memory dreaming. Zie [Dreaming](/nl/concepts/dreaming) voor fasen en drempels.
  - `enabled`: hoofdschakelaar voor dreaming (standaard `false`).
  - `frequency`: Cron-cadans voor elke volledige dreamingsweep (standaard `"0 3 * * *"`).
  - `model`: optionele Dream Diary-subagentmodeloverride. Vereist `plugins.entries.memory-core.subagent.allowModelOverride: true`; combineer met `allowedModels` om doelen te beperken. Fouten wegens niet-beschikbaar model proberen het eenmaal opnieuw met het standaardmodel van de sessie; vertrouwens- of toelatingslijstfouten vallen niet stilzwijgend terug.
  - fasebeleid en drempels zijn implementatiedetails (geen gebruikersgerichte configuratiesleutels).
- Volledige geheugenconfiguratie staat in [Referentie voor geheugenconfiguratie](/nl/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Ingeschakelde Claude-bundelplugins kunnen ook ingebedde Pi-standaardwaarden bijdragen uit `settings.json`; OpenClaw past die toe als opgeschoonde agentinstellingen, niet als ruwe OpenClaw-configuratiepatches.
- `plugins.slots.memory`: kies de actieve geheugen-Plugin-id, of `"none"` om geheugen-plugins uit te schakelen.
- `plugins.slots.contextEngine`: kies de actieve context-engine-Plugin-id; standaard `"legacy"` tenzij je een andere engine installeert en selecteert.

Zie [Plugins](/nl/tools/plugin).

---

## Toezeggingen

`commitments` beheert afgeleid follow-upgeheugen: OpenClaw kan check-ins uit gespreksbeurten detecteren en deze bezorgen via Heartbeat-runs.

- `commitments.enabled`: schakel verborgen LLM-extractie, opslag en Heartbeat-bezorging in voor afgeleide follow-uptoezeggingen. Standaard: `false`.
- `commitments.maxPerDay`: maximaal aantal afgeleide follow-uptoezeggingen dat per agentsessie in een rollende dag wordt bezorgd. Standaard: `3`.

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
- `tabCleanup` ruimt bijgehouden primaire-agenttabbladen op na inactiviteit of wanneer een sessie de limiet overschrijdt. Stel `idleMinutes: 0` of `maxTabsPerSession: 0` in om die afzonderlijke opschoonmodi uit te schakelen.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` is uitgeschakeld wanneer dit niet is ingesteld, zodat browsernavigatie standaard strikt blijft.
- Stel `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` alleen in wanneer je browsernavigatie via een privénetwerk bewust vertrouwt.
- In strikte modus zijn externe CDP-profieleindpunten (`profiles.*.cdpUrl`) onderworpen aan dezelfde blokkering van privénetwerken tijdens bereikbaarheids-/detectiecontroles.
- `ssrfPolicy.allowPrivateNetwork` blijft ondersteund als verouderde alias.
- Gebruik in strikte modus `ssrfPolicy.hostnameAllowlist` en `ssrfPolicy.allowedHostnames` voor expliciete uitzonderingen.
- Externe profielen zijn alleen-koppelen (start/stop/reset uitgeschakeld).
- `profiles.*.cdpUrl` accepteert `http://`, `https://`, `ws://` en `wss://`.
  Gebruik HTTP(S) wanneer je wilt dat OpenClaw `/json/version` ontdekt; gebruik WS(S)
  wanneer je provider je een directe DevTools WebSocket-URL geeft.
- `remoteCdpTimeoutMs` en `remoteCdpHandshakeTimeoutMs` zijn van toepassing op externe en
  `attachOnly` CDP-bereikbaarheid plus aanvragen om tabbladen te openen. Beheerde loopback-
  profielen behouden lokale CDP-standaardwaarden.
- Als een extern beheerde CDP-service bereikbaar is via loopback, stel dan voor dat
  profiel `attachOnly: true` in; anders behandelt OpenClaw de loopback-poort als een
  lokaal beheerd browserprofiel en kan het fouten over lokaal poortbezit melden.
- `existing-session`-profielen gebruiken Chrome MCP in plaats van CDP en kunnen koppelen op
  de geselecteerde host of via een verbonden browsernode.
- `existing-session`-profielen kunnen `userDataDir` instellen om een specifiek
  Chromium-gebaseerd browserprofiel zoals Brave of Edge te targeten.
- `existing-session`-profielen behouden de huidige Chrome MCP-routelimieten:
  snapshot-/ref-gestuurde acties in plaats van CSS-selector-targeting, hooks voor upload van één bestand,
  geen overrides voor dialoogtime-outs, geen `wait --load networkidle` en geen
  `responsebody`, PDF-export, downloadinterceptie of batchacties.
- Lokaal beheerde `openclaw`-profielen wijzen automatisch `cdpPort` en `cdpUrl` toe; stel
  `cdpUrl` alleen expliciet in voor externe CDP.
- Lokaal beheerde profielen kunnen `executablePath` instellen om de globale
  `browser.executablePath` voor dat profiel te overschrijven. Gebruik dit om één profiel in
  Chrome en een ander in Brave te draaien.
- Lokaal beheerde profielen gebruiken `browser.localLaunchTimeoutMs` voor Chrome CDP HTTP-
  detectie na processtart en `browser.localCdpReadyTimeoutMs` voor
  CDP-websocketgereedheid na het starten. Verhoog ze op tragere hosts waar Chrome
  succesvol start maar gereedheidscontroles met het opstarten racen. Beide waarden moeten
  positieve gehele getallen tot `120000` ms zijn; ongeldige configuratiewaarden worden geweigerd.
- Automatische detectievolgorde: standaardbrowser als deze Chromium-gebaseerd is → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` en `browser.profiles.<name>.executablePath` accepteren beide
  `~` en `~/...` voor de thuismap van je besturingssysteem voordat Chromium wordt gestart.
  Per-profiel `userDataDir` op `existing-session`-profielen wordt ook met tilde uitgebreid.
- Besturingsservice: alleen loopback (poort afgeleid van `gateway.port`, standaard `18791`).
- `extraArgs` voegt extra startvlaggen toe aan lokale Chromium-opstart (bijvoorbeeld
  `--disable-gpu`, vensterafmetingen of debugvlaggen).

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

- `seamColor`: accentkleur voor native app-UI-chrome (Talk Mode-bubbelkleur, enz.).
- `assistant`: identiteitsoverschrijving voor Control UI. Valt terug op de actieve agentidentiteit.

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
- `port`: één gemultiplexte poort voor WS + HTTP. Prioriteit: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (standaard), `lan` (`0.0.0.0`), `tailnet` (alleen Tailscale-IP), of `custom`.
- **Verouderde bind-aliassen**: gebruik bind-moduswaarden in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), geen hostaliassen (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-opmerking**: de standaard `loopback`-bind luistert op `127.0.0.1` binnen de container. Met Docker bridge networking (`-p 18789:18789`) komt verkeer binnen op `eth0`, waardoor de Gateway onbereikbaar is. Gebruik `--network host`, of stel `bind: "lan"` in (of `bind: "custom"` met `customBindHost: "0.0.0.0"`) om op alle interfaces te luisteren.
- **Authenticatie**: standaard vereist. Niet-loopback-binds vereisen Gateway-authenticatie. In de praktijk betekent dit een gedeeld token/wachtwoord of een identity-aware reverse proxy met `gateway.auth.mode: "trusted-proxy"`. De onboardingwizard genereert standaard een token.
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd (inclusief SecretRefs), stel `gateway.auth.mode` dan expliciet in op `token` of `password`. Opstart- en service-installatie-/reparatiestromen mislukken wanneer beide zijn geconfigureerd en de modus niet is ingesteld.
- `gateway.auth.mode: "none"`: expliciete modus zonder authenticatie. Gebruik alleen voor vertrouwde local loopback-configuraties; dit wordt bewust niet aangeboden door onboardingprompts.
- `gateway.auth.mode: "trusted-proxy"`: delegeer browser-/gebruikersauthenticatie aan een identity-aware reverse proxy en vertrouw identiteitsheaders van `gateway.trustedProxies` (zie [Authenticatie via vertrouwde proxy](/nl/gateway/trusted-proxy-auth)). Deze modus verwacht standaard een **niet-loopback** proxybron; reverse proxy's via loopback op dezelfde host vereisen expliciet `gateway.auth.trustedProxy.allowLoopback = true`. Interne callers op dezelfde host kunnen `gateway.auth.password` gebruiken als lokale directe fallback; `gateway.auth.token` blijft wederzijds exclusief met de trusted-proxy-modus.
- `gateway.auth.allowTailscale`: wanneer `true`, kunnen Tailscale Serve-identiteitsheaders voldoen aan Control UI-/WebSocket-authenticatie (geverifieerd via `tailscale whois`). HTTP API-eindpunten gebruiken die Tailscale-headerauthenticatie **niet**; ze volgen in plaats daarvan de normale HTTP-authenticatiemodus van de Gateway. Deze tokenloze stroom gaat ervan uit dat de Gateway-host wordt vertrouwd. Standaard `true` wanneer `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: optionele begrenzer voor mislukte authenticatie. Geldt per client-IP en per authenticatiescope (shared-secret en device-token worden onafhankelijk bijgehouden). Geblokkeerde pogingen retourneren `429` + `Retry-After`.
  - Op het asynchrone Tailscale Serve Control UI-pad worden mislukte pogingen voor dezelfde `{scope, clientIp}` geserialiseerd voordat de fout wordt geschreven. Gelijktijdige ongeldige pogingen van dezelfde client kunnen daardoor de begrenzer activeren bij het tweede verzoek, in plaats van dat beide als gewone mismatches doorglippen.
  - `gateway.auth.rateLimit.exemptLoopback` is standaard `true`; stel dit in op `false` wanneer je bewust ook localhost-verkeer wilt beperken (voor testconfiguraties of strikte proxydeployments).
- Browser-origin WS-authenticatiepogingen worden altijd vertraagd met loopback-vrijstelling uitgeschakeld (defense-in-depth tegen browsergebaseerde localhost-bruteforce).
- Op loopback worden die browser-origin-lockouts geïsoleerd per genormaliseerde `Origin`-waarde, zodat herhaalde fouten vanaf één localhost-origin niet automatisch een andere origin blokkeren.
- `tailscale.mode`: `serve` (alleen tailnet, loopback-bind) of `funnel` (publiek, vereist authenticatie).
- `controlUi.allowedOrigins`: expliciete browser-origin-allowlist voor Gateway WebSocket-verbindingen. Vereist wanneer browserclients worden verwacht vanaf niet-loopback-origins.
- `controlUi.chatMessageMaxWidth`: optionele maximale breedte voor gegroepeerde Control UI-chatberichten. Accepteert beperkte CSS-breedtewaarden zoals `960px`, `82%`, `min(1280px, 82%)` en `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gevaarlijke modus die Host-header-origin-fallback inschakelt voor deployments die bewust vertrouwen op Host-header-originbeleid.
- `remote.transport`: `ssh` (standaard) of `direct` (ws/wss). Voor `direct` moet `remote.url` `ws://` of `wss://` zijn.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: break-glass-override in de client-side procesomgeving die plaintext `ws://` toestaat naar vertrouwde private-network-IP's; de standaard blijft alleen loopback voor plaintext. Er is geen `openclaw.json`-equivalent, en browser-private-network-configuratie zoals `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` heeft geen invloed op Gateway WebSocket-clients.
- `gateway.remote.token` / `.password` zijn credentialvelden voor externe clients. Ze configureren Gateway-authenticatie op zichzelf niet.
- `gateway.push.apns.relay.baseUrl`: basis-HTTPS-URL voor de externe APNs-relay die door officiële/TestFlight-iOS-builds wordt gebruikt nadat ze relay-backed registraties naar de Gateway publiceren. Deze URL moet overeenkomen met de relay-URL die in de iOS-build is gecompileerd.
- `gateway.push.apns.relay.timeoutMs`: verzendtimeout van Gateway naar relay in milliseconden. Standaard `10000`.
- Relay-backed registraties worden gedelegeerd aan een specifieke Gateway-identiteit. De gekoppelde iOS-app haalt `gateway.identity.get` op, neemt die identiteit op in de relayregistratie en stuurt een registratiegebonden verzendmachtiging door naar de Gateway. Een andere Gateway kan die opgeslagen registratie niet hergebruiken.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: tijdelijke env-overrides voor de relayconfiguratie hierboven.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: alleen-voor-ontwikkeling escape hatch voor loopback-HTTP-relay-URL's. Productierelay-URL's moeten HTTPS blijven gebruiken.
- `gateway.handshakeTimeoutMs`: pre-auth Gateway WebSocket-handshaketimeout in milliseconden. Standaard: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` heeft prioriteit wanneer ingesteld. Verhoog dit op belaste hosts of hosts met weinig vermogen waar lokale clients kunnen verbinden terwijl de opstartwarmup nog stabiliseert.
- `gateway.channelHealthCheckMinutes`: interval van de kanaal-health-monitor in minuten. Stel `0` in om health-monitor-herstarts globaal uit te schakelen. Standaard: `5`.
- `gateway.channelStaleEventThresholdMinutes`: drempel voor stale sockets in minuten. Houd dit groter dan of gelijk aan `gateway.channelHealthCheckMinutes`. Standaard: `30`.
- `gateway.channelMaxRestartsPerHour`: maximum aantal health-monitor-herstarts per kanaal/account in een voortschrijdend uur. Standaard: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per kanaal voor health-monitor-herstarts terwijl de globale monitor ingeschakeld blijft.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per account voor multi-account-kanalen. Wanneer ingesteld, heeft dit prioriteit boven de override op kanaalniveau.
- Lokale Gateway-aanroeppaden kunnen `gateway.remote.*` alleen als fallback gebruiken wanneer `gateway.auth.*` niet is ingesteld.
- Als `gateway.auth.token` / `gateway.auth.password` expliciet via SecretRef is geconfigureerd en niet kan worden opgelost, mislukt de resolutie gesloten (geen masking door externe fallback).
- `trustedProxies`: reverse-proxy-IP's die TLS beëindigen of forwarded-client-headers injecteren. Vermeld alleen proxy's die je beheert. Loopback-items blijven geldig voor proxy-/lokale-detectieconfiguraties op dezelfde host (bijvoorbeeld Tailscale Serve of een lokale reverse proxy), maar ze maken loopback-verzoeken **niet** geschikt voor `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: wanneer `true`, accepteert de Gateway `X-Real-IP` als `X-Forwarded-For` ontbreekt. Standaard `false` voor fail-closed-gedrag.
- `gateway.nodes.pairing.autoApproveCidrs`: optionele CIDR/IP-allowlist voor het automatisch goedkeuren van eerste node-device-pairing zonder aangevraagde scopes. Dit is uitgeschakeld wanneer niet ingesteld. Dit keurt operator-/browser-/Control UI-/WebChat-pairing niet automatisch goed, en keurt rol-, scope-, metadata- of public-key-upgrades niet automatisch goed.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globale allow/deny-vormgeving voor gedeclareerde node-commando's na pairing en evaluatie van de platformallowlist. Gebruik `allowCommands` om gevaarlijke node-commando's zoals `camera.snap`, `camera.clip` en `screen.record` expliciet toe te staan; `denyCommands` verwijdert een commando zelfs als een platformstandaard of expliciete allow het anders zou opnemen. Nadat een node zijn gedeclareerde commandolijst wijzigt, wijs die device-pairing af en keur deze opnieuw goed zodat de Gateway de bijgewerkte commandosnapshot opslaat.
- `gateway.tools.deny`: extra toolnamen die worden geblokkeerd voor HTTP `POST /tools/invoke` (breidt de standaard deny list uit).
- `gateway.tools.allow`: verwijder toolnamen uit de standaard HTTP deny list.

</Accordion>

### OpenAI-compatibele eindpunten

- Chat Completions: standaard uitgeschakeld. Schakel in met `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Hardening voor Responses URL-input:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Lege allowlists worden behandeld als niet ingesteld; gebruik `gateway.http.endpoints.responses.files.allowUrl=false` en/of `gateway.http.endpoints.responses.images.allowUrl=false` om URL-fetching uit te schakelen.
- Optionele response-hardeningheader:
  - `gateway.http.securityHeaders.strictTransportSecurity` (stel alleen in voor HTTPS-origins die je beheert; zie [Authenticatie via vertrouwde proxy](/nl/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolatie van meerdere instanties

Voer meerdere Gateways uit op één host met unieke poorten en state dirs:

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
- `autoGenerate`: genereert automatisch een lokaal self-signed cert/key-paar wanneer expliciete bestanden niet zijn geconfigureerd; alleen voor lokaal/dev-gebruik.
- `certPath`: bestandssysteempad naar het TLS-certificaatbestand.
- `keyPath`: bestandssysteempad naar het bestand met de TLS-privésleutel; houd de permissies beperkt.
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

- `mode`: bepaalt hoe configuratiebewerkingen tijdens runtime worden toegepast.
  - `"off"`: negeer live bewerkingen; wijzigingen vereisen een expliciete herstart.
  - `"restart"`: herstart het Gateway-proces altijd bij een configuratiewijziging.
  - `"hot"`: pas wijzigingen in-process toe zonder te herstarten.
  - `"hybrid"` (standaard): probeer eerst hot reload; val terug op herstart indien vereist.
- `debounceMs`: debouncevenster in ms voordat configuratiewijzigingen worden toegepast (niet-negatief geheel getal).
- `deferralTimeoutMs`: optionele maximale tijd in ms om te wachten op lopende bewerkingen voordat een herstart of kanaal-hot reload wordt afgedwongen. Laat weg om de standaard begrensde wachttijd (`300000`) te gebruiken; stel `0` in om onbeperkt te wachten en periodiek waarschuwingen over nog openstaande bewerkingen te loggen.

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
- `hooks.path` mag niet `/` zijn; gebruik een specifiek subpad zoals `/hooks`.
- Als `hooks.allowRequestSessionKey=true`, beperk dan `hooks.allowedSessionKeyPrefixes` (bijvoorbeeld `["hook:"]`).
- Als een mapping of preset een `sessionKey` met template gebruikt, stel dan `hooks.allowedSessionKeyPrefixes` en `hooks.allowRequestSessionKey=true` in. Statische mapping-sleutels vereisen die opt-in niet.

**Eindpunten:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` uit de request-payload wordt alleen geaccepteerd wanneer `hooks.allowRequestSessionKey=true` (standaard: `false`).
- `POST /hooks/<name>` → opgelost via `hooks.mappings`
  - Door templates gerenderde mappingwaarden voor `sessionKey` worden behandeld als extern aangeleverd en vereisen ook `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` matcht het subpad na `/hooks` (bijv. `/hooks/gmail` → `gmail`).
- `match.source` matcht een payloadveld voor generieke paden.
- Templates zoals `{{messages[0].subject}}` lezen uit de payload.
- `transform` kan verwijzen naar een JS/TS-module die een hook-actie retourneert.
  - `transform.module` moet een relatief pad zijn en blijft binnen `hooks.transformsDir` (absolute paden en traversal worden geweigerd).
  - Houd `hooks.transformsDir` onder `~/.openclaw/hooks/transforms`; workspace-Skills-mappen worden geweigerd. Als `openclaw doctor` dit pad als ongeldig rapporteert, verplaats dan de transform-module naar de hooks-transforms-map of verwijder `hooks.transformsDir`.
- `agentId` routeert naar een specifieke agent; onbekende ID's vallen terug op de standaardwaarde.
- `allowedAgentIds`: beperkt expliciete routering (`*` of weggelaten = alles toestaan, `[]` = alles weigeren).
- `defaultSessionKey`: optionele vaste sessiesleutel voor hook-agent-runs zonder expliciete `sessionKey`.
- `allowRequestSessionKey`: laat `/hooks/agent`-callers en template-gestuurde mapping-sessiesleutels `sessionKey` instellen (standaard: `false`).
- `allowedSessionKeyPrefixes`: optionele prefix-allowlist voor expliciete `sessionKey`-waarden (request + mapping), bijv. `["hook:"]`. Deze wordt vereist wanneer een mapping of preset een `sessionKey` met template gebruikt.
- `deliver: true` stuurt het definitieve antwoord naar een kanaal; `channel` is standaard `last`.
- `model` overschrijft het LLM voor deze hook-run (moet toegestaan zijn als de modelcatalogus is ingesteld).

</Accordion>

### Gmail-integratie

- De ingebouwde Gmail-preset gebruikt `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Als je die routering per bericht behoudt, stel dan `hooks.allowRequestSessionKey: true` in en beperk `hooks.allowedSessionKeyPrefixes` zodat deze overeenkomt met de Gmail-namespace, bijvoorbeeld `["hook:", "hook:gmail:"]`.
- Als je `hooks.allowRequestSessionKey: false` nodig hebt, overschrijf de preset dan met een statische `sessionKey` in plaats van de standaardwaarde met template.

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
- Niet-loopback-binds: canvas-routes vereisen Gateway-authenticatie (token/wachtwoord/vertrouwde proxy), hetzelfde als andere HTTP-oppervlakken van de Gateway.
- Node WebViews verzenden meestal geen auth-headers; nadat een node is gekoppeld en verbonden, adverteert de Gateway node-scoped capability-URL's voor canvas/A2UI-toegang.
- Capability-URL's zijn gekoppeld aan de actieve node-WS-sessie en verlopen snel. IP-gebaseerde fallback wordt niet gebruikt.
- Injecteert live-reload-client in geserveerde HTML.
- Maakt automatisch een start-`index.html` aan wanneer deze leeg is.
- Serveert A2UI ook op `/__openclaw__/a2ui/`.
- Wijzigingen vereisen een herstart van de Gateway.
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

- `minimal` (standaard wanneer de gebundelde `bonjour`-plugin is ingeschakeld): laat `cliPath` + `sshPort` weg uit TXT-records.
- `full`: neem `cliPath` + `sshPort` op; LAN-multicastadvertenties vereisen nog steeds dat de gebundelde `bonjour`-plugin is ingeschakeld.
- `off`: onderdrukt LAN-multicastadvertenties zonder de plugin-inschakeling te wijzigen.
- De gebundelde `bonjour`-plugin start automatisch op macOS-hosts en is opt-in op Linux, Windows en containerized Gateway-deployments.
- De hostnaam is standaard de systeemhostnaam wanneer die een geldig DNS-label is, met terugval naar `openclaw`. Overschrijf met `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Schrijft een unicast DNS-SD-zone onder `~/.openclaw/dns/`. Voor cross-network discovery, combineer met een DNS-server (CoreDNS aanbevolen) + Tailscale split DNS.

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

Verwijs naar omgevingsvariabelen in elke config-tekenreeks met `${VAR_NAME}`:

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

Geheimreferenties zijn additief: platte tekstwaarden blijven werken.

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
- `auth-profiles.json`-referenties zijn opgenomen in runtime-resolutie en auditdekking.

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

- De `file`-provider ondersteunt `mode: "json"` en `mode: "singleValue"` (`id` moet `"value"` zijn in de singleValue-modus).
- Paden van file- en exec-providers falen gesloten wanneer Windows ACL-verificatie niet beschikbaar is. Stel `allowInsecurePath: true` alleen in voor vertrouwde paden die niet kunnen worden geverifieerd.
- De `exec`-provider vereist een absoluut `command`-pad en gebruikt protocolpayloads op stdin/stdout.
- Standaard worden symlink-commandopaden geweigerd. Stel `allowSymlinkCommand: true` in om symlinkpaden toe te staan terwijl het opgeloste doelpad wordt gevalideerd.
- Als `trustedDirs` is geconfigureerd, wordt de trusted-dir-controle toegepast op het opgeloste doelpad.
- De `exec`-childomgeving is standaard minimaal; geef vereiste variabelen expliciet door met `passEnv`.
- Geheimreferenties worden tijdens activering opgelost naar een in-memory snapshot; daarna lezen requestpaden alleen de snapshot.
- Filtering op actief oppervlak wordt toegepast tijdens activering: onopgeloste referenties op ingeschakelde oppervlakken laten startup/reload falen, terwijl inactieve oppervlakken worden overgeslagen met diagnostiek.

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
- `auth-profiles.json` ondersteunt referenties op waardeniveau (`keyRef` voor `api_key`, `tokenRef` voor `token`) voor statische credential-modi.
- Verouderde platte `auth-profiles.json`-maps zoals `{ "provider": { "apiKey": "..." } }` zijn geen runtime-formaat; `openclaw doctor --fix` herschrijft ze naar canonieke `provider:default` API-key-profielen met een `.legacy-flat.*.bak`-back-up.
- OAuth-modusprofielen (`auth.profiles.<id>.mode = "oauth"`) ondersteunen geen door SecretRef ondersteunde auth-profielcredentials.
- Statische runtimecredentials komen uit in-memory opgeloste snapshots; verouderde statische `auth.json`-items worden opgeschoond wanneer ze worden ontdekt.
- Verouderde OAuth-imports komen uit `~/.openclaw/credentials/oauth.json`.
- Zie [OAuth](/nl/concepts/oauth).
- Runtimegedrag van geheimen en `audit/configure/apply`-tooling: [Geheimbeheer](/nl/gateway/secrets).

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
  facturerings-/onvoldoende-tegoedfouten (standaard: `5`). Expliciete factureringstekst kan
  hier nog steeds terechtkomen, zelfs bij `401`/`403`-antwoorden, maar providerspecifieke
  tekstmatchers blijven beperkt tot de provider die ze bezit (bijvoorbeeld OpenRouter
  `Key limit exceeded`). Opnieuw te proberen HTTP `402`-berichten voor gebruiksvensters of
  bestedingslimieten van organisatie/werkruimte blijven in plaats daarvan in het `rate_limit`-pad.
- `billingBackoffHoursByProvider`: optionele overrides per provider voor backoff-uren voor facturering.
- `billingMaxHours`: maximum in uren voor exponentiële groei van factureringsbackoff (standaard: `24`).
- `authPermanentBackoffMinutes`: basis-backoff in minuten voor fouten met hoge zekerheid van het type `auth_permanent` (standaard: `10`).
- `authPermanentMaxMinutes`: maximum in minuten voor groei van `auth_permanent`-backoff (standaard: `60`).
- `failureWindowHours`: voortschrijdend venster in uren dat wordt gebruikt voor backoff-tellers (standaard: `24`).
- `overloadedProfileRotations`: maximumaantal auth-profielrotaties bij dezelfde provider voor overbelastingsfouten voordat naar model-fallback wordt overgeschakeld (standaard: `1`). Provider-bezet-vormen zoals `ModelNotReadyException` komen hier terecht.
- `overloadedBackoffMs`: vaste vertraging voordat een overbelaste provider/profielrotatie opnieuw wordt geprobeerd (standaard: `0`).
- `rateLimitedProfileRotations`: maximumaantal auth-profielrotaties bij dezelfde provider voor rate-limit-fouten voordat naar model-fallback wordt overgeschakeld (standaard: `1`). Die rate-limit-bucket omvat providerachtige tekst zoals `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` en `resource exhausted`.

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
- `maxFileBytes`: maximale grootte van het actieve logbestand in bytes vóór rotatie (positief geheel getal; standaard: `104857600` = 100 MB). OpenClaw bewaart maximaal vijf genummerde archieven naast het actieve bestand.
- `redactSensitive` / `redactPatterns`: best-effort maskering voor console-uitvoer, bestandslogs, OTLP-logrecords en opgeslagen sessietranscripttekst. `redactSensitive: "off"` schakelt alleen dit algemene log-/transcriptbeleid uit; UI-/tool-/diagnostische veiligheidsoppervlakken redigeren geheimen nog steeds vóór emissie.

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
- `stuckSessionWarnMs`: leeftijdsdrempel zonder voortgang in ms voor het classificeren van langlopende verwerkingssessies als `session.long_running`, `session.stalled` of `session.stuck`. Antwoord, tool, status, blok en ACP-voortgang resetten de timer; herhaalde `session.stuck`-diagnostiek past backoff toe zolang er niets verandert.
- `stuckSessionAbortMs`: leeftijdsdrempel zonder voortgang in ms voordat in aanmerking komend vastgelopen actief werk via abort-drain mag worden beëindigd voor herstel. Wanneer niet ingesteld, gebruikt OpenClaw het veiligere verlengde venster voor embedded runs van ten minste 10 minuten en 5x `stuckSessionWarnMs`.
- `otel.enabled`: schakelt de OpenTelemetry-exportpipeline in (standaard: `false`). Zie [OpenTelemetry-export](/nl/gateway/opentelemetry) voor de volledige configuratie, signaalcatalogus en het privacymodel.
- `otel.endpoint`: collector-URL voor OTel-export.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: optionele signaalspecifieke OTLP-eindpunten. Wanneer ingesteld, overschrijven ze `otel.endpoint` alleen voor dat signaal.
- `otel.protocol`: `"http/protobuf"` (standaard) of `"grpc"`.
- `otel.headers`: extra HTTP/gRPC-metadataheaders die met OTel-exportverzoeken worden verzonden.
- `otel.serviceName`: servicenaam voor resource-attributen.
- `otel.traces` / `otel.metrics` / `otel.logs`: schakel export van traces, metrics of logs in.
- `otel.sampleRate`: samplingratio voor traces `0`-`1`.
- `otel.flushIntervalMs`: periodiek flush-interval voor telemetrie in ms.
- `otel.captureContent`: opt-in vastlegging van ruwe content voor OTEL-spanattributen. Staat standaard uit. Booleaanse waarde `true` legt niet-systeembericht-/toolcontent vast; met de objectvorm kun je `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` en `systemPrompt` expliciet inschakelen.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: omgevingsschakelaar voor de nieuwste experimentele GenAI-spanproviderattributen. Standaard behouden spans het legacy-attribuut `gen_ai.system` voor compatibiliteit; GenAI-metrics gebruiken begrensde semantische attributen.
- `OPENCLAW_OTEL_PRELOADED=1`: omgevingsschakelaar voor hosts die al een globale OpenTelemetry-SDK hebben geregistreerd. OpenClaw slaat dan het starten/afsluiten van de Plugin-eigen SDK over, terwijl diagnostische listeners actief blijven.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` en `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: signaalspecifieke eindpunt-env-vars die worden gebruikt wanneer de overeenkomende configuratiesleutel niet is ingesteld.
- `cacheTrace.enabled`: log cachetracesnapshots voor embedded runs (standaard: `false`).
- `cacheTrace.filePath`: uitvoerpad voor cachetrace-JSONL (standaard: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: bepalen wat in cachetrace-uitvoer wordt opgenomen (allemaal standaard: `true`).

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

- `channel`: releasekanaal voor npm-/git-installaties - `"stable"`, `"beta"` of `"dev"`.
- `checkOnStart`: controleer op npm-updates wanneer de gateway start (standaard: `true`).
- `auto.enabled`: schakel automatische achtergrondupdates in voor pakketinstallaties (standaard: `false`).
- `auto.stableDelayHours`: minimale vertraging in uren vóór automatisch toepassen voor het stabiele kanaal (standaard: `6`; max: `168`).
- `auto.stableJitterHours`: extra spreidingsvenster voor uitrol in het stabiele kanaal in uren (standaard: `12`; max: `168`).
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
- `dispatch.enabled`: onafhankelijke gate voor ACP-sessiebeurtdispatch (standaard: `true`). Stel in op `false` om ACP-opdrachten beschikbaar te houden terwijl uitvoering wordt geblokkeerd.
- `backend`: standaard ACP-runtimebackend-id (moet overeenkomen met een geregistreerde ACP-runtime-Plugin).
  Installeer eerst de backend-Plugin en, als `plugins.allow` is ingesteld, neem de backend-Plugin-id op (bijvoorbeeld `acpx`), anders wordt de ACP-backend niet geladen.
- `defaultAgent`: fallback-ACP-doelagent-id wanneer spawns geen expliciet doel opgeven.
- `allowedAgents`: allowlist van agent-id's die zijn toegestaan voor ACP-runtimesessies; leeg betekent geen aanvullende beperking.
- `maxConcurrentSessions`: maximumaantal gelijktijdig actieve ACP-sessies.
- `stream.coalesceIdleMs`: idle-flushvenster in ms voor gestreamde tekst.
- `stream.maxChunkChars`: maximale chunkgrootte voordat gestreamde blokprojectie wordt opgesplitst.
- `stream.repeatSuppression`: onderdruk herhaalde status-/toolregels per beurt (standaard: `true`).
- `stream.deliveryMode`: `"live"` streamt incrementeel; `"final_only"` buffert tot terminale gebeurtenissen van de beurt.
- `stream.hiddenBoundarySeparator`: scheidingsteken vóór zichtbare tekst na verborgen toolgebeurtenissen (standaard: `"paragraph"`).
- `stream.maxOutputChars`: maximaal aantal assistant-uitvoertekens dat per ACP-beurt wordt geprojecteerd.
- `stream.maxSessionUpdateChars`: maximaal aantal tekens voor geprojecteerde ACP-status-/updateregels.
- `stream.tagVisibility`: record van tagnamen naar booleaanse zichtbaarheids-overrides voor gestreamde gebeurtenissen.
- `runtime.ttlMinutes`: idle-TTL in minuten voor ACP-sessieworkers voordat ze in aanmerking komen voor opruiming.
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

- `cli.banner.taglineMode` bepaalt de stijl van de bannerslogan:
  - `"random"` (standaard): roterende grappige/seizoensgebonden slogans.
  - `"default"`: vaste neutrale slogan (`All your chats, one OpenClaw.`).
  - `"off"`: geen slogantekst (bannertitel/versie wordt nog steeds getoond).
- Om de volledige banner te verbergen (niet alleen slogans), stel env `OPENCLAW_HIDE_BANNER=1` in.

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

- `sessionRetention`: hoelang voltooide geïsoleerde cron-uitvoeringssessies worden bewaard voordat ze uit `sessions.json` worden verwijderd. Regelt ook het opschonen van gearchiveerde verwijderde cron-transcripten. Standaard: `24h`; stel in op `false` om uit te schakelen.
- `runLog.maxBytes`: maximale grootte per uitvoeringslogbestand (`cron/runs/<jobId>.jsonl`) voordat er wordt opgeschoond. Standaard: `2_000_000` bytes.
- `runLog.keepLines`: nieuwste regels die worden behouden wanneer opschoning van uitvoeringslogs wordt geactiveerd. Standaard: `2000`.
- `webhookToken`: bearer-token dat wordt gebruikt voor cron Webhook POST-bezorging (`delivery.mode = "webhook"`); indien weggelaten wordt er geen auth-header verzonden.
- `webhook`: verouderde legacy fallback-Webhook-URL (http/https) die alleen wordt gebruikt voor opgeslagen taken die nog steeds `notify: true` hebben.

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

- `maxAttempts`: maximum aantal retries voor eenmalige taken bij tijdelijke fouten (standaard: `3`; bereik: `0`-`10`).
- `backoffMs`: array met backoff-vertragingen in ms voor elke retry-poging (standaard: `[30000, 60000, 300000]`; 1-10 items).
- `retryOn`: fouttypen die retries activeren - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Laat weg om alle tijdelijke typen opnieuw te proberen.

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

- `enabled`: schakel foutmeldingen voor cron-taken in (standaard: `false`).
- `after`: opeenvolgende fouten voordat een melding wordt geactiveerd (positief geheel getal, min: `1`).
- `cooldownMs`: minimumaantal milliseconden tussen herhaalde meldingen voor dezelfde taak (niet-negatief geheel getal).
- `includeSkipped`: tel opeenvolgende overgeslagen uitvoeringen mee voor de meldingsdrempel (standaard: `false`). Overgeslagen uitvoeringen worden afzonderlijk bijgehouden en hebben geen invloed op backoff voor uitvoeringsfouten.
- `mode`: bezorgmodus - `"announce"` verzendt via een kanaalbericht; `"webhook"` post naar de geconfigureerde Webhook.
- `accountId`: optionele account- of kanaal-id om meldingsbezorging te begrenzen.

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

- Standaardbestemming voor cron-foutmeldingen voor alle taken.
- `mode`: `"announce"` of `"webhook"`; valt terug op `"announce"` wanneer er voldoende doelgegevens beschikbaar zijn.
- `channel`: kanaaloverride voor announce-bezorging. `"last"` hergebruikt het laatst bekende bezorgkanaal.
- `to`: expliciet announce-doel of Webhook-URL. Vereist voor Webhook-modus.
- `accountId`: optionele accountoverride voor bezorging.
- Per-taak `delivery.failureDestination` overschrijft deze globale standaard.
- Wanneer er noch een globale noch een per-taak foutbestemming is ingesteld, vallen taken die al via `announce` bezorgen bij fouten terug op dat primaire announce-doel.
- `delivery.failureDestination` wordt alleen ondersteund voor `sessionTarget="isolated"`-taken, tenzij de primaire `delivery.mode` van de taak `"webhook"` is.

Zie [Cron-taken](/nl/automation/cron-jobs). Geïsoleerde cron-uitvoeringen worden bijgehouden als [achtergrondtaken](/nl/automation/tasks).

---

## Sjabloonvariabelen voor mediamodellen

Sjabloonplaatsaanduidingen die worden uitgebreid in `tools.media.models[].args`:

| Variabele          | Beschrijving                                      |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Volledige inkomende berichttekst                  |
| `{{RawBody}}`      | Ruwe body (geen geschiedenis-/afzenderwrappers)   |
| `{{BodyStripped}}` | Body zonder groepsvermeldingen                    |
| `{{From}}`         | Afzender-id                                       |
| `{{To}}`           | Bestemmings-id                                    |
| `{{MessageSid}}`   | Kanaalbericht-id                                  |
| `{{SessionId}}`    | Huidige sessie-UUID                               |
| `{{IsNewSession}}` | `"true"` wanneer een nieuwe sessie is gemaakt     |
| `{{MediaUrl}}`     | Pseudo-URL voor inkomende media                   |
| `{{MediaPath}}`    | Lokaal mediapad                                   |
| `{{MediaType}}`    | Mediatype (image/audio/document/…)                |
| `{{Transcript}}`   | Audiotranscript                                   |
| `{{Prompt}}`       | Opgeloste mediaprompt voor CLI-items              |
| `{{MaxChars}}`     | Opgelost maximum aantal uitvoertekens voor CLI-items |
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

**Mergegedrag:**

- Eén bestand: vervangt het bevattende object.
- Array van bestanden: deep-merged in volgorde (latere overschrijven eerdere).
- Sibling-sleutels: gemerged na includes (overschrijven opgenomen waarden).
- Geneste includes: tot 10 niveaus diep.
- Paden: opgelost relatief aan het includende bestand, maar moeten binnen de hoogste configuratiemap blijven (`dirname` van `openclaw.json`). Absolute/`../`-vormen zijn alleen toegestaan wanneer ze nog steeds binnen die begrenzing oplossen.
- Door OpenClaw beheerde schrijfacties die slechts één top-level sectie wijzigen die wordt ondersteund door een single-file include, schrijven door naar dat opgenomen bestand. `plugins install` werkt bijvoorbeeld `plugins: { $include: "./plugins.json5" }` bij in `plugins.json5` en laat `openclaw.json` intact.
- Root-includes, include-arrays en includes met sibling-overrides zijn alleen-lezen voor door OpenClaw beheerde schrijfacties; die schrijfacties falen gesloten in plaats van de configuratie af te vlakken.
- Fouten: duidelijke meldingen voor ontbrekende bestanden, parsefouten en circulaire includes.

---

_Gerelateerd: [Configuratie](/nl/gateway/configuration) · [Configuratievoorbeelden](/nl/gateway/configuration-examples) · [Doctor](/nl/gateway/doctor)_

## Gerelateerd

- [Configuratie](/nl/gateway/configuration)
- [Configuratievoorbeelden](/nl/gateway/configuration-examples)
