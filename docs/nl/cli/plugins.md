---
read_when:
    - Je wilt Gateway-plugins of compatibele bundels installeren of beheren
    - Je wilt een eenvoudige tool-Plugin opzetten of valideren
    - Je wilt fouten bij het laden van plugins opsporen
sidebarTitle: Plugins
summary: CLI-referentie voor `openclaw plugins` (initialiseren, bouwen, valideren, weergeven, installeren, marktplaats, verwijderen, inschakelen/uitschakelen, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-07-16T15:25:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dadc182cd931672d98c3d1c6ddc1f1defdf0384b25feff7bd4b5324a7fc2e26c
    source_path: cli/plugins.md
    workflow: 16
---

Beheer Gateway-plugins, hookpakketten en compatibele bundels.

<CardGroup cols={2}>
  <Card title="Pluginsysteem" href="/nl/tools/plugin">
    Handleiding voor eindgebruikers voor het installeren, inschakelen en oplossen van problemen met plugins.
  </Card>
  <Card title="Plugins beheren" href="/nl/plugins/manage-plugins">
    Korte voorbeelden voor installeren, weergeven, bijwerken, verwijderen en publiceren.
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
openclaw plugins info <id>                    # alias voor inspect
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

Voer voor onderzoek naar een trage installatie, inspectie, verwijdering of registervernieuwing de
opdracht uit met `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. De trace schrijft de tijdsduur van fasen
naar stderr en houdt JSON-uitvoer parseerbaar. Zie [Foutopsporing](/nl/help/debugging#plugin-lifecycle-trace).

<Note>
In Nix-modus (`OPENCLAW_NIX_MODE=1`) is `openclaw.json` onveranderlijk. `install`, `update`, `uninstall`, `enable` en `disable` weigeren allemaal te worden uitgevoerd. Bewerk in plaats daarvan de Nix-bron voor deze installatie (`programs.openclaw.config` of `instances.<name>.config` voor nix-openclaw) en bouw vervolgens opnieuw. Zie de agentgerichte [Snelstartgids](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Gebundelde plugins worden met OpenClaw geleverd. Sommige zijn standaard ingeschakeld (bijvoorbeeld gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browserplugin); andere vereisen `plugins enable`.

Native OpenClaw-plugins leveren `openclaw.plugin.json` met een inline JSON Schema (`configSchema`, zelfs als dit leeg is). Compatibele bundels gebruiken in plaats daarvan hun eigen bundelmanifesten.

`plugins list` toont `Format: openclaw` of `Format: bundle`. Uitgebreide lijst-/info-uitvoer toont ook het bundelsubtype (`codex`, `claude` of `cursor`) plus de gedetecteerde bundelmogelijkheden.
</Note>

## Ontwikkelen

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` maakt standaard een minimale TypeScript-toolplugin. Het eerste
argument is de plugin-id; `--name` stelt de weergavenaam in. OpenClaw gebruikt de
id voor de standaarduitvoermap en pakketnaamgeving. Toolscaffolds gebruiken
`defineToolPlugin` en genereren `package.json`-scripts `plugin:build` en
`plugin:validate`, die bouwen en vervolgens `openclaw plugins build`/`validate` aanroepen.

`plugins build` importeert het gebouwde toegangspunt, leest de statische toolmetadata, schrijft
`openclaw.plugin.json` en houdt `package.json`'s `openclaw.extensions` afgestemd.
`plugins validate` controleert of het gegenereerde manifest, de pakketmetadata en
de huidige export van het toegangspunt nog steeds overeenkomen. Zie [Toolplugins](/nl/plugins/tool-plugins) voor
de volledige ontwikkelworkflow.

De scaffold schrijft TypeScript-broncode, maar genereert metadata vanuit het gebouwde
`./dist/index.js`-toegangspunt, zodat de workflow ook met de gepubliceerde CLI werkt. Gebruik
`--entry <path>` wanneer het toegangspunt niet het standaardpakket-toegangspunt is. Gebruik
`plugins build --check` in CI om te mislukken wanneer gegenereerde metadata verouderd is, zonder
bestanden te herschrijven.

### Providerscaffold

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Providerscaffolds maken een generieke, met OpenAI compatibele modelproviderplugin
met API-sleutelauthenticatie, een `npm run validate`-script dat
`clawhub package validate` uitvoert, ClawHub-pakketmetadata en een handmatig
gestarte GitHub Actions-workflow voor toekomstige vertrouwde publicatie via GitHub
OIDC. Providerscaffolds genereren geen Skills en gebruiken
`openclaw plugins build`/`validate` niet; die opdrachten zijn bedoeld voor het pad met gegenereerde metadata
van de toolscaffold.

Vervang vóór publicatie de tijdelijke API-basis-URL, modelcatalogus, documentatieroute,
referentietekst en README-tekst door echte providergegevens. Gebruik de
gegenereerde README voor de eerste publicatie op ClawHub en de configuratie van een vertrouwde uitgever.

## Installeren

```bash
openclaw plugins search "calendar"                      # ClawHub-plugins zoeken
openclaw plugins install @openclaw/<package>            # vertrouwde officiële catalogus
openclaw plugins install <package>                       # willekeurig npm-pakket
openclaw plugins install clawhub:<package>                # alleen ClawHub
openclaw plugins install npm:<package>                    # alleen npm
openclaw plugins install npm-pack:<path.tgz>               # lokaal npm-pack-tarballbestand
openclaw plugins install git:github.com/<owner>/<repo>     # git-repository
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # lokaal pad of archief
openclaw plugins install -l <path>                         # koppelen in plaats van kopiëren
openclaw plugins install <plugin>@<marketplace>             # verkorte marketplace-notatie
openclaw plugins install <plugin> --marketplace <name>      # marketplace (expliciet)
openclaw plugins install <package> --force                  # bron bevestigen / bestaande installatie overschrijven
openclaw plugins install <package> --pin                    # opgeloste npm-versie vastzetten
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

Beheerders die installaties tijdens de configuratie testen, kunnen automatische bronnen voor plugininstallaties
overschrijven met beveiligde omgevingsvariabelen. Zie
[Overschrijvingen voor plugininstallaties](/nl/plugins/install-overrides).

<Warning>
Losse pakketnamen worden tijdens de overgang bij de lancering standaard vanuit npm geïnstalleerd, tenzij ze overeenkomen met de id van een gebundelde of officiële plugin. In dat geval gebruikt OpenClaw die lokale/officiële kopie in plaats van het npm-register te benaderen. Gebruik `npm:<package>` wanneer je bewust een extern npm-pakket wilt gebruiken. Gebruik `clawhub:<package>` voor ClawHub. Behandel plugininstallaties als het uitvoeren van code; geef de voorkeur aan vastgezette versies.
</Warning>

<Warning>
ClawHub-pakketten en de gebundelde/officiële catalogus van OpenClaw zijn vertrouwde installatiebronnen. Een nieuwe willekeurige npm-, `npm-pack:`-, git-, lokale pad-/archief- of
marketplace-bron geeft een waarschuwing en vraagt om bevestiging voordat wordt doorgegaan. Niet-interactieve willekeurige
installaties moeten `--force` doorgeven nadat je de bron hebt beoordeeld en vertrouwd. Dezelfde
vlag overschrijft indien nodig een bestaand installatiedoel. Normale updates van een
reeds bijgehouden installatie vereisen dit niet. Deze bevestiging staat los van
`--acknowledge-clawhub-risk`, dat alleen van toepassing is op risicowaarschuwingen over het vertrouwen in ClawHub-releases.
`--force` omzeilt `security.installPolicy` of de resterende
veiligheidscontroles voor installaties niet.
</Warning>

`plugins search` bevraagt ClawHub naar installeerbare `code-plugin`- en
`bundle-plugin`-pakketten (geen Skills; gebruik daarvoor `openclaw skills search`).
De standaardwaarde voor `--limit` is 20, met een maximum van 100. Het leest alleen de externe catalogus: geen
inspectie van lokale status, wijziging van configuratie, pakketinstallatie of laden van de pluginruntime.
Resultaten bevatten de ClawHub-pakketnaam, familie, kanaal, versie,
samenvatting en een installatietip zoals `openclaw plugins install clawhub:<package>`.

<Note>
ClawHub is voor de meeste plugins het primaire distributie- en ontdekkingsplatform. Npm
blijft een ondersteund alternatief en pad voor directe installatie. OpenClaw-eigen
`@openclaw/*`-pluginpakketten worden opnieuw op npm gepubliceerd; zie de huidige lijst
op [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) of de
[plugininventaris](/nl/plugins/plugin-inventory). Stabiele installaties gebruiken `latest`.
Installaties en updates via het bètakanaal geven waar beschikbaar de voorkeur aan de npm-dist-tag `beta`,
met `latest` als alternatief. Op het extended-stable-kanaal worden officiële npm-plugins
met een losse/standaard- of `latest`-intentie opgelost naar exact de geïnstalleerde kernversie.
Exacte vastzettingen en expliciete niet-`latest`-tags, pakketten van derden en
niet-npm-bronnen worden niet herschreven.
</Note>

<AccordionGroup>
  <Accordion title="Configuratie-insluitingen en herstel van ongeldige configuratie">
    Als je `plugins`-sectie wordt ondersteund door een enkelvoudige `$include`, schrijft `plugins install/update/enable/disable/uninstall` door naar dat ingesloten bestand en laat het `openclaw.json` ongewijzigd. Hoofdinsluitingen, insluitingsarrays en insluitingen met naastliggende overschrijvingen mislukken gesloten in plaats van te worden afgevlakt. Zie [Configuratie-insluitingen](/nl/gateway/configuration) voor de ondersteunde vormen.

    Als de configuratie tijdens de installatie ongeldig is, mislukt `plugins install` normaal gesproken gesloten en wordt aangegeven dat je eerst `openclaw doctor --fix` moet uitvoeren. Tijdens het starten en direct herladen van de Gateway mislukt ongeldige pluginconfiguratie gesloten, net als elke andere ongeldige configuratie; `openclaw doctor --fix` kan de ongeldige pluginvermelding in quarantaine plaatsen. De enige gedocumenteerde uitzondering tijdens de installatie is een beperkt herstelpad voor gebundelde plugins die expliciet kiezen voor `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force-bevestiging en herinstallatie versus update">
    `--force` bevestigt zonder prompt een bron die niet van ClawHub afkomstig is. Het omzeilt `security.installPolicy` of de resterende veiligheidscontroles voor installaties niet. Wanneer de plugin of het hookpakket al is geïnstalleerd, wordt ook het bestaande doel hergebruikt en ter plaatse overschreven. Gebruik dit nadat je een willekeurige npm-, lokale, archief-, git- of marketplace-bron hebt beoordeeld, of wanneer je bewust dezelfde id opnieuw installeert. Geef voor routinematige upgrades van een reeds bijgehouden npm-plugin de voorkeur aan `openclaw plugins update <id-or-npm-spec>`.

    Als je `plugins install` uitvoert voor een plugin-id die al is geïnstalleerd, stopt OpenClaw en verwijst het je naar `plugins update <id-or-npm-spec>` voor een normale upgrade, of naar `plugins install <package> --force` wanneer je de huidige installatie daadwerkelijk vanuit een andere bron wilt overschrijven. Willekeurige bronnen tonen nog steeds de interactieve herkomstwaarschuwing; niet-interactieve installaties moeten na beoordeling `--force` doorgeven. Vertrouwde bronnen van ClawHub en de OpenClaw-catalogus hebben dit niet nodig. Met `--link` bevestigt `--force` de bron, maar wijzigt het de installatiemodus met gekoppeld pad niet.

  </Accordion>
  <Accordion title="Bereik van --pin">
    `--pin` is alleen van toepassing op npm-installaties en registreert de exact opgeloste `<name>@<version>`. Dit wordt niet ondersteund met `git:`-installaties (zet in plaats daarvan de referentie vast in de specificatie, bijvoorbeeld `git:github.com/acme/plugin@v1.2.3`) of met `--marketplace` (marketplace-installaties slaan marketplace-bronmetadata op in plaats van een npm-specificatie).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` is verouderd en doet nu niets. OpenClaw voert niet langer ingebouwde blokkering van gevaarlijke code tijdens de installatie uit voor plugininstallaties.

    Gebruik het door de operator beheerde `security.installPolicy`-oppervlak wanneer hostspecifiek installatiebeleid vereist is. Plugin-`before_install`-hooks zijn levenscyclushooks van de pluginruntime, niet de primaire beleidsgrens voor CLI-installaties.

    Als een Plugin die je op ClawHub hebt gepubliceerd door een registerscan verborgen of geblokkeerd is, gebruik je de stappen voor uitgevers in [Publiceren op ClawHub](/nl/clawhub/publishing). `--dangerously-force-unsafe-install` vraagt ClawHub niet om de Plugin opnieuw te scannen of een geblokkeerde release openbaar te maken.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Installaties uit de ClawHub-community controleren vóór het downloaden het vertrouwensrecord van de geselecteerde release. Als ClawHub het downloaden voor de release uitschakelt, schadelijke scanbevindingen meldt of de release in een blokkerende moderatiestatus plaatst (in quarantaine geplaatst, ingetrokken), weigert OpenClaw deze zonder uitzondering, ongeacht deze vlag. Bij niet-blokkerende risicovolle scanstatussen of moderatiestatussen toont OpenClaw de vertrouwensdetails en vraagt het om bevestiging voordat het doorgaat.

    Gebruik `--acknowledge-clawhub-risk` alleen nadat je de ClawHub-waarschuwing hebt bekeken en hebt besloten zonder interactieve prompt door te gaan. Scanresultaten die in behandeling of verouderd (nog niet schoon) zijn, geven een waarschuwing maar vereisen geen bevestiging. Officiële ClawHub-pakketten en meegeleverde OpenClaw-Pluginbronnen slaan deze controle van het releasevertrouwen volledig over.

  </Accordion>
  <Accordion title="Hookpakketten en npm-specificaties">
    `plugins install` is ook het installatieoppervlak voor hookpakketten die `openclaw.hooks` beschikbaar stellen in `package.json`. Gebruik `openclaw hooks` voor gefilterde zichtbaarheid van hooks en inschakeling per hook, niet voor pakketinstallatie.

    Npm-specificaties zijn **alleen voor het register** (pakketnaam plus optioneel een **exacte versie** of **dist-tag**). Git-/URL-/bestandsspecificaties en semver-bereiken worden geweigerd. Afhankelijkheden worden voor de veiligheid geïnstalleerd in één beheerd npm-project per Plugin met `--ignore-scripts`, zelfs wanneer je shell globale npm-installatie-instellingen heeft. Beheerde npm-projecten van Plugins nemen de npm-`overrides` op pakketniveau van OpenClaw over, zodat beveiligingsvastzettingen van de host ook gelden voor opgetilde Plugin-afhankelijkheden.

    Gebruik `npm:<package>` om npm-resolutie expliciet te maken. Kale pakketspecificaties worden tijdens de omschakeling bij de lancering ook rechtstreeks vanaf npm geïnstalleerd, tenzij ze overeenkomen met een officiële Plugin-id.

    Onbewerkte `@openclaw/*`-specificaties die overeenkomen met meegeleverde Plugins, worden vóór de terugval naar npm omgezet naar de meegeleverde kopie die bij de image hoort. `openclaw plugins install @openclaw/discord@2026.5.20 --pin` gebruikt bijvoorbeeld de meegeleverde Discord-Plugin uit de huidige OpenClaw-build in plaats van een beheerde npm-overschrijving te maken. Gebruik `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` om het externe npm-pakket af te dwingen.

    Kale specificaties en `@latest` blijven op het stabiele kanaal. OpenClaw-correctieversies met datumstempel, zoals `2026.5.3-1`, gelden voor deze controle als stabiel. Als npm een van beide vormen omzet naar een prerelease, stopt OpenClaw en vraagt het je expliciet toestemming te geven met een prerelease-tag (`@beta`/`@rc`) of een exacte prereleaseversie (`@1.2.3-beta.4`).

    Voor npm-installaties zonder exacte versie (`npm:<package>` of `npm:<package>@latest`) controleert OpenClaw vóór de installatie de metadata van het omgezette pakket. Als het nieuwste stabiele pakket een nieuwere OpenClaw-Plugin-API of minimale hostversie vereist, onderzoekt OpenClaw oudere stabiele versies en installeert het in plaats daarvan de nieuwste compatibele release. Exacte versies en expliciete dist-tags blijven strikt: een incompatibele selectie mislukt en vraagt je OpenClaw te upgraden of een compatibele versie te kiezen.

    Als een kale installatiespecificatie overeenkomt met een officiële Plugin-id (bijvoorbeeld `diffs`), installeert OpenClaw de catalogusvermelding rechtstreeks. Gebruik een expliciete scoped specificatie (bijvoorbeeld `@scope/diffs`) om een npm-pakket met dezelfde naam te installeren.

  </Accordion>
  <Accordion title="Git-repository's">
    Gebruik `git:<repo>` om rechtstreeks vanuit een Git-repository te installeren. Ondersteunde vormen: `git:github.com/owner/repo`, `git:owner/repo`, volledige `https://`-, `ssh://`-, `git://`-, `file://`- en `git@host:owner/repo.git`-kloon-URL's. Voeg `@<ref>` of `#<ref>` toe om vóór de installatie een branch, tag of commit uit te checken.

    Git-installaties klonen naar een tijdelijke map, checken de aangevraagde ref uit als die aanwezig is en gebruiken vervolgens het normale installatieprogramma voor Pluginmappen. Daardoor gedragen manifestvalidatie, installatiebeleid van de operator, installatiewerk van de pakketbeheerder en installatierecords zich hetzelfde als bij npm-installaties. Vastgelegde Git-installaties bevatten de bron-URL/ref plus de omgezette commit, zodat `openclaw plugins update` de bron later opnieuw kan omzetten.

    Gebruik na installatie vanuit Git `openclaw plugins inspect <id> --runtime --json` om runtimeregistraties zoals Gateway-methoden en CLI-opdrachten te verifiëren. Als de Plugin een CLI-hoofdopdracht heeft geregistreerd met `api.registerCli`, voer je die opdracht rechtstreeks uit via de hoofd-CLI van OpenClaw, bijvoorbeeld `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archieven">
    Ondersteunde archieven: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Systeemeigen OpenClaw-Pluginarchieven moeten een geldige `openclaw.plugin.json` bevatten in de hoofdmap van de uitgepakte Plugin; archieven die alleen `package.json` bevatten, worden geweigerd voordat OpenClaw installatierecords schrijft.

    Gebruik `npm-pack:<path.tgz>` wanneer het bestand een npm-pack-tarball is en je
    hetzelfde pad naar een beheerd npm-project per Plugin wilt gebruiken als bij registerinstallaties,
    inclusief verificatie van `package-lock.json`, scannen van opgetilde afhankelijkheden
    en npm-installatierecords. Gewone archiefpaden worden nog steeds als lokale
    archieven onder de hoofdmap voor Pluginextensies geïnstalleerd.

    Installaties uit de Claude-marketplace worden ook ondersteund.

  </Accordion>
</AccordionGroup>

ClawHub-installaties gebruiken een expliciete `clawhub:<package>`-locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Kale npm-veilige Pluginspecificaties worden tijdens de omschakeling bij de lancering standaard vanaf npm geïnstalleerd, tenzij ze overeenkomen met een officiële Plugin-id:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gebruik `npm:` om resolutie uitsluitend via npm expliciet te maken:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controleert vóór installatie de bekendgemaakte compatibiliteit met de Plugin-API/minimale Gateway-versie. Wanneer de geselecteerde ClawHub-versie een ClawPack-artefact publiceert, downloadt OpenClaw de geversioneerde npm-pack-`.tgz`, verifieert het de ClawHub-digestheader en de digest van het artefact en installeert het dit vervolgens via het normale archiefpad. Oudere ClawHub-versies zonder ClawPack-metadata worden nog steeds geïnstalleerd via het verouderde verificatiepad voor pakketarchieven. Vastgelegde installaties behouden hun ClawHub-bronmetadata, artefacttype, npm-integriteit, npm-shasum, tarballnaam en ClawPack-digestgegevens voor latere updates.
ClawHub-installaties zonder versie behouden een vastgelegde specificatie zonder versie, zodat `openclaw plugins update` nieuwere ClawHub-releases kan volgen; expliciete versie- of tagselectors zoals `clawhub:pkg@1.2.3` en `clawhub:pkg@beta` blijven aan die selector vastgezet.

### Verkorte notatie voor marketplaces

Gebruik de verkorte `plugin@marketplace`-notatie wanneer de marketplacenaam bestaat in de lokale registercache van Claude op `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Gebruik `--marketplace` om de marketplacebron expliciet door te geven:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplacebronnen">
    - een bekende Claude-marketplacenaam uit `~/.claude/plugins/known_marketplaces.json`
    - een lokale hoofdmap van een marketplace of een `marketplace.json`-pad
    - een verkorte notatie voor een GitHub-repository, zoals `owner/repo`
    - een URL van een GitHub-repository, zoals `https://github.com/owner/repo`
    - een Git-URL

  </Tab>
  <Tab title="Regels voor externe marketplaces">
    Voor externe marketplaces die vanuit GitHub of Git worden geladen, moeten Pluginvermeldingen binnen de gekloonde marketplace-repository blijven. OpenClaw accepteert relatieve padbronnen uit die repository en weigert HTTP(S)-, absolute-pad-, Git-, GitHub- en andere niet-padgebonden Pluginbronnen uit externe manifesten.
  </Tab>
</Tabs>

Voor lokale paden en archieven detecteert OpenClaw automatisch:

- systeemeigen OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-compatibele bundels (`.codex-plugin/plugin.json`)
- Claude-compatibele bundels (`.claude-plugin/plugin.json`, of de standaardindeling van Claude-componenten wanneer dat manifestbestand ontbreekt)
- Cursor-compatibele bundels (`.cursor-plugin/plugin.json`)

Beheerde lokale installaties moeten Pluginmappen of archieven zijn. Zelfstandige `.js`-,
`.mjs`-, `.cjs`- en `.ts`-Pluginbestanden worden door
`plugins install` niet naar de hoofdmap van beheerde Plugins gekopieerd en ook niet geladen door ze
rechtstreeks in `~/.openclaw/extensions` of `<workspace>/.openclaw/extensions` te plaatsen; deze
automatisch gedetecteerde hoofdmappen laden pakket- of bundelmappen van Plugins en slaan
scripts op het hoogste niveau over als lokale helpers. Vermeld zelfstandige bestanden in plaats daarvan expliciet in
`plugins.load.paths`.

<Note>
Compatibele bundels worden in de normale Pluginhoofdmap geïnstalleerd en nemen deel aan dezelfde stroom voor weergeven/informatie/inschakelen/uitschakelen. Momenteel worden bundel-Skills, Claude-opdracht-Skills, Claude-standaardwaarden voor `settings.json`, Claude-standaardwaarden voor `.lsp.json` / in het manifest gedeclareerde standaardwaarden voor `lspServers`, Cursor-opdracht-Skills en compatibele Codex-hookmappen ondersteund; andere gedetecteerde bundelmogelijkheden worden weergegeven in diagnostiek/informatie, maar zijn nog niet gekoppeld aan runtime-uitvoering.
</Note>

Gebruik `-l`/`--link` om zonder kopiëren naar een lokale Pluginmap te verwijzen (wordt
toegevoegd aan `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--link` wordt niet ondersteund bij installaties met `--marketplace` of `git:` en
vereist een lokaal pad dat al bestaat. Geef voor een niet-interactieve lokale koppeling
`--force` door nadat je de bron hebt beoordeeld; dit bevestigt de herkomst, maar
kopieert of overschrijft de gekoppelde map niet.

<Note>
Plugins die hun oorsprong in een werkruimte hebben en vanuit een extensiehoofdmap van een werkruimte worden ontdekt, worden pas
geïmporteerd of uitgevoerd nadat ze expliciet zijn ingeschakeld. Voer voor lokale ontwikkeling
`openclaw plugins enable <plugin-id>` uit of stel
`plugins.entries.<plugin-id>.enabled: true` in; als je configuratie
`plugins.allow` gebruikt, neem je daar ook dezelfde Plugin-id in op. Deze regel voor veilig weigeren
geldt ook wanneer kanaalconfiguratie expliciet op een uit de werkruimte afkomstige Plugin is gericht voor
laden uitsluitend tijdens de configuratie, zodat lokale configuratiecode van de kanaal-Plugin niet wordt uitgevoerd zolang die
werkruimte-Plugin uitgeschakeld blijft of van de toelatingslijst is uitgesloten. Gekoppelde installaties
en expliciete `plugins.load.paths`-vermeldingen volgen het normale beleid voor hun
omgezette Pluginoorsprong. Zie
[Pluginbeleid configureren](/nl/tools/plugin#configure-plugin-policy)
en [Configuratiereferentie](/nl/gateway/configuration-reference#plugins).

Gebruik `--pin` bij npm-installaties om de omgezette exacte specificatie (`name@version`) in de beheerde Pluginindex op te slaan, terwijl het standaardgedrag niet-vastgezet blijft.
</Note>

## Weergeven

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Toon alleen ingeschakelde Plugins.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Schakel van de tabelweergave over naar detailregels per Plugin met metadata over indeling/bron/oorsprong/versie/activering.
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare inventaris plus registerdiagnostiek en de installatiestatus van pakketafhankelijkheden.
</ParamField>

<Note>
`plugins list` leest eerst het persistente lokale pluginregister, met een uitsluitend van het manifest afgeleide fallback wanneer het register ontbreekt of ongeldig is. Dit is nuttig om te controleren of een plugin is geïnstalleerd, ingeschakeld en zichtbaar voor de planning van een koude start, maar het is geen live runtimecontrole van een Gateway-proces dat al actief is. Nadat je plugincode, inschakeling, hookbeleid of `plugins.load.paths` hebt gewijzigd, moet je de Gateway die het kanaal bedient opnieuw starten voordat je verwacht dat nieuwe `register(api)`-code of hooks worden uitgevoerd. Controleer bij externe/containerimplementaties of je het daadwerkelijke onderliggende `openclaw gateway run`-proces opnieuw start, en niet alleen een wrapperproces.

`plugins list --json` bevat voor elke plugin de `dependencyStatus` uit `package.json`
`dependencies` en `optionalDependencies`. OpenClaw controleert of die pakketnamen
aanwezig zijn langs het normale Node-zoekpad `node_modules` van de plugin; het
importeert geen runtimecode van plugins, voert geen pakketbeheerder uit en herstelt
geen ontbrekende afhankelijkheden.
</Note>

Als bij het opstarten `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` wordt gelogd,
voer je `openclaw plugins list --enabled --verbose` of
`openclaw plugins inspect <id>` uit met een vermelde plugin-id om de plugin-
id's te bevestigen en vertrouwde id's te kopiëren naar `plugins.allow` in `openclaw.json`. Wanneer de
waarschuwing elke ontdekte plugin kan vermelden, wordt een direct te plakken
`plugins.allow`-fragment weergegeven waarin die id's al zijn opgenomen. Als een plugin wordt geladen
zonder herkomstgegevens voor installatie of laadpad, inspecteer je die plugin-id en zet je vervolgens
de vertrouwde id vast in `plugins.allow`, of installeer je de plugin opnieuw vanuit een vertrouwde bron
zodat OpenClaw de installatieherkomst vastlegt.

Voor werk aan gebundelde plugins in een verpakte Docker-image koppel je de
bronmap van de plugin als bind-mount over het overeenkomende verpakte bronpad, zoals
`/app/extensions/synology-chat`. OpenClaw detecteert die gekoppelde bronoverlay
vóór `/app/dist/extensions/synology-chat`; een gewoon gekopieerde bronmap
blijft inactief, zodat normale verpakte installaties nog steeds de gecompileerde dist gebruiken.

Voor foutopsporing van runtimehooks:

- `openclaw plugins inspect <id> --runtime --json` toont geregistreerde hooks en diagnostische gegevens uit een inspectiepassage waarbij de module wordt geladen. Runtime-inspectie installeert nooit afhankelijkheden; gebruik `openclaw doctor --fix` om verouderde afhankelijkheidsstatus op te schonen of ontbrekende downloadbare plugins te herstellen waarnaar vanuit de configuratie wordt verwezen.
- `openclaw gateway status --deep --require-rpc` bevestigt de bereikbare Gateway-URL en het profiel, aanwijzingen over services/processen, het configuratiepad en de RPC-status.
- Niet-gebundelde gesprekshooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) vereisen `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Pluginindex

Installatiemetadata van plugins is door de machine beheerde status, geen gebruikersconfiguratie. Installaties en updates schrijven deze naar de gedeelde SQLite-statusdatabase onder de actieve OpenClaw-statusmap. De rij `installed_plugin_index` bevat duurzame `installRecords`-metadata, waaronder records voor defecte of ontbrekende pluginmanifesten, plus een van het manifest afgeleide cache voor het koude register die wordt gebruikt door `openclaw plugins update`, verwijdering, diagnostiek en het koude pluginregister.

Wanneer OpenClaw meegeleverde verouderde `plugins.installs`-records in de configuratie aantreft, behandelt de runtime deze bij het lezen als compatibiliteitsinvoer zonder `openclaw.json` te herschrijven. Expliciete schrijfbewerkingen voor plugins en `openclaw doctor --fix` verplaatsen die records naar de pluginindex en verwijderen de configuratiesleutel wanneer schrijven naar de configuratie is toegestaan; als een van beide schrijfbewerkingen mislukt, blijven de configuratierecords behouden zodat de installatiemetadata niet verloren gaat.

## Verwijderen

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` verwijdert pluginrecords uit `plugins.entries`, de persistente pluginindex, vermeldingen in de lijsten met toegestane/geweigerde plugins en, indien van toepassing, gekoppelde `plugins.load.paths`-vermeldingen. Tenzij `--keep-files` is ingesteld, verwijdert de deïnstallatie ook de bijgehouden beheerde installatiemap, maar alleen wanneer deze zich binnen de hoofdmap voor pluginextensies van OpenClaw bevindt. Als de plugin momenteel eigenaar is van het `memory`- of `contextEngine`-slot, wordt dat slot teruggezet naar de standaardwaarde (`memory-core` voor geheugen, `legacy` voor de contextengine).

`uninstall` toont een voorbeeld van wat wordt verwijderd en vraagt vervolgens `Uninstall plugin "<id>"?` voordat wijzigingen worden aangebracht. Geef `--force` door om de bevestigingsvraag over te slaan (nuttig voor scripts en niet-interactieve uitvoeringen); zonder deze optie vereist de deïnstallatie een interactieve TTY. `--dry-run` toont hetzelfde voorbeeld en sluit af zonder een vraag te stellen of iets te wijzigen.

<Note>
`--keep-config` wordt ondersteund als verouderde alias voor `--keep-files`.
</Note>

## Bijwerken

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update @acme/demo
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Updates zijn van toepassing op bijgehouden plugininstallaties in de beheerde pluginindex en bijgehouden hookpack-installaties in `hooks.internal.installs`. Ze hergebruiken de bron die de gebruiker al heeft gekozen bij het installeren van de plugin, zodat geen tweede bronbevestiging nodig is.

<AccordionGroup>
  <Accordion title="Plugin-id versus npm-specificatie bepalen">
    Wanneer je een plugin-id doorgeeft, hergebruikt OpenClaw de vastgelegde installatiespecificatie voor die plugin. Dit betekent dat eerder opgeslagen dist-tags zoals `@beta` en exact vastgezette versies bij latere `update <id>`-uitvoeringen gebruikt blijven worden.

    Tijdens `update <id> --dry-run` blijven exact vastgezette npm-installaties vastgezet. Als OpenClaw ook de standaardreeks van het pakketregister kan bepalen en die standaardreeks nieuwer is dan de geïnstalleerde vastgezette versie, meldt de proefuitvoering de vastzetting en toont deze de expliciete `@latest`-opdracht voor het bijwerken van het pakket om de standaardreeks van het register te volgen.

    Die regel voor gerichte updates verschilt van het pad voor bulksgewijs onderhoud via `openclaw plugins update --all`. Bulksgewijze updates respecteren nog steeds normale bijgehouden installatiespecificaties, maar records van vertrouwde officiële OpenClaw-plugins kunnen worden gesynchroniseerd met het huidige officiële catalogusdoel in plaats van op een verouderd exact officieel pakket te blijven. Gebruik een gerichte `update <id>` wanneer je bewust wilt dat een exacte of getagde officiële specificatie ongewijzigd blijft.

    Voor npm-installaties kun je ook een expliciete npm-pakketspecificatie met een dist-tag of exacte versie doorgeven. OpenClaw koppelt die pakketnaam terug aan het bijgehouden pluginrecord, werkt die geïnstalleerde plugin bij en legt de nieuwe npm-specificatie vast voor toekomstige updates op basis van de id.

    Als je de npm-pakketnaam zonder versie of tag doorgeeft, wordt deze eveneens teruggekoppeld aan het bijgehouden pluginrecord. Gebruik dit wanneer een plugin op een exacte versie was vastgezet en je deze terug wilt verplaatsen naar de standaardreleasereeks van het register.

  </Accordion>
  <Accordion title="Updates voor het bètakanaal">
    Een gerichte `openclaw plugins update <id-or-npm-spec>` hergebruikt de bijgehouden pluginspecificatie, tenzij je een nieuwe specificatie doorgeeft. Een bulksgewijze `openclaw plugins update --all` gebruikt de geconfigureerde `update.channel` wanneer vertrouwde officiële pluginrecords met het officiële catalogusdoel worden gesynchroniseerd, zodat installaties via het bètakanaal op de bètareleasereeks kunnen blijven in plaats van stilzwijgend naar stable/latest te worden genormaliseerd.

    `openclaw update` kent ook het actieve OpenClaw-updatekanaal: op het bètakanaal proberen npm- en ClawHub-pluginrecords voor de standaardreeks eerst `@beta`. Ze vallen terug op de vastgelegde specificatie voor default/latest als er geen bètarelease van de plugin bestaat; npm-plugins vallen ook terug wanneer het bètapakket bestaat maar niet door de installatievalidatie komt. Die fallback wordt als waarschuwing gemeld en laat de kernupdate niet mislukken. Exacte versies en expliciete tags blijven voor gerichte updates op die selector vastgezet.

  </Accordion>
  <Accordion title="Versiecontroles en integriteitsafwijkingen">
    Vóór een live npm-update controleert OpenClaw de geïnstalleerde pakketversie aan de hand van de metadata in het npm-register. Als de geïnstalleerde versie en de vastgelegde artefactidentiteit al overeenkomen met het bepaalde doel, wordt de update overgeslagen zonder `openclaw.json` te downloaden, opnieuw te installeren of te herschrijven.

    Wanneer een opgeslagen integriteitshash bestaat en de hash van het opgehaalde artefact verandert, behandelt OpenClaw dit als een afwijking van het npm-artefact. De interactieve opdracht `openclaw plugins update` toont de verwachte en werkelijke hashes en vraagt om bevestiging voordat wordt doorgegaan. Niet-interactieve updatehelpers stoppen veilig, tenzij de aanroeper een expliciet beleid voor doorgaan opgeeft.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install bij bijwerken">
    `--dangerously-force-unsafe-install` wordt voor compatibiliteit ook geaccepteerd bij `plugins update`, maar is verouderd en verandert het updategedrag van plugins niet meer. `security.installPolicy` van de beheerder kan updates nog steeds blokkeren; `before_install`-hooks van plugins zijn alleen van toepassing in processen waarin pluginhooks zijn geladen.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk bij bijwerken">
    Updates van door de community beheerde plugins uit ClawHub voeren vóór het downloaden van het vervangende pakket dezelfde vertrouwenscontrole voor de exacte release uit als installaties. Gebruik `--acknowledge-clawhub-risk` voor gecontroleerde automatisering die moet doorgaan wanneer de geselecteerde ClawHub-release een risicovolle vertrouwenswaarschuwing heeft. Officiële ClawHub-pakketten en gebundelde OpenClaw-pluginbronnen slaan deze vraag over releasevertrouwen over.
  </Accordion>
</AccordionGroup>

## Inspecteren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

Inspectie toont identiteit, laadstatus, bron, manifestmogelijkheden, beleidsvlaggen, diagnostiek, installatiemetadata, bundelmogelijkheden en alle gedetecteerde ondersteuning voor MCP- of LSP-servers, zonder standaard de runtime van de plugin te importeren. JSON-uitvoer bevat de contracten van het pluginmanifest, zoals `contracts.agentToolResultMiddleware` en `contracts.trustedToolPolicies`, zodat beheerders verklaringen over vertrouwde oppervlakken kunnen controleren voordat ze een plugin inschakelen of opnieuw starten. Voeg `--runtime` toe om de pluginmodule te laden en geregistreerde hooks, tools, opdrachten, services, gatewaymethoden en HTTP-routes op te nemen. Runtime-inspectie meldt ontbrekende pluginafhankelijkheden rechtstreeks; installaties en reparaties blijven in `openclaw plugins install`, `openclaw plugins update` en `openclaw doctor --fix`.

CLI-opdrachten die eigendom zijn van plugins worden doorgaans geïnstalleerd als hoofdopdrachtgroepen van `openclaw`, maar plugins kunnen ook geneste opdrachten registreren onder een kernbovenliggende opdracht zoals `openclaw nodes`. Nadat `inspect --runtime` een opdracht onder `cliCommands` toont, voer je deze uit op het vermelde pad; een plugin die bijvoorbeeld `demo-git` registreert, kan worden geverifieerd met `openclaw demo-git ping`.

Elke plugin wordt geclassificeerd op basis van wat deze daadwerkelijk tijdens runtime registreert:

| Vorm                | Betekenis                                                         |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | precies één type mogelijkheid (bijv. een plugin met alleen een provider) |
| `hybrid-capability` | meer dan één type mogelijkheid (bijv. tekst + spraak + afbeeldingen) |
| `hook-only`         | alleen hooks, geen mogelijkheden, tools, opdrachten, services of routes |
| `non-capability`    | tools/opdrachten/services, maar geen mogelijkheden                 |

Zie [Pluginvormen](/nl/plugins/architecture#plugin-shapes) voor meer informatie over het mogelijkhedenmodel.

<Note>
De vlag `--json` voert een machineleesbaar rapport uit dat geschikt is voor scripts en controles. `inspect --all` geeft een tabel voor de gehele vloot weer met kolommen voor vorm, soorten mogelijkheden, compatibiliteitsmeldingen, bundelmogelijkheden en een samenvatting van hooks. `info` is een alias voor `inspect`.
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` rapporteert fouten bij het laden van plugins, diagnostiek voor manifesten/detectie, compatibiliteitsmeldingen en verouderde verwijzingen naar pluginconfiguratie, zoals ontbrekende pluginslots. Wanneer de installatieboom en pluginconfiguratie schoon zijn, wordt `No plugin issues detected.` weergegeven. Als er verouderde configuratie overblijft maar de installatieboom verder in orde is, vermeldt de samenvatting dit in plaats van te suggereren dat alle plugins volledig in orde zijn.

Als een geconfigureerde plugin op schijf aanwezig is maar door de padveiligheidscontroles van de lader wordt geblokkeerd, behoudt de configuratievalidatie de pluginvermelding en rapporteert deze als `present but blocked`. Los de voorafgaande diagnostische melding over de geblokkeerde plugin op, bijvoorbeeld het padeigenaarschap of voor iedereen beschrijfbare machtigingen, in plaats van de configuratie `plugins.entries.<id>` of `plugins.allow` te verwijderen.

Voer bij fouten in de modulestructuur, zoals ontbrekende exports van `register`/`activate`, de opdracht opnieuw uit met `OPENCLAW_PLUGIN_LOAD_DEBUG=1` om een compacte samenvatting van de exportstructuur in de diagnostische uitvoer op te nemen.

## Register

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Het lokale pluginregister is OpenClaws persistente koude leesmodel voor de identiteit, inschakeling, bronmetadata en het eigenaarschap van bijdragen van geïnstalleerde plugins. Normaal opstarten, het opzoeken van providereigenaars, de classificatie van kanaalconfiguratie en de plugininventaris kunnen dit lezen zonder runtime-modules van plugins te importeren.

Gebruik `plugins registry` om te controleren of het persistente register aanwezig, actueel of verouderd is. Gebruik `--refresh` om het opnieuw op te bouwen aan de hand van de persistente pluginindex, het configuratiebeleid en manifest-/pakketmetadata. Dit is een herstelpad, geen pad voor runtime-activering.

`openclaw doctor --fix` herstelt ook afwijkingen in beheerde npm-installaties rond het register: als een verweesd of hersteld `@openclaw/*`-pakket onder een beheerd npm-project voor plugins of de verouderde platte beheerde npm-hoofdmap een gebundelde plugin overschaduwt, verwijdert doctor dat verouderde pakket en bouwt het register opnieuw op, zodat bij het opstarten tegen het gebundelde manifest wordt gevalideerd. Doctor koppelt ook het `openclaw`-pakket van de host opnieuw aan beheerde npm-plugins die `peerDependencies.openclaw` declareren, zodat pakketlokale runtime-imports zoals `openclaw/plugin-sdk/*` na updates of npm-herstel weer kunnen worden gevonden.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` is een verouderde compatibiliteitsschakelaar voor noodgevallen bij leesfouten van het register. Geef de voorkeur aan `plugins registry --refresh` of `openclaw doctor --fix`; de fallback via de omgevingsvariabele is uitsluitend bedoeld voor noodherstel bij het opstarten terwijl de migratie wordt uitgerold.
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

`plugins marketplace entries` vermeldt items uit de geconfigureerde OpenClaw-marktplaatsfeed. Standaard probeert deze de gehoste feed te gebruiken en valt deze terug op de laatst geaccepteerde momentopname of gebundelde gegevens. Gebruik `--feed-profile <name>` om een specifiek geconfigureerd profiel te lezen, `--feed-url <url>` om een expliciete URL van een gehoste feed te lezen en `--offline` om de laatst geaccepteerde momentopname te lezen zonder de feed op te halen.

`plugins marketplace refresh` vernieuwt de geconfigureerde momentopname van de gehoste feed en rapporteert of OpenClaw gehoste gegevens, een gehoste momentopname of gebundelde fallbackgegevens heeft geaccepteerd. Gebruik `--expected-sha256` wanneer een aanroeper wil dat de opdracht mislukt tenzij een verse gehoste payload overeenkomt met een vastgelegde controlesom.

`list` van de marktplaats accepteert een lokaal marktplaatspad, een `marketplace.json`-pad, een GitHub-verkorte notatie zoals `owner/repo`, een GitHub-repository-URL of een git-URL. `--json` geeft het label van de opgeloste bron weer, plus het geparseerde marktplaatsmanifest en de pluginvermeldingen.

Het vernieuwen van de marktplaats laadt een gehoste OpenClaw-marktplaatsfeed en slaat het
gevalideerde antwoord persistent op als de lokale momentopname van de gehoste feed. Zonder opties wordt
het geconfigureerde standaardfeedprofiel gebruikt. Gebruik `--feed-profile <name>` om een
specifiek geconfigureerd profiel te vernieuwen, `--feed-url <url>` om een expliciete URL van een gehoste
feed te vernieuwen, `--expected-sha256 <sha256>` om een overeenkomende controlesom van de payload te vereisen
(`sha256:<hex>` of een kale hexadecimale digest van 64 tekens) en `--json` voor
machineleesbare uitvoer. Expliciete URL's van gehoste feeds mogen geen
referenties, queryreeksen of fragmenten bevatten. Niet-vastgelegde vernieuwingen kunnen een
gehoste momentopname of een gebundeld fallbackresultaat rapporteren zonder dat de opdracht mislukt. Vastgelegde
vernieuwingen mislukken tenzij ze een verse gehoste payload accepteren, en geslaagde gehoste
vernieuwingen mislukken als OpenClaw de gevalideerde momentopname niet persistent kan opslaan.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [CLI-referentie](/nl/cli)
- [ClawHub](/clawhub)
