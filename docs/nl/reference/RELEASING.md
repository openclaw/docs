---
read_when:
    - Zoeken naar definities van openbare releasekanalen
    - Releasevalidatie of pakketacceptatie uitvoeren
    - Op zoek naar versienaamgeving en cadans
summary: Releasesporen, operatorchecklist, validatieboxen, versienaamgeving en cadans
title: Releasebeleid
x-i18n:
    generated_at: "2026-05-05T06:19:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9980265c30c6a6571db5512749ec173cca79ac70494fd09968add793be9717a5
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw heeft drie publieke releasekanalen:

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
- Stabiele en stabiele correctiereleases publiceren standaard naar npm `beta`; release-operators kunnen expliciet `latest` targeten, of later een gecontroleerde beta-build promoten
- Elke stabiele OpenClaw-release levert het npm-pakket en de macOS-app samen;
  beta-releases valideren en publiceren normaal eerst het npm-/pakketpad, met
  mac-app bouwen/ondertekenen/notariseren gereserveerd voor stable tenzij dit expliciet wordt gevraagd

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

## Checklist voor release-operators

Deze checklist is de publieke vorm van de releaseflow. Privécredentials,
ondertekening, notarisatie, dist-tag-herstel en details voor noodrollback blijven in
de release-runbook die alleen voor maintainers is.

1. Begin vanaf de huidige `main`: haal de nieuwste wijzigingen op, bevestig dat de doelcommit is gepusht,
   en bevestig dat de huidige `main`-CI groen genoeg is om er een branch van te maken.
2. Herschrijf de bovenste sectie van `CHANGELOG.md` vanuit echte commitgeschiedenis met
   `/changelog`, houd items gebruikersgericht, commit dit, push het, en rebase/pull
   nogmaals voordat je een branch maakt.
3. Controleer releasecompatibiliteitsrecords in
   `src/plugins/compat/registry.ts` en
   `src/commands/doctor/shared/deprecation-compat.ts`. Verwijder verlopen
   compatibiliteit alleen wanneer het upgradepad gedekt blijft, of leg vast waarom deze
   bewust wordt behouden.
4. Maak `release/YYYY.M.D` vanaf de huidige `main`; doe normaal releasewerk niet
   rechtstreeks op `main`.
5. Verhoog elke vereiste versielocatie voor de bedoelde tag, voer
   `pnpm plugins:sync` uit zodat publiceerbare Plugin-pakketten de releaseversie
   en compatibiliteitsmetadata delen, en voer daarna de lokale deterministische preflight uit:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, en
   `pnpm release:check`.
6. Voer `OpenClaw NPM Release` uit met `preflight_only=true`. Voordat er een tag bestaat,
   is een volledige SHA van 40 tekens van de releasebranch toegestaan voor validatie-only
   preflight. Bewaar de succesvolle `preflight_run_id`.
7. Start alle pre-releasetests met `Full Release Validation` voor de
   releasebranch, tag of volledige commit-SHA. Dit is het enige handmatige startpunt
   voor de vier grote releasetestboxen: Vitest, Docker, QA Lab en Package.
8. Als validatie faalt, fix dit op de releasebranch en voer opnieuw het kleinste gefaalde
   bestand, kanaal, workflowjob, pakketprofiel, provider of model-allowlist uit dat
   de fix bewijst. Voer de volledige paraplu alleen opnieuw uit wanneer het gewijzigde oppervlak
   eerder bewijs verouderd maakt.
9. Voor beta: tag `vYYYY.M.D-beta.N`, en voer daarna `OpenClaw Release Publish` uit vanaf
   de bijbehorende `release/YYYY.M.D`-branch. Dit verifieert `pnpm plugins:sync:check`,
   publiceert eerst alle publiceerbare Plugin-pakketten naar npm, publiceert dezelfde
   set daarna naar ClawHub als ClawPack npm-pack-tarballs, en promoot vervolgens het
   voorbereide OpenClaw npm-preflightartefact met de bijbehorende dist-tag. Voer na
   publicatie post-publish package
   acceptance uit tegen het gepubliceerde `openclaw@YYYY.M.D-beta.N`- of
   `openclaw@beta`-pakket. Als een gepushte of gepubliceerde prerelease een fix nodig heeft,
   maak dan het volgende bijbehorende prerelease-nummer; verwijder of herschrijf de oude
   prerelease niet.
10. Voor stable: ga alleen verder nadat de gecontroleerde beta of release candidate het
    vereiste validatiebewijs heeft. Stabiele npm-publicatie loopt ook via
    `OpenClaw Release Publish`, waarbij het succesvolle preflightartefact via
    `preflight_run_id` wordt hergebruikt; gereedheid voor een stabiele macOS-release vereist ook de
    verpakte `.zip`, `.dmg`, `.dSYM.zip`, en bijgewerkte `appcast.xml` op `main`.
11. Voer na publicatie de npm-post-publishverificatie uit, optioneel standalone
    published-npm Telegram E2E wanneer je post-publish kanaalbewijs nodig hebt,
    dist-tag-promotie wanneer nodig, GitHub-release-/prerelease-notities uit de
    volledige bijbehorende `CHANGELOG.md`-sectie, en de stappen voor de releaseaankondiging.

## Releasepreflight

- Voer `pnpm check:test-types` uit voor de release-preflight, zodat test-TypeScript
  gedekt blijft buiten de snellere lokale `pnpm check`-gate
- Voer `pnpm check:architecture` uit voor de release-preflight, zodat de bredere
  importcyclus- en architectuurgrenscontroles groen zijn buiten de snellere lokale gate
- Voer `pnpm build && pnpm ui:build` uit voor `pnpm release:check`, zodat de verwachte
  `dist/*`-releaseartefacten en Control UI-bundel bestaan voor de
  pakketvalidatiestap
- Voer `pnpm plugins:sync` uit na de rootversieverhoging en voor het taggen. Dit
  werkt publiceerbare versies van pluginpakketten, OpenClaw peer/API-compatibiliteitsmetadata,
  buildmetadata en plugin-changelogstubs bij zodat ze overeenkomen met de core
  releaseversie. `pnpm plugins:sync:check` is de niet-mutatieve releaseguard;
  de publicatieworkflow faalt voordat een registry-mutatie plaatsvindt als deze stap is
  vergeten.
- Voer de handmatige workflow `Full Release Validation` uit voor releasegoedkeuring om
  alle pre-release-testboxen vanuit één entrypoint te starten. Deze accepteert een branch,
  tag of volledige commit-SHA, dispatcht handmatig `CI`, en dispatcht
  `OpenClaw Release Checks` voor installatiesmoke, pakketacceptatie, cross-OS
  pakketcontroles, QA Lab-pariteit, Matrix- en Telegram-lanes. Stabiele/standaardruns
  houden uitputtende live/E2E- en Docker-releasepad-soak achter
  `run_release_soak=true`; `release_profile=full` forceert soak. Met
  `release_profile=full` en `rerun_group=all` voert dit ook pakket-Telegram
  E2E uit tegen het artefact `release-package-under-test` uit releasechecks.
  Geef `npm_telegram_package_spec` op na publiceren wanneer dezelfde
  Telegram E2E ook het gepubliceerde npm-pakket moet bewijzen. Geef
  `package_acceptance_package_spec` op na publiceren wanneer Package Acceptance
  zijn pakket/update-matrix moet uitvoeren tegen het geleverde npm-pakket in plaats
  van het op SHA gebouwde artefact. Geef
  `evidence_package_spec` op wanneer het private bewijsrapport moet bewijzen dat de
  validatie overeenkomt met een gepubliceerd npm-pakket zonder Telegram E2E te forceren.
  Voorbeeld:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Voer de handmatige workflow `Package Acceptance` uit wanneer je side-channel-bewijs
  wilt voor een pakketkandidaat terwijl releasewerk doorgaat. Gebruik `source=npm` voor
  `openclaw@beta`, `openclaw@latest` of een exacte releaseversie; `source=ref`
  om een vertrouwde `package_ref`-branch/tag/SHA te packen met de huidige
  `workflow_ref`-harnas; `source=url` voor een HTTPS-tarball met een vereiste
  SHA-256; of `source=artifact` voor een tarball die door een andere GitHub
  Actions-run is geüpload. De workflow herleidt de kandidaat naar
  `package-under-test`, hergebruikt de Docker E2E-releasescheduler tegen die
  tarball, en kan Telegram QA tegen dezelfde tarball uitvoeren met
  `telegram_mode=mock-openai` of `telegram_mode=live-frontier`. Wanneer de
  geselecteerde Docker-lanes `published-upgrade-survivor` bevatten, is het
  pakketartefact de kandidaat en selecteert `published_upgrade_survivor_baseline`
  de gepubliceerde baseline. `update-restart-auth` gebruikt het kandidaatpakket als
  zowel de geïnstalleerde CLI als het package-under-test, zodat het het managed
  restart-pad van de updateopdracht van de kandidaat oefent.
  Voorbeeld: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Veelgebruikte profielen:
  - `smoke`: install/channel/agent, gatewaynetwerk en config-herlaadlanes
  - `package`: artefact-native pakket/update/restart/plugin-lanes zonder OpenWebUI of live ClawHub
  - `product`: pakketprofiel plus MCP-kanalen, cron/subagent-opruiming,
    OpenAI-webzoekopdracht en OpenWebUI
  - `full`: Docker-releasepadchunks met OpenWebUI
  - `custom`: exacte `docker_lanes`-selectie voor een gerichte rerun
- Voer de handmatige workflow `CI` direct uit wanneer je alleen volledige normale CI-
  dekking voor de releasekandidaat nodig hebt. Handmatige CI-dispatches omzeilen changed
  scoping en forceren de Linux Node-shards, gebundelde-pluginshards, channel-
  contracten, Node 22-compatibiliteit, `check`, `check-additional`, buildsmoke,
  docscontroles, Python-skills, Windows, macOS, Android en Control UI i18n
  lanes.
  Voorbeeld: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Voer `pnpm qa:otel:smoke` uit bij het valideren van releasetelemetrie. Dit oefent
  QA-lab via een lokale OTLP/HTTP-receiver en verifieert de geëxporteerde trace-
  spannamen, begrensde attributen en content-/identifier-redactie zonder
  Opik, Langfuse of een andere externe collector te vereisen.
- Voer `pnpm release:check` uit voor elke getagde release
- Voer `OpenClaw Release Publish` uit voor de mutatieve publicatiereeks nadat de
  tag bestaat. Dispatch deze vanuit `release/YYYY.M.D` (of `main` bij het publiceren van een
  tag die vanaf main bereikbaar is), geef de releasetag en geslaagde OpenClaw npm
  `preflight_run_id` door, en behoud het standaardbereik voor pluginpublicatie
  `all-publishable`, tenzij je doelbewust een gerichte reparatie uitvoert. De
  workflow serialiseert plugin npm-publicatie, plugin ClawHub-publicatie en OpenClaw
  npm-publicatie, zodat het corepakket niet wordt gepubliceerd vóór zijn geëxternaliseerde
  plugins.
- Releasechecks draaien nu in een aparte handmatige workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` voert ook de QA Lab mock-pariteitslane uit plus het snelle
  live Matrix-profiel en de Telegram QA-lane vóór releasegoedkeuring. De live
  lanes gebruiken de `qa-live-shared`-omgeving; Telegram gebruikt ook Convex CI-
  credentialleases. Voer de handmatige workflow `QA-Lab - All Lanes` uit met
  `matrix_profile=all` en `matrix_shards=true` wanneer je volledige Matrix-
  transport-, media- en E2EE-inventaris parallel wilt.
- Cross-OS-installatie- en upgraderuntimevalidatie maakt deel uit van openbare
  `OpenClaw Release Checks` en `Full Release Validation`, die de
  herbruikbare workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direct aanroepen
- Deze splitsing is bewust: houd het echte npm-releasepad kort,
  deterministisch en artefactgericht, terwijl tragere livechecks in hun
  eigen lane blijven zodat ze publiceren niet vertragen of blokkeren
- Releasechecks met geheimen moeten worden gedispatcht via `Full Release
Validation` of vanuit de `main`/release-workflowref, zodat workflowlogica en
  secrets gecontroleerd blijven
- `OpenClaw Release Checks` accepteert een branch, tag of volledige commit-SHA zolang
  de herleide commit bereikbaar is vanaf een OpenClaw-branch of releasetag
- De validation-only preflight van `OpenClaw NPM Release` accepteert ook de huidige
  volledige workflow-branch-commit-SHA van 40 tekens zonder een gepushte tag te vereisen
- Dat SHA-pad is alleen voor validatie en kan niet worden gepromoveerd naar een echte publicatie
- In SHA-modus synthetiseert de workflow `v<package.json version>` alleen voor de
  pakketmetadatacontrole; echt publiceren vereist nog steeds een echte releasetag
- Beide workflows houden het echte publicatie- en promotiepad op GitHub-gehoste
  runners, terwijl het niet-mutatieve validatiepad de grotere
  Blacksmith Linux-runners kan gebruiken
- Die workflow voert
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  uit met zowel `OPENAI_API_KEY` als `ANTHROPIC_API_KEY` workflowsecrets
- npm-releasepreflight wacht niet langer op de aparte releasecheckslane
- Voer `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (of de overeenkomende beta-/correctietag) uit vóór goedkeuring
- Voer na npm-publicatie
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (of de overeenkomende beta-/correctieversie) uit om het gepubliceerde registry-
  installatiepad te verifiëren in een verse tijdelijke prefix
- Voer na een betapublicatie `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  uit om installed-package-onboarding, Telegram-configuratie en echte Telegram E2E
  tegen het gepubliceerde npm-pakket te verifiëren met de gedeelde geleasete Telegram-
  credentialpool. Lokale eenmalige maintainer-runs mogen de Convex-variabelen weglaten en de drie
  `OPENCLAW_QA_TELEGRAM_*` env-credentials direct doorgeven.
- Gebruik `pnpm release:beta-smoke -- --beta betaN` om de volledige post-publish beta-smoke vanaf een maintainer-machine uit te voeren. De helper voert Parallels npm update/fresh-target-validatie uit, dispatcht `NPM Telegram Beta E2E`, pollt de exacte workflowrun, downloadt het artefact en print het Telegram-rapport.
- Maintainers kunnen dezelfde post-publish-controle vanuit GitHub Actions uitvoeren via de
  handmatige workflow `NPM Telegram Beta E2E`. Deze is bewust alleen handmatig en
  draait niet bij elke merge.
- Maintainer-releaseautomatisering gebruikt nu preflight-dan-promote:
  - echte npm-publicatie moet slagen met een succesvolle npm `preflight_run_id`
  - de echte npm-publicatie moet worden gedispatcht vanaf dezelfde `main`- of
    `release/YYYY.M.D`-branch als de succesvolle preflightrun
  - stabiele npm-releases gebruiken standaard `beta`
  - stabiele npm-publicatie kan expliciet `latest` targeten via workflowinput
  - token-gebaseerde npm dist-tag-mutatie bevindt zich nu in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    voor beveiliging, omdat `npm dist-tag add` nog steeds `NPM_TOKEN` nodig heeft terwijl de
    openbare repo OIDC-only publicatie behoudt
  - openbare `macOS Release` is alleen voor validatie; wanneer een tag alleen op een
    releasebranch bestaat maar de workflow vanaf `main` wordt gedispatcht, stel
    `public_release_branch=release/YYYY.M.D` in
  - echte private mac-publicatie moet succesvolle private mac
    `preflight_run_id` en `validate_run_id` hebben
  - de echte publicatiepaden promoveren voorbereide artefacten in plaats van ze
    opnieuw te bouwen
- Voor stabiele correctiereleases zoals `YYYY.M.D-N` controleert de post-publish-verifier
  ook hetzelfde temp-prefix-upgradepad van `YYYY.M.D` naar `YYYY.M.D-N`,
  zodat releasecorrecties oudere globale installaties niet stilzwijgend op de
  basis-stabiele payload kunnen laten staan
- npm-releasepreflight faalt gesloten tenzij de tarball zowel
  `dist/control-ui/index.html` als een niet-lege `dist/control-ui/assets/`-payload bevat,
  zodat we niet opnieuw een leeg browserdashboard leveren
- Post-publish-verificatie controleert ook dat gepubliceerde plugin-entrypoints en
  pakketmetadata aanwezig zijn in de geïnstalleerde registry-layout. Een release die
  ontbrekende plugin-runtimepayloads levert, faalt de postpublish-verifier en
  kan niet worden gepromoveerd naar `latest`.
- `pnpm test:install:smoke` handhaaft ook het npm pack `unpackedSize`-budget op
  de kandidaat-updatetarball, zodat installer-e2e onbedoelde pakketgroei opvangt
  voordat het releasepublicatiepad
- Als het releasewerk CI-planning, extensie-timingmanifests of
  extensietestmatrices heeft geraakt, regenereer en review dan de planner-owned
  `plugin-prerelease-extension-shard`-matrixoutputs uit
  `.github/workflows/plugin-prerelease.yml` vóór goedkeuring, zodat releasenotities geen
  verouderde CI-layout beschrijven
- Stabiele macOS-releasegereedheid omvat ook de updater-oppervlakken:
  - de GitHub-release moet uiteindelijk de verpakte `.zip`, `.dmg` en `.dSYM.zip` bevatten
  - `appcast.xml` op `main` moet na publicatie naar de nieuwe stabiele zip verwijzen
  - de verpakte app moet een niet-debug-bundle-id, een niet-lege Sparkle-feed-
    URL en een `CFBundleVersion` op of boven de canonieke Sparkle-buildfloor
    voor die releaseversie behouden

## Release-testboxen

`Full Release Validation` is hoe operators alle pre-release-tests vanuit
één entrypoint starten. Gebruik voor een pinned commit-bewijs op een snel bewegende branch de
helper, zodat elke childworkflow draait vanaf een tijdelijke branch die is vastgezet op de target-
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

De helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation`
vanaf die branch met `ref=<sha>`, verifieert dat elke childworkflow `headSha`
overeenkomt met de target en verwijdert daarna de tijdelijke branch. Dit voorkomt dat je per ongeluk
een nieuwere `main`-childrun bewijst.

Voor validatie van releasebranches of tags voer je dit uit vanaf de vertrouwde `main`-workflow-
ref en geef je de releasebranch of tag door als `ref`:

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
bovenliggend `release-package-under-test`-artefact voor voor pakketgerichte checks, en
dispatcht standalone pakket-Telegram-E2E wanneer `release_profile=full` met
`rerun_group=all` of wanneer `npm_telegram_package_spec` is ingesteld. `OpenClaw Release
Checks` waaiert daarna uit naar installatiesmoke, cross-OS-releasechecks, live/E2E Docker
release-paddekking wanneer soak is ingeschakeld, Package Acceptance met Telegram
pakket-QA, QA Lab-pariteit, live Matrix en live Telegram. Een volledige run is alleen acceptabel wanneer de
samenvatting van `Full Release Validation`
`normal_ci` en `release_checks` als geslaagd toont. In full/all-modus moet de
`npm_telegram`-child ook geslaagd zijn; buiten full/all wordt deze overgeslagen,
tenzij een gepubliceerde `npm_telegram_package_spec` is opgegeven. De uiteindelijke
verificatiesamenvatting bevat tabellen met traagste jobs voor elke child-run, zodat de release
manager het huidige kritieke pad kan zien zonder logs te downloaden.
Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
complete fasematrix, exacte workflowjobnamen, verschillen tussen stabiel en volledig profiel,
artefacten en gerichte rerun-handles.
Child-workflows worden gedispatcht vanaf de vertrouwde ref die `Full Release
Validation` uitvoert, normaal `--ref main`, zelfs wanneer de doel-`ref` naar een
oudere releasebranch of tag wijst. Er is geen aparte Full Release Validation
workflow-ref-invoer; kies de vertrouwde harness door de workflow-run-ref te kiezen.
Gebruik geen `--ref main -f ref=<sha>` voor exact commitbewijs op bewegende `main`;
ruwe commit-SHA's kunnen geen workflow-dispatch-refs zijn, dus gebruik
`pnpm ci:full-release --sha <sha>` om de vastgepinde tijdelijke branch te maken.

Gebruik `release_profile` om live/provider-breedte te selecteren:

- `minimum`: snelste release-kritieke live OpenAI/core- en Docker-pad
- `stable`: minimum plus stabiele provider/backend-dekking voor releasegoedkeuring
- `full`: stable plus brede adviserende provider/media-dekking

Gebruik `run_release_soak=true` met `stable` wanneer de releaseblokkerende lanes
groen zijn en je de uitputtende live/E2E-, Docker release-pad- en
begrensde gepubliceerde upgrade-survivor-sweep wilt vóór promotie. Die sweep dekt
de nieuwste vier stabiele pakketten plus vastgepinde `2026.4.23`- en `2026.5.2`-
baselines plus oudere `2026.4.15`-dekking, waarbij dubbele baselines zijn verwijderd en
elke baseline in een eigen Docker-runnerjob wordt geshard. `full` impliceert
`run_release_soak=true`.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de doel-ref
eenmalig op te lossen als `release-package-under-test` en hergebruikt dat artefact in cross-OS,
Package Acceptance en release-pad-Docker-checks wanneer soak draait. Dit houdt
alle pakketgerichte boxes op dezelfde bytes en voorkomt herhaalde pakketbuilds.
De cross-OS OpenAI-installatiesmoke gebruikt `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer de
repo/org-variabele is ingesteld, anders `openai/gpt-5.4`, omdat deze lane
pakketinstallatie, onboarding, Gateway-opstart en één live agentbeurt bewijst
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

Gebruik de volledige umbrella niet als eerste rerun na een gerichte fix. Als één box
faalt, gebruik dan de mislukte child-workflow, job, Docker-lane, pakketprofiel, model-
provider of QA-lane voor het volgende bewijs. Voer de volledige umbrella pas opnieuw uit wanneer
de fix gedeelde release-orchestratie heeft gewijzigd of eerder all-box-bewijs
verouderd heeft gemaakt. De uiteindelijke verifier van de umbrella controleert de vastgelegde child-workflow-run-
ids opnieuw, dus nadat een child-workflow succesvol opnieuw is uitgevoerd, voer alleen de mislukte
bovenliggende job `Verify full validation` opnieuw uit.

Geef voor begrensd herstel `rerun_group` door aan de umbrella. `all` is de echte
releasecandidate-run, `ci` voert alleen de normale CI-child uit, `plugin-prerelease`
voert alleen de release-only plugin-child uit, `release-checks` voert elke release-
box uit, en de smallere releasegroepen zijn `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` en `npm-telegram`.
Gerichte `npm-telegram`-reruns vereisen `npm_telegram_package_spec`; full/all-runs
met `release_profile=full` gebruiken het pakketartefact van release-checks. Gerichte
cross-OS-reruns kunnen `cross_os_suite_filter=windows/packaged-upgrade` of
een ander OS/suite-filter toevoegen. QA-releasecheckfouten zijn adviserend; een QA-only-
fout blokkeert releasevalidatie niet.

### Vitest

De Vitest-box is de handmatige `CI`-child-workflow. Handmatige CI omzeilt bewust
changed-scoping en forceert de normale testgraaf voor de releasecandidate:
Linux Node-shards, gebundelde-plugin-shards, kanaalcontracten, Node 22-
compatibiliteit, `check`, `check-additional`, buildsmoke, docs-checks, Python
skills, Windows, macOS, Android en Control UI-i18n.

Gebruik deze box om de vraag te beantwoorden: "is de source tree geslaagd voor de volledige normale testsuite?"
Dit is niet hetzelfde als release-pad-productvalidatie. Bewijs om te bewaren:

- samenvatting van `Full Release Validation` met de URL van de gedispatchte `CI`-run
- `CI`-run groen op de exacte doel-SHA
- namen van mislukte of trage shards uit de CI-jobs bij het onderzoeken van regressies
- Vitest-timingartefacten zoals `.artifacts/vitest-shard-timings.json` wanneer
  een run prestatieanalyse nodig heeft

Voer handmatige CI alleen direct uit wanneer de release deterministische normale CI nodig heeft maar
niet de Docker-, QA Lab-, live-, cross-OS- of pakketboxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

De Docker-box leeft in `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus de release-modus
`install-smoke`-workflow. Deze valideert de releasecandidate via verpakte
Docker-omgevingen in plaats van alleen source-level tests.

Release-Docker-dekking omvat:

- volledige installatiesmoke met de langzame Bun global install-smoke ingeschakeld
- voorbereiding/hergebruik van root-Dockerfile-smoke-image per doel-SHA, met QR-,
  root/Gateway- en installer/Bun-smokejobs als aparte install-smoke-
  shards
- repository-E2E-lanes
- release-pad-Docker-chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` en `plugins-runtime-install-h`
- OpenWebUI-dekking binnen de chunk `plugins-runtime-services` wanneer gevraagd
- gesplitste gebundelde-plugin-install/uninstall-lanes
  `bundled-plugin-install-uninstall-0` tot en met
  `bundled-plugin-install-uninstall-23`
- live/E2E-provider-suites en Docker-live-modeldekking wanneer releasechecks
  live-suites bevatten

Gebruik Docker-artefacten voordat je opnieuw uitvoert. De release-pad-scheduler uploadt
`.artifacts/docker-tests/` met lane-logs, `summary.json`, `failures.json`,
fasetimings, scheduler-plan-JSON en rerun-commando's. Gebruik voor gericht herstel
`docker_lanes=<lane[,lane]>` op de herbruikbare live/E2E-workflow in plaats van
alle releasechunks opnieuw uit te voeren. Gegenereerde rerun-commando's bevatten eerdere
`package_artifact_run_id` en voorbereide Docker-image-invoer wanneer beschikbaar, zodat een
mislukte lane dezelfde tarball en GHCR-images kan hergebruiken.

### QA Lab

De QA Lab-box maakt ook deel uit van `OpenClaw Release Checks`. Het is de agentische
gedrags- en kanaalniveau-releasegate, los van Vitest en Docker-
pakketmechanica.

Release-QA Lab-dekking omvat:

- mock-parity-lane die de OpenAI-candidate-lane vergelijkt met de Opus 4.6-
  baseline met behulp van het agentische parity pack
- snel live Matrix-QA-profiel met de omgeving `qa-live-shared`
- live Telegram-QA-lane met Convex CI-credentialleases
- `pnpm qa:otel:smoke` wanneer releasetelemetrie expliciet lokaal bewijs nodig heeft

Gebruik deze box om de vraag te beantwoorden: "gedraagt de release zich correct in QA-scenario's en
live kanaalstromen?" Bewaar de artefact-URL's voor parity-, Matrix- en Telegram-
lanes bij het goedkeuren van de release. Volledige Matrix-dekking blijft beschikbaar als een
handmatige gesharde QA-Lab-run in plaats van de standaard release-kritieke lane.

### Pakket

De pakketbox is de installable-product-gate. Deze wordt ondersteund door
`Package Acceptance` en de resolver
`scripts/resolve-openclaw-package-candidate.mjs`. De resolver normaliseert een
candidate naar de `package-under-test`-tarball die door Docker E2E wordt gebruikt, valideert
de pakketinventaris, registreert de pakketversie en SHA-256, en houdt de
workflow-harness-ref gescheiden van de pakketbron-ref.

Ondersteunde candidate-bronnen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-release-
  versie
- `source=ref`: pack een vertrouwde `package_ref`-branch, tag of volledige commit-SHA
  met de geselecteerde `workflow_ref`-harness
- `source=url`: download een HTTPS-`.tgz` met vereiste `package_sha256`
- `source=artifact`: hergebruik een `.tgz` dat door een andere GitHub Actions-run is geüpload

`OpenClaw Release Checks` voert Package Acceptance uit met `source=artifact`, het
voorbereide releasepakketartefact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance houdt migratie, update,
configured-auth-update-restart, cleanup van verouderde plugin-afhankelijkheden, offline plugin-
fixtures, plugin-update en Telegram-pakket-QA tegen dezelfde opgeloste
tarball. Blokkerende releasechecks gebruiken de standaard nieuwste gepubliceerde pakket-
baseline; `run_release_soak=true` of
`release_profile=full` breidt uit naar elke stabiele npm-gepubliceerde baseline van
`2026.4.23` tot en met `latest` plus reported-issue-fixtures. Gebruik
Package Acceptance met `source=npm` voor een al verzonden candidate, of
`source=ref`/`source=artifact` voor een SHA-onderbouwde lokale npm-tarball vóór
publicatie. Het is de GitHub-native
vervanging voor het grootste deel van de pakket/update-dekking die eerder
Parallels vereiste. Cross-OS-releasechecks blijven belangrijk voor OS-specifieke onboarding,
installer- en platformgedrag, maar pakket/update-productvalidatie moet
Package Acceptance verkiezen.

De canonieke checklist voor update- en pluginvalidatie is
[Updates en plugins testen](/nl/help/testing-updates-plugins). Gebruik deze bij het
bepalen welke lokale, Docker-, Package Acceptance- of releasecheck-lane een
plugin-install/update, doctor-cleanup of gepubliceerde-pakketmigratiewijziging bewijst.
Uitputtende gepubliceerde update-migratie vanaf elk stabiel `2026.4.23+`-pakket is
een aparte handmatige `Update Migration`-workflow, geen onderdeel van Full Release CI.

De soepelheid voor oudere pakketacceptatie is bewust in de tijd begrensd. Pakketten tot en met
`2026.4.25` mogen het compatibiliteitspad gebruiken voor metadatagaten die al naar
npm zijn gepubliceerd: private QA-inventarisvermeldingen die ontbreken in de tarball, ontbrekende
`gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide git-fixture,
ontbrekende blijvend opgeslagen `update.channel`, oudere Plugin-installatierecordlocaties,
ontbrekende blijvend opgeslagen marketplace-installatierecords en migratie van configmetadata
tijdens `plugins update`. Het gepubliceerde pakket `2026.4.26` mag waarschuwen
voor lokale buildmetadatastempelbestanden die al zijn verzonden. Latere pakketten
moeten voldoen aan de moderne pakketcontracten; diezelfde gaten laten releasevalidatie
mislukken.

Gebruik bredere Package Acceptance-profielen wanneer de releasevraag gaat over een
daadwerkelijk installeerbaar pakket:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Algemene pakketprofielen:

- `smoke`: snelle pakketinstallatie-/kanaal-/agent-, Gateway-netwerk- en config
  herlaadlanen
- `package`: install/update/restart/Plugin-pakketcontracten zonder live
  ClawHub; dit is de standaard voor releasecontroles
- `product`: `package` plus MCP-kanalen, cron-/subagent-opruiming, OpenAI-web
  search en OpenWebUI
- `full`: Docker-releasepadsegmenten met OpenWebUI
- `custom`: exacte `docker_lanes`-lijst voor gerichte herhalingen

Voor Telegram-bewijs van een pakketkandidaat schakel je `telegram_mode=mock-openai` of
`telegram_mode=live-frontier` in op Package Acceptance. De workflow geeft de
opgeloste `package-under-test`-tarball door aan de Telegram-laan; de zelfstandige
Telegram-workflow accepteert nog steeds een gepubliceerde npm-specificatie voor controles na publicatie.

## Automatisering voor releasepublicatie

`OpenClaw Release Publish` is het normale muterende publicatie-ingangspunt. Het
orkestreert de trusted-publisher-workflows in de volgorde die de release nodig heeft:

1. Check de releasetag uit en los de commit-SHA op.
2. Controleer of de tag bereikbaar is vanaf `main` of `release/*`.
3. Voer `pnpm plugins:sync:check` uit.
4. Dispatch `Plugin NPM Release` met `publish_scope=all-publishable` en
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` met dezelfde scope en SHA.
6. Dispatch `OpenClaw NPM Release` met de releasetag, npm-dist-tag en
   opgeslagen `preflight_run_id`.

Voorbeeld voor bètapublicatie:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Stabiele publicatie naar de standaard bèta-dist-tag:

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

Gebruik de onderliggende workflows `Plugin NPM Release` en `Plugin ClawHub Release`
alleen voor gericht herstel- of herpublicatiewerk. Geef voor een geselecteerd Plugin-herstel
`plugin_publish_scope=selected` en `plugins=@openclaw/name` door aan
`OpenClaw Release Publish`, of dispatch de onderliggende workflow rechtstreeks wanneer het
OpenClaw-pakket niet gepubliceerd mag worden.

## NPM-workflowinvoer

`OpenClaw NPM Release` accepteert deze door operators beheerde invoer:

- `tag`: vereiste releasetag zoals `v2026.4.2`, `v2026.4.2-1` of
  `v2026.4.2-beta.1`; wanneer `preflight_only=true`, mag dit ook de huidige
  volledige 40-tekens workflow-branch commit-SHA zijn voor alleen-validatiepreflight
- `preflight_only`: `true` voor alleen validatie/build/pakket, `false` voor het
  echte publicatiepad
- `preflight_run_id`: vereist op het echte publicatiepad zodat de workflow de
  voorbereide tarball uit de geslaagde preflightrun hergebruikt
- `npm_dist_tag`: npm-doeltag voor het publicatiepad; standaard `beta`

`OpenClaw Release Publish` accepteert deze door operators beheerde invoer:

- `tag`: vereiste releasetag; moet al bestaan
- `preflight_run_id`: succesvolle `OpenClaw NPM Release`-preflightrun-id;
  vereist wanneer `publish_openclaw_npm=true`
- `npm_dist_tag`: npm-doeltag voor het OpenClaw-pakket
- `plugin_publish_scope`: standaard `all-publishable`; gebruik `selected` alleen
  voor gericht herstelwerk
- `plugins`: door komma's gescheiden `@openclaw/*`-pakketnamen wanneer
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: standaard `true`; zet op `false` alleen wanneer je de
  workflow gebruikt als orchestrator voor Plugin-only herstel

`OpenClaw Release Checks` accepteert deze door operators beheerde invoer:

- `ref`: branch, tag of volledige commit-SHA om te valideren. Controles met secrets
  vereisen dat de opgeloste commit bereikbaar is vanaf een OpenClaw-branch of
  releasetag.
- `run_release_soak`: kies voor uitputtende live/E2E-, Docker-releasepad- en
  all-since upgrade-survivor-soak op stabiele/standaard releasecontroles. Dit wordt
  afgedwongen door `release_profile=full`.

Regels:

- Stabiele en correctietags mogen publiceren naar `beta` of `latest`
- Bèta-prereleasetags mogen alleen publiceren naar `beta`
- Voor `OpenClaw NPM Release` is invoer met volledige commit-SHA alleen toegestaan wanneer
  `preflight_only=true`
- `OpenClaw Release Checks` en `Full Release Validation` zijn altijd
  alleen-validatie
- Het echte publicatiepad moet dezelfde `npm_dist_tag` gebruiken als tijdens preflight;
  de workflow controleert die metadata voordat publicatie doorgaat

## Stabiele npm-releasereeks

Wanneer je een stabiele npm-release maakt:

1. Voer `OpenClaw NPM Release` uit met `preflight_only=true`
   - Voordat er een tag bestaat, mag je de huidige volledige workflow-branch commit
     SHA gebruiken voor een alleen-validatie dry-run van de preflightworkflow
2. Kies `npm_dist_tag=beta` voor de normale beta-first-flow, of `latest` alleen
   wanneer je bewust rechtstreeks stabiel wilt publiceren
3. Voer `Full Release Validation` uit op de releasebranch, releasetag of volledige
   commit-SHA wanneer je normale CI plus live promptcache, Docker, QA Lab,
   Matrix en Telegram-dekking vanuit één handmatige workflow wilt
4. Als je bewust alleen de deterministische normale testgraph nodig hebt, voer dan de
   handmatige `CI`-workflow uit op de release-ref
5. Sla de geslaagde `preflight_run_id` op
6. Voer `OpenClaw Release Publish` uit met dezelfde `tag`, dezelfde `npm_dist_tag`
   en de opgeslagen `preflight_run_id`; dit publiceert geëxternaliseerde Plugins naar npm
   en ClawHub voordat het OpenClaw-npm-pakket wordt gepromoot
7. Als de release op `beta` is geland, gebruik dan de private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow om die stabiele versie van `beta` naar `latest` te promoveren
8. Als de release bewust rechtstreeks naar `latest` is gepubliceerd en `beta`
   onmiddellijk dezelfde stabiele build moet volgen, gebruik dan dezelfde private
   workflow om beide dist-tags naar de stabiele versie te laten wijzen, of laat de geplande
   self-healing-sync `beta` later verplaatsen

De dist-tag-mutatie staat om veiligheidsredenen in de private repo, omdat deze nog steeds
`NPM_TOKEN` vereist, terwijl de publieke repo publicatie uitsluitend via OIDC houdt.

Dat houdt zowel het rechtstreekse publicatiepad als het beta-first-promotiepad
gedocumenteerd en zichtbaar voor operators.

Als een maintainer moet terugvallen op lokale npm-authenticatie, voer dan alle 1Password
CLI-commando's (`op`) alleen uit binnen een toegewezen tmux-sessie. Roep `op` niet
rechtstreeks aan vanuit de hoofd-agent-shell; door het binnen tmux te houden, blijven prompts,
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
