---
read_when:
    - Plugins installeren of configureren
    - Plugin-detectie en laadregels begrijpen
    - Werken met Codex-/Claude-compatibele Plugin-bundels
sidebarTitle: Install and Configure
summary: Installeer, configureer en beheer OpenClaw-plugins
title: Plugins
x-i18n:
    generated_at: "2026-05-02T11:30:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9378ef4a6aef26949148702f2f6d8537811869511e8830ae5c3d560ff06d98b
    source_path: tools/plugin.md
    workflow: 16
---

Plugins breiden OpenClaw uit met nieuwe mogelijkheden: kanalen, modelproviders,
agent-harnassen, tools, Skills, spraak, realtime transcriptie, realtime
spraak, mediabegrip, afbeeldingsgeneratie, videogeneratie, web-fetch, web
search, en meer. Sommige plugins zijn **core** (meegeleverd met OpenClaw),
andere zijn **extern**. De meeste externe plugins worden gepubliceerd en
ontdekt via [ClawHub](/nl/tools/clawhub). Npm blijft ondersteund voor directe
installaties en voor een tijdelijke set OpenClaw-beheerde pluginpakketten
terwijl die migratie wordt afgerond.

## Snel aan de slag

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

  <Step title="Verifieer de plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Gebruik `--runtime` wanneer je geregistreerde tools, services, gateway
    methods, hooks of CLI-opdrachten van de plugin moet aantonen. Gewoon
    `inspect` is een koude manifest-/registrycontrole en vermijdt bewust het
    importeren van de plugin-runtime.

  </Step>
</Steps>

Als je voorkeur geeft aan chat-native bediening, schakel dan `commands.plugins: true` in en gebruik:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Het installatiepad gebruikt dezelfde resolver als de CLI: lokaal pad/archief, expliciet
`clawhub:<pkg>`, expliciet `npm:<pkg>`, expliciet `git:<repo>`, of een kale package
spec (eerst ClawHub, daarna npm-fallback).

Als de configuratie ongeldig is, mislukt de installatie normaal gesproken gesloten en wijst die je naar
`openclaw doctor --fix`. De enige hersteluitzondering is een smal herinstallatiepad voor meegeleverde plugins
voor plugins die zich aanmelden voor
`openclaw.install.allowInvalidConfigRecovery`.
Tijdens het starten van de Gateway wordt ongeldige configuratie voor één plugin geïsoleerd tot die plugin:
het opstarten logt het probleem met `plugins.entries.<id>.config`, slaat die plugin over tijdens
het laden, en houdt andere plugins en kanalen online. Voer `openclaw doctor --fix` uit
om de slechte pluginconfiguratie in quarantaine te plaatsen door die pluginvermelding uit te schakelen en
de ongeldige configuratiepayload te verwijderen; de normale configuratieback-up bewaart de vorige waarden.
Wanneer een kanaalconfiguratie verwijst naar een plugin die niet langer vindbaar is maar dezelfde
verouderde plugin-id in de pluginconfiguratie of installatierecords blijft staan, logt de Gateway bij het starten
waarschuwingen en slaat dat kanaal over in plaats van elk ander kanaal te blokkeren.
Voer `openclaw doctor --fix` uit om de verouderde kanaal-/pluginvermeldingen te verwijderen; onbekende
kanaalsleutels zonder bewijs van een verouderde plugin blijven validatie laten mislukken, zodat typefouten
zichtbaar blijven.
Als `plugins.enabled: false` is ingesteld, worden verouderde pluginverwijzingen als inert behandeld:
het starten van de Gateway slaat plugin discovery/load-werk over en `openclaw doctor` behoudt
de uitgeschakelde pluginconfiguratie in plaats van die automatisch te verwijderen. Schakel plugins opnieuw in voordat
je doctor cleanup uitvoert als je verouderde plugin-id's wilt verwijderen.

Installatie van plugin-afhankelijkheden gebeurt alleen tijdens expliciete installatie/update of
doctor-reparatiestromen. Het starten van de Gateway, configuratie herladen en runtime-inspectie voeren
geen package managers uit en repareren geen dependency trees. Lokale plugins moeten hun
afhankelijkheden al geïnstalleerd hebben, terwijl npm-, git- en ClawHub-plugins worden
geïnstalleerd onder OpenClaw's beheerde pluginroots. npm-afhankelijkheden kunnen worden gehesen
binnen OpenClaw's beheerde npm-root; install/update scant die beheerde root vóór
vertrouwen en uninstall verwijdert npm-beheerde pakketten via npm. Externe plugins
en aangepaste laadpaden moeten nog steeds via `openclaw plugins install` worden geïnstalleerd.
Zie [Resolutie van plugin-afhankelijkheden](/nl/plugins/dependency-resolution) voor de
install-time lifecycle.

Source checkouts zijn pnpm-workspaces. Als je OpenClaw kloont om aan meegeleverde
plugins te werken, voer dan `pnpm install` uit; OpenClaw laadt meegeleverde plugins dan vanuit
`extensions/<id>`, zodat wijzigingen en package-local afhankelijkheden rechtstreeks worden gebruikt.
Gewone npm-rootinstallaties zijn voor verpakte OpenClaw, niet voor ontwikkeling met
source checkout.

## Plugin-typen

OpenClaw herkent twee pluginformaten:

| Formaat    | Hoe het werkt                                                     | Voorbeelden                                            |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-module; voert in-process uit     | Officiële plugins, community npm-pakketten             |
| **Bundle** | Codex/Claude/Cursor-compatibele lay-out; gekoppeld aan OpenClaw-functies | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide verschijnen onder `openclaw plugins list`. Zie [Plugin Bundles](/nl/plugins/bundles) voor bundledetails.

Als je een native plugin schrijft, begin dan met [Plugins bouwen](/nl/plugins/building-plugins)
en het [Plugin SDK-overzicht](/nl/plugins/sdk-overview).

## Package entrypoints

Native plugin npm-pakketten moeten `openclaw.extensions` declareren in `package.json`.
Elke entry moet binnen de package-directory blijven en oplossen naar een leesbaar
runtimebestand, of naar een TypeScript-bronbestand met een afgeleide gebouwde JavaScript
peer zoals `src/index.ts` naar `dist/index.js`.

Gebruik `openclaw.runtimeExtensions` wanneer gepubliceerde runtimebestanden niet op dezelfde
paden staan als de source entries. Indien aanwezig moet `runtimeExtensions` precies
één entry bevatten voor elke `extensions` entry. Niet-overeenkomende lijsten laten installatie en
plugin discovery mislukken in plaats van stil terug te vallen op bronpaden. Als je ook
`openclaw.setupEntry` publiceert, gebruik dan `openclaw.runtimeSetupEntry` voor de gebouwde
JavaScript-peer; dat bestand is vereist wanneer het wordt gedeclareerd.

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

### OpenClaw-beheerde npm-pakketten tijdens migratie

ClawHub is het primaire distributiepad voor de meeste plugins. Huidige verpakte
OpenClaw-releases bundelen al veel officiële plugins, dus die hebben in normale setups
geen aparte npm-installaties nodig. Totdat elke OpenClaw-beheerde plugin naar
ClawHub is gemigreerd, levert OpenClaw nog steeds enkele `@openclaw/*` pluginpakketten op
npm voor oudere/aangepaste installaties en directe npm-workflows.

Als npm een `@openclaw/*` pluginpakket als deprecated rapporteert, komt die pakketversie
uit een oudere externe pakkettrein. Gebruik de meegeleverde plugin uit
de huidige OpenClaw of een lokale checkout totdat een nieuwer npm-pakket is gepubliceerd.

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
    - `memory-lancedb` — door LanceDB ondersteund langetermijngeheugen met auto-recall/capture (stel `plugins.slots.memory = "memory-lancedb"` in)

    Zie [Memory LanceDB](/nl/plugins/memory-lancedb) voor OpenAI-compatibele
    embeddingconfiguratie, Ollama-voorbeelden, recalllimieten en probleemoplossing.

  </Accordion>

  <Accordion title="Spraakproviders (standaard ingeschakeld)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Overig">
    - `browser` — meegeleverde browserplugin voor de browsertool, `openclaw browser` CLI, `browser.request` gateway method, browserruntime en standaard browsercontrolservice (standaard ingeschakeld; schakel uit voordat je deze vervangt)
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

| Veld             | Beschrijving                                               |
| ---------------- | ---------------------------------------------------------- |
| `enabled`        | Hoofdschakelaar (standaard: `true`)                        |
| `allow`          | Plugin-allowlist (optioneel)                               |
| `deny`           | Plugin-denylist (optioneel; deny wint)                     |
| `load.paths`     | Extra pluginbestanden/-directories                         |
| `slots`          | Exclusieve slotselectors (bijv. `memory`, `contextEngine`) |
| `entries.\<id\>` | Per-plugin schakelaars + configuratie                      |

`plugins.allow` is exclusief. Wanneer deze niet leeg is, kunnen alleen vermelde plugins laden
of tools beschikbaar maken, zelfs als `tools.allow` `"*"` of een specifieke plugin-eigen
toolnaam bevat. Als een tool-allowlist naar plugintools verwijst, voeg dan de eigenaar-plugin-id's
toe aan `plugins.allow` of verwijder `plugins.allow`; `openclaw doctor` waarschuwt voor deze
vorm.

Configuratiewijzigingen **vereisen een Gateway-herstart**. Als de Gateway draait met config
watch + in-process herstart ingeschakeld (het standaardpad `openclaw gateway`), wordt die
herstart meestal automatisch uitgevoerd kort nadat de configuratieschrijving is binnengekomen.
Er is geen ondersteund hot-reloadpad voor native plugin-runtimecode of lifecycle
hooks; herstart het Gateway-proces dat het live kanaal bedient voordat je verwacht dat bijgewerkte
`register(api)`-code, `api.on(...)` hooks, tools, services of
provider/runtime hooks worden uitgevoerd.

`openclaw plugins list` is een lokale momentopname van het Plugin-register/de configuratie. Een
`enabled` Plugin daar betekent dat het persistente register en de huidige configuratie de
Plugin toestaan deel te nemen. Het bewijst niet dat een al draaiend extern Gateway-
child opnieuw is gestart met dezelfde Plugin-code. In VPS-/containeropstellingen met
wrapperprocessen stuur je herstarts naar het daadwerkelijke `openclaw gateway run`-proces,
of gebruik je `openclaw gateway restart` tegen de draaiende Gateway.

<Accordion title="Plugin-statussen: uitgeschakeld vs ontbrekend vs ongeldig">
  - **Uitgeschakeld**: Plugin bestaat, maar inschakelregels hebben deze uitgezet. Configuratie blijft behouden.
  - **Ontbrekend**: configuratie verwijst naar een Plugin-id die discovery niet heeft gevonden.
  - **Ongeldig**: Plugin bestaat, maar de configuratie komt niet overeen met het opgegeven schema. Gateway-opstart slaat alleen die Plugin over; `openclaw doctor --fix` kan de ongeldige vermelding in quarantaine plaatsen door deze uit te schakelen en de configuratiepayload te verwijderen.

</Accordion>

## Discovery en prioriteit

OpenClaw scant in deze volgorde naar plugins (eerste match wint):

<Steps>
  <Step title="Configuratiepaden">
    `plugins.load.paths` — expliciete bestands- of directorypaden. Paden die
    terugwijzen naar OpenClaw's eigen meegeleverde verpakte Plugin-directories worden genegeerd;
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
gecompileerde `dist/extensions`-structuur. Als een meegeleverde Plugin-brondirectory wordt
gebindmount over het bijbehorende verpakte bronpad, bijvoorbeeld
`/app/extensions/synology-chat`, behandelt OpenClaw die gemounte brondirectory
als een meegeleverde bron-overlay en ontdekt deze vóór de verpakte
`/app/dist/extensions/synology-chat`-bundle. Dit houdt maintainer-containerloops
werkend zonder elke meegeleverde Plugin terug te schakelen naar TypeScript-broncode.
Stel `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` in om verpakte dist-bundles af te dwingen,
zelfs wanneer bron-overlaymounts aanwezig zijn.

### Inschakelregels

- `plugins.enabled: false` schakelt alle plugins uit en slaat Plugin-discovery/laadwerk over
- `plugins.deny` wint altijd van allow
- `plugins.entries.\<id\>.enabled: false` schakelt die Plugin uit
- Plugins uit de workspace zijn **standaard uitgeschakeld** (moeten expliciet worden ingeschakeld)
- Meegeleverde plugins volgen de ingebouwde standaard-aan-set tenzij overschreven
- Exclusieve slots kunnen de geselecteerde Plugin voor dat slot geforceerd inschakelen
- Sommige meegeleverde opt-in-plugins worden automatisch ingeschakeld wanneer de configuratie een
  Plugin-eigen oppervlak benoemt, zoals een providermodelreferentie, kanaalconfiguratie of harness-
  runtime
- Verouderde Plugin-configuratie blijft behouden zolang `plugins.enabled: false` actief is;
  schakel plugins opnieuw in voordat je doctor-opruiming uitvoert als je verouderde id's wilt verwijderen
- OpenAI-familie Codex-routes houden gescheiden Plugin-grenzen:
  `openai-codex/*` hoort bij de OpenAI-Plugin, terwijl de meegeleverde Codex
  app-server-Plugin wordt geselecteerd door `agentRuntime.id: "codex"` of legacy
  `codex/*`-modelreferenties

## Runtime-hooks oplossen

Als een Plugin verschijnt in `plugins list` maar `register(api)`-side-effects of hooks
niet draaien in live chatverkeer, controleer dan eerst dit:

- Voer `openclaw gateway status --deep --require-rpc` uit en bevestig dat de actieve
  Gateway-URL, het profiel, het configuratiepad en het proces degene zijn die je bewerkt.
- Herstart de live Gateway na wijzigingen aan Plugin-installatie/configuratie/code. In wrapper-
  containers is PID 1 mogelijk alleen een supervisor; herstart of signaleer het child-
  `openclaw gateway run`-proces.
- Gebruik `openclaw plugins inspect <id> --runtime --json` om hookregistraties en
  diagnostiek te bevestigen. Niet-meegeleverde conversation hooks zoals `llm_input`,
  `llm_output`, `before_agent_finalize` en `agent_end` hebben
  `plugins.entries.<id>.hooks.allowConversationAccess=true` nodig.
- Voor modelwisseling geef je de voorkeur aan `before_model_resolve`. Deze draait vóór model-
  resolutie voor agentbeurten; `llm_output` draait pas nadat een modelpoging
  assistentuitvoer produceert.
- Gebruik voor bewijs van het effectieve sessiemodel `openclaw sessions` of de
  Gateway-sessie-/statusoppervlakken en start, bij het debuggen van providerpayloads, de
  Gateway met `--raw-stream --raw-stream-path <path>`.

### Trage setup van Plugin-tools

Als agentbeurten lijken te blijven hangen tijdens het voorbereiden van tools, schakel trace-logging in en
controleer op timingregels van Plugin-toolfactories:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Zoek naar:

```text
[trace:plugin-tools] factory timings ...
```

De samenvatting toont de totale factorytijd en de traagste Plugin-toolfactories,
inclusief Plugin-id, opgegeven toolnamen, resultaatvorm en of de tool
optioneel is. Trage regels worden gepromoveerd tot waarschuwingen wanneer één factory
minstens 1s duurt of de totale voorbereiding van Plugin-toolfactories minstens 5s duurt.

Als één Plugin de timing domineert, inspecteer dan de runtime-registraties:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Werk die Plugin daarna bij, installeer deze opnieuw of schakel deze uit. Plugin-auteurs moeten
dure afhankelijkheidslaadacties verplaatsen naar het tool-uitvoeringspad in plaats van deze
in de toolfactory te doen.

### Dubbel kanaal- of tooleigenaarschap

Symptomen:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Dit betekent dat meer dan één ingeschakelde Plugin hetzelfde kanaal,
dezelfde setupflow of dezelfde toolnaam probeert te bezitten. De meest voorkomende oorzaak is een externe kanaal-Plugin
die is geïnstalleerd naast een meegeleverde Plugin die nu dezelfde kanaal-id levert.

Debugstappen:

- Voer `openclaw plugins list --enabled --verbose` uit om elke ingeschakelde Plugin
  en oorsprong te zien.
- Voer `openclaw plugins inspect <id> --runtime --json` uit voor elke verdachte Plugin en
  vergelijk `channels`, `channelConfigs`, `tools` en diagnostiek.
- Voer `openclaw plugins registry --refresh` uit na het installeren of verwijderen van
  Plugin-pakketten zodat persistente metadata de huidige installatie weerspiegelt.
- Herstart de Gateway na installatie-, register- of configuratiewijzigingen.

Oplossingsopties:

- Als één Plugin bewust een andere vervangt voor dezelfde kanaal-id, moet de
  voorkeurs-Plugin `channelConfigs.<channel-id>.preferOver` declareren met
  de Plugin-id met lagere prioriteit. Zie [/plugins/manifest#replacing-another-channel-plugin](/nl/plugins/manifest#replacing-another-channel-plugin).
- Als de duplicatie per ongeluk is, schakel dan één kant uit met
  `plugins.entries.<plugin-id>.enabled: false` of verwijder de verouderde Plugin-
  installatie.
- Als je beide plugins expliciet hebt ingeschakeld, behoudt OpenClaw dat verzoek en
  rapporteert het conflict. Kies één eigenaar voor het kanaal of hernoem Plugin-eigen
  tools zodat het runtime-oppervlak ondubbelzinnig is.

## Plugin-slots (exclusieve categorieën)

Sommige categorieën zijn exclusief (slechts één tegelijk actief):

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
| `memory`        | Active Memory-Plugin  | `memory-core`       |
| `contextEngine` | Actieve contextengine | `legacy` (ingebouwd) |

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

openclaw plugins install <package>         # install (ClawHub first, then npm)
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
Plugin). Andere meegeleverde plugins hebben nog steeds `openclaw plugins enable <id>` nodig.

`--force` overschrijft een bestaande geïnstalleerde Plugin of hook pack op zijn plek. Gebruik
`openclaw plugins update <id-or-npm-spec>` voor routine-upgrades van gevolgde npm-
plugins. Dit wordt niet ondersteund met `--link`, dat het bronpad hergebruikt in plaats
van over een beheerd installatiedoel te kopiëren.

Wanneer `plugins.allow` al is ingesteld, voegt `openclaw plugins install` de
geïnstalleerde Plugin-id toe aan die allowlist voordat deze wordt ingeschakeld. Als dezelfde Plugin-id
aanwezig is in `plugins.deny`, verwijdert install die verouderde deny-vermelding zodat de
expliciete installatie direct laadbaar is na een herstart.

OpenClaw bewaart een persistent lokaal Plugin-register als koud leesmodel voor
Plugin-inventaris, eigenaarschap van bijdragen en opstartplanning. Installatie-, update-,
uninstall-, enable- en disable-flows vernieuwen dat register nadat de Plugin-
status is gewijzigd. Hetzelfde `plugins/installs.json`-bestand bewaart duurzame installatiemetadata in
top-level `installRecords` en herbouwbare manifestmetadata in `plugins`. Als
het register ontbreekt, verouderd of ongeldig is, bouwt `openclaw plugins registry
--refresh` de manifestweergave opnieuw op uit install records, configuratiebeleid en
manifest-/pakketmetadata zonder Plugin-runtime-modules te laden.
`openclaw plugins update <id-or-npm-spec>` is van toepassing op gevolgde installaties. Het doorgeven
van een npm-pakketspecificatie met een dist-tag of exacte versie herleidt de pakketnaam
terug naar het gevolgde Plugin-record en registreert de nieuwe specificatie voor toekomstige updates.
Het doorgeven van de pakketnaam zonder versie verplaatst een exact vastgepinde installatie terug naar
de standaard releaselijn van het register. Als de geïnstalleerde npm-Plugin al overeenkomt met
de opgeloste versie en geregistreerde artefactidentiteit, slaat OpenClaw de update over
zonder te downloaden, opnieuw te installeren of configuratie te herschrijven.

`--pin` is alleen voor npm. Het wordt niet ondersteund met `--marketplace`, omdat
marketplace-installaties bronmetadata van de marketplace bewaren in plaats van een npm-specificatie.

`--dangerously-force-unsafe-install` is een noodoverride voor fout-positieven
van de ingebouwde scanner voor gevaarlijke code. Hiermee kunnen Plugin-installaties
en Plugin-updates doorgaan voorbij ingebouwde `critical`-bevindingen, maar het omzeilt nog steeds
geen Plugin-`before_install`-beleidsblokkades of blokkering bij scanfouten.
Installatiescans negeren veelvoorkomende testbestanden en -mappen zoals `tests/`,
`__tests__/`, `*.test.*` en `*.spec.*` om te voorkomen dat verpakte testmocks worden geblokkeerd;
gedeclareerde runtime-entrypoints van Plugins worden nog steeds gescand, zelfs als ze een van
die namen gebruiken.

Deze CLI-vlag geldt alleen voor Plugin-installatie- en updateflows. Door de Gateway ondersteunde
Skills-afhankelijkheidsinstallaties gebruiken in plaats daarvan de overeenkomende aanvraagoverride
`dangerouslyForceUnsafeInstall`, terwijl `openclaw skills install` de afzonderlijke ClawHub-flow
voor het downloaden/installeren van Skills blijft.

Als een Plugin die je op ClawHub hebt gepubliceerd door een scan verborgen of geblokkeerd is, open dan het
ClawHub-dashboard of voer `clawhub package rescan <name>` uit om ClawHub te vragen
deze opnieuw te controleren. `--dangerously-force-unsafe-install` beïnvloedt alleen installaties op je eigen
machine; het vraagt ClawHub niet om de Plugin opnieuw te scannen of een geblokkeerde release
openbaar te maken.

Compatibele bundels nemen deel aan dezelfde Plugin-lijst-/inspectie-/inschakel-/uitschakelflow.
Huidige runtime-ondersteuning omvat bundel-Skills, Claude-command-Skills,
Claude-standaardwaarden voor `settings.json`, standaardwaarden voor Claude `.lsp.json` en in het manifest gedeclareerde
`lspServers`, Cursor-command-Skills en compatibele Codex-hook
mappen.

`openclaw plugins inspect <id>` rapporteert ook gedetecteerde bundelmogelijkheden plus
ondersteunde of niet-ondersteunde MCP- en LSP-serveritems voor bundelondersteunde Plugins.

Marketplace-bronnen kunnen een Claude bekende-marketplace-naam zijn uit
`~/.claude/plugins/known_marketplaces.json`, een lokale marketplace-root of
`marketplace.json`-pad, een GitHub-afkorting zoals `owner/repo`, een GitHub-repo-
URL, of een git-URL. Voor externe marketplaces moeten Plugin-items binnen de
gekloonde marketplace-repo blijven en alleen relatieve padbronnen gebruiken.

Zie de [`openclaw plugins` CLI-referentie](/nl/cli/plugins) voor volledige details.

## Overzicht van de Plugin-API

Native Plugins exporteren een entry-object dat `register(api)` beschikbaar maakt. Oudere
Plugins kunnen nog steeds `activate(api)` gebruiken als legacy-alias, maar nieuwe Plugins moeten
`register` gebruiken.

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

OpenClaw laadt het entry-object en roept `register(api)` aan tijdens Plugin-
activatie. De loader valt nog steeds terug op `activate(api)` voor oudere Plugins,
maar gebundelde Plugins en nieuwe externe Plugins moeten `register` als het
publieke contract behandelen.

`api.registrationMode` vertelt een Plugin waarom de entry ervan wordt geladen:

| Modus           | Betekenis                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-activatie. Registreer tools, hooks, services, commando's, routes en andere live side effects.                            |
| `discovery`     | Alleen-lezen ontdekking van mogelijkheden. Registreer providers en metadata; vertrouwde Plugin-entrycode kan laden, maar sla live side effects over. |
| `setup-only`    | Laden van kanaalsetupmetadata via een lichte setup-entry.                                                                         |
| `setup-runtime` | Laden van kanaalsetup waarvoor ook de runtime-entry nodig is.                                                                     |
| `cli-metadata`  | Alleen verzamelen van CLI-commandmetadata.                                                                                        |

Plugin-entries die sockets, databases, achtergrondwerkers of langlevende
clients openen, moeten die side effects bewaken met `api.registrationMode === "full"`.
Discovery-loads worden apart gecachet van activerende loads en vervangen niet
het actieve Gateway-register. Discovery is niet-activerend, niet importvrij:
OpenClaw kan de vertrouwde Plugin-entry of kanaal-Plugin-module evalueren om
de snapshot te bouwen. Houd module-topniveaus licht en vrij van side effects, en verplaats
netwerkclients, subprocessen, listeners, credential-reads en service-opstart
achter volledige runtimepaden.

Veelvoorkomende registratiemethoden:

| Methode                                 | Wat deze registreert             |
| --------------------------------------- | -------------------------------- |
| `registerProvider`                      | Modelprovider (LLM)              |
| `registerChannel`                       | Chatkanaal                       |
| `registerTool`                          | Agenttool                        |
| `registerHook` / `on(...)`              | Lifecycle-hooks                  |
| `registerSpeechProvider`                | Tekst-naar-spraak / STT          |
| `registerRealtimeTranscriptionProvider` | Streaming STT                    |
| `registerRealtimeVoiceProvider`         | Duplex realtime spraak           |
| `registerMediaUnderstandingProvider`    | Afbeeldings-/audioanalyse        |
| `registerImageGenerationProvider`       | Afbeeldingsgeneratie             |
| `registerMusicGenerationProvider`       | Muziekgeneratie                  |
| `registerVideoGenerationProvider`       | Videogeneratie                   |
| `registerWebFetchProvider`              | Webfetch-/scrapeprovider         |
| `registerWebSearchProvider`             | Webzoekactie                     |
| `registerHttpRoute`                     | HTTP-endpoint                    |
| `registerCommand` / `registerCli`       | CLI-commando's                   |
| `registerContextEngine`                 | Contextengine                    |
| `registerService`                       | Achtergrondservice               |

Hook-guardgedrag voor getypte lifecycle-hooks:

- `before_tool_call`: `{ block: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `before_tool_call`: `{ block: false }` is een no-op en wist geen eerdere blokkade.
- `before_install`: `{ block: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `before_install`: `{ block: false }` is een no-op en wist geen eerdere blokkade.
- `message_sending`: `{ cancel: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `message_sending`: `{ cancel: false }` is een no-op en wist geen eerdere annulering.

Native Codex app-server runt bridge-Codex-native tool-events terug naar dit
hook-oppervlak. Plugins kunnen native Codex-tools blokkeren via `before_tool_call`,
resultaten observeren via `after_tool_call`, en deelnemen aan Codex-
`PermissionRequest`-goedkeuringen. De bridge herschrijft Codex-native tool-
argumenten nog niet. De exacte ondersteuningsgrens van de Codex-runtime staat in het
[Codex harness v1-ondersteuningscontract](/nl/plugins/codex-harness#v1-support-contract).

Zie [SDK-overzicht](/nl/plugins/sdk-overview#hook-decision-semantics) voor volledig getypt hookgedrag.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins) — maak je eigen Plugin
- [Plugin-bundels](/nl/plugins/bundles) — compatibiliteit met Codex/Claude/Cursor-bundels
- [Plugin-manifest](/nl/plugins/manifest) — manifestschema
- [Tools registreren](/nl/plugins/building-plugins#registering-agent-tools) — voeg agenttools toe in een Plugin
- [Plugin-internals](/nl/plugins/architecture) — capabilitymodel en laadpipeline
- [Community-Plugins](/nl/plugins/community) — vermeldingen van derden
