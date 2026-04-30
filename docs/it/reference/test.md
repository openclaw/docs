---
read_when:
    - Esecuzione o correzione dei test
summary: Come eseguire i test localmente (vitest) e quando usare le modalità force/coverage
title: Test
x-i18n:
    generated_at: "2026-04-30T09:12:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9328d6f0383b5067fa8bb5d0f1bf22a3b9048a267908bf85167842ddc3d12e42
    source_path: reference/test.md
    workflow: 16
---

- Kit completo per i test (suite, live, Docker): [Test](/it/help/testing)

- `pnpm test:force`: termina qualsiasi processo Gateway residuo che occupa la porta di controllo predefinita, poi esegue l'intera suite Vitest con una porta Gateway isolata, così i test del server non entrano in conflitto con un'istanza in esecuzione. Usalo quando una precedente esecuzione del Gateway ha lasciato occupata la porta 18789.
- `pnpm test:coverage`: esegue la suite di unit test con copertura V8 (tramite `vitest.unit.config.ts`). Questo è un gate di copertura unit caricato sui file caricati, non una copertura di tutti i file dell'intero repository. Le soglie sono 70% per righe/funzioni/istruzioni e 55% per i branch. Poiché `coverage.all` è false, il gate misura i file caricati dalla suite di copertura unit invece di trattare ogni file sorgente a lane suddivisa come non coperto.
- `pnpm test:coverage:changed`: esegue la copertura unit solo per i file modificati da `origin/main`.
- `pnpm test:changed`: esecuzione economica dei test modificati intelligenti. Esegue target precisi da modifiche dirette ai test, file `*.test.ts` sibling, mapping espliciti dei sorgenti e il grafo di import locale. Le modifiche ampie a configurazione/pacchetti vengono saltate a meno che non mappino a test precisi.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: esecuzione esplicita ampia dei test modificati. Usala quando una modifica a harness/configurazione/pacchetto dei test dovrebbe ricadere sul comportamento più ampio di Vitest per i test modificati.
- `pnpm changed:lanes`: mostra le lane architetturali attivate dal diff rispetto a `origin/main`.
- `pnpm check:changed`: esegue il gate intelligente di controllo delle modifiche per il diff rispetto a `origin/main`. Esegue typecheck, lint e comandi di guardia per le lane architetturali interessate, ma non esegue i test Vitest. Usa `pnpm test:changed` o `pnpm test <target>` esplicito per la prova dei test.
- `pnpm test`: instrada i target espliciti di file/directory attraverso lane Vitest con ambito. Le esecuzioni senza target usano gruppi di shard fissi e si espandono in configurazioni foglia per l'esecuzione parallela locale; il gruppo extension si espande sempre nelle configurazioni shard per extension invece di un unico enorme processo di progetto root.
- Le esecuzioni del wrapper di test terminano con un breve riepilogo `[test] passed|failed|skipped ... in ...`. La riga di durata propria di Vitest rimane il dettaglio per shard.
- Stato di test OpenClaw condiviso: usa `src/test-utils/openclaw-test-state.ts` da Vitest quando un test richiede `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture di configurazione, workspace, directory agente o archivio auth-profile isolati.
- Helper E2E di processo: usa `test/helpers/openclaw-test-instance.ts` quando un test E2E a livello di processo Vitest richiede un Gateway in esecuzione, env CLI, cattura dei log e pulizia in un unico punto.
- Helper E2E Docker/Bash: le lane che fanno source di `scripts/lib/docker-e2e-image.sh` possono passare `docker_e2e_test_state_shell_b64 <label> <scenario>` nel container e decodificarlo con `scripts/lib/openclaw-e2e-instance.sh`; gli script multi-home possono passare `docker_e2e_test_state_function_b64` e chiamare `openclaw_test_state_create <label> <scenario>` in ogni flusso. I chiamanti di livello inferiore possono usare `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` per uno snippet shell nel container, oppure `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` per un file env host utilizzabile con source. Il `--` prima di `create` impedisce ai runtime Node più recenti di trattare `--env-file` come flag Node. Le lane Docker/Bash che avviano un Gateway possono fare source di `scripts/lib/openclaw-e2e-instance.sh` dentro il container per risoluzione dell'entrypoint, avvio OpenAI mock, lancio del Gateway in foreground/background, probe di prontezza, esportazione dell'env di stato, dump dei log e pulizia dei processi.
- Le esecuzioni shard complete, extension e include-pattern aggiornano i dati di timing locali in `.artifacts/vitest-shard-timings.json`; le esecuzioni successive dell'intera configurazione usano quei timing per bilanciare shard lenti e veloci. Gli shard CI include-pattern aggiungono il nome dello shard alla chiave di timing, mantenendo visibili i timing degli shard filtrati senza sostituire i dati di timing dell'intera configurazione. Imposta `OPENCLAW_TEST_PROJECTS_TIMINGS=0` per ignorare l'artefatto di timing locale.
- File di test `plugin-sdk` e `commands` selezionati ora vengono instradati attraverso lane leggere dedicate che mantengono solo `test/setup.ts`, lasciando i casi runtime-heavy sulle loro lane esistenti.
- I file sorgente con test sibling mappano prima a quel sibling prima di ricadere su glob di directory più ampi. Le modifiche agli helper sotto `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` e `src/plugins/contracts` usano un grafo di import locale per eseguire i test importatori invece di eseguire ampiamente ogni shard quando il percorso della dipendenza è preciso.
- `auto-reply` ora si divide anche in tre configurazioni dedicate (`core`, `top-level`, `reply`) così l'harness di risposta non domina i test più leggeri di stato/token/helper top-level.
- La configurazione Vitest di base ora usa per impostazione predefinita `pool: "threads"` e `isolate: false`, con il runner condiviso non isolato abilitato in tutte le configurazioni del repository.
- `pnpm test:channels` esegue `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` eseguono tutti gli shard extension/Plugin. I Plugin di canale pesanti, il Plugin browser e OpenAI vengono eseguiti come shard dedicati; gli altri gruppi di Plugin restano in batch. Usa `pnpm test extensions/<id>` per una lane di un Plugin bundled.
- `pnpm test:perf:imports`: abilita il reporting di durata import + breakdown import di Vitest, continuando a usare il routing per lane con ambito per target espliciti di file/directory.
- `pnpm test:perf:imports:changed`: stesso profiling degli import, ma solo per i file modificati da `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` esegue benchmark del percorso routed in modalità changed rispetto all'esecuzione nativa del progetto root per lo stesso diff git già committato.
- `pnpm test:perf:changed:bench -- --worktree` esegue benchmark dell'insieme di modifiche del worktree corrente senza effettuare prima un commit.
- `pnpm test:perf:profile:main`: scrive un profilo CPU per il thread principale di Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: scrive profili CPU + heap per il runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: esegue serialmente ogni configurazione foglia Vitest della suite completa e scrive dati di durata raggruppati più artefatti JSON/log per configurazione. Il Test Performance Agent lo usa come baseline prima di tentare correzioni dei test lenti.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: confronta report raggruppati dopo una modifica focalizzata sulle prestazioni.
- Integrazione Gateway: opt-in tramite `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: esegue smoke test end-to-end del Gateway (pairing multi-istanza WS/HTTP/node). Usa per impostazione predefinita `threads` + `isolate: false` con worker adattivi in `vitest.e2e.config.ts`; regola con `OPENCLAW_E2E_WORKERS=<n>` e imposta `OPENCLAW_E2E_VERBOSE=1` per log dettagliati.
- `pnpm test:live`: esegue test live dei provider (minimax/zai). Richiede chiavi API e `LIVE=1` (o `*_LIVE_TEST=1` specifico del provider) per rimuovere lo skip.
- `pnpm test:docker:all`: costruisce l'immagine condivisa live-test, impacchetta OpenClaw una volta come tarball npm, costruisce/riusa un'immagine runner Node/Git minimale più un'immagine funzionale che installa quel tarball in `/app`, poi esegue lane smoke Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` attraverso uno scheduler pesato. L'immagine minimale (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) viene usata per lane installer/update/plugin-dependency; quelle lane montano il tarball precompilato invece di usare sorgenti copiati dal repository. L'immagine funzionale (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) viene usata per lane normali di funzionalità dell'app compilata. `scripts/package-openclaw-for-docker.mjs` è l'unico packer di pacchetto locale/CI e valida il tarball più `dist/postinstall-inventory.json` prima che Docker lo consumi. Le definizioni delle lane Docker vivono in `scripts/lib/docker-e2e-scenarios.mjs`; la logica del planner vive in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` esegue il piano selezionato. `node scripts/test-docker-all.mjs --plan-json` emette il piano CI di proprietà dello scheduler per lane selezionate, tipi di immagine, necessità di pacchetto/immagine live, scenari di stato e controlli credenziali senza costruire o eseguire Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controlla gli slot di processo e il valore predefinito è 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controlla il pool tail sensibile ai provider e il valore predefinito è 10. I cap delle lane pesanti predefiniti sono `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; i cap provider predefiniti sono una lane pesante per provider tramite `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` e `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Usa `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` per host più grandi. Se una lane supera il peso effettivo o il cap di risorse su un host a basso parallelismo, può comunque partire da un pool vuoto ed eseguirà da sola finché non rilascia capacità. Le partenze delle lane sono scaglionate di 2 secondi per impostazione predefinita per evitare tempeste di create sul daemon Docker locale; sovrascrivi con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Il runner esegue preflight di Docker per impostazione predefinita, pulisce container E2E OpenClaw obsoleti, emette stato delle lane attive ogni 30 secondi, condivide le cache degli strumenti CLI provider tra lane compatibili, riprova una volta per impostazione predefinita i fallimenti transitori dei provider live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) e archivia i timing delle lane in `.artifacts/docker-tests/lane-timings.json` per l'ordinamento dal più lungo nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifesto delle lane senza eseguire Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` per regolare l'output di stato, oppure `OPENCLAW_DOCKER_ALL_TIMINGS=0` per disabilitare il riuso dei timing. Usa `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` solo per lane deterministiche/locali o `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` solo per lane con provider live; gli alias di pacchetto sono `pnpm test:docker:local:all` e `pnpm test:docker:live:all`. La modalità solo live fonde le lane live main e tail in un unico pool dal più lungo così i bucket provider possono impacchettare insieme lavoro Claude, Codex e Gemini. Il runner interrompe la pianificazione di nuove lane in pool dopo il primo fallimento a meno che non sia impostato `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, e ogni lane ha un timeout fallback di 120 minuti sovrascrivibile con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; lane live/tail selezionate usano cap per-lane più stretti. I comandi Docker di setup del backend CLI hanno un proprio timeout tramite `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (predefinito 180). Log per-lane, `summary.json`, `failures.json` e timing delle fasi vengono scritti sotto `.artifacts/docker-tests/<run-id>/`; usa `pnpm test:docker:timings <summary.json>` per ispezionare le lane lente e `pnpm test:docker:rerun <run-id|summary.json|failures.json>` per stampare comandi di riesecuzione mirati economici.
- `pnpm test:docker:browser-cdp-snapshot`: costruisce un container E2E sorgente basato su Chromium, avvia CDP raw più un Gateway isolato, esegue `browser doctor --deep` e verifica che gli snapshot dei ruoli CDP includano URL dei link, elementi cliccabili promossi dal cursore, riferimenti iframe e metadati dei frame.
- Le probe Docker live del backend CLI possono essere eseguite come lane focalizzate, per esempio `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` o `pnpm test:docker:live-cli-backend:codex:mcp`. Claude e Gemini hanno alias `:resume` e `:mcp` corrispondenti.
- `pnpm test:docker:openwebui`: avvia OpenClaw + Open WebUI dockerizzati, effettua l'accesso tramite Open WebUI, controlla `/api/models`, poi esegue una chat reale proxied tramite `/api/chat/completions`. Richiede una chiave di modello live utilizzabile (per esempio OpenAI in `~/.profile`), scarica un'immagine Open WebUI esterna e non ci si aspetta che sia stabile in CI come le normali suite unit/e2e.
- `pnpm test:docker:mcp-channels`: avvia un container Gateway seeded e un secondo container client che genera `openclaw mcp serve`, poi verifica discovery delle conversazioni instradate, letture delle trascrizioni, metadati degli allegati, comportamento della coda di eventi live, routing dell'invio in uscita e notifiche di canale + permessi in stile Claude sul bridge stdio reale. L'asserzione sulle notifiche Claude legge direttamente i frame MCP stdio raw, così lo smoke riflette ciò che il bridge emette davvero.

## Gate PR locale

Per i controlli locali di integrazione/validazione delle PR, esegui:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` genera un errore intermittente su un host carico, rieseguilo una volta prima di considerarlo una regressione, poi isola con `pnpm test <path/to/test>`. Per gli host con memoria limitata, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark della latenza del modello (chiavi locali)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env facoltative: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predefinito: “Rispondi con una sola parola: ok. Nessuna punteggiatura o testo aggiuntivo.”

Ultima esecuzione (2025-12-31, 20 esecuzioni):

- minimax mediana 1279 ms (min 1114, max 2431)
- opus mediana 2454 ms (min 1224, max 3170)

## Benchmark di avvio della CLI

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

Preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: entrambi i preset

L'output include `sampleCount`, media, p50, p95, min/max, distribuzione dei codici di uscita/segnali e riepiloghi RSS massimi per ogni comando. Le opzioni facoltative `--cpu-prof-dir` / `--heap-prof-dir` scrivono profili V8 per ogni esecuzione, così la misurazione dei tempi e l'acquisizione dei profili usano lo stesso harness.

Convenzioni dell'output salvato:

- `pnpm test:startup:bench:smoke` scrive l'artefatto smoke mirato in `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` scrive l'artefatto della suite completa in `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` aggiorna la fixture baseline inclusa nel repository in `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture inclusa nel repository:

- `test/fixtures/cli-startup-bench.json`
- Aggiorna con `pnpm test:startup:bench:update`
- Confronta i risultati correnti con la fixture usando `pnpm test:startup:bench:check`

## E2E di onboarding (Docker)

Docker è facoltativo; è necessario solo per gli smoke test di onboarding containerizzati.

Flusso completo di avvio a freddo in un container Linux pulito:

```bash
scripts/e2e/onboard-docker.sh
```

Questo script guida la procedura guidata interattiva tramite una pseudo-tty, verifica i file di config/workspace/session, poi avvia il Gateway ed esegue `openclaw health`.

## Smoke test dell'importazione QR (Docker)

Assicura che l'helper runtime QR mantenuto venga caricato nei runtime Docker Node supportati (Node 24 predefinito, Node 22 compatibile):

```bash
pnpm test:docker:qr
```

## Correlati

- [Testing](/it/help/testing)
- [Testing live](/it/help/testing-live)
