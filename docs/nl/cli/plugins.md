---
read_when:
    - U wilt Gateway-plugins of compatibele bundels installeren of beheren
    - Je wilt Plugin-laadfouten debuggen
sidebarTitle: Plugins
summary: CLI-referentie voor `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-07T01:51:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43d51a8ecc2d420991e7beb585cbf3046d44cd6dca755377f4c050c7a155064
    source_path: cli/plugins.md
    workflow: 16
---

Beheer Gateway-plugins, hook-packs en compatibele bundels.

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

Voer bij onderzoek naar een trage installatie, inspectie, verwijdering of registry-verversing de opdracht uit met `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. De trace schrijft fasetimings naar stderr en houdt JSON-uitvoer parseerbaar. Zie [Foutopsporing](/nl/help/debugging#plugin-lifecycle-trace).

<Note>
In Nix-modus (`OPENCLAW_NIX_MODE=1`) zijn mutators voor de plugin-levenscyclus uitgeschakeld. Gebruik in plaats van `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` of `plugins disable` de Nix-bron voor deze installatie; gebruik voor nix-openclaw de agent-first [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Gebundelde plugins worden met OpenClaw meegeleverd. Sommige zijn standaard ingeschakeld (bijvoorbeeld gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browserplugin); andere vereisen `plugins enable`.

Native OpenClaw-plugins moeten `openclaw.plugin.json` leveren met een inline JSON Schema (`configSchema`, zelfs als het leeg is). Compatibele bundels gebruiken in plaats daarvan hun eigen bundelmanifesten.

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
Kale pakketnamen installeren tijdens de lanceringsomschakeling standaard vanuit npm. Gebruik `clawhub:<package>` voor ClawHub. Behandel plugin-installaties alsof je code uitvoert. Geef de voorkeur aan vastgepinde versies.
</Warning>

`plugins search` bevraagt ClawHub naar installeerbare plugin-pakketten en drukt pakketnamen af die direct kunnen worden geïnstalleerd. Het zoekt code-plugin- en bundle-plugin-pakketten, geen skills. Gebruik `openclaw skills search` voor ClawHub-skills.

<Note>
ClawHub is het primaire distributie- en ontdekkingsoppervlak voor de meeste plugins. Npm blijft een ondersteunde fallback en direct installatiepad. OpenClaw-eigen `@openclaw/*`-pluginpakketten worden weer op npm gepubliceerd; zie de huidige lijst op [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) of de [plugin-inventaris](/nl/plugins/plugin-inventory). Stabiele installaties gebruiken `latest`. Installaties en updates via het bètakanaal geven de voorkeur aan de npm-`beta`-dist-tag wanneer die tag beschikbaar is, en vallen daarna terug op `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Als je `plugins`-sectie wordt ondersteund door een éénbestandige `$include`, schrijven `plugins install/update/enable/disable/uninstall` door naar dat opgenomen bestand en laten ze `openclaw.json` ongemoeid. Root-includes, include-arrays en includes met naastliggende overschrijvingen falen gesloten in plaats van af te vlakken. Zie [Configuratie-includes](/nl/gateway/configuration) voor de ondersteunde vormen.

    Als de configuratie ongeldig is tijdens installatie, faalt `plugins install` normaal gesproken gesloten en vraagt het je eerst `openclaw doctor --fix` uit te voeren. Tijdens het opstarten van de Gateway en hot reload faalt ongeldige plugin-configuratie gesloten, net als elke andere ongeldige configuratie; `openclaw doctor --fix` kan de ongeldige plugin-vermelding in quarantaine plaatsen. De enige gedocumenteerde uitzondering tijdens installatie is een smal herstelpad voor gebundelde plugins voor plugins die expliciet kiezen voor `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` hergebruikt het bestaande installatiedoel en overschrijft een al geïnstalleerde plugin of hook-pack ter plekke. Gebruik dit wanneer je bewust dezelfde id opnieuw installeert vanaf een nieuw lokaal pad, archief, ClawHub-pakket of npm-artefact. Geef voor routinematige upgrades van een al gevolgde npm-plugin de voorkeur aan `openclaw plugins update <id-or-npm-spec>`.

    Als je `plugins install` uitvoert voor een plugin-id die al is geïnstalleerd, stopt OpenClaw en verwijst het je naar `plugins update <id-or-npm-spec>` voor een normale upgrade, of naar `plugins install <package> --force` wanneer je de huidige installatie echt vanuit een andere bron wilt overschrijven.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` is alleen van toepassing op npm-installaties. Het wordt niet ondersteund met `git:`-installaties; gebruik een expliciete git-ref zoals `git:github.com/acme/plugin@v1.2.3` wanneer je een vastgepinde bron wilt. Het wordt niet ondersteund met `--marketplace`, omdat marketplace-installaties marketplace-bronmetadata bewaren in plaats van een npm-specificatie.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` is een noodoptie voor fout-positieven in de ingebouwde scanner voor gevaarlijke code. Hiermee kan de installatie doorgaan, zelfs wanneer de ingebouwde scanner `critical`-bevindingen rapporteert, maar dit omzeilt **niet** de beleidsblokkades van plugin-`before_install`-hooks en omzeilt **niet** scanfouten.

    Deze CLI-vlag is van toepassing op plugin-installatie- en updateflows. Door de Gateway ondersteunde installaties van skill-afhankelijkheden gebruiken de bijbehorende request-override `dangerouslyForceUnsafeInstall`, terwijl `openclaw skills install` een afzonderlijke download- en installatieflow voor ClawHub-skills blijft.

    Als een plugin die je op ClawHub hebt gepubliceerd wordt geblokkeerd door een registryscan, gebruik dan de publicatiestappen in [ClawHub](/nl/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` is ook het installatieoppervlak voor hook-packs die `openclaw.hooks` in `package.json` blootstellen. Gebruik `openclaw hooks` voor gefilterde zichtbaarheid van hooks en inschakeling per hook, niet voor pakketinstallatie.

    Npm-specificaties zijn **alleen voor registry** (pakketnaam + optionele **exacte versie** of **dist-tag**). Git-/URL-/bestandsspecificaties en semver-bereiken worden geweigerd. Afhankelijkheidsinstallaties draaien projectlokaal met `--ignore-scripts` voor veiligheid, zelfs wanneer je shell globale npm-installatie-instellingen heeft. Beheerde npm-roots voor plugins erven OpenClaw's npm-`overrides` op pakketniveau, dus hostbeveiligingspins gelden ook voor gehesen plugin-afhankelijkheden.

    Gebruik `npm:<package>` wanneer je npm-resolutie expliciet wilt maken. Kale pakketspecificaties installeren tijdens de lanceringsomschakeling ook rechtstreeks vanuit npm.

    Kale specificaties en `@latest` blijven op het stabiele spoor. Verouderde OpenClaw-correctieversies zoals `2026.5.3-1` worden voor deze controle nog steeds als stabiele releases behandeld, zodat oudere pakketten veilig blijven bijwerken. Nieuw werk voor maandelijkse ondersteuningslijnen is gepland om normale SemVer-patchnummers te gebruiken in plaats van correctiesuffixen met koppeltekens. Als npm een specificatie voor de standaardlijn naar een prerelease resolveert, stopt OpenClaw en vraagt het je expliciet te kiezen met een prerelease-tag zoals `@beta`/`@rc` of een exacte prereleaseversie zoals `@1.2.3-beta.4`.

    Als een kale installatiespecificatie overeenkomt met een officiële plugin-id (bijvoorbeeld `diffs`), installeert OpenClaw de catalogusvermelding rechtstreeks. Gebruik een expliciete scoped specificatie (bijvoorbeeld `@scope/diffs`) om een npm-pakket met dezelfde naam te installeren.

  </Accordion>
  <Accordion title="Git repositories">
    Gebruik `git:<repo>` om rechtstreeks vanuit een git-repository te installeren. Ondersteunde vormen zijn onder meer `git:github.com/owner/repo`, `git:owner/repo`, volledige kloon-URL's met `https://`, `ssh://`, `git://`, `file://` en `git@host:owner/repo.git`. Voeg `@<ref>` of `#<ref>` toe om vóór installatie een branch, tag of commit uit te checken.

    Git-installaties klonen naar een tijdelijke map, checken de gevraagde ref uit wanneer die aanwezig is, en gebruiken daarna het normale installatieprogramma voor plugin-mappen. Dat betekent dat manifestvalidatie, scanning op gevaarlijke code, installatiewerk van de package manager en installatierecords zich gedragen als bij npm-installaties. Vastgelegde git-installaties bevatten de bron-URL/ref plus de opgeloste commit, zodat `openclaw plugins update` de bron later opnieuw kan resolven.

    Gebruik na installatie vanuit git `openclaw plugins inspect <id> --runtime --json` om runtime-registraties zoals gateway-methoden en CLI-opdrachten te verifiëren. Als de plugin een CLI-root met `api.registerCli` heeft geregistreerd, voer die opdracht dan rechtstreeks uit via de OpenClaw-root-CLI, bijvoorbeeld `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Ondersteunde archieven: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-pluginarchieven moeten een geldige `openclaw.plugin.json` bevatten in de uitgepakte plugin-root; archieven die alleen `package.json` bevatten, worden geweigerd voordat OpenClaw installatierecords schrijft.

    Gebruik `npm-pack:<path.tgz>` wanneer het bestand een npm-pack-tarball is en je hetzelfde beheerde npm-root-installatiepad wilt testen dat door registry-installaties wordt gebruikt, inclusief `package-lock.json`-verificatie, scanning van gehesen afhankelijkheden en npm-installatierecords. Gewone archiefpaden worden nog steeds als lokale archieven onder de plugin-extensieroot geïnstalleerd.

    Claude-marketplace-installaties worden ook ondersteund.

  </Accordion>
</AccordionGroup>

ClawHub-installaties gebruiken een expliciete `clawhub:<package>`-locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Kale npm-veilige pluginspecificaties installeren tijdens de lanceringsomschakeling standaard vanuit npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gebruik `npm:` om npm-only-resolutie expliciet te maken:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controleert de geadverteerde plugin-API / minimale Gateway-compatibiliteit vóór installatie. Wanneer de geselecteerde ClawHub-versie een ClawPack-artefact publiceert, downloadt OpenClaw het geversioneerde npm-pack `.tgz`, verifieert het de ClawHub-digestheader en de artefactdigest, en installeert het vervolgens via het normale archiefpad. Oudere ClawHub-versies zonder ClawPack-metadata worden nog steeds geïnstalleerd via het verouderde verificatiepad voor pakketarchieven. Geregistreerde installaties behouden hun ClawHub-bronmetadata, artefactsoort, npm-integriteit, npm-shasum, tarballnaam en ClawPack-digestfeiten voor latere updates.
Niet-geversioneerde ClawHub-installaties behouden een niet-geversioneerde geregistreerde specificatie, zodat `openclaw plugins update` nieuwere ClawHub-releases kan volgen; expliciete versie- of tagselectoren zoals `clawhub:pkg@1.2.3` en `clawhub:pkg@beta` blijven vastgezet op die selector.

#### Marketplace-afkorting

Gebruik de afkorting `plugin@marketplace` wanneer de marketplacenaam bestaat in Claude's lokale registry-cache op `~/.claude/plugins/known_marketplaces.json`:

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
    - een Claude bekende-marketplacenaam uit `~/.claude/plugins/known_marketplaces.json`
    - een lokale marketplaceroot of `marketplace.json`-pad
    - een GitHub-repoafkorting zoals `owner/repo`
    - een GitHub-repo-URL zoals `https://github.com/owner/repo`
    - een git-URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Voor externe marketplaces die vanaf GitHub of git worden geladen, moeten plugin-items binnen de gekloonde marketplace-repo blijven. OpenClaw accepteert relatieve padbronnen uit die repo en weigert HTTP(S), absolute paden, git, GitHub en andere niet-pad-pluginbronnen uit externe manifests.
  </Tab>
</Tabs>

Voor lokale paden en archieven detecteert OpenClaw automatisch:

- native OpenClaw-plugins (`openclaw.plugin.json`)
- Codex-compatibele bundels (`.codex-plugin/plugin.json`)
- Claude-compatibele bundels (`.claude-plugin/plugin.json` of de standaard Claude-componentindeling)
- Cursor-compatibele bundels (`.cursor-plugin/plugin.json`)

<Note>
Compatibele bundels worden geïnstalleerd in de normale plugin-root en nemen deel aan dezelfde list/info/enable/disable-flow. Momenteel worden bundle skills, Claude command-skills, Claude `settings.json`-standaarden, Claude `.lsp.json` / door manifest gedeclareerde `lspServers`-standaarden, Cursor command-skills en compatibele Codex hook-directories ondersteund; andere gedetecteerde bundelmogelijkheden worden getoond in diagnostiek/info, maar zijn nog niet gekoppeld aan runtime-uitvoering.
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
`plugins list` leest eerst de opgeslagen lokale plugin-registry, met een manifest-only afgeleide fallback wanneer de registry ontbreekt of ongeldig is. Dit is nuttig om te controleren of een plugin is geïnstalleerd, ingeschakeld en zichtbaar is voor planning bij koude opstart, maar het is geen live runtime-probe van een al draaiend Gateway-proces. Start na het wijzigen van plugin-code, inschakeling, hookbeleid of `plugins.load.paths` de Gateway opnieuw die het kanaal bedient voordat je verwacht dat nieuwe `register(api)`-code of hooks worden uitgevoerd. Controleer bij externe/containerdeployments of je het daadwerkelijke `openclaw gateway run`-child opnieuw start, niet alleen een wrapperproces.

`plugins list --json` bevat de `dependencyStatus` van elke plugin uit `package.json`
`dependencies` en `optionalDependencies`. OpenClaw controleert of die pakketnamen
aanwezig zijn langs het normale Node `node_modules`-opzoekpad van de plugin; het
importeert geen plugin-runtimecode, voert geen pakketbeheerder uit en repareert
ontbrekende afhankelijkheden niet.
</Note>

`plugins search` is een externe ClawHub-cataloguslookup. Het inspecteert geen lokale
status, wijzigt geen configuratie, installeert geen pakketten en laadt geen plugin-runtimecode. Zoekresultaten
bevatten de ClawHub-pakketnaam, familie, kanaal, versie, samenvatting en
een installatietip zoals `openclaw plugins install clawhub:<package>`.

Voor werk aan gebundelde plugins binnen een verpakte Docker-image mount je de plugin-
brondirectory over het overeenkomende verpakte bronpad heen, zoals
`/app/extensions/synology-chat`. OpenClaw ontdekt die gemounte bron-
overlay vóór `/app/dist/extensions/synology-chat`; een gewone gekopieerde bron-
directory blijft inert, zodat normale verpakte installaties nog steeds gecompileerde dist gebruiken.

Voor runtime-hookdebugging:

- `openclaw plugins inspect <id> --runtime --json` toont geregistreerde hooks en diagnostiek van een modulegeladen inspectiepassage. Runtime-inspectie installeert nooit afhankelijkheden; gebruik `openclaw doctor --fix` om verouderde afhankelijkheidsstatus op te schonen of ontbrekende downloadbare plugins te herstellen waarnaar configuratie verwijst.
- `openclaw gateway status --deep --require-rpc` bevestigt de bereikbare Gateway, service-/processuggesties, configuratiepad en RPC-status.
- Niet-gebundelde gesprekshooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) vereisen `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gebruik `--link` om het kopiëren van een lokale directory te vermijden (voegt toe aan `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wordt niet ondersteund met `--link`, omdat gekoppelde installaties het bronpad hergebruiken in plaats van over een beheerd installatiedoel heen te kopiëren.

Gebruik `--pin` bij npm-installaties om de opgeloste exacte specificatie (`name@version`) op te slaan in de beheerde plugin-index, terwijl het standaardgedrag niet-vastgezet blijft.
</Note>

### Plugin-index

Plugin-installatiemetadata is door machines beheerde status, geen gebruikersconfiguratie. Installaties en updates schrijven deze naar `plugins/installs.json` onder de actieve OpenClaw-statusdirectory. De top-level `installRecords`-map is de duurzame bron van installatiemetadata, inclusief records voor kapotte of ontbrekende pluginmanifests. De `plugins`-array is de uit manifests afgeleide koude registry-cache. Het bestand bevat een waarschuwing om het niet te bewerken en wordt gebruikt door `openclaw plugins update`, verwijderen, diagnostiek en de koude plugin-registry.

Wanneer OpenClaw meegeleverde verouderde `plugins.installs`-records in configuratie ziet, behandelen runtime-reads deze als compatibiliteitsinvoer zonder `openclaw.json` te herschrijven. Expliciete plugin-writes en `openclaw doctor --fix` verplaatsen die records naar de plugin-index en verwijderen de configuratiesleutel wanneer configuratiewrites zijn toegestaan; als een van beide writes mislukt, blijven de configuratierecords behouden zodat de installatiemetadata niet verloren gaat.

### Verwijderen

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` verwijdert plugin-records uit `plugins.entries`, de opgeslagen plugin-index, plugin allow/deny list-items en gekoppelde `plugins.load.paths`-items waar van toepassing. Tenzij `--keep-files` is ingesteld, verwijdert uninstall ook de gevolgde beheerde installatiedirectory wanneer deze zich binnen OpenClaw's plugin extensions-root bevindt. Voor active memory-plugins wordt de memoryslot teruggezet naar `memory-core`.

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
  <Accordion title="Resolving plugin id vs npm spec">
    Wanneer je een plugin-id doorgeeft, hergebruikt OpenClaw de geregistreerde installatiespecificatie voor die plugin. Dat betekent dat eerder opgeslagen dist-tags zoals `@beta` en exacte vastgezette versies ook bij latere `update <id>`-runs worden gebruikt.

    Voor npm-installaties kun je ook een expliciete npm-pakketspecificatie met een dist-tag of exacte versie doorgeven. OpenClaw herleidt die pakketnaam naar het gevolgde plugin-record, werkt die geïnstalleerde plugin bij en registreert de nieuwe npm-specificatie voor toekomstige id-gebaseerde updates.

    Het doorgeven van de npm-pakketnaam zonder versie of tag wordt ook terug herleid naar het gevolgde plugin-record. Gebruik dit wanneer een plugin op een exacte versie was vastgezet en je deze wilt terugzetten naar de standaardreleaselijn van de registry.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` hergebruikt de gevolgde plugin-specificatie tenzij je een nieuwe specificatie doorgeeft. `openclaw update` kent daarnaast het actieve OpenClaw-updatekanaal: op het bètakanaal proberen npm- en ClawHub-pluginrecords op de standaardlijn eerst `@beta` en vallen daarna terug op de geregistreerde default/latest-specificatie als er geen plugin-bètarelease bestaat. Exacte versies en expliciete tags blijven vastgezet op die selector.

    OpenClaw stelt nog geen LTS- of maandelijkse ondersteuningskanalen voor plugins beschikbaar. Gepland werk aan ondersteuningslijnen vereist dat pluginpakketten en ClawHub-tags dezelfde ondersteuningslijn volgen als het corepakket.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Vóór een live npm-update controleert OpenClaw de geïnstalleerde pakketversie aan de hand van de metadata van de npm-registry. Als de geïnstalleerde versie en de geregistreerde artefactidentiteit al overeenkomen met het opgeloste doel, wordt de update overgeslagen zonder downloaden, opnieuw installeren of herschrijven van `openclaw.json`.

    Wanneer een opgeslagen integriteitshash bestaat en de opgehaalde artefacthash verandert, behandelt OpenClaw dat als npm-artefactdrift. De interactieve opdracht `openclaw plugins update` toont de verwachte en werkelijke hashes en vraagt om bevestiging voordat deze doorgaat. Niet-interactieve updatehelpers falen gesloten tenzij de aanroeper een expliciet vervolgbeleid opgeeft.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` is ook beschikbaar op `plugins update` als break-glass-override voor vals-positieve resultaten van ingebouwde dangerous-code-scans tijdens plugin-updates. Het omzeilt nog steeds geen plugin `before_install`-beleidsblokkades of blokkering bij scanfouten, en het is alleen van toepassing op plugin-updates, niet op hook-pack-updates.
  </Accordion>
</AccordionGroup>

### Inspecteren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect toont identiteit, laadstatus, bron, manifestmogelijkheden, beleidsvlaggen, diagnostiek, installatiemetadata, bundelmogelijkheden en eventuele gedetecteerde MCP- of LSP-serverondersteuning zonder standaard plugin-runtime te importeren. Voeg `--runtime` toe om de pluginmodule te laden en geregistreerde hooks, tools, opdrachten, services, gatewaymethoden en HTTP-routes op te nemen. Runtime-inspectie rapporteert ontbrekende pluginafhankelijkheden direct; installaties en reparaties blijven in `openclaw plugins install`, `openclaw plugins update` en `openclaw doctor --fix`.

CLI-opdrachten die eigendom zijn van een plugin worden geïnstalleerd als root-`openclaw`-opdrachtgroepen. Nadat `inspect --runtime` een opdracht onder `cliCommands` toont, voer je deze uit als `openclaw <command> ...`; bijvoorbeeld een plugin die `demo-git` registreert, kan worden geverifieerd met `openclaw demo-git ping`.

Elke plugin wordt geclassificeerd op basis van wat deze daadwerkelijk registreert tijdens runtime:

- **plain-capability** — één capability-type (bijv. een provider-only plugin)
- **hybrid-capability** — meerdere capability-types (bijv. tekst + spraak + afbeeldingen)
- **hook-only** — alleen hooks, geen capabilities of oppervlakken
- **non-capability** — tools/opdrachten/services maar geen capabilities

Zie [Plugin-vormen](/nl/plugins/architecture#plugin-shapes) voor meer over het capability-model.

<Note>
De vlag `--json` geeft een machineleesbaar rapport weer dat geschikt is voor scripting en auditing. `inspect --all` toont een vlootbrede tabel met kolommen voor vorm, capability-soorten, compatibiliteitsmeldingen, bundel-capabilities en hook-samenvatting. `info` is een alias voor `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` rapporteert plugin-laadfouten, manifest-/discovery-diagnostiek en compatibiliteitsmeldingen. Wanneer alles schoon is, print het `No plugin issues detected.`

Als een geconfigureerde plugin op schijf aanwezig is maar wordt geblokkeerd door de padveiligheidscontroles van de loader, behoudt configuratievalidatie de plugin-entry en rapporteert deze als `present but blocked`. Los de voorafgaande diagnostiek voor de geblokkeerde plugin op, zoals padeigendom of wereldwijd schrijfbare machtigingen, in plaats van de configuratie `plugins.entries.<id>` of `plugins.allow` te verwijderen.

Voor modulevorm-fouten zoals ontbrekende `register`/`activate`-exports, voer opnieuw uit met `OPENCLAW_PLUGIN_LOAD_DEBUG=1` om een compacte samenvatting van de exportvorm op te nemen in de diagnostische uitvoer.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

De lokale plugin-registry is het opgeslagen cold-readmodel van OpenClaw voor geinstalleerde plugin-identiteit, inschakeling, bronmetadata en eigenaarschap van bijdragen. Normaal opstarten, provider-eigenaaropzoeking, classificatie van kanaalsetup en plugin-inventaris kunnen deze lezen zonder plugin-runtime-modules te importeren.

Gebruik `plugins registry` om te inspecteren of de opgeslagen registry aanwezig, actueel of verouderd is. Gebruik `--refresh` om deze opnieuw op te bouwen vanuit de opgeslagen plugin-index, configuratiepolicy en manifest-/pakketmetadata. Dit is een herstelpad, geen runtime-activatiepad.

`openclaw doctor --fix` herstelt ook registry-aangrenzende managed npm-drift: als een verweesd of hersteld `@openclaw/*`-pakket onder de managed plugin npm-root een gebundelde plugin overschaduwt, verwijdert doctor dat verouderde pakket en bouwt de registry opnieuw op zodat het opstarten valideert tegen het gebundelde manifest.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` is een verouderde break-glass-compatibiliteitsschakelaar voor leesfouten in de registry. Geef de voorkeur aan `plugins registry --refresh` of `openclaw doctor --fix`; de env-fallback is alleen bedoeld voor noodherstel van het opstarten terwijl de migratie wordt uitgerold.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace-list accepteert een lokaal marketplace-pad, een `marketplace.json`-pad, een GitHub-shorthand zoals `owner/repo`, een GitHub-repo-URL of een git-URL. `--json` print het opgeloste bronlabel plus het geparsde marketplace-manifest en de plugin-entries.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [CLI-referentie](/nl/cli)
- [Community-plugins](/nl/plugins/community)
