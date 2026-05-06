---
read_when:
    - Zoeken naar definities van openbare releasekanalen
    - Releasevalidatie of pakketacceptatie uitvoeren
    - Op zoek naar versienaamgeving en cadans
summary: Releasebanen, operatorchecklist, validatieboxen, versienaamgeving en cadans
title: Releasebeleid
x-i18n:
    generated_at: "2026-05-06T11:28:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw heeft drie openbare releasekanalen:

- stable: getagde releases die standaard naar npm `beta` publiceren, of naar npm `latest` wanneer dat expliciet wordt gevraagd
- beta: prerelease-tags die naar npm `beta` publiceren
- dev: de bewegende head van `main`

## Versienaamgeving

- Versie van stabiele release: `YYYY.M.D`
  - Git-tag: `vYYYY.M.D`
- Versie van stabiele correctierelease: `YYYY.M.D-N`
  - Git-tag: `vYYYY.M.D-N`
- Versie van beta-prerelease: `YYYY.M.D-beta.N`
  - Git-tag: `vYYYY.M.D-beta.N`
- Gebruik geen voorloopnul voor maand of dag
- `latest` betekent de huidige gepromote stabiele npm-release
- `beta` betekent het huidige beta-installatiedoel
- Stabiele en stabiele correctiereleases publiceren standaard naar npm `beta`; releasebeheerders kunnen expliciet `latest` als doel kiezen, of later een gecontroleerde beta-build promoveren
- Elke stabiele OpenClaw-release levert het npm-pakket en de macOS-app samen;
  beta-releases valideren en publiceren normaal eerst het npm-/pakketpad, waarbij
  het bouwen/ondertekenen/notariseren van de mac-app voor stable is gereserveerd tenzij expliciet gevraagd

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

## Checklist voor releasebeheerders

Deze checklist is de openbare vorm van de releaseflow. Privé-referenties,
ondertekening, notarisatie, herstel van dist-tags en details voor noodrollback blijven in
het release-runbook dat alleen voor maintainers is.

1. Begin vanaf de huidige `main`: haal de nieuwste wijzigingen op, bevestig dat de doelcommit is gepusht,
   en bevestig dat de huidige `main`-CI groen genoeg is om daarvan te branchen.
2. Herschrijf de bovenste sectie van `CHANGELOG.md` vanuit echte commitgeschiedenis met
   `/changelog`, houd vermeldingen gebruikersgericht, commit dit, push dit, en rebase/pull
   nog een keer voordat je brancht.
3. Controleer releasecompatibiliteitsrecords in
   `src/plugins/compat/registry.ts` en
   `src/commands/doctor/shared/deprecation-compat.ts`. Verwijder verlopen
   compatibiliteit alleen wanneer het upgradepad gedekt blijft, of leg vast waarom deze
   bewust wordt behouden.
4. Maak `release/YYYY.M.D` vanaf de huidige `main`; doe normaal releasewerk niet
   rechtstreeks op `main`.
5. Verhoog elke vereiste versielocatie voor de beoogde tag, voer
   `pnpm plugins:sync` uit zodat publiceerbare Plugin-pakketten de releaseversie
   en compatibiliteitsmetadata delen, en voer daarna de lokale deterministische preflight uit:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, en
   `pnpm release:check`.
6. Voer `OpenClaw NPM Release` uit met `preflight_only=true`. Voordat er een tag bestaat,
   is een volledige release-branch-SHA van 40 tekens toegestaan voor validatie-alleen
   preflight. Bewaar de succesvolle `preflight_run_id`.
7. Start alle prereleasetests met `Full Release Validation` voor de
   releasebranch, tag of volledige commit-SHA. Dit is het enige handmatige toegangspunt
   voor de vier grote release-testboxen: Vitest, Docker, QA Lab en Package.
8. Als validatie faalt, fix dit op de releasebranch en voer opnieuw het kleinste gefaalde
   bestand, de kleinste lane, workflowtaak, pakketprofiel, provider of model-allowlist uit die
   de fix bewijst. Voer de volledige umbrella alleen opnieuw uit wanneer het gewijzigde oppervlak
   eerder bewijs achterhaald maakt.
9. Voor beta: tag `vYYYY.M.D-beta.N` en voer daarna `OpenClaw Release Publish` uit vanaf
   de overeenkomende `release/YYYY.M.D`-branch. Dit verifieert `pnpm plugins:sync:check`,
   dispatcht alle publiceerbare Plugin-pakketten parallel naar npm en dezelfde set naar
   ClawHub, en promoveert daarna het voorbereide OpenClaw npm-preflightartefact
   met de overeenkomende dist-tag zodra publicatie van Plugin-pakketten naar npm slaagt.
   Publicatie naar ClawHub kan nog lopen terwijl OpenClaw naar npm publiceert, maar de
   release-publicatieworkflow eindigt pas nadat beide Plugin-publicatiepaden en
   het OpenClaw npm-publicatiepad succesvol zijn voltooid. Voer na publicatie
   de post-publicatiepakketacceptatie uit tegen het gepubliceerde
   `openclaw@YYYY.M.D-beta.N`- of `openclaw@beta`-pakket. Als een gepushte of gepubliceerde prerelease een fix nodig heeft,
   maak dan het volgende overeenkomende prereleasenummer; verwijder of herschrijf de oude
   prerelease niet.
10. Voor stable: ga alleen verder nadat de gecontroleerde beta of release candidate over het
    vereiste validatiebewijs beschikt. Stable-publicatie naar npm verloopt ook via
    `OpenClaw Release Publish`, waarbij het succesvolle preflightartefact wordt hergebruikt via
    `preflight_run_id`; gereedheid voor een stabiele macOS-release vereist ook de
    verpakte `.zip`, `.dmg`, `.dSYM.zip` en bijgewerkte `appcast.xml` op `main`.
11. Voer na publicatie de npm-post-publicatieverifier uit, optioneel de zelfstandige
    gepubliceerde-npm Telegram E2E wanneer je kanaalbewijs na publicatie nodig hebt,
    dist-tagpromotie wanneer nodig, GitHub-release-/prereleasenotities vanuit de
    volledige overeenkomende `CHANGELOG.md`-sectie, en de stappen voor de releaseaankondiging.

## Release-preflight

- Voer `pnpm check:test-types` uit vóór de release-preflight, zodat test-TypeScript
  gedekt blijft buiten de snellere lokale `pnpm check`-gate
- Voer `pnpm check:architecture` uit vóór de release-preflight, zodat de bredere
  controles op importcycli en architectuurgrenzen groen zijn buiten de snellere lokale gate
- Voer `pnpm build && pnpm ui:build` uit vóór `pnpm release:check`, zodat de verwachte
  `dist/*`-releaseartefacten en de Control UI-bundel bestaan voor de
  pack-validatiestap
- Voer `pnpm plugins:sync` uit na de root-versiebump en vóór het taggen. Het
  werkt publiceerbare versies van Plugin-pakketten, OpenClaw peer/API-compatibiliteitsmetadata,
  buildmetadata en Plugin-changelogstubs bij zodat ze overeenkomen met de core
  releaseversie. `pnpm plugins:sync:check` is de niet-muterenede releasewacht;
  de publicatieworkflow faalt vóór enige registry-mutatie als deze stap is
  vergeten.
- Voer de handmatige `Full Release Validation`-workflow uit vóór releasegoedkeuring om
  alle pre-release testboxes vanuit één entrypoint te starten. Deze accepteert een branch,
  tag of volledige commit-SHA, dispatcht handmatige `CI`, en dispatcht
  `OpenClaw Release Checks` voor installatiesmoke, pakketacceptatie, cross-OS
  pakketcontroles, QA Lab-pariteit, Matrix- en Telegram-lanes. Stabiele/standaardruns
  houden uitgebreide live/E2E- en Docker release-path soak achter
  `run_release_soak=true`; `release_profile=full` forceert soak. Met
  `release_profile=full` en `rerun_group=all` voert deze ook pakket-Telegram
  E2E uit tegen het `release-package-under-test`-artefact uit releasecontroles.
  Geef `npm_telegram_package_spec` op na publicatie wanneer dezelfde
  Telegram E2E ook het gepubliceerde npm-pakket moet bewijzen. Geef
  `package_acceptance_package_spec` op na publicatie wanneer Package Acceptance
  zijn pakket/update-matrix moet uitvoeren tegen het verzonden npm-pakket in plaats
  van het uit SHA gebouwde artefact. Geef
  `evidence_package_spec` op wanneer het privé-bewijsrapport moet aantonen dat de
  validatie overeenkomt met een gepubliceerd npm-pakket zonder Telegram E2E te forceren.
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
  tarball, en kan Telegram QA tegen dezelfde tarball uitvoeren met
  `telegram_mode=mock-openai` of `telegram_mode=live-frontier`. Wanneer de
  geselecteerde Docker-lanes `published-upgrade-survivor` bevatten, is het
  pakketartefact de kandidaat en selecteert `published_upgrade_survivor_baseline`
  de gepubliceerde baseline. `update-restart-auth` gebruikt het kandidaatpakket als
  zowel de geïnstalleerde CLI als het package-under-test, zodat het het managed
  restart-pad van de updateopdracht van de kandidaat test.
  Voorbeeld: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Veelgebruikte profielen:
  - `smoke`: install/channel/agent-, Gateway-netwerk- en config-herlaadlanes
  - `package`: artefact-native pakket/update/herstart/Plugin-lanes zonder OpenWebUI of live ClawHub
  - `product`: pakketprofiel plus MCP-kanalen, cron/subagent-opruiming,
    OpenAI-webzoekfunctie en OpenWebUI
  - `full`: Docker release-path-chunks met OpenWebUI
  - `custom`: exacte `docker_lanes`-selectie voor een gerichte rerun
- Voer de handmatige `CI`-workflow rechtstreeks uit wanneer je alleen volledige normale CI
  dekking nodig hebt voor de releasekandidaat. Handmatige CI-dispatches omzeilen changed
  scoping en forceren de Linux Node-shards, gebundelde-Plugin-shards, channel
  contracts, Node 22-compatibiliteit, `check`, `check-additional`, build smoke,
  docs-controles, Python Skills, Windows, macOS, Android en Control UI i18n
  lanes.
  Voorbeeld: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Voer `pnpm qa:otel:smoke` uit bij het valideren van releasetelemetrie. Het oefent
  QA-lab via een lokale OTLP/HTTP-ontvanger en verifieert de geëxporteerde trace
  span-namen, begrensde attributen en redactie van inhoud/identificatoren zonder
  Opik, Langfuse of een andere externe collector te vereisen.
- Voer `pnpm release:check` uit vóór elke getagde release
- Voer `OpenClaw Release Publish` uit voor de muterende publicatiereeks nadat de
  tag bestaat. Dispatch deze vanaf `release/YYYY.M.D` (of `main` wanneer je een
  vanaf main bereikbare tag publiceert), geef de releasetag en succesvolle OpenClaw npm
  `preflight_run_id` door, en behoud de standaard Plugin-publicatiescope
  `all-publishable`, tenzij je doelbewust een gerichte reparatie uitvoert. De
  workflow serialiseert Plugin npm publish, Plugin ClawHub publish en OpenClaw
  npm publish, zodat het corepakket niet wordt gepubliceerd vóór de geëxternaliseerde
  plugins.
- Releasecontroles draaien nu in een aparte handmatige workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` draait ook de QA Lab mock parity-lane plus het snelle
  live Matrix-profiel en de Telegram QA-lane vóór releasegoedkeuring. De live
  lanes gebruiken de `qa-live-shared`-omgeving; Telegram gebruikt ook Convex CI
  credential-leases. Voer de handmatige `QA-Lab - All Lanes`-workflow uit met
  `matrix_profile=all` en `matrix_shards=true` wanneer je volledige Matrix
  transport-, media- en E2EE-inventaris parallel wilt.
- Cross-OS installatie- en upgrade-runtimevalidatie is onderdeel van publieke
  `OpenClaw Release Checks` en `Full Release Validation`, die de herbruikbare workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` rechtstreeks aanroepen
- Deze splitsing is opzettelijk: houd het echte npm-releasepad kort,
  deterministisch en artefactgericht, terwijl langzamere livecontroles in hun
  eigen lane blijven zodat ze publicatie niet vertragen of blokkeren
- Secret-dragende releasecontroles moeten worden gedispatcht via `Full Release
Validation` of vanuit de `main`/release-workflowref zodat workflowlogica en
  secrets gecontroleerd blijven
- `OpenClaw Release Checks` accepteert een branch, tag of volledige commit-SHA zolang
  de herleide commit bereikbaar is vanaf een OpenClaw-branch of releasetag
- `OpenClaw NPM Release` validation-only preflight accepteert ook de huidige
  volledige 40-teken workflow-branch commit-SHA zonder een gepushte tag te vereisen
- Dat SHA-pad is alleen voor validatie en kan niet worden gepromoveerd naar een echte publicatie
- In SHA-modus synthetiseert de workflow `v<package.json version>` alleen voor de
  pakketmetadata-controle; echte publicatie vereist nog steeds een echte releasetag
- Beide workflows houden het echte publicatie- en promotiepad op GitHub-hosted
  runners, terwijl het niet-muterende validatiepad de grotere
  Blacksmith Linux-runners kan gebruiken
- Die workflow draait
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  met zowel `OPENAI_API_KEY` als `ANTHROPIC_API_KEY` workflowsecrets
- npm-releasepreflight wacht niet langer op de aparte releasecontroles-lane
- Voer `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (of de overeenkomende beta/correction-tag) uit vóór goedkeuring
- Voer na npm-publicatie
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (of de overeenkomende beta/correction-versie) uit om het gepubliceerde registry
  installatiepad in een verse tijdelijke prefix te verifiëren
- Voer na een betapublicatie `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  uit om installed-package onboarding, Telegram-installatie en echte Telegram E2E
  tegen het gepubliceerde npm-pakket te verifiëren met de gedeelde leased Telegram credential
  pool. Lokale maintainer-eenmalige runs mogen de Convex-vars weglaten en de drie
  `OPENCLAW_QA_TELEGRAM_*` env-credentials rechtstreeks doorgeven.
- Om de volledige post-publish beta smoke vanaf een maintainer-machine te draaien, gebruik `pnpm release:beta-smoke -- --beta betaN`. De helper draait Parallels npm update/fresh-target-validatie, dispatcht `NPM Telegram Beta E2E`, pollt de exacte workflow-run, downloadt het artefact en print het Telegram-rapport.
- Maintainers kunnen dezelfde post-publish-controle vanuit GitHub Actions uitvoeren via de
  handmatige `NPM Telegram Beta E2E`-workflow. Deze is bewust alleen handmatig en
  draait niet bij elke merge.
- Maintainer-releaseautomatisering gebruikt nu preflight-then-promote:
  - echte npm-publicatie moet een succesvolle npm `preflight_run_id` hebben
  - de echte npm-publicatie moet worden gedispatcht vanaf dezelfde `main`- of
    `release/YYYY.M.D`-branch als de succesvolle preflight-run
  - stabiele npm-releases gebruiken standaard `beta`
  - stabiele npm-publicatie kan expliciet op `latest` mikken via workflowinput
  - token-gebaseerde npm dist-tag-mutatie bevindt zich nu in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    voor beveiliging, omdat `npm dist-tag add` nog steeds `NPM_TOKEN` nodig heeft terwijl de
    publieke repo OIDC-only publicatie behoudt
  - publieke `macOS Release` is alleen validatie; wanneer een tag alleen op een
    releasebranch staat maar de workflow vanaf `main` wordt gedispatcht, stel
    `public_release_branch=release/YYYY.M.D` in
  - echte privé mac-publicatie moet succesvolle privé mac
    `preflight_run_id` en `validate_run_id` hebben
  - de echte publicatiepaden promoveren voorbereide artefacten in plaats van
    ze opnieuw te bouwen
- Voor stabiele correctiereleases zoals `YYYY.M.D-N` controleert de post-publish verifier
  ook hetzelfde temp-prefix upgradepad van `YYYY.M.D` naar `YYYY.M.D-N`,
  zodat releasecorrecties oudere globale installaties niet stilzwijgend op de
  basisstabiele payload kunnen laten staan
- npm-releasepreflight faalt gesloten tenzij de tarball zowel
  `dist/control-ui/index.html` als een niet-lege `dist/control-ui/assets/` payload bevat,
  zodat we niet opnieuw een leeg browserdashboard verzenden
- Post-publish-verificatie controleert ook dat gepubliceerde Plugin-entrypoints en
  pakketmetadata aanwezig zijn in de geïnstalleerde registry-layout. Een release die
  ontbrekende Plugin-runtimepayloads verzendt faalt de postpublish verifier en
  kan niet naar `latest` worden gepromoveerd.
- `pnpm test:install:smoke` dwingt ook het npm pack `unpackedSize`-budget af op
  de kandidaat-updatetarball, zodat installer-e2e onbedoelde pack-bloat opvangt
  vóór het release-publicatiepad
- Als het releasewerk CI-planning, extensietimingmanifests of
  extensietestmatrices raakte, regenereer en review dan de door de planner beheerde
  `plugin-prerelease-extension-shard` matrix-outputs uit
  `.github/workflows/plugin-prerelease.yml` vóór goedkeuring, zodat releasenotes geen
  verouderde CI-layout beschrijven
- Gereedheid voor stabiele macOS-release omvat ook de updater-oppervlakken:
  - de GitHub-release moet eindigen met de verpakte `.zip`, `.dmg` en `.dSYM.zip`
  - `appcast.xml` op `main` moet na publicatie naar de nieuwe stabiele zip wijzen
  - de verpakte app moet een niet-debug bundle-id behouden, een niet-lege Sparkle-feed
    URL, en een `CFBundleVersion` op of boven de canonieke Sparkle-buildvloer
    voor die releaseversie

## Release testboxes

`Full Release Validation` is hoe operators alle pre-release tests vanuit één
entrypoint starten. Voor bewijs van een gepinde commit op een snel bewegende branch gebruik je de
helper zodat elke child-workflow draait vanaf een tijdelijke branch die is vastgezet op de doel-
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

De helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation`
vanaf die branch met `ref=<sha>`, verifieert dat elke child-workflow `headSha`
overeenkomt met het doel, en verwijdert daarna de tijdelijke branch. Dit voorkomt dat je per ongeluk een
nieuwere `main` child-run bewijst.

Voor validatie van een releasebranch of tag draai je dit vanaf de vertrouwde `main` workflow-
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

De workflow lost de doel-ref op, start handmatige `CI` met
`target_ref=<release-ref>`, start `OpenClaw Release Checks`, bereidt een
bovenliggend `release-package-under-test`-artifact voor pakketgerichte controles voor, en
start zelfstandige pakket-Telegram-E2E wanneer `release_profile=full` is met
`rerun_group=all` of wanneer `npm_telegram_package_spec` is ingesteld. `OpenClaw Release
Checks` waaiert daarna uit naar installatierooktests, cross-OS-releasecontroles, live/E2E-Docker
release-paddekking wanneer soak is ingeschakeld, Package Acceptance met Telegram
pakket-QA, QA Lab-pariteit, live Matrix en live Telegram. Een volledige run is alleen acceptabel wanneer de
`Full Release Validation`-
samenvatting `normal_ci` en `release_checks` als geslaagd toont. In full/all-modus
moet de `npm_telegram`-child ook geslaagd zijn; buiten full/all wordt deze overgeslagen,
tenzij een gepubliceerde `npm_telegram_package_spec` is opgegeven. De uiteindelijke
verificatiesamenvatting bevat tabellen met traagste jobs voor elke child-run, zodat de releasemanager
het huidige kritieke pad kan zien zonder logs te downloaden.
Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
complete fasematrix, exacte workflow-jobnamen, verschillen tussen stabiel en volledig profiel,
artifacts en gerichte rerun-handles.
Child-workflows worden gestart vanaf de vertrouwde ref die `Full Release
Validation` uitvoert, normaal `--ref main`, zelfs wanneer de doel-`ref` naar een
oudere releasetak of tag wijst. Er is geen aparte Full Release Validation
workflow-ref-invoer; kies de vertrouwde harness door de workflow-run-ref te kiezen.
Gebruik `--ref main -f ref=<sha>` niet voor exact commitbewijs op bewegende `main`;
ruwe commit-SHA's kunnen geen workflow-dispatch-refs zijn, dus gebruik
`pnpm ci:full-release --sha <sha>` om de vastgezette tijdelijke tak te maken.

Gebruik `release_profile` om live/provider-breedte te selecteren:

- `minimum`: snelste release-kritieke OpenAI/core live- en Docker-pad
- `stable`: minimum plus stabiele provider/backend-dekking voor releasegoedkeuring
- `full`: stable plus brede adviserende provider/media-dekking

Gebruik `run_release_soak=true` met `stable` wanneer de release-blokkerende lanes
groen zijn en je de uitputtende live/E2E-, Docker-releasepad- en
begrensde gepubliceerde upgrade-survivor-sweep wilt vóór promotie. Die sweep dekt
de nieuwste vier stabiele pakketten plus vastgezette `2026.4.23`- en `2026.5.2`-
baselines plus oudere `2026.4.15`-dekking, met dubbele baselines verwijderd en
elke baseline verdeeld in een eigen Docker-runner-job. `full` impliceert
`run_release_soak=true`.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de doel-ref
eenmaal als `release-package-under-test` op te lossen en hergebruikt dat artifact in cross-OS,
Package Acceptance en release-pad-Docker-controles wanneer soak draait. Dit houdt
alle pakketgerichte boxes op dezelfde bytes en voorkomt herhaalde pakketbuilds.
De cross-OS OpenAI-installatierooktest gebruikt `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer de
repo/org-variabele is ingesteld, anders `openai/gpt-5.4`, omdat deze lane
pakketinstallatie, onboarding, Gateway-start en één live agentbeurt bewijst
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
provider of QA-lane voor het volgende bewijs. Run de volledige umbrella pas opnieuw wanneer
de fix gedeelde release-orchestratie heeft gewijzigd of eerder all-box-bewijs
verouderd heeft gemaakt. De uiteindelijke verifier van de umbrella controleert de geregistreerde child-workflow-run-
ids opnieuw, dus nadat een child-workflow succesvol opnieuw is uitgevoerd, rerun alleen de mislukte
bovenliggende `Verify full validation`-job.

Geef voor begrensd herstel `rerun_group` door aan de umbrella. `all` is de echte
releasecandidate-run, `ci` voert alleen de normale CI-child uit, `plugin-prerelease`
voert alleen de release-only Plugin-child uit, `release-checks` voert elke release-
box uit, en de smallere releasegroepen zijn `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` en `npm-telegram`.
Gerichte `npm-telegram`-reruns vereisen `npm_telegram_package_spec`; full/all-runs
met `release_profile=full` gebruiken het release-checks-pakketartifact. Gerichte
cross-OS-reruns kunnen `cross_os_suite_filter=windows/packaged-upgrade` of
een ander OS/suite-filter toevoegen. QA-release-check-fouten zijn adviserend; een QA-only-
fout blokkeert releasevalidatie niet.

### Vitest

De Vitest-box is de handmatige `CI`-child-workflow. Handmatige CI omzeilt bewust
changed-scoping en forceert de normale testgrafiek voor de releasecandidate:
Linux Node-shards, bundled-Plugin-shards, kanaalcontracten, Node 22-
compatibiliteit, `check`, `check-additional`, buildrooktest, docscontroles, Python-
Skills, Windows, macOS, Android en Control UI i18n.

Gebruik deze box om te beantwoorden: "is de bronboom geslaagd voor de volledige normale testsuite?"
Dit is niet hetzelfde als productvalidatie van het releasepad. Bewijs om te bewaren:

- `Full Release Validation`-samenvatting met de gestarte `CI`-run-URL
- `CI`-run groen op de exacte doel-SHA
- mislukte of trage shardnamen uit de CI-jobs bij het onderzoeken van regressies
- Vitest-timingartifacts zoals `.artifacts/vitest-shard-timings.json` wanneer
  een run prestatieanalyse nodig heeft

Run handmatige CI direct alleen wanneer de release deterministische normale CI nodig heeft maar
niet de Docker-, QA Lab-, live-, cross-OS- of pakket-boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

De Docker-box bevindt zich in `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus de release-mode
`install-smoke`-workflow. Deze valideert de releasecandidate via verpakte
Docker-omgevingen in plaats van alleen tests op bronniveau.

Release-Docker-dekking omvat:

- volledige installatierooktest met de trage Bun globale installatierooktest ingeschakeld
- root-Dockerfile-rooktestimagevoorbereiding/hergebruik per doel-SHA, met QR-,
  root/Gateway- en installer/Bun-rooktestjobs die als afzonderlijke install-smoke-
  shards draaien
- repository-E2E-lanes
- release-pad-Docker-chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` en `plugins-runtime-install-h`
- OpenWebUI-dekking binnen de `plugins-runtime-services`-chunk wanneer gevraagd
- gesplitste bundled-Plugin-install/uninstall-lanes
  `bundled-plugin-install-uninstall-0` tot en met
  `bundled-plugin-install-uninstall-23`
- live/E2E-provider-suites en Docker live-modeldekking wanneer releasecontroles
  live-suites bevatten

Gebruik Docker-artifacts voordat je opnieuw runt. De release-padplanner uploadt
`.artifacts/docker-tests/` met lane-logs, `summary.json`, `failures.json`,
fasetimings, plannerplan-JSON en rerun-commando's. Gebruik voor gericht herstel
`docker_lanes=<lane[,lane]>` op de herbruikbare live/E2E-workflow in plaats van
alle releasechunks opnieuw te runnen. Gegenereerde rerun-commando's bevatten eerdere
`package_artifact_run_id` en voorbereide Docker-image-invoer wanneer beschikbaar, zodat een
mislukte lane dezelfde tarball en GHCR-images kan hergebruiken.

### QA Lab

De QA Lab-box maakt ook deel uit van `OpenClaw Release Checks`. Het is de agentic
gedrags- en kanaalreleasegate, gescheiden van Vitest- en Docker-
pakketmechanica.

Release-QA Lab-dekking omvat:

- mock-pariteitslane die de OpenAI-candidatelane vergelijkt met de Opus 4.6-
  baseline met behulp van het agentic parity pack
- snel live Matrix-QA-profiel met de `qa-live-shared`-omgeving
- live Telegram-QA-lane met Convex CI-credentialleases
- `pnpm qa:otel:smoke` wanneer releasetelemetrie expliciet lokaal bewijs nodig heeft

Gebruik deze box om te beantwoorden: "gedraagt de release zich correct in QA-scenario's en
live kanaalstromen?" Bewaar de artifact-URL's voor pariteit-, Matrix- en Telegram-
lanes bij het goedkeuren van de release. Volledige Matrix-dekking blijft beschikbaar als een
handmatige gesharde QA-Lab-run in plaats van de standaard release-kritieke lane.

### Pakket

De Pakket-box is de gate voor het installeerbare product. Deze wordt ondersteund door
`Package Acceptance` en de resolver
`scripts/resolve-openclaw-package-candidate.mjs`. De resolver normaliseert een
candidate naar de `package-under-test`-tarball die door Docker E2E wordt gebruikt, valideert
de pakketinventaris, registreert de pakketversie en SHA-256, en houdt de
workflow-harness-ref gescheiden van de pakketbron-ref.

Ondersteunde candidate-bronnen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-release-
  versie
- `source=ref`: pack een vertrouwde `package_ref`-tak, tag of volledige commit-SHA
  met de geselecteerde `workflow_ref`-harness
- `source=url`: download een HTTPS-`.tgz` met vereiste `package_sha256`
- `source=artifact`: hergebruik een `.tgz` geüpload door een andere GitHub Actions-run

`OpenClaw Release Checks` voert Package Acceptance uit met `source=artifact`, het
voorbereide releasepakketartifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance houdt migratie, update,
geconfigureerde-auth update restart, cleanup van oude Plugin-afhankelijkheden, offline Plugin-
fixtures, Plugin-update en Telegram-pakket-QA tegen dezelfde opgeloste
tarball. Blokkerende releasecontroles gebruiken de standaard nieuwste gepubliceerde pakket-
baseline; `run_release_soak=true` of
`release_profile=full` breidt uit naar elke stabiele npm-gepubliceerde baseline van
`2026.4.23` tot en met `latest` plus gemelde-issue-fixtures. Gebruik
Package Acceptance met `source=npm` voor een al verzonden candidate, of
`source=ref`/`source=artifact` voor een SHA-onderbouwde lokale npm-tarball vóór
publicatie. Het is de GitHub-native
vervanging voor de meeste pakket/update-dekking die eerder Parallels vereiste.
Cross-OS-releasecontroles blijven belangrijk voor OS-specifieke onboarding,
installer- en platformgedrag, maar pakket/update-productvalidatie zou
Package Acceptance moeten verkiezen.

De canonieke checklist voor update- en Plugin-validatie is
[Updates en plugins testen](/nl/help/testing-updates-plugins). Gebruik deze wanneer je
bepaalt welke lokale, Docker-, Package Acceptance- of release-check-lane een
Plugin-install/update, doctor-cleanup of gepubliceerde-pakketmigratiewijziging bewijst.
Uitputtende gepubliceerde update-migratie vanaf elk stabiel `2026.4.23+`-pakket is
een aparte handmatige `Update Migration`-workflow, geen onderdeel van Full Release CI.

Legacy coulance in packageacceptatie is bewust tijdelijk begrensd. Pakketten tot en met
`2026.4.25` mogen het compatibiliteitspad gebruiken voor metadatahiaten die al
naar npm zijn gepubliceerd: privé-QA-inventarisitems die ontbreken in de tarball, ontbrekende
`gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide git-
fixture, ontbrekende blijvende `update.channel`, legacy install-recordlocaties voor Plugins,
ontbrekende persistentie van marketplace-install-records en migratie van configmetadata
tijdens `plugins update`. Het gepubliceerde pakket `2026.4.26` mag waarschuwen
voor lokale buildmetadata-stempelbestanden die al waren meegeleverd. Latere pakketten
moeten voldoen aan de moderne pakketcontracten; diezelfde hiaten laten releasevalidatie
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

Veelgebruikte pakketprofielen:

- `smoke`: snelle lanes voor pakketinstallatie/kanaal/agent, Gateway-netwerk en config
  herladen
- `package`: contracten voor installatie/update/herstart/Plugin-pakket zonder live
  ClawHub; dit is de standaard voor releasechecks
- `product`: `package` plus MCP-kanalen, cron-/subagent-opruiming, OpenAI-web
  zoeken en OpenWebUI
- `full`: Docker-releasepadchunks met OpenWebUI
- `custom`: exacte lijst met `docker_lanes` voor gerichte reruns

Schakel voor pakketkandidaatbewijs met Telegram `telegram_mode=mock-openai` of
`telegram_mode=live-frontier` in op Package Acceptance. De workflow geeft de
opgeloste `package-under-test`-tarball door aan de Telegram-lane; de zelfstandige
Telegram-workflow accepteert nog steeds een gepubliceerde npm-specificatie voor controles na publicatie.

## Automatisering voor releasepublicatie

`OpenClaw Release Publish` is het normale muterende entrypoint voor publicatie. Het
orkestreert de trusted-publisher-workflows in de volgorde die de release nodig heeft:

1. Check de release-tag uit en bepaal de commit-SHA.
2. Controleer of de tag bereikbaar is vanaf `main` of `release/*`.
3. Voer `pnpm plugins:sync:check` uit.
4. Dispatch `Plugin NPM Release` met `publish_scope=all-publishable` en
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` met dezelfde scope en SHA.
6. Dispatch `OpenClaw NPM Release` met de release-tag, npm dist-tag en
   opgeslagen `preflight_run_id`.

Voorbeeld voor bèta-publicatie:

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

Stabiele promotie direct naar `latest` is expliciet:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Gebruik de lager-niveau workflows `Plugin NPM Release` en `Plugin ClawHub Release`
alleen voor gericht herstel- of herpublicatiewerk. Geef voor een geselecteerde Plugin-reparatie
`plugin_publish_scope=selected` en `plugins=@openclaw/name` door aan
`OpenClaw Release Publish`, of dispatch de child-workflow rechtstreeks wanneer het
OpenClaw-pakket niet gepubliceerd mag worden.

## NPM-workflowinvoer

`OpenClaw NPM Release` accepteert deze door operators beheerde invoerwaarden:

- `tag`: vereiste release-tag zoals `v2026.4.2`, `v2026.4.2-1` of
  `v2026.4.2-beta.1`; wanneer `preflight_only=true`, mag dit ook de huidige
  volledige 40-tekens lange workflow-branch-commit-SHA zijn voor een preflight die alleen valideert
- `preflight_only`: `true` alleen voor validatie/build/pakket, `false` voor het
  echte publicatiepad
- `preflight_run_id`: vereist op het echte publicatiepad zodat de workflow de
  voorbereide tarball uit de geslaagde preflight-run hergebruikt
- `npm_dist_tag`: npm-doeltag voor het publicatiepad; standaard `beta`

`OpenClaw Release Publish` accepteert deze door operators beheerde invoerwaarden:

- `tag`: vereiste release-tag; moet al bestaan
- `preflight_run_id`: geslaagde `OpenClaw NPM Release` preflight-run-id;
  vereist wanneer `publish_openclaw_npm=true`
- `npm_dist_tag`: npm-doeltag voor het OpenClaw-pakket
- `plugin_publish_scope`: standaard `all-publishable`; gebruik `selected` alleen
  voor gericht herstelwerk
- `plugins`: door komma's gescheiden `@openclaw/*`-pakketnamen wanneer
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: standaard `true`; zet op `false` alleen wanneer de
  workflow wordt gebruikt als reparatie-orchestrator voor alleen Plugins

`OpenClaw Release Checks` accepteert deze door operators beheerde invoerwaarden:

- `ref`: branch, tag of volledige commit-SHA om te valideren. Checks met secrets
  vereisen dat de opgeloste commit bereikbaar is vanaf een OpenClaw-branch of
  release-tag.
- `run_release_soak`: kies voor uitputtende live/E2E, Docker-releasepad en
  all-since upgrade-survivor soak op stabiele/standaard releasechecks. Dit wordt geforceerd
  ingeschakeld door `release_profile=full`.

Regels:

- Stabiele en correctietags mogen naar `beta` of `latest` publiceren
- Bèta-prerelease-tags mogen alleen naar `beta` publiceren
- Voor `OpenClaw NPM Release` is invoer met volledige commit-SHA alleen toegestaan wanneer
  `preflight_only=true`
- `OpenClaw Release Checks` en `Full Release Validation` zijn altijd
  alleen-validatie
- Het echte publicatiepad moet dezelfde `npm_dist_tag` gebruiken als tijdens preflight;
  de workflow controleert die metadata voordat publicatie doorgaat

## Stabiele npm-releasereeks

Bij het maken van een stabiele npm-release:

1. Voer `OpenClaw NPM Release` uit met `preflight_only=true`
   - Voordat er een tag bestaat, mag je de huidige volledige workflow-branch-commit
     SHA gebruiken voor een validatie-only dry run van de preflight-workflow
2. Kies `npm_dist_tag=beta` voor de normale bèta-eerst-flow, of `latest` alleen
   wanneer je bewust direct stabiel wilt publiceren
3. Voer `Full Release Validation` uit op de release-branch, release-tag of volledige
   commit-SHA wanneer je normale CI plus live prompt cache, Docker, QA Lab,
   Matrix en Telegram-dekking vanuit één handmatige workflow wilt
4. Als je bewust alleen de deterministische normale testgraaf nodig hebt, voer dan in plaats daarvan de
   handmatige `CI`-workflow uit op de release-ref
5. Bewaar de geslaagde `preflight_run_id`
6. Voer `OpenClaw Release Publish` uit met dezelfde `tag`, dezelfde `npm_dist_tag`
   en de opgeslagen `preflight_run_id`; dit publiceert geëxternaliseerde Plugins naar npm
   en ClawHub voordat het OpenClaw-npm-pakket wordt gepromoveerd
7. Als de release op `beta` is geland, gebruik dan de privé
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`-
   workflow om die stabiele versie van `beta` naar `latest` te promoveren
8. Als de release bewust direct naar `latest` is gepubliceerd en `beta`
   onmiddellijk dezelfde stabiele build moet volgen, gebruik dan dezelfde privé
   workflow om beide dist-tags naar de stabiele versie te laten wijzen, of laat de geplande
   zelfherstellende sync `beta` later verplaatsen

De dist-tagmutatie staat om veiligheidsredenen in de privérepo omdat deze nog steeds
`NPM_TOKEN` vereist, terwijl de publieke repo OIDC-only publicatie behoudt.

Dat houdt zowel het directe publicatiepad als het bèta-eerst promotiepad
gedocumenteerd en zichtbaar voor operators.

Als een maintainer moet terugvallen op lokale npm-authenticatie, voer dan alle 1Password
CLI (`op`)-commando's alleen uit binnen een dedicated tmux-sessie. Roep `op` niet
rechtstreeks aan vanuit de hoofd-agent-shell; door het binnen tmux te houden zijn prompts,
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
