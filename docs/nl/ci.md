---
read_when:
    - Je moet begrijpen waarom een CI-taak wel of niet is uitgevoerd
    - Je debugt een mislukte GitHub Actions-controle
    - Je coördineert een releasevalidatie-uitvoering of heruitvoering
summary: CI-taakgrafiek, scopecontroles, release-overkoepelingen en lokale opdrachtequivalenten
title: CI-pijplijn
x-i18n:
    generated_at: "2026-04-30T09:35:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9c18f0801864ca1030aac9ea81117b011bd7936388984a1809ce3ae6e906e62
    source_path: ci.md
    workflow: 16
---

OpenClaw CI draait bij elke push naar `main` en elke pull request. De `preflight`-job classificeert de diff en schakelt dure lanes uit wanneer alleen niet-gerelateerde gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen smart scoping bewust en waaieren de volledige graph uit voor release candidates en brede validatie. Android-lanes blijven opt-in via `include_android`. Release-only Plugin-dekking staat in de afzonderlijke [`Plugin Prerelease`](#plugin-prerelease)-workflow en draait alleen vanuit [`Full Release Validation`](#full-release-validation) of een expliciete handmatige dispatch.

## Pipeline-overzicht

| Job                              | Doel                                                                                         | Wanneer die draait                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detecteert docs-only wijzigingen, gewijzigde scopes, gewijzigde extensies, en bouwt het CI-manifest | Altijd bij non-draft pushes en PR's |
| `security-scm-fast`              | Detectie van private keys en workflow-audit via `zizmor`                                     | Altijd bij non-draft pushes en PR's |
| `security-dependency-audit`      | Productie-lockfile-audit zonder dependencies tegen npm-advisories                            | Altijd bij non-draft pushes en PR's |
| `security-fast`                  | Vereiste aggregate voor de snelle security-jobs                                              | Altijd bij non-draft pushes en PR's |
| `check-dependencies`             | Productie-Knip dependency-only pass plus de unused-file allowlist guard                      | Node-relevante wijzigingen         |
| `build-artifacts`                | Bouwt `dist/`, Control UI, built-artifact checks, en herbruikbare downstream artifacts        | Node-relevante wijzigingen         |
| `checks-fast-core`               | Snelle Linux-correctnesslanes zoals bundled/plugin-contract/protocol-checks                  | Node-relevante wijzigingen         |
| `checks-fast-contracts-channels` | Sharded kanaalcontract-checks met een stabiel aggregate check-resultaat                      | Node-relevante wijzigingen         |
| `checks-node-core-test`          | Core Node-testshards, exclusief kanaal-, bundled-, contract- en extensielanes                | Node-relevante wijzigingen         |
| `check`                          | Sharded equivalent van de belangrijkste lokale gate: prod-types, lint, guards, test-types, en strict smoke | Node-relevante wijzigingen |
| `check-additional`               | Architectuur-, boundary-, extension-surface guards, package-boundary, en gateway-watch shards | Node-relevante wijzigingen         |
| `build-smoke`                    | Built-CLI smoke tests en startup-memory smoke                                                | Node-relevante wijzigingen         |
| `checks`                         | Verifier voor built-artifact kanaaltests                                                     | Node-relevante wijzigingen         |
| `checks-node-compat-node22`      | Node 22-compatibiliteitsbuild en smoke-lane                                                  | Handmatige CI-dispatch voor releases |
| `check-docs`                     | Docs-opmaak, lint, en broken-link checks                                                     | Docs gewijzigd                     |
| `skills-python`                  | Ruff + pytest voor Python-backed Skills                                                      | Python-skill-relevante wijzigingen |
| `checks-windows`                 | Windows-specifieke process/path-tests plus gedeelde runtime import specifier-regressies      | Windows-relevante wijzigingen      |
| `macos-node`                     | macOS TypeScript-testlane met de gedeelde built artifacts                                    | macOS-relevante wijzigingen        |
| `macos-swift`                    | Swift-lint, build, en tests voor de macOS-app                                                | macOS-relevante wijzigingen        |
| `android`                        | Android-unit tests voor beide flavors plus één debug-APK-build                               | Android-relevante wijzigingen      |
| `test-performance-agent`         | Dagelijkse Codex-optimalisatie van trage tests na vertrouwde activiteit                      | Main CI-succes of handmatige dispatch |

## Fail-fast volgorde

1. `preflight` bepaalt welke lanes überhaupt bestaan. De `docs-scope`- en `changed-scope`-logica zijn stappen binnen deze job, geen zelfstandige jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, en `skills-python` falen snel zonder te wachten op de zwaardere artifact- en platformmatrix-jobs.
3. `build-artifacts` overlapt met de snelle Linux-lanes zodat downstream consumers kunnen starten zodra de gedeelde build klaar is.
4. Zwaardere platform- en runtime-lanes waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, en `android`.

GitHub kan vervangen jobs als `cancelled` markeren wanneer een nieuwere push op dezelfde PR of `main`-ref landt. Behandel dat als CI-ruis tenzij de nieuwste run voor dezelfde ref ook faalt. Aggregate shard-checks gebruiken `!cancelled() && always()` zodat ze normale shard-fouten nog steeds rapporteren, maar niet meer in de wachtrij komen nadat de hele workflow al is vervangen. De automatische CI-concurrency key is geversioneerd (`CI-v7-*`) zodat een zombie aan GitHub-zijde in een oude queue group nieuwere main-runs niet onbeperkt kan blokkeren. Handmatige full-suite-runs gebruiken `CI-manual-v1-*` en annuleren in-progress runs niet.

## Scope en routering

Scope-logica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unit tests in `src/scripts/ci-changed-scope.test.ts`. Handmatige dispatch slaat changed-scope-detectie over en laat het preflight-manifest doen alsof elk scoped gebied is gewijzigd.

- **CI-workflowbewerkingen** valideren de Node CI-graph plus workflow-linting, maar forceren op zichzelf geen native builds voor Windows, Android, of macOS; die platformlanes blijven beperkt tot platformsourcestijzigingen.
- **CI routing-only bewerkingen, geselecteerde goedkope core-test fixture-bewerkingen, en smalle Plugin contract helper/test-routing-bewerkingen** gebruiken een snel Node-only manifestpad: `preflight`, security, en één `checks-fast-core`-taak. Dat pad slaat build artifacts, Node 22-compatibiliteit, kanaalcontracten, volledige core-shards, bundled-Plugin shards, en aanvullende guard-matrices over wanneer de wijziging beperkt is tot de routing- of helperoppervlakken die de snelle taak direct uitoefent.
- **Windows Node-checks** zijn beperkt tot Windows-specifieke process/path-wrappers, npm/pnpm/UI runner helpers, package-managerconfiguratie, en de CI-workflowoppervlakken die die lane uitvoeren; niet-gerelateerde source-, Plugin-, install-smoke- en test-only wijzigingen blijven op de Linux Node-lanes.

De traagste Node-testfamilies zijn opgesplitst of gebalanceerd zodat elke job klein blijft zonder runners te ruim te reserveren: kanaalcontracten draaien als drie gewogen shards, kleine core-unitlanes worden gekoppeld, auto-reply draait als vier gebalanceerde workers (waarbij de reply-subtree is opgesplitst in agent-runner-, dispatch-, en commands/state-routing-shards), en agentic Gateway/Plugin-configs worden verspreid over de bestaande source-only agentic Node-jobs in plaats van te wachten op built artifacts. Brede browser-, QA-, media- en diverse Plugin-tests gebruiken hun dedicated Vitest-configs in plaats van de gedeelde Plugin catch-all. Include-pattern shards registreren timingvermeldingen met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een hele config kan onderscheiden van een gefilterde shard. `check-additional` houdt package-boundary compile/canary-werk bij elkaar en scheidt runtime topology-architectuur van gateway-watch-dekking; de boundary guard shard draait zijn kleine onafhankelijke guards gelijktijdig binnen één job. Gateway watch, kanaaltests, en de core support-boundary shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd.

Android CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play debug APK. De third-party flavor heeft geen afzonderlijke source set of manifest; de unit-testlane compileert de flavor nog steeds met de SMS/call-log BuildConfig-flags, terwijl een dubbele debug-APK-packagingjob bij elke Android-relevante push wordt vermeden.

De `check-dependencies`-shard draait `pnpm deadcode:dependencies` (een productie-Knip dependency-only pass gepind op de nieuwste Knip-versie, met pnpm's minimum release age uitgeschakeld voor de `dlx`-installatie) en `pnpm deadcode:unused-files`, dat Knip's production unused-file findings vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. De unused-file guard faalt wanneer een PR een nieuw niet-beoordeeld unused file toevoegt of een verouderde allowlist-entry laat staan, terwijl intentionele dynamische Plugin-, generated-, build-, live-test-, en package bridge-oppervlakken behouden blijven die Knip niet statisch kan oplossen.

## Handmatige dispatches

Handmatige CI-dispatches draaien dezelfde job graph als normale CI, maar forceren elke non-Android scoped lane aan: Linux Node-shards, bundled-Plugin shards, kanaalcontracten, Node 22-compatibiliteit, `check`, `check-additional`, build smoke, docs-checks, Python Skills, Windows, macOS, en Control UI i18n. Zelfstandige handmatige CI-dispatches draaien Android alleen met `include_android=true`; de volledige release-umbrella schakelt Android in door `include_android=true` mee te geven. Plugin-prerelease static checks, de release-only `agentic-plugins`-shard, de volledige extension batch sweep, en Plugin-prerelease Docker-lanes zijn uitgesloten van CI. De Docker-prerelease suite draait alleen wanneer `Full Release Validation` de afzonderlijke `Plugin Prerelease`-workflow dispatcht met de release-validation gate ingeschakeld.

Handmatige runs gebruiken een unieke concurrency group zodat een release-candidate full suite niet wordt geannuleerd door een andere push- of PR-run op dezelfde ref. Met de optionele `target_ref`-input kan een vertrouwde caller die graph draaien tegen een branch, tag, of volledige commit SHA terwijl het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Uitvoerder                      | Taken                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, snelle beveiligingstaken en aggregaten (`security-scm-fast`, `security-dependency-audit`, `security-fast`), snelle protocol-/contract-/gebundelde controles, gesharde kanaalcontractcontroles, `check`-shards behalve lint, `check-additional`-shards en aggregaten, Node-testaggregaatverificateurs, docs-controles, Python Skills, workflow-sanity, labeler, auto-response; install-smoke-preflight gebruikt ook door GitHub gehoste Ubuntu zodat de Blacksmith-matrix eerder kan wachtrijen |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lichtere plugin-shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` en `check-test-types`                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node-testshards, gebundelde Plugin-testshards, `android`                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-gevoelig genoeg dat 8 vCPU meer kostte dan het bespaarde); install-smoke Docker-builds (32-vCPU-wachtrijtijd kostte meer dan het bespaarde)                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                            |

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

`Full Release Validation` is de handmatige overkoepelende workflow voor "alles uitvoeren vóór release." Deze accepteert een branch, tag of volledige commit-SHA, dispatcht de handmatige `CI`-workflow met dat doel, dispatcht `Plugin Prerelease` voor release-only Plugin-/package-/static-/Docker-bewijs, en dispatcht `OpenClaw Release Checks` voor install smoke, package-acceptatie, Docker-releasepad-suites, live/E2E, OpenWebUI, QA Lab-pariteit, Matrix en Telegram-lanes. De workflow kan ook de post-publicatie-workflow `NPM Telegram Beta E2E` uitvoeren wanneer een gepubliceerde packagespecificatie is opgegeven.

`release_profile` bepaalt de live/provider-breedte die aan releasecontroles wordt doorgegeven:

- `minimum` behoudt de snelste OpenAI-/core-releasekritieke lanes.
- `stable` voegt de stabiele provider-/backendset toe.
- `full` voert de brede adviserende provider-/mediamatrix uit.

De paraplu registreert de gedispatchte child-run-id's, en de laatste taak `Verify full validation` controleert de huidige conclusies van child-runs opnieuw en voegt tabellen met de traagste taken voor elke child-run toe. Als een child-workflow opnieuw wordt uitgevoerd en groen wordt, voer dan alleen de verifier-taak van de parent opnieuw uit om het parapluresultaat en de timingsamenvatting te vernieuwen.

Voor herstel accepteren zowel `Full Release Validation` als `OpenClaw Release Checks` `rerun_group`. Gebruik `all` voor een releasecandidate, `ci` voor alleen de normale volledige CI-child, `release-checks` voor elke release-child, of een smallere groep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` of `npm-telegram` op de paraplu. Dit houdt een mislukte releasebox-heruitvoering begrensd na een gerichte fix.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde ref één keer op te lossen naar een `release-package-under-test`-tarball, en geeft dat artifact vervolgens door aan zowel de live/E2E-releasepad-Docker-workflow als de package-acceptatieshard. Daardoor blijven de package-bytes consistent over releaseboxen heen en wordt voorkomen dat dezelfde kandidaat opnieuw wordt verpakt in meerdere child-taken.

## Live- en E2E-shards

De release-live/E2E-child behoudt brede native `pnpm test:live`-dekking, maar voert die uit als benoemde shards via `scripts/test-live-shard.mjs` in plaats van één seriële taak:

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
- opgesplitste media-audio-/video-shards en provider-gefilterde muziekshards

Dat behoudt dezelfde bestandsdekking en maakt trage live-providerfouten gemakkelijker opnieuw uit te voeren en te diagnosticeren. De aggregaatshardnamen `native-live-extensions-o-z`, `native-live-extensions-media` en `native-live-extensions-media-music` blijven geldig voor handmatige eenmalige heruitvoeringen.

De native live-mediashards draaien in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de workflow `Live Media Runner Image`. Die image installeert `ffmpeg` en `ffprobe` vooraf; mediataken verifiëren alleen de binaries vóór setup. Houd door Docker ondersteunde livesuites op normale Blacksmith-runners — containerjobs zijn de verkeerde plek om geneste Docker-tests te starten.

Door Docker ondersteunde live model-/backendshards gebruiken een aparte gedeelde image `ghcr.io/openclaw/openclaw-live-test:<sha>` per geselecteerde commit. De live-releaseworkflow bouwt en pusht die image één keer, waarna de Docker live model-, Gateway-, CLI-backend-, ACP-bind- en Codex-harness-shards draaien met `OPENCLAW_SKIP_DOCKER_BUILD=1`. Als die shards het volledige source-Dockerdoel zelfstandig opnieuw bouwen, is de release-uitvoering verkeerd geconfigureerd en verspilt die wandkloktijd aan dubbele image-builds.

## Package-acceptatie

Gebruik `Package Acceptance` wanneer de vraag is: "werkt dit installeerbare OpenClaw-package als product?" Dit verschilt van normale CI: normale CI valideert de source tree, terwijl package-acceptatie één tarball valideert via dezelfde Docker E2E-harness die gebruikers na installatie of update gebruiken.

### Taken

1. `resolve_package` checkt `workflow_ref` uit, lost één packagekandidaat op, schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het artifact `package-under-test`, en print de bron, workflow-ref, package-ref, versie, SHA-256 en profiel in de GitHub-stapsamenvatting.
2. `docker_acceptance` roept `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt dat artifact, valideert de tarball-inventaris, bereidt waar nodig package-digest-Docker-images voor en voert de geselecteerde Docker-lanes uit tegen dat package in plaats van de workflow-checkout te verpakken. Wanneer een profiel meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het package en de gedeelde images één keer voor, en waaiert die lanes vervolgens uit als parallelle gerichte Docker-taken met unieke artifacts.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Deze draait wanneer `telegram_mode` niet `none` is en installeert hetzelfde `package-under-test`-artifact wanneer Package Acceptance er één heeft opgelost; zelfstandige Telegram-dispatch kan nog steeds een gepubliceerde npm-specificatie installeren.
4. `summary` laat de workflow mislukken als package-resolutie, Docker-acceptatie of de optionele Telegram-lane is mislukt.

### Kandidaatbronnen

- `source=npm` accepteert alleen `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor gepubliceerde beta-/stabiele acceptatie.
- `source=ref` verpakt een vertrouwde `package_ref`-branch, tag of volledige commit-SHA. De resolver haalt OpenClaw-branches/tags op, verifieert dat de geselecteerde commit bereikbaar is vanuit de branchgeschiedenis van de repository of een releasetag, installeert afhankelijkheden in een losgekoppelde worktree en verpakt deze met `scripts/package-openclaw-for-docker.mjs`.
- `source=url` downloadt een HTTPS-`.tgz`; `package_sha256` is vereist.
- `source=artifact` downloadt één `.tgz` uit `artifact_run_id` en `artifact_name`; `package_sha256` is optioneel, maar moet worden opgegeven voor extern gedeelde artifacts.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde workflow-/harness-code die de test uitvoert. `package_ref` is de source-commit die wordt verpakt wanneer `source=ref`. Hierdoor kan de huidige test-harness oudere vertrouwde source-commits valideren zonder oude workflowlogica uit te voeren.

### Suite-profielen

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — volledige Docker-releasepad-chunks met OpenWebUI
- `custom` — exacte `docker_lanes`; vereist wanneer `suite_profile=custom`

Het profiel `package` gebruikt offline Plugin-dekking, zodat validatie van gepubliceerde pakketten niet afhankelijk is van live beschikbaarheid van ClawHub. De optionele Telegram-lane hergebruikt het artifact `package-under-test` in `NPM Telegram Beta E2E`, waarbij het gepubliceerde npm-spec-pad behouden blijft voor zelfstandige dispatches.

Releasechecks roepen Package Acceptance aan met `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` en `telegram_mode=mock-openai`. Docker-chunks voor het releasepad dekken de overlappende package-/update-/Plugin-lanes; Package Acceptance behoudt de artifact-native compatibiliteit voor gebundelde kanalen, offline Plugin- en Telegram-bewijs tegen dezelfde opgeloste pakket-tarball. Cross-OS-releasechecks dekken nog steeds OS-specifieke onboarding, installer- en platformgedrag; package-/update-productvalidatie moet beginnen met Package Acceptance. De Windows packaged- en installer fresh-lanes verifiëren ook dat een geïnstalleerd pakket een browser-control override kan importeren vanuit een raw absoluut Windows-pad. De OpenAI cross-OS agent-turn smoke gebruikt standaard `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer ingesteld, anders `openai/gpt-5.4-mini`, zodat het installatie- en Gateway-bewijs snel en deterministisch blijft.

### Verouderde compatibiliteitsvensters

Package Acceptance heeft begrensde vensters voor verouderde compatibiliteit voor al gepubliceerde pakketten. Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen het compatibiliteitspad gebruiken:

- bekende private QA-items in `dist/postinstall-inventory.json` mogen verwijzen naar bestanden die uit de tarball zijn weggelaten;
- `doctor-switch` mag de subcase voor persistentie van `gateway install --wrapper` overslaan wanneer het pakket die vlag niet beschikbaar stelt;
- `update-channel-switch` mag ontbrekende `pnpm.patchedDependencies` verwijderen uit de van de tarball afgeleide nep-git-fixture en mag ontbrekende gepersisteerde `update.channel` loggen;
- Plugin-smokes mogen verouderde install-record-locaties lezen of ontbrekende persistentie van marketplace-install-records accepteren;
- `plugin-update` mag migratie van configmetadata toestaan, terwijl nog steeds vereist is dat het install-record en het gedrag zonder herinstallatie ongewijzigd blijven.

Het gepubliceerde pakket `2026.4.26` mag ook waarschuwen voor lokale buildmetadatastempelbestanden die al waren verzonden. Latere pakketten moeten aan de moderne contracten voldoen; dezelfde voorwaarden falen dan in plaats van te waarschuwen of over te slaan.

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

Begin bij het debuggen van een mislukte package acceptance-run met de samenvatting `resolve_package` om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de child-run `docker_acceptance` en de Docker-artifacts daarvan: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logs, fasetimings en rerun-commando's. Geef de voorkeur aan het opnieuw uitvoeren van het mislukte pakketprofiel of de exacte Docker-lanes in plaats van volledige releasevalidatie opnieuw uit te voeren.

## Install smoke

De afzonderlijke workflow `Install Smoke` hergebruikt hetzelfde scopescript via de eigen job `preflight`. Deze splitst smoke-dekking in `run_fast_install_smoke` en `run_full_install_smoke`.

- **Snel pad** draait voor pull requests die Docker-/package-oppervlakken, wijzigingen in gebundelde Plugin-pakketten/manifests of core Plugin-/kanaal-/Gateway-/Plugin SDK-oppervlakken raken die de Docker-smoke-jobs oefenen. Alleen-source wijzigingen in gebundelde Plugins, alleen-testbewerkingen en alleen-docsbewerkingen reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image één keer, controleert de CLI, voert de CLI-smoke voor agents delete shared-workspace uit, voert de container gateway-network e2e uit, verifieert een build-arg voor gebundelde extensies en voert het begrensde gebundelde-Plugin-Docker-profiel uit onder een totale commandotime-out van 240 seconden (waarbij de Docker-run van elk scenario afzonderlijk begrensd is).
- **Volledig pad** behoudt QR-package-installatie en installer-Docker-/update-dekking voor nachtelijke geplande runs, handmatige dispatches, workflow-call-releasechecks en pull requests die werkelijk installer-/package-/Docker-oppervlakken raken. In volledige modus bereidt install-smoke één doel-SHA GHCR root-Dockerfile-smoke-image voor of hergebruikt die, en voert daarna QR-package-installatie, root-Dockerfile-/Gateway-smokes, installer-/update-smokes en de snelle gebundelde-Plugin-Docker-E2E uit als afzonderlijke jobs, zodat installerwerk niet hoeft te wachten op de root-image-smokes.

`main`-pushes (inclusief mergecommits) forceren het volledige pad niet; wanneer changed-scope-logica volledige dekking zou vragen op een push, behoudt de workflow de snelle Docker-smoke en laat deze de volledige install-smoke over aan nachtelijke of releasevalidatie.

De trage Bun global install image-provider-smoke wordt afzonderlijk gestuurd door `run_bun_global_install_smoke`. Deze draait volgens het nachtelijke schema en vanuit de releasechecks-workflow, en handmatige `Install Smoke`-dispatches kunnen ervoor kiezen deze mee te nemen, maar pull requests en `main`-pushes doen dat niet. QR- en installer-Docker-tests behouden hun eigen installatiegerichte Dockerfiles.

## Lokale Docker E2E

`pnpm test:docker:all` bouwt vooraf één gedeelde live-test-image, verpakt OpenClaw één keer als npm-tarball en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images:

- een kale Node/Git-runner voor installer-/update-/Plugin-afhankelijkheidslanes;
- een functionele image die dezelfde tarball installeert in `/app` voor normale functionaliteitslanes.

Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en voert vervolgens lanes uit met `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Instelbare waarden

| Variabele                              | Standaard | Doel                                                                                          |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Aantal slots in de main-pool voor normale lanes.                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Aantal slots in de providergevoelige tail-pool.                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limiet voor gelijktijdige live-lanes, zodat providers niet throttlen.                         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limiet voor gelijktijdige npm-install-lanes.                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limiet voor gelijktijdige multi-service-lanes.                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Spreiding tussen lane-starts om Docker-daemon-create-stormen te vermijden; stel `0` in voor geen spreiding. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Fallbacktime-out per lane (120 minuten); geselecteerde live-/tail-lanes gebruiken strakkere limieten. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset     | `1` drukt het schedulerplan af zonder lanes uit te voeren.                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset     | Door komma's gescheiden exacte lanelijst; slaat cleanup-smoke over zodat agents één mislukte lane kunnen reproduceren. |

Een lane die zwaarder is dan zijn effectieve limiet kan nog steeds starten vanuit een lege pool en draait daarna alleen totdat hij capaciteit vrijgeeft. De lokale aggregate voert Docker-preflights uit, verwijdert verouderde OpenClaw E2E-containers, schrijft actieve-lane-status weg, persisteert lanetimings voor longest-first-volgorde en stopt standaard met het plannen van nieuwe pooled lanes na de eerste fout.

### Herbruikbare live/E2E-workflow

De herbruikbare live/E2E-workflow vraagt met `scripts/test-docker-all.mjs --plan-json` welke package, imagesoort, live-image, lane en credential-dekking vereist is. `scripts/docker-e2e.mjs` zet dat plan vervolgens om in GitHub-outputs en samenvattingen. Deze verpakt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een package-artifact uit de huidige run of downloadt een package-artifact uit `package_artifact_run_id`; valideert de tarball-inventory; bouwt en pusht package-digest-getagde kale/functionele GHCR Docker E2E-images via Blacksmiths Docker-layer-cache wanneer het plan lanes met geïnstalleerde packages nodig heeft; en hergebruikt opgegeven inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` of bestaande package-digest-images in plaats van opnieuw te bouwen. Docker-image-pulls worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry-/cache-stream snel opnieuw probeert in plaats van het grootste deel van het kritieke CI-pad te verbruiken.

### Releasepad-chunks

Release-Docker-dekking draait kleinere chunked jobs met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elke chunk alleen de imagesoort ophaalt die nodig is en meerdere lanes uitvoert via dezelfde gewogen scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Huidige Docker-chunks voor releases zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` tot en met `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` en `bundled-channels-contracts`. De geaggregeerde chunk `bundled-channels` blijft beschikbaar voor handmatige eenmalige heruitvoeringen, en `plugins-runtime-core`, `plugins-runtime` en `plugins-integrations` blijven geaggregeerde plugin-/runtime-aliassen. De lane-alias `install-e2e` blijft de geaggregeerde handmatige heruitvoeringsalias voor beide provider-installatielanes. De chunk `bundled-channels` voert gesplitste lanes `bundled-channel-*` en `bundled-channel-update-*` uit in plaats van de seriële alles-in-één-lane `bundled-channel-deps`.

OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige release-paddekking daarom vraagt, en behoudt alleen een zelfstandige chunk `openwebui` voor dispatches die uitsluitend OpenWebUI betreffen. Update-lanes voor gebundelde kanalen proberen één keer opnieuw bij tijdelijke npm-netwerkfouten.

Elke chunk uploadt `.artifacts/docker-tests/` met lane-logboeken, timings, `summary.json`, `failures.json`, fasetimings, JSON voor het scheduler-plan, tabellen met trage lanes en heruitvoeringscommando's per lane. De workflow-invoer `docker_lanes` voert geselecteerde lanes uit tegen de voorbereide images in plaats van de chunk-jobs; daardoor blijft debuggen van mislukte lanes beperkt tot één gerichte Docker-job en wordt het package-artifact voor die uitvoering voorbereid, gedownload of hergebruikt. Als een geselecteerde lane een live Docker-lane is, bouwt de gerichte job de live-testimage lokaal voor die heruitvoering. Gegenereerde GitHub-heruitvoeringscommando's per lane bevatten `package_artifact_run_id`, `package_artifact_name` en voorbereide image-invoer wanneer die waarden bestaan, zodat een mislukte lane exact hetzelfde package en dezelfde images van de mislukte uitvoering kan hergebruiken.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

De geplande live/E2E-workflow voert dagelijks de volledige Docker-suite voor het release-pad uit.

## Plugin-prerelease

`Plugin Prerelease` is duurdere product-/packagedekking, dus het is een afzonderlijke workflow die wordt gedispatcht door `Full Release Validation` of door een expliciete operator. Normale pull requests, pushes naar `main` en zelfstandige handmatige CI-dispatches houden die suite uitgeschakeld. De workflow verdeelt gebundelde Plugin-tests over acht extensieworkers; die extensieshard-jobs voeren maximaal twee pluginconfiguratiegroepen tegelijk uit met één Vitest-worker per groep en een grotere Node-heap, zodat importzware pluginbatches geen extra CI-jobs aanmaken.

## QA Lab

QA Lab heeft speciale CI-lanes buiten de hoofdworkflow met slimme scope.

- De workflow `Parity gate` draait bij overeenkomende PR-wijzigingen en handmatige dispatch; hij bouwt de private QA-runtime en vergelijkt de agentische packs voor mock GPT-5.5 en Opus 4.6.
- De workflow `QA-Lab - All Lanes` draait elke nacht op `main` en bij handmatige dispatch; hij waaiert de mock-pariteitsgate, live Matrix-lane en live Telegram- en Discord-lanes uit als parallelle jobs. Live-jobs gebruiken de omgeving `qa-live-shared`, en Telegram/Discord gebruiken Convex-leases.

Releasecontroles voeren live transportlanes voor Matrix en Telegram uit met de deterministische mockprovider en mockgekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het kanaalcontract is geïsoleerd van live modellatentie en normale startup van provider-plugins. De live transport-Gateway schakelt geheugenzoeken uit omdat QA-pariteit geheugengedrag afzonderlijk dekt; providerconnectiviteit wordt gedekt door de afzonderlijke suites voor live modellen, native providers en Docker-providers.

Matrix gebruikt `--profile fast` voor geplande gates en releasegates, en voegt `--fail-fast` alleen toe wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaard en de handmatige workflow-invoer blijven `all`; handmatige dispatch met `matrix_profile=all` shardt volledige Matrix-dekking altijd in jobs voor `transport`, `media`, `e2ee-smoke`, `e2ee-deep` en `e2ee-cli`.

`OpenClaw Release Checks` voert vóór releasegoedkeuring ook de releasekritieke QA Lab-lanes uit; de QA-pariteitsgate voert de kandidaat- en baselinepacks uit als parallelle lane-jobs, en downloadt daarna beide artifacts naar een kleine rapportjob voor de uiteindelijke pariteitsvergelijking.

Plaats het PR-landingspad niet achter `Parity gate`, tenzij de wijziging daadwerkelijk raakt aan de QA-runtime, modelpackpariteit of een oppervlak dat eigendom is van de pariteitsworkflow. Behandel dit voor normale kanaal-, configuratie-, documentatie- of unit-testfixes als een optioneel signaal en volg in plaats daarvan het gescopete CI-/controlebewijs.

## CodeQL

De workflow `CodeQL` is bewust een smalle eerste securityscanner, niet de volledige repository-sweep. Dagelijkse, handmatige en niet-concept pull request-guard-uitvoeringen scannen Actions-workflowcode plus de JavaScript-/TypeScript-oppervlakken met het hoogste risico, met high-confidence beveiligingsquery's gefilterd op hoge/kritieke `security-severity`.

De pull request-guard blijft licht: hij start alleen voor wijzigingen onder `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` of `src`, en voert dezelfde high-confidence beveiligingsmatrix uit als de geplande workflow. Android- en macOS-CodeQL blijven buiten de PR-standaarden.

### Beveiligingscategorieën

| Categorie                                         | Oppervlak                                                                                                                              |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron en Gateway-baseline                                                                                       |
| `/codeql-security-high/channel-runtime-boundary`  | Implementatiecontracten voor core-kanalen plus de runtime van kanaal-plugins, Gateway, Plugin SDK, secrets, audit-aanraakpunten        |
| `/codeql-security-high/network-ssrf-boundary`     | Oppervlakken voor core-SSRF, IP-parsing, netwerkguard, web-fetch en SSRF-beleid van de Plugin SDK                                      |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-servers, helpers voor procesuitvoering, uitgaande aflevering en gates voor tooluitvoering door agents                              |
| `/codeql-security-high/plugin-trust-boundary`     | Vertrouwensoppervlakken voor Plugin-installatie, loader, manifest, registry, runtime-dependency-staging, source-loading en Plugin SDK-packagecontract |

### Platformspecifieke beveiligingsshards

- `CodeQL Android Critical Security` — geplande Android-beveiligingsshard. Bouwt de Android-app handmatig voor CodeQL op de kleinste Blacksmith Linux-runner die door workflow-sanity wordt geaccepteerd. Uploadt onder `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — wekelijkse/handmatige macOS-beveiligingsshard. Bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert buildresultaten van dependencies uit de geüploade SARIF en uploadt onder `/codeql-critical-security/macos`. Blijft buiten dagelijkse standaarden omdat de macOS-build de runtime domineert, zelfs wanneer hij schoon is.

### Critical Quality-categorieën

`CodeQL Critical Quality` is de overeenkomende niet-beveiligingsshard. Hij voert alleen foutseverity, niet-beveiligingsgerichte JavaScript-/TypeScript-kwaliteitsquery's uit over smalle waardevolle oppervlakken op de kleinere Blacksmith Linux-runner. De pull request-guard is bewust kleiner dan het geplande profiel: niet-concept PR's voeren alleen de overeenkomende shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` en `plugin-sdk-reply-runtime` uit voor wijzigingen aan agent-command-/model-/tooluitvoering en reply-dispatchcode, configuratieschema-/migratie-/IO-code, auth-/secrets-/sandbox-/beveiligingscode, core-kanaalruntime en gebundelde kanaal-pluginruntime, Gateway-protocol/servermethode, geheugenruntime/SDK-glue, MCP/proces/uitgaande aflevering, providerruntime/modelcatalogus, sessiediagnostiek/afleveringswachtrijen, pluginloader, Plugin SDK/packagecontract of Plugin SDK reply-runtime. Wijzigingen aan CodeQL-configuratie en kwaliteitsworkflows voeren alle twaalf PR-kwaliteitsshards uit.

Handmatige dispatch accepteert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

De smalle profielen zijn onderwijs-/iteratiehooks om één kwaliteitsshard geïsoleerd uit te voeren.

| Categorie                                               | Oppervlak                                                                                                                                                                             |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, geheimen, sandbox, Cron en code voor de Gateway-beveiligingsgrens                                                                                                               |
| `/codeql-critical-quality/config-boundary`              | Configuratieschema, migratie, normalisatie en IO-contracten                                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-protocolschema's en servermethodecontracten                                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementatiecontracten voor kernkanalen en gebundelde kanaal-Plugins                                                                                                                |
| `/codeql-critical-quality/agent-runtime-boundary`       | Opdrachtuitvoering, model-/providerdispatch, auto-reply-dispatch en wachtrijen, en ACP-runtimecontracten voor het control plane                                                      |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-servers en tool bridges, procesbewakingshelpers en contracten voor uitgaande levering                                                                                            |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime-facades, memory Plugin SDK-aliassen, memory runtime-activeringslijm en memory doctor-opdrachten                                                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interne reply-wachtrijen, sessieleveringswachtrijen, helpers voor uitgaande sessiebinding/-levering, oppervlakken voor diagnostische events/logbundels en sessie-doctor-CLI-contracten |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Inkomende reply-dispatch van de Plugin SDK, helpers voor reply-payload/chunking/runtime, kanaalreply-opties, leveringswachtrijen en helpers voor sessie-/threadbinding               |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisatie van modelcatalogi, provider-auth en discovery, provider-runtime-registratie, providerdefaults/-catalogi en web-/search-/fetch-/embedding-registers                      |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap van de control UI, lokale persistentie, Gateway-controlflows en runtimecontracten voor het task control plane                                                               |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Runtimecontracten voor core web fetch/search, media-IO, mediabegrip, image-generation en media-generation                                                                            |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, registry-, public-surface- en Plugin SDK-entrypointcontracten                                                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Gepubliceerde pakketkant-Plugin SDK-broncode en contracthelpers voor Plugin-pakketten                                                                                                |

Kwaliteit blijft gescheiden van beveiliging, zodat kwaliteitsbevindingen kunnen worden gepland, gemeten, uitgeschakeld of uitgebreid zonder het beveiligingssignaal te vertroebelen. Swift, Python en gebundelde-Plugin CodeQL-uitbreiding moeten pas weer worden toegevoegd als afgebakend of geshard vervolgwerk nadat de smalle profielen een stabiele runtime en stabiel signaal hebben.

## Onderhoudsworkflows

### Docs Agent

De `Docs Agent`-workflow is een event-gestuurde Codex-onderhoudslane om bestaande docs afgestemd te houden op recent gelande wijzigingen. Deze heeft geen zuiver schema: een succesvolle niet-bot push-CI-run op `main` kan hem triggeren, en manual dispatch kan hem rechtstreeks uitvoeren. Workflow-run-aanroepen worden overgeslagen wanneer `main` inmiddels verder is gegaan of wanneer in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is gemaakt. Wanneer hij draait, beoordeelt hij het commitbereik vanaf de vorige niet-overgeslagen Docs Agent-bron-SHA tot de huidige `main`, zodat één uurlijkse run alle main-wijzigingen kan dekken die sinds de laatste docspas zijn verzameld.

### Test Performance Agent

De `Test Performance Agent`-workflow is een event-gestuurde Codex-onderhoudslane voor trage tests. Deze heeft geen zuiver schema: een succesvolle niet-bot push-CI-run op `main` kan hem triggeren, maar hij wordt overgeslagen als die UTC-dag al een andere workflow-run-aanroep heeft gedraaid of draait. Manual dispatch omzeilt die dagelijkse activiteitsgate. De lane bouwt een full-suite gegroepeerd Vitest-prestatierapport, laat Codex alleen kleine dekkingsbehoudende testprestatieverbeteringen doen in plaats van brede refactors, draait daarna het full-suite rapport opnieuw en weigert wijzigingen die het baseline-aantal geslaagde tests verlagen. Als de baseline falende tests heeft, mag Codex alleen duidelijke failures oplossen en moet het full-suite rapport na de agent slagen voordat iets wordt gecommit. Wanneer `main` verder gaat voordat de bot-push landt, rebased de lane de gevalideerde patch, draait `pnpm check:changed` opnieuw en probeert de push opnieuw; conflicterende verouderde patches worden overgeslagen. De lane gebruikt GitHub-hosted Ubuntu zodat de Codex-action dezelfde drop-sudo-veiligheidshouding kan behouden als de docs agent.

### Dubbele PR's na merge

De `Duplicate PRs After Merge`-workflow is een handmatige maintainer-workflow voor duplicate cleanup na landing. Standaard is dit dry-run en worden alleen expliciet vermelde PR's gesloten wanneer `apply=true`. Voordat GitHub wordt gemuteerd, verifieert de workflow dat de gelande PR is gemerged en dat elke duplicate een gedeeld gerefereerd issue of overlappende gewijzigde hunks heeft.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale check-gates en gewijzigde routering

Lokale changed-lane-logica staat in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale check-gate is strenger over architectuurgrenzen dan de brede CI-platformscope:

- wijzigingen in core productie draaien core prod- en core test-typecheck plus core lint/guards;
- wijzigingen die alleen core tests raken, draaien alleen core test-typecheck plus core lint;
- wijzigingen in extensieproductie draaien extensie prod- en extensie test-typecheck plus extensie lint;
- wijzigingen die alleen extensietests raken, draaien extensie test-typecheck plus extensie lint;
- wijzigingen in publieke Plugin SDK of plugin-contract breiden uit naar extensie-typecheck omdat extensies van die core-contracten afhankelijk zijn (Vitest-extensiesweeps blijven expliciet testwerk);
- release-metadata-only versiebumpen draaien gerichte versie-/config-/root-dependency-checks;
- onbekende root-/configwijzigingen vallen veilig terug naar alle check-lanes.

Lokale changed-test-routering staat in `scripts/test-projects.test-support.mjs` en is bewust goedkoper dan `check:changed`: directe testbewerkingen draaien zichzelf, bronbewerkingen geven de voorkeur aan expliciete mappings, daarna sibling-tests en import-graph-afhankelijken. Gedeelde group-room delivery-configuratie is een van de expliciete mappings: wijzigingen aan de group visible-reply-config, source reply delivery mode of de message-tool system prompt lopen via de core reply-tests plus Discord- en Slack-delivery-regressies, zodat een gedeelde defaultwijziging faalt vóór de eerste PR-push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging breed genoeg is voor de harness dat de goedkope gemapte set geen betrouwbare proxy is.

## Testbox-validatie

Draai Testbox vanuit de repo-root en geef voor breed bewijs de voorkeur aan een nieuwe voorverwarmde box. Voordat je een trage gate besteedt aan een box die opnieuw is gebruikt, verlopen is of net een onverwacht grote sync rapporteerde, draai eerst `pnpm testbox:sanity` in de box.

De sanity-check faalt snel wanneer vereiste rootbestanden zoals `pnpm-lock.yaml` verdwenen zijn of wanneer `git status --short` ten minste 200 getrackte deletions toont. Dat betekent meestal dat de externe syncstatus geen betrouwbare kopie van de PR is; stop die box en warm een nieuwe op in plaats van de producttestfailure te debuggen. Voor opzettelijke PR's met grote deletions stel je `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor die sanity-run.

`pnpm testbox:run` beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de syncfase blijft zonder post-sync-output. Stel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` in om die guard uit te schakelen, of gebruik een grotere millisecondewaarde voor ongewoon grote lokale diffs.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Ontwikkelkanalen](/nl/install/development-channels)
