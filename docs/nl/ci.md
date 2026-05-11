---
read_when:
    - Je moet begrijpen waarom een CI-taak wel of niet is uitgevoerd
    - Je debugt een falende GitHub Actions-controle
    - Je coördineert een releasevalidatierun of heruitvoering
    - Je wijzigt de ClawSweeper-routering of het doorsturen van GitHub-activiteit
summary: CI-taakgrafiek, scope-gates, release-overkoepelingen en lokale opdrachtequivalenten
title: CI-pipeline
x-i18n:
    generated_at: "2026-05-11T20:22:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: b377be491770211595b12833b9bb18e5757839ef761539d5caa8eda6f63d75dc
    source_path: ci.md
    workflow: 16
---

OpenClaw-CI draait bij elke push naar `main` en elke pull request. De `preflight`-job classificeert de diff en schakelt dure lanes uit wanneer alleen niet-gerelateerde gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen bewust slimme scoping en waaieren de volledige grafiek uit voor releasekandidaten en brede validatie. Android-lanes blijven opt-in via `include_android`. Release-only Plugin-dekking staat in de afzonderlijke workflow [`Plugin-voorrelease`](#plugin-prerelease) en draait alleen vanuit [`Volledige releasevalidatie`](#full-release-validation) of een expliciete handmatige dispatch.

## Pipelineoverzicht

| Job                              | Doel                                                                                                      | Wanneer deze draait                         |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `preflight`                      | Detecteer docs-only wijzigingen, gewijzigde scopes, gewijzigde extensies, en bouw het CI-manifest         | Altijd bij niet-concept-pushes en PR's      |
| `security-scm-fast`              | Detectie van privésleutels en workflowaudit via `zizmor`                                                  | Altijd bij niet-concept-pushes en PR's      |
| `security-dependency-audit`      | Afhankelijkheidsvrije audit van productie-lockfile tegen npm-advisories                                   | Altijd bij niet-concept-pushes en PR's      |
| `security-fast`                  | Vereiste aggregatie voor de snelle security-jobs                                                          | Altijd bij niet-concept-pushes en PR's      |
| `check-dependencies`             | Productie-Knip-pass alleen voor afhankelijkheden plus de allowlist-guard voor ongebruikte bestanden       | Node-relevante wijzigingen                  |
| `build-artifacts`                | Bouw `dist/`, Control-UI, controles op buildartefacten, en herbruikbare downstreamartefacten              | Node-relevante wijzigingen                  |
| `checks-fast-core`               | Snelle Linux-correctness-lanes zoals bundled/plugin-contract/protocol-controles                           | Node-relevante wijzigingen                  |
| `checks-fast-contracts-channels` | Gesherde kanaalcontractcontroles met een stabiel geaggregeerd controleresultaat                           | Node-relevante wijzigingen                  |
| `checks-node-core-test`          | Core Node-testshards, exclusief kanaal-, gebundelde, contract- en extensie-lanes                          | Node-relevante wijzigingen                  |
| `check`                          | Gesherde equivalent van de lokale hoofdgate: prod-types, lint, guards, testtypes en strikte smoke         | Node-relevante wijzigingen                  |
| `check-additional`               | Architectuur, gesherde boundary/prompt-drift, extensieguards, package-boundary en gateway watch           | Node-relevante wijzigingen                  |
| `build-smoke`                    | Smoke-tests voor gebouwde CLI en startup-memory-smoke                                                     | Node-relevante wijzigingen                  |
| `checks`                         | Verifier voor kanaaltests van buildartefacten                                                             | Node-relevante wijzigingen                  |
| `checks-node-compat-node22`      | Node 22-compatibiliteitsbuild en smoke-lane                                                               | Handmatige CI-dispatch voor releases        |
| `check-docs`                     | Docs-formatting, lint en controles op kapotte links                                                       | Docs gewijzigd                              |
| `skills-python`                  | Ruff + pytest voor Python-ondersteunde Skills                                                             | Python-skill-relevante wijzigingen          |
| `checks-windows`                 | Windows-specifieke proces-/padtests plus regressies in gedeelde runtime-importspecificaties               | Windows-relevante wijzigingen               |
| `macos-node`                     | macOS TypeScript-testlane met de gedeelde buildartefacten                                                 | macOS-relevante wijzigingen                 |
| `macos-swift`                    | Swift-lint, build en tests voor de macOS-app                                                              | macOS-relevante wijzigingen                 |
| `android`                        | Android-unittests voor beide smaken plus één debug-APK-build                                              | Android-relevante wijzigingen               |
| `test-performance-agent`         | Dagelijkse Codex-optimalisatie voor trage tests na vertrouwde activiteit                                  | Geslaagde main-CI of handmatige dispatch    |
| `openclaw-performance`           | Dagelijkse/op aanvraag Kova-runtimeprestatierapporten met mock-provider, deep-profile en GPT 5.4 live-lanes | Geplande en handmatige dispatch           |

## Fail-fast-volgorde

1. `preflight` bepaalt welke lanes überhaupt bestaan. De logica `docs-scope` en `changed-scope` zijn stappen binnen deze job, geen zelfstandige jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` en `skills-python` falen snel zonder te wachten op de zwaardere artefact- en platformmatrixjobs.
3. `build-artifacts` overlapt met de snelle Linux-lanes, zodat downstreamconsumenten kunnen starten zodra de gedeelde build klaar is.
4. Zwaardere platform- en runtime-lanes waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` en `android`.

GitHub kan vervangen jobs als `cancelled` markeren wanneer een nieuwere push op dezelfde PR- of `main`-ref landt. Behandel dat als CI-ruis, tenzij de nieuwste run voor dezelfde ref ook faalt. Geaggregeerde shardcontroles gebruiken `!cancelled() && always()`, zodat ze nog steeds normale shardfouten rapporteren, maar niet in de wachtrij gaan nadat de volledige workflow al is vervangen. De automatische CI-concurrency key is geversioneerd (`CI-v7-*`), zodat een GitHub-side zombie in een oude wachtrijgroep nieuwere main-runs niet onbeperkt kan blokkeren. Handmatige runs van de volledige suite gebruiken `CI-manual-v1-*` en annuleren geen lopende runs.

De job `ci-timings-summary` uploadt een compact `ci-timings-summary`-artefact voor elke niet-concept-CI-run. Dit registreert wall time, wachtrijtijd, traagste jobs en mislukte jobs voor de huidige run, zodat CI-gezondheidscontroles niet herhaaldelijk de volledige Actions-payload hoeven te scrapen.

## Scope en routering

Scopelogica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unittests in `src/scripts/ci-changed-scope.test.ts`. Handmatige dispatch slaat changed-scope-detectie over en laat het preflight-manifest zich gedragen alsof elk scoped gebied is gewijzigd.

- **CI-workflowbewerkingen** valideren de Node-CI-grafiek plus workflowlinting, maar forceren op zichzelf geen native builds voor Windows, Android of macOS; die platform-lanes blijven gescoped op platformbronwijzigingen.
- **Alleen-CI-routeringsbewerkingen, geselecteerde goedkope core-test-fixturebewerkingen, en smalle Plugin-contract-helper-/testrouteringsbewerkingen** gebruiken een snel Node-only manifestpad: `preflight`, security, en één `checks-fast-core`-taak. Dat pad slaat buildartefacten, Node 22-compatibiliteit, kanaalcontracten, volledige core-shards, bundled-plugin-shards, en aanvullende guard-matrices over wanneer de wijziging beperkt is tot de routerings- of helperoppervlakken die de snelle taak direct uitoefent.
- **Windows Node-controles** zijn gescoped op Windows-specifieke proces-/padwrappers, npm/pnpm/UI-runnerhelpers, package-managerconfiguratie, en de CI-workflowoppervlakken die die lane uitvoeren; niet-gerelateerde bron-, Plugin-, install-smoke- en test-only wijzigingen blijven op de Linux Node-lanes.

De traagste Node-testfamilies zijn gesplitst of gebalanceerd zodat elke job klein blijft zonder runners overmatig te reserveren: kanaalcontracten draaien als drie gewogen Blacksmith-ondersteunde shards met de standaard GitHub-runnerfallback, core unit fast/support-lanes draaien afzonderlijk, core runtime-infra is opgesplitst tussen state-, process/config-, cron- en shared-shards, auto-reply draait als gebalanceerde workers (waarbij de reply-subtree is opgesplitst in agent-runner-, dispatch- en commands/state-routing-shards), en agentic gateway/server-configs zijn opgesplitst over chat/auth/model/http-plugin/runtime/startup-lanes in plaats van te wachten op buildartefacten. Brede browser-, QA-, media- en diverse Plugin-tests gebruiken hun eigen Vitest-configs in plaats van de gedeelde Plugin-catch-all. Include-pattern-shards registreren timingitems met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een volledige config kan onderscheiden van een gefilterde shard. `check-additional` houdt package-boundary compile/canary-werk bij elkaar en scheidt runtime-topologiearchitectuur van gateway-watch-dekking; de boundary-guardlijst is gestreept over vier matrixshards, die elk geselecteerde onafhankelijke guards gelijktijdig uitvoeren en timings per controle afdrukken. De dure Codex happy-path prompt snapshot drift-controle draait als eigen aanvullende job voor handmatige CI en alleen voor prompt-beïnvloedende wijzigingen, zodat normale niet-gerelateerde Node-wijzigingen niet achter koude prompt-snapshotgeneratie hoeven te wachten en de boundary-shards gebalanceerd blijven terwijl prompt-drift nog steeds is vastgepind aan de PR die deze veroorzaakte; dezelfde vlag slaat prompt-snapshot-Vitest-generatie over binnen de buildartefact-core-support-boundary-shard. Gateway watch, kanaaltests en de core support-boundary-shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd.

Android-CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play debug-APK. De third-party-smaak heeft geen aparte source set of manifest; de unittests-lane compileert de smaak nog steeds met de SMS/call-log BuildConfig-vlaggen, terwijl een dubbele debug-APK-packagingjob bij elke Android-relevante push wordt vermeden.

De `check-dependencies`-shard draait `pnpm deadcode:dependencies` (een productie-Knip-pass alleen voor afhankelijkheden, vastgepind op de nieuwste Knip-versie, met pnpm's minimale releaseleeftijd uitgeschakeld voor de `dlx`-installatie) en `pnpm deadcode:unused-files`, die Knip's productiebevindingen voor ongebruikte bestanden vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. De ongebruikte-bestanden-guard faalt wanneer een PR een nieuw, niet-beoordeeld ongebruikt bestand toevoegt of een verouderde allowlist-entry laat staan, terwijl bewust dynamische Plugin-, gegenereerde, build-, live-test- en package-bridge-oppervlakken behouden blijven die Knip niet statisch kan oplossen.

## Doorsturen van ClawSweeper-activiteit

`.github/workflows/clawsweeper-dispatch.yml` is de doelzijdige brug van OpenClaw-repositoryactiviteit naar ClawSweeper. Deze checkt geen onvertrouwde pull request-code uit en voert die niet uit. De workflow maakt een GitHub App-token aan vanuit `CLAWSWEEPER_APP_PRIVATE_KEY` en dispatcht daarna compacte `repository_dispatch`-payloads naar `openclaw/clawsweeper`.

De workflow heeft vier lanes:

- `clawsweeper_item` voor exacte reviewverzoeken voor issues en pull requests;
- `clawsweeper_comment` voor expliciete ClawSweeper-commando's in issuecommentaren;
- `clawsweeper_commit_review` voor reviewverzoeken op commitniveau bij pushes naar `main`;
- `github_activity` voor algemene GitHub-activiteit die de ClawSweeper-agent kan inspecteren.

De `github_activity`-lane stuurt alleen genormaliseerde metadata door: eventtype, actie, actor, repository, itemnummer, URL, titel, status en korte fragmenten voor commentaren of reviews wanneer aanwezig. Deze vermijdt bewust het doorsturen van de volledige webhook-body. De ontvangende workflow in `openclaw/clawsweeper` is `.github/workflows/github-activity.yml`, die de genormaliseerde gebeurtenis naar de OpenClaw Gateway-hook voor de ClawSweeper-agent post.

Algemene activiteit is observatie, geen standaardlevering. De ClawSweeper-agent ontvangt het Discord-doel in zijn prompt en mag alleen naar `#clawsweeper` posten wanneer de gebeurtenis verrassend, actiegericht, riskant of operationeel nuttig is. Routinematige opens, bewerkingen, botverloop, dubbele webhook-ruis en normaal reviewverkeer moeten resulteren in `NO_REPLY`.

Behandel GitHub-titels, opmerkingen, bodies, reviewtekst, branchnamen en commitberichten in dit hele pad als niet-vertrouwde gegevens. Ze zijn invoer voor samenvatting en triage, geen instructies voor de workflow of agent-runtime.

## Handmatige dispatches

Handmatige CI-dispatches voeren dezelfde jobgrafiek uit als normale CI, maar schakelen elke niet-Android-scoped lane geforceerd in: Linux Node-shards, gebundelde Plugin-shards, channel-contracts, Node 22-compatibiliteit, `check`, `check-additional`, build-smoke, docs-controles, Python Skills, Windows, macOS en Control UI-i18n. Losse handmatige CI-dispatches voeren alleen Android uit met `include_android=true`; de volledige releaseparaplu schakelt Android in door `include_android=true` door te geven. Statische controles voor Plugin-prereleases, de release-only `agentic-plugins`-shard, de volledige extension-batch-sweep en Docker-lanes voor Plugin-prereleases zijn uitgesloten van CI. De Docker-prerelease-suite draait alleen wanneer `Full Release Validation` de afzonderlijke workflow `Plugin Prerelease` dispatcht met de release-validation-gate ingeschakeld.

Handmatige runs gebruiken een unieke concurrency group, zodat een volledige release-candidate-suite niet wordt geannuleerd door een andere push- of PR-run op dezelfde ref. Met de optionele invoer `target_ref` kan een vertrouwde caller die grafiek uitvoeren tegen een branch, tag of volledige commit-SHA, terwijl het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, snelle beveiligingsjobs en aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), snelle protocol-/contract-/gebundelde controles, sharded channel-contractcontroles, `check`-shards behalve lint, `check-additional`-aggregates, aggregate-verifiers voor Node-tests, docs-controles, Python Skills, workflow-sanity, labeler, auto-response; install-smoke-preflight gebruikt ook GitHub-hosted Ubuntu zodat de Blacksmith-matrix eerder in de wachtrij kan komen |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lichtere extension-shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` en `check-test-types`                                                                                                                                                                                                                                                                                                               |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke, Linux Node-testshards, gebundelde Plugin-testshards, `check-additional`-shards, `android`                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint` (CPU-gevoelig genoeg dat 8 vCPU meer kostte dan het bespaarde); install-smoke Docker-builds (32-vCPU-wachtrijtijd kostte meer dan het bespaarde)                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                    |

CI voor de canonieke repo houdt Blacksmith als standaard runner-pad. Tijdens `preflight` controleert `scripts/ci-runner-labels.mjs` recente queued en in-progress Actions-runs op queued Blacksmith-jobs. Als een specifiek Blacksmith-label al queued jobs heeft, vallen downstream jobs die exact dat label zouden gebruiken alleen voor die run terug op de bijpassende GitHub-hosted runner (`ubuntu-24.04`, `windows-2025` of `macos-latest`). Andere Blacksmith-groottes in dezelfde OS-familie blijven op hun primaire labels. Als de API-probe mislukt, wordt geen fallback toegepast.

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

Handmatige dispatch benchmarkt normaal gesproken de workflow-ref. Stel `target_ref` in om een release-tag of andere branch te benchmarken met de huidige workflowimplementatie. Gepubliceerde rapportpaden en latest-pointers worden gesleuteld op de geteste ref, en elke `index.md` registreert de geteste ref/SHA, workflow-ref/SHA, Kova-ref, profiel, lane-authmodus, model, herhalingsaantal en scenariofilters.

De workflow installeert OCM vanaf een pinned release en Kova vanuit `openclaw/Kova` op de pinned invoer `kova_ref`, en voert daarna drie lanes uit:

- `mock-provider`: diagnostische Kova-scenario's tegen een local-build runtime met deterministische nep-auth die OpenAI-compatibel is.
- `mock-deep-profile`: CPU-/heap-/traceprofilering voor hotspots bij startup, Gateway en agent-turns.
- `live-gpt54`: een echte OpenAI `openai/gpt-5.4` agent-turn, overgeslagen wanneer `OPENAI_API_KEY` niet beschikbaar is.

De mock-provider-lane voert na de Kova-pass ook OpenClaw-native source-probes uit: Gateway-opstarttiming en geheugen over default-, hook- en 50-Plugin-startupgevallen; herhaalde mock-OpenAI `channel-chat-baseline` hello-loops; en CLI-startupcommando's tegen de opgestarte Gateway. De Markdown-samenvatting van de source-probe staat op `source/index.md` in de rapportbundel, met raw JSON ernaast.

Elke lane uploadt GitHub-artifacts. Wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd, commit de workflow ook `report.json`, `report.md`, bundels, `index.md` en source-probe-artifacts naar `openclaw/clawgrit-reports` onder `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. De huidige tested-ref-pointer wordt geschreven als `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Full Release Validation

`Full Release Validation` is de handmatige parapluworkflow voor "alles uitvoeren vóór release." Deze accepteert een branch, tag of volledige commit-SHA, dispatcht de handmatige workflow `CI` met dat doel, dispatcht `Plugin Prerelease` voor release-only Plugin-/package-/static-/Docker-bewijs, en dispatcht `OpenClaw Release Checks` voor install-smoke, package-acceptatie, cross-OS package-controles, QA Lab-pariteit, Matrix en Telegram-lanes. Stabiele/default runs houden uitputtende live/E2E- en Docker-release-path-dekking achter `run_release_soak=true`; `release_profile=full` forceert die soak-dekking aan zodat brede advisory-validatie breed blijft. Met `rerun_group=all` en `release_profile=full` voert dit ook `NPM Telegram Beta E2E` uit tegen het artifact `release-package-under-test` uit release checks. Geef na publicatie `release_package_spec` door om het verzonden npm-package opnieuw te gebruiken in release checks, Package Acceptance, Docker, cross-OS en Telegram zonder opnieuw te bouwen. Gebruik `npm_telegram_package_spec` alleen wanneer Telegram een ander package moet bewijzen.

Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
stage-matrix, exacte workflowjobnamen, profielverschillen, artifacts en
gerichte rerun-handles.

`OpenClaw Release Publish` is de handmatige muterende releaseworkflow. Dispatch deze
vanuit `release/YYYY.M.D` of `main` nadat de release-tag bestaat en nadat de
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

Gebruik voor pinned commit-bewijs op een snel bewegende branch de helper in plaats van
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow-dispatch-refs moeten branches of tags zijn, geen ruwe commit-SHA's. De
helper pusht een tijdelijke `release-ci/<sha>-...`-branch op de doel-SHA,
dispatcht `Full Release Validation` vanaf die gepinde ref, verifieert dat elke child
workflow `headSha` overeenkomt met het doel, en verwijdert de tijdelijke branch wanneer de
run is voltooid. De umbrella-verifier faalt ook als een child workflow op een
andere SHA draaide.

`release_profile` bepaalt de live/provider-breedte die aan releasechecks wordt doorgegeven. De
handmatige releaseworkflows gebruiken standaard `stable`; gebruik `full` alleen wanneer je
bewust de brede adviserende provider/media-matrix wilt. `run_release_soak`
bepaalt of stable/default-releasechecks de volledige live/E2E- en
Docker-releasepad-soak draaien; `full` forceert soak aan.

- `minimum` behoudt de snelste OpenAI/core releasekritieke lanes.
- `stable` voegt de stable provider/backend-set toe.
- `full` draait de brede adviserende provider/media-matrix.

De umbrella registreert de gedispatchte child-run-id's, en de laatste `Verify full validation`-job controleert de huidige child-run-conclusies opnieuw en voegt tabellen met langzaamste jobs toe voor elke child-run. Als een child workflow opnieuw wordt gedraaid en groen wordt, draai dan alleen de parent verifier-job opnieuw om het umbrella-resultaat en de timingsamenvatting te vernieuwen.

Voor herstel accepteren zowel `Full Release Validation` als `OpenClaw Release Checks` `rerun_group`. Gebruik `all` voor een release candidate, `ci` voor alleen de normale full-CI-child, `plugin-prerelease` voor alleen de plugin-prerelease-child, `release-checks` voor elke release-child, of een smallere groep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, of `npm-telegram` op de umbrella. Dit houdt het opnieuw draaien van een mislukte releasebox begrensd na een gerichte fix. Combineer voor één mislukte cross-OS-lane `rerun_group=cross-os` met `cross_os_suite_filter`, bijvoorbeeld `windows/packaged-upgrade`; lange cross-OS-commando's geven heartbeat-regels uit en packaged-upgrade-samenvattingen bevatten timings per fase. QA release-check-lanes zijn adviserend, dus QA-only fouten waarschuwen maar blokkeren de release-check-verifier niet.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde ref één keer te resolven naar een `release-package-under-test`-tarball, en geeft dat artifact vervolgens door aan cross-OS-checks en Package Acceptance, plus de live/E2E release-path Docker-workflow wanneer soakdekking draait. Zo blijven de package-bytes consistent over releaseboxen heen en wordt voorkomen dat dezelfde candidate opnieuw wordt gepackt in meerdere child-jobs.

Dubbele `Full Release Validation`-runs voor `ref=main` en `rerun_group=all`
vervangen de oudere umbrella. De parent-monitor annuleert elke child workflow die hij
al heeft gedispatcht wanneer de parent wordt geannuleerd, zodat nieuwere main-validatie
niet achter een verouderde release-check-run van twee uur blijft staan. Release-branch/tag-
validatie en gerichte rerun-groepen houden `cancel-in-progress: false`.

## Live- en E2E-shards

De release live/E2E-child behoudt brede native `pnpm test:live`-dekking, maar draait die als benoemde shards via `scripts/test-live-shard.mjs` in plaats van één seriële job:

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
- opgesplitste media-audio/video-shards en provider-gefilterde music-shards

Dat behoudt dezelfde bestandsdekking en maakt trage live provider-fouten makkelijker opnieuw te draaien en te diagnosticeren. De geaggregeerde shardnamen `native-live-extensions-o-z`, `native-live-extensions-media` en `native-live-extensions-media-music` blijven geldig voor handmatige eenmalige reruns.

De native live media-shards draaien in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de `Live Media Runner Image`-workflow. Die image installeert vooraf `ffmpeg` en `ffprobe`; mediajobs verifiëren alleen de binaries vóór setup. Houd Docker-backed live-suites op normale Blacksmith-runners — containerjobs zijn de verkeerde plek om geneste Docker-tests te starten.

Docker-backed live model/backend-shards gebruiken een aparte gedeelde `ghcr.io/openclaw/openclaw-live-test:<sha>`-image per geselecteerde commit. De live-releaseworkflow bouwt en pusht die image één keer, waarna de Docker live model-, provider-sharded Gateway-, CLI backend-, ACP bind- en Codex harness-shards met `OPENCLAW_SKIP_DOCKER_BUILD=1` draaien. Gateway Docker-shards dragen expliciete script-level `timeout`-limieten onder de workflow-jobtimeout, zodat een vastgelopen container of cleanup-pad snel faalt in plaats van het hele release-check-budget te verbruiken. Als die shards het volledige source Docker-target onafhankelijk opnieuw bouwen, is de release-run verkeerd geconfigureerd en verspilt die wall clock aan dubbele image-builds.

## Package Acceptance

Gebruik `Package Acceptance` wanneer de vraag is: "werkt dit installeerbare OpenClaw-package als product?" Dit verschilt van normale CI: normale CI valideert de source tree, terwijl package acceptance één tarball valideert via dezelfde Docker E2E-harness die gebruikers na installatie of update gebruiken.

### Jobs

1. `resolve_package` checkt `workflow_ref` uit, resolvet één package-candidate, schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het `package-under-test`-artifact, en print de bron, workflow-ref, package-ref, versie, SHA-256 en profile in de GitHub-stapsamenvatting.
2. `docker_acceptance` roept `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt dat artifact, valideert de tarball-inventory, bereidt package-digest Docker-images voor wanneer nodig, en draait de geselecteerde Docker-lanes tegen dat package in plaats van de workflow-checkout te packen. Wanneer een profile meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het package en de gedeelde images één keer voor, en splitst die lanes vervolgens uit als parallelle gerichte Docker-jobs met unieke artifacts.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Het draait wanneer `telegram_mode` niet `none` is en installeert hetzelfde `package-under-test`-artifact wanneer Package Acceptance er één heeft geresolved; standalone Telegram-dispatch kan nog steeds een gepubliceerde npm-spec installeren.
4. `summary` laat de workflow falen als package-resolutie, Docker acceptance, of de optionele Telegram-lane is mislukt.

### Candidate-bronnen

- `source=npm` accepteert alleen `openclaw@beta`, `openclaw@latest`, of een exacte OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor gepubliceerde prerelease/stable-acceptatie.
- `source=ref` packt een vertrouwde `package_ref`-branch, tag of volledige commit-SHA. De resolver fetcht OpenClaw-branches/tags, verifieert dat de geselecteerde commit bereikbaar is vanuit de repository-branchgeschiedenis of een release-tag, installeert deps in een detached worktree, en packt die met `scripts/package-openclaw-for-docker.mjs`.
- `source=url` downloadt een HTTPS `.tgz`; `package_sha256` is verplicht.
- `source=artifact` downloadt één `.tgz` uit `artifact_run_id` en `artifact_name`; `package_sha256` is optioneel maar moet worden meegegeven voor extern gedeelde artifacts.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde workflow/harness-code die de test draait. `package_ref` is de source-commit die wordt gepackt wanneer `source=ref`. Hierdoor kan de huidige testharness oudere vertrouwde source-commits valideren zonder oude workflowlogica te draaien.

### Suite-profielen

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — volledige Docker release-path-chunks met OpenWebUI
- `custom` — exacte `docker_lanes`; verplicht wanneer `suite_profile=custom`

Het `package`-profile gebruikt offline plugin-dekking, zodat gepubliceerde-package-validatie niet afhankelijk is van live ClawHub-beschikbaarheid. De optionele Telegram-lane hergebruikt het `package-under-test`-artifact in `NPM Telegram Beta E2E`, waarbij het gepubliceerde npm-spec-pad behouden blijft voor standalone dispatches.

Zie [Updates en plugins testen](/nl/help/testing-updates-plugins) voor het dedicated update- en plugin-testbeleid, inclusief lokale commando's,
Docker-lanes, Package Acceptance-inputs, release-standaarden en foutentriage.

Releasecontroles roepen Packageacceptatie aan met `source=artifact`, het voorbereide releasepakketartefact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` en `telegram_mode=mock-openai`. Dit houdt pakketmigratie, update, live ClawHub-skillinstallatie, opschoning van verouderde Plugin-afhankelijkheden, herstel van geconfigureerde Plugin-installatie, offline Plugin, Plugin-update en Telegram-bewijs op dezelfde opgeloste pakkettarball. Stel `release_package_spec` in bij Volledige Releasevalidatie of OpenClaw Releasecontroles na het publiceren van een bèta om dezelfde matrix tegen het geleverde npm-pakket uit te voeren zonder opnieuw te bouwen; stel `package_acceptance_package_spec` alleen in wanneer Packageacceptatie een ander pakket nodig heeft dan de rest van de releasevalidatie. Releasecontroles over meerdere besturingssystemen blijven besturingssysteemspecifieke onboarding, installer- en platformgedrag dekken; productvalidatie voor pakket/update moet beginnen met Packageacceptatie. De Docker-lane `published-upgrade-survivor` valideert per run één gepubliceerde pakketbaseline in het blokkerende releasepad. In Packageacceptatie is de opgeloste tarball `package-under-test` altijd de kandidaat en selecteert `published_upgrade_survivor_baseline` de fallback-gepubliceerde baseline, standaard `openclaw@latest`; opdrachten voor het opnieuw uitvoeren van mislukte lanes behouden die baseline. Volledige Releasevalidatie met `run_release_soak=true` of `release_profile=full` stelt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` en `published_upgrade_survivor_scenarios=reported-issues` in om uit te breiden over de vier nieuwste stabiele npm-releases plus vastgepinde grensreleases voor Plugin-compatibiliteit en issue-vormige fixtures voor Feishu-configuratie, behouden bootstrap-/personabestanden, geconfigureerde OpenClaw Plugin-installaties, tilde-logpaden en verouderde legacy-roots voor Plugin-afhankelijkheden. Selecties voor multi-baseline published-upgrade survivor worden per baseline geshard naar afzonderlijke gerichte Docker-runnerjobs. De afzonderlijke workflow `Update Migration` gebruikt de Docker-lane `update-migration` met `all-since-2026.4.23` en `plugin-deps-cleanup` wanneer de vraag uitputtende opschoning van gepubliceerde updates is, niet de normale CI-breedte van Volledige Release. Lokale aggregatieruns kunnen exacte pakketspecificaties doorgeven met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, één lane behouden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` zoals `openclaw@2026.4.15`, of `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` instellen voor de scenariomatrix. De gepubliceerde lane configureert de baseline met een ingebakken opdrachtrecept `openclaw config set`, registreert receptstappen in `summary.json` en controleert `/healthz`, `/readyz` plus RPC-status na het starten van Gateway. De verse lanes voor Windows-pakketten en installers verifiëren ook dat een geïnstalleerd pakket een browser-control-override uit een ruw absoluut Windows-pad kan importeren. De OpenAI-agent-turn-smoke over meerdere besturingssystemen gebruikt standaard `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer dit is ingesteld, anders `openai/gpt-5.4`, zodat het installatie- en Gateway-bewijs op een GPT-5-testmodel blijft en GPT-4.x-standaarden worden vermeden.

### Legacy-compatibiliteitsvensters

Packageacceptatie heeft begrensde legacy-compatibiliteitsvensters voor al gepubliceerde pakketten. Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen het compatibiliteitspad gebruiken:

- bekende private QA-vermeldingen in `dist/postinstall-inventory.json` mogen verwijzen naar bestanden die uit de tarball zijn weggelaten;
- `doctor-switch` mag de subcase voor persistentie van `gateway install --wrapper` overslaan wanneer het pakket die flag niet beschikbaar stelt;
- `update-channel-switch` mag ontbrekende pnpm `patchedDependencies` uit de van de tarball afgeleide nep-git-fixture snoeien en mag ontbrekende gepersisteerde `update.channel` loggen;
- Plugin-smokes mogen legacy-locaties voor installatierecords lezen of ontbrekende persistentie van marketplace-installatierecords accepteren;
- `plugin-update` mag migratie van configuratiemetadata toestaan terwijl nog steeds vereist is dat het installatierecord en het geen-herinstallatiegedrag ongewijzigd blijven.

Het gepubliceerde pakket `2026.4.26` mag ook waarschuwen voor lokale buildmetadatastempelbestanden die al waren geleverd. Latere pakketten moeten aan de moderne contracten voldoen; dezelfde omstandigheden falen dan in plaats van waarschuwen of overslaan.

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

Begin bij het debuggen van een mislukte packageacceptatierun met de samenvatting `resolve_package` om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de onderliggende run `docker_acceptance` en de bijbehorende Docker-artefacten: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logs, fasetimings en opdrachten om opnieuw uit te voeren. Voer bij voorkeur het mislukte pakketprofiel of de exacte Docker-lanes opnieuw uit in plaats van volledige releasevalidatie opnieuw uit te voeren.

## Installatiesmoke

De afzonderlijke workflow `Install Smoke` hergebruikt hetzelfde scope-script via zijn eigen job `preflight`. Deze splitst smoke-dekking in `run_fast_install_smoke` en `run_full_install_smoke`.

- **Snel pad** draait voor pull requests die Docker-/pakketoppervlakken, wijzigingen in gebundelde Plugin-pakketten/-manifesten of core Plugin-/kanaal-/Gateway-/Plugin SDK-oppervlakken raken die de Docker-smokejobs oefenen. Broncode-only wijzigingen in gebundelde Plugins, test-only bewerkingen en docs-only bewerkingen reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image één keer, controleert de CLI, voert de CLI-smoke voor agents delete shared-workspace uit, voert de container gateway-network e2e uit, verifieert een build-arg voor gebundelde Plugin en voert het begrensde Docker-profiel voor gebundelde Plugins uit onder een geaggregeerde opdrachttime-out van 240 seconden (waarbij elke Docker-run van elk scenario afzonderlijk is begrensd).
- **Volledig pad** behoudt QR-pakketinstallatie en Docker-/updatedekking voor installers voor nachtelijke geplande runs, handmatige dispatches, workflow-call-releasecontroles en pull requests die echt installer-/pakket-/Docker-oppervlakken raken. In volledige modus bereidt install-smoke één GHCR-root-Dockerfile-smoke-image voor de doel-SHA voor of hergebruikt deze, en voert daarna QR-pakketinstallatie, root-Dockerfile-/Gateway-smokes, installer-/update-smokes en de snelle Docker-E2E voor gebundelde Plugins uit als afzonderlijke jobs, zodat installerwerk niet hoeft te wachten achter de root-image-smokes.

`main`-pushes (inclusief mergecommits) forceren het volledige pad niet; wanneer gewijzigde-scope-logica volledige dekking op een push zou aanvragen, behoudt de workflow de snelle Docker-smoke en laat de volledige installatiesmoke over aan nachtelijke of releasevalidatie.

De trage Bun global install image-provider-smoke wordt afzonderlijk afgeschermd door `run_bun_global_install_smoke`. Deze draait volgens het nachtelijke schema en vanuit de workflow voor releasecontroles, en handmatige `Install Smoke`-dispatches kunnen ervoor kiezen deze mee te nemen, maar pull requests en `main`-pushes niet. QR- en installer-Docker-tests behouden hun eigen installatiegerichte Dockerfiles.

## Lokale Docker-E2E

`pnpm test:docker:all` bouwt vooraf één gedeelde live-testimage, verpakt OpenClaw één keer als npm-tarball en bouwt twee gedeelde images van `scripts/e2e/Dockerfile`:

- een kale Node/Git-runner voor installer-/update-/Plugin-afhankelijkheidslanes;
- een functionele image die dezelfde tarball in `/app` installeert voor normale functionaliteitslanes.

Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en voert daarna lanes uit met `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Afstembare instellingen

| Variabele                              | Standaard | Doel                                                                                          |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Slot-aantal van de hoofdpool voor normale lanes.                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Slot-aantal van de providersensitieve staartpool.                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limiet voor gelijktijdige live-lanes zodat providers niet throttlen.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limiet voor gelijktijdige npm-installatielanes.                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limiet voor gelijktijdige multi-service-lanes.                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Spreiding tussen lane-starts om Docker daemon create storms te vermijden; stel `0` in voor geen spreiding. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Fallback-time-out per lane (120 minuten); geselecteerde live-/staartlanes gebruiken strakkere limieten. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset     | `1` print het schedulerplan zonder lanes uit te voeren.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset     | Kommagescheiden exacte lanelijst; slaat cleanup-smoke over zodat agents één mislukte lane kunnen reproduceren. |

Een lane die zwaarder is dan de effectieve limiet kan nog steeds vanuit een lege pool starten en draait dan alleen totdat capaciteit wordt vrijgegeven. De lokale aggregate voert preflightchecks voor Docker uit, verwijdert verouderde OpenClaw E2E-containers, geeft actieve-lane-status weer, bewaart lanetimings voor longest-first-sortering en stopt standaard met het plannen van nieuwe gepoolde lanes na de eerste fout.

### Herbruikbare live-/E2E-workflow

De herbruikbare live-/E2E-workflow vraagt `scripts/test-docker-all.mjs --plan-json` welk pakket, imagetype, live-image, lane en credentialdekking vereist zijn. `scripts/docker-e2e.mjs` zet dat plan daarna om in GitHub-outputs en samenvattingen. Het verpakt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een pakketartefact van de huidige run of downloadt een pakketartefact uit `package_artifact_run_id`; valideert de tarball-inventaris; bouwt en pusht package-digest-getagde kale/functionele GHCR Docker-E2E-images via Blacksmith's Docker layer cache wanneer het plan lanes met geïnstalleerde pakketten nodig heeft; en hergebruikt opgegeven inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` of bestaande package-digest-images in plaats van opnieuw te bouwen. Docker-imagepulls worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry-/cachestream snel opnieuw probeert in plaats van het grootste deel van het kritieke CI-pad te verbruiken.

### Releasepad-chunks

Release-Docker-dekking draait kleinere gechunkte jobs met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elke chunk alleen het imagetype pullt dat nodig is en meerdere lanes via dezelfde gewogen scheduler uitvoert:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Huidige Docker-chunks voor releases zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` en `plugins-runtime-install-a` tot en met `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` en `plugins-integrations` blijven geaggregeerde aliassen voor plugins/runtime. De lane-alias `install-e2e` blijft de geaggregeerde alias voor handmatig opnieuw uitvoeren voor beide provider-installatielanes.

OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige dekking van het releasepad daarom vraagt, en behoudt alleen een zelfstandige chunk `openwebui` voor dispatches die uitsluitend OpenWebUI betreffen. Update-lanes voor gebundelde kanalen proberen eenmaal opnieuw bij tijdelijke npm-netwerkfouten.

Elke chunk uploadt `.artifacts/docker-tests/` met lane-logs, timings, `summary.json`, `failures.json`, fasetimings, JSON voor schedulerplannen, tabellen met trage lanes en opdrachten per lane om opnieuw uit te voeren. De workflow-invoer `docker_lanes` voert geselecteerde lanes uit tegen de voorbereide images in plaats van de chunk-jobs, waardoor debuggen van mislukte lanes beperkt blijft tot één gerichte Docker-job en het package-artifact voor die run wordt voorbereid, gedownload of hergebruikt; als een geselecteerde lane een live Docker-lane is, bouwt de gerichte job de live-testimage lokaal voor die heruitvoering. Gegenereerde GitHub-opdrachten per lane om opnieuw uit te voeren bevatten `package_artifact_run_id`, `package_artifact_name` en invoer voor voorbereide images wanneer die waarden bestaan, zodat een mislukte lane exact hetzelfde package en dezelfde images uit de mislukte run kan hergebruiken.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

De geplande live/E2E-workflow voert dagelijks de volledige Docker-suite voor het releasepad uit.

## Plugin-prerelease

`Plugin Prerelease` is duurdere product-/packagedekking, dus het is een afzonderlijke workflow die wordt gestart door `Full Release Validation` of door een expliciete operator. Normale pull requests, pushes naar `main` en zelfstandige handmatige CI-dispatches houden die suite uitgeschakeld. De workflow verdeelt gebundelde plugintests over acht extensieworkers; die extensieshard-jobs draaien maximaal twee pluginconfiguratiegroepen tegelijk met één Vitest-worker per groep en een grotere Node-heap, zodat pluginbatches met veel imports geen extra CI-jobs aanmaken. Het Docker-prereleasepad dat alleen voor releases geldt, batcht gerichte Docker-lanes in kleine groepen om te voorkomen dat tientallen runners worden gereserveerd voor jobs van één tot drie minuten. De workflow uploadt ook een informatief artifact `plugin-inspector-advisory` vanuit `@openclaw/plugin-inspector`; inspectorbevindingen zijn input voor triage en veranderen de blokkerende Plugin Prerelease-gate niet.

## QA Lab

QA Lab heeft specifieke CI-lanes buiten de belangrijkste slim gescopete workflow. Agentische pariteit is genest onder de brede QA- en releaseharnassen, niet als zelfstandige PR-workflow. Gebruik `Full Release Validation` met `rerun_group=qa-parity` wanneer pariteit moet meeliften met een brede validatierun.

- De workflow `QA-Lab - All Lanes` draait elke nacht op `main` en bij handmatige dispatch; hij splitst de mock-parity-lane, live Matrix-lane en live Telegram- en Discord-lanes uit als parallelle jobs. Live jobs gebruiken de omgeving `qa-live-shared`, en Telegram/Discord gebruiken Convex-leases.

Releasecontroles draaien live Matrix- en Telegram-transportlanes met de deterministische mockprovider en mock-gekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het kanaalcontract geïsoleerd is van live modellatentie en normale opstart van providerplugins. De live transportgateway schakelt geheugenzoekopdrachten uit omdat QA-pariteit geheugengedrag afzonderlijk dekt; providerconnectiviteit wordt gedekt door de afzonderlijke suites voor live modellen, native providers en Docker-providers.

Matrix gebruikt `--profile fast` voor geplande en release-gates, met `--fail-fast` alleen wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaard en handmatige workflow-invoer blijven `all`; handmatige dispatch met `matrix_profile=all` shardt volledige Matrix-dekking altijd in jobs voor `transport`, `media`, `e2ee-smoke`, `e2ee-deep` en `e2ee-cli`.

`OpenClaw Release Checks` draait ook de releasekritieke QA Lab-lanes vóór releasegoedkeuring; de QA-parity-gate draait de kandidaat- en baselinepakketten als parallelle lane-jobs, en downloadt daarna beide artifacts naar een kleine rapportjob voor de uiteindelijke pariteitsvergelijking.

Voor normale PR's volg je gescopete CI-/checkbewijzen in plaats van pariteit als vereiste status te behandelen.

## CodeQL

De workflow `CodeQL` is bewust een smalle beveiligingsscanner voor een eerste controle, niet de volledige repository-sweep. Dagelijkse, handmatige en niet-draft pull request guard-runs scannen Actions-workflowcode plus de JavaScript/TypeScript-oppervlakken met het hoogste risico, met beveiligingsqueries met hoge betrouwbaarheid gefilterd op hoge/kritieke `security-severity`.

De pull request guard blijft licht: hij start alleen bij wijzigingen onder `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` of `src`, en draait dezelfde beveiligingsmatrix met hoge betrouwbaarheid als de geplande workflow. Android en macOS CodeQL blijven buiten de PR-standaarden.

### Beveiligingscategorieën

| Categorie                                         | Oppervlak                                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron en gateway-baseline                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Kerncontracten voor kanaalimplementatie plus de runtime voor kanaalplugins, gateway, Plugin SDK, secrets, auditaanraakpunten        |
| `/codeql-security-high/network-ssrf-boundary`     | Kernoppervlakken voor SSRF, IP-parsing, netwerkguard, web-fetch en SSRF-beleid van de Plugin SDK                                    |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-servers, procesuitvoeringshelpers, uitgaande levering en gates voor uitvoering van agenttools                                   |
| `/codeql-security-high/plugin-trust-boundary`     | Vertrouwensoppervlakken voor plugininstallatie, loader, manifest, registry, package-manager-installatie, source-loading en Plugin SDK-packagecontract |

### Platformspecifieke beveiligingsshards

- `CodeQL Android Critical Security` — geplande Android-beveiligingsshard. Bouwt de Android-app handmatig voor CodeQL op de kleinste Blacksmith Linux-runner die door workflowsanity wordt geaccepteerd. Uploadt onder `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — wekelijkse/handmatige macOS-beveiligingsshard. Bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert buildresultaten van dependencies uit de geüploade SARIF en uploadt onder `/codeql-critical-security/macos`. Buiten de dagelijkse standaarden gehouden omdat de macOS-build de runtime domineert, zelfs wanneer die schoon is.

### Kritieke kwaliteitscategorieën

`CodeQL Critical Quality` is de bijbehorende niet-beveiligingsshard. Deze draait alleen foutseverity, niet-beveiligingsgerichte JavaScript/TypeScript-kwaliteitsqueries over smalle, waardevolle oppervlakken op de kleinere Blacksmith Linux-runner. De pull request guard is bewust kleiner dan het geplande profiel: niet-draft PR's draaien alleen de bijbehorende shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` en `plugin-sdk-reply-runtime` voor wijzigingen in agentopdracht-/model-/tooluitvoering en reply-dispatchcode, configschema-/migratie-/IO-code, auth-/secrets-/sandbox-/security-code, kernkanaal en runtime voor gebundelde kanaalplugins, gatewayprotocol/servermethoden, geheugenruntime/SDK-glue, MCP/proces/uitgaande levering, providerruntime/modelcatalogus, sessiediagnostiek/leveringsqueues, pluginloader, Plugin SDK/packagecontract of replyruntime van de Plugin SDK. Wijzigingen in CodeQL-configuratie en kwaliteitsworkflow draaien alle twaalf PR-kwaliteitsshards.

Handmatige dispatch accepteert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

De smalle profielen zijn onderwijs-/iteratiehooks om één kwaliteitsshard geïsoleerd te draaien.

| Categorie                                               | Raakvlak                                                                                                                                                              |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Authenticatie, geheimen, sandbox, Cron en Gateway-beveiligingsgrenscode                                                                                               |
| `/codeql-critical-quality/config-boundary`              | Configuratieschema, migratie, normalisatie en IO-contracten                                                                                                           |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-protocolschema's en servermethodecontracten                                                                                                                   |
| `/codeql-critical-quality/channel-runtime-boundary`     | Core-kanaal- en gebundelde kanaal-Plugin-implementatiecontracten                                                                                                      |
| `/codeql-critical-quality/agent-runtime-boundary`       | Opdrachtuitvoering, model/provider-dispatch, auto-reply-dispatch en wachtrijen, en ACP-control-plane-runtimecontracten                                                |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-servers en tool bridges, processupervisiehelpers en contracten voor uitgaande levering                                                                            |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory-host-SDK, memory-runtimefacades, memory-Plugin-SDK-aliassen, glue voor memory-runtimeactivatie en memory-doctor-opdrachten                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interne reply queue-onderdelen, session delivery queues, helpers voor uitgaande sessiebinding/-levering, diagnostische event-/logbundelraakvlakken en session doctor CLI-contracten |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK-dispatch voor inkomende replies, helpers voor reply-payloads/chunking/runtime, channel reply-opties, delivery queues en helpers voor session/thread-binding |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisatie van modelcatalogi, provider-authenticatie en -discovery, provider-runtime-registratie, provider-standaarden/catalogi en web/search/fetch/embedding-registries |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap van de besturings-UI, lokale persistentie, Gateway-control flows en task-control-plane-runtimecontracten                                                     |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core-web-fetch/search, media-IO, mediabegrip, image-generation en media-generation-runtimecontracten                                                                   |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, registry-, public-surface- en Plugin SDK-entrypoint-contracten                                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Gepubliceerde package-side Plugin SDK-broncode en contracthelpers voor pluginpakketten                                                                                |

Kwaliteit blijft gescheiden van beveiliging, zodat kwaliteitsbevindingen kunnen worden ingepland, gemeten, uitgeschakeld of uitgebreid zonder het beveiligingssignaal te vertroebelen. Swift-, Python- en gebundelde-Plugin-CodeQL-uitbreiding moeten alleen als afgebakend of geshard vervolgwerk worden toegevoegd nadat de smalle profielen stabiele runtime en stabiel signaal hebben.

## Onderhoudsworkflows

### Docs-agent

De `Docs Agent`-workflow is een eventgedreven Codex-onderhoudslane om bestaande documentatie afgestemd te houden op recent gelande wijzigingen. De workflow heeft geen puur schema: een geslaagde niet-bot push-CI-run op `main` kan hem triggeren, en manual dispatch kan hem direct uitvoeren. Workflow-run-aanroepen slaan over wanneer `main` inmiddels is opgeschoven of wanneer er in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is aangemaakt. Wanneer hij draait, beoordeelt hij de commitreeks van de vorige niet-overgeslagen Docs Agent-bron-SHA tot de huidige `main`, zodat een enkele uurlijkse run alle main-wijzigingen kan dekken die sinds de laatste documentatiepassage zijn verzameld.

### Testprestatie-agent

De `Test Performance Agent`-workflow is een eventgedreven Codex-onderhoudslane voor trage tests. De workflow heeft geen puur schema: een geslaagde niet-bot push-CI-run op `main` kan hem triggeren, maar hij slaat over als er die UTC-dag al een andere workflow-run-aanroep is uitgevoerd of actief is. Manual dispatch omzeilt die dagelijkse activiteitspoort. De lane bouwt een gegroepeerd Vitest-prestatierapport voor de volledige suite, laat Codex alleen kleine testprestatieverbeteringen maken die coverage behouden in plaats van brede refactors, voert daarna het volledige-suite-rapport opnieuw uit en verwerpt wijzigingen die het aantal geslaagde baseline-tests verminderen. Als de baseline falende tests heeft, mag Codex alleen duidelijke fouten oplossen en moet het volledige-suite-rapport na de agent slagen voordat er iets wordt gecommit. Wanneer `main` vooruitgaat voordat de bot-push landt, rebaset de lane de gevalideerde patch, voert `pnpm check:changed` opnieuw uit en probeert de push opnieuw; conflicterende stale patches worden overgeslagen. De workflow gebruikt GitHub-hosted Ubuntu zodat de Codex-actie dezelfde drop-sudo-veiligheidshouding kan aanhouden als de docs-agent.

### Dubbele PR's na merge

De `Duplicate PRs After Merge`-workflow is een handmatige maintainer-workflow voor het opschonen van duplicaten na landing. Standaard is dit een dry-run en worden alleen expliciet opgegeven PR's gesloten wanneer `apply=true`. Voordat GitHub wordt gemuteerd, verifieert hij dat de gelande PR is gemerged en dat elke duplicaat-PR ofwel een gedeeld gerefereerd issue heeft, of overlappende gewijzigde hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale check gates en changed-routing

Lokale changed-lane-logica leeft in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale check gate is strenger over architectuurgrenzen dan de brede CI-platformscope:

- core-productiewijzigingen voeren core prod en core test typecheck plus core lint/guards uit;
- core-test-only-wijzigingen voeren alleen core test typecheck plus core lint uit;
- extension-productiewijzigingen voeren extension prod en extension test typecheck plus extension lint uit;
- extension-test-only-wijzigingen voeren extension test typecheck plus extension lint uit;
- public Plugin SDK- of plugin-contractwijzigingen breiden uit naar extension typecheck omdat extensies afhankelijk zijn van die core-contracten (Vitest extension-sweeps blijven expliciet testwerk);
- release metadata-only versiebumpen voeren gerichte version/config/root-dependency-checks uit;
- onbekende root/config-wijzigingen falen veilig naar alle check-lanes.

Lokale changed-test-routing leeft in `scripts/test-projects.test-support.mjs` en is bewust goedkoper dan `check:changed`: directe testbewerkingen voeren zichzelf uit, bronbewerkingen geven de voorkeur aan expliciete mappings, daarna sibling-tests en import-graph-afhankelijken. Gedeelde group-room delivery-configuratie is een van de expliciete mappings: wijzigingen aan de group visible-reply-configuratie, source reply delivery mode of de message-tool system prompt lopen via de core reply-tests plus Discord- en Slack-delivery-regressies, zodat een gedeelde standaardwijziging faalt voor de eerste PR-push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging zo harness-breed is dat de goedkope gemapte set geen betrouwbare proxy is.

## Testbox-validatie

Crabbox is de repo-owned remote-box-wrapper voor maintainer-Linux-bewijs. Gebruik hem
vanuit de repo-root wanneer een check te breed is voor een lokale bewerkingslus, wanneer CI-
pariteit belangrijk is, of wanneer het bewijs secrets, Docker, package-lanes,
herbruikbare boxes of remote logs nodig heeft. De normale OpenClaw-backend is
`blacksmith-testbox`; owned AWS/Hetzner-capaciteit is een fallback voor Blacksmith-
storingen, quotaproblemen of expliciete owned-capacity-tests.

Crabbox-backed Blacksmith-runs warmen one-shot Testboxes op, claimen, synchroniseren, voeren uit, rapporteren en ruimen op.
De ingebouwde sync-sanitycheck faalt snel wanneer vereiste
rootbestanden zoals `pnpm-lock.yaml` verdwijnen of wanneer `git status --short`
minstens 200 tracked deletions toont. Stel voor opzettelijke PR's met veel verwijderingen
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor de remote-opdracht.

Crabbox beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de
sync-fase blijft zonder post-sync-output. Stel
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` in om die guard uit te schakelen, of gebruik een grotere
millisecondewaarde voor ongewoon grote lokale diffs.

Controleer voor een eerste run de wrapper vanuit de repo-root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

De repo-wrapper weigert een stale Crabbox-binary die `blacksmith-testbox` niet adverteert. Geef de provider expliciet door, ook al heeft `.crabbox.yaml` owned-cloud-standaarden.

Changed gate:

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

Gerichte test-heruitvoering:

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

Lees de uiteindelijke JSON-samenvatting. De nuttige velden zijn `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` en `totalMs`. One-shot Blacksmith-backed Crabbox-runs moeten de Testbox automatisch stoppen; als een run wordt onderbroken of opruimen onduidelijk is, inspecteer dan live boxes en stop alleen de boxes die je hebt aangemaakt:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Gebruik hergebruik alleen wanneer je bewust meerdere opdrachten op dezelfde gehydrateerde box nodig hebt:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Als Crabbox de kapotte laag is maar Blacksmith zelf werkt, gebruik direct
Blacksmith dan alleen voor diagnostiek zoals `list`, `status` en cleanup. Repareer het
Crabbox-pad voordat je een directe Blacksmith-run als maintainer-bewijs behandelt.

Als `blacksmith testbox list --all` en `blacksmith testbox status` werken maar nieuwe
warmups na een paar minuten `queued` blijven zonder IP of Actions-run-URL,
behandel dit dan als druk op de Blacksmith-provider, queue, billing of org-limieten. Stop de
queued ids die je hebt aangemaakt, start geen extra Testboxes en verplaats het bewijs naar het
owned Crabbox-capaciteitspad hieronder terwijl iemand het Blacksmith-dashboard,
billing en org-limieten controleert.

Escaleren naar owned Crabbox-capaciteit alleen wanneer Blacksmith down is, quotabeperkt is, de benodigde omgeving mist, of owned capacity expliciet het doel is:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Bij AWS-druk vermijd je `class=beast`, tenzij de taak echt CPU van 48xlarge-klasse nodig heeft. Een `beast`-aanvraag begint bij 192 vCPU's en is de makkelijkste manier om regionale EC2 Spot- of On-Demand Standard-quota te overschrijden. De repo-eigen `.crabbox.yaml` staat standaard op `standard`, meerdere capaciteitsregio's en `capacity.hints: true`, zodat bemiddelde AWS-leases de geselecteerde regio/markt, quotadruk, Spot-fallback en waarschuwingen voor klassen met hoge druk afdrukken. Gebruik `fast` voor zwaardere brede controles, `large` alleen nadat standard/fast niet genoeg zijn, en `beast` alleen voor uitzonderlijke CPU-gebonden lanes zoals full-suite- of Docker-matrices voor alle Plugins, expliciete release-/blocker-validatie of performanceprofiling met veel cores. Gebruik `beast` niet voor `pnpm check:changed`, gerichte tests, werk dat alleen docs raakt, gewone lint/typecheck, kleine E2E-repro's of triage van Blacksmith-storingen. Gebruik `--market on-demand` voor capaciteitsdiagnose, zodat Spot-marktschommelingen niet in het signaal worden meegenomen.

`.crabbox.yaml` beheert provider-, sync- en GitHub Actions-hydratiedefaults voor owned-cloud-lanes. Het sluit lokale `.git` uit, zodat de gehydrateerde Actions-checkout zijn eigen externe Git-metadata behoudt in plaats van maintainer-lokale remotes en object stores te synchroniseren, en het sluit lokale runtime-/buildartefacten uit die nooit mogen worden overgedragen. `.github/workflows/crabbox-hydrate.yml` beheert checkout, Node/pnpm-setup, het ophalen van `origin/main` en de niet-geheime omgevingsoverdracht voor owned-cloud-opdrachten met `crabbox run --id <cbx_id>`.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Ontwikkelingskanalen](/nl/install/development-channels)
