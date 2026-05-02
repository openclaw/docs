---
read_when:
    - Je moet begrijpen waarom een CI-taak wel of niet is uitgevoerd
    - Je debugt een mislukte GitHub Actions-controle
    - Je coördineert een uitvoering of heruitvoering van releasevalidatie.
    - Je wijzigt de ClawSweeper-routering of het doorsturen van GitHub-activiteit
summary: CI-taakgrafiek, scopecontroles, release-overkoepelingen en lokale commando-equivalenten
title: CI-pijplijn
x-i18n:
    generated_at: "2026-05-02T22:17:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8033b928b26adfa340200ea69fd63d339a6e65c21659b8119a68b23b8b16016
    source_path: ci.md
    workflow: 16
---

OpenClaw CI draait bij elke push naar `main` en elke pull-aanvraag. De `preflight`-taak classificeert de diff en schakelt dure banen uit wanneer alleen niet-gerelateerde gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen smart scoping bewust en waaieren de volledige graaf uit voor releasekandidaten en brede validatie. Android-banen blijven opt-in via `include_android`. Release-only Plugin-dekking staat in de afzonderlijke [`Plugin Prerelease`](#plugin-prerelease)-workflow en draait alleen vanuit [`Full Release Validation`](#full-release-validation) of een expliciete handmatige dispatch.

## Pipeline-overzicht

| Taak                             | Doel                                                                                                                | Wanneer deze draait                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Detecteert docs-only wijzigingen, gewijzigde scopes, gewijzigde extensions en bouwt het CI-manifest                 | Altijd bij niet-conceptpushes en PR's |
| `security-scm-fast`              | Detectie van privésleutels en workflow-audit via `zizmor`                                                          | Altijd bij niet-conceptpushes en PR's |
| `security-dependency-audit`      | Productie-lockfile-audit zonder afhankelijkheden tegen npm-adviezen                                                 | Altijd bij niet-conceptpushes en PR's |
| `security-fast`                  | Vereiste aggregatie voor de snelle beveiligingstaken                                                                | Altijd bij niet-conceptpushes en PR's |
| `check-dependencies`             | Productie-Knip-doorgang alleen voor afhankelijkheden plus de allowlist-bewaking voor ongebruikte bestanden          | Node-relevante wijzigingen          |
| `build-artifacts`                | Bouwt `dist/`, Control UI, controles voor gebouwde artefacten en herbruikbare downstream-artefacten                 | Node-relevante wijzigingen          |
| `checks-fast-core`               | Snelle Linux-correctheidsbanen zoals gebundelde/plugin-contract/protocol-controles                                  | Node-relevante wijzigingen          |
| `checks-fast-contracts-channels` | Geshaarde kanaalcontractcontroles met een stabiel geaggregeerd controleresultaat                                    | Node-relevante wijzigingen          |
| `checks-node-core-test`          | Core Node-testshards, met uitzondering van kanaal-, gebundelde, contract- en extension-banen                        | Node-relevante wijzigingen          |
| `check`                          | Geshaarde equivalent van de belangrijkste lokale gate: productietypes, lint, bewakingen, testtypes en strikte smoke | Node-relevante wijzigingen          |
| `check-additional`               | Architectuur-, boundary-, prompt-snapshotdrift-, extension-surface-, package-boundary- en gateway-watch-shards      | Node-relevante wijzigingen          |
| `build-smoke`                    | Smoke-tests voor de gebouwde CLI en startup-memory-smoke                                                            | Node-relevante wijzigingen          |
| `checks`                         | Verificateur voor kanaaltests van gebouwde artefacten                                                               | Node-relevante wijzigingen          |
| `checks-node-compat-node22`      | Node 22-compatibiliteitsbouw en smoke-baan                                                                          | Handmatige CI-dispatch voor releases |
| `check-docs`                     | Docs-formattering, lint en controles op kapotte links                                                               | Docs gewijzigd                      |
| `skills-python`                  | Ruff + pytest voor Python-ondersteunde Skills                                                                       | Python-skill-relevante wijzigingen  |
| `checks-windows`                 | Windows-specifieke proces-/padtests plus regressies voor gedeelde runtime-importspecificaties                       | Windows-relevante wijzigingen       |
| `macos-node`                     | macOS TypeScript-testbaan met de gedeelde gebouwde artefacten                                                       | macOS-relevante wijzigingen         |
| `macos-swift`                    | Swift-lint, build en tests voor de macOS-app                                                                        | macOS-relevante wijzigingen         |
| `android`                        | Android-unittests voor beide flavors plus één debug-APK-build                                                       | Android-relevante wijzigingen       |
| `test-performance-agent`         | Dagelijkse Codex-optimalisatie van trage tests na vertrouwde activiteit                                             | Succesvolle hoofd-CI of handmatige dispatch |
| `openclaw-performance`           | Dagelijkse/op-aanvraag Kova-runtimeprestatierapporten met mock-provider-, deep-profile- en GPT 5.4-livebanen        | Geplande en handmatige dispatch     |

## Fail-fast-volgorde

1. `preflight` bepaalt welke banen überhaupt bestaan. De `docs-scope`- en `changed-scope`-logica zijn stappen binnen deze taak, geen zelfstandige taken.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` en `skills-python` falen snel zonder te wachten op de zwaardere artefact- en platformmatrixtaken.
3. `build-artifacts` overlapt met de snelle Linux-banen zodat downstream-consumenten kunnen starten zodra de gedeelde build gereed is.
4. Zwaardere platform- en runtimebanen waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` en `android`.

GitHub kan vervangen taken als `cancelled` markeren wanneer een nieuwere push op dezelfde PR of `main`-ref landt. Behandel dat als CI-ruis, tenzij de nieuwste run voor dezelfde ref ook faalt. Geaggregeerde shard-controles gebruiken `!cancelled() && always()` zodat ze nog steeds normale shard-fouten rapporteren, maar niet in de wachtrij komen nadat de hele workflow al is vervangen. De automatische CI-concurrency-sleutel is geversioneerd (`CI-v7-*`), zodat een GitHub-side zombie in een oude wachtrijgroep nieuwere main-runs niet onbeperkt kan blokkeren. Handmatige volledige-suite-runs gebruiken `CI-manual-v1-*` en annuleren lopende runs niet.

## Scope en routering

Scope-logica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unittests in `src/scripts/ci-changed-scope.test.ts`. Handmatige dispatch slaat changed-scope-detectie over en laat het preflight-manifest zich gedragen alsof elk scoped gebied is gewijzigd.

- **CI-workflowbewerkingen** valideren de Node CI-graaf plus workflow-linting, maar forceren op zichzelf geen native Windows-, Android- of macOS-builds; die platformbanen blijven scoped op platformbronwijzigingen.
- **Alleen-CI-routeringsbewerkingen, geselecteerde goedkope core-testfixturebewerkingen en smalle plugin-contract-helper-/test-routeringsbewerkingen** gebruiken een snel Node-only manifestpad: `preflight`, beveiliging en één `checks-fast-core`-taak. Dat pad slaat buildartefacten, Node 22-compatibiliteit, kanaalcontracten, volledige core-shards, gebundelde-plugin-shards en aanvullende bewakingsmatrices over wanneer de wijziging beperkt is tot de routerings- of helperoppervlakken die de snelle taak direct oefent.
- **Windows Node-controles** zijn scoped op Windows-specifieke proces-/padwrappers, npm/pnpm/UI-runnerhelpers, package-managerconfiguratie en de CI-workflowoppervlakken die die baan uitvoeren; niet-gerelateerde bron-, plugin-, install-smoke- en test-only wijzigingen blijven op de Linux Node-banen.

De traagste Node-testfamilies worden gesplitst of gebalanceerd zodat elke taak klein blijft zonder runners te veel te reserveren: kanaalcontracten draaien als drie gewogen shards, kleine core-unitbanen worden gekoppeld, auto-reply draait als vier gebalanceerde workers (waarbij de reply-subtree is gesplitst in agent-runner-, dispatch- en commands/state-routing-shards) en agentic gateway-/pluginconfiguraties worden verspreid over de bestaande source-only agentic Node-taken in plaats van te wachten op gebouwde artefacten. Brede browser-, QA-, media- en diverse plugintests gebruiken hun eigen Vitest-configs in plaats van de gedeelde plugin-catch-all. Include-pattern-shards registreren timingvermeldingen met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een volledige config van een gefilterde shard kan onderscheiden. `check-additional` houdt package-boundary-compile-/canary-werk bij elkaar en scheidt runtime-topologiearchitectuur van Gateway-watch-dekking; de boundary-guard-shard draait zijn kleine onafhankelijke bewakingen gelijktijdig binnen één taak, inclusief `pnpm prompt:snapshots:check` zodat Codex-happy-path-promptdrift wordt vastgepind aan de PR die deze veroorzaakte. Gateway-watch, kanaaltests en de core support-boundary-shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd.

Android CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play-debug-APK. De third-party-flavor heeft geen aparte sourceset of manifest; de unittestsbaan compileert de flavor nog steeds met de SMS/call-log BuildConfig-flags, terwijl een dubbele debug-APK-package-taak bij elke Android-relevante push wordt vermeden.

De `check-dependencies`-shard draait `pnpm deadcode:dependencies` (een productie-Knip-doorgang alleen voor afhankelijkheden, vastgepind op de nieuwste Knip-versie, met pnpm's minimale releaseleeftijd uitgeschakeld voor de `dlx`-installatie) en `pnpm deadcode:unused-files`, die Knips productiebevindingen voor ongebruikte bestanden vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. De ongebruikte-bestandenbewaking faalt wanneer een PR een nieuw niet-beoordeeld ongebruikt bestand toevoegt of een verouderde allowlist-vermelding achterlaat, terwijl opzettelijke dynamische plugin-, gegenereerde, build-, live-test- en package-bridge-oppervlakken behouden blijven die Knip niet statisch kan oplossen.

## ClawSweeper-activiteitsdoorsturing

`.github/workflows/clawsweeper-dispatch.yml` is de doelzijdebrug van OpenClaw-repositoryactiviteit naar ClawSweeper. Deze checkt geen niet-vertrouwde pull-aanvraagcode uit en voert die ook niet uit. De workflow maakt een GitHub App-token vanuit `CLAWSWEEPER_APP_PRIVATE_KEY` en verzendt vervolgens compacte `repository_dispatch`-payloads naar `openclaw/clawsweeper`.

De workflow heeft vier banen:

- `clawsweeper_item` voor exacte beoordelingsverzoeken voor issues en pull-aanvragen;
- `clawsweeper_comment` voor expliciete ClawSweeper-commando's in issue-opmerkingen;
- `clawsweeper_commit_review` voor commit-level beoordelingsverzoeken op `main`-pushes;
- `github_activity` voor algemene GitHub-activiteit die de ClawSweeper-agent kan inspecteren.

De `github_activity`-baan stuurt alleen genormaliseerde metadata door: eventtype, actie, actor, repository, itemnummer, URL, titel, status en korte fragmenten voor opmerkingen of beoordelingen wanneer aanwezig. Deze vermijdt bewust het doorsturen van de volledige Webhook-body. De ontvangende workflow in `openclaw/clawsweeper` is `.github/workflows/github-activity.yml`, die het genormaliseerde event naar de OpenClaw Gateway-hook voor de ClawSweeper-agent post.

Algemene activiteit is observatie, geen standaardbezorging. De ClawSweeper-agent ontvangt het Discord-doel in zijn prompt en mag alleen naar `#clawsweeper` posten wanneer het event verrassend, actiegericht, riskant of operationeel nuttig is. Routinematige opens, bewerkingen, botverloop, dubbele Webhook-ruis en normaal reviewverkeer moeten resulteren in `NO_REPLY`.

Behandel GitHub-titels, opmerkingen, bodies, reviewtekst, branchnamen en commitberichten in dit hele pad als niet-vertrouwde data. Ze zijn input voor samenvatting en triage, geen instructies voor de workflow of agent-runtime.

## Handmatige dispatches

Handmatige CI-dispatches voeren dezelfde jobgrafiek uit als normale CI, maar zetten elke niet-Android scope-lane geforceerd aan: Linux Node-shards, gebundelde-Plugin-shards, kanaalcontracten, Node 22-compatibiliteit, `check`, `check-additional`, build-smoke, docs-controles, Python Skills, Windows, macOS en Control UI-i18n. Losstaande handmatige CI-dispatches voeren alleen Android uit met `include_android=true`; de volledige releaseparaplu schakelt Android in door `include_android=true` door te geven. Statische controles voor Plugin-prerelease, de alleen-voor-release `agentic-plugins`-shard, de volledige batch-sweep voor extensies en Docker-lanes voor Plugin-prerelease zijn uitgesloten van CI. De Docker-prerelease-suite wordt alleen uitgevoerd wanneer `Full Release Validation` de afzonderlijke `Plugin Prerelease`-workflow dispatcht met de release-validatiegate ingeschakeld.

Handmatige runs gebruiken een unieke concurrencygroep, zodat een volledige suite voor een release candidate niet wordt geannuleerd door een andere push- of PR-run op dezelfde ref. Met de optionele `target_ref`-invoer kan een vertrouwde aanroeper die grafiek uitvoeren tegen een branch, tag of volledige commit-SHA, terwijl het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, snelle beveiligingsjobs en aggregaten (`security-scm-fast`, `security-dependency-audit`, `security-fast`), snelle protocol-/contract-/gebundelde controles, gesharde kanaalcontractcontroles, `check`-shards behalve lint, `check-additional`-shards en aggregaten, aggregaatverificateurs voor Node-tests, docs-controles, Python Skills, workflow-sanity, labeler, auto-response; install-smoke-preflight gebruikt ook door GitHub gehoste Ubuntu, zodat de Blacksmith-matrix eerder in de wachtrij kan komen |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lichtere extensieshards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` en `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node-testshards, gebundelde Plugin-testshards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-gevoelig genoeg dat 8 vCPU meer kostte dan het opleverde); install-smoke Docker-builds (32-vCPU-wachtrijtijd kostte meer dan het opleverde)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

`OpenClaw Performance` is de workflow voor product-/runtimeprestaties. Deze wordt dagelijks op `main` uitgevoerd en kan handmatig worden gedispatcht:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

De workflow installeert OCM vanuit een gepinde release en Kova vanuit de gepinde `kova_ref`-invoer, en voert daarna drie lanes uit:

- `mock-provider`: diagnostische Kova-scenario's tegen een lokaal gebouwde runtime met deterministische nep-auth die compatibel is met OpenAI.
- `mock-deep-profile`: CPU-/heap-/traceprofilering voor hotspots bij opstarten, Gateway en agent-turns.
- `live-gpt54`: een echte OpenAI `openai/gpt-5.4` agent-turn, overgeslagen wanneer `OPENAI_API_KEY` niet beschikbaar is.

De mock-provider-lane voert na de Kova-pass ook OpenClaw-native bronprobes uit: Gateway-opstarttiming en geheugen over standaard-, hook- en 50-Plugin-opstartcases; herhaalde mock-OpenAI `channel-chat-baseline` hello-loops; en CLI-opstartcommando's tegen de opgestarte Gateway. De Markdown-samenvatting van de bronprobe staat op `source/index.md` in de rapportbundel, met ruwe JSON ernaast.

Elke lane uploadt GitHub-artefacten. Wanneer `CLAWGRIT_REPORTS_TOKEN` is geconfigureerd, commit de workflow ook `report.json`, `report.md`, bundels, `index.md` en bronprobe-artefacten naar `openclaw/clawgrit-reports` onder `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. De huidige branch-pointer wordt geschreven als `openclaw-performance/<ref>/latest-<lane>.json`.

## Volledige Release-validatie

`Full Release Validation` is de handmatige parapluworkflow voor "alles uitvoeren vóór de release". Deze accepteert een branch, tag of volledige commit-SHA, dispatcht de handmatige `CI`-workflow met dat doel, dispatcht `Plugin Prerelease` voor alleen-voor-release Plugin-/pakket-/statische-/Docker-bewijzen, en dispatcht `OpenClaw Release Checks` voor install-smoke, pakketacceptatie, Docker-releasepad-suites, live/E2E, OpenWebUI, QA Lab-pariteit, Matrix en Telegram-lanes. Met `rerun_group=all` en `release_profile=full` voert deze ook `NPM Telegram Beta E2E` uit tegen het `release-package-under-test`-artefact uit release checks. Geef na publicatie `npm_telegram_package_spec` door om dezelfde Telegram-pakketlane opnieuw uit te voeren tegen het gepubliceerde npm-pakket.

Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
fasematrix, exacte workflow-jobnamen, profielverschillen, artefacten en
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

Gebruik voor bewijs van een gepinde commit op een snel bewegende branch de helper in plaats van
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-workflow-dispatch-refs moeten branches of tags zijn, geen ruwe commit-SHA's. De
helper pusht een tijdelijke `release-ci/<sha>-...`-branch op de doel-SHA,
dispatcht `Full Release Validation` vanuit die gepinde ref, verifieert dat elke child-
workflow `headSha` overeenkomt met het doel, en verwijdert de tijdelijke branch wanneer de
run is voltooid. De parapluverificateur faalt ook als een child-workflow op een
andere SHA is uitgevoerd.

`release_profile` bepaalt de live/provider-breedte die aan release checks wordt doorgegeven. De
handmatige releaseworkflows gebruiken standaard `stable`; gebruik `full` alleen wanneer je
bewust de brede adviserende provider-/mediamatrix wilt.

- `minimum` behoudt de snelste OpenAI-/core-releasekritieke lanes.
- `stable` voegt de stabiele provider-/backendset toe.
- `full` voert de brede adviserende provider-/mediamatrix uit.

De paraplu registreert de gedispatchte child-run-id's, en de laatste `Verify full validation`-job controleert de huidige conclusies van child-runs opnieuw en voegt tabellen met de traagste jobs toe voor elke child-run. Als een child-workflow opnieuw wordt uitgevoerd en groen wordt, voer dan alleen de parent-verificateurjob opnieuw uit om het parapluresultaat en de timingsamenvatting te vernieuwen.

Voor herstel accepteren zowel `Full Release Validation` als `OpenClaw Release Checks` `rerun_group`. Gebruik `all` voor een releasekandidaat, `ci` voor alleen het normale volledige CI-child, `plugin-prerelease` voor alleen het plugin-prerelease-child, `release-checks` voor elk release-child, of een smallere groep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, of `npm-telegram` op de overkoepelende workflow. Zo blijft het opnieuw uitvoeren van een mislukte releasebox begrensd na een gerichte fix.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde ref één keer om te zetten naar een `release-package-under-test`-tarball, en geeft dat artifact daarna door aan zowel de live/E2E Docker-workflow voor het releasepad als de shard voor package-acceptatie. Zo blijven de packagebytes consistent tussen releaseboxen en wordt voorkomen dat dezelfde kandidaat opnieuw wordt verpakt in meerdere child-jobs.

Dubbele `Full Release Validation`-runs voor `ref=main` en `rerun_group=all`
vervangen de oudere overkoepelende workflow. De parent-monitor annuleert elke child-workflow die
al is gestart wanneer de parent wordt geannuleerd, zodat nieuwere main-validatie
niet achter een verouderde twee uur durende release-check-run blijft hangen. Validatie van releasebranches/tags
en gerichte rerun-groepen houden `cancel-in-progress: false`.

## Live- en E2E-shards

De release-live/E2E-child behoudt brede native `pnpm test:live`-dekking, maar voert die uit als benoemde shards via `scripts/test-live-shard.mjs` in plaats van als één seriële job:

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
- gesplitste media-audio/video-shards en provider-gefilterde muziekshards

Zo blijft dezelfde bestandsdekking behouden terwijl trage live-providerfouten eenvoudiger opnieuw kunnen worden uitgevoerd en gediagnosticeerd. De geaggregeerde shardnamen `native-live-extensions-o-z`, `native-live-extensions-media` en `native-live-extensions-media-music` blijven geldig voor handmatige eenmalige reruns.

De native live-mediashards draaien in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de workflow `Live Media Runner Image`. Die image installeert `ffmpeg` en `ffprobe` vooraf; mediajobs verifiëren alleen de binaries vóór de setup. Houd Docker-ondersteunde live-suites op normale Blacksmith-runners — containerjobs zijn niet de juiste plaats om geneste Docker-tests te starten.

Docker-ondersteunde live model/backend-shards gebruiken een afzonderlijke gedeelde `ghcr.io/openclaw/openclaw-live-test:<sha>`-image per geselecteerde commit. De live-releaseworkflow bouwt en pusht die image één keer, waarna de Docker-live-model-, provider-gesharde Gateway-, CLI-backend-, ACP-bind- en Codex-harnessshards draaien met `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker-shards hebben expliciete timeout-limieten op scriptniveau onder de workflow-jobtimeout, zodat een vastgelopen container of cleanup-pad snel faalt in plaats van het volledige release-checkbudget te verbruiken. Als die shards het volledige source-Dockerdoel onafhankelijk opnieuw bouwen, is de releaserun verkeerd geconfigureerd en verspilt die wandkloktijd aan dubbele imagebuilds.

## Package-acceptatie

Gebruik `Package Acceptance` wanneer de vraag is: "werkt dit installeerbare OpenClaw-package als product?" Dit verschilt van normale CI: normale CI valideert de source-tree, terwijl package-acceptatie één tarball valideert via dezelfde Docker E2E-harness die gebruikers na installatie of update uitvoeren.

### Jobs

1. `resolve_package` checkt `workflow_ref` uit, bepaalt één packagekandidaat, schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het artifact `package-under-test`, en drukt de bron, workflow-ref, package-ref, versie, SHA-256 en het profiel af in de GitHub-stapsamenvatting.
2. `docker_acceptance` roept `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt dat artifact, valideert de tarball-inventaris, bereidt package-digest Docker-images voor wanneer nodig, en voert de geselecteerde Docker-lanes uit tegen dat package in plaats van de workflow-checkout te verpakken. Wanneer een profiel meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het package en de gedeelde images één keer voor en waaiert die lanes daarna uit als parallelle gerichte Docker-jobs met unieke artifacts.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Dit draait wanneer `telegram_mode` niet `none` is en installeert hetzelfde `package-under-test`-artifact wanneer Package Acceptance er één heeft bepaald; zelfstandige Telegram-dispatch kan nog steeds een gepubliceerde npm-spec installeren.
4. `summary` laat de workflow falen als packagebepaling, Docker-acceptatie of de optionele Telegram-lane is mislukt.

### Kandidaatbronnen

- `source=npm` accepteert alleen `openclaw@alpha`, `openclaw@beta`, `openclaw@latest`, of een exacte OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor acceptatie van gepubliceerde prerelease/stabiele versies.
- `source=ref` verpakt een vertrouwde `package_ref`-branch, tag of volledige commit-SHA. De resolver haalt OpenClaw-branches/tags op, verifieert dat de geselecteerde commit bereikbaar is vanuit de repository-branchgeschiedenis of een releasetag, installeert dependencies in een detached worktree en verpakt die met `scripts/package-openclaw-for-docker.mjs`.
- `source=url` downloadt een HTTPS `.tgz`; `package_sha256` is verplicht.
- `source=artifact` downloadt één `.tgz` uit `artifact_run_id` en `artifact_name`; `package_sha256` is optioneel maar moet worden opgegeven voor extern gedeelde artifacts.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde workflow-/harnesscode die de test uitvoert. `package_ref` is de source-commit die wordt verpakt wanneer `source=ref`. Hierdoor kan de huidige testharness oudere vertrouwde source-commits valideren zonder oude workflowlogica uit te voeren.

### Suiteprofielen

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — volledige Docker-releasepadchunks met OpenWebUI
- `custom` — exacte `docker_lanes`; verplicht wanneer `suite_profile=custom`

Het `package`-profiel gebruikt offline Plugin-dekking zodat validatie van gepubliceerde packages niet afhankelijk is van live beschikbaarheid van ClawHub. De optionele Telegram-lane hergebruikt het `package-under-test`-artifact in `NPM Telegram Beta E2E`, waarbij het pad met de gepubliceerde npm-spec behouden blijft voor zelfstandige dispatches.

Voor het specifieke beleid voor update- en plugintests, inclusief lokale opdrachten,
Docker-lanes, Package Acceptance-inputs, releasestandaarden en fouttriage,
zie [Updates en plugins testen](/nl/help/testing-updates-plugins).

Releasechecks roepen Package Acceptance aan met `source=artifact`, het voorbereide releasepackage-artifact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` en `telegram_mode=mock-openai`. Zo blijven packagemigratie, update, cleanup van verouderde plugindependencies, herstel van geconfigureerde plugininstallatie, offline Plugin, plugin-update en Telegram-bewijs op dezelfde bepaalde packagetarball. Stel `package_acceptance_package_spec` in op Full Release Validation of OpenClaw Release Checks om diezelfde matrix uit te voeren tegen een verzonden npm-package in plaats van het uit de SHA gebouwde artifact. Cross-OS-releasechecks dekken nog steeds OS-specifieke onboarding, installer- en platformgedrag; productvalidatie voor packages/updates moet beginnen met Package Acceptance. De Docker-lane `published-upgrade-survivor` valideert één gepubliceerde packagebaseline per run. In Package Acceptance is de bepaalde `package-under-test`-tarball altijd de kandidaat en selecteert `published_upgrade_survivor_baseline` de terugvalbaseline uit gepubliceerde packages, standaard `openclaw@latest`; rerun-opdrachten voor mislukte lanes behouden die baseline. Stel `published_upgrade_survivor_baselines=all-since-2026.4.23` in om Full Release CI uit te breiden over elke stabiele npm-release van `2026.4.23` tot en met `latest`; `release-history` blijft beschikbaar voor handmatige bredere sampling met het oudere pre-date-anker. Stel `published_upgrade_survivor_scenarios=reported-issues` in om dezelfde baselines uit te breiden over issue-vormige fixtures voor Feishu-configuratie, behouden bootstrap-/personabestanden, geconfigureerde OpenClaw-plugininstallaties, tilde-logpaden en verouderde roots voor legacy-plugindependencies. De afzonderlijke workflow `Update Migration` gebruikt de Docker-lane `update-migration` met `all-since-2026.4.23` en `plugin-deps-cleanup` wanneer de vraag exhaustieve cleanup van gepubliceerde updates is, niet de normale breedte van Full Release CI. Lokale geaggregeerde runs kunnen exacte package-specs doorgeven met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, één lane behouden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` zoals `openclaw@2026.4.15`, of `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` instellen voor de scenariomatrix. De gepubliceerde lane configureert de baseline met een ingebakken recept voor de opdracht `openclaw config set`, registreert receptstappen in `summary.json` en test `/healthz`, `/readyz` plus RPC-status na het starten van Gateway. De verse Windows packaged- en installer-lanes verifiëren ook dat een geïnstalleerd package een browser-control-override kan importeren vanuit een raw absoluut Windows-pad. De OpenAI cross-OS agent-turn-smoke gebruikt standaard `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer dat is ingesteld, anders `openai/gpt-5.4`, zodat het installatie- en Gateway-bewijs op een GPT-5-testmodel blijft terwijl GPT-4.x-standaarden worden vermeden.

### Legacy-compatibiliteitsvensters

Package Acceptance heeft begrensde legacy-compatibiliteitsvensters voor al gepubliceerde packages. Packages tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen het compatibiliteitspad gebruiken:

- bekende private QA-vermeldingen in `dist/postinstall-inventory.json` mogen verwijzen naar bestanden die uit de tarball zijn weggelaten;
- `doctor-switch` mag de subcase voor persistentie van `gateway install --wrapper` overslaan wanneer het package die flag niet exposeert;
- `update-channel-switch` mag ontbrekende `pnpm.patchedDependencies` uit de van tarball afgeleide fake git-fixture snoeien en ontbrekende gepersisteerde `update.channel` loggen;
- plugin-smokes mogen legacy install-record-locaties lezen of ontbrekende persistentie van marketplace-install-records accepteren;
- `plugin-update` mag migratie van configuratiemetadata toestaan terwijl nog steeds wordt vereist dat het install-record en het gedrag zonder herinstallatie ongewijzigd blijven.

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

Begin bij het debuggen van een mislukte pakketacceptatierun met de `resolve_package`-samenvatting om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de `docker_acceptance`-childrun en de Docker-artifacts daarvan: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logs, fasetimings en rerun-opdrachten. Voer bij voorkeur het mislukte pakketprofiel of de exacte Docker-lanes opnieuw uit in plaats van de volledige releasevalidatie opnieuw uit te voeren.

## Installatiesmoke

De afzonderlijke workflow `Install Smoke` hergebruikt hetzelfde scopescript via zijn eigen `preflight`-job. De workflow splitst smoke-dekking op in `run_fast_install_smoke` en `run_full_install_smoke`.

- **Snel pad** draait voor pull requests die Docker-/pakketoppervlakken raken, wijzigingen in gebundelde Plugin-pakketten/-manifesten, of core Plugin-/kanaal-/Gateway-/Plugin SDK-oppervlakken die de Docker-smokejobs uitoefenen. Alleen bronwijzigingen in gebundelde Plugins, test-only-bewerkingen en docs-only-bewerkingen reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image eenmalig, controleert de CLI, voert de agents-delete-shared-workspace CLI-smoke uit, voert de container-gateway-network-e2e uit, verifieert een build-argument voor een gebundelde extensie en draait het begrensde gebundelde-Plugin-Docker-profiel onder een totale opdrachttime-out van 240 seconden (waarbij elke Docker-run van een scenario afzonderlijk wordt begrensd).
- **Volledig pad** behoudt QR-pakketinstallatie en installer-Docker-/updatedekking voor nachtelijke geplande runs, handmatige dispatches, workflow-call-releasechecks en pull requests die echt installer-/pakket-/Docker-oppervlakken raken. In volledige modus bereidt install-smoke één target-SHA GHCR-root-Dockerfile-smoke-image voor of hergebruikt die, en voert daarna QR-pakketinstallatie, root-Dockerfile-/Gateway-smokes, installer-/update-smokes en de snelle gebundelde-Plugin-Docker-E2E uit als afzonderlijke jobs, zodat installerwerk niet hoeft te wachten achter de root-image-smokes.

`main`-pushes (inclusief mergecommits) forceren het volledige pad niet; wanneer changed-scope-logica volledige dekking op een push zou vragen, behoudt de workflow de snelle Docker-smoke en laat de volledige install-smoke over aan nachtelijke of releasevalidatie.

De trage Bun global-install-image-provider-smoke wordt afzonderlijk afgeschermd door `run_bun_global_install_smoke`. Deze draait volgens het nachtelijke schema en vanuit de releasechecks-workflow, en handmatige `Install Smoke`-dispatches kunnen ervoor kiezen deze mee te nemen, maar pull requests en `main`-pushes doen dat niet. QR- en installer-Docker-tests behouden hun eigen installatiegerichte Dockerfiles.

## Lokale Docker E2E

`pnpm test:docker:all` bouwt vooraf één gedeelde live-test-image, pakt OpenClaw eenmaal als npm-tarball en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images:

- een kale Node/Git-runner voor installer-/update-/plugin-dependency-lanes;
- een functionele image die dezelfde tarball in `/app` installeert voor normale functionaliteitslanes.

Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en voert vervolgens lanes uit met `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Afstembare instellingen

| Variabele                              | Standaard | Doel                                                                                          |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Aantal slots in de hoofdpool voor normale lanes.                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Aantal slots in de providergevoelige tail-pool.                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limiet voor gelijktijdige live-lanes zodat providers niet throttlen.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limiet voor gelijktijdige npm-installatielanes.                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limiet voor gelijktijdige multi-service-lanes.                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Spreiding tussen lane-starts om Docker daemon-create-stormen te vermijden; stel in op `0` voor geen spreiding. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Fallbacktime-out per lane (120 minuten); geselecteerde live-/tail-lanes gebruiken strakkere limieten. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | niet ingesteld | `1` print het schedulerplan zonder lanes uit te voeren.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | niet ingesteld | Door komma's gescheiden exacte lanelijst; slaat cleanup-smoke over zodat agents één mislukte lane kunnen reproduceren. |

Een lane die zwaarder is dan zijn effectieve limiet kan nog steeds vanuit een lege pool starten en draait daarna alleen totdat hij capaciteit vrijgeeft. De lokale aggregate voert Docker-preflights uit, verwijdert oude OpenClaw E2E-containers, geeft actieve-lanestatus weer, bewaart lanetimings voor longest-first-volgorde en stopt standaard met het inplannen van nieuwe pooled lanes na de eerste fout.

### Herbruikbare live/E2E-workflow

De herbruikbare live/E2E-workflow vraagt `scripts/test-docker-all.mjs --plan-json` welke pakket-, imagetype-, live-image-, lane- en credentialdekking vereist is. `scripts/docker-e2e.mjs` zet dat plan daarna om in GitHub-outputs en samenvattingen. De workflow pakt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een pakketartifact uit de huidige run, of downloadt een pakketartifact uit `package_artifact_run_id`; valideert de tarball-inventaris; bouwt en pusht pakket-digest-getagde bare/functionele GHCR Docker E2E-images via Blacksmiths Docker layer cache wanneer het plan lanes met geïnstalleerd pakket nodig heeft; en hergebruikt opgegeven `docker_e2e_bare_image`-/`docker_e2e_functional_image`-inputs of bestaande pakket-digest-images in plaats van opnieuw te bouwen. Docker-image-pulls worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry-/cachestream snel opnieuw probeert in plaats van het grootste deel van het kritieke CI-pad te verbruiken.

### Releasepad-delen

Release-Docker-dekking draait kleinere chunked jobs met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elk deel alleen het imagetype ophaalt dat het nodig heeft en meerdere lanes uitvoert via dezelfde gewogen scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Huidige Release-Docker-delen zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` en `plugins-runtime-install-a` tot en met `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` en `plugins-integrations` blijven aggregate Plugin-/runtime-aliassen. De `install-e2e`-lanealias blijft de aggregate handmatige rerun-alias voor beide provider-installerlanes.

OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige releasepaddekking daarom vraagt, en behoudt alleen een zelfstandig `openwebui`-deel voor OpenWebUI-only-dispatches. Gebundelde-kanaal-updatelanes proberen één keer opnieuw bij tijdelijke npm-netwerkfouten.

Elk deel uploadt `.artifacts/docker-tests/` met lane-logs, timings, `summary.json`, `failures.json`, fasetimings, schedulerplan-JSON, slow-lane-tabellen en rerun-opdrachten per lane. De workflowinput `docker_lanes` draait geselecteerde lanes tegen de voorbereide images in plaats van de deeljobs, waardoor debugging van mislukte lanes begrensd blijft tot één gerichte Docker-job en het pakketartifact voor die run wordt voorbereid, gedownload of hergebruikt; als een geselecteerde lane een live Docker-lane is, bouwt de gerichte job de live-test-image lokaal voor die rerun. Gegenereerde GitHub-rerun-opdrachten per lane bevatten `package_artifact_run_id`, `package_artifact_name` en voorbereide image-inputs wanneer die waarden bestaan, zodat een mislukte lane het exacte pakket en de exacte images uit de mislukte run kan hergebruiken.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

De geplande live/E2E-workflow draait dagelijks de volledige releasepad-Docker-suite.

## Plugin-prerelease

`Plugin Prerelease` is duurdere product-/pakketdekking, dus het is een afzonderlijke workflow die wordt gedispatcht door `Full Release Validation` of door een expliciete operator. Normale pull requests, `main`-pushes en zelfstandige handmatige CI-dispatches houden die suite uitgeschakeld. De workflow verdeelt gebundelde-Plugin-tests over acht extensieworkers; die extensieshardjobs draaien maximaal twee Plugin-configgroepen tegelijk met één Vitest-worker per groep en een grotere Node-heap, zodat importzware Plugin-batches geen extra CI-jobs aanmaken. Het release-only Docker-prereleasepad batcht gerichte Docker-lanes in kleine groepen om te voorkomen dat tientallen runners worden gereserveerd voor jobs van één tot drie minuten.

## QA Lab

QA Lab heeft toegewezen CI-lanes buiten de hoofdworkflow met slimme scope. Agentic parity is genest onder de brede QA- en releaseharnassen, niet als zelfstandige PR-workflow. Gebruik `Full Release Validation` met `rerun_group=qa-parity` wanneer parity moet meelopen met een brede validatierun.

- De workflow `QA-Lab - All Lanes` draait elke nacht op `main` en bij handmatige dispatch; deze waaiert de mock-parity-lane, live Matrix-lane en live Telegram- en Discord-lanes uit als parallelle jobs. Live jobs gebruiken de omgeving `qa-live-shared`, en Telegram/Discord gebruiken Convex-leases.

Releasechecks draaien Matrix- en Telegram-live-transportlanes met de deterministische mockprovider en mock-gekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het kanaalcontract is geïsoleerd van live-modellatentie en normale provider-Plugin-startup. De live-transport-Gateway schakelt memory search uit omdat QA-parity memory-gedrag afzonderlijk dekt; providerconnectiviteit wordt gedekt door de afzonderlijke suites voor live model, native provider en Docker-provider.

Matrix gebruikt `--profile fast` voor geplande en releasegates, en voegt `--fail-fast` alleen toe wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaard en de handmatige workflowinput blijven `all`; handmatige `matrix_profile=all`-dispatch shardt volledige Matrix-dekking altijd in `transport`-, `media`-, `e2ee-smoke`-, `e2ee-deep`- en `e2ee-cli`-jobs.

`OpenClaw Release Checks` draait ook de releasekritieke QA Lab-lanes vóór releasegoedkeuring; de QA-parity-gate daarvan draait de kandidaat- en baseline-pakketten als parallelle lanejobs, en downloadt daarna beide artifacts in een kleine rapportjob voor de definitieve parity-vergelijking.

Volg voor normale PR's scoped CI-/checkbewijs in plaats van parity als vereiste status te behandelen.

## CodeQL

De `CodeQL`-workflow is bewust een smalle beveiligingsscanner voor een eerste controle, niet de volledige repositorydoorlichting. Dagelijkse, handmatige en niet-concept pull request-guard-runs scannen Actions-workflowcode plus de JavaScript/TypeScript-oppervlakken met het hoogste risico, met beveiligingsquery's met hoge betrouwbaarheid die zijn gefilterd op hoge/kritieke `security-severity`.

De pull request-guard blijft licht: die start alleen voor wijzigingen onder `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` of `src`, en voert dezelfde beveiligingsmatrix met hoge betrouwbaarheid uit als de geplande workflow. Android en macOS CodeQL blijven buiten de standaardinstellingen voor PR's.

### Beveiligingscategorieën

| Categorie                                         | Oppervlak                                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, geheimen, sandbox, cron en gateway-baseline                                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | Kerncontracten voor kanaalimplementatie plus de kanaal-Plugin-runtime, Gateway, Plugin SDK, geheimen en audit-aanraakpunten         |
| `/codeql-security-high/network-ssrf-boundary`     | Kernoppervlakken voor SSRF, IP-parsing, netwerkguard, web-fetch en Plugin SDK SSRF-beleid                                           |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-servers, helpers voor procesuitvoering, uitgaande levering en agent-gates voor tooluitvoering                                  |
| `/codeql-security-high/plugin-trust-boundary`     | Vertrouwensoppervlakken voor Plugin-installatie, loader, manifest, register, package-manager-installatie, bronladen en Plugin SDK-packagecontract |

### Platformspecifieke beveiligingsshards

- `CodeQL Android Critical Security` — geplande Android-beveiligingsshard. Bouwt de Android-app handmatig voor CodeQL op de kleinste Blacksmith Linux-runner die door workflowsanity wordt geaccepteerd. Uploadt onder `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — wekelijkse/handmatige macOS-beveiligingsshard. Bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert dependency-buildresultaten uit de geüploade SARIF en uploadt onder `/codeql-critical-security/macos`. Buiten de dagelijkse standaardinstellingen gehouden omdat de macOS-build de runtime domineert, zelfs wanneer die schoon is.

### Critical Quality-categorieën

`CodeQL Critical Quality` is de bijbehorende niet-beveiligingsshard. Die voert alleen JavaScript/TypeScript-kwaliteitsquery's met error-severity en zonder beveiligingsscope uit over smalle, hoogwaardige oppervlakken op de kleinere Blacksmith Linux-runner. De pull request-guard is bewust kleiner dan het geplande profiel: niet-concept PR's voeren alleen de bijbehorende `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` en `plugin-sdk-reply-runtime`-shards uit voor agent-command/model/tool-uitvoering en reply-dispatchcode, config-schema/migratie/IO-code, auth/geheimen/sandbox/beveiligingscode, kernkanaal en meegeleverde kanaal-Plugin-runtime, Gateway-protocol/servermethode, memory-runtime/SDK-lijm, MCP/proces/uitgaande levering, provider-runtime/modelcatalogus, sessiediagnostiek/leveringswachtrijen, Plugin-loader, Plugin SDK/packagecontract of wijzigingen aan de Plugin SDK reply-runtime. Wijzigingen aan CodeQL-config en kwaliteitsworkflows voeren alle twaalf PR-kwaliteitsshards uit.

Handmatige dispatch accepteert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

De smalle profielen zijn onderwijs-/iteratiehooks om één kwaliteitsshard geïsoleerd uit te voeren.

| Categorie                                               | Oppervlak                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Grenscode voor auth, geheimen, sandbox, cron en Gateway-beveiliging                                                                                               |
| `/codeql-critical-quality/config-boundary`              | Contracten voor config-schema, migratie, normalisatie en IO                                                                                                       |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-protocolschema's en servermethodecontracten                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementatiecontracten voor kernkanaal en meegeleverde kanaal-Plugin                                                                                            |
| `/codeql-critical-quality/agent-runtime-boundary`       | Runtimecontracten voor command-uitvoering, model/provider-dispatch, auto-reply-dispatch en wachtrijen, en ACP-control plane                                       |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-servers en toolbridges, helpers voor procestoezicht en contracten voor uitgaande levering                                                                     |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory-runtimefacades, memory Plugin SDK-aliassen, lijm voor memory-runtimeactivatie en memory doctor-commands                                  |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internals van reply-wachtrijen, sessieleveringswachtrijen, helpers voor uitgaande sessiebinding/levering, oppervlakken voor diagnostische events/logbundels en session doctor CLI-contracten |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK-dispatch van inkomende replies, reply-payload/chunking/runtime-helpers, kanaal-replyopties, leveringswachtrijen en helpers voor sessie-/threadbinding |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisatie van modelcatalogus, provider-auth en discovery, provider-runtime-registratie, provider-standaardwaarden/catalogi en web/search/fetch/embedding-registers |
| `/codeql-critical-quality/ui-control-plane`             | Control UI-bootstrap, lokale persistentie, Gateway-controlflows en runtimecontracten voor task control plane                                                      |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Runtimecontracten voor core web fetch/search, media-IO, media understanding, image-generation en media-generation                                                  |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, register-, public-surface- en Plugin SDK-entrypointcontracten                                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Gepubliceerde package-side Plugin SDK-bron en helpers voor Plugin-packagecontracten                                                                               |

Kwaliteit blijft gescheiden van beveiliging, zodat kwaliteitsbevindingen kunnen worden gepland, gemeten, uitgeschakeld of uitgebreid zonder het beveiligingssignaal te vertroebelen. Uitbreiding van Swift-, Python- en meegeleverde-Plugin-CodeQL moet alleen als afgebakend of geshard vervolgwerk worden teruggevoegd nadat de smalle profielen stabiele runtime en stabiel signaal hebben.

## Onderhoudsworkflows

### Docs Agent

De `Docs Agent`-workflow is een event-gedreven Codex-onderhoudslane om bestaande docs afgestemd te houden op recent gelande wijzigingen. Die heeft geen zuivere planning: een succesvolle niet-bot push-CI-run op `main` kan hem triggeren, en handmatige dispatch kan hem rechtstreeks uitvoeren. Workflow-run-aanroepen worden overgeslagen wanneer `main` verder is gegaan of wanneer er in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is aangemaakt. Wanneer die wordt uitgevoerd, bekijkt hij het commitbereik van de vorige niet-overgeslagen Docs Agent-bron-SHA tot de huidige `main`, zodat één uurlijkse run alle main-wijzigingen kan dekken die sinds de laatste docs-pass zijn verzameld.

### Test Performance Agent

De `Test Performance Agent`-workflow is een event-gedreven Codex-onderhoudslane voor trage tests. Die heeft geen zuivere planning: een succesvolle niet-bot push-CI-run op `main` kan hem triggeren, maar hij wordt overgeslagen als er die UTC-dag al een andere workflow-run-aanroep is uitgevoerd of draait. Handmatige dispatch omzeilt die dagelijkse activiteitsgate. De lane bouwt een gegroepeerd Vitest-prestatierapport voor de volledige suite, laat Codex alleen kleine testprestatieverbeteringen maken die coverage behouden in plaats van brede refactors, voert daarna het rapport voor de volledige suite opnieuw uit en weigert wijzigingen die het aantal passerende baselinetests verminderen. Als de baseline falende tests heeft, mag Codex alleen duidelijke failures fixen en moet het full-suite-rapport na de agent slagen voordat er iets wordt gecommit. Wanneer `main` verdergaat voordat de bot-push landt, rebaset de lane de gevalideerde patch, voert `pnpm check:changed` opnieuw uit en probeert de push opnieuw; conflicterende verouderde patches worden overgeslagen. De workflow gebruikt GitHub-hosted Ubuntu zodat de Codex-action dezelfde drop-sudo-veiligheidshouding kan behouden als de docs-agent.

### Duplicate PRs After Merge

De `Duplicate PRs After Merge`-workflow is een handmatige maintainer-workflow voor duplicate-opruiming na landing. Standaard is die dry-run en sluit hij alleen expliciet vermelde PR's wanneer `apply=true`. Voordat GitHub wordt gewijzigd, controleert hij of de gelande PR is gemerged en of elke duplicate een gedeeld gerefereerd issue of overlappende gewijzigde hunks heeft.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale check-gates en changed-routing

Lokale changed-lane-logica staat in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale check-gate is strenger over architectuurgrenzen dan de brede CI-platformscope:

- core-productiewijzigingen voeren core prod- en core test-typecheck plus core lint/guards uit;
- wijzigingen die alleen core-tests raken voeren alleen core test-typecheck plus core lint uit;
- extension-productiewijzigingen voeren extension prod- en extension test-typecheck plus extension lint uit;
- wijzigingen die alleen extension-tests raken voeren extension test-typecheck plus extension lint uit;
- wijzigingen aan publieke Plugin SDK- of Plugin-contracten breiden uit naar extension-typecheck omdat extensions afhankelijk zijn van die core-contracten (Vitest extension-sweeps blijven expliciet testwerk);
- version bumps die alleen releasemetadata raken voeren gerichte versie-/config-/root-dependency-checks uit;
- onbekende root-/configwijzigingen vallen veilig terug op alle check-lanes.

Lokale changed-test-routing staat in `scripts/test-projects.test-support.mjs` en is bewust goedkoper dan `check:changed`: directe testbewerkingen voeren zichzelf uit, bronbewerkingen geven de voorkeur aan expliciete mappings, daarna sibling-tests en import-graph-afhankelijken. Gedeelde delivery-config voor groepsruimtes is een van de expliciete mappings: wijzigingen aan de groep zichtbare-reply-config, bron-reply-leveringsmodus of de message-tool system prompt lopen via de core reply-tests plus Discord- en Slack-delivery-regressions, zodat een gedeelde standaardwijziging faalt vóór de eerste PR-push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging zo harness-breed is dat de goedkope gemapte set geen betrouwbare proxy is.

## Testbox-validatie

Voer Testbox uit vanaf de repo-root en geef voor brede verificatie de voorkeur aan een nieuwe voorverwarmde box. Voordat je een trage gate besteedt aan een box die is hergebruikt, verlopen is, of net een onverwacht grote synchronisatie meldde, voer je eerst `pnpm testbox:sanity` uit in de box.

De sanitycontrole faalt snel wanneer vereiste rootbestanden zoals `pnpm-lock.yaml` verdwenen zijn of wanneer `git status --short` minstens 200 bijgehouden verwijderingen toont. Dat betekent meestal dat de externe synchronisatiestatus geen betrouwbare kopie van de PR is; stop die box en warm een nieuwe op in plaats van de producttestfout te debuggen. Voor opzettelijke PR's met veel verwijderingen stel je `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor die sanityrun.

`pnpm testbox:run` beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de synchronisatiefase blijft zonder output na synchronisatie. Stel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` in om die guard uit te schakelen, of gebruik een grotere millisecondenwaarde voor ongewoon grote lokale diffs.

Crabbox is het tweede door de repo beheerde remote-box-pad voor Linux-verificatie wanneer Blacksmith niet beschikbaar is of wanneer eigen cloudcapaciteit de voorkeur heeft. Warm een box op, hydrateer deze via de projectworkflow en voer vervolgens opdrachten uit via de Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` beheert de standaardwaarden voor provider, synchronisatie en GitHub Actions-hydratatie. Het sluit lokale `.git` uit zodat de gehydrateerde Actions-checkout zijn eigen externe Git-metadata behoudt in plaats van maintainer-lokale remotes en objectstores te synchroniseren, en het sluit lokale runtime-/buildartefacten uit die nooit mogen worden overgedragen. `.github/workflows/crabbox-hydrate.yml` beheert checkout, Node/pnpm-installatie, het ophalen van `origin/main` en de niet-geheime omgevingshandoff die latere `crabbox run --id <cbx_id>`-opdrachten sourcen.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Ontwikkelingskanalen](/nl/install/development-channels)
