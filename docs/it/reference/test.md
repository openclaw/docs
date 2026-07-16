---
read_when:
    - Esecuzione o correzione dei test
summary: Come eseguire i test in locale (vitest) e quando usare le modalità force/coverage
title: Test
x-i18n:
    generated_at: "2026-07-16T14:57:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 391185703e853bb523e1396eb22da4693d10d47b1644d3b2a51707d329f67dae
    source_path: reference/test.md
    workflow: 16
---

- Kit completo per i test (suite, live, Docker): [Test](/it/help/testing)
- Validazione degli aggiornamenti e dei pacchetti dei plugin: [Test di aggiornamenti e plugin](/it/help/testing-updates-plugins)

## Impostazioni predefinite dell'agente

Le sessioni dell'agente eseguono localmente uno o pochi test mirati e controlli statici poco onerosi solo
per sorgenti attendibili e quando l'installazione esistente delle dipendenze è pronta. Non
eseguire mai localmente gli strumenti di un repository non attendibile. Suite più ampie, gate delle modifiche con
esecuzione distribuita di typecheck/lint, build, Docker, corsie dei pacchetti, E2E, prove
live e validazione multipiattaforma vengono eseguiti in remoto tramite Crabbox. Per le
prove onerose di manutentori attendibili, l'impostazione predefinita è Blacksmith Testbox. Il flusso di lavoro Testbox
configurato carica le credenziali, pertanto il codice non attendibile di contributori o fork deve utilizzare
la CI del fork senza segreti oppure un Crabbox AWS diretto e sanificato.

Non eseguire il preriscaldamento in previsione del lavoro. Acquisire il backend solo quando
il primo comando oneroso è pronto, riutilizzare l'id `tbx_...` restituito per i comandi onerosi
successivi, sincronizzare il checkout corrente a ogni esecuzione e arrestarlo prima del passaggio di consegne.

Dopo il primo riutilizzo riuscito, il wrapper registra la base del lease,
le dipendenze e l'impronta digitale del flusso di lavoro Testbox in `.crabbox/testbox-leases/`.
Le modifiche limitate ai sorgenti continuano a riutilizzare l'ambiente preriscaldato. Una modifica alla base di merge, al lockfile,
all'input del gestore di pacchetti, al wrapper o al flusso di lavoro Testbox provoca un arresto preventivo e richiede un
nuovo lease. Ogni esecuzione continua comunque a sincronizzare il checkout corrente.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` è destinato esclusivamente alla diagnostica intenzionale, non
alle prove di rilascio.

I comandi di test locali riportati di seguito sono destinati ai flussi di lavoro umani e alle prove limitate dell'agente.
L'indisponibilità del provider remoto deve essere segnalata; non autorizza
l'esecuzione silenziosa di un gate locale ampio.

Per le prove onerose non attendibili, eseguire il riscaldamento solo quando necessario con `--provider aws`. Ogni esecuzione deve impostare
`CRABBOX_ENV_ALLOW=CI`, passare `--provider aws --no-hydrate` e utilizzare
un nuovo `HOME` remoto temporaneo prima di installare le dipendenze o eseguire
i test. Utilizzare un lease appena riscaldato dedicato a quella sorgente non attendibile; non riutilizzare mai
un lease attendibile o precedentemente caricato con credenziali. Avviare un binario Crabbox attendibile
installato da un checkout `main` pulito e attendibile e recuperare solo la PR remota con
`--fresh-pr`; non eseguire mai localmente il wrapper o la configurazione del checkout non attendibile.
Rimuovere `CRABBOX_AWS_INSTANCE_PROFILE` e interrompere preventivamente l'operazione a meno che il valore risolto
`aws.instanceProfile` non sia vuoto. Prima di qualsiasi installazione/test, utilizzare strumenti attendibili
con percorso assoluto per richiedere un token IMDSv2, dimostrare che l'endpoint delle credenziali IAM
restituisce 404 e verificare che il valore remoto `git rev-parse HEAD` corrisponda allo SHA completo
dell'head della PR esaminata. Associare il lease a tale SHA e arrestarlo/riscaldarlo nuovamente quando l'head
cambia. Caricare il file attendibile `scripts/crabbox-untrusted-bootstrap.sh` dal checkout
`main` pulito insieme a `--fresh-pr`; installa le versioni fissate di Node/pnpm, verifica lo SHA
e il pin del gestore di pacchetti, isola `HOME`, installa le dipendenze, quindi esegue
il test richiesto. Se il broker non può dimostrare l'assenza di un ruolo o non esiste alcuna PR remota,
utilizzare la CI del fork senza segreti. Non utilizzare `hydrate-github`, `--no-sync` o un
flusso di lavoro Testbox caricato con credenziali.
Rimuovere tutte le sostituzioni `CRABBOX_TAILSCALE*`, imporre `--network public
--tailscale=false`, cancellare i flag del nodo di uscita/LAN e richiedere che `crabbox inspect`
segnali una rete pubblica senza stato Tailscale prima di caricare qualsiasi script.

## Ordine locale ordinario

1. `pnpm test:changed` per la prova Vitest nell'ambito delle modifiche.
2. `pnpm test <path-or-filter>` per un file, una directory o una destinazione esplicita.
3. `pnpm test` solo quando è intenzionalmente necessaria l'intera suite Vitest locale.

In un worktree Codex o in un checkout collegato/sparso, gli agenti evitano l'esecuzione locale diretta di
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run`:

- Prova mirata e limitata con dipendenze pronte:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- Controllo delle modifiche con classificazione preliminare: `node scripts/check-changed.mjs`; i piani relativi solo alla documentazione,
  senza modifiche o con pochi metadati restano locali quando le dipendenze sono pronte,
  mentre i piani onerosi o con dipendenze mancanti vengono delegati a Testbox.
- Prova ampia esplicita con lease mantenuto: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`, in modo che pnpm venga eseguito all'interno di Testbox.
- Il valore finale `exitCode` del wrapper e il JSON delle tempistiche costituiscono il risultato del comando. Un'esecuzione delegata di Blacksmith GitHub Actions può mostrare `cancelled` dopo un comando SSH riuscito perché Testbox viene arrestato dall'esterno dell'azione keepalive; controllare il riepilogo del wrapper e l'output del comando prima di considerarlo un errore.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: mantiene la serializzazione dei controlli onerosi nel worktree corrente anziché nella directory Git comune per comandi quali `pnpm check:changed` e `pnpm test ...` mirati. Utilizzarlo solo su host locali ad alta capacità quando si eseguono intenzionalmente controlli indipendenti tra worktree collegati.

## Comandi principali

Le esecuzioni del wrapper dei test terminano con un breve riepilogo `[test] passed|failed|skipped ... in ...`; la riga della durata di Vitest resta il dettaglio per singolo shard.

| Comando                                           | Funzione                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | Le destinazioni esplicite di file/directory vengono instradate attraverso corsie Vitest con ambito definito. Le esecuzioni senza destinazione costituiscono la prova dell'intera suite: i gruppi di shard fissi vengono espansi in configurazioni foglia per l'esecuzione locale in parallelo, con il fan-out degli shard previsto stampato prima dell'avvio. Il gruppo delle estensioni viene sempre espanso in configurazioni shard per singola estensione anziché in un unico enorme processo del progetto radice.           |
| `pnpm test:changed`                               | Esecuzione intelligente ed economica dei test modificati: destinazioni precise derivate da modifiche dirette ai test, file `*.test.ts` adiacenti, mapping espliciti dei sorgenti e grafo delle importazioni locale. Le modifiche ampie a configurazione/pacchetti vengono ignorate, salvo quando corrispondono a test precisi.                                                                                                                               |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | Esecuzione ampia ed esplicita dei test modificati; utilizzarla quando una modifica all'infrastruttura di test, alla configurazione o ai pacchetti deve ricorrere al comportamento più ampio di Vitest per i test modificati.                                                                                                                                                                                                                        |
| `pnpm test:force`                                 | Libera la porta configurata del Gateway OpenClaw (valore predefinito `18789`), quindi esegue l'intera suite con una porta Gateway isolata, in modo che i test del server non entrino in conflitto con un'istanza in esecuzione.                                                                                                                                                                                    |
| `pnpm test:coverage`                              | Genera un report informativo sulla copertura V8 per la corsia di unit test predefinita (`vitest.unit.config.ts`); non viene applicata alcuna soglia di copertura.                                                                                                                                                                                                                             |
| `pnpm test:coverage:changed`                      | Copertura degli unit test solo per i file modificati da `origin/main`.                                                                                                                                                                                                                                                                                                       |
| `pnpm changed:lanes`                              | Mostra le corsie architetturali attivate dalle differenze rispetto a `origin/main`.                                                                                                                                                                                                                                                                                      |
| `pnpm check:changed`                              | Classifica le corsie modificate prima di scegliere l'esecuzione. I piani relativi solo alla documentazione, senza modifiche o con pochi metadati restano locali quando le dipendenze sono pronte; i piani con esecuzione distribuita di typecheck/lint, altre corsie onerose o dipendenze locali mancanti vengono delegati a Crabbox/Testbox al di fuori della CI. Non esegue Vitest; utilizzare `pnpm test:changed` o `pnpm test <target>` per la prova dei test. |

## Stato condiviso dei test e helper dei processi

- `src/test-utils/openclaw-test-state.ts`: utilizzare da Vitest quando un test richiede un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, una fixture di configurazione, un workspace, una directory dell'agente o un archivio dei profili di autenticazione isolati.
- `pnpm test:env-mutations:report`: report non bloccante dei test/delle infrastrutture che modificano direttamente `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` o le relative chiavi di ambiente. Utilizzarlo per individuare i candidati alla migrazione verso l'helper dello stato condiviso dei test.
- `test/helpers/openclaw-test-instance.ts`: test E2E a livello di processo che richiedono in un unico punto un Gateway in esecuzione, l'ambiente CLI, l'acquisizione dei log e la pulizia.
- Le corsie E2E Docker/Bash che caricano `scripts/lib/docker-e2e-image.sh` possono passare `docker_e2e_test_state_shell_b64 <label> <scenario>` al container e decodificarlo con `scripts/lib/openclaw-e2e-instance.sh`; gli script con più home possono passare `docker_e2e_test_state_function_b64` e chiamare `openclaw_test_state_create <label> <scenario>` in ogni flusso. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` scrive un file di ambiente dell'host caricabile come sorgente (il `--` prima di `create` impedisce ai runtime Node più recenti di trattare `--env-file` come un flag Node). Le corsie che avviano un Gateway possono caricare `scripts/lib/openclaw-e2e-instance.sh` per la risoluzione dell'entrypoint, l'avvio simulato di OpenAI, l'avvio in primo piano/in background, le sonde di disponibilità, l'esportazione dell'ambiente di stato, i dump dei log e la pulizia dei processi.

## Corsie di Control UI, TUI ed estensioni

- **E2E simulato della Control UI:** `pnpm test:ui:e2e` esegue la corsia Vitest + Playwright che avvia la Control UI Vite e pilota una pagina Chromium reale rispetto a un WebSocket del Gateway simulato. I test si trovano in `ui/src/**/*.e2e.test.ts`; le simulazioni e i controlli condivisi si trovano in `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` include questa corsia. Le esecuzioni degli agenti usano per impostazione predefinita Testbox/Crabbox, inclusa la verifica mirata; usare `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` solo come ripiego locale esplicito.
- **Test PTY della TUI:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` esegue la corsia PTY rapida con backend simulato. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` o `pnpm tui:pty:test:watch --mode local` esegue lo smoke test `tui --local` più lento, che simula solo l'endpoint esterno del modello. Verificare testo visibile stabile o chiamate alle fixture, non snapshot ANSI grezzi.
- `pnpm test:extensions` e `pnpm test extensions` eseguono tutti gli shard delle estensioni/dei Plugin. I Plugin di canale pesanti, il Plugin del browser e OpenAI vengono eseguiti come shard dedicati; gli altri gruppi di Plugin restano raggruppati. `pnpm test extensions/<id>` esegue la corsia di un singolo Plugin incluso.
- I file sorgente con test adiacenti vengono associati a tali test prima di ricorrere a glob di directory più ampi. Le modifiche agli helper in `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` e `src/plugins/contracts` usano un grafo locale delle importazioni per eseguire i test che li importano, anziché eseguire in modo generalizzato ogni shard quando il percorso delle dipendenze è preciso.
- Le destinazioni delle directory dei contratti si distribuiscono sulle rispettive corsie: `pnpm test src/channels/plugins/contracts` esegue le quattro configurazioni dei contratti dei canali e `pnpm test src/plugins/contracts` esegue la configurazione dei contratti dei Plugin, poiché i progetti generici `channels`/`plugins` escludono `contracts/**`.
- `auto-reply` è suddiviso in tre configurazioni dedicate (`core`, `top-level`, `reply`) affinché l'infrastruttura di test delle risposte non domini i più leggeri test di stato/token/helper di primo livello.
- I file di test `plugin-sdk` e `commands` selezionati vengono instradati attraverso corsie leggere dedicate che mantengono solo `test/setup.ts`, lasciando i casi più onerosi per il runtime nelle corsie esistenti.
- La configurazione Vitest di base usa per impostazione predefinita `pool: "threads"` e `isolate: false`, con il runner condiviso non isolato abilitato nelle configurazioni del repository.
- `pnpm test:channels` esegue `vitest.channels.config.ts`.

## Gateway ed E2E

- L'integrazione del Gateway è facoltativa: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: aggregazione E2E del repository = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: smoke test end-to-end del Gateway (associazione WS/HTTP/Node con più istanze). Usa per impostazione predefinita `threads` + `isolate: false` con worker adattivi in `vitest.e2e.config.ts`; regolare con `OPENCLAW_E2E_WORKERS=<n>`, log dettagliati con `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: test in produzione dei provider (Claude/Minimax/DeepSeek/z.ai/ecc., subordinati a `*.live.test.ts`). Richiede chiavi API e `LIVE=1` (o `OPENCLAW_LIVE_TEST=1`) per non essere ignorato; output dettagliato con `OPENCLAW_LIVE_TEST_QUIET=0`.

## Suite Docker completa (`pnpm test:docker:all`)

Crea l'immagine condivisa per i test in produzione, impacchetta OpenClaw una sola volta come tarball npm, crea/riutilizza un'immagine runner essenziale Node/Git e un'immagine funzionale che installa tale tarball in `/app`, quindi esegue le corsie degli smoke test Docker tramite uno scheduler ponderato. `scripts/package-openclaw-for-docker.mjs` è l'unico strumento locale/CI per la creazione del pacchetto e convalida il tarball più `dist/postinstall-inventory.json` prima che Docker lo utilizzi.

- Immagine essenziale (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): corsie per programma di installazione/aggiornamento/dipendenze dei Plugin; monta il tarball precompilato invece delle sorgenti del repository copiate.
- Immagine funzionale (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): corsie delle normali funzionalità dell'app compilata.
- Definizioni delle corsie: `scripts/lib/docker-e2e-scenarios.mjs`. Pianificatore: `scripts/lib/docker-e2e-plan.mjs`. Esecutore: `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json` genera il piano CI gestito dallo scheduler (corsie, tipi di immagine, necessità di pacchetti/immagini per test in produzione, scenari di stato, verifiche delle credenziali) senza creare né eseguire Docker.

Parametri di pianificazione (variabili d'ambiente, valori predefiniti tra parentesi):

| Variabile d'ambiente                                                                                           | Valore predefinito  | Scopo                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | Slot dei processi.                                                                                                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | Pool finale sensibile ai provider.                                                                                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | Limite delle corsie pesanti dei provider in produzione.                                                                                                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | Limite delle corsie delle risorse npm.                                                                                                                                                                                                                                                                                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | Limite delle corsie delle risorse di servizio.                                                                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | Limiti delle corsie pesanti per provider.                                                                                                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | Limiti più restrittivi per provider.                                                                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | Sostituzione per host più grandi.                                                                                                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | Ritardo tra gli avvii delle corsie, evita picchi di creazione sul daemon Docker locale.                                                                                                                                                                                                                                                                   |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 min) | Timeout di ripiego per corsia; le corsie selezionate in produzione/finali usano limiti più restrittivi.                                                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | Nuovi tentativi per errori temporanei dei provider in produzione.                                                                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | off                 | Stampa il manifesto delle corsie senza eseguire Docker.                                                                                                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | Intervallo di stampa dello stato delle corsie attive.                                                                                                                                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | on                  | Riutilizza `.artifacts/docker-tests/lane-timings.json` per l'ordinamento dal più lungo; impostare `0` per disabilitarlo.                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` solo per le corsie deterministiche/locali, `only` solo per le corsie dei provider in produzione. Alias: `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. La modalità solo in produzione unisce le corsie principali e finali in produzione in un unico pool ordinato dalla più lunga, così i gruppi di provider combinano il lavoro Claude/Codex/Gemini. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | Timeout di configurazione Docker del backend CLI.                                                                                                                                                                                                                                                                                                       |

Il modello delle variabili d'ambiente per i limiti delle risorse è `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` (nome della risorsa in maiuscolo, caratteri non alfanumerici accorpati in `_`).

Altri comportamenti: il runner esegue per impostazione predefinita i controlli preliminari di Docker, elimina i container E2E OpenClaw obsoleti, condivide le cache degli strumenti CLI dei provider tra lane compatibili e interrompe la pianificazione di nuove lane nel pool dopo il primo errore, a meno che non sia impostato `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`. Se una lane supera il limite effettivo di peso/risorse su un host con parallelismo ridotto, può comunque avviarsi da un pool vuoto ed essere eseguita da sola finché non libera capacità. I log per lane, `summary.json`, `failures.json` e le tempistiche delle fasi vengono scritti in `.artifacts/docker-tests/<run-id>/`; usare `pnpm test:docker:timings <summary.json>` per esaminare le lane lente e `pnpm test:docker:rerun <run-id|summary.json|failures.json>` per stampare comandi economici per riesecuzioni mirate.

### Lane Docker rilevanti

| Comando                                                                     | Verifica                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Container E2E del sorgente basato su Chromium con CDP grezzo + Gateway isolato; le istantanee dei ruoli CDP di `browser doctor --deep` includono gli URL dei link, gli elementi cliccabili promossi dal cursore, i riferimenti agli iframe e i metadati dei frame.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:skill-install`                                            | Installa il tarball pacchettizzato in un runner Docker essenziale con `skills.install.allowUploadedArchives: false`, risolve lo slug attuale di una skill tramite la ricerca live di ClawHub, esegue l'installazione tramite `openclaw skills install` e verifica `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` e `skills info --json`.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | Sonde live mirate per il backend CLI; Gemini dispone degli alias corrispondenti `:resume` e `:mcp`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test:docker:openwebui`                                                | OpenClaw + Open WebUI in Docker: esegue l'accesso, controlla `/api/models` ed esegue una vera chat tramite proxy attraverso `/api/chat/completions`. Richiede una chiave valida per un modello live e scarica un'immagine esterna; non è previsto che sia stabile in CI quanto le suite di test unitari/E2E.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:mcp-channels`                                             | Container Gateway con dati iniziali più un container client che genera `openclaw mcp serve`: rilevamento delle conversazioni instradate, lettura delle trascrizioni, metadati degli allegati, comportamento della coda degli eventi live, instradamento dell'invio in uscita e notifiche in stile Claude relative al canale e alle autorizzazioni tramite il bridge stdio reale (l'asserzione legge direttamente i frame MCP stdio grezzi).                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm test:docker:upgrade-survivor`                                         | Installa il tarball pacchettizzato su una fixture obsoleta di un vecchio utente, esegue l'aggiornamento del pacchetto e doctor in modalità non interattiva senza chiavi live di provider/canali, avvia un Gateway di loopback e verifica che agenti, configurazione dei canali, allowlist dei Plugin, file di area di lavoro/sessione, stato obsoleto delle dipendenze dei Plugin legacy, avvio e stato RPC rimangano intatti.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:published-upgrade-survivor`                               | Installa `openclaw@latest` per impostazione predefinita, precompila file realistici di utenti esistenti, configura tramite una ricetta `openclaw config set` incorporata, aggiorna al tarball pacchettizzato, esegue doctor in modalità non interattiva, scrive `.artifacts/upgrade-survivor/summary.json` e controlla `/healthz`, `/readyz` e lo stato RPC. Eseguire l'override con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, espandere una matrice con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` o aggiungere fixture di scenario con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` (include `configured-plugin-installs` e `stale-source-plugin-shadow`). Package Acceptance li espone come `published_upgrade_survivor_baseline(s)` / `_scenarios` e risolve metatoken come `last-stable-4` o `all-since-2026.4.23`. |
| `pnpm test:docker:update-migration`                                         | Harness di verifica della persistenza dopo l'aggiornamento pubblicato nello scenario `plugin-deps-cleanup`, che per impostazione predefinita parte da `openclaw@2026.4.23`. Il workflow `Update Migration` lo estende con `baselines=all-since-2026.4.23` per dimostrare la pulizia delle dipendenze dei Plugin configurati al di fuori della CI della release completa.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:plugins`                                                  | Smoke test di installazione/aggiornamento per percorso locale, `file:`, pacchetti del registro npm con dipendenze sollevate, riferimenti git mobili, fixture ClawHub, aggiornamenti del marketplace e abilitazione/ispezione del bundle Claude.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## Gate PR locale

Per i controlli locali di gate/integrazione delle PR, eseguire:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` presenta errori intermittenti su un host sovraccarico, rieseguirlo una volta prima di considerarlo una regressione, quindi isolarlo con `pnpm test <path/to/test>`. Per gli host con memoria limitata:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Strumenti per le prestazioni dei test

- `pnpm test:perf:imports`: abilita i report sulla durata delle importazioni e sulla loro ripartizione in Vitest, continuando a usare l'instradamento per lane con ambito definito per destinazioni esplicite di file/directory. `pnpm test:perf:imports:changed` limita la stessa profilazione ai file modificati rispetto a `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` esegue il benchmark del percorso instradato in modalità modifiche rispetto all'esecuzione nativa del progetto radice per la stessa differenza git sottoposta a commit; `pnpm test:perf:changed:bench -- --worktree` esegue il benchmark dell'insieme di modifiche dell'albero di lavoro corrente senza prima creare un commit.
- `pnpm test:perf:profile:main` scrive un profilo CPU per il thread principale di Vitest (`.artifacts/vitest-main-profile`); `pnpm test:perf:profile:runner` scrive profili CPU + heap per il runner dei test unitari (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: esegue in serie ogni configurazione foglia Vitest della suite completa e scrive i dati raggruppati sulla durata, oltre agli artefatti JSON/log per configurazione. Per impostazione predefinita, i report della suite completa isolano i file affinché i grafi dei moduli conservati e le pause del GC dovute ai file precedenti non vengano attribuiti alle asserzioni successive; passare `-- --no-isolate` solo quando si profila intenzionalmente l'accumulo nei worker condivisi. Il Test Performance Agent lo usa come riferimento di base prima di tentare correzioni dei test lenti. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` confronta i report raggruppati dopo una modifica incentrata sulle prestazioni.
- Le esecuzioni complete, delle estensioni e degli shard basati su pattern di inclusione aggiornano i dati locali sulle tempistiche in `.artifacts/vitest-shard-timings.json`; le successive esecuzioni dell'intera configurazione usano tali tempistiche per bilanciare gli shard lenti e veloci. Gli shard CI basati su pattern di inclusione aggiungono il nome dello shard alla chiave delle tempistiche, mantenendo visibili le tempistiche degli shard filtrati senza sostituire i dati delle tempistiche dell'intera configurazione. Impostare `OPENCLAW_TEST_PROJECTS_TIMINGS=0` per ignorare l'artefatto locale delle tempistiche.

## Benchmark

<Accordion title="Latenza del modello (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

Variabili di ambiente facoltative: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`. Prompt predefinito: "Rispondi con una sola parola: ok. Nessuna punteggiatura o testo aggiuntivo."

</Accordion>

<Accordion title="Avvio della CLI (scripts/bench-cli-startup.ts)">

```bash
pnpm test:startup:bench
pnpm test:startup:bench:smoke
pnpm test:startup:bench:save
pnpm test:startup:bench:update
pnpm test:startup:bench:check
pnpm tsx scripts/bench-cli-startup.ts --runs 12
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3
pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all
```

Preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: entrambi i preset combinati

L'output include `sampleCount`, media, p50, p95, minimo/massimo, distribuzione dei codici di uscita/segnali e RSS massimo per comando. `--cpu-prof-dir` / `--heap-prof-dir` scrivono i profili V8 per ogni esecuzione.

Output salvato: `pnpm test:startup:bench:smoke` scrive `.artifacts/cli-startup-bench-smoke.json`; `pnpm test:startup:bench:save` scrive `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`). Fixture archiviata nel repository: `test/fixtures/cli-startup-bench.json`, aggiornata da `pnpm test:startup:bench:update`, confrontata da `pnpm test:startup:bench:check`.

</Accordion>

<Accordion title="Avvio del Gateway (scripts/bench-gateway-startup.ts)">

Per impostazione predefinita usa il punto di ingresso della CLI compilata in `dist/entry.js`; eseguire prima `pnpm build`. Passare `--entry scripts/run-node.mjs` per misurare invece il runner del codice sorgente e mantenere tali risultati separati dalle baseline del punto di ingresso compilato.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

ID dei casi: `default`, `skipChannels` (avvio dei canali ignorato), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 Plugin manifest), `fiftyStartupLazyPlugins` (50 Plugin manifest con caricamento differito all'avvio).

L'output include il primo output del processo, `/healthz`, `/readyz`, il tempo del log di ascolto HTTP, il tempo del log di disponibilità del Gateway, il tempo CPU, il rapporto dei core CPU, l'RSS massimo, l'heap, le metriche di traccia dell'avvio, il ritardo del ciclo degli eventi e le metriche dettagliate della tabella di ricerca dei Plugin. Lo script imposta `OPENCLAW_GATEWAY_STARTUP_TRACE=1` nell'ambiente del Gateway figlio.

`/healthz` indica la vitalità (il server HTTP può rispondere). `/readyz` indica la disponibilità operativa (i sidecar dei Plugin di avvio, i canali e le operazioni successive al collegamento critiche per la disponibilità si sono stabilizzati). Gli hook di avvio vengono eseguiti in modo asincrono e non fanno parte della garanzia di disponibilità. Il tempo del log di disponibilità è il timestamp interno del Gateway, utile per l'attribuzione lato processo, ma non sostituisce il probe esterno `/readyz`.

Usare l'output JSON o `--output` per confrontare le modifiche. Usare `--cpu-prof-dir` solo dopo che l'output della traccia indica operazioni di importazione, compilazione o vincolate dalla CPU che le sole tempistiche delle fasi non riescono a spiegare.

</Accordion>

<Accordion title="Riavvio del Gateway (scripts/bench-gateway-restart.ts)">

Solo macOS e Linux (usa SIGUSR1 per i riavvii all'interno del processo; non riesce immediatamente su Windows). Stesso punto di ingresso compilato predefinito e stessa sostituzione `--entry scripts/run-node.mjs` dell'avvio del Gateway precedente.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

ID dei casi: `skipChannels`, `skipChannelsAcpxProbe` (probe di avvio ACPX attivo), `skipChannelsNoAcpxProbe` (probe disattivato), `default`, `fiftyPlugins`.

L'output include il successivo `/healthz`, il successivo `/readyz`, il tempo di inattività, la tempistica di disponibilità dopo il riavvio, la CPU, l'RSS, le metriche di traccia dell'avvio per il processo sostitutivo e le metriche di traccia del riavvio per la gestione dei segnali, lo svuotamento delle operazioni attive, le fasi di chiusura, l'avvio successivo, la tempistica di disponibilità e le istantanee della memoria. Lo script imposta `OPENCLAW_GATEWAY_STARTUP_TRACE=1` e `OPENCLAW_GATEWAY_RESTART_TRACE=1`.

Usare questo benchmark quando una modifica interessa la segnalazione del riavvio, i gestori di chiusura, l'avvio dopo il riavvio, l'arresto dei sidecar, il passaggio di consegne del servizio o la disponibilità dopo il riavvio. Iniziare con `skipChannels` per isolare i meccanismi del Gateway dall'avvio dei canali; usare `default` o i casi con molti Plugin solo dopo che il caso ristretto ha chiarito il percorso di riavvio. Le metriche di traccia sono indicazioni per l'attribuzione, non verdetti: valutare una modifica al riavvio in base a più campioni, all'intervallo del proprietario corrispondente, al comportamento di `/healthz`/`/readyz` e al contratto di riavvio visibile all'utente.

</Accordion>

## E2E dell'onboarding (Docker)

Facoltativo; necessario solo per gli smoke test dell'onboarding in container. Flusso completo di avvio a freddo in un container Linux pulito:

```bash
scripts/e2e/onboard-docker.sh
```

Controlla la procedura guidata interattiva tramite uno pseudo-TTY, verifica i file di configurazione, dell'area di lavoro e della sessione, quindi avvia il Gateway ed esegue `openclaw health`.

## Smoke test dell'importazione QR (Docker)

Garantisce che l'helper di runtime QR mantenuto venga caricato nei runtime Docker Node supportati (Node 24 predefinito, compatibile con Node 22):

```bash
pnpm test:docker:qr
```

## Contenuti correlati

- [Test](/it/help/testing)
- [Test in tempo reale](/it/help/testing-live)
- [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins)
