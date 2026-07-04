---
read_when:
    - Je moet begrijpen waarom een CI-taak wel of niet is uitgevoerd
    - Je debugt een falende GitHub Actions-controle
    - Je coördineert een releasevalidatierun of herhaling daarvan
    - Je wijzigt ClawSweeper-dispatch of het doorsturen van GitHub-activiteit
summary: CI-taakgrafiek, scope-gates, releaseparaplu’s en lokale commando-equivalenten
title: CI-pijplijn
x-i18n:
    generated_at: "2026-07-04T06:39:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e97c378598fadcbaef12e5f9abd1d99261dd4594ce88ce4aa3293af0744fc5a
    source_path: ci.md
    workflow: 16
---

OpenClaw CI draait bij elke push naar `main` en elke pull request. Canonieke
`main`-pushes gaan eerst door een toelatingsvenster van 90 seconden op hosted runners.
De bestaande `CI`-concurrencygroep annuleert die wachtende run wanneer er een nieuwere
commit binnenkomt, zodat opeenvolgende merges niet elk een volledige Blacksmith-
matrix registreren. Pull requests en handmatige dispatches slaan de wachttijd over. De `preflight`-job
classificeert daarna de diff en schakelt dure lanes uit wanneer alleen niet-gerelateerde
gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen bewust slimme
scoping en waaieren de volledige graaf uit voor release candidates en brede
validatie. Android-lanes blijven opt-in via `include_android`. Release-only
Plugin-dekking staat in de afzonderlijke [`Plugin Prerelease`](#plugin-prerelease)
workflow en draait alleen vanuit [`Full Release Validation`](#full-release-validation)
of een expliciete handmatige dispatch.

## Pipeline-overzicht

| Job                                | Doel                                                                                                      | Wanneer deze draait                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `preflight`                        | Detecteert docs-only wijzigingen, gewijzigde scopes, gewijzigde extensions en bouwt het CI-manifest       | Altijd bij niet-concept pushes en PR's               |
| `runner-admission`                 | Hosted debounce van 90 seconden voor canonieke `main`-pushes voordat Blacksmith-werk wordt geregistreerd | Elke CI-run; slaapt alleen bij canonieke `main`-pushes |
| `security-fast`                    | Detectie van private keys, audit van gewijzigde workflows via `zizmor` en audit van productie-lockfiles  | Altijd bij niet-concept pushes en PR's               |
| `check-dependencies`               | Productie-Knip-pass alleen voor dependencies plus de guard voor de ongebruikte-bestanden-allowlist       | Node-relevante wijzigingen                           |
| `build-artifacts`                  | Bouwt `dist/`, Control UI, built-CLI-smokechecks, ingebedde built-artifact-checks en herbruikbare artifacts | Node-relevante wijzigingen                         |
| `checks-fast-core`                 | Snelle Linux-correctheidslanes zoals bundled, protocol, QA Smoke CI en CI-routingchecks                  | Node-relevante wijzigingen                           |
| `checks-fast-contracts-plugins-*`  | Twee gesharde Plugin-contractchecks                                                                       | Node-relevante wijzigingen                           |
| `checks-fast-contracts-channels-*` | Twee gesharde kanaalcontractchecks                                                                        | Node-relevante wijzigingen                           |
| `checks-node-core-*`               | Core Node-testshards, met uitzondering van kanaal-, bundled-, contract- en extension-lanes               | Node-relevante wijzigingen                           |
| `check-*`                          | Gesharde equivalent van de lokale hoofdgate: productietypes, lint, guards, testtypes en strikte smoke    | Node-relevante wijzigingen                           |
| `check-additional-*`               | Architectuur, gesharde boundary/prompt-drift, extension-guards, package-boundary en runtimetopologie    | Node-relevante wijzigingen                           |
| `checks-node-compat-node22`        | Node 22-compatibiliteitsbuild en smoke-lane                                                               | Handmatige CI-dispatch voor releases                 |
| `check-docs`                       | Docs-formattering, lint en broken-link-checks                                                            | Docs gewijzigd                                       |
| `skills-python`                    | Ruff + pytest voor Python-backed Skills                                                                  | Python-skill-relevante wijzigingen                   |
| `checks-windows`                   | Windows-specifieke proces-/padtests plus gedeelde regressies voor runtime-importspecifiers              | Windows-relevante wijzigingen                        |
| `macos-node`                       | macOS TypeScript-testlane met de gedeelde gebouwde artifacts                                             | macOS-relevante wijzigingen                          |
| `macos-swift`                      | Swift-lint, build en tests voor de macOS-app                                                             | macOS-relevante wijzigingen                          |
| `ios-build`                        | Xcode-projectgeneratie plus de simulatorbuild van de iOS-app                                            | iOS-app, gedeelde app-kit of Swabble-wijzigingen     |
| `android`                          | Android-unittests voor beide smaken plus één debug-APK-build                                             | Android-relevante wijzigingen                        |
| `test-performance-agent`           | Dagelijkse Codex-optimalisatie van langzame tests na vertrouwde activiteit                              | Succesvolle main-CI of handmatige dispatch           |
| `openclaw-performance`             | Dagelijkse/on-demand Kova-runtimeprestatierapporten met mock-provider, deep-profile en GPT 5.5 live-lanes | Geplande en handmatige dispatch                     |

## Fail-fast-volgorde

1. `runner-admission` wacht alleen voor canonieke `main`-pushes; een nieuwere push annuleert de run voordat Blacksmith-registratie plaatsvindt.
2. `preflight` bepaalt welke lanes überhaupt bestaan. De `docs-scope`- en `changed-scope`-logica zijn stappen binnen deze job, geen zelfstandige jobs.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` en `skills-python` falen snel zonder te wachten op de zwaardere artifact- en platformmatrixjobs.
4. `build-artifacts` overlapt met de snelle Linux-lanes, zodat downstream consumers kunnen starten zodra de gedeelde build klaar is.
5. Zwaardere platform- en runtimelanes waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` en `android`.

GitHub kan vervangen jobs als `cancelled` markeren wanneer een nieuwere push op dezelfde PR- of `main`-ref binnenkomt. Behandel dat als CI-ruis, tenzij de nieuwste run voor dezelfde ref ook faalt. Matrixjobs gebruiken `fail-fast: false`, en `build-artifacts` rapporteert fouten in embedded channel, core-support-boundary en gateway-watch direct in plaats van kleine verifier-jobs in de wachtrij te zetten. De automatische CI-concurrencykey is geversioneerd (`CI-v7-*`), zodat een GitHub-side zombie in een oude queuegroep nieuwere main-runs niet onbeperkt kan blokkeren. Handmatige full-suite-runs gebruiken `CI-manual-v1-*` en annuleren lopende runs niet.

Gebruik `pnpm ci:timings`, `pnpm ci:timings:recent` of `node scripts/ci-run-timings.mjs <run-id>` om wall time, wachtrijtijd, traagste jobs, fouten en de `pnpm-store-warmup`-fanoutbarrière van GitHub Actions samen te vatten. CI uploadt dezelfde runsamenvatting ook als een `ci-timings-summary`-artifact. Controleer voor buildtiming de `Build dist`-stap van de `build-artifacts`-job: `pnpm build:ci-artifacts` print `[build-all] phase timings:` en bevat `ui:build`; de job uploadt ook het `startup-memory`-artifact.

Voor pull request-runs draait de terminale timing-summary-job de helper vanuit de vertrouwde base-revisie voordat `GH_TOKEN` wordt doorgegeven aan `gh run view`. Dat houdt de query met token buiten branch-controlled code, terwijl de huidige CI-run van de pull request nog steeds wordt samengevat.

## PR-context en bewijs

PR's van externe contributors draaien een PR-context- en bewijsgate vanuit
`.github/workflows/real-behavior-proof.yml`. De workflow checkt de vertrouwde
base-commit uit en evalueert alleen de PR-body; er wordt geen code uit de
contributor-branch uitgevoerd.

De gate geldt voor PR-auteurs die geen repository-eigenaren, leden,
collaborators of bots zijn. Deze slaagt wanneer de PR-body door de auteur geschreven
secties `What Problem This Solves` en `Evidence` bevat. Bewijs kan een gerichte
test, CI-resultaat, screenshot, opname, terminaluitvoer, live observatie,
geredigeerde log of artifact-link zijn. De body geeft intentie en nuttige validatie;
reviewers inspecteren de code, tests en CI om correctheid te beoordelen.

Wanneer de check faalt, werk dan de PR-body bij in plaats van nog een codecommit te pushen.

## Scope en routing

Scopelogica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unittests in `src/scripts/ci-changed-scope.test.ts`. Handmatige dispatch slaat changed-scope-detectie over en laat het preflight-manifest zich gedragen alsof elk scoped gebied is gewijzigd.

- **CI-workflowbewerkingen** valideren de Node CI-graaf plus workflowlinting, maar forceren op zichzelf geen Windows-, iOS-, Android- of macOS-native builds; die platformlanes blijven scoped naar platformbronwijzigingen.
- **Workflow Sanity** draait `actionlint`, `zizmor` over alle workflow-YAML-bestanden, de guard voor composite-action-interpolatie en de guard voor conflictmarkers. De PR-scoped `security-fast`-job draait ook `zizmor` over gewijzigde workflowbestanden, zodat workflowbeveiligingsbevindingen vroeg in de hoofd-CI-graaf falen.
- **Docs bij `main`-pushes** worden gecontroleerd door de zelfstandige `Docs`-workflow met dezelfde ClawHub-docsmirror die CI gebruikt, zodat gemengde code+docs-pushes niet ook de CI-`check-docs`-shard in de wachtrij zetten. Pull requests en handmatige CI draaien nog steeds `check-docs` vanuit CI wanneer docs zijn gewijzigd.
- **TUI PTY** draait in de Linux Node-shard `checks-node-core-runtime-tui-pty` voor TUI-wijzigingen. De shard draait `test/vitest/vitest.tui-pty.config.ts` met `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, zodat deze zowel de deterministische `TuiBackend`-fixturelane als de tragere `tui --local`-smoke dekt die alleen het externe modelendpoint mockt.
- **Alleen-CI-routing-bewerkingen, geselecteerde goedkope core-testfixture-bewerkingen en smalle Plugin-contracthelper-/test-routing-bewerkingen** gebruiken een snel Node-only manifestpad: `preflight`, security en één `checks-fast-core`-taak. Dat pad slaat build artifacts, Node 22-compatibiliteit, kanaalcontracten, volledige core-shards, bundled-Plugin-shards en aanvullende guard-matrices over wanneer de wijziging beperkt is tot de routing- of helperoppervlakken die de snelle taak direct oefent.
- **Windows Node-checks** zijn scoped naar Windows-specifieke proces-/padwrappers, npm/pnpm/UI-runnerhelpers, package-managerconfiguratie en de CI-workflowoppervlakken die die lane uitvoeren; niet-gerelateerde source-, Plugin-, install-smoke- en test-only wijzigingen blijven op de Linux Node-lanes.

De traagste Node-testfamilies zijn opgesplitst of gebalanceerd zodat elke job klein blijft zonder runners te ruim te reserveren: plugincontracten en kanaalcontracten draaien elk als twee gewogen Blacksmith-backed shards met de standaard GitHub-runnerfallback, core unit fast/support-lanes draaien afzonderlijk, core runtime-infra is opgesplitst tussen state, process/config, shared en drie cron-domeinshards, auto-reply draait als gebalanceerde workers (waarbij de reply-subtree is opgesplitst in agent-runner-, dispatch- en commands/state-routing-shards), en agentic gateway/server-configs zijn opgesplitst over chat/auth/model/http-plugin/runtime/startup-lanes in plaats van te wachten op gebouwde artefacten. Normale CI bundelt daarna alleen geisoleerde infra-include-pattern-shards in deterministische bundels van maximaal 64 testbestanden, waardoor de Node-matrix kleiner wordt zonder niet-geisoleerde command/cron-, stateful agents-core- of gateway/server-suites samen te voegen; zware vaste suites blijven op 8 vCPU, terwijl de gebundelde en lichtere lanes 4 vCPU gebruiken. Pull requests op de canonieke repository gebruiken een extra compact toelatingsplan: dezelfde per-config-groepen draaien in geisoleerde subprocessen binnen het huidige Linux Node-plan van 34 jobs, zodat een enkele PR niet de volledige Node-matrix van meer dan 70 jobs registreert. `main`-pushes, handmatige dispatches en releasegates behouden de volledige matrix. Brede browser-, QA-, media- en diverse Plugintests gebruiken hun eigen Vitest-configs in plaats van de gedeelde Plugin-catch-all. Include-pattern-shards registreren timingvermeldingen met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een volledige config kan onderscheiden van een gefilterde shard. `check-additional-*` houdt package-boundary compile/canary-werk bij elkaar en scheidt runtime-topologiearchitectuur van gateway-watch-dekking; de boundary-guard-lijst is gestreept in een prompt-zware shard en een gecombineerde shard voor de resterende guard-strepen, waarbij elke shard geselecteerde onafhankelijke guards gelijktijdig uitvoert en timings per check afdrukt. De dure Codex-happy-path prompt snapshot drift-check draait als eigen aanvullende job alleen voor handmatige CI en voor wijzigingen die prompts beinvloeden, zodat normale niet-gerelateerde Node-wijzigingen niet hoeven te wachten op koude prompt-snapshotgeneratie en de boundary-shards gebalanceerd blijven terwijl promptdrift nog steeds wordt vastgepind aan de PR die deze veroorzaakte; dezelfde flag slaat prompt snapshot Vitest-generatie over binnen de built-artifact core support-boundary-shard. Gateway watch, kanaaltests en de core support-boundary-shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd.

Na toelating staat canonieke Linux CI maximaal 24 gelijktijdige Node-testjobs toe en
12 voor de kleinere fast/check-lanes; Windows en Android blijven op twee omdat
die runnerpools smaller zijn.

Het compacte PR-plan emitteert 18 Node-jobs voor de huidige suite: whole-config
groepen worden gebatcht in geisoleerde subprocessen met een batch-time-out van 120 minuten,
terwijl include-pattern-groepen hetzelfde begrensde jobbudget delen.

Android CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play debug APK. De third-party-flavor heeft geen afzonderlijke sourceset of manifest; de unit-test-lane compileert de flavor nog steeds met de SMS/call-log BuildConfig-flags, terwijl een dubbele debug APK-packagingjob bij elke Android-relevante push wordt vermeden.

De `check-dependencies`-shard draait `pnpm deadcode:dependencies` (een productie-Knip-passage alleen voor dependencies, vastgepind op de nieuwste Knip-versie, met pnpm's minimale releaseleeftijd uitgeschakeld voor de `dlx`-installatie) en `pnpm deadcode:unused-files`, dat Knip's productiebevindingen voor ongebruikte bestanden vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. De unused-file-guard faalt wanneer een PR een nieuw niet-beoordeeld ongebruikt bestand toevoegt of een verouderde allowlist-vermelding laat staan, terwijl bewuste dynamische Plugin-, gegenereerde, build-, live-test- en package-bridge-oppervlakken behouden blijven die Knip niet statisch kan oplossen.

## ClawSweeper-activiteit doorsturen

`.github/workflows/clawsweeper-dispatch.yml` is de target-side bridge van OpenClaw-repositoryactiviteit naar ClawSweeper. Deze checkt geen onvertrouwde pull request-code uit en voert die niet uit. De workflow maakt een GitHub App-token uit `CLAWSWEEPER_APP_PRIVATE_KEY` en dispatcht daarna compacte `repository_dispatch`-payloads naar `openclaw/clawsweeper`.

De workflow heeft vier lanes:

- `clawsweeper_item` voor exacte reviewverzoeken voor issues en pull requests;
- `clawsweeper_comment` voor expliciete ClawSweeper-opdrachten in issuecomments;
- `clawsweeper_commit_review` voor reviewverzoeken op commitniveau bij `main`-pushes;
- `github_activity` voor algemene GitHub-activiteit die de ClawSweeper-agent kan inspecteren.

De `github_activity`-lane stuurt alleen genormaliseerde metadata door: eventtype, actie, actor, repository, itemnummer, URL, titel, status en korte fragmenten voor comments of reviews wanneer aanwezig. Deze vermijdt bewust het doorsturen van de volledige webhook-body. De ontvangende workflow in `openclaw/clawsweeper` is `.github/workflows/github-activity.yml`, die het genormaliseerde event post naar de OpenClaw Gateway-hook voor de ClawSweeper-agent.

Algemene activiteit is observatie, geen standaardlevering. De ClawSweeper-agent ontvangt het Discord-doel in zijn prompt en hoort alleen naar `#clawsweeper` te posten wanneer het event verrassend, actiegericht, riskant of operationeel nuttig is. Routinematig openen, bewerken, botruis, dubbele Webhook-ruis en normaal reviewverkeer zouden moeten resulteren in `NO_REPLY`.

Behandel GitHub-titels, comments, bodies, reviewtekst, branchnamen en commitberichten als onvertrouwde data in dit hele pad. Ze zijn invoer voor samenvatting en triage, geen instructies voor de workflow of agent-runtime.

## Handmatige dispatches

Handmatige CI-dispatches draaien dezelfde jobgraph als normale CI, maar forceren elke niet-Android scoped lane aan: Linux Node-shards, bundled-plugin-shards, Plugin- en kanaalcontractshards, Node 22-compatibiliteit, `check-*`, `check-additional-*`, built-artifact smokechecks, docs-checks, Python Skills, Windows, macOS, iOS-build en Control UI i18n. Zelfstandige handmatige CI-dispatches draaien Android alleen met `include_android=true`; de volledige releasekoepel schakelt Android in door `include_android=true` mee te geven. Statische prereleasechecks voor Plugins, de release-only `agentic-plugins`-shard, de volledige extension-batchsweep en Docker-lanes voor Plugin-prereleases zijn uitgesloten van CI. De Docker-prereleasesuite draait alleen wanneer `Full Release Validation` de afzonderlijke `Plugin Prerelease`-workflow dispatcht met de release-validation-gate ingeschakeld.

Handmatige runs gebruiken een unieke concurrency group zodat een volledige release-candidate-suite niet wordt geannuleerd door een andere push- of PR-run op dezelfde ref. Met de optionele `target_ref`-invoer kan een vertrouwde caller die graph draaien tegen een branch, tag of volledige commit-SHA terwijl het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                          | Jobs                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Handmatige CI-dispatch en fallbacks voor niet-canonieke repositories, CodeQL JavaScript/actions-kwaliteitsscans, workflow-sanity, labeler, auto-response, docs-workflows buiten CI en install-smoke-preflight zodat de Blacksmith-matrix eerder in de wachtrij kan komen                              |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, lichtere extension-shards, `checks-fast-core` behalve QA Smoke CI, Plugin-/kanaalcontractshards, de meeste gebundelde/lichtere Linux Node-shards, `check-guards`, `check-prod-types`, `check-test-types`, geselecteerde `check-additional-*`-shards en `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Behouden zware Linux Node-suites, boundary/extension-zware `check-additional-*`-shards en `android`                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` in CI en Testbox, `check-lint` (CPU-gevoelig genoeg dat 8 vCPU meer kostten dan ze bespaarden); install-smoke Docker-builds (32-vCPU wachtrijkosten kostten meer dan ze bespaarden)                                                                                      |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` op `openclaw/openclaw`; forks vallen terug op `macos-15`                                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` en `ios-build` op `openclaw/openclaw`; forks vallen terug op `macos-26`                                                                                                                                                                                                                   |

## Runnerregistratiebudget

OpenClaw's huidige GitHub runnerregistratiebucket rapporteert 10.000 self-hosted
runnerregistraties per 5 minuten in `ghx api rate_limit`. Controleer
`actions_runner_registration` opnieuw voor elke tuningronde, omdat GitHub deze
bucket kan wijzigen. De limiet wordt gedeeld door alle Blacksmith-runnerregistraties in de
`openclaw`-organisatie, dus het toevoegen van nog een Blacksmith-installatie voegt geen
nieuwe bucket toe.

Behandel Blacksmith-labels als de schaarse resource voor burstcontrole. Jobs die
alleen routeren, melden, samenvatten, shards selecteren of korte CodeQL-scans draaien, moeten
op GitHub-hosted runners blijven tenzij ze gemeten Blacksmith-specifieke
behoeften hebben. Elke nieuwe Blacksmith-matrix, grotere `max-parallel` of hoogfrequente
workflow moet zijn worst-case registratieaantal tonen en het org-level
doel onder ongeveer 60% van de live bucket houden. Met de huidige bucket van 10.000 registraties
betekent dat een operationeel doel van 6.000 registraties, met ruimte over voor
gelijktijdige repositories, retries en burst-overlap.

Canonieke-repo-CI houdt Blacksmith als het standaard runnerpad voor normale push- en pull-request-runs. `workflow_dispatch` en runs in niet-canonieke repositories gebruiken GitHub-hosted runners, maar normale canonieke runs peilen momenteel niet de gezondheid van de Blacksmith-wachtrij en vallen niet automatisch terug naar GitHub-hosted labels wanneer Blacksmith niet beschikbaar is.

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

Een handmatige start benchmarkt normaal gesproken de workflow-ref. Stel `target_ref` in om een releasetag of een andere branch met de huidige workflow-implementatie te benchmarken. Gepubliceerde rapportpaden en nieuwste verwijzingen worden per geteste ref vastgelegd, en elke `index.md` registreert de geteste ref/SHA, workflow-ref/SHA, Kova-ref, profiel, lane-authenticatiemodus, model, herhalingsaantal en scenariofilters.

De workflow installeert OCM vanaf een gepinde release en Kova vanuit `openclaw/Kova` op de gepinde `kova_ref`-invoer, en voert daarna drie lanes uit:

- `mock-provider`: Kova-diagnostische scenario's tegen een runtime uit een lokale build met deterministische nep-authenticatie die OpenAI-compatibel is.
- `mock-deep-profile`: CPU-/heap-/traceprofilering voor hotspots bij opstarten, Gateway en agent-turns.
- `live-openai-candidate`: een echte OpenAI-agent-turn met `openai/gpt-5.5`, overgeslagen wanneer `OPENAI_API_KEY` niet beschikbaar is.

De mock-provider-lane voert na de Kova-pass ook OpenClaw-native bronprobes uit: Gateway-opstarttijd en geheugen over standaard-, hook- en 50-Plugin-opstartgevallen; RSS van gebundelde Plugin-imports, herhaalde mock-OpenAI `channel-chat-baseline`-hello-loops, CLI-opstartcommando's tegen de opgestarte Gateway, en de SQLite-state-smoke-prestatieprobe. Wanneer het vorige gepubliceerde mock-provider-bronrapport beschikbaar is voor de geteste ref, vergelijkt de bronsamenvatting de huidige RSS- en heapwaarden met die baseline en markeert grote RSS-toenames als `watch`. De Markdown-samenvatting van de bronprobe staat op `source/index.md` in de rapportbundel, met de ruwe JSON ernaast.

Elke lane uploadt GitHub-artifacts. Wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd, commit de workflow ook `report.json`, `report.md`, bundels, `index.md` en bronprobe-artifacts naar `openclaw/clawgrit-reports` onder `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. De huidige tested-ref-verwijzing wordt geschreven als `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Volledige releasevalidatie

`Full Release Validation` is de handmatige overkoepelende workflow voor "alles uitvoeren vóór de release". Deze accepteert een branch, tag of volledige commit-SHA, start de handmatige `CI`-workflow met dat doel, start `Plugin Prerelease` voor release-only Plugin-/pakket-/static-/Docker-bewijs, en start `OpenClaw Release Checks` voor install-smoke, pakketacceptatie, cross-OS-pakketcontroles, rendering van de maturity-scorecard vanuit QA-profielbewijs, QA Lab-pariteit, Matrix- en Telegram-lanes. Stabiele en volledige profielen bevatten altijd uitputtende live/E2E- en Docker-releasepad-soakdekking; het bètaprofiel kan zich hiervoor aanmelden met `run_release_soak=true`. De canonieke pakket-Telegram-E2E draait binnen Package Acceptance, zodat een volledige kandidaat geen dubbele live-poller start. Geef na publicatie `release_package_spec` door om het uitgebrachte npm-pakket opnieuw te gebruiken in release checks, Package Acceptance, Docker, cross-OS en Telegram zonder opnieuw te bouwen. Gebruik `npm_telegram_package_spec` alleen voor een gerichte Telegram-herhaling met gepubliceerd pakket. De live pakket-lane van de Codex-Plugin gebruikt standaard dezelfde geselecteerde state: gepubliceerde `release_package_spec=openclaw@<tag>` leidt `codex_plugin_spec=npm:@openclaw/codex@<tag>` af, terwijl SHA-/artifact-runs `extensions/codex` packen vanuit de geselecteerde ref. Stel `codex_plugin_spec` expliciet in voor aangepaste Plugin-bronnen zoals `npm:`, `npm-pack:` of `git:`-specificaties.

Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de stage-matrix, exacte workflow-jobnamen, profielverschillen, artifacts en handvatten voor gerichte herhalingen.

`OpenClaw Release Publish` is de handmatige muterende release-workflow. Start deze vanuit `release/YYYY.M.PATCH` of `main` nadat de releasetag bestaat en nadat de OpenClaw npm-preflight is geslaagd. De workflow verifieert `pnpm plugins:sync:check`, start `Plugin NPM Release` voor alle publiceerbare Plugin-pakketten, start `Plugin ClawHub Release` voor dezelfde release-SHA, en start pas daarna `OpenClaw NPM Release` met de opgeslagen `preflight_run_id`. Stabiele publicatie vereist ook een exacte `windows_node_tag`; de workflow verifieert de Windows-bronrelease en vergelijkt de x64/ARM64-installers daarvan met de door de kandidaat goedgekeurde invoer `windows_node_installer_digests` vóór elke publish-child, en promoot en verifieert daarna diezelfde gepinde installer-digests plus het exacte companion-asset en checksum-contract voordat de GitHub-release-draft wordt gepubliceerd.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Gebruik voor bewijs van een gepinde commit op een snel bewegende branch de helper in plaats van `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-workflow-dispatch-refs moeten branches of tags zijn, geen ruwe commit-SHA's. De helper pusht een tijdelijke `release-ci/<sha>-...`-branch op de doel-SHA, start `Full Release Validation` vanaf die gepinde ref, verifieert dat elke child-workflow-`headSha` overeenkomt met het doel, en verwijdert de tijdelijke branch wanneer de run is voltooid. De overkoepelende verifier faalt ook als een child-workflow op een andere SHA draaide.

`release_profile` bepaalt de live/provider-breedte die aan release checks wordt doorgegeven. De handmatige release-workflows gebruiken standaard `stable`; gebruik `full` alleen wanneer je bewust de brede adviserende provider-/mediamatrix wilt. Stabiele en volledige release checks voeren altijd de uitputtende live/E2E- en Docker-releasepad-soak uit; het bètaprofiel kan zich hiervoor aanmelden met `run_release_soak=true`.

- `minimum` behoudt de snelste OpenAI-/core release-kritieke lanes.
- `stable` voegt de stabiele provider-/backendset toe.
- `full` voert de brede adviserende provider-/mediamatrix uit.

De overkoepelende workflow registreert de gestarte child-run-id's, en de laatste job `Verify full validation` controleert de actuele conclusies van child-runs opnieuw en voegt tabellen met langzaamste jobs toe voor elke child-run. Als een child-workflow opnieuw wordt uitgevoerd en groen wordt, voer dan alleen de parent-verifier-job opnieuw uit om het overkoepelende resultaat en de tijdssamenvatting te vernieuwen.

Voor herstel accepteren zowel `Full Release Validation` als `OpenClaw Release Checks` `rerun_group`. Gebruik `all` voor een releasekandidaat, `ci` alleen voor de normale volledige CI-child, `plugin-prerelease` alleen voor de Plugin-prerelease-child, `release-checks` voor elke release-child, of een smallere groep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` of `npm-telegram` op de overkoepelende workflow. Zo blijft het opnieuw uitvoeren van een mislukte releasebox begrensd na een gerichte fix. Combineer voor één mislukte cross-OS-lane `rerun_group=cross-os` met `cross_os_suite_filter`, bijvoorbeeld `windows/packaged-upgrade`; lange cross-OS-commando's geven Heartbeat-regels uit en packaged-upgrade-samenvattingen bevatten timings per fase. QA-release-check-lanes zijn adviserend, behalve de standaard runtime-tooldekkingsgate, die blokkeert wanneer vereiste dynamische OpenClaw-tools afwijken of verdwijnen uit de samenvatting van de standaardtier.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde ref één keer om te zetten naar een `release-package-under-test`-tarball, en geeft dat artifact daarna door aan cross-OS-controles en Package Acceptance, plus de live/E2E-releasepad-Docker-workflow wanneer soakdekking draait. Zo blijven de pakketbytes consistent tussen releaseboxen en wordt voorkomen dat dezelfde kandidaat in meerdere child-jobs opnieuw wordt gepackt. Voor de live lane van de Codex npm-Plugin geven release checks ofwel een overeenkomende gepubliceerde Plugin-specificatie door die is afgeleid van `release_package_spec`, ofwel de door de operator aangeleverde `codex_plugin_spec`, of laten ze de invoer leeg zodat het Docker-script de Codex-Plugin uit de geselecteerde checkout packt.

Dubbele `Full Release Validation`-runs voor `ref=main` en `rerun_group=all` vervangen de oudere overkoepelende run. De parent-monitor annuleert elke child-workflow die hij al heeft gestart wanneer de parent wordt geannuleerd, zodat nieuwere main-validatie niet achter een verouderde release-check-run van twee uur blijft staan. Validatie van releasebranches/-tags en gerichte rerun-groepen houden `cancel-in-progress: false`.

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
- gesplitste media-audio-/videofragmenten en provider-gefilterde muziekshards

Zo blijft dezelfde bestandsdekking behouden, terwijl trage live-providerfouten gemakkelijker opnieuw uit te voeren en te diagnosticeren zijn. De geaggregeerde shardnamen `native-live-extensions-o-z`, `native-live-extensions-media` en `native-live-extensions-media-music` blijven geldig voor handmatige eenmalige herhalingen.

De native live-media-shards draaien in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de workflow `Live Media Runner Image`. Die image installeert `ffmpeg` en `ffprobe` vooraf; mediajobs verifiëren alleen de binaries vóór de setup. Houd Docker-backed live-suites op normale Blacksmith-runners: containerjobs zijn de verkeerde plek om geneste Docker-tests te starten.

Docker-gesteunde live model-/backend-shards gebruiken een aparte gedeelde `ghcr.io/openclaw/openclaw-live-test:<sha>`-image per geselecteerde commit. De live releaseworkflow bouwt en pusht die image eenmalig, waarna de Docker live model-, provider-gesharde Gateway-, CLI-backend-, ACP bind- en Codex harness-shards draaien met `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker-shards dragen expliciete `timeout`-limieten op scriptniveau onder de workflowtaak-time-out, zodat een vastgelopen container of cleanup-pad snel faalt in plaats van het volledige budget voor releasecontroles te verbruiken. Als die shards de volledige source-Docker-target onafhankelijk opnieuw bouwen, is de releaserun verkeerd geconfigureerd en verspilt die wandkloktijd aan dubbele image-builds.

## Pakketacceptatie

Gebruik `Package Acceptance` wanneer de vraag is: "werkt dit installeerbare OpenClaw-pakket als product?" Dit verschilt van normale CI: normale CI valideert de source tree, terwijl pakketacceptatie één tarball valideert via dezelfde Docker E2E-harness die gebruikers na installatie of update gebruiken.

### Taken

1. `resolve_package` checkt `workflow_ref` uit, lost één pakketkandidaat op, schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het `package-under-test`-artifact en drukt de bron, workflow-ref, pakket-ref, versie, SHA-256 en profiel af in de GitHub-stapsamenvatting.
2. `docker_acceptance` roept `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt dat artifact, valideert de tarball-inventaris, bereidt package-digest Docker-images voor wanneer nodig, en draait de geselecteerde Docker-lanes tegen dat pakket in plaats van de workflow-checkout te packen. Wanneer een profiel meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het pakket en de gedeelde images eenmaal voor en splitst die lanes daarna uit als parallelle gerichte Docker-taken met unieke artifacts.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Dit draait wanneer `telegram_mode` niet `none` is en installeert hetzelfde `package-under-test`-artifact wanneer pakketacceptatie er een heeft opgelost; een zelfstandige Telegram-dispatch kan nog steeds een gepubliceerde npm-specificatie installeren.
4. `summary` laat de workflow falen als pakketresolutie, Docker-acceptatie of de optionele Telegram-lane is mislukt.

### Kandidaatbronnen

- `source=npm` accepteert alleen `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor gepubliceerde prerelease-/stabiele acceptatie.
- `source=ref` packt een vertrouwde `package_ref`-branch, tag of volledige commit-SHA. De resolver fetcht OpenClaw-branches/tags, verifieert dat de geselecteerde commit bereikbaar is vanuit repository-branchgeschiedenis of een releasetag, installeert dependencies in een detached worktree en packt die met `scripts/package-openclaw-for-docker.mjs`.
- `source=url` downloadt een publieke HTTPS-`.tgz`; `package_sha256` is verplicht. Dit pad weigert URL-credentials, niet-standaard HTTPS-poorten, private/interne/special-use hostnames of opgeloste IP's, en redirects buiten hetzelfde publieke veiligheidsbeleid.
- `source=trusted-url` downloadt een HTTPS-`.tgz` vanuit een benoemd trusted-source-beleid in `.github/package-trusted-sources.json`; `package_sha256` en `trusted_source_id` zijn verplicht. Gebruik dit alleen voor enterprise-mirrors in beheer van maintainers of private pakketrepositories die geconfigureerde hosts, poorten, padprefixes, redirect-hosts of private-netwerkresolutie nodig hebben. Als het beleid bearer-auth verklaart, gebruikt de workflow het vaste `OPENCLAW_TRUSTED_PACKAGE_TOKEN`-secret; in URL's ingesloten credentials worden nog steeds geweigerd.
- `source=artifact` downloadt één `.tgz` van `artifact_run_id` en `artifact_name`; `package_sha256` is optioneel, maar moet worden opgegeven voor extern gedeelde artifacts.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde workflow-/harnesscode die de test draait. `package_ref` is de source-commit die wordt gepackt wanneer `source=ref`. Hierdoor kan de huidige testharness oudere vertrouwde source-commits valideren zonder oude workflowlogica te draaien.

### Suiteprofielen

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — volledige Docker-releasepadchunks met OpenWebUI
- `custom` — exacte `docker_lanes`; verplicht wanneer `suite_profile=custom`

Het `package`-profiel gebruikt offline Plugin-dekking, zodat validatie van gepubliceerde pakketten niet afhankelijk is van live ClawHub-beschikbaarheid. De optionele Telegram-lane hergebruikt het `package-under-test`-artifact in `NPM Telegram Beta E2E`, terwijl het gepubliceerde npm-specificatiepad behouden blijft voor zelfstandige dispatches.

Voor het specifieke testbeleid voor updates en Plugins, inclusief lokale opdrachten,
Docker-lanes, invoer voor pakketacceptatie, release-standaarden en triage van fouten,
zie [Updates en Plugins testen](/nl/help/testing-updates-plugins).

Releasecontroles roepen pakketacceptatie aan met `source=artifact`, het voorbereide releasepakket-artifact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` en `telegram_mode=mock-openai`. Dit houdt pakketmigratie, update, live ClawHub-Skills-installatie, cleanup van verouderde Plugin-dependencies, installatiereparatie voor geconfigureerde Plugins, offline Plugin, Plugin-update en Telegram-bewijs op dezelfde opgeloste pakkettarball. Stel `release_package_spec` in op Volledige releasevalidatie of OpenClaw-releasecontroles na het publiceren van een bèta om dezelfde matrix tegen het verzonden npm-pakket te draaien zonder opnieuw te bouwen; stel `package_acceptance_package_spec` alleen in wanneer pakketacceptatie een ander pakket nodig heeft dan de rest van de releasevalidatie. Cross-OS-releasecontroles dekken nog steeds OS-specifieke onboarding, installer- en platformgedrag; productvalidatie voor pakketten/updates moet beginnen met pakketacceptatie. De `published-upgrade-survivor` Docker-lane valideert één gepubliceerde pakketbaseline per run in het blokkerende releasepad. In pakketacceptatie is de opgeloste `package-under-test`-tarball altijd de kandidaat en selecteert `published_upgrade_survivor_baseline` de fallback gepubliceerde baseline, standaard `openclaw@latest`; opdrachten om mislukte lanes opnieuw te draaien behouden die baseline. Volledige releasevalidatie met `run_release_soak=true` of `release_profile=full` stelt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` en `published_upgrade_survivor_scenarios=reported-issues` in om uit te breiden over de vier nieuwste stabiele npm-releases plus vastgepinde grensreleases voor Plugin-compatibiliteit en issue-vormige fixtures voor Feishu-configuratie, behouden bootstrap-/personabestanden, geconfigureerde OpenClaw Plugin-installaties, tilde-logpaden en verouderde legacy Plugin-dependencyroots. Selecties voor multi-baseline published-upgrade survivor worden per baseline geshard in aparte gerichte Docker-runner-taken. De aparte `Update Migration`-workflow gebruikt de `update-migration` Docker-lane met `all-since-2026.4.23` en `plugin-deps-cleanup` wanneer de vraag exhaustieve cleanup van gepubliceerde updates is, niet normale breedte voor volledige release-CI. Lokale aggregatieruns kunnen exacte pakketspecificaties doorgeven met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, één lane behouden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` zoals `openclaw@2026.4.15`, of `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` instellen voor de scenariomatrix. De gepubliceerde lane configureert de baseline met een ingebakken `openclaw config set`-opdrachtrecept, registreert receptstappen in `summary.json` en test `/healthz`, `/readyz` plus RPC-status na Gateway-start. De Windows packaged- en installer-fresh-lanes verifiëren ook dat een geïnstalleerd pakket een browser-control override kan importeren vanaf een rauw absoluut Windows-pad. De OpenAI cross-OS agent-turn smoke gebruikt standaard `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer ingesteld, anders `openai/gpt-5.5`, zodat het installatie- en Gateway-bewijs op een GPT-5-testmodel blijft en GPT-4.x-standaarden worden vermeden.

### Legacy-compatibiliteitsvensters

Pakketacceptatie heeft begrensde legacy-compatibiliteitsvensters voor al gepubliceerde pakketten. Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen het compatibiliteitspad gebruiken:

- bekende private QA-vermeldingen in `dist/postinstall-inventory.json` mogen wijzen naar bestanden die uit de tarball zijn weggelaten;
- `doctor-switch` mag de subcase voor persistentie van `gateway install --wrapper` overslaan wanneer het pakket die flag niet exposeert;
- `update-channel-switch` mag ontbrekende pnpm `patchedDependencies` uit de van de tarball afgeleide fake git-fixture verwijderen en mag ontbrekende gepersisteerde `update.channel` loggen;
- Plugin-smokes mogen legacy install-recordlocaties lezen of ontbrekende marketplace install-record-persistentie accepteren;
- `plugin-update` mag migratie van configuratiemetadata toestaan, terwijl nog steeds vereist blijft dat het install-record en no-reinstall-gedrag ongewijzigd blijven.

Het gepubliceerde `2026.4.26`-pakket mag ook waarschuwen voor lokale build-metadata-stempelbestanden die al waren verzonden. Latere pakketten moeten voldoen aan de moderne contracten; dezelfde voorwaarden falen in plaats van te waarschuwen of over te slaan.

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

Begin bij het debuggen van een mislukte pakketacceptatierun met de `resolve_package`-samenvatting om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de `docker_acceptance`-childrun en de Docker-artifacts daarvan: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logs, fasetimings en rerun-opdrachten. Geef de voorkeur aan het opnieuw draaien van het mislukte pakketprofiel of de exacte Docker-lanes in plaats van volledige releasevalidatie opnieuw te draaien.

## Installatiesmoke

De aparte `Install Smoke`-workflow hergebruikt hetzelfde scope-script via zijn eigen `preflight`-taak. Deze splitst smoke-dekking in `run_fast_install_smoke` en `run_full_install_smoke`.

- **Snel pad** wordt uitgevoerd voor pull requests die Docker-/pakketoppervlakken, wijzigingen in pakketten/manifests van gebundelde Plugins, of kernoppervlakken voor Plugins/channels/gateway/Plugin SDK raken die door de Docker-smokejobs worden geoefend. Wijzigingen alleen in broncode van gebundelde Plugins, edits alleen in tests en edits alleen in documentatie reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image eenmaal, controleert de CLI, voert de CLI-smoke voor het verwijderen van de gedeelde werkruimte van agents uit, voert de container-gateway-network-e2e uit, verifieert een build-argument voor een gebundelde extensie, en voert het begrensde Docker-profiel voor gebundelde Plugins uit onder een totale command-time-out van 240 seconden (waarbij elke Docker-run van een scenario afzonderlijk is begrensd).
- **Volledig pad** behoudt QR-pakketinstallatie en installer-Docker-/update-dekking voor nachtelijke geplande runs, handmatige dispatches, workflow-call-releasecontroles, en pull requests die werkelijk installer-/pakket-/Docker-oppervlakken raken. In volledige modus bereidt install-smoke één target-SHA GHCR-root-Dockerfile-smoke-image voor of hergebruikt deze, en voert daarna QR-pakketinstallatie, root-Dockerfile-/gateway-smokes, installer-/update-smokes en de snelle Docker-E2E voor gebundelde Plugins uit als afzonderlijke jobs, zodat installer-werk niet hoeft te wachten achter de root-image-smokes.

`main`-pushes (inclusief mergecommits) forceren het volledige pad niet; wanneer de logica voor gewijzigde scope volledige dekking op een push zou aanvragen, behoudt de workflow de snelle Docker-smoke en laat hij de volledige install-smoke over aan nachtelijke of releasevalidatie.

De trage Bun global-install image-provider-smoke wordt afzonderlijk bewaakt door `run_bun_global_install_smoke`. Deze draait volgens het nachtelijke schema en vanuit de releasechecks-workflow, en handmatige `Install Smoke`-dispatches kunnen ervoor kiezen deze in te schakelen, maar pull requests en `main`-pushes doen dat niet. Normale PR-CI voert nog steeds de snelle Bun-launcher-regressielane uit voor Node-relevante wijzigingen. QR- en installer-Docker-tests behouden hun eigen installatiegerichte Dockerfiles.

## Lokale Docker-E2E

`pnpm test:docker:all` prebuildt één gedeelde live-testimage, verpakt OpenClaw eenmaal als npm-tarball en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images:

- een kale Node/Git-runner voor installer-/update-/plugin-dependency-lanes;
- een functionele image die dezelfde tarball installeert in `/app` voor normale functionaliteitslanes.

Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en voert daarna lanes uit met `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Instelbare parameters

| Variabele                              | Standaard | Doel                                                                                          |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Aantal slots in de hoofdpool voor normale lanes.                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Aantal slots in de providergevoelige tailpool.                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limiet voor gelijktijdige live-lanes, zodat providers niet gaan throttlen.                    |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5         | Limiet voor gelijktijdige npm-installatielanes.                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limiet voor gelijktijdige multi-service-lanes.                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Spreiding tussen lane-starts om Docker-daemon-create-stormen te voorkomen; stel `0` in voor geen spreiding. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Fallback-time-out per lane (120 minuten); geselecteerde live-/taillanes gebruiken strakkere limieten. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset     | `1` print het schedulerplan zonder lanes uit te voeren.                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset     | Door komma's gescheiden exacte lanelijst; slaat cleanup-smoke over zodat agents één mislukte lane kunnen reproduceren. |

Een lane die zwaarder is dan zijn effectieve limiet kan nog steeds starten vanuit een lege pool en draait dan alleen totdat hij capaciteit vrijgeeft. De lokale aggregaatrun voert Docker-preflights uit, verwijdert verouderde OpenClaw-E2E-containers, geeft actieve-lane-status uit, bewaart lanetimings voor longest-first-volgorde, en stopt standaard met het plannen van nieuwe gepoolde lanes na de eerste fout.

### Herbruikbare live-/E2E-workflow

De herbruikbare live-/E2E-workflow vraagt `scripts/test-docker-all.mjs --plan-json` welke pakket-, imagekind-, live-image-, lane- en credentialdekking vereist is. `scripts/docker-e2e.mjs` zet dat plan daarna om naar GitHub-outputs en samenvattingen. Deze verpakt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een pakketartifact van de huidige run, of downloadt een pakketartifact uit `package_artifact_run_id`; valideert de tarball-inventaris; bouwt en pusht package-digest-getagde bare/functional GHCR Docker-E2E-images via Blacksmiths Docker layer cache wanneer het plan lanes met geïnstalleerde pakketten nodig heeft; en hergebruikt opgegeven `docker_e2e_bare_image`-/`docker_e2e_functional_image`-inputs of bestaande package-digest-images in plaats van opnieuw te bouwen. Pulls van Docker-images worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry-/cache-stream snel opnieuw probeert in plaats van het grootste deel van het kritieke CI-pad te verbruiken.

### Release-padchunks

Release-Docker-dekking draait kleinere gechunkte jobs met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elke chunk alleen het imagekind pullt dat hij nodig heeft en meerdere lanes uitvoert via dezelfde gewogen scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

De huidige release-Docker-chunks zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, en `plugins-runtime-install-a` tot en met `plugins-runtime-install-h`. `package-update-openai` bevat de live-lane voor het Codex Plugin-pakket, die het kandidaat-OpenClaw-pakket installeert, het Codex Plugin installeert vanuit `codex_plugin_spec` of een same-ref-tarball met expliciete installatiegoedkeuring voor de Codex CLI, Codex CLI-preflight uitvoert, en daarna meerdere OpenClaw-agentbeurten in dezelfde sessie tegen OpenAI uitvoert. `plugins-runtime-core`, `plugins-runtime` en `plugins-integrations` blijven aggregaataliassen voor Plugin/runtime. De `install-e2e`-lanealias blijft de aggregaatalias voor handmatige reruns voor beide provider-installerlanes.

OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige release-path-dekking daarom vraagt, en behoudt alleen een zelfstandige `openwebui`-chunk voor OpenWebUI-only-dispatches. Bundled-channel-updatelanes proberen eenmaal opnieuw bij tijdelijke npm-netwerkfouten.

Elke chunk uploadt `.artifacts/docker-tests/` met lanelogs, timings, `summary.json`, `failures.json`, fasetimings, schedulerplan-JSON, tabellen met trage lanes en rerun-commands per lane. De workflowinput `docker_lanes` voert geselecteerde lanes uit tegen de voorbereide images in plaats van de chunkjobs, waardoor debugging van mislukte lanes begrensd blijft tot één gerichte Docker-job en het pakketartifact voor die run wordt voorbereid, gedownload of hergebruikt; als een geselecteerde lane een live-Docker-lane is, bouwt de gerichte job de live-testimage lokaal voor die rerun. Gegenereerde GitHub-rerun-commands per lane bevatten `package_artifact_run_id`, `package_artifact_name` en voorbereide image-inputs wanneer die waarden bestaan, zodat een mislukte lane exact hetzelfde pakket en dezelfde images uit de mislukte run kan hergebruiken.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

De geplande live-/E2E-workflow voert dagelijks de volledige release-path-Docker-suite uit.

## Plugin Prerelease

`Plugin Prerelease` is duurdere product-/pakketdekking, dus het is een afzonderlijke workflow die wordt gedispatcht door `Full Release Validation` of door een expliciete operator. Normale pull requests, `main`-pushes en zelfstandige handmatige CI-dispatches houden die suite uitgeschakeld. De workflow verdeelt tests voor gebundelde Plugins over acht extensieworkers; die extensieshardjobs draaien maximaal twee Plugin-configuratiegroepen tegelijk met één Vitest-worker per groep en een grotere Node-heap, zodat importzware Plugin-batches geen extra CI-jobs aanmaken. Het release-only Docker-prereleasepad batcht gerichte Docker-lanes in kleine groepen om te voorkomen dat tientallen runners worden gereserveerd voor jobs van één tot drie minuten. De workflow uploadt ook een informatief `plugin-inspector-advisory`-artifact uit `@openclaw/plugin-inspector`; inspectorbevindingen zijn input voor triage en wijzigen de blokkerende Plugin Prerelease-gate niet.

## QA Lab

QA Lab heeft dedicated CI-lanes buiten de hoofdworkflow met slimme scope. Agentic parity is genest onder de brede QA- en releaseharnassen, niet als zelfstandige PR-workflow. Gebruik `Full Release Validation` met `rerun_group=qa-parity` wanneer parity mee moet lopen met een brede validatierun.

- De workflow `QA-Lab - All Lanes` draait 's nachts op `main` en bij handmatige dispatch; deze waaiert de mock-parity-lane, live Matrix-lane en live Telegram- en Discord-lanes uit als parallelle jobs. Live-jobs gebruiken de omgeving `qa-live-shared`, en Telegram/Discord gebruiken Convex-leases.

Releasechecks draaien Matrix- en Telegram-live-transportlanes met de deterministische mockprovider en mock-gekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het channelcontract geïsoleerd is van live-modellatentie en normale startup van provider-Plugins. De live-transport-Gateway schakelt memory search uit, omdat QA-parity geheugengedrag afzonderlijk dekt; providerconnectiviteit wordt gedekt door de afzonderlijke suites voor live modellen, native providers en Docker-providers.

Matrix gebruikt `--profile fast` voor geplande en releasegates, en voegt `--fail-fast` alleen toe wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaard en handmatige workflowinput blijven `all`; handmatige `matrix_profile=all`-dispatch shardt volledige Matrix-dekking altijd in jobs voor `transport`, `media`, `e2ee-smoke`, `e2ee-deep` en `e2ee-cli`.

`OpenClaw Release Checks` voert ook de releasekritieke QA Lab-lanes uit vóór releasegoedkeuring; de QA-parity-gate draait de kandidaat- en baselinepacks als parallelle lanejobs, en downloadt daarna beide artifacts naar een kleine reportjob voor de uiteindelijke parityvergelijking.

Volg voor normale PR's gescopete CI-/checkevidence in plaats van parity als verplichte status te behandelen.

## CodeQL

De workflow `CodeQL` is bewust een nauwe first-pass-beveiligingsscanner, niet de volledige repositoriesweep. Dagelijkse, handmatige en non-draft-pull-request-guardruns scannen Actions-workflowcode plus de JavaScript-/TypeScript-oppervlakken met het hoogste risico met high-confidence-beveiligingsqueries die zijn gefilterd op hoge/kritieke `security-severity`.

De pull-request-guard blijft licht: deze start alleen voor wijzigingen onder `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src`, of process-owning runtimepaden van gebundelde Plugins, en draait dezelfde high-confidence-beveiligingsmatrix als de geplande workflow. Android en macOS CodeQL blijven buiten de PR-standaarden.

### Beveiligingscategorieën

| Categorie                                        | Oppervlak                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, geheimen, sandbox, Cron en Gateway-baseline                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Core channel-implementatiecontracten plus de channel-Pluginruntime, Gateway, Plugin SDK, geheimen, audit-aanraakpunten             |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP-parsing, netwerkbewaking, web-fetch en Plugin SDK SSRF-beleidsoppervlakken                                           |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-servers, helpers voor procesuitvoering, uitgaande aflevering en poorten voor tooluitvoering door agenten                       |
| `/codeql-security-high/process-exec-boundary`     | Lokale shell, helpers voor het starten van processen, gebundelde Pluginruntimes die subprocessen beheren, en workflowscriptlijm     |
| `/codeql-security-high/plugin-trust-boundary`     | Plugininstallatie, loader, manifest, registry, package-manager-installatie, bronladen en vertrouwensoppervlakken voor het Plugin SDK-pakketcontract |

### Platformspecifieke beveiligingsshards

- `CodeQL Android Critical Security` — geplande Android-beveiligingsshard. Bouwt de Android-app handmatig voor CodeQL op de kleinste Blacksmith Linux-runner die door workflow-sanity wordt geaccepteerd. Uploadt onder `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — wekelijkse/handmatige macOS-beveiligingsshard. Bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert dependency-buildresultaten uit geüploade SARIF, en uploadt onder `/codeql-critical-security/macos`. Buiten de dagelijkse standaarden gehouden omdat de macOS-build de runtime domineert, zelfs wanneer die schoon is.

### Kritieke kwaliteitscategorieën

`CodeQL Critical Quality` is de bijbehorende niet-beveiligingsshard. Deze voert alleen JavaScript/TypeScript-kwaliteitsquery's met foutseverity en zonder beveiligingsscope uit over smalle oppervlakken met hoge waarde op GitHub-hosted Linux-runners, zodat kwaliteitsscans geen Blacksmith runner-registratiebudget besteden. De pull request-guard is bewust kleiner dan het geplande profiel: niet-draft-PR's voeren alleen de bijpassende shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` en `plugin-sdk-reply-runtime` uit voor wijzigingen in agent-command/model/tool-uitvoering en reply-dispatchcode, configschema/migratie/IO-code, auth/geheimen/sandbox/beveiligingscode, core channel en gebundelde channel-Pluginruntime, Gateway-protocol/servermethode, memory-runtime/SDK-lijm, MCP/proces/uitgaande aflevering, provider-runtime/modelcatalogus, sessiediagnostiek/afleverqueues, Pluginloader, Plugin SDK/package-contract, of Plugin SDK reply-runtime. Wijzigingen in CodeQL-config en kwaliteitsworkflow voeren alle twaalf PR-kwaliteitsshards uit.

Handmatige dispatch accepteert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

De smalle profielen zijn onderwijs-/iteratiehaken om één kwaliteitsshard geïsoleerd uit te voeren.

| Categorie                                              | Oppervlak                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, geheimen, sandbox, Cron en code voor de Gateway-beveiligingsgrens                                                                                           |
| `/codeql-critical-quality/config-boundary`              | Configschema, migratie, normalisatie en IO-contracten                                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-protocolschema's en servermethodecontracten                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementatiecontracten voor core channel en gebundelde channel-Plugin                                                                                            |
| `/codeql-critical-quality/agent-runtime-boundary`       | Commanduitvoering, model/provider-dispatch, auto-reply-dispatch en queues, en ACP-control-plane-runtimecontracten                                                 |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-servers en toolbridges, helpers voor procestoezicht, en contracten voor uitgaande aflevering                                                                  |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host-SDK, memory-runtimefacades, memory Plugin SDK-aliassen, memory-runtime-activeringslijm en memory doctor-commands                                      |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interne replyqueue, sessie-afleverqueues, helpers voor uitgaande sessiebinding/-aflevering, oppervlakken voor diagnostische events/logbundels en sessie doctor-CLI-contracten |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply-dispatch, helpers voor reply-payload/chunking/runtime, channel reply-opties, afleverqueues en helpers voor sessie-/threadbinding         |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisatie van modelcatalogus, provider-auth en discovery, provider-runtime-registratie, provider-standaarden/catalogi en web/search/fetch/embedding-registries |
| `/codeql-critical-quality/ui-control-plane`             | Control UI-bootstrap, lokale persistentie, Gateway-controlflows en runtimecontracten voor de task-control-plane                                                    |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search, media-IO, mediabegrip, image-generation en media-generation-runtimecontracten                                                              |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, registry-, public-surface- en Plugin SDK-entrypointcontracten                                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Gepubliceerde pakket-side Plugin SDK-bron en helpers voor Pluginpakketcontracten                                                                                  |

Kwaliteit blijft gescheiden van beveiliging, zodat kwaliteitsbevindingen kunnen worden gepland, gemeten, uitgeschakeld of uitgebreid zonder het beveiligingssignaal te vertroebelen. Uitbreiding van Swift-, Python- en gebundelde-Plugin-CodeQL moet alleen als gescoord of geshard vervolgwerk worden teruggebracht nadat de smalle profielen stabiele runtime en stabiel signaal hebben.

## Onderhoudsworkflows

### Docs Agent

De `Docs Agent`-workflow is een eventgedreven Codex-onderhoudslane om bestaande docs afgestemd te houden op recent gelande wijzigingen. Er is geen puur schema: een succesvolle niet-bot push-CI-run op `main` kan deze triggeren, en handmatige dispatch kan deze direct uitvoeren. Workflow-run-invocaties slaan over wanneer `main` intussen is opgeschoven of wanneer in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is aangemaakt. Wanneer de workflow draait, beoordeelt deze de commitreeks vanaf de vorige niet-overgeslagen Docs Agent-bron-SHA tot de huidige `main`, zodat één uurlijkse run alle main-wijzigingen kan dekken die sinds de laatste docspass zijn verzameld.

### Test Performance Agent

De `Test Performance Agent`-workflow is een eventgedreven Codex-onderhoudslane voor trage tests. Er is geen puur schema: een succesvolle niet-bot push-CI-run op `main` kan deze triggeren, maar de workflow slaat over als een andere workflow-run-invocatie die UTC-dag al heeft gedraaid of draait. Handmatige dispatch omzeilt die dagelijkse activiteitspoort. De lane bouwt een gegroepeerd Vitest-prestatierapport voor de volledige suite, laat Codex alleen kleine coverage-behoudende testprestatieoplossingen maken in plaats van brede refactors, voert daarna het volledige-suiterapport opnieuw uit en wijst wijzigingen af die het aantal geslaagde baseline-tests verlagen. Het gegroepeerde rapport registreert per-config wall time en max RSS op Linux en macOS, zodat de voor/na-vergelijking testgeheugendelta's naast duurdelta's zichtbaar maakt. Als de baseline falende tests heeft, mag Codex alleen duidelijke fouten oplossen en moet het na-agent volledige-suiterapport slagen voordat er iets wordt gecommit. Wanneer `main` vooruitgaat voordat de bot-push landt, rebaset de lane de gevalideerde patch, voert `pnpm check:changed` opnieuw uit en probeert de push opnieuw; conflicterende verouderde patches worden overgeslagen. De workflow gebruikt GitHub-hosted Ubuntu zodat de Codex-action dezelfde drop-sudo-veiligheidshouding kan behouden als de docs-agent.

### Dubbele PR's na merge

De `Duplicate PRs After Merge`-workflow is een handmatige maintainer-workflow voor opruiming van duplicaten na landing. Deze staat standaard op dry-run en sluit alleen expliciet vermelde PR's wanneer `apply=true`. Voordat GitHub wordt gemuteerd, verifieert deze dat de gelande PR is gemerged en dat elk duplicaat ofwel een gedeeld gerefereerd issue heeft, of overlappende gewijzigde hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale checkpoorten en changed-routering

Lokale changed-lane-logica staat in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale checkpoort is strenger over architectuurgrenzen dan de brede scope van het CI-platform:

- core-productiewijzigingen voeren core prod- en core test-typecheck plus core lint/guards uit;
- core test-only-wijzigingen voeren alleen core test-typecheck plus core lint uit;
- extensieproductiewijzigingen voeren extensie prod- en extensie test-typecheck plus extensie lint uit;
- extensie test-only-wijzigingen voeren extensie test-typecheck plus extensie lint uit;
- publieke Plugin SDK- of plugin-contractwijzigingen breiden uit naar extensietypecheck omdat extensies van die core-contracten afhangen (Vitest-extensiesweeps blijven expliciet testwerk);
- version bumps die alleen releasemetadata raken voeren gerichte versie-/config-/root-dependency-checks uit;
- onbekende root-/configwijzigingen falen veilig naar alle checklanes.

Lokale changed-test-routering staat in `scripts/test-projects.test-support.mjs` en is bewust goedkoper dan `check:changed`: directe testwijzigingen draaien zichzelf, bronwijzigingen geven de voorkeur aan expliciete mappings, daarna sibling-tests en importgraph-afhankelijken. Gedeelde deliveryconfig voor groepsruimten is een van de expliciete mappings: wijzigingen aan de groepszichtbare-replyconfig, source reply delivery mode of de message-tool-systemprompt routeren via de core reply-tests plus Discord- en Slack-deliveryregressies, zodat een gedeelde standaardwijziging faalt vóór de eerste PR-push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging harness-breed genoeg is dat de goedkope gemapte set geen betrouwbare proxy is.

## Testbox-validatie

Crabbox is de door de repo beheerde remote-box-wrapper voor maintainer-Linux-bewijs. Gebruik deze
vanuit de repo-root wanneer een controle te breed is voor een lokale edit-loop, wanneer CI-
pariteit belangrijk is, of wanneer het bewijs secrets, Docker, package-lanes,
herbruikbare boxes of externe logs nodig heeft. De normale OpenClaw-backend is
`blacksmith-testbox`; beheerde AWS/Hetzner-capaciteit is een fallback voor Blacksmith-
storingen, quotaproblemen of expliciete tests met beheerde capaciteit.

Door Crabbox ondersteunde Blacksmith-runs warmen one-shot Testboxes op, claimen,
synchroniseren, voeren uit, rapporteren en ruimen ze op. De ingebouwde sync-sanitycheck faalt snel wanneer vereiste
rootbestanden zoals `pnpm-lock.yaml` verdwijnen of wanneer `git status --short`
minstens 200 getrackte verwijderingen toont. Stel voor opzettelijke PR's met veel verwijderingen
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor de externe opdracht.

Crabbox beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de
sync-fase blijft zonder output na de sync. Stel
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` in om die guard uit te schakelen, of gebruik een grotere
millisecondewaarde voor ongebruikelijk grote lokale diffs.

Controleer de wrapper vóór een eerste run vanuit de repo-root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

De repo-wrapper weigert een verouderde Crabbox-binary die `blacksmith-testbox` niet adverteert. Geef de provider expliciet door, ook al heeft `.crabbox.yaml` owned-cloud-standaarden. Vermijd in Codex-worktrees of gelinkte/sparse checkouts het lokale `pnpm crabbox:run`-script, omdat pnpm dependencies kan reconciliëren voordat Crabbox start; roep in plaats daarvan de node-wrapper direct aan:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Door Blacksmith ondersteunde runs vereisen Crabbox 0.22.0 of nieuwer, zodat de wrapper het huidige Testbox-sync-, queue- en cleanup-gedrag krijgt. Bouw bij gebruik van de sibling-checkout de genegeerde lokale binary opnieuw vóór timing- of bewijswerk:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

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
  "corepack pnpm check:changed"
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

Lees de uiteindelijke JSON-samenvatting. De nuttige velden zijn `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` en `totalMs`. Voor gedelegeerde
Blacksmith Testbox-runs zijn de exitcode van de Crabbox-wrapper en de JSON-samenvatting het
opdrachtresultaat. De gelinkte GitHub Actions-run is eigenaar van hydration en keepalive; deze
kan eindigen als `cancelled` wanneer de Testbox extern is gestopt nadat de SSH-
opdracht al is teruggekeerd. Behandel dat als een cleanup-/statusartefact, tenzij
de wrapper-`exitCode` niet nul is of de opdrachtoutput een mislukte test toont.
One-shot door Blacksmith ondersteunde Crabbox-runs zouden de Testbox automatisch moeten stoppen;
als een run wordt onderbroken of cleanup onduidelijk is, inspecteer live boxes en stop alleen
de boxes die je hebt gemaakt:

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

Als Crabbox de kapotte laag is maar Blacksmith zelf werkt, gebruik directe
Blacksmith dan alleen voor diagnostiek zoals `list`, `status` en cleanup. Herstel het
Crabbox-pad voordat je een directe Blacksmith-run als maintainer-bewijs behandelt.

Als `blacksmith testbox list --all` en `blacksmith testbox status` werken maar nieuwe
warmups na een paar minuten `queued` blijven zonder IP of Actions-run-URL,
behandel dit dan als druk door de Blacksmith-provider, queue, billing of org-limiet. Stop de
queued ids die je hebt gemaakt, start geen extra Testboxes en verplaats het bewijs naar het
beheerde Crabbox-capaciteitspad hieronder terwijl iemand het Blacksmith-dashboard,
billing en org-limieten controleert.

Escaleren naar beheerde Crabbox-capaciteit doe je alleen wanneer Blacksmith down is, quotabeperkt is, de benodigde omgeving mist, of beheerde capaciteit expliciet het doel is:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Vermijd onder AWS-druk `class=beast`, tenzij de taak echt CPU van 48xlarge-klasse nodig heeft. Een `beast`-aanvraag start bij 192 vCPU's en is de makkelijkste manier om regionale EC2 Spot- of On-Demand Standard-quota te raken. De door de repo beheerde `.crabbox.yaml` gebruikt standaard `standard`, meerdere capaciteitsregio's en `capacity.hints: true`, zodat gebrokerde AWS-leases de geselecteerde regio/markt, quotadruk, Spot-fallback en waarschuwingen voor klassen met hoge druk afdrukken. Gebruik `fast` voor zwaardere brede controles, `large` alleen nadat standard/fast niet genoeg zijn, en `beast` alleen voor uitzonderlijke CPU-gebonden lanes zoals full-suite- of all-plugin Docker-matrices, expliciete release-/blocker-validatie of performanceprofiling met veel cores. Gebruik `beast` niet voor `pnpm check:changed`, gerichte tests, docs-only werk, gewone lint/typecheck, kleine E2E-reproducties of triage van Blacksmith-storingen. Gebruik `--market on-demand` voor capaciteitsdiagnose, zodat Spot-marktfluctuaties niet in het signaal worden gemengd.

`.crabbox.yaml` is eigenaar van provider-, sync- en GitHub Actions-hydration-standaarden voor owned-cloud-lanes. Het sluit lokale `.git` uit, zodat de gehydrateerde Actions-checkout zijn eigen externe Git-metadata behoudt in plaats van maintainer-lokale remotes en objectstores te synchroniseren, en het sluit lokale runtime-/buildartefacten uit die nooit mogen worden overgedragen. `.github/workflows/crabbox-hydrate.yml` is eigenaar van checkout, Node/pnpm-setup, `origin/main`-fetch en de niet-geheime environment-handoff voor owned-cloud-`crabbox run --id <cbx_id>`-opdrachten.

## Gerelateerd

- [Installatie-overzicht](/nl/install)
- [Ontwikkelkanalen](/nl/install/development-channels)
