---
read_when:
    - Zoeken naar openbare releasekanaaldefinities
    - Releasevalidatie of pakketacceptatie uitvoeren
    - Op zoek naar versiebenaming en cadans
    - Maandelijkse ondersteunings- of LTS-releaselijnen plannen
summary: Releasetrajecten, operatorchecklist, validatieboxen, versienaamgeving, geplande maandelijkse ondersteuningslijnen en cadans
title: Releasebeleid
x-i18n:
    generated_at: "2026-05-07T01:53:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbd86faf2aa3eeeb465203431c19c778719f291a2e2732fca1463bde89e42e80
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw heeft drie publieke releasekanalen:

- stable: getagde releases die standaard naar npm `beta` publiceren, of naar npm `latest` wanneer daar expliciet om wordt gevraagd
- beta: prereleasetags die naar npm `beta` publiceren
- dev: de bewegende kop van `main`

## Versienaamgeving

- Stabiele releaseversie: `YYYY.M.D`
  - Git-tag: `vYYYY.M.D`
- Verouderde stabiele correctiereleaseversie: `YYYY.M.D-N`
  - Git-tag: `vYYYY.M.D-N`
- Beta-prereleaseversie: `YYYY.M.D-beta.N`
  - Git-tag: `vYYYY.M.D-beta.N`
- Gebruik geen voorloopnul voor maand of dag
- `latest` betekent de huidige gepromoveerde stabiele npm-release
- `beta` betekent het huidige beta-installatiedoel
- Stabiele en verouderde correctiereleases publiceren standaard naar npm `beta`; releasebeheerders kunnen expliciet `latest` kiezen, of later een gecontroleerde betabuild promoten
- Elke stabiele OpenClaw-release levert het npm-pakket en de macOS-app samen;
  betareleases valideren en publiceren normaal gesproken eerst het npm-/pakketpad, waarbij
  het bouwen/ondertekenen/notariëren van de mac-app gereserveerd blijft voor stable, tenzij daar expliciet om wordt gevraagd

### Geplande maandelijkse ondersteuningsversies

OpenClaw heeft nog geen LTS- of maandelijkse ondersteuningskanaal. Maintainers
werken toe naar SemVer-compatibele maandelijkse ondersteuningslijnen, maar de
vandaag geleverde updatekanalen zijn nog steeds `stable`, `beta` en `dev`.

De geplande versievorm is `YYYY.M.PATCH`:

- `YYYY` is het jaar.
- `M` is de maandelijkse releaselijn, zonder voorloopnul.
- `PATCH` wordt binnen die maandelijkse lijn verhoogd en kan zo hoog worden als nodig is.

Bijvoorbeeld: `2026.6.0`, `2026.6.1` en `2026.6.2` zouden allemaal op de juni-
2026-lijn zitten. Een toekomstige maandelijkse ondersteunings-dist-tag zoals `stable-2026-6` of
`lts-2026-6` kan naar die lijn wijzen, terwijl `latest` snel blijft bewegen.

Dit toekomstige model vervangt de noodzaak voor nieuwe `YYYY.M.D-N`-correctiereleases.
Bestaande verouderde correctieversies blijven herkend, zodat oudere pakketten en
upgradepaden blijven werken.

## Releaseritme

- Releases gaan eerst via beta
- Stable volgt pas nadat de nieuwste beta is gevalideerd
- Maintainers maken releases normaal gesproken vanaf een `release/YYYY.M.D`-branch die is gemaakt
  vanaf de huidige `main`, zodat releasevalidatie en fixes nieuwe
  ontwikkeling op `main` niet blokkeren
- Als een betatag is gepusht of gepubliceerd en een fix nodig heeft, maken maintainers
  de volgende `-beta.N`-tag in plaats van de oude betatag te verwijderen of opnieuw te maken
- Gedetailleerde releaseprocedure, goedkeuringen, credentials en herstelnotities zijn
  alleen voor maintainers

## Checklist voor releasebeheerders

Deze checklist is de publieke vorm van de releaseflow. Privécredentials,
ondertekening, notariëring, dist-tag-herstel en details voor noodrollback blijven in
het release-runbook dat alleen voor maintainers is.

1. Begin vanaf de huidige `main`: haal de nieuwste wijzigingen op, bevestig dat de doelcommit is gepusht,
   en bevestig dat de huidige `main`-CI groen genoeg is om er een branch van te maken.
2. Herschrijf de bovenste sectie van `CHANGELOG.md` vanuit echte commitgeschiedenis met
   `/changelog`, houd vermeldingen gebruikersgericht, commit deze, push deze en rebase/pull
   nog een keer voordat je een branch maakt.
3. Controleer releasecompatibiliteitsrecords in
   `src/plugins/compat/registry.ts` en
   `src/commands/doctor/shared/deprecation-compat.ts`. Verwijder verlopen
   compatibiliteit alleen wanneer het upgradepad gedekt blijft, of leg vast waarom deze
   bewust wordt meegenomen.
4. Maak `release/YYYY.M.D` vanaf de huidige `main`; doe normaal releasewerk niet
   rechtstreeks op `main`.
5. Verhoog elke vereiste versielocatie voor de bedoelde tag, voer
   `pnpm plugins:sync` uit zodat publiceerbare Plugin-pakketten de releaseversie
   en compatibiliteitsmetadata delen, en voer daarna de lokale deterministische preflight uit:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` en
   `pnpm release:check`.
6. Voer `OpenClaw NPM Release` uit met `preflight_only=true`. Voordat er een tag bestaat,
   is een volledige SHA van 40 tekens van de releasebranch toegestaan voor alleen-validatie-
   preflight. Bewaar de succesvolle `preflight_run_id`.
7. Start alle prereleasetests met `Full Release Validation` voor de
   releasebranch, tag of volledige commit-SHA. Dit is het ene handmatige startpunt
   voor de vier grote releasetestboxen: Vitest, Docker, QA Lab en Package.
8. Als validatie mislukt, fix dit op de releasebranch en voer opnieuw het kleinste mislukte
   bestand, de kleinste lane, workflowtaak, pakketprofiel, provider of modelallowlist uit die
   de fix bewijst. Voer de volledige umbrella alleen opnieuw uit wanneer het gewijzigde oppervlak
   eerder bewijs verouderd maakt.
9. Voor beta: tag `vYYYY.M.D-beta.N` en voer daarna `OpenClaw Release Publish` uit vanaf
   de overeenkomende `release/YYYY.M.D`-branch. Deze verifieert `pnpm plugins:sync:check`,
   dispatcht alle publiceerbare Plugin-pakketten parallel naar npm en dezelfde set naar
   ClawHub, en promoot daarna het voorbereide OpenClaw npm-preflight-
   artefact met de overeenkomende dist-tag zodra het publiceren van Plugin-pakketten naar npm slaagt.
   Publiceren naar ClawHub kan nog lopen terwijl OpenClaw npm publiceert, maar de
   releasepublicatieworkflow wordt pas voltooid wanneer beide Plugin-publicatiepaden en
   het OpenClaw npm-publicatiepad succesvol zijn afgerond. Voer na publicatie
   de pakketacceptatie na publicatie uit tegen het gepubliceerde
   `openclaw@YYYY.M.D-beta.N`- of
   `openclaw@beta`-pakket. Als een gepushte of gepubliceerde prerelease een fix nodig heeft,
   maak dan het volgende overeenkomende prereleasenummer; verwijder of herschrijf de oude
   prerelease niet.
10. Voor stable: ga alleen verder nadat de gecontroleerde beta of releasekandidaat het
    vereiste validatiebewijs heeft. Stabiele npm-publicatie loopt ook via
    `OpenClaw Release Publish`, waarbij het succesvolle preflightartefact wordt hergebruikt via
    `preflight_run_id`; gereedheid voor een stabiele macOS-release vereist ook de
    verpakte `.zip`, `.dmg`, `.dSYM.zip` en bijgewerkte `appcast.xml` op `main`.
11. Voer na publicatie de npm-verifier na publicatie uit, optioneel de zelfstandige
    gepubliceerde-npm Telegram E2E wanneer je kanaalbewijs na publicatie nodig hebt,
    dist-tag-promotie wanneer nodig, GitHub-release-/prereleasenotities vanuit de
    volledige overeenkomende `CHANGELOG.md`-sectie, en de stappen voor de releaseaankondiging.

## Releasepreflight

- Voer `pnpm check:test-types` uit vóór de release-preflight, zodat test-TypeScript ook
  buiten de snellere lokale `pnpm check`-poort gedekt blijft
- Voer `pnpm check:architecture` uit vóór de release-preflight, zodat de bredere controles op
  importcycli en architectuurgrenzen groen zijn buiten de snellere lokale poort
- Voer `pnpm build && pnpm ui:build` uit vóór `pnpm release:check`, zodat de verwachte
  `dist/*`-releaseartefacten en Control UI-bundel bestaan voor de
  pakketvalidatiestap
- Voer `pnpm plugins:sync` uit na de rootversieverhoging en vóór het taggen. Het
  werkt publiceerbare Plugin-pakketversies, OpenClaw peer/API-compatibiliteitsmetadata,
  buildmetadata en Plugin-changelogstubs bij zodat ze overeenkomen met de core-
  releaseversie. `pnpm plugins:sync:check` is de niet-muteren-de releasebewaking;
  de publicatieworkflow faalt vóór enige registermutatie als deze stap is
  vergeten.
- Voer de handmatige `Full Release Validation`-workflow uit vóór releasegoedkeuring om
  alle pre-release-testboxen vanuit één toegangspunt te starten. Deze accepteert een branch,
  tag of volledige commit-SHA, start handmatig `CI` en start
  `OpenClaw Release Checks` voor installatiesmoke, pakketacceptatie, cross-OS
  pakketcontroles, QA Lab-pariteit, Matrix en Telegram-lanes. Stabiele/standaardruns
  houden uitputtende live/E2E- en Docker-releasepad-soak achter
  `run_release_soak=true`; `release_profile=full` forceert soak. Met
  `release_profile=full` en `rerun_group=all` draait deze ook pakket-Telegram
  E2E tegen het `release-package-under-test`-artefact uit releasecontroles.
  Geef `npm_telegram_package_spec` op na publicatie wanneer dezelfde
  Telegram E2E ook het gepubliceerde npm-pakket moet bewijzen. Geef
  `package_acceptance_package_spec` op na publicatie wanneer Package Acceptance
  zijn pakket/update-matrix moet draaien tegen het verzonden npm-pakket in plaats
  van het uit SHA gebouwde artefact. Geef
  `evidence_package_spec` op wanneer het private bewijsrapport moet aantonen dat de
  validatie overeenkomt met een gepubliceerd npm-pakket zonder Telegram E2E af te
  dwingen.
  Voorbeeld:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Voer de handmatige `Package Acceptance`-workflow uit wanneer je nevenkanaalbewijs
  wilt voor een pakketkandidaat terwijl het releasewerk doorgaat. Gebruik `source=npm` voor
  `openclaw@beta`, `openclaw@latest` of een exacte releaseversie; `source=ref`
  om een vertrouwde `package_ref`-branch/tag/SHA te verpakken met de huidige
  `workflow_ref`-harnas; `source=url` voor een HTTPS-tarball met een vereiste
  SHA-256; of `source=artifact` voor een tarball die door een andere GitHub
  Actions-run is geüpload. De workflow lost de kandidaat op naar
  `package-under-test`, hergebruikt de Docker E2E-releaseplanner tegen die
  tarball en kan Telegram QA tegen dezelfde tarball uitvoeren met
  `telegram_mode=mock-openai` of `telegram_mode=live-frontier`. Wanneer de
  geselecteerde Docker-lanes `published-upgrade-survivor` bevatten, is het pakketartefact
  de kandidaat en selecteert `published_upgrade_survivor_baseline` de
  gepubliceerde baseline. `update-restart-auth` gebruikt het kandidaatpakket als
  zowel de geïnstalleerde CLI als het package-under-test, zodat het het beheerde
  herstartpad van de updateopdracht van de kandidaat oefent.
  Voorbeeld: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Algemene profielen:
  - `smoke`: installatie-/kanaal-/agent-, gateway-netwerk- en config-herlaadlanes
  - `package`: artefact-native pakket-/update-/herstart-/Plugin-lanes zonder OpenWebUI of live ClawHub
  - `product`: pakketprofiel plus MCP-kanalen, cron-/subagent-opruiming,
    OpenAI-webzoekopdracht en OpenWebUI
  - `full`: Docker-releasepad-chunks met OpenWebUI
  - `custom`: exacte `docker_lanes`-selectie voor een gerichte heruitvoering
- Voer de handmatige `CI`-workflow rechtstreeks uit wanneer je alleen volledige normale CI-
  dekking nodig hebt voor de releasekandidaat. Handmatige CI-dispatches omzeilen changed-
  scoping en forceren de Linux Node-shards, gebundelde-Plugin-shards, kanaal-
  contracten, Node 22-compatibiliteit, `check`, `check-additional`, buildsmoke,
  docs-controles, Python Skills, Windows, macOS, Android en Control UI i18n-
  lanes.
  Voorbeeld: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Voer `pnpm qa:otel:smoke` uit bij het valideren van releasetelemetrie. Dit oefent
  QA-lab via een lokale OTLP/HTTP-ontvanger en verifieert de geëxporteerde trace-
  spannamen, begrensde attributen en redactie van inhoud/identificatoren zonder
  Opik, Langfuse of een andere externe collector te vereisen.
- Voer `pnpm release:check` uit vóór elke getagde release
- Voer `OpenClaw Release Publish` uit voor de muterende publicatiereeks nadat de
  tag bestaat. Dispatch deze vanuit `release/YYYY.M.D` (of `main` wanneer je een
  vanaf main bereikbare tag publiceert), geef de releasetag en succesvolle OpenClaw npm
  `preflight_run_id` door, en behoud de standaard Plugin-publicatiescope
  `all-publishable` tenzij je bewust een gerichte reparatie uitvoert. De
  workflow serialiseert Plugin npm-publicatie, Plugin ClawHub-publicatie en OpenClaw
  npm-publicatie zodat het corepakket niet vóór zijn geëxternaliseerde
  Plugins wordt gepubliceerd.
- Releasecontroles draaien nu in een aparte handmatige workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` draait ook de QA Lab-mockpariteitslane plus het snelle
  live Matrix-profiel en de Telegram QA-lane vóór releasegoedkeuring. De live-
  lanes gebruiken de `qa-live-shared`-omgeving; Telegram gebruikt ook Convex CI-
  credentialleases. Voer de handmatige `QA-Lab - All Lanes`-workflow uit met
  `matrix_profile=all` en `matrix_shards=true` wanneer je volledige Matrix-
  transport-, media- en E2EE-inventaris parallel wilt.
- Cross-OS installatie- en upgrade-runtimevalidatie maakt deel uit van openbare
  `OpenClaw Release Checks` en `Full Release Validation`, die de herbruikbare workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` rechtstreeks
  aanroepen
- Deze splitsing is bewust: houd het echte npm-releasepad kort,
  deterministisch en artefactgericht, terwijl tragere livecontroles in hun
  eigen lane blijven zodat ze publicatie niet vertragen of blokkeren
- Releasecontroles met geheimen moeten worden gedispatcht via `Full Release
Validation` of vanuit de `main`/release-workflowref, zodat workflowlogica en
  geheimen gecontroleerd blijven
- `OpenClaw Release Checks` accepteert een branch, tag of volledige commit-SHA zolang
  de opgeloste commit bereikbaar is vanuit een OpenClaw-branch of releasetag
- `OpenClaw NPM Release` validatie-only preflight accepteert ook de huidige
  volledige 40-tekens workflow-branch-commit-SHA zonder een gepushte tag te vereisen
- Dat SHA-pad is alleen voor validatie en kan niet worden gepromoveerd naar een echte publicatie
- In SHA-modus synthetiseert de workflow `v<package.json version>` alleen voor de
  pakketmetadatacontrole; echte publicatie vereist nog steeds een echte releasetag
- Beide workflows houden het echte publicatie- en promotiepad op door GitHub gehoste
  runners, terwijl het niet-muteren-de validatiepad de grotere
  Blacksmith Linux-runners kan gebruiken
- Die workflow draait
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  met zowel `OPENAI_API_KEY` als `ANTHROPIC_API_KEY` workflowgeheimen
- npm-releasepreflight wacht niet langer op de aparte releasecontrole-lane
- Voer `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (of de overeenkomende bèta-/correctietag) uit vóór goedkeuring
- Voer na npm-publicatie
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (of de overeenkomende bèta-/correctieversie) uit om het gepubliceerde register-
  installatiepad in een verse tijdelijke prefix te verifiëren
- Voer na een bètapublicatie `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  uit om onboarding van geïnstalleerde pakketten, Telegram-configuratie en echte Telegram E2E
  tegen het gepubliceerde npm-pakket te verifiëren met de gedeelde geleasede Telegram-credential-
  pool. Lokale eenmalige maintainer-runs mogen de Convex-variabelen weglaten en de drie
  `OPENCLAW_QA_TELEGRAM_*` env-credentials rechtstreeks doorgeven.
- Gebruik `pnpm release:beta-smoke -- --beta betaN` om de volledige post-publicatie bètasmoke vanaf een maintainermachine te draaien. De helper draait Parallels npm update-/fresh-target-validatie, dispatcht `NPM Telegram Beta E2E`, pollt de exacte workflowrun, downloadt het artefact en print het Telegram-rapport.
- Maintainers kunnen dezelfde post-publicatiecontrole vanuit GitHub Actions draaien via de
  handmatige `NPM Telegram Beta E2E`-workflow. Deze is bewust alleen handmatig en
  draait niet bij elke merge.
- Maintainer-releaseautomatisering gebruikt nu preflight-dan-promotie:
  - echte npm-publicatie moet slagen met een succesvolle npm `preflight_run_id`
  - de echte npm-publicatie moet worden gedispatcht vanuit dezelfde `main`- of
    `release/YYYY.M.D`-branch als de succesvolle preflightrun
  - stabiele npm-releases staan standaard op `beta`
  - stabiele npm-publicatie kan expliciet naar `latest` richten via workflowinvoer
  - tokengebaseerde npm dist-tag-mutatie leeft nu in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    voor beveiliging, omdat `npm dist-tag add` nog steeds `NPM_TOKEN` nodig heeft terwijl de
    openbare repo alleen OIDC-publicatie behoudt
  - openbare `macOS Release` is alleen validatie; wanneer een tag alleen op een
    releasebranch leeft maar de workflow vanuit `main` wordt gedispatcht, stel dan
    `public_release_branch=release/YYYY.M.D` in
  - echte private mac-publicatie moet slagen met succesvolle private mac-
    `preflight_run_id` en `validate_run_id`
  - de echte publicatiepaden promoveren voorbereide artefacten in plaats van ze
    opnieuw te bouwen
- Voor legacy stabiele correctiereleases zoals `YYYY.M.D-N` controleert de post-publicatieverifier
  ook hetzelfde tijdelijke-prefix-upgradepad van `YYYY.M.D` naar `YYYY.M.D-N`
  zodat releasecorrecties oudere globale installaties niet stilzwijgend op de
  basisstabiele payload kunnen laten staan
- npm-releasepreflight faalt gesloten tenzij de tarball zowel
  `dist/control-ui/index.html` als een niet-lege `dist/control-ui/assets/`-payload bevat
  zodat we niet opnieuw een leeg browserdashboard verzenden
- Post-publicatieverificatie controleert ook of gepubliceerde Plugin-entrypoints en
  pakketmetadata aanwezig zijn in de geïnstalleerde registerlayout. Een release die
  ontbrekende Plugin-runtimepayloads verzendt, faalt de postpublish-verifier en
  kan niet naar `latest` worden gepromoveerd.
- `pnpm test:install:smoke` handhaaft ook het npm pack `unpackedSize`-budget op
  de kandidaat-update-tarball, zodat installer-e2e onbedoelde pakketgroei opvangt
  vóór het releasepublicatiepad
- Als het releasewerk CI-planning, extensietimingmanifests of
  extensietestmatrices raakte, regenereer en beoordeel dan vóór goedkeuring de door de planner beheerde
  `plugin-prerelease-extension-shard`-matrixoutputs uit
  `.github/workflows/plugin-prerelease.yml`, zodat releasenotities geen
  verouderde CI-layout beschrijven
- Gereedheid voor stabiele macOS-releases omvat ook de update-oppervlakken:
  - de GitHub-release moet uiteindelijk de verpakte `.zip`, `.dmg` en `.dSYM.zip` bevatten
  - `appcast.xml` op `main` moet na publicatie naar de nieuwe stabiele zip wijzen
  - de verpakte app moet een niet-debug-bundle-id, een niet-lege Sparkle-feed-
    URL en een `CFBundleVersion` op of boven de canonieke Sparkle-buildvloer
    voor die releaseversie behouden

## Release-testboxen

`Full Release Validation` is hoe operators alle pre-release-tests vanuit
één toegangspunt starten. Gebruik voor vastgepind commitbewijs op een snel bewegende branch de
helper zodat elke child-workflow vanaf een tijdelijke branch draait die is vastgezet op de doel-
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

De helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation`
vanaf die branch met `ref=<sha>`, verifieert dat elke child-workflow `headSha`
overeenkomt met het doel en verwijdert daarna de tijdelijke branch. Dit voorkomt dat je per ongeluk een
nieuwere `main`-childrun bewijst.

Voor validatie van releasebranch of tag voer je deze uit vanaf de vertrouwde `main` workflow-
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
bovenliggend `release-package-under-test`-artifact voor pakketgerichte controles
voor, en start zelfstandige pakket-Telegram-E2E wanneer `release_profile=full` met
`rerun_group=all` of wanneer `npm_telegram_package_spec` is ingesteld. `OpenClaw Release
Checks` waaiert vervolgens uit naar installatiesmoke, cross-OS releasecontroles, live/E2E Docker
release-paddekking wanneer soak is ingeschakeld, Package Acceptance met Telegram
pakket-QA, QA Lab-pariteit, live Matrix en live Telegram. Een volledige run is alleen acceptabel wanneer de
samenvatting van `Full Release Validation`
`normal_ci` en `release_checks` als succesvol toont. In full/all-modus
moet het `npm_telegram`-child ook succesvol zijn; buiten full/all wordt dit overgeslagen
tenzij een gepubliceerde `npm_telegram_package_spec` is opgegeven. De uiteindelijke
verificatiesamenvatting bevat tabellen met traagste jobs voor elke child-run, zodat de release
manager het huidige kritieke pad kan zien zonder logs te downloaden.
Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
volledige stagematrix, exacte workflow-jobnamen, verschillen tussen stabiel en volledig profiel,
artifacts en gerichte rerun-handles.
Child-workflows worden gestart vanaf de vertrouwde ref die `Full Release
Validation` uitvoert, normaal `--ref main`, zelfs wanneer de doel-`ref` naar een
oudere releasebranch of tag wijst. Er is geen afzonderlijke Full Release Validation
workflow-ref-invoer; kies de vertrouwde harness door de ref voor de workflow-run te kiezen.
Gebruik `--ref main -f ref=<sha>` niet voor exact commitbewijs op bewegende `main`;
ruwe commit-SHA's kunnen geen workflow-dispatch-refs zijn, dus gebruik
`pnpm ci:full-release --sha <sha>` om de gepinde tijdelijke branch te maken.

Gebruik `release_profile` om live/provider-breedte te selecteren:

- `minimum`: snelste releasekritieke OpenAI/core live- en Docker-pad
- `stable`: minimum plus stabiele provider/backend-dekking voor releasegoedkeuring
- `full`: stable plus brede adviserende provider/media-dekking

Gebruik `run_release_soak=true` met `stable` wanneer de releaseblokkerende lanes
groen zijn en je de uitputtende live/E2E-, Docker release-pad- en
begrensde gepubliceerde upgrade-survivor-sweep wilt vóór promotie. Die sweep dekt
de nieuwste vier stabiele pakketten plus gepinde `2026.4.23`- en `2026.5.2`-
baselines plus oudere `2026.4.15`-dekking, met dubbele baselines verwijderd en
elke baseline geshard in een eigen Docker-runnerjob. `full` impliceert
`run_release_soak=true`.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de doel-ref
eenmaal op te lossen als `release-package-under-test` en hergebruikt dat artifact in cross-OS,
Package Acceptance en release-pad Docker-controles wanneer soak draait. Dit houdt
alle pakketgerichte machines op dezelfde bytes en voorkomt herhaalde pakketbuilds.
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

Gebruik de volledige paraplu niet als eerste rerun na een gerichte fix. Als één machine
faalt, gebruik dan de mislukte child-workflow, job, Docker-lane, pakketprofiel, model-
provider of QA-lane voor het volgende bewijs. Voer de volledige paraplu pas opnieuw uit wanneer
de fix gedeelde releaseorkestratie heeft gewijzigd of eerder all-box-bewijs
verouderd heeft gemaakt. De uiteindelijke verifier van de paraplu controleert de geregistreerde child-workflow-run-
id's opnieuw, dus nadat een child-workflow succesvol opnieuw is uitgevoerd, voer je alleen de mislukte
bovenliggende job `Verify full validation` opnieuw uit.

Voor begrensd herstel geef je `rerun_group` door aan de paraplu. `all` is de echte
releasecandidate-run, `ci` draait alleen het normale CI-child, `plugin-prerelease`
draait alleen het release-only Plugin-child, `release-checks` draait elke release-
machine, en de smallere releasegroepen zijn `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` en `npm-telegram`.
Gerichte `npm-telegram`-reruns vereisen `npm_telegram_package_spec`; full/all-runs
met `release_profile=full` gebruiken het pakket-artifact van release-checks. Gerichte
cross-OS-reruns kunnen `cross_os_suite_filter=windows/packaged-upgrade` of
een ander OS/suite-filter toevoegen. QA-release-check-fouten zijn adviserend; een QA-only-
fout blokkeert releasevalidatie niet.

### Vitest

De Vitest-machine is de handmatige `CI`-child-workflow. Handmatige CI omzeilt
bewust changed scoping en forceert de normale testgrafiek voor de releasecandidate:
Linux Node-shards, gebundelde-Plugin-shards, channel-contracten, Node 22-
compatibiliteit, `check`, `check-additional`, buildsmoke, docs-controles, Python
Skills, Windows, macOS, Android en Control UI i18n.

Gebruik deze machine om te beantwoorden: "is de source tree geslaagd voor de volledige normale testsuite?"
Dit is niet hetzelfde als release-pad-productvalidatie. Te bewaren bewijs:

- `Full Release Validation`-samenvatting met de URL van de gestarte `CI`-run
- `CI`-run groen op de exacte doel-SHA
- namen van mislukte of trage shards uit de CI-jobs bij het onderzoeken van regressies
- Vitest-timing-artifacts zoals `.artifacts/vitest-shard-timings.json` wanneer
  een run prestatieanalyse nodig heeft

Draai handmatige CI alleen rechtstreeks wanneer de release deterministische normale CI nodig heeft maar
niet de Docker-, QA Lab-, live-, cross-OS- of pakketmachines:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

De Docker-machine zit in `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus de release-modus-
`install-smoke`-workflow. Deze valideert de releasecandidate via verpakte
Docker-omgevingen in plaats van alleen tests op sourceniveau.

Release-Docker-dekking omvat:

- volledige installatiesmoke met de trage Bun global install-smoke ingeschakeld
- voorbereiding/hergebruik van root-Dockerfile-smoke-image per doel-SHA, met QR-,
  root/Gateway- en installer/Bun-smokejobs als afzonderlijke install-smoke-
  shards
- repository-E2E-lanes
- release-pad Docker-chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` en `plugins-runtime-install-h`
- OpenWebUI-dekking binnen de chunk `plugins-runtime-services` wanneer aangevraagd
- gesplitste install/uninstall-lanes voor gebundelde Plugins
  `bundled-plugin-install-uninstall-0` tot en met
  `bundled-plugin-install-uninstall-23`
- live/E2E-provider-suites en Docker live-modeldekking wanneer releasecontroles
  live-suites bevatten

Gebruik Docker-artifacts voordat je opnieuw draait. De release-padplanner uploadt
`.artifacts/docker-tests/` met lane-logs, `summary.json`, `failures.json`,
fasetimings, scheduler-plan-JSON en rerun-commando's. Voor gericht herstel
gebruik je `docker_lanes=<lane[,lane]>` op de herbruikbare live/E2E-workflow in plaats van
alle releasechunks opnieuw te draaien. Gegenereerde rerun-commando's bevatten eerdere
`package_artifact_run_id` en voorbereide Docker-image-invoer wanneer beschikbaar, zodat een
mislukte lane dezelfde tarball en GHCR-images kan hergebruiken.

### QA Lab

De QA Lab-machine is ook onderdeel van `OpenClaw Release Checks`. Dit is de agentische
gedrags- en channel-level releasegate, los van Vitest en Docker-
pakketmechanica.

Release-QA Lab-dekking omvat:

- mock-pariteitslane die de OpenAI-candidate-lane vergelijkt met de Opus 4.6-
  baseline met het agentische pariteitspakket
- snel live Matrix-QA-profiel met de omgeving `qa-live-shared`
- live Telegram-QA-lane met Convex CI-credentialleases
- `pnpm qa:otel:smoke` wanneer releasetelemetrie expliciet lokaal bewijs nodig heeft

Gebruik deze machine om te beantwoorden: "gedraagt de release zich correct in QA-scenario's en
live channel-flows?" Bewaar de artifact-URL's voor pariteits-, Matrix- en Telegram-
lanes bij het goedkeuren van de release. Volledige Matrix-dekking blijft beschikbaar als een
handmatige gesharde QA-Lab-run in plaats van de standaard releasekritieke lane.

### Pakket

De pakketmachine is de gate voor het installeerbare product. Deze wordt ondersteund door
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
- `source=artifact`: hergebruik een `.tgz` geüpload door een andere GitHub Actions-run

`OpenClaw Release Checks` draait Package Acceptance met `source=artifact`, het
voorbereide releasepakket-artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance houdt migratie, update,
herstart na update met geconfigureerde auth, opschoning van verouderde Plugin-afhankelijkheden, offline Plugin-
fixtures, Plugin-update en Telegram-pakket-QA tegen dezelfde opgeloste
tarball. Blokkerende releasecontroles gebruiken de standaard nieuwste gepubliceerde pakket-
baseline; `run_release_soak=true` of
`release_profile=full` breidt uit naar elke stabiele npm-gepubliceerde baseline van
`2026.4.23` tot en met `latest` plus fixtures voor gemelde issues. Gebruik
Package Acceptance met `source=npm` voor een al verzonden candidate, of
`source=ref`/`source=artifact` voor een SHA-ondersteunde lokale npm-tarball vóór
publicatie. Het is de GitHub-native
vervanging voor het grootste deel van de pakket/update-dekking waarvoor voorheen
Parallels nodig was. Cross-OS releasecontroles blijven belangrijk voor OS-specifieke onboarding,
installer- en platformgedrag, maar pakket/update-productvalidatie zou
Package Acceptance moeten verkiezen.

De canonieke checklist voor update- en Plugin-validatie is
[Updates en Plugins testen](/nl/help/testing-updates-plugins). Gebruik deze bij het
beslissen welke lokale, Docker-, Package Acceptance- of release-check-lane een
Plugin-installatie/update, doctor-opschoning of wijziging in gepubliceerde-pakketmigratie bewijst.
Uitputtende gepubliceerde update-migratie vanaf elk stabiel `2026.4.23+`-pakket is
een afzonderlijke handmatige `Update Migration`-workflow, geen onderdeel van Full Release CI.

Verouderde soepelheid in pakketacceptatie is bewust in tijd beperkt. Pakketten tot en met
`2026.4.25` mogen het compatibiliteitspad gebruiken voor metadatagaten die al naar
npm zijn gepubliceerd: private QA-inventarisitems die ontbreken in de tarball, ontbrekende
`gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide git-
fixture, ontbrekende opgeslagen `update.channel`, verouderde locaties voor Plugin-installatierecords,
ontbrekende persistentie van marketplace-installatierecords, en migratie van configuratiemetadata
tijdens `plugins update`. Het gepubliceerde pakket `2026.4.26` mag waarschuwen voor lokale
buildmetadata-stempelbestanden die al zijn geleverd. Latere pakketten moeten voldoen aan de
moderne pakketcontracten; dezelfde gaten laten releasevalidatie falen.

Gebruik bredere pakketacceptatieprofielen wanneer de releasevraag over een daadwerkelijk
installeerbaar pakket gaat:

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

- `smoke`: snelle lanes voor pakketinstallatie/kanaal/agent, Gateway-netwerk en herladen
  van configuratie
- `package`: contracten voor install/update/restart/Plugin-pakket zonder live
  ClawHub; dit is de standaard voor releasechecks
- `product`: `package` plus MCP-kanalen, opschoning van cron/subagent, OpenAI-webzoekfunctie
  en OpenWebUI
- `full`: Docker-releasepadsegmenten met OpenWebUI
- `custom`: exacte `docker_lanes`-lijst voor gerichte heruitvoeringen

Voor Telegram-bewijs van pakketkandidaten schakel je `telegram_mode=mock-openai` of
`telegram_mode=live-frontier` in bij pakketacceptatie. De workflow geeft de opgeloste
`package-under-test`-tarball door aan de Telegram-lane; de zelfstandige Telegram-workflow
accepteert nog steeds een gepubliceerde npm-specificatie voor controles na publicatie.

## Automatisering van releasepublicatie

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

Stabiele promotie rechtstreeks naar `latest` is expliciet:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Gebruik de lagere `Plugin NPM Release`- en `Plugin ClawHub Release`-workflows
alleen voor gericht herstel- of herpublicatiewerk. Geef voor een geselecteerd Plugin-herstel
`plugin_publish_scope=selected` en `plugins=@openclaw/name` door aan
`OpenClaw Release Publish`, of dispatch de childworkflow rechtstreeks wanneer het
OpenClaw-pakket niet mag worden gepubliceerd.

## NPM-workflowinvoer

`OpenClaw NPM Release` accepteert deze door de operator beheerde invoer:

- `tag`: vereiste releasetag zoals `v2026.4.2`, `v2026.4.2-1` of
  `v2026.4.2-beta.1`; wanneer `preflight_only=true`, mag dit ook de huidige
  volledige 40-tekens workflowbranch-commit-SHA zijn voor uitsluitend validatie-preflight
- `preflight_only`: `true` voor alleen validatie/build/pakket, `false` voor het
  echte publicatiepad
- `preflight_run_id`: vereist op het echte publicatiepad zodat de workflow de
  voorbereide tarball uit de geslaagde preflightrun hergebruikt
- `npm_dist_tag`: npm-doeltag voor het publicatiepad; standaard `beta`

`OpenClaw Release Publish` accepteert deze door de operator beheerde invoer:

- `tag`: vereiste releasetag; moet al bestaan
- `preflight_run_id`: geslaagde `OpenClaw NPM Release`-preflightrun-id;
  vereist wanneer `publish_openclaw_npm=true`
- `npm_dist_tag`: npm-doeltag voor het OpenClaw-pakket
- `plugin_publish_scope`: standaard `all-publishable`; gebruik `selected` alleen
  voor gericht herstelwerk
- `plugins`: door komma's gescheiden pakketnamen van `@openclaw/*` wanneer
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: standaard `true`; zet op `false` alleen wanneer je de
  workflow gebruikt als herstelorkestrator uitsluitend voor Plugins

`OpenClaw Release Checks` accepteert deze door de operator beheerde invoer:

- `ref`: branch, tag of volledige commit-SHA om te valideren. Controles met secrets
  vereisen dat de opgeloste commit bereikbaar is vanaf een OpenClaw-branch of
  releasetag.
- `run_release_soak`: kies voor een uitputtende live/E2E-, Docker-releasepad- en
  all-since upgrade-survivor-soak bij stabiele/standaard releasechecks. Dit wordt
  afgedwongen door `release_profile=full`.

Regels:

- Stabiele en correctietags mogen naar `beta` of `latest` publiceren
- Beta-prereleasetags mogen alleen naar `beta` publiceren
- Voor `OpenClaw NPM Release` is invoer van volledige commit-SHA alleen toegestaan wanneer
  `preflight_only=true`
- `OpenClaw Release Checks` en `Full Release Validation` zijn altijd
  uitsluitend validatie
- Het echte publicatiepad moet dezelfde `npm_dist_tag` gebruiken als tijdens preflight;
  de workflow controleert die metadata voordat publicatie doorgaat

## Stabiele npm-releasevolgorde

Bij het maken van een stabiele npm-release:

1. Voer `OpenClaw NPM Release` uit met `preflight_only=true`
   - Voordat er een tag bestaat, mag je de huidige volledige workflowbranch-commit-SHA
     gebruiken voor een validatie-only dry run van de preflightworkflow
2. Kies `npm_dist_tag=beta` voor de normale beta-first-flow, of `latest` alleen
   wanneer je bewust rechtstreeks stabiel wilt publiceren
3. Voer `Full Release Validation` uit op de releasebranch, releasetag of volledige
   commit-SHA wanneer je normale CI plus live promptcache, Docker, QA Lab,
   Matrix en Telegram-dekking vanuit één handmatige workflow wilt
4. Als je bewust alleen de deterministische normale testgrafiek nodig hebt, voer dan de
   handmatige `CI`-workflow uit op de release-ref
5. Bewaar de geslaagde `preflight_run_id`
6. Voer `OpenClaw Release Publish` uit met dezelfde `tag`, dezelfde `npm_dist_tag`
   en de opgeslagen `preflight_run_id`; deze publiceert geëxternaliseerde Plugins naar npm
   en ClawHub voordat het OpenClaw-npm-pakket wordt gepromoveerd
7. Als de release op `beta` is geland, gebruik dan de private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`-
   workflow om die stabiele versie van `beta` naar `latest` te promoveren
8. Als de release bewust rechtstreeks naar `latest` is gepubliceerd en `beta`
   onmiddellijk dezelfde stabiele build moet volgen, gebruik dan dezelfde private
   workflow om beide dist-tags naar de stabiele versie te laten wijzen, of laat de geplande
   zelfherstellende synchronisatie `beta` later verplaatsen

De dist-tagmutatie staat om veiligheidsredenen in de private repo omdat deze nog steeds
`NPM_TOKEN` vereist, terwijl de publieke repo OIDC-only-publicatie behoudt.

Zo blijven zowel het rechtstreekse publicatiepad als het beta-first-promotiepad
gedocumenteerd en zichtbaar voor operators.

Als een maintainer moet terugvallen op lokale npm-authenticatie, voer dan alle 1Password
CLI-commando's (`op`) alleen uit binnen een toegewijde tmux-sessie. Roep `op` niet
rechtstreeks aan vanuit de hoofd-agent-shell; door het binnen tmux te houden blijven prompts,
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
voor het daadwerkelijke draaiboek.

## Gerelateerd

- [Releasekanalen](/nl/install/development-channels)
