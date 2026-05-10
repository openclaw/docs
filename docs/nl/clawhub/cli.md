---
read_when:
    - De ClawHub CLI gebruiken
    - Problemen oplossen met installeren, bijwerken, publiceren of synchroniseren
summary: 'CLI-referentie: opdrachten, vlaggen, configuratie, lockbestand, synchronisatiegedrag.'
x-i18n:
    generated_at: "2026-05-10T19:25:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8e43780c82c9d540bf99e677788df8913532adb3d237d20d96f575f621eae3
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI-pakket: `clawhub`, bin: `clawhub`.

Installeer het globaal met npm of pnpm:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Controleer het daarna:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Globale vlaggen

- `--workdir <dir>`: werkmap (standaard: cwd; valt terug op de Clawdbot-werkruimte indien geconfigureerd)
- `--dir <dir>`: installatiemap onder workdir (standaard: `skills`)
- `--site <url>`: basis-URL voor browserlogin (standaard: `https://clawhub.ai`)
- `--registry <url>`: API-basis-URL (standaard: gedetecteerd, anders `https://clawhub.ai`)
- `--no-input`: prompts uitschakelen

Env-equivalenten:

- `CLAWHUB_SITE` (legacy `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (legacy `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (legacy `CLAWDHUB_WORKDIR`)

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

Slaat je API-token + gecachte registry-URL op.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` of `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Legacy fallback: als `clawhub/config.json` nog niet bestaat maar `clawdhub/config.json` wel, hergebruikt de CLI het legacy-pad
- override: `CLAWHUB_CONFIG_PATH` (legacy `CLAWDHUB_CONFIG_PATH`)

## Commando's

### `login` / `auth login`

- Standaard: opent de browser naar `<site>/cli/auth` en voltooit via loopback-callback.
- Headless: `clawhub login --token clh_...`
- Extern/headless interactief: `clawhub login --device` drukt een code af en wacht terwijl je deze autoriseert op `<site>/cli/device`.

### `whoami`

- Verifieert het opgeslagen token via `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Voegt een skill toe aan of verwijdert een skill uit je highlights.
- Roept `POST /api/v1/stars/<slug>` en `DELETE /api/v1/stars/<slug>` aan.
- `--yes` slaat bevestiging over.

### `search <query...>`

- Roept `/api/v1/search?q=...` aan.
- Zoeken geeft de voorkeur aan exacte overeenkomsten op slug-/naamtokens vóór downloadpopulariteit. Een los slug-token zoals `map` matcht sterker met `personal-map` dan met de substring in `amap`.
- Downloads zijn een kleine populariteitsprior, geen garantie op een toppositie.
- Als een skill zou moeten verschijnen maar dat niet doet, voer dan `clawhub inspect <slug>` uit terwijl je bent ingelogd om eigenaar-zichtbare moderatiediagnostiek te controleren voordat je metadata hernoemt.

### `explore`

- Toont de nieuwste skills via `/api/v1/skills?limit=...&sort=createdAt` (gesorteerd op `createdAt` aflopend).
- Vlaggen:
  - `--limit <n>` (1-200, standaard: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (standaard: newest)
  - `--json` (machineleesbare uitvoer)
- Uitvoer: `<slug>  v<version>  <age>  <summary>` (samenvatting afgekapt tot 50 tekens).

### `inspect <slug>`

- Haalt skillmetadata en versiebestanden op zonder te installeren.
- `--version <version>`: inspecteer een specifieke versie (standaard: nieuwste).
- `--tag <tag>`: inspecteer een getagde versie (bijv. `latest`).
- `--versions`: toon versiegeschiedenis (eerste pagina).
- `--limit <n>`: maximum aantal versies om te tonen (1-200).
- `--files`: toon bestanden voor de geselecteerde versie.
- `--file <path>`: haal ruwe bestandsinhoud op (alleen tekstbestanden; limiet van 200 KB).
- `--json`: machineleesbare uitvoer.

### `install <slug>`

- Bepaalt de nieuwste versie via `/api/v1/skills/<slug>`.
- Downloadt zip via `/api/v1/download`.
- Pakt uit naar `<workdir>/<dir>/<slug>`.
- Weigert gepinde skills te overschrijven; voer eerst `clawhub unpin <slug>` uit.
- Schrijft:
  - `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

### `uninstall <slug>`

- Verwijdert `<workdir>/<dir>/<slug>` en verwijdert de lockfile-vermelding.
- Interactief: vraagt om bevestiging.
- Niet-interactief (`--no-input`): vereist `--yes`.

### `list`

- Leest `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`).
- Toont `pinned` naast skills die zijn vastgezet met `clawhub pin`, inclusief de optionele reden.

### `pin <slug>`

- Markeert een geïnstalleerde skill als vastgezet in het lockfile.
- `--reason <text>` legt vast waarom de skill is bevroren.
- Vastgezette skills worden overgeslagen door `update --all` en geweigerd door directe `update <slug>`.
- Vastgezette skills weigeren ook `install --force`, zodat de lokale bytes niet per ongeluk kunnen worden vervangen.

### `unpin <slug>`

- Verwijdert de lockfile-pin van een geïnstalleerde skill, zodat toekomstige updates deze kunnen wijzigen.

### `update [slug]` / `update --all`

- Berekent de vingerafdruk uit lokale bestanden.
- Als de vingerafdruk overeenkomt met een bekende versie: geen prompt.
- Als de vingerafdruk niet overeenkomt:
  - weigert standaard
  - overschrijft met `--force` (of prompt, indien interactief)
- Vastgezette skills worden nooit bijgewerkt door `--force`.
- `update <slug>` faalt snel voor vastgezette slugs en zegt dat je eerst `clawhub unpin <slug>` moet uitvoeren.
- `update --all` slaat vastgezette slugs over en drukt een samenvatting af van wat bevroren bleef.

### `skill publish <path>`

- Publiceert via `POST /api/v1/skills` (multipart).
- Vereist semver: `--version 1.2.3`.
- `--owner <handle>` publiceert onder een uitgever-handle van een organisatie/gebruiker wanneer de
  actor uitgeverstoegang heeft.
- `--migrate-owner` verplaatst een bestaande skill naar `--owner` terwijl een nieuwe
  versie wordt gepubliceerd. Vereist beheerders-/eigenaarstoegang bij beide uitgevers.
- Eigenaar- en reviewgedrag wordt uitgelegd in `docs/publishing.md`.
- Een skill publiceren betekent dat deze onder `MIT-0` wordt uitgebracht op ClawHub.
- Gepubliceerde skills zijn vrij te gebruiken, wijzigen en herdistribueren zonder naamsvermelding.
- ClawHub ondersteunt geen betaalde skills of prijzen per skill.
- Legacy-alias: `publish <path>`.

### `delete <slug>`

- Verwijder een skill zacht (eigenaar, moderator of beheerder).
- Roept `DELETE /api/v1/skills/{slug}` aan.
- Door de eigenaar geïnitieerde zachte verwijderingen reserveren de slug 30 dagen; de opdracht drukt de vervaltijd af.
- `--reason <text>` legt een moderatienotitie vast op de skill en in het auditlogboek.
- `--note <text>` is een alias voor `--reason`.
- `--yes` slaat bevestiging over.

### `undelete <slug>`

- Herstel een verborgen skill (eigenaar, moderator of beheerder).
- Roept `POST /api/v1/skills/{slug}/undelete` aan.
- `--reason <text>` legt een moderatienotitie vast op de skill en in het auditlogboek.
- `--note <text>` is een alias voor `--reason`.
- `--yes` slaat bevestiging over.

### `hide <slug>`

- Verberg een skill (eigenaar, moderator of beheerder).
- Alias voor `delete`.

### `unhide <slug>`

- Maak een skill weer zichtbaar (eigenaar, moderator of beheerder).
- Alias voor `undelete`.

### `skill rename <slug> <new-slug>`

- Hernoem een eigen skill en behoud de vorige slug als omleidingsalias.
- Roept `POST /api/v1/skills/{slug}/rename` aan.
- `--yes` slaat bevestiging over.

### `skill merge <source-slug> <target-slug>`

- Voeg een eigen skill samen met een andere eigen skill.
- De bron-slug wordt niet langer openbaar vermeld en wordt een omleidingsalias naar het doel.
- Roept `POST /api/v1/skills/{sourceSlug}/merge` aan.
- `--yes` slaat bevestiging over.

### `skill rescan <slug>`

- Vraag een beveiligingsherscan aan voor de nieuwste gepubliceerde skillversie.
- Eigenaren en uitgeverbeheerders kunnen hun eigen skills opnieuw scannen tot aan de herstel-limiet per versie.
- Platformmoderators en beheerders kunnen elke skill opnieuw scannen en worden niet geblokkeerd door de
  herstel-limiet van de eigenaar, hoewel er per versie maar één herscan tegelijk kan draaien.
- Roept `POST /api/v1/skills/{slug}/rescan` aan.
- Vlaggen:
  - `--yes`: bevestiging overslaan.
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub skill rescan suspicious-skill --yes
```

### `transfer`

- Workflow voor eigendomsoverdracht.
- Subopdrachten:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- Eindpunten:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Bladert door of doorzoekt de uniforme pakketcatalogus via `GET /api/v1/packages` en `GET /api/v1/packages/search`.
- Gebruik dit voor plugins en andere vermeldingen uit pakketfamilies; `search` op topniveau blijft het zoekoppervlak voor skills.
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
- Gebruik dit voor pluginmetadata, compatibiliteit, verificatie, bron en inspectie van versie/bestanden.
- `--version <version>`: inspecteer een specifieke versie (standaard: nieuwste).
- `--tag <tag>`: inspecteer een getagde versie (bijv. `latest`).
- `--versions`: geef versiegeschiedenis weer (eerste pagina).
- `--limit <n>`: maximaal aantal weer te geven versies (1-100).
- `--files`: geef bestanden voor de geselecteerde versie weer.
- `--file <path>`: haal ruwe bestandsinhoud op (alleen tekstbestanden; limiet van 200 KB).
- `--json`: machineleesbare uitvoer.

### `package download <name>`

- Lost een pakketversie op via
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Downloadt het artifact vanaf de `downloadUrl` van de resolver.
- Verifieert ClawHub SHA-256 voor alle artifacts.
- Voor ClawPack npm-pack-artifacts verifieert ook npm `sha512`-integriteit,
  npm shasum en de naam/versie in `package.json` van de tarball.
- Legacy ZIP-versies worden gedownload via de legacy ZIP-route.
- Vlaggen:
  - `--version <version>`: download een specifieke versie.
  - `--tag <tag>`: download een getagde versie (standaard: `latest`).
  - `-o, --output <path>`: uitvoerbestand of uitvoermap.
  - `--force`: overschrijf een bestaand uitvoerbestand.
  - `--json`: machineleesbare uitvoer.

Voorbeelden:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Berekent ClawHub SHA-256, npm `sha512`-integriteit en npm shasum voor een lokaal
  artifact.
- Met `--package` worden verwachte metadata uit ClawHub opgelost en wordt het
  lokale bestand vergeleken met de metadata van het gepubliceerde artifact.
- Met directe digest-vlaggen wordt geverifieerd zonder netwerkzoekopdracht.
- Vlaggen:
  - `--package <name>`: pakketnaam om verwachte artifactmetadata op te lossen.
  - `--version <version>` of `--tag <tag>`: verwachte pakketversie.
  - `--sha256 <hex>`: verwachte ClawHub SHA-256.
  - `--npm-integrity <sri>`: verwachte npm-integriteit.
  - `--npm-shasum <sha1>`: verwachte npm shasum.
  - `--json`: machineleesbare uitvoer.

Voorbeelden:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- Verwijdert een pakket en alle releases via soft-delete.
- Vereist de pakketeigenaar, een eigenaar/beheerder van een organisatie-uitgever, platformmoderator,
  of platformbeheerder.
- Vlaggen:
  - `--yes`: sla bevestiging over.
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package rescan <name>`

- Vraag een beveiligingsscan opnieuw aan voor de nieuwste gepubliceerde pakketrelease.
- Eigenaren en uitgeversbeheerders kunnen hun eigen pakketten opnieuw scannen tot aan de herstel-limiet
  per release.
- Platformmoderators en beheerders kunnen elk pakket opnieuw scannen en worden niet geblokkeerd door
  de herstel-limiet van de eigenaar, hoewel er per release maar één nieuwe scan tegelijk kan draaien.
- Roept `POST /api/v1/packages/{name}/rescan` aan.
- Vlaggen:
  - `--yes`: sla bevestiging over.
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package rescan @openclaw/example-plugin --yes
```

### `package report`

- Geauthenticeerde opdracht om een pakket aan moderators te rapporteren.
- Roept `POST /api/v1/packages/{name}/report` aan.
- Rapporten zijn op pakketniveau, optioneel gekoppeld aan een versie, en worden zichtbaar
  voor moderators ter beoordeling.
- Rapporten verbergen pakketten niet automatisch en blokkeren downloads niet uit zichzelf.
- Vlaggen:
  - `--version <version>`: optionele pakketversie om aan het rapport te koppelen.
  - `--reason <text>`: vereiste reden voor het rapport.
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package appeal`

- Opdracht voor eigenaar/uitgever om bezwaar te maken tegen releasemoderatie.
- Roept `POST /api/v1/packages/{name}/appeal` aan.
- Bezwaren worden geaccepteerd voor releases in quarantaine, ingetrokken, verdacht of kwaadaardig.
- Vlaggen:
  - `--version <version>`: vereiste pakketversie.
  - `--message <text>`: vereist bezwaarbericht.
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package appeal @openclaw/example-plugin --version 1.2.3 --message "linked source release explains the native binary"
```

### `package moderation-status`

- Eigenaarsopdracht om de moderatiezichtbaarheid van een pakket te controleren.
- Roept `GET /api/v1/packages/{name}/moderation` aan.
- Toont de huidige pakketscanstatus, het aantal open rapporten, de handmatige
  moderatiestatus van de nieuwste release, de downloadblokkeringsstatus en moderatieredenen.
- Vlaggen:
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Controleert of een pakket klaar is voor toekomstig OpenClaw-gebruik.
- Roept `GET /api/v1/packages/{name}/readiness` aan.
- Rapporteert blokkades voor officiële status, ClawPack-beschikbaarheid, artifact-digest,
  bronherkomst, OpenClaw-compatibiliteit, hostdoelen, omgevingsmetadata,
  en scanstatus.
- Vlaggen:
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Toont operatorgerichte migratiestatus voor een pakket dat mogelijk een
  gebundelde OpenClaw-plugin vervangt.
- Roept hetzelfde berekende readiness-eindpunt aan als `package readiness`, maar toont
  migratiegerichte status, nieuwste versie, officiële-pakketstatus, controles en
  blokkades.
- Vlaggen:
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Publiceert een code-plugin of bundle-plugin via `POST /api/v1/packages`.
- `<source>` accepteert:
  - Lokaal mappad: `./my-plugin`
  - Lokale ClawPack npm-pack-tarball: `./my-plugin-1.2.3.tgz`
  - GitHub-repo: `owner/repo` of `owner/repo@ref`
  - GitHub-URL: `https://github.com/owner/repo`
- Metadata wordt automatisch gedetecteerd uit `package.json`, `openclaw.plugin.json` en
  echte OpenClaw-bundelmarkeringen zoals `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` en `.cursor-plugin/plugin.json`.
- `.tgz`-bronnen worden behandeld als ClawPack. De CLI uploadt de exacte npm-pack
  bytes en gebruikt de uitgepakte `package/`-inhoud alleen voor validatie en
  vooraf invullen van metadata.
- Code-plugin-mappen worden vóór upload verpakt in een ClawPack npm-tarball zodat
  OpenClaw-installaties het exacte artifact kunnen verifiëren. Bundle-plugin-mappen gebruiken nog steeds
  het publicatiepad met uitgepakte bestanden.
- Voor GitHub-bronnen wordt bronattributie automatisch ingevuld vanuit de repo, opgeloste commit, ref en subpad.
- Voor lokale mappen wordt bronattributie automatisch gedetecteerd vanuit lokale git wanneer de origin-remote naar GitHub wijst.
- Externe code-plugins moeten `openclaw.compat.pluginApi` en
  `openclaw.build.openclawVersion` expliciet declareren.
  `package.json.version` op topniveau wordt niet gebruikt als fallback voor publicatievalidatie.
- `--dry-run` toont een voorbeeld van de opgeloste publicatiepayload zonder te uploaden.
- `--json` geeft machineleesbare uitvoer voor CI.
- `--owner <handle>` publiceert onder een gebruikers- of organisatie-uitgevershandle wanneer de actor uitgeverstoegang heeft.
- Scoped pakketnamen moeten overeenkomen met de geselecteerde eigenaar. Zie `docs/publishing.md`.
- Bestaande vlaggen (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) blijven werken als overrides.
- Privé-GitHub-repo's vereisen `GITHUB_TOKEN`.

#### Aanbevolen lokale flow

Gebruik eerst `--dry-run` zodat je de opgeloste pakketmetadata en
bronattributie kunt bevestigen voordat je een live release maakt:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Lokale map-flow

Voor code-plugins bouwt en uploadt publiceren vanuit een map een ClawPack-artifact vanuit
de pakketmap:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### Minimale `package.json` voor `--family code-plugin`

Externe code-plugins hebben een kleine hoeveelheid OpenClaw-metadata nodig in
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

Notities:

- `package.json.version` is je pakketreleaseversie, maar wordt niet gebruikt als
  fallback voor OpenClaw-compatibiliteit/buildvalidatie.
- `openclaw.hostTargets` en `openclaw.environment` zijn optionele metadata.
  ClawHub kan ze tonen wanneer ze aanwezig zijn, maar ze zijn niet vereist voor publicatie.
- `openclaw.compat.minGatewayVersion` en
  `openclaw.build.pluginSdkVersion` zijn optionele extra's als je
  gedetailleerdere compatibiliteitsmetadata wilt publiceren.
- Als je een oudere `clawhub` CLI-release gebruikt, upgrade dan vóór publicatie zodat
  de lokale preflight-controles vóór upload worden uitgevoerd.

#### GitHub Actions

ClawHub levert ook een officiële herbruikbare workflow op
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/2dcaf25d23c4e19b9c14f705c2ce1fd1dc2949c1/.github/workflows/package-publish.yml)
voor plugin-repo's.

Typische caller-configuratie:

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

Notities:

- De herbruikbare workflow gebruikt standaard `source` voor de caller-repo.
- Geef voor monorepo's `source_path` door zodat de workflow de plugin-
  pakketmap publiceert, bijvoorbeeld `source_path: extensions/codex`.
- Pin de herbruikbare workflow aan een stabiele tag of volledige commit-SHA. Voer releasepublicatie niet uit vanaf `@main`.
- `pull_request` moet `dry_run: true` gebruiken zodat CI niet-vervuilend blijft.
- Echte publicaties moeten worden beperkt tot vertrouwde events zoals `workflow_dispatch` of tag-pushes.
- Vertrouwde publicatie zonder secret werkt alleen op `workflow_dispatch`; tag-pushes hebben nog steeds `clawhub_token` nodig.
- Houd `clawhub_token` beschikbaar voor eerste publicatie, niet-vertrouwde pakketten of noodpublicaties.
- De workflow uploadt het JSON-resultaat als artifact en stelt het beschikbaar als workflow-uitvoer.

### `sync`

- Scant naar lokale skill-mappen en publiceert nieuwe/gewijzigde.
- Roots kunnen elke map zijn: een Skills-map of een enkele skill-map met `SKILL.md`.
- Voegt Clawdbot skill-roots automatisch toe wanneer `~/.clawdbot/clawdbot.json` aanwezig is:
  - `agent.workspace/skills` (hoofdagent)
  - `routing.agents.*.workspace/skills` (per agent)
  - `~/.clawdbot/skills` (gedeeld)
  - `skills.load.extraDirs` (gedeelde packs)
- Respecteert `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` en `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- Vlaggen:
  - `--root <dir...>` extra scanroots
  - `--all` uploaden zonder te vragen
  - `--dry-run` alleen plan tonen
  - `--bump patch|minor|major` (standaard: patch)
  - `--changelog <text>` (niet-interactief)
  - `--tags a,b,c` (standaard: latest)
  - `--concurrency <n>` (standaard: 4)

Telemetrie:

- Verzonden tijdens `sync` wanneer ingelogd, tenzij `CLAWHUB_DISABLE_TELEMETRY=1` (legacy `CLAWDHUB_DISABLE_TELEMETRY=1`).
- Details: `docs/telemetry.md`.
