---
read_when:
    - Je wilt Gateway-plugins of compatibele bundels installeren of beheren
    - Je wilt Plugin-laadfouten debuggen
sidebarTitle: Plugins
summary: CLI-referentie voor `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-30T09:34:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 381e3243eaefb5b5e31db8fd2ba459773649a6ef427080a12018ea92b25f707c
    source_path: cli/plugins.md
    workflow: 16
---

Beheer Gateway-plugins, hook-pakketten en compatibele bundels.

<CardGroup cols={2}>
  <Card title="Plugin-systeem" href="/nl/tools/plugin">
    Eindgebruikershandleiding voor het installeren, inschakelen en oplossen van problemen met plugins.
  </Card>
  <Card title="Plugin-bundels" href="/nl/plugins/bundles">
    Compatibiliteitsmodel voor bundels.
  </Card>
  <Card title="Plugin-manifest" href="/nl/plugins/manifest">
    Manifestvelden en configuratieschema.
  </Card>
  <Card title="Beveiliging" href="/nl/gateway/security">
    Beveiligingsverharding voor plugin-installaties.
  </Card>
</CardGroup>

## Opdrachten

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Voor onderzoek naar trage installatie, inspectie, verwijdering of registry-verversing voert u de
opdracht uit met `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. De trace schrijft fasetimings
naar stderr en houdt JSON-uitvoer parseerbaar. Zie [Foutopsporing](/nl/help/debugging#plugin-lifecycle-trace).

<Note>
Gebundelde plugins worden met OpenClaw meegeleverd. Sommige zijn standaard ingeschakeld (bijvoorbeeld gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browserplugin); andere vereisen `plugins enable`.

Native OpenClaw-plugins moeten `openclaw.plugin.json` leveren met een inline JSON Schema (`configSchema`, zelfs als het leeg is). Compatibele bundels gebruiken in plaats daarvan hun eigen bundelmanifesten.

`plugins list` toont `Format: openclaw` of `Format: bundle`. Uitgebreide list/info-uitvoer toont ook het bundelsubtype (`codex`, `claude` of `cursor`) plus gedetecteerde bundelmogelijkheden.
</Note>

### Installeren

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Kale pakketnamen worden eerst tegen ClawHub gecontroleerd en daarna tegen npm. Behandel plugin-installaties alsof u code uitvoert. Geef de voorkeur aan vastgezette versies.
</Warning>

<Note>
ClawHub is het primaire distributie- en ontdekkingsoppervlak voor de meeste plugins. Npm
blijft een ondersteunde fallback en route voor directe installatie. Tijdens de migratie naar
ClawHub levert OpenClaw nog steeds enkele door OpenClaw beheerde `@openclaw/*`-pluginpakketten
op npm; die pakketversies kunnen achterlopen op de gebundelde broncode tussen plugin-release
reeksen. Als npm een door OpenClaw beheerd pluginpakket als deprecated meldt, is die
gepubliceerde versie een oud extern artefact; gebruik de plugin die is gebundeld met
de huidige OpenClaw of een lokale checkout totdat een nieuwer npm-pakket is gepubliceerd.
</Note>

<AccordionGroup>
  <Accordion title="Config-includes en herstel van ongeldige configuratie">
    Als uw `plugins`-sectie wordt ondersteund door een `$include` met een enkel bestand, schrijven `plugins install/update/enable/disable/uninstall` door naar dat geïncludeerde bestand en laten ze `openclaw.json` ongemoeid. Root-includes, include-arrays en includes met sibling-overrides falen gesloten in plaats van af te vlakken. Zie [Config-includes](/nl/gateway/configuration) voor de ondersteunde vormen.

    Als de configuratie tijdens installatie ongeldig is, faalt `plugins install` normaal gesproken gesloten en vertelt het u eerst `openclaw doctor --fix` uit te voeren. Tijdens het opstarten van de Gateway wordt ongeldige configuratie voor één plugin geïsoleerd tot die plugin, zodat andere kanalen en plugins kunnen blijven draaien; `openclaw doctor --fix` kan de ongeldige pluginvermelding in quarantaine plaatsen. De enige gedocumenteerde uitzondering tijdens installatie is een smal herstelpad voor gebundelde plugins voor plugins die expliciet kiezen voor `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force en opnieuw installeren versus update">
    `--force` hergebruikt het bestaande installatiedoel en overschrijft een al geïnstalleerde plugin of hook-pakket ter plekke. Gebruik dit wanneer u bewust dezelfde id opnieuw installeert vanuit een nieuw lokaal pad, archief, ClawHub-pakket of npm-artefact. Voor routinematige upgrades van een al gevolgde npm-plugin geeft u de voorkeur aan `openclaw plugins update <id-or-npm-spec>`.

    Als u `plugins install` uitvoert voor een plugin-id die al is geïnstalleerd, stopt OpenClaw en verwijst het u naar `plugins update <id-or-npm-spec>` voor een normale upgrade, of naar `plugins install <package> --force` wanneer u de huidige installatie echt vanuit een andere bron wilt overschrijven.

  </Accordion>
  <Accordion title="Bereik van --pin">
    `--pin` is alleen van toepassing op npm-installaties. Het wordt niet ondersteund met `--marketplace`, omdat marketplace-installaties marketplace-bronmetadata bewaren in plaats van een npm-specificatie.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` is een noodoptie voor fout-positieven in de ingebouwde scanner voor gevaarlijke code. Hiermee kan de installatie doorgaan, zelfs wanneer de ingebouwde scanner `critical`-bevindingen rapporteert, maar het omzeilt **niet** de beleidsblokkades van plugin-`before_install`-hooks en omzeilt **niet** scanfouten.

    Deze CLI-vlag is van toepassing op plugin-installatie- en updateflows. Door de Gateway ondersteunde installaties van Skills-afhankelijkheden gebruiken de bijpassende request-override `dangerouslyForceUnsafeInstall`, terwijl `openclaw skills install` een afzonderlijke download-/installatieflow voor ClawHub-Skills blijft.

    Als een plugin die u op ClawHub hebt gepubliceerd wordt geblokkeerd door een registryscan, gebruikt u de publicatiestappen in [ClawHub](/nl/tools/clawhub).

  </Accordion>
  <Accordion title="Hook-pakketten en npm-specificaties">
    `plugins install` is ook het installatieoppervlak voor hook-pakketten die `openclaw.hooks` in `package.json` beschikbaar maken. Gebruik `openclaw hooks` voor gefilterde zichtbaarheid van hooks en inschakeling per hook, niet voor pakketinstallatie.

    Npm-specificaties zijn **alleen registry** (pakketnaam + optionele **exacte versie** of **dist-tag**). Git-/URL-/bestandsspecificaties en semver-reeksen worden geweigerd. Afhankelijkheidsinstallaties draaien projectlokaal met `--ignore-scripts` voor veiligheid, zelfs wanneer uw shell globale npm-installatie-instellingen heeft.

    Gebruik `npm:<package>` wanneer u ClawHub-lookup wilt overslaan en rechtstreeks vanaf npm wilt installeren. Kale pakketspecificaties geven nog steeds de voorkeur aan ClawHub en vallen alleen terug op npm wanneer ClawHub dat pakket of die versie niet heeft.

    Kale specificaties en `@latest` blijven op het stable-spoor. Als npm een van beide naar een prerelease resolveert, stopt OpenClaw en vraagt het u expliciet in te stemmen met een prerelease-tag zoals `@beta`/`@rc` of een exacte prerelease-versie zoals `@1.2.3-beta.4`.

    Als een kale installatiespecificatie overeenkomt met een gebundelde plugin-id (bijvoorbeeld `diffs`), installeert OpenClaw de gebundelde plugin rechtstreeks. Gebruik een expliciete scoped-specificatie (bijvoorbeeld `@scope/diffs`) om een npm-pakket met dezelfde naam te installeren.

  </Accordion>
  <Accordion title="Archieven">
    Ondersteunde archieven: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-pluginarchieven moeten een geldige `openclaw.plugin.json` bevatten in de uitgepakte plugin-root; archieven die alleen `package.json` bevatten, worden geweigerd voordat OpenClaw installatierecords schrijft.

    Claude-marketplace-installaties worden ook ondersteund.

  </Accordion>
</AccordionGroup>

ClawHub-installaties gebruiken een expliciete `clawhub:<package>`-locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw geeft nu ook de voorkeur aan ClawHub voor kale npm-veilige pluginspecificaties. Het valt alleen terug op npm als ClawHub dat pakket of die versie niet heeft:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gebruik `npm:` om npm-only-resolutie af te dwingen, bijvoorbeeld wanneer ClawHub onbereikbaar is of u weet dat het pakket alleen op npm bestaat:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw downloadt het pakketarchief van ClawHub, controleert de geadverteerde plugin-API / minimale Gateway-compatibiliteit en installeert het vervolgens via het normale archiefpad. Vastgelegde installaties behouden hun ClawHub-bronmetadata voor latere updates.
Ongeversioneerde ClawHub-installaties behouden een ongeversioneerde vastgelegde specificatie, zodat `openclaw plugins update` nieuwere ClawHub-releases kan volgen; expliciete versie- of tagselectors zoals `clawhub:pkg@1.2.3` en `clawhub:pkg@beta` blijven vastgezet op die selector.

#### Marketplace-shorthand

Gebruik de shorthand `plugin@marketplace` wanneer de marketplace-naam bestaat in Claude's lokale registrycache op `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Gebruik `--marketplace` wanneer u de marketplace-bron expliciet wilt doorgeven:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace-bronnen">
    - een bekende Claude-marketplace-naam uit `~/.claude/plugins/known_marketplaces.json`
    - een lokale marketplace-root of `marketplace.json`-pad
    - een GitHub-repo-shorthand zoals `owner/repo`
    - een GitHub-repo-URL zoals `https://github.com/owner/repo`
    - een git-URL

  </Tab>
  <Tab title="Regels voor externe marketplaces">
    Voor externe marketplaces die vanuit GitHub of git worden geladen, moeten pluginvermeldingen binnen de gekloonde marketplace-repo blijven. OpenClaw accepteert relatieve padbronnen uit die repo en weigert HTTP(S), absolute paden, git, GitHub en andere niet-pad-pluginbronnen uit externe manifesten.
  </Tab>
</Tabs>

Voor lokale paden en archieven detecteert OpenClaw automatisch:

- native OpenClaw-plugins (`openclaw.plugin.json`)
- Codex-compatibele bundels (`.codex-plugin/plugin.json`)
- Claude-compatibele bundels (`.claude-plugin/plugin.json` of de standaard Claude-componentindeling)
- Cursor-compatibele bundels (`.cursor-plugin/plugin.json`)

<Note>
Compatibele bundels worden geïnstalleerd in de normale plugin-root en nemen deel aan dezelfde list/info/enable/disable-flow. Momenteel worden bundel-Skills, Claude-command-skills, standaardwaarden voor Claude-`settings.json`, standaardwaarden voor Claude-`.lsp.json` / in het manifest gedeclareerde `lspServers`, Cursor-command-skills en compatibele Codex-hookdirectories ondersteund; andere gedetecteerde bundelmogelijkheden worden getoond in diagnostiek/info, maar zijn nog niet aangesloten op runtime-uitvoering.
</Note>

### Lijst

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Toon alleen ingeschakelde plugins.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Schakel over van de tabelweergave naar detailregels per plugin met metadata over bron/oorsprong/versie/activering.
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare inventaris plus registrydiagnostiek.
</ParamField>

<Note>
`plugins list` leest eerst het opgeslagen lokale Plugin-register, met een alleen-uit-het-manifest afgeleide fallback wanneer het register ontbreekt of ongeldig is. Dit is nuttig om te controleren of een Plugin is geïnstalleerd, ingeschakeld en zichtbaar is voor planning bij koude start, maar het is geen live runtime-probe van een al draaiend Gateway-proces. Start na het wijzigen van Plugin-code, inschakeling, hookbeleid of `plugins.load.paths` de Gateway opnieuw die het kanaal bedient voordat je verwacht dat nieuwe `register(api)`-code of hooks worden uitgevoerd. Controleer bij remote/containerdeployments of je het daadwerkelijke `openclaw gateway run`-childproces opnieuw start, niet alleen een wrapperproces.
</Note>

Voor werk aan gebundelde Plugins binnen een verpakte Docker-image, bind-mount je de bronmap van de Plugin over het overeenkomende verpakte bronpad, zoals `/app/extensions/synology-chat`. OpenClaw ontdekt die gemounte bron-overlay vóór `/app/dist/extensions/synology-chat`; een gewone gekopieerde bronmap blijft inert, zodat normale verpakte installaties nog steeds de gecompileerde dist gebruiken.

Voor het debuggen van runtime-hooks:

- `openclaw plugins inspect <id> --json` toont geregistreerde hooks en diagnostiek uit een module-geladen inspectiepass.
- `openclaw gateway status --deep --require-rpc` bevestigt de bereikbare Gateway, service-/proceshints, het configuratiepad en de RPC-gezondheid.
- Niet-gebundelde conversation hooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) vereisen `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gebruik `--link` om te voorkomen dat een lokale map wordt gekopieerd (voegt toe aan `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wordt niet ondersteund met `--link`, omdat gekoppelde installaties het bronpad hergebruiken in plaats van over een beheerd installatiedoel heen te kopiëren.

Gebruik `--pin` bij npm-installaties om de opgeloste exacte spec (`name@version`) op te slaan in de beheerde Plugin-index, terwijl het standaardgedrag ongepind blijft.
</Note>

### Plugin-index

Installatiemetadata van Plugins is machinaal beheerde status, geen gebruikersconfiguratie. Installaties en updates schrijven dit naar `plugins/installs.json` onder de actieve OpenClaw-statusmap. De top-level `installRecords`-map is de duurzame bron van installatiemetadata, inclusief records voor kapotte of ontbrekende Plugin-manifesten. De `plugins`-array is de uit het manifest afgeleide cache van het koude register. Het bestand bevat een waarschuwing om het niet te bewerken en wordt gebruikt door `openclaw plugins update`, de-installatie, diagnostiek en het koude Plugin-register.

Wanneer OpenClaw meegeleverde legacy `plugins.installs`-records in de configuratie ziet, verplaatst het die naar de Plugin-index en verwijdert het de configuratiesleutel; als een van beide schrijfacties mislukt, blijven de configuratierecords behouden zodat de installatiemetadata niet verloren gaat.

### Runtime-afhankelijkheden

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` inspecteert de verpakte runtime-afhankelijkhedenfase voor gebundelde Plugins die eigendom zijn van OpenClaw en zijn geselecteerd door Plugin-configuratie, ingeschakelde/geconfigureerde kanalen, geconfigureerde modelproviders of standaardwaarden uit gebundelde manifesten. Het is niet het installatie-/updatepad voor externe npm- of ClawHub-Plugins.

Gebruik `--repair` wanneer een verpakte installatie ontbrekende gebundelde runtime-afhankelijkheden meldt tijdens het starten van de Gateway of `plugins doctor`. Herstel installeert alleen ontbrekende ingeschakelde afhankelijkheden van gebundelde Plugins met uitgeschakelde levenscyclusscripts. Gebruik `--prune` om verouderde onbekende externe roots voor runtime-afhankelijkheden te verwijderen die door oudere verpakte layouts zijn achtergelaten.

### De-installeren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` verwijdert Plugin-records uit `plugins.entries`, de opgeslagen Plugin-index, Plugin-allow-/denylist-vermeldingen en gekoppelde `plugins.load.paths`-vermeldingen waar van toepassing. Tenzij `--keep-files` is ingesteld, verwijdert de-installatie ook de bijgehouden beheerde installatiemap wanneer die zich binnen de Plugin-extensieroot van OpenClaw bevindt. Voor active memory-Plugins wordt de geheugensleuf teruggezet naar `memory-core`.

<Note>
`--keep-config` wordt ondersteund als verouderde alias voor `--keep-files`.
</Note>

### Bijwerken

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Updates zijn van toepassing op bijgehouden Plugin-installaties in de beheerde Plugin-index en bijgehouden hook-pack-installaties in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Plugin-id versus npm-spec oplossen">
    Wanneer je een Plugin-id doorgeeft, hergebruikt OpenClaw de geregistreerde installatiespec voor die Plugin. Dat betekent dat eerder opgeslagen dist-tags zoals `@beta` en exact gepinde versies bij latere `update <id>`-runs gebruikt blijven worden.

    Voor npm-installaties kun je ook een expliciete npm-pakketspec met een dist-tag of exacte versie doorgeven. OpenClaw herleidt die pakketnaam naar het bijgehouden Plugin-record, werkt die geïnstalleerde Plugin bij en registreert de nieuwe npm-spec voor toekomstige updates op basis van id.

    Het doorgeven van de npm-pakketnaam zonder versie of tag herleidt ook naar het bijgehouden Plugin-record. Gebruik dit wanneer een Plugin aan een exacte versie was gepind en je die terug wilt zetten naar de standaard releaselijn van het register.

  </Accordion>
  <Accordion title="Versiecontroles en integriteitsdrift">
    Vóór een live npm-update controleert OpenClaw de geïnstalleerde pakketversie tegen de npm-registermetadata. Als de geïnstalleerde versie en geregistreerde artefactidentiteit al overeenkomen met het opgeloste doel, wordt de update overgeslagen zonder downloaden, opnieuw installeren of herschrijven van `openclaw.json`.

    Wanneer er een opgeslagen integriteitshash bestaat en de hash van het opgehaalde artefact verandert, behandelt OpenClaw dit als npm-artefactdrift. Het interactieve commando `openclaw plugins update` toont de verwachte en werkelijke hashes en vraagt om bevestiging voordat het doorgaat. Niet-interactieve updatehelpers falen gesloten tenzij de aanroeper een expliciet vervolgbeleid opgeeft.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install bij update">
    `--dangerously-force-unsafe-install` is ook beschikbaar bij `plugins update` als noodoverride voor vals-positieven in de ingebouwde scan op gevaarlijke code tijdens Plugin-updates. Het omzeilt nog steeds geen Plugin-`before_install`-beleidsblokkades of blokkering door scanfouten, en het is alleen van toepassing op Plugin-updates, niet op hook-pack-updates.
  </Accordion>
</AccordionGroup>

### Inspecteren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Diepe introspectie voor één Plugin. Toont identiteit, laadstatus, bron, geregistreerde capabilities, hooks, tools, commando's, services, Gateway-methoden, HTTP-routes, beleidsvlaggen, diagnostiek, installatiemetadata, bundelcapabilities en eventuele gedetecteerde ondersteuning voor MCP- of LSP-servers.

Elke Plugin wordt geclassificeerd op basis van wat die daadwerkelijk registreert tijdens runtime:

- **plain-capability** — één capabilitytype (bijv. een provider-only Plugin)
- **hybrid-capability** — meerdere capabilitytypen (bijv. tekst + spraak + afbeeldingen)
- **hook-only** — alleen hooks, geen capabilities of surfaces
- **non-capability** — tools/commando's/services maar geen capabilities

Zie [Plugin-vormen](/nl/plugins/architecture#plugin-shapes) voor meer over het capabilitymodel.

<Note>
De vlag `--json` geeft een machineleesbaar rapport uit dat geschikt is voor scripting en auditing. `inspect --all` toont een tabel voor het hele fleet met kolommen voor vorm, capabilitysoorten, compatibiliteitsmeldingen, bundelcapabilities en hooksamenvatting. `info` is een alias voor `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` rapporteert laadfouten van Plugins, manifest-/ontdekkingsdiagnostiek en compatibiliteitsmeldingen. Wanneer alles schoon is, print het `No plugin issues detected.`

Voor modulevormfouten zoals ontbrekende `register`-/`activate`-exports, voer je opnieuw uit met `OPENCLAW_PLUGIN_LOAD_DEBUG=1` om een compacte exportsvormsamenvatting in de diagnostische uitvoer op te nemen.

### Register

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Het lokale Plugin-register is het opgeslagen koude leesmodel van OpenClaw voor geïnstalleerde Plugin-identiteit, inschakeling, bronmetadata en eigenaarschap van bijdragen. Normaal opstarten, provider-eigenaarlookup, classificatie van kanaalsetup en Plugin-inventaris kunnen dit lezen zonder Plugin-runtime-modules te importeren.

Gebruik `plugins registry` om te inspecteren of het opgeslagen register aanwezig, actueel of verouderd is. Gebruik `--refresh` om het opnieuw op te bouwen vanuit de opgeslagen Plugin-index, het configuratiebeleid en manifest-/pakketmetadata. Dit is een herstelpad, geen runtime-activatiepad.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` is een verouderde noodschakelaar voor compatibiliteit bij leesfouten van het register. Geef de voorkeur aan `plugins registry --refresh` of `openclaw doctor --fix`; de env-fallback is alleen bedoeld voor noodherstel bij opstarten terwijl de migratie wordt uitgerold.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list accepteert een lokaal marketplacepad, een `marketplace.json`-pad, een GitHub-afkorting zoals `owner/repo`, een GitHub-repo-URL of een git-URL. `--json` print het opgeloste bronlabel plus het geparsete marketplace-manifest en de Plugin-vermeldingen.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [CLI-referentie](/nl/cli)
- [Community-Plugins](/nl/plugins/community)
