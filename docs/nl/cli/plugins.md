---
read_when:
    - Je wilt Gateway-plugins of compatibele bundels installeren of beheren
    - Je wilt Plugin-laadfouten debuggen
sidebarTitle: Plugins
summary: CLI-referentie voor `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-11T20:27:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ad7d6341d6c2325bfef966b00ca1956f8b337fd0ffe40dba3384ed7eefd1285
    source_path: cli/plugins.md
    workflow: 16
---

Beheer Gateway plugins, hookpakketten en compatibele bundels.

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
    Beveiligingsverharding voor Plugin-installaties.
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

Voor onderzoek naar traag installeren, inspecteren, verwijderen of vernieuwen van de registry voer je de opdracht uit met `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. De trace schrijft fasetimings naar stderr en houdt JSON-uitvoer parsebaar. Zie [Foutopsporing](/nl/help/debugging#plugin-lifecycle-trace).

<Note>
In Nix-modus (`OPENCLAW_NIX_MODE=1`) zijn mutators voor de Plugin-levenscyclus uitgeschakeld. Gebruik in plaats van `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` of `plugins disable` de Nix-bron voor deze installatie; gebruik voor nix-openclaw de agent-first [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Gebundelde plugins worden met OpenClaw meegeleverd. Sommige zijn standaard ingeschakeld (bijvoorbeeld gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browserplugin); andere vereisen `plugins enable`.

Native OpenClaw plugins moeten `openclaw.plugin.json` leveren met een inline JSON Schema (`configSchema`, zelfs als dit leeg is). Compatibele bundels gebruiken in plaats daarvan hun eigen bundelmanifesten.

`plugins list` toont `Format: openclaw` of `Format: bundle`. Uitgebreide uitvoer van list/info toont ook het bundelsubtype (`codex`, `claude` of `cursor`) plus gedetecteerde bundelmogelijkheden.
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

Onderhouders die setup-time-installaties testen, kunnen automatische Plugin-installatiebronnen overschrijven met afgeschermde omgevingsvariabelen. Zie [Overschrijvingen voor Plugin-installaties](/nl/plugins/install-overrides).

<Warning>
Kale pakketnamen installeren tijdens de launch-cutover standaard vanaf npm. Gebruik `clawhub:<package>` voor ClawHub. Behandel Plugin-installaties alsof je code uitvoert. Geef de voorkeur aan vastgezette versies.
</Warning>

`plugins search` bevraagt ClawHub op installeerbare Plugin-pakketten en drukt pakketnamen af die direct te installeren zijn. Het zoekt code-plugin- en bundle-plugin-pakketten, geen Skills. Gebruik `openclaw skills search` voor ClawHub Skills.

<Note>
ClawHub is het primaire distributie- en ontdekkingsoppervlak voor de meeste plugins. Npm blijft een ondersteunde fallback en direct-installatiepad. OpenClaw-eigen `@openclaw/*` Plugin-pakketten worden weer op npm gepubliceerd; zie de huidige lijst op [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) of de [Plugin-inventaris](/nl/plugins/plugin-inventory). Stabiele installaties gebruiken `latest`. Installaties en updates via het betakanaal geven de voorkeur aan de npm `beta` dist-tag wanneer die tag beschikbaar is, en vallen daarna terug op `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Als je `plugins`-sectie wordt ondersteund door een single-file `$include`, schrijven `plugins install/update/enable/disable/uninstall` door naar dat opgenomen bestand en laten ze `openclaw.json` ongemoeid. Root-includes, include-arrays en includes met sibling-overrides falen gesloten in plaats van te flattenen. Zie [Config includes](/nl/gateway/configuration) voor de ondersteunde vormen.

    Als de configuratie ongeldig is tijdens installatie, faalt `plugins install` normaal gesproken gesloten en zegt het dat je eerst `openclaw doctor --fix` moet uitvoeren. Tijdens Gateway-startup en hot reload faalt ongeldige Plugin-configuratie gesloten zoals elke andere ongeldige configuratie; `openclaw doctor --fix` kan de ongeldige Plugin-vermelding in quarantaine plaatsen. De enige gedocumenteerde install-time-uitzondering is een smal herstelpad voor gebundelde plugins voor plugins die expliciet kiezen voor `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` hergebruikt het bestaande installatiedoel en overschrijft een al geinstalleerde Plugin of hookpakket ter plekke. Gebruik dit wanneer je bewust dezelfde id opnieuw installeert vanaf een nieuw lokaal pad, archief, ClawHub-pakket of npm-artefact. Geef voor routine-upgrades van een al gevolgde npm-Plugin de voorkeur aan `openclaw plugins update <id-or-npm-spec>`.

    Als je `plugins install` uitvoert voor een Plugin-id die al is geinstalleerd, stopt OpenClaw en wijst het je op `plugins update <id-or-npm-spec>` voor een normale upgrade, of op `plugins install <package> --force` wanneer je de huidige installatie echt vanuit een andere bron wilt overschrijven.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` geldt alleen voor npm-installaties. Het wordt niet ondersteund met `git:`-installaties; gebruik een expliciete git-ref zoals `git:github.com/acme/plugin@v1.2.3` wanneer je een vastgezette bron wilt. Het wordt niet ondersteund met `--marketplace`, omdat marketplace-installaties marketplace-bronmetadata bewaren in plaats van een npm-spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` is een break-glass-optie voor false positives in de ingebouwde scanner voor gevaarlijke code. Hiermee kan de installatie doorgaan, zelfs wanneer de ingebouwde scanner `critical`-bevindingen rapporteert, maar dit omzeilt **niet** de beleidsblokkades van Plugin-`before_install`-hooks en omzeilt **niet** scanfouten.

    Deze CLI-vlag geldt voor Plugin-installatie-/updateflows. Gateway-ondersteunde Skills-afhankelijkheidsinstallaties gebruiken de bijbehorende aanvraagoverride `dangerouslyForceUnsafeInstall`, terwijl `openclaw skills install` een aparte download-/installflow voor ClawHub Skills blijft.

    Als een Plugin die je op ClawHub hebt gepubliceerd wordt geblokkeerd door een registryscan, gebruik dan de publicatiestappen in [ClawHub](/nl/clawhub/security).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` is ook het installatieoppervlak voor hookpakketten die `openclaw.hooks` in `package.json` beschikbaar stellen. Gebruik `openclaw hooks` voor gefilterde zichtbaarheid van hooks en inschakeling per hook, niet voor pakketinstallatie.

    Npm-specs zijn **alleen registry** (pakketnaam + optionele **exacte versie** of **dist-tag**). Git-/URL-/file-specs en semver-ranges worden geweigerd. Afhankelijkheidsinstallaties draaien project-lokaal met `--ignore-scripts` voor veiligheid, zelfs wanneer je shell globale npm-installatie-instellingen heeft. Beheerde npm-roots van plugins erven OpenClaw's npm `overrides` op pakketniveau, zodat hostbeveiligingspins ook gelden voor gehesen Plugin-afhankelijkheden.

    Gebruik `npm:<package>` wanneer je npm-resolutie expliciet wilt maken. Kale pakketspecs installeren tijdens de launch-cutover ook rechtstreeks vanaf npm.

    Kale specs en `@latest` blijven op het stabiele spoor. OpenClaw-correctieversies met datumstempel, zoals `2026.5.3-1`, zijn stabiele releases voor deze controle. Als npm een van deze naar een prerelease resolveert, stopt OpenClaw en vraagt het je expliciet in te stemmen met een prerelease-tag zoals `@beta`/`@rc` of een exacte prereleaseversie zoals `@1.2.3-beta.4`.

    Als een kale installatiespec overeenkomt met een officiele Plugin-id (bijvoorbeeld `diffs`), installeert OpenClaw de catalogusvermelding rechtstreeks. Gebruik een expliciete scoped spec (bijvoorbeeld `@scope/diffs`) om een npm-pakket met dezelfde naam te installeren.

  </Accordion>
  <Accordion title="Git repositories">
    Gebruik `git:<repo>` om rechtstreeks vanuit een git-repository te installeren. Ondersteunde vormen zijn onder andere `git:github.com/owner/repo`, `git:owner/repo`, volledige `https://`, `ssh://`, `git://`, `file://` en `git@host:owner/repo.git` clone-URL's. Voeg `@<ref>` of `#<ref>` toe om een branch, tag of commit uit te checken voordat je installeert.

    Git-installaties clonen naar een tijdelijke directory, checken de gevraagde ref uit wanneer die aanwezig is en gebruiken daarna de normale installer voor Plugin-directories. Dat betekent dat manifestvalidatie, scanning op gevaarlijke code, package-manager-installatiewerk en installatierecords zich gedragen zoals bij npm-installaties. Vastgelegde git-installaties bevatten de bron-URL/ref plus de opgeloste commit, zodat `openclaw plugins update` de bron later opnieuw kan resolven.

    Gebruik na installatie vanuit git `openclaw plugins inspect <id> --runtime --json` om runtimeregistraties zoals gatewaymethoden en CLI-opdrachten te verifiëren. Als de Plugin een CLI-root heeft geregistreerd met `api.registerCli`, voer die opdracht dan rechtstreeks uit via de OpenClaw-root-CLI, bijvoorbeeld `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Ondersteunde archieven: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw Plugin-archieven moeten een geldige `openclaw.plugin.json` bevatten in de uitgepakte Plugin-root; archieven die alleen `package.json` bevatten, worden geweigerd voordat OpenClaw installatierecords schrijft.

    Gebruik `npm-pack:<path.tgz>` wanneer het bestand een npm-pack-tarball is en je
    hetzelfde beheerde npm-root-installatiepad wilt testen dat door registry-installaties wordt gebruikt,
    inclusief verificatie van `package-lock.json`, scanning van gehesen afhankelijkheden en
    npm-installatierecords. Platte archiefpaden installeren nog steeds als lokale archieven
    onder de plugin extensions-root.

    Claude marketplace-installaties worden ook ondersteund.

  </Accordion>
</AccordionGroup>

ClawHub-installaties gebruiken een expliciete locator `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Kale npm-veilige Plugin-specs installeren tijdens de launch-cutover standaard vanaf npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gebruik `npm:` om npm-only-resolutie expliciet te maken:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controleert de geadverteerde plugin-API / minimale Gateway-compatibiliteit vóór installatie. Wanneer de geselecteerde ClawHub-versie een ClawPack-artefact publiceert, downloadt OpenClaw de geversioneerde npm-pack `.tgz`, verifieert de ClawHub-digest-header en de artefact-digest en installeert het daarna via het normale archiefpad. Oudere ClawHub-versies zonder ClawPack-metadata installeren nog steeds via het verouderde verificatiepad voor pakketarchieven. Geregistreerde installaties bewaren hun ClawHub-bronmetadata, artefactsoort, npm-integriteit, npm-shasum, tarballnaam en ClawPack-digestgegevens voor latere updates.
Niet-geversioneerde ClawHub-installaties behouden een niet-geversioneerde geregistreerde spec zodat `openclaw plugins update` nieuwere ClawHub-releases kan volgen; expliciete versie- of tagselectoren zoals `clawhub:pkg@1.2.3` en `clawhub:pkg@beta` blijven vastgepind aan die selector.

#### Marketplace-shorthand

Gebruik `plugin@marketplace`-shorthand wanneer de marketplace-naam bestaat in de lokale registry-cache van Claude op `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="Marketplace-bronnen">
    - een bekende marketplace-naam van Claude uit `~/.claude/plugins/known_marketplaces.json`
    - een lokale marketplace-root of `marketplace.json`-pad
    - een GitHub-repo-shorthand zoals `owner/repo`
    - een GitHub-repo-URL zoals `https://github.com/owner/repo`
    - een git-URL

  </Tab>
  <Tab title="Regels voor externe marketplaces">
    Voor externe marketplaces die vanuit GitHub of git worden geladen, moeten plugin-items binnen de gekloonde marketplace-repo blijven. OpenClaw accepteert relatieve padbronnen uit die repo en weigert HTTP(S)-, absolute-pad-, git-, GitHub- en andere niet-pad-pluginbronnen uit externe manifests.
  </Tab>
</Tabs>

Voor lokale paden en archieven detecteert OpenClaw automatisch:

- native OpenClaw-plugins (`openclaw.plugin.json`)
- Codex-compatibele bundels (`.codex-plugin/plugin.json`)
- Claude-compatibele bundels (`.claude-plugin/plugin.json` of de standaard Claude-componentindeling)
- Cursor-compatibele bundels (`.cursor-plugin/plugin.json`)

<Note>
Compatibele bundels worden geïnstalleerd in de normale plugin-root en nemen deel aan dezelfde list/info/enable/disable-flow. Momenteel worden bundel-skills, Claude-command-skills, Claude-standaarden voor `settings.json`, Claude-standaarden voor `.lsp.json` / door het manifest gedeclareerde `lspServers`, Cursor-command-skills en compatibele Codex-hookdirectory's ondersteund; andere gedetecteerde bundelmogelijkheden worden weergegeven in diagnostiek/info, maar zijn nog niet aangesloten op runtime-uitvoering.
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
  Schakel over van de tabelweergave naar detailregels per plugin met bron-/oorsprong-/versie-/activeringsmetadata.
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare inventaris plus registry-diagnostiek en installatiestatus van pakketafhankelijkheden.
</ParamField>

<Note>
`plugins list` leest eerst de vastgelegde lokale plugin-registry, met een alleen-uit-manifest-afgeleide fallback wanneer de registry ontbreekt of ongeldig is. Dit is nuttig om te controleren of een plugin is geïnstalleerd, ingeschakeld en zichtbaar is voor koude opstartplanning, maar het is geen live runtime-probe van een Gateway-proces dat al draait. Herstart na het wijzigen van plugin-code, inschakeling, hookbeleid of `plugins.load.paths` de Gateway die het kanaal bedient voordat je verwacht dat nieuwe `register(api)`-code of hooks worden uitgevoerd. Controleer bij externe/containerdeployments of je het daadwerkelijke `openclaw gateway run`-childproces herstart, niet alleen een wrapperproces.

`plugins list --json` bevat de `dependencyStatus` van elke plugin uit `package.json`
`dependencies` en `optionalDependencies`. OpenClaw controleert of die pakketnamen
aanwezig zijn langs het normale Node-`node_modules`-opzoekpad van de plugin; het
importeert geen plugin-runtimecode, voert geen pakketbeheerder uit en repareert
ontbrekende afhankelijkheden niet.
</Note>

`plugins search` is een externe ClawHub-cataloguslookup. Het inspecteert geen lokale
status, wijzigt geen config, installeert geen pakketten en laadt geen plugin-runtimecode. Zoek
resultaten bevatten de ClawHub-pakketnaam, familie, kanaal, versie, samenvatting en
een installatiehint zoals `openclaw plugins install clawhub:<package>`.

Voor gebundeld plugin-werk binnen een verpakte Docker-image koppel je de plugin-
brondirectory als bind-mount over het overeenkomende verpakte bronpad, zoals
`/app/extensions/synology-chat`. OpenClaw ontdekt die gekoppelde source-
overlay vóór `/app/dist/extensions/synology-chat`; een gewoon gekopieerde source-
directory blijft inert zodat normale verpakte installaties nog steeds gecompileerde dist gebruiken.

Voor debugging van runtime-hooks:

- `openclaw plugins inspect <id> --runtime --json` toont geregistreerde hooks en diagnostiek uit een inspectiepass waarbij de module is geladen. Runtime-inspectie installeert nooit afhankelijkheden; gebruik `openclaw doctor --fix` om verouderde afhankelijkheidsstatus op te schonen of ontbrekende downloadbare plugins te herstellen waarnaar config verwijst.
- `openclaw gateway status --deep --require-rpc` bevestigt de bereikbare Gateway, service-/proceshints, configpad en RPC-gezondheid.
- Niet-gebundelde conversation hooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) vereisen `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gebruik `--link` om het kopiëren van een lokale directory te vermijden (voegt toe aan `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wordt niet ondersteund met `--link` omdat gekoppelde installaties het bronpad hergebruiken in plaats van over een beheerd installatiedoel te kopiëren.

Gebruik `--pin` bij npm-installaties om de opgeloste exacte spec (`name@version`) op te slaan in de beheerde plugin-index terwijl het standaardgedrag niet-vastgepind blijft.
</Note>

### Plugin-index

Metadata van plugin-installaties is machinebeheerde status, geen gebruikersconfig. Installaties en updates schrijven dit naar `plugins/installs.json` onder de actieve OpenClaw-statusdirectory. De top-level `installRecords`-map is de duurzame bron van installatiemetadata, inclusief records voor kapotte of ontbrekende plugin-manifests. De `plugins`-array is de uit manifests afgeleide koude registry-cache. Het bestand bevat een niet-bewerken-waarschuwing en wordt gebruikt door `openclaw plugins update`, uninstall, diagnostiek en de koude plugin-registry.

Wanneer OpenClaw meegeleverde verouderde `plugins.installs`-records in config ziet, behandelen runtime-lezingen die als compatibiliteitsinvoer zonder `openclaw.json` te herschrijven. Expliciete plugin-schrijfacties en `openclaw doctor --fix` verplaatsen die records naar de plugin-index en verwijderen de config-sleutel wanneer config-schrijfacties zijn toegestaan; als een van beide schrijfacties mislukt, worden de config-records behouden zodat de installatiemetadata niet verloren gaat.

### Verwijderen

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` verwijdert plugin-records uit `plugins.entries`, de vastgelegde plugin-index, allow/deny-lijstitems voor plugins en gekoppelde `plugins.load.paths`-items wanneer van toepassing. Tenzij `--keep-files` is ingesteld, verwijdert uninstall ook de bijgehouden beheerde installatiedirectory wanneer die zich binnen de plugin-extensieroot van OpenClaw bevindt. Voor active memory-plugins wordt het geheugenslot teruggezet naar `memory-core`.

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

Updates zijn van toepassing op bijgehouden plugin-installaties in de beheerde plugin-index en bijgehouden hook-pack-installaties in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Plugin-id versus npm-spec oplossen">
    Wanneer je een plugin-id doorgeeft, hergebruikt OpenClaw de geregistreerde installatiespec voor die plugin. Dat betekent dat eerder opgeslagen dist-tags zoals `@beta` en exacte vastgepinde versies bij latere `update <id>`-runs gebruikt blijven worden.

    Voor npm-installaties kun je ook een expliciete npm-pakketspec met een dist-tag of exacte versie doorgeven. OpenClaw herleidt die pakketnaam naar het bijgehouden plugin-record, werkt die geïnstalleerde plugin bij en registreert de nieuwe npm-spec voor toekomstige id-gebaseerde updates.

    Het doorgeven van de npm-pakketnaam zonder versie of tag wordt ook terug herleid naar het bijgehouden plugin-record. Gebruik dit wanneer een plugin aan een exacte versie was vastgepind en je die terug wilt verplaatsen naar de standaardreleaselijn van de registry.

  </Accordion>
  <Accordion title="Updates voor het bètakanaal">
    `openclaw plugins update` hergebruikt de bijgehouden plugin-spec tenzij je een nieuwe spec doorgeeft. `openclaw update` kent daarnaast het actieve OpenClaw-updatekanaal: op het bètakanaal proberen npm- en ClawHub-plugin-records op de standaardlijn eerst `@beta` en vallen daarna terug op de geregistreerde standaard-/latest-spec als er geen bèta-release van de plugin bestaat. Die fallback wordt als waarschuwing gemeld en laat de core-update niet mislukken. Exacte versies en expliciete tags blijven vastgepind aan die selector.

  </Accordion>
  <Accordion title="Versiecontroles en integriteitsdrift">
    Vóór een live npm-update controleert OpenClaw de geïnstalleerde pakketversie tegen de npm-registrymetadata. Als de geïnstalleerde versie en geregistreerde artefactidentiteit al overeenkomen met het opgeloste doel, wordt de update overgeslagen zonder te downloaden, opnieuw te installeren of `openclaw.json` te herschrijven.

    Wanneer een opgeslagen integriteitshash bestaat en de opgehaalde artefacthash verandert, behandelt OpenClaw dat als npm-artefactdrift. Het interactieve commando `openclaw plugins update` toont de verwachte en daadwerkelijke hashes en vraagt om bevestiging voordat het doorgaat. Niet-interactieve updatehelpers falen gesloten tenzij de aanroeper een expliciet vervolgbeleid opgeeft.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install bij update">
    `--dangerously-force-unsafe-install` is ook beschikbaar op `plugins update` als noodoverride voor fout-positieven in de ingebouwde dangerous-code-scan tijdens plugin-updates. Het omzeilt nog steeds geen plugin-`before_install`-beleidsblokkades of blokkering bij scanfouten, en het geldt alleen voor plugin-updates, niet voor hook-pack-updates.
  </Accordion>
</AccordionGroup>

### Inspecteren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect toont identiteit, laadstatus, bron, manifestmogelijkheden, beleidsvlaggen, diagnostiek, installatiemetadata, bundelmogelijkheden en eventuele gedetecteerde MCP- of LSP-serverondersteuning zonder standaard plugin-runtime te importeren. Voeg `--runtime` toe om de plugin-module te laden en geregistreerde hooks, tools, commando's, services, gateway-methoden en HTTP-routes op te nemen. Runtime-inspectie rapporteert ontbrekende plugin-afhankelijkheden direct; installaties en reparaties blijven in `openclaw plugins install`, `openclaw plugins update` en `openclaw doctor --fix`.

CLI-commando's die eigendom zijn van plugins worden meestal geïnstalleerd als root-`openclaw`-commandogroepen, maar plugins kunnen ook geneste commando's registreren onder een core-parent zoals `openclaw nodes`. Nadat `inspect --runtime` een commando onder `cliCommands` toont, voer je het uit op het vermelde pad; een plugin die bijvoorbeeld `demo-git` registreert, kan worden geverifieerd met `openclaw demo-git ping`.

Elke plugin wordt geclassificeerd op basis van wat deze daadwerkelijk registreert tijdens runtime:

- **plain-capability** — één capaciteitstype (bijv. een provider-only plugin)
- **hybrid-capability** — meerdere capaciteitstypen (bijv. tekst + spraak + afbeeldingen)
- **hook-only** — alleen hooks, geen capaciteiten of oppervlakken
- **non-capability** — tools/opdrachten/services, maar geen capaciteiten

Zie [Plugin-vormen](/nl/plugins/architecture#plugin-shapes) voor meer over het capaciteitsmodel.

<Note>
De vlag `--json` voert een machineleesbaar rapport uit dat geschikt is voor scripting en auditing. `inspect --all` toont een vlootbrede tabel met kolommen voor vorm, capaciteitssoorten, compatibiliteitsmeldingen, bundelcapaciteiten en hook-samenvatting. `info` is een alias voor `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` rapporteert laadfouten van plugins, manifest-/detectiediagnostiek en compatibiliteitsmeldingen. Wanneer alles schoon is, wordt `No plugin issues detected.` afgedrukt.

Als een geconfigureerde plugin op schijf aanwezig is maar wordt geblokkeerd door de padveiligheidscontroles van de loader, behoudt configuratievalidatie de pluginvermelding en rapporteert deze als `present but blocked`. Los de voorafgaande diagnose voor de geblokkeerde plugin op, zoals padeigendom of world-writable machtigingen, in plaats van de configuratie `plugins.entries.<id>` of `plugins.allow` te verwijderen.

Voor modulevormfouten, zoals ontbrekende `register`-/`activate`-exports, voer je opnieuw uit met `OPENCLAW_PLUGIN_LOAD_DEBUG=1` om een compacte samenvatting van de exportvorm in de diagnostische uitvoer op te nemen.

### Register

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Het lokale pluginregister is OpenClaw's persistente koude leesmodel voor geïnstalleerde pluginidentiteit, inschakeling, bronmetadata en eigenaarschap van bijdragen. Normale startup, opzoeken van providereigenaar, classificatie van kanaalconfiguratie en plugininventaris kunnen dit lezen zonder runtime-modules van plugins te importeren.

Gebruik `plugins registry` om te controleren of het persistente register aanwezig, actueel of verouderd is. Gebruik `--refresh` om het opnieuw op te bouwen vanuit de persistente pluginindex, configuratiepolicy en manifest-/pakketmetadata. Dit is een herstelpad, geen runtime-activeringspad.

`openclaw doctor --fix` herstelt ook registry-aangrenzende beheerde npm-drift: als een verweesd of hersteld `@openclaw/*`-pakket onder de beheerde plugin-npm-root een gebundelde plugin overschaduwt, verwijdert doctor dat verouderde pakket en bouwt het register opnieuw op, zodat startup tegen het gebundelde manifest valideert.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` is een verouderde break-glass-compatibiliteitsschakelaar voor leesfouten van het register. Geef de voorkeur aan `plugins registry --refresh` of `openclaw doctor --fix`; de env-fallback is alleen bedoeld voor noodherstel van startup terwijl de migratie wordt uitgerold.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list accepteert een lokaal marketplace-pad, een `marketplace.json`-pad, een GitHub-shorthand zoals `owner/repo`, een GitHub-repo-URL of een git-URL. `--json` drukt het opgeloste bronlabel af plus het geparsete marketplace-manifest en de pluginvermeldingen.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [CLI-referentie](/nl/cli)
- [ClawHub](/nl/clawhub)
