---
read_when:
    - Esecuzione o correzione dei test
summary: Come eseguire i test localmente (vitest) e quando usare le modalità force/coverage
title: Test
x-i18n:
    generated_at: "2026-05-06T09:07:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 794589ee8362795c949626203e8129d6a8bb1d2e5ccf9a18f0d9b4bbd347156e
    source_path: reference/test.md
    workflow: 16
---

- Kit completo di test (suite, live, Docker): [Test](/it/help/testing)
- Convalida di aggiornamenti e pacchetti Plugin: [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins)

- `pnpm test:force`: termina qualsiasi processo Gateway residuo che mantiene occupata la porta di controllo predefinita, poi esegue l'intera suite Vitest con una porta Gateway isolata, così i test del server non entrano in conflitto con un'istanza in esecuzione. Usalo quando una precedente esecuzione del Gateway ha lasciato occupata la porta 18789.
- `pnpm test:coverage`: esegue la suite di unit test con coverage V8 (tramite `vitest.unit.config.ts`). Questo è un gate di coverage per la lane unit predefinita, non una coverage dell'intero repository su tutti i file. Le soglie sono 70% per righe/funzioni/istruzioni e 55% per branch. Poiché `coverage.all` è false e la lane predefinita limita gli include della coverage ai unit test non fast con file sorgente fratelli, il gate misura il sorgente di proprietà di questa lane invece di ogni import transitivo che capita di caricare.
- `pnpm test:coverage:changed`: esegue la coverage unit solo per i file modificati rispetto a `origin/main`.
- `pnpm test:changed`: esecuzione economica e intelligente dei test modificati. Esegue target precisi da modifiche dirette ai test, file fratelli `*.test.ts`, mappature esplicite dei sorgenti e il grafo di import locale. Le modifiche ampie a config/package vengono saltate a meno che non si mappino a test precisi.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: esecuzione esplicita ampia dei test modificati. Usala quando una modifica a test harness/config/package deve ricadere sul comportamento più ampio di Vitest per i test modificati.
- `pnpm changed:lanes`: mostra le lane architetturali attivate dal diff rispetto a `origin/main`.
- `pnpm check:changed`: esegue il gate intelligente di check modificati per il diff rispetto a `origin/main`. Esegue typecheck, lint e comandi guard per le lane architetturali interessate, ma non esegue test Vitest. Usa `pnpm test:changed` o `pnpm test <target>` esplicito per la prova dei test.
- `pnpm test`: indirizza target espliciti di file/directory attraverso lane Vitest con ambito. Le esecuzioni senza target usano gruppi di shard fissi e si espandono in config foglia per l'esecuzione parallela locale; il gruppo extension si espande sempre nelle config shard per estensione invece di un unico enorme processo root-project.
- Le esecuzioni del wrapper di test terminano con un breve riepilogo `[test] passed|failed|skipped ... in ...`. La riga di durata propria di Vitest resta il dettaglio per shard.
- Stato di test condiviso OpenClaw: usa `src/test-utils/openclaw-test-state.ts` da Vitest quando un test richiede `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture di config, workspace, directory agente o archivio auth-profile isolati.
- Helper E2E di processo: usa `test/helpers/openclaw-test-instance.ts` quando un test E2E a livello di processo Vitest richiede Gateway in esecuzione, ambiente CLI, cattura log e pulizia in un unico punto.
- Helper E2E Docker/Bash: le lane che fanno source di `scripts/lib/docker-e2e-image.sh` possono passare `docker_e2e_test_state_shell_b64 <label> <scenario>` nel container e decodificarlo con `scripts/lib/openclaw-e2e-instance.sh`; gli script multi-home possono passare `docker_e2e_test_state_function_b64` e chiamare `openclaw_test_state_create <label> <scenario>` in ciascun flusso. I chiamanti di livello più basso possono usare `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` per uno snippet shell dentro il container, oppure `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` per un file env host utilizzabile con source. Il `--` prima di `create` impedisce ai runtime Node più recenti di trattare `--env-file` come flag Node. Le lane Docker/Bash che avviano un Gateway possono fare source di `scripts/lib/openclaw-e2e-instance.sh` dentro il container per risoluzione entrypoint, avvio mock OpenAI, lancio Gateway in foreground/background, probe di readiness, esportazione env di stato, dump dei log e pulizia dei processi.
- Le esecuzioni shard full, extension e include-pattern aggiornano i dati di timing locali in `.artifacts/vitest-shard-timings.json`; le successive esecuzioni whole-config usano quei timing per bilanciare shard lenti e veloci. Gli shard CI include-pattern aggiungono il nome dello shard alla chiave di timing, mantenendo visibili i timing degli shard filtrati senza sostituire i dati di timing whole-config. Imposta `OPENCLAW_TEST_PROJECTS_TIMINGS=0` per ignorare l'artefatto di timing locale.
- I file di test `plugin-sdk` e `commands` selezionati ora passano attraverso lane leggere dedicate che mantengono solo `test/setup.ts`, lasciando i casi pesanti a runtime nelle loro lane esistenti.
- I file sorgente con test fratelli si mappano a quel fratello prima di ricadere su glob di directory più ampi. Le modifiche agli helper sotto `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` e `src/plugins/contracts` usano un grafo di import locale per eseguire i test importatori invece di eseguire ampiamente ogni shard quando il path della dipendenza è preciso.
- `auto-reply` ora si divide anche in tre config dedicate (`core`, `top-level`, `reply`) così l'harness reply non domina i test più leggeri top-level su stato/token/helper.
- La config Vitest di base ora usa per impostazione predefinita `pool: "threads"` e `isolate: false`, con il runner condiviso non isolato abilitato nelle config del repository.
- `pnpm test:channels` esegue `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` eseguono tutti gli shard extension/plugin. I Plugin di canale pesanti, il Plugin browser e OpenAI vengono eseguiti come shard dedicati; gli altri gruppi Plugin restano raggruppati. Usa `pnpm test extensions/<id>` per una lane di un singolo Plugin incluso.
- `pnpm test:perf:imports`: abilita i report di durata import + scomposizione import di Vitest, continuando a usare il routing delle lane con ambito per target espliciti di file/directory.
- `pnpm test:perf:imports:changed`: stesso profiling degli import, ma solo per i file modificati rispetto a `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` misura le prestazioni del percorso routed in modalità changed rispetto all'esecuzione nativa root-project per lo stesso diff git committato.
- `pnpm test:perf:changed:bench -- --worktree` misura le prestazioni dell'insieme di modifiche del worktree corrente senza committare prima.
- `pnpm test:perf:profile:main`: scrive un profilo CPU per il thread principale di Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: scrive profili CPU + heap per il runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: esegue serialmente ogni config foglia Vitest full-suite e scrive dati di durata raggruppati più artefatti JSON/log per config. Il Test Performance Agent lo usa come baseline prima di tentare correzioni ai test lenti.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: confronta i report raggruppati dopo una modifica focalizzata sulle prestazioni.
- Integrazione Gateway: opt-in tramite `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: esegue smoke test end-to-end del Gateway (pairing multi-istanza WS/HTTP/node). Usa per impostazione predefinita `threads` + `isolate: false` con worker adattivi in `vitest.e2e.config.ts`; regola con `OPENCLAW_E2E_WORKERS=<n>` e imposta `OPENCLAW_E2E_VERBOSE=1` per log dettagliati.
- `pnpm test:live`: esegue test live dei provider (minimax/zai). Richiede chiavi API e `LIVE=1` (o `*_LIVE_TEST=1` specifico del provider) per non essere saltato.
- `pnpm test:docker:all`: compila l'immagine live-test condivisa, impacchetta OpenClaw una volta come tarball npm, compila/riusa un'immagine runner bare Node/Git più un'immagine funzionale che installa quel tarball in `/app`, poi esegue lane smoke Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` tramite uno scheduler pesato. L'immagine bare (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) è usata per lane installer/update/plugin-dependency; quelle lane montano il tarball precompilato invece di usare sorgenti del repository copiati. L'immagine funzionale (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) è usata per lane di funzionalità normale dell'app compilata. `scripts/package-openclaw-for-docker.mjs` è l'unico packer locale/CI del package e valida il tarball più `dist/postinstall-inventory.json` prima che Docker lo consumi. Le definizioni delle lane Docker si trovano in `scripts/lib/docker-e2e-scenarios.mjs`; la logica del planner si trova in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` esegue il piano selezionato. `node scripts/test-docker-all.mjs --plan-json` emette il piano CI di proprietà dello scheduler per lane selezionate, tipi di immagine, necessità package/live-image, scenari di stato e controlli delle credenziali senza compilare o eseguire Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controlla gli slot di processo e il valore predefinito è 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controlla il pool tail sensibile ai provider e il valore predefinito è 10. I limiti delle lane pesanti usano come predefiniti `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; i limiti provider usano come predefinita una lane pesante per provider tramite `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` e `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Usa `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` per host più grandi. Se una lane supera il peso effettivo o il limite di risorse su un host a basso parallelismo, può comunque avviarsi da un pool vuoto ed eseguirà da sola finché non rilascia capacità. Gli avvii delle lane sono scaglionati di 2 secondi per impostazione predefinita per evitare tempeste di create del demone Docker locale; sovrascrivi con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Il runner esegue il preflight di Docker per impostazione predefinita, pulisce i container E2E OpenClaw obsoleti, emette lo stato delle lane attive ogni 30 secondi, condivide cache degli strumenti CLI provider tra lane compatibili, ritenta una volta per impostazione predefinita gli errori transitori dei provider live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) e archivia i timing delle lane in `.artifacts/docker-tests/lane-timings.json` per ordinamento longest-first nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifest delle lane senza eseguire Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` per regolare l'output di stato, oppure `OPENCLAW_DOCKER_ALL_TIMINGS=0` per disabilitare il riuso dei timing. Usa `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` solo per lane deterministiche/locali oppure `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` solo per lane con provider live; gli alias package sono `pnpm test:docker:local:all` e `pnpm test:docker:live:all`. La modalità live-only unisce le lane live main e tail in un unico pool longest-first così i bucket provider possono impacchettare insieme il lavoro Claude, Codex e Gemini. Il runner smette di schedulare nuove lane in pool dopo il primo errore a meno che `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` non sia impostato, e ogni lane ha un timeout fallback di 120 minuti sovrascrivibile con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; lane live/tail selezionate usano limiti per lane più stretti. I comandi di setup Docker del backend CLI hanno il proprio timeout tramite `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (predefinito 180). I log per lane, `summary.json`, `failures.json` e i timing delle fasi vengono scritti sotto `.artifacts/docker-tests/<run-id>/`; usa `pnpm test:docker:timings <summary.json>` per ispezionare le lane lente e `pnpm test:docker:rerun <run-id|summary.json|failures.json>` per stampare comandi di riesecuzione mirati ed economici.
- `pnpm test:docker:browser-cdp-snapshot`: compila un container E2E sorgente basato su Chromium, avvia CDP raw più un Gateway isolato, esegue `browser doctor --deep` e verifica che gli snapshot dei ruoli CDP includano URL dei link, cliccabili promossi dal cursore, riferimenti iframe e metadati dei frame.
- I probe Docker live del backend CLI possono essere eseguiti come lane focalizzate, per esempio `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` o `pnpm test:docker:live-cli-backend:codex:mcp`. Claude e Gemini hanno alias `:resume` e `:mcp` corrispondenti.
- `pnpm test:docker:openwebui`: avvia OpenClaw + Open WebUI dockerizzati, effettua l'accesso tramite Open WebUI, controlla `/api/models`, poi esegue una chat reale proxy tramite `/api/chat/completions`. Richiede una chiave modello live utilizzabile (per esempio OpenAI in `~/.profile`), scarica un'immagine esterna Open WebUI e non è previsto che sia stabile in CI come le normali suite unit/e2e.
- `pnpm test:docker:mcp-channels`: Avvia un container Gateway con dati iniziali e un secondo container client che genera `openclaw mcp serve`, quindi verifica la discovery delle conversazioni instradate, la lettura delle trascrizioni, i metadati degli allegati, il comportamento della coda di eventi live, l’instradamento dell’invio in uscita e le notifiche di canale + autorizzazioni in stile Claude sul bridge stdio reale. L’asserzione della notifica Claude legge direttamente i frame MCP stdio grezzi, in modo che lo smoke rifletta ciò che il bridge emette realmente.
- `pnpm test:docker:upgrade-survivor`: Installa il tarball OpenClaw pacchettizzato su una fixture sporca di vecchio utente, esegue l’aggiornamento del pacchetto più doctor non interattivo senza chiavi live di provider o canale, quindi avvia un Gateway loopback e controlla che agenti, configurazione del canale, allowlist dei plugin, file di workspace/sessione, stato obsoleto delle dipendenze dei plugin legacy, avvio e stato RPC sopravvivano.
- `pnpm test:docker:published-upgrade-survivor`: Installa `openclaw@latest` per impostazione predefinita, inizializza file realistici di un utente esistente senza chiavi live di provider o canale, configura quella baseline con una ricetta di comando `openclaw config set` integrata, aggiorna quell’installazione pubblicata al tarball OpenClaw pacchettizzato, esegue doctor non interattivo, scrive `.artifacts/upgrade-survivor/summary.json`, quindi avvia un Gateway loopback e controlla che intent configurati, file di workspace/sessione, configurazione obsoleta dei plugin e stato delle dipendenze legacy, avvio, `/healthz`, `/readyz` e stato RPC sopravvivano o vengano riparati correttamente. Sovrascrivi una baseline con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, espandi una matrice locale esatta con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` come `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, oppure aggiungi fixture di scenario con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; l’insieme reported-issues include `configured-plugin-installs` per verificare che i plugin OpenClaw esterni configurati vengano installati automaticamente durante l’upgrade e `stale-source-plugin-shadow` per impedire che shadow di plugin solo sorgente interrompano l’avvio. Package Acceptance espone questi valori come `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` e `published_upgrade_survivor_scenarios`, e risolve token di baseline meta come `last-stable-4` o `all-since-2026.4.23` prima di passare specifiche di pacchetto esatte alle lane Docker.
- `pnpm test:docker:update-migration`: Esegue l’harness published-upgrade survivor nello scenario `plugin-deps-cleanup`, ricco di cleanup, partendo da `openclaw@2026.4.23` per impostazione predefinita. Il workflow separato `Update Migration` espande questa lane con `baselines=all-since-2026.4.23`, così ogni pacchetto stabile pubblicato dalla `.23` in poi si aggiorna al candidato e dimostra il cleanup delle dipendenze dei plugin configurati al di fuori della Full Release CI.
- `pnpm test:docker:plugins`: Esegue smoke di installazione/aggiornamento per percorso locale, `file:`, pacchetti del registro npm con dipendenze hoisted, riferimenti git mobili, fixture ClawHub, aggiornamenti del marketplace e abilitazione/ispezione del bundle Claude.

## Gate PR locale

Per i controlli locali di gate/integrazione PR, esegui:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` ha flake su un host sotto carico, rieseguilo una volta prima di considerarlo una regressione, poi isola con `pnpm test <path/to/test>`. Per host con memoria limitata, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark della latenza del modello (chiavi locali)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opzionali: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predefinito: "Rispondi con una sola parola: ok. Nessuna punteggiatura o testo aggiuntivo."

Ultima esecuzione (2025-12-31, 20 esecuzioni):

- mediana minimax 1279ms (min 1114, max 2431)
- mediana opus 2454ms (min 1224, max 3170)

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

L'output include `sampleCount`, media, p50, p95, min/max, distribuzione di codice di uscita/segnale e riepiloghi RSS massimi per ciascun comando. `--cpu-prof-dir` / `--heap-prof-dir` opzionali scrivono profili V8 per ogni esecuzione, così temporizzazione e acquisizione dei profili usano lo stesso harness.

Convenzioni per l'output salvato:

- `pnpm test:startup:bench:smoke` scrive l'artefatto di smoke mirato in `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` scrive l'artefatto della suite completa in `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` aggiorna la fixture baseline registrata nel repository in `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture registrata nel repository:

- `test/fixtures/cli-startup-bench.json`
- Aggiorna con `pnpm test:startup:bench:update`
- Confronta i risultati correnti con la fixture usando `pnpm test:startup:bench:check`

## E2E di onboarding (Docker)

Docker è opzionale; è necessario solo per smoke test di onboarding containerizzati.

Flusso completo di avvio a freddo in un container Linux pulito:

```bash
scripts/e2e/onboard-docker.sh
```

Questo script guida la procedura guidata interattiva tramite una pseudo-tty, verifica i file di configurazione/workspace/sessione, poi avvia il Gateway ed esegue `openclaw health`.

## Smoke di importazione QR (Docker)

Assicura che l'helper mantenuto del runtime QR venga caricato nei runtime Docker Node supportati (Node 24 predefinito, Node 22 compatibile):

```bash
pnpm test:docker:qr
```

## Correlati

- [Test](/it/help/testing)
- [Test live](/it/help/testing-live)
- [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins)
