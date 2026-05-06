---
read_when:
    - Je wilt Gateway-plugins of compatibele bundels installeren of beheren
    - U wilt fouten bij het laden van Plugins debuggen
sidebarTitle: Plugins
summary: CLI-referentie voor `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-06T17:54:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 734366b6bbee5f036fdc2cfac5197ae86d2e8fbc7c977ccc4e22add2f4206951
    source_path: cli/plugins.md
    workflow: 16
---

Beheer Gateway-plugins, hook packs en compatibele bundels.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/nl/tools/plugin">
    Eindgebruikersgids voor het installeren, inschakelen en oplossen van problemen met plugins.
  </Card>
  <Card title="Manage plugins" href="/nl/plugins/manage-plugins">
    Snelle voorbeelden voor installeren, weergeven, bijwerken, verwijderen en publiceren.
  </Card>
  <Card title="Plugin bundles" href="/nl/plugins/bundles">
    Compatibiliteitsmodel voor bundels.
  </Card>
  <Card title="Plugin manifest" href="/nl/plugins/manifest">
    Manifestvelden en configuratieschema.
  </Card>
  <Card title="Security" href="/nl/gateway/security">
    Beveiligingsversterking voor plugininstallaties.
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

Voor onderzoek naar trage installatie, inspectie, verwijdering of registry-refresh voert u de opdracht uit met `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. De trace schrijft fasetimings naar stderr en houdt JSON-uitvoer parseerbaar. Zie [Debugging](/nl/help/debugging#plugin-lifecycle-trace).

<Note>
In Nix-modus (`OPENCLAW_NIX_MODE=1`) zijn mutators voor de pluginlevenscyclus uitgeschakeld. Gebruik de Nix-bron voor deze installatie in plaats van `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` of `plugins disable`; gebruik voor nix-openclaw de agent-first [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Meegeleverde plugins worden met OpenClaw geleverd. Sommige zijn standaard ingeschakeld (bijvoorbeeld meegeleverde modelproviders, meegeleverde spraakproviders en de meegeleverde browserplugin); andere vereisen `plugins enable`.

Native OpenClaw-plugins moeten `openclaw.plugin.json` leveren met een inline JSON Schema (`configSchema`, zelfs als dit leeg is). Compatibele bundels gebruiken in plaats daarvan hun eigen bundelmanifesten.

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
Kale pakketnamen installeren tijdens de launch-cutover standaard vanaf npm. Gebruik `clawhub:<package>` voor ClawHub. Behandel plugininstallaties alsof u code uitvoert. Geef de voorkeur aan vastgepinde versies.
</Warning>

`plugins search` doorzoekt ClawHub naar installeerbare pluginpakketten en drukt pakketnamen af die direct kunnen worden geïnstalleerd. Het zoekt naar code-plugin- en bundle-plugin-pakketten, niet naar skills. Gebruik `openclaw skills search` voor ClawHub-skills.

<Note>
ClawHub is het primaire distributie- en ontdekkingsoppervlak voor de meeste plugins. Npm blijft een ondersteunde fallback en direct-install-pad. Pluginpakketten van OpenClaw met eigenaar `@openclaw/*` worden opnieuw op npm gepubliceerd; zie de huidige lijst op [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) of de [plugininventaris](/nl/plugins/plugin-inventory). Stabiele installaties gebruiken `latest`. Installaties en updates via het bètakanaal geven de voorkeur aan de npm-dist-tag `beta` wanneer die tag beschikbaar is, en vallen daarna terug op `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Als uw sectie `plugins` wordt ondersteund door een `$include` met één bestand, schrijven `plugins install/update/enable/disable/uninstall` door naar dat opgenomen bestand en laten ze `openclaw.json` ongemoeid. Root-includes, include-arrays en includes met sibling-overrides falen gesloten in plaats van te flattenen. Zie [Config includes](/nl/gateway/configuration) voor de ondersteunde vormen.

    Als de configuratie tijdens installatie ongeldig is, faalt `plugins install` normaal gesproken gesloten en meldt het dat u eerst `openclaw doctor --fix` moet uitvoeren. Tijdens Gateway-startup en hot reload faalt ongeldige pluginconfiguratie gesloten zoals elke andere ongeldige configuratie; `openclaw doctor --fix` kan de ongeldige pluginvermelding in quarantaine plaatsen. De enige gedocumenteerde uitzondering tijdens installatietijd is een smal herstelpad voor meegeleverde plugins voor plugins die expliciet kiezen voor `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` hergebruikt het bestaande installatiedoel en overschrijft een al geïnstalleerde plugin of hook pack ter plekke. Gebruik dit wanneer u bewust dezelfde id opnieuw installeert vanaf een nieuw lokaal pad, archief, ClawHub-pakket of npm-artefact. Voor routinematige upgrades van een al gevolgde npm-plugin geeft u de voorkeur aan `openclaw plugins update <id-or-npm-spec>`.

    Als u `plugins install` uitvoert voor een plugin-id die al is geïnstalleerd, stopt OpenClaw en verwijst het u naar `plugins update <id-or-npm-spec>` voor een normale upgrade, of naar `plugins install <package> --force` wanneer u de huidige installatie daadwerkelijk vanuit een andere bron wilt overschrijven.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` is alleen van toepassing op npm-installaties. Het wordt niet ondersteund met `git:`-installaties; gebruik een expliciete git-ref zoals `git:github.com/acme/plugin@v1.2.3` wanneer u een vastgepinde bron wilt. Het wordt niet ondersteund met `--marketplace`, omdat marketplace-installaties marketplace-bronmetadata bewaren in plaats van een npm-spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` is een noodoptie voor false positives in de ingebouwde scanner voor gevaarlijke code. Hiermee kan de installatie doorgaan, zelfs wanneer de ingebouwde scanner `critical`-bevindingen rapporteert, maar het omzeilt **geen** plugin-`before_install`-hookbeleidsblokkades en omzeilt **geen** scanfouten.

    Deze CLI-vlag is van toepassing op plugininstallatie- en updateflows. Gateway-gestuurde installaties van skillafhankelijkheden gebruiken de overeenkomende request-override `dangerouslyForceUnsafeInstall`, terwijl `openclaw skills install` een afzonderlijke download-/installatieflow voor ClawHub-skills blijft.

    Als een plugin die u op ClawHub hebt gepubliceerd wordt geblokkeerd door een registryscan, gebruik dan de publisherstappen in [ClawHub](/nl/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` is ook het installatieoppervlak voor hook packs die `openclaw.hooks` in `package.json` blootstellen. Gebruik `openclaw hooks` voor gefilterde hookzichtbaarheid en inschakeling per hook, niet voor pakketinstallatie.

    Npm-specs zijn **alleen registry** (pakketnaam + optionele **exacte versie** of **dist-tag**). Git-/URL-/bestandsspecs en semverbereiken worden geweigerd. Afhankelijkheidsinstallaties draaien projectlokaal met `--ignore-scripts` voor veiligheid, zelfs wanneer uw shell globale npm-installatie-instellingen heeft. Beheerde npm-roots van plugins erven OpenClaw's npm-`overrides` op pakketniveau, zodat hostbeveiligingspins ook gelden voor gehoste pluginafhankelijkheden.

    Gebruik `npm:<package>` wanneer u npm-resolutie expliciet wilt maken. Kale pakketspecs installeren tijdens de launch-cutover ook direct vanaf npm.

    Kale specs en `@latest` blijven op het stabiele spoor. OpenClaw-correctieversies met datumstempel, zoals `2026.5.3-1`, zijn stabiele releases voor deze controle. Als npm een van beide naar een prerelease resolved, stopt OpenClaw en vraagt het u expliciet in te stemmen met een prerelease-tag zoals `@beta`/`@rc` of een exacte prereleaseversie zoals `@1.2.3-beta.4`.

    Als een kale installatiespec overeenkomt met een officiële plugin-id (bijvoorbeeld `diffs`), installeert OpenClaw de catalogusvermelding direct. Gebruik een expliciete scoped spec (bijvoorbeeld `@scope/diffs`) om een npm-pakket met dezelfde naam te installeren.

  </Accordion>
  <Accordion title="Git repositories">
    Gebruik `git:<repo>` om direct vanuit een git-repository te installeren. Ondersteunde vormen zijn onder meer `git:github.com/owner/repo`, `git:owner/repo`, volledige `https://`-, `ssh://`-, `git://`-, `file://`- en `git@host:owner/repo.git`-clone-URL's. Voeg `@<ref>` of `#<ref>` toe om vóór installatie een branch, tag of commit uit te checken.

    Git-installaties clonen naar een tijdelijke directory, checken de gevraagde ref uit wanneer die aanwezig is, en gebruiken daarna het normale installatieprogramma voor plugindirectory's. Dat betekent dat manifestvalidatie, scanning op gevaarlijke code, installatiewerk van de package manager en installatierecords zich gedragen zoals bij npm-installaties. Vastgelegde git-installaties bevatten de bron-URL/ref plus de resolved commit, zodat `openclaw plugins update` de bron later opnieuw kan resolven.

    Gebruik na installatie vanuit git `openclaw plugins inspect <id> --runtime --json` om runtimeregistraties zoals Gateway-methoden en CLI-opdrachten te verifiëren. Als de plugin een CLI-root heeft geregistreerd met `api.registerCli`, voer die opdracht dan direct uit via de root-CLI van OpenClaw, bijvoorbeeld `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Ondersteunde archieven: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-pluginarchieven moeten een geldige `openclaw.plugin.json` bevatten in de geëxtraheerde pluginroot; archieven die alleen `package.json` bevatten, worden geweigerd voordat OpenClaw installatierecords schrijft.

    Gebruik `npm-pack:<path.tgz>` wanneer het bestand een npm-pack-tarball is en u hetzelfde beheerde npm-root-installatiepad wilt testen dat door registry-installaties wordt gebruikt, inclusief verificatie van `package-lock.json`, scanning van gehoste afhankelijkheden en npm-installatierecords. Platte archiefpaden installeren nog steeds als lokale archieven onder de pluginextensions-root.

    Claude marketplace-installaties worden ook ondersteund.

  </Accordion>
</AccordionGroup>

ClawHub-installaties gebruiken een expliciete `clawhub:<package>`-locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Kale npm-veilige pluginspecs installeren tijdens de launch-cutover standaard vanaf npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gebruik `npm:` om npm-only-resolutie expliciet te maken:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controleert vóór installatie de geadverteerde Plugin-API / minimale Gateway-compatibiliteit. Wanneer de geselecteerde ClawHub-versie een ClawPack-artefact publiceert, downloadt OpenClaw de geversioneerde npm-pack `.tgz`, verifieert de ClawHub-digestheader en de artefactdigest, en installeert het vervolgens via het normale archiefpad. Oudere ClawHub-versies zonder ClawPack-metadata worden nog steeds geïnstalleerd via het oude verificatiepad voor pakketarchieven. Vastgelegde installaties behouden hun ClawHub-bronmetadata, artefacttype, npm-integriteit, npm-shasum, tarballnaam en ClawPack-digestfeiten voor latere updates.
Niet-geversioneerde ClawHub-installaties behouden een niet-geversioneerde vastgelegde specificatie zodat `openclaw plugins update` nieuwere ClawHub-releases kan volgen; expliciete versie- of tagselectoren zoals `clawhub:pkg@1.2.3` en `clawhub:pkg@beta` blijven vastgezet op die selector.

#### Marktplaats-verkorte notatie

Gebruik de verkorte notatie `plugin@marketplace` wanneer de marktplaatsnaam bestaat in Claude's lokale registrycache op `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Gebruik `--marketplace` wanneer je de marktplaatsbron expliciet wilt doorgeven:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marktplaatsbronnen">
    - een Claude-naam voor een bekende marktplaats uit `~/.claude/plugins/known_marketplaces.json`
    - een lokale marktplaatsroot of `marketplace.json`-pad
    - een GitHub-repoverkorte notatie zoals `owner/repo`
    - een GitHub-repo-URL zoals `https://github.com/owner/repo`
    - een git-URL

  </Tab>
  <Tab title="Regels voor externe marktplaatsen">
    Voor externe marktplaatsen die vanaf GitHub of git worden geladen, moeten Plugin-vermeldingen binnen de gekloonde marktplaatsrepo blijven. OpenClaw accepteert relatieve padbronnen uit die repo en weigert HTTP(S)-, absolute-pad-, git-, GitHub- en andere niet-pad-Plugin-bronnen uit externe manifests.
  </Tab>
</Tabs>

Voor lokale paden en archieven detecteert OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-compatibele bundels (`.codex-plugin/plugin.json`)
- Claude-compatibele bundels (`.claude-plugin/plugin.json` of de standaard Claude-componentindeling)
- Cursor-compatibele bundels (`.cursor-plugin/plugin.json`)

<Note>
Compatibele bundels worden geïnstalleerd in de normale Plugin-root en nemen deel aan dezelfde list/info/enable/disable-flow. Momenteel worden bundel-Skills, Claude-command-Skills, Claude-standaardwaarden voor `settings.json`, Claude `.lsp.json` / via manifest gedeclareerde standaardwaarden voor `lspServers`, Cursor-command-Skills en compatibele Codex-hookdirectories ondersteund; andere gedetecteerde bundelcapaciteiten worden getoond in diagnostics/info maar zijn nog niet gekoppeld aan runtime-uitvoering.
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
  Toon alleen ingeschakelde Plugins.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Schakel over van de tabelweergave naar detailregels per Plugin met bron/herkomst/versie/activatiemetadata.
</ParamField>
<ParamField path="--json" type="boolean">
  Machinaal leesbare inventaris plus registrydiagnostiek en installatiestatus van pakketafhankelijkheden.
</ParamField>

<Note>
`plugins list` leest eerst de blijvend opgeslagen lokale Plugin-registry, met een alleen-uit-manifest-afgeleide fallback wanneer de registry ontbreekt of ongeldig is. Dit is nuttig om te controleren of een Plugin is geïnstalleerd, ingeschakeld en zichtbaar is voor cold-startplanning, maar het is geen live runtime-probe van een al draaiend Gateway-proces. Start na het wijzigen van Plugin-code, inschakeling, hookbeleid of `plugins.load.paths` de Gateway opnieuw die het kanaal bedient voordat je verwacht dat nieuwe `register(api)`-code of hooks draaien. Controleer bij externe/containerdeployments dat je het daadwerkelijke `openclaw gateway run`-child opnieuw start, niet alleen een wrapperproces.

`plugins list --json` bevat de `dependencyStatus` van elke Plugin uit `package.json`
`dependencies` en `optionalDependencies`. OpenClaw controleert of die pakketnamen
aanwezig zijn langs het normale Node `node_modules`-lookup-pad van de Plugin; het
importeert geen Plugin-runtimecode, voert geen package manager uit en repareert
geen ontbrekende afhankelijkheden.
</Note>

`plugins search` is een externe ClawHub-cataloguslookup. Het inspecteert geen lokale
staat, wijzigt geen config, installeert geen pakketten en laadt geen Plugin-runtimecode. Zoek
resultaten bevatten de ClawHub-pakketnaam, familie, kanaal, versie, samenvatting en
een installatietip zoals `openclaw plugins install clawhub:<package>`.

Voor werk aan gebundelde Plugins binnen een verpakte Docker-image, bind-mount je de
Plugin-brondirectory over het overeenkomende verpakte bronpad, zoals
`/app/extensions/synology-chat`. OpenClaw ontdekt die gemounte bronoverlay
vóór `/app/dist/extensions/synology-chat`; een gewoon gekopieerde bron
directory blijft inert, zodat normale verpakte installaties nog steeds gecompileerde dist gebruiken.

Voor runtime-hookdebugging:

- `openclaw plugins inspect <id> --runtime --json` toont geregistreerde hooks en diagnostiek uit een inspectiepass waarbij de module is geladen. Runtime-inspectie installeert nooit afhankelijkheden; gebruik `openclaw doctor --fix` om oude afhankelijkheidsstaat op te schonen of ontbrekende downloadbare Plugins te herstellen waarnaar config verwijst.
- `openclaw gateway status --deep --require-rpc` bevestigt de bereikbare Gateway, service-/proceshints, configpad en RPC-gezondheid.
- Niet-gebundelde conversatiehooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) vereisen `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gebruik `--link` om het kopiëren van een lokale directory te vermijden (voegt toe aan `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wordt niet ondersteund met `--link`, omdat gekoppelde installaties het bronpad hergebruiken in plaats van over een beheerd installatiedoel te kopiëren.

Gebruik `--pin` bij npm-installaties om de opgeloste exacte specificatie (`name@version`) op te slaan in de beheerde Plugin-index, terwijl het standaardgedrag niet-vastgezet blijft.
</Note>

### Plugin-index

Plugin-installatiemetadata is door machines beheerde staat, geen gebruikersconfig. Installaties en updates schrijven dit naar `plugins/installs.json` onder de actieve OpenClaw-statedirectory. De top-level `installRecords`-map is de duurzame bron van installatiemetadata, inclusief records voor kapotte of ontbrekende Plugin-manifests. De `plugins`-array is de uit manifest afgeleide koude registrycache. Het bestand bevat een waarschuwing om het niet te bewerken en wordt gebruikt door `openclaw plugins update`, uninstall, diagnostiek en de koude Plugin-registry.

Wanneer OpenClaw meegeleverde oude `plugins.installs`-records in config ziet, behandelen runtime-lezingen ze als compatibiliteitsinput zonder `openclaw.json` te herschrijven. Expliciete Plugin-writes en `openclaw doctor --fix` verplaatsen die records naar de Plugin-index en verwijderen de configsleutel wanneer config-writes zijn toegestaan; als een van beide writes faalt, blijven de configrecords behouden zodat de installatiemetadata niet verloren gaat.

### Verwijderen

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` verwijdert Plugin-records uit `plugins.entries`, de blijvend opgeslagen Plugin-index, Plugin-allow/deny-listvermeldingen en gekoppelde `plugins.load.paths`-vermeldingen wanneer van toepassing. Tenzij `--keep-files` is ingesteld, verwijdert uninstall ook de bijgehouden beheerde installatiedirectory wanneer die zich binnen OpenClaw's Plugin-extensionsroot bevindt. Voor Active Memory-Plugins wordt het geheugenslot teruggezet naar `memory-core`.

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

Updates zijn van toepassing op bijgehouden Plugin-installaties in de beheerde Plugin-index en bijgehouden hook-pack-installaties in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Plugin-id versus npm-specificatie oplossen">
    Wanneer je een Plugin-id doorgeeft, hergebruikt OpenClaw de vastgelegde installatiespecificatie voor die Plugin. Dat betekent dat eerder opgeslagen dist-tags zoals `@beta` en exacte vastgezette versies bij latere `update <id>`-runs gebruikt blijven worden.

    Voor npm-installaties kun je ook een expliciete npm-pakketspecificatie met een dist-tag of exacte versie doorgeven. OpenClaw koppelt die pakketnaam terug aan het bijgehouden Plugin-record, werkt die geïnstalleerde Plugin bij en legt de nieuwe npm-specificatie vast voor toekomstige op id gebaseerde updates.

    Het doorgeven van de npm-pakketnaam zonder versie of tag wordt ook teruggekoppeld aan het bijgehouden Plugin-record. Gebruik dit wanneer een Plugin was vastgezet op een exacte versie en je deze wilt terugzetten naar de standaard releaselijn van de registry.

  </Accordion>
  <Accordion title="Updates via het bètakanaal">
    `openclaw plugins update` hergebruikt de bijgehouden Plugin-specificatie tenzij je een nieuwe specificatie doorgeeft. `openclaw update` kent daarnaast het actieve OpenClaw-updatekanaal: op het bètakanaal proberen npm- en ClawHub-Plugin-records uit de standaardlijn eerst `@beta`, en vallen daarna terug op de vastgelegde standaard-/latest-specificatie als er geen Plugin-bètarelease bestaat. Exacte versies en expliciete tags blijven vastgezet op die selector.

  </Accordion>
  <Accordion title="Versiecontroles en integriteitsdrift">
    Vóór een live npm-update controleert OpenClaw de geïnstalleerde pakketversie tegen de metadata van de npm-registry. Als de geïnstalleerde versie en vastgelegde artefactidentiteit al overeenkomen met het opgeloste doel, wordt de update overgeslagen zonder downloaden, opnieuw installeren of `openclaw.json` herschrijven.

    Wanneer een opgeslagen integriteitshash bestaat en de opgehaalde artefacthash verandert, behandelt OpenClaw dat als npm-artefactdrift. Het interactieve commando `openclaw plugins update` drukt de verwachte en werkelijke hashes af en vraagt om bevestiging voordat het doorgaat. Niet-interactieve updatehelpers falen gesloten tenzij de aanroeper een expliciet vervolgbeleid aanlevert.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install bij update">
    `--dangerously-force-unsafe-install` is ook beschikbaar bij `plugins update` als break-glass-override voor vals-positieven in de ingebouwde dangerous-code-scan tijdens Plugin-updates. Het omzeilt nog steeds geen Plugin-`before_install`-beleidsblokkades of scan-failure-blokkering, en is alleen van toepassing op Plugin-updates, niet op hook-pack-updates.
  </Accordion>
</AccordionGroup>

### Inspecteren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect toont identiteit, laadstatus, bron, manifestcapaciteiten, beleidsvlaggen, diagnostiek, installatiemetadata, bundelcapaciteiten en eventueel gedetecteerde MCP- of LSP-serverondersteuning zonder standaard Plugin-runtime te importeren. Voeg `--runtime` toe om de Plugin-module te laden en geregistreerde hooks, tools, commando's, services, gatewaymethoden en HTTP-routes op te nemen. Runtime-inspectie rapporteert ontbrekende Plugin-afhankelijkheden direct; installaties en reparaties blijven in `openclaw plugins install`, `openclaw plugins update` en `openclaw doctor --fix`.

Door Plugins beheerde CLI-commando's worden geïnstalleerd als root-`openclaw`-commandogroepen. Nadat `inspect --runtime` een commando onder `cliCommands` toont, voer je het uit als `openclaw <command> ...`; bijvoorbeeld een Plugin die `demo-git` registreert, kan worden geverifieerd met `openclaw demo-git ping`.

Elke Plugin wordt geclassificeerd op basis van wat deze daadwerkelijk registreert tijdens runtime:

- **plain-capability** — één mogelijkheidstype (bijv. een plugin die alleen een provider is)
- **hybrid-capability** — meerdere mogelijkheidstypen (bijv. tekst + spraak + afbeeldingen)
- **hook-only** — alleen hooks, geen mogelijkheden of oppervlakken
- **non-capability** — tools/opdrachten/services maar geen mogelijkheden

Zie [Plugin-vormen](/nl/plugins/architecture#plugin-shapes) voor meer over het mogelijkhedenmodel.

<Note>
De vlag `--json` voert een machineleesbaar rapport uit dat geschikt is voor scripting en auditing. `inspect --all` rendert een tabel voor de hele fleet met kolommen voor vorm, mogelijkheidstypen, compatibiliteitsmeldingen, bundelmogelijkheden en hooksamenvatting. `info` is een alias voor `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` rapporteert laadfouten van plugins, manifest-/discoverydiagnostiek en compatibiliteitsmeldingen. Wanneer alles schoon is, wordt `No plugin issues detected.` afgedrukt.

Als een geconfigureerde plugin op schijf aanwezig is maar wordt geblokkeerd door de padveiligheidscontroles van de loader, behoudt config-validatie de pluginvermelding en rapporteert deze als `present but blocked`. Los de voorgaande diagnostiek voor de geblokkeerde plugin op, zoals padeigenaarschap of wereldwijd schrijfbare machtigingen, in plaats van de config `plugins.entries.<id>` of `plugins.allow` te verwijderen.

Voor modulevormfouten zoals ontbrekende exports `register`/`activate`, voer opnieuw uit met `OPENCLAW_PLUGIN_LOAD_DEBUG=1` om een compacte samenvatting van de exportvorm op te nemen in de diagnostische uitvoer.

### Register

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Het lokale pluginregister is het persistente cold-readmodel van OpenClaw voor geïnstalleerde pluginidentiteit, inschakeling, bronmetadata en eigenaarschap van bijdragen. Normaal opstarten, provider-eigenaarsopzoeking, classificatie van kanaalinstellingen en plugininventaris kunnen dit lezen zonder runtime-modules van plugins te importeren.

Gebruik `plugins registry` om te inspecteren of het persistente register aanwezig, actueel of verouderd is. Gebruik `--refresh` om het opnieuw op te bouwen vanuit de persistente pluginindex, het configbeleid en manifest-/pakketmetadata. Dit is een herstelpad, geen runtime-activeringspad.

`openclaw doctor --fix` herstelt ook beheerde npm-drift naast het register: als een verweesd of hersteld pakket `@openclaw/*` onder de beheerde plugin-npm-root een gebundelde plugin overschaduwt, verwijdert doctor dat verouderde pakket en bouwt het register opnieuw op zodat het opstarten valideert tegen het gebundelde manifest.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` is een verouderde break-glass-compatibiliteitsschakelaar voor leesfouten van het register. Geef de voorkeur aan `plugins registry --refresh` of `openclaw doctor --fix`; de env-fallback is alleen bedoeld voor noodherstel van het opstarten terwijl de migratie wordt uitgerold.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace-list accepteert een lokaal marketplacepad, een pad naar `marketplace.json`, een GitHub-shorthand zoals `owner/repo`, een GitHub-repo-URL of een git-URL. `--json` drukt het opgeloste bronlabel af plus het geparste marketplace-manifest en de pluginvermeldingen.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [CLI-referentie](/nl/cli)
- [Communityplugins](/nl/plugins/community)
