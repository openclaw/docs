---
read_when:
    - Je moet begrijpen waarom een CI-taak wel of niet is uitgevoerd
    - Je debugt een falende GitHub Actions-controle
    - Je coördineert een releasevalidatierun of heruitvoering
    - Je wijzigt ClawSweeper-dispatch of het doorsturen van GitHub-activiteit
summary: CI-taakgrafiek, scopecontroles, release-overkoepelingen en lokale commando-equivalenten
title: CI-pijplijn
x-i18n:
    generated_at: "2026-05-03T21:27:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e07fc44aa844cb66ce529c570cbbbbf502a61bcbcbc3d9488557abb459ef7678
    source_path: ci.md
    workflow: 16
---

OpenClaw CI draait bij elke push naar `main` en elke pull request. De job `preflight` classificeert de diff en schakelt dure lanes uit wanneer alleen niet-gerelateerde gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen bewust slimme scoping en waaieren de volledige graph uit voor releasekandidaten en brede validatie. Android-lanes blijven opt-in via `include_android`. Release-only plugin-dekking staat in de afzonderlijke workflow [`Plugin Prerelease`](#plugin-prerelease) en draait alleen vanuit [`Full Release Validation`](#full-release-validation) of een expliciete handmatige dispatch.

## Pipeline-overzicht

| Job                              | Doel                                                                                                      | Wanneer deze draait                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `preflight`                      | Detecteert docs-only wijzigingen, gewijzigde scopes, gewijzigde extensions, en bouwt het CI-manifest      | Altijd bij niet-draft pushes en PR's   |
| `security-scm-fast`              | Detectie van privésleutels en workflow-audit via `zizmor`                                                 | Altijd bij niet-draft pushes en PR's   |
| `security-dependency-audit`      | Dependency-vrije audit van production lockfile tegen npm-advisories                                       | Altijd bij niet-draft pushes en PR's   |
| `security-fast`                  | Vereiste aggregatie voor de snelle security-jobs                                                          | Altijd bij niet-draft pushes en PR's   |
| `check-dependencies`             | Production Knip dependency-only pass plus de guard voor de allowlist voor ongebruikte bestanden           | Node-relevante wijzigingen             |
| `build-artifacts`                | Bouwt `dist/`, Control UI, checks voor gebouwde artefacten en herbruikbare downstream artefacten          | Node-relevante wijzigingen             |
| `checks-fast-core`               | Snelle Linux-correctheidslanes zoals bundled/plugin-contract/protocol-checks                              | Node-relevante wijzigingen             |
| `checks-fast-contracts-channels` | Gespreide channel-contractchecks met een stabiel geaggregeerd checkresultaat                              | Node-relevante wijzigingen             |
| `checks-node-core-test`          | Core Node-testshards, exclusief channel-, bundled-, contract- en extension-lanes                          | Node-relevante wijzigingen             |
| `check`                          | Gespreide equivalent van de lokale hoofdgate: prod-types, lint, guards, testtypes en strikte smoke        | Node-relevante wijzigingen             |
| `check-additional`               | Architectuur, gespreide boundary/prompt-drift, extension-guards, package-boundary en Gateway watch        | Node-relevante wijzigingen             |
| `build-smoke`                    | Built-CLI smoke-tests en startup-memory smoke                                                             | Node-relevante wijzigingen             |
| `checks`                         | Verifier voor channel-tests met gebouwde artefacten                                                       | Node-relevante wijzigingen             |
| `checks-node-compat-node22`      | Node 22-compatibiliteitsbuild en smoke-lane                                                               | Handmatige CI-dispatch voor releases   |
| `check-docs`                     | Docs-formatting, lint en broken-link checks                                                               | Docs gewijzigd                         |
| `skills-python`                  | Ruff + pytest voor Python-backed Skills                                                                   | Python-Skills-relevante wijzigingen    |
| `checks-windows`                 | Windows-specifieke process/path-tests plus gedeelde regressies voor runtime-importspecifiers              | Windows-relevante wijzigingen          |
| `macos-node`                     | macOS TypeScript-testlane met de gedeelde gebouwde artefacten                                             | macOS-relevante wijzigingen            |
| `macos-swift`                    | Swift-lint, build en tests voor de macOS-app                                                              | macOS-relevante wijzigingen            |
| `android`                        | Android-unittests voor beide flavors plus één debug-APK-build                                             | Android-relevante wijzigingen          |
| `test-performance-agent`         | Dagelijkse Codex-optimalisatie van trage tests na vertrouwde activiteit                                   | Succesvolle main-CI of handmatige dispatch |
| `openclaw-performance`           | Dagelijkse/on-demand Kova-runtimeperformancerapporten met mock-provider, deep-profile en GPT 5.4 live-lanes | Gepland en handmatige dispatch         |

## Fail-fast-volgorde

1. `preflight` bepaalt welke lanes überhaupt bestaan. De logica `docs-scope` en `changed-scope` zijn stappen binnen deze job, geen zelfstandige jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` en `skills-python` falen snel zonder te wachten op de zwaardere artefact- en platformmatrixjobs.
3. `build-artifacts` overlapt met de snelle Linux-lanes, zodat downstream consumers kunnen starten zodra de gedeelde build klaar is.
4. Zwaardere platform- en runtime-lanes waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` en `android`.

GitHub kan vervangen jobs als `cancelled` markeren wanneer een nieuwere push op dezelfde PR of `main`-ref landt. Behandel dat als CI-ruis, tenzij de nieuwste run voor dezelfde ref ook faalt. Geaggregeerde shard-checks gebruiken `!cancelled() && always()`, zodat ze normale shard-fouten nog steeds rapporteren maar niet in de wachtrij komen nadat de hele workflow al is vervangen. De automatische CI-concurrency-key is geversioneerd (`CI-v7-*`), zodat een zombie aan GitHub-zijde in een oude queue group nieuwere main-runs niet onbeperkt kan blokkeren. Handmatige full-suite-runs gebruiken `CI-manual-v1-*` en annuleren lopende runs niet.

## Scope en routing

Scope-logica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unittests in `src/scripts/ci-changed-scope.test.ts`. Handmatige dispatch slaat changed-scope-detectie over en laat het preflight-manifest handelen alsof elk scoped gebied is gewijzigd.

- **CI-workflowwijzigingen** valideren de Node CI-graph plus workflow-linting, maar forceren op zichzelf geen Windows-, Android- of macOS-native builds; die platformlanes blijven gescoped tot platformbronwijzigingen.
- **CI-routing-only wijzigingen, geselecteerde goedkope core-test fixture-wijzigingen en smalle plugin-contract helper/test-routing wijzigingen** gebruiken een snel Node-only manifestpad: `preflight`, security en één `checks-fast-core`-taak. Dat pad slaat build-artefacten, Node 22-compatibiliteit, channel-contracten, volledige core-shards, bundled-plugin-shards en aanvullende guard-matrices over wanneer de wijziging beperkt is tot de routing- of helperoppervlakken die de snelle taak direct oefent.
- **Windows Node-checks** zijn gescoped tot Windows-specifieke process/path-wrappers, npm/pnpm/UI-runnerhelpers, package manager-configuratie en de CI-workflowoppervlakken die die lane uitvoeren; niet-gerelateerde source-, plugin-, install-smoke- en test-only wijzigingen blijven op de Linux Node-lanes.

De traagste Node-testfamilies zijn gesplitst of gebalanceerd zodat elke job klein blijft zonder runners te ruim te reserveren: channel-contracten draaien als drie gewogen shards, core unit fast/support-lanes draaien afzonderlijk, core runtime infra is gesplitst tussen state- en process/config-shards, auto-reply draait als gebalanceerde workers (waarbij de reply-subtree is gesplitst in agent-runner-, dispatch- en commands/state-routing-shards), en agentic Gateway/server-configs zijn gesplitst over chat/auth/model/http-plugin/runtime/startup-lanes in plaats van te wachten op gebouwde artefacten. Brede browser-, QA-, media- en diverse plugin-tests gebruiken hun eigen Vitest-configs in plaats van de gedeelde plugin catch-all. Include-pattern-shards registreren timingvermeldingen met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een volledige config kan onderscheiden van een gefilterde shard. `check-additional` houdt package-boundary compile/canary-werk bij elkaar en scheidt runtime-topologiearchitectuur van Gateway watch-dekking; de boundary-guardlijst is over vier matrixshards gestreept, waarbij elke shard geselecteerde onafhankelijke guards gelijktijdig draait en per-check timings afdrukt, inclusief `pnpm prompt:snapshots:check`, zodat Codex runtime happy-path prompt-drift wordt vastgepind aan de PR die deze veroorzaakte. Gateway watch, channel-tests en de core support-boundary-shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd.

Android CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play debug-APK. De third-party flavor heeft geen afzonderlijke source set of manifest; de unittests-lane compileert de flavor nog steeds met de SMS/call-log BuildConfig-flags, terwijl een dubbele debug-APK-packagingjob bij elke Android-relevante push wordt vermeden.

De shard `check-dependencies` draait `pnpm deadcode:dependencies` (een production Knip dependency-only pass vastgepind op de nieuwste Knip-versie, met pnpm's minimum release age uitgeschakeld voor de `dlx`-installatie) en `pnpm deadcode:unused-files`, dat Knip's production unused-file-bevindingen vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. De unused-file-guard faalt wanneer een PR een nieuw niet-gereviewd ongebruikt bestand toevoegt of een verouderde allowlist-vermelding laat staan, terwijl bewuste dynamische plugin-, generated-, build-, live-test- en package bridge-oppervlakken behouden blijven die Knip niet statisch kan oplossen.

## Doorsturen van ClawSweeper-activiteit

`.github/workflows/clawsweeper-dispatch.yml` is de target-side bridge van OpenClaw-repositoryactiviteit naar ClawSweeper. Deze checkt geen onvertrouwde pull request-code uit en voert die niet uit. De workflow maakt een GitHub App-token aan vanuit `CLAWSWEEPER_APP_PRIVATE_KEY` en dispatcht daarna compacte `repository_dispatch`-payloads naar `openclaw/clawsweeper`.

De workflow heeft vier lanes:

- `clawsweeper_item` voor exacte reviewverzoeken voor issues en pull requests;
- `clawsweeper_comment` voor expliciete ClawSweeper-commando's in issue-comments;
- `clawsweeper_commit_review` voor reviewverzoeken op commitniveau bij `main`-pushes;
- `github_activity` voor algemene GitHub-activiteit die de ClawSweeper-agent kan inspecteren.

De lane `github_activity` stuurt alleen genormaliseerde metadata door: eventtype, actie, actor, repository, itemnummer, URL, titel, status en korte fragmenten voor comments of reviews wanneer aanwezig. Deze vermijdt bewust het doorsturen van de volledige webhook-body. De ontvangende workflow in `openclaw/clawsweeper` is `.github/workflows/github-activity.yml`, die het genormaliseerde event naar de OpenClaw Gateway-hook voor de ClawSweeper-agent post.

Algemene activiteit is observatie, geen delivery-by-default. De ClawSweeper-agent ontvangt het Discord-doel in de prompt en hoort alleen naar `#clawsweeper` te posten wanneer de gebeurtenis verrassend, actionable, riskant of operationeel nuttig is. Routinematige opens, edits, bot-churn, dubbele webhook-ruis en normaal reviewverkeer horen te resulteren in `NO_REPLY`.

Behandel GitHub-titels, comments, bodies, reviewtekst, branchnamen en commitberichten in dit hele pad als onvertrouwde data. Ze zijn input voor samenvatting en triage, geen instructies voor de workflow of agent-runtime.

## Handmatige dispatches

Handmatige CI-dispatches voeren dezelfde jobgrafiek uit als normale CI, maar schakelen elke niet-Android gescopete lane geforceerd in: Linux Node-shards, gebundelde-Plugin-shards, kanaalcontracten, Node 22-compatibiliteit, `check`, `check-additional`, build smoke, docs-controles, Python-Skills, Windows, macOS en Control UI i18n. Zelfstandige handmatige CI-dispatches voeren alleen Android uit met `include_android=true`; de volledige release-paraplu schakelt Android in door `include_android=true` door te geven. Statische prerelease-controles voor Plugins, de release-only `agentic-plugins`-shard, de volledige batch-sweep voor extensies en Docker-lanes voor Plugin-prereleases zijn uitgesloten van CI. De Docker-prerelease-suite draait alleen wanneer `Full Release Validation` de afzonderlijke workflow `Plugin Prerelease` dispatcht met de release-validation-gate ingeschakeld.

Handmatige runs gebruiken een unieke concurrency-groep zodat een volledige suite voor een release candidate niet wordt geannuleerd door een andere push- of PR-run op dezelfde ref. Met de optionele invoer `target_ref` kan een vertrouwde aanroeper die grafiek uitvoeren tegen een branch, tag of volledige commit-SHA terwijl het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, snelle beveiligingsjobs en aggregaties (`security-scm-fast`, `security-dependency-audit`, `security-fast`), snelle protocol-/contract-/gebundelde controles, gesharde kanaalcontractcontroles, `check`-shards behalve lint, `check-additional`-shards en aggregaties, Node-testaggregatieverifiers, docs-controles, Python-Skills, workflow-sanity, labeler, auto-response; install-smoke-preflight gebruikt ook door GitHub gehoste Ubuntu zodat de Blacksmith-matrix eerder kan worden gequeued |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lichtere extensieshards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` en `check-test-types`                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node-testshards, gebundelde Plugin-testshards, `android`                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-gevoelig genoeg dat 8 vCPU meer kostte dan het opleverde); install-smoke-Docker-builds (32-vCPU-wachtrijtijd kostte meer dan het opleverde)                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                           |

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

Een handmatige dispatch benchmarkt normaal gesproken de workflow-ref. Stel `target_ref` in om een releasetag of een andere branch te benchmarken met de huidige workflowimplementatie. Gepubliceerde rapportpaden en nieuwste pointers worden gesleuteld op basis van de geteste ref, en elke `index.md` registreert de geteste ref/SHA, workflow-ref/SHA, Kova-ref, profiel, lane-authmodus, model, herhalingsaantal en scenariofilters.

De workflow installeert OCM vanuit een gepinde release en Kova vanuit `openclaw/Kova` met de gepinde invoer `kova_ref`, en voert vervolgens drie lanes uit:

- `mock-provider`: diagnostische Kova-scenario's tegen een runtime met lokale build en deterministische nep-auth die OpenAI-compatibel is.
- `mock-deep-profile`: CPU-/heap-/trace-profiling voor hotspots bij opstarten, Gateway en agent-turns.
- `live-gpt54`: een echte agent-turn met OpenAI `openai/gpt-5.4`, overgeslagen wanneer `OPENAI_API_KEY` niet beschikbaar is.

De mock-provider-lane voert na de Kova-pass ook OpenClaw-native bronprobes uit: Gateway-opstarttiming en geheugen over standaard-, hook- en 50-Plugin-opstartscenario's; herhaalde mock-OpenAI `channel-chat-baseline`-hello-loops; en CLI-opstartcommando's tegen de opgestarte Gateway. De Markdown-samenvatting van de bronprobe staat op `source/index.md` in de rapportbundel, met de ruwe JSON ernaast.

Elke lane uploadt GitHub-artifacts. Wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd, commit de workflow ook `report.json`, `report.md`, bundels, `index.md` en bronprobe-artifacts naar `openclaw/clawgrit-reports` onder `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. De huidige pointer voor de geteste ref wordt geschreven als `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Full Release Validation

`Full Release Validation` is de handmatige parapluworkflow voor "alles uitvoeren vóór release." Deze accepteert een branch, tag of volledige commit-SHA, dispatcht de handmatige `CI`-workflow met dat doel, dispatcht `Plugin Prerelease` voor release-only bewijs voor Plugin/pakket/statisch/Docker, en dispatcht `OpenClaw Release Checks` voor install smoke, package acceptance, Docker-releasepadsuites, live/E2E, OpenWebUI, QA Lab-pariteit, Matrix en Telegram-lanes. Met `rerun_group=all` en `release_profile=full` voert deze ook `NPM Telegram Beta E2E` uit tegen het artifact `release-package-under-test` uit release checks. Geef na publicatie `npm_telegram_package_spec` door om dezelfde Telegram-pakketlane opnieuw uit te voeren tegen het gepubliceerde npm-pakket.

Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
fasematrix, exacte workflowjobnamen, profielverschillen, artifacts en
gerichte rerun-handles.

`OpenClaw Release Publish` is de handmatige muterende releaseworkflow. Dispatch deze
vanuit `release/YYYY.M.D` of `main` nadat de releasetag bestaat en nadat de
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

Gebruik voor gepind commitbewijs op een snel bewegende branch de helper in plaats van
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-workflowdispatch-refs moeten branches of tags zijn, geen ruwe commit-SHA's. De
helper pusht een tijdelijke branch `release-ci/<sha>-...` op de doel-SHA,
dispatcht `Full Release Validation` vanaf die gepinde ref, verifieert dat elke child-workflow
`headSha` overeenkomt met het doel, en verwijdert de tijdelijke branch wanneer de
run is voltooid. De parapluverifier faalt ook als een child-workflow op een
andere SHA draaide.

`release_profile` bepaalt de live/provider-breedte die aan releasecontroles wordt doorgegeven. De
handmatige releaseworkflows gebruiken standaard `stable`; gebruik `full` alleen wanneer je
bewust de brede adviserende provider-/mediamatrix wilt.

- `minimum` behoudt de snelste OpenAI-/core-lanes die releasekritiek zijn.
- `stable` voegt de stabiele provider-/backendset toe.
- `full` voert de brede adviserende provider-/mediamatrix uit.

De overkoepelende workflow registreert de verzonden child-run-id's, en de laatste job `Verify full validation` controleert de huidige conclusies van child-runs opnieuw en voegt tabellen met traagste jobs toe voor elke child-run. Als een child-workflow opnieuw wordt uitgevoerd en groen wordt, voer dan alleen de parent-verifier-job opnieuw uit om het overkoepelende resultaat en de timingsamenvatting te vernieuwen.

Voor herstel accepteren zowel `Full Release Validation` als `OpenClaw Release Checks` `rerun_group`. Gebruik `all` voor een releasecandidate, `ci` voor alleen de normale volledige CI-child, `plugin-prerelease` voor alleen de Plugin-prerelease-child, `release-checks` voor elke release-child, of een smallere groep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` of `npm-telegram` op de overkoepelende workflow. Dit houdt het opnieuw uitvoeren van een mislukte releasebox begrensd na een gerichte fix.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde ref eenmaal op te lossen naar een `release-package-under-test`-tarball, en geeft dat artefact vervolgens door aan zowel de Docker-workflow voor het live/E2E-releasepad als de package-acceptance-shard. Zo blijven de package-bytes consistent tussen releaseboxen en wordt voorkomen dat dezelfde candidate in meerdere child-jobs opnieuw wordt gepackaged.

Dubbele `Full Release Validation`-runs voor `ref=main` en `rerun_group=all`
vervangen de oudere overkoepelende workflow. De parent-monitor annuleert elke child-workflow die
al is verzonden wanneer de parent wordt geannuleerd, zodat nieuwere main-validatie
niet achter een verouderde twee uur durende releasecheck-run blijft hangen. Validatie van releasebranches/-tags
en gerichte rerun-groepen behouden `cancel-in-progress: false`.

## Live- en E2E-shards

De release-live/E2E-child behoudt brede native `pnpm test:live`-dekking, maar voert die uit als benoemde shards via `scripts/test-live-shard.mjs` in plaats van als een seriële job:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- providergefilterde `native-live-src-gateway-profiles`-jobs
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- opgesplitste media-audio/video-shards en providergefilterde muziekshards

Dit behoudt dezelfde bestandsdekking terwijl trage live-providerfouten makkelijker opnieuw uit te voeren en te diagnosticeren zijn. De geaggregeerde shardnamen `native-live-extensions-o-z`, `native-live-extensions-media` en `native-live-extensions-media-music` blijven geldig voor handmatige eenmalige reruns.

De native live-mediaschards draaien in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de workflow `Live Media Runner Image`. Die image installeert `ffmpeg` en `ffprobe` vooraf; mediajobs verifiëren alleen de binaries vóór de setup. Houd Docker-ondersteunde live-suites op normale Blacksmith-runners — containerjobs zijn de verkeerde plek om geneste Docker-tests te starten.

Docker-ondersteunde live model-/backendshards gebruiken een afzonderlijke gedeelde `ghcr.io/openclaw/openclaw-live-test:<sha>`-image per geselecteerde commit. De live-releaseworkflow bouwt en pusht die image eenmaal, waarna de Docker live model-, provider-sharded Gateway-, CLI-backend-, ACP-bind- en Codex-harness-shards met `OPENCLAW_SKIP_DOCKER_BUILD=1` draaien. Gateway Docker-shards hebben expliciete scriptniveau-`timeout`-limieten onder de workflow-jobtimeout, zodat een vastgelopen container of cleanup-pad snel faalt in plaats van het hele releasecheckbudget te verbruiken. Als die shards de volledige source-Docker-target onafhankelijk opnieuw bouwen, is de releaserun verkeerd geconfigureerd en verspilt die wandkloktijd aan dubbele image-builds.

## Pakketacceptatie

Gebruik `Package Acceptance` wanneer de vraag is: "werkt dit installeerbare OpenClaw-package als product?" Het verschilt van normale CI: normale CI valideert de source tree, terwijl pakketacceptatie één tarball valideert via dezelfde Docker E2E-harness die gebruikers na installatie of update gebruiken.

### Jobs

1. `resolve_package` checkt `workflow_ref` uit, lost één packagecandidate op, schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het artefact `package-under-test`, en print de bron, workflow-ref, package-ref, versie, SHA-256 en profiel in de GitHub-stapsamenvatting.
2. `docker_acceptance` roept `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt dat artefact, valideert de tarball-inventaris, bereidt package-digest-Docker-images voor wanneer nodig, en voert de geselecteerde Docker-lanes uit tegen dat package in plaats van de workflow-checkout te packagen. Wanneer een profiel meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het package en de gedeelde images eenmaal voor, en waaiert die lanes daarna uit als parallelle gerichte Docker-jobs met unieke artefacten.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Die draait wanneer `telegram_mode` niet `none` is en installeert hetzelfde `package-under-test`-artefact wanneer Package Acceptance er een heeft opgelost; standalone Telegram-dispatch kan nog steeds een gepubliceerde npm-spec installeren.
4. `summary` laat de workflow falen als package-resolutie, Docker-acceptatie of de optionele Telegram-lane is mislukt.

### Candidate-bronnen

- `source=npm` accepteert alleen `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor gepubliceerde prerelease-/stable-acceptatie.
- `source=ref` packaget een vertrouwde `package_ref`-branch, tag of volledige commit-SHA. De resolver fetcht OpenClaw-branches/-tags, verifieert dat de geselecteerde commit bereikbaar is vanuit de repository-branchgeschiedenis of een releasetag, installeert dependencies in een detached worktree, en packaget die met `scripts/package-openclaw-for-docker.mjs`.
- `source=url` downloadt een HTTPS-`.tgz`; `package_sha256` is verplicht.
- `source=artifact` downloadt één `.tgz` uit `artifact_run_id` en `artifact_name`; `package_sha256` is optioneel maar moet worden meegegeven voor extern gedeelde artefacten.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde workflow-/harnesscode die de test uitvoert. `package_ref` is de source-commit die wordt gepackaged wanneer `source=ref`. Hierdoor kan de huidige testharness oudere vertrouwde source-commits valideren zonder oude workflowlogica uit te voeren.

### Suite-profielen

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — volledige Docker-releasepadchunks met OpenWebUI
- `custom` — exacte `docker_lanes`; verplicht wanneer `suite_profile=custom`

Het profiel `package` gebruikt offline Plugin-dekking zodat gepubliceerde-packagevalidatie niet afhankelijk is van live ClawHub-beschikbaarheid. De optionele Telegram-lane hergebruikt het `package-under-test`-artefact in `NPM Telegram Beta E2E`, waarbij het gepubliceerde npm-specpad behouden blijft voor standalone dispatches.

Voor het specifieke beleid voor update- en Plugintests, inclusief lokale opdrachten,
Docker-lanes, Package Acceptance-inputs, releasestandaarden en foutentriage,
zie [Updates en plugins testen](/nl/help/testing-updates-plugins).

Releasecontroles roepen Package Acceptance aan met `source=artifact`, het voorbereide releasepackage-artefact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` en `telegram_mode=mock-openai`. Dit houdt package-migratie, update, cleanup van verouderde Plugin-dependencies, herstel van geconfigureerde Plugin-installaties, offline Plugin, Plugin-update en Telegram-bewijs op dezelfde opgeloste package-tarball. Stel `package_acceptance_package_spec` in op Full Release Validation of OpenClaw Release Checks om diezelfde matrix uit te voeren tegen een verzonden npm-package in plaats van het uit de SHA gebouwde artefact. Cross-OS-releasecontroles dekken nog steeds OS-specifiek onboarden, installer- en platformgedrag; productvalidatie voor package/update moet beginnen met Package Acceptance. De Docker-lane `published-upgrade-survivor` valideert één gepubliceerde packagebaseline per run. In Package Acceptance is de opgeloste `package-under-test`-tarball altijd de candidate en selecteert `published_upgrade_survivor_baseline` de fallback gepubliceerde baseline, standaard `openclaw@latest`; rerun-opdrachten voor mislukte lanes behouden die baseline. Stel `published_upgrade_survivor_baselines=all-since-2026.4.23` in om Full Release CI uit te breiden over elke stable npm-release vanaf `2026.4.23` tot en met `latest`; `release-history` blijft beschikbaar voor handmatige bredere sampling met het oudere pre-date anchor. Stel `published_upgrade_survivor_scenarios=reported-issues` in om dezelfde baselines uit te breiden over issue-vormige fixtures voor Feishu-configuratie, behouden bootstrap-/persona-bestanden, geconfigureerde OpenClaw Plugin-installaties, tilde-logpaden en verouderde legacy Plugin-dependency-roots. De afzonderlijke workflow `Update Migration` gebruikt de Docker-lane `update-migration` met `all-since-2026.4.23` en `plugin-deps-cleanup` wanneer de vraag uitputtende cleanup van gepubliceerde updates is, niet normale Full Release CI-breedte. Lokale geaggregeerde runs kunnen exacte packagespecs doorgeven met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, één lane behouden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` zoals `openclaw@2026.4.15`, of `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` instellen voor de scenariomatrix. De gepubliceerde lane configureert de baseline met een ingebakken opdrachtrecept `openclaw config set`, registreert receptstappen in `summary.json`, en probet `/healthz`, `/readyz`, plus RPC-status na het starten van Gateway. De verse Windows-package- en installer-lanes verifiëren ook dat een geïnstalleerd package een browser-control-override kan importeren vanuit een raw absoluut Windows-pad. De OpenAI cross-OS agent-turn-smoke gebruikt standaard `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer ingesteld, anders `openai/gpt-5.4`, zodat het installatie- en Gateway-bewijs op een GPT-5-testmodel blijft terwijl GPT-4.x-standaarden worden vermeden.

### Legacy-compatibiliteitsvensters

Package Acceptance heeft begrensde legacy-compatibiliteitsvensters voor al gepubliceerde packages. Packages tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen het compatibiliteitspad gebruiken:

- bekende private QA-items in `dist/postinstall-inventory.json` mogen verwijzen naar bestanden die uit de tarball zijn weggelaten;
- `doctor-switch` mag de subcase voor persistentie van `gateway install --wrapper` overslaan wanneer het package die flag niet beschikbaar maakt;
- `update-channel-switch` mag ontbrekende `pnpm.patchedDependencies` verwijderen uit de van de tarball afgeleide nep-git-fixture en mag ontbrekende gepersisteerde `update.channel` loggen;
- Plugin-smokes mogen legacy install-record-locaties lezen of ontbrekende marketplace install-record-persistentie accepteren;
- `plugin-update` mag config-metadatamigratie toestaan, terwijl nog steeds vereist blijft dat het install-record en no-reinstall-gedrag ongewijzigd blijven.

Het gepubliceerde package `2026.4.26` mag ook waarschuwen voor lokale build-metadata-stampbestanden die al waren verzonden. Latere packages moeten aan de moderne contracten voldoen; dezelfde voorwaarden falen dan in plaats van te waarschuwen of over te slaan.

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

Begin bij het debuggen van een mislukte pakketacceptatierun met de `resolve_package`-samenvatting om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de onderliggende `docker_acceptance`-run en de Docker-artifacts: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logs, fasetimings en rerun-commando's. Geef de voorkeur aan het opnieuw uitvoeren van het mislukte pakketprofiel of de exacte Docker-lanes in plaats van de volledige releasevalidatie opnieuw uit te voeren.

## Installatiesmoketest

De afzonderlijke `Install Smoke`-workflow hergebruikt hetzelfde scopescript via zijn eigen `preflight`-job. De workflow splitst smoketestdekking in `run_fast_install_smoke` en `run_full_install_smoke`.

- **Snel pad** draait voor pull requests die Docker-/pakketoppervlakken raken, wijzigingen in gebundelde plugin-pakketten/-manifesten, of kernoppervlakken voor Plugin/kanaal/Gateway/Plugin SDK die door de Docker-smokejobs worden getest. Wijzigingen alleen in broncode van gebundelde plugins, test-only-bewerkingen en docs-only-bewerkingen reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image eenmalig, controleert de CLI, voert de agents-delete shared-workspace CLI-smoketest uit, voert de container-gateway-network-e2e uit, verifieert een buildargument voor een gebundelde plugin en draait het begrensde Docker-profiel voor gebundelde plugins onder een totale commandotime-out van 240 seconden (waarbij elke Docker-run van een scenario afzonderlijk begrensd is).
- **Volledig pad** behoudt QR-pakketinstallatie en Docker-/updatedekking voor installers voor nachtelijk geplande runs, handmatige dispatches, workflow-call-releasecontroles en pull requests die echt installer-/pakket-/Docker-oppervlakken raken. In volledige modus bereidt install-smoke één GHCR-root-Dockerfile-smoke-image voor de doel-SHA voor of hergebruikt die, en voert daarna QR-pakketinstallatie, root-Dockerfile-/Gateway-smokes, installer-/update-smokes en de snelle Docker-E2E voor gebundelde plugins uit als afzonderlijke jobs, zodat installerwerk niet hoeft te wachten achter de root-image-smokes.

`main`-pushes (inclusief mergecommits) forceren het volledige pad niet; wanneer de logica voor gewijzigde scope volledige dekking zou aanvragen bij een push, behoudt de workflow de snelle Docker-smoke en laat hij de volledige installatiesmoke over aan nachtelijke of releasevalidatie.

De trage Bun-global-install-image-provider-smoke wordt afzonderlijk bewaakt door `run_bun_global_install_smoke`. Die draait op het nachtelijke schema en vanuit de releasechecks-workflow, en handmatige `Install Smoke`-dispatches kunnen ervoor kiezen, maar pull requests en `main`-pushes doen dat niet. QR- en installer-Docker-tests behouden hun eigen installatiegerichte Dockerfiles.

## Lokale Docker-E2E

`pnpm test:docker:all` bouwt vooraf één gedeelde live-testimage, verpakt OpenClaw eenmaal als een npm-tarball en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images:

- een kale Node/Git-runner voor installer-/update-/plugin-dependency-lanes;
- een functionele image die dezelfde tarball in `/app` installeert voor normale functionaliteitslanes.

Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en voert daarna lanes uit met `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Instelbare waarden

| Variabele                              | Standaard | Doel                                                                                          |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Aantal main-pool-slots voor normale lanes.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Aantal providergevoelige tail-pool-slots.                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limiet voor gelijktijdige live-lanes zodat providers niet throttlen.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limiet voor gelijktijdige npm-installatielanes.                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limiet voor gelijktijdige multi-service-lanes.                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Spreiding tussen lane-starts om Docker-daemon-create-stormen te vermijden; zet op `0` voor geen spreiding. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Fallbacktime-out per lane (120 minuten); geselecteerde live-/tail-lanes gebruiken strakkere limieten. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset     | `1` drukt het schedulerplan af zonder lanes uit te voeren.                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset     | Door komma's gescheiden exacte lanelijst; slaat cleanup-smoke over zodat agents één mislukte lane kunnen reproduceren. |

Een lane die zwaarder is dan zijn effectieve limiet kan nog steeds starten vanuit een lege pool, en draait daarna alleen totdat hij capaciteit vrijgeeft. De lokale aggregatie voert Docker-preflights uit, verwijdert verouderde OpenClaw-E2E-containers, geeft actieve-lane-status uit, bewaart lanetimings voor longest-first-volgorde en stopt standaard met het plannen van nieuwe gepoolde lanes na de eerste fout.

### Herbruikbare live-/E2E-workflow

De herbruikbare live-/E2E-workflow vraagt `scripts/test-docker-all.mjs --plan-json` welke pakket-, imagekind-, live-image-, lane- en credentialdekking vereist is. `scripts/docker-e2e.mjs` zet dat plan daarna om in GitHub-outputs en samenvattingen. De workflow verpakt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een pakketartifact uit de huidige run, of downloadt een pakketartifact uit `package_artifact_run_id`; valideert de tarballinventory; bouwt en pusht bare/functional GHCR Docker-E2E-images met package-digest-tags via de Docker-layercache van Blacksmith wanneer het plan lanes met geïnstalleerd pakket nodig heeft; en hergebruikt opgegeven `docker_e2e_bare_image`-/`docker_e2e_functional_image`-inputs of bestaande package-digest-images in plaats van opnieuw te bouwen. Docker-image-pulls worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry-/cachestream snel opnieuw wordt geprobeerd in plaats van het grootste deel van het kritieke CI-pad te verbruiken.

### Releasepad-chunks

Release-Docker-dekking draait kleinere chunked jobs met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elke chunk alleen het imagekind ophaalt dat hij nodig heeft en meerdere lanes via dezelfde gewogen scheduler uitvoert:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Huidige release-Docker-chunks zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` en `plugins-runtime-install-a` tot en met `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` en `plugins-integrations` blijven geaggregeerde plugin-/runtime-aliassen. De `install-e2e`-lanealias blijft de geaggregeerde handmatige rerun-alias voor beide provider-installerlanes.

OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige releasepath-dekking daarom vraagt, en behoudt alleen een zelfstandige `openwebui`-chunk voor OpenWebUI-only-dispatches. Bundled-channel-updatelanes proberen één keer opnieuw bij tijdelijke npm-netwerkfouten.

Elke chunk uploadt `.artifacts/docker-tests/` met lane-logs, timings, `summary.json`, `failures.json`, fasetimings, schedulerplan-JSON, slow-lane-tabellen en rerun-commando's per lane. De workflowinput `docker_lanes` voert geselecteerde lanes uit tegen de voorbereide images in plaats van de chunkjobs, waardoor debugging van mislukte lanes begrensd blijft tot één gerichte Docker-job en de pakketartifact voor die run wordt voorbereid, gedownload of hergebruikt; als een geselecteerde lane een live-Docker-lane is, bouwt de gerichte job de live-testimage lokaal voor die rerun. Gegenereerde GitHub-rerun-commando's per lane bevatten `package_artifact_run_id`, `package_artifact_name` en inputs voor voorbereide images wanneer die waarden bestaan, zodat een mislukte lane het exacte pakket en de exacte images uit de mislukte run kan hergebruiken.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

De geplande live-/E2E-workflow draait dagelijks de volledige releasepath-Docker-suite.

## Plugin-prerelease

`Plugin Prerelease` is duurdere product-/pakketdekking, dus het is een afzonderlijke workflow die wordt gedispatcht door `Full Release Validation` of door een expliciete operator. Normale pull requests, `main`-pushes en zelfstandige handmatige CI-dispatches houden die suite uitgeschakeld. De workflow verdeelt tests voor gebundelde plugins over acht extension-workers; die extension-shardjobs draaien maximaal twee pluginconfiguratiegroepen tegelijk met één Vitest-worker per groep en een grotere Node-heap, zodat importzware pluginbatches geen extra CI-jobs maken. Het release-only Docker-prereleasepad batcht gerichte Docker-lanes in kleine groepen om te voorkomen dat tientallen runners worden gereserveerd voor jobs van één tot drie minuten.

## QA Lab

QA Lab heeft toegewijde CI-lanes buiten de belangrijkste slim-gescopete workflow. Agentic parity is genest onder de brede QA- en releaseharnassen, niet onder een zelfstandige PR-workflow. Gebruik `Full Release Validation` met `rerun_group=qa-parity` wanneer parity moet meelopen met een brede validatierun.

- De `QA-Lab - All Lanes`-workflow draait nachtelijk op `main` en bij handmatige dispatch; hij waaiert de mock-parity-lane, live-Matrix-lane en live-Telegram- en Discord-lanes uit als parallelle jobs. Live-jobs gebruiken de `qa-live-shared`-environment, en Telegram/Discord gebruiken Convex-leases.

Releasechecks draaien Matrix- en Telegram-live-transportlanes met de deterministische mock-provider en mock-gekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het kanaalcontract geïsoleerd is van live-modellatentie en normale startup van provider-plugins. De live-transport-Gateway schakelt memory search uit, omdat QA-parity memory-gedrag afzonderlijk dekt; providerconnectiviteit wordt gedekt door de afzonderlijke suites voor live model, native provider en Docker-provider.

Matrix gebruikt `--profile fast` voor geplande en releasegates, en voegt `--fail-fast` alleen toe wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaard en handmatige workflowinput blijven `all`; handmatige `matrix_profile=all`-dispatch shardt volledige Matrix-dekking altijd in `transport`-, `media`-, `e2ee-smoke`-, `e2ee-deep`- en `e2ee-cli`-jobs.

`OpenClaw Release Checks` draait ook de releasekritieke QA Lab-lanes vóór releasegoedkeuring; de QA-parity-gate draait de kandidaat- en baselinepacks als parallelle lanejobs, en downloadt daarna beide artifacts naar een kleine rapportjob voor de uiteindelijke parityvergelijking.

Volg voor normale PR's gescopete CI-/checkbewijzen in plaats van parity als verplichte status te behandelen.

## CodeQL

De `CodeQL`-workflow is bewust een smalle beveiligingsscanner voor een eerste controle, niet de volledige repository-sweep. Dagelijkse, handmatige en niet-concept pull request guard-runs scannen Actions-workflowcode plus de JavaScript/TypeScript-oppervlakken met het hoogste risico met beveiligingsquery's met hoge betrouwbaarheid, gefilterd op hoge/kritieke `security-severity`.

De pull request guard blijft licht: hij start alleen voor wijzigingen onder `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` of `src`, en voert dezelfde beveiligingsmatrix met hoge betrouwbaarheid uit als de geplande workflow. Android- en macOS-CodeQL blijven buiten de PR-standaarden.

### Beveiligingscategorieën

| Categorie                                         | Oppervlak                                                                                                                               |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authenticatie, geheimen, sandbox, Cron en Gateway-baseline                                                                              |
| `/codeql-security-high/channel-runtime-boundary`  | Implementatiecontracten voor kernkanalen plus de runtime van kanaal-Plugins, Gateway, Plugin SDK, geheimen en audit-aanraakpunten       |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP-parsing, netwerkguard, web-fetch en SSRF-beleidsoppervlakken van de Plugin SDK                                            |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-servers, helpers voor procesuitvoering, uitgaande levering en gates voor tooluitvoering door agents                                |
| `/codeql-security-high/plugin-trust-boundary`     | Vertrouwensoppervlakken voor Plugin-installatie, loader, manifest, registry, package-manager-installatie, source-loading en Plugin SDK-packagecontract |

### Platformspecifieke beveiligingsshards

- `CodeQL Android Critical Security` — geplande Android-beveiligingsshard. Bouwt de Android-app handmatig voor CodeQL op de kleinste Blacksmith Linux-runner die door workflow sanity wordt geaccepteerd. Uploadt onder `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — wekelijkse/handmatige macOS-beveiligingsshard. Bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert buildresultaten van afhankelijkheden uit de geüploade SARIF en uploadt onder `/codeql-critical-security/macos`. Buiten de dagelijkse standaarden gehouden omdat de macOS-build de runtime domineert, zelfs wanneer deze schoon is.

### Critical Quality-categorieën

`CodeQL Critical Quality` is de bijbehorende niet-beveiligingsshard. Deze voert alleen JavaScript/TypeScript-kwaliteitsquery's met fout-ernst en zonder beveiligingsfocus uit over smalle, waardevolle oppervlakken op de kleinere Blacksmith Linux-runner. De pull request guard is bewust kleiner dan het geplande profiel: niet-concept-PR's voeren alleen de bijbehorende shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` en `plugin-sdk-reply-runtime` uit voor wijzigingen in agent-opdracht/model/tool-uitvoering en reply-dispatchcode, config-schema/migratie/IO-code, auth/geheimen/sandbox/beveiligingscode, kernkanaal en gebundelde kanaal-Plugin-runtime, Gateway-protocol/server-method, memory-runtime/SDK-glue, MCP/proces/uitgaande levering, provider-runtime/modelcatalogus, sessiediagnostiek/leveringsqueues, Plugin-loader, Plugin SDK/packagecontract of Plugin SDK-reply-runtime. Wijzigingen in CodeQL-configuratie en kwaliteitsworkflow voeren alle twaalf PR-kwaliteitsshards uit.

Handmatige dispatch accepteert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

De smalle profielen zijn hooks voor training/iteratie om één kwaliteitsshard geïsoleerd uit te voeren.

| Categorie                                               | Oppervlak                                                                                                                                                      |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Authenticatie, geheimen, sandbox, Cron en code voor de Gateway-beveiligingsgrens                                                                               |
| `/codeql-critical-quality/config-boundary`              | Config-schema, migratie, normalisatie en IO-contracten                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-protocolschema's en contracten voor servermethoden                                                                                                     |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementatiecontracten voor kernkanaal en gebundelde kanaal-Plugin                                                                                            |
| `/codeql-critical-quality/agent-runtime-boundary`       | Opdrachtuitvoering, model/provider-dispatch, auto-reply-dispatch en queues, en runtimecontracten voor het ACP-control plane                                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-servers en toolbridges, helpers voor procestoezicht en contracten voor uitgaande levering                                                                   |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory-runtimefacades, memory-Plugin SDK-aliassen, glue voor memory-runtimeactivatie en memory doctor-opdrachten                              |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interne reply-queue, sessieleveringsqueues, helpers voor uitgaande sessiebinding/levering, oppervlakken voor diagnostische events/logbundels en CLI-contracten voor session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Inkomende reply-dispatch van Plugin SDK, reply-payload/chunking/runtime-helpers, kanaal-replyopties, leveringsqueues en helpers voor sessie/thread-binding      |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisatie van modelcatalogus, provider-authenticatie en -discovery, provider-runtime-registratie, provider-standaarden/catalogi en web/search/fetch/embedding-registries |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap van Control UI, lokale persistentie, Gateway-control flows en runtimecontracten voor task control plane                                               |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search, media-IO, media understanding, image-generation en runtimecontracten voor media-generation                                               |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, registry-, public-surface- en Plugin SDK-entrypointcontracten                                                                                          |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Gepubliceerde package-side Plugin SDK-bron en helpers voor Plugin-packagecontracten                                                                             |

Kwaliteit blijft gescheiden van beveiliging zodat kwaliteitsbevindingen kunnen worden gepland, gemeten, uitgeschakeld of uitgebreid zonder het beveiligingssignaal te vertroebelen. Uitbreiding van CodeQL voor Swift, Python en gebundelde Plugins moet alleen als gescopeerde of gesharde follow-up worden teruggezet nadat de smalle profielen stabiele runtime en signalen hebben.

## Onderhoudsworkflows

### Docs Agent

De `Docs Agent`-workflow is een event-gedreven Codex-onderhoudslane om bestaande docs afgestemd te houden op recent gelande wijzigingen. Hij heeft geen zuiver schema: een succesvolle niet-bot push-CI-run op `main` kan hem activeren, en handmatige dispatch kan hem direct uitvoeren. Workflow-run-aanroepen worden overgeslagen wanneer `main` inmiddels is verplaatst of wanneer in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is gemaakt. Wanneer hij draait, beoordeelt hij het commitbereik van de vorige niet-overgeslagen Docs Agent-bron-SHA tot de huidige `main`, zodat één uurlijkse run alle main-wijzigingen kan afdekken die sinds de laatste docs-pass zijn verzameld.

### Test Performance Agent

De `Test Performance Agent`-workflow is een event-gedreven Codex-onderhoudslane voor trage tests. Hij heeft geen zuiver schema: een succesvolle niet-bot push-CI-run op `main` kan hem activeren, maar hij slaat over als er die UTC-dag al een andere workflow-run-aanroep heeft gedraaid of draait. Handmatige dispatch omzeilt die dagelijkse activiteitsgate. De lane bouwt een full-suite gegroepeerd Vitest-prestatierapport, laat Codex alleen kleine dekking-behoudende testprestatieverbeteringen maken in plaats van brede refactors, voert daarna het full-suite-rapport opnieuw uit en wijst wijzigingen af die het aantal tests in de passerende baseline verlagen. Als de baseline falende tests heeft, mag Codex alleen duidelijke failures oplossen en moet het full-suite-rapport na de agent slagen voordat er iets wordt gecommit. Wanneer `main` verdergaat voordat de bot-push landt, rebased de lane de gevalideerde patch, voert `pnpm check:changed` opnieuw uit en probeert de push opnieuw; conflicterende verouderde patches worden overgeslagen. Hij gebruikt GitHub-hosted Ubuntu zodat de Codex-action dezelfde drop-sudo-veiligheidshouding kan behouden als de docs-agent.

### Dubbele PR's Na Merge

De `Duplicate PRs After Merge`-workflow is een handmatige maintainer-workflow voor het opruimen van duplicaten na landen. Hij staat standaard op dry-run en sluit alleen expliciet vermelde PR's wanneer `apply=true`. Voordat hij GitHub muteert, verifieert hij dat de gelande PR is gemerged en dat elk duplicaat ofwel een gedeeld gerefereerd issue heeft of overlappende gewijzigde hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale checkgates en gewijzigde routering

Lokale changed-lane-logica staat in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale checkgate is strenger over architectuurgrenzen dan de brede CI-platformscope:

- wijzigingen in core production voeren core prod- en core test-typecheck plus core lint/guards uit;
- wijzigingen alleen in core tests voeren alleen core test-typecheck plus core lint uit;
- wijzigingen in extension production voeren extension prod- en extension test-typecheck plus extension lint uit;
- wijzigingen alleen in extension tests voeren extension test-typecheck plus extension lint uit;
- wijzigingen in de publieke Plugin SDK of Plugin-contracten breiden uit naar extension-typecheck omdat extensies afhankelijk zijn van die core-contracten (Vitest extension-sweeps blijven expliciet testwerk);
- release-metadata-only versiebumps voeren gerichte versie/config/root-dependency-checks uit;
- onbekende root/config-wijzigingen falen veilig naar alle checklanes.

Lokale changed-test-routering staat in `scripts/test-projects.test-support.mjs` en is bewust goedkoper dan `check:changed`: directe testbewerkingen voeren zichzelf uit, bronbewerkingen geven de voorkeur aan expliciete mappings, daarna sibling-tests en import-graph-afhankelijken. Gedeelde group-room delivery-config is een van de expliciete mappings: wijzigingen in de group visible-reply-config, source reply delivery mode of de message-tool system prompt lopen via de core reply-tests plus Discord- en Slack-deliveryregressies, zodat een gedeelde standaardwijziging faalt vóór de eerste PR-push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging zo harness-breed is dat de goedkope gemapte set geen betrouwbare proxy is.

## Testbox-validatie

Voer Testbox uit vanuit de repo-root en gebruik bij voorkeur een pas opgewarmde box voor brede verificatie. Voordat je een trage gate uitvoert op een box die is hergebruikt, verlopen is of net een onverwacht grote sync meldde, voer je eerst `pnpm testbox:sanity` uit binnen de box.

De sanity-check faalt snel wanneer vereiste rootbestanden zoals `pnpm-lock.yaml` zijn verdwenen of wanneer `git status --short` ten minste 200 gevolgde verwijderingen toont. Dat betekent meestal dat de externe syncstatus geen betrouwbare kopie van de PR is; stop die box en warm een nieuwe op in plaats van de producttestfout te debuggen. Stel voor PR’s met opzettelijke grootschalige verwijderingen `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor die sanity-run.

`pnpm testbox:run` beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de syncfase blijft zonder uitvoer na de sync. Stel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` in om die beveiliging uit te schakelen, of gebruik een grotere millisecondewaarde voor ongebruikelijk grote lokale diffs.

Crabbox is het repo-eigen tweede pad voor externe boxen voor Linux-verificatie wanneer Blacksmith niet beschikbaar is of wanneer eigen cloudcapaciteit de voorkeur heeft. Warm een box op, hydrateer deze via de projectworkflow en voer daarna opdrachten uit via de Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` beheert de standaardwaarden voor provider, sync en GitHub Actions-hydratatie. Het sluit de lokale `.git` uit, zodat de gehydrateerde Actions-checkout zijn eigen externe Git-metadata behoudt in plaats van maintainer-lokale remotes en objectstores te synchroniseren, en het sluit lokale runtime-/buildartefacten uit die nooit mogen worden overgedragen. `.github/workflows/crabbox-hydrate.yml` beheert checkout, Node/pnpm-configuratie, ophalen van `origin/main` en de niet-geheime omgevingsoverdracht die latere `crabbox run --id <cbx_id>`-opdrachten gebruiken.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Ontwikkelingskanalen](/nl/install/development-channels)
