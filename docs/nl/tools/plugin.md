---
read_when:
    - Plugins installeren of configureren
    - Plugin-detectie en laadregels begrijpen
    - Werken met Codex/Claude-compatibele Plugin-bundels
sidebarTitle: Install and Configure
summary: Installeer, configureer en beheer OpenClaw-plugins
title: Plugins
x-i18n:
    generated_at: "2026-05-01T11:23:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1efa91ac4d78c6707a1e9e5cd5a5958642128a61b5873e169f66c7c2b954adb9
    source_path: tools/plugin.md
    workflow: 16
---

Plugins breiden OpenClaw uit met nieuwe mogelijkheden: kanalen, modelproviders,
agent-harnassen, tools, Skills, spraak, realtime transcriptie, realtime
stem, mediabegrip, afbeeldingsgeneratie, videogeneratie, web ophalen, web
zoeken en meer. Sommige plugins zijn **core** (meegeleverd met OpenClaw), andere
zijn **extern**. De meeste externe plugins worden gepubliceerd en ontdekt via
[ClawHub](/nl/tools/clawhub). Npm blijft ondersteund voor directe installaties en voor een
tijdelijke set pluginpakketten die eigendom zijn van OpenClaw terwijl die migratie wordt afgerond.

## Snel aan de slag

<Steps>
  <Step title="Bekijken wat is geladen">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Een plugin installeren">
    ```bash
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

  <Step title="De plugin verifiëren">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Gebruik `--runtime` wanneer je geregistreerde tools, services, gateway-
    methoden, hooks of CLI-opdrachten die eigendom zijn van de plugin moet aantonen. Gewone `inspect` is een koude
    manifest-/registry-controle en vermijdt bewust het importeren van de plugin-runtime.

  </Step>
</Steps>

Als je chat-native bediening verkiest, schakel `commands.plugins: true` in en gebruik:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Het installatiepad gebruikt dezelfde resolver als de CLI: lokaal pad/archief, expliciet
`clawhub:<pkg>`, expliciet `npm:<pkg>`, expliciet `git:<repo>`, of kale pakketspecificatie
(eerst ClawHub, daarna npm-fallback).

Als de configuratie ongeldig is, mislukt installatie normaal gesproken gesloten en verwijst deze je naar
`openclaw doctor --fix`. De enige hersteluitzondering is een smal pad voor het opnieuw installeren van meegeleverde plugins
voor plugins die zich aanmelden voor
`openclaw.install.allowInvalidConfigRecovery`.
Tijdens het opstarten van de Gateway wordt ongeldige configuratie voor één plugin geïsoleerd tot die plugin:
het opstarten logt het probleem met `plugins.entries.<id>.config`, slaat die plugin over tijdens
het laden, en houdt andere plugins en kanalen online. Voer `openclaw doctor --fix` uit
om de slechte pluginconfiguratie in quarantaine te plaatsen door die pluginvermelding uit te schakelen en
de ongeldige configuratiepayload ervan te verwijderen; de normale configuratieback-up bewaart de vorige waarden.
Wanneer een kanaalconfiguratie verwijst naar een plugin die niet langer vindbaar is maar dezelfde
verouderde plugin-id in de pluginconfiguratie of installatierecords blijft staan, logt het opstarten van de Gateway
waarschuwingen en slaat het dat kanaal over in plaats van elk ander kanaal te blokkeren.
Voer `openclaw doctor --fix` uit om de verouderde kanaal-/pluginvermeldingen te verwijderen; onbekende
kanaalsleutels zonder bewijs van een verouderde plugin blijven validatie laten mislukken zodat typefouten
zichtbaar blijven.
Als `plugins.enabled: false` is ingesteld, worden verouderde pluginverwijzingen als inert behandeld:
het opstarten van de Gateway slaat plugin-detectie-/laadwerk over en `openclaw doctor` bewaart
de uitgeschakelde pluginconfiguratie in plaats van deze automatisch te verwijderen. Schakel plugins opnieuw in voordat
je doctor-opschoning uitvoert als je verouderde plugin-id's wilt verwijderen.

Gepackagede OpenClaw-installaties installeren niet proactief de volledige
runtime-afhankelijkheidsboom van elke meegeleverde plugin. Wanneer een meegeleverde plugin die eigendom is van OpenClaw actief is vanuit
pluginconfiguratie, legacy kanaalconfiguratie of een standaard ingeschakeld manifest, herstelt het opstarten
alleen de gedeclareerde runtime-afhankelijkheden van die plugin voordat deze wordt geïmporteerd.
Persistente kanaal-authenticatiestatus alleen activeert geen meegeleverd kanaal voor
runtime-afhankelijkheidsherstel bij het opstarten van de Gateway.
Expliciet uitschakelen wint nog steeds: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false`, en `channels.<id>.enabled: false`
voorkomen automatisch herstel van meegeleverde runtime-afhankelijkheden voor die plugin/dat kanaal.
Een niet-lege `plugins.allow` begrenst ook standaard ingeschakeld herstel van meegeleverde runtime-afhankelijkheden;
expliciete inschakeling van meegeleverde kanalen (`channels.<id>.enabled: true`) kan
nog steeds de plugin-afhankelijkheden van dat kanaal herstellen.
Externe plugins en aangepaste laadpaden moeten nog steeds worden geïnstalleerd via
`openclaw plugins install`.
Zie [Plugin dependency resolution](/nl/plugins/dependency-resolution) voor de volledige
plannings- en staging-levenscyclus.

## Plugintypen

OpenClaw herkent twee pluginformaten:

| Formaat    | Hoe het werkt                                                     | Voorbeelden                                            |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-module; wordt in-process uitgevoerd | Officiële plugins, community-npm-pakketten             |
| **Bundle** | Codex/Claude/Cursor-compatibele lay-out; toegewezen aan OpenClaw-functies | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide verschijnen onder `openclaw plugins list`. Zie [Plugin Bundles](/nl/plugins/bundles) voor bundledetails.

Als je een native plugin schrijft, begin dan met [Building Plugins](/nl/plugins/building-plugins)
en het [Plugin SDK Overview](/nl/plugins/sdk-overview).

## Pakket-entrypoints

Native plugin-npm-pakketten moeten `openclaw.extensions` declareren in `package.json`.
Elke entry moet binnen de pakketdirectory blijven en resolven naar een leesbaar
runtimebestand, of naar een TypeScript-bronbestand met een afgeleide gebouwde JavaScript-
peer zoals `src/index.ts` naar `dist/index.js`.

Gebruik `openclaw.runtimeExtensions` wanneer gepubliceerde runtimebestanden zich niet op
dezelfde paden bevinden als de bronentries. Wanneer aanwezig, moet `runtimeExtensions`
exact één entry bevatten voor elke `extensions`-entry. Niet-overeenkomende lijsten laten installatie en
plugin-detectie mislukken in plaats van stilzwijgend terug te vallen op bronpaden.

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

### OpenClaw-npm-pakketten tijdens migratie

ClawHub is het primaire distributiepad voor de meeste plugins. Huidige gepackagede
OpenClaw-releases bundelen al veel officiële plugins, dus die hebben geen
afzonderlijke npm-installaties nodig in normale setups. Totdat elke plugin die eigendom is van OpenClaw
naar ClawHub is gemigreerd, levert OpenClaw nog steeds enkele `@openclaw/*`-pluginpakketten op
npm voor oudere/aangepaste installaties en directe npm-workflows.

Als npm een `@openclaw/*`-pluginpakket als deprecated rapporteert, komt die pakketversie
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
    - `memory-lancedb` — op aanvraag te installeren langetermijngeheugen met automatische recall/capture (stel `plugins.slots.memory = "memory-lancedb"` in)

    Zie [Memory LanceDB](/nl/plugins/memory-lancedb) voor OpenAI-compatibele
    embeddingconfiguratie, Ollama-voorbeelden, recall-limieten en probleemoplossing.

  </Accordion>

  <Accordion title="Spraakproviders (standaard ingeschakeld)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Overig">
    - `browser` — meegeleverde browserplugin voor de browsertool, `openclaw browser` CLI, `browser.request` gateway-methode, browser-runtime en standaard browserbesturingsservice (standaard ingeschakeld; schakel uit voordat je deze vervangt)
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
| `slots`          | Exclusieve slotselectoren (bijv. `memory`, `contextEngine`) |
| `entries.\<id\>` | Per-plugin schakelaars + configuratie                      |

`plugins.allow` is exclusief. Wanneer deze niet leeg is, kunnen alleen vermelde plugins laden
of tools beschikbaar stellen, zelfs als `tools.allow` `"*"` of een specifieke toolnaam
die eigendom is van een plugin bevat. Als een tool-allowlist naar plugintools verwijst, voeg dan de id's van de eigenaarsplugins
toe aan `plugins.allow` of verwijder `plugins.allow`; `openclaw doctor` waarschuwt voor deze
vorm.

Configuratiewijzigingen **vereisen een gateway-herstart**. Als de Gateway draait met config
watch + in-process herstart ingeschakeld (het standaard `openclaw gateway`-pad), wordt die
herstart meestal automatisch uitgevoerd kort nadat de configuratiewijziging is weggeschreven.
Er is geen ondersteund hot-reload-pad voor native plugin-runtimecode of lifecycle-
hooks; herstart het Gateway-proces dat het live kanaal bedient voordat je
verwacht dat bijgewerkte `register(api)`-code, `api.on(...)`-hooks, tools, services of
provider-/runtime-hooks worden uitgevoerd.

`openclaw plugins list` is een lokale momentopname van pluginregistry/configuratie. Een
`enabled`-plugin daar betekent dat de persistente registry en huidige configuratie de
plugin laten deelnemen. Het bewijst niet dat een al draaiende externe Gateway-
child opnieuw is gestart met dezelfde plugincode. Stuur in VPS-/container-setups met
wrapperprocessen herstarts naar het daadwerkelijke `openclaw gateway run`-proces,
of gebruik `openclaw gateway restart` tegen de draaiende Gateway.

<Accordion title="Plugin-statussen: uitgeschakeld vs ontbrekend vs ongeldig">
  - **Uitgeschakeld**: plugin bestaat, maar inschakelregels hebben deze uitgezet. Configuratie blijft behouden.
  - **Ontbrekend**: configuratie verwijst naar een plugin-id die discovery niet heeft gevonden.
  - **Ongeldig**: plugin bestaat, maar de configuratie komt niet overeen met het gedeclareerde schema. Gateway-opstart slaat alleen die plugin over; `openclaw doctor --fix` kan de ongeldige vermelding in quarantaine plaatsen door deze uit te schakelen en de configuratiepayload te verwijderen.

</Accordion>

## Discovery en voorrang

OpenClaw scant plugins in deze volgorde (eerste match wint):

<Steps>
  <Step title="Configuratiepaden">
    `plugins.load.paths` — expliciete bestands- of directorypaden. Paden die terugwijzen
    naar OpenClaw's eigen verpakte gebundelde plugin-directory's worden genegeerd;
    voer `openclaw doctor --fix` uit om die verouderde aliassen te verwijderen.
  </Step>

  <Step title="Workspace-plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` en `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globale plugins">
    `~/.openclaw/<plugin-root>/*.ts` en `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Gebundelde plugins">
    Meegeleverd met OpenClaw. Veel zijn standaard ingeschakeld (modelproviders, spraak).
    Andere vereisen expliciete inschakeling.
  </Step>
</Steps>

Verpakte installaties en Docker-images lossen gebundelde plugins normaal op vanuit de
gecompileerde `dist/extensions`-boom. Als een bron-directory van een gebundelde plugin
over het bijbehorende verpakte bronpad wordt bind-mounted, bijvoorbeeld
`/app/extensions/synology-chat`, behandelt OpenClaw die gemounte bron-directory
als een gebundelde bron-overlay en ontdekt deze voor de verpakte
`/app/dist/extensions/synology-chat`-bundel. Hierdoor blijven maintainer-containerloops
werken zonder elke gebundelde plugin terug te schakelen naar TypeScript-broncode.
Stel `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` in om verpakte dist-bundels af te dwingen,
zelfs wanneer bron-overlaymounts aanwezig zijn.

### Inschakelregels

- `plugins.enabled: false` schakelt alle plugins uit en slaat plugin-discovery/laadwerk over
- `plugins.deny` wint altijd van allow
- `plugins.entries.\<id\>.enabled: false` schakelt die plugin uit
- Plugins afkomstig uit de workspace zijn **standaard uitgeschakeld** (moeten expliciet worden ingeschakeld)
- Gebundelde plugins volgen de ingebouwde standaard-aan-set tenzij overschreven
- Exclusieve slots kunnen de geselecteerde plugin voor dat slot geforceerd inschakelen
- Sommige gebundelde opt-in-plugins worden automatisch ingeschakeld wanneer de configuratie een
  oppervlak noemt dat eigendom is van de plugin, zoals een provider-modelref, kanaalconfiguratie of harness-runtime
- Verouderde plugin-configuratie blijft behouden zolang `plugins.enabled: false` actief is;
  schakel plugins opnieuw in voordat je doctor-cleanup uitvoert als je verouderde id's wilt verwijderen
- OpenAI-familie Codex-routes houden aparte plugin-grenzen aan:
  `openai-codex/*` hoort bij de OpenAI-plugin, terwijl de gebundelde Codex
  app-server-plugin wordt geselecteerd door `agentRuntime.id: "codex"` of legacy
  `codex/*`-modelrefs

## Runtime hooks oplossen

Als een plugin verschijnt in `plugins list`, maar `register(api)`-bijwerkingen of hooks
niet worden uitgevoerd in live chatverkeer, controleer dan eerst dit:

- Voer `openclaw gateway status --deep --require-rpc` uit en bevestig dat de actieve
  Gateway-URL, het profiel, het configuratiepad en het proces degene zijn die je bewerkt.
- Herstart de live Gateway na wijzigingen aan plugin-installatie/configuratie/code. In wrapper-
  containers is PID 1 mogelijk alleen een supervisor; herstart het child-proces
  `openclaw gateway run` of stuur het een signaal.
- Gebruik `openclaw plugins inspect <id> --runtime --json` om hookregistraties en
  diagnostiek te bevestigen. Niet-gebundelde conversatiehooks zoals `llm_input`,
  `llm_output`, `before_agent_finalize` en `agent_end` hebben
  `plugins.entries.<id>.hooks.allowConversationAccess=true` nodig.
- Gebruik voor modelwisselingen bij voorkeur `before_model_resolve`. Deze wordt uitgevoerd vóór model-
  resolutie voor agentbeurten; `llm_output` wordt pas uitgevoerd nadat een modelpoging
  assistant-uitvoer produceert.
- Gebruik voor bewijs van het effectieve sessiemodel `openclaw sessions` of de
  Gateway-sessie/statusoppervlakken en start, bij het debuggen van providerpayloads, de
  Gateway met `--raw-stream --raw-stream-path <path>`.

### Dubbel kanaal- of tool-eigenaarschap

Symptomen:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Dit betekent dat meer dan één ingeschakelde plugin hetzelfde kanaal,
dezelfde setup-flow of dezelfde toolnaam probeert te bezitten. De meest voorkomende oorzaak is een externe kanaalplugin
die naast een gebundelde plugin is geïnstalleerd die nu dezelfde channel-id biedt.

Debugstappen:

- Voer `openclaw plugins list --enabled --verbose` uit om elke ingeschakelde plugin
  en herkomst te zien.
- Voer `openclaw plugins inspect <id> --runtime --json` uit voor elke verdachte plugin en
  vergelijk `channels`, `channelConfigs`, `tools` en diagnostiek.
- Voer `openclaw plugins registry --refresh` uit na het installeren of verwijderen van
  plugin-pakketten zodat persistente metadata de huidige installatie weerspiegelt.
- Herstart de Gateway na installatie-, registry- of configuratiewijzigingen.

Fixopties:

- Als één plugin bewust een andere vervangt voor dezelfde channel-id, moet de
  voorkeursplugin `channelConfigs.<channel-id>.preferOver` declareren met
  de plugin-id met lagere prioriteit. Zie [/plugins/manifest#replacing-another-channel-plugin](/nl/plugins/manifest#replacing-another-channel-plugin).
- Als het duplicaat per ongeluk is, schakel dan één kant uit met
  `plugins.entries.<plugin-id>.enabled: false` of verwijder de verouderde plugin-
  installatie.
- Als je beide plugins expliciet hebt ingeschakeld, behoudt OpenClaw dat verzoek en
  meldt het conflict. Kies één eigenaar voor het kanaal of hernoem tools die eigendom zijn van plugins
  zodat het runtime-oppervlak ondubbelzinnig is.

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
| `memory`        | Active memory-plugin  | `memory-core`       |
| `contextEngine` | Actieve contextengine | `legacy` (ingebouwd) |

## CLI-referentie

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
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

Gebundelde plugins worden met OpenClaw meegeleverd. Veel zijn standaard ingeschakeld (bijvoorbeeld
gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browser-
plugin). Andere gebundelde plugins hebben nog steeds `openclaw plugins enable <id>` nodig.

`--force` overschrijft een bestaande geïnstalleerde plugin of hook-pack ter plekke. Gebruik
`openclaw plugins update <id-or-npm-spec>` voor routinematige upgrades van gevolgde npm-
plugins. Dit wordt niet ondersteund met `--link`, dat het bronpad hergebruikt in plaats
van over een beheerd installatiedoel te kopiëren.

Wanneer `plugins.allow` al is ingesteld, voegt `openclaw plugins install` de
geïnstalleerde plugin-id toe aan die allowlist voordat deze wordt ingeschakeld. Als dezelfde plugin-id
aanwezig is in `plugins.deny`, verwijdert install die verouderde deny-vermelding zodat de
expliciete installatie direct laadbaar is na een herstart.

OpenClaw houdt een persistent lokaal plugin-register bij als het cold-readmodel voor
plugin-inventaris, eigenaarschap van bijdragen en opstartplanning. Installatie-, update-,
uninstall-, enable- en disable-flows verversen dat register nadat de plugin-
status is gewijzigd. Hetzelfde bestand `plugins/installs.json` bewaart duurzame installatiemetadata in
top-level `installRecords` en opnieuw opbouwbare manifestmetadata in `plugins`. Als
het register ontbreekt, verouderd of ongeldig is, bouwt `openclaw plugins registry
--refresh` de manifestweergave opnieuw op vanuit installatierecords, configuratiebeleid en
manifest-/pakketmetadata zonder plugin-runtime-modules te laden.
`openclaw plugins update <id-or-npm-spec>` is van toepassing op gevolgde installaties. Het doorgeven
van een npm-pakketspecificatie met een dist-tag of exacte versie lost de pakketnaam
terug op naar het gevolgde plugin-record en registreert de nieuwe specificatie voor toekomstige updates.
Het doorgeven van de pakketnaam zonder versie verplaatst een exact gepinde installatie terug naar
de standaard releaselijn van het register. Als de geïnstalleerde npm-plugin al overeenkomt met
de opgeloste versie en geregistreerde artifact-identiteit, slaat OpenClaw de update over
zonder te downloaden, opnieuw te installeren of configuratie te herschrijven.

`--pin` is alleen voor npm. Het wordt niet ondersteund met `--marketplace`, omdat
marketplace-installaties marketplace-bronmetadata bewaren in plaats van een npm-specificatie.

`--dangerously-force-unsafe-install` is een noodoverride voor false positives
van de ingebouwde dangerous-code-scanner. Hiermee kunnen plugin-installaties
en plugin-updates doorgaan voorbij ingebouwde `critical`-bevindingen, maar het omzeilt nog steeds geen
plugin-`before_install`-beleidsblokkades of blokkering door scanfouten.
Installatiescans negeren gangbare testbestanden en directory's zoals `tests/`,
`__tests__/`, `*.test.*` en `*.spec.*` om te voorkomen dat verpakte testmocks worden geblokkeerd;
gedeclareerde plugin-runtime-entrypoints worden nog steeds gescand, zelfs als ze een van
die namen gebruiken.

Deze CLI-vlag is alleen van toepassing op plugin-installatie/update-flows. Gateway-backed Skill-
dependency-installaties gebruiken in plaats daarvan de bijpassende `dangerouslyForceUnsafeInstall`-request-
override, terwijl `openclaw skills install` de afzonderlijke ClawHub-
skill-download/install-flow blijft.

Als een plugin die je op ClawHub hebt gepubliceerd verborgen is of door een scan wordt geblokkeerd, open dan het
ClawHub-dashboard of voer `clawhub package rescan <name>` uit om ClawHub te vragen
deze opnieuw te controleren. `--dangerously-force-unsafe-install` heeft alleen invloed op installaties op je eigen
machine; het vraagt ClawHub niet om de plugin opnieuw te scannen of een geblokkeerde release
publiek te maken.

Compatibele bundels nemen deel aan dezelfde plugin-lijst/inspecteren/inschakelen/uitschakelen-flow. De huidige runtime-ondersteuning omvat bundel-Skills, Claude command-Skills, Claude `settings.json`-standaarden, Claude `.lsp.json` en in het manifest gedeclareerde `lspServers`-standaarden, Cursor command-Skills en compatibele Codex hook-mappen.

`openclaw plugins inspect <id>` rapporteert ook gedetecteerde bundel-capabilities plus ondersteunde of niet-ondersteunde MCP- en LSP-serververmeldingen voor door bundels ondersteunde plugins.

Marketplace-bronnen kunnen een Claude bekende-marketplace-naam uit `~/.claude/plugins/known_marketplaces.json` zijn, een lokale marketplace-root of `marketplace.json`-pad, een GitHub-verkorting zoals `owner/repo`, een GitHub-repo-URL of een git-URL. Voor externe marketplaces moeten plugin-vermeldingen binnen de gekloonde marketplace-repo blijven en uitsluitend relatieve padbronnen gebruiken.

Zie de [`openclaw plugins` CLI-referentie](/nl/cli/plugins) voor volledige details.

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

OpenClaw laadt het entry-object en roept `register(api)` aan tijdens plugin-activering. De loader valt nog steeds terug op `activate(api)` voor oudere plugins, maar gebundelde plugins en nieuwe externe plugins moeten `register` als het publieke contract behandelen.

`api.registrationMode` vertelt een plugin waarom zijn entry wordt geladen:

| Modus           | Betekenis                                                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-activering. Registreer tools, hooks, services, commando's, routes en andere live side effects.                                   |
| `discovery`     | Alleen-lezen capability-detectie. Registreer providers en metadata; vertrouwde plugin-entry-code mag laden, maar sla live side effects over. |
| `setup-only`    | Laden van kanaalsetup-metadata via een lichtgewicht setup-entry.                                                                         |
| `setup-runtime` | Kanaalsetup laden waarvoor ook de runtime-entry nodig is.                                                                                |
| `cli-metadata`  | Alleen verzamelen van CLI-commandometadata.                                                                                              |

Plugin-entries die sockets, databases, achtergrondworkers of langlevende clients openen, moeten die side effects afschermen met `api.registrationMode === "full"`. Discovery-loads worden afzonderlijk gecachet van activeringsloads en vervangen het actieve Gateway-register niet. Discovery is niet-activerend, niet importvrij: OpenClaw kan de vertrouwde plugin-entry of kanaalpluginmodule evalueren om de snapshot te bouwen. Houd module-topniveaus lichtgewicht en vrij van side effects, en verplaats netwerkclients, subprocessen, listeners, credential-reads en service-startup achter full-runtime-paden.

Veelgebruikte registratiemethoden:

| Methode                                 | Wat deze registreert          |
| --------------------------------------- | ----------------------------- |
| `registerProvider`                      | Modelprovider (LLM)           |
| `registerChannel`                       | Chatkanaal                    |
| `registerTool`                          | Agent-tool                    |
| `registerHook` / `on(...)`              | Lifecycle-hooks               |
| `registerSpeechProvider`                | Tekst-naar-spraak / STT       |
| `registerRealtimeTranscriptionProvider` | Streaming-STT                 |
| `registerRealtimeVoiceProvider`         | Duplex realtime spraak        |
| `registerMediaUnderstandingProvider`    | Afbeeldings-/audioanalyse     |
| `registerImageGenerationProvider`       | Afbeeldingsgeneratie          |
| `registerMusicGenerationProvider`       | Muziekgeneratie               |
| `registerVideoGenerationProvider`       | Videogeneratie                |
| `registerWebFetchProvider`              | Web fetch-/scrapeprovider     |
| `registerWebSearchProvider`             | Webzoekopdracht               |
| `registerHttpRoute`                     | HTTP-eindpunt                 |
| `registerCommand` / `registerCli`       | CLI-commando's                |
| `registerContextEngine`                 | Context-engine                |
| `registerService`                       | Achtergrondservice            |

Hook-guard-gedrag voor getypte lifecycle-hooks:

- `before_tool_call`: `{ block: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `before_tool_call`: `{ block: false }` is een no-op en wist een eerdere block niet.
- `before_install`: `{ block: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `before_install`: `{ block: false }` is een no-op en wist een eerdere block niet.
- `message_sending`: `{ cancel: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `message_sending`: `{ cancel: false }` is een no-op en wist een eerdere cancel niet.

Native Codex app-server bridge voert Codex-native tool-events terug naar dit hook-oppervlak. Plugins kunnen native Codex-tools blokkeren via `before_tool_call`, resultaten observeren via `after_tool_call` en deelnemen aan Codex `PermissionRequest`-goedkeuringen. De bridge herschrijft Codex-native tool-argumenten nog niet. De exacte grens van Codex-runtime-ondersteuning staat in het [Codex harness v1-ondersteuningscontract](/nl/plugins/codex-harness#v1-support-contract).

Zie [SDK-overzicht](/nl/plugins/sdk-overview#hook-decision-semantics) voor volledig getypt hook-gedrag.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins) — maak je eigen plugin
- [Plugin-bundels](/nl/plugins/bundles) — compatibiliteit met Codex/Claude/Cursor-bundels
- [Plugin-manifest](/nl/plugins/manifest) — manifestschema
- [Tools registreren](/nl/plugins/building-plugins#registering-agent-tools) — voeg agent-tools toe in een plugin
- [Plugin-internals](/nl/plugins/architecture) — capability-model en laadpipeline
- [Community-plugins](/nl/plugins/community) — vermeldingen van derden
