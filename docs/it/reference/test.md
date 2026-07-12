---
read_when:
    - Esecuzione o correzione dei test
summary: Come eseguire i test localmente (vitest) e quando usare le modalità force/coverage
title: Test
x-i18n:
    generated_at: "2026-07-12T07:30:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63806ea72da1579f4aa0b92c14a6d2d3e67990d6c10cb6d9b1b2bb4a63c8e140
    source_path: reference/test.md
    workflow: 16
---

- Kit completo per i test (suite, live, Docker): [Test](/it/help/testing)
- Validazione degli aggiornamenti e dei pacchetti dei plugin: [Test di aggiornamenti e plugin](/it/help/testing-updates-plugins)

## Impostazione predefinita dell'agente

Le sessioni dell'agente eseguono da remoto, tramite Crabbox, i test e le convalide
ad alta intensità di calcolo. Per il codice attendibile dei manutentori viene usato
per impostazione predefinita Blacksmith Testbox. Il flusso di lavoro Testbox
configurato carica le credenziali, pertanto il codice non attendibile di collaboratori
o fork deve invece usare la CI del fork senza segreti oppure un'istanza AWS Crabbox
diretta e sanificata.

Quando è probabile che un'attività su codice attendibile richieda test o verifiche
onerose, esegui immediatamente il preriscaldamento in una sessione di comandi in
background, continua a lavorare durante il caricamento, riutilizza l'ID `tbx_...`
restituito, sincronizza il checkout corrente a ogni esecuzione e arrestalo prima
del passaggio di consegne:

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Dopo il primo riutilizzo riuscito, il wrapper registra la base del lease, le
dipendenze e l'impronta digitale del flusso di lavoro Testbox in
`.crabbox/testbox-leases/`. Le modifiche limitate al codice sorgente continuano
a riutilizzare l'ambiente preriscaldato. Una modifica alla base di merge, al
lockfile, all'input del gestore di pacchetti, al wrapper o al flusso di lavoro
Testbox causa un arresto sicuro e richiede un nuovo lease. Ogni esecuzione
continua comunque a sincronizzare il checkout corrente.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` è destinato esclusivamente alla diagnostica
intenzionale, non alle verifiche di rilascio.

I comandi di test locali riportati di seguito sono destinati ai flussi di lavoro
umani o a un fallback esplicito dell'agente richiesto dall'utente. L'indisponibilità
del provider remoto deve essere segnalata; non autorizza l'esecuzione silenziosa
di un controllo locale esteso.

Per il codice non attendibile, esegui il preriscaldamento con `--provider aws`.
Ogni esecuzione deve impostare `CRABBOX_ENV_ALLOW=CI`, passare
`--provider aws --no-hydrate` e usare una nuova directory `HOME` remota
temporanea prima di installare le dipendenze o eseguire i test. Usa un lease
appena preriscaldato e dedicato a quella sorgente non attendibile; non riutilizzare
mai un lease attendibile o caricato in precedenza. Avvia un binario Crabbox
attendibile già installato da un checkout pulito e attendibile di `main` e recupera
solo la PR remota con `--fresh-pr`; non eseguire mai localmente il wrapper o la
configurazione del checkout non attendibile. Rimuovi l'impostazione di
`CRABBOX_AWS_INSTANCE_PROFILE` e applica un arresto sicuro a meno che il valore
risolto di `aws.instanceProfile` non sia vuoto. Prima di qualsiasi installazione
o test, usa strumenti attendibili con percorso assoluto per richiedere un token
IMDSv2, dimostrare che l'endpoint delle credenziali IAM restituisce 404 e verificare
che il valore remoto di `git rev-parse HEAD` corrisponda allo SHA completo
dell'HEAD della PR revisionata. Associa il lease a tale SHA e arrestalo oppure
preriscaldalo nuovamente quando l'HEAD cambia. Carica lo script attendibile
`scripts/crabbox-untrusted-bootstrap.sh` da un `main` pulito insieme a
`--fresh-pr`; installa le versioni bloccate di Node/pnpm, verifica lo SHA e il
blocco del gestore di pacchetti, isola `HOME`, installa le dipendenze e quindi
esegue il test richiesto. Se il broker non può dimostrare l'assenza di un ruolo
o non esiste una PR remota, usa la CI del fork senza segreti. Non usare
`hydrate-github`, `--no-sync` o un flusso di lavoro Testbox con credenziali
caricate.
Rimuovi tutte le impostazioni sostitutive `CRABBOX_TAILSCALE*`, forza
`--network public --tailscale=false`, azzera i flag del nodo di uscita/LAN e
richiedi che `crabbox inspect` segnali una rete pubblica senza stato Tailscale
prima di caricare qualsiasi script.

## Ordine locale di routine

1. `pnpm test:changed` per la verifica Vitest limitata alle modifiche.
2. `pnpm test <path-or-filter>` per un singolo file, una directory o una destinazione esplicita.
3. `pnpm test` solo quando è intenzionalmente necessaria l'intera suite Vitest locale.

In un worktree Codex o in un checkout collegato/sparso, gli agenti evitano
l'esecuzione locale diretta di `pnpm test*` / `pnpm check*` / `pnpm crabbox:run`:

- Fallback locale richiesto esplicitamente dall'utente per un file di piccole dimensioni:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- Controlli sulle modifiche o verifiche estese: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`, affinché pnpm venga eseguito all'interno di Testbox.
- L'`exitCode` finale del wrapper e il JSON delle tempistiche costituiscono il risultato del comando. Un'esecuzione delegata di Blacksmith GitHub Actions può risultare `cancelled` dopo un comando SSH riuscito, perché Testbox viene arrestata dall'esterno dell'azione di mantenimento attivo; controlla il riepilogo del wrapper e l'output del comando prima di considerarlo un errore.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: mantiene la serializzazione dei controlli onerosi all'interno del worktree corrente anziché nella directory Git comune per comandi quali `pnpm check:changed` e `pnpm test ...` mirati. Usalo solo su host locali ad alta capacità quando esegui intenzionalmente controlli indipendenti tra worktree collegati.

## Comandi principali

Le esecuzioni del wrapper di test terminano con un breve riepilogo `[test] passed|failed|skipped ... in ...`; la riga della durata di Vitest rimane il dettaglio relativo al singolo shard.

| Comando                                           | Funzione                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | Le destinazioni esplicite di file/directory vengono instradate attraverso corsie Vitest con ambito specifico. Le esecuzioni senza destinazione verificano l'intera suite: i gruppi fissi di shard vengono espansi in configurazioni foglia per l'esecuzione parallela locale e il fan-out previsto degli shard viene stampato prima dell'avvio. Il gruppo delle estensioni viene sempre espanso in configurazioni di shard per singola estensione anziché in un unico enorme processo del progetto radice. |
| `pnpm test:changed`                               | Esecuzione intelligente ed economica dei test relativi alle modifiche: destinazioni precise ricavate dalle modifiche dirette ai test, dai file `*.test.ts` adiacenti, dalle mappature esplicite del codice sorgente e dal grafo locale delle importazioni. Le modifiche estese, di configurazione o dei pacchetti vengono ignorate, salvo che possano essere associate a test precisi.                                                                                                                     |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | Esecuzione esplicita ed estesa dei test relativi alle modifiche; usala quando una modifica a un'infrastruttura di test, una configurazione o un pacchetto deve ricorrere al comportamento più ampio di Vitest per i test delle modifiche.                                                                                                                                                                                                              |
| `pnpm test:force`                                 | Libera la porta configurata del Gateway OpenClaw (valore predefinito `18789`), quindi esegue l'intera suite con una porta Gateway isolata, affinché i test del server non entrino in conflitto con un'istanza in esecuzione.                                                                                                                                                                          |
| `pnpm test:coverage`                              | Genera un rapporto informativo sulla copertura V8 per la corsia di unit test predefinita (`vitest.unit.config.ts`); non vengono applicate soglie di copertura.                                                                                                                                                                                                                   |
| `pnpm test:coverage:changed`                      | Copertura degli unit test limitata ai file modificati rispetto a `origin/main`.                                                                                                                                                                                                                                                                                             |
| `pnpm changed:lanes`                              | Mostra le corsie architetturali attivate dalle differenze rispetto a `origin/main`.                                                                                                                                                                                                                                                                            |
| `pnpm check:changed`                              | Delega per impostazione predefinita a Crabbox/Testbox al di fuori della CI, quindi esegue nel processo figlio remoto il controllo intelligente delle modifiche: formattazione, controllo dei tipi, lint e comandi di protezione per le corsie interessate. Non esegue Vitest; usa `pnpm test:changed` o `pnpm test <target>` per la verifica tramite test.                                                                      |

## Stato di test condiviso e helper dei processi

- `src/test-utils/openclaw-test-state.ts`: usalo da Vitest quando un test necessita di una directory `HOME` isolata, di `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, di una fixture di configurazione, di uno spazio di lavoro, di una directory dell'agente o di un archivio dei profili di autenticazione.
- `pnpm test:env-mutations:report`: rapporto non bloccante sui test e sulle infrastrutture di test che modificano direttamente `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` o chiavi di ambiente correlate. Usalo per individuare i candidati alla migrazione verso l'helper condiviso dello stato di test.
- `test/helpers/openclaw-test-instance.ts`: per i test E2E a livello di processo che richiedono un Gateway in esecuzione, l'ambiente della CLI, l'acquisizione dei log e la pulizia in un'unica posizione.
- Le corsie E2E Docker/Bash che importano `scripts/lib/docker-e2e-image.sh` possono passare `docker_e2e_test_state_shell_b64 <label> <scenario>` al container e decodificarlo con `scripts/lib/openclaw-e2e-instance.sh`; gli script con più directory home possono passare `docker_e2e_test_state_function_b64` e chiamare `openclaw_test_state_create <label> <scenario>` in ciascun flusso. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` scrive un file di ambiente dell'host importabile (il `--` prima di `create` impedisce ai runtime Node più recenti di interpretare `--env-file` come un flag di Node). Le corsie che avviano un Gateway possono importare `scripts/lib/openclaw-e2e-instance.sh` per la risoluzione dell'entrypoint, l'avvio del mock OpenAI, l'esecuzione in primo piano o in background, i controlli di disponibilità, l'esportazione delle variabili di ambiente dello stato, i dump dei log e la pulizia dei processi.

## Corsie di Control UI, TUI ed estensioni

- **E2E con Control UI simulata:** `pnpm test:ui:e2e` esegue la corsia Vitest + Playwright che avvia la Control UI Vite e pilota una pagina Chromium reale usando un WebSocket Gateway simulato. I test si trovano in `ui/src/**/*.e2e.test.ts`; le simulazioni e i controlli condivisi si trovano in `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` include questa corsia. Le esecuzioni degli agenti usano Testbox/Crabbox per impostazione predefinita, inclusa la verifica mirata; usare `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` solo come ripiego locale esplicito.
- **Test PTY della TUI:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` esegue la corsia PTY veloce con backend simulato. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` oppure `pnpm tui:pty:test:watch --mode local` esegue lo smoke test più lento di `tui --local`, che simula solo l'endpoint esterno del modello. Verificare testo visibile stabile o chiamate alle fixture, non snapshot ANSI grezzi.
- `pnpm test:extensions` e `pnpm test extensions` eseguono tutti gli shard delle estensioni/dei plugin. I plugin di canale pesanti, il plugin del browser e OpenAI vengono eseguiti come shard dedicati; gli altri gruppi di plugin restano raggruppati. `pnpm test extensions/<id>` esegue la corsia di un singolo plugin incluso.
- I file sorgente con test adiacenti vengono associati a questi ultimi prima di ricorrere a glob di directory più ampi. Le modifiche agli helper in `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` e `src/plugins/contracts` usano un grafo locale delle importazioni per eseguire i test che li importano, anziché eseguire indiscriminatamente ogni shard quando il percorso delle dipendenze è preciso.
- Le destinazioni delle directory dei contratti si distribuiscono sulle rispettive corsie: `pnpm test src/channels/plugins/contracts` esegue le quattro configurazioni dei contratti di canale e `pnpm test src/plugins/contracts` esegue la configurazione dei contratti dei plugin, poiché i progetti generici `channels`/`plugins` escludono `contracts/**`.
- `auto-reply` è suddiviso in tre configurazioni dedicate (`core`, `top-level`, `reply`), così l'infrastruttura di test delle risposte non prevale sui test più leggeri di stato, token e helper di primo livello.
- I file di test selezionati di `plugin-sdk` e `commands` vengono instradati attraverso corsie leggere dedicate che mantengono solo `test/setup.ts`, lasciando i casi che richiedono maggiormente il runtime nelle corsie esistenti.
- La configurazione Vitest di base usa per impostazione predefinita `pool: "threads"` e `isolate: false`, con il runner condiviso non isolato abilitato in tutte le configurazioni del repository.
- `pnpm test:channels` esegue `vitest.channels.config.ts`.

## Gateway ed E2E

- L'integrazione del Gateway è facoltativa: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` oppure `pnpm test:gateway`.
- `pnpm test:e2e`: aggregato E2E del repository = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: smoke test end-to-end del Gateway (associazione WS/HTTP/Node con più istanze). Usa per impostazione predefinita `threads` + `isolate: false` con worker adattivi in `vitest.e2e.config.ts`; regolare con `OPENCLAW_E2E_WORKERS=<n>` e abilitare i log dettagliati con `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: test live dei provider (Claude/Minimax/DeepSeek/z.ai/ecc., controllati da `*.live.test.ts`). Richiede chiavi API e `LIVE=1` (oppure `OPENCLAW_LIVE_TEST=1`) per non essere ignorato; output dettagliato con `OPENCLAW_LIVE_TEST_QUIET=0`.

## Suite Docker completa (`pnpm test:docker:all`)

Crea l'immagine condivisa per i test live, impacchetta OpenClaw una sola volta come tarball npm, crea o riutilizza un'immagine runner Node/Git essenziale e un'immagine funzionale che installa il tarball in `/app`, quindi esegue le corsie di smoke test Docker tramite uno scheduler ponderato. `scripts/package-openclaw-for-docker.mjs` è l'unico strumento locale/CI per creare il pacchetto e convalida il tarball insieme a `dist/postinstall-inventory.json` prima che Docker lo utilizzi.

- Immagine essenziale (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): corsie per programma di installazione, aggiornamento e dipendenze dei plugin; monta il tarball precompilato invece delle sorgenti del repository copiate.
- Immagine funzionale (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): corsie della normale funzionalità dell'applicazione compilata.
- Definizioni delle corsie: `scripts/lib/docker-e2e-scenarios.mjs`. Pianificatore: `scripts/lib/docker-e2e-plan.mjs`. Esecutore: `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json` genera il piano CI gestito dallo scheduler (corsie, tipi di immagine, requisiti di pacchetto/immagine live, scenari di stato, controlli delle credenziali) senza creare o eseguire Docker.

Parametri di pianificazione (variabili d'ambiente, valori predefiniti tra parentesi):

| Variabile d'ambiente                                                                                             | Valore predefinito  | Scopo                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | Slot dei processi.                                                                                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | Pool finale sensibile ai provider.                                                                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | Limite delle corsie pesanti dei provider live.                                                                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | Limite delle corsie che usano risorse npm.                                                                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | Limite delle corsie che usano risorse di servizio.                                                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | Limiti delle corsie pesanti per ciascun provider.                                                                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | Limiti più restrittivi per ciascun provider.                                                                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | Sostituzioni per host più grandi.                                                                                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | Ritardo tra gli avvii delle corsie, per evitare picchi di creazione nel daemon Docker locale.                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 min) | Timeout di ripiego per ciascuna corsia; alcune corsie live/finali selezionate usano limiti più restrittivi.                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | Nuovi tentativi per errori temporanei dei provider live.                                                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | off                 | Stampa il manifesto delle corsie senza eseguire Docker.                                                                                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | Intervallo di stampa dello stato delle corsie attive.                                                                                                                                                                                                                                                                                                   |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | on                  | Riutilizza `.artifacts/docker-tests/lane-timings.json` per l'ordinamento dalla durata maggiore alla minore; impostare su `0` per disabilitarlo.                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` solo per corsie deterministiche/locali, `only` solo per corsie dei provider live. Alias: `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. La modalità solo live unisce le corsie live principali e finali in un unico pool ordinato dalla durata maggiore alla minore, così i gruppi dei provider combinano il lavoro di Claude/Codex/Gemini. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | Timeout di configurazione Docker del backend della CLI.                                                                                                                                                                                                                                                                                                |

Il modello delle variabili d'ambiente per i limiti delle risorse è `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` (nome della risorsa in maiuscolo, caratteri non alfanumerici convertiti in `_`).

Altro comportamento: per impostazione predefinita, il runner esegue i controlli preliminari di Docker, rimuove i container E2E obsoleti di OpenClaw, condivide le cache degli strumenti CLI dei provider tra corsie compatibili e interrompe la pianificazione di nuove corsie nel pool dopo il primo errore, a meno che non sia impostato `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`. Se una corsia supera il limite effettivo di peso/risorse su un host con basso parallelismo, può comunque avviarsi da un pool vuoto ed essere eseguita da sola finché non libera capacità. I log per corsia, `summary.json`, `failures.json` e le tempistiche delle fasi vengono scritti in `.artifacts/docker-tests/<run-id>/`; usa `pnpm test:docker:timings <summary.json>` per individuare le corsie lente e `pnpm test:docker:rerun <run-id|summary.json|failures.json>` per stampare comandi economici per riesecuzioni mirate.

### Corsie Docker rilevanti

| Comando                                                                     | Verifica                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Container E2E sorgente basato su Chromium con CDP grezzo e Gateway isolato; le istantanee dei ruoli CDP di `browser doctor --deep` includono gli URL dei collegamenti, gli elementi cliccabili promossi dal cursore, i riferimenti agli iframe e i metadati dei frame.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:skill-install`                                            | Installa il tarball pacchettizzato in un runner Docker essenziale con `skills.install.allowUploadedArchives: false`, risolve lo slug attuale di una skill tramite la ricerca ClawHub in tempo reale, esegue l'installazione tramite `openclaw skills install` e verifica `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` e `skills info --json`.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | Sonde in tempo reale mirate per il backend CLI; Gemini dispone di alias `:resume` e `:mcp` equivalenti.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test:docker:openwebui`                                                | OpenClaw + Open WebUI in Docker: esegue l'accesso, controlla `/api/models` e avvia una chat reale tramite proxy attraverso `/api/chat/completions`. Richiede una chiave valida per un modello in tempo reale e scarica un'immagine esterna; non è previsto che sia stabile in CI quanto le suite di test unitari/E2E.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:mcp-channels`                                             | Container Gateway con dati iniziali più un container client che avvia `openclaw mcp serve`: rilevamento delle conversazioni instradate, lettura delle trascrizioni, metadati degli allegati, comportamento della coda degli eventi in tempo reale, instradamento degli invii in uscita e notifiche in stile Claude relative a canali e autorizzazioni attraverso il bridge stdio reale (l'asserzione legge direttamente i frame MCP stdio grezzi).                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm test:docker:upgrade-survivor`                                         | Installa il tarball pacchettizzato su una fixture sporca di un vecchio utente, esegue l'aggiornamento del pacchetto e doctor in modalità non interattiva senza chiavi attive di provider/canali, avvia un Gateway local loopback e verifica che agenti, configurazione dei canali, elenchi di consentiti dei Plugin, file dell'area di lavoro e delle sessioni, stato obsoleto delle dipendenze dei Plugin precedenti, avvio e stato RPC rimangano integri.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:published-upgrade-survivor`                               | Installa `openclaw@latest` per impostazione predefinita, predispone file realistici di un utente esistente, configura tramite una procedura integrata basata su `openclaw config set`, aggiorna al tarball pacchettizzato, esegue doctor in modalità non interattiva, scrive `.artifacts/upgrade-survivor/summary.json` e controlla `/healthz`, `/readyz` e lo stato RPC. Esegui l'override con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, amplia una matrice con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` oppure aggiungi fixture di scenario con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` (include `configured-plugin-installs` e `stale-source-plugin-shadow`). Package Acceptance espone questi valori come `published_upgrade_survivor_baseline(s)` / `_scenarios` e risolve meta-token come `last-stable-4` o `all-since-2026.4.23`. |
| `pnpm test:docker:update-migration`                                         | Harness di sopravvivenza agli aggiornamenti pubblicati nello scenario `plugin-deps-cleanup`, a partire da `openclaw@2026.4.23` per impostazione predefinita. Il flusso di lavoro `Update Migration` lo amplia con `baselines=all-since-2026.4.23` per dimostrare la pulizia delle dipendenze dei Plugin configurati al di fuori della CI di rilascio completa.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:plugins`                                                  | Test rapido di installazione/aggiornamento per percorsi locali, `file:`, pacchetti del registro npm con dipendenze sollevate, riferimenti git mobili, fixture ClawHub, aggiornamenti del marketplace e abilitazione/ispezione dei bundle Claude.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## Gate locale per le PR

Per i controlli locali di gate/integrazione delle PR, esegui:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` presenta errori intermittenti su un host sotto carico, eseguilo nuovamente una volta prima di considerarli una regressione, quindi isola il problema con `pnpm test <path/to/test>`. Per gli host con memoria limitata:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Strumenti per le prestazioni dei test

- `pnpm test:perf:imports`: abilita i report di Vitest sulla durata e sulla ripartizione delle importazioni, continuando a usare l’instradamento per corsie con ambito definito per destinazioni esplicite di file/directory. `pnpm test:perf:imports:changed` limita la stessa profilazione ai file modificati rispetto a `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta le prestazioni del percorso instradato in modalità modifiche con l’esecuzione nativa del progetto radice per la stessa differenza Git già sottoposta a commit; `pnpm test:perf:changed:bench -- --worktree` misura le prestazioni dell’insieme di modifiche attuale dell’albero di lavoro senza richiedere prima un commit.
- `pnpm test:perf:profile:main` scrive un profilo CPU per il thread principale di Vitest (`.artifacts/vitest-main-profile`); `pnpm test:perf:profile:runner` scrive profili CPU e heap per l’esecutore dei test unitari (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: esegue in serie ogni configurazione foglia di Vitest dell’intera suite e scrive i dati raggruppati sulla durata, oltre agli artefatti JSON e di log per ciascuna configurazione. Per impostazione predefinita, i report dell’intera suite isolano i file, affinché i grafi dei moduli conservati e le pause di GC dovute ai file precedenti non siano addebitati alle asserzioni successive; passa `-- --no-isolate` solo quando intendi profilare deliberatamente l’accumulo nel worker condiviso. L’agente per le prestazioni dei test usa questo risultato come riferimento iniziale prima di tentare correzioni ai test lenti. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` confronta i report raggruppati dopo una modifica incentrata sulle prestazioni.
- Le esecuzioni suddivise in shard complete, delle estensioni e basate su un modello di inclusione aggiornano i dati locali sulle tempistiche in `.artifacts/vitest-shard-timings.json`; le successive esecuzioni dell’intera configurazione usano queste tempistiche per bilanciare gli shard lenti e veloci. Gli shard CI basati su un modello di inclusione aggiungono il nome dello shard alla chiave delle tempistiche, mantenendo visibili le tempistiche degli shard filtrati senza sostituire i dati sulle tempistiche dell’intera configurazione. Imposta `OPENCLAW_TEST_PROJECTS_TIMINGS=0` per ignorare l’artefatto locale delle tempistiche.

## Benchmark

<Accordion title="Latenza del modello (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

Variabili di ambiente facoltative: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`. Prompt predefinito: "Rispondi con una sola parola: ok. Nessun segno di punteggiatura o testo aggiuntivo."

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

Preimpostazioni:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: entrambe le preimpostazioni combinate

L’output include `sampleCount`, media, p50, p95, minimo/massimo, distribuzione dei codici di uscita/segnali e RSS massimo per comando. `--cpu-prof-dir` / `--heap-prof-dir` scrivono i profili V8 per ciascuna esecuzione.

Output salvato: `pnpm test:startup:bench:smoke` scrive `.artifacts/cli-startup-bench-smoke.json`; `pnpm test:startup:bench:save` scrive `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`). Fixture inclusa nel repository: `test/fixtures/cli-startup-bench.json`, aggiornata da `pnpm test:startup:bench:update` e confrontata da `pnpm test:startup:bench:check`.

</Accordion>

<Accordion title="Avvio del Gateway (scripts/bench-gateway-startup.ts)">

Per impostazione predefinita usa il punto di ingresso della CLI compilata in `dist/entry.js`; esegui prima `pnpm build`. Passa `--entry scripts/run-node.mjs` per misurare invece l’esecutore del codice sorgente e mantieni questi risultati separati dai riferimenti del punto di ingresso compilato.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

Identificatori dei casi: `default`, `skipChannels` (avvio dei canali ignorato), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 Plugin manifest), `fiftyStartupLazyPlugins` (50 Plugin manifest caricati in modo differito all’avvio).

L’output include il primo output del processo, `/healthz`, `/readyz`, l’ora del log di ascolto HTTP, l’ora del log di disponibilità del Gateway, il tempo CPU, il rapporto dei core CPU, l’RSS massimo, l’heap, le metriche di tracciamento dell’avvio, il ritardo del ciclo degli eventi e le metriche dettagliate della tabella di ricerca dei Plugin. Lo script imposta `OPENCLAW_GATEWAY_STARTUP_TRACE=1` nell’ambiente del Gateway figlio.

`/healthz` indica l’operatività di base (il server HTTP può rispondere). `/readyz` indica la disponibilità effettiva all’uso (i sidecar dei Plugin di avvio, i canali e le attività successive al collegamento critiche per la disponibilità si sono stabilizzati). Gli hook di avvio vengono eseguiti in modo asincrono e non fanno parte della garanzia di disponibilità. L’ora del log di disponibilità è il timestamp interno del Gateway, utile per l’attribuzione lato processo ma non sostituisce il controllo esterno `/readyz`.

Usa l’output JSON o `--output` quando confronti le modifiche. Usa `--cpu-prof-dir` solo dopo che l’output di tracciamento ha individuato attività legate all’importazione, alla compilazione o vincolate dalla CPU che le sole tempistiche delle fasi non riescono a spiegare.

</Accordion>

<Accordion title="Riavvio del Gateway (scripts/bench-gateway-restart.ts)">

Solo macOS e Linux (usa SIGUSR1 per i riavvii interni al processo; termina immediatamente con un errore su Windows). Usa lo stesso punto di ingresso compilato predefinito e la stessa sostituzione `--entry scripts/run-node.mjs` dell’avvio del Gateway descritto sopra.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

Identificatori dei casi: `skipChannels`, `skipChannelsAcpxProbe` (controllo di avvio ACPX attivo), `skipChannelsNoAcpxProbe` (controllo disattivato), `default`, `fiftyPlugins`.

L’output include il successivo `/healthz`, il successivo `/readyz`, il tempo di inattività, le tempistiche di disponibilità dopo il riavvio, CPU, RSS, le metriche di tracciamento dell’avvio per il processo sostitutivo e le metriche di tracciamento del riavvio per la gestione dei segnali, l’esaurimento delle attività in corso, le fasi di chiusura, l’avvio successivo, le tempistiche di disponibilità e le istantanee della memoria. Lo script imposta `OPENCLAW_GATEWAY_STARTUP_TRACE=1` e `OPENCLAW_GATEWAY_RESTART_TRACE=1`.

Usa questo benchmark quando una modifica interessa la segnalazione del riavvio, i gestori di chiusura, l’avvio successivo al riavvio, l’arresto dei sidecar, il passaggio di consegne del servizio o la disponibilità dopo il riavvio. Inizia con `skipChannels` per isolare i meccanismi del Gateway dall’avvio dei canali; usa `default` o i casi con molti Plugin solo dopo che il caso circoscritto ha chiarito il percorso di riavvio. Le metriche di tracciamento sono indicazioni per l’attribuzione, non verdetti: valuta una modifica al riavvio sulla base di più campioni, dell’intervallo corrispondente del componente responsabile, del comportamento di `/healthz`/`/readyz` e del contratto di riavvio visibile all’utente.

</Accordion>

## Onboarding E2E (Docker)

Facoltativo; necessario solo per i test rapidi dell’onboarding in container. Flusso completo di avvio a freddo in un container Linux pulito:

```bash
scripts/e2e/onboard-docker.sh
```

Pilota la procedura guidata interattiva tramite uno pseudo-TTY, verifica i file di configurazione, dell’area di lavoro e della sessione, quindi avvia il Gateway ed esegue `openclaw health`.

## Test rapido dell’importazione QR (Docker)

Verifica che l’helper di runtime QR mantenuto venga caricato con i runtime Docker Node supportati (Node 24 predefinito, compatibile con Node 22):

```bash
pnpm test:docker:qr
```

## Correlati

- [Test](/it/help/testing)
- [Test in ambiente reale](/it/help/testing-live)
- [Test di aggiornamenti e Plugin](/it/help/testing-updates-plugins)
