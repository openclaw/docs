---
read_when:
    - Je hebt exacte configuratiesemantiek of standaardwaarden op veldniveau nodig
    - Je valideert kanaal-, model-, Gateway- of hulpmiddelconfiguratieblokken
summary: Gateway-configuratiereferentie voor kernsleutels van OpenClaw, standaardwaarden en links naar specifieke subsysteemreferenties
title: Configuratiereferentie
x-i18n:
    generated_at: "2026-04-29T22:43:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83fd28b7d6a2e670ab97aac206bb14343bd887da3236c6135d7958cc6e97b735
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Kernconfiguratiereferentie voor `~/.openclaw/openclaw.json`. Zie [Configuratie](/nl/gateway/configuration) voor een taakgericht overzicht.

Behandelt de belangrijkste OpenClaw-configuratievlakken en linkt door wanneer een subsysteem een eigen diepgaandere referentie heeft. Kanaal- en pluginbeheerde opdrachtcatalogi en diepgaande geheugen-/QMD-instellingen staan op hun eigen pagina's in plaats van op deze.

Waarheid in code:

- `openclaw config schema` drukt het live JSON Schema af dat wordt gebruikt voor validatie en de Control UI, met gebundelde/plugin-/kanaalmetadata samengevoegd wanneer beschikbaar
- `config.schema.lookup` retourneert één padspecifiek schemaknooppunt voor drill-downtooling
- `pnpm config:docs:check` / `pnpm config:docs:gen` valideren de baselinehash van de configuratiedocumentatie tegen het huidige schema-oppervlak

Opzoekpad voor agents: gebruik de `gateway`-toolactie `config.schema.lookup` voor
exacte documentatie en beperkingen op veldniveau vóór bewerkingen. Gebruik
[Configuratie](/nl/gateway/configuration) voor taakgerichte begeleiding en deze pagina
voor de bredere veldkaart, standaardwaarden en links naar subsysteemreferenties.

Specifieke diepgaande referenties:

- [Geheugenconfiguratiereferentie](/nl/reference/memory-config) voor `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` en Dreaming-configuratie onder `plugins.entries.memory-core.config.dreaming`
- [Slash-opdrachten](/nl/tools/slash-commands) voor de huidige ingebouwde + gebundelde opdrachtcatalogus
- beherende kanaal-/pluginpagina's voor kanaalspecifieke opdrachtvlakken

De configuratie-indeling is **JSON5** (comments + trailing komma's toegestaan). Alle velden zijn optioneel — OpenClaw gebruikt veilige standaardwaarden wanneer ze worden weggelaten.

---

## Kanalen

Configuratiesleutels per kanaal zijn verplaatst naar een speciale pagina — zie
[Configuratie — kanalen](/nl/gateway/config-channels) voor `channels.*`,
waaronder Slack, Discord, Telegram, WhatsApp, Matrix, iMessage en andere
gebundelde kanalen (authenticatie, toegangscontrole, meerdere accounts, mention-gating).

## Agentstandaardwaarden, multi-agent, sessies en berichten

Verplaatst naar een speciale pagina — zie
[Configuratie — agents](/nl/gateway/config-agents) voor:

- `agents.defaults.*` (workspace, model, denken, heartbeat, geheugen, media, skills, sandbox)
- `multiAgent.*` (multi-agent-routering en bindings)
- `session.*` (sessielevenscyclus, Compaction, opschoning)
- `messages.*` (berichtbezorging, TTS, markdownrendering)
- `talk.*` (Talk-modus)
  - `talk.speechLocale`: optionele BCP 47-locale-id voor Talk-spraakherkenning op iOS/macOS
  - `talk.silenceTimeoutMs`: wanneer niet ingesteld, houdt Talk het standaard pauzevenster van het platform aan voordat het transcript wordt verzonden (`700 ms op macOS en Android, 900 ms op iOS`)

## Tools en aangepaste providers

Toolbeleid, experimentele schakelaars, providerondersteunde toolconfiguratie en aangepaste
provider-/basis-URL-instelling zijn verplaatst naar een speciale pagina — zie
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

- `models.mode`: gedrag van de providercatalogus (`merge` of `replace`).
- `models.providers`: aangepaste providermap gesleuteld op provider-id.
- `models.pricing.enabled`: regelt de bootstrap voor achtergrondprijzen. Wanneer
  `false`, slaat Gateway-startup prijs-catalogusfetches van OpenRouter en LiteLLM over;
  geconfigureerde `models.providers.*.models[].cost`-waarden blijven werken voor lokale kostenramingen.

## MCP

Door OpenClaw beheerde MCP-serverdefinities staan onder `mcp.servers` en worden
gebruikt door ingebedde Pi en andere runtime-adapters. De opdrachten `openclaw mcp list`,
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
- `mcp.sessionIdleTtlMs`: idle-TTL voor sessiespecifieke gebundelde MCP-runtimes.
  Eenmalige ingebedde runs vragen opschoning aan het einde van de run aan; deze TTL is de achtervang voor
  langlevende sessies en toekomstige callers.
- Wijzigingen onder `mcp.*` worden hot-toegepast door gecachte sessie-MCP-runtimes te verwijderen.
  De volgende tooldetectie/het volgende toolgebruik maakt ze opnieuw aan vanuit de nieuwe configuratie, zodat verwijderde
  `mcp.servers`-items onmiddellijk worden opgeruimd in plaats van te wachten op de idle-TTL.

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

- `allowBundled`: optionele allowlist alleen voor gebundelde skills (beheerde/workspace-skills blijven onaangetast).
- `load.extraDirs`: extra gedeelde skill-roots (laagste prioriteit).
- `install.preferBrew`: wanneer true, geef de voorkeur aan Homebrew-installers wanneer `brew`
  beschikbaar is voordat wordt teruggevallen op andere installertypen.
- `install.nodeManager`: voorkeur voor node-installer voor `metadata.openclaw.install`-
  specificaties (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` schakelt een skill uit, zelfs als die gebundeld/geïnstalleerd is.
- `entries.<skillKey>.apiKey`: gemak voor skills die een primaire omgevingsvariabele declareren (platte tekststring of SecretRef-object).

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
- Detectie accepteert native OpenClaw-plugins plus compatibele Codex-bundels en Claude-bundels, inclusief manifestloze Claude-bundels met standaardindeling.
- **Configuratiewijzigingen vereisen een herstart van de gateway.**
- `allow`: optionele allowlist (alleen vermelde plugins laden). `deny` wint.
- `plugins.entries.<id>.apiKey`: gemakveld voor API-sleutel op pluginniveau (wanneer ondersteund door de plugin).
- `plugins.entries.<id>.env`: plugin-specifieke omgevingsvariabelemap.
- `plugins.entries.<id>.hooks.allowPromptInjection`: wanneer `false`, blokkeert core `before_prompt_build` en negeert promptmuterende velden uit legacy `before_agent_start`, terwijl legacy `modelOverride` en `providerOverride` behouden blijven. Geldt voor native pluginhooks en ondersteunde hookdirectories die door bundels worden geleverd.
- `plugins.entries.<id>.hooks.allowConversationAccess`: wanneer `true`, mogen vertrouwde niet-gebundelde plugins ruwe gespreksinhoud lezen vanuit getypeerde hooks zoals `llm_input`, `llm_output`, `before_agent_finalize` en `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: vertrouw deze plugin expliciet om per-run `provider`- en `model`-overrides aan te vragen voor achtergrondsubagentruns.
- `plugins.entries.<id>.subagent.allowedModels`: optionele allowlist van canonieke `provider/model`-doelen voor vertrouwde subagentoverrides. Gebruik `"*"` alleen wanneer je bewust elk model wilt toestaan.
- `plugins.entries.<id>.config`: door plugin gedefinieerd configuratieobject (gevalideerd door native OpenClaw-plugin-schema wanneer beschikbaar).
- Account-/runtime-instellingen voor kanaalplugins staan onder `channels.<id>` en moeten worden beschreven door de metadata `channelConfigs` in het manifest van de beherende plugin, niet door een centraal OpenClaw-optieregister.
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl-web-fetch-providerinstellingen.
  - `apiKey`: Firecrawl-API-sleutel (accepteert SecretRef). Valt terug op `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey` of de omgevingsvariabele `FIRECRAWL_API_KEY`.
  - `baseUrl`: Firecrawl-API-basis-URL (standaard: `https://api.firecrawl.dev`).
  - `onlyMainContent`: extraheer alleen de hoofdinhoud van pagina's (standaard: `true`).
  - `maxAgeMs`: maximale cacheleeftijd in milliseconden (standaard: `172800000` / 2 dagen).
  - `timeoutSeconds`: timeout voor scrapeverzoeken in seconden (standaard: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search-instellingen (Grok-webzoekopdracht).
  - `enabled`: schakel de X Search-provider in.
  - `model`: Grok-model om te gebruiken voor zoeken (bijv. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: instellingen voor geheugen-Dreaming. Zie [Dreaming](/nl/concepts/dreaming) voor fasen en drempels.
  - `enabled`: hoofdschakelaar voor Dreaming (standaard `false`).
  - `frequency`: cron-cadans voor elke volledige Dreaming-sweep (`"0 3 * * *"` standaard).
  - `model`: optionele modeloverride voor Dream Diary-subagent. Vereist `plugins.entries.memory-core.subagent.allowModelOverride: true`; combineer met `allowedModels` om doelen te beperken. Fouten waarbij het model niet beschikbaar is, proberen het één keer opnieuw met het standaardsessiemodel; vertrouwens- of allowlistfouten vallen niet stilzwijgend terug.
  - fasebeleid en drempels zijn implementatiedetails (geen gebruikersgerichte configuratiesleutels).
- Volledige geheugenconfiguratie staat in [Geheugenconfiguratiereferentie](/nl/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Ingeschakelde Claude-bundelplugins kunnen ook ingebedde Pi-standaardwaarden bijdragen vanuit `settings.json`; OpenClaw past die toe als gesaneerde agentinstellingen, niet als ruwe OpenClaw-configuratiepatches.
- `plugins.slots.memory`: kies de actieve geheugenplugin-id, of `"none"` om geheugenplugins uit te schakelen.
- `plugins.slots.contextEngine`: kies de actieve context-engine-plugin-id; standaard is `"legacy"` tenzij je een andere engine installeert en selecteert.

Zie [Plugins](/nl/tools/plugin).

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
- `tabCleanup` ruimt bijgehouden tabbladen van primaire agents op na inactieve tijd of wanneer een
  sessie de limiet overschrijdt. Stel `idleMinutes: 0` of `maxTabsPerSession: 0` in om
  die afzonderlijke opruimmodi uit te schakelen.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` is uitgeschakeld wanneer niet ingesteld, zodat browsernavigatie standaard strikt blijft.
- Stel `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` alleen in wanneer je browsernavigatie via privénetwerken bewust vertrouwt.
- In strikte modus zijn externe CDP-profieleindpunten (`profiles.*.cdpUrl`) onderworpen aan dezelfde blokkering van privénetwerken tijdens bereikbaarheids-/detectiecontroles.
- `ssrfPolicy.allowPrivateNetwork` blijft ondersteund als verouderde alias.
- Gebruik in strikte modus `ssrfPolicy.hostnameAllowlist` en `ssrfPolicy.allowedHostnames` voor expliciete uitzonderingen.
- Externe profielen zijn alleen voor koppelen (starten/stoppen/resetten uitgeschakeld).
- `profiles.*.cdpUrl` accepteert `http://`, `https://`, `ws://` en `wss://`.
  Gebruik HTTP(S) wanneer je wilt dat OpenClaw `/json/version` detecteert; gebruik WS(S)
  wanneer je provider je een directe DevTools WebSocket-URL geeft.
- `remoteCdpTimeoutMs` en `remoteCdpHandshakeTimeoutMs` gelden voor externe en
  `attachOnly` CDP-bereikbaarheid plus aanvragen om tabbladen te openen. Beheerde loopback-
  profielen behouden lokale CDP-standaarden.
- Als een extern beheerde CDP-service bereikbaar is via loopback, stel dan
  `attachOnly: true` in voor dat profiel; anders behandelt OpenClaw de loopbackpoort als een
  lokaal beheerd browserprofiel en kan het lokale poorteigenaarschapsfouten melden.
- `existing-session`-profielen gebruiken Chrome MCP in plaats van CDP en kunnen koppelen op
  de geselecteerde host of via een verbonden browsernode.
- `existing-session`-profielen kunnen `userDataDir` instellen om een specifiek
  Chromium-gebaseerd browserprofiel te targeten, zoals Brave of Edge.
- `existing-session`-profielen behouden de huidige routelimieten van Chrome MCP:
  snapshot-/ref-gestuurde acties in plaats van targeting met CSS-selectors, hooks voor het uploaden
  van één bestand, geen overschrijvingen van dialoogtime-outs, geen `wait --load networkidle`, en geen
  `responsebody`, PDF-export, downloadinterceptie of batchacties.
- Lokale beheerde `openclaw`-profielen wijzen automatisch `cdpPort` en `cdpUrl` toe; stel
  `cdpUrl` alleen expliciet in voor externe CDP.
- Lokale beheerde profielen kunnen `executablePath` instellen om de globale
  `browser.executablePath` voor dat profiel te overschrijven. Gebruik dit om één profiel in
  Chrome en een ander in Brave uit te voeren.
- Lokale beheerde profielen gebruiken `browser.localLaunchTimeoutMs` voor Chrome CDP HTTP-
  detectie na het starten van het proces en `browser.localCdpReadyTimeoutMs` voor
  CDP-websocketgereedheid na het starten. Verhoog ze op tragere hosts waar Chrome
  succesvol start maar gereedheidscontroles met het opstarten racen. Beide waarden moeten
  positieve gehele getallen tot `120000` ms zijn; ongeldige configuratiewaarden worden geweigerd.
- Automatische detectievolgorde: standaardbrowser indien Chromium-gebaseerd → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` en `browser.profiles.<name>.executablePath` accepteren beide
  `~` en `~/...` voor de thuismap van je besturingssysteem vóór het starten van Chromium.
  `userDataDir` per profiel op `existing-session`-profielen wordt ook met tilde uitgebreid.
- Controledienst: alleen loopback (poort afgeleid van `gateway.port`, standaard `18791`).
- `extraArgs` voegt extra startvlaggen toe aan lokale Chromium-opstart (bijvoorbeeld
  `--disable-gpu`, venstergrootte of debugvlaggen).

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
- `assistant`: identiteitsoverride voor Control UI. Valt terug op de identiteit van de actieve agent.

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

- `mode`: `local` (gateway uitvoeren) of `remote` (verbinden met externe gateway). Gateway weigert te starten tenzij dit `local` is.
- `port`: één gemultiplexte poort voor WS + HTTP. Prioriteit: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (standaard), `lan` (`0.0.0.0`), `tailnet` (alleen Tailscale-IP), of `custom`.
- **Verouderde bind-aliassen**: gebruik bind-moduswaarden in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), geen hostaliassen (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-opmerking**: de standaard `loopback`-bind luistert binnen de container op `127.0.0.1`. Met Docker-bridge-netwerken (`-p 18789:18789`) komt verkeer binnen op `eth0`, waardoor de gateway onbereikbaar is. Gebruik `--network host`, of stel `bind: "lan"` in (of `bind: "custom"` met `customBindHost: "0.0.0.0"`) om op alle interfaces te luisteren.
- **Auth**: standaard vereist. Niet-loopback-binds vereisen gateway-auth. In de praktijk betekent dit een gedeeld token/wachtwoord of een identiteitsbewuste reverse-proxy met `gateway.auth.mode: "trusted-proxy"`. De onboardingwizard genereert standaard een token.
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd (inclusief SecretRefs), stel `gateway.auth.mode` dan expliciet in op `token` of `password`. Opstart- en service-installatie-/reparatiestromen mislukken wanneer beide zijn geconfigureerd en de modus niet is ingesteld.
- `gateway.auth.mode: "none"`: expliciete modus zonder auth. Alleen gebruiken voor vertrouwde local loopback-configuraties; dit wordt bewust niet aangeboden door onboardingprompts.
- `gateway.auth.mode: "trusted-proxy"`: delegeer browser-/gebruikersauth aan een identiteitsbewuste reverse-proxy en vertrouw identiteitsheaders van `gateway.trustedProxies` (zie [Vertrouwde-proxy-auth](/nl/gateway/trusted-proxy-auth)). Deze modus verwacht standaard een **niet-loopback** proxybron; reverse-proxy’s met loopback op dezelfde host vereisen expliciet `gateway.auth.trustedProxy.allowLoopback = true`. Interne aanroepers op dezelfde host kunnen `gateway.auth.password` gebruiken als lokale directe fallback; `gateway.auth.token` blijft wederzijds exclusief met de trusted-proxy-modus.
- `gateway.auth.allowTailscale`: wanneer `true`, kunnen Tailscale Serve-identiteitsheaders voldoen aan auth voor de bedienings-UI/WebSocket (geverifieerd via `tailscale whois`). HTTP-API-eindpunten gebruiken die Tailscale-headerauth **niet**; zij volgen in plaats daarvan de normale HTTP-authmodus van de gateway. Deze tokenloze stroom gaat ervan uit dat de gatewayhost vertrouwd is. Standaard `true` wanneer `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: optionele limiter voor mislukte auth. Wordt toegepast per client-IP en per auth-scope (shared-secret en device-token worden afzonderlijk bijgehouden). Geblokkeerde pogingen retourneren `429` + `Retry-After`.
  - Op het asynchrone Tailscale Serve-pad voor de bedienings-UI worden mislukte pogingen voor dezelfde `{scope, clientIp}` geserialiseerd vóór het wegschrijven van de fout. Gelijktijdige ongeldige pogingen van dezelfde client kunnen daardoor de limiter bij de tweede aanvraag activeren in plaats van dat beide als gewone mismatches doorlopen.
  - `gateway.auth.rateLimit.exemptLoopback` is standaard `true`; stel dit in op `false` wanneer je ook localhost-verkeer bewust wilt rate-limiten (voor testconfiguraties of strikte proxy-implementaties).
- WS-authpogingen vanuit browser-origins worden altijd gethrottled met loopback-vrijstelling uitgeschakeld (defense-in-depth tegen browsergebaseerde localhost-bruteforce).
- Op loopback zijn die lock-outs vanuit browser-origins geïsoleerd per genormaliseerde `Origin`-waarde, zodat herhaalde fouten vanaf één localhost-origin niet automatisch een andere origin buitensluiten.
- `tailscale.mode`: `serve` (alleen tailnet, loopback-bind) of `funnel` (publiek, vereist auth).
- `controlUi.allowedOrigins`: expliciete allowlist voor browser-origins voor Gateway WebSocket-verbindingen. Vereist wanneer browserclients worden verwacht vanaf niet-loopback-origins.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gevaarlijke modus die Host-header-originfallback inschakelt voor implementaties die bewust vertrouwen op Host-header-originbeleid.
- `remote.transport`: `ssh` (standaard) of `direct` (ws/wss). Voor `direct` moet `remote.url` `ws://` of `wss://` zijn.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: break-glass-override via de procesomgeving aan clientzijde die plaintext `ws://` naar vertrouwde IP’s op privénetwerken toestaat; de standaard blijft loopback-only voor plaintext. Er is geen `openclaw.json`-equivalent, en browserconfiguratie voor privénetwerken zoals `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` heeft geen invloed op Gateway WebSocket-clients.
- `gateway.remote.token` / `.password` zijn credentialvelden voor externe clients. Ze configureren gateway-auth niet op zichzelf.
- `gateway.push.apns.relay.baseUrl`: basis-HTTPS-URL voor de externe APNs-relay die wordt gebruikt door officiële/TestFlight-iOS-builds nadat zij relay-ondersteunde registraties naar de gateway publiceren. Deze URL moet overeenkomen met de relay-URL die in de iOS-build is gecompileerd.
- `gateway.push.apns.relay.timeoutMs`: verzendtime-out van gateway naar relay in milliseconden. Standaard `10000`.
- Relay-ondersteunde registraties worden gedelegeerd aan een specifieke gateway-identiteit. De gekoppelde iOS-app haalt `gateway.identity.get` op, neemt die identiteit op in de relayregistratie en stuurt een registratiespecifieke verzendmachtiging door naar de gateway. Een andere gateway kan die opgeslagen registratie niet hergebruiken.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: tijdelijke env-overrides voor de relayconfiguratie hierboven.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: alleen-ontwikkelings-uitweg voor loopback-HTTP-relay-URL’s. Productierelay-URL’s moeten op HTTPS blijven.
- `gateway.handshakeTimeoutMs`: pre-auth Gateway WebSocket-handshake-time-out in milliseconden. Standaard: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` heeft prioriteit wanneer ingesteld. Verhoog dit op belaste of energiezuinige hosts waar lokale clients kunnen verbinden terwijl de opstart-warmup nog stabiliseert.
- `gateway.channelHealthCheckMinutes`: interval van de kanaal-health-monitor in minuten. Stel `0` in om health-monitor-herstarts globaal uit te schakelen. Standaard: `5`.
- `gateway.channelStaleEventThresholdMinutes`: stale-socketdrempel in minuten. Houd dit groter dan of gelijk aan `gateway.channelHealthCheckMinutes`. Standaard: `30`.
- `gateway.channelMaxRestartsPerHour`: maximaal aantal health-monitor-herstarts per kanaal/account in een voortschrijdend uur. Standaard: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per kanaal voor health-monitor-herstarts terwijl de globale monitor ingeschakeld blijft.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per account voor kanalen met meerdere accounts. Wanneer ingesteld, heeft dit prioriteit boven de override op kanaalniveau.
- Lokale gateway-aanroeppaden kunnen `gateway.remote.*` alleen als fallback gebruiken wanneer `gateway.auth.*` niet is ingesteld.
- Als `gateway.auth.token` / `gateway.auth.password` expliciet via SecretRef is geconfigureerd en niet kan worden opgelost, faalt de resolutie gesloten (geen maskering door externe fallback).
- `trustedProxies`: IP’s van reverse-proxy’s die TLS beëindigen of forwarded-clientheaders injecteren. Vermeld alleen proxy’s die je beheert. Loopback-vermeldingen blijven geldig voor proxy-/lokale-detectieconfiguraties op dezelfde host (bijvoorbeeld Tailscale Serve of een lokale reverse-proxy), maar ze maken loopback-aanvragen **niet** geschikt voor `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: wanneer `true`, accepteert de gateway `X-Real-IP` als `X-Forwarded-For` ontbreekt. Standaard `false` voor fail-closed-gedrag.
- `gateway.nodes.pairing.autoApproveCidrs`: optionele CIDR/IP-allowlist voor het automatisch goedkeuren van eerste node-device-pairing zonder aangevraagde scopes. Dit is uitgeschakeld wanneer niet ingesteld. Dit keurt operator-/browser-/bedienings-UI-/WebChat-pairing niet automatisch goed, en keurt ook geen upgrades van rol, scope, metadata of publieke sleutel automatisch goed.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globale allow/deny-vormgeving voor gedeclareerde node-commando’s na pairing en evaluatie van de platform-allowlist. Gebruik `allowCommands` om gevaarlijke node-commando’s zoals `camera.snap`, `camera.clip` en `screen.record` toe te staan; `denyCommands` verwijdert een commando zelfs als een platformstandaard of expliciete allow het anders zou opnemen. Nadat een node zijn gedeclareerde commandolijst wijzigt, wijs je die device-pairing af en keur je deze opnieuw goed zodat de gateway de bijgewerkte commandosnapshot opslaat.
- `gateway.tools.deny`: extra toolnamen die worden geblokkeerd voor HTTP `POST /tools/invoke` (breidt de standaard deny-list uit).
- `gateway.tools.allow`: verwijder toolnamen uit de standaard HTTP-deny-list.

</Accordion>

### OpenAI-compatibele eindpunten

- Chat Completions: standaard uitgeschakeld. Schakel in met `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Verharding van URL-invoer voor Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Lege allowlists worden behandeld als niet ingesteld; gebruik `gateway.http.endpoints.responses.files.allowUrl=false` en/of `gateway.http.endpoints.responses.images.allowUrl=false` om URL-fetching uit te schakelen.
- Optionele header voor responsverharding:
  - `gateway.http.securityHeaders.strictTransportSecurity` (alleen instellen voor HTTPS-origins die je beheert; zie [Vertrouwde-proxy-auth](/nl/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolatie van meerdere instanties

Voer meerdere gateways uit op één host met unieke poorten en state-directories:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Gemaksflags: `--dev` (gebruikt `~/.openclaw-dev` + poort `19001`), `--profile <name>` (gebruikt `~/.openclaw-<name>`).

Zie [Meerdere gateways](/nl/gateway/multiple-gateways).

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

- `enabled`: schakelt TLS-terminatie in bij de gateway-listener (HTTPS/WSS) (standaard: `false`).
- `autoGenerate`: genereert automatisch een lokaal zelfondertekend cert/key-paar wanneer expliciete bestanden niet zijn geconfigureerd; alleen voor lokaal/dev-gebruik.
- `certPath`: bestandssysteempad naar het TLS-certificaatbestand.
- `keyPath`: bestandssysteempad naar het TLS-private-keybestand; houd permissies beperkt.
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
  - `"hybrid"` (standaard): probeer eerst hot reload; val terug op herstart indien vereist.
- `debounceMs`: debouncevenster in ms voordat configuratiewijzigingen worden toegepast (niet-negatief geheel getal).
- `deferralTimeoutMs`: optionele maximale tijd in ms om te wachten op lopende bewerkingen voordat een herstart wordt geforceerd. Laat weg om de standaard begrensde wachttijd (`300000`) te gebruiken; stel `0` in om onbeperkt te wachten en periodieke waarschuwingen over nog lopende bewerkingen te loggen.

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
Hook-tokens in querystrings worden geweigerd.

Validatie- en veiligheidsnotities:

- `hooks.enabled=true` vereist een niet-lege `hooks.token`.
- `hooks.token` moet **anders** zijn dan `gateway.auth.token`; hergebruik van het Gateway-token wordt geweigerd.
- `hooks.path` mag niet `/` zijn; gebruik een specifiek subpad zoals `/hooks`.
- Als `hooks.allowRequestSessionKey=true`, beperk dan `hooks.allowedSessionKeyPrefixes` (bijvoorbeeld `["hook:"]`).
- Als een toewijzing of voorinstelling een sjabloonmatige `sessionKey` gebruikt, stel dan `hooks.allowedSessionKeyPrefixes` en `hooks.allowRequestSessionKey=true` in. Statische toewijzingssleutels vereisen die opt-in niet.

**Eindpunten:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` uit de request-payload wordt alleen geaccepteerd wanneer `hooks.allowRequestSessionKey=true` (standaard: `false`).
- `POST /hooks/<name>` → opgelost via `hooks.mappings`
  - Door sjabloon gerenderde `sessionKey`-waarden van toewijzingen worden behandeld als extern aangeleverd en vereisen ook `hooks.allowRequestSessionKey=true`.

<Accordion title="Details van toewijzingen">

- `match.path` matcht het subpad na `/hooks` (bijv. `/hooks/gmail` → `gmail`).
- `match.source` matcht een payloadveld voor generieke paden.
- Sjablonen zoals `{{messages[0].subject}}` lezen uit de payload.
- `transform` kan verwijzen naar een JS/TS-module die een hook-actie retourneert.
  - `transform.module` moet een relatief pad zijn en blijft binnen `hooks.transformsDir` (absolute paden en traversals worden geweigerd).
- `agentId` routeert naar een specifieke agent; onbekende ID's vallen terug op de standaardinstelling.
- `allowedAgentIds`: beperkt expliciete routering (`*` of weggelaten = alles toestaan, `[]` = alles weigeren).
- `defaultSessionKey`: optionele vaste sessiesleutel voor hook-agentruns zonder expliciete `sessionKey`.
- `allowRequestSessionKey`: sta toe dat `/hooks/agent`-aanroepers en sjabloongestuurde sessiesleutels van toewijzingen `sessionKey` instellen (standaard: `false`).
- `allowedSessionKeyPrefixes`: optionele allowlist met prefixen voor expliciete `sessionKey`-waarden (request + toewijzing), bijv. `["hook:"]`. Dit wordt vereist wanneer een toewijzing of voorinstelling een sjabloonmatige `sessionKey` gebruikt.
- `deliver: true` stuurt het uiteindelijke antwoord naar een kanaal; `channel` gebruikt standaard `last`.
- `model` overschrijft de LLM voor deze hook-run (moet toegestaan zijn als de modelcatalogus is ingesteld).

</Accordion>

### Gmail-integratie

- De ingebouwde Gmail-voorinstelling gebruikt `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Als je die routering per bericht behoudt, stel dan `hooks.allowRequestSessionKey: true` in en beperk `hooks.allowedSessionKeyPrefixes` zodat ze overeenkomen met de Gmail-naamruimte, bijvoorbeeld `["hook:", "hook:gmail:"]`.
- Als je `hooks.allowRequestSessionKey: false` nodig hebt, overschrijf dan de voorinstelling met een statische `sessionKey` in plaats van de sjabloonmatige standaardwaarde.

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

- Gateway start automatisch `gog gmail watch serve` bij het opstarten wanneer dit is geconfigureerd. Stel `OPENCLAW_SKIP_GMAIL_WATCHER=1` in om dit uit te schakelen.
- Voer geen afzonderlijke `gog gmail watch serve` uit naast de Gateway.

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
- Niet-loopback-binds: canvasroutes vereisen Gateway-authenticatie (token/wachtwoord/trusted-proxy), net als andere Gateway-HTTP-oppervlakken.
- Node WebViews sturen meestal geen auth-headers; nadat een node is gekoppeld en verbonden, adverteert de Gateway node-scoped capability-URL's voor canvas-/A2UI-toegang.
- Capability-URL's zijn gebonden aan de actieve Node WS-sessie en verlopen snel. IP-gebaseerde fallback wordt niet gebruikt.
- Injecteert een live-reload-client in geserveerde HTML.
- Maakt automatisch een starter-`index.html` aan wanneer leeg.
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

- `minimal` (standaard): laat `cliPath` + `sshPort` weg uit TXT-records.
- `full`: neem `cliPath` + `sshPort` op.
- De hostnaam is standaard de systeemhostnaam wanneer die een geldig DNS-label is, met fallback naar `openclaw`. Overschrijven kan met `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Schrijft een unicast DNS-SD-zone onder `~/.openclaw/dns/`. Voor cross-network discovery, combineer dit met een DNS-server (CoreDNS aanbevolen) + Tailscale split DNS.

Setup: `openclaw dns setup --apply`.

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

- Inline-omgevingsvariabelen worden alleen toegepast als de procesomgeving de sleutel mist.
- `.env`-bestanden: CWD `.env` + `~/.openclaw/.env` (geen van beide overschrijft bestaande variabelen).
- `shellEnv`: importeert ontbrekende verwachte sleutels uit het profiel van je login shell.
- Zie [Omgeving](/nl/help/environment) voor de volledige voorrangsvolgorde.

### Vervanging van omgevingsvariabelen

Verwijs in elke configuratiereeks naar omgevingsvariabelen met `${VAR_NAME}`:

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

Secret refs zijn additief: waarden in platte tekst blijven werken.

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
- `source: "exec"` id's mogen geen `.`- of `..`-padsegmenten bevatten die door slashes zijn gescheiden (bijvoorbeeld `a/../b` wordt geweigerd)

### Ondersteund credential-oppervlak

- Canonieke matrix: [SecretRef-credential-oppervlak](/nl/reference/secretref-credential-surface)
- `secrets apply` richt zich op ondersteunde credential-paden in `openclaw.json`.
- `auth-profiles.json`-refs zijn opgenomen in runtime-resolutie en auditdekking.

### Configuratie van secret-providers

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
- Bestand- en exec-providerpaden falen gesloten wanneer Windows-ACL-verificatie niet beschikbaar is. Stel `allowInsecurePath: true` alleen in voor vertrouwde paden die niet kunnen worden geverifieerd.
- `exec`-provider vereist een absoluut `command`-pad en gebruikt protocolpayloads op stdin/stdout.
- Standaard worden symlink-commandopaden geweigerd. Stel `allowSymlinkCommand: true` in om symlinkpaden toe te staan terwijl het opgeloste doelpad wordt gevalideerd.
- Als `trustedDirs` is geconfigureerd, is de vertrouwde-mapcontrole van toepassing op het opgeloste doelpad.
- De child-omgeving van `exec` is standaard minimaal; geef vereiste variabelen expliciet door met `passEnv`.
- Secret refs worden tijdens activatie opgelost naar een in-memory momentopname; daarna lezen requestpaden alleen de momentopname.
- Actief-oppervlakfiltering wordt toegepast tijdens activatie: onopgeloste refs op ingeschakelde oppervlakken laten startup/herladen mislukken, terwijl inactieve oppervlakken worden overgeslagen met diagnostiek.

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
- `auth-profiles.json` ondersteunt refs op waardeniveau (`keyRef` voor `api_key`, `tokenRef` voor `token`) voor statische credential-modi.
- Verouderde platte `auth-profiles.json`-mappings zoals `{ "provider": { "apiKey": "..." } }` zijn geen runtime-indeling; `openclaw doctor --fix` herschrijft ze naar canonieke `provider:default` API-key-profielen met een `.legacy-flat.*.bak`-back-up.
- OAuth-modusprofielen (`auth.profiles.<id>.mode = "oauth"`) ondersteunen geen auth-profielcredentials op basis van SecretRef.
- Statische runtimecredentials komen uit in-memory opgeloste momentopnamen; verouderde statische `auth.json`-vermeldingen worden opgeschoond wanneer ze worden gevonden.
- Verouderde OAuth-imports komen uit `~/.openclaw/credentials/oauth.json`.
- Zie [OAuth](/nl/concepts/oauth).
- Runtimegedrag van secrets en tooling voor `audit/configure/apply`: [Secrets-beheer](/nl/gateway/secrets).

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
  hier nog steeds terechtkomen, zelfs bij `401`/`403`-responses, maar providerspecifieke tekst-
  matchers blijven beperkt tot de provider die ze bezit (bijvoorbeeld OpenRouter
  `Key limit exceeded`). Retrybare HTTP `402`-berichten over gebruiksvensters of
  bestedingslimieten voor organisaties/werkruimten blijven in plaats daarvan in het
  `rate_limit`-pad.
- `billingBackoffHoursByProvider`: optionele overrides per provider voor factureringsbackoffuren.
- `billingMaxHours`: maximum in uren voor exponentiële groei van factureringsbackoff (standaard: `24`).
- `authPermanentBackoffMinutes`: basisbackoff in minuten voor `auth_permanent`-fouten met hoge betrouwbaarheid (standaard: `10`).
- `authPermanentMaxMinutes`: maximum in minuten voor groei van `auth_permanent`-backoff (standaard: `60`).
- `failureWindowHours`: voortschrijdend venster in uren dat wordt gebruikt voor backofftellers (standaard: `24`).
- `overloadedProfileRotations`: maximaal aantal auth-profielrotaties bij dezelfde provider voor overloaded-fouten voordat wordt overgeschakeld naar model-fallback (standaard: `1`). Provider-bezet-vormen zoals `ModelNotReadyException` komen hier terecht.
- `overloadedBackoffMs`: vaste vertraging voordat een overloaded provider-/profielrotatie opnieuw wordt geprobeerd (standaard: `0`).
- `rateLimitedProfileRotations`: maximaal aantal auth-profielrotaties bij dezelfde provider voor rate-limit-fouten voordat wordt overgeschakeld naar model-fallback (standaard: `1`). Die rate-limit-bucket bevat provider-vormgegeven tekst zoals `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` en `resource exhausted`.

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

- Standaardlogbestand: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Stel `logging.file` in voor een stabiel pad.
- `consoleLevel` gaat naar `debug` wanneer `--verbose` wordt gebruikt.
- `maxFileBytes`: maximale grootte van het actieve logbestand in bytes voordat rotatie plaatsvindt (positief geheel getal; standaard: `104857600` = 100 MB). OpenClaw bewaart maximaal vijf genummerde archieven naast het actieve bestand.
- `redactSensitive` / `redactPatterns`: best-effort maskering voor console-uitvoer, bestandslogs, OTLP-logrecords en bewaarde tekst van sessietranscripten. `redactSensitive: "off"` schakelt alleen dit algemene log-/transcriptbeleid uit; veiligheidsoppervlakken voor UI/tools/diagnostiek redigeren geheimen nog steeds voordat ze worden uitgezonden.

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
- `flags`: array met flagstrings die gerichte loguitvoer inschakelen (ondersteunt jokertekens zoals `"telegram.*"` of `"*"`).
- `stuckSessionWarnMs`: leeftijdsdrempel in ms voor het uitzenden van waarschuwingen over vastgelopen sessies terwijl een sessie in verwerkingsstatus blijft.
- `otel.enabled`: schakelt de OpenTelemetry-exportpipeline in (standaard: `false`). Zie [OpenTelemetry-export](/nl/gateway/opentelemetry) voor de volledige configuratie, signaalcatalogus en het privacymodel.
- `otel.endpoint`: collector-URL voor OTel-export.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: optionele signaalspecifieke OTLP-eindpunten. Wanneer ingesteld, overschrijven ze `otel.endpoint` alleen voor dat signaal.
- `otel.protocol`: `"http/protobuf"` (standaard) of `"grpc"`.
- `otel.headers`: extra HTTP/gRPC-metadataheaders die met OTel-exportverzoeken worden verzonden.
- `otel.serviceName`: servicenaam voor resource-attributen.
- `otel.traces` / `otel.metrics` / `otel.logs`: schakel trace-, metrics- of logexport in.
- `otel.sampleRate`: samplingpercentage voor traces `0`–`1`.
- `otel.flushIntervalMs`: periodiek flushinterval voor telemetrie in ms.
- `otel.captureContent`: opt-in vastlegging van ruwe inhoud voor OTEL-spanattributen. Staat standaard uit. Booleaanse waarde `true` legt niet-systeeminhoud van berichten/tools vast; met de objectvorm kun je `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` en `systemPrompt` expliciet inschakelen.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: omgevingsschakelaar voor de nieuwste experimentele GenAI-spanproviderattributen. Standaard behouden spans het verouderde `gen_ai.system`-attribuut voor compatibiliteit; GenAI-metrics gebruiken begrensde semantische attributen.
- `OPENCLAW_OTEL_PRELOADED=1`: omgevingsschakelaar voor hosts die al een globale OpenTelemetry-SDK hebben geregistreerd. OpenClaw slaat dan door plugins beheerde SDK-start/stop over terwijl diagnostische listeners actief blijven.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` en `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: signaalspecifieke eindpuntomgevingsvariabelen die worden gebruikt wanneer de overeenkomende configuratiesleutel niet is ingesteld.
- `cacheTrace.enabled`: log snapshots van cachetraces voor embedded runs (standaard: `false`).
- `cacheTrace.filePath`: uitvoerpad voor cachetrace-JSONL (standaard: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: bepalen wat in cachetrace-uitvoer wordt opgenomen (allemaal standaard: `true`).

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

- `channel`: releasekanaal voor npm-/git-installaties — `"stable"`, `"beta"` of `"dev"`.
- `checkOnStart`: controleer op npm-updates wanneer de Gateway start (standaard: `true`).
- `auto.enabled`: schakel automatische update op de achtergrond in voor pakketinstallaties (standaard: `false`).
- `auto.stableDelayHours`: minimale vertraging in uren voordat automatisch toepassen voor het stabiele kanaal plaatsvindt (standaard: `6`; max: `168`).
- `auto.stableJitterHours`: extra gespreid uitrolvenster voor het stabiele kanaal in uren (standaard: `12`; max: `168`).
- `auto.betaCheckIntervalHours`: hoe vaak controles voor het betakanaal worden uitgevoerd, in uren (standaard: `1`; max: `24`).

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

- `enabled`: globale ACP-functiepoort (standaard: `true`; stel in op `false` om ACP-dispatch en spawn-mogelijkheden te verbergen).
- `dispatch.enabled`: onafhankelijke poort voor ACP-sessieturndispatch (standaard: `true`). Stel in op `false` om ACP-opdrachten beschikbaar te houden terwijl uitvoering wordt geblokkeerd.
- `backend`: standaard-ID van de ACP-runtimebackend (moet overeenkomen met een geregistreerde ACP-runtimeplugin).
  Als `plugins.allow` is ingesteld, neem dan de backendplugin-ID op (bijvoorbeeld `acpx`), anders wordt de gebundelde standaardplugin niet geladen.
- `defaultAgent`: fallback-ID van de ACP-doelagent wanneer spawns geen expliciet doel opgeven.
- `allowedAgents`: allowlist met agent-ID's die zijn toegestaan voor ACP-runtimesessies; leeg betekent geen aanvullende beperking.
- `maxConcurrentSessions`: maximaal aantal gelijktijdig actieve ACP-sessies.
- `stream.coalesceIdleMs`: inactief flushvenster in ms voor gestreamde tekst.
- `stream.maxChunkChars`: maximale chunkgrootte voordat de projectie van een gestreamd blok wordt gesplitst.
- `stream.repeatSuppression`: onderdruk herhaalde status-/toolregels per turn (standaard: `true`).
- `stream.deliveryMode`: `"live"` streamt incrementeel; `"final_only"` buffert tot terminale turnevents.
- `stream.hiddenBoundarySeparator`: scheidingsteken vóór zichtbare tekst na verborgen toolevents (standaard: `"paragraph"`).
- `stream.maxOutputChars`: maximaal aantal uitvoertekens van de assistant dat per ACP-turn wordt geprojecteerd.
- `stream.maxSessionUpdateChars`: maximaal aantal tekens voor geprojecteerde ACP-status-/updateregels.
- `stream.tagVisibility`: record van tagnamen naar booleaanse zichtbaarheidsoverschrijvingen voor gestreamde events.
- `runtime.ttlMinutes`: inactieve TTL in minuten voor ACP-sessieworkers voordat ze in aanmerking komen voor opschoning.
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

- `cli.banner.taglineMode` beheert de stijl van de bannertagline:
  - `"random"` (standaard): roterende grappige/seizoensgebonden taglines.
  - `"default"`: vaste neutrale tagline (`All your chats, one OpenClaw.`).
  - `"off"`: geen taglinetekst (bannertitel/-versie wordt nog steeds getoond).
- Stel env `OPENCLAW_HIDE_BANNER=1` in om de volledige banner te verbergen (niet alleen taglines).

---

## Wizard

Metadata geschreven door begeleide CLI-configuratiestromen (`onboard`, `configure`, `doctor`):

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

Zie de identiteitsvelden van `agents.list` onder [Standaardwaarden voor agents](/nl/gateway/config-agents#agent-defaults).

---

## Brug (verouderd, verwijderd)

Huidige builds bevatten de TCP-brug niet meer. Nodes verbinden via de Gateway-WebSocket. `bridge.*`-sleutels maken geen deel meer uit van het configuratieschema (validatie faalt totdat ze zijn verwijderd; `openclaw doctor --fix` kan onbekende sleutels verwijderen).

<Accordion title="Verouderde brugconfiguratie (historische referentie)">

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

- `sessionRetention`: hoe lang voltooide geïsoleerde cronrunsessies worden bewaard voordat ze uit `sessions.json` worden gesnoeid. Beheert ook het opschonen van gearchiveerde verwijderde crontranscripten. Standaard: `24h`; stel in op `false` om uit te schakelen.
- `runLog.maxBytes`: maximale grootte per runlogbestand (`cron/runs/<jobId>.jsonl`) voordat snoeien plaatsvindt. Standaard: `2_000_000` bytes.
- `runLog.keepLines`: nieuwste regels die worden behouden wanneer runlogsnoei wordt geactiveerd. Standaard: `2000`.
- `webhookToken`: bearer-token gebruikt voor POST-bezorging van cron-webhooks (`delivery.mode = "webhook"`), als dit wordt weggelaten wordt er geen auth-header verzonden.
- `webhook`: verouderde fallback-webhook-URL (http/https), alleen gebruikt voor opgeslagen jobs die nog `notify: true` hebben.

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

- `maxAttempts`: maximaal aantal retries voor eenmalige jobs bij tijdelijke fouten (standaard: `3`; bereik: `0`–`10`).
- `backoffMs`: array met backoffvertragingen in ms voor elke retrypoging (standaard: `[30000, 60000, 300000]`; 1–10 items).
- `retryOn`: fouttypen die retries activeren — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Laat weg om alle tijdelijke typen opnieuw te proberen.

Is alleen van toepassing op eenmalige cronjobs. Terugkerende jobs gebruiken afzonderlijke foutafhandeling.

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

- `enabled`: schakel foutmeldingen voor cronjobs in (standaard: `false`).
- `after`: opeenvolgende fouten voordat een melding wordt geactiveerd (positief geheel getal, min: `1`).
- `cooldownMs`: minimaal aantal milliseconden tussen herhaalde meldingen voor dezelfde job (niet-negatief geheel getal).
- `includeSkipped`: tel opeenvolgende overgeslagen runs mee voor de meldingsdrempel (standaard: `false`). Overgeslagen runs worden afzonderlijk bijgehouden en hebben geen invloed op backoff voor uitvoeringsfouten.
- `mode`: bezorgmodus — `"announce"` verzendt via een kanaalbericht; `"webhook"` post naar de geconfigureerde webhook.
- `accountId`: optionele account- of kanaal-ID om meldingsbezorging af te bakenen.

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

- Standaardbestemming voor cron-foutmeldingen voor alle jobs.
- `mode`: `"announce"` of `"webhook"`; standaard `"announce"` wanneer er voldoende doelgegevens bestaan.
- `channel`: kanaaloverschrijving voor levering via announce. `"last"` hergebruikt het laatst bekende leveringskanaal.
- `to`: expliciet announce-doel of Webhook-URL. Vereist voor webhook-modus.
- `accountId`: optionele accountoverschrijving voor levering.
- Per-job `delivery.failureDestination` overschrijft deze globale standaard.
- Wanneer er geen globale of per-job-foutbestemming is ingesteld, vallen jobs die al via `announce` leveren bij een fout terug op dat primaire announce-doel.
- `delivery.failureDestination` wordt alleen ondersteund voor jobs met `sessionTarget="isolated"`, tenzij de primaire `delivery.mode` van de job `"webhook"` is.

Zie [Cron-jobs](/nl/automation/cron-jobs). Geïsoleerde cron-uitvoeringen worden bijgehouden als [achtergrondtaken](/nl/automation/tasks).

---

## Templatevariabelen voor mediamodellen

Templateplaatshouders die worden uitgebreid in `tools.media.models[].args`:

| Variabele          | Beschrijving                                      |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Volledige binnenkomende berichttekst              |
| `{{RawBody}}`      | Ruwe tekst (zonder geschiedenis-/afzender-wrappers) |
| `{{BodyStripped}}` | Tekst waaruit groepsvermeldingen zijn verwijderd  |
| `{{From}}`         | Afzender-ID                                       |
| `{{To}}`           | Bestemmings-ID                                    |
| `{{MessageSid}}`   | Kanaalbericht-ID                                  |
| `{{SessionId}}`    | Huidige sessie-UUID                               |
| `{{IsNewSession}}` | `"true"` wanneer een nieuwe sessie is gemaakt     |
| `{{MediaUrl}}`     | Pseudo-URL van binnenkomende media                |
| `{{MediaPath}}`    | Lokaal mediapad                                   |
| `{{MediaType}}`    | Mediatype (afbeelding/audio/document/…)           |
| `{{Transcript}}`   | Audiotranscript                                   |
| `{{Prompt}}`       | Opgeloste mediaprompt voor CLI-vermeldingen       |
| `{{MaxChars}}`     | Opgelost maximumaantal uitvoertekens voor CLI-vermeldingen |
| `{{ChatType}}`     | `"direct"` of `"group"`                           |
| `{{GroupSubject}}` | Groepsonderwerp (naar beste vermogen)             |
| `{{GroupMembers}}` | Voorbeeldweergave van groepsleden (naar beste vermogen) |
| `{{SenderName}}`   | Weergavenaam van afzender (naar beste vermogen)   |
| `{{SenderE164}}`   | Telefoonnummer van afzender (naar beste vermogen) |
| `{{Provider}}`     | Providerhint (whatsapp, telegram, discord, enz.)  |

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

- Eén bestand: vervangt het omvattende object.
- Array van bestanden: diep samengevoegd op volgorde (later overschrijft eerder).
- Sleutels op hetzelfde niveau: samengevoegd na includes (overschrijven opgenomen waarden).
- Geneste includes: tot 10 niveaus diep.
- Paden: opgelost relatief ten opzichte van het bestand dat include gebruikt, maar moeten binnen de configuratiemap op hoogste niveau blijven (`dirname` van `openclaw.json`). Absolute/`../`-vormen zijn alleen toegestaan wanneer ze nog steeds binnen die grens uitkomen.
- Schrijfacties die eigendom zijn van OpenClaw en die slechts één sectie op hoogste niveau wijzigen die door een include van één bestand wordt ondersteund, schrijven door naar dat opgenomen bestand. `plugins install` werkt bijvoorbeeld `plugins: { $include: "./plugins.json5" }` bij in `plugins.json5` en laat `openclaw.json` intact.
- Root-includes, include-arrays en includes met zusteroverschrijvingen zijn alleen-lezen voor schrijfacties die eigendom zijn van OpenClaw; die schrijfacties falen gesloten in plaats van de configuratie af te vlakken.
- Fouten: duidelijke berichten voor ontbrekende bestanden, parseerfouten en circulaire includes.

---

_Gerelateerd: [Configuratie](/nl/gateway/configuration) · [Configuratievoorbeelden](/nl/gateway/configuration-examples) · [Doctor](/nl/gateway/doctor)_

## Gerelateerd

- [Configuratie](/nl/gateway/configuration)
- [Configuratievoorbeelden](/nl/gateway/configuration-examples)
