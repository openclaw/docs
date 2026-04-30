---
read_when:
    - Je wilt Gateway-plugins of compatibele bundels installeren of beheren
    - Je wilt fouten bij het laden van Plugins debuggen
sidebarTitle: Plugins
summary: CLI-referentie voor `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-30T00:06:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: c1ba79bccbbb74e3403188afc2dffc06e4215d433e2b23ed998b1fb09419601b
    source_path: cli/plugins.md
    workflow: 16
---

Beheer Gateway-plugins, hook-pakketten en compatibele bundels.

<CardGroup cols={2}>
  <Card title="Pluginsysteem" href="/nl/tools/plugin">
    Eindgebruikersgids voor het installeren, inschakelen en oplossen van problemen met plugins.
  </Card>
  <Card title="Pluginbundels" href="/nl/plugins/bundles">
    Compatibiliteitsmodel voor bundels.
  </Card>
  <Card title="Pluginmanifest" href="/nl/plugins/manifest">
    Manifestvelden en configuratieschema.
  </Card>
  <Card title="Beveiliging" href="/nl/gateway/security">
    Beveiligingsverharding voor plugininstallaties.
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

Voor onderzoek naar trage installaties, inspecties, verwijderingen of registerverversingen voert u de
opdracht uit met `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. De trace schrijft fasetimings
naar stderr en houdt JSON-uitvoer parseerbaar. Zie [Debugging](/nl/help/debugging#plugin-lifecycle-trace).

<Note>
Gebundelde plugins worden met OpenClaw meegeleverd. Sommige zijn standaard ingeschakeld (bijvoorbeeld gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browserplugin); andere vereisen `plugins enable`.

Native OpenClaw-plugins moeten `openclaw.plugin.json` leveren met een inline JSON Schema (`configSchema`, zelfs als dat leeg is). Compatibele bundels gebruiken in plaats daarvan hun eigen bundelmanifests.

`plugins list` toont `Format: openclaw` of `Format: bundle`. Uitgebreide lijst-/info-uitvoer toont ook het bundelsubtype (`codex`, `claude` of `cursor`) plus gedetecteerde bundelmogelijkheden.
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
Kale pakketnamen worden eerst gecontroleerd in ClawHub en daarna in npm. Behandel plugininstallaties alsof u code uitvoert. Geef de voorkeur aan vastgepinde versies.
</Warning>

<Note>
ClawHub is het primaire distributie- en ontdekkingsoppervlak voor de meeste plugins. Npm
blijft een ondersteunde fallback en route voor directe installatie. Tijdens de migratie naar
ClawHub levert OpenClaw nog steeds enkele OpenClaw-eigen `@openclaw/*`-pluginpakketten
op npm; die pakketversies kunnen achterlopen op de gebundelde broncode tussen pluginrelease-
treinen. Als npm een OpenClaw-eigen pluginpakket als deprecated meldt, is die
gepubliceerde versie een oud extern artifact; gebruik de plugin die met
de huidige OpenClaw is gebundeld of een lokale checkout totdat een nieuwer npm-pakket is gepubliceerd.
</Note>

<AccordionGroup>
  <Accordion title="Config-includes en herstel van ongeldige configuratie">
    Als uw `plugins`-sectie wordt ondersteund door een enkelbestand-`$include`, schrijven `plugins install/update/enable/disable/uninstall` door naar dat geïncludeerde bestand en laten ze `openclaw.json` onaangeroerd. Root-includes, include-arrays en includes met sibling-overrides falen gesloten in plaats van af te vlakken. Zie [Config-includes](/nl/gateway/configuration) voor de ondersteunde vormen.

    Als de configuratie ongeldig is tijdens installatie, faalt `plugins install` normaal gesproken gesloten en vraagt het u eerst `openclaw doctor --fix` uit te voeren. Tijdens het opstarten van de Gateway wordt ongeldige configuratie voor één plugin geïsoleerd tot die plugin, zodat andere kanalen en plugins kunnen blijven draaien; `openclaw doctor --fix` kan de ongeldige pluginvermelding in quarantaine plaatsen. De enige gedocumenteerde uitzondering tijdens installatie is een smal herstelpad voor gebundelde plugins voor plugins die expliciet kiezen voor `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force en herinstalleren versus bijwerken">
    `--force` hergebruikt het bestaande installatiedoel en overschrijft een al geïnstalleerde plugin of hook-pakket op zijn plaats. Gebruik dit wanneer u bewust hetzelfde id opnieuw installeert vanaf een nieuw lokaal pad, archief, ClawHub-pakket of npm-artifact. Voor routinematige upgrades van een al bijgehouden npm-plugin geeft u de voorkeur aan `openclaw plugins update <id-or-npm-spec>`.

    Als u `plugins install` uitvoert voor een plugin-id dat al is geïnstalleerd, stopt OpenClaw en verwijst het u naar `plugins update <id-or-npm-spec>` voor een normale upgrade, of naar `plugins install <package> --force` wanneer u de huidige installatie echt wilt overschrijven vanaf een andere bron.

  </Accordion>
  <Accordion title="Bereik van --pin">
    `--pin` is alleen van toepassing op npm-installaties. Het wordt niet ondersteund met `--marketplace`, omdat marketplace-installaties marketplace-bronmetadata bewaren in plaats van een npm-specificatie.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` is een noodoptie voor fout-positieven in de ingebouwde scanner voor gevaarlijke code. Hiermee kan de installatie doorgaan, zelfs wanneer de ingebouwde scanner `critical`-bevindingen meldt, maar dit omzeilt **niet** beleidsblokkades van plugin-`before_install`-hooks en omzeilt **niet** scanfouten.

    Deze CLI-vlag is van toepassing op plugininstallatie-/bijwerkstromen. Gateway-ondersteunde installaties van skill-afhankelijkheden gebruiken de overeenkomstige request-override `dangerouslyForceUnsafeInstall`, terwijl `openclaw skills install` een afzonderlijke ClawHub-download-/installatiestroom voor skills blijft.

    Als een plugin die u op ClawHub hebt gepubliceerd wordt geblokkeerd door een registerscan, gebruikt u de uitgeversstappen in [ClawHub](/nl/tools/clawhub).

  </Accordion>
  <Accordion title="Hook-pakketten en npm-specificaties">
    `plugins install` is ook het installatieoppervlak voor hook-pakketten die `openclaw.hooks` in `package.json` blootstellen. Gebruik `openclaw hooks` voor gefilterde zichtbaarheid van hooks en inschakeling per hook, niet voor pakketinstallatie.

    Npm-specificaties zijn **alleen register** (pakketnaam + optionele **exacte versie** of **dist-tag**). Git-/URL-/bestandsspecificaties en semver-bereiken worden geweigerd. Afhankelijkheidsinstallaties worden projectlokaal uitgevoerd met `--ignore-scripts` voor veiligheid, zelfs wanneer uw shell globale npm-installatie-instellingen heeft.

    Gebruik `npm:<package>` wanneer u ClawHub-opzoeking wilt overslaan en direct vanuit npm wilt installeren. Kale pakketspecificaties geven nog steeds de voorkeur aan ClawHub en vallen alleen terug op npm wanneer ClawHub dat pakket of die versie niet heeft.

    Kale specificaties en `@latest` blijven op de stabiele track. Als npm een van beide naar een prerelease oplost, stopt OpenClaw en vraagt het u expliciet te kiezen met een prerelease-tag zoals `@beta`/`@rc` of een exacte prereleaseversie zoals `@1.2.3-beta.4`.

    Als een kale installatiespecificatie overeenkomt met een gebundeld plugin-id (bijvoorbeeld `diffs`), installeert OpenClaw de gebundelde plugin direct. Gebruik een expliciete scoped-specificatie (bijvoorbeeld `@scope/diffs`) om een npm-pakket met dezelfde naam te installeren.

  </Accordion>
  <Accordion title="Archieven">
    Ondersteunde archieven: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-pluginarchieven moeten een geldig `openclaw.plugin.json` bevatten in de uitgepakte pluginroot; archieven die alleen `package.json` bevatten, worden geweigerd voordat OpenClaw installatierecords schrijft.

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

Gebruik `npm:` om alleen-npm-resolutie af te dwingen, bijvoorbeeld wanneer ClawHub onbereikbaar is of u weet dat het pakket alleen op npm bestaat:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw downloadt het pakketarchief van ClawHub, controleert de geadverteerde plugin-API-/minimale Gateway-compatibiliteit en installeert het vervolgens via het normale archiefpad. Geregistreerde installaties behouden hun ClawHub-bronmetadata voor latere updates.
Ongeversioneerde ClawHub-installaties behouden een ongeversioneerde geregistreerde specificatie zodat `openclaw plugins update` nieuwere ClawHub-releases kan volgen; expliciete versie- of tagselectors zoals `clawhub:pkg@1.2.3` en `clawhub:pkg@beta` blijven vastgepind op die selector.

#### Marketplace-shorthand

Gebruik de shorthand `plugin@marketplace` wanneer de marketplace-naam bestaat in Claude's lokale registercache op `~/.claude/plugins/known_marketplaces.json`:

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
    - een Claude-naam voor een bekende marketplace uit `~/.claude/plugins/known_marketplaces.json`
    - een lokale marketplace-root of `marketplace.json`-pad
    - een GitHub-reposhorthand zoals `owner/repo`
    - een GitHub-repo-URL zoals `https://github.com/owner/repo`
    - een git-URL

  </Tab>
  <Tab title="Regels voor externe marketplaces">
    Voor externe marketplaces die vanuit GitHub of git worden geladen, moeten pluginvermeldingen binnen de gekloonde marketplace-repo blijven. OpenClaw accepteert relatieve padbronnen uit die repo en weigert HTTP(S), absolute paden, git, GitHub en andere niet-pad-pluginbronnen uit externe manifests.
  </Tab>
</Tabs>

Voor lokale paden en archieven detecteert OpenClaw automatisch:

- native OpenClaw-plugins (`openclaw.plugin.json`)
- Codex-compatibele bundels (`.codex-plugin/plugin.json`)
- Claude-compatibele bundels (`.claude-plugin/plugin.json` of de standaard Claude-componentindeling)
- Cursor-compatibele bundels (`.cursor-plugin/plugin.json`)

<Note>
Compatibele bundels worden geïnstalleerd in de normale pluginroot en nemen deel aan dezelfde lijst-/info-/inschakel-/uitschakelstroom. Vandaag worden bundel-skills, Claude-command-skills, Claude-standaarden in `settings.json`, Claude-standaarden voor `.lsp.json` / in het manifest gedeclareerde `lspServers`, Cursor-command-skills en compatibele Codex-hookmappen ondersteund; andere gedetecteerde bundelmogelijkheden worden weergegeven in diagnostiek/info maar zijn nog niet aangesloten op runtime-uitvoering.
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
  Schakel over van de tabelweergave naar detailregels per plugin met bron-/herkomst-/versie-/activatiemetadata.
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare inventaris plus registerdiagnostiek.
</ParamField>

<Note>
`plugins list` leest eerst het blijvend opgeslagen lokale Plugin-register, met een alleen-uit-manifest afgeleide fallback wanneer het register ontbreekt of ongeldig is. Dit is nuttig om te controleren of een Plugin is geinstalleerd, ingeschakeld en zichtbaar is voor koude opstartplanning, maar het is geen live runtime-probe van een al draaiend Gateway-proces. Start na het wijzigen van Plugin-code, inschakeling, hookbeleid of `plugins.load.paths` de Gateway die het kanaal bedient opnieuw op voordat u verwacht dat nieuwe `register(api)`-code of hooks worden uitgevoerd. Controleer bij externe/containerdeployments dat u het daadwerkelijke onderliggende `openclaw gateway run`-proces opnieuw start, niet alleen een wrapperproces.
</Note>

Voor gebundeld Plugin-werk binnen een verpakte Docker-image koppelt u de Plugin-
bronmap via een bind-mount over het overeenkomende verpakte bronpad, zoals
`/app/extensions/synology-chat`. OpenClaw ontdekt die gekoppelde bron-
overlay voor `/app/dist/extensions/synology-chat`; een gewone gekopieerde bron-
map blijft inert, zodat normale verpakte installaties nog steeds de gecompileerde dist gebruiken.

Voor debugging van runtime-hooks:

- `openclaw plugins inspect <id> --json` toont geregistreerde hooks en diagnostiek uit een inspectiepass waarbij de module is geladen.
- `openclaw gateway status --deep --require-rpc` bevestigt de bereikbare Gateway, service-/proceshints, het configuratiepad en de RPC-status.
- Niet-gebundelde conversatiehooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) vereisen `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gebruik `--link` om te voorkomen dat een lokale map wordt gekopieerd (voegt toe aan `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wordt niet ondersteund met `--link`, omdat gekoppelde installaties het bronpad hergebruiken in plaats van over een beheerd installatiedoel heen te kopiëren.

Gebruik `--pin` bij npm-installaties om de opgeloste exacte spec (`name@version`) op te slaan in de beheerde Plugin-index terwijl het standaardgedrag ongepind blijft.
</Note>

### Plugin-index

Installatiemetadata van Plugins zijn door de machine beheerde status, geen gebruikersconfiguratie. Installaties en updates schrijven deze naar `plugins/installs.json` onder de actieve OpenClaw-statusmap. De bovenste `installRecords`-map is de duurzame bron van installatiemetadata, inclusief records voor defecte of ontbrekende Plugin-manifesten. De `plugins`-array is de uit het manifest afgeleide koude registercache. Het bestand bevat een waarschuwing om het niet te bewerken en wordt gebruikt door `openclaw plugins update`, verwijderen, diagnostiek en het koude Plugin-register.

Wanneer OpenClaw meegeleverde verouderde `plugins.installs`-records in de configuratie ziet, verplaatst het deze naar de Plugin-index en verwijdert het de configuratiesleutel; als een van beide schrijfacties mislukt, blijven de configuratierecords behouden zodat de installatiemetadata niet verloren gaan.

### Runtime-afhankelijkheden

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` inspecteert de verpakte runtime-afhankelijkhedenfase voor gebundelde Plugins die eigendom zijn van OpenClaw. Dit is niet het installatie-/updatepad voor externe npm- of ClawHub-Plugins.

Gebruik `--repair` wanneer een verpakte installatie ontbrekende gebundelde runtime-afhankelijkheden meldt tijdens het opstarten van de Gateway of `plugins doctor`. Reparatie installeert alleen ontbrekende ingeschakelde afhankelijkheden van gebundelde Plugins met uitgeschakelde lifecycle-scripts. Gebruik `--prune` om verouderde onbekende externe runtime-afhankelijkheidsroots te verwijderen die zijn achtergelaten door oudere verpakte indelingen.

### Verwijderen

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` verwijdert Plugin-records uit `plugins.entries`, de blijvend opgeslagen Plugin-index, Plugin-items in toestaan-/weigerenlijsten en gekoppelde `plugins.load.paths`-items wanneer van toepassing. Tenzij `--keep-files` is ingesteld, verwijdert verwijderen ook de bijgehouden beheerde installatiemap wanneer die zich binnen de Plugin-extensieroot van OpenClaw bevindt. Voor Active Memory-Plugins wordt het geheugenslot teruggezet naar `memory-core`.

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
    Wanneer u een Plugin-id doorgeeft, hergebruikt OpenClaw de vastgelegde installatiespec voor die Plugin. Dat betekent dat eerder opgeslagen dist-tags zoals `@beta` en exacte gepinde versies gebruikt blijven worden bij latere `update <id>`-runs.

    Voor npm-installaties kunt u ook een expliciete npm-pakketspec met een dist-tag of exacte versie doorgeven. OpenClaw lost die pakketnaam terug op naar het bijgehouden Plugin-record, werkt die geinstalleerde Plugin bij en legt de nieuwe npm-spec vast voor toekomstige id-gebaseerde updates.

    Het doorgeven van de npm-pakketnaam zonder versie of tag wordt ook terug opgelost naar het bijgehouden Plugin-record. Gebruik dit wanneer een Plugin aan een exacte versie was gepind en u deze terug wilt verplaatsen naar de standaard releaselijn van het register.

  </Accordion>
  <Accordion title="Versiecontroles en integriteitsafwijking">
    Voor een live npm-update controleert OpenClaw de geinstalleerde pakketversie tegen de metadata van het npm-register. Als de geinstalleerde versie en vastgelegde artifact-identiteit al overeenkomen met het opgeloste doel, wordt de update overgeslagen zonder downloaden, opnieuw installeren of herschrijven van `openclaw.json`.

    Wanneer een opgeslagen integriteitshash bestaat en de opgehaalde artifact-hash verandert, behandelt OpenClaw dat als npm-artifactafwijking. De interactieve opdracht `openclaw plugins update` drukt de verwachte en daadwerkelijke hashes af en vraagt om bevestiging voordat wordt doorgegaan. Niet-interactieve updatehelpers falen gesloten tenzij de aanroeper een expliciet voortzettingsbeleid opgeeft.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install bij update">
    `--dangerously-force-unsafe-install` is ook beschikbaar op `plugins update` als noodoverride voor fout-positieven in de ingebouwde gevaarlijke-code-scan tijdens Plugin-updates. Het omzeilt nog steeds geen Plugin-`before_install`-beleidsblokkades of blokkering bij scanfalen, en is alleen van toepassing op Plugin-updates, niet op hook-pack-updates.
  </Accordion>
</AccordionGroup>

### Inspecteren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Diepe introspectie voor een enkele Plugin. Toont identiteit, laadstatus, bron, geregistreerde capabilities, hooks, tools, opdrachten, services, gateway-methoden, HTTP-routes, beleidsvlaggen, diagnostiek, installatiemetadata, bundelcapabilities en eventuele gedetecteerde ondersteuning voor MCP- of LSP-servers.

Elke Plugin wordt geclassificeerd op basis van wat deze daadwerkelijk registreert tijdens runtime:

- **plain-capability** — een capability-type (bijv. een Plugin alleen voor providers)
- **hybrid-capability** — meerdere capability-typen (bijv. tekst + spraak + afbeeldingen)
- **hook-only** — alleen hooks, geen capabilities of oppervlakken
- **non-capability** — tools/opdrachten/services maar geen capabilities

Zie [Plugin-vormen](/nl/plugins/architecture#plugin-shapes) voor meer over het capabilitymodel.

<Note>
De vlag `--json` voert een machineleesbaar rapport uit dat geschikt is voor scripting en auditing. `inspect --all` geeft een tabel voor de hele vloot weer met vorm, capabilitysoorten, compatibiliteitsmeldingen, bundelcapabilities en samenvattingskolommen voor hooks. `info` is een alias voor `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` rapporteert laadfouten van Plugins, manifest-/ontdekkingsdiagnostiek en compatibiliteitsmeldingen. Wanneer alles schoon is, drukt het `No plugin issues detected.` af.

Voor modulevormfouten zoals ontbrekende `register`-/`activate`-exports voert u opnieuw uit met `OPENCLAW_PLUGIN_LOAD_DEBUG=1` om een compacte samenvatting van de exportvorm in de diagnostische uitvoer op te nemen.

### Register

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Het lokale Plugin-register is het blijvend opgeslagen koude leesmodel van OpenClaw voor geinstalleerde Plugin-identiteit, inschakeling, bronmetadata en eigenaarschap van bijdragen. Normale opstart, lookup van provider-eigenaar, classificatie van kanaalinstellingen en Plugin-inventaris kunnen dit lezen zonder runtime-modules van Plugins te importeren.

Gebruik `plugins registry` om te inspecteren of het blijvend opgeslagen register aanwezig, actueel of verouderd is. Gebruik `--refresh` om het opnieuw op te bouwen vanuit de blijvend opgeslagen Plugin-index, configuratiebeleid en manifest-/pakketmetadata. Dit is een reparatiepad, geen runtime-activeringspad.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` is een verouderde noodcompatibiliteitsschakelaar voor leesfouten van het register. Geef de voorkeur aan `plugins registry --refresh` of `openclaw doctor --fix`; de env-fallback is alleen bedoeld voor noodherstel bij opstarten terwijl de migratie wordt uitgerold.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace-lijst accepteert een lokaal marketplace-pad, een `marketplace.json`-pad, een GitHub-afkorting zoals `owner/repo`, een GitHub-repo-URL of een git-URL. `--json` drukt het opgeloste bronlabel af plus het geparste marketplace-manifest en de Plugin-items.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [CLI-referentie](/nl/cli)
- [Community-Plugins](/nl/plugins/community)
