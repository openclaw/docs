---
read_when:
    - Je wilt Gateway-plugins of compatibele bundels installeren of beheren
    - Je wilt fouten bij het laden van Plugins debuggen
sidebarTitle: Plugins
summary: CLI-referentie voor `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-03T21:28:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d854d052b0a012a86f9c775775676a9a8fe8ae86b2c38a18118f1abf0732174c
    source_path: cli/plugins.md
    workflow: 16
---

Beheer Gateway-plugins, hookpakketten en compatibele bundels.

<CardGroup cols={2}>
  <Card title="Pluginsysteem" href="/nl/tools/plugin">
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
    Beveiligingsversterking voor plugin-installaties.
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

Voor onderzoek naar trage installatie, inspectie, verwijdering of registry-vernieuwing voert u de opdracht uit met `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. De trace schrijft fasetimings naar stderr en houdt JSON-uitvoer parseerbaar. Zie [Foutopsporing](/nl/help/debugging#plugin-lifecycle-trace).

<Note>
Gebundelde plugins worden met OpenClaw meegeleverd. Sommige zijn standaard ingeschakeld (bijvoorbeeld gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browser-plugin); andere vereisen `plugins enable`.

Native OpenClaw-plugins moeten `openclaw.plugin.json` meeleveren met een inline JSON Schema (`configSchema`, zelfs als dit leeg is). Compatibele bundels gebruiken in plaats daarvan hun eigen bundelmanifesten.

`plugins list` toont `Format: openclaw` of `Format: bundle`. Uitgebreide uitvoer van list/info toont ook het bundelsubtype (`codex`, `claude` of `cursor`) plus gedetecteerde bundelmogelijkheden.
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
Kale pakketnamen installeren tijdens de lanceerovergang standaard vanuit npm. Gebruik `clawhub:<package>` voor ClawHub. Behandel plugin-installaties als het uitvoeren van code. Geef de voorkeur aan vastgepinde versies.
</Warning>

`plugins search` bevraagt ClawHub naar installeerbare pluginpakketten en drukt pakketnamen af die direct kunnen worden geïnstalleerd. Het zoekt naar code-plugin- en bundle-plugin-pakketten, niet naar skills. Gebruik `openclaw skills search` voor ClawHub-skills.

<Note>
ClawHub is het primaire oppervlak voor distributie en ontdekking voor de meeste plugins. Npm blijft een ondersteunde fallback en direct-installatiepad. Pluginpakketten van OpenClaw zelf onder `@openclaw/*` worden weer op npm gepubliceerd; zie de huidige lijst op [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) of de [plugin-inventaris](/nl/plugins/plugin-inventory). Stabiele installaties gebruiken `latest`. Installaties en updates via het bètakanaal geven de voorkeur aan de npm-`beta`-dist-tag wanneer die tag beschikbaar is, en vallen daarna terug op `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Configuratie-includes en herstel van ongeldige configuratie">
    Als uw `plugins`-sectie wordt ondersteund door een `$include` met één bestand, schrijven `plugins install/update/enable/disable/uninstall` door naar dat included bestand en laten ze `openclaw.json` onaangeroerd. Root-includes, include-arrays en includes met sibling-overrides falen gesloten in plaats van te flattenen. Zie [Configuratie-includes](/nl/gateway/configuration) voor de ondersteunde vormen.

    Als configuratie tijdens installatie ongeldig is, faalt `plugins install` normaal gesproken gesloten en vraagt het u eerst `openclaw doctor --fix` uit te voeren. Tijdens het starten en hot reloaden van de Gateway faalt ongeldige pluginconfiguratie gesloten zoals elke andere ongeldige configuratie; `openclaw doctor --fix` kan de ongeldige pluginvermelding in quarantaine plaatsen. De enige gedocumenteerde uitzondering tijdens installatie is een smal herstelpad voor gebundelde plugins voor plugins die expliciet opt-innen op `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force en opnieuw installeren versus bijwerken">
    `--force` hergebruikt het bestaande installatiedoel en overschrijft een al geïnstalleerde plugin of hookpakket ter plaatse. Gebruik dit wanneer u bewust dezelfde id opnieuw installeert vanuit een nieuw lokaal pad, archief, ClawHub-pakket of npm-artefact. Geef voor routinematige upgrades van een al gevolgde npm-plugin de voorkeur aan `openclaw plugins update <id-or-npm-spec>`.

    Als u `plugins install` uitvoert voor een plugin-id die al is geïnstalleerd, stopt OpenClaw en verwijst het u naar `plugins update <id-or-npm-spec>` voor een normale upgrade, of naar `plugins install <package> --force` wanneer u de huidige installatie echt vanuit een andere bron wilt overschrijven.

  </Accordion>
  <Accordion title="Bereik van --pin">
    `--pin` is alleen van toepassing op npm-installaties. Het wordt niet ondersteund met `git:`-installaties; gebruik een expliciete git-ref zoals `git:github.com/acme/plugin@v1.2.3` wanneer u een vastgepinde bron wilt. Het wordt niet ondersteund met `--marketplace`, omdat marketplace-installaties marketplace-bronmetadata bewaren in plaats van een npm-spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` is een noodoptie voor fout-positieven in de ingebouwde gevaarlijke-code-scanner. Hiermee kan de installatie doorgaan, zelfs wanneer de ingebouwde scanner `critical`-bevindingen meldt, maar dit omzeilt **geen** beleidsblokkades van plugin-`before_install`-hooks en omzeilt **geen** scanfouten.

    Deze CLI-vlag is van toepassing op plugin-installatie- en updateflows. Door de Gateway ondersteunde skill-afhankelijkheidsinstallaties gebruiken de overeenkomende request-override `dangerouslyForceUnsafeInstall`, terwijl `openclaw skills install` een afzonderlijke download-/installatieflow voor ClawHub-skills blijft.

    Als een plugin die u op ClawHub hebt gepubliceerd wordt geblokkeerd door een registryscan, gebruik dan de publicatiestappen in [ClawHub](/nl/tools/clawhub).

  </Accordion>
  <Accordion title="Hookpakketten en npm-specs">
    `plugins install` is ook het installatieoppervlak voor hookpakketten die `openclaw.hooks` in `package.json` aanbieden. Gebruik `openclaw hooks` voor gefilterde hook-zichtbaarheid en inschakeling per hook, niet voor pakketinstallatie.

    Npm-specs zijn **alleen registry** (pakketnaam + optionele **exacte versie** of **dist-tag**). Git-/URL-/bestandsspecs en semver-bereiken worden geweigerd. Afhankelijkheidsinstallaties worden projectlokaal uitgevoerd met `--ignore-scripts` voor veiligheid, zelfs wanneer uw shell globale npm-installatie-instellingen heeft.

    Gebruik `npm:<package>` wanneer u npm-resolutie expliciet wilt maken. Kale pakketspecs installeren tijdens de lanceerovergang ook rechtstreeks vanuit npm.

    Kale specs en `@latest` blijven op het stabiele spoor. Als npm een van beide naar een prerelease resolved, stopt OpenClaw en vraagt het u expliciet opt-in te doen met een prerelease-tag zoals `@beta`/`@rc` of een exacte prereleaseversie zoals `@1.2.3-beta.4`.

    Als een kale installatiespec overeenkomt met een officiële plugin-id (bijvoorbeeld `diffs`), installeert OpenClaw de catalogusvermelding rechtstreeks. Gebruik een expliciete scoped spec (bijvoorbeeld `@scope/diffs`) om een npm-pakket met dezelfde naam te installeren.

  </Accordion>
  <Accordion title="Git-repository's">
    Gebruik `git:<repo>` om rechtstreeks vanuit een git-repository te installeren. Ondersteunde vormen zijn onder meer `git:github.com/owner/repo`, `git:owner/repo`, volledige `https://`-, `ssh://`-, `git://`-, `file://`- en `git@host:owner/repo.git`-clone-URL's. Voeg `@<ref>` of `#<ref>` toe om vóór installatie een branch, tag of commit uit te checken.

    Git-installaties clonen naar een tijdelijke map, checken de gevraagde ref uit wanneer die aanwezig is, en gebruiken daarna de normale installer voor plugin-mappen. Dat betekent dat manifestvalidatie, scanning op gevaarlijke code, package-manager-installatiewerk en installatierecords zich gedragen zoals bij npm-installaties. Geregistreerde git-installaties bevatten de bron-URL/ref plus de resolved commit, zodat `openclaw plugins update` de bron later opnieuw kan resolven.

    Gebruik na installatie vanuit git `openclaw plugins inspect <id> --runtime --json` om runtime-registraties zoals gateway-methoden en CLI-opdrachten te verifiëren. Als de plugin een CLI-root heeft geregistreerd met `api.registerCli`, voert u die opdracht rechtstreeks uit via de OpenClaw-root-CLI, bijvoorbeeld `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archieven">
    Ondersteunde archieven: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-pluginarchieven moeten een geldige `openclaw.plugin.json` bevatten in de uitgepakte plugin-root; archieven die alleen `package.json` bevatten, worden geweigerd voordat OpenClaw installatierecords schrijft.

    Claude marketplace-installaties worden ook ondersteund.

  </Accordion>
</AccordionGroup>

ClawHub-installaties gebruiken een expliciete `clawhub:<package>`-locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Kale npm-veilige pluginspecs installeren tijdens de lanceerovergang standaard vanuit npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gebruik `npm:` om npm-only-resolutie expliciet te maken:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controleert de geadverteerde plugin-API / minimale gatewaycompatibiliteit vóór installatie. Wanneer de geselecteerde ClawHub-versie een ClawPack-artefact publiceert, downloadt OpenClaw de versioned npm-pack `.tgz`, verifieert het de ClawHub-digest-header en de artefactdigest, en installeert het dit vervolgens via het normale archiefpad. Oudere ClawHub-versies zonder ClawPack-metadata installeren nog steeds via het legacy verificatiepad voor pakketarchieven. Geregistreerde installaties bewaren hun ClawHub-bronmetadata, artefactsoort, npm-integriteit, npm-shasum, tarballnaam en ClawPack-digestfeiten voor latere updates.
Ongeversioneerde ClawHub-installaties bewaren een ongeversioneerde geregistreerde spec, zodat `openclaw plugins update` nieuwere ClawHub-releases kan volgen; expliciete versie- of tagselectors zoals `clawhub:pkg@1.2.3` en `clawhub:pkg@beta` blijven vastgepind op die selector.

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
    - een GitHub-repoverkorting zoals `owner/repo`
    - een GitHub-repo-URL zoals `https://github.com/owner/repo`
    - een git-URL

  </Tab>
  <Tab title="Regels voor externe marketplaces">
    Voor externe marketplaces die vanuit GitHub of git worden geladen, moeten plugin-vermeldingen binnen de gekloonde marketplace-repo blijven. OpenClaw accepteert relatieve padbronnen uit die repo en weigert HTTP(S), absolute paden, git, GitHub en andere niet-pad-pluginbronnen uit externe manifests.
  </Tab>
</Tabs>

Voor lokale paden en archieven detecteert OpenClaw automatisch:

- native OpenClaw-plugins (`openclaw.plugin.json`)
- Codex-compatibele bundels (`.codex-plugin/plugin.json`)
- Claude-compatibele bundels (`.claude-plugin/plugin.json` of de standaard Claude-componentindeling)
- Cursor-compatibele bundels (`.cursor-plugin/plugin.json`)

<Note>
Compatibele bundels worden in de normale plugin-root geïnstalleerd en doen mee aan dezelfde list/info/enable/disable-flow. Momenteel worden bundel-Skills, Claude-command-Skills, standaardwaarden uit Claude `settings.json`, standaardwaarden uit Claude `.lsp.json` / manifest-gedeclareerde `lspServers`, Cursor-command-Skills en compatibele Codex-hookmappen ondersteund; andere gedetecteerde bundelmogelijkheden worden weergegeven in diagnostics/info, maar zijn nog niet gekoppeld aan runtime-uitvoering.
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
  Machineleesbare inventaris plus registry-diagnostics en installatiestatus van pakketafhankelijkheden.
</ParamField>

<Note>
`plugins list` leest eerst de opgeslagen lokale plugin-registry, met een alleen-uit-manifest-afgeleide fallback wanneer de registry ontbreekt of ongeldig is. Dit is nuttig om te controleren of een plugin is geïnstalleerd, ingeschakeld en zichtbaar is voor planning van een koude start, maar het is geen live runtime-probe van een al draaiend Gateway-proces. Nadat je plugin-code, inschakeling, hookbeleid of `plugins.load.paths` hebt gewijzigd, herstart je de Gateway die het kanaal bedient voordat je verwacht dat nieuwe `register(api)`-code of hooks worden uitgevoerd. Controleer bij externe/container-deployments dat je het daadwerkelijke `openclaw gateway run`-child herstart, niet alleen een wrapper-proces.

`plugins list --json` bevat voor elke plugin de `dependencyStatus` uit `package.json`
`dependencies` en `optionalDependencies`. OpenClaw controleert of die pakketnamen aanwezig zijn langs het normale Node `node_modules`-opzoekpad van de plugin; het importeert geen plugin-runtimecode, voert geen package manager uit en repareert geen ontbrekende afhankelijkheden.
</Note>

`plugins search` is een externe ClawHub-cataloguszoekopdracht. Het inspecteert geen lokale
staat, wijzigt geen configuratie, installeert geen pakketten en laadt geen plugin-runtimecode. Zoekresultaten bevatten de ClawHub-pakketnaam, familie, kanaal, versie, samenvatting en
een installatietip zoals `openclaw plugins install clawhub:<package>`.

Voor werk aan meegeleverde plugins binnen een verpakte Docker-image, bind-mount je de plugin-
bronmap over het overeenkomende verpakte bronpad, zoals
`/app/extensions/synology-chat`. OpenClaw ontdekt die gemounte bron-
overlay vóór `/app/dist/extensions/synology-chat`; een gewoon gekopieerde bron-
map blijft inert, zodat normale verpakte installaties nog steeds de gecompileerde dist gebruiken.

Voor runtime-hookdebugging:

- `openclaw plugins inspect <id> --runtime --json` toont geregistreerde hooks en diagnostics uit een inspectiepass waarbij de module is geladen. Runtime-inspectie installeert nooit afhankelijkheden; gebruik `openclaw doctor --fix` om legacy-afhankelijkheidsstaat op te schonen of ontbrekende geconfigureerde downloadbare plugins te installeren.
- `openclaw gateway status --deep --require-rpc` bevestigt de bereikbare Gateway, service-/process-hints, configuratiepad en RPC-gezondheid.
- Niet-meegeleverde gesprekshooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) vereisen `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gebruik `--link` om het kopiëren van een lokale map te vermijden (voegt toe aan `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wordt niet ondersteund met `--link`, omdat gekoppelde installaties het bronpad hergebruiken in plaats van over een beheerd installatiedoel heen te kopiëren.

Gebruik `--pin` bij npm-installaties om de opgeloste exacte spec (`name@version`) op te slaan in de beheerde plugin-index, terwijl het standaardgedrag ongepind blijft.
</Note>

### Plugin-index

Plugin-installatiemetadata is machinebeheerde staat, geen gebruikersconfiguratie. Installaties en updates schrijven dit naar `plugins/installs.json` onder de actieve OpenClaw-statusmap. De top-level `installRecords`-map is de duurzame bron van installatiemetadata, inclusief records voor kapotte of ontbrekende plugin-manifests. De `plugins`-array is de uit manifest afgeleide koude registry-cache. Het bestand bevat een waarschuwing om het niet te bewerken en wordt gebruikt door `openclaw plugins update`, verwijderen, diagnostics en de koude plugin-registry.

Wanneer OpenClaw meegeleverde legacy-`plugins.installs`-records in de configuratie ziet, verplaatst het deze naar de plugin-index en verwijdert het de configuratiesleutel; als een van beide schrijfacties mislukt, blijven de configuratierecords behouden zodat de installatiemetadata niet verloren gaat.

### Verwijderen

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` verwijdert plugin-records uit `plugins.entries`, de opgeslagen plugin-index, plugin-allow/deny-listvermeldingen en gekoppelde `plugins.load.paths`-vermeldingen waar van toepassing. Tenzij `--keep-files` is ingesteld, verwijdert uninstall ook de gevolgde beheerde installatiemap wanneer die zich binnen de plugin-extensions-root van OpenClaw bevindt. Voor Active Memory-plugins wordt het geheugenslot teruggezet naar `memory-core`.

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

Updates zijn van toepassing op gevolgde plugin-installaties in de beheerde plugin-index en gevolgde hook-pack-installaties in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Plugin-id versus npm-spec oplossen">
    Wanneer je een plugin-id doorgeeft, hergebruikt OpenClaw de vastgelegde installatiespec voor die plugin. Dat betekent dat eerder opgeslagen dist-tags zoals `@beta` en exact gepinde versies ook bij latere `update <id>`-runs worden gebruikt.

    Voor npm-installaties kun je ook een expliciete npm-pakketspec met een dist-tag of exacte versie doorgeven. OpenClaw herleidt die pakketnaam terug naar het gevolgde plugin-record, werkt die geïnstalleerde plugin bij en legt de nieuwe npm-spec vast voor toekomstige updates op basis van id.

    Het doorgeven van de npm-pakketnaam zonder versie of tag wordt ook terug herleid naar het gevolgde plugin-record. Gebruik dit wanneer een plugin aan een exacte versie was gepind en je die terug wilt verplaatsen naar de standaard releaselijn van de registry.

  </Accordion>
  <Accordion title="Updates voor het bètakanaal">
    `openclaw plugins update` hergebruikt de gevolgde plugin-spec tenzij je een nieuwe spec doorgeeft. `openclaw update` kent daarnaast het actieve OpenClaw-updatekanaal: op het bètakanaal proberen npm- en ClawHub-plugin-records op de standaardlijn eerst `@beta` en vallen daarna terug op de vastgelegde default/latest-spec als er geen plugin-bètarelease bestaat. Exacte versies en expliciete tags blijven aan die selector gepind.

  </Accordion>
  <Accordion title="Versiecontroles en integriteitsdrift">
    Vóór een live npm-update controleert OpenClaw de geïnstalleerde pakketversie tegen de metadata van de npm-registry. Als de geïnstalleerde versie en vastgelegde artefactidentiteit al overeenkomen met het opgeloste doel, wordt de update overgeslagen zonder te downloaden, opnieuw te installeren of `openclaw.json` te herschrijven.

    Wanneer er een opgeslagen integriteitshash bestaat en de opgehaalde artefacthash verandert, behandelt OpenClaw dat als npm-artefactdrift. Het interactieve `openclaw plugins update`-commando toont de verwachte en daadwerkelijke hashes en vraagt om bevestiging voordat het doorgaat. Niet-interactieve updatehelpers falen gesloten tenzij de aanroeper een expliciet vervolgbeleid opgeeft.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install bij update">
    `--dangerously-force-unsafe-install` is ook beschikbaar bij `plugins update` als break-glass-override voor false positives in ingebouwde dangerous-code-scans tijdens plugin-updates. Het omzeilt nog steeds geen plugin-`before_install`-beleidsblokkades of blokkering door scanfouten, en het geldt alleen voor plugin-updates, niet voor hook-pack-updates.
  </Accordion>
</AccordionGroup>

### Inspecteren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect toont identiteit, laadstatus, bron, manifestmogelijkheden, beleidsflags, diagnostics, installatiemetadata, bundelmogelijkheden en eventuele gedetecteerde MCP- of LSP-serverondersteuning zonder standaard plugin-runtime te importeren. Voeg `--runtime` toe om de plugin-module te laden en geregistreerde hooks, tools, commando's, services, gateway-methoden en HTTP-routes op te nemen. Runtime-inspectie rapporteert ontbrekende plugin-afhankelijkheden direct; installaties en reparaties blijven in `openclaw plugins install`, `openclaw plugins update` en `openclaw doctor --fix`.

CLI-commando's die eigendom zijn van plugins worden geïnstalleerd als root-`openclaw`-commandogroepen. Nadat `inspect --runtime` een commando onder `cliCommands` toont, voer je het uit als `openclaw <command> ...`; bijvoorbeeld een plugin die `demo-git` registreert, kan worden gecontroleerd met `openclaw demo-git ping`.

Elke plugin wordt geclassificeerd op basis van wat hij daadwerkelijk tijdens runtime registreert:

- **plain-capability** — één capabilitytype (bijv. een provider-only plugin)
- **hybrid-capability** — meerdere capabilitytypen (bijv. tekst + spraak + afbeeldingen)
- **hook-only** — alleen hooks, geen capabilities of oppervlakken
- **non-capability** — tools/commando's/services maar geen capabilities

Zie [Plugin-vormen](/nl/plugins/architecture#plugin-shapes) voor meer over het capabilitymodel.

<Note>
De `--json`-flag geeft een machineleesbaar rapport dat geschikt is voor scripting en auditing. `inspect --all` rendert een fleet-brede tabel met kolommen voor vorm, capabilitysoorten, compatibiliteitsmeldingen, bundelmogelijkheden en hooksamenvatting. `info` is een alias voor `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` rapporteert plugin-laadfouten, manifest-/discovery-diagnostics en compatibiliteitsmeldingen. Wanneer alles schoon is, wordt `No plugin issues detected.` afgedrukt.

Als een geconfigureerde plugin op schijf aanwezig is maar wordt geblokkeerd door de padveiligheidscontroles van de loader, behoudt configuratievalidatie de plugin-vermelding en rapporteert deze als `present but blocked`. Los de voorafgaande blocked-plugin-diagnostic op, zoals padeigendom of world-writable machtigingen, in plaats van de `plugins.entries.<id>`- of `plugins.allow`-configuratie te verwijderen.

Voor modulevormfouten zoals ontbrekende `register`/`activate`-exports, voer je opnieuw uit met `OPENCLAW_PLUGIN_LOAD_DEBUG=1` om een compacte exportvormsamenvatting in de diagnostic-uitvoer op te nemen.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

De lokale plugin-registry is het opgeslagen koude leesmodel van OpenClaw voor geïnstalleerde plugin-identiteit, inschakeling, bronmetadata en eigendom van bijdragen. Normale startup, provider-owner-opzoeking, classificatie van kanaalsetup en plugin-inventaris kunnen dit lezen zonder plugin-runtimemodules te importeren.

Gebruik `plugins registry` om te controleren of de persistente registry aanwezig, actueel of verouderd is. Gebruik `--refresh` om deze opnieuw op te bouwen vanuit de persistente Plugin-index, het configuratiebeleid en de manifest-/pakketmetadata. Dit is een herstelpad, geen runtime-activeringspad.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` is een verouderde break-glass-compatibiliteitsschakelaar voor leesfouten in de registry. Geef de voorkeur aan `plugins registry --refresh` of `openclaw doctor --fix`; de env-terugval is alleen bedoeld voor noodherstel bij opstarten terwijl de migratie wordt uitgerold.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list accepteert een lokaal Marketplace-pad, een `marketplace.json`-pad, een GitHub-verkorting zoals `owner/repo`, een GitHub-repo-URL of een git-URL. `--json` drukt het opgeloste bronlabel af, plus het geparste Marketplace-manifest en de Plugin-vermeldingen.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [CLI-referentie](/nl/cli)
- [Community-plugins](/nl/plugins/community)
