---
read_when:
    - Je moet begrijpen waarom een CI-taak wel of niet is uitgevoerd
    - Je debugt een falende GitHub Actions-controle
    - Je coördineert een releasevalidatierun of een herhaling daarvan
summary: CI-taakgrafiek, scopecontroles, release-overkoepelingen en equivalenten voor lokale opdrachten
title: CI-pipeline
x-i18n:
    generated_at: "2026-04-30T18:38:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: a24afc27606ac7f4e9ead89acdd319bffa23336610f8a6cd8b576ea1a5b233dd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI draait bij elke push naar `main` en elke pull request. De taak `preflight` classificeert de diff en schakelt dure lanes uit wanneer alleen niet-gerelateerde gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen bewust slimme scoping en waaieren de volledige graaf uit voor releasekandidaten en brede validatie. Android-lanes blijven opt-in via `include_android`. Release-only Plugin-dekking staat in de afzonderlijke workflow [`Plugin Prerelease`](#plugin-prerelease) en draait alleen vanuit [`Volledige Releasevalidatie`](#full-release-validation) of een expliciete handmatige dispatch.

## Pipeline-overzicht

| Taak                             | Doel                                                                                         | Wanneer deze draait                |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detecteert docs-only wijzigingen, gewijzigde scopes, gewijzigde extensies en bouwt het CI-manifest | Altijd bij niet-draft pushes en PR's |
| `security-scm-fast`              | Detectie van privésleutels en workflow-audit via `zizmor`                                    | Altijd bij niet-draft pushes en PR's |
| `security-dependency-audit`      | Dependency-free audit van productie-lockfiles tegen npm-adviezen                             | Altijd bij niet-draft pushes en PR's |
| `security-fast`                  | Vereiste aggregatie voor de snelle beveiligingstaken                                         | Altijd bij niet-draft pushes en PR's |
| `check-dependencies`             | Productie-Knip dependency-only pass plus de allowlist-guard voor ongebruikte bestanden       | Node-relevante wijzigingen         |
| `build-artifacts`                | Bouwt `dist/`, Control UI, built-artifact-controles en herbruikbare downstream-artifacts     | Node-relevante wijzigingen         |
| `checks-fast-core`               | Snelle Linux-correctheidslanes zoals bundled/plugin-contract/protocol-controles              | Node-relevante wijzigingen         |
| `checks-fast-contracts-channels` | Gesegmenteerde channel-contractcontroles met een stabiel geaggregeerd controleresultaat      | Node-relevante wijzigingen         |
| `checks-node-core-test`          | Core Node-testshards, exclusief channel-, bundled-, contract- en extensielanes               | Node-relevante wijzigingen         |
| `check`                          | Gesegmenteerd equivalent van de lokale hoofdgate: productietypen, lint, guards, testtypen en strikte smoke | Node-relevante wijzigingen |
| `check-additional`               | Architectuur-, grens-, extension-surface-guards, package-boundary- en gateway-watch-shards   | Node-relevante wijzigingen         |
| `build-smoke`                    | Built-CLI-smoketests en startup-memory-smoke                                                 | Node-relevante wijzigingen         |
| `checks`                         | Verificatie voor built-artifact-channeltests                                                 | Node-relevante wijzigingen         |
| `checks-node-compat-node22`      | Node 22-compatibiliteitsbuild en smoke-lane                                                  | Handmatige CI-dispatch voor releases |
| `check-docs`                     | Docs-formattering, lint en controles op kapotte links                                        | Docs gewijzigd                     |
| `skills-python`                  | Ruff + pytest voor Python-backed skills                                                      | Python-skill-relevante wijzigingen |
| `checks-windows`                 | Windows-specifieke proces-/padtests plus regressies in gedeelde runtime-importspecificaties  | Windows-relevante wijzigingen      |
| `macos-node`                     | macOS TypeScript-testlane met de gedeelde built artifacts                                    | macOS-relevante wijzigingen        |
| `macos-swift`                    | Swift-lint, build en tests voor de macOS-app                                                 | macOS-relevante wijzigingen        |
| `android`                        | Android-unittests voor beide flavors plus één debug-APK-build                                | Android-relevante wijzigingen      |
| `test-performance-agent`         | Dagelijkse Codex-optimalisatie van trage tests na vertrouwde activiteit                      | Succesvolle main-CI of handmatige dispatch |

## Fail-fast-volgorde

1. `preflight` bepaalt welke lanes überhaupt bestaan. De logica `docs-scope` en `changed-scope` bestaat uit stappen binnen deze taak, geen zelfstandige taken.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` en `skills-python` falen snel zonder te wachten op de zwaardere artifact- en platformmatrixtaken.
3. `build-artifacts` overlapt met de snelle Linux-lanes, zodat downstream-consumenten kunnen starten zodra de gedeelde build klaar is.
4. Zwaardere platform- en runtime-lanes waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` en `android`.

GitHub kan vervangen taken als `cancelled` markeren wanneer een nieuwere push op dezelfde PR- of `main`-ref terechtkomt. Behandel dat als CI-ruis, tenzij de nieuwste run voor dezelfde ref ook faalt. Geaggregeerde shardcontroles gebruiken `!cancelled() && always()`, zodat ze nog steeds normale shardfouten rapporteren maar niet in de wachtrij komen nadat de hele workflow al is vervangen. De automatische CI-concurrencykey is geversioneerd (`CI-v7-*`), zodat een GitHub-zombie in een oude wachtrijgroep nieuwere main-runs niet onbeperkt kan blokkeren. Handmatige full-suite-runs gebruiken `CI-manual-v1-*` en annuleren lopende runs niet.

## Scope en routering

Scopelogica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unittests in `src/scripts/ci-changed-scope.test.ts`. Handmatige dispatch slaat changed-scope-detectie over en laat het preflight-manifest doen alsof elk scoped gebied is gewijzigd.

- **CI-workflowwijzigingen** valideren de Node CI-graaf plus workflow-linting, maar forceren op zichzelf geen Windows-, Android- of macOS-native builds; die platformlanes blijven beperkt tot wijzigingen in platformsources.
- **CI-routing-only wijzigingen, geselecteerde goedkope core-test-fixturewijzigingen en smalle plugin-contract-helper/test-routing-wijzigingen** gebruiken een snel Node-only manifestpad: `preflight`, beveiliging en één `checks-fast-core`-taak. Dat pad slaat build artifacts, Node 22-compatibiliteit, channel-contracts, volledige core-shards, bundled-plugin-shards en aanvullende guardmatrices over wanneer de wijziging beperkt is tot de routing- of helperoppervlakken die de snelle taak direct oefent.
- **Windows Node-controles** zijn beperkt tot Windows-specifieke proces-/padwrappers, npm/pnpm/UI-runnerhelpers, package-managerconfiguratie en de CI-workflowoppervlakken die die lane uitvoeren; niet-gerelateerde source-, plugin-, install-smoke- en test-only wijzigingen blijven op de Linux Node-lanes.

De traagste Node-testfamilies zijn gesplitst of gebalanceerd, zodat elke taak klein blijft zonder runners te overreserveren: channel-contracts draaien als drie gewogen shards, kleine core-unitlanes worden gekoppeld, auto-reply draait als vier gebalanceerde workers (waarbij de reply-subtree is gesplitst in agent-runner-, dispatch- en commands/state-routing-shards), en agentic gateway/plugin-configuraties worden verspreid over de bestaande source-only agentic Node-taken in plaats van te wachten op built artifacts. Brede browser-, QA-, media- en diverse plugintests gebruiken hun eigen Vitest-configuraties in plaats van de gedeelde plugin catch-all. Include-pattern-shards leggen timingvermeldingen vast met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een volledige config kan onderscheiden van een gefilterde shard. `check-additional` houdt package-boundary compile/canary-werk bij elkaar en scheidt runtime-topologiearchitectuur van gateway-watch-dekking; de boundary-guard-shard voert zijn kleine onafhankelijke guards gelijktijdig binnen één taak uit. Gateway watch, channeltests en de core support-boundary-shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd.

Android CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play debug-APK. De third-party flavor heeft geen afzonderlijke source set of manifest; de unittests-lane compileert de flavor nog steeds met de SMS/call-log BuildConfig-vlaggen, terwijl een dubbele debug-APK-packagingtaak bij elke Android-relevante push wordt vermeden.

De `check-dependencies`-shard draait `pnpm deadcode:dependencies` (een productie-Knip dependency-only pass vastgezet op de nieuwste Knip-versie, met pnpm's minimale releaseleeftijd uitgeschakeld voor de `dlx`-installatie) en `pnpm deadcode:unused-files`, dat Knips productiebevindingen voor ongebruikte bestanden vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. De unused-file-guard faalt wanneer een PR een nieuw niet-beoordeeld ongebruikt bestand toevoegt of een verouderde allowlistvermelding achterlaat, terwijl opzettelijke dynamische plugin-, gegenereerde, build-, live-test- en package-bridge-oppervlakken behouden blijven die Knip niet statisch kan oplossen.

## Handmatige dispatches

Handmatige CI-dispatches draaien dezelfde taakegraaf als normale CI, maar forceren elke niet-Android scoped lane aan: Linux Node-shards, bundled-plugin-shards, channel-contracts, Node 22-compatibiliteit, `check`, `check-additional`, build smoke, docs-controles, Python skills, Windows, macOS en Control UI i18n. Zelfstandige handmatige CI-dispatches draaien Android alleen met `include_android=true`; de volledige release-umbrella schakelt Android in door `include_android=true` door te geven. Statische controles voor plugin-prerelease, de release-only `agentic-plugins`-shard, de volledige extensiebatch-sweep en plugin-prerelease-Docker-lanes zijn uitgesloten van CI. De Docker-prerelease-suite draait alleen wanneer `Volledige Releasevalidatie` de afzonderlijke workflow `Plugin Prerelease` dispatcht met de release-validation-gate ingeschakeld.

Handmatige runs gebruiken een unieke concurrencygroep, zodat een releasekandidaat-full-suite niet wordt geannuleerd door een andere push- of PR-run op dezelfde ref. Met de optionele invoer `target_ref` kan een vertrouwde caller die graaf uitvoeren tegen een branch, tag of volledige commit-SHA, terwijl het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Taken                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, snelle beveiligingstaken en aggregaties (`security-scm-fast`, `security-dependency-audit`, `security-fast`), snelle protocol-/contract-/gebundelde controles, gesharde channel-contractcontroles, `check`-shards behalve lint, `check-additional`-shards en aggregaties, Node-testaggregatieverifiers, docs-controles, Python Skills, workflow-sanity, labeler, auto-response; install-smoke-preflight gebruikt ook door GitHub gehoste Ubuntu zodat de Blacksmith-matrix eerder kan worden ingepland |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lichtere Plugin-shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` en `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node-testshards, gebundelde Plugin-testshards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-gevoelig genoeg dat 8 vCPU meer kostte dan het bespaarde); install-smoke Docker-builds (32-vCPU-wachtrijtijd kostte meer dan het bespaarde)                                                                                                                                                                                                                                                                                                                     |
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

`Full Release Validation` is de handmatige overkoepelende workflow voor "alles uitvoeren voor de release". Deze accepteert een branch, tag of volledige commit-SHA, dispatcht de handmatige `CI`-workflow met dat doel, dispatcht `Plugin Prerelease` voor release-only bewijs van Plugin/package/static/Docker, en dispatcht `OpenClaw Release Checks` voor install smoke, packageacceptatie, Docker-release-path-suites, live/E2E, OpenWebUI, QA Lab-pariteit, Matrix- en Telegram-lanes. De workflow kan ook de post-publish-workflow `NPM Telegram Beta E2E` uitvoeren wanneer een gepubliceerde packagespecificatie is opgegeven.

`release_profile` bepaalt de live/provider-breedte die wordt doorgegeven aan releasecontroles:

- `minimum` behoudt de snelste OpenAI/core releasekritieke lanes.
- `stable` voegt de stabiele provider/backend-set toe.
- `full` voert de brede adviserende provider-/mediamatrix uit.

De overkoepelende workflow registreert de gedispatchte child-run-ID's, en de laatste taak `Verify full validation` controleert de huidige conclusies van child-runs opnieuw en voegt tabellen met traagste taken toe voor elke child-run. Als een child-workflow opnieuw wordt uitgevoerd en groen wordt, voer dan alleen de parent-verifiertaak opnieuw uit om het overkoepelende resultaat en de timingsamenvatting te vernieuwen.

Voor herstel accepteren zowel `Full Release Validation` als `OpenClaw Release Checks` `rerun_group`. Gebruik `all` voor een releasecandidate, `ci` voor alleen het normale volledige CI-child, `release-checks` voor elk release-child, of een smallere groep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` of `npm-telegram` in de overkoepelende workflow. Dit houdt een heruitvoering van een mislukte releasebox na een gerichte fix begrensd.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde ref eenmaal op te lossen naar een `release-package-under-test`-tarball, en geeft dat artifact vervolgens door aan zowel de live/E2E release-path Docker-workflow als de packageacceptatieshard. Dat houdt de packagebytes consistent tussen releaseboxen en voorkomt dat dezelfde kandidaat in meerdere child-taken opnieuw wordt verpakt.

## Live- en E2E-shards

Het live/E2E-child voor de release behoudt brede native `pnpm test:live`-dekking, maar voert die uit als benoemde shards via `scripts/test-live-shard.mjs` in plaats van als één seriële taak:

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
- opgesplitste media-audio-/videoshards en provider-gefilterde muziekshards

Dat behoudt dezelfde bestandsdekking terwijl trage live-providerfouten makkelijker opnieuw kunnen worden uitgevoerd en gediagnosticeerd. De aggregaatshardnamen `native-live-extensions-o-z`, `native-live-extensions-media` en `native-live-extensions-media-music` blijven geldig voor handmatige eenmalige heruitvoeringen.

De native live-mediashards draaien in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de workflow `Live Media Runner Image`. Die image installeert vooraf `ffmpeg` en `ffprobe`; mediataken verifiëren alleen de binaries vóór de setup. Houd door Docker ondersteunde live-suites op normale Blacksmith-runners — containertaken zijn de verkeerde plek om geneste Docker-tests te starten.

Door Docker ondersteunde live model-/backendshards gebruiken een afzonderlijke gedeelde `ghcr.io/openclaw/openclaw-live-test:<sha>`-image per geselecteerde commit. De live-releaseworkflow bouwt en pusht die image één keer, waarna de Docker live model-, Gateway-, CLI-backend-, ACP bind- en Codex harness-shards draaien met `OPENCLAW_SKIP_DOCKER_BUILD=1`. Als die shards de volledige source-Docker-target onafhankelijk opnieuw bouwen, is de release-run verkeerd geconfigureerd en verspilt die wandkloktijd aan dubbele imagebuilds.

## Packageacceptatie

Gebruik `Package Acceptance` wanneer de vraag is: "werkt dit installeerbare OpenClaw-package als product?" Dit verschilt van normale CI: normale CI valideert de source-tree, terwijl packageacceptatie één tarball valideert via dezelfde Docker E2E-harness die gebruikers na installatie of update gebruiken.

### Taken

1. `resolve_package` checkt `workflow_ref` uit, lost één packagekandidaat op, schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het artifact `package-under-test`, en print de bron, workflow-ref, package-ref, versie, SHA-256 en het profiel in de GitHub-stappensamenvatting.
2. `docker_acceptance` roept `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt dat artifact, valideert de tarball-inventory, bereidt package-digest Docker-images voor wanneer nodig, en voert de geselecteerde Docker-lanes uit tegen dat package in plaats van de workflow-checkout te verpakken. Wanneer een profiel meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het package en de gedeelde images één keer voor en waaiert die lanes vervolgens uit als parallelle gerichte Docker-taken met unieke artifacts.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Deze draait wanneer `telegram_mode` niet `none` is en installeert hetzelfde artifact `package-under-test` wanneer Package Acceptance er een heeft opgelost; een zelfstandige Telegram-dispatch kan nog steeds een gepubliceerde npm-specificatie installeren.
4. `summary` laat de workflow falen als packageoplossing, Docker-acceptatie of de optionele Telegram-lane is mislukt.

### Kandidaatbronnen

- `source=npm` accepteert alleen `openclaw@beta`, `openclaw@latest` of een exacte OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor acceptatie van gepubliceerde beta/stable-versies.
- `source=ref` verpakt een vertrouwde `package_ref`-branch, tag of volledige commit-SHA. De resolver haalt OpenClaw-branches/tags op, verifieert dat de geselecteerde commit bereikbaar is vanuit de branchgeschiedenis van de repository of een releasetag, installeert afhankelijkheden in een losgekoppelde worktree en verpakt die met `scripts/package-openclaw-for-docker.mjs`.
- `source=url` downloadt een HTTPS-`.tgz`; `package_sha256` is vereist.
- `source=artifact` downloadt één `.tgz` uit `artifact_run_id` en `artifact_name`; `package_sha256` is optioneel maar moet worden opgegeven voor extern gedeelde artifacts.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde workflow-/harness-code die de test uitvoert. `package_ref` is de source-commit die wordt verpakt wanneer `source=ref`. Hierdoor kan de huidige test-harness oudere vertrouwde source-commits valideren zonder oude workflowlogica uit te voeren.

### Suite-profielen

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — volledige Docker-releasepad-chunks met OpenWebUI
- `custom` — exacte `docker_lanes`; vereist wanneer `suite_profile=custom`

Het `package`-profiel gebruikt offline plugindekking zodat validatie van gepubliceerde pakketten niet afhankelijk is van live ClawHub-beschikbaarheid. De optionele Telegram-lane hergebruikt het `package-under-test`-artifact in `NPM Telegram Beta E2E`, waarbij het gepubliceerde npm-spec-pad behouden blijft voor zelfstandige dispatches.

Releasecontroles roepen Package Acceptance aan met `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` en `telegram_mode=mock-openai`. Docker-chunks voor het releasepad dekken de overlappende package-/update-/plugin-lanes; Package Acceptance behoudt de artifact-native compatibiliteit voor gebundelde kanalen, offline plugins en Telegram-bewijs tegen dezelfde opgeloste package-tarball. Cross-OS-releasecontroles dekken nog steeds OS-specifieke onboarding, installer en platformgedrag; package-/update-productvalidatie moet beginnen met Package Acceptance. De Windows packaged- en installer fresh-lanes verifiëren ook dat een geïnstalleerd pakket een browser-control-override kan importeren vanuit een onbewerkt absoluut Windows-pad. De OpenAI cross-OS agent-turn smoke gebruikt standaard `OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer die is ingesteld, anders `openai/gpt-5.4-mini`, zodat het installatie- en Gateway-bewijs snel en deterministisch blijft.

### Vensters voor legacy-compatibiliteit

Package Acceptance heeft begrensde vensters voor legacy-compatibiliteit voor al gepubliceerde pakketten. Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen het compatibiliteitspad gebruiken:

- bekende private QA-items in `dist/postinstall-inventory.json` mogen verwijzen naar bestanden die uit de tarball zijn weggelaten;
- `doctor-switch` mag de subcase voor persistentie van `gateway install --wrapper` overslaan wanneer het pakket die flag niet exposeert;
- `update-channel-switch` mag ontbrekende `pnpm.patchedDependencies` verwijderen uit de van de tarball afgeleide nep-git-fixture en mag ontbrekende gepersisteerde `update.channel` loggen;
- plugin-smokes mogen legacy install-record-locaties lezen of ontbrekende marketplace install-record-persistentie accepteren;
- `plugin-update` mag config-metadatamigratie toestaan terwijl nog steeds wordt vereist dat de install record en het no-reinstall-gedrag ongewijzigd blijven.

Het gepubliceerde pakket `2026.4.26` mag ook waarschuwen voor lokaal gebouwde metadata-stempelbestanden die al zijn verzonden. Latere pakketten moeten voldoen aan de moderne contracten; dezelfde voorwaarden falen dan in plaats van te waarschuwen of over te slaan.

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

Begin bij het debuggen van een mislukte package acceptance-run bij de samenvatting van `resolve_package` om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de child-run `docker_acceptance` en de Docker-artifacts daarvan: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logs, fasetimings en rerun-commando's. Geef de voorkeur aan het opnieuw uitvoeren van het mislukte pakketprofiel of de exacte Docker-lanes in plaats van de volledige releasevalidatie opnieuw uit te voeren.

## Install smoke

De afzonderlijke workflow `Install Smoke` hergebruikt hetzelfde scope-script via zijn eigen `preflight`-job. Die splitst smoke-dekking in `run_fast_install_smoke` en `run_full_install_smoke`.

- **Snel pad** wordt uitgevoerd voor pull requests die Docker-/package-oppervlakken raken, wijzigingen in gebundelde pluginpakketten/manifests, of kernoppervlakken voor plugin/kanaal/Gateway/Plugin SDK die de Docker smoke-jobs uitvoeren. Source-only wijzigingen in gebundelde plugins, test-only edits en docs-only edits reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image één keer, controleert de CLI, voert de agents delete shared-workspace CLI smoke uit, voert de container gateway-network e2e uit, verifieert een build-argument voor gebundelde extensies en voert het begrensde gebundelde-plugin Docker-profiel uit onder een geaggregeerde commandotime-out van 240 seconden (waarbij elke Docker-run van een scenario afzonderlijk is begrensd).
- **Volledig pad** behoudt QR package install en installer Docker-/update-dekking voor nachtelijke geplande runs, handmatige dispatches, workflow-call-releasecontroles en pull requests die daadwerkelijk installer-/package-/Docker-oppervlakken raken. In volledige modus bereidt install-smoke één doel-SHA GHCR root-Dockerfile smoke-image voor of hergebruikt die, en voert daarna QR package install, root-Dockerfile-/Gateway-smokes, installer-/update-smokes en de snelle gebundelde-plugin Docker E2E uit als afzonderlijke jobs, zodat installer-werk niet hoeft te wachten achter de root-image-smokes.

`main`-pushes (inclusief mergecommits) forceren het volledige pad niet; wanneer changed-scope-logica volledige dekking op een push zou aanvragen, behoudt de workflow de snelle Docker smoke en laat de volledige install smoke over aan nachtelijke of releasevalidatie.

De trage Bun global install image-provider smoke wordt apart bewaakt door `run_bun_global_install_smoke`. Die draait op de nachtelijke planning en vanuit de releasecontroles-workflow, en handmatige `Install Smoke`-dispatches kunnen ervoor kiezen die mee te nemen, maar pull requests en `main`-pushes doen dat niet. QR- en installer-Docker-tests behouden hun eigen installatiegerichte Dockerfiles.

## Lokale Docker E2E

`pnpm test:docker:all` prebuildt één gedeelde live-test-image, verpakt OpenClaw één keer als npm-tarball en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images:

- een kale Node/Git-runner voor installer-/update-/plugin-dependency-lanes;
- een functionele image die dezelfde tarball in `/app` installeert voor normale functionaliteitslanes.

Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en voert daarna lanes uit met `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Instelbare opties

| Variabele                              | Standaard | Doel                                                                                          |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Aantal slots in de hoofdpool voor normale lanes.                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Aantal slots in de provider-gevoelige tail-pool.                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limiet voor gelijktijdige live-lanes zodat providers niet throttlen.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limiet voor gelijktijdige npm-install-lanes.                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limiet voor gelijktijdige multi-service-lanes.                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Spreiding tussen lane-starts om Docker-daemon create-stormen te vermijden; stel `0` in voor geen spreiding. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Fallbacktime-out per lane (120 minuten); geselecteerde live-/tail-lanes gebruiken strakkere limieten. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset     | `1` print het schedulerplan zonder lanes uit te voeren.                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset     | Door komma's gescheiden exacte lanelijst; slaat cleanup smoke over zodat agents één mislukte lane kunnen reproduceren. |

Een lane die zwaarder is dan zijn effectieve limiet kan nog steeds starten vanuit een lege pool, en draait daarna alleen totdat hij capaciteit vrijgeeft. De lokale geaggregeerde preflights controleren Docker, verwijderen verouderde OpenClaw E2E-containers, geven actieve-lane-status weer, bewaren lanetimings voor langste-eerst-ordening en stoppen standaard met het plannen van nieuwe gepoolde lanes na de eerste fout.

### Herbruikbare live/E2E-workflow

De herbruikbare live/E2E-workflow vraagt `scripts/test-docker-all.mjs --plan-json` welke package-, image-kind-, live-image-, lane- en credential-dekking vereist is. `scripts/docker-e2e.mjs` zet dat plan vervolgens om in GitHub-outputs en samenvattingen. Het verpakt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een current-run package-artifact of downloadt een package-artifact uit `package_artifact_run_id`; valideert de tarball-inventory; bouwt en pusht package-digest-getagde bare/functional GHCR Docker E2E-images via Blacksmiths Docker-laagcache wanneer het plan package-installed lanes nodig heeft; en hergebruikt opgegeven inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` of bestaande package-digest-images in plaats van opnieuw te bouwen. Docker-image-pulls worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry-/cachestream snel opnieuw probeert in plaats van het grootste deel van het kritieke CI-pad te verbruiken.

### Releasepad-chunks

Release-Docker-dekking draait kleinere gechunkte jobs met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elke chunk alleen het image-kind ophaalt dat hij nodig heeft en meerdere lanes uitvoert via dezelfde gewogen scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

De huidige Docker-chunks voor releases zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` tot en met `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` en `bundled-channels-contracts`. De geaggregeerde chunk `bundled-channels` blijft beschikbaar voor handmatige eenmalige herruns, en `plugins-runtime-core`, `plugins-runtime` en `plugins-integrations` blijven geaggregeerde aliassen voor Plugin/runtime. De lane-alias `install-e2e` blijft de geaggregeerde handmatige herrun-alias voor beide providerinstaller-lanes. De chunk `bundled-channels` voert gesplitste lanes `bundled-channel-*` en `bundled-channel-update-*` uit in plaats van de seriële alles-in-één-lane `bundled-channel-deps`.

OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige dekking van het releasepad daarom vraagt, en behoudt alleen een zelfstandige chunk `openwebui` voor dispatches die uitsluitend OpenWebUI betreffen. Update-lanes voor gebundelde kanalen proberen het één keer opnieuw bij tijdelijke npm-netwerkfouten.

Elke chunk uploadt `.artifacts/docker-tests/` met lane-logs, timings, `summary.json`, `failures.json`, fasetimings, schedulerplan-JSON, tabellen met trage lanes en herrun-commando's per lane. De workflow-invoer `docker_lanes` voert geselecteerde lanes uit tegen de voorbereide images in plaats van de chunk-jobs, waardoor debugging van mislukte lanes beperkt blijft tot één gerichte Docker-job en het package-artifact voor die run wordt voorbereid, gedownload of hergebruikt; als een geselecteerde lane een live Docker-lane is, bouwt de gerichte job lokaal de live-testimage voor die herrun. Gegenereerde GitHub-herrun-commando's per lane bevatten `package_artifact_run_id`, `package_artifact_name` en voorbereide image-invoer wanneer die waarden bestaan, zodat een mislukte lane exact hetzelfde package en dezelfde images uit de mislukte run kan hergebruiken.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

De geplande live/E2E-workflow voert dagelijks de volledige Docker-suite voor het releasepad uit.

## Plugin-prerelease

`Plugin Prerelease` is duurdere product/package-dekking, dus het is een afzonderlijke workflow die wordt gedispatcht door `Full Release Validation` of door een expliciete operator. Normale pull requests, pushes naar `main` en zelfstandige handmatige CI-dispatches laten die suite uitgeschakeld. De workflow verdeelt gebundelde Plugin-tests over acht extensieworkers; die extensieshard-jobs voeren maximaal twee Plugin-configuratiegroepen tegelijk uit, met één Vitest-worker per groep en een grotere Node-heap, zodat import-zware Plugin-batches geen extra CI-jobs aanmaken.

## QA-lab

QA-lab heeft eigen CI-lanes buiten de hoofdworkflow met slimme scoping.

- De workflow `Parity gate` draait bij overeenkomende PR-wijzigingen en handmatige dispatch; hij bouwt de private QA-runtime en vergelijkt de mock GPT-5.5- en Opus 4.6-agentic-packs.
- De workflow `QA-Lab - All Lanes` draait elke nacht op `main` en bij handmatige dispatch; hij waaiert de mock parity gate, live Matrix-lane en live Telegram- en Discord-lanes uit als parallelle jobs. Live jobs gebruiken de omgeving `qa-live-shared`, en Telegram/Discord gebruiken Convex-leases.

Releasechecks voeren live transport-lanes voor Matrix en Telegram uit met de deterministische mockprovider en mock-gekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het kanaalcontract is geïsoleerd van live-modellatentie en normale opstart van provider-Plugins. De live transport-Gateway schakelt geheugenzoekopdrachten uit, omdat QA-pariteit geheugengedrag afzonderlijk afdekt; providerconnectiviteit wordt afgedekt door de afzonderlijke suites voor live modellen, native providers en Docker-providers.

Matrix gebruikt `--profile fast` voor geplande en release-gates, en voegt `--fail-fast` alleen toe wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaard en handmatige workflow-invoer blijven `all`; handmatige dispatch met `matrix_profile=all` shardt volledige Matrix-dekking altijd in de jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` en `e2ee-cli`.

`OpenClaw Release Checks` voert ook de releasekritieke QA-lab-lanes uit vóór releasegoedkeuring; de QA-parity gate voert de candidate- en baseline-packs uit als parallelle lane-jobs, en downloadt daarna beide artifacts naar een kleine rapportjob voor de uiteindelijke pariteitsvergelijking.

Plaats het PR-landingspad niet achter `Parity gate`, tenzij de wijziging daadwerkelijk de QA-runtime, model-pack-pariteit of een oppervlak raakt dat eigendom is van de parity-workflow. Behandel dit bij normale oplossingen voor kanalen, configuratie, documentatie of unit-tests als een optioneel signaal en volg in plaats daarvan het bewijs uit de gescopete CI/checks.

## CodeQL

De workflow `CodeQL` is bewust een smalle beveiligingsscanner voor de eerste pass, niet de volledige repository-sweep. Dagelijkse, handmatige en niet-draft pull-request-guard-runs scannen Actions-workflowcode plus de JavaScript/TypeScript-oppervlakken met het hoogste risico, met high-confidence beveiligingsqueries gefilterd op hoge/kritieke `security-severity`.

De pull-request-guard blijft licht: hij start alleen voor wijzigingen onder `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` of `src`, en voert dezelfde high-confidence beveiligingsmatrix uit als de geplande workflow. Android- en macOS-CodeQL blijven buiten de PR-standaarden.

### Beveiligingscategorieën

| Categorie                                         | Oppervlak                                                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, geheimen, sandbox, cron en Gateway-baseline                                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | Implementatiecontracten voor core-kanalen plus de kanaal-Plugin-runtime, Gateway, Plugin SDK, geheimen, audit-aanraakpunten          |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP-parsing, netwerkguard, web-fetch en SSRF-beleidsoppervlakken van Plugin SDK                                             |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-servers, helpers voor procesuitvoering, outbound delivery en gates voor tooluitvoering door agents                                |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-installatie, loader, manifest, registry, staging van runtime-afhankelijkheden, source-loading en trust-oppervlakken van het Plugin SDK-packagecontract |

### Platformspecifieke beveiligingsshards

- `CodeQL Android Critical Security` — geplande Android-beveiligingsshard. Bouwt de Android-app handmatig voor CodeQL op de kleinste Blacksmith Linux-runner die door workflow-sanity wordt geaccepteerd. Uploadt onder `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — wekelijkse/handmatige macOS-beveiligingsshard. Bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert buildresultaten van dependencies uit de geüploade SARIF en uploadt onder `/codeql-critical-security/macos`. Blijft buiten de dagelijkse standaarden omdat de macOS-build de runtime domineert, zelfs wanneer die schoon is.

### Critical Quality-categorieën

`CodeQL Critical Quality` is de overeenkomende niet-beveiligingsshard. Hij voert alleen JavaScript/TypeScript-kwaliteitsqueries met error-severity en zonder beveiligingskarakter uit over smalle, waardevolle oppervlakken op de kleinere Blacksmith Linux-runner. De pull-request-guard is bewust kleiner dan het geplande profiel: niet-draft PR's voeren alleen de overeenkomende shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` en `plugin-sdk-reply-runtime` uit voor wijzigingen in agent-commando/model/tooluitvoering en reply-dispatchcode, configuratieschema/migratie/IO-code, auth/geheimen/sandbox/beveiligingscode, runtime van core-kanalen en gebundelde kanaal-Plugins, Gateway-protocol/server-method, memory-runtime/SDK-glue, MCP/proces/outbound delivery, provider-runtime/modelcatalogus, sessiediagnostiek/delivery queues, Plugin-loader, Plugin SDK/packagecontract of Plugin SDK-reply-runtime. Wijzigingen in CodeQL-configuratie en kwaliteitsworkflows voeren alle twaalf PR-kwaliteitsshards uit.

Handmatige dispatch accepteert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

De smalle profielen zijn onderwijs-/iteratiehooks om één kwaliteitsshard geïsoleerd uit te voeren.

| Categorie                                               | Oppervlak                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth-, geheimen-, sandbox-, Cron- en Gateway-beveiligingsgrenscode                                                                                                |
| `/codeql-critical-quality/config-boundary`              | Configuratieschema, migratie, normalisatie en IO-contracten                                                                                                       |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-protocolschema's en servermethodecontracten                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Corekanaal- en gebundelde kanaal-Plugin-implementatiecontracten                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | Opdrachtuitvoering, model-/provider-dispatch, auto-reply-dispatch en wachtrijen, en ACP-control-plane-runtimecontracten                                           |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-servers en toolbruggen, processupervisiehelpers en uitgaande afleveringscontracten                                                                             |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory-host-SDK, memory-runtimefacades, memory-Plugin SDK-aliassen, memory-runtime-activeringslijm en memory-doctor-opdrachten                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply-wachtrij-internals, sessieafleveringswachtrijen, uitgaande sessiebinding-/afleveringshelpers, diagnostische event-/logbundeloppervlakken en sessiedoctor-CLI-contracten |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK-dispatch van inkomende replies, reply-payload-/chunking-/runtimehelpers, kanaalreply-opties, afleveringswachtrijen en sessie-/threadbindinghelpers     |
| `/codeql-critical-quality/provider-runtime-boundary`    | Modelcatalogusnormalisatie, providerauthenticatie en -discovery, provider-runtimeregistratie, providerstandaarden/-catalogi, en web-/zoek-/fetch-/embeddingregisters |
| `/codeql-critical-quality/ui-control-plane`             | Control UI-bootstrap, lokale persistentie, Gateway-controlflows en task-control-plane-runtimecontracten                                                            |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core webfetch/-zoekopdrachten, media-IO, mediabegrip, image-generation- en media-generation-runtimecontracten                                                     |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, register-, public-surface- en Plugin SDK-entrypointcontracten                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Gepubliceerde package-side Plugin SDK-bron en helpers voor Plugin-packagecontracten                                                                                |

Kwaliteit blijft gescheiden van beveiliging zodat kwaliteitsbevindingen kunnen worden gepland, gemeten, uitgeschakeld of uitgebreid zonder het beveiligingssignaal te vertroebelen. Swift-, Python- en gebundelde-Plugin-CodeQL-uitbreiding moet alleen als scoped of geshard follow-upwerk worden teruggezet nadat de smalle profielen een stabiele runtime en stabiel signaal hebben.

## Onderhoudsworkflows

### Docs Agent

De `Docs Agent`-workflow is een eventgedreven Codex-onderhoudslane om bestaande docs afgestemd te houden op recent gelande wijzigingen. Hij heeft geen zuiver schema: een succesvolle niet-bot push-CI-run op `main` kan hem triggeren, en manual dispatch kan hem direct uitvoeren. Workflow-run-aanroepen slaan over wanneer `main` inmiddels verder is of wanneer er in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is aangemaakt. Wanneer hij draait, beoordeelt hij het commitbereik van de vorige niet-overgeslagen Docs Agent-bron-SHA tot de huidige `main`, zodat één uurlijkse run alle main-wijzigingen kan dekken die sinds de laatste docs-pass zijn verzameld.

### Test Performance Agent

De `Test Performance Agent`-workflow is een eventgedreven Codex-onderhoudslane voor trage tests. Hij heeft geen zuiver schema: een succesvolle niet-bot push-CI-run op `main` kan hem triggeren, maar hij slaat over als er op die UTC-dag al een andere workflow-run-aanroep heeft gedraaid of draait. Manual dispatch omzeilt die dagelijkse activiteitsgate. De lane bouwt een full-suite gegroepeerd Vitest-prestatierapport, laat Codex alleen kleine dekkingsbehoudende testprestatieverbeteringen maken in plaats van brede refactors, draait daarna het full-suite rapport opnieuw en wijst wijzigingen af die het baseline-aantal geslaagde tests verminderen. Als de baseline falende tests heeft, mag Codex alleen duidelijke fouten repareren en moet het full-suite rapport na de agent slagen voordat er iets wordt gecommit. Wanneer `main` verdergaat voordat de bot-push landt, rebaset de lane de gevalideerde patch, draait `pnpm check:changed` opnieuw en probeert de push opnieuw; conflicterende verouderde patches worden overgeslagen. Hij gebruikt GitHub-hosted Ubuntu zodat de Codex-action dezelfde drop-sudo-veiligheidshouding kan behouden als de docs-agent.

### Dubbele PR's na merge

De `Duplicate PRs After Merge`-workflow is een handmatige maintainer-workflow voor het opruimen van duplicaten na landen. Hij staat standaard op dry-run en sluit alleen expliciet vermelde PR's wanneer `apply=true`. Voordat hij GitHub muteert, controleert hij of de gelande PR is gemerged en of elk duplicaat ofwel een gedeeld gerefereerd issue heeft of overlappende gewijzigde hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale checkgates en gewijzigde routing

Lokale changed-lane-logica leeft in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale checkgate is strenger over architectuurgrenzen dan de brede CI-platformscope:

- coreproductiewijzigingen draaien core prod- en core test-typecheck plus core lint/guards;
- wijzigingen die alleen coretests raken draaien alleen core test-typecheck plus core lint;
- extensieproductiewijzigingen draaien extensie prod- en extensie test-typecheck plus extensie lint;
- wijzigingen die alleen extensietests raken draaien extensie test-typecheck plus extensie lint;
- publieke Plugin SDK- of Plugin-contractwijzigingen breiden uit naar extensietypecheck omdat extensies afhankelijk zijn van die corecontracten (Vitest-extensiesweeps blijven expliciet testwerk);
- release-metadata-only versiebumps draaien gerichte versie-/config-/rootdependency-checks;
- onbekende root-/configwijzigingen falen veilig naar alle checklanes.

Lokale changed-test-routing leeft in `scripts/test-projects.test-support.mjs` en is bewust goedkoper dan `check:changed`: directe testbewerkingen draaien zichzelf, bronbewerkingen geven de voorkeur aan expliciete mappings, daarna siblingtests en import-graph-afhankelijken. Gedeelde group-room-afleveringsconfiguratie is een van de expliciete mappings: wijzigingen aan de group-visible-reply-configuratie, source-reply-afleveringsmodus of de message-tool-systeemprompt lopen via de core reply-tests plus Discord- en Slack-afleveringsregressies zodat een gedeelde standaardwijziging faalt vóór de eerste PR-push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging harness-breed genoeg is dat de goedkope gemapte set geen betrouwbare proxy is.

## Testbox-validatie

Draai Testbox vanuit de repo-root en geef voor brede bewijsvoering de voorkeur aan een vers opgewarmde box. Voordat je een trage gate besteedt aan een box die is hergebruikt, verlopen is of net een onverwacht grote sync meldde, draai je eerst `pnpm testbox:sanity` binnen de box.

De sanity-check faalt snel wanneer vereiste rootbestanden zoals `pnpm-lock.yaml` zijn verdwenen of wanneer `git status --short` minstens 200 gevolgde verwijderingen toont. Dat betekent meestal dat de remote sync-state geen betrouwbare kopie van de PR is; stop die box en warm een verse op in plaats van de producttestfout te debuggen. Stel voor opzettelijke PR's met veel verwijderingen `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor die sanity-run.

`pnpm testbox:run` beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de sync-fase blijft zonder post-sync-uitvoer. Stel `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` in om die guard uit te schakelen, of gebruik een grotere millisecondenwaarde voor ongewoon grote lokale diffs.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Ontwikkelingskanalen](/nl/install/development-channels)
