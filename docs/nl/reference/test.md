---
read_when:
    - Tests uitvoeren of herstellen
summary: Tests lokaal uitvoeren (vitest) en wanneer je force-/coverage-modi gebruikt
title: Testen
x-i18n:
    generated_at: "2026-05-05T06:18:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc31ab27a63607ec5134306a0129bd164e4235f26631da4f691f657adda70eed
    source_path: reference/test.md
    workflow: 16
---

- Volledige testkit (suites, live, Docker): [Testen](/nl/help/testing)
- Validatie van updates en Plugin-pakketten: [Updates en plugins testen](/nl/help/testing-updates-plugins)

- `pnpm test:force`: Beëindigt elk achtergebleven gateway-proces dat de standaard control-port bezet houdt, en draait daarna de volledige Vitest-suite met een geïsoleerde gateway-port zodat servertests niet botsen met een draaiende instantie. Gebruik dit wanneer een eerdere gateway-run poort 18789 bezet heeft achtergelaten.
- `pnpm test:coverage`: Draait de unit-suite met V8-dekking (via `vitest.unit.config.ts`). Dit is een unit-dekkingscontrole voor geladen bestanden, geen dekking van alle bestanden in de hele repo. Drempels zijn 70% voor regels/functies/statements en 55% voor branches. Omdat `coverage.all` false is, meet de controle bestanden die door de unit-dekkingssuite worden geladen in plaats van elk bronbestand uit split-lanes als ongedekt te behandelen.
- `pnpm test:coverage:changed`: Draait unit-dekking alleen voor bestanden die sinds `origin/main` zijn gewijzigd.
- `pnpm test:changed`: goedkope slimme changed-testrun. Deze draait precieze doelen uit directe testbewerkingen, aangrenzende `*.test.ts`-bestanden, expliciete bronmappings en de lokale importgraaf. Brede/configuratie-/pakketwijzigingen worden overgeslagen tenzij ze naar precieze tests mappen.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: expliciete brede changed-testrun. Gebruik dit wanneer een wijziging aan testharnas/configuratie/pakket moet terugvallen op Vitest's bredere changed-testgedrag.
- `pnpm changed:lanes`: toont de architectuurlanes die door de diff tegenover `origin/main` worden geactiveerd.
- `pnpm check:changed`: draait de slimme changed-checkcontrole voor de diff tegenover `origin/main`. Deze draait typecheck-, lint- en guard-commando's voor de getroffen architectuurlanes, maar draait geen Vitest-tests. Gebruik `pnpm test:changed` of expliciet `pnpm test <target>` voor testbewijs.
- `pnpm test`: routeert expliciete bestands-/mapdoelen via gescopete Vitest-lanes. Runs zonder doel gebruiken vaste shardgroepen en breiden uit naar leaf-configs voor lokale parallelle uitvoering; de extensiegroep breidt altijd uit naar de per-extensie shard-configs in plaats van één enorm root-projectproces.
- Testrapper-runs eindigen met een korte samenvatting `[test] passed|failed|skipped ... in ...`. Vitest's eigen duurregel blijft het detail per shard.
- Gedeelde OpenClaw-teststatus: gebruik `src/test-utils/openclaw-test-state.ts` vanuit Vitest wanneer een test een geïsoleerde `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, configuratiefixture, workspace, agentmap of auth-profile-store nodig heeft.
- Process E2E-helpers: gebruik `test/helpers/openclaw-test-instance.ts` wanneer een Vitest process-level E2E-test een draaiende Gateway, CLI-env, logvastlegging en opruiming op één plek nodig heeft.
- Docker/Bash E2E-helpers: lanes die `scripts/lib/docker-e2e-image.sh` sourcen kunnen `docker_e2e_test_state_shell_b64 <label> <scenario>` doorgeven aan de container en dit decoderen met `scripts/lib/openclaw-e2e-instance.sh`; multi-home-scripts kunnen `docker_e2e_test_state_function_b64` doorgeven en `openclaw_test_state_create <label> <scenario>` aanroepen in elke flow. Lagere callers kunnen `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` gebruiken voor een shell-snippet in de container, of `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` voor een sourcebaar host-envbestand. De `--` vóór `create` voorkomt dat nieuwere Node-runtimes `--env-file` als Node-vlag behandelen. Docker/Bash-lanes die een Gateway starten kunnen `scripts/lib/openclaw-e2e-instance.sh` binnen de container sourcen voor entrypoint-resolutie, mock-OpenAI-start, Gateway-start op voorgrond/achtergrond, readiness-probes, status-envexport, logdumps en procesopruiming.
- Volledige, extensie- en include-pattern-shardruns werken lokale timingdata bij in `.artifacts/vitest-shard-timings.json`; latere whole-config-runs gebruiken die timings om trage en snelle shards te balanceren. Include-pattern CI-shards voegen de shardnaam toe aan de timingsleutel, waardoor gefilterde shardtimings zichtbaar blijven zonder whole-config-timingdata te vervangen. Zet `OPENCLAW_TEST_PROJECTS_TIMINGS=0` om het lokale timingartefact te negeren.
- Geselecteerde `plugin-sdk`- en `commands`-testbestanden routeren nu via toegewijde lichte lanes die alleen `test/setup.ts` behouden, terwijl runtime-zware gevallen op hun bestaande lanes blijven.
- Bronbestanden met aangrenzende tests mappen naar die aangrenzende test voordat ze terugvallen op bredere mapglobs. Helperbewerkingen onder `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` en `src/plugins/contracts` gebruiken een lokale importgraaf om importerende tests te draaien in plaats van elke shard breed te draaien wanneer het dependency-pad precies is.
- `auto-reply` splitst nu ook in drie toegewijde configs (`core`, `top-level`, `reply`) zodat het reply-harnas de lichtere top-level status-/token-/helpertests niet domineert.
- De basis-Vitest-config staat nu standaard op `pool: "threads"` en `isolate: false`, met de gedeelde niet-geïsoleerde runner ingeschakeld voor de repo-configs.
- `pnpm test:channels` draait `vitest.channels.config.ts`.
- `pnpm test:extensions` en `pnpm test extensions` draaien alle extensie-/Plugin-shards. Zware channel-Plugins, de browser-Plugin en OpenAI draaien als toegewijde shards; andere Plugin-groepen blijven gebundeld. Gebruik `pnpm test extensions/<id>` voor één gebundelde Plugin-lane.
- `pnpm test:perf:imports`: schakelt Vitest-rapportage voor importduur en importuitsplitsing in, terwijl nog steeds gescopete lane-routing voor expliciete bestands-/mapdoelen wordt gebruikt.
- `pnpm test:perf:imports:changed`: dezelfde importprofilering, maar alleen voor bestanden die sinds `origin/main` zijn gewijzigd.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkt het gerouteerde changed-mode-pad tegenover de native root-projectrun voor dezelfde gecommitte git-diff.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkt de huidige worktree-wijzigingsset zonder eerst te committen.
- `pnpm test:perf:profile:main`: schrijft een CPU-profiel voor de Vitest-main-thread (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: schrijft CPU- en heap-profielen voor de unit-runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: draait elke full-suite Vitest leaf-config serieel en schrijft gegroepeerde duurdata plus JSON-/logartefacten per config. De Test Performance Agent gebruikt dit als baseline voordat hij probeert trage tests te repareren.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: vergelijkt gegroepeerde rapporten na een prestatiegerichte wijziging.
- Gateway-integratie: opt-in via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` of `pnpm test:gateway`.
- `pnpm test:e2e`: Draait Gateway end-to-end-smoketests (multi-instance WS/HTTP/node-koppeling). Staat standaard op `threads` + `isolate: false` met adaptieve workers in `vitest.e2e.config.ts`; stem af met `OPENCLAW_E2E_WORKERS=<n>` en zet `OPENCLAW_E2E_VERBOSE=1` voor uitgebreide logs.
- `pnpm test:live`: Draait live-tests voor providers (minimax/zai). Vereist API-sleutels en `LIVE=1` (of providerspecifieke `*_LIVE_TEST=1`) om over te slaan uit te schakelen.
- `pnpm test:docker:all`: Bouwt de gedeelde live-testimage, verpakt OpenClaw één keer als npm-tarball, bouwt/hergebruikt een kale Node/Git-runnerimage plus een functionele image die die tarball in `/app` installeert, en draait daarna Docker-smokelanes met `OPENCLAW_SKIP_DOCKER_BUILD=1` via een gewogen scheduler. De kale image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) wordt gebruikt voor installer-/update-/Plugin-dependency-lanes; die lanes mounten de vooraf gebouwde tarball in plaats van gekopieerde repobronnen te gebruiken. De functionele image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) wordt gebruikt voor normale built-app-functionaliteitslanes. `scripts/package-openclaw-for-docker.mjs` is de enige lokale/CI-pakketpacker en valideert de tarball plus `dist/postinstall-inventory.json` voordat Docker die gebruikt. Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`; plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` voert het geselecteerde plan uit. `node scripts/test-docker-all.mjs --plan-json` geeft het door de scheduler beheerde CI-plan uit voor geselecteerde lanes, imagetypen, pakket-/live-imagebehoeften, statusscenario's en credentialcontroles zonder Docker te bouwen of te draaien. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` beheert processlots en staat standaard op 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` beheert de providergevoelige tail-pool en staat standaard op 10. Limieten voor zware lanes staan standaard op `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` en `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; providerlimieten staan standaard op één zware lane per provider via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` en `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Gebruik `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` of `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` voor grotere hosts. Als één lane de effectieve gewichtslimiet of resourcelimiet op een host met lage paralleliteit overschrijdt, kan deze nog steeds vanuit een lege pool starten en alleen draaien totdat capaciteit wordt vrijgegeven. Lanestarts worden standaard met 2 seconden gespreid om lokale Docker-daemon-create-stormen te vermijden; overschrijf dit met `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. De runner preflight Docker standaard, ruimt verlopen OpenClaw E2E-containers op, geeft elke 30 seconden actieve-lane-status uit, deelt provider-CLI-toolcaches tussen compatibele lanes, probeert tijdelijke live-providerfouten standaard één keer opnieuw (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) en slaat lanetimings op in `.artifacts/docker-tests/lane-timings.json` voor langste-eerst-volgorde bij latere runs. Gebruik `OPENCLAW_DOCKER_ALL_DRY_RUN=1` om het lanemanifest af te drukken zonder Docker te draaien, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` om statusuitvoer af te stemmen, of `OPENCLAW_DOCKER_ALL_TIMINGS=0` om hergebruik van timings uit te schakelen. Gebruik `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` alleen voor deterministische/lokale lanes of `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` alleen voor live-provider-lanes; pakketaliassen zijn `pnpm test:docker:local:all` en `pnpm test:docker:live:all`. Live-only-modus voegt main- en tail-live-lanes samen in één langste-eerst-pool zodat providerbuckets Claude-, Codex- en Gemini-werk samen kunnen inpakken. De runner stopt met het schedulen van nieuwe pooled lanes na de eerste fout tenzij `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` is gezet, en elke lane heeft een fallback-time-out van 120 minuten die kan worden overschreven met `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; geselecteerde live-/tail-lanes gebruiken strakkere caps per lane. CLI-backend-Docker-setupcommando's hebben hun eigen time-out via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (standaard 180). Logs per lane, `summary.json`, `failures.json` en fasetimings worden geschreven onder `.artifacts/docker-tests/<run-id>/`; gebruik `pnpm test:docker:timings <summary.json>` om trage lanes te inspecteren en `pnpm test:docker:rerun <run-id|summary.json|failures.json>` om goedkope gerichte rerun-commando's af te drukken.
- `pnpm test:docker:browser-cdp-snapshot`: Bouwt een door Chromium ondersteunde source-E2E-container, start raw CDP plus een geïsoleerde Gateway, draait `browser doctor --deep` en verifieert dat CDP-rolsnapshots link-URL's, cursor-gepromoveerde klikbare elementen, iframe-refs en frame-metadata bevatten.
- CLI-backend-live-Docker-probes kunnen als gerichte lanes worden gedraaid, bijvoorbeeld `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` of `pnpm test:docker:live-cli-backend:codex:mcp`. Claude en Gemini hebben overeenkomende `:resume`- en `:mcp`-aliassen.
- `pnpm test:docker:openwebui`: Start gedockeriseerde OpenClaw + Open WebUI, meldt aan via Open WebUI, controleert `/api/models` en draait daarna een echte geproxiede chat via `/api/chat/completions`. Vereist een bruikbare live-modelsleutel (bijvoorbeeld OpenAI in `~/.profile`), haalt een externe Open WebUI-image op en wordt niet verwacht CI-stabiel te zijn zoals de normale unit-/e2e-suites.
- `pnpm test:docker:mcp-channels`: Start een geseede Gateway-container en een tweede clientcontainer die `openclaw mcp serve` spawnt, en verifieert daarna gerouteerde gespreksontdekking, transcriptreads, attachment-metadata, gedrag van live-eventqueue, routing van uitgaande verzending en Claude-achtige channel- plus machtigingsmeldingen over de echte stdio-brug. De Claude-meldingsassertie leest de ruwe stdio-MCP-frames direct zodat de smoke weerspiegelt wat de brug daadwerkelijk emitteert.
- `pnpm test:docker:upgrade-survivor`: Installeert de ingepakte OpenClaw-tarball over een vuile fixture voor oude gebruikers heen, voert pakketupdate plus niet-interactieve doctor uit zonder live provider- of kanaalsleutels, start daarna een loopback-Gateway en controleert of agents, kanaalconfiguratie, plugin-allowlists, workspace-/sessiebestanden, verouderde legacy status van plugin-afhankelijkheden, opstarten en RPC-status behouden blijven.
- `pnpm test:docker:published-upgrade-survivor`: Installeert standaard `openclaw@latest`, seedt realistische bestaande-gebruikersbestanden zonder live provider- of kanaalsleutels, configureert die baseline met een ingebakken `openclaw config set`-commandorecept, werkt die gepubliceerde installatie bij naar de ingepakte OpenClaw-tarball, voert niet-interactieve doctor uit, schrijft `.artifacts/upgrade-survivor/summary.json`, start daarna een loopback-Gateway en controleert of geconfigureerde intents, workspace-/sessiebestanden, verouderde plugin-configuratie en legacy afhankelijkheidsstatus, opstarten, `/healthz`, `/readyz` en RPC-status behouden blijven of netjes worden gerepareerd. Overschrijf een baseline met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, breid een exacte lokale matrix uit met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` zoals `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, of voeg scenariofixtures toe met `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; de set reported-issues bevat `configured-plugin-installs` om te verifiëren dat geconfigureerde externe OpenClaw-plugins automatisch tijdens de upgrade worden geïnstalleerd en `stale-source-plugin-shadow` om te voorkomen dat schaduwen van alleen-bronplugins het opstarten breken. Package Acceptance stelt die beschikbaar als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` en `published_upgrade_survivor_scenarios`, en lost meta-baselinetokens zoals `last-stable-4` of `all-since-2026.4.23` op voordat exacte pakketspecificaties aan Docker-lanes worden doorgegeven.
- `pnpm test:docker:update-migration`: Voert de gepubliceerde-upgrade-survivor-harness uit in het opruimintensieve scenario `plugin-deps-cleanup`, standaard beginnend bij `openclaw@2026.4.23`. De aparte workflow `Update Migration` breidt deze lane uit met `baselines=all-since-2026.4.23`, zodat elk stabiel gepubliceerd pakket vanaf `.23` wordt bijgewerkt naar de kandidaat en het opruimen van geconfigureerde-plugin-afhankelijkheden buiten Full Release CI aantoont.
- `pnpm test:docker:plugins`: Voert install/update-smoke uit voor lokaal pad, `file:`, npm-registrypakketten met gehesen afhankelijkheden, bewegende git-refs, ClawHub-fixtures, marketplace-updates en Claude-bundle inschakelen/inspecteren.

## Lokale PR-gate

Voer voor lokale PR-landings-/gate-controles het volgende uit:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Als `pnpm test` flaky is op een zwaar belaste host, voer het dan nog eenmaal uit voordat je het als een regressie behandelt en isoleer het daarna met `pnpm test <path/to/test>`. Gebruik voor hosts met weinig geheugen:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model-latencybenchmark (lokale sleutels)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Gebruik:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Optionele env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Standaardprompt: “Antwoord met één woord: ok. Geen interpunctie of extra tekst.”

Laatste run (2025-12-31, 20 runs):

- minimax mediaan 1279ms (min 1114, max 2431)
- opus mediaan 2454ms (min 1224, max 3170)

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

De uitvoer bevat `sampleCount`, gemiddelde, p50, p95, min/max, exit-code-/signaalverdeling en max-RSS-samenvattingen voor elke opdracht. Optioneel schrijft `--cpu-prof-dir` / `--heap-prof-dir` V8-profielen per run, zodat timing en profielvastlegging dezelfde harness gebruiken.

Conventies voor opgeslagen uitvoer:

- `pnpm test:startup:bench:smoke` schrijft het gerichte smoke-artefact naar `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` schrijft het full-suite-artefact naar `.artifacts/cli-startup-bench-all.json` met `runs=5` en `warmup=1`
- `pnpm test:startup:bench:update` vernieuwt de ingecheckte baseline-fixture op `test/fixtures/cli-startup-bench.json` met `runs=5` en `warmup=1`

Ingecheckte fixture:

- `test/fixtures/cli-startup-bench.json`
- Vernieuwen met `pnpm test:startup:bench:update`
- Vergelijk huidige resultaten met de fixture via `pnpm test:startup:bench:check`

## Onboarding-E2E (Docker)

Docker is optioneel; dit is alleen nodig voor gecontaineriseerde onboarding-smoketests.

Volledige cold-start-flow in een schone Linux-container:

```bash
scripts/e2e/onboard-docker.sh
```

Dit script stuurt de interactieve wizard aan via een pseudo-tty, verifieert config-/workspace-/sessiebestanden, start daarna de Gateway en voert `openclaw health` uit.

## QR-importsmoke (Docker)

Controleert of de onderhouden QR-runtimehelper wordt geladen onder de ondersteunde Docker Node-runtimes (Node 24 standaard, Node 22 compatibel):

```bash
pnpm test:docker:qr
```

## Gerelateerd

- [Testen](/nl/help/testing)
- [Live testen](/nl/help/testing-live)
- [Updates en plugins testen](/nl/help/testing-updates-plugins)
