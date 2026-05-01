---
read_when:
    - Je moet begrijpen waarom een CI-taak wel of niet is uitgevoerd
    - Je onderzoekt een falende GitHub Actions-controle
    - Je coördineert een releasevalidatierun of een heruitvoering daarvan
summary: CI-taakgrafiek, scopecontroles, releasekoepels en lokale opdrachtequivalenten
title: CI-pijplijn
x-i18n:
    generated_at: "2026-05-01T11:15:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 679913539743f9495fffa010489ec95e05ce875751afa8a93bf8bf7045d6d9de
    source_path: ci.md
    workflow: 16
---

OpenClaw CI draait bij elke push naar `main` en elke pull request. De taak `preflight` classificeert de diff en schakelt dure lanes uit wanneer alleen niet-gerelateerde gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen bewust slimme scoping en spreiden de volledige graph uit voor release candidates en brede validatie. Android-lanes blijven opt-in via `include_android`. Release-only plugindekking bevindt zich in de aparte [`Plugin Prerelease`](#plugin-prerelease)-workflow en draait alleen vanuit [`Full Release Validation`](#full-release-validation) of een expliciete handmatige dispatch.

## Pipeline-overzicht

| Taak                             | Doel                                                                                         | Wanneer deze draait               |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Detecteert docs-only wijzigingen, gewijzigde scopes, gewijzigde plugins, en bouwt het CI-manifest | Altijd bij niet-draft pushes en PR's |
| `security-scm-fast`              | Detectie van private keys en workflowaudit via `zizmor`                                      | Altijd bij niet-draft pushes en PR's |
| `security-dependency-audit`      | Productie-lockfileaudit zonder dependencies tegen npm-advisories                             | Altijd bij niet-draft pushes en PR's |
| `security-fast`                  | Vereiste aggregate voor de snelle beveiligingstaken                                          | Altijd bij niet-draft pushes en PR's |
| `check-dependencies`             | Productie Knip dependency-only pass plus de allowlist-guard voor ongebruikte bestanden       | Node-relevante wijzigingen        |
| `build-artifacts`                | Bouwt `dist/`, Control UI, built-artifact-controles, en herbruikbare downstream artifacts     | Node-relevante wijzigingen        |
| `checks-fast-core`               | Snelle Linux-correctheidslanes zoals bundled/plugin-contract/protocol-controles              | Node-relevante wijzigingen        |
| `checks-fast-contracts-channels` | Geshaarde kanaalcontractcontroles met een stabiel aggregate controleresultaat                | Node-relevante wijzigingen        |
| `checks-node-core-test`          | Core Node-testshards, exclusief kanaal-, bundled-, contract- en pluginlanes                  | Node-relevante wijzigingen        |
| `check`                          | Geshaarde equivalent van de lokale hoofdgate: prod types, lint, guards, test types en strict smoke | Node-relevante wijzigingen    |
| `check-additional`               | Architectuur-, boundary-, plugin-surface-guards, package-boundary- en gateway-watch-shards   | Node-relevante wijzigingen        |
| `build-smoke`                    | Built-CLI-smoketests en startup-memory-smoke                                                 | Node-relevante wijzigingen        |
| `checks`                         | Verifier voor built-artifact-kanaaltests                                                     | Node-relevante wijzigingen        |
| `checks-node-compat-node22`      | Node 22-compatibiliteitsbuild en smoke-lane                                                  | Handmatige CI-dispatch voor releases |
| `check-docs`                     | Docs-formattering, lint en broken-link-controles                                             | Docs gewijzigd                    |
| `skills-python`                  | Ruff + pytest voor Python-ondersteunde Skills                                                | Python-Skills-relevante wijzigingen |
| `checks-windows`                 | Windows-specifieke proces-/padtests plus regressies voor gedeelde runtime-importspecifiers   | Windows-relevante wijzigingen     |
| `macos-node`                     | macOS TypeScript-testlane met de gedeelde gebouwde artifacts                                 | macOS-relevante wijzigingen       |
| `macos-swift`                    | Swift-lint, build en tests voor de macOS-app                                                 | macOS-relevante wijzigingen       |
| `android`                        | Android-unittests voor beide flavors plus een debug-APK-build                                | Android-relevante wijzigingen     |
| `test-performance-agent`         | Dagelijkse optimalisatie van trage Codex-tests na vertrouwde activiteit                      | Geslaagde main-CI of handmatige dispatch |

## Fail-fast-volgorde

1. `preflight` bepaalt welke lanes überhaupt bestaan. De logica voor `docs-scope` en `changed-scope` zijn stappen binnen deze taak, geen zelfstandige taken.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, en `skills-python` falen snel zonder te wachten op de zwaardere artifact- en platformmatrix-taken.
3. `build-artifacts` overlapt met de snelle Linux-lanes zodat downstream consumers kunnen starten zodra de gedeelde build klaar is.
4. Zwaardere platform- en runtime-lanes spreiden daarna uit: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, en `android`.

GitHub kan vervangen taken als `cancelled` markeren wanneer een nieuwere push op dezelfde PR- of `main`-ref landt. Behandel dat als CI-ruis, tenzij de nieuwste run voor dezelfde ref ook faalt. Aggregate shard-controles gebruiken `!cancelled() && always()` zodat ze normale shard-fouten nog steeds rapporteren, maar niet in de wachtrij komen nadat de hele workflow al is vervangen. De automatische CI-concurrencykey is geversioneerd (`CI-v7-*`) zodat een GitHub-side zombie in een oude wachtrijgroep nieuwere main-runs niet oneindig kan blokkeren. Handmatige full-suite-runs gebruiken `CI-manual-v1-*` en annuleren lopende runs niet.

## Scope en routering

Scopelogica bevindt zich in `scripts/ci-changed-scope.mjs` en wordt gedekt door unittests in `src/scripts/ci-changed-scope.test.ts`. Handmatige dispatch slaat changed-scope-detectie over en laat het preflight-manifest zich gedragen alsof elk scoped gebied is gewijzigd.

- **CI-workflowbewerkingen** valideren de Node CI-graph plus workflowlinting, maar forceren op zichzelf geen native builds voor Windows, Android of macOS; die platformlanes blijven scoped op wijzigingen in platformbroncode.
- **CI-routing-only bewerkingen, geselecteerde goedkope core-test-fixturebewerkingen, en smalle plugincontract-helper-/test-routingbewerkingen** gebruiken een snel Node-only manifestpad: `preflight`, beveiliging, en één `checks-fast-core`-taak. Dat pad slaat build artifacts, Node 22-compatibiliteit, kanaalcontracten, volledige core-shards, bundled-plugin-shards en extra guardmatrices over wanneer de wijziging beperkt is tot de routing- of helper-surfaces die de snelle taak direct test.
- **Windows Node-controles** zijn scoped op Windows-specifieke proces-/padwrappers, npm/pnpm/UI-runnerhelpers, package-managerconfiguratie, en de CI-workflow-surfaces die die lane uitvoeren; niet-gerelateerde broncode-, plugin-, install-smoke- en test-only wijzigingen blijven op de Linux Node-lanes.

De traagste Node-testfamilies zijn opgesplitst of gebalanceerd zodat elke taak klein blijft zonder runners overmatig te reserveren: kanaalcontracten draaien als drie gewogen shards, kleine core-unitlanes worden gekoppeld, auto-reply draait als vier gebalanceerde workers (waarbij de reply-subtree is opgesplitst in agent-runner-, dispatch- en commands/state-routing-shards), en agentic Gateway/plugin-configs worden verspreid over de bestaande source-only agentic Node-taken in plaats van te wachten op gebouwde artifacts. Brede browser-, QA-, media- en diverse plugintests gebruiken hun eigen Vitest-configs in plaats van de gedeelde plugin-catch-all. Include-pattern-shards registreren timingvermeldingen met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een volledige config kan onderscheiden van een gefilterde shard. `check-additional` houdt package-boundary-compile-/canary-werk bij elkaar en scheidt runtime-topologiearchitectuur van gateway-watch-dekking; de boundary-guard-shard draait zijn kleine onafhankelijke guards gelijktijdig binnen één taak. Gateway watch, kanaaltests en de core support-boundary-shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd.

Android CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play debug-APK. De third-party flavor heeft geen aparte source set of manifest; de unittests-lane compileert de flavor nog steeds met de SMS/call-log BuildConfig-flags, terwijl een dubbele debug-APK-packagingtaak bij elke Android-relevante push wordt vermeden.

De `check-dependencies`-shard draait `pnpm deadcode:dependencies` (een productie Knip dependency-only pass vastgezet op de nieuwste Knip-versie, met pnpm's minimum release age uitgeschakeld voor de `dlx`-installatie) en `pnpm deadcode:unused-files`, dat Knip's productiebevindingen voor ongebruikte bestanden vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. De unused-file-guard faalt wanneer een PR een nieuw niet-gereviewd ongebruikt bestand toevoegt of een verouderde allowlistvermelding laat staan, terwijl bewuste dynamische plugin-, gegenereerde, build-, live-test- en package-bridge-surfaces behouden blijven die Knip niet statisch kan oplossen.

## Handmatige dispatches

Handmatige CI-dispatches draaien dezelfde taakgraph als normale CI, maar forceren elke niet-Android scoped lane aan: Linux Node-shards, bundled-plugin-shards, kanaalcontracten, Node 22-compatibiliteit, `check`, `check-additional`, build smoke, docs-controles, Python Skills, Windows, macOS, en Control UI i18n. Zelfstandige handmatige CI-dispatches draaien Android alleen met `include_android=true`; de volledige release-umbrella schakelt Android in door `include_android=true` door te geven. Plugin prerelease-statische controles, de release-only `agentic-plugins`-shard, de volledige pluginbatch-sweep, en Plugin prerelease Docker-lanes zijn uitgesloten van CI. De Docker prerelease-suite draait alleen wanneer `Full Release Validation` de aparte `Plugin Prerelease`-workflow dispatcht met de release-validation-gate ingeschakeld.

Handmatige runs gebruiken een unieke concurrencygroep zodat een release-candidate full suite niet wordt geannuleerd door een andere push- of PR-run op dezelfde ref. Met de optionele `target_ref`-input kan een vertrouwde caller die graph uitvoeren tegen een branch, tag of volledige commit-SHA terwijl het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Taken                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, snelle beveiligingstaken en aggregaties (`security-scm-fast`, `security-dependency-audit`, `security-fast`), snelle protocol-/contract-/gebundelde controles, gesharde kanaalcontractcontroles, `check`-shards behalve lint, `check-additional`-shards en aggregaties, Node-testaggregatieverificaties, documentatiecontroles, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight gebruikt ook GitHub-gehoste Ubuntu zodat de Blacksmith-matrix eerder in de wachtrij kan komen |
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

`Full Release Validation` is de handmatige overkoepelende workflow voor "alles uitvoeren vóór release." Deze accepteert een branch, tag of volledige commit-SHA, start de handmatige `CI`-workflow met dat doel, start `Plugin Prerelease` voor release-specifiek Plugin-/pakket-/statisch-/Docker-bewijs, en start `OpenClaw Release Checks` voor install smoke, package acceptance, Docker release-path-suites, live/E2E, OpenWebUI, QA Lab-pariteit, Matrix en Telegram-lanes. Deze kan ook de post-publish-`NPM Telegram Beta E2E`-workflow uitvoeren wanneer een gepubliceerde pakketspecificatie is opgegeven.

Zie [Volledige releasevalidatie](/nl/reference/full-release-validation) voor de
fasematrix, exacte workflowtaaknamen, profielverschillen, artefacten en
gerichte rerun-handles.

`release_profile` bepaalt de live/provider-breedte die aan releasecontroles wordt doorgegeven. De
handmatige releaseworkflows gebruiken standaard `stable`; gebruik `full` alleen wanneer je
bewust de brede adviserende provider-/mediamatrix wilt.

- `minimum` behoudt de snelste OpenAI-/core-releasekritieke lanes.
- `stable` voegt de stabiele provider-/backendset toe.
- `full` voert de brede adviserende provider-/mediamatrix uit.

De overkoepelende workflow registreert de gestarte child-run-id's, en de uiteindelijke taak `Verify full validation` controleert de huidige conclusies van child-runs opnieuw en voegt tabellen met traagste taken toe voor elke child-run. Als een child-workflow opnieuw wordt uitgevoerd en groen wordt, voer dan alleen de parent-verificatietaak opnieuw uit om het resultaat en de timing-samenvatting van de overkoepelende workflow te vernieuwen.

Voor herstel accepteren zowel `Full Release Validation` als `OpenClaw Release Checks` `rerun_group`. Gebruik `all` voor een releasecandidate, `ci` alleen voor de normale volledige CI-child, `plugin-prerelease` alleen voor de Plugin-prerelease-child, `release-checks` voor elke release-child, of een smallere groep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` of `npm-telegram` op de overkoepelende workflow. Dit houdt het opnieuw uitvoeren van een mislukte releasebox begrensd na een gerichte fix.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde ref één keer te herleiden tot een `release-package-under-test`-tarball, en geeft dat artefact vervolgens door aan zowel de live/E2E release-path-Docker-workflow als de package-acceptance-shard. Daardoor blijven de pakketbytes consistent tussen releaseboxen en wordt voorkomen dat dezelfde candidate opnieuw wordt verpakt in meerdere child-taken.

Dubbele `Full Release Validation`-runs voor `ref=main` en `rerun_group=all`
vervangen de oudere overkoepelende workflow. De parent-monitor annuleert elke child-workflow die hij
al heeft gestart wanneer de parent wordt geannuleerd, zodat nieuwere main-validatie
niet achter een verouderde release-check-run van twee uur blijft staan. Validatie van releasebranches/-tags
en gerichte rerun-groepen behouden `cancel-in-progress: false`.

## Live- en E2E-shards

De release live/E2E-child behoudt brede native `pnpm test:live`-dekking, maar voert die uit als benoemde shards via `scripts/test-live-shard.mjs` in plaats van één seriële taak:

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
- gesplitste media-audio-/videoshards en provider-gefilterde muziekshards

Dat behoudt dezelfde bestandsdekking en maakt trage live-providerfouten gemakkelijker opnieuw uit te voeren en te diagnosticeren. De aggregaatshardnamen `native-live-extensions-o-z`, `native-live-extensions-media` en `native-live-extensions-media-music` blijven geldig voor handmatige eenmalige reruns.

De native live-mediashards draaien in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de workflow `Live Media Runner Image`. Die image installeert `ffmpeg` en `ffprobe` vooraf; mediataken verifiëren alleen de binaries vóór setup. Houd Docker-ondersteunde live-suites op normale Blacksmith-runners — containerjobs zijn de verkeerde plek om geneste Docker-tests te starten.

Docker-ondersteunde live model-/backendshards gebruiken een aparte gedeelde `ghcr.io/openclaw/openclaw-live-test:<sha>`-image per geselecteerde commit. De live-releaseworkflow bouwt en pusht die image één keer, waarna de Docker live model-, provider-gesharde Gateway-, CLI-backend-, ACP-bind- en Codex-harnessshards draaien met `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway-Docker-shards hebben expliciete scriptniveau-`timeout`-limieten onder de workflowtaak-timeout, zodat een vastgelopen container of opruimpad snel faalt in plaats van het hele release-checkbudget te verbruiken. Als die shards het volledige source-Dockerdoel zelfstandig opnieuw bouwen, is de releaserun verkeerd geconfigureerd en verspilt deze kloktijd aan dubbele image-builds.

## Package Acceptance

Gebruik `Package Acceptance` wanneer de vraag is: "werkt dit installeerbare OpenClaw-pakket als product?" Dit verschilt van normale CI: normale CI valideert de source tree, terwijl package acceptance één tarball valideert via dezelfde Docker E2E-harness die gebruikers na installatie of update gebruiken.

### Taken

1. `resolve_package` checkt `workflow_ref` uit, bepaalt één pakketkandidaat, schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het `package-under-test`-artifact en drukt de bron, workflow-ref, pakket-ref, versie, SHA-256 en profiel af in de samenvatting van de GitHub-stap.
2. `docker_acceptance` roept `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt dat artifact, valideert de tarball-inventaris, bereidt package-digest Docker-images voor wanneer nodig en voert de geselecteerde Docker-lanes uit tegen dat pakket in plaats van de workflow-checkout te packen. Wanneer een profiel meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het pakket en de gedeelde images één keer voor, en waaiert die lanes daarna uit als parallelle gerichte Docker-jobs met unieke artifacts.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Het wordt uitgevoerd wanneer `telegram_mode` niet `none` is en installeert hetzelfde `package-under-test`-artifact wanneer Package Acceptance er één heeft bepaald; zelfstandige Telegram-dispatch kan nog steeds een gepubliceerde npm-spec installeren.
4. `summary` laat de workflow falen als pakketresolutie, Docker-acceptatie of de optionele Telegram-lane is mislukt.

### Kandidaatbronnen

- `source=npm` accepteert alleen `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor gepubliceerde beta-/stabiele acceptatie.
- `source=ref` packt een vertrouwde `package_ref`-branch, tag of volledige commit-SHA. De resolver haalt OpenClaw-branches/tags op, verifieert dat de geselecteerde commit bereikbaar is vanuit de repository-branchgeschiedenis of een releasetag, installeert dependencies in een losgekoppelde worktree en packt deze met `scripts/package-openclaw-for-docker.mjs`.
- `source=url` downloadt een HTTPS `.tgz`; `package_sha256` is vereist.
- `source=artifact` downloadt één `.tgz` uit `artifact_run_id` en `artifact_name`; `package_sha256` is optioneel, maar moet worden opgegeven voor extern gedeelde artifacts.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde workflow-/harness-code die de test uitvoert. `package_ref` is de broncommit die wordt gepackt wanneer `source=ref`. Hierdoor kan de huidige testharness oudere vertrouwde broncommits valideren zonder oude workflowlogica uit te voeren.

### Suiteprofielen

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — volledige Docker-chunks van het releasepad met OpenWebUI
- `custom` — exacte `docker_lanes`; vereist wanneer `suite_profile=custom`

Het `package`-profiel gebruikt offline plugin-dekking zodat validatie van gepubliceerde pakketten niet afhankelijk is van live ClawHub-beschikbaarheid. De optionele Telegram-lane hergebruikt het `package-under-test`-artifact in `NPM Telegram Beta E2E`, waarbij het pad voor gepubliceerde npm-specs behouden blijft voor zelfstandige dispatches.

Releasecontroles roepen Package Acceptance aan met `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` en `telegram_mode=mock-openai`. Docker-chunks van het releasepad dekken de overlappende pakket-/update-/plugin-lanes; Package Acceptance behoudt het artifact-native bewijs voor bundled-channel-compatibiliteit, offline plugin en Telegram tegen dezelfde bepaalde pakket-tarball. Cross-OS-releasecontroles dekken nog steeds OS-specifieke onboarding, installer- en platformgedrag; productvalidatie voor pakketten/updates moet beginnen met Package Acceptance. De Docker-lane `published-upgrade-survivor` valideert één gepubliceerde pakketbaseline per run. In Package Acceptance is de bepaalde `package-under-test`-tarball altijd de kandidaat en selecteert `published_upgrade_survivor_baseline` de gepubliceerde fallbackbaseline, standaard `openclaw@latest`; rerun-commando's voor mislukte lanes behouden die baseline. Stel `published_upgrade_survivor_baselines=release-history` in om de lane uit te breiden over een gededupeerde geschiedenismatrix: de laatste zes stabiele releases, `2026.4.23` en de laatste stabiele release vóór `2026-03-15`. Stel `published_upgrade_survivor_scenarios=reported-issues` in om dezelfde baselines uit te breiden over issue-vormige fixtures voor Feishu-config/runtime-deps, behouden bootstrap-/persona-bestanden, tilde-logpaden en oude geversioneerde runtime-deps-roots. Lokale geaggregeerde runs kunnen exacte pakketspecs doorgeven met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, één lane behouden met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` zoals `openclaw@2026.4.15`, of `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` instellen voor de scenariomatrix. De gepubliceerde lane configureert de baseline met een ingebakken `openclaw config set`-commandorecept, registreert receptstappen in `summary.json` en controleert `/healthz`, `/readyz` plus RPC-status na Gateway-start. De Windows packaged- en installer fresh-lanes verifiëren ook dat een geïnstalleerd pakket een browser-control-override kan importeren vanuit een raw absoluut Windows-pad. De OpenAI cross-OS agent-turn smoke gebruikt standaard `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer die is ingesteld, anders `openai/gpt-5.4-mini`, zodat het installatie- en gatewaybewijs snel en deterministisch blijft.

### Legacy-compatibiliteitsvensters

Package Acceptance heeft begrensde legacy-compatibiliteitsvensters voor al gepubliceerde pakketten. Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen het compatibiliteitspad gebruiken:

- bekende private QA-vermeldingen in `dist/postinstall-inventory.json` mogen wijzen naar bestanden die uit de tarball zijn weggelaten;
- `doctor-switch` mag de subcase voor `gateway install --wrapper`-persistentie overslaan wanneer het pakket die flag niet blootstelt;
- `update-channel-switch` mag ontbrekende `pnpm.patchedDependencies` verwijderen uit de van tarball afgeleide nep-git-fixture en mag ontbrekende gepersistente `update.channel` loggen;
- plugin-smokes mogen legacy install-record-locaties lezen of ontbrekende marketplace install-record-persistentie accepteren;
- `plugin-update` mag configmetadata-migratie toestaan terwijl nog steeds vereist blijft dat het install record en no-reinstall-gedrag ongewijzigd blijven.

Het gepubliceerde pakket `2026.4.26` mag ook waarschuwen voor lokaal gebouwde metadatastempelbestanden die al zijn verzonden. Latere pakketten moeten aan de moderne contracten voldoen; dezelfde omstandigheden falen dan in plaats van te waarschuwen of over te slaan.

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

Begin bij het debuggen van een mislukte package-acceptance-run met de `resolve_package`-samenvatting om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de child-run `docker_acceptance` en de Docker-artifacts ervan: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logs, fasetimings en rerun-commando's. Geef de voorkeur aan het opnieuw uitvoeren van het mislukte pakketprofiel of de exacte Docker-lanes in plaats van volledige releasevalidatie opnieuw uit te voeren.

## Install smoke

De afzonderlijke workflow `Install Smoke` hergebruikt hetzelfde scopescript via zijn eigen `preflight`-job. Deze splitst smoke-dekking in `run_fast_install_smoke` en `run_full_install_smoke`.

- **Snel pad** wordt uitgevoerd voor pull requests die Docker-/pakketsurfaces, wijzigingen in gebundelde plugin-pakketten/-manifesten of core plugin-/channel-/gateway-/Plugin SDK-surfaces raken die de Docker-smoke-jobs oefenen. Source-only wijzigingen aan gebundelde plugins, test-only edits en docs-only edits reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image één keer, controleert de CLI, voert de CLI-smoke voor agents delete shared-workspace uit, voert de container gateway-network e2e uit, verifieert een build-arg voor gebundelde extensies en voert het begrensde gebundelde-plugin Docker-profiel uit onder een totale commandotime-out van 240 seconden (waarbij elke Docker-run van een scenario afzonderlijk wordt begrensd).
- **Volledig pad** behoudt QR-pakketinstallatie en installer Docker-/update-dekking voor nachtelijke geplande runs, handmatige dispatches, releasecontroles via workflow-call en pull requests die daadwerkelijk installer-/pakket-/Docker-surfaces raken. In volledige modus bereidt install-smoke één GHCR-root-Dockerfile-smoke-image voor de target-SHA voor of hergebruikt die, en voert daarna QR-pakketinstallatie, root-Dockerfile-/gateway-smokes, installer-/update-smokes en de snelle gebundelde-plugin Docker E2E uit als afzonderlijke jobs, zodat installerwerk niet hoeft te wachten achter de root-image-smokes.

`main`-pushes (inclusief mergecommits) forceren het volledige pad niet; wanneer changed-scope-logica volledige dekking op een push zou aanvragen, behoudt de workflow de snelle Docker-smoke en laat de volledige install-smoke over aan nachtelijke of releasevalidatie.

De trage Bun global install image-provider smoke wordt afzonderlijk bewaakt door `run_bun_global_install_smoke`. Deze draait volgens het nachtelijke schema en vanuit de releasecontroles-workflow, en handmatige `Install Smoke`-dispatches kunnen ervoor kiezen deze mee te nemen, maar pull requests en `main`-pushes doen dat niet. QR- en installer-Docker-tests behouden hun eigen install-focused Dockerfiles.

## Lokale Docker E2E

`pnpm test:docker:all` bouwt vooraf één gedeelde live-testimage, packt OpenClaw één keer als een npm-tarball en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images:

- een kale Node/Git-runner voor installer-/update-/plugin-dependency-lanes;
- een functionele image die dezelfde tarball installeert in `/app` voor normale functionaliteitslanes.

Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs` en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en voert daarna lanes uit met `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Instelbare opties

| Variabele                              | Standaardwaarde | Doel                                                                                                                                    |
| -------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10              | Aantal slots in de hoofdpool voor normale lanes.                                                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10              | Aantal slots in de tail-pool voor providergevoelige lanes.                                                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9               | Limiet voor gelijktijdige live lanes zodat providers niet gaan throttlen.                                                               |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10              | Limiet voor gelijktijdige npm-installatielanes.                                                                                         |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7               | Limiet voor gelijktijdige multi-service-lanes.                                                                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000            | Spreiding tussen lane-starts om create-stormen in de Docker-daemon te voorkomen; stel in op `0` voor geen spreiding.                    |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000         | Fallback-time-out per lane (120 minuten); geselecteerde live/tail-lanes gebruiken strakkere limieten.                                    |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | niet ingesteld  | `1` print het schedulerplan zonder lanes uit te voeren.                                                                                 |
| `OPENCLAW_DOCKER_ALL_LANES`            | niet ingesteld  | Door komma's gescheiden exacte lanelijst; slaat cleanup smoke over zodat agents één mislukte lane kunnen reproduceren.                  |

Een lane die zwaarder is dan de effectieve limiet kan nog steeds starten vanuit een lege pool en draait daarna alleen totdat hij capaciteit vrijgeeft. De lokale aggregatie voert preflights uit op Docker, verwijdert verouderde OpenClaw E2E-containers, geeft actieve-lane-status weer, bewaart lanetimings voor langste-eerst-volgorde en stopt standaard met het plannen van nieuwe gepoolde lanes na de eerste fout.

### Herbruikbare live/E2E-workflow

De herbruikbare live/E2E-workflow vraagt `scripts/test-docker-all.mjs --plan-json` welke package, image-soort, live image, lane en credentialdekking vereist zijn. `scripts/docker-e2e.mjs` zet dat plan vervolgens om in GitHub-outputs en samenvattingen. De workflow packt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een package-artifact uit de huidige run, of downloadt een package-artifact uit `package_artifact_run_id`; valideert de tarball-inventaris; bouwt en pusht package-digest-getagde bare/functional GHCR Docker E2E-images via Blacksmiths Docker-laagcache wanneer het plan package-geïnstalleerde lanes nodig heeft; en hergebruikt opgegeven `docker_e2e_bare_image`/`docker_e2e_functional_image`-inputs of bestaande package-digest-images in plaats van opnieuw te bouwen. Docker-imagepulls worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry/cache-stream snel opnieuw wordt geprobeerd in plaats van het grootste deel van het kritieke pad in CI te verbruiken.

### Release-padchunks

Release-Dockerdekking draait kleinere gechunkte jobs met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elke chunk alleen de image-soort pullt die hij nodig heeft en meerdere lanes uitvoert via dezelfde gewogen scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Huidige Release-Dockerchunks zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` tot en met `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` en `bundled-channels-contracts`. De aggregate `bundled-channels`-chunk blijft beschikbaar voor handmatige one-shot-heruitvoeringen, en `plugins-runtime-core`, `plugins-runtime` en `plugins-integrations` blijven aggregate plugin/runtime-aliassen. De lane-alias `install-e2e` blijft de aggregate alias voor handmatige heruitvoering voor beide provider-installatielanes. De `bundled-channels`-chunk draait opgesplitste `bundled-channel-*`- en `bundled-channel-update-*`-lanes in plaats van de seriële alles-in-één `bundled-channel-deps`-lane.

OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige release-paddekking dit vraagt, en behoudt alleen een zelfstandige `openwebui`-chunk voor dispatches die alleen OpenWebUI betreffen. Bundled-channel-updatelanes proberen één keer opnieuw bij tijdelijke npm-netwerkfouten.

Elke chunk uploadt `.artifacts/docker-tests/` met lanelogs, timings, `summary.json`, `failures.json`, fasetimings, schedulerplan-JSON, tabellen met langzame lanes en heruitvoercommando's per lane. De workflowinput `docker_lanes` draait geselecteerde lanes tegen de voorbereide images in plaats van de chunkjobs, waardoor foutopsporing voor mislukte lanes beperkt blijft tot één gerichte Docker-job en het package-artifact voor die run wordt voorbereid, gedownload of hergebruikt; als een geselecteerde lane een live Docker-lane is, bouwt de gerichte job de live-test-image lokaal voor die heruitvoering. Gegenereerde GitHub-heruitvoercommando's per lane bevatten `package_artifact_run_id`, `package_artifact_name` en voorbereide image-inputs wanneer die waarden bestaan, zodat een mislukte lane exact hetzelfde package en dezelfde images uit de mislukte run kan hergebruiken.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

De geplande live/E2E-workflow draait dagelijks de volledige release-pad-Docker-suite.

## Plugin-prerelease

`Plugin Prerelease` is duurdere product/package-dekking, dus het is een afzonderlijke workflow die wordt gedispatcht door `Full Release Validation` of door een expliciete operator. Normale pull requests, `main`-pushes en zelfstandige handmatige CI-dispatches laten die suite uitgeschakeld. De workflow balanceert gebundelde Plugintests over acht extensieworkers; die extensieshardjobs draaien maximaal twee Plugin-configgroepen tegelijk met één Vitest-worker per groep en een grotere Node-heap, zodat importzware Plugin-batches geen extra CI-jobs aanmaken. Het release-only Docker-prereleasepad batcht gerichte Docker-lanes in kleine groepen om te voorkomen dat tientallen runners worden gereserveerd voor jobs van één tot drie minuten.

## QA-lab

QA Lab heeft toegewezen CI-lanes buiten de hoofdworkflow met slimme scope.

- De `Parity gate`-workflow draait op overeenkomende PR-wijzigingen en handmatige dispatch; hij bouwt de private QA-runtime en vergelijkt de mock GPT-5.5- en Opus 4.6-agentic packs.
- De `QA-Lab - All Lanes`-workflow draait elke nacht op `main` en bij handmatige dispatch; hij fan-out de mock parity gate, live Matrix-lane en live Telegram- en Discord-lanes als parallelle jobs. Live jobs gebruiken de `qa-live-shared`-omgeving, en Telegram/Discord gebruiken Convex-leases.

Releasechecks draaien Matrix- en Telegram-live-transportlanes met de deterministische mockprovider en mock-gekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het channelcontract is geïsoleerd van livemodel-latentie en normale provider-Plugin-startup. De live transport-Gateway schakelt memory search uit omdat QA-pariteit memory-gedrag apart dekt; providerconnectiviteit wordt gedekt door de afzonderlijke suites voor livemodellen, native providers en Dockerproviders.

Matrix gebruikt `--profile fast` voor geplande en releasegates, en voegt alleen `--fail-fast` toe wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaardwaarde en handmatige workflowinput blijven `all`; handmatige `matrix_profile=all`-dispatch shardt volledige Matrix-dekking altijd in `transport`-, `media`-, `e2ee-smoke`-, `e2ee-deep`- en `e2ee-cli`-jobs.

`OpenClaw Release Checks` draait ook de releasekritieke QA Lab-lanes vóór releasegoedkeuring; de QA parity gate draait de candidate- en baseline-packs als parallelle lanejobs en downloadt daarna beide artifacts naar een kleine rapportjob voor de uiteindelijke pariteitsvergelijking.

Plaats het PR-landingspad niet achter `Parity gate`, tenzij de wijziging daadwerkelijk QA-runtime, model-pack-pariteit of een surface raakt waarvan de pariteitsworkflow eigenaar is. Voor normale channel-, config-, docs- of unit-test-fixes behandel je dit als een optioneel signaal en volg je in plaats daarvan het gescopete CI/check-bewijs.

## CodeQL

De `CodeQL`-workflow is bewust een smalle eerste-pass beveiligingsscanner, niet de volledige repository-sweep. Dagelijkse, handmatige en non-draft pull request guard-runs scannen Actions-workflowcode plus de hoogste-risico JavaScript/TypeScript-surfaces met high-confidence beveiligingsqueries gefilterd op hoge/kritieke `security-severity`.

De pull request guard blijft licht: hij start alleen voor wijzigingen onder `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` of `src`, en draait dezelfde high-confidence beveiligingsmatrix als de geplande workflow. Android- en macOS-CodeQL blijven buiten PR-standaarden.

### Beveiligingscategorieën

| Categorie                                         | Surface                                                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron en Gateway-baseline                                                                                        |
| `/codeql-security-high/channel-runtime-boundary`  | Core-channelimplementatiecontracten plus de channel-Plugin-runtime, Gateway, Plugin SDK, secrets, audit-aanraakpunten                  |
| `/codeql-security-high/network-ssrf-boundary`     | Core-SSRF, IP-parsing, netwerkguard, web-fetch en Plugin SDK-SSRF-beleidssurfaces                                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-servers, helpers voor procesuitvoering, outbound delivery en gates voor agent-tooluitvoering                                        |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-installatie, loader, manifest, registry, runtime-dependency-staging, source-loading en trustsurfaces van het Plugin SDK-packagecontract |

### Platformspecifieke beveiligingsshards

- `CodeQL Android Critical Security` — geplande Android-beveiligingsshard. Bouwt de Android-app handmatig voor CodeQL op de kleinste Blacksmith Linux-runner die door workflow sanity wordt geaccepteerd. Uploadt onder `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — wekelijkse/handmatige macOS-beveiligingsshard. Bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert dependency-buildresultaten uit de geüploade SARIF en uploadt onder `/codeql-critical-security/macos`. Buiten dagelijkse standaarden gehouden omdat de macOS-build de runtime domineert, zelfs wanneer deze schoon is.

### Critical Quality-categorieën

`CodeQL Critical Quality` is de overeenkomende niet-beveiligingsshard. Hij draait alleen JavaScript/TypeScript-kwaliteitsqueries met foutseverity en zonder security over smalle, waardevolle surfaces op de kleinere Blacksmith Linux-runner. De pull request guard is bewust kleiner dan het geplande profiel: non-draft PR's draaien alleen de overeenkomende `agent-runtime-boundary`-, `config-boundary`-, `core-auth-secrets`-, `channel-runtime-boundary`-, `gateway-runtime-boundary`-, `memory-runtime-boundary`-, `mcp-process-runtime-boundary`-, `provider-runtime-boundary`-, `session-diagnostics-boundary`-, `plugin-boundary`-, `plugin-sdk-package-contract`- en `plugin-sdk-reply-runtime`-shards voor agent command/model/tool-uitvoering en reply-dispatchcode, configschema/migration/IO-code, auth/secrets/sandbox/security-code, core channel en gebundelde channel-Plugin-runtime, Gateway-protocol/server-method, memory runtime/SDK-glue, MCP/proces/outbound delivery, provider-runtime/modelcatalogus, sessiediagnostiek/deliveryqueues, Plugin-loader, Plugin SDK/packagecontract, of wijzigingen in Plugin SDK reply runtime. CodeQL-config- en kwaliteitsworkflowwijzigingen draaien alle twaalf PR-kwaliteitsshards.

Handmatige dispatch accepteert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

De smalle profielen zijn onderwijs-/iteratiehaken om één kwaliteitsshard afzonderlijk uit te voeren.

| Categorie                                               | Oppervlak                                                                                                                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, geheimen, sandbox, cron en Gateway-beveiligingsgrenscode                                                                                                                       |
| `/codeql-critical-quality/config-boundary`              | Config-schema, migratie, normalisatie en IO-contracten                                                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-protocolschema's en servermethodecontracten                                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kernkanaal- en gebundelde kanaalplugin-implementatiecontracten                                                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`       | Opdrachtuitvoering, model-/providerdispatch, automatische-antwoorddispatch en wachtrijen, en ACP-control-plane-runtimecontracten                                                     |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-servers en toolbridges, helpers voor procesbewaking en contracten voor uitgaande aflevering                                                                                      |
| `/codeql-critical-quality/memory-runtime-boundary`      | Geheugenhost-SDK, geheugenruntimefacades, geheugen-Plugin SDK-aliassen, lijm voor geheugenruntimeactivatie en geheugendoctoropdrachten                                               |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interne reply-wachtrijen, sessieafleveringswachtrijen, helpers voor uitgaande sessiebinding/-aflevering, oppervlakken voor diagnostische gebeurtenen-/logbundels en CLI-contracten voor sessiedoctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK-dispatch voor inkomende replies, helpers voor reply-payloads/chunking/runtime, kanaalreply-opties, afleveringswachtrijen en helpers voor sessie-/threadbinding            |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisatie van modelcatalogus, provider-auth en -detectie, registratie van providerruntime, providerstandaarden/-catalogi en web-/zoek-/fetch-/embeddingregisters                 |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap van control-UI, lokale persistentie, Gateway-controlflows en runtimecontracten voor taak-control-plane                                                                      |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kern-webfetch/-zoekfunctionaliteit, media-IO, mediabegrip, image-generation en media-generation-runtimecontracten                                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, register-, public-surface- en Plugin SDK-entrypointcontracten                                                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Gepubliceerde package-side Plugin SDK-broncode en helpers voor pluginpackagecontracten                                                                                               |

Kwaliteit blijft gescheiden van beveiliging zodat kwaliteitsbevindingen kunnen worden gepland, gemeten, uitgeschakeld of uitgebreid zonder het beveiligingssignaal te vertroebelen. Swift-, Python- en gebundelde-plugin-CodeQL-uitbreiding moet pas weer worden toegevoegd als gescopeerd of geshard vervolgwerk nadat de smalle profielen stabiele runtime en stabiel signaal hebben.

## Onderhoudsworkflows

### Docs-agent

De `Docs Agent`-workflow is een eventgestuurde Codex-onderhoudsbaan om bestaande documentatie afgestemd te houden op recent gelande wijzigingen. Er is geen puur schema: een succesvolle niet-bot push-CI-run op `main` kan deze activeren, en handmatige dispatch kan deze direct uitvoeren. Workflow-run-aanroepen worden overgeslagen wanneer `main` is doorgeschoven of wanneer er in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is aangemaakt. Wanneer de workflow draait, beoordeelt deze het commitbereik van de vorige niet-overgeslagen Docs Agent-bron-SHA tot de huidige `main`, zodat één uurlijkse run alle main-wijzigingen kan dekken die sinds de laatste documentatieronde zijn verzameld.

### Testprestatie-agent

De `Test Performance Agent`-workflow is een eventgestuurde Codex-onderhoudsbaan voor trage tests. Er is geen puur schema: een succesvolle niet-bot push-CI-run op `main` kan deze activeren, maar deze wordt overgeslagen als er die UTC-dag al een andere workflow-run-aanroep is uitgevoerd of nog draait. Handmatige dispatch omzeilt die dagelijkse activiteitsgrens. De baan bouwt een gegroepeerd Vitest-prestatierapport voor de volledige suite, laat Codex alleen kleine testprestatieverbeteringen maken die dekking behouden in plaats van brede refactors, voert vervolgens het volledige-suiterapport opnieuw uit en weigert wijzigingen die het aantal geslaagde baseline-tests verlagen. Als de baseline falende tests heeft, mag Codex alleen duidelijke failures herstellen en moet het volledige-suiterapport na de agent slagen voordat er iets wordt gecommit. Wanneer `main` vooruitgaat voordat de bot-push landt, rebaset de baan de gevalideerde patch, voert `pnpm check:changed` opnieuw uit en probeert de push opnieuw; conflicterende verouderde patches worden overgeslagen. Deze gebruikt door GitHub gehoste Ubuntu zodat de Codex-actie dezelfde drop-sudo-veiligheidshouding kan behouden als de docs-agent.

### Dubbele PR's na merge

De `Duplicate PRs After Merge`-workflow is een handmatige maintainerworkflow voor het opschonen van duplicaten na landen. Standaard is dit een dry-run en worden alleen expliciet vermelde PR's gesloten wanneer `apply=true`. Voordat GitHub wordt gewijzigd, verifieert deze dat de gelande PR is gemerged en dat elk duplicaat óf een gedeeld gerefereerd issue heeft óf overlappende gewijzigde hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale check-gates en routering van wijzigingen

Lokale changed-lane-logica staat in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale check-gate is strenger op architectuurgrenzen dan de brede CI-platformscope:

- wijzigingen in kernproductie voeren core prod- en core test-typecheck plus core lint/guards uit;
- wijzigingen die alleen kerntests raken voeren alleen core test-typecheck plus core lint uit;
- wijzigingen in extension-productie voeren extension prod- en extension test-typecheck plus extension lint uit;
- wijzigingen die alleen extension-tests raken voeren extension test-typecheck plus extension lint uit;
- wijzigingen aan de openbare Plugin SDK of plugincontracten breiden uit naar extension-typecheck omdat extensions afhankelijk zijn van die kerncontracten (Vitest-extension-sweeps blijven expliciet testwerk);
- version bumps die alleen releasemetadata raken voeren gerichte versie-/config-/root-dependency-checks uit;
- onbekende root-/configwijzigingen falen veilig naar alle check-lanes.

Lokale changed-test-routering staat in `scripts/test-projects.test-support.mjs` en is opzettelijk goedkoper dan `check:changed`: directe testbewerkingen voeren zichzelf uit, bronbewerkingen geven de voorkeur aan expliciete mappings, daarna siblingtests en importgraaf-afhankelijken. Gedeelde group-room-afleveringsconfig is een van de expliciete mappings: wijzigingen aan de group visible-reply-config, source reply delivery mode of de message-tool system prompt lopen via de core reply-tests plus Discord- en Slack-afleveringsregressies, zodat een gedeelde standaardwijziging faalt vóór de eerste PR-push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging breed genoeg is voor de harness dat de goedkope gemapte set geen betrouwbare proxy is.

## Testbox-validatie

Voer Testbox uit vanuit de repo-root en geef voor breed bewijs de voorkeur aan een vers opgewarmde box. Voordat je een trage gate besteedt aan een box die is hergebruikt, verlopen is of net een onverwacht grote sync meldde, voer eerst `pnpm testbox:sanity` uit in de box.

De sanitycheck faalt snel wanneer vereiste rootbestanden zoals `pnpm-lock.yaml` zijn verdwenen of wanneer `git status --short` minstens 200 getrackte deletions toont. Dat betekent meestal dat de remote sync-status geen betrouwbare kopie van de PR is; stop die box en warm een nieuwe op in plaats van de producttestfailure te debuggen. Voor opzettelijke PR's met veel deletions stel je `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor die sanity-run.

`pnpm testbox:run` beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de syncfase blijft zonder output na de sync. Stel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` in om die guard uit te schakelen, of gebruik een grotere millisecondewaarde voor ongewoon grote lokale diffs.

Crabbox is het repo-eigen tweede remote-box-pad voor Linux-bewijs wanneer Blacksmith niet beschikbaar is of wanneer eigen cloudcapaciteit de voorkeur heeft. Warm een box op, hydrateer deze via de projectworkflow en voer daarna opdrachten uit via de Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` beheert provider-, sync- en GitHub Actions-hydrationstandaarden. Deze sluit lokale `.git` uit zodat de gehydrateerde Actions-checkout zijn eigen remote Git-metadata behoudt in plaats van maintainer-lokale remotes en objectstores te synchroniseren, en sluit lokale runtime-/buildartefacten uit die nooit moeten worden overgedragen. `.github/workflows/crabbox-hydrate.yml` beheert checkout, Node-/pnpm-setup, `origin/main`-fetch en de niet-geheime omgevingshandoff die latere `crabbox run --id <cbx_id>`-opdrachten sourcen.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Ontwikkelkanalen](/nl/install/development-channels)
