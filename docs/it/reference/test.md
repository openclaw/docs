---
read_when:
    - Eseguire o correggere i test
summary: Come eseguire i test in locale (vitest) e quando usare le modalità force/coverage
title: Test
x-i18n:
    generated_at: "2026-06-27T18:15:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba6d1665497bebed287e69c865407dfb233ad60d64175558d053a69c72fea217
    source_path: reference/test.md
    workflow: 16
---

- Kit completo per i test (suite, live, Docker): [Test](/it/help/testing)
- Validazione degli aggiornamenti e dei pacchetti Plugin: [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins)

- Ordine ordinario dei test locali:
  1. `pnpm test:changed` per la prova Vitest sull'ambito modificato.
  2. `pnpm test <path-or-filter>` per un file, una directory o un target esplicito.
  3. `pnpm test` solo quando serve intenzionalmente l'intera suite Vitest locale.
- `pnpm test:force`: termina qualsiasi processo gateway residuo che occupa la porta di controllo predefinita, poi esegue l'intera suite Vitest con una porta gateway isolata, così i test server non entrano in conflitto con un'istanza in esecuzione. Usalo quando una precedente esecuzione del Gateway ha lasciato occupata la porta 18789.
- `pnpm test:coverage`: esegue la suite unit con copertura V8 (tramite `vitest.unit.config.ts`). Questo è un gate di copertura della lane unit predefinita, non una copertura di tutti i file dell'intero repo. Le soglie sono 70% per righe/funzioni/istruzioni e 55% per i rami. Poiché `coverage.all` è false e la lane predefinita limita gli include di copertura ai test unit non rapidi con file sorgente sibling, il gate misura il sorgente posseduto da questa lane invece di ogni import transitivo che capita di caricare.
- `pnpm test:coverage:changed`: esegue la copertura unit solo per i file modificati rispetto a `origin/main`.
- `pnpm test:changed`: esecuzione rapida e intelligente dei test modificati. Esegue target precisi da modifiche dirette ai test, file sibling `*.test.ts`, mappature esplicite del sorgente e grafo degli import locali. Le modifiche ampie a config/package vengono saltate a meno che non siano mappate a test precisi.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: esecuzione esplicita ampia dei test modificati. Usala quando una modifica a harness/config/package di test deve ricadere nel comportamento più ampio dei test modificati di Vitest.
- `pnpm changed:lanes`: mostra le lane architetturali attivate dal diff rispetto a `origin/main`.
- `pnpm check:changed`: delega a Crabbox/Testbox per impostazione predefinita fuori dalla CI, poi esegue il gate di check intelligente delle modifiche per il diff rispetto a `origin/main` dentro il child remoto. Esegue typecheck, lint e comandi di guardia per le lane architetturali interessate, ma non esegue test Vitest. Usa `pnpm test:changed` o `pnpm test <target>` esplicito per la prova dei test.
- Worktree Codex e checkout collegati/sparse: evita `pnpm test*`, `pnpm check*` e `pnpm crabbox:run` locali diretti, a meno che tu non abbia verificato che pnpm non riconcilierà le dipendenze. Per una prova minima su file esplicito usa `node scripts/run-vitest.mjs <path-or-filter>`; per gate sulle modifiche o prove ampie usa `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`, così pnpm viene eseguito dentro Testbox.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: mantiene la serializzazione degli heavy-check dentro il worktree corrente invece che nella directory Git comune per comandi come `pnpm check:changed` e `pnpm test ...` mirati. Usalo solo su host locali ad alta capacità quando esegui intenzionalmente check indipendenti su worktree collegati.
- `pnpm test`: instrada target espliciti di file/directory tramite lane Vitest con ambito. Le esecuzioni senza target sono prove full-suite: usano gruppi di shard fissi, si espandono in config leaf per l'esecuzione parallela locale e stampano il fanout degli shard locali previsto prima di iniziare. Il gruppo delle estensioni si espande sempre nelle config shard per estensione invece che in un unico enorme processo root-project.
- Le esecuzioni del wrapper di test terminano con un breve riepilogo `[test] passed|failed|skipped ... in ...`. La riga di durata propria di Vitest resta il dettaglio per shard.
- Stato di test condiviso di OpenClaw: usa `src/test-utils/openclaw-test-state.ts` da Vitest quando un test ha bisogno di `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture di config, workspace, directory agent o archivio auth-profile isolati.
- `pnpm test:env-mutations:report`: report non bloccante di test e harness che mutano direttamente `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` o chiavi env OpenClaw correlate. Usalo per trovare candidati alla migrazione verso l'helper condiviso test-state.
- E2E mockata della Control UI: usa `pnpm test:ui:e2e` per la lane Vitest + Playwright che avvia la Control UI Vite e pilota una pagina Chromium reale contro un Gateway WebSocket mockato. I test vivono in `ui/src/**/*.e2e.test.ts`; mock e controlli condivisi vivono in `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` include questa lane. Nei worktree Codex, preferisci `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` per una prova minima mirata dopo l'installazione delle dipendenze, oppure Testbox/Crabbox per prove GUI più ampie.
- Helper E2E di processo: usa `test/helpers/openclaw-test-instance.ts` quando un test E2E Vitest a livello di processo ha bisogno di un Gateway in esecuzione, env CLI, cattura dei log e cleanup in un unico punto.
- Test TUI PTY: usa `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` per la lane PTY rapida con backend finto. Usa `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` o `pnpm tui:pty:test:watch --mode local` per lo smoke più lento `tui --local`, che mocka solo l'endpoint del modello esterno. Asserisci testo visibile stabile o chiamate a fixture, non snapshot ANSI grezzi.
- Helper E2E Docker/Bash: le lane che fanno source di `scripts/lib/docker-e2e-image.sh` possono passare `docker_e2e_test_state_shell_b64 <label> <scenario>` nel container e decodificarlo con `scripts/lib/openclaw-e2e-instance.sh`; gli script multi-home possono passare `docker_e2e_test_state_function_b64` e chiamare `openclaw_test_state_create <label> <scenario>` in ogni flow. I chiamanti di livello inferiore possono usare `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` per uno snippet shell nel container, oppure `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` per un file env host sorgente. Il `--` prima di `create` impedisce ai runtime Node più recenti di trattare `--env-file` come un flag Node. Le lane Docker/Bash che avviano un Gateway possono fare source di `scripts/lib/openclaw-e2e-instance.sh` dentro il container per risoluzione dell'entrypoint, avvio mock OpenAI, lancio in foreground/background del Gateway, probe di readiness, export dell'env di stato, dump dei log e cleanup dei processi.
- Le esecuzioni shard full, extension e include-pattern aggiornano i dati di timing locali in `.artifacts/vitest-shard-timings.json`; le successive esecuzioni whole-config usano quei timing per bilanciare shard lenti e veloci. Gli shard CI include-pattern aggiungono il nome dello shard alla chiave di timing, mantenendo visibili i timing degli shard filtrati senza sostituire i dati di timing whole-config. Imposta `OPENCLAW_TEST_PROJECTS_TIMINGS=0` per ignorare l'artefatto di timing locale.
- I file di test `plugin-sdk` e `commands` selezionati ora passano attraverso lane leggere dedicate che mantengono solo `test/setup.ts`, lasciando i casi runtime-heavy nelle loro lane esistenti.
- I file sorgente con test sibling vengono mappati a quel sibling prima di ricadere in glob di directory più ampi. Le modifiche agli helper in `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` e `src/plugins/contracts` usano un grafo degli import locale per eseguire i test importatori invece di eseguire in modo ampio ogni shard quando il percorso della dipendenza è preciso.
- `auto-reply` ora si divide anche in tre config dedicate (`core`, `top-level`, `reply`), così l'harness reply non domina i test più leggeri di stato/token/helper top-level.
- La config Vitest di base ora usa per impostazione predefinita `pool: "threads"` e `isolate: false`, con il runner condiviso non isolato abilitato su tutte le config del repo.
- `pnpm test:channels` esegue `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` eseguono tutti gli shard extension/plugin. I plugin di canale pesanti, il plugin browser e OpenAI vengono eseguiti come shard dedicati; gli altri gruppi di plugin restano raggruppati. Usa `pnpm test extensions/<id>` per una lane di un singolo plugin bundled.
- `pnpm test:perf:imports`: abilita i report Vitest di durata degli import + breakdown degli import, continuando a usare il routing delle lane con ambito per target espliciti di file/directory.
- `pnpm test:perf:imports:changed`: stessa profilazione degli import, ma solo per i file modificati rispetto a `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` misura le prestazioni del percorso routed in modalità changed rispetto all'esecuzione nativa root-project per lo stesso diff git committato.
- `pnpm test:perf:changed:bench -- --worktree` misura le prestazioni del set di modifiche del worktree corrente senza richiedere prima un commit.
- `pnpm test:perf:profile:main`: scrive un profilo CPU per il main thread di Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: scrive profili CPU + heap per il runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: esegue serialmente ogni config leaf Vitest full-suite e scrive dati di durata raggruppati più artefatti JSON/log per config. Il Test Performance Agent lo usa come baseline prima di tentare fix per test lenti.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: confronta i report raggruppati dopo una modifica orientata alle prestazioni.
- `pnpm test:docker:timings <summary.json>` ispeziona le lane Docker lente dopo un'esecuzione Docker completa; usa `pnpm test:docker:rerun <run-id|summary.json|failures.json>` per stampare comandi di riesecuzione mirati ed economici dagli stessi artefatti.
- Integrazione Gateway: opt-in tramite `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: esegue l'aggregato E2E del repo: smoke test end-to-end del gateway più la lane E2E browser mockata della Control UI.
- `pnpm test:e2e:gateway`: esegue smoke test end-to-end del gateway (abbinamento multi-instance WS/HTTP/node). Usa per impostazione predefinita `threads` + `isolate: false` con worker adattivi in `vitest.e2e.config.ts`; regola con `OPENCLAW_E2E_WORKERS=<n>` e imposta `OPENCLAW_E2E_VERBOSE=1` per log verbosi.
- `pnpm test:live`: esegue test live dei provider (minimax/zai). Richiede chiavi API e `LIVE=1` (o `*_LIVE_TEST=1` specifico del provider) per non essere saltato.
- `pnpm test:docker:all`: crea l'immagine live-test condivisa, impacchetta OpenClaw una sola volta come tarball npm, crea/riusa un'immagine runner Node/Git essenziale più un'immagine funzionale che installa quel tarball in `/app`, quindi esegue le lane smoke Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` tramite uno scheduler ponderato. L'immagine essenziale (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) viene usata per le lane di installer/aggiornamento/dipendenze dei Plugin; queste lane montano il tarball precompilato invece di usare sorgenti del repo copiati. L'immagine funzionale (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) viene usata per le normali lane di funzionalità dell'app compilata. `scripts/package-openclaw-for-docker.mjs` è l'unico packer di pacchetti locale/CI e convalida il tarball più `dist/postinstall-inventory.json` prima che Docker lo consumi. Le definizioni delle lane Docker sono in `scripts/lib/docker-e2e-scenarios.mjs`; la logica del planner è in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` esegue il piano selezionato. `node scripts/test-docker-all.mjs --plan-json` emette il piano CI posseduto dallo scheduler per le lane selezionate, i tipi di immagine, le esigenze di pacchetto/immagine live, gli scenari di stato e i controlli delle credenziali senza creare o eseguire Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controlla gli slot di processo e per impostazione predefinita vale 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controlla il pool finale sensibile ai provider e per impostazione predefinita vale 10. I limiti delle lane pesanti sono predefiniti a `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; i limiti dei provider sono predefiniti a una lane pesante per provider tramite `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` e `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Usa `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` per host più grandi. Se una lane supera il limite effettivo di peso o risorsa su un host a basso parallelismo, può comunque partire da un pool vuoto ed eseguirsi da sola finché non rilascia capacità. Gli avvii delle lane sono scaglionati per impostazione predefinita di 2 secondi per evitare tempeste di creazione nel daemon Docker locale; sovrascrivi con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Il runner esegue per impostazione predefinita i preflight di Docker, pulisce i container E2E OpenClaw obsoleti, emette lo stato delle lane attive ogni 30 secondi, condivide le cache degli strumenti CLI dei provider tra lane compatibili, ritenta una volta per impostazione predefinita gli errori transitori dei provider live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) e archivia i tempi delle lane in `.artifacts/docker-tests/lane-timings.json` per l'ordinamento dal più lungo al più breve nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifest delle lane senza eseguire Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` per regolare l'output di stato oppure `OPENCLAW_DOCKER_ALL_TIMINGS=0` per disabilitare il riuso dei tempi. Usa `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` solo per lane deterministiche/locali oppure `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` solo per lane con provider live; gli alias dei pacchetti sono `pnpm test:docker:local:all` e `pnpm test:docker:live:all`. La modalità solo-live unisce le lane live principali e finali in un unico pool ordinato dal più lungo al più breve, così i bucket dei provider possono raggruppare insieme il lavoro Claude, Codex e Gemini. Il runner smette di pianificare nuove lane in pool dopo il primo errore, a meno che non sia impostato `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, e ogni lane ha un timeout di fallback di 120 minuti sovrascrivibile con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; le lane live/finali selezionate usano limiti per-lane più stretti. I comandi di configurazione Docker del backend CLI hanno il proprio timeout tramite `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (predefinito 180). I log per-lane, `summary.json`, `failures.json` e i tempi delle fasi vengono scritti sotto `.artifacts/docker-tests/<run-id>/`; usa `pnpm test:docker:timings <summary.json>` per ispezionare le lane lente e `pnpm test:docker:rerun <run-id|summary.json|failures.json>` per stampare comandi di riesecuzione mirati ed economici.
- `pnpm test:docker:browser-cdp-snapshot`: crea un container E2E sorgente basato su Chromium, avvia CDP grezzo più un Gateway isolato, esegue `browser doctor --deep` e verifica che gli snapshot dei ruoli CDP includano URL dei link, elementi cliccabili promossi dal cursore, riferimenti iframe e metadati dei frame.
- `pnpm test:docker:skill-install`: installa il tarball OpenClaw impacchettato in un runner Docker essenziale, disabilita `skills.install.allowUploadedArchives`, risolve uno slug di skill corrente dalla ricerca live di ClawHub, lo installa tramite `openclaw skills install` e verifica `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` e `skills info --json`.
- Le probe Docker live del backend CLI possono essere eseguite come lane focalizzate, ad esempio `pnpm test:docker:live-cli-backend:claude`, `pnpm test:docker:live-cli-backend:claude:resume` o `pnpm test:docker:live-cli-backend:claude:mcp`. Gemini ha alias `:resume` e `:mcp` corrispondenti.
- `pnpm test:docker:openwebui`: avvia OpenClaw + Open WebUI in Docker, accede tramite Open WebUI, controlla `/api/models`, quindi esegue una vera chat proxata tramite `/api/chat/completions`. Richiede una chiave di modello live utilizzabile, scarica un'immagine esterna di Open WebUI e non ci si aspetta che sia stabile in CI come le normali suite unit/e2e.
- `pnpm test:docker:mcp-channels`: avvia un container Gateway inizializzato e un secondo container client che genera `openclaw mcp serve`, quindi verifica la scoperta delle conversazioni instradate, le letture delle trascrizioni, i metadati degli allegati, il comportamento della coda di eventi live, l'instradamento degli invii in uscita e le notifiche di canale + autorizzazione in stile Claude sul bridge stdio reale. L'asserzione della notifica Claude legge direttamente i frame MCP stdio grezzi, così lo smoke riflette ciò che il bridge emette effettivamente.
- `pnpm test:docker:upgrade-survivor`: installa il tarball OpenClaw impacchettato sopra una fixture sporca di un vecchio utente, esegue l'aggiornamento del pacchetto più doctor non interattivo senza chiavi di provider o canale live, quindi avvia un Gateway loopback e controlla che agenti, configurazione del canale, allowlist dei Plugin, file di workspace/sessione, stato obsoleto delle dipendenze dei Plugin legacy, avvio e stato RPC sopravvivano.
- `pnpm test:docker:published-upgrade-survivor`: installa `openclaw@latest` per impostazione predefinita, inizializza file realistici di un utente esistente senza chiavi di provider o canale live, configura quella baseline con una ricetta predefinita di comandi `openclaw config set`, aggiorna quell'installazione pubblicata al tarball OpenClaw impacchettato, esegue doctor non interattivo, scrive `.artifacts/upgrade-survivor/summary.json`, quindi avvia un Gateway loopback e controlla che intent configurati, file di workspace/sessione, configurazione obsoleta dei Plugin e stato legacy delle dipendenze, avvio, `/healthz`, `/readyz` e stato RPC sopravvivano o vengano riparati in modo pulito. Sovrascrivi una baseline con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, espandi una matrice locale esatta con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` come `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, oppure aggiungi fixture di scenario con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; l'insieme reported-issues include `configured-plugin-installs` per verificare che i Plugin OpenClaw esterni configurati si installino automaticamente durante l'aggiornamento e `stale-source-plugin-shadow` per impedire che shadow di Plugin solo-sorgente interrompano l'avvio. Package Acceptance espone questi elementi come `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`, e risolve token di baseline meta come `last-stable-4` o `all-since-2026.4.23` prima di passare specifiche di pacchetto esatte alle lane Docker.
- `pnpm test:docker:update-migration`: esegue l'harness published-upgrade survivor nello scenario `plugin-deps-cleanup`, intensivo nella pulizia, partendo da `openclaw@2026.4.23` per impostazione predefinita. Il workflow separato `Update Migration` espande questa lane con `baselines=all-since-2026.4.23`, così ogni pacchetto stabile pubblicato dalla `.23` in avanti si aggiorna al candidato e dimostra la pulizia delle dipendenze dei Plugin configurati fuori dalla CI Full Release.
- `pnpm test:docker:plugins`: esegue smoke di installazione/aggiornamento per percorso locale, `file:`, pacchetti del registro npm con dipendenze hoistate, riferimenti git mobili, fixture ClawHub, aggiornamenti del marketplace e abilitazione/ispezione del bundle Claude.

## Gate PR locale

Per i controlli locali di landing/gate delle PR, esegui:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` presenta flake su un host carico, rieseguilo una volta prima di trattarlo come una regressione, poi isola con `pnpm test <path/to/test>`. Per host con memoria limitata, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark latenza modello (chiavi locali)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- Env opzionali: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predefinito: "Rispondi con una sola parola: ok. Nessuna punteggiatura o testo aggiuntivo."

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

Preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: entrambi i preset

L'output include `sampleCount`, media, p50, p95, min/max, distribuzione exit-code/segnale e riepiloghi RSS max per ogni comando. Gli opzionali `--cpu-prof-dir` / `--heap-prof-dir` scrivono profili V8 per ogni esecuzione, così temporizzazione e acquisizione dei profili usano lo stesso harness.

Convenzioni dell'output salvato:

- `pnpm test:startup:bench:smoke` scrive l'artefatto smoke mirato in `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` scrive l'artefatto della suite completa in `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` aggiorna la fixture baseline versionata in `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionata:

- `test/fixtures/cli-startup-bench.json`
- Aggiorna con `pnpm test:startup:bench:update`
- Confronta i risultati correnti con la fixture usando `pnpm test:startup:bench:check`

## Benchmark avvio Gateway

Script: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

Il benchmark usa per impostazione predefinita l'entry CLI compilato in `dist/entry.js`; esegui
`pnpm build` prima di usare i comandi package-script. Per misurare invece il runner sorgente, passa `--entry scripts/run-node.mjs` e mantieni quei risultati separati dalle baseline dell'entry compilato.

Uso:

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

ID dei casi:

- `default`: avvio normale del Gateway.
- `skipChannels`: avvio del Gateway con avvio dei canali saltato.
- `oneInternalHook`: un hook interno configurato.
- `allInternalHooks`: tutti gli hook interni.
- `fiftyPlugins`: 50 Plugin manifest.
- `fiftyStartupLazyPlugins`: 50 Plugin manifest startup-lazy.

L'output include il primo output del processo, `/healthz`, `/readyz`, tempo del log di ascolto HTTP,
tempo del log di Gateway pronto, tempo CPU, rapporto core CPU, RSS max, heap, metriche di startup trace, ritardo dell'event-loop e metriche di dettaglio della tabella di lookup dei Plugin. Lo script abilita `OPENCLAW_GATEWAY_STARTUP_TRACE=1` nell'ambiente del Gateway figlio.

Leggi `/healthz` come liveness: il server HTTP può rispondere. Leggi `/readyz` come prontezza utilizzabile: sidecar Plugin di avvio, canali e lavoro post-attach ready-critical si sono stabilizzati. Gli hook di avvio del Gateway vengono dispatchati in modo asincrono e non fanno parte della garanzia di prontezza. Il tempo del log di pronto è il timestamp interno del log di pronto del Gateway; è utile per l'attribuzione lato processo, ma non sostituisce il probe esterno `/readyz`.

Usa l'output JSON o `--output` quando confronti modifiche. Usa `--cpu-prof-dir` solo dopo che l'output di trace punta a import, compilazione o lavoro vincolato dalla CPU che non può essere spiegato dai soli tempi di fase. Non confrontare i risultati del runner sorgente con i risultati di `dist/entry.js` compilato come se fossero la stessa baseline.

## Benchmark riavvio Gateway

Script: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

Il benchmark di riavvio è supportato solo su macOS e Linux. Usa SIGUSR1 per i riavvii in-process e fallisce immediatamente su Windows.

Il benchmark usa per impostazione predefinita l'entry CLI compilato in `dist/entry.js`; esegui
`pnpm build` prima di usare i comandi package-script. Per misurare invece il runner sorgente, passa `--entry scripts/run-node.mjs` e mantieni quei risultati separati dalle baseline dell'entry compilato.

Uso:

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

ID dei casi:

- `skipChannels`: riavvio con canali saltati.
- `skipChannelsAcpxProbe`: riavvio con canali saltati e probe di avvio ACPX attivo.
- `skipChannelsNoAcpxProbe`: riavvio con canali saltati e probe di avvio ACPX disattivato.
- `default`: riavvio normale.
- `fiftyPlugins`: riavvio con 50 Plugin manifest.

L'output include il successivo `/healthz`, il successivo `/readyz`, downtime, timing di pronto del riavvio,
CPU, RSS, metriche di startup trace per il processo sostitutivo e metriche di restart trace per gestione del segnale, drain del lavoro attivo, fasi di chiusura, avvio successivo, timing di pronto e snapshot di memoria. Lo script abilita
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` e `OPENCLAW_GATEWAY_RESTART_TRACE=1` nell'ambiente del Gateway figlio.

Usa questo benchmark quando una modifica tocca segnalazione di riavvio, handler di chiusura,
startup-after-restart, arresto dei sidecar, handoff del servizio o prontezza dopo il riavvio. Inizia con `skipChannels` quando isoli la meccanica del Gateway dall'avvio dei canali. Usa `default` o casi con molti Plugin solo dopo che il caso ristretto spiega il percorso di riavvio.

Le metriche di trace sono indizi di attribuzione, non verdetti. Una modifica al riavvio deve essere valutata da più campioni, dallo span owner corrispondente, dal comportamento di `/healthz` e `/readyz` e dal contratto di riavvio visibile all'utente.

## Onboarding E2E (Docker)

Docker è opzionale; serve solo per smoke test di onboarding containerizzati.

Flusso completo di cold-start in un container Linux pulito:

```bash
scripts/e2e/onboard-docker.sh
```

Questo script guida il wizard interattivo tramite una pseudo-tty, verifica i file di configurazione/workspace/sessione, poi avvia il Gateway ed esegue `openclaw health`.

## Smoke import QR (Docker)

Garantisce che l'helper runtime QR mantenuto si carichi nei runtime Docker Node supportati (Node 24 predefinito, Node 22 compatibile):

```bash
pnpm test:docker:qr
```

## Correlati

- [Testing](/it/help/testing)
- [Testing live](/it/help/testing-live)
- [Testing updates and plugins](/it/help/testing-updates-plugins)
