---
read_when:
    - Je moet begrijpen waarom een CI-job wel of niet is uitgevoerd
    - Je debugt een mislukte GitHub Actions-controle
    - Je coördineert een releasevalidatierun of een herhaling daarvan
    - Je wijzigt de ClawSweeper-aansturing of het doorsturen van GitHub-activiteit
summary: CI-taakgrafiek, scope-gates, releasekoepels en lokale opdrachtequivalenten
title: CI-pijplijn
x-i18n:
    generated_at: "2026-05-10T19:25:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4317a3985fd34470c4b9fd981a2048af9c395bdc65fe99853286628d1ee47d3
    source_path: ci.md
    workflow: 16
---

OpenClaw CI draait bij elke push naar `main` en elke pull request. De taak `preflight` classificeert de diff en schakelt dure lanes uit wanneer alleen niet-gerelateerde gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen bewust slimme scoping en waaieren de volledige graaf uit voor releasekandidaten en brede validatie. Android-lanes blijven opt-in via `include_android`. Release-only Plugin-dekking staat in de afzonderlijke workflow [`Plugin Prerelease`](#plugin-prerelease) en wordt alleen uitgevoerd vanuit [`Full Release Validation`](#full-release-validation) of een expliciete handmatige dispatch.

## Pipeline-overzicht

| Taak                             | Doel                                                                                                      | Wanneer deze draait                         |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `preflight`                      | Detecteert docs-only wijzigingen, gewijzigde scopes, gewijzigde extensies en bouwt het CI-manifest        | Altijd bij niet-concept-pushes en PR's      |
| `security-scm-fast`              | Detectie van privésleutels en workflow-audit via `zizmor`                                                 | Altijd bij niet-concept-pushes en PR's      |
| `security-dependency-audit`      | Productie-lockfile-audit zonder dependencies tegen npm-advisories                                         | Altijd bij niet-concept-pushes en PR's      |
| `security-fast`                  | Vereiste aggregatie voor de snelle beveiligingstaken                                                      | Altijd bij niet-concept-pushes en PR's      |
| `check-dependencies`             | Productie Knip-pass alleen voor dependencies plus de allowlist-guard voor ongebruikte bestanden           | Node-relevante wijzigingen                  |
| `build-artifacts`                | Bouwt `dist/`, Control UI, controles voor gebouwde artifacts en herbruikbare downstream-artifacts         | Node-relevante wijzigingen                  |
| `checks-fast-core`               | Snelle Linux-correctness-lanes zoals bundled/plugin-contract/protocol-controles                           | Node-relevante wijzigingen                  |
| `checks-fast-contracts-channels` | Gesherde kanaalcontractcontroles met een stabiel geaggregeerd controleresultaat                           | Node-relevante wijzigingen                  |
| `checks-node-core-test`          | Core Node-testshards, exclusief kanaal-, bundled-, contract- en extensie-lanes                            | Node-relevante wijzigingen                  |
| `check`                          | Gesherde equivalent van de lokale hoofdgate: productietypen, lint, guards, testtypen en strikte smoke     | Node-relevante wijzigingen                  |
| `check-additional`               | Architectuur, gesherde boundary/prompt-drift, extensieguards, pakketboundary en Gateway watch             | Node-relevante wijzigingen                  |
| `build-smoke`                    | Smoke-tests voor de gebouwde CLI en smoke voor opstartgeheugen                                            | Node-relevante wijzigingen                  |
| `checks`                         | Verifier voor gebouwde-artifact-kanaaltests                                                               | Node-relevante wijzigingen                  |
| `checks-node-compat-node22`      | Node 22-compatibiliteitsbuild en smoke-lane                                                               | Handmatige CI-dispatch voor releases        |
| `check-docs`                     | Docs-formattering, lint en controles op gebroken links                                                    | Docs gewijzigd                              |
| `skills-python`                  | Ruff + pytest voor Python-backed Skills                                                                   | Python-skill-relevante wijzigingen          |
| `checks-windows`                 | Windows-specifieke proces-/padtests plus regressies voor gedeelde runtime-importspecificaties             | Windows-relevante wijzigingen               |
| `macos-node`                     | macOS TypeScript-testlane met de gedeelde gebouwde artifacts                                              | macOS-relevante wijzigingen                 |
| `macos-swift`                    | Swift-lint, build en tests voor de macOS-app                                                              | macOS-relevante wijzigingen                 |
| `android`                        | Android-unittests voor beide flavors plus één debug-APK-build                                             | Android-relevante wijzigingen               |
| `test-performance-agent`         | Dagelijkse optimalisatie van trage Codex-tests na vertrouwde activiteit                                   | Succes van hoofd-CI of handmatige dispatch  |
| `openclaw-performance`           | Dagelijkse/op aanvraag Kova-runtimeprestatierapporten met mock-provider, deep-profile en GPT 5.4 live-lanes | Geplande en handmatige dispatch             |

## Fail-fast-volgorde

1. `preflight` bepaalt welke lanes überhaupt bestaan. De logica `docs-scope` en `changed-scope` zijn stappen binnen deze taak, geen zelfstandige taken.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` en `skills-python` falen snel zonder te wachten op de zwaardere artifact- en platformmatrixtaken.
3. `build-artifacts` overlapt met de snelle Linux-lanes, zodat downstreamconsumenten kunnen starten zodra de gedeelde build gereed is.
4. Zwaardere platform- en runtime-lanes waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` en `android`.

GitHub kan vervangen taken als `cancelled` markeren wanneer een nieuwere push op dezelfde PR- of `main`-ref binnenkomt. Behandel dat als CI-ruis, tenzij de nieuwste run voor dezelfde ref ook faalt. Geaggregeerde shardcontroles gebruiken `!cancelled() && always()`, zodat ze nog steeds normale shardfouten rapporteren maar niet in de wachtrij komen nadat de hele workflow al is vervangen. De automatische CI-concurrency-sleutel is geversioneerd (`CI-v7-*`), zodat een GitHub-zombie aan de kant van GitHub in een oude wachtrijgroep nieuwere main-runs niet onbeperkt kan blokkeren. Handmatige full-suite-runs gebruiken `CI-manual-v1-*` en annuleren lopende runs niet.

De taak `ci-timings-summary` uploadt een compact `ci-timings-summary`-artifact voor elke niet-concept-CI-run. Deze registreert wandtijd, wachtrijtijd, traagste taken en mislukte taken voor de huidige run, zodat CI-gezondheidscontroles niet herhaaldelijk de volledige Actions-payload hoeven te scrapen.

## Scope en routering

Scopelogica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unittests in `src/scripts/ci-changed-scope.test.ts`. Handmatige dispatch slaat detectie van gewijzigde scope over en laat het preflight-manifest zich gedragen alsof elk scoped gebied is gewijzigd.

- **CI-workflowbewerkingen** valideren de Node CI-graaf plus workflow-linting, maar forceren op zichzelf geen Windows-, Android- of macOS-native builds; die platform-lanes blijven scoped tot wijzigingen in platformbroncode.
- **Bewerkingen die alleen CI-routering raken, geselecteerde goedkope core-test-fixturebewerkingen en smalle Plugin-contract-helper/test-routeringbewerkingen** gebruiken een snel Node-only manifestpad: `preflight`, beveiliging en één `checks-fast-core`-taak. Dat pad slaat build artifacts, Node 22-compatibiliteit, kanaalcontracten, volledige core-shards, bundled-plugin-shards en aanvullende guardmatrices over wanneer de wijziging beperkt is tot de routerings- of helperoppervlakken die de snelle taak direct oefent.
- **Windows Node-controles** zijn scoped tot Windows-specifieke proces-/padwrappers, npm/pnpm/UI-runnerhelpers, pakketmanagerconfiguratie en de CI-workflowoppervlakken die die lane uitvoeren; niet-gerelateerde bron-, Plugin-, install-smoke- en test-only wijzigingen blijven op de Linux Node-lanes.

De traagste Node-testfamilies zijn gesplitst of gebalanceerd zodat elke taak klein blijft zonder runners te veel te reserveren: kanaalcontracten draaien als drie gewogen Blacksmith-backed shards met de standaard GitHub-runnerfallback, core unit fast/support-lanes draaien apart, core runtime-infra is gesplitst tussen state, process/config, Cron en gedeelde shards, auto-reply draait als gebalanceerde workers (waarbij de reply-subtree is gesplitst in agent-runner-, dispatch- en commands/state-routing-shards), en agentic Gateway/server-configs zijn verdeeld over chat/auth/model/http-plugin/runtime/startup-lanes in plaats van te wachten op gebouwde artifacts. Brede browser-, QA-, media- en diverse Plugin-tests gebruiken hun eigen Vitest-configs in plaats van de gedeelde Plugin-catch-all. Include-pattern-shards registreren timingvermeldingen met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een hele config kan onderscheiden van een gefilterde shard. `check-additional` houdt package-boundary compile/canary-werk bij elkaar en scheidt runtime-topologiearchitectuur van Gateway watch-dekking; de boundary-guardlijst is over vier matrixshards gestreept, waarbij elke shard geselecteerde onafhankelijke guards gelijktijdig uitvoert en timings per controle print. De dure Codex happy-path prompt-snapshot-driftcontrole draait als eigen aanvullende taak voor handmatige CI en alleen voor prompt-beïnvloedende wijzigingen, zodat normale niet-gerelateerde Node-wijzigingen niet wachten op koude prompt-snapshotgeneratie en de boundary-shards gebalanceerd blijven terwijl prompt-drift nog steeds wordt vastgepind op de PR die dit veroorzaakte; dezelfde flag slaat prompt-snapshot-Vitest-generatie over binnen de gebouwde-artifact core support-boundary-shard. Gateway watch, kanaaltests en de core support-boundary-shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd.

Android CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play debug-APK. De third-party flavor heeft geen afzonderlijke sourceset of manifest; de unittest-lane compileert de flavor nog steeds met de SMS-/call-log-BuildConfig-flags, terwijl een dubbele debug-APK-packagingtaak bij elke Android-relevante push wordt vermeden.

De shard `check-dependencies` draait `pnpm deadcode:dependencies` (een productie-Knip-pass alleen voor dependencies, vastgezet op de nieuwste Knip-versie, waarbij pnpm's minimale releaseleeftijd is uitgeschakeld voor de `dlx`-installatie) en `pnpm deadcode:unused-files`, dat Knip's productiebevindingen voor ongebruikte bestanden vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. De guard voor ongebruikte bestanden faalt wanneer een PR een nieuw niet-beoordeeld ongebruikt bestand toevoegt of een verouderde allowlist-vermelding laat staan, terwijl bewuste dynamische Plugin-, gegenereerde, build-, live-test- en pakketbrugoppervlakken behouden blijven die Knip niet statisch kan oplossen.

## ClawSweeper-activiteit doorsturen

`.github/workflows/clawsweeper-dispatch.yml` is de target-side bridge van OpenClaw-repositoryactiviteit naar ClawSweeper. Deze checkt geen onvertrouwde pull request-code uit en voert die niet uit. De workflow maakt een GitHub App-token aan vanuit `CLAWSWEEPER_APP_PRIVATE_KEY` en dispatcht vervolgens compacte `repository_dispatch`-payloads naar `openclaw/clawsweeper`.

De workflow heeft vier lanes:

- `clawsweeper_item` voor exacte reviewverzoeken voor issues en pull requests;
- `clawsweeper_comment` voor expliciete ClawSweeper-commands in issue-opmerkingen;
- `clawsweeper_commit_review` voor reviewverzoeken op commitniveau bij `main`-pushes;
- `github_activity` voor algemene GitHub-activiteit die de ClawSweeper-agent kan inspecteren.

De lane `github_activity` stuurt alleen genormaliseerde metadata door: eventtype, actie, actor, repository, itemnummer, URL, titel, status en korte fragmenten voor opmerkingen of reviews wanneer aanwezig. Deze vermijdt bewust het doorsturen van de volledige webhook-body. De ontvangende workflow in `openclaw/clawsweeper` is `.github/workflows/github-activity.yml`, die het genormaliseerde event naar de OpenClaw Gateway-hook voor de ClawSweeper-agent post.

Algemene activiteit is observatie, geen standaardlevering. De ClawSweeper-agent ontvangt het Discord-doel in zijn prompt en hoort alleen naar `#clawsweeper` te posten wanneer het event verrassend, actiegericht, riskant of operationeel nuttig is. Routinematige opens, bewerkingen, botruis, dubbele Webhook-ruis en normaal reviewverkeer horen te resulteren in `NO_REPLY`.

Behandel GitHub-titels, opmerkingen, bodies, reviewtekst, branchnamen en commitberichten in dit hele pad als niet-vertrouwde gegevens. Ze zijn input voor samenvatting en triage, geen instructies voor de workflow of de agent-runtime.

## Handmatige dispatches

Handmatige CI-dispatches voeren dezelfde jobgrafiek uit als normale CI, maar zetten elke niet-Android scoped lane geforceerd aan: Linux Node-shards, gebundelde-plugin-shards, kanaalcontracten, Node 22-compatibiliteit, `check`, `check-additional`, build smoke, docs-controles, Python Skills, Windows, macOS en Control UI-i18n. Losstaande handmatige CI-dispatches voeren Android alleen uit met `include_android=true`; de volledige release-umbrella schakelt Android in door `include_android=true` door te geven. Plugin-prerelease statische controles, de release-only `agentic-plugins`-shard, de volledige batch-sweep van extensies en Plugin-prerelease Docker-lanes zijn uitgesloten van CI. De Docker-prerelease-suite draait alleen wanneer `Full Release Validation` de afzonderlijke `Plugin Prerelease`-workflow dispatcht met de release-validatiegate ingeschakeld.

Handmatige runs gebruiken een unieke concurrency-groep, zodat een volledige suite voor een releasekandidaat niet wordt geannuleerd door een andere push- of PR-run op dezelfde ref. De optionele `target_ref`-input laat een vertrouwde caller die grafiek uitvoeren tegen een branch, tag of volledige commit-SHA terwijl het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, snelle security-jobs en aggregaties (`security-scm-fast`, `security-dependency-audit`, `security-fast`), snelle protocol-/contract-/gebundelde-controles, gesharde kanaalcontractcontroles, `check`-shards behalve lint, `check-additional`-aggregaties, Node-testaggregatieverifiers, docs-controles, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight gebruikt ook GitHub-gehoste Ubuntu zodat de Blacksmith-matrix eerder kan queuen |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lichtere extensieshards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` en `check-test-types`                                                                                                                                                                                                                                                                                                                |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke, Linux Node-testshards, gebundelde Plugin-testshards, `check-additional`-shards, `android`                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint` (CPU-gevoelig genoeg dat 8 vCPU meer kostte dan het opleverde); install-smoke Docker-builds (32-vCPU-wachtrijtijd kostte meer dan het opleverde)                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                   |

CI van de canonieke repo houdt Blacksmith als het standaard runner-pad. Tijdens `preflight` controleert `scripts/ci-runner-labels.mjs` recente gequeuede en lopende Actions-runs op gequeuede Blacksmith-jobs. Als een specifiek Blacksmith-label al gequeuede jobs heeft, vallen downstream jobs die dat exacte label zouden gebruiken alleen voor die run terug op de bijpassende GitHub-gehoste runner (`ubuntu-24.04`, `windows-2025` of `macos-latest`). Andere Blacksmith-groottes in dezelfde OS-familie blijven op hun primaire labels. Als de API-probe faalt, wordt geen fallback toegepast.

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

`OpenClaw Performance` is de performance-workflow voor product/runtime. Deze draait dagelijks op `main` en kan handmatig worden gedispatcht:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Een handmatige dispatch benchmarkt normaal gesproken de workflow-ref. Stel `target_ref` in om een release-tag of een andere branch te benchmarken met de huidige workflow-implementatie. Gepubliceerde rapportpaden en nieuwste pointers worden keyed op de geteste ref, en elke `index.md` registreert de geteste ref/SHA, workflow-ref/SHA, Kova-ref, profiel, lane-authmodus, model, herhalingsaantal en scenariofilters.

De workflow installeert OCM vanuit een gepinde release en Kova vanuit `openclaw/Kova` op de gepinde `kova_ref`-input, en voert daarna drie lanes uit:

- `mock-provider`: diagnostische Kova-scenario's tegen een local-build runtime met deterministische fake OpenAI-compatibele auth.
- `mock-deep-profile`: CPU-/heap-/traceprofilering voor hotspots bij startup, Gateway en agent-turn.
- `live-gpt54`: een echte OpenAI `openai/gpt-5.4` agent-turn, overgeslagen wanneer `OPENAI_API_KEY` niet beschikbaar is.

De mock-provider-lane voert na de Kova-pass ook OpenClaw-native source-probes uit: timing en geheugen voor het opstarten van de Gateway over default-, hook- en 50-plugin-startupcases; herhaalde mock-OpenAI `channel-chat-baseline` hello-loops; en CLI-startupcommando's tegen de opgestarte Gateway. De Markdown-samenvatting van de source-probe staat in `source/index.md` in de rapportbundel, met ruwe JSON ernaast.

Elke lane uploadt GitHub-artefacten. Wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd, commit de workflow ook `report.json`, `report.md`, bundels, `index.md` en source-probe-artefacten naar `openclaw/clawgrit-reports` onder `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. De huidige geteste-ref-pointer wordt geschreven als `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Volledige releasevalidatie

`Full Release Validation` is de handmatige umbrella-workflow voor "alles uitvoeren vóór release". Deze accepteert een branch, tag of volledige commit-SHA, dispatcht de handmatige `CI`-workflow met dat target, dispatcht `Plugin Prerelease` voor release-only Plugin-/package-/static-/Docker-bewijs, en dispatcht `OpenClaw Release Checks` voor install smoke, package acceptance, cross-OS package-controles, QA Lab-pariteit, Matrix en Telegram-lanes. Stabiele/default runs houden uitputtende live/E2E- en Docker-releasepaddekking achter `run_release_soak=true`; `release_profile=full` forceert die soak-dekking aan zodat brede advisory-validatie breed blijft. Met `rerun_group=all` en `release_profile=full` voert deze ook `NPM Telegram Beta E2E` uit tegen het `release-package-under-test`-artefact van release checks. Geef na publicatie `npm_telegram_package_spec` door om dezelfde Telegram-package-lane opnieuw uit te voeren tegen het gepubliceerde npm-pakket.

Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
stagematrix, exacte workflowjobnamen, profielverschillen, artefacten en
gerichte rerun-handles.

`OpenClaw Release Publish` is de handmatige muterende release-workflow. Dispatch deze
vanuit `release/YYYY.M.D` of `main` nadat de release-tag bestaat en nadat de
OpenClaw npm-preflight is geslaagd. Deze verifieert `pnpm plugins:sync:check`,
dispatcht `Plugin NPM Release` voor alle publiceerbare Plugin-pakketten, dispatcht
`Plugin ClawHub Release` voor dezelfde release-SHA, en dispatcht pas daarna
`OpenClaw NPM Release` met de opgeslagen `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Gebruik voor bewijs van een vastgepinde commit op een snel bewegende branch de helper in plaats van
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-workflowdispatch-refs moeten branches of tags zijn, geen ruwe commit-SHA's. De
helper pusht een tijdelijke `release-ci/<sha>-...`-branch op de doel-SHA,
dispatcht `Full Release Validation` vanaf die vastgepinde ref, verifieert dat elke
childworkflow-`headSha` overeenkomt met het doel, en verwijdert de tijdelijke branch wanneer de
run is voltooid. De overkoepelende verificateur faalt ook als een childworkflow op een
andere SHA draaide.

`release_profile` bepaalt de live/provider-breedte die aan releasechecks wordt doorgegeven. De
handmatige releaseworkflows gebruiken standaard `stable`; gebruik `full` alleen wanneer je
bewust de brede adviserende provider/media-matrix wilt. `run_release_soak`
bepaalt of stable/default-releasechecks de uitputtende live/E2E- en
Docker-releasepad-soak uitvoeren; `full` forceert soak aan.

- `minimum` behoudt de snelste OpenAI/core-releasekritieke lanes.
- `stable` voegt de stabiele provider/backend-set toe.
- `full` draait de brede adviserende provider/media-matrix.

De overkoepelende workflow registreert de gedispatchte child-run-id's, en de laatste `Verify full validation`-job controleert de huidige conclusies van child-runs opnieuw en voegt tabellen met langzaamste jobs toe voor elke child-run. Als een childworkflow opnieuw wordt gedraaid en groen wordt, draai dan alleen de parent-verificateurjob opnieuw om het overkoepelende resultaat en de timingsamenvatting te verversen.

Voor herstel accepteren zowel `Full Release Validation` als `OpenClaw Release Checks` `rerun_group`. Gebruik `all` voor een release candidate, `ci` voor alleen de normale volledige CI-child, `plugin-prerelease` voor alleen de plugin-prerelease-child, `release-checks` voor elke release-child, of een nauwere groep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, of `npm-telegram` op de overkoepelende workflow. Dit houdt een rerun van een mislukte releasebox begrensd na een gerichte fix. Combineer voor één mislukte cross-OS-lane `rerun_group=cross-os` met `cross_os_suite_filter`, bijvoorbeeld `windows/packaged-upgrade`; lange cross-OS-commando's geven Heartbeat-regels uit en packaged-upgrade-samenvattingen bevatten timings per fase. QA-releasechecklanes zijn adviserend, dus QA-only-fouten waarschuwen maar blokkeren de releasecheckverificateur niet.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde ref één keer te herleiden tot een `release-package-under-test`-tarball, en geeft dat artefact vervolgens door aan cross-OS-checks en Pakketacceptatie, plus de live/E2E-releasepad-Docker-workflow wanneer soak-dekking draait. Dat houdt de pakketbytes consistent over releaseboxen heen en voorkomt dat dezelfde candidate in meerdere childjobs opnieuw wordt ingepakt.

Dubbele `Full Release Validation`-runs voor `ref=main` en `rerun_group=all`
vervangen de oudere overkoepelende workflow. De parentmonitor annuleert elke childworkflow die hij
al heeft gedispatcht wanneer de parent wordt geannuleerd, zodat nieuwere main-validatie
niet achter een verouderde releasecheck-run van twee uur blijft hangen. Validatie van releasebranches/tags
en gerichte rerun-groepen behouden `cancel-in-progress: false`.

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
- gesplitste media-audio/video-shards en provider-gefilterde music-shards

Dat behoudt dezelfde bestandsdekking en maakt trage live-providerfouten gemakkelijker opnieuw te draaien en te diagnosticeren. De geaggregeerde shardnamen `native-live-extensions-o-z`, `native-live-extensions-media` en `native-live-extensions-media-music` blijven geldig voor handmatige eenmalige reruns.

De native live media-shards draaien in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de `Live Media Runner Image`-workflow. Die image installeert `ffmpeg` en `ffprobe` vooraf; mediajobs verifiëren alleen de binaries vóór setup. Houd Docker-ondersteunde live suites op normale Blacksmith-runners — containerjobs zijn de verkeerde plek om geneste Docker-tests te starten.

Docker-ondersteunde live model/backend-shards gebruiken een afzonderlijke gedeelde `ghcr.io/openclaw/openclaw-live-test:<sha>`-image per geselecteerde commit. De live releaseworkflow bouwt en pusht die image één keer, waarna de Docker live model-, provider-sharded Gateway-, CLI-backend-, ACP bind- en Codex harness-shards draaien met `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker-shards hebben expliciete time-outlimieten op scriptniveau onder de workflowjobtime-out, zodat een vastgelopen container of opruimpad snel faalt in plaats van het hele releasecheckbudget te verbruiken. Als die shards de volledige source-Docker-target onafhankelijk opnieuw bouwen, is de release-run verkeerd geconfigureerd en verspilt die wandkloktijd aan dubbele image-builds.

## Pakketacceptatie

Gebruik `Package Acceptance` wanneer de vraag is: "werkt dit installeerbare OpenClaw-pakket als product?" Het verschilt van normale CI: normale CI valideert de source tree, terwijl pakketacceptatie één tarball valideert via dezelfde Docker E2E-harness die gebruikers na installatie of update uitvoeren.

### Jobs

1. `resolve_package` checkt `workflow_ref` uit, herleidt één pakketcandidate, schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het `package-under-test`-artefact, en print de bron, workflow-ref, pakket-ref, versie, SHA-256 en het profiel in de GitHub-stapsamenvatting.
2. `docker_acceptance` roept `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt dat artefact, valideert de tarball-inventaris, bereidt pakketdigest-Docker-images voor wanneer nodig, en draait de geselecteerde Docker-lanes tegen dat pakket in plaats van de workflowcheckout in te pakken. Wanneer een profiel meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het pakket en de gedeelde images één keer voor, en waaiert die lanes vervolgens uit als parallelle gerichte Docker-jobs met unieke artefacten.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Dit draait wanneer `telegram_mode` niet `none` is en installeert hetzelfde `package-under-test`-artefact wanneer Pakketacceptatie er een heeft herleid; standalone Telegram-dispatch kan nog steeds een gepubliceerde npm-spec installeren.
4. `summary` laat de workflow falen als pakketherleiding, Docker-acceptatie of de optionele Telegram-lane is mislukt.

### Candidatebronnen

- `source=npm` accepteert alleen `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor acceptatie van gepubliceerde prerelease/stable-pakketten.
- `source=ref` pakt een vertrouwde `package_ref`-branch, tag of volledige commit-SHA in. De resolver haalt OpenClaw-branches/tags op, verifieert dat de geselecteerde commit bereikbaar is vanuit repositorybranchgeschiedenis of een releasetag, installeert dependencies in een detached worktree, en pakt die in met `scripts/package-openclaw-for-docker.mjs`.
- `source=url` downloadt een HTTPS-`.tgz`; `package_sha256` is verplicht.
- `source=artifact` downloadt één `.tgz` uit `artifact_run_id` en `artifact_name`; `package_sha256` is optioneel maar moet worden opgegeven voor extern gedeelde artefacten.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde workflow/harness-code die de test draait. `package_ref` is de sourcecommit die wordt ingepakt wanneer `source=ref`. Hierdoor kan de huidige testharness oudere vertrouwde sourcecommits valideren zonder oude workflowlogica te draaien.

### Suiteprofielen

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — volledige Docker-releasepadchunks met OpenWebUI
- `custom` — exacte `docker_lanes`; vereist wanneer `suite_profile=custom`

Het `package`-profiel gebruikt offline plugindekking zodat validatie van gepubliceerde pakketten niet afhankelijk is van live ClawHub-beschikbaarheid. De optionele Telegram-lane hergebruikt het `package-under-test`-artefact in `NPM Telegram Beta E2E`, waarbij het gepubliceerde npm-specpad behouden blijft voor standalone dispatches.

Zie [Updates en plugins testen](/nl/help/testing-updates-plugins) voor het specifieke update- en plugintestbeleid, inclusief lokale commando's,
Docker-lanes, Pakketacceptatie-inputs, release-defaults en fouttriage.

Releasechecks roepen Pakketacceptatie aan met `source=artifact`, het voorbereide releasepakketartefact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, en `telegram_mode=mock-openai`. Dit houdt pakketmigratie, update, live ClawHub-skillinstallatie, opruiming van verouderde plugin-dependencies, reparatie van geconfigureerde plugininstallatie, offline plugin, plugin-update en Telegram-bewijs op dezelfde herleide pakkettarball. Stel `package_acceptance_package_spec` in op Full Release Validation of OpenClaw Release Checks om diezelfde matrix tegen een verzonden npm-pakket te draaien in plaats van het uit de SHA gebouwde artefact. Cross-OS-releasechecks dekken nog steeds OS-specifieke onboarding, installer en platformgedrag; pakket/update-productvalidatie moet beginnen met Pakketacceptatie. De `published-upgrade-survivor`-Docker-lane valideert één gepubliceerde pakketbaseline per run in het blokkerende releasepad. In Pakketacceptatie is de herleide `package-under-test`-tarball altijd de candidate en selecteert `published_upgrade_survivor_baseline` de fallback gepubliceerde baseline, standaard `openclaw@latest`; failed-lane-reruncommando's behouden die baseline. Full Release Validation met `run_release_soak=true` of `release_profile=full` stelt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` en `published_upgrade_survivor_scenarios=reported-issues` in om uit te breiden over de vier nieuwste stable npm-releases plus vastgepinde plugin-compatibiliteitsgrensreleases en issue-vormige fixtures voor Feishu-configuratie, behouden bootstrap/persona-bestanden, geconfigureerde OpenClaw-plugininstallaties, tilde-logpaden en verouderde legacy plugin-dependencyroots. Multi-baseline published-upgrade-survivor-selecties worden per baseline geshard naar afzonderlijke gerichte Docker-runnerjobs. De afzonderlijke `Update Migration`-workflow gebruikt de `update-migration`-Docker-lane met `all-since-2026.4.23` en `plugin-deps-cleanup` wanneer de vraag uitputtende opruiming van gepubliceerde updates is, niet normale Full Release CI-breedte. Lokale geaggregeerde runs kunnen exacte pakketspecs doorgeven met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, één enkele lane behouden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` zoals `openclaw@2026.4.15`, of `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` instellen voor de scenariomatrix. De gepubliceerde lane configureert de baseline met een ingebakken `openclaw config set`-commandorecept, registreert receptstappen in `summary.json`, en peilt `/healthz`, `/readyz`, plus RPC-status na Gateway-start. De Windows packaged- en installer fresh-lanes verifiëren ook dat een geïnstalleerd pakket een browser-control-override kan importeren vanaf een ruw absoluut Windows-pad. De OpenAI cross-OS agent-turn smoke gebruikt standaard `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer ingesteld, anders `openai/gpt-5.4`, zodat het installatie- en Gateway-bewijs op een GPT-5-testmodel blijft terwijl GPT-4.x-defaults worden vermeden.

### Vensters voor legacycompatibiliteit

Pakketacceptatie heeft begrensde vensters voor legacycompatibiliteit voor al gepubliceerde pakketten. Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen het compatibiliteitspad gebruiken:

- bekende privé-QA-vermeldingen in `dist/postinstall-inventory.json` mogen verwijzen naar bestanden die uit de tarball zijn weggelaten;
- `doctor-switch` mag de persistentiesubcase `gateway install --wrapper` overslaan wanneer het pakket die vlag niet aanbiedt;
- `update-channel-switch` mag ontbrekende `pnpm.patchedDependencies` verwijderen uit de van de tarball afgeleide nep-git-fixture en mag ontbrekende gepersisteerde `update.channel` loggen;
- Plugin-smokes mogen legacy-locaties voor installatierecords lezen of ontbrekende persistentie van marketplace-installatierecords accepteren;
- `plugin-update` mag migratie van configuratiemetadata toestaan, terwijl nog steeds wordt vereist dat het installatierecord en het gedrag zonder herinstallatie ongewijzigd blijven.

Het gepubliceerde pakket `2026.4.26` mag ook waarschuwen voor stempelbestanden met lokale buildmetadata die al waren meegeleverd. Latere pakketten moeten voldoen aan de moderne contracten; dezelfde voorwaarden falen dan in plaats van te waarschuwen of over te slaan.

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

Begin bij het debuggen van een mislukte pakketacceptatierun met de samenvatting van `resolve_package` om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de onderliggende run `docker_acceptance` en de Docker-artefacten ervan: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logs, fasetimings en rerun-opdrachten. Geef de voorkeur aan het opnieuw uitvoeren van het mislukte pakketprofiel of de exacte Docker-lanes in plaats van de volledige releasevalidatie opnieuw uit te voeren.

## Installatiesmoke

De aparte workflow `Install Smoke` hergebruikt hetzelfde scopescript via zijn eigen `preflight`-job. Deze splitst smoke-dekking in `run_fast_install_smoke` en `run_full_install_smoke`.

- **Snel pad** draait voor pull requests die Docker-/pakketoppervlakken raken, wijzigingen aan meegeleverde Plugin-pakketten/-manifesten, of core Plugin-/channel-/Gateway-/Plugin SDK-oppervlakken die door de Docker-smokejobs worden getest. Wijzigingen aan alleen broncode van meegeleverde Plugins, wijzigingen die alleen tests raken en wijzigingen die alleen docs raken, reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image één keer, controleert de CLI, draait de CLI-smoke voor gedeelde werkruimte verwijderen door agents, draait de container-Gateway-netwerk-e2e, verifieert een build-arg voor een meegeleverde Plugin en draait het begrensde Docker-profiel voor meegeleverde Plugins met een totale opdrachttime-out van 240 seconden (elke Docker-run van elk scenario wordt afzonderlijk begrensd).
- **Volledig pad** behoudt QR-pakketinstallatie en installer-Docker-/updatedekking voor nachtelijke geplande runs, handmatige dispatches, workflow-call-releasecontroles en pull requests die echt installer-/pakket-/Docker-oppervlakken raken. In volledige modus bereidt install-smoke één doel-SHA GHCR root-Dockerfile-smoke-image voor of hergebruikt die, en draait daarna QR-pakketinstallatie, root-Dockerfile-/Gateway-smokes, installer-/update-smokes en de snelle Docker-E2E voor meegeleverde Plugins als aparte jobs, zodat installerwerk niet hoeft te wachten achter de root-image-smokes.

`main`-pushes (inclusief mergecommits) forceren het volledige pad niet; wanneer de changed-scope-logica volledige dekking zou aanvragen op een push, behoudt de workflow de snelle Docker-smoke en laat de volledige installatiesmoke over aan nachtelijke of releasevalidatie.

De langzame Bun global install image-provider-smoke wordt apart gated door `run_bun_global_install_smoke`. Deze draait volgens het nachtelijke schema en vanuit de workflow voor releasecontroles, en handmatige `Install Smoke`-dispatches kunnen ervoor kiezen deze mee te nemen, maar pull requests en `main`-pushes doen dat niet. QR- en installer-Docker-tests behouden hun eigen installatiegerichte Dockerfiles.

## Lokale Docker-E2E

`pnpm test:docker:all` bouwt vooraf één gedeelde live-testimage, verpakt OpenClaw één keer als een npm-tarball en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images:

- een kale Node/Git-runner voor installer-/update-/plugin-afhankelijkheidslanes;
- een functionele image die dezelfde tarball in `/app` installeert voor normale functionaliteitslanes.

Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en draait daarna lanes met `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Instelopties

| Variabele                              | Standaard | Doel                                                                                          |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Aantal main-pool-slots voor normale lanes.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Aantal providergevoelige tail-pool-slots.                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limiet voor gelijktijdige live-lanes zodat providers niet throttlen.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limiet voor gelijktijdige npm-install-lanes.                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limiet voor gelijktijdige multi-service-lanes.                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Spreiding tussen lane-starts om Docker-daemon-aanmaakpieken te voorkomen; zet op `0` voor geen spreiding. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Fallbacktime-out per lane (120 minuten); geselecteerde live-/tail-lanes gebruiken strakkere limieten. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset     | `1` print het schedulerplan zonder lanes te draaien.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset     | Door komma's gescheiden exacte lanelijst; slaat cleanup-smoke over zodat agents één mislukte lane kunnen reproduceren. |

Een lane die zwaarder is dan zijn effectieve limiet kan nog steeds starten vanuit een lege pool en draait daarna alleen totdat hij capaciteit vrijgeeft. De lokale aggregatie voert Docker-preflights uit, verwijdert verouderde OpenClaw-E2E-containers, geeft actieve-lane-status weer, persisteert lanetimings voor sortering van langste eerst en stopt standaard met het plannen van nieuwe gepoolde lanes na de eerste fout.

### Herbruikbare live-/E2E-workflow

De herbruikbare live-/E2E-workflow vraagt `scripts/test-docker-all.mjs --plan-json` welke pakket-, imagekind-, live-image-, lane- en credentialdekking vereist is. `scripts/docker-e2e.mjs` zet dat plan daarna om in GitHub-outputs en samenvattingen. Het verpakt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een pakketartefact uit de huidige run, of downloadt een pakketartefact uit `package_artifact_run_id`; valideert de tarball-inventory; bouwt en pusht pakketdigest-getagde kale/functionele GHCR Docker-E2E-images via Blacksmiths Docker-layercache wanneer het plan lanes met geïnstalleerd pakket nodig heeft; en hergebruikt meegegeven inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` of bestaande pakketdigest-images in plaats van opnieuw te bouwen. Docker-image-pulls worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry-/cachestream snel opnieuw probeert in plaats van het grootste deel van het kritieke CI-pad te verbruiken.

### Releasepad-chunks

Release-Docker-dekking draait kleinere gechunkte jobs met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elke chunk alleen het imagekind pullt dat hij nodig heeft en meerdere lanes via dezelfde gewogen scheduler uitvoert:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Huidige release-Docker-chunks zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` en `plugins-runtime-install-a` tot en met `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` en `plugins-integrations` blijven aggregate Plugin-/runtime-aliassen. De lane-alias `install-e2e` blijft de aggregate handmatige rerun-alias voor beide provider-installerlanes.

OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige releasepad-dekking dit aanvraagt, en behoudt alleen voor OpenWebUI-only-dispatches een zelfstandige `openwebui`-chunk. Updatelanes voor meegeleverde channels proberen één keer opnieuw bij tijdelijke npm-netwerkfouten.

Elke chunk uploadt `.artifacts/docker-tests/` met lane-logs, timings, `summary.json`, `failures.json`, fasetimings, schedulerplan-JSON, tabellen met trage lanes en rerun-opdrachten per lane. De workflowinput `docker_lanes` draait geselecteerde lanes tegen de voorbereide images in plaats van de chunkjobs. Daarmee blijft debuggen van mislukte lanes beperkt tot één gerichte Docker-job en wordt het pakketartefact voor die run voorbereid, gedownload of hergebruikt; als een geselecteerde lane een live-Docker-lane is, bouwt de gerichte job de live-testimage lokaal voor die rerun. Gegenereerde GitHub-rerun-opdrachten per lane bevatten `package_artifact_run_id`, `package_artifact_name` en voorbereide image-inputs wanneer die waarden bestaan, zodat een mislukte lane exact hetzelfde pakket en dezelfde images uit de mislukte run kan hergebruiken.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

De geplande live-/E2E-workflow draait dagelijks de volledige releasepad-Docker-suite.

## Plugin-voorrelease

`Plugin Prerelease` is duurdere product-/pakketdekking, dus het is een aparte workflow die wordt gedispatcht door `Full Release Validation` of door een expliciete operator. Normale pull requests, `main`-pushes en zelfstandige handmatige CI-dispatches houden die suite uitgeschakeld. Het verdeelt tests voor meegeleverde Plugins over acht Plugin-workers; die Plugin-shardjobs draaien tot twee Plugin-configuratiegroepen tegelijk met één Vitest-worker per groep en een grotere Node-heap, zodat importzware Plugin-batches geen extra CI-jobs aanmaken. Het release-only Docker-voorreleasepad batcht gerichte Docker-lanes in kleine groepen om te voorkomen dat tientallen runners worden gereserveerd voor jobs van één tot drie minuten.

## QA Lab

QA Lab heeft eigen CI-lanes buiten de belangrijkste smart-scoped workflow. Agentic parity is genest onder de brede QA- en releaseharnesses, niet onder een zelfstandige PR-workflow. Gebruik `Full Release Validation` met `rerun_group=qa-parity` wanneer parity moet meelopen met een brede validatierun.

- De workflow `QA-Lab - All Lanes` draait nachtelijk op `main` en bij handmatige dispatch; deze waaiert de mock parity-lane, live Matrix-lane en live Telegram- en Discord-lanes uit als parallelle jobs. Live-jobs gebruiken de omgeving `qa-live-shared`, en Telegram/Discord gebruiken Convex-leases.

Release-controles voeren Matrix- en Telegram-live-transportlanes uit met de deterministische mockprovider en mock-gekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het kanaalcontract geïsoleerd is van live-modellatentie en het normale opstarten van provider-plugins. De live-transport-Gateway schakelt geheugenzoekopdrachten uit omdat QA-pariteit geheugengedrag apart dekt; providerconnectiviteit wordt gedekt door de afzonderlijke suites voor live modellen, native providers en Docker-providers.

Matrix gebruikt `--profile fast` voor geplande en release-gates, met toevoeging van `--fail-fast` alleen wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaard en handmatige workflowinvoer blijven `all`; handmatige `matrix_profile=all`-dispatch shardt volledige Matrix-dekking altijd in `transport`-, `media`-, `e2ee-smoke`-, `e2ee-deep`- en `e2ee-cli`-jobs.

`OpenClaw Release Checks` voert ook de releasekritieke QA Lab-lanes uit vóór releasegoedkeuring; de QA-pariteitsgate voert de kandidaat- en baseline-packs uit als parallelle lane-jobs en downloadt daarna beide artefacten naar een kleine rapportjob voor de uiteindelijke pariteitsvergelijking.

Volg voor normale PR's scoped CI-/controlebewijs in plaats van pariteit als vereiste status te behandelen.

## CodeQL

De `CodeQL`-workflow is bewust een smalle beveiligingsscanner voor een eerste pass, niet de volledige repository-sweep. Dagelijkse, handmatige en niet-draft pull-request guard-runs scannen Actions-workflowcode plus de JavaScript-/TypeScript-oppervlakken met het hoogste risico met beveiligingsquery's met hoge betrouwbaarheid, gefilterd op hoge/kritieke `security-severity`.

De pull-request guard blijft licht: die start alleen voor wijzigingen onder `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` of `src`, en voert dezelfde beveiligingsmatrix met hoge betrouwbaarheid uit als de geplande workflow. Android en macOS CodeQL blijven buiten de PR-standaarden.

### Beveiligingscategorieën

| Categorie                                         | Oppervlak                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron en Gateway-baseline                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Implementatiecontracten van kernkanalen plus de channel-Plugin-runtime, Gateway, Plugin SDK, secrets en audit-aanraakpunten        |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP-parsing, netwerkguard, web-fetch en SSRF-beleidsoppervlakken van de Plugin SDK                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-servers, helpers voor procesuitvoering, outbound delivery en gates voor tooluitvoering door agents                             |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-installatie, loader, manifest, registry, package-manager-installatie, source-loading en trust-oppervlakken van het Plugin SDK-pakketcontract |

### Platformspecifieke beveiligingsshards

- `CodeQL Android Critical Security` — geplande Android-beveiligingsshard. Bouwt de Android-app handmatig voor CodeQL op de kleinste Blacksmith Linux-runner die door workflow-sanity wordt geaccepteerd. Uploadt onder `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — wekelijkse/handmatige macOS-beveiligingsshard. Bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert dependency-buildresultaten uit de geüploade SARIF en uploadt onder `/codeql-critical-security/macos`. Buiten de dagelijkse standaarden gehouden omdat de macOS-build de runtime domineert, zelfs wanneer die schoon is.

### Critical Quality-categorieën

`CodeQL Critical Quality` is de bijbehorende niet-beveiligingsshard. Deze voert alleen fout-ernst, niet-beveiligingsgerichte JavaScript-/TypeScript-kwaliteitsquery's uit over smalle, waardevolle oppervlakken op de kleinere Blacksmith Linux-runner. De pull-request guard is bewust kleiner dan het geplande profiel: niet-draft PR's voeren alleen de overeenkomende shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` en `plugin-sdk-reply-runtime` uit voor wijzigingen in agentopdracht-/model-/tooluitvoering en reply-dispatchcode, configschema-/migratie-/IO-code, auth-/secrets-/sandbox-/beveiligingscode, kernkanaal- en gebundelde channel-Plugin-runtime, Gateway-protocol/servermethode, geheugenruntime/SDK-koppeling, MCP/proces/outbound delivery, providerruntime/modelcatalogus, sessiediagnostiek/delivery queues, Plugin-loader, Plugin SDK/package-contract of Plugin SDK reply-runtime. CodeQL-config- en kwaliteitsworkflowwijzigingen voeren alle twaalf PR-kwaliteitsshards uit.

Handmatige dispatch accepteert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

De smalle profielen zijn onderwijs-/iteratiehooks om één kwaliteitsshard geïsoleerd uit te voeren.

| Categorie                                               | Oppervlak                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secrets, sandbox, cron en beveiligingsgrenscode van de Gateway                                                                                              |
| `/codeql-critical-quality/config-boundary`              | Configschema-, migratie-, normalisatie- en IO-contracten                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-protocolschema's en servermethodecontracten                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementatiecontracten van kernkanaal en gebundelde channel-Plugin                                                                                               |
| `/codeql-critical-quality/agent-runtime-boundary`       | Opdrachtuitvoering, model-/providerdispatch, auto-reply-dispatch en queues, en runtimecontracten van het ACP-control-plane                                       |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-servers en toolbridges, helpers voor processupervisie en outbound-deliverycontracten                                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, facades voor memory runtime, memory Plugin SDK-aliassen, activatiekoppeling voor memory runtime en memory doctor-opdrachten                      |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internals van reply queues, delivery queues voor sessies, helpers voor outbound sessiebinding/delivery, diagnostische event-/logbundeloppervlakken en CLI-contracten voor session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Inbound reply-dispatch van Plugin SDK, helpers voor reply-payload/chunking/runtime, channel reply-opties, delivery queues en helpers voor sessie-/threadbinding   |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisatie van modelcatalogus, provider-auth en -discovery, providerruntime-registratie, providerstandaarden/-catalogi en registries voor web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap van control-UI, lokale persistentie, Gateway-control flows en runtimecontracten van task-control-plane                                                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search, media-IO, mediabegrip, image-generation en runtimecontracten voor media-generation                                                         |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, registry-, public-surface- en Plugin SDK-entrypointcontracten                                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Gepubliceerde pakket-side Plugin SDK-broncode en helpers voor Plugin-pakketcontracten                                                                             |

Kwaliteit blijft gescheiden van beveiliging zodat kwaliteitsbevindingen kunnen worden gepland, gemeten, uitgeschakeld of uitgebreid zonder het beveiligingssignaal te verhullen. Swift-, Python- en gebundelde-Plugin-CodeQL-uitbreiding moeten alleen als scoped of geshard vervolgwerk worden teruggezet nadat de smalle profielen een stabiele runtime en stabiel signaal hebben.

## Onderhoudsworkflows

### Docs Agent

De `Docs Agent`-workflow is een event-gedreven Codex-onderhoudslane om bestaande documentatie afgestemd te houden op recent gelande wijzigingen. Deze heeft geen zuiver schema: een succesvolle niet-bot push-CI-run op `main` kan hem triggeren, en handmatige dispatch kan hem rechtstreeks uitvoeren. Workflow-run-invocaties worden overgeslagen wanneer `main` verder is gegaan of wanneer in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is aangemaakt. Wanneer hij draait, beoordeelt hij de commitreeks van de vorige niet-overgeslagen Docs Agent-bron-SHA tot de huidige `main`, zodat één uurlijkse run alle main-wijzigingen kan dekken die sinds de laatste documentatiepass zijn verzameld.

### Test Performance Agent

De `Test Performance Agent`-workflow is een event-gedreven Codex-onderhoudslane voor trage tests. Deze heeft geen zuiver schema: een succesvolle niet-bot push-CI-run op `main` kan hem triggeren, maar hij slaat over als er die UTC-dag al een andere workflow-run-invocatie heeft gedraaid of draait. Handmatige dispatch omzeilt die dagelijkse activiteitengate. De lane bouwt een gegroepeerd Vitest-prestatierapport voor de volledige suite, laat Codex alleen kleine, dekking behoudende testprestatieverbeteringen uitvoeren in plaats van brede refactors, voert daarna het volledige-suite-rapport opnieuw uit en wijst wijzigingen af die het aantal passerende baseline-tests verminderen. Als de baseline falende tests heeft, mag Codex alleen duidelijke fouten oplossen en moet het volledige-suite-rapport na de agent slagen voordat er iets wordt gecommit. Wanneer `main` verder gaat voordat de bot-push landt, rebaset de lane de gevalideerde patch, voert `pnpm check:changed` opnieuw uit en probeert de push opnieuw; conflicterende verouderde patches worden overgeslagen. Hij gebruikt GitHub-hosted Ubuntu zodat de Codex-action dezelfde drop-sudo-veiligheidshouding kan behouden als de docs-agent.

### Dubbele PR's na merge

De `Duplicate PRs After Merge`-workflow is een handmatige maintainer-workflow voor dubbele opschoning na landen. De standaard is dry-run en sluit alleen expliciet vermelde PR's wanneer `apply=true`. Voordat GitHub wordt gemuteerd, verifieert hij dat de gelande PR is gemerged en dat elke duplicaat-PR ofwel een gedeeld gerefereerd issue heeft, of overlappende gewijzigde hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale check-gates en changed-routing

Lokale changed-lane-logica staat in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale check-gate is strenger over architectuurgrenzen dan de brede CI-platformscope:

- productiewijzigingen in core draaien typechecks voor core prod en core tests plus core lint/guards;
- alleen-testwijzigingen in core draaien alleen de typecheck voor core tests plus core lint;
- productiewijzigingen in extensies draaien typechecks voor extensieprod en extensietests plus extensielint;
- alleen-testwijzigingen in extensies draaien de typecheck voor extensietests plus extensielint;
- wijzigingen aan de openbare Plugin SDK of plugin-contracten breiden uit naar extensietypecheck omdat extensies afhankelijk zijn van die core-contracten (Vitest-extensiesweeps blijven expliciet testwerk);
- versiebumpwijzigingen die alleen release-metadata raken draaien gerichte versie-/config-/rootdependencychecks;
- onbekende root-/configwijzigingen falen veilig naar alle check-lanes.

Lokale routing voor gewijzigde tests staat in `scripts/test-projects.test-support.mjs` en is bewust goedkoper dan `check:changed`: directe testbewerkingen draaien zichzelf, bronbewerkingen geven de voorkeur aan expliciete mappings, daarna sibling-tests en importgrafiek-afhankelijken. Gedeelde delivery-configuratie voor groepsruimtes is een van de expliciete mappings: wijzigingen aan de configuratie voor zichtbare replies in groepen, de source reply delivery mode, of de system prompt van de message-tool lopen via de core reply-tests plus Discord- en Slack-deliveryregressies, zodat een wijziging aan een gedeelde standaard faalt vóór de eerste PR-push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging zo harness-breed is dat de goedkope gemapte set geen betrouwbare proxy is.

## Testbox-validatie

Draai Testbox vanuit de repo-root en geef voor brede bewijsvoering de voorkeur aan een vers opgewarmde box. Voordat je een trage gate besteedt aan een box die hergebruikt is, verlopen is, of net een onverwacht grote sync heeft gemeld, draai eerst `pnpm testbox:sanity` in de box.

De sanity-check faalt snel wanneer vereiste root-bestanden zoals `pnpm-lock.yaml` verdwenen zijn of wanneer `git status --short` minstens 200 getrackte verwijderingen toont. Dat betekent meestal dat de remote sync-state geen betrouwbare kopie van de PR is; stop die box en warm een nieuwe op in plaats van de producttestfout te debuggen. Voor bedoelde PR's met veel verwijderingen stel je `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor die sanity-run.

`pnpm testbox:run` beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de sync-fase blijft zonder post-sync-output. Stel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` in om die guard uit te schakelen, of gebruik een grotere millisecondewaarde voor ongewoon grote lokale diffs.

Crabbox is de repo-eigen remote-box-wrapper voor maintainer Linux-bewijs. Gebruik het wanneer een check te breed is voor een lokale bewerkingslus, wanneer CI-pariteit ertoe doet, of wanneer het bewijs secrets, Docker, package-lanes, herbruikbare boxes of remote logs nodig heeft. De normale OpenClaw-backend is `blacksmith-testbox`; eigen AWS/Hetzner-capaciteit is een fallback voor Blacksmith-storingen, quotaproblemen of expliciete tests op eigen capaciteit.

Controleer de wrapper vóór een eerste run vanuit de repo-root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

De repo-wrapper weigert een verouderde Crabbox-binary die `blacksmith-testbox` niet adverteert. Geef de provider expliciet mee, ook al heeft `.crabbox.yaml` owned-cloud-standaarden.

Wijzigingsgate:

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

Gerichte test opnieuw uitvoeren:

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

Lees de uiteindelijke JSON-samenvatting. De nuttige velden zijn `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` en `totalMs`. Eenmalige Crabbox-runs met Blacksmith-backend zouden de Testbox automatisch moeten stoppen; als een run wordt onderbroken of cleanup onduidelijk is, inspecteer live boxes en stop alleen de boxes die je hebt aangemaakt:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Gebruik hergebruik alleen wanneer je bewust meerdere commando's nodig hebt op dezelfde gehydrateerde box:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Als Crabbox de kapotte laag is maar Blacksmith zelf werkt, gebruik direct Blacksmith als smalle fallback:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Als `blacksmith testbox list --all` en `blacksmith testbox status` werken maar nieuwe
warmups na een paar minuten `queued` blijven zonder IP of Actions-run-URL,
behandel dit dan als druk vanuit de Blacksmith-provider, wachtrij, billing of org-limieten. Stop de
queued ids die je hebt aangemaakt, voorkom dat je meer Testboxes start, en verplaats het bewijs naar het
eigen Crabbox-capaciteitspad hieronder terwijl iemand het Blacksmith-dashboard,
billing en org-limieten controleert.

Escaleren naar eigen Crabbox-capaciteit doe je alleen wanneer Blacksmith down is, door quota beperkt wordt, de benodigde omgeving mist, of eigen capaciteit expliciet het doel is:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Vermijd onder AWS-druk `class=beast`, tenzij de taak echt CPU van 48xlarge-klasse nodig heeft. Een `beast`-aanvraag begint bij 192 vCPU's en is de makkelijkste manier om regionale EC2 Spot- of On-Demand Standard-quota te raken. De repo-eigen `.crabbox.yaml` gebruikt standaard `standard`, meerdere capaciteitsregio's en `capacity.hints: true`, zodat gebrokerde AWS-leases de gekozen regio/markt, quotadruk, Spot-fallback en waarschuwingen voor klassen met hoge druk printen. Gebruik `fast` voor zwaardere brede checks, `large` alleen nadat standard/fast niet genoeg zijn, en `beast` alleen voor uitzonderlijke CPU-gebonden lanes zoals full-suite- of all-plugin-Docker-matrices, expliciete release-/blocker-validatie, of high-core performanceprofiling. Gebruik `beast` niet voor `pnpm check:changed`, gerichte tests, docs-only werk, gewone lint/typecheck, kleine E2E-repro's of Blacksmith-storingstriage. Gebruik `--market on-demand` voor capaciteitsdiagnose zodat Spot-marktverloop niet door het signaal wordt gemengd.

`.crabbox.yaml` beheert provider-, sync- en GitHub Actions-hydrationstandaarden voor owned-cloud-lanes. Het sluit lokale `.git` uit zodat de gehydrateerde Actions-checkout zijn eigen remote Git-metadata behoudt in plaats van maintainer-lokale remotes en object stores te syncen, en het sluit lokale runtime-/buildartefacten uit die nooit mogen worden overgedragen. `.github/workflows/crabbox-hydrate.yml` beheert checkout, Node/pnpm-setup, `origin/main`-fetch en de non-secret environment-handoff voor owned-cloud `crabbox run --id <cbx_id>`-commando's.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Ontwikkelkanalen](/nl/install/development-channels)
