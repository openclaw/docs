---
read_when:
    - Plugins installeren of configureren
    - Plugin-detectie en laadregels begrijpen
    - Werken met Codex/Claude-compatibele Plugin-bundels
sidebarTitle: Install and Configure
summary: Installeer, configureer en beheer OpenClaw-plugins
title: Plugins
x-i18n:
    generated_at: "2026-05-06T09:37:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d68ad3cbd040d3f973d219cf273a792f11df382f6c4ccbf80c07acb0d26c658
    source_path: tools/plugin.md
    workflow: 16
---

Plugins breiden OpenClaw uit met nieuwe mogelijkheden: kanalen, modelproviders,
agent-harnassen, tools, skills, spraak, realtime transcriptie, realtime
voice, mediabegrip, afbeeldingsgeneratie, videogeneratie, webfetch, web
search en meer. Sommige plugins zijn **core** (meegeleverd met OpenClaw), andere
zijn **extern**. De meeste externe plugins worden gepubliceerd en ontdekt via
[ClawHub](/nl/tools/clawhub). Npm blijft ondersteund voor directe installaties en voor een
tijdelijke set pluginpakketten die eigendom zijn van OpenClaw terwijl die migratie wordt afgerond.

## Snelstart

Voor copy-pastevoorbeelden voor installeren, weergeven, verwijderen, bijwerken en publiceren, zie
[Plugins beheren](/nl/plugins/manage-plugins).

<Steps>
  <Step title="See what is loaded">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Install a plugin">
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

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    Configureer daarna onder `plugins.entries.\<id\>.config` in je configuratiebestand.

  </Step>

  <Step title="Chat-native management">
    In een draaiende Gateway activeren eigenaar-only `/plugins enable` en `/plugins disable`
    de configuratieherlader van de Gateway. De Gateway herlaadt plugin-runtime
    oppervlakken binnen het proces, en nieuwe agentbeurten bouwen hun toollijst opnieuw op vanuit het
    vernieuwde register. `/plugins install` wijzigt pluginbroncode, dus de
    Gateway vraagt om een herstart in plaats van te doen alsof het huidige proces
    reeds geïmporteerde modules veilig kan herladen.

  </Step>

  <Step title="Verify the plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Gebruik `--runtime` wanneer je geregistreerde tools, services, gateway
    methods, hooks of CLI-opdrachten die eigendom zijn van de plugin moet bewijzen. Gewone `inspect` is een koude
    manifest-/registercontrole en vermijdt bewust het importeren van plugin-runtime.

  </Step>
</Steps>

Als je de voorkeur geeft aan chat-native beheer, schakel `commands.plugins: true` in en gebruik:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Het installatiepad gebruikt dezelfde resolver als de CLI: lokaal pad/archief, expliciet
`clawhub:<pkg>`, expliciet `npm:<pkg>`, expliciet `npm-pack:<path.tgz>`,
expliciet `git:<repo>`, of een kale pakketspecificatie via npm.

Als configuratie ongeldig is, mislukt installatie normaal gesproken gesloten en verwijst naar
`openclaw doctor --fix`. De enige hersteluitzondering is een smal herinstallatiepad voor meegeleverde plugins
voor plugins die zich aanmelden voor
`openclaw.install.allowInvalidConfigRecovery`.
Tijdens het opstarten van de Gateway faalt ongeldige pluginconfiguratie gesloten zoals elke andere ongeldige
configuratie. Voer `openclaw doctor --fix` uit om de slechte pluginconfiguratie in quarantaine te plaatsen door
die pluginvermelding uit te schakelen en de ongeldige configuratiepayload te verwijderen; de normale
configuratieback-up bewaart de vorige waarden.
Wanneer een kanaalconfiguratie verwijst naar een plugin die niet langer vindbaar is maar dezelfde
verouderde plugin-id in pluginconfiguratie of installatierecords blijft staan, logt Gateway startup
waarschuwingen en slaat dat kanaal over in plaats van elk ander kanaal te blokkeren.
Voer `openclaw doctor --fix` uit om de verouderde kanaal-/pluginvermeldingen te verwijderen; onbekende
kanaalsleutels zonder bewijs voor verouderde plugins blijven validatie laten mislukken zodat typefouten
zichtbaar blijven.
Als `plugins.enabled: false` is ingesteld, worden verouderde pluginverwijzingen als inert behandeld:
Gateway startup slaat pluginontdekking/laadwerk over en `openclaw doctor` behoudt
de uitgeschakelde pluginconfiguratie in plaats van die automatisch te verwijderen. Schakel plugins opnieuw in voordat
je doctor-opruiming uitvoert als je verouderde plugin-id's verwijderd wilt hebben.

Installatie van pluginafhankelijkheden gebeurt alleen tijdens expliciete installatie-/update- of
doctor-reparatiestromen. Gateway startup, configuratieherladen en runtime-inspectie
voeren geen package managers uit en repareren geen afhankelijkheidsbomen. Lokale plugins moeten hun afhankelijkheden al
geïnstalleerd hebben, terwijl npm-, git- en ClawHub-plugins worden
geïnstalleerd onder de beheerde pluginroots van OpenClaw. npm-afhankelijkheden kunnen worden gehesen
binnen OpenClaw's beheerde npm-root; installatie/update scant die beheerde root vóór
vertrouwen en verwijderen verwijdert door npm beheerde pakketten via npm. Externe plugins
en aangepaste laadpaden moeten nog steeds worden geïnstalleerd via `openclaw plugins install`.
Gebruik `openclaw plugins list --json` om de statische `dependencyStatus` voor elke
zichtbare plugin te zien zonder runtimecode te importeren of afhankelijkheden te repareren.
Zie [Resolutie van pluginafhankelijkheden](/nl/plugins/dependency-resolution) voor de
levenscyclus tijdens installatie.

### Geblokkeerd eigenaarschap van pluginpad

Als plugindiagnostiek zegt
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
en configuratievalidatie volgt met `plugin present but blocked`, heeft OpenClaw
pluginbestanden gevonden die eigendom zijn van een andere Unix-gebruiker dan het proces dat ze laadt.
Laat de pluginconfiguratie staan; herstel het bestandssysteemeigenaarschap of voer
OpenClaw uit als dezelfde gebruiker die eigenaar is van de statusdirectory.

Voor Docker-installaties draait de officiële image als `node` (uid `1000`), dus de
host bind-mounted OpenClaw-configuratie- en werkruimtedirectories zouden normaal gesproken
eigendom moeten zijn van uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Als je OpenClaw bewust als root uitvoert, herstel dan de beheerde pluginroot naar
root-eigenaarschap:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Na het herstellen van eigenaarschap voer je `openclaw doctor --fix` opnieuw uit of
`openclaw plugins registry --refresh` zodat het opgeslagen pluginregister overeenkomt met
de herstelde bestanden.

Voor npm-installaties worden veranderlijke selectors zoals `latest` of een dist-tag vóór installatie
opgelost en daarna vastgezet op de exacte geverifieerde versie in OpenClaw's
beheerde npm-root. Nadat npm klaar is, verifieert OpenClaw dat de geïnstalleerde
`package-lock.json`-vermelding nog steeds overeenkomt met de opgeloste versie en integriteit. Als
npm andere pakketmetadata schrijft, mislukt de installatie en wordt het beheerde pakket
teruggedraaid in plaats van een ander pluginartefact te accepteren.

Bron-checkouts zijn pnpm-workspaces. Als je OpenClaw kloont om aan meegeleverde
plugins te werken, voer dan `pnpm install` uit; OpenClaw laadt meegeleverde plugins dan vanuit
`extensions/<id>` zodat wijzigingen en pakketlokale afhankelijkheden direct worden gebruikt.
Gewone npm-rootinstallaties zijn voor verpakte OpenClaw, niet voor ontwikkeling vanuit een bron-checkout.

## Plugin-typen

OpenClaw herkent twee pluginformaten:

| Formaat    | Hoe het werkt                                                      | Voorbeelden                                             |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------- |
| **Native** | `openclaw.plugin.json` + runtimemodule; voert in-process uit       | Officiële plugins, community-npm-pakketten              |
| **Bundle** | Codex/Claude/Cursor-compatibele indeling; gemapt naar OpenClaw-functies | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide verschijnen onder `openclaw plugins list`. Zie [Plugin Bundles](/nl/plugins/bundles) voor bundledetails.

Als je een native plugin schrijft, begin dan met [Plugins bouwen](/nl/plugins/building-plugins)
en het [Plugin SDK-overzicht](/nl/plugins/sdk-overview).

## Package-entrypoints

Native plugin-npm-pakketten moeten `openclaw.extensions` declareren in `package.json`.
Elke vermelding moet binnen de pakketdirectory blijven en naar een leesbaar
runtimebestand resolven, of naar een TypeScript-bronbestand met een afgeleide gebouwde JavaScript
peer zoals `src/index.ts` naar `dist/index.js`.
Verpakte installaties moeten die JavaScript-runtimeoutput meeleveren. De TypeScript
bronfallback is voor bron-checkouts en lokale ontwikkelpaden, niet voor
npm-pakketten die in OpenClaw's beheerde pluginroot zijn geïnstalleerd.

Als een waarschuwing voor een beheerd pakket zegt dat het `requires compiled runtime output for
TypeScript entry ...`, dan is het pakket gepubliceerd zonder de JavaScript-bestanden
die OpenClaw tijdens runtime nodig heeft. Dat is een pluginverpakkingsprobleem, geen lokaal configuratieprobleem.
Werk de plugin bij of installeer hem opnieuw nadat de uitgever gecompileerde
JavaScript opnieuw heeft gepubliceerd, of schakel die plugin uit/verwijder hem totdat er een gerepareerd pakket beschikbaar is.

Gebruik `openclaw.runtimeExtensions` wanneer gepubliceerde runtimebestanden niet op
dezelfde paden staan als de bronvermeldingen. Indien aanwezig moet `runtimeExtensions` exact
één vermelding bevatten voor elke `extensions`-vermelding. Niet-overeenkomende lijsten laten installatie en
pluginontdekking mislukken in plaats van stil terug te vallen op bronpaden. Als je ook
`openclaw.setupEntry` publiceert, gebruik dan `openclaw.runtimeSetupEntry` voor de gebouwde
JavaScript peer; dat bestand is vereist wanneer gedeclareerd.

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
OpenClaw-releases bundelen al veel officiële plugins, dus die hebben in normale setups geen
aparte npm-installaties nodig. Totdat elke plugin die eigendom is van OpenClaw
naar ClawHub is gemigreerd, levert OpenClaw nog steeds enkele `@openclaw/*`-pluginpakketten op
npm voor oudere/aangepaste installaties en directe npm-workflows.

Als npm een `@openclaw/*`-pluginpakket als deprecated meldt, komt die pakketversie
uit een oudere externe pakketlijn. Gebruik de meegeleverde plugin uit
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
  <Accordion title="Model providers (enabled by default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` - meegeleverde geheugenzoekfunctie (standaard via `plugins.slots.memory`)
    - `memory-lancedb` - langetermijngeheugen ondersteund door LanceDB met automatische recall/capture (stel `plugins.slots.memory = "memory-lancedb"` in)

    Zie [Memory LanceDB](/nl/plugins/memory-lancedb) voor OpenAI-compatibele
    embeddingconfiguratie, Ollama-voorbeelden, ophaallimieten en probleemoplossing.

  </Accordion>

  <Accordion title="Spraakproviders (standaard ingeschakeld)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Overig">
    - `browser` - gebundelde browserplugin voor de browsertool, de `openclaw browser` CLI, de Gateway-methode `browser.request`, de browserruntime en de standaard browserbesturingsservice (standaard ingeschakeld; schakel deze uit voordat je hem vervangt)
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

| Veld               | Beschrijving                                             |
| ------------------ | -------------------------------------------------------- |
| `enabled`          | Hoofdschakelaar (standaard: `true`)                      |
| `allow`            | Plugin-toestaanlijst (optioneel)                         |
| `bundledDiscovery` | Detectiemodus voor gebundelde plugins (standaard `allowlist`) |
| `deny`             | Plugin-weigerlijst (optioneel; weigeren wint)            |
| `load.paths`       | Extra pluginbestanden/-mappen                            |
| `slots`            | Exclusieve slotselectoren (bijv. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Schakelaars per plugin + configuratie                    |

`plugins.allow` is exclusief. Wanneer deze niet leeg is, kunnen alleen vermelde plugins laden
of tools beschikbaar maken, zelfs als `tools.allow` `"*"` of een specifieke toolnaam
van een plugin bevat. Als een tool-toestaanlijst naar plugintools verwijst, voeg dan de eigenaars-plugin-id's
toe aan `plugins.allow` of verwijder `plugins.allow`; `openclaw doctor` waarschuwt voor deze
vorm.

`plugins.bundledDiscovery` is standaard `"allowlist"` voor nieuwe configuraties, zodat een
restrictieve `plugins.allow`-inventaris ook weggelaten gebundelde providerplugins blokkeert,
inclusief runtime-detectie van webzoekproviders. Doctor stempelt oudere
restrictieve toestaanlijstconfiguraties tijdens migratie met `"compat"`, zodat upgrades het
verouderde gedrag van gebundelde providers behouden totdat de operator voor de strengere modus kiest.
Een lege `plugins.allow` wordt nog steeds behandeld als niet ingesteld/open.

Configuratiewijzigingen via `/plugins enable` of `/plugins disable` activeren een
in-process herlaadactie van Gateway-plugins. Nieuwe agentbeurten bouwen hun toollijst opnieuw op vanuit
het vernieuwde pluginregister. Bronwijzigende bewerkingen zoals installeren,
bijwerken en verwijderen herstarten nog steeds het Gateway-proces, omdat reeds geïmporteerde
pluginmodules niet veilig ter plekke kunnen worden vervangen.

`openclaw plugins list` is een lokale snapshot van het pluginregister/de configuratie. Een
`enabled` plugin daar betekent dat het opgeslagen register en de huidige configuratie toestaan dat de
plugin deelneemt. Het bewijst niet dat een al draaiende externe Gateway
opnieuw is geladen of herstart met dezelfde plugincode. Stuur bij VPS-/containeropstellingen
met wrapperprocessen herstarts of schrijfacties die herladen activeren naar het daadwerkelijke
`openclaw gateway run`-proces, of gebruik `openclaw gateway restart` tegen de
draaiende Gateway wanneer de herlaadactie een fout meldt.

<Accordion title="Plugin-statussen: uitgeschakeld vs ontbrekend vs ongeldig">
  - **Uitgeschakeld**: plugin bestaat, maar activeringsregels hebben hem uitgezet. Configuratie blijft behouden.
  - **Ontbrekend**: configuratie verwijst naar een plugin-id die de detectie niet heeft gevonden.
  - **Ongeldig**: plugin bestaat, maar de configuratie komt niet overeen met het gedeclareerde schema. Gateway-start slaat alleen die plugin over; `openclaw doctor --fix` kan de ongeldige vermelding in quarantaine plaatsen door hem uit te schakelen en de configuratiepayload te verwijderen.

</Accordion>

## Detectie en voorrang

OpenClaw scant naar plugins in deze volgorde (eerste overeenkomst wint):

<Steps>
  <Step title="Configuratiepaden">
    `plugins.load.paths` - expliciete bestands- of mappaden. Paden die terugverwijzen
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
    Andere vereisen expliciete inschakeling.
  </Step>
</Steps>

Verpakte installaties en Docker-images lossen gebundelde plugins normaal op vanuit de
gecompileerde `dist/extensions`-boom. Als een bronmap van een gebundelde plugin
wordt bind-mounted over het overeenkomende verpakte bronpad, bijvoorbeeld
`/app/extensions/synology-chat`, behandelt OpenClaw die gekoppelde bronmap
als een gebundelde bronoverlay en detecteert deze vóór de verpakte
`/app/dist/extensions/synology-chat`-bundel. Dit houdt maintainer-containerlussen
werkend zonder elke gebundelde plugin terug te schakelen naar TypeScript-bron.
Stel `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` in om verpakte dist-bundels af te dwingen,
zelfs wanneer bronoverlay-mounts aanwezig zijn.

### Activeringsregels

- `plugins.enabled: false` schakelt alle plugins uit en slaat plugin-detectie/laadwerk over
- `plugins.deny` wint altijd van allow
- `plugins.entries.\<id\>.enabled: false` schakelt die plugin uit
- Plugins afkomstig uit de workspace zijn **standaard uitgeschakeld** (moeten expliciet worden ingeschakeld)
- Gebundelde plugins volgen de ingebouwde standaard-aan-set, tenzij overschreven
- Exclusieve slots kunnen de geselecteerde plugin voor die slot geforceerd inschakelen
- Sommige gebundelde opt-in-plugins worden automatisch ingeschakeld wanneer de configuratie een
  oppervlak noemt dat eigendom is van een plugin, zoals een providermodelreferentie, kanaalconfiguratie of harness-
  runtime
- Verouderde pluginconfiguratie blijft behouden zolang `plugins.enabled: false` actief is;
  schakel plugins opnieuw in voordat je doctor-opruiming uitvoert als je verouderde id's wilt verwijderen
- OpenAI-familie Codex-routes houden afzonderlijke plugingrenzen aan:
  `openai-codex/*` hoort bij de OpenAI-plugin, terwijl de gebundelde Codex
  app-serverplugin wordt geselecteerd door `agentRuntime.id: "codex"` of verouderde
  `codex/*`-modelreferenties

## Probleemoplossing voor runtimehooks

Als een plugin in `plugins list` verschijnt maar neveneffecten of hooks van `register(api)`
niet worden uitgevoerd in live chatverkeer, controleer dan eerst dit:

- Voer `openclaw gateway status --deep --require-rpc` uit en bevestig dat de actieve
  Gateway-URL, het profiel, het configuratiepad en het proces degene zijn die je bewerkt.
- Herstart de live Gateway na wijzigingen in plugininstallatie/configuratie/code. In wrapper-
  containers kan PID 1 alleen een supervisor zijn; herstart of signaleer het onderliggende
  `openclaw gateway run`-proces.
- Gebruik `openclaw plugins inspect <id> --runtime --json` om hookregistraties en
  diagnostiek te bevestigen. Niet-gebundelde gesprekshooks zoals `llm_input`,
  `llm_output`, `before_agent_finalize` en `agent_end` hebben
  `plugins.entries.<id>.hooks.allowConversationAccess=true` nodig.
- Geef voor modelwisseling de voorkeur aan `before_model_resolve`. Dit wordt uitgevoerd vóór model-
  resolutie voor agentbeurten; `llm_output` wordt alleen uitgevoerd nadat een modelpoging
  assistant-uitvoer produceert.
- Gebruik voor bewijs van het effectieve sessiemodel `openclaw sessions` of de
  Gateway-sessie/statusoppervlakken en start, bij het debuggen van providerpayloads, de
  Gateway met `--raw-stream --raw-stream-path <path>`.

### Trage installatie van plugintools

Als agentbeurten lijken te blijven hangen tijdens het voorbereiden van tools, schakel trace-logging in en
controleer op timingregels voor plugintool-factories:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Zoek naar:

```text
[trace:plugin-tools] factory timings ...
```

De samenvatting vermeldt de totale factorytijd en de traagste plugintool-factories,
inclusief plugin-id, gedeclareerde toolnamen, resultaatvorm en of de tool
optioneel is. Trage regels worden gepromoveerd tot waarschuwingen wanneer één factory
minstens 1 s duurt of de totale voorbereiding van plugintool-factories minstens 5 s duurt.

OpenClaw cachet succesvolle resultaten van plugintool-factories voor herhaalde resoluties
met dezelfde effectieve aanvraagcontext. De cachesleutel omvat de effectieve
runtimeconfiguratie, workspace, agent-/sessie-id's, sandboxbeleid, browserinstellingen,
bezorgcontext, aanvrageridentiteit en eigendomsstatus, zodat factories die
afhangen van die vertrouwde velden opnieuw worden uitgevoerd wanneer de context wijzigt.

Als één plugin de timing domineert, inspecteer dan de runtimeregistraties:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Werk die plugin daarna bij, installeer hem opnieuw of schakel hem uit. Pluginauteurs moeten
duur laden van afhankelijkheden verplaatsen naar het uitvoeringspad van de tool in plaats van dit
binnen de toolfactory te doen.

### Dubbel kanaal- of tool-eigenaarschap

Symptomen:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Deze betekenen dat meer dan één ingeschakelde plugin hetzelfde kanaal,
installatieproces of dezelfde toolnaam probeert te bezitten. De meest voorkomende oorzaak is een externe kanaalplugin
die naast een gebundelde plugin is geïnstalleerd die nu dezelfde kanaal-id biedt.

Debugstappen:

- Voer `openclaw plugins list --enabled --verbose` uit om elke ingeschakelde plugin
  en oorsprong te zien.
- Voer `openclaw plugins inspect <id> --runtime --json` uit voor elke verdachte plugin en
  vergelijk `channels`, `channelConfigs`, `tools` en diagnostiek.
- Voer `openclaw plugins registry --refresh` uit na het installeren of verwijderen van
  pluginpakketten, zodat opgeslagen metadata de huidige installatie weerspiegelt.
- Herstart de Gateway na installatie-, register- of configuratiewijzigingen.

Oplossingsopties:

- Als één plugin bewust een andere vervangt voor dezelfde kanaal-id, moet de
  voorkeursplugin `channelConfigs.<channel-id>.preferOver` declareren met
  de plugin-id met lagere prioriteit. Zie [/plugins/manifest#replacing-another-channel-plugin](/nl/plugins/manifest#replacing-another-channel-plugin).
- Als het duplicaat per ongeluk is, schakel dan één kant uit met
  `plugins.entries.<plugin-id>.enabled: false` of verwijder de verouderde plugin-
  installatie.
- Als je beide plugins expliciet hebt ingeschakeld, behoudt OpenClaw dat verzoek en
  meldt het conflict. Kies één eigenaar voor het kanaal of hernoem tools die eigendom zijn
  van plugins, zodat het runtimeoppervlak ondubbelzinnig is.

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
| `memory`        | Active Memory-plugin  | `memory-core`       |
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

Gebundelde plugins worden met OpenClaw meegeleverd. Veel zijn standaard ingeschakeld (bijvoorbeeld
gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browser-
Plugin). Andere gebundelde plugins vereisen nog steeds `openclaw plugins enable <id>`.

`--force` overschrijft een bestaande geinstalleerde Plugin of hookpack op zijn plaats. Gebruik
`openclaw plugins update <id-or-npm-spec>` voor routinematige upgrades van gevolgde npm-
plugins. Dit wordt niet ondersteund met `--link`, dat het bronpad hergebruikt in plaats
van over een beheerd installatiedoel heen te kopieren.

Wanneer `plugins.allow` al is ingesteld, voegt `openclaw plugins install` de
geinstalleerde Plugin-id toe aan die allowlist voordat deze wordt ingeschakeld. Als dezelfde Plugin-id
aanwezig is in `plugins.deny`, verwijdert install die verouderde deny-vermelding zodat de
expliciete installatie direct laadbaar is na herstart.

OpenClaw bewaart een persistente lokale Plugin-registry als cold-readmodel voor
Plugin-inventaris, eigenaarschap van bijdragen en opstartplanning. Installatie-, update-,
deinstallatie-, inschakel- en uitschakelflows vernieuwen die registry nadat de Plugin-
status is gewijzigd. Hetzelfde bestand `plugins/installs.json` bewaart duurzame installatiemetadata in
`installRecords` op topniveau en opnieuw opbouwbare manifestmetadata in `plugins`. Als
de registry ontbreekt, verouderd of ongeldig is, bouwt `openclaw plugins registry
--refresh` de manifestweergave opnieuw op vanuit installatierecords, configuratiebeleid en
manifest-/pakketmetadata zonder Plugin-runtimemodules te laden.
`openclaw plugins update <id-or-npm-spec>` is van toepassing op gevolgde installaties. Het doorgeven
van een npm-pakketspecificatie met een dist-tag of exacte versie herleidt de pakketnaam
terug naar het gevolgde Plugin-record en registreert de nieuwe specificatie voor toekomstige updates.
Het doorgeven van de pakketnaam zonder versie zet een exact vastgezette installatie terug naar
de standaard releaselijn van de registry. Als de geinstalleerde npm-Plugin al overeenkomt met
de opgeloste versie en geregistreerde artifact-identiteit, slaat OpenClaw de update over
zonder te downloaden, opnieuw te installeren of configuratie te herschrijven.
Wanneer `openclaw update` op het beta-kanaal draait, proberen standaardlijn-npm- en ClawHub-
Plugin-records eerst `@beta` en vallen ze terug op default/latest wanneer er geen Plugin-
beta-release bestaat. Exacte versies en expliciete tags blijven vastgezet.

`--pin` is alleen voor npm. Het wordt niet ondersteund met `--marketplace`, omdat
marketplace-installaties marketplace-bronmetadata bewaren in plaats van een npm-specificatie.

`--dangerously-force-unsafe-install` is een break-glass-override voor fout-positieven
van de ingebouwde scanner voor gevaarlijke code. Hiermee kunnen Plugin-installaties
en Plugin-updates doorgaan voorbij ingebouwde `critical`-bevindingen, maar het omzeilt nog steeds
geen Plugin-`before_install`-beleidsblokkades of blokkering door scanfouten.
Installatiescans negeren veelgebruikte testbestanden en mappen zoals `tests/`,
`__tests__/`, `*.test.*` en `*.spec.*` om blokkering door verpakte testmocks te voorkomen;
gedeclareerde Plugin-runtime-entrypoints worden nog steeds gescand, zelfs als ze een van
die namen gebruiken.

Deze CLI-vlag is alleen van toepassing op Plugin-installatie-/updateflows. Gateway-ondersteunde Skills-
dependency-installaties gebruiken in plaats daarvan de overeenkomende `dangerouslyForceUnsafeInstall`-request-
override, terwijl `openclaw skills install` de afzonderlijke ClawHub-
download-/installatieflow voor Skills blijft.

Als een Plugin die je op ClawHub hebt gepubliceerd verborgen is of door een scan wordt geblokkeerd, open dan het
ClawHub-dashboard of voer `clawhub package rescan <name>` uit om ClawHub te vragen
deze opnieuw te controleren. `--dangerously-force-unsafe-install` heeft alleen invloed op installaties op je eigen
machine; het vraagt ClawHub niet om de Plugin opnieuw te scannen of een geblokkeerde release
publiek te maken.

Compatibele bundels nemen deel aan dezelfde Plugin-lijst-/inspectie-/inschakel-/uitschakel-
flow. Huidige runtime-ondersteuning omvat bundel-Skills, Claude-command-Skills,
Claude-standaardwaarden voor `settings.json`, Claude-standaardwaarden voor `.lsp.json` en in het manifest gedeclareerde
`lspServers`, Cursor-command-Skills en compatibele Codex-hook-
mappen.

`openclaw plugins inspect <id>` rapporteert ook gedetecteerde bundelmogelijkheden plus
ondersteunde of niet-ondersteunde MCP- en LSP-serververmeldingen voor bundelondersteunde plugins.

Marketplace-bronnen kunnen een bekende marketplace-naam van Claude zijn uit
`~/.claude/plugins/known_marketplaces.json`, een lokale marketplace-root of
`marketplace.json`-pad, een GitHub-afkorting zoals `owner/repo`, een GitHub-repo-
URL, of een git-URL. Voor externe marketplaces moeten Plugin-vermeldingen binnen de
gekloonde marketplace-repo blijven en alleen relatieve padbronnen gebruiken.

Zie de [`openclaw plugins` CLI-referentie](/nl/cli/plugins) voor volledige details.

## Overzicht van de Plugin-API

Native plugins exporteren een entry-object dat `register(api)` beschikbaar maakt. Oudere
plugins kunnen nog steeds `activate(api)` gebruiken als legacy-alias, maar nieuwe plugins zouden
`register` moeten gebruiken.

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
activatie. De loader valt voor oudere plugins nog steeds terug op `activate(api)`,
maar gebundelde plugins en nieuwe externe plugins zouden `register` als het
publieke contract moeten behandelen.

`api.registrationMode` vertelt een Plugin waarom de entry wordt geladen:

| Modus           | Betekenis                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-activatie. Registreer tools, hooks, services, commands, routes en andere live neveneffecten.                              |
| `discovery`     | Alleen-lezen capability-discovery. Registreer providers en metadata; vertrouwde Plugin-entrycode kan laden, maar sla live neveneffecten over. |
| `setup-only`    | Laden van kanaalsetupmetadata via een lichtgewicht setup-entry.                                                                  |
| `setup-runtime` | Laden van kanaalsetup waarvoor ook de runtime-entry nodig is.                                                                     |
| `cli-metadata`  | Alleen verzameling van CLI-commandmetadata.                                                                                       |

Plugin-entries die sockets, databases, achtergrondwerkers of langlevende
clients openen, zouden die neveneffecten moeten bewaken met `api.registrationMode === "full"`.
Discovery-loads worden afzonderlijk gecachet van activerende loads en vervangen
de draaiende Gateway-registry niet. Discovery is niet-activerend, niet importvrij:
OpenClaw kan de vertrouwde Plugin-entry of kanaal-Plugin-module evalueren om
de snapshot te bouwen. Houd moduletopniveaus lichtgewicht en vrij van neveneffecten, en verplaats
netwerkclients, subprocessen, listeners, credential-reads en service-opstart
achter full-runtime-paden.

Veelgebruikte registratiemethoden:

| Methode                                 | Wat deze registreert           |
| --------------------------------------- | ------------------------------ |
| `registerProvider`                      | Modelprovider (LLM)            |
| `registerChannel`                       | Chatkanaal                     |
| `registerTool`                          | Agent-tool                     |
| `registerHook` / `on(...)`              | Lifecycle-hooks                |
| `registerSpeechProvider`                | Tekst-naar-spraak / STT        |
| `registerRealtimeTranscriptionProvider` | Streaming-STT                  |
| `registerRealtimeVoiceProvider`         | Duplex realtime voice          |
| `registerMediaUnderstandingProvider`    | Beeld-/audioanalyse            |
| `registerImageGenerationProvider`       | Beeldgeneratie                 |
| `registerMusicGenerationProvider`       | Muziekgeneratie                |
| `registerVideoGenerationProvider`       | Videogeneratie                 |
| `registerWebFetchProvider`              | Webfetch-/scrapeprovider       |
| `registerWebSearchProvider`             | Webzoekopdracht                |
| `registerHttpRoute`                     | HTTP-endpoint                  |
| `registerCommand` / `registerCli`       | CLI-commands                   |
| `registerContextEngine`                 | Context-engine                 |
| `registerService`                       | Achtergrondservice             |

Guardgedrag van hooks voor getypeerde lifecycle-hooks:

- `before_tool_call`: `{ block: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `before_tool_call`: `{ block: false }` is een no-op en wist een eerdere blokkade niet.
- `before_install`: `{ block: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `before_install`: `{ block: false }` is een no-op en wist een eerdere blokkade niet.
- `message_sending`: `{ cancel: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `message_sending`: `{ cancel: false }` is een no-op en wist een eerdere annulering niet.

De native Codex-appserver koppelt Codex-native tool-events terug naar dit
hook-oppervlak. Plugins kunnen native Codex-tools blokkeren via `before_tool_call`,
resultaten observeren via `after_tool_call` en deelnemen aan Codex-
`PermissionRequest`-goedkeuringen. De bridge herschrijft Codex-native tool-
argumenten nog niet. De exacte grens van Codex-runtimeondersteuning staat in het
[Codex harness v1-ondersteuningscontract](/nl/plugins/codex-harness#v1-support-contract).

Zie voor volledig getypeerd hookgedrag het [SDK-overzicht](/nl/plugins/sdk-overview#hook-decision-semantics).

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins) - maak je eigen plugin
- [Pluginbundels](/nl/plugins/bundles) - compatibiliteit met Codex/Claude/Cursor-bundels
- [Pluginmanifest](/nl/plugins/manifest) - manifestschema
- [Tools registreren](/nl/plugins/building-plugins#registering-agent-tools) - voeg agenttools toe in een plugin
- [Plugin-internals](/nl/plugins/architecture) - capabilitymodel en laadpipeline
- [Communityplugins](/nl/plugins/community) - vermeldingen van derden
