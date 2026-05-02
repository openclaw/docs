---
read_when:
    - Zoeken naar definities van openbare releasekanalen
    - Releasevalidatie of pakketacceptatie uitvoeren
    - Op zoek naar versienaamgeving en cadans
summary: Releaselanes, operatorchecklist, validatieboxen, versienaamgeving en cadans
title: Releasebeleid
x-i18n:
    generated_at: "2026-05-02T20:58:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 493cb8b42f0e15f3bf5f8fb9be7d01fd626f4f16db9ac0a85e6efa747ef12d12
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw heeft vier openbare releasekanalen:

- stable: getagde releases die standaard naar npm `beta` publiceren, of naar npm `latest` wanneer daar expliciet om wordt gevraagd
- alpha: prerelease-tags die naar npm `alpha` publiceren
- beta: prerelease-tags die naar npm `beta` publiceren
- dev: de bewegende kop van `main`

## Versienaamgeving

- Stabiele releaseversie: `YYYY.M.D`
  - Git-tag: `vYYYY.M.D`
- Stabiele correctiereleaseversie: `YYYY.M.D-N`
  - Git-tag: `vYYYY.M.D-N`
- Alpha-prereleaseversie: `YYYY.M.D-alpha.N`
  - Git-tag: `vYYYY.M.D-alpha.N`
- Beta-prereleaseversie: `YYYY.M.D-beta.N`
  - Git-tag: `vYYYY.M.D-beta.N`
- Gebruik geen voorloopnul voor maand of dag
- `latest` betekent de huidige gepromote stabiele npm-release
- `alpha` betekent het huidige alpha-installatiedoel
- `beta` betekent het huidige beta-installatiedoel
- Stabiele en stabiele correctiereleases publiceren standaard naar npm `beta`; releasebeheerders kunnen expliciet `latest` als doel kiezen, of later een gecontroleerde beta-build promoveren
- Elke stabiele OpenClaw-release levert het npm-pakket en de macOS-app samen;
  beta-releases valideren en publiceren normaal eerst het npm-/pakketpad, waarbij
  bouwen/ondertekenen/notariseren van de mac-app voor stable is gereserveerd, tenzij daar expliciet om wordt gevraagd

## Releasecadans

- Releases gaan eerst via beta
- Stable volgt pas nadat de nieuwste beta is gevalideerd
- Maintainers maken releases normaal vanaf een `release/YYYY.M.D`-branch die is gemaakt
  vanaf de huidige `main`, zodat releasevalidatie en fixes nieuwe
  ontwikkeling op `main` niet blokkeren
- Als een beta-tag is gepusht of gepubliceerd en een fix nodig heeft, maken maintainers
  de volgende `-beta.N`-tag in plaats van de oude beta-tag te verwijderen of opnieuw te maken
- Gedetailleerde releaseprocedure, goedkeuringen, inloggegevens en herstelnotities zijn
  alleen voor maintainers

## Checklist voor releasebeheerders

Deze checklist is de openbare vorm van de releaseflow. Privé-inloggegevens,
ondertekening, notarisatie, herstel van dist-tags en details voor noodrollback blijven in
het release-runbook dat alleen voor maintainers is.

1. Begin vanaf de huidige `main`: haal de nieuwste wijzigingen op, bevestig dat de doelcommit is gepusht,
   en bevestig dat de huidige `main`-CI groen genoeg is om er een branch vanaf te maken.
2. Herschrijf de bovenste sectie van `CHANGELOG.md` op basis van echte commitgeschiedenis met
   `/changelog`, houd vermeldingen gebruikersgericht, commit dit, push het, en rebase/pull
   nog een keer voordat je een branch maakt.
3. Beoordeel releasecompatibiliteitsrecords in
   `src/plugins/compat/registry.ts` en
   `src/commands/doctor/shared/deprecation-compat.ts`. Verwijder verlopen
   compatibiliteit alleen wanneer het upgradepad gedekt blijft, of leg vast waarom deze
   bewust wordt behouden.
4. Maak `release/YYYY.M.D` vanaf de huidige `main`; voer normaal releasewerk niet
   rechtstreeks uit op `main`.
5. Verhoog elke vereiste versielocatie voor de bedoelde tag, voer
   `pnpm plugins:sync` uit zodat publiceerbare Plugin-pakketten de releaseversie
   en compatibiliteitsmetadata delen, en voer daarna de lokale deterministische preflight uit:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, en
   `pnpm release:check`.
6. Voer `OpenClaw NPM Release` uit met `preflight_only=true`. Voordat er een tag bestaat,
   is een volledige release-branch-SHA van 40 tekens toegestaan voor preflight die alleen
   valideert. Bewaar de succesvolle `preflight_run_id`.
7. Start alle prereleasetests met `Full Release Validation` voor de
   releasebranch, tag of volledige commit-SHA. Dit is het enige handmatige invoerpunt
   voor de vier grote releasetestboxen: Vitest, Docker, QA Lab en Package.
8. Als validatie mislukt, fix dit op de releasebranch en voer het kleinste mislukte
   bestand, de kleinste baan, workflowtaak, pakketprofiel, provider of modelallowlist opnieuw uit die
   de fix bewijst. Voer de volledige overkoepelende validatie alleen opnieuw uit wanneer het gewijzigde oppervlak
   eerder bewijs verouderd maakt.
9. Voor alpha of beta: tag `vYYYY.M.D-alpha.N` of `vYYYY.M.D-beta.N`, en voer daarna `OpenClaw Release Publish` uit vanaf
   de bijpassende `release/YYYY.M.D`-branch. Dit verifieert `pnpm plugins:sync:check`,
   publiceert eerst alle publiceerbare Plugin-pakketten naar npm, publiceert dezelfde
   set daarna naar ClawHub, en promoot vervolgens het voorbereide OpenClaw npm-preflight-
   artefact met de bijpassende dist-tag. Voer na publicatie post-publish pakketacceptatie
   uit tegen het gepubliceerde pakket `openclaw@YYYY.M.D-alpha.N`, `openclaw@alpha`,
   `openclaw@YYYY.M.D-beta.N` of `openclaw@beta`. Als een gepushte of
   gepubliceerde prerelease een fix nodig heeft, maak dan het volgende bijpassende prereleasenummer;
   verwijder of herschrijf de oude prerelease niet.
10. Voor stable ga je alleen verder nadat de gecontroleerde beta of releasecandidate het
    vereiste validatiebewijs heeft. Publicatie naar stable npm loopt ook via
    `OpenClaw Release Publish`, waarbij het succesvolle preflight-artefact opnieuw wordt gebruikt via
    `preflight_run_id`; gereedheid voor de stable macOS-release vereist ook de
    verpakte `.zip`, `.dmg`, `.dSYM.zip` en bijgewerkte `appcast.xml` op `main`.
11. Voer na publicatie de npm-post-publish-verifier uit, optionele zelfstandige
    gepubliceerde-npm Telegram-E2E wanneer je kanaalbewijs na publicatie nodig hebt,
    dist-tagpromotie wanneer nodig, GitHub-release-/prereleasenotities uit de
    volledige bijpassende `CHANGELOG.md`-sectie, en de stappen voor de releaseaankondiging.

## Release-preflight

- Voer `pnpm check:test-types` uit vóór de releasepreflight, zodat test-TypeScript
  ook buiten de snellere lokale `pnpm check`-gate gedekt blijft
- Voer `pnpm check:architecture` uit vóór de releasepreflight, zodat de bredere
  importcyclus- en architectuurgrenscontroles groen zijn buiten de snellere lokale gate
- Voer `pnpm build && pnpm ui:build` uit vóór `pnpm release:check`, zodat de verwachte
  `dist/*`-releaseartefacten en de Control UI-bundel bestaan voor de
  pakketvalidatiestap
- Voer `pnpm plugins:sync` uit na de rootversiebump en vóór het taggen. Het
  werkt publiceerbare Plugin-pakketversies, OpenClaw-peer/API-compatibiliteitsmetadata,
  buildmetadata en Plugin-changelogstubs bij zodat ze overeenkomen met de core
  releaseversie. `pnpm plugins:sync:check` is de niet-muteren releaseguard;
  de publicatieworkflow faalt vóór enige registry-mutatie als deze stap is
  vergeten.
- Voer de handmatige workflow `Full Release Validation` uit vóór releasegoedkeuring om
  alle prerelease-testboxen vanuit één toegangspunt te starten. Deze accepteert een branch,
  tag of volledige commit-SHA, dispatcht handmatig `CI` en dispatcht
  `OpenClaw Release Checks` voor installatiesmoke, pakketacceptatie, Docker
  release-pad-suites, live/E2E, OpenWebUI, QA Lab-pariteit, Matrix- en Telegram
  lanes. Met `release_profile=full` en `rerun_group=all` voert deze ook pakket
  Telegram E2E uit tegen het artefact `release-package-under-test` uit releasechecks.
  Geef `npm_telegram_package_spec` op na publicatie wanneer dezelfde
  Telegram E2E ook het gepubliceerde npm-pakket moet bewijzen. Geef
  `package_acceptance_package_spec` op na publicatie wanneer Package Acceptance
  zijn pakket/update-matrix moet uitvoeren tegen het verzonden npm-pakket in plaats
  van het uit de SHA gebouwde artefact. Geef
  `evidence_package_spec` op wanneer het private bewijsrapport moet bewijzen dat de
  validatie overeenkomt met een gepubliceerd npm-pakket zonder Telegram E2E af te dwingen.
  Voorbeeld:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Voer de handmatige workflow `Package Acceptance` uit wanneer je bewijs via een zijkanaal
  wilt voor een pakketkandidaat terwijl het releasewerk doorgaat. Gebruik `source=npm` voor
  `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` of een exacte releaseversie; `source=ref`
  om een vertrouwde `package_ref`-branch/tag/SHA te verpakken met de huidige
  `workflow_ref`-harness; `source=url` voor een HTTPS-tarball met een verplichte
  SHA-256; of `source=artifact` voor een tarball die is geüpload door een andere GitHub
  Actions-run. De workflow resolveert de kandidaat naar
  `package-under-test`, hergebruikt de Docker E2E-releasescheduler tegen die
  tarball en kan Telegram QA tegen dezelfde tarball uitvoeren met
  `telegram_mode=mock-openai` of `telegram_mode=live-frontier`. Wanneer de
  geselecteerde Docker-lanes `published-upgrade-survivor` bevatten, is het pakketartefact
  de kandidaat en selecteert `published_upgrade_survivor_baseline`
  de gepubliceerde baseline.
  Voorbeeld: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Veelgebruikte profielen:
  - `smoke`: installatie-/kanaal-/agent-, Gateway-netwerk- en config-herlaadlanes
  - `package`: artefact-native pakket-/update-/Plugin-lanes zonder OpenWebUI of live ClawHub
  - `product`: pakketprofiel plus MCP-kanalen, cron-/subagent-opruiming,
    OpenAI-webzoekopdracht en OpenWebUI
  - `full`: Docker release-pad-chunks met OpenWebUI
  - `custom`: exacte `docker_lanes`-selectie voor een gerichte heruitvoering
- Voer de handmatige workflow `CI` direct uit wanneer je alleen volledige normale CI-dekking
  nodig hebt voor de releasekandidaat. Handmatige CI-dispatches omzeilen gewijzigde
  scoping en forceren de Linux Node-shards, gebundelde-Plugin-shards, kanaalcontracten,
  Node 22-compatibiliteit, `check`, `check-additional`, buildsmoke,
  docscontroles, Python Skills, Windows, macOS, Android en Control UI i18n
  lanes.
  Voorbeeld: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Voer `pnpm qa:otel:smoke` uit bij het valideren van releasetelemetrie. Dit test
  QA-lab via een lokale OTLP/HTTP-ontvanger en verifieert de geëxporteerde trace-
  spannamen, begrensde attributen en redactie van inhoud/identifiers zonder
  Opik, Langfuse of een andere externe collector te vereisen.
- Voer `pnpm release:check` uit vóór elke getagde release
- Voer `OpenClaw Release Publish` uit voor de muterende publicatiereeks nadat de
  tag bestaat. Dispatch deze vanaf `release/YYYY.M.D` (of `main` wanneer je een
  vanuit main bereikbare tag publiceert), geef de releasetag en succesvolle OpenClaw npm
  `preflight_run_id` door en behoud de standaard Plugin-publicatiescope
  `all-publishable`, tenzij je bewust een gerichte reparatie uitvoert. De
  workflow serialiseert Plugin npm publish, Plugin ClawHub publish en OpenClaw
  npm publish, zodat het corepakket niet wordt gepubliceerd vóór de geëxternaliseerde
  Plugins.
- Releasechecks draaien nu in een aparte handmatige workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` voert ook de QA Lab mock-pariteitslane plus het snelle
  live Matrix-profiel en de Telegram QA-lane uit vóór releasegoedkeuring. De live
  lanes gebruiken de omgeving `qa-live-shared`; Telegram gebruikt ook Convex CI-
  credentialleases. Voer de handmatige workflow `QA-Lab - All Lanes` uit met
  `matrix_profile=all` en `matrix_shards=true` wanneer je de volledige Matrix-
  transport-, media- en E2EE-inventaris parallel wilt.
- Cross-OS-runtimevalidatie voor installatie en upgrade maakt deel uit van publieke
  `OpenClaw Release Checks` en `Full Release Validation`, die de herbruikbare workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` direct aanroepen
- Deze splitsing is bewust: houd het echte npm-releasepad kort,
  deterministisch en artefactgericht, terwijl tragere livecontroles in hun
  eigen lane blijven zodat ze publicatie niet vertragen of blokkeren
- Releasechecks met geheimen moeten worden gedispatcht via `Full Release
Validation` of vanaf de `main`/release-workflowref, zodat workflowlogica en
  geheimen gecontroleerd blijven
- `OpenClaw Release Checks` accepteert een branch, tag of volledige commit-SHA zolang
  de opgeloste commit bereikbaar is vanaf een OpenClaw-branch of releasetag
- Validatie-only preflight van `OpenClaw NPM Release` accepteert ook de huidige
  volledige 40-tekens workflow-branch-commit-SHA zonder een gepushte tag te vereisen
- Dat SHA-pad is alleen voor validatie en kan niet worden gepromoveerd naar een echte publicatie
- In SHA-modus synthetiseert de workflow `v<package.json version>` alleen voor de
  pakketmetadatacontrole; echte publicatie vereist nog steeds een echte releasetag
- Beide workflows houden het echte publicatie- en promotiepad op GitHub-gehoste
  runners, terwijl het niet-muterende validatiepad de grotere
  Blacksmith Linux-runners kan gebruiken
- Die workflow voert
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  uit met zowel `OPENAI_API_KEY` als `ANTHROPIC_API_KEY` workflowgeheimen
- npm-releasepreflight wacht niet langer op de aparte releasechecks-lane
- Voer `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (of de overeenkomende beta-/correctietag) uit vóór goedkeuring
- Voer na npm-publicatie
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (of de overeenkomende beta-/correctieversie) uit om het gepubliceerde registry-
  installatiepad in een verse tijdelijke prefix te verifiëren
- Voer na een betapublicatie `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  uit om onboarding van het geïnstalleerde pakket, Telegram-installatie en echte Telegram E2E
  tegen het gepubliceerde npm-pakket te verifiëren met de gedeelde geleasete Telegram-credential
  pool. Lokale eenmalige maintainer-runs mogen de Convex-variabelen weglaten en de drie
  `OPENCLAW_QA_TELEGRAM_*`-env-credentials direct doorgeven.
- Maintainers kunnen dezelfde post-publicatiecontrole uitvoeren vanuit GitHub Actions via de
  handmatige workflow `NPM Telegram Beta E2E`. Deze is bewust alleen handmatig en
  draait niet bij elke merge.
- Releaseautomatisering voor maintainers gebruikt nu preflight-dan-promote:
  - echte npm-publicatie moet slagen met een succesvolle npm `preflight_run_id`
  - de echte npm-publicatie moet worden gedispatcht vanaf dezelfde `main`- of
    `release/YYYY.M.D`-branch als de succesvolle preflight-run
  - stabiele npm-releases gebruiken standaard `beta`
  - stabiele npm-publicatie kan expliciet op `latest` richten via workflowinvoer
  - tokengebaseerde npm dist-tag-mutatie staat nu in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    voor beveiliging, omdat `npm dist-tag add` nog steeds `NPM_TOKEN` nodig heeft terwijl de
    publieke repo OIDC-only publicatie behoudt
  - publieke `macOS Release` is alleen validatie; wanneer een tag alleen op een
    releasebranch staat maar de workflow vanaf `main` wordt gedispatcht, stel dan
    `public_release_branch=release/YYYY.M.D` in
  - echte private mac-publicatie moet slagen met succesvolle private mac
    `preflight_run_id` en `validate_run_id`
  - de echte publicatiepaden promoten voorbereide artefacten in plaats van ze opnieuw
    te bouwen
- Voor stabiele correctiereleases zoals `YYYY.M.D-N` controleert de post-publicatieverifier
  ook hetzelfde upgradepad met tijdelijke prefix van `YYYY.M.D` naar `YYYY.M.D-N`,
  zodat releasecorrecties oudere globale installaties niet stilzwijgend op de
  basis-stabiele payload laten staan
- npm-releasepreflight faalt gesloten tenzij de tarball zowel
  `dist/control-ui/index.html` als een niet-lege `dist/control-ui/assets/`-payload bevat,
  zodat we niet opnieuw een leeg browserdashboard verzenden
- Post-publicatieverificatie controleert ook of gepubliceerde Plugin-entrypoints en
  pakketmetadata aanwezig zijn in de geïnstalleerde registry-layout. Een release die
  ontbrekende Plugin-runtimepayloads verzendt, faalt de postpublish-verifier en
  kan niet worden gepromoveerd naar `latest`.
- `pnpm test:install:smoke` handhaaft ook het npm pack `unpackedSize`-budget op
  de kandidaat-updatetarball, zodat installer-e2e onbedoelde pakketgroei opvangt
  vóór het releasepublicatiepad
- Als het releasewerk CI-planning, extensietimingmanifests of
  extensietestmatrices heeft geraakt, regenereer en beoordeel dan vóór goedkeuring de door de planner beheerde
  `plugin-prerelease-extension-shard`-matrixuitvoer van
  `.github/workflows/plugin-prerelease.yml`, zodat releasenotes geen verouderde CI-layout
  beschrijven
- Gereedheid voor stabiele macOS-release omvat ook de updateroppervlakken:
  - de GitHub-release moet uiteindelijk de verpakte `.zip`, `.dmg` en `.dSYM.zip` bevatten
  - `appcast.xml` op `main` moet na publicatie naar de nieuwe stabiele zip verwijzen
  - de verpakte app moet een niet-debug bundle-id, een niet-lege Sparkle-feed-
    URL en een `CFBundleVersion` op of boven de canonieke Sparkle-buildvloer
    voor die releaseversie behouden

## Releasetestboxen

`Full Release Validation` is hoe operators alle prerelease-tests vanuit
één toegangspunt starten. Gebruik voor een bewijs van een vastgepinde commit op een snel bewegende branch de
helper, zodat elke child-workflow draait vanaf een tijdelijke branch die is vastgezet op de doel-
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

De helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation`
vanaf die branch met `ref=<sha>`, verifieert dat elke child-workflow `headSha`
overeenkomt met het doel, en verwijdert daarna de tijdelijke branch. Dit voorkomt dat per ongeluk een
nieuwere `main`-child-run wordt bewezen.

Voor validatie van een releasebranch of tag voer je deze uit vanaf de vertrouwde `main`-workflow-
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

De workflow lost de doel-ref op, dispatcht handmatige `CI` met
`target_ref=<release-ref>`, dispatcht `OpenClaw Release Checks` en dispatcht
zelfstandige pakket-Telegram-E2E wanneer `release_profile=full` met
`rerun_group=all` of wanneer `npm_telegram_package_spec` is ingesteld. `OpenClaw Release
Checks` waaiert vervolgens uit naar installatiesmoke, cross-OS-releasechecks, live/E2E-Docker
release-paddekking, Package Acceptance met Telegram-pakket-QA, QA Lab
pariteit, live Matrix en live Telegram. Een volledige run is alleen acceptabel wanneer de
samenvatting van `Full Release Validation`
`normal_ci` en `release_checks` als geslaagd toont. In full/all-modus
moet het `npm_telegram`-kind ook geslaagd zijn; buiten full/all wordt het overgeslagen,
tenzij een gepubliceerd `npm_telegram_package_spec` is opgegeven. De uiteindelijke
verificatiesamenvatting bevat tabellen met langzaamste jobs voor elke kind-run, zodat de releasemanager
het huidige kritieke pad kan zien zonder logs te downloaden.
Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
volledige fasematrix, exacte workflow-jobnamen, verschillen tussen stabiel en volledig profiel,
artefacten en gerichte rerun-handles.
Kind-workflows worden gedispatcht vanaf de vertrouwde ref die `Full Release
Validation` uitvoert, normaal `--ref main`, zelfs wanneer de doel-`ref` naar een
oudere release-branch of tag wijst. Er is geen aparte workflow-ref-invoer voor Full Release Validation;
kies de vertrouwde harness door de workflow-run-ref te kiezen.
Gebruik `--ref main -f ref=<sha>` niet voor exact commit-bewijs op bewegende `main`;
ruwe commit-SHA's kunnen geen workflow-dispatch-refs zijn, dus gebruik
`pnpm ci:full-release --sha <sha>` om de vastgepinde tijdelijke branch te maken.

Gebruik `release_profile` om de live/provider-breedte te selecteren:

- `minimum`: snelste release-kritieke OpenAI/core live- en Docker-pad
- `stable`: minimum plus stabiele provider/backend-dekking voor releasegoedkeuring
- `full`: stable plus brede adviserende provider/media-dekking

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de doel-ref
eenmaal als `release-package-under-test` op te lossen en hergebruikt dat artefact in zowel
release-pad-Dockerchecks als Package Acceptance. Dit houdt alle
pakketgerichte boxes op dezelfde bytes en voorkomt herhaalde pakketbuilds.
De cross-OS-OpenAI-installatiesmoke gebruikt `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer de
repo/org-variabele is ingesteld, anders `openai/gpt-5.4`, omdat deze lane
pakketinstallatie, onboarding, Gateway-opstart en één live agent-beurt
bewijst in plaats van het langzaamste standaardmodel te benchmarken. De bredere live provider-
matrix blijft de plaats voor modelspecifieke dekking.

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
faalt, gebruik dan de mislukte kind-workflow, job, Docker-lane, pakketprofiel, model-
provider of QA-lane voor het volgende bewijs. Run de volledige paraplu pas opnieuw wanneer
de fix gedeelde releaseorkestratie heeft gewijzigd of eerder all-box-bewijs
verouderd heeft gemaakt. De uiteindelijke verifier van de paraplu controleert de vastgelegde kind-workflow-run-
id's opnieuw, dus nadat een kind-workflow succesvol opnieuw is uitgevoerd, rerun je alleen de mislukte
bovenliggende job `Verify full validation`.

Geef voor begrensd herstel `rerun_group` door aan de paraplu. `all` is de echte
releasecandidate-run, `ci` runt alleen het normale CI-kind, `plugin-prerelease`
runt alleen het release-only Plugin-kind, `release-checks` runt elke release-
box, en de smallere releasegroepen zijn `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` en `npm-telegram`.
Gerichte `npm-telegram`-reruns vereisen `npm_telegram_package_spec`; full/all-runs
met `release_profile=full` gebruiken het release-checks-pakketartefact.

### Vitest

De Vitest-box is de handmatige `CI`-kind-workflow. Handmatige CI omzeilt bewust
changed scoping en forceert de normale testgrafiek voor de releasecandidate:
Linux Node-shards, gebundelde-Plugin-shards, kanaalcontracten, Node 22-
compatibiliteit, `check`, `check-additional`, build-smoke, docs-checks, Python
Skills, Windows, macOS, Android en Control UI i18n.

Gebruik deze box om te antwoorden: "is de source tree geslaagd voor de volledige normale testsuite?"
Dit is niet hetzelfde als release-pad-productvalidatie. Te bewaren bewijs:

- samenvatting van `Full Release Validation` die de gedispatchte `CI`-run-URL toont
- `CI`-run groen op de exacte doel-SHA
- mislukte of langzame shardnamen uit de CI-jobs bij onderzoek naar regressies
- Vitest-timingartefacten zoals `.artifacts/vitest-shard-timings.json` wanneer
  een run prestatieanalyse nodig heeft

Run handmatige CI alleen rechtstreeks wanneer de release deterministische normale CI nodig heeft, maar
niet de Docker-, QA Lab-, live-, cross-OS- of pakket-boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

De Docker-box zit in `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus de release-modus
`install-smoke`-workflow. Deze valideert de releasecandidate via verpakte
Docker-omgevingen in plaats van alleen source-level tests.

Release-Dockerdekking omvat:

- volledige installatiesmoke met de trage Bun global install smoke ingeschakeld
- voorbereiding/hergebruik van root-Dockerfile-smoke-image per doel-SHA, met QR-,
  root/Gateway- en installer/Bun-smokejobs als afzonderlijke install-smoke-
  shards
- repository-E2E-lanes
- release-pad-Dockerchunks: `core`, `package-update-openai`,
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

Gebruik Docker-artefacten voordat je opnieuw runt. De release-pad-scheduler uploadt
`.artifacts/docker-tests/` met lane-logs, `summary.json`, `failures.json`,
fasetimings, scheduler-plan-JSON en rerun-commando's. Gebruik voor gericht herstel
`docker_lanes=<lane[,lane]>` op de herbruikbare live/E2E-workflow in plaats van
alle releasechunks opnieuw te runnen. Gegenereerde rerun-commando's bevatten eerdere
`package_artifact_run_id` en voorbereide Docker-image-invoer wanneer beschikbaar, zodat een
mislukte lane dezelfde tarball en GHCR-images kan hergebruiken.

### QA Lab

De QA Lab-box is ook onderdeel van `OpenClaw Release Checks`. Het is de agentic
gedrags- en kanaalniveau-releasegate, los van Vitest en Docker-
pakketmechanica.

Release-QA Lab-dekking omvat:

- mock-pariteitslane die de OpenAI-candidate-lane vergelijkt met de Opus 4.6-
  baseline met het agentic parity pack
- snel live Matrix-QA-profiel met de omgeving `qa-live-shared`
- live Telegram-QA-lane met Convex CI-credentialleases
- `pnpm qa:otel:smoke` wanneer release-telemetrie expliciet lokaal bewijs nodig heeft

Gebruik deze box om te antwoorden: "gedraagt de release zich correct in QA-scenario's en
live kanaalflows?" Bewaar de artefact-URL's voor pariteit-, Matrix- en Telegram-
lanes bij het goedkeuren van de release. Volledige Matrix-dekking blijft beschikbaar als een
handmatige sharded QA-Lab-run in plaats van de standaard release-kritieke lane.

### Pakket

De pakket-box is de gate voor het installeerbare product. Deze wordt ondersteund door
`Package Acceptance` en de resolver
`scripts/resolve-openclaw-package-candidate.mjs`. De resolver normaliseert een
candidate naar de `package-under-test`-tarball die door Docker-E2E wordt gebruikt, valideert
de pakket-inventaris, legt de pakketversie en SHA-256 vast en houdt de
workflow-harness-ref gescheiden van de pakket-source-ref.

Ondersteunde candidate-bronnen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-release-
  versie
- `source=ref`: pak een vertrouwde `package_ref`-branch, tag of volledige commit-SHA
  met de geselecteerde `workflow_ref`-harness
- `source=url`: download een HTTPS-`.tgz` met vereiste `package_sha256`
- `source=artifact`: hergebruik een `.tgz` die door een andere GitHub Actions-run is geüpload

`OpenClaw Release Checks` runt Package Acceptance met `source=artifact`, het
voorbereide releasepakketartefact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` en
`telegram_mode=mock-openai`. Package Acceptance houdt migratie, update, opschoning van verouderde
Plugin-afhankelijkheden, offline Plugin-fixtures, Plugin-update en Telegram-
pakket-QA tegen dezelfde opgeloste tarball. De upgradematrix dekt elke stabiele npm-gepubliceerde baseline van `2026.4.23` tot en met `latest`; gebruik
Package Acceptance met `source=npm` voor een al uitgebrachte candidate, of
`source=ref`/`source=artifact` voor een SHA-onderbouwde lokale npm-tarball vóór
publicatie. Het is de GitHub-native
vervanging voor het grootste deel van de pakket/update-dekking waarvoor eerder
Parallels nodig was. Cross-OS-releasechecks blijven belangrijk voor OS-specifieke onboarding,
installer- en platformgedrag, maar pakket/update-productvalidatie moet
Package Acceptance verkiezen.

De canonieke checklist voor update- en Plugin-validatie is
[Updates en Plugins testen](/nl/help/testing-updates-plugins). Gebruik deze bij het
bepalen welke lokale, Docker-, Package Acceptance- of release-check-lane een
Plugin-install/update, doctor-opruiming of wijziging in gepubliceerde-pakketmigratie bewijst.
Uitputtende gepubliceerde updatemigratie vanaf elk stabiel `2026.4.23+`-pakket is
een aparte handmatige `Update Migration`-workflow, geen onderdeel van Full Release CI.

Legacy pakketacceptatie-tolerantie is bewust tijdgebonden. Pakketten tot en met
`2026.4.25` mogen het compatibiliteitspad gebruiken voor metadatagaten die al naar
npm zijn gepubliceerd: private QA-inventarisitems die ontbreken in de tarball, ontbrekende
`gateway install --wrapper`, ontbrekende patchbestanden in de uit tarball afgeleide git-
fixture, ontbrekende persistente `update.channel`, legacy Plugin-install-record-
locaties, ontbrekende marketplace-install-record-persistentie en config-metadata-
migratie tijdens `plugins update`. Het gepubliceerde `2026.4.26`-pakket mag waarschuwen
voor lokale build-metadata-stampbestanden die al zijn geleverd. Latere pakketten
moeten voldoen aan de moderne pakketcontracten; diezelfde gaten laten release-
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

- `smoke`: snelle pakketinstallatie/kanaal/agent, Gateway-netwerk en config-
  reload-lanes
- `package`: install/update/Plugin-pakketcontracten zonder live ClawHub; dit is de release-check-
  standaard
- `product`: `package` plus MCP-kanalen, cron/subagent-opruiming, OpenAI-web-
  zoekopdracht en OpenWebUI
- `full`: Docker-release-padchunks met OpenWebUI
- `custom`: exacte `docker_lanes`-lijst voor gerichte reruns

Voor package-kandidaat-Telegram-bewijs schakel je `telegram_mode=mock-openai` of
`telegram_mode=live-frontier` in op Package Acceptance. De workflow geeft de
opgeloste `package-under-test`-tarball door aan de Telegram-lane; de zelfstandige
Telegram-workflow accepteert nog steeds een gepubliceerde npm-specificatie voor controles na publicatie.

## Release-publicatieautomatisering

`OpenClaw Release Publish` is het normale muterende ingangspunt voor publicatie. Het
orkestreert de trusted-publisher-workflows in de volgorde die de release nodig heeft:

1. Check de release-tag uit en bepaal de commit-SHA ervan.
2. Controleer of de tag bereikbaar is vanaf `main` of `release/*`.
3. Voer `pnpm plugins:sync:check` uit.
4. Dispatch `Plugin NPM Release` met `publish_scope=all-publishable` en
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` met dezelfde scope en SHA.
6. Dispatch `OpenClaw NPM Release` met de release-tag, npm dist-tag en
   opgeslagen `preflight_run_id`.

Voorbeeld voor beta-publicatie:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Voorbeeld voor alpha-publicatie:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-alpha.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=alpha
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
alleen voor gerichte reparatie of herpublicatie. Geef voor een geselecteerde Plugin-reparatie
`plugin_publish_scope=selected` en `plugins=@openclaw/name` door aan
`OpenClaw Release Publish`, of dispatch de onderliggende workflow rechtstreeks wanneer het
OpenClaw-pakket niet mag worden gepubliceerd.

## NPM-workflowinvoer

`OpenClaw NPM Release` accepteert deze door operators beheerde invoer:

- `tag`: vereiste release-tag zoals `v2026.4.2`, `v2026.4.2-1`, of
  `v2026.4.2-alpha.1` of `v2026.4.2-beta.1`; wanneer `preflight_only=true`, mag dit ook de huidige
  volledige 40-tekens commit-SHA van de workflow-branch zijn voor preflight die alleen valideert
- `preflight_only`: `true` alleen voor validatie/build/package, `false` voor het
  echte publicatiepad
- `preflight_run_id`: vereist op het echte publicatiepad zodat de workflow de
  voorbereide tarball uit de succesvolle preflight-run hergebruikt
- `npm_dist_tag`: npm-doeltag voor het publicatiepad; standaard `beta`

`OpenClaw Release Publish` accepteert deze door operators beheerde invoer:

- `tag`: vereiste release-tag; moet al bestaan
- `preflight_run_id`: succesvolle `OpenClaw NPM Release`-preflight-run-id;
  vereist wanneer `publish_openclaw_npm=true`
- `npm_dist_tag`: npm-doeltag voor het OpenClaw-pakket
- `plugin_publish_scope`: standaard `all-publishable`; gebruik `selected` alleen
  voor gericht reparatiewerk
- `plugins`: kommagescheiden `@openclaw/*`-pakketnamen wanneer
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: standaard `true`; stel alleen in op `false` wanneer je de
  workflow gebruikt als alleen-Plugin-reparatieorkestrator

`OpenClaw Release Checks` accepteert deze door operators beheerde invoer:

- `ref`: branch, tag of volledige commit-SHA om te valideren. Controles met geheimen
  vereisen dat de opgeloste commit bereikbaar is vanaf een OpenClaw-branch of
  release-tag.

Regels:

- Stabiele en correctie-tags mogen publiceren naar `beta` of `latest`
- Alpha-prerelease-tags mogen alleen naar `alpha` publiceren
- Beta-prerelease-tags mogen alleen naar `beta` publiceren
- Voor `OpenClaw NPM Release` is volledige commit-SHA-invoer alleen toegestaan wanneer
  `preflight_only=true`
- `OpenClaw Release Checks` en `Full Release Validation` zijn altijd
  alleen voor validatie
- Het echte publicatiepad moet dezelfde `npm_dist_tag` gebruiken als tijdens preflight;
  de workflow controleert die metadata voordat publicatie doorgaat

## Stabiele npm-releasevolgorde

Wanneer je een stabiele npm-release maakt:

1. Voer `OpenClaw NPM Release` uit met `preflight_only=true`
   - Voordat er een tag bestaat, mag je de huidige volledige commit-SHA van de workflow-branch
     gebruiken voor een validatie-only dry run van de preflight-workflow
2. Kies `npm_dist_tag=beta` voor de normale beta-first flow, of `latest` alleen
   wanneer je bewust rechtstreeks stabiel wilt publiceren
3. Voer `Full Release Validation` uit op de release-branch, release-tag of volledige
   commit-SHA wanneer je normale CI plus live promptcache, Docker, QA Lab,
   Matrix en Telegram-dekking vanuit één handmatige workflow wilt
4. Als je bewust alleen de deterministische normale testgraaf nodig hebt, voer dan in plaats daarvan de
   handmatige `CI`-workflow uit op de release-ref
5. Sla de succesvolle `preflight_run_id` op
6. Voer `OpenClaw Release Publish` uit met dezelfde `tag`, dezelfde `npm_dist_tag`,
   en de opgeslagen `preflight_run_id`; deze publiceert geëxternaliseerde plugins naar npm
   en ClawHub voordat het OpenClaw-npm-pakket wordt gepromoot
7. Als de release op `beta` is geland, gebruik dan de private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`-workflow
   om die stabiele versie van `beta` naar `latest` te promoveren
8. Als de release bewust rechtstreeks naar `latest` is gepubliceerd en `beta`
   onmiddellijk dezelfde stabiele build moet volgen, gebruik dan dezelfde private
   workflow om beide dist-tags naar de stabiele versie te laten wijzen, of laat de geplande
   zelfherstellende sync `beta` later verplaatsen

De dist-tag-mutatie staat in de private repo voor beveiliging, omdat deze nog steeds
`NPM_TOKEN` vereist, terwijl de publieke repo alleen OIDC-publicatie gebruikt.

Zo blijven het directe publicatiepad en het beta-first promotiepad beide
gedocumenteerd en zichtbaar voor operators.

Als een maintainer moet terugvallen op lokale npm-authenticatie, voer dan alle 1Password
CLI-(`op`)-commando's alleen uit binnen een toegewijde tmux-sessie. Roep `op` niet
rechtstreeks aan vanuit de shell van de hoofdagent; door dit binnen tmux te houden blijven prompts,
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

Maintainers gebruiken de private release-documentatie in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
voor het daadwerkelijke runbook.

## Gerelateerd

- [Releasekanalen](/nl/install/development-channels)
