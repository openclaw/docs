---
read_when:
    - Tests uitvoeren of herstellen
summary: Tests lokaal uitvoeren (vitest) en wanneer je force/coverage-modi gebruikt
title: Tests
x-i18n:
    generated_at: "2026-04-29T23:17:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9328d6f0383b5067fa8bb5d0f1bf22a3b9048a267908bf85167842ddc3d12e42
    source_path: reference/test.md
    workflow: 16
---

- Volledige testkit (suites, live, Docker): [Testen](/nl/help/testing)

- `pnpm test:force`: Beëindigt elk achtergebleven Gateway-proces dat de standaardcontrolepoort bezet houdt, en draait daarna de volledige Vitest-suite met een geïsoleerde Gateway-poort zodat servertests niet botsen met een draaiende instantie. Gebruik dit wanneer een eerdere Gateway-run poort 18789 bezet heeft achtergelaten.
- `pnpm test:coverage`: Draait de unitsuite met V8-coverage (via `vitest.unit.config.ts`). Dit is een coverage-gate voor geladen bestanden, niet whole-repo all-file coverage. Drempels zijn 70% voor regels/functies/statements en 55% voor branches. Omdat `coverage.all` false is, meet de gate bestanden die door de unit-coveragesuite zijn geladen in plaats van elk split-lane bronbestand als ongedekt te behandelen.
- `pnpm test:coverage:changed`: Draait unit-coverage alleen voor bestanden die sinds `origin/main` zijn gewijzigd.
- `pnpm test:changed`: goedkope slimme gewijzigde-test-run. Deze draait precieze targets uit directe testbewerkingen, naastgelegen `*.test.ts`-bestanden, expliciete bronmappings en de lokale importgraaf. Brede/configuratie-/pakketwijzigingen worden overgeslagen tenzij ze naar precieze tests mappen.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: expliciete brede gewijzigde-test-run. Gebruik dit wanneer een wijziging in testharnas/configuratie/pakket moet terugvallen op Vitest's bredere gewijzigde-testgedrag.
- `pnpm changed:lanes`: toont de architecturale lanes die worden geactiveerd door de diff tegen `origin/main`.
- `pnpm check:changed`: draait de slimme gewijzigde-check-gate voor de diff tegen `origin/main`. Deze draait typecheck-, lint- en guard-commando's voor de getroffen architecturale lanes, maar draait geen Vitest-tests. Gebruik `pnpm test:changed` of expliciet `pnpm test <target>` voor testbewijs.
- `pnpm test`: routeert expliciete bestands-/directorytargets via gescopete Vitest-lanes. Niet-getargete runs gebruiken vaste shardgroepen en breiden uit naar leaf-configs voor lokale parallelle uitvoering; de extensiegroep breidt altijd uit naar de per-extensie shardconfigs in plaats van één enorm root-projectproces.
- Testwrapper-runs eindigen met een korte `[test] passed|failed|skipped ... in ...`-samenvatting. Vitest's eigen duurregel blijft het detail per shard.
- Gedeelde OpenClaw-teststatus: gebruik `src/test-utils/openclaw-test-state.ts` vanuit Vitest wanneer een test een geïsoleerde `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, configuratiefixture, workspace, agentdirectory of auth-profielstore nodig heeft.
- Process E2E-helpers: gebruik `test/helpers/openclaw-test-instance.ts` wanneer een Vitest E2E-test op procesniveau een draaiende Gateway, CLI-env, logvastlegging en opschoning op één plek nodig heeft.
- Docker/Bash E2E-helpers: lanes die `scripts/lib/docker-e2e-image.sh` sourcen, kunnen `docker_e2e_test_state_shell_b64 <label> <scenario>` aan de container doorgeven en dit decoderen met `scripts/lib/openclaw-e2e-instance.sh`; multi-home-scripts kunnen `docker_e2e_test_state_function_b64` doorgeven en `openclaw_test_state_create <label> <scenario>` in elke flow aanroepen. Lower-level callers kunnen `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` gebruiken voor een shellsnippet in de container, of `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` voor een sourcebaar host-env-bestand. De `--` vóór `create` voorkomt dat nieuwere Node-runtimes `--env-file` als een Node-flag behandelen. Docker/Bash-lanes die een Gateway starten, kunnen `scripts/lib/openclaw-e2e-instance.sh` binnen de container sourcen voor entrypoint-resolutie, mock-OpenAI-startup, Gateway-foreground/background-start, readiness-probes, state-env-export, logdumps en procesopschoning.
- Full-, extensie- en include-pattern-shard-runs werken lokale timingdata bij in `.artifacts/vitest-shard-timings.json`; latere whole-config-runs gebruiken die timings om langzame en snelle shards te balanceren. Include-pattern-CI-shards voegen de shardnaam toe aan de timingsleutel, waardoor gefilterde shardtimings zichtbaar blijven zonder whole-config timingdata te vervangen. Stel `OPENCLAW_TEST_PROJECTS_TIMINGS=0` in om het lokale timingartefact te negeren.
- Geselecteerde `plugin-sdk`- en `commands`-testbestanden routeren nu via dedicated lichte lanes die alleen `test/setup.ts` behouden, terwijl runtime-zware cases op hun bestaande lanes blijven.
- Bronbestanden met naastgelegen tests mappen naar die naastgelegen test voordat ze terugvallen op bredere directoryglobs. Helperbewerkingen onder `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` en `src/plugins/contracts` gebruiken een lokale importgraaf om importerende tests te draaien in plaats van elke shard breed te draaien wanneer het afhankelijkheidspad precies is.
- `auto-reply` splitst nu ook in drie dedicated configs (`core`, `top-level`, `reply`) zodat het reply-harnas de lichtere top-level status-/token-/helpertests niet domineert.
- De basis-Vitest-config gebruikt nu standaard `pool: "threads"` en `isolate: false`, met de gedeelde niet-geïsoleerde runner ingeschakeld in de repo-configs.
- `pnpm test:channels` draait `vitest.channels.config.ts`.
- `pnpm test:extensions` en `pnpm test extensions` draaien alle extensie-/pluginshards. Zware kanaalplugins, de browserplugin en OpenAI draaien als dedicated shards; andere plugingroepen blijven gebatcht. Gebruik `pnpm test extensions/<id>` voor één gebundelde plugin-lane.
- `pnpm test:perf:imports`: schakelt Vitest import-duration- en import-breakdown-rapportage in, terwijl nog steeds gescopete lane-routering wordt gebruikt voor expliciete bestands-/directorytargets.
- `pnpm test:perf:imports:changed`: dezelfde importprofilering, maar alleen voor bestanden die sinds `origin/main` zijn gewijzigd.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkt het gerouteerde changed-mode-pad tegen de native root-project-run voor dezelfde gecommitte git-diff.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkt de huidige changeset in de worktree zonder eerst te committen.
- `pnpm test:perf:profile:main`: schrijft een CPU-profiel voor de Vitest-mainthread (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: schrijft CPU- en heap-profielen voor de unitrunner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: draait elke full-suite Vitest leaf-config serieel en schrijft gegroepeerde duurdata plus per-config JSON-/logartefacten. De Test Performance Agent gebruikt dit als baseline voordat hij slow-test-fixes probeert.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: vergelijkt gegroepeerde rapporten na een performancegerichte wijziging.
- Gateway-integratie: opt-in via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` of `pnpm test:gateway`.
- `pnpm test:e2e`: Draait Gateway end-to-end smoketests (multi-instance WS/HTTP/node-pairing). Gebruikt standaard `threads` + `isolate: false` met adaptieve workers in `vitest.e2e.config.ts`; stem af met `OPENCLAW_E2E_WORKERS=<n>` en stel `OPENCLAW_E2E_VERBOSE=1` in voor uitgebreide logs.
- `pnpm test:live`: Draait live providertests (minimax/zai). Vereist API-sleutels en `LIVE=1` (of provider-specifieke `*_LIVE_TEST=1`) om niet over te slaan.
- `pnpm test:docker:all`: Bouwt de gedeelde live-testimage, verpakt OpenClaw één keer als een npm-tarball, bouwt/hergebruikt een kale Node/Git-runnerimage plus een functionele image die die tarball installeert in `/app`, en draait daarna Docker-smokelanes met `OPENCLAW_SKIP_DOCKER_BUILD=1` via een gewogen scheduler. De kale image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) wordt gebruikt voor installer-/update-/plugin-afhankelijkheidslanes; die lanes mounten de vooraf gebouwde tarball in plaats van gekopieerde repobronnen te gebruiken. De functionele image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) wordt gebruikt voor normale built-app-functionaliteitslanes. `scripts/package-openclaw-for-docker.mjs` is de enige lokale/CI-packagepacker en valideert de tarball plus `dist/postinstall-inventory.json` voordat Docker deze consumeert. Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`; plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` voert het geselecteerde plan uit. `node scripts/test-docker-all.mjs --plan-json` emit het door de scheduler beheerde CI-plan voor geselecteerde lanes, imagekinds, package-/live-imagebehoeften, statusscenario's en credentialcontroles zonder Docker te bouwen of te draaien. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` beheert processlots en staat standaard op 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` beheert de providergevoelige tailpool en staat standaard op 10. Zware lane-caps staan standaard op `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` en `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; providercaps staan standaard op één zware lane per provider via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` en `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Gebruik `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` of `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` voor grotere hosts. Als één lane de effectieve gewichts- of resourcecap op een host met lage paralleliteit overschrijdt, kan deze nog steeds vanuit een lege pool starten en alleen draaien totdat capaciteit wordt vrijgegeven. Lanestarts worden standaard met 2 seconden gespreid om create-storms in de lokale Docker-daemon te vermijden; overschrijf dit met `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. De runner voert standaard een Docker-preflight uit, ruimt verouderde OpenClaw E2E-containers op, emit elke 30 seconden actieve-lane-status, deelt provider-CLI-toolcaches tussen compatibele lanes, probeert tijdelijke live-providerfouten standaard één keer opnieuw (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) en slaat lanetimings op in `.artifacts/docker-tests/lane-timings.json` voor longest-first-volgorde bij latere runs. Gebruik `OPENCLAW_DOCKER_ALL_DRY_RUN=1` om het lanemanifest af te drukken zonder Docker te draaien, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` om statusuitvoer af te stemmen, of `OPENCLAW_DOCKER_ALL_TIMINGS=0` om timinghergebruik uit te schakelen. Gebruik `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` voor alleen deterministische/lokale lanes of `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` voor alleen live-providerlanes; package-aliassen zijn `pnpm test:docker:local:all` en `pnpm test:docker:live:all`. Live-only-modus voegt main- en tail-live-lanes samen in één longest-first-pool zodat providerbuckets Claude-, Codex- en Gemini-werk samen kunnen inpakken. De runner stopt met het schedulen van nieuwe gepoolde lanes na de eerste fout tenzij `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` is ingesteld, en elke lane heeft een fallback-time-out van 120 minuten die overschrijfbaar is met `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; geselecteerde live-/taillanes gebruiken strakkere caps per lane. CLI-backend-Docker-setupcommando's hebben hun eigen time-out via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (standaard 180). Per-lane logs, `summary.json`, `failures.json` en fasetimings worden geschreven onder `.artifacts/docker-tests/<run-id>/`; gebruik `pnpm test:docker:timings <summary.json>` om langzame lanes te inspecteren en `pnpm test:docker:rerun <run-id|summary.json|failures.json>` om goedkope getargete rerun-commando's af te drukken.
- `pnpm test:docker:browser-cdp-snapshot`: Bouwt een Chromium-backed source E2E-container, start raw CDP plus een geïsoleerde Gateway, draait `browser doctor --deep` en verifieert dat CDP-rolsnapshots link-URL's, cursor-gepromote clickables, iframe-refs en framemetadata bevatten.
- CLI-backend live-Docker-probes kunnen als gefocuste lanes worden gedraaid, bijvoorbeeld `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` of `pnpm test:docker:live-cli-backend:codex:mcp`. Claude en Gemini hebben overeenkomstige `:resume`- en `:mcp`-aliassen.
- `pnpm test:docker:openwebui`: Start gedockeriseerde OpenClaw + Open WebUI, meldt aan via Open WebUI, controleert `/api/models` en draait daarna een echte proxied chat via `/api/chat/completions`. Vereist een bruikbare live modelsleutel (bijvoorbeeld OpenAI in `~/.profile`), haalt een externe Open WebUI-image op en wordt niet verwacht CI-stabiel te zijn zoals de normale unit-/e2e-suites.
- `pnpm test:docker:mcp-channels`: Start een geseede Gateway-container en een tweede clientcontainer die `openclaw mcp serve` spawnt, en verifieert daarna gerouteerde gespreksontdekking, transcriptreads, bijlagemetadata, gedrag van live event queue, outbound send-routering en Claude-achtige kanaal- en permissienotificaties via de echte stdio-bridge. De Claude-notificatieassertie leest de raw stdio MCP-frames direct, zodat de smoke weerspiegelt wat de bridge daadwerkelijk emit.

## Lokale PR-gate

Voor lokale PR-land-/gatecontroles, voer uit:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Als `pnpm test` op een zwaar belaste host flaket, voer het dan een keer opnieuw uit voordat je het als een regressie behandelt, en isoleer daarna met `pnpm test <path/to/test>`. Gebruik voor hosts met beperkte geheugenruimte:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model-latentiebenchmark (lokale sleutels)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Gebruik:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Optionele env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Standaardprompt: “Antwoord met één woord: ok. Geen interpunctie of extra tekst.”

Laatste uitvoering (2025-12-31, 20 uitvoeringen):

- minimax-mediaan 1279 ms (min. 1114, max. 2431)
- opus-mediaan 2454 ms (min. 1224, max. 3170)

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

Uitvoer bevat `sampleCount`, gemiddelde, p50, p95, min/max, exit-code-/signaalverdeling en max RSS-samenvattingen voor elke opdracht. Optioneel schrijft `--cpu-prof-dir` / `--heap-prof-dir` V8-profielen per uitvoering, zodat timing en profielvastlegging dezelfde harness gebruiken.

Conventies voor opgeslagen uitvoer:

- `pnpm test:startup:bench:smoke` schrijft het gerichte smoke-artefact naar `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` schrijft het volledige suite-artefact naar `.artifacts/cli-startup-bench-all.json` met `runs=5` en `warmup=1`
- `pnpm test:startup:bench:update` vernieuwt de ingecheckte baselinefixture op `test/fixtures/cli-startup-bench.json` met `runs=5` en `warmup=1`

Ingecheckte fixture:

- `test/fixtures/cli-startup-bench.json`
- Vernieuw met `pnpm test:startup:bench:update`
- Vergelijk huidige resultaten met de fixture met `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker is optioneel; dit is alleen nodig voor gecontaineriseerde onboarding-smoketests.

Volledige cold-startflow in een schone Linux-container:

```bash
scripts/e2e/onboard-docker.sh
```

Dit script stuurt de interactieve wizard aan via een pseudo-tty, verifieert config-/workspace-/sessiebestanden, start daarna de Gateway en voert `openclaw health` uit.

## QR-importsmoke (Docker)

Zorgt ervoor dat de onderhouden QR-runtimehelper laadt onder de ondersteunde Docker Node-runtimes (standaard Node 24, compatibel met Node 22):

```bash
pnpm test:docker:qr
```

## Gerelateerd

- [Testen](/nl/help/testing)
- [Live testen](/nl/help/testing-live)
