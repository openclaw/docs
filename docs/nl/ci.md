---
read_when:
    - U moet begrijpen waarom een CI-taak wel of niet is uitgevoerd
    - Je debugt een falende GitHub Actions-controle
    - Je coördineert een releasevalidatierun of een herhaalde run
    - Je wijzigt de ClawSweeper-aansturing of het doorsturen van GitHub-activiteit
summary: CI-taakgrafiek, scopecontroles, releasekoepels en lokale opdrachtequivalenten
title: CI-pijplijn
x-i18n:
    generated_at: "2026-05-07T01:50:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 284b83d7baf451a3e6bb557832f53513d7191f0b6d7c34fc4f7483a0851676cd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI draait bij elke push naar `main` en elke pull request. De `preflight`-job classificeert de diff en schakelt dure lanes uit wanneer alleen niet-gerelateerde gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen smart scoping bewust en waaieren de volledige graaf uit voor release candidates en brede validatie. Android-lanes blijven opt-in via `include_android`. Release-only Plugin-dekking staat in de afzonderlijke workflow [`Plugin-prerelease`](#plugin-prerelease) en draait alleen vanuit [`Volledige releasevalidatie`](#full-release-validation) of een expliciete handmatige dispatch.

## Pipelineoverzicht

| Job                              | Doel                                                                                                      | Wanneer deze draait                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detecteert docs-only wijzigingen, gewijzigde scopes, gewijzigde extensions en bouwt het CI-manifest       | Altijd bij niet-draft pushes en PR's |
| `security-scm-fast`              | Detectie van privésleutels en workflow-audit via `zizmor`                                                 | Altijd bij niet-draft pushes en PR's |
| `security-dependency-audit`      | Productie-lockfileaudit zonder dependencies tegen npm-advisories                                          | Altijd bij niet-draft pushes en PR's |
| `security-fast`                  | Vereiste aggregate voor de snelle beveiligingsjobs                                                        | Altijd bij niet-draft pushes en PR's |
| `check-dependencies`             | Productie-Knip dependency-only pass plus de allowlist-guard voor ongebruikte bestanden                    | Node-relevante wijzigingen         |
| `build-artifacts`                | Bouwt `dist/`, Control UI, checks voor gebouwde artifacts en herbruikbare downstream artifacts            | Node-relevante wijzigingen         |
| `checks-fast-core`               | Snelle Linux-correctheidslanes zoals bundled/plugin-contract/protocol-checks                              | Node-relevante wijzigingen         |
| `checks-fast-contracts-channels` | Sharded kanaalcontractchecks met een stabiel aggregate check-resultaat                                    | Node-relevante wijzigingen         |
| `checks-node-core-test`          | Core Node-testshards, exclusief kanaal-, bundled-, contract- en extension-lanes                           | Node-relevante wijzigingen         |
| `check`                          | Sharded equivalent van de lokale hoofdgate: productietypes, lint, guards, testtypes en strikte smoke      | Node-relevante wijzigingen         |
| `check-additional`               | Architectuur, sharded boundary/prompt-drift, extension-guards, package-boundary en gateway-watch          | Node-relevante wijzigingen         |
| `build-smoke`                    | Built-CLI smoke tests en smoke voor opstartgeheugen                                                       | Node-relevante wijzigingen         |
| `checks`                         | Verifier voor built-artifact kanaaltests                                                                  | Node-relevante wijzigingen         |
| `checks-node-compat-node22`      | Node 22-compatibiliteitsbuild en smoke-lane                                                               | Handmatige CI-dispatch voor releases |
| `check-docs`                     | Docs-formatting, lint en broken-link-checks                                                               | Docs gewijzigd                     |
| `skills-python`                  | Ruff + pytest voor Python-ondersteunde Skills                                                             | Python-skill-relevante wijzigingen |
| `checks-windows`                 | Windows-specifieke proces-/padtests plus gedeelde regressies voor runtime-importspecificaties             | Windows-relevante wijzigingen      |
| `macos-node`                     | macOS TypeScript-testlane met de gedeelde gebouwde artifacts                                              | macOS-relevante wijzigingen        |
| `macos-swift`                    | Swift-lint, build en tests voor de macOS-app                                                              | macOS-relevante wijzigingen        |
| `android`                        | Android-unittests voor beide smaken plus één debug-APK-build                                              | Android-relevante wijzigingen      |
| `test-performance-agent`         | Dagelijkse Codex-optimalisatie van trage tests na vertrouwde activiteit                                   | Main CI-succes of handmatige dispatch |
| `openclaw-performance`           | Dagelijkse/op aanvraag Kova-runtimeprestatierapporten met mock-provider, deep-profile en GPT 5.4 live-lanes | Geplande en handmatige dispatch    |

## Fail-fast-volgorde

1. `preflight` beslist welke lanes überhaupt bestaan. De `docs-scope`- en `changed-scope`-logica zijn stappen binnen deze job, geen zelfstandige jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` en `skills-python` falen snel zonder te wachten op de zwaardere artifact- en platformmatrixjobs.
3. `build-artifacts` overlapt met de snelle Linux-lanes zodat downstream consumenten kunnen starten zodra de gedeelde build klaar is.
4. Zwaardere platform- en runtimelanes waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` en `android`.

GitHub kan vervangen jobs als `cancelled` markeren wanneer een nieuwere push op dezelfde PR- of `main`-ref binnenkomt. Behandel dat als CI-ruis tenzij de nieuwste run voor dezelfde ref ook faalt. Aggregate shard-checks gebruiken `!cancelled() && always()` zodat ze normale shard-fouten nog steeds rapporteren, maar niet in de wachtrij komen nadat de hele workflow al is vervangen. De automatische CI-concurrency key is geversioneerd (`CI-v7-*`) zodat een zombie aan GitHub-zijde in een oude queue group nieuwere main-runs niet onbeperkt kan blokkeren. Handmatige full-suite-runs gebruiken `CI-manual-v1-*` en annuleren lopende runs niet.

De `ci-timings-summary`-job uploadt een compact `ci-timings-summary`-artifact voor elke niet-draft CI-run. Deze registreert wandtijd, wachtrijtijd, traagste jobs en gefaalde jobs voor de huidige run, zodat CI-gezondheidschecks niet herhaaldelijk de volledige Actions-payload hoeven te scrapen.

## Scope en routering

Scopelogica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unittests in `src/scripts/ci-changed-scope.test.ts`. Handmatige dispatch slaat changed-scope-detectie over en laat het preflight-manifest doen alsof elk scoped gebied is gewijzigd.

- **CI-workflowbewerkingen** valideren de Node CI-graaf plus workflow-linting, maar forceren op zichzelf geen native Windows-, Android- of macOS-builds; die platformlanes blijven gescoped op wijzigingen in platformbroncode.
- **Alleen-routering CI-bewerkingen, geselecteerde goedkope core-testfixturebewerkingen en smalle plugin-contract helper-/test-routeringbewerkingen** gebruiken een snel Node-only manifestpad: `preflight`, security en één `checks-fast-core`-taak. Dat pad slaat build artifacts, Node 22-compatibiliteit, kanaalcontracten, volledige core-shards, bundled-plugin-shards en aanvullende guard-matrices over wanneer de wijziging beperkt is tot de routerings- of helperoppervlakken die de snelle taak direct oefent.
- **Windows Node-checks** zijn gescoped op Windows-specifieke proces-/padwrappers, npm/pnpm/UI-runnerhelpers, package manager-configuratie en de CI-workflowoppervlakken die die lane uitvoeren; niet-gerelateerde bron-, plugin-, install-smoke- en test-only wijzigingen blijven op de Linux Node-lanes.

De traagste Node-testfamilies zijn opgesplitst of gebalanceerd zodat elke job klein blijft zonder runners te overreserveren: kanaalcontracten draaien als drie gewogen shards, core unit fast/support-lanes draaien afzonderlijk, core runtime-infrastructuur is opgesplitst tussen state-, process/config-, cron- en shared-shards, auto-reply draait als gebalanceerde workers (waarbij de reply-subtree is opgesplitst in agent-runner-, dispatch- en commands/state-routing-shards), en agentic gateway/server-configs zijn opgesplitst over chat/auth/model/http-plugin/runtime/startup-lanes in plaats van te wachten op gebouwde artifacts. Brede browser-, QA-, media- en overige plugintests gebruiken hun eigen Vitest-configs in plaats van de gedeelde plugin catch-all. Include-pattern-shards registreren timingvermeldingen met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een volledige config kan onderscheiden van een gefilterde shard. `check-additional` houdt package-boundary compile/canary-werk bij elkaar en scheidt runtime-topologiearchitectuur van gateway-watch-dekking; de boundary-guardlijst is verdeeld over vier matrixshards, waarbij elke shard geselecteerde onafhankelijke guards gelijktijdig draait en timings per check afdrukt. De dure Codex happy-path prompt snapshot drift-check draait alleen voor handmatige CI en voor prompt-beïnvloedende wijzigingen, zodat normale niet-gerelateerde Node-wijzigingen niet wachten achter koude prompt snapshot-generatie terwijl prompt drift nog steeds is vastgepind aan de PR die deze veroorzaakte; dezelfde flag slaat prompt snapshot Vitest-generatie over binnen de built-artifact core support-boundary-shard. Gateway-watch, kanaaltests en de core support-boundary-shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd.

Android CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play debug-APK. De third-party flavor heeft geen afzonderlijke source set of manifest; de unittests-lane compileert de flavor nog steeds met de SMS/call-log BuildConfig-flags, terwijl een dubbele debug-APK-packagingjob bij elke Android-relevante push wordt vermeden.

De `check-dependencies`-shard draait `pnpm deadcode:dependencies` (een productie-Knip dependency-only pass die is vastgepind op de nieuwste Knip-versie, met pnpm's minimum release age uitgeschakeld voor de `dlx`-installatie) en `pnpm deadcode:unused-files`, dat Knips productiebevindingen voor ongebruikte bestanden vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. De guard voor ongebruikte bestanden faalt wanneer een PR een nieuw, niet-beoordeeld ongebruikt bestand toevoegt of een verouderde allowlist-vermelding laat staan, terwijl opzettelijke dynamische plugin-, gegenereerde, build-, live-test- en package-bridge-oppervlakken behouden blijven die Knip niet statisch kan oplossen.

## Doorsturen van ClawSweeper-activiteit

`.github/workflows/clawsweeper-dispatch.yml` is de target-side bridge van OpenClaw-repositoryactiviteit naar ClawSweeper. Deze checkt geen onvertrouwde pull request-code uit en voert die niet uit. De workflow maakt een GitHub App-token aan vanuit `CLAWSWEEPER_APP_PRIVATE_KEY` en dispatcht daarna compacte `repository_dispatch`-payloads naar `openclaw/clawsweeper`.

De workflow heeft vier lanes:

- `clawsweeper_item` voor exacte reviewverzoeken voor issues en pull requests;
- `clawsweeper_comment` voor expliciete ClawSweeper-commando's in issuecomments;
- `clawsweeper_commit_review` voor reviewverzoeken op commitniveau bij `main`-pushes;
- `github_activity` voor algemene GitHub-activiteit die de ClawSweeper-agent kan inspecteren.

De `github_activity`-lane stuurt alleen genormaliseerde metadata door: eventtype, actie, actor, repository, itemnummer, URL, titel, status en korte fragmenten voor comments of reviews wanneer aanwezig. Deze vermijdt bewust het doorsturen van de volledige webhook-body. De ontvangende workflow in `openclaw/clawsweeper` is `.github/workflows/github-activity.yml`, die het genormaliseerde event post naar de OpenClaw Gateway-hook voor de ClawSweeper-agent.

Algemene activiteit is observatie, geen standaardlevering. De ClawSweeper-agent ontvangt het Discord-doel in zijn prompt en moet alleen naar `#clawsweeper` posten wanneer het event verrassend, actiegericht, risicovol of operationeel nuttig is. Routinematige opens, bewerkingen, botruis, dubbele webhook-ruis en normaal reviewverkeer moeten resulteren in `NO_REPLY`.

Behandel GitHub-titels, reacties, bodies, reviewtekst, branchnamen en commitberichten in dit hele pad als onvertrouwde gegevens. Ze zijn invoer voor samenvatting en triage, geen instructies voor de workflow of agentruntime.

## Handmatige dispatches

Handmatige CI-dispatches voeren dezelfde jobgrafiek uit als normale CI, maar forceren elke niet-Android scoped lane aan: Linux Node-shards, gebundelde-Plugin-shards, kanaalcontracten, Node 22-compatibiliteit, `check`, `check-additional`, build-smoke, docs-controles, Python Skills, Windows, macOS en Control UI i18n. Zelfstandige handmatige CI-dispatches voeren Android alleen uit met `include_android=true`; de volledige releaseparaplu schakelt Android in door `include_android=true` door te geven. Statische controles voor Plugin-prerelease, de release-only `agentic-plugins`-shard, de volledige extensie-batchsweep en Plugin-prerelease-Docker-lanes zijn uitgesloten van CI. De Docker-prerelease-suite wordt alleen uitgevoerd wanneer `Full Release Validation` de afzonderlijke `Plugin Prerelease`-workflow dispatcht met de release-validation-gate ingeschakeld.

Handmatige runs gebruiken een unieke concurrencygroep, zodat een volledige suite voor een release candidate niet wordt geannuleerd door een andere push- of PR-run op dezelfde ref. Met de optionele invoer `target_ref` kan een vertrouwde aanroeper die grafiek uitvoeren tegen een branch, tag of volledige commit-SHA, terwijl het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, snelle beveiligingsjobs en aggregaten (`security-scm-fast`, `security-dependency-audit`, `security-fast`), snelle protocol-/contract-/gebundelde controles, gesharde kanaalcontractcontroles, `check`-shards behalve lint, `check-additional`-aggregaten, Node-testaggregaatverificateurs, docs-controles, Python Skills, workflow-sanity, labeler, auto-response; install-smoke-preflight gebruikt ook door GitHub gehoste Ubuntu zodat de Blacksmith-matrix eerder in de wachtrij kan komen |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lichtere extensieshards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` en `check-test-types`                                                                                                                                                                                                                                                                                                                |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node-testshards, testshards voor gebundelde Plugins, `check-additional`-shards, `android`                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-gevoelig genoeg dat 8 vCPU meer kostte dan het opleverde); install-smoke-Docker-builds (32-vCPU-wachtrijtijd kostte meer dan het opleverde)                                                                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                    |

CI in de canonieke repo houdt Blacksmith als het standaard runnerpad. Tijdens `preflight` controleert `scripts/ci-runner-labels.mjs` recente in de wachtrij staande en lopende Actions-runs op Blacksmith-jobs in de wachtrij. Als een specifiek Blacksmith-label al jobs in de wachtrij heeft, vallen downstream jobs die exact dat label zouden gebruiken alleen voor die run terug op de overeenkomende door GitHub gehoste runner (`ubuntu-24.04`, `windows-2025` of `macos-latest`). Andere Blacksmith-groottes in dezelfde OS-familie blijven op hun primaire labels. Als de API-probe mislukt, wordt geen fallback toegepast.

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

Handmatige dispatch benchmarkt normaal gesproken de workflow-ref. Stel `target_ref` in om een release-tag of een andere branch te benchmarken met de huidige workflowimplementatie. Gepubliceerde rapportpaden en latest-pointers worden gesleuteld op de geteste ref, en elke `index.md` registreert de geteste ref/SHA, workflow-ref/SHA, Kova-ref, het profiel, de lane-authmodus, het model, het aantal herhalingen en scenariofilters.

De workflow installeert OCM vanaf een gepinde release en Kova vanuit `openclaw/Kova` op de gepinde `kova_ref`-invoer, en voert daarna drie lanes uit:

- `mock-provider`: Kova-diagnostische scenario's tegen een lokaal gebouwde runtime met deterministische neppe OpenAI-compatibele auth.
- `mock-deep-profile`: CPU-/heap-/traceprofilering voor hotspots bij opstarten, Gateway en agent-turns.
- `live-gpt54`: een echte OpenAI `openai/gpt-5.4`-agent-turn, overgeslagen wanneer `OPENAI_API_KEY` niet beschikbaar is.

De mock-provider-lane voert na de Kova-pass ook OpenClaw-native bronprobes uit: Gateway-opstarttiming en geheugen voor standaard-, hook- en 50-Plugin-opstartcases; herhaalde mock-OpenAI `channel-chat-baseline` hello-loops; en CLI-opstartcommando's tegen de opgestarte Gateway. De Markdown-samenvatting van de bronprobe staat in `source/index.md` in de rapportbundel, met ruwe JSON ernaast.

Elke lane uploadt GitHub-artifacts. Wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd, commit de workflow ook `report.json`, `report.md`, bundels, `index.md` en bronprobe-artifacts naar `openclaw/clawgrit-reports` onder `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. De huidige pointer voor de geteste ref wordt geschreven als `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Full Release Validation

`Full Release Validation` is de handmatige parapluworkflow voor "alles uitvoeren vóór release". Deze accepteert een branch, tag of volledige commit-SHA, dispatcht de handmatige `CI`-workflow met dat doel, dispatcht `Plugin Prerelease` voor release-only Plugin-/pakket-/statische-/Docker-bewijsvoering, en dispatcht `OpenClaw Release Checks` voor install-smoke, pakketacceptatie, cross-OS pakketcontroles, QA Lab-pariteit, Matrix- en Telegram-lanes. Stabiele/standaard runs houden uitputtende live/E2E- en Docker-releasepaddekking achter `run_release_soak=true`; `release_profile=full` forceert die soakdekking aan, zodat brede advisory-validatie breed blijft. Met `rerun_group=all` en `release_profile=full` voert deze ook `NPM Telegram Beta E2E` uit tegen het `release-package-under-test`-artifact uit releasecontroles. Geef na publicatie `npm_telegram_package_spec` door om dezelfde Telegram-pakketlane opnieuw uit te voeren tegen het gepubliceerde npm-pakket.

Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
stagematrix, exacte workflowjobnamen, profielverschillen, artifacts en
gerichte rerun-handles.

`OpenClaw Release Publish` is de handmatige muterende releaseworkflow. Dispatch deze
vanaf `release/YYYY.M.D` of `main` nadat de releasetag bestaat en nadat de
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

Gebruik voor bewijs van een vastgezette commit op een snel veranderende branch de helper in plaats van
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflowdispatch-refs moeten branches of tags zijn, geen ruwe commit-SHA's. De
helper pusht een tijdelijke `release-ci/<sha>-...`-branch op de doel-SHA,
dispatcht `Full Release Validation` vanaf die vastgezette ref, verifieert dat elke onderliggende
workflow `headSha` overeenkomt met het doel, en verwijdert de tijdelijke branch wanneer de
run is voltooid. De overkoepelende verifier faalt ook als een onderliggende workflow op een
andere SHA draaide.

`release_profile` bepaalt de breedte van live/provider-dekking die wordt doorgegeven aan releasecontroles. De
handmatige releaseworkflows gebruiken standaard `stable`; gebruik `full` alleen wanneer je
bewust de brede adviserende provider/media-matrix wilt. `run_release_soak`
bepaalt of stable/standaard releasecontroles de uitputtende live/E2E- en
Docker-releasepad-soak uitvoeren; `full` forceert soak aan.

- `minimum` behoudt de snelste OpenAI/core-releasekritieke lanes.
- `stable` voegt de stabiele provider/backend-set toe.
- `full` draait de brede adviserende provider/media-matrix.

De overkoepelende workflow registreert de gedispatchte onderliggende run-id's, en de laatste `Verify full validation`-job controleert de huidige conclusies van onderliggende runs opnieuw en voegt tabellen met traagste jobs toe voor elke onderliggende run. Als een onderliggende workflow opnieuw wordt uitgevoerd en groen wordt, voer dan alleen de bovenliggende verifier-job opnieuw uit om het overkoepelende resultaat en de tijdsamenvatting te vernieuwen.

Voor herstel accepteren zowel `Full Release Validation` als `OpenClaw Release Checks` `rerun_group`. Gebruik `all` voor een releasecandidate, `ci` voor alleen het normale volledige CI-kind, `plugin-prerelease` voor alleen het plugin-prerelease-kind, `release-checks` voor elk releasekind, of een nauwere groep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, of `npm-telegram` op de overkoepelende workflow. Dit houdt een rerun van een mislukte releasebox begrensd na een gerichte fix. Combineer voor één mislukte cross-OS-lane `rerun_group=cross-os` met `cross_os_suite_filter`, bijvoorbeeld `windows/packaged-upgrade`; lange cross-OS-commando's geven Heartbeat-regels uit en packaged-upgrade-samenvattingen bevatten timing per fase. QA-releasecheck-lanes zijn adviserend, dus QA-only-fouten waarschuwen maar blokkeren de releasecheck-verifier niet.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde ref één keer om te zetten in een `release-package-under-test`-tarball, en geeft dat artifact daarna door aan cross-OS-controles en Package Acceptance, plus de live/E2E-releasepad-Docker-workflow wanneer soak-dekking draait. Zo blijven de pakketbytes consistent tussen releaseboxen en wordt voorkomen dat dezelfde candidate in meerdere onderliggende jobs opnieuw wordt verpakt.

Dubbele `Full Release Validation`-runs voor `ref=main` en `rerun_group=all`
vervangen de oudere overkoepelende run. De bovenliggende monitor annuleert elke onderliggende workflow die hij
al heeft gedispatcht wanneer de bovenliggende run wordt geannuleerd, zodat nieuwere main-validatie
niet achter een verouderde releasecheckrun van twee uur blijft hangen. Validatie van releasebranches/tags
en gerichte rerungroepen houden `cancel-in-progress: false`.

## Live- en E2E-shards

Het release-live/E2E-kind behoudt brede native `pnpm test:live`-dekking, maar draait die als benoemde shards via `scripts/test-live-shard.mjs` in plaats van als één seriële job:

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

Dat behoudt dezelfde bestandsdekking terwijl trage live provider-fouten makkelijker opnieuw uit te voeren en te diagnosticeren zijn. De geaggregeerde shardnamen `native-live-extensions-o-z`, `native-live-extensions-media` en `native-live-extensions-media-music` blijven geldig voor handmatige eenmalige reruns.

De native live media-shards draaien in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de `Live Media Runner Image`-workflow. Die image installeert `ffmpeg` en `ffprobe` vooraf; mediajobs verifiëren alleen de binaries vóór setup. Houd Docker-ondersteunde livesuites op normale Blacksmith-runners — containerjobs zijn de verkeerde plek om geneste Docker-tests te starten.

Docker-ondersteunde live model/backend-shards gebruiken een afzonderlijke gedeelde `ghcr.io/openclaw/openclaw-live-test:<sha>`-image per geselecteerde commit. De live releaseworkflow bouwt en pusht die image één keer, waarna de Docker live model-, provider-gesharde Gateway-, CLI-backend-, ACP-bind- en Codex-harness-shards draaien met `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker-shards hebben expliciete timeoutlimieten op scriptniveau onder de workflowjob-timeout, zodat een vastgelopen container of cleanup-pad snel faalt in plaats van het hele releasecheckbudget te verbruiken. Als die shards het volledige source-Docker-target onafhankelijk opnieuw bouwen, is de releaserun verkeerd geconfigureerd en verspilt die wandkloktijd aan dubbele imagebuilds.

## Pakketacceptatie

Gebruik `Package Acceptance` wanneer de vraag is: "werkt dit installeerbare OpenClaw-pakket als product?" Dit verschilt van normale CI: normale CI valideert de source tree, terwijl pakketacceptatie één tarball valideert via dezelfde Docker E2E-harness die gebruikers na installatie of update gebruiken.

### Jobs

1. `resolve_package` checkt `workflow_ref` uit, bepaalt één pakketcandidate, schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het `package-under-test`-artifact, en print de bron, workflow-ref, pakket-ref, versie, SHA-256 en profiel in de GitHub-stapsamenvatting.
2. `docker_acceptance` roept `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt dat artifact, valideert de tarball-inventaris, bereidt package-digest-Docker-images voor wanneer nodig, en draait de geselecteerde Docker-lanes tegen dat pakket in plaats van de workflowcheckout te verpakken. Wanneer een profiel meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het pakket en de gedeelde images één keer voor, en waaiert die lanes daarna uit als parallelle gerichte Docker-jobs met unieke artifacts.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Dit draait wanneer `telegram_mode` niet `none` is en installeert hetzelfde `package-under-test`-artifact wanneer Package Acceptance er één heeft bepaald; standalone Telegram-dispatch kan nog steeds een gepubliceerde npm-spec installeren.
4. `summary` laat de workflow falen als pakketresolutie, Docker-acceptatie of de optionele Telegram-lane is mislukt.

### Candidate-bronnen

- `source=npm` accepteert alleen `openclaw@beta`, `openclaw@latest`, of een exacte OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor gepubliceerde prerelease/stable-acceptatie.
- `source=ref` verpakt een vertrouwde `package_ref`-branch, tag of volledige commit-SHA. De resolver fetcht OpenClaw-branches/tags, verifieert dat de geselecteerde commit bereikbaar is vanuit repository-branchgeschiedenis of een releasetag, installeert dependencies in een detached worktree, en verpakt die met `scripts/package-openclaw-for-docker.mjs`.
- `source=url` downloadt een HTTPS-`.tgz`; `package_sha256` is verplicht.
- `source=artifact` downloadt één `.tgz` uit `artifact_run_id` en `artifact_name`; `package_sha256` is optioneel maar moet worden opgegeven voor extern gedeelde artifacts.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde workflow-/harnesscode die de test draait. `package_ref` is de sourcecommit die wordt verpakt wanneer `source=ref`. Hierdoor kan de huidige testharness oudere vertrouwde sourcecommits valideren zonder oude workflowlogica te draaien.

### Suiteprofielen

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — volledige Docker-releasepadchunks met OpenWebUI
- `custom` — exacte `docker_lanes`; vereist wanneer `suite_profile=custom`

Het `package`-profiel gebruikt offline plugindekking zodat validatie van gepubliceerde pakketten niet afhankelijk is van live ClawHub-beschikbaarheid. De optionele Telegram-lane hergebruikt het `package-under-test`-artifact in `NPM Telegram Beta E2E`, waarbij het gepubliceerde npm-specpad behouden blijft voor standalone dispatches.

Zie [Updates en plugins testen](/nl/help/testing-updates-plugins) voor het specifieke beleid voor update- en plugintests, inclusief lokale commando's,
Docker-lanes, Package Acceptance-inputs, releasestandaarden en fouttriage.

Releasecontroles roepen Package Acceptance aan met `source=artifact`, het voorbereide releasepakketartifact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` en `telegram_mode=mock-openai`. Dit houdt pakketmigratie, update, cleanup van verouderde plugindependencies, reparatie van geconfigureerde Plugin-installaties, offline Plugin, Plugin-update en Telegram-bewijs op dezelfde opgeloste pakkettarball. Stel `package_acceptance_package_spec` in op Full Release Validation of OpenClaw Release Checks om diezelfde matrix tegen een gepubliceerd npm-pakket te draaien in plaats van het uit SHA gebouwde artifact. Cross-OS-releasecontroles blijven OS-specifieke onboarding, installer- en platformgedrag dekken; pakket-/updateproductvalidatie moet beginnen met Package Acceptance. De `published-upgrade-survivor` Docker-lane valideert één gepubliceerde pakketbaseline per run in het blokkerende releasepad. In Package Acceptance is de opgeloste `package-under-test`-tarball altijd de candidate en selecteert `published_upgrade_survivor_baseline` de fallback gepubliceerde baseline, standaard `openclaw@latest`; rerun-commando's voor mislukte lanes behouden die baseline. Full Release Validation met `run_release_soak=true` of `release_profile=full` stelt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` en `published_upgrade_survivor_scenarios=reported-issues` in om uit te breiden over de vier nieuwste stabiele npm-releases plus vastgezette plugincompatibiliteitsgrensreleases en issue-vormige fixtures voor Feishu-config, bewaarde bootstrap-/persona-bestanden, geconfigureerde OpenClaw Plugin-installaties, tilde-logpaden en verouderde legacy Plugin-dependencyroots. Multi-baseline published-upgrade-survivor-selecties worden per baseline geshard in afzonderlijke gerichte Docker-runnerjobs. De afzonderlijke `Update Migration`-workflow gebruikt de `update-migration` Docker-lane met `all-since-2026.4.23` en `plugin-deps-cleanup` wanneer de vraag uitputtende cleanup van gepubliceerde updates is, niet normale Full Release CI-breedte. Lokale geaggregeerde runs kunnen exacte pakketspecs doorgeven met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, een enkele lane behouden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` zoals `openclaw@2026.4.15`, of `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` instellen voor de scenariomatrix. De gepubliceerde lane configureert de baseline met een ingebakken `openclaw config set`-commandorecept, registreert receptstappen in `summary.json`, en proeft `/healthz`, `/readyz`, plus RPC-status na Gateway-start. De Windows packaged- en installer-fresh-lanes verifiëren ook dat een geïnstalleerd pakket een browser-control-override uit een ruw absoluut Windows-pad kan importeren. De OpenAI cross-OS agent-turn-smoke gebruikt standaard `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer ingesteld, anders `openai/gpt-5.4`, zodat het installatie- en Gateway-bewijs op een GPT-5-testmodel blijft en GPT-4.x-standaarden worden vermeden.

### Legacy-compatibiliteitsvensters

Package Acceptance heeft begrensde vensters voor legacy-compatibiliteit voor al gepubliceerde pakketten. Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen het compatibiliteitspad gebruiken:

- bekende private QA-vermeldingen in `dist/postinstall-inventory.json` mogen wijzen naar bestanden die uit de tarball zijn weggelaten;
- `doctor-switch` mag de persistentie-subcase `gateway install --wrapper` overslaan wanneer het pakket die vlag niet blootlegt;
- `update-channel-switch` mag ontbrekende `pnpm.patchedDependencies` snoeien uit de van de tarball afgeleide fake git-fixture en mag ontbrekende gepersisteerde `update.channel` loggen;
- Plugin-smokes mogen legacy-locaties voor install-records lezen of ontbrekende persistentie van marketplace-install-records accepteren;
- `plugin-update` mag migratie van configuratiemetadata toestaan terwijl nog steeds wordt vereist dat het install-record en het gedrag zonder herinstallatie ongewijzigd blijven.

Het gepubliceerde pakket `2026.4.26` mag ook waarschuwen voor lokale buildmetadata-stempelbestanden die al waren geleverd. Latere pakketten moeten aan de moderne contracten voldoen; dezelfde omstandigheden falen dan in plaats van te waarschuwen of over te slaan.

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

Wanneer je een mislukte Package Acceptance-run debugt, begin dan bij de samenvatting `resolve_package` om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de onderliggende run `docker_acceptance` en de Docker-artifacts ervan: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logs, fasetimings en rerun-commando's. Geef de voorkeur aan het opnieuw uitvoeren van het mislukte pakketprofiel of de exacte Docker-lanes in plaats van de volledige releasevalidatie opnieuw uit te voeren.

## Install-smoke

De afzonderlijke workflow `Install Smoke` hergebruikt hetzelfde scopescript via zijn eigen `preflight`-job. Deze splitst smoke-dekking in `run_fast_install_smoke` en `run_full_install_smoke`.

- **Snel pad** draait voor pull requests die Docker-/pakketoppervlakken raken, wijzigingen in gebundelde Plugin-pakketten/manifests, of core Plugin-/kanaal-/Gateway-/Plugin SDK-oppervlakken die door de Docker-smokejobs worden getest. Wijzigingen die alleen broncode van gebundelde Plugins raken, test-only bewerkingen en docs-only bewerkingen reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image eenmaal, controleert de CLI, draait de CLI-smoke voor agents delete shared-workspace, draait de container gateway-network e2e, verifieert een build-arg voor gebundelde extensies en draait het begrensde Docker-profiel voor gebundelde Plugins onder een totale commandotime-out van 240 seconden (waarbij de Docker-run van elk scenario afzonderlijk wordt begrensd).
- **Volledig pad** bewaart QR-pakketinstallatie en installer-Docker-/update-dekking voor nachtelijke geplande runs, handmatige dispatches, workflow-call-releasechecks en pull requests die echt installer-/pakket-/Docker-oppervlakken raken. In volledige modus bereidt install-smoke één target-SHA GHCR-root-Dockerfile-smoke-image voor of hergebruikt die, en draait daarna QR-pakketinstallatie, root-Dockerfile-/Gateway-smokes, installer-/update-smokes en de snelle Docker-E2E voor gebundelde Plugins als afzonderlijke jobs, zodat installerwerk niet hoeft te wachten op de root-image-smokes.

`main`-pushes (inclusief mergecommits) forceren het volledige pad niet; wanneer changed-scope-logica volledige dekking op een push zou aanvragen, behoudt de workflow de snelle Docker-smoke en laat de volledige install-smoke over aan de nachtelijke of releasevalidatie.

De trage Bun global install image-provider-smoke wordt afzonderlijk bewaakt door `run_bun_global_install_smoke`. Deze draait volgens het nachtelijke schema en vanuit de releasechecks-workflow, en handmatige `Install Smoke`-dispatches kunnen ervoor kiezen deze mee te nemen, maar pull requests en `main`-pushes doen dat niet. QR- en installer-Docker-tests behouden hun eigen installatiegerichte Dockerfiles.

## Lokale Docker E2E

`pnpm test:docker:all` bouwt vooraf één gedeelde live-testimage, verpakt OpenClaw eenmaal als npm-tarball en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images:

- een kale Node/Git-runner voor installer-/update-/plugin-dependency-lanes;
- een functionele image die dezelfde tarball in `/app` installeert voor normale functionaliteitslanes.

Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en draait vervolgens lanes met `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Instelbare opties

| Variabele                              | Standaard | Doel                                                                                          |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Aantal slots in de hoofdpool voor normale lanes.                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Aantal slots in de providergevoelige tail-pool.                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limiet voor gelijktijdige live-lanes zodat providers niet throttlen.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limiet voor gelijktijdige npm-install-lanes.                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limiet voor gelijktijdige multi-service-lanes.                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Spreiding tussen lane-starts om Docker-daemon-create-stormen te vermijden; stel `0` in voor geen spreiding. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Fallbacktime-out per lane (120 minuten); geselecteerde live-/tail-lanes gebruiken strakkere limieten. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | niet ingesteld | `1` print het schedulerplan zonder lanes te draaien.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | niet ingesteld | Kommagescheiden exacte lanelijst; slaat cleanup-smoke over zodat agents één mislukte lane kunnen reproduceren. |

Een lane die zwaarder is dan zijn effectieve limiet kan nog steeds starten vanuit een lege pool en draait daarna alleen totdat hij capaciteit vrijgeeft. De lokale aggregate preflight Docker, verwijdert verouderde OpenClaw E2E-containers, geeft actieve-lane-status uit, bewaart lanetimings voor longest-first-volgorde en stopt standaard met het plannen van nieuwe gepoolde lanes na de eerste fout.

### Herbruikbare live-/E2E-workflow

De herbruikbare live-/E2E-workflow vraagt aan `scripts/test-docker-all.mjs --plan-json` welke pakket-, imagekind-, live-image-, lane- en credentialdekking vereist is. `scripts/docker-e2e.mjs` zet dat plan vervolgens om naar GitHub-outputs en samenvattingen. Deze workflow verpakt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een pakketartifact uit de huidige run, of downloadt een pakketartifact uit `package_artifact_run_id`; valideert de tarball-inventory; bouwt en pusht package-digest-getagde bare/functional GHCR Docker E2E-images via Blacksmiths Docker-layercache wanneer het plan lanes met geïnstalleerde pakketten nodig heeft; en hergebruikt opgegeven inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` of bestaande package-digest-images in plaats van opnieuw te bouwen. Docker-image-pulls worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry-/cache-stream snel opnieuw probeert in plaats van het grootste deel van het kritieke CI-pad te verbruiken.

### Releasepad-chunks

Release-Docker-dekking draait kleinere gechunkte jobs met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elke chunk alleen het imagekind pullt dat hij nodig heeft en meerdere lanes via dezelfde gewogen scheduler uitvoert:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Huidige release-Docker-chunks zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` en `plugins-runtime-install-a` tot en met `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` en `plugins-integrations` blijven aggregate Plugin-/runtime-aliassen. De lane-alias `install-e2e` blijft de aggregate handmatige rerun-alias voor beide provider-installer-lanes.

OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige releasepad-dekking daarom vraagt, en behoudt alleen een zelfstandige `openwebui`-chunk voor OpenWebUI-only dispatches. Update-lanes voor gebundelde kanalen proberen één keer opnieuw bij tijdelijke npm-netwerkfouten.

Elke chunk uploadt `.artifacts/docker-tests/` met lane-logs, timings, `summary.json`, `failures.json`, fasetimings, schedulerplan-JSON, slow-lane-tabellen en rerun-commando's per lane. De workflowinput `docker_lanes` draait geselecteerde lanes tegen de voorbereide images in plaats van de chunkjobs, waardoor debugging van mislukte lanes begrensd blijft tot één gerichte Docker-job en het pakketartifact voor die run wordt voorbereid, gedownload of hergebruikt; als een geselecteerde lane een live-Docker-lane is, bouwt de gerichte job de live-testimage lokaal voor die rerun. Gegenereerde GitHub-rerun-commando's per lane bevatten `package_artifact_run_id`, `package_artifact_name` en voorbereide image-inputs wanneer die waarden bestaan, zodat een mislukte lane exact het pakket en de images uit de mislukte run kan hergebruiken.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

De geplande live-/E2E-workflow draait dagelijks de volledige releasepad-Docker-suite.

## Plugin Prerelease

`Plugin Prerelease` is duurdere product-/pakketdekking, dus het is een afzonderlijke workflow die wordt gedispatcht door `Full Release Validation` of door een expliciete operator. Normale pull requests, `main`-pushes en zelfstandige handmatige CI-dispatches houden die suite uitgeschakeld. Deze workflow balanceert tests voor gebundelde Plugins over acht extensieworkers; die extension-shardjobs draaien tot twee Plugin-configuratiegroepen tegelijk met één Vitest-worker per groep en een grotere Node-heap, zodat importzware Plugin-batches geen extra CI-jobs creëren. Het release-only Docker-prereleasepad batcht gerichte Docker-lanes in kleine groepen om te voorkomen dat tientallen runners worden gereserveerd voor jobs van één tot drie minuten.

## QA Lab

QA Lab heeft toegewijde CI-lanes buiten de hoofdworkflow met slimme scope. Agentic parity is genest onder de brede QA- en release-harnassen, niet als zelfstandige PR-workflow. Gebruik `Full Release Validation` met `rerun_group=qa-parity` wanneer parity moet meelopen met een brede validatierun.

- De workflow `QA-Lab - All Lanes` draait elke nacht op `main` en bij handmatige dispatch; deze waaiert de mock-parity-lane, live Matrix-lane en live Telegram- en Discord-lanes uit als parallelle jobs. Live-jobs gebruiken de omgeving `qa-live-shared`, en Telegram/Discord gebruiken Convex-leases.

Releasecontroles voeren Matrix- en Telegram-live-transportlanes uit met de deterministische mockprovider en mock-gekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het kanaalcontract is geïsoleerd van live-modellatentie en normale opstart van provider-Plugins. De live-transport-Gateway schakelt geheugenzoekopdrachten uit omdat QA-pariteit geheugengedrag afzonderlijk dekt; providerconnectiviteit wordt gedekt door de afzonderlijke suites voor live-modellen, native providers en Docker-providers.

Matrix gebruikt `--profile fast` voor geplande gates en releasegates, en voegt `--fail-fast` alleen toe wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaardwaarde en handmatige workflowinvoer blijven `all`; handmatige `matrix_profile=all`-dispatch verdeelt volledige Matrix-dekking altijd in `transport`-, `media`-, `e2ee-smoke`-, `e2ee-deep`- en `e2ee-cli`-jobs.

`OpenClaw Release Checks` voert ook de releasekritieke QA Lab-lanes uit vóór releasegoedkeuring; de QA-pariteitsgate voert de kandidaat- en baselinepakketten uit als parallelle lane-jobs en downloadt daarna beide artifacts naar een kleine rapportjob voor de uiteindelijke pariteitsvergelijking.

Volg voor normale PR's scoped CI-/controlebewijs in plaats van pariteit als vereiste status te behandelen.

## CodeQL

De `CodeQL`-workflow is bewust een smalle beveiligingsscanner voor een eerste pass, niet de volledige repository-sweep. Dagelijkse, handmatige en niet-concept pull-request-guard-runs scannen Actions-workflowcode plus de JavaScript/TypeScript-oppervlakken met het hoogste risico, met beveiligingsquery's met hoge betrouwbaarheid die zijn gefilterd op hoge/kritieke `security-severity`.

De pull-request-guard blijft licht: deze start alleen voor wijzigingen onder `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` of `src`, en voert dezelfde beveiligingsmatrix met hoge betrouwbaarheid uit als de geplande workflow. Android- en macOS-CodeQL blijven buiten de PR-standaarden.

### Beveiligingscategorieën

| Categorie                                         | Oppervlak                                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, geheimen, sandbox, cron en Gateway-baseline                                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | Kernkanaalimplementatiecontracten plus de runtime van kanaal-Plugins, Gateway, Plugin SDK, geheimen en audit-aanraakpunten          |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP-parsing, netwerkguard, web-fetch en SSRF-beleidsoppervlakken van de Plugin SDK                                        |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-servers, helpers voor procesuitvoering, outbound delivery en agent-gates voor tooluitvoering                                    |
| `/codeql-security-high/plugin-trust-boundary`     | Vertrouwensoppervlakken voor Plugin-installatie, loader, manifest, registry, package-manager-installatie, source-loading en Plugin SDK-pakketcontracten |

### Platformspecifieke beveiligingsshards

- `CodeQL Android Critical Security` — geplande Android-beveiligingsshard. Bouwt de Android-app handmatig voor CodeQL op de kleinste Blacksmith Linux-runner die door workflow-sanity wordt geaccepteerd. Uploadt onder `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — wekelijkse/handmatige macOS-beveiligingsshard. Bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert afhankelijkheidsbuildresultaten uit de geüploade SARIF en uploadt onder `/codeql-critical-security/macos`. Buiten dagelijkse standaarden gehouden omdat de macOS-build de runtime domineert, zelfs wanneer die schoon is.

### Critical Quality-categorieën

`CodeQL Critical Quality` is de bijbehorende niet-beveiligingsshard. Deze voert alleen kwaliteitsquery's met foutseverity en zonder beveiligingsfocus uit voor JavaScript/TypeScript over smalle, waardevolle oppervlakken op de kleinere Blacksmith Linux-runner. De pull-request-guard is bewust kleiner dan het geplande profiel: niet-concept-PR's voeren alleen de bijbehorende shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` en `plugin-sdk-reply-runtime` uit voor agentopdracht-/model-/tooluitvoering en antwoorddispatchcode, configuratieschema-/migratie-/IO-code, auth-/geheimen-/sandbox-/beveiligingscode, kernkanaal- en runtime van gebundelde kanaal-Plugins, Gateway-protocol/servermethode, geheugenruntime/SDK-glue, MCP/proces/outbound delivery, providerruntime/modelcatalogus, sessiediagnostiek/delivery queues, Plugin-loader, Plugin SDK/pakketcontract of wijzigingen in de antwoordruntime van de Plugin SDK. CodeQL-configuratie- en kwaliteitsworkflowwijzigingen voeren alle twaalf PR-kwaliteitsshards uit.

Handmatige dispatch accepteert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

De smalle profielen zijn onderwijs-/iteratiehooks om één kwaliteitsshard geïsoleerd uit te voeren.

| Categorie                                               | Oppervlak                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, geheimen, sandbox, cron en Gateway-beveiligingsgrenscode                                                                                                    |
| `/codeql-critical-quality/config-boundary`              | Configuratieschema, migratie, normalisatie en IO-contracten                                                                                                       |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-protocolschema's en servermethodecontracten                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementatiecontracten voor kernkanaal en gebundelde kanaal-Plugins                                                                                              |
| `/codeql-critical-quality/agent-runtime-boundary`       | Opdrachtuitvoering, model-/providerdispatch, auto-replydispatch en queues, en ACP-runtimecontracten voor het control plane                                        |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-servers en toolbridges, helpers voor procestoezicht en outbound-delivery-contracten                                                                            |
| `/codeql-critical-quality/memory-runtime-boundary`      | Geheugenhost-SDK, geheugenruntimefacades, geheugenaliassen voor Plugin SDK, glue voor activering van geheugenruntime en geheugen-doctoropdrachten                  |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interne reply queue, delivery queues voor sessies, helpers voor outbound sessiebinding/delivery, oppervlakken voor diagnostische events/logbundels en CLI-contracten voor sessie-doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Inbound antwoorddispatch van Plugin SDK, helpers voor antwoordpayload/chunking/runtime, kanaalantwoordopties, delivery queues en helpers voor sessie-/threadbinding |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisatie van modelcatalogus, provider-auth en discovery, providerruntime-registratie, providerstandaarden/-catalogi en web-/search-/fetch-/embedding-registries |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap van Control UI, lokale persistentie, Gateway-controlflows en TaskFlow-runtimecontracten voor het control plane                                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search, media-IO, mediabegrip, image-generation en runtimecontracten voor media-generation                                                         |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, registry-, public-surface- en entrypointcontracten van de Plugin SDK                                                                                      |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Gepubliceerde pakket-side Plugin SDK-broncode en helpers voor Plugin-pakketcontracten                                                                              |

Kwaliteit blijft gescheiden van beveiliging, zodat kwaliteitsbevindingen kunnen worden gepland, gemeten, uitgeschakeld of uitgebreid zonder het beveiligingssignaal te vertroebelen. Uitbreiding van CodeQL voor Swift, Python en gebundelde Plugins moet alleen als scoped of geshard follow-upwerk worden teruggezet nadat de smalle profielen een stabiele runtime en stabiel signaal hebben.

## Onderhoudsworkflows

### Docs Agent

De `Docs Agent`-workflow is een eventgedreven Codex-onderhoudslane om bestaande documentatie afgestemd te houden op recent gelande wijzigingen. Deze heeft geen puur schema: een geslaagde niet-bot push-CI-run op `main` kan deze triggeren, en handmatige dispatch kan deze direct uitvoeren. Workflow-run-invocations worden overgeslagen wanneer `main` verder is gegaan of wanneer in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is aangemaakt. Wanneer deze draait, beoordeelt hij het commitbereik vanaf de vorige niet-overgeslagen Docs Agent-bron-SHA tot het huidige `main`, zodat één uurlijkse run alle main-wijzigingen kan dekken die sinds de laatste documentatiepass zijn verzameld.

### Test Performance Agent

De `Test Performance Agent`-workflow is een eventgedreven Codex-onderhoudslane voor trage tests. Deze heeft geen puur schema: een geslaagde niet-bot push-CI-run op `main` kan deze triggeren, maar hij slaat over als een andere workflow-run-invocation die UTC-dag al heeft gedraaid of draait. Handmatige dispatch omzeilt die dagelijkse activiteitsgate. De lane bouwt een gegroepeerd Vitest-prestatierapport voor de volledige suite, laat Codex alleen kleine dekkingsbehoudende testprestatieverbeteringen maken in plaats van brede refactors, voert daarna het volledige-suite-rapport opnieuw uit en wijst wijzigingen af die het baselineaantal geslaagde tests verlagen. Als de baseline falende tests heeft, mag Codex alleen duidelijke fouten oplossen en moet het volledige-suite-rapport na de agent slagen voordat er iets wordt gecommit. Wanneer `main` verder gaat voordat de bot-push landt, rebaset de lane de gevalideerde patch, voert `pnpm check:changed` opnieuw uit en probeert de push opnieuw; conflicterende verouderde patches worden overgeslagen. Deze gebruikt GitHub-gehoste Ubuntu, zodat de Codex-action dezelfde drop-sudo-veiligheidshouding kan aanhouden als de docs-agent.

### Duplicate PRs After Merge

De workflow `Duplicate PRs After Merge` is een handmatige maintainer-workflow voor duplicate-opruiming na landing. De standaard is dry-run en deze sluit alleen expliciet vermelde PR's wanneer `apply=true`. Voordat GitHub wordt gemuteerd, verifieert deze dat de gelande PR is gemerged en dat elke duplicate een gedeeld gerefereerd issue of overlappende gewijzigde hunks heeft.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale controlegates en gewijzigde routing

Lokale changed-lane-logica leeft in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale controlegate is strenger over architectuurgrenzen dan de brede CI-platformscope:

- wijzigingen in core-productie draaien core-prod- en core-test-typechecks plus core-lint/guards;
- wijzigingen die alleen core-tests raken draaien alleen core-test-typecheck plus core-lint;
- wijzigingen in extensieproductie draaien extensie-prod- en extensie-test-typechecks plus extensie-lint;
- wijzigingen die alleen extensietests raken draaien extensie-test-typecheck plus extensie-lint;
- wijzigingen aan de openbare Plugin SDK of het plugincontract breiden uit naar extensie-typecheck omdat extensies afhankelijk zijn van die core-contracten (Vitest-extensie-sweeps blijven expliciet testwerk);
- versiebump-wijzigingen die alleen release-metadata raken draaien gerichte versie-/configuratie-/root-dependency-controles;
- onbekende root-/configuratiewijzigingen vallen veilig terug naar alle check-lanes.

Lokale routering van gewijzigde tests staat in `scripts/test-projects.test-support.mjs` en is bewust goedkoper dan `check:changed`: directe testbewerkingen draaien zichzelf, bronbewerkingen geven de voorkeur aan expliciete mappings, daarna zustertests en importgrafiek-afhankelijken. Gedeelde configuratie voor levering in groepsruimtes is een van de expliciete mappings: wijzigingen aan de configuratie voor zichtbare antwoorden in groepen, de leveringsmodus voor bronantwoorden of de systeemprompt van de berichttool lopen via de core-antwoordtests plus Discord- en Slack-leveringsregressies, zodat een gedeelde standaardwijziging faalt vóór de eerste PR-push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging breed genoeg is voor de harness dat de goedkope gemapte set geen betrouwbare proxy is.

## Testbox-validatie

Draai Testbox vanuit de repo-root en geef voor breed bewijs de voorkeur aan een vers opgewarmde box. Voordat je een trage gate uitgeeft aan een box die is hergebruikt, verlopen is of net een onverwacht grote sync meldde, draai je eerst `pnpm testbox:sanity` binnen de box.

De sanity-check faalt snel wanneer vereiste rootbestanden zoals `pnpm-lock.yaml` zijn verdwenen of wanneer `git status --short` minstens 200 getrackte verwijderingen toont. Dat betekent meestal dat de externe sync-status geen betrouwbare kopie van de PR is; stop die box en warm een nieuwe op in plaats van de producttestfout te debuggen. Stel voor opzettelijke PR's met grote verwijderingen `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor die sanity-run.

`pnpm testbox:run` beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de sync-fase blijft zonder output na de sync. Stel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` in om die guard uit te schakelen, of gebruik een grotere millisecondewaarde voor ongewoon grote lokale diffs.

Crabbox is de repo-eigen remote-box-wrapper voor Linux-bewijs door maintainers. Gebruik het wanneer een check te breed is voor een lokale bewerkingslus, wanneer CI-pariteit belangrijk is, of wanneer het bewijs secrets, Docker, package-lanes, herbruikbare boxes of externe logs nodig heeft. De normale OpenClaw-backend is `blacksmith-testbox`; eigen AWS-/Hetzner-capaciteit is een fallback voor Blacksmith-storingen, quotaproblemen of expliciete tests op eigen capaciteit.

Controleer vóór een eerste run de wrapper vanuit de repo-root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

De repo-wrapper weigert een verouderde Crabbox-binary die `blacksmith-testbox` niet adverteert. Geef de provider expliciet door, ook al heeft `.crabbox.yaml` standaardwaarden voor owned-cloud.

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

Lees de uiteindelijke JSON-samenvatting. De nuttige velden zijn `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` en `totalMs`. Eenmalige door Blacksmith ondersteunde Crabbox-runs zouden de Testbox automatisch moeten stoppen; als een run wordt onderbroken of opschoning onduidelijk is, inspecteer je live boxes en stop je alleen de boxes die je hebt gemaakt:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Gebruik hergebruik alleen wanneer je bewust meerdere commando's op dezelfde gehydrateerde box nodig hebt:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Als Crabbox de kapotte laag is maar Blacksmith zelf werkt, gebruik dan directe Blacksmith als smalle fallback:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Als `blacksmith testbox list --all` en `blacksmith testbox status` werken maar nieuwe
warmups na een paar minuten `queued` blijven zonder IP of Actions-run-URL,
behandel dit dan als Blacksmith-provider-, wachtrij-, facturerings- of org-limietdruk. Stop de
queued ids die je hebt gemaakt, start geen extra Testboxes en verplaats het bewijs naar het
pad voor eigen Crabbox-capaciteit hieronder terwijl iemand het Blacksmith-dashboard,
de facturering en de org-limieten controleert.

Escaleren naar eigen Crabbox-capaciteit doe je alleen wanneer Blacksmith down is, door quota is beperkt, de benodigde omgeving mist, of eigen capaciteit expliciet het doel is:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Vermijd onder AWS-druk `class=beast`, tenzij de taak echt 48xlarge-klasse CPU nodig heeft. Een `beast`-aanvraag begint bij 192 vCPU's en is de gemakkelijkste manier om regionale EC2 Spot- of On-Demand Standard-quota te raken. De repo-eigen `.crabbox.yaml` gebruikt standaard `standard`, meerdere capaciteitsregio's en `capacity.hints: true`, zodat bemiddelde AWS-leases de gekozen regio/markt, quotadruk, Spot-fallback en waarschuwingen voor high-pressure klassen printen. Gebruik `fast` voor zwaardere brede checks, `large` pas nadat standard/fast niet genoeg zijn, en `beast` alleen voor uitzonderlijke CPU-gebonden lanes zoals volledige suites of Docker-matrices voor alle plugins, expliciete release-/blocker-validatie of high-core prestatieprofiling. Gebruik `beast` niet voor `pnpm check:changed`, gerichte tests, docs-only werk, gewone lint/typecheck, kleine E2E-repro's of Blacksmith-storingstriëage. Gebruik `--market on-demand` voor capaciteitsdiagnose zodat Spot-marktschommelingen niet in het signaal worden gemengd.

`.crabbox.yaml` beheert provider-, sync- en GitHub Actions-hydratatiestandaarden voor owned-cloud-lanes. Het sluit lokale `.git` uit zodat de gehydrateerde Actions-checkout zijn eigen externe Git-metadata behoudt in plaats van maintainer-lokale remotes en object stores te synchroniseren, en het sluit lokale runtime-/buildartefacten uit die nooit mogen worden overgezet. `.github/workflows/crabbox-hydrate.yml` beheert checkout, Node-/pnpm-setup, `origin/main`-fetch en de niet-geheime omgevingshandoff voor owned-cloud-commando's met `crabbox run --id <cbx_id>`.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Ontwikkelkanalen](/nl/install/development-channels)
