---
read_when:
    - Tests uitvoeren of herstellen
summary: Hoe u tests lokaal uitvoert (vitest) en wanneer u force-/coverage-modi gebruikt
title: Tests
x-i18n:
    generated_at: "2026-05-01T11:22:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07ca45e6c21016ad403ea010bd2e5460acc059c004138e04a714a3506f0e5cda
    source_path: reference/test.md
    workflow: 16
---

- Volledige testkit (suites, live, Docker): [Testen](/nl/help/testing)

- `pnpm test:force`: Beëindigt elk achtergebleven gatewayproces dat de standaard controlepoort bezet houdt, en voert daarna de volledige Vitest-suite uit met een geïsoleerde gatewaypoort zodat servertests niet botsen met een actieve instantie. Gebruik dit wanneer een eerdere gatewayrun poort 18789 bezet heeft achtergelaten.
- `pnpm test:coverage`: Voert de unitsuite uit met V8-coverage (via `vitest.unit.config.ts`). Dit is een coverage-gate voor geladen unitbestanden, geen coverage voor alle bestanden in de hele repo. Drempels zijn 70% regels/functies/statements en 55% branches. Omdat `coverage.all` false is, meet de gate bestanden die door de unit-coveragesuite zijn geladen in plaats van elk bronbestand uit een gesplitste lane als ongedekt te behandelen.
- `pnpm test:coverage:changed`: Voert unitcoverage alleen uit voor bestanden die sinds `origin/main` zijn gewijzigd.
- `pnpm test:changed`: goedkope slimme gewijzigde-testrun. Deze voert precieze doelen uit op basis van directe testbewerkingen, naastgelegen `*.test.ts`-bestanden, expliciete bronmappings en de lokale importgrafiek. Brede/configuratie-/pakketwijzigingen worden overgeslagen tenzij ze naar precieze tests verwijzen.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: expliciete brede gewijzigde-testrun. Gebruik dit wanneer een wijziging in een testharnas/configuratie/pakket moet terugvallen op het bredere gewijzigde-testgedrag van Vitest.
- `pnpm changed:lanes`: toont de architecturale lanes die worden geactiveerd door de diff tegenover `origin/main`.
- `pnpm check:changed`: voert de slimme gewijzigde-check-gate uit voor de diff tegenover `origin/main`. Deze voert typecheck-, lint- en guard-commando's uit voor de getroffen architecturale lanes, maar voert geen Vitest-tests uit. Gebruik `pnpm test:changed` of expliciet `pnpm test <target>` voor testbewijs.
- `pnpm test`: routeert expliciete bestands-/directorydoelen via gescopete Vitest-lanes. Ongerichte runs gebruiken vaste shardgroepen en breiden uit naar leaf-configs voor lokale parallelle uitvoering; de extensiegroep breidt altijd uit naar de per-extensie-shardconfigs in plaats van één enorm root-projectproces.
- Testwrapperruns eindigen met een korte samenvatting `[test] passed|failed|skipped ... in ...`. Vitests eigen duurregel blijft het detail per shard.
- Gedeelde OpenClaw-teststatus: gebruik `src/test-utils/openclaw-test-state.ts` vanuit Vitest wanneer een test een geïsoleerde `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, configuratiefixture, workspace, agentdirectory of auth-profile-store nodig heeft.
- Proces-E2E-helpers: gebruik `test/helpers/openclaw-test-instance.ts` wanneer een Vitest-E2E-test op procesniveau een draaiende Gateway, CLI-env, logvastlegging en opschoning op één plek nodig heeft.
- Docker/Bash-E2E-helpers: lanes die `scripts/lib/docker-e2e-image.sh` sourcen kunnen `docker_e2e_test_state_shell_b64 <label> <scenario>` doorgeven aan de container en dit decoderen met `scripts/lib/openclaw-e2e-instance.sh`; scripts met meerdere homes kunnen `docker_e2e_test_state_function_b64` doorgeven en `openclaw_test_state_create <label> <scenario>` in elke flow aanroepen. Callers op lager niveau kunnen `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` gebruiken voor een shellsnippet in de container, of `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` voor een sourcebaar host-env-bestand. De `--` vóór `create` voorkomt dat nieuwere Node-runtimes `--env-file` als Node-flag behandelen. Docker/Bash-lanes die een Gateway starten kunnen `scripts/lib/openclaw-e2e-instance.sh` binnen de container sourcen voor entrypoint-resolutie, mock-OpenAI-opstart, Gateway-start op de voorgrond/achtergrond, readiness-probes, export van status-env, logdumps en procesopschoning.
- Volledige, extensie- en include-pattern-shardruns werken lokale timinggegevens bij in `.artifacts/vitest-shard-timings.json`; latere volledige-configruns gebruiken die timings om langzame en snelle shards te balanceren. Include-pattern-CI-shards voegen de shardnaam toe aan de timingsleutel, waardoor gefilterde shardtimings zichtbaar blijven zonder timinggegevens voor de volledige config te vervangen. Stel `OPENCLAW_TEST_PROJECTS_TIMINGS=0` in om het lokale timingartefact te negeren.
- Geselecteerde testbestanden voor `plugin-sdk` en `commands` worden nu gerouteerd via speciale lichte lanes die alleen `test/setup.ts` behouden, terwijl runtime-zware gevallen op hun bestaande lanes blijven.
- Bronbestanden met naastgelegen tests worden eerst naar die naastgelegen test gemapt voordat wordt teruggevallen op bredere directoryglobs. Helperbewerkingen onder `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` en `src/plugins/contracts` gebruiken een lokale importgrafiek om importerende tests uit te voeren in plaats van elke shard breed te runnen wanneer het afhankelijkheidspad precies is.
- `auto-reply` wordt nu ook gesplitst in drie speciale configs (`core`, `top-level`, `reply`) zodat het reply-harnas de lichtere top-level status-/token-/helpertests niet domineert.
- De basis-Vitest-config gebruikt nu standaard `pool: "threads"` en `isolate: false`, met de gedeelde niet-geïsoleerde runner ingeschakeld in de repo-configs.
- `pnpm test:channels` voert `vitest.channels.config.ts` uit.
- `pnpm test:extensions` en `pnpm test extensions` voeren alle extensie-/plugin-shards uit. Zware kanaalplugins, de browserplugin en OpenAI draaien als speciale shards; andere plugingroepen blijven gebatcht. Gebruik `pnpm test extensions/<id>` voor één gebundelde plugin-lane.
- `pnpm test:perf:imports`: schakelt Vitest-rapportage voor importduur + importuitsplitsing in, terwijl nog steeds gescopete lane-routering wordt gebruikt voor expliciete bestands-/directorydoelen.
- `pnpm test:perf:imports:changed`: dezelfde importprofilering, maar alleen voor bestanden die sinds `origin/main` zijn gewijzigd.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkt het gerouteerde gewijzigde-moduspad tegenover de native root-projectrun voor dezelfde gecommitte git-diff.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkt de huidige worktree-wijzigingsset zonder eerst te committen.
- `pnpm test:perf:profile:main`: schrijft een CPU-profiel voor de hoofdthread van Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: schrijft CPU- en heap-profielen voor de unitrunner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: voert elke full-suite Vitest-leafconfig serieel uit en schrijft gegroepeerde duurgegevens plus JSON-/logartefacten per config. De Test Performance Agent gebruikt dit als baseline voordat hij oplossingen voor trage tests probeert.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: vergelijkt gegroepeerde rapporten na een prestatiegerichte wijziging.
- Gateway-integratie: opt-in via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` of `pnpm test:gateway`.
- `pnpm test:e2e`: Voert Gateway-end-to-end-smoketests uit (multi-instance WS/HTTP/node-koppeling). Gebruikt standaard `threads` + `isolate: false` met adaptieve workers in `vitest.e2e.config.ts`; stem af met `OPENCLAW_E2E_WORKERS=<n>` en stel `OPENCLAW_E2E_VERBOSE=1` in voor uitgebreide logs.
- `pnpm test:live`: Voert live providertests uit (minimax/zai). Vereist API-sleutels en `LIVE=1` (of provider-specifiek `*_LIVE_TEST=1`) om overslaan uit te schakelen.
- `pnpm test:docker:all`: Bouwt de gedeelde live-testimage, verpakt OpenClaw één keer als npm-tarball, bouwt/hergebruikt een kale Node/Git-runnerimage plus een functionele image die die tarball in `/app` installeert, en voert daarna Docker-smoke-lanes uit met `OPENCLAW_SKIP_DOCKER_BUILD=1` via een gewogen scheduler. De kale image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) wordt gebruikt voor installer-/update-/plugin-afhankelijkheidslanes; die lanes mounten de vooraf gebouwde tarball in plaats van gekopieerde repo-bronnen te gebruiken. De functionele image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) wordt gebruikt voor normale functionaliteitslanes van de gebouwde app. `scripts/package-openclaw-for-docker.mjs` is de enige lokale/CI-package-packer en valideert de tarball plus `dist/postinstall-inventory.json` voordat Docker deze gebruikt. Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`; plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` voert het geselecteerde plan uit. `node scripts/test-docker-all.mjs --plan-json` geeft het door de scheduler beheerde CI-plan uit voor geselecteerde lanes, imagetypen, pakket-/live-imagebehoeften, statusscenario's en credentialchecks zonder Docker te bouwen of uit te voeren. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` bepaalt processlots en is standaard 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` bepaalt de providergevoelige tail-pool en is standaard 10. Zware-lane-limieten zijn standaard `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` en `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; providerlimieten zijn standaard één zware lane per provider via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` en `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Gebruik `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` of `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` voor grotere hosts. Als één lane de effectieve gewichts- of resourcelimiet op een host met lage paralleliteit overschrijdt, kan deze nog steeds vanuit een lege pool starten en alleen draaien totdat capaciteit wordt vrijgegeven. Lanestarts worden standaard met 2 seconden gespreid om create-stormen van de lokale Docker-daemon te voorkomen; overschrijf dit met `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. De runner voert standaard een Docker-preflight uit, ruimt verouderde OpenClaw-E2E-containers op, geeft elke 30 seconden actieve-lanestatus uit, deelt provider-CLI-toolcaches tussen compatibele lanes, probeert voorbijgaande live-providerfouten standaard één keer opnieuw (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) en slaat lanetimings op in `.artifacts/docker-tests/lane-timings.json` voor longest-first-volgorde bij latere runs. Gebruik `OPENCLAW_DOCKER_ALL_DRY_RUN=1` om het lanemanifest af te drukken zonder Docker uit te voeren, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` om statusuitvoer af te stemmen, of `OPENCLAW_DOCKER_ALL_TIMINGS=0` om timinghergebruik uit te schakelen. Gebruik `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` alleen voor deterministische/lokale lanes of `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` alleen voor live-provider-lanes; pakketaliassen zijn `pnpm test:docker:local:all` en `pnpm test:docker:live:all`. Live-only-modus voegt hoofd- en tail-live-lanes samen in één longest-first-pool zodat providerbuckets Claude-, Codex- en Gemini-werk samen kunnen inpakken. De runner stopt met het plannen van nieuwe gepoolde lanes na de eerste fout, tenzij `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` is ingesteld, en elke lane heeft een fallback-time-out van 120 minuten die kan worden overschreven met `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; geselecteerde live-/tail-lanes gebruiken strakkere limieten per lane. CLI-backend-Docker-installatiecommando's hebben hun eigen time-out via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (standaard 180). Logs per lane, `summary.json`, `failures.json` en fasetimings worden weggeschreven onder `.artifacts/docker-tests/<run-id>/`; gebruik `pnpm test:docker:timings <summary.json>` om trage lanes te inspecteren en `pnpm test:docker:rerun <run-id|summary.json|failures.json>` om goedkope gerichte herhaalcommando's af te drukken.
- `pnpm test:docker:browser-cdp-snapshot`: Bouwt een Chromium-ondersteunde bron-E2E-container, start raw CDP plus een geïsoleerde Gateway, voert `browser doctor --deep` uit en verifieert dat CDP-rolsnapshots link-URL's, naar cursor gepromoveerde klikbare elementen, iframe-refs en framemetadata bevatten.
- Live Docker-probes voor CLI-backends kunnen als gerichte lanes worden uitgevoerd, bijvoorbeeld `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` of `pnpm test:docker:live-cli-backend:codex:mcp`. Claude en Gemini hebben overeenkomende aliassen voor `:resume` en `:mcp`.
- `pnpm test:docker:openwebui`: Start gedockeriseerde OpenClaw + Open WebUI, meldt zich aan via Open WebUI, controleert `/api/models` en voert daarna een echte geproxyde chat uit via `/api/chat/completions`. Vereist een bruikbare live modelsleutel (bijvoorbeeld OpenAI in `~/.profile`), haalt een externe Open WebUI-image op en wordt niet verwacht CI-stabiel te zijn zoals de normale unit-/e2e-suites.
- `pnpm test:docker:mcp-channels`: Start een seeded Gateway-container en een tweede clientcontainer die `openclaw mcp serve` spawnt, en verifieert daarna gerouteerde gespreksontdekking, transcriptlezingen, attachmentmetadata, gedrag van live event queues, routering van uitgaand verzenden en Claude-achtige kanaal- en permissiemeldingen over de echte stdio-bridge. De Claude-meldingsassertie leest de raw stdio-MCP-frames rechtstreeks zodat de smoke weergeeft wat de bridge daadwerkelijk emitteert.
- `pnpm test:docker:upgrade-survivor`: Installeert de verpakte OpenClaw-tarball over een vervuilde fixture van een oude gebruiker, voert een package-update plus niet-interactieve doctor uit zonder live provider- of kanaalsleutels, start daarna een loopback-Gateway en controleert of agents, kanaalconfiguratie, Plugin-allowlists, workspace-/sessiebestanden, verouderde Plugin-runtime-deps-status, opstarten en RPC-status behouden blijven.
- `pnpm test:docker:published-upgrade-survivor`: Installeert standaard `openclaw@latest`, seedt realistische bestaande-gebruikersbestanden zonder live provider- of kanaalsleutels, configureert die baseline met een ingebakken opdrachtrecept voor `openclaw config set`, werkt die gepubliceerde installatie bij naar de verpakte OpenClaw-tarball, voert niet-interactieve doctor uit, schrijft `.artifacts/upgrade-survivor/summary.json`, start daarna een loopback-Gateway en controleert of geconfigureerde intents, workspace-/sessiebestanden, verouderde Plugin-config-/runtime-deps-status, opstarten, `/healthz`, `/readyz` en RPC-status behouden blijven of schoon worden gerepareerd. Overschrijf een baseline met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, breid een exacte matrix uit met `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, of voeg scenario-fixtures toe met `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; Package Acceptance exposeert deze als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` en `published_upgrade_survivor_scenarios`.

## Lokale PR-gate

Voer voor lokale PR-land-/gate-controles uit:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Als `pnpm test` flaket op een zwaar belaste host, voer het dan één keer opnieuw uit voordat je het als een regressie behandelt, en isoleer daarna met `pnpm test <path/to/test>`. Gebruik voor hosts met beperkte geheugenruimte:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model-latentiebenchmark (lokale sleutels)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Gebruik:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Optionele env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Standaardprompt: “Antwoord met één woord: ok. Geen leestekens of extra tekst.”

Laatste uitvoering (2025-12-31, 20 runs):

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

Uitvoer bevat `sampleCount`, avg, p50, p95, min/max, exitcode-/signaalverdeling en samenvattingen van maximale RSS voor elke opdracht. Optioneel schrijft `--cpu-prof-dir` / `--heap-prof-dir` V8-profielen per run, zodat timing en profielvastlegging dezelfde harness gebruiken.

Conventies voor opgeslagen uitvoer:

- `pnpm test:startup:bench:smoke` schrijft het gerichte smoke-artefact naar `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` schrijft het volledige-suite-artefact naar `.artifacts/cli-startup-bench-all.json` met `runs=5` en `warmup=1`
- `pnpm test:startup:bench:update` ververst de ingecheckte baselinefixture op `test/fixtures/cli-startup-bench.json` met `runs=5` en `warmup=1`

Ingecheckte fixture:

- `test/fixtures/cli-startup-bench.json`
- Ververs met `pnpm test:startup:bench:update`
- Vergelijk huidige resultaten met de fixture via `pnpm test:startup:bench:check`

## Onboarding-E2E (Docker)

Docker is optioneel; dit is alleen nodig voor gecontaineriseerde onboarding-smoke-tests.

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
