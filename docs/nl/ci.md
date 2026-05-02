---
read_when:
    - Je moet begrijpen waarom een CI-taak wel of niet is uitgevoerd
    - Je debugt een mislukte GitHub Actions-controle
    - Je coördineert een releasevalidatierun of een heruitvoering ervan
    - Je wijzigt de ClawSweeper-aansturing of het doorsturen van GitHub-activiteit
summary: CI-jobgrafiek, scope-gates, release-overkoepelingen en lokale commando-equivalenten
title: CI-pipeline
x-i18n:
    generated_at: "2026-05-02T20:42:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39410c5ceb3598e9e1771f98fba79485b13967df372c7a3f55ef5a5350416435
    source_path: ci.md
    workflow: 16
---

OpenClaw CI wordt uitgevoerd bij elke push naar `main` en elke pull request. De `preflight`-job classificeert de diff en schakelt dure lanes uit wanneer alleen niet-gerelateerde gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen bewust slimme scoping en waaieren de volledige graph uit voor release candidates en brede validatie. Android-lanes blijven opt-in via `include_android`. Release-only Plugin-dekking staat in de afzonderlijke workflow [`Plugin Prerelease`](#plugin-prerelease) en wordt alleen uitgevoerd vanuit [`Full Release Validation`](#full-release-validation) of een expliciete handmatige dispatch.

## Pipelineoverzicht

| Job                              | Doel                                                                                                      | Wanneer deze draait                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detecteert docs-only wijzigingen, gewijzigde scopes, gewijzigde extensions, en bouwt het CI-manifest      | Altijd bij niet-draft pushes en PR's |
| `security-scm-fast`              | Detectie van private keys en workflow-audit via `zizmor`                                                  | Altijd bij niet-draft pushes en PR's |
| `security-dependency-audit`      | Dependency-vrije production lockfile-audit tegen npm-advisories                                           | Altijd bij niet-draft pushes en PR's |
| `security-fast`                  | Vereiste aggregate voor de snelle security-jobs                                                           | Altijd bij niet-draft pushes en PR's |
| `check-dependencies`             | Production Knip dependency-only pass plus de unused-file allowlist-guard                                  | Node-relevante wijzigingen         |
| `build-artifacts`                | Bouwt `dist/`, Control UI, built-artifact checks, en herbruikbare downstream artifacts                    | Node-relevante wijzigingen         |
| `checks-fast-core`               | Snelle Linux-correctness lanes zoals bundled/plugin-contract/protocol-checks                              | Node-relevante wijzigingen         |
| `checks-fast-contracts-channels` | Sharded channel contract-checks met een stabiel aggregate check-resultaat                                 | Node-relevante wijzigingen         |
| `checks-node-core-test`          | Core Node-testshards, exclusief channel-, bundled-, contract- en extension-lanes                          | Node-relevante wijzigingen         |
| `check`                          | Sharded equivalent van de lokale main-gate: prod types, lint, guards, test types, en strict smoke         | Node-relevante wijzigingen         |
| `check-additional`               | Architecture-, boundary-, extension-surface guards, package-boundary, en gateway-watch shards             | Node-relevante wijzigingen         |
| `build-smoke`                    | Built-CLI smoke tests en startup-memory smoke                                                             | Node-relevante wijzigingen         |
| `checks`                         | Verifier voor built-artifact channel tests                                                                | Node-relevante wijzigingen         |
| `checks-node-compat-node22`      | Node 22 compatibility build en smoke lane                                                                 | Handmatige CI-dispatch voor releases |
| `check-docs`                     | Docs-formatting, lint en broken-link checks                                                               | Docs gewijzigd                     |
| `skills-python`                  | Ruff + pytest voor Python-backed Skills                                                                   | Python-skill-relevante wijzigingen |
| `checks-windows`                 | Windows-specifieke process/path tests plus gedeelde runtime import specifier-regressions                  | Windows-relevante wijzigingen      |
| `macos-node`                     | macOS TypeScript-testlane met de gedeelde built artifacts                                                 | macOS-relevante wijzigingen        |
| `macos-swift`                    | Swift lint, build en tests voor de macOS-app                                                              | macOS-relevante wijzigingen        |
| `android`                        | Android-unit tests voor beide flavors plus één debug APK-build                                            | Android-relevante wijzigingen      |
| `test-performance-agent`         | Dagelijkse Codex slow-testoptimalisatie na trusted activity                                               | Succesvolle main-CI of handmatige dispatch |
| `openclaw-performance`           | Dagelijkse/on-demand Kova runtime performance-rapporten met mock-provider, deep-profile en GPT 5.4 live lanes | Gepland en handmatige dispatch     |

## Fail-fast-volgorde

1. `preflight` beslist welke lanes überhaupt bestaan. De logica `docs-scope` en `changed-scope` zijn stappen binnen deze job, geen zelfstandige jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` en `skills-python` falen snel zonder te wachten op de zwaardere artifact- en platformmatrixjobs.
3. `build-artifacts` overlapt met de snelle Linux-lanes zodat downstream consumers kunnen starten zodra de gedeelde build klaar is.
4. Zwaardere platform- en runtime-lanes waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` en `android`.

GitHub kan vervangen jobs als `cancelled` markeren wanneer een nieuwere push op dezelfde PR of `main`-ref landt. Behandel dat als CI-ruis tenzij de nieuwste run voor dezelfde ref ook faalt. Aggregate shard-checks gebruiken `!cancelled() && always()` zodat ze nog steeds normale shard-fouten rapporteren maar niet in de wachtrij komen nadat de hele workflow al is vervangen. De automatische CI-concurrency key is geversioneerd (`CI-v7-*`), zodat een zombie aan GitHub-zijde in een oude queue group nieuwere main-runs niet onbeperkt kan blokkeren. Handmatige full-suite runs gebruiken `CI-manual-v1-*` en annuleren geen lopende runs.

## Scope en routing

Scope-logica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unit tests in `src/scripts/ci-changed-scope.test.ts`. Handmatige dispatch slaat changed-scope-detectie over en laat het preflight-manifest werken alsof elk scoped gebied is gewijzigd.

- **CI-workflowbewerkingen** valideren de Node CI-graph plus workflow-linting, maar forceren op zichzelf geen native Windows-, Android- of macOS-builds; die platform-lanes blijven scoped op platformbronwijzigingen.
- **CI routing-only bewerkingen, geselecteerde goedkope core-test fixture-bewerkingen en smalle Plugin contract helper/test-routing-bewerkingen** gebruiken een snel Node-only manifestpad: `preflight`, security en één enkele `checks-fast-core`-taak. Dat pad slaat build artifacts, Node 22 compatibility, channel contracts, volledige core shards, bundled-plugin shards en aanvullende guard-matrices over wanneer de wijziging beperkt is tot de routing- of helperoppervlakken die de snelle taak direct oefent.
- **Windows Node-checks** zijn scoped op Windows-specifieke process/path wrappers, npm/pnpm/UI runner helpers, package manager config en de CI-workflowoppervlakken die die lane uitvoeren; niet-gerelateerde source-, Plugin-, install-smoke- en test-only wijzigingen blijven op de Linux Node-lanes.

De langzaamste Node-testfamilies zijn opgesplitst of gebalanceerd zodat elke job klein blijft zonder runners te ruim te reserveren: channel contracts draaien als drie gewogen shards, kleine core unit-lanes worden gekoppeld, auto-reply draait als vier gebalanceerde workers (met de reply-subtree opgesplitst in agent-runner-, dispatch- en commands/state-routing-shards), en agentic gateway/plugin-configs worden verspreid over de bestaande source-only agentic Node-jobs in plaats van te wachten op built artifacts. Brede browser-, QA-, media- en diverse Plugin-tests gebruiken hun eigen Vitest-configs in plaats van de gedeelde Plugin catch-all. Include-pattern shards leggen timingentries vast met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een volledige config kan onderscheiden van een gefilterde shard. `check-additional` houdt package-boundary compile/canary-werk bij elkaar en scheidt runtime topology architecture van gateway watch-dekking; de boundary guard-shard draait zijn kleine onafhankelijke guards gelijktijdig binnen één job. Gateway watch, channel tests en de core support-boundary shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd.

Android CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play debug APK. De third-party flavor heeft geen afzonderlijke source set of manifest; de unit-testlane compileert de flavor nog steeds met de SMS/call-log BuildConfig-flags, terwijl een dubbele debug APK-packagingjob bij elke Android-relevante push wordt vermeden.

De `check-dependencies`-shard draait `pnpm deadcode:dependencies` (een production Knip dependency-only pass vastgezet op de nieuwste Knip-versie, met pnpm's minimum release age uitgeschakeld voor de `dlx`-installatie) en `pnpm deadcode:unused-files`, dat Knip's production unused-file-bevindingen vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. De unused-file guard faalt wanneer een PR een nieuw niet-beoordeeld ongebruikt bestand toevoegt of een verouderde allowlist-entry laat staan, terwijl intentionele dynamische Plugin-, generated-, build-, live-test- en package bridge-oppervlakken behouden blijven die Knip niet statisch kan oplossen.

## ClawSweeper activity forwarding

`.github/workflows/clawsweeper-dispatch.yml` is de target-side bridge van OpenClaw repository-activiteit naar ClawSweeper. Deze checkt geen onbetrouwbare pull request-code uit en voert die ook niet uit. De workflow maakt een GitHub App-token aan vanuit `CLAWSWEEPER_APP_PRIVATE_KEY` en dispatcht daarna compacte `repository_dispatch`-payloads naar `openclaw/clawsweeper`.

De workflow heeft vier lanes:

- `clawsweeper_item` voor exacte issue- en pull request-reviewverzoeken;
- `clawsweeper_comment` voor expliciete ClawSweeper-commando's in issue-comments;
- `clawsweeper_commit_review` voor reviewverzoeken op commitniveau bij `main`-pushes;
- `github_activity` voor algemene GitHub-activiteit die de ClawSweeper-agent mag inspecteren.

De `github_activity`-lane stuurt alleen genormaliseerde metadata door: eventtype, action, actor, repository, itemnummer, URL, titel, state en korte fragmenten voor comments of reviews wanneer aanwezig. Deze vermijdt bewust het doorsturen van de volledige webhook body. De ontvangende workflow in `openclaw/clawsweeper` is `.github/workflows/github-activity.yml`, die het genormaliseerde event naar de OpenClaw Gateway hook voor de ClawSweeper-agent post.

Algemene activiteit is observatie, geen standaardlevering. De ClawSweeper-agent ontvangt het Discord-doel in zijn prompt en mag alleen naar `#clawsweeper` posten wanneer het event verrassend, actiegericht, risicovol of operationeel nuttig is. Routinematige opens, edits, bot-churn, dubbele Webhook-ruis en normaal reviewverkeer moeten resulteren in `NO_REPLY`.

Behandel GitHub-titels, comments, bodies, reviewtekst, branchnamen en commitberichten in dit hele pad als onbetrouwbare data. Ze zijn input voor samenvatting en triage, geen instructies voor de workflow of agent-runtime.

## Handmatige dispatches

Handmatige CI-dispatches voeren dezelfde jobgrafiek uit als normale CI, maar schakelen elke niet-Android lane met scope geforceerd in: Linux Node-shards, gebundelde-Plugin-shards, channel-contracten, Node 22-compatibiliteit, `check`, `check-additional`, build-smoke, docs-controles, Python Skills, Windows, macOS en Control UI i18n. Zelfstandige handmatige CI-dispatches voeren alleen Android uit met `include_android=true`; de volledige releaseparaplu schakelt Android in door `include_android=true` door te geven. Statische Plugin-prereleasecontroles, de alleen-voor-release `agentic-plugins`-shard, de volledige batch-sweep voor extensies en Plugin-prerelease-Docker-lanes zijn uitgesloten van CI. De Docker-prereleasesuite draait alleen wanneer `Full Release Validation` de afzonderlijke `Plugin Prerelease`-workflow dispatcht met de releasevalidatie-gate ingeschakeld.

Handmatige runs gebruiken een unieke concurrencygroep zodat een volledige suite voor een releasekandidaat niet wordt geannuleerd door een andere push- of PR-run op dezelfde ref. Met de optionele `target_ref`-invoer kan een vertrouwde aanroeper die grafiek uitvoeren tegen een branch, tag of volledige commit-SHA, terwijl het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, snelle securityjobs en aggregaten (`security-scm-fast`, `security-dependency-audit`, `security-fast`), snelle protocol-/contract-/gebundelde controles, gesharde channel-contractcontroles, `check`-shards behalve lint, `check-additional`-shards en aggregaten, aggregaatverificaties voor Node-tests, docs-controles, Python Skills, workflow-sanity, labeler, auto-response; install-smoke-preflight gebruikt ook door GitHub gehoste Ubuntu zodat de Blacksmith-matrix eerder kan wachtrijen |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lichtere extensieshards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` en `check-test-types`                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node-testshards, gebundelde Plugin-testshards, `android`                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-gevoelig genoeg dat 8 vCPU meer kostte dan het opleverde); install-smoke-Docker-builds (32-vCPU-wachtrijtijd kostte meer dan het opleverde)                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                            |

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
```

De workflow installeert OCM vanuit een gepinde release en Kova vanuit de gepinde `kova_ref`-invoer, en voert daarna drie lanes uit:

- `mock-provider`: Kova-diagnostische scenario's tegen een runtime uit lokale build met deterministische nep-auth die compatibel is met OpenAI.
- `mock-deep-profile`: CPU-/heap-/traceprofilering voor hotspots bij opstarten, Gateway en agent-turns.
- `live-gpt54`: een echte OpenAI `openai/gpt-5.4` agent-turn, overgeslagen wanneer `OPENAI_API_KEY` niet beschikbaar is.

De mock-provider-lane voert na de Kova-pass ook OpenClaw-native sourceprobes uit: Gateway-opstarttiming en geheugen over standaard-, hook- en 50-Plugin-opstartgevallen; herhaalde mock-OpenAI `channel-chat-baseline` hello-loops; en CLI-opstartcommando's tegen de opgestarte Gateway. De Markdown-samenvatting van de sourceprobe staat in `source/index.md` in de rapportbundel, met de ruwe JSON ernaast.

Elke lane uploadt GitHub-artifacts. Wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd, commit de workflow ook `report.json`, `report.md`, bundels, `index.md` en sourceprobe-artifacts naar `openclaw/clawgrit-reports` onder `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. De huidige branchpointer wordt geschreven als `openclaw-performance/<ref>/latest-<lane>.json`.

## Full Release Validation

`Full Release Validation` is de handmatige parapluworkflow voor "alles uitvoeren vóór release". Deze accepteert een branch, tag of volledige commit-SHA, dispatcht de handmatige `CI`-workflow met dat doel, dispatcht `Plugin Prerelease` voor alleen-voor-release Plugin-/package-/statische-/Docker-bewijsvoering, en dispatcht `OpenClaw Release Checks` voor install-smoke, package-acceptatie, Docker release-path-suites, live/E2E, OpenWebUI, QA Lab-pariteit, Matrix en Telegram-lanes. Met `rerun_group=all` en `release_profile=full` voert deze ook `NPM Telegram Beta E2E` uit tegen het `release-package-under-test`-artifact uit releasecontroles. Geef na publicatie `npm_telegram_package_spec` door om dezelfde Telegram-package-lane opnieuw uit te voeren tegen het gepubliceerde npm-package.

Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
stagematrix, exacte workflowjobnamen, profielverschillen, artifacts en
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

Voor bewijs van een gepinde commit op een snel bewegende branch gebruik je de helper in plaats van
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-workflowdispatchrefs moeten branches of tags zijn, geen ruwe commit-SHA's. De
helper pusht een tijdelijke `release-ci/<sha>-...`-branch op de doel-SHA,
dispatcht `Full Release Validation` vanuit die gepinde ref, verifieert dat elke childworkflow
`headSha` overeenkomt met het doel, en verwijdert de tijdelijke branch wanneer de
run is voltooid. De parapluverifier faalt ook als een childworkflow op een
andere SHA draaide.

`release_profile` bepaalt de live-/providerbreedte die aan releasecontroles wordt doorgegeven. De
handmatige releaseworkflows staan standaard op `stable`; gebruik `full` alleen wanneer je
bewust de brede adviserende provider-/mediamatrix wilt.

- `minimum` behoudt de snelste OpenAI-/core-lanes die releasekritiek zijn.
- `stable` voegt de stabiele provider-/backendset toe.
- `full` voert de brede adviserende provider-/mediamatrix uit.

De paraplu registreert de gedispatchte child-run-id's, en de laatste `Verify full validation`-job controleert de huidige conclusies van child-runs opnieuw en voegt tabellen met traagste jobs toe voor elke child-run. Als een childworkflow opnieuw wordt uitgevoerd en groen wordt, voer dan alleen de parent-verifierjob opnieuw uit om het parapluresultaat en de timingsamenvatting te vernieuwen.

Voor herstel accepteren zowel `Full Release Validation` als `OpenClaw Release Checks` `rerun_group`. Gebruik `all` voor een release candidate, `ci` voor alleen het normale volledige CI-child, `plugin-prerelease` voor alleen het Plugin-prerelease-child, `release-checks` voor elk release-child, of een smallere groep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, of `npm-telegram` op de umbrella. Dit houdt een heruitvoering van een mislukte release-box begrensd na een gerichte fix.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde ref eenmaal om te zetten naar een `release-package-under-test`-tarball, en geeft dat artifact vervolgens door aan zowel de live/E2E release-path Docker-workflow als de package-acceptance-shard. Daardoor blijven de package-bytes consistent over release-boxes heen en wordt voorkomen dat dezelfde kandidaat opnieuw wordt verpakt in meerdere child-jobs.

Dubbele `Full Release Validation`-runs voor `ref=main` en `rerun_group=all`
vervangen de oudere umbrella. De parent-monitor annuleert elke child-workflow die hij
al heeft gestart wanneer de parent wordt geannuleerd, zodat nieuwere main-validatie
niet achter een verouderde release-check-run van twee uur blijft hangen. Validatie van release-branch/tag
en gerichte rerun-groepen houden `cancel-in-progress: false`.

## Live- en E2E-shards

Het release-live/E2E-child behoudt brede native `pnpm test:live`-dekking, maar voert die uit als benoemde shards via `scripts/test-live-shard.mjs` in plaats van als één seriële job:

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
- opgesplitste media-audio/video-shards en provider-gefilterde muziekshards

Dat behoudt dezelfde bestandsdekking, terwijl trage live-providerfouten makkelijker opnieuw uit te voeren en te diagnosticeren zijn. De geaggregeerde shardnamen `native-live-extensions-o-z`, `native-live-extensions-media` en `native-live-extensions-media-music` blijven geldig voor handmatige eenmalige reruns.

De native live-mediashards draaien in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de workflow `Live Media Runner Image`. Die image installeert `ffmpeg` en `ffprobe` vooraf; mediajobs verifiëren alleen de binaries vóór de setup. Houd Docker-ondersteunde live-suites op normale Blacksmith-runners — containerjobs zijn de verkeerde plek om geneste Docker-tests te starten.

Docker-ondersteunde live model/backend-shards gebruiken een aparte gedeelde `ghcr.io/openclaw/openclaw-live-test:<sha>`-image per geselecteerde commit. De live-releaseworkflow bouwt en pusht die image eenmaal, waarna de Docker live model-, provider-gesharde Gateway-, CLI-backend-, ACP-bind- en Codex-harness-shards draaien met `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker-shards hebben expliciete timeout-limieten op scriptniveau onder de workflow-jobtimeout, zodat een vastgelopen container of cleanup-pad snel faalt in plaats van het hele release-checkbudget te gebruiken. Als die shards de volledige source Docker-target onafhankelijk opnieuw bouwen, is de release-run verkeerd geconfigureerd en verspilt die wandkloktijd aan dubbele image-builds.

## Package-acceptatie

Gebruik `Package Acceptance` wanneer de vraag is: "werkt dit installeerbare OpenClaw-package als product?" Dit verschilt van normale CI: normale CI valideert de source tree, terwijl package-acceptatie één tarball valideert via dezelfde Docker E2E-harness die gebruikers na installatie of update gebruiken.

### Jobs

1. `resolve_package` checkt `workflow_ref` uit, resolveert één package-kandidaat, schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het `package-under-test`-artifact, en print de source, workflow-ref, package-ref, versie, SHA-256 en profiel in de GitHub-stapsamenvatting.
2. `docker_acceptance` roept `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt dat artifact, valideert de tarball-inventaris, bereidt package-digest Docker-images voor wanneer nodig, en draait de geselecteerde Docker-lanes tegen dat package in plaats van de workflow-checkout te verpakken. Wanneer een profiel meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het package en de gedeelde images eenmaal voor, en waaiert die lanes vervolgens uit als parallelle gerichte Docker-jobs met unieke artifacts.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Dit draait wanneer `telegram_mode` niet `none` is en installeert hetzelfde `package-under-test`-artifact wanneer Package Acceptance er een heeft resolved; standalone Telegram-dispatch kan nog steeds een gepubliceerde npm-specificatie installeren.
4. `summary` laat de workflow falen als package-resolutie, Docker-acceptatie of de optionele Telegram-lane is mislukt.

### Kandidaatbronnen

- `source=npm` accepteert alleen `openclaw@alpha`, `openclaw@beta`, `openclaw@latest`, of een exacte OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor acceptatie van gepubliceerde prerelease/stable versies.
- `source=ref` verpakt een vertrouwde `package_ref`-branch, tag of volledige commit-SHA. De resolver haalt OpenClaw-branches/tags op, verifieert dat de geselecteerde commit bereikbaar is vanuit de repository-branchgeschiedenis of een releasetag, installeert dependencies in een detached worktree, en verpakt die met `scripts/package-openclaw-for-docker.mjs`.
- `source=url` downloadt een HTTPS `.tgz`; `package_sha256` is vereist.
- `source=artifact` downloadt één `.tgz` uit `artifact_run_id` en `artifact_name`; `package_sha256` is optioneel maar moet worden meegeleverd voor extern gedeelde artifacts.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde workflow-/harness-code die de test uitvoert. `package_ref` is de source-commit die wordt verpakt wanneer `source=ref`. Zo kan de huidige testharness oudere vertrouwde source-commits valideren zonder oude workflowlogica uit te voeren.

### Suite-profielen

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — volledige Docker release-path chunks met OpenWebUI
- `custom` — exacte `docker_lanes`; vereist wanneer `suite_profile=custom`

Het `package`-profiel gebruikt offline Plugin-dekking, zodat validatie van gepubliceerde packages niet afhankelijk is van live ClawHub-beschikbaarheid. De optionele Telegram-lane hergebruikt het `package-under-test`-artifact in `NPM Telegram Beta E2E`, waarbij het pad voor gepubliceerde npm-specificaties behouden blijft voor standalone dispatches.

Voor het beleid voor speciale update- en Plugin-tests, inclusief lokale commands,
Docker-lanes, Package Acceptance-inputs, releasestandaarden en foutentriage,
zie [Updates en plugins testen](/nl/help/testing-updates-plugins).

Releasechecks roepen Package Acceptance aan met `source=artifact`, het voorbereide release-package-artifact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` en `telegram_mode=mock-openai`. Dit houdt package-migratie, update, cleanup van verouderde Plugin-dependencies, herstel van geconfigureerde Plugin-installatie, offline Plugin, Plugin-update en Telegram-bewijs op dezelfde resolved package-tarball. Stel `package_acceptance_package_spec` in op Full Release Validation of OpenClaw Release Checks om diezelfde matrix tegen een verzonden npm-package uit te voeren in plaats van tegen het op SHA gebouwde artifact. Cross-OS-releasechecks blijven OS-specifieke onboarding, installer- en platformgedrag dekken; productvalidatie van packages/updates moet beginnen met Package Acceptance. De Docker-lane `published-upgrade-survivor` valideert één gepubliceerde package-baseline per run. In Package Acceptance is de resolved `package-under-test`-tarball altijd de kandidaat en selecteert `published_upgrade_survivor_baseline` de fallback gepubliceerde baseline, standaard `openclaw@latest`; rerun-commands voor mislukte lanes behouden die baseline. Stel `published_upgrade_survivor_baselines=all-since-2026.4.23` in om Full Release CI uit te breiden over elke stable npm-release van `2026.4.23` tot en met `latest`; `release-history` blijft beschikbaar voor handmatige bredere sampling met de oudere pre-date anchor. Stel `published_upgrade_survivor_scenarios=reported-issues` in om dezelfde baselines uit te breiden over issue-vormige fixtures voor Feishu-configuratie, behouden bootstrap-/personabestanden, geconfigureerde OpenClaw Plugin-installaties, tilde-logpaden en verouderde legacy Plugin-dependencyroots. De aparte workflow `Update Migration` gebruikt de Docker-lane `update-migration` met `all-since-2026.4.23` en `plugin-deps-cleanup` wanneer de vraag draait om uitputtende cleanup van gepubliceerde updates, niet om de normale breedte van Full Release CI. Lokale geaggregeerde runs kunnen exacte package-specificaties doorgeven met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, één lane behouden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` zoals `openclaw@2026.4.15`, of `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` instellen voor de scenariomatrix. De gepubliceerde lane configureert de baseline met een ingebakken `openclaw config set`-commandrecept, registreert receptstappen in `summary.json`, en controleert `/healthz`, `/readyz` plus RPC-status na Gateway-start. De vers verpakte Windows- en installer-lanes verifiëren ook dat een geïnstalleerd package een browser-control-override kan importeren vanuit een raw absoluut Windows-pad. De OpenAI cross-OS agent-turn smoke gebruikt standaard `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer ingesteld, anders `openai/gpt-5.4`, zodat het installatie- en Gateway-bewijs op een GPT-5-testmodel blijft en GPT-4.x-standaarden worden vermeden.

### Legacy-compatibiliteitsvensters

Package Acceptance heeft begrensde legacy-compatibiliteitsvensters voor al gepubliceerde packages. Packages tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen het compatibiliteitspad gebruiken:

- bekende private QA-vermeldingen in `dist/postinstall-inventory.json` mogen verwijzen naar bestanden die uit de tarball zijn weggelaten;
- `doctor-switch` mag de subcase voor `gateway install --wrapper`-persistentie overslaan wanneer het package die flag niet beschikbaar maakt;
- `update-channel-switch` mag ontbrekende `pnpm.patchedDependencies` verwijderen uit de van tarball afgeleide nep-git-fixture en mag ontbrekende gepersisteerde `update.channel` loggen;
- Plugin-smokes mogen legacy install-record-locaties lezen of ontbrekende marketplace install-record-persistentie accepteren;
- `plugin-update` mag migratie van configmetadata toestaan, terwijl nog steeds vereist is dat het install-record en no-reinstall-gedrag ongewijzigd blijven.

Het gepubliceerde package `2026.4.26` mag ook waarschuwen voor metadata-stampbestanden van lokale builds die al zijn verzonden. Latere packages moeten aan de moderne contracten voldoen; dezelfde condities falen dan in plaats van te waarschuwen of over te slaan.

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

Begin bij het debuggen van een mislukte package acceptance-run met de `resolve_package`-samenvatting om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de onderliggende `docker_acceptance`-run en de Docker-artefacten ervan: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logboeken, fasetimings en opdrachten voor opnieuw uitvoeren. Geef de voorkeur aan het opnieuw uitvoeren van het mislukte package-profiel of de exacte Docker-lanes in plaats van de volledige releasevalidatie opnieuw uit te voeren.

## Install smoke

De afzonderlijke workflow `Install Smoke` hergebruikt hetzelfde scopescript via zijn eigen `preflight`-job. Deze splitst smoke-dekking op in `run_fast_install_smoke` en `run_full_install_smoke`.

- **Snel pad** draait voor pull requests die Docker-/pakketoppervlakken, meegeleverde pluginpakket-/manifestwijzigingen, of core plugin-/kanaal-/gateway-/Plugin SDK-oppervlakken raken die de Docker-smokejobs uitoefenen. Alleen-bronwijzigingen in meegeleverde plugins, alleen-testbewerkingen en alleen-docs-bewerkingen reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image eenmaal, controleert de CLI, draait de agents-delete shared-workspace CLI-smoke, draait de container gateway-network e2e, verifieert een buildargument voor een meegeleverde extensie en draait het begrensde meegeleverde-plugin-Docker-profiel onder een totale opdrachttime-out van 240 seconden (waarbij de Docker-run van elk scenario afzonderlijk is begrensd).
- **Volledig pad** behoudt QR-package-install en installer-Docker-/updatedekking voor nachtelijke geplande runs, handmatige dispatches, workflow-call releasechecks en pull requests die echt installer-/pakket-/Docker-oppervlakken raken. In volledige modus bereidt install-smoke één GHCR-root-Dockerfile-smoke-image voor de doel-SHA voor of hergebruikt deze, en draait daarna QR-package-install, root-Dockerfile-/Gateway-smokes, installer-/updatesmokes en de snelle meegeleverde-plugin Docker E2E als afzonderlijke jobs, zodat installerwerk niet hoeft te wachten achter de root-image-smokes.

`main`-pushes (inclusief mergecommits) forceren het volledige pad niet; wanneer de changed-scope-logica bij een push volledige dekking zou aanvragen, behoudt de workflow de snelle Docker-smoke en laat deze de volledige install-smoke over aan nachtelijke of releasevalidatie.

De trage Bun global install image-provider-smoke wordt afzonderlijk begrensd door `run_bun_global_install_smoke`. Deze draait volgens het nachtelijke schema en vanuit de workflow voor releasechecks, en handmatige `Install Smoke`-dispatches kunnen ervoor kiezen deze op te nemen, maar pull requests en `main`-pushes doen dat niet. QR- en installer-Docker-tests behouden hun eigen installatiefgerichte Dockerfiles.

## Lokale Docker E2E

`pnpm test:docker:all` bouwt vooraf één gedeelde live-testimage, verpakt OpenClaw eenmaal als een npm-tarball en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images:

- een kale Node/Git-runner voor installer-/update-/plugin-dependency-lanes;
- een functionele image die dezelfde tarball in `/app` installeert voor normale functionaliteitslanes.

Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en draait daarna lanes met `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Afstelopties

| Variabele                              | Standaard | Doel                                                                                          |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Aantal slots in de hoofdpool voor normale lanes.                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Aantal slots in de providergevoelige tail-pool.                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limiet voor gelijktijdige live-lanes zodat providers niet gaan throttlen.                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limiet voor gelijktijdige npm-install-lanes.                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limiet voor gelijktijdige multi-service-lanes.                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Spreiding tussen lane-starts om Docker daemon create-stormen te voorkomen; stel in op `0` voor geen spreiding. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Fallbacktime-out per lane (120 minuten); geselecteerde live-/tail-lanes gebruiken strakkere limieten. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | niet gezet | `1` print het schedulerplan zonder lanes te draaien.                                         |
| `OPENCLAW_DOCKER_ALL_LANES`            | niet gezet | Kommagescheiden exacte lanelijst; slaat cleanup-smoke over zodat agents één mislukte lane kunnen reproduceren. |

Een lane die zwaarder is dan zijn effectieve limiet kan nog steeds vanuit een lege pool starten en draait daarna alleen totdat hij capaciteit vrijgeeft. De lokale totale preflights controleren Docker, verwijderen verouderde OpenClaw E2E-containers, geven status van actieve lanes uit, bewaren lanetimings voor langste-eerst-volgorde en stoppen standaard met het plannen van nieuwe gepoolde lanes na de eerste fout.

### Herbruikbare live-/E2E-workflow

De herbruikbare live-/E2E-workflow vraagt `scripts/test-docker-all.mjs --plan-json` welke pakket-, image-soort-, live-image-, lane- en credentialdekking vereist is. `scripts/docker-e2e.mjs` zet dat plan daarna om in GitHub-outputs en samenvattingen. Het verpakt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een pakketartefact van de huidige run of downloadt een pakketartefact uit `package_artifact_run_id`; valideert de tarball-inventaris; bouwt en pusht package-digest-getagde bare/functional GHCR Docker E2E-images via de Docker-layercache van Blacksmith wanneer het plan lanes met geïnstalleerde pakketten nodig heeft; en hergebruikt opgegeven `docker_e2e_bare_image`-/`docker_e2e_functional_image`-inputs of bestaande package-digest-images in plaats van opnieuw te bouwen. Docker-imagepulls worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry-/cachestream snel opnieuw probeert in plaats van het grootste deel van het kritieke CI-pad te verbruiken.

### Releasepad-chunks

Release-Docker-dekking draait kleinere gechunkte jobs met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elke chunk alleen de image-soort ophaalt die hij nodig heeft en meerdere lanes via dezelfde gewogen scheduler uitvoert:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Huidige release-Docker-chunks zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` en `plugins-runtime-install-a` tot en met `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` en `plugins-integrations` blijven totale plugin-/runtime-aliassen. De lane-alias `install-e2e` blijft de totale handmatige rerun-alias voor beide providerinstallerlanes.

OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige releasepaddekking daarom vraagt, en behoudt alleen een zelfstandige `openwebui`-chunk voor alleen-OpenWebUI-dispatches. Bundled-channel update-lanes proberen eenmaal opnieuw bij tijdelijke npm-netwerkfouten.

Elke chunk uploadt `.artifacts/docker-tests/` met lane-logboeken, timings, `summary.json`, `failures.json`, fasetimings, schedulerplan-JSON, tabellen met trage lanes en opdrachten voor opnieuw uitvoeren per lane. De workflowinput `docker_lanes` draait geselecteerde lanes tegen de voorbereide images in plaats van de chunkjobs, waardoor debuggen van mislukte lanes beperkt blijft tot één gerichte Docker-job en het pakketartefact voor die run wordt voorbereid, gedownload of hergebruikt; als een geselecteerde lane een live-Docker-lane is, bouwt de gerichte job de live-testimage lokaal voor die rerun. Gegenereerde GitHub-rerunopdrachten per lane bevatten `package_artifact_run_id`, `package_artifact_name` en voorbereide image-inputs wanneer die waarden bestaan, zodat een mislukte lane exact het pakket en de images van de mislukte run kan hergebruiken.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

De geplande live-/E2E-workflow draait dagelijks de volledige releasepad-Docker-suite.

## Plugin Prerelease

`Plugin Prerelease` is duurdere product-/pakketdekking, dus het is een afzonderlijke workflow die wordt gedispatcht door `Full Release Validation` of door een expliciete operator. Normale pull requests, `main`-pushes en zelfstandige handmatige CI-dispatches houden die suite uitgeschakeld. Deze verdeelt meegeleverde plugintests over acht extensieworkers; die extensieshardjobs draaien maximaal twee pluginconfiguratiegroepen tegelijk met één Vitest-worker per groep en een grotere Node-heap, zodat importzware pluginbatches geen extra CI-jobs creëren. Het alleen-release Docker-prereleasepad batcht gerichte Docker-lanes in kleine groepen om te voorkomen dat tientallen runners worden gereserveerd voor jobs van één tot drie minuten.

## QA Lab

QA Lab heeft toegewezen CI-lanes buiten de hoofdworkflow met slimme scope. Agentic parity is genest onder de brede QA- en releaseharnesses, niet als zelfstandige PR-workflow. Gebruik `Full Release Validation` met `rerun_group=qa-parity` wanneer parity moet meelopen met een brede validatierun.

- De workflow `QA-Lab - All Lanes` draait elke nacht op `main` en bij handmatige dispatch; deze waaiert de mock parity-lane, live Matrix-lane en live Telegram- en Discord-lanes uit als parallelle jobs. Live-jobs gebruiken de omgeving `qa-live-shared`, en Telegram/Discord gebruiken Convex-leases.

Releasechecks draaien Matrix- en Telegram-live-transportlanes met de deterministische mockprovider en mock-gekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het kanaalcontract is geïsoleerd van live-modellatentie en normale provider-plugin-startup. De live transport-Gateway schakelt memory search uit omdat QA parity geheugengedrag afzonderlijk dekt; providerconnectiviteit wordt gedekt door de afzonderlijke live model-, native provider- en Docker provider-suites.

Matrix gebruikt `--profile fast` voor geplande en releasegates, en voegt `--fail-fast` alleen toe wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaard en de handmatige workflowinput blijven `all`; handmatige `matrix_profile=all`-dispatch shardt volledige Matrix-dekking altijd in `transport`, `media`, `e2ee-smoke`, `e2ee-deep` en `e2ee-cli`-jobs.

`OpenClaw Release Checks` draait ook de releasekritieke QA Lab-lanes vóór releasegoedkeuring; de QA parity-gate draait de candidate- en baseline-packs als parallelle lanejobs en downloadt daarna beide artefacten naar een kleine rapportjob voor de uiteindelijke parity-vergelijking.

Volg voor normale PR's gescopete CI-/checkbewijzen in plaats van parity als vereiste status te behandelen.

## CodeQL

De `CodeQL`-workflow is bewust een smalle eerste beveiligingsscanner, niet de volledige repository-sweep. Dagelijkse, handmatige en niet-concept pull request-guard-runs scannen Actions-workflowcode plus de JavaScript/TypeScript-oppervlakken met het hoogste risico met beveiligingsquery's met hoge zekerheid, gefilterd op hoge/kritieke `security-severity`.

De pull request-guard blijft licht: hij start alleen voor wijzigingen onder `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` of `src`, en draait dezelfde beveiligingsmatrix met hoge zekerheid als de geplande workflow. Android- en macOS-CodeQL blijven buiten de PR-standaarden.

### Beveiligingscategorieën

| Categorie                                         | Oppervlak                                                                                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, geheimen, sandbox, cron en gateway-baseline                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Implementatiecontracten van core-kanalen plus de runtime van kanaal-plugins, gateway, Plugin-SDK, geheimen, audit-aanraakpunten    |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP-parsing, netwerkguard, web-fetch en SSRF-beleidsoppervlakken van de Plugin-SDK                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-servers, helpers voor procesuitvoering, uitgaande levering en gates voor tooluitvoering door agents                            |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-installatie, loader, manifest, registry, package-manager-installatie, source-loading en vertrouwensoppervlakken van het packagecontract van de Plugin-SDK |

### Platformspecifieke beveiligingsshards

- `CodeQL Android Critical Security` — geplande Android-beveiligingsshard. Bouwt de Android-app handmatig voor CodeQL op de kleinste Blacksmith Linux-runner die door workflow sanity wordt geaccepteerd. Uploadt onder `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — wekelijkse/handmatige macOS-beveiligingsshard. Bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert resultaten van dependency-builds uit geüploade SARIF en uploadt onder `/codeql-critical-security/macos`. Buiten dagelijkse standaarden gehouden omdat de macOS-build de runtime domineert, zelfs wanneer die schoon is.

### Critical Quality-categorieën

`CodeQL Critical Quality` is de bijpassende niet-beveiligingsshard. Deze draait alleen JavaScript/TypeScript-kwaliteitsquery's met error-severity en zonder beveiligingsfocus over smalle oppervlakken met hoge waarde op de kleinere Blacksmith Linux-runner. De pull request-guard is bewust kleiner dan het geplande profiel: niet-concept-PR's draaien alleen de bijpassende shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` en `plugin-sdk-reply-runtime` voor wijzigingen in agent-command/model/tool-uitvoering en reply-dispatchcode, configschema/migratie/IO-code, auth/geheimen/sandbox/beveiligingscode, core-kanaal en runtime van gebundelde kanaal-plugins, gateway-protocol/servermethode, memory-runtime/SDK-koppeling, MCP/proces/uitgaande levering, provider-runtime/modelcatalogus, sessiediagnostiek/leveringsqueues, plugin-loader, Plugin-SDK/packagecontract of Plugin-SDK-reply-runtime. Wijzigingen aan CodeQL-configuratie en kwaliteitsworkflows draaien alle twaalf PR-kwaliteitsshards.

Handmatige dispatch accepteert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

De smalle profielen zijn leer-/iteratiehooks om één kwaliteitsshard geïsoleerd te draaien.

| Categorie                                               | Oppervlak                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, geheimen, sandbox, cron en gateway-beveiligingsgrenscode                                                                                                    |
| `/codeql-critical-quality/config-boundary`              | Configschema, migratie, normalisatie en IO-contracten                                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-protocolschema's en servermethodecontracten                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementatiecontracten van core-kanalen en gebundelde kanaal-plugins                                                                                             |
| `/codeql-critical-quality/agent-runtime-boundary`       | Command-uitvoering, model/provider-dispatch, auto-reply-dispatch en -queues, en runtimecontracten van het ACP-control-plane                                       |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-servers en toolbridges, helpers voor processupervisie en contracten voor uitgaande levering                                                                   |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host-SDK, memory-runtimefacades, memory Plugin-SDK-aliassen, koppeling voor memory-runtimeactivatie en memory doctor-commands                              |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interne reply-queues, sessieleveringsqueues, helpers voor uitgaande sessiebinding/levering, oppervlakken voor diagnostische events/logbundels en CLI-contracten voor session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Inbound reply-dispatch van de Plugin-SDK, helpers voor reply-payload/chunking/runtime, opties voor channel replies, leveringsqueues en helpers voor sessie/thread-binding |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisatie van modelcatalogus, provider-auth en discovery, registratie van provider-runtime, provider-standaarden/catalogi en web/search/fetch/embedding-registries |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap van Control UI, lokale persistentie, gateway-controlflows en runtimecontracten van het task-control-plane                                                |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web-fetch/search, media-IO, mediabegrip, image-generation en runtimecontracten voor media-generation                                                         |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, registry-, public-surface- en Plugin-SDK-entrypointcontracten                                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Gepubliceerde package-side Plugin-SDK-source en helpers voor het plugin-packagecontract                                                                            |

Kwaliteit blijft gescheiden van beveiliging, zodat kwaliteitsbevindingen gepland, gemeten, uitgeschakeld of uitgebreid kunnen worden zonder het beveiligingssignaal te vertroebelen. Uitbreiding van Swift-, Python- en gebundelde-plugin-CodeQL moet alleen als gescopeerde of gesharde follow-up worden teruggevoegd nadat de smalle profielen stabiele runtime en stabiel signaal hebben.

## Onderhoudsworkflows

### Docs Agent

De `Docs Agent`-workflow is een eventgedreven Codex-onderhoudslane om bestaande docs afgestemd te houden op recent gelande wijzigingen. Hij heeft geen pure planning: een succesvolle niet-bot push-CI-run op `main` kan hem triggeren, en handmatige dispatch kan hem direct draaien. Workflow-run-invocations slaan over wanneer `main` verder is gegaan of wanneer er in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is gemaakt. Wanneer hij draait, beoordeelt hij het commitbereik van de vorige niet-overgeslagen source-SHA van Docs Agent tot de huidige `main`, zodat één uurlijkse run alle main-wijzigingen kan dekken die sinds de laatste docspass zijn verzameld.

### Test Performance Agent

De `Test Performance Agent`-workflow is een eventgedreven Codex-onderhoudslane voor trage tests. Hij heeft geen pure planning: een succesvolle niet-bot push-CI-run op `main` kan hem triggeren, maar hij slaat over als er die UTC-dag al een andere workflow-run-invocation heeft gedraaid of draait. Handmatige dispatch omzeilt die dagelijkse activiteitsgate. De lane bouwt een gegroepeerd Vitest-performancerapport voor de volledige suite, laat Codex alleen kleine testperformancefixes maken die coverage behouden in plaats van brede refactors, draait daarna het rapport voor de volledige suite opnieuw en wijst wijzigingen af die het baseline-aantal geslaagde tests verlagen. Als de baseline falende tests heeft, mag Codex alleen duidelijke failures fixen en moet het after-agent-rapport voor de volledige suite slagen voordat er iets wordt gecommit. Wanneer `main` vooruitgaat voordat de bot-push landt, rebaset de lane de gevalideerde patch, draait `pnpm check:changed` opnieuw en probeert de push opnieuw; conflicterende stale patches worden overgeslagen. Hij gebruikt GitHub-hosted Ubuntu zodat de Codex-action dezelfde drop-sudo-veiligheidshouding kan behouden als de docs-agent.

### Dubbele PR's na merge

De `Duplicate PRs After Merge`-workflow is een handmatige maintainer-workflow voor opschoning van duplicaten na landing. Hij staat standaard op dry-run en sluit alleen expliciet vermelde PR's wanneer `apply=true`. Voordat GitHub wordt gemuteerd, verifieert hij dat de gelande PR is gemerged en dat elk duplicaat óf een gedeeld gerefereerd issue heeft óf overlappende gewijzigde hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale check-gates en routering voor wijzigingen

Lokale changed-lane-logica leeft in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale check-gate is strikter over architectuurgrenzen dan de brede CI-platformscope:

- wijzigingen in core-productie draaien core prod- en core test-typecheck plus core lint/guards;
- wijzigingen alleen in core-tests draaien alleen core test-typecheck plus core lint;
- wijzigingen in extension-productie draaien extension prod- en extension test-typecheck plus extension lint;
- wijzigingen alleen in extension-tests draaien extension test-typecheck plus extension lint;
- wijzigingen in publieke Plugin-SDK- of plugin-contracten breiden uit naar extension-typecheck omdat extensions van die core-contracten afhangen (Vitest-extension-sweeps blijven expliciet testwerk);
- release-metadata-only versiebumpen draaien gerichte version/config/root-dependency-checks;
- onbekende root/config-wijzigingen falen veilig naar alle check-lanes.

Lokale changed-test-routering leeft in `scripts/test-projects.test-support.mjs` en is bewust goedkoper dan `check:changed`: directe testbewerkingen draaien zichzelf, source-bewerkingen geven de voorkeur aan expliciete mappings, daarna sibling-tests en import-graph-afhankelijken. Gedeelde group-room-leveringsconfiguratie is een van de expliciete mappings: wijzigingen aan de group visible-reply-config, source reply delivery mode of de system prompt van de message-tool lopen via de core reply-tests plus Discord- en Slack-leveringsregressies, zodat een gedeelde standaardwijziging faalt vóór de eerste PR-push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging zo harness-breed is dat de goedkope gemapte set geen betrouwbare proxy is.

## Testbox-validatie

Voer Testbox uit vanaf de repo-root en geef voor brede verificatie de voorkeur aan een vers opgewarmde box. Voer, voordat je een trage gate besteedt aan een box die is hergebruikt, verlopen is of net een onverwacht grote synchronisatie heeft gerapporteerd, eerst `pnpm testbox:sanity` binnen de box uit.

De sanity check faalt snel wanneer vereiste rootbestanden zoals `pnpm-lock.yaml` zijn verdwenen of wanneer `git status --short` minstens 200 bijgehouden verwijderingen toont. Dat betekent meestal dat de externe synchronisatiestatus geen betrouwbare kopie van de PR is; stop die box en warm in plaats daarvan een nieuwe op, in plaats van de producttestfout te debuggen. Stel voor PR's met opzettelijke grote verwijderingen `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor die sanity-run.

`pnpm testbox:run` beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de synchronisatiefase blijft zonder uitvoer na de synchronisatie. Stel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` in om die beveiliging uit te schakelen, of gebruik een grotere millisecondewaarde voor ongewoon grote lokale diffs.

Crabbox is het repo-eigen tweede pad voor externe boxen voor Linux-verificatie wanneer Blacksmith niet beschikbaar is of wanneer beheerde cloudcapaciteit de voorkeur heeft. Warm een box op, hydrateer deze via de projectworkflow en voer vervolgens opdrachten uit via de Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` beheert de standaardinstellingen voor provider, synchronisatie en GitHub Actions-hydratatie. Het sluit lokale `.git` uit, zodat de gehydrateerde Actions-checkout zijn eigen externe Git-metadata behoudt in plaats van maintainer-lokale remotes en objectstores te synchroniseren, en het sluit lokale runtime-/buildartefacten uit die nooit mogen worden overgedragen. `.github/workflows/crabbox-hydrate.yml` beheert checkout, Node-/pnpm-installatie, het ophalen van `origin/main` en de niet-geheime omgevingsoverdracht die latere `crabbox run --id <cbx_id>`-opdrachten sourcen.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Ontwikkelingskanalen](/nl/install/development-channels)
