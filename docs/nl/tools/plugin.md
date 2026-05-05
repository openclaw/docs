---
read_when:
    - Plugins installeren of configureren
    - Plugin-detectie en laadregels begrijpen
    - Werken met Codex/Claude-compatibele Plugin-bundels
sidebarTitle: Install and Configure
summary: OpenClaw-plugins installeren, configureren en beheren
title: Plugins
x-i18n:
    generated_at: "2026-05-05T01:51:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1de640f7766a6b312a2385075ae1abdb19f5c2afcb0e7063eba0d3edde697004
    source_path: tools/plugin.md
    workflow: 16
---

Plugins breiden OpenClaw uit met nieuwe mogelijkheden: kanalen, modelproviders,
agentruntimes, tools, skills, spraak, realtime transcriptie, realtime
spraak, mediabegrip, beeldgeneratie, videogeneratie, webfetch, web
zoeken, en meer. Sommige plugins zijn **core** (meegeleverd met OpenClaw), andere
zijn **extern**. De meeste externe plugins worden gepubliceerd en ontdekt via
[ClawHub](/nl/tools/clawhub). Npm blijft ondersteund voor directe installaties en voor een
tijdelijke set pluginpakketten die eigendom zijn van OpenClaw terwijl die migratie wordt afgerond.

## Snelstart

Zie voor voorbeelden voor kopiëren en plakken voor installeren, weergeven, verwijderen, bijwerken en publiceren
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

    Configureer vervolgens onder `plugins.entries.\<id\>.config` in je configuratiebestand.

  </Step>

  <Step title="Chat-native beheer">
    In een draaiende Gateway activeren alleen-voor-eigenaar `/plugins enable` en `/plugins disable`
    de Gateway-configuratieherlader. De Gateway herlaadt plugin-runtimesurfaces
    in het proces, en nieuwe agentbeurten bouwen hun toollijst opnieuw op vanuit het
    vernieuwde register. `/plugins install` wijzigt plugin-broncode, dus de
    Gateway vraagt om een herstart in plaats van te doen alsof het huidige proces
    al geïmporteerde modules veilig kan herladen.

  </Step>

  <Step title="Verifieer de plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Gebruik `--runtime` wanneer je geregistreerde tools, services, gateway-
    methoden, hooks of CLI-opdrachten die eigendom zijn van de plugin moet bewijzen. Gewone
    `inspect` is een koude manifest-/registercontrole en vermijdt bewust het importeren van de plugin-runtime.

  </Step>
</Steps>

Als je de voorkeur geeft aan chat-native beheer, schakel `commands.plugins: true` in en gebruik:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Het installatiepad gebruikt dezelfde resolver als de CLI: lokaal pad/archief, expliciet
`clawhub:<pkg>`, expliciet `npm:<pkg>`, expliciet `git:<repo>`, of kale pakketspecificatie
via npm.

Als de configuratie ongeldig is, faalt installeren normaal gesproken gesloten en verwijst het je naar
`openclaw doctor --fix`. De enige hersteluitzondering is een smal herinstallatiepad voor gebundelde plugins
voor plugins die zich aanmelden voor
`openclaw.install.allowInvalidConfigRecovery`.
Tijdens het opstarten van de Gateway faalt ongeldige pluginconfiguratie gesloten zoals elke andere ongeldige
configuratie. Voer `openclaw doctor --fix` uit om de slechte pluginconfiguratie in quarantaine te plaatsen door
die pluginvermelding uit te schakelen en de ongeldige configuratiepayload te verwijderen; de normale
configuratieback-up bewaart de vorige waarden.
Wanneer een kanaalconfiguratie verwijst naar een plugin die niet meer vindbaar is, maar dezelfde verouderde plugin-id
in de pluginconfiguratie of installatierecords blijft staan, logt het opstarten van de Gateway
waarschuwingen en slaat het dat kanaal over in plaats van elk ander kanaal te blokkeren.
Voer `openclaw doctor --fix` uit om de verouderde kanaal-/pluginvermeldingen te verwijderen; onbekende
kanaalsleutels zonder bewijs van verouderde plugins falen nog steeds bij validatie zodat typefouten
zichtbaar blijven.
Als `plugins.enabled: false` is ingesteld, worden verouderde pluginverwijzingen als inert behandeld:
het opstarten van de Gateway slaat pluginontdekking/-laadwerk over en `openclaw doctor` behoudt
de uitgeschakelde pluginconfiguratie in plaats van die automatisch te verwijderen. Schakel plugins opnieuw in voordat
je doctor-opruiming uitvoert als je verouderde plugin-id's wilt verwijderen.

Installatie van pluginafhankelijkheden gebeurt alleen tijdens expliciete installatie-/update- of
doctor-herstelstromen. Gateway-opstart, configuratieherlading en runtime-inspectie voeren geen
pakketbeheerders uit en repareren geen afhankelijkheidsbomen. Lokale plugins moeten hun
afhankelijkheden al geïnstalleerd hebben, terwijl npm-, git- en ClawHub-plugins worden
geïnstalleerd onder de beheerde pluginroots van OpenClaw. npm-afhankelijkheden kunnen worden gehoist
binnen de beheerde npm-root van OpenClaw; installatie/update scant die beheerde root vóór
vertrouwen en verwijderen verwijdert door npm beheerde pakketten via npm. Externe plugins
en aangepaste laadpaden moeten nog steeds worden geïnstalleerd via `openclaw plugins install`.
Gebruik `openclaw plugins list --json` om de statische `dependencyStatus` voor elke
zichtbare plugin te bekijken zonder runtimecode te importeren of afhankelijkheden te repareren.
Zie [Resolutie van pluginafhankelijkheden](/nl/plugins/dependency-resolution) voor de
levenscyclus tijdens installatie.

Voor npm-installaties worden veranderlijke selectors zoals `latest` of een dist-tag opgelost
vóór installatie en daarna vastgezet op de exacte geverifieerde versie in de beheerde
npm-root van OpenClaw. Nadat npm klaar is, verifieert OpenClaw dat de geïnstalleerde
`package-lock.json`-vermelding nog steeds overeenkomt met de opgeloste versie en integriteit. Als
npm andere pakketmetadata schrijft, faalt de installatie en wordt het beheerde pakket
teruggedraaid in plaats van een ander pluginartefact te accepteren.

Broncheckouts zijn pnpm-workspaces. Als je OpenClaw kloont om aan gebundelde
plugins te werken, voer dan `pnpm install` uit; OpenClaw laadt gebundelde plugins vervolgens vanuit
`extensions/<id>` zodat bewerkingen en pakketlokale afhankelijkheden direct worden gebruikt.
Gewone npm-rootinstallaties zijn voor verpakte OpenClaw, niet voor ontwikkeling vanuit broncheckouts.

## Plugintypen

OpenClaw herkent twee pluginindelingen:

| Indeling   | Hoe het werkt                                                    | Voorbeelden                                            |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtimemodule; voert in-process uit       | Officiële plugins, community-npm-pakketten             |
| **Bundle** | Codex/Claude/Cursor-compatibele lay-out; gekoppeld aan OpenClaw-functies | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide verschijnen onder `openclaw plugins list`. Zie [Pluginbundels](/nl/plugins/bundles) voor bundeldetails.

Als je een native plugin schrijft, begin dan met [Plugins bouwen](/nl/plugins/building-plugins)
en het [Overzicht van de Plugin SDK](/nl/plugins/sdk-overview).

## Pakket-entrypoints

Native plugin-npm-pakketten moeten `openclaw.extensions` declareren in `package.json`.
Elke vermelding moet binnen de pakketdirectory blijven en resolven naar een leesbaar
runtimebestand, of naar een TypeScript-bronbestand met een afgeleide gebouwde JavaScript-
peer zoals `src/index.ts` naar `dist/index.js`.
Verpakte installaties moeten die JavaScript-runtime-uitvoer meeleveren. De TypeScript-
bronfallback is voor broncheckouts en lokale ontwikkelpaden, niet voor
npm-pakketten die in de beheerde pluginroot van OpenClaw worden geïnstalleerd.

Gebruik `openclaw.runtimeExtensions` wanneer gepubliceerde runtimebestanden niet op dezelfde
paden staan als de bronvermeldingen. Wanneer aanwezig, moet `runtimeExtensions`
exact één vermelding bevatten voor elke `extensions`-vermelding. Niet-overeenkomende lijsten laten installatie en
pluginontdekking falen in plaats van stil terug te vallen op bronpaden. Als je ook
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

## Officiële plugins

### Npm-pakketten die eigendom zijn van OpenClaw tijdens de migratie

ClawHub is het primaire distributiepad voor de meeste plugins. Huidige verpakte
OpenClaw-releases bundelen al veel officiële plugins, dus die hebben in normale setups geen
afzonderlijke npm-installaties nodig. Totdat elke plugin die eigendom is van OpenClaw
naar ClawHub is gemigreerd, levert OpenClaw nog steeds enkele `@openclaw/*`-pluginpakketten op
npm voor oudere/aangepaste installaties en directe npm-workflows.

Als npm een `@openclaw/*`-pluginpakket als deprecated meldt, komt die pakketversie
uit een oudere externe pakketreeks. Gebruik de gebundelde plugin uit
de huidige OpenClaw of een lokale checkout totdat een nieuwer npm-pakket wordt gepubliceerd.

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

  <Accordion title="Memory-plugins">
    - `memory-core` — gebundelde Memory-zoekfunctie (standaard via `plugins.slots.memory`)
    - `memory-lancedb` — langetermijngeheugen ondersteund door LanceDB met automatisch ophalen/vastleggen (stel `plugins.slots.memory = "memory-lancedb"` in)

    Zie [Memory LanceDB](/nl/plugins/memory-lancedb) voor OpenAI-compatibele
    embeddingconfiguratie, Ollama-voorbeelden, ophaallimieten en probleemoplossing.

  </Accordion>

  <Accordion title="Spraakproviders (standaard ingeschakeld)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Overig">
    - `browser` — gebundelde browserplugin voor de browsertool, `openclaw browser` CLI, `browser.request` gateway-methode, browserruntime en standaardservice voor browserbesturing (standaard ingeschakeld; schakel uit voordat je deze vervangt)
    - `copilot-proxy` — VS Code Copilot Proxy-brug (standaard uitgeschakeld)

  </Accordion>
</AccordionGroup>

Op zoek naar plugins van derden? Zie [Communityplugins](/nl/plugins/community).

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

| Veld              | Beschrijving                                               |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Hoofdschakelaar (standaard: `true`)                           |
| `allow`            | Plugin-toelatingslijst (optioneel)                               |
| `bundledDiscovery` | Detectiemodus voor gebundelde plugins (standaard `allowlist`)    |
| `deny`             | Plugin-weigerlijst (optioneel; weigeren wint)                     |
| `load.paths`       | Extra Plugin-bestanden/-mappen                            |
| `slots`            | Exclusieve slotselectoren (bijv. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Schakelaars + configuratie per Plugin                               |

`plugins.allow` is exclusief. Wanneer deze niet leeg is, kunnen alleen vermelde plugins laden
of tools beschikbaar stellen, zelfs als `tools.allow` `"*"` of een specifieke toolnaam
van een Plugin bevat. Als een tool-toelatingslijst verwijst naar Plugin-tools, voeg dan de eigen Plugin-id's
toe aan `plugins.allow` of verwijder `plugins.allow`; `openclaw doctor` waarschuwt over deze
vorm.

`plugins.bundledDiscovery` staat voor nieuwe configuraties standaard op `"allowlist"`, zodat een
beperkende inventaris in `plugins.allow` ook weggelaten gebundelde provider-plugins blokkeert,
inclusief runtime-detectie van webzoekprovider-plugins. Doctor markeert oudere
beperkende allowlist-configuraties tijdens migratie met `"compat"`, zodat upgrades het
oude gedrag van gebundelde providers behouden totdat de operator kiest voor de strengere modus.
Een lege `plugins.allow` wordt nog steeds behandeld als niet ingesteld/open.

Configuratiewijzigingen die via `/plugins enable` of `/plugins disable` worden gedaan, activeren een
in-process herlaadactie van Gateway-plugins. Nieuwe agentbeurten bouwen hun toollijst opnieuw op uit
het vernieuwde Plugin-register. Bewerkingen die de bron wijzigen, zoals installeren,
bijwerken en verwijderen, herstarten nog steeds het Gateway-proces omdat reeds geïmporteerde
Plugin-modules niet veilig ter plekke kunnen worden vervangen.

`openclaw plugins list` is een lokale momentopname van Plugin-register/configuratie. Een
`enabled` Plugin daar betekent dat het opgeslagen register en de huidige configuratie toestaan dat de
Plugin deelneemt. Het bewijst niet dat een al draaiende externe Gateway
opnieuw is geladen of herstart met dezelfde Plugin-code. Bij VPS-/containeropstellingen
met wrapperprocessen moet je herstarts of schrijfbewerkingen die herladen activeren naar het daadwerkelijke
`openclaw gateway run`-proces sturen, of `openclaw gateway restart` gebruiken tegen de
draaiende Gateway wanneer de herlaadactie een fout meldt.

<Accordion title="Plugin-statussen: uitgeschakeld versus ontbrekend versus ongeldig">
  - **Uitgeschakeld**: Plugin bestaat, maar inschakelregels hebben deze uitgezet. Configuratie blijft behouden.
  - **Ontbrekend**: configuratie verwijst naar een Plugin-id die door detectie niet is gevonden.
  - **Ongeldig**: Plugin bestaat, maar de configuratie ervan komt niet overeen met het gedeclareerde schema. Gateway-start slaat alleen die Plugin over; `openclaw doctor --fix` kan de ongeldige vermelding in quarantaine plaatsen door deze uit te schakelen en de configuratiepayload te verwijderen.

</Accordion>

## Detectie en prioriteit

OpenClaw scant in deze volgorde naar plugins (eerste overeenkomst wint):

<Steps>
  <Step title="Configuratiepaden">
    `plugins.load.paths` — expliciete bestands- of mappaden. Paden die terugwijzen
    naar OpenClaw's eigen verpakte gebundelde Plugin-mappen worden genegeerd;
    voer `openclaw doctor --fix` uit om die verouderde aliassen te verwijderen.
  </Step>

  <Step title="Werkruimte-plugins">
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

Verpakte installaties en Docker-images lossen gebundelde plugins normaal gesproken op vanuit de
gecompileerde `dist/extensions`-boom. Als een bronmap van een gebundelde Plugin
over het overeenkomende verpakte bronpad wordt bind-mounted, bijvoorbeeld
`/app/extensions/synology-chat`, behandelt OpenClaw die gemounte bronmap
als een gebundelde bronoverlay en detecteert deze vóór de verpakte
`/app/dist/extensions/synology-chat`-bundel. Zo blijven maintainer-containerloops
werken zonder elke gebundelde Plugin terug te schakelen naar TypeScript-broncode.
Stel `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` in om verpakte dist-bundels
af te dwingen, zelfs wanneer bronoverlay-mounts aanwezig zijn.

### Inschakelregels

- `plugins.enabled: false` schakelt alle plugins uit en slaat Plugin-detectie/-laadwerk over
- `plugins.deny` wint altijd van allow
- `plugins.entries.\<id\>.enabled: false` schakelt die Plugin uit
- Plugins uit de werkruimte zijn **standaard uitgeschakeld** (moeten expliciet worden ingeschakeld)
- Gebundelde plugins volgen de ingebouwde standaard-aan-set, tenzij overschreven
- Exclusieve slots kunnen de geselecteerde Plugin voor dat slot geforceerd inschakelen
- Sommige gebundelde opt-in-plugins worden automatisch ingeschakeld wanneer de configuratie een
  Plugin-eigen oppervlak noemt, zoals een provider-modelverwijzing, kanaalconfiguratie of harness-
  runtime
- Verouderde Plugin-configuratie blijft behouden terwijl `plugins.enabled: false` actief is;
  schakel plugins opnieuw in voordat je doctor-opruiming uitvoert als je verouderde id's wilt verwijderen
- OpenAI-familie Codex-routes houden afzonderlijke Plugin-grenzen:
  `openai-codex/*` hoort bij de OpenAI-Plugin, terwijl de gebundelde Codex
  appserver-Plugin wordt geselecteerd door `agentRuntime.id: "codex"` of oude
  `codex/*`-modelverwijzingen

## Runtime-hooks oplossen

Als een Plugin verschijnt in `plugins list`, maar `register(api)`-neveneffecten of hooks
niet worden uitgevoerd in live chatverkeer, controleer dan eerst het volgende:

- Voer `openclaw gateway status --deep --require-rpc` uit en bevestig dat de actieve
  Gateway-URL, het profiel, het configuratiepad en het proces degene zijn die je bewerkt.
- Herstart de live Gateway na wijzigingen aan Plugin-installatie/configuratie/code. In wrapper-
  containers is PID 1 mogelijk alleen een supervisor; herstart of signaleer het child-
  `openclaw gateway run`-proces.
- Gebruik `openclaw plugins inspect <id> --runtime --json` om hookregistraties en
  diagnostiek te bevestigen. Niet-gebundelde conversatiehooks zoals `llm_input`,
  `llm_output`, `before_agent_finalize` en `agent_end` vereisen
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Geef voor modelwisseling de voorkeur aan `before_model_resolve`. Deze draait vóór model-
  resolving voor agentbeurten; `llm_output` draait pas nadat een modelpoging
  assistantuitvoer produceert.
- Gebruik voor bewijs van het effectieve sessiemodel `openclaw sessions` of de
  Gateway-sessie-/statusoppervlakken en start bij het debuggen van providerpayloads
  de Gateway met `--raw-stream --raw-stream-path <path>`.

### Trage setup van Plugin-tools

Als agentbeurten lijken te blokkeren tijdens het voorbereiden van tools, schakel trace-logging in en
controleer op timingregels voor Plugin-tool-factories:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Zoek naar:

```text
[trace:plugin-tools] factory timings ...
```

De samenvatting vermeldt de totale factorytijd en de traagste Plugin-tool-factories,
inclusief Plugin-id, gedeclareerde toolnamen, resultaatvorm en of de tool
optioneel is. Trage regels worden gepromoveerd tot waarschuwingen wanneer één factory
minstens 1 seconde duurt of de totale voorbereiding van Plugin-tool-factories minstens 5 seconden duurt.

OpenClaw cachet succesvolle resultaten van Plugin-tool-factories voor herhaalde resoluties
met dezelfde effectieve aanvraagcontext. De cachesleutel bevat de effectieve
runtimeconfiguratie, werkruimte, agent-/sessie-id's, sandboxbeleid, browserinstellingen,
leveringscontext, aanvrageridentiteit en eigendomsstatus, zodat factories die
afhankelijk zijn van die vertrouwde velden opnieuw worden uitgevoerd wanneer de context verandert.

Als één Plugin de timing domineert, inspecteer dan de runtime-registraties:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Werk die Plugin daarna bij, installeer deze opnieuw of schakel deze uit. Plugin-auteurs moeten
kostbare afhankelijkheidslading verplaatsen naar het tool-uitvoeringspad in plaats van dit
binnen de tool-factory te doen.

### Dubbele kanaal- of tool-eigendom

Symptomen:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Dit betekent dat meer dan één ingeschakelde Plugin probeert eigenaar te zijn van hetzelfde kanaal,
dezelfde setup-flow of dezelfde toolnaam. De meest voorkomende oorzaak is een externe kanaal-Plugin
die naast een gebundelde Plugin is geïnstalleerd die nu dezelfde kanaal-id aanbiedt.

Debugstappen:

- Voer `openclaw plugins list --enabled --verbose` uit om elke ingeschakelde Plugin
  en oorsprong te zien.
- Voer `openclaw plugins inspect <id> --runtime --json` uit voor elke vermoedelijke Plugin en
  vergelijk `channels`, `channelConfigs`, `tools` en diagnostiek.
- Voer `openclaw plugins registry --refresh` uit na het installeren of verwijderen van
  Plugin-pakketten, zodat opgeslagen metadata de huidige installatie weerspiegelt.
- Herstart de Gateway na wijzigingen aan installatie, register of configuratie.

Oplossingsopties:

- Als één Plugin bewust een andere voor dezelfde kanaal-id vervangt, moet de
  voorkeurs-Plugin `channelConfigs.<channel-id>.preferOver` declareren met
  de Plugin-id met lagere prioriteit. Zie [/plugins/manifest#replacing-another-channel-plugin](/nl/plugins/manifest#replacing-another-channel-plugin).
- Als het duplicaat per ongeluk is, schakel dan één kant uit met
  `plugins.entries.<plugin-id>.enabled: false` of verwijder de verouderde Plugin-
  installatie.
- Als je beide plugins expliciet hebt ingeschakeld, behoudt OpenClaw dat verzoek en
  meldt het conflict. Kies één eigenaar voor het kanaal of hernoem Plugin-eigen
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

| Slot            | Wat het beheert      | Standaard             |
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

Gebundelde plugins worden met OpenClaw meegeleverd. Veel zijn standaard ingeschakeld (bijvoorbeeld gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browserplugin). Andere gebundelde plugins hebben nog steeds `openclaw plugins enable <id>` nodig.

`--force` overschrijft een bestaande geinstalleerde plugin of hookpack ter plekke. Gebruik `openclaw plugins update <id-or-npm-spec>` voor routinematige upgrades van gevolgde npm-plugins. Dit wordt niet ondersteund met `--link`, dat het bronpad hergebruikt in plaats van over een beheerd installatiedoel te kopieren.

Wanneer `plugins.allow` al is ingesteld, voegt `openclaw plugins install` de geinstalleerde plugin-id aan die allowlist toe voordat de plugin wordt ingeschakeld. Als dezelfde plugin-id aanwezig is in `plugins.deny`, verwijdert installatie die verouderde deny-vermelding zodat de expliciete installatie direct na herstarten geladen kan worden.

OpenClaw bewaart een persistent lokaal pluginregister als het koude leesmodel voor plugininventaris, eigendom van bijdragen en opstartplanning. Installatie-, update-, verwijder-, inschakel- en uitschakelstromen vernieuwen dat register nadat ze de pluginstatus hebben gewijzigd. Hetzelfde bestand `plugins/installs.json` bewaart duurzame installatiemetadata in `installRecords` op topniveau en opnieuw opbouwbare manifestmetadata in `plugins`. Als het register ontbreekt, verouderd of ongeldig is, bouwt `openclaw plugins registry --refresh` de manifestweergave opnieuw op vanuit installatierecords, configuratiebeleid en manifest-/pakketmetadata zonder pluginruntimemodules te laden. `openclaw plugins update <id-or-npm-spec>` is van toepassing op gevolgde installaties. Als een npm-pakketspecificatie met een dist-tag of exacte versie wordt doorgegeven, wordt de pakketnaam terug naar het gevolgde pluginrecord herleid en wordt de nieuwe specificatie voor toekomstige updates vastgelegd. Als de pakketnaam zonder versie wordt doorgegeven, wordt een exact vastgezette installatie teruggezet naar de standaardreleaselijn van het register. Als de geinstalleerde npm-plugin al overeenkomt met de herleide versie en vastgelegde artefactidentiteit, slaat OpenClaw de update over zonder te downloaden, opnieuw te installeren of configuratie te herschrijven. Wanneer `openclaw update` op het betakanaal draait, proberen pluginrecords op de standaardlijn voor npm en ClawHub eerst `@beta` en vallen ze terug op standaard/latest wanneer er geen betarelease van de plugin bestaat. Exacte versies en expliciete tags blijven vastgezet.

`--pin` is alleen voor npm. Het wordt niet ondersteund met `--marketplace`, omdat marketplace-installaties bronmetadata van de marketplace bewaren in plaats van een npm-specificatie.

`--dangerously-force-unsafe-install` is een noodoverride voor fout-positieven van de ingebouwde scanner voor gevaarlijke code. Hiermee kunnen plugininstallaties en pluginupdates doorgaan voorbij ingebouwde `critical`-bevindingen, maar het omzeilt nog steeds geen pluginbeleidsblokkades van `before_install` of blokkering door scanfouten. Installatiescans negeren algemene testbestanden en mappen zoals `tests/`, `__tests__/`, `*.test.*` en `*.spec.*` om te voorkomen dat verpakte testmocks worden geblokkeerd; gedeclareerde pluginruntime-entrypoints worden nog steeds gescand, zelfs als ze een van die namen gebruiken.

Deze CLI-vlag geldt alleen voor plugininstallatie- en updateflows. Gateway-gesteunde Skills-afhankelijkheidsinstallaties gebruiken in plaats daarvan de overeenkomende aanvraagoverride `dangerouslyForceUnsafeInstall`, terwijl `openclaw skills install` de afzonderlijke download-/installatieflow voor ClawHub-Skills blijft.

Als een plugin die je op ClawHub hebt gepubliceerd verborgen is of door een scan wordt geblokkeerd, open dan het ClawHub-dashboard of voer `clawhub package rescan <name>` uit om ClawHub te vragen de plugin opnieuw te controleren. `--dangerously-force-unsafe-install` beinvloedt alleen installaties op je eigen machine; het vraagt ClawHub niet de plugin opnieuw te scannen of een geblokkeerde release openbaar te maken.

Compatibele bundels nemen deel aan dezelfde lijst-/inspectie-/inschakel-/uitschakelflow voor plugins. De huidige runtimeondersteuning omvat bundel-Skills, Claude-command-Skills, standaardwaarden voor Claude `settings.json`, standaardwaarden voor Claude `.lsp.json` en in het manifest gedeclareerde `lspServers`, Cursor-command-Skills en compatibele Codex-hookmappen.

`openclaw plugins inspect <id>` rapporteert ook gedetecteerde bundelmogelijkheden plus ondersteunde of niet-ondersteunde MCP- en LSP-serververmeldingen voor bundelgesteunde plugins.

Marketplace-bronnen kunnen een Claude-naam voor een bekende marketplace zijn uit `~/.claude/plugins/known_marketplaces.json`, een lokale marketplace-root of `marketplace.json`-pad, een GitHub-afkorting zoals `owner/repo`, een GitHub-repo-URL of een git-URL. Voor externe marketplaces moeten pluginvermeldingen binnen de gekloonde marketplace-repo blijven en alleen relatieve padbronnen gebruiken.

Zie de [`openclaw plugins` CLI-referentie](/nl/cli/plugins) voor volledige details.

## Overzicht van Plugin-API

Native plugins exporteren een entry-object dat `register(api)` blootstelt. Oudere plugins kunnen nog steeds `activate(api)` als legacy-alias gebruiken, maar nieuwe plugins zouden `register` moeten gebruiken.

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

OpenClaw laadt het entry-object en roept `register(api)` aan tijdens pluginactivatie. De loader valt voor oudere plugins nog steeds terug op `activate(api)`, maar gebundelde plugins en nieuwe externe plugins moeten `register` als het publieke contract beschouwen.

`api.registrationMode` vertelt een plugin waarom zijn entry wordt geladen:

| Modus           | Betekenis                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtimeactivatie. Registreer tools, hooks, services, commando's, routes en andere live side effects.                            |
| `discovery`     | Alleen-lezen-mogelijkheidsdetectie. Registreer providers en metadata; vertrouwde plugin-entrycode kan laden, maar sla live side effects over. |
| `setup-only`    | Laden van kanaalsetupmetadata via een lichtgewicht setup-entry.                                                                 |
| `setup-runtime` | Laden van kanaalsetup waarvoor ook de runtime-entry nodig is.                                                                   |
| `cli-metadata`  | Alleen verzamelen van metadata voor CLI-commando's.                                                                             |

Pluginentries die sockets, databases, achtergrondworkers of langlevende clients openen, moeten die side effects afschermen met `api.registrationMode === "full"`. Discovery-loads worden apart van activeringsloads gecachet en vervangen het draaiende Gateway-register niet. Discovery is niet-activerend, niet importvrij: OpenClaw kan de vertrouwde plugin-entry of kanaalpluginmodule evalueren om de momentopname te bouwen. Houd module-topniveaus licht en vrij van side effects, en verplaats netwerkclients, subprocessen, listeners, credential-reads en servicestart achter full-runtime-paden.

Algemene registratiemethoden:

| Methode                                 | Wat deze registreert          |
| --------------------------------------- | ----------------------------- |
| `registerProvider`                      | Modelprovider (LLM)           |
| `registerChannel`                       | Chatkanaal                    |
| `registerTool`                          | Agenttool                     |
| `registerHook` / `on(...)`              | Lifecycle-hooks               |
| `registerSpeechProvider`                | Tekst-naar-spraak / STT       |
| `registerRealtimeTranscriptionProvider` | Streaming-STT                 |
| `registerRealtimeVoiceProvider`         | Duplex realtime spraak        |
| `registerMediaUnderstandingProvider`    | Beeld-/audioanalyse           |
| `registerImageGenerationProvider`       | Beeldgeneratie                |
| `registerMusicGenerationProvider`       | Muziekgeneratie               |
| `registerVideoGenerationProvider`       | Videogeneratie                |
| `registerWebFetchProvider`              | Webfetch-/scrapeprovider      |
| `registerWebSearchProvider`             | Webzoekfunctie                |
| `registerHttpRoute`                     | HTTP-eindpunt                 |
| `registerCommand` / `registerCli`       | CLI-commando's                |
| `registerContextEngine`                 | Contextengine                 |
| `registerService`                       | Achtergrondservice            |

Hookguard-gedrag voor getypeerde lifecycle-hooks:

- `before_tool_call`: `{ block: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `before_tool_call`: `{ block: false }` is een no-op en wist een eerdere blokkade niet.
- `before_install`: `{ block: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `before_install`: `{ block: false }` is een no-op en wist een eerdere blokkade niet.
- `message_sending`: `{ cancel: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `message_sending`: `{ cancel: false }` is een no-op en wist een eerdere annulering niet.

Native Codex-app-server voert bridge-Codex-native tool-events terug naar dit hookoppervlak. Plugins kunnen native Codex-tools blokkeren via `before_tool_call`, resultaten observeren via `after_tool_call` en deelnemen aan Codex-`PermissionRequest`-goedkeuringen. De bridge herschrijft Codex-native toolargumenten nog niet. De exacte ondersteuningsgrens van de Codex-runtime staat in het [Codex harness v1-ondersteuningscontract](/nl/plugins/codex-harness#v1-support-contract).

Zie voor volledig getypeerd hookgedrag het [SDK-overzicht](/nl/plugins/sdk-overview#hook-decision-semantics).

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins) — maak je eigen plugin
- [Plugin-bundels](/nl/plugins/bundles) — compatibiliteit met Codex/Claude/Cursor-bundels
- [Plugin-manifest](/nl/plugins/manifest) — manifestschema
- [Tools registreren](/nl/plugins/building-plugins#registering-agent-tools) — voeg agenttools toe in een plugin
- [Interne Plugin-werking](/nl/plugins/architecture) — capaciteitsmodel en laadpipeline
- [Communityplugins](/nl/plugins/community) — vermeldingen van derden
