---
read_when:
    - Je wilt Gateway-plugins of compatibele bundels installeren of beheren
    - Je wilt Plugin-laadfouten debuggen
sidebarTitle: Plugins
summary: CLI-referentie voor `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-05T01:44:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24d274f33213231eaed48ac848a9266802a2179ba0311ab18462ad783219095a
    source_path: cli/plugins.md
    workflow: 16
---

Beheer Gateway-plugins, hookpakketten en compatibele bundels.

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
    Beveiligingsversterking voor Plugin-installaties.
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

Voor onderzoek naar traag installeren, inspecteren, verwijderen of vernieuwen van het register voert u de opdracht uit met `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. De trace schrijft fasetimings naar stderr en houdt JSON-uitvoer parseerbaar. Zie [Foutopsporing](/nl/help/debugging#plugin-lifecycle-trace).

<Note>
Gebundelde plugins worden met OpenClaw meegeleverd. Sommige zijn standaard ingeschakeld (bijvoorbeeld gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browserplugin); andere vereisen `plugins enable`.

Native OpenClaw-plugins moeten `openclaw.plugin.json` meeleveren met een inline JSON Schema (`configSchema`, zelfs als het leeg is). Compatibele bundels gebruiken in plaats daarvan hun eigen bundelmanifests.

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
Kale pakketnamen installeren tijdens de lanceringsovergang standaard vanuit npm. Gebruik `clawhub:<package>` voor ClawHub. Behandel Plugin-installaties als het uitvoeren van code. Geef de voorkeur aan vastgepinde versies.
</Warning>

`plugins search` bevraagt ClawHub naar installeerbare Plugin-pakketten en drukt pakketnamen af die klaar zijn voor installatie. Het zoekt naar code-plugin- en bundle-plugin-pakketten, niet naar Skills. Gebruik `openclaw skills search` voor ClawHub Skills.

<Note>
ClawHub is het primaire distributie- en ontdekkingsoppervlak voor de meeste plugins. Npm blijft een ondersteunde fallback en direct-installatiepad. OpenClaw-eigen `@openclaw/*` Plugin-pakketten worden weer op npm gepubliceerd; zie de actuele lijst op [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) of de [Plugin-inventaris](/nl/plugins/plugin-inventory). Stabiele installaties gebruiken `latest`. Installaties en updates van het bètakanaal geven de voorkeur aan de npm `beta` dist-tag wanneer die tag beschikbaar is, en vallen daarna terug op `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Configuratie-includes en herstel van ongeldige configuratie">
    Als uw `plugins`-sectie wordt ondersteund door een enkelbestands `$include`, schrijven `plugins install/update/enable/disable/uninstall` door naar dat opgenomen bestand en laten ze `openclaw.json` onaangeroerd. Root-includes, include-arrays en includes met sibling-overrides falen gesloten in plaats van te flattenen. Zie [Configuratie-includes](/nl/gateway/configuration) voor de ondersteunde vormen.

    Als de configuratie tijdens installatie ongeldig is, faalt `plugins install` normaal gesproken gesloten en vertelt het u eerst `openclaw doctor --fix` uit te voeren. Tijdens het opstarten van de Gateway en hot reload faalt ongeldige Plugin-configuratie gesloten, net als elke andere ongeldige configuratie; `openclaw doctor --fix` kan de ongeldige Plugin-vermelding in quarantaine plaatsen. De enige gedocumenteerde uitzondering tijdens installatie is een smal herstelpad voor gebundelde plugins die expliciet kiezen voor `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force en herinstalleren versus bijwerken">
    `--force` hergebruikt het bestaande installatiedoel en overschrijft een al geïnstalleerde Plugin of hookpakket ter plaatse. Gebruik dit wanneer u bewust dezelfde id opnieuw installeert vanuit een nieuw lokaal pad, archief, ClawHub-pakket of npm-artefact. Geef voor routinematige upgrades van een al gevolgde npm-Plugin de voorkeur aan `openclaw plugins update <id-or-npm-spec>`.

    Als u `plugins install` uitvoert voor een Plugin-id die al is geïnstalleerd, stopt OpenClaw en verwijst het u naar `plugins update <id-or-npm-spec>` voor een normale upgrade, of naar `plugins install <package> --force` wanneer u de huidige installatie echt vanuit een andere bron wilt overschrijven.

  </Accordion>
  <Accordion title="Bereik van --pin">
    `--pin` geldt alleen voor npm-installaties. Het wordt niet ondersteund met `git:`-installaties; gebruik een expliciete git-ref zoals `git:github.com/acme/plugin@v1.2.3` wanneer u een vastgepinde bron wilt. Het wordt niet ondersteund met `--marketplace`, omdat marketplace-installaties metadata van de marketplace-bron behouden in plaats van een npm-spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` is een noodoptie voor fout-positieven in de ingebouwde scanner voor gevaarlijke code. Hiermee kan de installatie doorgaan, zelfs wanneer de ingebouwde scanner `critical`-bevindingen rapporteert, maar het omzeilt **geen** beleidsblokkades van Plugin-`before_install`-hooks en omzeilt **geen** scanfouten.

    Deze CLI-vlag geldt voor Plugin-installatie-/updateflows. Gateway-ondersteunde installatie van Skill-afhankelijkheden gebruikt de overeenkomende aanvraagoverride `dangerouslyForceUnsafeInstall`, terwijl `openclaw skills install` een afzonderlijke ClawHub Skill-download-/installatieflow blijft.

    Als een Plugin die u op ClawHub hebt gepubliceerd wordt geblokkeerd door een registerscan, gebruikt u de uitgeversstappen in [ClawHub](/nl/tools/clawhub).

  </Accordion>
  <Accordion title="Hookpakketten en npm-specs">
    `plugins install` is ook het installatieoppervlak voor hookpakketten die `openclaw.hooks` in `package.json` beschikbaar stellen. Gebruik `openclaw hooks` voor gefilterde zichtbaarheid van hooks en inschakeling per hook, niet voor pakketinstallatie.

    Npm-specs zijn **alleen register** (pakketnaam + optionele **exacte versie** of **dist-tag**). Git-/URL-/bestandsspecs en semver-bereiken worden geweigerd. Installaties van afhankelijkheden worden projectlokaal uitgevoerd met `--ignore-scripts` voor veiligheid, zelfs wanneer uw shell globale npm-installatie-instellingen heeft.

    Gebruik `npm:<package>` wanneer u npm-resolutie expliciet wilt maken. Kale pakketspecs installeren tijdens de lanceringsovergang ook rechtstreeks vanuit npm.

    Kale specs en `@latest` blijven op het stabiele spoor. OpenClaw-datumgestempelde correctieversies zoals `2026.5.3-1` zijn stabiele releases voor deze controle. Als npm een van deze naar een prerelease resolveert, stopt OpenClaw en vraagt het u expliciet in te stemmen met een prerelease-tag zoals `@beta`/`@rc` of een exacte prerelease-versie zoals `@1.2.3-beta.4`.

    Als een kale installatiespec overeenkomt met een officiële Plugin-id (bijvoorbeeld `diffs`), installeert OpenClaw de catalogusvermelding rechtstreeks. Gebruik een expliciete scoped spec (bijvoorbeeld `@scope/diffs`) om een npm-pakket met dezelfde naam te installeren.

  </Accordion>
  <Accordion title="Git-repositories">
    Gebruik `git:<repo>` om rechtstreeks vanuit een git-repository te installeren. Ondersteunde vormen zijn onder andere `git:github.com/owner/repo`, `git:owner/repo`, volledige `https://`-, `ssh://`-, `git://`-, `file://`- en `git@host:owner/repo.git`-clone-URL's. Voeg `@<ref>` of `#<ref>` toe om vóór installatie een branch, tag of commit uit te checken.

    Git-installaties clonen naar een tijdelijke directory, checken de gevraagde ref uit wanneer aanwezig, en gebruiken daarna het normale installatieprogramma voor Plugin-directory's. Dat betekent dat manifestvalidatie, scanning op gevaarlijke code, installatiewerk van de pakketbeheerder en installatierecords zich gedragen zoals bij npm-installaties. Vastgelegde git-installaties bevatten de bron-URL/ref plus de opgeloste commit, zodat `openclaw plugins update` de bron later opnieuw kan resolven.

    Gebruik na installatie vanuit git `openclaw plugins inspect <id> --runtime --json` om runtimeregistraties zoals Gateway-methoden en CLI-opdrachten te verifiëren. Als de Plugin een CLI-root heeft geregistreerd met `api.registerCli`, voert u die opdracht rechtstreeks uit via de OpenClaw-root-CLI, bijvoorbeeld `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archieven">
    Ondersteunde archieven: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-Plugin-archieven moeten een geldige `openclaw.plugin.json` bevatten op de uitgepakte Plugin-root; archieven die alleen `package.json` bevatten, worden geweigerd voordat OpenClaw installatierecords schrijft.

    Claude-marketplace-installaties worden ook ondersteund.

  </Accordion>
</AccordionGroup>

ClawHub-installaties gebruiken een expliciete `clawhub:<package>`-locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Kale npm-veilige Plugin-specs installeren tijdens de lanceringsovergang standaard vanuit npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gebruik `npm:` om npm-only-resolutie expliciet te maken:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controleert vóór installatie de geadverteerde Plugin-API-/minimale Gateway-compatibiliteit. Wanneer de geselecteerde ClawHub-versie een ClawPack-artefact publiceert, downloadt OpenClaw de geversioneerde npm-pack `.tgz`, verifieert het de ClawHub-digestheader en de artefactdigest, en installeert het dit vervolgens via het normale archiefpad. Oudere ClawHub-versies zonder ClawPack-metadata installeren nog steeds via het legacy verificatiepad voor pakketarchieven. Vastgelegde installaties behouden hun ClawHub-bronmetadata, artefactsoort, npm-integriteit, npm-shasum, tarballnaam en ClawPack-digestfeiten voor latere updates.
Ongeversioneerde ClawHub-installaties behouden een ongeversioneerde vastgelegde spec, zodat `openclaw plugins update` nieuwere ClawHub-releases kan volgen; expliciete versie- of tagselectors zoals `clawhub:pkg@1.2.3` en `clawhub:pkg@beta` blijven vastgepind aan die selector.

#### Marketplace-afkorting

Gebruik de afkorting `plugin@marketplace` wanneer de marketplace-naam bestaat in Claude's lokale registercache op `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="Marketplace sources">
    - een Claude-naam voor een bekende marketplace uit `~/.claude/plugins/known_marketplaces.json`
    - een lokale marketplace-root of `marketplace.json`-pad
    - een GitHub-repoverkorting zoals `owner/repo`
    - een GitHub-repo-URL zoals `https://github.com/owner/repo`
    - een git-URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Voor externe marketplaces die vanuit GitHub of git worden geladen, moeten Plugin-vermeldingen binnen de gekloonde marketplace-repo blijven. OpenClaw accepteert relatieve padbronnen uit die repo en weigert HTTP(S)-, absolute-pad-, git-, GitHub- en andere niet-pad-Plugin-bronnen uit externe manifests.
  </Tab>
</Tabs>

Voor lokale paden en archieven detecteert OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-compatibele bundels (`.codex-plugin/plugin.json`)
- Claude-compatibele bundels (`.claude-plugin/plugin.json` of de standaard Claude-componentindeling)
- Cursor-compatibele bundels (`.cursor-plugin/plugin.json`)

<Note>
Compatibele bundels worden in de normale Plugin-root geïnstalleerd en nemen deel aan dezelfde list/info/enable/disable-stroom. Tegenwoordig worden bundel-Skills, Claude-command-Skills, standaardwaarden voor Claude `settings.json`, standaardwaarden voor Claude `.lsp.json` / in het manifest gedeclareerde `lspServers`, Cursor-command-Skills en compatibele Codex-hookmappen ondersteund; andere gedetecteerde bundelmogelijkheden worden getoond in diagnostiek/info, maar zijn nog niet gekoppeld aan runtime-uitvoering.
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
  Toon alleen ingeschakelde Plugins.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Schakel van de tabelweergave naar detailregels per Plugin met bron-/oorsprong-/versie-/activeringsmetadata.
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare inventaris plus registerdiagnostiek en installatiestatus van pakketafhankelijkheden.
</ParamField>

<Note>
`plugins list` leest eerst het persistente lokale Plugin-register, met een alleen-manifest-afgeleide fallback wanneer het register ontbreekt of ongeldig is. Dit is nuttig om te controleren of een Plugin is geïnstalleerd, ingeschakeld en zichtbaar is voor planning bij koude start, maar het is geen live runtime-probe van een al draaiend Gateway-proces. Start na het wijzigen van Plugin-code, inschakeling, hookbeleid of `plugins.load.paths` de Gateway opnieuw die het kanaal bedient voordat je verwacht dat nieuwe `register(api)`-code of hooks worden uitgevoerd. Controleer bij externe/containerimplementaties of je het daadwerkelijke childproces `openclaw gateway run` opnieuw start, niet alleen een wrapperproces.

`plugins list --json` bevat de `dependencyStatus` van elke Plugin uit `package.json`
`dependencies` en `optionalDependencies`. OpenClaw controleert of die pakketnamen
aanwezig zijn langs het normale Node-zoekpad voor `node_modules` van de Plugin; het
importeert geen Plugin-runtimecode, voert geen pakketbeheerder uit en herstelt geen ontbrekende
afhankelijkheden.
</Note>

`plugins search` is een externe ClawHub-cataloguszoekopdracht. Het inspecteert geen lokale
status, wijzigt geen config, installeert geen pakketten en laadt geen Plugin-runtimecode. Zoek
resultaten bevatten de ClawHub-pakketnaam, familie, kanaal, versie, samenvatting en
een installatiehint zoals `openclaw plugins install clawhub:<package>`.

Voor werk aan gebundelde Plugins binnen een verpakte Docker-image koppel je de Plugin-
bronmap met bind-mount over het overeenkomende verpakte bronpad, zoals
`/app/extensions/synology-chat`. OpenClaw ontdekt die aangekoppelde bron-
overlay voor `/app/dist/extensions/synology-chat`; een gewone gekopieerde bron-
map blijft inert, zodat normale verpakte installaties nog steeds gecompileerde dist gebruiken.

Voor runtime-hookdebugging:

- `openclaw plugins inspect <id> --runtime --json` toont geregistreerde hooks en diagnostiek uit een inspectiepass waarbij de module is geladen. Runtime-inspectie installeert nooit afhankelijkheden; gebruik `openclaw doctor --fix` om legacy-afhankelijkheidsstatus op te schonen of ontbrekende downloadbare Plugins te herstellen waarnaar in config wordt verwezen.
- `openclaw gateway status --deep --require-rpc` bevestigt de bereikbare Gateway, service-/proceshints, configpad en RPC-status.
- Niet-gebundelde gesprekshooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) vereisen `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gebruik `--link` om het kopiëren van een lokale map te vermijden (voegt toe aan `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wordt niet ondersteund met `--link`, omdat gekoppelde installaties het bronpad hergebruiken in plaats van over een beheerd installatiedoel te kopiëren.

Gebruik `--pin` bij npm-installaties om de opgeloste exacte spec (`name@version`) in de beheerde Plugin-index op te slaan, terwijl het standaardgedrag niet vastgepind blijft.
</Note>

### Plugin-index

Plugin-installatiemetadata is door machines beheerde status, geen gebruikersconfig. Installaties en updates schrijven deze naar `plugins/installs.json` onder de actieve OpenClaw-statusmap. De top-level `installRecords`-map is de duurzame bron van installatiemetadata, inclusief records voor kapotte of ontbrekende Plugin-manifests. De `plugins`-array is de uit het manifest afgeleide koude registercache. Het bestand bevat een niet-bewerken-waarschuwing en wordt gebruikt door `openclaw plugins update`, verwijderen, diagnostiek en het koude Plugin-register.

Wanneer OpenClaw meegeleverde legacy-`plugins.installs`-records in config ziet, verplaatst het deze naar de Plugin-index en verwijdert het de config-sleutel; als een van beide schrijfacties mislukt, blijven de config-records behouden zodat de installatiemetadata niet verloren gaat.

### Verwijderen

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` verwijdert Plugin-records uit `plugins.entries`, de persistente Plugin-index, Plugin-allow/deny-list-vermeldingen en gekoppelde `plugins.load.paths`-vermeldingen wanneer van toepassing. Tenzij `--keep-files` is ingesteld, verwijdert uninstall ook de gevolgde beheerde installatiemap wanneer die zich binnen de Plugin-extensions-root van OpenClaw bevindt. Voor active memory-Plugins wordt de memory-slot teruggezet naar `memory-core`.

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

Updates zijn van toepassing op gevolgde Plugin-installaties in de beheerde Plugin-index en gevolgde hook-pack-installaties in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Wanneer je een Plugin-id opgeeft, hergebruikt OpenClaw de geregistreerde installatiespec voor die Plugin. Dat betekent dat eerder opgeslagen dist-tags zoals `@beta` en exact vastgepinde versies ook bij latere `update <id>`-runs worden gebruikt.

    Voor npm-installaties kun je ook een expliciete npm-pakketspec met een dist-tag of exacte versie opgeven. OpenClaw koppelt die pakketnaam terug aan het gevolgde Plugin-record, werkt die geïnstalleerde Plugin bij en registreert de nieuwe npm-spec voor toekomstige id-gebaseerde updates.

    Het doorgeven van de npm-pakketnaam zonder versie of tag wordt ook teruggekoppeld aan het gevolgde Plugin-record. Gebruik dit wanneer een Plugin op een exacte versie was vastgepind en je deze wilt terugzetten naar de standaard releaselijn van het register.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` hergebruikt de gevolgde Plugin-spec, tenzij je een nieuwe spec opgeeft. `openclaw update` kent daarnaast het actieve OpenClaw-updatekanaal: op het bètakanaal proberen npm- en ClawHub-Plugin-records op de standaardlijn eerst `@beta`, en vallen daarna terug op de geregistreerde standaard-/latest-spec als er geen Plugin-bètarelease bestaat. Exacte versies en expliciete tags blijven vastgepind op die selector.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Vóór een live npm-update controleert OpenClaw de geïnstalleerde pakketversie tegen de npm-registermetadata. Als de geïnstalleerde versie en geregistreerde artefactidentiteit al overeenkomen met het opgeloste doel, wordt de update overgeslagen zonder downloaden, opnieuw installeren of herschrijven van `openclaw.json`.

    Wanneer er een opgeslagen integriteitshash bestaat en de hash van het opgehaalde artefact verandert, behandelt OpenClaw dat als npm-artefactdrift. De interactieve opdracht `openclaw plugins update` drukt de verwachte en werkelijke hashes af en vraagt om bevestiging voordat wordt doorgegaan. Niet-interactieve updatehelpers falen gesloten, tenzij de caller een expliciet vervolgbeleid opgeeft.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` is ook beschikbaar op `plugins update` als noodoverride voor false positives in de ingebouwde gevaarlijke-code-scan tijdens Plugin-updates. Het omzeilt nog steeds geen Plugin-`before_install`-beleidsblokkades of blokkering bij scanfouten, en het geldt alleen voor Plugin-updates, niet voor hook-pack-updates.
  </Accordion>
</AccordionGroup>

### Inspecteren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect toont identiteit, laadstatus, bron, manifestmogelijkheden, beleidsvlaggen, diagnostiek, installatiemetadata, bundelmogelijkheden en eventueel gedetecteerde MCP- of LSP-serverondersteuning zonder standaard Plugin-runtime te importeren. Voeg `--runtime` toe om de Plugin-module te laden en geregistreerde hooks, tools, opdrachten, services, gatewaymethoden en HTTP-routes op te nemen. Runtime-inspectie rapporteert ontbrekende Plugin-afhankelijkheden direct; installaties en reparaties blijven in `openclaw plugins install`, `openclaw plugins update` en `openclaw doctor --fix`.

Plugin-eigen CLI-opdrachten worden geïnstalleerd als root-`openclaw`-opdrachtgroepen. Nadat `inspect --runtime` een opdracht onder `cliCommands` toont, voer je deze uit als `openclaw <command> ...`; een Plugin die bijvoorbeeld `demo-git` registreert, kan worden gecontroleerd met `openclaw demo-git ping`.

Elke Plugin wordt geclassificeerd op basis van wat deze daadwerkelijk tijdens runtime registreert:

- **plain-capability** — één mogelijkheidstype (bijv. een provider-only Plugin)
- **hybrid-capability** — meerdere mogelijkheidstypen (bijv. tekst + spraak + afbeeldingen)
- **hook-only** — alleen hooks, geen mogelijkheden of oppervlakken
- **non-capability** — tools/opdrachten/services maar geen mogelijkheden

Zie [Plugin-vormen](/nl/plugins/architecture#plugin-shapes) voor meer over het mogelijkhedenmodel.

<Note>
De vlag `--json` geeft een machineleesbaar rapport dat geschikt is voor scripting en auditing. `inspect --all` rendert een vlootbrede tabel met kolommen voor vorm, mogelijkheidstypen, compatibiliteitsmeldingen, bundelmogelijkheden en hooksamenvatting. `info` is een alias voor `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` rapporteert Plugin-laadfouten, manifest-/discovery-diagnostiek en compatibiliteitsmeldingen. Wanneer alles schoon is, drukt het `No plugin issues detected.` af.

Als een geconfigureerde Plugin op schijf aanwezig is maar wordt geblokkeerd door de padveiligheidscontroles van de loader, behoudt configvalidatie de Plugin-vermelding en rapporteert deze als `present but blocked`. Los de voorafgaande diagnostiek voor de geblokkeerde Plugin op, zoals padeigendom of world-writable-machtigingen, in plaats van de config `plugins.entries.<id>` of `plugins.allow` te verwijderen.

Voor modulevormfouten zoals ontbrekende `register`/`activate`-exports voer je opnieuw uit met `OPENCLAW_PLUGIN_LOAD_DEBUG=1` om een compacte exportsvorm-samenvatting in de diagnostische uitvoer op te nemen.

### Register

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Het lokale Plugin-register is het persistente koude leesmodel van OpenClaw voor geïnstalleerde Plugin-identiteit, inschakeling, bronmetadata en bijdrage-eigenaarschap. Normale startup, provider-eigenaarlookup, classificatie van kanaalsetup en Plugin-inventaris kunnen het lezen zonder Plugin-runtimemodules te importeren.

Use `plugins registry` om te controleren of het opgeslagen register aanwezig, actueel of verouderd is. Gebruik `--refresh` om het opnieuw op te bouwen vanuit de opgeslagen plugin-index, het configuratiebeleid en manifest-/pakketmetadata. Dit is een herstelpad, geen pad voor runtime-activering.

`openclaw doctor --fix` herstelt ook registry-gerelateerde beheerde npm-afwijkingen: als een verweesd of hersteld `@openclaw/*`-pakket onder de beheerde plugin-npm-root een gebundelde plugin overschaduwt, verwijdert doctor dat verouderde pakket en bouwt het register opnieuw op, zodat het opstarten valideert tegen het gebundelde manifest.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` is een verouderde break-glass-compatibiliteitsschakelaar voor leesfouten in het register. Geef de voorkeur aan `plugins registry --refresh` of `openclaw doctor --fix`; de env-terugval is alleen bedoeld voor noodherstel bij het opstarten terwijl de migratie wordt uitgerold.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list accepteert een lokaal marketplace-pad, een `marketplace.json`-pad, een GitHub-afkorting zoals `owner/repo`, een GitHub-repo-URL of een git-URL. `--json` print het opgeloste bronlabel plus het geparste marketplace-manifest en de plugin-vermeldingen.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [CLI-referentie](/nl/cli)
- [Communityplugins](/nl/plugins/community)
