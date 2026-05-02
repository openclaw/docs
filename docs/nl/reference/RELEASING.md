---
read_when:
    - Zoeken naar definities van openbare releasekanalen
    - Releasevalidatie of pakketacceptatie uitvoeren
    - Op zoek naar versienaamgeving en cadans
summary: Releasetrajecten, operatorchecklist, validatieboxen, versienaamgeving en cadans
title: Releasebeleid
x-i18n:
    generated_at: "2026-05-02T11:26:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce52c9144de3c8b914954db64f6ca5b2196edbbdcc7385984235a39c208bb59e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw heeft drie openbare releasekanalen:

- stable: getagde releases die standaard naar npm `beta` publiceren, of naar npm `latest` wanneer dat expliciet wordt gevraagd
- beta: prerelease-tags die naar npm `beta` publiceren
- dev: de bewegende kop van `main`

## Versienamen

- Stabiele releaseversie: `YYYY.M.D`
  - Git-tag: `vYYYY.M.D`
- Stabiele correctiereleaseversie: `YYYY.M.D-N`
  - Git-tag: `vYYYY.M.D-N`
- Beta-prereleaseversie: `YYYY.M.D-beta.N`
  - Git-tag: `vYYYY.M.D-beta.N`
- Vul maand of dag niet met nullen aan
- `latest` betekent de huidige gepromote stabiele npm-release
- `beta` betekent het huidige beta-installatiedoel
- Stabiele en stabiele correctiereleases publiceren standaard naar npm `beta`; release-operators kunnen expliciet `latest` kiezen, of later een gecontroleerde beta-build promoveren
- Elke stabiele OpenClaw-release levert het npm-pakket en de macOS-app samen;
  beta-releases valideren en publiceren normaal eerst het npm-/pakketpad, waarbij
  bouwen/ondertekenen/notariseren van de Mac-app voor stabiel is gereserveerd tenzij expliciet gevraagd

## Releaseritme

- Releases gaan eerst via beta
- Stable volgt pas nadat de nieuwste beta is gevalideerd
- Maintainers maken releases normaal vanaf een `release/YYYY.M.D`-branch die is gemaakt
  vanaf de huidige `main`, zodat releasevalidatie en fixes nieuwe
  ontwikkeling op `main` niet blokkeren
- Als een beta-tag is gepusht of gepubliceerd en een fix nodig heeft, maken maintainers
  de volgende `-beta.N`-tag in plaats van de oude beta-tag te verwijderen of opnieuw te maken
- Gedetailleerde releaseprocedure, goedkeuringen, credentials en herstelnotities zijn
  alleen voor maintainers

## Checklist voor release-operator

Deze checklist is de openbare vorm van de releaseflow. Privécredentials,
ondertekening, notarisatie, herstel van dist-tags en details voor noodrollback blijven in
het release-runbook alleen voor maintainers.

1. Begin vanaf de huidige `main`: pull de laatste versie, bevestig dat de doelcommit is gepusht,
   en bevestig dat de huidige `main`-CI groen genoeg is om er een branch vanaf te maken.
2. Herschrijf de bovenste sectie van `CHANGELOG.md` vanuit de echte commitgeschiedenis met
   `/changelog`, houd vermeldingen gebruikersgericht, commit deze, push deze en rebase/pull
   nog één keer voordat je een branch maakt.
3. Controleer releasecompatibiliteitsrecords in
   `src/plugins/compat/registry.ts` en
   `src/commands/doctor/shared/deprecation-compat.ts`. Verwijder verlopen
   compatibiliteit alleen wanneer het upgradepad gedekt blijft, of leg vast waarom deze
   bewust behouden blijft.
4. Maak `release/YYYY.M.D` vanaf de huidige `main`; doe normaal releasewerk niet
   rechtstreeks op `main`.
5. Verhoog elke vereiste versielocatie voor de bedoelde tag, voer
   `pnpm plugins:sync` uit zodat publiceerbare Plugin-pakketten de releaseversie
   en compatibiliteitsmetadata delen, en voer daarna de lokale deterministische preflight uit:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, en
   `pnpm release:check`.
6. Voer `OpenClaw NPM Release` uit met `preflight_only=true`. Voordat er een tag bestaat,
   is een volledige release-branch-SHA van 40 tekens toegestaan voor preflight die alleen
   valideert. Bewaar de geslaagde `preflight_run_id`.
7. Start alle pre-releasetests met `Full Release Validation` voor de
   releasebranch, tag of volledige commit-SHA. Dit is het ene handmatige startpunt
   voor de vier grote releasetestboxen: Vitest, Docker, QA Lab en Package.
8. Als validatie mislukt, fix dit op de releasebranch en voer het kleinste mislukte
   bestand, de lane, workflowjob, pakketprofiel, provider of model-allowlist opnieuw uit die
   de fix bewijst. Voer de volledige paraplu alleen opnieuw uit wanneer het gewijzigde oppervlak
   eerder bewijs verouderd maakt.
9. Voor beta: tag `vYYYY.M.D-beta.N` en voer daarna `OpenClaw Release Publish` uit vanaf
   de overeenkomende `release/YYYY.M.D`-branch. Dit verifieert `pnpm plugins:sync:check`,
   publiceert eerst alle publiceerbare Plugin-pakketten naar npm, publiceert dezelfde
   set daarna naar ClawHub, en promoot vervolgens het voorbereide OpenClaw npm-preflight-
   artefact met dist-tag `beta`. Voer na publicatie post-publish pakketacceptatie uit
   tegen het gepubliceerde `openclaw@YYYY.M.D-beta.N`- of `openclaw@beta`-
   pakket. Als een gepushte of gepubliceerde beta een fix nodig heeft, maak dan de volgende `-beta.N`;
   verwijder of herschrijf de oude beta niet.
10. Voor stable: ga alleen verder nadat de gecontroleerde beta of release candidate het
    vereiste validatiebewijs heeft. Publicatie naar stable npm loopt ook via
    `OpenClaw Release Publish`, waarbij het geslaagde preflight-artefact opnieuw wordt gebruikt via
    `preflight_run_id`; gereedheid voor de stable macOS-release vereist ook de
    verpakte `.zip`, `.dmg`, `.dSYM.zip` en bijgewerkte `appcast.xml` op `main`.
11. Voer na publicatie de npm post-publish-verifier uit, optioneel een standalone
    gepubliceerde-npm Telegram-E2E wanneer je kanaalbewijs na publicatie nodig hebt,
    dist-tag-promotie wanneer nodig, GitHub release-/prereleasenotities vanuit de
    volledige overeenkomende `CHANGELOG.md`-sectie, en de stappen voor de releaseaankondiging.

## Release-preflight

- Voer `pnpm check:test-types` uit vóór release-preflight zodat test-TypeScript
  gedekt blijft buiten de snellere lokale `pnpm check`-gate
- Voer `pnpm check:architecture` uit vóór release-preflight zodat de bredere
  importcyclus- en architectuurgrenscontroles groen zijn buiten de snellere
  lokale gate
- Voer `pnpm build && pnpm ui:build` uit vóór `pnpm release:check` zodat de
  verwachte `dist/*`-releaseartefacten en de Control UI-bundel bestaan voor de
  pack-validatiestap
- Voer `pnpm plugins:sync` uit na de root-versiebump en vóór het taggen. Het
  werkt publiceerbare Plugin-pakketversies, OpenClaw-peer/API-compatibiliteitsmetadata,
  buildmetadata en Plugin-changelogstubs bij zodat ze overeenkomen met de
  core-releaseversie. `pnpm plugins:sync:check` is de niet-mutatie release-guard;
  de publicatieworkflow faalt vóór elke registermutatie als deze stap is
  vergeten.
- Voer de handmatige workflow `Full Release Validation` uit vóór releasegoedkeuring
  om alle pre-release-testboxen vanaf één ingangspunt te starten. Deze accepteert
  een branch, tag of volledige commit-SHA, dispatcht handmatig `CI`, en dispatcht
  `OpenClaw Release Checks` voor install smoke, package acceptance,
  Docker-releasepathsuites, live/E2E, OpenWebUI, QA Lab-pariteit, Matrix- en
  Telegram-lanes. Met `release_profile=full` en `rerun_group=all` draait deze ook
  package Telegram E2E tegen het `release-package-under-test`-artefact uit
  releasechecks. Geef `npm_telegram_package_spec` op na publicatie wanneer
  dezelfde Telegram E2E ook het gepubliceerde npm-pakket moet bewijzen. Geef
  `evidence_package_spec` op wanneer het private bewijsonderzoek moet aantonen
  dat de validatie overeenkomt met een gepubliceerd npm-pakket zonder Telegram
  E2E af te dwingen.
  Voorbeeld:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Voer de handmatige workflow `Package Acceptance` uit wanneer je side-channel-bewijs
  wilt voor een pakketkandidaat terwijl releasewerk doorgaat. Gebruik
  `source=npm` voor `openclaw@beta`, `openclaw@latest` of een exacte
  releaseversie; `source=ref` om een vertrouwde `package_ref`-branch/tag/SHA te
  packen met de huidige `workflow_ref`-harness; `source=url` voor een HTTPS-tarball
  met een vereiste SHA-256; of `source=artifact` voor een tarball die door een
  andere GitHub Actions-run is geüpload. De workflow resolveert de kandidaat naar
  `package-under-test`, hergebruikt de Docker E2E-releaseplanner tegen die
  tarball, en kan Telegram QA tegen dezelfde tarball draaien met
  `telegram_mode=mock-openai` of `telegram_mode=live-frontier`. Wanneer de
  geselecteerde Docker-lanes `published-upgrade-survivor` bevatten, is het
  pakketartefact de kandidaat en selecteert `published_upgrade_survivor_baseline`
  de gepubliceerde baseline.
  Voorbeeld: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Veelvoorkomende profielen:
  - `smoke`: install/channel/agent-, Gateway-netwerk- en config-reload-lanes
  - `package`: artefact-native pakket/update/Plugin-lanes zonder OpenWebUI of live ClawHub
  - `product`: pakketprofiel plus MCP-kanalen, cron/subagent-opruiming,
    OpenAI-webzoekfunctie en OpenWebUI
  - `full`: Docker-releasepathchunks met OpenWebUI
  - `custom`: exacte `docker_lanes`-selectie voor een gerichte heruitvoering
- Voer de handmatige workflow `CI` direct uit wanneer je alleen volledige normale
  CI-dekking nodig hebt voor de releasekandidaat. Handmatige CI-dispatches
  omzeilen changed-scoping en forceren de Linux Node-shards, gebundelde-Plugin-shards,
  channel-contracts, Node 22-compatibiliteit, `check`, `check-additional`,
  build smoke, docs-checks, Python Skills, Windows, macOS, Android en Control UI
  i18n-lanes.
  Voorbeeld: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Voer `pnpm qa:otel:smoke` uit bij het valideren van releasetelemetrie. Dit
  oefent QA-lab uit via een lokale OTLP/HTTP-ontvanger en verifieert de
  geëxporteerde trace-spannamen, begrensde attributen en redactie van
  content/identifiers zonder Opik, Langfuse of een andere externe collector te
  vereisen.
- Voer `pnpm release:check` uit vóór elke getagde release
- Voer `OpenClaw Release Publish` uit voor de muterende publicatiereeks nadat de
  tag bestaat. Dispatch deze vanaf `release/YYYY.M.D` (of `main` wanneer je een
  vanaf main bereikbare tag publiceert), geef de releasetag en succesvolle
  OpenClaw npm `preflight_run_id` door, en behoud de standaard Plugin-publicatiescope
  `all-publishable` tenzij je bewust een gerichte reparatie uitvoert. De workflow
  serialiseert Plugin npm publish, Plugin ClawHub publish en OpenClaw npm publish
  zodat het core-pakket niet wordt gepubliceerd vóór zijn geëxternaliseerde
  Plugins.
- Releasechecks draaien nu in een aparte handmatige workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` draait ook de QA Lab mock parity-gate plus het snelle
  live Matrix-profiel en de Telegram QA-lane vóór releasegoedkeuring. De live
  lanes gebruiken de omgeving `qa-live-shared`; Telegram gebruikt ook Convex
  CI-credentialleases. Voer de handmatige workflow `QA-Lab - All Lanes` uit met
  `matrix_profile=all` en `matrix_shards=true` wanneer je volledige Matrix-
  transport-, media- en E2EE-inventaris parallel wilt.
- Cross-OS-installatie- en upgrade-runtimevalidatie maakt deel uit van publieke
  `OpenClaw Release Checks` en `Full Release Validation`, die de herbruikbare
  workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direct
  aanroepen
- Deze splitsing is bewust: houd het echte npm-releasepad kort, deterministisch
  en artefactgericht, terwijl tragere livechecks in hun eigen lane blijven zodat
  ze publicatie niet vertragen of blokkeren
- Releasechecks met geheimen moeten worden gedispatcht via `Full Release
Validation` of vanaf de `main`/release-workflowref zodat workflowlogica en
  secrets gecontroleerd blijven
- `OpenClaw Release Checks` accepteert een branch, tag of volledige commit-SHA
  zolang de opgeloste commit bereikbaar is vanaf een OpenClaw-branch of releasetag
- De validation-only preflight van `OpenClaw NPM Release` accepteert ook de
  huidige volledige 40-tekens workflow-branch-commit-SHA zonder een gepushte tag
  te vereisen
- Dat SHA-pad is alleen voor validatie en kan niet worden gepromoveerd naar een
  echte publicatie
- In SHA-modus synthetiseert de workflow `v<package.json version>` alleen voor
  de pakketmetadatacontrole; echte publicatie vereist nog steeds een echte
  releasetag
- Beide workflows houden het echte publicatie- en promotiepad op door GitHub
  gehoste runners, terwijl het niet-muterende validatiepad de grotere
  Blacksmith Linux-runners kan gebruiken
- Die workflow draait
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  met zowel `OPENAI_API_KEY` als `ANTHROPIC_API_KEY`-workflowsecrets
- npm-releasepreflight wacht niet langer op de aparte releasechecks-lane
- Voer `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (of de overeenkomende beta/correctietag) uit vóór goedkeuring
- Voer na npm-publicatie
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (of de overeenkomende beta/correctieversie) uit om het gepubliceerde
  registry-installatiepad in een verse tijdelijke prefix te verifiëren
- Voer na een beta-publicatie `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  uit om onboarding van geïnstalleerde pakketten, Telegram-setup en echte
  Telegram E2E tegen het gepubliceerde npm-pakket te verifiëren met de gedeelde
  geleasede Telegram-credentialpool. Lokale eenmalige maintainer-runs mogen de
  Convex-vars weglaten en de drie `OPENCLAW_QA_TELEGRAM_*`-env-credentials direct
  doorgeven.
- Maintainers kunnen dezelfde post-publishcheck vanuit GitHub Actions draaien via
  de handmatige workflow `NPM Telegram Beta E2E`. Deze is bewust alleen
  handmatig en draait niet bij elke merge.
- Maintainer-releaseautomatisering gebruikt nu preflight-then-promote:
  - echte npm-publicatie moet slagen met een succesvolle npm `preflight_run_id`
  - de echte npm-publicatie moet worden gedispatcht vanaf dezelfde `main`- of
    `release/YYYY.M.D`-branch als de succesvolle preflightrun
  - stabiele npm-releases gebruiken standaard `beta`
  - stabiele npm-publicatie kan expliciet `latest` targeten via workflowinput
  - tokengebaseerde npm dist-tag-mutatie leeft nu in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    voor beveiliging, omdat `npm dist-tag add` nog steeds `NPM_TOKEN` nodig
    heeft terwijl de publieke repo OIDC-only-publicatie behoudt
  - publieke `macOS Release` is alleen validatie; wanneer een tag alleen op een
    releasebranch bestaat maar de workflow vanaf `main` wordt gedispatcht, stel
    `public_release_branch=release/YYYY.M.D` in
  - echte private mac-publicatie moet slagen met succesvolle private mac
    `preflight_run_id` en `validate_run_id`
  - de echte publicatiepaden promoveren voorbereide artefacten in plaats van ze
    opnieuw te bouwen
- Voor stabiele correctiereleases zoals `YYYY.M.D-N` controleert de
  post-publishverifier ook hetzelfde tijdelijke-prefix-upgradepad van `YYYY.M.D`
  naar `YYYY.M.D-N` zodat releasecorrecties niet stilletjes oudere globale
  installaties op de basisstabiele payload laten staan
- npm-releasepreflight faalt gesloten tenzij de tarball zowel
  `dist/control-ui/index.html` als een niet-lege `dist/control-ui/assets/`-payload
  bevat, zodat we niet opnieuw een leeg browserdashboard verzenden
- Post-publishverificatie controleert ook dat gepubliceerde Plugin-entrypoints en
  pakketmetadata aanwezig zijn in de geïnstalleerde registry-layout. Een release
  die ontbrekende Plugin-runtimepayloads verzendt, faalt de postpublishverifier
  en kan niet naar `latest` worden gepromoveerd.
- `pnpm test:install:smoke` handhaaft ook het npm pack `unpackedSize`-budget op
  de kandidaat-updatetarball, zodat installer-e2e onbedoelde pack-bloat opvangt
  vóór het releasepublicatiepad
- Als het releasewerk CI-planning, extension-timingmanifests of
  extension-testmatrices heeft geraakt, regenereer en review dan vóór goedkeuring
  de door de planner beheerde `plugin-prerelease-extension-shard`-matrixoutputs
  uit `.github/workflows/plugin-prerelease.yml` zodat releasenotities geen
  verouderde CI-layout beschrijven
- Gereedheid voor stabiele macOS-releases omvat ook de updateroppervlakken:
  - de GitHub-release moet eindigen met de verpakte `.zip`, `.dmg` en `.dSYM.zip`
  - `appcast.xml` op `main` moet na publicatie naar de nieuwe stabiele zip wijzen
  - de verpakte app moet een niet-debug bundle-id, een niet-lege Sparkle-feed-URL
    en een `CFBundleVersion` op of boven de canonieke Sparkle-buildvloer voor die
    releaseversie behouden

## Release-testboxen

`Full Release Validation` is hoe operators alle pre-release-tests vanaf één
ingangspunt starten. Gebruik voor een pinned commit-bewijs op een snel bewegende
branch de helper zodat elke child-workflow vanaf een tijdelijke branch draait
die vastgezet is op de target-SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

De helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation`
vanaf die branch met `ref=<sha>`, verifieert dat elke child-workflow-`headSha`
overeenkomt met de target, en verwijdert daarna de tijdelijke branch. Dit
voorkomt dat per ongeluk een nieuwere `main`-childrun wordt bewezen.

Voor releasebranch- of tagvalidatie voer je dit uit vanaf de vertrouwde
`main`-workflowref en geef je de releasebranch of tag door als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

De workflow bepaalt de doel-ref, start handmatig `CI` met
`target_ref=<release-ref>`, start `OpenClaw Release Checks` en start
zelfstandige package-Telegram-E2E wanneer `release_profile=full` met
`rerun_group=all` of wanneer `npm_telegram_package_spec` is ingesteld.
`OpenClaw Release Checks` waaiert vervolgens uit naar install-smoke,
cross-OS-releasechecks, live/E2E-Docker-dekking voor het releasepad, Package
Acceptance met QA voor het Telegram-pakket, QA Lab-pariteit, live Matrix en live
Telegram. Een volledige run is alleen acceptabel wanneer de samenvatting van
`Full Release Validation` `normal_ci` en `release_checks` als geslaagd toont. In
de full/all-modus moet de child `npm_telegram` ook slagen; buiten full/all wordt
die overgeslagen tenzij een gepubliceerde `npm_telegram_package_spec` is
opgegeven. De uiteindelijke verifier-samenvatting bevat tabellen met traagste
jobs voor elke child-run, zodat de releasebeheerder het huidige kritieke pad kan
zien zonder logs te downloaden.
Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
complete stagematrix, exacte workflow-jobnamen, verschillen tussen stabiel en
volledig profiel, artifacts en gerichte rerun-handles.
Child-workflows worden gestart vanaf de vertrouwde ref waarop `Full Release
Validation` draait, normaal `--ref main`, ook wanneer de doel-`ref` naar een
oudere releasebranch of tag wijst. Er is geen aparte workflow-ref-invoer voor
Full Release Validation; kies de vertrouwde harness door de workflow-run-ref te
kiezen. Gebruik `--ref main -f ref=<sha>` niet voor exact commitbewijs op
bewegende `main`; raw commit-SHA's kunnen geen workflow-dispatch-refs zijn, dus
gebruik `pnpm ci:full-release --sha <sha>` om de gepinde tijdelijke branch aan
te maken.

Gebruik `release_profile` om de live/provider-breedte te selecteren:

- `minimum`: snelste releasekritieke OpenAI/core live- en Docker-pad
- `stable`: minimum plus stabiele provider/backend-dekking voor releasegoedkeuring
- `full`: stable plus brede dekking voor advisory-providers/media

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de doel-ref
eenmaal op te lossen als `release-package-under-test` en hergebruikt dat artifact
in zowel Docker-checks voor het releasepad als Package Acceptance. Dit houdt alle
package-gerichte boxes op dezelfde bytes en voorkomt herhaalde package-builds.
De cross-OS OpenAI install smoke gebruikt `OPENCLAW_CROSS_OS_OPENAI_MODEL`
wanneer de repo/org-variabele is ingesteld, anders `openai/gpt-5.5`, omdat deze
lane package-installatie, onboarding, Gateway-opstart en één live agent-turn
bewijst in plaats van het traagste standaardmodel te benchmarken. De bredere
live-provider-matrix blijft de plek voor modelspecifieke dekking.

Gebruik deze varianten afhankelijk van de releasestage:

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

Gebruik de volledige umbrella niet als eerste rerun na een gerichte fix. Als één
box faalt, gebruik dan de mislukte child-workflow, job, Docker-lane,
package-profiel, modelprovider of QA-lane voor het volgende bewijs. Run de
volledige umbrella pas opnieuw wanneer de fix gedeelde release-orchestratie heeft
gewijzigd of eerder all-box-bewijs verouderd heeft gemaakt. De uiteindelijke
verifier van de umbrella controleert de geregistreerde child-workflow-run-id's
opnieuw, dus nadat een child-workflow succesvol opnieuw is uitgevoerd, rerun
alleen de mislukte parent-job `Verify full validation`.

Geef voor begrensd herstel `rerun_group` door aan de umbrella. `all` is de echte
release-candidate-run, `ci` voert alleen de normale CI-child uit,
`plugin-prerelease` voert alleen de release-only Plugin-child uit,
`release-checks` voert elke releasebox uit, en de smallere releasegroepen zijn
`install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`
en `npm-telegram`. Gerichte `npm-telegram`-reruns vereisen
`npm_telegram_package_spec`; full/all-runs met `release_profile=full` gebruiken
het package-artifact van release-checks.

### Vitest

De Vitest-box is de handmatige `CI`-child-workflow. Handmatige CI omzeilt
bewust changed scoping en forceert de normale testgrafiek voor de
releasecandidate: Linux Node-shards, gebundelde Plugin-shards,
kanaalcontracten, Node 22-compatibiliteit, `check`, `check-additional`,
build-smoke, docs-checks, Python-Skills, Windows, macOS, Android en Control UI
i18n.

Gebruik deze box om te beantwoorden: "is de source tree geslaagd voor de
volledige normale testsuite?" Dit is niet hetzelfde als productvalidatie voor
het releasepad. Bewaar dit bewijs:

- `Full Release Validation`-samenvatting met de URL van de gestarte `CI`-run
- groene `CI`-run op de exacte doel-SHA
- namen van mislukte of trage shards uit de CI-jobs bij het onderzoeken van regressies
- Vitest-timingartifacts zoals `.artifacts/vitest-shard-timings.json` wanneer
  een run prestatieanalyse nodig heeft

Run handmatige CI alleen rechtstreeks wanneer de release deterministische normale
CI nodig heeft, maar niet de Docker-, QA Lab-, live-, cross-OS- of package-boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

De Docker-box zit in `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus de release-modus
`install-smoke`-workflow. Deze valideert de releasecandidate via verpakte
Docker-omgevingen in plaats van alleen source-level tests.

Release-Docker-dekking omvat:

- volledige install-smoke met de trage Bun global install smoke ingeschakeld
- voorbereiding/hergebruik van de root-Dockerfile-smoke-image per doel-SHA, met
  QR-, root/Gateway- en installer/Bun-smoke-jobs als aparte install-smoke-shards
- repository-E2E-lanes
- Docker-chunks voor het releasepad: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` en `plugins-runtime-install-h`
- OpenWebUI-dekking binnen de chunk `plugins-runtime-services` wanneer gevraagd
- gesplitste install/uninstall-lanes voor gebundelde Plugins
  `bundled-plugin-install-uninstall-0` tot en met
  `bundled-plugin-install-uninstall-23`
- live/E2E-provider-suites en Docker live model-dekking wanneer releasechecks
  live-suites bevatten

Gebruik Docker-artifacts voordat je opnieuw runt. De scheduler voor het
releasepad uploadt `.artifacts/docker-tests/` met lane-logs, `summary.json`,
`failures.json`, fasetimings, scheduler-plan-JSON en rerun-commando's. Gebruik
voor gericht herstel `docker_lanes=<lane[,lane]>` op de herbruikbare
live/E2E-workflow in plaats van alle releasechunks opnieuw te runnen.
Gegenereerde rerun-commando's bevatten eerdere `package_artifact_run_id` en
voorbereide Docker-image-inputs wanneer beschikbaar, zodat een mislukte lane
dezelfde tarball en GHCR-images kan hergebruiken.

### QA Lab

De QA Lab-box is ook onderdeel van `OpenClaw Release Checks`. Het is de
releasegate voor agentic gedrag en kanaalniveau, los van Vitest en
Docker-package-mechanica.

Release-QA Lab-dekking omvat:

- mock-pariteitsgate die de OpenAI-candidate-lane vergelijkt met de Opus 4.6
  baseline met behulp van het agentic parity pack
- snel live Matrix-QA-profiel met de omgeving `qa-live-shared`
- live Telegram-QA-lane met Convex CI-credentialleases
- `pnpm qa:otel:smoke` wanneer releasetelemetrie expliciet lokaal bewijs nodig heeft

Gebruik deze box om te beantwoorden: "gedraagt de release zich correct in
QA-scenario's en live kanaalflows?" Bewaar de artifact-URL's voor de
pariteits-, Matrix- en Telegram-lanes bij het goedkeuren van de release.
Volledige Matrix-dekking blijft beschikbaar als een handmatige gesharde
QA-Lab-run in plaats van de standaard releasekritieke lane.

### Package

De Package-box is de gate voor het installeerbare product. Deze wordt ondersteund
door `Package Acceptance` en de resolver
`scripts/resolve-openclaw-package-candidate.mjs`. De resolver normaliseert een
candidate naar de `package-under-test`-tarball die door Docker E2E wordt
gebruikt, valideert de package-inventaris, registreert de packageversie en
SHA-256, en houdt de workflow-harness-ref gescheiden van de package-source-ref.

Ondersteunde candidate-bronnen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-releaseversie
- `source=ref`: pak een vertrouwde `package_ref`-branch, tag of volledige commit-SHA
  met de geselecteerde `workflow_ref`-harness
- `source=url`: download een HTTPS-`.tgz` met verplichte `package_sha256`
- `source=artifact`: hergebruik een `.tgz` die door een andere GitHub Actions-run is geüpload

`OpenClaw Release Checks` runt Package Acceptance met `source=artifact`, het
voorbereide release-package-artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=release-history`,
`published_upgrade_survivor_scenarios=reported-issues` en
`telegram_mode=mock-openai`. Package Acceptance houdt migratie, update, cleanup
van stale Plugin-afhankelijkheden, offline Plugin-fixtures, Plugin-update en
QA voor het Telegram-pakket tegen dezelfde opgeloste tarball. Het is de
GitHub-native vervanging voor het grootste deel van de package/update-dekking
die eerder Parallels vereiste. Cross-OS-releasechecks blijven belangrijk voor
OS-specifieke onboarding, installers en platformgedrag, maar productvalidatie
voor package/update hoort Package Acceptance te verkiezen.

De canonieke checklist voor update- en Plugin-validatie is
[Updates en Plugins testen](/nl/help/testing-updates-plugins). Gebruik deze bij het
bepalen welke lokale, Docker-, Package Acceptance- of releasecheck-lane een
Plugin-install/update, doctor-cleanup of migratiewijziging voor een gepubliceerd
package bewijst. Uitputtende gepubliceerde update-migratie vanuit elk stabiel
`2026.4.23+`-package is een aparte handmatige `Update Migration`-workflow, geen
onderdeel van Full Release CI.

Legacy package-acceptance-leniency is bewust tijdelijk afgebakend. Packages tot
en met `2026.4.25` mogen het compatibiliteitspad gebruiken voor metadata-gaten
die al naar npm zijn gepubliceerd: private QA-inventarisitems die ontbreken in de
tarball, ontbrekende `gateway install --wrapper`, ontbrekende patchbestanden in
de uit de tarball afgeleide git-fixture, ontbrekende gepersisteerde
`update.channel`, legacy locaties voor Plugin-install-records, ontbrekende
persistentie van marketplace-install-records en config-metadatamigratie tijdens
`plugins update`. Het gepubliceerde `2026.4.26`-package mag waarschuwen voor
lokale build-metadatastempelbestanden die al zijn shipped. Latere packages
moeten aan de moderne packagecontracten voldoen; diezelfde gaten laten
releasevalidatie falen.

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

Veelgebruikte package-profielen:

- `smoke`: snelle package-install/kanaal/agent-, Gateway-netwerk- en config-reload-lanes
- `package`: install/update/Plugin-packagecontracten zonder live ClawHub; dit is de standaard
  voor releasechecks
- `product`: `package` plus MCP-kanalen, cron/subagent-cleanup, OpenAI-webzoekfunctie
  en OpenWebUI
- `full`: Docker-releasepadchunks met OpenWebUI
- `custom`: exacte `docker_lanes`-lijst voor gerichte reruns

Voor Telegram-bewijs voor pakketkandidaten schakel je `telegram_mode=mock-openai` of
`telegram_mode=live-frontier` in op Package Acceptance. De workflow geeft de
opgeloste `package-under-test`-tarball door aan de Telegram-lane; de zelfstandige
Telegram-workflow accepteert nog steeds een gepubliceerde npm-specificatie voor controles na publicatie.

## Automatisering voor releasepublicatie

`OpenClaw Release Publish` is het normale muterende publicatie-entrypoint. Het
orkestreert de trusted-publisher-workflows in de volgorde die de release nodig heeft:

1. Check de releasetag uit en los de commit-SHA ervan op.
2. Controleer of de tag bereikbaar is vanaf `main` of `release/*`.
3. Voer `pnpm plugins:sync:check` uit.
4. Dispatch `Plugin NPM Release` met `publish_scope=all-publishable` en
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` met dezelfde scope en SHA.
6. Dispatch `OpenClaw NPM Release` met de releasetag, npm-dist-tag en
   opgeslagen `preflight_run_id`.

Voorbeeld voor betapublicatie:

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

Gebruik de lagere `Plugin NPM Release`- en `Plugin ClawHub Release`-workflows
alleen voor gericht herstel- of herpublicatiewerk. Geef voor herstel van een geselecteerde Plugin
`plugin_publish_scope=selected` en `plugins=@openclaw/name` door aan
`OpenClaw Release Publish`, of dispatch de onderliggende workflow rechtstreeks wanneer het
OpenClaw-pakket niet gepubliceerd mag worden.

## NPM-workflowinvoer

`OpenClaw NPM Release` accepteert deze door operators beheerde invoer:

- `tag`: vereiste releasetag zoals `v2026.4.2`, `v2026.4.2-1` of
  `v2026.4.2-beta.1`; wanneer `preflight_only=true`, mag dit ook de huidige
  volledige workflow-branch-commit-SHA van 40 tekens zijn voor preflight die alleen valideert
- `preflight_only`: `true` alleen voor validatie/build/pakket, `false` voor het
  echte publicatiepad
- `preflight_run_id`: vereist op het echte publicatiepad zodat de workflow de
  voorbereide tarball uit de geslaagde preflight-run hergebruikt
- `npm_dist_tag`: npm-doeltag voor het publicatiepad; standaard `beta`

`OpenClaw Release Publish` accepteert deze door operators beheerde invoer:

- `tag`: vereiste releasetag; moet al bestaan
- `preflight_run_id`: geslaagde `OpenClaw NPM Release`-preflight-run-id;
  vereist wanneer `publish_openclaw_npm=true`
- `npm_dist_tag`: npm-doeltag voor het OpenClaw-pakket
- `plugin_publish_scope`: standaard `all-publishable`; gebruik `selected` alleen
  voor gericht herstelwerk
- `plugins`: door komma's gescheiden `@openclaw/*`-pakketnamen wanneer
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: standaard `true`; stel alleen in op `false` wanneer je de
  workflow gebruikt als herstelorkestrator alleen voor Plugins

`OpenClaw Release Checks` accepteert deze door operators beheerde invoer:

- `ref`: branch, tag of volledige commit-SHA om te valideren. Controles met secrets
  vereisen dat de opgeloste commit bereikbaar is vanaf een OpenClaw-branch of
  releasetag.

Regels:

- Stabiele en correctietags mogen naar `beta` of `latest` publiceren
- Betaprerelease-tags mogen alleen naar `beta` publiceren
- Voor `OpenClaw NPM Release` is volledige commit-SHA-invoer alleen toegestaan wanneer
  `preflight_only=true`
- `OpenClaw Release Checks` en `Full Release Validation` zijn altijd
  alleen-validatie
- Het echte publicatiepad moet dezelfde `npm_dist_tag` gebruiken als tijdens preflight;
  de workflow controleert die metadata voordat publicatie doorgaat

## Stabiele npm-releasereeks

Bij het maken van een stabiele npm-release:

1. Voer `OpenClaw NPM Release` uit met `preflight_only=true`
   - Voordat er een tag bestaat, mag je de huidige volledige workflow-branch-commit-
     SHA gebruiken voor een validatie-only dry-run van de preflight-workflow
2. Kies `npm_dist_tag=beta` voor de normale beta-first-flow, of alleen `latest`
   wanneer je bewust rechtstreeks stabiel wilt publiceren
3. Voer `Full Release Validation` uit op de releasebranch, releasetag of volledige
   commit-SHA wanneer je normale CI plus live promptcache, Docker, QA Lab,
   Matrix en Telegram-dekking vanuit één handmatige workflow wilt
4. Als je bewust alleen de deterministische normale testgrafiek nodig hebt, voer dan in plaats daarvan de
   handmatige `CI`-workflow uit op de releaseref
5. Sla de geslaagde `preflight_run_id` op
6. Voer `OpenClaw Release Publish` uit met dezelfde `tag`, dezelfde `npm_dist_tag`,
   en de opgeslagen `preflight_run_id`; dit publiceert geëxternaliseerde Plugins naar npm
   en ClawHub voordat het OpenClaw-npm-pakket wordt gepromoot
7. Als de release op `beta` is geland, gebruik dan de private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`-
   workflow om die stabiele versie van `beta` naar `latest` te promoveren
8. Als de release bewust rechtstreeks naar `latest` is gepubliceerd en `beta`
   direct dezelfde stabiele build moet volgen, gebruik dan diezelfde private
   workflow om beide dist-tags naar de stabiele versie te laten verwijzen, of laat de geplande
   zelfherstellende synchronisatie `beta` later verplaatsen

De dist-tag-mutatie staat in de private repo om veiligheidsredenen, omdat deze nog steeds
`NPM_TOKEN` vereist, terwijl de publieke repo publicatie alleen via OIDC houdt.

Daardoor blijven het rechtstreekse publicatiepad en het beta-first-promotiepad beide
gedocumenteerd en zichtbaar voor operators.

Als een maintainer moet terugvallen op lokale npm-authenticatie, voer dan alle 1Password
CLI-commando's (`op`) alleen uit binnen een toegewijde tmux-sessie. Roep `op` niet
rechtstreeks aan vanuit de hoofd-agent-shell; door het binnen tmux te houden zijn prompts,
waarschuwingen en OTP-afhandeling observeerbaar en worden herhaalde hostwaarschuwingen voorkomen.

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
voor het daadwerkelijke runbook.

## Gerelateerd

- [Releasekanalen](/nl/install/development-channels)
