---
read_when:
    - U wilt Gateway-plugins of compatibele bundels installeren of beheren
    - Je wilt een eenvoudige toolplugin opzetten of valideren
    - U wilt fouten bij het laden van plugins opsporen
sidebarTitle: Plugins
summary: CLI-referentie voor `openclaw plugins` (initialiseren, bouwen, valideren, weergeven, installeren, marktplaats, verwijderen, inschakelen/uitschakelen, diagnose)
title: Plugins
x-i18n:
    generated_at: "2026-07-12T08:43:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 729e74103a302936dc45da3be31306803b16e9dae182e78b3742783b892a9027
    source_path: cli/plugins.md
    workflow: 16
---

Beheer Gateway-plugins, hookpakketten en compatibele bundels.

<CardGroup cols={2}>
  <Card title="Pluginsysteem" href="/nl/tools/plugin">
    Gebruikershandleiding voor het installeren, inschakelen en oplossen van problemen met plugins.
  </Card>
  <Card title="Plugins beheren" href="/nl/plugins/manage-plugins">
    Beknopte voorbeelden voor installeren, weergeven, bijwerken, verwijderen en publiceren.
  </Card>
  <Card title="Pluginbundels" href="/nl/plugins/bundles">
    Compatibiliteitsmodel voor bundels.
  </Card>
  <Card title="Pluginmanifest" href="/nl/plugins/manifest">
    Manifestvelden en configuratieschema.
  </Card>
  <Card title="Beveiliging" href="/nl/gateway/security">
    Beveiligingsversterking voor plugininstallaties.
  </Card>
</CardGroup>

## Opdrachten

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # alias for inspect
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id> [--dry-run] [--keep-files] [--force]
openclaw plugins update <id-or-npm-spec> | --all [--dry-run]
openclaw plugins registry [--refresh] [--json]
openclaw plugins doctor
openclaw plugins init <id> [--name <name>] [--type tool|provider] [--directory <path>]
openclaw plugins build [--entry <path>] [--check]
openclaw plugins validate [--entry <path>]
openclaw plugins marketplace entries [--offline] [--feed-profile <name>] [--json]
openclaw plugins marketplace list <source> [--json]
openclaw plugins marketplace refresh [--feed-profile <name>] [--expected-sha256 <sha256>] [--json]
```

Voer voor onderzoek naar een trage installatie, inspectie, verwijdering of registervernieuwing de opdracht uit met `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. De tracering schrijft de tijdsduur van fasen naar stderr en houdt JSON-uitvoer parseerbaar. Zie [Foutopsporing](/nl/help/debugging#plugin-lifecycle-trace).

<Note>
In Nix-modus (`OPENCLAW_NIX_MODE=1`) is `openclaw.json` onveranderlijk. `install`, `update`, `uninstall`, `enable` en `disable` weigeren allemaal te worden uitgevoerd. Bewerk in plaats daarvan de Nix-bron voor deze installatie (`programs.openclaw.config` of `instances.<name>.config` voor nix-openclaw) en bouw vervolgens opnieuw. Zie de agentgerichte [Snelstart](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Gebundelde plugins worden met OpenClaw meegeleverd. Sommige zijn standaard ingeschakeld (bijvoorbeeld gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browserplugin); voor andere is `plugins enable` vereist.

Systeemeigen OpenClaw-plugins leveren `openclaw.plugin.json` met een ingesloten JSON Schema (`configSchema`, zelfs als dit leeg is). Compatibele bundels gebruiken in plaats daarvan hun eigen bundelmanifests.

`plugins list` toont `Format: openclaw` of `Format: bundle`. Uitgebreide uitvoer van list/info toont ook het bundelsubtype (`codex`, `claude` of `cursor`) en de gedetecteerde bundelmogelijkheden.
</Note>

## Maken

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` maakt standaard een minimale TypeScript-toolplugin. Het eerste argument is de plugin-id; `--name` stelt de weergavenaam in. OpenClaw gebruikt de id voor de standaarduitvoermap en de pakketnaamgeving. Tool-sjablonen gebruiken `defineToolPlugin` en genereren in `package.json` de scripts `plugin:build` en `plugin:validate`, die eerst bouwen en daarna `openclaw plugins build`/`validate` aanroepen.

`plugins build` importeert het gebouwde ingangspunt, leest de statische toolmetadata, schrijft `openclaw.plugin.json` en houdt `openclaw.extensions` in `package.json` gesynchroniseerd. `plugins validate` controleert of het gegenereerde manifest, de pakketmetadata en de huidige export van het ingangspunt nog steeds overeenkomen. Zie [Toolplugins](/nl/plugins/tool-plugins) voor de volledige ontwikkelwerkstroom.

De sjabloon schrijft TypeScript-broncode, maar genereert metadata vanuit het gebouwde ingangspunt `./dist/index.js`, zodat de werkstroom ook met de gepubliceerde CLI werkt. Gebruik `--entry <path>` wanneer het ingangspunt niet het standaardingangspunt van het pakket is. Gebruik `plugins build --check` in CI om de uitvoering te laten mislukken wanneer gegenereerde metadata verouderd is, zonder bestanden te herschrijven.

### Providersjabloon

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Providersjablonen maken een generieke, met OpenAI compatibele plugin voor modelproviders, met API-sleutelauthenticatie, een script `npm run validate` dat `clawhub package validate` uitvoert, ClawHub-pakketmetadata en een handmatig gestarte GitHub Actions-werkstroom voor toekomstige vertrouwde publicatie via GitHub OIDC. Providersjablonen genereren geen Skills en gebruiken `openclaw plugins build`/`validate` niet; die opdrachten zijn bedoeld voor het pad met gegenereerde metadata van de toolsjabloon.

Vervang vóór publicatie de tijdelijke basis-URL van de API, de modelcatalogus, de documentatieroute, de tekst over aanmeldgegevens en de README-tekst door echte providergegevens. Gebruik de gegenereerde README voor de eerste publicatie op ClawHub en voor het instellen van een vertrouwde uitgever.

## Installeren

```bash
openclaw plugins search "calendar"                      # search ClawHub plugins
openclaw plugins install <package>                       # source auto-detection
openclaw plugins install clawhub:<package>                # ClawHub only
openclaw plugins install npm:<package>                    # npm only
openclaw plugins install npm-pack:<path.tgz>               # local npm-pack tarball
openclaw plugins install git:github.com/<owner>/<repo>     # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # local path or archive
openclaw plugins install -l <path>                         # link instead of copy
openclaw plugins install <plugin>@<marketplace>             # marketplace shorthand
openclaw plugins install <plugin> --marketplace <name>      # marketplace (explicit)
openclaw plugins install <package> --force                  # overwrite existing install
openclaw plugins install <package> --pin                    # pin resolved npm version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

Beheerders die installaties tijdens de configuratie testen, kunnen automatische installatiebronnen voor plugins overschrijven met beveiligde omgevingsvariabelen. Zie [Overschrijvingen voor plugininstallaties](/nl/plugins/install-overrides).

<Warning>
Tijdens de overgang bij de lancering worden kale pakketnamen standaard vanaf npm geïnstalleerd, tenzij ze overeenkomen met de id van een gebundelde of officiële plugin. In dat geval gebruikt OpenClaw die lokale/officiële kopie in plaats van het npm-register te benaderen. Gebruik `npm:<package>` wanneer u bewust een extern npm-pakket wilt gebruiken. Gebruik `clawhub:<package>` voor ClawHub. Behandel plugininstallaties alsof u code uitvoert; geef de voorkeur aan vastgezette versies.
</Warning>

`plugins search` doorzoekt ClawHub naar installeerbare pakketten van het type `code-plugin` en `bundle-plugin` (geen Skills; gebruik daarvoor `openclaw skills search`). De standaardwaarde van `--limit` is 20, met een maximum van 100. De opdracht leest alleen de externe catalogus: er vindt geen inspectie van lokale status, wijziging van configuratie, pakketinstallatie of laadactie van de pluginruntime plaats. Resultaten bevatten de ClawHub-pakketnaam, familie, het kanaal, de versie, een samenvatting en een installatiehint zoals `openclaw plugins install clawhub:<package>`.

<Note>
ClawHub is voor de meeste plugins het primaire platform voor distributie en ontdekking. Npm blijft een ondersteund alternatief en een pad voor rechtstreekse installatie. OpenClaw-pluginpakketten van `@openclaw/*` worden weer op npm gepubliceerd; zie de actuele lijst op [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) of de [plugininventaris](/nl/plugins/plugin-inventory). Stabiele installaties gebruiken `latest`. Installaties en updates via het bètakanaal geven de voorkeur aan de npm-dist-tag `beta` wanneer deze beschikbaar is en vallen anders terug op `latest`. Op het kanaal met verlengde stabiliteit worden officiële npm-plugins met kale/standaardintentie of `latest`-intentie omgezet naar exact de geïnstalleerde kernversie. Exact vastgezette versies en expliciete tags anders dan `latest`, pakketten van derden en bronnen buiten npm worden niet herschreven.
</Note>

<AccordionGroup>
  <Accordion title="Configuratie-insluitingen en herstel van ongeldige configuratie">
    Als uw sectie `plugins` wordt geleverd via een `$include` met één bestand, schrijven `plugins install/update/enable/disable/uninstall` rechtstreeks naar dat ingesloten bestand en laten ze `openclaw.json` ongemoeid. Insluitingen op hoofdniveau, insluitingsarrays en insluitingen met overschrijvingen op hetzelfde niveau worden veiligheidshalve geweigerd in plaats van samengevoegd. Zie [Configuratie-insluitingen](/nl/gateway/configuration) voor de ondersteunde structuren.

    Als de configuratie tijdens de installatie ongeldig is, wordt `plugins install` normaal gesproken veiligheidshalve afgebroken en krijgt u de instructie om eerst `openclaw doctor --fix` uit te voeren. Tijdens het starten en direct herladen van de Gateway wordt ongeldige pluginconfiguratie veiligheidshalve geweigerd, net als elke andere ongeldige configuratie; `openclaw doctor --fix` kan de ongeldige pluginvermelding in quarantaine plaatsen. De enige gedocumenteerde uitzondering tijdens de installatie is een beperkt herstelpad voor gebundelde plugins die expliciet instemmen via `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force en opnieuw installeren tegenover bijwerken">
    `--force` hergebruikt het bestaande installatiedoel en overschrijft een reeds geïnstalleerde plugin of een reeds geïnstalleerd hookpakket ter plaatse. Gebruik dit wanneer u bewust dezelfde id opnieuw installeert vanuit een nieuw lokaal pad, archief, ClawHub-pakket of npm-artefact. Geef voor routinematige upgrades van een reeds gevolgde npm-plugin de voorkeur aan `openclaw plugins update <id-or-npm-spec>`.

    Als u `plugins install` uitvoert voor een plugin-id die al is geïnstalleerd, stopt OpenClaw en verwijst het u naar `plugins update <id-or-npm-spec>` voor een normale upgrade, of naar `plugins install <package> --force` wanneer u de huidige installatie daadwerkelijk vanuit een andere bron wilt overschrijven. `--force` wordt niet ondersteund met `--link`.

  </Accordion>
  <Accordion title="Bereik van --pin">
    `--pin` is alleen van toepassing op npm-installaties en legt de exact vastgestelde `<name>@<version>` vast. Het wordt niet ondersteund met `git:`-installaties (zet in plaats daarvan de referentie vast in de specificatie, bijvoorbeeld `git:github.com/acme/plugin@v1.2.3`) of met `--marketplace` (marketplace-installaties bewaren metadata over de marketplace-bron in plaats van een npm-specificatie).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` is verouderd en doet nu niets. OpenClaw voert niet langer ingebouwde blokkering van gevaarlijke code tijdens plugininstallaties uit.

    Gebruik het door de beheerder beheerde oppervlak `security.installPolicy` wanneer hostspecifiek installatiebeleid vereist is. Pluginhooks `before_install` zijn levenscyclushooks van de pluginruntime en niet de primaire beleidsgrens voor CLI-installaties.

    Als een door u op ClawHub gepubliceerde plugin door een registerscan verborgen of geblokkeerd is, gebruikt u de stappen voor uitgevers in [Publiceren op ClawHub](/nl/clawhub/publishing). `--dangerously-force-unsafe-install` vraagt ClawHub niet om de plugin opnieuw te scannen of een geblokkeerde release openbaar te maken.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Bij installaties vanuit de ClawHub-community wordt vóór het downloaden het vertrouwensrecord van de geselecteerde release gecontroleerd. Als ClawHub downloaden voor de release uitschakelt, schadelijke scanbevindingen meldt of de release in een blokkerende moderatiestatus plaatst (in quarantaine geplaatst of ingetrokken), weigert OpenClaw de release zonder uitzondering, ongeacht deze vlag. Bij niet-blokkerende risicovolle scanstatussen of moderatiestatussen toont OpenClaw de vertrouwensgegevens en vraagt het om bevestiging voordat het doorgaat.

    Gebruik `--acknowledge-clawhub-risk` alleen nadat u de ClawHub-waarschuwing hebt beoordeeld en hebt besloten zonder interactieve vraag door te gaan. Scanresultaten die in behandeling of verouderd (nog niet schoon) zijn, geven een waarschuwing maar vereisen geen bevestiging. Officiële ClawHub-pakketten en gebundelde OpenClaw-pluginbronnen slaan deze controle van het releasevertrouwen volledig over.

  </Accordion>
  <Accordion title="Hookpakketten en npm-specificaties">
    `plugins install` is ook het installatieoppervlak voor hookpakketten die `openclaw.hooks` beschikbaar stellen in `package.json`. Gebruik `openclaw hooks` voor gefilterde zichtbaarheid van hooks en het afzonderlijk inschakelen van hooks, niet voor pakketinstallatie.

    Npm-specificaties zijn **uitsluitend voor het register** (pakketnaam plus optioneel een **exacte versie** of **dist-tag**). Git-/URL-/bestandsspecificaties en semver-bereiken worden geweigerd. Afhankelijkheden worden voor de veiligheid per plugin in één beheerd npm-project geïnstalleerd met `--ignore-scripts`, zelfs wanneer uw shell algemene npm-installatie-instellingen heeft. Beheerde npm-projecten voor plugins nemen de npm-`overrides` op pakketniveau van OpenClaw over, zodat beveiligingsvastzettingen van de host ook gelden voor gehoiste plugin-afhankelijkheden.

    Gebruik `npm:<package>` om npm-resolutie expliciet te maken. Kale pakketspecificaties worden tijdens de overgang bij de introductie ook rechtstreeks vanuit npm geïnstalleerd, tenzij ze overeenkomen met een officiële plugin-id.

    Onbewerkte `@openclaw/*`-specificaties die overeenkomen met gebundelde plugins worden vóór de npm-terugval naar de gebundelde kopie van de image herleid. `openclaw plugins install @openclaw/discord@2026.5.20 --pin` gebruikt bijvoorbeeld de gebundelde Discord-plugin uit de huidige OpenClaw-build in plaats van een beheerde npm-overschrijving te maken. Gebruik `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` om het externe npm-pakket af te dwingen.

    Kale specificaties en `@latest` blijven op het stabiele spoor. Van een datumstempel voorziene correctieversies van OpenClaw, zoals `2026.5.3-1`, gelden voor deze controle als stabiel. Als npm een van beide vormen naar een prerelease herleidt, stopt OpenClaw en wordt u gevraagd expliciet in te stemmen met een prerelease-tag (`@beta`/`@rc`) of een exacte prereleaseversie (`@1.2.3-beta.4`).

    Voor npm-installaties zonder exacte versie (`npm:<package>` of `npm:<package>@latest`) controleert OpenClaw vóór de installatie de metadata van het herleide pakket. Als het nieuwste stabiele pakket een nieuwere plugin-API van OpenClaw of een hogere minimale hostversie vereist, onderzoekt OpenClaw oudere stabiele versies en installeert het in plaats daarvan de nieuwste compatibele release. Exacte versies en expliciete dist-tags blijven strikt: een incompatibele selectie mislukt en vraagt u OpenClaw te upgraden of een compatibele versie te kiezen.

    Als een kale installatiespecificatie overeenkomt met een officiële plugin-id (bijvoorbeeld `diffs`), installeert OpenClaw de catalogusvermelding rechtstreeks. Gebruik een expliciete specificatie met scope (bijvoorbeeld `@scope/diffs`) om een npm-pakket met dezelfde naam te installeren.

  </Accordion>
  <Accordion title="Git-opslagplaatsen">
    Gebruik `git:<repo>` om rechtstreeks vanuit een git-opslagplaats te installeren. Ondersteunde vormen: `git:github.com/owner/repo`, `git:owner/repo`, volledige `https://`-, `ssh://`-, `git://`- en `file://`-URL's en kloon-URL's in de vorm `git@host:owner/repo.git`. Voeg `@<ref>` of `#<ref>` toe om vóór de installatie een branch, tag of commit uit te checken.

    Bij git-installaties wordt de opslagplaats naar een tijdelijke map gekloond, wordt de aangevraagde referentie uitgecheckt wanneer die aanwezig is en wordt vervolgens het normale installatieprogramma voor pluginmappen gebruikt. Daardoor werken manifestvalidatie, installatiebeleid voor operators, installatiewerk van de pakketbeheerder en installatieregistraties hetzelfde als bij npm-installaties. Geregistreerde git-installaties bevatten de bron-URL/-referentie plus de herleide commit, zodat `openclaw plugins update` de bron later opnieuw kan herleiden.

    Gebruik na installatie vanuit git `openclaw plugins inspect <id> --runtime --json` om runtimeregistraties, zoals Gateway-methoden en CLI-opdrachten, te verifiëren. Als de plugin met `api.registerCli` een CLI-hoofdopdracht heeft geregistreerd, voert u die opdracht rechtstreeks uit via de hoofd-CLI van OpenClaw, bijvoorbeeld `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archieven">
    Ondersteunde archieven: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Systeemeigen OpenClaw-pluginarchieven moeten een geldig `openclaw.plugin.json` bevatten in de hoofdmap van de uitgepakte plugin; archieven die alleen `package.json` bevatten, worden geweigerd voordat OpenClaw installatieregistraties schrijft.

    Gebruik `npm-pack:<path.tgz>` wanneer het bestand een npm-pack-tarball is en u
    hetzelfde pad voor een beheerd npm-project per plugin wilt gebruiken als bij registerinstallaties,
    inclusief verificatie van `package-lock.json`, het scannen van gehoiste afhankelijkheden
    en npm-installatieregistraties. Gewone archiefpaden worden nog steeds als lokale
    archieven onder de hoofdmap voor pluginextensies geïnstalleerd.

    Installaties vanuit de Claude-marketplace worden ook ondersteund.

  </Accordion>
</AccordionGroup>

ClawHub-installaties gebruiken een expliciete `clawhub:<package>`-locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Kale npm-veilige pluginspecificaties worden tijdens de overgang bij de introductie standaard vanuit npm geïnstalleerd, tenzij ze overeenkomen met een officiële plugin-id:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gebruik `npm:` om uitsluitend npm-resolutie expliciet te maken:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controleert vóór de installatie de geadverteerde compatibiliteit met de plugin-API/minimale Gateway-versie. Wanneer de geselecteerde ClawHub-versie een ClawPack-artefact publiceert, downloadt OpenClaw de geversioneerde npm-pack-`.tgz`, verifieert het de ClawHub-digestheader en de digest van het artefact en installeert het dit vervolgens via het normale archiefpad. Oudere ClawHub-versies zonder ClawPack-metadata worden nog steeds geïnstalleerd via het verouderde verificatiepad voor pakketarchieven. Geregistreerde installaties behouden hun ClawHub-bronmetadata, artefacttype, npm-integriteit, npm-shasum, tarballnaam en ClawPack-digestgegevens voor latere updates.
Niet-geversioneerde ClawHub-installaties behouden een niet-geversioneerde geregistreerde specificatie, zodat `openclaw plugins update` nieuwere ClawHub-releases kan volgen; expliciete versie- of tagselectoren zoals `clawhub:pkg@1.2.3` en `clawhub:pkg@beta` blijven aan die selector vastgezet.

### Verkorte marketplace-notatie

Gebruik de verkorte notatie `plugin@marketplace` wanneer de naam van de marketplace voorkomt in de lokale registercache van Claude op `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Gebruik `--marketplace` om de marketplace-bron expliciet door te geven:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace-bronnen">
    - een naam van een bekende Claude-marketplace uit `~/.claude/plugins/known_marketplaces.json`
    - een lokale hoofdmap van een marketplace of een pad naar `marketplace.json`
    - een verkorte GitHub-opslagplaatsnotatie zoals `owner/repo`
    - een URL van een GitHub-opslagplaats zoals `https://github.com/owner/repo`
    - een git-URL

  </Tab>
  <Tab title="Regels voor externe marketplaces">
    Voor externe marketplaces die vanuit GitHub of git worden geladen, moeten pluginvermeldingen binnen de gekloonde marketplace-opslagplaats blijven. OpenClaw accepteert relatieve padbronnen uit die opslagplaats en weigert HTTP(S)-, absolute-pad-, git-, GitHub- en andere pluginbronnen die geen pad zijn uit externe manifests.
  </Tab>
</Tabs>

Voor lokale paden en archieven detecteert OpenClaw automatisch:

- systeemeigen OpenClaw-plugins (`openclaw.plugin.json`)
- Codex-compatibele bundels (`.codex-plugin/plugin.json`)
- Claude-compatibele bundels (`.claude-plugin/plugin.json`, of de standaardindeling van Claude-componenten wanneer dat manifestbestand ontbreekt)
- Cursor-compatibele bundels (`.cursor-plugin/plugin.json`)

Beheerde lokale installaties moeten pluginmappen of archieven zijn. Zelfstandige pluginbestanden met de extensie `.js`,
`.mjs`, `.cjs` of `.ts` worden door `plugins install` niet naar de beheerde hoofdmap voor plugins
gekopieerd en evenmin geladen door ze rechtstreeks in
`~/.openclaw/extensions` of `<workspace>/.openclaw/extensions` te plaatsen; deze
automatisch ontdekte hoofdmappen laden pluginpakket- of bundelmappen en slaan
scriptbestanden op het hoogste niveau over als lokale hulpprogramma's. Vermeld zelfstandige bestanden
in plaats daarvan expliciet in `plugins.load.paths`.

<Note>
Compatibele bundels worden in de normale hoofdmap voor plugins geïnstalleerd en nemen deel aan dezelfde stroom voor weergeven/informatie/inschakelen/uitschakelen. Momenteel worden Skills in bundels, Claude-opdracht-Skills, standaardwaarden uit Claude-`settings.json`, standaardwaarden uit Claude-`.lsp.json`/in het manifest gedeclareerde `lspServers`, Cursor-opdracht-Skills en compatibele Codex-hookmappen ondersteund; andere gedetecteerde bundelmogelijkheden worden weergegeven in diagnostiek/informatie, maar zijn nog niet gekoppeld aan runtime-uitvoering.
</Note>

Gebruik `-l`/`--link` om zonder kopiëren naar een lokale pluginmap te verwijzen (voegt
deze toe aan `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--link` wordt niet ondersteund met `--force` (gekoppelde plugins verwijzen rechtstreeks naar het bronpad,
dus er valt ter plaatse niets te overschrijven), `--marketplace` of
`git:`-installaties, en vereist een lokaal pad dat al bestaat.

<Note>
Plugins die afkomstig zijn uit een werkruimte en vanuit een hoofdmap voor werkruimte-extensies worden ontdekt, worden niet
geïmporteerd of uitgevoerd totdat ze expliciet zijn ingeschakeld. Voer voor lokale ontwikkeling
`openclaw plugins enable <plugin-id>` uit of stel
`plugins.entries.<plugin-id>.enabled: true` in; als uw configuratie
`plugins.allow` gebruikt, neemt u daarin ook dezelfde plugin-id op. Deze standaardblokkeringsregel
geldt ook wanneer de kanaalconfiguratie expliciet een plugin uit de werkruimte aanwijst om
alleen voor configuratie te laden. Daardoor wordt de configuratiecode van een lokale kanaalplugin niet uitgevoerd zolang die
werkruimteplugin uitgeschakeld blijft of van de toelatingslijst is uitgesloten. Gekoppelde installaties
en expliciete vermeldingen in `plugins.load.paths` volgen het normale beleid voor hun
herleide pluginoorsprong. Zie
[Pluginbeleid configureren](/nl/tools/plugin#configure-plugin-policy)
en [Configuratiereferentie](/nl/gateway/configuration-reference#plugins).

Gebruik `--pin` bij npm-installaties om de herleide exacte specificatie (`name@version`) op te slaan in de beheerde pluginindex, terwijl het standaardgedrag niet-vastgezet blijft.
</Note>

## Lijst

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Toon alleen ingeschakelde plugins.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Schakel van de tabelweergave over naar detailregels per plugin met metadata over indeling/bron/oorsprong/versie/activering.
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare inventaris plus registerdiagnostiek en de installatiestatus van pakketafhankelijkheden.
</ParamField>

<Note>
`plugins list` leest eerst het persistente lokale pluginregister, met een uitsluitend van het manifest afgeleide terugval wanneer het register ontbreekt of ongeldig is. Dit is nuttig om te controleren of een plugin is geïnstalleerd, ingeschakeld en zichtbaar is voor de planning van een koude start, maar het is geen live runtimecontrole van een Gateway-proces dat al wordt uitgevoerd. Start na wijzigingen in plugincode, inschakeling, hookbeleid of `plugins.load.paths` de Gateway die het kanaal bedient opnieuw voordat u verwacht dat nieuwe `register(api)`-code of hooks worden uitgevoerd. Controleer bij externe/containerimplementaties of u het daadwerkelijke onderliggende proces `openclaw gateway run` opnieuw start en niet alleen een wrapperproces.

`plugins list --json` bevat voor elke plugin de `dependencyStatus` uit `dependencies`
en `optionalDependencies` in `package.json`. OpenClaw controleert of die pakketnamen
aanwezig zijn langs het normale Node-zoekpad voor `node_modules` van de plugin; het
importeert geen runtimecode van de plugin, voert geen pakketbeheerder uit en herstelt geen
ontbrekende afhankelijkheden.
</Note>

Als bij het opstarten `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` wordt vastgelegd,
voert u `openclaw plugins list --enabled --verbose` of
`openclaw plugins inspect <id>` uit met een vermelde plugin-id om de plugin-id's
te bevestigen en vertrouwde id's naar `plugins.allow` in `openclaw.json` te kopiëren. Wanneer de
waarschuwing elke ontdekte plugin kan vermelden, wordt een direct te plakken
`plugins.allow`-fragment weergegeven waarin die id's al zijn opgenomen. Als een plugin zonder
herkomst uit een installatie of laadpad wordt geladen, inspecteert u die plugin-id en zet u vervolgens
de vertrouwde id vast in `plugins.allow` of installeert u de plugin opnieuw vanuit een vertrouwde bron,
zodat OpenClaw de installatieherkomst registreert.

Voor werk aan gebundelde plugins binnen een verpakte Docker-image koppelt u de
bronmap van de plugin als bind-mount over het overeenkomende verpakte bronpad, zoals
`/app/extensions/synology-chat`. OpenClaw ontdekt die gekoppelde bronoverlay
vóór `/app/dist/extensions/synology-chat`; een gewoon gekopieerde bronmap
blijft inactief, zodat normale verpakte installaties nog steeds de gecompileerde distributie gebruiken.

Voor het opsporen van fouten in runtime-hooks:

- `openclaw plugins inspect <id> --runtime --json` toont geregistreerde hooks en diagnostische gegevens uit een inspectieronde waarbij de module is geladen. Runtime-inspectie installeert nooit afhankelijkheden; gebruik `openclaw doctor --fix` om verouderde afhankelijkheidsstatus op te schonen of ontbrekende downloadbare plugins te herstellen waarnaar in de configuratie wordt verwezen.
- `openclaw gateway status --deep --require-rpc` bevestigt de bereikbare Gateway-URL/het bereikbare Gateway-profiel, aanwijzingen over de service/het proces, het configuratiepad en de RPC-status.
- Niet-meegeleverde gesprekshooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) vereisen `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Pluginindex

Installatiemetadata van plugins is door de machine beheerde status, geen gebruikersconfiguratie. Installaties en updates schrijven deze naar de gedeelde SQLite-statusdatabase onder de actieve OpenClaw-statusmap. De rij `installed_plugin_index` bewaart duurzame `installRecords`-metadata, waaronder records voor defecte of ontbrekende pluginmanifesten, plus een van het manifest afgeleide koude registercache die wordt gebruikt door `openclaw plugins update`, verwijderen, diagnostiek en het koude pluginregister.

Wanneer OpenClaw meegeleverde verouderde `plugins.installs`-records in de configuratie aantreft, behandelen runtimelezingen deze als compatibiliteitsinvoer zonder `openclaw.json` te herschrijven. Expliciete pluginschrijfacties en `openclaw doctor --fix` verplaatsen deze records naar de pluginindex en verwijderen de configuratiesleutel wanneer schrijven naar de configuratie is toegestaan; als een van beide schrijfacties mislukt, blijven de configuratierecords behouden zodat de installatiemetadata niet verloren gaat.

## Verwijderen

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` verwijdert pluginrecords uit `plugins.entries`, de permanente pluginindex, vermeldingen in de toestaan/weigeren-lijsten voor plugins en, indien van toepassing, gekoppelde vermeldingen in `plugins.load.paths`. Tenzij `--keep-files` is ingesteld, verwijdert verwijderen ook de bijgehouden beheerde installatiemap, maar alleen wanneer deze binnen de hoofdmap voor pluginextensies van OpenClaw wordt opgelost. Als de plugin momenteel eigenaar is van het vak `memory` of `contextEngine`, wordt dat vak teruggezet naar de standaardwaarde (`memory-core` voor geheugen, `legacy` voor de contextengine).

`uninstall` toont een voorbeeld van wat wordt verwijderd en vraagt vervolgens `Uninstall plugin "<id>"?` voordat wijzigingen worden aangebracht. Geef `--force` door om de bevestigingsvraag over te slaan (nuttig voor scripts en niet-interactieve uitvoeringen); zonder deze optie vereist verwijderen een interactieve TTY. `--dry-run` toont hetzelfde voorbeeld en sluit af zonder iets te vragen of te wijzigen.

<Note>
`--keep-config` wordt ondersteund als verouderde alias voor `--keep-files`.
</Note>

## Bijwerken

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Updates zijn van toepassing op bijgehouden plugininstallaties in de beheerde pluginindex en bijgehouden hookpakketinstallaties in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Plugin-id versus npm-specificatie oplossen">
    Wanneer u een plugin-id doorgeeft, hergebruikt OpenClaw de vastgelegde installatiespecificatie voor die plugin. Dit betekent dat eerder opgeslagen dist-tags zoals `@beta` en exact vastgezette versies bij latere uitvoeringen van `update <id>` gebruikt blijven worden.

    Tijdens `update <id> --dry-run` blijven exact vastgezette npm-installaties vastgezet. Als OpenClaw ook de standaardreeks van het pakket in het register kan bepalen en die standaardreeks nieuwer is dan de geïnstalleerde vastgezette versie, meldt de proefuitvoering de vastzetting en toont deze de expliciete pakketbijwerkopdracht met `@latest` om de standaardreeks van het register te volgen.

    Die regel voor gerichte updates verschilt van het bulkonderhoudspad `openclaw plugins update --all`. Bulkuupdates respecteren nog steeds gewone bijgehouden installatiespecificaties, maar records van vertrouwde officiële OpenClaw-plugins kunnen synchroniseren met het huidige officiële catalogusdoel in plaats van op een verouderd exact officieel pakket te blijven. Gebruik gerichte `update <id>` wanneer u bewust een exacte of getagde officiële specificatie ongewijzigd wilt behouden.

    Voor npm-installaties kunt u ook een expliciete npm-pakketspecificatie met een dist-tag of exacte versie doorgeven. OpenClaw koppelt die pakketnaam terug aan het bijgehouden pluginrecord, werkt die geïnstalleerde plugin bij en slaat de nieuwe npm-specificatie op voor toekomstige updates op basis van het id.

    Als u de npm-pakketnaam zonder versie of tag doorgeeft, wordt deze eveneens teruggekoppeld aan het bijgehouden pluginrecord. Gebruik dit wanneer een plugin op een exacte versie was vastgezet en u deze terug wilt verplaatsen naar de standaardreleasereeks van het register.

  </Accordion>
  <Accordion title="Updates via het bètakanaal">
    Gerichte `openclaw plugins update <id-or-npm-spec>` hergebruikt de bijgehouden pluginspecificatie, tenzij u een nieuwe specificatie doorgeeft. `openclaw plugins update --all` gebruikt bij het synchroniseren van vertrouwde officiële pluginrecords met het officiële catalogusdoel het geconfigureerde `update.channel`, zodat installaties via het bètakanaal op de bètareleasereeks kunnen blijven in plaats van stilzwijgend te worden genormaliseerd naar stabiel/nieuwste.

    `openclaw update` kent ook het actieve OpenClaw-updatekanaal: op het bètakanaal proberen npm- en ClawHub-pluginrecords van de standaardreeks eerst `@beta`. Ze vallen terug op de vastgelegde standaard/nieuwste specificatie als er geen bètarelease van de plugin bestaat; npm-plugins vallen ook terug wanneer het bètapakket bestaat maar niet door de installatievalidatie komt. Die terugval wordt als waarschuwing gemeld en laat de kernupdate niet mislukken. Exacte versies en expliciete tags blijven voor gerichte updates vastgezet op die selector.

  </Accordion>
  <Accordion title="Versiecontroles en integriteitsafwijkingen">
    Vóór een actieve npm-update controleert OpenClaw de geïnstalleerde pakketversie aan de hand van de metadata in het npm-register. Als de geïnstalleerde versie en vastgelegde artefactidentiteit al overeenkomen met het bepaalde doel, wordt de update overgeslagen zonder `openclaw.json` te downloaden, opnieuw te installeren of te herschrijven.

    Wanneer er een opgeslagen integriteitshash bestaat en de hash van het opgehaalde artefact verandert, behandelt OpenClaw dit als een npm-artefactafwijking. De interactieve opdracht `openclaw plugins update` toont de verwachte en werkelijke hashes en vraagt om bevestiging voordat wordt doorgegaan. Niet-interactieve updatehulpmiddelen stoppen veilig, tenzij de aanroeper een expliciet voortzettingsbeleid opgeeft.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install bij bijwerken">
    `--dangerously-force-unsafe-install` wordt vanwege compatibiliteit ook geaccepteerd bij `plugins update`, maar is verouderd en verandert het gedrag van pluginupdates niet meer. Het beheerdersbeleid `security.installPolicy` kan updates nog steeds blokkeren; pluginhooks `before_install` zijn alleen van toepassing in processen waarin pluginhooks zijn geladen.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk bij bijwerken">
    Updates van communityplugins die door ClawHub worden ondersteund, voeren vóór het downloaden van het vervangende pakket dezelfde vertrouwenscontrole voor de exacte release uit als installaties. Gebruik `--acknowledge-clawhub-risk` voor beoordeelde automatisering die moet doorgaan wanneer de geselecteerde ClawHub-release een risicovolle vertrouwenswaarschuwing heeft. Officiële ClawHub-pakketten en meegeleverde OpenClaw-pluginbronnen slaan deze vraag over releasevertrouwen over.
  </Accordion>
</AccordionGroup>

## Inspecteren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

Inspecteren toont identiteit, laadstatus, bron, manifestmogelijkheden, beleidsvlaggen, diagnostische gegevens, installatiemetadata, bundelmogelijkheden en eventueel gedetecteerde ondersteuning voor MCP- of LSP-servers zonder standaard de pluginruntime te importeren. JSON-uitvoer bevat de contracten van het pluginmanifest, zoals `contracts.agentToolResultMiddleware` en `contracts.trustedToolPolicies`, zodat beheerders verklaringen voor vertrouwde oppervlakken kunnen controleren voordat ze een plugin inschakelen of opnieuw starten. Voeg `--runtime` toe om de pluginmodule te laden en geregistreerde hooks, hulpmiddelen, opdrachten, services, Gateway-methoden en HTTP-routes op te nemen. Runtime-inspectie meldt ontbrekende pluginafhankelijkheden rechtstreeks; installaties en reparaties blijven in `openclaw plugins install`, `openclaw plugins update` en `openclaw doctor --fix`.

CLI-opdrachten die eigendom zijn van plugins, worden gewoonlijk geïnstalleerd als hoofdopdrachtgroepen van `openclaw`, maar plugins kunnen ook geneste opdrachten registreren onder een bovenliggende kernopdracht zoals `openclaw nodes`. Nadat `inspect --runtime` een opdracht onder `cliCommands` toont, voert u deze uit via het vermelde pad; een plugin die bijvoorbeeld `demo-git` registreert, kan worden geverifieerd met `openclaw demo-git ping`.

Elke plugin wordt geclassificeerd op basis van wat deze daadwerkelijk tijdens runtime registreert:

| Vorm                | Betekenis                                                                    |
| ------------------- | ---------------------------------------------------------------------------- |
| `plain-capability`  | precies één mogelijkheidstype (bijv. een plugin met alleen een provider)     |
| `hybrid-capability` | meer dan één mogelijkheidstype (bijv. tekst + spraak + afbeeldingen)         |
| `hook-only`         | alleen hooks, geen mogelijkheden, hulpmiddelen, opdrachten, services of routes |
| `non-capability`    | hulpmiddelen/opdrachten/services, maar geen mogelijkheden                    |

Zie [Pluginvormen](/nl/plugins/architecture#plugin-shapes) voor meer informatie over het mogelijkhedenmodel.

<Note>
De vlag `--json` voert een machineleesbaar rapport uit dat geschikt is voor scripts en controles. `inspect --all` geeft een tabel voor de volledige omgeving weer met kolommen voor vorm, soorten mogelijkheden, compatibiliteitsmeldingen, bundelmogelijkheden en een samenvatting van hooks. `info` is een alias voor `inspect`.
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` meldt laadfouten van plugins, diagnostische gegevens over manifesten/detectie, compatibiliteitsmeldingen en verouderde verwijzingen in de pluginconfiguratie, zoals ontbrekende pluginvakken. Wanneer de installatieboom en pluginconfiguratie schoon zijn, wordt `No plugin issues detected.` weergegeven. Als er verouderde configuratie overblijft maar de installatieboom verder in orde is, vermeldt de samenvatting dit in plaats van te suggereren dat alle plugins volledig in orde zijn.

Als een geconfigureerde plugin op schijf aanwezig is maar wordt geblokkeerd door de padveiligheidscontroles van het laadprogramma, behoudt de configuratievalidatie de pluginvermelding en meldt deze als `present but blocked`. Verhelp de voorafgaande diagnose voor de geblokkeerde plugin, zoals padeigendom of voor iedereen schrijfbare machtigingen, in plaats van de configuratie van `plugins.entries.<id>` of `plugins.allow` te verwijderen.

Voer bij fouten in de modulevorm, zoals ontbrekende exports van `register`/`activate`, de opdracht opnieuw uit met `OPENCLAW_PLUGIN_LOAD_DEBUG=1` om een compacte samenvatting van de exportvorm in de diagnostische uitvoer op te nemen.

## Register

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Het lokale pluginregister is het permanente koude leesmodel van OpenClaw voor de identiteit, inschakeling, bronmetadata en bijdrage-eigendom van geïnstalleerde plugins. Normaal opstarten, het opzoeken van providereigenaars, classificatie van kanaalinstellingen en de plugininventaris kunnen dit lezen zonder pluginruntimemodules te importeren.

Gebruik `plugins registry` om te controleren of het permanente register aanwezig, actueel of verouderd is. Gebruik `--refresh` om het opnieuw op te bouwen vanuit de permanente pluginindex, het configuratiebeleid en manifest-/pakketmetadata. Dit is een herstelpad, geen pad voor runtimeactivering.

`openclaw doctor --fix` herstelt ook registergerelateerde afwijkingen in beheerde npm-installaties: als een verweesd of hersteld `@openclaw/*`-pakket onder een beheerd npm-project voor plugins of de verouderde platte beheerde npm-hoofdmap een meegeleverde plugin overschaduwt, verwijdert Doctor dat verouderde pakket en bouwt het register opnieuw op, zodat tijdens het opstarten aan de hand van het meegeleverde manifest wordt gevalideerd. Doctor koppelt ook het hostpakket `openclaw` opnieuw aan beheerde npm-plugins die `peerDependencies.openclaw` declareren, zodat pakketlokale runtime-imports zoals `openclaw/plugin-sdk/*` na updates of npm-reparaties kunnen worden opgelost.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` is een verouderde noodschakelaar voor compatibiliteit bij leesfouten van het register. Geef de voorkeur aan `plugins registry --refresh` of `openclaw doctor --fix`; de terugval via de omgevingsvariabele is alleen bedoeld voor noodherstel bij het opstarten terwijl de migratie wordt uitgerold.
</Warning>

## Marktplaats

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace entries --feed-profile <name>
openclaw plugins marketplace entries --feed-url <url>
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

`plugins marketplace entries` geeft vermeldingen uit de geconfigureerde OpenClaw-marketplacefeed weer. Standaard probeert de opdracht de gehoste feed te gebruiken en valt deze terug op de laatst geaccepteerde momentopname of gebundelde gegevens. Gebruik `--feed-profile <name>` om een specifiek geconfigureerd profiel te lezen, `--feed-url <url>` om een expliciete URL van een gehoste feed te lezen en `--offline` om de laatst geaccepteerde momentopname te lezen zonder de feed op te halen.

`plugins marketplace refresh` vernieuwt de geconfigureerde momentopname van de gehoste feed en meldt of OpenClaw gehoste gegevens, een gehoste momentopname of gebundelde terugvalgegevens heeft geaccepteerd. Gebruik `--expected-sha256` wanneer een aanroeper de opdracht moet laten mislukken tenzij een nieuwe gehoste payload overeenkomt met een vastgelegde controlesom.

Marketplace-`list` accepteert een lokaal marketplacepad, een pad naar `marketplace.json`, een GitHub-verkorte notatie zoals `owner/repo`, een URL van een GitHub-repository of een Git-URL. `--json` toont het label van de herleide bron, plus het geparseerde marketplace-manifest en de Plugin-vermeldingen.

Het vernieuwen van de marketplace laadt een gehoste OpenClaw-marketplacefeed en slaat het
gevalideerde antwoord op als de lokale momentopname van de gehoste feed. Zonder opties wordt
het geconfigureerde standaardfeedprofiel gebruikt. Gebruik `--feed-profile <name>` om een
specifiek geconfigureerd profiel te vernieuwen, `--feed-url <url>` om een expliciete URL
van een gehoste feed te vernieuwen, `--expected-sha256 <sha256>` om een overeenkomende
controlesom van de payload te vereisen (`sha256:<hex>` of een kale hexadecimale digest
van 64 tekens) en `--json` voor machineleesbare uitvoer. Expliciete URL's van gehoste
feeds mogen geen aanmeldgegevens, queryreeksen of fragmenten bevatten. Vernieuwingen
zonder vastgelegde controlesom kunnen een gehoste momentopname of een gebundeld
terugvalresultaat melden zonder dat de opdracht mislukt. Vastgelegde vernieuwingen
mislukken tenzij ze een nieuwe gehoste payload accepteren, en geslaagde gehoste
vernieuwingen mislukken als OpenClaw de gevalideerde momentopname niet kan opslaan.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [CLI-referentie](/nl/cli)
- [ClawHub](/clawhub)
