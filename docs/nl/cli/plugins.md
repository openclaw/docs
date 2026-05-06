---
read_when:
    - Je wilt Gateway-plugins of compatibele bundels installeren of beheren
    - Je wilt Plugin-laadfouten debuggen
sidebarTitle: Plugins
summary: CLI-referentie voor `openclaw plugins` (lijst, installeren, marketplace, verwijderen, inschakelen/uitschakelen, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-06T09:06:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: e584092c6cdaf87681aef2ed106c299e3bab0552305b669c66b05deb61bf25ce
    source_path: cli/plugins.md
    workflow: 16
---

Beheer Gateway-plugins, hookpakketten en compatibele bundels.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/nl/tools/plugin">
    Handleiding voor eindgebruikers voor het installeren, inschakelen en oplossen van problemen met plugins.
  </Card>
  <Card title="Plugins beheren" href="/nl/plugins/manage-plugins">
    Snelle voorbeelden voor installeren, weergeven, bijwerken, verwijderen en publiceren.
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

Voor onderzoek naar een trage installatie, inspectie, verwijdering of registry-verversing voert u de
opdracht uit met `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. De trace schrijft fasetimings
naar stderr en houdt JSON-uitvoer parseerbaar. Zie [Foutopsporing](/nl/help/debugging#plugin-lifecycle-trace).

<Note>
Gebundelde plugins worden met OpenClaw meegeleverd. Sommige zijn standaard ingeschakeld (bijvoorbeeld gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browserplugin); andere vereisen `plugins enable`.

Native OpenClaw-plugins moeten `openclaw.plugin.json` leveren met een inline JSON Schema (`configSchema`, ook als dit leeg is). Compatibele bundels gebruiken in plaats daarvan hun eigen bundelmanifests.

`plugins list` toont `Format: openclaw` of `Format: bundle`. Uitgebreide list/info-uitvoer toont ook het bundelsubtype (`codex`, `claude` of `cursor`) plus gedetecteerde bundelmogelijkheden.
</Note>

### Installeren

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
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
Kale pakketnamen worden tijdens de lanceringsovergang standaard vanuit npm geïnstalleerd. Gebruik `clawhub:<package>` voor ClawHub. Behandel plugin-installaties als het uitvoeren van code. Geef de voorkeur aan vastgepinde versies.
</Warning>

`plugins search` bevraagt ClawHub op installeerbare plugin-pakketten en drukt
installatieklare pakketnamen af. Het zoekt code-plugin- en bundle-plugin-pakketten,
geen Skills. Gebruik `openclaw skills search` voor ClawHub Skills.

<Note>
ClawHub is het primaire distributie- en ontdekkingsoppervlak voor de meeste plugins. Npm
blijft een ondersteunde fallback en direct-installatiepad. Plugin-pakketten van OpenClaw
onder `@openclaw/*` worden weer op npm gepubliceerd; zie de huidige lijst
op [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) of de
[plugin-inventaris](/nl/plugins/plugin-inventory). Stabiele installaties gebruiken `latest`.
Installaties en updates via het bètakanaal geven de voorkeur aan de npm `beta` dist-tag wanneer die tag
beschikbaar is, en vallen daarna terug op `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config-includes en herstel van ongeldige configuratie">
    Als uw sectie `plugins` wordt ondersteund door een enkelbestand-`$include`, schrijven `plugins install/update/enable/disable/uninstall` door naar dat opgenomen bestand en laten ze `openclaw.json` ongemoeid. Root-includes, include-arrays en includes met sibling-overrides falen gesloten in plaats van af te vlakken. Zie [Config-includes](/nl/gateway/configuration) voor de ondersteunde vormen.

    Als de configuratie ongeldig is tijdens installatie, faalt `plugins install` normaal gesproken gesloten en vertelt het u eerst `openclaw doctor --fix` uit te voeren. Tijdens het opstarten en hot reload van de Gateway faalt ongeldige plugin-configuratie gesloten zoals elke andere ongeldige configuratie; `openclaw doctor --fix` kan de ongeldige plugin-vermelding in quarantaine plaatsen. De enige gedocumenteerde uitzondering tijdens installatie is een smal herstelpad voor gebundelde plugins voor plugins die expliciet kiezen voor `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force en opnieuw installeren versus bijwerken">
    `--force` hergebruikt het bestaande installatiedoel en overschrijft een al geïnstalleerde plugin of hookpakket ter plekke. Gebruik dit wanneer u opzettelijk dezelfde id opnieuw installeert vanaf een nieuw lokaal pad, archief, ClawHub-pakket of npm-artefact. Voor routine-upgrades van een al gevolgde npm-plugin geeft u de voorkeur aan `openclaw plugins update <id-or-npm-spec>`.

    Als u `plugins install` uitvoert voor een plugin-id die al is geïnstalleerd, stopt OpenClaw en verwijst het u naar `plugins update <id-or-npm-spec>` voor een normale upgrade, of naar `plugins install <package> --force` wanneer u de huidige installatie echt vanuit een andere bron wilt overschrijven.

  </Accordion>
  <Accordion title="--pin-bereik">
    `--pin` is alleen van toepassing op npm-installaties. Het wordt niet ondersteund met `git:`-installaties; gebruik een expliciete git-ref zoals `git:github.com/acme/plugin@v1.2.3` wanneer u een vastgepinde bron wilt. Het wordt niet ondersteund met `--marketplace`, omdat marketplace-installaties marketplace-bronmetadata bewaren in plaats van een npm-spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` is een noodoptie voor fout-positieven in de ingebouwde scanner voor gevaarlijke code. Hiermee kan de installatie doorgaan, zelfs wanneer de ingebouwde scanner `critical`-bevindingen meldt, maar het omzeilt **niet** de beleidsblokkades van de plugin-`before_install`-hook en omzeilt **niet** scanfouten.

    Deze CLI-vlag is van toepassing op install-/updateflows voor plugins. Gateway-ondersteunde installaties van Skill-afhankelijkheden gebruiken de overeenkomende aanvraag-override `dangerouslyForceUnsafeInstall`, terwijl `openclaw skills install` een aparte download-/installatieflow voor ClawHub Skills blijft.

    Als een plugin die u op ClawHub hebt gepubliceerd wordt geblokkeerd door een registryscan, gebruik dan de uitgeverstappen in [ClawHub](/nl/tools/clawhub).

  </Accordion>
  <Accordion title="Hookpakketten en npm-specs">
    `plugins install` is ook het installatieoppervlak voor hookpakketten die `openclaw.hooks` in `package.json` beschikbaar maken. Gebruik `openclaw hooks` voor gefilterde hookzichtbaarheid en inschakeling per hook, niet voor pakketinstallatie.

    Npm-specs zijn **alleen registry** (pakketnaam + optionele **exacte versie** of **dist-tag**). Git-/URL-/bestandsspecs en semver-bereiken worden geweigerd. Afhankelijkheidsinstallaties worden projectlokaal uitgevoerd met `--ignore-scripts` voor veiligheid, zelfs wanneer uw shell globale npm-installatie-instellingen heeft.

    Gebruik `npm:<package>` wanneer u npm-resolutie expliciet wilt maken. Kale pakketspecs installeren tijdens de lanceringsovergang ook rechtstreeks vanuit npm.

    Kale specs en `@latest` blijven op het stabiele spoor. OpenClaw-correctieversies met datumstempel, zoals `2026.5.3-1`, zijn stabiele releases voor deze controle. Als npm een van die versies naar een prerelease resolveert, stopt OpenClaw en vraagt het u expliciet in te stappen met een prerelease-tag zoals `@beta`/`@rc` of een exacte prereleaseversie zoals `@1.2.3-beta.4`.

    Als een kale installatiespec overeenkomt met een officiële plugin-id (bijvoorbeeld `diffs`), installeert OpenClaw de catalogusvermelding rechtstreeks. Gebruik een expliciete scoped spec (bijvoorbeeld `@scope/diffs`) om een npm-pakket met dezelfde naam te installeren.

  </Accordion>
  <Accordion title="Git-repository's">
    Gebruik `git:<repo>` om rechtstreeks vanuit een git-repository te installeren. Ondersteunde vormen omvatten `git:github.com/owner/repo`, `git:owner/repo`, volledige `https://`-, `ssh://`-, `git://`-, `file://`- en `git@host:owner/repo.git`-clone-URL's. Voeg `@<ref>` of `#<ref>` toe om vóór installatie een branch, tag of commit uit te checken.

    Git-installaties clonen naar een tijdelijke map, checken de gevraagde ref uit wanneer die aanwezig is, en gebruiken daarna de normale installer voor plugin-mappen. Dat betekent dat manifestvalidatie, scannen op gevaarlijke code, installatiewerk van pakketmanagers en installatierecords zich gedragen zoals bij npm-installaties. Vastgelegde git-installaties bevatten de bron-URL/ref plus de opgeloste commit, zodat `openclaw plugins update` de bron later opnieuw kan resolven.

    Gebruik na installatie vanuit git `openclaw plugins inspect <id> --runtime --json` om runtime-registraties zoals gateway-methoden en CLI-opdrachten te verifiëren. Als de plugin een CLI-root heeft geregistreerd met `api.registerCli`, voer die opdracht dan rechtstreeks uit via de OpenClaw-root-CLI, bijvoorbeeld `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archieven">
    Ondersteunde archieven: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-pluginarchieven moeten een geldig `openclaw.plugin.json` bevatten in de uitgepakte plugin-root; archieven die alleen `package.json` bevatten, worden geweigerd voordat OpenClaw installatierecords schrijft.

    Gebruik `npm-pack:<path.tgz>` wanneer het bestand een npm-pack-tarball is en u
    hetzelfde beheerde npm-root-installatiepad wilt testen dat door registry-installaties wordt gebruikt,
    inclusief verificatie van `package-lock.json`, scannen van gehoste afhankelijkheden en
    npm-installatierecords. Gewone archiefpaden worden nog steeds als lokale archieven geïnstalleerd
    onder de plugin-extensieroot.

    Claude-marketplace-installaties worden ook ondersteund.

  </Accordion>
</AccordionGroup>

ClawHub-installaties gebruiken een expliciete `clawhub:<package>`-locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Kale npm-veilige plugin-specs worden tijdens de lanceringsovergang standaard vanuit npm geïnstalleerd:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gebruik `npm:` om alleen-npm-resolutie expliciet te maken:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controleert vóór installatie de geadverteerde plugin-API / minimale gateway-compatibiliteit. Wanneer de geselecteerde ClawHub-versie een ClawPack-artefact publiceert, downloadt OpenClaw de geversioneerde npm-pack `.tgz`, verifieert het de ClawHub-digestheader en de artefactdigest, en installeert het dit vervolgens via het normale archiefpad. Oudere ClawHub-versies zonder ClawPack-metadata installeren nog steeds via het legacy verificatiepad voor pakketarchieven. Vastgelegde installaties bewaren hun ClawHub-bronmetadata, artefactsoort, npm-integriteit, npm-shasum, tarballnaam en ClawPack-digestfeiten voor latere updates.
Ongeversioneerde ClawHub-installaties bewaren een ongeversioneerde vastgelegde spec zodat `openclaw plugins update` nieuwere ClawHub-releases kan volgen; expliciete versie- of tagselectoren zoals `clawhub:pkg@1.2.3` en `clawhub:pkg@beta` blijven vastgepind aan die selector.

#### Marketplace-stenografie

Gebruik de stenografie `plugin@marketplace` wanneer de marketplace-naam bestaat in Claude's lokale registry-cache op `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="Marketplacebronnen">
    - een bekende Claude-marketplacenaam uit `~/.claude/plugins/known_marketplaces.json`
    - een lokale marketplaceroot of `marketplace.json`-pad
    - een GitHub-repoverkorting zoals `owner/repo`
    - een GitHub-repo-URL zoals `https://github.com/owner/repo`
    - een git-URL

  </Tab>
  <Tab title="Regels voor externe marketplaces">
    Voor externe marketplaces die vanuit GitHub of git worden geladen, moeten pluginvermeldingen binnen de gekloonde marketplace-repo blijven. OpenClaw accepteert relatieve padbronnen uit die repo en weigert HTTP(S)-, absolute-pad-, git-, GitHub- en andere niet-pad-pluginbronnen uit externe manifests.
  </Tab>
</Tabs>

Voor lokale paden en archieven detecteert OpenClaw automatisch:

- native OpenClaw-plugins (`openclaw.plugin.json`)
- Codex-compatibele bundels (`.codex-plugin/plugin.json`)
- Claude-compatibele bundels (`.claude-plugin/plugin.json` of de standaard Claude-componentindeling)
- Cursor-compatibele bundels (`.cursor-plugin/plugin.json`)

<Note>
Compatibele bundels worden geïnstalleerd in de normale pluginroot en doen mee aan dezelfde list/info/enable/disable-flow. Momenteel worden bundel-Skills, Claude command-skills, Claude `settings.json`-standaarden, Claude `.lsp.json` / door het manifest gedeclareerde `lspServers`-standaarden, Cursor command-skills en compatibele Codex-hookmappen ondersteund; andere gedetecteerde bundelmogelijkheden worden getoond in diagnostiek/info, maar zijn nog niet gekoppeld aan runtime-uitvoering.
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
  Schakel van de tabelweergave over naar detailregels per plugin met metadata voor bron/oorsprong/versie/activering.
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare inventaris plus registerdiagnostiek en installatiestatus van pakketafhankelijkheden.
</ParamField>

<Note>
`plugins list` leest eerst het opgeslagen lokale pluginregister, met een alleen-uit-manifest-afgeleide fallback wanneer het register ontbreekt of ongeldig is. Dit is nuttig om te controleren of een plugin is geïnstalleerd, ingeschakeld en zichtbaar is voor koude opstartplanning, maar het is geen live runtime-probe van een Gateway-proces dat al draait. Herstart na het wijzigen van plugincode, inschakeling, hookbeleid of `plugins.load.paths` de Gateway die het kanaal bedient voordat je verwacht dat nieuwe `register(api)`-code of hooks worden uitgevoerd. Controleer bij externe/containerimplementaties dat je het daadwerkelijke `openclaw gateway run`-child herstart, niet alleen een wrapperproces.

`plugins list --json` bevat voor elke plugin de `dependencyStatus` uit `package.json`
`dependencies` en `optionalDependencies`. OpenClaw controleert of die pakketnamen
aanwezig zijn langs het normale Node `node_modules`-opzoekpad van de plugin; het
importeert geen plugin-runtimecode, voert geen pakketbeheerder uit en herstelt geen
ontbrekende afhankelijkheden.
</Note>

`plugins search` is een externe ClawHub-cataloguslookup. Het inspecteert geen lokale
status, wijzigt geen config, installeert geen pakketten en laadt geen plugin-runtimecode. Zoekresultaten bevatten de ClawHub-pakketnaam, familie, kanaal, versie, samenvatting en
een installatiehint zoals `openclaw plugins install clawhub:<package>`.

Voor werk aan gebundelde plugins binnen een verpakte Docker-image, bind-mount je de plugin
bronmap over het overeenkomende verpakte bronpad, zoals
`/app/extensions/synology-chat`. OpenClaw ontdekt die gemounte bron-overlay
voor `/app/dist/extensions/synology-chat`; een gewoon gekopieerde bronmap
blijft inert, zodat normale verpakte installaties nog steeds de gecompileerde dist gebruiken.

Voor runtime-hookdebugging:

- `openclaw plugins inspect <id> --runtime --json` toont geregistreerde hooks en diagnostiek uit een inspectiepassage met geladen module. Runtime-inspectie installeert nooit afhankelijkheden; gebruik `openclaw doctor --fix` om verouderde afhankelijkheidsstatus op te schonen of ontbrekende downloadbare plugins te herstellen waarnaar in de config wordt verwezen.
- `openclaw gateway status --deep --require-rpc` bevestigt de bereikbare Gateway, service-/proceshints, het configpad en de RPC-gezondheid.
- Niet-gebundelde conversatiehooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) vereisen `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gebruik `--link` om te voorkomen dat een lokale map wordt gekopieerd (voegt toe aan `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wordt niet ondersteund met `--link`, omdat gekoppelde installaties het bronpad hergebruiken in plaats van over een beheerd installatiedoel heen te kopiëren.

Gebruik `--pin` bij npm-installaties om de opgeloste exacte spec (`name@version`) op te slaan in de beheerde pluginindex, terwijl het standaardgedrag ongepind blijft.
</Note>

### Pluginindex

Installatiemetadata van plugins is machinebeheerde status, geen gebruikersconfig. Installaties en updates schrijven deze naar `plugins/installs.json` onder de actieve OpenClaw-statusmap. De top-level `installRecords`-map is de duurzame bron van installatiemetadata, inclusief records voor defecte of ontbrekende pluginmanifests. De `plugins`-array is de uit manifests afgeleide koude registercache. Het bestand bevat een waarschuwing om het niet te bewerken en wordt gebruikt door `openclaw plugins update`, verwijderen, diagnostiek en het koude pluginregister.

Wanneer OpenClaw meegeleverde verouderde `plugins.installs`-records in config ziet, verplaatst het die naar de pluginindex en verwijdert het de configsleutel; als een van beide schrijfacties mislukt, blijven de configrecords behouden zodat de installatiemetadata niet verloren gaat.

### Verwijderen

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` verwijdert pluginrecords uit `plugins.entries`, de opgeslagen pluginindex, plugin-allow/deny-listvermeldingen en gekoppelde `plugins.load.paths`-vermeldingen waar van toepassing. Tenzij `--keep-files` is ingesteld, verwijdert uninstall ook de gevolgde beheerde installatiemap wanneer die zich binnen de pluginextensionsroot van OpenClaw bevindt. Voor active-memory-plugins wordt de geheugensleuf teruggezet naar `memory-core`.

<Note>
`--keep-config` wordt ondersteund als verouderd alias voor `--keep-files`.
</Note>

### Bijwerken

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Updates gelden voor gevolgde plugininstallaties in de beheerde pluginindex en gevolgde hook-packinstallaties in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Plugin-id versus npm-spec oplossen">
    Wanneer je een plugin-id doorgeeft, hergebruikt OpenClaw de vastgelegde installatiespec voor die plugin. Dat betekent dat eerder opgeslagen dist-tags zoals `@beta` en exact gepinde versies ook bij latere `update <id>`-runs worden gebruikt.

    Voor npm-installaties kun je ook een expliciete npm-pakketspec met een dist-tag of exacte versie doorgeven. OpenClaw herleidt die pakketnaam naar het gevolgde pluginrecord, werkt die geïnstalleerde plugin bij en legt de nieuwe npm-spec vast voor toekomstige updates op basis van id.

    Het doorgeven van de npm-pakketnaam zonder versie of tag wordt ook herleid naar het gevolgde pluginrecord. Gebruik dit wanneer een plugin op een exacte versie was gepind en je die terug wilt verplaatsen naar de standaardreleasereeks van het register.

  </Accordion>
  <Accordion title="Updates voor het bètakanaal">
    `openclaw plugins update` hergebruikt de gevolgde pluginspec tenzij je een nieuwe spec doorgeeft. `openclaw update` kent daarnaast het actieve OpenClaw-updatekanaal: op het bètakanaal proberen npm- en ClawHub-pluginrecords uit de standaardreeks eerst `@beta` en vallen daarna terug op de vastgelegde standaard-/latest-spec als er geen pluginbètarelease bestaat. Exacte versies en expliciete tags blijven gepind op die selector.

  </Accordion>
  <Accordion title="Versiecontroles en integriteitsdrift">
    Vóór een live npm-update controleert OpenClaw de geïnstalleerde pakketversie aan de hand van de npm-registermetadata. Als de geïnstalleerde versie en vastgelegde artifactidentiteit al overeenkomen met het opgeloste doel, wordt de update overgeslagen zonder te downloaden, opnieuw te installeren of `openclaw.json` te herschrijven.

    Wanneer er een opgeslagen integriteitshash bestaat en de opgehaalde artifacthash verandert, behandelt OpenClaw dat als npm-artifactdrift. De interactieve opdracht `openclaw plugins update` toont de verwachte en werkelijke hashes en vraagt om bevestiging voordat wordt doorgegaan. Niet-interactieve updatehelpers falen gesloten tenzij de aanroeper een expliciet voortzettingsbeleid opgeeft.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install bij update">
    `--dangerously-force-unsafe-install` is ook beschikbaar bij `plugins update` als noodoverride voor fout-positieven van de ingebouwde dangerous-code-scan tijdens pluginupdates. Het omzeilt nog steeds geen plugin-`before_install`-beleidsblokkades of blokkering door scanfouten, en het geldt alleen voor pluginupdates, niet voor hook-packupdates.
  </Accordion>
</AccordionGroup>

### Inspecteren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect toont identiteit, laadstatus, bron, manifestmogelijkheden, beleidsvlaggen, diagnostiek, installatiemetadata, bundelmogelijkheden en eventuele gedetecteerde MCP- of LSP-serverondersteuning zonder standaard plugin-runtime te importeren. Voeg `--runtime` toe om de pluginmodule te laden en geregistreerde hooks, tools, opdrachten, services, gatewaymethoden en HTTP-routes op te nemen. Runtime-inspectie rapporteert ontbrekende pluginafhankelijkheden direct; installaties en reparaties blijven in `openclaw plugins install`, `openclaw plugins update` en `openclaw doctor --fix`.

CLI-opdrachten die eigendom zijn van plugins worden geïnstalleerd als root-`openclaw`-opdrachtgroepen. Nadat `inspect --runtime` een opdracht onder `cliCommands` toont, voer je die uit als `openclaw <command> ...`; bijvoorbeeld een plugin die `demo-git` registreert, kan worden gecontroleerd met `openclaw demo-git ping`.

Elke plugin wordt geclassificeerd op basis van wat deze daadwerkelijk tijdens runtime registreert:

- **plain-capability** — één mogelijkheidstype (bijv. een provider-only-plugin)
- **hybrid-capability** — meerdere mogelijkheidstypen (bijv. tekst + spraak + afbeeldingen)
- **hook-only** — alleen hooks, geen mogelijkheden of oppervlakken
- **non-capability** — tools/opdrachten/services maar geen mogelijkheden

Zie [Pluginvormen](/nl/plugins/architecture#plugin-shapes) voor meer over het capabilitymodel.

<Note>
De vlag `--json` geeft een machineleesbaar rapport dat geschikt is voor scripts en audits. `inspect --all` rendert een vlootbrede tabel met vorm, mogelijkheidstypen, compatibiliteitsmeldingen, bundelmogelijkheden en hook-samenvattingskolommen. `info` is een alias voor `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` rapporteert laadfouten van plugins, manifest-/ontdekkingsdiagnostiek en compatibiliteitsmeldingen. Wanneer alles schoon is, wordt `No plugin issues detected.` afgedrukt.

Als een geconfigureerde plugin op schijf aanwezig is maar wordt geblokkeerd door de padveiligheidscontroles van de loader, behoudt configvalidatie de pluginvermelding en rapporteert deze als `present but blocked`. Los de voorafgaande diagnostiek voor de geblokkeerde plugin op, zoals padeigendom of world-writable-rechten, in plaats van de config `plugins.entries.<id>` of `plugins.allow` te verwijderen.

Voor modulevormfouten zoals ontbrekende `register`/`activate`-exports, voer je opnieuw uit met `OPENCLAW_PLUGIN_LOAD_DEBUG=1` om een compacte exportsvormsamenvatting in de diagnostische uitvoer op te nemen.

### Register

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Het lokale Plugin-register is het persistente koude leesmodel van OpenClaw voor de identiteit van geïnstalleerde Plugins, activering, bronmetadata en eigenaarschap van bijdragen. Normaal opstarten, opzoeken van provider-eigenaars, classificatie van kanaalconfiguratie en Plugin-inventaris kunnen het lezen zonder Plugin-runtime-modules te importeren.

Gebruik `plugins registry` om te controleren of het persistente register aanwezig, actueel of verouderd is. Gebruik `--refresh` om het opnieuw op te bouwen vanuit de persistente Plugin-index, het configuratiebeleid en manifest-/pakketmetadata. Dit is een herstelpad, geen runtime-activeringspad.

`openclaw doctor --fix` herstelt ook registergerelateerde beheerde npm-afwijkingen: als een verweesd of hersteld `@openclaw/*`-pakket onder de beheerde Plugin-npm-root een gebundelde Plugin overschaduwt, verwijdert doctor dat verouderde pakket en bouwt het register opnieuw op zodat het opstarten valideert tegen het gebundelde manifest.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` is een verouderde noodschakelaar voor compatibiliteit bij leesfouten in het register. Geef de voorkeur aan `plugins registry --refresh` of `openclaw doctor --fix`; de env-fallback is alleen bedoeld voor noodherstel van het opstarten terwijl de migratie wordt uitgerold.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

De Marketplace-lijst accepteert een lokaal Marketplace-pad, een `marketplace.json`-pad, een GitHub-afkorting zoals `owner/repo`, een GitHub-repo-URL of een git-URL. `--json` toont het opgeloste bronlabel plus het geparseerde Marketplace-manifest en de Plugin-vermeldingen.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [CLI-referentie](/nl/cli)
- [Community-Plugins](/nl/plugins/community)
