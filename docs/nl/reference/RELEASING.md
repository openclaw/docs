---
read_when:
    - Zoeken naar definities van openbare releasekanalen
    - Releasevalidatie of pakketacceptatie uitvoeren
    - Op zoek naar versienaamgeving en ritme
summary: Releasesporen, operatorchecklist, validatieboxen, versienaamgeving en cadans
title: Releasebeleid
x-i18n:
    generated_at: "2026-05-02T23:39:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba316d1736eae8edd2fb0a71b9a3da345f8895c3b536e9a1f619718ea12fc851
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw heeft drie openbare releasekanalen:

- stable: getagde releases die standaard naar npm `beta` publiceren, of naar npm `latest` wanneer dat expliciet wordt aangevraagd
- beta: prerelease-tags die naar npm `beta` publiceren
- dev: de bewegende kop van `main`

## Versienaamgeving

- Stabiele releaseversie: `YYYY.M.D`
  - Git-tag: `vYYYY.M.D`
- Stabiele correctiereleaseversie: `YYYY.M.D-N`
  - Git-tag: `vYYYY.M.D-N`
- Beta-prereleaseversie: `YYYY.M.D-beta.N`
  - Git-tag: `vYYYY.M.D-beta.N`
- Vul maand of dag niet met nullen aan
- `latest` betekent de huidige gepromoveerde stabiele npm-release
- `beta` betekent het huidige beta-installatiedoel
- Stabiele en stabiele correctiereleases publiceren standaard naar npm `beta`; release-operators kunnen expliciet `latest` kiezen, of later een gecontroleerde beta-build promoveren
- Elke stabiele OpenClaw-release levert het npm-pakket en de macOS-app samen;
  beta-releases valideren en publiceren normaal gesproken eerst het npm-/pakketpad, waarbij
  bouwen/ondertekenen/notariseren van de Mac-app voor stabiel is gereserveerd tenzij dit expliciet wordt aangevraagd

## Releasecadans

- Releases gaan eerst via beta
- Stabiel volgt pas nadat de nieuwste beta is gevalideerd
- Maintainers maken releases normaal gesproken vanaf een `release/YYYY.M.D`-branch die is gemaakt
  vanaf de huidige `main`, zodat releasevalidatie en fixes nieuwe
  ontwikkeling op `main` niet blokkeren
- Als een beta-tag is gepusht of gepubliceerd en een fix nodig heeft, maken maintainers
  de volgende `-beta.N`-tag in plaats van de oude beta-tag te verwijderen of opnieuw te maken
- Gedetailleerde releaseprocedure, goedkeuringen, referenties en herstelnotities zijn
  alleen voor maintainers

## Checklist voor release-operator

Deze checklist is de openbare vorm van de releaseflow. Privéreferenties,
ondertekening, notarisatie, dist-tag-herstel en noodrollbackdetails blijven in
het release-runbook dat alleen voor maintainers is.

1. Begin vanaf de huidige `main`: haal de nieuwste wijzigingen op, bevestig dat de doelcommit is gepusht,
   en bevestig dat de huidige `main`-CI groen genoeg is om er een branch van te maken.
2. Herschrijf de bovenste sectie van `CHANGELOG.md` op basis van echte commitgeschiedenis met
   `/changelog`, houd items gebruikersgericht, commit dit, push dit, en rebase/pull
   nog één keer voordat je een branch maakt.
3. Controleer releasecompatibiliteitsrecords in
   `src/plugins/compat/registry.ts` en
   `src/commands/doctor/shared/deprecation-compat.ts`. Verwijder verlopen
   compatibiliteit alleen wanneer het upgradepad gedekt blijft, of leg vast waarom die
   bewust wordt meegenomen.
4. Maak `release/YYYY.M.D` vanaf de huidige `main`; doe normaal releasewerk niet
   rechtstreeks op `main`.
5. Verhoog elke vereiste versielocatie voor de beoogde tag, voer
   `pnpm plugins:sync` uit zodat publiceerbare Plugin-pakketten de releaseversie
   en compatibiliteitsmetadata delen, en voer daarna de lokale deterministische voorcontrole uit:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, en
   `pnpm release:check`.
6. Voer `OpenClaw NPM Release` uit met `preflight_only=true`. Voordat er een tag bestaat,
   is een volledige release-branch-SHA van 40 tekens toegestaan voor alleen-validatie
   van de voorcontrole. Sla de geslaagde `preflight_run_id` op.
7. Start alle pre-releasetests met `Full Release Validation` voor de
   releasebranch, tag of volledige commit-SHA. Dit is het ene handmatige startpunt
   voor de vier grote releasetestboxen: Vitest, Docker, QA Lab en Package.
8. Als validatie mislukt, fix dit op de releasebranch en voer het kleinste mislukte
   bestand, kanaal, workflowjob, pakketprofiel, provider of model-allowlist opnieuw uit dat
   de fix bewijst. Voer de volledige paraplu alleen opnieuw uit wanneer het gewijzigde oppervlak
   eerder bewijs verouderd maakt.
9. Voor beta: tag `vYYYY.M.D-beta.N`, en voer daarna `OpenClaw Release Publish` uit vanaf
   de bijbehorende `release/YYYY.M.D`-branch. Dit verifieert `pnpm plugins:sync:check`,
   publiceert eerst alle publiceerbare Plugin-pakketten naar npm, publiceert dezelfde
   set daarna naar ClawHub, en promoot vervolgens het voorbereide OpenClaw npm-voorcontrole-
   artefact met de bijbehorende dist-tag. Voer na publicatie post-publicatiepakket-
   acceptatie uit tegen het gepubliceerde `openclaw@YYYY.M.D-beta.N`- of
   `openclaw@beta`-pakket. Als een gepushte of gepubliceerde prerelease een fix nodig heeft,
   maak dan het volgende bijbehorende prerelease-nummer; verwijder of herschrijf de oude
   prerelease niet.
10. Voor stabiel: ga alleen verder nadat de gecontroleerde beta of releasekandidaat het
    vereiste validatiebewijs heeft. Stabiele npm-publicatie verloopt ook via
    `OpenClaw Release Publish`, waarbij het geslaagde voorcontrole-artefact opnieuw wordt gebruikt via
    `preflight_run_id`; gereedheid voor stabiele macOS-release vereist ook de
    verpakte `.zip`, `.dmg`, `.dSYM.zip` en bijgewerkte `appcast.xml` op `main`.
11. Voer na publicatie de npm-post-publicatieverificatie uit, optioneel zelfstandige
    gepubliceerde-npm Telegram E2E wanneer je post-publicatiekanaalbewijs nodig hebt,
    dist-tag-promotie wanneer nodig, GitHub-release-/prerelease-notities uit de
    volledige bijbehorende `CHANGELOG.md`-sectie, en de releaseaankondigingsstappen.

## Releasevoorcontrole

- Voer `pnpm check:test-types` uit vóór de release-preflight zodat test-TypeScript
  gedekt blijft buiten de snellere lokale `pnpm check`-gate
- Voer `pnpm check:architecture` uit vóór de release-preflight zodat de bredere
  importcyclus- en architectuurgrenscontroles groen zijn buiten de snellere lokale gate
- Voer `pnpm build && pnpm ui:build` uit vóór `pnpm release:check` zodat de verwachte
  `dist/*`-releaseartefacten en de Control UI-bundel bestaan voor de pack-
  validatiestap
- Voer `pnpm plugins:sync` uit na de root-versiebump en vóór het taggen. Het
  werkt publiceerbare Plugin-pakketversies, OpenClaw peer-/API-compatibiliteits-
  metadata, buildmetadata en Plugin-changelogstubs bij zodat ze overeenkomen met
  de core-releaseversie. `pnpm plugins:sync:check` is de niet-muteren­de releaseguard;
  de publicatieworkflow faalt vóór enige registry-mutatie als deze stap is
  vergeten.
- Voer de handmatige `Full Release Validation`-workflow uit vóór releasegoedkeuring om
  alle pre-releasetestboxen vanuit één ingangspunt te starten. Deze accepteert een branch,
  tag of volledige commit-SHA, dispatcht handmatige `CI`, en dispatcht
  `OpenClaw Release Checks` voor installatiesmoke, package acceptance, Docker
  release-path-suites, live/E2E, OpenWebUI, QA Lab-pariteit, Matrix- en Telegram-
  lanes. Met `release_profile=full` en `rerun_group=all` voert deze ook package
  Telegram E2E uit tegen het `release-package-under-test`-artefact uit release-
  checks. Geef `npm_telegram_package_spec` op na publicatie wanneer dezelfde
  Telegram E2E ook het gepubliceerde npm-pakket moet bewijzen. Geef
  `package_acceptance_package_spec` op na publicatie wanneer Package Acceptance
  de package/update-matrix moet uitvoeren tegen het uitgeleverde npm-pakket in plaats
  van het vanuit de SHA gebouwde artefact. Geef
  `evidence_package_spec` op wanneer het private bewijsrapport moet bewijzen dat de
  validatie overeenkomt met een gepubliceerd npm-pakket zonder Telegram E2E af te
  dwingen.
  Voorbeeld:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Voer de handmatige `Package Acceptance`-workflow uit wanneer je bewijs via een nevenkanaal
  wilt voor een pakketkandidaat terwijl releasewerk doorgaat. Gebruik `source=npm` voor
  `openclaw@beta`, `openclaw@latest` of een exacte releaseversie; `source=ref`
  om een vertrouwde `package_ref`-branch/tag/SHA te packen met de huidige
  `workflow_ref`-harnas; `source=url` voor een HTTPS-tarball met een vereiste
  SHA-256; of `source=artifact` voor een tarball die door een andere GitHub
  Actions-run is geüpload. De workflow herleidt de kandidaat tot
  `package-under-test`, hergebruikt de Docker E2E-releasescheduler tegen die
  tarball, en kan Telegram QA tegen dezelfde tarball uitvoeren met
  `telegram_mode=mock-openai` of `telegram_mode=live-frontier`. Wanneer de
  geselecteerde Docker-lanes `published-upgrade-survivor` bevatten, is het package-
  artefact de kandidaat en selecteert `published_upgrade_survivor_baseline` de
  gepubliceerde baseline.
  Voorbeeld: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Gangbare profielen:
  - `smoke`: install/channel/agent-, Gateway-netwerk- en config-reload-lanes
  - `package`: package/update/Plugin-lanes die artefact-native zijn, zonder OpenWebUI of live ClawHub
  - `product`: packageprofiel plus MCP-kanalen, Cron-/subagent-opschoning,
    OpenAI web search en OpenWebUI
  - `full`: Docker release-path-chunks met OpenWebUI
  - `custom`: exacte `docker_lanes`-selectie voor een gerichte heruitvoering
- Voer de handmatige `CI`-workflow direct uit wanneer je alleen volledige normale CI-
  dekking nodig hebt voor de releasekandidaat. Handmatige CI-dispatches omzeilen changed-
  scoping en forceren de Linux Node-shards, gebundelde-Plugin-shards, channel-
  contracts, Node 22-compatibiliteit, `check`, `check-additional`, buildsmoke,
  docs-controles, Python Skills, Windows, macOS, Android en Control UI i18n-
  lanes.
  Voorbeeld: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Voer `pnpm qa:otel:smoke` uit bij het valideren van releasetelemetrie. Het test
  QA-lab via een lokale OTLP/HTTP-ontvanger en verifieert de geëxporteerde trace-
  spannamen, begrensde attributen en redactie van content/identifiers zonder
  Opik, Langfuse of een andere externe collector te vereisen.
- Voer `pnpm release:check` uit vóór elke getagde release
- Voer `OpenClaw Release Publish` uit voor de muterende publicatiereeks nadat de
  tag bestaat. Dispatch deze vanuit `release/YYYY.M.D` (of `main` wanneer een
  vanuit main bereikbare tag wordt gepubliceerd), geef de releasetag en succesvolle OpenClaw npm
  `preflight_run_id` door, en behoud de standaard Plugin-publicatiescope
  `all-publishable`, tenzij je bewust een gerichte reparatie uitvoert. De
  workflow serialiseert Plugin npm-publicatie, Plugin ClawHub-publicatie en OpenClaw
  npm-publicatie zodat het corepakket niet wordt gepubliceerd vóór de geëxternaliseerde
  plugins.
- Releasechecks draaien nu in een afzonderlijke handmatige workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` voert ook de QA Lab mock-pariteitslane plus het snelle
  live Matrix-profiel en de Telegram QA-lane uit vóór releasegoedkeuring. De live
  lanes gebruiken de `qa-live-shared`-omgeving; Telegram gebruikt ook Convex CI-
  credentialleases. Voer de handmatige `QA-Lab - All Lanes`-workflow uit met
  `matrix_profile=all` en `matrix_shards=true` wanneer je volledige Matrix-
  transport-, media- en E2EE-inventaris parallel wilt.
- Cross-OS installatie- en upgrade-runtimevalidatie is onderdeel van publieke
  `OpenClaw Release Checks` en `Full Release Validation`, die de
  herbruikbare workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direct aanroepen
- Deze splitsing is opzettelijk: houd het echte npm-releasepad kort,
  deterministisch en artefactgericht, terwijl tragere live checks in hun eigen
  lane blijven zodat ze publiceren niet vertragen of blokkeren
- Releasechecks met secrets moeten worden gedispatcht via `Full Release
Validation` of vanuit de `main`/release-workflowref zodat workflowlogica en
  secrets gecontroleerd blijven
- `OpenClaw Release Checks` accepteert een branch, tag of volledige commit-SHA zolang
  de opgeloste commit bereikbaar is vanuit een OpenClaw-branch of releasetag
- `OpenClaw NPM Release` validatie-only preflight accepteert ook de huidige
  volledige 40-teken workflow-branch-commit-SHA zonder een gepushte tag te vereisen
- Dat SHA-pad is alleen voor validatie en kan niet worden gepromoveerd naar een echte publicatie
- In SHA-modus synthetiseert de workflow `v<package.json version>` alleen voor de
  pakketmetadatacontrole; echte publicatie vereist nog steeds een echte releasetag
- Beide workflows houden het echte publicatie- en promotiepad op GitHub-hosted
  runners, terwijl het niet-muterende validatiepad de grotere
  Blacksmith Linux-runners kan gebruiken
- Die workflow voert
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  uit met zowel `OPENAI_API_KEY` als `ANTHROPIC_API_KEY` workflowsecrets
- npm-releasepreflight wacht niet langer op de afzonderlijke releasechecks-lane
- Voer `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (of de overeenkomende beta-/correctietag) uit vóór goedkeuring
- Voer na npm-publicatie
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (of de overeenkomende beta-/correctieversie) uit om het gepubliceerde registry-
  installatiepad in een verse tijdelijke prefix te verifiëren
- Voer na een betapublicatie `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  uit om onboarding van het geïnstalleerde pakket, Telegram-configuratie en echte Telegram E2E
  tegen het gepubliceerde npm-pakket te verifiëren met de gedeelde geleasede Telegram-
  credentialpool. Lokale maintainer-eenmalige runs mogen de Convex-vars weglaten en de drie
  `OPENCLAW_QA_TELEGRAM_*` env-credentials direct doorgeven.
- Maintainers kunnen dezelfde post-publishcontrole uitvoeren vanuit GitHub Actions via de
  handmatige `NPM Telegram Beta E2E`-workflow. Deze is bewust alleen handmatig en
  draait niet bij elke merge.
- Maintainer-releaseautomatisering gebruikt nu preflight-then-promote:
  - echte npm-publicatie moet een succesvolle npm `preflight_run_id` hebben doorstaan
  - de echte npm-publicatie moet worden gedispatcht vanuit dezelfde `main`- of
    `release/YYYY.M.D`-branch als de succesvolle preflightrun
  - stabiele npm-releases gebruiken standaard `beta`
  - stabiele npm-publicatie kan expliciet op `latest` mikken via workflowinput
  - tokengebaseerde npm dist-tag-mutatie leeft nu in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    om veiligheidsredenen, omdat `npm dist-tag add` nog steeds `NPM_TOKEN` nodig heeft terwijl de
    publieke repo OIDC-only publicatie behoudt
  - publieke `macOS Release` is alleen validatie; wanneer een tag alleen op een
    releasebranch bestaat maar de workflow vanuit `main` wordt gedispatcht, stel
    `public_release_branch=release/YYYY.M.D` in
  - echte private mac-publicatie moet succesvolle private mac
    `preflight_run_id` en `validate_run_id` hebben doorstaan
  - de echte publicatiepaden promoveren voorbereide artefacten in plaats van ze
    opnieuw te bouwen
- Voor stabiele correctiereleases zoals `YYYY.M.D-N` controleert de post-publishverifier
  ook hetzelfde temp-prefix-upgradepad van `YYYY.M.D` naar `YYYY.M.D-N`
  zodat releasecorrecties oudere globale installaties niet stilzwijgend op de
  basale stabiele payload laten staan
- npm-releasepreflight faalt gesloten tenzij de tarball zowel
  `dist/control-ui/index.html` als een niet-lege `dist/control-ui/assets/`-payload bevat
  zodat we niet opnieuw een leeg browserdashboard uitleveren
- Post-publishverificatie controleert ook dat gepubliceerde Plugin-entrypoints en
  pakketmetadata aanwezig zijn in de geïnstalleerde registry-layout. Een release die
  ontbrekende Plugin-runtimepayloads uitlevert, faalt de postpublishverifier en
  kan niet naar `latest` worden gepromoveerd.
- `pnpm test:install:smoke` handhaaft ook het npm pack `unpackedSize`-budget op
  de kandidaat-updatetarball, zodat installer-e2e accidentele pack-bloat opvangt
  vóór het releasepublicatiepad
- Als het releasewerk CI-planning, extensietimingmanifesten of
  extensietestmatrices heeft geraakt, regenereer en review dan de door de planner beheerde
  `plugin-prerelease-extension-shard`-matrixoutputs uit
  `.github/workflows/plugin-prerelease.yml` vóór goedkeuring zodat releasenotes geen
  verouderde CI-layout beschrijven
- Gereedheid voor stabiele macOS-release omvat ook de updater-oppervlakken:
  - de GitHub-release moet uiteindelijk de verpakte `.zip`, `.dmg` en `.dSYM.zip` bevatten
  - `appcast.xml` op `main` moet na publicatie naar de nieuwe stabiele zip wijzen
  - de verpakte app moet een niet-debug bundle-id behouden, een niet-lege Sparkle-feed-
    URL en een `CFBundleVersion` op of boven de canonieke Sparkle-buildvloer
    voor die releaseversie

## Releasetestboxen

`Full Release Validation` is hoe operators alle pre-releasetests vanuit
één ingangspunt starten. Voor bewijs met een gepinde commit op een snel bewegende branch gebruik je de
helper zodat elke child-workflow draait vanuit een tijdelijke branch die op de doel-
SHA is vastgezet:

```bash
pnpm ci:full-release --sha <full-sha>
```

De helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation`
vanuit die branch met `ref=<sha>`, verifieert dat elke child-workflow `headSha`
overeenkomt met het doel, en verwijdert daarna de tijdelijke branch. Dit voorkomt dat je per ongeluk een
nieuwere `main`-childrun bewijst.

Voor validatie van een releasebranch of tag voer je deze uit vanuit de vertrouwde `main` workflow-
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

De workflow herleidt de doelref, start handmatige `CI` met
`target_ref=<release-ref>`, start `OpenClaw Release Checks` en start
zelfstandige package Telegram E2E wanneer `release_profile=full` met
`rerun_group=all` of wanneer `npm_telegram_package_spec` is ingesteld. `OpenClaw Release
Checks` waaiert daarna uit naar install smoke, cross-OS releasecontroles, live/E2E Docker
releasepad-dekking, Package Acceptance met Telegram package-QA, QA Lab
pariteit, live Matrix en live Telegram. Een volledige run is alleen acceptabel wanneer de
samenvatting van `Full Release Validation`
`normal_ci` en `release_checks` als geslaagd toont. In full/all-modus
moet de `npm_telegram`-child ook geslaagd zijn; buiten full/all wordt deze overgeslagen
tenzij een gepubliceerde `npm_telegram_package_spec` is opgegeven. De uiteindelijke
verificatiesamenvatting bevat tabellen met traagste jobs voor elke child-run, zodat de
releasemanager het huidige kritieke pad kan zien zonder logs te downloaden.
Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
complete fasematrix, exacte workflow-jobnamen, verschillen tussen stabiel en volledig profiel,
artifacts en gerichte rerun-handles.
Child-workflows worden gestart vanaf de vertrouwde ref die `Full Release
Validation` uitvoert, normaal `--ref main`, zelfs wanneer de doel-`ref` naar een
oudere releasebranch of tag wijst. Er is geen aparte Full Release Validation
workflow-ref-invoer; kies de vertrouwde harness door de workflow-run-ref te kiezen.
Gebruik `--ref main -f ref=<sha>` niet voor exact commitbewijs op bewegende `main`;
ruwe commit-SHA's kunnen geen workflow-dispatchrefs zijn, dus gebruik
`pnpm ci:full-release --sha <sha>` om de gepinde tijdelijke branch te maken.

Gebruik `release_profile` om de live/provider-breedte te selecteren:

- `minimum`: snelste releasekritieke OpenAI/core live- en Docker-pad
- `stable`: minimum plus stabiele provider/backend-dekking voor releasegoedkeuring
- `full`: stable plus brede advisory provider/media-dekking

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de doelref
eenmalig als `release-package-under-test` te herleiden en hergebruikt dat artifact in zowel
releasepad-Docker-controles als Package Acceptance. Dit houdt alle
packagegerichte boxes op dezelfde bytes en voorkomt herhaalde package-builds.
De cross-OS OpenAI install smoke gebruikt `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer de
repo/org-variabele is ingesteld, anders `openai/gpt-5.4`, omdat deze lane
package-installatie, onboarding, Gateway-start en een live agentbeurt bewijst
in plaats van het traagste standaardmodel te benchmarken. De bredere live provider
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

Gebruik de volledige paraplu niet als eerste rerun na een gerichte fix. Als één box
faalt, gebruik dan de mislukte child-workflow, job, Docker-lane, package-profiel, model
provider of QA-lane voor het volgende bewijs. Run de volledige paraplu pas opnieuw wanneer
de fix gedeelde releaseorkestratie heeft gewijzigd of eerder all-box-bewijs
verouderd heeft gemaakt. De uiteindelijke verifier van de paraplu controleert de vastgelegde child workflow-run
ids opnieuw, dus nadat een child-workflow succesvol opnieuw is uitgevoerd, rerun alleen de mislukte
`Verify full validation` parent-job.

Voor begrensd herstel geef je `rerun_group` door aan de paraplu. `all` is de echte
releasecandidate-run, `ci` runt alleen de normale CI-child, `plugin-prerelease`
runt alleen de release-only Plugin-child, `release-checks` runt elke release
box, en de smallere releasegroepen zijn `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` en `npm-telegram`.
Gerichte `npm-telegram`-reruns vereisen `npm_telegram_package_spec`; full/all-runs
met `release_profile=full` gebruiken het package artifact van release-checks.

### Vitest

De Vitest-box is de handmatige `CI` child-workflow. Handmatige CI omzeilt bewust
changed-scoping en forceert de normale testgrafiek voor de releasecandidate:
Linux Node-shards, bundled-plugin-shards, kanaalcontracten, Node 22
compatibiliteit, `check`, `check-additional`, build smoke, docs-controles, Python
Skills, Windows, macOS, Android en Control UI i18n.

Gebruik deze box om te beantwoorden: "is de source tree geslaagd voor de volledige normale testsuite?"
Dit is niet hetzelfde als releasepad-productvalidatie. Bewijs om te bewaren:

- samenvatting van `Full Release Validation` met de URL van de gestarte `CI`-run
- `CI`-run groen op de exacte doel-SHA
- mislukte of trage shardnamen uit de CI-jobs bij onderzoek naar regressies
- Vitest-timingartifacts zoals `.artifacts/vitest-shard-timings.json` wanneer
  een run prestatieanalyse nodig heeft

Run handmatige CI alleen rechtstreeks wanneer de release deterministische normale CI nodig heeft maar
niet de Docker-, QA Lab-, live-, cross-OS- of package-boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

De Docker-box zit in `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus de release-modus
`install-smoke`-workflow. Deze valideert de releasecandidate via gepackagede
Docker-omgevingen in plaats van alleen source-level tests.

Release-Docker-dekking omvat:

- volledige install smoke met de trage Bun global install smoke ingeschakeld
- voorbereiding/hergebruik van root-Dockerfile smoke-image per doel-SHA, waarbij QR,
  root/gateway en installer/Bun smoke-jobs als aparte install-smoke
  shards draaien
- repository-E2E-lanes
- releasepad-Docker-chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` en `plugins-runtime-install-h`
- OpenWebUI-dekking binnen de chunk `plugins-runtime-services` wanneer gevraagd
- opgesplitste install/uninstall-lanes voor gebundelde Plugins
  `bundled-plugin-install-uninstall-0` tot en met
  `bundled-plugin-install-uninstall-23`
- live/E2E provider-suites en Docker live model-dekking wanneer releasecontroles
  live-suites bevatten

Gebruik Docker-artifacts voordat je opnieuw runt. De releasepad-scheduler uploadt
`.artifacts/docker-tests/` met lane-logs, `summary.json`, `failures.json`,
fasetimings, scheduler-plan-JSON en rerun-commando's. Voor gericht herstel
gebruik je `docker_lanes=<lane[,lane]>` op de herbruikbare live/E2E-workflow in plaats van
alle releasechunks opnieuw te runnen. Gegenereerde rerun-commando's bevatten eerdere
`package_artifact_run_id` en voorbereide Docker-image-invoer wanneer beschikbaar, zodat een
mislukte lane dezelfde tarball en GHCR-images kan hergebruiken.

### QA Lab

De QA Lab-box is ook onderdeel van `OpenClaw Release Checks`. Het is de agentische
gedrags- en kanaalniveau-releasegate, los van Vitest en Docker
package-mechanica.

Release QA Lab-dekking omvat:

- mock-pariteitslane die de OpenAI-candidate-lane vergelijkt met de Opus 4.6
  baseline met behulp van het agentische parity pack
- snelle live Matrix-QA-profiel met de `qa-live-shared`-omgeving
- live Telegram-QA-lane met Convex CI-credentialleases
- `pnpm qa:otel:smoke` wanneer release-telemetrie expliciet lokaal bewijs nodig heeft

Gebruik deze box om te beantwoorden: "gedraagt de release zich correct in QA-scenario's en
live kanaalflows?" Bewaar de artifact-URL's voor pariteit-, Matrix- en Telegram-
lanes bij het goedkeuren van de release. Volledige Matrix-dekking blijft beschikbaar als een
handmatige sharded QA-Lab-run in plaats van de standaard releasekritieke lane.

### Package

De Package-box is de installable-product-gate. Deze wordt ondersteund door
`Package Acceptance` en de resolver
`scripts/resolve-openclaw-package-candidate.mjs`. De resolver normaliseert een
candidate naar de `package-under-test`-tarball die door Docker E2E wordt gebruikt, valideert
de package-inventaris, registreert de packageversie en SHA-256, en houdt de
workflow-harness-ref gescheiden van de package-source-ref.

Ondersteunde candidate-bronnen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-release
  versie
- `source=ref`: pack een vertrouwde `package_ref`-branch, tag of volledige commit-SHA
  met de geselecteerde `workflow_ref`-harness
- `source=url`: download een HTTPS `.tgz` met verplichte `package_sha256`
- `source=artifact`: hergebruik een `.tgz` dat door een andere GitHub Actions-run is geüpload

`OpenClaw Release Checks` runt Package Acceptance met `source=artifact`, het
voorbereide release-package artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` en
`telegram_mode=mock-openai`. Package Acceptance houdt migratie, update, stale
Plugin dependency cleanup, offline Plugin-fixtures, Plugin-update en Telegram
package-QA tegen dezelfde herleide tarball. De upgradematrix dekt elke stabiele npm-gepubliceerde baseline van `2026.4.23` tot en met `latest`; gebruik
Package Acceptance met `source=npm` voor een al shipped candidate, of
`source=ref`/`source=artifact` voor een SHA-onderbouwde lokale npm-tarball vóór
publicatie. Het is de GitHub-native
vervanging voor het grootste deel van de package/update-dekking die voorheen
Parallels vereiste. Cross-OS releasecontroles blijven belangrijk voor OS-specifieke onboarding,
installer en platformgedrag, maar package/update-productvalidatie zou
Package Acceptance moeten verkiezen.

De canonieke checklist voor update- en Plugin-validatie is
[Updates en Plugins testen](/nl/help/testing-updates-plugins). Gebruik deze bij het
bepalen welke lokale, Docker-, Package Acceptance- of release-check-lane een
Plugin-install/update, doctor cleanup of gepubliceerde-package-migratiewijziging bewijst.
Uitputtende gepubliceerde updatemigratie vanaf elk stabiel `2026.4.23+`-package is
een aparte handmatige `Update Migration`-workflow, geen onderdeel van Full Release CI.

Legacy package-acceptance-tolerantie is bewust tijdgebonden. Packages tot en met
`2026.4.25` mogen het compatibiliteitspad gebruiken voor metadatagaten die al naar
npm zijn gepubliceerd: private QA-inventarisitems die in de tarball ontbreken, ontbrekende
`gateway install --wrapper`, ontbrekende patchbestanden in de tarball-derived git
fixture, ontbrekende gepersisteerde `update.channel`, legacy Plugin install-record
locaties, ontbrekende marketplace install-record persistence en configuratiemetadata-
migratie tijdens `plugins update`. Het gepubliceerde `2026.4.26`-package mag waarschuwen
voor local build metadata stamp-bestanden die al zijn shipped. Latere packages
moeten aan de moderne packagecontracten voldoen; diezelfde gaten laten release
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

- `smoke`: snelle package-install/kanaal/agent, Gateway-netwerk en config
  reload-lanes
- `package`: install/update/Plugin-packagecontracten zonder live ClawHub; dit is de release-check
  standaard
- `product`: `package` plus MCP-kanalen, cron/subagent-cleanup, OpenAI web
  search en OpenWebUI
- `full`: Docker-releasepad-chunks met OpenWebUI
- `custom`: exacte `docker_lanes`-lijst voor gerichte reruns

Voor package-kandidaatbewijs voor Telegram schakelt u `telegram_mode=mock-openai` of
`telegram_mode=live-frontier` in voor Package Acceptance. De workflow geeft de
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
6. Dispatch `OpenClaw NPM Release` met de releasetag, npm dist-tag en
   opgeslagen `preflight_run_id`.

Voorbeeld voor betapublicatie:

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

Gebruik de lager-niveau workflows `Plugin NPM Release` en `Plugin ClawHub Release`
alleen voor gericht herstel- of herpublicatiewerk. Geef voor herstel van een geselecteerde Plugin
`plugin_publish_scope=selected` en `plugins=@openclaw/name` door aan
`OpenClaw Release Publish`, of dispatch de child-workflow rechtstreeks wanneer het
OpenClaw-pakket niet mag worden gepubliceerd.

## NPM-workflowinvoer

`OpenClaw NPM Release` accepteert deze door de operator beheerde invoer:

- `tag`: vereiste releasetag zoals `v2026.4.2`, `v2026.4.2-1` of
  `v2026.4.2-beta.1`; wanneer `preflight_only=true`, mag dit ook de huidige
  volledige 40-tekens lange commit-SHA van de workflowbranch zijn voor een preflight
  die alleen valideert
- `preflight_only`: `true` alleen voor validatie/build/pakket, `false` voor het
  echte publicatiepad
- `preflight_run_id`: vereist op het echte publicatiepad zodat de workflow de
  voorbereide tarball van de geslaagde preflight-run hergebruikt
- `npm_dist_tag`: npm-doeltag voor het publicatiepad; standaard `beta`

`OpenClaw Release Publish` accepteert deze door de operator beheerde invoer:

- `tag`: vereiste releasetag; moet al bestaan
- `preflight_run_id`: geslaagde `OpenClaw NPM Release` preflight-run-id;
  vereist wanneer `publish_openclaw_npm=true`
- `npm_dist_tag`: npm-doeltag voor het OpenClaw-pakket
- `plugin_publish_scope`: standaard `all-publishable`; gebruik `selected` alleen
  voor gericht herstelwerk
- `plugins`: door komma's gescheiden `@openclaw/*`-pakketnamen wanneer
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: standaard `true`; stel alleen in op `false` wanneer de
  workflow wordt gebruikt als herstelorkestrator alleen voor Plugins

`OpenClaw Release Checks` accepteert deze door de operator beheerde invoer:

- `ref`: branch, tag of volledige commit-SHA om te valideren. Controles met secrets
  vereisen dat de opgeloste commit bereikbaar is vanaf een OpenClaw-branch of
  releasetag.

Regels:

- Stabiele en correctietags mogen publiceren naar `beta` of `latest`
- Bèta-prereleasetags mogen alleen publiceren naar `beta`
- Voor `OpenClaw NPM Release` is invoer met een volledige commit-SHA alleen toegestaan wanneer
  `preflight_only=true`
- `OpenClaw Release Checks` en `Full Release Validation` zijn altijd
  alleen validatie
- Het echte publicatiepad moet dezelfde `npm_dist_tag` gebruiken als tijdens de preflight;
  de workflow verifieert die metadata voordat de publicatie doorgaat

## Stabiele npm-releasereeks

Bij het maken van een stabiele npm-release:

1. Voer `OpenClaw NPM Release` uit met `preflight_only=true`
   - Voordat er een tag bestaat, mag u de huidige volledige commit-SHA van de workflowbranch
     gebruiken voor een validatie-only dry run van de preflight-workflow
2. Kies `npm_dist_tag=beta` voor de normale beta-first-flow, of alleen `latest`
   wanneer u bewust rechtstreeks stabiel wilt publiceren
3. Voer `Full Release Validation` uit op de releasebranch, releasetag of volledige
   commit-SHA wanneer u normale CI plus live promptcache, Docker, QA Lab,
   Matrix en Telegram-dekking vanuit één handmatige workflow wilt
4. Als u bewust alleen de deterministische normale testgrafiek nodig hebt, voert u in plaats daarvan de
   handmatige `CI`-workflow uit op de releaseref
5. Sla de geslaagde `preflight_run_id` op
6. Voer `OpenClaw Release Publish` uit met dezelfde `tag`, dezelfde `npm_dist_tag`
   en de opgeslagen `preflight_run_id`; deze publiceert geëxternaliseerde Plugins naar npm
   en ClawHub voordat het OpenClaw-npm-pakket wordt gepromoot
7. Als de release op `beta` is geland, gebruik dan de private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow om die stabiele versie van `beta` naar `latest` te promoveren
8. Als de release bewust rechtstreeks naar `latest` is gepubliceerd en `beta`
   onmiddellijk dezelfde stabiele build moet volgen, gebruik dan dezelfde private
   workflow om beide dist-tags naar de stabiele versie te laten wijzen, of laat de geplande
   zelfherstellende synchronisatie `beta` later verplaatsen

De dist-tag-mutatie staat in de private repo om veiligheidsredenen, omdat die nog steeds
`NPM_TOKEN` vereist, terwijl de publieke repo OIDC-only publicatie behoudt.

Zo blijven zowel het rechtstreekse publicatiepad als het beta-first-promotiepad
gedocumenteerd en zichtbaar voor operators.

Als een maintainer moet terugvallen op lokale npm-authenticatie, voer dan alle 1Password
CLI (`op`)-commando's alleen uit binnen een dedicated tmux-sessie. Roep `op` niet
rechtstreeks aan vanuit de main agent-shell; door dit binnen tmux te houden blijven prompts,
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
