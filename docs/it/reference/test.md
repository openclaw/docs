---
read_when:
    - Eseguire o correggere i test
summary: Come eseguire i test in locale (vitest) e quando usare le modalità force/coverage
title: Test
x-i18n:
    generated_at: "2026-05-05T06:18:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc31ab27a63607ec5134306a0129bd164e4235f26631da4f691f657adda70eed
    source_path: reference/test.md
    workflow: 16
---

- Kit di test completo (suite, live, Docker): [Test](/it/help/testing)
- Validazione degli aggiornamenti e dei pacchetti Plugin: [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins)

- `pnpm test:force`: termina qualsiasi processo Gateway residuo che occupa la porta di controllo predefinita, quindi esegue l'intera suite Vitest con una porta Gateway isolata, così i test del server non entrano in conflitto con un'istanza in esecuzione. Usalo quando una precedente esecuzione del Gateway ha lasciato occupata la porta 18789.
- `pnpm test:coverage`: esegue la suite unit con copertura V8 (tramite `vitest.unit.config.ts`). Questo è un gate di copertura unit per i file caricati, non una copertura di tutti i file dell'intero repository. Le soglie sono 70% per righe/funzioni/istruzioni e 55% per i branch. Poiché `coverage.all` è false, il gate misura i file caricati dalla suite di copertura unit invece di trattare ogni file sorgente split-lane come non coperto.
- `pnpm test:coverage:changed`: esegue la copertura unit solo per i file modificati rispetto a `origin/main`.
- `pnpm test:changed`: esecuzione economica dei test modificati smart. Esegue target precisi da modifiche dirette ai test, file `*.test.ts` fratelli, mappature esplicite delle sorgenti e grafo di import locale. Le modifiche ampie a config/package vengono saltate a meno che non mappino a test precisi.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: esecuzione esplicita ampia dei test modificati. Usala quando una modifica a test harness/config/package deve ricadere sul comportamento più ampio di Vitest per i test modificati.
- `pnpm changed:lanes`: mostra le lane architetturali attivate dal diff rispetto a `origin/main`.
- `pnpm check:changed`: esegue lo smart changed check gate per il diff rispetto a `origin/main`. Esegue typecheck, lint e comandi di guardia per le lane architetturali interessate, ma non esegue i test Vitest. Usa `pnpm test:changed` o `pnpm test <target>` esplicito per la prova dei test.
- `pnpm test`: instrada target espliciti di file/directory attraverso lane Vitest con ambito. Le esecuzioni senza target usano gruppi shard fissi e si espandono a configurazioni leaf per l'esecuzione parallela locale; il gruppo extension si espande sempre alle configurazioni shard per extension invece che a un unico enorme processo root-project.
- Le esecuzioni del wrapper di test terminano con un breve riepilogo `[test] passed|failed|skipped ... in ...`. La riga di durata propria di Vitest resta il dettaglio per shard.
- Stato di test OpenClaw condiviso: usa `src/test-utils/openclaw-test-state.ts` da Vitest quando un test ha bisogno di `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture di configurazione, workspace, directory agent o archivio auth-profile isolati.
- Helper E2E di processo: usa `test/helpers/openclaw-test-instance.ts` quando un test E2E a livello di processo Vitest ha bisogno di Gateway in esecuzione, ambiente CLI, cattura dei log e cleanup in un unico punto.
- Helper E2E Docker/Bash: le lane che fanno source di `scripts/lib/docker-e2e-image.sh` possono passare `docker_e2e_test_state_shell_b64 <label> <scenario>` nel container e decodificarlo con `scripts/lib/openclaw-e2e-instance.sh`; gli script multi-home possono passare `docker_e2e_test_state_function_b64` e chiamare `openclaw_test_state_create <label> <scenario>` in ogni flusso. I chiamanti di livello inferiore possono usare `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` per uno snippet shell in-container, oppure `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` per un file env host utilizzabile con source. Il `--` prima di `create` impedisce ai runtime Node più recenti di trattare `--env-file` come flag Node. Le lane Docker/Bash che avviano un Gateway possono fare source di `scripts/lib/openclaw-e2e-instance.sh` dentro il container per risoluzione dell'entrypoint, avvio mock di OpenAI, lancio del Gateway in foreground/background, readiness probe, export dello stato env, dump dei log e cleanup dei processi.
- Le esecuzioni shard full, extension e include-pattern aggiornano i dati di timing locali in `.artifacts/vitest-shard-timings.json`; le successive esecuzioni whole-config usano quei timing per bilanciare shard lenti e veloci. Gli shard CI include-pattern aggiungono il nome dello shard alla chiave di timing, mantenendo visibili i timing degli shard filtrati senza sostituire i dati di timing whole-config. Imposta `OPENCLAW_TEST_PROJECTS_TIMINGS=0` per ignorare l'artefatto di timing locale.
- I file di test `plugin-sdk` e `commands` selezionati ora vengono instradati attraverso lane leggere dedicate che mantengono solo `test/setup.ts`, lasciando i casi pesanti a runtime sulle lane esistenti.
- I file sorgente con test fratelli mappano a quel fratello prima di ricadere su glob di directory più ampi. Le modifiche agli helper sotto `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` e `src/plugins/contracts` usano un grafo di import locale per eseguire i test che importano, invece di eseguire ampiamente ogni shard quando il percorso della dipendenza è preciso.
- `auto-reply` ora si divide anche in tre configurazioni dedicate (`core`, `top-level`, `reply`) così l'harness reply non domina i test più leggeri di stato/token/helper top-level.
- La configurazione Vitest di base ora usa per impostazione predefinita `pool: "threads"` e `isolate: false`, con il runner condiviso non isolato abilitato nelle configurazioni del repository.
- `pnpm test:channels` esegue `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` eseguono tutti gli shard extension/plugin. I plugin di canale pesanti, il plugin browser e OpenAI vengono eseguiti come shard dedicati; gli altri gruppi plugin restano in batch. Usa `pnpm test extensions/<id>` per una singola lane di plugin bundled.
- `pnpm test:perf:imports`: abilita il reporting Vitest di durata import + dettaglio import, continuando a usare l'instradamento per lane con ambito per target espliciti di file/directory.
- `pnpm test:perf:imports:changed`: stessa profilazione degli import, ma solo per i file modificati rispetto a `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` esegue benchmark del percorso routed changed-mode rispetto all'esecuzione nativa root-project per lo stesso diff git committato.
- `pnpm test:perf:changed:bench -- --worktree` esegue benchmark dell'insieme di modifiche del worktree corrente senza committare prima.
- `pnpm test:perf:profile:main`: scrive un profilo CPU per il thread principale di Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: scrive profili CPU + heap per il runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: esegue serialmente ogni configurazione leaf Vitest full-suite e scrive dati di durata raggruppati più artefatti JSON/log per configurazione. Il Test Performance Agent lo usa come baseline prima di tentare correzioni dei test lenti.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: confronta report raggruppati dopo una modifica focalizzata sulle prestazioni.
- Integrazione Gateway: opt-in tramite `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: esegue smoke test gateway end-to-end (accoppiamento multi-instance WS/HTTP/node). Usa per impostazione predefinita `threads` + `isolate: false` con worker adattivi in `vitest.e2e.config.ts`; regola con `OPENCLAW_E2E_WORKERS=<n>` e imposta `OPENCLAW_E2E_VERBOSE=1` per log dettagliati.
- `pnpm test:live`: esegue test live dei provider (minimax/zai). Richiede chiavi API e `LIVE=1` (o `*_LIVE_TEST=1` specifico del provider) per non essere saltato.
- `pnpm test:docker:all`: crea l'immagine live-test condivisa, impacchetta OpenClaw una sola volta come tarball npm, crea/riusa un'immagine runner Node/Git bare più un'immagine funzionale che installa quel tarball in `/app`, quindi esegue le lane smoke Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` tramite uno scheduler ponderato. L'immagine bare (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) viene usata per lane installer/update/plugin-dependency; tali lane montano il tarball precostruito invece di usare sorgenti del repository copiati. L'immagine funzionale (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) viene usata per le normali lane di funzionalità dell'app compilata. `scripts/package-openclaw-for-docker.mjs` è l'unico packer locale/CI del package e valida il tarball più `dist/postinstall-inventory.json` prima che Docker lo consumi. Le definizioni delle lane Docker vivono in `scripts/lib/docker-e2e-scenarios.mjs`; la logica del planner vive in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` esegue il piano selezionato. `node scripts/test-docker-all.mjs --plan-json` emette il piano CI posseduto dallo scheduler per lane selezionate, tipi di immagine, necessità package/live-image, scenari di stato e controlli delle credenziali senza creare o eseguire Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controlla gli slot di processo e ha default 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controlla il pool tail sensibile al provider e ha default 10. I limiti delle lane pesanti hanno default `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; i limiti dei provider hanno default di una lane pesante per provider tramite `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` e `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Usa `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` per host più grandi. Se una lane supera il limite effettivo di peso o risorse su un host a bassa parallelizzazione, può comunque partire da un pool vuoto e verrà eseguita da sola finché non rilascia capacità. Gli avvii delle lane sono scaglionati di 2 secondi per impostazione predefinita per evitare tempeste di create del daemon Docker locale; sovrascrivi con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Il runner pre-verifica Docker per impostazione predefinita, pulisce container OpenClaw E2E obsoleti, emette lo stato delle lane attive ogni 30 secondi, condivide le cache degli strumenti CLI provider tra lane compatibili, ritenta una volta per impostazione predefinita i fallimenti transienti dei live-provider (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) e conserva i timing delle lane in `.artifacts/docker-tests/lane-timings.json` per ordinare dalla più lunga nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifest delle lane senza eseguire Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` per regolare l'output di stato, oppure `OPENCLAW_DOCKER_ALL_TIMINGS=0` per disabilitare il riuso dei timing. Usa `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` solo per lane deterministic/local o `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` solo per lane live-provider; gli alias package sono `pnpm test:docker:local:all` e `pnpm test:docker:live:all`. La modalità live-only unisce le lane live main e tail in un unico pool longest-first così i bucket provider possono impacchettare insieme il lavoro Claude, Codex e Gemini. Il runner smette di schedulare nuove lane pooled dopo il primo fallimento, a meno che `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` sia impostato, e ogni lane ha un timeout fallback di 120 minuti sovrascrivibile con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; le lane live/tail selezionate usano limiti per lane più stretti. I comandi di setup Docker del backend CLI hanno il proprio timeout tramite `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (default 180). Log per lane, `summary.json`, `failures.json` e timing di fase vengono scritti sotto `.artifacts/docker-tests/<run-id>/`; usa `pnpm test:docker:timings <summary.json>` per ispezionare le lane lente e `pnpm test:docker:rerun <run-id|summary.json|failures.json>` per stampare comandi di rerun mirati economici.
- `pnpm test:docker:browser-cdp-snapshot`: crea un container E2E sorgente basato su Chromium, avvia CDP raw più un Gateway isolato, esegue `browser doctor --deep` e verifica che gli snapshot dei ruoli CDP includano URL dei link, cliccabili promossi dal cursore, riferimenti iframe e metadati dei frame.
- Le probe Docker live del backend CLI possono essere eseguite come lane focalizzate, per esempio `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` o `pnpm test:docker:live-cli-backend:codex:mcp`. Claude e Gemini hanno alias `:resume` e `:mcp` corrispondenti.
- `pnpm test:docker:openwebui`: avvia OpenClaw + Open WebUI in Docker, effettua l'accesso tramite Open WebUI, controlla `/api/models`, quindi esegue una chat reale con proxy tramite `/api/chat/completions`. Richiede una chiave modello live utilizzabile (per esempio OpenAI in `~/.profile`), scarica un'immagine esterna Open WebUI e non è previsto che sia stabile in CI come le normali suite unit/e2e.
- `pnpm test:docker:mcp-channels`: avvia un container Gateway con seed e un secondo container client che genera `openclaw mcp serve`, quindi verifica discovery delle conversazioni instradate, lettura dei transcript, metadati degli allegati, comportamento della coda di eventi live, routing dell'invio in uscita e notifiche di canale + permessi in stile Claude sul bridge stdio reale. L'asserzione sulla notifica Claude legge direttamente i frame MCP stdio raw, così lo smoke riflette ciò che il bridge emette davvero.
- `pnpm test:docker:upgrade-survivor`: Installa il tarball OpenClaw impacchettato sopra una fixture sporca di un vecchio utente, esegue l’aggiornamento del pacchetto più doctor non interattivo senza chiavi di provider o canali live, quindi avvia un Gateway in loopback e verifica che agenti, configurazione dei canali, allowlist dei plugin, file di workspace/sessione, stato obsoleto delle dipendenze dei plugin legacy, avvio e stato RPC sopravvivano.
- `pnpm test:docker:published-upgrade-survivor`: Installa `openclaw@latest` per impostazione predefinita, inizializza file realistici di un utente esistente senza chiavi di provider o canali live, configura quella baseline con una ricetta di comando `openclaw config set` incorporata, aggiorna quell’installazione pubblicata al tarball OpenClaw impacchettato, esegue doctor non interattivo, scrive `.artifacts/upgrade-survivor/summary.json`, quindi avvia un Gateway in loopback e verifica che intenti configurati, file di workspace/sessione, configurazione obsoleta dei plugin e stato delle dipendenze legacy, avvio, `/healthz`, `/readyz` e stato RPC sopravvivano o vengano riparati correttamente. Sovrascrivi una baseline con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, espandi una matrice locale esatta con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` come `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, oppure aggiungi fixture di scenario con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; il set reported-issues include `configured-plugin-installs` per verificare che i plugin OpenClaw esterni configurati vengano installati automaticamente durante l’aggiornamento e `stale-source-plugin-shadow` per impedire che shadow di plugin solo sorgente interrompano l’avvio. Accettazione pacchetto li espone come `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`, e risolve token di baseline meta come `last-stable-4` o `all-since-2026.4.23` prima di passare specifiche esatte dei pacchetti alle lane Docker.
- `pnpm test:docker:update-migration`: Esegue l’harness published-upgrade survivor nello scenario `plugin-deps-cleanup`, intensivo nella pulizia, partendo da `openclaw@2026.4.23` per impostazione predefinita. Il workflow separato `Update Migration` espande questa lane con `baselines=all-since-2026.4.23`, così ogni pacchetto stabile pubblicato dalla `.23` in poi si aggiorna al candidato e dimostra la pulizia delle dipendenze dei plugin configurati al di fuori della CI di rilascio completo.
- `pnpm test:docker:plugins`: Esegue smoke di installazione/aggiornamento per path locali, `file:`, pacchetti del registro npm con dipendenze hoistate, ref Git mobili, fixture ClawHub, aggiornamenti del marketplace e abilitazione/ispezione del bundle Claude.

## Gate PR locale

Per i controlli locali di merge/gate delle PR, esegui:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` fallisce in modo intermittente su un host sotto carico, rieseguilo una volta prima di trattarlo come una regressione, quindi isola con `pnpm test <path/to/test>`. Per host con memoria limitata, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark della latenza dei modelli (chiavi locali)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opzionali: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predefinito: “Rispondi con una sola parola: ok. Nessuna punteggiatura o testo extra.”

Ultima esecuzione (2025-12-31, 20 esecuzioni):

- minimax mediana 1279ms (min 1114, max 2431)
- opus mediana 2454ms (min 1224, max 3170)

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

L'output include `sampleCount`, media, p50, p95, min/max, distribuzione di codici di uscita/segnali e riepiloghi RSS massimi per ogni comando. Gli elementi opzionali `--cpu-prof-dir` / `--heap-prof-dir` scrivono profili V8 per ogni esecuzione, così la misurazione dei tempi e la cattura dei profili usano lo stesso harness.

Convenzioni per l'output salvato:

- `pnpm test:startup:bench:smoke` scrive l'artefatto smoke mirato in `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` scrive l'artefatto della suite completa in `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` aggiorna la fixture baseline archiviata nel repository in `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture archiviata nel repository:

- `test/fixtures/cli-startup-bench.json`
- Aggiorna con `pnpm test:startup:bench:update`
- Confronta i risultati attuali con la fixture usando `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker è opzionale; è necessario solo per i test smoke di onboarding containerizzati.

Flusso completo di avvio a freddo in un container Linux pulito:

```bash
scripts/e2e/onboard-docker.sh
```

Questo script guida la procedura guidata interattiva tramite una pseudo-tty, verifica i file di configurazione/workspace/sessione, quindi avvia il Gateway ed esegue `openclaw health`.

## Smoke di importazione QR (Docker)

Assicura che l'helper runtime QR mantenuto venga caricato nei runtime Docker Node supportati (Node 24 predefinito, Node 22 compatibile):

```bash
pnpm test:docker:qr
```

## Correlati

- [Test](/it/help/testing)
- [Test live](/it/help/testing-live)
- [Test di aggiornamenti e plugins](/it/help/testing-updates-plugins)
