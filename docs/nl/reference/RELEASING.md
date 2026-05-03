---
read_when:
    - Zoeken naar openbare definities van releasekanalen
    - Releasevalidatie of pakketacceptatie uitvoeren
    - Op zoek naar versienaamgeving en cadans
summary: Releasebanen, operatorchecklist, validatieboxen, versienaamgeving en cadans
title: Releasebeleid
x-i18n:
    generated_at: "2026-05-03T21:35:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566088d826e1e2bac21b11443b82b62cb73ed1fd9c508c3fb865149cf8a428ba
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw heeft drie openbare releasekanalen:

- stable: getagde releases die standaard naar npm `beta` publiceren, of naar npm `latest` wanneer dit expliciet wordt gevraagd
- beta: prerelease-tags die naar npm `beta` publiceren
- dev: de bewegende head van `main`

## Versienaamgeving

- Stabiele releaseversie: `YYYY.M.D`
  - Git-tag: `vYYYY.M.D`
- Stabiele correctiereleaseversie: `YYYY.M.D-N`
  - Git-tag: `vYYYY.M.D-N`
- Beta-prereleaseversie: `YYYY.M.D-beta.N`
  - Git-tag: `vYYYY.M.D-beta.N`
- Vul maand of dag niet met voorloopnullen aan
- `latest` betekent de huidige gepromote stabiele npm-release
- `beta` betekent het huidige beta-installatiedoel
- Stabiele en stabiele correctiereleases publiceren standaard naar npm `beta`; release-operators kunnen expliciet `latest` targeten, of later een gecontroleerde beta-build promoveren
- Elke stabiele OpenClaw-release levert het npm-pakket en de macOS-app samen;
  beta-releases valideren en publiceren normaal eerst het npm-/pakketpad, waarbij
  bouwen/ondertekenen/notariseren van de mac-app voor stable is gereserveerd, tenzij expliciet gevraagd

## Releasecadans

- Releases gaan eerst via beta
- Stable volgt pas nadat de nieuwste beta is gevalideerd
- Maintainers maken releases normaal vanaf een `release/YYYY.M.D`-branch die is gemaakt
  vanuit de huidige `main`, zodat releasevalidatie en fixes nieuwe
  ontwikkeling op `main` niet blokkeren
- Als een beta-tag is gepusht of gepubliceerd en een fix nodig heeft, maken maintainers
  de volgende `-beta.N`-tag in plaats van de oude beta-tag te verwijderen of opnieuw te maken
- Gedetailleerde releaseprocedure, goedkeuringen, inloggegevens en herstelnotities zijn
  alleen voor maintainers

## Checklist voor release-operator

Deze checklist is de openbare vorm van de releaseflow. Privé-inloggegevens,
ondertekening, notarisatie, herstel van dist-tags en details voor noodrollback blijven in
het release-runbook dat alleen voor maintainers is.

1. Begin vanaf de huidige `main`: pull de nieuwste versie, bevestig dat de doelcommit is gepusht,
   en bevestig dat de huidige `main`-CI groen genoeg is om er een branch van te maken.
2. Herschrijf de bovenste sectie van `CHANGELOG.md` vanuit echte commitgeschiedenis met
   `/changelog`, houd entries gebruikersgericht, commit dit, push het, en rebase/pull
   nog eenmaal voordat je de branch maakt.
3. Controleer releasecompatibiliteitsrecords in
   `src/plugins/compat/registry.ts` en
   `src/commands/doctor/shared/deprecation-compat.ts`. Verwijder verlopen
   compatibiliteit alleen wanneer het upgradepad gedekt blijft, of leg vast waarom die
   bewust behouden wordt.
4. Maak `release/YYYY.M.D` vanuit de huidige `main`; doe normaal releasewerk niet
   rechtstreeks op `main`.
5. Verhoog elke vereiste versielocatie voor de beoogde tag, voer
   `pnpm plugins:sync` uit zodat publiceerbare Plugin-pakketten de releaseversie
   en compatibiliteitsmetadata delen, en voer daarna de lokale deterministische preflight uit:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, en
   `pnpm release:check`.
6. Voer `OpenClaw NPM Release` uit met `preflight_only=true`. Voordat er een tag bestaat,
   is een volledige release-branch-SHA van 40 tekens toegestaan voor validatie-only
   preflight. Bewaar de geslaagde `preflight_run_id`.
7. Start alle prerelease-tests met `Full Release Validation` voor de
   releasebranch, tag, of volledige commit-SHA. Dit is het ene handmatige entrypoint
   voor de vier grote release-testboxen: Vitest, Docker, QA Lab en Package.
8. Als validatie mislukt, fix dit op de releasebranch en voer het kleinste mislukte
   bestand, kanaal, workflowjob, pakketprofiel, provider of model-allowlist opnieuw uit dat
   de fix bewijst. Voer de volledige paraplu alleen opnieuw uit wanneer het gewijzigde oppervlak
   eerder bewijs verouderd maakt.
9. Voor beta: tag `vYYYY.M.D-beta.N`, voer daarna `OpenClaw Release Publish` uit vanaf
   de bijbehorende `release/YYYY.M.D`-branch. Dit verifieert `pnpm plugins:sync:check`,
   publiceert eerst alle publiceerbare Plugin-pakketten naar npm, publiceert dezelfde
   set daarna naar ClawHub als ClawPack npm-pack-tarballs, en promoveert daarna het
   voorbereide OpenClaw npm-preflightartifact met de bijbehorende dist-tag. Voer na
   publicatie post-publish-pakketacceptatie uit tegen het gepubliceerde
   `openclaw@YYYY.M.D-beta.N`- of `openclaw@beta`-pakket. Als een gepushte of gepubliceerde
   prerelease een fix nodig heeft, maak dan het volgende bijbehorende prerelease-nummer;
   verwijder of herschrijf de oude prerelease niet.
10. Voor stable: ga pas verder nadat de gecontroleerde beta of release candidate het
    vereiste validatiebewijs heeft. Stabiele npm-publicatie loopt ook via
    `OpenClaw Release Publish`, waarbij het geslaagde preflightartifact opnieuw wordt gebruikt via
    `preflight_run_id`; stable macOS-releasegereedheid vereist ook de
    verpakte `.zip`, `.dmg`, `.dSYM.zip`, en bijgewerkte `appcast.xml` op `main`.
11. Voer na publicatie de npm-post-publishverificatie uit, optioneel standalone
    gepubliceerde-npm Telegram E2E wanneer je post-publish kanaalbewijs nodig hebt,
    dist-tagpromotie wanneer nodig, GitHub-release-/prerelease-notities uit de
    volledige bijbehorende `CHANGELOG.md`-sectie, en de stappen voor de releaseaankondiging.

## Release-preflight

- Voer `pnpm check:test-types` uit vóór de releasevoorcontrole zodat test-TypeScript
  gedekt blijft buiten de snellere lokale `pnpm check`-poort
- Voer `pnpm check:architecture` uit vóór de releasevoorcontrole zodat de bredere
  controles op importcycli en architectuurgrenzen groen zijn buiten de snellere
  lokale poort
- Voer `pnpm build && pnpm ui:build` uit vóór `pnpm release:check` zodat de verwachte
  `dist/*`-releaseartefacten en de Control UI-bundel bestaan voor de
  pakketvalidatiestap
- Voer `pnpm plugins:sync` uit na de rootversieverhoging en vóór het taggen. Dit
  werkt publiceerbare pluginpakketversies, OpenClaw peer-/API-compatibiliteitsmetadata,
  buildmetadata en pluginchangelog-stubs bij zodat ze overeenkomen met de core-releaseversie.
  `pnpm plugins:sync:check` is de niet-wijzigende releasebewaking; de publicatieworkflow
  faalt vóór enige registermutatie als deze stap is vergeten.
- Voer de handmatige workflow `Full Release Validation` uit vóór releasegoedkeuring om
  alle prerelease-testboxen vanuit één ingangspunt te starten. Deze accepteert een branch,
  tag of volledige commit-SHA, dispatcht handmatig `CI` en dispatcht
  `OpenClaw Release Checks` voor installatierooktests, pakketacceptatie, Docker
  releasepad-suites, live/E2E, OpenWebUI, QA Lab-pariteit, Matrix- en Telegram-lanes.
  Met `release_profile=full` en `rerun_group=all` wordt ook pakket-Telegram-E2E uitgevoerd
  tegen het artefact `release-package-under-test` uit releasecontroles. Geef
  `npm_telegram_package_spec` op na publicatie wanneer dezelfde Telegram-E2E ook het
  gepubliceerde npm-pakket moet bewijzen. Geef `package_acceptance_package_spec` op na
  publicatie wanneer Package Acceptance zijn pakket-/updatematrix moet uitvoeren tegen het
  geleverde npm-pakket in plaats van het uit de SHA gebouwde artefact. Geef
  `evidence_package_spec` op wanneer het privé-bewijsrapport moet aantonen dat de
  validatie overeenkomt met een gepubliceerd npm-pakket zonder Telegram-E2E af te dwingen.
  Voorbeeld:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Voer de handmatige workflow `Package Acceptance` uit wanneer je zijkanaalbewijs wilt
  voor een pakketkandidaat terwijl releasewerk doorgaat. Gebruik `source=npm` voor
  `openclaw@beta`, `openclaw@latest` of een exacte releaseversie; `source=ref` om een
  vertrouwde `package_ref`-branch/tag/SHA te verpakken met de huidige `workflow_ref`-harness;
  `source=url` voor een HTTPS-tarball met een vereiste SHA-256; of `source=artifact` voor
  een tarball die door een andere GitHub Actions-run is geüpload. De workflow herleidt de
  kandidaat tot `package-under-test`, hergebruikt de Docker E2E-releasescheduler tegen die
  tarball en kan Telegram-QA tegen dezelfde tarball uitvoeren met
  `telegram_mode=mock-openai` of `telegram_mode=live-frontier`. Wanneer de geselecteerde
  Docker-lanes `published-upgrade-survivor` bevatten, is het pakketartefact de kandidaat en
  selecteert `published_upgrade_survivor_baseline` de gepubliceerde basislijn.
  Voorbeeld: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Veelgebruikte profielen:
  - `smoke`: installatie-/kanaal-/agent-, gatewaynetwerk- en configuratieherlaadlanes
  - `package`: artefact-native pakket-/update-/plugin-lanes zonder OpenWebUI of live ClawHub
  - `product`: pakketprofiel plus MCP-kanalen, cron-/subagent-opschoning,
    OpenAI-webzoekopdracht en OpenWebUI
  - `full`: Docker-releasepadblokken met OpenWebUI
  - `custom`: exacte `docker_lanes`-selectie voor een gerichte heruitvoering
- Voer de handmatige workflow `CI` rechtstreeks uit wanneer je alleen volledige normale
  CI-dekking nodig hebt voor de releasekandidaat. Handmatige CI-dispatches omzeilen
  gewijzigde scoping en forceren de Linux Node-shards, gebundelde-plugin-shards,
  kanaalcontracten, Node 22-compatibiliteit, `check`, `check-additional`, buildrooktest,
  docs-controles, Python Skills, Windows, macOS, Android en Control UI i18n-lanes.
  Voorbeeld: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Voer `pnpm qa:otel:smoke` uit bij het valideren van releasetelemetrie. Dit oefent
  QA-lab via een lokale OTLP/HTTP-ontvanger en verifieert de geëxporteerde trace-span-namen,
  begrensde attributen en redactie van inhoud/identifiers zonder Opik, Langfuse of een andere
  externe collector te vereisen.
- Voer `pnpm release:check` uit vóór elke getagde release
- Voer `OpenClaw Release Publish` uit voor de wijzigende publicatiereeks nadat de tag
  bestaat. Dispatch deze vanaf `release/YYYY.M.D` (of `main` bij het publiceren van een
  tag die vanaf main bereikbaar is), geef de releasetag en succesvolle OpenClaw npm
  `preflight_run_id` door, en behoud de standaard plugin-publicatiescope
  `all-publishable` tenzij je bewust een gerichte reparatie uitvoert. De workflow
  serialiseert plugin-npm-publicatie, plugin-ClawHub-publicatie en OpenClaw-npm-publicatie
  zodat het corepakket niet wordt gepubliceerd vóór de geëxternaliseerde plugins.
- Releasecontroles worden nu uitgevoerd in een afzonderlijke handmatige workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` voert ook de QA Lab mock-pariteitslane plus het snelle live
  Matrix-profiel en de Telegram-QA-lane uit vóór releasegoedkeuring. De live-lanes gebruiken
  de omgeving `qa-live-shared`; Telegram gebruikt ook Convex CI-credentialleases. Voer de
  handmatige workflow `QA-Lab - All Lanes` uit met `matrix_profile=all` en
  `matrix_shards=true` wanneer je volledige Matrix-transport-, media- en E2EE-inventaris
  parallel wilt.
- Cross-OS-installatie- en upgrade-runtimevalidatie maakt deel uit van publieke
  `OpenClaw Release Checks` en `Full Release Validation`, die de herbruikbare workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` rechtstreeks aanroepen
- Deze splitsing is bewust: houd het echte npm-releasepad kort, deterministisch en
  artefactgericht, terwijl tragere livecontroles in hun eigen lane blijven zodat ze
  publicatie niet vertragen of blokkeren
- Releasecontroles met geheimen moeten worden gedispatcht via `Full Release
Validation` of vanuit de workflow-ref `main`/release, zodat workflowlogica en
  geheimen gecontroleerd blijven
- `OpenClaw Release Checks` accepteert een branch, tag of volledige commit-SHA zolang
  de herleide commit bereikbaar is vanaf een OpenClaw-branch of releasetag
- De validatie-only voorcontrole van `OpenClaw NPM Release` accepteert ook de huidige
  volledige workflowbranch-commit-SHA van 40 tekens zonder een gepushte tag te vereisen
- Dat SHA-pad is alleen voor validatie en kan niet worden gepromoveerd naar een echte
  publicatie
- In SHA-modus synthetiseert de workflow `v<package.json version>` alleen voor de
  pakketmetadatacontrole; echte publicatie vereist nog steeds een echte releasetag
- Beide workflows houden het echte publicatie- en promotiepad op door GitHub gehoste
  runners, terwijl het niet-wijzigende validatiepad de grotere Blacksmith Linux-runners
  kan gebruiken
- Die workflow voert
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  uit met zowel de workflowgeheimen `OPENAI_API_KEY` als `ANTHROPIC_API_KEY`
- De npm-releasevoorcontrole wacht niet langer op de afzonderlijke releasecontrole-lane
- Voer `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (of de overeenkomende bèta-/correctietag) uit vóór goedkeuring
- Voer na npm-publicatie
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (of de overeenkomende bèta-/correctieversie) uit om het gepubliceerde registerinstallatiepad
  in een verse tijdelijke prefix te verifiëren
- Voer na een bètapublicatie `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  uit om onboarding van het geïnstalleerde pakket, Telegram-installatie en echte Telegram-E2E
  tegen het gepubliceerde npm-pakket te verifiëren met de gedeelde geleasede
  Telegram-credentialpool. Lokale eenmalige onderhoudersruns mogen de Convex-vars weglaten
  en de drie `OPENCLAW_QA_TELEGRAM_*`-env-credentials rechtstreeks doorgeven.
- Onderhouders kunnen dezelfde post-publicatiecontrole vanuit GitHub Actions uitvoeren via de
  handmatige workflow `NPM Telegram Beta E2E`. Deze is bewust alleen handmatig en wordt niet
  bij elke merge uitgevoerd.
- Releaseautomatisering voor onderhouders gebruikt nu voorcontrole-dan-promotie:
  - echte npm-publicatie moet slagen met een succesvolle npm `preflight_run_id`
  - de echte npm-publicatie moet worden gedispatcht vanaf dezelfde `main`- of
    `release/YYYY.M.D`-branch als de succesvolle voorcontrolerun
  - stabiele npm-releases staan standaard op `beta`
  - stabiele npm-publicatie kan expliciet `latest` targeten via workflowinvoer
  - tokengebaseerde npm dist-tag-mutatie staat nu in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    om veiligheidsredenen, omdat `npm dist-tag add` nog steeds `NPM_TOKEN` nodig heeft terwijl
    de publieke repo publicatie alleen via OIDC houdt
  - publieke `macOS Release` is alleen validatie; wanneer een tag alleen op een
    releasebranch staat maar de workflow vanaf `main` wordt gedispatcht, stel dan
    `public_release_branch=release/YYYY.M.D` in
  - echte privé-mac-publicatie moet slagen met succesvolle privé-mac
    `preflight_run_id` en `validate_run_id`
  - de echte publicatiepaden promoveren voorbereide artefacten in plaats van ze opnieuw te bouwen
- Voor stabiele correctiereleases zoals `YYYY.M.D-N` controleert de post-publicatieverifier
  ook hetzelfde tijdelijke-prefix-upgradepad van `YYYY.M.D` naar `YYYY.M.D-N`, zodat
  releasecorrecties oudere globale installaties niet stilletjes op de basisstabiele payload
  kunnen laten staan
- De npm-releasevoorcontrole faalt gesloten tenzij de tarball zowel
  `dist/control-ui/index.html` als een niet-lege `dist/control-ui/assets/`-payload bevat
  zodat we niet opnieuw een leeg browserdashboard leveren
- Post-publicatieverificatie controleert ook dat gepubliceerde plugin-entrypoints en
  pakketmetadata aanwezig zijn in de geïnstalleerde registerlayout. Een release die ontbrekende
  plugin-runtimepayloads levert, faalt de postpublish-verifier en kan niet naar `latest` worden
  gepromoveerd.
- `pnpm test:install:smoke` handhaaft ook het npm-pack-`unpackedSize`-budget op de
  kandidaat-updatetarball, zodat installatie-e2e onbedoelde pakketgroei opvangt vóór het
  releasepublicatiepad
- Als het releasewerk CI-planning, extensietimingmanifesten of extensietestmatrices heeft
  geraakt, regenereer en beoordeel dan vóór goedkeuring de door de planner beheerde
  `plugin-prerelease-extension-shard`-matrixuitvoer uit
  `.github/workflows/plugin-prerelease.yml`, zodat releasenotities geen verouderde CI-layout
  beschrijven
- Gereedheid voor stabiele macOS-release omvat ook de updater-oppervlakken:
  - de GitHub-release moet uiteindelijk de verpakte `.zip`, `.dmg` en `.dSYM.zip` bevatten
  - `appcast.xml` op `main` moet na publicatie naar de nieuwe stabiele zip wijzen
  - de verpakte app moet een niet-debug-bundel-id, een niet-lege Sparkle-feed-URL en een
    `CFBundleVersion` op of boven de canonieke Sparkle-buildvloer voor die releaseversie behouden

## Release-testboxen

`Full Release Validation` is hoe operators alle prerelease-tests vanuit één ingangspunt
starten. Gebruik voor een vastgepinde commitbewijs op een snel bewegende branch de
helper zodat elke child-workflow vanaf een tijdelijke branch draait die op de doel-SHA
is vastgezet:

```bash
pnpm ci:full-release --sha <full-sha>
```

De helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation`
vanaf die branch met `ref=<sha>`, verifieert dat elke child-workflow-`headSha`
overeenkomt met het doel en verwijdert daarna de tijdelijke branch. Dit voorkomt dat per
ongeluk een nieuwere `main`-child-run wordt bewezen.

Voer voor validatie van releasebranch of tag deze uit vanaf de vertrouwde `main`-workflow-ref
en geef de releasebranch of tag door als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

De workflow lost de doel-ref op, dispatcht handmatige `CI` met
`target_ref=<release-ref>`, dispatcht `OpenClaw Release Checks`, bereidt een
bovenliggend `release-package-under-test`-artefact voor pakketgerichte controles
voor, en dispatcht zelfstandige Telegram-pakket-E2E wanneer
`release_profile=full` met `rerun_group=all` of wanneer
`npm_telegram_package_spec` is ingesteld. `OpenClaw Release Checks` waaiert
vervolgens uit naar installatiesmoke, cross-OS-releasecontroles, live/E2E Docker
release-paddekking, Package Acceptance met Telegram-pakket-QA, QA Lab-pariteit,
live Matrix en live Telegram. Een volledige run is alleen acceptabel wanneer de
samenvatting van `Full Release Validation` `normal_ci` en `release_checks` als
geslaagd toont. In full/all-modus moet het `npm_telegram`-kind ook geslaagd zijn;
buiten full/all wordt het overgeslagen, tenzij een gepubliceerde
`npm_telegram_package_spec` is opgegeven. De uiteindelijke
verificatiesamenvatting bevat tabellen met langzaamste jobs voor elke kindrun,
zodat de releasemanager het huidige kritieke pad kan zien zonder logs te
downloaden.
Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
volledige fasematrix, exacte workflowjobnamen, verschillen tussen stabiel en
volledig profiel, artefacten en gerichte rerun-handles.
Kindworkflows worden gedispatcht vanaf de vertrouwde ref die `Full Release
Validation` uitvoert, normaal `--ref main`, zelfs wanneer de doel-`ref` naar een
oudere releasebranch of tag verwijst. Er is geen aparte
Full Release Validation-workflow-ref-invoer; kies de vertrouwde harness door de
workflowrun-ref te kiezen. Gebruik geen `--ref main -f ref=<sha>` voor exact
commitbewijs op bewegende `main`; ruwe commit-SHA's kunnen geen workflowdispatch-
refs zijn, dus gebruik `pnpm ci:full-release --sha <sha>` om de vastgepinde
tijdelijke branch te maken.

Gebruik `release_profile` om live/provider-breedte te selecteren:

- `minimum`: snelste releasekritieke OpenAI/core live- en Docker-pad
- `stable`: minimum plus stabiele provider/backend-dekking voor releasegoedkeuring
- `full`: stable plus brede adviserende provider/media-dekking

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de doel-ref één
keer als `release-package-under-test` op te lossen en hergebruikt dat artefact in
zowel release-pad-Docker-controles als Package Acceptance. Dit houdt alle
pakketgerichte boxes op dezelfde bytes en voorkomt herhaalde pakketbuilds.
De cross-OS OpenAI-installatiesmoke gebruikt `OPENCLAW_CROSS_OS_OPENAI_MODEL`
wanneer de repo/org-variabele is ingesteld, anders `openai/gpt-5.4`, omdat deze
lane pakketinstallatie, onboarding, Gateway-opstart en één live agentbeurt
bewijst in plaats van het langzaamste standaardmodel te benchmarken. De bredere
live providermatrix blijft de plaats voor modelspecifieke dekking.

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

Gebruik de volledige paraplu niet als eerste rerun na een gerichte fix. Als één
box faalt, gebruik dan de mislukte kindworkflow, job, Docker-lane, pakketprofiel,
modelprovider of QA-lane voor het volgende bewijs. Voer de volledige paraplu pas
opnieuw uit wanneer de fix gedeelde releaseorkestratie heeft gewijzigd of eerder
bewijs voor alle boxes verouderd heeft gemaakt. De uiteindelijke verificateur van
de paraplu controleert de geregistreerde kindworkflowrun-id's opnieuw, dus nadat
een kindworkflow succesvol opnieuw is uitgevoerd, voer dan alleen de mislukte
bovenliggende job `Verify full validation` opnieuw uit.

Geef voor begrensd herstel `rerun_group` door aan de paraplu. `all` is de echte
releasecandidate-run, `ci` voert alleen het normale CI-kind uit,
`plugin-prerelease` voert alleen het release-only plugin-kind uit,
`release-checks` voert elke releasebox uit, en de smallere releasegroepen zijn
`install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`
en `npm-telegram`. Gerichte `npm-telegram`-reruns vereisen
`npm_telegram_package_spec`; full/all-runs met `release_profile=full` gebruiken
het pakketartefact van release-checks.

### Vitest

De Vitest-box is de handmatige `CI`-kindworkflow. Handmatige CI omzeilt bewust
changed-scoping en forceert de normale testgrafiek voor de releasecandidate:
Linux Node-shards, gebundelde-plugin-shards, kanaalcontracten, Node 22-
compatibiliteit, `check`, `check-additional`, buildsmoke, docs-controles, Python
Skills, Windows, macOS, Android en Control UI i18n.

Gebruik deze box om te beantwoorden: "is de source tree geslaagd voor de volledige
normale testsuite?" Dit is niet hetzelfde als productvalidatie via het
releasepad. Bewijs om te bewaren:

- `Full Release Validation`-samenvatting die de gedispatchte `CI`-run-URL toont
- `CI`-run groen op de exacte doel-SHA
- mislukte of trage shardnamen uit de CI-jobs bij het onderzoeken van regressies
- Vitest-timingartefacten zoals `.artifacts/vitest-shard-timings.json` wanneer
  een run prestatieanalyse nodig heeft

Voer handmatige CI alleen rechtstreeks uit wanneer de release deterministische
normale CI nodig heeft, maar niet de Docker-, QA Lab-, live-, cross-OS- of
pakketboxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

De Docker-box leeft in `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus de release-modus
`install-smoke`-workflow. Deze valideert de releasecandidate via verpakte
Docker-omgevingen in plaats van alleen source-level tests.

Release-Docker-dekking omvat:

- volledige installatiesmoke met de trage Bun globale installatiesmoke ingeschakeld
- voorbereiding/hergebruik van de root-Dockerfile-smoke-image per doel-SHA, met
  QR-, root/gateway- en installer/Bun-smokejobs als afzonderlijke install-smoke-
  shards
- repository-E2E-lanes
- release-pad-Docker-chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` en `plugins-runtime-install-h`
- OpenWebUI-dekking binnen de `plugins-runtime-services`-chunk wanneer gevraagd
- gesplitste install/uninstall-lanes voor gebundelde plugins
  `bundled-plugin-install-uninstall-0` tot en met
  `bundled-plugin-install-uninstall-23`
- live/E2E-provider-suites en Docker live-modeldekking wanneer releasecontroles
  live suites bevatten

Gebruik Docker-artefacten vóór reruns. De release-pad-scheduler uploadt
`.artifacts/docker-tests/` met lane-logs, `summary.json`, `failures.json`,
fasetimings, JSON van het schedulerplan en rerun-commando's. Gebruik voor
gericht herstel `docker_lanes=<lane[,lane]>` op de herbruikbare live/E2E-
workflow in plaats van alle releasechunks opnieuw uit te voeren. Gegenereerde
rerun-commando's bevatten eerdere `package_artifact_run_id` en voorbereide
Docker-image-invoer wanneer beschikbaar, zodat een mislukte lane dezelfde tarball
en GHCR-images kan hergebruiken.

### QA Lab

De QA Lab-box maakt ook deel uit van `OpenClaw Release Checks`. Dit is de
agentische gedrag- en kanaalniveau-releasegate, los van Vitest- en Docker-
pakketmechaniek.

Release-QA Lab-dekking omvat:

- mock-pariteitslane die de OpenAI-candidate-lane vergelijkt met de Opus 4.6-
  baseline met het agentische pariteitspakket
- snel live Matrix-QA-profiel met de `qa-live-shared`-omgeving
- live Telegram-QA-lane met Convex CI-credentialleases
- `pnpm qa:otel:smoke` wanneer releasetelemetrie expliciet lokaal bewijs nodig heeft

Gebruik deze box om te beantwoorden: "gedraagt de release zich correct in QA-
scenario's en live kanaalflows?" Bewaar de artefact-URL's voor pariteits-, Matrix-
en Telegram-lanes bij het goedkeuren van de release. Volledige Matrix-dekking
blijft beschikbaar als handmatige sharded QA-Lab-run in plaats van als de
standaard releasekritieke lane.

### Pakket

De Pakket-box is de installable-product-gate. Deze wordt ondersteund door
`Package Acceptance` en de resolver
`scripts/resolve-openclaw-package-candidate.mjs`. De resolver normaliseert een
candidate naar de `package-under-test`-tarball die door Docker E2E wordt
gebruikt, valideert de pakketinventaris, registreert de pakketversie en SHA-256,
en houdt de workflowharness-ref gescheiden van de pakketsource-ref.

Ondersteunde candidate-bronnen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-
  releaseversie
- `source=ref`: pak een vertrouwde `package_ref`-branch, tag of volledige commit-
  SHA met de geselecteerde `workflow_ref`-harness
- `source=url`: download een HTTPS `.tgz` met vereiste `package_sha256`
- `source=artifact`: hergebruik een `.tgz` die door een andere GitHub Actions-run
  is geüpload

`OpenClaw Release Checks` voert Package Acceptance uit met `source=artifact`, het
voorbereide releasepakketartefact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` en
`telegram_mode=mock-openai`. Package Acceptance houdt migratie, update, opruiming
van verouderde pluginafhankelijkheden, offline pluginfixtures, pluginupdate en
Telegram-pakket-QA tegen dezelfde opgeloste tarball. De upgradematrix dekt elke stabiele npm-gepubliceerde baseline van `2026.4.23` tot en met `latest`; gebruik
Package Acceptance met `source=npm` voor een al verscheepte candidate, of
`source=ref`/`source=artifact` voor een SHA-onderbouwde lokale npm-tarball vóór
publicatie. Het is de GitHub-native vervanging voor het grootste deel van de
pakket/update-dekking waarvoor eerder Parallels nodig was. Cross-OS-
releasecontroles blijven belangrijk voor OS-specifieke onboarding, installer en
platformgedrag, maar pakket/update-productvalidatie moet Package Acceptance
verkiezen.

De canonieke checklist voor update- en pluginvalidatie is
[Updates en plugins testen](/nl/help/testing-updates-plugins). Gebruik deze bij het
bepalen welke lokale, Docker-, Package Acceptance- of release-check-lane een
plugininstallatie/update, doctor-opruiming of migratiewijziging van een
gepubliceerd pakket bewijst. Uitputtende gepubliceerde updatemigratie vanaf elk
stabiel `2026.4.23+`-pakket is een aparte handmatige `Update Migration`-
workflow, geen onderdeel van Full Release CI.

Legacy package-acceptance-tolerantie is bewust tijdsgebonden. Pakketten tot en
met `2026.4.25` mogen het compatibiliteitspad gebruiken voor metadatahiaten die
al naar npm zijn gepubliceerd: private QA-inventarisitems die ontbreken in de
tarball, ontbrekende `gateway install --wrapper`, ontbrekende patchbestanden in
de uit tarball afgeleide gitfixture, ontbrekende gepersisteerde `update.channel`,
legacy locaties voor plugininstallatierecords, ontbrekende persistentie van
marketplace-installatierecords, en configuratiemetadata-migratie tijdens
`plugins update`. Het gepubliceerde `2026.4.26`-pakket mag waarschuwen voor
metadata-stampbestanden van lokale builds die al waren verscheept. Latere
pakketten moeten voldoen aan de moderne pakketcontracten; diezelfde hiaten laten
releasevalidatie falen.

Gebruik bredere Package Acceptance-profielen wanneer de releasevraag over een
echt installeerbaar pakket gaat:

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

- `smoke`: snelle package-installatie/kanaal/agent-, Gateway-netwerk- en configuratieherlaadlanes
- `package`: installatie/update/Plugin-packagecontracten zonder live ClawHub; dit is de standaard voor release-checks
- `product`: `package` plus MCP-kanalen, Cron-/subagent-opschoning, OpenAI-webzoekfunctie en OpenWebUI
- `full`: Docker-releasepad-chunks met OpenWebUI
- `custom`: exacte `docker_lanes`-lijst voor gerichte herhalingen

Schakel voor Telegram-bewijs van een package-kandidaat `telegram_mode=mock-openai` of
`telegram_mode=live-frontier` in op Package Acceptance. De workflow geeft de
opgeloste `package-under-test`-tarball door aan de Telegram-lane; de zelfstandige
Telegram-workflow accepteert nog steeds een gepubliceerde npm-specificatie voor controles na publicatie.

## Automatisering voor releasepublicatie

`OpenClaw Release Publish` is het normale muterende publicatie-ingangspunt. Het
orkestreert de trusted-publisher-workflows in de volgorde die de release nodig heeft:

1. Check de releasetag uit en los de commit-SHA ervan op.
2. Controleer of de tag bereikbaar is vanaf `main` of `release/*`.
3. Voer `pnpm plugins:sync:check` uit.
4. Dispatch `Plugin NPM Release` met `publish_scope=all-publishable` en
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` met dezelfde scope en SHA.
6. Dispatch `OpenClaw NPM Release` met de releasetag, npm dist-tag en
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

Stabiele promotie direct naar `latest` is expliciet:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Gebruik de workflows op lager niveau, `Plugin NPM Release` en `Plugin ClawHub Release`,
alleen voor gericht herstel- of herpublicatiewerk. Geef voor herstel van een geselecteerde Plugin
`plugin_publish_scope=selected` en `plugins=@openclaw/name` door aan
`OpenClaw Release Publish`, of dispatch de child-workflow rechtstreeks wanneer het
OpenClaw-package niet mag worden gepubliceerd.

## NPM-workflowinvoer

`OpenClaw NPM Release` accepteert deze door operators beheerde invoer:

- `tag`: vereiste releasetag zoals `v2026.4.2`, `v2026.4.2-1` of
  `v2026.4.2-beta.1`; wanneer `preflight_only=true`, mag dit ook de huidige
  volledige 40-teken workflow-branch-commit-SHA zijn voor preflight die alleen valideert
- `preflight_only`: `true` alleen voor validatie/build/package, `false` voor het
  echte publicatiepad
- `preflight_run_id`: vereist op het echte publicatiepad zodat de workflow de
  voorbereide tarball uit de geslaagde preflight-run hergebruikt
- `npm_dist_tag`: npm-doeltag voor het publicatiepad; standaard `beta`

`OpenClaw Release Publish` accepteert deze door operators beheerde invoer:

- `tag`: vereiste releasetag; moet al bestaan
- `preflight_run_id`: geslaagde `OpenClaw NPM Release`-preflight-run-id;
  vereist wanneer `publish_openclaw_npm=true`
- `npm_dist_tag`: npm-doeltag voor het OpenClaw-package
- `plugin_publish_scope`: standaard `all-publishable`; gebruik `selected` alleen
  voor gericht herstelwerk
- `plugins`: door komma's gescheiden `@openclaw/*`-packagenamen wanneer
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: standaard `true`; stel alleen in op `false` wanneer de
  workflow wordt gebruikt als herstelorchestrator alleen voor plugins

`OpenClaw Release Checks` accepteert deze door operators beheerde invoer:

- `ref`: branch, tag of volledige commit-SHA om te valideren. Controles met
  geheimen vereisen dat de opgeloste commit bereikbaar is vanaf een OpenClaw-branch of
  releasetag.

Regels:

- Stabiele tags en correctietags mogen naar `beta` of `latest` publiceren
- Beta-prereleasetags mogen alleen naar `beta` publiceren
- Voor `OpenClaw NPM Release` is volledige commit-SHA-invoer alleen toegestaan wanneer
  `preflight_only=true`
- `OpenClaw Release Checks` en `Full Release Validation` zijn altijd
  alleen validatie
- Het echte publicatiepad moet dezelfde `npm_dist_tag` gebruiken als tijdens preflight;
  de workflow controleert die metadata voordat publicatie doorgaat

## Stabiele npm-releasereeks

Bij het maken van een stabiele npm-release:

1. Voer `OpenClaw NPM Release` uit met `preflight_only=true`
   - Voordat er een tag bestaat, mag je de huidige volledige workflow-branch-commit-SHA
     gebruiken voor een validatie-only dry run van de preflight-workflow
2. Kies `npm_dist_tag=beta` voor de normale beta-eerst-flow, of `latest` alleen
   wanneer je bewust direct stabiel wilt publiceren
3. Voer `Full Release Validation` uit op de releasebranch, releasetag of volledige
   commit-SHA wanneer je normale CI plus live promptcache, Docker, QA Lab,
   Matrix en Telegram-dekking uit één handmatige workflow wilt
4. Als je bewust alleen de deterministische normale testgrafiek nodig hebt, voer dan de
   handmatige `CI`-workflow uit op de release-ref
5. Sla de geslaagde `preflight_run_id` op
6. Voer `OpenClaw Release Publish` uit met dezelfde `tag`, dezelfde `npm_dist_tag`
   en de opgeslagen `preflight_run_id`; deze publiceert geëxternaliseerde plugins naar npm
   en ClawHub voordat het OpenClaw-npm-package wordt gepromoveerd
7. Als de release op `beta` is geland, gebruik dan de private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`-workflow
   om die stabiele versie van `beta` naar `latest` te promoveren
8. Als de release bewust rechtstreeks naar `latest` is gepubliceerd en `beta`
   onmiddellijk dezelfde stabiele build moet volgen, gebruik dan dezelfde private
   workflow om beide dist-tags naar de stabiele versie te laten wijzen, of laat de geplande
   zelfherstellende sync `beta` later verplaatsen

De dist-tag-mutatie staat om veiligheidsredenen in de private repo omdat deze nog steeds
`NPM_TOKEN` vereist, terwijl de publieke repo publicatie alleen via OIDC behoudt.

Dat houdt zowel het directe publicatiepad als het beta-eerst-promotiepad
gedocumenteerd en zichtbaar voor operators.

Als een maintainer moet terugvallen op lokale npm-authenticatie, voer dan alle 1Password
CLI-commands (`op`) alleen uit binnen een toegewezen tmux-sessie. Roep `op` niet
rechtstreeks aan vanuit de main agent-shell; door het binnen tmux te houden blijven prompts,
meldingen en OTP-afhandeling observeerbaar en worden herhaalde hostmeldingen voorkomen.

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
