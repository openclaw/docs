---
read_when:
    - Esecuzione o correzione dei test
summary: Come eseguire i test localmente (vitest) e quando usare le modalità force/coverage
title: Test
x-i18n:
    generated_at: "2026-05-01T08:33:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d50f77fdb8dcf7153c59d1bd9f3d61d745ba17ea846eb0610d0f064ad0d1761
    source_path: reference/test.md
    workflow: 16
---

- Kit completo per i test (suite, live, Docker): [Test](/it/help/testing)

- `pnpm test:force`: termina qualsiasi processo Gateway residuo che occupa la porta di controllo predefinita, poi esegue l'intera suite Vitest con una porta Gateway isolata, così i test del server non entrano in conflitto con un'istanza in esecuzione. Usalo quando un'esecuzione precedente del Gateway ha lasciato occupata la porta 18789.
- `pnpm test:coverage`: esegue la suite di unit test con copertura V8 (tramite `vitest.unit.config.ts`). Questo è un gate di copertura unit su file caricati, non una copertura all-file dell'intero repo. Le soglie sono 70% per righe/funzioni/istruzioni e 55% per i branch. Poiché `coverage.all` è false, il gate misura i file caricati dalla suite di copertura unit invece di trattare ogni file sorgente split-lane come non coperto.
- `pnpm test:coverage:changed`: esegue la copertura unit solo per i file modificati rispetto a `origin/main`.
- `pnpm test:changed`: esecuzione economica dei test modificati smart. Esegue target precisi da modifiche dirette ai test, file `*.test.ts` sibling, mapping espliciti dei sorgenti e grafo di import locale. Le modifiche broad/config/package vengono saltate a meno che non mappino a test precisi.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: esecuzione esplicita broad dei test modificati. Usala quando una modifica a test harness/config/package deve ripiegare sul comportamento più ampio di Vitest per i test modificati.
- `pnpm changed:lanes`: mostra le lane architetturali attivate dal diff rispetto a `origin/main`.
- `pnpm check:changed`: esegue lo smart changed check gate per il diff rispetto a `origin/main`. Esegue typecheck, lint e comandi di guardia per le lane architetturali interessate, ma non esegue test Vitest. Usa `pnpm test:changed` o `pnpm test <target>` esplicito come prova dei test.
- `pnpm test`: instrada target espliciti di file/directory attraverso lane Vitest con scope. Le esecuzioni senza target usano gruppi shard fissi e si espandono in configurazioni leaf per l'esecuzione parallela locale; il gruppo extension si espande sempre nelle configurazioni shard per-extension invece che in un unico enorme processo root-project.
- Le esecuzioni del wrapper dei test terminano con un breve riepilogo `[test] passed|failed|skipped ... in ...`. La riga di durata propria di Vitest resta il dettaglio per-shard.
- Stato di test OpenClaw condiviso: usa `src/test-utils/openclaw-test-state.ts` da Vitest quando un test necessita di `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture di configurazione, workspace, directory agente o store auth-profile isolati.
- Helper E2E di processo: usa `test/helpers/openclaw-test-instance.ts` quando un test E2E a livello di processo Vitest necessita di un Gateway in esecuzione, ambiente CLI, acquisizione log e cleanup in un unico posto.
- Helper E2E Docker/Bash: le lane che fanno source di `scripts/lib/docker-e2e-image.sh` possono passare `docker_e2e_test_state_shell_b64 <label> <scenario>` nel container e decodificarlo con `scripts/lib/openclaw-e2e-instance.sh`; gli script multi-home possono passare `docker_e2e_test_state_function_b64` e chiamare `openclaw_test_state_create <label> <scenario>` in ogni flusso. I chiamanti di livello più basso possono usare `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` per uno snippet shell in-container, oppure `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` per un file env host sourceable. Il `--` prima di `create` impedisce ai runtime Node più recenti di trattare `--env-file` come flag Node. Le lane Docker/Bash che avviano un Gateway possono fare source di `scripts/lib/openclaw-e2e-instance.sh` dentro il container per risoluzione dell'entrypoint, avvio mock di OpenAI, avvio del Gateway in foreground/background, probe di readiness, export dello stato env, dump dei log e cleanup dei processi.
- Le esecuzioni shard complete, extension e include-pattern aggiornano i dati di timing locali in `.artifacts/vitest-shard-timings.json`; le successive esecuzioni whole-config usano quei timing per bilanciare shard lenti e veloci. Gli shard CI include-pattern aggiungono il nome dello shard alla chiave di timing, mantenendo visibili i timing degli shard filtrati senza sostituire i dati di timing whole-config. Imposta `OPENCLAW_TEST_PROJECTS_TIMINGS=0` per ignorare l'artefatto di timing locale.
- File di test selezionati di `plugin-sdk` e `commands` ora passano attraverso lane leggere dedicate che mantengono solo `test/setup.ts`, lasciando i casi runtime-heavy nelle loro lane esistenti.
- I file sorgente con test sibling mappano a quel sibling prima di ripiegare su glob di directory più ampi. Le modifiche agli helper sotto `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` e `src/plugins/contracts` usano un grafo di import locale per eseguire i test che importano invece di eseguire broad ogni shard quando il percorso di dipendenza è preciso.
- `auto-reply` ora si divide anche in tre configurazioni dedicate (`core`, `top-level`, `reply`) così l'harness reply non domina i test più leggeri di stato/token/helper top-level.
- La configurazione Vitest di base ora usa per impostazione predefinita `pool: "threads"` e `isolate: false`, con il runner non isolato condiviso abilitato nelle configurazioni del repo.
- `pnpm test:channels` esegue `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` eseguono tutti gli shard extension/Plugin. I Plugin canale pesanti, il Plugin browser e OpenAI vengono eseguiti come shard dedicati; gli altri gruppi Plugin restano batch. Usa `pnpm test extensions/<id>` per una lane di un singolo Plugin bundled.
- `pnpm test:perf:imports`: abilita il reporting di durata import + breakdown import di Vitest, continuando a usare il routing lane con scope per target espliciti di file/directory.
- `pnpm test:perf:imports:changed`: stesso profiling degli import, ma solo per file modificati rispetto a `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` esegue benchmark del percorso routed changed-mode rispetto all'esecuzione root-project nativa per lo stesso diff git già committato.
- `pnpm test:perf:changed:bench -- --worktree` esegue benchmark dell'insieme di modifiche del worktree corrente senza prima committare.
- `pnpm test:perf:profile:main`: scrive un profilo CPU per il thread principale Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: scrive profili CPU + heap per il runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: esegue serialmente ogni configurazione leaf Vitest full-suite e scrive dati di durata raggruppati più artefatti JSON/log per-config. Il Test Performance Agent lo usa come baseline prima di tentare fix dei test lenti.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: confronta report raggruppati dopo una modifica focalizzata sulle prestazioni.
- Integrazione Gateway: opt-in tramite `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: esegue smoke test end-to-end del Gateway (pairing multi-instance WS/HTTP/node). Per impostazione predefinita usa `threads` + `isolate: false` con worker adattivi in `vitest.e2e.config.ts`; regola con `OPENCLAW_E2E_WORKERS=<n>` e imposta `OPENCLAW_E2E_VERBOSE=1` per log verbosi.
- `pnpm test:live`: esegue test live dei provider (minimax/zai). Richiede chiavi API e `LIVE=1` (o `*_LIVE_TEST=1` specifico del provider) per non essere saltato.
- `pnpm test:docker:all`: compila l'immagine live-test condivisa, pacchettizza OpenClaw una volta come tarball npm, compila/riusa un'immagine runner Node/Git bare più un'immagine funzionale che installa quel tarball in `/app`, quindi esegue lane smoke Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` tramite uno scheduler pesato. L'immagine bare (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) viene usata per le lane installer/update/plugin-dependency; quelle lane montano il tarball precompilato invece di usare sorgenti copiati dal repo. L'immagine funzionale (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) viene usata per le normali lane di funzionalità dell'app compilata. `scripts/package-openclaw-for-docker.mjs` è l'unico packer package locale/CI e valida il tarball più `dist/postinstall-inventory.json` prima che Docker lo consumi. Le definizioni delle lane Docker vivono in `scripts/lib/docker-e2e-scenarios.mjs`; la logica del planner vive in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` esegue il piano selezionato. `node scripts/test-docker-all.mjs --plan-json` emette il piano CI di proprietà dello scheduler per lane selezionate, tipi di immagine, esigenze package/live-image, scenari di stato e controlli credenziali senza compilare o eseguire Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controlla gli slot di processo e usa 10 come valore predefinito; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controlla il pool tail sensibile ai provider e usa 10 come valore predefinito. I cap delle lane pesanti sono per impostazione predefinita `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; i cap dei provider sono per impostazione predefinita una lane pesante per provider tramite `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` e `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Usa `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` per host più grandi. Se una lane supera il peso effettivo o il cap di risorsa su un host a basso parallelismo, può comunque partire da un pool vuoto e verrà eseguita da sola finché non rilascia capacità. Gli avvii delle lane sono sfalsati di 2 secondi per impostazione predefinita per evitare tempeste di create sul daemon Docker locale; sovrascrivi con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Il runner esegue preflight di Docker per impostazione predefinita, pulisce container E2E OpenClaw obsoleti, emette lo stato delle lane attive ogni 30 secondi, condivide cache degli strumenti CLI provider tra lane compatibili, ritenta una volta per impostazione predefinita i fallimenti transienti dei live-provider (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) e archivia i timing delle lane in `.artifacts/docker-tests/lane-timings.json` per ordinamento longest-first nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifest delle lane senza eseguire Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` per regolare l'output di stato, oppure `OPENCLAW_DOCKER_ALL_TIMINGS=0` per disabilitare il riuso dei timing. Usa `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` solo per lane deterministiche/locali oppure `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` solo per lane live-provider; gli alias package sono `pnpm test:docker:local:all` e `pnpm test:docker:live:all`. La modalità live-only unisce le lane live main e tail in un unico pool longest-first, così i bucket provider possono impacchettare insieme lavoro Claude, Codex e Gemini. Il runner smette di pianificare nuove lane pooled dopo il primo fallimento a meno che `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` sia impostato, e ogni lane ha un timeout fallback di 120 minuti sovrascrivibile con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; lane live/tail selezionate usano cap per-lane più stretti. I comandi di setup Docker del backend CLI hanno il proprio timeout tramite `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (predefinito 180). Log per-lane, `summary.json`, `failures.json` e timing delle fasi vengono scritti sotto `.artifacts/docker-tests/<run-id>/`; usa `pnpm test:docker:timings <summary.json>` per ispezionare le lane lente e `pnpm test:docker:rerun <run-id|summary.json|failures.json>` per stampare comandi di riesecuzione mirati economici.
- `pnpm test:docker:browser-cdp-snapshot`: compila un container E2E sorgente basato su Chromium, avvia CDP raw più un Gateway isolato, esegue `browser doctor --deep` e verifica che gli snapshot dei ruoli CDP includano URL dei link, elementi cliccabili promossi dal cursore, riferimenti iframe e metadati dei frame.
- Le probe Docker live del backend CLI possono essere eseguite come lane focalizzate, per esempio `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` o `pnpm test:docker:live-cli-backend:codex:mcp`. Claude e Gemini hanno alias `:resume` e `:mcp` corrispondenti.
- `pnpm test:docker:openwebui`: avvia OpenClaw + Open WebUI dockerizzati, esegue l'accesso tramite Open WebUI, controlla `/api/models`, poi esegue una chat reale proxied tramite `/api/chat/completions`. Richiede una chiave modello live utilizzabile (per esempio OpenAI in `~/.profile`), scarica un'immagine esterna Open WebUI e non ci si aspetta che sia stabile in CI come le normali suite unit/e2e.
- `pnpm test:docker:mcp-channels`: avvia un container Gateway seeded e un secondo container client che esegue `openclaw mcp serve`, quindi verifica discovery delle conversazioni instradate, letture dei transcript, metadati degli allegati, comportamento della coda eventi live, routing dell'invio in uscita e notifiche channel + permessi stile Claude sul bridge stdio reale. L'asserzione di notifica Claude legge direttamente i frame MCP stdio raw, così lo smoke riflette ciò che il bridge emette effettivamente.
- `pnpm test:docker:upgrade-survivor`: installa il tarball OpenClaw impacchettato sopra una fixture sporca di un vecchio utente, esegue l'aggiornamento del pacchetto più `doctor` non interattivo senza chiavi live di provider o di canale, quindi avvia un Gateway su loopback e verifica che agenti, configurazione dei canali, allowlist dei Plugin, file di workspace/sessione, stato obsoleto delle dipendenze di runtime dei Plugin, avvio e stato RPC sopravvivano.
- `pnpm test:docker:published-upgrade-survivor`: installa `openclaw@latest` per impostazione predefinita, inizializza file realistici di un utente esistente senza chiavi live di provider o di canale, configura quella baseline con una ricetta predefinita del comando `openclaw config set`, aggiorna quell'installazione pubblicata al tarball OpenClaw impacchettato, esegue `doctor` non interattivo, scrive `.artifacts/upgrade-survivor/summary.json`, quindi avvia un Gateway su loopback e verifica che intent configurati, file di workspace/sessione, stato obsoleto di configurazione/dipendenze di runtime dei Plugin, avvio e stato RPC sopravvivano o vengano riparati in modo pulito. Sovrascrivi la baseline con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`; Package Acceptance espone lo stesso valore come `published_upgrade_survivor_baseline`.

## Gate PR locale

Per i controlli locali di integrazione/gate delle PR, esegui:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` fallisce in modo intermittente su un host carico, rieseguilo una volta prima di trattarlo come una regressione, quindi isola con `pnpm test <path/to/test>`. Per host con memoria limitata, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark latenza modello (chiavi locali)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Ambiente opzionale: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predefinito: “Rispondi con una sola parola: ok. Nessuna punteggiatura o testo aggiuntivo.”

Ultima esecuzione (2025-12-31, 20 esecuzioni):

- minimax mediana 1279 ms (min 1114, max 2431)
- opus mediana 2454 ms (min 1224, max 3170)

## Benchmark avvio CLI

Script: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Uso:

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

Preimpostazioni:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: entrambe le preimpostazioni

L'output include `sampleCount`, media, p50, p95, min/max, distribuzione di codici di uscita/segnali e riepiloghi RSS massimo per ogni comando. Gli opzionali `--cpu-prof-dir` / `--heap-prof-dir` scrivono profili V8 per ogni esecuzione, così misurazione dei tempi e acquisizione dei profili usano lo stesso harness.

Convenzioni per l'output salvato:

- `pnpm test:startup:bench:smoke` scrive l'artefatto di verifica rapida mirato in `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` scrive l'artefatto della suite completa in `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` aggiorna il file di riferimento di base versionato in `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

File di riferimento versionato:

- `test/fixtures/cli-startup-bench.json`
- Aggiorna con `pnpm test:startup:bench:update`
- Confronta i risultati correnti con il file di riferimento usando `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker è opzionale; è necessario solo per test di base dell'onboarding containerizzati.

Flusso completo di avvio a freddo in un container Linux pulito:

```bash
scripts/e2e/onboard-docker.sh
```

Questo script pilota la procedura guidata interattiva tramite una pseudo-tty, verifica i file di configurazione/workspace/sessione, quindi avvia il Gateway ed esegue `openclaw health`.

## Verifica rapida importazione QR (Docker)

Assicura che l'helper di runtime QR mantenuto venga caricato nei runtime Docker Node supportati (Node 24 predefinito, Node 22 compatibile):

```bash
pnpm test:docker:qr
```

## Correlati

- [Test](/it/help/testing)
- [Test live](/it/help/testing-live)
