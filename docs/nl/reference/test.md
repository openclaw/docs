---
read_when:
    - Tests uitvoeren of oplossen
summary: Tests lokaal uitvoeren (vitest) en wanneer je force-/coverage-modi gebruikt
title: Testen
x-i18n:
    generated_at: "2026-04-30T18:38:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 131f2bad3b2806d28394213cec38d632d106ddbf8ff04d06345ab8046fb8bcf2
    source_path: reference/test.md
    workflow: 16
---

- Volledige testkit (suites, live, Docker): [Testen](/nl/help/testing)

- `pnpm test:force`: Beëindigt elk achtergebleven Gateway-proces dat de standaardbesturingspoort bezet houdt en voert daarna de volledige Vitest-suite uit met een geïsoleerde Gateway-poort, zodat servertests niet botsen met een draaiende instantie. Gebruik dit wanneer een eerdere Gateway-run poort 18789 bezet heeft achtergelaten.
- `pnpm test:coverage`: Voert de unitsuite uit met V8-dekking (via `vitest.unit.config.ts`). Dit is een dekkingsgate voor geladen bestanden in unit tests, geen all-file-dekking voor de hele repo. Drempels zijn 70% regels/functies/statements en 55% branches. Omdat `coverage.all` false is, meet de gate bestanden die door de unit-dekkingssuite zijn geladen, in plaats van elk split-lane bronbestand als ongedekt te behandelen.
- `pnpm test:coverage:changed`: Voert unitdekking alleen uit voor bestanden die sinds `origin/main` zijn gewijzigd.
- `pnpm test:changed`: goedkope slimme gewijzigde-testrun. Deze voert precieze doelen uit op basis van directe testbewerkingen, naastliggende `*.test.ts`-bestanden, expliciete bronmappings en de lokale importgraaf. Brede/configuratie-/pakketwijzigingen worden overgeslagen tenzij ze naar precieze tests mappen.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: expliciete brede gewijzigde-testrun. Gebruik dit wanneer een wijziging aan testharnas/configuratie/pakket moet terugvallen op Vitest's bredere changed-test-gedrag.
- `pnpm changed:lanes`: toont de architecturale lanes die door de diff tegen `origin/main` worden geactiveerd.
- `pnpm check:changed`: voert de slimme gewijzigde-checkgate uit voor de diff tegen `origin/main`. Deze voert typecheck-, lint- en guard-commando's uit voor de getroffen architecturale lanes, maar voert geen Vitest-tests uit. Gebruik `pnpm test:changed` of expliciet `pnpm test <target>` voor testbewijs.
- `pnpm test`: routeert expliciete bestands-/directorydoelen via gescopete Vitest-lanes. Runs zonder doel gebruiken vaste shardgroepen en worden uitgebreid naar leaf-configuraties voor lokale parallelle uitvoering; de extensiegroep wordt altijd uitgebreid naar de per-extensie shardconfiguraties in plaats van één enorm root-projectproces.
- Testwrapper-runs eindigen met een korte samenvatting `[test] passed|failed|skipped ... in ...`. Vitest's eigen duurregel blijft het detail per shard.
- Gedeelde OpenClaw-teststatus: gebruik `src/test-utils/openclaw-test-state.ts` vanuit Vitest wanneer een test een geïsoleerde `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, configuratiefixture, workspace, agentdirectory of auth-profile-opslag nodig heeft.
- Proces-E2E-helpers: gebruik `test/helpers/openclaw-test-instance.ts` wanneer een Vitest-procesniveau-E2E-test een draaiende Gateway, CLI-env, logregistratie en opschoning op één plek nodig heeft.
- Docker/Bash-E2E-helpers: lanes die `scripts/lib/docker-e2e-image.sh` sourcen, kunnen `docker_e2e_test_state_shell_b64 <label> <scenario>` aan de container doorgeven en dit decoderen met `scripts/lib/openclaw-e2e-instance.sh`; scripts met meerdere homes kunnen `docker_e2e_test_state_function_b64` doorgeven en `openclaw_test_state_create <label> <scenario>` in elke flow aanroepen. Callers op lager niveau kunnen `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` gebruiken voor een shellsnippet in de container, of `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` voor een sourcebaar host-env-bestand. De `--` vóór `create` voorkomt dat nieuwere Node-runtimes `--env-file` als een Node-vlag behandelen. Docker/Bash-lanes die een Gateway starten, kunnen `scripts/lib/openclaw-e2e-instance.sh` binnen de container sourcen voor entrypoint-resolutie, mock-OpenAI-start, Gateway-start op voorgrond/achtergrond, readiness-probes, export van status-env, logdumps en procesopschoning.
- Volledige, extensie- en include-pattern-shardruns werken lokale timinggegevens bij in `.artifacts/vitest-shard-timings.json`; latere runs met hele configuraties gebruiken die timings om trage en snelle shards te balanceren. Include-pattern-CI-shards voegen de shardnaam toe aan de timingsleutel, waardoor gefilterde shardtimings zichtbaar blijven zonder timinggegevens voor hele configuraties te vervangen. Stel `OPENCLAW_TEST_PROJECTS_TIMINGS=0` in om het lokale timingartefact te negeren.
- Geselecteerde `plugin-sdk`- en `commands`-testbestanden worden nu via speciale lichte lanes gerouteerd die alleen `test/setup.ts` behouden, terwijl runtime-zware gevallen op hun bestaande lanes blijven.
- Bronbestanden met naastliggende tests mappen naar die naastliggende test voordat ze terugvallen op bredere directoryglobs. Helperbewerkingen onder `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` en `src/plugins/contracts` gebruiken een lokale importgraaf om importerende tests uit te voeren in plaats van elke shard breed uit te voeren wanneer het afhankelijkheidspad precies is.
- `auto-reply` wordt nu ook opgesplitst in drie speciale configuraties (`core`, `top-level`, `reply`), zodat het reply-harnas de lichtere top-level status-/token-/helpertests niet domineert.
- De basis-Vitest-configuratie gebruikt nu standaard `pool: "threads"` en `isolate: false`, met de gedeelde niet-geïsoleerde runner ingeschakeld in alle repo-configuraties.
- `pnpm test:channels` voert `vitest.channels.config.ts` uit.
- `pnpm test:extensions` en `pnpm test extensions` voeren alle extensie-/pluginshards uit. Zware kanaalplugins, de browserplugin en OpenAI worden als speciale shards uitgevoerd; andere plugingroepen blijven gebatcht. Gebruik `pnpm test extensions/<id>` voor één gebundelde pluginlane.
- `pnpm test:perf:imports`: schakelt Vitest import-duration- en import-breakdown-rapportage in, terwijl nog steeds gescopete lane-routing wordt gebruikt voor expliciete bestands-/directorydoelen.
- `pnpm test:perf:imports:changed`: dezelfde importprofilering, maar alleen voor bestanden die sinds `origin/main` zijn gewijzigd.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkt het gerouteerde changed-mode-pad tegen de native root-projectrun voor dezelfde gecommitte gitdiff.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkt de huidige worktree-wijzigingsset zonder eerst te committen.
- `pnpm test:perf:profile:main`: schrijft een CPU-profiel voor de Vitest-hoofdthread (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: schrijft CPU- en heap-profielen voor de unitrunner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: voert elke full-suite Vitest-leafconfiguratie serieel uit en schrijft gegroepeerde duurgegevens plus JSON-/logartefacten per configuratie. De Test Performance Agent gebruikt dit als baseline voordat slow-test-fixes worden geprobeerd.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: vergelijkt gegroepeerde rapporten na een prestatiegerichte wijziging.
- Gateway-integratie: opt-in via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` of `pnpm test:gateway`.
- `pnpm test:e2e`: Voert Gateway end-to-end rooktests uit (multi-instance WS/HTTP/node-pairing). Gebruikt standaard `threads` + `isolate: false` met adaptieve workers in `vitest.e2e.config.ts`; stem af met `OPENCLAW_E2E_WORKERS=<n>` en stel `OPENCLAW_E2E_VERBOSE=1` in voor uitgebreide logs.
- `pnpm test:live`: Voert live providertests uit (minimax/zai). Vereist API-sleutels en `LIVE=1` (of providerspecifiek `*_LIVE_TEST=1`) om ze niet over te slaan.
- `pnpm test:docker:all`: Bouwt de gedeelde live-testimage, verpakt OpenClaw één keer als npm-tarball, bouwt/hergebruikt een kale Node/Git-runnerimage plus een functionele image die die tarball in `/app` installeert, en voert daarna Docker-rooklanes uit met `OPENCLAW_SKIP_DOCKER_BUILD=1` via een gewogen planner. De kale image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) wordt gebruikt voor installer-/update-/plugin-afhankelijkheidslanes; die lanes mounten de vooraf gebouwde tarball in plaats van gekopieerde repobronnen te gebruiken. De functionele image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) wordt gebruikt voor normale ingebouwde appfunctionaliteitslanes. `scripts/package-openclaw-for-docker.mjs` is de enige lokale/CI-pakketpacker en valideert de tarball plus `dist/postinstall-inventory.json` voordat Docker deze gebruikt. Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`; plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` voert het geselecteerde plan uit. `node scripts/test-docker-all.mjs --plan-json` emitteert het door de scheduler beheerde CI-plan voor geselecteerde lanes, image-soorten, pakket-/live-imagebehoeften, statusscenario's en credentialcontroles zonder Docker te bouwen of uit te voeren. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` beheert processlots en gebruikt standaard 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` beheert de providergevoelige tail-pool en gebruikt standaard 10. Zware lane-limieten zijn standaard `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` en `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; providerlimieten zijn standaard één zware lane per provider via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` en `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Gebruik `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` of `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` voor grotere hosts. Als één lane de effectieve gewichtslimiet of resourcelimiet op een host met lage paralleliteit overschrijdt, kan die nog steeds vanuit een lege pool starten en alleen draaien totdat capaciteit wordt vrijgegeven. Lane-starts worden standaard met 2 seconden gespreid om lokale Docker-daemon-create-stormen te voorkomen; overschrijf dit met `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. De runner voert standaard Docker-preflights uit, ruimt verouderde OpenClaw-E2E-containers op, emitteert elke 30 seconden actieve-lanestatus, deelt provider-CLI-toolcaches tussen compatibele lanes, probeert tijdelijke live-providerfouten standaard één keer opnieuw (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) en slaat lanetimings op in `.artifacts/docker-tests/lane-timings.json` voor langste-eerst-volgorde bij latere runs. Gebruik `OPENCLAW_DOCKER_ALL_DRY_RUN=1` om het lanemanifest af te drukken zonder Docker uit te voeren, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` om statusuitvoer af te stemmen, of `OPENCLAW_DOCKER_ALL_TIMINGS=0` om timinghergebruik uit te schakelen. Gebruik `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` alleen voor deterministische/lokale lanes of `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` alleen voor live-providerlanes; pakketaliassen zijn `pnpm test:docker:local:all` en `pnpm test:docker:live:all`. Live-only-modus voegt main- en tail-live-lanes samen tot één langste-eerst-pool, zodat providerbuckets Claude-, Codex- en Gemini-werk samen kunnen inpakken. De runner stopt met het plannen van nieuwe gepoolde lanes na de eerste fout, tenzij `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` is ingesteld, en elke lane heeft een fallback-time-out van 120 minuten die kan worden overschreven met `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; geselecteerde live-/tail-lanes gebruiken strakkere limieten per lane. CLI-backend-Docker-setupcommando's hebben hun eigen time-out via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (standaard 180). Logs per lane, `summary.json`, `failures.json` en fase-timings worden geschreven onder `.artifacts/docker-tests/<run-id>/`; gebruik `pnpm test:docker:timings <summary.json>` om trage lanes te inspecteren en `pnpm test:docker:rerun <run-id|summary.json|failures.json>` om goedkope gerichte rerun-commando's af te drukken.
- `pnpm test:docker:browser-cdp-snapshot`: Bouwt een Chromium-backed source-E2E-container, start raw CDP plus een geïsoleerde Gateway, voert `browser doctor --deep` uit en verifieert dat CDP-rolsnapshots link-URL's, cursor-gepromote klikbare elementen, iframe-referenties en framemetadata bevatten.
- CLI-backend-live-Docker-probes kunnen als gerichte lanes worden uitgevoerd, bijvoorbeeld `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` of `pnpm test:docker:live-cli-backend:codex:mcp`. Claude en Gemini hebben bijpassende `:resume`- en `:mcp`-aliassen.
- `pnpm test:docker:openwebui`: Start gedockeriseerde OpenClaw + Open WebUI, meldt zich aan via Open WebUI, controleert `/api/models` en voert daarna een echte geproxiede chat uit via `/api/chat/completions`. Vereist een bruikbare live-modelsleutel (bijvoorbeeld OpenAI in `~/.profile`), haalt een externe Open WebUI-image op en wordt niet verwacht CI-stabiel te zijn zoals de normale unit-/e2e-suites.
- `pnpm test:docker:mcp-channels`: Start een geseede Gateway-container en een tweede clientcontainer die `openclaw mcp serve` spawnt, en verifieert daarna gerouteerde gespreksdetectie, transcriptreads, bijlagemetadata, gedrag van live-eventqueues, routering van outbound sends en Claude-stijl kanaal- en permissiemeldingen via de echte stdio-bridge. De Claude-meldingsassertie leest de raw stdio MCP-frames rechtstreeks, zodat de smoke weergeeft wat de bridge daadwerkelijk emitteert.
- `pnpm test:docker:upgrade-survivor`: Installeert de verpakte OpenClaw-tarball over een vervuilde fixture voor oude gebruikers, voert een pakketupdate plus niet-interactieve doctor uit zonder live provider- of kanaalsleutels, start vervolgens een loopback-Gateway en controleert of agents, kanaalconfiguratie, Plugin-toestaanlijsten, workspace-/sessiebestanden, verouderde Plugin-`runtime-deps`-status, opstarten en RPC-status behouden blijven.

## Lokale PR-gate

Voor lokale PR-landings-/gatecontroles voer je uit:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Als `pnpm test` hapert op een zwaar belaste host, voer het dan eenmaal opnieuw uit voordat je het als een regressie behandelt, en isoleer daarna met `pnpm test <path/to/test>`. Gebruik voor hosts met beperkte geheugenruimte:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model-latentiebenchmark (lokale sleutels)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Gebruik:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Optionele env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Standaardprompt: “Antwoord met één enkel woord: ok. Geen interpunctie of extra tekst.”

Laatste run (2025-12-31, 20 runs):

- minimax mediaan 1279 ms (min 1114, max 2431)
- opus mediaan 2454 ms (min 1224, max 3170)

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

Uitvoer bevat `sampleCount`, gemiddelde, p50, p95, min/max, exit-code-/signaalverdeling en samenvattingen van max RSS voor elke opdracht. Optioneel schrijft `--cpu-prof-dir` / `--heap-prof-dir` V8-profielen per run, zodat timing en profielvastlegging dezelfde harness gebruiken.

Conventies voor opgeslagen uitvoer:

- `pnpm test:startup:bench:smoke` schrijft het gerichte smoke-artefact naar `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` schrijft het full-suite-artefact naar `.artifacts/cli-startup-bench-all.json` met `runs=5` en `warmup=1`
- `pnpm test:startup:bench:update` vernieuwt de ingecheckte baseline-fixture op `test/fixtures/cli-startup-bench.json` met `runs=5` en `warmup=1`

Ingecheckte fixture:

- `test/fixtures/cli-startup-bench.json`
- Vernieuw met `pnpm test:startup:bench:update`
- Vergelijk huidige resultaten met de fixture via `pnpm test:startup:bench:check`

## Onboarding-E2E (Docker)

Docker is optioneel; dit is alleen nodig voor gecontaineriseerde onboarding-smoketests.

Volledige cold-start-flow in een schone Linux-container:

```bash
scripts/e2e/onboard-docker.sh
```

Dit script stuurt de interactieve wizard aan via een pseudo-tty, verifieert configuratie-/workspace-/sessiebestanden, start daarna de Gateway en voert `openclaw health` uit.

## QR-importsmoke (Docker)

Zorgt ervoor dat de onderhouden QR-runtimehelper wordt geladen onder de ondersteunde Docker Node-runtimes (Node 24 standaard, Node 22 compatibel):

```bash
pnpm test:docker:qr
```

## Gerelateerd

- [Testen](/nl/help/testing)
- [Live testen](/nl/help/testing-live)
