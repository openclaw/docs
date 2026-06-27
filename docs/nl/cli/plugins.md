---
read_when:
    - U wilt Gateway-plugins of compatibele bundels installeren of beheren
    - Je wilt een eenvoudige tool-Plugin scaffolden of valideren
    - Je wilt fouten bij het laden van plugins opsporen
sidebarTitle: Plugins
summary: CLI-referentie voor `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-06-27T17:21:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4366a862f6a8996b38b624760eef407969f35a7451e3b2a1d5e82746d73b678
    source_path: cli/plugins.md
    workflow: 16
---

Beheer Gateway-plugins, haakpakketten en compatibele bundels.

<CardGroup cols={2}>
  <Card title="Plugin-systeem" href="/nl/tools/plugin">
    Gebruikershandleiding voor het installeren, inschakelen en oplossen van problemen met plugins.
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
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

Voor onderzoek naar trage installatie-, inspectie-, verwijderings- of registry-verversingsacties voert u de
opdracht uit met `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. De trace schrijft fasetimings
naar stderr en houdt JSON-uitvoer parseerbaar. Zie [Foutopsporing](/nl/help/debugging#plugin-lifecycle-trace).

<Note>
In Nix-modus (`OPENCLAW_NIX_MODE=1`) zijn mutators voor de Plugin-levenscyclus uitgeschakeld. Gebruik voor deze installatie de Nix-bron in plaats van `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` of `plugins disable`; gebruik voor nix-openclaw de agent-first [Snelstart](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Gebundelde plugins worden met OpenClaw geleverd. Sommige zijn standaard ingeschakeld (bijvoorbeeld gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browser-Plugin); andere vereisen `plugins enable`.

Native OpenClaw-plugins moeten `openclaw.plugin.json` leveren met een inline JSON Schema (`configSchema`, zelfs als het leeg is). Compatibele bundels gebruiken in plaats daarvan hun eigen bundelmanifesten.

`plugins list` toont `Format: openclaw` of `Format: bundle`. Uitvoer van uitgebreide lijst/info toont ook het bundelsubtype (`codex`, `claude` of `cursor`) plus gedetecteerde bundelmogelijkheden.
</Note>

### Auteur

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` maakt standaard een minimale TypeScript-tool-Plugin. Het eerste
argument is de Plugin-id; geef `--name` door voor de weergavenaam. OpenClaw gebruikt de
id voor de standaarduitvoermap en pakketnaamgeving. Tool-scaffolds gebruiken
`defineToolPlugin`.
`plugins build` importeert het gebouwde entrypoint, leest de statische toolmetadata, schrijft
`openclaw.plugin.json` en houdt `package.json` `openclaw.extensions` afgestemd.
`plugins validate` controleert of het gegenereerde manifest, de pakketmetadata en
de huidige entry-export nog overeenkomen. Zie [Tool-plugins](/nl/plugins/tool-plugins) voor
de volledige workflow voor het maken van tools.

De scaffold schrijft TypeScript-broncode maar genereert metadata uit het gebouwde
`./dist/index.js`-entrypoint, zodat de workflow ook werkt met de gepubliceerde CLI. Gebruik
`--entry <path>` wanneer het entrypoint niet het standaardpakketentrypoint is. Gebruik
`plugins build --check` in CI om te falen wanneer gegenereerde metadata verouderd is zonder
bestanden te herschrijven.

### Provider-scaffold

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Provider-scaffolds maken een generieke tekst-/modelprovider-Plugin met OpenAI-compatibele
API-sleutelafhandeling, een ingebouwd `npm run validate`-script voor `clawhub package
validate`, ClawHub-pakketmetadata en een handmatig gestarte GitHub-workflow
voor toekomstige vertrouwde publicatie via GitHub Actions OIDC. Provider-scaffolds
genereren geen Skills en gebruiken geen `openclaw plugins build` of
`openclaw plugins validate`; die opdrachten zijn bedoeld voor het pad met gegenereerde metadata
van de tool-scaffold.

Vervang vóór publicatie de placeholder-API-basis-URL, modelcatalogus, docs-route,
referentietekst en README-tekst door echte providerdetails. Gebruik de
gegenereerde README voor eerste ClawHub-publicatie en instelling van vertrouwde uitgevers.

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

Maintainers die installaties tijdens setup testen, kunnen automatische Plugin-installatiebronnen
overschrijven met bewaakte omgevingsvariabelen. Zie
[Plugin-installatie-overschrijvingen](/nl/plugins/install-overrides).

<Warning>
Kale pakketnamen installeren tijdens de launch-overgang standaard vanaf npm, tenzij ze overeenkomen met een officiële Plugin-id. Ruwe `@openclaw/*`-pakketspecificaties die overeenkomen met gebundelde plugins gebruiken de gebundelde kopie die met de huidige OpenClaw-build is geleverd. Gebruik `npm:<package>` wanneer u bewust een extern npm-pakket wilt gebruiken. Gebruik `clawhub:<package>` voor ClawHub. Behandel Plugin-installaties alsof u code uitvoert. Geef de voorkeur aan vastgepinde versies.
</Warning>

`plugins search` bevraagt ClawHub naar installeerbare Plugin-pakketten en drukt
installatieklare pakketnamen af. Het zoekt code-plugin- en bundle-plugin-pakketten,
geen Skills. Gebruik `openclaw skills search` voor ClawHub Skills.

<Note>
ClawHub is het primaire distributie- en ontdekkingsoppervlak voor de meeste plugins. Npm
blijft een ondersteund fallback- en direct-installatiepad. OpenClaw-eigen
`@openclaw/*`-Plugin-pakketten worden weer op npm gepubliceerd; zie de huidige lijst
op [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) of de
[Plugin-inventaris](/nl/plugins/plugin-inventory). Stabiele installaties gebruiken `latest`.
Installaties en updates via het bètakanaal geven de voorkeur aan de npm `beta` dist-tag wanneer die tag
beschikbaar is, en vallen daarna terug op `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config-includes en reparatie van ongeldige config">
    Als uw `plugins`-sectie wordt ondersteund door een `$include` met één bestand, schrijven `plugins install/update/enable/disable/uninstall` door naar dat opgenomen bestand en laten ze `openclaw.json` ongemoeid. Root-includes, include-arrays en includes met sibling-overschrijvingen falen gesloten in plaats van af te vlakken. Zie [Config-includes](/nl/gateway/configuration) voor de ondersteunde vormen.

    Als de config tijdens installatie ongeldig is, faalt `plugins install` normaal gesproken gesloten en vertelt het u eerst `openclaw doctor --fix` uit te voeren. Tijdens Gateway-start en hot reload faalt ongeldige Plugin-config gesloten zoals elke andere ongeldige config; `openclaw doctor --fix` kan de ongeldige Plugin-vermelding in quarantaine plaatsen. De enige gedocumenteerde uitzondering tijdens installatie is een smal herstelpad voor gebundelde plugins voor plugins die expliciet kiezen voor `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force en opnieuw installeren versus bijwerken">
    `--force` hergebruikt het bestaande installatiedoel en overschrijft een al geïnstalleerde Plugin of haakpakket ter plaatse. Gebruik dit wanneer u bewust dezelfde id opnieuw installeert vanaf een nieuw lokaal pad, archief, ClawHub-pakket of npm-artefact. Voor routinematige upgrades van een al gevolgde npm-Plugin geeft u de voorkeur aan `openclaw plugins update <id-or-npm-spec>`.

    Als u `plugins install` uitvoert voor een Plugin-id die al is geïnstalleerd, stopt OpenClaw en verwijst het u naar `plugins update <id-or-npm-spec>` voor een normale upgrade, of naar `plugins install <package> --force` wanneer u de huidige installatie echt vanaf een andere bron wilt overschrijven.

  </Accordion>
  <Accordion title="--pin-bereik">
    `--pin` is alleen van toepassing op npm-installaties. Het wordt niet ondersteund met `git:`-installaties; gebruik een expliciete git-ref zoals `git:github.com/acme/plugin@v1.2.3` wanneer u een vastgepinde bron wilt. Het wordt niet ondersteund met `--marketplace`, omdat marketplace-installaties marketplace-bronmetadata behouden in plaats van een npm-specificatie.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` is verouderd en is nu een no-op. OpenClaw voert geen ingebouwde blokkering van gevaarlijke code tijdens installatie meer uit voor Plugin-installaties.

    Gebruik het gedeelde, door de operator beheerde `security.installPolicy`-oppervlak wanneer hostspecifiek installatiebeleid vereist is. Plugin-`before_install`-hooks zijn levenscyclushooks van de Plugin-runtime en zijn niet de primaire beleidsgrens voor CLI-installaties.

    Als een Plugin die u op ClawHub hebt gepubliceerd verborgen of geblokkeerd is door een registryscan, gebruik dan de uitgeverstappen in [ClawHub-publicatie](/nl/clawhub/publishing). `--dangerously-force-unsafe-install` vraagt ClawHub niet om de Plugin opnieuw te scannen of een geblokkeerde release openbaar te maken.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Community-installaties via ClawHub controleren het vertrouwensrecord van de geselecteerde release voordat het pakket wordt gedownload. Als ClawHub downloaden voor de release uitschakelt, kwaadaardige scanbevindingen rapporteert of de release in een blokkerende moderatiestatus zoals quarantaine plaatst, weigert OpenClaw de release. Bij niet-blokkerende risicovolle scanstatussen, risicovolle moderatiestatussen of registry-redenen toont OpenClaw de vertrouwensdetails en vraagt het om bevestiging voordat het doorgaat.

    Gebruik `--acknowledge-clawhub-risk` alleen nadat u de ClawHub-waarschuwing hebt beoordeeld en hebt besloten door te gaan zonder interactieve prompt. Hangende of verouderde schone vertrouwensrecords waarschuwen wel, maar vereisen geen bevestiging. Officiële ClawHub-pakketten en gebundelde OpenClaw-Plugin-bronnen slaan deze release-vertrouwensprompt over.

  </Accordion>
  <Accordion title="Haakpakketten en npm-specificaties">
    `plugins install` is ook het installatieoppervlak voor haakpakketten die `openclaw.hooks` in `package.json` blootstellen. Gebruik `openclaw hooks` voor gefilterde zichtbaarheid van hooks en inschakeling per hook, niet voor pakketinstallatie.

    Npm-specificaties zijn **alleen registry** (pakketnaam + optionele **exacte versie** of **dist-tag**). Git-/URL-/bestandsspecificaties en semver-bereiken worden geweigerd. Dependency-installaties worden uitgevoerd in één beheerd npm-project per Plugin met `--ignore-scripts` voor veiligheid, zelfs wanneer uw shell globale npm-installatie-instellingen heeft. Beheerde Plugin-npm-projecten erven OpenClaw's pakketniveau npm-`overrides`, zodat hostbeveiligingspins ook van toepassing zijn op gehesen Plugin-dependencies.

    Gebruik `npm:<package>` wanneer u npm-resolutie expliciet wilt maken. Kale pakketspecificaties installeren tijdens de launch-overgang ook rechtstreeks vanaf npm, tenzij ze overeenkomen met een officiële Plugin-id.

    Onbewerkte `@openclaw/*`-pakketspecificaties die overeenkomen met gebundelde plugins worden opgelost naar de door de image beheerde gebundelde kopie vóór de npm-fallback. Bijvoorbeeld: `openclaw plugins install @openclaw/discord@2026.5.20 --pin` gebruikt de gebundelde Discord-plugin uit de huidige OpenClaw-build in plaats van een beheerde npm-override te maken. Gebruik `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` om het externe npm-pakket af te dwingen.

    Kale specificaties en `@latest` blijven op het stabiele spoor. OpenClaw-correctieversies met datumstempel, zoals `2026.5.3-1`, zijn voor deze controle stabiele releases. Als npm een van die versies naar een prerelease oplost, stopt OpenClaw en vraagt het je expliciet in te stemmen met een prerelease-tag zoals `@beta`/`@rc` of een exacte prereleaseversie zoals `@1.2.3-beta.4`.

    Voor npm-installaties zonder exacte versie (`npm:<package>` of `npm:<package>@latest`) controleert OpenClaw de opgeloste pakketmetadata vóór installatie. Als het nieuwste stabiele pakket een nieuwere OpenClaw-plugin-API of minimale hostversie vereist, inspecteert OpenClaw oudere stabiele versies en installeert het in plaats daarvan de nieuwste compatibele release. Exacte versies en expliciete dist-tags zoals `@beta` blijven strikt: als het geselecteerde pakket incompatibel is, mislukt de opdracht en vraagt deze je OpenClaw te upgraden of een compatibele versie te kiezen.

    Als een kale installatiespecificatie overeenkomt met een officiële plugin-id (bijvoorbeeld `diffs`), installeert OpenClaw de catalogusvermelding rechtstreeks. Gebruik een expliciete scoped specificatie (bijvoorbeeld `@scope/diffs`) om een npm-pakket met dezelfde naam te installeren.

  </Accordion>
  <Accordion title="Git repositories">
    Gebruik `git:<repo>` om rechtstreeks vanuit een git-repository te installeren. Ondersteunde vormen zijn onder andere `git:github.com/owner/repo`, `git:owner/repo`, volledige `https://`-, `ssh://`-, `git://`-, `file://`- en `git@host:owner/repo.git`-clone-URL's. Voeg `@<ref>` of `#<ref>` toe om vóór installatie een branch, tag of commit uit te checken.

    Git-installaties klonen naar een tijdelijke map, checken de gevraagde ref uit wanneer die aanwezig is, en gebruiken daarna de normale installer voor pluginmappen. Dat betekent dat manifestvalidatie, installatiebeleid van de operator, installatiewerk van de package-manager en installatieregistraties zich gedragen zoals bij npm-installaties. Geregistreerde git-installaties bevatten de bron-URL/ref plus de opgeloste commit, zodat `openclaw plugins update` de bron later opnieuw kan oplossen.

    Gebruik na installatie vanuit git `openclaw plugins inspect <id> --runtime --json` om runtimeregistraties zoals gatewaymethoden en CLI-opdrachten te verifiëren. Als de plugin een CLI-root met `api.registerCli` heeft geregistreerd, voer die opdracht dan rechtstreeks uit via de OpenClaw-root-CLI, bijvoorbeeld `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Ondersteunde archieven: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-pluginarchieven moeten een geldig `openclaw.plugin.json` bevatten in de uitgepakte pluginroot; archieven die alleen `package.json` bevatten, worden geweigerd voordat OpenClaw installatieregistraties schrijft.

    Gebruik `npm-pack:<path.tgz>` wanneer het bestand een npm-pack-tarball is en je
    hetzelfde pad voor het beheerde npm-project per plugin wilt testen dat door registry-
    installaties wordt gebruikt, inclusief `package-lock.json`-verificatie, scanning van gehesen
    afhankelijkheden en npm-installatieregistraties. Platte archiefpaden installeren nog steeds als lokale
    archieven onder de plugin-extensieroot.

    Claude Marketplace-installaties worden ook ondersteund.

  </Accordion>
</AccordionGroup>

ClawHub-installaties gebruiken een expliciete `clawhub:<package>`-locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Kale npm-veilige pluginspecificaties installeren tijdens de launch-cutover standaard vanuit npm, tenzij ze overeenkomen met een officiële plugin-id:

```bash
openclaw plugins install openclaw-codex-app-server
```

Gebruik `npm:` om npm-only-oplossing expliciet te maken:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controleert vóór installatie de geadverteerde compatibiliteit van de plugin-API / minimale gateway. Wanneer de geselecteerde ClawHub-versie een ClawPack-artefact publiceert, downloadt OpenClaw de geversioneerde npm-pack `.tgz`, verifieert het de ClawHub-digestheader en de artefactdigest, en installeert het daarna via het normale archiefpad. Oudere ClawHub-versies zonder ClawPack-metadata installeren nog steeds via het legacy pad voor verificatie van pakketarchieven. Geregistreerde installaties bewaren hun ClawHub-bronmetadata, artefactsoort, npm-integriteit, npm-shasum, tarballnaam en ClawPack-digestfeiten voor latere updates.
Ongeversioneerde ClawHub-installaties bewaren een ongeversioneerde geregistreerde specificatie zodat `openclaw plugins update` nieuwere ClawHub-releases kan volgen; expliciete versie- of tagselectoren zoals `clawhub:pkg@1.2.3` en `clawhub:pkg@beta` blijven vastgepind op die selector.

#### Marketplace-shorthand

Gebruik de shorthand `plugin@marketplace` wanneer de Marketplacenaam bestaat in Claude's lokale registrycache op `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Gebruik `--marketplace` wanneer je de Marketplacebron expliciet wilt doorgeven:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - een Claude-bekende-Marketplace-naam uit `~/.claude/plugins/known_marketplaces.json`
    - een lokale Marketplaceroot of `marketplace.json`-pad
    - een GitHub-repositoryshorthand zoals `owner/repo`
    - een GitHub-repository-URL zoals `https://github.com/owner/repo`
    - een git-URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Voor externe Marketplaces die vanuit GitHub of git worden geladen, moeten pluginvermeldingen binnen de gekloonde Marketplace-repository blijven. OpenClaw accepteert relatieve padbronnen uit die repository en weigert HTTP(S), absolute paden, git, GitHub en andere niet-pad-pluginbronnen uit externe manifesten.
  </Tab>
</Tabs>

Voor lokale paden en archieven detecteert OpenClaw automatisch:

- native OpenClaw-plugins (`openclaw.plugin.json`)
- Codex-compatibele bundels (`.codex-plugin/plugin.json`)
- Claude-compatibele bundels (`.claude-plugin/plugin.json` of de standaard Claude-componentindeling)
- Cursor-compatibele bundels (`.cursor-plugin/plugin.json`)

Beheerde lokale installaties moeten pluginmappen of archieven zijn. Losse `.js`-,
`.mjs`-, `.cjs`- en `.ts`-pluginbestanden worden niet door `plugins install`
naar de beheerde pluginroot gekopieerd; vermeld ze in plaats daarvan expliciet in
`plugins.load.paths`.

<Note>
Compatibele bundels installeren in de normale pluginroot en nemen deel aan dezelfde list/info/enable/disable-flow. Momenteel worden bundel-Skills, Claude command-skills, Claude `settings.json`-standaardwaarden, Claude `.lsp.json` / via manifest gedeclareerde `lspServers`-standaardwaarden, Cursor command-skills en compatibele Codex-hookmappen ondersteund; andere gedetecteerde bundelcapaciteiten worden weergegeven in diagnostiek/info, maar zijn nog niet aangesloten op runtime-uitvoering.
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
  Machineleesbare inventaris plus registrydiagnostiek en installatiestatus van pakketafhankelijkheden.
</ParamField>

<Note>
`plugins list` leest eerst de blijvend opgeslagen lokale pluginregistry, met een alleen-uit-manifest-afgeleide fallback wanneer de registry ontbreekt of ongeldig is. Dit is nuttig om te controleren of een plugin is geïnstalleerd, ingeschakeld en zichtbaar is voor koude opstartplanning, maar het is geen live runtimeprobe van een al draaiend Gateway-proces. Start na het wijzigen van plugincode, inschakeling, hookbeleid of `plugins.load.paths` de Gateway opnieuw die het kanaal bedient voordat je verwacht dat nieuwe `register(api)`-code of hooks worden uitgevoerd. Verifieer bij externe/containerdeployments dat je het daadwerkelijke `openclaw gateway run`-child opnieuw start, niet alleen een wrapperproces.

`plugins list --json` bevat de `dependencyStatus` van elke plugin uit `package.json`
`dependencies` en `optionalDependencies`. OpenClaw controleert of die pakketnamen
aanwezig zijn langs het normale Node `node_modules`-opzoekpad van de plugin; het
importeert geen pluginruntimecode, voert geen package-manager uit en herstelt geen ontbrekende
afhankelijkheden.
</Note>

Als startup `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` logt,
voer dan `openclaw plugins list --enabled --verbose` uit of
`openclaw plugins inspect <id>` met een vermelde plugin-id om de plugin-
id's te bevestigen en vertrouwde id's naar `plugins.allow` in `openclaw.json` te kopiëren. Wanneer de
waarschuwing elke ontdekte plugin kan vermelden, drukt deze een klaar-om-te-plakken
`plugins.allow`-snippet af waarin die id's al zijn opgenomen. Als een plugin laadt
zonder herkomst van installatie/load-path, inspecteer dan die plugin-id en pin vervolgens ofwel
de vertrouwde id in `plugins.allow`, of installeer de plugin opnieuw vanuit een vertrouwde bron
zodat OpenClaw de installatieherkomst registreert.

`plugins search` is een externe ClawHub-cataloguszoekopdracht. Het inspecteert geen lokale
status, muteert geen configuratie, installeert geen pakketten en laadt geen pluginruntimecode. Zoek-
resultaten bevatten de ClawHub-pakketnaam, familie, kanaal, versie, samenvatting en
een installatietip zoals `openclaw plugins install clawhub:<package>`.

Voor gebundeld pluginwerk binnen een verpakte Docker-image bind-mount je de plugin-
bronmap over het overeenkomende verpakte bronpad, zoals
`/app/extensions/synology-chat`. OpenClaw ontdekt die gemounte bron-
overlay vóór `/app/dist/extensions/synology-chat`; een gewoon gekopieerde bron-
map blijft inert, zodat normale verpakte installaties nog steeds gecompileerde dist gebruiken.

Voor runtime-hookdebugging:

- `openclaw plugins inspect <id> --runtime --json` toont geregistreerde hooks en diagnostiek uit een met modules geladen inspectiepassage. Runtime-inspectie installeert nooit afhankelijkheden; gebruik `openclaw doctor --fix` om legacy afhankelijkheidsstatus op te schonen of ontbrekende downloadbare plugins te herstellen waarnaar door configuratie wordt verwezen.
- `openclaw gateway status --deep --require-rpc` bevestigt de bereikbare Gateway-URL/het profiel, service-/proceshints, configuratiepad en RPC-gezondheid.
- Niet-gebundelde conversatiehooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) vereisen `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gebruik `--link` om te voorkomen dat een lokale pluginmap wordt gekopieerd (voegt toe aan `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

Losse pluginbestanden moeten worden vermeld in `plugins.load.paths` in plaats van
geïnstalleerd met `plugins install` of rechtstreeks geplaatst in `~/.openclaw/extensions`
of `<workspace>/.openclaw/extensions`. Die automatisch ontdekte roots laden plugin-
pakket- of bundelmappen, terwijl scripts op topniveau als lokale
helpers worden behandeld en overgeslagen.

<Note>
Workspace-oorsprongplugins die vanuit een workspace-extensions-root worden ontdekt, worden niet
geïmporteerd of uitgevoerd totdat ze expliciet zijn ingeschakeld. Voer voor lokale ontwikkeling
`openclaw plugins enable <plugin-id>` uit of stel
`plugins.entries.<plugin-id>.enabled: true` in; als je configuratie
`plugins.allow` gebruikt, neem daar dezelfde plugin-id ook in op. Deze fail-closed-regel
geldt ook wanneer kanaalinstelling expliciet een workspace-oorsprongplugin target voor
alleen-instelling laden, dus lokale instelcode voor kanaalplugins wordt niet uitgevoerd zolang die
workspace-Plugin uitgeschakeld blijft of uitgesloten is van de allowlist. Gekoppelde installaties
en expliciete `plugins.load.paths`-vermeldingen volgen het normale beleid voor hun
opgeloste pluginoorsprong. Zie
[Pluginbeleid configureren](/nl/tools/plugin#configure-plugin-policy)
en [Configuratiereferentie](/nl/gateway/configuration-reference#plugins).

`--force` wordt niet ondersteund met `--link`, omdat gekoppelde installaties het bronpad hergebruiken in plaats van over een beheerd installatiedoel te kopiëren.

Gebruik `--pin` bij npm-installaties om de opgeloste exacte spec (`name@version`) in de beheerde pluginindex op te slaan terwijl het standaardgedrag ongepind blijft.
</Note>

### Pluginindex

Installatiemetadata van Plugins is machinebeheerde state, geen gebruikersconfiguratie. Installaties en updates schrijven deze naar de gedeelde SQLite-statedatabase onder de actieve OpenClaw-statedirectory. De rij `installed_plugin_index` bewaart duurzame `installRecords`-metadata, inclusief records voor kapotte of ontbrekende pluginmanifesten, plus een van het manifest afgeleide koude registry-cache die wordt gebruikt door `openclaw plugins update`, verwijderen, diagnostics en de koude pluginregistry.

Wanneer OpenClaw meegeleverde legacy `plugins.installs`-records in configuratie ziet, behandelen runtime-reads ze als compatibiliteitsinput zonder `openclaw.json` te herschrijven. Expliciete plugin-writes en `openclaw doctor --fix` verplaatsen die records naar de pluginindex en verwijderen de configuratiesleutel wanneer configuratie-writes zijn toegestaan; als een van beide writes mislukt, blijven de configuratierecords behouden zodat de installatiemetadata niet verloren gaat.

### Verwijderen

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` verwijdert pluginrecords uit `plugins.entries`, de persistente pluginindex, vermeldingen in plugin-allow/deny-lijsten en gekoppelde `plugins.load.paths`-vermeldingen waar van toepassing. Tenzij `--keep-files` is ingesteld, verwijdert uninstall ook de gevolgde beheerde installatiedirectory wanneer die zich binnen OpenClaw's plugin-extensions-root bevindt. Voor Active Memory-plugins wordt het geheugenslot teruggezet naar `memory-core`.

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

Updates zijn van toepassing op gevolgde plugininstallaties in de beheerde pluginindex en gevolgde hook-pack-installaties in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Plugin-id versus npm-spec oplossen">
    Wanneer je een plugin-id doorgeeft, hergebruikt OpenClaw de vastgelegde installatiespec voor die Plugin. Dat betekent dat eerder opgeslagen dist-tags zoals `@beta` en exact gepinde versies ook bij latere `update <id>`-runs gebruikt blijven worden.

    Die regel voor gerichte updates verschilt van het onderhoudspad voor bulkupdates `openclaw plugins update --all`. Bulkupdates respecteren nog steeds gewone gevolgde installatiespecs, maar vertrouwde officiële OpenClaw-pluginrecords kunnen synchroniseren naar het huidige officiële catalogusdoel in plaats van op een verouderd exact officieel package te blijven. Gebruik gerichte `update <id>` wanneer je bewust een exacte of getagde officiële spec ongemoeid wilt laten.

    Voor npm-installaties kun je ook een expliciete npm-packagespec doorgeven met een dist-tag of exacte versie. OpenClaw lost die packagenaam terug op naar het gevolgde pluginrecord, werkt die geïnstalleerde Plugin bij en legt de nieuwe npm-spec vast voor toekomstige id-gebaseerde updates.

    Het doorgeven van de npm-packagenaam zonder versie of tag lost ook terug op naar het gevolgde pluginrecord. Gebruik dit wanneer een Plugin aan een exacte versie was gepind en je deze terug wilt zetten naar de standaard releaselijn van de registry.

  </Accordion>
  <Accordion title="Bètakanaalupdates">
    Gerichte `openclaw plugins update <id-or-npm-spec>` hergebruikt de gevolgde pluginspec, tenzij je een nieuwe spec doorgeeft. Bulk `openclaw plugins update --all` gebruikt de geconfigureerde `update.channel` wanneer het vertrouwde officiële pluginrecords synchroniseert naar het officiële catalogusdoel, zodat bètakanaalinstallaties op de bèta-releaselijn kunnen blijven in plaats van stilzwijgend te worden genormaliseerd naar stable/latest.

    `openclaw update` kent ook het actieve OpenClaw-updatekanaal: op het bètakanaal proberen standaardlijn-npm- en ClawHub-pluginrecords eerst `@beta`. Ze vallen terug op de vastgelegde default/latest-spec als er geen plugin-bètarelease bestaat; npm-plugins vallen ook terug wanneer het bèta-package bestaat maar install-validation niet doorstaat. Die fallback wordt als waarschuwing gemeld en laat de core-update niet mislukken. Exacte versies en expliciete tags blijven voor gerichte updates gepind aan die selector.

  </Accordion>
  <Accordion title="Versiecontroles en integriteitsdrift">
    Vóór een live npm-update controleert OpenClaw de geïnstalleerde packageversie tegen de npm-registrymetadata. Als de geïnstalleerde versie en de vastgelegde artifact-identiteit al overeenkomen met het opgeloste doel, wordt de update overgeslagen zonder downloaden, opnieuw installeren of `openclaw.json` herschrijven.

    Wanneer er een opgeslagen integrity-hash bestaat en de opgehaalde artifact-hash verandert, behandelt OpenClaw dat als npm-artifactdrift. Het interactieve commando `openclaw plugins update` toont de verwachte en werkelijke hashes en vraagt om bevestiging voordat het doorgaat. Niet-interactieve updatehelpers falen gesloten tenzij de aanroeper een expliciet vervolgbeleid opgeeft.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install bij update">
    `--dangerously-force-unsafe-install` wordt ook geaccepteerd bij `plugins update` voor compatibiliteit, maar is verouderd en verandert het gedrag van pluginupdates niet meer. Operator `security.installPolicy` kan updates nog steeds blokkeren; plugin-`before_install`-hooks zijn alleen van toepassing in processen waar pluginhooks zijn geladen.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk bij update">
    Community-pluginupdates met ClawHub-backend voeren dezelfde trustcontrole voor exacte releases uit als installaties voordat het vervangende package wordt gedownload. Gebruik `--acknowledge-clawhub-risk` voor gereviewde automatisering die moet doorgaan wanneer de geselecteerde ClawHub-release een risicovolle trustwaarschuwing heeft. Officiële ClawHub-packages en gebundelde OpenClaw-pluginbronnen omzeilen deze release-trustprompt.
  </Accordion>
</AccordionGroup>

### Inspecteren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect toont identiteit, laadstatus, bron, manifest-capabilities, beleidsvlaggen, diagnostics, installatiemetadata, bundelcapabilities en eventuele gedetecteerde ondersteuning voor MCP- of LSP-servers zonder standaard de pluginruntime te importeren. JSON-uitvoer bevat de pluginmanifestcontracten, zoals `contracts.agentToolResultMiddleware` en `contracts.trustedToolPolicies`, zodat operators trusted-surface-declaraties kunnen auditen voordat ze een Plugin inschakelen of herstarten. Voeg `--runtime` toe om de pluginmodule te laden en geregistreerde hooks, tools, commando's, services, gateway-methoden en HTTP-routes op te nemen. Runtime-inspectie meldt ontbrekende pluginafhankelijkheden direct; installaties en reparaties blijven in `openclaw plugins install`, `openclaw plugins update` en `openclaw doctor --fix`.

CLI-commando's die door Plugins worden beheerd, worden meestal geïnstalleerd als root-`openclaw`-commandogroepen, maar Plugins kunnen ook geneste commando's registreren onder een core-parent zoals `openclaw nodes`. Nadat `inspect --runtime` een commando onder `cliCommands` toont, voer je het uit op het vermelde pad; een Plugin die bijvoorbeeld `demo-git` registreert, kan worden geverifieerd met `openclaw demo-git ping`.

Elke Plugin wordt geclassificeerd op basis van wat deze daadwerkelijk registreert tijdens runtime:

- **plain-capability** — één capabilitytype (bijv. een provider-only Plugin)
- **hybrid-capability** — meerdere capabilitytypen (bijv. tekst + spraak + afbeeldingen)
- **hook-only** — alleen hooks, geen capabilities of surfaces
- **non-capability** — tools/commando's/services maar geen capabilities

Zie [Pluginvormen](/nl/plugins/architecture#plugin-shapes) voor meer over het capabilitymodel.

<Note>
De vlag `--json` geeft een machineleesbaar rapport uit dat geschikt is voor scripts en audits. `inspect --all` rendert een vlootbrede tabel met shape, capabilitysoorten, compatibiliteitsmeldingen, bundelcapabilities en kolommen met hooksamenvattingen. `info` is een alias voor `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` rapporteert laadfouten van Plugins, manifest-/discovery-diagnostics, compatibiliteitsmeldingen en verouderde pluginconfiguratieverwijzingen zoals ontbrekende pluginslots. Wanneer de installatiestructuur en pluginconfiguratie schoon zijn, drukt het `No plugin issues detected.` af. Als er verouderde configuratie overblijft maar de installatiestructuur verder gezond is, zegt de samenvatting dat in plaats van volledige plugingezondheid te impliceren.

Als een geconfigureerde Plugin op schijf aanwezig is maar wordt geblokkeerd door de path-safety-controles van de loader, behoudt configvalidatie de pluginvermelding en rapporteert deze als `present but blocked`. Los de voorafgaande diagnose voor geblokkeerde Plugins op, zoals padeigendom of world-writable permissies, in plaats van de configuratie `plugins.entries.<id>` of `plugins.allow` te verwijderen.

Voor module-shape-fouten zoals ontbrekende `register`/`activate`-exports voer je opnieuw uit met `OPENCLAW_PLUGIN_LOAD_DEBUG=1` om een compacte export-shape-samenvatting in de diagnostische uitvoer op te nemen.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

De lokale pluginregistry is OpenClaw's persistente koude leesmodel voor geïnstalleerde pluginidentiteit, inschakeling, bronmetadata en eigenaarschap van bijdragen. Normale startup, provider-owner-lookup, classificatie van kanaalinstelling en plugininventaris kunnen deze lezen zonder pluginruntime-modules te importeren.

Gebruik `plugins registry` om te inspecteren of de persistente registry aanwezig, actueel of verouderd is. Gebruik `--refresh` om deze opnieuw op te bouwen vanuit de persistente pluginindex, configuratiebeleid en manifest-/packagemetadata. Dit is een reparatiepad, geen runtime-activeringspad.

`openclaw doctor --fix` repareert ook registry-aangrenzende beheerde npm-drift: als een verweesd of hersteld `@openclaw/*`-package onder een beheerd plugin-npm-project of de legacy vlakke beheerde npm-root een gebundelde Plugin overschaduwt, verwijdert doctor dat verouderde package en bouwt de registry opnieuw op zodat startup valideert tegen het gebundelde manifest. Doctor linkt ook het hostpackage `openclaw` opnieuw in beheerde npm-plugins die `peerDependencies.openclaw` declareren, zodat package-lokale runtime-imports zoals `openclaw/plugin-sdk/*` na updates of npm-reparaties oplossen.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` is een verouderde break-glass-compatibiliteitsschakelaar voor registry-leesfouten. Geef de voorkeur aan `plugins registry --refresh` of `openclaw doctor --fix`; de env-fallback is alleen bedoeld voor noodherstel van startup terwijl de migratie wordt uitgerold.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace-list accepteert een lokaal marketplacepad, een `marketplace.json`-pad, een GitHub-shorthand zoals `owner/repo`, een GitHub-repo-URL of een git-URL. `--json` drukt het opgeloste bronlabel af plus het geparseerde marketplace-manifest en de pluginvermeldingen.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [CLI-referentie](/nl/cli)
- [ClawHub](/nl/clawhub)
