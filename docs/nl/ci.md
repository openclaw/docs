---
read_when:
    - Je moet begrijpen waarom een CI-job wel of niet is uitgevoerd
    - Je debugt een falende GitHub Actions-controle
    - Je coördineert een releasevalidatierun of herhaling daarvan
    - Je wijzigt ClawSweeper-dispatch of het doorsturen van GitHub-activiteit
summary: CI-taakgrafiek, scopepoorten, releaseparaplu's en lokale opdrachtequivalenten
title: CI-pipeline
x-i18n:
    generated_at: "2026-06-30T14:09:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 885202dd0f52b237e93a520999ac98ef3ad0fc1f8a03ccaceae9d38a2a4aca3b
    source_path: ci.md
    workflow: 16
---

OpenClaw CI draait bij elke push naar `main` en bij elke pull request. Canonieke
`main`-pushes gaan eerst door een toelatingsvenster van 90 seconden op een hosted runner.
De bestaande `CI`-concurrencygroep annuleert die wachtende run wanneer er een nieuwere
commit binnenkomt, zodat opeenvolgende merges niet elk een volledige Blacksmith-
matrix registreren. Pull requests en handmatige dispatches slaan de wachttijd over. De `preflight`-job
classificeert daarna de diff en schakelt dure lanes uit wanneer alleen niet-gerelateerde
gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen smart
scoping bewust en waaieren uit naar de volledige graaf voor release candidates en brede
validatie. Android-lanes blijven opt-in via `include_android`. Release-only
Plugin-dekking staat in de afzonderlijke [`Plugin Prerelease`](#plugin-prerelease)
workflow en draait alleen vanuit [`Full Release Validation`](#full-release-validation)
of een expliciete handmatige dispatch.

## Pipeline-overzicht

| Job                                | Doel                                                                                                      | Wanneer deze draait                                 |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Detecteert docs-only wijzigingen, gewijzigde scopes, gewijzigde extensies en bouwt het CI-manifest        | Altijd bij niet-draft pushes en PR's                |
| `runner-admission`                 | Hosted debounce van 90 seconden voor canonieke `main`-pushes voordat Blacksmith-werk wordt geregistreerd  | Elke CI-run; slaapt alleen bij canonieke `main`-pushes |
| `security-fast`                    | Detectie van privésleutels, audit van gewijzigde workflows via `zizmor` en audit van productie-lockfiles  | Altijd bij niet-draft pushes en PR's                |
| `check-dependencies`               | Productie-Knip dependency-only pass plus de allowlist-guard voor ongebruikte bestanden                    | Node-relevante wijzigingen                          |
| `build-artifacts`                  | Bouwt `dist/`, Control UI, built-CLI smokechecks, controles op ingebedde buildartefacten en herbruikbare artefacten | Node-relevante wijzigingen                          |
| `checks-fast-core`                 | Snelle Linux-correctheidslanes zoals bundled, protocol, QA Smoke CI en CI-routeringschecks                | Node-relevante wijzigingen                          |
| `checks-fast-contracts-plugins-*`  | Twee gesharde Plugin-contractchecks                                                                       | Node-relevante wijzigingen                          |
| `checks-fast-contracts-channels-*` | Twee gesharde kanaalcontractchecks                                                                        | Node-relevante wijzigingen                          |
| `checks-node-core-*`               | Core Node-testshards, met uitzondering van kanaal-, bundled-, contract- en extensielanes                  | Node-relevante wijzigingen                          |
| `check-*`                          | Geshaarde equivalent van de lokale hoofdgate: productietypen, lint, guards, testtypen en strikte smoke    | Node-relevante wijzigingen                          |
| `check-additional-*`               | Architectuur, gesharde boundary-/promptdrift, extensieguards, package boundary en runtime-topologie       | Node-relevante wijzigingen                          |
| `checks-node-compat-node22`        | Node 22-compatibiliteitsbuild en smoke-lane                                                               | Handmatige CI-dispatch voor releases                |
| `check-docs`                       | Docs-formatting, lint en controles op kapotte links                                                       | Docs gewijzigd                                      |
| `skills-python`                    | Ruff + pytest voor Python-backed Skills                                                                   | Python-skill-relevante wijzigingen                  |
| `checks-windows`                   | Windows-specifieke proces-/padtests plus gedeelde regressies voor runtime-importspecificaties             | Windows-relevante wijzigingen                       |
| `macos-node`                       | macOS TypeScript-testlane met de gedeelde buildartefacten                                                 | macOS-relevante wijzigingen                         |
| `macos-swift`                      | Swift-lint, build en tests voor de macOS-app                                                              | macOS-relevante wijzigingen                         |
| `ios-build`                        | Generatie van het Xcode-project plus simulatorbuild van de iOS-app                                        | iOS-app, gedeelde app-kit of Swabble-wijzigingen    |
| `android`                          | Android-unittests voor beide smaken plus één debug-APK-build                                              | Android-relevante wijzigingen                       |
| `test-performance-agent`           | Dagelijkse Codex-optimalisatie van trage tests na vertrouwde activiteit                                   | Main-CI-succes of handmatige dispatch               |
| `openclaw-performance`             | Dagelijkse/op-aanvraag Kova-runtimeprestatierapporten met mock-provider, deep-profile en GPT 5.5 live-lanes | Geplande en handmatige dispatch                     |

## Fail-fast-volgorde

1. `runner-admission` wacht alleen op canonieke `main`-pushes; een nieuwere push annuleert de run vóór Blacksmith-registratie.
2. `preflight` beslist welke lanes überhaupt bestaan. De `docs-scope`- en `changed-scope`-logica zijn stappen binnen deze job, geen zelfstandige jobs.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` en `skills-python` falen snel zonder te wachten op de zwaardere artefact- en platformmatrixjobs.
4. `build-artifacts` overlapt met de snelle Linux-lanes, zodat downstream consumers kunnen starten zodra de gedeelde build klaar is.
5. Zwaardere platform- en runtimelanes waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` en `android`.

GitHub kan achterhaalde jobs als `cancelled` markeren wanneer een nieuwere push op dezelfde PR- of `main`-ref binnenkomt. Behandel dat als CI-ruis tenzij de nieuwste run voor dezelfde ref ook faalt. Matrixjobs gebruiken `fail-fast: false`, en `build-artifacts` rapporteert embedded channel-, core-support-boundary- en gateway-watch-fouten rechtstreeks in plaats van kleine verifier-jobs in de wachtrij te zetten. De automatische CI-concurrency key is geversioneerd (`CI-v7-*`), zodat een GitHub-side zombie in een oude wachtrijgroep nieuwere main-runs niet onbeperkt kan blokkeren. Handmatige full-suite-runs gebruiken `CI-manual-v1-*` en annuleren lopende runs niet.

Gebruik `pnpm ci:timings`, `pnpm ci:timings:recent` of `node scripts/ci-run-timings.mjs <run-id>` om wall time, wachtrijtijd, traagste jobs, fouten en de `pnpm-store-warmup` fanoutbarrière uit GitHub Actions samen te vatten. CI uploadt dezelfde runsamenvatting ook als een `ci-timings-summary`-artefact. Controleer voor buildtiming de stap `Build dist` van de job `build-artifacts`: `pnpm build:ci-artifacts` print `[build-all] phase timings:` en bevat `ui:build`; de job uploadt ook het `startup-memory`-artefact.

Voor pull request-runs voert de terminale timing-summary-job de helper uit vanuit de vertrouwde base-revisie voordat `GH_TOKEN` aan `gh run view` wordt doorgegeven. Zo blijft de query met token buiten branch-controlled code, terwijl de huidige CI-run van de pull request toch wordt samengevat.

## PR-context en bewijs

PR's van externe contributors draaien een PR-context- en evidence-gate vanuit
`.github/workflows/real-behavior-proof.yml`. De workflow checkt de vertrouwde
base-commit uit en evalueert alleen de PR-body; er wordt geen code uit de
contributor-branch uitgevoerd.

De gate geldt voor PR-auteurs die geen repository owners, members,
collaborators of bots zijn. Deze slaagt wanneer de PR-body authored
secties `What Problem This Solves` en `Evidence` bevat. Bewijs kan een gerichte
test, CI-resultaat, screenshot, opname, terminaluitvoer, live observatie,
geredigeerd log of artefactlink zijn. De body biedt intentie en nuttige validatie;
reviewers inspecteren de code, tests en CI om correctheid te beoordelen.

Wanneer de check faalt, werk dan de PR-body bij in plaats van nog een codecommit te pushen.

## Scope en routering

Scope-logica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unittests in `src/scripts/ci-changed-scope.test.ts`. Handmatige dispatch slaat changed-scope-detectie over en laat het preflight-manifest doen alsof elk scoped gebied is gewijzigd.

- **CI-workflowbewerkingen** valideren de Node CI-graaf plus workflow-linting, maar forceren op zichzelf geen Windows-, iOS-, Android- of macOS-native builds; die platformlanes blijven gescoped op wijzigingen in platformbroncode.
- **Workflow Sanity** draait `actionlint`, `zizmor` over alle workflow-YAML-bestanden, de composite-action interpolation guard en de conflict-marker guard. De PR-gescopete job `security-fast` draait ook `zizmor` over gewijzigde workflowbestanden, zodat workflow-securitybevindingen vroeg falen in de hoofd-CI-graaf.
- **Docs bij `main`-pushes** worden gecontroleerd door de zelfstandige `Docs`-workflow met dezelfde ClawHub-docs mirror die CI gebruikt, zodat gemengde code+docs-pushes niet ook de CI-shard `check-docs` in de wachtrij zetten. Pull requests en handmatige CI draaien nog steeds `check-docs` vanuit CI wanneer docs zijn gewijzigd.
- **TUI PTY** draait in de Linux Node-shard `checks-node-core-runtime-tui-pty` voor TUI-wijzigingen. De shard draait `test/vitest/vitest.tui-pty.config.ts` met `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, zodat deze zowel de deterministische `TuiBackend` fixture-lane dekt als de tragere `tui --local` smoke die alleen het externe modelendpoint mockt.
- **Alleen-CI-routeringsbewerkingen, geselecteerde goedkope core-testfixture-bewerkingen en smalle Plugin-contracthelper-/testrouteringsbewerkingen** gebruiken een snel Node-only manifestpad: `preflight`, security en één taak `checks-fast-core`. Dat pad slaat buildartefacten, Node 22-compatibiliteit, kanaalcontracten, volledige core-shards, bundled-Plugin-shards en aanvullende guard-matrices over wanneer de wijziging beperkt is tot de routerings- of helperoppervlakken die de snelle taak rechtstreeks oefent.
- **Windows Node-controles** zijn gescoped op Windows-specifieke proces-/padwrappers, npm/pnpm/UI-runnerhelpers, package manager-config en de CI-workflowoppervlakken die die lane uitvoeren; niet-gerelateerde broncode-, Plugin-, install-smoke- en test-only wijzigingen blijven op de Linux Node-lanes.

De langzaamste Node-testfamilies zijn gesplitst of gebalanceerd zodat elke job klein blijft zonder runners te veel te reserveren: plugincontracten en kanaalcontracten draaien elk als twee gewogen Blacksmith-ondersteunde shards met de standaard GitHub-runnerfallback, core-unit fast/support-lanes draaien afzonderlijk, core-runtime-infra is gesplitst tussen state, process/config, shared en drie cron-domeinshards, auto-reply draait als gebalanceerde workers (waarbij de reply-subtree is gesplitst in agent-runner-, dispatch- en commands/state-routing-shards), en agentic Gateway/server-configs zijn gesplitst over chat/auth/model/http-plugin/runtime/startup-lanes in plaats van te wachten op gebouwde artefacten. Normale CI verpakt daarna alleen geisoleerde infra-include-pattern-shards in deterministische bundels van maximaal 64 testbestanden, waardoor de Node-matrix kleiner wordt zonder niet-geisoleerde command/cron-, stateful agents-core- of gateway/server-suites samen te voegen; zware vaste suites blijven op 8 vCPU, terwijl de gebundelde en lager gewogen lanes 4 vCPU gebruiken. Pull requests op de canonieke repository gebruiken een aanvullend compact toelatingsplan: dezelfde groepen per config draaien in geisoleerde subprocessen binnen het huidige Linux Node-plan van 34 jobs, zodat een enkele PR niet de volledige Node-matrix van meer dan 70 jobs registreert. `main`-pushes, handmatige dispatches en release-gates behouden de volledige matrix. Brede browser-, QA-, media- en diverse plugintests gebruiken hun eigen Vitest-configs in plaats van de gedeelde plugin-catch-all. Include-pattern-shards registreren timingitems met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een volledige config kan onderscheiden van een gefilterde shard. `check-additional-*` houdt package-boundary compile/canary-werk bij elkaar en scheidt runtime-topologiearchitectuur van gateway-watch-dekking; de boundary-guardlijst is verdeeld in een prompt-zware shard en een gecombineerde shard voor de resterende guard-stripes, waarbij elke shard geselecteerde onafhankelijke guards gelijktijdig uitvoert en timings per check afdrukt. De dure Codex-happy-path-prompt-snapshot-driftcheck draait als eigen aanvullende job voor handmatige CI en alleen voor prompt-beinvloedende wijzigingen, zodat normale niet-gerelateerde Node-wijzigingen niet hoeven te wachten achter koude prompt-snapshotgeneratie en de boundary-shards gebalanceerd blijven terwijl promptdrift nog steeds is vastgepind aan de PR die deze veroorzaakte; dezelfde vlag slaat prompt-snapshot-Vitest-generatie over binnen de core support-boundary-shard met gebouwde artefacten. Gateway-watch, kanaaltests en de core support-boundary-shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd.

Na toelating staat canonieke Linux-CI maximaal 24 gelijktijdige Node-testjobs toe en
12 voor de kleinere fast/check-lanes; Windows en Android blijven op twee omdat
die runnerpools smaller zijn.

Het compacte PR-plan levert 18 Node-jobs op voor de huidige suite: groepen met volledige configs
worden gebatcht in geisoleerde subprocessen met een batchtimeout van 120 minuten,
terwijl include-pattern-groepen hetzelfde begrensde jobbudget delen.

Android-CI voert zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` uit en bouwt daarna de Play-debug-APK. De third-party-flavor heeft geen afzonderlijke source set of manifest; de unit-testlane compileert de flavor nog steeds met de BuildConfig-vlaggen voor SMS/call-log, terwijl een dubbele debug-APK-packagingjob bij elke Android-relevante push wordt vermeden.

De `check-dependencies`-shard voert `pnpm deadcode:dependencies` uit (een productie-Knip-pass alleen voor dependencies, vastgepind op de nieuwste Knip-versie, met pnpm's minimum release age uitgeschakeld voor de `dlx`-installatie) en `pnpm deadcode:unused-files`, dat Knips productiebevindingen voor ongebruikte bestanden vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. De guard voor ongebruikte bestanden faalt wanneer een PR een nieuw, niet-beoordeeld ongebruikt bestand toevoegt of een verouderde allowlist-entry laat staan, terwijl intentionele dynamische plugin-, gegenereerde, build-, live-test- en package-bridge-oppervlakken behouden blijven die Knip niet statisch kan oplossen.

## ClawSweeper-activiteit doorsturen

`.github/workflows/clawsweeper-dispatch.yml` is de doelzijdige bridge van OpenClaw-repositoryactiviteit naar ClawSweeper. Deze checkt geen onvertrouwde pull-requestcode uit en voert die niet uit. De workflow maakt een GitHub App-token aan vanuit `CLAWSWEEPER_APP_PRIVATE_KEY` en dispatcht daarna compacte `repository_dispatch`-payloads naar `openclaw/clawsweeper`.

De workflow heeft vier lanes:

- `clawsweeper_item` voor exacte reviewverzoeken voor issues en pull requests;
- `clawsweeper_comment` voor expliciete ClawSweeper-commando's in issuecomments;
- `clawsweeper_commit_review` voor reviewverzoeken op commitniveau bij `main`-pushes;
- `github_activity` voor algemene GitHub-activiteit die de ClawSweeper-agent kan inspecteren.

De `github_activity`-lane stuurt alleen genormaliseerde metadata door: eventtype, actie, actor, repository, itemnummer, URL, titel, state en korte fragmenten voor comments of reviews wanneer aanwezig. Deze vermijdt bewust het doorsturen van de volledige webhookbody. De ontvangende workflow in `openclaw/clawsweeper` is `.github/workflows/github-activity.yml`, die het genormaliseerde event post naar de OpenClaw Gateway-hook voor de ClawSweeper-agent.

Algemene activiteit is observatie, geen standaardlevering. De ClawSweeper-agent ontvangt het Discord-doel in zijn prompt en hoort alleen naar `#clawsweeper` te posten wanneer het event verrassend, actiegericht, riskant of operationeel nuttig is. Routinematige opens, edits, botruis, dubbele webhookruis en normaal reviewverkeer horen te resulteren in `NO_REPLY`.

Behandel GitHub-titels, comments, bodies, reviewtekst, branchnamen en commitberichten overal in dit pad als onvertrouwde data. Ze zijn input voor samenvatting en triage, geen instructies voor de workflow of agentruntime.

## Handmatige dispatches

Handmatige CI-dispatches draaien dezelfde jobgrafiek als normale CI, maar forceren elke niet-Android scoped lane aan: Linux Node-shards, bundled-plugin-shards, plugin- en kanaalcontractshards, Node 22-compatibiliteit, `check-*`, `check-additional-*`, smokechecks voor gebouwde artefacten, docs-checks, Python-Skills, Windows, macOS, iOS-build en Control UI-i18n. Losstaande handmatige CI-dispatches draaien Android alleen met `include_android=true`; de volledige release-umbrella schakelt Android in door `include_android=true` door te geven. Statische checks voor plugin-prereleases, de release-only `agentic-plugins`-shard, de volledige extensie-batchsweep en Docker-lanes voor plugin-prereleases zijn uitgesloten van CI. De Docker-prerelease-suite draait alleen wanneer `Full Release Validation` de afzonderlijke `Plugin Prerelease`-workflow dispatcht met de release-validation-gate ingeschakeld.

Handmatige runs gebruiken een unieke concurrency group zodat een volledige suite voor een release candidate niet wordt geannuleerd door een andere push- of PR-run op dezelfde ref. De optionele `target_ref`-input laat een vertrouwde caller die grafiek draaien tegen een branch, tag of volledige commit-SHA terwijl het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                          | Jobs                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Handmatige CI-dispatch en fallbacks voor niet-canonieke repositories, CodeQL-kwaliteitsscans voor JavaScript/actions, workflow-sanity, labeler, auto-response, docs-workflows buiten CI en install-smoke-preflight zodat de Blacksmith-matrix eerder kan queuen                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, lichter gewogen extensieshards, `checks-fast-core`, contractshards voor plugin/kanaal, de meeste gebundelde/lager gewogen Linux Node-shards, `check-guards`, `check-prod-types`, `check-test-types`, geselecteerde `check-additional-*`-shards en `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Behouden zware Linux Node-suites, boundary/extensie-zware `check-additional-*`-shards en `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (CPU-gevoelig genoeg dat 8 vCPU meer kostten dan ze bespaarden); install-smoke-Docker-builds (wachttijd in de 32-vCPU-queue kostte meer dan die bespaarde)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` op `openclaw/openclaw`; forks vallen terug op `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` en `ios-build` op `openclaw/openclaw`; forks vallen terug op `macos-26`                                                                                                                                                                                                  |

## Runner-registratiebudget

OpenClaws huidige GitHub-runner-registration-bucket rapporteert 10.000 self-hosted
runnerregistraties per 5 minuten in `ghx api rate_limit`. Controleer
`actions_runner_registration` opnieuw voor elke tuningpass, omdat GitHub deze
bucket kan wijzigen. De limiet wordt gedeeld door alle Blacksmith-runnerregistraties in de
`openclaw`-organisatie, dus het toevoegen van nog een Blacksmith-installatie voegt geen
nieuwe bucket toe.

Behandel Blacksmith-labels als de schaarse resource voor burst-control. Jobs die
alleen routeren, notificeren, samenvatten, shards selecteren of korte CodeQL-scans draaien, moeten
op door GitHub gehoste runners blijven tenzij ze gemeten Blacksmith-specifieke
behoeften hebben. Elke nieuwe Blacksmith-matrix, grotere `max-parallel` of hoogfrequente
workflow moet het worstcaseaantal registraties tonen en het doel op organisatieniveau
onder ongeveer 60% van de live bucket houden. Met de huidige bucket van 10.000 registraties
betekent dat een operationeel doel van 6.000 registraties, met ruimte voor
gelijktijdige repositories, retries en burst-overlap.

CI voor de canonieke repo houdt Blacksmith als standaardrunnerpad voor normale push- en pull-request-runs. `workflow_dispatch`- en niet-canonieke repository-runs gebruiken door GitHub gehoste runners, maar normale canonieke runs peilen momenteel niet de Blacksmith-queuegezondheid en vallen niet automatisch terug op door GitHub gehoste labels wanneer Blacksmith niet beschikbaar is.

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

`OpenClaw Performance` is de product-/runtimeprestatieworkflow. Deze wordt dagelijks op `main` uitgevoerd en kan handmatig worden gestart:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Handmatige dispatch benchmarkt normaal gesproken de workflow-ref. Stel `target_ref` in om een releasetag of een andere branch met de huidige workflowimplementatie te benchmarken. Gepubliceerde rapportpaden en nieuwste verwijzingen worden gesleuteld op de geteste ref, en elke `index.md` registreert de geteste ref/SHA, workflow-ref/SHA, Kova-ref, profiel, lane-authmodus, model, herhalingsaantal en scenariofilters.

De workflow installeert OCM vanuit een vastgepinde release en Kova vanuit `openclaw/Kova` op de vastgepinde `kova_ref`-invoer, en voert daarna drie lanes uit:

- `mock-provider`: Kova-diagnostische scenario's tegen een lokaal gebouwde runtime met deterministische nep-authenticatie die compatibel is met OpenAI.
- `mock-deep-profile`: CPU-/heap-/traceprofilering voor hotspots bij opstarten, Gateway en agent-turns.
- `live-openai-candidate`: een echte OpenAI `openai/gpt-5.5` agent-turn, overgeslagen wanneer `OPENAI_API_KEY` niet beschikbaar is.

De mock-provider-lane voert na de Kova-pass ook OpenClaw-native bronprobes uit: Gateway-opstarttiming en geheugen over standaard-, hook- en 50-Plugin-opstartgevallen; RSS bij importeren van gebundelde Plugins, herhaalde mock-OpenAI `channel-chat-baseline` hello-lussen, CLI-opstartcommando's tegen de opgestarte Gateway en de SQLite-state-smoke-prestatieprobe. Wanneer het eerder gepubliceerde mock-provider-bronrapport beschikbaar is voor de geteste ref, vergelijkt de bronsamenvatting huidige RSS- en heapwaarden met die baseline en markeert grote RSS-toenames als `watch`. De Markdown-samenvatting van de bronprobe staat op `source/index.md` in de rapportbundel, met ruwe JSON ernaast.

Elke lane uploadt GitHub-artefacten. Wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd, commit de workflow ook `report.json`, `report.md`, bundels, `index.md` en bronprobe-artefacten naar `openclaw/clawgrit-reports` onder `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. De huidige geteste-ref-verwijzing wordt geschreven als `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Volledige releasevalidatie

`Full Release Validation` is de handmatige overkoepelende workflow voor "alles uitvoeren vóór de release." Deze accepteert een branch, tag of volledige commit-SHA, dispatcht de handmatige `CI`-workflow met dat doel, dispatcht `Plugin Prerelease` voor release-only Plugin-/package-/statische-/Docker-bewijsvoering en dispatcht `OpenClaw Release Checks` voor install-smoke, package-acceptatie, cross-OS-packagecontroles, rendering van de maturity-scorecard vanuit QA-profielbewijs, QA Lab-pariteit, Matrix en Telegram-lanes. Stabiele en volledige profielen bevatten altijd uitputtende live/E2E- en Docker-releasepad-soakdekking; het bètaprofiel kan zich aanmelden met `run_release_soak=true`. De canonieke package Telegram E2E draait binnen Package Acceptance, dus een volledige kandidaat start geen dubbele live poller. Geef na publicatie `release_package_spec` door om het verzonden npm-package opnieuw te gebruiken in releasecontroles, Package Acceptance, Docker, cross-OS en Telegram zonder opnieuw te bouwen. Gebruik `npm_telegram_package_spec` alleen voor een gerichte Telegram-herhaling met een gepubliceerd package. De live-package-lane van de Codex-Plugin gebruikt standaard dezelfde geselecteerde staat: gepubliceerde `release_package_spec=openclaw@<tag>` leidt `codex_plugin_spec=npm:@openclaw/codex@<tag>` af, terwijl SHA-/artefactruns `extensions/codex` vanuit de geselecteerde ref packen. Stel `codex_plugin_spec` expliciet in voor aangepaste Plugin-bronnen zoals `npm:`, `npm-pack:` of `git:`-specificaties.

Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
fasematrix, exacte workflow-jobnamen, profielverschillen, artefacten en
handles voor gerichte herhalingen.

`OpenClaw Release Publish` is de handmatige muterende releaseworkflow. Dispatch deze
vanuit `release/YYYY.M.PATCH` of `main` nadat de releasetag bestaat en nadat de
OpenClaw npm-preflight is geslaagd. De workflow verifieert `pnpm plugins:sync:check`,
dispatcht `Plugin NPM Release` voor alle publiceerbare Plugin-packages, dispatcht
`Plugin ClawHub Release` voor dezelfde release-SHA en dispatcht pas daarna
`OpenClaw NPM Release` met de opgeslagen `preflight_run_id`. Stabiel publiceren vereist ook
een exacte `windows_node_tag`; de workflow verifieert de Windows-bronrelease
en vergelijkt de x64-/ARM64-installers daarvan met de door de kandidaat goedgekeurde
`windows_node_installer_digests`-invoer vóór elke onderliggende publicatie, en promoveert
en verifieert vervolgens dezelfde vastgepinde installer-digests plus het exacte bijbehorende asset
en checksumcontract voordat het GitHub-releaseconcept wordt gepubliceerd.

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

GitHub-workflow-dispatchrefs moeten branches of tags zijn, geen ruwe commit-SHA's. De
helper pusht een tijdelijke `release-ci/<sha>-...`-branch op de doel-SHA,
dispatcht `Full Release Validation` vanuit die vastgepinde ref, verifieert dat elke onderliggende
workflow-`headSha` overeenkomt met het doel en verwijdert de tijdelijke branch wanneer de
run is voltooid. De overkoepelende verifier faalt ook als een onderliggende workflow op een
andere SHA draaide.

`release_profile` bepaalt de live-/providerbreedte die aan releasecontroles wordt doorgegeven. De
handmatige releaseworkflows gebruiken standaard `stable`; gebruik `full` alleen wanneer je
bewust de brede adviserende provider-/mediamatrix wilt. Stabiele en volledige
releasecontroles voeren altijd de uitputtende live/E2E- en Docker-releasepad-soak uit;
het bètaprofiel kan zich aanmelden met `run_release_soak=true`.

- `minimum` behoudt de snelste OpenAI-/core-releasekritieke lanes.
- `stable` voegt de stabiele provider-/backendset toe.
- `full` voert de brede adviserende provider-/mediamatrix uit.

De paraplu registreert de gedispatchte onderliggende run-id's, en de laatste `Verify full validation`-job controleert de huidige conclusies van onderliggende runs opnieuw en voegt tabellen met traagste jobs toe voor elke onderliggende run. Als een onderliggende workflow opnieuw wordt uitgevoerd en groen wordt, voer dan alleen de bovenliggende verifier-job opnieuw uit om het parapluresultaat en de timingsamenvatting te vernieuwen.

Voor herstel accepteren zowel `Full Release Validation` als `OpenClaw Release Checks` `rerun_group`. Gebruik `all` voor een releasekandidaat, `ci` alleen voor de normale volledige CI-child, `plugin-prerelease` alleen voor de Plugin-prerelease-child, `release-checks` voor elke release-child, of een smallere groep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` of `npm-telegram` op de paraplu. Dit houdt een mislukte releasebox-herhaling begrensd na een gerichte fix. Combineer voor één mislukte cross-OS-lane `rerun_group=cross-os` met `cross_os_suite_filter`, bijvoorbeeld `windows/packaged-upgrade`; lange cross-OS-commando's geven Heartbeat-regels uit en packaged-upgrade-samenvattingen bevatten timings per fase. QA-releasechecklanes zijn adviserend, behalve de standaard runtime-tooldekkingsgate, die blokkeert wanneer vereiste dynamische OpenClaw-tools afwijken of verdwijnen uit de standaardtiersamenvatting.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde ref één keer om te zetten naar een `release-package-under-test`-tarball, en geeft dat artefact daarna door aan cross-OS-controles en Package Acceptance, plus de live/E2E-releasepad-Docker-workflow wanneer soakdekking draait. Daardoor blijven de packagebytes consistent over releaseboxen heen en wordt voorkomen dat dezelfde kandidaat in meerdere onderliggende jobs opnieuw wordt gepackt. Voor de live-lane van de Codex-npm-Plugin geven releasecontroles ofwel een overeenkomende gepubliceerde Plugin-specificatie door die is afgeleid van `release_package_spec`, ofwel de door de operator opgegeven `codex_plugin_spec`, of laten ze de invoer leeg zodat het Docker-script de Codex-Plugin uit de geselecteerde checkout packt.

Dubbele `Full Release Validation`-runs voor `ref=main` en `rerun_group=all`
vervangen de oudere paraplu. De bovenliggende monitor annuleert elke onderliggende workflow die hij
al heeft gedispatcht wanneer de parent wordt geannuleerd, zodat nieuwere main-validatie
niet achter een verouderde releasecheckrun van twee uur blijft hangen. Releasebranch-/tag-
validatie en gerichte rerungroepen behouden `cancel-in-progress: false`.

## Live- en E2E-shards

De release live/E2E-child behoudt brede native `pnpm test:live`-dekking, maar voert die uit als benoemde shards via `scripts/test-live-shard.mjs` in plaats van als één seriële job:

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
- gesplitste media-audio-/videoshards en providergefilterde muziekshards

Dat behoudt dezelfde bestandsdekking terwijl trage live-providerfouten eenvoudiger opnieuw uit te voeren en te diagnosticeren zijn. De samengestelde shardnamen `native-live-extensions-o-z`, `native-live-extensions-media` en `native-live-extensions-media-music` blijven geldig voor handmatige eenmalige herhalingen.

De native live-mediashards draaien in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de `Live Media Runner Image`-workflow. Die image installeert `ffmpeg` en `ffprobe` vooraf; mediajobs verifiëren alleen de binaries vóór de setup. Houd Docker-ondersteunde live-suites op normale Blacksmith-runners: containerjobs zijn de verkeerde plek om geneste Docker-tests te starten.

Docker-ondersteunde live model-/backend-shards gebruiken een aparte gedeelde `ghcr.io/openclaw/openclaw-live-test:<sha>`-image per geselecteerde commit. De live release-workflow bouwt en pusht die image eenmaal; daarna draaien de Docker live model-, provider-gesharde Gateway-, CLI-backend-, ACP-bind- en Codex-harness-shards met `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker-shards hebben expliciete `timeout`-limieten op scriptniveau onder de workflowtaak-time-out, zodat een vastgelopen container of cleanup-pad snel faalt in plaats van het volledige release-checkbudget te verbruiken. Als die shards het volledige source-Docker-target onafhankelijk opnieuw bouwen, is de release-run verkeerd geconfigureerd en verspilt deze wandkloktijd aan dubbele image-builds.

## Pakketacceptatie

Gebruik `Package Acceptance` wanneer de vraag is: "werkt dit installeerbare OpenClaw-pakket als product?" Dit verschilt van normale CI: normale CI valideert de source tree, terwijl pakketacceptatie een enkele tarball valideert via dezelfde Docker E2E-harness die gebruikers na installatie of update gebruiken.

### Taken

1. `resolve_package` checkt `workflow_ref` uit, bepaalt één pakketkandidaat, schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het `package-under-test`-artifact, en print de bron, workflow-ref, package-ref, versie, SHA-256 en profiel in de GitHub-stapsamenvatting.
2. `docker_acceptance` roept `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt dat artifact, valideert de tarball-inventaris, bereidt waar nodig package-digest-Docker-images voor, en voert de geselecteerde Docker-lanes uit tegen dat pakket in plaats van de workflow-checkout te packen. Wanneer een profiel meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het pakket en de gedeelde images eenmaal voor en waaiert die lanes daarna uit als parallelle gerichte Docker-taken met unieke artifacts.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Dit draait wanneer `telegram_mode` niet `none` is en installeert hetzelfde `package-under-test`-artifact wanneer Package Acceptance er een heeft bepaald; zelfstandige Telegram-dispatch kan nog steeds een gepubliceerde npm-spec installeren.
4. `summary` laat de workflow falen als pakketresolutie, Docker-acceptatie of de optionele Telegram-lane is mislukt.

### Kandidaatbronnen

- `source=npm` accepteert alleen `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor gepubliceerde prerelease-/stabiele acceptatie.
- `source=ref` packt een vertrouwde `package_ref`-branch, tag of volledige commit-SHA. De resolver fetcht OpenClaw-branches/tags, verifieert dat de geselecteerde commit bereikbaar is vanuit de repository-branchgeschiedenis of een release-tag, installeert deps in een detached worktree, en packt deze met `scripts/package-openclaw-for-docker.mjs`.
- `source=url` downloadt een openbare HTTPS-`.tgz`; `package_sha256` is verplicht. Dit pad weigert URL-referenties, niet-standaard HTTPS-poorten, privé/interne/special-use hostnamen of resolved IP's, en redirects buiten hetzelfde openbare veiligheidsbeleid.
- `source=trusted-url` downloadt een HTTPS-`.tgz` vanuit een benoemd trusted-source-beleid in `.github/package-trusted-sources.json`; `package_sha256` en `trusted_source_id` zijn verplicht. Gebruik dit alleen voor door maintainers beheerde enterprise-mirrors of private package repositories die geconfigureerde hosts, poorten, padprefixen, redirect-hosts of private-network resolution nodig hebben. Als het beleid bearer-auth declareert, gebruikt de workflow het vaste `OPENCLAW_TRUSTED_PACKAGE_TOKEN`-secret; in URL's ingesloten referenties worden nog steeds geweigerd.
- `source=artifact` downloadt één `.tgz` uit `artifact_run_id` en `artifact_name`; `package_sha256` is optioneel maar zou voor extern gedeelde artifacts moeten worden opgegeven.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde workflow-/harnesscode die de test uitvoert. `package_ref` is de source-commit die wordt gepackt wanneer `source=ref`. Hierdoor kan de huidige testharness oudere vertrouwde source-commits valideren zonder oude workflowlogica te draaien.

### Suiteprofielen

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — volledige Docker-releasepadchunks met OpenWebUI
- `custom` — exacte `docker_lanes`; verplicht wanneer `suite_profile=custom`

Het `package`-profiel gebruikt offline Plugin-dekking, zodat validatie van gepubliceerde pakketten niet afhankelijk is van live ClawHub-beschikbaarheid. De optionele Telegram-lane hergebruikt het `package-under-test`-artifact in `NPM Telegram Beta E2E`, waarbij het gepubliceerde npm-specpad behouden blijft voor zelfstandige dispatches.

Voor het specifieke update- en Plugin-testbeleid, inclusief lokale opdrachten,
Docker-lanes, Package Acceptance-inputs, release-standaarden en fouttriage,
zie [Updates en plugins testen](/nl/help/testing-updates-plugins).

Releasechecks roepen Package Acceptance aan met `source=artifact`, het voorbereide release-package-artifact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, en `telegram_mode=mock-openai`. Dit houdt pakketmigratie, update, live ClawHub-Skills-installatie, cleanup van verouderde Plugin-afhankelijkheden, installatiereparatie van geconfigureerde Plugins, offline Plugin, Plugin-update en Telegram-bewijs op dezelfde resolved pakket-tarball. Stel `release_package_spec` in op Full Release Validation of OpenClaw Release Checks nadat een beta is gepubliceerd om dezelfde matrix tegen het verzonden npm-pakket te draaien zonder opnieuw te bouwen; stel `package_acceptance_package_spec` alleen in wanneer Package Acceptance een ander pakket nodig heeft dan de rest van de releasevalidatie. Cross-OS-releasechecks blijven OS-specifieke onboarding, installer en platformgedrag dekken; productvalidatie voor pakket/update moet beginnen met Package Acceptance. De `published-upgrade-survivor`-Docker-lane valideert één gepubliceerde pakketbaseline per run in het blokkerende releasepad. In Package Acceptance is de resolved `package-under-test`-tarball altijd de kandidaat en selecteert `published_upgrade_survivor_baseline` de fallback-gepubliceerde baseline, standaard `openclaw@latest`; heruitvoeropdrachten voor mislukte lanes behouden die baseline. Full Release Validation met `run_release_soak=true` of `release_profile=full` stelt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` en `published_upgrade_survivor_scenarios=reported-issues` in om uit te breiden over de vier nieuwste stabiele npm-releases plus vastgepinde Plugin-compatibility boundary releases en issue-vormige fixtures voor Feishu-configuratie, behouden bootstrap-/persona-bestanden, geconfigureerde OpenClaw-Plugin-installaties, tilde-logpaden en verouderde legacy Plugin-afhankelijkheidsroots. Multi-baseline-selecties voor published-upgrade survivor worden per baseline geshard naar afzonderlijke gerichte Docker-runner-taken. De aparte `Update Migration`-workflow gebruikt de `update-migration`-Docker-lane met `all-since-2026.4.23` en `plugin-deps-cleanup` wanneer de vraag uitputtende gepubliceerde update-cleanup is, niet normale Full Release CI-breedte. Lokale aggregatieruns kunnen exacte package specs doorgeven met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, één lane behouden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` zoals `openclaw@2026.4.15`, of `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` instellen voor de scenariomatrix. De gepubliceerde lane configureert de baseline met een ingebakken `openclaw config set`-opdrachtrecept, legt receptstappen vast in `summary.json`, en probet `/healthz`, `/readyz`, plus RPC-status na Gateway-start. De verse Windows packaged- en installer-lanes verifiëren ook dat een geïnstalleerd pakket een browser-control override uit een raw absoluut Windows-pad kan importeren. De OpenAI cross-OS agent-turn smoke gebruikt standaard `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer dit is ingesteld, anders `openai/gpt-5.5`, zodat het installatie- en Gateway-bewijs op een GPT-5-testmodel blijft en GPT-4.x-standaarden vermijdt.

### Legacy-compatibiliteitsvensters

Package Acceptance heeft begrensde legacy-compatibiliteitsvensters voor al gepubliceerde pakketten. Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen het compatibiliteitspad gebruiken:

- bekende private QA-items in `dist/postinstall-inventory.json` mogen wijzen naar bestanden die uit de tarball zijn weggelaten;
- `doctor-switch` mag de `gateway install --wrapper`-persistentie-subcase overslaan wanneer het pakket die flag niet exposeert;
- `update-channel-switch` mag ontbrekende pnpm-`patchedDependencies` uit de uit de tarball afgeleide nep-git-fixture verwijderen en mag ontbrekende gepersisteerde `update.channel` loggen;
- Plugin-smokes mogen legacy install-record-locaties lezen of ontbrekende marketplace install-record-persistentie accepteren;
- `plugin-update` mag config-metadatamigratie toestaan terwijl nog steeds wordt vereist dat install record en no-reinstall-gedrag ongewijzigd blijven.

Het gepubliceerde `2026.4.26`-pakket mag ook waarschuwen voor lokale build-metadata-stampbestanden die al waren verzonden. Latere pakketten moeten voldoen aan de moderne contracten; dezelfde voorwaarden falen dan in plaats van te waarschuwen of over te slaan.

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

Begin bij het debuggen van een mislukte pakketacceptatie-run met de `resolve_package`-samenvatting om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de `docker_acceptance`-child-run en de Docker-artifacts daarvan: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logs, fasetimings en heruitvoeropdrachten. Geef de voorkeur aan het opnieuw draaien van het mislukte pakketprofiel of de exacte Docker-lanes in plaats van het opnieuw draaien van volledige releasevalidatie.

## Installatiesmoke

De aparte `Install Smoke`-workflow hergebruikt hetzelfde scopescript via zijn eigen `preflight`-taak. Deze splitst smoke-dekking in `run_fast_install_smoke` en `run_full_install_smoke`.

- **Snel pad** wordt uitgevoerd voor pull requests die Docker-/pakketoppervlakken, wijzigingen in gebundelde Plugin-pakketten/-manifesten, of core Plugin-/kanaal-/gateway-/Plugin SDK-oppervlakken raken die door de Docker-smokejobs worden getest. Wijzigingen alleen in broncode van gebundelde Plugins, wijzigingen alleen in tests en wijzigingen alleen in documentatie reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image eenmaal, controleert de CLI, voert de CLI-smoke voor het verwijderen van agents in een gedeelde werkruimte uit, voert de container-gateway-network-e2e uit, verifieert een build-argument voor een gebundelde extensie en voert het begrensde Docker-profiel voor gebundelde Plugins uit onder een totale commandotime-out van 240 seconden (waarbij elke Docker-run per scenario apart wordt begrensd).
- **Volledig pad** behoudt de dekking voor QR-pakketinstallatie en installer-Docker/update voor nachtelijke geplande runs, handmatige dispatches, workflow-call-releasecontroles en pull requests die daadwerkelijk installer-/pakket-/Docker-oppervlakken raken. In volledige modus bereidt install-smoke één target-SHA GHCR-root-Dockerfile-smoke-image voor of hergebruikt deze, en voert daarna QR-pakketinstallatie, root-Dockerfile-/Gateway-smokes, installer-/update-smokes en de snelle Docker-E2E voor gebundelde Plugins uit als afzonderlijke jobs, zodat installerwerk niet hoeft te wachten achter de root-image-smokes.

`main`-pushes (inclusief mergecommits) forceren het volledige pad niet; wanneer changed-scope-logica volledige dekking op een push zou aanvragen, behoudt de workflow de snelle Docker-smoke en laat deze de volledige install-smoke over aan nachtelijke of releasevalidatie.

De trage Bun-global-install-image-provider-smoke wordt afzonderlijk bewaakt door `run_bun_global_install_smoke`. Deze draait op het nachtelijke schema en vanuit de release checks-workflow, en handmatige `Install Smoke`-dispatches kunnen ervoor kiezen deze mee te nemen, maar pull requests en `main`-pushes doen dat niet. Normale PR-CI voert nog steeds de snelle Bun-launcher-regressielane uit voor Node-relevante wijzigingen. QR- en installer-Docker-tests behouden hun eigen installatiefocused Dockerfiles.

## Lokale Docker-E2E

`pnpm test:docker:all` bouwt vooraf één gedeelde live-testimage, verpakt OpenClaw eenmaal als npm-tarball en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images:

- een kale Node/Git-runner voor installer-/update-/plugin-dependency-lanes;
- een functionele image die dezelfde tarball installeert in `/app` voor normale functionaliteitslanes.

Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en voert vervolgens lanes uit met `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Instelbare parameters

| Variabele                              | Standaard | Doel                                                                                          |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Aantal main-pool-slots voor normale lanes.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Aantal providergevoelige tail-pool-slots.                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limiet voor gelijktijdige live lanes zodat providers niet gaan throttlen.                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5         | Limiet voor gelijktijdige npm-installatielanes.                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limiet voor gelijktijdige multi-service-lanes.                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Spreiding tussen lanestarts om Docker-daemon-create-stormen te vermijden; stel `0` in voor geen spreiding. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Fallbacktime-out per lane (120 minuten); geselecteerde live-/tail-lanes gebruiken strakkere limieten. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | niet ingesteld | `1` print het schedulerplan zonder lanes uit te voeren.                                   |
| `OPENCLAW_DOCKER_ALL_LANES`            | niet ingesteld | Kommagescheiden exacte lanelijst; slaat cleanup-smoke over zodat agents één mislukte lane kunnen reproduceren. |

Een lane die zwaarder is dan de effectieve limiet kan nog steeds starten vanuit een lege pool en draait daarna alleen totdat capaciteit wordt vrijgegeven. De lokale aggregate voert preflights voor Docker uit, verwijdert verouderde OpenClaw-E2E-containers, geeft actieve-lane-status uit, bewaart lanetimings voor langste-eerst-volgorde en stopt standaard met het schedulen van nieuwe gepoolde lanes na de eerste fout.

### Herbruikbare live-/E2E-workflow

De herbruikbare live-/E2E-workflow vraagt aan `scripts/test-docker-all.mjs --plan-json` welke pakket-, imagesoort-, live-image-, lane- en credentialdekking vereist is. `scripts/docker-e2e.mjs` zet dat plan vervolgens om naar GitHub-outputs en samenvattingen. Deze workflow verpakt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een pakketartifact uit de huidige run, of downloadt een pakketartifact uit `package_artifact_run_id`; valideert de tarball-inventaris; bouwt en pusht pakket-digest-getagde kale/functionele GHCR Docker-E2E-images via Blacksmiths Docker-laagcache wanneer het plan lanes met geïnstalleerd pakket nodig heeft; en hergebruikt opgegeven `docker_e2e_bare_image`-/`docker_e2e_functional_image`-inputs of bestaande pakket-digest-images in plaats van opnieuw te bouwen. Docker-image-pulls worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry-/cachestream snel opnieuw probeert in plaats van het grootste deel van het kritieke CI-pad te verbruiken.

### Release-padchunks

Release-Dockerdekking draait kleinere gechunkte jobs met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elke chunk alleen de imagesoort pullt die nodig is en meerdere lanes uitvoert via dezelfde gewogen scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Huidige release-Dockerchunks zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` en `plugins-runtime-install-a` tot en met `plugins-runtime-install-h`. `package-update-openai` bevat de live Codex-Plugin-pakketlane, die het kandidaat-OpenClaw-pakket installeert, de Codex-Plugin installeert vanuit `codex_plugin_spec` of een same-ref-tarball met expliciete goedkeuring voor Codex CLI-installatie, Codex CLI-preflight uitvoert en vervolgens meerdere OpenClaw-agentbeurten in dezelfde sessie tegen OpenAI uitvoert. `plugins-runtime-core`, `plugins-runtime` en `plugins-integrations` blijven aggregate Plugin-/runtime-aliassen. De `install-e2e`-lanealias blijft de aggregate handmatige rerun-alias voor beide provider-installerlanes.

OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige release-path-dekking dat aanvraagt, en behoudt alleen een zelfstandige `openwebui`-chunk voor OpenWebUI-only-dispatches. Update-lanes voor gebundelde kanalen proberen eenmaal opnieuw bij tijdelijke npm-netwerkfouten.

Elke chunk uploadt `.artifacts/docker-tests/` met lanelogs, timings, `summary.json`, `failures.json`, fasetimings, schedulerplan-JSON, slow-lane-tabellen en rerun-commando's per lane. De workflowinput `docker_lanes` voert geselecteerde lanes uit tegen de voorbereide images in plaats van de chunkjobs, waardoor debugging van mislukte lanes begrensd blijft tot één gerichte Docker-job en het pakketartifact voor die run wordt voorbereid, gedownload of hergebruikt; als een geselecteerde lane een live Docker-lane is, bouwt de gerichte job de live-testimage lokaal voor die rerun. Gegenereerde GitHub-rerun-commando's per lane bevatten `package_artifact_run_id`, `package_artifact_name` en voorbereide image-inputs wanneer die waarden bestaan, zodat een mislukte lane exact hetzelfde pakket en dezelfde images uit de mislukte run kan hergebruiken.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

De geplande live-/E2E-workflow voert dagelijks de volledige release-path-Docker-suite uit.

## Plugin-prerelease

`Plugin Prerelease` is duurdere product-/pakketdekking, dus dit is een afzonderlijke workflow die wordt gedispatcht door `Full Release Validation` of door een expliciete operator. Normale pull requests, `main`-pushes en zelfstandige handmatige CI-dispatches houden die suite uitgeschakeld. De workflow verdeelt tests voor gebundelde Plugins over acht extensieworkers; die extensieshardjobs voeren maximaal twee Plugin-configgroepen tegelijk uit met één Vitest-worker per groep en een grotere Node-heap, zodat importzware Plugin-batches geen extra CI-jobs creëren. Het release-only Docker-prereleasepad batcht gerichte Docker-lanes in kleine groepen om te vermijden dat tientallen runners worden gereserveerd voor jobs van één tot drie minuten. De workflow uploadt ook een informatief `plugin-inspector-advisory`-artifact van `@openclaw/plugin-inspector`; inspectorbevindingen zijn triage-input en wijzigen de blokkerende Plugin Prerelease-gate niet.

## QA Lab

QA Lab heeft speciale CI-lanes buiten de hoofdworkflow met slimme scopebepaling. Agentic-pariteit is genest onder de brede QA- en releaseharnassen, niet als zelfstandige PR-workflow. Gebruik `Full Release Validation` met `rerun_group=qa-parity` wanneer pariteit moet meelopen met een brede validatierun.

- De workflow `QA-Lab - All Lanes` draait nachtelijk op `main` en bij handmatige dispatch; deze waaiert de mock parity-lane, live Matrix-lane en live Telegram- en Discord-lanes uit als parallelle jobs. Live jobs gebruiken de omgeving `qa-live-shared`, en Telegram/Discord gebruiken Convex-leases.

Releasecontroles voeren Matrix- en Telegram-live-transportlanes uit met de deterministische mockprovider en mock-gekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het kanaalcontract geïsoleerd is van live modellatentie en normale provider-Plugin-startup. De live transport-Gateway schakelt geheugenzoekopdrachten uit, omdat QA-pariteit geheugengedrag afzonderlijk dekt; providerconnectiviteit wordt gedekt door de afzonderlijke live model-, native provider- en Docker-provider-suites.

Matrix gebruikt `--profile fast` voor geplande gates en releasegates, en voegt `--fail-fast` alleen toe wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaard en handmatige workflowinput blijven `all`; handmatige `matrix_profile=all`-dispatch shardt volledige Matrix-dekking altijd naar `transport`-, `media`-, `e2ee-smoke`-, `e2ee-deep`- en `e2ee-cli`-jobs.

`OpenClaw Release Checks` voert ook de releasekritieke QA Lab-lanes uit vóór releasegoedkeuring; de QA-parity-gate voert kandidaat- en baselinepakketten uit als parallelle lanejobs, en downloadt daarna beide artifacts naar een kleine rapportjob voor de uiteindelijke pariteitsvergelijking.

Volg voor normale PR's gescopeerde CI-/check-evidence in plaats van pariteit als vereiste status te behandelen.

## CodeQL

De `CodeQL`-workflow is bewust een smalle beveiligingsscanner in eerste aanleg, niet de volledige repository-sweep. Dagelijkse, handmatige en niet-draft pull request-guardruns scannen Actions-workflowcode plus de JavaScript-/TypeScript-oppervlakken met het hoogste risico met high-confidence-beveiligingsqueries die zijn gefilterd op hoge/kritieke `security-severity`.

De pull request-guard blijft licht: deze start alleen voor wijzigingen onder `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` of `src`, en voert dezelfde high-confidence-beveiligingsmatrix uit als de geplande workflow. Android- en macOS-CodeQL blijven buiten PR-standaarden.

### Beveiligingscategorieën

| Categorie                                         | Oppervlak                                                                                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-security-high/core-auth-secrets`         | Auth, geheimen, sandbox, Cron en Gateway-baseline                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Core-kanaalimplementatiecontracten plus de runtime voor kanaal-Plugins, Gateway, Plugin SDK, geheimen en audit-aanraakpunten        |
| `/codeql-security-high/network-ssrf-boundary`     | Core-SSRF, IP-parsing, netwerkbewaking, web-fetch en SSRF-beleidsoppervlakken van de Plugin SDK                                      |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-servers, helpers voor procesuitvoering, uitgaande aflevering en gates voor tooluitvoering door agents                            |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-installatie, loader, manifest, registry, pakketmanagerinstallatie, bronladen en vertrouwensoppervlakken van het Plugin SDK-pakketcontract |

### Platformspecifieke beveiligingsshards

- `CodeQL Android Critical Security` — geplande Android-beveiligingsshard. Bouwt de Android-app handmatig voor CodeQL op de kleinste Blacksmith Linux-runner die door workflow-sanity wordt geaccepteerd. Uploadt onder `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — wekelijkse/handmatige macOS-beveiligingsshard. Bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert dependency-buildresultaten uit geüploade SARIF en uploadt onder `/codeql-critical-security/macos`. Buiten de dagelijkse defaults gehouden omdat de macOS-build de runtime domineert, zelfs wanneer die schoon is.

### Kritieke kwaliteitscategorieën

`CodeQL Critical Quality` is de bijbehorende niet-beveiligingsshard. Deze voert alleen JavaScript/TypeScript-kwaliteitsqueries met foutseverity en zonder beveiligingsfocus uit over smalle, waardevolle oppervlakken op GitHub-gehoste Linux-runners, zodat kwaliteitsscans geen Blacksmith-runnerregistratiebudget verbruiken. De pull request-guard is bewust kleiner dan het geplande profiel: niet-draft-PR's voeren alleen de bijbehorende shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` en `plugin-sdk-reply-runtime` uit voor wijzigingen in agent-opdracht-/model-/tooluitvoering en reply-dispatchcode, configschema-/migratie-/IO-code, auth-/geheimen-/sandbox-/beveiligingscode, core-kanaal en runtime van gebundelde kanaal-Plugins, Gateway-protocol/servermethode, memory-runtime/SDK-koppeling, MCP/proces/uitgaande aflevering, provider-runtime/modelcatalogus, sessiediagnostiek/afleveringsqueues, Plugin-loader, Plugin SDK/pakketcontract of Plugin SDK-reply-runtime. Wijzigingen in CodeQL-configuratie en kwaliteitsworkflow voeren alle twaalf PR-kwaliteitsshards uit.

Handmatige dispatch accepteert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

De smalle profielen zijn onderwijs-/iteratiehooks om één kwaliteitsshard geïsoleerd uit te voeren.

| Categorie                                               | Oppervlak                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, geheimen, sandbox, Cron en code voor de Gateway-beveiligingsgrens                                                                                            |
| `/codeql-critical-quality/config-boundary`              | Configschema-, migratie-, normalisatie- en IO-contracten                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-protocolschema's en servermethodecontracten                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementatiecontracten voor core-kanaal en gebundelde kanaal-Plugins                                                                                             |
| `/codeql-critical-quality/agent-runtime-boundary`       | Opdrachtuitvoering, model-/providerdispatch, auto-reply-dispatch en queues, en ACP-runtimecontracten voor de control plane                                        |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-servers en toolbridges, helpers voor procesbewaking en contracten voor uitgaande aflevering                                                                   |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host-SDK, memory-runtimefacades, memory-aliassen in de Plugin SDK, activatiekoppeling voor memory-runtime en memory-doctoropdrachten                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interne reply-queue, sessieafleveringsqueues, helpers voor uitgaande sessiebinding/-aflevering, diagnostische event-/logbundeloppervlakken en CLI-contracten voor session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Inkomende reply-dispatch van de Plugin SDK, helpers voor reply-payload/chunking/runtime, kanaalreply-opties, afleveringsqueues en helpers voor sessie-/threadbinding |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisatie van modelcatalogus, provider-auth en -discovery, provider-runtimeregistratie, providerdefaults/-catalogi en web-/zoek-/fetch-/embedding-registries   |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap van Control UI, lokale persistentie, Gateway-controlflows en runtimecontracten voor task-control-plane                                                   |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search, media-IO, mediabegrip, image-generation en runtimecontracten voor media-generation                                                         |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, registry-, public-surface- en Plugin SDK-entrypointcontracten                                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Gepubliceerde pakketkant-Plugin SDK-bron en helpers voor Plugin-pakketcontracten                                                                                  |

Kwaliteit blijft gescheiden van beveiliging, zodat kwaliteitsbevindingen kunnen worden gepland, gemeten, uitgeschakeld of uitgebreid zonder het beveiligingssignaal te verhullen. Uitbreiding van CodeQL voor Swift, Python en gebundelde Plugins mag alleen als gescopeerd of geshard vervolgwerk worden teruggebracht nadat de smalle profielen stabiele runtime en stabiel signaal hebben.

## Onderhoudsworkflows

### Docs Agent

De workflow `Docs Agent` is een eventgedreven Codex-onderhoudsbaan om bestaande docs afgestemd te houden op recent gelande wijzigingen. Deze heeft geen puur schema: een succesvolle niet-bot push-CI-run op `main` kan hem triggeren, en handmatige dispatch kan hem rechtstreeks uitvoeren. Workflow-run-invocations worden overgeslagen wanneer `main` verder is gegaan of wanneer er in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is aangemaakt. Wanneer de workflow draait, beoordeelt deze het commitbereik van de vorige niet-overgeslagen Docs Agent-bron-SHA tot de huidige `main`, zodat één uurlijkse run alle main-wijzigingen kan dekken die sinds de laatste docspass zijn verzameld.

### Test Performance Agent

De workflow `Test Performance Agent` is een eventgedreven Codex-onderhoudsbaan voor trage tests. Deze heeft geen puur schema: een succesvolle niet-bot push-CI-run op `main` kan hem triggeren, maar hij wordt overgeslagen als een andere workflow-run-invocation die UTC-dag al heeft gedraaid of draait. Handmatige dispatch omzeilt die dagelijkse activiteitsgate. De baan bouwt een gegroepeerd Vitest-performancerapport voor de volledige suite, laat Codex alleen kleine testperformancefixes maken die dekking behouden in plaats van brede refactors, voert daarna het full-suite-rapport opnieuw uit en weigert wijzigingen die het baseline-aantal geslaagde tests verlagen. Het gegroepeerde rapport registreert walltime per config en maximale RSS op Linux en macOS, zodat de voor/na-vergelijking geheugenverschillen van tests naast duurverschillen toont. Als de baseline falende tests heeft, mag Codex alleen duidelijke fouten oplossen en moet het full-suite-rapport na de agent slagen voordat er iets wordt gecommit. Wanneer `main` verdergaat voordat de bot-push landt, rebaset de baan de gevalideerde patch, voert `pnpm check:changed` opnieuw uit en probeert de push opnieuw; conflicterende verouderde patches worden overgeslagen. De workflow gebruikt GitHub-gehoste Ubuntu, zodat de Codex-action dezelfde drop-sudo-veiligheidshouding kan houden als de docs-agent.

### Dubbele PR's na merge

De workflow `Duplicate PRs After Merge` is een handmatige maintainerworkflow voor opschoning van duplicaten na landing. Standaard draait deze als dry-run en sluit alleen expliciet opgegeven PR's wanneer `apply=true`. Voordat GitHub wordt gemuteerd, verifieert de workflow dat de gelande PR is gemerged en dat elk duplicaat óf een gedeeld gerefereerd issue heeft óf overlappende gewijzigde hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale checkgates en gewijzigde routing

Lokale changed-lane-logica staat in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale checkgate is strenger over architectuurgrenzen dan de brede CI-platformscope:

- core-productiewijzigingen voeren core-prod- en core-test-typecheck plus core-lint/guards uit;
- core-wijzigingen die alleen tests raken, voeren alleen core-test-typecheck plus core-lint uit;
- extensieproductiewijzigingen voeren extensie-prod- en extensie-test-typecheck plus extensie-lint uit;
- extensiewijzigingen die alleen tests raken, voeren extensie-test-typecheck plus extensie-lint uit;
- publieke Plugin SDK- of plugin-contractwijzigingen breiden uit naar extensie-typecheck omdat extensies afhankelijk zijn van die core-contracten (Vitest-extensiesweeps blijven expliciet testwerk);
- release-metadata-only versiebumpen voeren gerichte versie-/config-/root-dependencychecks uit;
- onbekende root-/configwijzigingen falen veilig naar alle checklanes.

Lokale changed-test-routing staat in `scripts/test-projects.test-support.mjs` en is bewust goedkoper dan `check:changed`: directe testbewerkingen voeren zichzelf uit, bronbewerkingen geven de voorkeur aan expliciete mappings, daarna siblingtests en import-graph-afhankelijken. Gedeelde group-room delivery-config is een van de expliciete mappings: wijzigingen in de zichtbaar-reply-config voor groepen, bronreply-afleveringsmodus of de systeemprompt voor message-tool lopen via de core-replytests plus Discord- en Slack-afleveringsregressies, zodat een gedeelde defaultwijziging faalt vóór de eerste PR-push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging zo harness-breed is dat de goedkope gemapte set geen betrouwbare proxy is.

## Testbox-validatie

Crabbox is de repo-eigen remote-box-wrapper voor maintainer-Linux-proof. Gebruik deze
vanuit de repo-root wanneer een check te breed is voor een lokale edit-loop, wanneer CI-
pariteit belangrijk is, of wanneer de proof geheimen, Docker, pakketlanes,
herbruikbare boxen of remote logs nodig heeft. De normale OpenClaw-backend is
`blacksmith-testbox`; eigen AWS/Hetzner-capaciteit is een fallback voor Blacksmith-
storingen, quotaproblemen of expliciete tests met eigen capaciteit.

Crabbox-ondersteunde Blacksmith-runs warmen, claimen, synchroniseren, voeren uit, rapporteren en ruimen
eenmalige Testboxes op. De ingebouwde sanitycheck voor synchronisatie faalt snel wanneer vereiste
rootbestanden zoals `pnpm-lock.yaml` verdwijnen of wanneer `git status --short`
minstens 200 bijgehouden verwijderingen toont. Stel voor bedoelde PR's met veel verwijderingen
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor de externe opdracht.

Crabbox beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de
synchronisatiefase blijft zonder output na synchronisatie. Stel
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` in om die guard uit te schakelen, of gebruik een grotere
millisecondewaarde voor ongewoon grote lokale diffs.

Controleer voor een eerste run de wrapper vanuit de repo-root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

De repo-wrapper weigert een verouderde Crabbox-binary die geen `blacksmith-testbox` vermeldt. Geef de provider expliciet door, ook al heeft `.crabbox.yaml` standaardwaarden voor owned-cloud. Vermijd in Codex-worktrees of gekoppelde/sparse checkouts het lokale `pnpm crabbox:run`-script, omdat pnpm afhankelijkheden kan reconciliëren voordat Crabbox start; roep in plaats daarvan de node-wrapper rechtstreeks aan:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith-ondersteunde runs vereisen Crabbox 0.22.0 of nieuwer, zodat de wrapper het huidige gedrag voor Testbox-synchronisatie, wachtrij en opschoning krijgt. Bouw bij gebruik van de sibling-checkout de genegeerde lokale binary opnieuw voordat je timing- of bewijswerk doet:

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

Gerichte testherhaling:

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
opdrachtresultaat. De gekoppelde GitHub Actions-run is eigenaar van hydratie en keepalive; die
kan eindigen als `cancelled` wanneer de Testbox extern wordt gestopt nadat de SSH-opdracht
al is teruggekeerd. Behandel dat als een opschonings-/statusartefact, tenzij
de wrapper-`exitCode` niet nul is of de opdrachtoutput een mislukte test toont.
Eenmalige Blacksmith-ondersteunde Crabbox-runs zouden de Testbox automatisch moeten stoppen;
als een run wordt onderbroken of opschoning onduidelijk is, inspecteer dan live boxes en stop alleen
de boxes die jij hebt aangemaakt:

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

Als Crabbox de kapotte laag is maar Blacksmith zelf werkt, gebruik directe
Blacksmith dan alleen voor diagnostiek zoals `list`, `status` en opschoning. Repareer het
Crabbox-pad voordat je een directe Blacksmith-run als maintainer-bewijs behandelt.

Als `blacksmith testbox list --all` en `blacksmith testbox status` werken maar nieuwe
warmups na een paar minuten `queued` blijven zonder IP of Actions-run-URL,
behandel dit dan als druk door de Blacksmith-provider, wachtrij, facturering of org-limiet. Stop de
queued ids die je hebt aangemaakt, start geen extra Testboxes en verplaats het bewijs naar het
owned Crabbox-capaciteitspad hieronder terwijl iemand het Blacksmith-dashboard,
de facturering en de org-limieten controleert.

Escaleren naar owned Crabbox-capaciteit doe je alleen wanneer Blacksmith down is, quota-gelimiteerd is, de benodigde omgeving mist, of owned capaciteit expliciet het doel is:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Vermijd onder AWS-druk `class=beast`, tenzij de taak echt 48xlarge-klasse CPU nodig heeft. Een `beast`-aanvraag begint bij 192 vCPU's en is de gemakkelijkste manier om regionale EC2 Spot- of On-Demand Standard-quota te raken. De repo-owned `.crabbox.yaml` gebruikt standaard `standard`, meerdere capaciteitsregio's en `capacity.hints: true`, zodat gebrokerde AWS-leases de geselecteerde regio/markt, quotadruk, Spot-fallback en waarschuwingen voor klassen onder hoge druk afdrukken. Gebruik `fast` voor zwaardere brede checks, `large` alleen nadat standard/fast niet genoeg zijn, en `beast` alleen voor uitzonderlijke CPU-gebonden lanes zoals volledige suites of Docker-matrices voor alle Plugins, expliciete release-/blocker-validatie of performanceprofiling met veel cores. Gebruik `beast` niet voor `pnpm check:changed`, gerichte tests, docs-only werk, gewone lint/typecheck, kleine E2E-reproducties of triage van Blacksmith-uitval. Gebruik `--market on-demand` voor capaciteitsdiagnose, zodat Spot-marktschommelingen niet in het signaal worden gemengd.

`.crabbox.yaml` is eigenaar van de standaardwaarden voor provider, synchronisatie en GitHub Actions-hydratie voor owned-cloud lanes. Het sluit lokale `.git` uit, zodat de gehydrateerde Actions-checkout zijn eigen externe Git-metadata behoudt in plaats van maintainer-lokale remotes en object stores te synchroniseren, en het sluit lokale runtime-/buildartefacten uit die nooit mogen worden overgedragen. `.github/workflows/crabbox-hydrate.yml` is eigenaar van checkout, Node/pnpm-setup, `origin/main`-fetch en de niet-geheime environment-handoff voor owned-cloud `crabbox run --id <cbx_id>`-opdrachten.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Ontwikkelingskanalen](/nl/install/development-channels)
