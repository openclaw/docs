---
read_when:
    - Je moet begrijpen waarom een CI-taak wel of niet is uitgevoerd
    - Je debugt een falende GitHub Actions-check
    - Je coördineert een releasevalidatierun of herhaling daarvan
    - Je wijzigt ClawSweeper-dispatch of het doorsturen van GitHub-activiteit
summary: CI-taakgrafiek, scope-gates, releaseparaplu's en lokale opdracht-equivalenten
title: CI-pijplijn
x-i18n:
    generated_at: "2026-07-02T14:06:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc5ce77eadea695e98926326767dde4c8ea2d19c69a4c782d164e0f87201b227
    source_path: ci.md
    workflow: 16
---

OpenClaw CI draait bij elke push naar `main` en elke pull request. Canonieke
`main`-pushes gaan eerst door een toelatingsvenster van 90 seconden op hosted runners.
De bestaande `CI`-concurrencygroep annuleert die wachtende run wanneer er een nieuwere
commit binnenkomt, zodat opeenvolgende merges niet elk een volledige Blacksmith-matrix
registreren. Pull requests en handmatige dispatches slaan de wachttijd over. De `preflight`-job
classificeert daarna de diff en schakelt dure lanes uit wanneer alleen niet-gerelateerde
gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen bewust slimme
scoping en waaieren uit naar de volledige graph voor release candidates en brede
validatie. Android-lanes blijven opt-in via `include_android`. Release-only
Plugin-dekking staat in de afzonderlijke [`Plugin-voorrelease`](#plugin-prerelease)
workflow en draait alleen vanuit [`Volledige releasevalidatie`](#full-release-validation)
of een expliciete handmatige dispatch.

## Pipelineoverzicht

| Job                                | Doel                                                                                                      | Wanneer deze draait                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `preflight`                        | Detecteert docs-only wijzigingen, gewijzigde scopes, gewijzigde extensies en bouwt het CI-manifest        | Altijd bij niet-draft pushes en PR's                 |
| `runner-admission`                 | Gehoste debounce van 90 seconden voor canonieke `main`-pushes voordat Blacksmith-werk wordt geregistreerd | Elke CI-run; sleep alleen bij canonieke `main`-pushes |
| `security-fast`                    | Detectie van privésleutels, audit van gewijzigde workflows via `zizmor` en audit van productie-lockfiles  | Altijd bij niet-draft pushes en PR's                 |
| `check-dependencies`               | Productie-Knip-pass alleen voor dependencies plus de unused-file allowlist guard                          | Node-relevante wijzigingen                           |
| `build-artifacts`                  | Bouwt `dist/`, Control UI, smokechecks voor gebouwde CLI, embedded built-artifact checks en herbruikbare artifacts | Node-relevante wijzigingen                    |
| `checks-fast-core`                 | Snelle Linux-correctheidslanes zoals bundled, protocol, QA Smoke CI en CI-routingcontroles                | Node-relevante wijzigingen                           |
| `checks-fast-contracts-plugins-*`  | Twee gesharde Plugin-contractcontroles                                                                    | Node-relevante wijzigingen                           |
| `checks-fast-contracts-channels-*` | Twee gesharde kanaalcontractcontroles                                                                     | Node-relevante wijzigingen                           |
| `checks-node-core-*`               | Core Node-testshards, exclusief kanaal-, bundled-, contract- en extensielanes                             | Node-relevante wijzigingen                           |
| `check-*`                          | Gesharde equivalent van de lokale hoofdgate: prod-types, lint, guards, testtypes en strict smoke          | Node-relevante wijzigingen                           |
| `check-additional-*`               | Architectuur, gesharde boundary/prompt-drift, extensieguards, package boundary en runtimetopologie        | Node-relevante wijzigingen                           |
| `checks-node-compat-node22`        | Node 22-compatibiliteitsbuild en smoke-lane                                                               | Handmatige CI-dispatch voor releases                 |
| `check-docs`                       | Docs-formattering, lint en controles op kapotte links                                                     | Docs gewijzigd                                       |
| `skills-python`                    | Ruff + pytest voor Python-backed skills                                                                   | Python-skill-relevante wijzigingen                   |
| `checks-windows`                   | Windows-specifieke process/path-tests plus gedeelde regressies in runtime-importspecificaties             | Windows-relevante wijzigingen                        |
| `macos-node`                       | macOS TypeScript-testlane met de gedeelde gebouwde artifacts                                              | macOS-relevante wijzigingen                          |
| `macos-swift`                      | Swift-lint, build en tests voor de macOS-app                                                              | macOS-relevante wijzigingen                          |
| `ios-build`                        | Xcode-projectgeneratie plus de simulatorbuild van de iOS-app                                             | iOS-app, gedeelde appkit of Swabble-wijzigingen      |
| `android`                          | Android-unittests voor beide flavors plus een debug-APK-build                                             | Android-relevante wijzigingen                        |
| `test-performance-agent`           | Dagelijkse Codex-optimalisatie van trage tests na vertrouwde activiteit                                   | Geslaagde main-CI of handmatige dispatch             |
| `openclaw-performance`             | Dagelijkse/on-demand Kova-runtimeprestatierapporten met mock-provider, deep-profile en GPT 5.5 live-lanes | Geplande en handmatige dispatch                      |

## Fail-fast-volgorde

1. `runner-admission` wacht alleen op canonieke `main`-pushes; een nieuwere push annuleert de run vóór Blacksmith-registratie.
2. `preflight` bepaalt welke lanes überhaupt bestaan. De `docs-scope`- en `changed-scope`-logica zijn stappen binnen deze job, geen zelfstandige jobs.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` en `skills-python` falen snel zonder te wachten op de zwaardere artifact- en platformmatrixjobs.
4. `build-artifacts` overlapt met de snelle Linux-lanes, zodat downstream consumers kunnen starten zodra de gedeelde build gereed is.
5. Zwaardere platform- en runtimelanes waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` en `android`.

GitHub kan vervangen jobs markeren als `cancelled` wanneer er een nieuwere push op dezelfde PR- of `main`-ref binnenkomt. Behandel dat als CI-ruis tenzij de nieuwste run voor dezelfde ref ook faalt. Matrixjobs gebruiken `fail-fast: false`, en `build-artifacts` rapporteert embedded channel-, core-support-boundary- en gateway-watch-fouten rechtstreeks in plaats van kleine verifierjobs in de wachtrij te zetten. De automatische CI-concurrency key is geversioneerd (`CI-v7-*`), zodat een zombie aan GitHub-zijde in een oude queuegroep nieuwere main-runs niet onbeperkt kan blokkeren. Handmatige volledige-suite-runs gebruiken `CI-manual-v1-*` en annuleren geen lopende runs.

Gebruik `pnpm ci:timings`, `pnpm ci:timings:recent` of `node scripts/ci-run-timings.mjs <run-id>` om wandtijd, wachtrijtijd, traagste jobs, fouten en de `pnpm-store-warmup`-fanoutbarrière uit GitHub Actions samen te vatten. CI uploadt dezelfde runsamenvatting ook als een `ci-timings-summary`-artifact. Controleer voor buildtiming de stap `Build dist` van de job `build-artifacts`: `pnpm build:ci-artifacts` print `[build-all] phase timings:` en bevat `ui:build`; de job uploadt ook het `startup-memory`-artifact.

Voor pull request-runs draait de afsluitende timing-summary-job de helper uit de vertrouwde base-revisie voordat `GH_TOKEN` aan `gh run view` wordt doorgegeven. Zo blijft de query met token buiten branch-controlled code terwijl de huidige CI-run van de pull request toch wordt samengevat.

## PR-context en bewijs

PR's van externe contributors draaien een PR-context- en bewijsgate vanuit
`.github/workflows/real-behavior-proof.yml`. De workflow checkt de vertrouwde
base-commit uit en evalueert alleen de PR-body; hij voert geen code uit de
contributor-branch uit.

De gate geldt voor PR-auteurs die geen repository-eigenaren, leden,
collaborators of bots zijn. Deze slaagt wanneer de PR-body zelf geschreven
secties `What Problem This Solves` en `Evidence` bevat. Bewijs kan een gerichte
test, CI-resultaat, screenshot, opname, terminaluitvoer, live-observatie,
geredigeerde log of artifact-link zijn. De body geeft intentie en bruikbare validatie;
reviewers inspecteren de code, tests en CI om correctheid te beoordelen.

Wanneer de check faalt, werk dan de PR-body bij in plaats van nog een codecommit te pushen.

## Scope en routing

Scopelogica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unittests in `src/scripts/ci-changed-scope.test.ts`. Handmatige dispatch slaat changed-scope-detectie over en laat het preflight-manifest doen alsof elk scoped gebied is gewijzigd.

- **CI-workflowbewerkingen** valideren de Node CI-graph plus workflowlinting, maar forceren op zichzelf geen Windows-, iOS-, Android- of macOS-native builds; die platformlanes blijven beperkt tot wijzigingen in platformbroncode.
- **Workflow Sanity** draait `actionlint`, `zizmor` over alle workflow-YAML-bestanden, de composite-action interpolation guard en de conflict-marker guard. De PR-scoped `security-fast`-job draait ook `zizmor` over gewijzigde workflowbestanden, zodat bevindingen over workflowbeveiliging vroeg falen in de hoofd-CI-graph.
- **Docs bij `main`-pushes** worden gecontroleerd door de zelfstandige `Docs`-workflow met dezelfde ClawHub-docsmirror als CI, zodat gemengde code+docs-pushes niet ook de CI-`check-docs`-shard in de wachtrij zetten. Pull requests en handmatige CI draaien nog steeds `check-docs` vanuit CI wanneer docs zijn gewijzigd.
- **TUI PTY** draait in de `checks-node-core-runtime-tui-pty` Linux Node-shard voor TUI-wijzigingen. De shard draait `test/vitest/vitest.tui-pty.config.ts` met `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, zodat deze zowel de deterministische `TuiBackend`-fixturelane als de tragere `tui --local`-smoke dekt, die alleen het externe modeleindpunt mockt.
- **CI-routing-only bewerkingen, geselecteerde goedkope core-test-fixturebewerkingen en smalle Plugin-contracthelper/test-routingbewerkingen** gebruiken een snel Node-only manifestpad: `preflight`, security en één `checks-fast-core`-taak. Dat pad slaat build artifacts, Node 22-compatibiliteit, kanaalcontracten, volledige coreshards, bundled-Plugin-shards en aanvullende guardmatrices over wanneer de wijziging beperkt is tot de routing- of helperoppervlakken die de snelle taak rechtstreeks uitoefent.
- **Windows Node-controles** zijn scoped tot Windows-specifieke process/path-wrappers, npm/pnpm/UI-runnerhelpers, package manager-configuratie en de CI-workflowoppervlakken die die lane uitvoeren; niet-gerelateerde broncode-, Plugin-, install-smoke- en test-only wijzigingen blijven op de Linux Node-lanes.

De langzaamste Node-testfamilies zijn gesplitst of gebalanceerd zodat elke job klein blijft zonder runners te ruim te reserveren: plugincontracten en kanaalcontracten draaien elk als twee gewogen Blacksmith-ondersteunde shards met de standaard GitHub-runnerfallback, snelle/support-lanes voor core unit draaien apart, core runtime-infra is gesplitst tussen state, process/config, shared en drie cron-domeinshards, auto-reply draait als gebalanceerde workers (waarbij de reply-subtree is gesplitst in agent-runner-, dispatch- en commands/state-routing-shards), en agentic gateway/server-configs zijn verdeeld over chat/auth/model/http-plugin/runtime/startup-lanes in plaats van te wachten op gebouwde artefacten. Normale CI verpakt daarna alleen geisoleerde infra-include-pattern-shards in deterministische bundels van maximaal 64 testbestanden, waardoor de Node-matrix kleiner wordt zonder niet-geisoleerde command/cron-, stateful agents-core- of gateway/server-suites samen te voegen; zware vaste suites blijven op 8 vCPU, terwijl de gebundelde en lichtere lanes 4 vCPU gebruiken. Pull requests op de canonieke repository gebruiken een aanvullend compact toelatingsplan: dezelfde groepen per config draaien in geisoleerde subprocessen binnen het huidige Linux Node-plan van 34 jobs, zodat een enkele PR niet de volledige Node-matrix van meer dan 70 jobs registreert. Pushes naar `main`, handmatige dispatches en release-gates behouden de volledige matrix. Brede browser-, QA-, media- en diverse plugintests gebruiken hun eigen Vitest-configs in plaats van de gedeelde plugin-catch-all. Include-pattern-shards registreren timingvermeldingen met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een volledige config kan onderscheiden van een gefilterde shard. `check-additional-*` houdt package-boundary compile/canary-werk bij elkaar en scheidt runtime-topologiearchitectuur van gateway-watch-dekking; de boundary-guard-lijst is verdeeld in een prompt-zware shard en een gecombineerde shard voor de resterende guard-strepen, waarbij elk geselecteerde onafhankelijke guards gelijktijdig uitvoert en timings per check afdrukt. De dure Codex-happy-path prompt-snapshot-driftcheck draait als eigen aanvullende job alleen voor handmatige CI en voor prompt-beinvloedende wijzigingen, zodat normale niet-gerelateerde Node-wijzigingen niet hoeven te wachten op koude prompt-snapshotgeneratie en de boundary-shards gebalanceerd blijven terwijl promptdrift nog steeds wordt vastgepind aan de PR die deze veroorzaakte; dezelfde vlag slaat Vitest-generatie van prompt-snapshots over binnen de built-artifact core support-boundary-shard. Gateway-watch, kanaaltests en de core support-boundary-shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd.

Na toelating staat canonieke Linux-CI maximaal 24 gelijktijdige Node-testjobs en
12 voor de kleinere fast/check-lanes toe; Windows en Android blijven op twee omdat
die runnerpools smaller zijn.

Het compacte PR-plan emitteert 18 Node-jobs voor de huidige suite: groepen met volledige configs
worden gebatcht in geisoleerde subprocessen met een batchtime-out van 120 minuten,
terwijl include-pattern-groepen hetzelfde begrensde jobbudget delen.

Android-CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play debug-APK. De third-party-flavor heeft geen aparte source set of manifest; de unit-test-lane compileert de flavor nog steeds met de SMS/call-log BuildConfig-vlaggen, terwijl een dubbele debug-APK-packagingjob bij elke Android-relevante push wordt vermeden.

De `check-dependencies`-shard draait `pnpm deadcode:dependencies` (een productie-Knip-pass alleen voor afhankelijkheden, vastgezet op de nieuwste Knip-versie, met pnpm's minimale releaseleeftijd uitgeschakeld voor de `dlx`-installatie) en `pnpm deadcode:unused-files`, dat Knip's productiebevindingen voor ongebruikte bestanden vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. De unused-file-guard faalt wanneer een PR een nieuw niet-gereviewd ongebruikt bestand toevoegt of een verouderde allowlist-vermelding laat staan, terwijl opzettelijke dynamische plugin-, gegenereerde, build-, live-test- en package-bridge-oppervlakken behouden blijven die Knip niet statisch kan oplossen.

## Doorsturen van ClawSweeper-activiteit

`.github/workflows/clawsweeper-dispatch.yml` is de doelzijde-bridge van OpenClaw-repositoryactiviteit naar ClawSweeper. Het checkt geen onvertrouwde pull request-code uit en voert die ook niet uit. De workflow maakt een GitHub App-token aan vanuit `CLAWSWEEPER_APP_PRIVATE_KEY` en dispatcht daarna compacte `repository_dispatch`-payloads naar `openclaw/clawsweeper`.

De workflow heeft vier lanes:

- `clawsweeper_item` voor exacte reviewverzoeken van issues en pull requests;
- `clawsweeper_comment` voor expliciete ClawSweeper-commando's in issue-opmerkingen;
- `clawsweeper_commit_review` voor reviewverzoeken op commitniveau bij pushes naar `main`;
- `github_activity` voor algemene GitHub-activiteit die de ClawSweeper-agent mag inspecteren.

De `github_activity`-lane stuurt alleen genormaliseerde metadata door: eventtype, actie, actor, repository, itemnummer, URL, titel, status en korte fragmenten voor opmerkingen of reviews wanneer aanwezig. Het vermijdt opzettelijk het doorsturen van de volledige webhook-body. De ontvangende workflow in `openclaw/clawsweeper` is `.github/workflows/github-activity.yml`, die het genormaliseerde event naar de OpenClaw Gateway-hook voor de ClawSweeper-agent post.

Algemene activiteit is observatie, geen standaardlevering. De ClawSweeper-agent ontvangt het Discord-doel in zijn prompt en moet alleen naar `#clawsweeper` posten wanneer het event verrassend, actiegericht, riskant of operationeel nuttig is. Routinematig openen, bewerken, bot-ruis, dubbele webhookruis en normaal reviewverkeer moeten resulteren in `NO_REPLY`.

Behandel GitHub-titels, opmerkingen, bodies, reviewtekst, branchnamen en commitberichten als onvertrouwde data in dit hele pad. Ze zijn input voor samenvatting en triage, geen instructies voor de workflow of agent-runtime.

## Handmatige dispatches

Handmatige CI-dispatches draaien dezelfde jobgraaf als normale CI, maar forceren elke niet-Android-scoped lane aan: Linux Node-shards, bundled-plugin-shards, plugin- en kanaalcontractshards, Node 22-compatibiliteit, `check-*`, `check-additional-*`, built-artifact-smokechecks, docs-checks, Python Skills, Windows, macOS, iOS-build en Control UI i18n. Losstaande handmatige CI-dispatches draaien Android alleen met `include_android=true`; de volledige release-umbrella schakelt Android in door `include_android=true` mee te geven. Statische checks voor plugin-prereleases, de release-only `agentic-plugins`-shard, de volledige extension-batchsweep en Docker-lanes voor plugin-prereleases zijn uitgesloten van CI. De Docker-prerelease-suite draait alleen wanneer `Full Release Validation` de aparte `Plugin Prerelease`-workflow dispatcht met de release-validation-gate ingeschakeld.

Handmatige runs gebruiken een unieke concurrency group zodat een volledige release-candidate-suite niet wordt geannuleerd door een andere push- of PR-run op dezelfde ref. Met de optionele `target_ref`-input kan een vertrouwde caller die graaf uitvoeren tegen een branch, tag of volledige commit-SHA terwijl het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                          | Jobs                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Handmatige CI-dispatch en fallbacks voor niet-canonieke repositories, CodeQL JavaScript/actions-kwaliteitsscans, workflow-sanity, labeler, auto-response, docs-workflows buiten CI en install-smoke-preflight zodat de Blacksmith-matrix eerder kan queuen                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, lichtere extension-shards, `checks-fast-core`, plugin-/kanaalcontractshards, de meeste gebundelde/lichtere Linux Node-shards, `check-guards`, `check-prod-types`, `check-test-types`, geselecteerde `check-additional-*`-shards en `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Behouden zware Linux Node-suites, boundary/extension-zware `check-additional-*`-shards en `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (CPU-gevoelig genoeg dat 8 vCPU meer kostte dan het bespaarde); install-smoke Docker-builds (32-vCPU wachtrijkosten kostten meer dan het bespaarde)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` op `openclaw/openclaw`; forks vallen terug op `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` en `ios-build` op `openclaw/openclaw`; forks vallen terug op `macos-26`                                                                                                                                                                                                  |

## Runner-registratiebudget

OpenClaw's huidige GitHub-runner-registratiebucket rapporteert 10.000 self-hosted
runner-registraties per 5 minuten in `ghx api rate_limit`. Controleer
`actions_runner_registration` opnieuw voor elke tuningronde, omdat GitHub deze
bucket kan wijzigen. De limiet wordt gedeeld door alle Blacksmith-runnerregistraties in de
`openclaw`-organisatie, dus het toevoegen van nog een Blacksmith-installatie voegt geen
nieuwe bucket toe.

Behandel Blacksmith-labels als de schaarse resource voor burstcontrole. Jobs die
alleen routeren, melden, samenvatten, shards selecteren of korte CodeQL-scans uitvoeren, moeten
op GitHub-hosted runners blijven, tenzij ze gemeten Blacksmith-specifieke
behoeften hebben. Elke nieuwe Blacksmith-matrix, grotere `max-parallel` of hoogfrequente
workflow moet zijn worst-case registratieaantal tonen en het org-level
doel onder ongeveer 60% van de live bucket houden. Met de huidige bucket van 10.000 registraties
betekent dat een operationeel doel van 6.000 registraties, met speelruimte voor
gelijktijdige repositories, retries en burst-overlap.

Canonieke-repo-CI houdt Blacksmith als het standaard runnerpad voor normale push- en pull-request-runs. `workflow_dispatch` en runs van niet-canonieke repositories gebruiken GitHub-hosted runners, maar normale canonieke runs peilen momenteel niet de gezondheid van de Blacksmith-wachtrij en vallen niet automatisch terug op GitHub-hosted labels wanneer Blacksmith niet beschikbaar is.

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

Handmatige dispatch benchmarkt normaal gesproken de workflow-ref. Stel `target_ref` in om een releasetag of een andere branch met de huidige workflowimplementatie te benchmarken. Gepubliceerde rapportpaden en latest-pointers worden gesleuteld op de geteste ref, en elke `index.md` registreert de geteste ref/SHA, workflow-ref/SHA, Kova-ref, profiel, lane-authmodus, model, herhalingsaantal en scenariofilters.

De workflow installeert OCM vanuit een vastgepinde release en Kova vanuit `openclaw/Kova` op de vastgepinde `kova_ref`-invoer, en voert vervolgens drie lanes uit:

- `mock-provider`: diagnostische Kova-scenario's tegen een lokaal gebouwde runtime met deterministische nep-auth die compatibel is met OpenAI.
- `mock-deep-profile`: CPU-/heap-/traceprofilering voor hotspots bij opstarten, Gateway en agent-turns.
- `live-openai-candidate`: een echte OpenAI `openai/gpt-5.5` agent-turn, overgeslagen wanneer `OPENAI_API_KEY` niet beschikbaar is.

De mock-provider-lane voert ook OpenClaw-native source-probes uit na de Kova-pass: Gateway-opstarttiming en geheugen voor standaard-, hook- en 50-Plugin-opstartgevallen; RSS van gebundelde Plugin-imports, herhaalde mock-OpenAI `channel-chat-baseline` hello-loops, CLI-opstartcommando's tegen de opgestarte Gateway, en de SQLite state-smoke-prestatieprobe. Wanneer het vorige gepubliceerde mock-provider-sourcerapport beschikbaar is voor de geteste ref, vergelijkt de sourcesamenvatting huidige RSS- en heapwaarden met die baseline en markeert grote RSS-stijgingen als `watch`. De Markdown-samenvatting van de source-probe staat op `source/index.md` in de rapportbundel, met ruwe JSON ernaast.

Elke lane uploadt GitHub-artifacts. Wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd, commit de workflow ook `report.json`, `report.md`, bundels, `index.md` en source-probe-artifacts naar `openclaw/clawgrit-reports` onder `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. De huidige tested-ref-pointer wordt geschreven als `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Volledige releasevalidatie

`Full Release Validation` is de handmatige overkoepelende workflow voor "alles uitvoeren vóór release." Deze accepteert een branch, tag of volledige commit-SHA, dispatcht de handmatige `CI`-workflow met dat doel, dispatcht `Plugin Prerelease` voor release-only Plugin-/package-/static-/Docker-bewijs, en dispatcht `OpenClaw Release Checks` voor install-smoke, package-acceptatie, cross-OS package-checks, rendering van maturity-scorecards vanuit QA-profielbewijs, QA Lab-pariteit, Matrix en Telegram-lanes. Stable- en full-profielen bevatten altijd uitgebreide live/E2E- en Docker-release-path-soak-dekking; het beta-profiel kan zich aanmelden met `run_release_soak=true`. De canonieke package Telegram E2E draait binnen Package Acceptance, dus een volledige kandidaat start geen dubbele live-poller. Geef na publicatie `release_package_spec` door om het verzonden npm-package opnieuw te gebruiken voor release checks, Package Acceptance, Docker, cross-OS en Telegram zonder opnieuw te bouwen. Gebruik `npm_telegram_package_spec` alleen voor een gerichte Telegram-herhaling met een gepubliceerd package. De live package-lane van de Codex-Plugin gebruikt standaard dezelfde geselecteerde staat: gepubliceerd `release_package_spec=openclaw@<tag>` leidt `codex_plugin_spec=npm:@openclaw/codex@<tag>` af, terwijl SHA-/artifact-runs `extensions/codex` packen vanuit de geselecteerde ref. Stel `codex_plugin_spec` expliciet in voor aangepaste Plugin-bronnen zoals `npm:`, `npm-pack:` of `git:`-specificaties.

Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
fasematrix, exacte workflowjobnamen, profielverschillen, artifacts en
handles voor gerichte herhalingen.

`OpenClaw Release Publish` is de handmatige muterende releaseworkflow. Dispatch deze
vanaf `release/YYYY.M.PATCH` of `main` nadat de releasetag bestaat en nadat de
OpenClaw npm-preflight is geslaagd. Deze verifieert `pnpm plugins:sync:check`,
dispatcht `Plugin NPM Release` voor alle publiceerbare Plugin-packages, dispatcht
`Plugin ClawHub Release` voor dezelfde release-SHA, en dispatcht pas daarna
`OpenClaw NPM Release` met de opgeslagen `preflight_run_id`. Stable-publicatie vereist ook
een exacte `windows_node_tag`; de workflow verifieert de Windows-sourcerelease
en vergelijkt de x64/ARM64-installers daarvan met de kandidaat-goedgekeurde
`windows_node_installer_digests`-invoer vóór enig publish-child, promoot
en verifieert vervolgens diezelfde vastgepinde installer-digests plus het exacte companion-asset
en checksum-contract voordat de GitHub-release-draft wordt gepubliceerd.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Gebruik voor bewijs van een vastgepinde commit op een snel bewegende branch de helper in plaats van
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow-dispatch-refs moeten branches of tags zijn, geen ruwe commit-SHA's. De
helper pusht een tijdelijke `release-ci/<sha>-...`-branch op de doel-SHA,
dispatcht `Full Release Validation` vanaf die vastgepinde ref, verifieert dat elke child-workflow
`headSha` overeenkomt met het doel, en verwijdert de tijdelijke branch wanneer de
run is voltooid. De overkoepelende verifier faalt ook als een child-workflow op een
andere SHA draaide.

`release_profile` bepaalt de live-/providerbreedte die wordt doorgegeven aan release checks. De
handmatige releaseworkflows gebruiken standaard `stable`; gebruik `full` alleen wanneer je
bewust de brede adviserende provider-/mediamatrix wilt. Stable- en full-
release checks voeren altijd de uitgebreide live/E2E- en Docker-release-path-soak uit;
het beta-profiel kan zich aanmelden met `run_release_soak=true`.

- `minimum` behoudt de snelste OpenAI-/core releasekritieke lanes.
- `stable` voegt de stable provider-/backendset toe.
- `full` voert de brede adviserende provider-/mediamatrix uit.

De umbrella registreert de gedispatchte child-run-id's, en de laatste `Verify full validation`-job controleert de huidige conclusies van child-runs opnieuw en voegt tabellen met langzaamste jobs toe voor elke child-run. Als een child-workflow opnieuw wordt uitgevoerd en groen wordt, voer dan alleen de parent verifier-job opnieuw uit om het umbrella-resultaat en de timingsamenvatting te vernieuwen.

Voor herstel accepteren zowel `Full Release Validation` als `OpenClaw Release Checks` `rerun_group`. Gebruik `all` voor een releasekandidaat, `ci` voor alleen de normale volledige CI-child, `plugin-prerelease` voor alleen de Plugin-prerelease-child, `release-checks` voor elke release-child, of een smallere groep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` of `npm-telegram` op de umbrella. Dit houdt een herhaling van een mislukte releasebox begrensd na een gerichte fix. Combineer voor één mislukte cross-OS-lane `rerun_group=cross-os` met `cross_os_suite_filter`, bijvoorbeeld `windows/packaged-upgrade`; lange cross-OS-commando's geven Heartbeat-regels en packaged-upgrade-samenvattingen bevatten timings per fase. QA release-check-lanes zijn adviserend, behalve de standaard runtime tool coverage gate, die blokkeert wanneer vereiste dynamische OpenClaw-tools afwijken of verdwijnen uit de standaardtiersamenvatting.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde ref eenmaal op te lossen naar een `release-package-under-test`-tarball, en geeft dat artifact vervolgens door aan cross-OS-checks en Package Acceptance, plus de live/E2E release-path Docker-workflow wanneer soak-dekking draait. Dat houdt de package-bytes consistent over releaseboxen heen en voorkomt dat dezelfde kandidaat in meerdere child-jobs opnieuw wordt gepackt. Voor de Codex npm-Plugin live-lane geven release checks ofwel een overeenkomende gepubliceerde Plugin-specificatie door die is afgeleid van `release_package_spec`, ofwel de door de operator opgegeven `codex_plugin_spec`, of laten ze de invoer leeg zodat het Docker-script de Codex-Plugin van de geselecteerde checkout packt.

Dubbele `Full Release Validation`-runs voor `ref=main` en `rerun_group=all`
vervangen de oudere umbrella. De parent-monitor annuleert elke child-workflow die hij
al heeft gedispatcht wanneer de parent wordt geannuleerd, zodat nieuwere main-validatie
niet achter een verouderde twee uur durende release-check-run blijft staan. Validatie van releasebranches/-tags
en gerichte rerun-groepen houden `cancel-in-progress: false`.

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
- gesplitste audio-/videoshards voor media en provider-gefilterde muziekshards

Dat behoudt dezelfde bestandsdekking en maakt trage live-providerfouten makkelijker opnieuw uit te voeren en te diagnosticeren. De aggregate shardnamen `native-live-extensions-o-z`, `native-live-extensions-media` en `native-live-extensions-media-music` blijven geldig voor handmatige eenmalige herhalingen.

De native live-mediashards draaien in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de `Live Media Runner Image`-workflow. Die image installeert `ffmpeg` en `ffprobe` vooraf; mediajobs verifiëren alleen de binaries vóór setup. Houd Docker-backed live-suites op normale Blacksmith-runners — containerjobs zijn de verkeerde plek om geneste Docker-tests te starten.

Door Docker ondersteunde live model-/backend-shards gebruiken een aparte gedeelde `ghcr.io/openclaw/openclaw-live-test:<sha>`-image per geselecteerde commit. De live release-workflow bouwt en pusht die image eenmaal, waarna de Docker live model-, provider-gesharde Gateway-, CLI-backend-, ACP-bind- en Codex-harness-shards draaien met `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker-shards hebben expliciete `timeout`-limieten op scriptniveau onder de workflowtaak-time-out, zodat een vastgelopen container of opschoningspad snel faalt in plaats van het volledige budget voor releasecontroles te verbruiken. Als die shards de volledige source-Docker-target onafhankelijk opnieuw bouwen, is de release-run verkeerd geconfigureerd en verspilt deze wandkloktijd aan dubbele image-builds.

## Pakketacceptatie

Gebruik `Package Acceptance` wanneer de vraag is: "werkt dit installeerbare OpenClaw-pakket als product?" Dit verschilt van normale CI: normale CI valideert de source tree, terwijl pakketacceptatie één tarball valideert via dezelfde Docker E2E-harness die gebruikers na installatie of update gebruiken.

### Taken

1. `resolve_package` checkt `workflow_ref` uit, lost één pakketkandidaat op, schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het `package-under-test`-artifact, en toont de bron, workflow-ref, pakket-ref, versie, SHA-256 en profiel in de GitHub-stapsamenvatting.
2. `docker_acceptance` roept `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt dat artifact, valideert de tarball-inventaris, bereidt package-digest Docker-images voor wanneer nodig, en voert de geselecteerde Docker-lanes uit tegen dat pakket in plaats van de workflow-checkout te packen. Wanneer een profiel meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het pakket en de gedeelde images eenmaal voor, en fan-out die lanes daarna als parallelle gerichte Docker-taken met unieke artifacts.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Dit draait wanneer `telegram_mode` niet `none` is en installeert hetzelfde `package-under-test`-artifact wanneer pakketacceptatie er een heeft opgelost; standalone Telegram-dispatch kan nog steeds een gepubliceerde npm-specificatie installeren.
4. `summary` laat de workflow falen als pakketresolutie, Docker-acceptatie of de optionele Telegram-lane is mislukt.

### Kandidaatbronnen

- `source=npm` accepteert alleen `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor gepubliceerde prerelease-/stabiele acceptatie.
- `source=ref` packt een vertrouwde `package_ref`-branch, tag of volledige commit-SHA. De resolver haalt OpenClaw-branches/-tags op, verifieert dat de geselecteerde commit bereikbaar is vanuit de repository-branchgeschiedenis of een release-tag, installeert dependencies in een detached worktree en packt deze met `scripts/package-openclaw-for-docker.mjs`.
- `source=url` downloadt een openbare HTTPS-`.tgz`; `package_sha256` is vereist. Dit pad weigert URL-credentials, niet-standaard HTTPS-poorten, private/interne/special-use hostnames of opgeloste IP's, en redirects buiten hetzelfde openbare veiligheidsbeleid.
- `source=trusted-url` downloadt een HTTPS-`.tgz` vanuit een benoemd trusted-source-beleid in `.github/package-trusted-sources.json`; `package_sha256` en `trusted_source_id` zijn vereist. Gebruik dit alleen voor door maintainers beheerde enterprise-mirrors of private package repositories die geconfigureerde hosts, poorten, padprefixen, redirect-hosts of private-network-resolutie nodig hebben. Als het beleid bearer-auth declareert, gebruikt de workflow het vaste `OPENCLAW_TRUSTED_PACKAGE_TOKEN`-secret; in de URL ingesloten credentials worden nog steeds geweigerd.
- `source=artifact` downloadt één `.tgz` van `artifact_run_id` en `artifact_name`; `package_sha256` is optioneel, maar moet worden opgegeven voor extern gedeelde artifacts.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde workflow-/harness-code die de test uitvoert. `package_ref` is de source-commit die wordt gepackt wanneer `source=ref`. Hierdoor kan de huidige testharness oudere vertrouwde source-commits valideren zonder oude workflowlogica uit te voeren.

### Suiteprofielen

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — volledige Docker release-path-chunks met OpenWebUI
- `custom` — exacte `docker_lanes`; vereist wanneer `suite_profile=custom`

Het `package`-profiel gebruikt offline plugin-dekking zodat gepubliceerde-pakketvalidatie niet afhankelijk is van live ClawHub-beschikbaarheid. De optionele Telegram-lane hergebruikt het `package-under-test`-artifact in `NPM Telegram Beta E2E`, waarbij het pad voor de gepubliceerde npm-specificatie behouden blijft voor standalone dispatches.

Voor het specifieke testbeleid voor updates en plugins, inclusief lokale commando's,
Docker-lanes, pakketacceptatie-invoer, release-standaarden en fouttriage,
zie [Updates en plugins testen](/nl/help/testing-updates-plugins).

Releasecontroles roepen pakketacceptatie aan met `source=artifact`, het voorbereide releasepakket-artifact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` en `telegram_mode=mock-openai`. Dit houdt pakketmigratie, update, live ClawHub skill-installatie, opschoning van verouderde plugin-dependencies, reparatie van geconfigureerde-plugin-installatie, offline plugin, plugin-update en Telegram-bewijs op dezelfde opgeloste pakket-tarball. Stel `release_package_spec` in op Full Release Validation of OpenClaw Release Checks na het publiceren van een beta om dezelfde matrix tegen het verzonden npm-pakket uit te voeren zonder opnieuw te bouwen; stel `package_acceptance_package_spec` alleen in wanneer pakketacceptatie een ander pakket nodig heeft dan de rest van releasevalidatie. Cross-OS-releasecontroles dekken nog steeds OS-specifieke onboarding, installer en platformgedrag; productvalidatie voor pakketten/updates moet beginnen met pakketacceptatie. De `published-upgrade-survivor` Docker-lane valideert één gepubliceerde pakketbaseline per run in het blokkerende releasepad. In pakketacceptatie is de opgeloste `package-under-test`-tarball altijd de kandidaat en selecteert `published_upgrade_survivor_baseline` de fallback gepubliceerde baseline, standaard `openclaw@latest`; rerun-commando's voor mislukte lanes behouden die baseline. Full Release Validation met `run_release_soak=true` of `release_profile=full` stelt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` en `published_upgrade_survivor_scenarios=reported-issues` in om uit te breiden over de vier nieuwste stabiele npm-releases plus gepinde grensreleases voor plugin-compatibiliteit en issue-vormige fixtures voor Feishu-configuratie, behouden bootstrap-/persona-bestanden, geconfigureerde OpenClaw-plugin-installaties, tilde-logpaden en verouderde legacy plugin dependency-roots. Multi-baseline published-upgrade-survivor-selecties worden per baseline geshard naar afzonderlijke gerichte Docker-runner-taken. De afzonderlijke `Update Migration`-workflow gebruikt de `update-migration` Docker-lane met `all-since-2026.4.23` en `plugin-deps-cleanup` wanneer de vraag uitputtende opschoning van gepubliceerde updates is, niet de normale breedte van Full Release CI. Lokale aggregaatruns kunnen exacte pakketspecificaties doorgeven met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, één lane behouden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` zoals `openclaw@2026.4.15`, of `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` instellen voor de scenariomatrix. De gepubliceerde lane configureert de baseline met een ingebakken `openclaw config set`-commandorecept, registreert receptstappen in `summary.json`, en controleert `/healthz`, `/readyz` plus RPC-status na Gateway-start. De nieuwe lanes voor Windows packaged en installer verifiëren ook dat een geïnstalleerd pakket een browser-control override kan importeren vanuit een onbewerkt absoluut Windows-pad. De OpenAI cross-OS agent-turn smoke gebruikt standaard `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer ingesteld, anders `openai/gpt-5.5`, zodat het installatie- en Gateway-bewijs op een GPT-5-testmodel blijft en GPT-4.x-standaarden worden vermeden.

### Legacy compatibiliteitsvensters

Pakketacceptatie heeft begrensde legacy-compatibiliteitsvensters voor al gepubliceerde pakketten. Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen het compatibiliteitspad gebruiken:

- bekende private QA-vermeldingen in `dist/postinstall-inventory.json` mogen verwijzen naar bestanden die uit de tarball zijn weggelaten;
- `doctor-switch` mag de subcase voor `gateway install --wrapper`-persistentie overslaan wanneer het pakket die flag niet exposeert;
- `update-channel-switch` mag ontbrekende pnpm `patchedDependencies` uit de van de tarball afgeleide fake git-fixture verwijderen en mag ontbrekende gepersisteerde `update.channel` loggen;
- plugin-smokes mogen legacy install-record-locaties lezen of ontbrekende marketplace install-record-persistentie accepteren;
- `plugin-update` mag configmetadatamigratie toestaan, terwijl nog steeds wordt vereist dat het install record en no-reinstall-gedrag ongewijzigd blijven.

Het gepubliceerde `2026.4.26`-pakket mag ook waarschuwen voor lokale build metadata stamp-bestanden die al zijn verzonden. Latere pakketten moeten aan de moderne contracten voldoen; dezelfde voorwaarden falen dan in plaats van te waarschuwen of over te slaan.

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

Begin bij het debuggen van een mislukte pakketacceptatie-run met de `resolve_package`-samenvatting om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de `docker_acceptance`-child-run en de Docker-artifacts daarvan: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logs, fasetimings en rerun-commando's. Geef de voorkeur aan het opnieuw uitvoeren van het mislukte pakketprofiel of de exacte Docker-lanes boven het opnieuw uitvoeren van volledige releasevalidatie.

## Installatiesmoke

De afzonderlijke `Install Smoke`-workflow hergebruikt hetzelfde scopescript via zijn eigen `preflight`-taak. Deze splitst smoke-dekking in `run_fast_install_smoke` en `run_full_install_smoke`.

- **Snel pad** wordt uitgevoerd voor pull requests die Docker-/package-oppervlakken, wijzigingen in gebundelde Plugin-packages/-manifesten, of core plugin-/kanaal-/gateway-/Plugin SDK-oppervlakken raken die door de Docker-smokejobs worden getest. Wijzigingen alleen in broncode van gebundelde Plugins, wijzigingen alleen in tests, en wijzigingen alleen in documentatie reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image eenmaal, controleert de CLI, voert de agents-delete-shared-workspace CLI-smoke uit, voert de container gateway-network e2e uit, verifieert een build-argument voor een gebundelde extension, en voert het begrensde gebundelde-Plugin Docker-profiel uit onder een totale commandotime-out van 240 seconden (elke Docker-run van een scenario wordt afzonderlijk begrensd).
- **Volledig pad** behoudt QR-package-installatie en installer-Docker-/updatedekking voor nachtelijke geplande runs, handmatige dispatches, workflow-call releasecontroles, en pull requests die daadwerkelijk installer-/package-/Docker-oppervlakken raken. In volledige modus bereidt install-smoke één target-SHA GHCR root-Dockerfile-smoke-image voor of hergebruikt die, en voert daarna QR-package-installatie, root-Dockerfile-/gateway-smokes, installer-/updatesmokes, en de snelle gebundelde-Plugin Docker E2E uit als afzonderlijke jobs, zodat installerwerk niet hoeft te wachten op de root-image-smokes.

`main`-pushes (inclusief mergecommits) forceren het volledige pad niet; wanneer changed-scope-logica volledige dekking op een push zou aanvragen, behoudt de workflow de snelle Docker-smoke en laat hij de volledige install-smoke over aan nachtelijke of releasevalidatie.

De trage Bun global install image-provider-smoke wordt afzonderlijk bewaakt door `run_bun_global_install_smoke`. Deze draait volgens het nachtelijke schema en vanuit de workflow voor releasecontroles, en handmatige `Install Smoke`-dispatches kunnen ervoor kiezen deze mee te nemen, maar pull requests en `main`-pushes doen dat niet. Normale PR-CI voert nog steeds de snelle Bun launcher-regressielane uit voor Node-relevante wijzigingen. QR- en installer-Docker-tests behouden hun eigen installatiegerichte Dockerfiles.

## Lokale Docker E2E

`pnpm test:docker:all` prebuildt één gedeelde live-test-image, pakt OpenClaw eenmaal in als npm-tarball, en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images:

- een kale Node/Git-runner voor installer-/update-/plugin-dependency-lanes;
- een functionele image die dezelfde tarball installeert in `/app` voor normale functionaliteitslanes.

Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en voert daarna lanes uit met `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Instelbare waarden

| Variabele                              | Standaard | Doel                                                                                          |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Aantal slots in de hoofdpool voor normale lanes.                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Aantal slots in de providergevoelige tail-pool.                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limiet voor gelijktijdige live lanes zodat providers niet throttlen.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5         | Limiet voor gelijktijdige npm-installatielanes.                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limiet voor gelijktijdige multi-service-lanes.                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Spreiding tussen lane-starts om create-stormen in de Docker-daemon te voorkomen; stel in op `0` voor geen spreiding. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Fallbacktime-out per lane (120 minuten); geselecteerde live-/tail-lanes gebruiken strengere limieten. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | niet ingesteld | `1` print het schedulerplan zonder lanes uit te voeren.                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | niet ingesteld | Door komma's gescheiden exacte lanelijst; slaat cleanup-smoke over zodat agents één mislukte lane kunnen reproduceren. |

Een lane die zwaarder is dan zijn effectieve limiet kan nog steeds starten vanuit een lege pool, en draait daarna alleen totdat hij capaciteit vrijgeeft. De lokale totale preflights controleren Docker, verwijderen verouderde OpenClaw E2E-containers, geven actieve-lane-status uit, bewaren lanetimings voor longest-first-volgorde, en stoppen standaard met het plannen van nieuwe gepoolde lanes na de eerste fout.

### Herbruikbare live-/E2E-workflow

De herbruikbare live-/E2E-workflow vraagt `scripts/test-docker-all.mjs --plan-json` welke package-, image-soort, live-image-, lane- en credentialdekking vereist is. `scripts/docker-e2e.mjs` zet dat plan vervolgens om naar GitHub-outputs en samenvattingen. Deze pakt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een package-artifact van de huidige run, of downloadt een package-artifact uit `package_artifact_run_id`; valideert de tarball-inventaris; bouwt en pusht package-digest-getagde kale/functionele GHCR Docker E2E-images via Blacksmith's Docker-laagcache wanneer het plan lanes met geïnstalleerde packages nodig heeft; en hergebruikt opgegeven `docker_e2e_bare_image`-/`docker_e2e_functional_image`-inputs of bestaande package-digest-images in plaats van opnieuw te bouwen. Docker-image-pulls worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry-/cachestream snel opnieuw probeert in plaats van het grootste deel van het kritieke CI-pad te verbruiken.

### Releasepad-chunks

Release-Dockerdekking draait kleinere gechunkte jobs met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elke chunk alleen de benodigde image-soort pullt en meerdere lanes via dezelfde gewogen scheduler uitvoert:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

De huidige release-Dockerchunks zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, en `plugins-runtime-install-a` tot en met `plugins-runtime-install-h`. `package-update-openai` bevat de live Codex Plugin-package-lane, die het kandidaat-OpenClaw-package installeert, de Codex Plugin installeert vanuit `codex_plugin_spec` of een same-ref-tarball met expliciete goedkeuring voor Codex CLI-installatie, Codex CLI-preflight draait, en daarna meerdere OpenClaw-agentbeurten in dezelfde sessie tegen OpenAI uitvoert. `plugins-runtime-core`, `plugins-runtime`, en `plugins-integrations` blijven overkoepelende plugin-/runtime-aliassen. De `install-e2e`-lane-alias blijft de overkoepelende handmatige rerun-alias voor beide provider-installerlanes.

OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige releasepaddekking dit aanvraagt, en behoudt alleen een zelfstandige `openwebui`-chunk voor dispatches die alleen OpenWebUI betreffen. Bundled-channel-updatelanes proberen eenmaal opnieuw bij tijdelijke npm-netwerkfouten.

Elke chunk uploadt `.artifacts/docker-tests/` met lanelogs, timings, `summary.json`, `failures.json`, fasetimings, schedulerplan-JSON, tabellen met trage lanes, en rerun-commands per lane. De workflowinput `docker_lanes` voert geselecteerde lanes uit tegen de voorbereide images in plaats van de chunkjobs, waardoor foutopsporing voor mislukte lanes beperkt blijft tot één gerichte Docker-job en het package-artifact voor die run wordt voorbereid, gedownload of hergebruikt; als een geselecteerde lane een live Docker-lane is, bouwt de gerichte job de live-test-image lokaal voor die rerun. Gegenereerde GitHub-rerun-commands per lane bevatten `package_artifact_run_id`, `package_artifact_name`, en voorbereide image-inputs wanneer die waarden bestaan, zodat een mislukte lane exact hetzelfde package en dezelfde images uit de mislukte run kan hergebruiken.

```bash
pnpm test:docker:rerun <run-id>      # download Docker-artifacts en print gecombineerde/gerichte rerun-commands per lane
pnpm test:docker:timings <summary>   # samenvattingen van trage lanes en het kritieke pad per fase
```

De geplande live-/E2E-workflow voert dagelijks de volledige releasepad-Docker-suite uit.

## Plugin Prerelease

`Plugin Prerelease` is duurdere product-/packagedekking, dus dit is een afzonderlijke workflow die wordt gedispatcht door `Full Release Validation` of door een expliciete operator. Normale pull requests, `main`-pushes, en zelfstandige handmatige CI-dispatches houden die suite uitgeschakeld. Deze verdeelt gebundelde Plugin-tests over acht extension-workers; die extension-shardjobs voeren maximaal twee pluginconfiguratiegroepen tegelijk uit met één Vitest-worker per groep en een grotere Node-heap, zodat importzware Plugin-batches geen extra CI-jobs veroorzaken. Het release-only Docker-prereleasepad batched gerichte Docker-lanes in kleine groepen om te voorkomen dat tientallen runners worden gereserveerd voor jobs van één tot drie minuten. De workflow uploadt ook een informatief `plugin-inspector-advisory`-artifact van `@openclaw/plugin-inspector`; inspectorbevindingen zijn triage-input en wijzigen de blokkerende Plugin Prerelease-gate niet.

## QA Lab

QA Lab heeft toegewezen CI-lanes buiten de belangrijkste smart-scoped workflow. Agentic parity is genest onder de brede QA- en releaseharnassen, niet als zelfstandige PR-workflow. Gebruik `Full Release Validation` met `rerun_group=qa-parity` wanneer parity moet meelopen met een brede validatierun.

- De workflow `QA-Lab - All Lanes` draait elke nacht op `main` en bij handmatige dispatch; deze waaiert de mock parity-lane, live Matrix-lane, en live Telegram- en Discord-lanes uit als parallelle jobs. Live jobs gebruiken de omgeving `qa-live-shared`, en Telegram/Discord gebruiken Convex-leases.

Releasecontroles voeren Matrix- en Telegram-live-transportlanes uit met de deterministische mockprovider en mock-gekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het kanaalcontract geïsoleerd is van live-modellatentie en normale opstart van provider-Plugins. De live-transport-Gateway schakelt memory search uit omdat QA parity geheugengedrag afzonderlijk dekt; providerconnectiviteit wordt gedekt door de afzonderlijke live model-, native provider- en Docker-provider-suites.

Matrix gebruikt `--profile fast` voor geplande en release-gates, en voegt `--fail-fast` alleen toe wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaard en handmatige workflowinput blijven `all`; handmatige `matrix_profile=all`-dispatch shardt volledige Matrix-dekking altijd in `transport`-, `media`-, `e2ee-smoke`-, `e2ee-deep`- en `e2ee-cli`-jobs.

`OpenClaw Release Checks` voert ook de releasekritieke QA Lab-lanes uit vóór releasegoedkeuring; de QA parity-gate draait de kandidaat- en baselinepacks als parallelle lanejobs, en downloadt daarna beide artifacts naar een kleine rapportjob voor de uiteindelijke parity-vergelijking.

Volg voor normale PR's scoped CI-/checkbewijs in plaats van parity als vereiste status te behandelen.

## CodeQL

De `CodeQL`-workflow is bewust een smalle eerste securityscan, niet de volledige repositorysweep. Dagelijkse, handmatige, en niet-concept pull request-guard-runs scannen Actions-workflowcode plus de JavaScript-/TypeScript-oppervlakken met het hoogste risico met high-confidence securityqueries gefilterd op hoge/kritieke `security-severity`.

De pull request-guard blijft licht: hij start alleen voor wijzigingen onder `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src`, of procesbezittende runtimepaden van gebundelde Plugins, en draait dezelfde high-confidence securitymatrix als de geplande workflow. Android en macOS CodeQL blijven buiten PR-standaarden.

### Beveiligingscategorieën

| Categorie                                        | Oppervlak                                                                                                                           |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, geheimen, sandbox, Cron en Gateway-baseline                                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | Core-channelimplementatiecontracten plus de runtime van de channel-Plugin, Gateway, Plugin SDK, geheimen en audit-aanraakpunten     |
| `/codeql-security-high/network-ssrf-boundary`     | Core-SSRF, IP-parsing, netwerkbewaking, web-fetch en SSRF-beleidsoppervlakken van de Plugin SDK                                     |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-servers, helpers voor procesuitvoering, uitgaande levering en agent-gates voor tooluitvoering                                   |
| `/codeql-security-high/process-exec-boundary`     | Lokale shell, helpers voor het starten van processen, subprocess-eigenaar runtimes van gebundelde Plugins en workflow-scriptlijm     |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-installatie, loader, manifest, register, pakketbeheerinstallatie, bronladen en vertrouwensoppervlakken van het Plugin SDK-pakketcontract |

### Platformspecifieke security-shards

- `CodeQL Android Critical Security` — geplande Android-security-shard. Bouwt de Android-app handmatig voor CodeQL op de kleinste Blacksmith Linux-runner die door workflow-sanity wordt geaccepteerd. Uploadt onder `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — wekelijkse/handmatige macOS-security-shard. Bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert buildresultaten van afhankelijkheden uit de geüploade SARIF en uploadt onder `/codeql-critical-security/macos`. Buiten de dagelijkse defaults gehouden omdat de macOS-build de runtime domineert, zelfs wanneer deze schoon is.

### Critical Quality-categorieën

`CodeQL Critical Quality` is de bijbehorende niet-security-shard. Deze voert alleen JavaScript/TypeScript-kwaliteitsqueries zonder security en met foutseverity uit over smalle oppervlakken met hoge waarde op door GitHub gehoste Linux-runners, zodat kwaliteitsscans geen Blacksmith-runnerregistratiebudget verbruiken. De pull-request-gate is bewust kleiner dan het geplande profiel: niet-draft-PR's draaien alleen de bijbehorende `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` en `plugin-sdk-reply-runtime` shards voor agent-command/model/tooluitvoering en reply-dispatchcode, config-schema/migratie/IO-code, auth/geheimen/sandbox/security-code, core-channel en gebundelde channel-Plugin-runtime, Gateway-protocol/servermethode, memory-runtime/SDK-lijm, MCP/proces/uitgaande levering, provider-runtime/modelcatalogus, sessiediagnostiek/leveringswachtrijen, Plugin-loader, Plugin SDK/pakketcontract of wijzigingen in de reply-runtime van de Plugin SDK. Wijzigingen in CodeQL-config en quality-workflow draaien alle twaalf PR-quality-shards.

Handmatige dispatch accepteert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

De smalle profielen zijn onderwijs-/iteratiehooks om één quality-shard geïsoleerd te draaien.

| Categorie                                              | Oppervlak                                                                                                                                                      |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, geheimen, sandbox, Cron en code voor de Gateway-securitygrens                                                                                           |
| `/codeql-critical-quality/config-boundary`              | Config-schema, migratie, normalisatie en IO-contracten                                                                                                        |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-protocolschema's en servermethodecontracten                                                                                                           |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementatiecontracten voor core-channel en gebundelde channel-Plugin                                                                                        |
| `/codeql-critical-quality/agent-runtime-boundary`       | Command-uitvoering, model/provider-dispatch, auto-reply-dispatch en wachtrijen, en ACP-runtimecontracten voor het control plane                                |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-servers en toolbridges, helpers voor procesbewaking en contracten voor uitgaande levering                                                                  |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host-SDK, memory-runtimefacades, memory-aliassen van de Plugin SDK, activeringslijm voor memory-runtime en memory doctor-commands                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interne reply-wachtrijlogica, sessieleveringswachtrijen, helpers voor uitgaande sessiebinding/-levering, oppervlakken voor diagnostische event/logbundels en CLI-contracten voor sessie-doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Inkomende reply-dispatch van de Plugin SDK, helpers voor reply-payload/chunking/runtime, channel-replyopties, leveringswachtrijen en helpers voor sessie-/threadbinding |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisatie van modelcatalogus, provider-auth en -discovery, provider-runtime-registratie, provider-defaults/catalogi en web/search/fetch/embedding-registers |
| `/codeql-critical-quality/ui-control-plane`             | Control UI-bootstrap, lokale persistentie, Gateway-controlflows en runtimecontracten voor het taak-control-plane                                               |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web-fetch/search, media-IO, media-understanding, image-generation en runtimecontracten voor media-generation                                              |
| `/codeql-critical-quality/plugin-boundary`              | Loader, register, public-surface en entrypointcontracten van de Plugin SDK                                                                                    |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Gepubliceerde pakket-side Plugin SDK-bron en helpers voor het Plugin-pakketcontract                                                                            |

Quality blijft gescheiden van security, zodat quality-bevindingen kunnen worden gepland, gemeten, uitgeschakeld of uitgebreid zonder het security-signaal te vertroebelen. Uitbreiding van CodeQL voor Swift, Python en gebundelde Plugins moet alleen als gescopeerd of geshard vervolgwerk worden teruggebracht nadat de smalle profielen een stabiele runtime en stabiel signaal hebben.

## Onderhoudsworkflows

### Docs Agent

De `Docs Agent`-workflow is een event-driven Codex-onderhoudslane om bestaande docs uitgelijnd te houden met recent gelande wijzigingen. Deze heeft geen zuivere planning: een succesvolle niet-bot push-CI-run op `main` kan deze triggeren, en handmatige dispatch kan deze direct draaien. Workflow-run-aanroepen worden overgeslagen wanneer `main` is doorgeschoven of wanneer er in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is aangemaakt. Wanneer de workflow draait, beoordeelt deze het commitbereik van de vorige niet-overgeslagen Docs Agent-bron-SHA tot de huidige `main`, zodat één uurlijkse run alle main-wijzigingen kan dekken die sinds de laatste docs-pass zijn verzameld.

### Test Performance Agent

De `Test Performance Agent`-workflow is een event-driven Codex-onderhoudslane voor trage tests. Deze heeft geen zuivere planning: een succesvolle niet-bot push-CI-run op `main` kan deze triggeren, maar hij slaat over als er die UTC-dag al een andere workflow-run-aanroep is gedraaid of draait. Handmatige dispatch omzeilt die dagelijkse activiteitsgate. De lane bouwt een gegroepeerd Vitest-prestatierapport voor de volledige suite, laat Codex alleen kleine testprestatieverbeteringen maken die coverage behouden in plaats van brede refactors, draait daarna het volledige-suite-rapport opnieuw en wijst wijzigingen af die het aantal passerende baselinetests verlagen. Het gegroepeerde rapport registreert per config wandtijd en maximale RSS op Linux en macOS, zodat de voor/na-vergelijking testgeheugendelta's naast duurtijddelta's toont. Als de baseline falende tests heeft, mag Codex alleen duidelijke failures fixen en moet het volledige-suite-rapport na de agent slagen voordat er iets wordt gecommit. Wanneer `main` doorgaat voordat de bot-push landt, rebased de lane de gevalideerde patch, draait `pnpm check:changed` opnieuw en probeert de push opnieuw; conflicterende stale patches worden overgeslagen. Deze gebruikt door GitHub gehoste Ubuntu zodat de Codex-action dezelfde drop-sudo-veiligheidshouding kan behouden als de docs-agent.

### Duplicate PRs After Merge

De `Duplicate PRs After Merge`-workflow is een handmatige maintainer-workflow voor duplicaatopschoning na landing. Deze staat standaard op dry-run en sluit alleen expliciet vermelde PR's wanneer `apply=true`. Voordat GitHub wordt gemuteerd, verifieert deze dat de gelande PR is gemerged en dat elk duplicaat óf een gedeeld gerefereerd issue heeft óf overlappende gewijzigde hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale check-gates en changed-routing

Lokale changed-lane-logica staat in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale check-gate is strenger over architectuurgrenzen dan de brede CI-platformscope:

- core-productiewijzigingen draaien core-prod- en core-test-typecheck plus core-lint/guards;
- wijzigingen alleen in core-tests draaien alleen core-test-typecheck plus core-lint;
- extension-productiewijzigingen draaien extension-prod- en extension-test-typecheck plus extension-lint;
- wijzigingen alleen in extension-tests draaien extension-test-typecheck plus extension-lint;
- wijzigingen in publieke Plugin SDK of Plugin-contract breiden uit naar extension-typecheck omdat extensions van die core-contracten afhangen (Vitest-extension-sweeps blijven expliciet testwerk);
- versiebumps met alleen release-metadata draaien gerichte versie-/config-/root-afhankelijkheidschecks;
- onbekende root-/config-wijzigingen falen veilig naar alle check-lanes.

Lokale changed-test-routing staat in `scripts/test-projects.test-support.mjs` en is bewust goedkoper dan `check:changed`: directe testbewerkingen draaien zichzelf, bronbewerkingen geven de voorkeur aan expliciete mappings, daarna sibling-tests en import-graph-afhankelijken. Gedeelde delivery-config voor group-room is een van de expliciete mappings: wijzigingen aan de group-zichtbare reply-config, source-reply-deliverymodus of de message-tool-systemprompt lopen via de core-replytests plus Discord- en Slack-deliveryregressies, zodat een gedeelde defaultwijziging faalt vóór de eerste PR-push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging harness-breed genoeg is dat de goedkope gemapte set geen betrouwbare proxy is.

## Testbox-validatie

Crabbox is de door de repo beheerde remote-box-wrapper voor Linux-bewijs van maintainers. Gebruik het
vanuit de repo-root wanneer een check te breed is voor een lokale edit-loop, wanneer CI-pariteit
van belang is, of wanneer het bewijs secrets, Docker, package-lanes,
herbruikbare boxes of remote logs nodig heeft. De normale OpenClaw-backend is
`blacksmith-testbox`; beheerde AWS/Hetzner-capaciteit is een fallback voor Blacksmith-storingen,
quotaproblemen of expliciete tests met beheerde capaciteit.

Door Crabbox ondersteunde Blacksmith-runs warmen one-shot Testboxes op, claimen ze, synchroniseren, voeren uit, rapporteren en ruimen op.
De ingebouwde sync-sanitycheck faalt snel wanneer vereiste
rootbestanden zoals `pnpm-lock.yaml` verdwijnen of wanneer `git status --short`
minstens 200 getrackte verwijderingen toont. Stel voor bewuste PR's met veel verwijderingen
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor de remote command.

Crabbox beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de
sync-fase blijft zonder post-sync-uitvoer. Stel
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` in om die beveiliging uit te schakelen, of gebruik een grotere
millisecondenwaarde voor ongebruikelijk grote lokale diffs.

Controleer vóór een eerste run de wrapper vanuit de repo-root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

De repo-wrapper weigert een verouderde Crabbox-binary die `blacksmith-testbox` niet adverteert. Geef de provider expliciet door, ook al heeft `.crabbox.yaml` standaardinstellingen voor owned-cloud. Vermijd in Codex-worktrees of gekoppelde/sparse checkouts het lokale `pnpm crabbox:run`-script, omdat pnpm afhankelijkheden kan reconciliëren voordat Crabbox start; roep in plaats daarvan de node-wrapper direct aan:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Door Blacksmith ondersteunde runs vereisen Crabbox 0.22.0 of nieuwer, zodat de wrapper het huidige Testbox-sync-, queue- en opruimgedrag krijgt. Wanneer je de sibling-checkout gebruikt, rebuild dan de genegeerde lokale binary vóór timing- of bewijswerk:

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

Lees de uiteindelijke JSON-samenvatting. De nuttige velden zijn `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` en `totalMs`. Voor gedelegeerde
Blacksmith Testbox-runs zijn de exitcode van de Crabbox-wrapper en de JSON-samenvatting het
commandresultaat. De gekoppelde GitHub Actions-run beheert hydration en keepalive; die
kan eindigen als `cancelled` wanneer de Testbox extern wordt gestopt nadat de SSH-command
al is teruggekeerd. Behandel dat als een opruim-/statusartefact, tenzij
de wrapper-`exitCode` niet nul is of de commanduitvoer een mislukte test toont.
One-shot door Blacksmith ondersteunde Crabbox-runs moeten de Testbox automatisch stoppen;
als een run wordt onderbroken of opruiming onduidelijk is, inspecteer dan live boxes en stop alleen
de boxes die je hebt aangemaakt:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Gebruik hergebruik alleen wanneer je bewust meerdere commands op dezelfde gehydrateerde box nodig hebt:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Als Crabbox de defecte laag is maar Blacksmith zelf werkt, gebruik directe
Blacksmith alleen voor diagnostiek zoals `list`, `status` en opruiming. Fix het
Crabbox-pad voordat je een directe Blacksmith-run als maintainer-bewijs beschouwt.

Als `blacksmith testbox list --all` en `blacksmith testbox status` werken maar nieuwe
warmups na een paar minuten `queued` blijven zonder IP of Actions-run-URL,
behandel dit dan als druk door de Blacksmith-provider, queue, billing of org-limiet. Stop de
queued ids die je hebt aangemaakt, vermijd het starten van meer Testboxes en verplaats het bewijs naar het
beheerde Crabbox-capaciteitspad hieronder terwijl iemand het Blacksmith-dashboard,
billing en org-limieten controleert.

Escaleren naar beheerde Crabbox-capaciteit mag alleen wanneer Blacksmith down is, door quota is beperkt, de benodigde omgeving mist, of beheerde capaciteit expliciet het doel is:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Vermijd onder AWS-druk `class=beast`, tenzij de taak echt 48xlarge-klasse CPU nodig heeft. Een `beast`-aanvraag begint bij 192 vCPU's en is de gemakkelijkste manier om regionale EC2 Spot- of On-Demand Standard-quota te raken. De repo-owned `.crabbox.yaml` gebruikt standaard `standard`, meerdere capaciteitsregio's en `capacity.hints: true`, zodat gebrokerde AWS-leases de geselecteerde regio/markt, quotadruk, Spot-fallback en waarschuwingen voor klassen onder hoge druk tonen. Gebruik `fast` voor zwaardere brede checks, `large` alleen nadat standard/fast niet genoeg zijn, en `beast` alleen voor uitzonderlijke CPU-gebonden lanes zoals volledige suite- of all-plugin Docker-matrices, expliciete release-/blocker-validatie, of high-core performance profiling. Gebruik `beast` niet voor `pnpm check:changed`, gerichte tests, docs-only werk, gewone lint/typecheck, kleine E2E-repro's of Blacksmith-storingstriage. Gebruik `--market on-demand` voor capaciteitsdiagnose, zodat Spot-marktverloop niet met het signaal wordt vermengd.

`.crabbox.yaml` beheert standaardinstellingen voor provider, sync en GitHub Actions-hydration voor owned-cloud-lanes. Het sluit lokale `.git` uit, zodat de gehydrateerde Actions-checkout zijn eigen remote Git-metadata behoudt in plaats van maintainer-lokale remotes en object stores te synchroniseren, en het sluit lokale runtime-/buildartefacten uit die nooit mogen worden overgedragen. `.github/workflows/crabbox-hydrate.yml` beheert checkout, Node/pnpm-setup, `origin/main` fetch en de niet-geheime omgevingsoverdracht voor owned-cloud-commands met `crabbox run --id <cbx_id>`.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Ontwikkelingskanalen](/nl/install/development-channels)
