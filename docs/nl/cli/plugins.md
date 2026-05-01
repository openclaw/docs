---
read_when:
    - Je wilt Gateway-plugins of compatibele bundels installeren of beheren
    - Je wilt laadfouten van Plugins opsporen
sidebarTitle: Plugins
summary: CLI-referentie voor `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-01T11:16:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a7aebe4ee647d7821b881cdb9d5af01d70508c38b36462ff7b57fb44769dc2f
    source_path: cli/plugins.md
    workflow: 16
---

Beheer Gateway plugins, hook packs en compatibele bundels.

<CardGroup cols={2}>
  <Card title="Plugin-systeem" href="/nl/tools/plugin">
    Eindgebruikersgids voor het installeren, inschakelen en oplossen van problemen met plugins.
  </Card>
  <Card title="Plugin-bundels" href="/nl/plugins/bundles">
    Compatibiliteitsmodel voor bundels.
  </Card>
  <Card title="Plugin-manifest" href="/nl/plugins/manifest">
    Manifestvelden en configuratieschema.
  </Card>
  <Card title="Beveiliging" href="/nl/gateway/security">
    Beveiligingsversteviging voor plugininstallaties.
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
openclaw plugins inspect <id> --runtime
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

Native OpenClaw plugins moeten `openclaw.plugin.json` leveren met een inline JSON Schema (`configSchema`, zelfs als dit leeg is). Compatibele bundels gebruiken in plaats daarvan hun eigen bundelmanifesten.

`plugins list` toont `Format: openclaw` of `Format: bundle`. Uitgebreide lijst-/info-uitvoer toont ook het bundelsubtype (`codex`, `claude` of `cursor`) plus gedetecteerde bundelmogelijkheden.
</Note>

### Installeren

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Kale pakketnamen worden eerst gecontroleerd bij ClawHub en daarna bij npm. Behandel plugininstallaties alsof u code uitvoert. Geef de voorkeur aan vastgezette versies.
</Warning>

<Note>
ClawHub is het primaire distributie- en ontdekkingsoppervlak voor de meeste plugins. Npm
blijft een ondersteunde fallback en een pad voor directe installatie. Tijdens de migratie naar
ClawHub levert OpenClaw nog steeds enkele door OpenClaw beheerde `@openclaw/*` pluginpakketten
op npm; die pakketversies kunnen achterlopen op de gebundelde bron tussen pluginrelease-
reeksen. Als npm een door OpenClaw beheerd pluginpakket als verouderd meldt, is die
gepubliceerde versie een oud extern artefact; gebruik de plugin die is gebundeld met
de huidige OpenClaw of een lokale checkout totdat er een nieuwer npm-pakket is gepubliceerd.
</Note>

<AccordionGroup>
  <Accordion title="Configuratie-includes en herstel van ongeldige configuratie">
    Als uw `plugins`-sectie wordt ondersteund door een enkel bestand via `$include`, schrijven `plugins install/update/enable/disable/uninstall` door naar dat included bestand en laten ze `openclaw.json` ongemoeid. Root-includes, include-arrays en includes met naastliggende overschrijvingen falen gesloten in plaats van te flattenen. Zie [Configuratie-includes](/nl/gateway/configuration) voor de ondersteunde vormen.

    Als de configuratie tijdens installatie ongeldig is, faalt `plugins install` normaal gesproken gesloten en vertelt het u eerst `openclaw doctor --fix` uit te voeren. Tijdens het opstarten van de Gateway wordt ongeldige configuratie voor één plugin geïsoleerd tot die plugin, zodat andere kanalen en plugins kunnen blijven draaien; `openclaw doctor --fix` kan de ongeldige pluginvermelding in quarantaine plaatsen. De enige gedocumenteerde uitzondering tijdens installatie is een smal herstelpad voor gebundelde plugins voor plugins die expliciet opt-in doen voor `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force en opnieuw installeren versus bijwerken">
    `--force` hergebruikt het bestaande installatiedoel en overschrijft een al geïnstalleerde plugin of hook pack ter plekke. Gebruik dit wanneer u bewust dezelfde id opnieuw installeert vanaf een nieuw lokaal pad, archief, ClawHub-pakket of npm-artefact. Voor routinematige upgrades van een al gevolgde npm-plugin geeft u de voorkeur aan `openclaw plugins update <id-or-npm-spec>`.

    Als u `plugins install` uitvoert voor een plugin-id die al is geïnstalleerd, stopt OpenClaw en verwijst het u naar `plugins update <id-or-npm-spec>` voor een normale upgrade, of naar `plugins install <package> --force` wanneer u de huidige installatie echt vanuit een andere bron wilt overschrijven.

  </Accordion>
  <Accordion title="Bereik van --pin">
    `--pin` is alleen van toepassing op npm-installaties. Het wordt niet ondersteund met `git:`-installaties; gebruik een expliciete git-ref zoals `git:github.com/acme/plugin@v1.2.3` wanneer u een vastgezette bron wilt. Het wordt niet ondersteund met `--marketplace`, omdat marketplace-installaties marketplace-bronmetadata bewaren in plaats van een npm-spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` is een noodoptie voor fout-positieven in de ingebouwde scanner voor gevaarlijke code. Hiermee kan de installatie doorgaan, zelfs wanneer de ingebouwde scanner `critical`-bevindingen rapporteert, maar het omzeilt **geen** beleidsblokkades van plugin-`before_install`-hooks en omzeilt **geen** scanfouten.

    Deze CLI-vlag is van toepassing op plugininstallatie- en updateflows. Door Gateway ondersteunde installaties van Skill-afhankelijkheden gebruiken de overeenkomende `dangerouslyForceUnsafeInstall`-requestoverride, terwijl `openclaw skills install` een afzonderlijke ClawHub Skill-download-/installatieflow blijft.

    Als een plugin die u op ClawHub hebt gepubliceerd wordt geblokkeerd door een registryscan, gebruikt u de uitgeverstappen in [ClawHub](/nl/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs en npm-specs">
    `plugins install` is ook het installatieoppervlak voor hook packs die `openclaw.hooks` in `package.json` blootstellen. Gebruik `openclaw hooks` voor gefilterde zichtbaarheid van hooks en inschakeling per hook, niet voor pakketinstallatie.

    Npm-specs zijn **alleen registry** (pakketnaam + optionele **exacte versie** of **dist-tag**). Git-/URL-/bestandsspecs en semver-bereiken worden geweigerd. Afhankelijkheidsinstallaties worden projectlokaal uitgevoerd met `--ignore-scripts` voor veiligheid, zelfs wanneer uw shell globale npm-installatie-instellingen heeft.

    Gebruik `npm:<package>` wanneer u ClawHub-lookup wilt overslaan en direct vanaf npm wilt installeren. Kale pakketspecs geven nog steeds de voorkeur aan ClawHub en vallen alleen terug op npm wanneer ClawHub dat pakket of die versie niet heeft.

    Kale specs en `@latest` blijven op het stabiele spoor. Als npm een van beide naar een prerelease herleidt, stopt OpenClaw en vraagt het u expliciet in te stemmen met een prerelease-tag zoals `@beta`/`@rc` of een exacte prereleaseversie zoals `@1.2.3-beta.4`.

    Als een kale installatiespec overeenkomt met een gebundelde plugin-id (bijvoorbeeld `diffs`), installeert OpenClaw de gebundelde plugin direct. Gebruik een expliciete scoped spec (bijvoorbeeld `@scope/diffs`) om een npm-pakket met dezelfde naam te installeren.

  </Accordion>
  <Accordion title="Git-repository's">
    Gebruik `git:<repo>` om direct vanuit een git-repository te installeren. Ondersteunde vormen zijn onder andere `git:github.com/owner/repo`, `git:owner/repo`, volledige `https://`-, `ssh://`-, `git://`-, `file://`- en `git@host:owner/repo.git`-clone-URL's. Voeg `@<ref>` of `#<ref>` toe om vóór installatie een branch, tag of commit uit te checken.

    Git-installaties clonen naar een tijdelijke directory, checken de gevraagde ref uit wanneer aanwezig, en gebruiken daarna de normale installer voor pluginmappen. Dat betekent dat manifestvalidatie, scanning op gevaarlijke code, staging van runtime-afhankelijkheden en installatierecords zich gedragen als lokale-padinstallaties. Vastgelegde git-installaties bevatten de bron-URL/ref plus de opgeloste commit, zodat `openclaw plugins update` de bron later opnieuw kan herleiden.

    Gebruik na installatie vanuit git `openclaw plugins inspect <id> --runtime --json` om runtime-registraties zoals gatewaymethoden en CLI-opdrachten te verifiëren. Als de plugin een CLI-root met `api.registerCli` heeft geregistreerd, voert u die opdracht direct uit via de OpenClaw-root-CLI, bijvoorbeeld `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archieven">
    Ondersteunde archieven: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw pluginarchieven moeten een geldig `openclaw.plugin.json` bevatten in de uitgepakte pluginroot; archieven die alleen `package.json` bevatten, worden geweigerd voordat OpenClaw installatierecords schrijft.

    Claude marketplace-installaties worden ook ondersteund.

  </Accordion>
</AccordionGroup>

ClawHub-installaties gebruiken een expliciete `clawhub:<package>`-locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw geeft nu ook de voorkeur aan ClawHub voor kale npm-veilige pluginspecs. Het valt alleen terug op npm als ClawHub dat pakket of die versie niet heeft:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gebruik `npm:` om alleen-npm-resolutie af te dwingen, bijvoorbeeld wanneer ClawHub onbereikbaar is of u weet dat het pakket alleen op npm bestaat:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw downloadt het pakketarchief van ClawHub, controleert de geadverteerde plugin-API / minimale gatewaycompatibiliteit en installeert het vervolgens via het normale archiefpad. Vastgelegde installaties bewaren hun ClawHub-bronmetadata voor latere updates.
Niet-geversioneerde ClawHub-installaties bewaren een niet-geversioneerde vastgelegde spec, zodat `openclaw plugins update` nieuwere ClawHub-releases kan volgen; expliciete versie- of tagselectors zoals `clawhub:pkg@1.2.3` en `clawhub:pkg@beta` blijven vastgezet op die selector.

#### Marketplace-shorthand

Gebruik de shorthand `plugin@marketplace` wanneer de marketplacenaam bestaat in Claude's lokale registrycache op `~/.claude/plugins/known_marketplaces.json`:

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
    - een bekende-marketplacenaam van Claude uit `~/.claude/plugins/known_marketplaces.json`
    - een lokale marketplace-root of `marketplace.json`-pad
    - een GitHub-repositoryshorthand zoals `owner/repo`
    - een GitHub-repository-URL zoals `https://github.com/owner/repo`
    - een git-URL

  </Tab>
  <Tab title="Regels voor externe marketplaces">
    Voor externe marketplaces die vanuit GitHub of git worden geladen, moeten pluginvermeldingen binnen de geclonede marketplace-repository blijven. OpenClaw accepteert relatieve padbronnen uit die repository en weigert HTTP(S)-, absolute-pad-, git-, GitHub- en andere niet-pad-pluginbronnen uit externe manifesten.
  </Tab>
</Tabs>

Voor lokale paden en archieven detecteert OpenClaw automatisch:

- native OpenClaw-plugins (`openclaw.plugin.json`)
- Codex-compatibele bundels (`.codex-plugin/plugin.json`)
- Claude-compatibele bundels (`.claude-plugin/plugin.json` of de standaard Claude-componentindeling)
- Cursor-compatibele bundels (`.cursor-plugin/plugin.json`)

<Note>
Compatibele bundels worden in de normale plugin-root geïnstalleerd en doen mee aan dezelfde stroom voor lijst/info/inschakelen/uitschakelen. Op dit moment worden bundle-Skills, Claude-opdracht-Skills, standaardwaarden voor Claude `settings.json`, standaardwaarden voor Claude `.lsp.json` / in het manifest gedeclareerde `lspServers`, Cursor-opdracht-Skills en compatibele Codex-hookmappen ondersteund; andere gedetecteerde bundelmogelijkheden worden weergegeven in diagnostiek/info, maar zijn nog niet gekoppeld aan runtime-uitvoering.
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
  Schakel over van de tabelweergave naar detailregels per plugin met metadata over bron/oorsprong/versie/activatie.
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare inventaris plus registerdiagnostiek.
</ParamField>

<Note>
`plugins list` leest eerst het bewaarde lokale pluginregister, met een alleen-uit-manifesten afgeleide fallback wanneer het register ontbreekt of ongeldig is. Dit is nuttig om te controleren of een plugin is geïnstalleerd, ingeschakeld en zichtbaar is voor planning van een koude start, maar het is geen live runtime-probe van een al draaiend Gateway-proces. Herstart na het wijzigen van plugincode, inschakeling, hookbeleid of `plugins.load.paths` de Gateway die het kanaal bedient voordat je verwacht dat nieuwe `register(api)`-code of hooks worden uitgevoerd. Controleer bij externe/containerimplementaties dat je het daadwerkelijke onderliggende `openclaw gateway run`-proces herstart, niet alleen een wrapperproces.
</Note>

Voor werk aan gebundelde plugins binnen een verpakte Docker-image mount je de
bronmap van de plugin over het overeenkomende verpakte bronpad, zoals
`/app/extensions/synology-chat`. OpenClaw ontdekt die gemounte bronoverlay
vóór `/app/dist/extensions/synology-chat`; een gewone gekopieerde bronmap
blijft inert, zodat normale verpakte installaties nog steeds de gecompileerde dist gebruiken.

Voor het debuggen van runtime-hooks:

- `openclaw plugins inspect <id> --runtime --json` toont geregistreerde hooks en diagnostiek uit een inspectiepass waarbij de module is geladen. Runtime-inspectie downloadt nooit ontbrekende gebundelde runtime-afhankelijkheden; gebruik `openclaw plugins deps --repair` wanneer reparatie nodig is.
- `openclaw gateway status --deep --require-rpc` bevestigt de bereikbare Gateway, service-/proceshints, het configuratiepad en de RPC-gezondheid.
- Niet-gebundelde gesprekshooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) vereisen `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gebruik `--link` om te voorkomen dat een lokale map wordt gekopieerd (voegt toe aan `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wordt niet ondersteund met `--link`, omdat gekoppelde installaties het bronpad hergebruiken in plaats van over een beheerd installatiedoel heen te kopiëren.

Gebruik `--pin` bij npm-installaties om de opgeloste exacte spec (`name@version`) op te slaan in de beheerde pluginindex, terwijl het standaardgedrag ongepind blijft.
</Note>

### Pluginindex

Metadata voor plugininstallaties is machinaal beheerde status, geen gebruikersconfiguratie. Installaties en updates schrijven dit naar `plugins/installs.json` onder de actieve OpenClaw-statusmap. De top-level `installRecords`-map is de duurzame bron van installatiemetadata, inclusief records voor kapotte of ontbrekende pluginmanifesten. De array `plugins` is de uit manifesten afgeleide koude registercache. Het bestand bevat een waarschuwing om het niet te bewerken en wordt gebruikt door `openclaw plugins update`, de-installatie, diagnostiek en het koude pluginregister.

Wanneer OpenClaw meegeleverde verouderde `plugins.installs`-records in configuratie ziet, verplaatst het die naar de pluginindex en verwijdert het de configuratiesleutel; als een van beide schrijfacties mislukt, worden de configuratierecords behouden zodat de installatiemetadata niet verloren gaat.

### Runtime-afhankelijkheden

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` inspecteert de verpakte runtime-afhankelijkhedenfase voor door OpenClaw beheerde gebundelde plugins die zijn geselecteerd door pluginconfiguratie, ingeschakelde/geconfigureerde kanalen, geconfigureerde modelproviders of standaardwaarden van gebundelde manifesten. Dit is niet het installatie-/updatepad voor externe npm- of ClawHub-plugins.

Gebruik `--repair` wanneer een verpakte installatie ontbrekende gebundelde runtime-afhankelijkheden meldt tijdens het starten van de Gateway of `plugins doctor`. Reparatie installeert alleen ontbrekende afhankelijkheden van ingeschakelde gebundelde plugins, met lifecycle-scripts uitgeschakeld. Gebruik `--prune` om verouderde onbekende externe roots voor runtime-afhankelijkheden te verwijderen die zijn achtergelaten door oudere verpakte indelingen.

Zie [Resolutie van plugin-afhankelijkheden](/nl/plugins/dependency-resolution) voor het volledige plan en de staging- en reparatielevenscyclus.

### De-installeren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` verwijdert pluginrecords uit `plugins.entries`, de bewaarde pluginindex, pluginvermeldingen in allow-/deny-lijsten en gekoppelde `plugins.load.paths`-vermeldingen wanneer van toepassing. Tenzij `--keep-files` is ingesteld, verwijdert de de-installatie ook de gevolgde beheerde installatiemap wanneer die zich binnen OpenClaw's root voor pluginextensies bevindt. Voor Active Memory-plugins wordt het geheugenslot teruggezet naar `memory-core`.

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

Updates zijn van toepassing op gevolgde plugininstallaties in de beheerde pluginindex en gevolgde hook-packinstallaties in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Plugin-id versus npm-spec oplossen">
    Wanneer je een plugin-id doorgeeft, hergebruikt OpenClaw de vastgelegde installatiespec voor die plugin. Dat betekent dat eerder opgeslagen dist-tags zoals `@beta` en exact gepinde versies bij latere `update <id>`-runs gebruikt blijven worden.

    Voor npm-installaties kun je ook een expliciete npm-pakketspec met een dist-tag of exacte versie doorgeven. OpenClaw herleidt die pakketnaam naar het gevolgde pluginrecord, werkt die geïnstalleerde plugin bij en registreert de nieuwe npm-spec voor toekomstige updates op basis van id.

    Het doorgeven van de npm-pakketnaam zonder versie of tag wordt ook herleid naar het gevolgde pluginrecord. Gebruik dit wanneer een plugin op een exacte versie was gepind en je deze terug wilt zetten naar de standaard releaselijn van het register.

  </Accordion>
  <Accordion title="Versiecontroles en integriteitsdrift">
    Vóór een live npm-update controleert OpenClaw de geïnstalleerde pakketversie aan de hand van de metadata van het npm-register. Als de geïnstalleerde versie en vastgelegde artifact-identiteit al overeenkomen met het opgeloste doel, wordt de update overgeslagen zonder te downloaden, opnieuw te installeren of `openclaw.json` te herschrijven.

    Wanneer er een opgeslagen integriteitshash bestaat en de opgehaalde artifact-hash verandert, behandelt OpenClaw dat als npm-artifactdrift. De interactieve opdracht `openclaw plugins update` drukt de verwachte en daadwerkelijke hashes af en vraagt om bevestiging voordat wordt doorgegaan. Niet-interactieve updatehelpers falen gesloten, tenzij de aanroeper een expliciet vervolgbeleid opgeeft.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install bij update">
    `--dangerously-force-unsafe-install` is ook beschikbaar bij `plugins update` als break-glass-override voor fout-positieven in de ingebouwde scan op gevaarlijke code tijdens pluginupdates. Dit omzeilt nog steeds geen pluginbeleidsblokkades van `before_install` of blokkering bij scanfouten, en is alleen van toepassing op pluginupdates, niet op hook-packupdates.
  </Accordion>
</AccordionGroup>

### Inspecteren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspecteren toont identiteit, laadstatus, bron, manifestmogelijkheden, beleidsvlaggen, diagnostiek, installatiemetadata, bundelmogelijkheden en eventuele gedetecteerde ondersteuning voor MCP- of LSP-servers, zonder standaard de pluginruntime te importeren. Voeg `--runtime` toe om de pluginmodule te laden en geregistreerde hooks, tools, opdrachten, services, gateway-methoden en HTTP-routes op te nemen. Runtime-inspectie mislukt met een reparatiehint wanneer gebundelde runtime-afhankelijkheden ontbreken; gebruik `openclaw plugins deps --repair` om ze expliciet te repareren.

CLI-opdrachten die eigendom zijn van plugins worden geïnstalleerd als root-`openclaw`-opdrachtgroepen. Nadat `inspect --runtime` een opdracht onder `cliCommands` toont, voer je die uit als `openclaw <command> ...`; een plugin die bijvoorbeeld `demo-git` registreert, kan worden geverifieerd met `openclaw demo-git ping`.

Elke plugin wordt geclassificeerd op basis van wat deze daadwerkelijk registreert tijdens runtime:

- **plain-capability** — één mogelijkheidstype (bijv. een provider-only plugin)
- **hybrid-capability** — meerdere mogelijkheidstypen (bijv. tekst + spraak + afbeeldingen)
- **hook-only** — alleen hooks, geen mogelijkheden of oppervlakken
- **non-capability** — tools/opdrachten/services maar geen mogelijkheden

Zie [Pluginvormen](/nl/plugins/architecture#plugin-shapes) voor meer over het mogelijkhedenmodel.

<Note>
De vlag `--json` voert een machineleesbaar rapport uit dat geschikt is voor scripting en audits. `inspect --all` rendert een tabel voor de hele vloot met kolommen voor vorm, mogelijkheidstypen, compatibiliteitsmeldingen, bundelmogelijkheden en hookoverzicht. `info` is een alias voor `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` rapporteert pluginlaadfouten, diagnostiek voor manifesten/discovery en compatibiliteitsmeldingen. Wanneer alles schoon is, drukt het `No plugin issues detected.` af.

Voor modulevormfouten zoals ontbrekende `register`/`activate`-exports voer je opnieuw uit met `OPENCLAW_PLUGIN_LOAD_DEBUG=1` om een compacte samenvatting van de exportvorm op te nemen in de diagnostische uitvoer.

### Register

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Het lokale pluginregister is OpenClaw's bewaarde koude leesmodel voor geïnstalleerde pluginidentiteit, inschakeling, bronmetadata en eigenaarschap van bijdragen. Normaal starten, provider-eigenaaropzoeking, classificatie van kanaalconfiguratie en plugininventaris kunnen het lezen zonder pluginruntime-modules te importeren.

Gebruik `plugins registry` om te inspecteren of het bewaarde register aanwezig, actueel of verouderd is. Gebruik `--refresh` om het opnieuw op te bouwen vanuit de bewaarde pluginindex, het configuratiebeleid en manifest-/pakketmetadata. Dit is een reparatiepad, geen runtime-activatiepad.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` is een verouderde break-glass-compatibiliteitsschakelaar voor leesfouten in het register. Geef de voorkeur aan `plugins registry --refresh` of `openclaw doctor --fix`; de env-fallback is alleen bedoeld voor herstel bij noodgevallen tijdens het starten terwijl de migratie wordt uitgerold.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace-lijst accepteert een lokaal marketplace-pad, een `marketplace.json`-pad, een GitHub-verkorting zoals `owner/repo`, een GitHub-repo-URL of een git-URL. `--json` drukt het opgeloste bronlabel af plus het geparseerde marketplace-manifest en de pluginvermeldingen.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [CLI-referentie](/nl/cli)
- [Communityplugins](/nl/plugins/community)
