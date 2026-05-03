---
read_when:
    - Plugins installeren of configureren
    - Plugin-detectie en laadregels begrijpen
    - Werken met Codex/Claude-compatibele Plugin-bundels
sidebarTitle: Install and Configure
summary: Installeer, configureer en beheer OpenClaw-plugins
title: Plugins
x-i18n:
    generated_at: "2026-05-03T21:38:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e3cffc15c5c52dd539e21103c207c9e38955f9fd3acd561a52964eefafb8f0
    source_path: tools/plugin.md
    workflow: 16
---

Plugins breiden OpenClaw uit met nieuwe mogelijkheden: kanalen, modelproviders,
agent-harnassen, tools, Skills, spraak, realtime transcriptie, realtime
spraak, mediabegrip, beeldgeneratie, videogeneratie, web-fetch, web
search en meer. Sommige plugins zijn **kernplugins** (meegeleverd met OpenClaw),
andere zijn **extern**. De meeste externe plugins worden gepubliceerd en ontdekt via
[ClawHub](/nl/tools/clawhub). Npm blijft ondersteund voor directe installaties en voor een
tijdelijke set pluginpakketten in eigendom van OpenClaw terwijl die migratie wordt afgerond.

## Snelstart

Voor voorbeelden voor kopieren en plakken van installeren, weergeven, verwijderen, bijwerken en publiceren, zie
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

    Configureer daarna onder `plugins.entries.\<id\>.config` in je configuratiebestand.

  </Step>

  <Step title="Chat-native beheer">
    In een draaiende Gateway activeren `/plugins enable` en `/plugins disable`, alleen voor eigenaars,
    de configuratie-herlader van de Gateway. De Gateway herlaadt runtime-oppervlakken van plugins
    in het proces, en nieuwe agent-beurten bouwen hun toollijst opnieuw op vanuit het
    vernieuwde register. `/plugins install` wijzigt de broncode van plugins, dus de
    Gateway vraagt in plaats daarvan om een herstart, in plaats van te doen alsof het huidige proces
    al geimporteerde modules veilig kan herladen.

  </Step>

  <Step title="Verifieer de plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Gebruik `--runtime` wanneer je geregistreerde tools, services, gateway-
    methoden, hooks of CLI-opdrachten in eigendom van de plugin moet bewijzen. Gewone `inspect` is een koude
    manifest-/registercontrole en vermijdt bewust het importeren van de pluginruntime.

  </Step>
</Steps>

Als je de voorkeur geeft aan chat-native besturing, schakel dan `commands.plugins: true` in en gebruik:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Het installatiepad gebruikt dezelfde resolver als de CLI: lokaal pad/archief, expliciet
`clawhub:<pkg>`, expliciet `npm:<pkg>`, expliciet `git:<repo>`, of kale pakketspecificatie
via npm.

Als de configuratie ongeldig is, faalt installatie normaal gesloten en wijst je op
`openclaw doctor --fix`. De enige hersteluitzondering is een smal herinstallatiepad voor gebundelde plugins
voor plugins die zich aanmelden voor
`openclaw.install.allowInvalidConfigRecovery`.
Tijdens het starten van de Gateway faalt ongeldige pluginconfiguratie gesloten zoals elke andere ongeldige
configuratie. Voer `openclaw doctor --fix` uit om de slechte pluginconfiguratie in quarantaine te plaatsen door
die pluginvermelding uit te schakelen en de ongeldige configuratiepayload te verwijderen; de normale
configuratieback-up behoudt de vorige waarden.
Wanneer een kanaalconfiguratie verwijst naar een plugin die niet langer vindbaar is, maar dezelfde
verouderde plugin-id in pluginconfiguratie of installatierecords blijft staan, logt de Gateway
waarschuwingen en slaat dat kanaal over in plaats van elk ander kanaal te blokkeren.
Voer `openclaw doctor --fix` uit om de verouderde kanaal-/pluginvermeldingen te verwijderen; onbekende
kanaalsleutels zonder bewijs van een verouderde plugin blijven validatie laten falen, zodat typefouten
zichtbaar blijven.
Als `plugins.enabled: false` is ingesteld, worden verouderde pluginverwijzingen als inert behandeld:
het starten van de Gateway slaat pluginontdekking/-laadwerk over en `openclaw doctor` behoudt
de uitgeschakelde pluginconfiguratie in plaats van die automatisch te verwijderen. Schakel plugins opnieuw in voordat
je doctor-opruiming uitvoert als je verouderde plugin-id's wilt verwijderen.

Installatie van plugin-afhankelijkheden gebeurt alleen tijdens expliciete installatie-/bijwerk- of
doctor-herstelstromen. Gateway-start, configuratieherlaad en runtime-inspectie voeren
geen pakketbeheerders uit en herstellen geen afhankelijkheidsbomen. Lokale plugins moeten hun afhankelijkheden al
geinstalleerd hebben, terwijl npm-, git- en ClawHub-plugins worden geinstalleerd onder de beheerde pluginroots
van OpenClaw. npm-afhankelijkheden kunnen worden gehesen binnen de beheerde npm-root van OpenClaw; installatie/bijwerken scant die beheerde root voordat er vertrouwen is, en verwijderen verwijdert npm-beheerde pakketten via npm. Externe plugins
en aangepaste laadpaden moeten nog steeds via `openclaw plugins install` worden geinstalleerd.
Gebruik `openclaw plugins list --json` om de statische `dependencyStatus` voor elke
zichtbare plugin te zien zonder runtimecode te importeren of afhankelijkheden te herstellen.
Zie [Resolutie van plugin-afhankelijkheden](/nl/plugins/dependency-resolution) voor de
levenscyclus tijdens installatie.

Voor npm-installaties worden veranderlijke selectors zoals `latest` of een dist-tag opgelost
voor installatie en daarna vastgezet op de exact geverifieerde versie in de beheerde npm-root
van OpenClaw. Nadat npm klaar is, verifieert OpenClaw dat de geinstalleerde
`package-lock.json`-vermelding nog steeds overeenkomt met de opgeloste versie en integriteit. Als
npm andere pakketmetadata schrijft, faalt de installatie en wordt het beheerde pakket
teruggedraaid in plaats van een ander pluginartefact te accepteren.

Bron-checkouts zijn pnpm-workspaces. Als je OpenClaw kloont om aan gebundelde
plugins te werken, voer dan `pnpm install` uit; OpenClaw laadt gebundelde plugins dan vanuit
`extensions/<id>`, zodat bewerkingen en pakketlokale afhankelijkheden direct worden gebruikt.
Gewone npm-rootinstallaties zijn voor verpakte OpenClaw, niet voor ontwikkeling met bron-checkouts.

## Plugin-typen

OpenClaw herkent twee pluginformaten:

| Formaat    | Hoe het werkt                                                      | Voorbeelden                                             |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------- |
| **Native** | `openclaw.plugin.json` + runtimemodule; wordt in-process uitgevoerd | Officiele plugins, community-npm-pakketten              |
| **Bundel** | Codex/Claude/Cursor-compatibele indeling; toegewezen aan OpenClaw-functies | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide verschijnen onder `openclaw plugins list`. Zie [Plugin-bundels](/nl/plugins/bundles) voor bundeldetails.

Als je een native plugin schrijft, begin dan met [Plugins bouwen](/nl/plugins/building-plugins)
en het [Overzicht van de Plugin-SDK](/nl/plugins/sdk-overview).

## Pakket-entrypoints

Native plugin-npm-pakketten moeten `openclaw.extensions` declareren in `package.json`.
Elke vermelding moet binnen de pakketdirectory blijven en oplossen naar een leesbaar
runtimebestand, of naar een TypeScript-bronbestand met een afgeleide gebouwde JavaScript-
peer zoals `src/index.ts` naar `dist/index.js`.
Verpakte installaties moeten die JavaScript-runtimeoutput meeleveren. De TypeScript-
bronfallback is voor bron-checkouts en lokale ontwikkelpaden, niet voor
npm-pakketten die in de beheerde pluginroot van OpenClaw zijn geinstalleerd.

Gebruik `openclaw.runtimeExtensions` wanneer gepubliceerde runtimebestanden niet op
dezelfde paden staan als de bronvermeldingen. Wanneer aanwezig, moet `runtimeExtensions`
precies een vermelding bevatten voor elke `extensions`-vermelding. Niet-overeenkomende lijsten laten installatie en
pluginontdekking falen in plaats van stilzwijgend terug te vallen op bronpaden. Als je ook
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

### Npm-pakketten in eigendom van OpenClaw tijdens migratie

ClawHub is het primaire distributiepad voor de meeste plugins. Huidige verpakte
OpenClaw-releases bundelen al veel officiele plugins, dus die hebben in normale setups geen
aparte npm-installaties nodig. Totdat elke plugin in eigendom van OpenClaw naar
ClawHub is gemigreerd, levert OpenClaw nog steeds enkele `@openclaw/*` pluginpakketten op
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

### Kern (meegeleverd met OpenClaw)

<AccordionGroup>
  <Accordion title="Modelproviders (standaard ingeschakeld)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Geheugenplugins">
    - `memory-core` — gebundelde geheugenzoekfunctie (standaard via `plugins.slots.memory`)
    - `memory-lancedb` — langetermijngeheugen ondersteund door LanceDB met automatische recall/capture (stel `plugins.slots.memory = "memory-lancedb"` in)

    Zie [Memory LanceDB](/nl/plugins/memory-lancedb) voor OpenAI-compatibele
    embeddingsetup, Ollama-voorbeelden, recall-limieten en probleemoplossing.

  </Accordion>

  <Accordion title="Spraakproviders (standaard ingeschakeld)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Overig">
    - `browser` — gebundelde browserplugin voor de browsertool, `openclaw browser` CLI, gatewaymethode `browser.request`, browserruntime en standaard browserbesturingsservice (standaard ingeschakeld; schakel uit voordat je deze vervangt)
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

| Veld            | Beschrijving                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Hoofdschakelaar (standaard: `true`)                           |
| `allow`          | Plugin-allowlist (optioneel)                               |
| `deny`           | Plugin-denylist (optioneel; deny wint)                     |
| `load.paths`     | Extra pluginbestanden/-mappen                            |
| `slots`          | Exclusieve slotselectoren (bijv. `memory`, `contextEngine`) |
| `entries.\<id\>` | Schakelaars + config per plugin                               |

`plugins.allow` is exclusief. Wanneer deze niet leeg is, kunnen alleen vermelde plugins laden
of tools beschikbaar stellen, zelfs als `tools.allow` `"*"` of een specifieke toolnaam van een plugin
bevat. Als een tool-allowlist verwijst naar plugintools, voeg dan de ids van de eigenaarplugins
toe aan `plugins.allow` of verwijder `plugins.allow`; `openclaw doctor` waarschuwt voor deze
vorm.

Configwijzigingen die via `/plugins enable` of `/plugins disable` worden gedaan, activeren een
in-process herlaadactie van Gateway-plugins. Nieuwe agentbeurten bouwen hun toollijst opnieuw op uit
het vernieuwde pluginregister. Bewerkingen die bronnen wijzigen, zoals installeren,
bijwerken en verwijderen, herstarten nog steeds het Gateway-proces, omdat al geimporteerde
pluginmodules niet veilig ter plekke kunnen worden vervangen.

`openclaw plugins list` is een lokale snapshot van het pluginregister/de config. Een
`enabled` plugin daar betekent dat het opgeslagen register en de huidige config toestaan dat de
plugin meedoet. Het bewijst niet dat een al draaiende externe Gateway
opnieuw is geladen of herstart met dezelfde plugincode. Bij VPS-/containeropstellingen
met wrapperprocessen moet je herstarts of schrijfacties die herladen activeren naar het daadwerkelijke
`openclaw gateway run`-proces sturen, of `openclaw gateway restart` gebruiken tegen de
draaiende Gateway wanneer het herladen een fout meldt.

<Accordion title="Pluginstatussen: uitgeschakeld vs ontbrekend vs ongeldig">
  - **Uitgeschakeld**: plugin bestaat, maar activeringsregels hebben deze uitgezet. Config blijft behouden.
  - **Ontbrekend**: config verwijst naar een plugin-id die discovery niet heeft gevonden.
  - **Ongeldig**: plugin bestaat, maar de config komt niet overeen met het gedeclareerde schema. Gateway-start slaat alleen die plugin over; `openclaw doctor --fix` kan de ongeldige vermelding in quarantaine plaatsen door deze uit te schakelen en de configpayload te verwijderen.

</Accordion>

## Discovery en voorrang

OpenClaw scant in deze volgorde naar plugins (eerste match wint):

<Steps>
  <Step title="Configpaden">
    `plugins.load.paths` — expliciete bestands- of mappaden. Paden die terugwijzen
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
met bind mount over het overeenkomende verpakte bronpad wordt geplaatst, bijvoorbeeld
`/app/extensions/synology-chat`, behandelt OpenClaw die gemounte bronmap
als een gebundelde bronoverlay en ontdekt deze voor de verpakte
`/app/dist/extensions/synology-chat`-bundel. Hierdoor blijven containerloops voor maintainers
werken zonder elke gebundelde plugin terug te schakelen naar TypeScript-bron.
Stel `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` in om verpakte dist-bundels af te dwingen,
zelfs wanneer bronoverlay-mounts aanwezig zijn.

### Activeringsregels

- `plugins.enabled: false` schakelt alle plugins uit en slaat plugin-discovery/-laadwerk over
- `plugins.deny` wint altijd van allow
- `plugins.entries.\<id\>.enabled: false` schakelt die plugin uit
- Plugins afkomstig uit de workspace zijn **standaard uitgeschakeld** (moeten expliciet worden ingeschakeld)
- Gebundelde plugins volgen de ingebouwde standaard-aan-set, tenzij overschreven
- Exclusieve slots kunnen de geselecteerde plugin voor dat slot geforceerd inschakelen
- Sommige gebundelde opt-in-plugins worden automatisch ingeschakeld wanneer config een
  plugin-eigen oppervlak noemt, zoals een provider-modelref, kanaalconfig of harness-
  runtime
- Verouderde pluginconfig blijft behouden zolang `plugins.enabled: false` actief is;
  schakel plugins opnieuw in voordat je doctor-opruiming uitvoert als je verouderde ids wilt verwijderen
- OpenAI-familie Codex-routes houden gescheiden plugingrenzen:
  `openai-codex/*` behoort tot de OpenAI-plugin, terwijl de gebundelde Codex
  app-server-plugin wordt geselecteerd door `agentRuntime.id: "codex"` of legacy
  `codex/*`-modelrefs

## Runtime-hooks oplossen

Als een plugin in `plugins list` verschijnt maar `register(api)`-neveneffecten of hooks
niet worden uitgevoerd in live chatverkeer, controleer dan eerst dit:

- Voer `openclaw gateway status --deep --require-rpc` uit en bevestig dat de actieve
  Gateway-URL, het profiel, het configpad en het proces degene zijn die je bewerkt.
- Herstart de live Gateway na wijzigingen aan plugininstallatie, config of code. In wrapper-
  containers is PID 1 mogelijk alleen een supervisor; herstart of signaleer het child-
  `openclaw gateway run`-proces.
- Gebruik `openclaw plugins inspect <id> --runtime --json` om hookregistraties en
  diagnostiek te bevestigen. Niet-gebundelde conversatiehooks zoals `llm_input`,
  `llm_output`, `before_agent_finalize` en `agent_end` hebben
  `plugins.entries.<id>.hooks.allowConversationAccess=true` nodig.
- Geef voor modelwisseling de voorkeur aan `before_model_resolve`. Dit wordt uitgevoerd voor model-
  resolutie voor agentbeurten; `llm_output` wordt alleen uitgevoerd nadat een modelpoging
  assistant-uitvoer produceert.
- Gebruik voor bewijs van het effectieve sessiemodel `openclaw sessions` of de
  Gateway-sessie-/statusoppervlakken en start, wanneer je providerpayloads debugt,
  de Gateway met `--raw-stream --raw-stream-path <path>`.

### Trage instelling van plugintools

Als agentbeurten lijken te blijven hangen tijdens het voorbereiden van tools, schakel dan tracelogging in en
controleer op timingregels van plugintool-factory's:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Zoek naar:

```text
[trace:plugin-tools] factory timings ...
```

De samenvatting vermeldt de totale factorytijd en de traagste plugintool-factory's,
inclusief plugin-id, gedeclareerde toolnamen, resultaatvorm en of de tool
optioneel is. Trage regels worden gepromoveerd tot waarschuwingen wanneer een enkele factory
minstens 1s duurt of de totale voorbereiding van plugintool-factory's minstens 5s duurt.

OpenClaw cachet succesvolle resultaten van plugintool-factory's voor herhaalde resoluties
met dezelfde effectieve aanvraagcontext. De cachesleutel bevat de effectieve
runtimeconfig, workspace, agent-/sessie-ids, sandboxbeleid, browserinstellingen,
delivery-context, requester-identiteit en ownership-status, zodat factory's die
afhangen van die vertrouwde velden opnieuw worden uitgevoerd wanneer de context verandert.

Als een plugin de timing domineert, inspecteer dan de runtimeregistraties:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Werk die plugin daarna bij, installeer deze opnieuw of schakel deze uit. Pluginauteurs moeten
duur laden van afhankelijkheden achter het uitvoeringspad van de tool plaatsen in plaats van dit
binnen de tool-factory te doen.

### Dubbel kanaal- of tool-eigendom

Symptomen:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Dit betekent dat meer dan een ingeschakelde plugin probeert eigenaar te zijn van hetzelfde kanaal,
dezelfde setupflow of dezelfde toolnaam. De meest voorkomende oorzaak is een externe kanaalplugin
die naast een gebundelde plugin is geinstalleerd die nu dezelfde kanaal-id biedt.

Debugstappen:

- Voer `openclaw plugins list --enabled --verbose` uit om elke ingeschakelde plugin
  en herkomst te zien.
- Voer `openclaw plugins inspect <id> --runtime --json` uit voor elke verdachte plugin en
  vergelijk `channels`, `channelConfigs`, `tools` en diagnostiek.
- Voer `openclaw plugins registry --refresh` uit na het installeren of verwijderen van
  pluginpakketten, zodat opgeslagen metadata de huidige installatie weerspiegelt.
- Herstart de Gateway na wijzigingen aan installatie, register of config.

Fixopties:

- Als een plugin opzettelijk een andere vervangt voor dezelfde kanaal-id, moet de
  voorkeursplugin `channelConfigs.<channel-id>.preferOver` declareren met
  de plugin-id met lagere prioriteit. Zie [/plugins/manifest#replacing-another-channel-plugin](/nl/plugins/manifest#replacing-another-channel-plugin).
- Als het duplicaat per ongeluk is, schakel dan een kant uit met
  `plugins.entries.<plugin-id>.enabled: false` of verwijder de verouderde plugin-
  installatie.
- Als je beide plugins expliciet hebt ingeschakeld, behoudt OpenClaw dat verzoek en
  meldt het conflict. Kies een eigenaar voor het kanaal of hernoem plugin-eigen
  tools zodat het runtime-oppervlak ondubbelzinnig is.

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

| Slot            | Wat het beheert      | Standaard             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Actieve geheugenplugin  | `memory-core`       |
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
plugin). Andere gebundelde plugins vereisen nog steeds `openclaw plugins enable <id>`.

`--force` overschrijft een bestaande geïnstalleerde plugin of hook-pack op zijn plaats. Gebruik
`openclaw plugins update <id-or-npm-spec>` voor routinematige upgrades van gevolgde npm-
plugins. Het wordt niet ondersteund met `--link`, dat het bronpad hergebruikt in plaats
van over een beheerd installatiedoel heen te kopiëren.

Wanneer `plugins.allow` al is ingesteld, voegt `openclaw plugins install` de
geïnstalleerde plugin-id toe aan die allowlist voordat deze wordt ingeschakeld. Als dezelfde plugin-id
aanwezig is in `plugins.deny`, verwijdert install die verouderde deny-vermelding zodat de
expliciete installatie direct laadbaar is na een herstart.

OpenClaw bewaart een persistente lokale pluginregistry als het cold-read-model voor
plugininventaris, eigenaarschap van bijdragen en opstartplanning. Installatie-, update-,
deïnstallatie-, enable- en disable-flows vernieuwen die registry nadat de pluginstatus
is gewijzigd. Hetzelfde bestand `plugins/installs.json` bewaart duurzame installatiemetadata in
top-level `installRecords` en opnieuw opbouwbare manifestmetadata in `plugins`. Als
de registry ontbreekt, verouderd of ongeldig is, bouwt `openclaw plugins registry
--refresh` de manifestweergave opnieuw op uit installatierecords, configuratiebeleid en
manifest-/pakketmetadata zonder plugin-runtime-modules te laden.
`openclaw plugins update <id-or-npm-spec>` geldt voor gevolgde installaties. Het doorgeven
van een npm-pakketspecificatie met een dist-tag of exacte versie herleidt de pakketnaam
terug naar het gevolgde pluginrecord en legt de nieuwe specificatie vast voor toekomstige updates.
Het doorgeven van de pakketnaam zonder versie verplaatst een exact gepinde installatie terug naar
de standaardreleaselijn van de registry. Als de geïnstalleerde npm-plugin al overeenkomt
met de opgeloste versie en vastgelegde artifact-identiteit, slaat OpenClaw de update over
zonder te downloaden, opnieuw te installeren of configuratie te herschrijven.
Wanneer `openclaw update` op het betakanaal draait, proberen npm- en ClawHub-
pluginrecords op de standaardlijn eerst `@beta` en vallen ze terug op standaard/latest wanneer er geen plugin-
betarelease bestaat. Exacte versies en expliciete tags blijven gepind.

`--pin` is alleen voor npm. Het wordt niet ondersteund met `--marketplace`, omdat
marketplace-installaties marketplace-bronmetadata bewaren in plaats van een npm-specificatie.

`--dangerously-force-unsafe-install` is een noodoverride voor false positives
van de ingebouwde scanner voor gevaarlijke code. Hiermee kunnen plugininstallaties
en pluginupdates doorgaan voorbij ingebouwde `critical`-bevindingen, maar het omzeilt nog steeds geen
plugin-`before_install`-beleidsblokkades of blokkering door scanfouten.
Installatiescans negeren algemene testbestanden en -mappen zoals `tests/`,
`__tests__/`, `*.test.*` en `*.spec.*` om te voorkomen dat verpakte testmocks blokkeren;
gedeclareerde plugin-runtime-entrypoints worden nog steeds gescand, zelfs als ze een van
die namen gebruiken.

Deze CLI-vlag geldt alleen voor plugin-installatie-/updateflows. Door de Gateway ondersteunde skill-
dependency-installaties gebruiken in plaats daarvan de overeenkomende `dangerouslyForceUnsafeInstall`-request-
override, terwijl `openclaw skills install` de afzonderlijke ClawHub-
download-/installatieflow voor skills blijft.

Als een plugin die je op ClawHub hebt gepubliceerd verborgen is of door een scan wordt geblokkeerd, open dan het
ClawHub-dashboard of voer `clawhub package rescan <name>` uit om ClawHub te vragen
deze opnieuw te controleren. `--dangerously-force-unsafe-install` heeft alleen effect op installaties op je eigen
machine; het vraagt ClawHub niet de plugin opnieuw te scannen of een geblokkeerde release
openbaar te maken.

Compatibele bundels nemen deel aan dezelfde lijst-/inspect-/enable-/disable-
flow voor plugins. Huidige runtime-ondersteuning omvat bundel-skills, Claude command-skills,
Claude `settings.json`-standaarden, Claude `.lsp.json` en in het manifest gedeclareerde
`lspServers`-standaarden, Cursor command-skills en compatibele Codex hook-
mappen.

`openclaw plugins inspect <id>` rapporteert ook gedetecteerde bundelcapaciteiten plus
ondersteunde of niet-ondersteunde MCP- en LSP-serververmeldingen voor bundelgebaseerde plugins.

Marketplace-bronnen kunnen een Claude bekende-marketplace-naam zijn uit
`~/.claude/plugins/known_marketplaces.json`, een lokale marketplace-root of
`marketplace.json`-pad, een GitHub-shorthand zoals `owner/repo`, een GitHub-repo-
URL, of een git-URL. Voor externe marketplaces moeten pluginvermeldingen binnen de
gekloonde marketplace-repo blijven en alleen relatieve padbronnen gebruiken.

Zie de [`openclaw plugins` CLI-referentie](/nl/cli/plugins) voor volledige details.

## Overzicht van de Plugin-API

Native plugins exporteren een entry-object dat `register(api)` exposeert. Oudere
plugins kunnen nog steeds `activate(api)` gebruiken als legacy-alias, maar nieuwe plugins moeten
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

OpenClaw laadt het entry-object en roept `register(api)` aan tijdens plugin-
activatie. De loader valt nog steeds terug op `activate(api)` voor oudere plugins,
maar gebundelde plugins en nieuwe externe plugins moeten `register` behandelen als het
publieke contract.

`api.registrationMode` vertelt een plugin waarom de entry wordt geladen:

| Modus           | Betekenis                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-activatie. Registreer tools, hooks, services, opdrachten, routes en andere live side effects.                            |
| `discovery`     | Alleen-lezen-capabilitydiscovery. Registreer providers en metadata; vertrouwde plugin-entrycode kan laden, maar sla live side effects over. |
| `setup-only`    | Laden van kanaalsetupmetadata via een lichtgewicht setup-entry.                                                                  |
| `setup-runtime` | Laden van kanaalsetup waarvoor ook de runtime-entry nodig is.                                                                     |
| `cli-metadata`  | Alleen verzamelen van CLI-opdrachtmetadata.                                                                                      |

Plugin-entries die sockets, databases, achtergrondworkers of langlevende
clients openen, moeten die side effects bewaken met `api.registrationMode === "full"`.
Discovery-loads worden afzonderlijk gecachet van activerende loads en vervangen niet
de draaiende Gateway-registry. Discovery is niet-activerend, niet importvrij:
OpenClaw kan de vertrouwde plugin-entry of kanaalpluginmodule evalueren om
de snapshot te bouwen. Houd module-topniveaus lichtgewicht en vrij van side effects, en verplaats
netwerkclients, subprocessen, listeners, credential-reads en service-startup
achter full-runtime-paden.

Veelgebruikte registratiemethoden:

| Methode                                 | Wat wordt geregistreerd     |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Modelprovider (LLM)         |
| `registerChannel`                       | Chatkanaal                  |
| `registerTool`                          | Agenttool                   |
| `registerHook` / `on(...)`              | Lifecycle-hooks             |
| `registerSpeechProvider`                | Tekst-naar-spraak / STT     |
| `registerRealtimeTranscriptionProvider` | Streaming STT               |
| `registerRealtimeVoiceProvider`         | Duplex realtime-spraak      |
| `registerMediaUnderstandingProvider`    | Afbeeldings-/audioanalyse   |
| `registerImageGenerationProvider`       | Afbeeldingsgeneratie        |
| `registerMusicGenerationProvider`       | Muziekgeneratie             |
| `registerVideoGenerationProvider`       | Videogeneratie              |
| `registerWebFetchProvider`              | Webfetch-/scrapeprovider    |
| `registerWebSearchProvider`             | Webzoekfunctie              |
| `registerHttpRoute`                     | HTTP-endpoint               |
| `registerCommand` / `registerCli`       | CLI-opdrachten              |
| `registerContextEngine`                 | Context-engine              |
| `registerService`                       | Achtergrondservice          |

Hook-guardgedrag voor getypeerde lifecycle-hooks:

- `before_tool_call`: `{ block: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `before_tool_call`: `{ block: false }` is een no-op en wist geen eerdere blokkade.
- `before_install`: `{ block: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `before_install`: `{ block: false }` is een no-op en wist geen eerdere blokkade.
- `message_sending`: `{ cancel: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `message_sending`: `{ cancel: false }` is een no-op en wist geen eerdere cancel.

Native Codex app-server leidt Codex-native tool-events terug naar dit
hookoppervlak. Plugins kunnen native Codex-tools blokkeren via `before_tool_call`,
resultaten observeren via `after_tool_call` en deelnemen aan Codex-
`PermissionRequest`-goedkeuringen. De bridge herschrijft Codex-native tool-
argumenten nog niet. De exacte grens van Codex-runtimeondersteuning staat in het
[Codex harness v1-ondersteuningscontract](/nl/plugins/codex-harness#v1-support-contract).

Zie voor volledig getypeerd hookgedrag het [SDK-overzicht](/nl/plugins/sdk-overview#hook-decision-semantics).

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins) — maak je eigen plugin
- [Pluginbundels](/nl/plugins/bundles) — compatibiliteit met Codex-/Claude-/Cursor-bundels
- [Pluginmanifest](/nl/plugins/manifest) — manifestschema
- [Tools registreren](/nl/plugins/building-plugins#registering-agent-tools) — voeg agenttools toe in een plugin
- [Plugininternals](/nl/plugins/architecture) — capabilitymodel en laadpipeline
- [Communityplugins](/nl/plugins/community) — lijsten van derden
