---
read_when:
    - Plugins installeren of configureren
    - Inzicht in Plugin-detectie en laadregels
    - Werken met Codex/Claude-compatibele Plugin-bundels
sidebarTitle: Install and Configure
summary: OpenClaw-plugins installeren, configureren en beheren
title: Plugins
x-i18n:
    generated_at: "2026-05-02T20:59:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: d553c917d9054f4cb5a244ffd0d749c37f6dde230a5887b6b71ba7cf39fcefe5
    source_path: tools/plugin.md
    workflow: 16
---

Plugins breiden OpenClaw uit met nieuwe mogelijkheden: kanalen, modelproviders,
agent-harnassen, tools, Skills, spraak, realtime transcriptie, realtime
spraak, mediabegrip, afbeeldingsgeneratie, videogeneratie, web-fetch, web
search en meer. Sommige plugins zijn **core** (meegeleverd met OpenClaw), andere
zijn **extern**. De meeste externe plugins worden gepubliceerd en ontdekt via
[ClawHub](/nl/tools/clawhub). Npm blijft ondersteund voor directe installaties en voor een
tijdelijke set pluginpakketten die eigendom zijn van OpenClaw terwijl die migratie wordt afgerond.

## Snelstart

Voor voorbeelden voor installeren, weergeven, verwijderen, bijwerken en publiceren die je kunt kopiëren en plakken, zie
[Plugins beheren](/nl/plugins/manage-plugins).

<Steps>
  <Step title="Bekijken wat geladen is">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Een plugin installeren">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="De Gateway herstarten">
    ```bash
    openclaw gateway restart
    ```

    Configureer daarna onder `plugins.entries.\<id\>.config` in je configuratiebestand.

  </Step>

  <Step title="Chat-native beheer">
    In een draaiende Gateway activeren owner-only `/plugins enable` en `/plugins disable`
    de configuratieherlader van de Gateway. De Gateway herlaadt plugin-runtime-
    oppervlakken in het proces, en nieuwe agent-beurten bouwen hun toollijst opnieuw op vanuit het
    vernieuwde register. `/plugins install` wijzigt de broncode van plugins, dus de
    Gateway vraagt om een herstart in plaats van te doen alsof het huidige proces
    reeds geimporteerde modules veilig kan herladen.

  </Step>

  <Step title="De plugin verifieren">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Gebruik `--runtime` wanneer je geregistreerde tools, services, gateway-
    methoden, hooks of CLI-commando's die eigendom zijn van de plugin moet aantonen. Gewone `inspect` is een koude
    manifest-/registercontrole en vermijdt bewust het importeren van plugin-runtime.

  </Step>
</Steps>

Als je chat-native bediening prefereert, schakel `commands.plugins: true` in en gebruik:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Het installatiepad gebruikt dezelfde resolver als de CLI: lokaal pad/archief, expliciet
`clawhub:<pkg>`, expliciet `npm:<pkg>`, expliciet `git:<repo>`, of kale pakket-
specificatie via npm.

Als de configuratie ongeldig is, mislukt installeren normaal fail-closed en wijst het je op
`openclaw doctor --fix`. De enige hersteluitzondering is een smal herinstallatiepad voor meegeleverde plugins
voor plugins die zich aanmelden voor
`openclaw.install.allowInvalidConfigRecovery`.
Tijdens het opstarten van de Gateway wordt ongeldige configuratie voor een plugin geisoleerd tot die plugin:
het opstarten logt het probleem met `plugins.entries.<id>.config`, slaat die plugin over tijdens
het laden en houdt andere plugins en kanalen online. Voer `openclaw doctor --fix` uit
om de slechte pluginconfiguratie te quarantainen door die pluginvermelding uit te schakelen en
de ongeldige configuratiepayload te verwijderen; de normale configuratieback-up bewaart de vorige waarden.
Wanneer een kanaalconfiguratie verwijst naar een plugin die niet meer vindbaar is maar dezelfde
verouderde plugin-id in pluginconfiguratie of installatierecords blijft staan, logt de Gateway bij het opstarten
waarschuwingen en slaat dat kanaal over in plaats van elk ander kanaal te blokkeren.
Voer `openclaw doctor --fix` uit om de verouderde kanaal-/pluginvermeldingen te verwijderen; onbekende
kanaalsleutels zonder bewijs van verouderde plugins blijven validatie laten mislukken zodat typefouten
zichtbaar blijven.
Als `plugins.enabled: false` is ingesteld, worden verouderde pluginverwijzingen als inert behandeld:
het opstarten van de Gateway slaat pluginontdekking/-laadwerk over en `openclaw doctor` behoudt
de uitgeschakelde pluginconfiguratie in plaats van die automatisch te verwijderen. Schakel plugins opnieuw in voordat je
doctor-opruiming uitvoert als je verouderde plugin-id's wilt verwijderen.

Installatie van pluginafhankelijkheden gebeurt alleen tijdens expliciete installatie-/update- of
doctor-herstelstromen. Het opstarten van de Gateway, configuratie herladen en runtime-inspectie voeren
geen package managers uit en repareren geen afhankelijkheidsbomen. Lokale plugins moeten hun afhankelijkheden al
geinstalleerd hebben, terwijl npm-, git- en ClawHub-plugins worden
geinstalleerd onder de beheerde pluginroots van OpenClaw. npm-afhankelijkheden kunnen worden gehoist
binnen de beheerde npm-root van OpenClaw; installatie/update scant die beheerde root voor
vertrouwen en verwijderen verwijdert door npm beheerde pakketten via npm. Externe plugins
en aangepaste laadpaden moeten nog steeds worden geinstalleerd via `openclaw plugins install`.
Gebruik `openclaw plugins list --json` om de statische `dependencyStatus` voor elke
zichtbare plugin te zien zonder runtime-code te importeren of afhankelijkheden te repareren.
Zie [Plugin-afhankelijkheidsresolutie](/nl/plugins/dependency-resolution) voor de
levenscyclus tijdens installatie.

Bron-checkouts zijn pnpm-workspaces. Als je OpenClaw kloont om aan meegeleverde
plugins te werken, voer `pnpm install` uit; OpenClaw laadt meegeleverde plugins dan vanuit
`extensions/<id>` zodat bewerkingen en pakketlokale afhankelijkheden rechtstreeks worden gebruikt.
Gewone npm-rootinstallaties zijn voor verpakte OpenClaw, niet voor ontwikkeling met een broncheckout.

## Plugin-typen

OpenClaw herkent twee pluginindelingen:

| Indeling   | Hoe het werkt                                                     | Voorbeelden                                             |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| **Native** | `openclaw.plugin.json` + runtime-module; voert in-process uit     | Officiele plugins, community-npm-pakketten              |
| **Bundle** | Codex/Claude/Cursor-compatibele layout; gemapt naar OpenClaw-functies | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide verschijnen onder `openclaw plugins list`. Zie [Plugin Bundles](/nl/plugins/bundles) voor bundledetails.

Als je een native plugin schrijft, begin dan met [Plugins bouwen](/nl/plugins/building-plugins)
en het [Overzicht van de Plugin SDK](/nl/plugins/sdk-overview).

## Pakket-entrypoints

Native plugin-npm-pakketten moeten `openclaw.extensions` declareren in `package.json`.
Elke vermelding moet binnen de pakketdirectory blijven en resolven naar een leesbaar
runtime-bestand, of naar een TypeScript-bronbestand met een afgeleide gebouwde JavaScript-
peer zoals `src/index.ts` naar `dist/index.js`.

Gebruik `openclaw.runtimeExtensions` wanneer gepubliceerde runtime-bestanden niet op dezelfde
paden staan als de bronvermeldingen. Wanneer aanwezig moet `runtimeExtensions` precies een
vermelding bevatten voor elke `extensions`-vermelding. Niet-overeenkomende lijsten laten installatie en
pluginontdekking mislukken in plaats van stil terug te vallen op bronpaden. Als je ook
`openclaw.setupEntry` publiceert, gebruik dan `openclaw.runtimeSetupEntry` voor de gebouwde
JavaScript-peer daarvan; dat bestand is vereist wanneer het is gedeclareerd.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Officiele plugins

### Npm-pakketten die eigendom zijn van OpenClaw tijdens migratie

ClawHub is het primaire distributiepad voor de meeste plugins. Huidige verpakte
OpenClaw-releases bundelen al veel officiele plugins, dus die hebben in normale setups
geen aparte npm-installaties nodig. Totdat elke plugin die eigendom is van OpenClaw
naar ClawHub is gemigreerd, levert OpenClaw nog steeds enkele `@openclaw/*`-pluginpakketten op
npm voor oudere/aangepaste installaties en directe npm-workflows.

Als npm een `@openclaw/*`-pluginpakket als deprecated meldt, komt die pakket-
versie uit een oudere externe pakkettrein. Gebruik de meegeleverde plugin uit
huidige OpenClaw of een lokale checkout totdat een nieuwer npm-pakket is gepubliceerd.

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

  <Accordion title="Geheugenplugins">
    - `memory-core` — meegeleverde geheugenzoekfunctie (standaard via `plugins.slots.memory`)
    - `memory-lancedb` — door LanceDB ondersteund langetermijngeheugen met automatische recall/capture (stel `plugins.slots.memory = "memory-lancedb"` in)

    Zie [Memory LanceDB](/nl/plugins/memory-lancedb) voor OpenAI-compatibele
    embedding-setup, Ollama-voorbeelden, recall-limieten en probleemoplossing.

  </Accordion>

  <Accordion title="Spraakproviders (standaard ingeschakeld)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Overig">
    - `browser` — meegeleverde browserplugin voor de browsertool, `openclaw browser` CLI, `browser.request` gateway-methode, browser-runtime en standaardservice voor browserbediening (standaard ingeschakeld; schakel uit voordat je deze vervangt)
    - `copilot-proxy` — VS Code Copilot Proxy-bridge (standaard uitgeschakeld)

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

| Veld             | Beschrijving                                              |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Hoofdschakelaar (standaard: `true`)                       |
| `allow`          | Plugin-allowlist (optioneel)                              |
| `deny`           | Plugin-denylist (optioneel; deny wint)                    |
| `load.paths`     | Extra pluginbestanden/-directory's                        |
| `slots`          | Exclusieve slotselectoren (bijv. `memory`, `contextEngine`) |
| `entries.\<id\>` | Schakelaars + configuratie per plugin                     |

`plugins.allow` is exclusief. Wanneer deze niet leeg is, kunnen alleen vermelde plugins laden
of tools blootstellen, zelfs als `tools.allow` `"*"` of een specifieke toolnaam
die eigendom is van een plugin bevat. Als een tool-allowlist verwijst naar plugintools, voeg dan de eigenaars-plugin-id's
toe aan `plugins.allow` of verwijder `plugins.allow`; `openclaw doctor` waarschuwt voor deze
vorm.

Configuratiewijzigingen die via `/plugins enable` of `/plugins disable` worden gemaakt, activeren een
in-process herlading van Gateway-plugins. Nieuwe agentbeurten bouwen hun toollijst opnieuw op vanuit
het vernieuwde pluginregister. Bewerkingen die bronnen wijzigen, zoals installeren,
bijwerken en verwijderen, herstarten nog steeds het Gateway-proces omdat reeds geimporteerde
pluginmodules niet veilig ter plekke kunnen worden vervangen.

`openclaw plugins list` is een lokale momentopname van het pluginregister/de configuratie. Een
`enabled` plugin daar betekent dat het opgeslagen register en de huidige configuratie toestaan dat de
plugin deelneemt. Het bewijst niet dat een al draaiende externe Gateway is herladen of herstart met
dezelfde plugincode. Stuur bij VPS-/containeropstellingen
met wrapperprocessen herstarts of schrijfacties die herladen activeren naar het daadwerkelijke
`openclaw gateway run`-proces, of gebruik `openclaw gateway restart` voor de
draaiende Gateway wanneer de herlading een fout meldt.

<Accordion title="Plugin-statussen: uitgeschakeld vs ontbrekend vs ongeldig">
  - **Uitgeschakeld**: plugin bestaat, maar inschakelregels hebben deze uitgezet. Configuratie blijft behouden.
  - **Ontbrekend**: configuratie verwijst naar een plugin-id die niet door discovery is gevonden.
  - **Ongeldig**: plugin bestaat, maar de configuratie komt niet overeen met het gedeclareerde schema. Gateway-start slaat alleen die plugin over; `openclaw doctor --fix` kan de ongeldige entry in quarantaine plaatsen door deze uit te schakelen en de configuratiepayload te verwijderen.

</Accordion>

## Discovery en voorrang

OpenClaw scant op plugins in deze volgorde (eerste match wint):

<Steps>
  <Step title="Configuratiepaden">
    `plugins.load.paths` — expliciete bestands- of directorypaden. Paden die terugwijzen
    naar OpenClaw's eigen verpakte meegeleverde plugindirectory's worden genegeerd;
    voer `openclaw doctor --fix` uit om die verouderde aliassen te verwijderen.
  </Step>

  <Step title="Workspace-plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` en `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globale plugins">
    `~/.openclaw/<plugin-root>/*.ts` en `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Meegeleverde plugins">
    Meegeleverd met OpenClaw. Veel zijn standaard ingeschakeld (modelproviders, spraak).
    Andere vereisen expliciete inschakeling.
  </Step>
</Steps>

Verpakte installaties en Docker-images lossen meegeleverde plugins normaal op vanuit de
gecompileerde `dist/extensions`-boom. Als een brondirectory van een meegeleverde plugin
als bind mount over het overeenkomende verpakte bronpad wordt gezet, bijvoorbeeld
`/app/extensions/synology-chat`, behandelt OpenClaw die gemounte brondirectory
als een meegeleverde bronoverlay en ontdekt deze voor de verpakte
`/app/dist/extensions/synology-chat`-bundel. Zo blijven containerloops voor maintainers
werken zonder elke meegeleverde plugin terug te schakelen naar TypeScript-bron.
Stel `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` in om verpakte dist-bundels af te dwingen,
ook wanneer bronoverlay-mounts aanwezig zijn.

### Inschakelregels

- `plugins.enabled: false` schakelt alle plugins uit en slaat plugin-discovery/-laadwerk over
- `plugins.deny` wint altijd van allow
- `plugins.entries.\<id\>.enabled: false` schakelt die plugin uit
- Plugins uit de workspace zijn **standaard uitgeschakeld** (moeten expliciet worden ingeschakeld)
- Meegeleverde plugins volgen de ingebouwde standaard-aan-set, tenzij overschreven
- Exclusieve slots kunnen de geselecteerde plugin voor dat slot geforceerd inschakelen
- Sommige meegeleverde opt-in-plugins worden automatisch ingeschakeld wanneer de configuratie een
  door de plugin beheerd oppervlak noemt, zoals een providermodelreferentie, kanaalconfiguratie of harness-
  runtime
- Verouderde pluginconfiguratie blijft behouden terwijl `plugins.enabled: false` actief is;
  schakel plugins opnieuw in voordat je doctor-opruiming uitvoert als je verouderde ids wilt verwijderen
- OpenAI-familie Codex-routes houden gescheiden plugingrenzen aan:
  `openai-codex/*` behoort tot de OpenAI-plugin, terwijl de meegeleverde Codex
  app-serverplugin wordt geselecteerd door `agentRuntime.id: "codex"` of verouderde
  `codex/*`-modelreferenties

## Runtimehooks oplossen

Als een plugin in `plugins list` verschijnt, maar bijeffecten of hooks van `register(api)`
niet draaien in live chatverkeer, controleer dan eerst dit:

- Voer `openclaw gateway status --deep --require-rpc` uit en bevestig dat de actieve
  Gateway-URL, het profiel, het configuratiepad en het proces degene zijn die je bewerkt.
- Herstart de live Gateway na wijzigingen in plugininstallatie/configuratie/code. In wrapper-
  containers is PID 1 mogelijk alleen een supervisor; herstart of signaleer het child-
  `openclaw gateway run`-proces.
- Gebruik `openclaw plugins inspect <id> --runtime --json` om hookregistraties en
  diagnostiek te bevestigen. Niet-meegeleverde gesprekshooks zoals `llm_input`,
  `llm_output`, `before_agent_finalize` en `agent_end` hebben
  `plugins.entries.<id>.hooks.allowConversationAccess=true` nodig.
- Geef voor modelwisseling de voorkeur aan `before_model_resolve`. Dit draait vóór model-
  resolutie voor agentbeurten; `llm_output` draait pas nadat een modelpoging
  assistentuitvoer produceert.
- Gebruik voor bewijs van het effectieve sessiemodel `openclaw sessions` of de
  Gateway-sessie-/statusoppervlakken en start, wanneer je providerpayloads debugt, de
  Gateway met `--raw-stream --raw-stream-path <path>`.

### Trage setup van plugintools

Als agentbeurten lijken te blijven hangen tijdens het voorbereiden van tools, schakel trace-logging in en
controleer op timingregels voor plugintoolfactories:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Zoek naar:

```text
[trace:plugin-tools] factory timings ...
```

De samenvatting vermeldt de totale factorytijd en de traagste plugintoolfactories,
inclusief plugin-id, gedeclareerde toolnamen, resultaatvorm en of de tool
optioneel is. Trage regels worden gepromoveerd tot waarschuwingen wanneer een enkele factory minstens
1s duurt of de totale voorbereiding van plugintoolfactories minstens 5s duurt.

OpenClaw cachet succesvolle resultaten van plugintoolfactories voor herhaalde resoluties
met dezelfde effectieve requestcontext. De cachesleutel bevat de effectieve
runtimeconfiguratie, workspace, agent-/sessie-ids, sandboxbeleid, browserinstellingen,
aflevercontext, identiteit van de requester en ownershipstatus, zodat factories die
afhankelijk zijn van die vertrouwde velden opnieuw worden uitgevoerd wanneer de context verandert.

Als een plugin de timing domineert, inspecteer dan de runtimeregistraties:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Werk die plugin daarna bij, installeer deze opnieuw of schakel deze uit. Pluginauteurs moeten
dure dependency-loading achter het tooluitvoeringspad plaatsen in plaats van dit
in de toolfactory te doen.

### Dubbel kanaal- of toolownership

Symptomen:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Dit betekent dat meer dan een ingeschakelde plugin hetzelfde kanaal,
dezelfde setupflow of dezelfde toolnaam probeert te beheren. De meest voorkomende oorzaak is een externe kanaalplugin
die naast een meegeleverde plugin is geinstalleerd die nu dezelfde kanaal-id levert.

Debugstappen:

- Voer `openclaw plugins list --enabled --verbose` uit om elke ingeschakelde plugin
  en oorsprong te zien.
- Voer `openclaw plugins inspect <id> --runtime --json` uit voor elke verdachte plugin en
  vergelijk `channels`, `channelConfigs`, `tools` en diagnostiek.
- Voer `openclaw plugins registry --refresh` uit na het installeren of verwijderen van
  pluginpakketten, zodat opgeslagen metadata de huidige installatie weerspiegelen.
- Herstart de Gateway na installatie-, register- of configuratiewijzigingen.

Oplossingsopties:

- Als een plugin bewust een andere vervangt voor dezelfde kanaal-id, moet de
  voorkeursplugin `channelConfigs.<channel-id>.preferOver` declareren met
  de plugin-id met lagere prioriteit. Zie [/plugins/manifest#replacing-another-channel-plugin](/nl/plugins/manifest#replacing-another-channel-plugin).
- Als de duplicatie per ongeluk is, schakel dan een van beide kanten uit met
  `plugins.entries.<plugin-id>.enabled: false` of verwijder de verouderde plugin-
  installatie.
- Als je beide plugins expliciet hebt ingeschakeld, bewaart OpenClaw dat verzoek en
  meldt het conflict. Kies één eigenaar voor het kanaal of hernoem door plugins beheerde
  tools zodat het runtimeoppervlak ondubbelzinnig is.

## Pluginslots (exclusieve categorieen)

Sommige categorieen zijn exclusief (slechts één tegelijk actief):

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

| Slot            | Wat het regelt          | Standaard           |
| --------------- | ----------------------- | ------------------- |
| `memory`        | Active Memory-plugin    | `memory-core`       |
| `contextEngine` | Actieve contextengine   | `legacy` (ingebouwd) |

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

Meegeleverde plugins worden met OpenClaw geleverd. Veel zijn standaard ingeschakeld (bijvoorbeeld
meegeleverde modelproviders, meegeleverde spraakproviders en de meegeleverde browser-
plugin). Andere meegeleverde plugins hebben nog steeds `openclaw plugins enable <id>` nodig.

`--force` overschrijft een bestaande geinstalleerde plugin of hookpack ter plekke. Gebruik
`openclaw plugins update <id-or-npm-spec>` voor routinematige upgrades van gevolgde npm-
plugins. Dit wordt niet ondersteund met `--link`, dat het bronpad hergebruikt in plaats
van over een beheerd installatiedoel heen te kopiëren.

Wanneer `plugins.allow` al is ingesteld, voegt `openclaw plugins install` de
geinstalleerde plugin-id toe aan die allowlist voordat de plugin wordt ingeschakeld. Als dezelfde plugin-id
aanwezig is in `plugins.deny`, verwijdert install die verouderde deny-entry zodat de
expliciete installatie direct laadbaar is na herstart.

OpenClaw bewaart een persistent lokaal Plugin-register als het koude leesmodel voor
Plugin-inventaris, eigendom van bijdragen en opstartplanning. Installatie-, update-,
de-installatie-, inschakel- en uitschakelflows vernieuwen dat register nadat de
Plugin-status is gewijzigd. Hetzelfde bestand `plugins/installs.json` bewaart duurzame
installatiemetadata in top-level `installRecords` en opnieuw opbouwbare manifestmetadata
in `plugins`. Als het register ontbreekt, verouderd of ongeldig is, bouwt
`openclaw plugins registry --refresh` de manifestweergave opnieuw op vanuit
installatierecords, configuratiebeleid en manifest-/pakketmetadata zonder
Plugin-runtime-modules te laden.
`openclaw plugins update <id-or-npm-spec>` is van toepassing op bijgehouden installaties. Het
doorgeven van een npm-pakketspecificatie met een dist-tag of exacte versie herleidt de
pakketnaam terug naar het bijgehouden Plugin-record en registreert de nieuwe specificatie
voor toekomstige updates. Het doorgeven van de pakketnaam zonder versie verplaatst een
exact vastgezette installatie terug naar de standaardreleaselijn van het register. Als de
geïnstalleerde npm-Plugin al overeenkomt met de opgeloste versie en geregistreerde
artefactidentiteit, slaat OpenClaw de update over zonder te downloaden, opnieuw te
installeren of configuratie te herschrijven.
Wanneer `openclaw update` op het bètakanaal wordt uitgevoerd, proberen npm- en ClawHub-
Plugin-records op de standaardlijn eerst `@beta` en vallen ze terug op standard/latest
wanneer er geen bètarelease van de Plugin bestaat. Exacte versies en expliciete tags
blijven vastgezet.

`--pin` is alleen voor npm. Het wordt niet ondersteund met `--marketplace`, omdat
marketplace-installaties marketplace-bronmetadata bewaren in plaats van een npm-specificatie.

`--dangerously-force-unsafe-install` is een noodoverride voor fout-positieven van de
ingebouwde scanner voor gevaarlijke code. Hiermee kunnen Plugin-installaties en
Plugin-updates doorgaan voorbij ingebouwde `critical`-bevindingen, maar het omzeilt nog
steeds geen Plugin-`before_install`-beleidsblokkades of blokkering door scanfouten.
Installatiescans negeren gangbare testbestanden en -mappen zoals `tests/`,
`__tests__/`, `*.test.*` en `*.spec.*` om te voorkomen dat verpakte testmocks worden
geblokkeerd; gedeclareerde Plugin-runtime-entrypoints worden nog steeds gescand, zelfs
als ze een van die namen gebruiken.

Deze CLI-vlag geldt alleen voor Plugin-installatie-/updateflows. Gateway-ondersteunde
installaties van Skill-afhankelijkheden gebruiken in plaats daarvan de overeenkomende
request-override `dangerouslyForceUnsafeInstall`, terwijl `openclaw skills install` de
aparte ClawHub-download-/installatieflow voor Skills blijft.

Als een Plugin die je op ClawHub hebt gepubliceerd door een scan is verborgen of
geblokkeerd, open dan het ClawHub-dashboard of voer `clawhub package rescan <name>` uit
om ClawHub te vragen deze opnieuw te controleren. `--dangerously-force-unsafe-install`
beïnvloedt alleen installaties op je eigen machine; het vraagt ClawHub niet om de Plugin
opnieuw te scannen en maakt een geblokkeerde release niet openbaar.

Compatibele bundels nemen deel aan dezelfde Plugin-list-/inspect-/enable-/disable-flow.
De huidige runtime-ondersteuning omvat bundel-Skills, Claude command-Skills, standaardinstellingen
voor Claude `settings.json`, standaardinstellingen voor Claude `.lsp.json` en in het
manifest gedeclareerde `lspServers`, Cursor command-Skills en compatibele Codex-hookmappen.

`openclaw plugins inspect <id>` rapporteert ook gedetecteerde bundelmogelijkheden plus
ondersteunde of niet-ondersteunde MCP- en LSP-serververmeldingen voor door bundels
ondersteunde Plugins.

Marketplace-bronnen kunnen een bekende Claude-marketplace-naam uit
`~/.claude/plugins/known_marketplaces.json` zijn, een lokale marketplace-root of
`marketplace.json`-pad, een GitHub-shorthand zoals `owner/repo`, een GitHub-repo-URL of
een git-URL. Voor remote marketplaces moeten Plugin-vermeldingen binnen de gekloonde
marketplace-repo blijven en alleen relatieve padbronnen gebruiken.

Zie de [`openclaw plugins` CLI-referentie](/nl/cli/plugins) voor alle details.

## Overzicht van de Plugin-API

Native Plugins exporteren een entry-object dat `register(api)` beschikbaar maakt. Oudere
Plugins kunnen nog steeds `activate(api)` gebruiken als legacy-alias, maar nieuwe Plugins
moeten `register` gebruiken.

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

OpenClaw laadt het entry-object en roept `register(api)` aan tijdens Plugin-activering.
De loader valt nog steeds terug op `activate(api)` voor oudere Plugins, maar gebundelde
Plugins en nieuwe externe Plugins moeten `register` als het publieke contract behandelen.

`api.registrationMode` vertelt een Plugin waarom de entry ervan wordt geladen:

| Modus           | Betekenis                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-activering. Registreer tools, hooks, services, commands, routes en andere live side effects.                              |
| `discovery`     | Alleen-lezen ontdekking van mogelijkheden. Registreer providers en metadata; vertrouwde Plugin-entrycode mag laden, maar sla live side effects over. |
| `setup-only`    | Laden van channel-setupmetadata via een lichtgewicht setup-entry.                                                                |
| `setup-runtime` | Laden van channel-setup waarvoor ook de runtime-entry nodig is.                                                                  |
| `cli-metadata`  | Alleen verzameling van CLI-commandmetadata.                                                                                      |

Plugin-entries die sockets, databases, achtergrondwerkers of langlevende clients openen,
moeten die side effects afschermen met `api.registrationMode === "full"`.
Discovery-loads worden apart gecachet van activeringsloads en vervangen het actieve
Gateway-register niet. Discovery is niet-activerend, niet importvrij:
OpenClaw kan de vertrouwde Plugin-entry of channel-Plugin-module evalueren om de
snapshot te bouwen. Houd module-topniveaus lichtgewicht en vrij van side effects, en
verplaats netwerkclients, subprocessen, listeners, credential-reads en service-opstart
achter full-runtime-paden.

Veelgebruikte registratiemethoden:

| Methode                                 | Wat deze registreert        |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Modelprovider (LLM)         |
| `registerChannel`                       | Chatkanaal                  |
| `registerTool`                          | Agenttool                   |
| `registerHook` / `on(...)`              | Lifecycle-hooks             |
| `registerSpeechProvider`                | Tekst-naar-spraak / STT     |
| `registerRealtimeTranscriptionProvider` | Streaming-STT               |
| `registerRealtimeVoiceProvider`         | Duplex realtime voice       |
| `registerMediaUnderstandingProvider`    | Beeld-/audioanalyse         |
| `registerImageGenerationProvider`       | Afbeeldingsgeneratie        |
| `registerMusicGenerationProvider`       | Muziekgeneratie             |
| `registerVideoGenerationProvider`       | Videogeneratie              |
| `registerWebFetchProvider`              | Webfetch-/scrapeprovider    |
| `registerWebSearchProvider`             | Webzoekfunctie              |
| `registerHttpRoute`                     | HTTP-endpoint               |
| `registerCommand` / `registerCli`       | CLI-commands                |
| `registerContextEngine`                 | Context-engine              |
| `registerService`                       | Achtergrondservice          |

Hook-guardgedrag voor getypte lifecycle-hooks:

- `before_tool_call`: `{ block: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `before_tool_call`: `{ block: false }` is een no-op en wist een eerdere blokkade niet.
- `before_install`: `{ block: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `before_install`: `{ block: false }` is een no-op en wist een eerdere blokkade niet.
- `message_sending`: `{ cancel: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `message_sending`: `{ cancel: false }` is een no-op en wist een eerdere annulering niet.

De native Codex-app-server koppelt Codex-native toolgebeurtenissen terug naar dit
hook-oppervlak. Plugins kunnen native Codex-tools blokkeren via `before_tool_call`,
resultaten observeren via `after_tool_call` en deelnemen aan goedkeuringen van Codex
`PermissionRequest`. De bridge herschrijft Codex-native toolargumenten nog niet. De exacte
grens van Codex-runtime-ondersteuning staat in het
[Codex harness v1-ondersteuningscontract](/nl/plugins/codex-harness#v1-support-contract).

Zie [SDK-overzicht](/nl/plugins/sdk-overview#hook-decision-semantics) voor volledig getypt hookgedrag.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins) — maak je eigen Plugin
- [Plugin-bundels](/nl/plugins/bundles) — compatibiliteit met Codex-/Claude-/Cursor-bundels
- [Plugin-manifest](/nl/plugins/manifest) — manifestschema
- [Tools registreren](/nl/plugins/building-plugins#registering-agent-tools) — agenttools toevoegen in een Plugin
- [Plugin-internals](/nl/plugins/architecture) — capabilitymodel en laadpipeline
- [Community-Plugins](/nl/plugins/community) — vermeldingen van derden
