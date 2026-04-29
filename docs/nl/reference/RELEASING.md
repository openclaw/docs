---
read_when:
    - Zoeken naar openbare definities van releasekanalen
    - Releasevalidatie of pakketacceptatie uitvoeren
    - Zoeken naar versienaamgeving en cadans
summary: Release-lanes, operatorchecklist, validatieboxen, versienaamgeving en cadans
title: Releasebeleid
x-i18n:
    generated_at: "2026-04-29T23:15:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54dc9ad7918ac95ec535a0404bbcbc04461a2b977151db0c2039b91e7e69c15c
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw heeft drie publieke releaselanes:

- stable: getagde releases die standaard naar npm `beta` publiceren, of naar npm `latest` wanneer dat expliciet wordt gevraagd
- beta: prerelease-tags die naar npm `beta` publiceren
- dev: de bewegende HEAD van `main`

## Versienaamgeving

- Stabiele releaseversie: `YYYY.M.D`
  - Git-tag: `vYYYY.M.D`
- Versie van stabiele correctierelease: `YYYY.M.D-N`
  - Git-tag: `vYYYY.M.D-N`
- Bèta-prereleaseversie: `YYYY.M.D-beta.N`
  - Git-tag: `vYYYY.M.D-beta.N`
- Vul maand of dag niet aan met nullen
- `latest` betekent de huidige gepromote stabiele npm-release
- `beta` betekent het huidige bèta-installatiedoel
- Stabiele en stabiele correctiereleases publiceren standaard naar npm `beta`; releaseoperators kunnen expliciet `latest` als doel kiezen, of later een gecontroleerde bèta-build promoveren
- Elke stabiele OpenClaw-release levert het npm-pakket en de macOS-app samen;
  bèta-releases valideren en publiceren normaal eerst het npm-/pakketpad, met
  bouwen/ondertekenen/notariëren van de Mac-app gereserveerd voor stabiel, tenzij expliciet gevraagd

## Releasecadans

- Releases gaan eerst naar bèta
- Stabiel volgt pas nadat de nieuwste bèta is gevalideerd
- Maintainers maken releases normaal vanaf een `release/YYYY.M.D`-branch die is gemaakt
  vanaf de huidige `main`, zodat releasevalidatie en fixes nieuwe
  ontwikkeling op `main` niet blokkeren
- Als een bèta-tag is gepusht of gepubliceerd en een fix nodig heeft, maken maintainers
  de volgende `-beta.N`-tag in plaats van de oude bèta-tag te verwijderen of opnieuw te maken
- Gedetailleerde releaseprocedure, goedkeuringen, credentials en herstelnotities zijn
  alleen voor maintainers

## Checklist voor releaseoperators

Deze checklist is de publieke vorm van de releaseflow. Privécredentials,
ondertekening, notariëring, dist-tag-herstel en details voor noodrollback blijven in
het release-runbook dat alleen voor maintainers is.

1. Begin vanaf de huidige `main`: haal de nieuwste wijzigingen op, bevestig dat de doelcommit is gepusht,
   en bevestig dat de huidige `main`-CI groen genoeg is om hiervan een branch te maken.
2. Herschrijf de bovenste sectie van `CHANGELOG.md` op basis van echte commitgeschiedenis met
   `/changelog`, houd vermeldingen gebruikersgericht, commit deze, push deze, en rebase/pull
   nog één keer voordat je een branch maakt.
3. Controleer releasecompatibiliteitsrecords in
   `src/plugins/compat/registry.ts` en
   `src/commands/doctor/shared/deprecation-compat.ts`. Verwijder verlopen
   compatibiliteit alleen wanneer het upgradepad gedekt blijft, of leg vast waarom deze
   bewust wordt behouden.
4. Maak `release/YYYY.M.D` vanaf de huidige `main`; doe normaal releasewerk niet
   direct op `main`.
5. Verhoog elke vereiste versielocatie voor de beoogde tag en voer daarna de
   lokale deterministische preflight uit:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, en `pnpm release:check`.
6. Voer `OpenClaw NPM Release` uit met `preflight_only=true`. Voordat er een tag bestaat,
   is een volledige SHA van 40 tekens van de releasebranch toegestaan voor validatie-only
   preflight. Bewaar de succesvolle `preflight_run_id`.
7. Start alle prerelease-tests met `Full Release Validation` voor de
   releasebranch, tag of volledige commit-SHA. Dit is het ene handmatige ingangspunt
   voor de vier grote releasetestboxen: Vitest, Docker, QA Lab en Package.
8. Als validatie mislukt, fix dit op de releasebranch en voer opnieuw het kleinste mislukte
   bestand, de lane, workflowjob, pakketprofiel, provider of model-allowlist uit die
   de fix bewijst. Voer de volledige overkoepelende validatie alleen opnieuw uit wanneer het gewijzigde oppervlak
   eerder bewijs verouderd maakt.
9. Voor bèta: tag `vYYYY.M.D-beta.N`, publiceer met npm-dist-tag `beta`, en voer daarna
   post-publish pakketacceptatie uit tegen het gepubliceerde `openclaw@YYYY.M.D-beta.N`
   of `openclaw@beta`-pakket. Als een gepushte of gepubliceerde bèta een fix nodig heeft, maak dan
   de volgende `-beta.N`; verwijder of herschrijf de oude bèta niet.
10. Voor stabiel: ga alleen verder nadat de gecontroleerde bèta of release candidate het
    vereiste validatiebewijs heeft. Stabiele npm-publicatie hergebruikt het succesvolle
    preflight-artefact via `preflight_run_id`; gereedheid voor stabiele macOS-release
    vereist ook de verpakte `.zip`, `.dmg`, `.dSYM.zip` en bijgewerkte
    `appcast.xml` op `main`.
11. Na publicatie voer je de npm-post-publish-verifier uit, eventueel de standalone
    gepubliceerde-npm Telegram E2E wanneer je post-publish kanaalbewijs nodig hebt,
    dist-tag-promotie wanneer nodig, GitHub-release-/prerelease-notities uit de
    volledig overeenkomende `CHANGELOG.md`-sectie, en de stappen voor de releaseaankondiging.

## Release-preflight

- Voer `pnpm check:test-types` uit vóór de release-preflight, zodat test-TypeScript
  buiten de snellere lokale `pnpm check`-gate gedekt blijft
- Voer `pnpm check:architecture` uit vóór de release-preflight, zodat de bredere
  importcyclus- en architectuurgrenscontroles groen zijn buiten de snellere lokale gate
- Voer `pnpm build && pnpm ui:build` uit vóór `pnpm release:check`, zodat de verwachte
  `dist/*`-releaseartefacten en Control UI-bundel bestaan voor de
  pakketvalidatiestap
- Voer de handmatige `Full Release Validation`-workflow uit vóór releasegoedkeuring om
  alle pre-release-testboxen vanuit één ingangspunt te starten. Deze accepteert een branch,
  tag of volledige commit-SHA, dispatcht handmatige `CI` en dispatcht
  `OpenClaw Release Checks` voor installatiesmoke, pakketacceptatie, Docker
  release-path-suites, live/E2E, OpenWebUI, QA Lab-pariteit, Matrix en Telegram
  lanes. Geef `npm_telegram_package_spec` alleen op nadat een pakket is
  gepubliceerd en de post-publish Telegram E2E ook moet draaien. Geef
  `evidence_package_spec` op wanneer het private bewijsrapport moet aantonen dat de
  validatie overeenkomt met een gepubliceerd npm-pakket zonder Telegram E2E af te dwingen.
  Voorbeeld:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Voer de handmatige `Package Acceptance`-workflow uit wanneer je aanvullend bewijs
  via een nevenkanaal wilt voor een pakketkandidaat terwijl het releasewerk doorgaat. Gebruik `source=npm` voor
  `openclaw@beta`, `openclaw@latest` of een exacte releaseversie; `source=ref`
  om een vertrouwde `package_ref`-branch/tag/SHA te packen met de huidige
  `workflow_ref`-harnas; `source=url` voor een HTTPS-tarball met een vereiste
  SHA-256; of `source=artifact` voor een tarball die door een andere GitHub
  Actions-run is geüpload. De workflow resolved de kandidaat naar
  `package-under-test`, hergebruikt de Docker E2E-releaseplanner tegen die
  tarball en kan Telegram-QA tegen dezelfde tarball draaien met
  `telegram_mode=mock-openai` of `telegram_mode=live-frontier`.
  Voorbeeld: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Veelgebruikte profielen:
  - `smoke`: installatie-/kanaal-/agent-, Gateway-netwerk- en config-herlaadlanes
  - `package`: artefact-native pakket-/update-/Plugin-lanes zonder OpenWebUI of live ClawHub
  - `product`: pakketprofiel plus MCP-kanalen, Cron-/subagent-opruiming,
    OpenAI-webzoekopdracht en OpenWebUI
  - `full`: Docker release-path-chunks met OpenWebUI
  - `custom`: exacte `docker_lanes`-selectie voor een gerichte heruitvoering
- Voer de handmatige `CI`-workflow rechtstreeks uit wanneer je alleen volledige normale CI-dekking
  voor de releasekandidaat nodig hebt. Handmatige CI-dispatches omzeilen changed
  scoping en forceren de Linux Node-shards, gebundelde-Plugin-shards, kanaalcontracten,
  Node 22-compatibiliteit, `check`, `check-additional`, build-smoke,
  docs-controles, Python Skills, Windows, macOS, Android en Control UI i18n
  lanes.
  Voorbeeld: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Voer `pnpm qa:otel:smoke` uit bij het valideren van releasetelemetrie. Dit oefent
  QA-lab via een lokale OTLP/HTTP-ontvanger en verifieert de geëxporteerde trace-
  spannamen, begrensde attributen en redactie van inhoud/identifiers zonder
  Opik, Langfuse of een andere externe collector te vereisen.
- Voer `pnpm release:check` uit vóór elke getagde release
- Releasecontroles draaien nu in een aparte handmatige workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` draait ook de QA Lab-mockpariteitsgate plus het snelle
  live Matrix-profiel en de Telegram-QA-lane vóór releasegoedkeuring. De live
  lanes gebruiken de `qa-live-shared`-omgeving; Telegram gebruikt ook Convex CI-
  credentialleases. Voer de handmatige `QA-Lab - All Lanes`-workflow uit met
  `matrix_profile=all` en `matrix_shards=true` wanneer je de volledige Matrix-
  transport-, media- en E2EE-inventaris parallel wilt.
- Cross-OS-installatie- en upgrade-runtimevalidatie maakt deel uit van publieke
  `OpenClaw Release Checks` en `Full Release Validation`, die de
  herbruikbare workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` rechtstreeks aanroepen
- Deze splitsing is opzettelijk: houd het echte npm-releasepad kort,
  deterministisch en artefactgericht, terwijl tragere livecontroles in hun
  eigen lane blijven zodat ze publiceren niet vertragen of blokkeren
- Releasecontroles met secrets moeten worden gedispatcht via `Full Release
Validation` of vanuit de `main`-/release-workflowref, zodat workflowlogica en
  secrets gecontroleerd blijven
- `OpenClaw Release Checks` accepteert een branch, tag of volledige commit-SHA zolang
  de opgeloste commit bereikbaar is vanaf een OpenClaw-branch of releasetag
- `OpenClaw NPM Release` validatie-only preflight accepteert ook de huidige
  volledige 40-tekens workflow-branch-commit-SHA zonder een gepushte tag te vereisen
- Dat SHA-pad is alleen voor validatie en kan niet worden gepromoveerd naar een echte publish
- In SHA-modus synthetiseert de workflow `v<package.json version>` alleen voor de
  pakketmetadatacontrole; echte publish vereist nog steeds een echte releasetag
- Beide workflows houden het echte publish- en promotiepad op GitHub-hosted
  runners, terwijl het niet-mutating validatiepad de grotere
  Blacksmith Linux-runners kan gebruiken
- Die workflow draait
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  met zowel de `OPENAI_API_KEY`- als `ANTHROPIC_API_KEY`-workflowsecrets
- npm-releasepreflight wacht niet langer op de aparte releasecontroles-lane
- Voer `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (of de bijbehorende beta-/correctietag) uit vóór goedkeuring
- Voer na npm publish
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (of de bijbehorende beta-/correctieversie) uit om het gepubliceerde registry-
  installatiepad in een verse tijdelijke prefix te verifiëren
- Voer na een beta-publish `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  uit om onboarding van geïnstalleerde pakketten, Telegram-installatie en echte Telegram E2E
  tegen het gepubliceerde npm-pakket te verifiëren met de gedeelde geleasede Telegram-credentialpool.
  Lokale eenmalige maintainer-runs kunnen de Convex-vars weglaten en de drie
  `OPENCLAW_QA_TELEGRAM_*` env-credentials rechtstreeks doorgeven.
- Maintainers kunnen dezelfde post-publish-controle vanuit GitHub Actions uitvoeren via de
  handmatige `NPM Telegram Beta E2E`-workflow. Deze is bewust alleen handmatig en
  draait niet bij elke merge.
- Maintainer-releaseautomatisering gebruikt nu preflight-then-promote:
  - echte npm publish moet een succesvolle npm `preflight_run_id` hebben
  - de echte npm publish moet worden gedispatcht vanaf dezelfde `main`- of
    `release/YYYY.M.D`-branch als de succesvolle preflight-run
  - stabiele npm-releases gebruiken standaard `beta`
  - stabiele npm publish kan expliciet `latest` targeten via workflowinput
  - op tokens gebaseerde npm dist-tag-mutatie staat nu in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    voor beveiliging, omdat `npm dist-tag add` nog steeds `NPM_TOKEN` nodig heeft terwijl de
    publieke repo OIDC-only publish houdt
  - publieke `macOS Release` is alleen voor validatie
  - echte private Mac-publish moet een succesvolle private Mac
    `preflight_run_id` en `validate_run_id` hebben
  - de echte publishpaden promoten voorbereide artefacten in plaats van ze opnieuw te bouwen
- Voor stabiele correctiereleases zoals `YYYY.M.D-N` controleert de post-publish-verifier
  ook hetzelfde tijdelijke-prefix-upgradepad van `YYYY.M.D` naar `YYYY.M.D-N`,
  zodat releasecorrecties oudere globale installaties niet stilzwijgend op de
  basis-stabiele payload laten staan
- npm-releasepreflight faalt gesloten tenzij de tarball zowel
  `dist/control-ui/index.html` als een niet-lege `dist/control-ui/assets/`-payload bevat,
  zodat we niet opnieuw een leeg browserdashboard shippen
- Post-publish-verificatie controleert ook of de gepubliceerde registry-installatie
  niet-lege gebundelde Plugin-runtimeafhankelijkheden bevat onder de root-`dist/*`-
  layout. Een release die met ontbrekende of lege payloads voor gebundelde Plugin-
  afhankelijkheden shipt, faalt de postpublish-verifier en kan niet naar `latest`
  worden gepromoveerd.
- `pnpm test:install:smoke` dwingt ook het npm-pack-`unpackedSize`-budget af op
  de kandidaat-updatetarball, zodat installer-e2e accidentele pack-bloat opvangt
  vóór het release-publishpad
- Als het releasewerk CI-planning, extensietimingmanifesten of
  extensietestmatrices heeft geraakt, regenereer en review dan de planner-owned
  `plugin-prerelease-extension-shard`-matrixoutputs uit
  `.github/workflows/plugin-prerelease.yml` vóór goedkeuring, zodat releasenotes geen
  verouderde CI-layout beschrijven
- Gereedheid voor stabiele macOS-releases omvat ook de updater-oppervlakken:
  - de GitHub-release moet uiteindelijk de verpakte `.zip`, `.dmg` en `.dSYM.zip` bevatten
  - `appcast.xml` op `main` moet na publish naar de nieuwe stabiele zip wijzen
  - de verpakte app moet een niet-debug-bundle-id, een niet-lege Sparkle-feed-
    URL en een `CFBundleVersion` op of boven de canonieke Sparkle-buildvloer
    voor die releaseversie behouden

## Release-testboxen

`Full Release Validation` is hoe operators alle pre-release-tests vanuit
één ingangspunt starten. Voer deze uit vanaf de vertrouwde `main`-workflowref en geef de release-
branch, tag of volledige commit-SHA door als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

De workflow resolved de doelref, dispatcht handmatige `CI` met
`target_ref=<release-ref>`, dispatcht `OpenClaw Release Checks` en
dispatcht optioneel zelfstandige post-publish Telegram E2E wanneer
`npm_telegram_package_spec` is ingesteld. `OpenClaw Release Checks` waaiert vervolgens uit naar
installatiesmoke, cross-OS-releasecontroles, live/E2E Docker release-path-dekking,
Package Acceptance met Telegram-pakket-QA, QA Lab-pariteit, live Matrix en
live Telegram. Een volledige run is alleen acceptabel wanneer de `Full Release Validation`-
samenvatting `normal_ci` en `release_checks` als succesvol toont, en elk optioneel
`npm_telegram`-child succesvol of bewust overgeslagen is. De uiteindelijke
verifiersamenvatting bevat tabellen met traagste jobs voor elke child-run, zodat de release-
manager het huidige kritieke pad kan zien zonder logs te downloaden.
Child-workflows worden gedispatcht vanaf de vertrouwde ref die `Full Release
Validation` draait, normaal `--ref main`, zelfs wanneer de doel-`ref` naar een
oudere releasebranch of tag wijst. Er is geen aparte Full Release Validation
workflow-ref-input; kies het vertrouwde harnas door de workflow-run-ref te kiezen.

Gebruik `release_profile` om live/provider-breedte te selecteren:

- `minimum`: snelste releasekritieke OpenAI/core-live- en Docker-pad
- `stable`: minimum plus stabiele provider-/backenddekking voor releasegoedkeuring
- `full`: stable plus brede advisory provider-/media-dekking

`OpenClaw Release Checks` gebruikt de vertrouwde workflowref om de doelref
één keer te resolven als `release-package-under-test` en hergebruikt dat artefact in zowel
release-path Docker-controles als Package Acceptance. Dit houdt alle
pakketgerichte boxen op dezelfde bytes en voorkomt herhaalde pakketbuilds.
De cross-OS OpenAI-installatiesmoke gebruikt `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer de
repo-/org-variabele is ingesteld, anders `openai/gpt-5.4-mini`, omdat deze lane
pakketinstallatie, onboarding, Gateway-startup en één live agentbeurt bewijst
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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Gebruik de volledige paraplu niet als eerste herhaling na een gerichte fix. Als één box
mislukt, gebruik dan de mislukte onderliggende workflow, job, Docker-lane, pakketprofiel, modelprovider
of QA-lane voor het volgende bewijs. Voer de volledige paraplu alleen opnieuw uit wanneer
de fix gedeelde releaseorkestratie heeft gewijzigd of eerder bewijs voor alle boxen
verouderd heeft gemaakt. De uiteindelijke verifier van de paraplu controleert de vastgelegde uitvoer-id's
van de onderliggende workflows opnieuw, dus nadat een onderliggende workflow succesvol opnieuw is uitgevoerd, voer je alleen de mislukte
bovenliggende job `Verify full validation` opnieuw uit.

Geef voor begrensd herstel `rerun_group` door aan de paraplu. `all` is de echte
release-candidate-run, `ci` voert alleen de normale onderliggende CI uit, `plugin-prerelease`
voert alleen de release-only onderliggende Plugin uit, `release-checks` voert elke release-
box uit, en de smallere releasegroepen zijn `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` en `npm-telegram` wanneer de
zelfstandige pakket-Telegram-lane wordt meegegeven.

### Vitest

De Vitest-box is de handmatige onderliggende workflow `CI`. Handmatige CI omzeilt bewust
changed scoping en forceert de normale testgrafiek voor de release candidate:
Linux Node-shards, gebundelde-Plugin-shards, kanaalcontracten, Node 22-
compatibiliteit, `check`, `check-additional`, build-smoke, docs-controles, Python-
Skills, Windows, macOS, Android en Control UI i18n.

Gebruik deze box om te beantwoorden: "is de source tree geslaagd voor de volledige normale testsuite?"
Dit is niet hetzelfde als productvalidatie van het releasepad. Bewijs om te bewaren:

- `Full Release Validation`-samenvatting met de URL van de verzonden `CI`-run
- `CI`-run groen op de exacte doel-SHA
- namen van mislukte of trage shards uit de CI-jobs bij het onderzoeken van regressies
- Vitest-timingartefacten zoals `.artifacts/vitest-shard-timings.json` wanneer
  een run prestatieanalyse nodig heeft

Voer handmatige CI alleen rechtstreeks uit wanneer de release deterministische normale CI nodig heeft, maar
niet de Docker-, QA Lab-, live-, cross-OS- of pakketboxen:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

De Docker-box bevindt zich in `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus de release-mode
`install-smoke`-workflow. Deze valideert de release candidate via verpakte
Docker-omgevingen in plaats van alleen tests op sourceniveau.

Release-Docker-dekking omvat:

- volledige install-smoke met de langzame Bun global install-smoke ingeschakeld
- voorbereiding/hergebruik van de root Dockerfile-smoke-image per doel-SHA, met QR-,
  root/Gateway- en installer/Bun-smokejobs die als aparte install-smoke-
  shards draaien
- repository-E2E-lanes
- Docker-chunks voor het releasepad: `core`, `package-update-openai`,
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
- opgesplitste gebundelde-kanaal-afhankelijkheidslanes over channel-smoke, update-target
  en setup/runtime-contractchunks in plaats van één grote gebundelde-kanaal-job
- opgesplitste install/uninstall-lanes voor gebundelde Plugins
  `bundled-plugin-install-uninstall-0` tot en met
  `bundled-plugin-install-uninstall-23`
- live/E2E-providersuites en Docker live-modeldekking wanneer releasecontroles
  live suites bevatten

Gebruik Docker-artefacten voordat je opnieuw uitvoert. De releasepad-scheduler uploadt
`.artifacts/docker-tests/` met lanelogs, `summary.json`, `failures.json`,
fasetimings, schedulerplan-JSON en herhalingscommando's. Gebruik voor gericht herstel
`docker_lanes=<lane[,lane]>` op de herbruikbare live/E2E-workflow in plaats van
alle releasechunks opnieuw uit te voeren. Gegenereerde herhalingscommando's bevatten eerdere
`package_artifact_run_id` en voorbereide Docker-image-inputs wanneer beschikbaar, zodat een
mislukte lane dezelfde tarball en GHCR-images kan hergebruiken.

### QA Lab

De QA Lab-box is ook onderdeel van `OpenClaw Release Checks`. Dit is de agentic
gedrags- en kanaalniveau-releasegate, los van Vitest en Docker-
pakketmechanica.

Release-QA Lab-dekking omvat:

- mock-pariteitsgate die de OpenAI-kandidaat-lane vergelijkt met de Opus 4.6-
  baseline met het agentic parity pack
- snel live Matrix-QA-profiel met de omgeving `qa-live-shared`
- live Telegram-QA-lane met Convex CI-credentialleases
- `pnpm qa:otel:smoke` wanneer releasetelemetrie expliciet lokaal bewijs nodig heeft

Gebruik deze box om te beantwoorden: "gedraagt de release zich correct in QA-scenario's en
live kanaalflows?" Bewaar de artefact-URL's voor de pariteits-, Matrix- en Telegram-
lanes bij het goedkeuren van de release. Volledige Matrix-dekking blijft beschikbaar als een
handmatige gesharde QA-Lab-run in plaats van de standaard releasekritieke lane.

### Pakket

De pakketbox is de gate voor het installeerbare product. Deze wordt ondersteund door
`Package Acceptance` en de resolver
`scripts/resolve-openclaw-package-candidate.mjs`. De resolver normaliseert een
kandidaat naar de `package-under-test`-tarball die door Docker E2E wordt gebruikt, valideert
de pakketvoorraad, registreert de pakketversie en SHA-256, en houdt de
workflow-harness-ref gescheiden van de pakketsource-ref.

Ondersteunde kandidaatbronnen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-release-
  versie
- `source=ref`: pak een vertrouwde `package_ref`-branch, tag of volledige commit-SHA
  met de geselecteerde `workflow_ref`-harness
- `source=url`: download een HTTPS-`.tgz` met vereiste `package_sha256`
- `source=artifact`: hergebruik een `.tgz` die door een andere GitHub Actions-run is geüpload

`OpenClaw Release Checks` voert Package Acceptance uit met `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline` en
`telegram_mode=mock-openai`. De Docker-chunks van het releasepad dekken de
overlappende install-, update- en Plugin-update-lanes; Package Acceptance behoudt
artefact-native gebundelde-kanaalcompatibiliteit, offline Plugin-fixtures en Telegram-
pakket-QA tegen dezelfde opgeloste tarball. Het is de GitHub-native
vervanging voor het grootste deel van de pakket/update-dekking waarvoor eerder
Parallels nodig was. Cross-OS-releasecontroles blijven belangrijk voor OS-specifieke onboarding,
installer- en platformgedrag, maar pakket/update-productvalidatie moet
Package Acceptance verkiezen.

Legacy pakketacceptatie-tolerantie is bewust in tijd begrensd. Pakketten tot en met
`2026.4.25` mogen het compatibiliteitspad gebruiken voor metadatagaten die al naar
npm zijn gepubliceerd: private QA-inventory-items die ontbreken in de tarball, ontbrekende
`gateway install --wrapper`, ontbrekende patchbestanden in de uit tarball afgeleide git-
fixture, ontbrekende persistente `update.channel`, legacy install-record-locaties voor Plugins,
ontbrekende persistente marketplace-install-records en configmetadata-
migratie tijdens `plugins update`. Het gepubliceerde pakket `2026.4.26` mag waarschuwen
voor lokale buildmetadata-stempelbestanden die al zijn verzonden. Latere pakketten
moeten voldoen aan de moderne pakketcontracten; diezelfde gaten laten release-
validatie mislukken.

Gebruik bredere Package Acceptance-profielen wanneer de releasevraag over een
daadwerkelijk installeerbaar pakket gaat:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

Veelgebruikte pakketprofielen:

- `smoke`: snelle pakketinstallatie/kanaal/agent, Gateway-netwerk en config-
  reload-lanes
- `package`: install/update/Plugin-pakketcontracten zonder live ClawHub; dit is de release-check-
  standaard
- `product`: `package` plus MCP-kanalen, Cron/subagent-opschoning, OpenAI web
  search en OpenWebUI
- `full`: Docker-releasepadchunks met OpenWebUI
- `custom`: exacte `docker_lanes`-lijst voor gerichte herhalingen

Schakel voor Telegram-bewijs van pakketkandidaten `telegram_mode=mock-openai` of
`telegram_mode=live-frontier` in op Package Acceptance. De workflow geeft de
opgeloste `package-under-test`-tarball door aan de Telegram-lane; de zelfstandige
Telegram-workflow accepteert nog steeds een gepubliceerde npm-specificatie voor post-publish-controles.

## NPM-workflowinputs

`OpenClaw NPM Release` accepteert deze door operators beheerste inputs:

- `tag`: vereiste releasetag zoals `v2026.4.2`, `v2026.4.2-1` of
  `v2026.4.2-beta.1`; wanneer `preflight_only=true`, mag dit ook de huidige
  volledige 40-tekens workflow-branch-commit-SHA zijn voor validation-only preflight
- `preflight_only`: `true` voor alleen validatie/build/package, `false` voor het
  echte publicatiepad
- `preflight_run_id`: vereist op het echte publicatiepad zodat de workflow de
  voorbereide tarball van de succesvolle preflight-run hergebruikt
- `npm_dist_tag`: npm-doeltag voor het publicatiepad; standaard `beta`

`OpenClaw Release Checks` accepteert deze door operators beheerste inputs:

- `ref`: branch, tag of volledige commit-SHA om te valideren. Controles met secrets
  vereisen dat de opgeloste commit bereikbaar is vanaf een OpenClaw-branch of
  releasetag.

Regels:

- Stabiele en correctietags mogen naar `beta` of `latest` publiceren
- Bèta-prereleasetags mogen alleen naar `beta` publiceren
- Voor `OpenClaw NPM Release` is invoer met een volledige commit-SHA alleen toegestaan wanneer
  `preflight_only=true`
- `OpenClaw Release Checks` en `Full Release Validation` zijn altijd
  alleen-validatie
- Het echte publicatiepad moet dezelfde `npm_dist_tag` gebruiken als tijdens preflight;
  de workflow verifieert dat de metadata vóór publicatie blijft kloppen

## Stabiele npm-releasereeks

Bij het maken van een stabiele npm-release:

1. Voer `OpenClaw NPM Release` uit met `preflight_only=true`
   - Voordat er een tag bestaat, mag je de huidige volledige workflow-branch-commit-
     SHA gebruiken voor een validation-only dry run van de preflight-workflow
2. Kies `npm_dist_tag=beta` voor de normale beta-first-flow, of alleen `latest`
   wanneer je bewust direct stabiel wilt publiceren
3. Voer `Full Release Validation` uit op de releasebranch, releasetag of volledige
   commit-SHA wanneer je normale CI plus live promptcache-, Docker-, QA Lab-,
   Matrix- en Telegram-dekking vanuit één handmatige workflow wilt
4. Als je bewust alleen de deterministische normale testgrafiek nodig hebt, voer dan in plaats daarvan de
   handmatige workflow `CI` uit op de release-ref
5. Bewaar de succesvolle `preflight_run_id`
6. Voer `OpenClaw NPM Release` opnieuw uit met `preflight_only=false`, dezelfde
   `tag`, dezelfde `npm_dist_tag` en de opgeslagen `preflight_run_id`
7. Als de release op `beta` is geland, gebruik dan de private
   workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   om die stabiele versie van `beta` naar `latest` te promoveren
8. Als de release bewust direct naar `latest` is gepubliceerd en `beta`
   onmiddellijk dezelfde stabiele build moet volgen, gebruik dan dezelfde private
   workflow om beide dist-tags naar de stabiele versie te laten wijzen, of laat de geplande
   self-healing-sync `beta` later verplaatsen

De dist-tag-mutatie staat in de private repo voor veiligheid, omdat deze nog steeds
`NPM_TOKEN` vereist, terwijl de publieke repo OIDC-only publicatie behoudt.

Dat houdt zowel het directe publicatiepad als het beta-first-promotiepad
gedocumenteerd en zichtbaar voor operators.

Als een beheerder moet terugvallen op lokale npm-authenticatie, voer dan alle 1Password
CLI-opdrachten (`op`) alleen uit binnen een speciale tmux-sessie. Roep `op` niet
rechtstreeks aan vanuit de hoofd-shell van de agent; door dit binnen tmux te houden, blijven prompts,
waarschuwingen en OTP-afhandeling zichtbaar en worden herhaalde hostwaarschuwingen voorkomen.

## Openbare referenties

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Beheerders gebruiken de private releasedocumentatie in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
voor het daadwerkelijke draaiboek.

## Gerelateerd

- [Releasekanalen](/nl/install/development-channels)
