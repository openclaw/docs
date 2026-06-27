---
read_when:
    - Zoeken naar definities van openbare releasekanalen
    - Releasevalidatie of pakketacceptatie uitvoeren
    - Zoeken naar versienaamgeving en cadans
summary: Release-lanes, operatorchecklist, validatievakken, versienaamgeving en cadans
title: Releasebeleid
x-i18n:
    generated_at: "2026-06-27T18:17:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16873b02f09bd0f67ea16644630defc1b17b6f236572715df598a2253dba3b2d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw heeft drie openbare releasebanen:

- stable: getagde releases die standaard naar npm `beta` publiceren, of naar npm `latest` wanneer dit expliciet wordt gevraagd
- beta: prerelease-tags die naar npm `beta` publiceren
- dev: de bewegende head van `main`

## Versienaamgeving

- Versie van stabiele release: `YYYY.M.PATCH`
  - Git-tag: `vYYYY.M.PATCH`
- Versie van stabiele correctierelease: `YYYY.M.PATCH-N`
  - Git-tag: `vYYYY.M.PATCH-N`
- Versie van beta-prerelease: `YYYY.M.PATCH-beta.N`
  - Git-tag: `vYYYY.M.PATCH-beta.N`
- Vul maand of patch niet met nullen aan
- Vanaf de update van het releaseproces in juni 2026 is de derde component een
  sequentieel maandelijks release-trainnummer, geen kalenderdag. Stabiele en beta-
  releases bepalen de huidige train; tags die alleen alpha zijn verbruiken of
  verhogen het beta/stable-patchnummer niet. Tags en npm-versies van voor de
  update behouden hun bestaande namen en blijven geldig; releaseautomatisering
  blijft ze vergelijken op jaar, maand, patch, kanaal en prerelease- of correctie-
  nummer.
- Alpha/nightly-builds gebruiken de volgende nog niet uitgebrachte patch-train en verhogen alleen
  `alpha.N` voor herhaalde builds. Zodra die patch een beta heeft, gaan nieuwe alpha-builds
  naar de volgende patch. Negeer verouderde alpha-only-tags met hogere patch-
  nummers bij het selecteren van een beta- of stable-train.
- npm-versies zijn onveranderlijk. Als een beta-tag al is gepubliceerd, mag je die niet
  verwijderen, opnieuw publiceren of hergebruiken; maak het volgende beta-nummer of de volgende maandelijkse
  patch. Omdat `2026.6.5-beta.1` al tijdens de overgang is gepubliceerd, moeten
  release-trains van juni 2026 patch `5` of hoger gebruiken. Publiceer geen
  nieuwe stable- of beta-trains voor juni 2026 als `2026.6.2`, `2026.6.3` of
  `2026.6.4`.
- Na stable `2026.6.5` is de volgende nieuwe beta-train `2026.6.6-beta.1`, zelfs
  als er al geautomatiseerde alpha-only-tags met hogere patchnummers bestaan.
- `latest` betekent de huidige gepromote stabiele npm-release
- `beta` betekent het huidige beta-installatiedoel
- Stabiele en stabiele correctiereleases publiceren standaard naar npm `beta`; release-operators kunnen expliciet `latest` targeten, of later een gecontroleerde beta-build promoveren
- Elke stabiele OpenClaw-release levert het npm-pakket, de macOS-app en ondertekende
  Windows Hub-installers samen; beta-releases valideren en publiceren normaal
  eerst het npm-/pakketpad, waarbij native app build/sign/notarize/promote
  gereserveerd blijft voor stable tenzij dit expliciet wordt gevraagd

## Releasecadans

- Releases gaan eerst via beta
- Stable volgt pas nadat de nieuwste beta is gevalideerd
- Maintainers maken releases normaal vanaf een `release/YYYY.M.PATCH`-branch die is aangemaakt
  vanaf de huidige `main`, zodat releasevalidatie en fixes nieuwe
  ontwikkeling op `main` niet blokkeren
- Als een beta-tag is gepusht of gepubliceerd en een fix nodig heeft, maken maintainers
  de volgende `-beta.N`-tag in plaats van de oude beta-tag te verwijderen of opnieuw te maken
- Gedetailleerde releaseprocedure, goedkeuringen, credentials en herstelnotities zijn
  alleen voor maintainers

## Checklist voor release-operator

Deze checklist is de openbare vorm van de releaseflow. Privécredentials,
ondertekening, notarization, dist-tagherstel en details voor noodrollback blijven in
het maintainer-only release-runbook.

1. Begin vanaf de huidige `main`: pull de nieuwste wijzigingen, bevestig dat de doelcommit is gepusht,
   en bevestig dat de huidige `main`-CI groen genoeg is om er een branch van te maken.
2. Genereer de bovenste `CHANGELOG.md`-sectie uit samengevoegde PR's en alle directe
   commits sinds de laatst bereikbare release-tag. Houd items gebruikersgericht,
   dedupliceer overlappende PR-/directe-commititems, commit de herschrijving, push deze,
   en rebase/pull nog één keer voordat je de branch maakt.
3. Bekijk releasecompatibiliteitsrecords in
   `src/plugins/compat/registry.ts` en
   `src/commands/doctor/shared/deprecation-compat.ts`. Verwijder verlopen
   compatibiliteit alleen wanneer het upgradepad gedekt blijft, of leg vast waarom deze
   bewust wordt behouden.
4. Maak `release/YYYY.M.PATCH` vanaf de huidige `main`; doe normaal releasewerk niet
   direct op `main`.
5. Verhoog elke vereiste versielocatie voor de beoogde tag en voer daarna
   `pnpm release:prep` uit. Dit ververst Plugin-versies, Plugin-inventaris, config-
   schema, gebundelde kanaalconfigmetadata, baseline voor configdocs, Plugin SDK-
   exports en Plugin SDK API-baseline in de juiste volgorde. Commit alle gegenereerde
   drift voordat je tagt. Voer daarna de lokale deterministische preflight uit:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` en `pnpm release:check`.
6. Voer `OpenClaw NPM Release` uit met `preflight_only=true`. Voordat er een tag bestaat,
   is een volledige release-branch-SHA van 40 tekens toegestaan voor validation-only
   preflight. De preflight genereert dependency-releasebewijs voor de
   exact uitgecheckte dependencygraph en slaat dit op in het npm-preflight-
   artifact. Bewaar de succesvolle `preflight_run_id`.
7. Start alle prerelease-tests met `Full Release Validation` voor de
   releasebranch, tag of volledige commit-SHA. Dit is het enige handmatige entrypoint
   voor de vier grote release-testboxen: Vitest, Docker, QA Lab en Package.
8. Als validatie mislukt, fix dit op de releasebranch en voer het kleinste mislukte
   bestand, de lane, workflowjob, pakketprofiel, provider of model-allowlist opnieuw uit die
   de fix bewijst. Voer de volledige umbrella alleen opnieuw uit wanneer het gewijzigde oppervlak
   eerder bewijs verouderd maakt.
9. Voor een getagde beta-kandidaat voer je
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` uit vanaf de bijbehorende
   `release/YYYY.M.PATCH`-branch. Voor stable geef je ook de vereiste Windows-bron-
   release mee:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   De helper voert de lokale gegenereerde-releasechecks uit, dispatcht of verifieert
   de volledige releasevalidatie en het npm-preflightbewijs, voert Parallels
   fresh/update-bewijs uit tegen de exact voorbereide tarball plus Telegram-pakket-
   bewijs, registreert Plugin npm- en ClawHub-plannen, en print de exacte
   `OpenClaw Release Publish`-opdracht pas nadat de evidencebundle groen is.
   `OpenClaw Release Publish` dispatcht de geselecteerde of alle publiceerbare Plugin-
   pakketten parallel naar npm en dezelfde set naar ClawHub, en promoot daarna het
   voorbereide OpenClaw npm-preflightartifact met de bijbehorende dist-tag zodra
   Plugin npm publish slaagt.
   Nadat de OpenClaw npm publish-child slaagt, maakt of werkt deze de
   bijbehorende GitHub release-/prereleasepagina bij vanuit de complete overeenkomende
   `CHANGELOG.md`-sectie. Stabiele releases die naar npm `latest` worden gepubliceerd, worden de
   nieuwste GitHub-release; stabiele maintenancereleases die op npm `beta` blijven, worden
   aangemaakt met GitHub `latest=false`. De workflow uploadt ook het preflight-
   dependencybewijs, het full-validation-manifest en postpublish registry-
   verificatiebewijs naar de GitHub-release voor incidentrespons na release.
   De publish-workflow print child-run-ID's direct, keurt release environment gates
   automatisch goed wanneer de workflowtoken dat mag, vat mislukte childjobs samen
   met log tails, sluit de GitHub-release en dependency-
   evidence af zodra OpenClaw npm publish slaagt, wacht op ClawHub wanneer
   OpenClaw npm wordt gepubliceerd, voert daarna `pnpm release:verify-beta` uit en
   uploadt postpublish-bewijs voor de GitHub-release, het npm-pakket, geselecteerde
   Plugin npm-pakketten, geselecteerde ClawHub-pakketten, child workflow-run-ID's en
   optionele NPM Telegram-run-ID. Het ClawHub-pad probeert tijdelijke CLI-
   dependency-installatiefouten opnieuw, publiceert plugins die preview passeren zelfs wanneer één
   previewcel flaket, en eindigt met registryverificatie voor elke verwachte
   Plugin-versie zodat gedeeltelijke publicaties zichtbaar en opnieuw uitvoerbaar blijven. Voer daarna de post-publish
   pakketacceptatie uit tegen het gepubliceerde
   `openclaw@YYYY.M.PATCH-beta.N`- of
   `openclaw@beta`-pakket. Als een gepushte of gepubliceerde prerelease een fix nodig heeft,
   maak dan het volgende overeenkomende prereleasenummer; verwijder of herschrijf de oude
   prerelease niet.
10. Ga voor stable alleen verder nadat de gecontroleerde beta- of releasekandidaat het
    vereiste validatiebewijs heeft. Stable npm publish loopt ook via
    `OpenClaw Release Publish`, met hergebruik van het succesvolle preflightartifact via
    `preflight_run_id`; stable macOS-releasegereedheid vereist ook de
    verpakte `.zip`, `.dmg`, `.dSYM.zip` en bijgewerkte `appcast.xml` op `main`.
    De macOS publish-workflow publiceert de ondertekende appcast automatisch naar openbare `main`
    nadat releaseassets zijn geverifieerd; als branchbescherming de directe push blokkeert,
    opent of werkt deze een appcast-PR bij. Gereedheid voor Stable Windows Hub
    vereist de ondertekende `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe` en
    `OpenClawCompanion-SHA256SUMS.txt`-assets op de OpenClaw GitHub-release.
    Geef de exacte ondertekende `openclaw/openclaw-windows-node` release-tag mee als
    `windows_node_tag` en de door de kandidaat goedgekeurde installer-digestmap als
    `windows_node_installer_digests`; `OpenClaw Release Publish` bewaart de
    release-draft, dispatcht `Windows Node Release` en verifieert alle drie
    assets vóór publicatie.
11. Voer na publicatie de npm post-publish-verifier uit, optioneel standalone
    published-npm Telegram E2E wanneer je post-publish kanaalbewijs nodig hebt,
    dist-tagpromotie wanneer nodig, verifieer de gegenereerde GitHub-releasepagina,
    voer de releaseaankondigingsstappen uit, en voltooi daarna [Afsluiting van stabiele
    main](#stable-main-closeout) voordat je een stabiele release als afgerond beschouwt.

## Afsluiting van stabiele main

Stabiele publicatie is niet compleet totdat `main` de daadwerkelijk uitgeleverde
releasestatus bevat.

1. Begin vanaf een frisse, nieuwste `main`. Controleer `release/YYYY.M.PATCH` ertegen en
   forward-port echte fixes die ontbreken op `main`. Merge niet blindelings
   release-only compatibiliteits-, test- of validatie-adapters naar de nieuwere `main`.
2. Stel `main` in op de uitgebrachte stabiele versie, niet op een speculatieve volgende trein. Voer
   `pnpm release:prep` uit na de wijziging van de rootversie, en daarna
   `pnpm deps:shrinkwrap:generate`.
3. Laat de sectie `## YYYY.M.PATCH` in `CHANGELOG.md` op `main` exact overeenkomen met de
   getagde release-branch. Neem de stabiele update van `appcast.xml` op wanneer de mac-release
   er een heeft gepubliceerd.
4. Voeg geen `YYYY.M.PATCH+1`, bètaversie of lege toekomstige changelogsectie
   toe aan `main` totdat de operator die releasetrein expliciet start.
5. Voer `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` en
   `OPENCLAW_TESTBOX=1 pnpm check:changed` uit. Push en verifieer vervolgens dat `origin/main`
   de uitgebrachte versie en changelog bevat voordat je de stabiele release
   als afgerond beschouwt.
6. Houd de repositoryvariabelen `RELEASE_ROLLBACK_DRILL_ID` en
   `RELEASE_ROLLBACK_DRILL_DATE` actueel na elke private rollback-drill.
   `OpenClaw Stable Main Closeout` begint bij de `main`-push die na stabiele publicatie de
   uitgebrachte versie, changelog en appcast bevat. Het leest
   onveranderlijk postpublish-bewijs om de uitgebrachte tag te koppelen aan de runs Full Release
   Validation en Publish, en verifieert daarna de stabiele main-status, release,
   verplichte stabiele soak en blokkerend prestatiebewijs. Het voegt een
   onveranderlijk closeoutmanifest en controlesom toe aan de GitHub-release. De automatische
   push-trigger slaat legacy-releases over die ouder zijn dan onveranderlijk postpublish-
   bewijs; die skip wordt nooit behandeld als een voltooide closeout. Een complete
   closeout vereist beide assets en een overeenkomende controlesom. Een gedeeltelijk manifest
   speelt de vastgelegde `main`-SHA en rollback-drill opnieuw af om identieke
   bytes te regenereren, en voegt daarna de ontbrekende controlesom toe; een ongeldig paar, of een controlesom
   zonder manifest, blijft blokkerend. Een door push getriggerde run zonder repositoryvariabelen voor
   rollback-drills wordt overgeslagen zonder de closeout te voltooien; een ontbrekend of
   meer dan 90 dagen oud drillrecord blijft handmatige, door bewijs onderbouwde
   closeout blokkeren. Private herstelcommando's blijven in het maintainer-only runbook.
   Gebruik handmatige dispatch alleen om een door bewijs onderbouwde stabiele closeout te repareren of opnieuw af te spelen.
   Een legacy fallback-correctietag mag base-package-bewijs alleen hergebruiken wanneer
   de correctietag naar dezelfde source-commit verwijst als de basisstabiele tag.
   Een correctie met een andere source moet eigen packagebewijs
   publiceren en verifiëren.

## Release-preflight

- Voer `pnpm check:test-types` uit vóór de release-preflight, zodat test-TypeScript
  gedekt blijft buiten de snellere lokale `pnpm check`-poort
- Voer `pnpm check:architecture` uit vóór de release-preflight, zodat de bredere
  importcyclus- en architectuurgrenscontroles groen zijn buiten de snellere
  lokale poort
- Voer `pnpm build && pnpm ui:build` uit vóór `pnpm release:check`, zodat de
  verwachte `dist/*`-releaseartefacten en Control UI-bundel bestaan voor de
  pack-validatiestap
- Voer `pnpm release:prep` uit na de root-versieverhoging en vóór het taggen. Het
  voert elke deterministische releasegenerator uit die vaak afwijkt na een
  versie-/configuratie-/API-wijziging: pluginversies, plugininventaris,
  basisconfiguratieschema, configuratiemetadata voor gebundelde kanalen,
  baseline voor configuratiedocumentatie, plugin-SDK-exports en plugin-SDK
  API-baseline. `pnpm release:check` voert die waarborgen opnieuw uit in
  controlemodus en rapporteert elke gegenereerde driftfout die het vindt in één
  doorgang voordat pakketreleasecontroles worden uitgevoerd.
- Pluginversiesynchronisatie werkt officiële pluginpakketversies en bestaande
  `openclaw.compat.pluginApi`-vloeren standaard bij naar de OpenClaw-releaseversie.
  Behandel dat veld als de plugin-SDK/runtime-API-vloer, niet alleen als een
  kopie van de pakketversie: houd bij plugin-only releases die bewust compatibel
  blijven met oudere OpenClaw-hosts de vloer op de oudste ondersteunde host-API
  en documenteer die keuze in het pluginreleasebewijs.
- Voer de handmatige `Full Release Validation`-workflow uit vóór releasegoedkeuring
  om alle prerelease-testboxen vanuit één ingangspunt te starten. Deze accepteert
  een branch, tag of volledige commit-SHA, dispatcht handmatig `CI` en dispatcht
  `OpenClaw Release Checks` voor installatiesmoke, pakketacceptatie,
  cross-OS-pakketcontroles, QA Lab-pariteit, Matrix- en Telegram-lanes. Stabiele
  en volledige runs bevatten altijd uitputtende live/E2E- en
  Docker-releasepad-soak; `run_release_soak=true` blijft behouden voor een
  expliciete beta-soak. Package Acceptance levert de canonieke pakket-Telegram
  E2E tijdens kandidaatvalidatie, waardoor een tweede gelijktijdige live poller
  wordt vermeden.
  Geef `release_package_spec` op na het publiceren van een beta om het
  verzonden npm-pakket te hergebruiken in releasecontroles, Package Acceptance
  en pakket-Telegram E2E zonder de release-tarball opnieuw te bouwen. Geef
  `npm_telegram_package_spec` alleen op wanneer Telegram een ander gepubliceerd
  pakket moet gebruiken dan de rest van de releasevalidatie. Geef
  `package_acceptance_package_spec` op wanneer Package Acceptance een ander
  gepubliceerd pakket moet gebruiken dan de release package spec. Geef
  `evidence_package_spec` op wanneer het releasebewijsrapport moet aantonen dat
  de validatie overeenkomt met een gepubliceerd npm-pakket zonder Telegram E2E af
  te dwingen.
  Voorbeeld:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- Voer de handmatige `Package Acceptance`-workflow uit wanneer je zijkanaalbewijs
  voor een pakketkandidaat wilt terwijl releasewerk doorgaat. Gebruik
  `source=npm` voor `openclaw@beta`, `openclaw@latest` of een exacte
  releaseversie; `source=ref` om een vertrouwde `package_ref`-branch/tag/SHA te
  packen met de huidige `workflow_ref`-harness; `source=url` voor een openbare
  HTTPS-tarball met een verplichte SHA-256 en strikt openbaar URL-beleid;
  `source=trusted-url` voor een benoemd trusted-source-beleid met verplichte
  `trusted_source_id` en SHA-256; of `source=artifact` voor een tarball die door
  een andere GitHub Actions-run is geüpload. De workflow herleidt de kandidaat
  naar `package-under-test`, hergebruikt de Docker E2E-releasescheduler tegen
  die tarball en kan Telegram-QA uitvoeren tegen dezelfde tarball met
  `telegram_mode=mock-openai` of `telegram_mode=live-frontier`. Wanneer de
  geselecteerde Docker-lanes `published-upgrade-survivor` bevatten, is het
  pakketartefact de kandidaat en selecteert `published_upgrade_survivor_baseline`
  de gepubliceerde baseline. `update-restart-auth` gebruikt het kandidaatpakket
  als zowel de geïnstalleerde CLI als de package-under-test, zodat het het
  beheerde herstartpad van het updatecommando van de kandidaat oefent.
  Voorbeeld: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Veelgebruikte profielen:
  - `smoke`: installatie-/kanaal-/agent-, gatewaynetwerk- en configuratieherlaad-lanes
  - `package`: artefact-native pakket-/update-/herstart-/plugin-lanes zonder OpenWebUI of live ClawHub
  - `product`: pakketprofiel plus MCP-kanalen, cron-/subagent-opruiming,
    OpenAI-webzoekopdracht en OpenWebUI
  - `full`: Docker-releasepadchunks met OpenWebUI
  - `custom`: exacte `docker_lanes`-selectie voor een gerichte heruitvoering
- Voer de handmatige `CI`-workflow rechtstreeks uit wanneer je alleen
  deterministische normale CI-dekking voor de releasekandidaat nodig hebt.
  Handmatige CI-dispatches omzeilen changed scoping en forceren de Linux
  Node-shards, bundled-plugin-shards, plugin- en kanaalcontractshards, Node
  22-compatibiliteit, `check-*`, `check-additional-*`,
  built-artifact-smokecontroles, documentatiecontroles, Python-skills, Windows,
  macOS en Control UI i18n-lanes. Losstaande handmatige CI-runs voeren Android
  alleen uit wanneer ze zijn gedispatcht met `include_android=true`;
  `Full Release Validation` geeft die invoer door aan zijn CI-child.
  Voorbeeld met Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Voer `pnpm qa:otel:smoke` uit bij het valideren van releasetelemetrie. Het
  oefent QA-lab via een lokale OTLP/HTTP-ontvanger en verifieert export van
  traces, metrics en logs plus begrensde traceattributen en redactie van inhoud
  en identifiers zonder Opik, Langfuse of een andere externe collector te vereisen.
- Voer `pnpm qa:otel:collector-smoke` uit bij het valideren van
  collectorcompatibiliteit. Het routeert dezelfde QA-lab-OTLP-export via een
  echte OpenTelemetry Collector Docker-container vóór de lokale
  ontvangerasserties.
- Voer `pnpm qa:prometheus:smoke` uit bij het valideren van beschermd
  Prometheus-scrapen. Het oefent QA-lab, wijst ongeauthenticeerde scrapes af en
  verifieert dat releasekritieke metricfamilies vrij blijven van promptinhoud,
  ruwe identifiers, auth-tokens en lokale paden.
- Voer `pnpm qa:observability:smoke` uit wanneer je de source-checkout
  OpenTelemetry- en Prometheus-smoke-lanes direct na elkaar wilt.
- Voer `pnpm release:check` uit vóór elke getagde release
- `OpenClaw NPM Release`-preflight genereert dependency-releasebewijs voordat
  het de npm-tarball packt. De npm advisory vulnerability gate blokkeert de
  release. De transitive manifest risk-, dependency ownership/install surface-
  en dependency change-rapporten zijn alleen releasebewijs. Het dependency
  change-rapport vergelijkt de releasekandidaat met de vorige bereikbare
  releasetag.
- De preflight uploadt dependency evidence als
  `openclaw-release-dependency-evidence-<tag>` en sluit het ook in onder
  `dependency-evidence/` binnen het voorbereide npm-preflightartefact. Het echte
  publicatiepad hergebruikt dat preflightartefact en voegt vervolgens hetzelfde
  bewijs toe aan de GitHub-release als
  `openclaw-<version>-dependency-evidence.zip`.
- Voer `OpenClaw Release Publish` uit voor de muterende publicatiereeks nadat de
  tag bestaat. Dispatch deze vanaf `release/YYYY.M.PATCH` (of `main` bij het
  publiceren van een tag die vanaf main bereikbaar is), geef de releasetag, de
  succesvolle OpenClaw npm `preflight_run_id` en de succesvolle
  `full_release_validation_run_id` door, en houd de standaard
  pluginpublicatiescope `all-publishable` tenzij je bewust een gerichte reparatie
  uitvoert. De workflow serialiseert plugin-npm-publicatie, plugin-ClawHub-
  publicatie en OpenClaw-npm-publicatie, zodat het corepakket niet vóór de
  geëxternaliseerde plugins wordt gepubliceerd.
- Stabiele `OpenClaw Release Publish` vereist een exacte `windows_node_tag` nadat
  de bijpassende non-prerelease `openclaw/openclaw-windows-node`-release bestaat.
  Het vereist ook de door de kandidaat goedgekeurde
  `windows_node_installer_digests`-map. Voordat een publish-child wordt
  gedispatcht, verifieert het dat de bronrelease gepubliceerd is, geen
  prerelease is, de vereiste x64/ARM64-installers bevat en nog steeds overeenkomt
  met die goedgekeurde map. Daarna dispatcht het `Windows Node Release` terwijl
  de OpenClaw-release nog een concept is, waarbij de gepinde installer-digestmap
  ongewijzigd wordt meegenomen. De child-workflow downloadt de ondertekende
  Windows Hub-installers vanaf die exacte tag, vergelijkt ze met de gepinde
  digests, verifieert op een Windows-runner dat hun Authenticode-handtekeningen
  de verwachte OpenClaw Foundation-ondertekenaar gebruiken, schrijft een
  SHA-256-manifest en uploadt de installers plus het manifest naar de canonieke
  OpenClaw GitHub-release, downloadt daarna de gepromoveerde assets opnieuw en
  verifieert de manifestlidmaatschappen en hashes. De parent verifieert vóór
  publicatie het huidige x64-, ARM64- en checksum-assetcontract. Direct herstel
  wijst onverwachte `OpenClawCompanion-*`-assetnamen af voordat de verwachte
  contractassets worden vervangen door de gepinde bronbytes. Dispatch
  `Windows Node Release` alleen handmatig voor herstel en geef altijd een exacte
  tag door, nooit `latest`, plus de expliciete `expected_installer_digests`
  JSON-map uit de goedgekeurde bronrelease. Website-downloadlinks moeten
  verwijzen naar exacte OpenClaw-release-asset-URL's voor de huidige stabiele
  release, of naar `releases/latest/download/...` alleen na verificatie dat de
  nieuwste GitHub-redirect naar diezelfde release wijst; link niet alleen naar
  de releasepagina van de companion-repo.
- Releasecontroles draaien nu in een aparte handmatige workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` voert ook de QA Lab mock parity-lane plus het snelle
  live Matrix-profiel en de Telegram-QA-lane uit vóór releasegoedkeuring. De
  live-lanes gebruiken de `qa-live-shared`-omgeving; Telegram gebruikt ook Convex
  CI-credentialleases. Voer de handmatige `QA-Lab - All Lanes`-workflow uit met
  `matrix_profile=all` en `matrix_shards=true` wanneer je volledige Matrix-
  transport-, media- en E2EE-inventaris parallel wilt.
- Cross-OS runtimevalidatie voor installatie en upgrade maakt deel uit van de
  openbare `OpenClaw Release Checks` en `Full Release Validation`, die de
  herbruikbare workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` rechtstreeks
  aanroepen
- Deze splitsing is bewust: houd het echte npm-releasepad kort, deterministisch
  en artefactgericht, terwijl tragere livecontroles in hun eigen lane blijven
  zodat ze publicatie niet laten vastlopen of blokkeren
- Releasecontroles met secrets moeten worden gedispatcht via `Full Release
Validation` of vanaf de `main`-/release-workflowref, zodat workflowlogica en
  secrets gecontroleerd blijven
- `OpenClaw Release Checks` accepteert een branch, tag of volledige commit-SHA,
  zolang de herleide commit bereikbaar is vanaf een OpenClaw-branch of releasetag
- De validatie-only preflight van `OpenClaw NPM Release` accepteert ook de
  huidige volledige workflow-branch-commit-SHA van 40 tekens zonder een gepushte
  tag te vereisen
- Dat SHA-pad is alleen voor validatie en kan niet worden gepromoveerd naar een
  echte publicatie
- In SHA-modus synthetiseert de workflow `v<package.json version>` alleen voor
  de pakketmetadatacontrole; echte publicatie vereist nog steeds een echte
  releasetag
- Beide workflows houden het echte publicatie- en promotiepad op door GitHub
  gehoste runners, terwijl het niet-muterende validatiepad de grotere
  Blacksmith Linux-runners kan gebruiken
- Die workflow voert
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  uit met zowel de `OPENAI_API_KEY`- als de `ANTHROPIC_API_KEY`-workflowsecrets
- npm-releasepreflight wacht niet langer op de aparte releasecontrole-lane
- Voer lokaal vóór het taggen van een releasekandidaat
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` uit. De
  helper voert de snelle release-guardrails, plugin-npm-/ClawHub-releasecontroles,
  build, UI-build en `release:openclaw:npm:check` uit in de volgorde die vaak
  goedkeuringsblokkerende fouten opvangt voordat de GitHub-publicatieworkflow
  start.
- Voer `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (of de bijpassende beta-/correctietag) uit vóór goedkeuring
- Voer na npm-publicatie uit
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (of de overeenkomende bèta-/correctieversie) om het gepubliceerde registry-
  installatiepad in een verse tijdelijke prefix te verifiëren
- Voer na een bètapublicatie `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` uit
  om onboarding van het geïnstalleerde pakket, Telegram-configuratie en echte Telegram E2E
  te verifiëren tegen het gepubliceerde npm-pakket met de gedeelde geleasede Telegram-credential-
  pool. Lokale eenmalige maintainer-runs mogen de Convex-variabelen weglaten en de drie
  `OPENCLAW_QA_TELEGRAM_*` env-credentials rechtstreeks doorgeven.
- Gebruik `pnpm release:beta-smoke -- --beta betaN` om de volledige post-publicatie bèta-smoke vanaf een maintainer-machine uit te voeren. De helper voert Parallels npm-update-/fresh-target-validatie uit, dispatcht `NPM Telegram Beta E2E`, pollt de exacte workflow-run, downloadt het artifact en print het Telegram-rapport.
- Maintainers kunnen dezelfde post-publicatiecontrole vanuit GitHub Actions uitvoeren via de
  handmatige workflow `NPM Telegram Beta E2E`. Deze is bewust alleen handmatig en
  draait niet bij elke merge.
- Release-automatisering voor maintainers gebruikt nu preflight-dan-promote:
  - echte npm-publicatie moet slagen met een succesvolle npm `preflight_run_id`
  - de echte npm-publicatie moet worden gedispatcht vanaf dezelfde `main`- of
    `release/YYYY.M.PATCH`-branch als de succesvolle preflight-run
  - stabiele npm-releases gebruiken standaard `beta`
  - stabiele npm-publicatie kan expliciet op `latest` richten via workflow-invoer
  - token-gebaseerde npm dist-tag-mutatie staat nu in
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` omdat
    `npm dist-tag add` nog steeds `NPM_TOKEN` nodig heeft terwijl de bronrepo
    publicatie alleen via OIDC houdt
  - openbare `macOS Release` is alleen validatie; wanneer een tag alleen op een
    release-branch staat maar de workflow vanaf `main` wordt gedispatcht, stel dan
    `public_release_branch=release/YYYY.M.PATCH` in
  - echte macOS-publicatie moet slagen met succesvolle macOS `preflight_run_id` en
    `validate_run_id`
  - de echte publicatiepaden promoveren voorbereide artifacts in plaats van ze
    opnieuw te bouwen
- Voor stabiele correctiereleases zoals `YYYY.M.PATCH-N` controleert de post-publicatieverificatie
  ook hetzelfde tijdelijke-prefix-upgradepad van `YYYY.M.PATCH` naar `YYYY.M.PATCH-N`,
  zodat releasecorrecties oudere globale installaties niet stilzwijgend op de
  stabiele basispayload laten staan
- npm-release-preflight faalt gesloten tenzij de tarball zowel
  `dist/control-ui/index.html` als een niet-lege payload `dist/control-ui/assets/` bevat,
  zodat we niet opnieuw een leeg browserdashboard shippen
- Post-publicatieverificatie controleert ook of gepubliceerde Plugin-entrypoints en
  pakketmetadata aanwezig zijn in de geïnstalleerde registry-layout. Een release die
  ontbrekende Plugin-runtimepayloads shipt, faalt de postpublish-verificatie en
  kan niet naar `latest` worden gepromoveerd.
- `pnpm test:install:smoke` dwingt ook het npm pack-`unpackedSize`-budget af op
  de kandidaat-update-tarball, zodat installer-e2e toevallige pack-bloat opvangt
  vóór het releasepublicatiepad
- Als het releasewerk CI-planning, timingmanifests voor extensies of
  extensietestmatrices heeft geraakt, regenereer en review dan de planner-owned
  `plugin-prerelease-extension-shard`-matrixoutputs uit
  `.github/workflows/plugin-prerelease.yml` vóór goedkeuring, zodat release notes geen
  verouderde CI-layout beschrijven
- Gereedheid voor stabiele macOS-releases omvat ook de updater-oppervlakken:
  - de GitHub-release moet uiteindelijk de verpakte `.zip`, `.dmg` en `.dSYM.zip` bevatten
  - `appcast.xml` op `main` moet na publicatie naar de nieuwe stabiele zip wijzen; de
    macOS-publicatieworkflow commit deze automatisch, of opent een appcast-
    PR wanneer direct pushen wordt geblokkeerd
  - de verpakte app moet een niet-debug-bundle-id, een niet-lege Sparkle-feed-
    URL en een `CFBundleVersion` op of boven de canonieke Sparkle-buildvloer
    voor die releaseversie behouden

## Release-testboxen

`Full Release Validation` is hoe operators alle pre-releasetests starten vanuit
één ingangspunt. Gebruik voor commitbewijs dat op een snel bewegende branch is
vastgezet de helper, zodat elke onderliggende workflow draait vanaf een tijdelijke
branch die op de doel-SHA is vastgezet:

```bash
pnpm ci:full-release --sha <full-sha>
```

De helper pusht `release-ci/<sha>-...`, dispatcht `Full Release Validation`
vanaf die branch met `ref=<sha>`, verifieert dat elke onderliggende workflow-`headSha`
overeenkomt met het doel, en verwijdert daarna de tijdelijke branch. Dit voorkomt
dat je per ongeluk een nieuwere onderliggende `main`-run bewijst.

Voer releasebranch- of tagvalidatie uit vanaf de vertrouwde `main`-workflowref
en geef de releasebranch of tag door als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

De workflow lost de doel-ref op, dispatcht handmatige `CI` met
`target_ref=<release-ref>`, en dispatcht daarna `OpenClaw Release Checks`.
`OpenClaw Release Checks` waaiert uit naar install-smoke, cross-OS-releasechecks,
live/E2E Docker-dekking voor het releasepad wanneer soak is ingeschakeld, Package Acceptance
met de canonieke Telegram-package-E2E, QA Lab-pariteit, live Matrix en live
Telegram. Een volledige/all-run is alleen acceptabel wanneer de samenvatting van
`Full Release Validation` `normal_ci`, `plugin_prerelease` en `release_checks` als
geslaagd toont, tenzij een gerichte rerun de afzonderlijke onderliggende `Plugin
Prerelease` opzettelijk heeft overgeslagen. Gebruik de zelfstandige onderliggende
`npm-telegram` alleen voor een gerichte rerun van een gepubliceerd package met
`release_package_spec` of `npm_telegram_package_spec`. De uiteindelijke
verifier-samenvatting bevat tabellen met langzaamste jobs voor elke onderliggende run,
zodat de releasemanager het huidige kritieke pad kan zien zonder logs te downloaden.
Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
complete stagematrix, exacte workflowjobnamen, verschillen tussen stabiel en volledig profiel,
artefacten en handles voor gerichte reruns.
Onderliggende workflows worden gedispatcht vanaf de vertrouwde ref die `Full Release
Validation` draait, normaal `--ref main`, zelfs wanneer de doel-`ref` naar een
oudere releasebranch of tag wijst. Er is geen afzonderlijke workflow-refinvoer
voor Full Release Validation; kies de vertrouwde harness door de workflow-runref te kiezen.
Gebruik `--ref main -f ref=<sha>` niet voor exact commitbewijs op bewegende `main`;
ruwe commit-SHA's kunnen geen workflow-dispatchrefs zijn, dus gebruik
`pnpm ci:full-release --sha <sha>` om de vastgezette tijdelijke branch te maken.

Gebruik `release_profile` om live/provider-breedte te selecteren:

- `minimum`: snelste releasekritieke OpenAI/core live- en Docker-pad
- `stable`: minimum plus stabiele provider/backend-dekking voor releasegoedkeuring
- `full`: stable plus brede adviserende provider/media-dekking

Stabiele en volledige validatie draaien altijd de uitputtende live/E2E-, Docker-
releasepad- en begrensde gepubliceerde upgrade-survivor-sweep vóór promotie.
Gebruik `run_release_soak=true` om dezelfde sweep voor een bèta aan te vragen. Die sweep dekt
de laatste vier stabiele packages plus vastgezette `2026.4.23`- en `2026.5.2`-
baselines plus oudere `2026.4.15`-dekking, waarbij dubbele baselines worden verwijderd en
elke baseline in een eigen Docker-runnerjob wordt geshard.

`OpenClaw Release Checks` gebruikt de vertrouwde workflowref om de doel-ref één keer
op te lossen als `release-package-under-test` en hergebruikt dat artefact in cross-OS,
Package Acceptance en releasepad-Docker-checks wanneer soak draait. Zo blijven
alle packagegerichte boxen op dezelfde bytes en worden herhaalde packagebuilds voorkomen.
Nadat een bèta al op npm staat, stel je `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` in,
zodat releasechecks het verzonden package één keer downloaden, de buildbron-SHA
uit `dist/build-info.json` extraheren en dat artefact hergebruiken voor cross-OS,
Package Acceptance, releasepad-Docker en package-Telegram-lanes.
De cross-OS OpenAI-install-smoke gebruikt `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer de
repo/org-variabele is ingesteld, anders `openai/gpt-5.4`, omdat deze lane
package-installatie, onboarding, Gateway-start en één live agentbeurt bewijst
in plaats van het langzaamste standaardmodel te benchmarken. De bredere live provider-
matrix blijft de plek voor modelspecifieke dekking.

Gebruik deze varianten afhankelijk van de releasestage:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
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
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Gebruik de volledige umbrella niet als eerste rerun na een gerichte fix. Als één box
faalt, gebruik dan de mislukte onderliggende workflow, job, Docker-lane, packageprofiel, model-
provider of QA-lane voor het volgende bewijs. Draai de volledige umbrella alleen opnieuw wanneer
de fix gedeelde release-orkestratie heeft gewijzigd of eerder all-box-bewijs
verouderd heeft gemaakt. De uiteindelijke verifier van de umbrella controleert de vastgelegde
run-id's van onderliggende workflows opnieuw, dus nadat een onderliggende workflow succesvol is
herdraaid, herdraai je alleen de mislukte bovenliggende job `Verify full validation`.

Geef voor begrensd herstel `rerun_group` door aan de umbrella. `all` is de echte
releasecandidate-run, `ci` draait alleen de normale onderliggende CI, `plugin-prerelease`
draait alleen de release-only onderliggende plugin, `release-checks` draait elke release-
box, en de smallere releasegroepen zijn `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` en `npm-telegram`.
Gerichte `npm-telegram`-reruns vereisen `release_package_spec` of
`npm_telegram_package_spec`; volledige/all-runs gebruiken de canonieke package Telegram
E2E binnen Package Acceptance. Gerichte
cross-OS-reruns kunnen `cross_os_suite_filter=windows/packaged-upgrade` of
een andere OS/suite-filter toevoegen. QA-releasecheckfouten blokkeren normale release-
validatie, inclusief vereiste OpenClaw dynamic tool drift in de standaardtier.
Tideclaw-alpha-runs mogen non-package-safety-releasechecklanes nog steeds als
adviserend behandelen. Wanneer `live_suite_filter` expliciet een gated QA-live-lane aanvraagt,
zoals Discord, WhatsApp of Slack, moet de overeenkomende
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`-repovariabele zijn ingeschakeld; anders
faalt invoervastlegging in plaats van de lane stilzwijgend over te slaan.

### Vitest

De Vitest-box is de handmatige onderliggende `CI`-workflow. Handmatige CI omzeilt
bewust changed scoping en dwingt de normale testgrafiek af voor de releasecandidate:
Linux Node-shards, shards voor gebundelde plugins, shards voor plugin- en channel-contracts,
Node 22-compatibiliteit, `check-*`, `check-additional-*`,
smokechecks voor gebouwde artefacten, docs-checks, Python Skills, Windows, macOS,
en Control UI i18n. Android is inbegrepen wanneer `Full Release Validation` de
box draait omdat de umbrella `include_android=true` doorgeeft; zelfstandige handmatige CI
vereist `include_android=true` voor Android-dekking.

Gebruik deze box om te beantwoorden: "is de source tree geslaagd voor de volledige normale testsuite?"
Dit is niet hetzelfde als productvalidatie van het releasepad. Bewijs om te bewaren:

- `Full Release Validation`-samenvatting met de gedispatchte `CI`-run-URL
- `CI`-run groen op de exacte doel-SHA
- namen van mislukte of trage shards uit de CI-jobs bij het onderzoeken van regressies
- Vitest-timingartefacten zoals `.artifacts/vitest-shard-timings.json` wanneer
  een run prestatieanalyse nodig heeft

Draai handmatige CI alleen direct wanneer de release deterministische normale CI nodig heeft maar
niet de Docker-, QA Lab-, live-, cross-OS- of packageboxen. Gebruik de eerste opdracht
voor directe CI zonder Android. Voeg `include_android=true` toe wanneer directe
releasecandidate-CI Android moet dekken:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

De Docker-box zit in `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus de release-mode
`install-smoke`-workflow. Deze valideert de releasecandidate via packaged
Docker-omgevingen in plaats van alleen source-level tests.

Release-Docker-dekking omvat:

- volledige install-smoke met de trage Bun global install-smoke ingeschakeld
- voorbereiding/hergebruik van de root-Dockerfile-smoke-image per doel-SHA, met QR-,
  root/Gateway- en installer/Bun-smokejobs die als afzonderlijke install-smoke-
  shards draaien
- repository-E2E-lanes
- Docker-chunks voor het releasepad: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` en `plugins-runtime-install-h`
- OpenWebUI-dekking binnen de chunk `plugins-runtime-services` wanneer aangevraagd
- gesplitste install/uninstall-lanes voor gebundelde plugins
  `bundled-plugin-install-uninstall-0` tot en met
  `bundled-plugin-install-uninstall-23`
- live/E2E-providersuites en Docker live-modeldekking wanneer releasechecks
  live suites bevatten

Gebruik Docker-artefacten voordat je opnieuw draait. De releasepad-scheduler uploadt
`.artifacts/docker-tests/` met lanelogs, `summary.json`, `failures.json`,
fasetimings, schedulerplan-JSON en rerun-opdrachten. Gebruik voor gericht herstel
`docker_lanes=<lane[,lane]>` op de herbruikbare live/E2E-workflow in plaats van
alle releasechunks opnieuw te draaien. Gegenereerde rerun-opdrachten bevatten eerdere
`package_artifact_run_id` en voorbereide Docker-image-invoer wanneer beschikbaar, zodat een
mislukte lane dezelfde tarball en GHCR-images kan hergebruiken.

### QA Lab

De QA Lab-box maakt ook deel uit van `OpenClaw Release Checks`. Het is de agentic
gedrags- en channel-level releasegate, los van Vitest en Docker-
packagemechanica.

Release-QA Lab-dekking omvat:

- mock-pariteitslane die de OpenAI-candidatelane vergelijkt met de Opus 4.6-
  baseline met het agentic parity pack
- snel live Matrix-QA-profiel met de omgeving `qa-live-shared`
- live Telegram-QA-lane met Convex CI-credentialleases
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke` of
  `pnpm qa:observability:smoke` wanneer releasetelemetrie expliciet lokaal
  bewijs nodig heeft

Gebruik deze box om te beantwoorden: "gedraagt de release zich correct in QA-scenario's en
live channelflows?" Bewaar de artefact-URL's voor pariteit, Matrix en Telegram-
lanes wanneer je de release goedkeurt. Volledige Matrix-dekking blijft beschikbaar als een
handmatige gesharde QA-Lab-run in plaats van de standaard releasekritieke lane.

### Package

De Package-box is de gate voor het installeerbare product. Deze wordt ondersteund door
`Package Acceptance` en de resolver
`scripts/resolve-openclaw-package-candidate.mjs`. De resolver normaliseert een
candidate naar de `package-under-test`-tarball die door Docker E2E wordt gebruikt, valideert
de package-inventaris, registreert de packageversie en SHA-256, en houdt de
workflow-harnessref gescheiden van de packagebronref.

Ondersteunde candidate-bronnen:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, of een exacte OpenClaw-releaseversie
- `source=ref`: verpak een vertrouwde `package_ref`-branch, tag of volledige commit-SHA
  met de geselecteerde `workflow_ref`-harness
- `source=url`: download een openbare HTTPS-`.tgz` met verplichte `package_sha256`;
  URL-referenties, niet-standaard HTTPS-poorten, private/interne/special-use
  hostnamen of opgeloste adressen, en onveilige redirects worden geweigerd
- `source=trusted-url`: download een HTTPS-`.tgz` met verplichte
  `package_sha256` en `trusted_source_id` uit een benoemd beleid in
  `.github/package-trusted-sources.json`; gebruik dit voor door maintainers beheerde
  enterprise-mirrors of private pakketrepository's in plaats van een
  invoerniveau-bypass voor private netwerken toe te voegen aan `source=url`
- `source=artifact`: hergebruik een `.tgz` die door een andere GitHub Actions-run is geüpload

`OpenClaw Release Checks` draait Package Acceptance met `source=artifact`, het
voorbereide releasepakketartefact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance houdt migratie, update,
herstart van update met geconfigureerde auth, live ClawHub Skills-installatie, opruimen van verouderde plugin-afhankelijkheden, offline plugin-fixtures, plugin-update en Telegram-pakket-QA tegen dezelfde opgeloste tarball. Blokkerende releasecontroles gebruiken de standaardbasislijn van het nieuwste gepubliceerde pakket; het bètaprofiel met `run_release_soak=true`, `release_profile=stable` of
`release_profile=full` breidt uit naar elke stabiele, via npm gepubliceerde basislijn van
`2026.4.23` tot en met `latest` plus fixtures voor gemelde issues. Gebruik
Package Acceptance met `source=npm` voor een kandidaat die al is uitgebracht,
`source=ref` voor een door een SHA ondersteunde lokale npm-tarball vóór publicatie,
`source=trusted-url` voor een door maintainers beheerde enterprise/private mirror, of
`source=artifact` voor een voorbereide tarball die door een andere GitHub Actions-run is geüpload.
Het is de GitHub-native
vervanging voor het grootste deel van de pakket-/updatedekking waarvoor eerder
Parallels nodig was. Cross-OS-releasecontroles blijven belangrijk voor OS-specifieke onboarding,
installer- en platformgedrag, maar pakket-/updateproductvalidatie moet
Package Acceptance verkiezen.

De canonieke checklist voor update- en pluginvalidatie is
[Updates en plugins testen](/nl/help/testing-updates-plugins). Gebruik deze bij het
bepalen welke lokale, Docker-, Package Acceptance- of releasecontrole-lane een
plugininstallatie/-update, doctor-opruiming of wijziging in gepubliceerde-pakketmigratie bewijst.
Uitputtende gepubliceerde-updatemigratie vanuit elk stabiel `2026.4.23+`-pakket is
een aparte handmatige `Update Migration`-workflow, geen onderdeel van Full Release CI.

Legacy soepelheid in package-acceptance is bewust tijdgebonden. Pakketten tot en met
`2026.4.25` mogen het compatibiliteitspad gebruiken voor metadatagaten die al naar
npm zijn gepubliceerd: private QA-inventoryvermeldingen die ontbreken in de tarball, ontbrekende
`gateway install --wrapper`, ontbrekende patchbestanden in de uit de tarball afgeleide git-fixture, ontbrekende persistente `update.channel`, legacy plugininstallatierecordlocaties, ontbrekende persistentie van marketplace-installatierecords, en configmetadatamigratie tijdens `plugins update`. Het gepubliceerde `2026.4.26`-pakket mag waarschuwen
voor lokale buildmetadatastempelbestanden die al zijn uitgebracht. Latere pakketten
moeten aan de moderne pakketcontracten voldoen; dezelfde gaten laten releasevalidatie mislukken.

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

- `smoke`: snelle lanes voor pakketinstallatie/kanaal/agent, Gateway-netwerk en configherladen
- `package`: install-/update-/restart-/pluginpakketcontracten plus live ClawHub
  Skills-installatiebewijs; dit is de standaard voor releasecontroles
- `product`: `package` plus MCP-kanalen, cron-/subagent-opruiming, OpenAI-webzoekfunctie
  en OpenWebUI
- `full`: Docker-releasepadsegmenten met OpenWebUI
- `custom`: exacte `docker_lanes`-lijst voor gerichte herhalingen

Voor Telegram-bewijs van pakketkandidaten, schakel `telegram_mode=mock-openai` of
`telegram_mode=live-frontier` in op Package Acceptance. De workflow geeft de
opgeloste `package-under-test`-tarball door aan de Telegram-lane; de zelfstandige
Telegram-workflow accepteert nog steeds een gepubliceerde npm-specificatie voor controles na publicatie.

## Automatisering voor releasepublicatie

`OpenClaw Release Publish` is het normale muterende publicatie-ingangspunt. Het
orkestreert de trusted-publisher-workflows in de volgorde die de release nodig heeft:

1. Check de releasetag uit en los de bijbehorende commit-SHA op.
2. Controleer of de tag bereikbaar is vanuit `main` of `release/*`.
3. Draai `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` met `publish_scope=all-publishable` en
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` met dezelfde scope en SHA.
6. Dispatch `OpenClaw NPM Release` met de releasetag, npm-dist-tag en
   opgeslagen `preflight_run_id` na verificatie van de opgeslagen
   `full_release_validation_run_id`.
7. Maak of werk voor stabiele releases de GitHub-release bij als concept, dispatch
   `Windows Node Release` met de expliciete `windows_node_tag` en
   door de kandidaat goedgekeurde `windows_node_installer_digests`, en verifieer de canonieke
   installer-/checksum-assets voordat het concept wordt gepubliceerd.

Voorbeeld van bètapublicatie:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Stabiele publicatie naar de standaard bèta-dist-tag:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Stabiele promotie rechtstreeks naar `latest` is expliciet:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

Gebruik de lagere-niveauworkflows `Plugin NPM Release` en `Plugin ClawHub Release`
alleen voor gericht herstel- of herpublicatiewerk. `OpenClaw Release Publish` weigert
`plugin_publish_scope=selected` wanneer `publish_openclaw_npm=true`, zodat het kernpakket
niet kan worden uitgebracht zonder elke publiceerbare officiële Plugin, inclusief
`@openclaw/diffs-language-pack`. Stel voor herstel van een geselecteerde Plugin
`publish_openclaw_npm=false` in met `plugin_publish_scope=selected` en
`plugins=@openclaw/name`, of start de onderliggende workflow rechtstreeks.

## NPM-workflowinvoer

`OpenClaw NPM Release` accepteert deze door de operator beheerde invoer:

- `tag`: verplichte releasetag zoals `v2026.4.2`, `v2026.4.2-1` of
  `v2026.4.2-beta.1`; wanneer `preflight_only=true`, mag dit ook de huidige
  volledige 40 tekens lange commit-SHA van de workflowbranch zijn voor een
  preflight die alleen valideert
- `preflight_only`: `true` alleen voor validatie/build/package, `false` voor het
  echte publicatiepad
- `preflight_run_id`: verplicht op het echte publicatiepad, zodat de workflow de
  voorbereide tarball uit de geslaagde preflightrun hergebruikt
- `npm_dist_tag`: npm-doeltag voor het publicatiepad; standaard `beta`

`OpenClaw Release Publish` accepteert deze door de operator beheerde invoer:

- `tag`: verplichte releasetag; moet al bestaan
- `preflight_run_id`: geslaagde preflightrun-id van `OpenClaw NPM Release`;
  verplicht wanneer `publish_openclaw_npm=true`
- `full_release_validation_run_id`: geslaagde run-id van `Full Release Validation`;
  verplicht wanneer `publish_openclaw_npm=true`
- `windows_node_tag`: exacte niet-prerelease-releasetag van `openclaw/openclaw-windows-node`;
  vereist voor stabiele OpenClaw-publicatie
- `windows_node_installer_digests`: door de kandidaat goedgekeurde compacte JSON-map van de
  huidige namen van Windows-installatieprogramma's naar hun vastgezette `sha256:`-digests;
  vereist voor stabiele OpenClaw-publicatie
- `npm_dist_tag`: npm-doeltag voor het OpenClaw-pakket
- `plugin_publish_scope`: standaard `all-publishable`; gebruik `selected` alleen
  voor gericht herstelwerk dat alleen Plugins betreft met `publish_openclaw_npm=false`
- `plugins`: door komma's gescheiden pakketnamen `@openclaw/*` wanneer
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: standaard `true`; stel alleen `false` in wanneer de
  workflow wordt gebruikt als orchestrator voor herstel dat alleen Plugins betreft
- `wait_for_clawhub`: standaard `false`, zodat npm-beschikbaarheid niet wordt geblokkeerd door
  de ClawHub-sidecar; stel alleen `true` in wanneer voltooiing van de workflow ook
  voltooiing van ClawHub moet omvatten

`OpenClaw Release Checks` accepteert deze door de operator beheerde invoer:

- `ref`: branch, tag of volledige commit-SHA om te valideren. Controles met secrets
  vereisen dat de opgeloste commit bereikbaar is vanaf een OpenClaw-branch of
  releasetag.
- `run_release_soak`: kies voor een uitgebreide live/E2E-, Docker-releasepad- en
  all-since upgrade-survivor-duurtest voor bètareleasecontroles. Dit wordt afgedwongen door
  `release_profile=stable` en `release_profile=full`.

Regels:

- Stabiele en correctietags mogen naar `beta` of `latest` publiceren
- Bèta-prereleasetags mogen alleen naar `beta` publiceren
- Voor `OpenClaw NPM Release` is invoer met een volledige commit-SHA alleen toegestaan wanneer
  `preflight_only=true`
- `OpenClaw Release Checks` en `Full Release Validation` zijn altijd
  uitsluitend voor validatie
- Het echte publicatiepad moet dezelfde `npm_dist_tag` gebruiken als tijdens de preflight;
  de workflow verifieert die metadata voordat de publicatie doorgaat

## Stabiele npm-releasereeks

Wanneer je een stabiele npm-release maakt:

1. Voer `OpenClaw NPM Release` uit met `preflight_only=true`
   - Voordat er een tag bestaat, kun je de huidige volledige commit-SHA van de
     workflowbranch gebruiken voor een validatie-only dryrun van de preflightworkflow
2. Kies `npm_dist_tag=beta` voor de normale beta-eerst-flow, of alleen `latest`
   wanneer je bewust rechtstreeks stabiel wilt publiceren
3. Voer `Full Release Validation` uit op de releasebranch, releasetag, of volledige
   commit-SHA wanneer je normale CI plus live prompt cache, Docker, QA Lab,
   Matrix en Telegram-dekking vanuit één handmatige workflow wilt
4. Als je bewust alleen de deterministische normale testgrafiek nodig hebt, voer dan
   in plaats daarvan de handmatige `CI`-workflow uit op de release-ref
5. Selecteer de exacte niet-prerelease `openclaw/openclaw-windows-node`-releasetag
   waarvan de ondertekende x64- en ARM64-installatieprogramma's moeten worden
   geleverd. Sla die op als `windows_node_tag`, en sla hun gevalideerde digest-map
   op als `windows_node_installer_digests`. De release-candidate-helper registreert
   beide en neemt ze op in de gegenereerde publicatieopdracht.
6. Sla de geslaagde `preflight_run_id` en `full_release_validation_run_id` op
7. Voer `OpenClaw Release Publish` uit met dezelfde `tag`, dezelfde `npm_dist_tag`,
   de geselecteerde `windows_node_tag`, de opgeslagen `windows_node_installer_digests`,
   de opgeslagen `preflight_run_id` en de opgeslagen `full_release_validation_run_id`;
   dit publiceert geëxternaliseerde plugins naar npm en ClawHub voordat het
   OpenClaw npm-pakket wordt gepromoot
8. Als de release op `beta` is geland, gebruik dan de
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`-workflow
   om die stabiele versie van `beta` naar `latest` te promoveren
9. Als de release bewust rechtstreeks naar `latest` is gepubliceerd en `beta`
   onmiddellijk dezelfde stabiele build moet volgen, gebruik dan dezelfde
   releaseworkflow om beide dist-tags naar de stabiele versie te laten wijzen,
   of laat de geplande self-healing-sync `beta` later verplaatsen

De dist-tag-mutatie staat in de release-ledger-repo omdat die nog steeds
`NPM_TOKEN` vereist, terwijl de sourcerepo publicatie met alleen OIDC behoudt.

Daardoor blijven zowel het rechtstreekse publicatiepad als het beta-eerst-promotiepad
gedocumenteerd en zichtbaar voor operators.

Als een maintainer moet terugvallen op lokale npm-authenticatie, voer dan alle
1Password CLI (`op`)-opdrachten alleen uit binnen een dedicated tmux-sessie. Roep `op`
niet rechtstreeks aan vanuit de shell van de hoofdagent; door het binnen tmux te
houden, blijven prompts, waarschuwingen en OTP-afhandeling observeerbaar en worden
herhaalde hostwaarschuwingen voorkomen.

## Openbare referenties

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
