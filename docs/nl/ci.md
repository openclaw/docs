---
read_when:
    - Je moet begrijpen waarom een CI-taak wel of niet is uitgevoerd
    - Je debugt een mislukte GitHub Actions-controle
    - Je coördineert een releasevalidatierun of een herhaling daarvan
    - Je wijzigt de ClawSweeper-aansturing of het doorsturen van GitHub-activiteit
summary: CI-taakgrafiek, scopecontroles, release-overkoepelingen en equivalenten voor lokale opdrachten
title: CI-pijplijn
x-i18n:
    generated_at: "2026-05-07T13:13:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1258ddb510538a250c68626f98b7f32201a46abf36f92d29e945bb7149a841cc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI draait bij elke push naar `main` en elke pull request. De `preflight`-taak classificeert de diff en schakelt dure lanes uit wanneer alleen niet-gerelateerde gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen bewust slimme scoping en waaieren de volledige graaf uit voor releasekandidaten en brede validatie. Android-lanes blijven opt-in via `include_android`. Release-only Plugin-dekking staat in de afzonderlijke workflow [`Plugin-voorrelease`](#plugin-prerelease) en draait alleen vanuit [`Volledige releasevalidatie`](#full-release-validation) of een expliciete handmatige dispatch.

## Pipelineoverzicht

| Taak                             | Doel                                                                                                               | Wanneer deze draait                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| `preflight`                      | Detecteert docs-only wijzigingen, gewijzigde scopes, gewijzigde extensions en bouwt het CI-manifest                | Altijd bij niet-conceptpushes en PR's       |
| `security-scm-fast`              | Detectie van privésleutels en workflowaudit via `zizmor`                                                           | Altijd bij niet-conceptpushes en PR's       |
| `security-dependency-audit`      | Productie-lockfileaudit zonder dependencies tegen npm-advisories                                                   | Altijd bij niet-conceptpushes en PR's       |
| `security-fast`                  | Vereiste aggregatie voor de snelle beveiligingstaken                                                               | Altijd bij niet-conceptpushes en PR's       |
| `check-dependencies`             | Productie-Knip-pass alleen voor dependencies plus de guard voor de allowlist voor ongebruikte bestanden            | Node-relevante wijzigingen                  |
| `build-artifacts`                | Bouwt `dist/`, Control UI, controles voor gebouwde artifacts en herbruikbare downstream artifacts                  | Node-relevante wijzigingen                  |
| `checks-fast-core`               | Snelle Linux-correctheidslanes zoals bundled/plugin-contract/protocol-controles                                    | Node-relevante wijzigingen                  |
| `checks-fast-contracts-channels` | Gesherde channel-contractcontroles met een stabiel geaggregeerd controleresultaat                                  | Node-relevante wijzigingen                  |
| `checks-node-core-test`          | Core Node-testshards, exclusief channel-, bundled-, contract- en extension-lanes                                   | Node-relevante wijzigingen                  |
| `check`                          | Gesherde equivalent van de belangrijkste lokale gate: productietypen, lint, guards, testtypen en strikte smoke     | Node-relevante wijzigingen                  |
| `check-additional`               | Architectuur, gesherde boundary-/promptdrift, extension-guards, package-boundary en gateway watch                  | Node-relevante wijzigingen                  |
| `build-smoke`                    | Smoke-tests voor gebouwde CLI en startup-memory-smoke                                                              | Node-relevante wijzigingen                  |
| `checks`                         | Verifier voor channel-tests met gebouwde artifacts                                                                 | Node-relevante wijzigingen                  |
| `checks-node-compat-node22`      | Node 22-compatibiliteitsbuild en smoke-lane                                                                        | Handmatige CI-dispatch voor releases        |
| `check-docs`                     | Docs-formattering, lint en controles op kapotte links                                                              | Docs gewijzigd                              |
| `skills-python`                  | Ruff + pytest voor Python-ondersteunde Skills                                                                      | Python-Skill-relevante wijzigingen          |
| `checks-windows`                 | Windows-specifieke proces-/padtests plus regressies voor gedeelde runtime-importspecifier                          | Windows-relevante wijzigingen               |
| `macos-node`                     | macOS TypeScript-testlane met de gedeelde gebouwde artifacts                                                       | macOS-relevante wijzigingen                 |
| `macos-swift`                    | Swift-lint, build en tests voor de macOS-app                                                                       | macOS-relevante wijzigingen                 |
| `android`                        | Android-unittests voor beide flavors plus één debug-APK-build                                                      | Android-relevante wijzigingen               |
| `test-performance-agent`         | Dagelijkse Codex-optimalisatie van trage tests na vertrouwde activiteit                                            | Succesvolle main-CI of handmatige dispatch  |
| `openclaw-performance`           | Dagelijkse/op-aanvraag Kova-runtimeprestatierapporten met mock-provider, deep-profile en GPT 5.4 live-lanes        | Gepland en handmatige dispatch              |

## Fail-fast-volgorde

1. `preflight` bepaalt welke lanes überhaupt bestaan. De logica voor `docs-scope` en `changed-scope` zijn stappen binnen deze taak, geen zelfstandige taken.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` en `skills-python` falen snel zonder te wachten op de zwaardere artifact- en platformmatrixtaken.
3. `build-artifacts` overlapt met de snelle Linux-lanes zodat downstream consumers kunnen starten zodra de gedeelde build klaar is.
4. Zwaardere platform- en runtimelanes waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` en `android`.

GitHub kan vervangen taken markeren als `cancelled` wanneer een nieuwere push op dezelfde PR- of `main`-ref landt. Behandel dat als CI-ruis, tenzij de nieuwste run voor dezelfde ref ook faalt. Geaggregeerde shardcontroles gebruiken `!cancelled() && always()`, zodat ze nog steeds normale shardfouten rapporteren maar niet in de wachtrij komen nadat de hele workflow al is vervangen. De automatische CI-concurrency-sleutel is geversioneerd (`CI-v7-*`), zodat een GitHub-zombie aan de kant van GitHub in een oude wachtrijgroep nieuwere main-runs niet onbeperkt kan blokkeren. Handmatige volledige suite-runs gebruiken `CI-manual-v1-*` en annuleren lopende runs niet.

De taak `ci-timings-summary` uploadt voor elke niet-concept-CI-run een compact artifact `ci-timings-summary`. Dit registreert wandkloktijd, wachtrijtijd, traagste taken en mislukte taken voor de huidige run, zodat CI-gezondheidscontroles niet herhaaldelijk de volledige Actions-payload hoeven te scrapen.

## Scope en routering

Scopelogica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unittests in `src/scripts/ci-changed-scope.test.ts`. Handmatige dispatch slaat detectie van changed-scope over en laat het preflight-manifest handelen alsof elk gescoped gebied is gewijzigd.

- **CI-workflowbewerkingen** valideren de Node CI-graaf plus workflowlinting, maar forceren op zichzelf geen Windows-, Android- of macOS-native builds; die platformlanes blijven gescoped tot platformbronwijzigingen.
- **Alleen-routering-CI-bewerkingen, geselecteerde goedkope core-test-fixturebewerkingen en smalle plugin-contracthelper-/test-routeringbewerkingen** gebruiken een snel Node-only manifestpad: `preflight`, beveiliging en één `checks-fast-core`-taak. Dat pad slaat build-artifacts, Node 22-compatibiliteit, channel-contracts, volledige core-shards, bundled-Plugin-shards en aanvullende guardmatrices over wanneer de wijziging beperkt is tot de routering- of helperoppervlakken die de snelle taak direct test.
- **Windows Node-controles** zijn gescoped tot Windows-specifieke proces-/padwrappers, npm/pnpm/UI-runnerhelpers, package-managerconfiguratie en de CI-workflowoppervlakken die die lane uitvoeren; niet-gerelateerde source-, Plugin-, install-smoke- en alleen-testwijzigingen blijven op de Linux Node-lanes.

De traagste Node-testfamilies zijn gesplitst of gebalanceerd zodat elke taak klein blijft zonder te veel runners te reserveren: channel-contracts draaien als drie gewogen Blacksmith-ondersteunde shards met de standaard GitHub-runnerfallback, core unit fast/support-lanes draaien afzonderlijk, core runtime-infra is verdeeld over state-, process/config-, cron- en shared-shards, auto-reply draait als gebalanceerde workers (waarbij de reply-subtree is gesplitst in agent-runner-, dispatch- en commands/state-routing-shards), en agentic Gateway/server-configs zijn verdeeld over chat/auth/model/http-plugin/runtime/startup-lanes in plaats van te wachten op gebouwde artifacts. Brede browser-, QA-, media- en overige Plugin-tests gebruiken hun toegewezen Vitest-configs in plaats van de gedeelde Plugin-catch-all. Include-pattern-shards registreren timingitems met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een volledige config kan onderscheiden van een gefilterde shard. `check-additional` houdt package-boundary compile/canary-werk bij elkaar en scheidt runtime-topologiearchitectuur van gateway watch-dekking; de boundary-guardlijst is verdeeld over vier matrixshards, waarbij elke shard geselecteerde onafhankelijke guards gelijktijdig uitvoert en timings per controle afdrukt. De dure Codex happy-path prompt-snapshotdriftcontrole draait als eigen aanvullende taak voor handmatige CI en alleen voor prompt-beïnvloedende wijzigingen, zodat normale niet-gerelateerde Node-wijzigingen niet achter koude prompt-snapshotgeneratie hoeven te wachten en de boundary-shards gebalanceerd blijven terwijl promptdrift nog steeds wordt vastgezet op de PR die deze veroorzaakte; dezelfde vlag slaat prompt-snapshot-Vitest-generatie over binnen de built-artifact core support-boundary-shard. Gateway watch, channel-tests en de core support-boundary-shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd.

Android CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play debug-APK. De third-party flavor heeft geen afzonderlijke source set of manifest; de unit-testlane compileert de flavor nog steeds met de BuildConfig-vlaggen voor SMS/oproepenlogboek, terwijl een dubbele debug-APK-packagingtaak bij elke Android-relevante push wordt vermeden.

De `check-dependencies`-shard draait `pnpm deadcode:dependencies` (een productie-Knip-pass alleen voor dependencies, vastgezet op de nieuwste Knip-versie, met pnpm's minimum release age uitgeschakeld voor de `dlx`-installatie) en `pnpm deadcode:unused-files`, die Knip's bevindingen van ongebruikte productiebestanden vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. De guard voor ongebruikte bestanden faalt wanneer een PR een nieuw, niet-beoordeeld ongebruikt bestand toevoegt of een verouderde allowlist-entry achterlaat, terwijl bewuste dynamische Plugin-, gegenereerde, build-, live-test- en package-bridge-oppervlakken behouden blijven die Knip niet statisch kan oplossen.

## ClawSweeper-activiteit doorsturen

`.github/workflows/clawsweeper-dispatch.yml` is de target-side bridge van OpenClaw-repositoryactiviteit naar ClawSweeper. Deze checkt geen onvertrouwde pull request-code uit en voert die niet uit. De workflow maakt een GitHub App-token vanuit `CLAWSWEEPER_APP_PRIVATE_KEY` en dispatcht daarna compacte `repository_dispatch`-payloads naar `openclaw/clawsweeper`.

De workflow heeft vier lanes:

- `clawsweeper_item` voor exacte reviewverzoeken voor issues en pull requests;
- `clawsweeper_comment` voor expliciete ClawSweeper-opdrachten in issuecomments;
- `clawsweeper_commit_review` voor reviewverzoeken op commitniveau bij `main`-pushes;
- `github_activity` voor algemene GitHub-activiteit die de ClawSweeper-agent kan inspecteren.

De `github_activity`-lane stuurt alleen genormaliseerde metadata door: eventtype, actie, actor, repository, itemnummer, URL, titel, status en korte fragmenten voor comments of reviews wanneer aanwezig. Deze vermijdt bewust het doorsturen van de volledige webhook-body. De ontvangende workflow in `openclaw/clawsweeper` is `.github/workflows/github-activity.yml`, die de genormaliseerde gebeurtenis post naar de OpenClaw Gateway-hook voor de ClawSweeper-agent.

Algemene activiteit is observatie, geen standaardbezorging. De ClawSweeper-agent ontvangt het Discord-doel in zijn prompt en moet alleen naar `#clawsweeper` posten wanneer de gebeurtenis verrassend, actiegericht, riskant of operationeel nuttig is. Routinematige openingen, bewerkingen, botverloop, dubbele webhookruis en normaal reviewverkeer moeten resulteren in `NO_REPLY`.

Behandel GitHub-titels, opmerkingen, bodies, beoordelingstekst, branchnamen en commitberichten overal in dit pad als niet-vertrouwde gegevens. Ze zijn invoer voor samenvatting en triage, geen instructies voor de workflow of agent-runtime.

## Handmatige dispatches

Handmatige CI-dispatches voeren dezelfde jobgrafiek uit als normale CI, maar forceren elke niet-Android scoped lane aan: Linux Node-shards, gebundelde Plugin-shards, kanaalcontracten, Node 22-compatibiliteit, `check`, `check-additional`, build smoke, docs-controles, Python-skills, Windows, macOS en Control UI i18n. Zelfstandige handmatige CI-dispatches voeren Android alleen uit met `include_android=true`; de volledige release-umbrella schakelt Android in door `include_android=true` door te geven. Statische controles voor Plugin-prerelease, de release-only `agentic-plugins`-shard, de volledige batch-sweep voor extensies en Docker-lanes voor Plugin-prerelease zijn uitgesloten van CI. De Docker-prerelease-suite draait alleen wanneer `Full Release Validation` de afzonderlijke `Plugin Prerelease`-workflow dispatcht met de release-validation-gate ingeschakeld.

Handmatige runs gebruiken een unieke concurrency group, zodat een volledige suite voor een release candidate niet wordt geannuleerd door een andere push- of PR-run op dezelfde ref. Met de optionele invoer `target_ref` kan een vertrouwde aanroeper die grafiek uitvoeren tegen een branch, tag of volledige commit-SHA terwijl het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, snelle security-jobs en aggregaten (`security-scm-fast`, `security-dependency-audit`, `security-fast`), snelle protocol-/contract-/gebundelde controles, gesharde kanaalcontractcontroles, `check`-shards behalve lint, `check-additional`-aggregaten, aggregatieverificaties voor Node-tests, docs-controles, Python-skills, workflow-sanity, labeler, auto-response; install-smoke-preflight gebruikt ook door GitHub gehoste Ubuntu zodat de Blacksmith-matrix eerder in de wachtrij kan komen |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lichtere extensie-shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` en `check-test-types`                                                                                                                                                                                                                                                                                                                |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node-testshards, gebundelde Plugin-testshards, `check-additional`-shards, `android`                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-gevoelig genoeg dat 8 vCPU meer kostte dan het bespaarde); Docker-builds voor install-smoke (32-vCPU-wachtrijtijd kostte meer dan het bespaarde)                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                    |

CI voor de canonieke repo houdt Blacksmith als standaard runner-pad. Tijdens `preflight` controleert `scripts/ci-runner-labels.mjs` recente queued en in-progress Actions-runs op queued Blacksmith-jobs. Als een specifiek Blacksmith-label al jobs in de wachtrij heeft, vallen downstream-jobs die exact dat label zouden gebruiken alleen voor die run terug op de overeenkomende door GitHub gehoste runner (`ubuntu-24.04`, `windows-2025` of `macos-latest`). Andere Blacksmith-groottes in dezelfde OS-familie blijven op hun primaire labels. Als de API-probe mislukt, wordt er geen fallback toegepast.

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

Een handmatige dispatch benchmarkt normaal de workflow-ref. Stel `target_ref` in om een releasetag of een andere branch te benchmarken met de huidige workflowimplementatie. Gepubliceerde rapportpaden en nieuwste pointers worden gesleuteld op de geteste ref, en elke `index.md` legt de geteste ref/SHA, workflow-ref/SHA, Kova-ref, profiel, lane-authmodus, model, herhalingsaantal en scenariofilters vast.

De workflow installeert OCM vanaf een gepinde release en Kova vanaf `openclaw/Kova` op de gepinde invoer `kova_ref`, en voert daarna drie lanes uit:

- `mock-provider`: Kova-diagnosescenario's tegen een local-build-runtime met deterministische nep-auth die OpenAI-compatibel is.
- `mock-deep-profile`: CPU-/heap-/traceprofilering voor hotspots bij startup, Gateway en agent-turns.
- `live-gpt54`: een echte OpenAI `openai/gpt-5.4`-agent-turn, overgeslagen wanneer `OPENAI_API_KEY` niet beschikbaar is.

De mock-provider-lane voert na de Kova-pass ook OpenClaw-native bronprobes uit: Gateway-opstarttiming en geheugen over standaard-, hook- en 50-Plugin-opstartcases; herhaalde mock-OpenAI `channel-chat-baseline`-hello-loops; en CLI-opstartcommando's tegen de opgestarte Gateway. De Markdown-samenvatting van de bronprobe staat op `source/index.md` in de rapportbundel, met ruwe JSON ernaast.

Elke lane uploadt GitHub-artifacts. Wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd, commit de workflow ook `report.json`, `report.md`, bundels, `index.md` en bronprobe-artifacts naar `openclaw/clawgrit-reports` onder `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. De huidige pointer voor de geteste ref wordt geschreven als `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Volledige releasevalidatie

`Full Release Validation` is de handmatige umbrella-workflow voor "alles uitvoeren vóór de release". Deze accepteert een branch, tag of volledige commit-SHA, dispatcht de handmatige `CI`-workflow met dat doel, dispatcht `Plugin Prerelease` voor release-only Plugin-/package-/static-/Docker-bewijs en dispatcht `OpenClaw Release Checks` voor install smoke, package acceptance, cross-OS-packagecontroles, QA Lab-pariteit, Matrix- en Telegram-lanes. Stabiele/default runs houden uitputtende live/E2E- en Docker-release-path-dekking achter `run_release_soak=true`; `release_profile=full` forceert die soak-dekking aan, zodat brede advisoryvalidatie breed blijft. Met `rerun_group=all` en `release_profile=full` draait deze ook `NPM Telegram Beta E2E` tegen het `release-package-under-test`-artifact uit release checks. Geef na publicatie `npm_telegram_package_spec` door om dezelfde Telegram-package-lane opnieuw te draaien tegen het gepubliceerde npm-package.

Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
stagematrix, exacte workflowjobnamen, profielverschillen, artifacts en
gerichte rerun-handles.

`OpenClaw Release Publish` is de handmatige muterende releaseworkflow. Dispatch deze
vanaf `release/YYYY.M.D` of `main` nadat de releasetag bestaat en nadat de
OpenClaw npm-preflight is geslaagd. Deze verifieert `pnpm plugins:sync:check`,
dispatcht `Plugin NPM Release` voor alle publiceerbare Plugin-packages, dispatcht
`Plugin ClawHub Release` voor dezelfde release-SHA en dispatcht pas daarna
`OpenClaw NPM Release` met de opgeslagen `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Gebruik voor bewijs van een vastgezette commit op een snel veranderende branch het hulpprogramma in plaats van
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-workflow-dispatch-refs moeten branches of tags zijn, geen ruwe commit-SHA's. Het
hulpprogramma pusht een tijdelijke `release-ci/<sha>-...`-branch op de doel-SHA,
dispatcht `Full Release Validation` vanaf die vastgezette ref, verifieert dat elke onderliggende
workflow-`headSha` overeenkomt met het doel, en verwijdert de tijdelijke branch wanneer de
run is voltooid. De overkoepelende verifier faalt ook als een onderliggende workflow op een
andere SHA draaide.

`release_profile` bepaalt de live/provider-breedte die aan releasechecks wordt doorgegeven. De
handmatige releaseworkflows gebruiken standaard `stable`; gebruik `full` alleen wanneer je
bewust de brede adviserende provider/media-matrix wilt. `run_release_soak`
bepaalt of stabiele/standaard releasechecks de uitgebreide live/E2E- en
Docker-releasepad-soak draaien; `full` forceert soak aan.

- `minimum` behoudt de snelste OpenAI/core-releasekritieke lanes.
- `stable` voegt de stabiele provider/backend-set toe.
- `full` draait de brede adviserende provider/media-matrix.

De overkoepelende workflow registreert de gedispatchte onderliggende run-id's, en de laatste `Verify full validation`-job controleert de huidige conclusies van onderliggende runs opnieuw en voegt tabellen met traagste jobs toe voor elke onderliggende run. Als een onderliggende workflow opnieuw wordt gedraaid en groen wordt, draai dan alleen de verifier-job van de parent opnieuw om het overkoepelende resultaat en de timingsamenvatting te vernieuwen.

Voor herstel accepteren zowel `Full Release Validation` als `OpenClaw Release Checks` `rerun_group`. Gebruik `all` voor een releasecandidate, `ci` voor alleen de normale volledige CI-child, `plugin-prerelease` voor alleen de plugin-prerelease-child, `release-checks` voor elke release-child, of een smallere groep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, of `npm-telegram` op de overkoepelende workflow. Zo blijft een rerun van een mislukte releasebox afgebakend na een gerichte fix. Combineer voor een mislukte cross-OS-lane `rerun_group=cross-os` met `cross_os_suite_filter`, bijvoorbeeld `windows/packaged-upgrade`; lange cross-OS-commando's geven Heartbeat-regels weer en packaged-upgrade-samenvattingen bevatten timings per fase. QA-releasecheck-lanes zijn adviserend, dus QA-only-fouten waarschuwen maar blokkeren de releasecheck-verifier niet.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde ref eenmaal te resolveren naar een `release-package-under-test`-tarball, en geeft dat artifact vervolgens door aan cross-OS-checks en Package Acceptance, plus de live/E2E-releasepad-Docker-workflow wanneer soak-dekking draait. Zo blijven de package-bytes consistent over releaseboxen heen en wordt voorkomen dat dezelfde candidate in meerdere child-jobs opnieuw wordt verpakt.

Dubbele `Full Release Validation`-runs voor `ref=main` en `rerun_group=all`
vervangen de oudere overkoepelende run. De parent-monitor annuleert elke onderliggende workflow die
al is gedispatcht wanneer de parent wordt geannuleerd, zodat nieuwere main-validatie
niet achter een verouderde releasecheck-run van twee uur blijft hangen. Validatie van releasebranches/tags
en gerichte rerun-groepen houden `cancel-in-progress: false`.

## Live- en E2E-shards

De release live/E2E-child behoudt brede native `pnpm test:live`-dekking, maar draait die als benoemde shards via `scripts/test-live-shard.mjs` in plaats van als één seriële job:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-gefilterde `native-live-src-gateway-profiles`-jobs
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- gesplitste media-audio/video-shards en provider-gefilterde muziek-shards

Zo blijft dezelfde bestandsdekking behouden, terwijl trage live-providerfouten makkelijker opnieuw te draaien en te diagnosticeren zijn. De geaggregeerde shardnamen `native-live-extensions-o-z`, `native-live-extensions-media` en `native-live-extensions-media-music` blijven geldig voor handmatige eenmalige reruns.

De native live media-shards draaien in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de workflow `Live Media Runner Image`. Die image installeert `ffmpeg` en `ffprobe` vooraf; mediajobs verifiëren de binaries alleen vóór setup. Houd Docker-backed live suites op normale Blacksmith-runners — containerjobs zijn de verkeerde plek om geneste Docker-tests te starten.

Docker-backed live model/backend-shards gebruiken een aparte gedeelde `ghcr.io/openclaw/openclaw-live-test:<sha>`-image per geselecteerde commit. De live releaseworkflow bouwt en pusht die image één keer, waarna de Docker live model-, provider-sharded Gateway-, CLI-backend-, ACP-bind- en Codex-harness-shards draaien met `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker-shards hebben expliciete scriptniveau-`timeout`-limieten onder de workflow-jobtimeout, zodat een vastgelopen container of cleanup-pad snel faalt in plaats van het volledige releasecheckbudget te verbruiken. Als die shards zelfstandig het volledige source-Docker-target opnieuw bouwen, is de releaserun verkeerd geconfigureerd en verspilt die wandkloktijd aan dubbele image-builds.

## Package Acceptance

Gebruik `Package Acceptance` wanneer de vraag is: "werkt dit installeerbare OpenClaw-package als product?" Het verschilt van normale CI: normale CI valideert de source tree, terwijl package acceptance één tarball valideert via dezelfde Docker E2E-harness die gebruikers na installatie of update gebruiken.

### Jobs

1. `resolve_package` checkt `workflow_ref` uit, resolvet één package-candidate, schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het `package-under-test`-artifact, en print de bron, workflow-ref, package-ref, versie, SHA-256 en profile in de GitHub-stapsamenvatting.
2. `docker_acceptance` roept `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt dat artifact, valideert de tarball-inventaris, bereidt package-digest-Docker-images voor wanneer nodig, en draait de geselecteerde Docker-lanes tegen dat package in plaats van de workflow-checkout te verpakken. Wanneer een profile meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het package en gedeelde images één keer voor, en waaiert die lanes vervolgens uit als parallelle gerichte Docker-jobs met unieke artifacts.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Dit draait wanneer `telegram_mode` niet `none` is en installeert hetzelfde `package-under-test`-artifact wanneer Package Acceptance er een heeft geresolved; een standalone Telegram-dispatch kan nog steeds een gepubliceerde npm-spec installeren.
4. `summary` laat de workflow falen als package-resolutie, Docker-acceptance of de optionele Telegram-lane is mislukt.

### Candidate-bronnen

- `source=npm` accepteert alleen `openclaw@beta`, `openclaw@latest`, of een exacte OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor gepubliceerde prerelease/stable-acceptance.
- `source=ref` verpakt een vertrouwde `package_ref`-branch, tag of volledige commit-SHA. De resolver haalt OpenClaw-branches/tags op, verifieert dat de geselecteerde commit bereikbaar is vanuit de repository-branchgeschiedenis of een releasetag, installeert deps in een detached worktree, en verpakt die met `scripts/package-openclaw-for-docker.mjs`.
- `source=url` downloadt een HTTPS-`.tgz`; `package_sha256` is vereist.
- `source=artifact` downloadt één `.tgz` van `artifact_run_id` en `artifact_name`; `package_sha256` is optioneel maar moet worden opgegeven voor extern gedeelde artifacts.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde workflow/harness-code die de test draait. `package_ref` is de broncommit die wordt verpakt wanneer `source=ref`. Hierdoor kan de huidige testharness oudere vertrouwde broncommits valideren zonder oude workflowlogica te draaien.

### Suite-profielen

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — volledige Docker-releasepad-chunks met OpenWebUI
- `custom` — exacte `docker_lanes`; vereist wanneer `suite_profile=custom`

Het `package`-profiel gebruikt offline plugin-dekking, zodat validatie van gepubliceerde packages niet afhankelijk is van live beschikbaarheid van ClawHub. De optionele Telegram-lane hergebruikt het `package-under-test`-artifact in `NPM Telegram Beta E2E`, waarbij het pad voor gepubliceerde npm-specs behouden blijft voor standalone dispatches.

Zie [Updates en plugins testen](/nl/help/testing-updates-plugins) voor het specifieke update- en plugin-testbeleid, inclusief lokale commando's,
Docker-lanes, Package Acceptance-inputs, releasestandaarden en foutentriage.

Releasechecks roepen Package Acceptance aan met `source=artifact`, het voorbereide releasepackage-artifact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, en `telegram_mode=mock-openai`. Zo blijven package-migratie, update, cleanup van verouderde plugin-dependencies, installatiereparatie van geconfigureerde plugins, offline plugin, plugin-update en Telegram-bewijs op dezelfde geresolvede package-tarball. Stel `package_acceptance_package_spec` in op Full Release Validation of OpenClaw Release Checks om diezelfde matrix tegen een verzonden npm-package te draaien in plaats van het uit de SHA gebouwde artifact. Cross-OS-releasechecks dekken nog steeds OS-specifieke onboarding, installer en platformgedrag; productvalidatie voor package/update moet beginnen met Package Acceptance. De Docker-lane `published-upgrade-survivor` valideert één baseline van een gepubliceerd package per run in het blokkerende releasepad. In Package Acceptance is de geresolvede `package-under-test`-tarball altijd de candidate en selecteert `published_upgrade_survivor_baseline` de fallback gepubliceerde baseline, standaard `openclaw@latest`; rerun-commando's voor mislukte lanes behouden die baseline. Full Release Validation met `run_release_soak=true` of `release_profile=full` stelt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` en `published_upgrade_survivor_scenarios=reported-issues` in om uit te breiden over de vier nieuwste stabiele npm-releases plus vastgezette plugin-compatibility boundary-releases en issue-vormige fixtures voor Feishu-config, behouden bootstrap/persona-bestanden, geconfigureerde OpenClaw-plugininstallaties, tilde-logpaden en verouderde legacy plugin dependency-roots. Multi-baseline published-upgrade-survivor-selecties worden per baseline geshard naar afzonderlijke gerichte Docker-runnerjobs. De aparte `Update Migration`-workflow gebruikt de Docker-lane `update-migration` met `all-since-2026.4.23` en `plugin-deps-cleanup` wanneer de vraag uitgebreide cleanup van gepubliceerde updates is, niet normale Full Release CI-breedte. Lokale geaggregeerde runs kunnen exacte package-specs doorgeven met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, één lane behouden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` zoals `openclaw@2026.4.15`, of `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` instellen voor de scenariomatrix. De gepubliceerde lane configureert de baseline met een ingebakken `openclaw config set`-commandorecept, registreert receptstappen in `summary.json`, en peilt `/healthz`, `/readyz`, plus RPC-status na Gateway-start. De Windows packaged- en installer fresh-lanes verifiëren ook dat een geïnstalleerd package een browser-control-override kan importeren vanaf een ruw absoluut Windows-pad. De OpenAI cross-OS agent-turn smoke gebruikt standaard `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer ingesteld, anders `openai/gpt-5.4`, zodat het installatie- en Gateway-bewijs op een GPT-5-testmodel blijft en GPT-4.x-standaarden worden vermeden.

### Legacy-compatibiliteitsvensters

Package Acceptance heeft begrensde vensters voor verouderde compatibiliteit voor reeds gepubliceerde pakketten. Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen het compatibiliteitspad gebruiken:

- bekende privé-QA-vermeldingen in `dist/postinstall-inventory.json` mogen verwijzen naar bestanden die uit de tarball zijn weggelaten;
- `doctor-switch` mag de subcase voor persistentie van `gateway install --wrapper` overslaan wanneer het pakket die vlag niet beschikbaar stelt;
- `update-channel-switch` mag ontbrekende `pnpm.patchedDependencies` uit de van de tarball afgeleide nep-gitfixture verwijderen en mag ontbrekende gepersisteerde `update.channel` loggen;
- Plugin-smokes mogen verouderde locaties voor installatierecords lezen of ontbrekende persistentie van marketplace-installatierecords accepteren;
- `plugin-update` mag migratie van configuratiemetadata toestaan, terwijl nog steeds wordt vereist dat het installatierecord en het gedrag zonder herinstallatie ongewijzigd blijven.

Het gepubliceerde pakket `2026.4.26` mag ook waarschuwen voor lokale stempelbestanden met buildmetadata die al waren meegeleverd. Latere pakketten moeten aan de moderne contracten voldoen; dezelfde omstandigheden falen dan in plaats van te waarschuwen of over te slaan.

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

Begin bij het debuggen van een mislukte package-acceptance-run met de samenvatting van `resolve_package` om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de onderliggende run `docker_acceptance` en de Docker-artifacts daarvan: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lanelogs, fasetimings en rerun-opdrachten. Geef de voorkeur aan het opnieuw uitvoeren van het mislukte pakketprofiel of de exacte Docker-lanes in plaats van de volledige releasevalidatie opnieuw uit te voeren.

## Installatiesmoke

De afzonderlijke workflow `Install Smoke` hergebruikt hetzelfde scopescript via zijn eigen `preflight`-job. De workflow splitst smokedekking op in `run_fast_install_smoke` en `run_full_install_smoke`.

- **Snel pad** wordt uitgevoerd voor pull requests die Docker-/pakketoppervlakken raken, wijzigingen in gebundelde Plugin-pakketten/manifests, of kernoppervlakken voor Plugin/kanaal/Gateway/Plugin SDK die de Docker-smokejobs uitoefenen. Wijzigingen die alleen broncode van gebundelde Plugins raken, test-only edits en docs-only edits reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image eenmaal, controleert de CLI, voert de CLI-smoke voor agents die een gedeelde werkruimte verwijderen uit, voert de container-gateway-network-E2E uit, verifieert een build-argument voor gebundelde extensies en draait het begrensde Docker-profiel voor gebundelde Plugins onder een totale opdrachttime-out van 240 seconden (waarbij elke Docker-run per scenario afzonderlijk is begrensd).
- **Volledig pad** behoudt QR-pakketinstallatie en Docker-/updatedekking voor installateurs voor nachtelijke geplande runs, handmatige dispatches, workflow-call-releasechecks en pull requests die daadwerkelijk installateur-/pakket-/Docker-oppervlakken raken. In volledige modus bereidt install-smoke één root-Dockerfile-smoke-image voor de doel-SHA in GHCR voor of hergebruikt die, en voert daarna QR-pakketinstallatie, root-Dockerfile-/Gateway-smokes, installateur-/updatesmokes en de snelle Docker-E2E voor gebundelde Plugins uit als afzonderlijke jobs, zodat installateurwerk niet hoeft te wachten achter de root-imagesmokes.

`main`-pushes (inclusief mergecommits) forceren het volledige pad niet; wanneer de logica voor gewijzigde scope volledige dekking op een push zou aanvragen, behoudt de workflow de snelle Docker-smoke en laat de volledige install-smoke over aan nachtelijke of releasevalidatie.

De trage Bun-smoke voor globale installatie van image-providers wordt afzonderlijk bewaakt door `run_bun_global_install_smoke`. Deze draait volgens het nachtelijke schema en vanuit de releasechecks-workflow, en handmatige dispatches van `Install Smoke` kunnen ervoor kiezen die mee te nemen, maar pull requests en `main`-pushes doen dat niet. QR- en installateur-Docker-tests behouden hun eigen installatiegerichte Dockerfiles.

## Lokale Docker-E2E

`pnpm test:docker:all` bouwt vooraf één gedeelde live-testimage, pakt OpenClaw eenmaal als een npm-tarball en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images:

- een kale Node/Git-runner voor lanes voor installateur/update/Plugin-afhankelijkheden;
- een functionele image die dezelfde tarball in `/app` installeert voor normale functionaliteitslanes.

Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en voert lanes daarna uit met `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Instelbare waarden

| Variabele                              | Standaard       | Doel                                                                                                           |
| -------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10              | Aantal sleuven in de hoofdpool voor normale lanes.                                                             |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10              | Aantal sleuven in de providergevoelige tailpool.                                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9               | Limiet voor gelijktijdige live-lanes, zodat providers niet throttlen.                                           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10              | Limiet voor gelijktijdige npm-installatielanes.                                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7               | Limiet voor gelijktijdige lanes met meerdere services.                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000            | Spreiding tussen lane-starts om Docker-daemon-create-stormen te vermijden; stel in op `0` voor geen spreiding. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000         | Fallbacktime-out per lane (120 minuten); geselecteerde live-/taillanes gebruiken strakkere limieten.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | niet ingesteld  | `1` print het schedulerplan zonder lanes uit te voeren.                                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | niet ingesteld  | Door komma's gescheiden exacte lanelijst; slaat cleanup-smoke over zodat agents één mislukte lane kunnen reproduceren. |

Een lane die zwaarder is dan zijn effectieve limiet kan nog steeds starten vanuit een lege pool en draait dan alleen totdat hij capaciteit vrijgeeft. De lokale aggregatie voert Docker-preflights uit, verwijdert oude OpenClaw-E2E-containers, geeft status van actieve lanes weer, bewaart lanetimings voor volgorde van langste eerst, en stopt standaard met het plannen van nieuwe gepoolde lanes na de eerste fout.

### Herbruikbare live-/E2E-workflow

De herbruikbare live-/E2E-workflow vraagt aan `scripts/test-docker-all.mjs --plan-json` welke pakket-, imagesoort-, live-image-, lane- en credentialdekking vereist is. `scripts/docker-e2e.mjs` zet dat plan daarna om in GitHub-outputs en samenvattingen. Het pakt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een pakketartifact uit de huidige run, of downloadt een pakketartifact uit `package_artifact_run_id`; valideert de tarball-inventaris; bouwt en pusht op pakketdigest getagde kale/functionele GHCR-Docker-E2E-images via Blacksmiths Docker-layercache wanneer het plan lanes met geïnstalleerd pakket nodig heeft; en hergebruikt meegegeven inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` of bestaande pakketdigestimages in plaats van opnieuw te bouwen. Docker-imagepulls worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry-/cachestream snel opnieuw probeert in plaats van het grootste deel van het kritieke CI-pad te verbruiken.

### Releasepad-chunks

Docker-dekking voor releases draait kleinere gechunkte jobs met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elke chunk alleen het imagesoort ophaalt dat hij nodig heeft en meerdere lanes via dezelfde gewogen scheduler uitvoert:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

De huidige Docker-releasechunks zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, en `plugins-runtime-install-a` tot en met `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` en `plugins-integrations` blijven aggregate aliassen voor Plugin/runtime. De lanealias `install-e2e` blijft de aggregate handmatige rerun-alias voor beide providerinstallateurlanes.

OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige releasepaddekking daarom vraagt, en behoudt alleen een zelfstandige chunk `openwebui` voor dispatches die uitsluitend OpenWebUI betreffen. Updatelanes voor gebundelde kanalen proberen eenmaal opnieuw bij tijdelijke npm-netwerkfouten.

Elke chunk uploadt `.artifacts/docker-tests/` met lanelogs, timings, `summary.json`, `failures.json`, fasetimings, JSON van het schedulerplan, tabellen met trage lanes en rerun-opdrachten per lane. De workflowinput `docker_lanes` voert geselecteerde lanes uit tegen de voorbereide images in plaats van de chunkjobs, waardoor debugging van mislukte lanes begrensd blijft tot één gerichte Docker-job en het pakketartifact voor die run wordt voorbereid, gedownload of hergebruikt; als een geselecteerde lane een live-Docker-lane is, bouwt de gerichte job de live-testimage lokaal voor die rerun. Gegenereerde GitHub-rerun-opdrachten per lane bevatten `package_artifact_run_id`, `package_artifact_name` en voorbereide image-inputs wanneer die waarden bestaan, zodat een mislukte lane exact hetzelfde pakket en dezelfde images uit de mislukte run kan hergebruiken.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

De geplande live-/E2E-workflow draait dagelijks de volledige Docker-suite voor het releasepad.

## Plugin-voorrelease

`Plugin Prerelease` is duurdere product-/pakketdekking, dus het is een afzonderlijke workflow die wordt gedispatcht door `Full Release Validation` of door een expliciete operator. Normale pull requests, `main`-pushes en zelfstandige handmatige CI-dispatches laten die suite uit. De workflow verdeelt gebundelde Plugin-tests over acht extensieworkers; die extensieshardjobs draaien maximaal twee Plugin-configuratiegroepen tegelijk met één Vitest-worker per groep en een grotere Node-heap, zodat importzware Plugin-batches geen extra CI-jobs maken. Het Docker-voorreleasepad dat alleen voor releases geldt, batchet gerichte Docker-lanes in kleine groepen om te voorkomen dat tientallen runners worden gereserveerd voor jobs van één tot drie minuten.

## QA Lab

QA Lab heeft eigen CI-lanes buiten de hoofdworkflow met slimme scope. Agentische pariteit is genest onder de brede QA- en releaseharnassen, niet onder een zelfstandige PR-workflow. Gebruik `Full Release Validation` met `rerun_group=qa-parity` wanneer pariteit moet meeliften met een brede validatierun.

- De workflow `QA-Lab - All Lanes` draait nachtelijk op `main` en bij handmatige dispatch; hij waaiert de mock-parity-lane, live Matrix-lane en live Telegram- en Discord-lanes uit als parallelle jobs. Live jobs gebruiken de omgeving `qa-live-shared`, en Telegram/Discord gebruiken Convex-leases.

Releasecontroles voeren Matrix- en Telegram-live-transportlanes uit met de deterministische mockprovider en mock-gekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het kanaalcontract is geïsoleerd van live-modellatentie en het normale opstarten van provider-plugins. De live-transport-Gateway schakelt geheugenzoekopdrachten uit omdat QA-pariteit geheugengedrag afzonderlijk afdekt; providerconnectiviteit wordt afgedekt door de afzonderlijke suites voor live modellen, native providers en Docker-providers.

Matrix gebruikt `--profile fast` voor geplande en releasegates, en voegt `--fail-fast` alleen toe wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaard en handmatige workflowinvoer blijven `all`; handmatige `matrix_profile=all`-dispatch verdeelt volledige Matrix-dekking altijd over `transport`-, `media`-, `e2ee-smoke`-, `e2ee-deep`- en `e2ee-cli`-jobs.

`OpenClaw Release Checks` voert ook de releasekritieke QA Lab-lanes uit vóór releasegoedkeuring; de QA-pariteitsgate voert de candidate- en baseline-pakketten uit als parallelle lane-jobs, en downloadt daarna beide artefacten naar een kleine rapportjob voor de uiteindelijke pariteitsvergelijking.

Volg voor normale PR's scoped CI-/controlebewijs in plaats van pariteit als vereiste status te behandelen.

## CodeQL

De `CodeQL`-workflow is bewust een smalle beveiligingsscanner voor een eerste controle, niet de volledige repository-sweep. Dagelijkse, handmatige en niet-draft pull request guard-runs scannen Actions-workflowcode plus de JavaScript/TypeScript-oppervlakken met het hoogste risico met beveiligingsquery's met hoge zekerheid, gefilterd op hoge/kritieke `security-severity`.

De pull request guard blijft licht: hij start alleen voor wijzigingen onder `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` of `src`, en voert dezelfde beveiligingsmatrix met hoge zekerheid uit als de geplande workflow. Android en macOS CodeQL blijven buiten de PR-standaarden.

### Beveiligingscategorieën

| Categorie                                         | Oppervlak                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, geheimen, sandbox, cron en gateway-baseline                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Kerncontracten voor kanaalimplementatie plus de runtime van de kanaal-Plugin, gateway, Plugin SDK, geheimen, audit-touchpoints     |
| `/codeql-security-high/network-ssrf-boundary`     | Kernoppervlakken voor SSRF, IP-parsing, netwerkguard, web-fetch en Plugin SDK SSRF-beleid                                          |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-servers, helpers voor procesuitvoering, uitgaande aflevering en gates voor tooluitvoering door agents                          |
| `/codeql-security-high/plugin-trust-boundary`     | Vertrouwensoppervlakken voor Plugin-installatie, loader, manifest, register, package-manager-installatie, source-loading en Plugin SDK-packagecontract |

### Platformspecifieke beveiligingsshards

- `CodeQL Android Critical Security` — geplande Android-beveiligingsshard. Bouwt de Android-app handmatig voor CodeQL op de kleinste Blacksmith Linux-runner die door workflow sanity wordt geaccepteerd. Uploadt onder `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — wekelijkse/handmatige macOS-beveiligingsshard. Bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert resultaten van dependency-builds uit geüploade SARIF en uploadt onder `/codeql-critical-security/macos`. Buiten dagelijkse standaarden gehouden omdat de macOS-build de runtime domineert, zelfs wanneer die schoon is.

### Critical Quality-categorieën

`CodeQL Critical Quality` is de bijpassende niet-beveiligingsshard. Deze voert alleen kwaliteitquery's met foutseverity en zonder beveiliging uit voor JavaScript/TypeScript over smalle, waardevolle oppervlakken op de kleinere Blacksmith Linux-runner. De pull request guard is bewust kleiner dan het geplande profiel: niet-draft PR's voeren alleen de bijpassende shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` en `plugin-sdk-reply-runtime` uit voor wijzigingen in agent-command/model/tool-uitvoering en reply-dispatchcode, configschema/migratie/IO-code, auth/geheimen/sandbox/beveiligingscode, runtime van kernkanaal en gebundelde kanaal-Plugin, Gateway-protocol/server-method, memory-runtime/SDK-glue, MCP/proces/uitgaande aflevering, provider-runtime/modelcatalogus, sessiediagnostiek/afleverwachtrijen, Plugin-loader, Plugin SDK/package-contract of Plugin SDK-reply-runtime. Wijzigingen in CodeQL-config en kwaliteitsworkflow voeren alle twaalf PR-kwaliteitsshards uit.

Handmatige dispatch accepteert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

De smalle profielen zijn onderwijs-/iteratiehooks om één kwaliteitsshard geïsoleerd uit te voeren.

| Categorie                                               | Oppervlak                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, geheimen, sandbox, cron en code voor de Gateway-beveiligingsgrens                                                                                           |
| `/codeql-critical-quality/config-boundary`              | Configschema, migratie, normalisatie en IO-contracten                                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-protocolschema's en servermethod-contracten                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementatiecontracten voor kernkanaal en gebundelde kanaal-Plugin                                                                                               |
| `/codeql-critical-quality/agent-runtime-boundary`       | Command-uitvoering, model/provider-dispatch, auto-reply-dispatch en wachtrijen, en ACP-control-plane-runtimecontracten                                            |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-servers en toolbridges, helpers voor procestoezicht en contracten voor uitgaande aflevering                                                                   |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory-host-SDK, memory-runtimefacades, memory-Plugin SDK-aliassen, glue voor activering van memory-runtime en memory-doctor-commando's                           |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interne reply-wachtrijen, sessieafleverwachtrijen, helpers voor uitgaande sessiebinding/aflevering, diagnostische event/log-bundle-oppervlakken en sessie-doctor-CLI-contracten |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Inkomende reply-dispatch van Plugin SDK, helpers voor reply-payload/chunking/runtime, kanaal-reply-opties, afleverwachtrijen en helpers voor sessie/thread-binding |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisatie van modelcatalogus, provider-auth en discovery, provider-runtime-registratie, provider-standaarden/catalogi en registers voor web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Control-UI-bootstrap, lokale persistentie, Gateway-control-flows en Task-control-plane-runtimecontracten                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kerncontracten voor web fetch/search, media-IO, mediabegrip, image-generation en media-generation-runtime                                                         |
| `/codeql-critical-quality/plugin-boundary`              | Contracten voor loader, register, publiek oppervlak en Plugin SDK-entrypoint                                                                                      |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Gepubliceerde package-side Plugin SDK-bron en helpers voor plugin-packagecontracten                                                                               |

Kwaliteit blijft gescheiden van beveiliging, zodat kwaliteitsbevindingen kunnen worden gepland, gemeten, uitgeschakeld of uitgebreid zonder het beveiligingssignaal te vertroebelen. Uitbreiding van Swift-, Python- en gebundelde-Plugin-CodeQL moet alleen als scoped of gesharde follow-up worden teruggezet nadat de smalle profielen stabiele runtime en stabiel signaal hebben.

## Onderhoudsworkflows

### Docs Agent

De `Docs Agent`-workflow is een eventgedreven Codex-onderhoudslane om bestaande docs afgestemd te houden op recent gelande wijzigingen. Deze heeft geen pure planning: een succesvolle niet-bot push-CI-run op `main` kan hem triggeren, en handmatige dispatch kan hem rechtstreeks uitvoeren. Workflow-run-aanroepen worden overgeslagen wanneer `main` is doorgelopen of wanneer er in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is gemaakt. Wanneer hij draait, beoordeelt hij de commitrange van de vorige niet-overgeslagen Docs Agent-bron-SHA tot de huidige `main`, zodat één uurlijkse run alle main-wijzigingen kan afdekken die sinds de laatste docspass zijn verzameld.

### Test Performance Agent

De `Test Performance Agent`-workflow is een eventgedreven Codex-onderhoudslane voor trage tests. Deze heeft geen pure planning: een succesvolle niet-bot push-CI-run op `main` kan hem triggeren, maar hij slaat over als er op die UTC-dag al een andere workflow-run-aanroep heeft gedraaid of draait. Handmatige dispatch omzeilt die dagelijkse activiteitsgate. De lane bouwt een gegroepeerd Vitest-prestatierapport voor de volledige suite, laat Codex alleen kleine dekkingsbehoudende testprestatieverbeteringen maken in plaats van brede refactors, voert daarna het volledige-suiterapport opnieuw uit en weigert wijzigingen die het baseline-aantal geslaagde tests verlagen. Als de baseline falende tests heeft, mag Codex alleen duidelijke fouten oplossen en moet het volledige-suiterapport na de agent slagen voordat er iets wordt gecommit. Wanneer `main` verder gaat voordat de botpush landt, rebaset de lane de gevalideerde patch, voert `pnpm check:changed` opnieuw uit en probeert de push opnieuw; conflicterende stale patches worden overgeslagen. Hij gebruikt GitHub-hosted Ubuntu zodat de Codex-action dezelfde drop-sudo-veiligheidshouding kan behouden als de docs-agent.

### Dubbele PR's na merge

De `Duplicate PRs After Merge`-workflow is een handmatige maintainerworkflow voor dubbele-opruiming na landing. Deze staat standaard op dry-run en sluit alleen expliciet vermelde PR's wanneer `apply=true`. Voordat GitHub wordt gemuteerd, controleert hij dat de gelande PR is gemerged en dat elke duplicate ofwel een gedeelde gerefereerde issue heeft, ofwel overlappende gewijzigde hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale controlegates en gewijzigde routering

Lokale changed-lane-logica staat in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale controlegate is strikter over architectuurgrenzen dan de brede scope van het CI-platform:

- core-productiewijzigingen voeren core prod- en core test-typecheck plus core lint/guards uit;
- wijzigingen die alleen core-tests raken, voeren alleen core test-typecheck plus core lint uit;
- extensieproductiewijzigingen voeren extensie-prod- en extensie-testtypecheck plus extensielint uit;
- wijzigingen die alleen extensietests raken, voeren extensietesttypecheck plus extensielint uit;
- wijzigingen aan de openbare Plugin SDK of het Plugin-contract breiden uit naar extensietypecheck omdat extensies afhankelijk zijn van die core-contracten (Vitest-extensiesweeps blijven expliciet testwerk);
- versiebumps die alleen release-metadata raken, voeren gerichte versie-/config-/root-dependency-controles uit;
- onbekende root-/configwijzigingen vallen veilig terug naar alle controlelanes.

Lokale routering voor gewijzigde tests staat in `scripts/test-projects.test-support.mjs` en is bewust goedkoper dan `check:changed`: directe testbewerkingen draaien zichzelf, bronbewerkingen geven de voorkeur aan expliciete mappings, daarna sibling-tests en importgraph-afhankelijken. Gedeelde group-room-bezorgconfiguratie is een van de expliciete mappings: wijzigingen aan de group visible-reply-configuratie, de bronmodus voor reply-bezorging, of de systeemprompt van de message-tool lopen via de core reply-tests plus Discord- en Slack-bezorgregressies, zodat een gedeelde standaardwijziging faalt vóór de eerste PR-push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging breed genoeg is voor de harness dat de goedkope gemapte set geen betrouwbare proxy is.

## Testbox-validatie

Voer Testbox uit vanaf de repo-root en geef de voorkeur aan een vers opgewarmde box voor breed bewijs. Voordat je een trage gate besteedt aan een box die is hergebruikt, verlopen, of net een onverwacht grote sync meldde, voer eerst `pnpm testbox:sanity` uit in de box.

De sanity-check faalt snel wanneer vereiste rootbestanden zoals `pnpm-lock.yaml` zijn verdwenen of wanneer `git status --short` minstens 200 getrackte verwijderingen toont. Dat betekent meestal dat de remote sync-status geen betrouwbare kopie van de PR is; stop die box en warm een nieuwe op in plaats van de producttestfout te debuggen. Stel voor opzettelijke PR's met veel verwijderingen `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor die sanity-run.

`pnpm testbox:run` beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de sync-fase blijft zonder output na de sync. Stel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` in om die guard uit te schakelen, of gebruik een grotere millisecondenwaarde voor ongewoon grote lokale diffs.

Crabbox is de repo-eigen remote-box-wrapper voor Linux-bewijs door maintainers. Gebruik het wanneer een check te breed is voor een lokale bewerkingslus, wanneer CI-pariteit belangrijk is, of wanneer het bewijs secrets, Docker, package-lanes, herbruikbare boxes of remote logs nodig heeft. De normale OpenClaw-backend is `blacksmith-testbox`; eigen AWS/Hetzner-capaciteit is een fallback voor Blacksmith-storingen, quotaproblemen of expliciete tests met eigen capaciteit.

Controleer vóór een eerste run de wrapper vanaf de repo-root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

De repo-wrapper weigert een verouderde Crabbox-binary die `blacksmith-testbox` niet adverteert. Geef de provider expliciet door, ook al heeft `.crabbox.yaml` owned-cloud-standaarden.

Gewijzigde gate:

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

Lees de uiteindelijke JSON-samenvatting. De nuttige velden zijn `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` en `totalMs`. Eenmalige door Blacksmith ondersteunde Crabbox-runs moeten de Testbox automatisch stoppen; als een run wordt onderbroken of cleanup onduidelijk is, inspecteer live boxes en stop alleen de boxes die je hebt gemaakt:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Gebruik hergebruik alleen wanneer je opzettelijk meerdere commando's op dezelfde gehydrateerde box nodig hebt:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Als Crabbox de kapotte laag is maar Blacksmith zelf werkt, gebruik dan direct Blacksmith als smalle fallback:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Als `blacksmith testbox list --all` en `blacksmith testbox status` werken maar nieuwe
warmups na een paar minuten `queued` blijven zonder IP of Actions-run-URL,
behandel dit dan als druk op de Blacksmith-provider, wachtrij, facturatie of org-limiet. Stop de
queued ids die je hebt gemaakt, vermijd het starten van meer Testboxes, en verplaats het bewijs naar het
eigen Crabbox-capaciteitspad hieronder terwijl iemand het Blacksmith-dashboard,
facturatie en org-limieten controleert.

Escaleren naar eigen Crabbox-capaciteit doe je alleen wanneer Blacksmith down is, door quota beperkt is, de benodigde omgeving mist, of eigen capaciteit expliciet het doel is:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Vermijd bij AWS-druk `class=beast`, tenzij de taak echt CPU op 48xlarge-niveau nodig heeft. Een `beast`-aanvraag begint bij 192 vCPU's en is de gemakkelijkste manier om regionale EC2 Spot- of On-Demand Standard-quota te raken. De repo-eigen `.crabbox.yaml` gebruikt standaard `standard`, meerdere capaciteitsregio's en `capacity.hints: true`, zodat gebrokerde AWS-leases de geselecteerde regio/markt, quotadruk, Spot-fallback en waarschuwingen voor high-pressure classes afdrukken. Gebruik `fast` voor zwaardere brede checks, `large` alleen nadat standard/fast niet genoeg zijn, en `beast` alleen voor uitzonderlijke CPU-gebonden lanes zoals volledige suites of all-plugin Docker-matrices, expliciete release-/blocker-validatie of high-core performanceprofiling. Gebruik `beast` niet voor `pnpm check:changed`, gerichte tests, docs-only werk, gewone lint/typecheck, kleine E2E-repro's of triage van Blacksmith-storingen. Gebruik `--market on-demand` voor capaciteitsdiagnose, zodat Spot-marktschommelingen niet met het signaal worden vermengd.

`.crabbox.yaml` beheert provider-, sync- en GitHub Actions-hydratatiestandaarden voor owned-cloud-lanes. Het sluit lokale `.git` uit, zodat de gehydrateerde Actions-checkout zijn eigen remote Git-metadata behoudt in plaats van maintainer-lokale remotes en object stores te synchroniseren, en het sluit lokale runtime-/buildartefacten uit die nooit mogen worden overgedragen. `.github/workflows/crabbox-hydrate.yml` beheert checkout, Node-/pnpm-setup, `origin/main`-fetch en de niet-geheime environment-overdracht voor owned-cloud-commando's met `crabbox run --id <cbx_id>`.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Ontwikkelkanalen](/nl/install/development-channels)
