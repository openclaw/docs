---
read_when:
    - Je wilt Gateway-plugins of compatibele bundels installeren of beheren
    - Je wilt fouten bij het laden van plugins debuggen
sidebarTitle: Plugins
summary: CLI-referentie voor `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-06T11:28:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: c888d3fc8de0e25edc1c38f679d522a4e75cb09d986702451e29418d70a939f2
    source_path: cli/plugins.md
    workflow: 16
---

Beheer Gateway-plugins, hook-packs en compatibele bundels.

<CardGroup cols={2}>
  <Card title="Pluginsysteem" href="/nl/tools/plugin">
    Eindgebruikershandleiding voor het installeren, inschakelen en oplossen van problemen met plugins.
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

Voor onderzoek naar trage installatie, inspectie, verwijdering of registerverversing voer je de
opdracht uit met `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. De trace schrijft fasetimings
naar stderr en houdt JSON-uitvoer parseerbaar. Zie [Foutopsporing](/nl/help/debugging#plugin-lifecycle-trace).

<Note>
Gebundelde plugins worden met OpenClaw meegeleverd. Sommige zijn standaard ingeschakeld (bijvoorbeeld gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browser-plugin); andere vereisen `plugins enable`.

Native OpenClaw-plugins moeten `openclaw.plugin.json` meeleveren met een inline JSON Schema (`configSchema`, zelfs als dit leeg is). Compatibele bundels gebruiken in plaats daarvan hun eigen bundelmanifesten.

`plugins list` toont `Format: openclaw` of `Format: bundle`. Uitvoer van uitgebreide lijst/info toont ook het bundelsubtype (`codex`, `claude` of `cursor`) plus gedetecteerde bundelcapaciteiten.
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
Kale pakketnamen installeren standaard vanuit npm tijdens de lanceringsovergang. Gebruik `clawhub:<package>` voor ClawHub. Behandel plugin-installaties alsof je code uitvoert. Geef de voorkeur aan vastgepinde versies.
</Warning>

`plugins search` doorzoekt ClawHub naar installeerbare plugin-pakketten en toont
pakketnamen die klaar zijn voor installatie. Het zoekt naar code-plugin- en bundel-plugin-pakketten,
niet naar skills. Gebruik `openclaw skills search` voor ClawHub-skills.

<Note>
ClawHub is het primaire distributie- en ontdekkingsoppervlak voor de meeste plugins. Npm
blijft een ondersteunde fallback en route voor directe installatie. Plugin-pakketten van OpenClaw
`@openclaw/*` worden weer op npm gepubliceerd; zie de huidige lijst
op [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) of de
[plugin-inventaris](/nl/plugins/plugin-inventory). Stabiele installaties gebruiken `latest`.
Installaties en updates via het bètakanaal geven de voorkeur aan de npm `beta` dist-tag wanneer die tag
beschikbaar is, en vallen daarna terug op `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Configuratie-includes en herstel van ongeldige configuratie">
    Als je `plugins`-sectie wordt ondersteund door een enkelbestand `$include`, schrijven `plugins install/update/enable/disable/uninstall` door naar dat opgenomen bestand en laten ze `openclaw.json` ongemoeid. Root-includes, include-arrays en includes met naastliggende overschrijvingen falen gesloten in plaats van te flattenen. Zie [Configuratie-includes](/nl/gateway/configuration) voor de ondersteunde vormen.

    Als de configuratie tijdens installatie ongeldig is, faalt `plugins install` normaal gesproken gesloten en zegt het dat je eerst `openclaw doctor --fix` moet uitvoeren. Tijdens Gateway-opstart en hot reload faalt ongeldige plugin-configuratie gesloten zoals elke andere ongeldige configuratie; `openclaw doctor --fix` kan de ongeldige plugin-vermelding in quarantaine plaatsen. De enige gedocumenteerde uitzondering tijdens installatie is een smal herstelpad voor gebundelde plugins voor plugins die expliciet kiezen voor `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force en opnieuw installeren versus bijwerken">
    `--force` hergebruikt het bestaande installatiedoel en overschrijft een reeds geïnstalleerde plugin of hook-pack ter plekke. Gebruik dit wanneer je opzettelijk dezelfde id opnieuw installeert vanuit een nieuw lokaal pad, archief, ClawHub-pakket of npm-artefact. Voor routinematige upgrades van een al gevolgde npm-plugin geef je de voorkeur aan `openclaw plugins update <id-or-npm-spec>`.

    Als je `plugins install` uitvoert voor een plugin-id die al is geïnstalleerd, stopt OpenClaw en wijst het je op `plugins update <id-or-npm-spec>` voor een normale upgrade, of op `plugins install <package> --force` wanneer je de huidige installatie echt vanuit een andere bron wilt overschrijven.

  </Accordion>
  <Accordion title="Bereik van --pin">
    `--pin` geldt alleen voor npm-installaties. Het wordt niet ondersteund met `git:`-installaties; gebruik een expliciete git-ref zoals `git:github.com/acme/plugin@v1.2.3` wanneer je een vastgepinde bron wilt. Het wordt niet ondersteund met `--marketplace`, omdat marketplace-installaties marketplace-bronmetadata bewaren in plaats van een npm-specificatie.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` is een noodoptie voor fout-positieven in de ingebouwde scanner voor gevaarlijke code. Hiermee kan de installatie doorgaan zelfs wanneer de ingebouwde scanner `critical`-bevindingen meldt, maar dit omzeilt **niet** beleidsblokkades van plugin-`before_install`-hooks en omzeilt **niet** scanfouten.

    Deze CLI-vlag geldt voor plugin-installatie- en updateflows. Gateway-gestuurde skill-afhankelijkheidsinstallaties gebruiken de bijbehorende `dangerouslyForceUnsafeInstall`-request-override, terwijl `openclaw skills install` een afzonderlijke download-/installatieflow voor ClawHub-skills blijft.

    Als een plugin die je op ClawHub hebt gepubliceerd wordt geblokkeerd door een registerscan, gebruik dan de uitgeversstappen in [ClawHub](/nl/tools/clawhub).

  </Accordion>
  <Accordion title="Hook-packs en npm-specificaties">
    `plugins install` is ook het installatieoppervlak voor hook-packs die `openclaw.hooks` in `package.json` blootstellen. Gebruik `openclaw hooks` voor gefilterde hook-zichtbaarheid en inschakeling per hook, niet voor pakketinstallatie.

    Npm-specificaties zijn **alleen-register** (pakketnaam + optionele **exacte versie** of **dist-tag**). Git-/URL-/bestandsspecificaties en semver-bereiken worden geweigerd. Afhankelijkheidsinstallaties worden projectlokaal uitgevoerd met `--ignore-scripts` voor veiligheid, zelfs wanneer je shell globale npm-installatie-instellingen heeft. Beheerde npm-roots voor plugins erven de npm-`overrides` op pakketniveau van OpenClaw, zodat hostbeveiligingspins ook gelden voor gehesen plugin-afhankelijkheden.

    Gebruik `npm:<package>` wanneer je npm-resolutie expliciet wilt maken. Kale pakketspecificaties installeren tijdens de lanceringsovergang ook rechtstreeks vanuit npm.

    Kale specificaties en `@latest` blijven op het stabiele spoor. OpenClaw-correctieversies met datumstempel zoals `2026.5.3-1` zijn stabiele releases voor deze controle. Als npm een van die twee naar een prerelease resolveert, stopt OpenClaw en vraagt het je expliciet te kiezen met een prerelease-tag zoals `@beta`/`@rc` of een exacte prereleaseversie zoals `@1.2.3-beta.4`.

    Als een kale installatiespecificatie overeenkomt met een officiële plugin-id (bijvoorbeeld `diffs`), installeert OpenClaw de catalogusvermelding rechtstreeks. Gebruik een expliciete scoped specificatie (bijvoorbeeld `@scope/diffs`) om een npm-pakket met dezelfde naam te installeren.

  </Accordion>
  <Accordion title="Git-repository's">
    Gebruik `git:<repo>` om rechtstreeks vanuit een git-repository te installeren. Ondersteunde vormen zijn onder andere `git:github.com/owner/repo`, `git:owner/repo`, volledige `https://`-, `ssh://`-, `git://`-, `file://`- en `git@host:owner/repo.git`-clone-URL's. Voeg `@<ref>` of `#<ref>` toe om een branch, tag of commit uit te checken vóór installatie.

    Git-installaties clonen naar een tijdelijke directory, checken de gevraagde ref uit wanneer aanwezig en gebruiken daarna het normale installatieprogramma voor plugin-directories. Dat betekent dat manifestvalidatie, scanning op gevaarlijke code, installatiewerk van pakketbeheerders en installatierecords zich gedragen zoals bij npm-installaties. Opgenomen git-installaties bevatten de bron-URL/ref plus de opgeloste commit, zodat `openclaw plugins update` de bron later opnieuw kan resolven.

    Gebruik na installatie vanuit git `openclaw plugins inspect <id> --runtime --json` om runtime-registraties zoals gateway-methoden en CLI-opdrachten te verifiëren. Als de plugin een CLI-root heeft geregistreerd met `api.registerCli`, voer die opdracht dan rechtstreeks uit via de OpenClaw-root-CLI, bijvoorbeeld `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archieven">
    Ondersteunde archieven: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-pluginarchieven moeten een geldige `openclaw.plugin.json` bevatten in de uitgepakte plugin-root; archieven die alleen `package.json` bevatten, worden geweigerd voordat OpenClaw installatierecords schrijft.

    Gebruik `npm-pack:<path.tgz>` wanneer het bestand een npm-pack-tarball is en je
    hetzelfde beheerde npm-root-installatiepad wilt testen dat door registerinstallaties wordt gebruikt,
    inclusief verificatie van `package-lock.json`, scanning van gehesen afhankelijkheden en
    npm-installatierecords. Gewone archiefpaden installeren nog steeds als lokale archieven
    onder de plugin-extensieroot.

    Claude-marketplace-installaties worden ook ondersteund.

  </Accordion>
</AccordionGroup>

ClawHub-installaties gebruiken een expliciete `clawhub:<package>`-locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Kale npm-veilige plugin-specificaties installeren tijdens de lanceringsovergang standaard vanuit npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gebruik `npm:` om npm-only-resolutie expliciet te maken:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controleert de geadverteerde plugin-API / minimale gateway-compatibiliteit vóór installatie. Wanneer de geselecteerde ClawHub-versie een ClawPack-artefact publiceert, downloadt OpenClaw de geversioneerde npm-pack `.tgz`, verifieert het de ClawHub-digest-header en de artefact-digest, en installeert het dit vervolgens via het normale archiefpad. Oudere ClawHub-versies zonder ClawPack-metadata installeren nog steeds via het legacy verificatiepad voor pakketarchieven. Opgenomen installaties bewaren hun ClawHub-bronmetadata, artefactsoort, npm-integriteit, npm-shasum, tarballnaam en ClawPack-digestfeiten voor latere updates.
Ongeversioneerde ClawHub-installaties bewaren een ongeversioneerde opgenomen specificatie zodat `openclaw plugins update` nieuwere ClawHub-releases kan volgen; expliciete versie- of tagselectors zoals `clawhub:pkg@1.2.3` en `clawhub:pkg@beta` blijven vastgepind op die selector.

#### Marketplace-stenografie

Gebruik de stenografie `plugin@marketplace` wanneer de marketplace-naam bestaat in Claude's lokale registercache op `~/.claude/plugins/known_marketplaces.json`:

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
    - een bij Claude bekende marketplace-naam uit `~/.claude/plugins/known_marketplaces.json`
    - een lokale marketplace-root of `marketplace.json`-pad
    - een GitHub-repoverkorting zoals `owner/repo`
    - een GitHub-repo-URL zoals `https://github.com/owner/repo`
    - een git-URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Voor externe marketplaces die vanuit GitHub of git worden geladen, moeten plugin-vermeldingen binnen de gekloonde marketplace-repo blijven. OpenClaw accepteert relatieve padbronnen uit die repo en weigert HTTP(S), absolute paden, git, GitHub en andere niet-pad-pluginbronnen uit externe manifests.
  </Tab>
</Tabs>

Voor lokale paden en archieven detecteert OpenClaw automatisch:

- native OpenClaw-plugins (`openclaw.plugin.json`)
- Codex-compatibele bundels (`.codex-plugin/plugin.json`)
- Claude-compatibele bundels (`.claude-plugin/plugin.json` of de standaard Claude-componentindeling)
- Cursor-compatibele bundels (`.cursor-plugin/plugin.json`)

<Note>
Compatibele bundels worden in de normale plugin-root geïnstalleerd en nemen deel aan dezelfde list/info/enable/disable-flow. Momenteel worden bundle-skills, Claude command-skills, standaardwaarden voor Claude `settings.json`, standaardwaarden voor Claude `.lsp.json` / via manifest gedeclareerde `lspServers`, Cursor command-skills en compatibele Codex hook-mappen ondersteund; andere gedetecteerde bundle-mogelijkheden worden weergegeven in diagnostics/info, maar zijn nog niet gekoppeld aan runtime-uitvoering.
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
  Machineleesbare inventaris plus registry-diagnostiek en installatiestatus van pakketafhankelijkheden.
</ParamField>

<Note>
`plugins list` leest eerst de opgeslagen lokale plugin-registry, met een alleen-uit-manifest afgeleide fallback wanneer de registry ontbreekt of ongeldig is. Dit is nuttig om te controleren of een plugin is geïnstalleerd, ingeschakeld en zichtbaar is voor planning bij koude start, maar het is geen live runtime-probe van een al actief Gateway-proces. Start na het wijzigen van plugin-code, inschakeling, hook-beleid of `plugins.load.paths` de Gateway opnieuw die het kanaal bedient voordat je verwacht dat nieuwe `register(api)`-code of hooks worden uitgevoerd. Controleer bij externe/container-deployments dat je het werkelijke onderliggende `openclaw gateway run`-proces opnieuw start, niet alleen een wrapper-proces.

`plugins list --json` bevat de `dependencyStatus` van elke plugin uit `package.json`
`dependencies` en `optionalDependencies`. OpenClaw controleert of die pakketnamen
aanwezig zijn langs het normale Node `node_modules`-opzoekpad van de plugin; het
importeert geen runtime-code van plugins, voert geen pakketbeheerder uit en repareert
ontbrekende afhankelijkheden niet.
</Note>

`plugins search` is een externe ClawHub-cataloguslookup. Het inspecteert geen lokale
status, wijzigt geen configuratie, installeert geen pakketten en laadt geen runtime-code van plugins. Zoekresultaten bevatten de ClawHub-pakketnaam, familie, kanaal, versie, samenvatting en
een installatietip zoals `openclaw plugins install clawhub:<package>`.

Voor werk aan meegeleverde plugins binnen een verpakte Docker-image kun je de plugin-bronmap
als bind-mount koppelen over het bijbehorende verpakte bronpad, zoals
`/app/extensions/synology-chat`. OpenClaw ontdekt die gekoppelde bron-overlay
vóór `/app/dist/extensions/synology-chat`; een gewone gekopieerde bronmap
blijft inert, zodat normale verpakte installaties nog steeds de gecompileerde dist gebruiken.

Voor runtime-hook-debugging:

- `openclaw plugins inspect <id> --runtime --json` toont geregistreerde hooks en diagnostiek van een inspectiepass waarbij de module is geladen. Runtime-inspectie installeert nooit afhankelijkheden; gebruik `openclaw doctor --fix` om legacy-afhankelijkheidsstatus op te schonen of ontbrekende downloadbare plugins te herstellen waarnaar in config wordt verwezen.
- `openclaw gateway status --deep --require-rpc` bevestigt de bereikbare Gateway, service-/proceshints, het configpad en de RPC-gezondheid.
- Niet-meegeleverde gesprekshooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) vereisen `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gebruik `--link` om het kopiëren van een lokale map te vermijden (voegt toe aan `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wordt niet ondersteund met `--link`, omdat gekoppelde installaties het bronpad hergebruiken in plaats van over een beheerd installatiedoel heen te kopiëren.

Gebruik `--pin` bij npm-installaties om de opgeloste exacte specificatie (`name@version`) op te slaan in de beheerde plugin-index, terwijl het standaardgedrag ongepind blijft.
</Note>

### Plugin-index

Installatiemetadata van plugins is machinebeheerde status, geen gebruikersconfiguratie. Installaties en updates schrijven dit naar `plugins/installs.json` onder de actieve OpenClaw-statusmap. De top-level `installRecords`-map is de duurzame bron van installatiemetadata, inclusief records voor kapotte of ontbrekende plugin-manifests. De `plugins`-array is de uit manifests afgeleide koude registry-cache. Het bestand bevat een waarschuwing om het niet te bewerken en wordt gebruikt door `openclaw plugins update`, uninstall, diagnostiek en de koude plugin-registry.

Wanneer OpenClaw meegeleverde legacy `plugins.installs`-records in config ziet, verplaatst het die naar de plugin-index en verwijdert het de configsleutel; als een van beide schrijfacties mislukt, blijven de configrecords behouden zodat de installatiemetadata niet verloren gaat.

### Verwijderen

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` verwijdert pluginrecords uit `plugins.entries`, de opgeslagen plugin-index, plugin-allow-/denylist-vermeldingen en gekoppelde `plugins.load.paths`-vermeldingen waar van toepassing. Tenzij `--keep-files` is ingesteld, verwijdert uninstall ook de gevolgde beheerde installatiemap wanneer die zich binnen de plugin-extensieroot van OpenClaw bevindt. Voor active-memory-plugins wordt het geheugenslot teruggezet naar `memory-core`.

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

Updates gelden voor gevolgde plugin-installaties in de beheerde plugin-index en gevolgde hook-pack-installaties in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Wanneer je een plugin-id doorgeeft, hergebruikt OpenClaw de vastgelegde installatiespecificatie voor die plugin. Dat betekent dat eerder opgeslagen dist-tags zoals `@beta` en exacte gepinde versies ook bij latere `update <id>`-runs gebruikt blijven worden.

    Voor npm-installaties kun je ook een expliciete npm-pakketspecificatie met een dist-tag of exacte versie doorgeven. OpenClaw lost die pakketnaam terug op naar het gevolgde pluginrecord, werkt die geïnstalleerde plugin bij en legt de nieuwe npm-specificatie vast voor toekomstige updates op basis van id.

    Het doorgeven van de npm-pakketnaam zonder versie of tag wordt ook terug opgelost naar het gevolgde pluginrecord. Gebruik dit wanneer een plugin op een exacte versie was gepind en je die wilt terugzetten naar de standaard releaselijn van de registry.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` hergebruikt de gevolgde pluginspecificatie tenzij je een nieuwe specificatie doorgeeft. `openclaw update` kent daarnaast het actieve OpenClaw-updatekanaal: op het bètakanaal proberen npm- en ClawHub-pluginrecords op de standaardlijn eerst `@beta` en vallen daarna terug op de vastgelegde standaard-/latest-specificatie als er geen bèta-release van de plugin bestaat. Exacte versies en expliciete tags blijven gepind aan die selector.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Vóór een live npm-update controleert OpenClaw de geïnstalleerde pakketversie tegen de metadata van de npm-registry. Als de geïnstalleerde versie en vastgelegde artifact-identiteit al overeenkomen met het opgeloste doel, wordt de update overgeslagen zonder te downloaden, opnieuw te installeren of `openclaw.json` te herschrijven.

    Wanneer een opgeslagen integriteitshash bestaat en de opgehaalde artifact-hash verandert, behandelt OpenClaw dat als npm-artifactdrift. De interactieve opdracht `openclaw plugins update` drukt de verwachte en werkelijke hashes af en vraagt om bevestiging voordat wordt doorgegaan. Niet-interactieve updatehelpers falen gesloten tenzij de aanroeper een expliciet vervolgbeleid opgeeft.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` is ook beschikbaar op `plugins update` als break-glass-override voor false positives van de ingebouwde scan op gevaarlijke code tijdens plugin-updates. Het omzeilt nog steeds geen plugin-`before_install`-beleidsblokkades of blokkades door scanfouten, en het geldt alleen voor plugin-updates, niet voor hook-pack-updates.
  </Accordion>
</AccordionGroup>

### Inspecteren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect toont identiteit, laadstatus, bron, manifestmogelijkheden, beleidsvlaggen, diagnostiek, installatiemetadata, bundle-mogelijkheden en alle gedetecteerde ondersteuning voor MCP- of LSP-servers zonder standaard runtime van plugins te importeren. Voeg `--runtime` toe om de plugin-module te laden en geregistreerde hooks, tools, opdrachten, services, gateway-methoden en HTTP-routes op te nemen. Runtime-inspectie rapporteert ontbrekende plugin-afhankelijkheden rechtstreeks; installaties en reparaties blijven in `openclaw plugins install`, `openclaw plugins update` en `openclaw doctor --fix`.

CLI-opdrachten die eigendom zijn van plugins worden geïnstalleerd als root-`openclaw`-opdrachtgroepen. Nadat `inspect --runtime` een opdracht onder `cliCommands` toont, voer je die uit als `openclaw <command> ...`; een plugin die bijvoorbeeld `demo-git` registreert, kan worden gecontroleerd met `openclaw demo-git ping`.

Elke plugin wordt geclassificeerd op basis van wat die daadwerkelijk bij runtime registreert:

- **plain-capability** — één type mogelijkheid (bijv. een provider-only-plugin)
- **hybrid-capability** — meerdere typen mogelijkheden (bijv. tekst + spraak + afbeeldingen)
- **hook-only** — alleen hooks, geen mogelijkheden of oppervlakken
- **non-capability** — tools/opdrachten/services maar geen mogelijkheden

Zie [Plugin-vormen](/nl/plugins/architecture#plugin-shapes) voor meer over het capability-model.

<Note>
De vlag `--json` voert een machineleesbaar rapport uit dat geschikt is voor scripts en audits. `inspect --all` rendert een vlootbrede tabel met kolommen voor vorm, capability-soorten, compatibiliteitsmeldingen, bundle-mogelijkheden en hook-samenvatting. `info` is een alias voor `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` rapporteert laadfouten van plugins, manifest-/discovery-diagnostiek en compatibiliteitsmeldingen. Wanneer alles schoon is, wordt `No plugin issues detected.` afgedrukt.

Als een geconfigureerde plugin op schijf aanwezig is maar door de padveiligheidscontroles van de loader wordt geblokkeerd, behoudt configvalidatie de plugin-vermelding en rapporteert die als `present but blocked`. Los de voorafgaande diagnose voor geblokkeerde plugins op, zoals padeigendom of world-writable permissies, in plaats van de config `plugins.entries.<id>` of `plugins.allow` te verwijderen.

Voor modulevormfouten zoals ontbrekende `register`/`activate`-exports voer je opnieuw uit met `OPENCLAW_PLUGIN_LOAD_DEBUG=1` om een compacte exportvormsamenvatting in de diagnostische uitvoer op te nemen.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Het lokale Plugin-register is het gepersisteerde koude leesmodel van OpenClaw voor geïnstalleerde Plugin-identiteit, inschakelstatus, bronmetadata en eigenaarschap van bijdragen. Normaal opstarten, opzoeken van provider-eigenaars, classificatie van kanaalconfiguratie en Plugin-inventaris kunnen het lezen zonder Plugin-runtime-modules te importeren.

Gebruik `plugins registry` om te controleren of het gepersisteerde register aanwezig, actueel of verouderd is. Gebruik `--refresh` om het opnieuw op te bouwen op basis van de gepersisteerde Plugin-index, het configuratiebeleid en manifest-/pakketmetadata. Dit is een herstelpad, geen runtime-activeringspad.

`openclaw doctor --fix` herstelt ook door beheerde npm veroorzaakte drift rond het register: als een verweesd of hersteld `@openclaw/*`-pakket onder de beheerde Plugin-npm-root een gebundelde Plugin overschaduwt, verwijdert doctor dat verouderde pakket en bouwt het register opnieuw op zodat opstarten wordt gevalideerd tegen het gebundelde manifest.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` is een verouderde break-glass-compatibiliteitsschakelaar voor leesfouten in het register. Geef de voorkeur aan `plugins registry --refresh` of `openclaw doctor --fix`; de env-fallback is alleen bedoeld voor noodherstel van het opstarten terwijl de migratie wordt uitgerold.
</Warning>

### Marktplaats

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

De marktplaatslijst accepteert een lokaal marktplaatspad, een `marketplace.json`-pad, een GitHub-afkorting zoals `owner/repo`, een GitHub-repo-URL of een git-URL. `--json` drukt het opgeloste bronlabel af, plus het geparsete marktplaatsmanifest en de Plugin-vermeldingen.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [CLI-referentie](/nl/cli)
- [Community-Plugins](/nl/plugins/community)
