---
read_when:
    - Je moet begrijpen waarom een CI-taak wel of niet is uitgevoerd
    - Je debugt een mislukte GitHub Actions-controle
    - Je coördineert een releasevalidatierun of herhaling
    - Je wijzigt ClawSweeper-dispatch of het doorsturen van GitHub-activiteit
summary: CI-taakengrafiek, scope-gates, release-overkoepelingen en lokale commando-equivalenten
title: CI-pipeline
x-i18n:
    generated_at: "2026-05-02T23:39:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321fe0a061044f75b8e1d03b4d3e76d4f8dd2dae0ebc58831887fc20af953cf1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI draait bij elke push naar `main` en elke pull request. De `preflight`-taak classificeert de diff en schakelt dure lanes uit wanneer alleen niet-gerelateerde gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen bewust slimme scoping en waaieren de volledige grafiek uit voor releasekandidaten en brede validatie. Android-lanes blijven opt-in via `include_android`. Release-only Plugin-dekking staat in de afzonderlijke [`Plugin Prerelease`](#plugin-prerelease)-workflow en draait alleen vanuit [`Full Release Validation`](#full-release-validation) of een expliciete handmatige dispatch.

## Pipeline-overzicht

| Taak                              | Doel                                                                                                             | Wanneer deze draait                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detecteert docs-only wijzigingen, gewijzigde scopes, gewijzigde extensies en bouwt het CI-manifest                             | Altijd bij niet-concept-pushes en PR's |
| `security-scm-fast`              | Detectie van privésleutels en workflow-audit via `zizmor`                                                               | Altijd bij niet-concept-pushes en PR's |
| `security-dependency-audit`      | Productie-lockfile-audit zonder afhankelijkheden tegen npm-advisories                                                    | Altijd bij niet-concept-pushes en PR's |
| `security-fast`                  | Vereiste aggregatie voor de snelle beveiligingstaken                                                                       | Altijd bij niet-concept-pushes en PR's |
| `check-dependencies`             | Productie-Knip-pass alleen voor afhankelijkheden plus de allowlist-bewaker voor ongebruikte bestanden                                           | Node-relevante wijzigingen              |
| `build-artifacts`                | Bouwt `dist/`, Control UI, controles voor gebouwde artefacten en herbruikbare downstream-artefacten                                 | Node-relevante wijzigingen              |
| `checks-fast-core`               | Snelle Linux-correctheidslanes zoals controles voor gebundelde Plugins/Plugin-contracten/protocollen                                        | Node-relevante wijzigingen              |
| `checks-fast-contracts-channels` | Gesherde kanaalcontractcontroles met een stabiel geaggregeerd controleresultaat                                                | Node-relevante wijzigingen              |
| `checks-node-core-test`          | Core Node-testshards, exclusief kanaal-, gebundelde, contract- en extensielanes                                    | Node-relevante wijzigingen              |
| `check`                          | Gesherde equivalent van de belangrijkste lokale gate: productietypen, lint, bewakers, testtypen en strikte smoke                          | Node-relevante wijzigingen              |
| `check-additional`               | Architectuur, grenzen, prompt-snapshotdrift, extensie-oppervlakbewakers, pakketgrenzen en gateway-watch-shards | Node-relevante wijzigingen              |
| `build-smoke`                    | Smoke-tests voor de gebouwde CLI en smoke voor opstartgeheugen                                                                      | Node-relevante wijzigingen              |
| `checks`                         | Verificatie voor kanaaltests van gebouwde artefacten                                                                           | Node-relevante wijzigingen              |
| `checks-node-compat-node22`      | Node 22-compatibiliteitsbuild en smoke-lane                                                                          | Handmatige CI-dispatch voor releases    |
| `check-docs`                     | Docs-formattering, lint en controles op kapotte links                                                                       | Docs gewijzigd                       |
| `skills-python`                  | Ruff + pytest voor Python-ondersteunde Skills                                                                              | Python-Skill-relevante wijzigingen      |
| `checks-windows`                 | Windows-specifieke proces-/padtests plus regressies in gedeelde runtime-importspecifiers                                | Windows-relevante wijzigingen           |
| `macos-node`                     | macOS TypeScript-testlane met de gedeelde gebouwde artefacten                                                         | macOS-relevante wijzigingen             |
| `macos-swift`                    | Swift-lint, build en tests voor de macOS-app                                                                      | macOS-relevante wijzigingen             |
| `android`                        | Android-unittests voor beide flavors plus één debug-APK-build                                                        | Android-relevante wijzigingen           |
| `test-performance-agent`         | Dagelijkse Codex-optimalisatie voor trage tests na vertrouwde activiteit                                                           | Succesvolle main-CI of handmatige dispatch |
| `openclaw-performance`           | Dagelijkse/op aanvraag Kova-runtimeprestatierapporten met mockprovider-, deep-profile- en GPT 5.4-live-lanes           | Geplande en handmatige dispatch      |

## Fail-fast-volgorde

1. `preflight` beslist welke lanes überhaupt bestaan. De `docs-scope`- en `changed-scope`-logica zijn stappen binnen deze taak, geen zelfstandige taken.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` en `skills-python` falen snel zonder te wachten op de zwaardere artefact- en platformmatrixtaken.
3. `build-artifacts` overlapt met de snelle Linux-lanes zodat downstream-consumenten kunnen starten zodra de gedeelde build klaar is.
4. Zwaardere platform- en runtimelanes waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` en `android`.

GitHub kan vervangen taken als `cancelled` markeren wanneer een nieuwere push op dezelfde PR- of `main`-ref landt. Behandel dat als CI-ruis tenzij de nieuwste run voor dezelfde ref ook faalt. Geaggregeerde shardcontroles gebruiken `!cancelled() && always()` zodat ze normale shardfouten nog steeds rapporteren, maar niet meer in de wachtrij komen nadat de hele workflow al is vervangen. De automatische CI-concurrency key is geversioneerd (`CI-v7-*`), zodat een zombie aan GitHub-zijde in een oude wachtrijgroep nieuwere main-runs niet onbeperkt kan blokkeren. Handmatige full-suite-runs gebruiken `CI-manual-v1-*` en annuleren lopende runs niet.

## Scope en routering

Scopelogica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unittests in `src/scripts/ci-changed-scope.test.ts`. Handmatige dispatch slaat changed-scope-detectie over en laat het preflight-manifest doen alsof elk gescoped gebied is gewijzigd.

- **CI-workflowbewerkingen** valideren de Node-CI-grafiek plus workflow-linting, maar forceren op zichzelf geen native Windows-, Android- of macOS-builds; die platformlanes blijven gescoped op wijzigingen in platformbroncode.
- **CI-bewerkingen die alleen routering raken, geselecteerde goedkope fixturebewerkingen voor core-tests en smalle Plugin-contracthelper-/testrouteringsbewerkingen** gebruiken een snel Node-only manifestpad: `preflight`, beveiliging en één `checks-fast-core`-taak. Dat pad slaat buildartefacten, Node 22-compatibiliteit, kanaalcontracten, volledige core-shards, gebundelde-Plugin-shards en aanvullende bewakermatrices over wanneer de wijziging beperkt is tot de routerings- of helperoppervlakken die de snelle taak direct oefent.
- **Windows Node-controles** zijn gescoped op Windows-specifieke proces-/padwrappers, npm/pnpm/UI-runnerhelpers, pakketmanagerconfiguratie en de CI-workflowoppervlakken die die lane uitvoeren; niet-gerelateerde broncode-, Plugin-, install-smoke- en test-only wijzigingen blijven op de Linux Node-lanes.

De traagste Node-testfamilies zijn gesplitst of gebalanceerd zodat elke taak klein blijft zonder runners te ruim te reserveren: kanaalcontracten draaien als drie gewogen shards, kleine core-unitlanes worden gekoppeld, auto-reply draait als vier gebalanceerde workers (waarbij de reply-subtree is gesplitst in agent-runner-, dispatch- en commands/state-routing-shards), en agentic Gateway-/Plugin-configuraties zijn verdeeld over de bestaande source-only agentic Node-taken in plaats van te wachten op gebouwde artefacten. Brede browser-, QA-, media- en overige Plugin-tests gebruiken hun eigen Vitest-configuraties in plaats van de gedeelde Plugin-catch-all. Include-pattern-shards registreren timingitems met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een hele configuratie kan onderscheiden van een gefilterde shard. `check-additional` houdt compile-/canary-werk voor pakketgrenzen bij elkaar en scheidt runtime-topologiearchitectuur van gateway-watch-dekking; de boundary guard-shard draait zijn kleine onafhankelijke bewakers gelijktijdig binnen één taak, inclusief `pnpm prompt:snapshots:check`, zodat promptdrift in het happy-path van de Codex-runtime wordt vastgepind aan de PR die deze veroorzaakte. Gateway watch, kanaaltests en de core support-boundary-shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd.

Android-CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play debug-APK. De third-party flavor heeft geen aparte sourceset of manifest; de unit-testlane compileert de flavor nog steeds met de BuildConfig-vlaggen voor SMS/belgeschiedenis, terwijl een dubbele debug-APK-packagingtaak bij elke Android-relevante push wordt vermeden.

De `check-dependencies`-shard draait `pnpm deadcode:dependencies` (een productie-Knip-pass alleen voor afhankelijkheden, vastgezet op de nieuwste Knip-versie, met pnpm's minimale releaseleeftijd uitgeschakeld voor de `dlx`-installatie) en `pnpm deadcode:unused-files`, dat Knip's productiebevindingen voor ongebruikte bestanden vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. De unused-file-bewaker faalt wanneer een PR een nieuw niet-beoordeeld ongebruikt bestand toevoegt of een verouderde allowlist-entry laat staan, terwijl opzettelijke dynamische Plugin-, gegenereerde, build-, live-test- en pakketbrugoppervlakken behouden blijven die Knip niet statisch kan oplossen.

## Doorsturen van ClawSweeper-activiteit

`.github/workflows/clawsweeper-dispatch.yml` is de bridge aan doelzijde van OpenClaw-repositoryactiviteit naar ClawSweeper. Deze checkt geen onvertrouwde pullrequestcode uit en voert die ook niet uit. De workflow maakt een GitHub App-token aan vanuit `CLAWSWEEPER_APP_PRIVATE_KEY` en dispatcht daarna compacte `repository_dispatch`-payloads naar `openclaw/clawsweeper`.

De workflow heeft vier lanes:

- `clawsweeper_item` voor exacte reviewverzoeken voor issues en pull requests;
- `clawsweeper_comment` voor expliciete ClawSweeper-commando's in issuecomments;
- `clawsweeper_commit_review` voor reviewverzoeken op commitniveau bij `main`-pushes;
- `github_activity` voor algemene GitHub-activiteit die de ClawSweeper-agent kan inspecteren.

De `github_activity`-lane stuurt alleen genormaliseerde metadata door: eventtype, actie, actor, repository, itemnummer, URL, titel, status en korte fragmenten voor comments of reviews wanneer aanwezig. Deze vermijdt bewust het doorsturen van de volledige Webhook-body. De ontvangende workflow in `openclaw/clawsweeper` is `.github/workflows/github-activity.yml`, die de genormaliseerde gebeurtenis naar de OpenClaw Gateway-hook voor de ClawSweeper-agent post.

Algemene activiteit is observatie, geen standaardbezorging. De ClawSweeper-agent ontvangt het Discord-doel in zijn prompt en hoort alleen naar `#clawsweeper` te posten wanneer de gebeurtenis verrassend, actiegericht, riskant of operationeel nuttig is. Routinematig openen, bewerken, botverloop, dubbele Webhook-ruis en normaal reviewverkeer moeten resulteren in `NO_REPLY`.

Behandel GitHub-titels, comments, bodies, reviewtekst, branchnamen en commitberichten overal in dit pad als onvertrouwde data. Ze zijn input voor samenvatting en triage, geen instructies voor de workflow- of agentruntime.

## Handmatige dispatches

Handmatige CI-dispatches voeren dezelfde jobgrafiek uit als normale CI, maar schakelen elke niet-Android scope-lane geforceerd in: Linux Node-shards, gebundelde-plugin-shards, kanaalcontracten, Node 22-compatibiliteit, `check`, `check-additional`, build-smoke, docs-controles, Python Skills, Windows, macOS en Control UI i18n. Losstaande handmatige CI-dispatches voeren alleen Android uit met `include_android=true`; de volledige release-umbrella schakelt Android in door `include_android=true` door te geven. Statische controles voor plugin-prereleases, de alleen-voor-release `agentic-plugins`-shard, de volledige batch-sweep van extensions en Docker-lanes voor plugin-prereleases zijn uitgesloten van CI. De Docker-prerelease-suite draait alleen wanneer `Full Release Validation` de aparte `Plugin Prerelease`-workflow dispatcht met de releasevalidatie-gate ingeschakeld.

Handmatige runs gebruiken een unieke concurrency-groep zodat een volledige suite voor een releasekandidaat niet wordt geannuleerd door een andere push- of PR-run op dezelfde ref. Met de optionele `target_ref`-invoer kan een vertrouwde aanroeper die grafiek uitvoeren tegen een branch, tag of volledige commit-SHA, terwijl het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, snelle beveiligingsjobs en aggregaties (`security-scm-fast`, `security-dependency-audit`, `security-fast`), snelle protocol-/contract-/gebundelde controles, gesharde kanaalcontractcontroles, `check`-shards behalve lint, `check-additional`-shards en aggregaties, Node-testaggregatieverificateurs, docs-controles, Python Skills, workflow-sanity, labeler, auto-response; install-smoke-preflight gebruikt ook door GitHub gehoste Ubuntu zodat de Blacksmith-matrix eerder kan wachtrijen |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lichtere extension-shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` en `check-test-types`                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node-testshards, gebundelde-plugin-testshards, `android`                                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-gevoelig genoeg dat 8 vCPU meer kostte dan het opleverde); install-smoke Docker-builds (32-vCPU-wachtrijtijd kostte meer dan het opleverde)                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                                   |

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

`OpenClaw Performance` is de product-/runtime-prestatieworkflow. Deze draait dagelijks op `main` en kan handmatig worden gedispatcht:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

De workflow installeert OCM vanuit een gepinde release en Kova vanuit de gepinde `kova_ref`-invoer, en voert daarna drie lanes uit:

- `mock-provider`: Kova-diagnostische scenario's tegen een lokaal gebouwde runtime met deterministische neppe OpenAI-compatibele auth.
- `mock-deep-profile`: CPU-/heap-/traceprofilering voor hotspots bij opstarten, Gateway en agent-turns.
- `live-gpt54`: een echte OpenAI `openai/gpt-5.4`-agent-turn, overgeslagen wanneer `OPENAI_API_KEY` niet beschikbaar is.

De mock-provider-lane voert na de Kova-pass ook OpenClaw-native bronprobes uit: Gateway-opstarttijd en geheugen in standaard-, hook- en 50-plugin-opstartgevallen; herhaalde mock-OpenAI `channel-chat-baseline`-hello-lussen; en CLI-opstartcommando's tegen de opgestarte Gateway. De Markdown-samenvatting van de bronprobe staat op `source/index.md` in de rapportbundel, met ruwe JSON ernaast.

Elke lane uploadt GitHub-artefacten. Wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd, commit de workflow ook `report.json`, `report.md`, bundels, `index.md` en bronprobe-artefacten naar `openclaw/clawgrit-reports` onder `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. De huidige branchpointer wordt geschreven als `openclaw-performance/<ref>/latest-<lane>.json`.

## Volledige releasevalidatie

`Full Release Validation` is de handmatige umbrella-workflow voor "alles uitvoeren vóór release." Deze accepteert een branch, tag of volledige commit-SHA, dispatcht de handmatige `CI`-workflow met dat doel, dispatcht `Plugin Prerelease` voor alleen-voor-release plugin-/pakket-/statische-/Docker-bewijsvoering, en dispatcht `OpenClaw Release Checks` voor install-smoke, pakketacceptatie, Docker-releasepad-suites, live/E2E, OpenWebUI, QA Lab-pariteit, Matrix en Telegram-lanes. Met `rerun_group=all` en `release_profile=full` draait deze ook `NPM Telegram Beta E2E` tegen het `release-package-under-test`-artefact uit releasecontroles. Geef na publicatie `npm_telegram_package_spec` door om dezelfde Telegram-pakketlane opnieuw te draaien tegen het gepubliceerde npm-pakket.

Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
fasematrix, exacte workflowjobnamen, profielverschillen, artefacten en
gerichte rerun-handles.

`OpenClaw Release Publish` is de handmatige muterende releaseworkflow. Dispatch deze
vanuit `release/YYYY.M.D` of `main` nadat de releasetag bestaat en nadat de
OpenClaw npm-preflight is geslaagd. Deze verifieert `pnpm plugins:sync:check`,
dispatcht `Plugin NPM Release` voor alle publiceerbare plugin-pakketten, dispatcht
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
helper pusht een tijdelijke `release-ci/<sha>-...`-branch op de doel-SHA,
dispatcht `Full Release Validation` vanaf die gepinde ref, verifieert dat elke child-workflow
`headSha` overeenkomt met het doel, en verwijdert de tijdelijke branch wanneer de
run is voltooid. De umbrella-verificateur faalt ook als een child-workflow op een
andere SHA draaide.

`release_profile` bepaalt de live-/providerbreedte die wordt doorgegeven aan releasecontroles. De
handmatige releaseworkflows staan standaard op `stable`; gebruik `full` alleen wanneer je
bewust de brede adviserende provider-/mediamatrix wilt.

- `minimum` behoudt de snelste OpenAI-/core-releasekritieke lanes.
- `stable` voegt de stabiele provider-/backendset toe.
- `full` draait de brede adviserende provider-/mediamatrix.

De umbrella registreert de gedispatchte child-run-id's, en de laatste `Verify full validation`-job controleert opnieuw de huidige conclusies van child-runs en voegt tabellen met langzaamste jobs toe voor elke child-run. Als een child-workflow opnieuw wordt gedraaid en groen wordt, draai dan alleen de parent-verificateurjob opnieuw om het umbrella-resultaat en de timingsamenvatting te vernieuwen.

Voor herstel accepteren zowel `Full Release Validation` als `OpenClaw Release Checks` `rerun_group`. Gebruik `all` voor een releasekandidaat, `ci` voor alleen het normale volledige CI-child, `plugin-prerelease` voor alleen het Plugin-prerelease-child, `release-checks` voor elk release-child, of een smallere groep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, of `npm-telegram` op de umbrella. Zo blijft het opnieuw uitvoeren van een mislukte release-box na een gerichte fix afgebakend.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde ref eenmaal op te lossen naar een `release-package-under-test`-tarball, en geeft dat artefact vervolgens door aan zowel de live/E2E Docker-workflow voor het release-pad als de package-acceptance-shard. Zo blijven de package-bytes consistent tussen release-boxes en wordt voorkomen dat dezelfde kandidaat opnieuw wordt verpakt in meerdere child-jobs.

Dubbele `Full Release Validation`-runs voor `ref=main` en `rerun_group=all`
vervangen de oudere umbrella. De parent-monitor annuleert elke child-workflow die
al is gestart wanneer de parent wordt geannuleerd, zodat nieuwere main-validatie
niet achter een verouderde twee uur durende release-check-run blijft staan. Release-branch/tag-
validatie en gerichte rerun-groepen behouden `cancel-in-progress: false`.

## Live- en E2E-shards

Het release live/E2E-child behoudt brede native `pnpm test:live`-dekking, maar voert die uit als benoemde shards via `scripts/test-live-shard.mjs` in plaats van als één seriële job:

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
- gesplitste media-audio/video-shards en provider-gefilterde muziek-shards

Zo blijft dezelfde bestandsdekking behouden, terwijl trage live-providerfouten makkelijker opnieuw kunnen worden uitgevoerd en gediagnosticeerd. De geaggregeerde shardnamen `native-live-extensions-o-z`, `native-live-extensions-media` en `native-live-extensions-media-music` blijven geldig voor handmatige eenmalige reruns.

De native live-media-shards draaien in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de workflow `Live Media Runner Image`. Die image installeert `ffmpeg` en `ffprobe` vooraf; media-jobs verifiëren alleen de binaries vóór de setup. Houd door Docker ondersteunde live-suites op normale Blacksmith-runners — containerjobs zijn niet de juiste plek om geneste Docker-tests te starten.

Door Docker ondersteunde live model/backend-shards gebruiken een aparte gedeelde `ghcr.io/openclaw/openclaw-live-test:<sha>`-image per geselecteerde commit. De live-releaseworkflow bouwt en pusht die image eenmaal; daarna draaien de Docker live model-, provider-sharded Gateway-, CLI-backend-, ACP-bind- en Codex-harness-shards met `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker-shards hebben expliciete timeout-limieten op scriptniveau onder de workflowjob-timeout, zodat een vastgelopen container of cleanup-pad snel faalt in plaats van het volledige release-checkbudget te verbruiken. Als die shards de volledige source-Docker-target onafhankelijk opnieuw bouwen, is de release-run verkeerd geconfigureerd en verspilt die wandkloktijd aan dubbele image-builds.

## Package Acceptance

Gebruik `Package Acceptance` wanneer de vraag is: “werkt dit installeerbare OpenClaw-package als product?” Het verschilt van normale CI: normale CI valideert de source tree, terwijl package acceptance één tarball valideert via dezelfde Docker E2E-harness die gebruikers na installatie of update gebruiken.

### Jobs

1. `resolve_package` checkt `workflow_ref` uit, lost één package-kandidaat op, schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het artefact `package-under-test`, en print de bron, workflow-ref, package-ref, versie, SHA-256 en profiel in de GitHub-stapsamenvatting.
2. `docker_acceptance` roept `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt dat artefact, valideert de tarball-inventaris, bereidt package-digest Docker-images voor wanneer nodig, en voert de geselecteerde Docker-lanes uit tegen dat package in plaats van de workflow-checkout te verpakken. Wanneer een profiel meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het package en de gedeelde images eenmaal voor, en verspreidt die lanes vervolgens als parallelle gerichte Docker-jobs met unieke artefacten.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Dit draait wanneer `telegram_mode` niet `none` is en installeert hetzelfde `package-under-test`-artefact wanneer Package Acceptance er een heeft opgelost; zelfstandige Telegram-dispatch kan nog steeds een gepubliceerde npm-specificatie installeren.
4. `summary` laat de workflow falen als package-resolutie, Docker-acceptance of de optionele Telegram-lane is mislukt.

### Kandidaatbronnen

- `source=npm` accepteert alleen `openclaw@beta`, `openclaw@latest`, of een exacte OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor gepubliceerde prerelease/stable-acceptance.
- `source=ref` verpakt een vertrouwde `package_ref`-branch, tag of volledige commit-SHA. De resolver fetcht OpenClaw-branches/tags, verifieert dat de geselecteerde commit bereikbaar is vanuit de branch-geschiedenis van de repository of een releasetag, installeert dependencies in een losgekoppelde worktree, en verpakt die met `scripts/package-openclaw-for-docker.mjs`.
- `source=url` downloadt een HTTPS `.tgz`; `package_sha256` is verplicht.
- `source=artifact` downloadt één `.tgz` uit `artifact_run_id` en `artifact_name`; `package_sha256` is optioneel maar hoort te worden meegeleverd voor extern gedeelde artefacten.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde workflow/harness-code die de test uitvoert. `package_ref` is de source-commit die wordt verpakt wanneer `source=ref`. Hierdoor kan de huidige test-harness oudere vertrouwde source-commits valideren zonder oude workflowlogica uit te voeren.

### Suiteprofielen

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — volledige Docker-releasepad-chunks met OpenWebUI
- `custom` — exacte `docker_lanes`; verplicht wanneer `suite_profile=custom`

Het `package`-profiel gebruikt offline Plugin-dekking, zodat validatie van gepubliceerde packages niet afhankelijk is van live ClawHub-beschikbaarheid. De optionele Telegram-lane hergebruikt het `package-under-test`-artefact in `NPM Telegram Beta E2E`, terwijl het gepubliceerde npm-specificatiepad behouden blijft voor zelfstandige dispatches.

Voor het specifieke beleid voor update- en Plugin-tests, inclusief lokale opdrachten,
Docker-lanes, Package Acceptance-inputs, release-standaarden en fouttriage,
zie [Updates en plugins testen](/nl/help/testing-updates-plugins).

Release-checks roepen Package Acceptance aan met `source=artifact`, het voorbereide releasepackage-artefact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` en `telegram_mode=mock-openai`. Zo blijven package-migratie, update, cleanup van verouderde Plugin-dependencies, reparatie van geconfigureerde Plugin-installatie, offline Plugin, Plugin-update en Telegram-bewijs op dezelfde opgeloste package-tarball. Stel `package_acceptance_package_spec` in op Full Release Validation of OpenClaw Release Checks om dezelfde matrix uit te voeren tegen een verzonden npm-package in plaats van het uit de SHA gebouwde artefact. Cross-OS-releasechecks dekken nog steeds OS-specifieke onboarding, installer- en platformgedrag; productvalidatie voor package/update hoort te beginnen met Package Acceptance. De Docker-lane `published-upgrade-survivor` valideert één gepubliceerde package-baseline per run. In Package Acceptance is de opgeloste `package-under-test`-tarball altijd de kandidaat en selecteert `published_upgrade_survivor_baseline` de fallback gepubliceerde baseline, standaard `openclaw@latest`; rerun-opdrachten voor mislukte lanes behouden die baseline. Stel `published_upgrade_survivor_baselines=all-since-2026.4.23` in om Full Release CI uit te breiden over elke stabiele npm-release van `2026.4.23` tot en met `latest`; `release-history` blijft beschikbaar voor handmatige bredere sampling met het oudere anker van vóór die datum. Stel `published_upgrade_survivor_scenarios=reported-issues` in om dezelfde baselines uit te breiden over issue-vormige fixtures voor Feishu-config, behouden bootstrap/persona-bestanden, geconfigureerde OpenClaw Plugin-installaties, tilde-logpaden en verouderde legacy Plugin-dependencyroots. De aparte workflow `Update Migration` gebruikt de Docker-lane `update-migration` met `all-since-2026.4.23` en `plugin-deps-cleanup` wanneer de vraag uitputtende cleanup van gepubliceerde updates is, niet de normale breedte van Full Release CI. Lokale geaggregeerde runs kunnen exacte package-specificaties doorgeven met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, één lane behouden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` zoals `openclaw@2026.4.15`, of `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` instellen voor de scenariomatrix. De gepubliceerde lane configureert de baseline met een ingebakken `openclaw config set`-opdrachtrecept, legt receptstappen vast in `summary.json`, en controleert `/healthz`, `/readyz`, plus RPC-status na Gateway-start. De fresh lanes voor Windows packaged en installer verifiëren ook dat een geïnstalleerd package een browser-control-override kan importeren vanaf een raw absoluut Windows-pad. De OpenAI cross-OS agent-turn-smoke gebruikt standaard `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer ingesteld, anders `openai/gpt-5.4`, zodat het installatie- en Gateway-bewijs op een GPT-5-testmodel blijft en GPT-4.x-standaarden worden vermeden.

### Legacy-compatibiliteitsvensters

Package Acceptance heeft begrensde legacy-compatibiliteitsvensters voor reeds gepubliceerde packages. Packages tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen het compatibiliteitspad gebruiken:

- bekende private QA-vermeldingen in `dist/postinstall-inventory.json` mogen wijzen naar bestanden die uit de tarball zijn weggelaten;
- `doctor-switch` mag de subcase voor persistentie van `gateway install --wrapper` overslaan wanneer het package die flag niet aanbiedt;
- `update-channel-switch` mag ontbrekende `pnpm.patchedDependencies` snoeien uit de van de tarball afgeleide fake git-fixture en mag ontbrekende gepersistente `update.channel` loggen;
- Plugin-smokes mogen legacy install-record-locaties lezen of ontbrekende marketplace install-record-persistentie accepteren;
- `plugin-update` mag migratie van configmetadata toestaan, terwijl nog steeds wordt vereist dat het install-record en no-reinstall-gedrag ongewijzigd blijven.

Het gepubliceerde package `2026.4.26` mag ook waarschuwen voor lokale buildmetadata-stempelbestanden die al waren verzonden. Latere packages moeten voldoen aan de moderne contracten; dezelfde voorwaarden falen dan in plaats van te waarschuwen of over te slaan.

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

Begin bij het debuggen van een mislukte package-acceptance-run met de `resolve_package`-samenvatting om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de onderliggende `docker_acceptance`-run en de Docker-artefacten ervan: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logs, fasetimings en rerun-commando's. Geef de voorkeur aan het opnieuw uitvoeren van het mislukte pakketprofiel of de exacte Docker-lanes in plaats van de volledige releasevalidatie opnieuw uit te voeren.

## Installatiesmoke

De afzonderlijke workflow `Install Smoke` hergebruikt hetzelfde scope-script via zijn eigen `preflight`-job. Deze splitst smoke-dekking in `run_fast_install_smoke` en `run_full_install_smoke`.

- **Snelle pad** draait voor pull requests die Docker-/pakketoppervlakken raken, wijzigingen in meegeleverde pluginpakketten/manifests, of core-plugin-/kanaal-/gateway-/Plugin SDK-oppervlakken die de Docker-smoke-jobs testen. Broncodewijzigingen die alleen meegeleverde plugins raken, test-only bewerkingen en docs-only bewerkingen reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image eenmaal, controleert de CLI, draait de agents-delete shared-workspace CLI-smoke, draait de container-gateway-network-e2e, verifieert een meegeleverde extensie-build-arg en draait het begrensde Docker-profiel voor meegeleverde plugins onder een totale commandotime-out van 240 seconden (waarbij elke Docker-run van een scenario afzonderlijk is begrensd).
- **Volledige pad** bewaart QR-pakketinstallatie en installer-Docker-/updatedekking voor nachtelijke geplande runs, handmatige dispatches, workflow-call-releasechecks en pull requests die daadwerkelijk installer-/pakket-/Docker-oppervlakken raken. In volledige modus bereidt install-smoke één target-SHA GHCR-root-Dockerfile-smoke-image voor of hergebruikt die, en draait daarna QR-pakketinstallatie, root-Dockerfile-/Gateway-smokes, installer-/update-smokes en de snelle Docker-E2E voor meegeleverde plugins als afzonderlijke jobs, zodat installerwerk niet hoeft te wachten op de root-image-smokes.

`main`-pushes (inclusief mergecommits) forceren het volledige pad niet; wanneer de changed-scope-logica bij een push volledige dekking zou vragen, behoudt de workflow de snelle Docker-smoke en laat de volledige install-smoke over aan nachtelijke of releasevalidatie.

De trage image-provider-smoke voor globale Bun-installatie wordt afzonderlijk gated door `run_bun_global_install_smoke`. Deze draait volgens het nachtelijke schema en vanuit de releasechecks-workflow, en handmatige `Install Smoke`-dispatches kunnen ervoor kiezen deze mee te nemen, maar pull requests en `main`-pushes doen dat niet. QR- en installer-Docker-tests behouden hun eigen installatiegerichte Dockerfiles.

## Lokale Docker-E2E

`pnpm test:docker:all` bouwt vooraf één gedeelde live-test-image, pakt OpenClaw eenmaal als npm-tarball en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images:

- een kale Node/Git-runner voor installer-/update-/plugin-dependency-lanes;
- een functionele image die dezelfde tarball in `/app` installeert voor normale functionaliteitslanes.

Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en draait vervolgens lanes met `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Instelbare opties

| Variabele                              | Standaard | Doel                                                                                          |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Aantal slots in de main-pool voor normale lanes.                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Aantal slots in de provider-gevoelige tail-pool.                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limiet voor gelijktijdige live-lanes zodat providers niet throttlen.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limiet voor gelijktijdige npm-install-lanes.                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limiet voor gelijktijdige multi-service-lanes.                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Spreiding tussen lane-starts om Docker-daemon-create-stormen te voorkomen; zet op `0` voor geen spreiding. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Fallbacktime-out per lane (120 minuten); geselecteerde live-/tail-lanes gebruiken strakkere limieten. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset     | `1` drukt het schedulerplan af zonder lanes uit te voeren.                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset     | Exacte lanelijst, gescheiden door komma's; slaat cleanup-smoke over zodat agents één mislukte lane kunnen reproduceren. |

Een lane die zwaarder is dan zijn effectieve limiet kan nog steeds starten vanuit een lege pool, en draait daarna alleen totdat hij capaciteit vrijgeeft. De lokale aggregatie voert Docker-preflights uit, verwijdert verouderde OpenClaw-E2E-containers, geeft actieve-lane-status door, bewaart lanetimings voor longest-first-volgorde en stopt standaard met het plannen van nieuwe gepoolde lanes na de eerste mislukking.

### Herbruikbare live/E2E-workflow

De herbruikbare live/E2E-workflow vraagt `scripts/test-docker-all.mjs --plan-json` welke pakket-, imagekind-, live-image-, lane- en credentialdekking vereist is. `scripts/docker-e2e.mjs` zet dat plan vervolgens om in GitHub-outputs en samenvattingen. Deze pakt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een pakketartefact uit de huidige run, of downloadt een pakketartefact uit `package_artifact_run_id`; valideert de tarball-inventory; bouwt en pusht package-digest-getagde kale/functionele GHCR Docker-E2E-images via Blacksmiths Docker-layer-cache wanneer het plan lanes nodig heeft met geïnstalleerde pakketten; en hergebruikt meegegeven `docker_e2e_bare_image`-/`docker_e2e_functional_image`-inputs of bestaande package-digest-images in plaats van opnieuw te bouwen. Docker-image-pulls worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry-/cachestream snel opnieuw probeert in plaats van het grootste deel van het kritieke CI-pad te gebruiken.

### Releasepad-chunks

Release-Docker-dekking draait kleinere jobs in chunks met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elke chunk alleen het imagekind pullt dat hij nodig heeft en meerdere lanes uitvoert via dezelfde gewogen scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

De huidige Release-Docker-chunks zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` en `plugins-runtime-install-a` tot en met `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` en `plugins-integrations` blijven geaggregeerde plugin-/runtime-aliassen. De lane-alias `install-e2e` blijft de geaggregeerde handmatige rerun-alias voor beide provider-installer-lanes.

OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige releasepaddekking daarom vraagt, en behoudt alleen een zelfstandige `openwebui`-chunk voor OpenWebUI-only dispatches. Bundled-channel-update-lanes proberen één keer opnieuw bij tijdelijke npm-netwerkfouten.

Elke chunk uploadt `.artifacts/docker-tests/` met lane-logs, timings, `summary.json`, `failures.json`, fasetimings, schedulerplan-JSON, slow-lane-tabellen en rerun-commando's per lane. De workflow-input `docker_lanes` draait geselecteerde lanes tegen de voorbereide images in plaats van de chunkjobs, waardoor debugging van mislukte lanes begrensd blijft tot één gerichte Docker-job en het pakketartefact voor die run wordt voorbereid, gedownload of hergebruikt; als een geselecteerde lane een live-Docker-lane is, bouwt de gerichte job de live-test-image lokaal voor die rerun. Gegenereerde GitHub-rerun-commando's per lane bevatten `package_artifact_run_id`, `package_artifact_name` en voorbereide image-inputs wanneer die waarden bestaan, zodat een mislukte lane exact het pakket en de images uit de mislukte run kan hergebruiken.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

De geplande live/E2E-workflow draait dagelijks de volledige Releasepad-Docker-suite.

## Plugin Prerelease

`Plugin Prerelease` is duurdere product-/pakketdekking, dus het is een afzonderlijke workflow die wordt gedispatcht door `Full Release Validation` of door een expliciete operator. Normale pull requests, `main`-pushes en zelfstandige handmatige CI-dispatches laten die suite uitgeschakeld. De workflow balanceert tests voor meegeleverde plugins over acht extensieworkers; die extensie-shardjobs draaien maximaal twee pluginconfiguratiegroepen tegelijk met één Vitest-worker per groep en een grotere Node-heap, zodat import-zware pluginbatches geen extra CI-jobs maken. Het release-only Docker-prereleasepad batcht gerichte Docker-lanes in kleine groepen om te voorkomen dat tientallen runners worden gereserveerd voor jobs van één tot drie minuten.

## QA Lab

QA Lab heeft eigen CI-lanes buiten de belangrijkste smart-scoped workflow. Agentische parity is genest onder de brede QA- en releaseharnassen, niet als zelfstandige PR-workflow. Gebruik `Full Release Validation` met `rerun_group=qa-parity` wanneer parity mee moet lopen met een brede validatierun.

- De workflow `QA-Lab - All Lanes` draait elke nacht op `main` en bij handmatige dispatch; deze waaiert uit naar de mock-parity-lane, live Matrix-lane en live Telegram- en Discord-lanes als parallelle jobs. Live-jobs gebruiken de omgeving `qa-live-shared`, en Telegram/Discord gebruiken Convex-leases.

Releasechecks draaien Matrix- en Telegram-live-transportlanes met de deterministische mockprovider en mock-gekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het kanaalcontract geïsoleerd is van live-modellatentie en normale provider-plugin-startup. De live-transport-Gateway schakelt memory search uit omdat QA-parity geheugengedrag afzonderlijk dekt; providerconnectiviteit wordt gedekt door de afzonderlijke live-model-, native-provider- en Docker-provider-suites.

Matrix gebruikt `--profile fast` voor geplande en release-gates, en voegt `--fail-fast` alleen toe wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaard en handmatige workflow-input blijven `all`; handmatige `matrix_profile=all`-dispatch shardt volledige Matrix-dekking altijd in `transport`-, `media`-, `e2ee-smoke`-, `e2ee-deep`- en `e2ee-cli`-jobs.

`OpenClaw Release Checks` draait ook de releasekritieke QA Lab-lanes vóór releasegoedkeuring; de QA-parity-gate draait de kandidaat- en baseline-packs als parallelle lane-jobs, en downloadt daarna beide artefacten in een kleine rapportjob voor de uiteindelijke parityvergelijking.

Volg voor normale PR's scoped CI-/check-bewijs in plaats van parity als verplichte status te behandelen.

## CodeQL

De `CodeQL`-workflow is bewust een smalle securityscanner voor de eerste pass, niet de volledige repository-sweep. Dagelijkse, handmatige en niet-concept pull request guard-runs scannen Actions-workflowcode plus de JavaScript/TypeScript-oppervlakken met het hoogste risico met high-confidence security-query's, gefilterd op hoge/kritieke `security-severity`.

De pull request guard blijft licht: hij start alleen voor wijzigingen onder `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` of `src`, en voert dezelfde high-confidence security-matrix uit als de geplande workflow. Android- en macOS-CodeQL blijven buiten de standaardinstellingen voor PR's.

### Securitycategorieën

| Categorie                                          | Oppervlak                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron en Gateway-baseline                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Core channel-implementatiecontracten plus de channel Plugin-runtime, Gateway, Plugin SDK, secrets en audit-touchpoints              |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP-parsing, network guard, web-fetch en Plugin SDK SSRF-beleidsoppervlakken                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-servers, procesuitvoeringshelpers, outbound delivery en agent tool-execution gates                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-installatie, loader, manifest, registry, package-manager-installatie, source-loading en trust-oppervlakken van het Plugin SDK-packagecontract |

### Platformspecifieke security-shards

- `CodeQL Android Critical Security` — geplande Android-security-shard. Bouwt de Android-app handmatig voor CodeQL op de kleinste Blacksmith Linux-runner die door workflow sanity wordt geaccepteerd. Uploadt onder `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — wekelijkse/handmatige macOS-security-shard. Bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert dependency-buildresultaten uit de geüploade SARIF en uploadt onder `/codeql-critical-security/macos`. Blijft buiten de dagelijkse standaardinstellingen omdat de macOS-build de runtime domineert, zelfs wanneer hij schoon is.

### Critical Quality-categorieën

`CodeQL Critical Quality` is de overeenkomende niet-security-shard. Deze voert alleen error-severity, niet-security JavaScript/TypeScript-quality-query's uit over smalle, hoogwaardige oppervlakken op de kleinere Blacksmith Linux-runner. De pull request guard is bewust kleiner dan het geplande profiel: niet-concept PR's voeren alleen de overeenkomende `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` en `plugin-sdk-reply-runtime` shards uit voor agent command/model/tool-uitvoering en reply-dispatchcode, config schema/migration/IO-code, auth/secrets/sandbox/security-code, core channel en gebundelde channel Plugin-runtime, Gateway protocol/server-method, memory runtime/SDK-glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, Plugin-loader, Plugin SDK/package-contract of Plugin SDK reply runtime-wijzigingen. CodeQL-configuratie- en quality-workflowwijzigingen voeren alle twaalf PR-quality-shards uit.

Handmatige dispatch accepteert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

De smalle profielen zijn onderwijs-/iteratiehooks voor het geïsoleerd uitvoeren van één quality-shard.

| Categorie                                                | Oppervlak                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secrets, sandbox, cron en Gateway-security-boundarycode                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Config-schema, migratie, normalisatie en IO-contracten                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-protocolschema's en server-method-contracten                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Core channel- en gebundelde channel Plugin-implementatiecontracten                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Command-uitvoering, model/provider-dispatch, auto-reply-dispatch en queues, en ACP control-plane-runtimecontracten                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-servers en tool-bridges, process supervision-helpers en outbound delivery-contracten                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime-facades, memory Plugin SDK-aliassen, memory runtime activation-glue en memory doctor-commando's                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply queue-internals, session delivery queues, outbound session binding/delivery-helpers, diagnostic event/log bundle-oppervlakken en session doctor CLI-contracten |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply-dispatch, reply payload/chunking/runtime-helpers, channel reply options, delivery queues en session/thread binding-helpers             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model catalog-normalisatie, provider-auth en discovery, provider runtime-registratie, provider defaults/catalogs en web/search/fetch/embedding-registries    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI-bootstrap, lokale persistentie, Gateway-control flows en task control-plane-runtimecontracten                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search, media-IO, media understanding, image-generation en media-generation-runtimecontracten                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, registry-, public-surface- en Plugin SDK-entrypointcontracten                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Gepubliceerde package-side Plugin SDK-bron en helperfuncties voor plugin package-contracten                                                                                      |

Quality blijft gescheiden van security zodat quality-bevindingen kunnen worden gepland, gemeten, uitgeschakeld of uitgebreid zonder het security-signaal te vertroebelen. Uitbreiding van Swift-, Python- en gebundelde-plugin-CodeQL moet alleen als gescopeerd of geshard vervolgwerk worden teruggezet nadat de smalle profielen een stabiele runtime en stabiel signaal hebben.

## Onderhoudsworkflows

### Docs Agent

De `Docs Agent`-workflow is een eventgedreven Codex-onderhoudslane om bestaande documentatie afgestemd te houden op recent gelande wijzigingen. Hij heeft geen zuiver schema: een succesvolle niet-bot push CI-run op `main` kan hem triggeren, en handmatige dispatch kan hem rechtstreeks uitvoeren. Workflow-run-aanroepen slaan over wanneer `main` is doorgeschoven of wanneer er in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is aangemaakt. Wanneer hij draait, beoordeelt hij de commitrange vanaf de vorige niet-overgeslagen Docs Agent-bron-SHA tot de huidige `main`, zodat één uurlijkse run alle main-wijzigingen kan dekken die sinds de laatste documentatiepass zijn verzameld.

### Test Performance Agent

De `Test Performance Agent`-workflow is een eventgedreven Codex-onderhoudslane voor trage tests. Hij heeft geen zuiver schema: een succesvolle niet-bot push CI-run op `main` kan hem triggeren, maar hij slaat over als er die UTC-dag al een andere workflow-run-aanroep is uitgevoerd of draait. Handmatige dispatch omzeilt die dagelijkse activiteitsgate. De lane bouwt een gegroepeerd Vitest-performancerapport voor de volledige suite, laat Codex alleen kleine testprestatieverbeteringen maken die coverage behouden in plaats van brede refactors, voert daarna het full-suite-rapport opnieuw uit en wijst wijzigingen af die het aantal geslaagde baselinetests verminderen. Als de baseline falende tests heeft, mag Codex alleen evidente failures oplossen en moet het full-suite-rapport na de agent slagen voordat er iets wordt gecommit. Wanneer `main` doorgaat voordat de bot-push landt, rebased de lane de gevalideerde patch, voert `pnpm check:changed` opnieuw uit en probeert de push opnieuw; conflicterende stale patches worden overgeslagen. Hij gebruikt GitHub-hosted Ubuntu zodat de Codex-action dezelfde drop-sudo-safety-posture kan houden als de docs agent.

### Duplicate PRs After Merge

De `Duplicate PRs After Merge`-workflow is een handmatige maintainer-workflow voor duplicate cleanup na landing. Standaard is dit dry-run en worden alleen expliciet vermelde PR's gesloten wanneer `apply=true`. Voordat GitHub wordt gewijzigd, verifieert hij dat de gelande PR is gemerged en dat elke duplicate ofwel een gedeeld gerefereerd issue heeft, of overlappende gewijzigde hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale check gates en changed routing

Lokale changed-lane-logica leeft in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale check gate is strikter over architectuurgrenzen dan de brede CI-platformscope:

- core-productiewijzigingen voeren core prod- en core test-typecheck plus core lint/guards uit;
- wijzigingen alleen aan core-tests voeren alleen core test-typecheck plus core lint uit;
- extensieproductiewijzigingen voeren extension prod- en extension test-typecheck plus extension lint uit;
- wijzigingen alleen aan extensietests voeren extension test-typecheck plus extension lint uit;
- publieke Plugin SDK- of plugin-contractwijzigingen breiden uit naar extension typecheck omdat extensies afhankelijk zijn van die core-contracten (Vitest extension-sweeps blijven expliciet testwerk);
- release metadata-only version bumps voeren gerichte versie-/config-/root-dependency-checks uit;
- onbekende root/config-wijzigingen failen veilig naar alle check lanes.

Lokale changed-test-routing leeft in `scripts/test-projects.test-support.mjs` en is bewust goedkoper dan `check:changed`: directe testwijzigingen voeren zichzelf uit, bronwijzigingen geven de voorkeur aan expliciete mappings, daarna sibling-tests en import-graph dependents. Gedeelde group-room delivery-config is een van de expliciete mappings: wijzigingen aan de group visible-reply config, source reply delivery mode of de message-tool system prompt lopen via de core reply-tests plus Discord- en Slack-delivery-regressies, zodat een gedeelde standaardwijziging faalt vóór de eerste PR-push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging zo harness-breed is dat de goedkope gemapte set geen betrouwbare proxy is.

## Testbox-validatie

Voer Testbox uit vanuit de repo-root en geef voor brede verificatie de voorkeur aan een vers opgewarmde box. Voordat je een trage gate uitvoert op een box die is hergebruikt, verlopen is of zojuist een onverwacht grote synchronisatie meldde, voer je eerst `pnpm testbox:sanity` uit in de box.

De sanity check faalt snel wanneer vereiste rootbestanden zoals `pnpm-lock.yaml` zijn verdwenen of wanneer `git status --short` minstens 200 gevolgde verwijderingen toont. Dat betekent meestal dat de remote synchronisatiestatus geen betrouwbare kopie van de PR is; stop die box en warm in plaats van de producttestfout te debuggen een verse op. Voor PR's met bewust grote verwijderingen stel je `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor die sanity-run.

`pnpm testbox:run` beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de synchronisatiefase blijft zonder uitvoer na de synchronisatie. Stel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` in om die bescherming uit te schakelen, of gebruik een grotere millisecondewaarde voor ongebruikelijk grote lokale diffs.

Crabbox is het tweede door de repo beheerde remote-boxpad voor Linux-verificatie wanneer Blacksmith niet beschikbaar is of wanneer eigen cloudcapaciteit de voorkeur heeft. Warm een box op, hydrateer die via de projectworkflow en voer daarna commando's uit via de Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` beheert de standaardinstellingen voor provider, synchronisatie en GitHub Actions-hydratatie. Het sluit lokale `.git` uit zodat de gehydrateerde Actions-checkout zijn eigen remote Git-metadata behoudt in plaats van maintainer-lokale remotes en object stores te synchroniseren, en het sluit lokale runtime-/buildartefacten uit die nooit mogen worden overgedragen. `.github/workflows/crabbox-hydrate.yml` beheert checkout, Node/pnpm-installatie, `origin/main` ophalen, en de niet-geheime omgevingshandoff die latere `crabbox run --id <cbx_id>`-commando's gebruiken als bron.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Ontwikkelkanalen](/nl/install/development-channels)
