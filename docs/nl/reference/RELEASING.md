---
read_when:
    - Zoeken naar definities van openbare releasekanalen
    - Releasevalidatie of pakketacceptatie uitvoeren
    - Op zoek naar versiebenaming en cadans
summary: Releaselanes, operatorchecklist, validatieboxen, versienaamgeving en cadans
title: Releasebeleid
x-i18n:
    generated_at: "2026-05-05T01:49:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41886d3bb2f970e6a86944e5ff207b1b29b1b64b1f234d45f626fed19cf032b3
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw heeft drie publieke releasekanalen:

- stable: getagde releases die standaard naar npm `beta` publiceren, of naar npm `latest` wanneer expliciet aangevraagd
- beta: prerelease-tags die naar npm `beta` publiceren
- dev: de voortschrijdende head van `main`

## Versienaamgeving

- Stabiele releaseversie: `YYYY.M.D`
  - Git-tag: `vYYYY.M.D`
- Stabiele correctiereleaseversie: `YYYY.M.D-N`
  - Git-tag: `vYYYY.M.D-N`
- Bèta-prereleaseversie: `YYYY.M.D-beta.N`
  - Git-tag: `vYYYY.M.D-beta.N`
- Gebruik geen voorloopnul voor maand of dag
- `latest` betekent de huidige gepromote stabiele npm-release
- `beta` betekent het huidige bèta-installatiedoel
- Stabiele en stabiele correctiereleases publiceren standaard naar npm `beta`; release-operators kunnen expliciet `latest` als doel kiezen, of later een gecontroleerde bètaversie promoveren
- Elke stabiele OpenClaw-release levert het npm-pakket en de macOS-app samen;
  bèta-releases valideren en publiceren normaal eerst het npm-/pakketpad, waarbij
  bouwen/ondertekenen/notariseren van de Mac-app voor stabiele releases is gereserveerd, tenzij expliciet aangevraagd

## Releasecadans

- Releases gaan eerst via bèta
- Stabiel volgt pas nadat de nieuwste bèta is gevalideerd
- Maintainers maken releases normaal vanaf een `release/YYYY.M.D`-branch die is gemaakt
  vanaf de huidige `main`, zodat releasevalidatie en fixes nieuwe
  ontwikkeling op `main` niet blokkeren
- Als een bètatag is gepusht of gepubliceerd en een fix nodig heeft, maken maintainers
  de volgende `-beta.N`-tag in plaats van de oude bètatag te verwijderen of opnieuw te maken
- Gedetailleerde releaseprocedure, goedkeuringen, inloggegevens en herstelnotities zijn
  alleen voor maintainers

## Checklist voor release-operators

Deze checklist is de publieke vorm van de releaseflow. Privé-inloggegevens,
ondertekening, notarisatie, herstel van dist-tags en details voor noodrollback blijven in
het alleen-voor-maintainers release-runbook.

1. Begin vanaf de huidige `main`: haal de nieuwste wijzigingen op, bevestig dat de doelcommit is gepusht,
   en bevestig dat de huidige `main`-CI groen genoeg is om er een branch vanaf te maken.
2. Herschrijf de bovenste sectie van `CHANGELOG.md` op basis van echte commitgeschiedenis met
   `/changelog`, houd vermeldingen gebruikersgericht, commit dit, push dit, en rebase/pull
   nog één keer vóór het branchen.
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
   is een volledige release-branch-SHA van 40 tekens toegestaan voor alleen-validatie
   preflight. Bewaar de geslaagde `preflight_run_id`.
7. Start alle prerelease-tests met `Full Release Validation` voor de
   releasebranch, tag of volledige commit-SHA. Dit is het enige handmatige startpunt
   voor de vier grote release-testboxen: Vitest, Docker, QA Lab en Package.
8. Als validatie mislukt, fix dit op de releasebranch en voer opnieuw het kleinste mislukte
   bestand, de kleinste lane, workflowtaak, pakketprofiel, provider of model-allowlist uit die
   de fix bewijst. Voer de volledige paraplu alleen opnieuw uit wanneer het gewijzigde oppervlak
   eerder bewijs verouderd maakt.
9. Tag voor bèta `vYYYY.M.D-beta.N`, en voer daarna `OpenClaw Release Publish` uit vanaf
   de overeenkomende `release/YYYY.M.D`-branch. Dit verifieert `pnpm plugins:sync:check`,
   publiceert eerst alle publiceerbare Plugin-pakketten naar npm, publiceert dezelfde
   set vervolgens naar ClawHub als ClawPack npm-pack-tarballs, en promoot daarna het
   voorbereide OpenClaw npm-preflightartefact met de overeenkomende dist-tag. Voer na
   publicatie post-publish-pakketacceptatie uit tegen het gepubliceerde
   `openclaw@YYYY.M.D-beta.N`- of `openclaw@beta`-pakket. Als een gepushte of gepubliceerde
   prerelease een fix nodig heeft, maak dan het volgende overeenkomende prereleasenummer;
   verwijder of herschrijf de oude prerelease niet.
10. Ga voor stabiel alleen verder nadat de gecontroleerde bèta of releasecandidate het
    vereiste validatiebewijs heeft. Publicatie naar stabiele npm verloopt ook via
    `OpenClaw Release Publish`, waarbij het geslaagde preflightartefact via
    `preflight_run_id` wordt hergebruikt; gereedheid voor stabiele macOS-release vereist ook de
    verpakte `.zip`, `.dmg`, `.dSYM.zip` en bijgewerkte `appcast.xml` op `main`.
11. Voer na publicatie de npm-post-publishverificatie uit, optioneel de zelfstandige
    gepubliceerde-npm Telegram E2E wanneer je post-publish kanaalbewijs nodig hebt,
    dist-tagpromotie wanneer nodig, GitHub-release-/prereleasenotities uit de
    volledige overeenkomende `CHANGELOG.md`-sectie, en de stappen voor de releaseaankondiging.

## Release-preflight

- Voer `pnpm check:test-types` uit vóór de release-preflight zodat test-TypeScript
  gedekt blijft buiten de snellere lokale `pnpm check`-gate
- Voer `pnpm check:architecture` uit vóór de release-preflight zodat de bredere
  importcyclus- en architectuurgrenscontroles groen zijn buiten de snellere
  lokale gate
- Voer `pnpm build && pnpm ui:build` uit vóór `pnpm release:check` zodat de
  verwachte `dist/*`-releaseartefacten en Control UI-bundel bestaan voor de
  pakketvalidatiestap
- Voer `pnpm plugins:sync` uit na de root-versieverhoging en vóór het taggen. Het
  werkt publiceerbare pluginpakketversies, OpenClaw-peer-/API-compatibiliteitsmetadata,
  buildmetadata en pluginchangelog-stubs bij zodat ze overeenkomen met de
  core-releaseversie. `pnpm plugins:sync:check` is de niet-mutatieve releaseguard;
  de publicatieworkflow faalt vóór enige registry-mutatie als deze stap is
  vergeten.
- Voer de handmatige `Full Release Validation`-workflow uit vóór releasegoedkeuring
  om alle prerelease-testboxen vanuit één entrypoint te starten. Deze accepteert
  een branch, tag of volledige commit-SHA, dispatcht handmatige `CI`, en dispatcht
  `OpenClaw Release Checks` voor installatiesmoke, pakketacceptatie, cross-OS
  pakketcontroles, QA Lab-pariteit, Matrix- en Telegram-lanes. Stabiele/default-runs
  houden uitputtende live-/E2E- en Docker-releasepath-soak achter
  `run_release_soak=true`; `release_profile=full` forceert soak aan. Met
  `release_profile=full` en `rerun_group=all` voert het ook pakket-Telegram
  E2E uit tegen het `release-package-under-test`-artefact uit releasecontroles.
  Geef `npm_telegram_package_spec` op na publicatie wanneer dezelfde
  Telegram E2E ook het gepubliceerde npm-pakket moet bewijzen. Geef
  `package_acceptance_package_spec` op na publicatie wanneer Package Acceptance
  zijn pakket-/updatematrix moet uitvoeren tegen het verscheepte npm-pakket in
  plaats van het op SHA gebouwde artefact. Geef
  `evidence_package_spec` op wanneer het private bewijsrapport moet bewijzen dat de
  validatie overeenkomt met een gepubliceerd npm-pakket zonder Telegram E2E te
  forceren.
  Voorbeeld:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Voer de handmatige `Package Acceptance`-workflow uit wanneer je side-channel-bewijs
  wilt voor een pakketkandidaat terwijl releasewerk doorgaat. Gebruik `source=npm`
  voor `openclaw@beta`, `openclaw@latest` of een exacte releaseversie; `source=ref`
  om een vertrouwde `package_ref`-branch/tag/SHA te packen met de huidige
  `workflow_ref`-harness; `source=url` voor een HTTPS-tarball met een vereiste
  SHA-256; of `source=artifact` voor een tarball die door een andere GitHub
  Actions-run is geüpload. De workflow resolveert de kandidaat naar
  `package-under-test`, hergebruikt de Docker E2E-releasescheduler tegen die
  tarball, en kan Telegram QA tegen dezelfde tarball uitvoeren met
  `telegram_mode=mock-openai` of `telegram_mode=live-frontier`. Wanneer de
  geselecteerde Docker-lanes `published-upgrade-survivor` bevatten, is het
  pakketartefact de kandidaat en selecteert `published_upgrade_survivor_baseline`
  de gepubliceerde baseline.
  Voorbeeld: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Algemene profielen:
  - `smoke`: install/channel/agent-, gatewaynetwerk- en config-herlaadlanes
  - `package`: artefact-native pakket-/update-/pluginlanes zonder OpenWebUI of live ClawHub
  - `product`: pakketprofiel plus MCP-kanalen, cron-/subagent-opschoning,
    OpenAI-webzoekopdracht en OpenWebUI
  - `full`: Docker-releasepath-chunks met OpenWebUI
  - `custom`: exacte `docker_lanes`-selectie voor een gerichte rerun
- Voer de handmatige `CI`-workflow direct uit wanneer je alleen volledige normale
  CI-dekking voor de releasekandidaat nodig hebt. Handmatige CI-dispatches
  omzeilen changed-scoping en forceren de Linux Node-shards, gebundelde-plugin-shards,
  channel-contracten, Node 22-compatibiliteit, `check`, `check-additional`,
  buildsmoke, docs-controles, Python-skills, Windows, macOS, Android en Control UI
  i18n-lanes.
  Voorbeeld: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Voer `pnpm qa:otel:smoke` uit wanneer je releasetelemetrie valideert. Het oefent
  QA-lab uit via een lokale OTLP/HTTP-ontvanger en verifieert de geëxporteerde
  tracespan-namen, begrensde attributen en redactie van inhoud/identifiers zonder
  Opik, Langfuse of een andere externe collector te vereisen.
- Voer `pnpm release:check` uit vóór elke getagde release
- Voer `OpenClaw Release Publish` uit voor de mutatieve publicatiereeks nadat de
  tag bestaat. Dispatch deze vanaf `release/YYYY.M.D` (of `main` bij publicatie van
  een tag die vanaf main bereikbaar is), geef de releasetag en succesvolle OpenClaw-npm
  `preflight_run_id` door, en behoud de standaard plugin-publicatiescope
  `all-publishable` tenzij je doelbewust een gerichte reparatie uitvoert. De
  workflow serialiseert plugin-npm-publicatie, plugin-ClawHub-publicatie en
  OpenClaw-npm-publicatie zodat het corepakket niet wordt gepubliceerd vóór zijn
  geëxternaliseerde plugins.
- Releasecontroles draaien nu in een aparte handmatige workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` voert ook de QA Lab-mockpariteitslane plus het snelle
  live Matrix-profiel en de Telegram QA-lane uit vóór releasegoedkeuring. De live
  lanes gebruiken de `qa-live-shared`-omgeving; Telegram gebruikt ook Convex CI
  credentialleases. Voer de handmatige `QA-Lab - All Lanes`-workflow uit met
  `matrix_profile=all` en `matrix_shards=true` wanneer je volledige Matrix
  transport-, media- en E2EE-inventaris parallel wilt.
- Cross-OS installatie- en upgrade-runtimevalidatie maakt deel uit van publieke
  `OpenClaw Release Checks` en `Full Release Validation`, die de herbruikbare
  workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` rechtstreeks
  aanroepen
- Deze splitsing is bewust: houd het echte npm-releasepad kort, deterministisch
  en artefactgericht, terwijl tragere livecontroles in hun eigen lane blijven
  zodat ze publicatie niet ophouden of blokkeren
- Releasecontroles met secrets moeten worden gedispatcht via `Full Release
Validation` of vanuit de `main`-/release-workflowref zodat workflowlogica en
  secrets gecontroleerd blijven
- `OpenClaw Release Checks` accepteert een branch, tag of volledige commit-SHA zolang
  de geresolveerde commit bereikbaar is vanaf een OpenClaw-branch of releasetag
- `OpenClaw NPM Release` validatie-only preflight accepteert ook de huidige
  volledige 40-tekens workflowbranch-commit-SHA zonder een gepushte tag te vereisen
- Dat SHA-pad is alleen voor validatie en kan niet worden gepromoveerd naar een
  echte publicatie
- In SHA-modus synthetiseert de workflow `v<package.json version>` alleen voor de
  pakketmetadatacontrole; echte publicatie vereist nog steeds een echte releasetag
- Beide workflows houden het echte publicatie- en promotiepad op door GitHub
  gehoste runners, terwijl het niet-mutatieve validatiepad de grotere
  Blacksmith Linux-runners kan gebruiken
- Die workflow voert
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  uit met zowel de `OPENAI_API_KEY`- als `ANTHROPIC_API_KEY`-workflowsecrets
- npm-releasepreflight wacht niet langer op de aparte releasecontrolelane
- Voer `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (of de overeenkomende beta-/correctietag) uit vóór goedkeuring
- Voer na npm-publicatie
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (of de overeenkomende beta-/correctieversie) uit om het gepubliceerde
  registry-installatiepad in een verse tijdelijke prefix te verifiëren
- Voer na een beta-publicatie `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  uit om installed-package onboarding, Telegram-configuratie en echte Telegram E2E
  tegen het gepubliceerde npm-pakket te verifiëren met de gedeelde geleasede
  Telegram-credentialpool. Lokale maintainer-one-offs mogen de Convex-vars weglaten
  en de drie `OPENCLAW_QA_TELEGRAM_*`-env-credentials rechtstreeks doorgeven.
- Gebruik `pnpm release:beta-smoke -- --beta betaN` om de volledige post-publish beta-smoke vanaf een maintainermachine uit te voeren. De helper voert Parallels npm update-/fresh-target-validatie uit, dispatcht `NPM Telegram Beta E2E`, pollt de exacte workflowrun, downloadt het artefact en print het Telegram-rapport.
- Maintainers kunnen dezelfde post-publish-controle vanuit GitHub Actions uitvoeren
  via de handmatige `NPM Telegram Beta E2E`-workflow. Deze is bewust alleen
  handmatig en draait niet bij elke merge.
- Maintainer-releaseautomatisering gebruikt nu preflight-dan-promote:
  - echte npm-publicatie moet een succesvolle npm `preflight_run_id` hebben
  - de echte npm-publicatie moet worden gedispatcht vanaf dezelfde `main`- of
    `release/YYYY.M.D`-branch als de succesvolle preflightrun
  - stabiele npm-releases defaulten naar `beta`
  - stabiele npm-publicatie kan expliciet `latest` targeten via workflowinput
  - tokengebaseerde npm dist-tag-mutatie leeft nu in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    voor beveiliging, omdat `npm dist-tag add` nog steeds `NPM_TOKEN` nodig heeft
    terwijl de publieke repo OIDC-only publicatie houdt
  - publieke `macOS Release` is alleen validatie; wanneer een tag alleen op een
    releasebranch leeft maar de workflow vanaf `main` wordt gedispatcht, stel
    `public_release_branch=release/YYYY.M.D` in
  - echte private mac-publicatie moet succesvolle private mac
    `preflight_run_id` en `validate_run_id` hebben
  - de echte publicatiepaden promoten voorbereide artefacten in plaats van ze
    opnieuw te bouwen
- Voor stabiele correctiereleases zoals `YYYY.M.D-N` controleert de post-publish-verifier
  ook hetzelfde temp-prefix-upgradepad van `YYYY.M.D` naar `YYYY.M.D-N` zodat
  releasecorrecties oudere globale installaties niet stilzwijgend op de
  basis-stabiele payload laten staan
- npm-releasepreflight faalt gesloten tenzij de tarball zowel
  `dist/control-ui/index.html` als een niet-lege `dist/control-ui/assets/`-payload
  bevat, zodat we niet opnieuw een leeg browserdashboard verschepen
- Post-publish-verificatie controleert ook dat gepubliceerde plugin-entrypoints en
  pakketmetadata aanwezig zijn in de geïnstalleerde registry-layout. Een release die
  ontbrekende plugin-runtimepayloads verscheept, faalt de postpublish-verifier en
  kan niet naar `latest` worden gepromoveerd.
- `pnpm test:install:smoke` handhaaft ook het npm pack `unpackedSize`-budget op
  de kandidaat-updatetarball, zodat installer-e2e onbedoelde pakketgroei vangt
  vóór het releasepublicatiepad
- Als het releasewerk CI-planning, extensie-timingmanifesten of
  extensietestmatrices heeft geraakt, regenereer en review dan vóór goedkeuring
  de planner-owned `plugin-prerelease-extension-shard`-matrixoutputs uit
  `.github/workflows/plugin-prerelease.yml` zodat releasenotes geen verouderde
  CI-layout beschrijven
- Stabiele macOS-releasegereedheid omvat ook de updateroppervlakken:
  - de GitHub-release moet uiteindelijk de verpakte `.zip`, `.dmg` en `.dSYM.zip`
    hebben
  - `appcast.xml` op `main` moet na publicatie naar de nieuwe stabiele zip wijzen
  - de verpakte app moet een niet-debug bundle-id, een niet-lege Sparkle-feed-URL
    en een `CFBundleVersion` op of boven de canonieke Sparkle-buildvloer voor die
    releaseversie behouden

## Release-testboxen

`Full Release Validation` is hoe operators alle prerelease-tests vanuit één
entrypoint starten. Gebruik voor vastgepind commitbewijs op een snel bewegende
branch de helper zodat elke childworkflow draait vanaf een tijdelijke branch die
op de target-SHA is vastgezet:

```bash
pnpm ci:full-release --sha <full-sha>
```

De helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation`
vanaf die branch met `ref=<sha>`, verifieert dat elke childworkflow-`headSha`
overeenkomt met het target, en verwijdert daarna de tijdelijke branch. Dit
voorkomt dat per ongeluk een nieuwere `main`-childrun wordt bewezen.

Voer releasebranch- of tagvalidatie uit vanaf de vertrouwde `main`-workflowref
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
bovenliggend `release-package-under-test`-artifact voor pakketgerichte checks voor, en
dispatcht zelfstandige package Telegram E2E wanneer `release_profile=full` met
`rerun_group=all` of wanneer `npm_telegram_package_spec` is ingesteld. `OpenClaw Release
Checks` waaiert vervolgens uit naar install-smoke, cross-OS release-checks, live/E2E Docker
release-path-dekking wanneer soak is ingeschakeld, Package Acceptance met Telegram
package-QA, QA Lab-pariteit, live Matrix en live Telegram. Een volledige run is alleen acceptabel wanneer de
samenvatting van `Full Release Validation`
`normal_ci` en `release_checks` als succesvol toont. In full/all-modus moet het
`npm_telegram`-kind ook succesvol zijn; buiten full/all wordt dit overgeslagen,
tenzij een gepubliceerde `npm_telegram_package_spec` is opgegeven. De uiteindelijke
verificatiesamenvatting bevat tabellen met traagste jobs voor elke child-run, zodat de releasemanager het huidige kritieke pad kan zien zonder logs te downloaden.
Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
volledige fasematrix, exacte workflow-jobnamen, verschillen tussen stabiel en volledig profiel,
artifacts en gerichte rerun-handles.
Child-workflows worden gedispatcht vanaf de vertrouwde ref die `Full Release
Validation` uitvoert, normaal `--ref main`, zelfs wanneer de doel-`ref` naar een
oudere releasebranch of tag wijst. Er is geen aparte workflow-ref-invoer voor Full Release Validation;
kies de vertrouwde harness door de workflow-run-ref te kiezen.
Gebruik `--ref main -f ref=<sha>` niet voor exact commit-bewijs op bewegende `main`;
ruwe commit-SHA's kunnen geen workflow-dispatch-refs zijn, dus gebruik
`pnpm ci:full-release --sha <sha>` om de gepinde tijdelijke branch te maken.

Gebruik `release_profile` om live/provider-breedte te selecteren:

- `minimum`: snelste releasekritieke OpenAI/core live- en Docker-pad
- `stable`: minimum plus stabiele provider/backend-dekking voor releasegoedkeuring
- `full`: stable plus brede adviserende provider/media-dekking

Gebruik `run_release_soak=true` met `stable` wanneer de releaseblokkerende lanes
groen zijn en je de uitputtende live/E2E-, Docker release-path- en
all-since-2026.4.23 upgrade-survivor-sweep wilt uitvoeren vóór promotie. `full` impliceert
`run_release_soak=true`.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de doel-ref
eenmaal als `release-package-under-test` op te lossen en hergebruikt dat artifact in cross-OS,
Package Acceptance en release-path Docker-checks wanneer soak draait. Dit houdt
alle pakketgerichte boxes op dezelfde bytes en voorkomt herhaalde pakketbuilds.
De cross-OS OpenAI install-smoke gebruikt `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer de
repo/org-variabele is ingesteld, anders `openai/gpt-5.4`, omdat deze lane
pakketinstallatie, onboarding, Gateway-startup en één live agentbeurt bewijst,
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
faalt, gebruik dan de gefaalde child-workflow, job, Docker-lane, pakketprofiel, model-
provider of QA-lane voor het volgende bewijs. Voer de volledige paraplu pas opnieuw uit wanneer
de fix gedeelde releaseorkestratie heeft gewijzigd of eerder bewijs over alle boxes
verouderd heeft gemaakt. De uiteindelijke verifier van de paraplu controleert de vastgelegde child-workflow-run-
id's opnieuw, dus nadat een child-workflow succesvol opnieuw is uitgevoerd, rerun alleen de gefaalde
bovenliggende job `Verify full validation`.

Geef voor begrensd herstel `rerun_group` door aan de paraplu. `all` is de echte
releasecandidate-run, `ci` draait alleen het normale CI-kind, `plugin-prerelease`
draait alleen het release-only Plugin-kind, `release-checks` draait elke release-
box, en de smallere releasegroepen zijn `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` en `npm-telegram`.
Gerichte `npm-telegram`-reruns vereisen `npm_telegram_package_spec`; full/all-runs
met `release_profile=full` gebruiken het pakketartifact van release-checks. Gerichte
cross-OS-reruns kunnen `cross_os_suite_filter=windows/packaged-upgrade` of
een ander OS/suite-filter toevoegen. Fouten in QA release-checks zijn adviserend; een alleen-QA-
fout blokkeert releasevalidatie niet.

### Vitest

De Vitest-box is de handmatige `CI`-child-workflow. Handmatige CI omzeilt bewust
changed-scoping en forceert de normale testgrafiek voor de releasecandidate:
Linux Node-shards, gebundelde-Plugin-shards, channel-contracten, Node 22-
compatibiliteit, `check`, `check-additional`, build-smoke, docs-checks, Python-
skills, Windows, macOS, Android en Control UI i18n.

Gebruik deze box om te beantwoorden: "is de source tree geslaagd voor de volledige normale testsuite?"
Dit is niet hetzelfde als release-path-productvalidatie. Bewijs om te bewaren:

- samenvatting van `Full Release Validation` met de gedispatchte `CI`-run-URL
- groene `CI`-run op de exacte doel-SHA
- gefaalde of trage shardnamen uit de CI-jobs bij onderzoek naar regressies
- Vitest-timingartifacts zoals `.artifacts/vitest-shard-timings.json` wanneer
  een run prestatieanalyse nodig heeft

Voer handmatige CI alleen direct uit wanneer de release deterministische normale CI nodig heeft, maar
niet de Docker-, QA Lab-, live-, cross-OS- of pakketboxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

De Docker-box zit in `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus de release-mode
`install-smoke`-workflow. Deze valideert de releasecandidate via verpakte
Docker-omgevingen in plaats van alleen source-level tests.

Release-Docker-dekking omvat:

- volledige install-smoke met de trage Bun global install-smoke ingeschakeld
- voorbereiding/hergebruik van root-Dockerfile-smoke-image per doel-SHA, met QR-,
  root/Gateway- en installer/Bun-smoke-jobs die als afzonderlijke install-smoke-
  shards draaien
- repository-E2E-lanes
- release-path Docker-chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` en `plugins-runtime-install-h`
- OpenWebUI-dekking binnen de chunk `plugins-runtime-services` wanneer daarom wordt gevraagd
- opgesplitste install/uninstall-lanes voor gebundelde Plugins
  `bundled-plugin-install-uninstall-0` tot en met
  `bundled-plugin-install-uninstall-23`
- live/E2E-provider-suites en Docker live-modeldekking wanneer release-checks
  live suites bevatten

Gebruik Docker-artifacts vóór je opnieuw uitvoert. De release-path-scheduler uploadt
`.artifacts/docker-tests/` met lane-logs, `summary.json`, `failures.json`,
fasetimings, scheduler-plan-JSON en rerun-commando's. Gebruik voor gericht herstel
`docker_lanes=<lane[,lane]>` op de herbruikbare live/E2E-workflow in plaats van
alle releasechunks opnieuw uit te voeren. Gegenereerde rerun-commando's bevatten eerdere
`package_artifact_run_id` en voorbereide Docker-image-invoer wanneer beschikbaar, zodat een
gefaalde lane dezelfde tarball en GHCR-images kan hergebruiken.

### QA Lab

De QA Lab-box maakt ook deel uit van `OpenClaw Release Checks`. Dit is de agentic
gedrags- en channel-level releasegate, los van Vitest en Docker-
pakketmechanica.

Release-QA Lab-dekking omvat:

- mock-pariteitslane die de OpenAI-candidate-lane vergelijkt met de Opus 4.6-
  baseline met behulp van het agentic parity pack
- snel live Matrix-QA-profiel met de omgeving `qa-live-shared`
- live Telegram-QA-lane met Convex CI-credentialleases
- `pnpm qa:otel:smoke` wanneer releasetelemetrie expliciet lokaal bewijs nodig heeft

Gebruik deze box om te beantwoorden: "gedraagt de release zich correct in QA-scenario's en
live channel-flows?" Bewaar de artifact-URL's voor pariteits-, Matrix- en Telegram-
lanes bij het goedkeuren van de release. Volledige Matrix-dekking blijft beschikbaar als een
handmatige sharded QA-Lab-run in plaats van de standaard releasekritieke lane.

### Pakket

De Pakket-box is de installable-product-gate. Deze wordt ondersteund door
`Package Acceptance` en de resolver
`scripts/resolve-openclaw-package-candidate.mjs`. De resolver normaliseert een
candidate naar de `package-under-test`-tarball die door Docker E2E wordt gebruikt, valideert
de pakketinventory, legt de pakketversie en SHA-256 vast, en houdt de
workflow-harness-ref gescheiden van de pakketsource-ref.

Ondersteunde candidate-bronnen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-release-
  versie
- `source=ref`: pak een vertrouwde `package_ref`-branch, tag of volledige commit-SHA
  met de geselecteerde `workflow_ref`-harness
- `source=url`: download een HTTPS-`.tgz` met vereiste `package_sha256`
- `source=artifact`: hergebruik een `.tgz` die door een andere GitHub Actions-run is geüpload

`OpenClaw Release Checks` draait Package Acceptance met `source=artifact`, het
voorbereide releasepakketartifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance houdt migratie, update, opschoning van verouderde
Plugin-afhankelijkheden, offline Plugin-fixtures, Plugin-update en Telegram
package-QA tegen dezelfde opgeloste tarball. Blokkerende release-checks gebruiken de
standaard baseline van het laatst gepubliceerde pakket; `run_release_soak=true` of
`release_profile=full` breidt uit naar elke stabiele npm-gepubliceerde baseline vanaf
`2026.4.23` tot en met `latest` plus fixtures voor gemelde issues. Gebruik
Package Acceptance met `source=npm` voor een al verzonden candidate, of
`source=ref`/`source=artifact` voor een SHA-onderbouwde lokale npm-tarball vóór
publicatie. Het is de GitHub-native
vervanging voor het grootste deel van de pakket/update-dekking die voorheen
Parallels vereiste. Cross-OS release-checks blijven belangrijk voor OS-specifieke onboarding,
installer en platformgedrag, maar pakket/update-productvalidatie moet
Package Acceptance verkiezen.

De canonieke checklist voor update- en Plugin-validatie is
[Updates en Plugins testen](/nl/help/testing-updates-plugins). Gebruik deze bij het
bepalen welke lokale, Docker-, Package Acceptance- of release-check-lane een
Plugin-installatie/update, doctor cleanup of gepubliceerde-pakketmigratiewijziging bewijst.
Uitputtende gepubliceerde update-migratie vanaf elk stabiel `2026.4.23+`-pakket is
een aparte handmatige `Update Migration`-workflow, geen onderdeel van Full Release CI.

Legacy package-acceptance-tolerantie is bewust tijdsbegrensd. Pakketten tot en met
`2026.4.25` mogen het compatibiliteitspad gebruiken voor metadatagaten die al naar
npm zijn gepubliceerd: private QA-inventory-items die ontbreken in de tarball, ontbrekende
`gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide git-
fixture, ontbrekende gepersisteerde `update.channel`, legacy Plugin install-record-
locaties, ontbrekende persistentie van marketplace install-records, en configmetadata-
migratie tijdens `plugins update`. Het gepubliceerde `2026.4.26`-pakket mag waarschuwen
voor lokale buildmetadata-stempelbestanden die al zijn verzonden. Latere pakketten
moeten voldoen aan de moderne pakketcontracten; diezelfde gaten laten release-
validatie falen.

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

- `smoke`: snelle pakketinstallatie-/kanaal-/agent-, Gateway-netwerk- en config-
  herlaadlanen
- `package`: installatie-/update-/Plugin-pakketcontracten zonder live ClawHub; dit is de standaard voor releasecontroles
- `product`: `package` plus MCP-kanalen, cron-/subagent-opschoning, OpenAI-web
  search en OpenWebUI
- `full`: Docker-releasepadblokken met OpenWebUI
- `custom`: exacte `docker_lanes`-lijst voor gerichte heruitvoeringen

Schakel voor pakketkandidaatbewijs voor Telegram `telegram_mode=mock-openai` of
`telegram_mode=live-frontier` in bij Package Acceptance. De workflow geeft de
opgeloste `package-under-test`-tarball door aan de Telegram-lane; de zelfstandige
Telegram-workflow accepteert nog steeds een gepubliceerde npm-specificatie voor controles na publicatie.

## Automatisering voor releasepublicatie

`OpenClaw Release Publish` is het normale muterende ingangspunt voor publicatie. Het
orkestreert de trusted-publisher-workflows in de volgorde die de release nodig heeft:

1. Check de releasetag uit en los de commit-SHA ervan op.
2. Controleer of de tag bereikbaar is vanaf `main` of `release/*`.
3. Voer `pnpm plugins:sync:check` uit.
4. Start `Plugin NPM Release` met `publish_scope=all-publishable` en
   `ref=<release-sha>`.
5. Start `Plugin ClawHub Release` met hetzelfde bereik en dezelfde SHA.
6. Start `OpenClaw NPM Release` met de releasetag, npm-dist-tag en
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
`OpenClaw Release Publish`, of start de onderliggende workflow rechtstreeks wanneer het
OpenClaw-pakket niet mag worden gepubliceerd.

## Invoer voor NPM-workflow

`OpenClaw NPM Release` accepteert deze door operators beheerde invoer:

- `tag`: vereiste releasetag zoals `v2026.4.2`, `v2026.4.2-1` of
  `v2026.4.2-beta.1`; wanneer `preflight_only=true`, mag dit ook de huidige
  volledige 40-tekens lange commit-SHA van de workflowbranch zijn voor een preflight
  die alleen valideert
- `preflight_only`: `true` voor alleen validatie/build/package, `false` voor het
  echte publicatiepad
- `preflight_run_id`: vereist op het echte publicatiepad zodat de workflow de
  voorbereide tarball van de geslaagde preflight-run opnieuw gebruikt
- `npm_dist_tag`: npm-doeltag voor het publicatiepad; standaard `beta`

`OpenClaw Release Publish` accepteert deze door operators beheerde invoer:

- `tag`: vereiste releasetag; moet al bestaan
- `preflight_run_id`: run-id van een geslaagde `OpenClaw NPM Release`-preflight;
  vereist wanneer `publish_openclaw_npm=true`
- `npm_dist_tag`: npm-doeltag voor het OpenClaw-pakket
- `plugin_publish_scope`: standaard `all-publishable`; gebruik `selected` alleen
  voor gericht herstelwerk
- `plugins`: door komma's gescheiden `@openclaw/*`-pakketnamen wanneer
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: standaard `true`; zet alleen op `false` wanneer de
  workflow wordt gebruikt als Plugin-only herstelorkestrator

`OpenClaw Release Checks` accepteert deze door operators beheerde invoer:

- `ref`: branch, tag of volledige commit-SHA om te valideren. Controles met secrets
  vereisen dat de opgeloste commit bereikbaar is vanaf een OpenClaw-branch of
  releasetag.
- `run_release_soak`: meld je aan voor uitputtende live/E2E-, Docker-releasepad- en
  all-since upgrade-survivor soak bij stabiele/standaard releasecontroles. Dit wordt
  afgedwongen door `release_profile=full`.

Regels:

- Stabiele en correctietags mogen publiceren naar `beta` of `latest`
- Beta-prereleasetags mogen alleen publiceren naar `beta`
- Voor `OpenClaw NPM Release` is volledige commit-SHA-invoer alleen toegestaan wanneer
  `preflight_only=true`
- `OpenClaw Release Checks` en `Full Release Validation` zijn altijd
  alleen-validatie
- Het echte publicatiepad moet dezelfde `npm_dist_tag` gebruiken als tijdens preflight;
  de workflow controleert die metadata voordat de publicatie doorgaat

## Stabiele npm-releasereeks

Wanneer je een stabiele npm-release uitbrengt:

1. Voer `OpenClaw NPM Release` uit met `preflight_only=true`
   - Voordat er een tag bestaat, mag je de huidige volledige commit-SHA van de workflowbranch
     gebruiken voor een dry-run van de preflight-workflow die alleen valideert
2. Kies `npm_dist_tag=beta` voor de normale beta-first-flow, of `latest` alleen
   wanneer je bewust rechtstreeks stabiel wilt publiceren
3. Voer `Full Release Validation` uit op de releasebranch, releasetag of volledige
   commit-SHA wanneer je normale CI plus live promptcache, Docker, QA Lab,
   Matrix- en Telegram-dekking vanuit één handmatige workflow wilt
4. Als je bewust alleen de deterministische normale testgrafiek nodig hebt, voer dan in plaats daarvan de
   handmatige `CI`-workflow uit op de releaseref
5. Bewaar de geslaagde `preflight_run_id`
6. Voer `OpenClaw Release Publish` uit met dezelfde `tag`, dezelfde `npm_dist_tag`
   en de opgeslagen `preflight_run_id`; dit publiceert geëxternaliseerde plugins naar npm
   en ClawHub voordat het OpenClaw-npm-pakket wordt gepromoot
7. Als de release op `beta` is terechtgekomen, gebruik dan de private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`-
   workflow om die stabiele versie van `beta` naar `latest` te promoveren
8. Als de release bewust rechtstreeks naar `latest` is gepubliceerd en `beta`
   meteen dezelfde stabiele build moet volgen, gebruik dan dezelfde private
   workflow om beide dist-tags naar de stabiele versie te laten wijzen, of laat de geplande
   zelfherstellende synchronisatie `beta` later verplaatsen

De dist-tag-mutatie staat om veiligheidsredenen in de private repo omdat deze nog steeds
`NPM_TOKEN` vereist, terwijl de publieke repo alleen OIDC-publicatie behoudt.

Zo blijven het rechtstreekse publicatiepad en het beta-first-promotiepad allebei
gedocumenteerd en zichtbaar voor operators.

Als een maintainer moet terugvallen op lokale npm-authenticatie, voer dan alle 1Password
CLI- (`op`-) opdrachten alleen uit binnen een speciale tmux-sessie. Roep `op` niet
rechtstreeks aan vanuit de hoofd-agent-shell; door het binnen tmux te houden, blijven prompts,
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

Maintainers gebruiken de private releasedocumentatie in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
voor het daadwerkelijke draaiboek.

## Gerelateerd

- [Releasekanalen](/nl/install/development-channels)
