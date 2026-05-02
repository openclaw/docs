---
read_when:
    - Je moet begrijpen waarom een CI-taak wel of niet is uitgevoerd
    - Je debugt een mislukte GitHub Actions-controle
    - Je coördineert een releasevalidatierun of een heruitvoering
    - Je wijzigt ClawSweeper-dispatch of het doorsturen van GitHub-activiteit
summary: CI-taakgrafiek, scopecontroles, release-overkoepelingen en lokale commando-equivalenten
title: CI-pipeline
x-i18n:
    generated_at: "2026-05-02T11:10:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39af4afcb3e7c847c44a9d47513ac4b99c62d13fb139ece0bee979f24687ea38
    source_path: ci.md
    workflow: 16
---

OpenClaw CI draait bij elke push naar `main` en elke pull request. De `preflight`-taak classificeert de diff en schakelt dure lanes uit wanneer alleen niet-gerelateerde gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen bewust slimme scoping en waaieren de volledige grafiek uit voor releasekandidaten en brede validatie. Android-lanes blijven opt-in via `include_android`. Release-only Plugin-dekking bevindt zich in de aparte [`Plugin Prerelease`](#plugin-prerelease)-workflow en draait alleen vanuit [`Full Release Validation`](#full-release-validation) of een expliciete handmatige dispatch.

## Pipeline-overzicht

| Taak                             | Doel                                                                                         | Wanneer deze draait               |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Detecteert alleen-docs-wijzigingen, gewijzigde scopes, gewijzigde extensies en bouwt het CI-manifest | Altijd bij niet-draft pushes en PR's |
| `security-scm-fast`              | Detectie van privésleutels en workflow-audit via `zizmor`                                    | Altijd bij niet-draft pushes en PR's |
| `security-dependency-audit`      | Productie-lockfile-audit zonder dependencies tegen npm-advisories                            | Altijd bij niet-draft pushes en PR's |
| `security-fast`                  | Vereiste aggregatie voor de snelle securitytaken                                             | Altijd bij niet-draft pushes en PR's |
| `check-dependencies`             | Productie Knip-pass alleen voor dependencies plus de unused-file-allowlistbewaking           | Node-relevante wijzigingen        |
| `build-artifacts`                | Bouwt `dist/`, Control UI, controles voor gebouwde artefacten en herbruikbare downstream-artefacten | Node-relevante wijzigingen        |
| `checks-fast-core`               | Snelle Linux-correctheidslanes zoals bundled/Plugin-contract/protocol-controles              | Node-relevante wijzigingen        |
| `checks-fast-contracts-channels` | Geshaarde channel-contractcontroles met een stabiel geaggregeerd controleresultaat           | Node-relevante wijzigingen        |
| `checks-node-core-test`          | Core Node-testshards, exclusief channel-, bundled-, contract- en extensielanes               | Node-relevante wijzigingen        |
| `check`                          | Geshaarde equivalent van de lokale hoofdgate: prod-types, lint, guards, testtypes en strikte smoke | Node-relevante wijzigingen        |
| `check-additional`               | Architectuur-, boundary-, extensieoppervlak-, package-boundary- en gateway-watch-shards      | Node-relevante wijzigingen        |
| `build-smoke`                    | Smoke-tests voor de gebouwde CLI en startup-memory smoke                                     | Node-relevante wijzigingen        |
| `checks`                         | Verifier voor channel-tests met gebouwde artefacten                                          | Node-relevante wijzigingen        |
| `checks-node-compat-node22`      | Node 22-compatibiliteitsbuild en smoke-lane                                                  | Handmatige CI-dispatch voor releases |
| `check-docs`                     | Docs-formattering, lint en controles op kapotte links                                        | Docs gewijzigd                    |
| `skills-python`                  | Ruff + pytest voor Python-backed Skills                                                      | Python-Skills-relevante wijzigingen |
| `checks-windows`                 | Windows-specifieke process/path-tests plus regressies voor gedeelde runtime-importspecifier  | Windows-relevante wijzigingen     |
| `macos-node`                     | macOS TypeScript-testlane met de gedeelde gebouwde artefacten                                | macOS-relevante wijzigingen       |
| `macos-swift`                    | Swift-lint, build en tests voor de macOS-app                                                 | macOS-relevante wijzigingen       |
| `android`                        | Android-unittests voor beide smaken plus één debug-APK-build                                 | Android-relevante wijzigingen     |
| `test-performance-agent`         | Dagelijkse Codex-optimalisatie van trage tests na vertrouwde activiteit                      | Geslaagde main-CI of handmatige dispatch |

## Fail-fast-volgorde

1. `preflight` bepaalt welke lanes überhaupt bestaan. De `docs-scope`- en `changed-scope`-logica zijn stappen binnen deze taak, geen zelfstandige taken.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` en `skills-python` falen snel zonder te wachten op de zwaardere artefact- en platformmatrixtaken.
3. `build-artifacts` overlapt met de snelle Linux-lanes zodat downstream-consumenten kunnen starten zodra de gedeelde build klaar is.
4. Zwaardere platform- en runtimelanes waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` en `android`.

GitHub kan vervangen taken als `cancelled` markeren wanneer een nieuwere push op dezelfde PR of `main`-ref binnenkomt. Behandel dat als CI-ruis tenzij de nieuwste run voor dezelfde ref ook faalt. Geaggregeerde shard-controles gebruiken `!cancelled() && always()`, zodat ze nog steeds normale shard-fouten rapporteren maar niet in de wachtrij komen nadat de hele workflow al is vervangen. De automatische CI-concurrency-sleutel is geversioneerd (`CI-v7-*`), zodat een zombie aan GitHub-zijde in een oude wachtrijgroep nieuwere main-runs niet onbeperkt kan blokkeren. Handmatige full-suite-runs gebruiken `CI-manual-v1-*` en annuleren lopende runs niet.

## Scope en routering

Scopelogica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unittests in `src/scripts/ci-changed-scope.test.ts`. Handmatige dispatch slaat changed-scope-detectie over en laat het preflight-manifest handelen alsof elk scoped gebied is gewijzigd.

- **CI-workflowbewerkingen** valideren de Node CI-grafiek plus workflow-linting, maar forceren op zichzelf geen Windows-, Android- of macOS-native builds; die platformlanes blijven scoped op platformbronwijzigingen.
- **Alleen-CI-routeringsbewerkingen, geselecteerde goedkope core-test-fixturebewerkingen en smalle Plugin-contracthelper/test-routeringsbewerkingen** gebruiken een snel Node-only manifestpad: `preflight`, security en één `checks-fast-core`-taak. Dat pad slaat buildartefacten, Node 22-compatibiliteit, channel-contracten, volledige core-shards, bundled-Plugin-shards en aanvullende guard-matrices over wanneer de wijziging beperkt is tot de routerings- of helperoppervlakken die de snelle taak direct oefent.
- **Windows Node-controles** zijn scoped op Windows-specifieke process/path-wrappers, npm/pnpm/UI-runnerhelpers, package-managerconfiguratie en de CI-workflowoppervlakken die die lane uitvoeren; niet-gerelateerde bron-, Plugin-, install-smoke- en test-only wijzigingen blijven op de Linux Node-lanes.

De traagste Node-testfamilies zijn gesplitst of gebalanceerd zodat elke taak klein blijft zonder runners te ruim te reserveren: channel-contracten draaien als drie gewogen shards, kleine core-unitlanes worden gekoppeld, auto-reply draait als vier gebalanceerde workers (waarbij de reply-subtree is gesplitst in agent-runner-, dispatch- en commands/state-routing-shards), en agentic Gateway/Plugin-configs worden verdeeld over de bestaande source-only agentic Node-taken in plaats van te wachten op gebouwde artefacten. Brede browser-, QA-, media- en diverse Plugin-tests gebruiken hun eigen Vitest-configs in plaats van de gedeelde Plugin catch-all. Include-pattern-shards registreren timingvermeldingen met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een volledige config kan onderscheiden van een gefilterde shard. `check-additional` houdt package-boundary compile/canary-werk bij elkaar en scheidt runtime-topologiearchitectuur van gateway-watch-dekking; de boundary-guard-shard draait zijn kleine onafhankelijke guards gelijktijdig binnen één taak. Gateway watch, channel-tests en de core support-boundary-shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd.

Android CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play debug-APK. De third-party-smaak heeft geen aparte source set of manifest; de unittests-lane compileert de smaak nog steeds met de SMS/call-log BuildConfig-vlaggen, terwijl een dubbele debug-APK-packagingtaak bij elke Android-relevante push wordt vermeden.

De `check-dependencies`-shard draait `pnpm deadcode:dependencies` (een productie Knip-pass alleen voor dependencies, vastgezet op de nieuwste Knip-versie, met pnpm's minimum release age uitgeschakeld voor de `dlx`-installatie) en `pnpm deadcode:unused-files`, dat Knip's productie-unused-file-bevindingen vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. De unused-file-guard faalt wanneer een PR een nieuw niet-beoordeeld ongebruikt bestand toevoegt of een verouderde allowlistvermelding laat staan, terwijl bewuste dynamische Plugin-, gegenereerde, build-, live-test- en package-bridge-oppervlakken die Knip niet statisch kan oplossen behouden blijven.

## ClawSweeper-activiteit doorsturen

`.github/workflows/clawsweeper-dispatch.yml` is de target-side bridge van OpenClaw-repositoryactiviteit naar ClawSweeper. Deze checkt geen niet-vertrouwde pull-requestcode uit en voert die niet uit. De workflow maakt een GitHub App-token aan vanuit `CLAWSWEEPER_APP_PRIVATE_KEY` en verzendt daarna compacte `repository_dispatch`-payloads naar `openclaw/clawsweeper`.

De workflow heeft vier lanes:

- `clawsweeper_item` voor exacte issue- en pull-request-reviewverzoeken;
- `clawsweeper_comment` voor expliciete ClawSweeper-opdrachten in issuecommentaren;
- `clawsweeper_commit_review` voor reviewverzoeken op commitniveau bij `main`-pushes;
- `github_activity` voor algemene GitHub-activiteit die de ClawSweeper-agent kan inspecteren.

De `github_activity`-lane stuurt alleen genormaliseerde metadata door: gebeurtenistype, actie, actor, repository, itemnummer, URL, titel, status en korte fragmenten voor commentaren of reviews wanneer aanwezig. Deze vermijdt bewust het doorsturen van de volledige webhook-body. De ontvangende workflow in `openclaw/clawsweeper` is `.github/workflows/github-activity.yml`, die de genormaliseerde gebeurtenis naar de OpenClaw Gateway-hook voor de ClawSweeper-agent post.

Algemene activiteit is observatie, geen standaardlevering. De ClawSweeper-agent ontvangt het Discord-doel in zijn prompt en zou alleen naar `#clawsweeper` moeten posten wanneer de gebeurtenis verrassend, actiegericht, riskant of operationeel nuttig is. Routinematig openen, bewerken, botruis, dubbele webhook-ruis en normaal reviewverkeer zouden moeten resulteren in `NO_REPLY`.

Behandel GitHub-titels, commentaren, bodies, reviewtekst, branchnamen en commitberichten overal in dit pad als niet-vertrouwde data. Ze zijn invoer voor samenvatting en triage, geen instructies voor de workflow- of agentruntime.

## Handmatige dispatches

Handmatige CI-dispatches draaien dezelfde taakgrafiek als normale CI, maar forceren elke niet-Android-scoped lane aan: Linux Node-shards, bundled-Plugin-shards, channel-contracten, Node 22-compatibiliteit, `check`, `check-additional`, build smoke, docs-controles, Python Skills, Windows, macOS en Control UI i18n. Losstaande handmatige CI-dispatches draaien Android alleen met `include_android=true`; de volledige releaseparaplu schakelt Android in door `include_android=true` door te geven. Statische Plugin-prerelease-controles, de release-only `agentic-plugins`-shard, de volledige extensie-batch-sweep en Plugin-prerelease-Docker-lanes zijn uitgesloten van CI. De Docker-prerelease-suite draait alleen wanneer `Full Release Validation` de aparte `Plugin Prerelease`-workflow dispatcht met de release-validation-gate ingeschakeld.

Handmatige runs gebruiken een unieke concurrency-groep zodat een volledige suite voor een releasekandidaat niet wordt geannuleerd door een andere push of PR-run op dezelfde ref. De optionele `target_ref`-invoer laat een vertrouwde caller die grafiek draaien tegen een branch, tag of volledige commit-SHA terwijl het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, snelle beveiligingstaken en aggregaties (`security-scm-fast`, `security-dependency-audit`, `security-fast`), snelle protocol-/contract-/gebundelde controles, gesharde kanaalcontractcontroles, `check`-shards behalve lint, `check-additional`-shards en aggregaties, verificaties voor Node-testaggregaties, docs-controles, Python-Skills, workflow-sanity, labeler, auto-response; install-smoke preflight gebruikt ook door GitHub gehoste Ubuntu zodat de Blacksmith-matrix eerder in de wachtrij kan komen |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lichtere Plugin-shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` en `check-test-types`                                                                                                                                                                                                                                                                                                                   |
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
```

## Volledige releasevalidatie

`Full Release Validation` is de handmatige overkoepelende workflow voor "alles uitvoeren vóór de release." Deze accepteert een branch, tag of volledige commit-SHA, dispatcht de handmatige `CI`-workflow met dat doel, dispatcht `Plugin Prerelease` voor release-only Plugin-/pakket-/statische/Docker-bewijzen, en dispatcht `OpenClaw Release Checks` voor install-smoke, pakketacceptatie, Docker-releasepadsuites, live/E2E, OpenWebUI, QA Lab-pariteit, Matrix en Telegram-lanes. Met `rerun_group=all` en `release_profile=full` wordt ook `NPM Telegram Beta E2E` uitgevoerd tegen het `release-package-under-test`-artefact uit releasecontroles. Geef na publicatie `npm_telegram_package_spec` door om dezelfde Telegram-pakketlane opnieuw uit te voeren tegen het gepubliceerde npm-pakket.

Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
fasematrix, exacte workflowtaaknamen, profielverschillen, artefacten en
gerichte rerun-handles.

`OpenClaw Release Publish` is de handmatige muterende releaseworkflow. Dispatch deze
vanaf `release/YYYY.M.D` of `main` nadat de releasetag bestaat en nadat de
OpenClaw npm-preflight is geslaagd. Deze verifieert `pnpm plugins:sync:check`,
dispatcht `Plugin NPM Release` voor alle publiceerbare Plugin-pakketten, dispatcht
`Plugin ClawHub Release` voor dezelfde release-SHA en dispatcht pas daarna
`OpenClaw NPM Release` met de opgeslagen `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Gebruik voor bewijs van een vastgepinde commit op een snel bewegende branch de helper in plaats van
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-workflowdispatch-refs moeten branches of tags zijn, geen ruwe commit-SHA's. De
helper pusht een tijdelijke `release-ci/<sha>-...`-branch op de doel-SHA,
dispatcht `Full Release Validation` vanaf die vastgepinde ref, verifieert dat elke onderliggende
workflow-`headSha` overeenkomt met het doel, en verwijdert de tijdelijke branch wanneer de
run is voltooid. De overkoepelende verifier faalt ook als een onderliggende workflow op een
andere SHA is uitgevoerd.

`release_profile` bepaalt de live/provider-breedte die wordt doorgegeven aan releasecontroles. De
handmatige releaseworkflows staan standaard op `stable`; gebruik `full` alleen wanneer je
bewust de brede adviserende provider-/mediamatrix wilt.

- `minimum` behoudt de snelste OpenAI-/core releasekritieke lanes.
- `stable` voegt de stabiele provider-/backendset toe.
- `full` voert de brede adviserende provider-/mediamatrix uit.

De overkoepelende workflow registreert de gedispatchte onderliggende run-id's, en de laatste `Verify full validation`-taak controleert de huidige conclusies van onderliggende runs opnieuw en voegt tabellen met traagste taken toe voor elke onderliggende run. Als een onderliggende workflow opnieuw wordt uitgevoerd en groen wordt, voer dan alleen de bovenliggende verificatietaak opnieuw uit om het overkoepelende resultaat en de timingsamenvatting te vernieuwen.

Voor herstel accepteren zowel `Full Release Validation` als `OpenClaw Release Checks` `rerun_group`. Gebruik `all` voor een releasekandidaat, `ci` voor alleen de normale volledige CI-child, `plugin-prerelease` voor alleen de Plugin-prerelease-child, `release-checks` voor elke release-child, of een smallere groep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` of `npm-telegram` op de overkoepelende workflow. Dit houdt een mislukte releasebox-rerun begrensd na een gerichte fix.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde ref één keer te resolven naar een `release-package-under-test`-tarball, en geeft dat artefact daarna door aan zowel de live/E2E releasepad-Docker-workflow als de pakketacceptatieshard. Daardoor blijven de pakketbytes consistent over releaseboxen heen en wordt voorkomen dat dezelfde kandidaat opnieuw wordt verpakt in meerdere onderliggende taken.

Dubbele `Full Release Validation`-runs voor `ref=main` en `rerun_group=all`
vervangen de oudere overkoepelende run. De bovenliggende monitor annuleert elke onderliggende workflow die deze
al heeft gedispatcht wanneer de bovenliggende run wordt geannuleerd, zodat nieuwere main-validatie
niet achter een verouderde twee uur durende release-check-run blijft staan. Validatie van releasebranches/tags
en gerichte rerun-groepen behouden `cancel-in-progress: false`.

## Live- en E2E-shards

De onderliggende release live/E2E-workflow behoudt brede native `pnpm test:live`-dekking, maar voert deze uit als benoemde shards via `scripts/test-live-shard.mjs` in plaats van één seriële taak:

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
- gesplitste audio-/videoshards voor media en provider-gefilterde muziekshards

Dit behoudt dezelfde bestandsdekking terwijl trage live provider-fouten makkelijker opnieuw uit te voeren en te diagnosticeren zijn. De aggregaatshardnamen `native-live-extensions-o-z`, `native-live-extensions-media` en `native-live-extensions-media-music` blijven geldig voor handmatige eenmalige reruns.

De native live mediashards draaien in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de `Live Media Runner Image`-workflow. Die image installeert `ffmpeg` en `ffprobe` vooraf; mediataken verifiëren alleen de binaries vóór de setup. Houd Docker-ondersteunde live-suites op normale Blacksmith-runners — containertaken zijn de verkeerde plek om geneste Docker-tests te starten.

Docker-ondersteunde live model-/backend-shards gebruiken een aparte gedeelde `ghcr.io/openclaw/openclaw-live-test:<sha>`-image per geselecteerde commit. De live releaseworkflow bouwt en pusht die image eenmaal, waarna de Docker live model-, provider-gesharde Gateway-, CLI backend-, ACP bind- en Codex harness-shards draaien met `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker-shards hebben expliciete scriptniveau-`timeout`-limieten onder de workflowtaaktime-out, zodat een vastgelopen container of cleanup-pad snel faalt in plaats van het volledige budget voor releasecontroles te verbruiken. Als die shards het volledige bron-Dockerdoel zelfstandig opnieuw bouwen, is de release-run verkeerd geconfigureerd en verspilt die kloktijd aan dubbele image-builds.

## Pakketacceptatie

Gebruik `Package Acceptance` wanneer de vraag is: "werkt dit installeerbare OpenClaw-pakket als product?" Het verschilt van normale CI: normale CI valideert de bronboom, terwijl pakketacceptatie één tarball valideert via dezelfde Docker E2E-harness die gebruikers na installatie of update gebruiken.

### Taken

1. `resolve_package` checkt `workflow_ref` uit, kiest één pakketkandidaat, schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het `package-under-test`-artifact en print de bron, workflow-ref, pakket-ref, versie, SHA-256 en het profiel in de GitHub-stapsamenvatting.
2. `docker_acceptance` roept `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt dat artifact, valideert de tarball-inventaris, bereidt package-digest Docker-images voor wanneer nodig en voert de geselecteerde Docker-lanes uit tegen dat pakket in plaats van de workflow-checkout te verpakken. Wanneer een profiel meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het pakket en de gedeelde images eenmaal voor en waaiert die lanes daarna uit als parallelle gerichte Docker-taken met unieke artifacts.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Dit draait wanneer `telegram_mode` niet `none` is en installeert hetzelfde `package-under-test`-artifact wanneer Pakketacceptatie er een heeft gekozen; zelfstandige Telegram-dispatch kan nog steeds een gepubliceerde npm-specificatie installeren.
4. `summary` laat de workflow falen als pakketresolutie, Docker-acceptatie of de optionele Telegram-lane is mislukt.

### Kandidaatbronnen

- `source=npm` accepteert alleen `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor gepubliceerde beta-/stabiele acceptatie.
- `source=ref` verpakt een vertrouwde `package_ref`-branch, tag of volledige commit-SHA. De resolver haalt OpenClaw-branches/tags op, verifieert dat de geselecteerde commit bereikbaar is vanuit repository-branchgeschiedenis of een releasetag, installeert dependencies in een losgekoppelde worktree en verpakt die met `scripts/package-openclaw-for-docker.mjs`.
- `source=url` downloadt een HTTPS-`.tgz`; `package_sha256` is vereist.
- `source=artifact` downloadt één `.tgz` uit `artifact_run_id` en `artifact_name`; `package_sha256` is optioneel maar moet worden meegegeven voor extern gedeelde artifacts.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde workflow-/harnesscode die de test uitvoert. `package_ref` is de broncommit die wordt verpakt wanneer `source=ref`. Hierdoor kan de huidige testharness oudere vertrouwde broncommits valideren zonder oude workflowlogica te draaien.

### Suiteprofielen

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — volledige Docker-releasepadchunks met OpenWebUI
- `custom` — exacte `docker_lanes`; vereist wanneer `suite_profile=custom`

Het `package`-profiel gebruikt offline Plugin-dekking, zodat validatie van gepubliceerde pakketten niet afhankelijk is van live ClawHub-beschikbaarheid. De optionele Telegram-lane hergebruikt het `package-under-test`-artifact in `NPM Telegram Beta E2E`, waarbij het pad voor de gepubliceerde npm-specificatie behouden blijft voor zelfstandige dispatches.

Zie [Updates en Plugins testen](/nl/help/testing-updates-plugins) voor het specifieke beleid voor update- en Plugin-tests, inclusief lokale opdrachten, Docker-lanes, Pakketacceptatie-invoer, release-standaarden en fouttriage.

Releasecontroles roepen Pakketacceptatie aan met `source=artifact`, het voorbereide releasepakket-artifact, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` en `telegram_mode=mock-openai`. Dit houdt bewijs voor pakketmigratie, update, cleanup van verouderde Plugin-dependencies, offline Plugin, Plugin-update en Telegram op dezelfde gekozen pakket-tarball. Cross-OS-releasecontroles dekken nog steeds OS-specifieke onboarding, installer- en platformgedrag; productvalidatie voor pakketten/updates moet beginnen met Pakketacceptatie. De `published-upgrade-survivor` Docker-lane valideert één gepubliceerde pakketbaseline per run. In Pakketacceptatie is de gekozen `package-under-test`-tarball altijd de kandidaat en selecteert `published_upgrade_survivor_baseline` de gepubliceerde fallback-baseline, standaard `openclaw@latest`; opdrachten voor het opnieuw draaien van mislukte lanes behouden die baseline. Stel `published_upgrade_survivor_baselines=release-history` in om de lane uit te breiden over een ontdubbelde geschiedenismatrix: de nieuwste zes stabiele releases, `2026.4.23` en de nieuwste stabiele release vóór `2026-03-15`. Stel `published_upgrade_survivor_scenarios=reported-issues` in om dezelfde baselines uit te breiden over issue-vormige fixtures voor Feishu-configuratie, behouden bootstrap-/persona-bestanden, tilde-logpaden en verouderde legacy Plugin-dependencyroots. De aparte `Update Migration`-workflow gebruikt de `update-migration` Docker-lane met `all-since-2026.4.23` en `plugin-deps-cleanup` wanneer de vraag uitputtende cleanup van gepubliceerde updates is, niet de normale breedte van Full Release CI. Lokale geaggregeerde runs kunnen exacte pakketspecificaties doorgeven met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, één lane behouden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` zoals `openclaw@2026.4.15`, of `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` instellen voor de scenariomatrix. De gepubliceerde lane configureert de baseline met een ingebakken `openclaw config set`-opdrachtrecept, legt receptstappen vast in `summary.json` en peilt `/healthz`, `/readyz` plus RPC-status na Gateway-start. De Windows-lanes voor vers verpakte en installer-installaties verifiëren ook dat een geïnstalleerd pakket een browser-control override kan importeren vanaf een rauw absoluut Windows-pad. De OpenAI cross-OS agent-turn smoke gebruikt standaard `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer ingesteld, anders `openai/gpt-5.5`, zodat het installatie- en Gateway-bewijs op het voorkeursmodel voor GPT-5-tests blijft.

### Legacy-compatibiliteitsvensters

Pakketacceptatie heeft begrensde legacy-compatibiliteitsvensters voor al gepubliceerde pakketten. Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen het compatibiliteitspad gebruiken:

- bekende private QA-vermeldingen in `dist/postinstall-inventory.json` mogen verwijzen naar bestanden die uit de tarball zijn weggelaten;
- `doctor-switch` mag de subcase voor `gateway install --wrapper`-persistentie overslaan wanneer het pakket die vlag niet beschikbaar maakt;
- `update-channel-switch` mag ontbrekende `pnpm.patchedDependencies` verwijderen uit de van de tarball afgeleide nep-git-fixture en mag ontbrekende gepersisteerde `update.channel` loggen;
- Plugin-smokes mogen legacy install-record-locaties lezen of ontbrekende marketplace install-record-persistentie accepteren;
- `plugin-update` mag migratie van configuratiemetadata toestaan, terwijl nog steeds vereist is dat install-record- en no-reinstall-gedrag ongewijzigd blijven.

Het gepubliceerde `2026.4.26`-pakket mag ook waarschuwen voor lokale buildmetadata-stempelbestanden die al zijn verzonden. Latere pakketten moeten aan de moderne contracten voldoen; dezelfde voorwaarden falen dan in plaats van te waarschuwen of over te slaan.

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

Begin bij het debuggen van een mislukte pakketacceptatierun met de `resolve_package`-samenvatting om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de `docker_acceptance`-childrun en de Docker-artifacts daarvan: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logs, fasetimings en opdrachten voor opnieuw draaien. Geef de voorkeur aan het opnieuw draaien van het mislukte pakketprofiel of de exacte Docker-lanes in plaats van het opnieuw draaien van volledige releasevalidatie.

## Installatiesmoke

De aparte `Install Smoke`-workflow hergebruikt hetzelfde scopescript via zijn eigen `preflight`-taak. Deze splitst smoke-dekking in `run_fast_install_smoke` en `run_full_install_smoke`.

- **Snel pad** draait voor pull requests die Docker-/pakketoppervlakken, gebundelde Plugin-pakket-/manifestwijzigingen of core Plugin-/kanaal-/Gateway-/Plugin SDK-oppervlakken raken die de Docker-smoke-taken uitvoeren. Wijzigingen alleen in de bron van gebundelde Plugins, test-only bewerkingen en docs-only bewerkingen reserveren geen Docker-workers. Het snelle pad bouwt de root Dockerfile-image eenmaal, controleert de CLI, draait de agents delete shared-workspace CLI-smoke, draait de container gateway-network e2e, verifieert een build-arg voor een gebundelde extensie en draait het begrensde gebundelde-Plugin Docker-profiel onder een geaggregeerde opdrachttime-out van 240 seconden (elke Docker-run van elk scenario wordt apart begrensd).
- **Volledig pad** behoudt QR-pakketinstallatie en installer Docker-/update-dekking voor nachtelijke geplande runs, handmatige dispatches, workflow-call releasecontroles en pull requests die installer-/pakket-/Docker-oppervlakken echt raken. In volledige modus bereidt install-smoke één target-SHA GHCR root Dockerfile-smoke-image voor of hergebruikt die, en draait daarna QR-pakketinstallatie, root Dockerfile-/Gateway-smokes, installer-/update-smokes en de snelle gebundelde-Plugin Docker E2E als aparte taken, zodat installer-werk niet hoeft te wachten achter de root-image-smokes.

`main`-pushes (inclusief mergecommits) forceren het volledige pad niet; wanneer changed-scope-logica volledige dekking zou vragen bij een push, behoudt de workflow de snelle Docker-smoke en laat de volledige installatiesmoke over aan nachtelijke of releasevalidatie.

De langzame Bun global install image-provider smoke wordt apart bewaakt door `run_bun_global_install_smoke`. Die draait volgens het nachtelijke schema en vanuit de releasecontrolesworkflow, en handmatige `Install Smoke`-dispatches kunnen ervoor kiezen, maar pull requests en `main`-pushes niet. QR- en installer-Docker-tests behouden hun eigen installatiegerichte Dockerfiles.

## Lokale Docker E2E

`pnpm test:docker:all` prebuildt één gedeelde live-test-image, verpakt OpenClaw eenmaal als een npm-tarball en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images:

- een kale Node/Git-runner voor installer-/update-/Plugin-dependency-lanes;
- een functionele image die dezelfde tarball in `/app` installeert voor normale functionaliteitslanes.

Docker-testbaandefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, planningslogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de uitvoerder voert alleen het geselecteerde plan uit. De planner selecteert de containerimage per testbaan met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en voert daarna testbanen uit met `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Instelbare waarden

| Variabele                              | Standaard      | Doel                                                                                                          |
| -------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10             | Aantal slots in de hoofdpool voor normale testbanen.                                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10             | Aantal slots in de providergevoelige tail-pool.                                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9              | Limiet voor gelijktijdige live-testbanen, zodat providers niet throttlen.                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10             | Limiet voor gelijktijdige npm-installatietestbanen.                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7              | Limiet voor gelijktijdige testbanen met meerdere services.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000           | Spreiding tussen het starten van testbanen om aanmaakstormen bij de Docker-daemon te vermijden; stel in op `0` voor geen spreiding. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000        | Fallbacktimeout per testbaan (120 minuten); geselecteerde live/tail-testbanen gebruiken strakkere limieten.   |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | niet ingesteld | `1` print het plannerplan zonder testbanen uit te voeren.                                                     |
| `OPENCLAW_DOCKER_ALL_LANES`            | niet ingesteld | Komma-gescheiden exacte lijst met testbanen; slaat cleanup-smoke over zodat agents een mislukte testbaan kunnen reproduceren. |

Een testbaan die zwaarder is dan zijn effectieve limiet kan nog steeds vanuit een lege pool starten en draait daarna alleen totdat hij capaciteit vrijgeeft. De lokale aggregaatrun voert vooraf Docker-controles uit, verwijdert verouderde OpenClaw E2E-containers, geeft actieve-testbaanstatus weer, bewaart testbaantijden voor volgorde van langste eerst, en stopt standaard met het plannen van nieuwe gepoolde testbanen na de eerste mislukking.

### Herbruikbare live/E2E-workflow

De herbruikbare live/E2E-workflow vraagt `scripts/test-docker-all.mjs --plan-json` welk pakket, imagetype, live-image, testbaan en credentialdekking vereist zijn. `scripts/docker-e2e.mjs` zet dat plan vervolgens om naar GitHub-outputs en samenvattingen. De workflow pakt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een pakketartefact uit de huidige run, of downloadt een pakketartefact uit `package_artifact_run_id`; valideert de tarball-inventaris; bouwt en pusht bare/functionele GHCR Docker E2E-images met pakketdigest-tags via Blacksmiths Docker-laagcache wanneer het plan testbanen nodig heeft waarin het pakket is geïnstalleerd; en hergebruikt opgegeven `docker_e2e_bare_image`/`docker_e2e_functional_image`-invoerwaarden of bestaande images met pakketdigest in plaats van opnieuw te bouwen. Docker-imagepulls worden opnieuw geprobeerd met een begrensde timeout van 180 seconden per poging, zodat een vastgelopen register-/cachestream snel opnieuw probeert in plaats van het grootste deel van het kritieke CI-pad te verbruiken.

### Releasepad-segmenten

Release-Docker-dekking draait kleinere opgesplitste jobs met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elk segment alleen het imagetype ophaalt dat het nodig heeft en meerdere testbanen via dezelfde gewogen planner uitvoert:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Huidige release-Docker-segmenten zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, en `plugins-runtime-install-a` tot en met `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, en `plugins-integrations` blijven geaggregeerde Plugin-/runtime-aliassen. De testbaanalias `install-e2e` blijft de geaggregeerde handmatige heruitvoeringsalias voor beide providerinstallatietestbanen.

OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige releasepad-dekking daarom vraagt, en behoudt alleen een zelfstandig `openwebui`-segment voor dispatches die uitsluitend OpenWebUI betreffen. Update-testbanen voor gebundelde kanalen proberen één keer opnieuw bij tijdelijke npm-netwerkfouten.

Elk segment uploadt `.artifacts/docker-tests/` met testbaanlogs, tijden, `summary.json`, `failures.json`, fasetijden, JSON van het plannerplan, tabellen met trage testbanen, en heruitvoeringsopdrachten per testbaan. De workflowinvoer `docker_lanes` voert geselecteerde testbanen uit tegen de voorbereide images in plaats van de segmentjobs, waardoor debuggen van mislukte testbanen beperkt blijft tot één gerichte Docker-job en het pakketartefact voor die run wordt voorbereid, gedownload of hergebruikt; als een geselecteerde testbaan een live-Docker-testbaan is, bouwt de gerichte job de live-testimage lokaal voor die heruitvoering. Gegenereerde GitHub-heruitvoeringsopdrachten per testbaan bevatten `package_artifact_run_id`, `package_artifact_name`, en voorbereide image-invoerwaarden wanneer die waarden bestaan, zodat een mislukte testbaan exact hetzelfde pakket en dezelfde images uit de mislukte run kan hergebruiken.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

De geplande live/E2E-workflow draait dagelijks de volledige releasepad-Docker-suite.

## Plugin-voorrelease

`Plugin Prerelease` is duurdere product-/pakketdekking en is daarom een afzonderlijke workflow die wordt gedispatcht door `Full Release Validation` of door een expliciete operator. Normale pull requests, pushes naar `main`, en zelfstandige handmatige CI-dispatches houden die suite uitgeschakeld. De workflow verdeelt gebundelde Plugin-tests over acht extensieworkers; die extensieshardjobs draaien maximaal twee Plugin-configuratiegroepen tegelijk met één Vitest-worker per groep en een grotere Node-heap, zodat importzware Plugin-batches geen extra CI-jobs creëren. Het Docker-voorreleasepad dat alleen voor releases geldt, batcht gerichte Docker-testbanen in kleine groepen om te voorkomen dat tientallen runners worden gereserveerd voor jobs van één tot drie minuten.

## QA Lab

QA Lab heeft eigen CI-testbanen buiten de hoofdworkflow met slimme scope.

- De workflow `Parity gate` draait bij overeenkomende PR-wijzigingen en handmatige dispatch; hij bouwt de private QA-runtime en vergelijkt de mock GPT-5.5- en Opus 4.6-agentische pakketten.
- De workflow `QA-Lab - All Lanes` draait elke nacht op `main` en bij handmatige dispatch; hij verdeelt de mockpariteitsgate, live-Matrix-testbaan, en live-Telegram- en Discord-testbanen over parallelle jobs. Live-jobs gebruiken de omgeving `qa-live-shared`, en Telegram/Discord gebruiken Convex-leases.

Releasecontroles draaien Matrix- en Telegram-live-transporttestbanen met de deterministische mockprovider en mockgekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het kanaalcontract is geïsoleerd van live-modellatentie en normale opstart van provider-Plugins. De live-transport-Gateway schakelt geheugenzoeken uit omdat QA-pariteit geheugengedrag afzonderlijk dekt; providerconnectiviteit wordt gedekt door de afzonderlijke live-model-, native-provider- en Docker-provider-suites.

Matrix gebruikt `--profile fast` voor geplande en releasegates, en voegt `--fail-fast` alleen toe wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaard en handmatige workflowinvoer blijven `all`; een handmatige dispatch met `matrix_profile=all` splitst volledige Matrix-dekking altijd op in `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, en `e2ee-cli`-jobs.

`OpenClaw Release Checks` draait ook de releasekritieke QA Lab-testbanen vóór releasegoedkeuring; de QA-pariteitsgate draait de kandidaat- en referentiepakketten als parallelle testbaanjobs en downloadt daarna beide artefacten naar een kleine rapportjob voor de uiteindelijke pariteitsvergelijking.

Plaats het pad voor het landen van PR's niet achter `Parity gate`, tenzij de wijziging daadwerkelijk de QA-runtime, modelpakketpariteit of een oppervlak raakt dat de pariteitsworkflow bezit. Behandel dit voor normale kanaal-, configuratie-, docs- of unittestfixes als een optioneel signaal en volg in plaats daarvan het bewijsmateriaal van de afgebakende CI/controles.

## CodeQL

De workflow `CodeQL` is bewust een gerichte eerste beveiligingsscanner, niet de volledige repositorysweep. Dagelijkse, handmatige en niet-concept-pull-requestgate-runs scannen Actions-workflowcode plus de JavaScript/TypeScript-oppervlakken met het hoogste risico met beveiligingsqueries met hoge betrouwbaarheid, gefilterd op hoge/kritieke `security-severity`.

De pull-requestgate blijft licht: hij start alleen voor wijzigingen onder `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, of `src`, en draait dezelfde beveiligingsmatrix met hoge betrouwbaarheid als de geplande workflow. Android- en macOS-CodeQL blijven buiten de PR-standaarden.

### Beveiligingscategorieën

| Categorie                                         | Oppervlak                                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authenticatie, geheimen, sandbox, Cron en Gateway-baseline                                                                          |
| `/codeql-security-high/channel-runtime-boundary`  | Implementatiecontracten van kernkanalen plus de runtime van kanaal-Plugins, Gateway, Plugin SDK, geheimen, audit-contactpunten      |
| `/codeql-security-high/network-ssrf-boundary`     | Kern-SSRF, IP-parsing, netwerkbewaking, web-fetch, en SSRF-beleidsoppervlakken van de Plugin SDK                                    |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-servers, helpers voor procesuitvoering, uitgaande aflevering, en gates voor tooluitvoering door agents                          |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-installatie, loader, manifest, register, pakketmanagerinstallatie, bronladen, en vertrouwensoppervlakken van het pakketcontract van de Plugin SDK |

### Platformspecifieke beveiligingsshards

- `CodeQL Android Critical Security` — geplande Android-beveiligingsshard. Bouwt de Android-app handmatig voor CodeQL op de kleinste Blacksmith Linux-runner die door workflow-sanity wordt geaccepteerd. Uploadt onder `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — wekelijkse/handmatige macOS-beveiligingsshard. Bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert resultaten van dependencybuilds uit de geüploade SARIF, en uploadt onder `/codeql-critical-security/macos`. Buiten de dagelijkse standaardwaarden gehouden omdat de macOS-build de runtime domineert, zelfs wanneer die schoon is.

### Kritieke kwaliteitscategorieën

`CodeQL Critical Quality` is de bijbehorende niet-beveiligingsshard. Hij draait alleen JavaScript/TypeScript-kwaliteitsqueries met fout-ernst en zonder beveiligingsfocus over smalle oppervlakken met hoge waarde op de kleinere Blacksmith Linux-runner. De pull-requestgate is bewust kleiner dan het geplande profiel: niet-concept-PR's draaien alleen de bijbehorende shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, en `plugin-sdk-reply-runtime` voor uitvoering van agentopdrachten/-modellen/-tools en code voor antwoorddispatch, configuratieschema-/migratie-/IO-code, authenticatie-/geheimen-/sandbox-/beveiligingscode, kernkanaal en runtime van gebundelde kanaal-Plugins, Gateway-protocol-/servermethode, geheugenruntime-/SDK-koppelcode, MCP-/proces-/uitgaande aflevering, providerruntime-/modelcatalogus, sessiediagnostiek-/afleveringswachtrijen, Plugin-loader, Plugin SDK-/pakketcontract, of wijzigingen in de antwoordruntime van de Plugin SDK. Wijzigingen in CodeQL-configuratie en kwaliteitsworkflows draaien alle twaalf PR-kwaliteitsshards.

Handmatige dispatch accepteert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

De smalle profielen zijn onderwijs-/iteratiehooks om één kwaliteitsshard geïsoleerd uit te voeren.

| Categorie                                               | Oppervlak                                                                                                                                                                                |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, geheimen, sandbox, Cron en beveiligingsgrenscode van de Gateway                                                                                                                    |
| `/codeql-critical-quality/config-boundary`              | Config-schema, migratie, normalisatie en IO-contracten                                                                                                                                   |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-protocolschema's en contracten voor servermethoden                                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kernkanaal- en gebundelde kanaal-Plugin-implementatiecontracten                                                                                                                          |
| `/codeql-critical-quality/agent-runtime-boundary`       | Opdrachtuitvoering, model-/provider-dispatch, auto-reply-dispatch en wachtrijen, en runtimecontracten voor het ACP-control plane                                                        |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-servers en tool-bridges, helpers voor procesbewaking en contracten voor uitgaande aflevering                                                                                         |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory-host-SDK, memory-runtimefacades, memory-Plugin SDK-aliassen, lijmcode voor memory-runtimeactivatie en memory-doctoropdrachten                                                     |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interne reply-wachtrijen, sessie-afleverwachtrijen, helpers voor uitgaande sessiebinding/-aflevering, oppervlakken voor diagnostische event-/logbundels en CLI-contracten voor session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK-dispatch voor inkomende replies, helpers voor reply-payloads/chunking/runtime, kanaal-replyopties, afleverwachtrijen en helpers voor sessie-/threadbinding                   |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisatie van modelcatalogi, provider-auth en -ontdekking, provider-runtimeregistratie, providerstandaarden/-catalogi en registers voor web/search/fetch/embedding                   |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap van de Control UI, lokale persistentie, Gateway-control flows en runtimecontracten voor het task control plane                                                                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Runtimecontracten voor core web fetch/search, media-IO, mediabegrip, image-generation en media-generation                                                                               |
| `/codeql-critical-quality/plugin-boundary`              | Contracten voor loader, register, publiek oppervlak en Plugin SDK-entrypoints                                                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Gepubliceerde pakketkant-Plugin SDK-bron en helpers voor Plugin-pakketcontracten                                                                                                         |

Kwaliteit blijft gescheiden van beveiliging zodat kwaliteitsbevindingen kunnen worden gepland, gemeten, uitgeschakeld of uitgebreid zonder het beveiligingssignaal te vertroebelen. Uitbreiding van Swift, Python en gebundelde-Plugin CodeQL moet pas als gescopeerd of geshard vervolgwerk worden teruggezet nadat de smalle profielen een stabiele runtime en stabiel signaal hebben.

## Onderhoudsworkflows

### Docs Agent

De workflow `Docs Agent` is een eventgestuurde Codex-onderhoudslane om bestaande documentatie afgestemd te houden op recent gelande wijzigingen. Deze heeft geen puur schema: een succesvolle niet-bot push-CI-run op `main` kan hem activeren, en handmatige dispatch kan hem direct uitvoeren. Workflow-run-aanroepen worden overgeslagen wanneer `main` inmiddels is verplaatst of wanneer er in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is aangemaakt. Wanneer hij draait, beoordeelt hij het commitbereik van de vorige niet-overgeslagen Docs Agent-bron-SHA tot de huidige `main`, zodat één uurlijkse run alle main-wijzigingen kan afdekken die sinds de laatste documentatiepass zijn verzameld.

### Test Performance Agent

De workflow `Test Performance Agent` is een eventgestuurde Codex-onderhoudslane voor trage tests. Deze heeft geen puur schema: een succesvolle niet-bot push-CI-run op `main` kan hem activeren, maar hij slaat over als een andere workflow-run-aanroep die UTC-dag al heeft gedraaid of draait. Handmatige dispatch omzeilt die dagelijkse activiteitsgate. De lane bouwt een full-suite gegroepeerd Vitest-prestatierapport, laat Codex alleen kleine dekkingsbehoudende prestatieverbeteringen aan tests maken in plaats van brede refactors, voert daarna het full-suite rapport opnieuw uit en wijst wijzigingen af die het passerende baseline-testaantal verlagen. Als de baseline falende tests heeft, mag Codex alleen duidelijke fouten oplossen en moet het full-suite rapport na de agent slagen voordat er iets wordt gecommit. Wanneer `main` verder gaat voordat de bot-push landt, rebaset de lane de gevalideerde patch, voert `pnpm check:changed` opnieuw uit en probeert de push opnieuw; conflicterende verouderde patches worden overgeslagen. Hij gebruikt GitHub-gehoste Ubuntu zodat de Codex-action dezelfde drop-sudo-veiligheidshouding kan behouden als de docs-agent.

### Dubbele PR's na merge

De workflow `Duplicate PRs After Merge` is een handmatige maintainer-workflow voor het opschonen van duplicaten na landing. Standaard is dit een dry-run en worden alleen expliciet vermelde PR's gesloten wanneer `apply=true`. Voordat GitHub wordt aangepast, controleert hij of de gelande PR is gemerged en of elke duplicaat-PR ofwel een gedeeld gerefereerd issue heeft, of overlappende gewijzigde hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale check-gates en routing van wijzigingen

Lokale changed-lane-logica staat in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale check-gate is strikter over architectuurgrenzen dan de brede CI-platformscope:

- wijzigingen in core-productie voeren core-prod- en core-test-typecheck plus core-lint/guards uit;
- wijzigingen alleen in core-tests voeren alleen core-test-typecheck plus core-lint uit;
- wijzigingen in extension-productie voeren extension-prod- en extension-test-typecheck plus extension-lint uit;
- wijzigingen alleen in extension-tests voeren extension-test-typecheck plus extension-lint uit;
- wijzigingen aan publieke Plugin SDK- of Plugin-contracten breiden uit naar extension-typecheck omdat extensions afhankelijk zijn van die core-contracten (Vitest-extension-sweeps blijven expliciet testwerk);
- versiebumps met alleen releasemetadata voeren gerichte versie-/config-/root-dependency-checks uit;
- onbekende root-/config-wijzigingen falen veilig naar alle check-lanes.

Lokale changed-test-routing staat in `scripts/test-projects.test-support.mjs` en is bewust goedkoper dan `check:changed`: directe testbewerkingen voeren zichzelf uit, bronbewerkingen geven de voorkeur aan expliciete mappings, daarna siblingtests en import-graph-afhankelijken. Gedeelde group-room-afleverconfig is een van de expliciete mappings: wijzigingen aan de zichtbaar-replyconfig voor groepen, de bron-reply-aflevermodus of de systeemprompt van de message-tool lopen via de core-replytests plus Discord- en Slack-afleverregressies, zodat een gedeelde standaardwijziging faalt vóór de eerste PR-push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging zo harness-breed is dat de goedkope gemapte set geen betrouwbare proxy is.

## Testbox-validatie

Voer Testbox uit vanuit de repo-root en geef voor breed bewijs de voorkeur aan een vers opgewarmde box. Voordat je een trage gate besteedt aan een box die is hergebruikt, verlopen of net een onverwacht grote sync heeft gemeld, voer eerst `pnpm testbox:sanity` binnen de box uit.

De sanity-check faalt snel wanneer vereiste rootbestanden zoals `pnpm-lock.yaml` verdwenen zijn of wanneer `git status --short` minstens 200 getrackte verwijderingen toont. Dat betekent meestal dat de remote sync-status geen betrouwbare kopie van de PR is; stop die box en warm een nieuwe op in plaats van de producttestfout te debuggen. Stel voor opzettelijke PR's met veel verwijderingen `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor die sanity-run.

`pnpm testbox:run` beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de sync-fase blijft zonder output na de sync. Stel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` in om die guard uit te schakelen, of gebruik een grotere millisecondenwaarde voor ongewoon grote lokale diffs.

Crabbox is het repo-eigen tweede remote-box-pad voor Linux-bewijs wanneer Blacksmith niet beschikbaar is of wanneer eigen cloudcapaciteit de voorkeur heeft. Warm een box op, hydrateer deze via de projectworkflow en voer daarna opdrachten uit via de Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` beheert de standaardwaarden voor provider, sync en GitHub Actions-hydratatie. Het sluit lokale `.git` uit zodat de gehydrateerde Actions-checkout zijn eigen remote Git-metadata behoudt in plaats van maintainer-lokale remotes en object stores te synchroniseren, en het sluit lokale runtime-/buildartefacten uit die nooit mogen worden overgedragen. `.github/workflows/crabbox-hydrate.yml` beheert checkout, Node/pnpm-installatie, `origin/main`-fetch en de niet-geheime environment-overdracht die latere `crabbox run --id <cbx_id>`-opdrachten sourcen.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Ontwikkelingskanalen](/nl/install/development-channels)
