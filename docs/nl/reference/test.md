---
read_when:
    - Tests uitvoeren of repareren
summary: Tests lokaal uitvoeren (vitest) en wanneer je force-/coverage-modi gebruikt
title: Tests
x-i18n:
    generated_at: "2026-06-28T00:13:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d1aed76ed59713ee320eb2d18dc8c392ea7a810096a0ef3131388001bbe5d8d
    source_path: reference/test.md
    workflow: 16
---

- Volledige testkit (suites, live, Docker): [Testen](/nl/help/testing)
- Validatie van updates en pluginpakketten: [Updates en plugins testen](/nl/help/testing-updates-plugins)

- Routinematige lokale testvolgorde:
  1. `pnpm test:changed` voor Vitest-bewijs binnen de gewijzigde scope.
  2. `pnpm test <path-or-filter>` voor één bestand, map of expliciet doel.
  3. `pnpm test` alleen wanneer je bewust de volledige lokale Vitest-suite nodig hebt.
- `pnpm test:force`: Beëindigt elk achtergebleven Gateway-proces dat de standaard control-poort vasthoudt, en voert daarna de volledige Vitest-suite uit met een geïsoleerde Gateway-poort zodat servertests niet botsen met een draaiende instantie. Gebruik dit wanneer een eerdere Gateway-run poort 18789 bezet heeft achtergelaten.
- `pnpm test:coverage`: Voert de unit-suite uit met V8-coverage (via `vitest.unit.config.ts`). Dit is een coverage-gate voor de standaard-unit-lane, geen coverage voor alle bestanden in de hele repo. Drempels zijn 70% regels/functies/statements en 55% branches. Omdat `coverage.all` false is en de standaard-lane coverage-includes beperkt tot niet-snelle unittests met naastliggende bronbestanden, meet de gate broncode die eigendom is van deze lane in plaats van elke transitieve import die toevallig wordt geladen.
- `pnpm test:coverage:changed`: Voert unit-coverage alleen uit voor bestanden die sinds `origin/main` zijn gewijzigd.
- `pnpm test:changed`: goedkope slimme gewijzigde testrun. Deze voert precieze doelen uit op basis van directe testbewerkingen, naastliggende `*.test.ts`-bestanden, expliciete bronmappings en de lokale importgrafiek. Brede/config/package-wijzigingen worden overgeslagen tenzij ze naar precieze tests mappen.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: expliciete brede gewijzigde testrun. Gebruik dit wanneer een bewerking aan testharnas/config/package moet terugvallen op Vitests bredere gedrag voor gewijzigde tests.
- `pnpm changed:lanes`: toont de architecturale lanes die door de diff ten opzichte van `origin/main` worden geactiveerd.
- `pnpm check:changed`: delegeert standaard buiten CI naar Crabbox/Testbox en voert daarna de slimme gewijzigde check-gate uit voor de diff ten opzichte van `origin/main` binnen het externe child-proces. Deze voert typecheck, lint en guard-commando's uit voor de getroffen architecturale lanes, maar voert geen Vitest-tests uit. Gebruik `pnpm test:changed` of expliciet `pnpm test <target>` voor testbewijs.
- Codex-worktrees en gekoppelde/sparse checkouts: vermijd directe lokale `pnpm test*`, `pnpm check*` en `pnpm crabbox:run`, tenzij je hebt geverifieerd dat pnpm geen dependencies zal reconciliëren. Gebruik voor klein bewijs met een expliciet bestand `node scripts/run-vitest.mjs <path-or-filter>`; gebruik voor changed gates of breed bewijs `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`, zodat pnpm binnen Testbox draait.
- Testbox-via-Crabbox-bewijs: gebruik de uiteindelijke `exitCode` en timing-JSON van de wrapper als commandore­sultaat. De gedelegeerde Blacksmith GitHub Actions-run kan `cancelled` tonen na een succesvolle SSH-opdracht omdat de Testbox van buiten de keepalive-action wordt gestopt; controleer de wrappersamenvatting en commandouitvoer voordat je dat als testfout behandelt.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: houdt heavy-check-serialisatie binnen de huidige worktree in plaats van de Git common dir voor commando's zoals `pnpm check:changed` en gerichte `pnpm test ...`. Gebruik dit alleen op lokale hosts met hoge capaciteit wanneer je bewust onafhankelijke checks over gekoppelde worktrees uitvoert.
- `pnpm test`: routeert expliciete bestands-/mapdoelen via gescopete Vitest-lanes. Runs zonder doel zijn bewijs voor de volledige suite: ze gebruiken vaste shardgroepen, breiden uit naar leaf-configs voor lokale parallelle uitvoering en printen de verwachte lokale shard-fanout voordat ze starten. De extensiegroep breidt altijd uit naar de shardconfigs per extensie in plaats van één gigantisch root-projectproces.
- Testwrapper-runs eindigen met een korte `[test] passed|failed|skipped ... in ...`-samenvatting. Vitests eigen duurregel blijft het detail per shard.
- Gedeelde OpenClaw-teststatus: gebruik `src/test-utils/openclaw-test-state.ts` vanuit Vitest wanneer een test een geïsoleerde `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, configfixture, workspace, agentmap of auth-profielstore nodig heeft.
- `pnpm test:env-mutations:report`: niet-blokkerend rapport van tests en harnassen die `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` of gerelateerde OpenClaw-env-sleutels direct muteren. Gebruik dit om kandidaten te vinden voor migratie naar de gedeelde test-state-helper.
- Control UI gemockte E2E: gebruik `pnpm test:ui:e2e` voor de Vitest + Playwright-lane die de Vite Control UI start en een echte Chromium-pagina aanstuurt tegen een gemockte Gateway-WebSocket. Tests staan in `ui/src/**/*.e2e.test.ts`; gedeelde mocks en controls staan in `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` bevat deze lane. Geef in Codex-worktrees de voorkeur aan `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` voor klein gericht bewijs nadat dependencies zijn geïnstalleerd, of Testbox/Crabbox voor breder GUI-bewijs.
- Proces-E2E-helpers: gebruik `test/helpers/openclaw-test-instance.ts` wanneer een Vitest-procesniveau-E2E-test een draaiende Gateway, CLI-env, logvastlegging en cleanup op één plek nodig heeft.
- TUI-PTY-tests: gebruik `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` voor de snelle fake-backend-PTY-lane. Gebruik `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` of `pnpm tui:pty:test:watch --mode local` voor de tragere `tui --local`-smoke, die alleen het externe modeleindpunt mockt. Assert stabiele zichtbare tekst of fixture-aanroepen, geen ruwe ANSI-snapshots.
- Docker/Bash-E2E-helpers: lanes die `scripts/lib/docker-e2e-image.sh` sourcen kunnen `docker_e2e_test_state_shell_b64 <label> <scenario>` doorgeven aan de container en dit decoderen met `scripts/lib/openclaw-e2e-instance.sh`; multi-home-scripts kunnen `docker_e2e_test_state_function_b64` doorgeven en `openclaw_test_state_create <label> <scenario>` in elke flow aanroepen. Lager-niveau callers kunnen `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` gebruiken voor een shellsnippet in de container, of `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` voor een sourcebaar host-env-bestand. De `--` vóór `create` voorkomt dat nieuwere Node-runtimes `--env-file` als Node-vlag behandelen. Docker/Bash-lanes die een Gateway starten kunnen `scripts/lib/openclaw-e2e-instance.sh` binnen de container sourcen voor entrypoint-resolutie, gemockte OpenAI-startup, Gateway-start op de voorgrond/achtergrond, readiness-probes, state-env-export, logdumps en procesopruiming.
- Full-, extension- en include-pattern-shardruns werken lokale timingdata bij in `.artifacts/vitest-shard-timings.json`; latere whole-config-runs gebruiken die timings om langzame en snelle shards te balanceren. Include-pattern-CI-shards voegen de shardnaam toe aan de timingsleutel, waardoor gefilterde shardtimings zichtbaar blijven zonder whole-config-timingdata te vervangen. Stel `OPENCLAW_TEST_PROJECTS_TIMINGS=0` in om het lokale timingartefact te negeren.
- Geselecteerde `plugin-sdk`- en `commands`-testbestanden worden nu via speciale lichte lanes gerouteerd die alleen `test/setup.ts` behouden, terwijl runtime-zware gevallen op hun bestaande lanes blijven.
- Bronbestanden met naastliggende tests mappen eerst naar die naastliggende test voordat wordt teruggevallen op bredere mapglobs. Helperbewerkingen onder `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` en `src/plugins/contracts` gebruiken een lokale importgrafiek om importerende tests uit te voeren in plaats van elke shard breed te draaien wanneer het dependencypad precies is.
- `auto-reply` splitst nu ook in drie speciale configs (`core`, `top-level`, `reply`), zodat het reply-harnas de lichtere top-level status-/token-/helpertests niet domineert.
- De basis-Vitest-config gebruikt nu standaard `pool: "threads"` en `isolate: false`, met de gedeelde niet-geïsoleerde runner ingeschakeld in alle repo-configs.
- `pnpm test:channels` voert `vitest.channels.config.ts` uit.
- `pnpm test:extensions` en `pnpm test extensions` voeren alle extensie-/Plugin-shards uit. Zware kanaal-Plugins, de browser-Plugin en OpenAI draaien als speciale shards; andere Plugin-groepen blijven gebundeld. Gebruik `pnpm test extensions/<id>` voor één gebundelde Plugin-lane.
- `pnpm test:perf:imports`: schakelt Vitest-rapportage voor importduur + importverdeling in, terwijl nog steeds gescopete lane-routering wordt gebruikt voor expliciete bestands-/mapdoelen.
- `pnpm test:perf:imports:changed`: dezelfde importprofilering, maar alleen voor bestanden die sinds `origin/main` zijn gewijzigd.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkt het gerouteerde changed-mode-pad tegen de native root-project-run voor dezelfde gecommitte git-diff.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkt de wijzigingenset van de huidige worktree zonder eerst te committen.
- `pnpm test:perf:profile:main`: schrijft een CPU-profiel voor de Vitest-mainthread (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: schrijft CPU- + heapprofielen voor de unitrunner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: voert elke full-suite Vitest-leaf-config serieel uit en schrijft gegroepeerde duurdata plus JSON-/logartefacten per config. De Test Performance Agent gebruikt dit als baseline voordat hij langzame-tests-fixes probeert.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: vergelijkt gegroepeerde rapporten na een performancegerichte wijziging.
- `pnpm test:docker:timings <summary.json>` inspecteert trage Docker-lanes na een Docker-all-run; gebruik `pnpm test:docker:rerun <run-id|summary.json|failures.json>` om goedkope gerichte rerun-commando's uit dezelfde artefacten te printen.
- Gateway-integratie: opt-in via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` of `pnpm test:gateway`.
- `pnpm test:e2e`: Voert de E2E-aggregatie van de repo uit: gateway-end-to-end-smoketests plus de gemockte browser-E2E-lane van Control UI.
- `pnpm test:e2e:gateway`: Voert gateway-end-to-end-smoketests uit (multi-instance WS/HTTP/node-koppeling). Gebruikt standaard `threads` + `isolate: false` met adaptieve workers in `vitest.e2e.config.ts`; stem af met `OPENCLAW_E2E_WORKERS=<n>` en stel `OPENCLAW_E2E_VERBOSE=1` in voor uitgebreide logs.
- `pnpm test:live`: Voert live providertests uit (minimax/zai). Vereist API-sleutels en `LIVE=1` (of providerspecifiek `*_LIVE_TEST=1`) om niet over te slaan.
- `pnpm test:docker:all`: Bouwt de gedeelde live-testimage, verpakt OpenClaw eenmalig als npm-tarball, bouwt/hergebruikt een kale Node/Git-runnerimage plus een functionele image die die tarball in `/app` installeert, en voert vervolgens Docker-smoke-lanes uit met `OPENCLAW_SKIP_DOCKER_BUILD=1` via een gewogen scheduler. De kale image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) wordt gebruikt voor installer-/update-/plugin-afhankelijkheidslanes; die lanes mounten de vooraf gebouwde tarball in plaats van gekopieerde repo-bronnen te gebruiken. De functionele image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) wordt gebruikt voor normale functionaliteitslanes van de gebouwde app. `scripts/package-openclaw-for-docker.mjs` is de enige lokale/CI-packagepacker en valideert de tarball plus `dist/postinstall-inventory.json` voordat Docker die gebruikt. Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`; plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` voert het geselecteerde plan uit. `node scripts/test-docker-all.mjs --plan-json` geeft het door de scheduler beheerde CI-plan uit voor geselecteerde lanes, image-soorten, package-/live-imagebehoeften, statusscenario's en credentialcontroles zonder Docker te bouwen of uit te voeren. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` beheert processlots en staat standaard op 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` beheert de providergevoelige tail-pool en staat standaard op 10. Zware lanecaps staan standaard op `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` en `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; providercaps staan standaard op een zware lane per provider via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` en `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Gebruik `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` of `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` voor grotere hosts. Als een lane de effectieve gewichts- of resourcecap op een host met lage paralleliteit overschrijdt, kan die nog steeds vanuit een lege pool starten en alleen draaien totdat capaciteit wordt vrijgegeven. Lanestarts worden standaard met 2 seconden gespreid om create-stormen van de lokale Docker-daemon te vermijden; overschrijf dit met `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. De runner voert standaard Docker-preflights uit, ruimt verouderde OpenClaw E2E-containers op, geeft elke 30 seconden actieve-lanestatus uit, deelt provider-CLI-toolcaches tussen compatibele lanes, probeert tijdelijke live-providerfouten standaard eenmaal opnieuw (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) en slaat lanetimings op in `.artifacts/docker-tests/lane-timings.json` voor volgorde met de langste eerst bij latere runs. Gebruik `OPENCLAW_DOCKER_ALL_DRY_RUN=1` om het lanemanifest af te drukken zonder Docker uit te voeren, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` om statusuitvoer af te stemmen, of `OPENCLAW_DOCKER_ALL_TIMINGS=0` om hergebruik van timings uit te schakelen. Gebruik `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` alleen voor deterministische/lokale lanes of `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` alleen voor live-providerlanes; package-aliassen zijn `pnpm test:docker:local:all` en `pnpm test:docker:live:all`. De modus alleen-live voegt hoofd- en tail-live-lanes samen tot een enkele pool met de langste eerst, zodat providerbuckets Claude-, Codex- en Gemini-werk samen kunnen inpakken. De runner stopt met het plannen van nieuwe gepoolde lanes na de eerste fout, tenzij `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` is ingesteld, en elke lane heeft een fallback-time-out van 120 minuten die overschrijfbaar is met `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; geselecteerde live-/tail-lanes gebruiken strakkere caps per lane. CLI-backend-Docker-installatieopdrachten hebben hun eigen time-out via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (standaard 180). Logs per lane, `summary.json`, `failures.json` en fasetimings worden geschreven onder `.artifacts/docker-tests/<run-id>/`; gebruik `pnpm test:docker:timings <summary.json>` om trage lanes te inspecteren en `pnpm test:docker:rerun <run-id|summary.json|failures.json>` om goedkope gerichte rerun-opdrachten af te drukken.
- `pnpm test:docker:browser-cdp-snapshot`: Bouwt een door Chromium ondersteunde source-E2E-container, start raw CDP plus een geïsoleerde Gateway, voert `browser doctor --deep` uit en verifieert dat CDP-rolsnapshots link-URL's, tot cursor gepromoveerde klikbare elementen, iframe-refs en framemetadata bevatten.
- `pnpm test:docker:skill-install`: Installeert de verpakte OpenClaw-tarball in een kale Docker-runner, schakelt `skills.install.allowUploadedArchives` uit, resolved een huidige skill-slug uit live ClawHub-zoekopdracht, installeert die via `openclaw skills install` en verifieert `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` en `skills info --json`.
- CLI-backend-live-Docker-probes kunnen als gerichte lanes worden uitgevoerd, bijvoorbeeld `pnpm test:docker:live-cli-backend:claude`, `pnpm test:docker:live-cli-backend:claude:resume` of `pnpm test:docker:live-cli-backend:claude:mcp`. Gemini heeft overeenkomende aliassen voor `:resume` en `:mcp`.
- `pnpm test:docker:openwebui`: Start gedockeriseerde OpenClaw + Open WebUI, meldt zich aan via Open WebUI, controleert `/api/models` en voert daarna een echte geproxiede chat uit via `/api/chat/completions`. Vereist een bruikbare live-modelsleutel, haalt een externe Open WebUI-image op en wordt niet verwacht CI-stabiel te zijn zoals de normale unit-/E2E-suites.
- `pnpm test:docker:mcp-channels`: Start een vooraf gevulde Gateway-container en een tweede clientcontainer die `openclaw mcp serve` start, en verifieert daarna routed conversation discovery, transcriptlezingen, attachmentmetadata, live-eventqueuegedrag, outbound send-routing en Claude-stijl kanaal- en permissienotificaties over de echte stdio-bridge. De Claude-notificatieassertie leest de raw stdio MCP-frames rechtstreeks, zodat de smoke weerspiegelt wat de bridge daadwerkelijk uitzendt.
- `pnpm test:docker:upgrade-survivor`: Installeert de verpakte OpenClaw-tarball over een vervuilde oude-gebruiker-fixture, voert package-update plus niet-interactieve doctor uit zonder live-provider- of kanaalsleutels, start daarna een loopback-Gateway en controleert dat agents, kanaalconfiguratie, plugin-allowlists, workspace-/sessiebestanden, verouderde legacy plugin-afhankelijkheidsstatus, opstarten en RPC-status blijven werken.
- `pnpm test:docker:published-upgrade-survivor`: Installeert standaard `openclaw@latest`, seedt realistische bestaande-gebruikerbestanden zonder live-provider- of kanaalsleutels, configureert die baseline met een ingebakken `openclaw config set`-opdrachtenrecept, werkt die gepubliceerde installatie bij naar de verpakte OpenClaw-tarball, voert niet-interactieve doctor uit, schrijft `.artifacts/upgrade-survivor/summary.json`, start daarna een loopback-Gateway en controleert dat geconfigureerde intents, workspace-/sessiebestanden, verouderde plugin-configuratie en legacy afhankelijkheidsstatus, opstarten, `/healthz`, `/readyz` en RPC-status blijven werken of netjes worden gerepareerd. Overschrijf een baseline met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, breid een exacte lokale matrix uit met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` zoals `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, of voeg scenariofixtures toe met `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; de reported-issues-set bevat `configured-plugin-installs` om te verifiëren dat geconfigureerde externe OpenClaw-plugins tijdens upgrade automatisch worden geïnstalleerd en `stale-source-plugin-shadow` om te voorkomen dat source-only plugin-schaduwen het opstarten breken. Package Acceptance biedt deze aan als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` en `published_upgrade_survivor_scenarios`, en resolved meta-baselinetokens zoals `last-stable-4` of `all-since-2026.4.23` voordat exacte package-specificaties aan Docker-lanes worden doorgegeven.
- `pnpm test:docker:update-migration`: Voert de published-upgrade-survivor-harness uit in het opschoningsintensieve `plugin-deps-cleanup`-scenario, standaard beginnend bij `openclaw@2026.4.23`. De afzonderlijke `Update Migration`-workflow breidt deze lane uit met `baselines=all-since-2026.4.23`, zodat elk stabiel gepubliceerd package vanaf `.23` wordt bijgewerkt naar de kandidaat en cleanup van geconfigureerde plugin-afhankelijkheden bewijst buiten Full Release CI.
- `pnpm test:docker:plugins`: Voert installatie-/updatesmoke uit voor lokaal pad, `file:`, npm-registrypackages met gehoiste afhankelijkheden, bewegende git-refs, ClawHub-fixtures, marketplace-updates en inschakelen/inspecteren van Claude-bundel.

## Lokale PR-gate

Voer voor lokale PR-land/gate-controles het volgende uit:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Als `pnpm test` op een belaste host flaky is, voer het dan één keer opnieuw uit voordat je het als regressie behandelt, en isoleer daarna met `pnpm test <path/to/test>`. Gebruik voor hosts met beperkte geheugenruimte:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark voor modellatentie (lokale sleutels)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Gebruik:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- Optionele env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Standaardprompt: "Antwoord met één enkel woord: ok. Geen interpunctie of extra tekst."

Laatste run (2025-12-31, 20 runs):

- minimax mediaan 1279 ms (min. 1114, max. 2431)
- opus mediaan 2454 ms (min. 1224, max. 3170)

## CLI-opstartbenchmark

Script: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Gebruik:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Presets:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: beide presets

Uitvoer bevat `sampleCount`, gemiddelde, p50, p95, min/max, exit-code-/signaalverdeling en samenvattingen van maximale RSS voor elke opdracht. Optioneel schrijft `--cpu-prof-dir` / `--heap-prof-dir` V8-profielen per run, zodat timing en profielvastlegging dezelfde harness gebruiken.

Conventies voor opgeslagen uitvoer:

- `pnpm test:startup:bench:smoke` schrijft het gerichte smoke-artefact naar `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` schrijft het artefact voor de volledige suite naar `.artifacts/cli-startup-bench-all.json` met `runs=5` en `warmup=1`
- `pnpm test:startup:bench:update` vernieuwt de ingecheckte baseline-fixture op `test/fixtures/cli-startup-bench.json` met `runs=5` en `warmup=1`

Ingecheckte fixture:

- `test/fixtures/cli-startup-bench.json`
- Vernieuw met `pnpm test:startup:bench:update`
- Vergelijk huidige resultaten met de fixture via `pnpm test:startup:bench:check`

## Gateway-opstartbenchmark

Script: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

De benchmark gebruikt standaard de gebouwde CLI-entry op `dist/entry.js`; voer
`pnpm build` uit voordat je de package-scriptopdrachten gebruikt. Om in plaats daarvan de source
runner te meten, geef je `--entry scripts/run-node.mjs` mee en houd je die resultaten
gescheiden van baselines voor de gebouwde entry.

Gebruik:

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

Case-id's:

- `default`: normale Gateway-opstart.
- `skipChannels`: Gateway-opstart waarbij kanaalopstart is overgeslagen.
- `oneInternalHook`: één geconfigureerde interne hook.
- `allInternalHooks`: alle interne hooks.
- `fiftyPlugins`: 50 manifest-plugins.
- `fiftyStartupLazyPlugins`: 50 startup-lazy manifest-plugins.

Uitvoer bevat de eerste procesuitvoer, `/healthz`, `/readyz`, logtijd voor HTTP-listen,
logtijd voor Gateway ready, CPU-tijd, CPU-coreverhouding, maximale RSS, heap, startup trace-
metrics, event-loopvertraging en gedetailleerde metrics voor Plugin-lookup-tabellen. Het script
schakelt `OPENCLAW_GATEWAY_STARTUP_TRACE=1` in de child-Gateway-omgeving in.

Lees `/healthz` als liveness: de HTTP-server kan antwoorden. Lees `/readyz` als
bruikbare readiness: sidecars van opstart-Plugins, kanalen en ready-critical
post-attach-werk zijn afgerond. Gateway-opstarthooks worden asynchroon verzonden
en maken geen deel uit van de readiness-garantie. Ready-logtijd is de interne
ready-logtijdstempel van de Gateway; die is nuttig voor attributie aan de proceskant,
maar is geen vervanging voor de externe `/readyz`-probe.

Gebruik JSON-uitvoer of `--output` bij het vergelijken van wijzigingen. Gebruik `--cpu-prof-dir` alleen
nadat de trace-uitvoer wijst op import-, compile- of CPU-gebonden werk dat niet
alleen uit fasetimings kan worden verklaard. Vergelijk resultaten van de source runner niet met
gebouwde `dist/entry.js`-resultaten als dezelfde baseline.

## Gateway-herstartbenchmark

Script: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

De herstartbenchmark wordt alleen ondersteund op macOS en Linux. Deze gebruikt SIGUSR1 voor
in-process herstarts en faalt direct op Windows.

De benchmark gebruikt standaard de gebouwde CLI-entry op `dist/entry.js`; voer
`pnpm build` uit voordat je de package-scriptopdrachten gebruikt. Om in plaats daarvan de source
runner te meten, geef je `--entry scripts/run-node.mjs` mee en houd je die resultaten
gescheiden van baselines voor de gebouwde entry.

Gebruik:

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

Case-id's:

- `skipChannels`: herstart met overgeslagen kanalen.
- `skipChannelsAcpxProbe`: herstart met overgeslagen kanalen en ACPX-opstartprobe aan.
- `skipChannelsNoAcpxProbe`: herstart met overgeslagen kanalen en ACPX-opstartprobe uit.
- `default`: normale herstart.
- `fiftyPlugins`: herstart met 50 manifest-plugins.

Uitvoer bevat volgende `/healthz`, volgende `/readyz`, downtime, restart-ready-timing,
CPU, RSS, startup trace-metrics voor het vervangende proces en restart trace-
metrics voor signaalafhandeling, active-work-drain, sluitfasen, volgende start, ready-
timing en geheugensnapshots. Het script schakelt
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` en `OPENCLAW_GATEWAY_RESTART_TRACE=1` in de
child-Gateway-omgeving in.

Gebruik deze benchmark wanneer een wijziging raakt aan herstartsignalering, close-handlers,
startup-after-restart, sidecar-shutdown, service handoff of readiness na
herstart. Begin met `skipChannels` wanneer je Gateway-mechanica isoleert van kanaalopstart.
Gebruik `default` of Plugin-zware cases pas nadat de smalle case het
herstartpad verklaart.

Trace-metrics zijn attributieaanwijzingen, geen oordelen. Een herstartwijziging moet worden
beoordeeld op basis van meerdere samples, de bijbehorende ownerspan, `/healthz`- en `/readyz`-
gedrag en het gebruikerszichtbare herstartcontract.

## Onboarding-E2E (Docker)

Docker is optioneel; dit is alleen nodig voor gecontaineriseerde onboarding-smoketests.

Volledige cold-start-flow in een schone Linux-container:

```bash
scripts/e2e/onboard-docker.sh
```

Dit script stuurt de interactieve wizard aan via een pseudo-tty, verifieert config-/workspace-/sessiebestanden, start daarna de Gateway en voert `openclaw health` uit.

## QR-importsmoke (Docker)

Zorgt ervoor dat de onderhouden QR-runtimehelper wordt geladen onder de ondersteunde Docker-Node-runtimes (Node 24 standaard, Node 22 compatibel):

```bash
pnpm test:docker:qr
```

## Gerelateerd

- [Testen](/nl/help/testing)
- [Live testen](/nl/help/testing-live)
- [Updates en Plugins testen](/nl/help/testing-updates-plugins)
