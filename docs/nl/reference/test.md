---
read_when:
    - Tests uitvoeren of oplossen
summary: Tests lokaal uitvoeren (vitest) en wanneer je de force-/coverage-modi gebruikt
title: Tests
x-i18n:
    generated_at: "2026-05-05T01:49:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e8421518d63cade24ce8c2a08fa10538b66d2332b1eb5744e47c6d5a5e84605
    source_path: reference/test.md
    workflow: 16
---

- Volledige testkit (testsuites, live, Docker): [Testen](/nl/help/testing)
- Update- en Plugin-pakketvalidatie: [Updates en Plugins testen](/nl/help/testing-updates-plugins)

- `pnpm test:force`: Beëindigt elk achtergebleven gateway-proces dat de standaard control-poort bezet houdt, en draait daarna de volledige Vitest-suite met een geïsoleerde gateway-poort zodat servertests niet botsen met een draaiende instantie. Gebruik dit wanneer een eerdere gateway-run poort 18789 bezet heeft achtergelaten.
- `pnpm test:coverage`: Draait de unit-suite met V8-dekking (via `vitest.unit.config.ts`). Dit is een loaded-file-unitdekkingsgate, geen hele-repo all-file-dekking. Drempels zijn 70% regels/functies/statements en 55% branches. Omdat `coverage.all` false is, meet de gate bestanden die door de unitdekkingssuite worden geladen in plaats van elk split-lane-bronbestand als ongedekt te behandelen.
- `pnpm test:coverage:changed`: Draait unitdekking alleen voor bestanden die sinds `origin/main` zijn gewijzigd.
- `pnpm test:changed`: goedkope slimme changed-testrun. Deze draait precieze targets op basis van directe testbewerkingen, naastgelegen `*.test.ts`-bestanden, expliciete bronmappings en de lokale importgraph. Brede/configuratie-/packagewijzigingen worden overgeslagen tenzij ze naar precieze tests mappen.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: expliciete brede changed-testrun. Gebruik dit wanneer een wijziging aan een testharnas/configuratie/package moet terugvallen op het bredere changed-testgedrag van Vitest.
- `pnpm changed:lanes`: toont de architecturale lanes die worden geactiveerd door de diff tegenover `origin/main`.
- `pnpm check:changed`: draait de slimme changed-check-gate voor de diff tegenover `origin/main`. Deze draait typecheck-, lint- en guard-commando's voor de getroffen architecturale lanes, maar draait geen Vitest-tests. Gebruik `pnpm test:changed` of expliciet `pnpm test <target>` voor testbewijs.
- `pnpm test`: routeert expliciete bestands-/directorytargets via gescopete Vitest-lanes. Runs zonder target gebruiken vaste shardgroepen en breiden uit naar leaf-configs voor lokale parallelle uitvoering; de extensiegroep breidt altijd uit naar de per-extensie-shardconfigs in plaats van één gigantisch root-projectproces.
- Runs van de testwrapper eindigen met een korte samenvatting `[test] passed|failed|skipped ... in ...`. De eigen duurregel van Vitest blijft het detail per shard.
- Gedeelde OpenClaw-teststatus: gebruik `src/test-utils/openclaw-test-state.ts` vanuit Vitest wanneer een test een geïsoleerde `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, configuratiefixture, workspace, agentdirectory of auth-profile-store nodig heeft.
- Proces-E2E-helpers: gebruik `test/helpers/openclaw-test-instance.ts` wanneer een Vitest-procesniveau-E2E-test op één plek een draaiende Gateway, CLI-env, logopvang en cleanup nodig heeft.
- Docker/Bash-E2E-helpers: lanes die `scripts/lib/docker-e2e-image.sh` sourcen, kunnen `docker_e2e_test_state_shell_b64 <label> <scenario>` aan de container doorgeven en het decoderen met `scripts/lib/openclaw-e2e-instance.sh`; multi-home-scripts kunnen `docker_e2e_test_state_function_b64` doorgeven en `openclaw_test_state_create <label> <scenario>` in elke flow aanroepen. Callers op lager niveau kunnen `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` gebruiken voor een shellsnippet in de container, of `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` voor een sourcebaar host-env-bestand. De `--` vóór `create` voorkomt dat nieuwere Node-runtimes `--env-file` als een Node-flag behandelen. Docker/Bash-lanes die een Gateway starten, kunnen `scripts/lib/openclaw-e2e-instance.sh` binnen de container sourcen voor entrypoint-resolutie, mock-OpenAI-startup, Gateway-start op de voorgrond/achtergrond, readiness-probes, export van status-env, logdumps en proces-cleanup.
- Volledige, extensie- en include-pattern-shardruns werken lokale timingdata bij in `.artifacts/vitest-shard-timings.json`; latere whole-config-runs gebruiken die timings om langzame en snelle shards te balanceren. Include-pattern-CI-shards voegen de shardnaam toe aan de timingsleutel, waardoor gefilterde shardtimings zichtbaar blijven zonder whole-config-timingdata te vervangen. Zet `OPENCLAW_TEST_PROJECTS_TIMINGS=0` om het lokale timingartefact te negeren.
- Geselecteerde `plugin-sdk`- en `commands`-testbestanden routeren nu via speciale lichte lanes die alleen `test/setup.ts` behouden, terwijl runtime-zware gevallen op hun bestaande lanes blijven.
- Bronbestanden met naastgelegen tests mappen naar die naastgelegen test voordat wordt teruggevallen op bredere directoryglobs. Helperbewerkingen onder `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` en `src/plugins/contracts` gebruiken een lokale importgraph om importerentests te draaien in plaats van elke shard breed te draaien wanneer het afhankelijkheidspad precies is.
- `auto-reply` splitst nu ook in drie speciale configs (`core`, `top-level`, `reply`) zodat het reply-harnas de lichtere top-level status-/token-/helpertests niet domineert.
- De basis-Vitest-config gebruikt nu standaard `pool: "threads"` en `isolate: false`, met de gedeelde niet-geïsoleerde runner ingeschakeld in de repo-configs.
- `pnpm test:channels` draait `vitest.channels.config.ts`.
- `pnpm test:extensions` en `pnpm test extensions` draaien alle extensie-/Plugin-shards. Zware channel-plugins, de browser-Plugin en OpenAI draaien als speciale shards; andere Plugingroepen blijven gebundeld. Gebruik `pnpm test extensions/<id>` voor één gebundelde Plugin-lane.
- `pnpm test:perf:imports`: schakelt Vitest-rapportage voor importduur + importuitsplitsing in, terwijl nog steeds gescopete lane-routering wordt gebruikt voor expliciete bestands-/directorytargets.
- `pnpm test:perf:imports:changed`: dezelfde importprofilering, maar alleen voor bestanden die sinds `origin/main` zijn gewijzigd.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkt het gerouteerde changed-mode-pad tegenover de native root-projectrun voor dezelfde gecommitte git-diff.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkt de huidige wijzigingsset in de worktree zonder eerst te committen.
- `pnpm test:perf:profile:main`: schrijft een CPU-profiel voor de Vitest-mainthread (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: schrijft CPU- en heap-profielen voor de unitrunner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: draait elke full-suite Vitest-leaf-config serieel en schrijft gegroepeerde duurdata plus JSON-/logartefacten per config. De Test Performance Agent gebruikt dit als baseline voordat hij trage-testfixes probeert.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: vergelijkt gegroepeerde rapporten na een prestatiegerichte wijziging.
- Gateway-integratie: opt-in via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` of `pnpm test:gateway`.
- `pnpm test:e2e`: Draait gateway-end-to-end-smoketests (multi-instance WS/HTTP/node-pairing). Gebruikt standaard `threads` + `isolate: false` met adaptieve workers in `vitest.e2e.config.ts`; stem af met `OPENCLAW_E2E_WORKERS=<n>` en zet `OPENCLAW_E2E_VERBOSE=1` voor uitgebreide logs.
- `pnpm test:live`: Draait provider-livetests (minimax/zai). Vereist API-sleutels en `LIVE=1` (of providerspecifieke `*_LIVE_TEST=1`) om niet over te slaan.
- `pnpm test:docker:all`: Bouwt de gedeelde live-test-image, verpakt OpenClaw één keer als een npm-tarball, bouwt/hergebruikt een kale Node/Git-runnerimage plus een functionele image die die tarball in `/app` installeert, en draait daarna Docker-smokelanes met `OPENCLAW_SKIP_DOCKER_BUILD=1` via een gewogen scheduler. De kale image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) wordt gebruikt voor installer-/update-/plugin-afhankelijkheidslanes; die lanes mounten de vooraf gebouwde tarball in plaats van gekopieerde repo-bronnen te gebruiken. De functionele image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) wordt gebruikt voor normale functionaliteitslanes van de gebouwde app. `scripts/package-openclaw-for-docker.mjs` is de enige lokale/CI-packagepacker en valideert de tarball plus `dist/postinstall-inventory.json` voordat Docker deze consumeert. Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`; plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` voert het geselecteerde plan uit. `node scripts/test-docker-all.mjs --plan-json` geeft het scheduler-owned CI-plan uit voor geselecteerde lanes, image-soorten, package-/live-image-behoeften, statusscenario's en credentialchecks zonder Docker te bouwen of te draaien. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` beheert processlots en gebruikt standaard 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` beheert de providergevoelige tail-pool en gebruikt standaard 10. Zware-lane-limieten zijn standaard `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` en `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; providerlimieten zijn standaard één zware lane per provider via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` en `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Gebruik `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` of `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` voor grotere hosts. Als één lane de effectieve gewichtslimiet of resourcelimiet op een host met lage paralleliteit overschrijdt, kan deze nog steeds vanuit een lege pool starten en alleen draaien totdat capaciteit wordt vrijgegeven. Lanestarts worden standaard met 2 seconden gespreid om lokale Docker-daemon-createstormen te voorkomen; overschrijf dit met `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. De runner voert standaard een Docker-preflight uit, ruimt verouderde OpenClaw-E2E-containers op, geeft elke 30 seconden actieve-lane-status uit, deelt provider-CLI-toolcaches tussen compatibele lanes, probeert tijdelijke live-providerfouten standaard één keer opnieuw (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) en slaat lanetimings op in `.artifacts/docker-tests/lane-timings.json` voor langste-eerst-ordening bij latere runs. Gebruik `OPENCLAW_DOCKER_ALL_DRY_RUN=1` om het lanemanifest te printen zonder Docker te draaien, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` om statusuitvoer af te stemmen, of `OPENCLAW_DOCKER_ALL_TIMINGS=0` om hergebruik van timings uit te schakelen. Gebruik `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` alleen voor deterministische/lokale lanes of `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` alleen voor live-providerlanes; package-aliassen zijn `pnpm test:docker:local:all` en `pnpm test:docker:live:all`. Live-only-modus voegt main- en tail-livelanes samen in één langste-eerst-pool zodat providerbuckets Claude-, Codex- en Gemini-werk samen kunnen packen. De runner stopt met het schedulen van nieuwe pooled lanes na de eerste failure tenzij `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` is gezet, en elke lane heeft een fallbacktimeout van 120 minuten die overschrijfbaar is met `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; geselecteerde live-/tail-lanes gebruiken strakkere limieten per lane. Docker-setupcommando's voor CLI-backends hebben hun eigen timeout via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (standaard 180). Logs per lane, `summary.json`, `failures.json` en fasetimings worden weggeschreven onder `.artifacts/docker-tests/<run-id>/`; gebruik `pnpm test:docker:timings <summary.json>` om langzame lanes te inspecteren en `pnpm test:docker:rerun <run-id|summary.json|failures.json>` om goedkope gerichte reruncommando's te printen.
- `pnpm test:docker:browser-cdp-snapshot`: Bouwt een Chromium-backed source-E2E-container, start raw CDP plus een geïsoleerde Gateway, draait `browser doctor --deep` en verifieert dat CDP-rolsnapshots link-URL's, cursor-gepromoveerde klikbare elementen, iframe-referenties en framemetadata bevatten.
- Live-Docker-probes voor CLI-backends kunnen als gerichte lanes worden gedraaid, bijvoorbeeld `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` of `pnpm test:docker:live-cli-backend:codex:mcp`. Claude en Gemini hebben overeenkomende aliassen `:resume` en `:mcp`.
- `pnpm test:docker:openwebui`: Start gedockeriseerde OpenClaw + Open WebUI, meldt aan via Open WebUI, controleert `/api/models` en draait daarna een echte geproxiede chat via `/api/chat/completions`. Vereist een bruikbare live-modelsleutel (bijvoorbeeld OpenAI in `~/.profile`), haalt een externe Open WebUI-image op en wordt niet verwacht CI-stabiel te zijn zoals de normale unit-/e2e-suites.
- `pnpm test:docker:mcp-channels`: Start een geseede Gateway-container en een tweede clientcontainer die `openclaw mcp serve` spawnt, en verifieert daarna gerouteerde conversatiedetectie, transcriptlezingen, bijlagemetadata, live-eventqueuegedrag, outbound-send-routering en Claude-achtige channel- en permissiemeldingen via de echte stdio-bridge. De Claude-meldingsassertie leest de raw stdio-MCP-frames direct zodat de smoke weerspiegelt wat de bridge daadwerkelijk emitteert.
- `pnpm test:docker:upgrade-survivor`: Installeert de ingepakte OpenClaw-tarball over een vervuilde fixture voor oude gebruikers, voert een pakketupdate plus niet-interactieve doctor uit zonder live provider- of kanaalsleutels, start vervolgens een loopback-Gateway en controleert of agents, kanaalconfiguratie, Plugin-allowlists, workspace-/sessiebestanden, verouderde legacy Plugin-afhankelijkheidsstatus, opstarten en RPC-status behouden blijven.
- `pnpm test:docker:published-upgrade-survivor`: Installeert standaard `openclaw@latest`, plaatst realistische bestanden van bestaande gebruikers zonder live provider- of kanaalsleutels, configureert die baseline met een ingebakken `openclaw config set`-opdrachtrecept, werkt die gepubliceerde installatie bij naar de ingepakte OpenClaw-tarball, voert niet-interactieve doctor uit, schrijft `.artifacts/upgrade-survivor/summary.json`, start vervolgens een loopback-Gateway en controleert of geconfigureerde intents, workspace-/sessiebestanden, verouderde Plugin-configuratie en legacy afhankelijkheidsstatus, opstarten, `/healthz`, `/readyz` en RPC-status behouden blijven of netjes worden gerepareerd. Overschrijf één baseline met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, breid een exacte matrix uit met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` zoals `all-since-2026.4.23`, of voeg scenariofixtures toe met `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; de reported-issues-set bevat `configured-plugin-installs` om te verifiëren dat geconfigureerde externe OpenClaw-plugins automatisch tijdens de upgrade worden geïnstalleerd en `stale-source-plugin-shadow` om te voorkomen dat bron-only Plugin-schaduwen het opstarten breken. Package Acceptance stelt deze beschikbaar als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` en `published_upgrade_survivor_scenarios`.
- `pnpm test:docker:update-migration`: Voert de published-upgrade-survivor-harness uit in het opruimingsintensieve scenario `plugin-deps-cleanup`, standaard beginnend bij `openclaw@2026.4.23`. De afzonderlijke workflow `Update Migration` breidt deze lane uit met `baselines=all-since-2026.4.23`, zodat elk stabiel gepubliceerd pakket vanaf `.23` wordt bijgewerkt naar de kandidaat en dependency-opruiming voor geconfigureerde plugins bewijst buiten Full Release CI.
- `pnpm test:docker:plugins`: Voert install/update-smoke uit voor lokaal pad, `file:`, npm-registrypakketten met gehesen afhankelijkheden, git moving refs, ClawHub-fixtures, marketplace-updates en Claude-bundle inschakelen/inspecteren.

## Lokale PR-gate

Voor lokale PR-land-/gate-controles voer je uit:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Als `pnpm test` hapert op een belaste host, voer het dan nog één keer uit voordat je het als regressie behandelt, en isoleer daarna met `pnpm test <path/to/test>`. Gebruik voor hosts met beperkte hoeveelheid geheugen:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model-latencybenchmark (lokale sleutels)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Gebruik:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Optionele env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Standaardprompt: “Antwoord met één enkel woord: ok. Geen interpunctie of extra tekst.”

Laatste uitvoering (2025-12-31, 20 runs):

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

De uitvoer bevat `sampleCount`, gemiddelde, p50, p95, min/max, verdeling van exitcode/signaal en samenvattingen van maximale RSS voor elke opdracht. Optioneel schrijft `--cpu-prof-dir` / `--heap-prof-dir` V8-profielen per run, zodat timing en profielregistratie dezelfde harness gebruiken.

Conventies voor opgeslagen uitvoer:

- `pnpm test:startup:bench:smoke` schrijft het gerichte smoke-artefact naar `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` schrijft het artefact voor de volledige suite naar `.artifacts/cli-startup-bench-all.json` met `runs=5` en `warmup=1`
- `pnpm test:startup:bench:update` ververst de ingecheckte baseline-fixture op `test/fixtures/cli-startup-bench.json` met `runs=5` en `warmup=1`

Ingecheckte fixture:

- `test/fixtures/cli-startup-bench.json`
- Ververs met `pnpm test:startup:bench:update`
- Vergelijk huidige resultaten met de fixture via `pnpm test:startup:bench:check`

## Onboarding-E2E (Docker)

Docker is optioneel; dit is alleen nodig voor gecontaineriseerde onboarding-smoketests.

Volledige cold-start-flow in een schone Linux-container:

```bash
scripts/e2e/onboard-docker.sh
```

Dit script stuurt de interactieve wizard aan via een pseudo-tty, verifieert config-/workspace-/sessiebestanden, start daarna de Gateway en voert `openclaw health` uit.

## QR-importsmoke (Docker)

Zorgt ervoor dat de onderhouden QR-runtimehelper laadt onder de ondersteunde Docker Node-runtimes (Node 24 standaard, Node 22 compatibel):

```bash
pnpm test:docker:qr
```

## Gerelateerd

- [Testen](/nl/help/testing)
- [Live testen](/nl/help/testing-live)
- [Updates en plugins testen](/nl/help/testing-updates-plugins)
