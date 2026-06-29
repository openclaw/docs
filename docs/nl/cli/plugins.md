---
read_when:
    - Je wilt Gateway-plugins of compatibele bundels installeren of beheren
    - Je wilt een eenvoudige tool-Plugin scaffolden of valideren
    - U wilt fouten bij het laden van Plugins debuggen
sidebarTitle: Plugins
summary: CLI-referentie voor `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-06-28T22:33:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 528a7ead224eab330bc0a83314d205a68c7f814ad336441aee7b19170c105e43
    source_path: cli/plugins.md
    workflow: 16
---

Beheer Gateway-plugins, hookpakketten en compatibele bundels.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/nl/tools/plugin">
    Eindgebruikersgids voor het installeren, inschakelen en oplossen van problemen met plugins.
  </Card>
  <Card title="Manage plugins" href="/nl/plugins/manage-plugins">
    Korte voorbeelden voor installeren, weergeven, bijwerken, verwijderen en publiceren.
  </Card>
  <Card title="Plugin bundles" href="/nl/plugins/bundles">
    Compatibiliteitsmodel voor bundels.
  </Card>
  <Card title="Plugin manifest" href="/nl/plugins/manifest">
    Manifestvelden en configuratieschema.
  </Card>
  <Card title="Security" href="/nl/gateway/security">
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
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
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

Voer voor onderzoek naar trage installatie, inspectie, verwijdering of registerverversing de
opdracht uit met `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. De trace schrijft fasetimings
naar stderr en houdt JSON-uitvoer parseerbaar. Zie [Foutopsporing](/nl/help/debugging#plugin-lifecycle-trace).

<Note>
In Nix-modus (`OPENCLAW_NIX_MODE=1`) zijn mutaties in de pluginlevenscyclus uitgeschakeld. Gebruik de Nix-bron voor deze installatie in plaats van `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` of `plugins disable`; gebruik voor nix-openclaw de agent-first [Snelstart](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Gebundelde plugins worden met OpenClaw meegeleverd. Sommige zijn standaard ingeschakeld (bijvoorbeeld gebundelde modelproviders, gebundelde spraakproviders en de gebundelde browserplugin); andere vereisen `plugins enable`.

Native OpenClaw-plugins moeten `openclaw.plugin.json` meeleveren met een inline JSON Schema (`configSchema`, zelfs als dit leeg is). Compatibele bundels gebruiken in plaats daarvan hun eigen bundelmanifesten.

`plugins list` toont `Format: openclaw` of `Format: bundle`. Uitgebreide lijst-/info-uitvoer toont ook het bundelsubtype (`codex`, `claude` of `cursor`) plus gedetecteerde bundelmogelijkheden.
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
id voor de standaarduitvoermap en pakketnaamgeving. Tool-scaffolds gebruiken
`defineToolPlugin`.
`plugins build` importeert het gebouwde entrypoint, leest de statische toolmetadata, schrijft
`openclaw.plugin.json` en houdt `package.json` `openclaw.extensions` gelijk.
`plugins validate` controleert of het gegenereerde manifest, de pakketmetadata en
de huidige entry-export nog overeenkomen. Zie [Toolplugins](/nl/plugins/tool-plugins) voor
de volledige workflow voor het maken van tools.

De scaffold schrijft TypeScript-broncode, maar genereert metadata uit de gebouwde
`./dist/index.js`-entry, zodat de workflow ook werkt met de gepubliceerde CLI. Gebruik
`--entry <path>` wanneer de entry niet de standaardpakketentry is. Gebruik
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

Provider-scaffolds maken een generieke tekst-/modelproviderplugin met OpenAI-compatibele
API-sleutelbedrading, een ingebouwd `npm run validate`-script voor `clawhub package
validate`, ClawHub-pakketmetadata en een handmatig gestarte GitHub-workflow
voor toekomstige vertrouwde publicatie via GitHub Actions OIDC. Provider-scaffolds
genereren geen Skills en gebruiken geen `openclaw plugins build` of
`openclaw plugins validate`; die opdrachten zijn bedoeld voor het pad met
gegenereerde metadata van de tool-scaffold.

Vervang vóór publicatie de tijdelijke API-basis-URL, modelcatalogus, docs-route,
referentietekst en README-tekst door echte providergegevens. Gebruik de
gegenereerde README voor eerste publicatie op ClawHub en het instellen van een vertrouwde uitgever.

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
overschrijven met afgeschermde omgevingsvariabelen. Zie
[Overschrijvingen voor plugininstallatie](/nl/plugins/install-overrides).

<Warning>
Kale pakketnamen worden tijdens de launch-cutover standaard vanaf npm geïnstalleerd, tenzij ze overeenkomen met een officiële plugin-id. Ruwe `@openclaw/*`-pakketspecificaties die overeenkomen met gebundelde plugins gebruiken de gebundelde kopie die met de huidige OpenClaw-build is meegeleverd. Gebruik `npm:<package>` wanneer je bewust een extern npm-pakket wilt gebruiken. Gebruik `clawhub:<package>` voor ClawHub. Behandel plugininstallaties alsof je code uitvoert. Geef de voorkeur aan vastgepinde versies.
</Warning>

`plugins search` doorzoekt ClawHub op installeerbare pluginpakketten en drukt
installatieklare pakketnamen af. Het zoekt code-plugin- en bundel-plugin-pakketten,
geen Skills. Gebruik `openclaw skills search` voor ClawHub Skills.

<Note>
ClawHub is het primaire distributie- en ontdekkingsoppervlak voor de meeste plugins. Npm
blijft een ondersteunde fallback en direct-installatiepad. OpenClaw-eigen
`@openclaw/*`-pluginpakketten worden weer op npm gepubliceerd; zie de huidige lijst
op [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) of de
[plugininventaris](/nl/plugins/plugin-inventory). Stabiele installaties gebruiken `latest`.
Installaties en updates via het bètakanaal geven de voorkeur aan de npm-`beta`-dist-tag wanneer die tag
beschikbaar is, en vallen daarna terug op `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Als je `plugins`-sectie wordt ondersteund door een `$include` met één bestand, schrijven `plugins install/update/enable/disable/uninstall` door naar dat opgenomen bestand en laten ze `openclaw.json` ongemoeid. Root-includes, include-arrays en includes met sibling-overschrijvingen falen gesloten in plaats van te flattenen. Zie [Configuratie-includes](/nl/gateway/configuration) voor de ondersteunde vormen.

    Als configuratie tijdens installatie ongeldig is, faalt `plugins install` normaal gesproken gesloten en meldt het dat je eerst `openclaw doctor --fix` moet uitvoeren. Tijdens Gateway-start en hot-reload faalt ongeldige pluginconfiguratie gesloten zoals elke andere ongeldige configuratie; `openclaw doctor --fix` kan de ongeldige pluginvermelding in quarantaine plaatsen. De enige gedocumenteerde uitzondering tijdens installatie is een smal herstelpad voor gebundelde plugins voor plugins die expliciet kiezen voor `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` hergebruikt het bestaande installatiedoel en overschrijft een al geïnstalleerde plugin of hookpakket ter plaatse. Gebruik het wanneer je bewust dezelfde id opnieuw installeert vanuit een nieuw lokaal pad, archief, ClawHub-pakket of npm-artefact. Geef voor routinematige upgrades van een al gevolgde npm-plugin de voorkeur aan `openclaw plugins update <id-or-npm-spec>`.

    Als je `plugins install` uitvoert voor een plugin-id die al is geïnstalleerd, stopt OpenClaw en verwijst het je naar `plugins update <id-or-npm-spec>` voor een normale upgrade, of naar `plugins install <package> --force` wanneer je de huidige installatie echt vanuit een andere bron wilt overschrijven.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` is alleen van toepassing op npm-installaties. Het wordt niet ondersteund met `git:`-installaties; gebruik een expliciete git-ref zoals `git:github.com/acme/plugin@v1.2.3` wanneer je een vastgepinde bron wilt. Het wordt niet ondersteund met `--marketplace`, omdat marketplace-installaties marketplace-bronmetadata bewaren in plaats van een npm-specificatie.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` is verouderd en is nu een no-op. OpenClaw voert geen ingebouwde blokkering van gevaarlijke code tijdens installatie meer uit voor plugininstallaties.

    Gebruik het gedeelde, door de operator beheerde `security.installPolicy`-oppervlak wanneer hostspecifiek installatiebeleid vereist is. Plugin-`before_install`-hooks zijn levenscyclushooks van de pluginruntime en zijn niet de primaire beleidsgrens voor CLI-installaties.

    Als een plugin die je op ClawHub hebt gepubliceerd verborgen of geblokkeerd is door een registerscan, gebruik dan de uitgeverstappen in [ClawHub publiceren](/nl/clawhub/publishing). `--dangerously-force-unsafe-install` vraagt ClawHub niet om de plugin opnieuw te scannen of een geblokkeerde release openbaar te maken.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Community-installaties van ClawHub controleren de vertrouwensrecord van de geselecteerde release voordat het pakket wordt gedownload. Als ClawHub downloaden voor de release uitschakelt, kwaadaardige scanbevindingen meldt of de release in een blokkerende moderatiestatus zoals quarantaine plaatst, weigert OpenClaw de release. Bij niet-blokkerende risicovolle scanstatussen, risicovolle moderatiestatussen of registerredenen toont OpenClaw de vertrouwensdetails en vraagt het om bevestiging voordat het doorgaat.

    Gebruik `--acknowledge-clawhub-risk` alleen nadat je de ClawHub-waarschuwing hebt bekeken en hebt besloten door te gaan zonder interactieve prompt. Wachtende of verouderde schone vertrouwensrecords waarschuwen, maar vereisen geen bevestiging. Officiële ClawHub-pakketten en gebundelde OpenClaw-pluginbronnen slaan deze prompt voor releasevertrouwen over.

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` is ook het installatieoppervlak voor hookpakketten die `openclaw.hooks` in `package.json` beschikbaar maken. Gebruik `openclaw hooks` voor gefilterde zichtbaarheid van hooks en inschakeling per hook, niet voor pakketinstallatie.

    Npm-specificaties zijn **alleen registry** (pakketnaam + optionele **exacte versie** of **dist-tag**). Git/URL/file-specificaties en semver-bereiken worden geweigerd. Dependency-installaties draaien in één beheerd npm-project per plugin met `--ignore-scripts` voor veiligheid, zelfs wanneer je shell globale npm-installatie-instellingen heeft. Beheerde plugin-npm-projecten erven OpenClaw's npm-`overrides` op pakketniveau, zodat host-beveiligingspins ook van toepassing zijn op gehoste plugin-dependencies.

    Gebruik `npm:<package>` wanneer je npm-resolutie expliciet wilt maken. Kale pakketspecificaties installeren tijdens de launch-cutover ook rechtstreeks vanuit npm, tenzij ze overeenkomen met een officiële plugin-id.

    Ruwe `@openclaw/*`-pakketspecificaties die overeenkomen met gebundelde plugins worden vóór npm-fallback naar de image-eigen gebundelde kopie opgelost. Bijvoorbeeld: `openclaw plugins install @openclaw/discord@2026.5.20 --pin` gebruikt de gebundelde Discord-plugin uit de huidige OpenClaw-build in plaats van een beheerde npm-override te maken. Gebruik `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` om het externe npm-pakket af te dwingen.

    Kale specificaties en `@latest` blijven op het stable-track. OpenClaw-correctieversies met datumstempel, zoals `2026.5.3-1`, zijn stable releases voor deze controle. Als npm een van beide naar een prerelease oplost, stopt OpenClaw en vraagt het je expliciet in te stemmen met een prerelease-tag zoals `@beta`/`@rc` of een exacte prerelease-versie zoals `@1.2.3-beta.4`.

    Voor npm-installaties zonder exacte versie (`npm:<package>` of `npm:<package>@latest`) controleert OpenClaw de opgeloste pakketmetadata vóór installatie. Als het nieuwste stabiele pakket een nieuwere OpenClaw-plugin-API of minimale hostversie vereist, inspecteert OpenClaw oudere stabiele versies en installeert in plaats daarvan de nieuwste compatibele release. Exacte versies en expliciete dist-tags zoals `@beta` blijven strikt: als het geselecteerde pakket incompatibel is, mislukt de opdracht en vraagt deze je OpenClaw te upgraden of een compatibele versie te kiezen.

    Als een kale installatiespecificatie overeenkomt met een officiële plugin-id (bijvoorbeeld `diffs`), installeert OpenClaw de catalogusvermelding rechtstreeks. Gebruik een expliciete scoped specificatie (bijvoorbeeld `@scope/diffs`) om een npm-pakket met dezelfde naam te installeren.

  </Accordion>
  <Accordion title="Git repositories">
    Gebruik `git:<repo>` om rechtstreeks vanuit een git-repository te installeren. Ondersteunde vormen zijn onder andere `git:github.com/owner/repo`, `git:owner/repo`, volledige `https://`-, `ssh://`-, `git://`-, `file://`- en `git@host:owner/repo.git`-clone-URL's. Voeg `@<ref>` of `#<ref>` toe om een branch, tag of commit uit te checken vóór installatie.

    Git-installaties clonen naar een tijdelijke directory, checken de gevraagde ref uit wanneer aanwezig, en gebruiken daarna de normale plugin-directory-installer. Dat betekent dat manifestvalidatie, operator-installatiebeleid, package-manager-installatiewerk en installatierecords zich gedragen zoals bij npm-installaties. Vastgelegde git-installaties bevatten de bron-URL/ref plus de opgeloste commit, zodat `openclaw plugins update` de bron later opnieuw kan oplossen.

    Gebruik na installatie vanuit git `openclaw plugins inspect <id> --runtime --json` om runtimeregistraties zoals gateway-methoden en CLI-opdrachten te verifiëren. Als de plugin een CLI-root heeft geregistreerd met `api.registerCli`, voer je die opdracht rechtstreeks uit via de OpenClaw-root-CLI, bijvoorbeeld `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Ondersteunde archieven: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-pluginarchieven moeten een geldige `openclaw.plugin.json` bevatten in de uitgepakte plugin-root; archieven die alleen `package.json` bevatten, worden geweigerd voordat OpenClaw installatierecords schrijft.

    Gebruik `npm-pack:<path.tgz>` wanneer het bestand een npm-pack-tarball is en je
    hetzelfde per-plugin beheerde npm-projectpad wilt testen dat door registry-
    installaties wordt gebruikt, inclusief `package-lock.json`-verificatie,
    scanning van gehoste dependencies en npm-installatierecords. Platte
    archiefpaden installeren nog steeds als lokale archieven onder de root voor
    plugin-extensies.

    Claude-marketplace-installaties worden ook ondersteund.

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

Gebruik `npm:` om alleen-npm-resolutie expliciet te maken:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controleert de geadverteerde plugin-API / minimale Gateway-compatibiliteit vóór installatie. Wanneer de geselecteerde ClawHub-versie een ClawPack-artefact publiceert, downloadt OpenClaw de versiegebonden npm-pack `.tgz`, verifieert het de ClawHub-digest-header en de artefact-digest, en installeert het vervolgens via het normale archiefpad. Oudere ClawHub-versies zonder ClawPack-metadata installeren nog steeds via het legacy-verificatiepad voor pakketarchieven. Vastgelegde installaties bewaren hun ClawHub-bronmetadata, artefactsoort, npm-integriteit, npm-shasum, tarballnaam en ClawPack-digestfeiten voor latere updates.
Ongeversioneerde ClawHub-installaties bewaren een ongeversioneerde vastgelegde specificatie, zodat `openclaw plugins update` nieuwere ClawHub-releases kan volgen; expliciete versie- of tagselectors zoals `clawhub:pkg@1.2.3` en `clawhub:pkg@beta` blijven aan die selector gepind.

#### Marketplace-stenografie

Gebruik `plugin@marketplace`-stenografie wanneer de marketplacenaam bestaat in Claude's lokale registry-cache op `~/.claude/plugins/known_marketplaces.json`:

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
    - een bekende Claude-marketplacenaam uit `~/.claude/plugins/known_marketplaces.json`
    - een lokale marketplace-root of `marketplace.json`-pad
    - een GitHub-repository-stenografie zoals `owner/repo`
    - een GitHub-repository-URL zoals `https://github.com/owner/repo`
    - een git-URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Voor externe marketplaces die vanuit GitHub of git worden geladen, moeten pluginvermeldingen binnen de gekloonde marketplace-repository blijven. OpenClaw accepteert relatieve padbronnen uit die repository en weigert HTTP(S)-, absolute-pad-, git-, GitHub- en andere niet-pad-pluginbronnen uit externe manifesten.
  </Tab>
</Tabs>

Voor lokale paden en archieven detecteert OpenClaw automatisch:

- native OpenClaw-plugins (`openclaw.plugin.json`)
- Codex-compatibele bundels (`.codex-plugin/plugin.json`)
- Claude-compatibele bundels (`.claude-plugin/plugin.json` of de standaard Claude-componentindeling)
- Cursor-compatibele bundels (`.cursor-plugin/plugin.json`)

Beheerde lokale installaties moeten plugin-directories of archieven zijn. Zelfstandige `.js`-,
`.mjs`-, `.cjs`- en `.ts`-pluginbestanden worden door `plugins install` niet naar de
beheerde plugin-root gekopieerd; vermeld ze in plaats daarvan expliciet in
`plugins.load.paths`.

<Note>
Compatibele bundels installeren in de normale plugin-root en nemen deel aan dezelfde lijst/info/inschakelen/uitschakelen-flow. Momenteel worden bundel-Skills, Claude command-Skills, Claude `settings.json`-standaarden, Claude `.lsp.json` / door manifest gedeclareerde `lspServers`-standaarden, Cursor command-Skills en compatibele Codex-hook-directories ondersteund; andere gedetecteerde bundelcapaciteiten worden weergegeven in diagnostics/info, maar zijn nog niet verbonden met runtime-uitvoering.
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
  Schakel over van de tabelweergave naar detailregels per plugin met metadata over bron/oorsprong/versie/activatie.
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare inventaris plus registry-diagnostics en installatiestatus van pakketdependencies.
</ParamField>

<Note>
`plugins list` leest eerst de persistente lokale plugin-registry, met een alleen-manifest-afgeleide fallback wanneer de registry ontbreekt of ongeldig is. Dit is nuttig om te controleren of een plugin geïnstalleerd, ingeschakeld en zichtbaar is voor planning van koude startup, maar het is geen live runtime-probe van een al draaiend Gateway-proces. Start na het wijzigen van plugin-code, inschakeling, hookbeleid of `plugins.load.paths` de Gateway opnieuw die het kanaal bedient voordat je verwacht dat nieuwe `register(api)`-code of hooks worden uitgevoerd. Verifieer bij externe/container-deployments dat je het daadwerkelijke `openclaw gateway run`-child opnieuw start, niet alleen een wrapperproces.

`plugins list --json` bevat de `dependencyStatus` van elke plugin uit `package.json`
`dependencies` en `optionalDependencies`. OpenClaw controleert of die pakketnamen
aanwezig zijn langs het normale Node-`node_modules`-lookup-pad van de plugin; het
importeert geen plugin-runtimecode, voert geen package manager uit en repareert
ontbrekende dependencies niet.
</Note>

Als startup `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` logt,
voer dan `openclaw plugins list --enabled --verbose` uit of
`openclaw plugins inspect <id>` met een vermelde plugin-id om de plugin-
id's te bevestigen en vertrouwde id's naar `plugins.allow` in `openclaw.json` te kopiëren. Wanneer de
waarschuwing elke ontdekte plugin kan vermelden, print deze een kant-en-klare
`plugins.allow`-snippet die die id's al bevat. Als een plugin laadt
zonder install/load-path-herkomst, inspecteer dan die plugin-id en pin vervolgens
de vertrouwde id in `plugins.allow` of installeer de plugin opnieuw vanuit een vertrouwde bron
zodat OpenClaw installatieherkomst vastlegt.

`plugins search` is een externe ClawHub-cataloguslookup. Het inspecteert geen lokale
state, muteert geen config, installeert geen pakketten en laadt geen plugin-runtimecode. Zoekresultaten
bevatten de ClawHub-pakketnaam, familie, kanaal, versie, samenvatting en
een installatiehint zoals `openclaw plugins install clawhub:<package>`.

Voor gebundeld pluginwerk binnen een verpakte Docker-image, bind-mount je de plugin-
brondirectory over het overeenkomende verpakte bronpad, zoals
`/app/extensions/synology-chat`. OpenClaw ontdekt die gemounte bron-
overlay vóór `/app/dist/extensions/synology-chat`; een gewoon gekopieerde bron-
directory blijft inert, zodat normale verpakte installaties nog steeds gecompileerde dist gebruiken.

Voor debugging van runtime-hooks:

- `openclaw plugins inspect <id> --runtime --json` toont geregistreerde hooks en diagnostics uit een module-geladen inspectiepass. Runtime-inspectie installeert nooit dependencies; gebruik `openclaw doctor --fix` om legacy-dependencystate op te schonen of ontbrekende downloadbare plugins te herstellen waarnaar config verwijst.
- `openclaw gateway status --deep --require-rpc` bevestigt de bereikbare Gateway-URL/het profiel, service/proces-hints, configpad en RPC-gezondheid.
- Niet-gebundelde conversatiehooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) vereisen `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Gebruik `--link` om het kopiëren van een lokale plugin-directory te vermijden (voegt toe aan `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

Zelfstandige pluginbestanden moeten worden vermeld in `plugins.load.paths` in plaats van
geïnstalleerd met `plugins install` of rechtstreeks geplaatst in `~/.openclaw/extensions`
of `<workspace>/.openclaw/extensions`. Die automatisch ontdekte roots laden plugin-
pakket- of bundeldirectories, terwijl top-level scriptbestanden worden behandeld als lokale
helpers en overgeslagen.

<Note>
Plugins met workspace-oorsprong die vanuit een workspace-extensiesroot worden ontdekt, worden niet
geïmporteerd of uitgevoerd totdat ze expliciet zijn ingeschakeld. Voer voor lokale ontwikkeling
`openclaw plugins enable <plugin-id>` uit of stel
`plugins.entries.<plugin-id>.enabled: true` in; als je configuratie
`plugins.allow` gebruikt, neem daar dan ook dezelfde plugin-id in op. Deze fail-closed-regel
geldt ook wanneer kanaalsetup expliciet is gericht op een Plugin met workspace-oorsprong voor
alleen-setup laden, zodat lokale setupcode voor kanaalplugins niet wordt uitgevoerd zolang die
workspace-Plugin uitgeschakeld blijft of van de allowlist is uitgesloten. Gekoppelde installaties
en expliciete `plugins.load.paths`-items volgen het normale beleid voor hun
opgeloste Plugin-oorsprong. Zie
[Pluginbeleid configureren](/nl/tools/plugin#configure-plugin-policy)
en [Configuratiereferentie](/nl/gateway/configuration-reference#plugins).

`--force` wordt niet ondersteund met `--link`, omdat gekoppelde installaties het bronpad hergebruiken in plaats van over een beheerd installatiedoel heen te kopiëren.

Gebruik `--pin` bij npm-installaties om de opgeloste exacte specificatie (`name@version`) op te slaan in de beheerde Plugin-index, terwijl het standaardgedrag ongepind blijft.
</Note>

### Plugin-index

Installatiemetadata van Plugins is door machines beheerde staat, geen gebruikersconfiguratie. Installaties en updates schrijven deze naar de gedeelde SQLite-statusdatabase onder de actieve OpenClaw-statusmap. De rij `installed_plugin_index` bewaart duurzame `installRecords`-metadata, inclusief records voor kapotte of ontbrekende Plugin-manifests, plus een uit het manifest afgeleide koude registry-cache die wordt gebruikt door `openclaw plugins update`, verwijderen, diagnostiek en de koude Plugin-registry.

Wanneer OpenClaw meegeleverde legacy `plugins.installs`-records in configuratie ziet, behandelt runtime-lezen ze als compatibiliteitsinvoer zonder `openclaw.json` te herschrijven. Expliciete Plugin-schrijfacties en `openclaw doctor --fix` verplaatsen die records naar de Plugin-index en verwijderen de configuratiesleutel wanneer configuratieschrijfacties zijn toegestaan; als een van beide schrijfacties mislukt, blijven de configuratierecords behouden zodat de installatiemetadata niet verloren gaat.

### Verwijderen

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` verwijdert Plugin-records uit `plugins.entries`, de opgeslagen Plugin-index, allow/deny-lijstitems voor Plugins en gekoppelde `plugins.load.paths`-items wanneer van toepassing. Tenzij `--keep-files` is ingesteld, verwijdert verwijderen ook de bijgehouden beheerde installatiemap wanneer die zich binnen OpenClaw's Plugin-extensiesroot bevindt. Voor Active Memory-Plugins wordt het geheugenslot gereset naar `memory-core`.

<Note>
`--keep-config` wordt ondersteund als verouderde alias voor `--keep-files`.
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

Updates zijn van toepassing op bijgehouden Plugin-installaties in de beheerde Plugin-index en bijgehouden hook-pack-installaties in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Plugin-id versus npm-specificatie oplossen">
    Wanneer je een Plugin-id doorgeeft, hergebruikt OpenClaw de vastgelegde installatiespecificatie voor die Plugin. Dat betekent dat eerder opgeslagen dist-tags zoals `@beta` en exact gepinde versies ook bij latere `update <id>`-uitvoeringen worden gebruikt.

    Tijdens `update <id> --dry-run` blijven exact gepinde npm-installaties gepind. Als OpenClaw ook de standaardlijn van de package-registry kan oplossen en die standaardlijn nieuwer is dan de geïnstalleerde gepinde versie, rapporteert de dry run de pin en drukt de expliciete `@latest` package-updateopdracht af om de standaardlijn van de registry te volgen.

    Die regel voor gerichte updates verschilt van het onderhoudspad voor bulkupdates `openclaw plugins update --all`. Bulkupdates respecteren nog steeds gewone bijgehouden installatiespecificaties, maar vertrouwde officiële OpenClaw Plugin-records kunnen synchroniseren naar het huidige officiële catalogusdoel in plaats van op een verouderde exacte officiële package te blijven. Gebruik gerichte `update <id>` wanneer je bewust een exacte of getagde officiële specificatie ongemoeid wilt laten.

    Voor npm-installaties kun je ook een expliciete npm-packagespecificatie met een dist-tag of exacte versie doorgeven. OpenClaw herleidt die packagenaam naar het bijgehouden Plugin-record, werkt die geïnstalleerde Plugin bij en legt de nieuwe npm-specificatie vast voor toekomstige id-gebaseerde updates.

    Het doorgeven van de npm-packagenaam zonder versie of tag wordt ook herleid naar het bijgehouden Plugin-record. Gebruik dit wanneer een Plugin op een exacte versie was gepind en je deze terug wilt zetten naar de standaardreleaselijn van de registry.

  </Accordion>
  <Accordion title="Updates voor het bètakanaal">
    Gerichte `openclaw plugins update <id-or-npm-spec>` hergebruikt de bijgehouden Plugin-specificatie, tenzij je een nieuwe specificatie doorgeeft. Bulk `openclaw plugins update --all` gebruikt de geconfigureerde `update.channel` wanneer vertrouwde officiële Plugin-records naar het officiële catalogusdoel worden gesynchroniseerd, zodat installaties op het bètakanaal op de bètareleaselijn kunnen blijven in plaats van stilzwijgend naar stable/latest te worden genormaliseerd.

    `openclaw update` kent ook het actieve OpenClaw-updatekanaal: op het bètakanaal proberen npm- en ClawHub-Plugin-records op de standaardlijn eerst `@beta`. Ze vallen terug op de vastgelegde default/latest-specificatie als er geen Plugin-bètarelease bestaat; npm-Plugins vallen ook terug wanneer de bètapackage wel bestaat maar installatievalidatie mislukt. Die fallback wordt als waarschuwing gerapporteerd en laat de kernupdate niet mislukken. Exacte versies en expliciete tags blijven voor gerichte updates gepind op die selector.

  </Accordion>
  <Accordion title="Versiecontroles en integriteitsafwijking">
    Vóór een live npm-update controleert OpenClaw de geïnstalleerde packageversie tegen de npm-registrymetadata. Als de geïnstalleerde versie en vastgelegde artefactidentiteit al overeenkomen met het opgeloste doel, wordt de update overgeslagen zonder downloaden, opnieuw installeren of `openclaw.json` herschrijven.

    Wanneer een opgeslagen integriteitshash bestaat en de opgehaalde artefacthash verandert, behandelt OpenClaw dat als npm-artefactafwijking. De interactieve opdracht `openclaw plugins update` drukt de verwachte en daadwerkelijke hashes af en vraagt om bevestiging voordat wordt doorgegaan. Niet-interactieve updatehelpers falen fail-closed tenzij de aanroeper een expliciet voortzettingsbeleid opgeeft.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install bij update">
    `--dangerously-force-unsafe-install` wordt ook geaccepteerd bij `plugins update` voor compatibiliteit, maar is verouderd en verandert het Plugin-updategedrag niet meer. Operator `security.installPolicy` kan updates nog steeds blokkeren; Plugin-`before_install`-hooks zijn alleen van toepassing in processen waar Plugin-hooks zijn geladen.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk bij update">
    Community Plugin-updates die door ClawHub worden ondersteund, voeren vóór het downloaden van de vervangende package dezelfde vertrouwenscontrole voor exacte releases uit als installaties. Gebruik `--acknowledge-clawhub-risk` voor beoordeelde automatisering die moet doorgaan wanneer de geselecteerde ClawHub-release een risicovolle vertrouwenswaarschuwing heeft. Officiële ClawHub-packages en gebundelde OpenClaw Plugin-bronnen omzeilen deze release-vertrouwensprompt.
  </Accordion>
</AccordionGroup>

### Inspecteren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect toont identiteit, laadstatus, bron, manifestmogelijkheden, beleidsvlaggen, diagnostiek, installatiemetadata, bundelmogelijkheden en eventueel gedetecteerde MCP- of LSP-serverondersteuning zonder standaard de Plugin-runtime te importeren. JSON-uitvoer bevat de Plugin-manifestcontracten, zoals `contracts.agentToolResultMiddleware` en `contracts.trustedToolPolicies`, zodat operators verklaringen over vertrouwde oppervlakken kunnen auditen voordat ze een Plugin inschakelen of herstarten. Voeg `--runtime` toe om de Plugin-module te laden en geregistreerde hooks, tools, opdrachten, services, Gateway-methoden en HTTP-routes op te nemen. Runtime-inspectie rapporteert ontbrekende Plugin-afhankelijkheden rechtstreeks; installaties en reparaties blijven in `openclaw plugins install`, `openclaw plugins update` en `openclaw doctor --fix`.

CLI-opdrachten die eigendom zijn van een Plugin worden meestal geïnstalleerd als root-`openclaw`-opdrachtgroepen, maar Plugins kunnen ook geneste opdrachten registreren onder een kernouder zoals `openclaw nodes`. Nadat `inspect --runtime` een opdracht onder `cliCommands` toont, voer je die uit op het vermelde pad; een Plugin die bijvoorbeeld `demo-git` registreert, kan worden geverifieerd met `openclaw demo-git ping`.

Elke Plugin wordt geclassificeerd op basis van wat die daadwerkelijk bij runtime registreert:

- **plain-capability** — één mogelijkheidstype (bijv. een Plugin die alleen provider is)
- **hybrid-capability** — meerdere mogelijkheidstypen (bijv. tekst + spraak + afbeeldingen)
- **hook-only** — alleen hooks, geen mogelijkheden of oppervlakken
- **non-capability** — tools/opdrachten/services maar geen mogelijkheden

Zie [Plugin-vormen](/nl/plugins/architecture#plugin-shapes) voor meer over het mogelijkhedenmodel.

<Note>
De vlag `--json` geeft een machineleesbaar rapport uit dat geschikt is voor scripts en auditing. `inspect --all` rendert een vlootbrede tabel met kolommen voor vorm, mogelijkheidstypen, compatibiliteitsmeldingen, bundelmogelijkheden en hooksamenvatting. `info` is een alias voor `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` rapporteert Plugin-laadfouten, manifest-/discovery-diagnostiek, compatibiliteitsmeldingen en verouderde Plugin-configuratieverwijzingen zoals ontbrekende Plugin-slots. Wanneer de installatieboom en Plugin-configuratie schoon zijn, drukt het `No plugin issues detected.` af. Als verouderde configuratie overblijft maar de installatieboom verder gezond is, zegt de samenvatting dat in plaats van volledige Plugin-gezondheid te impliceren.

Als een geconfigureerde Plugin op schijf aanwezig is maar door de padveiligheidscontroles van de loader wordt geblokkeerd, houdt configuratievalidatie het Plugin-item vast en rapporteert het als `present but blocked`. Los de voorafgaande diagnostiek voor de geblokkeerde Plugin op, zoals padeigenaarschap of world-writable permissies, in plaats van de configuratie `plugins.entries.<id>` of `plugins.allow` te verwijderen.

Voor modulevormfouten zoals ontbrekende `register`/`activate`-exports, voer opnieuw uit met `OPENCLAW_PLUGIN_LOAD_DEBUG=1` om een compacte exports-vormsamenvatting in de diagnostische uitvoer op te nemen.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

De lokale Plugin-registry is OpenClaw's opgeslagen koude leesmodel voor geïnstalleerde Plugin-identiteit, inschakeling, bronmetadata en eigenaarschap van bijdragen. Normale startup, provider-eigenaaropzoeking, kanaalsetupclassificatie en Plugin-inventaris kunnen deze lezen zonder Plugin-runtimemodules te importeren.

Gebruik `plugins registry` om te inspecteren of de opgeslagen registry aanwezig, actueel of verouderd is. Gebruik `--refresh` om deze opnieuw op te bouwen uit de opgeslagen Plugin-index, configuratiebeleid en manifest-/packagemetadata. Dit is een reparatiepad, geen runtime-activatiepad.

`openclaw doctor --fix` repareert ook registry-aangrenzende beheerde npm-afwijking: als een verweesde of herstelde `@openclaw/*`-package onder een beheerd Plugin-npm-project of de legacy vlakke beheerde npm-root een gebundelde Plugin overschaduwt, verwijdert doctor die verouderde package en bouwt de registry opnieuw op zodat startup tegen het gebundelde manifest valideert. Doctor koppelt ook de hostpackage `openclaw` opnieuw in beheerde npm-Plugins die `peerDependencies.openclaw` declareren, zodat package-lokale runtime-imports zoals `openclaw/plugin-sdk/*` na updates of npm-reparaties worden opgelost.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` is een verouderde break-glass-compatibiliteitsschakelaar voor leesfouten in de registry. Geef de voorkeur aan `plugins registry --refresh` of `openclaw doctor --fix`; de env-fallback is alleen bedoeld voor noodherstel van startup terwijl de migratie wordt uitgerold.
</Warning>

### Marketplace

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

`plugins marketplace entries` geeft vermeldingen weer uit de geconfigureerde OpenClaw-marketplacefeed. Standaard probeert het de gehoste feed en valt het terug op de laatst geaccepteerde snapshot of gebundelde gegevens. Gebruik `--feed-profile <name>` om een specifiek geconfigureerd profiel te lezen, `--feed-url <url>` om een expliciete URL van een gehoste feed te lezen, en `--offline` om de laatst geaccepteerde snapshot te lezen zonder de feed op te halen.

`plugins marketplace refresh` vernieuwt de geconfigureerde snapshot van de gehoste feed en meldt of OpenClaw gehoste gegevens, een gehoste snapshot of gebundelde fallbackgegevens heeft geaccepteerd. Gebruik `--expected-sha256` wanneer een aanroeper wil dat de opdracht mislukt tenzij een nieuwe gehoste payload overeenkomt met een vastgelegde checksum.

Marketplace `list` accepteert een lokaal marketplacepad, een pad naar `marketplace.json`, een GitHub-verkorting zoals `owner/repo`, een GitHub-repo-URL of een git-URL. `--json` drukt het opgeloste bronlabel af plus het geparste marketplacemanifest en de Plugin-vermeldingen.

Marketplace refresh laadt een gehoste OpenClaw-marketplacefeed en bewaart de
gevalideerde respons als de lokale snapshot van de gehoste feed. Zonder opties gebruikt het
het geconfigureerde standaardfeedprofiel. Gebruik `--feed-profile <name>` om een
specifiek geconfigureerd profiel te vernieuwen, `--feed-url <url>` om een expliciete URL van een gehoste
feed te vernieuwen, `--expected-sha256 <sha256>` om een overeenkomende payloadchecksum te vereisen
(`sha256:<hex>` of een kale hex-digest van 64 tekens), en `--json` voor
machineleesbare uitvoer. Expliciete URL's van gehoste feeds mogen geen
referenties, queryreeksen of fragmenten bevatten. Niet-vastgelegde vernieuwingen kunnen een
gehoste snapshot of gebundeld fallbackresultaat melden zonder dat de opdracht mislukt. Vastgelegde
vernieuwingen mislukken tenzij ze een nieuwe gehoste payload accepteren, en geslaagde gehoste
vernieuwingen mislukken als OpenClaw de gevalideerde snapshot niet kan bewaren.

## Gerelateerd

- [Plugins bouwen](/nl/plugins/building-plugins)
- [CLI-referentie](/nl/cli)
- [ClawHub](/nl/clawhub)
