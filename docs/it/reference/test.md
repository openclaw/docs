---
read_when:
    - Esecuzione o correzione dei test
summary: Come eseguire i test localmente (vitest) e quando usare le modalità force/coverage
title: Test
x-i18n:
    generated_at: "2026-05-05T01:49:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e8421518d63cade24ce8c2a08fa10538b66d2332b1eb5744e47c6d5a5e84605
    source_path: reference/test.md
    workflow: 16
---

- Kit completo di test (suite, live, Docker): [Test](/it/help/testing)
- Convalida degli aggiornamenti e dei pacchetti Plugin: [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins)

- `pnpm test:force`: Termina eventuali processi Gateway residui che occupano la porta di controllo predefinita, quindi esegue l'intera suite Vitest con una porta Gateway isolata, in modo che i test server non entrino in conflitto con un'istanza in esecuzione. Usalo quando una precedente esecuzione del Gateway ha lasciato occupata la porta 18789.
- `pnpm test:coverage`: Esegue la suite di unit test con copertura V8 (tramite `vitest.unit.config.ts`). Questo è un gate di copertura unit basato sui file caricati, non una copertura di tutti i file dell'intero repo. Le soglie sono 70% per righe/funzioni/istruzioni e 55% per i branch. Poiché `coverage.all` è false, il gate misura i file caricati dalla suite di copertura unit invece di trattare ogni file sorgente split-lane come non coperto.
- `pnpm test:coverage:changed`: Esegue la copertura unit solo per i file modificati rispetto a `origin/main`.
- `pnpm test:changed`: esecuzione economica e intelligente dei test modificati. Esegue target precisi derivati da modifiche dirette ai test, file `*.test.ts` fratelli, mappature sorgente esplicite e dal grafo di import locale. Le modifiche ampie a configurazione/pacchetto vengono saltate a meno che non si mappino a test precisi.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: esecuzione esplicita ampia dei test modificati. Usala quando una modifica a harness/configurazione/pacchetto dei test dovrebbe ricadere sul comportamento più ampio dei test modificati di Vitest.
- `pnpm changed:lanes`: mostra le corsie architetturali attivate dal diff rispetto a `origin/main`.
- `pnpm check:changed`: esegue il gate intelligente di controllo modifiche per il diff rispetto a `origin/main`. Esegue typecheck, lint e comandi guard per le corsie architetturali interessate, ma non esegue i test Vitest. Usa `pnpm test:changed` o un `pnpm test <target>` esplicito per la prova dei test.
- `pnpm test`: instrada i target espliciti di file/directory attraverso corsie Vitest con ambito. Le esecuzioni senza target usano gruppi di shard fissi e si espandono in configurazioni leaf per l'esecuzione parallela locale; il gruppo di estensioni si espande sempre nelle configurazioni shard per estensione invece che in un unico enorme processo root-project.
- Le esecuzioni del wrapper dei test terminano con un breve riepilogo `[test] passed|failed|skipped ... in ...`. La riga di durata propria di Vitest resta il dettaglio per shard.
- Stato di test OpenClaw condiviso: usa `src/test-utils/openclaw-test-state.ts` da Vitest quando un test richiede un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture di configurazione, workspace, directory agente o archivio auth-profile isolato.
- Helper E2E di processo: usa `test/helpers/openclaw-test-instance.ts` quando un test E2E a livello di processo Vitest richiede un Gateway in esecuzione, ambiente CLI, acquisizione dei log e cleanup in un unico punto.
- Helper E2E Docker/Bash: le corsie che fanno source di `scripts/lib/docker-e2e-image.sh` possono passare `docker_e2e_test_state_shell_b64 <label> <scenario>` nel container e decodificarlo con `scripts/lib/openclaw-e2e-instance.sh`; gli script multi-home possono passare `docker_e2e_test_state_function_b64` e chiamare `openclaw_test_state_create <label> <scenario>` in ciascun flusso. I chiamanti di livello più basso possono usare `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` per uno snippet shell nel container, oppure `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` per un file env dell'host utilizzabile con source. Il `--` prima di `create` impedisce ai runtime Node più recenti di trattare `--env-file` come flag Node. Le corsie Docker/Bash che avviano un Gateway possono fare source di `scripts/lib/openclaw-e2e-instance.sh` dentro il container per risoluzione dell'entrypoint, avvio mock di OpenAI, avvio Gateway in foreground/background, probe di readiness, esportazione dell'env di stato, dump dei log e cleanup dei processi.
- Le esecuzioni shard full, extension e include-pattern aggiornano i dati locali di timing in `.artifacts/vitest-shard-timings.json`; le esecuzioni successive dell'intera configurazione usano quei timing per bilanciare shard lenti e veloci. Gli shard CI include-pattern aggiungono il nome dello shard alla chiave di timing, mantenendo visibili i timing degli shard filtrati senza sostituire i dati di timing dell'intera configurazione. Imposta `OPENCLAW_TEST_PROJECTS_TIMINGS=0` per ignorare l'artefatto locale di timing.
- File di test `plugin-sdk` e `commands` selezionati ora passano attraverso corsie light dedicate che mantengono solo `test/setup.ts`, lasciando i casi runtime-heavy nelle loro corsie esistenti.
- I file sorgente con test fratelli si mappano a quel fratello prima di ricadere su glob di directory più ampi. Le modifiche agli helper sotto `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` e `src/plugins/contracts` usano un grafo di import locale per eseguire i test importatori invece di eseguire ampiamente ogni shard quando il percorso della dipendenza è preciso.
- `auto-reply` ora si divide anche in tre configurazioni dedicate (`core`, `top-level`, `reply`) così l'harness reply non domina i test top-level più leggeri di stato/token/helper.
- La configurazione base di Vitest ora usa per impostazione predefinita `pool: "threads"` e `isolate: false`, con il runner non isolato condiviso abilitato nelle configurazioni del repo.
- `pnpm test:channels` esegue `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` eseguono tutti gli shard di estensioni/plugin. I plugin di canale pesanti, il plugin browser e OpenAI vengono eseguiti come shard dedicati; gli altri gruppi di plugin restano raggruppati. Usa `pnpm test extensions/<id>` per una corsia di un solo plugin bundled.
- `pnpm test:perf:imports`: abilita il reporting di durata import + breakdown import di Vitest, continuando a usare il routing delle corsie con ambito per target espliciti di file/directory.
- `pnpm test:perf:imports:changed`: stesso profiling degli import, ma solo per i file modificati rispetto a `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` esegue un benchmark del percorso routed in modalità changed rispetto all'esecuzione nativa root-project per lo stesso diff git committato.
- `pnpm test:perf:changed:bench -- --worktree` esegue un benchmark del set di modifiche del worktree corrente senza fare prima commit.
- `pnpm test:perf:profile:main`: scrive un profilo CPU per il thread principale di Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: scrive profili CPU + heap per il runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: esegue serialmente ogni configurazione leaf Vitest full-suite e scrive dati di durata raggruppati più artefatti JSON/log per configurazione. Il Test Performance Agent lo usa come baseline prima di tentare correzioni ai test lenti.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: confronta i report raggruppati dopo una modifica focalizzata sulle prestazioni.
- Integrazione Gateway: opt-in tramite `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: esegue smoke test end-to-end del gateway (pairing multi-istanza WS/HTTP/node). Usa per impostazione predefinita `threads` + `isolate: false` con worker adattivi in `vitest.e2e.config.ts`; regola con `OPENCLAW_E2E_WORKERS=<n>` e imposta `OPENCLAW_E2E_VERBOSE=1` per log dettagliati.
- `pnpm test:live`: esegue test live dei provider (minimax/zai). Richiede chiavi API e `LIVE=1` (o `*_LIVE_TEST=1` specifico del provider) per non essere saltato.
- `pnpm test:docker:all`: crea l'immagine live-test condivisa, impacchetta OpenClaw una sola volta come tarball npm, crea/riusa un'immagine runner Node/Git minimale più un'immagine funzionale che installa quel tarball in `/app`, quindi esegue corsie smoke Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` tramite uno scheduler pesato. L'immagine minimale (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) è usata per le corsie installer/update/plugin-dependency; quelle corsie montano il tarball precompilato invece di usare i sorgenti copiati del repo. L'immagine funzionale (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) è usata per le corsie di funzionalità normale dell'app compilata. `scripts/package-openclaw-for-docker.mjs` è l'unico packer del pacchetto locale/CI e valida il tarball più `dist/postinstall-inventory.json` prima che Docker lo consumi. Le definizioni delle corsie Docker vivono in `scripts/lib/docker-e2e-scenarios.mjs`; la logica del planner vive in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` esegue il piano selezionato. `node scripts/test-docker-all.mjs --plan-json` emette il piano CI di proprietà dello scheduler per corsie selezionate, tipi di immagine, necessità di pacchetto/live-image, scenari di stato e controlli delle credenziali senza creare né eseguire Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controlla gli slot di processo e il valore predefinito è 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controlla il pool tail sensibile ai provider e il valore predefinito è 10. I limiti delle corsie pesanti sono per impostazione predefinita `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; i limiti dei provider usano per impostazione predefinita una corsia pesante per provider tramite `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` e `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Usa `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` per host più grandi. Se una corsia supera il limite effettivo di peso o risorse su un host a bassa parallelizzazione, può comunque partire da un pool vuoto e verrà eseguita da sola finché non rilascia capacità. Gli avvii delle corsie sono scaglionati di 2 secondi per impostazione predefinita per evitare tempeste di create nel daemon Docker locale; sovrascrivi con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Il runner esegue per impostazione predefinita preflight di Docker, pulisce container E2E OpenClaw obsoleti, emette lo stato delle corsie attive ogni 30 secondi, condivide cache degli strumenti CLI provider tra corsie compatibili, ritenta una volta per impostazione predefinita i fallimenti transitori dei provider live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) e archivia i timing delle corsie in `.artifacts/docker-tests/lane-timings.json` per l'ordinamento dal più lungo nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifesto delle corsie senza eseguire Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` per regolare l'output di stato o `OPENCLAW_DOCKER_ALL_TIMINGS=0` per disabilitare il riuso dei timing. Usa `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` solo per corsie deterministiche/locali oppure `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` solo per corsie con provider live; gli alias di pacchetto sono `pnpm test:docker:local:all` e `pnpm test:docker:live:all`. La modalità live-only unisce le corsie live main e tail in un unico pool dal più lungo, così i bucket dei provider possono impacchettare insieme il lavoro Claude, Codex e Gemini. Il runner smette di schedulare nuove corsie pooled dopo il primo fallimento a meno che `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` sia impostato, e ogni corsia ha un timeout fallback di 120 minuti sovrascrivibile con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; corsie live/tail selezionate usano limiti per corsia più stretti. I comandi di setup Docker del backend CLI hanno un proprio timeout tramite `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (predefinito 180). Log per corsia, `summary.json`, `failures.json` e timing delle fasi vengono scritti sotto `.artifacts/docker-tests/<run-id>/`; usa `pnpm test:docker:timings <summary.json>` per ispezionare le corsie lente e `pnpm test:docker:rerun <run-id|summary.json|failures.json>` per stampare comandi di riesecuzione mirati ed economici.
- `pnpm test:docker:browser-cdp-snapshot`: crea un container E2E sorgente basato su Chromium, avvia CDP raw più un Gateway isolato, esegue `browser doctor --deep` e verifica che gli snapshot dei ruoli CDP includano URL dei link, elementi cliccabili promossi dal cursore, riferimenti iframe e metadati dei frame.
- Le probe Docker live del backend CLI possono essere eseguite come corsie focalizzate, ad esempio `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` o `pnpm test:docker:live-cli-backend:codex:mcp`. Claude e Gemini hanno alias `:resume` e `:mcp` corrispondenti.
- `pnpm test:docker:openwebui`: avvia OpenClaw + Open WebUI Dockerizzati, esegue l'accesso tramite Open WebUI, controlla `/api/models`, quindi esegue una chat reale proxied tramite `/api/chat/completions`. Richiede una chiave di modello live utilizzabile (per esempio OpenAI in `~/.profile`), scarica un'immagine Open WebUI esterna e non ci si aspetta che sia stabile in CI come le normali suite unit/e2e.
- `pnpm test:docker:mcp-channels`: avvia un container Gateway pre-popolato e un secondo container client che esegue `openclaw mcp serve`, quindi verifica discovery delle conversazioni instradate, letture dei transcript, metadati degli allegati, comportamento della coda di eventi live, routing degli invii in uscita e notifiche di canale + permesso in stile Claude sul bridge stdio reale. L'asserzione della notifica Claude legge direttamente i frame MCP stdio raw, così lo smoke riflette ciò che il bridge emette effettivamente.
- `pnpm test:docker:upgrade-survivor`: Installa il tarball OpenClaw pacchettizzato sopra una fixture sporca di un vecchio utente, esegue l'aggiornamento del pacchetto più doctor non interattivo senza chiavi live di provider o canale, quindi avvia un Gateway loopback e verifica che agenti, configurazione del canale, allowlist dei plugin, file di workspace/sessione, stato obsoleto delle dipendenze dei plugin legacy, avvio e stato RPC sopravvivano.
- `pnpm test:docker:published-upgrade-survivor`: Installa `openclaw@latest` per impostazione predefinita, prepara file realistici di un utente esistente senza chiavi live di provider o canale, configura quella baseline con una ricetta di comandi `openclaw config set` incorporata, aggiorna l'installazione pubblicata al tarball OpenClaw pacchettizzato, esegue doctor non interattivo, scrive `.artifacts/upgrade-survivor/summary.json`, quindi avvia un Gateway loopback e verifica che intenti configurati, file di workspace/sessione, configurazione plugin obsoleta e stato delle dipendenze legacy, avvio, `/healthz`, `/readyz` e stato RPC sopravvivano o vengano riparati correttamente. Sovrascrivi una baseline con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, espandi una matrice esatta con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` come `all-since-2026.4.23`, oppure aggiungi fixture di scenario con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; l'insieme reported-issues include `configured-plugin-installs` per verificare che i plugin OpenClaw esterni configurati vengano installati automaticamente durante l'upgrade e `stale-source-plugin-shadow` per impedire che ombre di plugin solo sorgente interrompano l'avvio. Package Acceptance espone questi valori come `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`.
- `pnpm test:docker:update-migration`: Esegue l'harness published-upgrade survivor nello scenario `plugin-deps-cleanup`, intensivo sul cleanup, partendo da `openclaw@2026.4.23` per impostazione predefinita. Il workflow separato `Update Migration` espande questa lane con `baselines=all-since-2026.4.23`, così ogni pacchetto stabile pubblicato dalla `.23` in poi viene aggiornato al candidato e dimostra il cleanup delle dipendenze dei plugin configurati al di fuori della Full Release CI.
- `pnpm test:docker:plugins`: Esegue uno smoke test di installazione/aggiornamento per percorso locale, `file:`, pacchetti del registro npm con dipendenze hoistate, riferimenti git mobili, fixture ClawHub, aggiornamenti del marketplace e abilitazione/ispezione del bundle Claude.

## Gate PR locale

Per i controlli locali di land/gate delle PR, esegui:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` genera flake su un host sotto carico, rilancialo una volta prima di trattarlo come una regressione, poi isola con `pnpm test <path/to/test>`. Per host con memoria limitata, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark di latenza del modello (chiavi locali)

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

L’output include `sampleCount`, media, p50, p95, min/max, distribuzione di codici di uscita/segnali e riepiloghi RSS massimo per ciascun comando. Gli opzionali `--cpu-prof-dir` / `--heap-prof-dir` scrivono profili V8 per ogni esecuzione, così timing e acquisizione dei profili usano lo stesso harness.

Convenzioni per l’output salvato:

- `pnpm test:startup:bench:smoke` scrive l’artefatto smoke mirato in `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` scrive l’artefatto della suite completa in `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` aggiorna la fixture baseline versionata in `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionata:

- `test/fixtures/cli-startup-bench.json`
- Aggiorna con `pnpm test:startup:bench:update`
- Confronta i risultati correnti con la fixture usando `pnpm test:startup:bench:check`

## E2E di onboarding (Docker)

Docker è opzionale; serve solo per gli smoke test di onboarding containerizzati.

Flusso completo di avvio a freddo in un container Linux pulito:

```bash
scripts/e2e/onboard-docker.sh
```

Questo script guida il wizard interattivo tramite una pseudo-tty, verifica i file di configurazione/workspace/sessione, quindi avvia il Gateway ed esegue `openclaw health`.

## Smoke di importazione QR (Docker)

Assicura che l’helper runtime QR mantenuto venga caricato nei runtime Docker Node supportati (Node 24 predefinito, Node 22 compatibile):

```bash
pnpm test:docker:qr
```

## Correlati

- [Test](/it/help/testing)
- [Test live](/it/help/testing-live)
- [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins)
