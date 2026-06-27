---
read_when:
    - Je moet begrijpen waarom een CI-taak wel of niet is uitgevoerd
    - Je debugt een falende GitHub Actions-controle
    - Je coördineert een releasevalidatierun of herhaling daarvan
    - Je wijzigt ClawSweeper-dispatch of het doorsturen van GitHub-activiteit
summary: CI-taakgrafiek, scopepoorten, releaseparaplu’s en lokale opdrachtequivalenten
title: CI-pijplijn
x-i18n:
    generated_at: "2026-06-27T17:14:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 630a787d9855000d49902445982c4d9b458604c2556214afa3f7e90a87804c71
    source_path: ci.md
    workflow: 16
---

OpenClaw CI draait bij elke push naar `main` en elke pull-request. Canonieke
`main`-pushes gaan eerst door een toelatingsvenster van 90 seconden voor gehoste runners.
De bestaande `CI`-concurrencygroep annuleert die wachtende run wanneer een nieuwere
commit binnenkomt, zodat opeenvolgende merges niet elk een volledige Blacksmith-
matrix registreren. Pull-requests en handmatige dispatches slaan de wachttijd over. De `preflight`-job
classificeert daarna de diff en schakelt dure banen uit wanneer alleen niet-gerelateerde
gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen smart
scoping bewust en waaieren de volledige grafiek uit voor release candidates en brede
validatie. Android-banen blijven opt-in via `include_android`. Release-only
Plugin-dekking staat in de aparte [`Plugin Prerelease`](#plugin-prerelease)
workflow en draait alleen vanuit [`Full Release Validation`](#full-release-validation)
of een expliciete handmatige dispatch.

## Pipeline-overzicht

| Job                                | Doel                                                                                                      | Wanneer deze draait                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Detecteert wijzigingen alleen in docs, gewijzigde scopes, gewijzigde extensies, en bouwt het CI-manifest | Altijd bij niet-draft pushes en PR's                |
| `runner-admission`                 | Gehoste debounce van 90 seconden voor canonieke `main`-pushes voordat Blacksmith-werk wordt geregistreerd | Elke CI-run; slaapt alleen bij canonieke `main`-pushes |
| `security-fast`                    | Detectie van privésleutels, audit van gewijzigde workflows via `zizmor`, en audit van productie-lockfiles | Altijd bij niet-draft pushes en PR's                |
| `check-dependencies`               | Productie-Knip-pass alleen voor afhankelijkheden plus de allowlist-guard voor ongebruikte bestanden      | Node-relevante wijzigingen                          |
| `build-artifacts`                  | Bouwt `dist/`, Control UI, smokechecks voor gebouwde CLI, controles van ingebedde gebouwde artefacten, en herbruikbare artefacten | Node-relevante wijzigingen                               |
| `checks-fast-core`                 | Snelle Linux-correctheidsbanen zoals bundled, protocol, QA Smoke CI, en CI-routeringscontroles           | Node-relevante wijzigingen                          |
| `checks-fast-contracts-plugins-*`  | Twee gesharde Plugin-contractcontroles                                                                    | Node-relevante wijzigingen                          |
| `checks-fast-contracts-channels-*` | Twee gesharde kanaalcontractcontroles                                                                     | Node-relevante wijzigingen                          |
| `checks-node-core-*`               | Core Node-testshards, exclusief kanaal-, bundled-, contract- en extensiebanen                            | Node-relevante wijzigingen                          |
| `check-*`                          | Gesharde equivalent van de belangrijkste lokale gate: productietypen, lint, guards, testtypen, en strikte smoke | Node-relevante wijzigingen                               |
| `check-additional-*`               | Architectuur, gesharde boundary-/prompt-drift, extensieguards, pakketboundary, en runtime-topologie      | Node-relevante wijzigingen                          |
| `checks-node-compat-node22`        | Node 22-compatibiliteitsbuild en smoke-baan                                                               | Handmatige CI-dispatch voor releases                |
| `check-docs`                       | Docs-formatting, lint, en controles op kapotte links                                                      | Docs gewijzigd                                      |
| `skills-python`                    | Ruff + pytest voor Python-ondersteunde Skills                                                             | Python-Skills-relevante wijzigingen                 |
| `checks-windows`                   | Windows-specifieke proces-/padtests plus regressies voor gedeelde runtime-importspecifier                | Windows-relevante wijzigingen                       |
| `macos-node`                       | macOS TypeScript-testbaan met de gedeelde gebouwde artefacten                                             | macOS-relevante wijzigingen                         |
| `macos-swift`                      | Swift-lint, build, en tests voor de macOS-app                                                             | macOS-relevante wijzigingen                         |
| `ios-build`                        | Xcode-projectgeneratie plus de simulatorbuild voor de iOS-app                                             | iOS-app, gedeelde app-kit, of Swabble-wijzigingen   |
| `android`                          | Android-unittests voor beide smaken plus één debug-APK-build                                              | Android-relevante wijzigingen                       |
| `test-performance-agent`           | Dagelijkse Codex-optimalisatie voor trage tests na vertrouwde activiteit                                  | Succesvolle main-CI of handmatige dispatch          |
| `openclaw-performance`             | Dagelijkse/op aanvraag Kova-runtimeprestatie-rapporten met mock-provider, deep-profile, en GPT 5.5 live-banen | Geplande en handmatige dispatch                       |

## Fail-fast-volgorde

1. `runner-admission` wacht alleen op canonieke `main`-pushes; een nieuwere push annuleert de run vóór Blacksmith-registratie.
2. `preflight` bepaalt welke banen überhaupt bestaan. De `docs-scope`- en `changed-scope`-logica zijn stappen binnen deze job, geen zelfstandige jobs.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, en `skills-python` falen snel zonder te wachten op de zwaardere artefact- en platformmatrixjobs.
4. `build-artifacts` overlapt met de snelle Linux-banen zodat downstream-consumenten kunnen starten zodra de gedeelde build klaar is.
5. Zwaardere platform- en runtimebanen waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, en `android`.

GitHub kan vervangen jobs als `cancelled` markeren wanneer een nieuwere push op dezelfde PR- of `main`-ref binnenkomt. Behandel dat als CI-ruis tenzij de nieuwste run voor dezelfde ref ook faalt. Matrixjobs gebruiken `fail-fast: false`, en `build-artifacts` rapporteert fouten in embedded channel, core-support-boundary, en gateway-watch direct in plaats van kleine verifier-jobs in de wachtrij te zetten. De automatische CI-concurrencysleutel is geversioneerd (`CI-v7-*`), zodat een zombie aan GitHub-zijde in een oude wachtrijgroep nieuwere main-runs niet oneindig kan blokkeren. Handmatige full-suite-runs gebruiken `CI-manual-v1-*` en annuleren lopende runs niet.

Gebruik `pnpm ci:timings`, `pnpm ci:timings:recent`, of `node scripts/ci-run-timings.mjs <run-id>` om wandtijd, wachtrijtijd, traagste jobs, fouten, en de `pnpm-store-warmup`-fanoutbarrière uit GitHub Actions samen te vatten. CI uploadt dezelfde runsamenvatting ook als een `ci-timings-summary`-artefact. Controleer voor buildtiming de stap `Build dist` van de job `build-artifacts`: `pnpm build:ci-artifacts` print `[build-all] phase timings:` en bevat `ui:build`; de job uploadt ook het artefact `startup-memory`.

Voor pull-request-runs voert de terminale timing-summary-job de helper uit de vertrouwde baserevisie uit voordat `GH_TOKEN` aan `gh run view` wordt doorgegeven. Dat houdt de query met token buiten branch-gecontroleerde code terwijl de huidige CI-run van de pull-request toch wordt samengevat.

## PR-context en bewijs

Externe bijdrager-PR's draaien een PR-context- en bewijsgate vanuit
`.github/workflows/real-behavior-proof.yml`. De workflow checkt de vertrouwde
base-commit uit en evalueert alleen de PR-body; hij voert geen code uit van de
bijdragerbranch.

De gate geldt voor PR-auteurs die geen repository-eigenaren, leden,
collaborators of bots zijn. Hij slaagt wanneer de PR-body zelfgeschreven
secties `What Problem This Solves` en `Evidence` bevat. Bewijs kan een gerichte
test, CI-resultaat, screenshot, opname, terminaluitvoer, live-observatie,
geredigeerd log, of artefactlink zijn. De body geeft intentie en nuttige validatie;
reviewers inspecteren de code, tests, en CI om correctheid te beoordelen.

Wanneer de controle faalt, werk dan de PR-body bij in plaats van nog een codecommit te pushen.

## Scope en routering

Scope-logica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unittests in `src/scripts/ci-changed-scope.test.ts`. Handmatige dispatch slaat changed-scope-detectie over en laat het preflightmanifest doen alsof elk scoped gebied is gewijzigd.

- **CI-workflowbewerkingen** valideren de Node CI-grafiek plus workflowlinting, maar forceren op zichzelf geen Windows-, iOS-, Android-, of macOS-native builds; die platformbanen blijven scoped op wijzigingen in platformbronnen.
- **Workflow Sanity** draait `actionlint`, `zizmor` over alle workflow-YAML-bestanden, de composite-action interpolatieguard, en de conflict-marker-guard. De PR-scoped `security-fast`-job draait ook `zizmor` over gewijzigde workflowbestanden, zodat workflow-securitybevindingen vroeg falen in de hoofd-CI-grafiek.
- **Docs bij `main`-pushes** worden gecontroleerd door de zelfstandige `Docs`-workflow met dezelfde ClawHub-docs-mirror die CI gebruikt, zodat gemengde code+docs-pushes niet ook de CI-`check-docs`-shard in de wachtrij zetten. Pull-requests en handmatige CI draaien nog steeds `check-docs` vanuit CI wanneer docs zijn gewijzigd.
- **TUI PTY** draait in de Linux Node-shard `checks-node-core-runtime-tui-pty` voor TUI-wijzigingen. De shard draait `test/vitest/vitest.tui-pty.config.ts` met `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, zodat hij zowel de deterministische `TuiBackend`-fixturebaan als de tragere `tui --local`-smoke dekt die alleen het externe modelendpoint mockt.
- **Alleen-CI-routeringsbewerkingen, geselecteerde goedkope core-test-fixturebewerkingen, en smalle Plugin-contracthelper-/test-routeringsbewerkingen** gebruiken een snel Node-only manifestpad: `preflight`, security, en één `checks-fast-core`-taak. Dat pad slaat buildartefacten, Node 22-compatibiliteit, kanaalcontracten, volledige core-shards, bundled-Plugin-shards, en extra guard-matrices over wanneer de wijziging beperkt is tot de routerings- of helperoppervlakken die de snelle taak direct oefent.
- **Windows Node-controles** zijn scoped op Windows-specifieke proces-/padwrappers, npm/pnpm/UI-runnerhelpers, pakketmanagerconfiguratie, en de CI-workflowoppervlakken die die baan uitvoeren; niet-gerelateerde bron-, Plugin-, install-smoke-, en alleen-testwijzigingen blijven op de Linux Node-banen.

De traagste Node-testfamilies zijn gesplitst of gebalanceerd zodat elke job klein blijft zonder runners te overreserveren: Plugin-contracten en kanaalcontracten draaien elk als twee gewogen Blacksmith-ondersteunde shards met de standaard GitHub-runnerfallback, snelle/support-lanes voor core-unit draaien afzonderlijk, core runtime-infra is gesplitst tussen state, process/config, shared en drie cron-domeinshards, auto-reply draait als gebalanceerde workers (waarbij de reply-subtree is gesplitst in shards voor agent-runner, dispatch en commands/state-routing), en agentic gateway/server-configs zijn gesplitst over chat/auth/model/http-plugin/runtime/startup-lanes in plaats van te wachten op gebouwde artefacten. Normale CI pakt daarna alleen geisoleerde infra-include-pattern-shards in deterministische bundels van maximaal 64 testbestanden, waardoor de Node-matrix kleiner wordt zonder niet-geisoleerde command/cron-, stateful agents-core- of gateway/server-suites samen te voegen; zware vaste suites blijven op 8 vCPU, terwijl de gebundelde lanes en lanes met lager gewicht 4 vCPU gebruiken. Pull requests op de canonieke repository gebruiken een aanvullend compact toelatingsplan: dezelfde groepen per config draaien in geisoleerde subprocessen binnen het huidige Linux Node-plan van 34 jobs, zodat een enkele PR niet de volledige Node-matrix van meer dan 70 jobs registreert. `main`-pushes, handmatige dispatches en release-gates behouden de volledige matrix. Brede browser-, QA-, media- en diverse Plugin-tests gebruiken hun eigen Vitest-configs in plaats van de gedeelde Plugin-catch-all. Include-pattern-shards registreren timingvermeldingen met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een volledige config kan onderscheiden van een gefilterde shard. `check-additional-*` houdt compile/canary-werk voor package-grenzen bij elkaar en scheidt runtime-topologiearchitectuur van gateway-watch-dekking; de boundary-guard-lijst wordt gestreept in een prompt-zware shard en een gecombineerde shard voor de resterende guard-stripes, waarbij elke shard geselecteerde onafhankelijke guards gelijktijdig uitvoert en timings per check afdrukt. De dure Codex-happy-path-prompt-snapshot-driftcheck draait als eigen aanvullende job alleen voor handmatige CI en voor wijzigingen die prompts beinvloeden, zodat normale ongerelateerde Node-wijzigingen niet hoeven te wachten achter koude prompt-snapshotgeneratie en de boundary-shards gebalanceerd blijven terwijl promptdrift nog steeds wordt gekoppeld aan de PR die deze veroorzaakte; dezelfde flag slaat prompt-snapshot-Vitest-generatie over binnen de core support-boundary-shard voor gebouwde artefacten. Gateway-watch, kanaaltests en de core support-boundary-shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd.

Na toelating staat canonieke Linux-CI maximaal 24 gelijktijdige Node-testjobs toe en
12 voor de kleinere fast/check-lanes; Windows en Android blijven op twee omdat
die runner-pools smaller zijn.

Het compacte PR-plan emitteert 18 Node-jobs voor de huidige suite: whole-config-
groepen worden gebatcht in geisoleerde subprocessen met een batch-time-out van 120 minuten,
terwijl include-pattern-groepen hetzelfde begrensde jobbudget delen.

Android-CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play debug APK. De third-party-flavor heeft geen afzonderlijke source set of manifest; de unit-test-lane compileert de flavor nog steeds met de SMS/call-log-BuildConfig-flags, terwijl een dubbele debug-APK-packagingjob bij elke Android-relevante push wordt vermeden.

De `check-dependencies`-shard draait `pnpm deadcode:dependencies` (een production Knip-pass alleen voor dependencies, vastgezet op de nieuwste Knip-versie, met pnpm's minimum release age uitgeschakeld voor de `dlx`-installatie) en `pnpm deadcode:unused-files`, dat Knip's production-bevindingen voor ongebruikte bestanden vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. De unused-file-guard faalt wanneer een PR een nieuw, niet-beoordeeld ongebruikt bestand toevoegt of een verouderde allowlist-vermelding laat staan, terwijl bewuste dynamische Plugin-, gegenereerde, build-, live-test- en package-bridge-oppervlakken behouden blijven die Knip niet statisch kan oplossen.

## ClawSweeper-activiteit doorsturen

`.github/workflows/clawsweeper-dispatch.yml` is de doelzijde-bridge van OpenClaw-repositoryactiviteit naar ClawSweeper. Deze checkt geen niet-vertrouwde pull request-code uit en voert die ook niet uit. De workflow maakt een GitHub App-token vanuit `CLAWSWEEPER_APP_PRIVATE_KEY` en dispatcht daarna compacte `repository_dispatch`-payloads naar `openclaw/clawsweeper`.

De workflow heeft vier lanes:

- `clawsweeper_item` voor exacte reviewverzoeken voor issues en pull requests;
- `clawsweeper_comment` voor expliciete ClawSweeper-commando's in issue-comments;
- `clawsweeper_commit_review` voor reviewverzoeken op commitniveau bij `main`-pushes;
- `github_activity` voor algemene GitHub-activiteit die de ClawSweeper-agent kan inspecteren.

De `github_activity`-lane stuurt alleen genormaliseerde metadata door: eventtype, actie, actor, repository, itemnummer, URL, titel, status en korte fragmenten voor comments of reviews wanneer aanwezig. De lane vermijdt bewust het doorsturen van de volledige webhook-body. De ontvangende workflow in `openclaw/clawsweeper` is `.github/workflows/github-activity.yml`, die het genormaliseerde event post naar de OpenClaw Gateway-hook voor de ClawSweeper-agent.

Algemene activiteit is observatie, geen standaardlevering. De ClawSweeper-agent ontvangt het Discord-doel in zijn prompt en moet alleen posten naar `#clawsweeper` wanneer het event verrassend, actiegericht, risicovol of operationeel nuttig is. Routinematige opens, edits, bot-ruis, dubbele webhook-ruis en normaal reviewverkeer moeten resulteren in `NO_REPLY`.

Behandel GitHub-titels, comments, bodies, reviewtekst, branchnamen en commitberichten als niet-vertrouwde data in dit hele pad. Ze zijn input voor samenvatting en triage, geen instructies voor de workflow of agent-runtime.

## Handmatige dispatches

Handmatige CI-dispatches draaien dezelfde jobgrafiek als normale CI, maar forceren elke niet-Android-scoped lane aan: Linux Node-shards, bundled-plugin-shards, Plugin- en kanaalcontractshards, Node 22-compatibiliteit, `check-*`, `check-additional-*`, smokechecks voor gebouwde artefacten, docs-checks, Python Skills, Windows, macOS, iOS-build en Control UI i18n. Losstaande handmatige CI-dispatches draaien Android alleen met `include_android=true`; de volledige release-umbrella schakelt Android in door `include_android=true` door te geven. Statische prereleasechecks voor Plugins, de release-only `agentic-plugins`-shard, de volledige extension-batchsweep en prerelease-Docker-lanes voor Plugins zijn uitgesloten van CI. De Docker-prerelease-suite draait alleen wanneer `Full Release Validation` de afzonderlijke `Plugin Prerelease`-workflow dispatcht met de release-validation-gate ingeschakeld.

Handmatige runs gebruiken een unieke concurrency group zodat een volledige release-candidate-suite niet wordt geannuleerd door een andere push- of PR-run op dezelfde ref. Met de optionele `target_ref`-input kan een vertrouwde caller die grafiek draaien tegen een branch, tag of volledige commit-SHA terwijl het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                          | Jobs                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Handmatige CI-dispatch en fallbacks voor niet-canonieke repositories, CodeQL-kwaliteitsscans voor JavaScript/actions, workflow-sanity, labeler, auto-response, docs-workflows buiten CI en install-smoke-preflight zodat de Blacksmith-matrix eerder kan wachtrijen                              |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, extension-shards met lager gewicht, `checks-fast-core`, Plugin-/kanaalcontractshards, de meeste gebundelde/Linux Node-shards met lager gewicht, `check-guards`, `check-prod-types`, `check-test-types`, geselecteerde `check-additional-*`-shards en `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Behouden zware Linux Node-suites, boundary-/extension-zware `check-additional-*`-shards en `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (CPU-gevoelig genoeg dat 8 vCPU meer kostte dan het bespaarde); install-smoke-Docker-builds (32-vCPU-wachtrijtijd kostte meer dan het bespaarde)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` op `openclaw/openclaw`; forks vallen terug op `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` en `ios-build` op `openclaw/openclaw`; forks vallen terug op `macos-26`                                                                                                                                                                                                  |

## Runner-registratiebudget

OpenClaw's huidige GitHub-runner-registratiebucket staat 3.000 self-hosted
runner-registraties per 5 minuten toe. De limiet wordt gedeeld door alle Blacksmith-runner-
registraties in de organisatie `openclaw`, dus het toevoegen van een andere Blacksmith-
installatie voegt geen nieuwe bucket toe.

Behandel Blacksmith-labels als de schaarse resource voor burst-control. Jobs die
alleen routeren, notificeren, samenvatten, shards selecteren of korte CodeQL-scans draaien, moeten
op GitHub-hosted runners blijven tenzij ze gemeten Blacksmith-specifieke
behoeften hebben. Elke nieuwe Blacksmith-matrix, grotere `max-parallel` of hoogfrequente
workflow moet zijn worst-case registratieaantal tonen en het doel op organisatieniveau
onder 2.000 registraties per 5 minuten houden, met ruimte voor gelijktijdige
repositories en opnieuw uitgevoerde jobs.

Canonieke-repo-CI houdt Blacksmith als standaard runner-pad voor normale push- en pull-request-runs. `workflow_dispatch` en runs van niet-canonieke repositories gebruiken GitHub-hosted runners, maar normale canonieke runs peilen momenteel niet de wachtrijgezondheid van Blacksmith en vallen niet automatisch terug op GitHub-hosted labels wanneer Blacksmith niet beschikbaar is.

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
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw-prestaties

`OpenClaw Performance` is de prestatie-workflow voor product/runtime. Deze draait dagelijks op `main` en kan handmatig worden gestart:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Handmatige dispatch benchmarkt normaal gesproken de workflow-ref. Stel `target_ref` in om een releasetag of een andere branch te benchmarken met de huidige workflow-implementatie. Gepubliceerde rapportpaden en latest-pointers worden gesleuteld op de geteste ref, en elke `index.md` registreert de geteste ref/SHA, workflow-ref/SHA, Kova-ref, het profiel, de lane-authmodus, het model, het aantal herhalingen en scenariofilters.

De workflow installeert OCM vanuit een vastgepinde release en Kova vanuit `openclaw/Kova` op de vastgepinde `kova_ref`-invoer, en voert daarna drie lanes uit:

- `mock-provider`: Kova-diagnosescenario's tegen een lokaal gebouwde runtime met deterministische nep-authenticatie die compatibel is met OpenAI.
- `mock-deep-profile`: CPU-/heap-/traceprofilering voor hotspots bij opstarten, Gateway en agent-turns.
- `live-openai-candidate`: een echte agent-turn met OpenAI `openai/gpt-5.5`, overgeslagen wanneer `OPENAI_API_KEY` niet beschikbaar is.

De mock-provider-lane voert na de Kova-pass ook OpenClaw-native source probes uit: Gateway-opstarttiming en geheugen over standaard-, hook- en opstartgevallen met 50 Plugins; RSS voor import van gebundelde Plugins, herhaalde mock-OpenAI `channel-chat-baseline` hello-loops, CLI-opstartcommando's tegen de opgestarte Gateway, en de SQLite state smoke-prestatieprobe. Wanneer het vorige gepubliceerde mock-provider-bronrapport beschikbaar is voor de geteste ref, vergelijkt de bronsamenvatting de huidige RSS- en heapwaarden met die baseline en markeert grote RSS-toenames als `watch`. De Markdown-samenvatting van de source probe staat in `source/index.md` in de rapportbundel, met de ruwe JSON ernaast.

Elke lane uploadt GitHub-artifacts. Wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd, commit de workflow ook `report.json`, `report.md`, bundels, `index.md` en source-probe-artifacts naar `openclaw/clawgrit-reports` onder `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. De huidige tested-ref-pointer wordt geschreven als `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Volledige releasevalidatie

`Full Release Validation` is de handmatige overkoepelende workflow voor "alles uitvoeren vóór release." Deze accepteert een branch, tag of volledige commit-SHA, dispatcht de handmatige `CI`-workflow met dat doel, dispatcht `Plugin Prerelease` voor release-only Plugin-/package-/statische-/Docker-bewijsvoering, en dispatcht `OpenClaw Release Checks` voor install smoke, package acceptance, cross-OS package-checks, rendering van de maturity-scorecard op basis van QA-profielbewijs, QA Lab-pariteit, Matrix en Telegram-lanes. Stabiele en volledige profielen bevatten altijd uitputtende live/E2E- en Docker-release-path soak-dekking; het bètaprofiel kan zich daarvoor aanmelden met `run_release_soak=true`. De canonieke package Telegram-E2E draait binnen Package Acceptance, zodat een volledige kandidaat geen dubbele live poller start. Geef na publiceren `release_package_spec` door om het verzonden npm-package te hergebruiken in release checks, Package Acceptance, Docker, cross-OS en Telegram zonder opnieuw te bouwen. Gebruik `npm_telegram_package_spec` alleen voor een gerichte Telegram-herhaling met een gepubliceerd package. De live package-lane van de Codex-Plugin gebruikt standaard dezelfde geselecteerde staat: gepubliceerd `release_package_spec=openclaw@<tag>` leidt `codex_plugin_spec=npm:@openclaw/codex@<tag>` af, terwijl SHA-/artifact-runs `extensions/codex` pakken vanuit de geselecteerde ref. Stel `codex_plugin_spec` expliciet in voor aangepaste Plugin-bronnen zoals `npm:`, `npm-pack:` of `git:`-specificaties.

Zie [volledige releasevalidatie](/nl/reference/full-release-validation) voor de
fasematrix, exacte workflow-jobnamen, profielverschillen, artifacts en
handles voor gerichte herhalingen.

`OpenClaw Release Publish` is de handmatige muterende releaseworkflow. Dispatch deze
vanuit `release/YYYY.M.PATCH` of `main` nadat de releasetag bestaat en nadat de
OpenClaw npm-preflight is geslaagd. De workflow verifieert `pnpm plugins:sync:check`,
dispatcht `Plugin NPM Release` voor alle publiceerbare Plugin-packages, dispatcht
`Plugin ClawHub Release` voor dezelfde release-SHA, en dispatcht pas daarna
`OpenClaw NPM Release` met de opgeslagen `preflight_run_id`. Stabiel publiceren vereist ook
een exacte `windows_node_tag`; de workflow verifieert de Windows-bronrelease
en vergelijkt de x64-/ARM64-installers daarvan met de kandidaat-goedgekeurde
`windows_node_installer_digests`-invoer vóór elk publish-child, promoot en
verifieert daarna dezelfde vastgepinde installer-digests plus het exacte companion-asset
en checksumcontract voordat de GitHub-release-draft wordt gepubliceerd.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Gebruik voor vastgepind commitbewijs op een snel bewegende branch de helper in plaats van
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow-dispatch-refs moeten branches of tags zijn, geen ruwe commit-SHA's. De
helper pusht een tijdelijke `release-ci/<sha>-...`-branch op de doel-SHA,
dispatcht `Full Release Validation` vanuit die vastgepinde ref, verifieert dat elke child-workflow
`headSha` overeenkomt met het doel, en verwijdert de tijdelijke branch wanneer de
run is voltooid. De overkoepelende verifier faalt ook als een child-workflow op een
andere SHA draaide.

`release_profile` bepaalt de live/provider-breedte die aan release checks wordt doorgegeven. De
handmatige releaseworkflows gebruiken standaard `stable`; gebruik `full` alleen wanneer je
bewust de brede adviserende provider-/mediamatrix wilt. Stabiele en volledige
release checks voeren altijd de uitputtende live/E2E- en Docker-release-path soak uit;
het bètaprofiel kan zich aanmelden met `run_release_soak=true`.

- `minimum` behoudt de snelste OpenAI-/core releasekritieke lanes.
- `stable` voegt de stabiele provider-/backendset toe.
- `full` voert de brede adviserende provider-/mediamatrix uit.

De overkoepelende workflow registreert de gedispatchte child-run-id's, en de laatste job `Verify full validation` controleert opnieuw de huidige conclusies van child-runs en voegt tabellen met traagste jobs toe voor elke child-run. Als een child-workflow opnieuw wordt uitgevoerd en groen wordt, voer dan alleen de parent-verifier-job opnieuw uit om het overkoepelende resultaat en de timingsamenvatting te vernieuwen.

Voor herstel accepteren zowel `Full Release Validation` als `OpenClaw Release Checks` `rerun_group`. Gebruik `all` voor een releasekandidaat, `ci` voor alleen de normale full-CI-child, `plugin-prerelease` voor alleen de Plugin-prerelease-child, `release-checks` voor elke release-child, of een smallere groep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` of `npm-telegram` op de overkoepelende workflow. Dit houdt een mislukte releasebox-herhaling begrensd na een gerichte fix. Combineer voor één mislukte cross-OS-lane `rerun_group=cross-os` met `cross_os_suite_filter`, bijvoorbeeld `windows/packaged-upgrade`; lange cross-OS-commando's geven Heartbeat-regels uit en packaged-upgrade-samenvattingen bevatten timings per fase. QA release-check-lanes zijn adviserend, behalve de standaard runtime-tooldekkingsgate, die blokkeert wanneer vereiste dynamische OpenClaw-tools afwijken of verdwijnen uit de standard tier-samenvatting.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde ref eenmaal te resolven naar een `release-package-under-test`-tarball, en geeft dat artifact daarna door aan cross-OS-checks en Package Acceptance, plus de live/E2E release-path Docker-workflow wanneer soak-dekking draait. Zo blijven de package-bytes consistent over releaseboxen en wordt voorkomen dat dezelfde kandidaat opnieuw wordt gepackt in meerdere child-jobs. Voor de live lane van de Codex npm-Plugin geven release checks ofwel een overeenkomende gepubliceerde Plugin-specificatie door die is afgeleid van `release_package_spec`, of de door de operator geleverde `codex_plugin_spec`, of laten ze de invoer leeg zodat het Docker-script de Codex-Plugin uit de geselecteerde checkout pakt.

Dubbele `Full Release Validation`-runs voor `ref=main` en `rerun_group=all`
vervangen de oudere overkoepelende run. De parent-monitor annuleert elke child-workflow die deze
al heeft gedispatcht wanneer de parent wordt geannuleerd, zodat nieuwere main-validatie
niet achter een verouderde twee uur durende release-check-run blijft hangen. Validatie van
releasebranches/-tags en gerichte rerun-groepen houden `cancel-in-progress: false`.

## Live- en E2E-shards

De release live/E2E-child behoudt brede native `pnpm test:live`-dekking, maar voert die uit als benoemde shards via `scripts/test-live-shard.mjs` in plaats van één seriële job:

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
- gesplitste media-audio-/video-shards en provider-gefilterde muziek-shards

Dat behoudt dezelfde bestandsdekking terwijl trage live provider-fouten makkelijker opnieuw uit te voeren en te diagnosticeren zijn. De geaggregeerde shardnamen `native-live-extensions-o-z`, `native-live-extensions-media` en `native-live-extensions-media-music` blijven geldig voor handmatige eenmalige herhalingen.

De native live media-shards draaien in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de workflow `Live Media Runner Image`. Die image installeert `ffmpeg` en `ffprobe` vooraf; mediajobs verifiëren alleen de binaries vóór de setup. Houd Docker-backed live suites op normale Blacksmith-runners — containerjobs zijn de verkeerde plek om geneste Docker-tests te starten.

Docker-ondersteunde live model-/backend-shards gebruiken per geselecteerde commit een afzonderlijke gedeelde `ghcr.io/openclaw/openclaw-live-test:<sha>`-image. De live release-workflow bouwt en pusht die image eenmaal; daarna draaien de Docker live model-, provider-gesharde Gateway-, CLI-backend-, ACP bind- en Codex harness-shards met `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker-shards hebben expliciete `timeout`-limieten op scriptniveau onder de workflowtaaktime-out, zodat een vastgelopen container of opruimpad snel faalt in plaats van het volledige release-checkbudget te verbruiken. Als die shards het volledige source-Dockerdoel afzonderlijk opnieuw bouwen, is de release-run verkeerd geconfigureerd en verspilt die wandkloktijd aan dubbele image-builds.

## Pakketacceptatie

Gebruik `Package Acceptance` wanneer de vraag is: "werkt dit installeerbare OpenClaw-pakket als product?" Dit verschilt van normale CI: normale CI valideert de source tree, terwijl pakketacceptatie één tarball valideert via dezelfde Docker E2E-harness die gebruikers na installatie of update gebruiken.

### Taken

1. `resolve_package` checkt `workflow_ref` uit, resolveert één pakketkandidaat, schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het `package-under-test`-artifact en drukt de bron, workflow-ref, pakket-ref, versie, SHA-256 en het profiel af in de GitHub-stapsamenvatting.
2. `docker_acceptance` roept `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt dat artifact, valideert de tarball-inventaris, bereidt indien nodig package-digest-Docker-images voor en draait de geselecteerde Docker-lanes tegen dat pakket in plaats van de workflow-checkout te packen. Wanneer een profiel meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het pakket en de gedeelde images eenmaal voor en verdeelt die lanes daarna als parallelle gerichte Docker-taken met unieke artifacts.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Dit draait wanneer `telegram_mode` niet `none` is en installeert hetzelfde `package-under-test`-artifact wanneer Pakketacceptatie er een heeft resolved; een zelfstandige Telegram-dispatch kan nog steeds een gepubliceerde npm-specificatie installeren.
4. `summary` laat de workflow falen als pakketresolutie, Docker-acceptatie of de optionele Telegram-lane is mislukt.

### Kandidaatbronnen

- `source=npm` accepteert alleen `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor acceptatie van gepubliceerde prerelease-/stabiele pakketten.
- `source=ref` packt een vertrouwde `package_ref`-branch, tag of volledige commit-SHA. De resolver haalt OpenClaw-branches/tags op, verifieert dat de geselecteerde commit bereikbaar is vanuit de repository-branchgeschiedenis of een releasetag, installeert afhankelijkheden in een detached worktree en packt die met `scripts/package-openclaw-for-docker.mjs`.
- `source=url` downloadt een openbare HTTPS-`.tgz`; `package_sha256` is verplicht. Dit pad weigert URL-credentials, niet-standaard HTTPS-poorten, private/interne/special-use hostnamen of resolved IP's, en redirects buiten hetzelfde openbare veiligheidsbeleid.
- `source=trusted-url` downloadt een HTTPS-`.tgz` vanaf een benoemd trusted-source-beleid in `.github/package-trusted-sources.json`; `package_sha256` en `trusted_source_id` zijn verplicht. Gebruik dit alleen voor door maintainers beheerde enterprise-mirrors of private pakketrepositories die geconfigureerde hosts, poorten, padprefixen, redirect-hosts of private-netwerkresolutie nodig hebben. Als het beleid bearer-auth verklaart, gebruikt de workflow het vaste `OPENCLAW_TRUSTED_PACKAGE_TOKEN`-secret; in URL's ingesloten credentials worden nog steeds geweigerd.
- `source=artifact` downloadt één `.tgz` vanuit `artifact_run_id` en `artifact_name`; `package_sha256` is optioneel, maar moet voor extern gedeelde artifacts worden opgegeven.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde workflow-/harnesscode die de test uitvoert. `package_ref` is de source-commit die wordt gepackt wanneer `source=ref`. Hierdoor kan de huidige testharness oudere vertrouwde source-commits valideren zonder oude workflowlogica te draaien.

### Suiteprofielen

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — volledige Docker release-padchunks met OpenWebUI
- `custom` — exacte `docker_lanes`; verplicht wanneer `suite_profile=custom`

Het `package`-profiel gebruikt offline plugin-dekking, zodat validatie van gepubliceerde pakketten niet afhankelijk is van live ClawHub-beschikbaarheid. De optionele Telegram-lane hergebruikt het `package-under-test`-artifact in `NPM Telegram Beta E2E`, terwijl het gepubliceerde npm-specificatiepad behouden blijft voor zelfstandige dispatches.

Voor het specifieke beleid voor update- en Plugin-tests, inclusief lokale opdrachten,
Docker-lanes, Pakketacceptatie-inputs, release-standaarden en foutentriage,
zie [Updates en plugins testen](/nl/help/testing-updates-plugins).

Releasecontroles roepen Pakketacceptatie aan met `source=artifact`, het voorbereide releasepakket-artifact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` en `telegram_mode=mock-openai`. Hierdoor blijven pakketmigratie, update, live ClawHub-Skills-installatie, opruiming van verouderde plugin-afhankelijkheden, herstel van geconfigureerde Plugin-installaties, offline Plugin, plugin-update en Telegram-bewijs op dezelfde resolved pakkettarball. Stel `release_package_spec` in op Full Release Validation of OpenClaw Release Checks nadat een bèta is gepubliceerd om dezelfde matrix tegen het verzonden npm-pakket te draaien zonder opnieuw te bouwen; stel `package_acceptance_package_spec` alleen in wanneer Pakketacceptatie een ander pakket nodig heeft dan de rest van de releasevalidatie. Cross-OS-releasecontroles dekken nog steeds OS-specifieke onboarding, installer- en platformgedrag; productvalidatie voor pakket/update moet beginnen met Pakketacceptatie. De `published-upgrade-survivor` Docker-lane valideert per run één gepubliceerde pakketbaseline in het blokkerende releasepad. In Pakketacceptatie is de resolved `package-under-test`-tarball altijd de kandidaat en selecteert `published_upgrade_survivor_baseline` de fallback-gepubliceerde baseline, standaard `openclaw@latest`; rerun-opdrachten voor mislukte lanes behouden die baseline. Full Release Validation met `run_release_soak=true` of `release_profile=full` stelt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` en `published_upgrade_survivor_scenarios=reported-issues` in om uit te breiden over de vier nieuwste stabiele npm-releases plus vastgepinde plugin-compatibiliteitsgrensreleases en issue-vormige fixtures voor Feishu-configuratie, behouden bootstrap-/personabestanden, geconfigureerde OpenClaw Plugin-installaties, tilde-logpaden en verouderde legacy Plugin-afhankelijkheidsroots. Multi-baseline published-upgrade survivor-selecties worden per baseline geshard in afzonderlijke gerichte Docker runner-taken. De afzonderlijke `Update Migration`-workflow gebruikt de `update-migration` Docker-lane met `all-since-2026.4.23` en `plugin-deps-cleanup` wanneer de vraag uitputtende gepubliceerde update-opruiming is, niet de normale breedte van Full Release CI. Lokale geaggregeerde runs kunnen exacte pakketspecificaties doorgeven met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, een enkele lane behouden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` zoals `openclaw@2026.4.15`, of `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` instellen voor de scenariomatrix. De gepubliceerde lane configureert de baseline met een ingebakken `openclaw config set`-opdrachtrecept, registreert receptstappen in `summary.json` en peilt `/healthz`, `/readyz` plus RPC-status na Gateway-start. De Windows packaged- en installer fresh-lanes verifiëren ook dat een geïnstalleerd pakket een browser-control override kan importeren vanaf een raw absoluut Windows-pad. De OpenAI cross-OS agent-turn smoke-test gebruikt standaard `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer ingesteld, anders `openai/gpt-5.5`, zodat het installatie- en Gateway-bewijs op een GPT-5-testmodel blijft en GPT-4.x-standaarden worden vermeden.

### Legacy compatibiliteitsvensters

Pakketacceptatie heeft begrensde legacy-compatibiliteitsvensters voor reeds gepubliceerde pakketten. Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen het compatibiliteitspad gebruiken:

- bekende private QA-items in `dist/postinstall-inventory.json` mogen verwijzen naar bestanden die uit de tarball zijn weggelaten;
- `doctor-switch` mag de subcase voor persistentie van `gateway install --wrapper` overslaan wanneer het pakket die vlag niet beschikbaar stelt;
- `update-channel-switch` mag ontbrekende pnpm `patchedDependencies` verwijderen uit de van de tarball afgeleide fake git-fixture en mag ontbrekende gepersisteerde `update.channel` loggen;
- plugin-smoke-tests mogen legacy install-record-locaties lezen of ontbrekende marketplace install-record-persistentie accepteren;
- `plugin-update` mag configuratiemetadata-migratie toestaan, terwijl het installatierecord en het gedrag zonder herinstallatie nog steeds ongewijzigd moeten blijven.

Het gepubliceerde `2026.4.26`-pakket mag ook waarschuwen voor lokaal gebouwde metadatastempelbestanden die al waren verzonden. Latere pakketten moeten voldoen aan de moderne contracten; dezelfde voorwaarden falen dan in plaats van te waarschuwen of over te slaan.

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
  -f package_ref=release/YYYY.M.PATCH \
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

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
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

Begin bij het debuggen van een mislukte pakketacceptatierun met de `resolve_package`-samenvatting om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de `docker_acceptance`-child-run en de bijbehorende Docker-artifacts: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logs, fasetimings en rerun-opdrachten. Geef de voorkeur aan het opnieuw draaien van het mislukte pakketprofiel of de exacte Docker-lanes boven het opnieuw draaien van volledige releasevalidatie.

## Installatiesmoke-test

De afzonderlijke `Install Smoke`-workflow hergebruikt hetzelfde scopescript via zijn eigen `preflight`-taak. Deze splitst smoke-testdekking op in `run_fast_install_smoke` en `run_full_install_smoke`.

- **Snel pad** wordt uitgevoerd voor pull requests die Docker-/pakketoppervlakken, wijzigingen in gebundelde Plugin-pakketten/-manifesten, of kernoppervlakken voor Plugin/channel/Gateway/Plugin SDK raken die door de Docker-smoketaken worden getest. Alleen bronwijzigingen in gebundelde Plugins, alleen testwijzigingen en alleen documentatiewijzigingen reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image eenmaal, controleert de CLI, voert de CLI-smoke voor het verwijderen van de gedeelde werkruimte van agents uit, voert de container-gateway-network-e2e uit, verifieert een build-argument voor een gebundelde extensie, en voert het begrensde Docker-profiel voor gebundelde Plugins uit binnen een geaggregeerde commandotime-out van 240 seconden (de Docker-run van elk scenario wordt afzonderlijk begrensd).
- **Volledig pad** behoudt QR-pakketinstallatie en Docker-/updatedekking voor installers voor nachtelijke geplande runs, handmatige dispatches, workflow-call-releasecontroles en pull requests die werkelijk installer-/pakket-/Docker-oppervlakken raken. In volledige modus bereidt install-smoke één target-SHA GHCR root-Dockerfile-smoke-image voor of hergebruikt die, en voert daarna QR-pakketinstallatie, root-Dockerfile-/Gateway-smokes, installer-/updatesmokes en de snelle Docker-E2E voor gebundelde Plugins uit als afzonderlijke jobs, zodat installerwerk niet hoeft te wachten achter de root-image-smokes.

`main`-pushes (inclusief merge-commits) forceren het volledige pad niet; wanneer changed-scope-logica volledige dekking op een push zou aanvragen, houdt de workflow de snelle Docker-smoke en laat hij de volledige install-smoke over aan nachtelijke of releasevalidatie.

De trage Bun global install image-provider-smoke wordt afzonderlijk afgeschermd door `run_bun_global_install_smoke`. Deze draait volgens het nachtelijke schema en vanuit de releasecontroles-workflow, en handmatige `Install Smoke`-dispatches kunnen ervoor kiezen, maar pull requests en `main`-pushes niet. Normale PR-CI voert nog steeds de snelle Bun-launcher-regressielane uit voor Node-relevante wijzigingen. QR- en installer-Docker-tests behouden hun eigen op installatie gerichte Dockerfiles.

## Lokale Docker-E2E

`pnpm test:docker:all` prebuiltt één gedeelde live-test-image, verpakt OpenClaw eenmaal als npm-tarball en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images:

- een kale Node/Git-runner voor installer-/update-/plugin-dependency-lanes;
- een functionele image die dezelfde tarball in `/app` installeert voor normale functionaliteitslanes.

Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en voert daarna lanes uit met `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Instelbare opties

| Variabele                              | Standaard | Doel                                                                                          |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Aantal slots in de hoofdpool voor normale lanes.                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Aantal slots in de providergevoelige staartpool.                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limiet voor gelijktijdige live-lanes zodat providers niet throttlen.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5         | Limiet voor gelijktijdige npm-installatielanes.                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limiet voor gelijktijdige multi-service-lanes.                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Spreiding tussen lanestarts om Docker-daemon-create-stormen te vermijden; stel `0` in voor geen spreiding. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Fallback-time-out per lane (120 minuten); geselecteerde live-/tail-lanes gebruiken strakkere limieten. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | niet ingesteld | `1` print het schedulerplan zonder lanes uit te voeren.                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | niet ingesteld | Door komma's gescheiden exacte lanelijst; slaat cleanup-smoke over zodat agents één mislukte lane kunnen reproduceren. |

Een lane die zwaarder is dan zijn effectieve limiet kan nog steeds starten vanuit een lege pool, en draait daarna alleen totdat hij capaciteit vrijgeeft. De lokale geaggregeerde preflights controleren Docker, verwijderen verouderde OpenClaw-E2E-containers, geven actieve-lanestatus uit, bewaren lanetimings voor longest-first-volgorde, en stoppen standaard met het plannen van nieuwe gepoolde lanes na de eerste fout.

### Herbruikbare live-/E2E-workflow

De herbruikbare live-/E2E-workflow vraagt aan `scripts/test-docker-all.mjs --plan-json` welke pakket-, image-soort-, live-image-, lane- en credentialdekking vereist is. `scripts/docker-e2e.mjs` zet dat plan daarna om in GitHub-outputs en samenvattingen. De workflow verpakt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een pakketartifact van de huidige run, of downloadt een pakketartifact uit `package_artifact_run_id`; valideert de tarball-inventaris; bouwt en pusht package-digest-getagde bare/functional GHCR Docker-E2E-images via Blacksmiths Docker-layer-cache wanneer het plan lanes met geïnstalleerd pakket nodig heeft; en hergebruikt opgegeven invoerwaarden `docker_e2e_bare_image`/`docker_e2e_functional_image` of bestaande package-digest-images in plaats van opnieuw te bouwen. Docker-image-pulls worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry-/cachestream snel opnieuw wordt geprobeerd in plaats van het grootste deel van het kritieke CI-pad te verbruiken.

### Releasepad-chunks

Release-Dockerdekking draait kleinere opgesplitste jobs met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elke chunk alleen de image-soort ophaalt die hij nodig heeft en meerdere lanes uitvoert via dezelfde gewogen scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Huidige release-Dockerchunks zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, en `plugins-runtime-install-a` tot en met `plugins-runtime-install-h`. `package-update-openai` bevat de live Codex-Plugin-pakketlane, die het kandidaat-OpenClaw-pakket installeert, de Codex-Plugin installeert vanuit `codex_plugin_spec` of een tarball van dezelfde ref met expliciete goedkeuring voor Codex CLI-installatie, Codex CLI-preflight uitvoert, en daarna meerdere OpenClaw-agentbeurten in dezelfde sessie tegen OpenAI uitvoert. `plugins-runtime-core`, `plugins-runtime`, en `plugins-integrations` blijven geaggregeerde Plugin-/runtime-aliassen. De lane-alias `install-e2e` blijft de geaggregeerde handmatige heruitvoeringsalias voor beide providerinstallerlanes.

OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige releasepaddekking daarom vraagt, en behoudt alleen een zelfstandige `openwebui`-chunk voor dispatches die uitsluitend OpenWebUI betreffen. Update-lanes voor gebundelde channels proberen één keer opnieuw bij tijdelijke npm-netwerkfouten.

Elke chunk uploadt `.artifacts/docker-tests/` met lanelogs, timings, `summary.json`, `failures.json`, fasetimings, schedulerplan-JSON, tabellen met trage lanes en heruitvoercommando's per lane. De workflowinvoer `docker_lanes` voert geselecteerde lanes uit tegen de voorbereide images in plaats van de chunkjobs, waardoor debuggen van mislukte lanes begrensd blijft tot één gerichte Docker-job en het pakketartifact voor die run wordt voorbereid, gedownload of hergebruikt; als een geselecteerde lane een live-Docker-lane is, bouwt de gerichte job de live-test-image lokaal voor die heruitvoering. Gegenereerde GitHub-heruitvoercommando's per lane bevatten `package_artifact_run_id`, `package_artifact_name` en voorbereide image-invoerwaarden wanneer die waarden bestaan, zodat een mislukte lane exact hetzelfde pakket en dezelfde images uit de mislukte run kan hergebruiken.

```bash
pnpm test:docker:rerun <run-id>      # download Docker-artifacts en print gecombineerde/per-lane gerichte heruitvoercommando's
pnpm test:docker:timings <summary>   # samenvattingen van trage lanes en kritieke paden per fase
```

De geplande live-/E2E-workflow voert dagelijks de volledige releasepad-Docker-suite uit.

## Plugin-prerelease

`Plugin Prerelease` is duurdere product-/pakketdekking, dus dit is een afzonderlijke workflow die wordt gedispatcht door `Full Release Validation` of door een expliciete operator. Normale pull requests, `main`-pushes en zelfstandige handmatige CI-dispatches houden die suite uitgeschakeld. De workflow verdeelt gebundelde Plugin-tests over acht extensieworkers; die extensie-shardjobs voeren maximaal twee Plugin-configuratiegroepen tegelijk uit met één Vitest-worker per groep en een grotere Node-heap, zodat importzware Plugin-batches geen extra CI-jobs creëren. Het release-only Docker-prereleasepad batched gerichte Docker-lanes in kleine groepen om te voorkomen dat tientallen runners worden gereserveerd voor jobs van één tot drie minuten. De workflow uploadt ook een informatief artifact `plugin-inspector-advisory` van `@openclaw/plugin-inspector`; inspectorbevindingen zijn triage-invoer en wijzigen de blokkerende Plugin Prerelease-gate niet.

## QA Lab

QA Lab heeft dedicated CI-lanes buiten de belangrijkste smart-scoped-workflow. Agentic parity is genest onder de brede QA- en releaseharnassen, niet als zelfstandige PR-workflow. Gebruik `Full Release Validation` met `rerun_group=qa-parity` wanneer parity moet meelopen met een brede validatierun.

- De workflow `QA-Lab - All Lanes` draait nachtelijk op `main` en bij handmatige dispatch; hij spreidt de mock parity-lane, live Matrix-lane en live Telegram- en Discord-lanes uit als parallelle jobs. Live-jobs gebruiken de omgeving `qa-live-shared`, en Telegram/Discord gebruiken Convex-leases.

Releasecontroles voeren Matrix- en Telegram-live-transportlanes uit met de deterministische mockprovider en mock-gekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het channelcontract geïsoleerd is van live-modellatentie en normale startup van provider-Plugins. De live-transport-Gateway schakelt memory search uit omdat QA-parity geheugengedrag afzonderlijk dekt; providerconnectiviteit wordt gedekt door de afzonderlijke suites voor live-modellen, native providers en Docker-providers.

Matrix gebruikt `--profile fast` voor geplande en releasegates, en voegt `--fail-fast` alleen toe wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaard en handmatige workflowinvoer blijven `all`; handmatige `matrix_profile=all`-dispatch shardt volledige Matrix-dekking altijd naar `transport`, `media`, `e2ee-smoke`, `e2ee-deep` en `e2ee-cli`-jobs.

`OpenClaw Release Checks` voert ook de releasekritieke QA Lab-lanes uit vóór releasegoedkeuring; de QA-parity-gate voert de kandidaat- en baseline-pakketten uit als parallelle lanejobs, en downloadt daarna beide artifacts naar een kleine rapportjob voor de definitieve parityvergelijking.

Volg voor normale PR's scoped CI-/checkbewijs in plaats van parity als vereiste status te behandelen.

## CodeQL

De `CodeQL`-workflow is bewust een smalle securityscanner voor een eerste pass, niet de volledige repositorysweep. Dagelijkse, handmatige en niet-draft pull request-guardruns scannen Actions-workflowcode plus de JavaScript-/TypeScript-oppervlakken met het hoogste risico, met high-confidence securityquery's gefilterd op hoge/kritieke `security-severity`.

De pull request-guard blijft licht: hij start alleen voor wijzigingen onder `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` of `src`, en voert dezelfde high-confidence securitymatrix uit als de geplande workflow. Android- en macOS-CodeQL blijven buiten de PR-standaarden.

### Securitycategorieën

| Categorie                                         | Oppervlak                                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron en gateway-baseline                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Implementatiecontracten voor core-kanalen plus de runtime van channel-plugins, gateway, Plugin SDK, secrets, audit-aanraakpunten    |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP-parsing, netwerkguard, web-fetch en SSRF-beleidsoppervlakken van de Plugin SDK                                        |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-servers, hulpfuncties voor procesuitvoering, uitgaande aflevering en poorten voor agent-tooluitvoering                          |
| `/codeql-security-high/plugin-trust-boundary`     | Vertrouwensoppervlakken voor Plugin-installatie, loader, manifest, registry, package-manager-installatie, source-loading en Plugin SDK-packagecontract |

### Platformspecifieke beveiligingsshards

- `CodeQL Android Critical Security` — geplande Android-beveiligingsshard. Bouwt de Android-app handmatig voor CodeQL op de kleinste Blacksmith Linux-runner die door workflow-sanity wordt geaccepteerd. Uploadt onder `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — wekelijkse/handmatige macOS-beveiligingsshard. Bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert resultaten van dependency-builds uit de geüploade SARIF en uploadt onder `/codeql-critical-security/macos`. Buiten de dagelijkse defaults gehouden omdat de macOS-build de runtime domineert, zelfs wanneer die schoon is.

### Critical Quality-categorieën

`CodeQL Critical Quality` is de bijpassende niet-beveiligingsshard. Deze voert alleen JavaScript/TypeScript-kwaliteitsqueries met foutseverity en zonder beveiligingsfocus uit over smalle, waardevolle oppervlakken op door GitHub gehoste Linux-runners, zodat kwaliteitsscans geen Blacksmith-runnerregistratiebudget verbruiken. De pull-requestguard is bewust kleiner dan het geplande profiel: niet-draft-PR's draaien alleen de bijpassende shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` en `plugin-sdk-reply-runtime` voor wijzigingen in agent-command/model/tooluitvoering en reply-dispatchcode, configschema/migratie/IO-code, auth/secrets/sandbox/beveiligingscode, core-kanaalruntime en gebundelde channel-pluginruntime, Gateway-protocol/server-method, memory runtime/SDK-lijm, MCP/proces/uitgaande aflevering, provider-runtime/modelcatalogus, sessiediagnostics/afleveringsqueues, plugin-loader, Plugin SDK/packagecontract of Plugin SDK-replyruntime. Wijzigingen in CodeQL-configuratie en kwaliteitsworkflows draaien alle twaalf PR-kwaliteitsshards.

Handmatige dispatch accepteert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

De smalle profielen zijn onderwijs-/iteratiehooks om één kwaliteitsshard geïsoleerd te draaien.

| Categorie                                               | Oppervlak                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secrets, sandbox, cron en gateway-beveiligingsgrenscode                                                                                                     |
| `/codeql-critical-quality/config-boundary`              | Configschema-, migratie-, normalisatie- en IO-contracten                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-protocolschema's en servermethod-contracten                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementatiecontracten voor core-kanalen en gebundelde channel-plugins                                                                                           |
| `/codeql-critical-quality/agent-runtime-boundary`       | Commanduitvoering, model/provider-dispatch, auto-reply-dispatch en queues, en ACP-control-plane-runtimecontracten                                                 |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-servers en toolbridges, hulpfuncties voor processupervisie en contracten voor uitgaande aflevering                                                            |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host-SDK, memory runtime-facades, memory Plugin SDK-aliassen, memory runtime-activatielijm en memory doctor-commands                                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Replyqueue-internals, sessieafleveringsqueues, hulpfuncties voor uitgaande sessiebinding/-aflevering, oppervlakken voor diagnostische events/logbundels en session doctor CLI-contracten |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK-dispatch van inkomende replies, reply-payload-/chunking-/runtimehulpfuncties, channel-replyopties, afleveringsqueues en hulpfuncties voor session/thread-binding |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisatie van modelcatalogi, provider-auth en discovery, registratie van provider-runtimes, providerdefaults/-catalogi en web/search/fetch/embedding-registries |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap van de Control UI, lokale persistentie, Gateway-controlflows en Task-control-plane-runtimecontracten                                                     |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web-fetch/search, media-IO, mediabegrip, image-generation en media-generation-runtimecontracten                                                              |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, registry-, public-surface- en Plugin SDK-entrypointcontracten                                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Gepubliceerde package-side Plugin SDK-bron en hulpfuncties voor plugin-packagecontracten                                                                          |

Kwaliteit blijft gescheiden van beveiliging zodat kwaliteitsbevindingen kunnen worden gepland, gemeten, uitgeschakeld of uitgebreid zonder het beveiligingssignaal te vertroebelen. Swift-, Python- en gebundelde-plugin-CodeQL-uitbreiding moeten alleen als gescopeerd of geshard vervolgwerk worden teruggezet nadat de smalle profielen stabiele runtime en stabiel signaal hebben.

## Onderhoudsworkflows

### Docs Agent

De `Docs Agent`-workflow is een eventgedreven Codex-onderhoudslane om bestaande docs afgestemd te houden op recent gelande wijzigingen. Deze heeft geen puur schema: een succesvolle niet-bot-push-CI-run op `main` kan hem triggeren, en handmatige dispatch kan hem direct draaien. Workflow-run-aanroepen slaan over wanneer `main` verder is gegaan of wanneer er in het laatste uur een andere niet-overgeslagen Docs Agent-run is aangemaakt. Wanneer de workflow draait, bekijkt die de commitrange van de vorige niet-overgeslagen Docs Agent-bron-SHA tot de huidige `main`, zodat één uurlijkse run alle main-wijzigingen kan dekken die sinds de laatste docs-pass zijn opgebouwd.

### Test Performance Agent

De `Test Performance Agent`-workflow is een eventgedreven Codex-onderhoudslane voor trage tests. Deze heeft geen puur schema: een succesvolle niet-bot-push-CI-run op `main` kan hem triggeren, maar hij slaat over als er die UTC-dag al een andere workflow-run-aanroep is uitgevoerd of actief is. Handmatige dispatch omzeilt die dagelijkse activiteitsgate. De lane bouwt een gegroepeerd Vitest-performancerapport voor de volledige suite, laat Codex alleen kleine testprestatieverbeteringen maken die coverage behouden in plaats van brede refactors, draait daarna het volledige-suiterapport opnieuw en wijst wijzigingen af die het basisaantal geslaagde tests verlagen. Het gegroepeerde rapport registreert per config wandkloktijd en maximale RSS op Linux en macOS, zodat de voor/na-vergelijking testgeheugendelta's naast duurdelta's toont. Als de baseline falende tests heeft, mag Codex alleen duidelijke fouten oplossen en moet het after-agent volledige-suiterapport slagen voordat er iets wordt gecommit. Wanneer `main` verdergaat voordat de bot-push landt, rebaset de lane de gevalideerde patch, draait `pnpm check:changed` opnieuw en probeert de push opnieuw; conflicterende verouderde patches worden overgeslagen. De workflow gebruikt door GitHub gehoste Ubuntu zodat de Codex-action dezelfde drop-sudo-veiligheidshouding kan behouden als de docs-agent.

### Duplicate PR's After Merge

De `Duplicate PRs After Merge`-workflow is een handmatige maintainerworkflow voor duplicate-opruiming na landen. Deze staat standaard op dry-run en sluit alleen expliciet genoemde PR's wanneer `apply=true`. Voordat GitHub wordt gemuteerd, verifieert de workflow dat de gelande PR is gemerged en dat elke duplicate ofwel een gedeeld gerefereerd issue heeft of overlappende gewijzigde hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale checkgates en changed-routing

Lokale changed-lane-logica staat in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale checkgate is strenger over architectuurgrenzen dan de brede CI-platformscope:

- core-productiewijzigingen draaien core-prod- en core-test-typecheck plus core-lint/guards;
- core-wijzigingen alleen voor tests draaien alleen core-test-typecheck plus core-lint;
- extension-productiewijzigingen draaien extension-prod- en extension-test-typecheck plus extension-lint;
- extension-wijzigingen alleen voor tests draaien extension-test-typecheck plus extension-lint;
- wijzigingen aan de publieke Plugin SDK of plugincontracten breiden uit naar extension-typecheck omdat extensions van die core-contracten afhangen (Vitest-extension-sweeps blijven expliciet testwerk);
- release-metadata-only versiebumps draaien gerichte versie-/config-/root-dependency-checks;
- onbekende root-/configwijzigingen falen veilig naar alle checklanes.

Lokale changed-test-routing staat in `scripts/test-projects.test-support.mjs` en is bewust goedkoper dan `check:changed`: directe testbewerkingen draaien zichzelf, sourcebewerkingen geven de voorkeur aan expliciete mappings, daarna siblingtests en importgraph-dependents. Gedeelde deliveryconfig voor group-room is een van de expliciete mappings: wijzigingen aan de group visible-reply-config, source reply delivery mode of de message-tool-systemprompt lopen via de core-replytests plus Discord- en Slack-deliveryregressies, zodat een gedeelde defaultwijziging faalt vóór de eerste PR-push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging zo harness-breed is dat de goedkope gemapte set geen betrouwbare proxy is.

## Testbox-validatie

Crabbox is de repo-eigen remote-box-wrapper voor maintainer-Linux-proof. Gebruik hem
vanaf de repo-root wanneer een check te breed is voor een lokale editloop, wanneer CI-
pariteit ertoe doet, of wanneer het bewijs secrets, Docker, packagelanes,
herbruikbare boxes of remote logs nodig heeft. De normale OpenClaw-backend is
`blacksmith-testbox`; eigen AWS/Hetzner-capaciteit is een fallback voor Blacksmith-
storingen, quotaproblemen of expliciete tests op eigen capaciteit.

Door Crabbox ondersteunde Blacksmith-runs warmen eenmalige Testboxes op, claimen, synchroniseren, voeren uit, rapporteren en ruimen op. De ingebouwde sanity check voor synchronisatie faalt snel wanneer vereiste rootbestanden zoals `pnpm-lock.yaml` verdwijnen of wanneer `git status --short` minstens 200 bijgehouden verwijderingen toont. Stel voor opzettelijke PR's met grote verwijderingen `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor de externe opdracht.

Crabbox beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de synchronisatiefase blijft zonder output na synchronisatie. Stel `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` in om die guard uit te schakelen, of gebruik een grotere millisecondenwaarde voor ongewoon grote lokale diffs.

Controleer vóór een eerste run de wrapper vanuit de repo-root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

De repo-wrapper weigert een verouderde Crabbox-binary die `blacksmith-testbox` niet adverteert. Geef de provider expliciet door, ook al heeft `.crabbox.yaml` owned-cloud-standaardwaarden. Vermijd in Codex-worktrees of gekoppelde/sparse checkouts het lokale `pnpm crabbox:run`-script, omdat pnpm afhankelijkheden kan reconciliëren voordat Crabbox start; roep in plaats daarvan de node-wrapper direct aan:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Door Blacksmith ondersteunde runs vereisen Crabbox 0.22.0 of nieuwer, zodat de wrapper het huidige Testbox-gedrag voor synchronisatie, wachtrij en opschoning krijgt. Bouw bij gebruik van de sibling-checkout de genegeerde lokale binary opnieuw voordat je timings of bewijswerk doet:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

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
  "corepack pnpm check:changed"
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
  "corepack pnpm test <path-or-filter>"
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
  "corepack pnpm test"
```

Lees de uiteindelijke JSON-samenvatting. De nuttige velden zijn `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` en `totalMs`. Eenmalige door Blacksmith ondersteunde Crabbox-runs zouden de Testbox automatisch moeten stoppen; als een run wordt onderbroken of opschoning onduidelijk is, inspecteer dan live boxen en stop alleen de boxen die je hebt gemaakt:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Gebruik hergebruik alleen wanneer je opzettelijk meerdere opdrachten op dezelfde gehydrateerde box nodig hebt:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Als Crabbox de kapotte laag is maar Blacksmith zelf werkt, gebruik directe Blacksmith dan alleen voor diagnostiek zoals `list`, `status` en opschoning. Herstel het Crabbox-pad voordat je een directe Blacksmith-run als maintainerbewijs behandelt.

Als `blacksmith testbox list --all` en `blacksmith testbox status` werken maar nieuwe warmups na een paar minuten `queued` blijven zonder IP of Actions-run-URL, behandel dit dan als druk door Blacksmith-provider, wachtrij, facturering of organisatielimiet. Stop de queued ids die je hebt gemaakt, voorkom dat je meer Testboxes start, en verplaats het bewijs naar het owned Crabbox-capaciteitspad hieronder terwijl iemand het Blacksmith-dashboard, de facturering en organisatielimieten controleert.

Escaleren naar owned Crabbox-capaciteit alleen wanneer Blacksmith down is, door quota wordt beperkt, de benodigde omgeving mist, of owned capaciteit expliciet het doel is:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Vermijd onder AWS-druk `class=beast`, tenzij de taak echt CPU van 48xlarge-klasse nodig heeft. Een `beast`-aanvraag start met 192 vCPU's en is de eenvoudigste manier om regionale EC2 Spot- of On-Demand Standard-quota te raken. De repo-owned `.crabbox.yaml` gebruikt standaard `standard`, meerdere capaciteitsregio's en `capacity.hints: true`, zodat gebrokerde AWS-leases geselecteerde regio/markt, quotadruk, Spot-fallback en waarschuwingen voor high-pressure klassen afdrukken. Gebruik `fast` voor zwaardere brede checks, `large` alleen nadat standard/fast niet genoeg zijn, en `beast` alleen voor uitzonderlijke CPU-gebonden lanes zoals volledige suite- of all-plugin Docker-matrices, expliciete release-/blocker-validatie of high-core performanceprofiling. Gebruik `beast` niet voor `pnpm check:changed`, gerichte tests, docs-only werk, gewone lint/typecheck, kleine E2E-repro's of triage van Blacksmith-uitval. Gebruik `--market on-demand` voor capaciteitsdiagnose, zodat churn op de Spot-markt niet in het signaal wordt gemengd.

`.crabbox.yaml` beheert provider-, synchronisatie- en GitHub Actions-hydratatiestandaarden voor owned-cloud-lanes. Het sluit lokale `.git` uit, zodat de gehydrateerde Actions-checkout zijn eigen externe Git-metadata behoudt in plaats van maintainer-lokale remotes en objectstores te synchroniseren, en het sluit lokale runtime-/buildartefacten uit die nooit mogen worden overgedragen. `.github/workflows/crabbox-hydrate.yml` beheert checkout, Node/pnpm-setup, `origin/main` fetch en de niet-geheime omgevingshandoff voor owned-cloud `crabbox run --id <cbx_id>`-opdrachten.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Ontwikkelingskanalen](/nl/install/development-channels)
