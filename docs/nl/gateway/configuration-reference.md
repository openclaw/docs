---
read_when:
    - Je hebt exacte configuratiesemantiek of standaardwaarden op veldniveau nodig
    - Je valideert configuratieblokken voor kanalen, modellen, Gateway of tools
summary: Gateway-configuratiereferentie voor kernsleutels van OpenClaw, standaardwaarden en koppelingen naar specifieke subsysteemreferenties
title: Configuratiereferentie
x-i18n:
    generated_at: "2026-07-02T08:31:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b1d31c4c35f216480f4536a57bca50558a8d19dcf57dcf30be9033555c019d72
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Kernconfiguratiereferentie voor `~/.openclaw/openclaw.json`. Zie [Configuratie](/nl/gateway/configuration) voor een taakgericht overzicht.

Behandelt de belangrijkste configuratieoppervlakken van OpenClaw en linkt door wanneer een subsysteem een eigen diepere referentie heeft. Kanaal- en Plugin-eigen commandocatalogi en diepe geheugen-/QMD-knoppen staan op hun eigen pagina's in plaats van op deze.

Codewaarheid:

- `openclaw config schema` drukt het live JSON Schema af dat wordt gebruikt voor validatie en Control UI, met gebundelde/plugin-/kanaalmetadata samengevoegd wanneer beschikbaar
- `config.schema.lookup` retourneert een padgebonden schemaknooppunt voor drill-downtooling
- `pnpm config:docs:check` / `pnpm config:docs:gen` valideren de baselinehash van de configuratiedocumentatie tegen het huidige schemaoppervlak

Opzoekpad voor agenten: gebruik de `gateway`-toolactie `config.schema.lookup` voor
exacte veldniveau-documentatie en beperkingen vóór bewerkingen. Gebruik
[Configuratie](/nl/gateway/configuration) voor taakgerichte begeleiding en deze pagina
voor de bredere veldkaart, standaardwaarden en links naar subsysteemreferenties.

Toegewijde diepe referenties:

- [Geheugenconfiguratiereferentie](/nl/reference/memory-config) voor `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` en dreaming-configuratie onder `plugins.entries.memory-core.config.dreaming`
- [Slashcommando's](/nl/tools/slash-commands) voor de huidige ingebouwde + gebundelde commandocatalogus
- eigenaarpagina's van kanalen/plugins voor kanaalspecifieke commando-oppervlakken

Configuratie-indeling is **JSON5** (opmerkingen + afsluitende komma's toegestaan). Alle velden zijn optioneel - OpenClaw gebruikt veilige standaardwaarden wanneer ze worden weggelaten.

---

## Kanalen

Configuratiesleutels per kanaal zijn verplaatst naar een toegewijde pagina - zie
[Configuratie - kanalen](/nl/gateway/config-channels) voor `channels.*`,
waaronder Slack, Discord, Telegram, WhatsApp, Matrix, iMessage en andere
gebundelde kanalen (authenticatie, toegangscontrole, meerdere accounts, vermeldingsgating).

## Agentstandaardwaarden, multi-agent, sessies en berichten

Verplaatst naar een toegewijde pagina - zie
[Configuratie - agenten](/nl/gateway/config-agents) voor:

- `agents.defaults.*` (werkruimte, model, denken, heartbeat, geheugen, media, skills, sandbox)
- `multiAgent.*` (multi-agent-routering en bindingen)
- `session.*` (sessielevenscyclus, compaction, snoeien)
- `messages.*` (berichtbezorging, TTS, markdown-rendering)
- `talk.*` (Talk-modus)
  - `talk.consultThinkingLevel`: override voor denkniveau voor de volledige OpenClaw-agentrun achter realtime consulten van Control UI Talk
  - `talk.consultFastMode`: eenmalige fast-mode-override voor realtime consulten van Control UI Talk
  - `talk.speechLocale`: optionele BCP 47-locale-id voor Talk-spraakherkenning op iOS/macOS
  - `talk.silenceTimeoutMs`: wanneer niet ingesteld, behoudt Talk het standaard pauzevenster van het platform voordat het transcript wordt verzonden (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: Gateway-relayfallback voor afgeronde realtime Talk-transcripten die `openclaw_agent_consult` overslaan

## Tools en aangepaste providers

Toolbeleid, experimentele schakelaars, providerondersteunde toolconfiguratie en aangepaste
provider-/basis-URL-instelling zijn verplaatst naar een toegewijde pagina - zie
[Configuratie - tools en aangepaste providers](/nl/gateway/config-tools).

## Modellen

Providerdefinities, model-allowlists en aangepaste providerinstelling staan in
[Configuratie - tools en aangepaste providers](/nl/gateway/config-tools#custom-providers-and-base-urls).
De `models`-root is ook eigenaar van globaal modelcatalogusgedrag.

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
- `models.providers.*.localService`: optionele on-demand procesmanager voor
  lokale modelservers. OpenClaw test het geconfigureerde health-eindpunt, start
  het absolute `command` wanneer nodig, wacht op gereedheid en verzendt daarna het modelverzoek.
  Zie [Lokale modelservices](/nl/gateway/local-model-services).
- `models.pricing.enabled`: regelt de achtergrond-pricingbootstrap die
  start nadat sidecars en kanalen het Gateway-gereedpad bereiken. Wanneer `false`,
  slaat de Gateway OpenRouter- en LiteLLM-pricingcatalogusophalingen over; geconfigureerde
  `models.providers.*.models[].cost`-waarden blijven werken voor lokale kostenschattingen.

## MCP

Door OpenClaw beheerde MCP-serverdefinities staan onder `mcp.servers` en worden
gebruikt door ingebedde OpenClaw en andere runtime-adapters. De opdrachten `openclaw mcp list`,
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
  Remote-vermeldingen gebruiken `transport: "streamable-http"` of `transport: "sse"`;
  `type: "http"` is een CLI-native alias die `openclaw mcp set` en
  `openclaw doctor --fix` normaliseren naar het canonieke `transport`-veld.
- `mcp.servers.<name>.enabled`: stel in op `false` om een opgeslagen serverdefinitie te behouden
  terwijl deze wordt uitgesloten van ingebedde OpenClaw MCP-detectie en toolprojectie.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: MCP-aanvraagtime-out per server
  in seconden of milliseconden.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: verbindingstime-out per server
  in seconden of milliseconden.
- `mcp.servers.<name>.supportsParallelToolCalls`: optionele concurrencyhint voor
  adapters die kunnen kiezen of ze parallelle MCP-toolaanroepen uitvoeren.
- `mcp.servers.<name>.auth`: stel in op `"oauth"` voor HTTP MCP-servers die
  OAuth vereisen. Voer `openclaw mcp login <name>` uit om tokens onder OpenClaw-state op te slaan.
- `mcp.servers.<name>.oauth`: optionele overrides voor OAuth-scope, redirect-URL en clientmetadata-URL.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: HTTP TLS-controls
  voor privé-eindpunten en wederzijdse TLS.
- `mcp.servers.<name>.toolFilter`: optionele toolselectie per server. `include`
  beperkt de ontdekte MCP-tools tot overeenkomende namen; `exclude` verbergt overeenkomende
  namen. Vermeldingen zijn exacte MCP-toolnamen of eenvoudige `*`-globs. Servers met
  resources of prompts genereren ook utility-toolnamen (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), en die namen gebruiken hetzelfde
  filter.
- `mcp.servers.<name>.codex`: optionele projectie-controls voor de Codex app-server.
  Dit blok is OpenClaw-metadata alleen voor Codex app-server-threads; het heeft geen
  invloed op ACP-sessies, generieke Codex-harnessconfiguratie of andere runtime-adapters.
  Niet-lege `codex.agents` beperkt de server tot de vermelde OpenClaw-agent-id's.
  Lege, blanco of ongeldige scoped agentlijsten worden geweigerd door configuratievalidatie
  en weggelaten door het runtimeprojectiepad in plaats van globaal te worden.
  `codex.defaultToolsApprovalMode` emitteert Codex' native
  `default_tools_approval_mode` voor die server. OpenClaw verwijdert het `codex`-
  blok voordat native `mcp_servers`-configuratie aan Codex wordt doorgegeven. Laat het blok weg om
  de server geprojecteerd te houden voor elke Codex app-server-agent met Codex'
  standaard MCP-goedkeuringsgedrag.
- `mcp.sessionIdleTtlMs`: idle-TTL voor sessiegebonden gebundelde MCP-runtimes.
  Eenmalige ingebedde runs vragen opschoning aan het einde van de run aan; deze TTL is de backstop voor
  langlevende sessies en toekomstige callers.
- Wijzigingen onder `mcp.*` worden hot-applied door gecachte sessie-MCP-runtimes te verwijderen.
  De volgende tooldetectie/het volgende toolgebruik maakt ze opnieuw aan vanuit de nieuwe configuratie, zodat verwijderde
  `mcp.servers`-vermeldingen onmiddellijk worden opgeruimd in plaats van te wachten op idle-TTL.
- Runtimedetectie respecteert ook MCP-meldingen over wijzigingen in de toollijst door
  de gecachte catalogus voor die sessie te laten vallen. Servers die resources of
  prompts adverteren, krijgen utility-tools voor het weergeven/lezen van resources en het weergeven/ophalen
  van prompts. Herhaalde toolaanroepfouten pauzeren de getroffen server kort voordat
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

- `allowBundled`: optionele allowlist alleen voor gebundelde skills (beheerde/werkruimte-skills niet beïnvloed).
- `load.extraDirs`: extra gedeelde skill-roots (laagste prioriteit).
- `load.allowSymlinkTargets`: vertrouwde echte doelroots waarin skill-symlinks mogen
  resolven wanneer de link buiten de geconfigureerde bronroot staat.
- `workshop.allowSymlinkTargetWrites`: staat Skill Workshop apply toe om te schrijven
  via al vertrouwde symlinkdoelen (standaard: false).
- `install.preferBrew`: wanneer true, geef de voorkeur aan Homebrew-installers wanneer `brew`
  beschikbaar is voordat wordt teruggevallen op andere installertypen.
- `install.nodeManager`: node-installervoorkeur voor `metadata.openclaw.install`-
  specs (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: sta vertrouwde `operator.admin` Gateway-
  clients toe om privé-ziparchieven te installeren die via `skills.upload.*` zijn klaargezet
  (standaard: false). Dit schakelt alleen het pad voor geüploade archieven in; normale ClawHub-
  installaties hebben dit niet nodig.
- `entries.<skillKey>.enabled: false` schakelt een skill uit, zelfs als deze gebundeld/geïnstalleerd is.
- `entries.<skillKey>.apiKey`: gemak voor skills die een primaire omgevingsvariabele declareren (plaintext string of SecretRef-object).

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
- Plaats zelfstandige pluginbestanden in `plugins.load.paths`; automatisch ontdekte extensieroots negeren `.js`-, `.mjs`- en `.ts`-bestanden op het hoogste niveau, zodat hulpscripts in die roots het opstarten niet blokkeren.
- Discovery accepteert native OpenClaw-plugins plus compatibele Codex-bundels en Claude-bundels, inclusief manifestloze Claude-bundels met standaardindeling.
- **Configuratiewijzigingen vereisen een herstart van de Gateway.**
- `allow`: optionele allowlist (alleen vermelde plugins laden). `deny` wint.
- `plugins.entries.<id>.apiKey`: handig veld voor API-sleutel op pluginniveau (wanneer ondersteund door de Plugin).
- `plugins.entries.<id>.env`: env-var-map met pluginbereik.
- `plugins.entries.<id>.hooks.allowPromptInjection`: wanneer `false`, blokkeert core `before_prompt_build` en negeert prompt-wijzigende velden uit legacy `before_agent_start`, terwijl legacy `modelOverride` en `providerOverride` behouden blijven. Geldt voor native plugin-hooks en ondersteunde door bundels geleverde hookmappen.
- `plugins.entries.<id>.hooks.allowConversationAccess`: wanneer `true`, mogen vertrouwde niet-gebundelde plugins ruwe gespreksinhoud lezen vanuit getypeerde hooks zoals `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` en `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: vertrouw deze Plugin expliciet om per run `provider`- en `model`-overrides aan te vragen voor achtergrondruns van subagents.
- `plugins.entries.<id>.subagent.allowedModels`: optionele allowlist van canonieke `provider/model`-doelen voor vertrouwde subagent-overrides. Gebruik `"*"` alleen wanneer je bewust elk model wilt toestaan.
- `plugins.entries.<id>.llm.allowModelOverride`: vertrouw deze Plugin expliciet om modeloverrides aan te vragen voor `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: optionele allowlist van canonieke `provider/model`-doelen voor vertrouwde overrides van plugin-LLM-voltooiingen. Gebruik `"*"` alleen wanneer je bewust elk model wilt toestaan.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: vertrouw deze Plugin expliciet om `api.runtime.llm.complete` uit te voeren tegen een niet-standaard agent-id.
- `plugins.entries.<id>.config`: door Plugin gedefinieerd configuratieobject (gevalideerd door native OpenClaw-plugin-schema wanneer beschikbaar).
- Account- en runtime-instellingen van kanaalplugins staan onder `channels.<id>` en moeten worden beschreven door de `channelConfigs`-metadata van het manifest van de eigenaar-Plugin, niet door een centraal OpenClaw-optieregister.

### Configuratie van Codex-harnas-Plugin

De gebundelde `codex`-Plugin beheert native instellingen voor het Codex-app-serverharnas onder
`plugins.entries.codex.config`. Zie
[Codex-harnasreferentie](/nl/plugins/codex-harness-reference) voor het volledige configuratieoppervlak
en [Codex-harnas](/nl/plugins/codex-harness) voor het runtimemodel.

`codexPlugins` geldt alleen voor sessies die het native Codex-harnas selecteren.
Het schakelt geen Codex-plugins in voor OpenClaw-provider-runs, ACP-
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

- `plugins.entries.codex.config.codexPlugins.enabled`: schakelt native ondersteuning voor Codex-
  plugins/apps in voor het Codex-harnas. Standaard: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  standaardbeleid voor destructieve acties bij gemigreerde plugin-app-elicitations.
  Gebruik `true` om veilige Codex-goedkeuringsschema's zonder prompt te accepteren, `false`
  om ze te weigeren, `"auto"` om door Codex vereiste goedkeuringen via OpenClaw-
  plugingoedkeuringen te routeren, of `"ask"` om voor elke plugin-schrijfactie/destructieve
  actie te vragen zonder duurzame goedkeuring. De modus `"ask"` wist duurzame Codex-
  per-tool-goedkeuringsoverrides voor de betrokken app en selecteert de menselijke
  goedkeuringsreviewer voor die app voordat de Codex-thread start.
  Standaard: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: schakelt een
  gemigreerde pluginvermelding in wanneer globale `codexPlugins.enabled` ook waar is.
  Standaard: `true` voor expliciete vermeldingen.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  stabiele marketplace-identiteit. V1 ondersteunt alleen `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: stabiele
  Codex-pluginidentiteit uit migratie, bijvoorbeeld `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  override per Plugin voor destructieve acties. Wanneer weggelaten, wordt de globale
  waarde `allow_destructive_actions` gebruikt. De waarde per Plugin accepteert hetzelfde
  `true`-, `false`-, `"auto"`- of `"ask"`-beleid.

Elke toegelaten plugin-app die `"ask"` gebruikt, routeert goedkeuringsverzoeken van die app
naar de menselijke reviewer. Andere apps en niet-app-threadgoedkeuringen behouden hun
geconfigureerde reviewer, zodat gemengde pluginbeleidsregels geen `"ask"`-gedrag erven.

`codexPlugins.enabled` is de globale inschakelrichtlijn. Expliciete plugin-
vermeldingen die door migratie zijn geschreven, vormen de duurzame set voor installatie- en herstelgeschiktheid.
`plugins["*"]` wordt niet ondersteund, er is geen `install`-schakelaar en lokale
`marketplacePath`-waarden zijn bewust geen configuratievelden omdat ze
hostspecifiek zijn.

Gereedheidscontroles voor `app/list` worden één uur gecachet en asynchroon vernieuwd
wanneer ze verouderd zijn. Codex-thread-appconfiguratie wordt berekend bij het opzetten van de Codex-harnassessie,
niet bij elke beurt; gebruik `/new`, `/reset` of een Gateway-herstart na het wijzigen van native pluginconfiguratie.

- `plugins.entries.firecrawl.config.webFetch`: instellingen voor de Firecrawl-web-fetchprovider.
  - `apiKey`: optionele Firecrawl-API-sleutel voor hogere limieten (accepteert SecretRef). Valt terug op `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey` of de env-var `FIRECRAWL_API_KEY`.
  - `baseUrl`: basis-URL van de Firecrawl-API (standaard: `https://api.firecrawl.dev`; overrides voor self-hosting moeten private/interne endpoints targeten).
  - `onlyMainContent`: extraheer alleen de hoofdinhoud van pagina's (standaard: `true`).
  - `maxAgeMs`: maximale cacheleeftijd in milliseconden (standaard: `172800000` / 2 dagen).
  - `timeoutSeconds`: timeout voor scrapeverzoek in seconden (standaard: `60`).
- `plugins.entries.xai.config.xSearch`: instellingen voor xAI X Search (Grok-webzoekopdracht).
  - `enabled`: schakel de X Search-provider in.
  - `model`: Grok-model om voor zoeken te gebruiken (bijv. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: instellingen voor memory dreaming. Zie [Dreaming](/nl/concepts/dreaming) voor fasen en drempels.
  - `enabled`: hoofdschakelaar voor dreaming (standaard `false`).
  - `frequency`: cron-cadans voor elke volledige dreaming-sweep (standaard `"0 3 * * *"`).
  - `model`: optionele modeloverride voor Dream Diary-subagent. Vereist `plugins.entries.memory-core.subagent.allowModelOverride: true`; combineer met `allowedModels` om doelen te beperken. Fouten door niet-beschikbare modellen proberen het één keer opnieuw met het standaardmodel van de sessie; vertrouwens- of allowlist-fouten vallen niet stilzwijgend terug.
  - fasebeleid en drempels zijn implementatiedetails (geen gebruikersgerichte configuratiesleutels).
- Volledige geheugenconfiguratie staat in [Referentie voor geheugenconfiguratie](/nl/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Ingeschakelde Claude-bundelplugins kunnen ook ingebedde OpenClaw-standaarden bijdragen vanuit `settings.json`; OpenClaw past die toe als gesaneerde agentinstellingen, niet als ruwe OpenClaw-configuratiepatches.
- `plugins.slots.memory`: kies de actieve geheugenplugin-id, of `"none"` om geheugenplugins uit te schakelen.
- `plugins.slots.contextEngine`: kies de actieve contextengine-plugin-id; standaard `"legacy"`, tenzij je een andere engine installeert en selecteert.

Zie [Plugins](/nl/tools/plugin).

---

## Toezeggingen

`commitments` beheert afgeleid opvolggeheugen: OpenClaw kan check-ins uit gespreksbeurten detecteren en ze via Heartbeat-runs bezorgen.

- `commitments.enabled`: schakel verborgen LLM-extractie, opslag en Heartbeat-bezorging in voor afgeleide opvolgtoezeggingen. Standaard: `false`.
- `commitments.maxPerDay`: maximaal aantal afgeleide opvolgtoezeggingen dat per agentsessie in een voortschrijdende dag wordt bezorgd. Standaard: `3`.

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
- `tabCleanup` ruimt gevolgde primaire-agent-tabbladen op na inactiviteit of wanneer een
  sessie de limiet overschrijdt. Stel `idleMinutes: 0` of `maxTabsPerSession: 0` in om
  die afzonderlijke opruimmodi uit te schakelen.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` is uitgeschakeld wanneer niet ingesteld, zodat browsernavigatie standaard strikt blijft.
- Stel `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` alleen in wanneer je browsernavigatie via het privénetwerk bewust vertrouwt.
- In strikte modus vallen externe CDP-profieleindpunten (`profiles.*.cdpUrl`) onder dezelfde blokkering van privénetwerken tijdens bereikbaarheids-/detectiecontroles.
- `ssrfPolicy.allowPrivateNetwork` blijft ondersteund als verouderde alias.
- Gebruik in strikte modus `ssrfPolicy.hostnameAllowlist` en `ssrfPolicy.allowedHostnames` voor expliciete uitzonderingen.
- Externe profielen zijn alleen attach-only (start/stop/reset uitgeschakeld).
- `profiles.*.cdpUrl` accepteert `http://`, `https://`, `ws://` en `wss://`.
  Gebruik HTTP(S) wanneer je wilt dat OpenClaw `/json/version` detecteert; gebruik WS(S)
  wanneer je provider je een directe DevTools WebSocket-URL geeft.
- `remoteCdpTimeoutMs` en `remoteCdpHandshakeTimeoutMs` zijn van toepassing op externe en
  `attachOnly`-CDP-bereikbaarheid plus aanvragen om tabbladen te openen. Beheerde loopback-
  profielen behouden lokale CDP-standaardwaarden.
- Als een extern beheerde CDP-service bereikbaar is via loopback, stel dan voor dat
  profiel `attachOnly: true` in; anders behandelt OpenClaw de loopback-poort als een
  lokaal beheerd browserprofiel en kan het fouten over lokaal poorteigendom melden.
- `existing-session`-profielen gebruiken Chrome MCP in plaats van CDP en kunnen koppelen op
  de geselecteerde host of via een verbonden browsernode.
- `existing-session`-profielen kunnen `userDataDir` instellen om een specifiek
  Chromium-gebaseerd browserprofiel te targeten, zoals Brave of Edge.
- `existing-session`-profielen kunnen `cdpUrl` instellen wanneer Chrome al draait
  achter een DevTools HTTP(S)-detectie-eindpunt of direct WS(S)-eindpunt. In die
  modus geeft OpenClaw het eindpunt door aan Chrome MCP in plaats van auto-connect te gebruiken;
  `userDataDir` wordt genegeerd voor Chrome MCP-startargumenten.
- `existing-session`-profielen behouden de huidige routebeperkingen van Chrome MCP:
  snapshot-/ref-gestuurde acties in plaats van CSS-selector-targeting, uploadhooks voor één bestand,
  geen overrides voor dialoogtime-outs, geen `wait --load networkidle` en geen
  `responsebody`, PDF-export, downloadonderschepping of batchacties.
- Lokaal beheerde `openclaw`-profielen wijzen `cdpPort` en `cdpUrl` automatisch toe; stel
  `cdpUrl` alleen expliciet in voor externe CDP-profielen of attach aan een existing-session-eindpunt.
- Lokaal beheerde profielen kunnen `executablePath` instellen om de globale
  `browser.executablePath` voor dat profiel te overschrijven. Gebruik dit om één profiel in
  Chrome en een ander in Brave uit te voeren.
- Lokaal beheerde profielen gebruiken `browser.localLaunchTimeoutMs` voor Chrome CDP HTTP-
  detectie na processtart en `browser.localCdpReadyTimeoutMs` voor
  CDP-websocketgereedheid na het starten. Verhoog ze op tragere hosts waar Chrome
  succesvol start maar gereedheidscontroles met de opstart concurreren. Beide waarden moeten
  positieve gehele getallen tot `120000` ms zijn; ongeldige configuratiewaarden worden geweigerd.
- Volgorde voor automatische detectie: standaardbrowser indien Chromium-gebaseerd → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` en `browser.profiles.<name>.executablePath` accepteren beide
  `~` en `~/...` voor de thuismap van je OS vóór het starten van Chromium.
  Per-profiel `userDataDir` op `existing-session`-profielen wordt ook met tilde uitgebreid.
- Besturingsservice: alleen loopback (poort afgeleid van `gateway.port`, standaard `18791`).
- `extraArgs` voegt extra startflags toe aan lokaal opstarten van Chromium (bijvoorbeeld
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

- `seamColor`: accentkleur voor de native app-UI-chrome (tint van Talk Mode-bubbel, enz.).
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
      // password: "your-password", // of OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // voor mode=trusted-proxy; zie /gateway/trusted-proxy-auth
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
      // allowExternalEmbedUrls: false, // gevaarlijk: absolute externe http(s)-embed-URL's toestaan
      // chatMessageMaxWidth: "min(1280px, 82%)", // optionele maximale breedte voor gegroepeerde chatberichten
      // allowedOrigins: ["https://control.example.com"], // vereist voor niet-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // gevaarlijke fallbackmodus voor Host-header-oorsprong
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
    // Optioneel. Standaard false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optioneel. Standaard niet ingesteld/uitgeschakeld.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Aanvullende HTTP-weigeringen voor /tools/invoke
      deny: ["browser"],
      // Verwijder tools uit de standaard HTTP-weigerlijst voor eigenaar-/admin-aanroepen
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
- `port`: enkele gemultiplexte poort voor WS + HTTP. Voorrang: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (standaard), `lan` (`0.0.0.0`), `tailnet` (alleen Tailscale-IP), of `custom`.
- **Verouderde bind-aliassen**: gebruik bind-moduswaarden in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), geen hostaliassen (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-opmerking**: de standaard `loopback`-bind luistert binnen de container op `127.0.0.1`. Met Docker bridge-netwerken (`-p 18789:18789`) komt verkeer binnen op `eth0`, waardoor de Gateway onbereikbaar is. Gebruik `--network host`, of stel `bind: "lan"` in (of `bind: "custom"` met `customBindHost: "0.0.0.0"`) om op alle interfaces te luisteren.
- **Auth**: standaard vereist. Niet-loopback-binds vereisen Gateway-auth. In de praktijk betekent dit een gedeeld token/wachtwoord of een identiteitsbewuste reverse proxy met `gateway.auth.mode: "trusted-proxy"`. De onboardingwizard genereert standaard een token.
- Als zowel `gateway.auth.token` als `gateway.auth.password` is geconfigureerd (inclusief SecretRefs), stel `gateway.auth.mode` dan expliciet in op `token` of `password`. Opstart- en service-installatie-/herstelstromen mislukken wanneer beide zijn geconfigureerd en de modus niet is ingesteld.
- `gateway.auth.mode: "none"`: expliciete modus zonder auth. Gebruik dit alleen voor vertrouwde lokale local loopback-configuraties; dit wordt bewust niet aangeboden door onboardingprompts.
- `gateway.auth.mode: "trusted-proxy"`: delegeer browser-/gebruikersauth aan een identiteitsbewuste reverse proxy en vertrouw identiteitsheaders van `gateway.trustedProxies` (zie [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth)). Deze modus verwacht standaard een **niet-loopback** proxybron; reverse proxy's op dezelfde host via loopback vereisen expliciet `gateway.auth.trustedProxy.allowLoopback = true`. Interne aanroepers op dezelfde host kunnen `gateway.auth.password` gebruiken als lokale directe fallback; `gateway.auth.token` blijft wederzijds exclusief met trusted-proxy-modus.
- `gateway.auth.allowTailscale`: wanneer `true`, kunnen Tailscale Serve-identiteitsheaders voldoen aan Control UI-/WebSocket-auth (geverifieerd via `tailscale whois`). HTTP-API-eindpunten gebruiken die Tailscale-headerauth **niet**; ze volgen in plaats daarvan de normale HTTP-authmodus van de Gateway. Deze tokenloze stroom gaat ervan uit dat de Gateway-host vertrouwd is. Standaard `true` wanneer `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: optionele begrenzer voor mislukte auth. Van toepassing per client-IP en per auth-scope (shared-secret en device-token worden onafhankelijk gevolgd). Geblokkeerde pogingen retourneren `429` + `Retry-After`.
  - Op het async Tailscale Serve Control UI-pad worden mislukte pogingen voor dezelfde `{scope, clientIp}` geserialiseerd voordat de fout wordt geschreven. Gelijktijdige onjuiste pogingen van dezelfde client kunnen daardoor de begrenzer al bij de tweede aanvraag activeren, in plaats van dat beide als gewone mismatches doorlopen.
  - `gateway.auth.rateLimit.exemptLoopback` is standaard `true`; stel dit in op `false` wanneer je bewust ook localhost-verkeer wilt rate-limiten (voor testopstellingen of strikte proxy-implementaties).
- WS-authpogingen vanuit browser-origins worden altijd beperkt met loopback-vrijstelling uitgeschakeld (defense-in-depth tegen browsergebaseerde localhost-brute force).
- Op loopback zijn die lockouts vanuit browser-origins geïsoleerd per genormaliseerde `Origin`-
  waarde, zodat herhaalde fouten vanuit één localhost-origin niet automatisch
  een andere origin blokkeren.
- `tailscale.mode`: `serve` (alleen tailnet, loopback-bind) of `funnel` (publiek, vereist auth).
- `tailscale.serviceName`: optionele Tailscale Service-naam voor Serve-modus, zoals
  `svc:openclaw`. Wanneer ingesteld, geeft OpenClaw dit door aan `tailscale serve
--service`, zodat de Control UI via een benoemde Service kan worden ontsloten in plaats
  van via de hostnaam van het apparaat. De waarde moet Tailscale's `svc:<dns-label>`-
  Service-naamindeling gebruiken; bij het opstarten wordt de afgeleide Service-URL gerapporteerd.
- `tailscale.preserveFunnel`: wanneer `true` en `tailscale.mode = "serve"`, controleert OpenClaw
  `tailscale funnel status` voordat Serve bij het opstarten opnieuw wordt toegepast, en slaat
  dit over als een extern geconfigureerde Funnel-route de Gateway-poort al afdekt.
  Standaard `false`.
- `controlUi.allowedOrigins`: expliciete allowlist voor browser-origins voor Gateway WebSocket-verbindingen. Vereist voor publieke niet-loopback browser-origins. Privé same-origin LAN-/Tailnet-UI-ladingen vanaf loopback-, RFC1918-/link-local-, `.local`-, `.ts.net`- of Tailscale CGNAT-hosts worden geaccepteerd zonder Host-header-fallback in te schakelen.
- `controlUi.chatMessageMaxWidth`: optionele maximale breedte voor gegroepeerde Control UI-chatberichten. Accepteert begrensde CSS-breedtewaarden zoals `960px`, `82%`, `min(1280px, 82%)` en `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gevaarlijke modus die Host-header-originfallback inschakelt voor implementaties die bewust vertrouwen op Host-header-originbeleid.
- `remote.transport`: `ssh` (standaard) of `direct` (ws/wss). Voor `direct` moet `remote.url` `wss://` zijn voor publieke hosts; plaintext `ws://` wordt alleen geaccepteerd voor loopback-, LAN-, link-local-, `.local`-, `.ts.net`- en Tailscale CGNAT-hosts.
- `remote.remotePort`: Gateway-poort op de externe SSH-host. Standaard `18789`; gebruik dit wanneer de lokale tunnelpoort verschilt van de externe Gateway-poort.
- `gateway.remote.token` / `.password` zijn credentialvelden voor externe clients. Ze configureren Gateway-auth niet op zichzelf.
- `gateway.push.apns.relay.baseUrl`: basis-HTTPS-URL voor de externe APNs-relay die wordt gebruikt nadat relay-ondersteunde iOS-builds registraties naar de Gateway publiceren. Publieke App Store-builds gebruiken de gehoste OpenClaw-relay. Aangepaste relay-URL's moeten overeenkomen met een bewust afzonderlijk iOS-build-/implementatiepad waarvan de relay-URL naar die relay wijst.
- `gateway.push.apns.relay.timeoutMs`: verzendtimeout van Gateway naar relay in milliseconden. Standaard `10000`.
- Relay-ondersteunde registraties worden gedelegeerd aan een specifieke Gateway-identiteit. De gekoppelde iOS-app haalt `gateway.identity.get` op, neemt die identiteit op in de relayregistratie en stuurt een registratiegebonden verzendtoekenning door naar de Gateway. Een andere Gateway kan die opgeslagen registratie niet hergebruiken.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: tijdelijke env-overrides voor de relayconfiguratie hierboven.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: alleen voor ontwikkeling bedoelde ontsnappingsroute voor loopback HTTP-relay-URL's. Productie-relay-URL's moeten HTTPS blijven gebruiken.
- `gateway.handshakeTimeoutMs`: pre-auth Gateway WebSocket-handshaketimeout in milliseconden. Standaard: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` krijgt voorrang wanneer ingesteld. Verhoog dit op belaste of energiezuinige hosts waar lokale clients kunnen verbinden terwijl de opstart-warmup nog stabiliseert.
- `gateway.channelHealthCheckMinutes`: interval van de channel-healthmonitor in minuten. Stel `0` in om herstarts door de healthmonitor globaal uit te schakelen. Standaard: `5`.
- `gateway.channelStaleEventThresholdMinutes`: drempel voor verouderde sockets in minuten. Houd dit groter dan of gelijk aan `gateway.channelHealthCheckMinutes`. Standaard: `30`.
- `gateway.channelMaxRestartsPerHour`: maximaal aantal healthmonitor-herstarts per channel/account in een rollend uur. Standaard: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per channel voor healthmonitor-herstarts terwijl de globale monitor ingeschakeld blijft.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per account voor multi-account-channels. Wanneer ingesteld, krijgt dit voorrang op de override op channelniveau.
- Lokale Gateway-aanroeppaden kunnen `gateway.remote.*` alleen als fallback gebruiken wanneer `gateway.auth.*` niet is ingesteld.
- Als `gateway.auth.token` / `gateway.auth.password` expliciet via SecretRef is geconfigureerd en niet kan worden opgelost, mislukt de oplossing fail-closed (geen maskering door externe fallback).
- `trustedProxies`: IP's van reverse proxy's die TLS beëindigen of forwarded-client-headers injecteren. Vermeld alleen proxy's die je beheert. Loopback-vermeldingen zijn nog steeds geldig voor proxy-/lokale-detectieopstellingen op dezelfde host (bijvoorbeeld Tailscale Serve of een lokale reverse proxy), maar ze maken loopback-aanvragen **niet** geschikt voor `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: wanneer `true`, accepteert de Gateway `X-Real-IP` als `X-Forwarded-For` ontbreekt. Standaard `false` voor fail-closed-gedrag.
- `gateway.nodes.pairing.autoApproveCidrs`: optionele CIDR/IP-allowlist voor het automatisch goedkeuren van eerste node-apparaatkoppeling zonder aangevraagde scopes. Dit is uitgeschakeld wanneer niet ingesteld. Dit keurt operator-/browser-/Control UI-/WebChat-koppeling niet automatisch goed, en keurt rol-, scope-, metadata- of public-key-upgrades niet automatisch goed.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globale allow/deny-vormgeving voor gedeclareerde nodecommando's na koppeling en evaluatie van de platform-allowlist. Gebruik `allowCommands` om gevaarlijke nodecommando's zoals `camera.snap`, `camera.clip` en `screen.record` in te schakelen; `denyCommands` verwijdert een commando zelfs als een platformstandaard of expliciete allow het anders zou opnemen. Nadat een node zijn gedeclareerde commandolijst wijzigt, wijs je die apparaatkoppeling af en keur je deze opnieuw goed, zodat de Gateway de bijgewerkte commandosnapshot opslaat.
- `gateway.tools.deny`: extra toolnamen die worden geblokkeerd voor HTTP `POST /tools/invoke` (breidt de standaard denylist uit).
- `gateway.tools.allow`: verwijder toolnamen uit de standaard HTTP-denylist voor
  owner/admin-aanroepers. Dit promoveert identiteitdragende `operator.write`-
  aanroepers niet naar owner/admin-toegang; `cron`, `gateway` en `nodes` blijven
  niet beschikbaar voor niet-owner-aanroepers, zelfs wanneer ze op de allowlist staan.

</Accordion>

### OpenAI-compatibele eindpunten

- Admin HTTP RPC: standaard uitgeschakeld als de `admin-http-rpc`-Plugin. Schakel de Plugin in om `POST /api/v1/admin/rpc` te registreren. Zie [Admin HTTP RPC](/nl/plugins/admin-http-rpc).
- Chat Completions: standaard uitgeschakeld. Schakel in met `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Verharding van Responses-URL-invoer:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Lege allowlists worden behandeld als niet ingesteld; gebruik `gateway.http.endpoints.responses.files.allowUrl=false`
    en/of `gateway.http.endpoints.responses.images.allowUrl=false` om URL-fetching uit te schakelen.
- Optionele header voor responsverharding:
  - `gateway.http.securityHeaders.strictTransportSecurity` (stel dit alleen in voor HTTPS-origins die je beheert; zie [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolatie van meerdere instanties

Voer meerdere Gateways op één host uit met unieke poorten en state dirs:

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

- `enabled`: schakelt TLS-beëindiging in bij de Gateway-listener (HTTPS/WSS) (standaard: `false`).
- `autoGenerate`: genereert automatisch een lokaal self-signed cert/key-paar wanneer expliciete bestanden niet zijn geconfigureerd; alleen voor lokaal/dev-gebruik.
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
  - `"off"`: negeer live wijzigingen; wijzigingen vereisen een expliciete herstart.
  - `"restart"`: herstart altijd het Gateway-proces bij een configuratiewijziging.
  - `"hot"`: pas wijzigingen in-process toe zonder opnieuw te starten.
  - `"hybrid"` (standaard): probeer eerst hot reload; val terug op opnieuw starten als dat vereist is.
- `debounceMs`: debounce-venster in ms voordat configuratiewijzigingen worden toegepast (niet-negatief geheel getal).
- `deferralTimeoutMs`: optionele maximale tijd in ms om op lopende bewerkingen te wachten voordat een herstart of hot reload van het kanaal wordt geforceerd. Laat dit weg om de standaard begrensde wachttijd (`300000`) te gebruiken; stel in op `0` om onbeperkt te wachten en periodieke waarschuwingen over nog lopende taken te loggen.

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
- `hooks.token` moet verschillen van actieve Gateway-shared-secret-auth (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` of `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); startup logt een niet-fatale beveiligingswaarschuwing wanneer hergebruik wordt gedetecteerd.
- `openclaw security audit` markeert hergebruik van hook-/Gateway-auth als een kritieke bevinding, inclusief Gateway-wachtwoordauth die alleen tijdens de audit wordt opgegeven (`--auth password --password <password>`). Voer `openclaw doctor --fix` uit om een persistent hergebruikt `hooks.token` te roteren en werk daarna externe hook-verzenders bij zodat ze het nieuwe hook-token gebruiken.
- `hooks.path` kan niet `/` zijn; gebruik een specifiek subpad zoals `/hooks`.
- Als `hooks.allowRequestSessionKey=true`, beperk dan `hooks.allowedSessionKeyPrefixes` (bijvoorbeeld `["hook:"]`).
- Als een mapping of preset een getemplate `sessionKey` gebruikt, stel dan `hooks.allowedSessionKeyPrefixes` en `hooks.allowRequestSessionKey=true` in. Statische mapping-sleutels vereisen die opt-in niet.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` uit de request-payload wordt alleen geaccepteerd wanneer `hooks.allowRequestSessionKey=true` (standaard: `false`).
- `POST /hooks/<name>` → opgelost via `hooks.mappings`
  - Door templates gerenderde mapping-waarden voor `sessionKey` worden behandeld als extern aangeleverd en vereisen ook `hooks.allowRequestSessionKey=true`.

<Accordion title="Mappingdetails">

- `match.path` matcht het subpad na `/hooks` (bijv. `/hooks/gmail` → `gmail`).
- `match.source` matcht een payload-veld voor generieke paden.
- Templates zoals `{{messages[0].subject}}` lezen uit de payload.
- `transform` kan verwijzen naar een JS/TS-module die een hook-actie retourneert.
  - `transform.module` moet een relatief pad zijn en blijft binnen `hooks.transformsDir` (absolute paden en traversal worden geweigerd).
  - Houd `hooks.transformsDir` onder `~/.openclaw/hooks/transforms`; workspace-Skills-directories worden geweigerd. Als `openclaw doctor` dit pad als ongeldig rapporteert, verplaats de transform-module dan naar de hooks-transforms-directory of verwijder `hooks.transformsDir`.
- `agentId` routeert naar een specifieke agent; onbekende ID's vallen terug op de standaardagent.
- `allowedAgentIds`: beperkt effectieve agent-routering, inclusief het standaardagentpad wanneer `agentId` is weggelaten (`*` of weggelaten = alles toestaan, `[]` = alles weigeren).
- `defaultSessionKey`: optionele vaste sessiesleutel voor hook-agent-runs zonder expliciete `sessionKey`.
- `allowRequestSessionKey`: sta toe dat `/hooks/agent`-callers en template-gestuurde mapping-sessiesleutels `sessionKey` instellen (standaard: `false`).
- `allowedSessionKeyPrefixes`: optionele allowlist met prefixes voor expliciete `sessionKey`-waarden (request + mapping), bijv. `["hook:"]`. Dit wordt vereist wanneer een mapping of preset een getemplate `sessionKey` gebruikt.
- `deliver: true` stuurt het uiteindelijke antwoord naar een kanaal; `channel` is standaard `last`.
- `model` overschrijft de LLM voor deze hook-run (moet toegestaan zijn als de modelcatalogus is ingesteld).

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
- Niet-loopback-binds: canvas-routes vereisen Gateway-auth (token/wachtwoord/trusted-proxy), net als andere Gateway-HTTP-oppervlakken.
- Node WebViews verzenden doorgaans geen auth-headers; nadat een node is gekoppeld en verbonden, adverteert de Gateway node-scoped capability-URL's voor canvas-/A2UI-toegang.
- Capability-URL's zijn gebonden aan de actieve node-WS-sessie en verlopen snel. IP-gebaseerde fallback wordt niet gebruikt.
- Injecteert een live-reload-client in geserveerde HTML.
- Maakt automatisch een starter-`index.html` aan wanneer dit leeg is.
- Serveert A2UI ook op `/__openclaw__/a2ui/`.
- Wijzigingen vereisen een Gateway-herstart.
- Schakel live reload uit voor grote directories of `EMFILE`-fouten.

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
- `full`: neem `cliPath` + `sshPort` op; LAN-multicast-advertising vereist nog steeds dat de gebundelde `bonjour`-Plugin is ingeschakeld.
- `off`: onderdruk LAN-multicast-advertising zonder de inschakeling van de Plugin te wijzigen.
- De gebundelde `bonjour`-Plugin start automatisch op macOS-hosts en is opt-in op Linux, Windows en gecontaineriseerde Gateway-deployments.
- Hostnaam is standaard de systeemhostnaam wanneer die een geldig DNS-label is, met fallback naar `openclaw`. Overschrijf met `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Schrijft een unicast DNS-SD-zone onder `~/.openclaw/dns/`. Combineer dit voor ontdekking tussen netwerken met een DNS-server (CoreDNS aanbevolen) + Tailscale split DNS.

Instellen: `openclaw dns setup --apply`.

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

- Alleen hoofdletternamen komen overeen: `[A-Z_][A-Z0-9_]*`.
- Ontbrekende/lege variabelen geven een fout bij het laden van de configuratie.
- Escape met `$${VAR}` voor een letterlijke `${VAR}`.
- Werkt met `$include`.

---

## Geheimen

Geheime verwijzingen zijn additief: platte-tekstwaarden blijven werken.

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
- `source: "exec"` ids mogen geen met slashes gescheiden padsegmenten `.` of `..` bevatten (bijvoorbeeld `a/../b` wordt geweigerd)

### Ondersteund credentialoppervlak

- Canonieke matrix: [SecretRef-credentialoppervlak](/nl/reference/secretref-credential-surface)
- `secrets apply` richt zich op ondersteunde credentialpaden in `openclaw.json`.
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
- `exec`-provider vereist een absoluut `command`-pad en gebruikt protocolpayloads op stdin/stdout.
- Standaard worden symlink-commandopaden geweigerd. Stel `allowSymlinkCommand: true` in om symlinkpaden toe te staan terwijl het opgeloste doelpad wordt gevalideerd.
- Als `trustedDirs` is geconfigureerd, geldt de trusted-dir-controle voor het opgeloste doelpad.
- De child-omgeving van `exec` is standaard minimaal; geef vereiste variabelen expliciet door met `passEnv`.
- Geheime verwijzingen worden tijdens activatie opgelost naar een in-memory snapshot; daarna lezen aanvraagpaden alleen de snapshot.
- Filtering op actief oppervlak wordt toegepast tijdens activatie: onopgeloste verwijzingen op ingeschakelde oppervlakken laten opstarten/herladen mislukken, terwijl inactieve oppervlakken met diagnostiek worden overgeslagen.

---

## Authenticatieopslag

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
- `auth-profiles.json` ondersteunt refs op waardeniveau (`keyRef` voor `api_key`, `tokenRef` voor `token`) voor statische referentiemodi.
- Verouderde platte `auth-profiles.json`-mappings zoals `{ "provider": { "apiKey": "..." } }` zijn geen runtime-indeling; `openclaw doctor --fix` herschrijft ze naar canonieke `provider:default` API-sleutelprofielen met een `.legacy-flat.*.bak`-back-up.
- Profielen in OAuth-modus (`auth.profiles.<id>.mode = "oauth"`) ondersteunen geen auth-profielreferenties die door SecretRef worden ondersteund.
- Statische runtime-referenties komen uit in het geheugen opgeloste snapshots; verouderde statische `auth.json`-items worden opgeschoond wanneer ze worden gevonden.
- Verouderde OAuth-imports komen uit `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: basisbackoff in uren wanneer een profiel faalt door echte
  facturerings-/onvoldoende-tegoedfouten (standaard: `5`). Expliciete factureringstekst kan
  hier nog steeds terechtkomen, zelfs bij `401`/`403`-reacties, maar providerspecifieke tekst-
  matchers blijven beperkt tot de provider waartoe ze behoren (bijvoorbeeld OpenRouter
  `Key limit exceeded`). Opnieuw te proberen HTTP `402`-berichten over gebruiksvensters of
  bestedingslimieten voor organisatie/werkruimte blijven in plaats daarvan in het `rate_limit`-pad.
- `billingBackoffHoursByProvider`: optionele overschrijvingen per provider voor factureringsbackoff in uren.
- `billingMaxHours`: limiet in uren voor exponentiële groei van factureringsbackoff (standaard: `24`).
- `authPermanentBackoffMinutes`: basisbackoff in minuten voor zeer betrouwbare `auth_permanent`-fouten (standaard: `10`).
- `authPermanentMaxMinutes`: limiet in minuten voor groei van `auth_permanent`-backoff (standaard: `60`).
- `failureWindowHours`: rollend venster in uren dat wordt gebruikt voor backoff-tellers (standaard: `24`).
- `overloadedProfileRotations`: maximaal aantal auth-profielrotaties bij dezelfde provider voor overbelastingsfouten voordat wordt overgeschakeld naar modelterugval (standaard: `1`). Provider-bezet-vormen zoals `ModelNotReadyException` komen hier terecht.
- `overloadedBackoffMs`: vaste vertraging voordat een overbelaste provider-/profielrotatie opnieuw wordt geprobeerd (standaard: `0`).
- `rateLimitedProfileRotations`: maximaal aantal auth-profielrotaties bij dezelfde provider voor rate-limitfouten voordat wordt overgeschakeld naar modelterugval (standaard: `1`). Die rate-limit-bucket omvat providergevormde tekst zoals `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` en `resource exhausted`.

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
- `consoleLevel` wordt verhoogd naar `debug` bij `--verbose`.
- `maxFileBytes`: maximale grootte van het actieve logbestand in bytes voordat rotatie plaatsvindt (positief geheel getal; standaard: `104857600` = 100 MB). OpenClaw bewaart maximaal vijf genummerde archieven naast het actieve bestand.
- `redactSensitive` / `redactPatterns`: best-effort maskering voor console-uitvoer, bestandslogs, OTLP-logrecords en blijvend opgeslagen sessietranscripttekst. `redactSensitive: "off"` schakelt alleen dit algemene log-/transcriptbeleid uit; UI-/tool-/diagnostische veiligheidsoppervlakken redigeren geheimen nog steeds voordat ze worden uitgezonden.

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
- `flags`: array met flag-strings die gerichte loguitvoer inschakelen (ondersteunt wildcards zoals `"telegram.*"` of `"*"`).
- `stuckSessionWarnMs`: drempel voor leeftijd zonder voortgang in ms voor het classificeren van langlopende verwerkingssessies als `session.long_running`, `session.stalled` of `session.stuck`. Antwoord-, tool-, status-, blok- en ACP-voortgang resetten de timer; herhaalde `session.stuck`-diagnostiek bouwt af zolang er niets verandert.
- `stuckSessionAbortMs`: drempel voor leeftijd zonder voortgang in ms voordat in aanmerking komend vastgelopen actief werk via abort-drain kan worden hersteld. Wanneer niet ingesteld, gebruikt OpenClaw het veiligere uitgebreide embedded-run-venster van ten minste 5 minuten en 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: legt een geredigeerde stabiliteitssnapshot vóór OOM vast wanneer geheugendruk `critical` bereikt (standaard: `false`). Stel in op `true` om de scan/schrijfactie voor het stabiliteitsbundelbestand toe te voegen terwijl normale geheugendrukgebeurtenissen behouden blijven.
- `otel.enabled`: schakelt de OpenTelemetry-exportpipeline in (standaard: `false`). Zie [OpenTelemetry-export](/nl/gateway/opentelemetry) voor de volledige configuratie, signaalcatalogus en het privacymodel.
- `otel.endpoint`: collector-URL voor OTel-export.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: optionele signaalspecifieke OTLP-eindpunten. Wanneer ingesteld, overschrijven ze `otel.endpoint` alleen voor dat signaal.
- `otel.protocol`: `"http/protobuf"` (standaard) of `"grpc"`.
- `otel.headers`: extra HTTP-/gRPC-metadataheaders die met OTel-exportverzoeken worden verzonden.
- `otel.serviceName`: servicenaam voor resource-attributen.
- `otel.traces` / `otel.metrics` / `otel.logs`: schakel trace-, metrics- of logexport in.
- `otel.logsExporter`: sink voor logexport: `"otlp"` (standaard), `"stdout"` voor één JSON-object per stdout-regel, of `"both"`.
- `otel.sampleRate`: trace-samplingratio `0`-`1`.
- `otel.flushIntervalMs`: periodiek flushinterval voor telemetrie in ms.
- `otel.captureContent`: opt-in vastlegging van ruwe content voor OTEL-spanattributen. Staat standaard uit. Booleaanse `true` legt niet-systeembericht-/toolcontent vast; met de objectvorm kunt u `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` en `toolDefinitions` expliciet inschakelen.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: omgevingsschakelaar voor de nieuwste experimentele GenAI-inferentie-spanvorm, inclusief spannamen `{gen_ai.operation.name} {gen_ai.request.model}`, spansoort `CLIENT` en `gen_ai.provider.name` in plaats van verouderde `gen_ai.system`. Standaard behouden spans `openclaw.model.call` en `gen_ai.system` voor compatibiliteit; GenAI-metrics gebruiken begrensde semantische attributen.
- `OPENCLAW_OTEL_PRELOADED=1`: omgevingsschakelaar voor hosts die al een globale OpenTelemetry-SDK hebben geregistreerd. OpenClaw slaat dan door de Plugin beheerde SDK-start/stop over terwijl diagnostische listeners actief blijven.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` en `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: signaalspecifieke endpoint-env-vars die worden gebruikt wanneer de bijbehorende configuratiesleutel niet is ingesteld.
- `cacheTrace.enabled`: log cache-trace-snapshots voor embedded runs (standaard: `false`).
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
- `checkOnStart`: controleer op npm-updates wanneer de gateway start (standaard: `true`).
- `auto.enabled`: schakel automatische updates op de achtergrond in voor pakketinstallaties (standaard: `false`).
- `auto.stableDelayHours`: minimale vertraging in uren voordat automatische toepassing voor het stable-kanaal plaatsvindt (standaard: `6`; max: `168`).
- `auto.stableJitterHours`: extra spreidingsvenster voor stable-kanaaluitrol in uren (standaard: `12`; max: `168`).
- `auto.betaCheckIntervalHours`: hoe vaak controles voor het beta-kanaal worden uitgevoerd in uren (standaard: `1`; max: `24`).

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
- `dispatch.enabled`: onafhankelijke gate voor ACP-sessieturndispatch (standaard: `true`). Stel in op `false` om ACP-opdrachten beschikbaar te houden terwijl uitvoering wordt geblokkeerd.
- `backend`: standaard ACP-runtimebackend-id (moet overeenkomen met een geregistreerde ACP-runtime-Plugin).
  Installeer eerst de backend-Plugin en, als `plugins.allow` is ingesteld, neem de backend-Plugin-id op (bijvoorbeeld `acpx`) of de ACP-backend wordt niet geladen.
- `defaultAgent`: fallback-ACP-doelagent-id wanneer spawns geen expliciet doel specificeren.
- `allowedAgents`: allowlist van agent-id's die zijn toegestaan voor ACP-runtimesessies; leeg betekent geen aanvullende beperking.
- `maxConcurrentSessions`: maximaal aantal gelijktijdig actieve ACP-sessies.
- `stream.coalesceIdleMs`: idle-flushvenster in ms voor gestreamde tekst.
- `stream.maxChunkChars`: maximale chunkgrootte voordat gestreamde blokprojectie wordt gesplitst.
- `stream.repeatSuppression`: onderdruk herhaalde status-/toolregels per turn (standaard: `true`).
- `stream.deliveryMode`: `"live"` streamt incrementeel; `"final_only"` buffert tot terminale turngebeurtenissen.
- `stream.hiddenBoundarySeparator`: scheidingsteken vóór zichtbare tekst na verborgen toolgebeurtenissen (standaard: `"paragraph"`).
- `stream.maxOutputChars`: maximaal aantal assistent-uitvoertekens dat per ACP-turn wordt geprojecteerd.
- `stream.maxSessionUpdateChars`: maximaal aantal tekens voor geprojecteerde ACP-status-/updateregels.
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

- `cli.banner.taglineMode` regelt de stijl van de bannerslogan:
  - `"random"` (standaard): wisselende grappige/seizoensgebonden slogans.
  - `"default"`: vaste neutrale slogan (`All your chats, one OpenClaw.`).
  - `"off"`: geen slogantekst (bannertitel/versie worden nog steeds getoond).
- Stel env `OPENCLAW_HIDE_BANNER=1` in om de volledige banner te verbergen (niet alleen slogans).

---

## Wizard

Metadata geschreven door CLI-gestuurde installatieflows (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## Identiteit

Zie de identiteitsvelden van `agents.list` onder [Standaardinstellingen voor agents](/nl/gateway/config-agents#agent-defaults).

---

## Bridge (legacy, verwijderd)

Huidige builds bevatten de TCP-bridge niet meer. Nodes verbinden via de Gateway-WebSocket. `bridge.*`-sleutels maken geen deel meer uit van het configuratieschema (validatie mislukt totdat ze zijn verwijderd; `openclaw doctor --fix` kan onbekende sleutels verwijderen).

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

- `sessionRetention`: hoelang voltooide geïsoleerde Cron-runsessies worden bewaard voordat ze uit `sessions.json` worden opgeschoond. Regelt ook het opschonen van gearchiveerde verwijderde Cron-transcripts. Standaard: `24h`; stel in op `false` om uit te schakelen.
- `runLog.maxBytes`: geaccepteerd voor compatibiliteit met oudere bestandsgestuurde Cron-runlogs. Standaard: `2_000_000` bytes.
- `runLog.keepLines`: nieuwste SQLite-runhistorierijen die per taak worden bewaard. Standaard: `2000`.
- `webhookToken`: bearer-token gebruikt voor Cron Webhook POST-bezorging (`delivery.mode = "webhook"`); indien weggelaten wordt er geen auth-header verzonden.
- `webhook`: verouderde legacy fallback-Webhook-URL (http/https) gebruikt door `openclaw doctor --fix` om opgeslagen taken te migreren die nog steeds `notify: true` hebben; runtimebezorging gebruikt per taak `delivery.mode="webhook"` plus `delivery.to`, of `delivery.completionDestination` bij het behouden van aankondigingsbezorging.

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

- `maxAttempts`: maximaal aantal nieuwe pogingen voor Cron-taken bij tijdelijke fouten (standaard: `3`; bereik: `0`-`10`).
- `backoffMs`: array met backoff-vertragingen in ms voor elke nieuwe poging (standaard: `[30000, 60000, 300000]`; 1-10 items).
- `retryOn`: fouttypen die nieuwe pogingen activeren - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Laat weg om alle tijdelijke typen opnieuw te proberen.

Eenmalige taken blijven ingeschakeld totdat de nieuwe pogingen zijn uitgeput; daarna worden ze uitgeschakeld terwijl de uiteindelijke foutstatus behouden blijft. Terugkerende taken gebruiken hetzelfde tijdelijke retrybeleid om na backoff opnieuw te draaien vóór hun volgende geplande tijdslot; permanente fouten of uitgeputte tijdelijke retries vallen terug op het normale terugkerende schema met foutbackoff.

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
- `includeSkipped`: tel opeenvolgende overgeslagen runs mee voor de meldingsdrempel (standaard: `false`). Overgeslagen runs worden apart bijgehouden en hebben geen invloed op backoff voor uitvoeringsfouten.
- `mode`: bezorgmodus - `"announce"` verzendt via een kanaalbericht; `"webhook"` post naar de geconfigureerde Webhook.
- `accountId`: optioneel account- of kanaal-id om meldingsbezorging af te bakenen.

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
- `mode`: `"announce"` of `"webhook"`; standaard is `"announce"` wanneer er voldoende doelgegevens bestaan.
- `channel`: kanaaloverride voor aankondigingsbezorging. `"last"` hergebruikt het laatst bekende bezorgkanaal.
- `to`: expliciet aankondigingsdoel of Webhook-URL. Vereist voor Webhook-modus.
- `accountId`: optionele accountoverride voor bezorging.
- Per-taak `delivery.failureDestination` overschrijft deze globale standaard.
- Wanneer noch een globale noch een per-taak-foutbestemming is ingesteld, vallen taken die al via `announce` bezorgen bij een fout terug op dat primaire aankondigingsdoel.
- `delivery.failureDestination` wordt alleen ondersteund voor `sessionTarget="isolated"`-taken, tenzij de primaire `delivery.mode` van de taak `"webhook"` is.

Zie [Cron-taken](/nl/automation/cron-jobs). Geïsoleerde Cron-uitvoeringen worden bijgehouden als [achtergrondtaken](/nl/automation/tasks).

---

## Templatevariabelen voor mediamodellen

Template-placeholders die worden uitgebreid in `tools.media.models[].args`:

| Variabele          | Beschrijving                                      |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Volledige inkomende berichttekst                  |
| `{{RawBody}}`      | Ruwe tekst (geen geschiedenis-/afzenderwrappers)  |
| `{{BodyStripped}}` | Tekst met groepsvermeldingen verwijderd           |
| `{{From}}`         | Afzender-ID                                       |
| `{{To}}`           | Bestemmings-ID                                    |
| `{{MessageSid}}`   | Kanaalbericht-id                                  |
| `{{SessionId}}`    | Huidige sessie-UUID                               |
| `{{IsNewSession}}` | `"true"` wanneer een nieuwe sessie is gemaakt     |
| `{{MediaUrl}}`     | Inkomende media-pseudo-URL                        |
| `{{MediaPath}}`    | Lokaal mediapad                                   |
| `{{MediaType}}`    | Mediatype (afbeelding/audio/document/…)           |
| `{{Transcript}}`   | Audiotranscript                                   |
| `{{Prompt}}`       | Opgeloste mediaprompt voor CLI-items              |
| `{{MaxChars}}`     | Opgelost maximumaantal uitvoertekens voor CLI-items |
| `{{ChatType}}`     | `"direct"` of `"group"`                           |
| `{{GroupSubject}}` | Groepsonderwerp (beste poging)                    |
| `{{GroupMembers}}` | Voorbeeld van groepsleden (beste poging)          |
| `{{SenderName}}`   | Weergavenaam van afzender (beste poging)          |
| `{{SenderE164}}`   | Telefoonnummer van afzender (beste poging)        |
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
- Array met bestanden: diep samengevoegd in volgorde (later overschrijft eerder).
- Siblingsleutels: samengevoegd na includes (overschrijven opgenomen waarden).
- Geneste includes: tot 10 niveaus diep.
- Paden: opgelost relatief aan het includende bestand, maar moeten binnen de configuratiemap op topniveau blijven (`dirname` van `openclaw.json`). Absolute/`../`-vormen zijn alleen toegestaan wanneer ze nog steeds binnen die grens oplossen. Paden mogen geen null-bytes bevatten en moeten vóór en na oplossing strikt korter zijn dan 4096 tekens.
- OpenClaw-eigen schrijfacties die slechts één topniveausectie wijzigen die wordt ondersteund door een include met één bestand, schrijven door naar dat opgenomen bestand. Bijvoorbeeld, `plugins install` werkt `plugins: { $include: "./plugins.json5" }` bij in `plugins.json5` en laat `openclaw.json` intact.
- Root-includes, include-arrays en includes met siblingsoverschrijvingen zijn alleen-lezen voor OpenClaw-eigen schrijfacties; die schrijfacties falen gesloten in plaats van de configuratie af te vlakken.
- Fouten: duidelijke meldingen voor ontbrekende bestanden, parseerfouten, circulaire includes, ongeldige padindeling en buitensporige lengte.

---

_Gerelateerd: [Configuratie](/nl/gateway/configuration) · [Configuratievoorbeelden](/nl/gateway/configuration-examples) · [Doctor](/nl/gateway/doctor)_

## Gerelateerd

- [Configuratie](/nl/gateway/configuration)
- [Configuratievoorbeelden](/nl/gateway/configuration-examples)
