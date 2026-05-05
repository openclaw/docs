---
read_when:
    - Je moet begrijpen waarom een CI-taak wel of niet is uitgevoerd
    - Je debugt een mislukte GitHub Actions-check
    - Je coördineert een releasevalidatierun of heruitvoering
    - Je wijzigt ClawSweeper-dispatch of het doorsturen van GitHub-activiteit
summary: CI-taakgrafiek, scopecontroles, release-overkoepelingen en equivalenten voor lokale opdrachten
title: CI-pijplijn
x-i18n:
    generated_at: "2026-05-05T06:16:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 31fe6704e18f9efc519a1a73fc3aa8ae3909d6a27553874eb477e73979a94af2
    source_path: ci.md
    workflow: 16
---

OpenClaw CI draait bij elke push naar `main` en elke pull request. De taak `preflight` classificeert de diff en schakelt dure lanes uit wanneer alleen niet-gerelateerde gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen bewust slimme scopebepaling en waaieren de volledige grafiek uit voor releasekandidaten en brede validatie. Android-lanes blijven opt-in via `include_android`. Plugin-dekking die alleen voor releases geldt, staat in de aparte workflow [`Plugin-voorrelease`](#plugin-prerelease) en draait alleen vanuit [`Volledige releasevalidatie`](#full-release-validation) of een expliciete handmatige dispatch.

## Pipelineoverzicht

| Taak                              | Doel                                                                                                   | Wanneer deze draait                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Wijzigingen alleen in docs, gewijzigde scopes, gewijzigde extensions en het CI-manifest detecteren                   | Altijd bij niet-conceptpushes en PR's |
| `security-scm-fast`              | Detectie van privésleutels en workflow-audit via `zizmor`                                                     | Altijd bij niet-conceptpushes en PR's |
| `security-dependency-audit`      | Productie-lockfile-audit zonder afhankelijkheden tegen npm-advisories                                          | Altijd bij niet-conceptpushes en PR's |
| `security-fast`                  | Vereiste aggregatie voor de snelle beveiligingstaken                                                             | Altijd bij niet-conceptpushes en PR's |
| `check-dependencies`             | Productie-Knip-pass alleen voor afhankelijkheden plus de allowlist-bewaker voor ongebruikte bestanden                                 | Node-relevante wijzigingen              |
| `build-artifacts`                | Bouwt `dist/`, Control UI, checks voor gebouwde artefacten en herbruikbare downstream artefacten                       | Node-relevante wijzigingen              |
| `checks-fast-core`               | Snelle Linux-correctheidslanes zoals checks voor gebundelde/plugins-contracten/protocollen                              | Node-relevante wijzigingen              |
| `checks-fast-contracts-channels` | Gespreide kanaalcontractchecks met een stabiel geaggregeerd checkresultaat                                      | Node-relevante wijzigingen              |
| `checks-node-core-test`          | Core Node-testshards, exclusief kanaal-, gebundelde, contract- en extension-lanes                          | Node-relevante wijzigingen              |
| `check`                          | Gespreide equivalent van de belangrijkste lokale gate: prod-types, lint, bewakers, testtypes en strikte smoke                | Node-relevante wijzigingen              |
| `check-additional`               | Architectuur, gespreide boundary-/promptdrift, extension-bewakers, package-boundary en Gateway-watch        | Node-relevante wijzigingen              |
| `build-smoke`                    | Smoke-tests voor de gebouwde CLI en smoke voor opstartgeheugen                                                            | Node-relevante wijzigingen              |
| `checks`                         | Verificatie voor gebouwde-artefact-kanaaltests                                                                 | Node-relevante wijzigingen              |
| `checks-node-compat-node22`      | Compatibiliteitsbuild en smoke-lane voor Node 22                                                                | Handmatige CI-dispatch voor releases    |
| `check-docs`                     | Docs-formattering, lint en checks op kapotte links                                                             | Docs gewijzigd                       |
| `skills-python`                  | Ruff + pytest voor Python-ondersteunde Skills                                                                    | Python-Skills-relevante wijzigingen      |
| `checks-windows`                 | Windows-specifieke proces-/padtests plus regressies in gedeelde runtime-importspecifiers                      | Windows-relevante wijzigingen           |
| `macos-node`                     | macOS TypeScript-testlane met de gedeelde gebouwde artefacten                                               | macOS-relevante wijzigingen             |
| `macos-swift`                    | Swift-lint, build en tests voor de macOS-app                                                            | macOS-relevante wijzigingen             |
| `android`                        | Android-unittests voor beide smaken plus één debug-APK-build                                              | Android-relevante wijzigingen           |
| `test-performance-agent`         | Dagelijkse optimalisatie van trage Codex-tests na vertrouwde activiteit                                                 | Succesvolle main-CI of handmatige dispatch |
| `openclaw-performance`           | Dagelijkse/op aanvraag Kova-runtimeprestatierapporten met mock-provider, deep-profile en live-lanes voor GPT 5.4 | Geplande en handmatige dispatch      |

## Fail-fast-volgorde

1. `preflight` bepaalt welke lanes überhaupt bestaan. De logica `docs-scope` en `changed-scope` bestaat uit stappen binnen deze taak, geen zelfstandige taken.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` en `skills-python` falen snel zonder te wachten op de zwaardere artefact- en platformmatrixtaken.
3. `build-artifacts` overlapt met de snelle Linux-lanes, zodat downstream consumers kunnen starten zodra de gedeelde build klaar is.
4. Zwaardere platform- en runtimelanes waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` en `android`.

GitHub kan vervangen taken als `cancelled` markeren wanneer een nieuwere push op dezelfde PR- of `main`-ref binnenkomt. Behandel dat als CI-ruis, tenzij de nieuwste run voor dezelfde ref ook faalt. Geaggregeerde shardchecks gebruiken `!cancelled() && always()`, zodat ze normale shardfouten nog steeds rapporteren, maar niet meer in de wachtrij komen nadat de hele workflow al is vervangen. De automatische CI-concurrency-sleutel is geversioneerd (`CI-v7-*`), zodat een zombie aan GitHub-zijde in een oude queuegroep nieuwere main-runs niet onbeperkt kan blokkeren. Handmatige full-suite-runs gebruiken `CI-manual-v1-*` en annuleren lopende runs niet.

## Scope en routering

Scopelogica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unittests in `src/scripts/ci-changed-scope.test.ts`. Handmatige dispatch slaat detectie van changed-scope over en laat het preflight-manifest zich gedragen alsof elk gescoped gebied is gewijzigd.

- **CI-workflowwijzigingen** valideren de Node CI-grafiek plus workflow-linting, maar forceren op zichzelf geen native builds voor Windows, Android of macOS; die platformlanes blijven gescoped op wijzigingen in platformbroncode.
- **Wijzigingen alleen in CI-routering, geselecteerde goedkope fixturewijzigingen voor core-tests en smalle wijzigingen in Plugin-contracthelpers/testroutering** gebruiken een snel manifestpad alleen voor Node: `preflight`, beveiliging en één `checks-fast-core`-taak. Dat pad slaat buildartefacten, Node 22-compatibiliteit, kanaalcontracten, volledige core-shards, shards voor gebundelde Plugins en extra bewakermatrices over wanneer de wijziging beperkt is tot de routerings- of helperoppervlakken die de snelle taak direct oefent.
- **Windows Node-checks** zijn gescoped op Windows-specifieke proces-/padwrappers, npm/pnpm/UI-runnerhelpers, configuratie voor package managers en de CI-workflowoppervlakken die die lane uitvoeren; niet-gerelateerde broncode-, Plugin-, install-smoke- en alleen-testwijzigingen blijven op de Linux Node-lanes.

De traagste Node-testfamilies zijn opgesplitst of gebalanceerd zodat elke taak klein blijft zonder runners te ruim te reserveren: kanaalcontracten draaien als drie gewogen shards, core unit fast/support-lanes draaien apart, core-runtime-infra is opgesplitst tussen state- en process/config-shards, auto-reply draait als gebalanceerde workers (waarbij de reply-subtree is opgesplitst in agent-runner-, dispatch- en commands/state-routing-shards), en agentic Gateway/server-configuraties zijn opgesplitst over chat/auth/model/http-plugin/runtime/startup-lanes in plaats van te wachten op gebouwde artefacten. Brede browser-, QA-, media- en diverse Plugin-tests gebruiken hun eigen Vitest-configuraties in plaats van de gedeelde Plugin-catch-all. Include-pattern-shards registreren timingvermeldingen met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een volledige configuratie kan onderscheiden van een gefilterde shard. `check-additional` houdt compile-/canary-werk voor package-boundary bij elkaar en scheidt runtime-topologiearchitectuur van Gateway-watch-dekking; de lijst met boundarybewakers wordt over vier matrixshards verdeeld, waarbij elke shard geselecteerde onafhankelijke bewakers gelijktijdig uitvoert en timing per check afdrukt, inclusief `pnpm prompt:snapshots:check`, zodat promptdrift in het happy path van de Codex-runtime wordt vastgepind aan de PR die deze veroorzaakte. Gateway-watch, kanaaltests en de core support-boundary-shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd.

Android-CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play-debug-APK. De third-party-smaak heeft geen aparte source set of manifest; de unittests-lane compileert de smaak nog steeds met de BuildConfig-flags voor SMS/call-log, terwijl een dubbele debug-APK-packagetaak bij elke Android-relevante push wordt vermeden.

De shard `check-dependencies` draait `pnpm deadcode:dependencies` (een productie-Knip-pass alleen voor afhankelijkheden, vastgezet op de nieuwste Knip-versie, met pnpm's minimum release age uitgeschakeld voor de `dlx`-installatie) en `pnpm deadcode:unused-files`, dat Knips productiebevindingen voor ongebruikte bestanden vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. De bewaker voor ongebruikte bestanden faalt wanneer een PR een nieuw, niet-beoordeeld ongebruikt bestand toevoegt of een verouderde allowlist-vermelding laat staan, terwijl bewuste dynamische Plugin-, gegenereerde, build-, live-test- en package-bridge-oppervlakken behouden blijven die Knip niet statisch kan oplossen.

## ClawSweeper-activiteit doorsturen

`.github/workflows/clawsweeper-dispatch.yml` is de brug aan de doelzijde van OpenClaw-repositoryactiviteit naar ClawSweeper. Deze workflow checkt geen onvertrouwde pull request-code uit en voert die ook niet uit. De workflow maakt een GitHub App-token uit `CLAWSWEEPER_APP_PRIVATE_KEY` en dispatcht vervolgens compacte `repository_dispatch`-payloads naar `openclaw/clawsweeper`.

De workflow heeft vier lanes:

- `clawsweeper_item` voor exacte reviewverzoeken voor issues en pull requests;
- `clawsweeper_comment` voor expliciete ClawSweeper-commando's in issue-opmerkingen;
- `clawsweeper_commit_review` voor reviewverzoeken op commitniveau bij pushes naar `main`;
- `github_activity` voor algemene GitHub-activiteit die de ClawSweeper-agent mag inspecteren.

De lane `github_activity` stuurt alleen genormaliseerde metadata door: eventtype, actie, actor, repository, itemnummer, URL, titel, status en korte fragmenten voor opmerkingen of reviews wanneer aanwezig. Deze vermijdt bewust het doorsturen van de volledige webhook-body. De ontvangende workflow in `openclaw/clawsweeper` is `.github/workflows/github-activity.yml`, die het genormaliseerde event post naar de OpenClaw Gateway-hook voor de ClawSweeper-agent.

Algemene activiteit is observatie, geen standaardlevering. De ClawSweeper-agent ontvangt het Discord-doel in zijn prompt en mag alleen naar `#clawsweeper` posten wanneer het event verrassend, actiegericht, risicovol of operationeel nuttig is. Routinematige opens, edits, botverloop, dubbele Webhook-ruis en normaal reviewverkeer moeten resulteren in `NO_REPLY`.

Behandel GitHub-titels, opmerkingen, bodies, reviewtekst, branchnamen en commitberichten in dit hele pad als onvertrouwde data. Ze zijn invoer voor samenvatting en triage, geen instructies voor de workflow of agentruntime.

## Handmatige dispatches

Handmatige CI-dispatches voeren dezelfde jobgrafiek uit als normale CI, maar schakelen elke niet-Android-scoped lane geforceerd in: Linux Node-shards, gebundelde Plugin-shards, kanaalcontracten, Node 22-compatibiliteit, `check`, `check-additional`, build-smoke, docs-controles, Python Skills, Windows, macOS en Control UI-i18n. Zelfstandige handmatige CI-dispatches voeren alleen Android uit met `include_android=true`; de volledige releaseparaplu schakelt Android in door `include_android=true` door te geven. Statische controles voor Plugin-prereleases, de release-only `agentic-plugins`-shard, de volledige batch-sweep voor extensies en Docker-lanes voor Plugin-prereleases zijn uitgesloten van CI. De Docker-prerelease-suite wordt alleen uitgevoerd wanneer `Full Release Validation` de afzonderlijke `Plugin Prerelease`-workflow dispatcht met de releasevalidatiegate ingeschakeld.

Handmatige runs gebruiken een unieke concurrencygroep, zodat een volledige release-candidate-suite niet wordt geannuleerd door een andere push- of PR-run op dezelfde ref. Met de optionele `target_ref`-invoer kan een vertrouwde aanroeper die grafiek uitvoeren tegen een branch, tag of volledige commit-SHA terwijl het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, snelle beveiligingstaken en aggregaten (`security-scm-fast`, `security-dependency-audit`, `security-fast`), snelle protocol-/contract-/gebundelde controles, gesharde kanaalcontractcontroles, `check`-shards behalve lint, `check-additional`-shards en aggregaten, aggregaatverifiers voor Node-tests, docs-controles, Python Skills, workflow-sanity, labeler, auto-response; install-smoke-preflight gebruikt ook door GitHub gehoste Ubuntu zodat de Blacksmith-matrix eerder in de wachtrij kan komen |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lichtere extensieshards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` en `check-test-types`                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node-testshards, gebundelde Plugin-testshards, `android`                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-gevoelig genoeg dat 8 vCPU meer kostte dan het bespaarde); install-smoke Docker-builds (32-vCPU-wachtrijtijd kostte meer dan het bespaarde)                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |

## Lokale equivalenten

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw Performance

`OpenClaw Performance` is de workflow voor product-/runtimeprestaties. Deze draait dagelijks op `main` en kan handmatig worden gedispatcht:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Een handmatige dispatch benchmarkt normaal gesproken de workflow-ref. Stel `target_ref` in om een releasetag of een andere branch te benchmarken met de huidige workflowimplementatie. Gepubliceerde rapportpaden en laatste-pointers worden gesleuteld op de geteste ref, en elke `index.md` registreert de geteste ref/SHA, workflow-ref/SHA, Kova-ref, profiel, lane-authmodus, model, herhalingsaantal en scenariofilters.

De workflow installeert OCM vanuit een gepinde release en Kova vanuit `openclaw/Kova` op de gepinde `kova_ref`-invoer, en voert vervolgens drie lanes uit:

- `mock-provider`: diagnostische Kova-scenario's tegen een runtime uit een lokale build met deterministische neppe OpenAI-compatibele auth.
- `mock-deep-profile`: CPU-/heap-/traceprofiling voor hotspots bij opstarten, Gateway en agentbeurten.
- `live-gpt54`: een echte OpenAI `openai/gpt-5.4`-agentbeurt, overgeslagen wanneer `OPENAI_API_KEY` niet beschikbaar is.

De mock-provider-lane voert na de Kova-pass ook OpenClaw-native bronprobes uit: Gateway-boottiming en geheugen voor standaard-, hook- en 50-Plugin-opstartgevallen; herhaalde mock-OpenAI `channel-chat-baseline` hallo-loops; en CLI-opstartcommando's tegen de gebootte Gateway. De Markdown-samenvatting van de bronprobe staat op `source/index.md` in de rapportbundle, met de ruwe JSON ernaast.

Elke lane uploadt GitHub-artifacts. Wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd, commit de workflow ook `report.json`, `report.md`, bundles, `index.md` en bronprobe-artifacts naar `openclaw/clawgrit-reports` onder `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. De huidige pointer voor de geteste ref wordt geschreven als `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Volledige Releasevalidatie

`Full Release Validation` is de handmatige parapluworkflow voor "alles uitvoeren vóór release." Deze accepteert een branch, tag of volledige commit-SHA, dispatcht de handmatige `CI`-workflow met dat doel, dispatcht `Plugin Prerelease` voor release-only Plugin-/package-/statische-/Docker-bewijzen, en dispatcht `OpenClaw Release Checks` voor install-smoke, package-acceptatie, cross-OS-packagecontroles, QA Lab-pariteit, Matrix en Telegram-lanes. Stabiele/standaardruns houden uitputtende live/E2E- en Docker-releasepaddekking achter `run_release_soak=true`; `release_profile=full` forceert die soakdekking aan zodat brede advisoryvalidatie breed blijft. Met `rerun_group=all` en `release_profile=full` voert deze ook `NPM Telegram Beta E2E` uit tegen het `release-package-under-test`-artifact uit releasecontroles. Geef na publicatie `npm_telegram_package_spec` door om dezelfde Telegram-package-lane opnieuw uit te voeren tegen het gepubliceerde npm-package.

Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
fasematrix, exacte workflow-jobnamen, profielverschillen, artifacts en
gerichte rerun-handles.

`OpenClaw Release Publish` is de handmatige muterende releaseworkflow. Dispatch deze
vanaf `release/YYYY.M.D` of `main` nadat de releasetag bestaat en nadat de
OpenClaw npm-preflight is geslaagd. Deze verifieert `pnpm plugins:sync:check`,
dispatcht `Plugin NPM Release` voor alle publiceerbare Plugin-packages, dispatcht
`Plugin ClawHub Release` voor dezelfde release-SHA, en dispatcht pas daarna
`OpenClaw NPM Release` met de opgeslagen `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Voor bewijs van een gepinde commit op een snel bewegende branch gebruik je de helper in plaats van
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-workflow-dispatchrefs moeten branches of tags zijn, geen ruwe commit-SHA's. De
helper pusht een tijdelijke `release-ci/<sha>-...`-branch op de doel-SHA,
dispatcht `Full Release Validation` vanaf die gepinde ref, verifieert dat elke child-
workflow-`headSha` overeenkomt met het doel, en verwijdert de tijdelijke branch wanneer de
run is voltooid. De parapluverifier faalt ook als een child-workflow op een
andere SHA heeft gedraaid.

`release_profile` bepaalt de live/provider-breedte die aan releasecontroles wordt doorgegeven. De
handmatige releaseworkflows gebruiken standaard `stable`; gebruik `full` alleen wanneer je
bewust de brede adviserende provider-/mediamatrix wilt. `run_release_soak`
bepaalt of stabiele/standaard releasecontroles de uitputtende live/E2E- en
Docker-releasepad-soak uitvoeren; `full` dwingt soak af.

- `minimum` behoudt de snelste OpenAI/core release-kritieke lanes.
- `stable` voegt de stabiele provider-/backendset toe.
- `full` voert de brede adviserende provider-/mediamatrix uit.

De overkoepelende workflow registreert de verzonden child-run-id's, en de laatste taak `Verify full validation` controleert opnieuw de huidige conclusies van child-runs en voegt tabellen met langzaamste taken toe voor elke child-run. Als een child-workflow opnieuw wordt uitgevoerd en groen wordt, voer dan alleen de bovenliggende verifier-taak opnieuw uit om het overkoepelende resultaat en de timingsamenvatting te vernieuwen.

Voor herstel accepteren zowel `Full Release Validation` als `OpenClaw Release Checks` `rerun_group`. Gebruik `all` voor een releasekandidaat, `ci` voor alleen de normale volledige CI-child, `plugin-prerelease` voor alleen de plugin-prerelease-child, `release-checks` voor elke release-child, of een smallere groep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, of `npm-telegram` op de overkoepelende workflow. Dit houdt het opnieuw uitvoeren van een mislukte releasebox begrensd na een gerichte fix. Combineer voor één mislukte cross-OS-lane `rerun_group=cross-os` met `cross_os_suite_filter`, bijvoorbeeld `windows/packaged-upgrade`; lange cross-OS-commando's geven heartbeat-regels, en packaged-upgrade-samenvattingen bevatten timings per fase. QA-releasecheck-lanes zijn adviserend, dus fouten alleen in QA waarschuwen wel, maar blokkeren de releasecheck-verifier niet.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde ref één keer om te zetten naar een `release-package-under-test`-tarball, en geeft dat artefact vervolgens door aan cross-OS-controles en Package Acceptance, plus de live/E2E-releasepad-Docker-workflow wanneer soak-dekking wordt uitgevoerd. Dat houdt de package-bytes consistent tussen releaseboxen en voorkomt dat dezelfde kandidaat opnieuw wordt ingepakt in meerdere child-taken.

Dubbele `Full Release Validation`-runs voor `ref=main` en `rerun_group=all`
vervangen de oudere overkoepelende workflow. De bovenliggende monitor annuleert elke child-workflow die hij
al heeft verzonden wanneer de bovenliggende workflow wordt geannuleerd, zodat nieuwere main-validatie
niet achter een verouderde releasecheck-run van twee uur blijft staan. Validatie van releasebranches/-tags
en gerichte rerun-groepen houden `cancel-in-progress: false`.

## Live- en E2E-shards

De release-live/E2E-child behoudt brede native `pnpm test:live`-dekking, maar voert die uit als benoemde shards via `scripts/test-live-shard.mjs` in plaats van één seriële taak:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-gefilterde `native-live-src-gateway-profiles`-taken
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- gesplitste media-audio-/videoshards en provider-gefilterde muziekshards

Dat behoudt dezelfde bestandsdekking en maakt trage live-providerfouten makkelijker opnieuw uit te voeren en te diagnosticeren. De geaggregeerde shardnamen `native-live-extensions-o-z`, `native-live-extensions-media` en `native-live-extensions-media-music` blijven geldig voor handmatige eenmalige reruns.

De native live-mediashards draaien in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de workflow `Live Media Runner Image`. Die image installeert `ffmpeg` en `ffprobe` vooraf; mediataken controleren alleen de binaries vóór de setup. Houd Docker-ondersteunde live-suites op normale Blacksmith-runners — containerjobs zijn de verkeerde plek om geneste Dockertests te starten.

Docker-ondersteunde live-model-/backendshards gebruiken een afzonderlijke gedeelde `ghcr.io/openclaw/openclaw-live-test:<sha>`-image per geselecteerde commit. De live-releaseworkflow bouwt en pusht die image één keer, waarna de Docker-live-model-, provider-gesharde Gateway-, CLI-backend-, ACP-bind- en Codex-harnessshards draaien met `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway-Docker-shards hebben expliciete time-outlimieten op scriptniveau onder de workflowtaaktime-out, zodat een vastgelopen container of opruimpad snel faalt in plaats van het hele releasecheckbudget te verbruiken. Als die shards het volledige source-Docker-doel onafhankelijk opnieuw bouwen, is de releaserun verkeerd geconfigureerd en verspilt die wandkloktijd aan dubbele image-builds.

## Package Acceptance

Gebruik `Package Acceptance` wanneer de vraag is: "werkt dit installeerbare OpenClaw-package als product?" Het verschilt van normale CI: normale CI valideert de source tree, terwijl Package Acceptance één tarball valideert via dezelfde Docker-E2E-harness die gebruikers na installatie of update uitvoeren.

### Taken

1. `resolve_package` checkt `workflow_ref` uit, bepaalt één packagekandidaat, schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het artefact `package-under-test`, en toont de bron, workflow-ref, package-ref, versie, SHA-256 en het profiel in de GitHub-stapsamenvatting.
2. `docker_acceptance` roept `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt dat artefact, valideert de tarball-inventaris, bereidt package-digest-Docker-images voor wanneer nodig, en voert de geselecteerde Docker-lanes uit tegen dat package in plaats van de workflow-checkout in te pakken. Wanneer een profiel meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het package en de gedeelde images één keer voor, en waaiert die lanes daarna uit als parallelle gerichte Docker-taken met unieke artefacten.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Dit draait wanneer `telegram_mode` niet `none` is en installeert hetzelfde `package-under-test`-artefact wanneer Package Acceptance er één heeft bepaald; zelfstandige Telegram-dispatch kan nog steeds een gepubliceerde npm-spec installeren.
4. `summary` laat de workflow falen als package-resolutie, Docker Acceptance of de optionele Telegram-lane is mislukt.

### Kandidaatbronnen

- `source=npm` accepteert alleen `openclaw@beta`, `openclaw@latest`, of een exacte OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor gepubliceerde prerelease-/stabiele acceptatie.
- `source=ref` pakt een vertrouwde `package_ref`-branch, tag of volledige commit-SHA in. De resolver haalt OpenClaw-branches/-tags op, verifieert dat de geselecteerde commit bereikbaar is vanuit de branchgeschiedenis van de repository of een releasetag, installeert afhankelijkheden in een detached worktree, en pakt die in met `scripts/package-openclaw-for-docker.mjs`.
- `source=url` downloadt een HTTPS-`.tgz`; `package_sha256` is vereist.
- `source=artifact` downloadt één `.tgz` uit `artifact_run_id` en `artifact_name`; `package_sha256` is optioneel maar moet worden opgegeven voor extern gedeelde artefacten.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde workflow-/harnesscode die de test uitvoert. `package_ref` is de source-commit die wordt ingepakt wanneer `source=ref`. Hiermee kan de huidige testharness oudere vertrouwde source-commits valideren zonder oude workflowlogica uit te voeren.

### Suiteprofielen

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — volledige Docker-releasepadchunks met OpenWebUI
- `custom` — exacte `docker_lanes`; vereist wanneer `suite_profile=custom`

Het profiel `package` gebruikt offline plugindekking zodat gepubliceerde-packagevalidatie niet afhankelijk is van live ClawHub-beschikbaarheid. De optionele Telegram-lane hergebruikt het `package-under-test`-artefact in `NPM Telegram Beta E2E`, terwijl het pad met de gepubliceerde npm-spec behouden blijft voor zelfstandige dispatches.

Zie [Updates en plugins testen](/nl/help/testing-updates-plugins) voor het specifieke beleid voor update- en plugintests, inclusief lokale commando's,
Docker-lanes, Package Acceptance-inputs, releasestandaarden en fouttriage.

Releasecontroles roepen Package Acceptance aan met `source=artifact`, het voorbereide releasepackage-artefact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, en `telegram_mode=mock-openai`. Dit houdt bewijs voor packagemigratie, update, opruiming van verouderde pluginafhankelijkheden, herstel van geconfigureerde-plugininstallaties, offline plugin, pluginupdate en Telegram op dezelfde bepaalde packagetarball. Stel `package_acceptance_package_spec` in op Full Release Validation of OpenClaw Release Checks om dezelfde matrix uit te voeren tegen een geleverd npm-package in plaats van het uit de SHA gebouwde artefact. Cross-OS-releasecontroles dekken nog steeds OS-specifieke onboarding, installer- en platformgedrag; productvalidatie voor packages/updates moet beginnen met Package Acceptance. De Docker-lane `published-upgrade-survivor` valideert één gepubliceerde packagebaseline per run in het blokkerende releasepad. In Package Acceptance is de bepaalde `package-under-test`-tarball altijd de kandidaat en selecteert `published_upgrade_survivor_baseline` de terugvalbaseline uit gepubliceerde packages, standaard `openclaw@latest`; rerun-commando's voor mislukte lanes behouden die baseline. Full Release Validation met `run_release_soak=true` of `release_profile=full` stelt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` en `published_upgrade_survivor_scenarios=reported-issues` in om uit te breiden over de vier nieuwste stabiele npm-releases plus vastgepinde grensreleases voor plugincompatibiliteit en issue-vormige fixtures voor Feishu-configuratie, behouden bootstrap-/personabestanden, geconfigureerde OpenClaw-plugininstallaties, tilde-logpaden en verouderde legacy-pluginafhankelijkheidsroots. Gepubliceerde-upgrade-survivor-selecties met meerdere baselines worden per baseline geshard naar afzonderlijke gerichte Docker-runnertaken. De afzonderlijke workflow `Update Migration` gebruikt de Docker-lane `update-migration` met `all-since-2026.4.23` en `plugin-deps-cleanup` wanneer de vraag uitputtende opruiming van gepubliceerde updates is, niet normale volledige Release CI-breedte. Lokale geaggregeerde runs kunnen exacte packagespecs doorgeven met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, één lane behouden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` zoals `openclaw@2026.4.15`, of `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` instellen voor de scenariomatrix. De gepubliceerde lane configureert de baseline met een ingebakken `openclaw config set`-commandorecept, registreert receptstappen in `summary.json`, en peilt `/healthz`, `/readyz`, plus RPC-status nadat de Gateway is gestart. De Windows packaged- en installer-fresh-lanes verifiëren ook dat een geïnstalleerd package een browser-control-override kan importeren vanaf een raw absoluut Windows-pad. De OpenAI cross-OS agent-turn smoke gebruikt standaard `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer dat is ingesteld, anders `openai/gpt-5.4`, zodat het installatie- en Gateway-bewijs op een GPT-5-testmodel blijft en GPT-4.x-standaarden worden vermeden.

### Legacy-compatibiliteitsvensters

Package Acceptance heeft begrensde legacy-compatibiliteitsvensters voor al gepubliceerde packages. Packages tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen het compatibiliteitspad gebruiken:

- bekende private QA-items in `dist/postinstall-inventory.json` mogen verwijzen naar bestanden die uit de tarball zijn weggelaten;
- `doctor-switch` mag de subcase voor persistentie van `gateway install --wrapper` overslaan wanneer het package die vlag niet beschikbaar maakt;
- `update-channel-switch` mag ontbrekende `pnpm.patchedDependencies` uit de van de tarball afgeleide nep-gitfixture verwijderen en ontbrekende behouden `update.channel` loggen;
- pluginsmokes mogen legacy-install-recordlocaties lezen of ontbrekende persistentie van marketplace-install-records accepteren;
- `plugin-update` mag migratie van configmetadata toestaan, terwijl nog steeds wordt vereist dat het installatierecord en het gedrag zonder herinstallatie ongewijzigd blijven.

Het gepubliceerde `2026.4.26`-pakket kan ook waarschuwen voor lokale build-metadata-stempelbestanden die al waren uitgebracht. Latere pakketten moeten aan de moderne contracten voldoen; dezelfde voorwaarden mislukken dan in plaats van te waarschuwen of over te slaan.

### Voorbeelden

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Begin bij het debuggen van een mislukte pakketacceptatierun met de samenvatting `resolve_package` om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de onderliggende run `docker_acceptance` en de Docker-artifacts daarvan: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logs, fasetimings en heruitvoeropdrachten. Geef de voorkeur aan het opnieuw uitvoeren van het mislukte pakketprofiel of de exacte Docker-lanes in plaats van de volledige releasevalidatie opnieuw uit te voeren.

## Installatierooktest

De afzonderlijke `Install Smoke`-workflow hergebruikt hetzelfde scopescript via zijn eigen `preflight`-job. Deze splitst rooktestdekking op in `run_fast_install_smoke` en `run_full_install_smoke`.

- **Snel pad** draait voor pull requests die Docker-/pakketoppervlakken, meegeleverde plugin-pakket-/manifestwijzigingen of kernoppervlakken voor plugin/kanaal/Gateway/Plugin SDK raken die door de Docker-rooktestjobs worden geoefend. Wijzigingen alleen in broncode van meegeleverde plugins, test-only wijzigingen en docs-only wijzigingen reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image eenmalig, controleert de CLI, voert de CLI-rooktest voor agents delete shared-workspace uit, voert de container-gateway-network-e2e uit, verifieert een build-argument voor meegeleverde extensions en voert het begrensde Docker-profiel voor meegeleverde plugins uit onder een geaggregeerde opdracht-time-out van 240 seconden (waarbij elke Docker-run van een scenario afzonderlijk is begrensd).
- **Volledig pad** bewaart QR-pakketinstallatie en installer-Docker-/updatedekking voor nachtelijke geplande runs, handmatige dispatches, workflow-call-releasecontroles en pull requests die echt installer-/pakket-/Docker-oppervlakken raken. In volledige modus bereidt install-smoke één target-SHA GHCR-root-Dockerfile-rooktestimage voor of hergebruikt die, en voert daarna QR-pakketinstallatie, root-Dockerfile-/Gateway-rooktests, installer-/update-rooktests en de snelle Docker-E2E voor meegeleverde plugins uit als afzonderlijke jobs, zodat installerwerk niet hoeft te wachten achter de root-image-rooktests.

`main`-pushes (inclusief merge-commits) forceren het volledige pad niet; wanneer changed-scope-logica bij een push volledige dekking zou aanvragen, behoudt de workflow de snelle Docker-rooktest en laat hij de volledige installatierooktest over aan nachtelijke of releasevalidatie.

De trage Bun global install image-provider-rooktest wordt afzonderlijk gated door `run_bun_global_install_smoke`. Deze draait volgens het nachtelijke schema en vanuit de releasecontroles-workflow, en handmatige `Install Smoke`-dispatches kunnen ervoor kiezen deze mee te nemen, maar pull requests en `main`-pushes doen dat niet. QR- en installer-Docker-tests behouden hun eigen op installatie gerichte Dockerfiles.

## Lokale Docker-E2E

`pnpm test:docker:all` bouwt vooraf één gedeelde live-testimage, pakt OpenClaw eenmalig als npm-tarball en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images:

- een kale Node/Git-runner voor installer-/update-/plugin-dependency-lanes;
- een functionele image die dezelfde tarball in `/app` installeert voor normale functionaliteitslanes.

Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en voert daarna lanes uit met `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Instelbare opties

| Variabele                              | Standaard | Doel                                                                                          |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Aantal main-pool-slots voor normale lanes.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Aantal providergevoelige tail-pool-slots.                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limiet voor gelijktijdige live lanes zodat providers niet throttlen.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limiet voor gelijktijdige npm-install-lanes.                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limiet voor gelijktijdige multi-service-lanes.                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Spreiding tussen lanestarts om Docker-daemon-create-stormen te voorkomen; zet op `0` voor geen spreiding. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Fallbacktime-out per lane (120 minuten); geselecteerde live-/tail-lanes gebruiken strakkere limieten. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset     | `1` print het schedulerplan zonder lanes uit te voeren.                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset     | Door komma's gescheiden exacte lanelijst; slaat cleanup-rooktest over zodat agents één mislukte lane kunnen reproduceren. |

Een lane die zwaarder is dan de effectieve limiet kan nog steeds vanuit een lege pool starten en draait daarna alleen totdat hij capaciteit vrijgeeft. De lokale geaggregeerde preflights controleren Docker, verwijderen verouderde OpenClaw-E2E-containers, geven actieve-lanestatus uit, bewaren lanetimings voor langste-eerst-volgorde en stoppen standaard met het plannen van nieuwe pooled lanes na de eerste fout.

### Herbruikbare live/E2E-workflow

De herbruikbare live/E2E-workflow vraagt `scripts/test-docker-all.mjs --plan-json` welke pakket-, imagekind-, live-image-, lane- en credentialdekking vereist is. `scripts/docker-e2e.mjs` zet dat plan daarna om in GitHub-outputs en samenvattingen. Het pakt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een pakket-artifact van de huidige run, of downloadt een pakket-artifact uit `package_artifact_run_id`; valideert de tarball-inventory; bouwt en pusht package-digest-getagde bare/functional GHCR Docker-E2E-images via Blacksmiths Docker-laagcache wanneer het plan lanes met geïnstalleerde pakketten nodig heeft; en hergebruikt opgegeven `docker_e2e_bare_image`-/`docker_e2e_functional_image`-inputs of bestaande package-digest-images in plaats van opnieuw te bouwen. Docker-image-pulls worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry-/cachestream snel opnieuw probeert in plaats van het grootste deel van het kritieke CI-pad te gebruiken.

### Releasepadchunks

Release-Docker-dekking draait kleinere jobs in chunks met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elke chunk alleen de imagekind ophaalt die hij nodig heeft en meerdere lanes uitvoert via dezelfde gewogen scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Huidige release-Docker-chunks zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` en `plugins-runtime-install-a` tot en met `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` en `plugins-integrations` blijven geaggregeerde plugin-/runtime-aliassen. De lane-alias `install-e2e` blijft de geaggregeerde handmatige heruitvoer-alias voor beide provider-installer-lanes.

OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige releasepaddekking dit aanvraagt, en behoudt alleen een zelfstandige `openwebui`-chunk voor OpenWebUI-only dispatches. Update-lanes voor meegeleverde kanalen proberen één keer opnieuw bij tijdelijke npm-netwerkfouten.

Elke chunk uploadt `.artifacts/docker-tests/` met lane-logs, timings, `summary.json`, `failures.json`, fasetimings, schedulerplan-JSON, tabellen met trage lanes en heruitvoeropdrachten per lane. De workflowinput `docker_lanes` voert geselecteerde lanes uit tegen de voorbereide images in plaats van de chunkjobs, waardoor debugging van mislukte lanes begrensd blijft tot één gerichte Docker-job en het pakket-artifact voor die run wordt voorbereid, gedownload of hergebruikt; als een geselecteerde lane een live Docker-lane is, bouwt de gerichte job de live-testimage lokaal voor die heruitvoer. Gegenereerde GitHub-heruitvoeropdrachten per lane bevatten `package_artifact_run_id`, `package_artifact_name` en voorbereide image-inputs wanneer die waarden bestaan, zodat een mislukte lane exact hetzelfde pakket en dezelfde images uit de mislukte run kan hergebruiken.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

De geplande live/E2E-workflow draait dagelijks de volledige releasepad-Docker-suite.

## Plugin Prerelease

`Plugin Prerelease` is duurdere product-/pakketdekking, dus het is een afzonderlijke workflow die wordt gedispatcht door `Full Release Validation` of door een expliciete operator. Normale pull requests, `main`-pushes en zelfstandige handmatige CI-dispatches houden die suite uitgeschakeld. Deze verdeelt tests voor meegeleverde plugins over acht extension-workers; die extension-shardjobs draaien maximaal twee pluginconfiguratiegroepen tegelijk met één Vitest-worker per groep en een grotere Node-heap, zodat importzware pluginbatches geen extra CI-jobs veroorzaken. Het release-only Docker-prereleasepad batchet gerichte Docker-lanes in kleine groepen om te voorkomen dat tientallen runners worden gereserveerd voor jobs van één tot drie minuten.

## QA Lab

QA Lab heeft toegewezen CI-lanes buiten de hoofdworkflow met slimme scope. Agentic parity is genest onder de brede QA- en releaseharnassen, niet als zelfstandige PR-workflow. Gebruik `Full Release Validation` met `rerun_group=qa-parity` wanneer parity moet meelopen met een brede validatierun.

- De workflow `QA-Lab - All Lanes` draait nachtelijk op `main` en bij handmatige dispatch; hij waaiert de mock parity-lane, live Matrix-lane en live Telegram- en Discord-lanes uit als parallelle jobs. Live jobs gebruiken de omgeving `qa-live-shared`, en Telegram/Discord gebruiken Convex-leases.

Releasecontroles draaien Matrix- en Telegram-live-transportlanes met de deterministische mockprovider en mock-gekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het kanaalcontract is geïsoleerd van live-modellatentie en normale provider-plugin-startup. De live transport-Gateway schakelt geheugenzoekopdrachten uit, omdat QA-parity geheugengedrag afzonderlijk dekt; providerconnectiviteit wordt gedekt door de afzonderlijke suites voor live model, native provider en Docker-provider.

Matrix gebruikt `--profile fast` voor geplande en releasegates, en voegt `--fail-fast` alleen toe wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaard en handmatige workflowinput blijven `all`; een handmatige `matrix_profile=all`-dispatch shardt volledige Matrix-dekking altijd in jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` en `e2ee-cli`.

`OpenClaw Release Checks` draait ook de releasekritieke QA Lab-lanes vóór releasegoedkeuring; de QA-paritygate draait de kandidaat- en baselinepakketten als parallelle lanejobs, en downloadt daarna beide artifacts naar een kleine rapportjob voor de uiteindelijke parityvergelijking.

Voor normale PR's volg je de gescopete CI-/check-bewijsvoering in plaats van parity als vereiste status te behandelen.

## CodeQL

De `CodeQL`-workflow is bewust een smalle beveiligingsscanner voor een eerste controle, niet de volledige repository-sweep. Dagelijkse, handmatige en niet-conceptbewakingsruns voor pull requests scannen Actions-workflowcode plus de JavaScript/TypeScript-oppervlakken met het hoogste risico met zeer betrouwbare beveiligingsquery's die zijn gefilterd op hoge/kritieke `security-severity`.

De bewaking voor pull requests blijft licht: die start alleen voor wijzigingen onder `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` of `src`, en draait dezelfde zeer betrouwbare beveiligingsmatrix als de geplande workflow. Android- en macOS-CodeQL blijven buiten de standaardinstellingen voor PR's.

### Beveiligingscategorieën

| Categorie                                         | Oppervlak                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, Cron en Gateway-basislijn                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Core-kanaalimplementatiecontracten plus de runtime van kanaalplugins, Gateway, Plugin SDK, secrets, audit-aanraakpunten            |
| `/codeql-security-high/network-ssrf-boundary`     | Core-SSRF, IP-parsing, netwerkbewaking, web-fetch en SSRF-beleidsoppervlakken van Plugin SDK                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-servers, helpers voor procesuitvoering, uitgaande aflevering en poorten voor agent-tooluitvoering                              |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-installatie, loader, manifest, registry, pakketbeheerderinstallatie, source-loading en vertrouwensoppervlakken van het Plugin SDK-pakketcontract |

### Platformspecifieke beveiligingsshards

- `CodeQL Android Critical Security` — geplande Android-beveiligingsshard. Bouwt de Android-app handmatig voor CodeQL op de kleinste Blacksmith Linux-runner die door workflow-sanity wordt geaccepteerd. Uploadt onder `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — wekelijkse/handmatige macOS-beveiligingsshard. Bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert buildresultaten van afhankelijkheden uit de geüploade SARIF en uploadt onder `/codeql-critical-security/macos`. Blijft buiten dagelijkse standaardinstellingen omdat de macOS-build de runtime domineert, zelfs wanneer die schoon is.

### Critical Quality-categorieën

`CodeQL Critical Quality` is de bijbehorende niet-beveiligingsshard. Deze draait alleen JavaScript/TypeScript-kwaliteitsquery's met foutseverity en zonder beveiligingsfocus over smalle, waardevolle oppervlakken op de kleinere Blacksmith Linux-runner. De bewaking voor pull requests is bewust kleiner dan het geplande profiel: niet-concept-PR's draaien alleen de bijbehorende shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` en `plugin-sdk-reply-runtime` voor wijzigingen in agent-command/model/tool-uitvoering en reply-dispatchcode, config-schema/migratie/IO-code, auth/secrets/sandbox/beveiligingscode, core-kanaal en meegeleverde runtime van kanaalplugins, Gateway-protocol/server-method, memory-runtime/SDK-koppeling, MCP/proces/uitgaande aflevering, provider-runtime/modelcatalogus, sessiediagnostiek/afleveringswachtrijen, plugin-loader, Plugin SDK/pakketcontract of Plugin SDK-reply-runtime. Wijzigingen in CodeQL-configuratie en kwaliteitsworkflow draaien alle twaalf PR-kwaliteitsshards.

Handmatige dispatch accepteert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

De smalle profielen zijn onderwijs-/iteratiehaken om één kwaliteitsshard geïsoleerd te draaien.

| Categorie                                               | Oppervlak                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secrets, sandbox, Cron en code voor de Gateway-beveiligingsgrens                                                                                            |
| `/codeql-critical-quality/config-boundary`              | Config-schema, migratie, normalisatie en IO-contracten                                                                                                           |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-protocolschema's en servermethod-contracten                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Core-kanaal en implementatiecontracten van meegeleverde kanaalplugins                                                                                            |
| `/codeql-critical-quality/agent-runtime-boundary`       | Command-uitvoering, model/provider-dispatch, auto-reply-dispatch en wachtrijen, en runtimecontracten van het ACP-control plane                                   |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-servers en toolbruggen, helpers voor procesbewaking en contracten voor uitgaande aflevering                                                                  |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory-host-SDK, memory-runtimefacades, memory-Plugin SDK-aliassen, memory-runtimeactivatiekoppeling en memory-doctor-commands                                  |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internals van reply-wachtrijen, sessieafleveringswachtrijen, helpers voor uitgaande sessiebinding/aflevering, oppervlakken voor diagnostische event-/logbundels en sessie-doctor-CLI-contracten |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Inkomende reply-dispatch van Plugin SDK, helpers voor reply-payload/chunking/runtime, kanaalreply-opties, afleveringswachtrijen en helpers voor sessie-/threadbinding |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisatie van modelcatalogus, provider-auth en discovery, provider-runtimeregistratie, provider-standaardwaarden/catalogi en web/search/fetch/embedding-registries |
| `/codeql-critical-quality/ui-control-plane`             | Control-UI-bootstrap, lokale persistentie, Gateway-control flows en runtimecontracten van het task-control plane                                                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core-webfetch/search, media-IO, mediabegrip, image-generation en runtimecontracten voor media-generation                                                         |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, public-surface en Plugin SDK-entrypointcontracten                                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Gepubliceerde package-side Plugin SDK-source en helpers voor plugin-pakketcontracten                                                                              |

Kwaliteit blijft gescheiden van beveiliging zodat kwaliteitsbevindingen gepland, gemeten, uitgeschakeld of uitgebreid kunnen worden zonder het beveiligingssignaal te vertroebelen. Swift-, Python- en meegeleverde-plugin-CodeQL-uitbreiding moet alleen als gescopet of geshard vervolgwerk worden teruggezet nadat de smalle profielen stabiele runtime en stabiel signaal hebben.

## Onderhoudsworkflows

### Docs Agent

De `Docs Agent`-workflow is een event-gedreven Codex-onderhoudsbaan om bestaande documentatie afgestemd te houden op recent gelande wijzigingen. Er is geen puur schema: een geslaagde niet-bot-push-CI-run op `main` kan deze triggeren, en handmatige dispatch kan deze direct draaien. Workflow-run-invocations worden overgeslagen wanneer `main` is doorgeschoven of wanneer in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is aangemaakt. Wanneer de workflow draait, beoordeelt die de commitreeks vanaf de vorige niet-overgeslagen Docs Agent-bron-SHA tot de huidige `main`, zodat één uur-run alle main-wijzigingen kan dekken die sinds de laatste documentatiepass zijn verzameld.

### Test Performance Agent

De `Test Performance Agent`-workflow is een event-gedreven Codex-onderhoudsbaan voor trage tests. Er is geen puur schema: een geslaagde niet-bot-push-CI-run op `main` kan deze triggeren, maar de workflow slaat over als er die UTC-dag al een andere workflow-run-invocation draaide of actief is. Handmatige dispatch omzeilt die dagelijkse activiteitspoort. De baan bouwt een gegroepeerd Vitest-prestatierapport voor de volledige suite, laat Codex alleen kleine testprestatieverbeteringen maken die dekking behouden in plaats van brede refactors, draait daarna opnieuw het volledige-suiterapport en wijst wijzigingen af die het aantal passerende baselinetests verminderen. Als de baseline falende tests heeft, mag Codex alleen duidelijke fouten oplossen en moet het volledige-suiterapport na de agent slagen voordat er iets wordt gecommit. Wanneer `main` doorgaat voordat de bot-push landt, rebaset de baan de gevalideerde patch, draait `pnpm check:changed` opnieuw en probeert de push opnieuw; conflicterende verouderde patches worden overgeslagen. De workflow gebruikt GitHub-hosted Ubuntu zodat de Codex-action dezelfde drop-sudo-veiligheidshouding kan behouden als de docs-agent.

### Dubbele PR's na merge

De `Duplicate PRs After Merge`-workflow is een handmatige maintainer-workflow voor opschoning van duplicaten na landing. Standaard draait die als dry-run en sluit alleen expliciet vermelde PR's wanneer `apply=true`. Voordat GitHub wordt gewijzigd, verifieert de workflow dat de gelande PR is gemerged en dat elk duplicaat ofwel een gedeeld gerefereerd issue heeft, of overlappende gewijzigde hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale checkpoorten en gewijzigde routering

De lokale changed-lane-logica staat in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale checkpoort is strenger over architectuurgrenzen dan de brede CI-platformscope:

- core-productiewijzigingen draaien core-prod- en core-testtypecheck plus core-lint/guards;
- wijzigingen alleen in core-tests draaien alleen core-testtypecheck plus core-lint;
- extensieproductiewijzigingen draaien extensie-prod- en extensietesttypecheck plus extensielint;
- wijzigingen alleen in extensietests draaien extensietesttypecheck plus extensielint;
- publieke Plugin SDK- of plugin-contractwijzigingen breiden uit naar extensietypecheck omdat extensies afhankelijk zijn van die core-contracten (Vitest-extensiesweeps blijven expliciet testwerk);
- release-metadata-only versiebumpen draaien gerichte versie-/config-/root-afhankelijkheidschecks;
- onbekende root-/configwijzigingen vallen veilig terug naar alle checklanes.

Lokale changed-test-routering staat in `scripts/test-projects.test-support.mjs` en is bewust goedkoper dan `check:changed`: directe testwijzigingen draaien zichzelf, source-wijzigingen geven de voorkeur aan expliciete mappings, daarna siblingtests en importgraaf-afhankelijken. Gedeelde group-room-afleveringsconfig is een van de expliciete mappings: wijzigingen in de zichtbaar-reply-config voor groepen, source-reply-afleveringsmodus of de systeemprompt van message-tool routeren via de core-replytests plus Discord- en Slack-afleveringsregressies, zodat een gedeelde standaardwijziging faalt vóór de eerste PR-push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging zo harness-breed is dat de goedkope gemapte set geen betrouwbare proxy is.

## Testbox-validatie

Voer Testbox uit vanaf de repo-root en geef voor breed bewijs de voorkeur aan een vers opgewarmde box. Voordat je een langzame gate besteedt aan een box die is hergebruikt, verlopen of net een onverwacht grote sync heeft gemeld, voer je eerst `pnpm testbox:sanity` uit binnen de box.

De sanity-check faalt snel wanneer vereiste rootbestanden zoals `pnpm-lock.yaml` zijn verdwenen of wanneer `git status --short` minstens 200 getrackte verwijderingen toont. Dat betekent meestal dat de externe sync-status geen betrouwbare kopie van de PR is; stop die box en warm een verse op in plaats van de producttestfout te debuggen. Stel voor opzettelijke PR's met veel verwijderingen `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor die sanity-run.

`pnpm testbox:run` beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de sync-fase blijft zonder output na de sync. Stel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` in om die bewaking uit te schakelen, of gebruik een grotere waarde in milliseconden voor ongewoon grote lokale diffs.

Crabbox is de repo-eigen remote-box-wrapper voor Linux-bewijs door maintainers. Gebruik het wanneer een check te breed is voor een lokale edit-loop, wanneer CI-pariteit belangrijk is, of wanneer het bewijs secrets, Docker, package-lanes, herbruikbare boxen of externe logs nodig heeft. De normale OpenClaw-backend is `blacksmith-testbox`; eigen AWS/Hetzner-capaciteit is een fallback voor Blacksmith-storingen, quotaproblemen of expliciete tests op eigen capaciteit.

Controleer voor een eerste run de wrapper vanaf de repo-root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

De repo-wrapper weigert een verouderde Crabbox-binary die `blacksmith-testbox` niet adverteert. Geef de provider expliciet door, ook al heeft `.crabbox.yaml` standaarden voor eigen cloud.

Changed-gate:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
```

Gerichte testrerun:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
```

Volledige suite:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

Lees de uiteindelijke JSON-samenvatting. De nuttige velden zijn `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` en `totalMs`. Eenmalige door Blacksmith ondersteunde Crabbox-runs zouden de Testbox automatisch moeten stoppen; als een run wordt onderbroken of opruimen onduidelijk is, inspecteer dan live boxen en stop alleen de boxen die je hebt gemaakt:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Gebruik hergebruik alleen wanneer je bewust meerdere commando's op dezelfde gehydrateerde box nodig hebt:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Als Crabbox de defecte laag is maar Blacksmith zelf werkt, gebruik dan direct Blacksmith als beperkte fallback:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Escaleer alleen naar eigen Crabbox-capaciteit wanneer Blacksmith down is, door quota wordt beperkt, de benodigde omgeving mist, of eigen capaciteit expliciet het doel is:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` beheert de provider-, sync- en GitHub Actions-hydratatiestandaarden voor eigen-cloudlanes. Het sluit lokale `.git` uit zodat de gehydrateerde Actions-checkout zijn eigen externe Git-metadata behoudt in plaats van maintainer-lokale remotes en objectstores te synchroniseren, en het sluit lokale runtime-/buildartefacten uit die nooit mogen worden overgedragen. `.github/workflows/crabbox-hydrate.yml` beheert checkout, Node-/pnpm-installatie, `origin/main`-fetch en de niet-secrete omgevingsoverdracht voor eigen-cloud-commando's met `crabbox run --id <cbx_id>`.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Ontwikkelingskanalen](/nl/install/development-channels)
