---
read_when:
    - Je moet begrijpen waarom een CI-taak wel of niet is uitgevoerd
    - Je debugt een falende GitHub Actions-controle
    - Je coördineert een releasevalidatierun of een herhaling daarvan
    - Je wijzigt de ClawSweeper-dispatch of het doorsturen van GitHub-activiteit
summary: CI-jobgrafiek, scope-gates, release-overkoepelingen en equivalenten voor lokale opdrachten
title: CI-pipeline
x-i18n:
    generated_at: "2026-05-04T07:03:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72959d0feaf1339f01c9da263153fd89cc4727da6f928933819931991222714d
    source_path: ci.md
    workflow: 16
---

OpenClaw CI draait bij elke push naar `main` en elke pull request. De taak `preflight` classificeert de diff en schakelt dure lanes uit wanneer alleen niet-gerelateerde gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen bewust slimme scoping en waaieren de volledige graph uit voor releasekandidaten en brede validatie. Android-lanes blijven opt-in via `include_android`. Plugin-dekking die alleen voor releases geldt, staat in de afzonderlijke workflow [`Plugin-voorrelease`](#plugin-prerelease) en draait alleen vanuit [`Volledige releasevalidatie`](#full-release-validation) of een expliciete handmatige dispatch.

## Pipeline-overzicht

| Taak                             | Doel                                                                                                      | Wanneer deze draait                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detecteert wijzigingen die alleen docs raken, gewijzigde scopes, gewijzigde extensies en bouwt het CI-manifest | Altijd bij niet-concept pushes en PR’s |
| `security-scm-fast`              | Detectie van privésleutels en workflow-audit via `zizmor`                                                 | Altijd bij niet-concept pushes en PR’s |
| `security-dependency-audit`      | Productie-lockfile-audit zonder afhankelijkheden tegen npm-advisories                                     | Altijd bij niet-concept pushes en PR’s |
| `security-fast`                  | Vereiste aggregatie voor de snelle beveiligingstaken                                                      | Altijd bij niet-concept pushes en PR’s |
| `check-dependencies`             | Productie-Knip-pass alleen voor afhankelijkheden plus de unused-file allowlist guard                      | Node-relevante wijzigingen         |
| `build-artifacts`                | Bouwt `dist/`, Control UI, controles voor gebouwde artefacten en herbruikbare downstream artefacten       | Node-relevante wijzigingen         |
| `checks-fast-core`               | Snelle Linux-correctheidslanes zoals gebundelde/plugin-contract/protocol-controles                        | Node-relevante wijzigingen         |
| `checks-fast-contracts-channels` | Geshaarde channel-contractcontroles met een stabiel geaggregeerd controleresultaat                        | Node-relevante wijzigingen         |
| `checks-node-core-test`          | Core Node-testshards, met uitzondering van channel-, gebundelde, contract- en extensielanes               | Node-relevante wijzigingen         |
| `check`                          | Geshaarde equivalent van de hoofd-local gate: productietypes, lint, guards, testtypes en strikte smoke    | Node-relevante wijzigingen         |
| `check-additional`               | Architectuur, geshaarde boundary/prompt-drift, extensieguards, package boundary en gateway watch          | Node-relevante wijzigingen         |
| `build-smoke`                    | Smoke-tests voor gebouwde CLI en startup-memory-smoke                                                     | Node-relevante wijzigingen         |
| `checks`                         | Verifier voor channel-tests van gebouwde artefacten                                                       | Node-relevante wijzigingen         |
| `checks-node-compat-node22`      | Node 22-compatibiliteitsbuild en smoke-lane                                                               | Handmatige CI-dispatch voor releases |
| `check-docs`                     | Docs-formattering, lint en controles op gebroken links                                                    | Docs gewijzigd                     |
| `skills-python`                  | Ruff + pytest voor Python-ondersteunde Skills                                                             | Python-Skills-relevante wijzigingen |
| `checks-windows`                 | Windows-specifieke proces-/padtests plus gedeelde regressies voor runtime-importspecificaties             | Windows-relevante wijzigingen      |
| `macos-node`                     | macOS TypeScript-testlane met de gedeelde gebouwde artefacten                                             | macOS-relevante wijzigingen        |
| `macos-swift`                    | Swift-lint, build en tests voor de macOS-app                                                              | macOS-relevante wijzigingen        |
| `android`                        | Android-unit tests voor beide flavors plus één debug-APK-build                                            | Android-relevante wijzigingen      |
| `test-performance-agent`         | Dagelijkse optimalisatie van trage Codex-tests na vertrouwde activiteit                                   | Succesvolle main-CI of handmatige dispatch |
| `openclaw-performance`           | Dagelijkse/op aanvraag Kova-runtimeprestatierapporten met mock-provider-, deep-profile- en GPT 5.4-live-lanes | Gepland en handmatige dispatch     |

## Fail-fast-volgorde

1. `preflight` bepaalt welke lanes überhaupt bestaan. De logica `docs-scope` en `changed-scope` zijn stappen binnen deze taak, geen zelfstandige taken.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` en `skills-python` falen snel zonder te wachten op de zwaardere artefact- en platformmatrix-taken.
3. `build-artifacts` overlapt met de snelle Linux-lanes, zodat downstream consumers kunnen starten zodra de gedeelde build klaar is.
4. Zwaardere platform- en runtimelanes waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` en `android`.

GitHub kan vervangen taken markeren als `cancelled` wanneer een nieuwere push op dezelfde PR- of `main`-ref landt. Behandel dat als CI-ruis tenzij de nieuwste run voor dezelfde ref ook faalt. Geaggregeerde shard-controles gebruiken `!cancelled() && always()`, zodat ze nog steeds normale shard-fouten rapporteren maar niet in de wachtrij komen nadat de hele workflow al is vervangen. De automatische CI-concurrency-key is geversioneerd (`CI-v7-*`), zodat een zombie aan GitHub-zijde in een oude queue group nieuwere main-runs niet oneindig kan blokkeren. Handmatige full-suite-runs gebruiken `CI-manual-v1-*` en annuleren geen lopende runs.

## Scope en routing

Scope-logica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unit tests in `src/scripts/ci-changed-scope.test.ts`. Handmatige dispatch slaat changed-scope-detectie over en laat het preflight-manifest doen alsof elk scoped gebied is gewijzigd.

- **CI-workflowwijzigingen** valideren de Node CI-graph plus workflow-linting, maar forceren op zichzelf geen Windows-, Android- of macOS-native builds; die platformlanes blijven gescoped tot platformbronwijzigingen.
- **CI-wijzigingen die alleen routing raken, geselecteerde goedkope core-testfixturewijzigingen en smalle plugin-contract helper/test-routing-wijzigingen** gebruiken een snel Node-only manifestpad: `preflight`, security en één `checks-fast-core`-taak. Dat pad slaat build-artefacten, Node 22-compatibiliteit, channel-contracts, volledige core-shards, gebundelde-plugin-shards en extra guard-matrices over wanneer de wijziging beperkt is tot de routing- of helper-oppervlakken die de snelle taak direct oefent.
- **Windows Node-controles** zijn gescoped tot Windows-specifieke proces-/padwrappers, npm/pnpm/UI-runnerhelpers, package manager-configuratie en de CI-workflowoppervlakken die die lane uitvoeren; niet-gerelateerde bron-, plugin-, install-smoke- en test-only-wijzigingen blijven op de Linux Node-lanes.

De traagste Node-testfamilies zijn gesplitst of gebalanceerd, zodat elke taak klein blijft zonder runners te ruim te reserveren: channel-contracts draaien als drie gewogen shards, core unit fast/support-lanes draaien afzonderlijk, core runtime infra is gesplitst tussen state- en process/config-shards, auto-reply draait als gebalanceerde workers (waarbij de reply-subtree is gesplitst in agent-runner-, dispatch- en commands/state-routing-shards), en agentic gateway/server-configs zijn gesplitst over chat/auth/model/http-plugin/runtime/startup-lanes in plaats van te wachten op gebouwde artefacten. Brede browser-, QA-, media- en diverse plugintests gebruiken hun eigen Vitest-configs in plaats van de gedeelde plugin catch-all. Include-pattern-shards registreren timingvermeldingen met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een volledige config kan onderscheiden van een gefilterde shard. `check-additional` houdt package-boundary compile/canary-werk bij elkaar en scheidt runtime-topologiearchitectuur van gateway watch-dekking; de boundary guard-lijst is verdeeld over vier matrixshards, die elk geselecteerde onafhankelijke guards gelijktijdig draaien en timings per controle afdrukken, inclusief `pnpm prompt:snapshots:check`, zodat Codex runtime happy-path prompt-drift wordt vastgepind op de PR die deze veroorzaakte. Gateway watch, channel-tests en de core support-boundary-shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd.

Android CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play debug-APK. De third-party flavor heeft geen afzonderlijke source set of manifest; de unit-testlane compileert de flavor nog steeds met de SMS/call-log BuildConfig-vlaggen, terwijl een dubbele debug-APK-packagingtaak bij elke Android-relevante push wordt vermeden.

De shard `check-dependencies` draait `pnpm deadcode:dependencies` (een productie-Knip-pass alleen voor afhankelijkheden, vastgezet op de nieuwste Knip-versie, met pnpm’s minimale releaseleeftijd uitgeschakeld voor de `dlx`-installatie) en `pnpm deadcode:unused-files`, die Knip’s productiebevindingen voor ongebruikte bestanden vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. De unused-file guard faalt wanneer een PR een nieuw niet-beoordeeld ongebruikt bestand toevoegt of een verouderde allowlist-vermelding laat staan, terwijl bewuste dynamische plugin-, gegenereerde, build-, live-test- en package bridge-oppervlakken behouden blijven die Knip niet statisch kan oplossen.

## ClawSweeper-activiteit doorsturen

`.github/workflows/clawsweeper-dispatch.yml` is de brug aan doelzijde van OpenClaw-repositoryactiviteit naar ClawSweeper. Deze checkt geen onvertrouwde pull request-code uit en voert die ook niet uit. De workflow maakt een GitHub App-token aan vanuit `CLAWSWEEPER_APP_PRIVATE_KEY` en dispatcht daarna compacte `repository_dispatch`-payloads naar `openclaw/clawsweeper`.

De workflow heeft vier lanes:

- `clawsweeper_item` voor exacte reviewverzoeken voor issues en pull requests;
- `clawsweeper_comment` voor expliciete ClawSweeper-commando’s in issuecommentaren;
- `clawsweeper_commit_review` voor reviewverzoeken op commitniveau bij `main`-pushes;
- `github_activity` voor algemene GitHub-activiteit die de ClawSweeper-agent mag inspecteren.

De lane `github_activity` stuurt alleen genormaliseerde metadata door: eventtype, actie, actor, repository, itemnummer, URL, titel, status en korte fragmenten voor commentaren of reviews wanneer aanwezig. Deze vermijdt bewust het doorsturen van de volledige webhookbody. De ontvangende workflow in `openclaw/clawsweeper` is `.github/workflows/github-activity.yml`, die het genormaliseerde event post naar de OpenClaw Gateway-hook voor de ClawSweeper-agent.

Algemene activiteit is observatie, geen standaardlevering. De ClawSweeper-agent ontvangt het Discord-doel in zijn prompt en zou alleen naar `#clawsweeper` moeten posten wanneer het event verrassend, actiegericht, riskant of operationeel nuttig is. Routineuze opens, edits, botverloop, dubbele webhookruis en normaal reviewverkeer moeten resulteren in `NO_REPLY`.

Behandel GitHub-titels, commentaren, bodies, reviewtekst, branchnamen en commitberichten in dit hele pad als onvertrouwde data. Ze zijn invoer voor samenvatting en triage, geen instructies voor de workflow- of agent-runtime.

## Handmatige dispatches

Handmatige CI-dispatches voeren dezelfde jobgrafiek uit als normale CI, maar schakelen elke niet-Android gescopete lane geforceerd in: Linux Node-shards, gebundelde-Plugin-shards, kanaalcontracten, Node 22-compatibiliteit, `check`, `check-additional`, build smoke, docs-controles, Python Skills, Windows, macOS en Control UI i18n. Losstaande handmatige CI-dispatches voeren alleen Android uit met `include_android=true`; de volledige releaseparaplu schakelt Android in door `include_android=true` mee te geven. Statische controles voor Plugin-prereleases, de alleen-voor-release `agentic-plugins`-shard, de volledige batchsweep voor extensies en Docker-lanes voor Plugin-prereleases zijn uitgesloten van CI. De Docker-prerelease-suite draait alleen wanneer `Full Release Validation` de afzonderlijke `Plugin Prerelease`-workflow dispatcht met de releasevalidatie-gate ingeschakeld.

Handmatige runs gebruiken een unieke concurrency-groep, zodat een volledige suite voor een releasekandidaat niet wordt geannuleerd door een andere push- of PR-run op dezelfde ref. Met de optionele `target_ref`-invoer kan een vertrouwde caller die grafiek uitvoeren tegen een branch, tag of volledige commit-SHA, terwijl het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, snelle beveiligingsjobs en aggregaten (`security-scm-fast`, `security-dependency-audit`, `security-fast`), snelle protocol-/contract-/gebundelde controles, gesharde kanaalcontractcontroles, `check`-shards behalve lint, `check-additional`-shards en aggregaten, aggregaatverifiers voor Node-tests, docs-controles, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight gebruikt ook GitHub-gehoste Ubuntu zodat de Blacksmith-matrix eerder in de wachtrij kan komen |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lichtere extensieshards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` en `check-test-types`                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node-testshards, gebundelde Plugin-testshards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-gevoelig genoeg dat 8 vCPU meer kostte dan het opleverde); install-smoke Docker-builds (32-vCPU-wachtrijtijd kostte meer dan het opleverde)                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |

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

`OpenClaw Performance` is de product-/runtimeprestatieworkflow. Deze draait dagelijks op `main` en kan handmatig worden gedispatcht:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Handmatige dispatch benchmarkt normaal de workflow-ref. Stel `target_ref` in om een releasetag of een andere branch te benchmarken met de huidige workflowimplementatie. Gepubliceerde rapportpaden en latest-pointers zijn gekoppeld aan de geteste ref, en elke `index.md` registreert de geteste ref/SHA, workflow-ref/SHA, Kova-ref, het profiel, de lane-auth-modus, het model, het aantal herhalingen en scenariofilters.

De workflow installeert OCM vanaf een gepinde release en Kova vanaf `openclaw/Kova` op de gepinde `kova_ref`-invoer, en voert vervolgens drie lanes uit:

- `mock-provider`: Kova-diagnostische scenario's tegen een lokaal gebouwde runtime met deterministische nep-auth die compatibel is met OpenAI.
- `mock-deep-profile`: CPU-/heap-/traceprofilering voor hotspots bij opstarten, Gateway en agent-turns.
- `live-gpt54`: een echte OpenAI `openai/gpt-5.4`-agent-turn, overgeslagen wanneer `OPENAI_API_KEY` niet beschikbaar is.

De mock-provider-lane voert ook OpenClaw-native bronprobes uit na de Kova-pass: Gateway-opstarttiming en geheugen voor standaard-, hook- en 50-Plugin-opstartcases; herhaalde mock-OpenAI `channel-chat-baseline` hello-loops; en CLI-opstartcommando's tegen de opgestarte Gateway. De Markdown-samenvatting van de bronprobe staat op `source/index.md` in de rapportbundel, met ruwe JSON ernaast.

Elke lane uploadt GitHub-artifacts. Wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd, commit de workflow ook `report.json`, `report.md`, bundels, `index.md` en bronprobe-artifacts naar `openclaw/clawgrit-reports` onder `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. De huidige pointer voor de geteste ref wordt geschreven als `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validatie van volledige release

`Full Release Validation` is de handmatige parapluworkflow voor "alles uitvoeren vóór release". Deze accepteert een branch, tag of volledige commit-SHA, dispatcht de handmatige `CI`-workflow met dat doel, dispatcht `Plugin Prerelease` voor alleen-voor-release Plugin-/pakket-/statische-/Docker-bewijsvoering, en dispatcht `OpenClaw Release Checks` voor install smoke, pakketacceptatie, Docker-releasepad-suites, live/E2E, OpenWebUI, QA Lab-pariteit, Matrix en Telegram-lanes. Met `rerun_group=all` en `release_profile=full` voert deze ook `NPM Telegram Beta E2E` uit tegen het `release-package-under-test`-artifact uit releasecontroles. Geef na publicatie `npm_telegram_package_spec` mee om dezelfde Telegram-pakketlane opnieuw uit te voeren tegen het gepubliceerde npm-pakket.

Zie [Validatie van volledige release](/nl/reference/full-release-validation) voor de
fasematrix, exacte workflowjobnamen, profielverschillen, artifacts en
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

Gebruik voor gepind commitbewijs op een snel bewegende branch de helper in plaats van
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow-dispatch-refs moeten branches of tags zijn, geen ruwe commit-SHA's. De
helper pusht een tijdelijke `release-ci/<sha>-...`-branch op de doel-SHA,
dispatcht `Full Release Validation` vanaf die gepinde ref, verifieert dat elke
onderliggende workflow-`headSha` overeenkomt met het doel, en verwijdert de tijdelijke branch wanneer de
run is voltooid. De parapluverifier faalt ook als een onderliggende workflow op een
andere SHA is uitgevoerd.

`release_profile` bepaalt de live/provider-breedte die aan releasecontroles wordt doorgegeven. De
handmatige releaseworkflows gebruiken standaard `stable`; gebruik `full` alleen wanneer je
bewust de brede adviserende provider/media-matrix wilt.

- `minimum` behoudt de snelste OpenAI/core releasekritieke lanes.
- `stable` voegt de stabiele provider/backend-set toe.
- `full` voert de brede adviserende provider/media-matrix uit.

De overkoepelende workflow registreert de verzonden child-run-id's, en de laatste taak `Verify full validation` controleert de huidige conclusies van child-runs opnieuw en voegt tabellen met traagste taken toe voor elke child-run. Als een child-workflow opnieuw wordt uitgevoerd en groen wordt, voer dan alleen de parent-verificatietaak opnieuw uit om het overkoepelende resultaat en de timingsamenvatting te vernieuwen.

Voor herstel accepteren zowel `Full Release Validation` als `OpenClaw Release Checks` `rerun_group`. Gebruik `all` voor een release candidate, `ci` voor alleen de normale volledige CI-child, `plugin-prerelease` voor alleen de Plugin prerelease-child, `release-checks` voor elke release-child, of een smallere groep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, of `npm-telegram` op de overkoepelende workflow. Dit houdt een nieuwe uitvoering van een mislukte releasebox begrensd na een gerichte fix.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde ref eenmalig om te zetten in een `release-package-under-test`-tarball, en geeft dat artifact vervolgens door aan zowel de Docker-workflow voor het live/E2E-releasepad als de package acceptance-shard. Zo blijven de package-bytes consistent tussen releaseboxen en wordt voorkomen dat dezelfde kandidaat in meerdere child-taken opnieuw wordt verpakt.

Dubbele `Full Release Validation`-runs voor `ref=main` en `rerun_group=all`
vervangen de oudere overkoepelende workflow. De parent-monitor annuleert elke child-workflow die deze
al heeft verzonden wanneer de parent wordt geannuleerd, zodat nieuwere main-validatie
niet achter een verouderde release-checkrun van twee uur blijft staan. Validatie van releasebranch/tag
en gerichte rerun-groepen behouden `cancel-in-progress: false`.

## Live- en E2E-shards

De release live/E2E-child behoudt brede native `pnpm test:live`-dekking, maar voert deze uit als benoemde shards via `scripts/test-live-shard.mjs` in plaats van één seriële taak:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-gefilterde `native-live-src-gateway-profiles`-taken
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- gesplitste media-audio/video-shards en provider-gefilterde muziekshards

Dat behoudt dezelfde bestandsdekking en maakt trage live-providerfouten makkelijker opnieuw uit te voeren en te diagnosticeren. De aggregaatshardnamen `native-live-extensions-o-z`, `native-live-extensions-media`, en `native-live-extensions-media-music` blijven geldig voor handmatige eenmalige reruns.

De native live-mediashards draaien in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de workflow `Live Media Runner Image`. Die image installeert `ffmpeg` en `ffprobe` vooraf; mediataken verifiëren alleen de binaries vóór de setup. Houd Docker-backed live-suites op normale Blacksmith-runners — containertaken zijn de verkeerde plek om geneste Docker-tests te starten.

Docker-backed live model/backend-shards gebruiken een aparte gedeelde `ghcr.io/openclaw/openclaw-live-test:<sha>`-image per geselecteerde commit. De live-releaseworkflow bouwt en pusht die image één keer, waarna de Docker live model-, provider-sharded Gateway-, CLI-backend-, ACP-bind- en Codex-harnessshards draaien met `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker-shards hebben expliciete `timeout`-limieten op scriptniveau onder de workflowtaak-time-out, zodat een vastgelopen container of opruimpad snel faalt in plaats van het volledige release-checkbudget te verbruiken. Als die shards de volledige source Docker-target onafhankelijk opnieuw bouwen, is de releaserun verkeerd geconfigureerd en verspilt deze wandkloktijd aan dubbele image-builds.

## Pakketacceptatie

Gebruik `Package Acceptance` wanneer de vraag is: "werkt dit installeerbare OpenClaw-package als product?" Het verschilt van normale CI: normale CI valideert de source tree, terwijl pakketacceptatie één tarball valideert via dezelfde Docker E2E-harness die gebruikers na installatie of update gebruiken.

### Taken

1. `resolve_package` checkt `workflow_ref` uit, bepaalt één package-kandidaat, schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het artifact `package-under-test`, en print de bron, workflow-ref, package-ref, versie, SHA-256, en het profiel in de GitHub-stapsamenvatting.
2. `docker_acceptance` roept `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt dat artifact, valideert de tarball-inventaris, bereidt package-digest Docker-images voor wanneer nodig, en draait de geselecteerde Docker-lanes tegen dat package in plaats van de workflow-checkout te verpakken. Wanneer een profiel meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het package en de gedeelde images één keer voor, en waaiert die lanes vervolgens uit als parallelle gerichte Docker-taken met unieke artifacts.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Deze draait wanneer `telegram_mode` niet `none` is en installeert hetzelfde `package-under-test`-artifact wanneer Package Acceptance er één heeft bepaald; standalone Telegram-dispatch kan nog steeds een gepubliceerde npm-spec installeren.
4. `summary` laat de workflow falen als package-resolutie, Docker-acceptatie, of de optionele Telegram-lane is mislukt.

### Kandidaatbronnen

- `source=npm` accepteert alleen `openclaw@beta`, `openclaw@latest`, of een exacte OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor gepubliceerde prerelease/stable-acceptatie.
- `source=ref` verpakt een vertrouwde `package_ref`-branch, tag, of volledige commit-SHA. De resolver fetcht OpenClaw-branches/tags, verifieert dat de geselecteerde commit bereikbaar is vanuit de branchgeschiedenis van de repository of een releasetag, installeert dependencies in een losgekoppelde worktree, en verpakt deze met `scripts/package-openclaw-for-docker.mjs`.
- `source=url` downloadt een HTTPS `.tgz`; `package_sha256` is verplicht.
- `source=artifact` downloadt één `.tgz` van `artifact_run_id` en `artifact_name`; `package_sha256` is optioneel maar moet worden opgegeven voor extern gedeelde artifacts.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde workflow/harness-code die de test uitvoert. `package_ref` is de source-commit die wordt verpakt wanneer `source=ref`. Hierdoor kan de huidige testharness oudere vertrouwde source-commits valideren zonder oude workflowlogica uit te voeren.

### Suiteprofielen

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — volledige Docker release-path chunks met OpenWebUI
- `custom` — exacte `docker_lanes`; vereist wanneer `suite_profile=custom`

Het `package`-profiel gebruikt offline plugin-dekking zodat validatie van gepubliceerde packages niet afhankelijk is van live beschikbaarheid van ClawHub. De optionele Telegram-lane hergebruikt het `package-under-test`-artifact in `NPM Telegram Beta E2E`, waarbij het gepubliceerde npm-specpad behouden blijft voor standalone dispatches.

Voor het specifieke update- en plugintestbeleid, inclusief lokale commando's,
Docker-lanes, Package Acceptance-inputs, releasestandaarden, en fouttriage,
zie [Updates en plugins testen](/nl/help/testing-updates-plugins).

Releasecontroles roepen Package Acceptance aan met `source=artifact`, het voorbereide release-package-artifact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues`, en `telegram_mode=mock-openai`. Dit houdt package-migratie, update, opruimen van verouderde plugin-dependencies, installatiereparatie van geconfigureerde plugins, offline plugin, plugin-update, en Telegram-bewijs op dezelfde opgeloste package-tarball. Stel `package_acceptance_package_spec` in op Full Release Validation of OpenClaw Release Checks om diezelfde matrix uit te voeren tegen een verscheept npm-package in plaats van het uit SHA gebouwde artifact. Cross-OS-releasecontroles dekken nog steeds OS-specifieke onboarding-, installer- en platformgedrag; productvalidatie voor package/update moet beginnen met Package Acceptance. De Docker-lane `published-upgrade-survivor` valideert één gepubliceerde packagebaseline per run. In Package Acceptance is de opgeloste `package-under-test`-tarball altijd de kandidaat en selecteert `published_upgrade_survivor_baseline` de fallback gepubliceerde baseline, standaard `openclaw@latest`; rerun-commando's voor mislukte lanes behouden die baseline. Stel `published_upgrade_survivor_baselines=all-since-2026.4.23` in om Full Release CI uit te breiden over elke stabiele npm-release van `2026.4.23` tot en met `latest`; `release-history` blijft beschikbaar voor handmatige bredere sampling met het oudere anker vóór die datum. Stel `published_upgrade_survivor_scenarios=reported-issues` in om dezelfde baselines uit te breiden over issue-vormige fixtures voor Feishu-config, behouden bootstrap/persona-bestanden, geconfigureerde OpenClaw-plugininstallaties, tilde-logpaden, en verouderde legacy plugin dependency-roots. De aparte workflow `Update Migration` gebruikt de Docker-lane `update-migration` met `all-since-2026.4.23` en `plugin-deps-cleanup` wanneer de vraag uitgebreide opruiming van gepubliceerde updates is, niet de normale breedte van Full Release CI. Lokale aggregaatruns kunnen exacte package-specs doorgeven met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, één lane behouden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` zoals `openclaw@2026.4.15`, of `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` instellen voor de scenariomatrix. De gepubliceerde lane configureert de baseline met een ingebakken `openclaw config set`-commandorecept, registreert receptstappen in `summary.json`, en peilt `/healthz`, `/readyz`, plus RPC-status na het starten van Gateway. De Windows packaged- en installer fresh-lanes verifiëren ook dat een geïnstalleerd package een browser-control override kan importeren vanuit een onbewerkt absoluut Windows-pad. De OpenAI cross-OS agent-turn smoke gebruikt standaard `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer ingesteld, anders `openai/gpt-5.4`, zodat het installatie- en Gateway-bewijs op een GPT-5-testmodel blijft en GPT-4.x-standaarden worden vermeden.

### Legacy-compatibiliteitsvensters

Package Acceptance heeft begrensde legacy-compatibiliteitsvensters voor al gepubliceerde packages. Packages tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen het compatibiliteitspad gebruiken:

- bekende private QA-items in `dist/postinstall-inventory.json` mogen naar bestanden wijzen die uit de tarball zijn weggelaten;
- `doctor-switch` mag de subcase voor persistentie van `gateway install --wrapper` overslaan wanneer het package die flag niet exposeert;
- `update-channel-switch` mag ontbrekende `pnpm.patchedDependencies` snoeien uit de van de tarball afgeleide nep-git-fixture en mag ontbrekende gepersisteerde `update.channel` loggen;
- plugin-smokes mogen legacy install-record-locaties lezen of ontbrekende persistentie van marketplace install-records accepteren;
- `plugin-update` mag configmetadata-migratie toestaan terwijl nog steeds wordt vereist dat het installatierecord en het no-reinstall-gedrag ongewijzigd blijven.

Het gepubliceerde package `2026.4.26` mag ook waarschuwen voor lokale buildmetadata-stampbestanden die al waren verscheept. Latere packages moeten aan de moderne contracten voldoen; dezelfde voorwaarden falen dan in plaats van te waarschuwen of over te slaan.

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

Begin bij het debuggen van een mislukte package-acceptance-run met de samenvatting van `resolve_package` om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de onderliggende run `docker_acceptance` en de bijbehorende Docker-artefacten: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logs, fasetimings en rerun-commando's. Geef de voorkeur aan het opnieuw uitvoeren van het mislukte pakketprofiel of de exacte Docker-lanes in plaats van volledige releasevalidatie opnieuw uit te voeren.

## Installatiesmoke

De afzonderlijke workflow `Install Smoke` hergebruikt hetzelfde scopescript via zijn eigen `preflight`-job. Deze splitst smoke-dekking op in `run_fast_install_smoke` en `run_full_install_smoke`.

- **Snel pad** draait voor pull requests die Docker-/pakketoppervlakken raken, wijzigingen aan gebundelde Plugin-pakketten/manifests, of kernoppervlakken voor Plugin/channel/Gateway/Plugin SDK die door de Docker-smokejobs worden getest. Bronwijzigingen alleen aan gebundelde Plugins, test-only edits en docs-only edits reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image eenmaal, controleert de CLI, voert de agents-delete-shared-workspace-CLI-smoke uit, draait de container-gateway-network-e2e, verifieert een build-arg voor gebundelde extensies en voert het begrensde gebundelde-Plugin-Docker-profiel uit met een totale commandotime-out van 240 seconden (waarbij elke afzonderlijke Docker-run per scenario apart is begrensd).
- **Volledig pad** bewaart QR-pakketinstallatie en installer-Docker-/update-dekking voor nachtelijke geplande runs, handmatige dispatches, workflow-call-releasechecks en pull requests die daadwerkelijk installer-/pakket-/Docker-oppervlakken raken. In volledige modus bereidt install-smoke één target-SHA GHCR-root-Dockerfile-smoke-image voor of hergebruikt die, en draait daarna QR-pakketinstallatie, root-Dockerfile-/Gateway-smokes, installer-/update-smokes en de snelle gebundelde-Plugin-Docker-E2E als afzonderlijke jobs, zodat installerwerk niet achter de root-image-smokes hoeft te wachten.

`main`-pushes (inclusief mergecommits) forceren het volledige pad niet; wanneer de changed-scope-logica bij een push volledige dekking zou aanvragen, behoudt de workflow de snelle Docker-smoke en laat hij de volledige install-smoke over aan nachtelijke of releasevalidatie.

De langzame Bun-global-install-image-provider-smoke wordt afzonderlijk begrensd door `run_bun_global_install_smoke`. Deze draait volgens het nachtelijke schema en vanuit de releasechecks-workflow, en handmatige `Install Smoke`-dispatches kunnen ervoor kiezen deze mee te nemen, maar pull requests en `main`-pushes niet. QR- en installer-Docker-tests behouden hun eigen installatiegerichte Dockerfiles.

## Lokale Docker-E2E

`pnpm test:docker:all` prebuiltt één gedeelde live-test-image, packt OpenClaw eenmaal als npm-tarball en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images:

- een kale Node-/Git-runner voor installer-/update-/Plugin-dependency-lanes;
- een functionele image die dezelfde tarball in `/app` installeert voor normale functionaliteitslanes.

Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en draait daarna lanes met `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Instelbare opties

| Variabele                              | Standaard | Doel                                                                                          |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Aantal slots in de hoofdpool voor normale lanes.                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Aantal slots in de providergevoelige tail-pool.                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limiet voor gelijktijdige live-lanes zodat providers niet throttlen.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limiet voor gelijktijdige npm-install-lanes.                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limiet voor gelijktijdige multi-service-lanes.                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Spreiding tussen lanestarts om Docker-daemon-create-stormen te vermijden; stel `0` in voor geen spreiding. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Fallbacktime-out per lane (120 minuten); geselecteerde live-/tail-lanes gebruiken strakkere limieten. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset     | `1` print het schedulerplan zonder lanes uit te voeren.                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset     | Exacte kommagescheiden lanelijst; slaat cleanup-smoke over zodat agents één mislukte lane kunnen reproduceren. |

Een lane die zwaarder is dan zijn effectieve limiet kan nog steeds starten vanuit een lege pool, en draait daarna alleen totdat hij capaciteit vrijgeeft. De lokale aggregate voert preflights voor Docker uit, verwijdert verouderde OpenClaw-E2E-containers, toont actieve-lane-status, bewaart lanetimings voor longest-first-volgorde en stopt standaard met het plannen van nieuwe pooled lanes na de eerste fout.

### Herbruikbare live-/E2E-workflow

De herbruikbare live-/E2E-workflow vraagt `scripts/test-docker-all.mjs --plan-json` welke pakket-, imagekind-, live-image-, lane- en credentialdekking vereist is. `scripts/docker-e2e.mjs` zet dat plan daarna om in GitHub-outputs en samenvattingen. Het script packt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een pakketartefact van de huidige run, of downloadt een pakketartefact uit `package_artifact_run_id`; valideert de tarball-inventaris; bouwt en pusht package-digest-getagde bare/functional GHCR-Docker-E2E-images via Blacksmiths Docker-layer-cache wanneer het plan lanes met geïnstalleerd pakket nodig heeft; en hergebruikt aangeleverde `docker_e2e_bare_image`-/`docker_e2e_functional_image`-inputs of bestaande package-digest-images in plaats van opnieuw te bouwen. Docker-image-pulls worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry-/cachestream snel opnieuw probeert in plaats van het grootste deel van het kritieke CI-pad te verbruiken.

### Releasepad-chunks

Release-Docker-dekking draait kleinere gechunkte jobs met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elke chunk alleen het imagekind pullt dat nodig is en meerdere lanes uitvoert via dezelfde gewogen scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

De huidige release-Docker-chunks zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, en `plugins-runtime-install-a` tot en met `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` en `plugins-integrations` blijven aggregate Plugin-/runtime-aliassen. De lane-alias `install-e2e` blijft de aggregate handmatige rerun-alias voor beide provider-installer-lanes.

OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige releasepaddekking erom vraagt, en behoudt alleen een afzonderlijke `openwebui`-chunk voor OpenWebUI-only-dispatches. Update-lanes voor gebundelde channels proberen één keer opnieuw bij tijdelijke npm-netwerkfouten.

Elke chunk uploadt `.artifacts/docker-tests/` met lane-logs, timings, `summary.json`, `failures.json`, fasetimings, schedulerplan-JSON, slow-lane-tabellen en rerun-commando's per lane. De workflow-input `docker_lanes` draait geselecteerde lanes tegen de voorbereide images in plaats van de chunkjobs, waardoor debugging van mislukte lanes begrensd blijft tot één gerichte Docker-job en het pakketartefact voor die run wordt voorbereid, gedownload of hergebruikt; als een geselecteerde lane een live-Docker-lane is, bouwt de gerichte job de live-test-image lokaal voor die rerun. Gegenereerde GitHub-rerun-commando's per lane bevatten `package_artifact_run_id`, `package_artifact_name` en voorbereide image-inputs wanneer die waarden bestaan, zodat een mislukte lane exact het pakket en de images uit de mislukte run kan hergebruiken.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

De geplande live-/E2E-workflow draait dagelijks de volledige releasepad-Docker-suite.

## Plugin-prerelease

`Plugin Prerelease` is duurdere product-/pakketdekking, dus het is een afzonderlijke workflow die wordt gedispatcht door `Full Release Validation` of door een expliciete operator. Normale pull requests, `main`-pushes en zelfstandige handmatige CI-dispatches houden die suite uitgeschakeld. De workflow balanceert gebundelde Plugin-tests over acht extensieworkers; die extensieshardjobs draaien maximaal twee Plugin-configgroepen tegelijk met één Vitest-worker per groep en een grotere Node-heap, zodat importzware Plugin-batches geen extra CI-jobs creëren. Het release-only Docker-prereleasepad batched gerichte Docker-lanes in kleine groepen om te voorkomen dat tientallen runners worden gereserveerd voor jobs van één tot drie minuten.

## QA Lab

QA Lab heeft toegewezen CI-lanes buiten de hoofdworkflow met slimme scope. Agentic parity is genest onder de brede QA- en releaseharnassen, niet als zelfstandige PR-workflow. Gebruik `Full Release Validation` met `rerun_group=qa-parity` wanneer parity moet meelopen met een brede validatierun.

- De workflow `QA-Lab - All Lanes` draait nachtelijk op `main` en bij handmatige dispatch; hij waaiert de mock-parity-lane, live Matrix-lane en live Telegram- en Discord-lanes uit als parallelle jobs. Live-jobs gebruiken de omgeving `qa-live-shared`, en Telegram/Discord gebruiken Convex-leases.

Releasechecks draaien Matrix- en Telegram-live-transportlanes met de deterministische mockprovider en mock-gekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het channelcontract geïsoleerd is van live-modellatentie en normale provider-Plugin-startup. De live-transport-Gateway schakelt geheugenzoekopdrachten uit omdat QA-parity geheugengedrag afzonderlijk dekt; providerconnectiviteit wordt gedekt door de afzonderlijke live-model-, native-provider- en Docker-provider-suites.

Matrix gebruikt `--profile fast` voor geplande en releasegates, en voegt `--fail-fast` alleen toe wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaard en handmatige workflowinput blijven `all`; handmatige `matrix_profile=all`-dispatch shardt volledige Matrix-dekking altijd in jobs voor `transport`, `media`, `e2ee-smoke`, `e2ee-deep` en `e2ee-cli`.

`OpenClaw Release Checks` draait ook de releasekritieke QA Lab-lanes vóór releasegoedkeuring; de QA-parity-gate draait de candidate- en baseline-packs als parallelle lanejobs, en downloadt daarna beide artefacten in een kleine rapportjob voor de uiteindelijke parity-vergelijking.

Volg voor normale PR's scoped CI-/checkbewijs in plaats van parity als vereiste status te behandelen.

## CodeQL

De `CodeQL`-workflow is bewust een smalle beveiligingsscanner voor de eerste controle, niet de volledige repository-sweep. Dagelijkse, handmatige en niet-concept pull request-guard-runs scannen Actions-workflowcode plus de JavaScript/TypeScript-oppervlakken met het hoogste risico, met beveiligingsquery's met hoge betrouwbaarheid die zijn gefilterd op hoge/kritieke `security-severity`.

De pull request-guard blijft licht: hij start alleen voor wijzigingen onder `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` of `src`, en voert dezelfde beveiligingsmatrix met hoge betrouwbaarheid uit als de geplande workflow. Android en macOS CodeQL blijven buiten de standaardinstellingen voor PR's.

### Beveiligingscategorieën

| Categorie                                         | Oppervlak                                                                                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron en gateway-baseline                                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | Core-kanaalimplementatiecontracten plus de kanaal-Plugin-runtime, gateway, Plugin SDK, secrets, audit-aanraakpunten                |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP-parsing, netwerkguard, web-fetch en SSRF-beleidsoppervlakken van de Plugin SDK                                      |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-servers, procesuitvoeringshelpers, uitgaande aflevering en agent-tooluitvoeringspoorten                                        |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-installatie, loader, manifest, registry, package-manager-installatie, source-loading en vertrouwensoppervlakken van het Plugin SDK-packagecontract |

### Platformspecifieke beveiligingsshards

- `CodeQL Android Critical Security` — geplande Android-beveiligingsshard. Bouwt de Android-app handmatig voor CodeQL op de kleinste Blacksmith Linux-runner die door workflow-sanity wordt geaccepteerd. Uploadt onder `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — wekelijkse/handmatige macOS-beveiligingsshard. Bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert dependency-buildresultaten uit de geüploade SARIF en uploadt onder `/codeql-critical-security/macos`. Buiten de dagelijkse standaardinstellingen gehouden omdat de macOS-build de runtime domineert, zelfs wanneer hij schoon is.

### Categorieën voor kritieke kwaliteit

`CodeQL Critical Quality` is de bijbehorende niet-beveiligingsshard. Deze voert alleen JavaScript/TypeScript-kwaliteitsquery's met fout-severity en zonder beveiligingsfocus uit over smalle oppervlakken met hoge waarde op de kleinere Blacksmith Linux-runner. De pull request-guard is bewust kleiner dan het geplande profiel: niet-concept PR's voeren alleen de bijbehorende `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` en `plugin-sdk-reply-runtime`-shards uit voor wijzigingen in agent-command/model/tool-uitvoering en reply-dispatchcode, configschema/migratie/IO-code, auth/secrets/sandbox/beveiligingscode, core-kanaal en meegeleverde kanaal-Plugin-runtime, Gateway-protocol/servermethode, memory-runtime/SDK-glue, MCP/proces/uitgaande aflevering, provider-runtime/modelcatalogus, sessiediagnostiek/afleveringswachtrijen, Plugin-loader, Plugin SDK/packagecontract of Plugin SDK-reply-runtime. CodeQL-configuratie- en kwaliteitsworkflowwijzigingen voeren alle twaalf PR-kwaliteitsshards uit.

Handmatige dispatch accepteert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

De smalle profielen zijn onderwijs-/iteratiehooks om één kwaliteitsshard geïsoleerd uit te voeren.

| Categorie                                               | Oppervlak                                                                                                                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secrets, sandbox, cron en code voor de Gateway-beveiligingsgrens                                                                                              |
| `/codeql-critical-quality/config-boundary`              | Configschema-, migratie-, normalisatie- en IO-contracten                                                                                                           |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-protocolschema's en servermethodecontracten                                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementatiecontracten voor core-kanaal en meegeleverde kanaal-Plugin                                                                                             |
| `/codeql-critical-quality/agent-runtime-boundary`       | Command-uitvoering, model/provider-dispatch, auto-reply-dispatch en wachtrijen, en ACP control-plane-runtimecontracten                                             |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-servers en tool-bridges, proces-supervisionhelpers en contracten voor uitgaande aflevering                                                                      |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory-host-SDK, memory-runtimefacades, memory-Plugin SDK-aliassen, memory-runtimeactivatieglue en memory-doctorcommands                                           |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internals van reply-wachtrijen, sessieafleveringswachtrijen, helpers voor uitgaande sessiebinding/aflevering, oppervlakken voor diagnostische events/logbundels en sessie-doctor-CLI-contracten |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Inbound reply-dispatch van Plugin SDK, reply-payload-/chunking-/runtimehelpers, kanaal-replyopties, afleveringswachtrijen en helpers voor sessie-/threadbinding     |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisatie van modelcatalogus, provider-auth en discovery, provider-runtimeregistratie, providerstandaarden/catalogi en web/search/fetch/embedding-registries    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI-bootstrap, lokale persistentie, Gateway-controlflows en Task-control-plane-runtimecontracten                                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web-fetch/search, media-IO, media-understanding, image-generation en media-generation-runtimecontracten                                                        |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, registry-, public-surface- en Plugin SDK-entrypointcontracten                                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Gepubliceerde package-side Plugin SDK-source en helperfuncties voor pluginpackagecontracten                                                                         |

Kwaliteit blijft gescheiden van beveiliging zodat kwaliteitsbevindingen kunnen worden gepland, gemeten, uitgeschakeld of uitgebreid zonder het beveiligingssignaal te vertroebelen. Swift-, Python- en meegeleverde-Plugin-CodeQL-uitbreiding moet pas weer worden toegevoegd als afgebakend of geshard vervolgwerk nadat de smalle profielen stabiele runtime en stabiel signaal hebben.

## Onderhoudsworkflows

### Docs Agent

De `Docs Agent`-workflow is een eventgestuurde Codex-onderhoudsbaan om bestaande docs afgestemd te houden op recent gelande wijzigingen. Er is geen puur schema: een succesvolle niet-bot push-CI-run op `main` kan hem triggeren, en handmatige dispatch kan hem direct uitvoeren. Workflow-run-invocations worden overgeslagen wanneer `main` is verdergegaan of wanneer er in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is gemaakt. Wanneer hij draait, bekijkt hij het commitbereik van de vorige niet-overgeslagen Docs Agent-source-SHA tot de huidige `main`, zodat één uurlijkse run alle main-wijzigingen kan dekken die sinds de laatste docs-pass zijn verzameld.

### Test Performance Agent

De `Test Performance Agent`-workflow is een eventgestuurde Codex-onderhoudsbaan voor trage tests. Er is geen puur schema: een succesvolle niet-bot push-CI-run op `main` kan hem triggeren, maar hij wordt overgeslagen als er die UTC-dag al een andere workflow-run-invocation heeft gedraaid of draait. Handmatige dispatch omzeilt die dagelijkse activiteitspoort. De baan bouwt een full-suite gegroepeerd Vitest-performancerapport, laat Codex alleen kleine testperformancefixes uitvoeren die coverage behouden in plaats van brede refactors, voert daarna het full-suite-rapport opnieuw uit en wijst wijzigingen af die het aantal passerende baseline-tests verlagen. Als de baseline falende tests heeft, mag Codex alleen duidelijke failures fixen en moet het full-suite-rapport na de agent slagen voordat er iets wordt gecommit. Wanneer `main` verdergaat voordat de bot-push landt, rebased de baan de gevalideerde patch, voert `pnpm check:changed` opnieuw uit en probeert de push opnieuw; conflicterende verouderde patches worden overgeslagen. Hij gebruikt GitHub-hosted Ubuntu zodat de Codex-action dezelfde drop-sudo-veiligheidshouding kan behouden als de docs-agent.

### Dubbele PR's na merge

De `Duplicate PRs After Merge`-workflow is een handmatige maintainer-workflow voor duplicate cleanup na landing. Hij staat standaard op dry-run en sluit alleen expliciet vermelde PR's wanneer `apply=true`. Voordat GitHub wordt gewijzigd, verifieert hij dat de gelande PR is gemerged en dat elke duplicate ofwel een gedeeld gerefereerd issue heeft, of overlappende gewijzigde hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale checkpoorten en changed-routing

Lokale changed-lane-logica staat in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale checkpoort is strenger over architectuurgrenzen dan de brede CI-platformscope:

- core-productiewijzigingen voeren core prod- en core test-typecheck plus core lint/guards uit;
- alleen-core-testwijzigingen voeren alleen core test-typecheck plus core lint uit;
- extensieproductiewijzigingen voeren extensie prod- en extensie test-typecheck plus extensie lint uit;
- alleen-extensie-testwijzigingen voeren extensie test-typecheck plus extensie lint uit;
- publieke Plugin SDK- of plugin-contractwijzigingen breiden uit naar extensietypecheck omdat extensies afhankelijk zijn van die core-contracten (Vitest-extensiesweeps blijven expliciet testwerk);
- version bumps die alleen release-metadata raken, voeren gerichte versie-/config-/root-dependency-checks uit;
- onbekende root-/configwijzigingen falen veilig naar alle checklanes.

Lokale changed-test-routing staat in `scripts/test-projects.test-support.mjs` en is bewust goedkoper dan `check:changed`: directe testbewerkingen voeren zichzelf uit, sourcebewerkingen geven de voorkeur aan expliciete mappings, daarna sibling-tests en import-graph-dependents. Gedeelde group-room-afleveringsconfig is een van de expliciete mappings: wijzigingen aan de group visible-reply-config, source-reply-afleveringsmodus of de message-tool-systemprompt lopen via de core reply-tests plus Discord- en Slack-afleveringsregressies, zodat een gedeelde standaardwijziging faalt voor de eerste PR-push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging zo harness-breed is dat de goedkope gemapte set geen betrouwbare proxy is.

## Testbox-validatie

Voer Testbox uit vanuit de repo-root en geef voor breed bewijs de voorkeur aan een nieuw opgewarmde box. Voordat je een trage gate besteedt aan een box die is hergebruikt, verlopen is of net een onverwacht grote sync heeft gerapporteerd, voer je eerst `pnpm testbox:sanity` uit binnen de box.

De sanity-check faalt snel wanneer vereiste root-bestanden zoals `pnpm-lock.yaml` zijn verdwenen of wanneer `git status --short` minstens 200 gevolgde verwijderingen toont. Dat betekent meestal dat de externe sync-status geen betrouwbare kopie van de PR is; stop die box en warm een nieuwe op in plaats van de producttestfout te debuggen. Voor opzettelijke PR’s met veel verwijderingen stel je `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor die sanity-run.

`pnpm testbox:run` beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de sync-fase blijft zonder output na de sync. Stel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` in om die guard uit te schakelen, of gebruik een grotere millisecondewaarde voor ongewoon grote lokale diffs.

Crabbox is de repo-eigen remote-box-wrapper voor maintainer-Linux-bewijs. Gebruik het wanneer een check te breed is voor een lokale edit-loop, wanneer CI-pariteit belangrijk is, of wanneer het bewijs secrets, Docker, package-lanes, herbruikbare boxes of externe logs nodig heeft. De normale OpenClaw-backend is `blacksmith-testbox`; eigen AWS/Hetzner-capaciteit is een fallback bij Blacksmith-storingen, quota-problemen of expliciete tests met eigen capaciteit.

Controleer de wrapper vanuit de repo-root vóór een eerste run:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

De repo-wrapper weigert een verouderde Crabbox-binary die `blacksmith-testbox` niet adverteert. Geef de provider expliciet door, ook al heeft `.crabbox.yaml` defaults voor eigen cloud.

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

Lees de uiteindelijke JSON-samenvatting. De nuttige velden zijn `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` en `totalMs`. Eenmalige door Blacksmith ondersteunde Crabbox-runs zouden de Testbox automatisch moeten stoppen; als een run wordt onderbroken of cleanup onduidelijk is, inspecteer dan live boxes en stop alleen de boxes die je hebt aangemaakt:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Gebruik hergebruik alleen wanneer je bewust meerdere commando’s op dezelfde gehydrateerde box nodig hebt:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Als Crabbox de kapotte laag is maar Blacksmith zelf werkt, gebruik dan direct Blacksmith als smalle fallback:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Escaleren naar eigen Crabbox-capaciteit doe je alleen wanneer Blacksmith down is, door quota wordt beperkt, de benodigde omgeving mist, of eigen capaciteit expliciet het doel is:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` beheert de defaults voor provider, sync en GitHub Actions-hydratatie voor eigen-cloud-lanes. Het sluit lokale `.git` uit zodat de gehydrateerde Actions-checkout zijn eigen externe Git-metadata behoudt in plaats van maintainer-lokale remotes en object stores te synchroniseren, en het sluit lokale runtime-/build-artifacts uit die nooit mogen worden overgedragen. `.github/workflows/crabbox-hydrate.yml` beheert checkout, Node/pnpm-setup, `origin/main`-fetch en de niet-secret environment-overdracht voor eigen-cloud-commando’s met `crabbox run --id <cbx_id>`.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Ontwikkelingskanalen](/nl/install/development-channels)
