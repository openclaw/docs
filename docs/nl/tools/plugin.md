---
read_when:
    - Plugins installeren of configureren
    - Plugin-detectie en laadregels begrijpen
    - Werken met Codex/Claude-compatibele Plugin-bundels
sidebarTitle: Install and Configure
summary: OpenClaw-plugins installeren, configureren en beheren
title: Plugins
x-i18n:
    generated_at: "2026-05-06T11:28:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad3000dbd6dd660f4dbab9a25c476e4c4e3fba0a9781ae344ea3cc147598d0b0
    source_path: tools/plugin.md
    workflow: 16
---

Plugins breiden OpenClaw uit met nieuwe mogelijkheden: kanalen, modelproviders,
agent-harnassen, tools, skills, spraak, realtime transcriptie, realtime
spraak, mediabegrip, beeldgeneratie, videogeneratie, web fetch, web
search, en meer. Sommige plugins zijn **core** (meegeleverd met OpenClaw), andere
zijn **extern**. De meeste externe plugins worden gepubliceerd en gevonden via
[ClawHub](/nl/tools/clawhub). Npm blijft ondersteund voor rechtstreekse installaties en voor een
tijdelijke set pluginpakketten in eigendom van OpenClaw terwijl die migratie wordt afgerond.

## Snelstart

Voor voorbeelden voor kopiëren en plakken om te installeren, weer te geven, verwijderen, bijwerken en publiceren, zie
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
    In een actieve Gateway activeren `/plugins enable` en `/plugins disable`,
    alleen voor de eigenaar, de config-herlader van de Gateway. De Gateway herlaadt plugin-runtime
    oppervlakken in het proces, en nieuwe agentbeurten bouwen hun tool-lijst opnieuw op vanuit het
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
    methoden, hooks of CLI-commando's in eigendom van de plugin moet bewijzen. Gewoon `inspect` is een koude
    manifest-/registercontrole en vermijdt bewust het importeren van plugin-runtime.

  </Step>
</Steps>

Als je chat-native controle verkiest, schakel dan `commands.plugins: true` in en gebruik:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Het installatiepad gebruikt dezelfde resolver als de CLI: lokaal pad/archief, expliciet
`clawhub:<pkg>`, expliciet `npm:<pkg>`, expliciet `npm-pack:<path.tgz>`,
expliciet `git:<repo>`, of kale pakketspecificatie via npm.

Als de configuratie ongeldig is, mislukt installatie normaal gesproken gesloten en verwijst die je naar
`openclaw doctor --fix`. De enige hersteluitzondering is een smal herinstallatiepad voor meegeleverde plugins
voor plugins die zich aanmelden voor
`openclaw.install.allowInvalidConfigRecovery`.
Tijdens het opstarten van de Gateway faalt ongeldige pluginconfiguratie gesloten zoals elke andere ongeldige
configuratie. Voer `openclaw doctor --fix` uit om de slechte pluginconfiguratie in quarantaine te plaatsen door
die pluginvermelding uit te schakelen en de ongeldige configuratiepayload ervan te verwijderen; de normale
configuratieback-up bewaart de vorige waarden.
Wanneer een kanaalconfiguratie verwijst naar een plugin die niet meer vindbaar is maar dezelfde
verouderde plugin-id in pluginconfiguratie of installatierecords blijft staan, registreert Gateway-opstart
waarschuwingen en slaat dat kanaal over in plaats van elk ander kanaal te blokkeren.
Voer `openclaw doctor --fix` uit om de verouderde kanaal-/pluginvermeldingen te verwijderen; onbekende
kanaalsleutels zonder bewijs van een verouderde plugin blijven validatie mislukken zodat typefouten
zichtbaar blijven.
Als `plugins.enabled: false` is ingesteld, worden verouderde pluginverwijzingen als inert behandeld:
Gateway-opstart slaat werk voor pluginontdekking/-laden over en `openclaw doctor` behoudt
de uitgeschakelde pluginconfiguratie in plaats van die automatisch te verwijderen. Schakel plugins opnieuw in voordat
je doctor-opruiming uitvoert als je verouderde plugin-id's wilt laten verwijderen.

Installatie van pluginafhankelijkheden gebeurt alleen tijdens expliciete installatie/update- of
doctor-herstelstromen. Gateway-opstart, config-herladen en runtime-inspectie voeren geen
pakketbeheerders uit en herstellen geen afhankelijkheidsbomen. Lokale plugins moeten hun afhankelijkheden al
geïnstalleerd hebben, terwijl npm-, git- en ClawHub-plugins worden
geïnstalleerd onder de beheerde pluginroots van OpenClaw. npm-afhankelijkheden kunnen worden gehesen
binnen OpenClaws beheerde npm-root; installatie/update scant die beheerde root vóór
vertrouwen en verwijderen verwijdert door npm beheerde pakketten via npm. Externe plugins
en aangepaste laadpaden moeten nog steeds worden geïnstalleerd via `openclaw plugins install`.
Gebruik `openclaw plugins list --json` om de statische `dependencyStatus` voor elke
zichtbare plugin te zien zonder runtimecode te importeren of afhankelijkheden te herstellen.
Zie [Afhankelijkheidsresolutie voor plugins](/nl/plugins/dependency-resolution) voor de
levenscyclus tijdens installatie.

### Geblokkeerd eigenaarschap van pluginpad

Als plugindiagnostiek zegt
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
en configuratievalidatie volgt met `plugin present but blocked`, heeft OpenClaw
pluginbestanden gevonden die eigendom zijn van een andere Unix-gebruiker dan het proces dat ze laadt.
Laat de pluginconfiguratie staan; herstel het eigenaarschap van het bestandssysteem of voer
OpenClaw uit als dezelfde gebruiker die eigenaar is van de statusmap.

Voor Docker-installaties draait de officiële image als `node` (uid `1000`), dus de
host-bind-mounted OpenClaw-configuratie- en werkruimtemappen zouden normaal gesproken
eigendom moeten zijn van uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Als je OpenClaw bewust als root draait, herstel dan de beheerde pluginroot naar
root-eigenaarschap in plaats daarvan:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Nadat je het eigenaarschap hebt hersteld, voer je `openclaw doctor --fix` of
`openclaw plugins registry --refresh` opnieuw uit zodat het vastgelegde pluginregister overeenkomt
met de herstelde bestanden.

Voor npm-installaties worden veranderlijke selectors zoals `latest` of een dist-tag opgelost
vóór installatie en daarna vastgepind op de exact geverifieerde versie in OpenClaws
beheerde npm-root. Nadat npm klaar is, verifieert OpenClaw dat de geïnstalleerde
`package-lock.json`-vermelding nog steeds overeenkomt met de opgeloste versie en integriteit. Als
npm andere pakketmetadata schrijft, mislukt de installatie en wordt het beheerde pakket
teruggedraaid in plaats van een ander pluginartefact te accepteren.
Beheerde npm-roots erven ook OpenClaws npm-`overrides` op pakketniveau, zodat
security-pins die de verpakte host beschermen ook gelden voor gehesen externe
pluginafhankelijkheden.

Broncheckouts zijn pnpm-workspaces. Als je OpenClaw kloont om aan meegeleverde
plugins te werken, voer dan `pnpm install` uit; OpenClaw laadt meegeleverde plugins dan vanuit
`extensions/<id>` zodat bewerkingen en pakketlokale afhankelijkheden rechtstreeks worden gebruikt.
Gewone npm-rootinstallaties zijn bedoeld voor verpakte OpenClaw, niet voor ontwikkeling
in broncheckouts.

## Plugintypen

OpenClaw herkent twee pluginformaten:

| Formaat    | Hoe het werkt                                                     | Voorbeelden                                             |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------- |
| **Native** | `openclaw.plugin.json` + runtime-module; wordt in-proces uitgevoerd | Officiële plugins, community-npm-pakketten              |
| **Bundle** | Codex/Claude/Cursor-compatibele indeling; toegewezen aan OpenClaw-functies | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide verschijnen onder `openclaw plugins list`. Zie [Pluginbundels](/nl/plugins/bundles) voor bundeldetails.

Als je een native plugin schrijft, begin dan met [Plugins bouwen](/nl/plugins/building-plugins)
en het [Plugin SDK-overzicht](/nl/plugins/sdk-overview).

## Pakket-entrypoints

Native plugin-npm-pakketten moeten `openclaw.extensions` declareren in `package.json`.
Elke vermelding moet binnen de pakketmap blijven en oplossen naar een leesbaar
runtimebestand, of naar een TypeScript-bronbestand met een afgeleide gebouwde JavaScript-
peer zoals `src/index.ts` naar `dist/index.js`.
Verpakte installaties moeten die JavaScript-runtimeoutput meeleveren. De TypeScript-
bronfallback is bedoeld voor broncheckouts en lokale ontwikkelpaden, niet voor
npm-pakketten die zijn geïnstalleerd in OpenClaws beheerde pluginroot.

Als een waarschuwing voor een beheerd pakket zegt dat het `requires compiled runtime output for
TypeScript entry ...`, is het pakket gepubliceerd zonder de JavaScript-bestanden
die OpenClaw tijdens runtime nodig heeft. Dat is een pluginverpakkingsprobleem, geen lokaal configuratie-
probleem. Werk de plugin bij of installeer die opnieuw nadat de uitgever gecompileerde
JavaScript opnieuw heeft gepubliceerd, of schakel die plugin uit/verwijder die totdat een vast pakket beschikbaar is.

Gebruik `openclaw.runtimeExtensions` wanneer gepubliceerde runtimebestanden niet op
dezelfde paden staan als de bronvermeldingen. Wanneer aanwezig, moet `runtimeExtensions` exact
één vermelding bevatten voor elke `extensions`-vermelding. Niet-overeenkomende lijsten laten installatie en
pluginontdekking mislukken in plaats van stil terug te vallen op bronpaden. Als je ook
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

## Officiële plugins

### OpenClaw-eigen npm-pakketten tijdens migratie

ClawHub is het primaire distributiepad voor de meeste plugins. Huidige verpakte
OpenClaw-releases bundelen al veel officiële plugins, dus die hebben geen
afzonderlijke npm-installaties nodig in normale opstellingen. Totdat elke plugin in eigendom van OpenClaw is
gemigreerd naar ClawHub, levert OpenClaw nog steeds enkele `@openclaw/*`-pluginpakketten op
npm voor oudere/aangepaste installaties en rechtstreekse npm-workflows.

Als npm een `@openclaw/*`-pluginpakket als deprecated meldt, komt die pakketversie
uit een oudere externe pakketlijn. Gebruik de meegeleverde plugin uit
huidige OpenClaw of een lokale checkout totdat een nieuwer npm-pakket is gepubliceerd.

| Plugin          | Pakket                     | Documentatie                              |
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
    - `memory-core` - meegeleverde geheugenzoekfunctie (standaard via `plugins.slots.memory`)
    - `memory-lancedb` - langdurig geheugen met LanceDB-backend en automatische recall/capture (stel `plugins.slots.memory = "memory-lancedb"` in)

    Zie [Memory LanceDB](/nl/plugins/memory-lancedb) voor OpenAI-compatibele
    embeddingconfiguratie, Ollama-voorbeelden, recall-limieten en probleemoplossing.

  </Accordion>

  <Accordion title="Spraakproviders (standaard ingeschakeld)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Overig">
    - `browser` - meegeleverde browserplugin voor de browsertool, `openclaw browser` CLI, de Gateway-methode `browser.request`, browserruntime en standaard browserbesturingsservice (standaard ingeschakeld; schakel uit voordat je deze vervangt)
    - `copilot-proxy` - VS Code Copilot Proxy-brug (standaard uitgeschakeld)

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

| Veld               | Beschrijving                                               |
| ------------------ | ---------------------------------------------------------- |
| `enabled`          | Hoofdschakelaar (standaard: `true`)                        |
| `allow`            | Plugin-toestaanlijst (optioneel)                           |
| `bundledDiscovery` | Detectiemodus voor meegeleverde plugins (standaard `allowlist`) |
| `deny`             | Plugin-weigerlijst (optioneel; weigeren wint)              |
| `load.paths`       | Extra pluginbestanden/-mappen                              |
| `slots`            | Exclusieve slotselectoren (bijv. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Schakelaars + configuratie per plugin                      |

`plugins.allow` is exclusief. Wanneer deze niet leeg is, kunnen alleen vermelde plugins laden
of tools aanbieden, zelfs als `tools.allow` `"*"` of een specifieke toolnaam
van een plugin bevat. Als een tool-toestaanlijst naar plugintools verwijst, voeg dan de eigenaar-plugin-id's
toe aan `plugins.allow` of verwijder `plugins.allow`; `openclaw doctor` waarschuwt voor deze
vorm.

`plugins.bundledDiscovery` gebruikt standaard `"allowlist"` voor nieuwe configuraties, zodat een
beperkende `plugins.allow`-inventaris ook weggelaten meegeleverde providerplugins blokkeert,
inclusief detectie van runtime webzoekproviders. Doctor stempelt oudere
beperkende allowlist-configuraties tijdens migratie met `"compat"`, zodat upgrades het
oude gedrag van meegeleverde providers behouden totdat de operator voor de strengere modus kiest.
Een lege `plugins.allow` wordt nog steeds behandeld als niet ingesteld/open.

Configuratiewijzigingen via `/plugins enable` of `/plugins disable` activeren een
in-process herlaadactie van Gateway-plugins. Nieuwe agentbeurten bouwen hun toollijst opnieuw op vanuit
het vernieuwde pluginregister. Bronwijzigende bewerkingen zoals installeren,
bijwerken en verwijderen herstarten nog steeds het Gateway-proces, omdat al geïmporteerde
pluginmodules niet veilig ter plekke kunnen worden vervangen.

`openclaw plugins list` is een lokale snapshot van pluginregister/configuratie. Een
`enabled` plugin daar betekent dat het opgeslagen register en de huidige configuratie de
plugin toestaan deel te nemen. Het bewijst niet dat een al draaiende externe Gateway
opnieuw is geladen of herstart met dezelfde plugincode. Op VPS-/containeropstellingen
met wrapperprocessen moet je herstarts of schrijfacties die een reload activeren naar het daadwerkelijke
`openclaw gateway run`-proces sturen, of `openclaw gateway restart` gebruiken tegen de
draaiende Gateway wanneer de reload een fout meldt.

<Accordion title="Pluginstatussen: uitgeschakeld versus ontbrekend versus ongeldig">
  - **Uitgeschakeld**: plugin bestaat, maar inschakelregels hebben deze uitgezet. Configuratie blijft behouden.
  - **Ontbrekend**: configuratie verwijst naar een plugin-id die detectie niet heeft gevonden.
  - **Ongeldig**: plugin bestaat, maar de configuratie komt niet overeen met het gedeclareerde schema. Gateway-start slaat alleen die plugin over; `openclaw doctor --fix` kan de ongeldige invoer in quarantaine plaatsen door deze uit te schakelen en de configuratiepayload te verwijderen.

</Accordion>

## Detectie en prioriteit

OpenClaw scant in deze volgorde naar plugins (eerste match wint):

<Steps>
  <Step title="Configuratiepaden">
    `plugins.load.paths` - expliciete bestands- of mappaden. Paden die terugwijzen
    naar OpenClaw's eigen verpakte meegeleverde pluginmappen worden genegeerd;
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
gecompileerde `dist/extensions`-boom. Als een bronmap van een meegeleverde plugin
over het overeenkomende verpakte bronpad wordt bind-gemount, bijvoorbeeld
`/app/extensions/synology-chat`, behandelt OpenClaw die gemounte bronmap
als een meegeleverde bronoverlay en detecteert deze vóór de verpakte
`/app/dist/extensions/synology-chat`-bundel. Dit houdt containerloops voor maintainers
werkend zonder elke meegeleverde plugin terug te zetten naar TypeScript-bron.
Stel `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` in om verpakte dist-bundels af te dwingen,
zelfs wanneer bronoverlay-mounts aanwezig zijn.

### Inschakelregels

- `plugins.enabled: false` schakelt alle plugins uit en slaat plugindetectie/-laadwerk over
- `plugins.deny` wint altijd van allow
- `plugins.entries.\<id\>.enabled: false` schakelt die plugin uit
- Plugins afkomstig uit de workspace zijn **standaard uitgeschakeld** (moeten expliciet worden ingeschakeld)
- Meegeleverde plugins volgen de ingebouwde standaard-aan-set tenzij overschreven
- Exclusieve slots kunnen de geselecteerde plugin voor dat slot geforceerd inschakelen
- Sommige meegeleverde opt-in-plugins worden automatisch ingeschakeld wanneer configuratie een
  oppervlak van de plugin noemt, zoals een providermodelreferentie, kanaalconfiguratie of harness
  runtime
- Verouderde pluginconfiguratie blijft behouden terwijl `plugins.enabled: false` actief is;
  schakel plugins opnieuw in voordat je doctor-opruiming uitvoert als je verouderde id's wilt verwijderen
- OpenAI-familie Codex-routes houden aparte plugingrenzen aan:
  `openai-codex/*` hoort bij de OpenAI-plugin, terwijl de meegeleverde Codex
  app-serverplugin wordt geselecteerd door `agentRuntime.id: "codex"` of oude
  `codex/*`-modelreferenties

## Runtime-hooks oplossen

Als een plugin in `plugins list` verschijnt maar bijwerkingen of hooks van `register(api)`
niet worden uitgevoerd in live chatverkeer, controleer dan eerst dit:

- Voer `openclaw gateway status --deep --require-rpc` uit en bevestig dat de actieve
  Gateway-URL, het profiel, het configuratiepad en het proces degene zijn die je bewerkt.
- Herstart de live Gateway na wijzigingen aan plugininstallatie/configuratie/code. In wrapper-
  containers kan PID 1 slechts een supervisor zijn; herstart of signaleer het onderliggende
  `openclaw gateway run`-proces.
- Gebruik `openclaw plugins inspect <id> --runtime --json` om hookregistraties en
  diagnostiek te bevestigen. Niet-meegeleverde conversatiehooks zoals `llm_input`,
  `llm_output`, `before_agent_finalize` en `agent_end` hebben
  `plugins.entries.<id>.hooks.allowConversationAccess=true` nodig.
- Voor modelwisselingen geef je de voorkeur aan `before_model_resolve`. Deze draait vóór model-
  resolutie voor agentbeurten; `llm_output` draait pas nadat een modelpoging
  assistantuitvoer produceert.
- Gebruik voor bewijs van het effectieve sessiemodel `openclaw sessions` of de
  Gateway-sessie-/statusoppervlakken en start, bij het debuggen van providerpayloads, de
  Gateway met `--raw-stream --raw-stream-path <path>`.

### Trage setup van plugintools

Als agentbeurten lijken te blijven hangen tijdens het voorbereiden van tools, schakel dan trace-logging in en
controleer op timingregels voor plugintoolfactory's:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Zoek naar:

```text
[trace:plugin-tools] factory timings ...
```

De samenvatting vermeldt de totale factorytijd en de traagste plugintoolfactory's,
inclusief plugin-id, gedeclareerde toolnamen, resultaatvorm en of de tool
optioneel is. Trage regels worden gepromoveerd tot waarschuwingen wanneer een enkele factory
minstens 1s duurt of de totale voorbereiding van plugintoolfactory's minstens 5s duurt.

OpenClaw cachet succesvolle resultaten van plugintoolfactory's voor herhaalde resoluties
met dezelfde effectieve aanvraagcontext. De cachesleutel bevat de effectieve
runtimeconfiguratie, workspace, agent-/sessie-id's, sandboxbeleid, browserinstellingen,
leveringscontext, aanvrageridentiteit en eigendomsstatus, zodat factory's die
van die vertrouwde velden afhangen opnieuw worden uitgevoerd wanneer de context verandert.

Als één plugin de timing domineert, inspecteer dan de runtime-registraties:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Werk die plugin daarna bij, installeer deze opnieuw of schakel deze uit. Plugin-auteurs moeten
dure dependency-loading achter het pad voor tooluitvoering plaatsen in plaats van dit
binnen de toolfactory te doen.

### Dubbel kanaal- of tooleigendom

Symptomen:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Dit betekent dat meer dan één ingeschakelde plugin hetzelfde kanaal,
dezelfde setupflow of dezelfde toolnaam probeert te beheren. De meest voorkomende oorzaak is een externe kanaalplugin
die naast een meegeleverde plugin is geïnstalleerd die nu dezelfde kanaal-id aanbiedt.

Debugstappen:

- Voer `openclaw plugins list --enabled --verbose` uit om elke ingeschakelde plugin
  en herkomst te zien.
- Voer `openclaw plugins inspect <id> --runtime --json` uit voor elke verdachte plugin en
  vergelijk `channels`, `channelConfigs`, `tools` en diagnostiek.
- Voer `openclaw plugins registry --refresh` uit na het installeren of verwijderen van
  pluginpakketten, zodat opgeslagen metadata de huidige installatie weerspiegelen.
- Herstart de Gateway na installatie-, register- of configuratiewijzigingen.

Oplossingsopties:

- Als één plugin bewust een andere vervangt voor dezelfde kanaal-id, moet de
  voorkeursplugin `channelConfigs.<channel-id>.preferOver` declareren met
  de plugin-id met lagere prioriteit. Zie [/plugins/manifest#replacing-another-channel-plugin](/nl/plugins/manifest#replacing-another-channel-plugin).
- Als het duplicaat onbedoeld is, schakel dan één kant uit met
  `plugins.entries.<plugin-id>.enabled: false` of verwijder de verouderde plugininstallatie.
- Als je beide plugins expliciet hebt ingeschakeld, respecteert OpenClaw dat verzoek en
  meldt het conflict. Kies één eigenaar voor het kanaal of hernoem tools die eigendom zijn van de plugin,
  zodat het runtime-oppervlak ondubbelzinnig is.

## Pluginslots (exclusieve categorieën)

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
| `memory`        | Actieve geheugenplugin | `memory-core`       |
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

Gebundelde plugins worden met OpenClaw meegeleverd. Veel ervan zijn standaard ingeschakeld (bijvoorbeeld gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browserplugin). Andere gebundelde plugins hebben nog steeds `openclaw plugins enable <id>` nodig.

`--force` overschrijft een bestaande geinstalleerde plugin of hook-pack op zijn plek. Gebruik `openclaw plugins update <id-or-npm-spec>` voor reguliere upgrades van bijgehouden npm-plugins. Dit wordt niet ondersteund met `--link`, dat het bronpad hergebruikt in plaats van over een beheerd installatiedoel heen te kopieren.

Wanneer `plugins.allow` al is ingesteld, voegt `openclaw plugins install` de geinstalleerde plugin-id toe aan die toelatingslijst voordat deze wordt ingeschakeld. Als dezelfde plugin-id aanwezig is in `plugins.deny`, verwijdert install die verouderde deny-vermelding zodat de expliciete installatie direct na herstarten laadbaar is.

OpenClaw bewaart een persistente lokale pluginregistratie als het koude leesmodel voor plugininventaris, eigendom van bijdragen en opstartplanning. Installatie-, update-, verwijderings-, inschakel- en uitschakelstromen vernieuwen die registratie nadat de pluginstatus is gewijzigd. Hetzelfde bestand `plugins/installs.json` bewaart duurzame installatiemetadata in `installRecords` op topniveau en opnieuw opbouwbare manifestmetadata in `plugins`. Als de registratie ontbreekt, verouderd of ongeldig is, bouwt `openclaw plugins registry --refresh` de manifestweergave opnieuw op uit installatierecords, configuratiebeleid en manifest-/pakketmetadata zonder runtime-modules van plugins te laden. `openclaw plugins update <id-or-npm-spec>` is van toepassing op bijgehouden installaties. Het doorgeven van een npm-pakketspecificatie met een dist-tag of exacte versie herleidt de pakketnaam terug naar het bijgehouden pluginrecord en registreert de nieuwe specificatie voor toekomstige updates. Het doorgeven van de pakketnaam zonder versie verplaatst een exact vastgezette installatie terug naar de standaard releaselijn van de registratie. Als de geinstalleerde npm-plugin al overeenkomt met de opgeloste versie en geregistreerde artefactidentiteit, slaat OpenClaw de update over zonder te downloaden, opnieuw te installeren of configuratie te herschrijven. Wanneer `openclaw update` op het betakanaal draait, proberen pluginrecords op de standaardlijn voor npm en ClawHub eerst `@beta` en vallen ze terug op standaard/latest wanneer er geen plugin-betarelease bestaat. Exacte versies en expliciete tags blijven vastgezet.

`--pin` is alleen voor npm. Dit wordt niet ondersteund met `--marketplace`, omdat marketplace-installaties marketplace-bronmetadata bewaren in plaats van een npm-specificatie.

`--dangerously-force-unsafe-install` is een noodoverride voor fout-positieven van de ingebouwde scanner voor gevaarlijke code. Hiermee kunnen plugininstallaties en pluginupdates doorgaan voorbij ingebouwde `critical`-bevindingen, maar het omzeilt nog steeds geen plugin-`before_install`-beleidsblokkades of blokkering door scanfouten. Installatiescans negeren gangbare testbestanden en mappen zoals `tests/`, `__tests__/`, `*.test.*` en `*.spec.*` om te voorkomen dat verpakte testmocks worden geblokkeerd; gedeclareerde runtime-entrypoints van plugins worden nog steeds gescand, zelfs als ze een van die namen gebruiken.

Deze CLI-vlag is alleen van toepassing op install/update-stromen voor plugins. Door Gateway ondersteunde installaties van Skill-afhankelijkheden gebruiken in plaats daarvan de bijbehorende request-override `dangerouslyForceUnsafeInstall`, terwijl `openclaw skills install` de afzonderlijke download-/installatiestroom voor ClawHub-Skills blijft.

Als een plugin die je op ClawHub hebt gepubliceerd verborgen is of door een scan wordt geblokkeerd, open dan het ClawHub-dashboard of voer `clawhub package rescan <name>` uit om ClawHub te vragen deze opnieuw te controleren. `--dangerously-force-unsafe-install` heeft alleen invloed op installaties op je eigen machine; het vraagt ClawHub niet om de plugin opnieuw te scannen of een geblokkeerde release openbaar te maken.

Compatibele bundels nemen deel aan dezelfde pluginstroom voor list/inspect/enable/disable. De huidige runtime-ondersteuning omvat bundel-Skills, Claude command-Skills, standaardwaarden voor Claude `settings.json`, standaardwaarden voor Claude `.lsp.json` en via het manifest gedeclareerde `lspServers`, Cursor command-Skills en compatibele Codex-hookmappen.

`openclaw plugins inspect <id>` rapporteert ook gedetecteerde bundelmogelijkheden plus ondersteunde of niet-ondersteunde MCP- en LSP-serververmeldingen voor bundelondersteunde plugins.

Marketplace-bronnen kunnen een bekende Claude-marketplacenaam uit `~/.claude/plugins/known_marketplaces.json` zijn, een lokale marketplace-root of `marketplace.json`-pad, een GitHub-afkorting zoals `owner/repo`, een GitHub-repo-URL of een git-URL. Voor externe marketplaces moeten pluginvermeldingen binnen de gekloonde marketplace-repo blijven en alleen relatieve padbronnen gebruiken.

Zie de [`openclaw plugins` CLI-referentie](/nl/cli/plugins) voor volledige details.

## Overzicht van de Plugin-API

Native plugins exporteren een entry-object dat `register(api)` beschikbaar stelt. Oudere plugins kunnen nog steeds `activate(api)` gebruiken als verouderde alias, maar nieuwe plugins moeten `register` gebruiken.

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

OpenClaw laadt het entry-object en roept `register(api)` aan tijdens pluginactivatie. De loader valt nog steeds terug op `activate(api)` voor oudere plugins, maar gebundelde plugins en nieuwe externe plugins moeten `register` als het publieke contract behandelen.

`api.registrationMode` vertelt een plugin waarom de entry wordt geladen:

| Modus           | Betekenis                                                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-activatie. Registreer tools, hooks, services, commando's, routes en andere live side effects.                                    |
| `discovery`     | Alleen-lezen ontdekking van mogelijkheden. Registreer providers en metadata; vertrouwde plugin-entrycode kan laden, maar sla live side effects over. |
| `setup-only`    | Laden van kanaalsetupmetadata via een lichtgewicht setup-entry.                                                                          |
| `setup-runtime` | Laden van kanaalsetup dat ook de runtime-entry nodig heeft.                                                                               |
| `cli-metadata`  | Alleen verzamelen van CLI-commandometadata.                                                                                               |

Plugin-entry's die sockets, databases, background workers of langlevende clients openen, moeten die side effects afschermen met `api.registrationMode === "full"`. Discovery-loads worden afzonderlijk gecachet van activerende loads en vervangen de draaiende Gateway-registratie niet. Discovery activeert niet, maar is niet importvrij: OpenClaw kan de vertrouwde plugin-entry of kanaalpluginmodule evalueren om de snapshot op te bouwen. Houd module-topniveaus lichtgewicht en vrij van side effects, en verplaats netwerkclients, sub-processen, listeners, credential-reads en servicestartup achter full-runtime-paden.

Veelgebruikte registratiemethoden:

| Methode                                 | Wat deze registreert                 |
| --------------------------------------- | ------------------------------------ |
| `registerProvider`                      | Modelprovider (LLM)                  |
| `registerChannel`                       | Chatkanaal                           |
| `registerTool`                          | Agenttool                            |
| `registerHook` / `on(...)`              | Lifecycle-hooks                      |
| `registerSpeechProvider`                | Tekst-naar-spraak / STT              |
| `registerRealtimeTranscriptionProvider` | Streaming-STT                        |
| `registerRealtimeVoiceProvider`         | Duplex realtime spraak               |
| `registerMediaUnderstandingProvider`    | Afbeeldings-/audioanalyse            |
| `registerImageGenerationProvider`       | Afbeeldingsgeneratie                 |
| `registerMusicGenerationProvider`       | Muziekgeneratie                      |
| `registerVideoGenerationProvider`       | Videogeneratie                       |
| `registerWebFetchProvider`              | Webfetch-/scrapeprovider             |
| `registerWebSearchProvider`             | Webzoekfunctie                       |
| `registerHttpRoute`                     | HTTP-endpoint                        |
| `registerCommand` / `registerCli`       | CLI-commando's                       |
| `registerContextEngine`                 | Contextengine                        |
| `registerService`                       | Achtergrondservice                   |

Guard-gedrag van hooks voor getypeerde lifecycle-hooks:

- `before_tool_call`: `{ block: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `before_tool_call`: `{ block: false }` is een no-op en wist geen eerdere blokkade.
- `before_install`: `{ block: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `before_install`: `{ block: false }` is een no-op en wist geen eerdere blokkade.
- `message_sending`: `{ cancel: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `message_sending`: `{ cancel: false }` is een no-op en wist geen eerdere annulering.

Native Codex app-server leidt Codex-native toolgebeurtenissen terug naar dit hookoppervlak. Plugins kunnen native Codex-tools blokkeren via `before_tool_call`, resultaten observeren via `after_tool_call` en deelnemen aan Codex-`PermissionRequest`-goedkeuringen. De bridge herschrijft Codex-native toolargumenten nog niet. De exacte grens voor Codex-runtimeondersteuning staat in het [ondersteuningscontract voor Codex harness v1](/nl/plugins/codex-harness#v1-support-contract).

Zie [SDK-overzicht](/nl/plugins/sdk-overview#hook-decision-semantics) voor volledig getypeerd hookgedrag.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins) - maak je eigen plugin
- [Plugin-bundels](/nl/plugins/bundles) - compatibiliteit met Codex/Claude/Cursor-bundels
- [Plugin-manifest](/nl/plugins/manifest) - manifestschema
- [Tools registreren](/nl/plugins/building-plugins#registering-agent-tools) - voeg agenttools toe in een plugin
- [Interne Plugin-werking](/nl/plugins/architecture) - capaciteitenmodel en laadpijplijn
- [Communityplugins](/nl/plugins/community) - vermeldingen van derden
