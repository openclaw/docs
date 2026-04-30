---
read_when:
    - Esecuzione o correzione dei test
summary: Come eseguire i test in locale (vitest) e quando usare le modalità force/coverage
title: Test
x-i18n:
    generated_at: "2026-04-30T18:38:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 131f2bad3b2806d28394213cec38d632d106ddbf8ff04d06345ab8046fb8bcf2
    source_path: reference/test.md
    workflow: 16
---

- Kit completo per i test (suite, live, Docker): [Test](/it/help/testing)

- `pnpm test:force`: Termina qualsiasi processo Gateway residuo che mantiene occupata la porta di controllo predefinita, poi esegue la suite Vitest completa con una porta Gateway isolata, così i test del server non entrano in conflitto con un’istanza in esecuzione. Usalo quando una precedente esecuzione del Gateway ha lasciato occupata la porta 18789.
- `pnpm test:coverage`: Esegue la suite unit con copertura V8 (tramite `vitest.unit.config.ts`). Questo è un gate di copertura unit dei file caricati, non una copertura di tutti i file dell’intero repository. Le soglie sono 70% per righe/funzioni/istruzioni e 55% per i rami. Poiché `coverage.all` è false, il gate misura i file caricati dalla suite di copertura unit invece di trattare ogni file sorgente split-lane come non coperto.
- `pnpm test:coverage:changed`: Esegue la copertura unit solo per i file modificati rispetto a `origin/main`.
- `pnpm test:changed`: esecuzione economica e intelligente dei test modificati. Esegue target precisi da modifiche dirette ai test, file `*.test.ts` adiacenti, mapping espliciti dei sorgenti e grafo locale degli import. Le modifiche ampie a config/package sono saltate a meno che non mappino a test precisi.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: esecuzione esplicita ampia dei test modificati. Usala quando una modifica a harness/config/package di test deve ricadere sul comportamento più ampio di Vitest per i test modificati.
- `pnpm changed:lanes`: mostra le lane architetturali attivate dal diff rispetto a `origin/main`.
- `pnpm check:changed`: esegue il gate intelligente di controllo delle modifiche per il diff rispetto a `origin/main`. Esegue typecheck, lint e comandi guard per le lane architetturali interessate, ma non esegue test Vitest. Usa `pnpm test:changed` o `pnpm test <target>` esplicito per la prova dei test.
- `pnpm test`: instrada target espliciti di file/directory attraverso lane Vitest con ambito. Le esecuzioni senza target usano gruppi di shard fissi e si espandono in config foglia per l’esecuzione parallela locale; il gruppo delle estensioni si espande sempre nelle config shard per estensione invece di un unico enorme processo root-project.
- Le esecuzioni del wrapper di test terminano con un breve riepilogo `[test] passed|failed|skipped ... in ...`. La riga di durata propria di Vitest rimane il dettaglio per shard.
- Stato di test OpenClaw condiviso: usa `src/test-utils/openclaw-test-state.ts` da Vitest quando un test richiede `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture di config, workspace, directory agente o archivio auth-profile isolati.
- Helper E2E di processo: usa `test/helpers/openclaw-test-instance.ts` quando un test E2E a livello di processo Vitest richiede un Gateway in esecuzione, env CLI, acquisizione dei log e pulizia in un unico punto.
- Helper E2E Docker/Bash: le lane che fanno source di `scripts/lib/docker-e2e-image.sh` possono passare `docker_e2e_test_state_shell_b64 <label> <scenario>` nel container e decodificarlo con `scripts/lib/openclaw-e2e-instance.sh`; gli script multi-home possono passare `docker_e2e_test_state_function_b64` e chiamare `openclaw_test_state_create <label> <scenario>` in ogni flusso. I chiamanti di livello inferiore possono usare `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` per uno snippet shell nel container, oppure `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` per un file env host eseguibile con source. Il `--` prima di `create` impedisce ai runtime Node più recenti di trattare `--env-file` come flag Node. Le lane Docker/Bash che avviano un Gateway possono fare source di `scripts/lib/openclaw-e2e-instance.sh` dentro il container per risoluzione dell’entrypoint, avvio mock di OpenAI, lancio in primo piano/sfondo del Gateway, probe di prontezza, esportazione dell’env di stato, dump dei log e pulizia dei processi.
- Le esecuzioni full, extension e con pattern di inclusione aggiornano i dati di timing locali in `.artifacts/vitest-shard-timings.json`; le successive esecuzioni whole-config usano quei timing per bilanciare shard lenti e veloci. Gli shard CI con pattern di inclusione aggiungono il nome dello shard alla chiave di timing, mantenendo visibili i timing degli shard filtrati senza sostituire i dati di timing whole-config. Imposta `OPENCLAW_TEST_PROJECTS_TIMINGS=0` per ignorare l’artefatto di timing locale.
- I file di test selezionati `plugin-sdk` e `commands` ora vengono instradati attraverso lane leggere dedicate che mantengono solo `test/setup.ts`, lasciando i casi runtime-heavy sulle loro lane esistenti.
- I file sorgente con test adiacenti mappano a quel test adiacente prima di ricadere su glob di directory più ampi. Le modifiche agli helper sotto `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` e `src/plugins/contracts` usano un grafo locale degli import per eseguire i test importatori invece di eseguire ampiamente ogni shard quando il percorso di dipendenza è preciso.
- `auto-reply` ora si divide anche in tre config dedicate (`core`, `top-level`, `reply`) così l’harness di risposta non domina i test più leggeri top-level di stato/token/helper.
- La config Vitest di base ora usa per impostazione predefinita `pool: "threads"` e `isolate: false`, con il runner condiviso non isolato abilitato in tutte le config del repository.
- `pnpm test:channels` esegue `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` eseguono tutti gli shard di estensioni/Plugin. I Plugin di canale pesanti, il Plugin del browser e OpenAI vengono eseguiti come shard dedicati; gli altri gruppi di Plugin rimangono raggruppati. Usa `pnpm test extensions/<id>` per una lane di un singolo Plugin incluso.
- `pnpm test:perf:imports`: abilita la reportistica Vitest su durata degli import + breakdown degli import, continuando a usare il routing per lane con ambito per target espliciti di file/directory.
- `pnpm test:perf:imports:changed`: stessa profilazione degli import, ma solo per i file modificati rispetto a `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` esegue benchmark del percorso routed in modalità changed rispetto all’esecuzione nativa root-project per lo stesso diff git committato.
- `pnpm test:perf:changed:bench -- --worktree` esegue benchmark dell’insieme di modifiche del worktree corrente senza eseguire prima il commit.
- `pnpm test:perf:profile:main`: scrive un profilo CPU per il thread principale Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: scrive profili CPU + heap per il runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: esegue serialmente ogni config foglia Vitest full-suite e scrive dati di durata raggruppati più artefatti JSON/log per config. Il Test Performance Agent lo usa come baseline prima di tentare correzioni ai test lenti.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: confronta i report raggruppati dopo una modifica orientata alle prestazioni.
- Integrazione Gateway: opt-in tramite `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: Esegue smoke test end-to-end del Gateway (pairing multi-istanza WS/HTTP/node). Usa per impostazione predefinita `threads` + `isolate: false` con worker adattivi in `vitest.e2e.config.ts`; regola con `OPENCLAW_E2E_WORKERS=<n>` e imposta `OPENCLAW_E2E_VERBOSE=1` per log dettagliati.
- `pnpm test:live`: Esegue test live dei provider (minimax/zai). Richiede chiavi API e `LIVE=1` (o `*_LIVE_TEST=1` specifico del provider) per non essere saltato.
- `pnpm test:docker:all`: Crea l’immagine live-test condivisa, impacchetta OpenClaw una volta come tarball npm, crea/riusa un’immagine runner Node/Git bare più un’immagine funzionale che installa quel tarball in `/app`, poi esegue lane smoke Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` tramite uno scheduler pesato. L’immagine bare (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) è usata per le lane installer/update/plugin-dependency; quelle lane montano il tarball precompilato invece di usare sorgenti del repository copiati. L’immagine funzionale (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) è usata per le normali lane di funzionalità dell’app compilata. `scripts/package-openclaw-for-docker.mjs` è l’unico packer package locale/CI e valida il tarball più `dist/postinstall-inventory.json` prima che Docker lo consumi. Le definizioni delle lane Docker risiedono in `scripts/lib/docker-e2e-scenarios.mjs`; la logica del planner risiede in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` esegue il piano selezionato. `node scripts/test-docker-all.mjs --plan-json` emette il piano CI di proprietà dello scheduler per lane selezionate, tipi di immagine, esigenze package/live-image, scenari di stato e controlli delle credenziali senza creare o eseguire Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controlla gli slot di processo e ha valore predefinito 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controlla il pool tail sensibile ai provider e ha valore predefinito 10. I cap delle lane pesanti sono per impostazione predefinita `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; i cap dei provider sono per impostazione predefinita una lane pesante per provider tramite `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` e `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Usa `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` per host più grandi. Se una lane supera il peso effettivo o il cap di risorse su un host a bassa parallelizzazione, può comunque partire da un pool vuoto ed eseguirà da sola finché non rilascia capacità. Gli avvii delle lane sono scaglionati di 2 secondi per impostazione predefinita per evitare tempeste di creazione del daemon Docker locale; sovrascrivi con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Il runner esegue preflight di Docker per impostazione predefinita, pulisce container E2E OpenClaw obsoleti, emette stato delle lane attive ogni 30 secondi, condivide le cache degli strumenti CLI dei provider tra lane compatibili, ritenta una volta per impostazione predefinita gli errori transitori dei provider live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) e archivia i timing delle lane in `.artifacts/docker-tests/lane-timings.json` per ordinamento longest-first nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifest delle lane senza eseguire Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` per regolare l’output di stato oppure `OPENCLAW_DOCKER_ALL_TIMINGS=0` per disabilitare il riuso dei timing. Usa `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` solo per lane deterministiche/locali o `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` solo per lane con provider live; gli alias package sono `pnpm test:docker:local:all` e `pnpm test:docker:live:all`. La modalità live-only fonde le lane live principali e tail in un unico pool longest-first, così i bucket dei provider possono impacchettare insieme il lavoro Claude, Codex e Gemini. Il runner smette di schedulare nuove lane in pool dopo il primo errore a meno che `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` sia impostato, e ogni lane ha un timeout fallback di 120 minuti sovrascrivibile con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; lane live/tail selezionate usano cap per-lane più stretti. I comandi di setup Docker del backend CLI hanno un proprio timeout tramite `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (predefinito 180). Log per-lane, `summary.json`, `failures.json` e timing di fase sono scritti sotto `.artifacts/docker-tests/<run-id>/`; usa `pnpm test:docker:timings <summary.json>` per ispezionare le lane lente e `pnpm test:docker:rerun <run-id|summary.json|failures.json>` per stampare comandi economici di riesecuzione mirata.
- `pnpm test:docker:browser-cdp-snapshot`: Crea un container E2E sorgente basato su Chromium, avvia CDP raw più un Gateway isolato, esegue `browser doctor --deep` e verifica che gli snapshot dei ruoli CDP includano URL dei link, elementi cliccabili promossi dal cursore, riferimenti iframe e metadati dei frame.
- Le probe Docker live del backend CLI possono essere eseguite come lane focalizzate, per esempio `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` o `pnpm test:docker:live-cli-backend:codex:mcp`. Claude e Gemini hanno alias `:resume` e `:mcp` corrispondenti.
- `pnpm test:docker:openwebui`: Avvia OpenClaw + Open WebUI dockerizzati, accede tramite Open WebUI, controlla `/api/models`, poi esegue una chat reale proxata tramite `/api/chat/completions`. Richiede una chiave modello live utilizzabile (per esempio OpenAI in `~/.profile`), scarica un’immagine Open WebUI esterna e non è previsto che sia stabile in CI come le normali suite unit/e2e.
- `pnpm test:docker:mcp-channels`: Avvia un container Gateway con seed e un secondo container client che genera `openclaw mcp serve`, poi verifica discovery delle conversazioni instradate, letture delle trascrizioni, metadati degli allegati, comportamento della coda di eventi live, routing degli invii in uscita e notifiche di canale + permessi in stile Claude sul bridge stdio reale. L’asserzione della notifica Claude legge direttamente i frame MCP stdio raw, così lo smoke riflette ciò che il bridge emette realmente.
- `pnpm test:docker:upgrade-survivor`: Installa il tarball OpenClaw impacchettato sopra una fixture sporca di un vecchio utente, esegue l'aggiornamento del pacchetto più doctor non interattivo senza chiavi live del provider o del canale, quindi avvia un Gateway loopback e verifica che agenti, configurazione del canale, allowlist dei plugin, file di workspace/sessione, stato obsoleto delle dipendenze runtime dei plugin, avvio e stato RPC sopravvivano.

## Gate PR locale

Per i controlli locali di land/gate delle PR, esegui:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` è instabile su un host sotto carico, rilancialo una volta prima di considerarlo una regressione, poi isola con `pnpm test <path/to/test>`. Per host con memoria limitata, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark della latenza dei modelli (chiavi locali)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opzionali: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predefinito: “Rispondi con una sola parola: ok. Nessuna punteggiatura o testo aggiuntivo.”

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

L'output include `sampleCount`, media, p50, p95, min/max, distribuzione di codice di uscita/segnale e riepiloghi dell'RSS massimo per ogni comando. Gli elementi opzionali `--cpu-prof-dir` / `--heap-prof-dir` scrivono profili V8 per ogni esecuzione, così tempi e acquisizione dei profili usano lo stesso harness.

Convenzioni per gli output salvati:

- `pnpm test:startup:bench:smoke` scrive l'artefatto smoke mirato in `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` scrive l'artefatto della suite completa in `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` aggiorna la fixture baseline salvata nel repository in `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture salvata nel repository:

- `test/fixtures/cli-startup-bench.json`
- Aggiorna con `pnpm test:startup:bench:update`
- Confronta i risultati correnti con la fixture usando `pnpm test:startup:bench:check`

## E2E di onboarding (Docker)

Docker è opzionale; questo è necessario solo per i test smoke di onboarding containerizzati.

Flusso completo di avvio a freddo in un container Linux pulito:

```bash
scripts/e2e/onboard-docker.sh
```

Questo script guida la procedura interattiva tramite una pseudo-tty, verifica i file di configurazione/workspace/sessione, poi avvia il Gateway ed esegue `openclaw health`.

## Smoke di importazione QR (Docker)

Garantisce che l'helper runtime QR mantenuto venga caricato nei runtime Docker Node supportati (Node 24 predefinito, Node 22 compatibile):

```bash
pnpm test:docker:qr
```

## Correlati

- [Testing](/it/help/testing)
- [Testing live](/it/help/testing-live)
