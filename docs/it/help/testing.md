---
read_when:
    - Eseguire i test in locale o in CI
    - Aggiungere regressioni per bug di modello/provider
    - Eseguire il debug del comportamento del Gateway + dell'agente
summary: 'Kit di test: suite unit/e2e/live, runner Docker e cosa copre ciascun test'
title: Testირება
x-i18n:
    generated_at: "2026-04-21T08:24:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3290113f28dab37f4b6ceb0bda6ced70c7d2b24ad3fccac6488b6aab1ad65e52
    source_path: help/testing.md
    workflow: 15
---

# Test

OpenClaw ha tre suite Vitest (unit/integration, e2e, live) e un piccolo insieme di runner Docker.

Questa documentazione è una guida al “come testiamo”:

- Cosa copre ciascuna suite, e cosa deliberatamente _non_ copre
- Quali comandi eseguire per i flussi di lavoro comuni (locale, pre-push, debug)
- Come i test live individuano le credenziali e selezionano modelli/provider
- Come aggiungere regressioni per problemi reali di modelli/provider

## Avvio rapido

Nella maggior parte dei giorni:

- Gate completo (atteso prima del push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Esecuzione locale più veloce dell'intera suite su una macchina capiente: `pnpm test:max`
- Loop watch diretto di Vitest: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Preferisci prima esecuzioni mirate quando stai iterando su un singolo errore.
- Sito QA supportato da Docker: `pnpm qa:lab:up`
- Corsia QA supportata da VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando tocchi i test o vuoi maggiore sicurezza:

- Gate di copertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando esegui il debug di provider/modelli reali (richiede credenziali reali):

- Suite live (probe di modelli + strumenti/immagini Gateway): `pnpm test:live`
- Seleziona un solo file live in modalità silenziosa: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Smoke del costo Moonshot/Kimi: con `MOONSHOT_API_KEY` impostata, esegui
  `openclaw models list --provider moonshot --json`, poi esegui un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolato su `moonshot/kimi-k2.6`. Verifica che il JSON riporti Moonshot/K2.6 e che la
  trascrizione dell'assistente memorizzi `usage.cost` normalizzato.

Suggerimento: quando ti serve solo un caso in errore, preferisci restringere i test live tramite le variabili env di allowlist descritte sotto.

## Runner specifici per QA

Questi comandi affiancano le suite di test principali quando hai bisogno del realismo di qa-lab:

- `pnpm openclaw qa suite`
  - Esegue direttamente sull'host gli scenari QA supportati dal repo.
  - Esegue per impostazione predefinita in parallelo più scenari selezionati con worker
    Gateway isolati. `qa-channel` usa per impostazione predefinita concorrenza 4 (limitata
    dal numero di scenari selezionati). Usa `--concurrency <count>` per regolare il numero
    di worker, oppure `--concurrency 1` per la vecchia corsia seriale.
  - Termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
    vuoi gli artifact senza un codice di uscita di errore.
  - Supporta le modalità provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` avvia un server provider locale supportato da AIMock per copertura
    sperimentale di fixture e protocol-mock senza sostituire la corsia `mock-openai`
    orientata agli scenari.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA all'interno di una VM Linux Multipass usa e getta.
  - Mantiene lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
  - Riusa gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input auth QA supportati che sono pratici per il guest:
    chiavi provider basate su env, il percorso della configurazione del provider live QA e `CODEX_HOME` quando presente.
  - Le directory di output devono restare sotto la root del repo così il guest può riscrivere
    attraverso il workspace montato.
  - Scrive il normale report + riepilogo QA più i log Multipass sotto
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA supportato da Docker per attività QA in stile operatore.
- `pnpm test:docker:bundled-channel-deps`
  - Crea il pacchetto e installa l'attuale build OpenClaw in Docker, avvia il Gateway
    con OpenAI configurato, poi abilita Telegram e Discord tramite modifiche di configurazione.
  - Verifica che il primo riavvio del Gateway installi su richiesta le dipendenze runtime
    di ciascun plugin di canale bundled e che un secondo riavvio non reinstalli
    dipendenze già attivate.
- `pnpm openclaw qa aimock`
  - Avvia solo il server provider locale AIMock per smoke test diretti del protocollo.
- `pnpm openclaw qa matrix`
  - Esegue la corsia QA live Matrix contro un homeserver Tuwunel usa e getta supportato da Docker.
  - Questo host QA oggi è solo repo/dev. Le installazioni OpenClaw pacchettizzate non distribuiscono
    `qa-lab`, quindi non espongono `openclaw qa`.
  - I checkout del repo caricano direttamente il runner bundled; non serve alcun passaggio
    separato di installazione plugin.
  - Effettua il provisioning di tre utenti Matrix temporanei (`driver`, `sut`, `observer`) più una stanza privata, poi avvia un processo figlio QA gateway con il vero plugin Matrix come trasporto SUT.
  - Usa per impostazione predefinita l'immagine Tuwunel stabile fissata `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Sostituiscila con `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando devi testare un'immagine diversa.
  - Matrix non espone flag condivisi per la sorgente delle credenziali perché la corsia effettua localmente il provisioning di utenti usa e getta.
  - Scrive un report QA Matrix, un riepilogo, un artifact observed-events e un log di output combinato stdout/stderr sotto `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Esegue la corsia QA live Telegram contro un gruppo privato reale usando i token bot del driver e del SUT dall'env.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L'id del gruppo deve essere l'id numerico della chat Telegram.
  - Supporta `--credential-source convex` per credenziali condivise in pool. Usa la modalità env per impostazione predefinita, oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per aderire ai lease condivisi.
  - Termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
    vuoi gli artifact senza un codice di uscita di errore.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone uno username Telegram.
  - Per un'osservazione stabile bot-to-bot, abilita la Bot-to-Bot Communication Mode in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico dei bot nel gruppo.
  - Scrive un report QA Telegram, un riepilogo e un artifact observed-messages sotto `.artifacts/qa-e2e/...`.

Le corsie live di trasporto condividono un contratto standard così i nuovi trasporti non divergono:

`qa-channel` resta l'ampia suite QA sintetica e non fa parte della matrice di copertura del trasporto live.

| Corsia   | Canary | Gating delle menzioni | Blocco allowlist | Risposta top-level | Ripresa dopo riavvio | Follow-up nel thread | Isolamento del thread | Osservazione delle reazioni | Comando help |
| -------- | ------ | --------------------- | ---------------- | ------------------ | -------------------- | -------------------- | --------------------- | --------------------------- | ------------ |
| Matrix   | x      | x                     | x                | x                  | x                    | x                    | x                     | x                           |              |
| Telegram | x      |                       |                  |                    |                      |                      |                       |                             | x            |

### Credenziali Telegram condivise tramite Convex (v1)

Quando `--credential-source convex` (oppure `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) è abilitato per
`openclaw qa telegram`, QA lab acquisisce un lease esclusivo da un pool supportato da Convex, invia heartbeat
a quel lease mentre la corsia è in esecuzione e rilascia il lease allo spegnimento.

Scaffold di riferimento del progetto Convex:

- `qa/convex-credential-broker/`

Variabili env richieste:

- `OPENCLAW_QA_CONVEX_SITE_URL` (per esempio `https://your-deployment.convex.site`)
- Un secret per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione del ruolo delle credenziali:
  - CLI: `--credential-role maintainer|ci`
  - Predefinito env: `OPENCLAW_QA_CREDENTIAL_ROLE` (predefinito `ci` in CI, `maintainer` altrimenti)

Variabili env facoltative:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predefinito `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predefinito `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predefinito `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predefinito `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predefinito `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id di trace facoltativo)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex `http://` loopback per sviluppo locale soltanto.

`OPENCLAW_QA_CONVEX_SITE_URL` dovrebbe usare `https://` nel funzionamento normale.

I comandi admin del maintainer (aggiunta/rimozione/elenco del pool) richiedono
specificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI per i maintainer:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `--json` per output leggibile da macchina in script e utility CI.

Contratto endpoint predefinito (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Richiesta: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Successo: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esaurito/riprovabile: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Successo: `{ status: "ok" }` (oppure `2xx` vuoto)
- `POST /release`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Successo: `{ status: "ok" }` (oppure `2xx` vuoto)
- `POST /admin/add` (solo secret maintainer)
  - Richiesta: `{ kind, actorId, payload, note?, status? }`
  - Successo: `{ status: "ok", credential }`
- `POST /admin/remove` (solo secret maintainer)
  - Richiesta: `{ credentialId, actorId }`
  - Successo: `{ status: "ok", changed, credential }`
  - Guardia per lease attivo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo secret maintainer)
  - Richiesta: `{ kind?, status?, includePayload?, limit? }`
  - Successo: `{ status: "ok", credentials, count }`

Forma del payload per il tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve essere una stringa id numerica di chat Telegram.
- `admin/add` convalida questa forma per `kind: "telegram"` e rifiuta payload malformati.

### Aggiungere un canale a QA

Aggiungere un canale al sistema QA Markdown richiede esattamente due cose:

1. Un adapter di trasporto per il canale.
2. Un pacchetto di scenari che eserciti il contratto del canale.

Non aggiungere una nuova root di comando QA top-level quando l'host condiviso `qa-lab` può
gestire il flusso.

`qa-lab` possiede la meccanica condivisa dell'host:

- la root di comando `openclaw qa`
- avvio e teardown della suite
- concorrenza dei worker
- scrittura degli artifact
- generazione dei report
- esecuzione degli scenari
- alias di compatibilità per i vecchi scenari `qa-channel`

I plugin runner possiedono il contratto di trasporto:

- come `openclaw qa <runner>` viene montato sotto la root condivisa `qa`
- come il Gateway viene configurato per quel trasporto
- come viene verificata la disponibilità
- come vengono iniettati gli eventi in ingresso
- come vengono osservati i messaggi in uscita
- come vengono esposte le trascrizioni e lo stato di trasporto normalizzato
- come vengono eseguite le azioni supportate dal trasporto
- come viene gestito il reset o la pulizia specifici del trasporto

La soglia minima di adozione per un nuovo canale è:

1. Mantenere `qa-lab` come proprietario della root condivisa `qa`.
2. Implementare il runner di trasporto sul seam host condiviso `qa-lab`.
3. Mantenere la meccanica specifica del trasporto dentro il plugin runner o l'harness del canale.
4. Montare il runner come `openclaw qa <runner>` invece di registrare una root di comando concorrente.
   I plugin runner dovrebbero dichiarare `qaRunners` in `openclaw.plugin.json` ed esportare un array `qaRunnerCliRegistrations` corrispondente da `runtime-api.ts`.
   Mantieni `runtime-api.ts` leggero; la CLI lazy e l'esecuzione del runner dovrebbero restare dietro entrypoint separati.
5. Creare o adattare scenari Markdown sotto le directory tematiche `qa/scenarios/`.
6. Usare gli helper di scenario generici per i nuovi scenari.
7. Mantenere funzionanti gli alias di compatibilità esistenti, a meno che il repo non stia eseguendo una migrazione intenzionale.

La regola decisionale è rigida:

- Se un comportamento può essere espresso una sola volta in `qa-lab`, mettilo in `qa-lab`.
- Se un comportamento dipende da un solo trasporto di canale, mantienilo in quel plugin runner o harness del plugin.
- Se uno scenario richiede una nuova capacità che può essere usata da più di un canale, aggiungi un helper generico invece di un branch specifico del canale in `suite.ts`.
- Se un comportamento ha senso solo per un trasporto, mantieni lo scenario specifico di quel trasporto e rendilo esplicito nel contratto dello scenario.

I nomi preferiti degli helper generici per i nuovi scenari sono:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Restano disponibili alias di compatibilità per gli scenari esistenti, inclusi:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Il nuovo lavoro sui canali dovrebbe usare i nomi generici degli helper.
Gli alias di compatibilità esistono per evitare una migrazione in un solo giorno, non come modello per
la creazione di nuovi scenari.

## Suite di test (cosa viene eseguito e dove)

Pensa alle suite come a un “realismo crescente” (e a una crescente fragilità/costo):

### Unit / integration (predefinita)

- Comando: `pnpm test`
- Config: dieci esecuzioni shard sequenziali (`vitest.full-*.config.ts`) sui progetti Vitest con scope esistenti
- File: inventari core/unit in `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e i test node `ui` in allowlist coperti da `vitest.unit.config.ts`
- Ambito:
  - Test unitari puri
  - Test di integrazione in-process (auth Gateway, routing, tooling, parsing, config)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Viene eseguita in CI
  - Nessuna chiave reale richiesta
  - Dovrebbe essere veloce e stabile
- Nota sui progetti:
  - `pnpm test` non mirato ora esegue undici configurazioni shard più piccole (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un unico enorme processo root-project nativo. Questo riduce il picco di RSS su macchine cariche ed evita che il lavoro auto-reply/extension sottragga risorse a suite non correlate.
  - `pnpm test --watch` usa ancora il grafo di progetto root nativo `vitest.config.ts`, perché un loop watch multi-shard non è pratico.
  - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima i target espliciti file/directory attraverso corsie con scope, così `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di pagare il costo completo di avvio del progetto root.
  - `pnpm test:changed` espande i percorsi git modificati nelle stesse corsie con scope quando il diff tocca solo file sorgente/test instradabili; le modifiche a config/setup ricadono ancora nella riesecuzione ampia del progetto root.
  - `pnpm check:changed` è il normale gate locale intelligente per lavoro circoscritto. Classifica il diff in core, test core, estensioni, test estensioni, app, documentazione e tooling, poi esegue le corrispondenti corsie di typecheck/lint/test. Le modifiche alla Plugin SDK pubblica e ai plugin-contract includono la validazione delle estensioni perché le estensioni dipendono da quei contratti core.
  - I test unitari leggeri sugli import da agenti, comandi, plugin, helper auto-reply, `plugin-sdk` e aree utility simili vengono instradati attraverso la corsia `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file stateful/runtime-heavy restano sulle corsie esistenti.
  - Anche alcuni file sorgente helper selezionati di `plugin-sdk` e `commands` mappano le esecuzioni in modalità changed su test sibling espliciti in quelle corsie leggere, così le modifiche agli helper evitano di rieseguire l'intera suite pesante per quella directory.
  - `auto-reply` ora ha tre bucket dedicati: helper core top-level, test di integrazione top-level `reply.*` e il sottoalbero `src/auto-reply/reply/**`. Questo tiene il lavoro più pesante dell'harness reply lontano dai test economici di status/chunk/token.
- Nota sull'embedded runner:
  - Quando modifichi gli input di rilevamento dei message-tool o il contesto runtime di Compaction,
    mantieni entrambi i livelli di copertura.
  - Aggiungi regressioni mirate agli helper per boundary puri di routing/normalizzazione.
  - Mantieni anche in buona salute le suite di integrazione dell'embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Queste suite verificano che gli id con scope e il comportamento di Compaction continuino a passare
    attraverso i percorsi reali `run.ts` / `compact.ts`; i test solo-helper non sono un
    sostituto sufficiente per questi percorsi di integrazione.
- Nota sul pool:
  - La configurazione base di Vitest ora usa `threads` per impostazione predefinita.
  - La configurazione Vitest condivisa imposta anche `isolate: false` e usa il runner non isolato nei progetti root, e2e e live.
  - La corsia UI root mantiene la sua configurazione `jsdom` e l'optimizer, ma ora gira anch'essa sul runner condiviso non isolato.
  - Ogni shard di `pnpm test` eredita gli stessi valori predefiniti `threads` + `isolate: false` dalla configurazione Vitest condivisa.
  - Il launcher condiviso `scripts/run-vitest.mjs` ora aggiunge anche `--no-maglev` per impostazione predefinita ai processi Node figli di Vitest per ridurre il churn di compilazione V8 durante grandi esecuzioni locali. Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` se devi confrontare con il comportamento V8 standard.
- Nota sull'iterazione locale rapida:
  - `pnpm changed:lanes` mostra quali corsie architetturali attiva un diff.
  - L'hook pre-commit esegue `pnpm check:changed --staged` dopo la formattazione/lint dei file staged, così i commit solo-core non pagano il costo dei test delle estensioni a meno che non tocchino contratti pubblici rivolti alle estensioni.
  - `pnpm test:changed` passa attraverso corsie con scope quando i percorsi modificati mappano pulitamente a una suite più piccola.
  - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di routing, solo con un limite di worker più alto.
  - L'auto-scaling locale dei worker ora è intenzionalmente conservativo e riduce ulteriormente quando il load average dell'host è già alto, così più esecuzioni Vitest concorrenti fanno meno danni per impostazione predefinita.
  - La configurazione base di Vitest contrassegna i file di progetto/config come `forceRerunTriggers` così le riesecuzioni in modalità changed restano corrette quando cambia il cablaggio dei test.
  - La configurazione mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli host supportati; imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi una posizione esplicita della cache per profiling diretto.
- Nota sul debug delle prestazioni:
  - `pnpm test:perf:imports` abilita il reporting della durata degli import di Vitest più l'output del dettaglio degli import.
  - `pnpm test:perf:imports:changed` limita la stessa vista di profiling ai file modificati rispetto a `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta il `test:changed` instradato con il percorso nativo del progetto root per quel diff committato e stampa wall time più max RSS su macOS.
- `pnpm test:perf:changed:bench -- --worktree` misura l'albero dirty corrente instradando l'elenco dei file modificati attraverso `scripts/test-projects.mjs` e la config root di Vitest.
  - `pnpm test:perf:profile:main` scrive un profilo CPU del thread principale per l'overhead di avvio e trasformazione di Vitest/Vite.
  - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la suite unit con parallelismo dei file disabilitato.

### E2E (smoke Gateway)

- Comando: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Valori predefiniti del runtime:
  - Usa Vitest `threads` con `isolate: false`, in linea con il resto del repo.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per impostazione predefinita).
  - Viene eseguita in modalità silenziosa per impostazione predefinita per ridurre l'overhead I/O della console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (massimo 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riattivare l'output verbose della console.
- Ambito:
  - Comportamento end-to-end del Gateway multi-istanza
  - Superfici WebSocket/HTTP, pairing dei Node e networking più pesante
- Aspettative:
  - Viene eseguita in CI (quando abilitata nella pipeline)
  - Nessuna chiave reale richiesta
  - Più parti in movimento rispetto ai test unitari, quindi può essere più lenta

### E2E: smoke backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `test/openshell-sandbox.e2e.test.ts`
- Ambito:
  - Avvia tramite Docker un Gateway OpenShell isolato sull'host
  - Crea una sandbox a partire da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw su `sandbox ssh-config` + exec SSH reali
  - Verifica il comportamento del filesystem canonical remoto tramite il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell'esecuzione predefinita di `pnpm test:e2e`
  - Richiede una CLI `openshell` locale e un demone Docker funzionante
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, poi distrugge il Gateway di test e la sandbox
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando esegui manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a un binario CLI non predefinito o a uno script wrapper

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Config: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`
- Predefinito: **abilitata** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - “Questo provider/modello funziona davvero _oggi_ con credenziali reali?”
  - Individuare cambi di formato del provider, particolarità del tool-calling, problemi auth e comportamento del rate limit
- Aspettative:
  - Per definizione non stabile in CI (reti reali, policy reali dei provider, quote, outage)
  - Costa denaro / usa rate limit
  - È preferibile eseguire sottoinsiemi ristretti invece di “tutto”
- Le esecuzioni live fanno `source` di `~/.profile` per recuperare chiavi API mancanti.
- Per impostazione predefinita, le esecuzioni live isolano ancora `HOME` e copiano materiale config/auth in una home di test temporanea così le fixture unit non possono modificare il tuo vero `~/.openclaw`.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando vuoi intenzionalmente che i test live usino la tua vera home directory.
- `pnpm test:live` ora usa per impostazione predefinita una modalità più silenziosa: mantiene l'output di avanzamento `[live] ...`, ma sopprime l'avviso aggiuntivo su `~/.profile` e silenzia i log di bootstrap del Gateway / il chatter Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi di nuovo i log completi di avvio.
- Rotazione delle chiavi API (specifica per provider): imposta `*_API_KEYS` con formato virgola/punto e virgola oppure `*_API_KEY_1`, `*_API_KEY_2` (per esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oppure override per-live tramite `OPENCLAW_LIVE_*_KEY`; i test ritentano in caso di risposte con rate limit.
- Output di avanzamento/heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr così le chiamate lunghe ai provider risultano visibilmente attive anche quando il capture della console di Vitest è silenzioso.
  - `vitest.live.config.ts` disabilita l'intercettazione della console di Vitest così le righe di avanzamento provider/Gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli heartbeat del modello diretto con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli heartbeat Gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite dovrei eseguire?

Usa questa tabella decisionale:

- Se modifichi logica/test: esegui `pnpm test` (e `pnpm test:coverage` se hai cambiato molto)
- Se tocchi networking Gateway / protocollo WS / pairing: aggiungi `pnpm test:e2e`
- Se esegui il debug di “il mio bot è giù” / errori specifici del provider / tool calling: esegui un `pnpm test:live` ristretto

## Live: sweep delle capacità del Node Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Obiettivo: invocare **ogni comando attualmente pubblicizzato** da un Node Android connesso e verificare il comportamento del contratto del comando.
- Ambito:
  - Setup manuale/con precondizioni (la suite non installa/esegue/effettua il pairing dell'app).
  - Validazione `node.invoke` del Gateway comando per comando per il Node Android selezionato.
- Pre-setup richiesto:
  - App Android già connessa + paired al Gateway.
  - App mantenuta in foreground.
  - Permessi/consenso alla cattura concessi per le capacità che ti aspetti passino.
- Override facoltativi del target:
  - `OPENCLAW_ANDROID_NODE_ID` oppure `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Dettagli completi di configurazione Android: [Android App](/it/platforms/android)

## Live: smoke dei modelli (chiavi profilo)

I test live sono divisi in due livelli così possiamo isolare i guasti:

- “Modello diretto” ci dice se il provider/modello può rispondere del tutto con la chiave fornita.
- “Gateway smoke” ci dice se l'intera pipeline gateway+agente funziona per quel modello (sessioni, cronologia, strumenti, policy sandbox, ecc.).

### Livello 1: completamento diretto del modello (senza Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Obiettivo:
  - Enumerare i modelli rilevati
  - Usare `getApiKeyForModel` per selezionare i modelli per cui hai credenziali
  - Eseguire un piccolo completamento per modello, e regressioni mirate dove necessario
- Come abilitarlo:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Imposta `OPENCLAW_LIVE_MODELS=modern` (oppure `all`, alias di modern) per eseguire davvero questa suite; altrimenti viene saltata per mantenere `pnpm test:live` concentrato sul Gateway smoke
- Come selezionare i modelli:
  - `OPENCLAW_LIVE_MODELS=modern` per eseguire l'allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` è un alias dell'allowlist moderna
  - oppure `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separata da virgole)
  - Gli sweep modern/all usano per impostazione predefinita un limite curato ad alto segnale; imposta `OPENCLAW_LIVE_MAX_MODELS=0` per uno sweep moderno esaustivo oppure un numero positivo per un limite più piccolo.
- Come selezionare i provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separata da virgole)
- Da dove arrivano le chiavi:
  - Per impostazione predefinita: archivio profili e fallback env
  - Imposta `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre **solo** l'archivio profili
- Perché esiste:
  - Separa “l'API del provider è rotta / la chiave non è valida” da “la pipeline agente del Gateway è rotta”
  - Contiene regressioni piccole e isolate (esempio: replay del ragionamento OpenAI Responses/Codex Responses + flussi di tool-call)

### Livello 2: smoke Gateway + agente dev (quello che fa davvero "@openclaw")

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Obiettivo:
  - Avviare un Gateway in-process
  - Creare/modificare una sessione `agent:dev:*` (override del modello per esecuzione)
  - Iterare i modelli con chiavi e verificare:
    - risposta “significativa” (senza strumenti)
    - che un'invocazione reale di uno strumento funzioni (probe di lettura)
    - probe di strumenti extra facoltativi (probe exec+read)
    - che i percorsi di regressione OpenAI (solo tool-call → follow-up) continuino a funzionare
- Dettagli dei probe, così puoi spiegare rapidamente i fallimenti:
  - Probe `read`: il test scrive un file nonce nel workspace e chiede all'agente di `read` quel file e restituire il nonce.
  - Probe `exec+read`: il test chiede all'agente di scrivere con `exec` un nonce in un file temporaneo, poi di leggerlo con `read`.
  - Probe immagine: il test allega un PNG generato (gatto + codice randomizzato) e si aspetta che il modello restituisca `cat <CODE>`.
  - Riferimento di implementazione: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Come abilitarlo:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Come selezionare i modelli:
  - Predefinito: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` è un alias dell'allowlist moderna
  - Oppure imposta `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o un elenco separato da virgole) per restringere
  - Gli sweep Gateway modern/all usano per impostazione predefinita un limite curato ad alto segnale; imposta `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` per uno sweep moderno esaustivo oppure un numero positivo per un limite più piccolo.
- Come selezionare i provider, per evitare “OpenRouter tutto”:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separata da virgole)
- I probe di strumento + immagine sono sempre attivi in questo test live:
  - Probe `read` + probe `exec+read` (stress degli strumenti)
  - Il probe immagine viene eseguito quando il modello pubblicizza il supporto per input immagine
  - Flusso, ad alto livello:
    - Il test genera un piccolo PNG con “CAT” + codice casuale (`src/gateway/live-image-probe.ts`)
    - Lo invia tramite `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Il Gateway analizza gli allegati in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L'agente embedded inoltra al modello un messaggio utente multimodale
    - Verifica: la risposta contiene `cat` + il codice (tolleranza OCR: piccoli errori consentiti)

Suggerimento: per vedere cosa puoi testare sulla tua macchina, e gli esatti id `provider/model`, esegui:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke del backend CLI (Claude, Codex, Gemini o altre CLI locali)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Obiettivo: convalidare la pipeline Gateway + agente usando un backend CLI locale, senza toccare la tua configurazione predefinita.
- I valori predefiniti smoke specifici del backend si trovano nella definizione `cli-backend.ts` dell'estensione proprietaria.
- Abilitazione:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valori predefiniti:
  - Provider/modello predefinito: `claude-cli/claude-sonnet-4-6`
  - Il comportamento di comando/argomenti/immagine proviene dai metadati del plugin backend CLI proprietario.
- Override facoltativi:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` per inviare un allegato immagine reale (i percorsi vengono iniettati nel prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` per passare i percorsi dei file immagine come argomenti CLI invece che tramite iniezione nel prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oppure `"list"`) per controllare come vengono passati gli argomenti immagine quando è impostato `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` per inviare un secondo turno e convalidare il flusso di ripresa.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` per disabilitare il probe predefinito di continuità nella stessa sessione Claude Sonnet -> Opus (imposta `1` per forzarlo quando il modello selezionato supporta un target di switch).

Esempio:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Ricetta Docker:

```bash
pnpm test:docker:live-cli-backend
```

Ricette Docker per singolo provider:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Note:

- Il runner Docker si trova in `scripts/test-live-cli-backend-docker.sh`.
- Esegue lo smoke live del backend CLI dentro l'immagine Docker del repo come utente `node` non root.
- Risolve i metadati smoke della CLI dall'estensione proprietaria, poi installa il pacchetto CLI Linux corrispondente (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) in un prefisso scrivibile in cache in `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predefinito: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` richiede OAuth portabile di sottoscrizione Claude Code tramite `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` oppure `CLAUDE_CODE_OAUTH_TOKEN` da `claude setup-token`. Prima dimostra il funzionamento diretto di `claude -p` in Docker, poi esegue due turni Gateway CLI-backend senza preservare le variabili env della chiave API Anthropic. Questa corsia di sottoscrizione disabilita per impostazione predefinita i probe Claude MCP/tool e immagine perché Claude al momento instrada l'uso di app di terze parti tramite fatturazione extra-usage invece dei normali limiti del piano di sottoscrizione.
- Lo smoke live del backend CLI ora esercita lo stesso flusso end-to-end per Claude, Codex e Gemini: turno di testo, turno di classificazione immagine, poi tool call MCP `cron` verificata tramite la CLI del Gateway.
- Lo smoke predefinito di Claude modifica anche la sessione da Sonnet a Opus e verifica che la sessione ripresa ricordi ancora una nota precedente.

## Live: smoke ACP bind (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Obiettivo: convalidare il vero flusso di conversation-bind ACP con un agente ACP live:
  - inviare `/acp spawn <agent> --bind here`
  - associare in-place una conversazione sintetica del canale messaggi
  - inviare un normale follow-up sulla stessa conversazione
  - verificare che il follow-up finisca nella trascrizione della sessione ACP associata
- Abilitazione:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valori predefiniti:
  - Agenti ACP in Docker: `claude,codex,gemini`
  - Agente ACP per `pnpm test:live ...` diretto: `claude`
  - Canale sintetico: contesto di conversazione in stile DM Slack
  - Backend ACP: `acpx`
- Override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Note:
  - Questa corsia usa la superficie Gateway `chat.send` con campi di originating-route sintetici riservati agli admin così i test possono allegare il contesto del canale messaggi senza fingere una consegna esterna.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` non è impostato, il test usa il registro agenti integrato del plugin embedded `acpx` per l'agente harness ACP selezionato.

Esempio:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Ricetta Docker:

```bash
pnpm test:docker:live-acp-bind
```

Ricette Docker per singolo agente:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Note Docker:

- Il runner Docker si trova in `scripts/test-live-acp-bind-docker.sh`.
- Per impostazione predefinita, esegue lo smoke ACP bind su tutti gli agenti CLI live supportati in sequenza: `claude`, `codex`, poi `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` oppure `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` per restringere la matrice.
- Esegue `source` di `~/.profile`, mette in staging il materiale auth CLI corrispondente nel container, installa `acpx` in un prefisso npm scrivibile, poi installa la CLI live richiesta (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) se manca.
- Dentro Docker, il runner imposta `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` così acpx mantiene disponibili alla CLI harness figlia le variabili env del provider provenienti dal profilo caricato.

## Live: smoke dell'harness app-server Codex

- Obiettivo: convalidare l'harness Codex di proprietà del plugin tramite il normale metodo Gateway `agent`:
  - caricare il plugin bundled `codex`
  - selezionare `OPENCLAW_AGENT_RUNTIME=codex`
  - inviare un primo turno agente Gateway a `codex/gpt-5.4`
  - inviare un secondo turno alla stessa sessione OpenClaw e verificare che il thread app-server possa riprendere
  - eseguire `/codex status` e `/codex models` tramite lo stesso percorso di comando Gateway
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modello predefinito: `codex/gpt-5.4`
- Probe immagine facoltativo: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Probe MCP/tool facoltativo: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Lo smoke imposta `OPENCLAW_AGENT_HARNESS_FALLBACK=none` così un harness Codex rotto non può passare ricadendo silenziosamente su PI.
- Auth: `OPENAI_API_KEY` dalla shell/profilo, più `~/.codex/auth.json` e `~/.codex/config.toml` copiati facoltativamente

Ricetta locale:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Ricetta Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Note Docker:

- Il runner Docker si trova in `scripts/test-live-codex-harness-docker.sh`.
- Esegue `source` del `~/.profile` montato, passa `OPENAI_API_KEY`, copia i file auth della CLI Codex quando presenti, installa `@openai/codex` in un prefisso npm montato e scrivibile, mette in staging l'albero sorgente, poi esegue solo il test live dell'harness Codex.
- Docker abilita per impostazione predefinita i probe immagine e MCP/tool. Imposta `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oppure `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` quando ti serve un'esecuzione di debug più ristretta.
- Docker esporta anche `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, in linea con la configurazione del test live così il fallback `openai-codex/*` o PI non può nascondere una regressione dell'harness Codex.

### Ricette live consigliate

Allowlist ristrette ed esplicite sono più veloci e meno fragili:

- Modello singolo, diretto, senza Gateway:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modello singolo, Gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling su più provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Focus Google, chiave API Gemini + Antigravity:
  - Gemini, chiave API: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity, OAuth: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Note:

- `google/...` usa l'API Gemini, chiave API.
- `google-antigravity/...` usa il bridge OAuth Antigravity, endpoint agente in stile Cloud Code Assist.
- `google-gemini-cli/...` usa la CLI Gemini locale sulla tua macchina, con auth separata e particolarità proprie degli strumenti.
- API Gemini vs CLI Gemini:
  - API: OpenClaw chiama l'API Gemini ospitata da Google tramite HTTP, con auth a chiave API o profilo; è ciò che la maggior parte degli utenti intende con “Gemini”.
  - CLI: OpenClaw esegue una shell verso un binario `gemini` locale; ha auth propria e può comportarsi diversamente per streaming/supporto strumenti/version skew.

## Live: matrice dei modelli, cosa copriamo

Non esiste un elenco fisso di “modelli CI”, i live sono opt-in, ma questi sono i modelli **consigliati** da coprire regolarmente su una macchina di sviluppo con chiavi.

### Set smoke moderno, tool calling + immagine

Questa è l'esecuzione dei “modelli comuni” che ci aspettiamo continui a funzionare:

- OpenAI, non Codex: `openai/gpt-5.4`, facoltativo `openai/gpt-5.4-mini`
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` oppure `anthropic/claude-sonnet-4-6`
- Google, API Gemini: `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview`, evita i vecchi modelli Gemini 2.x
- Google, Antigravity: `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- Z.AI, GLM: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Esegui Gateway smoke con strumenti + immagine:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling, Read + Exec facoltativo

Scegline almeno uno per famiglia di provider:

- OpenAI: `openai/gpt-5.4` oppure `openai/gpt-5.4-mini`
- Anthropic: `anthropic/claude-opus-4-6` oppure `anthropic/claude-sonnet-4-6`
- Google: `google/gemini-3-flash-preview` oppure `google/gemini-3.1-pro-preview`
- Z.AI, GLM: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Copertura aggiuntiva facoltativa, utile ma non essenziale:

- xAI: `xai/grok-4` oppure l'ultima disponibile
- Mistral: `mistral/...`, scegli un modello con capacità strumenti che hai abilitato
- Cerebras: `cerebras/...`, se hai accesso
- LM Studio: `lmstudio/...`, locale; il tool calling dipende dalla modalità API

### Vision: invio immagine, allegato → messaggio multimodale

Includi almeno un modello capace di immagini in `OPENCLAW_LIVE_GATEWAY_MODELS`, per esempio varianti Claude/Gemini/OpenAI capaci di vision, per esercitare il probe immagine.

### Aggregatori / gateway alternativi

Se hai le chiavi abilitate, supportiamo anche test tramite:

- OpenRouter: `openrouter/...`, centinaia di modelli; usa `openclaw models scan` per trovare candidati capaci di tool+image
- OpenCode: `opencode/...` per Zen e `opencode-go/...` per Go, auth tramite `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`

Altri provider che puoi includere nella matrice live, se hai credenziali/configurazione:

- Integrati: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Tramite `models.providers`, endpoint personalizzati: `minimax`, cloud/API, più qualsiasi proxy compatibile OpenAI/Anthropic, come LM Studio, vLLM, LiteLLM, ecc.

Suggerimento: non cercare di fissare nella documentazione “tutti i modelli”. L'elenco autorevole è ciò che `discoverModels(...)` restituisce sulla tua macchina più le chiavi disponibili.

## Credenziali, non fare mai commit

I test live scoprono le credenziali nello stesso modo della CLI. Implicazioni pratiche:

- Se la CLI funziona, i test live dovrebbero trovare le stesse chiavi.
- Se un test live dice “nessuna credenziale”, fai debug nello stesso modo in cui faresti debug di `openclaw models list` o della selezione del modello.

- Profili auth per agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, questo è ciò che nei test live significa “chiavi profilo”
- Configurazione: `~/.openclaw/openclaw.json`, oppure `OPENCLAW_CONFIG_PATH`
- Dir di stato legacy: `~/.openclaw/credentials/`, copiata nella home live in staging quando presente, ma non è l'archivio principale delle chiavi profilo
- Le esecuzioni locali live copiano per impostazione predefinita nella home di test temporanea la configurazione attiva, i file `auth-profiles.json` per agente, `credentials/` legacy e le directory auth CLI esterne supportate; le home live in staging saltano `workspace/` e `sandboxes/`, e gli override di percorso `agents.*.workspace` / `agentDir` vengono rimossi così i probe restano fuori dal tuo workspace host reale.

Se vuoi affidarti a chiavi env, ad esempio esportate nel tuo `~/.profile`, esegui i test locali dopo `source ~/.profile`, oppure usa i runner Docker qui sotto, che possono montare `~/.profile` nel container.

## Deepgram live, trascrizione audio

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Abilitazione: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Test: `src/agents/byteplus.live.test.ts`
- Abilitazione: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Override facoltativo del modello: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Media live del workflow ComfyUI

- Test: `extensions/comfy/comfy.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Ambito:
  - Esercita i percorsi bundled comfy per immagine, video e `music_generate`
  - Salta ogni capacità a meno che `models.providers.comfy.<capability>` non sia configurato
  - Utile dopo modifiche all'invio del workflow comfy, polling, download o registrazione del plugin

## Image generation live

- Test: `src/image-generation/runtime.live.test.ts`
- Comando: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Ambito:
  - Enumera ogni plugin provider di image generation registrato
  - Carica le variabili env mancanti del provider dalla tua shell di login, `~/.profile`, prima del probe
  - Usa per impostazione predefinita chiavi API live/env prima dei profili auth memorizzati, così chiavi di test obsolete in `auth-profiles.json` non mascherano credenziali reali della shell
  - Salta i provider senza auth/profilo/modello utilizzabili
  - Esegue le varianti standard di image generation tramite la capacità runtime condivisa:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provider bundled attualmente coperti:
  - `openai`
  - `google`
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportamento auth facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare auth dall'archivio profili e ignorare override solo-env

## Music generation live

- Test: `extensions/music-generation-providers.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Ambito:
  - Esercita il percorso condiviso bundled del provider di music generation
  - Attualmente copre Google e MiniMax
  - Carica le variabili env del provider dalla tua shell di login, `~/.profile`, prima del probe
  - Usa per impostazione predefinita chiavi API live/env prima dei profili auth memorizzati, così chiavi di test obsolete in `auth-profiles.json` non mascherano credenziali reali della shell
  - Salta i provider senza auth/profilo/modello utilizzabili
  - Esegue entrambe le modalità runtime dichiarate quando disponibili:
    - `generate` con input solo prompt
    - `edit` quando il provider dichiara `capabilities.edit.enabled`
  - Copertura attuale della corsia condivisa:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy separato, non questo sweep condiviso
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamento auth facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare auth dall'archivio profili e ignorare override solo-env

## Video generation live

- Test: `extensions/video-generation-providers.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Ambito:
  - Esercita il percorso condiviso bundled del provider di video generation
  - Usa per impostazione predefinita il percorso smoke sicuro per le release: provider non FAL, una richiesta text-to-video per provider, prompt lobster di un secondo e un limite di operazione per provider da `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` per impostazione predefinita)
  - Salta FAL per impostazione predefinita perché la latenza della coda lato provider può dominare il tempo di release; passa `--video-providers fal` oppure `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` per eseguirlo esplicitamente
  - Carica le variabili env del provider dalla tua shell di login, `~/.profile`, prima del probe
  - Usa per impostazione predefinita chiavi API live/env prima dei profili auth memorizzati, così chiavi di test obsolete in `auth-profiles.json` non mascherano credenziali reali della shell
  - Salta i provider senza auth/profilo/modello utilizzabili
  - Esegue solo `generate` per impostazione predefinita
  - Imposta `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` per eseguire anche le modalità transform dichiarate quando disponibili:
    - `imageToVideo` quando il provider dichiara `capabilities.imageToVideo.enabled` e il provider/modello selezionato accetta input immagine locale basato su buffer nello sweep condiviso
    - `videoToVideo` quando il provider dichiara `capabilities.videoToVideo.enabled` e il provider/modello selezionato accetta input video locale basato su buffer nello sweep condiviso
  - Provider `imageToVideo` attualmente dichiarati ma saltati nello sweep condiviso:
    - `vydra` perché il bundled `veo3` è solo testo e il bundled `kling` richiede un URL immagine remoto
  - Copertura Vydra specifica del provider:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - quel file esegue `veo3` text-to-video più una corsia `kling` che usa per impostazione predefinita una fixture con URL immagine remoto
  - Copertura live `videoToVideo` attuale:
    - solo `runway` quando il modello selezionato è `runway/gen4_aleph`
  - Provider `videoToVideo` attualmente dichiarati ma saltati nello sweep condiviso:
    - `alibaba`, `qwen`, `xai` perché quei percorsi richiedono attualmente URL di riferimento remoti `http(s)` / MP4
    - `google` perché l'attuale corsia condivisa Gemini/Veo usa input locali basati su buffer e quel percorso non è accettato nello sweep condiviso
    - `openai` perché l'attuale corsia condivisa non garantisce accesso video inpaint/remix specifico dell'organizzazione
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` per includere ogni provider nello sweep predefinito, incluso FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` per ridurre il limite di ogni operazione provider in uno smoke run aggressivo
- Comportamento auth facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare auth dall'archivio profili e ignorare override solo-env

## Harness media live

- Comando: `pnpm test:live:media`
- Scopo:
  - Esegue le suite live condivise di image, music e video tramite un unico entrypoint nativo del repo
  - Carica automaticamente da `~/.profile` le variabili env mancanti dei provider
  - Per impostazione predefinita restringe automaticamente ogni suite ai provider che al momento hanno auth utilizzabile
  - Riusa `scripts/test-live.mjs`, così il comportamento di heartbeat e quiet-mode resta coerente
- Esempi:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runner Docker, controlli facoltativi “funziona su Linux”

Questi runner Docker sono divisi in due gruppi:

- Runner live-model: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il rispettivo file live a chiavi profilo corrispondente dentro l'immagine Docker del repo, `src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`, montando la tua dir di configurazione e il workspace locali, e facendo `source` di `~/.profile` se montato. Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner live Docker usano per impostazione predefinita un limite smoke più piccolo così uno sweep Docker completo resta praticabile:
  `test:docker:live-models` usa per impostazione predefinita `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa per impostazione predefinita `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sostituisci quelle variabili env quando
  vuoi esplicitamente la scansione esaustiva più ampia.
- `test:docker:all` costruisce una sola volta l'immagine Docker live tramite `test:docker:live-build`, poi la riusa per le due corsie live Docker.
- Runner smoke per container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` e `test:docker:plugins` avviano uno o più container reali e verificano percorsi di integrazione di livello più alto.

I runner Docker live-model montano anche solo le home auth CLI necessarie, oppure tutte quelle supportate quando l'esecuzione non è ristretta, poi le copiano nella home del container prima dell'esecuzione così l'OAuth della CLI esterna può aggiornare i token senza modificare l'archivio auth dell'host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Procedura guidata di onboarding, TTY, scaffolding completo: `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Networking Gateway, due container, auth WS + health: `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Bridge di canale MCP, Gateway con seed + bridge stdio + smoke raw del notification-frame Claude: `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Plugin, smoke di installazione + alias `/plugin` + semantica di riavvio del bundle Claude: `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

I runner Docker live-model montano inoltre il checkout corrente in sola lettura e lo
mettono in staging in una workdir temporanea dentro il container. Questo mantiene
snella l'immagine runtime pur eseguendo Vitest esattamente sul tuo sorgente/configurazione locali.
Il passaggio di staging salta grandi cache solo-locali e output build delle app come
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e dir locali `.build` delle app o
directory di output Gradle, così le esecuzioni live Docker non passano minuti a copiare
artifact specifici della macchina.
Impostano anche `OPENCLAW_SKIP_CHANNELS=1` così i probe live del Gateway non avviano
worker di canale reali Telegram/Discord/ecc. nel container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi passa anche
`OPENCLAW_LIVE_GATEWAY_*` quando devi restringere o escludere la copertura live
Gateway da quella corsia Docker.
`test:docker:openwebui` è uno smoke di compatibilità di livello superiore: avvia un
container Gateway OpenClaw con endpoint HTTP compatibili OpenAI abilitati,
avvia un container Open WebUI fissato contro quel Gateway, effettua l'accesso tramite
Open WebUI, verifica che `/api/models` esponga `openclaw/default`, poi invia una
vera richiesta chat tramite il proxy `/api/chat/completions` di Open WebUI.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe dover scaricare
l'immagine Open WebUI e Open WebUI potrebbe dover completare il proprio setup di cold-start.
Questa corsia si aspetta una chiave modello live utilizzabile, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` per impostazione predefinita) è il modo principale per fornirla nelle esecuzioni Docker.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un
vero account Telegram, Discord o iMessage. Avvia un container Gateway con seed,
avvia un secondo container che esegue `openclaw mcp serve`, poi
verifica individuazione della conversazione instradata, letture della trascrizione, metadati degli allegati,
comportamento della coda di eventi live, instradamento degli invii in uscita e notifiche di canale +
permesso in stile Claude sul vero bridge stdio MCP. Il controllo delle notifiche
ispeziona direttamente i raw frame stdio MCP così lo smoke convalida ciò che il
bridge emette davvero, non solo ciò che uno specifico SDK client capita a esporre.

Smoke manuale ACP in plain language sul thread, non CI:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantieni questo script per i flussi di regressione/debug. Potrebbe servire di nuovo per la validazione del routing del thread ACP, quindi non eliminarlo.

Variabili env utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinito: `~/.openclaw`) montata su `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinito: `~/.openclaw/workspace`) montata su `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinito: `~/.profile`) montata su `/home/node/.profile` e caricata con `source` prima di eseguire i test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` per verificare solo le variabili env caricate da `OPENCLAW_PROFILE_FILE`, usando dir temporanee di config/workspace e nessun mount auth CLI esterno
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinito: `~/.cache/openclaw/docker-cli-tools`) montata su `/home/node/.npm-global` per installazioni CLI in cache dentro Docker
- Le dir/file auth CLI esterne sotto `$HOME` sono montate in sola lettura sotto `/host-auth...`, poi copiate in `/home/node/...` prima dell'avvio dei test
  - Dir predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni ristrette per provider montano solo le dir/file necessarie dedotte da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manuale con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oppure un elenco separato da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l'esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riusare un'immagine `openclaw:local-live` esistente per riesecuzioni che non richiedono una nuova build
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per assicurarsi che le credenziali provengano dall'archivio profili, non dall'env
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal Gateway per lo smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sostituire il prompt di controllo nonce usato dallo smoke Open WebUI
- `OPENWEBUI_IMAGE=...` per sostituire il tag dell'immagine Open WebUI fissata

## Verifica di integrità della documentazione

Esegui i controlli docs dopo modifiche alla documentazione: `pnpm check:docs`.
Esegui la validazione completa degli anchor Mintlify quando hai bisogno anche di controlli sulle intestazioni in-page: `pnpm docs:check-links:anchors`.

## Regressione offline, sicura per la CI

Queste sono regressioni della “pipeline reale” senza provider reali:

- Tool calling Gateway, OpenAI simulato, vero loop Gateway + agente: `src/gateway/gateway.test.ts`, caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop"
- Procedura guidata Gateway, WS `wizard.start`/`wizard.next`, scrive config + auth obbligatoria: `src/gateway/gateway.test.ts`, caso: "runs wizard over ws and writes auth token config"

## Valutazioni di affidabilità dell'agente, Skills

Abbiamo già alcuni test sicuri per la CI che si comportano come “valutazioni di affidabilità dell'agente”:

- Tool-calling simulato tramite il vero loop Gateway + agente (`src/gateway/gateway.test.ts`).
- Flussi end-to-end della procedura guidata che convalidano il cablaggio della sessione e gli effetti sulla configurazione (`src/gateway/gateway.test.ts`).

Cosa manca ancora per le Skills, vedi [Skills](/it/tools/skills):

- **Decisioning:** quando le Skills sono elencate nel prompt, l'agente sceglie la skill giusta, oppure evita quelle irrilevanti?
- **Compliance:** l'agente legge `SKILL.md` prima dell'uso e segue i passaggi/gli argomenti richiesti?
- **Workflow contracts:** scenari multi-turno che verificano ordine degli strumenti, mantenimento della cronologia della sessione e boundary del sandbox.

Le valutazioni future dovrebbero restare prima di tutto deterministiche:

- Un runner di scenari che usa provider simulati per verificare tool call + ordine, letture dei file skill e cablaggio della sessione.
- Una piccola suite di scenari focalizzati sulle skill, usare vs evitare, gating, prompt injection.
- Valutazioni live facoltative, opt-in e controllate da env, solo dopo che la suite sicura per la CI sarà disponibile.

## Test di contratto, forma di plugin e canale

I test di contratto verificano che ogni plugin e canale registrato sia conforme al proprio
contratto di interfaccia. Iterano su tutti i plugin rilevati ed eseguono una suite di
verifiche di forma e comportamento. La corsia unitaria predefinita `pnpm test` salta intenzionalmente
questi file smoke e seam condivisi; esegui esplicitamente i comandi di contratto
quando tocchi superfici condivise di canali o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti dei canali: `pnpm test:contracts:channels`
- Solo contratti dei provider: `pnpm test:contracts:plugins`

### Contratti dei canali

Si trovano in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma base del plugin, id, nome, capacità
- **setup** - Contratto della procedura guidata di setup
- **session-binding** - Comportamento di associazione della sessione
- **outbound-payload** - Struttura del payload del messaggio
- **inbound** - Gestione dei messaggi in ingresso
- **actions** - Handler delle azioni del canale
- **threading** - Gestione dell'id del thread
- **directory** - API directory/roster
- **group-policy** - Applicazione della policy di gruppo

### Contratti di stato del provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe di stato del canale
- **registry** - Forma del registro dei plugin

### Contratti dei provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contratto del flusso auth
- **auth-choice** - Scelta/selezione auth
- **catalog** - API del catalogo modelli
- **discovery** - Rilevamento dei plugin
- **loader** - Caricamento dei plugin
- **runtime** - Runtime del provider
- **shape** - Forma/interfaccia del plugin
- **wizard** - Procedura guidata di setup

### Quando eseguirli

- Dopo aver modificato export o subpath di plugin-sdk
- Dopo aver aggiunto o modificato un plugin di canale o provider
- Dopo aver rifattorizzato la registrazione o il rilevamento dei plugin

I test di contratto vengono eseguiti in CI e non richiedono chiavi API reali.

## Aggiunta di regressioni, linee guida

Quando correggi un problema di provider/modello scoperto nei live:

- Aggiungi se possibile una regressione sicura per la CI, provider simulato/stub, oppure cattura l'esatta trasformazione della forma della richiesta
- Se è intrinsecamente solo-live, per esempio rate limit o policy auth, mantieni il test live ristretto e opt-in tramite variabili env
- Preferisci puntare al livello più piccolo che intercetta il bug:
  - bug di conversione/replay della richiesta provider → test diretto dei modelli
  - bug della pipeline Gateway di sessione/cronologia/strumenti → Gateway live smoke o test Gateway simulato sicuro per la CI
- Guardrail di attraversamento SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target campione per ogni classe SecretRef dai metadati del registro, `listSecretTargetRegistryEntries()`, poi verifica che gli id exec dei segmenti di attraversamento vengano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente sugli id target non classificati così le nuove classi non possono essere saltate in silenzio.
