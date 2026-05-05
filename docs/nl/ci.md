---
read_when:
    - Je moet begrijpen waarom een CI-taak wel of niet is uitgevoerd
    - Je debugt een falende GitHub Actions-controle
    - Je coördineert een releasevalidatierun of een heruitvoering daarvan
    - Je wijzigt ClawSweeper-dispatch of het doorsturen van GitHub-activiteit
summary: CI-taakgrafiek, scopecontroles, release-overkoepelingen en lokale commandequivalenten
title: CI-pijplijn
x-i18n:
    generated_at: "2026-05-05T01:44:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16771940889d1fa944a5bfafe1152a033d96625595a2d89ff2cedbd3022cee66
    source_path: ci.md
    workflow: 16
---

OpenClaw CI wordt uitgevoerd bij elke push naar `main` en elke pull request. De job `preflight` classificeert de diff en schakelt dure lanes uit wanneer alleen niet-gerelateerde gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen bewust slimme scoping en waaieren de volledige graaf uit voor release candidates en brede validatie. Android-lanes blijven opt-in via `include_android`. Release-only Plugin-dekking staat in de aparte workflow [`Plugin Prerelease`](#plugin-prerelease) en wordt alleen uitgevoerd vanuit [`Full Release Validation`](#full-release-validation) of een expliciete handmatige dispatch.

## Pipeline-overzicht

| Job                              | Doel                                                                                                      | Wanneer deze draait                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Detecteert docs-only wijzigingen, gewijzigde scopes, gewijzigde extensies en bouwt het CI-manifest        | Altijd op niet-draft pushes en PR's |
| `security-scm-fast`              | Detectie van private keys en workflow-audit via `zizmor`                                                  | Altijd op niet-draft pushes en PR's |
| `security-dependency-audit`      | Productie-lockfile-audit zonder dependencies tegen npm-advisories                                         | Altijd op niet-draft pushes en PR's |
| `security-fast`                  | Vereiste aggregatie voor de snelle security-jobs                                                          | Altijd op niet-draft pushes en PR's |
| `check-dependencies`             | Productie-Knip-pass alleen voor dependencies plus de unused-file allowlist-guard                          | Node-relevante wijzigingen          |
| `build-artifacts`                | Bouwt `dist/`, Control UI, ingebouwde-artifactchecks en herbruikbare downstream-artifacts                 | Node-relevante wijzigingen          |
| `checks-fast-core`               | Snelle Linux-correctheidslanes zoals bundled/plugin-contract/protocol-checks                              | Node-relevante wijzigingen          |
| `checks-fast-contracts-channels` | Gesegmenteerde kanaalcontractchecks met een stabiel geaggregeerd checkresultaat                           | Node-relevante wijzigingen          |
| `checks-node-core-test`          | Core Node-testshards, exclusief channel-, bundled-, contract- en extension-lanes                          | Node-relevante wijzigingen          |
| `check`                          | Gesegmenteerd equivalent van de belangrijkste lokale gate: prod-types, lint, guards, testtypes en strict smoke | Node-relevante wijzigingen      |
| `check-additional`               | Architectuur, gesegmenteerde boundary/prompt-drift, extension-guards, package-boundary en Gateway-watch   | Node-relevante wijzigingen          |
| `build-smoke`                    | Smoke-tests voor de gebouwde CLI en startup-memory smoke                                                  | Node-relevante wijzigingen          |
| `checks`                         | Verifier voor ingebouwde-artifact channel-tests                                                           | Node-relevante wijzigingen          |
| `checks-node-compat-node22`      | Node 22-compatibiliteitsbuild en smoke-lane                                                               | Handmatige CI-dispatch voor releases |
| `check-docs`                     | Docs-formattering, lint en broken-link-checks                                                             | Docs gewijzigd                      |
| `skills-python`                  | Ruff + pytest voor Python-ondersteunde Skills                                                             | Python-skill-relevante wijzigingen  |
| `checks-windows`                 | Windows-specifieke process/path-tests plus gedeelde regressies voor runtime-importspecificaties           | Windows-relevante wijzigingen       |
| `macos-node`                     | macOS TypeScript-testlane met de gedeelde gebouwde artifacts                                              | macOS-relevante wijzigingen         |
| `macos-swift`                    | Swift-lint, build en tests voor de macOS-app                                                              | macOS-relevante wijzigingen         |
| `android`                        | Android-unit-tests voor beide flavors plus één debug-APK-build                                            | Android-relevante wijzigingen       |
| `test-performance-agent`         | Dagelijkse Codex-optimalisatie van trage tests na vertrouwde activiteit                                   | Main CI-succes of handmatige dispatch |
| `openclaw-performance`           | Dagelijkse/on-demand Kova-runtimeprestatierapporten met mock-provider-, deep-profile- en GPT 5.4-live-lanes | Gepland en handmatige dispatch    |

## Fail-fast-volgorde

1. `preflight` bepaalt welke lanes überhaupt bestaan. De logica `docs-scope` en `changed-scope` zijn stappen binnen deze job, geen afzonderlijke jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` en `skills-python` falen snel zonder te wachten op de zwaardere artifact- en platformmatrixjobs.
3. `build-artifacts` overlapt met de snelle Linux-lanes zodat downstream-consumenten kunnen starten zodra de gedeelde build klaar is.
4. Zwaardere platform- en runtime-lanes waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` en `android`.

GitHub kan vervangen jobs als `cancelled` markeren wanneer een nieuwere push op dezelfde PR- of `main`-ref landt. Behandel dat als CI-ruis, tenzij de nieuwste run voor dezelfde ref ook faalt. Geaggregeerde shardchecks gebruiken `!cancelled() && always()` zodat ze normale shardfouten nog steeds rapporteren, maar niet meer in de wachtrij gaan nadat de hele workflow al is vervangen. De automatische CI-concurrency-key is geversioneerd (`CI-v7-*`), zodat een GitHub-side zombie in een oude wachtrijgroep nieuwere main-runs niet onbeperkt kan blokkeren. Handmatige full-suite-runs gebruiken `CI-manual-v1-*` en annuleren lopende runs niet.

## Scope en routering

Scopelogica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unit-tests in `src/scripts/ci-changed-scope.test.ts`. Handmatige dispatch slaat changed-scope-detectie over en laat het preflight-manifest doen alsof elk gescopet gebied is gewijzigd.

- **CI-workflowbewerkingen** valideren de Node CI-graaf plus workflow-linting, maar forceren op zichzelf geen Windows-, Android- of macOS-native builds; die platformlanes blijven gescopet op platformspecifieke bronwijzigingen.
- **CI-bewerkingen alleen voor routering, geselecteerde goedkope core-test-fixturebewerkingen en smalle plugin-contract helper/test-routing-bewerkingen** gebruiken een snel Node-only manifestpad: `preflight`, security en één `checks-fast-core`-taak. Dat pad slaat build artifacts, Node 22-compatibiliteit, channel-contracts, volledige core-shards, bundled-plugin-shards en aanvullende guard-matrices over wanneer de wijziging beperkt is tot de routerings- of helperoppervlakken die de snelle taak direct oefent.
- **Windows Node-checks** zijn gescopet op Windows-specifieke process/path-wrappers, npm/pnpm/UI-runnerhelpers, package-managerconfiguratie en de CI-workflowoppervlakken die die lane uitvoeren; niet-gerelateerde bron-, plugin-, install-smoke- en test-only wijzigingen blijven op de Linux Node-lanes.

De traagste Node-testfamilies zijn opgesplitst of gebalanceerd zodat elke job klein blijft zonder runners te overreserveren: channel-contracts draaien als drie gewogen shards, core unit fast/support-lanes draaien afzonderlijk, core runtime-infra is opgesplitst tussen state- en process/config-shards, auto-reply draait als gebalanceerde workers (met de reply-subtree opgesplitst in agent-runner-, dispatch- en commands/state-routing-shards), en agentic Gateway/server-configs zijn verdeeld over chat/auth/model/http-plugin/runtime/startup-lanes in plaats van te wachten op gebouwde artifacts. Brede browser-, QA-, media- en diverse plugin-tests gebruiken hun eigen Vitest-configs in plaats van de gedeelde plugin-catch-all. Include-pattern-shards registreren timingvermeldingen met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een volledige config kan onderscheiden van een gefilterde shard. `check-additional` houdt package-boundary compile/canary-werk bij elkaar en scheidt runtime-topologiearchitectuur van Gateway-watch-dekking; de boundary-guardlijst is over vier matrixshards gestreept, waarbij elke shard geselecteerde onafhankelijke guards gelijktijdig uitvoert en timings per check afdrukt, inclusief `pnpm prompt:snapshots:check`, zodat Codex runtime happy-path prompt-drift wordt vastgepind op de PR die deze veroorzaakte. Gateway-watch, channel-tests en de core support-boundary-shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd.

Android CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play debug-APK. De third-party flavor heeft geen aparte sourceset of manifest; de unit-testlane compileert de flavor nog steeds met de SMS/call-log BuildConfig-flags, terwijl een dubbele debug-APK-packagingjob bij elke Android-relevante push wordt vermeden.

De shard `check-dependencies` draait `pnpm deadcode:dependencies` (een productie-Knip-pass alleen voor dependencies, vastgezet op de nieuwste Knip-versie, met pnpm's minimum release age uitgeschakeld voor de `dlx`-installatie) en `pnpm deadcode:unused-files`, die Knip's productiebevindingen voor ongebruikte bestanden vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. De unused-file-guard faalt wanneer een PR een nieuw niet-beoordeeld ongebruikt bestand toevoegt of een verouderde allowlist-vermelding laat staan, terwijl bewust dynamische plugin-, gegenereerde, build-, live-test- en package-bridge-oppervlakken behouden blijven die Knip niet statisch kan oplossen.

## ClawSweeper-activiteit doorsturen

`.github/workflows/clawsweeper-dispatch.yml` is de target-side bridge van OpenClaw-repositoryactiviteit naar ClawSweeper. Deze checkt geen onvertrouwde pull-requestcode uit en voert die niet uit. De workflow maakt een GitHub App-token aan uit `CLAWSWEEPER_APP_PRIVATE_KEY` en dispatcht daarna compacte `repository_dispatch`-payloads naar `openclaw/clawsweeper`.

De workflow heeft vier lanes:

- `clawsweeper_item` voor exacte reviewverzoeken voor issues en pull requests;
- `clawsweeper_comment` voor expliciete ClawSweeper-commando's in issuecomments;
- `clawsweeper_commit_review` voor reviewverzoeken op commitniveau bij `main`-pushes;
- `github_activity` voor algemene GitHub-activiteit die de ClawSweeper-agent kan inspecteren.

De lane `github_activity` stuurt alleen genormaliseerde metadata door: eventtype, actie, actor, repository, itemnummer, URL, titel, status en korte fragmenten voor comments of reviews wanneer aanwezig. Deze vermijdt bewust het doorsturen van de volledige webhook-body. De ontvangende workflow in `openclaw/clawsweeper` is `.github/workflows/github-activity.yml`, die het genormaliseerde event post naar de OpenClaw Gateway-hook voor de ClawSweeper-agent.

Algemene activiteit is observatie, geen standaardlevering. De ClawSweeper-agent ontvangt het Discord-doel in zijn prompt en mag alleen naar `#clawsweeper` posten wanneer het event verrassend, actiegericht, risicovol of operationeel nuttig is. Routinematige opens, bewerkingen, botruis, dubbele Webhook-ruis en normaal reviewverkeer moeten resulteren in `NO_REPLY`.

Behandel GitHub-titels, comments, bodies, reviewtekst, branchnamen en commitberichten in dit hele pad als onvertrouwde data. Ze zijn input voor samenvatting en triage, geen instructies voor de workflow- of agent-runtime.

## Handmatige dispatches

Handmatige CI-dispatches voeren dezelfde jobgrafiek uit als normale CI, maar schakelen elke niet-Android scoped lane geforceerd in: Linux Node-shards, bundled-plugin-shards, channel contracts, Node 22-compatibiliteit, `check`, `check-additional`, build-smoke, docs-controles, Python Skills, Windows, macOS en Control UI i18n. Zelfstandige handmatige CI-dispatches voeren alleen Android uit met `include_android=true`; de volledige release-umbrella schakelt Android in door `include_android=true` door te geven. Plugin prerelease static checks, de release-only `agentic-plugins`-shard, de volledige extensie-batchsweep en plugin prerelease Docker-lanes zijn uitgesloten van CI. De Docker prerelease-suite draait alleen wanneer `Full Release Validation` de afzonderlijke `Plugin Prerelease`-workflow dispatcht met de release-validation gate ingeschakeld.

Handmatige runs gebruiken een unieke concurrency group, zodat een volledige suite voor een release candidate niet wordt geannuleerd door een andere push- of PR-run op dezelfde ref. Met de optionele `target_ref`-invoer kan een vertrouwde caller die grafiek uitvoeren tegen een branch, tag of volledige commit-SHA terwijl het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Taken                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, snelle beveiligingstaken en aggregaties (`security-scm-fast`, `security-dependency-audit`, `security-fast`), snelle protocol-/contract-/bundled-controles, gesharde channel contract-controles, `check`-shards behalve lint, `check-additional`-shards en aggregaties, Node-testaggregatieverifiers, docs-controles, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight gebruikt ook GitHub-hosted Ubuntu zodat de Blacksmith-matrix eerder kan queuen |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lichtere extensieshards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` en `check-test-types`                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node-testshards, bundled plugin-testshards, `android`                                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-gevoelig genoeg dat 8 vCPU meer kostte dan het opleverde); install-smoke Docker-builds (32-vCPU-wachtrijtijd kostte meer dan het opleverde)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                       |

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

`OpenClaw Performance` is de workflow voor product-/runtimeprestaties. Deze draait dagelijks op `main` en kan handmatig worden gedispatcht:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Een handmatige dispatch benchmarkt normaal gesproken de workflow-ref. Stel `target_ref` in om een releasetag of een andere branch te benchmarken met de huidige workflowimplementatie. Gepubliceerde rapportpaden en latest-pointers worden keyed op de geteste ref, en elke `index.md` registreert de geteste ref/SHA, workflow-ref/SHA, Kova-ref, het profiel, de lane-authmodus, het model, het aantal herhalingen en de scenariofilters.

De workflow installeert OCM vanaf een gepinde release en Kova vanaf `openclaw/Kova` op de gepinde `kova_ref`-invoer, en voert daarna drie lanes uit:

- `mock-provider`: diagnostische Kova-scenario's tegen een local-build runtime met deterministische neppe OpenAI-compatibele auth.
- `mock-deep-profile`: CPU-/heap-/traceprofiling voor hotspots bij startup, Gateway en agent-turn.
- `live-gpt54`: een echte OpenAI `openai/gpt-5.4` agent-turn, overgeslagen wanneer `OPENAI_API_KEY` niet beschikbaar is.

De mock-provider-lane voert na de Kova-pass ook OpenClaw-native bronprobes uit: Gateway-opstarttiming en geheugen in standaard-, hook- en 50-Plugin-opstartcases; herhaalde mock-OpenAI `channel-chat-baseline` hello-loops; en CLI-opstartcommando's tegen de opgestarte Gateway. De Markdown-samenvatting van de bronprobe staat in `source/index.md` in de rapportbundel, met ruwe JSON ernaast.

Elke lane uploadt GitHub-artifacts. Wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd, commit de workflow ook `report.json`, `report.md`, bundels, `index.md` en bronprobe-artifacts naar `openclaw/clawgrit-reports` onder `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. De huidige pointer voor de geteste ref wordt geschreven als `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Volledige releasevalidatie

`Full Release Validation` is de handmatige umbrella-workflow voor "alles uitvoeren vóór release." Deze accepteert een branch, tag of volledige commit-SHA, dispatcht de handmatige `CI`-workflow met dat target, dispatcht `Plugin Prerelease` voor release-only Plugin-/package-/static-/Docker-bewijs, en dispatcht `OpenClaw Release Checks` voor install-smoke, package acceptance, cross-OS-packagecontroles, QA Lab-pariteit, Matrix- en Telegram-lanes. Stabiele/default runs houden uitputtende live/E2E- en Docker-release-path-dekking achter `run_release_soak=true`; `release_profile=full` forceert die soak-dekking, zodat brede advisory-validatie breed blijft. Met `rerun_group=all` en `release_profile=full` voert deze ook `NPM Telegram Beta E2E` uit tegen het `release-package-under-test`-artifact uit release checks. Geef na publicatie `npm_telegram_package_spec` door om dezelfde Telegram-package-lane opnieuw uit te voeren tegen het gepubliceerde npm-package.

Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
stagematrix, exacte workflow-jobnamen, profielverschillen, artifacts en
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

Gebruik voor gepind commitbewijs op een snel bewegende branch de helper in plaats van
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-workflowdispatchrefs moeten branches of tags zijn, geen ruwe commit-SHA's. De
helper pusht een tijdelijke `release-ci/<sha>-...`-branch op de target-SHA,
dispatcht `Full Release Validation` vanaf die gepinde ref, verifieert dat elke child
workflow-`headSha` overeenkomt met het target, en verwijdert de tijdelijke branch wanneer de
run is voltooid. De umbrella-verifier faalt ook als een child workflow op een
andere SHA draaide.

`release_profile` bepaalt de live-/providerbreedte die aan releasecontroles wordt doorgegeven. De
handmatige releaseworkflows gebruiken standaard `stable`; gebruik `full` alleen wanneer je
bewust de brede adviserende provider-/mediamatrix wilt. `run_release_soak`
bepaalt of stabiele/standaard releasecontroles de uitgebreide live-/E2E- en
Docker-soak voor het releasepad uitvoeren; `full` dwingt de soak af.

- `minimum` behoudt de snelste OpenAI-/core-lanes die releasekritiek zijn.
- `stable` voegt de stabiele provider-/backendset toe.
- `full` voert de brede adviserende provider-/mediamatrix uit.

De umbrella registreert de verzonden child-run-id's, en de laatste taak `Verify full validation` controleert opnieuw de huidige conclusies van child-runs en voegt tabellen met langzaamste taken toe voor elke child-run. Als een child-workflow opnieuw wordt uitgevoerd en groen wordt, voer dan alleen de parent verifier-taak opnieuw uit om het umbrella-resultaat en de timing-samenvatting te verversen.

Voor herstel accepteren zowel `Full Release Validation` als `OpenClaw Release Checks` `rerun_group`. Gebruik `all` voor een releasecandidate, `ci` voor alleen de normale volledige CI-child, `plugin-prerelease` voor alleen de Plugin-prerelease-child, `release-checks` voor elke release-child, of een smallere groep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, of `npm-telegram` op de umbrella. Dit houdt een nieuwe uitvoering van een mislukte releasebox afgebakend na een gerichte fix. Combineer voor één mislukte cross-OS-lane `rerun_group=cross-os` met `cross_os_suite_filter`, bijvoorbeeld `windows/packaged-upgrade`; lange cross-OS-opdrachten geven Heartbeat-regels uit en packaged-upgrade-samenvattingen bevatten timings per fase. QA-release-check-lanes zijn adviserend, dus QA-only-fouten waarschuwen maar blokkeren de release-check-verifier niet.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde ref één keer te herleiden tot een `release-package-under-test`-tarball, en geeft dat artefact vervolgens door aan cross-OS-controles en Package Acceptance, plus de live-/E2E-Docker-workflow voor het releasepad wanneer soak-dekking draait. Daardoor blijven de package-bytes consistent over releaseboxen heen en wordt voorkomen dat dezelfde candidate in meerdere child-taken opnieuw wordt verpakt.

Dubbele `Full Release Validation`-runs voor `ref=main` en `rerun_group=all`
vervangen de oudere umbrella. De parent-monitor annuleert elke child-workflow die
al is verzonden wanneer de parent wordt geannuleerd, zodat nieuwere main-validatie
niet achter een verouderde release-check-run van twee uur blijft wachten. Validatie
van releasebranches/-tags en gerichte rerun-groepen behouden `cancel-in-progress: false`.

## Live- en E2E-shards

De release live-/E2E-child behoudt brede native `pnpm test:live`-dekking, maar voert die uit als benoemde shards via `scripts/test-live-shard.mjs` in plaats van als één seriële taak:

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
- gesplitste audio-/video-mediashards en provider-gefilterde muziekshards

Dat behoudt dezelfde bestandsdekking terwijl trage live-providerfouten eenvoudiger opnieuw uit te voeren en te diagnosticeren zijn. De geaggregeerde shardnamen `native-live-extensions-o-z`, `native-live-extensions-media` en `native-live-extensions-media-music` blijven geldig voor handmatige eenmalige reruns.

De native live-mediashards draaien in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de `Live Media Runner Image`-workflow. Die image installeert `ffmpeg` en `ffprobe` vooraf; mediataken verifiëren alleen de binaries vóór setup. Houd Docker-backed live-suites op normale Blacksmith-runners — containerjobs zijn de verkeerde plek om geneste Docker-tests te starten.

Docker-backed live model-/backendshards gebruiken een aparte gedeelde `ghcr.io/openclaw/openclaw-live-test:<sha>`-image per geselecteerde commit. De live releaseworkflow bouwt en pusht die image één keer, waarna de Docker live model-, provider-sharded Gateway-, CLI-backend-, ACP bind- en Codex harness-shards draaien met `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker-shards hebben expliciete script-level `timeout`-limieten onder de workflow job-time-out, zodat een vastgelopen container of cleanup-pad snel faalt in plaats van het hele release-check-budget op te gebruiken. Als die shards onafhankelijk het volledige source Docker-target opnieuw bouwen, is de releaserun verkeerd geconfigureerd en verspilt die wandkloktijd aan dubbele imagebuilds.

## Package Acceptance

Gebruik `Package Acceptance` wanneer de vraag is: "werkt dit installeerbare OpenClaw-package als product?" Dit verschilt van normale CI: normale CI valideert de sourcetree, terwijl package acceptance één tarball valideert via dezelfde Docker E2E-harness die gebruikers na installatie of update gebruiken.

### Taken

1. `resolve_package` checkt `workflow_ref` uit, herleidt één packagecandidate, schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het `package-under-test`-artefact, en drukt de bron, workflow-ref, package-ref, versie, SHA-256 en profiel af in de GitHub-stapsamenvatting.
2. `docker_acceptance` roept `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt dat artefact, valideert de tarball-inventory, bereidt package-digest Docker-images voor wanneer nodig, en voert de geselecteerde Docker-lanes uit tegen dat package in plaats van de workflow-checkout te verpakken. Wanneer een profiel meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het package en gedeelde images één keer voor, waarna die lanes als parallelle gerichte Docker-taken met unieke artefacten worden uitgewaaierd.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Dit draait wanneer `telegram_mode` niet `none` is en installeert hetzelfde `package-under-test`-artefact wanneer Package Acceptance er één heeft herleid; standalone Telegram-dispatch kan nog steeds een gepubliceerde npm-spec installeren.
4. `summary` laat de workflow falen als packageherleiding, Docker-acceptance of de optionele Telegram-lane is mislukt.

### Candidate-bronnen

- `source=npm` accepteert alleen `openclaw@beta`, `openclaw@latest`, of een exacte OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor gepubliceerde prerelease-/stabiele acceptance.
- `source=ref` verpakt een vertrouwde `package_ref`-branch, tag of volledige commit-SHA. De resolver haalt OpenClaw-branches/-tags op, verifieert dat de geselecteerde commit bereikbaar is vanuit de branchgeschiedenis van de repository of een releasetag, installeert dependencies in een detached worktree, en verpakt die met `scripts/package-openclaw-for-docker.mjs`.
- `source=url` downloadt een HTTPS-`.tgz`; `package_sha256` is vereist.
- `source=artifact` downloadt één `.tgz` uit `artifact_run_id` en `artifact_name`; `package_sha256` is optioneel maar moet worden opgegeven voor extern gedeelde artefacten.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde workflow-/harnesscode die de test uitvoert. `package_ref` is de sourcecommit die wordt verpakt wanneer `source=ref`. Hierdoor kan de huidige testharness oudere vertrouwde sourcecommits valideren zonder oude workflowlogica uit te voeren.

### Suiteprofielen

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — volledige Docker-chunks voor het releasepad met OpenWebUI
- `custom` — exacte `docker_lanes`; vereist wanneer `suite_profile=custom`

Het `package`-profiel gebruikt offline Plugin-dekking, zodat gepubliceerde-packagevalidatie niet afhankelijk is van live ClawHub-beschikbaarheid. De optionele Telegram-lane hergebruikt het `package-under-test`-artefact in `NPM Telegram Beta E2E`, waarbij het pad met de gepubliceerde npm-spec behouden blijft voor standalone-dispatches.

Zie [Updates en plugins testen](/nl/help/testing-updates-plugins) voor het specifieke update- en Plugin-testbeleid, inclusief lokale opdrachten,
Docker-lanes, Package Acceptance-inputs, releasestandaarden en triage van fouten.

Releasecontroles roepen Package Acceptance aan met `source=artifact`, het voorbereide releasepackage-artefact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, en `telegram_mode=mock-openai`. Dit houdt package-migratie, update, cleanup van verouderde Plugin-dependencies, installatiereparatie voor geconfigureerde Plugins, offline Plugin, Plugin-update en Telegram-bewijs op dezelfde herleide package-tarball. Stel `package_acceptance_package_spec` in op Full Release Validation of OpenClaw Release Checks om diezelfde matrix tegen een verscheept npm-package uit te voeren in plaats van het op SHA gebouwde artefact. Cross-OS-releasecontroles dekken nog steeds OS-specifieke onboarding, installer en platformgedrag; productvalidatie voor package/update moet beginnen met Package Acceptance. De Docker-lane `published-upgrade-survivor` valideert één gepubliceerde packagebaseline per run in het blokkerende releasepad. In Package Acceptance is de herleide `package-under-test`-tarball altijd de candidate en selecteert `published_upgrade_survivor_baseline` de fallback gepubliceerde baseline, standaard `openclaw@latest`; rerun-opdrachten voor mislukte lanes behouden die baseline. Full Release Validation met `run_release_soak=true` of `release_profile=full` stelt `published_upgrade_survivor_baselines=all-since-2026.4.23` en `published_upgrade_survivor_scenarios=reported-issues` in om uit te breiden over elke stabiele npm-release van `2026.4.23` tot en met `latest` en issue-vormige fixtures voor Feishu-configuratie, behouden bootstrap-/persona-bestanden, geconfigureerde OpenClaw Plugin-installaties, tilde-logpaden en verouderde legacy Plugin-dependency-roots. De aparte `Update Migration`-workflow gebruikt de `update-migration` Docker-lane met `all-since-2026.4.23` en `plugin-deps-cleanup` wanneer de vraag uitgebreide cleanup van gepubliceerde updates is, niet de normale breedte van Full Release CI. Lokale geaggregeerde runs kunnen exacte package-specs doorgeven met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, één lane behouden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` zoals `openclaw@2026.4.15`, of `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` instellen voor de scenariomatrix. De gepubliceerde lane configureert de baseline met een ingebakken `openclaw config set`-opdrachtrecept, registreert receptstappen in `summary.json`, en peilt `/healthz`, `/readyz`, plus RPC-status nadat Gateway is gestart. De Windows packaged- en installer fresh-lanes verifiëren ook dat een geïnstalleerd package een browser-control-override kan importeren vanaf een raw absoluut Windows-pad. De OpenAI cross-OS agent-turn smoke gebruikt standaard `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer ingesteld, anders `openai/gpt-5.4`, zodat het installatie- en Gateway-bewijs op een GPT-5-testmodel blijft en GPT-4.x-standaarden worden vermeden.

### Legacy-compatibiliteitsvensters

Package Acceptance heeft afgebakende legacy-compatibiliteitsvensters voor al gepubliceerde packages. Packages tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen het compatibiliteitspad gebruiken:

- bekende private QA-vermeldingen in `dist/postinstall-inventory.json` mogen wijzen naar bestanden die uit de tarball zijn weggelaten;
- `doctor-switch` mag de subcase voor persistentie van `gateway install --wrapper` overslaan wanneer het package die flag niet exposeert;
- `update-channel-switch` mag ontbrekende `pnpm.patchedDependencies` uit de van tarball afgeleide fake git-fixture snoeien en mag ontbrekende persisted `update.channel` loggen;
- Plugin-smokes mogen legacy install-record-locaties lezen of ontbrekende marketplace install-record-persistentie accepteren;
- `plugin-update` mag migratie van configmetadata toestaan terwijl nog steeds wordt vereist dat het install-record en het no-reinstall-gedrag ongewijzigd blijven.

Het gepubliceerde package `2026.4.26` mag ook waarschuwen voor lokale buildmetadata-stampbestanden die al waren verscheept. Latere packages moeten aan de moderne contracten voldoen; dezelfde omstandigheden falen dan in plaats van te waarschuwen of over te slaan.

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

Begin bij het opsporen van fouten in een mislukte package-acceptance-run met de samenvatting `resolve_package` om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de child-run `docker_acceptance` en de bijbehorende Docker-artifacten: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logs, fasetimings en rerun-commando's. Geef de voorkeur aan het opnieuw uitvoeren van het mislukte pakketprofiel of de exacte Docker-lanes in plaats van de volledige releasevalidatie opnieuw uit te voeren.

## Installatiesmoke

De afzonderlijke workflow `Install Smoke` hergebruikt hetzelfde scopescript via zijn eigen job `preflight`. Deze splitst de smoke-dekking in `run_fast_install_smoke` en `run_full_install_smoke`.

- **Snel pad** draait voor pull requests die Docker-/pakketoppervlakken raken, wijzigingen in gebundelde Plugin-pakketten/-manifesten, of core Plugin-/kanaal-/Gateway-/Plugin SDK-oppervlakken die door de Docker-smokejobs worden getest. Wijzigingen die alleen broncode van gebundelde Plugins raken, test-only-bewerkingen en docs-only-bewerkingen reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image eenmalig, controleert de CLI, voert de agents-delete-shared-workspace CLI-smoke uit, voert de container gateway-network e2e uit, verifieert een build-argument voor een gebundelde extensie en voert het begrensde gebundelde-Plugin-Dockerprofiel uit onder een totale commandotime-out van 240 seconden (waarbij de Docker-run van elk scenario afzonderlijk is begrensd).
- **Volledig pad** behoudt QR-pakketinstallatie en installer-Docker-/updatedekking voor nachtelijke geplande runs, handmatige dispatches, workflow-call releasechecks en pull requests die echt installer-/pakket-/Docker-oppervlakken raken. In volledige modus bereidt install-smoke één target-SHA GHCR root-Dockerfile-smoke-image voor of hergebruikt deze, en voert daarna QR-pakketinstallatie, root-Dockerfile-/Gateway-smokes, installer-/updatesmokes en de snelle gebundelde-Plugin Docker E2E uit als afzonderlijke jobs, zodat installerwerk niet hoeft te wachten achter de root-image-smokes.

`main`-pushes (inclusief mergecommits) forceren het volledige pad niet; wanneer changed-scope-logica volledige dekking op een push zou aanvragen, behoudt de workflow de snelle Docker-smoke en laat de volledige installatiesmoke over aan nachtelijke of releasevalidatie.

De trage Bun global-install image-provider-smoke wordt afzonderlijk afgeschermd door `run_bun_global_install_smoke`. Deze draait volgens het nachtelijke schema en vanuit de releasechecks-workflow, en handmatige `Install Smoke`-dispatches kunnen deze inschakelen, maar pull requests en `main`-pushes niet. QR- en installer-Dockertests behouden hun eigen installatiefocus-Dockerfiles.

## Lokale Docker E2E

`pnpm test:docker:all` prebuiltt één gedeelde live-test-image, pakt OpenClaw één keer als npm-tarball en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images:

- een kale Node/Git-runner voor installer-/update-/plugin-dependency-lanes;
- een functionele image die dezelfde tarball in `/app` installeert voor normale functionaliteitslanes.

Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en voert daarna lanes uit met `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Instelbare parameters

| Variabele                              | Standaard | Doel                                                                                          |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Aantal main-pool-slots voor normale lanes.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Aantal providergevoelige tail-pool-slots.                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limiet voor gelijktijdige live-lanes zodat providers niet throttlen.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limiet voor gelijktijdige npm-install-lanes.                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limiet voor gelijktijdige multi-service-lanes.                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Spreiding tussen lane-starts om Docker-daemon-create-stormen te vermijden; stel in op `0` voor geen spreiding. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Fallbacktime-out per lane (120 minuten); geselecteerde live-/tail-lanes gebruiken strengere limieten. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset     | `1` print het schedulerplan zonder lanes uit te voeren.                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset     | Komma-gescheiden exacte lanelijst; slaat cleanup-smoke over zodat agents één mislukte lane kunnen reproduceren. |

Een lane die zwaarder is dan de effectieve limiet kan nog steeds vanuit een lege pool starten en draait daarna alleen totdat capaciteit wordt vrijgegeven. De lokale aggregate voert Docker-preflights uit, verwijdert verouderde OpenClaw E2E-containers, geeft actieve-lane-status weer, bewaart lanetimings voor longest-first-volgorde en stopt standaard met het plannen van nieuwe gepoolde lanes na de eerste fout.

### Herbruikbare live/E2E-workflow

De herbruikbare live/E2E-workflow vraagt `scripts/test-docker-all.mjs --plan-json` welke pakket-, imagekind-, live-image-, lane- en credentialdekking vereist is. `scripts/docker-e2e.mjs` zet dat plan daarna om in GitHub-outputs en samenvattingen. Het pakt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een pakketartifact van de huidige run of downloadt een pakketartifact uit `package_artifact_run_id`; valideert de tarball-inventaris; bouwt en pusht package-digest-getagde bare/functional GHCR Docker E2E-images via Blacksmiths Docker-layercache wanneer het plan lanes nodig heeft met geïnstalleerde pakketten; en hergebruikt opgegeven inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` of bestaande package-digest-images in plaats van opnieuw te bouwen. Docker-imagepulls worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry-/cachestream snel opnieuw probeert in plaats van het grootste deel van het kritieke CI-pad te verbruiken.

### Releasepad-chunks

Release-Dockerdekking draait kleinere gechunkte jobs met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elke chunk alleen het imagekind pullt dat nodig is en meerdere lanes via dezelfde gewogen scheduler uitvoert:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Huidige release-Dockerchunks zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` en `plugins-runtime-install-a` tot en met `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` en `plugins-integrations` blijven aggregate Plugin-/runtime-aliassen. De lane-alias `install-e2e` blijft de aggregate handmatige rerun-alias voor beide provider-installerlanes.

OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige releasepath-dekking dit aanvraagt, en behoudt alleen een zelfstandige chunk `openwebui` voor OpenWebUI-only-dispatches. Bundled-channel-update-lanes proberen één keer opnieuw bij tijdelijke npm-netwerkfouten.

Elke chunk uploadt `.artifacts/docker-tests/` met lane-logs, timings, `summary.json`, `failures.json`, fasetimings, schedulerplan-JSON, slow-lane-tabellen en rerun-commando's per lane. De workflowinput `docker_lanes` voert geselecteerde lanes uit tegen de voorbereide images in plaats van de chunkjobs, waardoor debuggen van mislukte lanes begrensd blijft tot één gerichte Docker-job en het pakketartifact voor die run wordt voorbereid, gedownload of hergebruikt; als een geselecteerde lane een live Docker-lane is, bouwt de gerichte job de live-test-image lokaal voor die rerun. Gegenereerde GitHub-rerun-commando's per lane bevatten `package_artifact_run_id`, `package_artifact_name` en voorbereide image-inputs wanneer die waarden bestaan, zodat een mislukte lane exact hetzelfde pakket en dezelfde images uit de mislukte run kan hergebruiken.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

De geplande live/E2E-workflow draait dagelijks de volledige release-path-Dockersuite.

## Plugin-prerelease

`Plugin Prerelease` is duurdere product-/pakketdekking, dus dit is een afzonderlijke workflow die wordt gedispatcht door `Full Release Validation` of door een expliciete operator. Normale pull requests, `main`-pushes en zelfstandige handmatige CI-dispatches laten die suite uitgeschakeld. De workflow verdeelt gebundelde Plugin-tests over acht extensieworkers; die extensie-shardjobs draaien maximaal twee Plugin-configgroepen tegelijk met één Vitest-worker per groep en een grotere Node-heap, zodat importzware Plugin-batches geen extra CI-jobs aanmaken. Het release-only Docker-prereleasepad batched gerichte Docker-lanes in kleine groepen om te voorkomen dat tientallen runners worden gereserveerd voor jobs van één tot drie minuten.

## QA Lab

QA Lab heeft speciale CI-lanes buiten de belangrijkste smart-scoped workflow. Agentic parity is genest onder de brede QA- en releaseharnassen, niet als zelfstandige PR-workflow. Gebruik `Full Release Validation` met `rerun_group=qa-parity` wanneer parity moet meelopen met een brede validatierun.

- De workflow `QA-Lab - All Lanes` draait elke nacht op `main` en bij handmatige dispatch; deze waaiert de mock parity-lane, live Matrix-lane en live Telegram- en Discord-lanes uit als parallelle jobs. Live jobs gebruiken de omgeving `qa-live-shared`, en Telegram/Discord gebruiken Convex-leases.

Releasechecks draaien Matrix- en Telegram-live-transportlanes met de deterministische mockprovider en mock-gekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het kanaalcontract geïsoleerd is van live-modellatentie en normale startup van provider-Plugins. De live-transport-Gateway schakelt memory search uit, omdat QA parity geheugengedrag afzonderlijk dekt; providerconnectiviteit wordt gedekt door de afzonderlijke live model-, native provider- en Docker-provider-suites.

Matrix gebruikt `--profile fast` voor geplande en releasegates, en voegt `--fail-fast` alleen toe wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaard en handmatige workflowinput blijven `all`; handmatige dispatch met `matrix_profile=all` shardt volledige Matrix-dekking altijd in jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` en `e2ee-cli`.

`OpenClaw Release Checks` draait ook de releasekritieke QA Lab-lanes vóór releasegoedkeuring; de QA-paritygate draait de kandidaat- en baselinepacks als parallelle lanejobs, en downloadt daarna beide artifacten in een kleine rapportjob voor de finale parity-vergelijking.

Volg voor normale PR's scoped CI-/checkbewijs in plaats van parity als vereiste status te behandelen.

## CodeQL

De `CodeQL`-workflow is bewust een smalle securityscanner voor een eerste controle, niet de volledige repository-sweep. Dagelijkse, handmatige en niet-concept pull-requestbewakingsruns scannen Actions-workflowcode plus de JavaScript/TypeScript-oppervlakken met het hoogste risico, met securityqueries met hoge betrouwbaarheid gefilterd op hoge/kritieke `security-severity`.

De pull-requestbewaking blijft licht: deze start alleen voor wijzigingen onder `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` of `src`, en voert dezelfde securitymatrix met hoge betrouwbaarheid uit als de geplande workflow. Android- en macOS-CodeQL blijven buiten de PR-standaarden.

### Securitycategorieen

| Categorie                                          | Oppervlak                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron en gateway-baseline                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Core-kanaalimplementatiecontracten plus de kanaal-Plugin-runtime, gateway, Plugin SDK, secrets en audit-aanraakpunten              |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP-parsing, netwerkbewaking, web-fetch en Plugin SDK SSRF-beleidsoppervlakken                                            |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-servers, procesuitvoeringshelpers, uitgaande levering en agent-tooluitvoeringspoorten                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-installatie, loader, manifest, registry, package-manager-installatie, source-loading en trust-oppervlakken van het Plugin SDK-packagecontract |

### Platformspecifieke securityshards

- `CodeQL Android Critical Security` — geplande Android-securityshard. Bouwt de Android-app handmatig voor CodeQL op de kleinste Blacksmith Linux-runner die door workflow-sanity wordt geaccepteerd. Uploadt onder `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — wekelijkse/handmatige macOS-securityshard. Bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert resultaten van dependency-builds uit de geuploade SARIF en uploadt onder `/codeql-critical-security/macos`. Buiten de dagelijkse standaarden gehouden omdat de macOS-build de runtime domineert, zelfs wanneer die schoon is.

### Critical Quality-categorieen

`CodeQL Critical Quality` is de bijbehorende niet-securityshard. Deze voert alleen error-severity, niet-security JavaScript/TypeScript-kwaliteitsqueries uit over smalle oppervlakken met hoge waarde op de kleinere Blacksmith Linux-runner. De pull-requestbewaking is bewust kleiner dan het geplande profiel: niet-concept-PR's voeren alleen de bijbehorende `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` en `plugin-sdk-reply-runtime`-shards uit voor agent-command/model/tool-uitvoering en reply-dispatchcode, configschema/migratie/IO-code, auth/secrets/sandbox/securitycode, core-kanaal en runtime van gebundelde kanaal-Plugin, gatewayprotocol/server-method, memory-runtime/SDK-glue, MCP/proces/uitgaande levering, provider-runtime/modelcatalogus, sessiediagnostics/leveringsqueues, Plugin-loader, Plugin SDK/package-contract of wijzigingen in Plugin SDK-reply-runtime. Wijzigingen in CodeQL-config en kwaliteitsworkflow voeren alle twaalf PR-kwaliteitshards uit.

Handmatige dispatch accepteert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

De smalle profielen zijn teaching-/iteratiehooks om een kwaliteitsshard geisoleerd uit te voeren.

| Categorie                                                | Oppervlak                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secrets, sandbox, cron en code voor de gateway-securitygrens                                                                                                |
| `/codeql-critical-quality/config-boundary`              | Configschema-, migratie-, normalisatie- en IO-contracten                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-protocolschema's en servermethodecontracten                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Core-kanaal en implementatiecontracten van gebundelde kanaal-Plugin                                                                                               |
| `/codeql-critical-quality/agent-runtime-boundary`       | Command-uitvoering, model/provider-dispatch, auto-reply-dispatch en queues, en ACP control-plane-runtimecontracten                                                |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-servers en tool-bridges, procesbewakingshelpers en contracten voor uitgaande levering                                                                         |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory-host-SDK, memory-runtimefacades, memory Plugin SDK-aliassen, memory-runtime-activeringsglue en memory doctor-commands                                      |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply-queue-internals, sessieleveringsqueues, helpers voor uitgaande sessiebinding/-levering, oppervlakken voor diagnostische events/logbundels en session doctor CLI-contracten |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK-dispatch van inkomende replies, helpers voor reply-payload/chunking/runtime, kanaal-replyopties, leveringsqueues en helpers voor session/thread-binding |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisatie van modelcatalogus, provider-auth en discovery, provider-runtimeregistratie, provider-standaarden/catalogi en web/search/fetch/embedding-registries  |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap van Control UI, lokale persistentie, gateway-controlflows en TaskFlow-control-plane-runtimecontracten                                                    |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search, media-IO, media-understanding, image-generation en media-generation-runtimecontracten                                                       |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, registry-, public-surface- en Plugin SDK-entrypointcontracten                                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Gepubliceerde package-side Plugin SDK-bron en helpers voor Plugin-packagecontracten                                                                                |

Quality blijft gescheiden van security zodat quality-bevindingen kunnen worden gepland, gemeten, uitgeschakeld of uitgebreid zonder het securitysignaal te vertroebelen. Uitbreiding van Swift-, Python- en gebundelde-Plugin-CodeQL moet alleen als gescopeerd of geshard vervolgwerk worden toegevoegd nadat de smalle profielen stabiele runtime en stabiel signaal hebben.

## Maintenance-workflows

### Docs Agent

De `Docs Agent`-workflow is een event-gedreven Codex-maintenance-lane om bestaande docs afgestemd te houden op recent gelande wijzigingen. Deze heeft geen puur schema: een succesvolle niet-bot push-CI-run op `main` kan deze triggeren, en handmatige dispatch kan deze direct uitvoeren. Workflow-run-aanroepen slaan over wanneer `main` is doorgegaan of wanneer in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is aangemaakt. Wanneer deze draait, beoordeelt deze het commitbereik van de vorige niet-overgeslagen Docs Agent-bron-SHA tot de huidige `main`, zodat een enkele uurlijkse run alle main-wijzigingen kan afdekken die sinds de laatste docs-pass zijn verzameld.

### Test Performance Agent

De `Test Performance Agent`-workflow is een event-gedreven Codex-maintenance-lane voor trage tests. Deze heeft geen puur schema: een succesvolle niet-bot push-CI-run op `main` kan deze triggeren, maar deze slaat over als op die UTC-dag al een andere workflow-run-aanroep heeft gedraaid of draait. Handmatige dispatch omzeilt die dagelijkse activiteitspoort. De lane bouwt een gegroepeerd Vitest-prestatierapport voor de volledige suite, laat Codex alleen kleine testperformancefixes maken die coverage behouden in plaats van brede refactors, voert daarna het volledige-suiterapport opnieuw uit en weigert wijzigingen die het aantal passerende baseline-tests verlagen. Als de baseline falende tests heeft, mag Codex alleen duidelijke failures oplossen en moet het volledige-suiterapport na de agent slagen voordat er iets wordt gecommit. Wanneer `main` verdergaat voordat de bot-push landt, rebaset de lane de gevalideerde patch, voert `pnpm check:changed` opnieuw uit en probeert de push opnieuw; conflicterende verouderde patches worden overgeslagen. Deze gebruikt GitHub-hosted Ubuntu zodat de Codex-action dezelfde drop-sudo-veiligheidshouding kan aanhouden als de docs-agent.

### Dubbele PR's na merge

De `Duplicate PRs After Merge`-workflow is een handmatige maintainer-workflow voor het opruimen van duplicaten na landing. Deze staat standaard op dry-run en sluit alleen expliciet vermelde PR's wanneer `apply=true`. Voordat GitHub wordt aangepast, verifieert deze dat de gelande PR is gemerged en dat elk duplicaat ofwel een gedeeld gerefereerd issue heeft of overlappende gewijzigde hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale checkpoorten en gewijzigde routing

Lokale changed-lane-logica staat in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale checkpoort is strenger over architectuurgrenzen dan de brede CI-platformscope:

- core-productiewijzigingen voeren core-prod- en core-test-typecheck plus core-lint/guards uit;
- wijzigingen alleen aan core-tests voeren alleen core-test-typecheck plus core-lint uit;
- extensieproductiewijzigingen voeren extension-prod- en extension-test-typecheck plus extension-lint uit;
- wijzigingen alleen aan extensietests voeren extension-test-typecheck plus extension-lint uit;
- wijzigingen aan de publieke Plugin SDK of het Plugin-contract breiden uit naar extension-typecheck omdat extensies afhankelijk zijn van die core-contracten (Vitest-extension-sweeps blijven expliciet testwerk);
- release metadata-only versiebumpen voeren gerichte version/config/root-dependency-checks uit;
- onbekende root/config-wijzigingen vallen veilig terug op alle checklanes.

Lokale changed-test-routing staat in `scripts/test-projects.test-support.mjs` en is bewust goedkoper dan `check:changed`: directe testwijzigingen voeren zichzelf uit, bronwijzigingen geven de voorkeur aan expliciete mappings, daarna sibling-tests en import-graph-afhankelijken. Gedeelde group-room delivery config is een van de expliciete mappings: wijzigingen aan de group visible-reply-config, source reply delivery mode of de message-tool system prompt lopen via de core reply-tests plus Discord- en Slack-leveringsregressies, zodat een gedeelde standaardwijziging faalt voor de eerste PR-push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging zo harness-breed is dat de goedkope gemapte set geen betrouwbare proxy is.

## Testbox-validatie

Voer Testbox uit vanaf de repo-root en geef voor brede verificatie de voorkeur aan een vers opgewarmde box. Voordat je een trage gate uitvoert op een box die is hergebruikt, verlopen is of net een onverwacht grote sync heeft gemeld, voer je eerst `pnpm testbox:sanity` uit in de box.

De sanity check faalt snel wanneer vereiste rootbestanden zoals `pnpm-lock.yaml` verdwenen zijn of wanneer `git status --short` minstens 200 gevolgde verwijderingen toont. Dat betekent meestal dat de externe syncstatus geen betrouwbare kopie van de PR is; stop die box en warm in plaats daarvan een nieuwe op, in plaats van de producttestfout te debuggen. Stel voor PR's met opzettelijk veel verwijderingen `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor die sanity-run.

`pnpm testbox:run` beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de syncfase blijft zonder output na de sync. Stel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` in om die guard uit te schakelen, of gebruik een grotere millisecondewaarde voor ongebruikelijk grote lokale diffs.

Crabbox is de repo-eigen externe-boxwrapper voor Linux-verificatie door maintainers. Gebruik het wanneer een check te breed is voor een lokale edit-loop, wanneer CI-pariteit belangrijk is, of wanneer de verificatie secrets, Docker, package-lanes, herbruikbare boxes of externe logs nodig heeft. De normale OpenClaw-backend is `blacksmith-testbox`; eigen AWS/Hetzner-capaciteit is een fallback voor Blacksmith-storingen, quotumproblemen of expliciete tests met eigen capaciteit.

Controleer vóór een eerste run de wrapper vanaf de repo-root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

De repo-wrapper weigert een verouderde Crabbox-binary die geen `blacksmith-testbox` vermeldt. Geef de provider expliciet door, ook al heeft `.crabbox.yaml` standaardinstellingen voor owned-cloud.

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

Lees de uiteindelijke JSON-samenvatting. De nuttige velden zijn `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` en `totalMs`. Eenmalige door Blacksmith ondersteunde Crabbox-runs zouden de Testbox automatisch moeten stoppen; als een run wordt onderbroken of opruimen onduidelijk is, inspecteer dan de actieve boxes en stop alleen de boxes die je hebt aangemaakt:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Gebruik hergebruik alleen wanneer je opzettelijk meerdere opdrachten op dezelfde gehydrateerde box nodig hebt:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Als Crabbox de kapotte laag is maar Blacksmith zelf werkt, gebruik dan directe Blacksmith als beperkte fallback:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Escaleren naar eigen Crabbox-capaciteit doe je alleen wanneer Blacksmith down is, door quota wordt beperkt, de benodigde omgeving mist, of eigen capaciteit expliciet het doel is:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` beheert de standaardinstellingen voor provider, sync en GitHub Actions-hydratie voor owned-cloud-lanes. Het sluit lokale `.git` uit, zodat de gehydrateerde Actions-checkout zijn eigen externe Git-metadata behoudt in plaats van maintainer-lokale remotes en object stores te synchroniseren, en het sluit lokale runtime-/buildartefacten uit die nooit mogen worden overgedragen. `.github/workflows/crabbox-hydrate.yml` beheert checkout, Node/pnpm-installatie, `origin/main`-fetch en de niet-secret omgevingsoverdracht voor owned-cloud-`crabbox run --id <cbx_id>`-opdrachten.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Ontwikkelingskanalen](/nl/install/development-channels)
