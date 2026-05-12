---
read_when:
    - Plugins installeren of configureren
    - Plugin-detectie en laadregels begrijpen
    - Werken met Codex/Claude-compatibele Plugin-bundels
sidebarTitle: Install and Configure
summary: OpenClaw-plugins installeren, configureren en beheren
title: Plugins
x-i18n:
    generated_at: "2026-05-12T08:46:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: e8773fc3feb19c867b1978f21d83f1cad1752d5a2572ad607d481539ad7471df
    source_path: tools/plugin.md
    workflow: 16
---

Plugins breiden OpenClaw uit met nieuwe mogelijkheden: kanalen, modelproviders,
agent-harnassen, tools, Skills, spraak, realtime transcriptie, realtime
stem, mediabegrip, afbeeldingsgeneratie, videogeneratie, web fetch, web
search en meer. Sommige plugins zijn **kern** (meegeleverd met OpenClaw), andere
zijn **extern**. De meeste externe plugins worden gepubliceerd en ontdekt via
[ClawHub](/nl/clawhub). Npm blijft ondersteund voor directe installaties en voor een
tijdelijke set pluginpakketten die eigendom zijn van OpenClaw terwijl die migratie wordt afgerond.

## Snel aan de slag

Voor voorbeelden voor kopiëren en plakken voor installeren, weergeven, verwijderen, bijwerken en publiceren, zie
[Plugins beheren](/nl/plugins/manage-plugins).

<Steps>
  <Step title="Bekijk wat er is geladen">
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
    In een actieve Gateway activeren eigenaar-alleen `/plugins enable` en `/plugins disable`
    de config-herlader van de Gateway. De Gateway herlaadt plugin-runtime-
    oppervlakken in het proces, en nieuwe agentbeurten bouwen hun toollijst opnieuw op uit het
    vernieuwde register. `/plugins install` wijzigt plugin-broncode, dus de
    Gateway vraagt om een herstart in plaats van te doen alsof het huidige proces
    reeds geïmporteerde modules veilig kan herladen.

  </Step>

  <Step title="Controleer de plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Gebruik `--runtime` wanneer je geregistreerde tools, services, Gateway-
    methoden, hooks of CLI-opdrachten die eigendom zijn van de plugin moet bewijzen. Gewone `inspect` is een koude
    manifest-/registercontrole en vermijdt bewust het importeren van plugin-runtime.

  </Step>
</Steps>

Als je chat-native bediening verkiest, schakel `commands.plugins: true` in en gebruik:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Het installatiepad gebruikt dezelfde resolver als de CLI: lokaal pad/archief, expliciet
`clawhub:<pkg>`, expliciet `npm:<pkg>`, expliciet `npm-pack:<path.tgz>`,
expliciet `git:<repo>`, of kale pakketspecificatie via npm.

Als de configuratie ongeldig is, faalt installeren normaal gesloten en verwijst het je naar
`openclaw doctor --fix`. De enige hersteluitzondering is een smal herinstallatiepad voor gebundelde plugins
voor plugins die zich aanmelden voor
`openclaw.install.allowInvalidConfigRecovery`.
Tijdens het opstarten van de Gateway faalt ongeldige pluginconfiguratie gesloten zoals elke andere ongeldige
configuratie. Voer `openclaw doctor --fix` uit om de slechte pluginconfiguratie in quarantaine te plaatsen door
die pluginvermelding uit te schakelen en de ongeldige configuratiepayload te verwijderen; de normale
configuratieback-up behoudt de vorige waarden.
Wanneer een kanaalconfiguratie verwijst naar een plugin die niet langer vindbaar is, maar dezelfde
verouderde plugin-id in pluginconfiguratie of installatierecords blijft staan, logt het opstarten van de Gateway
waarschuwingen en slaat dat kanaal over in plaats van elk ander kanaal te blokkeren.
Voer `openclaw doctor --fix` uit om de verouderde kanaal-/pluginvermeldingen te verwijderen; onbekende
kanaalsleutels zonder bewijs van een verouderde plugin blijven validatie mislukken, zodat typefouten
zichtbaar blijven.
Als `plugins.enabled: false` is ingesteld, worden verouderde pluginverwijzingen als inert behandeld:
het opstarten van de Gateway slaat plugin-detectie/-laadwerk over en `openclaw doctor` behoudt
de uitgeschakelde pluginconfiguratie in plaats van die automatisch te verwijderen. Schakel plugins opnieuw in voordat je
doctor-opruiming uitvoert als je verouderde plugin-id's verwijderd wilt hebben.

Installatie van pluginafhankelijkheden gebeurt alleen tijdens expliciete installatie-/update- of
doctor-reparatiestromen. Gateway-opstart, configuratieherlaad en runtime-inspectie voeren geen
pakketbeheerders uit en repareren geen afhankelijkheidsbomen. Lokale plugins moeten hun afhankelijkheden al
geïnstalleerd hebben, terwijl npm-, git- en ClawHub-plugins worden geïnstalleerd onder de beheerde pluginroots
van OpenClaw. npm-afhankelijkheden kunnen binnen de beheerde npm-root van OpenClaw worden gehesen; installatie/update scant die beheerde root vóór
vertrouwen en verwijderen verwijdert door npm beheerde pakketten via npm. Externe plugins
en aangepaste laadpaden moeten nog steeds via `openclaw plugins install` worden geïnstalleerd.
Gebruik `openclaw plugins list --json` om de statische `dependencyStatus` voor elke
zichtbare plugin te zien zonder runtimecode te importeren of afhankelijkheden te repareren.
Zie [Resolutie van pluginafhankelijkheden](/nl/plugins/dependency-resolution) voor de
levenscyclus tijdens installatie.

### Geblokkeerd eigenaarschap van pluginpad

Als plugindiagnostiek meldt
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
en configuratievalidatie volgt met `plugin present but blocked`, heeft OpenClaw
pluginbestanden gevonden die eigendom zijn van een andere Unix-gebruiker dan het proces dat ze laadt.
Laat de pluginconfiguratie staan; herstel het eigenaarschap van het bestandssysteem of voer
OpenClaw uit als dezelfde gebruiker die eigenaar is van de statusdirectory.

Voor Docker-installaties draait de officiële image als `node` (uid `1000`), dus de
host-bind-mounted OpenClaw-configuratie- en werkspacedirectory's zouden normaal gesproken
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
`openclaw plugins registry --refresh` uit, zodat het opgeslagen pluginregister overeenkomt met
de gerepareerde bestanden.

Voor npm-installaties worden veranderlijke selectors zoals `latest` of een dist-tag opgelost
vóór installatie en daarna vastgezet op de exact geverifieerde versie in de beheerde npm-root
van OpenClaw. Nadat npm klaar is, verifieert OpenClaw dat de geïnstalleerde
`package-lock.json`-vermelding nog steeds overeenkomt met de opgeloste versie en integriteit. Als
npm andere pakketmetadata schrijft, mislukt de installatie en wordt het beheerde pakket
teruggedraaid in plaats van een ander pluginartefact te accepteren.
Beheerde npm-roots erven ook de npm-`overrides` op pakketniveau van OpenClaw, zodat
beveiligingspins die de verpakte host beschermen ook van toepassing zijn op gehesen externe
pluginafhankelijkheden.

Bron-checkouts zijn pnpm-workspaces. Als je OpenClaw kloont om aan gebundelde
plugins te werken, voer `pnpm install` uit; OpenClaw laadt gebundelde plugins dan uit
`extensions/<id>` zodat wijzigingen en pakketlokale afhankelijkheden direct worden gebruikt.
Gewone npm-rootinstallaties zijn bedoeld voor verpakte OpenClaw, niet voor ontwikkeling met source checkouts.

## Plugintypen

OpenClaw herkent twee pluginindelingen:

| Indeling   | Hoe het werkt                                                    | Voorbeelden                                             |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + runtimemodule; voert in-process uit       | Officiële plugins, community-npm-pakketten              |
| **Bundle** | Codex-/Claude-/Cursor-compatibele indeling; gemapt naar OpenClaw-functies | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide verschijnen onder `openclaw plugins list`. Zie [Pluginbundels](/nl/plugins/bundles) voor bundeldetails.

Als je een native plugin schrijft, begin dan met [Plugins bouwen](/nl/plugins/building-plugins)
en het [Overzicht van de Plugin SDK](/nl/plugins/sdk-overview).

## Pakket-entrypoints

Native plugin-npm-pakketten moeten `openclaw.extensions` declareren in `package.json`.
Elke entry moet binnen de pakketdirectory blijven en oplossen naar een leesbaar
runtimebestand, of naar een TypeScript-bronbestand met een afgeleide gebouwde JavaScript-
peer, zoals `src/index.ts` naar `dist/index.js`.
Verpakte installaties moeten die JavaScript-runtime-uitvoer meeleveren. De TypeScript-
bronfallback is bedoeld voor source checkouts en lokale ontwikkelpaden, niet voor
npm-pakketten die in de beheerde pluginroot van OpenClaw worden geïnstalleerd.

Niet-gevolgde directory's die in de globale extensieroot worden geplaatst, worden behandeld als
lokale source checkouts en kunnen TypeScript-entries direct laden. Directory's die
nog steeds door een installatierecord worden genoemd, inclusief `installPath` of `sourcePath`, blijven
beheerd en behouden de vereiste voor gecompileerde uitvoer, zelfs wanneer de globale scan
ze ziet. Als je een beheerde installatie bewust omzet in een niet-gevolgde lokale
checkout, verwijder dan eerst het verouderde installatierecord met verwijderen of doctor-opruiming.

Als een waarschuwing voor een beheerd pakket zegt dat het `requires compiled runtime output for
TypeScript entry ...`, dan is het pakket gepubliceerd zonder de JavaScript-bestanden
die OpenClaw tijdens runtime nodig heeft. Dat is een pluginverpakkingsprobleem, geen lokaal configuratieprobleem.
Werk de plugin bij of installeer hem opnieuw nadat de uitgever gecompileerde
JavaScript opnieuw publiceert, of schakel die plugin uit/verwijder hem totdat een gerepareerd pakket beschikbaar is.

Gebruik `openclaw.runtimeExtensions` wanneer gepubliceerde runtimebestanden niet op
dezelfde paden staan als de bronentries. Wanneer aanwezig, moet `runtimeExtensions` precies
één entry bevatten voor elke `extensions`-entry. Niet-overeenkomende lijsten laten installatie en
plugin-detectie mislukken in plaats van stil terug te vallen op bronpaden. Als je ook
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

### Npm-pakketten die eigendom zijn van OpenClaw tijdens migratie

ClawHub is het primaire distributiepad voor de meeste plugins. Huidige verpakte
OpenClaw-releases bundelen al veel officiële plugins, dus die hebben in normale opstellingen geen
aparte npm-installaties nodig. Totdat elke plugin die eigendom is van OpenClaw
naar ClawHub is gemigreerd, levert OpenClaw nog steeds enkele `@openclaw/*` pluginpakketten op
npm voor oudere/aangepaste installaties en directe npm-workflows.

Als npm een `@openclaw/*` pluginpakket als verouderd meldt, komt die pakketversie
uit een oudere externe pakketreeks. Gebruik de gebundelde plugin uit
huidige OpenClaw of een lokale checkout totdat een nieuwer npm-pakket wordt gepubliceerd.

| Plugin          | Pakket                     | Documentatie                              |
| --------------- | -------------------------- | ------------------------------------------ |
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
    - `memory-core` - gebundelde geheugenzoekfunctie (standaard via `plugins.slots.memory`)
    - `memory-lancedb` - langetermijngeheugen op basis van LanceDB met automatisch ophalen/vastleggen (stel `plugins.slots.memory = "memory-lancedb"` in)

    Zie [Memory LanceDB](/nl/plugins/memory-lancedb) voor OpenAI-compatibele
    embeddingconfiguratie, Ollama-voorbeelden, ophaallimieten en probleemoplossing.

  </Accordion>

  <Accordion title="Spraakproviders (standaard ingeschakeld)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Overig">
    - `browser` - gebundelde browserplugin voor de browsertool, `openclaw browser` CLI, Gateway-methode `browser.request`, browserruntime en standaard browserbesturingsservice (standaard ingeschakeld; schakel uit voordat je deze vervangt)
    - `copilot-proxy` - VS Code Copilot Proxy-brug (standaard uitgeschakeld)

  </Accordion>
</AccordionGroup>

Op zoek naar plugins van derden? Zie [ClawHub](/nl/clawhub).

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
| `allow`            | Plugin-allowlist (optioneel)                             |
| `bundledDiscovery` | Ontdekkingsmodus voor gebundelde plugins (standaard `allowlist`) |
| `deny`             | Plugin-denylist (optioneel; deny wint)                   |
| `load.paths`       | Extra pluginbestanden/-mappen                            |
| `slots`            | Exclusieve slotselectors (bijv. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Schakelaars + configuratie per plugin                    |

`plugins.allow` is exclusief. Wanneer deze niet leeg is, kunnen alleen vermelde plugins laden
of tools beschikbaar stellen, zelfs als `tools.allow` `"*"` of een specifieke toolnaam van
een plugin bevat. Als een tool-allowlist naar plugintools verwijst, voeg dan de eigenaar-plugin-id's
toe aan `plugins.allow` of verwijder `plugins.allow`; `openclaw doctor` waarschuwt voor deze
vorm.

`plugins.bundledDiscovery` is standaard `"allowlist"` voor nieuwe configuraties, zodat een
beperkende `plugins.allow`-inventaris ook weggelaten gebundelde providerplugins blokkeert,
inclusief runtime-ontdekking van webzoekproviders. Doctor markeert oudere
beperkende allowlist-configuraties tijdens migratie met `"compat"`, zodat upgrades het
oude gedrag van gebundelde providers behouden totdat de operator kiest voor de striktere modus.
Een lege `plugins.allow` wordt nog steeds behandeld als niet ingesteld/open.

Configuratiewijzigingen via `/plugins enable` of `/plugins disable` activeren een
in-process herlaadactie van Gateway-plugins. Nieuwe agentbeurten bouwen hun toollijst opnieuw op vanuit
het vernieuwde pluginregister. Bewerkingen die broncode wijzigen, zoals installeren,
bijwerken en verwijderen, herstarten nog steeds het Gateway-proces omdat al geïmporteerde
pluginmodules niet veilig ter plekke kunnen worden vervangen.

`openclaw plugins list` is een lokale momentopname van pluginregister/configuratie. Een
`enabled` plugin daar betekent dat het vastgelegde register en de huidige configuratie de
plugin toestaan deel te nemen. Het bewijst niet dat een al draaiende externe Gateway
opnieuw is geladen of herstart met dezelfde plugincode. In VPS-/containeropstellingen
met wrapperprocessen stuur je herstarts of schrijfacties die herladen activeren naar het daadwerkelijke
`openclaw gateway run`-proces, of gebruik je `openclaw gateway restart` tegen de
draaiende Gateway wanneer de herlaadactie een fout meldt.

<Accordion title="Pluginstatussen: uitgeschakeld vs ontbrekend vs ongeldig">
  - **Uitgeschakeld**: plugin bestaat, maar inschakelregels hebben deze uitgezet. Configuratie blijft behouden.
  - **Ontbrekend**: configuratie verwijst naar een plugin-id die discovery niet heeft gevonden.
  - **Ongeldig**: plugin bestaat, maar de configuratie komt niet overeen met het gedeclareerde schema. Het opstarten van Gateway slaat alleen die plugin over; `openclaw doctor --fix` kan de ongeldige entry isoleren door deze uit te schakelen en de configuratiepayload te verwijderen.

</Accordion>

## Discovery en prioriteit

OpenClaw scant naar plugins in deze volgorde (eerste overeenkomst wint):

<Steps>
  <Step title="Configuratiepaden">
    `plugins.load.paths` - expliciete bestands- of mappaden. Paden die
    terugwijzen naar OpenClaw's eigen verpakte gebundelde pluginmappen worden genegeerd;
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

Verpakte installaties en Docker-images lossen gebundelde plugins normaal op vanuit de
gecompileerde `dist/extensions`-boom. Als een bronmap van een gebundelde plugin
bind-mounted is over het overeenkomende verpakte bronpad, bijvoorbeeld
`/app/extensions/synology-chat`, behandelt OpenClaw die gekoppelde bronmap
als een gebundelde bronoverlay en ontdekt deze vóór de verpakte
`/app/dist/extensions/synology-chat`-bundel. Dit houdt containerloops voor maintainers
werkend zonder elke gebundelde plugin terug te schakelen naar TypeScript-broncode.
Stel `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` in om verpakte dist-bundels af te dwingen,
zelfs wanneer bronoverlay-mounts aanwezig zijn.

### Inschakelregels

- `plugins.enabled: false` schakelt alle plugins uit en slaat plugin discovery/load-werk over
- `plugins.deny` wint altijd van allow
- `plugins.entries.\<id\>.enabled: false` schakelt die plugin uit
- Plugins afkomstig uit de werkruimte zijn **standaard uitgeschakeld** (moeten expliciet worden ingeschakeld)
- Gebundelde plugins volgen de ingebouwde standaard-aan-set tenzij overschreven
- Exclusieve slots kunnen de geselecteerde plugin voor dat slot geforceerd inschakelen
- Sommige gebundelde opt-in-plugins worden automatisch ingeschakeld wanneer configuratie een
  oppervlak noemt dat eigendom is van een plugin, zoals een provider-modelreferentie, kanaalconfiguratie of harness
  runtime
- Verouderde pluginconfiguratie blijft behouden terwijl `plugins.enabled: false` actief is;
  schakel plugins opnieuw in voordat je doctor cleanup uitvoert als je verouderde id's wilt verwijderen
- OpenAI-familie Codex-routes houden afzonderlijke plugingrenzen:
  `openai-codex/*` hoort bij de OpenAI-plugin, terwijl de gebundelde Codex
  appserverplugin wordt geselecteerd door canonieke `openai/*`-agentreferenties, expliciete
  provider/model `agentRuntime.id: "codex"`, of legacy `codex/*`-modelreferenties

## Runtime-hooks probleemoplossen

Als een plugin in `plugins list` verschijnt maar `register(api)`-neveneffecten of hooks
niet draaien in live chatverkeer, controleer dan eerst dit:

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
- Voor modelwisseling geef je de voorkeur aan `before_model_resolve`. Deze draait vóór model-
  resolutie voor agentbeurten; `llm_output` draait pas nadat een modelpoging
  assistant-output produceert.
- Gebruik voor bewijs van het effectieve sessiemodel `openclaw sessions` of de
  Gateway-sessie-/statusoppervlakken en start, wanneer je providerpayloads debugt, de
  Gateway met `--raw-stream --raw-stream-path <path>`.

### Trage plugintool-initialisatie

Als agentbeurten lijken te blokkeren tijdens het voorbereiden van tools, schakel trace-logging in en
controleer op timingsregels voor plugintool-factories:

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
optioneel is. Trage regels worden gepromoveerd tot waarschuwingen wanneer één factory ten minste
1s duurt of de totale voorbereiding van plugintool-factories ten minste 5s duurt.

OpenClaw cachet succesvolle resultaten van plugintool-factories voor herhaalde resoluties
met dezelfde effectieve aanvraagcontext. De cachesleutel bevat de effectieve
runtimeconfiguratie, werkruimte, agent-/sessie-id's, sandboxbeleid, browserinstellingen,
deliverycontext, identiteit van de aanvrager en eigendomsstatus, zodat factories die
afhangen van die vertrouwde velden opnieuw worden uitgevoerd wanneer de context verandert.

Als één plugin de timing domineert, inspecteer dan de runtime-registraties:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Werk die plugin vervolgens bij, installeer deze opnieuw of schakel deze uit. Pluginauteurs moeten
het laden van dure afhankelijkheden verplaatsen naar het toolexecutiepad in plaats van dit
in de toolfactory te doen.

### Dubbel kanaal- of tooleigenaarschap

Symptomen:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Dit betekent dat meer dan één ingeschakelde plugin hetzelfde kanaal,
dezelfde setupflow of dezelfde toolnaam probeert te bezitten. De meest voorkomende oorzaak is een externe kanaalplugin
die is geïnstalleerd naast een gebundelde plugin die nu dezelfde channel-id biedt.

Debugstappen:

- Voer `openclaw plugins list --enabled --verbose` uit om elke ingeschakelde plugin
  en herkomst te zien.
- Voer `openclaw plugins inspect <id> --runtime --json` uit voor elke verdachte plugin en
  vergelijk `channels`, `channelConfigs`, `tools` en diagnostics.
- Voer `openclaw plugins registry --refresh` uit na het installeren of verwijderen van
  pluginpakketten zodat vastgelegde metadata de huidige installatie weerspiegelen.
- Herstart de Gateway na wijzigingen aan installatie, register of configuratie.

Oplossingsopties:

- Als één plugin bewust een andere vervangt voor dezelfde channel-id, moet de
  voorkeursplugin `channelConfigs.<channel-id>.preferOver` declareren met
  de plugin-id met lagere prioriteit. Zie [/plugins/manifest#replacing-another-channel-plugin](/nl/plugins/manifest#replacing-another-channel-plugin).
- Als de duplicatie per ongeluk is, schakel dan één kant uit met
  `plugins.entries.<plugin-id>.enabled: false` of verwijder de verouderde plugin-
  installatie.
- Als je beide plugins expliciet hebt ingeschakeld, behoudt OpenClaw dat verzoek en
  meldt het conflict. Kies één eigenaar voor het kanaal of hernoem tools die eigendom zijn van plugins
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

Gebundelde plugins worden met OpenClaw meegeleverd. Veel zijn standaard ingeschakeld (bijvoorbeeld
gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browser-
plugin). Andere gebundelde plugins hebben nog steeds `openclaw plugins enable <id>` nodig.

`--force` overschrijft een bestaande geïnstalleerde plugin of hookpack op dezelfde plek. Gebruik
`openclaw plugins update <id-or-npm-spec>` voor reguliere upgrades van gevolgde npm-
plugins. Dit wordt niet ondersteund met `--link`, dat het bronpad hergebruikt in plaats
van over een beheerd installatiedoel heen te kopiëren.

Wanneer `plugins.allow` al is ingesteld, voegt `openclaw plugins install` de
geïnstalleerde plugin-id toe aan die toelatingslijst voordat deze wordt ingeschakeld. Als dezelfde plugin-id
aanwezig is in `plugins.deny`, verwijdert install die verouderde deny-vermelding zodat de
expliciete installatie direct na herstart kan worden geladen.

OpenClaw bewaart een persistent lokaal pluginregister als het cold-read-model voor
plugininventaris, eigenaarschap van bijdragen en opstartplanning. Install-, update-,
uninstall-, enable- en disable-flows vernieuwen dat register nadat ze de pluginstatus
hebben gewijzigd. Hetzelfde bestand `plugins/installs.json` bewaart duurzame installatiemetadata in
`installRecords` op topniveau en opnieuw opbouwbare manifestmetadata in `plugins`. Als
het register ontbreekt, verouderd of ongeldig is, bouwt `openclaw plugins registry
--refresh` de manifestweergave opnieuw op uit installatierecords, configuratiebeleid en
manifest-/pakketmetadata zonder plugin-runtime-modules te laden.

In Nix-modus (`OPENCLAW_NIX_MODE=1`) zijn mutators voor de pluginlevenscyclus uitgeschakeld.
Beheer in plaats daarvan de selectie van pluginpakketten en configuratie via de Nix-bron voor de
installatie; begin voor nix-openclaw met de agent-first
[Quick Start](https://github.com/openclaw/nix-openclaw#quick-start).
`openclaw plugins update <id-or-npm-spec>` geldt voor gevolgde installaties. Het doorgeven
van een npm-pakketspecificatie met een dist-tag of exacte versie herleidt de pakketnaam
terug naar het gevolgde pluginrecord en legt de nieuwe specificatie vast voor toekomstige updates.
Het doorgeven van de pakketnaam zonder versie verplaatst een exact vastgepinde installatie terug naar
de standaard releaselijn van het register. Als de geïnstalleerde npm-plugin al overeenkomt met
de herleide versie en vastgelegde artifact-identiteit, slaat OpenClaw de update over
zonder te downloaden, opnieuw te installeren of configuratie te herschrijven.
Wanneer `openclaw update` op het bètakanaal draait, proberen npm- en ClawHub-
pluginrecords op de standaardlijn eerst `@beta` en vallen ze terug op default/latest wanneer er geen
bètarelease van de plugin bestaat. Exacte versies en expliciete tags blijven vastgepind.

`--pin` is alleen voor npm. Het wordt niet ondersteund met `--marketplace`, omdat
marketplace-installaties bronmetadata van de marketplace bewaren in plaats van een npm-specificatie.

`--dangerously-force-unsafe-install` is een noodoverride voor false positives
van de ingebouwde scanner voor gevaarlijke code. Hiermee kunnen plugininstallaties
en pluginupdates doorgaan voorbij ingebouwde `critical`-bevindingen, maar het omzeilt nog steeds
geen beleidsblokkades van plugin-`before_install` of blokkering bij scanfouten.
Installatiescans negeren gangbare testbestanden en -mappen zoals `tests/`,
`__tests__/`, `*.test.*` en `*.spec.*` om te voorkomen dat meegeleverde testmocks worden geblokkeerd;
gedeclareerde runtime-entrypoints van plugins worden nog steeds gescand, zelfs als ze een van
die namen gebruiken.

Deze CLI-vlag geldt alleen voor installatie-/updateflows van plugins. Gateway-ondersteunde installaties
van Skills-afhankelijkheden gebruiken in plaats daarvan de bijbehorende request-override
`dangerouslyForceUnsafeInstall`, terwijl `openclaw skills install` de afzonderlijke ClawHub-
download-/installatieflow voor Skills blijft.

Als een plugin die je op ClawHub hebt gepubliceerd verborgen is of door een scan wordt geblokkeerd, open dan het
ClawHub-dashboard of voer `clawhub package rescan <name>` uit om ClawHub te vragen
deze opnieuw te controleren. `--dangerously-force-unsafe-install` heeft alleen invloed op installaties op je eigen
machine; het vraagt ClawHub niet om de plugin opnieuw te scannen of een geblokkeerde release
openbaar te maken.

Compatibele bundels nemen deel aan dezelfde flow voor pluginlist/inspect/enable/disable.
De huidige runtime-ondersteuning omvat bundel-Skills, Claude command-Skills,
standaardwaarden voor Claude `settings.json`, standaardwaarden voor Claude `.lsp.json` en door het manifest gedeclareerde
`lspServers`, Cursor command-Skills en compatibele Codex-hook-
mappen.

`openclaw plugins inspect <id>` rapporteert ook gedetecteerde bundelcapaciteiten plus
ondersteunde of niet-ondersteunde MCP- en LSP-serververmeldingen voor bundelondersteunde plugins.

Marketplace-bronnen kunnen een Claude bekende-marketplace-naam zijn uit
`~/.claude/plugins/known_marketplaces.json`, een lokale marketplace-root of
`marketplace.json`-pad, een GitHub-shorthand zoals `owner/repo`, een GitHub-repo-
URL of een git-URL. Voor externe marketplaces moeten pluginvermeldingen binnen de
gekloonde marketplace-repo blijven en alleen relatieve padbronnen gebruiken.

Zie de [`openclaw plugins` CLI-referentie](/nl/cli/plugins) voor volledige details.

## Overzicht van de Plugin-API

Native plugins exporteren een entry-object dat `register(api)` aanbiedt. Oudere
plugins kunnen nog steeds `activate(api)` als legacy-alias gebruiken, maar nieuwe plugins moeten
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
maar gebundelde plugins en nieuwe externe plugins moeten `register` als het
publieke contract beschouwen.

`api.registrationMode` vertelt een plugin waarom de entry wordt geladen:

| Modus           | Betekenis                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-activatie. Registreer tools, hooks, services, commands, routes en andere live neveneffecten.                            |
| `discovery`     | Alleen-lezen capaciteitsdetectie. Registreer providers en metadata; vertrouwde plugin-entrycode mag laden, maar sla live neveneffecten over. |
| `setup-only`    | Laden van channel-setupmetadata via een lichte setup-entry.                                                                      |
| `setup-runtime` | Channel-setup laden waarvoor ook de runtime-entry nodig is.                                                                      |
| `cli-metadata`  | Alleen verzameling van CLI-commandmetadata.                                                                                      |

Plugin-entries die sockets, databases, achtergrondwerkers of langlevende
clients openen, moeten die neveneffecten bewaken met `api.registrationMode === "full"`.
Discovery-loads worden apart gecachet van activatieloads en vervangen niet
het actieve Gateway-register. Discovery is niet-activerend, niet importvrij:
OpenClaw kan de vertrouwde plugin-entry of channel-pluginmodule evalueren om
de snapshot te bouwen. Houd module-topniveaus licht en vrij van neveneffecten, en verplaats
netwerkclients, subprocessen, listeners, credential-reads en serviceopstart
achter full-runtime-paden.

Veelgebruikte registratiemethoden:

| Methode                                 | Wat deze registreert          |
| --------------------------------------- | ----------------------------- |
| `registerProvider`                      | Modelprovider (LLM)           |
| `registerChannel`                       | Chatkanaal                    |
| `registerTool`                          | Agenttool                     |
| `registerHook` / `on(...)`              | Lifecycle-hooks               |
| `registerSpeechProvider`                | Tekst-naar-spraak / STT       |
| `registerRealtimeTranscriptionProvider` | Streaming-STT                 |
| `registerRealtimeVoiceProvider`         | Duplex realtime spraak        |
| `registerMediaUnderstandingProvider`    | Afbeeldings-/audioanalyse     |
| `registerImageGenerationProvider`       | Afbeeldingsgeneratie          |
| `registerMusicGenerationProvider`       | Muziekgeneratie               |
| `registerVideoGenerationProvider`       | Videogeneratie                |
| `registerWebFetchProvider`              | Webfetch-/scrapeprovider      |
| `registerWebSearchProvider`             | Webzoekfunctie                |
| `registerHttpRoute`                     | HTTP-endpoint                 |
| `registerCommand` / `registerCli`       | CLI-commands                  |
| `registerContextEngine`                 | Context-engine                |
| `registerService`                       | Achtergrondservice            |

Hook-guardgedrag voor getypte lifecycle-hooks:

- `before_tool_call`: `{ block: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `before_tool_call`: `{ block: false }` is een no-op en wist een eerdere blokkade niet.
- `before_install`: `{ block: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `before_install`: `{ block: false }` is een no-op en wist een eerdere blokkade niet.
- `message_sending`: `{ cancel: true }` is terminaal; handlers met lagere prioriteit worden overgeslagen.
- `message_sending`: `{ cancel: false }` is een no-op en wist een eerdere annulering niet.

Native Codex app-server-runs koppelen Codex-native tool-events terug naar dit
hook-oppervlak. Plugins kunnen native Codex-tools blokkeren via `before_tool_call`,
resultaten observeren via `after_tool_call` en deelnemen aan Codex
`PermissionRequest`-goedkeuringen. De bridge herschrijft Codex-native tool-
argumenten nog niet. De exacte grens voor Codex-runtimeondersteuning staat in het
[Codex harness v1-ondersteuningscontract](/nl/plugins/codex-harness-runtime#v1-support-contract).

Zie voor volledig getypeerd hook-gedrag het [SDK-overzicht](/nl/plugins/sdk-overview#hook-decision-semantics).

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins) - maak je eigen plugin
- [Plugin-bundels](/nl/plugins/bundles) - compatibiliteit met Codex/Claude/Cursor-bundels
- [Plugin manifest](/nl/plugins/manifest) - manifestschema
- [Tools registreren](/nl/plugins/building-plugins#registering-agent-tools) - voeg agenttools toe in een plugin
- [Plugin-internals](/nl/plugins/architecture) - capabilitymodel en laadpipeline
- [ClawHub](/nl/clawhub) - ontdekking van plugins van derden
