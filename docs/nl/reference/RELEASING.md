---
read_when:
    - Zoeken naar definities van openbare releasekanalen
    - Releasevalidatie of pakketacceptatie uitvoeren
    - Zoeken naar versienaamgeving en cadans
summary: Release-trajecten, operatorcontrolelijst, validatieboxen, versienaamgeving en cadans
title: Releasebeleid
x-i18n:
    generated_at: "2026-05-01T11:21:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfe579099a9580e2d0400cd0b24f26d3fa3ee917899423604ebc13aa2519b4ee
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw heeft drie openbare releasekanalen:

- stable: getagde releases die standaard naar npm `beta` publiceren, of naar npm `latest` wanneer dit expliciet wordt gevraagd
- beta: prerelease-tags die naar npm `beta` publiceren
- dev: de bewegende kop van `main`

## Versienaamgeving

- Stabiele releaseversie: `YYYY.M.D`
  - Git-tag: `vYYYY.M.D`
- Stabiele correctiereleaseversie: `YYYY.M.D-N`
  - Git-tag: `vYYYY.M.D-N`
- Beta-prereleaseversie: `YYYY.M.D-beta.N`
  - Git-tag: `vYYYY.M.D-beta.N`
- Voeg geen voorloopnul toe aan maand of dag
- `latest` betekent de huidige gepromote stabiele npm-release
- `beta` betekent het huidige beta-installatiedoel
- Stabiele en stabiele correctiereleases publiceren standaard naar npm `beta`; releasebeheerders kunnen expliciet `latest` targeten, of later een gecontroleerde beta-build promoveren
- Elke stabiele OpenClaw-release levert het npm-pakket en de macOS-app samen uit;
  beta-releases valideren en publiceren normaal eerst het npm-/pakketpad, waarbij
  bouwen/ondertekenen/notariseren van de mac-app voor stable is gereserveerd, tenzij expliciet gevraagd

## Releaseritme

- Releases gaan beta-eerst
- Stable volgt pas nadat de nieuwste beta is gevalideerd
- Beheerders maken releases normaal vanaf een `release/YYYY.M.D`-branch die is gemaakt
  vanaf de huidige `main`, zodat releasevalidatie en fixes nieuwe
  ontwikkeling op `main` niet blokkeren
- Als een beta-tag is gepusht of gepubliceerd en een fix nodig heeft, maken beheerders
  de volgende `-beta.N`-tag in plaats van de oude beta-tag te verwijderen of opnieuw te maken
- Gedetailleerde releaseprocedure, goedkeuringen, inloggegevens en herstelnotities zijn
  alleen voor beheerders

## Checklist voor releasebeheerders

Deze checklist is de openbare vorm van de releaseflow. Privé-inloggegevens,
ondertekening, notarisatie, dist-tag-herstel en details voor noodrollback blijven in
het release-runbook dat alleen voor beheerders is.

1. Begin vanaf de huidige `main`: pull de nieuwste versie, bevestig dat de doelcommit is gepusht,
   en bevestig dat de huidige `main`-CI groen genoeg is om er een branch van te maken.
2. Herschrijf de bovenste sectie van `CHANGELOG.md` vanuit de echte commitgeschiedenis met
   `/changelog`, houd vermeldingen gebruikersgericht, commit dit, push dit, en rebase/pull
   nog een keer voordat je een branch maakt.
3. Controleer releasecompatibiliteitsrecords in
   `src/plugins/compat/registry.ts` en
   `src/commands/doctor/shared/deprecation-compat.ts`. Verwijder verlopen
   compatibiliteit alleen wanneer het upgradepad gedekt blijft, of leg vast waarom deze
   bewust wordt behouden.
4. Maak `release/YYYY.M.D` vanaf de huidige `main`; doe normaal releasewerk niet
   rechtstreeks op `main`.
5. Verhoog elke vereiste versielocatie voor de bedoelde tag, en voer daarna de
   lokale deterministische voorcontrole uit:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, en `pnpm release:check`.
6. Voer `OpenClaw NPM Release` uit met `preflight_only=true`. Voordat er een tag bestaat,
   is een volledige release-branch-SHA van 40 tekens toegestaan voor een voorcontrole
   alleen voor validatie. Bewaar de geslaagde `preflight_run_id`.
7. Start alle pre-releasetests met `Full Release Validation` voor de
   release-branch, tag of volledige commit-SHA. Dit is het ene handmatige ingangspunt
   voor de vier grote release-testboxen: Vitest, Docker, QA Lab en Package.
8. Als validatie faalt, fix dit op de release-branch en voer opnieuw het kleinste gefaalde
   bestand, kanaal, workflowjob, pakketprofiel, provider of model-allowlist uit dat
   de fix bewijst. Voer de volledige overkoepelende validatie alleen opnieuw uit wanneer het gewijzigde oppervlak
   eerder bewijs verouderd maakt.
9. Voor beta: tag `vYYYY.M.D-beta.N`, publiceer met npm-dist-tag `beta`, en voer daarna
   post-publish-pakketacceptatie uit tegen het gepubliceerde `openclaw@YYYY.M.D-beta.N`
   of `openclaw@beta`-pakket. Als een gepushte of gepubliceerde beta een fix nodig heeft, maak
   de volgende `-beta.N`; verwijder of herschrijf de oude beta niet.
10. Voor stable: ga alleen verder nadat de gecontroleerde beta of release candidate het
    vereiste validatiebewijs heeft. Stable npm-publicatie hergebruikt het geslaagde
    voorcontrole-artefact via `preflight_run_id`; gereedheid voor een stable macOS-release
    vereist ook de verpakte `.zip`, `.dmg`, `.dSYM.zip` en bijgewerkte
    `appcast.xml` op `main`.
11. Voer na publicatie de npm-post-publish-verificatie uit, optionele standalone
    gepubliceerde-npm Telegram E2E wanneer je kanaalbewijs na publicatie nodig hebt,
    dist-tag-promotie wanneer nodig, GitHub-release-/prerelease-notities uit de
    volledige overeenkomende `CHANGELOG.md`-sectie, en de stappen voor de releaseaankondiging.

## Releasevoorcontrole

- Voer `pnpm check:test-types` uit vóór de release-preflight, zodat test-TypeScript
  gedekt blijft buiten de snellere lokale `pnpm check`-gate
- Voer `pnpm check:architecture` uit vóór de release-preflight, zodat de bredere
  importcyclus- en architectuurgrenscontroles groen zijn buiten de snellere lokale gate
- Voer `pnpm build && pnpm ui:build` uit vóór `pnpm release:check`, zodat de verwachte
  `dist/*`-releaseartefacten en de Control UI-bundel bestaan voor de
  pack-validatiestap
- Voer de handmatige `Full Release Validation`-workflow uit vóór releasegoedkeuring om
  alle pre-release-testboxen vanuit één ingangspunt te starten. Deze accepteert een branch,
  tag of volledige commit-SHA, start handmatig `CI`, en start
  `OpenClaw Release Checks` voor installatiesmoke, pakketacceptatie, Docker
  releasepad-suites, live/E2E, OpenWebUI, QA Lab-pariteit, Matrix- en Telegram-lanes.
  Geef `npm_telegram_package_spec` alleen op nadat een pakket is
  gepubliceerd en de post-publish Telegram E2E ook moet worden uitgevoerd. Geef
  `evidence_package_spec` op wanneer het private bewijsrapport moet aantonen dat de
  validatie overeenkomt met een gepubliceerd npm-pakket zonder Telegram E2E af te dwingen.
  Voorbeeld:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Voer de handmatige `Package Acceptance`-workflow uit wanneer je nevenkanaalbewijs wilt
  voor een pakketkandidaat terwijl releasewerk doorgaat. Gebruik `source=npm` voor
  `openclaw@beta`, `openclaw@latest`, of een exacte releaseversie; `source=ref`
  om een vertrouwde `package_ref`-branch/tag/SHA te packen met de huidige
  `workflow_ref`-harness; `source=url` voor een HTTPS-tarball met een vereiste
  SHA-256; of `source=artifact` voor een tarball die door een andere GitHub
  Actions-run is geüpload. De workflow herleidt de kandidaat tot
  `package-under-test`, hergebruikt de Docker E2E-releaseplanner tegen die
  tarball, en kan Telegram QA uitvoeren tegen dezelfde tarball met
  `telegram_mode=mock-openai` of `telegram_mode=live-frontier`. Wanneer de
  geselecteerde Docker-lanes `published-upgrade-survivor` bevatten, is het
  pakketartefact de kandidaat en selecteert `published_upgrade_survivor_baseline`
  de gepubliceerde baseline.
  Voorbeeld: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Veelgebruikte profielen:
  - `smoke`: install/channel/agent-, gatewaynetwerk- en config-herlaadlanes
  - `package`: artefact-native pakket/update/Plugin-lanes zonder OpenWebUI of live ClawHub
  - `product`: pakketprofiel plus MCP-kanalen, cron/subagent-opschoning,
    OpenAI-webzoekactie en OpenWebUI
  - `full`: Docker-releasepadchunks met OpenWebUI
  - `custom`: exacte `docker_lanes`-selectie voor een gerichte herhaling
- Voer de handmatige `CI`-workflow rechtstreeks uit wanneer je alleen volledige normale CI-dekking
  nodig hebt voor de releasekandidaat. Handmatige CI-dispatches omzeilen changed
  scoping en forceren de Linux Node-shards, gebundelde-Plugin-shards, kanaalcontracten,
  Node 22-compatibiliteit, `check`, `check-additional`, buildsmoke,
  docs-controles, Python Skills, Windows, macOS, Android en Control UI i18n-lanes.
  Voorbeeld: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Voer `pnpm qa:otel:smoke` uit bij het valideren van releasetelemetrie. Dit oefent
  QA-lab via een lokale OTLP/HTTP-ontvanger en verifieert de geëxporteerde trace
  span-namen, begrensde attributen en inhoud-/identifier-redactie zonder
  Opik, Langfuse of een andere externe collector te vereisen.
- Voer `pnpm release:check` uit vóór elke getagde release
- Releasecontroles draaien nu in een aparte handmatige workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` voert ook de QA Lab mock-pariteitsgate plus het snelle
  live Matrix-profiel en de Telegram QA-lane uit vóór releasegoedkeuring. De live
  lanes gebruiken de `qa-live-shared`-omgeving; Telegram gebruikt ook Convex CI
  credentialleases. Voer de handmatige `QA-Lab - All Lanes`-workflow uit met
  `matrix_profile=all` en `matrix_shards=true` wanneer je volledige Matrix
  transport-, media- en E2EE-inventaris parallel wilt.
- Cross-OS-installatie- en upgraderuntimevalidatie maakt deel uit van openbare
  `OpenClaw Release Checks` en `Full Release Validation`, die de
  herbruikbare workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` rechtstreeks aanroepen
- Deze splitsing is opzettelijk: houd het echte npm-releasepad kort,
  deterministisch en artefactgericht, terwijl tragere live-controles in hun
  eigen lane blijven, zodat ze publiceren niet vertragen of blokkeren
- Releasecontroles met secrets moeten worden gestart via `Full Release
Validation` of vanuit de `main`/release-workflow-ref, zodat workflowlogica en
  secrets gecontroleerd blijven
- `OpenClaw Release Checks` accepteert een branch, tag of volledige commit-SHA zolang
  de herleide commit bereikbaar is vanuit een OpenClaw-branch of releasetag
- De validation-only preflight van `OpenClaw NPM Release` accepteert ook de huidige
  volledige 40-tekens workflow-branch-commit-SHA zonder een gepushte tag te vereisen
- Dat SHA-pad is alleen voor validatie en kan niet worden gepromoveerd naar een echte publicatie
- In SHA-modus synthetiseert de workflow `v<package.json version>` alleen voor de
  pakketmetadatacontrole; echt publiceren vereist nog steeds een echte releasetag
- Beide workflows houden het echte publicatie- en promotiepad op GitHub-hosted
  runners, terwijl het niet-mutatieve validatiepad de grotere
  Blacksmith Linux-runners kan gebruiken
- Die workflow voert
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  uit met zowel `OPENAI_API_KEY` als `ANTHROPIC_API_KEY`-workflowsecrets
- npm-releasepreflight wacht niet langer op de aparte releasecontrolelane
- Voer `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  uit (of de overeenkomstige beta-/correctietag) vóór goedkeuring
- Voer na npm-publicatie
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  uit (of de overeenkomstige beta-/correctieversie) om het gepubliceerde registry
  installatiepad in een verse tijdelijke prefix te verifiëren
- Voer na een betapublicatie `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  uit om installed-package onboarding, Telegram-configuratie en echte Telegram E2E
  tegen het gepubliceerde npm-pakket te verifiëren met de gedeelde geleasede Telegram-credentialpool.
  Lokale eenmalige maintainer-runs mogen de Convex-vars weglaten en de drie
  `OPENCLAW_QA_TELEGRAM_*`-env-credentials rechtstreeks doorgeven.
- Maintainers kunnen dezelfde post-publish-controle vanuit GitHub Actions uitvoeren via de
  handmatige `NPM Telegram Beta E2E`-workflow. Deze is bewust alleen handmatig en
  draait niet bij elke merge.
- Maintainer-releaseautomatisering gebruikt nu preflight-dan-promote:
  - echte npm-publicatie moet slagen met een succesvolle npm `preflight_run_id`
  - de echte npm-publicatie moet worden gestart vanaf dezelfde `main`- of
    `release/YYYY.M.D`-branch als de succesvolle preflight-run
  - stabiele npm-releases staan standaard op `beta`
  - stabiele npm-publicatie kan expliciet op `latest` worden gericht via workflowinvoer
  - token-gebaseerde npm dist-tag-mutatie leeft nu in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    om veiligheidsredenen, omdat `npm dist-tag add` nog steeds `NPM_TOKEN` nodig heeft terwijl de
    openbare repo OIDC-only publicatie behoudt
  - openbare `macOS Release` is alleen validatie; wanneer een tag alleen op een
    releasebranch staat maar de workflow vanaf `main` wordt gestart, stel dan
    `public_release_branch=release/YYYY.M.D` in
  - echte private mac-publicatie moet slagen met succesvolle private mac
    `preflight_run_id` en `validate_run_id`
  - de echte publicatiepaden promoten voorbereide artefacten in plaats van ze opnieuw te bouwen
- Voor stabiele correctiereleases zoals `YYYY.M.D-N` controleert de post-publish-verifier
  ook hetzelfde temp-prefix-upgradepad van `YYYY.M.D` naar `YYYY.M.D-N`,
  zodat releasecorrecties oudere globale installaties niet stilletjes op de
  basis-stabiele payload kunnen laten staan
- npm-releasepreflight faalt gesloten tenzij de tarball zowel
  `dist/control-ui/index.html` als een niet-lege `dist/control-ui/assets/`-payload bevat,
  zodat we niet opnieuw een leeg browserdashboard shippen
- Post-publish-verificatie controleert ook dat de gepubliceerde registry-installatie
  niet-lege gebundelde Plugin-runtime-deps bevat onder de root `dist/*`-layout.
  Een release die met ontbrekende of lege gebundelde Plugin-dependencypayloads shipt,
  faalt de postpublish-verifier en kan niet naar `latest` worden gepromoveerd.
- `pnpm test:install:smoke` handhaaft ook het npm pack `unpackedSize`-budget op
  de kandidaat-updatetarball, zodat installer-e2e onbedoelde pack-bloat opvangt
  vóór het releasepublicatiepad
- Als het releasewerk CI-planning, extensietimingmanifests of
  extensietestmatrices raakte, regenereer en review dan de door de planner beheerde
  `plugin-prerelease-extension-shard`-matrixoutputs uit
  `.github/workflows/plugin-prerelease.yml` vóór goedkeuring, zodat releasenotes geen
  verouderde CI-layout beschrijven
- Gereedheid voor stabiele macOS-releases omvat ook de updater-oppervlakken:
  - de GitHub-release moet uiteindelijk de verpakte `.zip`, `.dmg` en `.dSYM.zip` bevatten
  - `appcast.xml` op `main` moet na publicatie naar de nieuwe stabiele zip verwijzen
  - de verpakte app moet een non-debug bundle-id, een niet-lege Sparkle-feed
    URL, en een `CFBundleVersion` op of boven de canonieke Sparkle-buildvloer
    voor die releaseversie behouden

## Releasetestboxen

`Full Release Validation` is hoe operators alle pre-release-tests vanuit
één ingangspunt starten. Voer deze uit vanaf de vertrouwde `main`-workflow-ref en geef de release
branch, tag of volledige commit-SHA door als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

De workflow herleidt de doel-ref, start handmatige `CI` met
`target_ref=<release-ref>`, start `OpenClaw Release Checks`, en
start optioneel standalone post-publish Telegram E2E wanneer
`npm_telegram_package_spec` is ingesteld. `OpenClaw Release Checks` waaiert vervolgens uit naar
installatiesmoke, Cross-OS-releasecontroles, live/E2E Docker-releasepaddekking,
Package Acceptance met Telegram-pakket-QA, QA Lab-pariteit, live Matrix en
live Telegram. Een volledige run is alleen acceptabel wanneer de samenvatting van `Full Release Validation`
`normal_ci` en `release_checks` als succesvol toont, en elk optioneel
`npm_telegram`-kind succesvol is of bewust is overgeslagen. De uiteindelijke
verifiersamenvatting bevat tabellen met langzaamste jobs voor elke kind-run, zodat de release
manager het huidige kritieke pad kan zien zonder logs te downloaden.
Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
complete fasematrix, exacte workflowjobnamen, verschillen tussen stable- en full-profielen,
artefacten en handvatten voor gerichte herhalingen.
Kindworkflows worden gestart vanaf de vertrouwde ref die `Full Release
Validation` uitvoert, normaal `--ref main`, zelfs wanneer de doel-`ref` naar een
oudere releasebranch of tag verwijst. Er is geen aparte Full Release Validation
workflow-ref-invoer; kies de vertrouwde harness door de workflow-run-ref te kiezen.

Gebruik `release_profile` om live/provider-breedte te selecteren:

- `minimum`: snelste releasekritieke OpenAI/core-live- en Docker-pad
- `stable`: minimum plus stabiele provider/backend-dekking voor releasegoedkeuring
- `full`: stable plus brede adviserende provider-/mediadekking

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de doel-ref
eenmalig te bepalen als `release-package-under-test` en hergebruikt dat artefact
in zowel release-pad Docker-controles als Package Acceptance. Dit houdt alle
pakketgerichte boxes op dezelfde bytes en voorkomt herhaalde pakketbuilds.
De cross-OS OpenAI-installatiesmoke gebruikt `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer de
repo/org-variabele is ingesteld, anders `openai/gpt-5.4-mini`, omdat deze lane
de pakketinstallatie, onboarding, het opstarten van de Gateway en één live agent-beurt
bewijst in plaats van het traagste standaardmodel te benchmarken. De bredere live provider-
matrix blijft de plek voor modelspecifieke dekking.

Gebruik deze varianten afhankelijk van de releasefase:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Gebruik de volledige umbrella niet als eerste heruitvoering na een gerichte fix. Als één box
faalt, gebruik dan de mislukte onderliggende workflow, job, Docker-lane, pakketprofiel, model-
provider of QA-lane voor het volgende bewijs. Voer de volledige umbrella alleen opnieuw uit wanneer
de fix gedeelde release-orchestratie heeft gewijzigd of eerder bewijs van alle boxes
verouderd heeft gemaakt. De laatste verifier van de umbrella controleert de vastgelegde run-
ids van onderliggende workflows opnieuw, dus nadat een onderliggende workflow succesvol opnieuw is uitgevoerd,
voer je alleen de mislukte bovenliggende job `Verify full validation` opnieuw uit.

Voor begrensd herstel geef je `rerun_group` door aan de umbrella. `all` is de echte
release-candidate-run, `ci` voert alleen de normale CI-child uit, `plugin-prerelease`
voert alleen de release-only plugin-child uit, `release-checks` voert elke release-
box uit, en de smallere releasegroepen zijn `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` en `npm-telegram` wanneer de
zelfstandige pakket-Telegram-lane is opgegeven.

### Vitest

De Vitest-box is de handmatige onderliggende `CI`-workflow. Handmatige CI omzeilt
bewust gewijzigde scoping en dwingt de normale testgrafiek voor de release-
candidate af: Linux Node-shards, bundled-plugin-shards, kanaalcontracten, Node 22-
compatibiliteit, `check`, `check-additional`, build-smoke, docs-controles, Python-
skills, Windows, macOS, Android en Control UI i18n.

Gebruik deze box om de vraag te beantwoorden: "is de source tree door de volledige normale testsuite gekomen?"
Dit is niet hetzelfde als productvalidatie via het release-pad. Te bewaren bewijs:

- `Full Release Validation`-samenvatting met de URL van de gestarte `CI`-run
- groene `CI`-run op de exacte doel-SHA
- namen van mislukte of trage shards uit de CI-jobs bij het onderzoeken van regressies
- Vitest-timingartefacten zoals `.artifacts/vitest-shard-timings.json` wanneer
  een run prestatieanalyse nodig heeft

Voer handmatige CI alleen direct uit wanneer de release deterministische normale CI nodig heeft, maar
niet de Docker-, QA Lab-, live-, cross-OS- of pakket-boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

De Docker-box bevindt zich in `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus de release-modus
`install-smoke`-workflow. Deze valideert de release candidate via verpakte
Docker-omgevingen in plaats van alleen source-level tests.

Release-Docker-dekking omvat:

- volledige install-smoke met de trage Bun global install-smoke ingeschakeld
- voorbereiding/hergebruik van de root-Dockerfile-smoke-image per doel-SHA, met QR-,
  root/gateway- en installer/Bun-smokejobs die als afzonderlijke install-smoke-
  shards draaien
- repository-E2E-lanes
- release-pad Docker-chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, `plugins-runtime-install-h`,
  `bundled-channels-core`, `bundled-channels-update-a`,
  `bundled-channels-update-discord`, `bundled-channels-update-b` en
  `bundled-channels-contracts`
- OpenWebUI-dekking binnen de chunk `plugins-runtime-services` wanneer gevraagd
- opgesplitste bundled-channel dependency-lanes over channel-smoke-, update-target-
  en setup/runtime-contractchunks in plaats van één grote bundled-channel-job
- opgesplitste install/uninstall-lanes voor gebundelde plugins
  `bundled-plugin-install-uninstall-0` tot en met
  `bundled-plugin-install-uninstall-23`
- live/E2E-provider-suites en Docker live-modeldekking wanneer releasecontroles
  live suites bevatten

Gebruik Docker-artefacten voordat je opnieuw uitvoert. De release-pad-scheduler uploadt
`.artifacts/docker-tests/` met lane-logs, `summary.json`, `failures.json`,
fasetimings, JSON met scheduler-plan en heruitvoercommando's. Voor gericht herstel
gebruik je `docker_lanes=<lane[,lane]>` op de herbruikbare live/E2E-workflow in plaats van
alle releasechunks opnieuw uit te voeren. Gegenereerde heruitvoercommando's bevatten eerdere
`package_artifact_run_id` en voorbereide Docker-image-inputs wanneer beschikbaar, zodat een
mislukte lane dezelfde tarball en GHCR-images kan hergebruiken.

### QA Lab

De QA Lab-box maakt ook deel uit van `OpenClaw Release Checks`. Dit is de agentische
gedrags- en kanaalreleasegate, los van Vitest en Docker-
pakketmechanica.

Release-QA Lab-dekking omvat:

- mock-pariteitsgate die de OpenAI-candidate-lane vergelijkt met de Opus 4.6-
  baseline met behulp van het agentische parity pack
- snel live Matrix-QA-profiel met de `qa-live-shared`-omgeving
- live Telegram-QA-lane met Convex CI-credential-leases
- `pnpm qa:otel:smoke` wanneer releasetelemetrie expliciet lokaal bewijs nodig heeft

Gebruik deze box om de vraag te beantwoorden: "gedraagt de release zich correct in QA-scenario's en
live kanaalflows?" Bewaar de artefact-URL's voor parity-, Matrix- en Telegram-
lanes bij het goedkeuren van de release. Volledige Matrix-dekking blijft beschikbaar als een
handmatige sharded QA-Lab-run in plaats van de standaard releasekritieke lane.

### Pakket

De Pakket-box is de gate voor het installeerbare product. Deze wordt ondersteund door
`Package Acceptance` en de resolver
`scripts/resolve-openclaw-package-candidate.mjs`. De resolver normaliseert een
candidate naar de `package-under-test`-tarball die door Docker E2E wordt gebruikt, valideert
de pakketinventaris, legt de pakketversie en SHA-256 vast, en houdt de
workflow-harness-ref gescheiden van de package source ref.

Ondersteunde candidate-bronnen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-release-
  versie
- `source=ref`: pak een vertrouwde `package_ref`-branch, tag of volledige commit-SHA
  met de geselecteerde `workflow_ref`-harness
- `source=url`: download een HTTPS `.tgz` met verplichte `package_sha256`
- `source=artifact`: hergebruik een `.tgz` die door een andere GitHub Actions-run is geüpload

`OpenClaw Release Checks` voert Package Acceptance uit met `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline` en
`telegram_mode=mock-openai`. De release-pad Docker-chunks dekken de
overlappende install-, update- en plugin-update-lanes; Package Acceptance behoudt
artefact-native bundled-channel-compatibiliteit, offline plugin-fixtures en Telegram-
pakket-QA tegen dezelfde bepaalde tarball. Het is de GitHub-native
vervanging voor de meeste package/update-dekking waarvoor voorheen
Parallels nodig was. Cross-OS releasecontroles blijven belangrijk voor OS-specifieke onboarding,
installer- en platformgedrag, maar productvalidatie voor package/update moet
Package Acceptance verkiezen.

Legacy package-acceptance-tolerantie is bewust tijdsgebonden. Pakketten tot en met
`2026.4.25` mogen het compatibiliteitspad gebruiken voor metadatahiaten die al naar npm zijn gepubliceerd:
private QA-inventarisitems die ontbreken in de tarball, ontbrekende
`gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide git-
fixture, ontbrekende gepersisteerde `update.channel`, legacy plugin install-record-
locaties, ontbrekende marketplace install-record-persistentie en config-metadata-
migratie tijdens `plugins update`. Het gepubliceerde pakket `2026.4.26` mag waarschuwen
voor lokale build metadata stamp-bestanden die al zijn geleverd. Latere pakketten
moeten voldoen aan de moderne pakketcontracten; dezelfde hiaten laten release-
validatie falen.

Gebruik bredere Package Acceptance-profielen wanneer de releasevraag over een
daadwerkelijk installeerbaar pakket gaat:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Veelgebruikte pakketprofielen:

- `smoke`: snelle lanes voor pakketinstallatie/kanaal/agent, gateway-netwerk en config-
  reload
- `package`: install/update/plugin-pakketcontracten zonder live ClawHub; dit is de standaard
  voor releasecontroles
- `product`: `package` plus MCP-kanalen, cron/subagent-opruiming, OpenAI-web-
  search en OpenWebUI
- `full`: Docker-release-padchunks met OpenWebUI
- `custom`: exacte `docker_lanes`-lijst voor gerichte heruitvoeringen

Voor Telegram-bewijs van package candidates schakel je `telegram_mode=mock-openai` of
`telegram_mode=live-frontier` in op Package Acceptance. De workflow geeft de
bepaalde `package-under-test`-tarball door aan de Telegram-lane; de zelfstandige
Telegram-workflow accepteert nog steeds een gepubliceerde npm-specificatie voor controles na publicatie.

## NPM-workflowinputs

`OpenClaw NPM Release` accepteert deze door operators beheerde inputs:

- `tag`: verplichte releasetag zoals `v2026.4.2`, `v2026.4.2-1` of
  `v2026.4.2-beta.1`; wanneer `preflight_only=true`, mag dit ook de huidige
  volledige 40-tekens workflow-branch commit-SHA zijn voor alleen-validatie-preflight
- `preflight_only`: `true` voor alleen validatie/build/pakket, `false` voor het
  echte publicatiepad
- `preflight_run_id`: verplicht op het echte publicatiepad zodat de workflow de
  voorbereide tarball uit de geslaagde preflight-run hergebruikt
- `npm_dist_tag`: npm-doeltag voor het publicatiepad; standaard `beta`

`OpenClaw Release Checks` accepteert deze door operators beheerde inputs:

- `ref`: branch, tag of volledige commit-SHA om te valideren. Controles met secrets
  vereisen dat de bepaalde commit bereikbaar is vanaf een OpenClaw-branch of
  releasetag.

Regels:

- Stabiele en correctietags mogen naar `beta` of `latest` publiceren
- Beta-prereleasetags mogen alleen naar `beta` publiceren
- Voor `OpenClaw NPM Release` is volledige commit-SHA-input alleen toegestaan wanneer
  `preflight_only=true`
- `OpenClaw Release Checks` en `Full Release Validation` zijn altijd
  alleen validatie
- Het echte publicatiepad moet dezelfde `npm_dist_tag` gebruiken als tijdens preflight;
  de workflow verifieert dat metadata vóór publicatie blijft doorgaan

## Stabiele npm-releasevolgorde

Bij het maken van een stabiele npm-release:

1. Voer `OpenClaw NPM Release` uit met `preflight_only=true`
   - Voordat er een tag bestaat, kun je de huidige volledige commit-SHA van de
     workflowbranch gebruiken voor een validatie-only proefuitvoering van de
     voorcontroleworkflow
2. Kies `npm_dist_tag=beta` voor de normale stroom waarbij beta eerst komt, of
   alleen `latest` wanneer je bewust rechtstreeks stabiel wilt publiceren
3. Voer `Full Release Validation` uit op de releasebranch, releasetag of volledige
   commit-SHA wanneer je normale CI plus live promptcache, Docker, QA Lab,
   Matrix en Telegram-dekking vanuit één handmatige workflow wilt
4. Als je bewust alleen de deterministische normale testgraph nodig hebt, voer dan
   in plaats daarvan de handmatige `CI`-workflow uit op de releaseref
5. Sla de geslaagde `preflight_run_id` op
6. Voer `OpenClaw NPM Release` opnieuw uit met `preflight_only=false`, dezelfde
   `tag`, dezelfde `npm_dist_tag` en de opgeslagen `preflight_run_id`
7. Als de release op `beta` is geland, gebruik dan de private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`-
   workflow om die stabiele versie van `beta` naar `latest` te promoveren
8. Als de release bewust rechtstreeks naar `latest` is gepubliceerd en `beta`
   onmiddellijk dezelfde stabiele build moet volgen, gebruik dan dezelfde private
   workflow om beide dist-tags naar de stabiele versie te laten wijzen, of laat de
   geplande zelfherstellende synchronisatie `beta` later verplaatsen

De dist-tag-mutatie staat om veiligheidsredenen in de private repo omdat die nog
steeds `NPM_TOKEN` vereist, terwijl de publieke repo publiceren met alleen OIDC
behoudt.

Dat houdt zowel het directe publicatiepad als het promotiepad waarbij beta eerst
komt gedocumenteerd en zichtbaar voor operators.

Als een maintainer moet terugvallen op lokale npm-authenticatie, voer dan alle
1Password CLI (`op`)-commando's alleen uit binnen een toegewezen tmux-sessie.
Roep `op` niet rechtstreeks aan vanuit de hoofd-agent-shell; door het binnen
tmux te houden, blijven prompts, waarschuwingen en OTP-afhandeling zichtbaar en
worden herhaalde hostwaarschuwingen voorkomen.

## Publieke referenties

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainers gebruiken de private releasedocumentatie in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
voor het daadwerkelijke runbook.

## Gerelateerd

- [Releasekanalen](/nl/install/development-channels)
