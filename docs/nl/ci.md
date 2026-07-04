---
read_when:
    - Je moet begrijpen waarom een CI-taak wel of niet is uitgevoerd
    - Je debugt een falende GitHub Actions-controle
    - Je coördineert een releasevalidatierun of herhaling daarvan
    - Je wijzigt ClawSweeper-dispatch of het doorsturen van GitHub-activiteit
summary: CI-taakgrafiek, scope-gates, releaseparaplu’s en lokale commando-equivalenten
title: CI-pijplijn
x-i18n:
    generated_at: "2026-07-04T18:07:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af8650cc7f194a7770c0f997d3c7a6a8f0307a9ce0a00525250e6a853ddecef1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI draait bij elke push naar `main` en elke pull request. Canonieke
`main`-pushes gaan eerst door een toelatingsvenster van 90 seconden op hosted runners.
De bestaande `CI`-concurrencygroep annuleert die wachtende run wanneer er een nieuwere
commit binnenkomt, zodat opeenvolgende merges niet elk een volledige Blacksmith-
matrix registreren. Pull requests en handmatige dispatches slaan de wachttijd over. De `preflight`-taak
classificeert vervolgens de diff en schakelt dure lanes uit wanneer alleen niet-gerelateerde
gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen bewust slimme
scoping en waaieren uit naar de volledige graaf voor releasekandidaten en brede
validatie. Android-lanes blijven opt-in via `include_android`. Release-only
Plugin-dekking staat in de afzonderlijke [`Plugin Prerelease`](#plugin-prerelease)
workflow en draait alleen vanuit [`Volledige Releasevalidatie`](#full-release-validation)
of een expliciete handmatige dispatch.

## Pipeline-overzicht

| Taak                               | Doel                                                                                                      | Wanneer deze draait                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `preflight`                        | Detecteert docs-only wijzigingen, gewijzigde scopes, gewijzigde extensies en bouwt het CI-manifest        | Altijd bij niet-conceptpushes en PR's                |
| `runner-admission`                 | Gehoste debounce van 90 seconden voor canonieke `main`-pushes voordat Blacksmith-werk wordt geregistreerd | Elke CI-run; slaapt alleen bij canonieke `main`-pushes |
| `security-fast`                    | Detectie van privésleutels, audit van gewijzigde workflows via `zizmor` en audit van productie-lockfiles  | Altijd bij niet-conceptpushes en PR's                |
| `check-dependencies`               | Productie-Knip-pass alleen voor afhankelijkheden plus de allowlist-guard voor ongebruikte bestanden       | Node-relevante wijzigingen                           |
| `build-artifacts`                  | Bouwt `dist/`, Control UI, smokechecks voor gebouwde CLI, controles op ingebedde build-artifacts en herbruikbare artifacts | Node-relevante wijzigingen                           |
| `checks-fast-core`                 | Snelle Linux-correctheidslanes zoals gebundeld, protocol, QA Smoke CI en CI-routeringscontroles           | Node-relevante wijzigingen                           |
| `checks-fast-contracts-plugins-*`  | Twee gesharde Plugin-contractcontroles                                                                    | Node-relevante wijzigingen                           |
| `checks-fast-contracts-channels-*` | Twee gesharde kanaalcontractcontroles                                                                     | Node-relevante wijzigingen                           |
| `checks-node-core-*`               | Core Node-testshards, exclusief kanaal-, gebundelde, contract- en extensielanes                           | Node-relevante wijzigingen                           |
| `check-*`                          | Geshaarde equivalent van de lokale main-gate: productietypen, lint, guards, testtypen en strikte smoke    | Node-relevante wijzigingen                           |
| `check-additional-*`               | Architectuur, gesharde boundary-/promptdrift, extensieguards, package-boundary en runtimetopologie        | Node-relevante wijzigingen                           |
| `checks-node-compat-node22`        | Node 22-compatibiliteitsbuild en smoke-lane                                                               | Handmatige CI-dispatch voor releases                 |
| `check-docs`                       | Docs-formattering, lint en controles op gebroken links                                                    | Docs gewijzigd                                       |
| `skills-python`                    | Ruff + pytest voor Python-backed Skills                                                                   | Python-Skill-relevante wijzigingen                   |
| `checks-windows`                   | Windows-specifieke proces-/padtests plus gedeelde regressies voor runtime-importspecifier                 | Windows-relevante wijzigingen                        |
| `macos-node`                       | macOS TypeScript-testlane met de gedeelde gebouwde artifacts                                              | macOS-relevante wijzigingen                          |
| `macos-swift`                      | Swift-lint, build en tests voor de macOS-app                                                              | macOS-relevante wijzigingen                          |
| `ios-build`                        | Xcode-projectgeneratie plus de simulatorbuild van de iOS-app                                             | iOS-app, gedeelde appkit of Swabble-wijzigingen      |
| `android`                          | Android-unittests voor beide smaken plus één debug-APK-build                                             | Android-relevante wijzigingen                        |
| `test-performance-agent`           | Dagelijkse optimalisatie van trage Codex-tests na vertrouwde activiteit                                  | Succesvolle main-CI of handmatige dispatch           |
| `openclaw-performance`             | Dagelijkse/on-demand Kova-runtimeprestatierapporten met mock-provider, deep-profile en GPT 5.5 live-lanes | Geplande en handmatige dispatch                      |

## Fail-fast-volgorde

1. `runner-admission` wacht alleen op canonieke `main`-pushes; een nieuwere push annuleert de run vóór Blacksmith-registratie.
2. `preflight` beslist welke lanes überhaupt bestaan. De `docs-scope`- en `changed-scope`-logica zijn stappen binnen deze taak, geen zelfstandige taken.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` en `skills-python` falen snel zonder te wachten op de zwaardere artifact- en platformmatrixtaken.
4. `build-artifacts` overlapt met de snelle Linux-lanes zodat downstreamconsumenten kunnen starten zodra de gedeelde build klaar is.
5. Zwaardere platform- en runtimelanes waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` en `android`.

GitHub kan vervangen taken als `cancelled` markeren wanneer er een nieuwere push op dezelfde PR- of `main`-ref binnenkomt. Behandel dat als CI-ruis tenzij de nieuwste run voor dezelfde ref ook faalt. Matrixtaken gebruiken `fail-fast: false`, en `build-artifacts` rapporteert ingebedde kanaal-, core-support-boundary- en gateway-watch-fouten direct in plaats van kleine verificatietaken in de wachtrij te zetten. De automatische CI-concurrencysleutel is geversioneerd (`CI-v7-*`), zodat een zombie aan GitHub-zijde in een oude wachtrijgroep nieuwere main-runs niet onbeperkt kan blokkeren. Handmatige runs van de volledige suite gebruiken `CI-manual-v1-*` en annuleren lopende runs niet.

Gebruik `pnpm ci:timings`, `pnpm ci:timings:recent` of `node scripts/ci-run-timings.mjs <run-id>` om wall time, wachtrijtijd, langzaamste taken, fouten en de `pnpm-store-warmup`-fanoutbarrière uit GitHub Actions samen te vatten. CI uploadt dezelfde runsamenvatting ook als een `ci-timings-summary`-artifact. Controleer voor buildtiming de `Build dist`-stap van de `build-artifacts`-taak: `pnpm build:ci-artifacts` print `[build-all] phase timings:` en bevat `ui:build`; de taak uploadt ook het `startup-memory`-artifact.

Voor pullrequest-runs voert de terminale timing-summary-taak de helper uit vanaf de vertrouwde baserevisie voordat `GH_TOKEN` aan `gh run view` wordt doorgegeven. Zo blijft de query met token buiten branchgestuurde code, terwijl de huidige CI-run van de pull request toch wordt samengevat.

## PR-context en bewijs

Externe contributor-PR's draaien een PR-context- en bewijsgate vanuit
`.github/workflows/real-behavior-proof.yml`. De workflow checkt de vertrouwde
basecommit uit en evalueert alleen de PR-body; er wordt geen code uit de
contributor-branch uitgevoerd.

De gate geldt voor PR-auteurs die geen repository-eigenaren, leden,
collaborators of bots zijn. Deze slaagt wanneer de PR-body zelfgeschreven
secties `What Problem This Solves` en `Evidence` bevat. Bewijs kan een gerichte
test, CI-resultaat, screenshot, opname, terminaluitvoer, live observatie,
geredigeerde log of artifact-link zijn. De body geeft intentie en nuttige validatie;
reviewers inspecteren de code, tests en CI om correctheid te beoordelen.

Wanneer de controle faalt, werk dan de PR-body bij in plaats van nog een codecommit te pushen.

## Scope en routering

Scopelogica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unittests in `src/scripts/ci-changed-scope.test.ts`. Handmatige dispatch slaat detectie van changed-scope over en laat het preflight-manifest zich gedragen alsof elk scoped gebied is gewijzigd.

- **CI-workflowbewerkingen** valideren de Node CI-graaf plus workflowlinting, maar forceren op zichzelf geen Windows-, iOS-, Android- of macOS-native builds; die platformlanes blijven gescoped op platformbronwijzigingen.
- **Workflow-sanity** draait `actionlint`, `zizmor` over alle workflow-YAML-bestanden, de guard voor composite-action-interpolatie en de guard voor conflictmarkers. De PR-gescopete `security-fast`-taak draait ook `zizmor` over gewijzigde workflowbestanden, zodat workflowsecuritybevindingen vroeg in de hoofd-CI-graaf falen.
- **Docs op `main`-pushes** worden gecontroleerd door de zelfstandige `Docs`-workflow met dezelfde ClawHub-docsmirror die CI gebruikt, zodat gemengde code+docs-pushes niet ook de CI-`check-docs`-shard in de wachtrij zetten. Pull requests en handmatige CI draaien nog steeds `check-docs` vanuit CI wanneer docs zijn gewijzigd.
- **TUI PTY** draait in de Linux Node-shard `checks-node-core-runtime-tui-pty` voor TUI-wijzigingen. De shard draait `test/vitest/vitest.tui-pty.config.ts` met `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, zodat deze zowel de deterministische `TuiBackend`-fixturelane als de tragere `tui --local`-smoke dekt, die alleen het externe modeleindpunt mockt.
- **Bewerkingen die alleen CI-routering raken, geselecteerde goedkope fixturebewerkingen voor core-tests en smalle helper-/testrouteringsbewerkingen voor Plugin-contracten** gebruiken een snel Node-only manifestpad: `preflight`, security en één `checks-fast-core`-taak. Dat pad slaat build-artifacts, Node 22-compatibiliteit, kanaalcontracten, volledige core-shards, gebundelde-Plugin-shards en aanvullende guard-matrices over wanneer de wijziging beperkt is tot de routerings- of helperoppervlakken die de snelle taak direct oefent.
- **Windows Node-controles** zijn gescoped op Windows-specifieke proces-/padwrappers, npm-/pnpm-/UI-runnerhelpers, package-managerconfiguratie en de CI-workflowoppervlakken die die lane uitvoeren; niet-gerelateerde bron-, Plugin-, install-smoke- en test-only wijzigingen blijven op de Linux Node-lanes.

De traagste Node-testfamilies zijn opgesplitst of uitgebalanceerd zodat elke job klein blijft zonder runners overmatig te reserveren: Plugin-contracten en kanaalcontracten draaien elk als twee gewogen, door Blacksmith ondersteunde shards met de standaard fallback naar GitHub-runners, snelle/support-lanes voor core-unit draaien afzonderlijk, core-runtime-infra is opgesplitst tussen state, process/config, shared en drie cron-domeinshards, auto-reply draait als uitgebalanceerde workers (waarbij de reply-subtree is opgesplitst in agent-runner-, dispatch- en commands/state-routing-shards), en agentic gateway/server-configs zijn verdeeld over chat/auth/model/http-plugin/runtime/startup-lanes in plaats van te wachten op gebouwde artefacten. Normale CI verpakt daarna alleen geisoleerde infra-include-pattern-shards in deterministische bundels van maximaal 64 testbestanden, waardoor de Node-matrix kleiner wordt zonder niet-geisoleerde command/cron-, stateful agents-core- of gateway/server-suites samen te voegen; zware vaste suites blijven op 8 vCPU, terwijl de gebundelde en lichtere lanes 4 vCPU gebruiken. Pull requests op de canonieke repository gebruiken een extra compact toelatingsplan: dezelfde groepen per configuratie draaien in geisoleerde subprocessen binnen het huidige Linux Node-plan van 34 jobs, zodat een enkele PR niet de volledige Node-matrix van meer dan 70 jobs registreert. `main`-pushes, handmatige dispatches en release-gates behouden de volledige matrix. Brede browser-, QA-, media- en overige Plugin-tests gebruiken hun eigen Vitest-configuraties in plaats van de gedeelde Plugin-catch-all. Include-pattern-shards registreren timingvermeldingen met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een volledige configuratie kan onderscheiden van een gefilterde shard. `check-additional-*` houdt package-boundary compile/canary-werk bij elkaar en scheidt runtime-topologiearchitectuur van gateway-watch-dekking; de boundary-guard-lijst wordt gestreept in een prompt-zware shard en een gecombineerde shard voor de resterende guard-strepen, waarbij elke shard geselecteerde onafhankelijke guards gelijktijdig draait en timings per check afdrukt. De dure Codex-happy-path prompt-snapshotdriftcheck draait als eigen aanvullende job, alleen voor handmatige CI en wijzigingen die prompts beinvloeden, zodat normale niet-gerelateerde Node-wijzigingen niet hoeven te wachten op koude prompt-snapshotgeneratie en de boundary-shards in balans blijven terwijl promptdrift nog steeds wordt vastgepind aan de PR die deze veroorzaakte; dezelfde vlag slaat prompt-snapshot-Vitest-generatie over binnen de gebouwde-artefact core-support-boundary-shard. Gateway-watch, kanaaltests en de core-support-boundary-shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd.

Na toelating staat canonieke Linux-CI maximaal 24 gelijktijdige Node-testjobs toe en
12 voor de kleinere fast/check-lanes; Windows en Android blijven op twee omdat
die runner-pools smaller zijn.

Het compacte PR-plan geeft 18 Node-jobs voor de huidige suite uit: whole-config
groepen worden gebatcht in geisoleerde subprocessen met een batchtimeout van 120 minuten,
terwijl include-pattern-groepen hetzelfde begrensde jobbudget delen.

Android-CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play-debug-APK. De third-party-flavor heeft geen aparte source set of manifest; de unit-test-lane compileert de flavor nog steeds met de SMS/call-log-BuildConfig-vlaggen, terwijl een dubbele debug-APK-packagejob bij elke Android-relevante push wordt vermeden.

De `check-dependencies`-shard draait `pnpm deadcode:dependencies` (een productie-Knip dependency-only-pass vastgepind op de nieuwste Knip-versie, met pnpm's minimale releaseleeftijd uitgeschakeld voor de `dlx`-installatie) en `pnpm deadcode:unused-files`, dat Knips productiebevindingen voor ongebruikte bestanden vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. De unused-file-guard faalt wanneer een PR een nieuw, niet-beoordeeld ongebruikt bestand toevoegt of een verouderde allowlist-vermelding achterlaat, terwijl opzettelijke dynamische Plugin-, gegenereerde, build-, live-test- en package-bridge-oppervlakken behouden blijven die Knip niet statisch kan oplossen.

## ClawSweeper-activiteit doorsturen

`.github/workflows/clawsweeper-dispatch.yml` is de doelzijdige brug van OpenClaw-repositoryactiviteit naar ClawSweeper. Deze workflow checkt geen niet-vertrouwde pull-request-code uit en voert die niet uit. De workflow maakt een GitHub App-token van `CLAWSWEEPER_APP_PRIVATE_KEY` en dispatcht daarna compacte `repository_dispatch`-payloads naar `openclaw/clawsweeper`.

De workflow heeft vier lanes:

- `clawsweeper_item` voor exacte reviewverzoeken voor issues en pull requests;
- `clawsweeper_comment` voor expliciete ClawSweeper-commando's in issue-comments;
- `clawsweeper_commit_review` voor reviewverzoeken op commitniveau bij `main`-pushes;
- `github_activity` voor algemene GitHub-activiteit die de ClawSweeper-agent kan inspecteren.

De `github_activity`-lane stuurt alleen genormaliseerde metadata door: gebeurtenistype, actie, actor, repository, itemnummer, URL, titel, status en korte fragmenten voor comments of reviews wanneer aanwezig. Deze vermijdt bewust het doorsturen van de volledige webhook-body. De ontvangende workflow in `openclaw/clawsweeper` is `.github/workflows/github-activity.yml`, die de genormaliseerde gebeurtenis post naar de OpenClaw Gateway-hook voor de ClawSweeper-agent.

Algemene activiteit is observatie, geen standaardlevering. De ClawSweeper-agent ontvangt het Discord-doel in zijn prompt en moet alleen naar `#clawsweeper` posten wanneer de gebeurtenis verrassend, uitvoerbaar, riskant of operationeel nuttig is. Routinematige opens, bewerkingen, botruis, dubbele webhookruis en normaal reviewverkeer moeten resulteren in `NO_REPLY`.

Behandel GitHub-titels, comments, bodies, reviewtekst, branchnamen en commitberichten als niet-vertrouwde data in dit hele pad. Ze zijn input voor samenvatting en triage, geen instructies voor de workflow of agent-runtime.

## Handmatige dispatches

Handmatige CI-dispatches draaien dezelfde jobgrafiek als normale CI, maar schakelen elke niet-Android scoped lane geforceerd in: Linux Node-shards, bundled-plugin-shards, Plugin- en kanaalcontractshards, Node 22-compatibiliteit, `check-*`, `check-additional-*`, smokechecks voor gebouwde artefacten, docs-checks, Python Skills, Windows, macOS, iOS-build en Control UI i18n. Losstaande handmatige CI-dispatches draaien Android alleen met `include_android=true`; de volledige releaseparaplu schakelt Android in door `include_android=true` door te geven. Statische checks voor Plugin-prereleases, de release-only `agentic-plugins`-shard, de volledige extension-batchsweep en Plugin-prerelease-Docker-lanes zijn uitgesloten van CI. De Docker-prerelease-suite draait alleen wanneer `Full Release Validation` de afzonderlijke `Plugin Prerelease`-workflow dispatcht met de release-validation-gate ingeschakeld.

Handmatige runs gebruiken een unieke concurrency-groep zodat een volledige release-candidate-suite niet wordt geannuleerd door een andere push- of PR-run op dezelfde ref. Met de optionele `target_ref`-input kan een vertrouwde caller die grafiek draaien tegen een branch, tag of volledige commit-SHA terwijl het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

Het maandelijkse npm-only extended-stable-pad is de uitzondering: dispatch zowel de `OpenClaw NPM
Release`-preflight als `Full Release Validation` vanaf de exacte
`extended-stable/YYYY.M.33`-branch, bewaar hun run-ID's en geef beide ID's door aan de
directe npm-publish-run. Zie [Maandelijkse npm-only extended-stable
publicatie](/nl/reference/RELEASING#monthly-npm-only-extended-stable-publication) voor
de commando's, exacte identiteitsvereisten, registry-readback en selector-
reparatieprocedure. Dit pad dispatcht geen Plugin-, macOS-, Windows-, GitHub
Release-, private dist-tag- of andere platformpublicatie.

## Runners

| Runner                          | Jobs                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Handmatige CI-dispatch en fallbacks voor niet-canonieke repositories, CodeQL JavaScript/actions-kwaliteitsscans, workflow-sanity, labeler, auto-response, docs-workflows buiten CI en install-smoke-preflight zodat de Blacksmith-matrix eerder kan queuen                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, lichtere extension-shards, `checks-fast-core` behalve QA Smoke CI, Plugin-/kanaalcontractshards, de meeste gebundelde/lichtere Linux Node-shards, `check-guards`, `check-prod-types`, `check-test-types`, geselecteerde `check-additional-*`-shards en `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Behouden zware Linux Node-suites, boundary-/extension-zware `check-additional-*`-shards en `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` in CI en Testbox, `check-lint` (CPU-gevoelig genoeg dat 8 vCPU meer kostte dan het bespaarde); install-smoke-Docker-builds (32-vCPU-queuetijd kostte meer dan die bespaarde)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` op `openclaw/openclaw`; forks vallen terug op `macos-15`                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` en `ios-build` op `openclaw/openclaw`; forks vallen terug op `macos-26`                                                                                                                                                                                                                     |

## Runner-registratiebudget

OpenClaws huidige GitHub-runner-registratiebucket rapporteert 10.000 self-hosted
runnerregistraties per 5 minuten in `ghx api rate_limit`. Controleer
`actions_runner_registration` opnieuw voor elke tuning-pass, omdat GitHub deze
bucket kan wijzigen. De limiet wordt gedeeld door alle Blacksmith-runnerregistraties in de
`openclaw`-organisatie, dus het toevoegen van nog een Blacksmith-installatie voegt geen
nieuwe bucket toe.

Behandel Blacksmith-labels als de schaarse resource voor burstcontrole. Jobs die
alleen routeren, notificeren, samenvatten, shards selecteren of korte CodeQL-scans draaien, moeten
op GitHub-hosted runners blijven tenzij ze gemeten Blacksmith-specifieke
behoeften hebben. Elke nieuwe Blacksmith-matrix, grotere `max-parallel` of hoogfrequente
workflow moet zijn worst-case registratieaantal tonen en het organisatieniveau-
doel onder ongeveer 60% van de live bucket houden. Met de huidige bucket van 10.000 registraties
betekent dat een operationeel doel van 6.000 registraties, met ruimte voor
gelijktijdige repositories, retries en overlappende bursts.

CI voor de canonieke repository houdt Blacksmith als het standaard runner-pad voor normale push- en pull-request-runs. `workflow_dispatch` en runs van niet-canonieke repositories gebruiken GitHub-hosted runners, maar normale canonieke runs peilen momenteel niet de gezondheid van de Blacksmith-queue en vallen niet automatisch terug op GitHub-hosted labels wanneer Blacksmith niet beschikbaar is.

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

Handmatige dispatch benchmarkt normaal gesproken de workflow-ref. Stel `target_ref` in om een releasetag of een andere branch met de huidige workflow-implementatie te benchmarken. Gepubliceerde rapportpaden en nieuwste verwijzingen worden gesleuteld op de geteste ref, en elke `index.md` registreert de geteste ref/SHA, workflow-ref/SHA, Kova-ref, profiel, lane-authenticatiemodus, model, herhaalaantal en scenariofilters.

De workflow installeert OCM vanuit een vastgepinde release en Kova vanuit `openclaw/Kova` op de vastgepinde invoer `kova_ref`, en voert daarna drie lanes uit:

- `mock-provider`: Kova-diagnosescenario's tegen een lokaal gebouwde runtime met deterministische nep-authenticatie die OpenAI-compatibel is.
- `mock-deep-profile`: CPU-/heap-/trace-profilering voor hotspots bij opstarten, Gateway en agent-turns.
- `live-openai-candidate`: een echte OpenAI `openai/gpt-5.5` agent-turn, overgeslagen wanneer `OPENAI_API_KEY` niet beschikbaar is.

De mock-provider-lane voert ook OpenClaw-native source-probes uit na de Kova-pass: Gateway-opstarttiming en geheugen voor standaard-, hook- en 50-Plugin-opstartgevallen; RSS bij importeren van gebundelde Plugins, herhaalde mock-OpenAI `channel-chat-baseline` hallo-loops, CLI-opstartcommando's tegen de opgestarte Gateway, en de SQLite-state-smoke-prestatieprobe. Wanneer het vorige gepubliceerde mock-provider-source-rapport beschikbaar is voor de geteste ref, vergelijkt de source-samenvatting huidige RSS- en heapwaarden met die baseline en markeert grote RSS-toenames als `watch`. De Markdown-samenvatting van de source-probe staat op `source/index.md` in de rapportbundel, met ruwe JSON ernaast.

Elke lane uploadt GitHub-artifacts. Wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd, commit de workflow ook `report.json`, `report.md`, bundels, `index.md` en source-probe-artifacts naar `openclaw/clawgrit-reports` onder `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. De huidige pointer voor de geteste ref wordt geschreven als `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Volledige releasevalidatie

`Full Release Validation` is de handmatige overkoepelende workflow voor "alles vóór de release draaien". Deze accepteert een branch, tag of volledige commit-SHA, start de handmatige `CI`-workflow met dat doel, start `Plugin Prerelease` voor release-only Plugin-/package-/statische-/Docker-bewijsvoering, en start `OpenClaw Release Checks` voor install-smoke, package-acceptatie, cross-OS-packagechecks, rendering van maturity-scorecards uit QA-profielbewijs, QA Lab-pariteit, Matrix- en Telegram-lanes. Stabiele en volledige profielen bevatten altijd uitputtende live/E2E- en Docker-releasepad-duurtestdekking; het bètaprofiel kan dit inschakelen met `run_release_soak=true`. De canonieke Package Telegram E2E draait binnen Package Acceptance, zodat een volledige kandidaat geen dubbele live-poller start. Geef na publicatie `release_package_spec` door om het verzonden npm-package opnieuw te gebruiken in releasechecks, Package Acceptance, Docker, cross-OS en Telegram zonder opnieuw te bouwen. Gebruik `npm_telegram_package_spec` alleen voor een gerichte herhaling van Telegram met een gepubliceerd package. De live package-lane van de Codex-Plugin gebruikt standaard dezelfde geselecteerde state: gepubliceerde `release_package_spec=openclaw@<tag>` leidt `codex_plugin_spec=npm:@openclaw/codex@<tag>` af, terwijl SHA-/artifact-runs `extensions/codex` packen vanuit de geselecteerde ref. Stel `codex_plugin_spec` expliciet in voor aangepaste Plugin-bronnen zoals `npm:`-, `npm-pack:`- of `git:`-specificaties.

Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
fasematrix, exacte workflow-jobnamen, profielverschillen, artifacts en
handles voor gerichte herhalingen.

`OpenClaw Release Publish` is de handmatige muterende release-workflow. Start deze
vanaf `release/YYYY.M.PATCH` of `main` nadat de releasetag bestaat en nadat de
OpenClaw npm-preflight is geslaagd. Deze verifieert `pnpm plugins:sync:check`,
start `Plugin NPM Release` voor alle publiceerbare Plugin-packages, start
`Plugin ClawHub Release` voor dezelfde release-SHA, en start pas daarna
`OpenClaw NPM Release` met de opgeslagen `preflight_run_id`. Stabiel publiceren
vereist ook een exacte `windows_node_tag`; de workflow verifieert de Windows-source-
release en vergelijkt de x64/ARM64-installers met de kandidaat-goedgekeurde
invoer `windows_node_installer_digests` vóór elk publish-child, en promoot en
verifieert daarna diezelfde vastgepinde installer-digests plus het exacte
bijbehorende asset- en checksumcontract voordat de GitHub-release-draft wordt
gepubliceerd.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Voor vastgepind commitbewijs op een snel bewegende branch gebruikt u de helper in plaats van
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-workflow-dispatch-refs moeten branches of tags zijn, geen ruwe commit-SHA's. De
helper pusht een tijdelijke branch `release-ci/<sha>-...` op de doel-SHA,
start `Full Release Validation` vanaf die vastgepinde ref, verifieert dat elke child-
workflow `headSha` overeenkomt met het doel, en verwijdert de tijdelijke branch wanneer de
run is voltooid. De overkoepelende verifier faalt ook als een child-workflow op een
andere SHA draaide.

`release_profile` bepaalt de live/provider-breedte die wordt doorgegeven aan releasechecks. De
handmatige release-workflows gebruiken standaard `stable`; gebruik `full` alleen wanneer u
bewust de brede adviserende provider-/mediamatrix wilt. Stabiele en volledige
releasechecks draaien altijd de uitputtende live/E2E- en Docker-releasepad-duurtest;
het bètaprofiel kan dit inschakelen met `run_release_soak=true`.

- `minimum` behoudt de snelste OpenAI-/core-releasekritieke lanes.
- `stable` voegt de stabiele provider-/backendset toe.
- `full` draait de brede adviserende provider-/mediamatrix.

De overkoepelende workflow registreert de gestarte child-run-id's, en de laatste job `Verify full validation` controleert huidige child-run-conclusies opnieuw en voegt tabellen met traagste jobs toe voor elke child-run. Als een child-workflow opnieuw wordt gedraaid en groen wordt, draai dan alleen de parent-verifier-job opnieuw om het overkoepelende resultaat en de timingsamenvatting te vernieuwen.

Voor herstel accepteren zowel `Full Release Validation` als `OpenClaw Release Checks` `rerun_group`. Gebruik `all` voor een releasekandidaat, `ci` voor alleen de normale volledige CI-child, `plugin-prerelease` voor alleen de Plugin-prerelease-child, `release-checks` voor elke release-child, of een smallere groep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` of `npm-telegram` op de overkoepelende workflow. Dit houdt een herhaling van een mislukte release-box begrensd na een gerichte fix. Combineer voor één mislukte cross-OS-lane `rerun_group=cross-os` met `cross_os_suite_filter`, bijvoorbeeld `windows/packaged-upgrade`; lange cross-OS-commando's geven Heartbeat-regels uit en packaged-upgrade-samenvattingen bevatten timings per fase. QA-releasecheck-lanes zijn adviserend, behalve de standaard runtime-tooldekking-gate, die blokkeert wanneer vereiste dynamische OpenClaw-tools afwijken of verdwijnen uit de standaardtiersamenvatting.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde ref één keer op te lossen naar een `release-package-under-test`-tarball, en geeft dat artifact daarna door aan cross-OS-checks en Package Acceptance, plus de live/E2E-releasepad-Docker-workflow wanneer duurtestdekking draait. Dat houdt de packagebytes consistent tussen release-boxes en voorkomt dat dezelfde kandidaat opnieuw wordt gepackt in meerdere child-jobs. Voor de live lane van de Codex-npm-Plugin geven releasechecks een overeenkomende gepubliceerde Plugin-specificatie door die is afgeleid van `release_package_spec`, geven ze de door de operator opgegeven `codex_plugin_spec` door, of laten ze de invoer leeg zodat het Docker-script de Codex-Plugin van de geselecteerde checkout packt.

Dubbele `Full Release Validation`-runs voor `ref=main` en `rerun_group=all`
vervangen de oudere overkoepelende workflow. De parent-monitor annuleert elke child-workflow die
hij al heeft gestart wanneer de parent wordt geannuleerd, zodat nieuwere main-validatie
niet achter een verouderde releasecheck-run van twee uur blijft staan. Releasebranch-/tag-
validatie en gerichte rerun-groepen behouden `cancel-in-progress: false`.

## Live- en E2E-shards

De release-live/E2E-child behoudt brede native `pnpm test:live`-dekking, maar draait deze als benoemde shards via `scripts/test-live-shard.mjs` in plaats van als één seriële job:

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
- opgesplitste media-audio-/videoshards en provider-gefilterde muziekshards

Dat behoudt dezelfde bestandsdekking en maakt trage live-providerfouten gemakkelijker opnieuw te draaien en te diagnosticeren. De geaggregeerde shardnamen `native-live-extensions-o-z`, `native-live-extensions-media` en `native-live-extensions-media-music` blijven geldig voor handmatige eenmalige herhalingen.

De native live-mediashards draaien in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de workflow `Live Media Runner Image`. Die image installeert `ffmpeg` en `ffprobe` vooraf; mediajobs verifiëren alleen de binaries vóór setup. Houd Docker-ondersteunde live-suites op normale Blacksmith-runners — containerjobs zijn de verkeerde plaats om geneste Docker-tests te starten.

Door Docker ondersteunde live model-/backend-shards gebruiken een afzonderlijke gedeelde `ghcr.io/openclaw/openclaw-live-test:<sha>`-image per geselecteerde commit. De live release-workflow bouwt en pusht die image eenmaal; daarna draaien de Docker live model-, provider-gesharde Gateway-, CLI-backend-, ACP-bind- en Codex harness-shards met `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker-shards hebben expliciete `timeout`-limieten op scriptniveau onder de workflow-jobtimeout, zodat een vastgelopen container of opruimpad snel faalt in plaats van het hele release-checkbudget te verbruiken. Als die shards het volledige Docker-doel voor de broncode zelfstandig opnieuw bouwen, is de release-run verkeerd geconfigureerd en verspilt die verstreken tijd aan dubbele image-builds.

## Pakketacceptatie

Gebruik `Package Acceptance` wanneer de vraag is: "werkt dit installeerbare OpenClaw-pakket als product?" Het verschilt van normale CI: normale CI valideert de source tree, terwijl pakketacceptatie één tarball valideert via dezelfde Docker E2E-harness die gebruikers na installatie of update gebruiken.

### Jobs

1. `resolve_package` checkt `workflow_ref` uit, bepaalt één pakketkandidaat, schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het artifact `package-under-test`, en print de bron, workflow-ref, pakket-ref, versie, SHA-256 en het profiel in de GitHub-stapsamenvatting.
2. `docker_acceptance` roept `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt dat artifact, valideert de tarball-inventaris, bereidt indien nodig package-digest Docker-images voor, en draait de geselecteerde Docker-lanes tegen dat pakket in plaats van de workflow-checkout te packen. Wanneer een profiel meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het pakket en de gedeelde images eenmaal voor, en waaiert die lanes daarna uit als parallelle gerichte Docker-jobs met unieke artifacts.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Dit draait wanneer `telegram_mode` niet `none` is en installeert hetzelfde artifact `package-under-test` wanneer Package Acceptance er een heeft bepaald; een zelfstandige Telegram-dispatch kan nog steeds een gepubliceerde npm-specificatie installeren.
4. `summary` laat de workflow falen als pakketresolutie, Docker-acceptatie of de optionele Telegram-lane is mislukt.

### Kandidaatbronnen

- `source=npm` accepteert alleen `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor gepubliceerde prerelease-/stabiele acceptatie.
- `source=ref` packt een vertrouwde `package_ref`-branch, tag of volledige commit-SHA. De resolver haalt OpenClaw-branches/tags op, verifieert dat de geselecteerde commit bereikbaar is vanuit de repository-branchgeschiedenis of een releasetag, installeert dependencies in een detached worktree, en packt die met `scripts/package-openclaw-for-docker.mjs`.
- `source=url` downloadt een publieke HTTPS-`.tgz`; `package_sha256` is verplicht. Dit pad weigert URL-inloggegevens, niet-standaard HTTPS-poorten, private/interne/special-use hostnamen of resolved IP's, en redirects buiten hetzelfde publieke veiligheidsbeleid.
- `source=trusted-url` downloadt een HTTPS-`.tgz` vanuit een benoemd trusted-source-beleid in `.github/package-trusted-sources.json`; `package_sha256` en `trusted_source_id` zijn verplicht. Gebruik dit alleen voor door maintainers beheerde enterprise-mirrors of private package repositories die geconfigureerde hosts, poorten, padprefixes, redirect-hosts of private-netwerkresolutie nodig hebben. Als het beleid bearer-auth declarreert, gebruikt de workflow het vaste secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; in de URL ingesloten inloggegevens worden nog steeds geweigerd.
- `source=artifact` downloadt één `.tgz` uit `artifact_run_id` en `artifact_name`; `package_sha256` is optioneel, maar moet worden opgegeven voor extern gedeelde artifacts.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde workflow-/harnesscode die de test draait. `package_ref` is de broncommit die wordt gepackt wanneer `source=ref`. Hierdoor kan de huidige testharness oudere vertrouwde broncommits valideren zonder oude workflowlogica te draaien.

### Suiteprofielen

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — volledige Docker release-path chunks met OpenWebUI
- `custom` — exacte `docker_lanes`; verplicht wanneer `suite_profile=custom`

Het profiel `package` gebruikt offline Plugin-dekking, zodat validatie van gepubliceerde pakketten niet afhankelijk is van live ClawHub-beschikbaarheid. De optionele Telegram-lane hergebruikt het artifact `package-under-test` in `NPM Telegram Beta E2E`, waarbij het gepubliceerde npm-specificatiepad behouden blijft voor zelfstandige dispatches.

Voor het speciale beleid voor update- en Plugin-tests, inclusief lokale commando's,
Docker-lanes, Package Acceptance-invoer, release-standaarden en fouttriage,
zie [Updates en plugins testen](/nl/help/testing-updates-plugins).

Releasechecks roepen Package Acceptance aan met `source=artifact`, het voorbereide releasepakket-artifact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` en `telegram_mode=mock-openai`. Dit houdt pakketmigratie, update, live ClawHub Skills-installatie, opruiming van verouderde Plugin-dependencies, herstel van geconfigureerde Plugin-installatie, offline Plugin, Plugin-update en Telegram-bewijs op dezelfde resolved pakket-tarball. Stel `release_package_spec` in op Full Release Validation of OpenClaw Release Checks nadat een beta is gepubliceerd om dezelfde matrix tegen het geleverde npm-pakket te draaien zonder opnieuw te bouwen; stel `package_acceptance_package_spec` alleen in wanneer Package Acceptance een ander pakket nodig heeft dan de rest van de releasevalidatie. Cross-OS-releasechecks dekken nog steeds OS-specifieke onboarding, installer- en platformgedrag; productvalidatie voor pakketten/updates moet beginnen met Package Acceptance. De Docker-lane `published-upgrade-survivor` valideert één gepubliceerde pakketbaseline per run in het blokkerende releasepad. In Package Acceptance is de resolved tarball `package-under-test` altijd de kandidaat en selecteert `published_upgrade_survivor_baseline` de gepubliceerde fallback-baseline, standaard `openclaw@latest`; rerun-commando's voor mislukte lanes behouden die baseline. Full Release Validation met `run_release_soak=true` of `release_profile=full` stelt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` en `published_upgrade_survivor_scenarios=reported-issues` in om uit te breiden over de vier nieuwste stabiele npm-releases plus vastgepinde boundary-releases voor Plugin-compatibiliteit en issue-vormige fixtures voor Feishu-configuratie, bewaarde bootstrap-/persona-bestanden, geconfigureerde OpenClaw Plugin-installaties, tilde-logpaden en verouderde legacy Plugin-dependency-roots. Selecties voor multi-baseline published-upgrade survivor worden per baseline geshard naar afzonderlijke gerichte Docker-runnerjobs. De afzonderlijke workflow `Update Migration` gebruikt de Docker-lane `update-migration` met `all-since-2026.4.23` en `plugin-deps-cleanup` wanneer de vraag uitputtende gepubliceerde update-opruiming is, niet de normale breedte van Full Release CI. Lokale aggregate-runs kunnen exacte pakketspecificaties doorgeven met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, één lane behouden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` zoals `openclaw@2026.4.15`, of `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` instellen voor de scenariomatrix. De gepubliceerde lane configureert de baseline met een ingebakken `openclaw config set`-commandorecept, legt receptstappen vast in `summary.json`, en probet `/healthz`, `/readyz`, plus RPC-status nadat Gateway is gestart. De Windows packaged- en installer fresh-lanes verifiëren ook dat een geïnstalleerd pakket een browser-control override kan importeren vanuit een rauw absoluut Windows-pad. De OpenAI cross-OS agent-turn smoke gebruikt standaard `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer dat is ingesteld, anders `openai/gpt-5.5`, zodat het installatie- en Gateway-bewijs op een GPT-5-testmodel blijft en GPT-4.x-standaarden vermijdt.

### Legacy-compatibiliteitsvensters

Package Acceptance heeft begrensde legacy-compatibiliteitsvensters voor al gepubliceerde pakketten. Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen het compatibiliteitspad gebruiken:

- bekende private QA-vermeldingen in `dist/postinstall-inventory.json` mogen verwijzen naar bestanden die uit de tarball zijn weggelaten;
- `doctor-switch` mag de subcase voor persistentie van `gateway install --wrapper` overslaan wanneer het pakket die vlag niet aanbiedt;
- `update-channel-switch` mag ontbrekende pnpm `patchedDependencies` uit de van de tarball afgeleide nep-git-fixture snoeien en mag ontbrekende gepersisteerde `update.channel` loggen;
- Plugin-smokes mogen legacy install-record-locaties lezen of ontbrekende persistentie van marketplace install-records accepteren;
- `plugin-update` mag migratie van configuratiemetadata toestaan, terwijl nog steeds vereist blijft dat het install-record en no-reinstall-gedrag ongewijzigd blijven.

Het gepubliceerde pakket `2026.4.26` mag ook waarschuwen voor lokale buildmetadata-stempelbestanden die al geleverd waren. Latere pakketten moeten voldoen aan de moderne contracten; dezelfde omstandigheden falen dan in plaats van te waarschuwen of over te slaan.

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

Begin bij het debuggen van een mislukte pakketacceptatie-run met de samenvatting van `resolve_package` om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de child-run `docker_acceptance` en de Docker-artifacts daarvan: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logs, fasetimings en rerun-commando's. Geef de voorkeur aan het opnieuw draaien van het mislukte pakketprofiel of de exacte Docker-lanes in plaats van volledige releasevalidatie opnieuw te draaien.

## Installatiesmoke

De afzonderlijke workflow `Install Smoke` hergebruikt hetzelfde scope-script via zijn eigen job `preflight`. Die splitst smoke-dekking in `run_fast_install_smoke` en `run_full_install_smoke`.

- **Snel pad** draait voor pull requests die Docker-/package-oppervlakken, gebundelde Plugin-package-/manifestwijzigingen, of core Plugin-/kanaal-/Gateway-/Plugin SDK-oppervlakken raken die de Docker-smokejobs oefenen. Alleen-sourcewijzigingen aan gebundelde Plugins, alleen-testbewerkingen en alleen-docsbewerkingen reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image een keer, controleert de CLI, draait de CLI-smoke voor het verwijderen van agents in een gedeelde workspace, draait de container-gateway-network-e2e, verifieert een build-arg voor gebundelde extensies, en draait het begrensde gebundelde-Plugin-Dockerprofiel onder een totale command-time-out van 240 seconden (de Docker-run van elk scenario wordt afzonderlijk begrensd).
- **Volledig pad** behoudt QR-package-installatie en installer-Docker-/update-dekking voor nachtelijke geplande runs, handmatige dispatches, workflow-call-releasechecks en pull requests die echt installer-/package-/Docker-oppervlakken raken. In volledige modus bereidt install-smoke een target-SHA GHCR-root-Dockerfile-smoke-image voor of hergebruikt die, en draait daarna QR-package-installatie, root-Dockerfile-/Gateway-smokes, installer-/update-smokes en de snelle gebundelde-Plugin-Docker-E2E als afzonderlijke jobs, zodat installerwerk niet hoeft te wachten achter de root-image-smokes.

`main`-pushes (inclusief mergecommits) forceren het volledige pad niet; wanneer changed-scope-logica volledige dekking zou aanvragen op een push, behoudt de workflow de snelle Docker-smoke en laat hij de volledige install-smoke over aan nachtelijke of releasevalidatie.

De trage Bun-global-install-image-provider-smoke wordt afzonderlijk bewaakt door `run_bun_global_install_smoke`. Deze draait volgens het nachtelijke schema en vanuit de releasechecks-workflow, en handmatige `Install Smoke`-dispatches kunnen ervoor kiezen, maar pull requests en `main`-pushes niet. Normale PR-CI draait nog steeds de snelle Bun-launcher-regressielane voor Node-relevante wijzigingen. QR- en installer-Dockertests behouden hun eigen installatiegerichte Dockerfiles.

## Lokale Docker-E2E

`pnpm test:docker:all` prebuildt een gedeelde live-testimage, pakt OpenClaw een keer als npm-tarball in, en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images:

- een kale Node/Git-runner voor installer-/update-/Plugin-dependency-lanes;
- een functionele image die dezelfde tarball in `/app` installeert voor normale functionaliteitslanes.

Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en draait lanes daarna met `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Instelbare waarden

| Variabele                              | Standaard | Doel                                                                                          |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Aantal slots in de hoofdpool voor normale lanes.                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Aantal slots in de providergevoelige tailpool.                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limiet voor gelijktijdige live-lanes zodat providers niet throttlen.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5         | Limiet voor gelijktijdige npm-installatielanes.                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limiet voor gelijktijdige multi-service-lanes.                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Spreiding tussen lane-starts om Docker-daemon-create-stormen te voorkomen; stel `0` in voor geen spreiding. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Fallback-time-out per lane (120 minuten); geselecteerde live-/tail-lanes gebruiken strakkere limieten. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset     | `1` print het schedulerplan zonder lanes te draaien.                                         |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset     | Komma-gescheiden exacte lanelijst; slaat cleanup-smoke over zodat agents een gefaalde lane kunnen reproduceren. |

Een lane die zwaarder is dan zijn effectieve limiet kan nog steeds starten vanuit een lege pool, en draait daarna alleen totdat hij capaciteit vrijgeeft. De lokale aggregate preflight Docker, verwijdert verouderde OpenClaw-E2E-containers, geeft actieve-lane-status uit, bewaart lanetimings voor langste-eerst-ordening, en stopt standaard met het plannen van nieuwe pooled lanes na de eerste fout.

### Herbruikbare live/E2E-workflow

De herbruikbare live/E2E-workflow vraagt `scripts/test-docker-all.mjs --plan-json` welke package-, imagekind-, live-image-, lane- en credentialdekking vereist is. `scripts/docker-e2e.mjs` zet dat plan daarna om naar GitHub-outputs en samenvattingen. Hij pakt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een package-artifact uit de huidige run, of downloadt een package-artifact uit `package_artifact_run_id`; valideert de tarball-inventaris; bouwt en pusht package-digest-getagde kale/functionele GHCR-Docker-E2E-images via Blacksmiths Docker-layercache wanneer het plan package-geïnstalleerde lanes nodig heeft; en hergebruikt opgegeven `docker_e2e_bare_image`-/`docker_e2e_functional_image`-inputs of bestaande package-digest-images in plaats van opnieuw te bouwen. Docker-image-pulls worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry-/cachestream snel opnieuw probeert in plaats van het grootste deel van het kritieke CI-pad te verbruiken.

### Chunks voor het releasepad

Release-Dockerdekking draait kleinere gechunkte jobs met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elke chunk alleen het imagekind pullt dat hij nodig heeft en meerdere lanes uitvoert via dezelfde gewogen scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Huidige release-Dockerchunks zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, en `plugins-runtime-install-a` tot en met `plugins-runtime-install-h`. `package-update-openai` bevat de live Codex-Plugin-packagelane, die het kandidaat-OpenClaw-package installeert, de Codex-Plugin installeert vanuit `codex_plugin_spec` of een same-ref-tarball met expliciete Codex CLI-installatiegoedkeuring, Codex CLI-preflight draait, en daarna meerdere OpenClaw-agentbeurten in dezelfde sessie tegen OpenAI draait. `plugins-runtime-core`, `plugins-runtime` en `plugins-integrations` blijven aggregate Plugin-/runtime-aliassen. De `install-e2e`-lanealias blijft de aggregate handmatige rerun-alias voor beide provider-installerlanes.

OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige releasepaddekking dit aanvraagt, en behoudt alleen een zelfstandige `openwebui`-chunk voor OpenWebUI-only-dispatches. Gebundelde-kanaal-updatelanes proberen één keer opnieuw bij tijdelijke npm-netwerkfouten.

Elke chunk uploadt `.artifacts/docker-tests/` met lanelogs, timings, `summary.json`, `failures.json`, fasetimings, schedulerplan-JSON, slow-lane-tabellen en rerun-commands per lane. De workflow-input `docker_lanes` draait geselecteerde lanes tegen de voorbereide images in plaats van de chunkjobs, waardoor debugging van gefaalde lanes beperkt blijft tot één gerichte Dockerjob en het package-artifact voor die run wordt voorbereid, gedownload of hergebruikt; als een geselecteerde lane een live-Dockerlane is, bouwt de gerichte job de live-testimage lokaal voor die rerun. Gegenereerde GitHub-rerun-commands per lane bevatten `package_artifact_run_id`, `package_artifact_name` en voorbereide image-inputs wanneer die waarden bestaan, zodat een gefaalde lane exact het package en de images uit de gefaalde run kan hergebruiken.

```bash
pnpm test:docker:rerun <run-id>      # download Docker-artifacts en print gecombineerde/per-lane gerichte rerun-commands
pnpm test:docker:timings <summary>   # slow-lane- en fasekritiekepad-samenvattingen
```

De geplande live/E2E-workflow draait dagelijks de volledige releasepad-Dockersuite.

## Plugin Voorrelease

`Plugin Prerelease` is duurdere product-/packagedekking, dus het is een afzonderlijke workflow die wordt gedispatcht door `Full Release Validation` of door een expliciete operator. Normale pull requests, `main`-pushes en zelfstandige handmatige CI-dispatches houden die suite uitgeschakeld. Hij balanceert gebundelde-Plugin-tests over acht extensieworkers; die extensieshardjobs draaien maximaal twee Plugin-configgroepen tegelijk met één Vitest-worker per groep en een grotere Node-heap, zodat importzware Plugin-batches geen extra CI-jobs aanmaken. Het release-only Docker-voorreleasepad batcht gerichte Dockerlanes in kleine groepen om te voorkomen dat tientallen runners worden gereserveerd voor jobs van één tot drie minuten. De workflow uploadt ook een informatief `plugin-inspector-advisory`-artifact van `@openclaw/plugin-inspector`; inspectorbevindingen zijn triage-input en wijzigen de blokkerende Plugin Prerelease-gate niet.

## QA Lab

QA Lab heeft toegewezen CI-lanes buiten de belangrijkste smart-scoped workflow. Agentic parity is genest onder de brede QA- en releaseharnassen, niet als zelfstandige PR-workflow. Gebruik `Full Release Validation` met `rerun_group=qa-parity` wanneer parity moet meelopen met een brede validatierun.

- De `QA-Lab - All Lanes`-workflow draait nachtelijk op `main` en bij handmatige dispatch; hij waaiert de mock-parity-lane, live Matrix-lane, en live Telegram- en Discord-lanes uit als parallelle jobs. Live jobs gebruiken de `qa-live-shared`-omgeving, en Telegram/Discord gebruiken Convex-leases.

Releasechecks draaien Matrix- en Telegram-live-transportlanes met de deterministische mockprovider en mock-gekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het kanaalcontract geïsoleerd is van live-modellatentie en normale provider-Plugin-startup. De live-transport-Gateway schakelt memory search uit omdat QA-parity geheugengedrag afzonderlijk dekt; providerconnectiviteit wordt gedekt door de afzonderlijke live-model-, native-provider- en Docker-providersuites.

Matrix gebruikt `--profile fast` voor geplande en release-gates, en voegt `--fail-fast` alleen toe wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaard en handmatige workflowinput blijven `all`; handmatige `matrix_profile=all`-dispatch shardt volledige Matrix-dekking altijd in `transport`-, `media`-, `e2ee-smoke`-, `e2ee-deep`- en `e2ee-cli`-jobs.

`OpenClaw Release Checks` draait ook de releasekritieke QA Lab-lanes vóór releasegoedkeuring; de QA-parity-gate draait de kandidaat- en baselinepacks als parallelle lanejobs, en downloadt daarna beide artifacts naar een kleine reportjob voor de uiteindelijke parityvergelijking.

Voor normale PR's, volg gescopete CI-/check-evidence in plaats van parity als vereiste status te behandelen.

## CodeQL

De `CodeQL`-workflow is bewust een smalle first-pass-securityscanner, niet de volledige repositorysweep. Dagelijkse, handmatige en non-draft-pull-request-guardruns scannen Actions-workflowcode plus de JavaScript-/TypeScript-oppervlakken met het hoogste risico met high-confidence-securityqueries gefilterd op hoge/kritieke `security-severity`.

De pull-request-guard blijft licht: hij start alleen voor wijzigingen onder `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src`, of proces-eigenaarpaden van gebundelde-Plugin-runtime, en draait dezelfde high-confidence-securitymatrix als de geplande workflow. Android- en macOS-CodeQL blijven buiten PR-standaarden.

### Beveiligingscategorieën

| Categorie                                        | Oppervlak                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, geheimen, sandbox, Cron en Gateway-baseline                                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | Core channel-implementatiecontracten plus de channel Plugin-runtime, Gateway, Plugin SDK, geheimen, audit-aanraakpunten             |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP-parsing, netwerkbewaking, web-fetch en Plugin SDK SSRF-beleidsoppervlakken                                            |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-servers, procesuitvoerhelpers, uitgaande levering en agent-tooluitvoeringspoorten                                               |
| `/codeql-security-high/process-exec-boundary`     | Lokale shell, process spawn-helpers, subprocess-beherende gebundelde Plugin-runtimes en workflow-scriptlijm                         |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-installatie, loader, manifest, registry, package-manager-installatie, source-loading en vertrouwensoppervlakken van het Plugin SDK-pakketcontract |

### Platformspecifieke beveiligingsshards

- `CodeQL Android Critical Security` — geplande Android-beveiligingsshard. Bouwt de Android-app handmatig voor CodeQL op de kleinste Blacksmith Linux-runner die door workflow-sanity wordt geaccepteerd. Uploadt onder `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — wekelijkse/handmatige macOS-beveiligingsshard. Bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert dependency-buildresultaten uit de geüploade SARIF en uploadt onder `/codeql-critical-security/macos`. Buiten de dagelijkse standaardinstellingen gehouden omdat de macOS-build de runtime domineert, zelfs wanneer die schoon is.

### Critical Quality-categorieën

`CodeQL Critical Quality` is de bijbehorende niet-beveiligingsshard. Deze voert alleen JavaScript/TypeScript-kwaliteitsqueries met foutseverity en zonder beveiligingsfocus uit over smalle oppervlakken met hoge waarde op door GitHub gehoste Linux-runners, zodat kwaliteitsscans geen Blacksmith runner-registration-budget verbruiken. De pull request-guard is bewust kleiner dan het geplande profiel: niet-draft PR's voeren alleen de bijbehorende `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` en `plugin-sdk-reply-runtime` shards uit voor wijzigingen in agent command/model/tool-uitvoering en reply-dispatchcode, config schema/migration/IO-code, auth/geheimen/sandbox/beveiligingscode, core channel en gebundelde channel Plugin-runtime, Gateway protocol/server-method, memory runtime/SDK-lijm, MCP/process/uitgaande levering, provider runtime/modelcatalogus, sessiediagnostiek/leveringswachtrijen, Plugin-loader, Plugin SDK/package-contract of Plugin SDK reply-runtime. CodeQL-configuratie- en kwaliteitsworkflowwijzigingen voeren alle twaalf PR-kwaliteitsshards uit.

Handmatige dispatch accepteert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

De smalle profielen zijn teaching/iteration-hooks om één kwaliteitsshard geïsoleerd uit te voeren.

| Categorie                                              | Oppervlak                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, geheimen, sandbox, Cron en Gateway-beveiligingsgrenscode                                                                                                    |
| `/codeql-critical-quality/config-boundary`              | Config-schema, migratie, normalisatie en IO-contracten                                                                                                            |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-protocolschema's en servermethod-contracten                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Core channel- en gebundelde channel Plugin-implementatiecontracten                                                                                                |
| `/codeql-critical-quality/agent-runtime-boundary`       | Command-uitvoering, model/provider-dispatch, auto-reply-dispatch en wachtrijen, en ACP control-plane-runtimecontracten                                           |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-servers en tool-bridges, procesbewakingshelpers en contracten voor uitgaande levering                                                                         |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime-facades, memory Plugin SDK-aliassen, memory runtime-activeringslijm en memory doctor-commands                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply queue-internals, sessieleveringswachtrijen, uitgaande session binding/delivery-helpers, oppervlakken voor diagnostic event/log-bundels en session doctor CLI-contracten |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply-dispatch, reply payload/chunking/runtime-helpers, channel reply-opties, leveringswachtrijen en session/thread binding-helpers            |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisatie van modelcatalogus, provider-auth en discovery, provider runtime-registratie, provider-defaults/catalogi en web/search/fetch/embedding-registries    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI-bootstrap, lokale persistentie, Gateway-control flows en task control-plane-runtimecontracten                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search, media-IO, media understanding, image-generation en media-generation-runtimecontracten                                                      |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, registry-, public-surface- en Plugin SDK-entrypointcontracten                                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Gepubliceerde package-side Plugin SDK-bron en helpers voor Plugin-pakketcontracten                                                                                |

Kwaliteit blijft gescheiden van beveiliging, zodat kwaliteitsbevindingen kunnen worden gepland, gemeten, uitgeschakeld of uitgebreid zonder het beveiligingssignaal te verhullen. Swift-, Python- en gebundelde-Plugin-CodeQL-uitbreiding moet alleen als gescopeerd of geshard vervolgwerk worden teruggezet nadat de smalle profielen een stabiele runtime en stabiel signaal hebben.

## Onderhoudsworkflows

### Docs Agent

De `Docs Agent`-workflow is een event-driven Codex-onderhoudslane om bestaande docs afgestemd te houden op recent gelande wijzigingen. Deze heeft geen puur schema: een succesvolle niet-bot push-CI-run op `main` kan deze triggeren, en handmatige dispatch kan deze direct uitvoeren. Workflow-run-invocaties slaan over wanneer `main` is doorgeschoven of wanneer er in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is aangemaakt. Wanneer deze draait, beoordeelt deze het commitbereik van de vorige niet-overgeslagen Docs Agent-bron-SHA tot de huidige `main`, zodat één uurlijkse run alle main-wijzigingen kan dekken die sinds de laatste docs-pass zijn verzameld.

### Test Performance Agent

De `Test Performance Agent`-workflow is een event-driven Codex-onderhoudslane voor trage tests. Deze heeft geen puur schema: een succesvolle niet-bot push-CI-run op `main` kan deze triggeren, maar deze slaat over als er die UTC-dag al een andere workflow-run-invocatie is uitgevoerd of actief is. Handmatige dispatch omzeilt die dagelijkse activiteitspoort. De lane bouwt een gegroepeerd Vitest-performancerapport voor de volledige suite, laat Codex alleen kleine testperformancefixes maken die coverage behouden in plaats van brede refactors, voert daarna het volledige-suite-rapport opnieuw uit en weigert wijzigingen die het aantal geslaagde baseline-tests verminderen. Het gegroepeerde rapport registreert per config wall time en max RSS op Linux en macOS, zodat de before/after-vergelijking testgeheugendelta's naast duurdelta's zichtbaar maakt. Als de baseline falende tests heeft, mag Codex alleen duidelijke fouten oplossen en moet het after-agent volledige-suite-rapport slagen voordat er iets wordt gecommit. Wanneer `main` doorgaat voordat de bot-push landt, rebaset de lane de gevalideerde patch, voert `pnpm check:changed` opnieuw uit en probeert de push opnieuw; conflicterende verouderde patches worden overgeslagen. Deze gebruikt door GitHub gehoste Ubuntu zodat de Codex-actie dezelfde drop-sudo-veiligheidshouding kan behouden als de docs-agent.

### Duplicate PRs After Merge

De `Duplicate PRs After Merge`-workflow is een handmatige maintainer-workflow voor duplicate-opruiming na landing. Deze staat standaard op dry-run en sluit alleen expliciet opgegeven PR's wanneer `apply=true`. Voordat GitHub wordt gemuteerd, verifieert deze dat de gelande PR is gemerged en dat elke duplicate óf een gedeeld gerefereerd issue óf overlappende gewijzigde hunks heeft.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale checkpoorten en changed routing

Lokale changed-lane-logica staat in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale checkpoort is strenger over architectuurgrenzen dan de brede CI-platformscope:

- core-productiewijzigingen voeren core prod- en core test-typecheck plus core lint/guards uit;
- core test-only-wijzigingen voeren alleen core test-typecheck plus core lint uit;
- extension-productiewijzigingen voeren extension prod- en extension test-typecheck plus extension lint uit;
- extension test-only-wijzigingen voeren extension test-typecheck plus extension lint uit;
- publieke Plugin SDK- of plugin-contractwijzigingen breiden uit naar extension typecheck omdat extensions afhankelijk zijn van die core-contracten (Vitest extension-sweeps blijven expliciet testwerk);
- release metadata-only-versiebumpen voeren gerichte versie/config/root-dependency-checks uit;
- onbekende root/config-wijzigingen fail-safe naar alle check-lanes.

Lokale changed-test-routing staat in `scripts/test-projects.test-support.mjs` en is bewust goedkoper dan `check:changed`: directe testbewerkingen voeren zichzelf uit, source-bewerkingen geven de voorkeur aan expliciete mappings, daarna sibling-tests en import-graph dependents. Gedeelde group-room-deliveryconfiguratie is een van de expliciete mappings: wijzigingen in de group visible-reply-config, source reply delivery mode of de message-tool system prompt lopen via de core reply-tests plus Discord- en Slack-deliveryregressies, zodat een gedeelde default-wijziging faalt vóór de eerste PR-push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging harness-breed genoeg is dat de goedkope gemapte set geen betrouwbare proxy is.

## Testbox-validatie

Crabbox is de door de repo beheerde remote-box-wrapper voor Linux-bewijs door maintainers. Gebruik het
vanuit de repo-root wanneer een check te breed is voor een lokale bewerkingslus, wanneer CI-pariteit
belangrijk is, of wanneer het bewijs secrets, Docker, package-lanes,
herbruikbare boxes of remote logs nodig heeft. De normale OpenClaw-backend is
`blacksmith-testbox`; beheerde AWS/Hetzner-capaciteit is een fallback voor Blacksmith-
storingen, quotaproblemen of expliciete tests op beheerde capaciteit.

Door Crabbox ondersteunde Blacksmith-runs warmen eenmalige Testboxes op, claimen, synchroniseren, voeren uit, rapporteren en ruimen ze op.
De ingebouwde sync-sanitycheck faalt snel wanneer vereiste
rootbestanden zoals `pnpm-lock.yaml` verdwijnen of wanneer `git status --short`
minstens 200 gevolgde verwijderingen toont. Stel voor opzettelijke PR's met grote verwijderingen
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor de remote opdracht.

Crabbox beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan
vijf minuten in de synchronisatiefase blijft zonder post-sync-uitvoer. Stel
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` in om die bewaking uit te schakelen, of gebruik een grotere
millisecondewaarde voor ongebruikelijk grote lokale diffs.

Controleer vóór een eerste run de wrapper vanuit de repo-root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

De repo-wrapper weigert een verouderde Crabbox-binary die geen `blacksmith-testbox` adverteert. Geef de provider expliciet door, ook al heeft `.crabbox.yaml` standaardwaarden voor owned-cloud. Vermijd in Codex-worktrees of gekoppelde/sparse checkouts het lokale `pnpm crabbox:run`-script, omdat pnpm dependencies kan reconciliëren voordat Crabbox start; roep in plaats daarvan de node-wrapper rechtstreeks aan:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Door Blacksmith ondersteunde runs vereisen Crabbox 0.22.0 of nieuwer, zodat de wrapper het huidige Testbox-sync-, queue- en cleanup-gedrag krijgt. Bouw bij gebruik van de sibling-checkout de genegeerde lokale binary opnieuw voordat je timing- of bewijswerk doet:

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
opdrachtresultaat. De gekoppelde GitHub Actions-run is eigenaar van hydratie en keepalive; die
kan eindigen als `cancelled` wanneer de Testbox extern wordt gestopt nadat de SSH-
opdracht al is teruggekeerd. Behandel dat als een cleanup-/statusartefact, tenzij
de wrapper-`exitCode` niet nul is of de opdrachtuitvoer een gefaalde test toont.
Eenmalige door Blacksmith ondersteunde Crabbox-runs moeten de Testbox automatisch stoppen;
als een run wordt onderbroken of cleanup onduidelijk is, inspecteer live boxes en stop alleen
de boxes die jij hebt gemaakt:

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
Blacksmith dan alleen voor diagnostiek zoals `list`, `status` en cleanup. Repareer het
Crabbox-pad voordat je een directe Blacksmith-run als maintainer-bewijs behandelt.

Als `blacksmith testbox list --all` en `blacksmith testbox status` werken, maar nieuwe
warmups na een paar minuten `queued` blijven zonder IP of Actions-run-URL,
behandel dit dan als druk door de Blacksmith-provider, queue, billing of org-limieten. Stop de
queued ids die jij hebt gemaakt, start geen extra Testboxes en verplaats het bewijs naar het
beheerde Crabbox-capaciteitspad hieronder terwijl iemand het Blacksmith-dashboard,
billing en org-limieten controleert.

Escaleren naar beheerde Crabbox-capaciteit alleen wanneer Blacksmith down is, quota-limited is, de benodigde omgeving mist, of beheerde capaciteit expliciet het doel is:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Vermijd onder AWS-druk `class=beast`, tenzij de taak echt CPU van 48xlarge-klasse nodig heeft. Een `beast`-aanvraag begint bij 192 vCPU's en is de makkelijkste manier om regionale EC2 Spot- of On-Demand Standard-quota te raken. De door de repo beheerde `.crabbox.yaml` gebruikt standaard `standard`, meerdere capaciteitsregio's en `capacity.hints: true`, zodat gebrokerde AWS-leases geselecteerde regio/markt, quotadruk, Spot-fallback en waarschuwingen voor klassen met hoge druk afdrukken. Gebruik `fast` voor zwaardere brede checks, `large` alleen nadat standard/fast niet genoeg zijn, en `beast` alleen voor uitzonderlijke CPU-gebonden lanes zoals full-suite- of all-plugin-Docker-matrices, expliciete release-/blockervalidatie of performanceprofilering met veel cores. Gebruik `beast` niet voor `pnpm check:changed`, gerichte tests, docs-only werk, gewone lint/typecheck, kleine E2E-repro's of triage van Blacksmith-storingen. Gebruik `--market on-demand` voor capaciteitsdiagnose, zodat Spot-marktverloop niet door het signaal wordt gemengd.

`.crabbox.yaml` is eigenaar van provider-, sync- en GitHub Actions-hydratiestandaarden voor owned-cloud-lanes. Het sluit lokale `.git` uit, zodat de gehydrateerde Actions-checkout zijn eigen remote Git-metadata behoudt in plaats van maintainer-lokale remotes en object stores te synchroniseren, en het sluit lokale runtime-/buildartefacten uit die nooit mogen worden overgedragen. `.github/workflows/crabbox-hydrate.yml` is eigenaar van checkout, Node/pnpm-setup, `origin/main` fetch en de niet-geheime omgevingsoverdracht voor owned-cloud-`crabbox run --id <cbx_id>`-opdrachten.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Ontwikkelkanalen](/nl/install/development-channels)
