---
read_when:
    - Zoeken naar definities van openbare releasekanalen
    - Releasevalidatie of pakketacceptatie uitvoeren
    - Op zoek naar versienaamgeving en cadans
summary: Releasekanalen, operatorchecklist, validatievakken, versienaamgeving en ritme
title: Releasebeleid
x-i18n:
    generated_at: "2026-05-12T08:46:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01fed02c15c4d1950c055f25117fd236942a8858f843022597fe5f56ba2eb724
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw heeft drie openbare release-lanes:

- stable: getagde releases die standaard naar npm `beta` publiceren, of naar npm `latest` wanneer dit expliciet wordt gevraagd
- beta: prerelease-tags die naar npm `beta` publiceren
- dev: de bewegende kop van `main`

## Versienaamgeving

- Stable-releaseversie: `YYYY.M.D`
  - Git-tag: `vYYYY.M.D`
- Stable-correctiereleaseversie: `YYYY.M.D-N`
  - Git-tag: `vYYYY.M.D-N`
- Beta-prereleaseversie: `YYYY.M.D-beta.N`
  - Git-tag: `vYYYY.M.D-beta.N`
- Gebruik geen voorloopnullen voor maand of dag
- `latest` betekent de huidige gepromote stable npm-release
- `beta` betekent het huidige beta-installatiedoel
- Stable- en stable-correctiereleases publiceren standaard naar npm `beta`; release-operators kunnen expliciet `latest` kiezen, of later een gecontroleerde beta-build promoveren
- Elke stable OpenClaw-release levert het npm-pakket en de macOS-app samen;
  beta-releases valideren en publiceren normaal gesproken eerst het npm-/pakketpad, waarbij
  bouwen/ondertekenen/notariëren van de Mac-app voor stable wordt gereserveerd, tenzij expliciet gevraagd

## Releasetempo

- Releases gaan beta-first
- Stable volgt pas nadat de nieuwste beta is gevalideerd
- Maintainers maken releases normaal gesproken vanaf een `release/YYYY.M.D`-branch die is gemaakt
  vanaf de huidige `main`, zodat releasevalidatie en fixes nieuwe
  ontwikkeling op `main` niet blokkeren
- Als een beta-tag is gepusht of gepubliceerd en een fix nodig heeft, maken maintainers
  de volgende `-beta.N`-tag in plaats van de oude beta-tag te verwijderen of opnieuw te maken
- Gedetailleerde releaseprocedure, goedkeuringen, inloggegevens en herstelnotities zijn
  alleen voor maintainers

## Checklist voor release-operator

Deze checklist is de openbare vorm van de releaseflow. Privé-inloggegevens,
ondertekening, notariëring, dist-tag-herstel en details voor noodrollback blijven in
het alleen-voor-maintainers release-runbook.

1. Begin vanaf de huidige `main`: haal de nieuwste wijzigingen op, bevestig dat de doelcommit is gepusht,
   en bevestig dat de huidige `main`-CI groen genoeg is om er een branch van te maken.
2. Herschrijf de bovenste `CHANGELOG.md`-sectie op basis van echte commitgeschiedenis met
   `/changelog`, houd vermeldingen gebruikersgericht, commit dit, push dit, en rebase/pull
   nog een keer voordat je brancht.
3. Controleer releasecompatibiliteitsrecords in
   `src/plugins/compat/registry.ts` en
   `src/commands/doctor/shared/deprecation-compat.ts`. Verwijder verlopen
   compatibiliteit alleen wanneer het upgradepad gedekt blijft, of leg vast waarom deze
   bewust wordt behouden.
4. Maak `release/YYYY.M.D` vanaf de huidige `main`; doe normaal releasewerk niet
   direct op `main`.
5. Verhoog elke vereiste versielocatie voor de bedoelde tag en voer daarna
   `pnpm release:prep` uit. Dit ververst Plugin-versies, Plugin-inventaris, configuratie-
   schema, gebundelde kanaalconfiguratiemetadata, configuratiedocs-baseline, Plugin SDK-
   exports en Plugin SDK API-baseline in de juiste volgorde. Commit eventuele gegenereerde
   drift voordat je tagt. Voer daarna de lokale deterministische preflight uit:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, en `pnpm release:check`.
6. Voer `OpenClaw NPM Release` uit met `preflight_only=true`. Voordat er een tag bestaat,
   is een volledige release-branch-SHA van 40 tekens toegestaan voor alleen-validatie
   preflight. Bewaar de succesvolle `preflight_run_id`.
7. Start alle prerelease-tests met `Full Release Validation` voor de
   release-branch, tag of volledige commit-SHA. Dit is het ene handmatige toegangspunt
   voor de vier grote release-testboxen: Vitest, Docker, QA Lab en Package.
8. Als validatie faalt, fix dit op de release-branch en voer het kleinste gefaalde
   bestand, de lane, workflow-job, pakketprofiel, provider of model-allowlist opnieuw uit die
   de fix bewijst. Voer de volledige paraplu alleen opnieuw uit wanneer het gewijzigde oppervlak
   eerder bewijs verouderd maakt.
9. Voor beta: tag `vYYYY.M.D-beta.N`, voer daarna `OpenClaw Release Publish` uit vanaf
   de overeenkomende `release/YYYY.M.D`-branch. Dit verifieert `pnpm plugins:sync:check`,
   dispatcht alle publiceerbare Plugin-pakketten parallel naar npm en dezelfde set naar
   ClawHub, en promoveert daarna het voorbereide OpenClaw npm-preflight-
   artifact met de overeenkomende dist-tag zodra publiceren van Plugin npm slaagt.
   Nadat het OpenClaw npm publish-child is geslaagd, maakt of werkt het de
   overeenkomende GitHub-release-/prereleasepagina bij vanuit de volledige overeenkomende
   `CHANGELOG.md`-sectie. Stable-releases die naar npm `latest` zijn gepubliceerd, worden de
   nieuwste GitHub-release; stable-maintenance-releases die op npm `beta` blijven, worden
   gemaakt met GitHub `latest=false`.
   ClawHub-publicatie kan nog actief zijn terwijl OpenClaw npm publiceert, maar de
   release-publish-workflow print de child-run-ID's direct. Standaard wacht deze
   niet op ClawHub na dispatch, zodat beschikbaarheid van OpenClaw npm
   niet wordt geblokkeerd door tragere ClawHub-goedkeuringen of registerwerk; stel
   `wait_for_clawhub=true` in wanneer ClawHub workflowvoltooiing moet blokkeren. Het
   ClawHub-pad probeert tijdelijke installatiefouten van CLI-afhankelijkheden opnieuw, publiceert
   plugins die de preview doorstaan, zelfs wanneer één preview-cel hapert, en eindigt met
   registerverificatie voor elke verwachte Plugin-versie zodat gedeeltelijke publicaties
   zichtbaar en opnieuw probeerbaar blijven. Voer na publicatie
   `pnpm release:verify-beta -- YYYY.M.D-beta.N --openclaw-npm-run <run-id> --plugin-npm-run <run-id> --plugin-clawhub-run <run-id>`
   uit om de GitHub-prerelease, npm `beta`-dist-tags, npm-integriteit,
   gepubliceerd installatiepad, exacte ClawHub-versies, ClawHub-artifacts en child-
   workflowconclusies vanuit één opdracht te verifiëren. Voeg `--rerun-failed-clawhub` toe wanneer de
   ClawHub-sidecar alleen in opnieuw probeerbare jobs faalde en ter plekke opnieuw moet worden uitgevoerd.
   Voer daarna de post-publish-pakketacceptatie uit tegen het gepubliceerde
   `openclaw@YYYY.M.D-beta.N`- of
   `openclaw@beta`-pakket. Als een gepushte of gepubliceerde prerelease een fix nodig heeft,
   maak dan het volgende overeenkomende prerelease-nummer; verwijder of herschrijf de oude
   prerelease niet.
10. Voor stable: ga alleen verder nadat de gecontroleerde beta of release candidate het
    vereiste validatiebewijs heeft. Stable npm-publicatie loopt ook via
    `OpenClaw Release Publish`, waarbij het succesvolle preflight-artifact via
    `preflight_run_id` wordt hergebruikt; gereedheid voor stable macOS-release vereist ook de
    verpakte `.zip`, `.dmg`, `.dSYM.zip` en bijgewerkte `appcast.xml` op `main`.
    De private macOS-publish-workflow publiceert de ondertekende appcast automatisch naar publieke
    `main` nadat release-assets zijn geverifieerd; als branchbescherming de directe push blokkeert,
    opent of werkt deze een appcast-PR bij.
11. Voer na publicatie de npm post-publish-verifier uit, optioneel zelfstandige
    gepubliceerde-npm Telegram E2E wanneer je post-publish kanaalbewijs nodig hebt,
    dist-tag-promotie wanneer nodig, verifieer de gegenereerde GitHub-releasepagina,
    en voer de release-aankondigingsstappen uit.

## Release-preflight

- Voer `pnpm check:test-types` uit vóór release-preflight, zodat test-TypeScript
  gedekt blijft buiten de snellere lokale `pnpm check`-gate
- Voer `pnpm check:architecture` uit vóór release-preflight, zodat de bredere
  importcyclus- en architectuurgrenscontroles groen zijn buiten de snellere lokale gate
- Voer `pnpm build && pnpm ui:build` uit vóór `pnpm release:check`, zodat de verwachte
  `dist/*`-releaseartefacten en de Control UI-bundel bestaan voor de
  pakketvalidatiestap
- Voer `pnpm release:prep` uit na de root-versieverhoging en vóór het taggen. Het
  voert elke deterministische releasegenerator uit die vaak afwijkt na een
  versie-/config-/API-wijziging: Plugin-versies, Plugin-inventaris, basisconfiguratie-
  schema, gebundelde kanaalconfiguratie-metadata, basislijn voor configuratiedocs,
  Plugin SDK-exports en Plugin SDK-API-basislijn. `pnpm release:check` voert die
  bewakers opnieuw uit in checkmodus en rapporteert elke gegenereerde afwijkingsfout
  die het vindt in één doorgang voordat pakketreleasecontroles worden uitgevoerd.
- Voer de handmatige `Full Release Validation`-workflow uit vóór releasegoedkeuring om
  alle pre-release testboxen vanuit één toegangspunt te starten. Deze accepteert een branch,
  tag of volledige commit-SHA, dispatcht handmatig `CI` en dispatcht
  `OpenClaw Release Checks` voor installatiesmoke, pakketacceptatie, cross-OS
  pakketcontroles, QA Lab-pariteit, Matrix- en Telegram-lanes. Stabiele/standaardruns
  houden uitputtende live/E2E- en Docker-releasepad-soak achter
  `run_release_soak=true`; `release_profile=full` dwingt soak af. Met
  `release_profile=full` en `rerun_group=all` voert het ook pakket-Telegram
  E2E uit tegen het `release-package-under-test`-artefact uit releasecontroles.
  Geef `release_package_spec` op na het publiceren van een bèta om het verscheepte
  npm-pakket opnieuw te gebruiken voor releasecontroles, Package Acceptance en pakket-Telegram
  E2E zonder de release-tarball opnieuw te bouwen. Geef
  `npm_telegram_package_spec` alleen op wanneer Telegram een ander
  gepubliceerd pakket moet gebruiken dan de rest van releasevalidatie. Geef
  `package_acceptance_package_spec` op wanneer Package Acceptance een
  ander gepubliceerd pakket moet gebruiken dan de releasepakket-specificatie. Geef
  `evidence_package_spec` op wanneer het private bewijsrapport moet aantonen dat de
  validatie overeenkomt met een gepubliceerd npm-pakket zonder Telegram E2E af te dwingen.
  Voorbeeld:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Voer de handmatige `Package Acceptance`-workflow uit wanneer je side-channel-bewijs
  wilt voor een pakketkandidaat terwijl releasewerk doorgaat. Gebruik `source=npm` voor
  `openclaw@beta`, `openclaw@latest` of een exacte releaseversie; `source=ref`
  om een vertrouwde `package_ref`-branch/tag/SHA te packen met de huidige
  `workflow_ref`-harness; `source=url` voor een HTTPS-tarball met een vereiste
  SHA-256; of `source=artifact` voor een tarball die door een andere GitHub
  Actions-run is geüpload. De workflow herleidt de kandidaat tot
  `package-under-test`, hergebruikt de Docker E2E-releasescheduler tegen die
  tarball en kan Telegram QA tegen dezelfde tarball uitvoeren met
  `telegram_mode=mock-openai` of `telegram_mode=live-frontier`. Wanneer de
  geselecteerde Docker-lanes `published-upgrade-survivor` bevatten, is het pakket-
  artefact de kandidaat en selecteert `published_upgrade_survivor_baseline`
  de gepubliceerde basislijn. `update-restart-auth` gebruikt het kandidaatpakket als
  zowel de geïnstalleerde CLI als het package-under-test, zodat het het managed
  restart-pad van het updatecommando van de kandidaat oefent.
  Voorbeeld: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Gangbare profielen:
  - `smoke`: install/channel/agent-, Gateway-netwerk- en configuratieherlaadlanes
  - `package`: artefact-native package/update/restart/Plugin-lanes zonder OpenWebUI of live ClawHub
  - `product`: package-profiel plus MCP-kanalen, Cron-/subagent-opruiming,
    OpenAI-webzoekopdracht en OpenWebUI
  - `full`: Docker-releasepad-chunks met OpenWebUI
  - `custom`: exacte `docker_lanes`-selectie voor een gerichte rerun
- Voer de handmatige `CI`-workflow direct uit wanneer je alleen volledige normale CI-
  dekking nodig hebt voor de releasekandidaat. Handmatige CI-dispatches omzeilen gewijzigde
  scoping en forceren de Linux Node-shards, gebundelde-Plugin-shards, kanaal-
  contracten, Node 22-compatibiliteit, `check`, `check-additional`, build-smoke,
  docs-controles, Python Skills, Windows, macOS, Android en Control UI i18n-
  lanes.
  Voorbeeld: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Voer `pnpm qa:otel:smoke` uit bij het valideren van releasetelemetrie. Het oefent
  QA-lab via een lokale OTLP/HTTP-ontvanger en verifieert de geëxporteerde trace-
  span-namen, begrensde attributen en redactie van inhoud/identifiers zonder
  Opik, Langfuse of een andere externe collector te vereisen.
- Voer `pnpm release:check` uit vóór elke getagde release
- Voer `OpenClaw Release Publish` uit voor de muterende publicatiereeks nadat de
  tag bestaat. Dispatch deze vanuit `release/YYYY.M.D` (of `main` wanneer je een
  vanaf main bereikbare tag publiceert), geef de releasetag en succesvolle OpenClaw npm
  `preflight_run_id` door en behoud de standaard Plugin-publicatiescope
  `all-publishable`, tenzij je bewust een gerichte reparatie uitvoert. De
  workflow serialiseert Plugin-npm-publicatie, Plugin-ClawHub-publicatie en OpenClaw
  npm-publicatie, zodat het corepakket niet vóór de geëxternaliseerde
  plugins wordt gepubliceerd.
- Releasecontroles draaien nu in een aparte handmatige workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` voert ook de QA Lab mock-pariteitslane plus het snelle
  live Matrix-profiel en de Telegram QA-lane uit vóór releasegoedkeuring. De live
  lanes gebruiken de `qa-live-shared`-omgeving; Telegram gebruikt ook Convex CI-
  credentialleases. Voer de handmatige `QA-Lab - All Lanes`-workflow uit met
  `matrix_profile=all` en `matrix_shards=true` wanneer je volledige Matrix-
  transport-, media- en E2EE-inventaris parallel wilt.
- Cross-OS installatie- en upgrade-runtimevalidatie maakt deel uit van publieke
  `OpenClaw Release Checks` en `Full Release Validation`, die de herbruikbare workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direct aanroepen
- Deze splitsing is opzettelijk: houd het echte npm-releasepad kort,
  deterministisch en artefactgericht, terwijl langzamere livecontroles in hun
  eigen lane blijven zodat ze publiceren niet ophouden of blokkeren
- Releasecontroles met geheimen moeten worden gedispatcht via `Full Release
Validation` of vanuit de `main`/release-workflowref, zodat workflowlogica en
  geheimen gecontroleerd blijven
- `OpenClaw Release Checks` accepteert een branch, tag of volledige commit-SHA zolang
  de herleide commit bereikbaar is vanaf een OpenClaw-branch of releasetag
- `OpenClaw NPM Release` validation-only preflight accepteert ook de huidige
  volledige 40-tekens workflow-branch-commit-SHA zonder een gepushte tag te vereisen
- Dat SHA-pad is alleen voor validatie en kan niet worden gepromoveerd naar een echte publicatie
- In SHA-modus synthetiseert de workflow `v<package.json version>` alleen voor de
  pakketmetadata-controle; echte publicatie vereist nog steeds een echte releasetag
- Beide workflows houden het echte publicatie- en promotiepad op GitHub-gehoste
  runners, terwijl het niet-muterende validatiepad de grotere
  Blacksmith Linux-runners kan gebruiken
- Die workflow voert
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  uit met zowel `OPENAI_API_KEY` als `ANTHROPIC_API_KEY` workflowsecrets
- npm-releasepreflight wacht niet langer op de aparte releasecontroles-lane
- Voer vóór het lokaal taggen van een releasekandidaat
  `RELEASE_TAG=vYYYY.M.D-beta.N pnpm release:fast-pretag-check` uit. De helper
  voert de snelle releasebewakingsregels, Plugin npm-/ClawHub-releasecontroles, build,
  UI-build en `release:openclaw:npm:check` uit in de volgorde die veelvoorkomende
  goedkeuringsblokkerende fouten opvangt voordat de GitHub-publicatieworkflow start.
- Voer `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (of de overeenkomende bèta-/correctietag) uit vóór goedkeuring
- Voer na npm-publicatie
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (of de overeenkomende bèta-/correctieversie) uit om het gepubliceerde registry-
  installatiepad te verifiëren in een verse tijdelijke prefix
- Voer na een bèta-publicatie `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  uit om installed-package-onboarding, Telegram-configuratie en echte Telegram E2E
  te verifiëren tegen het gepubliceerde npm-pakket met de gedeelde geleasede Telegram-
  credentialpool. Lokale eenmalige maintainer-runs mogen de Convex-vars weglaten en de drie
  `OPENCLAW_QA_TELEGRAM_*`-env-credentials direct doorgeven.
- Gebruik `pnpm release:beta-smoke -- --beta betaN` om de volledige post-publish bèta-smoke vanaf een maintainer-machine uit te voeren. De helper voert Parallels npm update-/fresh-targetvalidatie uit, dispatcht `NPM Telegram Beta E2E`, pollt de exacte workflowrun, downloadt het artefact en print het Telegram-rapport.
- Maintainers kunnen dezelfde post-publish-controle uitvoeren vanuit GitHub Actions via de
  handmatige `NPM Telegram Beta E2E`-workflow. Deze is bewust alleen handmatig en
  draait niet bij elke merge.
- Maintainer-releaseautomatisering gebruikt nu preflight-dan-promote:
  - echte npm-publicatie moet slagen met een succesvolle npm `preflight_run_id`
  - de echte npm-publicatie moet worden gedispatcht vanaf dezelfde `main`- of
    `release/YYYY.M.D`-branch als de succesvolle preflight-run
  - stabiele npm-releases gebruiken standaard `beta`
  - stabiele npm-publicatie kan expliciet op `latest` mikken via workflowinput
  - tokengebaseerde npm dist-tag-mutatie leeft nu in
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
    voor beveiliging, omdat `npm dist-tag add` nog steeds `NPM_TOKEN` nodig heeft terwijl de
    publieke repo OIDC-only publicatie behoudt
  - publieke `macOS Release` is alleen validatie; wanneer een tag alleen op een
    releasebranch bestaat maar de workflow vanuit `main` wordt gedispatcht, stel dan
    `public_release_branch=release/YYYY.M.D` in
  - echte private mac-publicatie moet slagen met succesvolle private mac
    `preflight_run_id` en `validate_run_id`
  - de echte publicatiepaden promoten voorbereide artefacten in plaats van ze opnieuw te bouwen
- Voor stabiele correctiereleases zoals `YYYY.M.D-N` controleert de post-publish-verifier
  ook hetzelfde temp-prefix-upgradepad van `YYYY.M.D` naar `YYYY.M.D-N`,
  zodat releasecorrecties oudere globale installaties niet stilzwijgend op de
  basis-stabiele payload kunnen laten staan
- npm-releasepreflight faalt gesloten tenzij de tarball zowel
  `dist/control-ui/index.html` als een niet-lege `dist/control-ui/assets/`-payload bevat,
  zodat we niet opnieuw een leeg browserdashboard verschepen
- Post-publish-verificatie controleert ook of gepubliceerde Plugin-entrypoints en
  pakketmetadata aanwezig zijn in de geïnstalleerde registry-layout. Een release die
  ontbrekende Plugin-runtimepayloads verscheept, faalt de postpublish-verifier en
  kan niet worden gepromoveerd naar `latest`.
- `pnpm test:install:smoke` dwingt ook het npm-pack `unpackedSize`-budget af op
  de kandidaat-update-tarball, zodat installer-e2e onbedoelde pakketgroei opvangt
  vóór het releasepublicatiepad
- Als het releasewerk CI-planning, extensietimingmanifests of
  extensietestmatrices raakte, regenereer en review dan de planner-owned
  `plugin-prerelease-extension-shard`-matrixoutputs uit
  `.github/workflows/plugin-prerelease.yml` vóór goedkeuring, zodat releasenotities geen
  verouderde CI-layout beschrijven
- Stabiele macOS-releasegereedheid omvat ook de updater-oppervlakken:
  - de GitHub-release moet eindigen met de verpakte `.zip`, `.dmg` en `.dSYM.zip`
  - `appcast.xml` op `main` moet na publicatie naar de nieuwe stabiele zip verwijzen; de
    private macOS-publicatieworkflow commit deze automatisch, of opent een appcast-
    PR wanneer direct pushen is geblokkeerd
  - de verpakte app moet een niet-debug bundle-id, een niet-lege Sparkle-feed-
    URL en een `CFBundleVersion` op of boven de canonieke Sparkle-buildvloer
    voor die releaseversie behouden

## Release-testboxes

`Full Release Validation` is hoe operators alle pre-releasetests starten vanuit
een enkel toegangspunt. Gebruik voor bewijs van een vastgezette commit op een
snel bewegende branch de helper, zodat elke child-workflow draait vanaf een
tijdelijke branch die is vastgezet op de doel-SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

De helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation`
vanaf die branch met `ref=<sha>`, controleert of elke child-workflow `headSha`
overeenkomt met het doel, en verwijdert daarna de tijdelijke branch. Dit voorkomt
dat per ongeluk een nieuwere `main`-child-run wordt bewezen.

Voor validatie van een releasebranch of tag voer je deze uit vanaf de vertrouwde
`main`-workflow-ref en geef je de releasebranch of tag door als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

De workflow resolveert de doel-ref, dispatcht handmatige `CI` met
`target_ref=<release-ref>`, dispatcht `OpenClaw Release Checks`, bereidt een
bovenliggend `release-package-under-test`-artefact voor package-gerichte checks
voor, en dispatcht standalone package Telegram E2E wanneer
`release_profile=full` met `rerun_group=all`, of wanneer
`release_package_spec` of `npm_telegram_package_spec` is ingesteld.
`OpenClaw Release Checks` spreidt vervolgens uit naar install smoke,
cross-OS-releasechecks, live/E2E Docker-releasepaddekking wanneer soak is
ingeschakeld, Package Acceptance met Telegram-package-QA, QA Lab-pariteit, live
Matrix en live Telegram. Een volledige run is alleen acceptabel wanneer de
samenvatting van `Full Release Validation` `normal_ci` en `release_checks` als
succesvol toont. In full/all-modus moet de `npm_telegram`-child ook succesvol
zijn; buiten full/all wordt deze overgeslagen, tenzij een gepubliceerde
`release_package_spec` of `npm_telegram_package_spec` is opgegeven. De
uiteindelijke verificatiesamenvatting bevat tabellen met traagste jobs voor elke
child-run, zodat de releasemanager het huidige kritieke pad kan zien zonder logs
te downloaden.
Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
complete stagematrix, exacte workflow-jobnamen, verschillen tussen stable- en
full-profielen, artefacten en gerichte rerun-handles.
Child-workflows worden gedispatcht vanaf de vertrouwde ref die `Full Release
Validation` uitvoert, normaal `--ref main`, zelfs wanneer de doel-`ref` naar een
oudere releasebranch of tag wijst. Er is geen afzonderlijke
Full Release Validation workflow-ref-invoer; kies de vertrouwde harness door de
workflow-run-ref te kiezen.
Gebruik `--ref main -f ref=<sha>` niet voor exact commitbewijs op bewegende
`main`; ruwe commit-SHA's kunnen geen workflow-dispatch-refs zijn, dus gebruik
`pnpm ci:full-release --sha <sha>` om de vastgezette tijdelijke branch te maken.

Gebruik `release_profile` om live/provider-breedte te selecteren:

- `minimum`: snelste release-kritieke OpenAI/core live- en Docker-pad
- `stable`: minimum plus stable provider/backend-dekking voor releasegoedkeuring
- `full`: stable plus brede advisory provider/media-dekking

Gebruik `run_release_soak=true` met `stable` wanneer de releaseblokkerende lanes
groen zijn en je de uitputtende live/E2E-, Docker-releasepad- en begrensde
gepubliceerde upgrade-survivor-sweep wilt vóór promotie. Die sweep dekt de
laatste vier stable packages plus vastgezette `2026.4.23`- en `2026.5.2`
baselines plus oudere `2026.4.15`-dekking, waarbij dubbele baselines worden
verwijderd en elke baseline in zijn eigen Docker-runner-job wordt geshard.
`full` impliceert `run_release_soak=true`.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de doel-ref één
keer te resolven als `release-package-under-test` en hergebruikt dat artefact in
cross-OS-, Package Acceptance- en releasepad-Docker-checks wanneer soak draait.
Zo blijven alle package-gerichte boxes op dezelfde bytes en worden herhaalde
package-builds vermeden.
Nadat een beta al op npm staat, stel je
`release_package_spec=openclaw@YYYY.M.D-beta.N` in, zodat releasechecks het
verzonden package één keer downloaden, de build-source-SHA uit
`dist/build-info.json` extraheren en dat artefact hergebruiken voor cross-OS,
Package Acceptance, releasepad-Docker en package Telegram-lanes.
De cross-OS OpenAI install smoke gebruikt `OPENCLAW_CROSS_OS_OPENAI_MODEL`
wanneer de repo/org-variabele is ingesteld, anders `openai/gpt-5.4`, omdat deze
lane package-installatie, onboarding, Gateway-startup en één live agentbeurt
bewijst in plaats van het traagste standaardmodel te benchmarken. De bredere
live provider-matrix blijft de plek voor modelspecifieke dekking.

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
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Gebruik de volledige umbrella niet als eerste rerun na een gerichte fix. Als één
box faalt, gebruik dan de gefaalde child-workflow, job, Docker-lane,
package-profiel, modelprovider of QA-lane voor het volgende bewijs. Draai de
volledige umbrella alleen opnieuw wanneer de fix gedeelde release-orchestratie
heeft gewijzigd of eerder bewijs voor alle boxes verouderd heeft gemaakt. De
uiteindelijke verifier van de umbrella controleert de vastgelegde
child-workflow-run-id's opnieuw, dus nadat een child-workflow succesvol opnieuw
is uitgevoerd, rerun je alleen de gefaalde bovenliggende job
`Verify full validation`.

Geef voor begrensd herstel `rerun_group` door aan de umbrella. `all` is de echte
release-candidate-run, `ci` draait alleen de normale CI-child,
`plugin-prerelease` draait alleen de release-only Plugin-child,
`release-checks` draait elke releasebox, en de smallere releasegroepen zijn
`install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`,
`qa-live` en `npm-telegram`. Gerichte `npm-telegram`-reruns vereisen
`release_package_spec` of `npm_telegram_package_spec`; full/all-runs met
`release_profile=full` gebruiken het release-checks-packageartefact. Gerichte
cross-OS-reruns kunnen `cross_os_suite_filter=windows/packaged-upgrade` of een
andere OS/suite-filter toevoegen. QA-releasecheckfouten zijn adviserend; een
alleen-QA-fout blokkeert releasevalidatie niet.

### Vitest

De Vitest-box is de handmatige `CI`-child-workflow. Handmatige CI omzeilt bewust
changed-scoping en forceert de normale testgraaf voor de releasecandidate:
Linux Node-shards, gebundelde-Plugin-shards, channel-contracts,
Node 22-compatibiliteit, `check`, `check-additional`, build smoke, docs-checks,
Python Skills, Windows, macOS, Android en Control UI i18n.

Gebruik deze box om te beantwoorden: "is de source tree geslaagd voor de
volledige normale testsuite?" Dit is niet hetzelfde als productvalidatie van het
releasepad. Bewijs om te bewaren:

- `Full Release Validation`-samenvatting met de gedispatchte `CI`-run-URL
- `CI`-run groen op de exacte doel-SHA
- gefaalde of trage shardnamen uit de CI-jobs bij onderzoek naar regressies
- Vitest-timingartefacten zoals `.artifacts/vitest-shard-timings.json` wanneer
  een run prestatieanalyse nodig heeft

Draai handmatige CI alleen rechtstreeks wanneer de release deterministische
normale CI nodig heeft, maar niet de Docker-, QA Lab-, live-, cross-OS- of
package-boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

De Docker-box zit in `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus de release-modus
`install-smoke`-workflow. Deze valideert de releasecandidate via verpakte
Docker-omgevingen in plaats van alleen tests op sourceniveau.

Release-Docker-dekking omvat:

- volledige install smoke met de trage Bun global install smoke ingeschakeld
- voorbereiding/hergebruik van de root-Dockerfile-smoke-image per doel-SHA, met
  QR-, root/Gateway- en installer/Bun-smoke-jobs als afzonderlijke
  install-smoke-shards
- repository-E2E-lanes
- releasepad-Docker-chunks: `core`, `package-update-openai`,
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
- live/E2E-provider-suites en Docker-live-modeldekking wanneer releasechecks
  live suites bevatten

Gebruik Docker-artefacten voordat je opnieuw draait. De releasepad-scheduler
uploadt `.artifacts/docker-tests/` met lane-logs, `summary.json`,
`failures.json`, fase-timings, scheduler-plan-JSON en rerun-commando's. Gebruik
voor gericht herstel `docker_lanes=<lane[,lane]>` op de herbruikbare
live/E2E-workflow in plaats van alle releasechunks opnieuw te draaien.
Gegenereerde rerun-commando's bevatten eerdere `package_artifact_run_id` en
voorbereide Docker-image-inputs wanneer beschikbaar, zodat een gefaalde lane
dezelfde tarball en GHCR-images kan hergebruiken.

### QA Lab

De QA Lab-box maakt ook deel uit van `OpenClaw Release Checks`. Dit is de
agentic gedrags- en channel-level releasegate, los van Vitest en
Docker-packagemechanica.

Release-QA Lab-dekking omvat:

- mock-parity-lane die de OpenAI-candidate-lane vergelijkt met de Opus 4.6
  baseline via het agentic parity pack
- snel live Matrix-QA-profiel met de `qa-live-shared`-omgeving
- live Telegram-QA-lane met Convex CI-credentialleases
- `pnpm qa:otel:smoke` wanneer releasetelemetrie expliciet lokaal bewijs nodig
  heeft

Gebruik deze box om te beantwoorden: "gedraagt de release zich correct in
QA-scenario's en live channelflows?" Bewaar de artefact-URL's voor de parity-,
Matrix- en Telegram-lanes bij het goedkeuren van de release. Volledige
Matrix-dekking blijft beschikbaar als handmatige gesharde QA-Lab-run in plaats
van de standaard release-kritieke lane.

### Package

De Package-box is de gate voor het installeerbare product. Deze wordt
ondersteund door `Package Acceptance` en de resolver
`scripts/resolve-openclaw-package-candidate.mjs`. De resolver normaliseert een
candidate naar de `package-under-test`-tarball die door Docker E2E wordt
geconsumeerd, valideert de package-inventaris, registreert de packageversie en
SHA-256, en houdt de workflow-harness-ref gescheiden van de package-source-ref.

Ondersteunde candidate-bronnen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` of een exacte
  OpenClaw-releaseversie
- `source=ref`: pack een vertrouwde `package_ref`-branch, tag of volledige
  commit-SHA met de geselecteerde `workflow_ref`-harness
- `source=url`: download een HTTPS `.tgz` met vereiste `package_sha256`
- `source=artifact`: hergebruik een `.tgz` die door een andere GitHub Actions-run
  is geüpload

`OpenClaw Release Checks` voert Pakketacceptatie uit met `source=artifact`, het
voorbereide releasepakketartefact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Pakketacceptatie houdt migratie, update,
herstart na geconfigureerde-authenticatie-update, live ClawHub-Skills-installatie, opschonen van verouderde Plugin-afhankelijkheden, offline Plugin-fixtures, Plugin-update en Telegram-pakket-QA tegen dezelfde opgeloste
tarball. Blokkerende releasecontroles gebruiken de standaardbaseline van het laatst gepubliceerde pakket;
`run_release_soak=true` of
`release_profile=full` breidt dit uit naar elke stabiele npm-gepubliceerde baseline van
`2026.4.23` tot en met `latest`, plus fixtures voor gerapporteerde issues. Gebruik
Pakketacceptatie met `source=npm` voor een kandidaat die al is uitgebracht, of
`source=ref`/`source=artifact` voor een door een SHA ondersteunde lokale npm-tarball vóór
publicatie. Dit is de GitHub-native
vervanging voor het grootste deel van de pakket-/updatedekking waarvoor eerder
Parallels nodig was. Cross-OS-releasecontroles blijven belangrijk voor OS-specifieke onboarding,
installer- en platformgedrag, maar pakket-/updateproductvalidatie moet
de voorkeur geven aan Pakketacceptatie.

De canonieke checklist voor update- en Plugin-validatie is
[Updates en Plugins testen](/nl/help/testing-updates-plugins). Gebruik deze bij het
bepalen welke lokale, Docker-, Pakketacceptatie- of releasecontrole-lane een
Plugin-installatie/update, doctor-opschoning of gepubliceerde-pakketmigratiewijziging bewijst.
Uitputtende gepubliceerde-updatemigratie vanaf elk stabiel `2026.4.23+`-pakket is
een aparte handmatige `Update Migration`-workflow, geen onderdeel van Full Release CI.

Legacy-tolerantie voor pakketacceptatie is opzettelijk in de tijd beperkt. Pakketten tot en met
`2026.4.25` mogen het compatibiliteitspad gebruiken voor metadatagaten die al naar
npm zijn gepubliceerd: private QA-inventarisvermeldingen die ontbreken in de tarball, ontbrekende
`gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide git-
fixture, ontbrekende persistente `update.channel`, legacy-locaties voor Plugin-installatierecords,
ontbrekende persistentie van marketplace-installatierecords en migratie van configmetadata
tijdens `plugins update`. Het gepubliceerde `2026.4.26`-pakket mag waarschuwen
voor lokale buildmetadata-stempelbestanden die al zijn uitgebracht. Latere pakketten
moeten voldoen aan de moderne pakketcontracten; dezelfde gaten laten releasevalidatie
mislukken.

Gebruik bredere Pakketacceptatieprofielen wanneer de releasevraag gaat over een
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

Veelgebruikte pakketprofielen:

- `smoke`: snelle pakketinstallatie-/kanaal-/agent-, Gateway-netwerk- en config-
  herlaadlanes
- `package`: installatie-/update-/herstart-/Plugin-pakketcontracten plus live ClawHub-
  Skills-installatiebewijs; dit is de standaard voor releasecontroles
- `product`: `package` plus MCP-kanalen, cron/subagent-opschoning, OpenAI-web
  zoeken en OpenWebUI
- `full`: Docker-releasepad-chunks met OpenWebUI
- `custom`: exacte `docker_lanes`-lijst voor gerichte herhalingen

Voor Telegram-bewijs voor pakketkandidaten schakelt u `telegram_mode=mock-openai` of
`telegram_mode=live-frontier` in op Pakketacceptatie. De workflow geeft de
opgeloste `package-under-test`-tarball door aan de Telegram-lane; de zelfstandige
Telegram-workflow accepteert nog steeds een gepubliceerde npm-specificatie voor controles na publicatie.

## Releasepublicatieautomatisering

`OpenClaw Release Publish` is het normale muterende publicatie-ingangspunt. Het
orkestreert de trusted-publisher-workflows in de volgorde die de release nodig heeft:

1. Check de releasetag uit en los de commit-SHA ervan op.
2. Verifieer dat de tag bereikbaar is vanaf `main` of `release/*`.
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

Gebruik de lager-niveau workflows `Plugin NPM Release` en `Plugin ClawHub Release`
alleen voor gericht herstel- of herpublicatiewerk. Geef voor een geselecteerd Plugin-herstel
`plugin_publish_scope=selected` en `plugins=@openclaw/name` door aan
`OpenClaw Release Publish`, of dispatch de child-workflow rechtstreeks wanneer het
OpenClaw-pakket niet mag worden gepubliceerd.

## NPM-workflowinvoer

`OpenClaw NPM Release` accepteert deze door operators beheerde invoer:

- `tag`: vereiste releasetag zoals `v2026.4.2`, `v2026.4.2-1` of
  `v2026.4.2-beta.1`; wanneer `preflight_only=true`, mag dit ook de huidige
  volledige 40-tekens workflowbranch-commit-SHA zijn voor alleen-validatie-preflight
- `preflight_only`: `true` voor alleen validatie/build/pakket, `false` voor het
  echte publicatiepad
- `preflight_run_id`: vereist op het echte publicatiepad, zodat de workflow de
  voorbereide tarball uit de succesvolle preflight-run hergebruikt
- `npm_dist_tag`: npm-doeltag voor het publicatiepad; standaard `beta`

`OpenClaw Release Publish` accepteert deze door operators beheerde invoer:

- `tag`: vereiste releasetag; moet al bestaan
- `preflight_run_id`: succesvolle `OpenClaw NPM Release`-preflight-run-id;
  vereist wanneer `publish_openclaw_npm=true`
- `npm_dist_tag`: npm-doeltag voor het OpenClaw-pakket
- `plugin_publish_scope`: standaard `all-publishable`; gebruik `selected` alleen
  voor gericht herstelwerk
- `plugins`: kommagescheiden `@openclaw/*`-pakketnamen wanneer
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: standaard `true`; stel alleen `false` in wanneer de
  workflow wordt gebruikt als alleen-Plugin-herstelorkestrator
- `wait_for_clawhub`: standaard `false`, zodat npm-beschikbaarheid niet wordt geblokkeerd door
  de ClawHub-sidecar; stel alleen `true` in wanneer workflowvoltooiing ook
  ClawHub-voltooiing moet omvatten

`OpenClaw Release Checks` accepteert deze door operators beheerde invoer:

- `ref`: branch, tag of volledige commit-SHA om te valideren. Controles met secrets
  vereisen dat de opgeloste commit bereikbaar is vanaf een OpenClaw-branch of
  releasetag.
- `run_release_soak`: kies voor uitputtende live/E2E-, Docker-releasepad- en
  all-since upgrade-survivor-soak op stabiele/standaardreleasecontroles. Dit wordt afgedwongen
  door `release_profile=full`.

Regels:

- Stabiele en correctietags mogen naar `beta` of `latest` publiceren
- Beta-prereleasetags mogen alleen naar `beta` publiceren
- Voor `OpenClaw NPM Release` is volledige commit-SHA-invoer alleen toegestaan wanneer
  `preflight_only=true`
- `OpenClaw Release Checks` en `Full Release Validation` zijn altijd
  alleen-validatie
- Het echte publicatiepad moet dezelfde `npm_dist_tag` gebruiken als tijdens preflight;
  de workflow verifieert die metadata voordat de publicatie doorgaat

## Stabiele npm-releasereeks

Bij het maken van een stabiele npm-release:

1. Voer `OpenClaw NPM Release` uit met `preflight_only=true`
   - Voordat een tag bestaat, mag u de huidige volledige workflowbranch-commit-
     SHA gebruiken voor een alleen-validatie-droogrun van de preflight-workflow
2. Kies `npm_dist_tag=beta` voor de normale beta-first-flow, of alleen `latest`
   wanneer u bewust rechtstreeks stabiel wilt publiceren
3. Voer `Full Release Validation` uit op de releasebranch, releasetag of volledige
   commit-SHA wanneer u normale CI plus live promptcache, Docker, QA Lab,
   Matrix en Telegram-dekking vanuit één handmatige workflow wilt
4. Als u bewust alleen de deterministische normale testgraaf nodig hebt, voert u in plaats daarvan de
   handmatige `CI`-workflow uit op de release-ref
5. Sla de succesvolle `preflight_run_id` op
6. Voer `OpenClaw Release Publish` uit met dezelfde `tag`, dezelfde `npm_dist_tag`,
   en de opgeslagen `preflight_run_id`; deze publiceert geëxternaliseerde Plugins naar npm
   en ClawHub voordat het OpenClaw-npm-pakket wordt gepromoveerd
7. Als de release op `beta` is geland, gebruikt u de private
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`-
   workflow om die stabiele versie van `beta` naar `latest` te promoveren
8. Als de release bewust rechtstreeks naar `latest` is gepubliceerd en `beta`
   onmiddellijk dezelfde stabiele build moet volgen, gebruikt u dezelfde private
   workflow om beide dist-tags naar de stabiele versie te laten wijzen, of laat u de geplande
   zelfherstellende synchronisatie `beta` later verplaatsen

De dist-tag-mutatie leeft om veiligheidsredenen in de private repo, omdat deze nog steeds
`NPM_TOKEN` vereist, terwijl de publieke repo alleen OIDC-publicatie behoudt.

Zo blijven het directe publicatiepad en het beta-first-promotiepad beide
gedocumenteerd en zichtbaar voor operators.

Als een maintainer moet terugvallen op lokale npm-authenticatie, voer dan alle 1Password
CLI-(`op`)-opdrachten alleen uit binnen een dedicated tmux-sessie. Roep `op` niet
rechtstreeks aan vanuit de hoofd-agent-shell; door dit binnen tmux te houden zijn prompts,
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
voor het daadwerkelijke runbook.

## Gerelateerd

- [Releasekanalen](/nl/install/development-channels)
