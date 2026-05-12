---
read_when:
    - De ClawHub CLI gebruiken
    - Installatie, update, publicatie of synchronisatie debuggen
summary: 'CLI-referentie: opdrachten, flags, configuratie, lockfile, synchronisatiegedrag.'
x-i18n:
    generated_at: "2026-05-12T23:28:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3600e5539372490924ee884c03d2417b80d25aab519d8260897b2268c2f7b46
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

Verifieer het daarna:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Globale vlaggen

- `--workdir <dir>`: werkdirectory (standaard: cwd; valt terug op de Clawdbot-werkruimte indien geconfigureerd)
- `--dir <dir>`: installatiedirectory onder workdir (standaard: `skills`)
- `--site <url>`: basis-URL voor browserlogin (standaard: `https://clawhub.ai`)
- `--registry <url>`: API-basis-URL (standaard: gedetecteerd, anders `https://clawhub.ai`)
- `--no-input`: prompts uitschakelen

Equivalenten in omgevingsvariabelen:

- `CLAWHUB_SITE` (legacy `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (legacy `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (legacy `CLAWDHUB_WORKDIR`)

### HTTP-proxy

De CLI respecteert standaard HTTP-proxyomgevingsvariabelen voor systemen achter
bedrijfsproxy's of beperkte netwerken:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Wanneer een van deze variabelen is ingesteld, routeert de CLI uitgaande verzoeken via
de opgegeven proxy. `HTTPS_PROXY` wordt gebruikt voor HTTPS-verzoeken, `HTTP_PROXY`
voor gewoon HTTP. `NO_PROXY` / `no_proxy` wordt gerespecteerd om de proxy te omzeilen voor
specifieke hosts of domeinen.

Dit is vereist op systemen waar directe uitgaande verbindingen worden geblokkeerd
(bijv. Docker-containers, Hetzner-VPS met uitsluitend internet via proxy, bedrijfsfirewalls).

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
- Legacy fallback: als `clawhub/config.json` nog niet bestaat maar `clawdhub/config.json` wel, hergebruikt de CLI het legacy pad
- override: `CLAWHUB_CONFIG_PATH` (legacy `CLAWDHUB_CONFIG_PATH`)

## Opdrachten

### `login` / `auth login`

- Standaard: opent de browser naar `<site>/cli/auth` en voltooit via een loopback-callback.
- Headless: `clawhub login --token clh_...`
- Interactief op afstand/headless: `clawhub login --device` drukt een code af en wacht terwijl je deze autoriseert op `<site>/cli/device`.

### `whoami`

- Verifieert het opgeslagen token via `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Voegt een skill toe aan of verwijdert die uit je hoogtepunten.
- Roept `POST /api/v1/stars/<slug>` en `DELETE /api/v1/stars/<slug>` aan.
- `--yes` slaat bevestiging over.

### `search <query...>`

- Roept `/api/v1/search?q=...` aan.
- Zoeken geeft de voorkeur aan exacte tokenmatches voor slug/naam boven downloadpopulariteit. Een los slug-token zoals `map` matcht sterker met `personal-map` dan met de substring binnen `amap`.
- Downloads vormen een kleine populariteitsprior, geen garantie op de hoogste plaatsing.
- Als een skill zou moeten verschijnen maar dat niet doet, voer dan `clawhub inspect <slug>` uit terwijl je bent ingelogd om voor de eigenaar zichtbare moderatiediagnostiek te controleren voordat je metadata hernoemt.

### `explore`

- Toont nieuwste skills via `/api/v1/skills?limit=...&sort=createdAt` (gesorteerd op `createdAt` aflopend).
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
- `--limit <n>`: maximaal aantal te tonen versies (1-200).
- `--files`: toon bestanden voor de geselecteerde versie.
- `--file <path>`: haal ruwe bestandsinhoud op (alleen tekstbestanden; limiet 200 KB).
- `--json`: machineleesbare uitvoer.

### `install <slug>`

- Lost de nieuwste versie op via `/api/v1/skills/<slug>`.
- Downloadt zip via `/api/v1/download`.
- Pakt uit naar `<workdir>/<dir>/<slug>`.
- Weigert vastgezette skills te overschrijven; voer eerst `clawhub unpin <slug>` uit.
- Schrijft:
  - `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

### `uninstall <slug>`

- Verwijdert `<workdir>/<dir>/<slug>` en verwijdert de lockfile-vermelding.
- Interactief: vraagt om bevestiging.
- Niet-interactief (`--no-input`): vereist `--yes`.

### `list`

- Leest `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`).
- Toont `pinned` naast skills die zijn bevroren met `clawhub pin`, inclusief de optionele reden.

### `pin <slug>`

- Markeert een geinstalleerde skill als vastgezet in het lockfile.
- `--reason <text>` legt vast waarom de skill is bevroren.
- Vastgezette skills worden overgeslagen door `update --all` en geweigerd door directe `update <slug>`.
- Vastgezette skills weigeren ook `install --force`, zodat de lokale bytes niet per ongeluk kunnen worden vervangen.

### `unpin <slug>`

- Verwijdert de lockfile-pin van een geinstalleerde skill zodat toekomstige updates deze kunnen wijzigen.

### `update [slug]` / `update --all`

- Berekent de fingerprint op basis van lokale bestanden.
- Als de fingerprint overeenkomt met een bekende versie: geen prompt.
- Als de fingerprint niet overeenkomt:
  - weigert standaard
  - overschrijft met `--force` (of prompt, indien interactief)
- Vastgezette skills worden nooit bijgewerkt door `--force`.
- `update <slug>` faalt snel voor vastgezette slugs en zegt dat je eerst `clawhub unpin <slug>` moet uitvoeren.
- `update --all` slaat vastgezette slugs over en drukt een samenvatting af van wat bevroren bleef.

### `skill publish <path>`

- Publiceert via `POST /api/v1/skills` (multipart).
- Vereist semver: `--version 1.2.3`.
- `--owner <handle>` publiceert onder een publisher-handle van een org/gebruiker wanneer de
  actor publishertoegang heeft.
- `--migrate-owner` verplaatst een bestaande skill naar `--owner` terwijl een nieuwe
  versie wordt gepubliceerd. Vereist beheerders-/eigenaarstoegang op beide publishers.
- Gedrag rond eigenaar en beoordeling wordt uitgelegd in `docs/publishing.md`.
- Een skill publiceren betekent dat deze onder `MIT-0` wordt uitgebracht op ClawHub.
- Gepubliceerde skills mogen vrij worden gebruikt, gewijzigd en opnieuw verspreid zonder naamsvermelding.
- ClawHub ondersteunt geen betaalde skills of prijzen per skill.
- `--clawscan-note <text>` voegt een ClawScan-notitie toe. Deze notitie geeft ClawScan
  context voor gedrag dat anders ongebruikelijk kan lijken, zoals netwerktoegang,
  toegang tot de native host of providerspecifieke referenties. De notitie wordt opgeslagen bij
  de gepubliceerde versie.
- Legacy alias: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- Soft-delete een skill (eigenaar, moderator of beheerder).
- Roept `DELETE /api/v1/skills/{slug}` aan.
- Door de eigenaar geinitieerde soft deletes reserveren de slug 30 dagen; de opdracht drukt de vervaltijd af.
- `--reason <text>` legt een moderatienotitie vast op de skill en in het auditlogboek.
- `--note <text>` is een alias voor `--reason`.
- `--yes` slaat bevestiging over.

### `undelete <slug>`

- Herstelt een verborgen skill (eigenaar, moderator of beheerder).
- Roept `POST /api/v1/skills/{slug}/undelete` aan.
- `--reason <text>` legt een moderatienotitie vast op de skill en in het auditlogboek.
- `--note <text>` is een alias voor `--reason`.
- `--yes` slaat bevestiging over.

### `hide <slug>`

- Verbergt een skill (eigenaar, moderator of beheerder).
- Alias voor `delete`.

### `unhide <slug>`

- Maakt een skill weer zichtbaar (eigenaar, moderator of beheerder).
- Alias voor `undelete`.

### `skill rename <slug> <new-slug>`

- Hernoemt een skill waarvan je eigenaar bent en behoudt de vorige slug als redirect-alias.
- Roept `POST /api/v1/skills/{slug}/rename` aan.
- `--yes` slaat bevestiging over.

### `skill merge <source-slug> <target-slug>`

- Voegt een skill waarvan je eigenaar bent samen met een andere skill waarvan je eigenaar bent.
- De bron-slug wordt niet langer openbaar vermeld en wordt een redirect-alias naar het doel.
- Roept `POST /api/v1/skills/{sourceSlug}/merge` aan.
- `--yes` slaat bevestiging over.

### `transfer`

- Workflow voor eigendomsoverdracht.
- Overdrachten naar gebruikershandles maken een openstaand verzoek dat de ontvanger accepteert.
- Overdrachten naar org-/publisher-handles worden alleen onmiddellijk toegepast wanneer de actor
  beheerderstoegang heeft tot zowel de huidige eigenaar als de doelpublisher.
- Subopdrachten:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- Endpoints:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Bladert door of zoekt in de uniforme pakketcatalogus via `GET /api/v1/packages` en `GET /api/v1/packages/search`.
- Gebruik dit voor plugins en andere pakketfamilie-items; `search` op topniveau blijft het zoekoppervlak voor skills.
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
- Gebruik dit voor Plugin-metadata, compatibiliteit, verificatie, bron en versie-/bestandsinspectie.
- `--version <version>`: inspecteer een specifieke versie (standaard: nieuwste).
- `--tag <tag>`: inspecteer een getagde versie (bijv. `latest`).
- `--versions`: vermeld versiegeschiedenis (eerste pagina).
- `--limit <n>`: maximumaantal te vermelden versies (1-100).
- `--files`: vermeld bestanden voor de geselecteerde versie.
- `--file <path>`: haal ruwe bestandsinhoud op (alleen tekstbestanden; limiet van 200KB).
- `--json`: machineleesbare uitvoer.

### `package download <name>`

- Lost een pakketversie op via
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Downloadt het artifact vanaf de `downloadUrl` van de resolver.
- Verifieert ClawHub SHA-256 voor alle artifacts.
- Voor ClawPack npm-pack-artifacts wordt ook npm `sha512`-integriteit,
  npm shasum en de naam/versie in `package.json` van de tarball geverifieerd.
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

- Berekent ClawHub SHA-256, npm `sha512`-integriteit en npm shasum voor een lokaal
  artifact.
- Met `--package` wordt de verwachte metadata uit ClawHub opgelost en wordt het
  lokale bestand vergeleken met de gepubliceerde artifactmetadata.
- Met directe digest-vlaggen wordt geverifieerd zonder netwerklookup.
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

- Verwijdert een pakket en alle releases met soft-delete.
- Vereist de pakketeigenaar, een eigenaar/beheerder van de organisatie-uitgever, platformmoderator,
  of platformbeheerder.
- Flags:
  - `--yes`: bevestiging overslaan.
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Herstelt een pakket en releases die met soft-delete zijn verwijderd.
- Vereist de pakketeigenaar, een eigenaar/beheerder van de organisatie-uitgever, platformmoderator,
  of platformbeheerder.
- Roept `POST /api/v1/packages/{name}/undelete` aan.
- Flags:
  - `--yes`: bevestiging overslaan.
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Draagt een pakket over aan een andere uitgever.
- Vereist beheerderstoegang tot zowel de huidige pakketeigenaar als de doeluitgever,
  tenzij uitgevoerd door een platformbeheerder.
- Pakketnamen met een scope moeten worden overgedragen aan de bijpassende scope-eigenaar.
- Roept `POST /api/v1/packages/{name}/transfer` aan.
- Flags:
  - `--to <owner>`: handle van de doeluitgever.
  - `--reason <text>`: optionele auditreden.
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Geauthenticeerde opdracht om een pakket aan moderators te melden.
- Roept `POST /api/v1/packages/{name}/report` aan.
- Meldingen zijn op pakketniveau, kunnen optioneel aan een versie zijn gekoppeld, en worden zichtbaar
  voor moderators ter beoordeling.
- Meldingen verbergen pakketten niet automatisch en blokkeren zelf geen downloads.
- Flags:
  - `--version <version>`: optionele pakketversie om aan de melding te koppelen.
  - `--reason <text>`: vereiste reden voor de melding.
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Opdracht voor eigenaren om de moderatiezichtbaarheid van pakketten te controleren.
- Roept `GET /api/v1/packages/{name}/moderation` aan.
- Toont de huidige scanstatus van het pakket, het aantal openstaande meldingen, de handmatige
  moderatiestatus van de nieuwste release, de downloadblokkeringsstatus en moderatieredenen.
- Flags:
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Controleert of een pakket gereed is voor toekomstig gebruik door OpenClaw.
- Roept `GET /api/v1/packages/{name}/readiness` aan.
- Rapporteert blokkades voor officiële status, ClawPack-beschikbaarheid, artefactdigest,
  bronherkomst, OpenClaw-compatibiliteit, hostdoelen, omgevingsmetadata,
  en scanstatus.
- Flags:
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Toont operatorgerichte migratiestatus voor een pakket dat een
  gebundelde OpenClaw-Plugin kan vervangen.
- Roept hetzelfde berekende gereedheidseindpunt aan als `package readiness`, maar toont
  migratiegerichte status, nieuwste versie, status als officieel pakket, controles en
  blokkades.
- Flags:
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Publiceert een code-Plugin of bundel-Plugin via `POST /api/v1/packages`.
- `<source>` accepteert:
  - Lokaal mappad: `./my-plugin`
  - Lokale ClawPack npm-pack-tarball: `./my-plugin-1.2.3.tgz`
  - GitHub-repository: `owner/repo` of `owner/repo@ref`
  - GitHub-URL: `https://github.com/owner/repo`
- Metadata worden automatisch gedetecteerd uit `package.json`, `openclaw.plugin.json`, en
  echte OpenClaw-bundelmarkeringen zoals `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json`, en `.cursor-plugin/plugin.json`.
- `.tgz`-bronnen worden behandeld als ClawPack. De CLI uploadt de exacte npm-pack-
  bytes en gebruikt de uitgepakte `package/`-inhoud alleen voor validatie en
  het vooraf invullen van metadata.
- Code-Plugin-mappen worden vóór upload verpakt in een ClawPack-npm-tarball, zodat
  OpenClaw-installaties het exacte artefact kunnen verifiëren. Bundel-Plugin-mappen blijven
  het publicatiepad met uitgepakte bestanden gebruiken.
- Voor GitHub-bronnen wordt bronvermelding automatisch ingevuld vanuit de repository, opgeloste commit, ref en subpad.
- Voor lokale mappen wordt bronvermelding automatisch gedetecteerd vanuit lokale git wanneer de origin-remote naar GitHub wijst.
- Externe code-Plugins moeten `openclaw.compat.pluginApi` en
  `openclaw.build.openclawVersion` expliciet declareren.
  `package.json.version` op het hoogste niveau wordt niet gebruikt als fallback voor publicatievalidatie.
- `--dry-run` toont een voorbeeld van de opgeloste publicatiepayload zonder te uploaden.
- `--json` geeft machineleesbare uitvoer voor CI.
- `--owner <handle>` publiceert onder een gebruikers- of organisatie-uitgevershandle wanneer de actor uitgeverstoegang heeft.
- `--clawscan-note <text>` voegt een ClawScan-notitie toe. Deze notitie geeft ClawScan
  context voor gedrag dat anders ongebruikelijk kan lijken, zoals netwerktoegang,
  native hosttoegang, of providerspecifieke referenties. De notitie wordt opgeslagen op
  de gepubliceerde release.
- Pakketnamen met een scope moeten overeenkomen met de geselecteerde eigenaar. Zie `docs/publishing.md`.
- Bestaande flags (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) blijven werken als overrides.
- Privé-GitHub-repositories vereisen `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### Aanbevolen lokale flow

Gebruik eerst `--dry-run`, zodat je de opgeloste pakketmetadata en
bronvermelding kunt bevestigen voordat je een live release aanmaakt:

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
`package.json`. Dit minimale manifest is voldoende voor een geslaagde publicatie:

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

- `package.json.version` is de releaseversie van je pakket, maar wordt niet gebruikt als
  fallback voor compatibiliteits-/buildvalidatie van OpenClaw.
- `openclaw.hostTargets` en `openclaw.environment` zijn optionele metadata.
  ClawHub kan ze tonen wanneer ze aanwezig zijn, maar ze zijn niet vereist voor publicatie.
- `openclaw.compat.minGatewayVersion` en
  `openclaw.build.pluginSdkVersion` zijn optionele extra's als je
  gedetailleerdere compatibiliteitsmetadata wilt publiceren.
- Als je een oudere `clawhub` CLI-release gebruikt, upgrade dan vóór publicatie, zodat
  de lokale preflightcontroles vóór upload worden uitgevoerd.

#### GitHub Actions

ClawHub levert ook een officiële herbruikbare workflow op
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/af96221ebb197e2af09f44870046ced4ded4aea0/.github/workflows/package-publish.yml)
voor Plugin-repositories.

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

- De herbruikbare workflow gebruikt standaard de caller-repository als `source`.
- Geef voor monorepositories `source_path` door, zodat de workflow de Plugin-
  pakketmap publiceert, bijvoorbeeld `source_path: extensions/codex`.
- Pin de herbruikbare workflow op een stabiele tag of volledige commit-SHA. Voer releasepublicatie niet uit vanaf `@main`.
- `pull_request` moet `dry_run: true` gebruiken, zodat CI geen vervuiling veroorzaakt.
- Echte publicaties moeten beperkt blijven tot vertrouwde events zoals `workflow_dispatch` of tagpushes.
- Vertrouwd publiceren zonder secret werkt alleen op `workflow_dispatch`; tagpushes hebben nog steeds `clawhub_token` nodig.
- Houd `clawhub_token` beschikbaar voor de eerste publicatie, niet-vertrouwde pakketten of noodpublicaties.
- De workflow uploadt het JSON-resultaat als artefact en stelt het beschikbaar als workflow-uitvoer.

### `sync`

- Scant naar lokale Skills-mappen en publiceert nieuwe/gewijzigde mappen.
- Roots kunnen elke map zijn: een Skills-map of één Skills-map met `SKILL.md`.
- Voegt automatisch Clawdbot-Skills-roots toe wanneer `~/.clawdbot/clawdbot.json` aanwezig is:
  - `agent.workspace/skills` (hoofdagent)
  - `routing.agents.*.workspace/skills` (per agent)
  - `~/.clawdbot/skills` (gedeeld)
  - `skills.load.extraDirs` (gedeelde pakketten)
- Respecteert `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` en `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- Flags:
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
