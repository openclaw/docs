---
read_when:
    - Je wilt Gateway-plugins of compatibele bundels installeren of beheren
    - Je wilt laadfouten van Plugins debuggen
sidebarTitle: Plugins
summary: CLI-referentie voor `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-10T19:29:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6afa3ff12b3672d321d16c831672340ccde70b153671f2c328f578b5c66348b
    source_path: cli/plugins.md
    workflow: 16
---

Beheer Gateway-plugins, hook-packs en compatibele bundels.

<CardGroup cols={2}>
  <Card title="Plugin-systeem" href="/nl/tools/plugin">
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
    Beveiligingshardening voor plugin-installaties.
  </Card>
</CardGroup>

## Commando's

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

Voor onderzoek naar trage installatie, inspectie, verwijdering of registry-vernieuwing voer je het
commando uit met `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. De trace schrijft fasetimings
naar stderr en houdt JSON-uitvoer parseerbaar. Zie [Debuggen](/nl/help/debugging#plugin-lifecycle-trace).

<Note>
In Nix-modus (`OPENCLAW_NIX_MODE=1`) zijn mutators voor de plugin-levenscyclus uitgeschakeld. Gebruik voor deze installatie de Nix-bron in plaats van `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` of `plugins disable`; gebruik voor nix-openclaw de agent-first [Snelstart](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Meegeleverde plugins worden met OpenClaw geleverd. Sommige zijn standaard ingeschakeld (bijvoorbeeld meegeleverde modelproviders, meegeleverde spraakproviders en de meegeleverde browserplugin); andere vereisen `plugins enable`.

Native OpenClaw-plugins moeten `openclaw.plugin.json` leveren met een inline JSON Schema (`configSchema`, zelfs als het leeg is). Compatibele bundels gebruiken in plaats daarvan hun eigen bundelmanifesten.

`plugins list` toont `Format: openclaw` of `Format: bundle`. Uitvoer van uitgebreide lijsten/info toont ook het bundel-subtype (`codex`, `claude` of `cursor`) plus gedetecteerde bundelcapaciteiten.
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

Maintainers die installaties tijdens setup testen, kunnen automatische plugin-installatiebronnen
overschrijven met bewaakte omgevingsvariabelen. Zie
[Overschrijvingen voor plugin-installatie](/plugins/install-overrides).

<Warning>
Kale pakketnamen installeren tijdens de launch-cutover standaard vanuit npm. Gebruik `clawhub:<package>` voor ClawHub. Behandel plugin-installaties alsof je code uitvoert. Geef de voorkeur aan vastgepinde versies.
</Warning>

`plugins search` bevraagt ClawHub op installeerbare plugin-pakketten en drukt
pakketnamen af die klaar zijn voor installatie. Het doorzoekt code-plugin- en bundle-plugin-pakketten,
geen skills. Gebruik `openclaw skills search` voor ClawHub-skills.

<Note>
ClawHub is het primaire distributie- en ontdekkingsoppervlak voor de meeste plugins. Npm
blijft een ondersteunde fallback en direct-installatiepad. Plugin-pakketten van OpenClaw
`@openclaw/*` worden weer op npm gepubliceerd; zie de huidige lijst
op [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) of de
[plugin-inventaris](/nl/plugins/plugin-inventory). Stabiele installaties gebruiken `latest`.
Installaties en updates in het bètakanaal geven de voorkeur aan de npm `beta` dist-tag wanneer die tag
beschikbaar is, en vallen daarna terug op `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config-includes en reparatie van ongeldige configuratie">
    Als je `plugins`-sectie wordt ondersteund door een single-file `$include`, schrijven `plugins install/update/enable/disable/uninstall` door naar dat included bestand en laten ze `openclaw.json` ongemoeid. Root-includes, include-arrays en includes met sibling-overrides falen gesloten in plaats van te flattenen. Zie [Config-includes](/nl/gateway/configuration) voor de ondersteunde vormen.

    Als de configuratie ongeldig is tijdens installatie, faalt `plugins install` normaal gesproken gesloten en wordt je gevraagd eerst `openclaw doctor --fix` uit te voeren. Tijdens het opstarten en hot reloaden van de Gateway faalt ongeldige plugin-configuratie gesloten zoals elke andere ongeldige configuratie; `openclaw doctor --fix` kan de ongeldige plugin-vermelding in quarantaine plaatsen. De enige gedocumenteerde uitzondering tijdens installatie is een smal herstelpad voor meegeleverde plugins voor plugins die expliciet kiezen voor `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force en opnieuw installeren versus bijwerken">
    `--force` hergebruikt het bestaande installatiedoel en overschrijft een al geinstalleerde plugin of hook-pack ter plaatse. Gebruik dit wanneer je bewust dezelfde id opnieuw installeert vanuit een nieuw lokaal pad, archief, ClawHub-pakket of npm-artefact. Voor routinematige upgrades van een al gevolgde npm-plugin geef je de voorkeur aan `openclaw plugins update <id-or-npm-spec>`.

    Als je `plugins install` uitvoert voor een plugin-id die al is geinstalleerd, stopt OpenClaw en verwijst het je naar `plugins update <id-or-npm-spec>` voor een normale upgrade, of naar `plugins install <package> --force` wanneer je de huidige installatie echt vanuit een andere bron wilt overschrijven.

  </Accordion>
  <Accordion title="--pin-scope">
    `--pin` geldt alleen voor npm-installaties. Het wordt niet ondersteund met `git:`-installaties; gebruik een expliciete git-ref zoals `git:github.com/acme/plugin@v1.2.3` wanneer je een vastgepinde bron wilt. Het wordt niet ondersteund met `--marketplace`, omdat marketplace-installaties marketplace-bronmetadata bewaren in plaats van een npm-spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` is een break-glass-optie voor fout-positieven in de ingebouwde scanner voor gevaarlijke code. Hiermee kan de installatie doorgaan, zelfs wanneer de ingebouwde scanner `critical`-bevindingen rapporteert, maar het omzeilt **niet** beleidsblokkades van plugin-`before_install`-hooks en omzeilt **geen** scanfouten.

    Deze CLI-flag geldt voor plugin-installatie-/updateflows. Door de Gateway ondersteunde installaties van skill-afhankelijkheden gebruiken de bijpassende aanvraagoverride `dangerouslyForceUnsafeInstall`, terwijl `openclaw skills install` een aparte download-/installatieflow voor ClawHub-skills blijft.

    Als een plugin die je op ClawHub hebt gepubliceerd wordt geblokkeerd door een registryscan, gebruik dan de publisherstappen in [ClawHub](/nl/clawhub/security).

  </Accordion>
  <Accordion title="Hook-packs en npm-specs">
    `plugins install` is ook het installatieoppervlak voor hook-packs die `openclaw.hooks` in `package.json` blootstellen. Gebruik `openclaw hooks` voor gefilterde zichtbaarheid van hooks en inschakeling per hook, niet voor pakketinstallatie.

    Npm-specs zijn **alleen registry** (pakketnaam + optionele **exacte versie** of **dist-tag**). Git-/URL-/file-specs en semver-ranges worden geweigerd. Afhankelijkheidsinstallaties worden projectlokaal uitgevoerd met `--ignore-scripts` voor veiligheid, zelfs wanneer je shell globale npm-installatie-instellingen heeft. Beheerde npm-roots voor plugins erven OpenClaw's npm-`overrides` op pakketniveau, zodat hostbeveiligingspinnen ook gelden voor gehoste plugin-afhankelijkheden.

    Gebruik `npm:<package>` wanneer je npm-resolutie expliciet wilt maken. Kale pakketspecs installeren tijdens de launch-cutover ook direct vanuit npm.

    Kale specs en `@latest` blijven op het stabiele spoor. OpenClaw-correctieversies met datumstempel zoals `2026.5.3-1` zijn stabiele releases voor deze controle. Als npm een van beide naar een prerelease resolveert, stopt OpenClaw en vraagt het je expliciet in te stemmen met een prerelease-tag zoals `@beta`/`@rc` of een exacte prereleaseversie zoals `@1.2.3-beta.4`.

    Als een kale installatiespec overeenkomt met een officiele plugin-id (bijvoorbeeld `diffs`), installeert OpenClaw de catalogusvermelding direct. Gebruik een expliciete scoped spec (bijvoorbeeld `@scope/diffs`) om een npm-pakket met dezelfde naam te installeren.

  </Accordion>
  <Accordion title="Git-repositories">
    Gebruik `git:<repo>` om direct vanuit een git-repository te installeren. Ondersteunde vormen zijn onder andere `git:github.com/owner/repo`, `git:owner/repo`, volledige `https://`-, `ssh://`-, `git://`-, `file://`- en `git@host:owner/repo.git`-clone-URL's. Voeg `@<ref>` of `#<ref>` toe om voor installatie een branch, tag of commit uit te checken.

    Git-installaties clonen naar een tijdelijke directory, checken de gevraagde ref uit wanneer die aanwezig is, en gebruiken daarna de normale installer voor plugin-directories. Dat betekent dat manifestvalidatie, scannen op gevaarlijke code, installatiewerk van package managers en installatierecords zich gedragen zoals bij npm-installaties. Vastgelegde git-installaties bevatten de bron-URL/ref plus de opgeloste commit zodat `openclaw plugins update` de bron later opnieuw kan resolven.

    Gebruik na installatie vanuit git `openclaw plugins inspect <id> --runtime --json` om runtimeregistraties te verifieren, zoals gateway-methoden en CLI-commando's. Als de plugin een CLI-root heeft geregistreerd met `api.registerCli`, voer dat commando dan rechtstreeks uit via de OpenClaw-root-CLI, bijvoorbeeld `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archieven">
    Ondersteunde archieven: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-pluginarchieven moeten een geldig `openclaw.plugin.json` bevatten in de uitgepakte plugin-root; archieven die alleen `package.json` bevatten, worden geweigerd voordat OpenClaw installatierecords schrijft.

    Gebruik `npm-pack:<path.tgz>` wanneer het bestand een npm-pack-tarball is en je
    hetzelfde beheerde npm-root-installatiepad wilt testen dat door registry-installaties wordt gebruikt,
    inclusief `package-lock.json`-verificatie, scannen van gehoste afhankelijkheden en
    npm-installatierecords. Platte archiefpaden installeren nog steeds als lokale archieven
    onder de plugin-extensieroot.

    Claude-marketplace-installaties worden ook ondersteund.

  </Accordion>
</AccordionGroup>

ClawHub-installaties gebruiken een expliciete `clawhub:<package>`-locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Kale npm-veilige plugin-specs installeren tijdens de launch-cutover standaard vanuit npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gebruik `npm:` om npm-only-resolutie expliciet te maken:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controleert de geadverteerde plugin-API / minimale Gateway-compatibiliteit vóór installatie. Wanneer de geselecteerde ClawHub-versie een ClawPack-artefact publiceert, downloadt OpenClaw de geversioneerde npm-pack `.tgz`, verifieert het de ClawHub-digestheader en de artefactdigest, en installeert het dit vervolgens via het normale archiefpad. Oudere ClawHub-versies zonder ClawPack-metadata installeren nog steeds via het verouderde verificatiepad voor pakketarchieven. Vastgelegde installaties behouden hun ClawHub-bronmetadata, artefactsoort, npm-integriteit, npm-shasum, tarballnaam en ClawPack-digestfeiten voor latere updates.
Ongeversioneerde ClawHub-installaties behouden een ongeversioneerde vastgelegde specificatie zodat `openclaw plugins update` nieuwere ClawHub-releases kan volgen; expliciete versie- of tagselectoren zoals `clawhub:pkg@1.2.3` en `clawhub:pkg@beta` blijven aan die selector vastgezet.

#### Marketplace-afkorting

Gebruik de afkorting `plugin@marketplace` wanneer de marketplacenaam bestaat in Claude's lokale registercache op `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Gebruik `--marketplace` wanneer je de marketplacebron expliciet wilt meegeven:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - een Claude-naam voor een bekende marketplace uit `~/.claude/plugins/known_marketplaces.json`
    - een lokale marketplace-root of `marketplace.json`-pad
    - een GitHub-repoafkorting zoals `owner/repo`
    - een GitHub-repo-URL zoals `https://github.com/owner/repo`
    - een git-URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Voor externe marketplaces die vanuit GitHub of git worden geladen, moeten pluginvermeldingen binnen de gekloonde marketplace-repo blijven. OpenClaw accepteert relatieve padbronnen uit die repo en wijst HTTP(S), absolute paden, git, GitHub en andere niet-pad-pluginbronnen uit externe manifests af.
  </Tab>
</Tabs>

Voor lokale paden en archieven detecteert OpenClaw automatisch:

- native OpenClaw-plugins (`openclaw.plugin.json`)
- Codex-compatibele bundels (`.codex-plugin/plugin.json`)
- Claude-compatibele bundels (`.claude-plugin/plugin.json` of de standaard Claude-componentindeling)
- Cursor-compatibele bundels (`.cursor-plugin/plugin.json`)

<Note>
Compatibele bundels worden in de normale plugin-root geïnstalleerd en nemen deel aan dezelfde list/info/enable/disable-stroom. Momenteel worden bundel-Skills, Claude command-skills, Claude `settings.json`-standaarden, Claude `.lsp.json` / manifest-gedeclareerde `lspServers`-standaarden, Cursor command-skills en compatibele Codex-hookmappen ondersteund; andere gedetecteerde bundelmogelijkheden worden getoond in diagnostiek/info maar zijn nog niet gekoppeld aan runtime-uitvoering.
</Note>

### Weergeven

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
  Schakel over van de tabelweergave naar detailregels per plugin met metadata over bron/oorsprong/versie/activatie.
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare inventaris plus registerdiagnostiek en installatiestatus van pakketafhankelijkheden.
</ParamField>

<Note>
`plugins list` leest eerst het persistente lokale pluginregister, met een alleen-van-manifest-afgeleide fallback wanneer het register ontbreekt of ongeldig is. Dit is nuttig om te controleren of een plugin is geïnstalleerd, ingeschakeld en zichtbaar is voor koude opstartplanning, maar het is geen live runtime-probe van een al draaiend Gateway-proces. Nadat je plugincode, inschakeling, hookbeleid of `plugins.load.paths` hebt gewijzigd, herstart je de Gateway die het kanaal bedient voordat je verwacht dat nieuwe `register(api)`-code of hooks worden uitgevoerd. Controleer voor externe/containerdeployments dat je het daadwerkelijke `openclaw gateway run`-child herstart, niet alleen een wrapperproces.

`plugins list --json` bevat de `dependencyStatus` van elke plugin uit `package.json`
`dependencies` en `optionalDependencies`. OpenClaw controleert of die pakketnamen aanwezig zijn langs het normale Node `node_modules`-zoekpad van de plugin; het
importeert geen plugin-runtimecode, voert geen pakketbeheerder uit en repareert geen
ontbrekende afhankelijkheden.
</Note>

`plugins search` is een externe ClawHub-cataloguszoekopdracht. Het inspecteert geen lokale
staat, wijzigt geen config, installeert geen pakketten en laadt geen plugin-runtimecode. Zoekresultaten
bevatten de ClawHub-pakketnaam, familie, kanaal, versie, samenvatting en
een installatietip zoals `openclaw plugins install clawhub:<package>`.

Voor werk aan gebundelde plugins binnen een verpakte Docker-image bind-mount je de plugin-
bronmap over het overeenkomende verpakte bronpad, zoals
`/app/extensions/synology-chat`. OpenClaw ontdekt die aangekoppelde bron-
overlay vóór `/app/dist/extensions/synology-chat`; een gewone gekopieerde bron-
map blijft inert zodat normale verpakte installaties nog steeds de gecompileerde dist gebruiken.

Voor debuggen van runtime-hooks:

- `openclaw plugins inspect <id> --runtime --json` toont geregistreerde hooks en diagnostiek uit een inspectiepass waarbij de module is geladen. Runtime-inspectie installeert nooit afhankelijkheden; gebruik `openclaw doctor --fix` om verouderde afhankelijkheidsstaat op te schonen of ontbrekende downloadbare plugins te herstellen waarnaar door config wordt verwezen.
- `openclaw gateway status --deep --require-rpc` bevestigt de bereikbare Gateway, service-/proceshints, configpad en RPC-gezondheid.
- Niet-gebundelde conversatiehooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) vereisen `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gebruik `--link` om het kopiëren van een lokale map te vermijden (voegt toe aan `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wordt niet ondersteund met `--link` omdat gekoppelde installaties het bronpad hergebruiken in plaats van over een beheerd installatiedoel heen te kopiëren.

Gebruik `--pin` bij npm-installaties om de opgeloste exacte specificatie (`name@version`) op te slaan in de beheerde pluginindex, terwijl het standaardgedrag niet-vastgezet blijft.
</Note>

### Pluginindex

Metadata van plugininstallaties is machinebeheerde staat, geen gebruikersconfig. Installaties en updates schrijven dit naar `plugins/installs.json` onder de actieve OpenClaw-statusmap. De top-level `installRecords`-map is de duurzame bron van installatiemetadata, inclusief records voor kapotte of ontbrekende pluginmanifests. De `plugins`-array is de van manifests afgeleide koude registercache. Het bestand bevat een waarschuwing om het niet te bewerken en wordt gebruikt door `openclaw plugins update`, verwijderen, diagnostiek en het koude pluginregister.

Wanneer OpenClaw meegeleverde verouderde `plugins.installs`-records in config ziet, behandelen runtime-reads deze als compatibiliteitsinput zonder `openclaw.json` te herschrijven. Expliciete pluginwrites en `openclaw doctor --fix` verplaatsen die records naar de pluginindex en verwijderen de configsleutel wanneer configwrites zijn toegestaan; als een van beide writes mislukt, blijven de configrecords behouden zodat de installatiemetadata niet verloren gaat.

### Verwijderen

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` verwijdert pluginrecords uit `plugins.entries`, de persistente pluginindex, plugin-allow/deny-list-vermeldingen en gekoppelde `plugins.load.paths`-vermeldingen waar van toepassing. Tenzij `--keep-files` is ingesteld, verwijdert uninstall ook de bijgehouden beheerde installatiemap wanneer die zich binnen de plugin-extensions-root van OpenClaw bevindt. Voor Active Memory-plugins wordt het geheugenslot teruggezet naar `memory-core`.

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

Updates zijn van toepassing op bijgehouden plugininstallaties in de beheerde pluginindex en bijgehouden hook-pack-installaties in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Wanneer je een plugin-id doorgeeft, hergebruikt OpenClaw de vastgelegde installatiespecificatie voor die plugin. Dat betekent dat eerder opgeslagen dist-tags zoals `@beta` en exacte vastgezette versies gebruikt blijven worden bij latere `update <id>`-runs.

    Voor npm-installaties kun je ook een expliciete npm-pakketspecificatie met een dist-tag of exacte versie doorgeven. OpenClaw herleidt die pakketnaam naar het bijgehouden pluginrecord, werkt die geïnstalleerde plugin bij en legt de nieuwe npm-specificatie vast voor toekomstige id-gebaseerde updates.

    Het doorgeven van de npm-pakketnaam zonder versie of tag wordt ook teruggeleid naar het bijgehouden pluginrecord. Gebruik dit wanneer een plugin aan een exacte versie was vastgezet en je deze terug wilt verplaatsen naar de standaard releaselijn van het register.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` hergebruikt de bijgehouden pluginspecificatie tenzij je een nieuwe specificatie doorgeeft. `openclaw update` kent daarnaast het actieve OpenClaw-updatekanaal: op het bètakanaal proberen standaardlijn-npm- en ClawHub-pluginrecords eerst `@beta`, en vallen daarna terug op de vastgelegde default/latest-specificatie als er geen plugin-bètarelease bestaat. Exacte versies en expliciete tags blijven vastgezet aan die selector.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Vóór een live npm-update controleert OpenClaw de geïnstalleerde pakketversie tegen de metadata van het npm-register. Als de geïnstalleerde versie en vastgelegde artefactidentiteit al overeenkomen met het opgeloste doel, wordt de update overgeslagen zonder te downloaden, opnieuw te installeren of `openclaw.json` te herschrijven.

    Wanneer er een opgeslagen integriteitshash bestaat en de opgehaalde artefacthash verandert, behandelt OpenClaw dat als npm-artefactdrift. De interactieve opdracht `openclaw plugins update` drukt de verwachte en daadwerkelijke hashes af en vraagt om bevestiging voordat wordt doorgegaan. Niet-interactieve updatehelpers falen gesloten tenzij de aanroeper een expliciet vervolgbeleid opgeeft.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` is ook beschikbaar op `plugins update` als break-glass-override voor fout-positieven in de ingebouwde gevaarlijke-code-scan tijdens pluginupdates. Het omzeilt nog steeds geen plugin-`before_install`-beleidsblokkades of blokkering door scanfouten, en is alleen van toepassing op pluginupdates, niet op hook-pack-updates.
  </Accordion>
</AccordionGroup>

### Inspecteren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect toont identiteit, laadstatus, bron, manifestmogelijkheden, beleidsvlaggen, diagnostiek, installatiemetadata, bundelmogelijkheden en eventuele gedetecteerde MCP- of LSP-serverondersteuning zonder standaard plugin-runtime te importeren. Voeg `--runtime` toe om de pluginmodule te laden en geregistreerde hooks, tools, opdrachten, services, Gateway-methoden en HTTP-routes op te nemen. Runtime-inspectie rapporteert ontbrekende pluginafhankelijkheden direct; installaties en reparaties blijven in `openclaw plugins install`, `openclaw plugins update` en `openclaw doctor --fix`.

CLI-opdrachten die eigendom zijn van plugins worden meestal geïnstalleerd als root-`openclaw`-opdrachtgroepen, maar plugins kunnen ook geneste opdrachten registreren onder een core-parent zoals `openclaw nodes`. Nadat `inspect --runtime` een opdracht onder `cliCommands` toont, voer je deze uit op het vermelde pad; een plugin die bijvoorbeeld `demo-git` registreert, kan worden geverifieerd met `openclaw demo-git ping`.

Elke plugin wordt geclassificeerd op basis van wat deze daadwerkelijk registreert tijdens runtime:

- **plain-capability** — één capability-type (bijv. een Plugin met alleen een provider)
- **hybrid-capability** — meerdere capability-typen (bijv. tekst + spraak + afbeeldingen)
- **hook-only** — alleen hooks, geen capabilities of oppervlakken
- **non-capability** — tools/opdrachten/services maar geen capabilities

Zie [Plugin-vormen](/nl/plugins/architecture#plugin-shapes) voor meer over het capability-model.

<Note>
De vlag `--json` geeft een machineleesbaar rapport uit dat geschikt is voor scripting en auditing. `inspect --all` rendert een tabel voor de hele vloot met kolommen voor vorm, capability-soorten, compatibiliteitsmeldingen, bundel-capabilities en een hooksamenvatting. `info` is een alias voor `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` rapporteert laadfouten van Plugins, diagnostiek voor manifest/discovery en compatibiliteitsmeldingen. Wanneer alles schoon is, drukt het `No plugin issues detected.` af.

Als een geconfigureerde Plugin op schijf aanwezig is maar wordt geblokkeerd door de padveiligheidscontroles van de loader, behoudt configvalidatie de Plugin-vermelding en rapporteert die als `present but blocked`. Los de voorafgaande diagnostiek voor de geblokkeerde Plugin op, zoals padeigendom of wereldwijd schrijfbare machtigingen, in plaats van de configuratie `plugins.entries.<id>` of `plugins.allow` te verwijderen.

Voor fouten in modulevormen zoals ontbrekende exports `register`/`activate`, voer opnieuw uit met `OPENCLAW_PLUGIN_LOAD_DEBUG=1` om een compacte samenvatting van de exportvorm op te nemen in de diagnostische uitvoer.

### Register

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Het lokale Plugin-register is OpenClaw's persistente cold-readmodel voor geïnstalleerde Plugin-identiteit, inschakeling, bronmetadata en eigenaarschap van bijdragen. Normaal opstarten, het opzoeken van providereigenaars, classificatie van kanaalconfiguratie en Plugin-inventarisatie kunnen het lezen zonder Plugin-runtime-modules te importeren.

Gebruik `plugins registry` om te inspecteren of het persistente register aanwezig, actueel of verouderd is. Gebruik `--refresh` om het opnieuw op te bouwen vanuit de persistente Plugin-index, het configuratiebeleid en manifest-/pakketmetadata. Dit is een herstelpad, geen runtime-activeringspad.

`openclaw doctor --fix` herstelt ook beheerde npm-afwijkingen rond het register: als een verweesd of hersteld `@openclaw/*`-pakket onder de beheerde Plugin-npm-root een gebundelde Plugin overschaduwt, verwijdert doctor dat verouderde pakket en bouwt het register opnieuw op, zodat het opstarten tegen het gebundelde manifest valideert.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` is een verouderde break-glass-compatibiliteitsschakelaar voor leesfouten van het register. Geef de voorkeur aan `plugins registry --refresh` of `openclaw doctor --fix`; de env-fallback is alleen bedoeld voor noodherstel bij opstarten terwijl de migratie wordt uitgerold.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list accepteert een lokaal marketplace-pad, een `marketplace.json`-pad, een GitHub-shorthand zoals `owner/repo`, een GitHub-repo-URL of een git-URL. `--json` drukt het opgeloste bronlabel af plus het geparste marketplace-manifest en de Plugin-vermeldingen.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [CLI-referentie](/nl/cli)
- [ClawHub](/nl/clawhub)
