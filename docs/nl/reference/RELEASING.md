---
read_when:
    - Zoeken naar definities voor openbare uitgavekanalen
    - Releasevalidatie of pakketacceptatie uitvoeren
    - Op zoek naar versienaamgeving en cadans
summary: Releasekanalen, operatorchecklist, validatieboxen, versienaamgeving en cadans
title: Releasebeleid
x-i18n:
    generated_at: "2026-05-07T13:26:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw heeft drie openbare releasekanalen:

- stable: getagde releases die standaard naar npm `beta` publiceren, of naar npm `latest` wanneer dat expliciet wordt gevraagd
- beta: prerelease-tags die naar npm `beta` publiceren
- dev: de bewegende kop van `main`

## Versienaamgeving

- Versie van stabiele release: `YYYY.M.D`
  - Git-tag: `vYYYY.M.D`
- Versie van stabiele correctierelease: `YYYY.M.D-N`
  - Git-tag: `vYYYY.M.D-N`
- Versie van beta-prerelease: `YYYY.M.D-beta.N`
  - Git-tag: `vYYYY.M.D-beta.N`
- Vul maand of dag niet met nullen aan
- `latest` betekent de huidige gepromote stabiele npm-release
- `beta` betekent het huidige beta-installatiedoel
- Stabiele en stabiele correctiereleases publiceren standaard naar npm `beta`; release-operators kunnen expliciet `latest` als doel kiezen, of later een gecontroleerde beta-build promoveren
- Elke stabiele OpenClaw-release levert het npm-pakket en de macOS-app samen;
  beta-releases valideren en publiceren normaal eerst het npm-/pakketpad, waarbij
  het bouwen/ondertekenen/notariseren van de Mac-app voor stabiel wordt gereserveerd tenzij expliciet gevraagd

## Releasecadans

- Releases bewegen beta-first
- Stabiel volgt pas nadat de nieuwste beta is gevalideerd
- Maintainers maken releases normaal vanaf een `release/YYYY.M.D`-branch die is gemaakt
  vanaf de huidige `main`, zodat releasevalidatie en fixes nieuwe
  ontwikkeling op `main` niet blokkeren
- Als een beta-tag is gepusht of gepubliceerd en een fix nodig heeft, maken maintainers
  de volgende `-beta.N`-tag in plaats van de oude beta-tag te verwijderen of opnieuw te maken
- Gedetailleerde releaseprocedure, goedkeuringen, referenties en herstelnotities zijn
  alleen voor maintainers

## Checklist voor release-operators

Deze checklist is de openbare vorm van de releaseflow. Privéreferenties,
ondertekening, notarisatie, dist-tag-herstel en details voor noodterugdraaiing blijven in
het release-runbook dat alleen voor maintainers is.

1. Begin vanaf de huidige `main`: haal de nieuwste wijzigingen op, bevestig dat de doelcommit is gepusht,
   en bevestig dat de huidige `main`-CI groen genoeg is om ervan te branchen.
2. Herschrijf de bovenste `CHANGELOG.md`-sectie vanuit de echte commitgeschiedenis met
   `/changelog`, houd vermeldingen gebruikersgericht, commit dit, push dit, en rebase/pull
   nog een keer voordat je een branch maakt.
3. Controleer releasecompatibiliteitsrecords in
   `src/plugins/compat/registry.ts` en
   `src/commands/doctor/shared/deprecation-compat.ts`. Verwijder verlopen
   compatibiliteit alleen wanneer het upgradepad gedekt blijft, of leg vast waarom deze
   bewust wordt meegenomen.
4. Maak `release/YYYY.M.D` vanaf de huidige `main`; doe normaal releasewerk niet
   rechtstreeks op `main`.
5. Verhoog elke vereiste versielocatie voor de beoogde tag, voer
   `pnpm plugins:sync` uit zodat publiceerbare Plugin-pakketten de releaseversie
   en compatibiliteitsmetadata delen, en voer daarna de lokale deterministische preflightcontrole uit:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, en
   `pnpm release:check`.
6. Voer `OpenClaw NPM Release` uit met `preflight_only=true`. Voordat er een tag bestaat,
   is een volledige release-branch-SHA van 40 tekens toegestaan voor een preflightcontrole
   die alleen valideert. Bewaar de succesvolle `preflight_run_id`.
7. Start alle pre-releasetests met `Full Release Validation` voor de
   release-branch, tag of volledige commit-SHA. Dit is het ene handmatige toegangspunt
   voor de vier grote release-testboxen: Vitest, Docker, QA Lab en Package.
8. Als validatie mislukt, fix dit op de release-branch en voer opnieuw het kleinste mislukte
   bestand, kanaal, workflow-job, pakketprofiel, provider of model-allowlist uit die
   de fix bewijst. Voer de volledige paraplu alleen opnieuw uit wanneer het gewijzigde oppervlak
   eerder bewijs verouderd maakt.
9. Voor beta tag je `vYYYY.M.D-beta.N`, daarna voer je `OpenClaw Release Publish` uit vanaf
   de overeenkomende `release/YYYY.M.D`-branch. Deze verifieert `pnpm plugins:sync:check`,
   dispatcht alle publiceerbare Plugin-pakketten parallel naar npm en dezelfde set naar
   ClawHub, en promoveert daarna het voorbereide OpenClaw npm-preflightartefact
   met de overeenkomende dist-tag zodra publicatie van de Plugin naar npm slaagt.
   Publiceren naar ClawHub kan nog actief zijn terwijl OpenClaw naar npm publiceert, maar de
   release-publicatieworkflow eindigt pas wanneer beide publicatiepaden voor Plugins en
   het OpenClaw npm-publicatiepad succesvol zijn voltooid. Voer na publicatie
   de post-publicatiepakketacceptatie uit tegen het gepubliceerde pakket
   `openclaw@YYYY.M.D-beta.N` of
   `openclaw@beta`. Als een gepushte of gepubliceerde prerelease een fix nodig heeft,
   maak dan het volgende overeenkomende prereleasenummer; verwijder of herschrijf de oude
   prerelease niet.
10. Voor stabiel ga je alleen verder nadat de gecontroleerde beta of releasecandidate het
    vereiste validatiebewijs heeft. Stabiele npm-publicatie loopt ook via
    `OpenClaw Release Publish`, waarbij het succesvolle preflightartefact opnieuw wordt gebruikt via
    `preflight_run_id`; gereedheid voor een stabiele macOS-release vereist ook de
    verpakte `.zip`, `.dmg`, `.dSYM.zip`, en bijgewerkte `appcast.xml` op `main`.
11. Voer na publicatie de npm-post-publicatieverificatie uit, optioneel de zelfstandige
    gepubliceerde-npm Telegram E2E wanneer je post-publicatiekanaalbewijs nodig hebt,
    dist-tag-promotie wanneer nodig, GitHub-release-/prereleasenotities vanuit de
    volledige overeenkomende `CHANGELOG.md`-sectie, en de stappen voor de releaseaankondiging.

## Release-preflight

- Voer `pnpm check:test-types` uit vóór de release-preflight zodat test-TypeScript
  ook buiten de snellere lokale `pnpm check`-gate gedekt blijft
- Voer `pnpm check:architecture` uit vóór de release-preflight zodat de bredere
  importcyclus- en architectuurgrenscontroles groen zijn buiten de snellere lokale gate
- Voer `pnpm build && pnpm ui:build` uit vóór `pnpm release:check` zodat de verwachte
  `dist/*`-releaseartefacten en de Control UI-bundel bestaan voor de
  pakketvalidatiestap
- Voer `pnpm plugins:sync` uit na de rootversieverhoging en vóór het taggen. Dit
  werkt publiceerbare pluginpakketversies, OpenClaw peer-/API-compatibiliteitsmetadata,
  buildmetadata en pluginchangelog-stubs bij zodat ze overeenkomen met de core
  releaseversie. `pnpm plugins:sync:check` is de niet-mutaterende releasebewaker;
  de publicatieworkflow faalt vóór enige registry-mutatie als deze stap is
  vergeten.
- Voer de handmatige `Full Release Validation`-workflow uit vóór releasegoedkeuring om
  alle pre-release testboxes vanuit één entrypoint te starten. Deze accepteert een branch,
  tag of volledige commit-SHA, dispatcht handmatig `CI`, en dispatcht
  `OpenClaw Release Checks` voor installatiesmoke, pakketacceptatie, cross-OS
  pakketcontroles, QA Lab-pariteit, Matrix- en Telegram-lanes. Stabiele/standaardruns
  houden uitputtende live/E2E- en Docker release-path soak achter
  `run_release_soak=true`; `release_profile=full` forceert soak aan. Met
  `release_profile=full` en `rerun_group=all` voert deze ook pakket-Telegram
  E2E uit tegen het `release-package-under-test`-artefact uit releasechecks.
  Geef `npm_telegram_package_spec` op na publicatie wanneer dezelfde
  Telegram E2E ook het gepubliceerde npm-pakket moet bewijzen. Geef
  `package_acceptance_package_spec` op na publicatie wanneer Package Acceptance
  zijn pakket-/updatematrix moet uitvoeren tegen het verzonden npm-pakket in plaats
  van het SHA-gebouwde artefact. Geef
  `evidence_package_spec` op wanneer het private bewijstrapport moet aantonen dat de
  validatie overeenkomt met een gepubliceerd npm-pakket zonder Telegram E2E te forceren.
  Voorbeeld:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Voer de handmatige `Package Acceptance`-workflow uit wanneer je zijkanaalbewijs
  wilt voor een pakketkandidaat terwijl releasewerk doorgaat. Gebruik `source=npm` voor
  `openclaw@beta`, `openclaw@latest` of een exacte releaseversie; `source=ref`
  om een vertrouwde `package_ref`-branch/tag/SHA te pakken met de huidige
  `workflow_ref`-harness; `source=url` voor een HTTPS-tarball met een vereiste
  SHA-256; of `source=artifact` voor een tarball die door een andere GitHub
  Actions-run is geüpload. De workflow herleidt de kandidaat tot
  `package-under-test`, hergebruikt de Docker E2E-releasescheduler tegen die
  tarball, en kan Telegram QA tegen dezelfde tarball uitvoeren met
  `telegram_mode=mock-openai` of `telegram_mode=live-frontier`. Wanneer de
  geselecteerde Docker-lanes `published-upgrade-survivor` bevatten, is het
  pakketartefact de kandidaat en selecteert `published_upgrade_survivor_baseline`
  de gepubliceerde baseline. `update-restart-auth` gebruikt het kandidaatpakket als
  zowel de geïnstalleerde CLI als package-under-test, zodat het pad voor managed
  restart van de updateopdracht van de kandidaat wordt getest.
  Voorbeeld: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Veelgebruikte profielen:
  - `smoke`: install/channel/agent-, gatewaynetwerk- en config-herlaadlanes
  - `package`: artefact-native pakket-/update-/restart-/pluginlanes zonder OpenWebUI of live ClawHub
  - `product`: pakketprofiel plus MCP-kanalen, cron-/subagent-opruiming,
    OpenAI web search en OpenWebUI
  - `full`: Docker release-path-chunks met OpenWebUI
  - `custom`: exacte `docker_lanes`-selectie voor een gerichte rerun
- Voer de handmatige `CI`-workflow rechtstreeks uit wanneer je alleen volledige normale CI-dekking
  nodig hebt voor de releasekandidaat. Handmatige CI-dispatches omzeilen changed
  scoping en forceren de Linux Node-shards, bundled-plugin-shards, channel
  contracts, Node 22-compatibiliteit, `check`, `check-additional`, buildsmoke,
  docscontroles, Python Skills, Windows, macOS, Android en Control UI i18n
  lanes.
  Voorbeeld: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Voer `pnpm qa:otel:smoke` uit bij het valideren van releasetelemetrie. Dit test
  QA-lab via een lokale OTLP/HTTP-ontvanger en verifieert de geëxporteerde trace
  span-namen, begrensde attributen en redactie van inhoud/identifiers zonder
  Opik, Langfuse of een andere externe collector te vereisen.
- Voer `pnpm release:check` uit vóór elke getagde release
- Voer `OpenClaw Release Publish` uit voor de muterende publicatiereeks nadat de
  tag bestaat. Dispatch deze vanaf `release/YYYY.M.D` (of `main` wanneer een
  main-bereikbare tag wordt gepubliceerd), geef de releasetag en succesvolle OpenClaw npm
  `preflight_run_id` door, en behoud de standaard plugin-publicatiescope
  `all-publishable` tenzij je bewust een gerichte reparatie uitvoert. De
  workflow serialiseert plugin npm-publicatie, plugin ClawHub-publicatie en OpenClaw
  npm-publicatie zodat het corepakket niet vóór de geëxternaliseerde
  plugins wordt gepubliceerd.
- Releasechecks draaien nu in een aparte handmatige workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` voert ook de QA Lab mockpariteitslane plus het snelle
  live Matrix-profiel en de Telegram QA-lane uit vóór releasegoedkeuring. De live
  lanes gebruiken de `qa-live-shared`-omgeving; Telegram gebruikt ook Convex CI
  credentialleases. Voer de handmatige `QA-Lab - All Lanes`-workflow uit met
  `matrix_profile=all` en `matrix_shards=true` wanneer je de volledige Matrix
  transport-, media- en E2EE-inventaris parallel wilt.
- Cross-OS runtimevalidatie voor installatie en upgrade is onderdeel van publieke
  `OpenClaw Release Checks` en `Full Release Validation`, die de
  herbruikbare workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` rechtstreeks aanroepen
- Deze splitsing is bewust: houd het echte npm-releasepad kort,
  deterministisch en artefactgericht, terwijl tragere livechecks in hun
  eigen lane blijven zodat ze publicatie niet vertragen of blokkeren
- Releasechecks met secrets moeten via `Full Release
Validation` of vanaf de `main`/release-workflowref worden gedispatcht zodat workflowlogica en
  secrets gecontroleerd blijven
- `OpenClaw Release Checks` accepteert een branch, tag of volledige commit-SHA zolang
  de opgeloste commit bereikbaar is vanaf een OpenClaw-branch of releasetag
- `OpenClaw NPM Release` validatie-only preflight accepteert ook de huidige
  volledige workflow-branch commit-SHA van 40 tekens zonder een gepushte tag te vereisen
- Dat SHA-pad is alleen voor validatie en kan niet worden gepromoveerd tot een echte publicatie
- In SHA-modus synthetiseert de workflow `v<package.json version>` alleen voor de
  pakketmetadatacontrole; echte publicatie vereist nog steeds een echte releasetag
- Beide workflows houden het echte publicatie- en promotiepad op GitHub-hosted
  runners, terwijl het niet-mutaterende validatiepad de grotere
  Blacksmith Linux-runners kan gebruiken
- Die workflow voert
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  uit met zowel `OPENAI_API_KEY` als `ANTHROPIC_API_KEY` workflowsecrets
- npm release-preflight wacht niet langer op de aparte releasechecks-lane
- Voer `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (of de overeenkomende beta-/correctietag) uit vóór goedkeuring
- Voer na npm-publicatie
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (of de overeenkomende beta-/correctieversie) uit om het gepubliceerde registry-
  installatiepad in een verse tijdelijke prefix te verifiëren
- Voer na een beta-publicatie `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  uit om installed-package onboarding, Telegram-configuratie en echte Telegram E2E
  tegen het gepubliceerde npm-pakket te verifiëren met de gedeelde geleasede Telegram credential
  pool. Lokale eenmalige maintainer-runs mogen de Convex-vars weglaten en de drie
  `OPENCLAW_QA_TELEGRAM_*` env-credentials rechtstreeks doorgeven.
- Gebruik `pnpm release:beta-smoke -- --beta betaN` om de volledige post-publish beta smoke vanaf een maintainermachine uit te voeren. De helper voert Parallels npm update-/fresh-targetvalidatie uit, dispatcht `NPM Telegram Beta E2E`, pollt de exacte workflowrun, downloadt het artefact en print het Telegram-rapport.
- Maintainers kunnen dezelfde post-publishcontrole vanuit GitHub Actions uitvoeren via de
  handmatige `NPM Telegram Beta E2E`-workflow. Deze is bewust alleen handmatig en
  draait niet bij elke merge.
- Maintainer-releaseautomatisering gebruikt nu preflight-dan-promote:
  - echte npm-publicatie moet slagen met een succesvolle npm `preflight_run_id`
  - de echte npm-publicatie moet worden gedispatcht vanaf dezelfde `main`- of
    `release/YYYY.M.D`-branch als de succesvolle preflightrun
  - stabiele npm-releases gebruiken standaard `beta`
  - stabiele npm-publicatie kan expliciet op `latest` mikken via workflowinput
  - tokengebaseerde npm dist-tag-mutatie staat nu in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    voor veiligheid, omdat `npm dist-tag add` nog steeds `NPM_TOKEN` nodig heeft terwijl de
    publieke repo OIDC-only publicatie behoudt
  - publieke `macOS Release` is alleen validatie; wanneer een tag alleen op een
    releasebranch staat maar de workflow vanaf `main` wordt gedispatcht, stel
    `public_release_branch=release/YYYY.M.D` in
  - echte private mac-publicatie moet slagen met succesvolle private mac
    `preflight_run_id` en `validate_run_id`
  - de echte publicatiepaden promoveren voorbereide artefacten in plaats van ze
    opnieuw te bouwen
- Voor stabiele correctiereleases zoals `YYYY.M.D-N` controleert de post-publish verifier
  ook hetzelfde temp-prefix upgradepad van `YYYY.M.D` naar `YYYY.M.D-N`
  zodat releasecorrecties oudere globale installaties niet stilletjes op de
  basisstabiele payload kunnen laten staan
- npm release-preflight faalt gesloten tenzij de tarball zowel
  `dist/control-ui/index.html` als een niet-lege `dist/control-ui/assets/`-payload bevat
  zodat we niet opnieuw een leeg browserdashboard verzenden
- Post-publishverificatie controleert ook dat gepubliceerde pluginentrypoints en
  pakketmetadata aanwezig zijn in de geïnstalleerde registry-layout. Een release die
  ontbrekende pluginruntime-payloads verzendt, faalt de postpublish verifier en
  kan niet naar `latest` worden gepromoveerd.
- `pnpm test:install:smoke` handhaaft ook het npm pack `unpackedSize`-budget op
  de kandidaat-updatetarball, zodat installer-e2e accidentele pakketgroei vangt
  vóór het releasepublicatiepad
- Als het releasewerk CI-planning, extension timing manifests of
  extension-testmatrices heeft geraakt, regenereer en review dan de planner-owned
  `plugin-prerelease-extension-shard`-matrixoutputs uit
  `.github/workflows/plugin-prerelease.yml` vóór goedkeuring, zodat releasenotes geen
  verouderde CI-layout beschrijven
- Gereedheid voor stabiele macOS-release omvat ook de updater-oppervlakken:
  - de GitHub-release moet uiteindelijk de verpakte `.zip`, `.dmg` en `.dSYM.zip` bevatten
  - `appcast.xml` op `main` moet na publicatie naar de nieuwe stabiele zip wijzen
  - de verpakte app moet een niet-debug bundle-id, een niet-lege Sparkle feed
    URL en een `CFBundleVersion` op of boven de canonieke Sparkle build floor
    voor die releaseversie behouden

## Release-testboxes

`Full Release Validation` is hoe operators alle pre-releasetests vanuit
één entrypoint starten. Gebruik voor vastgezette commitbewijslast op een snel veranderende branch de
helper zodat elke childworkflow vanaf een tijdelijke branch draait die op de doel-
SHA is vastgezet:

```bash
pnpm ci:full-release --sha <full-sha>
```

De helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation`
vanaf die branch met `ref=<sha>`, verifieert dat elke childworkflow-`headSha`
overeenkomt met het doel, en verwijdert daarna de tijdelijke branch. Dit voorkomt dat per ongeluk een
nieuwere `main`-childrun wordt bewezen.

Voor validatie van een releasebranch of tag voer je deze uit vanaf de vertrouwde `main`-workflow
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
bovenliggend `release-package-under-test`-artefact voor pakketgerichte controles voor, en
start zelfstandige pakket-Telegram-E2E wanneer `release_profile=full` met
`rerun_group=all` of wanneer `npm_telegram_package_spec` is ingesteld. `OpenClaw Release
Checks` waaiert daarna uit naar installatiesmoke, cross-OS releasecontroles, live/E2E Docker
release-paddekking wanneer soak is ingeschakeld, Package Acceptance met Telegram
pakket-QA, QA Lab-pariteit, live Matrix en live Telegram. Een volledige run is alleen acceptabel wanneer de
samenvatting van `Full Release Validation`
`normal_ci` en `release_checks` als succesvol toont. In full/all-modus
moet het `npm_telegram`-kind ook succesvol zijn; buiten full/all wordt het overgeslagen
tenzij een gepubliceerde `npm_telegram_package_spec` is opgegeven. De uiteindelijke
verificatiesamenvatting bevat tabellen met traagste jobs voor elke kind-run, zodat de release
manager het huidige kritieke pad kan zien zonder logs te downloaden.
Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
complete fasematrix, exacte workflowjobnamen, verschillen tussen stabiel en volledig profiel,
artefacten en gerichte rerun-handles.
Kindworkflows worden gestart vanaf de vertrouwde ref die `Full Release
Validation` uitvoert, normaal `--ref main`, zelfs wanneer de doel-`ref` naar een
oudere releasetak of tag wijst. Er is geen aparte Full Release Validation
workflow-ref-invoer; kies de vertrouwde harness door de workflow-run-ref te kiezen.
Gebruik geen `--ref main -f ref=<sha>` voor exact commitbewijs op bewegende `main`;
ruwe commit-SHA's kunnen geen workflow-dispatch-refs zijn, dus gebruik
`pnpm ci:full-release --sha <sha>` om de vastgepinde tijdelijke tak te maken.

Gebruik `release_profile` om live/provider-breedte te selecteren:

- `minimum`: snelste releasekritieke OpenAI/core live- en Docker-pad
- `stable`: minimum plus stabiele provider/backend-dekking voor releasegoedkeuring
- `full`: stable plus brede adviserende provider/media-dekking

Gebruik `run_release_soak=true` met `stable` wanneer de releaseblokkerende lanes
groen zijn en je de uitputtende live/E2E, Docker release-pad- en
begrensde gepubliceerde upgrade-survivor-sweep wilt uitvoeren vóór promotie. Die sweep dekt
de laatste vier stabiele pakketten plus vastgepinde `2026.4.23`- en `2026.5.2`-
baselines plus oudere `2026.4.15`-dekking, waarbij dubbele baselines worden verwijderd en
elke baseline in zijn eigen Docker-runnerjob wordt geshard. `full` impliceert
`run_release_soak=true`.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de doel-ref
eenmaal op te lossen als `release-package-under-test` en hergebruikt dat artefact in cross-OS,
Package Acceptance en release-pad-Docker-controles wanneer soak draait. Dit houdt
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

Gebruik de volledige paraplu niet als eerste rerun na een gerichte fix. Als één box
faalt, gebruik dan de mislukte kindworkflow, job, Docker-lane, pakketprofiel, model-
provider of QA-lane voor het volgende bewijs. Run de volledige paraplu alleen opnieuw wanneer
de fix gedeelde release-orkestratie heeft gewijzigd of eerder all-box-bewijs
verouderd heeft gemaakt. De uiteindelijke verifier van de paraplu controleert de vastgelegde kindworkflow-run-
id's opnieuw, dus nadat een kindworkflow succesvol opnieuw is uitgevoerd, run je alleen de mislukte
bovenliggende job `Verify full validation` opnieuw.

Geef voor begrensd herstel `rerun_group` door aan de paraplu. `all` is de echte
releasecandidate-run, `ci` draait alleen het normale CI-kind, `plugin-prerelease`
draait alleen het release-only plugin-kind, `release-checks` draait elke release-
box, en de smallere releasegroepen zijn `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` en `npm-telegram`.
Gerichte `npm-telegram`-reruns vereisen `npm_telegram_package_spec`; full/all-runs
met `release_profile=full` gebruiken het pakketartefact van release-checks. Gerichte
cross-OS-reruns kunnen `cross_os_suite_filter=windows/packaged-upgrade` of
een ander OS/suite-filter toevoegen. QA-release-check-fouten zijn adviserend; een QA-only
fout blokkeert releasevalidatie niet.

### Vitest

De Vitest-box is de handmatige `CI`-kindworkflow. Handmatige CI omzeilt bewust
changed-scoping en forceert de normale testgrafiek voor de releasecandidate:
Linux Node-shards, bundled-plugin-shards, kanaalcontracten, Node 22-
compatibiliteit, `check`, `check-additional`, buildsmoke, docs-controles, Python
Skills, Windows, macOS, Android en Control UI-i18n.

Gebruik deze box om te beantwoorden: "is de source tree geslaagd voor de volledige normale testsuite?"
Dit is niet hetzelfde als release-pad-productvalidatie. Bewijs om te bewaren:

- `Full Release Validation`-samenvatting die de gestarte `CI`-run-URL toont
- `CI`-run groen op de exacte doel-SHA
- namen van mislukte of trage shards uit de CI-jobs bij regressieonderzoek
- Vitest-timingartefacten zoals `.artifacts/vitest-shard-timings.json` wanneer
  een run prestatieanalyse nodig heeft

Run handmatige CI alleen direct wanneer de release deterministische normale CI nodig heeft, maar
niet de Docker-, QA Lab-, live-, cross-OS- of pakketboxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

De Docker-box leeft in `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus de release-mode
`install-smoke`-workflow. Deze valideert de releasecandidate via verpakte
Docker-omgevingen in plaats van alleen broncode-niveautests.

Release-Docker-dekking omvat:

- volledige installatiesmoke met de trage Bun global-install-smoke ingeschakeld
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
- gesplitste bundled-plugin-install/uninstall-lanes
  `bundled-plugin-install-uninstall-0` tot en met
  `bundled-plugin-install-uninstall-23`
- live/E2E-providersuites en Docker live-modeldekking wanneer releasecontroles
  live suites omvatten

Gebruik Docker-artefacten voordat je opnieuw runt. De release-pad-scheduler uploadt
`.artifacts/docker-tests/` met lane-logs, `summary.json`, `failures.json`,
fasetimings, schedulerplan-JSON en rerun-commando's. Gebruik voor gericht herstel
`docker_lanes=<lane[,lane]>` op de herbruikbare live/E2E-workflow in plaats van
alle releasechunks opnieuw te draaien. Gegenereerde rerun-commando's bevatten eerdere
`package_artifact_run_id` en voorbereide Docker-image-invoer wanneer beschikbaar, zodat een
mislukte lane dezelfde tarball en GHCR-images kan hergebruiken.

### QA Lab

De QA Lab-box is ook onderdeel van `OpenClaw Release Checks`. Dit is de agentische
gedrags- en kanaalniveau-releasegate, los van Vitest en Docker-
pakketmechanica.

Release-QA Lab-dekking omvat:

- mock-parity-lane die de OpenAI-candidate-lane vergelijkt met de Opus 4.6-
  baseline met behulp van het agentische parity pack
- snel live Matrix-QA-profiel met de `qa-live-shared`-omgeving
- live Telegram-QA-lane met Convex CI-credentialleases
- `pnpm qa:otel:smoke` wanneer releasetelemetrie expliciet lokaal bewijs nodig heeft

Gebruik deze box om te beantwoorden: "gedraagt de release zich correct in QA-scenario's en
live kanaalflows?" Bewaar de artefact-URL's voor parity-, Matrix- en Telegram-
lanes wanneer je de release goedkeurt. Volledige Matrix-dekking blijft beschikbaar als een
handmatige gesharde QA-Lab-run in plaats van de standaard releasekritieke lane.

### Pakket

De pakketbox is de gate voor het installeerbare product. Deze wordt ondersteund door
`Package Acceptance` en de resolver
`scripts/resolve-openclaw-package-candidate.mjs`. De resolver normaliseert een
candidate naar de `package-under-test`-tarball die door Docker E2E wordt gebruikt, valideert
de pakketinventaris, legt de pakketversie en SHA-256 vast, en houdt de
workflow-harness-ref gescheiden van de pakketbron-ref.

Ondersteunde candidate-bronnen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-release-
  versie
- `source=ref`: pack een vertrouwde `package_ref`-tak, tag of volledige commit-SHA
  met de geselecteerde `workflow_ref`-harness
- `source=url`: download een HTTPS-`.tgz` met vereiste `package_sha256`
- `source=artifact`: hergebruik een `.tgz` die door een andere GitHub Actions-run is geüpload

`OpenClaw Release Checks` draait Package Acceptance met `source=artifact`, het
voorbereide releasepakketartefact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance houdt migratie, update,
configured-auth update restart, stale plugin dependency cleanup, offline plugin-
fixtures, plugin-update en Telegram-pakket-QA tegen dezelfde opgeloste
tarball. Blokkerende releasecontroles gebruiken de standaard laatst gepubliceerde pakket-
baseline; `run_release_soak=true` of
`release_profile=full` breidt uit naar elke stabiele npm-gepubliceerde baseline van
`2026.4.23` tot en met `latest` plus fixtures voor gemelde issues. Gebruik
Package Acceptance met `source=npm` voor een al verzonden candidate, of
`source=ref`/`source=artifact` voor een SHA-onderbouwde lokale npm-tarball vóór
publicatie. Het is de GitHub-native
vervanging voor de meeste pakket/update-dekking waarvoor eerder
Parallels nodig was. Cross-OS-releasecontroles blijven belangrijk voor OS-specifieke onboarding,
installer- en platformgedrag, maar pakket/update-productvalidatie moet
Package Acceptance verkiezen.

De canonieke checklist voor update- en pluginvalidatie is
[Updates en plugins testen](/nl/help/testing-updates-plugins). Gebruik deze wanneer je
bepaalt welke lokale, Docker-, Package Acceptance- of release-check-lane een
plugin-install/update, doctor-cleanup of gepubliceerde-pakketmigratiewijziging bewijst.
Uitputtende gepubliceerde update-migratie vanaf elk stabiel `2026.4.23+`-pakket is
een aparte handmatige `Update Migration`-workflow, geen onderdeel van Full Release CI.

Verouderde soepelheid voor pakketacceptatie is bewust in tijd begrensd. Pakketten tot en met
`2026.4.25` mogen het compatibiliteitspad gebruiken voor metadatagaten die al naar
npm zijn gepubliceerd: privé-QA-inventoryvermeldingen die ontbreken in de tarball, ontbrekende
`gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide git-fixture,
ontbrekende gepersisteerde `update.channel`, verouderde Plugin-installatierecordlocaties,
ontbrekende persistentie van marketplace-installatierecords, en migratie van configuratiemetadata
tijdens `plugins update`. Het gepubliceerde `2026.4.26`-pakket mag waarschuwen
voor metadatastempelbestanden van lokale builds die al zijn geleverd. Latere pakketten
moeten voldoen aan de moderne pakketcontracten; diezelfde gaten laten releasevalidatie
falen.

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

- `smoke`: snelle banen voor pakketinstallatie/kanaal/agent, Gateway-netwerk en
  configuratieherlaadacties
- `package`: contracten voor installeren/bijwerken/herstarten/Plugin-pakketten zonder live
  ClawHub; dit is de standaard voor releasecontroles
- `product`: `package` plus MCP-kanalen, opruimen van cron/subagent, OpenAI-webzoekopdrachten
  en OpenWebUI
- `full`: Docker-releasepadsegmenten met OpenWebUI
- `custom`: exacte `docker_lanes`-lijst voor gerichte herhalingen

Schakel voor Telegram-bewijs van pakketkandidaten `telegram_mode=mock-openai` of
`telegram_mode=live-frontier` in op Package Acceptance. De workflow geeft de
opgeloste `package-under-test`-tarball door aan de Telegram-baan; de zelfstandige
Telegram-workflow accepteert nog steeds een gepubliceerde npm-specificatie voor controles na publicatie.

## Automatisering voor releasepublicatie

`OpenClaw Release Publish` is het normale muterende ingangspunt voor publicatie. Het
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

Stabiele promotie direct naar `latest` is expliciet:

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

`OpenClaw NPM Release` accepteert deze door operators beheerde invoer:

- `tag`: vereiste releasetag zoals `v2026.4.2`, `v2026.4.2-1` of
  `v2026.4.2-beta.1`; wanneer `preflight_only=true`, mag dit ook de huidige
  volledige 40-tekens workflow-branch-commit-SHA zijn voor preflight die alleen valideert
- `preflight_only`: `true` alleen voor validatie/build/pakket, `false` voor het
  echte publicatiepad
- `preflight_run_id`: vereist op het echte publicatiepad zodat de workflow de
  voorbereide tarball uit de geslaagde preflight-run hergebruikt
- `npm_dist_tag`: npm-doeltag voor het publicatiepad; standaard `beta`

`OpenClaw Release Publish` accepteert deze door operators beheerde invoer:

- `tag`: vereiste releasetag; moet al bestaan
- `preflight_run_id`: geslaagde `OpenClaw NPM Release` preflight-run-id;
  vereist wanneer `publish_openclaw_npm=true`
- `npm_dist_tag`: npm-doeltag voor het OpenClaw-pakket
- `plugin_publish_scope`: standaard `all-publishable`; gebruik `selected` alleen
  voor gericht herstelwerk
- `plugins`: door komma’s gescheiden `@openclaw/*`-pakketnamen wanneer
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: standaard `true`; zet op `false` alleen wanneer de
  workflow wordt gebruikt als orchestrator voor herstel van alleen Plugins

`OpenClaw Release Checks` accepteert deze door operators beheerde invoer:

- `ref`: branch, tag of volledige commit-SHA om te valideren. Controles met secrets
  vereisen dat de opgeloste commit bereikbaar is vanaf een OpenClaw-branch of
  releasetag.
- `run_release_soak`: kies voor uitputtende live/E2E-, Docker-releasepad- en
  all-since upgrade-survivor-soak op stabiele/standaard releasecontroles. Dit wordt
  afgedwongen door `release_profile=full`.

Regels:

- Stabiele tags en correctietags mogen naar `beta` of `latest` publiceren
- Beta-prereleasetags mogen alleen naar `beta` publiceren
- Voor `OpenClaw NPM Release` is volledige commit-SHA-invoer alleen toegestaan wanneer
  `preflight_only=true`
- `OpenClaw Release Checks` en `Full Release Validation` zijn altijd
  alleen-validatie
- Het echte publicatiepad moet dezelfde `npm_dist_tag` gebruiken als tijdens preflight;
  de workflow controleert die metadata voordat publiceren doorgaat

## Stabiele npm-releasereeks

Bij het maken van een stabiele npm-release:

1. Voer `OpenClaw NPM Release` uit met `preflight_only=true`
   - Voordat er een tag bestaat, mag je de huidige volledige workflow-branch-commit-SHA
     gebruiken voor een validatie-only dry run van de preflight-workflow
2. Kies `npm_dist_tag=beta` voor de normale beta-eerst-stroom, of `latest` alleen
   wanneer je bewust direct stabiel wilt publiceren
3. Voer `Full Release Validation` uit op de releasebranch, releasetag of volledige
   commit-SHA wanneer je normale CI plus live promptcache, Docker, QA Lab,
   Matrix en Telegram-dekking vanuit één handmatige workflow wilt
4. Als je bewust alleen de deterministische normale testgraph nodig hebt, voer dan in plaats daarvan de
   handmatige `CI`-workflow uit op de releaseref
5. Bewaar de geslaagde `preflight_run_id`
6. Voer `OpenClaw Release Publish` uit met dezelfde `tag`, dezelfde `npm_dist_tag`
   en de opgeslagen `preflight_run_id`; dit publiceert geëxternaliseerde Plugins naar npm
   en ClawHub voordat het OpenClaw npm-pakket wordt gepromoot
7. Als de release op `beta` is geland, gebruik dan de privéworkflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   om die stabiele versie van `beta` naar `latest` te promoveren
8. Als de release bewust direct naar `latest` is gepubliceerd en `beta`
   direct dezelfde stabiele build moet volgen, gebruik dan dezelfde privéworkflow
   om beide dist-tags naar de stabiele versie te laten wijzen, of laat de geplande
   self-healing-sync `beta` later verplaatsen

De dist-tag-mutatie staat in de privérepo om veiligheidsredenen, omdat deze nog steeds
`NPM_TOKEN` vereist, terwijl de publieke repo alleen OIDC-publicatie behoudt.

Zo blijven zowel het directe publicatiepad als het beta-eerst-promotiepad
gedocumenteerd en zichtbaar voor operators.

Als een maintainer moet terugvallen op lokale npm-authenticatie, voer dan alle 1Password
CLI (`op`)-commando’s alleen uit binnen een dedicated tmux-sessie. Roep `op` niet
rechtstreeks aan vanuit de shell van de hoofdagent; door het binnen tmux te houden blijven prompts,
waarschuwingen en OTP-afhandeling observeerbaar en worden herhaalde hostwaarschuwingen voorkomen.

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
