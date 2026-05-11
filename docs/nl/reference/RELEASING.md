---
read_when:
    - Zoeken naar definities van openbare releasekanalen
    - Releasevalidatie of pakketacceptatie uitvoeren
    - Op zoek naar versiebenaming en releasecadans
summary: Releasekanalen, operatorchecklist, validatiekaders, versienaamgeving en cadans
title: Releasebeleid
x-i18n:
    generated_at: "2026-05-11T20:48:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4f3aaa53534bb6d1af5e72900a48f52fc89ff8188af7b19ecf75543bfcb1ecb
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw heeft drie openbare releasekanalen:

- stable: getagde releases die standaard publiceren naar npm `beta`, of naar npm `latest` wanneer dit expliciet wordt gevraagd
- beta: prerelease-tags die publiceren naar npm `beta`
- dev: de bewegende head van `main`

## Versienaamgeving

- Stabiele releaseversie: `YYYY.M.D`
  - Git-tag: `vYYYY.M.D`
- Stabiele correctiereleaseversie: `YYYY.M.D-N`
  - Git-tag: `vYYYY.M.D-N`
- Beta-prereleaseversie: `YYYY.M.D-beta.N`
  - Git-tag: `vYYYY.M.D-beta.N`
- Gebruik geen voorloopnul voor maand of dag
- `latest` betekent de huidige gepromote stabiele npm-release
- `beta` betekent het huidige beta-installatiedoel
- Stabiele en stabiele correctiereleases publiceren standaard naar npm `beta`; releaseoperators kunnen expliciet `latest` als doel kiezen, of later een gecontroleerde beta-build promoveren
- Elke stabiele OpenClaw-release levert het npm-pakket en de macOS-app samen;
  beta-releases valideren en publiceren normaal eerst het npm-/pakketpad, waarbij
  bouwen/ondertekenen/notariseren van de Mac-app voor stable wordt gereserveerd, tenzij expliciet gevraagd

## Releasecadans

- Releases gaan eerst via beta
- Stable volgt pas nadat de nieuwste beta is gevalideerd
- Maintainers maken releases normaal vanaf een `release/YYYY.M.D`-branch die is gemaakt
  vanaf de huidige `main`, zodat releasevalidatie en fixes nieuwe
  ontwikkeling op `main` niet blokkeren
- Als een beta-tag is gepusht of gepubliceerd en een fix nodig heeft, maken maintainers
  de volgende `-beta.N`-tag in plaats van de oude beta-tag te verwijderen of opnieuw te maken
- Gedetailleerde releaseprocedure, goedkeuringen, referenties en herstelnotities zijn
  alleen voor maintainers

## Checklist voor releaseoperators

Deze checklist is de openbare vorm van de releaseflow. Privéreferenties,
ondertekening, notarisatie, dist-tag-herstel en details voor noodrollback blijven in
het release-runbook dat alleen voor maintainers is.

1. Begin vanaf de huidige `main`: haal de nieuwste wijzigingen op, bevestig dat de doelcommit is gepusht,
   en bevestig dat de huidige `main`-CI groen genoeg is om daarvan te branchen.
2. Herschrijf de bovenste sectie van `CHANGELOG.md` vanuit echte commitgeschiedenis met
   `/changelog`, houd vermeldingen gebruikersgericht, commit dit, push dit, en rebase/pull
   nogmaals voordat je brancht.
3. Controleer releasecompatibiliteitsrecords in
   `src/plugins/compat/registry.ts` en
   `src/commands/doctor/shared/deprecation-compat.ts`. Verwijder verlopen
   compatibiliteit alleen wanneer het upgradepad gedekt blijft, of leg vast waarom deze
   bewust wordt behouden.
4. Maak `release/YYYY.M.D` vanaf de huidige `main`; doe normaal releasewerk niet
   rechtstreeks op `main`.
5. Verhoog elke vereiste versielocatie voor de beoogde tag, en voer daarna
   `pnpm release:prep` uit. Dit vernieuwt Plugin-versies, Plugin-inventaris, configuratieschema,
   metadata voor gebundelde kanaalconfiguratie, baseline voor configuratiedocumentatie,
   Plugin SDK-exports en Plugin SDK API-baseline in de juiste volgorde. Commit eventuele gegenereerde
   afwijkingen voordat je tagt. Voer daarna de lokale deterministische preflight uit:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, en `pnpm release:check`.
6. Voer `OpenClaw NPM Release` uit met `preflight_only=true`. Voordat er een tag bestaat,
   is een volledige release-branch-SHA van 40 tekens toegestaan voor preflight die alleen
   valideert. Sla de succesvolle `preflight_run_id` op.
7. Start alle pre-releasetests met `Full Release Validation` voor de
   releasebranch, tag of volledige commit-SHA. Dit is het enige handmatige startpunt
   voor de vier grote releasetestboxen: Vitest, Docker, QA Lab en Package.
8. Als validatie mislukt, fix dit op de releasebranch en voer opnieuw het kleinste mislukte
   bestand, kanaal, workflowjob, pakketprofiel, provider of model-allowlist uit dat
   de fix bewijst. Voer de volledige umbrella alleen opnieuw uit wanneer het gewijzigde oppervlak
   eerder bewijs verouderd maakt.
9. Voor beta: tag `vYYYY.M.D-beta.N`, en voer daarna `OpenClaw Release Publish` uit vanaf
   de overeenkomende `release/YYYY.M.D`-branch. Dit verifieert `pnpm plugins:sync:check`,
   dispatcht alle publiceerbare Plugin-pakketten parallel naar npm en dezelfde set naar
   ClawHub, en promoot daarna het voorbereide OpenClaw npm-preflightartefact
   met de overeenkomende dist-tag zodra publicatie van Plugin npm slaagt.
   Nadat de OpenClaw npm-publish-child slaagt, maakt of werkt dit de
   overeenkomende GitHub-release-/prereleasepagina bij vanuit de volledige overeenkomende
   `CHANGELOG.md`-sectie. Stabiele releases die naar npm `latest` zijn gepubliceerd, worden de
   nieuwste GitHub-release; stabiele onderhoudsreleases die op npm `beta` blijven, worden
   gemaakt met GitHub `latest=false`.
   ClawHub-publicatie kan nog lopen terwijl OpenClaw npm publiceert, maar de
   release-publicatieworkflow print de child-run-ID's onmiddellijk. Standaard
   wacht deze niet op ClawHub nadat dit is gedispatcht, zodat OpenClaw npm-beschikbaarheid
   niet wordt geblokkeerd door tragere ClawHub-goedkeuringen of registry-werk; stel
   `wait_for_clawhub=true` in wanneer ClawHub workflowvoltooiing moet blokkeren. Het
   ClawHub-pad probeert tijdelijke installatiefouten van CLI-afhankelijkheden opnieuw, publiceert
   plugins die preview halen zelfs wanneer één preview-cel flaket, en eindigt met
   registry-verificatie voor elke verwachte Plugin-versie zodat gedeeltelijke publicaties
   zichtbaar en opnieuw uitvoerbaar blijven. Voer na publicatie
   de post-publicatiepakketacceptatie uit tegen het gepubliceerde pakket
   `openclaw@YYYY.M.D-beta.N` of
   `openclaw@beta`. Als een gepushte of gepubliceerde prerelease een fix nodig heeft,
   maak dan het volgende overeenkomende prereleasenummer; verwijder of herschrijf de oude
   prerelease niet.
10. Voor stable: ga alleen verder nadat de gecontroleerde beta of releasecandidate het
    vereiste validatiebewijs heeft. Stabiele npm-publicatie loopt ook via
    `OpenClaw Release Publish`, waarbij het succesvolle preflightartefact opnieuw wordt gebruikt via
    `preflight_run_id`; gereedheid voor stabiele macOS-release vereist ook de
    verpakte `.zip`, `.dmg`, `.dSYM.zip` en bijgewerkte `appcast.xml` op `main`.
    De privé macOS-publicatieworkflow publiceert de ondertekende appcast automatisch naar openbare
    `main` nadat releaseassets zijn geverifieerd; als branchbescherming de directe push blokkeert,
    opent of werkt deze een appcast-PR bij.
11. Voer na publicatie de npm-post-publicatieverifier uit, optioneel standalone
    gepubliceerde-npm Telegram E2E wanneer je post-publicatiekanaalbewijs nodig hebt,
    dist-tag-promotie wanneer nodig, verifieer de gegenereerde GitHub-releasepagina,
    en voer de stappen voor de releaseaankondiging uit.

## Releasepreflight

- Voer `pnpm check:test-types` uit vóór de release-preflight, zodat test-TypeScript
  ook buiten de snellere lokale `pnpm check`-gate gedekt blijft
- Voer `pnpm check:architecture` uit vóór de release-preflight, zodat de bredere
  importcyclus- en architectuurgrenscontroles buiten de snellere lokale gate
  groen zijn
- Voer `pnpm build && pnpm ui:build` uit vóór `pnpm release:check`, zodat de
  verwachte `dist/*`-releaseartefacten en Control UI-bundel bestaan voor de
  pack-validatiestap
- Voer `pnpm release:prep` uit na de root-versieverhoging en vóór het taggen.
  Het voert elke deterministische releasegenerator uit die vaak afwijkt na een
  versie-/configuratie-/API-wijziging: Plugin-versies, Plugin-inventaris,
  basisconfiguratieschema, metadata voor gebundelde kanaalconfiguratie,
  basislijn voor configuratiedocumentatie, Plugin SDK-exports en Plugin SDK
  API-basislijn. `pnpm release:check` voert die controles opnieuw uit in
  checkmodus en rapporteert elke gevonden gegenereerde afwijkingsfout in één
  doorgang voordat pakketreleasecontroles worden uitgevoerd.
- Voer de handmatige `Full Release Validation`-workflow uit vóór releasegoedkeuring
  om alle pre-release-testboxes vanuit één entrypoint te starten. Deze accepteert
  een branch, tag of volledige commit-SHA, dispatcht handmatige `CI` en dispatcht
  `OpenClaw Release Checks` voor installatiesmoke, pakketacceptatie,
  cross-OS-pakketcontroles, QA Lab-pariteit, Matrix- en Telegram-lanes.
  Stabiele/standaardruns houden uitputtende live/E2E- en Docker-releasepad-soak
  achter `run_release_soak=true`; `release_profile=full` forceert soak aan. Met
  `release_profile=full` en `rerun_group=all` voert deze ook pakket-Telegram-E2E
  uit tegen het `release-package-under-test`-artefact uit releasecontroles.
  Geef `release_package_spec` op na het publiceren van een bèta om het verzonden
  npm-pakket opnieuw te gebruiken in releasecontroles, Package Acceptance en
  pakket-Telegram-E2E zonder de releasetarball opnieuw te bouwen. Geef
  `npm_telegram_package_spec` alleen op wanneer Telegram een ander gepubliceerd
  pakket moet gebruiken dan de rest van de releasevalidatie. Geef
  `package_acceptance_package_spec` op wanneer Package Acceptance een ander
  gepubliceerd pakket moet gebruiken dan de release package spec. Geef
  `evidence_package_spec` op wanneer het private bewijsrapport moet aantonen dat
  de validatie overeenkomt met een gepubliceerd npm-pakket zonder Telegram E2E
  af te dwingen.
  Voorbeeld:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Voer de handmatige `Package Acceptance`-workflow uit wanneer je side-channel-bewijs
  wilt voor een pakketkandidaat terwijl releasewerk doorgaat. Gebruik `source=npm`
  voor `openclaw@beta`, `openclaw@latest` of een exacte releaseversie; `source=ref`
  om een vertrouwde `package_ref`-branch/-tag/-SHA te packen met de huidige
  `workflow_ref`-harness; `source=url` voor een HTTPS-tarball met een vereiste
  SHA-256; of `source=artifact` voor een tarball die door een andere GitHub
  Actions-run is geüpload. De workflow resolveert de kandidaat naar
  `package-under-test`, hergebruikt de Docker E2E-releasescheduler tegen die
  tarball en kan Telegram QA tegen dezelfde tarball uitvoeren met
  `telegram_mode=mock-openai` of `telegram_mode=live-frontier`. Wanneer de
  geselecteerde Docker-lanes `published-upgrade-survivor` bevatten, is het
  pakketartefact de kandidaat en selecteert `published_upgrade_survivor_baseline`
  de gepubliceerde basislijn. `update-restart-auth` gebruikt het kandidaatpakket
  als zowel de geïnstalleerde CLI als het package-under-test, zodat het het
  managed restart-pad van de updateopdracht van de kandidaat oefent.
  Voorbeeld: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Veelgebruikte profielen:
  - `smoke`: install/channel/agent-, Gateway-netwerk- en configuratieherlaadlanes
  - `package`: artefact-native pakket-/update-/restart-/Plugin-lanes zonder OpenWebUI of live ClawHub
  - `product`: pakketprofiel plus MCP-kanalen, cron-/subagent-opruiming,
    OpenAI webzoekfunctie en OpenWebUI
  - `full`: Docker-releasepadchunks met OpenWebUI
  - `custom`: exacte `docker_lanes`-selectie voor een gerichte rerun
- Voer de handmatige `CI`-workflow direct uit wanneer je alleen volledige normale
  CI-dekking nodig hebt voor de releasekandidaat. Handmatige CI-dispatches
  omzeilen changed-scoping en forceren de Linux Node-shards, gebundelde-Plugin-shards,
  kanaalcontracten, Node 22-compatibiliteit, `check`, `check-additional`,
  build-smoke, documentatiecontroles, Python Skills, Windows, macOS, Android en
  Control UI i18n-lanes.
  Voorbeeld: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Voer `pnpm qa:otel:smoke` uit bij het valideren van releasetelemetrie. Het
  oefent QA-lab via een lokale OTLP/HTTP-receiver en verifieert de geëxporteerde
  trace-spannamen, begrensde attributen en redactie van content/identifiers
  zonder Opik, Langfuse of een andere externe collector te vereisen.
- Voer `pnpm release:check` uit vóór elke getagde release
- Voer `OpenClaw Release Publish` uit voor de muterende publicatiereeks nadat de
  tag bestaat. Dispatch deze vanuit `release/YYYY.M.D` (of `main` wanneer je een
  vanaf main bereikbare tag publiceert), geef de releasetag en succesvolle
  OpenClaw npm `preflight_run_id` door en behoud de standaard Plugin-publicatiescope
  `all-publishable`, tenzij je bewust een gerichte reparatie uitvoert. De workflow
  serialiseert Plugin npm publish, Plugin ClawHub publish en OpenClaw npm publish,
  zodat het corepakket niet wordt gepubliceerd vóór zijn geëxternaliseerde
  Plugins.
- Releasecontroles draaien nu in een afzonderlijke handmatige workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` voert ook de QA Lab mock-pariteitslane plus het snelle
  live Matrix-profiel en de Telegram QA-lane uit vóór releasegoedkeuring. De live
  lanes gebruiken de `qa-live-shared`-omgeving; Telegram gebruikt ook Convex
  CI-credentialleases. Voer de handmatige `QA-Lab - All Lanes`-workflow uit met
  `matrix_profile=all` en `matrix_shards=true` wanneer je de volledige Matrix
  transport-, media- en E2EE-inventaris parallel wilt.
- Cross-OS-installatie- en upgraderuntimevalidatie maakt deel uit van publieke
  `OpenClaw Release Checks` en `Full Release Validation`, die de herbruikbare
  workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direct
  aanroepen
- Deze splitsing is opzettelijk: houd het echte npm-releasepad kort,
  deterministisch en artefactgericht, terwijl tragere livecontroles in hun eigen
  lane blijven, zodat ze publicatie niet vertragen of blokkeren
- Releasecontroles met geheimen moeten worden gedispatcht via `Full Release
Validation` of vanuit de `main`/release-workflowref, zodat workflowlogica en
  geheimen gecontroleerd blijven
- `OpenClaw Release Checks` accepteert een branch, tag of volledige commit-SHA
  zolang de geresolveerde commit bereikbaar is vanaf een OpenClaw-branch of
  releasetag
- `OpenClaw NPM Release` validation-only-preflight accepteert ook de huidige
  volledige workflow-branch-commit-SHA van 40 tekens zonder een gepushte tag te
  vereisen
- Dat SHA-pad is alleen voor validatie en kan niet worden gepromoveerd naar een
  echte publicatie
- In SHA-modus synthetiseert de workflow `v<package.json version>` alleen voor
  de pakketmetadatacontrole; echte publicatie vereist nog steeds een echte
  releasetag
- Beide workflows houden het echte publicatie- en promotiepad op door GitHub
  gehoste runners, terwijl het niet-muterende validatiepad de grotere Blacksmith
  Linux-runners kan gebruiken
- Die workflow voert
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  uit met zowel `OPENAI_API_KEY` als `ANTHROPIC_API_KEY` workflowgeheimen
- npm-releasepreflight wacht niet langer op de afzonderlijke releasecontroles-lane
- Voer `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (of de overeenkomende bèta-/correctietag) uit vóór goedkeuring
- Voer na npm-publicatie
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (of de overeenkomende bèta-/correctieversie) uit om het gepubliceerde
  registry-installatiepad in een verse tijdelijke prefix te verifiëren
- Voer na een bètapublicatie `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  uit om installed-package onboarding, Telegram-configuratie en echte Telegram
  E2E tegen het gepubliceerde npm-pakket te verifiëren met de gedeelde geleasete
  Telegram-credentialpool. Lokale maintainer-one-offs kunnen de Convex-vars
  weglaten en de drie `OPENCLAW_QA_TELEGRAM_*` env-credentials direct doorgeven.
- Gebruik `pnpm release:beta-smoke -- --beta betaN` om de volledige post-publish
  bèta-smoke vanaf een maintainermachine uit te voeren. De helper voert Parallels
  npm update/fresh-target-validatie uit, dispatcht `NPM Telegram Beta E2E`, pollt
  de exacte workflowrun, downloadt het artefact en print het Telegram-rapport.
- Maintainers kunnen dezelfde post-publish-controle vanuit GitHub Actions
  uitvoeren via de handmatige `NPM Telegram Beta E2E`-workflow. Deze is bewust
  alleen handmatig en draait niet bij elke merge.
- Maintainer-releaseautomatisering gebruikt nu preflight-then-promote:
  - echte npm-publicatie moet slagen met een succesvolle npm `preflight_run_id`
  - de echte npm-publicatie moet worden gedispatcht vanuit dezelfde `main`- of
    `release/YYYY.M.D`-branch als de succesvolle preflightrun
  - stabiele npm-releases gebruiken standaard `beta`
  - stabiele npm-publicatie kan expliciet op `latest` richten via workflowinput
  - tokengebaseerde npm dist-tag-mutatie leeft nu in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    voor beveiliging, omdat `npm dist-tag add` nog steeds `NPM_TOKEN` nodig
    heeft terwijl de publieke repo OIDC-only publish behoudt
  - publieke `macOS Release` is alleen validatie; wanneer een tag alleen op een
    releasebranch leeft maar de workflow vanuit `main` wordt gedispatcht, stel
    `public_release_branch=release/YYYY.M.D` in
  - echte private mac-publicatie moet slagen met succesvolle private mac
    `preflight_run_id` en `validate_run_id`
  - de echte publicatiepaden promoveren voorbereide artefacten in plaats van ze
    opnieuw te bouwen
- Voor stabiele correctiereleases zoals `YYYY.M.D-N` controleert de
  post-publish-verifier ook hetzelfde temp-prefix-upgradepad van `YYYY.M.D` naar
  `YYYY.M.D-N`, zodat releasecorrecties oudere globale installaties niet stil
  op de basis-stabiele payload kunnen laten staan
- npm-releasepreflight faalt gesloten tenzij de tarball zowel
  `dist/control-ui/index.html` als een niet-lege `dist/control-ui/assets/`-payload
  bevat, zodat we niet opnieuw een leeg browserdashboard verzenden
- Post-publish-verificatie controleert ook dat gepubliceerde Plugin-entrypoints
  en pakketmetadata aanwezig zijn in de geïnstalleerde registry-layout. Een
  release die ontbrekende Plugin-runtimepayloads verzendt, faalt de
  postpublish-verifier en kan niet naar `latest` worden gepromoveerd.
- `pnpm test:install:smoke` dwingt ook het npm pack `unpackedSize`-budget af op
  de kandidaat-updatetarball, zodat installer-e2e onbedoelde pack-bloat opvangt
  vóór het releasepublicatiepad
- Als het releasewerk CI-planning, extensietimingmanifests of
  extensietestmatrices heeft geraakt, regenereer en review dan vóór goedkeuring
  de door de planner beheerde `plugin-prerelease-extension-shard`-matrixoutputs
  uit `.github/workflows/plugin-prerelease.yml`, zodat releasenotes geen
  verouderde CI-layout beschrijven
- Gereedheid voor stabiele macOS-releases omvat ook de updater-surfaces:
  - de GitHub-release moet eindigen met de verpakte `.zip`, `.dmg` en `.dSYM.zip`
  - `appcast.xml` op `main` moet na publicatie naar de nieuwe stabiele zip wijzen;
    de private macOS-publicatieworkflow commit deze automatisch, of opent een
    appcast-PR wanneer direct pushen wordt geblokkeerd
  - de verpakte app moet een niet-debug-bundle-id, een niet-lege Sparkle-feed-URL
    en een `CFBundleVersion` op of boven de canonieke Sparkle-buildvloer voor
    die releaseversie behouden

## Releasetestboxes

`Full Release Validation` is hoe operators alle pre-release-tests vanuit één
entrypoint starten. Gebruik voor vastgepind commitbewijs op een snel bewegende
branch de helper, zodat elke childworkflow vanaf een tijdelijke branch draait
die op de doel-SHA is vastgezet:

```bash
pnpm ci:full-release --sha <full-sha>
```

De helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation`
vanaf die branch met `ref=<sha>`, verifieert dat elke child workflow `headSha`
overeenkomt met het doel, en verwijdert daarna de tijdelijke branch. Dit voorkomt dat per ongeluk een
nieuwere `main` child-run wordt bewezen.

Voor validatie van een release-branch of tag voer je dit uit vanaf de vertrouwde `main` workflow
ref en geef je de release-branch of tag door als `ref`:

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
parent-artifact `release-package-under-test` voor pakketgerichte checks voor, en
dispatcht standalone package Telegram E2E wanneer `release_profile=full` met
`rerun_group=all`, of wanneer `release_package_spec` of
`npm_telegram_package_spec` is ingesteld. `OpenClaw Release
Checks` vertakt daarna naar install-smoke, cross-OS release checks, live/E2E Docker
release-paddekking wanneer soak is ingeschakeld, Package Acceptance met Telegram
package QA, QA Lab parity, live Matrix en live Telegram. Een volledige run is alleen acceptabel wanneer de
samenvatting van `Full Release Validation`
`normal_ci` en `release_checks` als geslaagd toont. In full/all-modus moet
de `npm_telegram` child ook succesvol zijn; buiten full/all wordt deze overgeslagen
tenzij een gepubliceerde `release_package_spec` of `npm_telegram_package_spec` is
opgegeven. De uiteindelijke
verifier-samenvatting bevat tabellen met langzaamste jobs voor elke child-run, zodat de release
manager het huidige kritieke pad kan zien zonder logs te downloaden.
Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
complete stagematrix, exacte workflow-jobnamen, verschillen tussen stable- en full-profielen,
artifacts en gerichte rerun-handles.
Child workflows worden gedispatcht vanaf de vertrouwde ref die `Full Release
Validation` uitvoert, normaal `--ref main`, zelfs wanneer de doel-`ref` naar een
oudere release-branch of tag wijst. Er is geen aparte workflow-ref-invoer voor Full Release Validation;
kies de vertrouwde harness door de workflow-run-ref te kiezen.
Gebruik geen `--ref main -f ref=<sha>` voor exact commitbewijs op bewegende `main`;
ruwe commit-SHA's kunnen geen workflow dispatch-refs zijn, dus gebruik
`pnpm ci:full-release --sha <sha>` om de gepinde tijdelijke branch te maken.

Gebruik `release_profile` om live/provider-breedte te selecteren:

- `minimum`: snelste release-kritieke OpenAI/core live- en Docker-pad
- `stable`: minimum plus stable provider/backend-dekking voor releasegoedkeuring
- `full`: stable plus brede adviserende provider/media-dekking

Gebruik `run_release_soak=true` met `stable` wanneer de release-blokkerende lanes
groen zijn en je de uitputtende live/E2E-, Docker release-pad- en
begrensde gepubliceerde upgrade-survivor-sweep wilt uitvoeren vóór promotie. Die sweep dekt
de nieuwste vier stable pakketten plus gepinde `2026.4.23`- en `2026.5.2`-
baselines plus oudere `2026.4.15`-dekking, met dubbele baselines verwijderd en
elke baseline geshard in zijn eigen Docker-runnerjob. `full` impliceert
`run_release_soak=true`.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de doel-ref
eenmaal op te lossen als `release-package-under-test` en hergebruikt dat artifact in cross-OS,
Package Acceptance en release-pad Docker-checks wanneer soak draait. Dit houdt
alle pakketgerichte boxes op dezelfde bytes en voorkomt herhaalde pakketbuilds.
Nadat een beta al op npm staat, stel je `release_package_spec=openclaw@YYYY.M.D-beta.N` in,
zodat release checks het verzonden pakket eenmaal downloaden, de build source
SHA uit `dist/build-info.json` extraheren en dat artifact hergebruiken voor cross-OS,
Package Acceptance, release-pad Docker en package Telegram-lanes.
De cross-OS OpenAI install-smoke gebruikt `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer de
repo/org-variabele is ingesteld, anders `openai/gpt-5.4`, omdat deze lane
pakketinstallatie, onboarding, Gateway-startup en één live agentbeurt
bewijst in plaats van het langzaamste standaardmodel te benchmarken. De bredere live provider-
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
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Gebruik de volledige umbrella niet als eerste rerun na een gerichte fix. Als één box
faalt, gebruik dan de mislukte child workflow, job, Docker-lane, package-profiel, model
provider of QA-lane voor het volgende bewijs. Draai de volledige umbrella pas opnieuw wanneer
de fix gedeelde release-orchestratie wijzigde of eerder all-box-bewijs
verouderd maakte. De uiteindelijke verifier van de umbrella controleert de vastgelegde child workflow run-
ids opnieuw, dus nadat een child workflow succesvol opnieuw is uitgevoerd, voer je alleen de mislukte
parentjob `Verify full validation` opnieuw uit.

Geef voor begrensd herstel `rerun_group` door aan de umbrella. `all` is de echte
release-candidate-run, `ci` draait alleen de normale CI-child, `plugin-prerelease`
draait alleen de release-only Plugin-child, `release-checks` draait elke release-
box, en de smallere releasegroepen zijn `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` en `npm-telegram`.
Gerichte `npm-telegram`-reruns vereisen `release_package_spec` of
`npm_telegram_package_spec`; full/all-runs met `release_profile=full` gebruiken het
package-artifact van release-checks. Gerichte
cross-OS-reruns kunnen `cross_os_suite_filter=windows/packaged-upgrade` of
een ander OS/suite-filter toevoegen. QA release-check-mislukkingen zijn adviserend; een QA-only
mislukking blokkeert releasevalidatie niet.

### Vitest

De Vitest-box is de handmatige `CI` child workflow. Handmatige CI omzeilt bewust
changed scoping en forceert de normale testgraph voor de release
candidate: Linux Node-shards, bundled-plugin-shards, channel-contracten, Node 22-
compatibiliteit, `check`, `check-additional`, build-smoke, docs-checks, Python
Skills, Windows, macOS, Android en Control UI i18n.

Gebruik deze box om te beantwoorden: "is de source tree geslaagd voor de volledige normale testsuite?"
Dit is niet hetzelfde als release-pad productvalidatie. Bewijs om te bewaren:

- `Full Release Validation`-samenvatting met de gedispatchte `CI`-run-URL
- `CI`-run groen op de exacte doel-SHA
- mislukte of trage shardnamen uit de CI-jobs bij regressieonderzoek
- Vitest-timingartifacts zoals `.artifacts/vitest-shard-timings.json` wanneer
  een run prestatieanalyse nodig heeft

Voer handmatige CI alleen direct uit wanneer de release deterministische normale CI nodig heeft, maar
niet de Docker-, QA Lab-, live-, cross-OS- of package-boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

De Docker-box leeft in `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus de release-modus
`install-smoke` workflow. Deze valideert de release candidate via packaged
Docker-omgevingen in plaats van alleen source-level-tests.

Release Docker-dekking omvat:

- volledige install-smoke met de trage Bun global install-smoke ingeschakeld
- voorbereiding/hergebruik van de root-Dockerfile smoke-image per doel-SHA, met QR-,
  root/Gateway- en installer/Bun-smokejobs die als aparte install-smoke-
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
- gesplitste bundled Plugin install/uninstall-lanes
  `bundled-plugin-install-uninstall-0` tot en met
  `bundled-plugin-install-uninstall-23`
- live/E2E provider-suites en Docker live model-dekking wanneer release checks
  live suites bevatten

Gebruik Docker-artifacts voordat je opnieuw draait. De release-pad scheduler uploadt
`.artifacts/docker-tests/` met lane-logs, `summary.json`, `failures.json`,
fasetimings, scheduler-plan-JSON en rerun-commando's. Gebruik voor gericht herstel
`docker_lanes=<lane[,lane]>` op de herbruikbare live/E2E-workflow in plaats van
alle release-chunks opnieuw te draaien. Gegenereerde rerun-commando's bevatten eerdere
`package_artifact_run_id` en voorbereide Docker-image-invoer waar beschikbaar, zodat een
mislukte lane dezelfde tarball en GHCR-images kan hergebruiken.

### QA Lab

De QA Lab-box is ook onderdeel van `OpenClaw Release Checks`. Het is de agentic
gedrags- en channel-level release gate, los van Vitest en Docker-
packagemechanica.

Release QA Lab-dekking omvat:

- mock parity-lane die de OpenAI candidate-lane vergelijkt met de Opus 4.6-
  baseline met het agentic parity pack
- snelle live Matrix QA-profiel met de `qa-live-shared`-omgeving
- live Telegram QA-lane met Convex CI-credentialleases
- `pnpm qa:otel:smoke` wanneer releasetelemetrie expliciet lokaal bewijs nodig heeft

Gebruik deze box om te beantwoorden: "gedraagt de release zich correct in QA-scenario's en
live channel-flows?" Bewaar de artifact-URL's voor parity-, Matrix- en Telegram-
lanes bij het goedkeuren van de release. Volledige Matrix-dekking blijft beschikbaar als een
handmatige gesharde QA-Lab-run in plaats van de standaard release-kritieke lane.

### Package

De Package-box is de poort voor het installeerbare product. Deze wordt ondersteund door
`Package Acceptance` en de resolver
`scripts/resolve-openclaw-package-candidate.mjs`. De resolver normaliseert een
candidate naar de `package-under-test`-tarball die Docker E2E consumeert, valideert
de package-inventory, registreert de pakketversie en SHA-256, en houdt de
workflow-harness-ref gescheiden van de package source-ref.

Ondersteunde candidate-bronnen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-release
  versie
- `source=ref`: pack een vertrouwde `package_ref`-branch, tag of volledige commit-SHA
  met de geselecteerde `workflow_ref`-harness
- `source=url`: download een HTTPS `.tgz` met vereiste `package_sha256`
- `source=artifact`: hergebruik een `.tgz` die door een andere GitHub Actions-run is geüpload

`OpenClaw Release Checks` draait Package Acceptance met `source=artifact`, het
voorbereide release-package-artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance houdt migratie, update,
configured-auth update restart, live ClawHub Skill-installatie, opruiming van stale Plugin-dependency's, offline Plugin-
fixtures, Plugin-update en Telegram package QA tegen dezelfde opgeloste
tarball. Blokkerende release checks gebruiken de standaard nieuwste gepubliceerde package-
baseline; `run_release_soak=true` of
`release_profile=full` breidt uit naar elke stable npm-gepubliceerde baseline van
`2026.4.23` tot en met `latest` plus reported-issue-fixtures. Gebruik
Package Acceptance met `source=npm` voor een al verzonden candidate, of
`source=ref`/`source=artifact` voor een SHA-onderbouwde lokale npm-tarball vóór
publish. Het is de GitHub-native
vervanging voor het grootste deel van de package/update-dekking die eerder
Parallels vereiste. Cross-OS release checks blijven belangrijk voor OS-specifieke onboarding,
installer- en platformgedrag, maar package/update productvalidatie moet
Package Acceptance verkiezen.

De canonieke checklist voor update- en Plugin-validatie is
[Updates en plugins testen](/nl/help/testing-updates-plugins). Gebruik deze bij het
bepalen welke lokale, Docker-, pakketacceptatie- of releasecheck-lane een
Plugin-installatie/-update, doctor-opschoning of migratiewijziging voor een
gepubliceerd pakket bewijst. Uitputtende gepubliceerde updatemigratie vanaf elk
stabiel `2026.4.23+`-pakket is een afzonderlijke handmatige `Update Migration`-workflow,
geen onderdeel van Full Release CI.

Legacy-tolerantie voor pakketacceptatie is bewust tijdgebonden. Pakketten tot en met
`2026.4.25` mogen het compatibiliteitspad gebruiken voor metadatagaten die al naar
npm zijn gepubliceerd: privé QA-inventarisvermeldingen die ontbreken in de tarball, ontbrekende
`gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide git-
fixture, ontbrekende blijvende `update.channel`, legacy-locaties voor Plugin-installatierecords,
ontbrekende persistentie van marketplace-installatierecords, en migratie van configuratiemetadata
tijdens `plugins update`. Het gepubliceerde `2026.4.26`-pakket mag waarschuwen
voor lokale build-metadatastempelbestanden die al zijn geleverd. Latere pakketten
moeten aan de moderne pakketcontracten voldoen; diezelfde gaten laten release-
validatie mislukken.

Gebruik bredere pakketacceptatieprofielen wanneer de releasevraag over een
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

- `smoke`: snelle pakketinstallatie-/kanaal-/agent-, Gateway-netwerk- en config-
  reload-lanes
- `package`: install/update/restart/Plugin-pakketcontracten plus live ClawHub
  Skills-installatiebewijs; dit is de standaard voor releasechecks
- `product`: `package` plus MCP-kanalen, cron/subagent-opschoning, OpenAI-webzoekopdracht
  en OpenWebUI
- `full`: Docker-releasepad-chunks met OpenWebUI
- `custom`: exacte `docker_lanes`-lijst voor gerichte herhalingen

Schakel voor Telegram-bewijs van pakketkandidaten `telegram_mode=mock-openai` of
`telegram_mode=live-frontier` in op pakketacceptatie. De workflow geeft de
opgeloste `package-under-test`-tarball door aan de Telegram-lane; de zelfstandige
Telegram-workflow accepteert nog steeds een gepubliceerde npm-specificatie voor checks na publicatie.

## Releasepublicatie-automatisering

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

Voorbeeld van beta-publicatie:

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

Gebruik de lagere `Plugin NPM Release`- en `Plugin ClawHub Release`-workflows
alleen voor gericht herstel- of herpublicatiewerk. Geef voor herstel van een geselecteerde Plugin
`plugin_publish_scope=selected` en `plugins=@openclaw/name` door aan
`OpenClaw Release Publish`, of dispatch de child-workflow rechtstreeks wanneer het
OpenClaw-pakket niet mag worden gepubliceerd.

## NPM-workflowinvoer

`OpenClaw NPM Release` accepteert deze door operators beheerde invoer:

- `tag`: vereiste releasetag zoals `v2026.4.2`, `v2026.4.2-1` of
  `v2026.4.2-beta.1`; wanneer `preflight_only=true`, mag dit ook de huidige
  volledige 40-tekens commit-SHA van de workflowbranch zijn voor alleen validatie
  tijdens preflight
- `preflight_only`: `true` voor alleen validatie/build/package, `false` voor het
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
- `publish_openclaw_npm`: standaard `true`; zet op `false` alleen wanneer de
  workflow als herstelorchestrator alleen voor plugins wordt gebruikt

`OpenClaw Release Checks` accepteert deze door operators beheerde invoer:

- `ref`: branch, tag of volledige commit-SHA om te valideren. Checks met secrets
  vereisen dat de opgeloste commit bereikbaar is vanaf een OpenClaw-branch of
  releasetag.
- `run_release_soak`: kies expliciet voor uitputtende live/E2E-, Docker-releasepad- en
  all-since upgrade-survivor-soak op stabiele/standaard releasechecks. Dit wordt
  afgedwongen door `release_profile=full`.

Regels:

- Stabiele en correctietags mogen naar `beta` of `latest` publiceren
- Beta-prereleasetags mogen alleen naar `beta` publiceren
- Voor `OpenClaw NPM Release` is invoer met volledige commit-SHA alleen toegestaan wanneer
  `preflight_only=true`
- `OpenClaw Release Checks` en `Full Release Validation` zijn altijd
  alleen validatie
- Het echte publicatiepad moet dezelfde `npm_dist_tag` gebruiken als tijdens preflight;
  de workflow controleert die metadata voordat publicatie doorgaat

## Stabiele npm-releasereeks

Bij het maken van een stabiele npm-release:

1. Voer `OpenClaw NPM Release` uit met `preflight_only=true`
   - Voordat er een tag bestaat, mag je de huidige volledige commit-SHA van de workflowbranch
     gebruiken voor een validatie-only dry run van de preflight-workflow
2. Kies `npm_dist_tag=beta` voor de normale beta-first-flow, of alleen `latest`
   wanneer je bewust direct stabiel wilt publiceren
3. Voer `Full Release Validation` uit op de releasebranch, releasetag of volledige
   commit-SHA wanneer je normale CI plus live promptcache, Docker, QA Lab,
   Matrix en Telegram-dekking vanuit één handmatige workflow wilt
4. Als je bewust alleen de deterministische normale testgraaf nodig hebt, voer dan in plaats daarvan
   de handmatige `CI`-workflow uit op de releaseref
5. Sla de succesvolle `preflight_run_id` op
6. Voer `OpenClaw Release Publish` uit met dezelfde `tag`, dezelfde `npm_dist_tag`
   en de opgeslagen `preflight_run_id`; deze publiceert geëxternaliseerde plugins naar npm
   en ClawHub voordat het OpenClaw-npm-pakket wordt gepromoot
7. Als de release op `beta` is geland, gebruik dan de privé
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`-
   workflow om die stabiele versie van `beta` naar `latest` te promoveren
8. Als de release bewust direct naar `latest` is gepubliceerd en `beta`
   onmiddellijk dezelfde stabiele build moet volgen, gebruik dan dezelfde privé-
   workflow om beide dist-tags naar de stabiele versie te laten wijzen, of laat de geplande
   self-healing-sync `beta` later verplaatsen

De dist-tag-mutatie bevindt zich in de privérepo om veiligheidsredenen, omdat deze nog steeds
`NPM_TOKEN` vereist, terwijl de publieke repo OIDC-only-publicatie behoudt.

Dat houdt zowel het directe publicatiepad als het beta-first-promotiepad
gedocumenteerd en zichtbaar voor operators.

Als een maintainer moet terugvallen op lokale npm-authenticatie, voer dan alle 1Password
CLI- (`op`) opdrachten alleen uit binnen een toegewezen tmux-sessie. Roep `op`
niet rechtstreeks aan vanuit de hoofd-agent-shell; door het binnen tmux te houden, blijven prompts,
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

Maintainers gebruiken de privé-releasedocumentatie in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
voor het daadwerkelijke runbook.

## Gerelateerd

- [Releasekanalen](/nl/install/development-channels)
