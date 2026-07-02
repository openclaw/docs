---
read_when:
    - De ClawHub-CLI gebruiken
    - Installatie, update of publicatie debuggen
summary: 'CLI-referentie: opdrachten, vlaggen, configuratie en lockfile-gedrag.'
x-i18n:
    generated_at: "2026-07-02T17:40:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 57fee67174cf491721e8479a48a11b66e23260ce4899d2ee5437add05880748e
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI-pakket: `clawhub`, binair bestand: `clawhub`.

Installeer het globaal met npm of pnpm:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Verifieer het daarna:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Globale vlaggen

- `--workdir <dir>`: werkmap (standaard: cwd; valt terug op Clawdbot-werkruimte indien geconfigureerd)
- `--dir <dir>`: installatiemap onder de werkmap (standaard: `skills`)
- `--site <url>`: basis-URL voor browserlogin (standaard: `https://clawhub.ai`)
- `--registry <url>`: API-basis-URL (standaard: ontdekt, anders `https://clawhub.ai`)
- `--no-input`: prompts uitschakelen

Equivalenten voor omgevingsvariabelen:

- `CLAWHUB_SITE` (verouderd `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (verouderd `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (verouderd `CLAWDHUB_WORKDIR`)

### HTTP-proxy

De CLI respecteert standaard HTTP-proxy-omgevingsvariabelen voor systemen achter
bedrijfsproxy's of beperkte netwerken:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Wanneer een van deze variabelen is ingesteld, routeert de CLI uitgaande aanvragen via
de opgegeven proxy. `HTTPS_PROXY` wordt gebruikt voor HTTPS-aanvragen, `HTTP_PROXY`
voor gewone HTTP. `NO_PROXY` / `no_proxy` wordt gerespecteerd om de proxy te omzeilen voor
specifieke hosts of domeinen.

Dit is vereist op systemen waar directe uitgaande verbindingen worden geblokkeerd
(bijv. Docker-containers, Hetzner VPS met alleen proxy-internet, bedrijfsfirewalls).

Voorbeeld:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Wanneer er geen proxyvariabele is ingesteld, blijft het gedrag ongewijzigd (directe verbindingen).

## Configuratiebestand

Slaat je API-token en gecachte registry-URL op.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` of `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Verouderde fallback: als `clawhub/config.json` nog niet bestaat maar `clawdhub/config.json` wel, hergebruikt de CLI het verouderde pad
- overschrijven: `CLAWHUB_CONFIG_PATH` (verouderd `CLAWDHUB_CONFIG_PATH`)

## Opdrachten

### `login` / `auth login`

- Standaard: opent de browser naar `<site>/cli/auth` en voltooit via een loopback-callback.
- Headless: `clawhub login --token clh_...`
- Remote/headless interactief: `clawhub login --device` drukt een code af en wacht terwijl je deze autoriseert op `<site>/cli/device`.

### `whoami`

- Verifieert het opgeslagen token via `/api/v1/whoami`.

### `token`

- Drukt het opgeslagen API-token af naar stdout.
- Nuttig om een lokaal logintoken door te geven aan CI-opdrachten voor secretconfiguratie.

### `star <skill>` / `unstar <skill>`

- Voegt een vaardigheid toe aan je highlights of verwijdert die daaruit.
- Roept `POST /api/v1/stars/<slug>` en `DELETE /api/v1/stars/<slug>` aan.
- `--yes` slaat bevestiging over.

### `search <query...>`

- Roept `/api/v1/search?q=...` aan.
- Uitvoer bevat de slug van de vaardigheid, eigenaarshandle, weergavenaam en relevantiescore.
- Zoeken geeft voorkeur aan exacte tokenmatches voor slug/naam boven downloadpopulariteit. Een zelfstandige slug-token zoals `map` matcht sterker met `personal-map` dan met de substring binnen `amap`.
- Populariteit is een kleine rangschikkingsprior, geen garantie op hoogste plaatsing.
- Als een vaardigheid zou moeten verschijnen maar dat niet doet, voer dan `clawhub inspect @owner/slug` uit terwijl je bent ingelogd om eigenaar-zichtbare moderatiediagnostiek te controleren voordat je metadata hernoemt.

### `explore`

- Toont de nieuwste vaardigheden via `/api/v1/skills?limit=...&sort=createdAt` (gesorteerd op `createdAt` aflopend).
- Vlaggen:
  - `--limit <n>` (1-200, standaard: 25)
  - `--sort newest|updated|rating|downloads|trending` (standaard: nieuwste). Verouderde installatiesorteeraliassen blijven werken voor compatibiliteit.
  - `--json` (machineleesbare uitvoer)
- Uitvoer: `<slug>  v<version>  <age>  <summary>` (samenvatting ingekort tot 50 tekens).

### `inspect @owner/slug`

- Haalt metadata en versiebestanden van de vaardigheid op zonder te installeren.
- `--version <version>`: inspecteer een specifieke versie (standaard: nieuwste).
- `--tag <tag>`: inspecteer een getagde versie (bijv. `latest`).
- `--versions`: toon versiegeschiedenis (eerste pagina).
- `--limit <n>`: maximumaantal versies om te tonen (1-200).
- `--files`: toon bestanden voor de geselecteerde versie.
- `--file <path>`: haal ruwe bestandsinhoud op (alleen tekstbestanden; limiet van 200 KB).
- `--json`: machineleesbare uitvoer.

### `install @owner/slug`

- Lost de nieuwste versie op voor de genoemde eigenaar en vaardigheid.
- Downloadt zip via `/api/v1/download`.
- Pakt uit naar `<workdir>/<dir>/<slug>`.
- Weigert vastgezette vaardigheden te overschrijven; voer eerst `clawhub unpin <skill>` uit.
- Schrijft:
  - `<workdir>/.clawhub/lock.json` (verouderd `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (verouderd `.clawdhub`)

### `uninstall <skill>`

- Verwijdert `<workdir>/<dir>/<slug>` en verwijdert de lockfile-vermelding.
- Verstuurt best-effort telemetrie terwijl je bent ingelogd, zodat huidige installatietellingen kunnen worden
  gedeactiveerd.
- Interactief: vraagt om bevestiging.
- Niet-interactief (`--no-input`): vereist `--yes`.

### `list`

- Leest `<workdir>/.clawhub/lock.json` (verouderd `.clawdhub`).
- Toont `pinned` naast vaardigheden die met `clawhub pin` zijn bevroren, inclusief de optionele reden.

### `pin <skill>`

- Markeert een geïnstalleerde vaardigheid als vastgezet in de lockfile.
- `--reason <text>` legt vast waarom de vaardigheid is bevroren.
- Vastgezette vaardigheden worden overgeslagen door `update --all` en geweigerd door directe `update <skill>`.
- Vastgezette vaardigheden weigeren ook `install --force`, zodat de lokale bytes niet per ongeluk kunnen worden vervangen.

### `unpin <skill>`

- Verwijdert de lockfile-pin van een geïnstalleerde vaardigheid, zodat toekomstige updates deze kunnen wijzigen.

### `update [@owner/slug]` / `update --all`

- Berekent fingerprint uit lokale bestanden.
- Als de fingerprint overeenkomt met een bekende versie: geen prompt.
- Als de fingerprint niet overeenkomt:
  - weigert standaard
  - overschrijft met `--force` (of prompt, indien interactief)
- Vastgezette vaardigheden worden nooit bijgewerkt door `--force`.
- `update <skill>` faalt snel voor vastgezette vaardigheden en vertelt je eerst `clawhub unpin <skill>` uit te voeren.
- `update --all` slaat vastgezette slugs over en drukt een samenvatting af van wat bevroren bleef.

### `skill publish <path>`

- Vergelijkt de fingerprint van de lokale bundel met ClawHub en sluit succesvol af wanneer
  de inhoud al is gepubliceerd.
- Nieuwe vaardigheden gebruiken standaard `1.0.0`; gewijzigde vaardigheden gebruiken standaard de volgende patch-
  versie.
- `--version <version>` selecteert expliciet een versie en publiceert zelfs wanneer de
  inhoud overeenkomt met een bestaande versie.
- `--dry-run` lost de publicatie op zonder te uploaden; `--json` drukt een
  machineleesbaar resultaat af.
- `--owner <handle>` publiceert onder een org-/gebruikerspublisherhandle wanneer de
  actor publishertoegang heeft.
- `--migrate-owner` verplaatst een bestaande vaardigheid naar `--owner` terwijl een nieuwe
  versie wordt gepubliceerd. Vereist admin-/eigenaarstoegang op beide publishers.
- Eigenaars- en reviewgedrag wordt uitgelegd in `docs/publishing.md`.
- Een vaardigheid publiceren betekent dat deze onder `MIT-0` wordt uitgebracht op ClawHub.
- Gepubliceerde vaardigheden zijn vrij te gebruiken, wijzigen en herdistribueren zonder naamsvermelding.
- ClawHub ondersteunt geen betaalde vaardigheden of prijzen per vaardigheid.
- Verouderde alias: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

De herbruikbare workflow
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
van ClawHub roept `skill publish` aan voor één `skill_path`, of voor elke directe vaardigheidsmap
onder `root` (standaard: `skills`). Ongewijzigde vaardigheden worden overgeslagen en dezelfde
automatische patchversiegedrag wordt gebruikt.

Stel `dry_run: true` in om zonder token een voorbeeld te bekijken. Echte publicaties vereisen de
secret `clawhub_token`.

### `sync`

- Scant de huidige werkmap, de geconfigureerde vaardighedenmap en alle
  `--root <dir>`-mappen op lokale vaardigheidsmappen met `SKILL.md` of
  `skill.md`.
- Vergelijkt elke lokale vaardigheidsfingerprint met ClawHub en publiceert alleen nieuwe of
  gewijzigde vaardigheden.
- Nieuwe vaardigheden worden gepubliceerd als `1.0.0`; gewijzigde vaardigheden publiceren standaard de volgende patchversie.
  Gebruik `--bump minor|major` voor updatebatches die met een
  grotere semver-stap moeten opschuiven.
- `--dry-run` toont het publicatieplan zonder te uploaden; `--json` drukt een
  machineleesbaar plan af.
- `--all` publiceert elke nieuwe of gewijzigde vaardigheid zonder prompt. Zonder
  `--all` laten interactieve terminals je de te publiceren vaardigheden selecteren.
- `--owner <handle>` publiceert onder een org-/gebruikerspublisherhandle wanneer de
  actor publishertoegang heeft.
- `sync` is alleen een eenrichtingspublicatie. Het installeert, werkt bij, downloadt of
  rapporteert geen installatie-/downloadtelemetrie.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Vereist `clawhub login`.
- Voert ClawHub ClawScan uit via `POST /api/v1/skills/-/scan` en pollt daarna totdat de scan terminaal is.
- Scans zijn asynchroon en kunnen tijd kosten om te voltooien. Terwijl ze in de wachtrij staan, toont de terminalspinner de huidige geprioriteerde scanpositie en hoeveel scans ervoor staan.
- Gepubliceerde scans vereisen eigendom of publisherbeheertoegang. Moderators/admins kunnen dezelfde backend gebruiken via `clawhub-admin`.
- `--update` is alleen geldig met `--slug`; het schrijft succesvolle gepubliceerde scanresultaten terug naar de geselecteerde versie.
- `--output <file.zip>` downloadt het volledige rapportarchief met `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` en `README.md`.
- `--json` drukt de volledige pollrespons af voor automatisering.
- Lokale-padscans worden niet langer ondersteund. Upload een nieuwe versie en gebruik daarna `scan download` om de opgeslagen scanresultaten voor die ingediende versie op te halen.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Vereist `clawhub login`.
- Downloadt de opgeslagen scanrapport-ZIP voor een ingediende vaardigheids- of pluginversie, inclusief versies die door ClawHub-beveiligingscontroles zijn geblokkeerd of verborgen.
- Vaardigheidsdownloads gebruiken de vaardigheidsslug en gebruiken standaard `--kind skill`.
- Plugindownloads gebruiken de pakketnaam en vereisen `--kind plugin`.
- `--version` is vereist zodat auteurs de exacte ingediende versie inspecteren die ClawHub heeft geblokkeerd.
- `--output <file.zip>` kiest het doelpad.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub levert een officiële herbruikbare workflow op
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/a89bfaf61d1bb5e0bfa7a92cf35b76c7e404e1ca/.github/workflows/skill-publish.yml)
voor vaardigheidsrepo's en catalogusrepo's.

Typische catalogusconfiguratie:

```yaml
name: Skill Publish

on:
  pull_request:
  workflow_dispatch:

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Opmerkingen:

- `root` gebruikt standaard `skills` voor catalogusrepo's.
- Geef `skill_path: skills/review-helper` door om één vaardigheidsmap te verwerken.
- `owner` komt overeen met de CLI-vlag `--owner`; laat deze weg om als de geauthenticeerde gebruiker te publiceren.
- V1-publicatie van vaardigheden gebruikt `clawhub_token`; vertrouwde publicatie via GitHub OIDC is voorlopig alleen voor pakketten.

### `delete <skill>`

- Zonder `--version`: voer een soft-delete uit op een skill (eigenaar, moderator of beheerder).
- Roept `DELETE /api/v1/skills/{slug}` aan.
- Door de eigenaar gestarte soft-deletes reserveren de slug 30 dagen; de opdracht toont de vervaltijd.
- `--version <version>` verwijdert permanent één eigen niet-nieuwste versie via een fail-closed,
  versiespecifieke route.
  Verwijderde versies kunnen niet worden hersteld of opnieuw gepubliceerd. Publiceer een vervanging voordat u de
  huidige nieuwste versie verwijdert. Platformmedewerkers omzeilen het eigenaarschap niet voor deze versie-only flow.
- `--reason <text>` legt een moderatienotitie vast bij een soft-delete van de hele skill en in het auditlogboek.
- `--note <text>` is een alias voor `--reason`.
- `--yes` slaat bevestiging over.

### `undelete <skill>`

- Herstel een verborgen skill (eigenaar, moderator of beheerder).
- Er is geen versie-undelete; permanent verwijderde versies kunnen niet worden hersteld.
- Roept `POST /api/v1/skills/{slug}/undelete` aan.
- `--reason <text>` legt een moderatienotitie vast bij de skill en in het auditlogboek.
- `--note <text>` is een alias voor `--reason`.
- `--yes` slaat bevestiging over.

### `hide <skill>`

- Verberg een skill (eigenaar, moderator of beheerder).
- Alias voor `delete`.

### `unhide <skill>`

- Maak een skill weer zichtbaar (eigenaar, moderator of beheerder).
- Alias voor `undelete`.

### `skill rename <skill> <new-name>`

- Hernoem een eigen skill en behoud de vorige slug als omleidingsalias.
- Roept `POST /api/v1/skills/{slug}/rename` aan.
- `--yes` slaat bevestiging over.

### `skill merge <source> <target>`

- Voeg één eigen skill samen met een andere eigen skill.
- De bron-slug wordt niet meer openbaar vermeld en wordt een omleidingsalias naar het doel.
- Roept `POST /api/v1/skills/{sourceSlug}/merge` aan.
- `--yes` slaat bevestiging over.

### `transfer`

- Workflow voor eigendomsoverdracht.
- Overdrachten naar gebruikershandles maken een aanvraag in behandeling aan die de ontvanger accepteert.
- Overdrachten naar organisatie-/uitgeverhandles worden alleen direct toegepast wanneer de actor
  beheerderstoegang heeft tot zowel de huidige eigenaar als de doeluitgever.
- Subopdrachten:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- Eindpunten:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Bladert door of doorzoekt de uniforme pakketcatalogus via `GET /api/v1/packages` en `GET /api/v1/packages/search`.
- Gebruik dit voor plugins en andere items uit pakketfamilies; `search` op topniveau blijft het zoekoppervlak voor skills.
- Vlaggen:
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>` (1-100, standaard: 25)
  - `--json`

Voorbeelden:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- Haalt pakketmetadata op zonder te installeren.
- Gebruik dit voor pluginmetadata, compatibiliteit, verificatie, bron en versie-/bestandsinspectie.
- `--version <version>`: inspecteer een specifieke versie (standaard: nieuwste).
- `--tag <tag>`: inspecteer een getagde versie (bijv. `latest`).
- `--versions`: vermeld versiegeschiedenis (eerste pagina).
- `--limit <n>`: maximaal aantal te vermelden versies (1-100).
- `--files`: vermeld bestanden voor de geselecteerde versie.
- `--file <path>`: haal ruwe bestandsinhoud op (alleen tekstbestanden; limiet van 200 KB).
- `--json`: machineleesbare uitvoer.

### `package download <name>`

- Lost een pakketversie op via
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Downloadt het artefact vanaf de `downloadUrl` van de resolver.
- Verifieert ClawHub SHA-256 voor alle artefacten.
- Voor ClawPack npm-pack-artefacten verifieert dit ook npm `sha512`-integriteit,
  npm-shasum en de naam/versie in `package.json` van de tarball.
- Legacy ZIP-versies worden gedownload via de legacy ZIP-route.
- Vlaggen:
  - `--version <version>`: download een specifieke versie.
  - `--tag <tag>`: download een getagde versie (standaard: `latest`).
  - `-o, --output <path>`: uitvoerbestand of -map.
  - `--force`: overschrijf een bestaand uitvoerbestand.
  - `--json`: machineleesbare uitvoer.

Voorbeelden:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Berekent ClawHub SHA-256, npm `sha512`-integriteit en npm-shasum voor een lokaal
  artefact.
- Met `--package` worden verwachte metadata uit ClawHub opgehaald en wordt het
  lokale bestand vergeleken met de metadata van het gepubliceerde artefact.
- Met directe digest-vlaggen wordt geverifieerd zonder netwerkopzoeking.
- Vlaggen:
  - `--package <name>`: pakketnaam om verwachte artefactmetadata op te lossen.
  - `--version <version>` of `--tag <tag>`: verwachte pakketversie.
  - `--sha256 <hex>`: verwachte ClawHub SHA-256.
  - `--npm-integrity <sri>`: verwachte npm-integriteit.
  - `--npm-shasum <sha1>`: verwachte npm-shasum.
  - `--json`: machineleesbare uitvoer.

Voorbeelden:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Voert de gebundelde Plugin Inspector van de ClawHub CLI uit op een lokale pluginpakketmap.
- Standaard wordt offline/statische validatie gebruikt, zonder een lokale
  OpenClaw-checkout te vinden of te importeren.
- Harde compatibiliteitsfouten sluiten af met een niet-nulcode. Bevindingen met alleen waarschuwingen worden afgedrukt maar
  sluiten af met nul.
- Vlaggen:
  - `--out <dir>`: schrijf Plugin Inspector-rapporten naar deze map.
  - `--openclaw <path>`: inspecteer tegen een expliciete lokale OpenClaw-checkout.
  - `--runtime`: schakel runtime-vastlegging in; importeert plugincode.
  - `--allow-execute`: sta runtime-vastlegging toe in een geïsoleerde werkruimte.
  - `--no-mock-sdk`: schakel gemockte OpenClaw SDK uit tijdens runtime-vastlegging.
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package validate ./example-plugin
```

Als validatie een bevinding voor pakket, manifest, SDK-import of artefact rapporteert, raadpleeg dan
[Pluginvalidatiefixes](/clawhub/plugin-validation-fixes) en voer de opdracht daarna opnieuw uit.

### `package delete <name>`

- Zonder `--version`: voert een soft-delete uit op een pakket en alle releases.
- `--version <version>` verwijdert permanent één eigen niet-nieuwste release via een fail-closed,
  versiespecifieke route.
  Verwijderde versies kunnen niet worden hersteld of opnieuw gepubliceerd. Publiceer een vervanging voordat u de
  huidige nieuwste versie verwijdert. Deze versie-only flow vereist de pakketeigenaar of een beheerder
  van een organisatie-uitgever; platformmedewerkers omzeilen pakketeigendom niet.
- Soft-delete van het hele pakket vereist de pakketeigenaar, een eigenaar/beheerder van de organisatie-uitgever,
  platformmoderator of platformbeheerder.
- Vlaggen:
  - `--version <version>`: verwijder permanent één niet-nieuwste versie.
  - `--yes`: sla bevestiging over.
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Herstelt een soft-deleted pakket en releases.
- Er is geen versie-undelete; permanent verwijderde versies kunnen niet worden hersteld.
- Vereist de pakketeigenaar, een eigenaar/beheerder van de organisatie-uitgever, platformmoderator
  of platformbeheerder.
- Roept `POST /api/v1/packages/{name}/undelete` aan.
- Vlaggen:
  - `--yes`: sla bevestiging over.
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Draagt een pakket over aan een andere uitgever.
- Vereist beheerderstoegang tot zowel de huidige pakketeigenaar als de doeluitgever,
  tenzij dit wordt uitgevoerd door een platformbeheerder.
- Scoped pakketnamen moeten worden overgedragen aan de overeenkomende scope-eigenaar.
- Roept `POST /api/v1/packages/{name}/transfer` aan.
- Vlaggen:
  - `--to <owner>`: handle van de doeluitgever.
  - `--reason <text>`: optionele auditreden.
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Geauthenticeerde opdracht om een pakket bij moderators te melden.
- Roept `POST /api/v1/packages/{name}/report` aan.
- Meldingen zijn op pakketniveau, optioneel gekoppeld aan een versie, en worden zichtbaar
  voor moderators ter beoordeling.
- Meldingen verbergen pakketten niet automatisch en blokkeren downloads niet op zichzelf.
- Vlaggen:
  - `--version <version>`: optionele pakketversie om aan de melding te koppelen.
  - `--reason <text>`: vereiste meldingsreden.
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Eigenaaropdracht om de zichtbaarheid van pakketmoderatie te controleren.
- Roept `GET /api/v1/packages/{name}/moderation` aan.
- Toont de huidige scansstatus van het pakket, het aantal open meldingen, de handmatige
  moderatiestatus van de nieuwste release, de downloadblokkeringsstatus en moderatieredenen.
- Vlaggen:
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Controleert of een pakket klaar is voor toekomstig gebruik door OpenClaw.
- Roept `GET /api/v1/packages/{name}/readiness` aan.
- Rapporteert blokkades voor officiële status, ClawPack-beschikbaarheid, artefactdigest,
  bronherkomst, OpenClaw-compatibiliteit, hostdoelen, omgevingsmetadata
  en scanstatus.
- Vlaggen:
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Toont operatorgerichte migratiestatus voor een pakket dat een gebundelde
  OpenClaw-plugin kan vervangen.
- Roept hetzelfde berekende readiness-eindpunt aan als `package readiness`, maar drukt
  migratiegerichte status, nieuwste versie, officiële-pakketstatus, controles en
  blokkades af.
- Vlaggen:
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Maakt een organisatie-uitgever aan die eigendom is van de geauthenticeerde gebruiker.
- De handle wordt genormaliseerd naar kleine letters en mag met of zonder `@` worden opgegeven.
- Nieuw aangemaakte organisatie-uitgevers zijn standaard niet vertrouwd/officieel.
- Mislukt als de handle al wordt gebruikt door een bestaande uitgever, gebruiker of gereserveerde route.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Publiceert een code-Plugin of bundel-Plugin via `POST /api/v1/packages`.
- `<source>` accepteert:
  - Lokaal mappad: `./my-plugin`
  - Lokale ClawPack npm-pack-tarball: `./my-plugin-1.2.3.tgz`
  - GitHub-repo: `owner/repo` of `owner/repo@ref`
  - GitHub-URL: `https://github.com/owner/repo`
- Metadata wordt automatisch gedetecteerd uit `package.json`, `openclaw.plugin.json` en
  echte OpenClaw-bundelmarkeringen zoals `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` en `.cursor-plugin/plugin.json`.
- `.tgz`-bronnen worden behandeld als ClawPack. De CLI uploadt de exacte npm-pack-
  bytes en gebruikt de uitgepakte `package/`-inhoud alleen voor validatie en
  het vooraf invullen van metadata.
- Code-Plugin-mappen worden vóór upload verpakt in een ClawPack npm-tarball, zodat
  OpenClaw-installaties het exacte artefact kunnen verifiëren. Bundel-Plugin-mappen gebruiken nog steeds
  het publicatiepad met uitgepakte bestanden.
- Voor GitHub-bronnen wordt bronvermelding automatisch ingevuld vanuit de repo, opgeloste commit, ref en subpad.
- Voor lokale mappen wordt bronvermelding automatisch gedetecteerd vanuit lokale git wanneer de origin-remote naar GitHub wijst.
- Externe code-Plugins moeten `openclaw.compat.pluginApi` en
  `openclaw.build.openclawVersion` expliciet declareren.
  `package.json.version` op topniveau wordt niet gebruikt als fallback voor publicatievalidatie.
- `--dry-run` toont een voorbeeld van de opgeloste publicatiepayload zonder te uploaden.
- `--json` geeft machineleesbare uitvoer voor CI.
- `--owner <handle>` publiceert onder een uitgevershandle van een gebruiker of organisatie wanneer de actor uitgeverstoegang heeft.
- Scoped pakketnamen moeten overeenkomen met de geselecteerde eigenaar. Zie `docs/publishing.md`.
- Bestaande flags (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) blijven werken als overrides.
- Privé-GitHub-repo's vereisen `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Aanbevolen lokale flow

Gebruik eerst `--dry-run`, zodat je de opgeloste pakketmetadata en
bronvermelding kunt bevestigen voordat je een live release maakt:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Lokale-mapflow

Voor code-Plugins bouwt en uploadt mappublicatie een ClawPack-artefact vanuit
de pakketmap:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### Minimale `package.json` voor `--family code-plugin`

Externe code-Plugins hebben een kleine hoeveelheid OpenClaw-metadata nodig in
`package.json`. Dit minimale manifest is voldoende voor een succesvolle publicatie:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2"
    }
  }
}
```

Vereiste velden:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

Opmerkingen:

- `package.json.version` is de releaseversie van je pakket, maar wordt niet gebruikt als
  fallback voor OpenClaw-compatibiliteits-/buildvalidatie.
- `openclaw.hostTargets` en `openclaw.environment` zijn optionele metadata.
  ClawHub kan ze tonen wanneer ze aanwezig zijn, maar ze zijn niet vereist voor publicatie.
- `openclaw.compat.minGatewayVersion` en
  `openclaw.build.pluginSdkVersion` zijn optionele extra's als je
  gedetailleerdere compatibiliteitsmetadata wilt publiceren.
- Als je een oudere `clawhub` CLI-release gebruikt, upgrade dan vóór publicatie, zodat
  de lokale preflightcontroles vóór upload worden uitgevoerd.
- Als validatie een herstelcode rapporteert, zie
  [Plugin-validatieoplossingen](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub levert ook een officiële herbruikbare workflow op
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/a89bfaf61d1bb5e0bfa7a92cf35b76c7e404e1ca/.github/workflows/package-publish.yml)
voor Plugin-repo's.

Typische callerconfiguratie:

```yaml
name: Package Publish

on:
  pull_request:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/')
    permissions:
      contents: read
      id-token: write
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Opmerkingen:

- De herbruikbare workflow zet `source` standaard op de caller-repo.
- Geef voor monorepo's `source_path` door, zodat de workflow de Plugin-
  pakketmap publiceert, bijvoorbeeld `source_path: extensions/codex`.
- Pin de herbruikbare workflow op een stabiele tag of volledige commit-SHA. Voer releasepublicatie niet uit vanaf `@main`.
- `pull_request` moet `dry_run: true` gebruiken, zodat CI niet-vervuilend blijft.
- Echte publicaties moeten worden beperkt tot vertrouwde events zoals `workflow_dispatch` of tag-pushes.
- Vertrouwde publicatie zonder geheim werkt alleen op `workflow_dispatch`; tag-pushes hebben nog steeds `clawhub_token` nodig.
- Houd `clawhub_token` beschikbaar voor eerste publicatie, niet-vertrouwde pakketten of noodpublicaties.
- De workflow uploadt het JSON-resultaat als artefact en stelt het beschikbaar als workflow-uitvoer.

### `package trusted-publisher get <name>`

- Toont de GitHub Actions trusted publisher-configuratie voor een pakket.
- Gebruik dit na het instellen van configuratie om de repository, workflowbestandsnaam
  en optionele omgeving-pin te bevestigen.
- Flags:
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Koppelt of vervangt de GitHub Actions trusted publisher-configuratie voor een bestaand
  pakket.
- Het pakket moet eerst worden gemaakt via normale handmatige of token-geauthenticeerde
  `clawhub package publish`.
- Nadat de configuratie is ingesteld, kunnen toekomstige ondersteunde GitHub Actions-publicaties
  OIDC/trusted publishing gebruiken zonder langlevend ClawHub-token.
- `--repository <repo>` moet `owner/repo` zijn.
- `--workflow-filename <file>` moet overeenkomen met de workflowbestandsnaam in
  `.github/workflows/`.
- `--environment <name>` is optioneel. Wanneer dit is geconfigureerd, moet de GitHub Actions-
  omgeving in de OIDC-claim exact overeenkomen.
- ClawHub verifieert de geconfigureerde GitHub-repository wanneer deze opdracht wordt uitgevoerd.
  Openbare repositories kunnen worden geverifieerd via openbare GitHub-metadata. Privé-
  repositories vereisen dat ClawHub GitHub-toegang heeft tot die repository, bijvoorbeeld
  via een toekomstige ClawHub GitHub App-installatie of een andere geautoriseerde
  GitHub-integratie.
- Flags:
  - `--repository <repo>`: GitHub-repository, bijvoorbeeld `openclaw/example-plugin`.
  - `--workflow-filename <file>`: workflowbestandsnaam, bijvoorbeeld `package-publish.yml`.
  - `--environment <name>`: optionele GitHub Actions-omgeving met exacte overeenkomst.
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Verwijdert trusted publisher-configuratie uit een pakket.
- Gebruik dit als rollback als de workflow-, repository- of omgeving-pin moet worden
  uitgeschakeld of opnieuw gemaakt.
- Toekomstige echte publicaties moeten normale geauthenticeerde publicatie gebruiken totdat configuratie
  opnieuw is ingesteld.
- Flags:
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Installatietelemetrie

- Verzonden na `clawhub install <slug>` wanneer je bent ingelogd, tenzij
  `CLAWHUB_DISABLE_TELEMETRY=1` is ingesteld.
- Rapportage is best-effort. Installatieopdrachten falen niet als telemetrie
  niet beschikbaar is.
- Details: `docs/telemetry.md`.
