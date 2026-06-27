---
read_when:
    - Je hebt exacte configuratiesemantiek of standaardwaarden op veldniveau nodig
    - Je valideert kanaal-, model-, Gateway- of toolconfiguratieblokken
summary: Gateway-configuratiereferentie voor kernsleutels van OpenClaw, standaardwaarden en links naar speciale referenties voor subsystemen
title: Configuratiereferentie
x-i18n:
    generated_at: "2026-06-27T17:32:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb8ebf55fe7562f00dbd42eb5fd00a7bac95ac934bdb0b778d04bb6926f28102
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Kernconfiguratiereferentie voor `~/.openclaw/openclaw.json`. Zie [Configuratie](/nl/gateway/configuration) voor een taakgericht overzicht.

Behandelt de belangrijkste OpenClaw-configuratievlakken en linkt door wanneer een subsysteem een eigen diepere referentie heeft. Kanaal- en plugin-beheerde opdrachtcatalogi en diepgaande memory/QMD-knoppen staan op hun eigen pagina's in plaats van op deze.

Codewaarheid:

- `openclaw config schema` print het live JSON Schema dat wordt gebruikt voor validatie en Control UI, met gebundelde/plugin/kanaalmetadata samengevoegd wanneer beschikbaar
- `config.schema.lookup` retourneert één padgescopeerde schemaknoop voor drill-downtooling
- `pnpm config:docs:check` / `pnpm config:docs:gen` valideren de baselinehash van de configuratiedocumentatie tegen het huidige schemavlak

Agent-opzoekpad: gebruik de `gateway`-toolactie `config.schema.lookup` voor
exacte veldspecifieke documentatie en beperkingen vóór bewerkingen. Gebruik
[Configuratie](/nl/gateway/configuration) voor taakgerichte begeleiding en deze pagina
voor de bredere veldkaart, standaardwaarden en links naar subsysteemreferenties.

Specifieke diepgaande referenties:

- [Memory-configuratiereferentie](/nl/reference/memory-config) voor `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` en dreaming-configuratie onder `plugins.entries.memory-core.config.dreaming`
- [Slash-opdrachten](/nl/tools/slash-commands) voor de huidige ingebouwde + gebundelde opdrachtcatalogus
- eigenaarskanaal-/pluginpagina's voor kanaalspecifieke opdrachtvlakken

Configuratie-indeling is **JSON5** (opmerkingen + afsluitende komma's toegestaan). Alle velden zijn optioneel - OpenClaw gebruikt veilige standaardwaarden wanneer ze worden weggelaten.

---

## Kanalen

Configuratiesleutels per kanaal zijn verplaatst naar een specifieke pagina - zie
[Configuratie - kanalen](/nl/gateway/config-channels) voor `channels.*`,
waaronder Slack, Discord, Telegram, WhatsApp, Matrix, iMessage en andere
gebundelde kanalen (authenticatie, toegangscontrole, meerdere accounts, vermelding-gating).

## Agent-standaardwaarden, multi-agent, sessies en berichten

Verplaatst naar een specifieke pagina - zie
[Configuratie - agents](/nl/gateway/config-agents) voor:

- `agents.defaults.*` (werkruimte, model, thinking, Heartbeat, memory, media, Skills, sandbox)
- `multiAgent.*` (multi-agent-routering en bindingen)
- `session.*` (sessielevenscyclus, Compaction, pruning)
- `messages.*` (berichtbezorging, TTS, markdown-rendering)
- `talk.*` (Talk-modus)
  - `talk.consultThinkingLevel`: overschrijving van thinking-niveau voor de volledige OpenClaw-agentuitvoering achter realtime consulten van Control UI Talk
  - `talk.consultFastMode`: eenmalige fast-mode-overschrijving voor realtime consulten van Control UI Talk
  - `talk.speechLocale`: optionele BCP 47-locale-id voor Talk-spraakherkenning op iOS/macOS
  - `talk.silenceTimeoutMs`: wanneer niet ingesteld, behoudt Talk het standaard pauzevenster van het platform voordat het transcript wordt verzonden (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: Gateway-relayfallback voor afgeronde realtime Talk-transcripten die `openclaw_agent_consult` overslaan

## Tools en aangepaste providers

Toolbeleid, experimentele schakelaars, door providers ondersteunde toolconfiguratie en aangepaste
provider-/base-URL-instelling zijn verplaatst naar een specifieke pagina - zie
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
- `models.providers`: aangepaste providermap met provider-id als sleutel.
- `models.providers.*.localService`: optionele on-demand procesmanager voor
  lokale modelservers. OpenClaw peilt het geconfigureerde health-endpoint, start
  de absolute `command` wanneer nodig, wacht op gereedheid en verzendt daarna het modelverzoek.
  Zie [Lokale modelservices](/nl/gateway/local-model-services).
- `models.pricing.enabled`: beheert de achtergrond-pricing-bootstrap die
  start nadat sidecars en kanalen het gereedpad van de Gateway bereiken. Wanneer `false`,
  slaat de Gateway het ophalen van OpenRouter- en LiteLLM-prijscatalogi over; geconfigureerde
  waarden voor `models.providers.*.models[].cost` blijven werken voor lokale kostenschattingen.

## MCP

Door OpenClaw beheerde MCP-serverdefinities staan onder `mcp.servers` en worden
gebruikt door embedded OpenClaw en andere runtime-adapters. De opdrachten `openclaw mcp list`,
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
        timeout: 20,
        connectTimeout: 5,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // Optional Codex app-server projection controls.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: benoemde stdio- of remote MCP-serverdefinities voor runtimes die
  geconfigureerde MCP-tools beschikbaar maken.
  Remote entries gebruiken `transport: "streamable-http"` of `transport: "sse"`;
  `type: "http"` is een CLI-native alias die `openclaw mcp set` en
  `openclaw doctor --fix` normaliseren naar het canonieke veld `transport`.
- `mcp.servers.<name>.enabled`: stel in op `false` om een opgeslagen serverdefinitie
  te behouden terwijl deze wordt uitgesloten van embedded OpenClaw MCP-discovery en toolprojectie.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: MCP-verzoektime-out per server
  in seconden of milliseconden.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: verbindingstime-out per server
  in seconden of milliseconden.
- `mcp.servers.<name>.supportsParallelToolCalls`: optionele concurrencyhint voor
  adapters die kunnen kiezen of ze parallelle MCP-toolaanroepen uitvoeren.
- `mcp.servers.<name>.auth`: stel in op `"oauth"` voor HTTP MCP-servers die
  OAuth vereisen. Voer `openclaw mcp login <name>` uit om tokens op te slaan onder OpenClaw-state.
- `mcp.servers.<name>.oauth`: optionele OAuth-scope, redirect-URL en overschrijvingen voor clientmetadata-URL.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: HTTP TLS-controls
  voor privé-endpoints en mutual TLS.
- `mcp.servers.<name>.toolFilter`: optionele toolselectie per server. `include`
  beperkt de ontdekte MCP-tools tot overeenkomende namen; `exclude` verbergt overeenkomende
  namen. Entries zijn exacte MCP-toolnamen of eenvoudige `*`-globs. Servers met
  resources of prompts genereren ook utility-toolnamen (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), en die namen gebruiken hetzelfde
  filter.
- `mcp.servers.<name>.codex`: optionele Codex app-server-projectiecontrols.
  Dit blok is OpenClaw-metadata uitsluitend voor Codex app-server-threads; het heeft geen
  invloed op ACP-sessies, generieke Codex-harnessconfiguratie of andere runtime-adapters.
  Niet-lege `codex.agents` beperkt de server tot de vermelde OpenClaw-agent-id's.
  Lege, blanco of ongeldige gescopeerde agentlijsten worden afgewezen door configuratievalidatie
  en weggelaten door het runtime-projectiepad in plaats van globaal te worden.
  `codex.defaultToolsApprovalMode` emit Codex's native
  `default_tools_approval_mode` voor die server. OpenClaw verwijdert het `codex`-blok
  voordat native `mcp_servers`-configuratie aan Codex wordt doorgegeven. Laat het blok weg om
  de server geprojecteerd te houden voor elke Codex app-server-agent met het standaard MCP-goedkeuringsgedrag van Codex.
- `mcp.sessionIdleTtlMs`: idle-TTL voor sessiegescopeerde gebundelde MCP-runtimes.
  Eenmalige embedded uitvoeringen vragen run-end-opruiming aan; deze TTL is de terugval
  voor langlevende sessies en toekomstige callers.
- Wijzigingen onder `mcp.*` worden hot-applied door gecachete sessie-MCP-runtimes te disposen.
  De volgende tool-discovery/het volgende toolgebruik maakt ze opnieuw aan vanuit de nieuwe configuratie, zodat verwijderde
  `mcp.servers`-entries onmiddellijk worden opgeruimd in plaats van te wachten op idle-TTL.
- Runtime-discovery respecteert ook MCP-tool-list-wijzigingsmeldingen door
  de gecachete catalogus voor die sessie te laten vallen. Servers die resources of
  prompts adverteren krijgen utility-tools voor het oplijsten/lezen van resources en het oplijsten/ophalen
  van prompts. Herhaalde tool-call-fouten pauzeren de getroffen server kort voordat
  een nieuwe aanroep wordt geprobeerd.

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
    workshop: {
      allowSymlinkTargetWrites: false,
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

- `allowBundled`: optionele allowlist uitsluitend voor gebundelde skills (beheerde/werkruimte-skills niet beïnvloed).
- `load.extraDirs`: extra gedeelde skill-roots (laagste prioriteit).
- `load.allowSymlinkTargets`: vertrouwde echte doelroots waarnaar skill-symlinks mogen
  resolven wanneer de link buiten de geconfigureerde bronroot staat.
- `workshop.allowSymlinkTargetWrites`: staat Skill Workshop-apply toe om te schrijven
  via al vertrouwde symlinkdoelen (standaard: false).
- `install.preferBrew`: wanneer true, geef de voorkeur aan Homebrew-installers wanneer `brew`
  beschikbaar is voordat wordt teruggevallen op andere installertypen.
- `install.nodeManager`: voorkeur voor Node-installer voor `metadata.openclaw.install`-specificaties
  (`npm` | `pnpm` | `yarn` | `bun`).
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

- Geladen vanuit package- of bundelmappen onder `~/.openclaw/extensions` en `<workspace>/.openclaw/extensions`, plus bestanden of mappen die in `plugins.load.paths` staan.
- Zet zelfstandige pluginbestanden in `plugins.load.paths`; automatisch ontdekte extensieroots negeren `.js`-, `.mjs`- en `.ts`-bestanden op het hoogste niveau, zodat helperscripts in die roots het opstarten niet blokkeren.
- Discovery accepteert native OpenClaw-plugins plus compatibele Codex-bundels en Claude-bundels, inclusief manifestloze Claude-bundels met standaardindeling.
- **Configwijzigingen vereisen een herstart van de Gateway.**
- `allow`: optionele toelatingslijst (alleen vermelde plugins worden geladen). `deny` heeft voorrang.
- `plugins.entries.<id>.apiKey`: handig API-sleutelveld op pluginniveau (wanneer ondersteund door de plugin).
- `plugins.entries.<id>.env`: env-varmap met pluginscope.
- `plugins.entries.<id>.hooks.allowPromptInjection`: wanneer `false`, blokkeert core `before_prompt_build` en negeert prompt-wijzigende velden van legacy `before_agent_start`, terwijl legacy `modelOverride` en `providerOverride` behouden blijven. Geldt voor native pluginhooks en ondersteunde door bundels geleverde hookmappen.
- `plugins.entries.<id>.hooks.allowConversationAccess`: wanneer `true`, mogen vertrouwde niet-gebundelde plugins ruwe gespreksinhoud lezen uit getypeerde hooks zoals `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` en `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: vertrouw deze plugin expliciet om per-run `provider`- en `model`-overrides aan te vragen voor achtergrondruns van subagents.
- `plugins.entries.<id>.subagent.allowedModels`: optionele toelatingslijst van canonieke `provider/model`-doelen voor vertrouwde subagent-overrides. Gebruik `"*"` alleen wanneer je bewust elk model wilt toestaan.
- `plugins.entries.<id>.llm.allowModelOverride`: vertrouw deze plugin expliciet om model-overrides aan te vragen voor `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: optionele toelatingslijst van canonieke `provider/model`-doelen voor vertrouwde overrides van plugin-LLM-voltooiingen. Gebruik `"*"` alleen wanneer je bewust elk model wilt toestaan.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: vertrouw deze plugin expliciet om `api.runtime.llm.complete` uit te voeren tegen een niet-standaard agent-id.
- `plugins.entries.<id>.config`: door de plugin gedefinieerd configobject (gevalideerd door het native OpenClaw-pluginschema wanneer beschikbaar).
- Account- en runtime-instellingen voor kanaalplugins staan onder `channels.<id>` en moeten worden beschreven door de `channelConfigs`-metadata in het manifest van de eigenaarplugin, niet door een centraal OpenClaw-optieregister.

### Configuratie van de Codex-harnessplugin

De gebundelde `codex`-plugin beheert native Codex-app-server-harnessinstellingen onder
`plugins.entries.codex.config`. Zie
[Codex-harnessreferentie](/nl/plugins/codex-harness-reference) voor het volledige configuratieoppervlak
en [Codex-harness](/nl/plugins/codex-harness) voor het runtimemodel.

`codexPlugins` geldt alleen voor sessies die de native Codex-harness selecteren.
Het schakelt geen Codex-plugins in voor OpenClaw-providerruns, ACP
gespreksbindingen of andere niet-Codex-harnassen.

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
  Gebruik `true` om veilige Codex-goedkeuringsschema's zonder prompt te accepteren, `false`
  om ze te weigeren, `"auto"` om door Codex vereiste goedkeuringen via OpenClaw
  plugingoedkeuringen te routeren, of `"always"` om voor elke plugin-schrijfactie/destructieve
  actie te vragen zonder duurzame goedkeuring. De modus `"always"` wist duurzame Codex
  per-tool-goedkeuringsoverrides voor de betrokken app voordat de thread wordt gestart.
  Standaard: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: schakelt een
  gemigreerde pluginvermelding in wanneer globale `codexPlugins.enabled` ook true is.
  Standaard: `true` voor expliciete vermeldingen.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  stabiele marketplace-identiteit. V1 ondersteunt alleen `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: stabiele
  Codex-pluginidentiteit uit migratie, bijvoorbeeld `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  override per plugin voor destructieve acties. Wanneer weggelaten, wordt de globale
  waarde `allow_destructive_actions` gebruikt. De waarde per plugin accepteert hetzelfde
  beleid: `true`, `false`, `"auto"` of `"always"`.

`codexPlugins.enabled` is de globale inschakelingsrichtlijn. Expliciete pluginvermeldingen
die door migratie zijn geschreven, vormen de duurzame installatie- en reparatiegeschiktheidsset.
`plugins["*"]` wordt niet ondersteund, er is geen `install`-schakelaar en lokale
`marketplacePath`-waarden zijn bewust geen configvelden omdat ze hostspecifiek zijn.

Gereedheidscontroles van `app/list` worden een uur gecachet en asynchroon vernieuwd
wanneer ze verouderd zijn. De app-configuratie van een Codex-thread wordt berekend bij het
opzetten van een Codex-harnesssessie, niet bij elke beurt; gebruik `/new`, `/reset` of een
Gateway-herstart na het wijzigen van native pluginconfiguratie.

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl-instellingen voor web-fetchprovider.
  - `apiKey`: Optionele Firecrawl-API-sleutel voor hogere limieten (accepteert SecretRef). Valt terug op `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey` of de env-var `FIRECRAWL_API_KEY`.
  - `baseUrl`: basis-URL van de Firecrawl-API (standaard: `https://api.firecrawl.dev`; self-hosted overrides moeten naar private/interne endpoints wijzen).
  - `onlyMainContent`: extraheer alleen de hoofdinhoud van pagina's (standaard: `true`).
  - `maxAgeMs`: maximale cacheleeftijd in milliseconden (standaard: `172800000` / 2 dagen).
  - `timeoutSeconds`: timeout voor scrapeverzoeken in seconden (standaard: `60`).
- `plugins.entries.xai.config.xSearch`: instellingen voor xAI X Search (Grok-webzoekopdracht).
  - `enabled`: schakel de X Search-provider in.
  - `model`: Grok-model om voor zoeken te gebruiken (bijv. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: instellingen voor memory dreaming. Zie [Dreaming](/nl/concepts/dreaming) voor fasen en drempels.
  - `enabled`: hoofdschakelaar voor dreaming (standaard `false`).
  - `frequency`: Cron-cadans voor elke volledige dreaming-sweep (standaard `"0 3 * * *"`).
  - `model`: optionele model-override voor de Dream Diary-subagent. Vereist `plugins.entries.memory-core.subagent.allowModelOverride: true`; combineer met `allowedModels` om doelen te beperken. Fouten door niet-beschikbare modellen proberen eenmaal opnieuw met het standaardsessiemodel; vertrouwens- of toelatingslijstfouten vallen niet stilzwijgend terug.
  - fasebeleid en drempels zijn implementatiedetails (geen gebruikersgerichte configsleutels).
- Volledige geheugenconfiguratie staat in [Referentie voor geheugenconfiguratie](/nl/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Ingeschakelde Claude-bundelplugins kunnen ook ingebedde OpenClaw-standaarden uit `settings.json` bijdragen; OpenClaw past die toe als gesaneerde agentinstellingen, niet als ruwe OpenClaw-configpatches.
- `plugins.slots.memory`: kies de actieve geheugenplugin-id, of `"none"` om geheugenplugins uit te schakelen.
- `plugins.slots.contextEngine`: kies de actieve context-engine-plugin-id; standaard is `"legacy"`, tenzij je een andere engine installeert en selecteert.

Zie [Plugins](/nl/tools/plugin).

---

## Toezeggingen

`commitments` beheert afgeleid vervolggeheugen: OpenClaw kan check-ins uit gespreksbeurten detecteren en ze leveren via Heartbeat-runs.

- `commitments.enabled`: schakel verborgen LLM-extractie, opslag en Heartbeat-levering in voor afgeleide vervolgtoezeggingen. Standaard: `false`.
- `commitments.maxPerDay`: maximaal aantal afgeleide vervolgtoezeggingen dat per agentsessie in een voortschrijdende dag wordt geleverd. Standaard: `3`.

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
- `tabCleanup` ruimt bijgehouden tabs van primaire agents op na inactiviteit of wanneer een
  sessie zijn limiet overschrijdt. Stel `idleMinutes: 0` of `maxTabsPerSession: 0` in om
  die afzonderlijke opschoonmodi uit te schakelen.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` is uitgeschakeld wanneer dit niet is ingesteld, dus browsernavigatie blijft standaard strikt.
- Stel `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` alleen in wanneer je private-network browsernavigatie bewust vertrouwt.
- In strikte modus vallen remote CDP-profieleindpunten (`profiles.*.cdpUrl`) onder dezelfde private-network-blokkering tijdens bereikbaarheids- en discovery-controles.
- `ssrfPolicy.allowPrivateNetwork` blijft ondersteund als legacy-alias.
- Gebruik in strikte modus `ssrfPolicy.hostnameAllowlist` en `ssrfPolicy.allowedHostnames` voor expliciete uitzonderingen.
- Remote profielen zijn alleen attach-only (starten/stoppen/resetten uitgeschakeld).
- `profiles.*.cdpUrl` accepteert `http://`, `https://`, `ws://` en `wss://`.
  Gebruik HTTP(S) wanneer je wilt dat OpenClaw `/json/version` ontdekt; gebruik WS(S)
  wanneer je provider je een directe DevTools WebSocket-URL geeft.
- `remoteCdpTimeoutMs` en `remoteCdpHandshakeTimeoutMs` gelden voor remote en
  `attachOnly` CDP-bereikbaarheid plus aanvragen om tabs te openen. Beheerde loopback-
  profielen behouden lokale CDP-standaarden.
- Als een extern beheerde CDP-service via loopback bereikbaar is, stel dan voor dat
  profiel `attachOnly: true` in; anders behandelt OpenClaw de loopback-poort als een
  lokaal beheerd browserprofiel en kan het fouten over lokaal poorteigendom melden.
- `existing-session`-profielen gebruiken Chrome MCP in plaats van CDP en kunnen attachen op
  de geselecteerde host of via een verbonden browsernode.
- `existing-session`-profielen kunnen `userDataDir` instellen om een specifiek
  Chromium-gebaseerd browserprofiel te targeten, zoals Brave of Edge.
- `existing-session`-profielen kunnen `cdpUrl` instellen wanneer Chrome al draait
  achter een DevTools HTTP(S)-discovery-eindpunt of direct WS(S)-eindpunt. In die
  modus geeft OpenClaw het eindpunt door aan Chrome MCP in plaats van auto-connect te gebruiken;
  `userDataDir` wordt genegeerd voor Chrome MCP-startargumenten.
- `existing-session`-profielen behouden de huidige routelimieten van Chrome MCP:
  snapshot/ref-gestuurde acties in plaats van CSS-selector-targeting, hooks voor uploaden van één bestand,
  geen overrides voor dialoogtime-outs, geen `wait --load networkidle`, en geen
  `responsebody`, PDF-export, downloadonderschepping of batchacties.
- Lokaal beheerde `openclaw`-profielen wijzen automatisch `cdpPort` en `cdpUrl` toe; stel
  `cdpUrl` alleen expliciet in voor remote CDP-profielen of attachen aan een existing-session-eindpunt.
- Lokaal beheerde profielen kunnen `executablePath` instellen om de globale
  `browser.executablePath` voor dat profiel te overschrijven. Gebruik dit om één profiel in
  Chrome en een ander in Brave te draaien.
- Lokaal beheerde profielen gebruiken `browser.localLaunchTimeoutMs` voor Chrome CDP HTTP-
  discovery na het starten van het proces en `browser.localCdpReadyTimeoutMs` voor
  CDP-websocketgereedheid na het starten. Verhoog ze op tragere hosts waar Chrome
  succesvol start maar gereedheidscontroles met het opstarten racen. Beide waarden moeten
  positieve gehele getallen tot `120000` ms zijn; ongeldige configuratiewaarden worden geweigerd.
- Automatische detectievolgorde: standaardbrowser indien Chromium-gebaseerd → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` en `browser.profiles.<name>.executablePath` accepteren allebei
  `~` en `~/...` voor de thuismap van je OS vóór het starten van Chromium.
  `userDataDir` per profiel op `existing-session`-profielen wordt ook met tilde uitgebreid.
- Control-service: alleen loopback (poort afgeleid van `gateway.port`, standaard `18791`).
- `extraArgs` voegt extra startflags toe aan lokale Chromium-start (bijvoorbeeld
  `--disable-gpu`, venstergrootte of debugflags).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, korte tekst, afbeeldings-URL of data-URI
    },
  },
}
```

- `seamColor`: accentkleur voor native app-UI-chrome (Talk Mode-bubbeltint, enz.).
- `assistant`: identiteitsoverschrijving voor Control UI. Valt terug op actieve agentidentiteit.

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
      url: "ws://127.0.0.1:18789",
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
      // Remove tools from the default HTTP deny list for owner/admin callers
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
- **Verouderde bind-aliassen**: gebruik bind-moduswaarden in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), niet host-aliassen (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-opmerking**: de standaard `loopback`-bind luistert naar `127.0.0.1` binnen de container. Met Docker bridge-netwerken (`-p 18789:18789`) komt verkeer binnen op `eth0`, waardoor de gateway onbereikbaar is. Gebruik `--network host`, of stel `bind: "lan"` in (of `bind: "custom"` met `customBindHost: "0.0.0.0"`) om op alle interfaces te luisteren.
- **Auth**: standaard vereist. Niet-loopback-binds vereisen gateway-auth. In de praktijk betekent dit een gedeelde token/wachtwoord of een identity-aware reverse proxy met `gateway.auth.mode: "trusted-proxy"`. De onboardingwizard genereert standaard een token.
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd (inclusief SecretRefs), stel `gateway.auth.mode` dan expliciet in op `token` of `password`. Opstarten en service-installatie-/herstelstromen mislukken wanneer beide zijn geconfigureerd en de modus niet is ingesteld.
- `gateway.auth.mode: "none"`: expliciete modus zonder auth. Alleen gebruiken voor vertrouwde lokale local loopback-configuraties; dit wordt bewust niet aangeboden door onboardingprompts.
- `gateway.auth.mode: "trusted-proxy"`: delegeer browser-/gebruikersauth aan een identity-aware reverse proxy en vertrouw identiteitsheaders van `gateway.trustedProxies` (zie [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth)). Deze modus verwacht standaard een **niet-loopback** proxybron; reverse proxies op dezelfde host via loopback vereisen expliciet `gateway.auth.trustedProxy.allowLoopback = true`. Interne callers op dezelfde host kunnen `gateway.auth.password` gebruiken als lokale directe fallback; `gateway.auth.token` blijft wederzijds exclusief met trusted-proxy-modus.
- `gateway.auth.allowTailscale`: wanneer `true`, kunnen Tailscale Serve-identiteitsheaders voldoen aan bedienings-UI-/WebSocket-auth (geverifieerd via `tailscale whois`). HTTP API-eindpunten gebruiken die Tailscale-headerauth **niet**; ze volgen in plaats daarvan de normale HTTP-authmodus van de gateway. Deze tokenloze flow gaat ervan uit dat de gatewayhost vertrouwd is. Standaard `true` wanneer `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: optionele limiter voor mislukte auth. Geldt per client-IP en per auth-scope (shared-secret en device-token worden afzonderlijk bijgehouden). Geblokkeerde pogingen retourneren `429` + `Retry-After`.
  - Op het asynchrone Tailscale Serve-pad voor de bedienings-UI worden mislukte pogingen voor dezelfde `{scope, clientIp}` geserialiseerd voordat de fout wordt geschreven. Gelijktijdige ongeldige pogingen van dezelfde client kunnen daardoor de limiter bij de tweede aanvraag activeren in plaats van allebei als gewone mismatches door te gaan.
  - `gateway.auth.rateLimit.exemptLoopback` is standaard `true`; stel dit in op `false` wanneer je bewust ook localhost-verkeer wilt rate-limiten (voor testopstellingen of strikte proxy-implementaties).
- WS-authpogingen vanuit browser-origins worden altijd beperkt met loopback-vrijstelling uitgeschakeld (defense-in-depth tegen browsergebaseerde brute force op localhost).
- Op loopback worden die browser-origin-lockouts geïsoleerd per genormaliseerde `Origin`
  waarde, zodat herhaalde mislukkingen vanaf één localhost-origin niet automatisch
  een andere origin blokkeren.
- `tailscale.mode`: `serve` (alleen tailnet, loopback-bind) of `funnel` (publiek, vereist auth).
- `tailscale.serviceName`: optionele Tailscale Service-naam voor Serve-modus, zoals
  `svc:openclaw`. Wanneer ingesteld geeft OpenClaw dit door aan `tailscale serve
--service`, zodat de bedienings-UI via een benoemde Service kan worden aangeboden in plaats
  van via de hostnaam van het apparaat. De waarde moet Tailscale's `svc:<dns-label>`
  Service-naamformaat gebruiken; bij het opstarten wordt de afgeleide Service-URL gemeld.
- `tailscale.preserveFunnel`: wanneer `true` en `tailscale.mode = "serve"`, controleert OpenClaw
  `tailscale funnel status` voordat Serve opnieuw wordt toegepast bij het opstarten en slaat
  dit over als een extern geconfigureerde Funnel-route de gatewaypoort al dekt.
  Standaard `false`.
- `controlUi.allowedOrigins`: expliciete allowlist voor browser-origins voor Gateway WebSocket-verbindingen. Vereist voor publieke niet-loopback browser-origins. Private same-origin LAN-/Tailnet-UI-ladingen vanaf loopback, RFC1918/link-local, `.local`, `.ts.net`, of Tailscale CGNAT-hosts worden geaccepteerd zonder Host-header-fallback in te schakelen.
- `controlUi.chatMessageMaxWidth`: optionele maximale breedte voor gegroepeerde chatberichten in de bedienings-UI. Accepteert beperkte CSS-breedtewaarden zoals `960px`, `82%`, `min(1280px, 82%)`, en `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gevaarlijke modus die Host-header-origin-fallback inschakelt voor implementaties die bewust vertrouwen op Host-header-originbeleid.
- `remote.transport`: `ssh` (standaard) of `direct` (ws/wss). Voor `direct` moet `remote.url` `wss://` zijn voor publieke hosts; platte tekst `ws://` wordt alleen geaccepteerd voor loopback, LAN, link-local, `.local`, `.ts.net`, en Tailscale CGNAT-hosts.
- `remote.remotePort`: gatewaypoort op de externe SSH-host. Standaard `18789`; gebruik dit wanneer de lokale tunnelpoort verschilt van de externe gatewaypoort.
- `gateway.remote.token` / `.password` zijn credentialvelden voor externe clients. Ze configureren gateway-auth niet zelf.
- `gateway.push.apns.relay.baseUrl`: basis-HTTPS-URL voor de externe APNs-relay die wordt gebruikt nadat relay-ondersteunde iOS-builds registraties naar de gateway publiceren. Publieke App Store-/TestFlight-builds gebruiken de gehoste OpenClaw-relay. Aangepaste relay-URL's moeten overeenkomen met een bewust apart iOS-build-/implementatiepad waarvan de relay-URL naar die relay verwijst.
- `gateway.push.apns.relay.timeoutMs`: verzendtimeout van gateway naar relay in milliseconden. Standaard `10000`.
- Relay-ondersteunde registraties worden gedelegeerd aan een specifieke gatewayidentiteit. De gekoppelde iOS-app haalt `gateway.identity.get` op, neemt die identiteit op in de relayregistratie en stuurt een registratiegebonden verzendtoekenning door naar de gateway. Een andere gateway kan die opgeslagen registratie niet hergebruiken.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: tijdelijke env-overrides voor de relayconfiguratie hierboven.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: alleen-ontwikkeling ontsnappingsroute voor loopback-HTTP-relay-URL's. Productie-relay-URL's moeten HTTPS blijven gebruiken.
- `gateway.handshakeTimeoutMs`: pre-auth Gateway WebSocket-handshake-timeout in milliseconden. Standaard: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` krijgt voorrang wanneer ingesteld. Verhoog dit op belaste of energiezuinige hosts waar lokale clients kunnen verbinden terwijl de opstart-warmup nog stabiliseert.
- `gateway.channelHealthCheckMinutes`: interval voor channel health-monitor in minuten. Stel `0` in om herstarts door de health-monitor globaal uit te schakelen. Standaard: `5`.
- `gateway.channelStaleEventThresholdMinutes`: stale-socket-drempel in minuten. Houd dit groter dan of gelijk aan `gateway.channelHealthCheckMinutes`. Standaard: `30`.
- `gateway.channelMaxRestartsPerHour`: maximaal aantal health-monitor-herstarts per kanaal/account in een rollend uur. Standaard: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per kanaal voor health-monitor-herstarts terwijl de globale monitor ingeschakeld blijft.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per account voor multi-account-kanalen. Wanneer ingesteld krijgt dit voorrang op de override op kanaalniveau.
- Lokale gateway-callpaden kunnen `gateway.remote.*` alleen als fallback gebruiken wanneer `gateway.auth.*` niet is ingesteld.
- Als `gateway.auth.token` / `gateway.auth.password` expliciet via SecretRef is geconfigureerd en niet kan worden opgelost, faalt de resolutie gesloten (geen masking door externe fallback).
- `trustedProxies`: reverse-proxy-IP's die TLS beëindigen of forwarded-client-headers injecteren. Vermeld alleen proxies die je beheert. Loopback-items blijven geldig voor proxy-/lokale-detectieopstellingen op dezelfde host (bijvoorbeeld Tailscale Serve of een lokale reverse proxy), maar ze maken loopback-aanvragen **niet** geschikt voor `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: wanneer `true`, accepteert de gateway `X-Real-IP` als `X-Forwarded-For` ontbreekt. Standaard `false` voor fail-closed-gedrag.
- `gateway.nodes.pairing.autoApproveCidrs`: optionele CIDR/IP-allowlist voor het automatisch goedkeuren van eerste node-device-pairing zonder aangevraagde scopes. Dit is uitgeschakeld wanneer niet ingesteld. Dit keurt operator-/browser-/bedienings-UI-/WebChat-pairing niet automatisch goed, en keurt rol-, scope-, metadata- of public-key-upgrades niet automatisch goed.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globale allow/deny-vormgeving voor gedeclareerde node-opdrachten na pairing en evaluatie van de platform-allowlist. Gebruik `allowCommands` om gevaarlijke node-opdrachten zoals `camera.snap`, `camera.clip`, en `screen.record` expliciet toe te staan; `denyCommands` verwijdert een opdracht, zelfs als een platformstandaard of expliciete allow deze anders zou opnemen. Nadat een node zijn gedeclareerde opdrachtenlijst wijzigt, wijs je die apparaatpairing af en keur je deze opnieuw goed, zodat de gateway de bijgewerkte opdrachtsnapshot opslaat.
- `gateway.tools.deny`: extra toolnamen die worden geblokkeerd voor HTTP `POST /tools/invoke` (breidt de standaard-denylijst uit).
- `gateway.tools.allow`: verwijder toolnamen uit de standaard HTTP-denylijst voor
  owner-/admin-callers. Dit upgrade identity-bearing `operator.write`
  callers niet naar owner-/admin-toegang; `cron`, `gateway`, en `nodes` blijven
  niet beschikbaar voor niet-owner-callers, zelfs wanneer ze op de allowlist staan.

</Accordion>

### OpenAI-compatibele eindpunten

- Admin HTTP RPC: standaard uitgeschakeld als de `admin-http-rpc`-Plugin. Schakel de Plugin in om `POST /api/v1/admin/rpc` te registreren. Zie [Admin HTTP RPC](/nl/plugins/admin-http-rpc).
- Chat Completions: standaard uitgeschakeld. Schakel in met `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Verharding voor Responses-URL-invoer:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Lege allowlists worden behandeld als niet ingesteld; gebruik `gateway.http.endpoints.responses.files.allowUrl=false`
    en/of `gateway.http.endpoints.responses.images.allowUrl=false` om URL-fetching uit te schakelen.
- Optionele response-verhardingsheader:
  - `gateway.http.securityHeaders.strictTransportSecurity` (alleen instellen voor HTTPS-origins die je beheert; zie [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolatie van meerdere instanties

Voer meerdere gateways uit op één host met unieke poorten en state-dirs:

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

- `enabled`: schakelt TLS-beëindiging in bij de gateway-listener (HTTPS/WSS) (standaard: `false`).
- `autoGenerate`: genereert automatisch een lokaal self-signed cert/key-paar wanneer expliciete bestanden niet zijn geconfigureerd; alleen voor lokaal/dev-gebruik.
- `certPath`: bestandssysteempad naar het TLS-certificaatbestand.
- `keyPath`: bestandssysteempad naar het TLS-privésleutelbestand; houd rechten beperkt.
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
  - `"off"`: negeer live bewerkingen; wijzigingen vereisen een expliciete herstart.
  - `"restart"`: herstart het Gateway-proces altijd bij een configuratiewijziging.
  - `"hot"`: pas wijzigingen binnen het proces toe zonder herstart.
  - `"hybrid"` (standaard): probeer eerst hot reload; val terug op herstart als dat vereist is.
- `debounceMs`: debounce-venster in ms voordat configuratiewijzigingen worden toegepast (niet-negatief geheel getal).
- `deferralTimeoutMs`: optionele maximale wachttijd in ms voor lopende bewerkingen voordat een herstart of hot reload van een kanaal wordt afgedwongen. Laat dit weg om de standaard begrensde wachttijd (`300000`) te gebruiken; stel in op `0` om onbeperkt te wachten en periodiek waarschuwingen te loggen dat er nog taken in behandeling zijn.

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
Hook-tokens in querystrings worden geweigerd.

Validatie- en veiligheidsopmerkingen:

- `hooks.enabled=true` vereist een niet-lege `hooks.token`.
- `hooks.token` moet verschillen van actieve gedeelde-geheim-authenticatie voor Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` of `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); bij het opstarten wordt een niet-fatale beveiligingswaarschuwing gelogd wanneer hergebruik wordt gedetecteerd.
- `openclaw security audit` markeert hergebruik van hook-/Gateway-authenticatie als een kritieke bevinding, inclusief Gateway-wachtwoordauthenticatie die alleen tijdens de audit wordt opgegeven (`--auth password --password <password>`). Voer `openclaw doctor --fix` uit om een persistent hergebruikt `hooks.token` te roteren en werk daarna externe hook-verzenders bij zodat ze het nieuwe hook-token gebruiken.
- `hooks.path` mag niet `/` zijn; gebruik een toegewijd subpad zoals `/hooks`.
- Als `hooks.allowRequestSessionKey=true`, beperk dan `hooks.allowedSessionKeyPrefixes` (bijvoorbeeld `["hook:"]`).
- Als een mapping of preset een getemplate `sessionKey` gebruikt, stel dan `hooks.allowedSessionKeyPrefixes` en `hooks.allowRequestSessionKey=true` in. Statische mappingsleutels vereisen die opt-in niet.

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
  - Houd `hooks.transformsDir` onder `~/.openclaw/hooks/transforms`; workspace-Skills-mappen worden geweigerd. Als `openclaw doctor` dit pad als ongeldig rapporteert, verplaats de transform-module dan naar de hooks-transformmap of verwijder `hooks.transformsDir`.
- `agentId` routeert naar een specifieke agent; onbekende ID's vallen terug op de standaardagent.
- `allowedAgentIds`: beperkt effectieve agentroutering, inclusief het pad voor de standaardagent wanneer `agentId` is weggelaten (`*` of weggelaten = alles toestaan, `[]` = alles weigeren).
- `defaultSessionKey`: optionele vaste sessiesleutel voor hook-agentruns zonder expliciete `sessionKey`.
- `allowRequestSessionKey`: sta aanroepers van `/hooks/agent` en template-gestuurde mapping-sessiesleutels toe om `sessionKey` in te stellen (standaard: `false`).
- `allowedSessionKeyPrefixes`: optionele prefix-allowlist voor expliciete `sessionKey`-waarden (request + mapping), bijv. `["hook:"]`. Dit wordt vereist wanneer een mapping of preset een getemplate `sessionKey` gebruikt.
- `deliver: true` stuurt het uiteindelijke antwoord naar een kanaal; `channel` gebruikt standaard `last`.
- `model` overschrijft de LLM voor deze hook-run (moet toegestaan zijn als de modelcatalogus is ingesteld).

</Accordion>

### Gmail-integratie

- De ingebouwde Gmail-preset gebruikt `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Als je die routering per bericht behoudt, stel dan `hooks.allowRequestSessionKey: true` in en beperk `hooks.allowedSessionKeyPrefixes` zodat ze overeenkomen met de Gmail-namespace, bijvoorbeeld `["hook:", "hook:gmail:"]`.
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
- Voer geen aparte `gog gmail watch serve` uit naast de Gateway.

---

## Canvas Plugin-host

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
- Niet-loopback-bindings: canvasroutes vereisen Gateway-authenticatie (token/wachtwoord/trusted-proxy), net als andere HTTP-oppervlakken van Gateway.
- Node WebViews sturen doorgaans geen authenticatieheaders; nadat een Node is gekoppeld en verbonden, adverteert de Gateway node-scoped capability-URL's voor toegang tot canvas/A2UI.
- Capability-URL's zijn gebonden aan de actieve Node-WS-sessie en verlopen snel. IP-gebaseerde fallback wordt niet gebruikt.
- Injecteert de live-reloadclient in geserveerde HTML.
- Maakt automatisch een starter-`index.html` aan wanneer de map leeg is.
- Serveert A2UI ook op `/__openclaw__/a2ui/`.
- Wijzigingen vereisen een herstart van de Gateway.
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

- `minimal` (standaard wanneer de gebundelde `bonjour`-Plugin is ingeschakeld): laat `cliPath` + `sshPort` weg uit TXT-records.
- `full`: neem `cliPath` + `sshPort` op; LAN-multicast-advertising vereist nog steeds dat de gebundelde `bonjour`-Plugin is ingeschakeld.
- `off`: onderdruk LAN-multicast-advertising zonder Plugin-inschakeling te wijzigen.
- De gebundelde `bonjour`-Plugin start automatisch op macOS-hosts en is opt-in op Linux, Windows en gecontaineriseerde Gateway-implementaties.
- De hostnaam gebruikt standaard de systeemhostnaam wanneer die een geldig DNS-label is, met fallback naar `openclaw`. Overschrijf dit met `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Schrijft een unicast DNS-SD-zone onder `~/.openclaw/dns/`. Combineer dit voor ontdekking tussen netwerken met een DNS-server (CoreDNS aanbevolen) + Tailscale split-DNS.

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
- `shellEnv`: importeert ontbrekende verwachte sleutels uit je aanmeldshellprofiel.
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

Geheimverwijzingen zijn aanvullend: platte-tekstwaarden blijven werken.

### `SecretRef`

Gebruik één objectvorm:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validatie:

- `provider`-patroon: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id-patroon: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: absolute JSON-pointer (bijvoorbeeld `"/providers/openai/apiKey"`)
- `source: "exec"` id-patroon: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (ondersteunt AWS-achtige `secret#json_key`-selectors)
- `source: "exec"` ids mogen geen `.` of `..` slash-gescheiden padsegmenten bevatten (bijvoorbeeld `a/../b` wordt geweigerd)

### Ondersteund credential-oppervlak

- Canonieke matrix: [SecretRef Credential Surface](/nl/reference/secretref-credential-surface)
- `secrets apply` richt zich op ondersteunde credential-paden in `openclaw.json`.
- `auth-profiles.json`-verwijzingen worden meegenomen in runtime-resolutie en auditdekking.

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
- Standaard worden symlinkpaden voor opdrachten geweigerd. Stel `allowSymlinkCommand: true` in om symlinkpaden toe te staan terwijl het opgeloste doelpad wordt gevalideerd.
- Als `trustedDirs` is geconfigureerd, wordt de trusted-dir-controle toegepast op het opgeloste doelpad.
- De child-omgeving van `exec` is standaard minimaal; geef vereiste variabelen expliciet door met `passEnv`.
- Geheimverwijzingen worden tijdens activatie opgelost naar een in-memory snapshot, waarna aanvraagpaden alleen de snapshot lezen.
- Filtering van het actieve oppervlak wordt toegepast tijdens activatie: niet-opgeloste verwijzingen op ingeschakelde oppervlakken laten startup/reload falen, terwijl inactieve oppervlakken worden overgeslagen met diagnostiek.

---

## Auth-opslag

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- Profielen per agent worden opgeslagen in `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` ondersteunt refs op waardeniveau (`keyRef` voor `api_key`, `tokenRef` voor `token`) voor statische credential-modi.
- Verouderde platte `auth-profiles.json`-mappen zoals `{ "provider": { "apiKey": "..." } }` zijn geen runtime-indeling; `openclaw doctor --fix` herschrijft ze naar canonieke `provider:default` API-key-profielen met een `.legacy-flat.*.bak`-back-up.
- Profielen in OAuth-modus (`auth.profiles.<id>.mode = "oauth"`) ondersteunen geen auth-profile-credentials op basis van SecretRef.
- Statische runtime-credentials komen uit in het geheugen opgeloste snapshots; verouderde statische `auth.json`-vermeldingen worden opgeschoond wanneer ze worden ontdekt.
- Verouderde OAuth-import komt uit `~/.openclaw/credentials/oauth.json`.
- Zie [OAuth](/nl/concepts/oauth).
- Runtimegedrag voor geheimen en tooling voor `audit/configure/apply`: [Geheimenbeheer](/nl/gateway/secrets).

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
  hier nog steeds terechtkomen, zelfs bij `401`-/`403`-reacties, maar aanbiederspecifieke tekst-
  matchers blijven beperkt tot de aanbieder die ze bezit (bijvoorbeeld OpenRouter
  `Key limit exceeded`). Opnieuw te proberen HTTP `402`-gebruiksvenster- of
  organisatie-/workspace-uitgavelimietberichten blijven in plaats daarvan in het `rate_limit`-pad.
- `billingBackoffHoursByProvider`: optionele overrides per aanbieder voor facturerings-backoff in uren.
- `billingMaxHours`: maximum in uren voor exponentiële groei van facturerings-backoff (standaard: `24`).
- `authPermanentBackoffMinutes`: basis-backoff in minuten voor zeer zekere `auth_permanent`-fouten (standaard: `10`).
- `authPermanentMaxMinutes`: maximum in minuten voor groei van `auth_permanent`-backoff (standaard: `60`).
- `failureWindowHours`: rollend venster in uren dat wordt gebruikt voor backoff-tellers (standaard: `24`).
- `overloadedProfileRotations`: maximumaantal auth-profile-rotaties bij dezelfde aanbieder voor overbelastingsfouten voordat wordt overgeschakeld naar model-fallback (standaard: `1`). Aanbieder-bezette vormen zoals `ModelNotReadyException` komen hier terecht.
- `overloadedBackoffMs`: vaste vertraging voordat een overbelaste aanbieder-/profielrotatie opnieuw wordt geprobeerd (standaard: `0`).
- `rateLimitedProfileRotations`: maximumaantal auth-profile-rotaties bij dezelfde aanbieder voor rate-limit-fouten voordat wordt overgeschakeld naar model-fallback (standaard: `1`). Die rate-limit-bucket bevat door aanbieders gevormde tekst zoals `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` en `resource exhausted`.

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
- `consoleLevel` gaat naar `debug` wanneer `--verbose` is ingesteld.
- `maxFileBytes`: maximale grootte van het actieve logbestand in bytes vóór rotatie (positief geheel getal; standaard: `104857600` = 100 MB). OpenClaw bewaart tot vijf genummerde archieven naast het actieve bestand.
- `redactSensitive` / `redactPatterns`: best-effort maskering voor console-uitvoer, bestandslogs, OTLP-logrecords en opgeslagen sessietranscripttekst. `redactSensitive: "off"` schakelt alleen dit algemene log-/transcriptbeleid uit; UI-/tool-/diagnostische veiligheidsoppervlakken redigeren geheimen nog steeds vóór emissie.

---

## Diagnostiek

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

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
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
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
- `stuckSessionWarnMs`: geen-voortgangsleeftijdsdrempel in ms voor het classificeren van langlopende verwerkingssessiess als `session.long_running`, `session.stalled` of `session.stuck`. Antwoord-, tool-, status-, blok- en ACP-voortgang resetten de timer; herhaalde `session.stuck`-diagnostiek past backoff toe zolang er niets verandert.
- `stuckSessionAbortMs`: geen-voortgangsleeftijdsdrempel in ms voordat in aanmerking komend vastgelopen actief werk abort-drained mag worden voor herstel. Wanneer niet ingesteld, gebruikt OpenClaw het veiligere uitgebreide embedded-run-venster van minstens 5 minuten en 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: legt een geredigeerde pre-OOM-stabiliteitssnapshot vast wanneer geheugendruk `critical` bereikt (standaard: `false`). Stel in op `true` om de scan/schrijfactie voor het stabiliteitsbundelbestand toe te voegen terwijl normale geheugendrukgebeurtenissen behouden blijven.
- `otel.enabled`: schakelt de OpenTelemetry-exportpipeline in (standaard: `false`). Zie [OpenTelemetry-export](/nl/gateway/opentelemetry) voor de volledige configuratie, signaalcatalogus en het privacymodel.
- `otel.endpoint`: collector-URL voor OTel-export.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: optionele signaalspecifieke OTLP-eindpunten. Wanneer ingesteld, overschrijven ze `otel.endpoint` alleen voor dat signaal.
- `otel.protocol`: `"http/protobuf"` (standaard) of `"grpc"`.
- `otel.headers`: extra HTTP-/gRPC-metadataheaders die met OTel-exportverzoeken worden meegestuurd.
- `otel.serviceName`: servicenaam voor resource-attributen.
- `otel.traces` / `otel.metrics` / `otel.logs`: schakel trace-, metrics- of logexport in.
- `otel.logsExporter`: logexportdoel: `"otlp"` (standaard), `"stdout"` voor één JSON-object per stdout-regel, of `"both"`.
- `otel.sampleRate`: trace-samplingrate `0`-`1`.
- `otel.flushIntervalMs`: periodiek telemetry-flushinterval in ms.
- `otel.captureContent`: opt-in vastlegging van ruwe content voor OTEL-spanattributen. Standaard uit. Booleaanse `true` legt niet-systeembericht-/toolcontent vast; met de objectvorm kun je `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` en `toolDefinitions` expliciet inschakelen.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: omgevingsschakelaar voor de nieuwste experimentele GenAI-inferencespanvorm, inclusief spannamen `{gen_ai.operation.name} {gen_ai.request.model}`, `CLIENT`-spansoort en `gen_ai.provider.name` in plaats van verouderde `gen_ai.system`. Standaard behouden spans `openclaw.model.call` en `gen_ai.system` voor compatibiliteit; GenAI-metrics gebruiken begrensde semantische attributen.
- `OPENCLAW_OTEL_PRELOADED=1`: omgevingsschakelaar voor hosts die al een globale OpenTelemetry SDK hebben geregistreerd. OpenClaw slaat dan de door de Plugin beheerde SDK-startup/-shutdown over, terwijl diagnostische listeners actief blijven.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` en `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: signaalspecifieke eindpunt-env-vars die worden gebruikt wanneer de bijpassende configuratiesleutel niet is ingesteld.
- `cacheTrace.enabled`: log cache-trace-snapshots voor embedded runs (standaard: `false`).
- `cacheTrace.filePath`: uitvoerpad voor cache-trace-JSONL (standaard: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: bepalen wat in cache-trace-uitvoer wordt opgenomen (allemaal standaard: `true`).

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
- `checkOnStart`: controleer op npm-updates wanneer de Gateway start (standaard: `true`).
- `auto.enabled`: schakel automatische achtergrondupdates in voor pakketinstallaties (standaard: `false`).
- `auto.stableDelayHours`: minimale vertraging in uren vóór automatisch toepassen op het stable-kanaal (standaard: `6`; max: `168`).
- `auto.stableJitterHours`: extra spreidingsvenster in uren voor uitrol op het stable-kanaal (standaard: `12`; max: `168`).
- `auto.betaCheckIntervalHours`: hoe vaak beta-kanaalcontroles in uren worden uitgevoerd (standaard: `1`; max: `24`).

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

- `enabled`: globale ACP-functiegate (standaard: `true`; stel in op `false` om ACP-dispatch- en spawn-bedieningen te verbergen).
- `dispatch.enabled`: onafhankelijke gate voor dispatch van ACP-sessiebeurten (standaard: `true`). Stel in op `false` om ACP-commando's beschikbaar te houden terwijl uitvoering wordt geblokkeerd.
- `backend`: standaard ACP-runtimebackend-id (moet overeenkomen met een geregistreerde ACP-runtime-Plugin).
  Installeer eerst de backend-Plugin en, als `plugins.allow` is ingesteld, neem de backend-Plugin-id op (bijvoorbeeld `acpx`), anders wordt de ACP-backend niet geladen.
- `defaultAgent`: fallback-ACP-doelagent-id wanneer spawns geen expliciet doel opgeven.
- `allowedAgents`: allowlist met agent-id's die zijn toegestaan voor ACP-runtimesessies; leeg betekent geen extra beperking.
- `maxConcurrentSessions`: maximumaantal gelijktijdig actieve ACP-sessies.
- `stream.coalesceIdleMs`: idle-flushvenster in ms voor gestreamde tekst.
- `stream.maxChunkChars`: maximale chunkgrootte voordat gestreamde blokprojectie wordt gesplitst.
- `stream.repeatSuppression`: onderdruk herhaalde status-/toolregels per beurt (standaard: `true`).
- `stream.deliveryMode`: `"live"` streamt incrementeel; `"final_only"` buffert tot terminale beurtgebeurtenissen.
- `stream.hiddenBoundarySeparator`: scheidingsteken vóór zichtbare tekst na verborgen toolgebeurtenissen (standaard: `"paragraph"`).
- `stream.maxOutputChars`: maximumaantal assistant-uitvoertekens dat per ACP-beurt wordt geprojecteerd.
- `stream.maxSessionUpdateChars`: maximumaantal tekens voor geprojecteerde ACP-status-/updateregels.
- `stream.tagVisibility`: record van tagnamen naar booleaanse zichtbaarheids-overrides voor gestreamde gebeurtenissen.
- `runtime.ttlMinutes`: idle-TTL in minuten voor ACP-sessieworkers voordat ze in aanmerking komen voor opschoning.
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

- `cli.banner.taglineMode` bepaalt de stijl van de bannerslogan:
  - `"random"` (standaard): wisselende grappige/seizoensgebonden slogans.
  - `"default"`: vaste neutrale slogan (`All your chats, one OpenClaw.`).
  - `"off"`: geen slogantekst (bannertitel/versie worden nog steeds getoond).
- Stel env `OPENCLAW_HIDE_BANNER=1` in om de hele banner te verbergen (niet alleen slogans).

---

## Installatiewizard

Metadata geschreven door CLI-begeleide installatiestromen (`onboard`, `configure`, `doctor`):

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

## Brug (legacy, verwijderd)

Huidige builds bevatten de TCP-brug niet meer. Nodes verbinden via de Gateway WebSocket. `bridge.*`-sleutels maken geen deel meer uit van het configuratieschema (validatie faalt totdat ze zijn verwijderd; `openclaw doctor --fix` kan onbekende sleutels verwijderen).

<Accordion title="Legacy brugconfiguratie (historische referentie)">

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
    maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
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

- `sessionRetention`: hoe lang voltooide geïsoleerde cron-runsessies bewaard blijven voordat ze uit `sessions.json` worden opgeschoond. Regelt ook het opschonen van gearchiveerde verwijderde cron-transcripten. Standaard: `24h`; stel in op `false` om uit te schakelen.
- `runLog.maxBytes`: geaccepteerd voor compatibiliteit met oudere, bestandsgedragen cron-runlogs. Standaard: `2_000_000` bytes.
- `runLog.keepLines`: nieuwste SQLite-runhistorierijen die per job worden bewaard. Standaard: `2000`.
- `webhookToken`: bearer-token gebruikt voor cron Webhook POST-bezorging (`delivery.mode = "webhook"`); als dit wordt weggelaten, wordt er geen auth-header verzonden.
- `webhook`: verouderde legacy fallback-Webhook-URL (http/https) gebruikt door `openclaw doctor --fix` om opgeslagen jobs te migreren die nog steeds `notify: true` hebben; runtime-bezorging gebruikt per job `delivery.mode="webhook"` plus `delivery.to`, of `delivery.completionDestination` bij het behouden van aankondigingsbezorging.

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

- `maxAttempts`: maximaal aantal nieuwe pogingen voor cron-jobs bij tijdelijke fouten (standaard: `3`; bereik: `0`-`10`).
- `backoffMs`: array met backoff-vertragingen in ms voor elke nieuwe poging (standaard: `[30000, 60000, 300000]`; 1-10 items).
- `retryOn`: fouttypen die nieuwe pogingen activeren - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Laat weg om alle tijdelijke typen opnieuw te proberen.

Eenmalige jobs blijven ingeschakeld totdat de nieuwe pogingen zijn uitgeput, en worden daarna uitgeschakeld terwijl de laatste foutstatus behouden blijft. Terugkerende jobs gebruiken hetzelfde tijdelijke retrybeleid om na backoff opnieuw te draaien vóór hun volgende geplande tijdslot; permanente fouten of uitgeputte tijdelijke retries vallen terug op het normale terugkerende schema met foutbackoff.

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

- `enabled`: schakel faalwaarschuwingen voor cron-jobs in (standaard: `false`).
- `after`: opeenvolgende fouten voordat een waarschuwing wordt geactiveerd (positief geheel getal, min: `1`).
- `cooldownMs`: minimumaantal milliseconden tussen herhaalde waarschuwingen voor dezelfde job (niet-negatief geheel getal).
- `includeSkipped`: tel opeenvolgende overgeslagen runs mee voor de waarschuwingsdrempel (standaard: `false`). Overgeslagen runs worden apart bijgehouden en hebben geen invloed op backoff voor uitvoeringsfouten.
- `mode`: bezorgmodus - `"announce"` verzendt via een kanaalbericht; `"webhook"` post naar de geconfigureerde Webhook.
- `accountId`: optionele account- of kanaal-id om waarschuwingsbezorging te begrenzen.

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

- Standaardbestemming voor cron-faalmeldingen voor alle jobs.
- `mode`: `"announce"` of `"webhook"`; standaard is `"announce"` wanneer er genoeg doelgegevens bestaan.
- `channel`: kanaaloverride voor aankondigingsbezorging. `"last"` hergebruikt het laatst bekende bezorgkanaal.
- `to`: expliciet aankondigingsdoel of Webhook-URL. Vereist voor Webhook-modus.
- `accountId`: optionele accountoverride voor bezorging.
- Per-job `delivery.failureDestination` overschrijft deze globale standaard.
- Wanneer er geen globale of per-job faalbestemming is ingesteld, vallen jobs die al via `announce` bezorgen bij falen terug op dat primaire aankondigingsdoel.
- `delivery.failureDestination` wordt alleen ondersteund voor `sessionTarget="isolated"`-jobs, tenzij de primaire `delivery.mode` van de job `"webhook"` is.

Zie [Cron-jobs](/nl/automation/cron-jobs). Geïsoleerde cron-uitvoeringen worden bijgehouden als [achtergrondtaken](/nl/automation/tasks).

---

## Templatevariabelen voor mediamodellen

Templateplaatsaanduidingen die worden uitgebreid in `tools.media.models[].args`:

| Variabele          | Beschrijving                                      |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Volledige inkomende berichttekst                  |
| `{{RawBody}}`      | Ruwe body (geen geschiedenis-/afzenderwrappers)   |
| `{{BodyStripped}}` | Body waarbij groepsvermeldingen zijn verwijderd   |
| `{{From}}`         | Afzender-id                                       |
| `{{To}}`           | Bestemmings-id                                    |
| `{{MessageSid}}`   | Kanaalbericht-id                                  |
| `{{SessionId}}`    | Huidige sessie-UUID                               |
| `{{IsNewSession}}` | `"true"` wanneer nieuwe sessie is aangemaakt      |
| `{{MediaUrl}}`     | Pseudo-URL voor inkomende media                   |
| `{{MediaPath}}`    | Lokaal mediapad                                   |
| `{{MediaType}}`    | Mediatype (image/audio/document/…)                |
| `{{Transcript}}`   | Audiotranscript                                   |
| `{{Prompt}}`       | Opgeloste mediaprompt voor CLI-items              |
| `{{MaxChars}}`     | Opgelost maximumaantal uitvoertekens voor CLI-items |
| `{{ChatType}}`     | `"direct"` of `"group"`                           |
| `{{GroupSubject}}` | Groepsonderwerp (best effort)                     |
| `{{GroupMembers}}` | Voorvertoning van groepsleden (best effort)       |
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

**Mergegedrag:**

- Eén bestand: vervangt het omvattende object.
- Array met bestanden: diep gemerged in volgorde (latere overschrijven eerdere).
- Sibling-sleutels: gemerged na includes (overschrijven inbegrepen waarden).
- Geneste includes: tot 10 niveaus diep.
- Paden: opgelost relatief aan het includende bestand, maar moeten binnen de configuratiemap op hoogste niveau blijven (`dirname` van `openclaw.json`). Absolute/`../`-vormen zijn alleen toegestaan wanneer ze nog steeds binnen die grens oplossen. Paden mogen geen null-bytes bevatten en moeten strikt korter zijn dan 4096 tekens vóór en na resolutie.
- OpenClaw-eigen schrijfacties die slechts één top-level sectie wijzigen die door een single-file include wordt ondersteund, schrijven door naar dat inbegrepen bestand. Bijvoorbeeld: `plugins install` werkt `plugins: { $include: "./plugins.json5" }` bij in `plugins.json5` en laat `openclaw.json` intact.
- Root-includes, include-arrays en includes met sibling-overrides zijn read-only voor OpenClaw-eigen schrijfacties; die schrijfacties failen gesloten in plaats van de configuratie af te vlakken.
- Fouten: duidelijke meldingen voor ontbrekende bestanden, parsefouten, circulaire includes, ongeldig padformaat en te grote lengte.

---

_Gerelateerd: [Configuratie](/nl/gateway/configuration) · [Configuratievoorbeelden](/nl/gateway/configuration-examples) · [Doctor](/nl/gateway/doctor)_

## Gerelateerd

- [Configuratie](/nl/gateway/configuration)
- [Configuratievoorbeelden](/nl/gateway/configuration-examples)
