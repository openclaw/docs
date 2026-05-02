---
read_when:
    - Je wilt Gateway-plugins of compatibele bundels installeren of beheren
    - Je wilt fouten bij het laden van plugins debuggen
sidebarTitle: Plugins
summary: CLI-referentie voor `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-02T11:12:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 963a4292f86d651a23f06ee83fd82d7ad80cb99ff3397a665940d8247225252c
    source_path: cli/plugins.md
    workflow: 16
---

Beheer Gateway-plugins, hookpakketten en compatibele bundels.

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
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
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
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Voer de opdracht bij onderzoek naar trage installatie, inspectie, verwijdering of registerverversing uit met `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. De trace schrijft fasetimings naar stderr en houdt JSON-uitvoer parseerbaar. Zie [Debugging](/nl/help/debugging#plugin-lifecycle-trace).

<Note>
Gebundelde plugins worden met OpenClaw meegeleverd. Sommige zijn standaard ingeschakeld (bijvoorbeeld gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browserplugin); andere vereisen `plugins enable`.

Native OpenClaw-plugins moeten `openclaw.plugin.json` meeleveren met een inline JSON Schema (`configSchema`, zelfs als dit leeg is). Compatibele bundels gebruiken in plaats daarvan hun eigen bundelmanifesten.

`plugins list` toont `Format: openclaw` of `Format: bundle`. Uitgebreide list/info-uitvoer toont ook het bundelsubtype (`codex`, `claude` of `cursor`) plus gedetecteerde bundelmogelijkheden.
</Note>

### Installeren

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
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
Kale pakketnamen worden eerst gecontroleerd in ClawHub en daarna in npm. Behandel plugininstallaties alsof je code uitvoert. Geef de voorkeur aan vastgezette versies.
</Warning>

`plugins search` vraagt ClawHub om installeerbare pluginpakketten en drukt pakketnamen af die direct kunnen worden geïnstalleerd. Het zoekt code-plugin- en bundel-plugin-pakketten, geen Skills. Gebruik `openclaw skills search` voor ClawHub Skills.

<Note>
ClawHub is het primaire distributie- en ontdekkingsoppervlak voor de meeste plugins. Npm blijft een ondersteunde fallback en route voor directe installatie. Tijdens de migratie naar ClawHub levert OpenClaw nog steeds sommige OpenClaw-eigen `@openclaw/*`-pluginpakketten op npm; die pakketversies kunnen achterlopen op de gebundelde bron tussen pluginreleasetreinen. Als npm een OpenClaw-eigen pluginpakket als verouderd meldt, is die gepubliceerde versie een oud extern artefact; gebruik de plugin die met de huidige OpenClaw is gebundeld of een lokale checkout totdat een nieuwer npm-pakket wordt gepubliceerd.
</Note>

<AccordionGroup>
  <Accordion title="Configuratie-includes en herstel van ongeldige configuratie">
    Als je `plugins`-sectie wordt ondersteund door een single-file `$include`, schrijven `plugins install/update/enable/disable/uninstall` door naar dat included bestand en laten ze `openclaw.json` ongemoeid. Root-includes, include-arrays en includes met sibling-overrides falen gesloten in plaats van te flattenen. Zie [Configuratie-includes](/nl/gateway/configuration) voor de ondersteunde vormen.

    Als de configuratie tijdens installatie ongeldig is, faalt `plugins install` normaal gesproken gesloten en krijg je de instructie om eerst `openclaw doctor --fix` uit te voeren. Tijdens het opstarten van de Gateway wordt ongeldige configuratie voor één plugin geïsoleerd tot die plugin, zodat andere kanalen en plugins kunnen blijven draaien; `openclaw doctor --fix` kan de ongeldige pluginvermelding in quarantaine plaatsen. De enige gedocumenteerde uitzondering tijdens installatie is een smal herstelpad voor gebundelde plugins voor plugins die expliciet kiezen voor `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force en opnieuw installeren versus bijwerken">
    `--force` hergebruikt het bestaande installatiedoel en overschrijft een reeds geïnstalleerde plugin of hookpakket op zijn plek. Gebruik dit wanneer je bewust dezelfde id opnieuw installeert vanuit een nieuw lokaal pad, archief, ClawHub-pakket of npm-artefact. Voor routinematige upgrades van een al gevolgde npm-plugin geef je de voorkeur aan `openclaw plugins update <id-or-npm-spec>`.

    Als je `plugins install` uitvoert voor een plugin-id die al is geïnstalleerd, stopt OpenClaw en verwijst het je naar `plugins update <id-or-npm-spec>` voor een normale upgrade, of naar `plugins install <package> --force` wanneer je de huidige installatie echt vanuit een andere bron wilt overschrijven.

  </Accordion>
  <Accordion title="Bereik van --pin">
    `--pin` geldt alleen voor npm-installaties. Het wordt niet ondersteund met `git:`-installaties; gebruik een expliciete git-ref zoals `git:github.com/acme/plugin@v1.2.3` wanneer je een vastgezette bron wilt. Het wordt niet ondersteund met `--marketplace`, omdat marketplace-installaties bronmetadata van de marketplace bewaren in plaats van een npm-spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` is een noodoptie voor fout-positieven in de ingebouwde scanner voor gevaarlijke code. Hiermee kan de installatie doorgaan, zelfs wanneer de ingebouwde scanner `critical`-bevindingen meldt, maar dit omzeilt **niet** de beleidsblokkades van plugin-`before_install`-hooks en omzeilt **niet** scanfouten.

    Deze CLI-vlag geldt voor plugininstallatie- en updateflows. Gateway-ondersteunde installaties van skill-afhankelijkheden gebruiken de overeenkomende `dangerouslyForceUnsafeInstall`-requestoverride, terwijl `openclaw skills install` een afzonderlijke ClawHub-skill-download/install-flow blijft.

    Als een plugin die je op ClawHub hebt gepubliceerd wordt geblokkeerd door een registerscan, gebruik dan de uitgeversstappen in [ClawHub](/nl/tools/clawhub).

  </Accordion>
  <Accordion title="Hookpakketten en npm-specs">
    `plugins install` is ook het installatieoppervlak voor hookpakketten die `openclaw.hooks` in `package.json` blootstellen. Gebruik `openclaw hooks` voor gefilterde hookzichtbaarheid en inschakeling per hook, niet voor pakketinstallatie.

    Npm-specs zijn **alleen-register** (pakketnaam + optionele **exacte versie** of **dist-tag**). Git/URL/bestand-specs en semver-bereiken worden geweigerd. Afhankelijkheidsinstallaties draaien projectlokaal met `--ignore-scripts` voor veiligheid, zelfs wanneer je shell globale npm-installatie-instellingen heeft.

    Gebruik `npm:<package>` wanneer je ClawHub-opzoeking wilt overslaan en rechtstreeks vanaf npm wilt installeren. Kale pakketspecs geven nog steeds de voorkeur aan ClawHub en vallen alleen terug op npm wanneer ClawHub dat pakket of die versie niet heeft.

    Kale specs en `@latest` blijven op het stabiele spoor. Als npm een van beide naar een prerelease resolveert, stopt OpenClaw en vraagt het je om expliciet te kiezen met een prerelease-tag zoals `@beta`/`@rc` of een exacte prereleaseversie zoals `@1.2.3-beta.4`.

    Als een kale installatiespec overeenkomt met een officiële plugin-id (bijvoorbeeld `diffs`), installeert OpenClaw de catalogusvermelding rechtstreeks. Gebruik een expliciete scoped spec (bijvoorbeeld `@scope/diffs`) om een npm-pakket met dezelfde naam te installeren.

  </Accordion>
  <Accordion title="Git-repository's">
    Gebruik `git:<repo>` om rechtstreeks vanuit een git-repository te installeren. Ondersteunde vormen zijn onder meer `git:github.com/owner/repo`, `git:owner/repo`, volledige clone-URL's met `https://`, `ssh://`, `git://`, `file://` en `git@host:owner/repo.git`. Voeg `@<ref>` of `#<ref>` toe om vóór installatie een branch, tag of commit uit te checken.

    Git-installaties klonen naar een tijdelijke map, checken de gevraagde ref uit wanneer die aanwezig is, en gebruiken daarna het normale installatieprogramma voor pluginmappen. Dat betekent dat manifestvalidatie, scannen op gevaarlijke code, installatiewerk van de pakketbeheerder en installatierecords zich gedragen zoals bij npm-installaties. Vastgelegde git-installaties bevatten de bron-URL/ref plus de resolved commit, zodat `openclaw plugins update` de bron later opnieuw kan resolven.

    Gebruik na installatie vanuit git `openclaw plugins inspect <id> --runtime --json` om runtimeregistraties zoals gatewaymethoden en CLI-opdrachten te verifiëren. Als de plugin een CLI-root heeft geregistreerd met `api.registerCli`, voer die opdracht dan rechtstreeks uit via de root-CLI van OpenClaw, bijvoorbeeld `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archieven">
    Ondersteunde archieven: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-pluginarchieven moeten een geldige `openclaw.plugin.json` bevatten in de uitgepakte pluginroot; archieven die alleen `package.json` bevatten, worden geweigerd voordat OpenClaw installatierecords schrijft.

    Claude-marketplace-installaties worden ook ondersteund.

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

Gebruik `npm:` om resolutie via alleen npm af te dwingen, bijvoorbeeld wanneer ClawHub onbereikbaar is of je weet dat het pakket alleen op npm bestaat:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controleert vóór installatie de geadverteerde plugin-API / minimale gatewaycompatibiliteit. Wanneer de geselecteerde ClawHub-versie een ClawPack-artefact publiceert, downloadt OpenClaw de geversioneerde ClawPack, verifieert het de ClawHub-digestheader en de artefactdigest, en installeert het deze daarna via het normale archiefpad. Oudere ClawHub-versies zonder ClawPack-metadata installeren nog steeds via het legacy verificatiepad voor pakketarchieven. Vastgelegde installaties bewaren hun ClawHub-bronmetadata en ClawPack-digestfeiten voor latere updates.
Ongeversioneerde ClawHub-installaties bewaren een ongeversioneerde vastgelegde spec, zodat `openclaw plugins update` nieuwere ClawHub-releases kan volgen; expliciete versie- of tagselectors zoals `clawhub:pkg@1.2.3` en `clawhub:pkg@beta` blijven vastgezet op die selector.

#### Marketplace-shorthand

Gebruik de shorthand `plugin@marketplace` wanneer de marketplacenaam bestaat in Claude's lokale registercache op `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Gebruik `--marketplace` wanneer je de marketplacebron expliciet wilt doorgeven:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - een Claude bekende-marketplace-naam uit `~/.claude/plugins/known_marketplaces.json`
    - een lokale marketplace-root of `marketplace.json`-pad
    - een GitHub-repoverkorting zoals `owner/repo`
    - een GitHub-repo-URL zoals `https://github.com/owner/repo`
    - een git-URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Voor externe marketplaces die vanuit GitHub of git worden geladen, moeten pluginvermeldingen binnen de gekloonde marketplace-repo blijven. OpenClaw accepteert relatieve padbronnen uit die repo en wijst HTTP(S), absolute paden, git, GitHub en andere niet-pad-pluginbronnen uit externe manifesten af.
  </Tab>
</Tabs>

Voor lokale paden en archieven detecteert OpenClaw automatisch:

- native OpenClaw-plugins (`openclaw.plugin.json`)
- Codex-compatibele bundels (`.codex-plugin/plugin.json`)
- Claude-compatibele bundels (`.claude-plugin/plugin.json` of de standaard Claude-componentindeling)
- Cursor-compatibele bundels (`.cursor-plugin/plugin.json`)

<Note>
Compatibele bundels worden in de normale pluginroot geïnstalleerd en nemen deel aan dezelfde list/info/enable/disable-flow. Momenteel worden bundel-Skills, Claude-command-Skills, standaardwaarden voor Claude `settings.json`, standaardwaarden voor Claude `.lsp.json` / in het manifest gedeclareerde `lspServers`, Cursor-command-Skills en compatibele Codex-hookmappen ondersteund; andere gedetecteerde bundelmogelijkheden worden weergegeven in diagnostiek/info maar zijn nog niet gekoppeld aan runtime-uitvoering.
</Note>

### Lijst

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  Toon alleen ingeschakelde plugins.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Schakel over van de tabelweergave naar detailregels per plugin met bron/oorsprong/versie/activatiemetadata.
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare inventaris plus registerdiagnostiek.
</ParamField>

<Note>
`plugins list` leest eerst het blijvend opgeslagen lokale pluginregister, met een alleen-uit-manifest-afgeleide fallback wanneer het register ontbreekt of ongeldig is. Het is nuttig om te controleren of een plugin is geïnstalleerd, ingeschakeld en zichtbaar is voor planning bij koude startup, maar het is geen live runtime-probe van een al draaiend Gateway-proces. Start na het wijzigen van plugincode, inschakeling, hookbeleid of `plugins.load.paths` de Gateway opnieuw die het kanaal bedient voordat je verwacht dat nieuwe `register(api)`-code of hooks worden uitgevoerd. Controleer bij externe/containerdeployments of je het daadwerkelijke `openclaw gateway run`-child herstart, niet alleen een wrapperproces.
</Note>

`plugins search` is een externe ClawHub-cataloguslookup. Het inspecteert geen lokale
staat, wijzigt geen config, installeert geen pakketten en laadt geen runtimecode van plugins. Zoekresultaten
bevatten de ClawHub-pakketnaam, familie, kanaal, versie, samenvatting en
een installatietip zoals `openclaw plugins install clawhub:<package>`.

Voor werk aan gebundelde plugins binnen een verpakte Docker-image koppel je de plugin-
bronmap over het overeenkomende verpakte bronpad, zoals
`/app/extensions/synology-chat`. OpenClaw ontdekt die aangekoppelde bron-
overlay vóór `/app/dist/extensions/synology-chat`; een gewoon gekopieerde bron-
map blijft inert zodat normale verpakte installaties nog steeds de gecompileerde dist gebruiken.

Voor runtime-hookdebugging:

- `openclaw plugins inspect <id> --runtime --json` toont geregistreerde hooks en diagnostiek uit een inspectiepass waarbij de module is geladen. Runtime-inspectie installeert nooit afhankelijkheden; gebruik `openclaw doctor --fix` om legacy-afhankelijkheidsstatus op te schonen of ontbrekende geconfigureerde downloadbare plugins te installeren.
- `openclaw gateway status --deep --require-rpc` bevestigt de bereikbare Gateway, service-/proceshints, configpad en RPC-gezondheid.
- Niet-gebundelde conversatiehooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) vereisen `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gebruik `--link` om het kopiëren van een lokale map te vermijden (voegt toe aan `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wordt niet ondersteund met `--link` omdat gekoppelde installaties het bronpad hergebruiken in plaats van over een beheerd installatiedoel heen te kopiëren.

Gebruik `--pin` bij npm-installaties om de opgeloste exacte spec (`name@version`) op te slaan in de beheerde pluginindex, terwijl het standaardgedrag ongepind blijft.
</Note>

### Pluginindex

Installatiemetadata van plugins is machinebeheerde staat, geen gebruikersconfig. Installaties en updates schrijven dit naar `plugins/installs.json` onder de actieve OpenClaw-statusmap. De bovenste `installRecords`-map is de duurzame bron van installatiemetadata, inclusief records voor kapotte of ontbrekende pluginmanifesten. De `plugins`-array is de uit het manifest afgeleide cache voor het koude register. Het bestand bevat een niet-bewerken-waarschuwing en wordt gebruikt door `openclaw plugins update`, deïnstallatie, diagnostiek en het koude pluginregister.

Wanneer OpenClaw meegeleverde legacy-`plugins.installs`-records in de config ziet, verplaatst het die naar de pluginindex en verwijdert het de configsleutel; als een van beide schrijfacties mislukt, blijven de configrecords behouden zodat de installatiemetadata niet verloren gaat.

### Deïnstalleren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` verwijdert pluginrecords uit `plugins.entries`, de blijvend opgeslagen pluginindex, plugin-allow/deny-listvermeldingen en gekoppelde `plugins.load.paths`-vermeldingen waar van toepassing. Tenzij `--keep-files` is ingesteld, verwijdert uninstall ook de bijgehouden beheerde installatiemap wanneer die zich binnen de plugin-extensieroot van OpenClaw bevindt. Voor Active Memory-plugins wordt het geheugenslot teruggezet naar `memory-core`.

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

Updates zijn van toepassing op bijgehouden plugininstallaties in de beheerde pluginindex en bijgehouden hook-pack-installaties in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Wanneer je een plugin-id doorgeeft, hergebruikt OpenClaw de vastgelegde installatiespec voor die plugin. Dat betekent dat eerder opgeslagen dist-tags zoals `@beta` en exacte gepinde versies ook bij latere `update <id>`-runs gebruikt blijven worden.

    Voor npm-installaties kun je ook een expliciete npm-pakketspec met een dist-tag of exacte versie doorgeven. OpenClaw herleidt die pakketnaam naar het bijgehouden pluginrecord, werkt die geïnstalleerde plugin bij en legt de nieuwe npm-spec vast voor toekomstige op id gebaseerde updates.

    Het doorgeven van de npm-pakketnaam zonder versie of tag wordt ook terug herleid naar het bijgehouden pluginrecord. Gebruik dit wanneer een plugin aan een exacte versie was gepind en je die terug wilt zetten naar de standaard releaselijn van het register.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Vóór een live npm-update controleert OpenClaw de geïnstalleerde pakketversie aan de hand van de npm-registermetadata. Als de geïnstalleerde versie en vastgelegde artifact-identiteit al overeenkomen met het opgeloste doel, wordt de update overgeslagen zonder downloaden, opnieuw installeren of herschrijven van `openclaw.json`.

    Wanneer er een opgeslagen integriteitshash bestaat en de opgehaalde artifact-hash verandert, behandelt OpenClaw dat als npm-artifactdrift. De interactieve opdracht `openclaw plugins update` toont de verwachte en werkelijke hashes en vraagt om bevestiging voordat wordt doorgegaan. Niet-interactieve updatehelpers falen gesloten tenzij de aanroeper een expliciet vervolgbeleid opgeeft.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` is ook beschikbaar op `plugins update` als noodoverride voor fout-positieven in de ingebouwde dangerous-code-scan tijdens pluginupdates. Het omzeilt nog steeds geen plugin-`before_install`-beleidsblokkades of blokkering door scanfouten, en het is alleen van toepassing op pluginupdates, niet op hook-pack-updates.
  </Accordion>
</AccordionGroup>

### Inspecteren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect toont identiteit, laadstatus, bron, manifestmogelijkheden, beleidsvlaggen, diagnostiek, installatiemetadata, bundelmogelijkheden en eventuele gedetecteerde MCP- of LSP-serverondersteuning zonder standaard de pluginruntime te importeren. Voeg `--runtime` toe om de pluginmodule te laden en geregistreerde hooks, tools, opdrachten, services, Gateway-methoden en HTTP-routes op te nemen. Runtime-inspectie meldt ontbrekende pluginafhankelijkheden direct; installaties en reparaties blijven in `openclaw plugins install`, `openclaw plugins update` en `openclaw doctor --fix`.

Plugin-eigen CLI-opdrachten worden geïnstalleerd als root-`openclaw`-opdrachtgroepen. Nadat `inspect --runtime` een opdracht onder `cliCommands` toont, voer je die uit als `openclaw <command> ...`; een plugin die bijvoorbeeld `demo-git` registreert, kan worden gecontroleerd met `openclaw demo-git ping`.

Elke plugin wordt geclassificeerd op basis van wat deze daadwerkelijk tijdens runtime registreert:

- **plain-capability** — één mogelijkheidstype (bijv. een provider-only-plugin)
- **hybrid-capability** — meerdere mogelijkheidstypen (bijv. tekst + spraak + afbeeldingen)
- **hook-only** — alleen hooks, geen mogelijkheden of oppervlakken
- **non-capability** — tools/opdrachten/services maar geen mogelijkheden

Zie [Pluginvormen](/nl/plugins/architecture#plugin-shapes) voor meer over het mogelijkhedenmodel.

<Note>
De vlag `--json` geeft een machineleesbaar rapport dat geschikt is voor scripting en auditing. `inspect --all` rendert een vlootbrede tabel met vorm, mogelijkheidstypen, compatibiliteitsmeldingen, bundelmogelijkheden en kolommen met hooksamenvattingen. `info` is een alias voor `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` rapporteert pluginlaadfouten, manifest-/ontdekkingsdiagnostiek en compatibiliteitsmeldingen. Wanneer alles schoon is, wordt `No plugin issues detected.` afgedrukt.

Voor modulevormfouten zoals ontbrekende `register`-/`activate`-exports voer je opnieuw uit met `OPENCLAW_PLUGIN_LOAD_DEBUG=1` om een compacte exportvormsamenvatting in de diagnostische uitvoer op te nemen.

### Register

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Het lokale pluginregister is het blijvend opgeslagen koude leesmodel van OpenClaw voor geïnstalleerde pluginidentiteit, inschakeling, bronmetadata en eigenaarschap van bijdragen. Normale startup, provider-eigenaarlookup, kanaalsetupclassificatie en plugininventaris kunnen het lezen zonder runtime-modules van plugins te importeren.

Gebruik `plugins registry` om te inspecteren of het blijvend opgeslagen register aanwezig, actueel of verouderd is. Gebruik `--refresh` om het opnieuw op te bouwen uit de blijvend opgeslagen pluginindex, configbeleid en manifest-/pakketmetadata. Dit is een reparatiepad, geen runtime-activatiepad.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` is een verouderde noodcompatibiliteitsschakelaar voor registerleesfouten. Geef de voorkeur aan `plugins registry --refresh` of `openclaw doctor --fix`; de env-fallback is alleen bedoeld voor noodherstel van startup terwijl de migratie wordt uitgerold.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list accepteert een lokaal marketplacepad, een `marketplace.json`-pad, een GitHub-verkorting zoals `owner/repo`, een GitHub-repo-URL of een git-URL. `--json` drukt het opgeloste bronlabel af plus het geparste marketplace-manifest en pluginvermeldingen.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [CLI-referentie](/nl/cli)
- [Communityplugins](/nl/plugins/community)
