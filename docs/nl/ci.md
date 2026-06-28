---
read_when:
    - Je moet begrijpen waarom een CI-taak wel of niet is uitgevoerd
    - Je debugt een falende GitHub Actions-controle
    - Je coördineert een releasevalidatierun of een herhaling daarvan
    - Je wijzigt ClawSweeper-dispatch of het doorsturen van GitHub-activiteit
summary: CI-taakgrafiek, scope-gates, releaseparaplu's en lokale opdracht-equivalenten
title: CI-pijplijn
x-i18n:
    generated_at: "2026-06-28T00:10:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95e38a0777d15b06fe50a1800ecc901d00078d6e970d3bc9e221b664bfced8b5
    source_path: ci.md
    workflow: 16
---

OpenClaw CI draait bij elke push naar `main` en elke pull request. Canonieke
`main`-pushes gaan eerst door een toelatingsvenster van 90 seconden voor hosted runners.
De bestaande `CI`-concurrencygroep annuleert die wachtende run wanneer er een nieuwere
commit binnenkomt, zodat opeenvolgende merges niet elk een volledige Blacksmith-
matrix registreren. Pull requests en handmatige dispatches slaan de wachttijd over. De `preflight`-job
classificeert daarna de diff en schakelt dure lanes uit wanneer alleen niet-gerelateerde
gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen bewust slimme
scoping en waaieren uit naar de volledige graaf voor release candidates en brede
validatie. Android-lanes blijven opt-in via `include_android`. Release-only
Plugin-dekking staat in de afzonderlijke [`Plugin Prerelease`](#plugin-prerelease)
workflow en draait alleen vanuit [`Full Release Validation`](#full-release-validation)
of een expliciete handmatige dispatch.

## Pipelineoverzicht

| Job                                | Doel                                                                                                      | Wanneer deze draait                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Detecteert wijzigingen die alleen docs raken, gewijzigde scopes, gewijzigde extensions en bouwt het CI-manifest | Altijd bij non-draft pushes en PR's                  |
| `runner-admission`                 | Gehoste debounce van 90 seconden voor canonieke `main`-pushes voordat Blacksmith-werk wordt geregistreerd | Elke CI-run; slaapt alleen bij canonieke `main`-pushes |
| `security-fast`                    | Detectie van privésleutels, audit van gewijzigde workflows via `zizmor` en audit van productie-lockfiles | Altijd bij non-draft pushes en PR's                  |
| `check-dependencies`               | Productie-Knip-pass alleen voor dependencies plus de allowlist-guard voor ongebruikte bestanden           | Node-relevante wijzigingen                           |
| `build-artifacts`                  | Bouwt `dist/`, Control UI, smokechecks voor de gebouwde CLI, ingebedde checks op build-artifacts en herbruikbare artifacts | Node-relevante wijzigingen                           |
| `checks-fast-core`                 | Snelle Linux-correctheidslanes zoals bundled, protocol, QA Smoke CI en CI-routeringschecks                | Node-relevante wijzigingen                           |
| `checks-fast-contracts-plugins-*`  | Twee gesharde Plugin-contractchecks                                                                       | Node-relevante wijzigingen                           |
| `checks-fast-contracts-channels-*` | Twee gesharde kanaalcontractchecks                                                                        | Node-relevante wijzigingen                           |
| `checks-node-core-*`               | Core Node-testshards, exclusief kanaal-, bundled-, contract- en extension-lanes                           | Node-relevante wijzigingen                           |
| `check-*`                          | Geshard equivalent van de lokale hoofdgate: productietypes, lint, guards, testtypes en strikte smoke      | Node-relevante wijzigingen                           |
| `check-additional-*`               | Architectuur, gesharde boundary-/promptdrift, extension-guards, package-boundary en runtimetopologie     | Node-relevante wijzigingen                           |
| `checks-node-compat-node22`        | Node 22-compatibiliteitsbuild en smoke-lane                                                               | Handmatige CI-dispatch voor releases                 |
| `check-docs`                       | Docs-formattering, lint en checks op gebroken links                                                       | Docs gewijzigd                                       |
| `skills-python`                    | Ruff + pytest voor Python-ondersteunde Skills                                                             | Python-Skills-relevante wijzigingen                  |
| `checks-windows`                   | Windows-specifieke proces-/padtests plus gedeelde regressies in runtime-importspecifiers                  | Windows-relevante wijzigingen                        |
| `macos-node`                       | macOS TypeScript-testlane met de gedeelde gebouwde artifacts                                              | macOS-relevante wijzigingen                          |
| `macos-swift`                      | Swift-lint, build en tests voor de macOS-app                                                              | macOS-relevante wijzigingen                          |
| `ios-build`                        | Xcode-projectgeneratie plus de simulatorbuild van de iOS-app                                             | iOS-app, gedeelde app-kit of Swabble-wijzigingen     |
| `android`                          | Android-unittests voor beide flavors plus één debug-APK-build                                             | Android-relevante wijzigingen                        |
| `test-performance-agent`           | Dagelijkse Codex-optimalisatie voor trage tests na vertrouwde activiteit                                  | Succesvolle main-CI of handmatige dispatch           |
| `openclaw-performance`             | Dagelijkse/op aanvraag Kova-runtimeprestatierapporten met mock-provider, deep-profile en GPT 5.5-live lanes | Geplande en handmatige dispatch                      |

## Fail-fast-volgorde

1. `runner-admission` wacht alleen op canonieke `main`-pushes; een nieuwere push annuleert de run vóór Blacksmith-registratie.
2. `preflight` bepaalt welke lanes überhaupt bestaan. De `docs-scope`- en `changed-scope`-logica zijn stappen binnen deze job, geen zelfstandige jobs.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` en `skills-python` falen snel zonder te wachten op de zwaardere artifact- en platformmatrixjobs.
4. `build-artifacts` overlapt met de snelle Linux-lanes zodat downstream-consumenten kunnen starten zodra de gedeelde build klaar is.
5. Zwaardere platform- en runtimelanes waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` en `android`.

GitHub kan vervangen jobs als `cancelled` markeren wanneer er een nieuwere push op dezelfde PR- of `main`-ref binnenkomt. Behandel dat als CI-ruis, tenzij de nieuwste run voor dezelfde ref ook faalt. Matrixjobs gebruiken `fail-fast: false`, en `build-artifacts` rapporteert failures voor embedded channel, core-support-boundary en gateway-watch rechtstreeks in plaats van kleine verifier-jobs in de wachtrij te zetten. De automatische CI-concurrencysleutel is geversioneerd (`CI-v7-*`), zodat een zombie aan GitHub-zijde in een oude wachtrijgroep nieuwere main-runs niet onbeperkt kan blokkeren. Handmatige full-suite-runs gebruiken `CI-manual-v1-*` en annuleren lopende runs niet.

Gebruik `pnpm ci:timings`, `pnpm ci:timings:recent` of `node scripts/ci-run-timings.mjs <run-id>` om wandkloktijd, wachtrijtijd, traagste jobs, failures en de `pnpm-store-warmup`-fanoutbarrière vanuit GitHub Actions samen te vatten. CI uploadt dezelfde runsamenvatting ook als een `ci-timings-summary`-artifact. Controleer voor buildtiming de stap `Build dist` van de job `build-artifacts`: `pnpm build:ci-artifacts` print `[build-all] phase timings:` en bevat `ui:build`; de job uploadt ook het artifact `startup-memory`.

Voor pull request-runs voert de afsluitende timing-summary-job de helper uit vanaf de vertrouwde base-revisie voordat `GH_TOKEN` aan `gh run view` wordt doorgegeven. Dat houdt de query met token buiten branch-gecontroleerde code en vat tegelijk de huidige CI-run van de pull request samen.

## PR-context en bewijs

PR's van externe contributors draaien een PR-context- en bewijsgate vanuit
`.github/workflows/real-behavior-proof.yml`. De workflow checkt de vertrouwde
base-commit uit en evalueert alleen de PR-body; er wordt geen code uit de
contributorbranch uitgevoerd.

De gate is van toepassing op PR-auteurs die geen repository owners, members,
collaborators of bots zijn. Deze slaagt wanneer de PR-body zelfgeschreven
secties `What Problem This Solves` en `Evidence` bevat. Bewijs kan een gerichte
test, CI-resultaat, screenshot, opname, terminaluitvoer, live-observatie,
geredigeerd log of artifact-link zijn. De body biedt intentie en nuttige validatie;
reviewers inspecteren de code, tests en CI om correctheid te beoordelen.

Wanneer de check faalt, werk dan de PR-body bij in plaats van nog een codecommit te pushen.

## Scope en routering

Scope-logica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unittests in `src/scripts/ci-changed-scope.test.ts`. Handmatige dispatch slaat changed-scope-detectie over en laat het preflight-manifest handelen alsof elk scoped gebied is gewijzigd.

- **CI-workflowbewerkingen** valideren de Node CI-graaf plus workflow-linting, maar forceren op zichzelf geen Windows-, iOS-, Android- of macOS-native builds; die platformlanes blijven gescoped op wijzigingen in platformbroncode.
- **Workflow Sanity** draait `actionlint`, `zizmor` over alle workflow-YAML-bestanden, de composite-action interpolation-guard en de conflict-marker-guard. De PR-gescopete `security-fast`-job draait ook `zizmor` over gewijzigde workflowbestanden zodat workflow-securitybevindingen vroeg falen in de hoofd-CI-graaf.
- **Docs bij `main`-pushes** worden gecontroleerd door de zelfstandige `Docs`-workflow met dezelfde ClawHub-docsmirror die CI gebruikt, zodat gemengde code+docs-pushes niet ook de CI-`check-docs`-shard in de wachtrij zetten. Pull requests en handmatige CI draaien nog steeds `check-docs` vanuit CI wanneer docs zijn gewijzigd.
- **TUI PTY** draait in de Linux Node-shard `checks-node-core-runtime-tui-pty` voor TUI-wijzigingen. De shard draait `test/vitest/vitest.tui-pty.config.ts` met `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, zodat deze zowel de deterministische `TuiBackend`-fixturelane als de tragere `tui --local`-smoke dekt die alleen het externe modeleindpunt mockt.
- **Bewerkingen die alleen CI-routering raken, geselecteerde goedkope core-testfixturebewerkingen en smalle Plugin-contracthelper-/test-routeringsbewerkingen** gebruiken een snel Node-only manifestpad: `preflight`, security en één `checks-fast-core`-taak. Dat pad slaat build-artifacts, Node 22-compatibiliteit, kanaalcontracten, volledige core-shards, bundled-Plugin-shards en aanvullende guard-matrices over wanneer de wijziging beperkt is tot de routerings- of helperoppervlakken die de snelle taak rechtstreeks test.
- **Windows Node-checks** zijn gescoped op Windows-specifieke proces-/padwrappers, npm/pnpm/UI-runnerhelpers, package manager-configuratie en de CI-workflowoppervlakken die die lane uitvoeren; niet-gerelateerde broncode-, Plugin-, install-smoke- en test-only wijzigingen blijven op de Linux Node-lanes.

De traagste Node-testfamilies zijn gesplitst of uitgebalanceerd zodat elke job klein blijft zonder runners te ruim te reserveren: Plugin-contracten en kanaalcontracten draaien elk als twee gewogen, door Blacksmith ondersteunde shards met de standaard GitHub-runnerfallback, snelle/supportlanes voor core-unittests draaien afzonderlijk, core-runtime-infrastructuur is opgesplitst in state, process/config, shared en drie cron-domeinshards, auto-reply draait als gebalanceerde workers (waarbij de reply-subtree is opgesplitst in agent-runner-, dispatch- en commands/state-routing-shards), en agentic gateway/server-configuraties zijn opgesplitst over chat/auth/model/http-plugin/runtime/startup-lanes in plaats van te wachten op gebouwde artefacten. Normale CI verpakt vervolgens alleen geisoleerde infra-include-pattern-shards in deterministische bundels van maximaal 64 testbestanden, waardoor de Node-matrix kleiner wordt zonder niet-geisoleerde command/cron-, stateful agents-core- of gateway/server-suites samen te voegen; zware vaste suites blijven op 8 vCPU, terwijl de gebundelde lanes en lanes met lager gewicht 4 vCPU gebruiken. Pull requests op de canonieke repository gebruiken een extra compact toelatingsplan: dezelfde per-config-groepen draaien in geisoleerde subprocessen binnen het huidige Linux Node-plan van 34 jobs, zodat een enkele PR niet de volledige Node-matrix van meer dan 70 jobs registreert. `main`-pushes, handmatige dispatches en release-gates behouden de volledige matrix. Brede browser-, QA-, media- en diverse Plugin-tests gebruiken hun eigen Vitest-configuraties in plaats van de gedeelde algemene Plugin-configuratie. Include-pattern-shards registreren timingvermeldingen met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een volledige configuratie kan onderscheiden van een gefilterde shard. `check-additional-*` houdt compile/canary-werk rond pakketgrenzen bij elkaar en scheidt runtime-topologiearchitectuur van gateway-watch-dekking; de boundary-guard-lijst is gestreept in een prompt-zware shard en een gecombineerde shard voor de resterende guard-strepen, waarbij elke shard geselecteerde onafhankelijke guards gelijktijdig draait en timings per check afdrukt. De dure Codex-happy-path-promptsnapshot-driftcheck draait als eigen aanvullende job alleen voor handmatige CI en prompt-beinvloedende wijzigingen, zodat normale ongerelateerde Node-wijzigingen niet hoeven te wachten op koude promptsnapshotgeneratie en de boundary-shards gebalanceerd blijven terwijl promptdrift nog steeds wordt vastgepind op de PR die deze veroorzaakte; dezelfde vlag slaat promptsnapshot-Vitest-generatie over binnen de core support-boundary-shard voor gebouwde artefacten. Gateway-watch, kanaaltests en de core support-boundary-shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd.

Na toelating staat canonieke Linux-CI maximaal 24 gelijktijdige Node-testjobs toe en
12 voor de kleinere fast/check-lanes; Windows en Android blijven op twee omdat
die runnerpools smaller zijn.

Het compacte PR-plan geeft 18 Node-jobs uit voor de huidige suite: whole-config
groepen worden gebatcht in geisoleerde subprocessen met een batch-time-out van 120 minuten,
terwijl include-pattern-groepen hetzelfde begrensde jobbudget delen.

Android-CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play-debug-APK. De third-party-flavor heeft geen afzonderlijke sourceset of manifest; de unit-testlane compileert de flavor nog steeds met de SMS/call-log-BuildConfig-vlaggen, terwijl een dubbele debug-APK-packagingjob bij elke Android-relevante push wordt vermeden.

De `check-dependencies`-shard draait `pnpm deadcode:dependencies` (een productie-Knip-pass alleen voor dependencies, vastgezet op de nieuwste Knip-versie, met pnpm's minimale releaseleeftijd uitgeschakeld voor de `dlx`-installatie) en `pnpm deadcode:unused-files`, dat Knip's productiebevindingen voor ongebruikte bestanden vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. De unused-file-guard faalt wanneer een PR een nieuw, niet-beoordeeld ongebruikt bestand toevoegt of een verouderde allowlist-vermelding laat staan, terwijl bewuste dynamische Plugin-, gegenereerde, build-, live-test- en package-bridge-oppervlakken behouden blijven die Knip niet statisch kan oplossen.

## ClawSweeper-activiteit doorsturen

`.github/workflows/clawsweeper-dispatch.yml` is de brug aan de doelzijde van OpenClaw-repositoryactiviteit naar ClawSweeper. Het checkt geen onvertrouwde pull-requestcode uit en voert die ook niet uit. De workflow maakt een GitHub App-token aan vanuit `CLAWSWEEPER_APP_PRIVATE_KEY` en dispatcht daarna compacte `repository_dispatch`-payloads naar `openclaw/clawsweeper`.

De workflow heeft vier lanes:

- `clawsweeper_item` voor exacte reviewverzoeken voor issues en pull requests;
- `clawsweeper_comment` voor expliciete ClawSweeper-commando's in issuecommentaren;
- `clawsweeper_commit_review` voor reviewverzoeken op commitniveau bij `main`-pushes;
- `github_activity` voor algemene GitHub-activiteit die de ClawSweeper-agent kan inspecteren.

De `github_activity`-lane stuurt alleen genormaliseerde metadata door: eventtype, actie, actor, repository, itemnummer, URL, titel, status en korte fragmenten voor commentaren of reviews wanneer aanwezig. Het vermijdt bewust het doorsturen van de volledige webhook-body. De ontvangende workflow in `openclaw/clawsweeper` is `.github/workflows/github-activity.yml`, die het genormaliseerde event naar de OpenClaw Gateway-hook voor de ClawSweeper-agent post.

Algemene activiteit is observatie, geen standaardlevering. De ClawSweeper-agent ontvangt het Discord-doel in zijn prompt en hoort alleen naar `#clawsweeper` te posten wanneer het event verrassend, actiegericht, riskant of operationeel nuttig is. Routinematige opens, edits, botruis, dubbele webhookruis en normaal reviewverkeer horen te resulteren in `NO_REPLY`.

Behandel GitHub-titels, commentaren, bodies, reviewtekst, branchnamen en commitberichten overal in dit pad als onvertrouwde data. Ze zijn input voor samenvatting en triage, geen instructies voor de workflow of agentruntime.

## Handmatige dispatches

Handmatige CI-dispatches draaien dezelfde jobgrafiek als normale CI, maar forceren elke niet-Android-scoped lane aan: Linux Node-shards, bundled-plugin-shards, Plugin- en kanaalcontractshards, Node 22-compatibiliteit, `check-*`, `check-additional-*`, smokechecks voor gebouwde artefacten, docs-checks, Python Skills, Windows, macOS, iOS-build en Control UI-i18n. Zelfstandige handmatige CI-dispatches draaien Android alleen met `include_android=true`; de volledige releaseparaplu schakelt Android in door `include_android=true` door te geven. Statische prereleasechecks voor Plugins, de alleen-voor-release `agentic-plugins`-shard, de volledige extensie-batchsweep en Docker-lanes voor Plugin-prereleases zijn uitgesloten van CI. De Docker-prerelease-suite draait alleen wanneer `Full Release Validation` de afzonderlijke `Plugin Prerelease`-workflow dispatcht met de release-validation-gate ingeschakeld.

Handmatige runs gebruiken een unieke concurrencygroep zodat een volledige release-candidate-suite niet wordt geannuleerd door een andere push- of PR-run op dezelfde ref. Met de optionele `target_ref`-input kan een vertrouwde caller die grafiek draaien tegen een branch, tag of volledige commit-SHA terwijl het workflowbestand uit de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                          | Jobs                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Handmatige CI-dispatch en fallbacks voor niet-canonieke repositories, CodeQL-kwaliteitsscans voor JavaScript/actions, workflow-sanity, labeler, auto-response, docs-workflows buiten CI, en install-smoke-preflight zodat de Blacksmith-matrix eerder kan queueen                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, extensieshards met lager gewicht, `checks-fast-core`, Plugin-/kanaalcontractshards, de meeste gebundelde/lager gewicht Linux Node-shards, `check-guards`, `check-prod-types`, `check-test-types`, geselecteerde `check-additional-*`-shards, en `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Behouden zware Linux Node-suites, boundary-/extensie-zware `check-additional-*`-shards, en `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (CPU-gevoelig genoeg dat 8 vCPU meer kostte dan het bespaarde); install-smoke-Docker-builds (32-vCPU-wachtrijtijd kostte meer dan het bespaarde)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` op `openclaw/openclaw`; forks vallen terug op `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` en `ios-build` op `openclaw/openclaw`; forks vallen terug op `macos-26`                                                                                                                                                                                                  |

## Runnerregistratiebudget

OpenClaw's huidige GitHub-runnerregistratiebucket staat 3.000 self-hosted
runnerregistraties per 5 minuten toe. De limiet wordt gedeeld door alle Blacksmith-runner
registraties in de `openclaw`-organisatie, dus het toevoegen van nog een Blacksmith-
installatie voegt geen nieuwe bucket toe.

Behandel Blacksmith-labels als de schaarse resource voor burstcontrole. Jobs die
alleen routeren, notificeren, samenvatten, shards selecteren of korte CodeQL-scans draaien, horen
op GitHub-hosted runners te blijven tenzij ze gemeten Blacksmith-specifieke
behoeften hebben. Elke nieuwe Blacksmith-matrix, grotere `max-parallel` of hoogfrequente
workflow moet het worst-case registratieaantal tonen en het doel op organisatieniveau
onder 2.000 registraties per 5 minuten houden, met marge voor gelijktijdige
repositories en opnieuw geprobeerde jobs.

Canonieke-repo-CI houdt Blacksmith als het standaard runnerpad voor normale push- en pull-requestruns. `workflow_dispatch` en runs op niet-canonieke repositories gebruiken GitHub-hosted runners, maar normale canonieke runs peilen momenteel niet de gezondheid van de Blacksmith-wachtrij en vallen niet automatisch terug op GitHub-hosted labels wanneer Blacksmith niet beschikbaar is.

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

Handmatige start benchmarkt normaal gesproken de workflow-ref. Stel `target_ref` in om een releasetag of een andere branch met de huidige workflowimplementatie te benchmarken. Gepubliceerde rapportpaden en nieuwste verwijzingen worden op sleutel van de geteste ref opgeslagen, en elke `index.md` registreert de geteste ref/SHA, workflow-ref/SHA, Kova-ref, profiel, lane-authenticatiemodus, model, herhalingsaantal en scenariofilters.

De workflow installeert OCM vanuit een vastgepinde release en Kova vanuit `openclaw/Kova` op de vastgepinde invoer `kova_ref`, en voert daarna drie lanes uit:

- `mock-provider`: Kova-diagnostische scenario's tegen een lokaal gebouwde runtime met deterministische nep-OpenAI-compatibele authenticatie.
- `mock-deep-profile`: CPU-/heap-/traceprofilering voor hotspots bij opstarten, Gateway en agent-turns.
- `live-openai-candidate`: een echte OpenAI `openai/gpt-5.5` agent-turn, overgeslagen wanneer `OPENAI_API_KEY` niet beschikbaar is.

De mock-provider-lane voert na de Kova-pass ook OpenClaw-native bronprobes uit: Gateway-opstarttiming en geheugen voor standaard-, hook- en 50-Plugin-opstartgevallen; RSS van gebundelde Plugin-imports, herhaalde nep-OpenAI `channel-chat-baseline` hello-loops, CLI-opstartcommando's tegen de opgestarte Gateway, en de SQLite-state smoke-prestatieprobe. Wanneer het vorige gepubliceerde mock-provider-bronrapport beschikbaar is voor de geteste ref, vergelijkt de bronsamenvatting de huidige RSS- en heapwaarden met die baseline en markeert grote RSS-stijgingen als `watch`. De Markdown-samenvatting van de bronprobe staat in `source/index.md` in de rapportbundel, met de ruwe JSON ernaast.

Elke lane uploadt GitHub-artifacts. Wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd, commit de workflow ook `report.json`, `report.md`, bundels, `index.md` en bronprobe-artifacts naar `openclaw/clawgrit-reports` onder `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. De huidige geteste-ref-verwijzing wordt geschreven als `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Volledige releasevalidatie

`Full Release Validation` is de handmatige overkoepelende workflow voor "alles draaien vóór de release". Deze accepteert een branch, tag of volledige commit-SHA, start de handmatige `CI`-workflow met dat doel, start `Plugin Prerelease` voor release-only Plugin-/pakket-/static-/Docker-bewijs, en start `OpenClaw Release Checks` voor installatiesmoke, pakketacceptatie, cross-OS pakketcontroles, rendering van de maturity-scorecard op basis van QA-profielbewijs, QA Lab-pariteit, Matrix- en Telegram-lanes. Stabiele en volledige profielen bevatten altijd uitgebreide live/E2E- en Docker-release-path-soakdekking; het bètaprofiel kan zich aanmelden met `run_release_soak=true`. De canonieke Telegram E2E voor pakketten draait binnen Package Acceptance, dus een volledige kandidaat start geen dubbele live poller. Geef na publicatie `release_package_spec` door om het verzonden npm-pakket opnieuw te gebruiken in release checks, Package Acceptance, Docker, cross-OS en Telegram zonder opnieuw te bouwen. Gebruik `npm_telegram_package_spec` alleen voor een gerichte Telegram-heruitvoering met gepubliceerd pakket. De live pakketlane van de Codex-Plugin gebruikt standaard dezelfde geselecteerde staat: gepubliceerde `release_package_spec=openclaw@<tag>` leidt `codex_plugin_spec=npm:@openclaw/codex@<tag>` af, terwijl SHA-/artifact-runs `extensions/codex` packen vanuit de geselecteerde ref. Stel `codex_plugin_spec` expliciet in voor aangepaste Plugin-bronnen zoals `npm:`, `npm-pack:` of `git:`-specificaties.

Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
fasematrix, exacte workflow-jobnamen, profielverschillen, artifacts en
handles voor gerichte heruitvoeringen.

`OpenClaw Release Publish` is de handmatige muterende releaseworkflow. Start deze
vanaf `release/YYYY.M.PATCH` of `main` nadat de releasetag bestaat en nadat de
OpenClaw npm-preflight is geslaagd. Deze verifieert `pnpm plugins:sync:check`,
start `Plugin NPM Release` voor alle publiceerbare Plugin-pakketten, start
`Plugin ClawHub Release` voor dezelfde release-SHA, en start pas daarna
`OpenClaw NPM Release` met de opgeslagen `preflight_run_id`. Stabiele publicatie vereist ook
een exacte `windows_node_tag`; de workflow verifieert de Windows-bronrelease
en vergelijkt de x64/ARM64-installatieprogramma's met de door de kandidaat goedgekeurde
invoer `windows_node_installer_digests` vóór enig publicatiechild, promoot en
verifieert daarna diezelfde vastgepinde installatiedigests plus het exacte begeleidende asset
en checksum-contract voordat de GitHub-releaseconcept wordt gepubliceerd.

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

GitHub-workflow-dispatch-refs moeten branches of tags zijn, geen ruwe commit-SHA's. De
helper pusht een tijdelijke `release-ci/<sha>-...`-branch op de doel-SHA,
start `Full Release Validation` vanaf die vastgepinde ref, verifieert dat elke child-workflow
`headSha` overeenkomt met het doel, en verwijdert de tijdelijke branch wanneer de
run voltooit. De overkoepelende verifier faalt ook als een child-workflow op een
andere SHA draaide.

`release_profile` bepaalt de live-/providerbreedte die wordt doorgegeven aan release checks. De
handmatige releaseworkflows gebruiken standaard `stable`; gebruik `full` alleen wanneer je
bewust de brede adviserende provider-/mediamatrix wilt. Stabiele en volledige
release checks draaien altijd de uitgebreide live/E2E- en Docker-release-path-soak;
het bètaprofiel kan zich aanmelden met `run_release_soak=true`.

- `minimum` behoudt de snelste OpenAI-/core-lanes die releasekritiek zijn.
- `stable` voegt de stabiele provider-/backendset toe.
- `full` draait de brede adviserende provider-/mediamatrix.

De umbrella registreert de gestarte child-run-id's, en de laatste job `Verify full validation` controleert de huidige conclusies van child-runs opnieuw en voegt tabellen met traagste jobs toe voor elke child-run. Als een child-workflow opnieuw wordt uitgevoerd en groen wordt, voer dan alleen de parent-verifier-job opnieuw uit om het umbrella-resultaat en de timingsamenvatting te verversen.

Voor herstel accepteren zowel `Full Release Validation` als `OpenClaw Release Checks` `rerun_group`. Gebruik `all` voor een releasekandidaat, `ci` voor alleen het normale volledige CI-child, `plugin-prerelease` voor alleen het Plugin-prerelease-child, `release-checks` voor elk release-child, of een smallere groep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` of `npm-telegram` op de umbrella. Dit houdt de heruitvoering van een mislukte releasebox begrensd na een gerichte fix. Combineer voor één mislukte cross-OS-lane `rerun_group=cross-os` met `cross_os_suite_filter`, bijvoorbeeld `windows/packaged-upgrade`; lange cross-OS-commando's geven Heartbeat-regels uit en packaged-upgrade-samenvattingen bevatten timings per fase. QA-release-check-lanes zijn adviserend, behalve de standaard runtime-tooldekkingsgate, die blokkeert wanneer vereiste dynamische OpenClaw-tools afwijken of verdwijnen uit de standaardtiersamenvatting.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde ref één keer op te lossen naar een `release-package-under-test`-tarball, en geeft dat artifact daarna door aan cross-OS-controles en Package Acceptance, plus de live/E2E release-path Docker-workflow wanneer soakdekking draait. Dat houdt de pakketbytes consistent over releaseboxen heen en voorkomt dat dezelfde kandidaat in meerdere child-jobs opnieuw wordt gepackt. Voor de live lane van de Codex npm-Plugin geven release checks ofwel een overeenkomende gepubliceerde Plugin-specificatie door die is afgeleid van `release_package_spec`, geven ze de door de operator opgegeven `codex_plugin_spec` door, of laten ze de invoer leeg zodat het Docker-script de Codex-Plugin van de geselecteerde checkout packt.

Dubbele `Full Release Validation`-runs voor `ref=main` en `rerun_group=all`
vervangen de oudere umbrella. De parent-monitor annuleert elke child-workflow die
deze al heeft gestart wanneer de parent wordt geannuleerd, zodat nieuwere main-validatie
niet achter een verouderde release-check-run van twee uur blijft staan. Validatie van releasebranches/-tags
en gerichte heruitvoeringsgroepen behouden `cancel-in-progress: false`.

## Live- en E2E-shards

Het release live/E2E-child behoudt brede native `pnpm test:live`-dekking, maar draait die als benoemde shards via `scripts/test-live-shard.mjs` in plaats van als één seriële job:

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
- gesplitste media-audio-/video-shards en provider-gefilterde muziekshards

Dat behoudt dezelfde bestandsdekking terwijl trage live providerfouten makkelijker opnieuw uit te voeren en te diagnosticeren zijn. De geaggregeerde shardnamen `native-live-extensions-o-z`, `native-live-extensions-media` en `native-live-extensions-media-music` blijven geldig voor handmatige eenmalige heruitvoeringen.

De native live mediashards draaien in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de workflow `Live Media Runner Image`. Die image installeert `ffmpeg` en `ffprobe` vooraf; mediajobs verifiëren alleen de binaries vóór setup. Houd Docker-ondersteunde live suites op normale Blacksmith-runners — containerjobs zijn de verkeerde plek om geneste Docker-tests te starten.

Door Docker ondersteunde live model-/backendshards gebruiken een aparte gedeelde image `ghcr.io/openclaw/openclaw-live-test:<sha>` per geselecteerde commit. De live-releaseworkflow bouwt en pusht die image eenmalig; daarna draaien de Docker-shards voor live model, provider-gesharde Gateway, CLI-backend, ACP-bind en Codex-harnas met `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway-Docker-shards hebben expliciete `timeout`-limieten op scriptniveau onder de workflow-jobtimeout, zodat een vastgelopen container of opschoningspad snel faalt in plaats van het volledige budget voor releasechecks te verbruiken. Als die shards het volledige bron-Dockerdoel afzonderlijk opnieuw bouwen, is de releaserun verkeerd geconfigureerd en verspilt die kloktijd aan dubbele image-builds.

## Pakketacceptatie

Gebruik `Package Acceptance` wanneer de vraag is: "werkt dit installeerbare OpenClaw-pakket als product?" Het verschilt van normale CI: normale CI valideert de source tree, terwijl pakketacceptatie één tarball valideert via hetzelfde Docker-E2E-harnas dat gebruikers na installatie of update gebruiken.

### Jobs

1. `resolve_package` checkt `workflow_ref` uit, bepaalt één pakketkandidaat, schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het artifact `package-under-test`, en print de bron, workflowref, pakketref, versie, SHA-256 en profiel in de GitHub-stapsamenvatting.
2. `docker_acceptance` roept `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt dat artifact, valideert de tarball-inventaris, bereidt waar nodig package-digest-Docker-images voor, en draait de geselecteerde Docker-lanes tegen dat pakket in plaats van de workflow-checkout te packen. Wanneer een profiel meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het pakket en de gedeelde images één keer voor, en waaiert die lanes daarna uit als parallelle gerichte Docker-jobs met unieke artifacts.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Dit draait wanneer `telegram_mode` niet `none` is en installeert hetzelfde artifact `package-under-test` wanneer Pakketacceptatie er een heeft bepaald; een zelfstandige Telegram-dispatch kan nog steeds een gepubliceerde npm-specificatie installeren.
4. `summary` laat de workflow falen als pakketresolutie, Docker-acceptatie of de optionele Telegram-lane is mislukt.

### Kandidaatbronnen

- `source=npm` accepteert alleen `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor acceptatie van gepubliceerde prereleases of stabiele releases.
- `source=ref` packt een vertrouwde `package_ref`-branch, tag of volledige commit-SHA. De resolver haalt OpenClaw-branches/tags op, verifieert dat de geselecteerde commit bereikbaar is vanuit de repository-branchgeschiedenis of een releasetag, installeert deps in een losgekoppelde worktree, en packt die met `scripts/package-openclaw-for-docker.mjs`.
- `source=url` downloadt een openbare HTTPS-`.tgz`; `package_sha256` is verplicht. Dit pad weigert URL-credentials, niet-standaard HTTPS-poorten, private/interne/special-use hostnamen of resolved IP's, en omleidingen buiten hetzelfde openbare veiligheidsbeleid.
- `source=trusted-url` downloadt een HTTPS-`.tgz` uit een benoemd trusted-source-beleid in `.github/package-trusted-sources.json`; `package_sha256` en `trusted_source_id` zijn verplicht. Gebruik dit alleen voor door maintainers beheerde enterprise-mirrors of private pakketrepositories die geconfigureerde hosts, poorten, padprefixes, redirect-hosts of private-network resolution nodig hebben. Als het beleid bearer-auth declareert, gebruikt de workflow het vaste secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; credentials die in de URL zijn opgenomen worden nog steeds geweigerd.
- `source=artifact` downloadt één `.tgz` uit `artifact_run_id` en `artifact_name`; `package_sha256` is optioneel, maar moet worden opgegeven voor extern gedeelde artifacts.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde workflow-/harnascode die de test draait. `package_ref` is de broncommit die wordt gepackt wanneer `source=ref`. Hierdoor kan het huidige testharnas oudere vertrouwde broncommits valideren zonder oude workflowlogica te draaien.

### Suiteprofielen

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — volledige Docker-releasepad-chunks met OpenWebUI
- `custom` — exacte `docker_lanes`; vereist wanneer `suite_profile=custom`

Het profiel `package` gebruikt offline Plugin-dekking, zodat validatie van gepubliceerde pakketten niet afhankelijk is van live beschikbaarheid van ClawHub. De optionele Telegram-lane hergebruikt het artifact `package-under-test` in `NPM Telegram Beta E2E`, waarbij het gepubliceerde npm-specificatiepad behouden blijft voor zelfstandige dispatches.

Voor het specifieke update- en Plugin-testbeleid, inclusief lokale commando's,
Docker-lanes, Pakketacceptatie-invoer, releasestandaarden en faaltriage,
zie [Updates en plugins testen](/nl/help/testing-updates-plugins).

Releasechecks roepen Pakketacceptatie aan met `source=artifact`, het voorbereide releasepakketartifact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` en `telegram_mode=mock-openai`. Dit houdt pakketmigratie, update, live ClawHub Skills-installatie, opschoning van oude Plugin-afhankelijkheden, herstel van geconfigureerde Plugin-installatie, offline Plugin, Plugin-update en Telegram-bewijs op dezelfde resolved pakkettarball. Stel `release_package_spec` in op Full Release Validation of OpenClaw Release Checks na het publiceren van een beta om dezelfde matrix tegen het verzonden npm-pakket te draaien zonder opnieuw te bouwen; stel `package_acceptance_package_spec` alleen in wanneer Pakketacceptatie een ander pakket nodig heeft dan de rest van de releasevalidatie. Cross-OS-releasechecks dekken nog steeds OS-specifieke onboarding, installer- en platformgedrag; productvalidatie van pakketten/updates moet beginnen met Pakketacceptatie. De Docker-lane `published-upgrade-survivor` valideert één gepubliceerde pakketbaseline per run in het blokkerende releasepad. In Pakketacceptatie is de resolved `package-under-test`-tarball altijd de kandidaat en selecteert `published_upgrade_survivor_baseline` de fallback-gepubliceerde baseline, standaard `openclaw@latest`; herhaalcommando's voor mislukte lanes behouden die baseline. Full Release Validation met `run_release_soak=true` of `release_profile=full` stelt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` en `published_upgrade_survivor_scenarios=reported-issues` in om uit te breiden over de vier meest recente stabiele npm-releases plus vastgepinde releases op Plugin-compatibiliteitsgrenzen en issue-vormige fixtures voor Feishu-configuratie, behouden bootstrap-/persona-bestanden, geconfigureerde OpenClaw Plugin-installaties, tilde-logpaden en oude legacy Plugin-afhankelijkheidsroots. Selecties voor published-upgrade survivor met meerdere baselines worden per baseline geshard in aparte gerichte Docker-runnerjobs. De afzonderlijke workflow `Update Migration` gebruikt de Docker-lane `update-migration` met `all-since-2026.4.23` en `plugin-deps-cleanup` wanneer de vraag uitputtende opschoning van gepubliceerde updates is, niet de normale breedte van Full Release CI. Lokale aggregatieruns kunnen exacte pakketspecificaties doorgeven met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, één lane houden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` zoals `openclaw@2026.4.15`, of `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` instellen voor de scenariomatrix. De gepubliceerde lane configureert de baseline met een ingebakken `openclaw config set`-commandorecept, registreert receptstappen in `summary.json`, en controleert `/healthz`, `/readyz` plus RPC-status na Gateway-start. De Windows-lanes voor verpakte en verse installer-installaties verifiëren ook dat een geïnstalleerd pakket een browser-control-override kan importeren vanaf een ruw absoluut Windows-pad. De OpenAI cross-OS agent-turn smoke gebruikt standaard `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer dat is ingesteld, anders `openai/gpt-5.5`, zodat het installatie- en Gateway-bewijs op een GPT-5-testmodel blijft en GPT-4.x-standaarden worden vermeden.

### Legacy-compatibiliteitsvensters

Pakketacceptatie heeft begrensde legacy-compatibiliteitsvensters voor al gepubliceerde pakketten. Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen het compatibiliteitspad gebruiken:

- bekende private QA-items in `dist/postinstall-inventory.json` mogen wijzen naar bestanden die uit de tarball zijn weggelaten;
- `doctor-switch` mag de subcase voor `gateway install --wrapper`-persistentie overslaan wanneer het pakket die vlag niet beschikbaar stelt;
- `update-channel-switch` mag ontbrekende pnpm `patchedDependencies` snoeien uit de van de tarball afgeleide nep-git-fixture en mag ontbrekende gepersisteerde `update.channel` loggen;
- Plugin-smokes mogen legacy install-record-locaties lezen of ontbrekende marketplace install-record-persistentie accepteren;
- `plugin-update` mag configuratiemetadata-migratie toestaan, terwijl nog steeds wordt vereist dat het install record en gedrag zonder herinstallatie ongewijzigd blijven.

Het gepubliceerde pakket `2026.4.26` mag ook waarschuwen voor lokale buildmetadata-stempelbestanden die al waren verzonden. Latere pakketten moeten aan de moderne contracten voldoen; dezelfde omstandigheden falen dan in plaats van te waarschuwen of over te slaan.

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

Begin bij het debuggen van een mislukte pakketacceptatierun met de samenvatting van `resolve_package` om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de child-run `docker_acceptance` en de Docker-artifacts daarvan: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logs, fasetimings en herhaalcommando's. Geef de voorkeur aan het opnieuw draaien van het mislukte pakketprofiel of de exacte Docker-lanes in plaats van het opnieuw draaien van volledige releasevalidatie.

## Installatiesmoke

De afzonderlijke workflow `Install Smoke` hergebruikt hetzelfde scopescript via zijn eigen `preflight`-job. Die splitst smoke-dekking in `run_fast_install_smoke` en `run_full_install_smoke`.

- **Snel pad** draait voor pull requests die Docker-/pakketoppervlakken, wijzigingen in gebundelde pluginpakketten/-manifesten, of kernoppervlakken voor plugins/kanalen/gateway/Plugin SDK raken die door de Docker-smokejobs worden getest. Wijzigingen alleen in broncode van gebundelde plugins, edits alleen in tests en edits alleen in docs reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image eenmaal, controleert de CLI, voert de agents-delete shared-workspace CLI-smoke uit, voert de container gateway-network e2e uit, verifieert een build-arg voor een gebundelde extension en voert het begrensde Docker-profiel voor gebundelde plugins uit onder een totale opdrachttime-out van 240 seconden (elke Docker-run van een scenario wordt apart begrensd).
- **Volledig pad** behoudt QR-pakketinstallatie en installer-Docker-/update-dekking voor nachtelijke geplande runs, handmatige dispatches, releasecontroles via workflow-call en pull requests die echt installer-/pakket-/Docker-oppervlakken raken. In volledige modus bereidt install-smoke één target-SHA GHCR root-Dockerfile-smoke-image voor of hergebruikt die, en voert daarna QR-pakketinstallatie, root-Dockerfile-/gateway-smokes, installer-/update-smokes en de snelle Docker-E2E voor gebundelde plugins uit als afzonderlijke jobs, zodat installerwerk niet hoeft te wachten achter de root-image-smokes.

`main`-pushes (inclusief mergecommits) forceren het volledige pad niet; wanneer changed-scope-logica volledige dekking zou aanvragen bij een push, behoudt de workflow de snelle Docker-smoke en laat de volledige install-smoke over aan nachtelijke of releasevalidatie.

De langzame Bun global-install image-provider-smoke wordt apart bewaakt door `run_bun_global_install_smoke`. Deze draait volgens het nachtelijke schema en vanuit de releasechecks-workflow, en handmatige `Install Smoke`-dispatches kunnen ervoor kiezen deze in te schakelen, maar pull requests en `main`-pushes doen dat niet. Normale PR-CI draait nog steeds de snelle Bun launcher-regressielane voor Node-relevante wijzigingen. QR- en installer-Docker-tests behouden hun eigen installatiegerichte Dockerfiles.

## Lokale Docker E2E

`pnpm test:docker:all` prebuildt één gedeelde live-testimage, verpakt OpenClaw eenmaal als een npm-tarball, en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images:

- een kale Node/Git-runner voor installer-/update-/plugin-dependency-lanes;
- een functionele image die dezelfde tarball in `/app` installeert voor normale functionaliteitslanes.

Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en voert daarna lanes uit met `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Instelbare opties

| Variabele                              | Standaard | Doel                                                                                          |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Aantal slots in de hoofdpool voor normale lanes.                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Aantal slots in de providergevoelige tail-pool.                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limiet voor gelijktijdige live-lanes zodat providers niet throttlen.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5         | Limiet voor gelijktijdige npm-installatielanes.                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limiet voor gelijktijdige multi-service-lanes.                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Spreiding tussen lanestarts om Docker-daemon-createstormen te voorkomen; stel `0` in voor geen spreiding. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Fallbacktime-out per lane (120 minuten); geselecteerde live-/tail-lanes gebruiken strakkere limieten. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset     | `1` print het schedulerplan zonder lanes uit te voeren.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset     | Kommagescheiden exacte lanelijst; slaat cleanup-smoke over zodat agents één mislukte lane kunnen reproduceren. |

Een lane die zwaarder is dan zijn effectieve limiet kan nog steeds starten vanuit een lege pool en draait daarna alleen totdat hij capaciteit vrijgeeft. De lokale aggregate voert Docker-preflights uit, verwijdert verouderde OpenClaw E2E-containers, geeft actieve-lanestatus door, bewaart lanetimings voor longest-first-volgorde en stopt standaard met het plannen van nieuwe gepoolde lanes na de eerste fout.

### Herbruikbare live-/E2E-workflow

De herbruikbare live-/E2E-workflow vraagt `scripts/test-docker-all.mjs --plan-json` welke pakket-, imagekind-, live-image-, lane- en credentialdekking vereist is. `scripts/docker-e2e.mjs` zet dat plan vervolgens om naar GitHub-outputs en samenvattingen. Deze workflow verpakt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een pakketartefact van de huidige run, of downloadt een pakketartefact uit `package_artifact_run_id`; valideert de tarball-inventaris; bouwt en pusht package-digest-getagde bare/functional GHCR Docker E2E-images via Blacksmiths Docker-layercache wanneer het plan lanes nodig heeft met geïnstalleerd pakket; en hergebruikt opgegeven `docker_e2e_bare_image`-/`docker_e2e_functional_image`-inputs of bestaande package-digest-images in plaats van opnieuw te bouwen. Docker-image-pulls worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry-/cachestream snel opnieuw probeert in plaats van het grootste deel van het kritieke CI-pad te verbruiken.

### Release-path chunks

Release-Docker-dekking draait kleinere gechunkte jobs met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elke chunk alleen het imagekind pullt dat hij nodig heeft en meerdere lanes uitvoert via dezelfde gewogen scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Huidige release-Docker-chunks zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, en `plugins-runtime-install-a` tot en met `plugins-runtime-install-h`. `package-update-openai` bevat de live Codex-pluginpakketlane, die het kandidaat-OpenClaw-pakket installeert, de Codex-plugin installeert vanuit `codex_plugin_spec` of een tarball van dezelfde ref met expliciete goedkeuring voor Codex CLI-installatie, Codex CLI-preflight uitvoert, en daarna meerdere OpenClaw-agentbeurten in dezelfde sessie tegen OpenAI uitvoert. `plugins-runtime-core`, `plugins-runtime`, en `plugins-integrations` blijven aggregate aliases voor plugins/runtime. De lane-alias `install-e2e` blijft de aggregate handmatige rerun-alias voor beide provider-installerlanes.

OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige release-path-dekking dit aanvraagt, en behoudt alleen voor OpenWebUI-only-dispatches een zelfstandige `openwebui`-chunk. Update-lanes voor gebundelde kanalen proberen één keer opnieuw bij tijdelijke npm-netwerkfouten.

Elke chunk uploadt `.artifacts/docker-tests/` met lanelogs, timings, `summary.json`, `failures.json`, fasetimings, schedulerplan-JSON, tabellen met langzame lanes en rerunopdrachten per lane. De workflowinput `docker_lanes` voert geselecteerde lanes uit tegen de voorbereide images in plaats van de chunkjobs, waardoor debugging van mislukte lanes begrensd blijft tot één gerichte Docker-job en het pakketartefact voor die run wordt voorbereid, gedownload of hergebruikt; als een geselecteerde lane een live-Docker-lane is, bouwt de gerichte job de live-testimage lokaal voor die rerun. Gegenereerde GitHub-rerunopdrachten per lane bevatten `package_artifact_run_id`, `package_artifact_name` en voorbereide image-inputs wanneer die waarden bestaan, zodat een mislukte lane exact het pakket en de images uit de mislukte run kan hergebruiken.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

De geplande live-/E2E-workflow draait dagelijks de volledige release-path Docker-suite.

## Plugin Prerelease

`Plugin Prerelease` is duurdere product-/pakketdekking, dus het is een afzonderlijke workflow die wordt gedispatcht door `Full Release Validation` of door een expliciete operator. Normale pull requests, `main`-pushes en zelfstandige handmatige CI-dispatches houden die suite uitgeschakeld. Deze verdeelt tests voor gebundelde plugins over acht extension-workers; die extension-shardjobs draaien maximaal twee pluginconfiguratiegroepen tegelijk met één Vitest-worker per groep en een grotere Node-heap, zodat importzware pluginbatches geen extra CI-jobs aanmaken. Het release-only Docker-prereleasepad batched gerichte Docker-lanes in kleine groepen om te voorkomen dat tientallen runners worden gereserveerd voor jobs van één tot drie minuten. De workflow uploadt ook een informatief `plugin-inspector-advisory`-artefact vanuit `@openclaw/plugin-inspector`; inspectorbevindingen zijn triage-input en wijzigen de blokkerende Plugin Prerelease-gate niet.

## QA Lab

QA Lab heeft toegewijde CI-lanes buiten de hoofdworkflow met smart scoping. Agentic parity is genest onder de brede QA- en releaseharnassen, niet als zelfstandige PR-workflow. Gebruik `Full Release Validation` met `rerun_group=qa-parity` wanneer parity moet meelopen met een brede validatierun.

- De workflow `QA-Lab - All Lanes` draait nachtelijk op `main` en bij handmatige dispatch; deze waaiert de mock-parity-lane, live Matrix-lane en live Telegram- en Discord-lanes uit als parallelle jobs. Live-jobs gebruiken de omgeving `qa-live-shared`, en Telegram/Discord gebruiken Convex-leases.

Releasechecks draaien Matrix- en Telegram-live-transportlanes met de deterministische mockprovider en mock-gekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het kanaalcontract wordt geïsoleerd van live-modellatentie en normale provider-plugin-startup. De live-transportgateway schakelt memory search uit omdat QA-parity geheugengedrag apart dekt; providerconnectiviteit wordt gedekt door de afzonderlijke live-model-, native-provider- en Docker-provider-suites.

Matrix gebruikt `--profile fast` voor geplande en releasegates, en voegt `--fail-fast` alleen toe wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaard en handmatige workflowinput blijven `all`; handmatige `matrix_profile=all`-dispatch shardt volledige Matrix-dekking altijd in `transport`-, `media`-, `e2ee-smoke`-, `e2ee-deep`- en `e2ee-cli`-jobs.

`OpenClaw Release Checks` draait ook de releasekritieke QA Lab-lanes vóór releasegoedkeuring; de QA-parity-gate draait de kandidaat- en baseline-pakketten als parallelle lanejobs, en downloadt daarna beide artefacten naar een kleine rapportjob voor de uiteindelijke parity-vergelijking.

Volg voor normale PR's scoped CI-/checkbewijs in plaats van parity als vereiste status te behandelen.

## CodeQL

De `CodeQL`-workflow is bewust een smalle beveiligingsscanner voor een eerste pass, niet de volledige repositoryscan. Dagelijkse, handmatige en niet-draft pull request-guardruns scannen Actions-workflowcode plus de JavaScript-/TypeScript-oppervlakken met het hoogste risico met high-confidence beveiligingsquery's die zijn gefilterd op hoge/kritieke `security-severity`.

De pull request-guard blijft licht: deze start alleen voor wijzigingen onder `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` of `src`, en draait dezelfde high-confidence beveiligingsmatrix als de geplande workflow. Android- en macOS-CodeQL blijven buiten PR-standaarden.

### Beveiligingscategorieën

| Categorie                                        | Raakvlak                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, Cron en Gateway-baseline                                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | Implementatiecontracten voor kernkanalen plus de runtime van channel-plugins, Gateway, Plugin SDK, secrets, audit-aanraakpunten     |
| `/codeql-security-high/network-ssrf-boundary`     | Raakvlakken voor core-SSRF, IP-parsing, netwerkbewaking, web-fetch en Plugin SDK-SSRF-beleid                                        |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-servers, helpers voor procesuitvoering, uitgaande levering en gates voor tooluitvoering door agents                             |
| `/codeql-security-high/plugin-trust-boundary`     | Vertrouwensraakvlakken voor Plugin-installatie, loader, manifest, registry, package-managerinstallatie, source-loading en Plugin SDK-pakketcontracten |

### Platformspecifieke security-shards

- `CodeQL Android Critical Security` — geplande Android-security-shard. Bouwt de Android-app handmatig voor CodeQL op de kleinste Blacksmith Linux-runner die door workflow-sanity wordt geaccepteerd. Uploadt onder `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — wekelijkse/handmatige macOS-security-shard. Bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert dependency-buildresultaten uit de geüploade SARIF en uploadt onder `/codeql-critical-security/macos`. Buiten de dagelijkse standaardinstellingen gehouden omdat de macOS-build de runtime domineert, zelfs wanneer die schoon is.

### Critical Quality-categorieën

`CodeQL Critical Quality` is de bijbehorende niet-security-shard. Deze voert alleen JavaScript/TypeScript-kwaliteitsquery's met foutseverity en zonder security uit over smalle, waardevolle raakvlakken op door GitHub gehoste Linux-runners, zodat kwaliteitsscans geen Blacksmith runner-registratiebudget gebruiken. De pull request-guard is bewust kleiner dan het geplande profiel: niet-draft-PR's draaien alleen de bijbehorende `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` en `plugin-sdk-reply-runtime` shards voor agent command/model/tool-uitvoering en reply-dispatchcode, config schema-/migratie-/IO-code, auth/secrets/sandbox/security-code, kernkanaal- en gebundelde channel-plugin-runtime, Gateway-protocol/server-method, memory-runtime/SDK-koppeling, MCP/proces/uitgaande levering, provider-runtime/modelcatalogus, sessiediagnostiek/leveringsqueues, plugin-loader, Plugin SDK/package-contract of wijzigingen in Plugin SDK-reply-runtime. CodeQL-configuratie en quality-workflowwijzigingen draaien alle twaalf PR-quality-shards.

Handmatige dispatch accepteert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

De smalle profielen zijn onderwijs-/iteratiehooks om één quality-shard geïsoleerd te draaien.

| Categorie                                              | Raakvlak                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth-, secrets-, sandbox-, Cron- en Gateway-security-boundarycode                                                                                                 |
| `/codeql-critical-quality/config-boundary`              | Config-schema-, migratie-, normalisatie- en IO-contracten                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-protocolschema's en servermethodcontracten                                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementatiecontracten voor kernkanalen en gebundelde channel-plugins                                                                                            |
| `/codeql-critical-quality/agent-runtime-boundary`       | Command-uitvoering, model-/provider-dispatch, auto-reply-dispatch en queues, en ACP control-plane-runtimecontracten                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-servers en tool-bridges, procesbewakingshelpers en contracten voor uitgaande levering                                                                         |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host-SDK, memory-runtimefacades, memory Plugin SDK-aliassen, memory-runtime-activeringskoppeling en memory doctor-commands                                |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internals van reply-queues, sessieleveringsqueues, helpers voor uitgaande sessiebinding/-levering, diagnostic event-/logbundelraakvlakken en session doctor CLI-contracten |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply-dispatch, reply-payload-/chunking-/runtimehelpers, channel-replyopties, leveringsqueues en helpers voor session-/thread-binding         |
| `/codeql-critical-quality/provider-runtime-boundary`    | Modelcatalogusnormalisatie, provider-auth en discovery, provider-runtime-registratie, provider-defaults/catalogi en web-/search-/fetch-/embedding-registries     |
| `/codeql-critical-quality/ui-control-plane`             | Control UI-bootstrap, lokale persistentie, Gateway-controlflows en task control-plane-runtimecontracten                                                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search, media-IO, media understanding, image-generation en media-generation-runtimecontracten                                                      |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, registry-, public-surface- en Plugin SDK-entrypointcontracten                                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Gepubliceerde package-side Plugin SDK-source en helpers voor plugin-pakketcontracten                                                                              |

Quality blijft gescheiden van security, zodat quality-bevindingen gepland, gemeten, uitgeschakeld of uitgebreid kunnen worden zonder security-signaal te vertroebelen. Swift-, Python- en gebundelde-plugin-CodeQL-uitbreiding moet alleen weer worden toegevoegd als scoped of geshard vervolgwerk nadat de smalle profielen een stabiele runtime en stabiel signaal hebben.

## Onderhoudsworkflows

### Docs Agent

De `Docs Agent`-workflow is een event-driven Codex-onderhoudslane om bestaande docs afgestemd te houden op recent gelande wijzigingen. Deze heeft geen puur schema: een succesvolle niet-bot push-CI-run op `main` kan hem triggeren, en handmatige dispatch kan hem direct draaien. Workflow-run-aanroepen worden overgeslagen wanneer `main` is doorgeschoven of wanneer in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is aangemaakt. Wanneer hij draait, beoordeelt hij het commitbereik vanaf de vorige niet-overgeslagen Docs Agent-bron-SHA tot de huidige `main`, zodat één uurlijkse run alle main-wijzigingen kan dekken die sinds de laatste docs-pass zijn verzameld.

### Test Performance Agent

De `Test Performance Agent`-workflow is een event-driven Codex-onderhoudslane voor trage tests. Deze heeft geen puur schema: een succesvolle niet-bot push-CI-run op `main` kan hem triggeren, maar hij slaat over als op die UTC-dag al een andere workflow-run-aanroep heeft gedraaid of draait. Handmatige dispatch omzeilt die dagelijkse activiteitsgate. De lane bouwt een gegroepeerd Vitest-performancerapport voor de volledige suite, laat Codex alleen kleine testperformancefixes maken die coverage behouden in plaats van brede refactors, draait daarna het volledige-suiterapport opnieuw en wijst wijzigingen af die het baseline-aantal geslaagde tests verminderen. Het gegroepeerde rapport registreert per-config wall time en maximale RSS op Linux en macOS, zodat de voor/na-vergelijking testgeheugendelta's naast duurdelta's toont. Als de baseline falende tests heeft, mag Codex alleen duidelijke failures oplossen en moet het na-agent volledige-suiterapport slagen voordat iets wordt gecommit. Wanneer `main` vooruitgaat voordat de bot-push landt, rebaset de lane de gevalideerde patch, draait `pnpm check:changed` opnieuw en probeert de push opnieuw; conflicterende verouderde patches worden overgeslagen. De lane gebruikt door GitHub gehoste Ubuntu, zodat de Codex-action dezelfde drop-sudo-safetyhouding kan behouden als de docs-agent.

### Duplicate PRs After Merge

De `Duplicate PRs After Merge`-workflow is een handmatige maintainer-workflow voor duplicate cleanup na landing. Standaard is dit een dry-run en worden alleen expliciet vermelde PR's gesloten wanneer `apply=true`. Voordat GitHub wordt gemuteerd, verifieert de workflow dat de gelande PR is gemerged en dat elke duplicate ofwel een gedeeld gerefereerd issue heeft, of overlappende gewijzigde hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale check-gates en changed-routing

Lokale changed-lane-logica staat in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale check-gate is strenger over architectuurgrenzen dan de brede CI-platformscope:

- core-productiewijzigingen draaien core prod- en core test-typecheck plus core lint/guards;
- core test-only-wijzigingen draaien alleen core test-typecheck plus core lint;
- extension-productiewijzigingen draaien extension prod- en extension test-typecheck plus extension lint;
- extension test-only-wijzigingen draaien extension test-typecheck plus extension lint;
- public Plugin SDK- of plugin-contractwijzigingen breiden uit naar extension-typecheck omdat extensions afhankelijk zijn van die core-contracten (Vitest extension-sweeps blijven expliciet testwerk);
- version bumps die alleen release-metadata wijzigen, draaien gerichte version-/config-/root-dependencychecks;
- onbekende root-/configwijzigingen failen veilig naar alle checklanes.

Lokale changed-test-routing staat in `scripts/test-projects.test-support.mjs` en is bewust goedkoper dan `check:changed`: directe testedits draaien zichzelf, source-edits geven voorkeur aan expliciete mappings, daarna sibling-tests en import-graph-dependents. Shared group-room delivery-config is een van de expliciete mappings: wijzigingen aan de group visible-reply-config, source reply delivery mode of de message-tool system prompt routeren via de core reply-tests plus Discord- en Slack-leveringsregressies, zodat een gedeelde defaultwijziging faalt vóór de eerste PR-push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging zo harness-breed is dat de goedkope gemapte set geen betrouwbare proxy is.

## Testbox-validatie

Crabbox is de repo-eigen remote-box wrapper voor maintainer-Linux-bewijs. Gebruik deze vanuit de repo-root wanneer een check te breed is voor een lokale edit-loop, wanneer CI-pariteit belangrijk is, of wanneer het bewijs secrets, Docker, package-lanes, herbruikbare boxes of remote logs nodig heeft. De normale OpenClaw-backend is `blacksmith-testbox`; eigen AWS-/Hetzner-capaciteit is een fallback voor Blacksmith-storingen, quotaproblemen of expliciete tests met eigen capaciteit.

Crabbox-ondersteunde Blacksmith-runs warmen eenmalige Testboxes op, claimen, synchroniseren, voeren uit, rapporteren en ruimen ze op. De ingebouwde sanitycheck voor synchronisatie faalt snel wanneer vereiste rootbestanden zoals `pnpm-lock.yaml` verdwijnen of wanneer `git status --short` minstens 200 gevolgde verwijderingen toont. Stel voor bewuste PR's met veel verwijderingen `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor de externe opdracht.

Crabbox beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de synchronisatiefase blijft zonder uitvoer na synchronisatie. Stel `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` in om die beveiliging uit te schakelen, of gebruik een grotere millisecondewaarde voor ongewoon grote lokale diffs.

Controleer vóór een eerste run de wrapper vanuit de repo-root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

De repo-wrapper weigert een verouderde Crabbox-binary die `blacksmith-testbox` niet adverteert. Geef de provider expliciet door, ook al heeft `.crabbox.yaml` standaardinstellingen voor owned-cloud. Vermijd in Codex-worktrees of gekoppelde/sparse checkouts het lokale script `pnpm crabbox:run`, omdat pnpm afhankelijkheden kan reconciliëren voordat Crabbox start; roep in plaats daarvan de node-wrapper direct aan:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith-ondersteunde runs vereisen Crabbox 0.22.0 of nieuwer, zodat de wrapper het huidige gedrag voor Testbox-synchronisatie, wachtrijen en opschoning krijgt. Bouw bij gebruik van de sibling-checkout de genegeerde lokale binary opnieuw voordat je timing- of bewijswerk doet:

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

Lees de uiteindelijke JSON-samenvatting. De nuttige velden zijn `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` en `totalMs`. Voor gedelegeerde Blacksmith Testbox-runs zijn de exitcode van de Crabbox-wrapper en de JSON-samenvatting het opdrachtresultaat. De gekoppelde GitHub Actions-run is eigenaar van hydration en keepalive; die kan eindigen als `cancelled` wanneer de Testbox extern wordt gestopt nadat de SSH-opdracht al is teruggekeerd. Behandel dat als een opschonings-/statusartefact, tenzij de `exitCode` van de wrapper niet nul is of de opdrachtuitvoer een mislukte test toont. Eenmalige Blacksmith-ondersteunde Crabbox-runs moeten de Testbox automatisch stoppen; als een run wordt onderbroken of de opschoning onduidelijk is, inspecteer dan live boxes en stop alleen de boxes die je hebt gemaakt:

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

Als Crabbox de kapotte laag is maar Blacksmith zelf werkt, gebruik directe Blacksmith dan alleen voor diagnostiek zoals `list`, `status` en opschoning. Herstel het Crabbox-pad voordat je een directe Blacksmith-run als maintainer-bewijs behandelt.

Als `blacksmith testbox list --all` en `blacksmith testbox status` werken, maar nieuwe warmups na een paar minuten `queued` blijven zonder IP of Actions-run-URL, behandel dit dan als druk door de Blacksmith-provider, wachtrij, facturering of organisatielimieten. Stop de queued ids die je hebt gemaakt, start geen extra Testboxes en verplaats het bewijs naar het owned Crabbox-capaciteitspad hieronder terwijl iemand het Blacksmith-dashboard, de facturering en de organisatielimieten controleert.

Escaleren naar owned Crabbox-capaciteit alleen wanneer Blacksmith offline is, door quota beperkt is, de benodigde omgeving mist, of owned capaciteit expliciet het doel is:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Vermijd onder AWS-druk `class=beast`, tenzij de taak echt 48xlarge-klasse CPU nodig heeft. Een `beast`-aanvraag start bij 192 vCPU's en is de makkelijkste manier om regionale EC2 Spot- of On-Demand Standard-quota te raken. De repo-owned `.crabbox.yaml` gebruikt standaard `standard`, meerdere capaciteitsregio's en `capacity.hints: true`, zodat gebrokerde AWS-leases de geselecteerde regio/markt, quotadruk, Spot-fallback en waarschuwingen voor high-pressure klassen afdrukken. Gebruik `fast` voor zwaardere brede checks, `large` alleen nadat standard/fast niet genoeg zijn, en `beast` alleen voor uitzonderlijke CPU-gebonden lanes zoals volledige suite- of all-plugin Docker-matrices, expliciete release-/blocker-validatie of high-core prestatieprofilering. Gebruik `beast` niet voor `pnpm check:changed`, gerichte tests, docs-only werk, gewone lint/typecheck, kleine E2E-repro's of Blacksmith-storingstriage. Gebruik `--market on-demand` voor capaciteitsdiagnose, zodat Spot-marktschommelingen niet door het signaal worden gemengd.

`.crabbox.yaml` is eigenaar van de standaardinstellingen voor provider, synchronisatie en GitHub Actions-hydration voor owned-cloud lanes. Het sluit lokale `.git` uit, zodat de gehydrateerde Actions-checkout zijn eigen externe Git-metadata behoudt in plaats van maintainer-lokale remotes en object stores te synchroniseren, en het sluit lokale runtime-/buildartefacten uit die nooit mogen worden overgedragen. `.github/workflows/crabbox-hydrate.yml` is eigenaar van checkout, Node/pnpm-setup, `origin/main` fetch en de niet-geheime omgevingshandoff voor owned-cloud-opdrachten `crabbox run --id <cbx_id>`.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Ontwikkelingskanalen](/nl/install/development-channels)
