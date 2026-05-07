---
read_when:
    - Plugins installeren of configureren
    - Plugin-detectie en laadregels begrijpen
    - Werken met Codex/Claude-compatibele Plugin-bundels
sidebarTitle: Install and Configure
summary: OpenClaw-plugins installeren, configureren en beheren
title: Plugins
x-i18n:
    generated_at: "2026-05-07T13:27:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

Plugins breiden OpenClaw uit met nieuwe mogelijkheden: kanalen, modelproviders,
agent-harnassen, tools, Skills, spraak, realtime transcriptie, realtime
spraak, mediabegrip, beeldgeneratie, videogeneratie, web-fetch, web
search, en meer. Sommige plugins zijn **core** (meegeleverd met OpenClaw), andere
zijn **extern**. De meeste externe plugins worden gepubliceerd en gevonden via
[ClawHub](/nl/tools/clawhub). Npm blijft ondersteund voor directe installaties en voor een
tijdelijke set plugin-pakketten die eigendom zijn van OpenClaw terwijl die migratie wordt afgerond.

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
    In een draaiende Gateway activeren `/plugins enable` en `/plugins disable`, alleen voor eigenaren,
    de Gateway-configuratieherlader. De Gateway herlaadt plugin-runtime
    oppervlakken in het proces, en nieuwe agentbeurten bouwen hun toollijst opnieuw op vanuit het
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

    Gebruik `--runtime` wanneer je geregistreerde tools, services, gateway
    methoden, hooks, of CLI-opdrachten van de plugin moet bewijzen. Gewone `inspect` is een koude
    manifest-/registercontrole en vermijdt bewust het importeren van plugin-runtime.

  </Step>
</Steps>

Als je de voorkeur geeft aan chat-native bediening, schakel `commands.plugins: true` in en gebruik:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Het installatiepad gebruikt dezelfde resolver als de CLI: lokaal pad/archief, expliciet
`clawhub:<pkg>`, expliciet `npm:<pkg>`, expliciet `npm-pack:<path.tgz>`,
expliciet `git:<repo>`, of een kale pakketspecificatie via npm.

Als de configuratie ongeldig is, faalt installatie normaal gesloten en verwijst die je naar
`openclaw doctor --fix`. De enige hersteluitzondering is een smal herinstallatiepad voor meegeleverde plugins
voor plugins die kiezen voor
`openclaw.install.allowInvalidConfigRecovery`.
Tijdens het starten van de Gateway faalt ongeldige plugin-configuratie gesloten zoals elke andere ongeldige
configuratie. Voer `openclaw doctor --fix` uit om de slechte plugin-configuratie in quarantaine te plaatsen door
die plugin-invoer uit te schakelen en de ongeldige configuratiepayload te verwijderen; de normale
configuratieback-up bewaart de vorige waarden.
Wanneer een kanaalconfiguratie verwijst naar een plugin die niet meer vindbaar is maar dezelfde
verouderde plugin-id in plugin-configuratie of installatierecords blijft staan, logt het starten van de Gateway
waarschuwingen en slaat dat kanaal over in plaats van elk ander kanaal te blokkeren.
Voer `openclaw doctor --fix` uit om de verouderde kanaal-/plugin-invoeren te verwijderen; onbekende
kanaalsleutels zonder bewijs van een verouderde plugin blijven validatie laten falen zodat typefouten
zichtbaar blijven.
Als `plugins.enabled: false` is ingesteld, worden verouderde plugin-verwijzingen als inert behandeld:
het starten van de Gateway slaat plugin-detectie/laadwerk over en `openclaw doctor` behoudt
de uitgeschakelde plugin-configuratie in plaats van die automatisch te verwijderen. Schakel plugins opnieuw in voordat
je doctor-opruiming uitvoert als je verouderde plugin-id's wilt verwijderen.

Installatie van plugin-afhankelijkheden gebeurt alleen tijdens expliciete install/update- of
doctor-reparatiestromen. Gateway-start, configuratieherlading en runtime-inspectie voeren
geen package managers uit en repareren geen dependency trees. Lokale plugins moeten hun
afhankelijkheden al geinstalleerd hebben, terwijl npm-, git- en ClawHub-plugins worden
geinstalleerd onder de beheerde plugin-roots van OpenClaw. Npm-afhankelijkheden kunnen worden gehoist
binnen de beheerde npm-root van OpenClaw; install/update scant die beheerde root voordat
vertrouwen wordt gegeven en uninstall verwijdert npm-beheerde pakketten via npm. Externe plugins
en aangepaste laadpaden moeten nog steeds worden geinstalleerd via `openclaw plugins install`.
Gebruik `openclaw plugins list --json` om de statische `dependencyStatus` voor elke
zichtbare plugin te zien zonder runtime-code te importeren of afhankelijkheden te repareren.
Zie [Resolutie van plugin-afhankelijkheden](/nl/plugins/dependency-resolution) voor de
levenscyclus tijdens installatie.

### Geblokkeerd eigendom van plugin-pad

Als plugin-diagnostiek zegt
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
en configuratievalidatie volgt met `plugin present but blocked`, heeft OpenClaw
plugin-bestanden gevonden die eigendom zijn van een andere Unix-gebruiker dan het proces dat ze laadt.
Laat de plugin-configuratie staan; herstel het bestandssysteemeigendom of voer
OpenClaw uit als dezelfde gebruiker die eigenaar is van de statusdirectory.

Voor Docker-installaties draait de officiele image als `node` (uid `1000`), dus de
host-bind-mounted OpenClaw-configuratie- en werkruimtedirectories zouden normaal
eigendom moeten zijn van uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Als je OpenClaw bewust als root uitvoert, herstel dan de beheerde plugin-root naar
root-eigendom:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Voer na het herstellen van eigendom opnieuw `openclaw doctor --fix` of
`openclaw plugins registry --refresh` uit zodat het opgeslagen plugin-register overeenkomt
met de gerepareerde bestanden.

Voor npm-installaties worden veranderlijke selectors zoals `latest` of een dist-tag opgelost
voor installatie en daarna vastgezet op de exacte geverifieerde versie in de
beheerde npm-root van OpenClaw. Nadat npm klaar is, verifieert OpenClaw dat de geinstalleerde
`package-lock.json`-invoer nog steeds overeenkomt met de opgeloste versie en integriteit. Als
npm andere pakketmetadata schrijft, faalt de installatie en wordt het beheerde pakket
teruggedraaid in plaats van een ander plugin-artefact te accepteren.
Beheerde npm-roots erven ook OpenClaw's pakketniveau npm `overrides`, zodat
beveiligingspins die de verpakte host beschermen ook gelden voor gehoiste externe
plugin-afhankelijkheden.

Broncheckouts zijn pnpm-workspaces. Als je OpenClaw clonet om aan meegeleverde
plugins te werken, voer `pnpm install` uit; OpenClaw laadt meegeleverde plugins dan vanuit
`extensions/<id>` zodat bewerkingen en pakketlokale afhankelijkheden direct worden gebruikt.
Gewone npm-rootinstallaties zijn voor verpakte OpenClaw, niet voor ontwikkeling
met source checkouts.

## Plugintypen

OpenClaw herkent twee plugin-formaten:

| Formaat    | Hoe het werkt                                                     | Voorbeelden                                             |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtime-module; wordt in-process uitgevoerd | Officiele plugins, community-npm-pakketten             |
| **Bundle** | Codex/Claude/Cursor-compatibele indeling; gemapt naar OpenClaw-functies | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide verschijnen onder `openclaw plugins list`. Zie [Plugin Bundles](/nl/plugins/bundles) voor bundledetails.

Als je een native plugin schrijft, begin dan met [Plugins bouwen](/nl/plugins/building-plugins)
en het [Plugin SDK-overzicht](/nl/plugins/sdk-overview).

## Pakket-entrypoints

Native plugin-npm-pakketten moeten `openclaw.extensions` declareren in `package.json`.
Elke entry moet binnen de pakketdirectory blijven en resolven naar een leesbaar
runtime-bestand, of naar een TypeScript-bronbestand met een afgeleide gebouwde JavaScript-
peer zoals `src/index.ts` naar `dist/index.js`.
Verpakte installaties moeten die JavaScript-runtime-output meeleveren. De TypeScript-
bronfallback is voor broncheckouts en lokale ontwikkelpaden, niet voor
npm-pakketten die in de beheerde plugin-root van OpenClaw worden geinstalleerd.

Als een waarschuwing over een beheerd pakket zegt dat het `requires compiled runtime output for
TypeScript entry ...`, is het pakket gepubliceerd zonder de JavaScript-bestanden
die OpenClaw tijdens runtime nodig heeft. Dat is een plugin-packagingprobleem, geen lokaal configuratie-
probleem. Werk de plugin bij of installeer die opnieuw nadat de publisher gecompileerde
JavaScript opnieuw publiceert, of schakel die plugin uit/verwijder die totdat er een vast pakket beschikbaar is.

Gebruik `openclaw.runtimeExtensions` wanneer gepubliceerde runtime-bestanden niet op dezelfde
paden staan als de bronentries. Wanneer aanwezig, moet `runtimeExtensions` exact
een entry bevatten voor elke `extensions`-entry. Niet-overeenkomende lijsten laten installatie en
plugin-detectie falen in plaats van stil terug te vallen op bronpaden. Als je ook
`openclaw.setupEntry` publiceert, gebruik dan `openclaw.runtimeSetupEntry` voor de gebouwde
JavaScript-peer; dat bestand is vereist wanneer het is gedeclareerd.

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

### OpenClaw-npm-pakketten tijdens migratie

ClawHub is het primaire distributiepad voor de meeste plugins. Huidige verpakte
OpenClaw-releases bundelen al veel officiele plugins, dus die hebben in normale setups
geen aparte npm-installaties nodig. Totdat elke plugin die eigendom is van OpenClaw is
gemigreerd naar ClawHub, levert OpenClaw nog steeds enkele `@openclaw/*` plugin-pakketten op
npm voor oudere/aangepaste installaties en directe npm-workflows.

Als npm een `@openclaw/*` plugin-pakket als deprecated rapporteert, komt die pakket-
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

  <Accordion title="Geheugen-plugins">
    - `memory-core` - gebundelde geheugenzoekfunctie (standaard via `plugins.slots.memory`)
    - `memory-lancedb` - langetermijngeheugen ondersteund door LanceDB met automatische herinnering/vastlegging (stel `plugins.slots.memory = "memory-lancedb"` in)

    Zie [Memory LanceDB](/nl/plugins/memory-lancedb) voor OpenAI-compatibele
    embeddingconfiguratie, Ollama-voorbeelden, herinneringslimieten en probleemoplossing.

  </Accordion>

  <Accordion title="Spraakproviders (standaard ingeschakeld)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Overig">
    - `browser` - gebundelde browserplugin voor de browsertool, `openclaw browser` CLI, `browser.request` gateway-methode, browserruntime en standaard browserbesturingsservice (standaard ingeschakeld; schakel uit voordat je deze vervangt)
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

| Veld               | Beschrijving                                                  |
| ------------------ | ------------------------------------------------------------- |
| `enabled`          | Hoofdschakelaar (standaard: `true`)                           |
| `allow`            | Plugin-toelatingslijst (optioneel)                            |
| `bundledDiscovery` | Detectiemodus voor gebundelde plugins (standaard `allowlist`) |
| `deny`             | Plugin-weigerlijst (optioneel; weigeren heeft voorrang)       |
| `load.paths`       | Extra pluginbestanden/-mappen                                 |
| `slots`            | Exclusieve slots-selectors (bijv. `memory`, `contextEngine`)  |
| `entries.\<id\>`   | Schakelaars + configuratie per plugin                         |

`plugins.allow` is exclusief. Wanneer deze niet leeg is, kunnen alleen vermelde plugins worden geladen
of tools beschikbaar maken, zelfs als `tools.allow` `"*"` bevat of een specifieke toolnaam die eigendom is van een plugin. Als een tooltoelatingslijst naar plugintools verwijst, voeg dan de bijbehorende plugin-id's toe
aan `plugins.allow` of verwijder `plugins.allow`; `openclaw doctor` waarschuwt voor deze
vorm.

`plugins.bundledDiscovery` staat voor nieuwe configuraties standaard op `"allowlist"`, dus een
beperkende `plugins.allow`-inventaris blokkeert ook weggelaten gebundelde providerplugins,
inclusief detectie van runtimeproviders voor webzoekopdrachten. Doctor stempelt oudere
beperkende allowlist-configuraties tijdens migratie met `"compat"`, zodat upgrades het
legacy-gedrag van gebundelde providers behouden totdat de operator voor de strengere modus kiest.
Een lege `plugins.allow` wordt nog steeds behandeld als niet ingesteld/open.

Configuratiewijzigingen die via `/plugins enable` of `/plugins disable` zijn gemaakt, activeren een
in-process herlaadactie van Gateway-plugins. Nieuwe agentbeurten bouwen hun toollijst opnieuw op vanuit
het vernieuwde pluginregister. Bewerkingen die de bron wijzigen, zoals installeren,
bijwerken en verwijderen, herstarten nog steeds het Gateway-proces omdat reeds geïmporteerde
pluginmodules niet veilig ter plekke kunnen worden vervangen.

`openclaw plugins list` is een lokale snapshot van het pluginregister/de configuratie. Een
`enabled` plugin daar betekent dat het persistente register en de huidige configuratie toestaan dat de
plugin deelneemt. Het bewijst niet dat een al draaiende externe Gateway
opnieuw is geladen of herstart met dezelfde plugincode. Stuur bij VPS-/containeropstellingen
met wrapperprocessen herstarts of schrijfacties die herladen activeren naar het daadwerkelijke
`openclaw gateway run`-proces, of gebruik `openclaw gateway restart` tegen de
draaiende Gateway wanneer de herlaadactie een fout meldt.

<Accordion title="Plugin-statussen: uitgeschakeld vs ontbrekend vs ongeldig">
  - **Uitgeschakeld**: plugin bestaat, maar activeringsregels hebben deze uitgezet. Configuratie blijft behouden.
  - **Ontbrekend**: configuratie verwijst naar een plugin-id die de detectie niet heeft gevonden.
  - **Ongeldig**: plugin bestaat, maar de configuratie komt niet overeen met het gedeclareerde schema. Gateway-opstart slaat alleen die plugin over; `openclaw doctor --fix` kan de ongeldige entry in quarantaine plaatsen door deze uit te schakelen en de configuratiepayload te verwijderen.

</Accordion>

## Detectie en prioriteit

OpenClaw scant in deze volgorde op plugins (eerste match wint):

<Steps>
  <Step title="Configuratiepaden">
    `plugins.load.paths` - expliciete bestands- of mappaden. Paden die terugwijzen
    naar OpenClaw's eigen verpakte gebundelde pluginmappen worden genegeerd;
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
    Andere vereisen expliciete activering.
  </Step>
</Steps>

Verpakte installaties en Docker-images lossen gebundelde plugins normaal op vanuit de
gecompileerde `dist/extensions`-boom. Als een bronmap van een gebundelde plugin
over het overeenkomende verpakte bronpad wordt gebindmount, bijvoorbeeld
`/app/extensions/synology-chat`, behandelt OpenClaw die gekoppelde bronmap
als een gebundelde bronoverlay en detecteert deze vóór de verpakte
`/app/dist/extensions/synology-chat`-bundle. Dit houdt maintainer-containerloops
werkend zonder elke gebundelde plugin terug te schakelen naar TypeScript-bron.
Stel `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` in om verpakte dist-bundles af te dwingen,
zelfs wanneer bronoverlaymounts aanwezig zijn.

### Activeringsregels

- `plugins.enabled: false` schakelt alle plugins uit en slaat plugindetectie/-laadwerk over
- `plugins.deny` wint altijd van allow
- `plugins.entries.\<id\>.enabled: false` schakelt die plugin uit
- Plugins afkomstig uit de workspace zijn **standaard uitgeschakeld** (moeten expliciet worden ingeschakeld)
- Gebundelde plugins volgen de ingebouwde standaard-aan-set, tenzij overschreven
- Exclusieve slots kunnen de geselecteerde plugin voor die slot geforceerd inschakelen
- Sommige gebundelde opt-in-plugins worden automatisch ingeschakeld wanneer configuratie een
  oppervlak noemt dat eigendom is van een plugin, zoals een providermodelreferentie, kanaalconfiguratie of harness-
  runtime
- Verouderde pluginconfiguratie blijft behouden zolang `plugins.enabled: false` actief is;
  schakel plugins opnieuw in voordat je doctor cleanup uitvoert als je verouderde id's wilt verwijderen
- OpenAI-familie Codex-routes houden gescheiden plugingrenzen aan:
  `openai-codex/*` hoort bij de OpenAI-plugin, terwijl de gebundelde Codex-
  appserverplugin wordt geselecteerd door `agentRuntime.id: "codex"` of legacy
  `codex/*`-modelreferenties

## Problemen met runtimehooks oplossen

Als een plugin in `plugins list` verschijnt maar `register(api)`-bijwerkingen of hooks
niet worden uitgevoerd in live chatverkeer, controleer dan eerst dit:

- Voer `openclaw gateway status --deep --require-rpc` uit en bevestig dat de actieve
  Gateway-URL, het profiel, het configuratiepad en het proces degene zijn die je bewerkt.
- Herstart de live Gateway na wijzigingen aan plugininstallatie/configuratie/code. In wrapper-
  containers is PID 1 mogelijk alleen een supervisor; herstart of signaleer het child-
  `openclaw gateway run`-proces.
- Gebruik `openclaw plugins inspect <id> --runtime --json` om hookregistraties en
  diagnostics te bevestigen. Niet-gebundelde conversatiehooks zoals `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` en `agent_end` hebben
  `plugins.entries.<id>.hooks.allowConversationAccess=true` nodig.
- Geef voor modelwisseling de voorkeur aan `before_model_resolve`. Deze draait vóór model-
  resolutie voor agentbeurten; `llm_output` draait pas nadat een modelpoging
  assistantuitvoer produceert.
- Gebruik voor bewijs van het effectieve sessiemodel `openclaw sessions` of de
  Gateway-sessie-/statusoppervlakken en start, bij het debuggen van providerpayloads, de
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

De samenvatting vermeldt de totale factorytijd en de langzaamste plugintoolfactories,
inclusief plugin-id, gedeclareerde toolnamen, resultaatvorm en of de tool
optioneel is. Langzame regels worden naar waarschuwingen gepromoveerd wanneer een enkele factory minstens
1s duurt of de totale voorbereiding van plugintoolfactories minstens 5s duurt.

OpenClaw cachet succesvolle resultaten van plugintoolfactories voor herhaalde resoluties
met dezelfde effectieve requestcontext. De cachesleutel omvat de effectieve
runtimeconfiguratie, workspace, agent-/sessie-id's, sandboxbeleid, browserinstellingen,
leveringscontext, aanvrageridentiteit en eigendomsstatus, zodat factories die
afhankelijk zijn van die vertrouwde velden opnieuw worden uitgevoerd wanneer de context verandert.

Als één plugin de timing domineert, inspecteer dan de runtimeregistraties:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Werk die plugin daarna bij, installeer deze opnieuw of schakel deze uit. Pluginauteurs moeten
dure dependency-loading achter het tooluitvoeringspad plaatsen in plaats van dit
binnen de toolfactory te doen.

### Dubbele eigendom van kanaal of tool

Symptomen:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Dit betekent dat meer dan één ingeschakelde plugin hetzelfde kanaal,
dezelfde setupflow of dezelfde toolnaam probeert te bezitten. De meest voorkomende oorzaak is een externe kanaalplugin
die is geïnstalleerd naast een gebundelde plugin die nu dezelfde kanaal-id biedt.

Debugstappen:

- Voer `openclaw plugins list --enabled --verbose` uit om elke ingeschakelde plugin
  en herkomst te zien.
- Voer `openclaw plugins inspect <id> --runtime --json` uit voor elke verdachte plugin en
  vergelijk `channels`, `channelConfigs`, `tools` en diagnostics.
- Voer `openclaw plugins registry --refresh` uit na het installeren of verwijderen van
  pluginpakketten, zodat persistente metadata de huidige installatie weerspiegelt.
- Herstart de Gateway na installatie-, register- of configuratiewijzigingen.

Oplossingsopties:

- Als één plugin bewust een andere vervangt voor dezelfde kanaal-id, moet de
  voorkeursplugin `channelConfigs.<channel-id>.preferOver` declareren met
  de plugin-id met lagere prioriteit. Zie [/plugins/manifest#replacing-another-channel-plugin](/nl/plugins/manifest#replacing-another-channel-plugin).
- Als de duplicatie per ongeluk is, schakel één kant uit met
  `plugins.entries.<plugin-id>.enabled: false` of verwijder de verouderde plugin-
  installatie.
- Als je beide plugins expliciet hebt ingeschakeld, behoudt OpenClaw dat verzoek en
  rapporteert het conflict. Kies één eigenaar voor het kanaal of hernoem tools die eigendom zijn van plugins,
  zodat het runtimeoppervlak ondubbelzinnig is.

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

| Slot            | Wat het beheert        | Standaard            |
| --------------- | ---------------------- | -------------------- |
| `memory`        | Actieve geheugenplugin | `memory-core`        |
| `contextEngine` | Actieve context-engine | `legacy` (ingebouwd) |

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

Gebundelde plugins worden met OpenClaw meegeleverd. Veel ervan zijn standaard ingeschakeld (bijvoorbeeld
gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browser-
plugin). Andere gebundelde plugins hebben nog steeds `openclaw plugins enable <id>` nodig.

`--force` overschrijft een bestaande geïnstalleerde plugin of hook pack op zijn plaats. Gebruik
`openclaw plugins update <id-or-npm-spec>` voor reguliere upgrades van gevolgde npm-
plugins. Het wordt niet ondersteund met `--link`, dat het bronpad hergebruikt in plaats
van naar een beheerd installatiedoel te kopiëren.

Wanneer `plugins.allow` al is ingesteld, voegt `openclaw plugins install` de
geïnstalleerde plugin-id toe aan die toelatingslijst voordat deze wordt ingeschakeld. Als dezelfde plugin-id
aanwezig is in `plugins.deny`, verwijdert install die verouderde deny-vermelding zodat de
expliciete installatie direct na herstart kan worden geladen.

OpenClaw houdt een blijvend lokaal pluginregister bij als het koude leesmodel voor
plugininventaris, eigenaarschap van bijdragen en opstartplanning. Installatie-, update-,
de-installatie-, inschakel- en uitschakelstromen vernieuwen dat register nadat de pluginstatus
is gewijzigd. Hetzelfde bestand `plugins/installs.json` bewaart duurzame installatiemetadata in
`installRecords` op het hoogste niveau en opnieuw opbouwbare manifestmetadata in `plugins`. Als
het register ontbreekt, verouderd of ongeldig is, bouwt `openclaw plugins registry
--refresh` de manifestweergave opnieuw op uit installatierecords, configuratiebeleid en
manifest-/pakketmetadata zonder plugin-runtimemodules te laden.

In Nix-modus (`OPENCLAW_NIX_MODE=1`) zijn mutators voor de pluginlevenscyclus uitgeschakeld.
Beheer in plaats daarvan de selectie van pluginpakketten en configuratie via de Nix-bron voor de
installatie; begin voor nix-openclaw met de agent-first
[Quick Start](https://github.com/openclaw/nix-openclaw#quick-start).
`openclaw plugins update <id-or-npm-spec>` is van toepassing op gevolgde installaties. Het doorgeven
van een npm-pakketspecificatie met een dist-tag of exacte versie herleidt de pakketnaam
naar het gevolgde pluginrecord en registreert de nieuwe specificatie voor toekomstige updates.
Het doorgeven van de pakketnaam zonder versie verplaatst een exact vastgezette installatie terug naar
de standaardreleaselijn van het register. Als de geïnstalleerde npm-plugin al overeenkomt met
de opgeloste versie en geregistreerde artefactidentiteit, slaat OpenClaw de update over
zonder te downloaden, opnieuw te installeren of configuratie te herschrijven.
Wanneer `openclaw update` op het bètakanaal draait, proberen npm- en ClawHub-
pluginrecords op de standaardlijn eerst `@beta` en vallen ze terug op default/latest wanneer er geen plugin-
bètarelease bestaat. Exacte versies en expliciete tags blijven vastgezet.

`--pin` is alleen voor npm. Het wordt niet ondersteund met `--marketplace`, omdat
marketplace-installaties marketplace-bronmetadata behouden in plaats van een npm-specificatie.

`--dangerously-force-unsafe-install` is een noodoverride voor fout-positieven
van de ingebouwde gevaarlijke-code-scanner. Hiermee kunnen plugininstallaties
en pluginupdates doorgaan ondanks ingebouwde `critical`-bevindingen, maar het
omzeilt nog steeds geen beleidsblokkades van plugin `before_install` of blokkades door scanfouten.
Installatiescans negeren veelvoorkomende testbestanden en -mappen zoals `tests/`,
`__tests__/`, `*.test.*` en `*.spec.*` om te voorkomen dat verpakte testmocks worden geblokkeerd;
gedeclareerde plugin-runtime-entrypoints worden nog steeds gescand, zelfs als ze een van
die namen gebruiken.

Deze CLI-vlag is alleen van toepassing op plugininstallatie-/updatestromen. Door Gateway ondersteunde Skills-
afhankelijkheidsinstallaties gebruiken in plaats daarvan de overeenkomstige `dangerouslyForceUnsafeInstall`-request
override, terwijl `openclaw skills install` de aparte ClawHub-
download-/installatiestroom voor Skills blijft.

Als een plugin die je op ClawHub hebt gepubliceerd verborgen of geblokkeerd is door een scan, open dan het
ClawHub-dashboard of voer `clawhub package rescan <name>` uit om ClawHub te vragen
deze opnieuw te controleren. `--dangerously-force-unsafe-install` heeft alleen invloed op installaties op je eigen
machine; het vraagt ClawHub niet om de plugin opnieuw te scannen of een geblokkeerde release
openbaar te maken.

Compatibele bundels nemen deel aan dezelfde pluginstroom voor list/inspect/enable/disable.
Huidige runtimeondersteuning omvat bundel-Skills, Claude command-Skills,
Claude `settings.json`-standaarden, Claude `.lsp.json` en door manifest gedeclareerde
`lspServers`-standaarden, Cursor command-Skills en compatibele Codex hook-
mappen.

`openclaw plugins inspect <id>` rapporteert ook gedetecteerde bundelcapaciteiten plus
ondersteunde of niet-ondersteunde MCP- en LSP-serververmeldingen voor door bundels ondersteunde plugins.

Marketplace-bronnen kunnen een bekende Claude-marketplacenaam uit
`~/.claude/plugins/known_marketplaces.json` zijn, een lokale marketplace-root of
`marketplace.json`-pad, een GitHub-verkorting zoals `owner/repo`, een GitHub-repo-
URL of een git-URL. Voor externe marketplaces moeten pluginvermeldingen binnen de
gekloonde marketplace-repo blijven en uitsluitend relatieve padbronnen gebruiken.

Zie de [`openclaw plugins` CLI-referentie](/nl/cli/plugins) voor volledige details.

## Overzicht van de Plugin-API

Native plugins exporteren een entryobject dat `register(api)` beschikbaar maakt. Oudere
plugins kunnen nog steeds `activate(api)` gebruiken als verouderde alias, maar nieuwe plugins moeten
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

OpenClaw laadt het entryobject en roept `register(api)` aan tijdens plugin-
activatie. De loader valt nog steeds terug op `activate(api)` voor oudere plugins,
maar gebundelde plugins en nieuwe externe plugins moeten `register` behandelen als het
publieke contract.

`api.registrationMode` vertelt een plugin waarom de entry wordt geladen:

| Modus           | Betekenis                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtimeactivatie. Registreer tools, hooks, services, commando's, routes en andere live neveneffecten.                            |
| `discovery`     | Alleen-lezen capaciteitsdetectie. Registreer providers en metadata; vertrouwde plugin-entrycode kan laden, maar sla live neveneffecten over. |
| `setup-only`    | Laden van kanaalsetupmetadata via een lichtgewicht setup-entry.                                                                  |
| `setup-runtime` | Kanaalsetup laden waarvoor ook de runtime-entry nodig is.                                                                         |
| `cli-metadata`  | Alleen verzamelen van CLI-commandmetadata.                                                                                       |

Plugin-entries die sockets, databases, background workers of langlevende
clients openen, moeten die neveneffecten bewaken met `api.registrationMode === "full"`.
Discovery-ladingen worden apart gecachet van activerende ladingen en vervangen niet
het draaiende Gateway-register. Discovery is niet-activerend, niet importvrij:
OpenClaw kan de vertrouwde plugin-entry of kanaalpluginmodule evalueren om
de snapshot te bouwen. Houd module-topniveaus lichtgewicht en vrij van neveneffecten, en verplaats
netwerkclients, subprocessen, listeners, credential-lezingen en serviceopstart
achter volledige-runtimepaden.

Veelgebruikte registratiemethoden:

| Methode                                 | Wat deze registreert                  |
| --------------------------------------- | ------------------------------------- |
| `registerProvider`                      | Modelprovider (LLM)                   |
| `registerChannel`                       | Chatkanaal                            |
| `registerTool`                          | Agenttool                             |
| `registerHook` / `on(...)`              | Levenscyclus-hooks                    |
| `registerSpeechProvider`                | Tekst-naar-spraak / STT               |
| `registerRealtimeTranscriptionProvider` | Streaming STT                         |
| `registerRealtimeVoiceProvider`         | Duplex realtime spraak                |
| `registerMediaUnderstandingProvider`    | Beeld-/audioanalyse                   |
| `registerImageGenerationProvider`       | Beeldgeneratie                        |
| `registerMusicGenerationProvider`       | Muziekgeneratie                       |
| `registerVideoGenerationProvider`       | Videogeneratie                        |
| `registerWebFetchProvider`              | Webfetch-/scrapeprovider              |
| `registerWebSearchProvider`             | Webzoekfunctie                        |
| `registerHttpRoute`                     | HTTP-eindpunt                         |
| `registerCommand` / `registerCli`       | CLI-commando's                        |
| `registerContextEngine`                 | Contextengine                         |
| `registerService`                       | Achtergrondservice                    |

Hook-guardgedrag voor getypeerde levenscyclus-hooks:

- `before_tool_call`: `{ block: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `before_tool_call`: `{ block: false }` is een no-op en wist een eerdere blokkade niet.
- `before_install`: `{ block: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `before_install`: `{ block: false }` is een no-op en wist een eerdere blokkade niet.
- `message_sending`: `{ cancel: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `message_sending`: `{ cancel: false }` is een no-op en wist een eerdere annulering niet.

Native Codex-app-serverruns bridgen Codex-native toolgebeurtenissen terug naar dit
hook-oppervlak. Plugins kunnen native Codex-tools blokkeren via `before_tool_call`,
resultaten observeren via `after_tool_call`, en deelnemen aan Codex
`PermissionRequest`-goedkeuringen. De bridge herschrijft Codex-native toolargumenten
nog niet. De exacte grens voor Codex-runtimeondersteuning staat in het
[ondersteuningscontract voor Codex-harnas v1](/nl/plugins/codex-harness#v1-support-contract).

Zie voor volledig getypt hookgedrag het [SDK-overzicht](/nl/plugins/sdk-overview#hook-decision-semantics).

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins) - maak je eigen plugin
- [Pluginbundels](/nl/plugins/bundles) - compatibiliteit met Codex/Claude/Cursor-bundels
- [Pluginmanifest](/nl/plugins/manifest) - manifestschema
- [Tools registreren](/nl/plugins/building-plugins#registering-agent-tools) - voeg agenttools toe in een plugin
- [Plugininternals](/nl/plugins/architecture) - capaciteitsmodel en laadpipeline
- [Communityplugins](/nl/plugins/community) - vermeldingen van derden
