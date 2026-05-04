---
read_when:
    - Je wilt Gateway-plugins of compatibele bundels installeren of beheren
    - Je wilt fouten bij het laden van Plugins debuggen
sidebarTitle: Plugins
summary: CLI-referentie voor `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-04T09:36:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: f561ce098181b07f25db3520b1726162863469ac05fb4a3e786915257d97c9a4
    source_path: cli/plugins.md
    workflow: 16
---

Beheer Gateway-plugins, hook packs en compatibele bundels.

<CardGroup cols={2}>
  <Card title="Plugin-systeem" href="/nl/tools/plugin">
    Eindgebruikersgids voor het installeren, inschakelen en oplossen van problemen met plugins.
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

Voor onderzoek naar trage installatie, inspectie, verwijdering of registry-refresh voer je de
opdracht uit met `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. De trace schrijft fasetimings
naar stderr en houdt JSON-uitvoer parseerbaar. Zie [Debugging](/nl/help/debugging#plugin-lifecycle-trace).

<Note>
Gebundelde plugins worden met OpenClaw meegeleverd. Sommige zijn standaard ingeschakeld (bijvoorbeeld gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browserplugin); andere vereisen `plugins enable`.

Native OpenClaw-plugins moeten `openclaw.plugin.json` leveren met een inline JSON Schema (`configSchema`, zelfs als dit leeg is). Compatibele bundels gebruiken in plaats daarvan hun eigen bundelmanifests.

`plugins list` toont `Format: openclaw` of `Format: bundle`. Uitgebreide list/info-uitvoer toont ook het bundelsubtype (`codex`, `claude` of `cursor`) plus gedetecteerde bundelmogelijkheden.
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
Kale pakketnamen installeren tijdens de launch-cutover standaard vanuit npm. Gebruik `clawhub:<package>` voor ClawHub. Behandel plugin-installaties als het uitvoeren van code. Geef de voorkeur aan vastgepinde versies.
</Warning>

`plugins search` doorzoekt ClawHub naar installeerbare plugin-pakketten en drukt
installatieklare pakketnamen af. Het zoekt naar code-plugin- en bundle-plugin-pakketten,
niet naar skills. Gebruik `openclaw skills search` voor ClawHub-skills.

<Note>
ClawHub is het primaire distributie- en ontdekkingsoppervlak voor de meeste plugins. Npm
blijft een ondersteunde fallback en direct-installatiepad. Plugin-pakketten in eigendom van OpenClaw
`@openclaw/*` worden weer op npm gepubliceerd; zie de huidige lijst
op [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) of de
[plugin-inventaris](/nl/plugins/plugin-inventory). Stabiele installaties gebruiken `latest`.
Installaties en updates via het betakanaal geven de voorkeur aan de npm `beta` dist-tag wanneer die tag
beschikbaar is, en vallen daarna terug op `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config-includes en herstel van ongeldige config">
    Als je `plugins`-sectie wordt ondersteund door een single-file `$include`, schrijven `plugins install/update/enable/disable/uninstall` door naar dat included bestand en laten ze `openclaw.json` ongemoeid. Root-includes, include-arrays en includes met sibling-overrides falen gesloten in plaats van te flattenen. Zie [Config-includes](/nl/gateway/configuration) voor de ondersteunde vormen.

    Als de config ongeldig is tijdens installatie, faalt `plugins install` normaal gesproken gesloten en zegt het dat je eerst `openclaw doctor --fix` moet uitvoeren. Tijdens het opstarten en hot reloaden van de Gateway faalt ongeldige plugin-config gesloten zoals elke andere ongeldige config; `openclaw doctor --fix` kan de ongeldige plugin-entry in quarantaine plaatsen. De enige gedocumenteerde uitzondering tijdens installatie is een smal herstelpad voor gebundelde plugins voor plugins die expliciet kiezen voor `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force en opnieuw installeren versus update">
    `--force` hergebruikt het bestaande installatiedoel en overschrijft een al geïnstalleerde plugin of hook pack op zijn plek. Gebruik dit wanneer je bewust dezelfde id opnieuw installeert vanuit een nieuw lokaal pad, archief, ClawHub-pakket of npm-artefact. Voor routinematige upgrades van een al bijgehouden npm-plugin geef je de voorkeur aan `openclaw plugins update <id-or-npm-spec>`.

    Als je `plugins install` uitvoert voor een plugin-id die al is geïnstalleerd, stopt OpenClaw en verwijst het je naar `plugins update <id-or-npm-spec>` voor een normale upgrade, of naar `plugins install <package> --force` wanneer je de huidige installatie echt wilt overschrijven vanuit een andere bron.

  </Accordion>
  <Accordion title="Bereik van --pin">
    `--pin` geldt alleen voor npm-installaties. Het wordt niet ondersteund met `git:`-installaties; gebruik een expliciete git-ref zoals `git:github.com/acme/plugin@v1.2.3` wanneer je een vastgepinde bron wilt. Het wordt niet ondersteund met `--marketplace`, omdat marketplace-installaties marketplace-bronmetadata bewaren in plaats van een npm-spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` is een break-glass-optie voor foutpositieven in de ingebouwde scanner voor gevaarlijke code. Hiermee kan de installatie doorgaan, zelfs wanneer de ingebouwde scanner `critical`-bevindingen rapporteert, maar het omzeilt **niet** de beleidsblokkades van plugin-`before_install`-hooks en omzeilt **niet** scanfouten.

    Deze CLI-vlag is van toepassing op plugin install/update-flows. Door de Gateway ondersteunde installaties van skill-afhankelijkheden gebruiken de overeenkomende request-override `dangerouslyForceUnsafeInstall`, terwijl `openclaw skills install` een afzonderlijke ClawHub-skill-download/install-flow blijft.

    Als een plugin die je op ClawHub hebt gepubliceerd wordt geblokkeerd door een registryscan, gebruik dan de publisher-stappen in [ClawHub](/nl/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs en npm-specs">
    `plugins install` is ook het installatieoppervlak voor hook packs die `openclaw.hooks` in `package.json` blootstellen. Gebruik `openclaw hooks` voor gefilterde hook-zichtbaarheid en inschakeling per hook, niet voor pakketinstallatie.

    Npm-specs zijn **alleen registry** (pakketnaam + optionele **exacte versie** of **dist-tag**). Git/URL/file-specs en semver-ranges worden geweigerd. Afhankelijkheidsinstallaties draaien projectlokaal met `--ignore-scripts` voor veiligheid, zelfs wanneer je shell globale npm-installatie-instellingen heeft.

    Gebruik `npm:<package>` wanneer je npm-resolutie expliciet wilt maken. Kale pakketspecs installeren tijdens de launch-cutover ook rechtstreeks vanuit npm.

    Kale specs en `@latest` blijven op het stabiele spoor. OpenClaw-datumgestempelde correctieversies zoals `2026.5.3-1` zijn stabiele releases voor deze check. Als npm een van deze naar een prerelease resolveert, stopt OpenClaw en vraagt het je om expliciet in te stappen met een prerelease-tag zoals `@beta`/`@rc` of een exacte prerelease-versie zoals `@1.2.3-beta.4`.

    Als een kale installatiespec overeenkomt met een officiële plugin-id (bijvoorbeeld `diffs`), installeert OpenClaw de catalogusentry rechtstreeks. Gebruik een expliciete scoped spec (bijvoorbeeld `@scope/diffs`) om een npm-pakket met dezelfde naam te installeren.

  </Accordion>
  <Accordion title="Git-repositories">
    Gebruik `git:<repo>` om rechtstreeks vanuit een git-repository te installeren. Ondersteunde vormen zijn onder andere `git:github.com/owner/repo`, `git:owner/repo`, volledige `https://`-, `ssh://`-, `git://`-, `file://`- en `git@host:owner/repo.git`-clone-URL's. Voeg `@<ref>` of `#<ref>` toe om een branch, tag of commit uit te checken vóór installatie.

    Git-installaties clonen naar een tijdelijke directory, checken de gevraagde ref uit wanneer aanwezig, en gebruiken daarna de normale installateur voor plugin-directories. Dat betekent dat manifestvalidatie, scanning op gevaarlijke code, package-manager-installatiewerk en installatierecords zich gedragen zoals bij npm-installaties. Vastgelegde git-installaties bevatten de bron-URL/ref plus de opgeloste commit, zodat `openclaw plugins update` de bron later opnieuw kan resolven.

    Gebruik na installatie vanuit git `openclaw plugins inspect <id> --runtime --json` om runtimeregistraties zoals gateway-methoden en CLI-opdrachten te verifiëren. Als de plugin een CLI-root heeft geregistreerd met `api.registerCli`, voer die opdracht dan rechtstreeks uit via de OpenClaw-root-CLI, bijvoorbeeld `openclaw demo-plugin ping`.

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

Kale npm-veilige plugin-specs installeren tijdens de launch-cutover standaard vanuit npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gebruik `npm:` om npm-only-resolutie expliciet te maken:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controleert de geadverteerde plugin-API / minimale gateway-compatibiliteit vóór installatie. Wanneer de geselecteerde ClawHub-versie een ClawPack-artefact publiceert, downloadt OpenClaw de geversioneerde npm-pack `.tgz`, verifieert het de ClawHub-digestheader en de artefactdigest, en installeert het die daarna via het normale archiefpad. Oudere ClawHub-versies zonder ClawPack-metadata installeren nog steeds via het legacy-verificatiepad voor pakketarchieven. Vastgelegde installaties behouden hun ClawHub-bronmetadata, artefactsoort, npm-integriteit, npm-shasum, tarballnaam en ClawPack-digestfeiten voor latere updates.
Ongeversioneerde ClawHub-installaties behouden een ongeversioneerde vastgelegde spec zodat `openclaw plugins update` nieuwere ClawHub-releases kan volgen; expliciete versie- of tagselectoren zoals `clawhub:pkg@1.2.3` en `clawhub:pkg@beta` blijven vastgepind op die selector.

#### Marketplace-shorthand

Gebruik `plugin@marketplace`-shorthand wanneer de marketplace-naam bestaat in Claude's lokale registry-cache op `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="Marketplace sources">
    - een bekende Claude-marketplacenaam uit `~/.claude/plugins/known_marketplaces.json`
    - een lokale marketplace-root of pad naar `marketplace.json`
    - een GitHub-repoverkorting zoals `owner/repo`
    - een GitHub-repo-URL zoals `https://github.com/owner/repo`
    - een git-URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Voor externe marketplaces die vanuit GitHub of git worden geladen, moeten pluginvermeldingen binnen de gekloonde marketplace-repo blijven. OpenClaw accepteert relatieve padbronnen uit die repo en weigert HTTP(S), absolute paden, git, GitHub en andere niet-padgebonden pluginbronnen uit externe manifests.
  </Tab>
</Tabs>

Voor lokale paden en archieven detecteert OpenClaw automatisch:

- native OpenClaw-plugins (`openclaw.plugin.json`)
- Codex-compatibele bundels (`.codex-plugin/plugin.json`)
- Claude-compatibele bundels (`.claude-plugin/plugin.json` of de standaard Claude-componentindeling)
- Cursor-compatibele bundels (`.cursor-plugin/plugin.json`)

<Note>
Compatibele bundels worden in de normale pluginroot geïnstalleerd en doen mee aan dezelfde list/info/enable/disable-flow. Momenteel worden bundelvaardigheden, Claude-command-skills, standaardwaarden uit Claude `settings.json`, standaardwaarden uit Claude `.lsp.json` / in het manifest gedeclareerde `lspServers`, Cursor-command-skills en compatibele Codex-hookdirectories ondersteund; andere gedetecteerde bundelmogelijkheden worden getoond in diagnostics/info, maar zijn nog niet aangesloten op runtime-uitvoering.
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
  Schakel over van de tabelweergave naar detailregels per plugin met metadata over bron/oorsprong/versie/activatie.
</ParamField>
<ParamField path="--json" type="boolean">
  Machinaal leesbare inventaris plus registry-diagnostics en installatiestatus van packageafhankelijkheden.
</ParamField>

<Note>
`plugins list` leest eerst de blijvend opgeslagen lokale pluginregistry, met een manifest-only afgeleide fallback wanneer de registry ontbreekt of ongeldig is. Dit is nuttig om te controleren of een plugin is geïnstalleerd, ingeschakeld en zichtbaar is voor cold-startupplanning, maar het is geen live runtime-probe van een al draaiend Gateway-proces. Start na het wijzigen van plugincode, inschakeling, hookbeleid of `plugins.load.paths` de Gateway opnieuw die het kanaal bedient voordat je verwacht dat nieuwe `register(api)`-code of hooks worden uitgevoerd. Controleer bij externe/containerdeployments dat je het daadwerkelijke `openclaw gateway run`-childproces opnieuw start, niet alleen een wrapperproces.

`plugins list --json` bevat per plugin de `dependencyStatus` uit `package.json`
`dependencies` en `optionalDependencies`. OpenClaw controleert of die packagenamen
aanwezig zijn langs het normale Node-zoekpad voor `node_modules` van de plugin; het
importeert geen pluginruntimecode, voert geen packagemanager uit en repareert geen
ontbrekende afhankelijkheden.
</Note>

`plugins search` is een externe ClawHub-catalogusopzoeking. Het inspecteert geen lokale
status, wijzigt geen configuratie, installeert geen packages en laadt geen pluginruntimecode. Zoekresultaten bevatten de ClawHub-packagenaam, familie, kanaal, versie, samenvatting en
een installatietip zoals `openclaw plugins install clawhub:<package>`.

Voor werk aan gebundelde plugins binnen een verpakte Docker-image bind-mount je de
pluginbrondirectory over het overeenkomende verpakte bronpad, zoals
`/app/extensions/synology-chat`. OpenClaw ontdekt die gemounte bron-overlay
vóór `/app/dist/extensions/synology-chat`; een gewone gekopieerde brondirectory
blijft inert, zodat normale verpakte installaties nog steeds de gecompileerde dist gebruiken.

Voor runtime-hookdebugging:

- `openclaw plugins inspect <id> --runtime --json` toont geregistreerde hooks en diagnostics uit een inspectiepass met geladen module. Runtime-inspectie installeert nooit afhankelijkheden; gebruik `openclaw doctor --fix` om legacy-afhankelijkheidsstatus op te schonen of ontbrekende geconfigureerde downloadbare plugins te installeren.
- `openclaw gateway status --deep --require-rpc` bevestigt de bereikbare Gateway, service-/proceshints, configuratiepad en RPC-gezondheid.
- Niet-gebundelde conversatiehooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) vereisen `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gebruik `--link` om het kopiëren van een lokale directory te vermijden (voegt toe aan `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wordt niet ondersteund met `--link`, omdat gekoppelde installaties het bronpad hergebruiken in plaats van over een beheerd installatiedoel heen te kopiëren.

Gebruik `--pin` bij npm-installaties om de opgeloste exacte spec (`name@version`) in de beheerde pluginindex op te slaan terwijl het standaardgedrag ongepind blijft.
</Note>

### Pluginindex

Plugininstallatiemetadata is machinaal beheerde status, geen gebruikersconfiguratie. Installaties en updates schrijven dit naar `plugins/installs.json` onder de actieve OpenClaw-statusdirectory. De top-level `installRecords`-map is de duurzame bron van installatiemetadata, inclusief records voor defecte of ontbrekende pluginmanifests. De `plugins`-array is de uit manifests afgeleide koude registrycache. Het bestand bevat een waarschuwing om het niet te bewerken en wordt gebruikt door `openclaw plugins update`, de-installatie, diagnostics en de koude pluginregistry.

Wanneer OpenClaw meegeleverde legacy-`plugins.installs`-records in de configuratie ziet, verplaatst het die naar de pluginindex en verwijdert het de configuratiesleutel; als een van beide schrijfacties mislukt, blijven de configuratierecords behouden zodat de installatiemetadata niet verloren gaat.

### De-installeren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` verwijdert pluginrecords uit `plugins.entries`, de blijvend opgeslagen pluginindex, plugin allow/deny-listvermeldingen en gekoppelde `plugins.load.paths`-vermeldingen wanneer van toepassing. Tenzij `--keep-files` is ingesteld, verwijdert de de-installatie ook de bijgehouden beheerde installatiedirectory wanneer die zich binnen de pluginextensions-root van OpenClaw bevindt. Voor active-memory-plugins wordt de geheugensleuf teruggezet naar `memory-core`.

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
  <Accordion title="Resolving plugin id vs npm spec">
    Wanneer je een plugin-id doorgeeft, hergebruikt OpenClaw de vastgelegde installatiespec voor die plugin. Dat betekent dat eerder opgeslagen dist-tags zoals `@beta` en exacte gepinde versies bij latere `update <id>`-runs gebruikt blijven worden.

    Voor npm-installaties kun je ook een expliciete npm-packagespec met een dist-tag of exacte versie doorgeven. OpenClaw herleidt die packagenaam naar het bijgehouden pluginrecord, werkt die geïnstalleerde plugin bij en legt de nieuwe npm-spec vast voor toekomstige updates op basis van id.

    Het doorgeven van de npm-packagenaam zonder versie of tag herleidt ook naar het bijgehouden pluginrecord. Gebruik dit wanneer een plugin op een exacte versie was gepind en je die terug wilt zetten naar de standaardreleaselijn van de registry.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` hergebruikt de bijgehouden pluginspec tenzij je een nieuwe spec doorgeeft. `openclaw update` kent daarnaast het actieve OpenClaw-updatekanaal: op het bètakanaal proberen default-line npm- en ClawHub-pluginrecords eerst `@beta`, en vallen daarna terug op de vastgelegde default/latest-spec als er geen plugin-bètarelease bestaat. Exacte versies en expliciete tags blijven gepind aan die selector.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Vóór een live npm-update controleert OpenClaw de geïnstalleerde packageversie tegen de npm-registrymetadata. Als de geïnstalleerde versie en vastgelegde artefactidentiteit al overeenkomen met het opgeloste doel, wordt de update overgeslagen zonder te downloaden, opnieuw te installeren of `openclaw.json` te herschrijven.

    Wanneer er een opgeslagen integriteitshash bestaat en de opgehaalde artefacthash verandert, behandelt OpenClaw dat als npm-artefactdrift. Het interactieve commando `openclaw plugins update` toont de verwachte en daadwerkelijke hashes en vraagt om bevestiging voordat het doorgaat. Niet-interactieve updatehelpers falen gesloten tenzij de aanroeper een expliciet vervolgbeleid opgeeft.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` is ook beschikbaar bij `plugins update` als break-glass-override voor fout-positieven in de ingebouwde dangerous-code-scan tijdens pluginupdates. Het omzeilt nog steeds geen plugin-`before_install`-beleidsblokkades of blokkering door scanfouten, en het geldt alleen voor pluginupdates, niet voor hook-pack-updates.
  </Accordion>
</AccordionGroup>

### Inspecteren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect toont identiteit, laadstatus, bron, manifestmogelijkheden, beleidsvlaggen, diagnostics, installatiemetadata, bundelmogelijkheden en eventuele gedetecteerde MCP- of LSP-serverondersteuning zonder standaard pluginruntime te importeren. Voeg `--runtime` toe om de pluginmodule te laden en geregistreerde hooks, tools, commando's, services, gatewaymethoden en HTTP-routes op te nemen. Runtime-inspectie rapporteert ontbrekende pluginafhankelijkheden direct; installaties en reparaties blijven in `openclaw plugins install`, `openclaw plugins update` en `openclaw doctor --fix`.

CLI-commando's die eigendom zijn van plugins worden geïnstalleerd als root-`openclaw`-commandogroepen. Nadat `inspect --runtime` een commando onder `cliCommands` toont, voer je het uit als `openclaw <command> ...`; een plugin die bijvoorbeeld `demo-git` registreert, kan worden gecontroleerd met `openclaw demo-git ping`.

Elke plugin wordt geclassificeerd op basis van wat deze daadwerkelijk registreert tijdens runtime:

- **plain-capability** — één type capability (bijv. een plugin die alleen provider is)
- **hybrid-capability** — meerdere capabilitytypen (bijv. tekst + spraak + afbeeldingen)
- **hook-only** — alleen hooks, geen capabilities of surfaces
- **non-capability** — tools/commando's/services maar geen capabilities

Zie [Plugin shapes](/nl/plugins/architecture#plugin-shapes) voor meer over het capabilitymodel.

<Note>
De vlag `--json` geeft een machinaal leesbaar rapport dat geschikt is voor scripting en auditing. `inspect --all` rendert een fleet-wide tabel met kolommen voor shape, capabilitysoorten, compatibiliteitsmeldingen, bundelmogelijkheden en hooksamenvatting. `info` is een alias voor `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` rapporteert laadfouten van plugins, manifest-/discovery-diagnostics en compatibiliteitsmeldingen. Wanneer alles schoon is, drukt het `No plugin issues detected.` af

Als een geconfigureerde plugin op schijf aanwezig is maar wordt geblokkeerd door de padveiligheidscontroles van de loader, behoudt configuratievalidatie de pluginvermelding en rapporteert deze als `present but blocked`. Los de voorafgaande blocked-plugin-diagnostic op, zoals padeigendom of world-writable permissies, in plaats van de configuratie `plugins.entries.<id>` of `plugins.allow` te verwijderen.

Voor module-shape-fouten zoals ontbrekende `register`/`activate`-exports, voer opnieuw uit met `OPENCLAW_PLUGIN_LOAD_DEBUG=1` om een compacte export-shape-samenvatting in de diagnostische uitvoer op te nemen.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

De lokale pluginregistry is OpenClaw's blijvend opgeslagen koude leesmodel voor geïnstalleerde pluginidentiteit, inschakeling, bronmetadata en eigendom van bijdragen. Normale startup, provider-owner lookup, classificatie van kanaalsetup en plugininventaris kunnen dit lezen zonder pluginruntimemodules te importeren.

Gebruik `plugins registry` om te controleren of het persistente register aanwezig, actueel of verouderd is. Gebruik `--refresh` om het opnieuw op te bouwen vanuit de persistente Plugin-index, het configuratiebeleid en de manifest-/pakketmetadata. Dit is een herstelpad, geen pad voor runtime-activering.

`openclaw doctor --fix` herstelt ook beheerde npm-afwijkingen rond het register: als een verweesd of hersteld `@openclaw/*`-pakket onder de beheerde Plugin-npm-root een meegeleverde Plugin overschaduwt, verwijdert doctor dat verouderde pakket en bouwt het register opnieuw op zodat de opstartvalidatie tegen het meegeleverde manifest plaatsvindt.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` is een verouderde noodschakelaar voor compatibiliteit bij leesfouten in het register. Geef de voorkeur aan `plugins registry --refresh` of `openclaw doctor --fix`; de env-fallback is alleen bedoeld voor noodherstel bij het opstarten terwijl de migratie wordt uitgerold.
</Warning>

### Marktplaats

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

De marktplaatslijst accepteert een lokaal marktplaatspad, een `marketplace.json`-pad, een GitHub-verkorte notatie zoals `owner/repo`, een GitHub-repo-URL of een git-URL. `--json` drukt het opgeloste bronlabel af plus het geparseerde marktplaatsmanifest en de Plugin-vermeldingen.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [CLI-referentie](/nl/cli)
- [Community-Plugins](/nl/plugins/community)
