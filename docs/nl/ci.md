---
read_when:
    - Je moet begrijpen waarom een CI-job wel of niet is uitgevoerd
    - Je debugt een falende GitHub Actions-controle
    - Je coördineert een releasevalidatierun of een herhaling daarvan
    - Je wijzigt ClawSweeper-dispatch of het doorsturen van GitHub-activiteit
summary: CI-taakgrafiek, scope-gates, release-overkoepelingen en lokale opdrachtequivalenten
title: CI-pipeline
x-i18n:
    generated_at: "2026-05-06T09:05:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 189f717fac369d6374102612308c73705f19eca9baca81b24f052dbd5357e15f
    source_path: ci.md
    workflow: 16
---

OpenClaw CI draait bij elke push naar `main` en bij elke pull-aanvraag. De `preflight`-job classificeert de diff en schakelt dure lanes uit wanneer alleen niet-gerelateerde gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen bewust slimme scoping en spreiden de volledige graaf uit voor releasekandidaten en brede validatie. Android-lanes blijven opt-in via `include_android`. Plugin-dekking alleen voor releases staat in de aparte workflow [`Plugin-prerelease`](#plugin-prerelease) en draait alleen vanuit [`Volledige releasevalidatie`](#full-release-validation) of een expliciete handmatige dispatch.

## Pipeline-overzicht

| Job                              | Doel                                                                                                      | Wanneer deze draait                         |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `preflight`                      | Detecteert wijzigingen alleen in docs, gewijzigde scopes, gewijzigde extensies, en bouwt het CI-manifest  | Altijd bij niet-concept-pushes en PR's      |
| `security-scm-fast`              | Detectie van privésleutels en workflow-audit via `zizmor`                                                 | Altijd bij niet-concept-pushes en PR's      |
| `security-dependency-audit`      | Productie-lockfile-audit zonder dependencies tegen npm-advisories                                         | Altijd bij niet-concept-pushes en PR's      |
| `security-fast`                  | Vereiste aggregatie voor de snelle beveiligingsjobs                                                       | Altijd bij niet-concept-pushes en PR's      |
| `check-dependencies`             | Productie-Knip-pass alleen voor dependencies plus de allowlist-guard voor ongebruikte bestanden           | Node-relevante wijzigingen                  |
| `build-artifacts`                | Bouwt `dist/`, Control UI, controles voor gebouwde artefacten, en herbruikbare downstream-artefacten      | Node-relevante wijzigingen                  |
| `checks-fast-core`               | Snelle Linux-correctheidslanes zoals bundled-/Plugin-contract-/protocolcontroles                          | Node-relevante wijzigingen                  |
| `checks-fast-contracts-channels` | Gespreide kanaalcontractcontroles met een stabiel geaggregeerd controleresultaat                          | Node-relevante wijzigingen                  |
| `checks-node-core-test`          | Core Node-testshards, exclusief kanaal-, bundled-, contract- en extensielanes                             | Node-relevante wijzigingen                  |
| `check`                          | Gespreide equivalente hoofd lokale gate: productietypen, lint, guards, testtypen en strikte smoke         | Node-relevante wijzigingen                  |
| `check-additional`               | Architectuur, gespreide boundary-/promptdrift, extensieguards, pakketboundary en Gateway-watch            | Node-relevante wijzigingen                  |
| `build-smoke`                    | Smoke-tests voor gebouwde CLI en smoke voor opstartgeheugen                                               | Node-relevante wijzigingen                  |
| `checks`                         | Verifier voor kanaaltests van gebouwde artefacten                                                         | Node-relevante wijzigingen                  |
| `checks-node-compat-node22`      | Node 22-compatibiliteitsbuild en smoke-lane                                                               | Handmatige CI-dispatch voor releases        |
| `check-docs`                     | Docs-formattering, lint en controles op defecte links                                                     | Docs gewijzigd                              |
| `skills-python`                  | Ruff + pytest voor Python-ondersteunde Skills                                                             | Python-Skills-relevante wijzigingen         |
| `checks-windows`                 | Windows-specifieke proces-/padtests plus gedeelde regressies voor runtime-importspecifier                 | Windows-relevante wijzigingen               |
| `macos-node`                     | macOS TypeScript-testlane met de gedeelde gebouwde artefacten                                             | macOS-relevante wijzigingen                 |
| `macos-swift`                    | Swift-lint, build en tests voor de macOS-app                                                              | macOS-relevante wijzigingen                 |
| `android`                        | Android-unittests voor beide flavors plus één debug-APK-build                                             | Android-relevante wijzigingen               |
| `test-performance-agent`         | Dagelijkse Codex-optimalisatie van trage tests na vertrouwde activiteit                                   | Succes van hoofd-CI of handmatige dispatch  |
| `openclaw-performance`           | Dagelijkse/op aanvraag Kova-runtimeprestatierapporten met mock-provider, deep-profile en GPT 5.4 live-lanes | Geplande en handmatige dispatch           |

## Fail-fast-volgorde

1. `preflight` bepaalt welke lanes überhaupt bestaan. De logica voor `docs-scope` en `changed-scope` zijn stappen binnen deze job, geen zelfstandige jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` en `skills-python` falen snel zonder te wachten op de zwaardere artefact- en platformmatrixjobs.
3. `build-artifacts` overlapt met de snelle Linux-lanes zodat downstream-consumenten kunnen starten zodra de gedeelde build klaar is.
4. Zwaardere platform- en runtimelanes waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` en `android`.

GitHub kan vervangen jobs als `cancelled` markeren wanneer een nieuwere push op dezelfde PR- of `main`-ref landt. Behandel dat als CI-ruis tenzij de nieuwste run voor dezelfde ref ook faalt. Geaggregeerde shardcontroles gebruiken `!cancelled() && always()` zodat ze nog steeds normale shardfouten rapporteren, maar niet in de wachtrij komen nadat de hele workflow al is vervangen. De automatische CI-concurrency-sleutel is geversioneerd (`CI-v7-*`) zodat een GitHub-zombie aan de kant van GitHub in een oude wachtrijgroep nieuwere main-runs niet oneindig kan blokkeren. Handmatige runs van de volledige suite gebruiken `CI-manual-v1-*` en annuleren geen lopende runs.

## Scope en routing

Scopelogica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unittests in `src/scripts/ci-changed-scope.test.ts`. Handmatige dispatch slaat changed-scope-detectie over en laat het preflight-manifest zich gedragen alsof elk scoped gebied is gewijzigd.

- **Bewerkingen aan CI-workflows** valideren de Node-CI-graaf plus workflow-linting, maar forceren op zichzelf geen native builds voor Windows, Android of macOS; die platformlanes blijven scoped op wijzigingen in platformsources.
- **Bewerkingen alleen aan CI-routing, geselecteerde goedkope fixturebewerkingen voor core-tests, en smalle bewerkingen aan helpers/testrouting voor Plugin-contracten** gebruiken een snel Node-only manifestpad: `preflight`, security, en één `checks-fast-core`-taak. Dat pad slaat buildartefacten, Node 22-compatibiliteit, kanaalcontracten, volledige core-shards, bundled-Plugin-shards en aanvullende guardmatrices over wanneer de wijziging beperkt blijft tot de routing- of helperoppervlakken die de snelle taak direct oefent.
- **Windows Node-controles** zijn scoped op Windows-specifieke proces-/padwrappers, npm/pnpm/UI-runnerhelpers, pakketbeheerconfiguratie, en de CI-workflowoppervlakken die die lane uitvoeren; niet-gerelateerde source-, Plugin-, install-smoke- en alleen-testwijzigingen blijven op de Linux Node-lanes.

De traagste Node-testfamilies zijn gesplitst of gebalanceerd zodat elke job klein blijft zonder runners te overreserveren: kanaalcontracten draaien als drie gewogen shards, snelle/ondersteunende core-unitlanes draaien apart, core-runtime-infra is gesplitst tussen state- en process/config-shards, auto-reply draait als gebalanceerde workers (waarbij de reply-subtree is gesplitst in agent-runner-, dispatch- en commands/state-routing-shards), en agentic gateway/server-configs zijn verdeeld over chat/auth/model/http-plugin/runtime/startup-lanes in plaats van te wachten op gebouwde artefacten. Brede browser-, QA-, media- en overige Plugintests gebruiken hun eigen Vitest-configs in plaats van de gedeelde Plugin-catch-all. Include-pattern-shards registreren timingitems met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een hele config kan onderscheiden van een gefilterde shard. `check-additional` houdt package-boundary compile-/canary-werk bij elkaar en scheidt runtime-topologiearchitectuur van Gateway-watch-dekking; de boundary-guardlijst is verdeeld over vier matrixshards, die elk geselecteerde onafhankelijke guards gelijktijdig uitvoeren en timings per controle afdrukken, inclusief `pnpm prompt:snapshots:check`, zodat promptdrift in het Codex-runtime-happy-path wordt vastgepind aan de PR die deze veroorzaakte. Gateway-watch, kanaaltests en de core support-boundary-shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd.

Android-CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play-debug-APK. De third-party flavor heeft geen aparte sourceset of manifest; de unittests-lane compileert de flavor nog steeds met de SMS-/call-log-BuildConfig-vlaggen, terwijl een dubbele debug-APK-packagingjob bij elke Android-relevante push wordt vermeden.

De `check-dependencies`-shard draait `pnpm deadcode:dependencies` (een productie-Knip-pass alleen voor dependencies, gepind op de nieuwste Knip-versie, met pnpm's minimum release age uitgeschakeld voor de `dlx`-installatie) en `pnpm deadcode:unused-files`, dat Knip's productiebevindingen voor ongebruikte bestanden vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. De guard voor ongebruikte bestanden faalt wanneer een PR een nieuw niet-gereviewd ongebruikt bestand toevoegt of een verouderd allowlist-item laat staan, terwijl bewuste dynamische Plugin-, gegenereerde, build-, live-test- en pakketbrugoppervlakken behouden blijven die Knip niet statisch kan oplossen.

## Doorsturen van ClawSweeper-activiteit

`.github/workflows/clawsweeper-dispatch.yml` is de brug aan de doelzijde van OpenClaw-repositoryactiviteit naar ClawSweeper. Deze checkt geen niet-vertrouwde pull-aanvraagcode uit en voert die niet uit. De workflow maakt een GitHub App-token aan vanuit `CLAWSWEEPER_APP_PRIVATE_KEY` en dispatcht vervolgens compacte `repository_dispatch`-payloads naar `openclaw/clawsweeper`.

De workflow heeft vier lanes:

- `clawsweeper_item` voor exacte reviewverzoeken voor issues en pull-aanvragen;
- `clawsweeper_comment` voor expliciete ClawSweeper-opdrachten in issue-opmerkingen;
- `clawsweeper_commit_review` voor reviewverzoeken op commitniveau bij `main`-pushes;
- `github_activity` voor algemene GitHub-activiteit die de ClawSweeper-agent kan inspecteren.

De `github_activity`-lane stuurt alleen genormaliseerde metadata door: eventtype, actie, actor, repository, itemnummer, URL, titel, status en korte fragmenten voor opmerkingen of reviews wanneer aanwezig. Deze vermijdt bewust het doorsturen van de volledige webhook-body. De ontvangende workflow in `openclaw/clawsweeper` is `.github/workflows/github-activity.yml`, die het genormaliseerde event naar de OpenClaw Gateway-hook voor de ClawSweeper-agent post.

Algemene activiteit is observatie, geen standaardlevering. De ClawSweeper-agent ontvangt het Discord-doel in zijn prompt en hoort alleen naar `#clawsweeper` te posten wanneer het event verrassend, actiegericht, riskant of operationeel nuttig is. Routinematige opens, bewerkingen, botruis, dubbele webhookruis en normaal reviewverkeer horen te resulteren in `NO_REPLY`.

Behandel GitHub-titels, opmerkingen, bodies, reviewtekst, branchnamen en commitberichten door dit hele pad heen als niet-vertrouwde data. Ze zijn invoer voor samenvatting en triage, geen instructies voor de workflow of agent-runtime.

## Handmatige dispatches

Handmatige CI-dispatches voeren dezelfde jobgrafiek uit als normale CI, maar zetten elke niet-Android-scoped lane geforceerd aan: Linux Node-shards, gebundelde-Plugin-shards, kanaalcontracten, Node 22-compatibiliteit, `check`, `check-additional`, build-smoke, docs-controles, Python Skills, Windows, macOS en Control UI i18n. Losstaande handmatige CI-dispatches voeren alleen Android uit met `include_android=true`; de volledige releaseparaplu schakelt Android in door `include_android=true` door te geven. Statische controles voor Plugin-prereleases, de release-only `agentic-plugins`-shard, de volledige extensiebatch-sweep en Docker-lanes voor Plugin-prereleases zijn uitgesloten van CI. De Docker-prereleasesuite draait alleen wanneer `Full Release Validation` de afzonderlijke `Plugin Prerelease`-workflow dispatcht met de releasevalidatie-gate ingeschakeld.

Handmatige runs gebruiken een unieke concurrency-groep, zodat een volledige suite voor een releasekandidaat niet wordt geannuleerd door een andere push- of PR-run op dezelfde ref. Met de optionele invoer `target_ref` kan een vertrouwde caller die grafiek uitvoeren tegen een branch, tag of volledige commit-SHA, terwijl het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, snelle beveiligingsjobs en aggregaties (`security-scm-fast`, `security-dependency-audit`, `security-fast`), snelle protocol-/contract-/gebundelde controles, gesharde kanaalcontractcontroles, `check`-shards behalve lint, `check-additional`-aggregaties, Node-testaggregatieverificateurs, docs-controles, Python Skills, workflow-sanity, labeler, auto-response; install-smoke-preflight gebruikt ook GitHub-gehoste Ubuntu zodat de Blacksmith-matrix eerder kan queueën |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lichtere extensieshards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` en `check-test-types`                                                                                                                                                                                                                                                                                                                |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node-testshards, gebundelde Plugin-testshards, `check-additional`-shards, `android`                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-gevoelig genoeg dat 8 vCPU meer kostte dan het bespaarde); install-smoke Docker-builds (32-vCPU-wachtrijtijd kostte meer dan die bespaarde)                                                                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                   |

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

## OpenClaw-prestaties

`OpenClaw Performance` is de product-/runtimeprestatie-workflow. Deze draait dagelijks op `main` en kan handmatig worden gedispatcht:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Handmatige dispatch benchmarkt normaal gesproken de workflow-ref. Stel `target_ref` in om een releasetag of een andere branch te benchmarken met de huidige workflowimplementatie. Gepubliceerde rapportpaden en latest-pointers zijn gesleuteld op de geteste ref, en elke `index.md` registreert de geteste ref/SHA, workflow-ref/SHA, Kova-ref, het profiel, de lane-authmodus, het model, het aantal herhalingen en scenariofilters.

De workflow installeert OCM vanuit een gepinde release en Kova vanuit `openclaw/Kova` op de gepinde invoer `kova_ref`, en voert daarna drie lanes uit:

- `mock-provider`: Kova-diagnostische scenario's tegen een local-build-runtime met deterministische neppe OpenAI-compatibele auth.
- `mock-deep-profile`: CPU-/heap-/traceprofilering voor hotspots bij startup, Gateway en agent-turn.
- `live-gpt54`: een echte OpenAI `openai/gpt-5.4`-agent-turn, overgeslagen wanneer `OPENAI_API_KEY` niet beschikbaar is.

De mock-provider-lane voert na de Kova-pass ook OpenClaw-native bronprobes uit: timing en geheugen van Gateway-opstart voor standaard-, hook- en 50-Plugin-startupgevallen; herhaalde mock-OpenAI `channel-chat-baseline`-hello-loops; en CLI-startupopdrachten tegen de opgestarte Gateway. De Markdown-samenvatting van de bronprobe staat op `source/index.md` in de rapportbundel, met ruwe JSON ernaast.

Elke lane uploadt GitHub-artifacts. Wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd, commit de workflow ook `report.json`, `report.md`, bundels, `index.md` en bronprobe-artifacts naar `openclaw/clawgrit-reports` onder `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. De huidige tested-ref-pointer wordt geschreven als `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Volledige releasevalidatie

`Full Release Validation` is de handmatige parapluworkflow voor "alles uitvoeren vóór release." Deze accepteert een branch, tag of volledige commit-SHA, dispatcht de handmatige `CI`-workflow met dat doel, dispatcht `Plugin Prerelease` voor release-only Plugin-/package-/statische-/Docker-bewijsvoering, en dispatcht `OpenClaw Release Checks` voor install-smoke, package acceptance, cross-OS-packagecontroles, QA Lab-pariteit, Matrix- en Telegram-lanes. Stabiele/standaardruns houden uitputtende live/E2E- en Docker-releasepaddekking achter `run_release_soak=true`; `release_profile=full` forceert die soak-dekking aan zodat brede advisory-validatie breed blijft. Met `rerun_group=all` en `release_profile=full` voert deze ook `NPM Telegram Beta E2E` uit tegen het artifact `release-package-under-test` uit releasecontroles. Geef na publicatie `npm_telegram_package_spec` door om dezelfde Telegram-package-lane opnieuw uit te voeren tegen het gepubliceerde npm-package.

Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
fasematrix, exacte workflowjobnamen, profielverschillen, artifacts en
gerichte rerun-handles.

`OpenClaw Release Publish` is de handmatige muterende releaseworkflow. Dispatch deze
vanuit `release/YYYY.M.D` of `main` nadat de releasetag bestaat en nadat de
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

Gebruik voor bewijs van een gepinde commit op een snel veranderende branch de helper in plaats van
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-workflowdispatch-refs moeten branches of tags zijn, geen ruwe commit-SHA's. De
helper pusht een tijdelijke branch `release-ci/<sha>-...` op de doel-SHA,
dispatcht `Full Release Validation` vanuit die gepinde ref, verifieert dat elke child-
workflow `headSha` overeenkomt met het doel, en verwijdert de tijdelijke branch wanneer de
run is voltooid. De parapluverificateur faalt ook als een child-workflow op een
andere SHA draaide.

`release_profile` bepaalt de live-/aanbiederbreedte die aan releasecontroles wordt doorgegeven. De
handmatige releaseworkflows gebruiken standaard `stable`; gebruik `full` alleen wanneer je
bewust de brede adviserende matrix voor aanbieders/media wilt. `run_release_soak`
bepaalt of stabiele/standaard releasecontroles de uitputtende live/E2E- en
Docker-releasepad-soak uitvoeren; `full` forceert soak aan.

- `minimum` behoudt de snelste OpenAI-/core releasekritieke lanes.
- `stable` voegt de stabiele provider-/backendset toe.
- `full` voert de brede adviserende matrix voor aanbieders/media uit.

De overkoepelende workflow registreert de verzonden child-run-id's, en de laatste taak `Verify full validation` controleert de huidige conclusies van child-runs opnieuw en voegt tabellen met langzaamste taken toe voor elke child-run. Als een child-workflow opnieuw wordt uitgevoerd en groen wordt, voer dan alleen de parent-verifier-taak opnieuw uit om het overkoepelende resultaat en de timingsamenvatting te vernieuwen.

Voor herstel accepteren zowel `Full Release Validation` als `OpenClaw Release Checks` `rerun_group`. Gebruik `all` voor een releasecandidate, `ci` voor alleen de normale volledige CI-child, `plugin-prerelease` voor alleen de prerelease-child van plugins, `release-checks` voor elke release-child, of een smallere groep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, of `npm-telegram` op de overkoepelende workflow. Dit houdt een heruitvoering van een mislukte releasebox na een gerichte fix begrensd. Combineer voor één mislukte cross-OS-lane `rerun_group=cross-os` met `cross_os_suite_filter`, bijvoorbeeld `windows/packaged-upgrade`; lange cross-OS-commando's geven Heartbeat-regels uit en packaged-upgrade-samenvattingen bevatten timings per fase. QA-releasecontrolelanes zijn adviserend, dus QA-only-fouten geven een waarschuwing maar blokkeren de releasecontroleverifier niet.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde ref eenmaal op te lossen naar een `release-package-under-test`-tarball en geeft dat artefact vervolgens door aan cross-OS-controles en Package Acceptance, plus de live/E2E-releasepad-Docker-workflow wanneer soak-dekking wordt uitgevoerd. Dat houdt de pakketbytes consistent over releaseboxen heen en voorkomt dat dezelfde kandidaat opnieuw wordt ingepakt in meerdere child-taken.

Dubbele `Full Release Validation`-runs voor `ref=main` en `rerun_group=all`
vervangen de oudere overkoepelende workflow. De parent-monitor annuleert elke child-workflow die
hij al heeft verzonden wanneer de parent wordt geannuleerd, zodat nieuwere main-validatie
niet achter een verouderde twee uur durende releasecontrole-run blijft staan. Validatie van releasebranch/tag
en gerichte heruitvoergroepen houden `cancel-in-progress: false`.

## Live- en E2E-shards

De release-live/E2E-child behoudt brede native `pnpm test:live`-dekking, maar voert die uit als benoemde shards via `scripts/test-live-shard.mjs` in plaats van één seriële taak:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- aanbiedergefilterde `native-live-src-gateway-profiles`-taken
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- gesplitste audio-/videoshards voor media en aanbiedergefilterde muziekshards

Dat behoudt dezelfde bestandsdekking en maakt trage live-aanbiederfouten eenvoudiger opnieuw uit te voeren en te diagnosticeren. De geaggregeerde shardnamen `native-live-extensions-o-z`, `native-live-extensions-media` en `native-live-extensions-media-music` blijven geldig voor handmatige eenmalige heruitvoeringen.

De native live-mediashards draaien in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de workflow `Live Media Runner Image`. Die image installeert `ffmpeg` en `ffprobe` vooraf; mediataken verifiëren alleen de binaries vóór setup. Houd Docker-backed live-suites op normale Blacksmith-runners: containertaken zijn de verkeerde plek om geneste Docker-tests te starten.

Docker-backed live model-/backendshards gebruiken een afzonderlijke gedeelde `ghcr.io/openclaw/openclaw-live-test:<sha>`-image per geselecteerde commit. De live-releaseworkflow bouwt en pusht die image eenmaal, waarna de Docker live-model-, provider-sharded Gateway-, CLI-backend-, ACP-bind- en Codex-harnessshards draaien met `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway-Docker-shards dragen expliciete timeoutlimieten op scriptniveau onder de workflowtaaktimeout, zodat een vastgelopen container of opruimpad snel faalt in plaats van het hele releasecontrolebudget te verbruiken. Als die shards zelfstandig het volledige source-Docker-doel opnieuw bouwen, is de releaserun verkeerd geconfigureerd en verspilt die wandkloktijd aan dubbele imagebuilds.

## Pakketacceptatie

Gebruik `Package Acceptance` wanneer de vraag is: "werkt dit installeerbare OpenClaw-pakket als product?" Dit verschilt van normale CI: normale CI valideert de source-tree, terwijl pakketacceptatie één tarball valideert via dezelfde Docker-E2E-harness die gebruikers na installatie of update gebruiken.

### Taken

1. `resolve_package` checkt `workflow_ref` uit, lost één pakketkandidaat op, schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het artefact `package-under-test` en drukt de bron, workflow-ref, pakket-ref, versie, SHA-256 en het profiel af in de GitHub-stapsamenvatting.
2. `docker_acceptance` roept `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt dat artefact, valideert de tarball-inventaris, bereidt pakketdigest-Docker-images voor wanneer nodig en voert de geselecteerde Docker-lanes uit tegen dat pakket in plaats van de workflowcheckout in te pakken. Wanneer een profiel meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het pakket en de gedeelde images eenmaal voor en waaiert die lanes vervolgens uit als parallelle gerichte Docker-taken met unieke artefacten.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Deze draait wanneer `telegram_mode` niet `none` is en installeert hetzelfde `package-under-test`-artefact wanneer Package Acceptance er een heeft opgelost; zelfstandige Telegram-dispatch kan nog steeds een gepubliceerde npm-specificatie installeren.
4. `summary` laat de workflow falen als pakketresolutie, Docker-acceptatie of de optionele Telegram-lane is mislukt.

### Kandidaatbronnen

- `source=npm` accepteert alleen `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor gepubliceerde prerelease-/stabiele acceptatie.
- `source=ref` pakt een vertrouwde `package_ref`-branch, tag of volledige commit-SHA in. De resolver haalt OpenClaw-branches/tags op, verifieert dat de geselecteerde commit bereikbaar is vanuit de repositorybranchgeschiedenis of een releasetag, installeert dependencies in een detached worktree en pakt deze in met `scripts/package-openclaw-for-docker.mjs`.
- `source=url` downloadt een HTTPS-`.tgz`; `package_sha256` is vereist.
- `source=artifact` downloadt één `.tgz` uit `artifact_run_id` en `artifact_name`; `package_sha256` is optioneel maar moet worden opgegeven voor extern gedeelde artefacten.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde workflow-/harnesscode die de test uitvoert. `package_ref` is de source-commit die wordt ingepakt wanneer `source=ref`. Hierdoor kan de huidige testharness oudere vertrouwde source-commits valideren zonder oude workflowlogica uit te voeren.

### Suiteprofielen

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — volledige Docker-releasepadchunks met OpenWebUI
- `custom` — exacte `docker_lanes`; vereist wanneer `suite_profile=custom`

Het profiel `package` gebruikt offline plugindekking, zodat validatie van gepubliceerde pakketten niet afhankelijk is van live ClawHub-beschikbaarheid. De optionele Telegram-lane hergebruikt het artefact `package-under-test` in `NPM Telegram Beta E2E`, waarbij het pad voor de gepubliceerde npm-specificatie behouden blijft voor zelfstandige dispatches.

Zie [Updates en plugins testen](/nl/help/testing-updates-plugins) voor het specifieke update- en plugintestbeleid, inclusief lokale commando's,
Docker-lanes, Package Acceptance-invoer, releasestandaarden en fouttriage.

Releasecontroles roepen Package Acceptance aan met `source=artifact`, het voorbereide releasepakketartefact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` en `telegram_mode=mock-openai`. Dit houdt pakketmigratie, update, opschoning van verouderde plugin-dependency's, herstel van geconfigureerde plugininstallatie, offline plugin, plugin-update en Telegram-bewijs op dezelfde opgeloste pakkettarball. Stel `package_acceptance_package_spec` in op Full Release Validation of OpenClaw Release Checks om diezelfde matrix uit te voeren tegen een verzonden npm-pakket in plaats van het uit de SHA gebouwde artefact. Cross-OS-releasecontroles dekken nog steeds OS-specifieke onboarding, installer- en platformgedrag; productvalidatie voor pakket/update moet beginnen met Package Acceptance. De Docker-lane `published-upgrade-survivor` valideert één gepubliceerde pakketbaseline per run in het blokkerende releasepad. In Package Acceptance is de opgeloste `package-under-test`-tarball altijd de kandidaat en selecteert `published_upgrade_survivor_baseline` de fallback-gepubliceerde baseline, standaard `openclaw@latest`; heruitvoercommando's voor mislukte lanes behouden die baseline. Full Release Validation met `run_release_soak=true` of `release_profile=full` stelt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` en `published_upgrade_survivor_scenarios=reported-issues` in om uit te breiden over de vier nieuwste stabiele npm-releases plus vastgezette plugincompatibiliteitsgrensreleases en issue-vormige fixtures voor Feishu-configuratie, behouden bootstrap-/personabestanden, geconfigureerde OpenClaw-plugininstallaties, tilde-logpaden en verouderde legacy-plugin-dependency-roots. Multi-baseline published-upgrade-survivor-selecties worden per baseline geshard naar afzonderlijke gerichte Docker-runnertaken. De afzonderlijke workflow `Update Migration` gebruikt de Docker-lane `update-migration` met `all-since-2026.4.23` en `plugin-deps-cleanup` wanneer de vraag uitputtende opschoning van gepubliceerde updates is, niet normale Full Release CI-breedte. Lokale geaggregeerde runs kunnen exacte pakketspecificaties doorgeven met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, één lane behouden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` zoals `openclaw@2026.4.15`, of `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` instellen voor de scenariomatrix. De gepubliceerde lane configureert de baseline met een ingebakken `openclaw config set`-commandorecept, registreert receptstappen in `summary.json` en peilt `/healthz`, `/readyz` plus RPC-status na Gateway-start. De Windows packaged- en installer fresh-lanes verifiëren ook dat een geïnstalleerd pakket een browser-control-override kan importeren vanaf een ruw absoluut Windows-pad. De OpenAI cross-OS agent-turn smoke gebruikt standaard `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer dit is ingesteld, anders `openai/gpt-5.4`, zodat het installatie- en Gateway-bewijs op een GPT-5-testmodel blijft terwijl GPT-4.x-standaarden worden vermeden.

### Legacy-compatibiliteitsvensters

Package Acceptance heeft begrensde legacy-compatibiliteitsvensters voor reeds gepubliceerde pakketten. Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen het compatibiliteitspad gebruiken:

- bekende private QA-vermeldingen in `dist/postinstall-inventory.json` mogen wijzen naar bestanden die uit de tarball zijn weggelaten;
- `doctor-switch` mag de subcase voor `gateway install --wrapper`-persistentie overslaan wanneer het pakket die flag niet blootstelt;
- `update-channel-switch` mag ontbrekende `pnpm.patchedDependencies` snoeien uit de van de tarball afgeleide nep-gitfixture en mag ontbrekende gepersisteerde `update.channel` loggen;
- plugin-smokes mogen legacy install-record-locaties lezen of ontbrekende persistentie van marketplace-install-record accepteren;
- `plugin-update` mag migratie van configuratiemetadata toestaan, terwijl nog steeds wordt vereist dat de install record en het no-reinstall-gedrag ongewijzigd blijven.

Het gepubliceerde `2026.4.26`-pakket kan ook waarschuwen voor lokale buildmetadata-stempelbestanden die al waren meegeleverd. Latere pakketten moeten voldoen aan de moderne contracten; dezelfde voorwaarden mislukken dan in plaats van te waarschuwen of over te slaan.

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

Begin bij het debuggen van een mislukte package-acceptance-run met de `resolve_package`-samenvatting om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de onderliggende `docker_acceptance`-run en de Docker-artifacten daarvan: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logs, fasetimings en rerun-opdrachten. Voer bij voorkeur het mislukte pakketprofiel of de exacte Docker-lanes opnieuw uit in plaats van de volledige releasevalidatie opnieuw te draaien.

## Installatiesmoke

De afzonderlijke `Install Smoke`-workflow hergebruikt hetzelfde scopescript via zijn eigen `preflight`-job. Deze splitst smoke-dekking op in `run_fast_install_smoke` en `run_full_install_smoke`.

- **Snel pad** draait voor pull requests die Docker-/pakketoppervlakken raken, wijzigingen in meegeleverde pluginpakketten/manifests, of oppervlakken van core-plugin/channel/gateway/Plugin SDK die door de Docker-smokejobs worden getest. Alleen-bronwijzigingen in meegeleverde plugins, alleen-testwijzigingen en alleen-documentatiewijzigingen reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image eenmalig, controleert de CLI, draait de CLI-smoke voor het verwijderen van agents met gedeelde workspace, draait de container-gateway-network-e2e, verifieert een build-argument voor een meegeleverde extensie en draait het begrensde meegeleverde-plugin-Docker-profiel onder een geaggregeerde opdrachttime-out van 240 seconden (waarbij elke Docker-run per scenario afzonderlijk is begrensd).
- **Volledig pad** behoudt QR-pakketinstallatie en installer-Docker-/update-dekking voor nachtelijke geplande runs, handmatige dispatches, releasechecks via workflow-calls en pull requests die daadwerkelijk installer-/pakket-/Docker-oppervlakken raken. In volledige modus bereidt install-smoke één target-SHA GHCR-root-Dockerfile-smoke-image voor of hergebruikt deze, en draait daarna QR-pakketinstallatie, root-Dockerfile-/Gateway-smokes, installer-/update-smokes en de snelle meegeleverde-plugin-Docker-E2E als afzonderlijke jobs, zodat installerwerk niet hoeft te wachten achter de root-image-smokes.

`main`-pushes (inclusief mergecommits) forceren het volledige pad niet; wanneer changed-scope-logica volledige dekking op een push zou aanvragen, behoudt de workflow de snelle Docker-smoke en laat hij de volledige installatiesmoke over aan nachtelijke runs of releasevalidatie.

De trage Bun-global-install-image-provider-smoke wordt afzonderlijk gated door `run_bun_global_install_smoke`. Deze draait volgens het nachtelijke schema en vanuit de releasechecks-workflow, en handmatige `Install Smoke`-dispatches kunnen ervoor kiezen deze mee te nemen, maar pull requests en `main`-pushes doen dat niet. QR- en installer-Docker-tests behouden hun eigen installatiegerichte Dockerfiles.

## Lokale Docker E2E

`pnpm test:docker:all` prebuiltt één gedeelde live-test-image, verpakt OpenClaw één keer als npm-tarball en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images:

- een kale Node/Git-runner voor installer-/update-/plugin-dependency-lanes;
- een functionele image die dezelfde tarball installeert in `/app` voor normale functionaliteitslanes.

Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en draait lanes daarna met `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Instelbare waarden

| Variabele                              | Standaard | Doel                                                                                                      |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Aantal slots in de hoofdpool voor normale lanes.                                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Aantal slots in de providergevoelige tail-pool.                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limiet voor gelijktijdige live-lanes zodat providers niet throttlen.                                       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limiet voor gelijktijdige npm-install-lanes.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limiet voor gelijktijdige multi-service-lanes.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Spreiding tussen lanestarts om Docker-daemon-create-stormen te vermijden; stel in op `0` voor geen spreiding. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Fallbacktimeout per lane (120 minuten); geselecteerde live-/tail-lanes gebruiken strakkere limieten.      |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset     | `1` print het schedulerplan zonder lanes te draaien.                                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset     | Kommagescheiden exacte lanelijst; slaat cleanup-smoke over zodat agents één mislukte lane kunnen reproduceren. |

Een lane die zwaarder is dan zijn effectieve limiet kan nog steeds starten vanuit een lege pool en draait dan alleen totdat hij capaciteit vrijgeeft. De lokale geaggregeerde preflights controleren Docker, verwijderen verouderde OpenClaw-E2E-containers, tonen actieve-lane-status, bewaren lanetimings voor langste-eerst-sortering en stoppen standaard met het plannen van nieuwe gepoolde lanes na de eerste fout.

### Herbruikbare live/E2E-workflow

De herbruikbare live/E2E-workflow vraagt `scripts/test-docker-all.mjs --plan-json` welk pakket, imagetype, live-image, lane en credentialdekking vereist zijn. `scripts/docker-e2e.mjs` zet dat plan daarna om naar GitHub-outputs en samenvattingen. Het script verpakt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een pakketartifact van de huidige run of downloadt een pakketartifact uit `package_artifact_run_id`; valideert de tarball-inventaris; bouwt en pusht package-digest-getagde kale/functionele GHCR-Docker-E2E-images via Blacksmiths Docker-layercache wanneer het plan lanes met geïnstalleerde pakketten nodig heeft; en hergebruikt opgegeven `docker_e2e_bare_image`-/`docker_e2e_functional_image`-inputs of bestaande package-digest-images in plaats van opnieuw te bouwen. Docker-imagepulls worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry-/cachestream snel opnieuw probeert in plaats van het grootste deel van het kritieke CI-pad te verbruiken.

### Chunks voor het releasepad

Release-Docker-dekking draait kleinere chunked jobs met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elke chunk alleen het imagetype pullt dat hij nodig heeft en meerdere lanes via dezelfde gewogen scheduler uitvoert:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Huidige release-Docker-chunks zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` en `plugins-runtime-install-a` tot en met `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` en `plugins-integrations` blijven geaggregeerde plugin-/runtime-aliassen. De lane-alias `install-e2e` blijft de geaggregeerde handmatige rerun-alias voor beide provider-installer-lanes.

OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige release-path-dekking dit aanvraagt, en behoudt alleen een zelfstandige `openwebui`-chunk voor OpenWebUI-only-dispatches. Meegeleverde-channel-updatelanes proberen één keer opnieuw bij tijdelijke npm-netwerkfouten.

Elke chunk uploadt `.artifacts/docker-tests/` met lane-logs, timings, `summary.json`, `failures.json`, fasetimings, schedulerplan-JSON, tabellen met trage lanes en rerun-opdrachten per lane. De workflowinput `docker_lanes` draait geselecteerde lanes tegen de voorbereide images in plaats van de chunkjobs, waardoor debuggen van mislukte lanes beperkt blijft tot één gerichte Docker-job en het pakketartifact voor die run wordt voorbereid, gedownload of hergebruikt; als een geselecteerde lane een live-Docker-lane is, bouwt de gerichte job de live-test-image lokaal voor die rerun. Gegenereerde GitHub-rerun-opdrachten per lane bevatten `package_artifact_run_id`, `package_artifact_name` en voorbereide image-inputs wanneer die waarden bestaan, zodat een mislukte lane exact het pakket en de images uit de mislukte run kan hergebruiken.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

De geplande live/E2E-workflow draait dagelijks de volledige release-path-Docker-suite.

## Plugin Prerelease

`Plugin Prerelease` is duurdere product-/pakketdekking, daarom is dit een afzonderlijke workflow die wordt gedispatcht door `Full Release Validation` of door een expliciete operator. Normale pull requests, `main`-pushes en zelfstandige handmatige CI-dispatches houden die suite uitgeschakeld. De workflow balanceert meegeleverde plugintests over acht extensieworkers; die extensie-shardjobs draaien maximaal twee pluginconfiggroepen tegelijk met één Vitest-worker per groep en een grotere Node-heap, zodat importzware pluginbatches geen extra CI-jobs creëren. Het release-only-Docker-prereleasepad batchet gerichte Docker-lanes in kleine groepen om te voorkomen dat tientallen runners worden gereserveerd voor jobs van één tot drie minuten.

## QA Lab

QA Lab heeft speciale CI-lanes buiten de slimme hoofdworkflow met scope. Agentic parity is genest onder de brede QA- en releaseharnassen, niet als zelfstandige PR-workflow. Gebruik `Full Release Validation` met `rerun_group=qa-parity` wanneer parity moet meelopen met een brede validatierun.

- De workflow `QA-Lab - All Lanes` draait nachtelijk op `main` en bij handmatige dispatch; hij waaiert de mock-parity-lane, live Matrix-lane en live Telegram- en Discord-lanes uit als parallelle jobs. Live jobs gebruiken de omgeving `qa-live-shared`, en Telegram/Discord gebruiken Convex-leases.

Releasechecks draaien Matrix- en Telegram-live-transportlanes met de deterministische mockprovider en mock-gekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het channelcontract wordt geïsoleerd van live-modellatentie en normale provider-plugin-startup. De live-transport-Gateway schakelt memory search uit, omdat QA-parity geheugengedrag afzonderlijk dekt; providerconnectiviteit wordt gedekt door de afzonderlijke live-model-, native-provider- en Docker-provider-suites.

Matrix gebruikt `--profile fast` voor geplande en releasegates, en voegt `--fail-fast` alleen toe wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaard en handmatige workflowinput blijven `all`; handmatige `matrix_profile=all`-dispatch shardt volledige Matrix-dekking altijd in `transport`-, `media`-, `e2ee-smoke`-, `e2ee-deep`- en `e2ee-cli`-jobs.

`OpenClaw Release Checks` draait ook de releasekritieke QA Lab-lanes vóór releasegoedkeuring; de QA-parity-gate draait de kandidaat- en baseline-packs als parallelle lanejobs, en downloadt daarna beide artifacts naar een kleine rapportjob voor de uiteindelijke parity-vergelijking.

Voor normale PR's volgt u scoped CI-/check-bewijs in plaats van parity als verplichte status te behandelen.

## CodeQL

De `CodeQL`-workflow is bewust een smalle securityscanner voor de eerste ronde, niet de volledige repository-sweep. Dagelijkse, handmatige en niet-concept pull-request-guard-runs scannen Actions-workflowcode plus de JavaScript/TypeScript-oppervlakken met het hoogste risico met security-queries met hoge betrouwbaarheid, gefilterd op hoge/kritieke `security-severity`.

De pull-request-guard blijft licht: deze start alleen voor wijzigingen onder `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` of `src`, en draait dezelfde security-matrix met hoge betrouwbaarheid als de geplande workflow. Android en macOS CodeQL blijven buiten de standaardinstellingen voor PR's.

### Security-categorieën

| Categorie                                         | Oppervlak                                                                                                                              |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, geheimen, sandbox, cron en gateway-baseline                                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | Core-kanaalimplementatiecontracten plus de kanaalplugin-runtime, gateway, Plugin SDK, geheimen, audit-aanraakpunten                    |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF-, IP-parsing-, network-guard-, web-fetch- en Plugin SDK SSRF-beleidsoppervlakken                                             |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-servers, hulpfuncties voor procesuitvoering, uitgaande levering en agent tool-execution-gates                                      |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-installatie, loader, manifest, registry, package-manager-installatie, source-loading en vertrouwensoppervlakken voor het Plugin SDK-packagecontract |

### Platformspecifieke security-shards

- `CodeQL Android Critical Security` — geplande Android-security-shard. Bouwt de Android-app handmatig voor CodeQL op de kleinste Blacksmith Linux-runner die door workflow-sanity wordt geaccepteerd. Uploadt onder `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — wekelijkse/handmatige macOS-security-shard. Bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert dependency-buildresultaten uit de geüploade SARIF en uploadt onder `/codeql-critical-security/macos`. Blijft buiten dagelijkse standaardinstellingen omdat de macOS-build de runtime domineert, zelfs wanneer die schoon is.

### Critical Quality-categorieën

`CodeQL Critical Quality` is de bijbehorende niet-security-shard. Deze draait alleen error-severity, niet-security JavaScript/TypeScript-kwaliteitsqueries over smalle oppervlakken met hoge waarde op de kleinere Blacksmith Linux-runner. De pull-request-guard is bewust kleiner dan het geplande profiel: niet-concept-PR's draaien alleen de bijbehorende `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` en `plugin-sdk-reply-runtime` shards voor agent command/model/tool-uitvoering en reply-dispatchcode, config schema-/migratie-/IO-code, auth/secrets/sandbox/security-code, core-kanaal en runtime van gebundelde kanaalplugins, gateway-protocol/server-method, memory-runtime/SDK-koppeling, MCP/proces/uitgaande levering, provider-runtime/modelcatalogus, sessiediagnostiek/leveringswachtrijen, plugin-loader, Plugin SDK/package-contract of wijzigingen in de reply-runtime van de Plugin SDK. CodeQL-configuratie- en quality-workflowwijzigingen draaien alle twaalf PR-quality-shards.

Handmatige dispatch accepteert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

De smalle profielen zijn onderwijs-/iteratiehooks om één quality-shard geïsoleerd te draaien.

| Categorie                                              | Oppervlak                                                                                                                                                         |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`           | Auth, geheimen, sandbox, cron en code voor de gateway-securitygrens                                                                                                |
| `/codeql-critical-quality/config-boundary`             | Config-schema, migratie, normalisatie en IO-contracten                                                                                                            |
| `/codeql-critical-quality/gateway-runtime-boundary`    | Gateway-protocolschema's en servermethod-contracten                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`    | Core-kanaal en implementatiecontracten van gebundelde kanaalplugins                                                                                               |
| `/codeql-critical-quality/agent-runtime-boundary`      | Command-uitvoering, model/provider-dispatch, auto-reply-dispatch en wachtrijen, en ACP control-plane-runtimecontracten                                            |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-servers en tool-bridges, hulpfuncties voor processupervisie en contracten voor uitgaande levering                                                             |
| `/codeql-critical-quality/memory-runtime-boundary`     | Memory host SDK, memory-runtimefacades, memory Plugin SDK-aliassen, memory-runtime-activatiekoppeling en memory-doctor-commands                                  |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply queue-internals, sessieleveringswachtrijen, helpers voor uitgaande sessiebinding/-levering, oppervlakken voor diagnostic event/log-bundles en sessie-doctor CLI-contracten |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`    | Plugin SDK inbound reply-dispatch, reply-payload-/chunking-/runtimehelpers, kanaal-reply-opties, leveringswachtrijen en helpers voor sessie-/threadbinding       |
| `/codeql-critical-quality/provider-runtime-boundary`   | Modelcatalogusnormalisatie, provider-auth en discovery, provider-runtime-registratie, provider-standaardinstellingen/catalogi en web/search/fetch/embedding-registries |
| `/codeql-critical-quality/ui-control-plane`            | Control-UI-bootstrap, lokale persistentie, gateway-control-flows en task-control-plane-runtimecontracten                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`  | Core web fetch/search, media-IO, media understanding, image-generation en media-generation-runtimecontracten                                                       |
| `/codeql-critical-quality/plugin-boundary`             | Loader-, registry-, public-surface- en Plugin SDK-entrypoint-contracten                                                                                           |
| `/codeql-critical-quality/plugin-sdk-package-contract` | Gepubliceerde package-side Plugin SDK-bron en helpers voor plugin-packagecontracten                                                                                |

Quality blijft gescheiden van security, zodat quality-bevindingen gepland, gemeten, uitgeschakeld of uitgebreid kunnen worden zonder security-signaal te vertroebelen. Swift, Python en gebundelde-plugin CodeQL-uitbreiding moeten alleen als gescoped of geshard opvolgwerk weer worden toegevoegd nadat de smalle profielen stabiele runtime en stabiel signaal hebben.

## Onderhoudsworkflows

### Docs Agent

De `Docs Agent`-workflow is een event-driven Codex-onderhoudslane om bestaande docs afgestemd te houden op recent gelande wijzigingen. Deze heeft geen zuiver schema: een succesvolle niet-bot push-CI-run op `main` kan deze triggeren, en handmatige dispatch kan deze direct draaien. Workflow-run-aanroepen worden overgeslagen wanneer `main` is doorgegaan of wanneer er in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is aangemaakt. Wanneer deze draait, beoordeelt deze de commitreeks van de vorige niet-overgeslagen Docs Agent-bron-SHA tot de huidige `main`, zodat één run per uur alle main-wijzigingen kan dekken die sinds de laatste docs-pass zijn verzameld.

### Test Performance Agent

De `Test Performance Agent`-workflow is een event-driven Codex-onderhoudslane voor trage tests. Deze heeft geen zuiver schema: een succesvolle niet-bot push-CI-run op `main` kan deze triggeren, maar deze slaat over als er die UTC-dag al een andere workflow-run-aanroep is gedraaid of draait. Handmatige dispatch omzeilt die dagelijkse activiteitsgate. De lane bouwt een full-suite gegroepeerd Vitest-prestatierapport, laat Codex alleen kleine coverage-behoudende testprestatieoplossingen maken in plaats van brede refactors, draait daarna het full-suite rapport opnieuw en weigert wijzigingen die het aantal passerende baselinetests verlagen. Als de baseline falende tests heeft, mag Codex alleen duidelijke failures oplossen en moet het full-suite rapport na de agent slagen voordat er iets wordt gecommit. Wanneer `main` voortschrijdt voordat de bot-push landt, rebaset de lane de gevalideerde patch, draait `pnpm check:changed` opnieuw en probeert de push opnieuw; conflicterende verouderde patches worden overgeslagen. Deze gebruikt GitHub-hosted Ubuntu zodat de Codex-action dezelfde drop-sudo-veiligheidshouding kan behouden als de docs-agent.

### Dubbele PR's na merge

De `Duplicate PRs After Merge`-workflow is een handmatige maintainer-workflow voor duplicate-opruiming na landen. Deze staat standaard op dry-run en sluit alleen expliciet vermelde PR's wanneer `apply=true`. Voordat GitHub wordt gewijzigd, verifieert deze dat de gelande PR is gemerged en dat elke duplicate ofwel een gedeeld gerefereerd issue heeft of overlappende gewijzigde hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale check-gates en changed routing

Lokale changed-lane-logica staat in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale check-gate is strenger over architectuurgrenzen dan de brede CI-platformscope:

- core-productiewijzigingen draaien core prod- en core test-typecheck plus core lint/guards;
- wijzigingen alleen aan core-tests draaien alleen core test-typecheck plus core lint;
- extensieproductiewijzigingen draaien extension prod- en extension test-typecheck plus extension lint;
- wijzigingen alleen aan extensietests draaien extension test-typecheck plus extension lint;
- public Plugin SDK- of plugin-contractwijzigingen breiden uit naar extension-typecheck omdat extensies afhankelijk zijn van die core-contracten (Vitest extension-sweeps blijven expliciet testwerk);
- release metadata-only version bumps draaien gerichte version/config/root-dependency-checks;
- onbekende root/config-wijzigingen falen veilig naar alle check-lanes.

Lokale changed-test-routing staat in `scripts/test-projects.test-support.mjs` en is bewust goedkoper dan `check:changed`: directe testbewerkingen draaien zichzelf, bronbewerkingen geven de voorkeur aan expliciete mappings, daarna sibling-tests en import-graph dependents. Shared group-room delivery config is een van de expliciete mappings: wijzigingen in de group visible-reply-config, source reply delivery mode of de message-tool system prompt lopen via de core reply-tests plus Discord- en Slack-delivery-regressies, zodat een gedeelde standaardwijziging faalt vóór de eerste PR-push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging zo harness-breed is dat de goedkope gemapte set geen betrouwbare proxy is.

## Testbox-validatie

Voer Testbox uit vanuit de repo-root en geef voor brede verificatie de voorkeur aan een vers opgewarmde box. Voordat je een langzame gate uitvoert op een box die is hergebruikt, verlopen is of net een onverwacht grote synchronisatie meldde, voer je eerst `pnpm testbox:sanity` uit in de box.

De sanity-check faalt snel wanneer vereiste rootbestanden zoals `pnpm-lock.yaml` zijn verdwenen of wanneer `git status --short` ten minste 200 getrackte verwijderingen toont. Dat betekent meestal dat de externe synchronisatiestatus geen betrouwbare kopie van de PR is; stop die box en warm een nieuwe op in plaats van de producttestfout te debuggen. Stel voor opzettelijke PR's met veel verwijderingen `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor die sanity-run.

`pnpm testbox:run` beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de synchronisatiefase blijft zonder uitvoer na de synchronisatie. Stel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` in om die bewaking uit te schakelen, of gebruik een grotere millisecondewaarde voor ongewoon grote lokale diffs.

Crabbox is de remote-box-wrapper van de repo voor Linux-verificatie door maintainers. Gebruik deze wanneer een check te breed is voor een lokale bewerkingslus, wanneer CI-pariteit belangrijk is, of wanneer de verificatie secrets, Docker, pakketlanes, herbruikbare boxes of externe logs nodig heeft. De normale OpenClaw-backend is `blacksmith-testbox`; eigen AWS/Hetzner-capaciteit is een fallback voor Blacksmith-storingen, quotumproblemen of expliciete tests met eigen capaciteit.

Controleer de wrapper vóór een eerste run vanuit de repo-root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

De repo-wrapper weigert een verouderde Crabbox-binary die `blacksmith-testbox` niet adverteert. Geef de provider expliciet door, ook al heeft `.crabbox.yaml` standaardwaarden voor owned-cloud.

Gate voor wijzigingen:

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

Lees de uiteindelijke JSON-samenvatting. De nuttige velden zijn `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` en `totalMs`. Eenmalige Crabbox-runs met Blacksmith-backend zouden de Testbox automatisch moeten stoppen; als een run wordt onderbroken of het opruimen onduidelijk is, inspecteer dan de live boxes en stop alleen de boxes die je hebt gemaakt:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Gebruik hergebruik alleen wanneer je bewust meerdere opdrachten op dezelfde gehydrateerde box nodig hebt:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Als Crabbox de kapotte laag is maar Blacksmith zelf werkt, gebruik dan direct Blacksmith als beperkte fallback:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Escalatie naar eigen Crabbox-capaciteit doe je alleen wanneer Blacksmith offline is, door quota wordt beperkt, de benodigde omgeving mist, of eigen capaciteit expliciet het doel is:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` beheert de standaardwaarden voor provider, synchronisatie en GitHub Actions-hydratatie voor owned-cloud-lanes. Het sluit lokale `.git` uit, zodat de gehydrateerde Actions-checkout zijn eigen externe Git-metadata behoudt in plaats van maintainer-lokale remotes en objectstores te synchroniseren, en het sluit lokale runtime-/buildartefacten uit die nooit mogen worden overgedragen. `.github/workflows/crabbox-hydrate.yml` beheert checkout, Node/pnpm-setup, ophalen van `origin/main` en de niet-geheime omgevingsoverdracht voor owned-cloud-opdrachten met `crabbox run --id <cbx_id>`.

## Gerelateerd

- [Installatie-overzicht](/nl/install)
- [Ontwikkelingskanalen](/nl/install/development-channels)
