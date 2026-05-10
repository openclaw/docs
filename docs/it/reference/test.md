---
read_when:
    - Esecuzione o correzione dei test
summary: Come eseguire i test localmente (vitest) e quando usare le modalità forzata/copertura
title: Test
x-i18n:
    generated_at: "2026-05-10T19:51:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: be939951f186df407aca8b3e4abbdbbd50f2f87c538c28c91745f9c6833df0d7
    source_path: reference/test.md
    workflow: 16
---

- Kit di test completo (suite, dal vivo, Docker): [Test](/it/help/testing)
- Convalida degli aggiornamenti e dei pacchetti Plugin: [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins)

- `pnpm test:force`: termina qualsiasi processo Gateway residuo che occupa la porta di controllo predefinita, quindi esegue l'intera suite Vitest con una porta Gateway isolata, così i test del server non entrano in conflitto con un'istanza in esecuzione. Usalo quando una precedente esecuzione del Gateway ha lasciato occupata la porta 18789.
- `pnpm test:coverage`: esegue la suite di unit test con copertura V8 (tramite `vitest.unit.config.ts`). Questo è un gate di copertura della corsia unit predefinita, non una copertura whole-repo all-file. Le soglie sono 70% per righe/funzioni/istruzioni e 55% per rami. Poiché `coverage.all` è falso e la corsia predefinita limita gli include della copertura ai test unitari non rapidi con file sorgente sibling, il gate misura il sorgente posseduto da questa corsia invece di ogni importazione transitiva che capita di caricare.
- `pnpm test:coverage:changed`: esegue la copertura unitaria solo per i file modificati da `origin/main`.
- `pnpm test:changed`: esecuzione economica e intelligente dei test modificati. Esegue target precisi da modifiche dirette ai test, file sibling `*.test.ts`, mappature esplicite del sorgente e il grafo di importazione locale. Le modifiche broad/config/package vengono saltate a meno che non si mappino a test precisi.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: esecuzione broad esplicita dei test modificati. Usala quando una modifica a test harness/config/package deve ricadere sul comportamento più ampio di Vitest per i test modificati.
- `pnpm changed:lanes`: mostra le corsie architetturali attivate dal diff rispetto a `origin/main`.
- `pnpm check:changed`: esegue il gate smart changed check per il diff rispetto a `origin/main`. Esegue typecheck, lint e comandi guard per le corsie architetturali interessate, ma non esegue test Vitest. Usa `pnpm test:changed` o `pnpm test <target>` esplicito per la prova dei test.
- `pnpm test`: instrada target espliciti di file/directory attraverso corsie Vitest con ambito. Le esecuzioni senza target usano gruppi shard fissi e si espandono in configurazioni leaf per l'esecuzione parallela locale; il gruppo extension si espande sempre nelle configurazioni shard per-extension invece di un unico enorme processo root-project.
- Le esecuzioni del wrapper dei test terminano con un breve riepilogo `[test] passed|failed|skipped ... in ...`. La riga di durata propria di Vitest resta il dettaglio per-shard.
- Stato di test OpenClaw condiviso: usa `src/test-utils/openclaw-test-state.ts` da Vitest quando un test necessita di `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture di configurazione, workspace, directory agente o archivio auth-profile isolati.
- Helper E2E di processo: usa `test/helpers/openclaw-test-instance.ts` quando un test E2E a livello di processo Vitest necessita di un Gateway in esecuzione, ambiente CLI, cattura log e cleanup in un unico punto.
- Helper E2E Docker/Bash: le corsie che eseguono source di `scripts/lib/docker-e2e-image.sh` possono passare `docker_e2e_test_state_shell_b64 <label> <scenario>` nel container e decodificarlo con `scripts/lib/openclaw-e2e-instance.sh`; gli script multi-home possono passare `docker_e2e_test_state_function_b64` e chiamare `openclaw_test_state_create <label> <scenario>` in ogni flusso. I chiamanti di livello inferiore possono usare `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` per uno snippet shell nel container, oppure `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` per un file env host utilizzabile con source. Il `--` prima di `create` impedisce ai runtime Node più recenti di trattare `--env-file` come flag di Node. Le corsie Docker/Bash che avviano un Gateway possono eseguire source di `scripts/lib/openclaw-e2e-instance.sh` dentro il container per risoluzione dell'entrypoint, avvio mock OpenAI, avvio del Gateway in foreground/background, probe di readiness, esportazione dello stato env, dump dei log e cleanup dei processi.
- Le esecuzioni shard full, extension e include-pattern aggiornano i dati di timing locali in `.artifacts/vitest-shard-timings.json`; le esecuzioni whole-config successive usano quei timing per bilanciare shard lenti e veloci. Gli shard CI include-pattern aggiungono il nome shard alla chiave di timing, mantenendo visibili i timing degli shard filtrati senza sostituire i dati di timing whole-config. Imposta `OPENCLAW_TEST_PROJECTS_TIMINGS=0` per ignorare l'artefatto di timing locale.
- I file di test `plugin-sdk` e `commands` selezionati ora vengono instradati attraverso corsie light dedicate che mantengono solo `test/setup.ts`, lasciando i casi runtime-heavy nelle loro corsie esistenti.
- I file sorgente con test sibling si mappano a quel sibling prima di ricadere su glob di directory più ampi. Le modifiche agli helper sotto `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` e `src/plugins/contracts` usano un grafo di importazione locale per eseguire i test importanti invece di eseguire broad ogni shard quando il percorso di dipendenza è preciso.
- `auto-reply` ora si divide anche in tre configurazioni dedicate (`core`, `top-level`, `reply`) così l'harness reply non domina i test di stato/token/helper top-level più leggeri.
- La configurazione Vitest base ora usa come default `pool: "threads"` e `isolate: false`, con il runner condiviso non isolato abilitato nelle configurazioni del repo.
- `pnpm test:channels` esegue `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` eseguono tutti gli shard extension/Plugin. I Plugin di canale pesanti, il Plugin browser e OpenAI vengono eseguiti come shard dedicati; gli altri gruppi di Plugin restano raggruppati. Usa `pnpm test extensions/<id>` per una singola corsia di Plugin bundled.
- `pnpm test:perf:imports`: abilita il reporting Vitest di durata importazione + dettaglio importazioni, continuando a usare l'instradamento per corsia con ambito per target espliciti di file/directory.
- `pnpm test:perf:imports:changed`: stesso profiling delle importazioni, ma solo per i file modificati da `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` esegue benchmark del percorso changed-mode instradato rispetto all'esecuzione root-project nativa per lo stesso diff git committato.
- `pnpm test:perf:changed:bench -- --worktree` esegue benchmark dell'insieme di modifiche del worktree corrente senza prima eseguire commit.
- `pnpm test:perf:profile:main`: scrive un profilo CPU per il thread principale di Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: scrive profili CPU + heap per il runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: esegue serialmente ogni configurazione leaf Vitest full-suite e scrive dati di durata raggruppati più artefatti JSON/log per-config. Il Test Performance Agent lo usa come baseline prima di tentare fix ai test lenti.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: confronta i report raggruppati dopo una modifica focalizzata sulle prestazioni.
- Integrazione Gateway: opt-in tramite `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: esegue smoke test end-to-end del Gateway (abbinamento multi-instance WS/HTTP/node). Usa come default `threads` + `isolate: false` con worker adattivi in `vitest.e2e.config.ts`; regola con `OPENCLAW_E2E_WORKERS=<n>` e imposta `OPENCLAW_E2E_VERBOSE=1` per log verbosi.
- `pnpm test:live`: esegue test live dei provider (minimax/zai). Richiede chiavi API e `LIVE=1` (o `*_LIVE_TEST=1` specifico del provider) per non saltarli.
- `pnpm test:docker:all`: crea l'immagine condivisa live-test, impacchetta OpenClaw una volta come tarball npm, crea/riusa un'immagine runner Node/Git minimale più un'immagine funzionale che installa quel tarball in `/app`, quindi esegue le corsie smoke Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` tramite uno scheduler ponderato. L'immagine minimale (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) è usata per le corsie installer/update/plugin-dependency; quelle corsie montano il tarball precompilato invece di usare sorgenti repo copiati. L'immagine funzionale (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) è usata per le normali corsie di funzionalità dell'app compilata. `scripts/package-openclaw-for-docker.mjs` è l'unico packer package locale/CI e valida il tarball più `dist/postinstall-inventory.json` prima che Docker lo consumi. Le definizioni delle corsie Docker vivono in `scripts/lib/docker-e2e-scenarios.mjs`; la logica del planner vive in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` esegue il piano selezionato. `node scripts/test-docker-all.mjs --plan-json` emette il piano CI posseduto dallo scheduler per corsie selezionate, tipi di immagine, necessità package/live-image, scenari di stato e controlli credenziali senza creare o eseguire Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controlla gli slot di processo e usa come default 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controlla il pool tail sensibile ai provider e usa come default 10. I cap delle corsie pesanti usano come default `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; i cap dei provider usano come default una corsia pesante per provider tramite `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` e `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Usa `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` per host più grandi. Se una corsia supera il peso effettivo o il cap risorse su un host a bassa parallelizzazione, può comunque partire da un pool vuoto e girerà da sola finché non rilascia capacità. Gli avvii delle corsie sono sfalsati di default di 2 secondi per evitare tempeste di creazione del daemon Docker locale; sovrascrivi con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Il runner esegue preflight di Docker per default, pulisce container E2E OpenClaw obsoleti, emette stato active-lane ogni 30 secondi, condivide le cache degli strumenti CLI dei provider tra corsie compatibili, ritenta una volta per default i fallimenti transitori dei provider live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) e memorizza i timing delle corsie in `.artifacts/docker-tests/lane-timings.json` per ordinamento longest-first nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifest delle corsie senza eseguire Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` per regolare l'output di stato, oppure `OPENCLAW_DOCKER_ALL_TIMINGS=0` per disabilitare il riuso dei timing. Usa `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` solo per corsie deterministiche/locali o `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` solo per corsie provider live; gli alias package sono `pnpm test:docker:local:all` e `pnpm test:docker:live:all`. La modalità live-only unisce le corsie live main e tail in un unico pool longest-first così i bucket dei provider possono impacchettare insieme il lavoro Claude, Codex e Gemini. Il runner smette di schedulare nuove corsie pooled dopo il primo fallimento a meno che `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` sia impostato, e ogni corsia ha un timeout fallback di 120 minuti sovrascrivibile con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; corsie live/tail selezionate usano cap per-lane più stretti. I comandi di setup Docker del backend CLI hanno il proprio timeout tramite `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (default 180). Log per-lane, `summary.json`, `failures.json` e timing di fase vengono scritti sotto `.artifacts/docker-tests/<run-id>/`; usa `pnpm test:docker:timings <summary.json>` per ispezionare le corsie lente e `pnpm test:docker:rerun <run-id|summary.json|failures.json>` per stampare comandi di rerun mirati economici.
- `pnpm test:docker:browser-cdp-snapshot`: crea un container E2E sorgente basato su Chromium, avvia CDP raw più un Gateway isolato, esegue `browser doctor --deep` e verifica che gli snapshot ruolo CDP includano URL dei link, clickables promossi dal cursore, riferimenti iframe e metadati frame.
- `pnpm test:docker:skill-install`: installa il tarball OpenClaw impacchettato in un runner Docker minimale, disabilita `skills.install.allowUploadedArchives`, risolve uno slug skill corrente dalla ricerca live ClawHub, lo installa tramite `openclaw skills install` e verifica `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` e `skills info --json`.
- I probe Docker live del backend CLI possono essere eseguiti come corsie focalizzate, per esempio `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` o `pnpm test:docker:live-cli-backend:codex:mcp`. Claude e Gemini hanno alias `:resume` e `:mcp` corrispondenti.
- `pnpm test:docker:openwebui`: avvia OpenClaw + Open WebUI Dockerizzati, esegue accesso tramite Open WebUI, controlla `/api/models`, quindi esegue una chat reale proxied tramite `/api/chat/completions`. Richiede una chiave di modello live utilizzabile (per esempio OpenAI in `~/.profile`), scarica un'immagine Open WebUI esterna e non è previsto che sia stabile in CI come le normali suite unit/e2e.
- `pnpm test:docker:mcp-channels`: Avvia un contenitore Gateway con dati seed e un secondo contenitore client che avvia `openclaw mcp serve`, quindi verifica la scoperta delle conversazioni instradate, la lettura delle trascrizioni, i metadati degli allegati, il comportamento della coda di eventi live, l'instradamento degli invii in uscita e le notifiche di canale in stile Claude + autorizzazioni sul bridge stdio reale. L'asserzione sulla notifica Claude legge direttamente i frame MCP stdio grezzi, quindi lo smoke test riflette ciò che il bridge emette effettivamente.
- `pnpm test:docker:upgrade-survivor`: Installa il tarball OpenClaw pacchettizzato sopra una fixture di vecchio utente non pulita, esegue l'aggiornamento del pacchetto più doctor non interattivo senza chiavi live di provider o canale, quindi avvia un Gateway loopback e controlla che agenti, configurazione dei canali, allowlist dei Plugin, file di workspace/sessione, stato obsoleto delle dipendenze dei Plugin legacy, avvio e stato RPC sopravvivano.
- `pnpm test:docker:published-upgrade-survivor`: Installa `openclaw@latest` per impostazione predefinita, inizializza file realistici di un utente esistente senza chiavi live di provider o canale, configura quella baseline con una ricetta di comando `openclaw config set` incorporata, aggiorna quell'installazione pubblicata al tarball OpenClaw pacchettizzato, esegue doctor non interattivo, scrive `.artifacts/upgrade-survivor/summary.json`, quindi avvia un Gateway loopback e controlla che intent configurati, file di workspace/sessione, configurazione obsoleta dei Plugin e stato delle dipendenze legacy, avvio, `/healthz`, `/readyz` e stato RPC sopravvivano o vengano riparati in modo pulito. Sovrascrivi una baseline con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, espandi una matrice locale esatta con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` come `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, oppure aggiungi fixture di scenario con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; il set reported-issues include `configured-plugin-installs` per verificare che i Plugin OpenClaw esterni configurati vengano installati automaticamente durante l'aggiornamento e `stale-source-plugin-shadow` per impedire che ombre di Plugin solo sorgente interrompano l'avvio. Package Acceptance espone questi valori come `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`, e risolve token di baseline meta come `last-stable-4` o `all-since-2026.4.23` prima di passare specifiche di pacchetto esatte alle lane Docker.
- `pnpm test:docker:update-migration`: Esegue l'harness published-upgrade survivor nello scenario ad alta intensità di cleanup `plugin-deps-cleanup`, partendo da `openclaw@2026.4.23` per impostazione predefinita. Il workflow separato `Update Migration` espande questa lane con `baselines=all-since-2026.4.23`, in modo che ogni pacchetto stabile pubblicato da `.23` in poi venga aggiornato al candidato e dimostri il cleanup delle dipendenze dei Plugin configurati fuori dalla CI Full Release.
- `pnpm test:docker:plugins`: Esegue smoke test di installazione/aggiornamento per percorso locale, `file:`, pacchetti del registro npm con dipendenze hoisted, riferimenti git mobili, fixture ClawHub, aggiornamenti del marketplace e abilitazione/ispezione del bundle Claude.

## Gate PR locale

Per i controlli locali di land/gate delle PR, esegui:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` presenta flake su un host carico, rieseguilo una volta prima di considerarlo una regressione, quindi isola con `pnpm test <path/to/test>`. Per host con memoria limitata, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark della latenza del modello (chiavi locali)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Utilizzo:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opzionali: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predefinito: "Rispondi con una singola parola: ok. Nessuna punteggiatura o testo extra."

Ultima esecuzione (2025-12-31, 20 esecuzioni):

- mediana minimax 1279 ms (min 1114, max 2431)
- mediana opus 2454 ms (min 1224, max 3170)

## Benchmark di avvio della CLI

Script: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Utilizzo:

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

L'output include `sampleCount`, media, p50, p95, min/max, distribuzione di exit-code/segnale e riepiloghi dell'RSS massimo per ogni comando. Gli opzionali `--cpu-prof-dir` / `--heap-prof-dir` scrivono i profili V8 per ogni esecuzione, così tempi e acquisizione dei profili usano lo stesso harness.

Convenzioni per l'output salvato:

- `pnpm test:startup:bench:smoke` scrive l'artefatto smoke mirato in `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` scrive l'artefatto dell'intera suite in `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` aggiorna la fixture baseline registrata in `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture registrata:

- `test/fixtures/cli-startup-bench.json`
- Aggiorna con `pnpm test:startup:bench:update`
- Confronta i risultati correnti con la fixture usando `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker è opzionale; serve solo per i test smoke di onboarding containerizzati.

Flusso completo di cold-start in un container Linux pulito:

```bash
scripts/e2e/onboard-docker.sh
```

Questo script guida la procedura guidata interattiva tramite una pseudo-tty, verifica i file di config/workspace/session, quindi avvia il gateway ed esegue `openclaw health`.

## Smoke dell'importazione QR (Docker)

Assicura che l'helper runtime QR mantenuto venga caricato nei runtime Docker Node supportati (Node 24 predefinito, Node 22 compatibile):

```bash
pnpm test:docker:qr
```

## Correlati

- [Testing](/it/help/testing)
- [Testing live](/it/help/testing-live)
- [Testing aggiornamenti e plugin](/it/help/testing-updates-plugins)
