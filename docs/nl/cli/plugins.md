---
read_when:
    - Je wilt Gateway-plugins of compatibele bundels installeren of beheren
    - Je wilt fouten bij het laden van plugins debuggen
sidebarTitle: Plugins
summary: CLI-referentie voor `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-02T22:17:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b077ab0739e2453ccba434aa3b02b1d441bab792b7b131216221a8048d551cd
    source_path: cli/plugins.md
    workflow: 16
---

Beheer Gateway-plugins, hook-pakketten en compatibele bundels.

<CardGroup cols={2}>
  <Card title="Plugin-systeem" href="/nl/tools/plugin">
    Gebruikershandleiding voor het installeren, inschakelen en oplossen van problemen met plugins.
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

Voor onderzoek naar een trage installatie, inspectie, verwijdering of registry-verversing voer je de opdracht uit met `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. De trace schrijft fasetimings naar stderr en houdt JSON-uitvoer parseerbaar. Zie [Debuggen](/nl/help/debugging#plugin-lifecycle-trace).

<Note>
Gebundelde plugins worden met OpenClaw meegeleverd. Sommige zijn standaard ingeschakeld (bijvoorbeeld gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browserplugin); andere vereisen `plugins enable`.

Native OpenClaw-plugins moeten `openclaw.plugin.json` meeleveren met een inline JSON Schema (`configSchema`, zelfs als dat leeg is). Compatibele bundels gebruiken in plaats daarvan hun eigen bundelmanifesten.

`plugins list` toont `Format: openclaw` of `Format: bundle`. Uitvoer van uitgebreide lijsten/info toont ook het bundelsubtype (`codex`, `claude` of `cursor`) plus gedetecteerde bundelmogelijkheden.
</Note>

### Installeren

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
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
Kale pakketnamen worden tijdens de launchovergang standaard vanuit npm geïnstalleerd. Gebruik `clawhub:<package>` voor ClawHub. Behandel plugin-installaties alsof je code uitvoert. Geef de voorkeur aan vastgepinde versies.
</Warning>

`plugins search` doorzoekt ClawHub naar installeerbare plugin-pakketten en drukt installatieklare pakketnamen af. Het zoekt naar code-plugin- en bundle-plugin-pakketten, niet naar Skills. Gebruik `openclaw skills search` voor ClawHub-Skills.

<Note>
ClawHub is het primaire distributie- en ontdekkingsoppervlak voor de meeste plugins. Npm blijft een ondersteunde fallback en een pad voor directe installatie. OpenClaw-eigen `@openclaw/*` plugin-pakketten worden weer op npm gepubliceerd; zie de actuele lijst op [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) of de [plugin-inventaris](/nl/plugins/plugin-inventory). Stabiele installaties gebruiken `latest`. Installaties en updates via het bètakanaal geven de voorkeur aan de npm `beta` dist-tag wanneer die tag beschikbaar is en vallen daarna terug op `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config-includes en herstel bij ongeldige config">
    Als je `plugins`-sectie wordt ondersteund door een enkelbestands-`$include`, schrijven `plugins install/update/enable/disable/uninstall` door naar dat geïnclude bestand en laten ze `openclaw.json` ongemoeid. Root-includes, include-arrays en includes met naastliggende overrides falen gesloten in plaats van af te vlakken. Zie [Config-includes](/nl/gateway/configuration) voor de ondersteunde vormen.

    Als de config tijdens installatie ongeldig is, faalt `plugins install` normaal gesloten en vraagt het je eerst `openclaw doctor --fix` uit te voeren. Tijdens het opstarten van de Gateway wordt ongeldige config voor één plugin geïsoleerd tot die plugin, zodat andere kanalen en plugins kunnen blijven draaien; `openclaw doctor --fix` kan de ongeldige plugin-vermelding in quarantaine plaatsen. De enige gedocumenteerde uitzondering tijdens installatie is een smal herstelpad voor gebundelde plugins voor plugins die expliciet kiezen voor `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force en opnieuw installeren versus bijwerken">
    `--force` hergebruikt het bestaande installatiedoel en overschrijft een al geïnstalleerde plugin of hook-pakket ter plekke. Gebruik dit wanneer je bewust dezelfde id opnieuw installeert vanaf een nieuw lokaal pad, archief, ClawHub-pakket of npm-artefact. Voor routinematige upgrades van een al gevolgde npm-plugin geef je de voorkeur aan `openclaw plugins update <id-or-npm-spec>`.

    Als je `plugins install` uitvoert voor een plugin-id die al geïnstalleerd is, stopt OpenClaw en verwijst het je naar `plugins update <id-or-npm-spec>` voor een normale upgrade, of naar `plugins install <package> --force` wanneer je de huidige installatie echt vanuit een andere bron wilt overschrijven.

  </Accordion>
  <Accordion title="Bereik van --pin">
    `--pin` is alleen van toepassing op npm-installaties. Het wordt niet ondersteund met `git:`-installaties; gebruik een expliciete git-ref zoals `git:github.com/acme/plugin@v1.2.3` wanneer je een vastgepinde bron wilt. Het wordt niet ondersteund met `--marketplace`, omdat marketplace-installaties bronmetadata van de marketplace bewaren in plaats van een npm-specificatie.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` is een noodoptie voor false positives in de ingebouwde scanner voor gevaarlijke code. Hiermee kan de installatie doorgaan, zelfs wanneer de ingebouwde scanner `critical`-bevindingen meldt, maar dit omzeilt **niet** de beleidsblokkades van plugin-`before_install`-hooks en omzeilt **niet** scanfouten.

    Deze CLI-vlag is van toepassing op installatie- en updateflows voor plugins. Door Gateway ondersteunde installaties van Skill-afhankelijkheden gebruiken de overeenkomende request-override `dangerouslyForceUnsafeInstall`, terwijl `openclaw skills install` een afzonderlijke download-/installatieflow voor ClawHub-Skills blijft.

    Als een plugin die je op ClawHub hebt gepubliceerd wordt geblokkeerd door een registryscan, gebruik dan de publicatiestappen in [ClawHub](/nl/tools/clawhub).

  </Accordion>
  <Accordion title="Hook-pakketten en npm-specificaties">
    `plugins install` is ook het installatieoppervlak voor hook-pakketten die `openclaw.hooks` in `package.json` aanbieden. Gebruik `openclaw hooks` voor gefilterde zichtbaarheid van hooks en inschakeling per hook, niet voor pakketinstallatie.

    Npm-specificaties zijn **alleen registry** (pakketnaam + optionele **exacte versie** of **dist-tag**). Git-/URL-/file-specificaties en semver-bereiken worden geweigerd. Afhankelijkheidsinstallaties draaien projectlokaal met `--ignore-scripts` voor veiligheid, zelfs wanneer je shell globale npm-installatie-instellingen heeft.

    Gebruik `npm:<package>` wanneer je npm-resolutie expliciet wilt maken. Kale pakketspecificaties installeren tijdens de launchovergang ook direct vanuit npm.

    Kale specificaties en `@latest` blijven op het stabiele spoor. Als npm een van beide naar een prerelease resolveert, stopt OpenClaw en vraagt het je expliciet in te stemmen met een prerelease-tag zoals `@beta`/`@rc` of een exacte prerelease-versie zoals `@1.2.3-beta.4`.

    Als een kale installatiespecificatie overeenkomt met een officiële plugin-id (bijvoorbeeld `diffs`), installeert OpenClaw de catalogusvermelding direct. Gebruik een expliciete scoped specificatie (bijvoorbeeld `@scope/diffs`) om een npm-pakket met dezelfde naam te installeren.

  </Accordion>
  <Accordion title="Git-repository's">
    Gebruik `git:<repo>` om direct vanuit een git-repository te installeren. Ondersteunde vormen zijn onder andere `git:github.com/owner/repo`, `git:owner/repo`, volledige kloon-URL's met `https://`, `ssh://`, `git://`, `file://` en `git@host:owner/repo.git`. Voeg `@<ref>` of `#<ref>` toe om vóór installatie een branch, tag of commit uit te checken.

    Git-installaties klonen naar een tijdelijke directory, checken de gevraagde ref uit wanneer aanwezig en gebruiken daarna de normale installer voor plugin-directory's. Dat betekent dat manifestvalidatie, scanning op gevaarlijke code, installatiewerk van de package manager en installatierecords zich gedragen als bij npm-installaties. Vastgelegde git-installaties bevatten de bron-URL/ref plus de opgeloste commit, zodat `openclaw plugins update` de bron later opnieuw kan resolven.

    Gebruik na installatie vanuit git `openclaw plugins inspect <id> --runtime --json` om runtime-registraties zoals gateway-methoden en CLI-opdrachten te verifiëren. Als de plugin een CLI-root heeft geregistreerd met `api.registerCli`, voer die opdracht dan direct uit via de OpenClaw-root-CLI, bijvoorbeeld `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archieven">
    Ondersteunde archieven: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-pluginarchieven moeten een geldige `openclaw.plugin.json` bevatten op de uitgepakte plugin-root; archieven die alleen `package.json` bevatten, worden geweigerd voordat OpenClaw installatierecords schrijft.

    Installaties vanuit de Claude-marketplace worden ook ondersteund.

  </Accordion>
</AccordionGroup>

ClawHub-installaties gebruiken een expliciete `clawhub:<package>`-locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Kale npm-veilige plugin-specificaties installeren tijdens de launchovergang standaard vanuit npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gebruik `npm:` om npm-only-resolutie expliciet te maken:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controleert de geadverteerde plugin-API / minimale gateway-compatibiliteit vóór installatie. Wanneer de geselecteerde ClawHub-versie een ClawPack-artefact publiceert, downloadt OpenClaw de geversioneerde npm-pack `.tgz`, verifieert het de ClawHub-digestheader en de artefactdigest, en installeert het deze daarna via het normale archiefpad. Oudere ClawHub-versies zonder ClawPack-metadata installeren nog steeds via het legacy verificatiepad voor pakketarchieven. Vastgelegde installaties bewaren hun ClawHub-bronmetadata, artefactsoort, npm-integriteit, npm-shasum, tarballnaam en ClawPack-digestfeiten voor latere updates.
Ongeversioneerde ClawHub-installaties bewaren een ongeversioneerde vastgelegde specificatie zodat `openclaw plugins update` nieuwere ClawHub-releases kan volgen; expliciete versie- of tagselectors zoals `clawhub:pkg@1.2.3` en `clawhub:pkg@beta` blijven vastgepind op die selector.

#### Marketplace-verkorting

Gebruik de verkorting `plugin@marketplace` wanneer de marketplace-naam bestaat in Claude's lokale registrycache op `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Gebruik `--marketplace` wanneer je de marketplace-bron expliciet wilt doorgeven:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marktplaatsbronnen">
    - een bij Claude bekende marktplaatsnaam uit `~/.claude/plugins/known_marketplaces.json`
    - een lokale marktplaatsroot of `marketplace.json`-pad
    - een GitHub-repo-shorthand zoals `owner/repo`
    - een GitHub-repo-URL zoals `https://github.com/owner/repo`
    - een git-URL

  </Tab>
  <Tab title="Regels voor externe marktplaatsen">
    Voor externe marktplaatsen die vanuit GitHub of git worden geladen, moeten pluginvermeldingen binnen de gekloonde marktplaatsrepo blijven. OpenClaw accepteert relatieve padbronnen uit die repo en weigert HTTP(S)-, absolute-pad-, git-, GitHub- en andere niet-pad-pluginbronnen uit externe manifests.
  </Tab>
</Tabs>

Voor lokale paden en archieven detecteert OpenClaw automatisch:

- native OpenClaw-plugins (`openclaw.plugin.json`)
- Codex-compatibele bundels (`.codex-plugin/plugin.json`)
- Claude-compatibele bundels (`.claude-plugin/plugin.json` of de standaard Claude-componentindeling)
- Cursor-compatibele bundels (`.cursor-plugin/plugin.json`)

<Note>
Compatibele bundels installeren in de normale pluginroot en nemen deel aan dezelfde list/info/enable/disable-flow. Momenteel worden bundel-Skills, Claude-command-Skills, standaardwaarden van Claude `settings.json`, standaardwaarden van Claude `.lsp.json` / door het manifest gedeclareerde `lspServers`, Cursor-command-Skills en compatibele Codex-hookmappen ondersteund; andere gedetecteerde bundelmogelijkheden worden in diagnostics/info getoond, maar zijn nog niet aangesloten op runtime-uitvoering.
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
  Schakel over van de tabelweergave naar detailregels per plugin met metadata over bron/oorsprong/versie/activering.
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare inventaris plus registerdiagnostiek en installatiestatus van pakketafhankelijkheden.
</ParamField>

<Note>
`plugins list` leest eerst het persistente lokale pluginregister, met een uitsluitend uit het manifest afgeleide fallback wanneer het register ontbreekt of ongeldig is. Het is nuttig om te controleren of een plugin is geïnstalleerd, ingeschakeld en zichtbaar is voor koude-opstartplanning, maar het is geen live runtime-probe van een al draaiend Gateway-proces. Nadat je plugincode, inschakeling, hookbeleid of `plugins.load.paths` hebt gewijzigd, herstart je de Gateway die het kanaal bedient voordat je verwacht dat nieuwe `register(api)`-code of hooks worden uitgevoerd. Controleer bij externe/containerdeployments dat je het daadwerkelijke `openclaw gateway run`-childproces herstart, niet alleen een wrapperproces.

`plugins list --json` bevat de `dependencyStatus` van elke plugin uit `package.json`
`dependencies` en `optionalDependencies`. OpenClaw controleert of die pakketnamen
aanwezig zijn langs het normale Node `node_modules`-zoekpad van de plugin; het
importeert geen runtimecode van plugins, voert geen pakketbeheerder uit en herstelt
ontbrekende afhankelijkheden niet.
</Note>

`plugins search` is een externe ClawHub-cataloguszoekopdracht. Het inspecteert de lokale
status niet, wijzigt geen configuratie, installeert geen pakketten en laadt geen runtimecode van plugins. Zoekresultaten bevatten de ClawHub-pakketnaam, familie, kanaal, versie, samenvatting en
een installatietip zoals `openclaw plugins install clawhub:<package>`.

Voor werk aan gebundelde plugins in een verpakte Docker-image bind-mount je de plugin-
brondirectory over het overeenkomende verpakte bronpad, zoals
`/app/extensions/synology-chat`. OpenClaw ontdekt die gemounte bron-
overlay vóór `/app/dist/extensions/synology-chat`; een simpelweg gekopieerde bron-
directory blijft inert, zodat normale verpakte installaties nog steeds de gecompileerde dist gebruiken.

Voor het debuggen van runtime-hooks:

- `openclaw plugins inspect <id> --runtime --json` toont geregistreerde hooks en diagnostiek uit een inspectiepass waarbij de module is geladen. Runtime-inspectie installeert nooit afhankelijkheden; gebruik `openclaw doctor --fix` om verouderde afhankelijkheidsstatus op te ruimen of ontbrekende geconfigureerde downloadbare plugins te installeren.
- `openclaw gateway status --deep --require-rpc` bevestigt de bereikbare Gateway, service-/proceshints, configuratiepad en RPC-status.
- Niet-gebundelde conversatie-hooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) vereisen `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gebruik `--link` om te voorkomen dat een lokale directory wordt gekopieerd (voegt toe aan `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wordt niet ondersteund met `--link`, omdat gekoppelde installaties het bronpad hergebruiken in plaats van over een beheerd installatiedoel heen te kopiëren.

Gebruik `--pin` bij npm-installaties om de opgeloste exacte spec (`name@version`) op te slaan in de beheerde pluginindex, terwijl het standaardgedrag ongepind blijft.
</Note>

### Plugin-index

Plugininstallatiemetadata is door machines beheerde status, geen gebruikersconfiguratie. Installaties en updates schrijven deze naar `plugins/installs.json` onder de actieve OpenClaw-statusdirectory. De top-level `installRecords`-map is de duurzame bron van installatiemetadata, inclusief records voor defecte of ontbrekende pluginmanifests. De `plugins`-array is de uit manifests afgeleide cache voor het koude register. Het bestand bevat een niet-bewerken-waarschuwing en wordt gebruikt door `openclaw plugins update`, verwijderen, diagnostiek en het koude pluginregister.

Wanneer OpenClaw meegeleverde verouderde `plugins.installs`-records in de configuratie ziet, verplaatst het deze naar de pluginindex en verwijdert het de configuratiesleutel; als een van beide schrijfoperaties mislukt, blijven de configuratierecords behouden zodat de installatiemetadata niet verloren gaat.

### Verwijderen

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` verwijdert pluginrecords uit `plugins.entries`, de persistente pluginindex, allow-/deny-lijstvermeldingen van plugins en gekoppelde `plugins.load.paths`-vermeldingen wanneer van toepassing. Tenzij `--keep-files` is ingesteld, verwijdert uninstall ook de bijgehouden beheerde installatiedirectory wanneer die binnen OpenClaw's root voor pluginextensies staat. Voor Active Memory-plugins wordt het memoryslot gereset naar `memory-core`.

<Note>
`--keep-config` wordt ondersteund als verouderde alias voor `--keep-files`.
</Note>

### Bijwerken

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Updates zijn van toepassing op bijgehouden plugininstallaties in de beheerde pluginindex en bijgehouden hook-pack-installaties in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Plugin-id versus npm-spec oplossen">
    Wanneer je een plugin-id doorgeeft, hergebruikt OpenClaw de vastgelegde installatiespec voor die plugin. Dat betekent dat eerder opgeslagen dist-tags zoals `@beta` en exacte gepinde versies bij latere `update <id>`-runs gebruikt blijven worden.

    Voor npm-installaties kun je ook een expliciete npm-pakketspec met een dist-tag of exacte versie doorgeven. OpenClaw herleidt die pakketnaam terug naar het bijgehouden pluginrecord, werkt die geïnstalleerde plugin bij en legt de nieuwe npm-spec vast voor toekomstige updates op basis van id.

    Het doorgeven van de npm-pakketnaam zonder versie of tag wordt ook terug herleid naar het bijgehouden pluginrecord. Gebruik dit wanneer een plugin aan een exacte versie was vastgepind en je deze terug naar de standaard-releaselijn van de registry wilt verplaatsen.

  </Accordion>
  <Accordion title="Updates voor het bètakanaal">
    `openclaw plugins update` hergebruikt de bijgehouden pluginspec tenzij je een nieuwe spec doorgeeft. `openclaw update` kent daarnaast het actieve OpenClaw-updatekanaal: op het bètakanaal proberen npm- en ClawHub-pluginrecords op de standaardlijn eerst `@beta`, en vallen daarna terug op de vastgelegde default/latest-spec als er geen bètarelease voor de plugin bestaat. Exacte versies en expliciete tags blijven aan die selector vastgepind.

  </Accordion>
  <Accordion title="Versiecontroles en integriteitsdrift">
    Voor een live npm-update controleert OpenClaw de geïnstalleerde pakketversie tegen de npm-registrymetadata. Als de geïnstalleerde versie en vastgelegde artifact-identiteit al overeenkomen met het opgeloste doel, wordt de update overgeslagen zonder te downloaden, opnieuw te installeren of `openclaw.json` te herschrijven.

    Wanneer er een opgeslagen integriteitshash bestaat en de opgehaalde artifacthash verandert, behandelt OpenClaw dat als npm-artifactdrift. De interactieve opdracht `openclaw plugins update` print de verwachte en daadwerkelijke hashes en vraagt om bevestiging voordat deze doorgaat. Niet-interactieve updatehelpers falen gesloten tenzij de aanroeper een expliciet vervolgbeleid opgeeft.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install bij update">
    `--dangerously-force-unsafe-install` is ook beschikbaar op `plugins update` als noodoverride voor fout-positieven van de ingebouwde gevaarlijke-code-scan tijdens pluginupdates. Het omzeilt nog steeds geen plugin-`before_install`-beleidsblokkades of blokkering bij scanfouten, en het geldt alleen voor pluginupdates, niet voor hook-pack-updates.
  </Accordion>
</AccordionGroup>

### Inspecteren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspecteren toont identiteit, laadstatus, bron, manifestmogelijkheden, beleidsflags, diagnostiek, installatiemetadata, bundelmogelijkheden en eventuele gedetecteerde MCP- of LSP-serverondersteuning zonder standaard de pluginruntime te importeren. Voeg `--runtime` toe om de pluginmodule te laden en geregistreerde hooks, tools, commando's, services, gatewaymethoden en HTTP-routes op te nemen. Runtime-inspectie rapporteert ontbrekende pluginafhankelijkheden direct; installaties en reparaties blijven in `openclaw plugins install`, `openclaw plugins update` en `openclaw doctor --fix`.

Door plugins beheerde CLI-commando's worden geïnstalleerd als root-`openclaw`-commandogroepen. Nadat `inspect --runtime` een commando onder `cliCommands` toont, voer je het uit als `openclaw <command> ...`; een plugin die `demo-git` registreert, kun je bijvoorbeeld verifiëren met `openclaw demo-git ping`.

Elke plugin wordt geclassificeerd op basis van wat deze daadwerkelijk tijdens runtime registreert:

- **plain-capability** — één capabilitytype (bijv. een plugin die alleen een provider is)
- **hybrid-capability** — meerdere capabilitytypen (bijv. tekst + spraak + afbeeldingen)
- **hook-only** — alleen hooks, geen capabilities of interfaces
- **non-capability** — tools/commando's/services maar geen capabilities

Zie [Plugin-vormen](/nl/plugins/architecture#plugin-shapes) voor meer over het capabilitymodel.

<Note>
De flag `--json` voert een machineleesbaar rapport uit dat geschikt is voor scripting en auditing. `inspect --all` rendert een vlootbrede tabel met vorm, capabilitysoorten, compatibiliteitsmeldingen, bundelmogelijkheden en hooksamenvattingskolommen. `info` is een alias voor `inspect`.
</Note>

### Diagnose

```bash
openclaw plugins doctor
```

`doctor` rapporteert laadfouten van plugins, manifest-/discoverydiagnostiek en compatibiliteitsmeldingen. Wanneer alles schoon is, print het `No plugin issues detected.`

Voor modulevormfouten zoals ontbrekende `register`-/`activate`-exports voer je opnieuw uit met `OPENCLAW_PLUGIN_LOAD_DEBUG=1` om een compacte samenvatting van exportvormen in de diagnostische output op te nemen.

### Register

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Het lokale pluginregister is OpenClaw's persistente koude leesmodel voor geïnstalleerde pluginidentiteit, inschakeling, bronmetadata en eigenaarschap van bijdragen. Normale opstart, lookup van provider-eigenaren, classificatie van kanaalsetup en plugininventaris kunnen het lezen zonder runtime-modules van plugins te importeren.

Gebruik `plugins registry` om te inspecteren of het persistente register aanwezig, actueel of verouderd is. Gebruik `--refresh` om het opnieuw op te bouwen vanuit de persistente pluginindex, configuratiebeleid en manifest-/pakketmetadata. Dit is een herstelpad, geen runtime-activeringspad.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` is een verouderde noodcompatibiliteitsschakelaar voor leesfouten in het register. Geef de voorkeur aan `plugins registry --refresh` of `openclaw doctor --fix`; de env-fallback is alleen bedoeld voor herstel bij noodopstart terwijl de migratie wordt uitgerold.
</Warning>

### Marktplaats

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

De marktplaatslijst accepteert een lokaal marktplaatspad, een `marketplace.json`-pad, een GitHub-afkorting zoals `owner/repo`, een GitHub-repo-URL of een git-URL. `--json` drukt het opgeloste bronlabel af plus het geparsete marktplaatsmanifest en de pluginvermeldingen.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [CLI-referentie](/nl/cli)
- [Communityplugins](/nl/plugins/community)
