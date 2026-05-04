---
read_when:
    - Zoeken naar definities van openbare releasekanalen
    - Releasevalidatie of pakketacceptatie uitvoeren
    - Op zoek naar versienaamgeving en cadans
summary: Vrijgavekanalen, operatorchecklist, validatieboxen, versienaamgeving en cadans
title: Releasebeleid
x-i18n:
    generated_at: "2026-05-04T07:08:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef50d3ef5d1e23b4e2c2b097fc4ca9f6d46bf8acb9aea0c9bca6d14e213b88b6
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw heeft drie openbare releasekanalen:

- stable: releases met tags die standaard naar npm `beta` publiceren, of naar npm `latest` wanneer dit expliciet wordt aangevraagd
- beta: prerelease-tags die naar npm `beta` publiceren
- dev: de bewegende kop van `main`

## Versienaamgeving

- Versie van stabiele release: `YYYY.M.D`
  - Git-tag: `vYYYY.M.D`
- Versie van stabiele correctierelease: `YYYY.M.D-N`
  - Git-tag: `vYYYY.M.D-N`
- Versie van beta-prerelease: `YYYY.M.D-beta.N`
  - Git-tag: `vYYYY.M.D-beta.N`
- Vul maand of dag niet aan met voorloopnullen
- `latest` betekent de huidige gepromote stabiele npm-release
- `beta` betekent het huidige beta-installatiedoel
- Stabiele en stabiele correctiereleases publiceren standaard naar npm `beta`; release-operators kunnen expliciet `latest` als doel kiezen, of later een gecontroleerde beta-build promoveren
- Elke stabiele OpenClaw-release levert het npm-pakket en de macOS-app samen;
  beta-releases valideren en publiceren normaal eerst het npm-/pakketpad, waarbij
  bouwen/ondertekenen/notariseren van de mac-app voor stabiele releases wordt
  gereserveerd, tenzij expliciet aangevraagd

## Releasetempo

- Releases gaan eerst naar beta
- Stable volgt pas nadat de nieuwste beta is gevalideerd
- Maintainers maken releases normaal vanaf een `release/YYYY.M.D`-branch die is
  gemaakt vanaf de huidige `main`, zodat releasevalidatie en fixes nieuwe
  ontwikkeling op `main` niet blokkeren
- Als een beta-tag is gepusht of gepubliceerd en een fix nodig heeft, maken
  maintainers de volgende `-beta.N`-tag in plaats van de oude beta-tag te
  verwijderen of opnieuw te maken
- Gedetailleerde releaseprocedure, goedkeuringen, referenties en herstelnotities
  zijn alleen voor maintainers

## Checklist voor release-operators

Deze checklist is de openbare vorm van de releaseflow. Privéreferenties,
ondertekening, notarisatie, herstel van dist-tags en noodrollbackdetails blijven in
het release-runbook dat alleen voor maintainers is.

1. Begin vanaf de huidige `main`: pull de nieuwste versie, bevestig dat de doelcommit is gepusht,
   en bevestig dat de huidige `main`-CI groen genoeg is om daarvan te branchen.
2. Herschrijf de bovenste sectie van `CHANGELOG.md` op basis van echte commitgeschiedenis met
   `/changelog`, houd vermeldingen gebruikersgericht, commit dit, push dit, en rebase/pull
   nog één keer voordat je brancht.
3. Controleer releasecompatibiliteitsrecords in
   `src/plugins/compat/registry.ts` en
   `src/commands/doctor/shared/deprecation-compat.ts`. Verwijder verlopen
   compatibiliteit alleen wanneer het upgradepad gedekt blijft, of leg vast waarom deze
   bewust wordt meegenomen.
4. Maak `release/YYYY.M.D` vanaf de huidige `main`; doe normaal releasewerk niet
   rechtstreeks op `main`.
5. Verhoog elke vereiste versielocatie voor de bedoelde tag, voer
   `pnpm plugins:sync` uit zodat publiceerbare Plugin-pakketten de releaseversie
   en compatibiliteitsmetadata delen, en voer daarna de lokale deterministische preflight uit:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, en
   `pnpm release:check`.
6. Voer `OpenClaw NPM Release` uit met `preflight_only=true`. Voordat er een tag bestaat,
   is een volledige releasebranch-SHA van 40 tekens toegestaan voor preflight die alleen
   voor validatie is. Bewaar de succesvolle `preflight_run_id`.
7. Start alle pre-releasetests met `Full Release Validation` voor de
   releasebranch, tag, of volledige commit-SHA. Dit is het ene handmatige startpunt
   voor de vier grote releasetestboxen: Vitest, Docker, QA Lab, en Package.
8. Als validatie faalt, fix dit op de releasebranch en voer opnieuw het kleinste falende
   bestand, kanaal, workflowjob, pakketprofiel, provider, of model-allowlist uit dat
   de fix bewijst. Voer de volledige paraplu alleen opnieuw uit wanneer het gewijzigde oppervlak
   eerder bewijs verouderd maakt.
9. Voor beta: tag `vYYYY.M.D-beta.N`, en voer daarna `OpenClaw Release Publish` uit vanaf
   de overeenkomende `release/YYYY.M.D`-branch. Dit verifieert `pnpm plugins:sync:check`,
   publiceert eerst alle publiceerbare Plugin-pakketten naar npm, publiceert dezelfde
   set daarna naar ClawHub als ClawPack npm-pack-tarballs, en promoot vervolgens het
   voorbereide OpenClaw npm-preflightartefact met de overeenkomende dist-tag. Voer na
   publicatie post-publicatiepakketacceptatie uit tegen het gepubliceerde
   `openclaw@YYYY.M.D-beta.N`- of `openclaw@beta`-pakket. Als een gepushte of
   gepubliceerde prerelease een fix nodig heeft, maak dan het volgende overeenkomende
   prereleasenummer; verwijder of herschrijf de oude prerelease niet.
10. Voor stable: ga alleen door nadat de gecontroleerde beta of releasecandidate het
    vereiste validatiebewijs heeft. Stabiele npm-publicatie verloopt ook via
    `OpenClaw Release Publish`, waarbij het succesvolle preflightartefact opnieuw wordt gebruikt via
    `preflight_run_id`; gereedheid voor een stabiele macOS-release vereist ook de
    verpakte `.zip`, `.dmg`, `.dSYM.zip`, en bijgewerkte `appcast.xml` op `main`.
11. Voer na publicatie de npm-post-publicatieverificatie uit, optioneel de zelfstandige
    gepubliceerde-npm Telegram E2E wanneer je post-publicatiekanaalbewijs nodig hebt,
    dist-tag-promotie wanneer nodig, GitHub-release-/prereleasenotities uit de
    volledige overeenkomende `CHANGELOG.md`-sectie, en de stappen voor de releaseaankondiging.

## Releasepreflight

- Voer `pnpm check:test-types` uit vóór de release-preflight, zodat test-TypeScript
  gedekt blijft buiten de snellere lokale `pnpm check`-gate
- Voer `pnpm check:architecture` uit vóór de release-preflight, zodat de bredere
  controles voor importcycli en architectuurgrenzen groen zijn buiten de snellere lokale gate
- Voer `pnpm build && pnpm ui:build` uit vóór `pnpm release:check`, zodat de verwachte
  `dist/*`-releaseartefacten en de Control UI-bundel bestaan voor de pack-
  validatiestap
- Voer `pnpm plugins:sync` uit na de root-versiebump en vóór het taggen. Het
  werkt versies van publiceerbare plugin-pakketten, OpenClaw peer/API-compatibiliteits-
  metadata, buildmetadata en plugin-changelog-stubs bij zodat ze overeenkomen met de core-
  releaseversie. `pnpm plugins:sync:check` is de niet-muteren­de releasewaakhond;
  de publicatieworkflow faalt vóór elke registry-mutatie als deze stap is
  vergeten.
- Voer de handmatige `Full Release Validation`-workflow uit vóór releasegoedkeuring om
  alle pre-release-testboxen vanuit één entrypoint te starten. Deze accepteert een branch,
  tag of volledige commit-SHA, dispatcht handmatig `CI` en dispatcht
  `OpenClaw Release Checks` voor install-smoke, Package Acceptance, Docker
  releasepad-suites, live/E2E, OpenWebUI, QA Lab-pariteit, Matrix- en Telegram-
  lanes. Met `release_profile=full` en `rerun_group=all` draait deze ook package
  Telegram E2E tegen het `release-package-under-test`-artefact uit release-
  checks. Geef `npm_telegram_package_spec` op na publicatie wanneer dezelfde
  Telegram E2E ook het gepubliceerde npm-pakket moet bewijzen. Geef
  `package_acceptance_package_spec` op na publicatie wanneer Package Acceptance
  zijn package/update-matrix tegen het geleverde npm-pakket moet draaien in plaats
  van tegen het uit SHA gebouwde artefact. Geef
  `evidence_package_spec` op wanneer het private bewijsrapport moet aantonen dat de
  validatie overeenkomt met een gepubliceerd npm-pakket zonder Telegram E2E af te
  dwingen. Voorbeeld:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Voer de handmatige `Package Acceptance`-workflow uit wanneer je side-channel-bewijs
  voor een pakketkandidaat wilt terwijl releasewerk doorgaat. Gebruik `source=npm` voor
  `openclaw@beta`, `openclaw@latest` of een exacte releaseversie; `source=ref`
  om een vertrouwde `package_ref`-branch/tag/SHA te packen met de huidige
  `workflow_ref`-harness; `source=url` voor een HTTPS-tarball met een vereiste
  SHA-256; of `source=artifact` voor een tarball die door een andere GitHub
  Actions-run is geüpload. De workflow lost de kandidaat op naar
  `package-under-test`, hergebruikt de Docker E2E-releasescheduler tegen die
  tarball en kan Telegram QA tegen dezelfde tarball draaien met
  `telegram_mode=mock-openai` of `telegram_mode=live-frontier`. Wanneer de
  geselecteerde Docker-lanes `published-upgrade-survivor` bevatten, is het pakket-
  artefact de kandidaat en selecteert `published_upgrade_survivor_baseline` de
  gepubliceerde baseline.
  Voorbeeld: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Veelgebruikte profielen:
  - `smoke`: lanes voor install/channel/agent, Gateway-netwerk en config-herladen
  - `package`: artefact-native lanes voor package/update/plugin zonder OpenWebUI of live ClawHub
  - `product`: package-profiel plus MCP-channels, Cron/subagent-opruiming,
    OpenAI-webzoekopdracht en OpenWebUI
  - `full`: Docker-releasepad-chunks met OpenWebUI
  - `custom`: exacte `docker_lanes`-selectie voor een gerichte rerun
- Voer de handmatige `CI`-workflow direct uit wanneer je alleen volledige normale CI-
  dekking voor de releasekandidaat nodig hebt. Handmatige CI-dispatches omzeilen changed-
  scoping en forceren de Linux Node-shards, bundled-plugin-shards, channel-
  contracten, Node 22-compatibiliteit, `check`, `check-additional`, build-smoke,
  docs-controles, Python Skills, Windows, macOS, Android en Control UI i18n-
  lanes.
  Voorbeeld: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Voer `pnpm qa:otel:smoke` uit bij het valideren van releasetelemetrie. Dit oefent
  QA-lab via een lokale OTLP/HTTP-receiver en verifieert de geëxporteerde trace-
  span-namen, begrensde attributen en redactie van content/identifiers zonder
  Opik, Langfuse of een andere externe collector te vereisen.
- Voer `pnpm release:check` uit vóór elke getagde release
- Voer `OpenClaw Release Publish` uit voor de muterende publicatiereeks nadat de
  tag bestaat. Dispatch deze vanuit `release/YYYY.M.D` (of `main` wanneer je een
  vanaf main bereikbare tag publiceert), geef de releasetag en succesvolle OpenClaw npm
  `preflight_run_id` door en behoud de standaard plugin-publicatiescope
  `all-publishable`, tenzij je bewust een gerichte reparatie draait. De
  workflow serialiseert plugin npm-publicatie, plugin ClawHub-publicatie en OpenClaw
  npm-publicatie, zodat het core-pakket niet wordt gepubliceerd vóór zijn geëxternaliseerde
  plugins.
- Releasecontroles draaien nu in een aparte handmatige workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` draait ook de QA Lab mock-pariteitslane plus het snelle
  live Matrix-profiel en de Telegram QA-lane vóór releasegoedkeuring. De live-
  lanes gebruiken de `qa-live-shared`-omgeving; Telegram gebruikt ook Convex CI-
  credentialleases. Voer de handmatige `QA-Lab - All Lanes`-workflow uit met
  `matrix_profile=all` en `matrix_shards=true` wanneer je volledige Matrix-
  transport-, media- en E2EE-inventaris parallel wilt.
- Cross-OS runtimevalidatie voor install en upgrade maakt deel uit van publieke
  `OpenClaw Release Checks` en `Full Release Validation`, die de
  herbruikbare workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direct aanroepen
- Deze splitsing is opzettelijk: houd het echte npm-releasepad kort,
  deterministisch en artefactgericht, terwijl tragere livecontroles in hun
  eigen lane blijven zodat ze publicatie niet vertragen of blokkeren
- Releasecontroles met geheimen moeten worden gedispatcht via `Full Release
Validation` of vanuit de `main`/release-workflow-ref, zodat workflowlogica en
  secrets gecontroleerd blijven
- `OpenClaw Release Checks` accepteert een branch, tag of volledige commit-SHA zolang
  de opgeloste commit bereikbaar is vanaf een OpenClaw-branch of releasetag
- `OpenClaw NPM Release` validation-only preflight accepteert ook de huidige
  volledige 40-tekens workflow-branch-commit-SHA zonder een gepushte tag te vereisen
- Dat SHA-pad is alleen voor validatie en kan niet worden gepromoveerd naar een echte publicatie
- In SHA-modus synthetiseert de workflow `v<package.json version>` alleen voor de
  pakketmetadatacontrole; echte publicatie vereist nog steeds een echte releasetag
- Beide workflows houden het echte publicatie- en promotiepad op GitHub-gehoste
  runners, terwijl het niet-muterende validatiepad de grotere
  Blacksmith Linux-runners kan gebruiken
- Die workflow draait
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  met zowel `OPENAI_API_KEY` als `ANTHROPIC_API_KEY` workflowsecrets
- npm-releasepreflight wacht niet langer op de aparte releasechecks-lane
- Voer `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (of de overeenkomende beta-/correctietag) uit vóór goedkeuring
- Voer na npm-publicatie
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (of de overeenkomende beta-/correctieversie) uit om het gepubliceerde registry-
  installpad in een nieuwe tijdelijke prefix te verifiëren
- Voer na een beta-publicatie `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  uit om onboarding van het geïnstalleerde pakket, Telegram-configuratie en echte Telegram E2E
  tegen het gepubliceerde npm-pakket te verifiëren met de gedeelde geleasede Telegram-
  credentialpool. Lokale eenmalige maintainer-runs mogen de Convex-vars weglaten en de drie
  `OPENCLAW_QA_TELEGRAM_*` env-credentials direct doorgeven.
- Gebruik `pnpm release:beta-smoke -- --beta betaN` om de volledige post-publish beta-smoke vanaf een maintainer-machine te draaien. De helper draait Parallels npm-update-/fresh-targetvalidatie, dispatcht `NPM Telegram Beta E2E`, pollt de exacte workflowrun, downloadt het artefact en print het Telegram-rapport.
- Maintainers kunnen dezelfde post-publish-controle vanuit GitHub Actions draaien via de
  handmatige `NPM Telegram Beta E2E`-workflow. Deze is bewust alleen handmatig en
  draait niet bij elke merge.
- Maintainer-releaseautomatisering gebruikt nu preflight-then-promote:
  - echte npm-publicatie moet een succesvolle npm `preflight_run_id` hebben
  - de echte npm-publicatie moet worden gedispatcht vanuit dezelfde `main`- of
    `release/YYYY.M.D`-branch als de succesvolle preflightrun
  - stabiele npm-releases staan standaard op `beta`
  - stabiele npm-publicatie kan expliciet `latest` targeten via workflowinput
  - tokengebaseerde npm dist-tag-mutatie leeft nu in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    om veiligheidsredenen, omdat `npm dist-tag add` nog steeds `NPM_TOKEN` nodig heeft terwijl de
    publieke repo OIDC-only publicatie behoudt
  - publieke `macOS Release` is alleen validatie; wanneer een tag alleen op een
    releasebranch staat maar de workflow vanuit `main` wordt gedispatcht, stel
    `public_release_branch=release/YYYY.M.D` in
  - echte private mac-publicatie moet succesvolle private mac
    `preflight_run_id` en `validate_run_id` hebben
  - de echte publicatiepaden promoveren voorbereide artefacten in plaats van ze
    opnieuw te bouwen
- Voor stabiele correctiereleases zoals `YYYY.M.D-N` controleert de post-publishverifier
  ook hetzelfde temp-prefix-upgradepad van `YYYY.M.D` naar `YYYY.M.D-N`,
  zodat releasecorrecties oudere globale installs niet stilletjes op de
  basis-stabiele payload kunnen laten staan
- npm-releasepreflight faalt gesloten tenzij de tarball zowel
  `dist/control-ui/index.html` als een niet-lege `dist/control-ui/assets/`-payload bevat,
  zodat we niet opnieuw een leeg browserdashboard leveren
- Post-publishverificatie controleert ook dat gepubliceerde plugin-entrypoints en
  pakketmetadata aanwezig zijn in de geïnstalleerde registry-layout. Een release die
  ontbrekende plugin-runtimepayloads levert, faalt de postpublishverifier en
  kan niet naar `latest` worden gepromoveerd.
- `pnpm test:install:smoke` handhaaft ook het npm pack `unpackedSize`-budget op
  de kandidaat-updatetarball, zodat installer-e2e accidentele pack-bloat vangt
  vóór het releasepublicatiepad
- Als het releasewerk CI-planning, extension-timingmanifests of
  extension-testmatrices raakte, regenereer en review dan de door de planner beheerde
  `plugin-prerelease-extension-shard`-matrixoutputs uit
  `.github/workflows/plugin-prerelease.yml` vóór goedkeuring, zodat releasenotes geen
  verouderde CI-layout beschrijven
- Gereedheid voor stabiele macOS-release omvat ook de updater-oppervlakken:
  - de GitHub-release moet eindigen met de verpakte `.zip`, `.dmg` en `.dSYM.zip`
  - `appcast.xml` op `main` moet na publicatie naar de nieuwe stabiele zip wijzen
  - de verpakte app moet een niet-debug bundle-id, een niet-lege Sparkle-feed-
    URL en een `CFBundleVersion` op of boven de canonieke Sparkle-buildvloer
    voor die releaseversie behouden

## Releasetestboxen

`Full Release Validation` is hoe operators alle pre-releasetests vanuit
één entrypoint starten. Gebruik voor bewijs van een vastgepinde commit op een snel bewegende branch de
helper, zodat elke child-workflow vanaf een tijdelijke branch draait die is vastgezet op de target-
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

De helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation`
vanaf die branch met `ref=<sha>`, verifieert dat elke child-workflow `headSha`
overeenkomt met de target en verwijdert daarna de tijdelijke branch. Dit voorkomt dat je per ongeluk een
nieuwere `main`-child-run bewijst.

Draai releasebranch- of tagvalidatie vanuit de vertrouwde `main`-workflow-
ref en geef de releasebranch of tag door als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

De workflow lost de doel-ref op, dispatcht handmatig `CI` met
`target_ref=<release-ref>`, dispatcht `OpenClaw Release Checks`, bereidt een
bovenliggend `release-package-under-test`-artifact voor package-gerichte checks
voor, en dispatcht standalone package Telegram E2E wanneer `release_profile=full` met
`rerun_group=all` of wanneer `npm_telegram_package_spec` is ingesteld. `OpenClaw Release
Checks` waaiert daarna uit naar install smoke, cross-OS release-checks, live/E2E Docker
release-paddekking, Package Acceptance met Telegram package-QA, QA Lab
pariteit, live Matrix en live Telegram. Een volledige run is alleen acceptabel wanneer de
samenvatting van `Full Release Validation`
`normal_ci` en `release_checks` als succesvol toont. In full/all-modus moet
de `npm_telegram`-child ook succesvol zijn; buiten full/all wordt die overgeslagen,
tenzij een gepubliceerde `npm_telegram_package_spec` is opgegeven. De uiteindelijke
verificatiesamenvatting bevat tabellen met traagste jobs voor elke child-run, zodat de release
manager het huidige kritieke pad kan zien zonder logs te downloaden.
Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
complete fasematrix, exacte workflow-jobnamen, verschillen tussen stabiel en volledig profiel,
artifacts en gerichte rerun-handles.
Child-workflows worden gedispatcht vanaf de vertrouwde ref die `Full Release
Validation` uitvoert, normaal `--ref main`, zelfs wanneer de doel-`ref` naar een
oudere release-branch of tag wijst. Er is geen aparte Full Release Validation
workflow-ref-invoer; kies de vertrouwde harness door de ref van de workflow-run te kiezen.
Gebruik geen `--ref main -f ref=<sha>` voor exact commit-bewijs op bewegende `main`;
ruwe commit-SHA's kunnen geen workflow-dispatchrefs zijn, dus gebruik
`pnpm ci:full-release --sha <sha>` om de gepinde tijdelijke branch te maken.

Gebruik `release_profile` om de breedte voor live/providers te selecteren:

- `minimum`: snelste release-kritieke OpenAI/core live- en Docker-pad
- `stable`: minimum plus stabiele provider/backend-dekking voor releasegoedkeuring
- `full`: stable plus brede adviserende provider/media-dekking

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de doel-ref
één keer als `release-package-under-test` op te lossen en hergebruikt dat artifact in zowel
release-pad Docker-checks als Package Acceptance. Dit houdt alle
package-gerichte boxes op dezelfde bytes en voorkomt herhaalde package-builds.
De cross-OS OpenAI install smoke gebruikt `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer de
repo/org-variabele is ingesteld, anders `openai/gpt-5.4`, omdat deze lane
package-installatie, onboarding, gateway-start en één live agentbeurt bewijst
in plaats van het traagste standaardmodel te benchmarken. De bredere live provider-
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
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Gebruik de volledige overkoepelende workflow niet als eerste rerun na een gerichte fix. Als één box
faalt, gebruik dan de mislukte child-workflow, job, Docker-lane, package-profiel, model-
provider of QA-lane voor het volgende bewijs. Voer de volledige overkoepelende workflow alleen opnieuw uit wanneer
de fix gedeelde release-orchestratie heeft gewijzigd of eerder all-box-bewijs
verouderd heeft gemaakt. De uiteindelijke verifier van de overkoepelende workflow controleert de vastgelegde child-workflow-run-
id's opnieuw, dus nadat een child-workflow succesvol opnieuw is uitgevoerd, rerun dan alleen de mislukte
bovenliggende job `Verify full validation`.

Geef voor begrensd herstel `rerun_group` door aan de overkoepelende workflow. `all` is de echte
release-candidate-run, `ci` draait alleen de normale CI-child, `plugin-prerelease`
draait alleen de release-only Plugin-child, `release-checks` draait elke release-
box, en de nauwere releasegroepen zijn `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` en `npm-telegram`.
Gerichte `npm-telegram`-reruns vereisen `npm_telegram_package_spec`; full/all-runs
met `release_profile=full` gebruiken het package-artifact van release-checks.

### Vitest

De Vitest-box is de handmatige `CI`-child-workflow. Handmatige CI omzeilt bewust
changed-scoping en forceert de normale testgrafiek voor de releasecandidate:
Linux Node-shards, gebundelde-plugin-shards, channel-contracten, Node 22-
compatibiliteit, `check`, `check-additional`, build smoke, docs-checks, Python
Skills, Windows, macOS, Android en Control UI i18n.

Gebruik deze box om te beantwoorden: "is de broncodeboom geslaagd voor de volledige normale testsuite?"
Dit is niet hetzelfde als release-pad productvalidatie. Te bewaren bewijs:

- `Full Release Validation`-samenvatting die de gedispatchte `CI`-run-URL toont
- `CI`-run groen op de exacte doel-SHA
- namen van mislukte of trage shards uit de CI-jobs bij het onderzoeken van regressies
- Vitest-timingartifacts zoals `.artifacts/vitest-shard-timings.json` wanneer
  een run prestatieanalyse nodig heeft

Voer handmatige CI alleen direct uit wanneer de release deterministische normale CI nodig heeft maar
niet de Docker-, QA Lab-, live-, cross-OS- of package-boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

De Docker-box zit in `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus de release-modus
`install-smoke`-workflow. Deze valideert de releasecandidate via packaged
Docker-omgevingen in plaats van alleen tests op bronniveau.

Release-Docker-dekking omvat:

- volledige install smoke met de langzame Bun global install smoke ingeschakeld
- voorbereiding/hergebruik van de root-Dockerfile-smoke-image per doel-SHA, met QR-,
  root/gateway- en installer/Bun-smoke-jobs die als aparte install-smoke-
  shards draaien
- repository-E2E-lanes
- release-pad Docker-chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` en `plugins-runtime-install-h`
- OpenWebUI-dekking binnen de `plugins-runtime-services`-chunk wanneer gevraagd
- gesplitste gebundelde Plugin install/uninstall-lanes
  `bundled-plugin-install-uninstall-0` tot en met
  `bundled-plugin-install-uninstall-23`
- live/E2E-provider-suites en Docker live-modeldekking wanneer release-checks
  live-suites bevatten

Gebruik Docker-artifacts voordat je opnieuw uitvoert. De release-pad-scheduler uploadt
`.artifacts/docker-tests/` met lane-logs, `summary.json`, `failures.json`,
fasetimings, schedulerplan-JSON en rerun-commando's. Gebruik voor gericht herstel
`docker_lanes=<lane[,lane]>` op de herbruikbare live/E2E-workflow in plaats van
alle release-chunks opnieuw uit te voeren. Gegenereerde rerun-commando's bevatten eerdere
`package_artifact_run_id` en voorbereide Docker-image-invoer waar beschikbaar, zodat een
mislukte lane dezelfde tarball en GHCR-images kan hergebruiken.

### QA Lab

De QA Lab-box maakt ook deel uit van `OpenClaw Release Checks`. Dit is de agentische
gedrags- en channel-level releasegate, los van Vitest en Docker-
packagemechanica.

Release-QA Lab-dekking omvat:

- mock-pariteitslane die de OpenAI-candidate-lane vergelijkt met de Opus 4.6-
  baseline via het agentische pariteitspakket
- snelle live Matrix-QA-profiel via de `qa-live-shared`-omgeving
- live Telegram-QA-lane via Convex CI-credentialleases
- `pnpm qa:otel:smoke` wanneer release-telemetrie expliciet lokaal bewijs nodig heeft

Gebruik deze box om te beantwoorden: "gedraagt de release zich correct in QA-scenario's en
live channel-flows?" Bewaar de artifact-URL's voor pariteits-, Matrix- en Telegram-
lanes bij het goedkeuren van de release. Volledige Matrix-dekking blijft beschikbaar als een
handmatige sharded QA-Lab-run in plaats van de standaard release-kritieke lane.

### Package

De Package-box is de gate voor het installeerbare product. Die wordt ondersteund door
`Package Acceptance` en de resolver
`scripts/resolve-openclaw-package-candidate.mjs`. De resolver normaliseert een
candidate naar de `package-under-test`-tarball die door Docker E2E wordt gebruikt, valideert
de package-inventaris, legt de packageversie en SHA-256 vast, en houdt de
workflow-harness-ref gescheiden van de package-bron-ref.

Ondersteunde candidate-bronnen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-release-
  versie
- `source=ref`: pack een vertrouwde `package_ref`-branch, tag of volledige commit-SHA
  met de geselecteerde `workflow_ref`-harness
- `source=url`: download een HTTPS `.tgz` met vereiste `package_sha256`
- `source=artifact`: hergebruik een `.tgz` die door een andere GitHub Actions-run is geüpload

`OpenClaw Release Checks` draait Package Acceptance met `source=artifact`, het
voorbereide release-package-artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` en
`telegram_mode=mock-openai`. Package Acceptance houdt migratie, update, cleanup van verouderde
Plugin-afhankelijkheden, offline Plugin-fixtures, Plugin-update en Telegram
package-QA tegen dezelfde opgeloste tarball. De upgradematrix dekt elke stabiele npm-gepubliceerde baseline van `2026.4.23` tot en met `latest`; gebruik
Package Acceptance met `source=npm` voor een al verzonden candidate, of
`source=ref`/`source=artifact` voor een SHA-onderbouwde lokale npm-tarball vóór
publish. Het is de GitHub-native
vervanging voor de meeste package/update-dekking waarvoor eerder
Parallels nodig was. Cross-OS release-checks blijven belangrijk voor OS-specifieke onboarding,
installer en platformgedrag, maar package/update productvalidatie moet
Package Acceptance verkiezen.

De canonieke checklist voor update- en Plugin-validatie is
[Updates en Plugins testen](/nl/help/testing-updates-plugins). Gebruik die wanneer
je beslist welke lokale, Docker-, Package Acceptance- of release-check-lane een
Plugin-install/update, doctor-cleanup of gepubliceerde-package-migratiewijziging bewijst.
Uitputtende gepubliceerde update-migratie vanuit elk stabiel `2026.4.23+`-package is
een aparte handmatige `Update Migration`-workflow, geen onderdeel van Full Release CI.

Legacy package-acceptance-tolerantie is bewust in de tijd begrensd. Packages tot en met
`2026.4.25` mogen het compatibiliteitspad gebruiken voor metadata-gaten die al naar
npm zijn gepubliceerd: private QA-inventarisitems die ontbreken in de tarball, ontbrekende
`gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide git-
fixture, ontbrekende gepersisteerde `update.channel`, legacy Plugin install-record-
locaties, ontbrekende marketplace install-record-persistentie en configmetadata-
migratie tijdens `plugins update`. Het gepubliceerde `2026.4.26`-package mag waarschuwen
voor lokale buildmetadata-stempelbestanden die al zijn verzonden. Latere packages
moeten voldoen aan de moderne package-contracten; diezelfde gaten laten release-
validatie falen.

Gebruik bredere Package Acceptance-profielen wanneer de releasevraag over een
daadwerkelijk installeerbaar package gaat:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Veelgebruikte packageprofielen:

- `smoke`: snelle lanes voor pakketinstallatie/kanaal/agent, Gateway-netwerk en
  configuratie herladen
- `package`: contracten voor installatie/update/pluginpakketten zonder live ClawHub; dit is de standaard voor
  releasechecks
- `product`: `package` plus MCP-kanalen, opschoning van cron/subagent, OpenAI-web
  search en OpenWebUI
- `full`: Docker-releasepad-chunks met OpenWebUI
- `custom`: exacte `docker_lanes`-lijst voor gerichte herhalingen

Schakel voor Telegram-bewijs van een pakketkandidaat `telegram_mode=mock-openai` of
`telegram_mode=live-frontier` in bij Package Acceptance. De workflow geeft de
opgeloste `package-under-test`-tarball door aan de Telegram-lane; de zelfstandige
Telegram-workflow accepteert nog steeds een gepubliceerde npm-specificatie voor controles na publicatie.

## Automatisering voor releasepublicatie

`OpenClaw Release Publish` is het normale muterende ingangspunt voor publicatie. Het
orkestreert de workflows voor vertrouwde publicatie in de volgorde die de release nodig heeft:

1. Check de releasetag uit en los de commit-SHA ervan op.
2. Controleer of de tag bereikbaar is vanaf `main` of `release/*`.
3. Voer `pnpm plugins:sync:check` uit.
4. Start `Plugin NPM Release` met `publish_scope=all-publishable` en
   `ref=<release-sha>`.
5. Start `Plugin ClawHub Release` met dezelfde scope en SHA.
6. Start `OpenClaw NPM Release` met de releasetag, npm-dist-tag en
   opgeslagen `preflight_run_id`.

Voorbeeld van betapublicatie:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Stabiele publicatie naar de standaard beta-dist-tag:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Stabiele promotie rechtstreeks naar `latest` is expliciet:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Gebruik de lagere-niveau workflows `Plugin NPM Release` en `Plugin ClawHub Release`
alleen voor gerichte reparatie of herpublicatie. Geef voor een geselecteerde pluginreparatie
`plugin_publish_scope=selected` en `plugins=@openclaw/name` door aan
`OpenClaw Release Publish`, of start de onderliggende workflow rechtstreeks wanneer het
OpenClaw-pakket niet mag worden gepubliceerd.

## NPM-workflowinvoer

`OpenClaw NPM Release` accepteert deze door operators beheerde invoer:

- `tag`: vereiste releasetag zoals `v2026.4.2`, `v2026.4.2-1` of
  `v2026.4.2-beta.1`; wanneer `preflight_only=true`, mag dit ook de huidige
  volledige 40-tekens lange commit-SHA van de workflowbranch zijn voor een preflight die alleen valideert
- `preflight_only`: `true` alleen voor validatie/build/pakket, `false` voor het
  echte publicatiepad
- `preflight_run_id`: vereist op het echte publicatiepad, zodat de workflow de
  voorbereide tarball uit de geslaagde preflightrun opnieuw gebruikt
- `npm_dist_tag`: npm-doeltag voor het publicatiepad; standaard `beta`

`OpenClaw Release Publish` accepteert deze door operators beheerde invoer:

- `tag`: vereiste releasetag; moet al bestaan
- `preflight_run_id`: geslaagde `OpenClaw NPM Release`-preflightrun-id;
  vereist wanneer `publish_openclaw_npm=true`
- `npm_dist_tag`: npm-doeltag voor het OpenClaw-pakket
- `plugin_publish_scope`: standaard `all-publishable`; gebruik `selected` alleen
  voor gericht reparatiewerk
- `plugins`: door komma's gescheiden `@openclaw/*`-pakketnamen wanneer
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: standaard `true`; zet op `false` alleen wanneer de
  workflow als reparatieorkestrator voor alleen plugins wordt gebruikt

`OpenClaw Release Checks` accepteert deze door operators beheerde invoer:

- `ref`: branch, tag of volledige commit-SHA om te valideren. Controles met secrets
  vereisen dat de opgeloste commit bereikbaar is vanaf een OpenClaw-branch of
  releasetag.

Regels:

- Stabiele tags en correctietags mogen publiceren naar `beta` of `latest`
- Beta-prereleasetags mogen alleen naar `beta` publiceren
- Voor `OpenClaw NPM Release` is invoer met volledige commit-SHA alleen toegestaan wanneer
  `preflight_only=true`
- `OpenClaw Release Checks` en `Full Release Validation` zijn altijd
  alleen validatie
- Het echte publicatiepad moet dezelfde `npm_dist_tag` gebruiken als tijdens de preflight;
  de workflow controleert die metadata voordat de publicatie doorgaat

## Stabiele npm-releasereeks

Bij het maken van een stabiele npm-release:

1. Voer `OpenClaw NPM Release` uit met `preflight_only=true`
   - Voordat er een tag bestaat, mag je de huidige volledige commit-SHA van de workflowbranch
     gebruiken voor een validatie-only dry run van de preflightworkflow
2. Kies `npm_dist_tag=beta` voor de normale beta-first-flow, of `latest` alleen
   wanneer je bewust een rechtstreekse stabiele publicatie wilt
3. Voer `Full Release Validation` uit op de releasebranch, releasetag of volledige
   commit-SHA wanneer je normale CI plus live promptcache, Docker, QA Lab,
   Matrix en Telegram-dekking vanuit één handmatige workflow wilt
4. Als je bewust alleen de deterministische normale testgraaf nodig hebt, voer dan in plaats daarvan de
   handmatige `CI`-workflow uit op de release-ref
5. Sla de geslaagde `preflight_run_id` op
6. Voer `OpenClaw Release Publish` uit met dezelfde `tag`, dezelfde `npm_dist_tag`
   en de opgeslagen `preflight_run_id`; deze publiceert geëxternaliseerde plugins naar npm
   en ClawHub voordat het OpenClaw-npm-pakket wordt gepromoveerd
7. Als de release op `beta` is geland, gebruik dan de private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`-
   workflow om die stabiele versie van `beta` naar `latest` te promoveren
8. Als de release bewust rechtstreeks naar `latest` is gepubliceerd en `beta`
   onmiddellijk dezelfde stabiele build moet volgen, gebruik dan dezelfde private
   workflow om beide dist-tags naar de stabiele versie te laten wijzen, of laat de geplande
   zelfherstellende synchronisatie `beta` later verplaatsen

De dist-tag-mutatie staat om veiligheidsredenen in de private repo, omdat deze nog steeds
`NPM_TOKEN` vereist, terwijl de publieke repo publicatie met alleen OIDC behoudt.

Zo blijven het rechtstreekse publicatiepad en het beta-first-promotiepad beide
gedocumenteerd en zichtbaar voor operators.

Als een maintainer moet terugvallen op lokale npm-authenticatie, voer dan 1Password
CLI-commando's (`op`) alleen uit binnen een toegewezen tmux-sessie. Roep `op` niet
rechtstreeks aan vanuit de hoofd-agent-shell; door het binnen tmux te houden, blijven prompts,
meldingen en OTP-afhandeling observeerbaar en worden herhaalde hostmeldingen voorkomen.

## Publieke verwijzingen

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
voor het daadwerkelijke draaiboek.

## Gerelateerd

- [Releasekanalen](/nl/install/development-channels)
