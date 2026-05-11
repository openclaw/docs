---
read_when:
    - De ClawHub CLI gebruiken
    - Fouten opsporen bij installeren, bijwerken, publiceren of synchroniseren
summary: 'CLI-referentie: opdrachten, vlaggen, configuratie, lockbestand, synchronisatiegedrag.'
x-i18n:
    generated_at: "2026-05-11T22:19:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: abbe12a07f8947f8c65ba6eaae6fa6ff7fb8bfb12fbcb339abccd12225a2e791
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

- `--workdir <dir>`: werkmap (standaard: cwd; valt terug op de Clawdbot-werkruimte indien geconfigureerd)
- `--dir <dir>`: installatiemap onder workdir (standaard: `skills`)
- `--site <url>`: basis-URL voor browserlogin (standaard: `https://clawhub.ai`)
- `--registry <url>`: API-basis-URL (standaard: ontdekt, anders `https://clawhub.ai`)
- `--no-input`: prompts uitschakelen

Equivalenten voor omgevingsvariabelen:

- `CLAWHUB_SITE` (verouderd `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (verouderd `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (verouderd `CLAWDHUB_WORKDIR`)

### HTTP-proxy

De CLI respecteert standaard HTTP-proxyomgevingsvariabelen voor systemen achter
bedrijfsproxy's of beperkte netwerken:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Wanneer een van deze variabelen is ingesteld, stuurt de CLI uitgaande aanvragen via
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
- Verouderde fallback: als `clawhub/config.json` nog niet bestaat maar `clawdhub/config.json` wel, hergebruikt de CLI het verouderde pad
- override: `CLAWHUB_CONFIG_PATH` (verouderd `CLAWDHUB_CONFIG_PATH`)

## Opdrachten

### `login` / `auth login`

- Standaard: opent de browser naar `<site>/cli/auth` en voltooit via loopback-callback.
- Headless: `clawhub login --token clh_...`
- Remote/headless interactief: `clawhub login --device` drukt een code af en wacht terwijl je deze autoriseert op `<site>/cli/device`.

### `whoami`

- Verifieert het opgeslagen token via `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Voegt een Skill toe aan je highlights of verwijdert deze.
- Roept `POST /api/v1/stars/<slug>` en `DELETE /api/v1/stars/<slug>` aan.
- `--yes` slaat bevestiging over.

### `search <query...>`

- Roept `/api/v1/search?q=...` aan.
- Zoeken geeft voorrang aan exacte overeenkomsten met slug-/naamtokens boven downloadpopulariteit. Een los slug-token zoals `map` komt sterker overeen met `personal-map` dan met de substring binnen `amap`.
- Downloads zijn een kleine populariteitsprior, geen garantie op de hoogste plaatsing.
- Als een Skill zou moeten verschijnen maar niet verschijnt, voer dan `clawhub inspect <slug>` uit terwijl je bent ingelogd om eigenaar-zichtbare moderatiediagnostiek te controleren voordat je metadata hernoemt.

### `explore`

- Vermeldt de nieuwste Skills via `/api/v1/skills?limit=...&sort=createdAt` (gesorteerd op `createdAt` aflopend).
- Vlaggen:
  - `--limit <n>` (1-200, standaard: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (standaard: newest)
  - `--json` (machineleesbare uitvoer)
- Uitvoer: `<slug>  v<version>  <age>  <summary>` (samenvatting afgekapt tot 50 tekens).

### `inspect <slug>`

- Haalt Skill-metadata en versiebestanden op zonder te installeren.
- `--version <version>`: inspecteer een specifieke versie (standaard: latest).
- `--tag <tag>`: inspecteer een getagde versie (bijv. `latest`).
- `--versions`: vermeld versiegeschiedenis (eerste pagina).
- `--limit <n>`: maximumaantal te vermelden versies (1-200).
- `--files`: vermeld bestanden voor de geselecteerde versie.
- `--file <path>`: haal ruwe bestandsinhoud op (alleen tekstbestanden; limiet van 200 KB).
- `--json`: machineleesbare uitvoer.

### `install <slug>`

- Bepaalt de nieuwste versie via `/api/v1/skills/<slug>`.
- Downloadt zip via `/api/v1/download`.
- Pakt uit naar `<workdir>/<dir>/<slug>`.
- Weigert vastgezette Skills te overschrijven; voer eerst `clawhub unpin <slug>` uit.
- Schrijft:
  - `<workdir>/.clawhub/lock.json` (verouderd `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (verouderd `.clawdhub`)

### `uninstall <slug>`

- Verwijdert `<workdir>/<dir>/<slug>` en verwijdert de lockfile-vermelding.
- Interactief: vraagt om bevestiging.
- Niet-interactief (`--no-input`): vereist `--yes`.

### `list`

- Leest `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`).
- Toont `pinned` naast skills die zijn bevroren met `clawhub pin`, inclusief de optionele reden.

### `pin <slug>`

- Markeert een geinstalleerde skill als vastgezet in het lockbestand.
- `--reason <text>` registreert waarom de skill is bevroren.
- Vastgezette skills worden overgeslagen door `update --all` en geweigerd door directe `update <slug>`.
- Vastgezette skills weigeren ook `install --force`, zodat de lokale bytes niet per ongeluk kunnen worden vervangen.

### `unpin <slug>`

- Verwijdert de pin uit het lockbestand van een geinstalleerde skill, zodat toekomstige updates deze kunnen wijzigen.

### `update [slug]` / `update --all`

- Berekent de fingerprint op basis van lokale bestanden.
- Als de fingerprint overeenkomt met een bekende versie: geen prompt.
- Als de fingerprint niet overeenkomt:
  - weigert standaard
  - overschrijft met `--force` (of prompt, indien interactief)
- Vastgezette skills worden nooit bijgewerkt door `--force`.
- `update <slug>` faalt snel voor vastgezette slugs en meldt dat je eerst `clawhub unpin <slug>` moet uitvoeren.
- `update --all` slaat vastgezette slugs over en drukt een samenvatting af van wat bevroren bleef.

### `skill publish <path>`

- Publiceert via `POST /api/v1/skills` (multipart).
- Vereist semver: `--version 1.2.3`.
- `--owner <handle>` publiceert onder een uitgever-handle van een organisatie/gebruiker wanneer de
  actor uitgeverstoegang heeft.
- `--migrate-owner` verplaatst een bestaande skill naar `--owner` terwijl een nieuwe
  versie wordt gepubliceerd. Vereist admin-/eigenaarstoegang op beide uitgevers.
- Eigenaar- en reviewgedrag wordt uitgelegd in `docs/publishing.md`.
- Een skill publiceren betekent dat deze onder `MIT-0` wordt uitgebracht op ClawHub.
- Gepubliceerde skills zijn vrij te gebruiken, wijzigen en herdistribueren zonder naamsvermelding.
- ClawHub ondersteunt geen betaalde skills of prijzen per skill.
- `--clawscan-note <text>` voegt een ClawScan-notitie toe. Deze notitie geeft ClawScan
  context voor gedrag dat er anders ongebruikelijk uit kan zien, zoals netwerktoegang,
  native hosttoegang of provider-specifieke referenties. De notitie wordt opgeslagen bij
  de gepubliceerde versie.
- Legacy alias: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- Verwijdert een skill zacht (eigenaar, moderator of admin).
- Roept `DELETE /api/v1/skills/{slug}` aan.
- Door eigenaar geinitieerde zachte verwijderingen reserveren de slug 30 dagen; de opdracht drukt de vervaltijd af.
- `--reason <text>` registreert een moderatienotitie op de skill en in het auditlogboek.
- `--note <text>` is een alias voor `--reason`.
- `--yes` slaat bevestiging over.

### `undelete <slug>`

- Herstelt een verborgen skill (eigenaar, moderator of admin).
- Roept `POST /api/v1/skills/{slug}/undelete` aan.
- `--reason <text>` registreert een moderatienotitie op de skill en in het auditlogboek.
- `--note <text>` is een alias voor `--reason`.
- `--yes` slaat bevestiging over.

### `hide <slug>`

- Verbergt een skill (eigenaar, moderator of admin).
- Alias voor `delete`.

### `unhide <slug>`

- Maakt een skill weer zichtbaar (eigenaar, moderator of admin).
- Alias voor `undelete`.

### `skill rename <slug> <new-slug>`

- Hernoemt een skill waarvan je eigenaar bent en behoudt de vorige slug als omleidingsalias.
- Roept `POST /api/v1/skills/{slug}/rename` aan.
- `--yes` slaat bevestiging over.

### `skill merge <source-slug> <target-slug>`

- Voegt een skill waarvan je eigenaar bent samen met een andere skill waarvan je eigenaar bent.
- De bronslug wordt niet meer openbaar vermeld en wordt een omleidingsalias naar het doel.
- Roept `POST /api/v1/skills/{sourceSlug}/merge` aan.
- `--yes` slaat bevestiging over.

### `transfer`

- Workflow voor eigendomsoverdracht.
- Overdrachten naar gebruikers-handles maken een verzoek in behandeling aan dat de ontvanger accepteert.
- Overdrachten naar org-/uitgever-handles worden alleen onmiddellijk toegepast wanneer de actor
  admintoegang heeft tot zowel de huidige eigenaar als de bestemmingsuitgever.
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
- Downloadt het artifact vanaf de `downloadUrl` van de resolver.
- Verifieert ClawHub SHA-256 voor alle artifacts.
- Voor ClawPack npm-pack-artifacts wordt ook npm `sha512`-integriteit,
  npm-shasum en de naam/versie in `package.json` van de tarball geverifieerd.
- Legacy ZIP-versies downloaden via de legacy ZIP-route.
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

- Berekent ClawHub SHA-256, npm `sha512`-integriteit en npm-shasum voor een lokaal
  artifact.
- Met `--package` wordt verwachte metadata van ClawHub opgelost en wordt het
  lokale bestand vergeleken met de gepubliceerde artifactmetadata.
- Met directe digest-vlaggen wordt geverifieerd zonder netwerklookup.
- Vlaggen:
  - `--package <name>`: pakketnaam om verwachte artifactmetadata op te lossen.
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

### `package delete <name>`

- Verwijdert een pakket en alle releases voorlopig.
- Vereist de pakketeigenaar, een eigenaar/beheerder van een organisatie-uitgever, platformmoderator
  of platformbeheerder.
- Vlaggen:
  - `--yes`: sla bevestiging over.
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Herstelt een voorlopig verwijderd pakket en releases.
- Vereist de pakketeigenaar, een eigenaar/beheerder van een organisatie-uitgever, platformmoderator
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
  tenzij uitgevoerd door een platformbeheerder.
- Pakketnamen met scope moeten worden overgedragen aan de eigenaar van de overeenkomende scope.
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

- Geauthenticeerde opdracht om een pakket aan moderators te rapporteren.
- Roept `POST /api/v1/packages/{name}/report` aan.
- Rapporten gelden op pakketniveau, zijn optioneel gekoppeld aan een versie en worden zichtbaar
  voor moderators ter beoordeling.
- Rapporten verbergen pakketten niet automatisch en blokkeren downloads niet uit zichzelf.
- Vlaggen:
  - `--version <version>`: optionele pakketversie om aan het rapport te koppelen.
  - `--reason <text>`: vereiste rapportreden.
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Eigenaarsopdracht om de moderatiezichtbaarheid van een pakket te controleren.
- Roept `GET /api/v1/packages/{name}/moderation` aan.
- Toont de huidige scansstatus van het pakket, het aantal open rapporten, de handmatige
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
- Rapporteert blokkades voor officiële status, ClawPack-beschikbaarheid, artifactdigest,
  bronherkomst, OpenClaw-compatibiliteit, hostdoelen, omgevingsmetadata
  en scanstatus.
- Vlaggen:
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Toont operatorgerichte migratiestatus voor een pakket dat mogelijk een
  meegeleverde OpenClaw-plugin vervangt.
- Roept hetzelfde berekende gereedheidseindpunt aan als `package readiness`, maar drukt
  migratiegerichte status, nieuwste versie, officiële pakketstatus, controles en
  blokkades af.
- Vlaggen:
  - `--json`: machineleesbare uitvoer.

Voorbeeld:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Publiceert een codeplugin of bundelplugin via `POST /api/v1/packages`.
- `<source>` accepteert:
  - Lokaal mappad: `./my-plugin`
  - Lokale ClawPack npm-pack-tarball: `./my-plugin-1.2.3.tgz`
  - GitHub-repo: `owner/repo` of `owner/repo@ref`
  - GitHub-URL: `https://github.com/owner/repo`
- Metadata wordt automatisch gedetecteerd uit `package.json`, `openclaw.plugin.json` en
  echte OpenClaw-bundelmarkeringen zoals `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` en `.cursor-plugin/plugin.json`.
- `.tgz`-bronnen worden behandeld als ClawPack. De CLI uploadt de exacte npm-pack-bytes
  en gebruikt de uitgepakte `package/`-inhoud alleen voor validatie en
  het vooraf invullen van metadata.
- Codepluginmappen worden vóór upload verpakt in een ClawPack npm-tarball, zodat
  OpenClaw-installaties het exacte artifact kunnen verifiëren. Bundelpluginmappen blijven
  het publicatiepad met uitgepakte bestanden gebruiken.
- Voor GitHub-bronnen wordt bronvermelding automatisch ingevuld op basis van de repo, opgeloste commit, ref en subpad.
- Voor lokale mappen wordt bronvermelding automatisch gedetecteerd uit lokale git wanneer de origin-remote naar GitHub wijst.
- Externe codeplugins moeten `openclaw.compat.pluginApi` en
  `openclaw.build.openclawVersion` expliciet declareren.
  `package.json.version` op hoofdniveau wordt niet gebruikt als fallback voor publicatievalidatie.
- `--dry-run` toont een voorbeeld van de opgeloste publicatiepayload zonder te uploaden.
- `--json` geeft machineleesbare uitvoer voor CI.
- `--owner <handle>` publiceert onder een gebruikers- of organisatie-uitgevershandle wanneer de actor uitgeverstoegang heeft.
- `--clawscan-note <text>` voegt een ClawScan-notitie toe. Deze notitie geeft ClawScan
  context voor gedrag dat er anders ongebruikelijk uit kan zien, zoals netwerktoegang,
  native hosttoegang of providerspecifieke referenties. De notitie wordt opgeslagen bij
  de gepubliceerde release.
- Pakketnamen met scope moeten overeenkomen met de geselecteerde eigenaar. Zie `docs/publishing.md`.
- Bestaande vlaggen (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) blijven werken als overschrijvingen.
- Privé-GitHub-repo's vereisen `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### Aanbevolen lokale flow

Gebruik eerst `--dry-run`, zodat je de opgeloste pakketmetadata en
bronvermelding kunt bevestigen voordat je een live release maakt:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Lokale mapflow

Voor codeplugins bouwt en uploadt publicatie vanuit een map een ClawPack-artifact uit
de pakketmap:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### Minimale `package.json` voor `--family code-plugin`

Externe codeplugins hebben een kleine hoeveelheid OpenClaw-metadata nodig in
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
  fallback voor OpenClaw-compatibiliteits-/buildvalidatie.
- `openclaw.hostTargets` en `openclaw.environment` zijn optionele metadata.
  ClawHub kan ze tonen wanneer ze aanwezig zijn, maar ze zijn niet vereist voor publicatie.
- `openclaw.compat.minGatewayVersion` en
  `openclaw.build.pluginSdkVersion` zijn optionele extra's als je
  gedetailleerdere compatibiliteitsmetadata wilt publiceren.
- Als je een oudere `clawhub` CLI-release gebruikt, upgrade dan vóór publicatie zodat
  de lokale preflightcontroles vóór upload worden uitgevoerd.

#### GitHub Actions

ClawHub levert ook een officiële herbruikbare workflow op
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/c51cfe2459f3482c315a7c8c71b2efd2637bb0e8/.github/workflows/package-publish.yml)
voor pluginrepo's.

Typische configuratie van de aanroeper:

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

- De herbruikbare workflow gebruikt standaard de aanroepende repo als `source`.
- Geef voor monorepo's `source_path` door zodat de workflow de pluginpakketmap
  publiceert, bijvoorbeeld `source_path: extensions/codex`.
- Pin de herbruikbare workflow aan een stabiele tag of volledige commit-SHA. Voer releasepublicatie niet uit vanaf `@main`.
- `pull_request` moet `dry_run: true` gebruiken zodat CI geen vervuiling veroorzaakt.
- Echte publicaties moeten beperkt blijven tot vertrouwde gebeurtenissen zoals `workflow_dispatch` of tagpushes.
- Vertrouwd publiceren zonder geheim werkt alleen op `workflow_dispatch`; tagpushes hebben nog steeds `clawhub_token` nodig.
- Houd `clawhub_token` beschikbaar voor eerste publicatie, niet-vertrouwde pakketten of noodpublicaties.
- De workflow uploadt het JSON-resultaat als artifact en stelt het beschikbaar als workflow-uitvoer.

### `sync`

- Scant op lokale skillmappen en publiceert nieuwe/gewijzigde exemplaren.
- Roots kunnen elke map zijn: een Skills-map of één skillmap met `SKILL.md`.
- Voegt automatisch Clawdbot-skillroots toe wanneer `~/.clawdbot/clawdbot.json` aanwezig is:
  - `agent.workspace/skills` (hoofdagent)
  - `routing.agents.*.workspace/skills` (per agent)
  - `~/.clawdbot/skills` (gedeeld)
  - `skills.load.extraDirs` (gedeelde pakketten)
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
