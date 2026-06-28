---
read_when:
    - Esecuzione o correzione dei test
summary: Come eseguire i test localmente (vitest) e quando usare le modalità force/coverage
title: Test
x-i18n:
    generated_at: "2026-06-28T00:13:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d1aed76ed59713ee320eb2d18dc8c392ea7a810096a0ef3131388001bbe5d8d
    source_path: reference/test.md
    workflow: 16
---

- Kit completo di test (suite, live, Docker): [Testing](/it/help/testing)
- Validazione degli aggiornamenti e dei pacchetti Plugin: [Testing updates and plugins](/it/help/testing-updates-plugins)

- Ordine abituale dei test locali:
  1. `pnpm test:changed` per una prova Vitest nell'ambito modificato.
  2. `pnpm test <path-or-filter>` per un file, una directory o un target esplicito.
  3. `pnpm test` solo quando serve intenzionalmente l'intera suite Vitest locale.
- `pnpm test:force`: termina qualsiasi processo Gateway rimasto in esecuzione che occupi la porta di controllo predefinita, quindi esegue l'intera suite Vitest con una porta Gateway isolata, così i test del server non entrano in conflitto con un'istanza in esecuzione. Usalo quando una precedente esecuzione del Gateway ha lasciato occupata la porta 18789.
- `pnpm test:coverage`: esegue la suite unit con copertura V8 (tramite `vitest.unit.config.ts`). È un gate di copertura della lane unit predefinita, non una copertura di tutti i file dell'intero repository. Le soglie sono 70% per righe/funzioni/istruzioni e 55% per i rami. Poiché `coverage.all` è false e la lane predefinita limita gli include di copertura ai test unit non fast con file sorgente sibling, il gate misura il sorgente di proprietà di questa lane invece di ogni import transitivo che capita di caricare.
- `pnpm test:coverage:changed`: esegue la copertura unit solo per i file modificati da `origin/main`.
- `pnpm test:changed`: esecuzione di test modificati smart ed economica. Esegue target precisi da modifiche dirette ai test, file sibling `*.test.ts`, mapping espliciti del sorgente e grafo di import locale. Le modifiche ampie a config/package vengono saltate a meno che non si mappino a test precisi.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: esecuzione esplicita ampia dei test modificati. Usalo quando una modifica a harness/config/package dei test deve ricadere sul comportamento più ampio di Vitest per i test modificati.
- `pnpm changed:lanes`: mostra le lane architetturali attivate dal diff rispetto a `origin/main`.
- `pnpm check:changed`: delega a Crabbox/Testbox per impostazione predefinita fuori dalla CI, poi esegue il gate di controllo smart delle modifiche per il diff rispetto a `origin/main` dentro il child remoto. Esegue typecheck, lint e comandi di guardia per le lane architetturali interessate, ma non esegue test Vitest. Usa `pnpm test:changed` o `pnpm test <target>` esplicito per la prova dei test.
- Worktree Codex e checkout collegati/sparsi: evita `pnpm test*`, `pnpm check*` e `pnpm crabbox:run` locali diretti a meno che tu abbia verificato che pnpm non riconcilierà le dipendenze. Per una prova minuscola su file esplicito usa `node scripts/run-vitest.mjs <path-or-filter>`; per gate sulle modifiche o prove ampie usa `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` così pnpm viene eseguito dentro Testbox.
- Prova Testbox tramite Crabbox: usa l'`exitCode` finale del wrapper e il JSON dei tempi come risultato del comando. L'esecuzione delegata di Blacksmith GitHub Actions può mostrare `cancelled` dopo un comando SSH riuscito perché la Testbox viene fermata dall'esterno dell'azione keepalive; verifica il riepilogo del wrapper e l'output del comando prima di considerarlo un errore di test.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: mantiene la serializzazione degli heavy-check dentro il worktree corrente invece che nella directory Git comune per comandi come `pnpm check:changed` e `pnpm test ...` mirati. Usalo solo su host locali ad alta capacità quando esegui intenzionalmente controlli indipendenti su worktree collegati.
- `pnpm test`: instrada target espliciti di file/directory attraverso lane Vitest con ambito. Le esecuzioni senza target sono prove dell'intera suite: usano gruppi di shard fissi, si espandono in config leaf per l'esecuzione parallela locale e stampano il fanout degli shard locali previsto prima dell'avvio. Il gruppo delle estensioni si espande sempre nelle config shard per estensione invece che in un unico enorme processo root-project.
- Le esecuzioni del wrapper di test terminano con un breve riepilogo `[test] passed|failed|skipped ... in ...`. La riga di durata propria di Vitest resta il dettaglio per shard.
- Stato dei test OpenClaw condiviso: usa `src/test-utils/openclaw-test-state.ts` da Vitest quando un test necessita di `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture di configurazione, workspace, directory agente o archivio auth-profile isolati.
- `pnpm test:env-mutations:report`: report non bloccante di test e harness che mutano direttamente `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` o chiavi env OpenClaw correlate. Usalo per trovare candidati alla migrazione all'helper condiviso test-state.
- E2E mockata della Control UI: usa `pnpm test:ui:e2e` per la lane Vitest + Playwright che avvia la Control UI Vite e guida una vera pagina Chromium contro un Gateway WebSocket mockato. I test si trovano in `ui/src/**/*.e2e.test.ts`; mock e controlli condivisi si trovano in `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` include questa lane. Nei worktree Codex, preferisci `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` per una prova minuscola e mirata dopo l'installazione delle dipendenze, oppure Testbox/Crabbox per prove GUI più ampie.
- Helper E2E di processo: usa `test/helpers/openclaw-test-instance.ts` quando un test E2E a livello di processo Vitest necessita di un Gateway in esecuzione, env CLI, cattura dei log e cleanup in un unico punto.
- Test TUI PTY: usa `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` per la lane PTY veloce con backend fake. Usa `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` o `pnpm tui:pty:test:watch --mode local` per lo smoke più lento `tui --local`, che mocka solo l'endpoint del modello esterno. Asserisci testo visibile stabile o chiamate fixture, non snapshot ANSI grezzi.
- Helper E2E Docker/Bash: le lane che fanno source di `scripts/lib/docker-e2e-image.sh` possono passare `docker_e2e_test_state_shell_b64 <label> <scenario>` nel container e decodificarlo con `scripts/lib/openclaw-e2e-instance.sh`; gli script multi-home possono passare `docker_e2e_test_state_function_b64` e chiamare `openclaw_test_state_create <label> <scenario>` in ogni flow. I chiamanti di livello inferiore possono usare `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` per uno snippet shell nel container, oppure `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` per un file env host caricabile con source. Il `--` prima di `create` impedisce ai runtime Node più recenti di trattare `--env-file` come flag Node. Le lane Docker/Bash che avviano un Gateway possono fare source di `scripts/lib/openclaw-e2e-instance.sh` dentro il container per risoluzione dell'entrypoint, avvio mock OpenAI, lancio Gateway in foreground/background, probe di readiness, esportazione env di stato, dump dei log e cleanup dei processi.
- Le esecuzioni shard full, extension e include-pattern aggiornano i dati locali dei tempi in `.artifacts/vitest-shard-timings.json`; le successive esecuzioni whole-config usano quei tempi per bilanciare shard lenti e veloci. Gli shard CI include-pattern aggiungono il nome dello shard alla chiave dei tempi, mantenendo visibili i tempi degli shard filtrati senza sostituire i dati dei tempi whole-config. Imposta `OPENCLAW_TEST_PROJECTS_TIMINGS=0` per ignorare l'artefatto locale dei tempi.
- File di test `plugin-sdk` e `commands` selezionati ora passano attraverso lane leggere dedicate che mantengono solo `test/setup.ts`, lasciando i casi runtime-heavy sulle lane esistenti.
- I file sorgente con test sibling si mappano a quel sibling prima di ricadere su glob di directory più ampi. Le modifiche agli helper sotto `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` e `src/plugins/contracts` usano un grafo di import locale per eseguire i test che li importano invece di avviare ampiamente ogni shard quando il percorso della dipendenza è preciso.
- `auto-reply` ora si divide anche in tre config dedicate (`core`, `top-level`, `reply`) così l'harness delle risposte non domina i test più leggeri di stato/token/helper top-level.
- La config Vitest di base ora usa per impostazione predefinita `pool: "threads"` e `isolate: false`, con il runner condiviso non isolato abilitato nelle config del repository.
- `pnpm test:channels` esegue `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` eseguono tutti gli shard delle estensioni/Plugin. I Plugin di canale pesanti, il Plugin browser e OpenAI vengono eseguiti come shard dedicati; gli altri gruppi di Plugin restano in batch. Usa `pnpm test extensions/<id>` per una lane di un solo Plugin bundled.
- `pnpm test:perf:imports`: abilita la reportistica di Vitest su durata degli import + scomposizione degli import, continuando a usare l'instradamento per lane con ambito per target espliciti di file/directory.
- `pnpm test:perf:imports:changed`: stessa profilazione degli import, ma solo per i file modificati da `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` misura il percorso changed-mode instradato rispetto all'esecuzione nativa root-project per lo stesso diff Git committato.
- `pnpm test:perf:changed:bench -- --worktree` misura il set di modifiche del worktree corrente senza eseguire prima un commit.
- `pnpm test:perf:profile:main`: scrive un profilo CPU per il thread principale di Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: scrive profili CPU + heap per il runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: esegue serialmente ogni config leaf Vitest della suite completa e scrive dati di durata raggruppati più artefatti JSON/log per config. Il Test Performance Agent usa questo come baseline prima di tentare correzioni dei test lenti.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: confronta i report raggruppati dopo una modifica focalizzata sulle prestazioni.
- `pnpm test:docker:timings <summary.json>` ispeziona lane Docker lente dopo un'esecuzione Docker all; usa `pnpm test:docker:rerun <run-id|summary.json|failures.json>` per stampare comandi di riesecuzione mirati ed economici dagli stessi artefatti.
- Integrazione Gateway: opt-in tramite `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: esegue l'aggregato E2E del repository: smoke test end-to-end del Gateway più la lane E2E browser mockata della Control UI.
- `pnpm test:e2e:gateway`: esegue smoke test end-to-end del Gateway (accoppiamento multi-istanza WS/HTTP/node). Usa per impostazione predefinita `threads` + `isolate: false` con worker adattivi in `vitest.e2e.config.ts`; regola con `OPENCLAW_E2E_WORKERS=<n>` e imposta `OPENCLAW_E2E_VERBOSE=1` per log verbosi.
- `pnpm test:live`: esegue test live dei provider (minimax/zai). Richiede chiavi API e `LIVE=1` (o `*_LIVE_TEST=1` specifico del provider) per non essere saltato.
- `pnpm test:docker:all`: compila l'immagine condivisa per i live test, impacchetta OpenClaw una sola volta come tarball npm, compila/riusa un'immagine runner Node/Git essenziale più un'immagine funzionale che installa quel tarball in `/app`, quindi esegue le corsie di smoke Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` tramite uno scheduler ponderato. L'immagine essenziale (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) è usata per le corsie installer/update/plugin-dependency; queste corsie montano il tarball precompilato invece di usare i sorgenti del repo copiati. L'immagine funzionale (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) è usata per le normali corsie di funzionalità dell'app compilata. `scripts/package-openclaw-for-docker.mjs` è l'unico packer locale/CI del pacchetto e convalida il tarball più `dist/postinstall-inventory.json` prima che Docker lo consumi. Le definizioni delle corsie Docker vivono in `scripts/lib/docker-e2e-scenarios.mjs`; la logica del planner vive in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` esegue il piano selezionato. `node scripts/test-docker-all.mjs --plan-json` emette il piano CI di proprietà dello scheduler per corsie selezionate, tipi di immagine, esigenze di package/live-image, scenari di stato e controlli delle credenziali senza compilare o eseguire Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controlla gli slot di processo e il valore predefinito è 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controlla il pool tail sensibile al provider e il valore predefinito è 10. I limiti delle corsie pesanti hanno come valore predefinito `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; i limiti dei provider hanno come valore predefinito una corsia pesante per provider tramite `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` e `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Usa `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` per host più grandi. Se una corsia supera il limite effettivo di peso o risorse su un host a basso parallelismo, può comunque partire da un pool vuoto e verrà eseguita da sola finché non rilascia capacità. Gli avvii delle corsie sono scaglionati di 2 secondi per impostazione predefinita per evitare tempeste di creazione nel daemon Docker locale; sovrascrivi con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Il runner esegue i preflight Docker per impostazione predefinita, pulisce i container E2E OpenClaw obsoleti, emette lo stato delle corsie attive ogni 30 secondi, condivide le cache degli strumenti CLI dei provider tra corsie compatibili, ritenta una volta per impostazione predefinita gli errori transitori dei live provider (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) e salva i tempi delle corsie in `.artifacts/docker-tests/lane-timings.json` per l'ordinamento dal più lungo al più breve nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifest delle corsie senza eseguire Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` per regolare l'output di stato, oppure `OPENCLAW_DOCKER_ALL_TIMINGS=0` per disabilitare il riuso dei tempi. Usa `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` solo per corsie deterministiche/locali oppure `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` solo per corsie live-provider; gli alias del pacchetto sono `pnpm test:docker:local:all` e `pnpm test:docker:live:all`. La modalità solo-live unisce le corsie live main e tail in un unico pool dal più lungo al più breve, così i bucket dei provider possono raggruppare insieme il lavoro Claude, Codex e Gemini. Il runner interrompe la pianificazione di nuove corsie in pool dopo il primo errore, a meno che non sia impostato `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, e ogni corsia ha un timeout di fallback di 120 minuti sovrascrivibile con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; alcune corsie live/tail selezionate usano limiti per-corsia più stretti. I comandi di configurazione Docker del backend CLI hanno il proprio timeout tramite `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (predefinito 180). Log per-corsia, `summary.json`, `failures.json` e tempi delle fasi sono scritti sotto `.artifacts/docker-tests/<run-id>/`; usa `pnpm test:docker:timings <summary.json>` per ispezionare le corsie lente e `pnpm test:docker:rerun <run-id|summary.json|failures.json>` per stampare comandi di riesecuzione mirati ed economici.
- `pnpm test:docker:browser-cdp-snapshot`: compila un container E2E sorgente basato su Chromium, avvia CDP raw più un Gateway isolato, esegue `browser doctor --deep` e verifica che gli snapshot dei ruoli CDP includano URL dei link, elementi cliccabili promossi dal cursore, riferimenti iframe e metadati dei frame.
- `pnpm test:docker:skill-install`: installa il tarball OpenClaw impacchettato in un runner Docker essenziale, disabilita `skills.install.allowUploadedArchives`, risolve uno slug di skill corrente dalla ricerca live di ClawHub, lo installa tramite `openclaw skills install` e verifica `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` e `skills info --json`.
- Le sonde Docker live del backend CLI possono essere eseguite come corsie mirate, per esempio `pnpm test:docker:live-cli-backend:claude`, `pnpm test:docker:live-cli-backend:claude:resume` o `pnpm test:docker:live-cli-backend:claude:mcp`. Gemini ha alias `:resume` e `:mcp` corrispondenti.
- `pnpm test:docker:openwebui`: avvia OpenClaw + Open WebUI in Docker, effettua l'accesso tramite Open WebUI, controlla `/api/models`, quindi esegue una vera chat proxata tramite `/api/chat/completions`. Richiede una chiave di modello live utilizzabile, scarica un'immagine Open WebUI esterna e non ci si aspetta che sia stabile in CI come le normali suite unit/e2e.
- `pnpm test:docker:mcp-channels`: avvia un container Gateway con seed e un secondo container client che genera `openclaw mcp serve`, quindi verifica discovery delle conversazioni instradate, letture dei transcript, metadati degli allegati, comportamento della coda di eventi live, instradamento degli invii in uscita e notifiche di canale + permessi in stile Claude sul vero bridge stdio. L'asserzione della notifica Claude legge direttamente i frame MCP stdio raw, così lo smoke riflette ciò che il bridge emette realmente.
- `pnpm test:docker:upgrade-survivor`: installa il tarball OpenClaw impacchettato sopra una fixture sporca di vecchio utente, esegue l'aggiornamento del pacchetto più doctor non interattivo senza chiavi live provider o canale, quindi avvia un Gateway loopback e controlla che agenti, configurazione dei canali, allowlist dei plugin, file workspace/sessione, stato obsoleto delle dipendenze dei plugin legacy, avvio e stato RPC sopravvivano.
- `pnpm test:docker:published-upgrade-survivor`: installa `openclaw@latest` per impostazione predefinita, prepara file realistici di utente esistente senza chiavi live provider o canale, configura quella baseline con una ricetta integrata del comando `openclaw config set`, aggiorna quell'installazione pubblicata al tarball OpenClaw impacchettato, esegue doctor non interattivo, scrive `.artifacts/upgrade-survivor/summary.json`, quindi avvia un Gateway loopback e controlla che intenti configurati, file workspace/sessione, configurazione obsoleta dei plugin e stato delle dipendenze legacy, avvio, `/healthz`, `/readyz` e stato RPC sopravvivano o vengano riparati correttamente. Sovrascrivi una baseline con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, espandi una matrice locale esatta con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` come `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, oppure aggiungi fixture di scenario con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; l'insieme reported-issues include `configured-plugin-installs` per verificare che i Plugin OpenClaw esterni configurati vengano installati automaticamente durante l'aggiornamento e `stale-source-plugin-shadow` per impedire che shadow di plugin solo-sorgente interrompano l'avvio. Package Acceptance espone questi valori come `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`, e risolve token meta baseline come `last-stable-4` o `all-since-2026.4.23` prima di passare specifiche esatte dei pacchetti alle corsie Docker.
- `pnpm test:docker:update-migration`: esegue l'harness published-upgrade survivor nello scenario con pulizia intensiva `plugin-deps-cleanup`, partendo da `openclaw@2026.4.23` per impostazione predefinita. Il workflow separato `Update Migration` espande questa corsia con `baselines=all-since-2026.4.23` così ogni pacchetto stabile pubblicato dalla `.23` in poi viene aggiornato al candidato e prova la pulizia delle dipendenze dei plugin configurati al di fuori della Full Release CI.
- `pnpm test:docker:plugins`: esegue smoke di install/update per percorso locale, `file:`, pacchetti del registro npm con dipendenze hoisted, riferimenti git mobili, fixture ClawHub, aggiornamenti del marketplace e abilitazione/ispezione del bundle Claude.

## Gate PR locale

Per i controlli locali di land/gate PR, esegui:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` presenta flake su un host carico, rieseguilo una volta prima di considerarlo una regressione, poi isola con `pnpm test <path/to/test>`. Per host con memoria limitata, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Bench latenza modello (chiavi locali)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- Env opzionali: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predefinito: "Rispondi con una sola parola: ok. Senza punteggiatura o testo aggiuntivo."

Ultima esecuzione (2025-12-31, 20 esecuzioni):

- mediana minimax 1279 ms (min 1114, max 2431)
- mediana opus 2454 ms (min 1224, max 3170)

## Bench avvio CLI

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

L'output include `sampleCount`, media, p50, p95, min/max, distribuzione exit-code/signal e riepiloghi RSS max per ogni comando. L'opzione facoltativa `--cpu-prof-dir` / `--heap-prof-dir` scrive i profili V8 per ogni esecuzione, così la temporizzazione e l'acquisizione dei profili usano lo stesso harness.

Convenzioni dell'output salvato:

- `pnpm test:startup:bench:smoke` scrive l'artefatto smoke mirato in `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` scrive l'artefatto della suite completa in `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` aggiorna la fixture baseline registrata in `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture registrata:

- `test/fixtures/cli-startup-bench.json`
- Aggiorna con `pnpm test:startup:bench:update`
- Confronta i risultati correnti con la fixture usando `pnpm test:startup:bench:check`

## Bench avvio Gateway

Script: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

Il benchmark usa per impostazione predefinita l'entry CLI compilata in `dist/entry.js`; esegui
`pnpm build` prima di usare i comandi package-script. Per misurare invece il runner sorgente, passa `--entry scripts/run-node.mjs` e tieni quei risultati separati dalle baseline dell'entry compilata.

Uso:

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

ID dei casi:

- `default`: avvio Gateway normale.
- `skipChannels`: avvio Gateway con avvio dei canali saltato.
- `oneInternalHook`: un hook interno configurato.
- `allInternalHooks`: tutti gli hook interni.
- `fiftyPlugins`: 50 Plugin manifest.
- `fiftyStartupLazyPlugins`: 50 Plugin manifest startup-lazy.

L'output include il primo output del processo, `/healthz`, `/readyz`, tempo del log di ascolto HTTP,
tempo del log di Gateway pronto, tempo CPU, rapporto core CPU, RSS max, heap, metriche di traccia di avvio, ritardo dell'event-loop e metriche di dettaglio della tabella di lookup dei Plugin. Lo script abilita `OPENCLAW_GATEWAY_STARTUP_TRACE=1` nell'ambiente del Gateway figlio.

Leggi `/healthz` come liveness: il server HTTP può rispondere. Leggi `/readyz` come readiness utilizzabile: sidecar dei Plugin di avvio, canali e lavoro post-attach critico per la readiness si sono stabilizzati. Gli hook di avvio Gateway vengono distribuiti in modo asincrono e non fanno parte della garanzia di readiness. Il tempo del log ready è il timestamp del log ready interno del Gateway; è utile per l'attribuzione lato processo, ma non sostituisce il probe esterno `/readyz`.

Usa l'output JSON o `--output` quando confronti modifiche. Usa `--cpu-prof-dir` solo dopo che l'output di traccia indica import, compilazione o lavoro vincolato dalla CPU che non può essere spiegato solo dalle temporizzazioni di fase. Non confrontare i risultati del runner sorgente con i risultati compilati di `dist/entry.js` come se fossero la stessa baseline.

## Bench riavvio Gateway

Script: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

Il benchmark di riavvio è supportato solo su macOS e Linux. Usa SIGUSR1 per i riavvii in-process e fallisce immediatamente su Windows.

Il benchmark usa per impostazione predefinita l'entry CLI compilata in `dist/entry.js`; esegui
`pnpm build` prima di usare i comandi package-script. Per misurare invece il runner sorgente, passa `--entry scripts/run-node.mjs` e tieni quei risultati separati dalle baseline dell'entry compilata.

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

L'output include il prossimo `/healthz`, il prossimo `/readyz`, downtime, tempistica di restart ready,
CPU, RSS, metriche di traccia di avvio per il processo sostitutivo e metriche di traccia di riavvio per gestione del segnale, svuotamento del lavoro attivo, fasi di chiusura, avvio successivo, tempistica ready e snapshot di memoria. Lo script abilita
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` e `OPENCLAW_GATEWAY_RESTART_TRACE=1` nell'ambiente del Gateway figlio.

Usa questo benchmark quando una modifica tocca segnalazione di riavvio, handler di chiusura,
startup-after-restart, arresto dei sidecar, handoff del servizio o readiness dopo il riavvio. Inizia con `skipChannels` quando isoli la meccanica del Gateway dall'avvio dei canali. Usa `default` o casi con molti Plugin solo dopo che il caso stretto spiega il percorso di riavvio.

Le metriche di traccia sono indizi di attribuzione, non verdetti. Una modifica di riavvio deve essere giudicata da più campioni, dallo span owner corrispondente, dal comportamento di `/healthz` e `/readyz` e dal contratto di riavvio visibile all'utente.

## E2E onboarding (Docker)

Docker è opzionale; serve solo per gli smoke test di onboarding containerizzati.

Flusso cold-start completo in un container Linux pulito:

```bash
scripts/e2e/onboard-docker.sh
```

Questo script guida la procedura guidata interattiva tramite una pseudo-tty, verifica i file di configurazione/workspace/sessione, quindi avvia il Gateway ed esegue `openclaw health`.

## Smoke import QR (Docker)

Assicura che l'helper runtime QR mantenuto venga caricato nei runtime Docker Node supportati (Node 24 predefinito, Node 22 compatibile):

```bash
pnpm test:docker:qr
```

## Correlati

- [Testing](/it/help/testing)
- [Testing live](/it/help/testing-live)
- [Testing updates and plugins](/it/help/testing-updates-plugins)
