---
read_when:
    - Plugins installeren of configureren
    - Inzicht in Plugin-detectie en laadregels
    - Werken met Codex/Claude-compatibele Plugin-bundels
sidebarTitle: Install and Configure
summary: OpenClaw-plugins installeren, configureren en beheren
title: Plugins
x-i18n:
    generated_at: "2026-04-29T23:25:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a12d158053c13b47a56d8d6b382818962e9b5109fdf8ededd3ecf92b83089e6
    source_path: tools/plugin.md
    workflow: 16
---

Plugins breiden OpenClaw uit met nieuwe mogelijkheden: kanalen, modelproviders,
agent-harnassen, tools, Skills, spraak, realtime transcriptie, realtime
spraak, mediabegrip, afbeeldingsgeneratie, videogeneratie, webophalen, web
zoeken en meer. Sommige plugins zijn **core** (meegeleverd met OpenClaw), andere
zijn **extern**. De meeste externe plugins worden gepubliceerd en ontdekt via
[ClawHub](/nl/tools/clawhub). Npm blijft ondersteund voor directe installaties en voor een
tijdelijke set Plugin-pakketten die eigendom zijn van OpenClaw terwijl die migratie wordt afgerond.

## Snel starten

<Steps>
  <Step title="Bekijk wat geladen is">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Installeer een Plugin">
    ```bash
    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

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
</Steps>

Als je de voorkeur geeft aan chat-native beheer, schakel dan `commands.plugins: true` in en gebruik:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Het installatiepad gebruikt dezelfde resolver als de CLI: lokaal pad/archief, expliciet
`clawhub:<pkg>`, expliciet `npm:<pkg>` of kale pakketspecificatie (eerst ClawHub, daarna
npm-fallback).

Als de configuratie ongeldig is, mislukt de installatie normaal gesproken gesloten en verwijst die je naar
`openclaw doctor --fix`. De enige hersteluitzondering is een smal herinstallatiepad voor gebundelde plugins
voor plugins die zich aanmelden voor
`openclaw.install.allowInvalidConfigRecovery`.
Tijdens het starten van de Gateway wordt ongeldige configuratie voor één Plugin geïsoleerd tot die Plugin:
het starten logt het `plugins.entries.<id>.config`-probleem, slaat die Plugin over tijdens
het laden en houdt andere plugins en kanalen online. Voer `openclaw doctor --fix` uit
om de slechte Plugin-configuratie in quarantaine te plaatsen door die Plugin-vermelding uit te schakelen en
de ongeldige configuratiepayload ervan te verwijderen; de normale configuratieback-up bewaart de vorige waarden.
Wanneer een kanaalconfiguratie verwijst naar een Plugin die niet langer vindbaar is, maar dezelfde
verouderde Plugin-id in de Plugin-configuratie of installatierecords blijft staan, logt het starten van de Gateway
waarschuwingen en wordt dat kanaal overgeslagen in plaats van elk ander kanaal te blokkeren.
Voer `openclaw doctor --fix` uit om de verouderde kanaal-/Plugin-vermeldingen te verwijderen; onbekende
kanaalsleutels zonder bewijs van verouderde plugins blijven validatie laten mislukken, zodat typefouten
zichtbaar blijven.
Als `plugins.enabled: false` is ingesteld, worden verouderde Plugin-verwijzingen als inert behandeld:
het starten van de Gateway slaat Plugin-discovery-/laadwerk over en `openclaw doctor` behoudt
de uitgeschakelde Plugin-configuratie in plaats van die automatisch te verwijderen. Schakel plugins opnieuw in voordat
je doctor-opruiming uitvoert als je verouderde Plugin-id's wilt verwijderen.

Verpakte OpenClaw-installaties installeren niet gretig de runtime-afhankelijkheidsboom van elke gebundelde Plugin.
Wanneer een gebundelde Plugin die eigendom is van OpenClaw actief is vanuit
Plugin-configuratie, legacy kanaalconfiguratie of een standaard ingeschakeld manifest, repareert het starten
alleen de gedeclareerde runtime-afhankelijkheden van die Plugin voordat die wordt geïmporteerd.
Alleen persistente kanaal-auth-status activeert geen gebundeld kanaal voor
Gateway-startreparatie van runtime-afhankelijkheden.
Expliciet uitschakelen wint nog steeds: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` en `channels.<id>.enabled: false`
voorkomen automatische reparatie van gebundelde runtime-afhankelijkheden voor die Plugin/dat kanaal.
Een niet-lege `plugins.allow` begrenst ook reparatie van standaard ingeschakelde gebundelde runtime-afhankelijkheden;
expliciete inschakeling van een gebundeld kanaal (`channels.<id>.enabled: true`) kan
nog steeds de Plugin-afhankelijkheden van dat kanaal repareren.
Externe plugins en aangepaste laadpaden moeten nog steeds via
`openclaw plugins install` worden geïnstalleerd.

## Plugin-typen

OpenClaw herkent twee Plugin-formaten:

| Formaat    | Hoe het werkt                                                     | Voorbeelden                                             |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| **Native** | `openclaw.plugin.json` + runtime-module; wordt in-process uitgevoerd | Officiële plugins, community-npm-pakketten              |
| **Bundle** | Codex/Claude/Cursor-compatibele layout; gekoppeld aan OpenClaw-functies | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide verschijnen onder `openclaw plugins list`. Zie [Plugin Bundles](/nl/plugins/bundles) voor details over bundles.

Als je een native Plugin schrijft, begin dan met [Plugins bouwen](/nl/plugins/building-plugins)
en het [overzicht van de Plugin SDK](/nl/plugins/sdk-overview).

## Pakket-entrypoints

Native Plugin-npm-pakketten moeten `openclaw.extensions` declareren in `package.json`.
Elke vermelding moet binnen de pakketdirectory blijven en verwijzen naar een leesbaar
runtime-bestand, of naar een TypeScript-bronbestand met een afgeleide gebouwde JavaScript
peer zoals `src/index.ts` naar `dist/index.js`.

Gebruik `openclaw.runtimeExtensions` wanneer gepubliceerde runtime-bestanden niet op dezelfde
paden staan als de bronvermeldingen. Wanneer aanwezig, moet `runtimeExtensions`
exact één vermelding bevatten voor elke `extensions`-vermelding. Niet-overeenkomende lijsten laten installatie en
Plugin-discovery mislukken in plaats van stil terug te vallen op bronpaden.

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
aparte npm-installaties nodig. Totdat elke Plugin die eigendom is van OpenClaw
naar ClawHub is gemigreerd, levert OpenClaw nog steeds enkele `@openclaw/*` Plugin-pakketten op
npm voor oudere/aangepaste installaties en directe npm-workflows.

Als npm een `@openclaw/*` Plugin-pakket als deprecated rapporteert, komt die pakketversie
uit een oudere externe pakkettrein. Gebruik de gebundelde Plugin uit
huidige OpenClaw of een lokale checkout totdat een nieuwer npm-pakket is gepubliceerd.

| Plugin          | Pakket                     | Documentatie                               |
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
    - `memory-core` — gebundelde geheugenzoekfunctie (standaard via `plugins.slots.memory`)
    - `memory-lancedb` — on-demand installeerbaar langetermijngeheugen met automatisch ophalen/vastleggen (stel `plugins.slots.memory = "memory-lancedb"` in)

    Zie [Memory LanceDB](/nl/plugins/memory-lancedb) voor OpenAI-compatibele
    embeddingconfiguratie, Ollama-voorbeelden, ophaallimieten en probleemoplossing.

  </Accordion>

  <Accordion title="Spraakproviders (standaard ingeschakeld)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Overig">
    - `browser` — gebundelde browser-Plugin voor de browsertool, `openclaw browser` CLI, `browser.request` Gateway-methode, browserruntime en standaard browserbeheerservice (standaard ingeschakeld; schakel uit voordat je die vervangt)
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

| Veld             | Beschrijving                                              |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Hoofdschakelaar (standaard: `true`)                       |
| `allow`          | Plugin-allowlist (optioneel)                              |
| `deny`           | Plugin-denylist (optioneel; deny wint)                    |
| `load.paths`     | Extra Plugin-bestanden/-directory's                       |
| `slots`          | Exclusieve slotselectors (bijv. `memory`, `contextEngine`) |
| `entries.\<id\>` | Schakelaars + configuratie per Plugin                     |

Configuratiewijzigingen **vereisen een herstart van de Gateway**. Als de Gateway draait met config
watch + in-process herstart ingeschakeld (het standaardpad `openclaw gateway`), wordt die
herstart meestal automatisch uitgevoerd kort nadat de configuratieschrijving is geland.
Er is geen ondersteund hot-reloadpad voor native Plugin-runtimecode of lifecycle
hooks; herstart het Gateway-proces dat het live kanaal bedient voordat je
verwacht dat bijgewerkte `register(api)`-code, `api.on(...)`-hooks, tools, services of
provider-/runtime-hooks worden uitgevoerd.

`openclaw plugins list` is een lokale snapshot van Plugin-register/configuratie. Een
`enabled` Plugin daar betekent dat het persistente register en de huidige configuratie de
Plugin toestaan deel te nemen. Het bewijst niet dat een al draaiend remote Gateway-child
is herstart met dezelfde Plugin-code. In VPS-/container-setups met
wrapperprocessen stuur je herstarts naar het daadwerkelijke `openclaw gateway run`-proces,
of gebruik je `openclaw gateway restart` tegen de draaiende Gateway.

<Accordion title="Plugin-statussen: uitgeschakeld vs ontbrekend vs ongeldig">
  - **Uitgeschakeld**: Plugin bestaat, maar inschakelregels hebben die uitgeschakeld. Configuratie blijft behouden.
  - **Ontbrekend**: configuratie verwijst naar een Plugin-id die discovery niet heeft gevonden.
  - **Ongeldig**: Plugin bestaat, maar de configuratie ervan komt niet overeen met het gedeclareerde schema. Gateway-start slaat alleen die Plugin over; `openclaw doctor --fix` kan de ongeldige vermelding in quarantaine plaatsen door die uit te schakelen en de configuratiepayload ervan te verwijderen.

</Accordion>

## Discovery en prioriteit

OpenClaw scant op plugins in deze volgorde (eerste match wint):

<Steps>
  <Step title="Configuratiepaden">
    `plugins.load.paths` — expliciete bestands- of directorypaden. Paden die terugverwijzen
    naar OpenClaw's eigen verpakte gebundelde Plugin-directory's worden genegeerd;
    voer `openclaw doctor --fix` uit om die verouderde aliassen te verwijderen.
  </Step>

  <Step title="Werkruimteplugins">
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

Pakketinstallaties en Docker-images lossen gebundelde plugins normaal op vanuit de
gecompileerde `dist/extensions`-structuur. Als een bronmap van een gebundelde plugin
wordt bind-mounted over het overeenkomende verpakte bronpad, bijvoorbeeld
`/app/extensions/synology-chat`, behandelt OpenClaw die gemounte bronmap
als een gebundelde bron-overlay en ontdekt deze vóór de verpakte
`/app/dist/extensions/synology-chat`-bundel. Zo blijven container-loops voor maintainers
werken zonder elke gebundelde plugin terug naar TypeScript-broncode te schakelen.
Stel `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` in om verpakte dist-bundels af te dwingen,
zelfs wanneer bron-overlay-mounts aanwezig zijn.

### Regels voor inschakeling

- `plugins.enabled: false` schakelt alle plugins uit en slaat plugin-ontdekking/laadwerk over
- `plugins.deny` wint altijd van allow
- `plugins.entries.\<id\>.enabled: false` schakelt die plugin uit
- Plugins met workspace-oorsprong zijn **standaard uitgeschakeld** (moeten expliciet worden ingeschakeld)
- Gebundelde plugins volgen de ingebouwde standaard-aan-set tenzij overschreven
- Exclusieve slots kunnen de geselecteerde plugin voor die slot geforceerd inschakelen
- Sommige gebundelde opt-in-plugins worden automatisch ingeschakeld wanneer de configuratie een
  door een plugin beheerd oppervlak benoemt, zoals een providermodelverwijzing, kanaalconfiguratie of harness-
  runtime
- Verouderde pluginconfiguratie blijft bewaard terwijl `plugins.enabled: false` actief is;
  schakel plugins opnieuw in voordat je doctor-opschoning uitvoert als je verouderde id's wilt verwijderen
- OpenAI-familie Codex-routes houden aparte plugingrenzen:
  `openai-codex/*` hoort bij de OpenAI-plugin, terwijl de gebundelde Codex
  app-serverplugin wordt geselecteerd door `agentRuntime.id: "codex"` of legacy
  `codex/*`-modelverwijzingen

## Runtime-hooks oplossen

Als een plugin in `plugins list` verschijnt maar `register(api)`-bijwerkingen of hooks
niet worden uitgevoerd in live chatverkeer, controleer dan eerst dit:

- Voer `openclaw gateway status --deep --require-rpc` uit en bevestig dat de actieve
  Gateway-URL, het profiel, het configuratiepad en het proces degene zijn die je bewerkt.
- Herstart de live Gateway na wijzigingen aan plugininstallatie, configuratie of code. In wrapper-
  containers kan PID 1 alleen een supervisor zijn; herstart of signaleer het child-
  `openclaw gateway run`-proces.
- Gebruik `openclaw plugins inspect <id> --json` om hookregistraties en
  diagnostiek te bevestigen. Niet-gebundelde conversatiehooks zoals `llm_input`,
  `llm_output`, `before_agent_finalize` en `agent_end` hebben
  `plugins.entries.<id>.hooks.allowConversationAccess=true` nodig.
- Geef voor modelwisseling de voorkeur aan `before_model_resolve`. Deze wordt uitgevoerd vóór model-
  oplossing voor agentbeurten; `llm_output` wordt alleen uitgevoerd nadat een modelpoging
  assistentuitvoer produceert.
- Gebruik voor bewijs van het effectieve sessiemodel `openclaw sessions` of de
  Gateway-sessie-/statusoppervlakken en start, bij het debuggen van providerpayloads, de
  Gateway met `--raw-stream --raw-stream-path <path>`.

### Dubbel kanaal- of tool-eigenaarschap

Symptomen:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Dit betekent dat meer dan één ingeschakelde plugin hetzelfde kanaal,
dezelfde setup-flow of dezelfde toolnaam probeert te beheren. De meest voorkomende oorzaak is een externe kanaalplugin
die naast een gebundelde plugin is geïnstalleerd die nu dezelfde kanaal-id biedt.

Debugstappen:

- Voer `openclaw plugins list --enabled --verbose` uit om elke ingeschakelde plugin
  en oorsprong te zien.
- Voer `openclaw plugins inspect <id> --json` uit voor elke verdachte plugin en
  vergelijk `channels`, `channelConfigs`, `tools` en diagnostiek.
- Voer `openclaw plugins registry --refresh` uit na het installeren of verwijderen van
  pluginpakketten zodat persistente metadata de huidige installatie weerspiegelt.
- Herstart de Gateway na installatie-, registry- of configuratiewijzigingen.

Oplossingsopties:

- Als één plugin bewust een andere vervangt voor dezelfde kanaal-id, moet de
  voorkeursplugin `channelConfigs.<channel-id>.preferOver` declareren met
  de plugin-id met lagere prioriteit. Zie [/plugins/manifest#replacing-another-channel-plugin](/nl/plugins/manifest#replacing-another-channel-plugin).
- Als de duplicatie onbedoeld is, schakel één kant uit met
  `plugins.entries.<plugin-id>.enabled: false` of verwijder de verouderde plugininstallatie.
- Als je beide plugins expliciet hebt ingeschakeld, behoudt OpenClaw dat verzoek en
  meldt het conflict. Kies één eigenaar voor het kanaal of hernoem door plugins beheerde
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
| `memory`        | Active Memory-plugin  | `memory-core`       |
| `contextEngine` | Actieve contextengine | `legacy` (ingebouwd) |

## CLI-referentie

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # deep detail
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

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Gebundelde plugins worden met OpenClaw meegeleverd. Veel zijn standaard ingeschakeld (bijvoorbeeld
gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browser-
plugin). Andere gebundelde plugins hebben nog steeds `openclaw plugins enable <id>` nodig.

`--force` overschrijft een bestaande geïnstalleerde plugin of hook-pack op zijn plaats. Gebruik
`openclaw plugins update <id-or-npm-spec>` voor routinematige upgrades van gevolgde npm-
plugins. Dit wordt niet ondersteund met `--link`, dat het bronpad hergebruikt in plaats van
over een beheerd installatiedoel te kopiëren.

Wanneer `plugins.allow` al is ingesteld, voegt `openclaw plugins install` de
geïnstalleerde plugin-id toe aan die allowlist voordat deze wordt ingeschakeld. Als dezelfde plugin-id
aanwezig is in `plugins.deny`, verwijdert installatie die verouderde deny-vermelding zodat de
expliciete installatie direct laadbaar is na een herstart.

OpenClaw bewaart een persistente lokale pluginregistry als het koude leesmodel voor
plugininventaris, eigenaarschap van bijdragen en opstartplanning. Installatie-, update-,
uninstall-, enable- en disable-flows vernieuwen die registry nadat de pluginstatus is gewijzigd.
Hetzelfde `plugins/installs.json`-bestand bewaart duurzame installatiemetadata in
top-level `installRecords` en opnieuw opbouwbare manifestmetadata in `plugins`. Als
de registry ontbreekt, verouderd of ongeldig is, bouwt `openclaw plugins registry
--refresh` de manifestweergave opnieuw op vanuit installatierecords, configuratiebeleid en
manifest-/pakketmetadata zonder plugin-runtimemodules te laden.
`openclaw plugins update <id-or-npm-spec>` is van toepassing op gevolgde installaties. Het doorgeven
van een npm-pakketspecificatie met een dist-tag of exacte versie herleidt de pakketnaam
terug naar het gevolgde pluginrecord en registreert de nieuwe specificatie voor toekomstige updates.
Het doorgeven van de pakketnaam zonder versie verplaatst een exact gepinde installatie terug naar
de standaardreleaselijn van de registry. Als de geïnstalleerde npm-plugin al overeenkomt met
de opgeloste versie en geregistreerde artifact-identiteit, slaat OpenClaw de update over
zonder te downloaden, opnieuw te installeren of configuratie te herschrijven.

`--pin` is alleen voor npm. Het wordt niet ondersteund met `--marketplace`, omdat
marketplace-installaties marketplace-bronmetadata bewaren in plaats van een npm-specificatie.

`--dangerously-force-unsafe-install` is een break-glass-override voor fout-positieven
van de ingebouwde scanner voor gevaarlijke code. Hiermee kunnen plugininstallaties
en pluginupdates doorgaan voorbij ingebouwde `critical`-bevindingen, maar het
omzeilt nog steeds geen plugin-`before_install`-beleidsblokkades of blokkering door scanfouten.
Installatiescans negeren veelvoorkomende testbestanden en mappen zoals `tests/`,
`__tests__/`, `*.test.*` en `*.spec.*` om blokkering door verpakte testmocks te vermijden;
gedeclareerde plugin-runtime-entrypoints worden nog steeds gescand, zelfs als ze een van
die namen gebruiken.

Deze CLI-vlag is alleen van toepassing op plugininstallatie-/updateflows. Door Gateway ondersteunde Skill-
dependencyinstallaties gebruiken in plaats daarvan de overeenkomende `dangerouslyForceUnsafeInstall`-aanvraag-
override, terwijl `openclaw skills install` de aparte ClawHub-
download-/installatieflow voor Skills blijft.

Als een plugin die je op ClawHub hebt gepubliceerd verborgen is of door een scan wordt geblokkeerd, open dan het
ClawHub-dashboard of voer `clawhub package rescan <name>` uit om ClawHub te vragen
deze opnieuw te controleren. `--dangerously-force-unsafe-install` heeft alleen invloed op installaties op je eigen
machine; het vraagt ClawHub niet om de plugin opnieuw te scannen of een geblokkeerde release
openbaar te maken.

Compatibele bundels nemen deel aan dezelfde pluginlijst-/inspect-/enable-/disable-
flow. Huidige runtime-ondersteuning omvat bundel-Skills, Claude command-skills,
Claude `settings.json`-standaarden, Claude `.lsp.json` en in het manifest gedeclareerde
`lspServers`-standaarden, Cursor command-skills en compatibele Codex-hook-
mappen.

`openclaw plugins inspect <id>` rapporteert ook gedetecteerde bundelcapaciteiten plus
ondersteunde of niet-ondersteunde MCP- en LSP-serververmeldingen voor bundle-backed plugins.

Marketplace-bronnen kunnen een bekende Claude-marketplacenaam zijn uit
`~/.claude/plugins/known_marketplaces.json`, een lokale marketplace-root of
`marketplace.json`-pad, een GitHub-shorthand zoals `owner/repo`, een GitHub-repo-
URL of een git-URL. Voor externe marketplaces moeten pluginvermeldingen binnen de
gekloonde marketplace-repo blijven en alleen relatieve padbronnen gebruiken.

Zie de [`openclaw plugins` CLI-referentie](/nl/cli/plugins) voor volledige details.

## Overzicht van de Plugin-API

Native plugins exporteren een entry-object dat `register(api)` beschikbaar stelt. Oudere
plugins kunnen `activate(api)` nog steeds gebruiken als legacy-alias, maar nieuwe plugins moeten
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
| `full`          | Runtime-activering. Registreer tools, hooks, services, opdrachten, routes en andere live neveneffecten.                          |
| `discovery`     | Alleen-lezen ontdekking van mogelijkheden. Registreer providers en metadata; vertrouwde Plugin-entrycode mag worden geladen, maar sla live neveneffecten over. |
| `setup-only`    | Laden van metadata voor kanaalconfiguratie via een lichtgewicht setup-entry.                                                     |
| `setup-runtime` | Laden van kanaalconfiguratie waarvoor ook de runtime-entry nodig is.                                                             |
| `cli-metadata`  | Alleen verzamelen van CLI-opdrachtmetadata.                                                                                      |

Plugin-entry's die sockets, databases, achtergrondworkers of langlevende
clients openen, moeten die neveneffecten bewaken met `api.registrationMode === "full"`.
Discovery-loads worden apart van activerende loads gecachet en vervangen het
actieve Gateway-register niet. Discovery is niet-activerend, niet importvrij:
OpenClaw kan de vertrouwde Plugin-entry of kanaal-Plugin-module evalueren om
de snapshot op te bouwen. Houd module-topniveaus lichtgewicht en vrij van
neveneffecten, en verplaats netwerkclients, subprocessen, listeners, credential-reads
en servicestartup naar volledige runtime-paden.

Veelgebruikte registratiemethoden:

| Methode                                 | Wat deze registreert        |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Modelprovider (LLM)         |
| `registerChannel`                       | Chatkanaal                  |
| `registerTool`                          | Agent-tool                  |
| `registerHook` / `on(...)`              | Lifecycle-hooks             |
| `registerSpeechProvider`                | Tekst-naar-spraak / STT     |
| `registerRealtimeTranscriptionProvider` | Streaming-STT               |
| `registerRealtimeVoiceProvider`         | Duplex realtime stem        |
| `registerMediaUnderstandingProvider`    | Beeld-/audioanalyse         |
| `registerImageGenerationProvider`       | Beeldgeneratie              |
| `registerMusicGenerationProvider`       | Muziekgeneratie             |
| `registerVideoGenerationProvider`       | Videogeneratie              |
| `registerWebFetchProvider`              | Provider voor webfetch/scraping |
| `registerWebSearchProvider`             | Webzoekfunctie              |
| `registerHttpRoute`                     | HTTP-eindpunt               |
| `registerCommand` / `registerCli`       | CLI-opdrachten              |
| `registerContextEngine`                 | Contextengine               |
| `registerService`                       | Achtergrondservice          |

Hook-guardgedrag voor getypeerde lifecycle-hooks:

- `before_tool_call`: `{ block: true }` is terminal; handlers met lagere prioriteit worden overgeslagen.
- `before_tool_call`: `{ block: false }` is een no-op en wist een eerdere blokkering niet.
- `before_install`: `{ block: true }` is terminal; handlers met lagere prioriteit worden overgeslagen.
- `before_install`: `{ block: false }` is een no-op en wist een eerdere blokkering niet.
- `message_sending`: `{ cancel: true }` is terminal; handlers met lagere prioriteit worden overgeslagen.
- `message_sending`: `{ cancel: false }` is een no-op en wist een eerdere annulering niet.

Native Codex-app-serverruns koppelen Codex-native toolgebeurtenissen terug naar dit
hook-oppervlak. Plugins kunnen native Codex-tools blokkeren via `before_tool_call`,
resultaten observeren via `after_tool_call` en deelnemen aan Codex-
`PermissionRequest`-goedkeuringen. De bridge herschrijft Codex-native tool-
argumenten nog niet. De exacte ondersteuningsgrens van de Codex-runtime staat in het
[Codex harness v1-ondersteuningscontract](/nl/plugins/codex-harness#v1-support-contract).

Zie [SDK-overzicht](/nl/plugins/sdk-overview#hook-decision-semantics) voor volledig getypeerd hookgedrag.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins) — maak je eigen plugin
- [Plugin-bundels](/nl/plugins/bundles) — compatibiliteit met Codex/Claude/Cursor-bundels
- [Plugin-manifest](/nl/plugins/manifest) — manifestschema
- [Tools registreren](/nl/plugins/building-plugins#registering-agent-tools) — voeg agent-tools toe in een plugin
- [Plugin-internals](/nl/plugins/architecture) — capabilitymodel en laadpipeline
- [Community-plugins](/nl/plugins/community) — vermeldingen van derden
