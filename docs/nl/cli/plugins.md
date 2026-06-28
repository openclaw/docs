---
read_when:
    - Je wilt Gateway-plugins of compatibele bundels installeren of beheren
    - Je wilt een eenvoudige tool-Plugin scaffolden of valideren
    - Je wilt fouten bij het laden van Plugins opsporen
sidebarTitle: Plugins
summary: CLI-referentie voor `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-06-28T20:43:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a703adb93af2490282f73b25cbbd95c7bc1d54c9c9c656fdb9b75465683f4ec8
    source_path: cli/plugins.md
    workflow: 16
---

Beheer Gateway-plugins, hookpakketten en compatibele bundels.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/nl/tools/plugin">
    Handleiding voor eindgebruikers voor het installeren, inschakelen en oplossen van problemen met plugins.
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
    Beveiligingshardening voor plugininstallaties.
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
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile clawhub-public --json
openclaw plugins marketplace refresh --feed-url https://clawhub.ai/v1/feeds/plugins --expected-sha256 <sha256>
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

Voer bij onderzoek naar trage installaties, inspecties, verwijderingen of registerverversingen de
opdracht uit met `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. De trace schrijft fasetimings
naar stderr en houdt JSON-uitvoer parseerbaar. Zie [Debuggen](/nl/help/debugging#plugin-lifecycle-trace).

<Note>
In Nix-modus (`OPENCLAW_NIX_MODE=1`) zijn mutators voor de pluginlevenscyclus uitgeschakeld. Gebruik voor deze installatie in plaats van `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` of `plugins disable` de Nix-bron; gebruik voor nix-openclaw de agent-first [Snelstart](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Gebundelde plugins worden met OpenClaw meegeleverd. Sommige zijn standaard ingeschakeld (bijvoorbeeld gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browserplugin); andere vereisen `plugins enable`.

Native OpenClaw-plugins moeten `openclaw.plugin.json` leveren met een inline JSON Schema (`configSchema`, zelfs als dit leeg is). Compatibele bundels gebruiken in plaats daarvan hun eigen bundelmanifesten.

`plugins list` toont `Format: openclaw` of `Format: bundle`. Uitgebreide list/info-uitvoer toont ook het bundelsubtype (`codex`, `claude` of `cursor`) plus gedetecteerde bundelmogelijkheden.
</Note>

### Auteur

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` maakt standaard een minimale TypeScript-toolplugin. Het eerste
argument is de plugin-id; geef `--name` door voor de weergavenaam. OpenClaw gebruikt de
id voor de standaarduitvoermap en pakketnaamgeving. Toolscaffolds gebruiken
`defineToolPlugin`.
`plugins build` importeert de gebouwde entry, leest de statische toolmetadata, schrijft
`openclaw.plugin.json` en houdt `package.json` `openclaw.extensions` uitgelijnd.
`plugins validate` controleert of het gegenereerde manifest, de pakketmetadata en
de huidige entry-export nog steeds overeenkomen. Zie [Toolplugins](/nl/plugins/tool-plugins) voor
de volledige workflow voor het maken van tools.

De scaffold schrijft TypeScript-broncode, maar genereert metadata uit de gebouwde
`./dist/index.js`-entry, zodat de workflow ook werkt met de gepubliceerde CLI. Gebruik
`--entry <path>` wanneer de entry niet de standaardpakketentry is. Gebruik
`plugins build --check` in CI om te falen wanneer gegenereerde metadata verouderd is zonder
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

Providerscaffolds maken een generieke tekst/model-providerplugin met OpenAI-compatibele
API-sleutelbedrading, een ingebouwd `npm run validate`-script voor `clawhub package
validate`, ClawHub-pakketmetadata en een handmatig gestarte GitHub-workflow
voor toekomstig vertrouwd publiceren via GitHub Actions OIDC. Providerscaffolds
genereren geen skills en gebruiken geen `openclaw plugins build` of
`openclaw plugins validate`; die opdrachten zijn bedoeld voor het pad met gegenereerde metadata
van de toolscaffold.

Vervang vóór publicatie de tijdelijke API-basis-URL, modelcatalogus, docsroute,
credentialtekst en README-tekst door echte providergegevens. Gebruik de
gegenereerde README voor eerste publicatie op ClawHub en het instellen van vertrouwde uitgevers.

### Installeren

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # source auto-detection
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Maintainers die installaties tijdens setup testen, kunnen automatische plugininstallatiebronnen
overschrijven met bewaakte omgevingsvariabelen. Zie
[Overschrijvingen voor plugininstallatie](/nl/plugins/install-overrides).

<Warning>
Kale pakketnamen worden tijdens de launchovergang standaard vanaf npm geïnstalleerd, tenzij ze overeenkomen met een officiële plugin-id. Ruwe `@openclaw/*`-pakketspecificaties die overeenkomen met gebundelde plugins, gebruiken de gebundelde kopie die met de huidige OpenClaw-build is meegeleverd. Gebruik `npm:<package>` wanneer je bewust een extern npm-pakket wilt. Gebruik `clawhub:<package>` voor ClawHub. Behandel plugininstallaties alsof je code uitvoert. Geef de voorkeur aan gepinde versies.
</Warning>

`plugins search` bevraagt ClawHub op installeerbare pluginpakketten en drukt
installatieklare pakketnamen af. Het zoekt naar code-plugin- en bundle-plugin-pakketten,
niet naar Skills. Gebruik `openclaw skills search` voor ClawHub-Skills.

<Note>
ClawHub is het primaire distributie- en ontdekkingsoppervlak voor de meeste plugins. Npm
blijft een ondersteunde fallback en direct-installatiepad. Door OpenClaw beheerde
`@openclaw/*`-pluginpakketten worden weer op npm gepubliceerd; zie de huidige lijst
op [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) of de
[plugininventaris](/nl/plugins/plugin-inventory). Stabiele installaties gebruiken `latest`.
Installaties en updates via het bètakanaal geven de voorkeur aan de npm-`beta` dist-tag wanneer die tag
beschikbaar is, en vallen daarna terug op `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Als je `plugins`-sectie wordt ondersteund door een enkelbestand-`$include`, schrijven `plugins install/update/enable/disable/uninstall` door naar dat opgenomen bestand en laten ze `openclaw.json` ongemoeid. Root-includes, include-arrays en includes met naastliggende overrides falen gesloten in plaats van te worden afgevlakt. Zie [Config-includes](/nl/gateway/configuration) voor de ondersteunde vormen.

    Als de configuratie ongeldig is tijdens de installatie, faalt `plugins install` normaal gesproken gesloten en vraagt het je eerst `openclaw doctor --fix` uit te voeren. Tijdens het opstarten en hot reloaden van Gateway faalt ongeldige pluginconfiguratie gesloten zoals elke andere ongeldige configuratie; `openclaw doctor --fix` kan de ongeldige pluginentry in quarantaine plaatsen. De enige gedocumenteerde uitzondering tijdens installatie is een smal herstelpad voor gebundelde plugins voor plugins die expliciet kiezen voor `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` hergebruikt het bestaande installatiedoel en overschrijft een al geïnstalleerde plugin of hookpakket ter plekke. Gebruik dit wanneer je bewust dezelfde id opnieuw installeert vanaf een nieuw lokaal pad, archief, ClawHub-pakket of npm-artifact. Geef voor routinematige upgrades van een al bijgehouden npm-plugin de voorkeur aan `openclaw plugins update <id-or-npm-spec>`.

    Als je `plugins install` uitvoert voor een plugin-id die al is geïnstalleerd, stopt OpenClaw en verwijst het je naar `plugins update <id-or-npm-spec>` voor een normale upgrade, of naar `plugins install <package> --force` wanneer je de huidige installatie echt vanuit een andere bron wilt overschrijven.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` is alleen van toepassing op npm-installaties. Het wordt niet ondersteund met `git:`-installaties; gebruik een expliciete git-ref zoals `git:github.com/acme/plugin@v1.2.3` wanneer je een gepinde bron wilt. Het wordt niet ondersteund met `--marketplace`, omdat marketplace-installaties marketplace-bronmetadata bewaren in plaats van een npm-specificatie.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` is verouderd en is nu een no-op. OpenClaw voert niet langer ingebouwde blokkering van gevaarlijke code tijdens installatie uit voor plugininstallaties.

    Gebruik het gedeelde, door de operator beheerde `security.installPolicy`-oppervlak wanneer hostspecifiek installatiebeleid vereist is. Plugin-`before_install`-hooks zijn lifecycle-hooks van de pluginruntime en vormen niet de primaire beleidsgrens voor CLI-installaties.

    Als een plugin die je op ClawHub hebt gepubliceerd verborgen of geblokkeerd is door een registerscan, gebruik dan de uitgeversstappen in [ClawHub-publicatie](/nl/clawhub/publishing). `--dangerously-force-unsafe-install` vraagt ClawHub niet om de plugin opnieuw te scannen of een geblokkeerde release openbaar te maken.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Community-ClawHub-installaties controleren het vertrouwensrecord van de geselecteerde release voordat ze het pakket downloaden. Als ClawHub downloaden voor de release uitschakelt, kwaadaardige scanbevindingen rapporteert of de release in een blokkerende moderatiestatus zoals quarantaine plaatst, weigert OpenClaw de release. Bij niet-blokkerende risicovolle scanstatussen, risicovolle moderatiestatussen of registerredenen toont OpenClaw de vertrouwensdetails en vraagt het om bevestiging voordat het doorgaat.

    Gebruik `--acknowledge-clawhub-risk` alleen nadat je de ClawHub-waarschuwing hebt beoordeeld en hebt besloten door te gaan zonder interactieve prompt. In afwachting zijnde of verouderde schone vertrouwensrecords waarschuwen, maar vereisen geen bevestiging. Officiële ClawHub-pakketten en gebundelde OpenClaw-pluginbronnen slaan deze release-vertrouwensprompt over.

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` is ook het installatieoppervlak voor hookpakketten die `openclaw.hooks` in `package.json` beschikbaar maken. Gebruik `openclaw hooks` voor gefilterde hookzichtbaarheid en inschakeling per hook, niet voor pakketinstallatie.

    Npm-specificaties zijn **alleen registry** (pakketnaam + optionele **exacte versie** of **dist-tag**). Git-/URL-/file-specificaties en semver-bereiken worden geweigerd. Dependency-installaties draaien in één beheerd npm-project per Plugin met `--ignore-scripts` voor veiligheid, zelfs wanneer je shell globale npm-installatie-instellingen heeft. Beheerde Plugin-npm-projecten erven OpenClaw's npm-`overrides` op pakketniveau, zodat hostbeveiligingspins ook gelden voor gehoste Plugin-dependencies.

    Gebruik `npm:<package>` wanneer je npm-resolutie expliciet wilt maken. Kale pakketspecificaties installeren tijdens de launch-cutover ook direct vanuit npm, tenzij ze overeenkomen met een officiële Plugin-id.

    Ruwe `@openclaw/*`-pakketspecificaties die overeenkomen met gebundelde Plugins worden vóór de npm-fallback naar de image-eigen gebundelde kopie geresolved. Bijvoorbeeld: `openclaw plugins install @openclaw/discord@2026.5.20 --pin` gebruikt de gebundelde Discord-Plugin uit de huidige OpenClaw-build in plaats van een beheerde npm-override te maken. Gebruik `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` om het externe npm-pakket af te dwingen.

    Kale specificaties en `@latest` blijven op het stabiele spoor. OpenClaw-correctieversies met datumstempel, zoals `2026.5.3-1`, zijn stabiele releases voor deze controle. Als npm een van beide naar een prerelease resolvet, stopt OpenClaw en vraagt het je expliciet in te stemmen met een prerelease-tag zoals `@beta`/`@rc` of een exacte prerelease-versie zoals `@1.2.3-beta.4`.

    Voor npm-installaties zonder exacte versie (`npm:<package>` of `npm:<package>@latest`) controleert OpenClaw de geresolvede pakketmetadata vóór installatie. Als het nieuwste stabiele pakket een nieuwere OpenClaw-Plugin-API of minimale hostversie vereist, inspecteert OpenClaw oudere stabiele versies en installeert het in plaats daarvan de nieuwste compatibele release. Exacte versies en expliciete dist-tags zoals `@beta` blijven strikt: als het geselecteerde pakket incompatibel is, mislukt de opdracht en vraagt deze je OpenClaw te upgraden of een compatibele versie te kiezen.

    Als een kale installatiespecificatie overeenkomt met een officiële Plugin-id (bijvoorbeeld `diffs`), installeert OpenClaw de catalogusvermelding direct. Gebruik een expliciete scoped specificatie (bijvoorbeeld `@scope/diffs`) om een npm-pakket met dezelfde naam te installeren.

  </Accordion>
  <Accordion title="Git-repository's">
    Gebruik `git:<repo>` om direct vanuit een git-repository te installeren. Ondersteunde vormen zijn onder andere `git:github.com/owner/repo`, `git:owner/repo`, volledige `https://`-, `ssh://`-, `git://`-, `file://`- en `git@host:owner/repo.git`-clone-URL's. Voeg `@<ref>` of `#<ref>` toe om vóór installatie een branch, tag of commit uit te checken.

    Git-installaties clonen naar een tijdelijke directory, checken de gevraagde ref uit wanneer die aanwezig is, en gebruiken daarna de normale installer voor Plugin-directories. Dat betekent dat manifestvalidatie, operator-installatiebeleid, package-manager-installatiewerk en installatierecords zich gedragen zoals bij npm-installaties. Vastgelegde git-installaties bevatten de bron-URL/ref plus de geresolvede commit, zodat `openclaw plugins update` de bron later opnieuw kan resolven.

    Gebruik na installatie vanuit git `openclaw plugins inspect <id> --runtime --json` om runtime-registraties zoals Gateway-methoden en CLI-opdrachten te verifiëren. Als de Plugin een CLI-root heeft geregistreerd met `api.registerCli`, voer je die opdracht direct uit via de OpenClaw-root-CLI, bijvoorbeeld `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archieven">
    Ondersteunde archieven: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-Plugin-archieven moeten een geldige `openclaw.plugin.json` bevatten in de uitgepakte Plugin-root; archieven die alleen `package.json` bevatten, worden geweigerd voordat OpenClaw installatierecords schrijft.

    Gebruik `npm-pack:<path.tgz>` wanneer het bestand een npm-pack-tarball is en je
    hetzelfde beheerde npm-projectpad per Plugin wilt testen dat door registry-
    installaties wordt gebruikt, inclusief `package-lock.json`-verificatie,
    scanning van gehoste dependencies en npm-installatierecords. Platte
    archiefpaden installeren nog steeds als lokale archieven onder de
    Plugin-extensions-root.

    Claude-marktplaatsinstallaties worden ook ondersteund.

  </Accordion>
</AccordionGroup>

ClawHub-installaties gebruiken een expliciete `clawhub:<package>`-locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Kale npm-veilige Plugin-specificaties installeren tijdens de launch-cutover standaard vanuit npm, tenzij ze overeenkomen met een officiële Plugin-id:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gebruik `npm:` om npm-only-resolutie expliciet te maken:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controleert de geadverteerde Plugin-API / minimale Gateway-compatibiliteit vóór installatie. Wanneer de geselecteerde ClawHub-versie een ClawPack-artefact publiceert, downloadt OpenClaw de geversioneerde npm-pack `.tgz`, verifieert het de ClawHub-digestheader en de artefactdigest, en installeert het dit vervolgens via het normale archiefpad. Oudere ClawHub-versies zonder ClawPack-metadata installeren nog steeds via het legacy pakketarchiefverificatiepad. Vastgelegde installaties bewaren hun ClawHub-bronmetadata, artefactsoort, npm-integriteit, npm-shasum, tarballnaam en ClawPack-digestfeiten voor latere updates.
Ongeversioneerde ClawHub-installaties bewaren een ongeversioneerde vastgelegde specificatie, zodat `openclaw plugins update` nieuwere ClawHub-releases kan volgen; expliciete versie- of tagselectors zoals `clawhub:pkg@1.2.3` en `clawhub:pkg@beta` blijven aan die selector gepind.

#### Marktplaatsverkorting

Gebruik de verkorting `plugin@marketplace` wanneer de marktplaatsnaam bestaat in Claude's lokale registry-cache op `~/.claude/plugins/known_marketplaces.json`:

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
    - een lokale marketplace-root of pad naar `marketplace.json`
    - een GitHub-repoafkorting zoals `owner/repo`
    - een GitHub-repo-URL zoals `https://github.com/owner/repo`
    - een git-URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Voor externe marketplaces die vanaf GitHub of git worden geladen, moeten pluginvermeldingen binnen de gekloonde marketplace-repo blijven. OpenClaw accepteert relatieve padbronnen uit die repo en weigert HTTP(S)-, absolute-pad-, git-, GitHub- en andere niet-pad-pluginbronnen uit externe manifests.
  </Tab>
</Tabs>

Voor lokale paden en archieven detecteert OpenClaw automatisch:

- native OpenClaw-plugins (`openclaw.plugin.json`)
- Codex-compatibele bundels (`.codex-plugin/plugin.json`)
- Claude-compatibele bundels (`.claude-plugin/plugin.json` of de standaard Claude-componentindeling)
- Cursor-compatibele bundels (`.cursor-plugin/plugin.json`)

Beheerde lokale installaties moeten pluginmappen of archieven zijn. Losstaande `.js`-,
`.mjs`-, `.cjs`- en `.ts`-pluginbestanden worden niet naar de beheerde pluginroot
gekopieerd door `plugins install`; vermeld ze in plaats daarvan expliciet in `plugins.load.paths`.

<Note>
Compatibele bundels worden in de normale pluginroot geinstalleerd en nemen deel aan dezelfde lijst-/info-/inschakel-/uitschakelstroom. Momenteel worden bundel-Skills, Claude command-skills, Claude `settings.json`-standaardwaarden, Claude `.lsp.json` / door manifest gedeclareerde `lspServers`-standaardwaarden, Cursor command-skills en compatibele Codex-hookmappen ondersteund; andere gedetecteerde bundelmogelijkheden worden weergegeven in diagnostiek/info, maar zijn nog niet verbonden met runtime-uitvoering.
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
  Machineleesbare inventaris plus registerdiagnostiek en installatiestatus van pakketafhankelijkheden.
</ParamField>

<Note>
`plugins list` leest eerst het opgeslagen lokale pluginregister, met een alleen-uit-manifest-afgeleide fallback wanneer het register ontbreekt of ongeldig is. Dit is nuttig om te controleren of een plugin is geinstalleerd, ingeschakeld en zichtbaar is voor koude opstartplanning, maar het is geen live runtime-probe van een Gateway-proces dat al draait. Nadat je plugincode, inschakeling, hookbeleid of `plugins.load.paths` hebt gewijzigd, herstart je de Gateway die het kanaal bedient voordat je verwacht dat nieuwe `register(api)`-code of hooks worden uitgevoerd. Controleer bij externe/containerimplementaties dat je het daadwerkelijke `openclaw gateway run`-childproces herstart, niet alleen een wrapperproces.

`plugins list --json` bevat voor elke plugin de `dependencyStatus` uit `package.json`
`dependencies` en `optionalDependencies`. OpenClaw controleert of die pakketnamen
aanwezig zijn langs het normale Node `node_modules`-opzoekpad van de plugin; het
importeert geen runtimecode van plugins, voert geen package manager uit en herstelt
ontbrekende afhankelijkheden niet.
</Note>

Als de opstartlog `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` meldt,
voer dan `openclaw plugins list --enabled --verbose` of
`openclaw plugins inspect <id>` uit met een vermelde plugin-id om de plugin-id's
te bevestigen en vertrouwde id's naar `plugins.allow` in `openclaw.json` te kopieren. Wanneer de
waarschuwing elke gevonden plugin kan vermelden, wordt er een direct te plakken
`plugins.allow`-snippet afgedrukt waarin die id's al zijn opgenomen. Als een plugin wordt geladen
zonder herkomst van installatie/laadpad, inspecteer dan die plugin-id en pin vervolgens
de vertrouwde id in `plugins.allow` of installeer de plugin opnieuw vanuit een vertrouwde bron
zodat OpenClaw de installatieherkomst vastlegt.

`plugins search` is een externe ClawHub-catalogusopzoeking. Het inspecteert geen lokale
status, wijzigt geen configuratie, installeert geen pakketten en laadt geen runtimecode van plugins. Zoekresultaten
bevatten de ClawHub-pakketnaam, familie, kanaal, versie, samenvatting en
een installatietip zoals `openclaw plugins install clawhub:<package>`.

Voor werk aan gebundelde plugins binnen een verpakte Docker-image koppel je de plugin-
bronmap via bind mount over het overeenkomende verpakte bronpad, zoals
`/app/extensions/synology-chat`. OpenClaw ontdekt die aangekoppelde bron-
overlay voor `/app/dist/extensions/synology-chat`; een gewone gekopieerde bron-
map blijft inert, zodat normale verpakte installaties nog steeds de gecompileerde dist gebruiken.

Voor debugging van runtime-hooks:

- `openclaw plugins inspect <id> --runtime --json` toont geregistreerde hooks en diagnostiek uit een inspectiepass waarbij de module is geladen. Runtime-inspectie installeert nooit afhankelijkheden; gebruik `openclaw doctor --fix` om verouderde afhankelijkheidsstatus op te schonen of ontbrekende downloadbare plugins te herstellen waarnaar in configuratie wordt verwezen.
- `openclaw gateway status --deep --require-rpc` bevestigt de bereikbare Gateway-URL/het bereikbare Gateway-profiel, service-/proceshints, configuratiepad en RPC-gezondheid.
- Niet-gebundelde gesprekshooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) vereisen `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gebruik `--link` om te voorkomen dat een lokale pluginmap wordt gekopieerd (voegt toe aan `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

Losstaande pluginbestanden moeten in `plugins.load.paths` worden vermeld in plaats van
geinstalleerd met `plugins install` of rechtstreeks geplaatst in `~/.openclaw/extensions`
of `<workspace>/.openclaw/extensions`. Deze automatisch ontdekte roots laden plugin-
pakket- of bundelmappen, terwijl scripts op het hoogste niveau als lokale
helpers worden behandeld en overgeslagen.

<Note>
Workspace-origin Plugins die vanuit een workspace-extensiesroot worden ontdekt, worden niet
geïmporteerd of uitgevoerd totdat ze expliciet zijn ingeschakeld. Voer voor lokale ontwikkeling
`openclaw plugins enable <plugin-id>` uit of stel
`plugins.entries.<plugin-id>.enabled: true` in; als je configuratie
`plugins.allow` gebruikt, neem dezelfde Plugin-id daar dan ook op. Deze fail-closed-regel
geldt ook wanneer kanaalconfiguratie expliciet een workspace-origin Plugin target voor
setup-only laden, zodat lokale kanaal-Plugin-setupcode niet wordt uitgevoerd zolang die
workspace-Plugin uitgeschakeld blijft of van de allowlist is uitgesloten. Gekoppelde installaties
en expliciete `plugins.load.paths`-vermeldingen volgen het normale beleid voor hun
opgeloste Plugin-origin. Zie
[Plugin-beleid configureren](/nl/tools/plugin#configure-plugin-policy)
en [Configuratiereferentie](/nl/gateway/configuration-reference#plugins).

`--force` wordt niet ondersteund met `--link`, omdat gekoppelde installaties het bronpad hergebruiken in plaats van over een beheerd installatietarget heen te kopiëren.

Gebruik `--pin` bij npm-installaties om de opgeloste exacte spec (`name@version`) in de beheerde Plugin-index op te slaan, terwijl het standaardgedrag ongepind blijft.
</Note>

### Plugin-index

Plugin-installatiemetadata is door de machine beheerde status, geen gebruikersconfiguratie. Installaties en updates schrijven deze naar de gedeelde SQLite-statusdatabase onder de actieve OpenClaw-statusdirectory. De rij `installed_plugin_index` bewaart duurzame `installRecords`-metadata, inclusief records voor kapotte of ontbrekende Plugin-manifesten, plus een uit het manifest afgeleide koude registry-cache die wordt gebruikt door `openclaw plugins update`, de-installatie, diagnostiek en de koude Plugin-registry.

Wanneer OpenClaw verzonden legacy `plugins.installs`-records in configuratie ziet, behandelen runtime-reads deze als compatibiliteitsinvoer zonder `openclaw.json` te herschrijven. Expliciete Plugin-writes en `openclaw doctor --fix` verplaatsen die records naar de Plugin-index en verwijderen de configuratiesleutel wanneer configuratiewrites zijn toegestaan; als een van beide writes mislukt, blijven de configuratierecords behouden zodat de installatiemetadata niet verloren gaat.

### De-installeren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` verwijdert Plugin-records uit `plugins.entries`, de gepersisteerde Plugin-index, Plugin-allow/denylist-vermeldingen en gekoppelde `plugins.load.paths`-vermeldingen wanneer van toepassing. Tenzij `--keep-files` is ingesteld, verwijdert de-installatie ook de bijgehouden beheerde installatiedirectory wanneer die zich binnen de Plugin-extensiesroot van OpenClaw bevindt. Voor Active Memory-Plugins wordt het geheugenslot teruggezet naar `memory-core`.

<Note>
`--keep-config` wordt ondersteund als verouderd alias voor `--keep-files`.
</Note>

### Bijwerken

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Updates worden toegepast op bijgehouden Plugin-installaties in de beheerde Plugin-index en bijgehouden hook-pack-installaties in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Wanneer je een Plugin-id doorgeeft, hergebruikt OpenClaw de vastgelegde installatiespec voor die Plugin. Dat betekent dat eerder opgeslagen dist-tags zoals `@beta` en exact gepinde versies ook bij latere `update <id>`-runs worden gebruikt.

    Tijdens `update <id> --dry-run` blijven exact gepinde npm-installaties gepind. Als OpenClaw ook de standaardlijn van de package-registry kan oplossen en die standaardlijn nieuwer is dan de geïnstalleerde gepinde versie, rapporteert de dry run de pin en print de expliciete `@latest` package-updateopdracht om de standaardlijn van de registry te volgen.

    Die gerichte-updateregel verschilt van het bulkonderhoudspad `openclaw plugins update --all`. Bulkupdates respecteren nog steeds gewone bijgehouden installatiespecs, maar vertrouwde officiële OpenClaw Plugin-records kunnen synchroniseren naar het huidige officiële catalogustarget in plaats van op een verouderde exacte officiële package te blijven. Gebruik gerichte `update <id>` wanneer je bewust een exacte of getagde officiële spec ongemoeid wilt laten.

    Voor npm-installaties kun je ook een expliciete npm-package-spec met een dist-tag of exacte versie doorgeven. OpenClaw lost die packagenaam terug op naar het bijgehouden Plugin-record, werkt die geïnstalleerde Plugin bij en legt de nieuwe npm-spec vast voor toekomstige id-gebaseerde updates.

    Het doorgeven van de npm-packagenaam zonder versie of tag wordt ook terug opgelost naar het bijgehouden Plugin-record. Gebruik dit wanneer een Plugin aan een exacte versie was gepind en je deze terug wilt verplaatsen naar de standaardreleaselijn van de registry.

  </Accordion>
  <Accordion title="Beta channel updates">
    Gerichte `openclaw plugins update <id-or-npm-spec>` hergebruikt de bijgehouden Plugin-spec, tenzij je een nieuwe spec doorgeeft. Bulk `openclaw plugins update --all` gebruikt de geconfigureerde `update.channel` wanneer vertrouwde officiële Plugin-records naar het officiële catalogustarget worden gesynchroniseerd, zodat beta-channel-installaties op de beta-releaselijn kunnen blijven in plaats van stilzwijgend naar stable/latest te worden genormaliseerd.

    `openclaw update` kent ook het actieve OpenClaw-updatekanaal: op het betakanaal proberen default-line npm- en ClawHub-Plugin-records eerst `@beta`. Ze vallen terug op de vastgelegde default/latest-spec als er geen Plugin-bètarelease bestaat; npm-Plugins vallen ook terug wanneer het bèta-package bestaat maar install validatie niet haalt. Die fallback wordt als waarschuwing gemeld en laat de core-update niet mislukken. Exacte versies en expliciete tags blijven voor gerichte updates aan die selector gepind.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Vóór een live npm-update controleert OpenClaw de geïnstalleerde packageversie tegen de npm-registrymetadata. Als de geïnstalleerde versie en vastgelegde artifact-identiteit al overeenkomen met het opgeloste target, wordt de update overgeslagen zonder te downloaden, opnieuw te installeren of `openclaw.json` te herschrijven.

    Wanneer een opgeslagen integriteitshash bestaat en de opgehaalde artifact-hash verandert, behandelt OpenClaw dat als npm-artifactdrift. De interactieve opdracht `openclaw plugins update` print de verwachte en daadwerkelijke hashes en vraagt om bevestiging voordat wordt doorgegaan. Niet-interactieve updatehelpers falen fail-closed tenzij de caller een expliciet voortzettingsbeleid opgeeft.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` wordt voor compatibiliteit ook geaccepteerd bij `plugins update`, maar is verouderd en wijzigt het Plugin-updategedrag niet meer. Operator `security.installPolicy` kan updates nog steeds blokkeren; Plugin-`before_install`-hooks gelden alleen in processen waarin Plugin-hooks zijn geladen.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk on update">
    Community-Plugin-updates met ClawHub-backend voeren vóór het downloaden van het vervangende package dezelfde exact-release-vertrouwenscontrole uit als installaties. Gebruik `--acknowledge-clawhub-risk` voor beoordeelde automatisering die moet doorgaan wanneer de geselecteerde ClawHub-release een risicovolle vertrouwenswaarschuwing heeft. Officiële ClawHub-packages en gebundelde OpenClaw Plugin-bronnen slaan deze release-vertrouwensprompt over.
  </Accordion>
</AccordionGroup>

### Inspecteren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect toont identiteit, laadstatus, bron, manifestcapaciteiten, beleidsvlaggen, diagnostiek, installatiemetadata, bundle-capaciteiten en eventueel gedetecteerde MCP- of LSP-serverondersteuning zonder standaard de Plugin-runtime te importeren. JSON-uitvoer bevat de Plugin-manifestcontracten, zoals `contracts.agentToolResultMiddleware` en `contracts.trustedToolPolicies`, zodat operators trusted-surface-declaraties kunnen auditen voordat ze een Plugin inschakelen of herstarten. Voeg `--runtime` toe om de Plugin-module te laden en geregistreerde hooks, tools, opdrachten, services, Gateway-methoden en HTTP-routes op te nemen. Runtime-inspectie rapporteert ontbrekende Plugin-afhankelijkheden direct; installaties en reparaties blijven in `openclaw plugins install`, `openclaw plugins update` en `openclaw doctor --fix`.

CLI-opdrachten die eigendom zijn van Plugins worden meestal geïnstalleerd als root-`openclaw`-opdrachtgroepen, maar Plugins kunnen ook geneste opdrachten registreren onder een core-parent zoals `openclaw nodes`. Nadat `inspect --runtime` een opdracht onder `cliCommands` toont, voer je die uit op het vermelde pad; een Plugin die bijvoorbeeld `demo-git` registreert, kan worden geverifieerd met `openclaw demo-git ping`.

Elke Plugin wordt geclassificeerd op basis van wat deze daadwerkelijk tijdens runtime registreert:

- **plain-capability** — één capaciteitstype (bijv. een provider-only Plugin)
- **hybrid-capability** — meerdere capaciteitstypen (bijv. tekst + spraak + afbeeldingen)
- **hook-only** — alleen hooks, geen capaciteiten of surfaces
- **non-capability** — tools/opdrachten/services maar geen capaciteiten

Zie [Plugin-vormen](/nl/plugins/architecture#plugin-shapes) voor meer over het capaciteitsmodel.

<Note>
De vlag `--json` voert een machineleesbaar rapport uit dat geschikt is voor scripting en auditing. `inspect --all` rendert een vlootbrede tabel met vorm, capaciteitstypen, compatibiliteitsmeldingen, bundle-capaciteiten en kolommen met hooksamenvatting. `info` is een alias voor `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` rapporteert Plugin-laadfouten, manifest-/discovery-diagnostiek, compatibiliteitsmeldingen en verouderde Plugin-configuratiereferenties zoals ontbrekende Plugin-slots. Wanneer de install tree en Plugin-configuratie schoon zijn, print het `No plugin issues detected.` Als verouderde configuratie overblijft maar de install tree verder gezond is, zegt de samenvatting dat in plaats van volledige Plugin-gezondheid te suggereren.

Als een geconfigureerde Plugin op schijf aanwezig is maar door de path-safety-controles van de loader wordt geblokkeerd, behoudt configuratievalidatie de Plugin-vermelding en rapporteert deze als `present but blocked`. Los de voorafgaande blocked-plugin-diagnostiek op, zoals padeigendom of world-writable permissies, in plaats van de configuratie `plugins.entries.<id>` of `plugins.allow` te verwijderen.

Voor module-shape-fouten zoals ontbrekende `register`/`activate`-exports, voer opnieuw uit met `OPENCLAW_PLUGIN_LOAD_DEBUG=1` om een compacte export-shape-samenvatting in de diagnostische uitvoer op te nemen.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

De lokale Plugin-registry is het gepersisteerde koude leesmodel van OpenClaw voor geïnstalleerde Plugin-identiteit, inschakeling, bronmetadata en eigenaarschap van bijdragen. Normale startup, provider-owner-lookup, classificatie van kanaalsetup en Plugin-inventaris kunnen dit lezen zonder Plugin-runtimemodules te importeren.

Gebruik `plugins registry` om te inspecteren of de gepersisteerde registry aanwezig, actueel of verouderd is. Gebruik `--refresh` om deze opnieuw op te bouwen vanuit de gepersisteerde Plugin-index, configuratiebeleid en manifest-/packagemetadata. Dit is een reparatiepad, geen runtime-activatiepad.

`openclaw doctor --fix` repareert ook registry-aangrenzende beheerde npm-drift: als een verweesd of hersteld `@openclaw/*`-package onder een beheerd Plugin-npm-project of de legacy platte beheerde npm-root een gebundelde Plugin overschaduwt, verwijdert doctor dat verouderde package en bouwt de registry opnieuw op zodat startup tegen het gebundelde manifest valideert. Doctor koppelt ook het hostpackage `openclaw` opnieuw in beheerde npm-Plugins die `peerDependencies.openclaw` declareren, zodat package-lokale runtime-imports zoals `openclaw/plugin-sdk/*` na updates of npm-reparaties oplossen.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` is een verouderde break-glass-compatibiliteitsschakelaar voor registry-leesfouten. Geef de voorkeur aan `plugins registry --refresh` of `openclaw doctor --fix`; de env-fallback is alleen voor noodherstel van startup terwijl de migratie wordt uitgerold.
</Warning>

### Marktplaats

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

Marketplace list accepteert een lokaal marketplace-pad, een pad naar `marketplace.json`, een GitHub-afkorting zoals `owner/repo`, een GitHub-repo-URL of een git-URL. `--json` drukt het opgeloste bronlabel af plus het geparste marketplace-manifest en de plugin-vermeldingen.

Marketplace refresh laadt een gehoste OpenClaw-marketplacefeed en bewaart de
gevalideerde respons als de lokale snapshot van de gehoste feed. Zonder opties gebruikt het
het geconfigureerde standaard feed-profiel. Gebruik `--feed-profile <name>` om een
specifiek geconfigureerd profiel te verversen, `--feed-url <url>` om een expliciete gehoste
feed-URL te verversen, `--expected-sha256 <sha256>` om een overeenkomende payload-checksum te vereisen
(`sha256:<hex>` of een kale hex-digest van 64 tekens), en `--json` voor
machineleesbare uitvoer. Expliciete gehoste feed-URL's mogen geen
referenties, queryreeksen of fragmenten bevatten. Niet-vastgezette refreshes kunnen een
gehoste snapshot of een gebundeld fallback-resultaat rapporteren zonder de opdracht te laten mislukken. Vastgezette
refreshes mislukken tenzij ze een nieuwe gehoste payload accepteren, en geslaagde gehoste
refreshes mislukken als OpenClaw de gevalideerde snapshot niet kan bewaren.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [CLI-referentie](/nl/cli)
- [ClawHub](/nl/clawhub)
