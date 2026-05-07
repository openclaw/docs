---
read_when:
    - Je wilt Gateway-plugins of compatibele bundels installeren of beheren
    - Je wilt fouten bij het laden van Plugins opsporen
sidebarTitle: Plugins
summary: CLI-referentie voor `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-07T13:15:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73023d11309c5dc4fe9fab9cffc0f7d96de1e1c22ce1ec4d2cd22d2aa4808f1a
    source_path: cli/plugins.md
    workflow: 16
---

Beheer Gateway-plugins, hookpakketten en compatibele bundels.

<CardGroup cols={2}>
  <Card title="Pluginsysteem" href="/nl/tools/plugin">
    Eindgebruikershandleiding voor het installeren, inschakelen en oplossen van problemen met plugins.
  </Card>
  <Card title="Plugins beheren" href="/nl/plugins/manage-plugins">
    Snelle voorbeelden voor installeren, weergeven, bijwerken, verwijderen en publiceren.
  </Card>
  <Card title="Pluginbundels" href="/nl/plugins/bundles">
    Compatibiliteitsmodel voor bundels.
  </Card>
  <Card title="Pluginmanifest" href="/nl/plugins/manifest">
    Manifestvelden en configuratieschema.
  </Card>
  <Card title="Beveiliging" href="/nl/gateway/security">
    Beveiligingsverharding voor plugininstallaties.
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
In Nix-modus (`OPENCLAW_NIX_MODE=1`) zijn mutators voor de pluginlevenscyclus uitgeschakeld. Gebruik voor deze installatie in plaats daarvan de Nix-bron, in plaats van `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` of `plugins disable`; gebruik voor nix-openclaw de agent-first [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Gebundelde plugins worden met OpenClaw meegeleverd. Sommige zijn standaard ingeschakeld (bijvoorbeeld gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browserplugin); andere vereisen `plugins enable`.

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
Kale pakketnamen installeren standaard vanaf npm tijdens de launch-cutover. Gebruik `clawhub:<package>` voor ClawHub. Behandel plugininstallaties als het uitvoeren van code. Geef de voorkeur aan vastgezette versies.
</Warning>

`plugins search` doorzoekt ClawHub naar installeerbare pluginpakketten en drukt
installatieklare pakketnamen af. Het zoekt code-plugin- en bundle-plugin-pakketten,
niet Skills. Gebruik `openclaw skills search` voor ClawHub Skills.

<Note>
ClawHub is het primaire distributie- en ontdekkingsoppervlak voor de meeste plugins. Npm
blijft een ondersteund fallback- en direct-install-pad. Pluginpakketten van OpenClaw
`@openclaw/*` worden weer op npm gepubliceerd; zie de huidige lijst
op [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) of de
[plugininventaris](/nl/plugins/plugin-inventory). Stabiele installaties gebruiken `latest`.
Installaties en updates via het bètakanaal geven de voorkeur aan de npm-`beta` dist-tag wanneer die tag
beschikbaar is, en vallen daarna terug op `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Configuratie-includes en herstel van ongeldige configuratie">
    Als uw sectie `plugins` wordt ondersteund door een enkelvoudige `$include`, schrijven `plugins install/update/enable/disable/uninstall` door naar dat geïncludeerde bestand en laten ze `openclaw.json` onaangeroerd. Root-includes, include-arrays en includes met sibling-overrides falen gesloten in plaats van te flattenen. Zie [Configuratie-includes](/nl/gateway/configuration) voor de ondersteunde vormen.

    Als de configuratie ongeldig is tijdens installatie, faalt `plugins install` normaal gesproken gesloten en zegt het dat u eerst `openclaw doctor --fix` moet uitvoeren. Tijdens het opstarten en hot reloaden van de Gateway faalt ongeldige pluginconfiguratie gesloten zoals elke andere ongeldige configuratie; `openclaw doctor --fix` kan de ongeldige pluginvermelding in quarantaine plaatsen. De enige gedocumenteerde uitzondering tijdens installatie is een smal herstelpad voor gebundelde plugins voor plugins die expliciet kiezen voor `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force en herinstalleren versus bijwerken">
    `--force` hergebruikt het bestaande installatiedoel en overschrijft een al geïnstalleerde plugin of hookpakket ter plekke. Gebruik het wanneer u bewust dezelfde id opnieuw installeert vanaf een nieuw lokaal pad, archief, ClawHub-pakket of npm-artefact. Geef voor routine-upgrades van een al bijgehouden npm-plugin de voorkeur aan `openclaw plugins update <id-or-npm-spec>`.

    Als u `plugins install` uitvoert voor een plugin-id die al is geïnstalleerd, stopt OpenClaw en verwijst het u naar `plugins update <id-or-npm-spec>` voor een normale upgrade, of naar `plugins install <package> --force` wanneer u de huidige installatie echt vanuit een andere bron wilt overschrijven.

  </Accordion>
  <Accordion title="Bereik van --pin">
    `--pin` geldt alleen voor npm-installaties. Het wordt niet ondersteund met `git:`-installaties; gebruik een expliciete git-ref zoals `git:github.com/acme/plugin@v1.2.3` wanneer u een vastgezette bron wilt. Het wordt niet ondersteund met `--marketplace`, omdat marketplace-installaties marketplace-bronmetadata bewaren in plaats van een npm-spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` is een noodoptie voor fout-positieven in de ingebouwde dangerous-code-scanner. Hiermee kan de installatie doorgaan, zelfs wanneer de ingebouwde scanner `critical`-bevindingen rapporteert, maar het omzeilt **geen** beleidsblokkades van de pluginhook `before_install` en omzeilt **geen** scanfouten.

    Deze CLI-vlag geldt voor plugin-installatie- en updateflows. Door de Gateway ondersteunde installaties van skillafhankelijkheden gebruiken de overeenkomende aanvraagoverride `dangerouslyForceUnsafeInstall`, terwijl `openclaw skills install` een afzonderlijke ClawHub-flow voor het downloaden/installeren van Skills blijft.

    Als een plugin die u op ClawHub hebt gepubliceerd wordt geblokkeerd door een registerscan, gebruik dan de publisherstappen in [ClawHub](/nl/tools/clawhub).

  </Accordion>
  <Accordion title="Hookpakketten en npm-specs">
    `plugins install` is ook het installatieoppervlak voor hookpakketten die `openclaw.hooks` in `package.json` blootstellen. Gebruik `openclaw hooks` voor gefilterde hookzichtbaarheid en inschakeling per hook, niet voor pakketinstallatie.

    Npm-specs zijn **alleen register** (pakketnaam + optionele **exacte versie** of **dist-tag**). Git/URL/bestand-specs en semver-bereiken worden geweigerd. Afhankelijkheidsinstallaties worden projectlokaal uitgevoerd met `--ignore-scripts` voor veiligheid, zelfs wanneer uw shell globale npm-installatie-instellingen heeft. Beheerde npm-roots voor plugins erven OpenClaw's npm-`overrides` op pakketniveau, zodat beveiligingspins van de host ook gelden voor gehoiste pluginafhankelijkheden.

    Gebruik `npm:<package>` wanneer u npm-resolutie expliciet wilt maken. Kale pakketspecs installeren tijdens de launch-cutover ook rechtstreeks vanaf npm.

    Kale specs en `@latest` blijven op het stabiele spoor. Datumgestempelde correctieversies van OpenClaw zoals `2026.5.3-1` zijn stabiele releases voor deze controle. Als npm een van die specs naar een prerelease resolveert, stopt OpenClaw en vraagt het u om expliciet in te stemmen met een prereleasetag zoals `@beta`/`@rc` of een exacte prereleaseversie zoals `@1.2.3-beta.4`.

    Als een kale installatiespec overeenkomt met een officiële plugin-id (bijvoorbeeld `diffs`), installeert OpenClaw de catalogusvermelding rechtstreeks. Gebruik een expliciete scoped spec (bijvoorbeeld `@scope/diffs`) om een npm-pakket met dezelfde naam te installeren.

  </Accordion>
  <Accordion title="Git-repositories">
    Gebruik `git:<repo>` om rechtstreeks vanuit een git-repository te installeren. Ondersteunde vormen zijn onder meer `git:github.com/owner/repo`, `git:owner/repo`, volledige `https://`-, `ssh://`-, `git://`-, `file://`- en `git@host:owner/repo.git`-kloon-URL's. Voeg `@<ref>` of `#<ref>` toe om een branch, tag of commit uit te checken vóór installatie.

    Git-installaties klonen naar een tijdelijke map, checken de gevraagde ref uit wanneer aanwezig, en gebruiken daarna het normale installatieprogramma voor pluginmappen. Dat betekent dat manifestvalidatie, dangerous-code-scanning, installatiewerk van pakketbeheerders en installatierecords zich gedragen zoals bij npm-installaties. Vastgelegde git-installaties bevatten de bron-URL/ref plus de opgeloste commit, zodat `openclaw plugins update` de bron later opnieuw kan resolven.

    Gebruik na installatie vanuit git `openclaw plugins inspect <id> --runtime --json` om runtimeregistraties te verifiëren, zoals gateway-methoden en CLI-opdrachten. Als de plugin een CLI-root heeft geregistreerd met `api.registerCli`, voer die opdracht dan rechtstreeks uit via de OpenClaw-root-CLI, bijvoorbeeld `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archieven">
    Ondersteunde archieven: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-pluginarchieven moeten een geldige `openclaw.plugin.json` bevatten in de uitgepakte pluginroot; archieven die alleen `package.json` bevatten, worden geweigerd voordat OpenClaw installatierecords schrijft.

    Gebruik `npm-pack:<path.tgz>` wanneer het bestand een npm-pack-tarball is en u
    hetzelfde beheerde npm-root-installatiepad wilt testen dat door registerinstallaties wordt gebruikt,
    inclusief verificatie van `package-lock.json`, scanning van gehoiste afhankelijkheden en
    npm-installatierecords. Platte archiefpaden worden nog steeds als lokale archieven geïnstalleerd
    onder de pluginextensieroot.

    Claude marketplace-installaties worden ook ondersteund.

  </Accordion>
</AccordionGroup>

ClawHub-installaties gebruiken een expliciete `clawhub:<package>`-locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Kale npm-veilige pluginspecs installeren standaard vanaf npm tijdens de launch-cutover:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gebruik `npm:` om npm-only resolutie expliciet te maken:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controleert vóór installatie de geadverteerde Plugin-API / minimale Gateway-compatibiliteit. Wanneer de geselecteerde ClawHub-versie een ClawPack-artefact publiceert, downloadt OpenClaw de geversioneerde npm-pack `.tgz`, verifieert de ClawHub-digestheader en de artefactdigest, en installeert het vervolgens via het normale archiefpad. Oudere ClawHub-versies zonder ClawPack-metadata worden nog steeds geïnstalleerd via het legacy verificatiepad voor pakketarchieven. Vastgelegde installaties behouden hun ClawHub-bronmetadata, artefactsoort, npm-integriteit, npm-shasum, tarballnaam en ClawPack-digestfeiten voor latere updates.
Ongeversioneerde ClawHub-installaties behouden een ongeversioneerde vastgelegde specificatie, zodat `openclaw plugins update` nieuwere ClawHub-releases kan volgen; expliciete versie- of tagselectoren zoals `clawhub:pkg@1.2.3` en `clawhub:pkg@beta` blijven aan die selector vastgezet.

#### Marketplace-shorthand

Gebruik `plugin@marketplace`-shorthand wanneer de marketplacenaam bestaat in Claude's lokale registrycache op `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="Marketplacebronnen">
    - een bij Claude bekende marketplacenaam uit `~/.claude/plugins/known_marketplaces.json`
    - een lokale marketplaceroot of `marketplace.json`-pad
    - een GitHub-repo-shorthand zoals `owner/repo`
    - een GitHub-repo-URL zoals `https://github.com/owner/repo`
    - een git-URL

  </Tab>
  <Tab title="Regels voor externe marketplaces">
    Voor externe marketplaces die vanuit GitHub of git worden geladen, moeten Plugin-vermeldingen binnen de gekloonde marketplace-repo blijven. OpenClaw accepteert relatieve padbronnen vanuit die repo en weigert HTTP(S), absolute paden, git, GitHub en andere niet-pad-Plugin-bronnen uit externe manifests.
  </Tab>
</Tabs>

Voor lokale paden en archieven detecteert OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-compatibele bundels (`.codex-plugin/plugin.json`)
- Claude-compatibele bundels (`.claude-plugin/plugin.json` of de standaard Claude-componentindeling)
- Cursor-compatibele bundels (`.cursor-plugin/plugin.json`)

<Note>
Compatibele bundels worden geïnstalleerd in de normale Plugin-root en nemen deel aan dezelfde list/info/enable/disable-stroom. Momenteel worden bundel-Skills, Claude-opdracht-Skills, Claude `settings.json`-standaarden, Claude `.lsp.json` / door het manifest gedeclareerde `lspServers`-standaarden, Cursor-opdracht-Skills en compatibele Codex-hookmappen ondersteund; andere gedetecteerde bundelcapaciteiten worden getoond in diagnostiek/info, maar zijn nog niet gekoppeld aan runtime-uitvoering.
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
  Schakel over van de tabelweergave naar detailregels per Plugin met bron/oorsprong/versie/activeringsmetadata.
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare inventaris plus registrydiagnostiek en installatiestatus van pakketafhankelijkheden.
</ParamField>

<Note>
`plugins list` leest eerst de blijvend opgeslagen lokale Plugin-registry, met een alleen-uit-manifest-afgeleide fallback wanneer de registry ontbreekt of ongeldig is. Dit is nuttig om te controleren of een Plugin geïnstalleerd, ingeschakeld en zichtbaar is voor koude opstartplanning, maar het is geen live runtimeprobe van een al draaiend Gateway-proces. Start na wijzigingen in Plugin-code, inschakeling, hookbeleid of `plugins.load.paths` de Gateway opnieuw die het kanaal bedient voordat je verwacht dat nieuwe `register(api)`-code of hooks draaien. Controleer bij externe/containerdeployments dat je het daadwerkelijke `openclaw gateway run`-childproces opnieuw start, niet alleen een wrapperproces.

`plugins list --json` bevat de `dependencyStatus` van elke Plugin uit `package.json`
`dependencies` en `optionalDependencies`. OpenClaw controleert of die pakketnamen
aanwezig zijn langs het normale Node `node_modules`-opzoekpad van de Plugin; het
importeert geen Plugin-runtimecode, voert geen package manager uit en herstelt
ontbrekende afhankelijkheden niet.
</Note>

`plugins search` is een externe ClawHub-cataloguszoekopdracht. Het inspecteert geen lokale
status, wijzigt geen configuratie, installeert geen pakketten en laadt geen Plugin-runtimecode. Zoek
resultaten bevatten de ClawHub-pakketnaam, familie, kanaal, versie, samenvatting en
een installatietip zoals `openclaw plugins install clawhub:<package>`.

Voor werk aan gebundelde Plugins binnen een verpakte Docker-image, bind-mount je de Plugin-
bronmap over het overeenkomende verpakte bronpad, zoals
`/app/extensions/synology-chat`. OpenClaw ontdekt die gemounte bron-
overlay vóór `/app/dist/extensions/synology-chat`; een gewone gekopieerde bron-
map blijft inert, zodat normale verpakte installaties nog steeds de gecompileerde dist gebruiken.

Voor het debuggen van runtimehooks:

- `openclaw plugins inspect <id> --runtime --json` toont geregistreerde hooks en diagnostiek uit een module-geladen inspectiepass. Runtime-inspectie installeert nooit afhankelijkheden; gebruik `openclaw doctor --fix` om legacy afhankelijkheidsstatus op te schonen of ontbrekende downloadbare Plugins te herstellen waarnaar in config wordt verwezen.
- `openclaw gateway status --deep --require-rpc` bevestigt de bereikbare Gateway, service/proces-hints, configuratiepad en RPC-gezondheid.
- Niet-gebundelde gesprekshooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) vereisen `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gebruik `--link` om het kopiëren van een lokale map te vermijden (voegt toe aan `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wordt niet ondersteund met `--link`, omdat gekoppelde installaties het bronpad hergebruiken in plaats van over een beheerd installatiedoel heen te kopiëren.

Gebruik `--pin` bij npm-installaties om de opgeloste exacte specificatie (`name@version`) op te slaan in de beheerde Plugin-index, terwijl het standaardgedrag ongepind blijft.
</Note>

### Plugin-index

Metadata van Plugin-installaties is machinebeheerde status, geen gebruikersconfiguratie. Installaties en updates schrijven deze naar `plugins/installs.json` onder de actieve OpenClaw-statusmap. De top-level `installRecords`-map is de duurzame bron van installatiemetadata, inclusief records voor kapotte of ontbrekende Plugin-manifests. De `plugins`-array is de uit manifests afgeleide koude registrycache. Het bestand bevat een waarschuwing om het niet te bewerken en wordt gebruikt door `openclaw plugins update`, verwijderen, diagnostiek en de koude Plugin-registry.

Wanneer OpenClaw meegeleverde legacy `plugins.installs`-records in config ziet, behandelen runtimeleesbewerkingen ze als compatibiliteitsinvoer zonder `openclaw.json` te herschrijven. Expliciete Plugin-schrijfbewerkingen en `openclaw doctor --fix` verplaatsen die records naar de Plugin-index en verwijderen de configuratiesleutel wanneer configuratieschrijfbewerkingen zijn toegestaan; als een van beide schrijfbewerkingen mislukt, worden de configrecords behouden zodat de installatiemetadata niet verloren gaat.

### Verwijderen

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` verwijdert Plugin-records uit `plugins.entries`, de blijvend opgeslagen Plugin-index, Plugin allow/deny list-vermeldingen en gekoppelde `plugins.load.paths`-vermeldingen waar van toepassing. Tenzij `--keep-files` is ingesteld, verwijdert uninstall ook de bijgehouden beheerde installatiemap wanneer deze zich binnen de Plugin-extensieroot van OpenClaw bevindt. Voor Active Memory-Plugins wordt de geheugensleuf teruggezet naar `memory-core`.

<Note>
`--keep-config` wordt ondersteund als verouderd alias voor `--keep-files`.
</Note>

### Update

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Updates worden toegepast op bijgehouden Plugin-installaties in de beheerde Plugin-index en bijgehouden hook-pack-installaties in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Plugin-id versus npm-specificatie oplossen">
    Wanneer je een Plugin-id doorgeeft, hergebruikt OpenClaw de vastgelegde installatiespecificatie voor die Plugin. Dat betekent dat eerder opgeslagen dist-tags zoals `@beta` en exact vastgezette versies bij latere `update <id>`-runs gebruikt blijven worden.

    Voor npm-installaties kun je ook een expliciete npm-pakketspecificatie met een dist-tag of exacte versie doorgeven. OpenClaw herleidt die pakketnaam naar het bijgehouden Plugin-record, werkt die geïnstalleerde Plugin bij en legt de nieuwe npm-specificatie vast voor toekomstige id-gebaseerde updates.

    Het doorgeven van de npm-pakketnaam zonder versie of tag herleidt ook naar het bijgehouden Plugin-record. Gebruik dit wanneer een Plugin was vastgezet op een exacte versie en je deze wilt terugzetten naar de standaard releaselijn van de registry.

  </Accordion>
  <Accordion title="Updates voor het bètakanaal">
    `openclaw plugins update` hergebruikt de bijgehouden Plugin-specificatie, tenzij je een nieuwe specificatie doorgeeft. `openclaw update` kent daarnaast het actieve OpenClaw-updatekanaal: op het bètakanaal proberen standaardlijn-npm- en ClawHub-Plugin-records eerst `@beta` en vallen daarna terug op de vastgelegde default/latest-specificatie als er geen Plugin-bètarelease bestaat. Exacte versies en expliciete tags blijven aan die selector vastgezet.

  </Accordion>
  <Accordion title="Versiecontroles en integriteitsdrift">
    Vóór een live npm-update controleert OpenClaw de geïnstalleerde pakketversie aan de hand van de npm-registrymetadata. Als de geïnstalleerde versie en de vastgelegde artefactidentiteit al overeenkomen met het opgeloste doel, wordt de update overgeslagen zonder downloaden, opnieuw installeren of herschrijven van `openclaw.json`.

    Wanneer een opgeslagen integriteitshash bestaat en de opgehaalde artefacthash verandert, behandelt OpenClaw dat als npm-artefactdrift. De interactieve opdracht `openclaw plugins update` drukt de verwachte en werkelijke hashes af en vraagt om bevestiging voordat wordt doorgegaan. Niet-interactieve updatehelpers falen gesloten, tenzij de aanroeper een expliciet vervolgbeleid opgeeft.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install bij update">
    `--dangerously-force-unsafe-install` is ook beschikbaar bij `plugins update` als noodoverride voor fout-positieven van ingebouwde gevaarlijke-code-scans tijdens Plugin-updates. Het omzeilt nog steeds geen Plugin `before_install`-beleidsblokkades of blokkering door scanfouten, en het is alleen van toepassing op Plugin-updates, niet op hook-pack-updates.
  </Accordion>
</AccordionGroup>

### Inspecteren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect toont identiteit, laadstatus, bron, manifestcapaciteiten, beleidsvlaggen, diagnostiek, installatiemetadata, bundelcapaciteiten en eventuele gedetecteerde MCP- of LSP-serverondersteuning zonder standaard Plugin-runtime te importeren. Voeg `--runtime` toe om de Plugin-module te laden en geregistreerde hooks, tools, opdrachten, services, gatewaymethoden en HTTP-routes op te nemen. Runtime-inspectie rapporteert ontbrekende Plugin-afhankelijkheden direct; installaties en reparaties blijven in `openclaw plugins install`, `openclaw plugins update` en `openclaw doctor --fix`.

CLI-opdrachten in eigendom van Plugins worden meestal geïnstalleerd als root-`openclaw`-opdrachtgroepen, maar Plugins kunnen ook geneste opdrachten registreren onder een core-parent zoals `openclaw nodes`. Nadat `inspect --runtime` een opdracht onder `cliCommands` toont, voer je deze uit op het vermelde pad; bijvoorbeeld een Plugin die `demo-git` registreert kan worden geverifieerd met `openclaw demo-git ping`.

Elke Plugin wordt geclassificeerd op basis van wat deze daadwerkelijk registreert tijdens runtime:

- **plain-capability** — één capability-type (bijv. een provider-only plugin)
- **hybrid-capability** — meerdere capability-typen (bijv. tekst + spraak + afbeeldingen)
- **hook-only** — alleen hooks, geen capabilities of surfaces
- **non-capability** — tools/opdrachten/services maar geen capabilities

Zie [Plugin shapes](/nl/plugins/architecture#plugin-shapes) voor meer over het capability-model.

<Note>
De vlag `--json` voert een machineleesbaar rapport uit dat geschikt is voor scripting en auditing. `inspect --all` rendert een tabel voor de hele fleet met shape, capability-soorten, compatibiliteitsmeldingen, bundle-capabilities en samenvattingskolommen voor hooks. `info` is een alias voor `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` rapporteert laadfouten van plugins, manifest-/discovery-diagnostiek en compatibiliteitsmeldingen. Wanneer alles schoon is, wordt `No plugin issues detected.` afgedrukt.

Als een geconfigureerde plugin op schijf aanwezig is maar wordt geblokkeerd door de path-safety-controles van de loader, behoudt config-validatie de pluginvermelding en rapporteert deze als `present but blocked`. Los de voorafgaande diagnose voor de geblokkeerde plugin op, zoals padeigendom of world-writable machtigingen, in plaats van de `plugins.entries.<id>`- of `plugins.allow`-config te verwijderen.

Voor module-shape-fouten, zoals ontbrekende `register`/`activate`-exports, voer opnieuw uit met `OPENCLAW_PLUGIN_LOAD_DEBUG=1` om een compacte export-shape-samenvatting op te nemen in de diagnostische uitvoer.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

De lokale plugin-registry is OpenClaw's persistente cold-read-model voor geïnstalleerde pluginidentiteit, inschakeling, bronmetadata en eigenaarschap van bijdragen. Normaal opstarten, opzoeken van providereigenaren, classificatie van kanaalconfiguratie en plugin-inventaris kunnen deze lezen zonder runtime-modules van plugins te importeren.

Gebruik `plugins registry` om te inspecteren of de persistente registry aanwezig, actueel of verouderd is. Gebruik `--refresh` om deze opnieuw op te bouwen vanuit de persistente plugin-index, config-beleid en manifest-/pakketmetadata. Dit is een herstelpad, geen runtime-activeringspad.

`openclaw doctor --fix` herstelt ook registry-aangrenzende managed npm-drift: als een verweesd of hersteld `@openclaw/*`-pakket onder de managed plugin npm-root een gebundelde plugin overschaduwt, verwijdert doctor dat verouderde pakket en bouwt de registry opnieuw op zodat het opstarten valideert tegen het gebundelde manifest.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` is een verouderde break-glass-compatibiliteitsschakelaar voor leesfouten in de registry. Geef de voorkeur aan `plugins registry --refresh` of `openclaw doctor --fix`; de env-fallback is alleen bedoeld voor noodherstel van het opstarten terwijl de migratie wordt uitgerold.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list accepteert een lokaal marketplace-pad, een `marketplace.json`-pad, een GitHub-shorthand zoals `owner/repo`, een GitHub-repo-URL of een git-URL. `--json` drukt het opgeloste bronlabel af plus het geparseerde marketplace-manifest en de pluginvermeldingen.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [CLI-referentie](/nl/cli)
- [Community-plugins](/nl/plugins/community)
