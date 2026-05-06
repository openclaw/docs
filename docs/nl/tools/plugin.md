---
read_when:
    - Plugins installeren of configureren
    - Plugin-detectie en laadregels begrijpen
    - Werken met Codex/Claude-compatibele Plugin-bundels
sidebarTitle: Install and Configure
summary: OpenClaw-plugins installeren, configureren en beheren
title: Plugins
x-i18n:
    generated_at: "2026-05-06T18:00:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

Plugins breiden OpenClaw uit met nieuwe mogelijkheden: kanalen, modelproviders,
agentruntimes, tools, Skills, spraak, realtime transcriptie, realtime
spraak, media-understanding, beeldgeneratie, videogeneratie, web fetch, web
search, en meer. Sommige plugins zijn **core** (meegeleverd met OpenClaw), andere
zijn **extern**. De meeste externe plugins worden gepubliceerd en ontdekt via
[ClawHub](/nl/tools/clawhub). Npm blijft ondersteund voor directe installaties en voor een
tijdelijke set pluginpakketten die eigendom zijn van OpenClaw terwijl die migratie wordt afgerond.

## Snel aan de slag

Voor copy-pastevoorbeelden voor installeren, weergeven, verwijderen, bijwerken en publiceren, zie
[Plugins beheren](/nl/plugins/manage-plugins).

<Steps>
  <Step title="Bekijk wat is geladen">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Installeer een plugin">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin
    openclaw plugins install npm-pack:./openclaw-plugin-1.2.3.tgz

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Herstart de Gateway">
    ```bash
    openclaw gateway restart
    ```

    Configureer daarna onder `plugins.entries.\<id\>.config` in je configuratiebestand.

  </Step>

  <Step title="Chat-native beheer">
    In een draaiende Gateway activeren alleen-voor-eigenaar `/plugins enable` en `/plugins disable`
    de config reloader van de Gateway. De Gateway herlaadt plugin-runtimeoppervlakken
    in hetzelfde proces, en nieuwe agentbeurten bouwen hun toollijst opnieuw op vanuit het
    vernieuwde register. `/plugins install` wijzigt de broncode van plugins, dus de
    Gateway vraagt om een herstart in plaats van te doen alsof het huidige proces
    reeds geïmporteerde modules veilig kan herladen.

  </Step>

  <Step title="Verifieer de plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Gebruik `--runtime` wanneer je geregistreerde tools, services, gateway
    methods, hooks of CLI-opdrachten die eigendom zijn van de plugin moet aantonen.
    Gewone `inspect` is een koude manifest-/registercontrole en vermijdt bewust het
    importeren van de plugin-runtime.

  </Step>
</Steps>

Als je chat-native beheer verkiest, schakel `commands.plugins: true` in en gebruik:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Het installatiepad gebruikt dezelfde resolver als de CLI: lokaal pad/archief, expliciet
`clawhub:<pkg>`, expliciet `npm:<pkg>`, expliciet `npm-pack:<path.tgz>`,
expliciet `git:<repo>`, of een kale pakketspecificatie via npm.

Als de configuratie ongeldig is, faalt installatie normaal gesproken gesloten en verwijst je naar
`openclaw doctor --fix`. De enige hersteluitzondering is een smal herinstallatiepad voor gebundelde plugins
voor plugins die zich aanmelden voor
`openclaw.install.allowInvalidConfigRecovery`.
Tijdens het opstarten van de Gateway faalt ongeldige pluginconfiguratie gesloten zoals elke andere ongeldige
configuratie. Voer `openclaw doctor --fix` uit om de slechte pluginconfiguratie in quarantaine te plaatsen door
die pluginvermelding uit te schakelen en de ongeldige configuratiepayload te verwijderen; de normale
configuratieback-up bewaart de vorige waarden.
Wanneer een kanaalconfiguratie verwijst naar een plugin die niet meer vindbaar is, maar dezelfde
verouderde plugin-id in pluginconfiguratie of installatierecords blijft staan, logt het opstarten van de Gateway
waarschuwingen en slaat dat kanaal over in plaats van elk ander kanaal te blokkeren.
Voer `openclaw doctor --fix` uit om de verouderde kanaal-/pluginvermeldingen te verwijderen; onbekende
kanaalsleutels zonder bewijs van een verouderde plugin blijven validatie laten falen zodat typefouten
zichtbaar blijven.
Als `plugins.enabled: false` is ingesteld, worden verouderde pluginverwijzingen als inert behandeld:
het opstarten van de Gateway slaat plugin discovery/load-werk over en `openclaw doctor` behoudt
de uitgeschakelde pluginconfiguratie in plaats van deze automatisch te verwijderen. Schakel plugins opnieuw in voordat
je doctor-opruiming uitvoert als je verouderde plugin-id's verwijderd wilt hebben.

Installatie van pluginafhankelijkheden gebeurt alleen tijdens expliciete installatie-/update- of
doctor-herstelstromen. Het opstarten van de Gateway, configuratieherladen en runtime-inspectie voeren
geen package managers uit en herstellen geen afhankelijkheidsbomen. Lokale plugins moeten hun afhankelijkheden al
geïnstalleerd hebben, terwijl npm-, git- en ClawHub-plugins worden geïnstalleerd onder de beheerde pluginroots
van OpenClaw. npm-afhankelijkheden kunnen worden gehesen binnen de beheerde npm-root van OpenClaw; installatie/update scant die beheerde root vóór vertrouwen en verwijdering verwijdert door npm beheerde pakketten via npm. Externe plugins
en aangepaste laadpaden moeten nog steeds worden geïnstalleerd via `openclaw plugins install`.
Gebruik `openclaw plugins list --json` om de statische `dependencyStatus` voor elke
zichtbare plugin te zien zonder runtimecode te importeren of afhankelijkheden te herstellen.
Zie [Plugin dependency resolution](/nl/plugins/dependency-resolution) voor de
install-time levenscyclus.

### Geblokkeerd eigenaarschap van pluginpad

Als plugindiagnostiek zegt
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
en configuratievalidatie volgt met `plugin present but blocked`, heeft OpenClaw
pluginbestanden gevonden die eigendom zijn van een andere Unix-gebruiker dan het proces dat ze laadt.
Laat de pluginconfiguratie staan; herstel het bestandssysteemeigenaarschap of voer
OpenClaw uit als dezelfde gebruiker die eigenaar is van de statusdirectory.

Voor Docker-installaties draait de officiële image als `node` (uid `1000`), dus de
host bind-mounted OpenClaw-configuratie- en werkruimtedirectory's zouden normaal gesproken
eigendom moeten zijn van uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Als je OpenClaw bewust als root uitvoert, herstel dan de beheerde pluginroot naar
root-eigenaarschap:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Voer na het herstellen van eigenaarschap opnieuw `openclaw doctor --fix` of
`openclaw plugins registry --refresh` uit zodat het persistente pluginregister overeenkomt
met de herstelde bestanden.

Voor npm-installaties worden wijzigbare selectors zoals `latest` of een dist-tag opgelost
vóór installatie en daarna vastgezet op de exact geverifieerde versie in de beheerde npm-root
van OpenClaw. Nadat npm klaar is, verifieert OpenClaw dat de geïnstalleerde
`package-lock.json`-vermelding nog steeds overeenkomt met de opgeloste versie en integriteit. Als
npm andere pakketmetadata schrijft, faalt de installatie en wordt het beheerde pakket
teruggedraaid in plaats van een ander pluginartefact te accepteren.
Beheerde npm-roots erven ook de package-level npm `overrides` van OpenClaw, zodat
security pins die de verpakte host beschermen ook gelden voor gehesen externe
pluginafhankelijkheden.

Broncheckouts zijn pnpm-workspaces. Als je OpenClaw kloont om aan gebundelde
plugins te werken, voer dan `pnpm install` uit; OpenClaw laadt gebundelde plugins vervolgens vanuit
`extensions/<id>` zodat bewerkingen en package-local afhankelijkheden direct worden gebruikt.
Gewone npm-rootinstallaties zijn voor verpakte OpenClaw, niet voor ontwikkeling vanuit een broncheckout.

## Plugintypen

OpenClaw herkent twee pluginformaten:

| Formaat    | Hoe het werkt                                                     | Voorbeelden                                            |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-module; wordt in-process uitgevoerd | Officiële plugins, community npm-pakketten             |
| **Bundle** | Codex/Claude/Cursor-compatibele layout; gemapt naar OpenClaw-functies | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide verschijnen onder `openclaw plugins list`. Zie [Plugin Bundles](/nl/plugins/bundles) voor bundledetails.

Als je een native plugin schrijft, begin dan met [Plugins bouwen](/nl/plugins/building-plugins)
en het [Plugin SDK-overzicht](/nl/plugins/sdk-overview).

## Pakketentrypoints

Native plugin-npm-pakketten moeten `openclaw.extensions` declareren in `package.json`.
Elke entry moet binnen de pakketdirectory blijven en verwijzen naar een leesbaar
runtimebestand, of naar een TypeScript-bronbestand met een afgeleide gebouwde JavaScript
peer zoals `src/index.ts` naar `dist/index.js`.
Verpakte installaties moeten die JavaScript-runtime-output meeleveren. De TypeScript
bronfallback is voor broncheckouts en lokale ontwikkelpaden, niet voor
npm-pakketten die in de beheerde pluginroot van OpenClaw zijn geïnstalleerd.

Als een beheerde pakketwaarschuwing zegt dat het `requires compiled runtime output for
TypeScript entry ...`, is het pakket gepubliceerd zonder de JavaScript-bestanden
die OpenClaw tijdens runtime nodig heeft. Dat is een pluginverpakkingsprobleem, geen lokaal configuratieprobleem.
Werk de plugin bij of installeer deze opnieuw nadat de uitgever gecompileerd
JavaScript opnieuw heeft gepubliceerd, of schakel die plugin uit/verwijder die plugin totdat een gerepareerd pakket beschikbaar is.

Gebruik `openclaw.runtimeExtensions` wanneer gepubliceerde runtimebestanden niet op
dezelfde paden staan als de bronentries. Indien aanwezig moet `runtimeExtensions`
exact één entry bevatten voor elke `extensions`-entry. Niet-overeenkomende lijsten laten installatie en
plugin discovery falen in plaats van stil terug te vallen op bronpaden. Als je ook
`openclaw.setupEntry` publiceert, gebruik dan `openclaw.runtimeSetupEntry` voor de gebouwde
JavaScript peer ervan; dat bestand is vereist wanneer het wordt gedeclareerd.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Officiële plugins

### Npm-pakketten die eigendom zijn van OpenClaw tijdens migratie

ClawHub is het primaire distributiepad voor de meeste plugins. Huidige verpakte
OpenClaw-releases bundelen al veel officiële plugins, dus die hebben in normale setups
geen aparte npm-installaties nodig. Totdat elke plugin die eigendom is van OpenClaw is
gemigreerd naar ClawHub, levert OpenClaw nog steeds enkele `@openclaw/*` pluginpakketten op
npm voor oudere/aangepaste installaties en directe npm-workflows.

Als npm een `@openclaw/*` pluginpakket als verouderd meldt, komt die pakketversie
uit een oudere externe pakketreeks. Gebruik de gebundelde plugin uit
huidige OpenClaw of een lokale checkout totdat een nieuwer npm-pakket wordt gepubliceerd.

| Plugin          | Pakket                     | Docs                                       |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/nl/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/nl/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/nl/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/nl/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/nl/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/nl/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/nl/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/nl/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/nl/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/nl/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/nl/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/nl/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/nl/plugins/zalouser)         |

### Core (meegeleverd met OpenClaw)

<AccordionGroup>
  <Accordion title="Modelproviders (standaard ingeschakeld)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` - gebundelde geheugenzoekfunctie (standaard via `plugins.slots.memory`)
    - `memory-lancedb` - langetermijngeheugen op basis van LanceDB met automatisch ophalen/vastleggen (stel `plugins.slots.memory = "memory-lancedb"` in)

    Zie [Memory LanceDB](/nl/plugins/memory-lancedb) voor OpenAI-compatibele
    embeddingconfiguratie, Ollama-voorbeelden, ophaallimieten en probleemoplossing.

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` - gebundelde browserplugin voor de browsertool, `openclaw browser` CLI, `browser.request` Gateway-methode, browserruntime en standaardservice voor browserbesturing (standaard ingeschakeld; schakel uit voordat u deze vervangt)
    - `copilot-proxy` - VS Code Copilot Proxy-brug (standaard uitgeschakeld)

  </Accordion>
</AccordionGroup>

Op zoek naar plugins van derden? Zie [Community Plugins](/nl/plugins/community).

## Configuratie

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Veld               | Beschrijving                                               |
| ------------------ | ---------------------------------------------------------- |
| `enabled`          | Hoofdschakelaar (standaard: `true`)                        |
| `allow`            | Plugin-toelatingslijst (optioneel)                         |
| `bundledDiscovery` | Detectiemodus voor gebundelde plugins (standaard `allowlist`) |
| `deny`             | Plugin-weigerlijst (optioneel; weigeren wint)              |
| `load.paths`       | Extra pluginbestanden/-mappen                              |
| `slots`            | Exclusieve slotselectors (bijv. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Schakelaars + configuratie per plugin                      |

`plugins.allow` is exclusief. Wanneer deze niet leeg is, kunnen alleen vermelde plugins laden
of tools beschikbaar stellen, zelfs als `tools.allow` `"*"` of een specifieke toolnaam
van een plugin bevat. Als een tool-toelatingslijst naar plugintools verwijst, voegt u de eigenaars-plugin-id's
toe aan `plugins.allow` of verwijdert u `plugins.allow`; `openclaw doctor` waarschuwt voor deze
vorm.

`plugins.bundledDiscovery` is standaard `"allowlist"` voor nieuwe configuraties, zodat een
restrictieve `plugins.allow`-inventaris ook weggelaten gebundelde providerplugins blokkeert,
inclusief detectie van runtimeproviders voor webzoekopdrachten. Doctor stempelt oudere
restrictieve toelatingslijstconfiguraties tijdens migratie met `"compat"`, zodat upgrades het
verouderde gedrag van gebundelde providers behouden totdat de operator de strengere modus kiest.
Een lege `plugins.allow` wordt nog steeds behandeld als niet ingesteld/open.

Configuratiewijzigingen die via `/plugins enable` of `/plugins disable` worden gemaakt, activeren een
in-process herlaadactie van Gateway-plugins. Nieuwe agentbeurten bouwen hun toollijst opnieuw op vanuit
het vernieuwde pluginregister. Bewerkingen die de bron wijzigen, zoals installeren,
bijwerken en verwijderen, herstarten nog steeds het Gateway-proces omdat reeds geimporteerde
pluginmodules niet veilig ter plekke kunnen worden vervangen.

`openclaw plugins list` is een lokale momentopname van pluginregister/configuratie. Een
`enabled` plugin daar betekent dat het opgeslagen register en de huidige configuratie toestaan dat de
plugin deelneemt. Het bewijst niet dat een al draaiende externe Gateway is herladen of herstart
met dezelfde plugincode. Stuur bij VPS-/containeropstellingen met wrapperprocessen herstarts of schrijfacties
die herladen activeren naar het daadwerkelijke `openclaw gateway run`-proces, of gebruik
`openclaw gateway restart` tegen de draaiende Gateway wanneer de herlaadactie een fout rapporteert.

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **Uitgeschakeld**: plugin bestaat, maar inschakelregels hebben deze uitgeschakeld. Configuratie blijft behouden.
  - **Ontbrekend**: configuratie verwijst naar een plugin-id die detectie niet heeft gevonden.
  - **Ongeldig**: plugin bestaat, maar de configuratie komt niet overeen met het gedeclareerde schema. Het opstarten van Gateway slaat alleen die plugin over; `openclaw doctor --fix` kan de ongeldige entry in quarantaine plaatsen door deze uit te schakelen en de configuratiepayload te verwijderen.

</Accordion>

## Detectie en voorrang

OpenClaw scant in deze volgorde naar plugins (eerste match wint):

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` - expliciete bestands- of mappaden. Paden die terugwijzen
    naar OpenClaw's eigen verpakte gebundelde pluginmappen worden genegeerd;
    voer `openclaw doctor --fix` uit om die verouderde aliassen te verwijderen.
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` en `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` en `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    Meegeleverd met OpenClaw. Veel zijn standaard ingeschakeld (modelproviders, spraak).
    Andere vereisen expliciete inschakeling.
  </Step>
</Steps>

Verpakte installaties en Docker-images lossen gebundelde plugins normaal op vanuit de
gecompileerde `dist/extensions`-boom. Als een bronmap van een gebundelde plugin
over het overeenkomende verpakte bronpad wordt bind-mounted, bijvoorbeeld
`/app/extensions/synology-chat`, behandelt OpenClaw die gemounte bronmap
als een bronoverlay voor gebundelde plugins en detecteert deze voor de verpakte
`/app/dist/extensions/synology-chat`-bundel. Zo blijven containerloops voor maintainers
werken zonder elke gebundelde plugin terug te schakelen naar TypeScript-broncode.
Stel `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` in om verpakte dist-bundels af te dwingen,
zelfs wanneer bronoverlay-mounts aanwezig zijn.

### Inschakelregels

- `plugins.enabled: false` schakelt alle plugins uit en slaat plugin-detectie-/laadwerk over
- `plugins.deny` wint altijd van toestaan
- `plugins.entries.\<id\>.enabled: false` schakelt die plugin uit
- Plugins afkomstig uit de workspace zijn **standaard uitgeschakeld** (moeten expliciet worden ingeschakeld)
- Gebundelde plugins volgen de ingebouwde standaard-aan-set, tenzij overschreven
- Exclusieve slots kunnen de geselecteerde plugin voor dat slot geforceerd inschakelen
- Sommige gebundelde opt-in-plugins worden automatisch ingeschakeld wanneer configuratie een
  surface noemt die eigendom is van de plugin, zoals een providermodelreferentie, kanaalconfiguratie of harness-
  runtime
- Verouderde pluginconfiguratie blijft behouden terwijl `plugins.enabled: false` actief is;
  schakel plugins opnieuw in voordat u doctor-opruiming uitvoert als u verouderde id's wilt verwijderen
- OpenAI-familie Codex-routes houden aparte plugin-grenzen aan:
  `openai-codex/*` behoort tot de OpenAI-plugin, terwijl de gebundelde Codex
  app-server-plugin wordt geselecteerd door `agentRuntime.id: "codex"` of verouderde
  `codex/*`-modelreferenties

## Problemen met runtimehooks oplossen

Als een plugin in `plugins list` verschijnt maar bijwerkingen of hooks van `register(api)`
niet worden uitgevoerd in live chatverkeer, controleer dan eerst het volgende:

- Voer `openclaw gateway status --deep --require-rpc` uit en bevestig dat de actieve
  Gateway-URL, het profiel, het configuratiepad en het proces degenen zijn die u bewerkt.
- Herstart de live Gateway na wijzigingen in plugininstallatie/configuratie/code. In wrapper-
  containers is PID 1 mogelijk alleen een supervisor; herstart of signaleer het onderliggende
  `openclaw gateway run`-proces.
- Gebruik `openclaw plugins inspect <id> --runtime --json` om hookregistraties en
  diagnostiek te bevestigen. Niet-gebundelde conversatiehooks zoals `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` en `agent_end` hebben
  `plugins.entries.<id>.hooks.allowConversationAccess=true` nodig.
- Geef voor modelwisseling de voorkeur aan `before_model_resolve`. Deze wordt uitgevoerd voor model-
  resolutie bij agentbeurten; `llm_output` wordt alleen uitgevoerd nadat een modelpoging
  assistant-uitvoer produceert.
- Gebruik voor bewijs van het effectieve sessiemodel `openclaw sessions` of de
  Gateway-sessie-/statussurfaces en start, bij het debuggen van providerpayloads, de
  Gateway met `--raw-stream --raw-stream-path <path>`.

### Trage instelling van plugintools

Als agentbeurten lijken te blijven hangen tijdens het voorbereiden van tools, schakel tracelogging in en
controleer op timingregels van plugintool-factories:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Zoek naar:

```text
[trace:plugin-tools] factory timings ...
```

De samenvatting toont de totale factorytijd en de traagste plugintool-factories,
inclusief plugin-id, gedeclareerde toolnamen, resultaatvorm en of de tool
optioneel is. Trage regels worden gepromoveerd tot waarschuwingen wanneer een enkele factory
minstens 1s duurt of de totale voorbereiding van plugintool-factories minstens 5s duurt.

OpenClaw cachet geslaagde resultaten van plugintool-factories voor herhaalde resoluties
met dezelfde effectieve aanvraagcontext. De cachesleutel bevat de effectieve
runtimeconfiguratie, workspace, agent-/sessie-id's, sandboxbeleid, browserinstellingen,
leveringscontext, identiteit van de aanvrager en eigendomsstatus, zodat factories die
afhangen van die vertrouwde velden opnieuw worden uitgevoerd wanneer de context verandert.

Als een plugin de timing domineert, inspecteer dan de runtimeregistraties:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Werk die plugin vervolgens bij, installeer deze opnieuw of schakel deze uit. Pluginauteurs moeten
dure dependency-lading achter het pad voor tooluitvoering plaatsen in plaats van dit
binnen de toolfactory te doen.

### Dubbel eigenaarschap van kanaal of tool

Symptomen:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Dit betekent dat meer dan een ingeschakelde plugin hetzelfde kanaal,
dezelfde setupflow of dezelfde toolnaam probeert te bezitten. De meest voorkomende oorzaak is een externe kanaalplugin
die naast een gebundelde plugin is geinstalleerd die nu dezelfde kanaal-id levert.

Debugstappen:

- Voer `openclaw plugins list --enabled --verbose` uit om elke ingeschakelde plugin
  en herkomst te zien.
- Voer `openclaw plugins inspect <id> --runtime --json` uit voor elke verdachte plugin en
  vergelijk `channels`, `channelConfigs`, `tools` en diagnostiek.
- Voer `openclaw plugins registry --refresh` uit na het installeren of verwijderen van
  pluginpakketten, zodat opgeslagen metadata de huidige installatie weerspiegelen.
- Herstart de Gateway na installatie-, register- of configuratiewijzigingen.

Oplossingsopties:

- Als een plugin bewust een andere plugin vervangt voor dezelfde kanaal-id, moet de
  voorkeursplugin `channelConfigs.<channel-id>.preferOver` declareren met
  de plugin-id met lagere prioriteit. Zie [/plugins/manifest#replacing-another-channel-plugin](/nl/plugins/manifest#replacing-another-channel-plugin).
- Als de duplicatie per ongeluk is, schakel een kant uit met
  `plugins.entries.<plugin-id>.enabled: false` of verwijder de verouderde plugin-
  installatie.
- Als u beide plugins expliciet hebt ingeschakeld, behoudt OpenClaw dat verzoek en
  rapporteert het conflict. Kies een eigenaar voor het kanaal of hernoem tools die eigendom zijn van plugins,
  zodat de runtimesurface ondubbelzinnig is.

## Pluginslots (exclusieve categorieen)

Sommige categorieen zijn exclusief (slechts een tegelijk actief):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| Slot            | Wat het beheert       | Standaard           |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active memory-plugin  | `memory-core`       |
| `contextEngine` | Active context engine | `legacy` (ingebouwd) |

## CLI-referentie

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install from npm by default
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Meegeleverde plugins worden met OpenClaw geleverd. Veel zijn standaard ingeschakeld (bijvoorbeeld meegeleverde modelproviders, meegeleverde spraakproviders en de meegeleverde browserplugin). Andere meegeleverde plugins hebben nog steeds `openclaw plugins enable <id>` nodig.

`--force` overschrijft een bestaande geïnstalleerde plugin of hook-pack op dezelfde plek. Gebruik `openclaw plugins update <id-or-npm-spec>` voor routinematige upgrades van gevolgde npm-plugins. Dit wordt niet ondersteund met `--link`, dat het bronpad hergebruikt in plaats van over een beheerd installatiedoel heen te kopiëren.

Wanneer `plugins.allow` al is ingesteld, voegt `openclaw plugins install` de geïnstalleerde plugin-id toe aan die allowlist voordat deze wordt ingeschakeld. Als dezelfde plugin-id aanwezig is in `plugins.deny`, verwijdert de installatie die verouderde deny-vermelding zodat de expliciete installatie direct laadbaar is na een herstart.

OpenClaw houdt een blijvend lokaal pluginregister bij als cold-readmodel voor plugininventaris, eigenaarschap van bijdragen en opstartplanning. Installatie-, update-, verwijder-, inschakel- en uitschakelstromen verversen dat register nadat de pluginstatus is gewijzigd. Hetzelfde bestand `plugins/installs.json` bewaart duurzame installatiemetadata in `installRecords` op het hoogste niveau en opnieuw opbouwbare manifestmetadata in `plugins`. Als het register ontbreekt, verouderd of ongeldig is, bouwt `openclaw plugins registry --refresh` de manifestweergave opnieuw op vanuit installatierecords, configuratiebeleid en manifest-/pakketmetadata zonder plugin-runtimemodules te laden.

In Nix-modus (`OPENCLAW_NIX_MODE=1`) zijn mutators voor de pluginlevenscyclus uitgeschakeld. Beheer in plaats daarvan de selectie van pluginpakketten en configuratie via de Nix-bron voor de installatie; begin voor nix-openclaw met de agent-eerst-[Quick Start](https://github.com/openclaw/nix-openclaw#quick-start).
`openclaw plugins update <id-or-npm-spec>` is van toepassing op gevolgde installaties. Het doorgeven van een npm-pakketspecificatie met een dist-tag of exacte versie herleidt de pakketnaam naar het gevolgde pluginrecord en registreert de nieuwe specificatie voor toekomstige updates. Het doorgeven van de pakketnaam zonder versie verplaatst een exact vastgepinde installatie terug naar de standaardreleaselijn van het register. Als de geïnstalleerde npm-plugin al overeenkomt met de opgeloste versie en geregistreerde artifact-identiteit, slaat OpenClaw de update over zonder te downloaden, opnieuw te installeren of configuratie te herschrijven.
Wanneer `openclaw update` op het bètakanaal draait, proberen npm- en ClawHub-pluginrecords op de standaardlijn eerst `@beta` en vallen ze terug op default/latest wanneer er geen bètarelease van de plugin bestaat. Exacte versies en expliciete tags blijven vastgepind.

`--pin` is alleen voor npm. Dit wordt niet ondersteund met `--marketplace`, omdat marketplace-installaties bronmetadata van de marketplace bewaren in plaats van een npm-specificatie.

`--dangerously-force-unsafe-install` is een noodoverride voor fout-positieven van de ingebouwde scanner voor gevaarlijke code. Hiermee kunnen plugininstallaties en pluginupdates doorgaan voorbij ingebouwde `critical`-bevindingen, maar het omzeilt nog steeds geen pluginblokkades via `before_install`-beleid of blokkering door scanfouten. Installatiescans negeren veelvoorkomende testbestanden en -mappen zoals `tests/`, `__tests__/`, `*.test.*` en `*.spec.*` om blokkering door meegeleverde testmocks te voorkomen; gedeclareerde runtime-entrypoints van plugins worden nog steeds gescand, zelfs als ze een van die namen gebruiken.

Deze CLI-vlag is alleen van toepassing op plugininstallatie- en updateflows. Door Gateway ondersteunde installaties van Skill-afhankelijkheden gebruiken in plaats daarvan de overeenkomende requestoverride `dangerouslyForceUnsafeInstall`, terwijl `openclaw skills install` de afzonderlijke download-/installatieflow voor ClawHub-Skills blijft.

Als een plugin die je op ClawHub hebt gepubliceerd verborgen is of door een scan wordt geblokkeerd, open dan het ClawHub-dashboard of voer `clawhub package rescan <name>` uit om ClawHub te vragen deze opnieuw te controleren. `--dangerously-force-unsafe-install` heeft alleen invloed op installaties op je eigen machine; het vraagt ClawHub niet om de plugin opnieuw te scannen of een geblokkeerde release openbaar te maken.

Compatibele bundels nemen deel aan dezelfde flow voor het weergeven, inspecteren, inschakelen en uitschakelen van plugins. De huidige runtimeondersteuning omvat bundel-Skills, Claude-command-Skills, Claude-standaardwaarden voor `settings.json`, Claude-standaardwaarden voor `.lsp.json` en in het manifest gedeclareerde `lspServers`, Cursor-command-Skills en compatibele Codex-hookmappen.

`openclaw plugins inspect <id>` rapporteert ook gedetecteerde bundelcapaciteiten plus ondersteunde of niet-ondersteunde MCP- en LSP-serververmeldingen voor door bundels ondersteunde plugins.

Marketplace-bronnen kunnen een Claude bekende-marketplace-naam uit `~/.claude/plugins/known_marketplaces.json` zijn, een lokale marketplace-root of `marketplace.json`-pad, een GitHub-verkorting zoals `owner/repo`, een GitHub-repo-URL of een git-URL. Voor externe marketplaces moeten pluginvermeldingen binnen de gekloonde marketplace-repo blijven en alleen relatieve padbronnen gebruiken.

Zie de [`openclaw plugins` CLI-referentie](/nl/cli/plugins) voor alle details.

## Overzicht van de Plugin-API

Native plugins exporteren een entry-object dat `register(api)` beschikbaar maakt. Oudere plugins kunnen nog steeds `activate(api)` gebruiken als legacy-alias, maar nieuwe plugins moeten `register` gebruiken.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw laadt het entry-object en roept `register(api)` aan tijdens pluginactivatie. De loader valt nog steeds terug op `activate(api)` voor oudere plugins, maar meegeleverde plugins en nieuwe externe plugins moeten `register` als het publieke contract beschouwen.

`api.registrationMode` vertelt een plugin waarom de entry wordt geladen:

| Modus           | Betekenis                                                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtimeactivatie. Registreer tools, hooks, services, commands, routes en andere live neveneffecten.                                      |
| `discovery`     | Alleen-lezen capaciteitsdetectie. Registreer providers en metadata; vertrouwde plugin-entrycode kan laden, maar sla live neveneffecten over. |
| `setup-only`    | Laden van metadata voor kanaalconfiguratie via een lichtgewicht setup-entry.                                                             |
| `setup-runtime` | Laden van kanaalconfiguratie waarvoor ook de runtime-entry nodig is.                                                                     |
| `cli-metadata`  | Alleen verzameling van metadata voor CLI-commands.                                                                                       |

Plugin-entries die sockets, databases, achtergrondworkers of langlevende clients openen, moeten die neveneffecten afschermen met `api.registrationMode === "full"`. Discovery-ladingen worden apart gecachet van activerende ladingen en vervangen het draaiende Gateway-register niet. Discovery is niet-activerend, niet importvrij: OpenClaw kan de vertrouwde plugin-entry of kanaalpluginmodule evalueren om de snapshot te bouwen. Houd module-topniveaus lichtgewicht en vrij van neveneffecten, en verplaats netwerkclients, subprocessen, listeners, credential reads en service-opstart achter full-runtimepaden.

Veelgebruikte registratiemethoden:

| Methode                                 | Wat deze registreert             |
| --------------------------------------- | -------------------------------- |
| `registerProvider`                      | Modelprovider (LLM)              |
| `registerChannel`                       | Chatkanaal                       |
| `registerTool`                          | Agenttool                        |
| `registerHook` / `on(...)`              | Lifecycle-hooks                  |
| `registerSpeechProvider`                | Tekst-naar-spraak / STT          |
| `registerRealtimeTranscriptionProvider` | Streaming-STT                    |
| `registerRealtimeVoiceProvider`         | Duplex realtime spraak           |
| `registerMediaUnderstandingProvider`    | Beeld-/audioanalyse              |
| `registerImageGenerationProvider`       | Beeldgeneratie                   |
| `registerMusicGenerationProvider`       | Muziekgeneratie                  |
| `registerVideoGenerationProvider`       | Videogeneratie                   |
| `registerWebFetchProvider`              | Webfetch-/scrapeprovider         |
| `registerWebSearchProvider`             | Webzoekfunctie                   |
| `registerHttpRoute`                     | HTTP-eindpunt                    |
| `registerCommand` / `registerCli`       | CLI-commands                     |
| `registerContextEngine`                 | Contextengine                    |
| `registerService`                       | Achtergrondservice               |

Hookguard-gedrag voor getypeerde lifecycle-hooks:

- `before_tool_call`: `{ block: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `before_tool_call`: `{ block: false }` is een no-op en wist een eerdere blokkade niet.
- `before_install`: `{ block: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `before_install`: `{ block: false }` is een no-op en wist een eerdere blokkade niet.
- `message_sending`: `{ cancel: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `message_sending`: `{ cancel: false }` is een no-op en wist een eerdere annulering niet.

Native Codex-appserver-runs koppelen Codex-native toolgebeurtenissen terug naar dit
hookoppervlak. Plugins kunnen native Codex-tools blokkeren via `before_tool_call`,
resultaten observeren via `after_tool_call` en deelnemen aan Codex
`PermissionRequest`-goedkeuringen. De bridge herschrijft Codex-native toolargumenten
nog niet. De exacte grens van Codex-runtimeondersteuning staat in het
[ondersteuningscontract voor Codex harness v1](/nl/plugins/codex-harness#v1-support-contract).

Zie voor volledig getypeerd hookgedrag het [SDK-overzicht](/nl/plugins/sdk-overview#hook-decision-semantics).

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins) - maak je eigen Plugin
- [Plugin-bundels](/nl/plugins/bundles) - bundelcompatibiliteit voor Codex/Claude/Cursor
- [Plugin-manifest](/nl/plugins/manifest) - manifestschema
- [Tools registreren](/nl/plugins/building-plugins#registering-agent-tools) - voeg agenttools toe in een Plugin
- [Plugin-internals](/nl/plugins/architecture) - capabilitymodel en laadpipeline
- [Community-Plugins](/nl/plugins/community) - vermeldingen van derden
