---
read_when:
    - Eseguire i test in locale o in CI
    - Aggiungere regressioni per bug del modello/provider
    - Debug del comportamento del gateway + dell'agente
summary: 'Kit di test: suite unit/e2e/live, runner Docker e cosa copre ciascun test'
title: Test
x-i18n:
    generated_at: "2026-04-23T08:30:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 647367fd0c3ea81bc3e8a7702c4a462cf4b9634989818f53153558edcf2218c1
    source_path: help/testing.md
    workflow: 15
---

# Test

OpenClaw ha tre suite Vitest (unit/integration, e2e, live) e un piccolo insieme di runner Docker.

Questo documento è una guida “come testiamo”:

- Cosa copre ogni suite (e cosa deliberatamente _non_ copre)
- Quali comandi eseguire per i flussi di lavoro comuni (locale, pre-push, debug)
- Come i test live rilevano le credenziali e selezionano modelli/provider
- Come aggiungere regressioni per problemi reali di modelli/provider

## Avvio rapido

Nella maggior parte dei giorni:

- Gate completo (atteso prima del push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Esecuzione locale più veloce dell'intera suite su una macchina capiente: `pnpm test:max`
- Loop watch diretto di Vitest: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Preferisci prima esecuzioni mirate quando stai iterando su un singolo errore.
- Sito QA supportato da Docker: `pnpm qa:lab:up`
- Lane QA supportata da VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando tocchi i test o vuoi maggiore sicurezza:

- Gate di copertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando fai debug di provider/modelli reali (richiede credenziali reali):

- Suite live (modelli + probe gateway di tool/immagini): `pnpm test:live`
- Punta in modo silenzioso a un singolo file live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Sweep Docker live dei modelli: `pnpm test:docker:live-models`
  - Copertura CI: il job giornaliero `OpenClaw Scheduled Live And E2E Checks` e il job manuale
    `OpenClaw Release Checks` chiamano entrambi il workflow riutilizzabile live/E2E con
    `include_live_suites: true`, che include job matrix Docker live separati
    shardati per provider.
  - Per rerun CI mirati, esegui `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` e `live_models_only: true`.
  - Aggiungi nuovi secret provider ad alto segnale a `scripts/ci-hydrate-live-auth.sh`
    più `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e i suoi
    chiamanti scheduled/release.
- Smoke del costo Moonshot/Kimi: con `MOONSHOT_API_KEY` impostata, esegui
  `openclaw models list --provider moonshot --json`, poi esegui un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolato contro `moonshot/kimi-k2.6`. Verifica che il JSON riporti Moonshot/K2.6 e che la
  trascrizione assistant memorizzi `usage.cost` normalizzato.

Suggerimento: quando ti serve solo un singolo caso in errore, preferisci restringere i test live tramite le variabili d'ambiente di allowlist descritte sotto.

## Runner specifici QA

Questi comandi affiancano le suite di test principali quando hai bisogno del realismo di qa-lab:

La CI esegue QA Lab in workflow dedicati. `Parity gate` viene eseguito sulle PR corrispondenti e
dal dispatch manuale con provider mock. `QA-Lab - All Lanes` viene eseguito ogni notte su
`main` e dal dispatch manuale con il parity gate mock, la lane live Matrix e la lane live Telegram gestita da Convex come job paralleli. `OpenClaw Release Checks`
esegue le stesse lane prima dell'approvazione della release.

- `pnpm openclaw qa suite`
  - Esegue direttamente sull'host gli scenari QA supportati dal repository.
  - Esegue più scenari selezionati in parallelo per impostazione predefinita con
    worker gateway isolati. `qa-channel` usa di default concorrenza 4 (limitata dal
    numero di scenari selezionati). Usa `--concurrency <count>` per regolare il numero di worker,
    oppure `--concurrency 1` per la vecchia lane seriale.
  - Esce con codice non zero quando uno scenario fallisce. Usa `--allow-failures` quando
    vuoi gli artifact senza un codice di uscita in errore.
  - Supporta le modalità provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` avvia un server provider locale supportato da AIMock per copertura
    sperimentale di fixture e mock del protocollo senza sostituire la lane
    `mock-openai` consapevole degli scenari.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA dentro una VM Linux Multipass usa e getta.
  - Mantiene lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
  - Riutilizza gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input auth QA supportati che sono pratici per il guest:
    chiavi provider basate su env, il percorso di configurazione del provider live QA e `CODEX_HOME`
    quando presente.
  - Le directory di output devono restare sotto la root del repository così il guest può scrivere
    indietro tramite il workspace montato.
  - Scrive il normale report + riepilogo QA più i log Multipass sotto
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA supportato da Docker per lavoro QA in stile operatore.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Costruisce un tarball npm a partire dal checkout corrente, lo installa globalmente in
    Docker, esegue onboarding non interattivo con chiave API OpenAI, configura Telegram
    per impostazione predefinita, verifica che l'abilitazione del plugin installi le dipendenze runtime on demand, esegue doctor e lancia un turno agente locale contro un endpoint OpenAI mockato.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` per eseguire la stessa lane di installazione pacchettizzata
    con Discord.
- `pnpm test:docker:bundled-channel-deps`
  - Impacchetta e installa la build OpenClaw corrente in Docker, avvia il Gateway
    con OpenAI configurato, quindi abilita canali/plugin inclusi tramite modifiche di configurazione.
  - Verifica che il rilevamento del setup lasci assenti le dipendenze runtime di plugin non configurati, che il primo Gateway configurato o doctor installi on demand le dipendenze runtime di ogni plugin incluso e che un secondo riavvio non reinstalli dipendenze già attivate.
  - Installa anche una baseline npm vecchia nota, abilita Telegram prima di eseguire
    `openclaw update --tag <candidate>` e verifica che il doctor post-update del
    candidato ripari le dipendenze runtime dei canali inclusi senza una riparazione postinstall lato harness.
- `pnpm openclaw qa aimock`
  - Avvia solo il server provider AIMock locale per smoke test diretti del protocollo.
- `pnpm openclaw qa matrix`
  - Esegue la lane QA live Matrix contro un homeserver Tuwunel usa e getta supportato da Docker.
  - Questo host QA oggi è solo per repository/dev. Le installazioni OpenClaw pacchettizzate non distribuiscono
    `qa-lab`, quindi non espongono `openclaw qa`.
  - I checkout del repository caricano direttamente il runner incluso; non serve alcun passaggio separato di installazione plugin.
  - Esegue il provisioning di tre utenti Matrix temporanei (`driver`, `sut`, `observer`) più una stanza privata, poi avvia un child gateway QA con il vero plugin Matrix come trasporto SUT.
  - Usa per impostazione predefinita l'immagine Tuwunel stabile fissata `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Sovrascrivila con `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando devi testare un'immagine diversa.
  - Matrix non espone flag condivisi per la sorgente delle credenziali perché la lane esegue localmente il provisioning di utenti usa e getta.
  - Scrive un report QA Matrix, un riepilogo, un artifact observed-events e un log di output combinato stdout/stderr sotto `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Esegue la lane QA live Telegram contro un vero gruppo privato usando i token bot driver e SUT da env.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L'ID gruppo deve essere l'ID chat Telegram numerico.
  - Supporta `--credential-source convex` per credenziali condivise in pool. Usa la modalità env per impostazione predefinita, oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per scegliere lease condivisi.
  - Esce con codice non zero quando uno scenario fallisce. Usa `--allow-failures` quando
    vuoi gli artifact senza un codice di uscita in errore.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone un username Telegram.
  - Per un'osservazione stabile bot-to-bot, abilita Bot-to-Bot Communication Mode in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico bot del gruppo.
  - Scrive un report QA Telegram, un riepilogo e un artifact observed-messages sotto `.artifacts/qa-e2e/...`.

Le lane di trasporto live condividono un unico contratto standard così i nuovi trasporti non divergono:

`qa-channel` resta l'ampia suite QA sintetica e non fa parte della matrice di copertura dei trasporti live.

| Lane     | Canary | Gating delle menzioni | Blocco allowlist | Risposta top-level | Ripresa dopo riavvio | Follow-up thread | Isolamento thread | Osservazione reazioni | Comando help |
| -------- | ------ | --------------------- | ---------------- | ------------------ | -------------------- | ---------------- | ----------------- | --------------------- | ------------ |
| Matrix   | x      | x                     | x                | x                  | x                    | x                | x                 | x                     |              |
| Telegram | x      |                       |                  |                    |                      |                  |                   |                       | x            |

### Credenziali Telegram condivise tramite Convex (v1)

Quando `--credential-source convex` (oppure `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) è abilitato per
`openclaw qa telegram`, QA lab acquisisce un lease esclusivo da un pool supportato da Convex, invia heartbeat
di quel lease mentre la lane è in esecuzione e rilascia il lease allo spegnimento.

Scaffold del progetto Convex di riferimento:

- `qa/convex-credential-broker/`

Variabili d'ambiente richieste:

- `OPENCLAW_QA_CONVEX_SITE_URL` (per esempio `https://your-deployment.convex.site`)
- Un secret per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione del ruolo credenziale:
  - CLI: `--credential-role maintainer|ci`
  - Predefinito env: `OPENCLAW_QA_CREDENTIAL_ROLE` (predefinito `ci` in CI, `maintainer` altrimenti)

Variabili d'ambiente opzionali:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predefinito `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predefinito `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predefinito `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predefinito `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predefinito `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID di traccia opzionale)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex `http://` loopback per sviluppo solo locale.

`OPENCLAW_QA_CONVEX_SITE_URL` dovrebbe usare `https://` nel normale funzionamento.

I comandi admin del maintainer (aggiungi/rimuovi/elenca pool) richiedono
specificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI per maintainer:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Usa `--json` per output leggibile da macchina in script e utilità CI.

Contratto endpoint predefinito (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Richiesta: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Successo: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Pool esaurito/riprovabile: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
  - Guardia lease attivo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo secret maintainer)
  - Richiesta: `{ kind?, status?, includePayload?, limit? }`
  - Successo: `{ status: "ok", credentials, count }`

Forma del payload per il tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve essere una stringa ID chat Telegram numerica.
- `admin/add` valida questa forma per `kind: "telegram"` e rifiuta payload malformati.

### Aggiungere un canale a QA

Aggiungere un canale al sistema QA Markdown richiede esattamente due cose:

1. Un adattatore di trasporto per il canale.
2. Un pacchetto di scenari che esercita il contratto del canale.

Non aggiungere una nuova root di comandi QA di primo livello quando l'host condiviso `qa-lab` può
gestire il flusso.

`qa-lab` gestisce le meccaniche condivise dell'host:

- la root di comandi `openclaw qa`
- avvio e teardown della suite
- concorrenza dei worker
- scrittura degli artifact
- generazione dei report
- esecuzione degli scenari
- alias di compatibilità per i vecchi scenari `qa-channel`

I plugin runner gestiscono il contratto di trasporto:

- come `openclaw qa <runner>` viene montato sotto la root condivisa `qa`
- come il gateway viene configurato per quel trasporto
- come viene controllata la readiness
- come vengono iniettati gli eventi in ingresso
- come vengono osservati i messaggi in uscita
- come vengono esposte trascrizioni e stato di trasporto normalizzato
- come vengono eseguite le azioni supportate dal trasporto
- come viene gestito reset o cleanup specifico del trasporto

La soglia minima di adozione per un nuovo canale è:

1. Mantenere `qa-lab` come proprietario della root condivisa `qa`.
2. Implementare il runner di trasporto sulla seam host condivisa `qa-lab`.
3. Mantenere le meccaniche specifiche del trasporto all'interno del plugin runner o dell'harness del canale.
4. Montare il runner come `openclaw qa <runner>` invece di registrare una root di comando concorrente.
   I plugin runner dovrebbero dichiarare `qaRunners` in `openclaw.plugin.json` ed esportare un array `qaRunnerCliRegistrations` corrispondente da `runtime-api.ts`.
   Mantieni `runtime-api.ts` leggero; la CLI lazy e l'esecuzione del runner devono restare dietro entrypoint separati.
5. Scrivere o adattare scenari Markdown sotto le directory tematiche `qa/scenarios/`.
6. Usare gli helper generici degli scenari per i nuovi scenari.
7. Mantenere funzionanti gli alias di compatibilità esistenti a meno che il repository non stia facendo una migrazione intenzionale.

La regola decisionale è rigorosa:

- Se un comportamento può essere espresso una sola volta in `qa-lab`, mettilo in `qa-lab`.
- Se un comportamento dipende da un solo trasporto di canale, mantienilo in quel plugin runner o harness plugin.
- Se uno scenario ha bisogno di una nuova capability che più di un canale può usare, aggiungi un helper generico invece di un ramo specifico del canale in `suite.ts`.
- Se un comportamento ha senso solo per un trasporto, mantieni lo scenario specifico del trasporto e rendilo esplicito nel contratto dello scenario.

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

Gli alias di compatibilità restano disponibili per gli scenari esistenti, inclusi:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Il nuovo lavoro sui canali dovrebbe usare i nomi helper generici.
Gli alias di compatibilità esistono per evitare una migrazione flag day, non come modello per
la scrittura di nuovi scenari.

## Suite di test (cosa viene eseguito dove)

Pensa alle suite come a un “realismo crescente” (e crescente instabilità/costo):

### Unit / integration (predefinita)

- Comando: `pnpm test`
- Configurazione: dieci esecuzioni shard sequenziali (`vitest.full-*.config.ts`) sui progetti Vitest scoped esistenti
- File: inventari core/unit sotto `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e i test node `ui` in allowlist coperti da `vitest.unit.config.ts`
- Ambito:
  - Test unitari puri
  - Test di integrazione in-process (auth gateway, routing, tooling, parsing, config)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Viene eseguito in CI
  - Non richiede chiavi reali
  - Deve essere veloce e stabile
- Nota sui progetti:
  - `pnpm test` non mirato ora esegue undici configurazioni shard più piccole (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un unico enorme processo root-project nativo. Questo riduce il picco RSS su macchine cariche ed evita che il lavoro auto-reply/extension affami suite non correlate.
  - `pnpm test --watch` usa ancora il grafo di progetto root nativo `vitest.config.ts`, perché un loop watch multi-shard non è pratico.
  - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima i target espliciti file/directory attraverso lane scoped, quindi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita il costo di avvio completo del progetto root.
  - `pnpm test:changed` espande i percorsi git modificati nelle stesse lane scoped quando il diff tocca solo file sorgente/test instradabili; modifiche di config/setup tornano comunque al rerun ampio del root-project.
  - `pnpm check:changed` è il normale smart local gate per lavoro ristretto. Classifica il diff in core, test core, extensions, test extension, app, documentazione, metadati di release e tooling, poi esegue le lane corrispondenti di typecheck/lint/test. Le modifiche al Plugin SDK pubblico e al contratto plugin includono la validazione delle extension perché le extension dipendono da quei contratti core. I version bump che toccano solo i metadati di release eseguono controlli mirati su versione/config/dipendenze root invece della suite completa, con una guardia che rifiuta modifiche ai package fuori dal campo versione di primo livello.
  - I test unitari leggeri da agenti, comandi, plugin, helper auto-reply, `plugin-sdk` e aree simili di utility pure vengono instradati attraverso la lane `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file stateful/runtime-heavy restano nelle lane esistenti.
  - Anche file sorgente helper selezionati di `plugin-sdk` e `commands` mappano le esecuzioni in modalità changed a test sibling espliciti in quelle lane leggere, così le modifiche agli helper evitano di rieseguire l'intera suite pesante per quella directory.
  - `auto-reply` ora ha tre bucket dedicati: helper core di primo livello, test di integrazione `reply.*` di primo livello e il sottoalbero `src/auto-reply/reply/**`. Questo tiene il lavoro più pesante dell'harness reply fuori dai test economici di stato/chunk/token.
- Nota sul runner incorporato:
  - Quando modifichi input di rilevamento message-tool o contesto runtime di compaction,
    mantieni entrambi i livelli di copertura.
  - Aggiungi regressioni helper mirate per confini puri di routing/normalizzazione.
  - Mantieni anche in salute le suite di integrazione del runner incorporato:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Queste suite verificano che gli ID scoped e il comportamento di compaction continuino a fluire
    attraverso i veri percorsi `run.ts` / `compact.ts`; i test solo helper non sono un
    sostituto sufficiente per quei percorsi di integrazione.
- Nota sul pool:
  - La configurazione base di Vitest ora usa per default `threads`.
  - La configurazione Vitest condivisa fissa anche `isolate: false` e usa il runner non isolato nei progetti root, nelle configurazioni e2e e live.
  - La lane UI root mantiene il suo setup `jsdom` e l'ottimizzatore, ma ora gira anch'essa sul runner non isolato condiviso.
  - Ogni shard `pnpm test` eredita gli stessi valori predefiniti `threads` + `isolate: false` dalla configurazione Vitest condivisa.
  - Il launcher condiviso `scripts/run-vitest.mjs` ora aggiunge per default anche `--no-maglev` ai processi Node child di Vitest per ridurre il churn di compilazione V8 durante grandi esecuzioni locali. Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` se hai bisogno di confrontare con il comportamento V8 stock.
- Nota sull'iterazione locale veloce:
  - `pnpm changed:lanes` mostra quali lane architetturali attiva un diff.
  - Il pre-commit hook esegue `pnpm check:changed --staged` dopo formatting/linting dei file in stage, così i commit solo core non pagano il costo dei test extension a meno che tocchino contratti pubblici rivolti alle extension. I commit solo metadati di release restano sulla lane mirata di versione/config/dipendenze root.
  - Se l'esatto set di modifiche in stage è già stato validato con gate equivalenti o più forti, usa `scripts/committer --fast "<message>" <files...>` per saltare solo il rerun del changed-scope hook. Formatting/linting in stage continuano comunque a essere eseguiti. Cita i gate completati nel tuo handoff. Questo è accettabile anche dopo che un errore flaky isolato dell'hook viene rieseguito e passa con prova circoscritta.
  - `pnpm test:changed` instrada attraverso lane scoped quando i percorsi modificati mappano chiaramente a una suite più piccola.
  - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di routing, solo con un limite worker più alto.
  - L'auto-scaling locale dei worker è ora intenzionalmente conservativo e rallenta anche quando il load average dell'host è già alto, così per default più esecuzioni Vitest concorrenti fanno meno danni.
  - La configurazione base Vitest contrassegna i file di progetto/config come `forceRerunTriggers` così i rerun in modalità changed restano corretti quando cambia il wiring dei test.
  - La configurazione mantiene abilitato `OPENCLAW_VITEST_FS_MODULE_CACHE` sugli host supportati; imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi una posizione cache esplicita per profiling diretto.
- Nota sul debug delle prestazioni:
  - `pnpm test:perf:imports` abilita il reporting della durata degli import di Vitest più l'output del breakdown degli import.
  - `pnpm test:perf:imports:changed` limita la stessa vista di profiling ai file modificati rispetto a `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta `test:changed` instradato con il percorso root-project nativo per quel diff commitato e stampa wall time più max RSS macOS.
- `pnpm test:perf:changed:bench -- --worktree` esegue benchmark dell'albero dirty corrente instradando l'elenco dei file modificati attraverso `scripts/test-projects.mjs` e la configurazione root Vitest.
  - `pnpm test:perf:profile:main` scrive un profilo CPU del thread principale per l'overhead di startup e transform di Vitest/Vite.
  - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la suite unit con parallelismo file disabilitato.

### Stability (gateway)

- Comando: `pnpm test:stability:gateway`
- Configurazione: `vitest.gateway.config.ts`, forzata a un worker
- Ambito:
  - Avvia un vero Gateway loopback con diagnostica abilitata per impostazione predefinita
  - Guida churn sintetico di messaggi gateway, memoria e payload grandi attraverso il percorso degli eventi diagnostici
  - Interroga `diagnostics.stability` tramite Gateway WS RPC
  - Copre gli helper di persistenza del bundle di stabilità diagnostica
  - Verifica che il recorder resti bounded, che i campioni RSS sintetici restino sotto il budget di pressione e che le profondità di coda per sessione tornino a zero
- Aspettative:
  - Sicuro per la CI e senza chiavi
  - Lane ristretta per follow-up di regressioni di stabilità, non un sostituto della suite completa del Gateway

### E2E (gateway smoke)

- Comando: `pnpm test:e2e`
- Configurazione: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e test E2E dei plugin inclusi sotto `extensions/`
- Predefiniti runtime:
  - Usa Vitest `threads` con `isolate: false`, in linea con il resto del repository.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per impostazione predefinita).
  - Per impostazione predefinita viene eseguito in modalità silenziosa per ridurre l'overhead I/O della console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (massimo 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riabilitare l'output dettagliato della console.
- Ambito:
  - Comportamento end-to-end di gateway multiistanza
  - Superfici WebSocket/HTTP, pairing dei node e rete più pesante
- Aspettative:
  - Viene eseguito in CI (quando abilitato nella pipeline)
  - Non richiede chiavi reali
  - Ha più componenti mobili dei test unitari (può essere più lento)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Ambito:
  - Avvia un Gateway OpenShell isolato sull'host tramite Docker
  - Crea una sandbox da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw tramite veri `sandbox ssh-config` + exec SSH
  - Verifica il comportamento del filesystem remote-canonical tramite il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell'esecuzione predefinita `pnpm test:e2e`
  - Richiede una CLI `openshell` locale più un demone Docker funzionante
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, poi distrugge il gateway di test e la sandbox
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando esegui manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a un binario CLI non predefinito o a uno script wrapper

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Configurazione: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e test live dei plugin inclusi sotto `extensions/`
- Predefinito: **abilitato** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - “Questo provider/modello funziona davvero _oggi_ con credenziali reali?”
  - Intercettare cambiamenti di formato dei provider, particolarità del tool-calling, problemi auth e comportamento dei rate limit
- Aspettative:
  - Per progettazione non stabile in CI (reti reali, policy reali dei provider, quote, outage)
  - Costa denaro / usa rate limit
  - Preferisci eseguire sottoinsiemi ristretti invece di “tutto”
- Le esecuzioni live leggono `~/.profile` per recuperare eventuali chiavi API mancanti.
- Per impostazione predefinita, le esecuzioni live isolano comunque `HOME` e copiano materiale di config/auth in una home temporanea di test così le fixture unit non possono modificare il tuo vero `~/.openclaw`.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando vuoi intenzionalmente che i test live usino la tua vera home directory.
- `pnpm test:live` ora usa per default una modalità più silenziosa: mantiene l'output di avanzamento `[live] ...`, ma sopprime l'avviso extra su `~/.profile` e silenzia i log di bootstrap gateway/il rumore Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi riavere i log completi di avvio.
- Rotazione delle chiavi API (specifica per provider): imposta `*_API_KEYS` con formato virgola/punto e virgola oppure `*_API_KEY_1`, `*_API_KEY_2` (per esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oppure override per-live tramite `OPENCLAW_LIVE_*_KEY`; i test ritentano in caso di risposte con rate limit.
- Output di avanzamento/heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr così le chiamate lunghe ai provider restano visibilmente attive anche quando la cattura console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l'intercettazione della console di Vitest così le righe di avanzamento provider/gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli heartbeat direct-model con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli heartbeat gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite dovrei eseguire?

Usa questa tabella decisionale:

- Modifichi logica/test: esegui `pnpm test` (e `pnpm test:coverage` se hai cambiato molto)
- Tocchi networking gateway / protocollo WS / pairing: aggiungi `pnpm test:e2e`
- Fai debug di “il mio bot è giù” / errori specifici del provider / tool calling: esegui un `pnpm test:live` ristretto

## Live: sweep delle capability del node Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Obiettivo: invocare **ogni comando attualmente pubblicizzato** da un node Android connesso e verificare il comportamento del contratto del comando.
- Ambito:
  - Setup manuale/precondizionato (la suite non installa/esegue/associa l'app).
  - Validazione `node.invoke` del gateway comando per comando per il node Android selezionato.
- Pre-setup richiesto:
  - App Android già connessa + associata al gateway.
  - App mantenuta in foreground.
  - Permessi/consenso alla cattura concessi per le capability che ti aspetti passino.
- Override target opzionali:
  - `OPENCLAW_ANDROID_NODE_ID` oppure `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Dettagli completi del setup Android: [App Android](/it/platforms/android)

## Live: smoke dei modelli (chiavi profilo)

I test live sono divisi in due livelli così possiamo isolare i guasti:

- “Direct model” ci dice se provider/modello riescono a rispondere con quella chiave.
- “Gateway smoke” ci dice se l'intera pipeline gateway+agent funziona per quel modello (sessioni, cronologia, strumenti, policy sandbox, ecc.).

### Livello 1: completamento direct model (senza gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Obiettivo:
  - Enumerare i modelli rilevati
  - Usare `getApiKeyForModel` per selezionare i modelli per cui hai credenziali
  - Eseguire un piccolo completamento per modello (e regressioni mirate dove serve)
- Come abilitarlo:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Imposta `OPENCLAW_LIVE_MODELS=modern` (oppure `all`, alias di modern) per eseguire davvero questa suite; altrimenti viene saltata per mantenere `pnpm test:live` focalizzato sul gateway smoke
- Come selezionare i modelli:
  - `OPENCLAW_LIVE_MODELS=modern` per eseguire la allowlist modern (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` è un alias della allowlist modern
  - oppure `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separata da virgole)
  - Gli sweep modern/all usano per default un cap curato ad alto segnale; imposta `OPENCLAW_LIVE_MAX_MODELS=0` per uno sweep modern esaustivo oppure un numero positivo per un cap più piccolo.
- Come selezionare i provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separata da virgole)
- Da dove arrivano le chiavi:
  - Per default: archivio profili e fallback env
  - Imposta `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre **solo** l'archivio profili
- Perché esiste:
  - Separa “l'API del provider è rotta / la chiave non è valida” da “la pipeline dell'agente gateway è rotta”
  - Contiene regressioni piccole e isolate (esempio: replay di reasoning di OpenAI Responses/Codex Responses + flussi tool-call)

### Livello 2: gateway + smoke dell'agente dev (quello che fa davvero "@openclaw")

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Obiettivo:
  - Avviare un gateway in-process
  - Creare/applicare patch a una sessione `agent:dev:*` (override del modello per esecuzione)
  - Iterare sui modelli-con-chiavi e verificare:
    - risposta “significativa” (senza strumenti)
    - che una vera invocazione di strumento funzioni (read probe)
    - probe di strumenti extra opzionali (exec+read probe)
    - che i percorsi di regressione OpenAI (solo tool-call → follow-up) continuino a funzionare
- Dettagli delle probe (così puoi spiegare rapidamente gli errori):
  - `read` probe: il test scrive un file nonce nel workspace e chiede all'agente di `read` quel file e riecheggiare il nonce.
  - `exec+read` probe: il test chiede all'agente di scrivere con `exec` un nonce in un file temporaneo, poi di rileggerlo con `read`.
  - image probe: il test allega un PNG generato (gatto + codice randomizzato) e si aspetta che il modello restituisca `cat <CODE>`.
  - Riferimento implementativo: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Come abilitarlo:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Come selezionare i modelli:
  - Predefinito: allowlist modern (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` è un alias della allowlist modern
  - Oppure imposta `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o elenco separato da virgole) per restringere
  - Gli sweep gateway modern/all usano per default un cap curato ad alto segnale; imposta `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` per uno sweep modern esaustivo oppure un numero positivo per un cap più piccolo.
- Come selezionare i provider (evita “OpenRouter tutto”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separata da virgole)
- Le probe di strumenti + immagini sono sempre attive in questo test live:
  - `read` probe + `exec+read` probe (stress degli strumenti)
  - la image probe viene eseguita quando il modello pubblicizza supporto per input immagine
  - Flusso (panoramica):
    - Il test genera un piccolo PNG con “CAT” + codice casuale (`src/gateway/live-image-probe.ts`)
    - Lo invia tramite `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Il gateway analizza gli allegati in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L'agente incorporato inoltra al modello un messaggio utente multimodale
    - Verifica: la risposta contiene `cat` + il codice (tolleranza OCR: sono ammessi piccoli errori)

Suggerimento: per vedere cosa puoi testare sulla tua macchina (e gli ID esatti `provider/model`), esegui:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke del backend CLI (Claude, Codex, Gemini o altre CLI locali)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Obiettivo: validare la pipeline Gateway + agente usando un backend CLI locale, senza toccare la tua configurazione predefinita.
- I valori predefiniti smoke specifici del backend si trovano nella definizione `cli-backend.ts` dell'extension proprietaria.
- Abilitazione:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valori predefiniti:
  - Provider/modello predefinito: `claude-cli/claude-sonnet-4-6`
  - Comportamento di comando/argomenti/immagine deriva dai metadati del plugin backend CLI proprietario.
- Override (opzionali):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` per inviare un vero allegato immagine (i percorsi vengono iniettati nel prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` per passare i percorsi dei file immagine come argomenti CLI invece che tramite iniezione nel prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oppure `"list"`) per controllare come vengono passati gli argomenti immagine quando `IMAGE_ARG` è impostato.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` per inviare un secondo turno e validare il flusso di resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` per disabilitare la probe predefinita di continuità della stessa sessione Claude Sonnet -> Opus (impostala a `1` per forzarla quando il modello selezionato supporta una destinazione di switch).

Esempio:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Recipe Docker:

```bash
pnpm test:docker:live-cli-backend
```

Recipe Docker a provider singolo:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Note:

- Il runner Docker si trova in `scripts/test-live-cli-backend-docker.sh`.
- Esegue lo smoke live del backend CLI dentro l'immagine Docker del repository come utente non root `node`.
- Risolve i metadati smoke CLI dall'extension proprietaria, poi installa il pacchetto CLI Linux corrispondente (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) in un prefisso scrivibile in cache in `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predefinito: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` richiede OAuth portabile di Claude Code subscription tramite `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` oppure `CLAUDE_CODE_OAUTH_TOKEN` da `claude setup-token`. Prima dimostra direttamente `claude -p` in Docker, poi esegue due turni Gateway CLI-backend senza preservare le variabili d'ambiente della chiave API Anthropic. Questa lane subscription disabilita per default le probe Claude MCP/tool e image perché Claude attualmente instrada l'uso delle app di terze parti attraverso fatturazione extra-usage invece che tramite i normali limiti del piano subscription.
- Lo smoke live del backend CLI ora esercita lo stesso flusso end-to-end per Claude, Codex e Gemini: turno testuale, turno di classificazione immagini, poi chiamata dello strumento MCP `cron` verificata tramite la CLI gateway.
- Lo smoke predefinito di Claude applica anche una patch alla sessione da Sonnet a Opus e verifica che la sessione ripresa ricordi ancora una nota precedente.

## Live: smoke di ACP bind (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Obiettivo: validare il vero flusso ACP di conversation-bind con un agente ACP live:
  - inviare `/acp spawn <agent> --bind here`
  - associare sul posto una conversazione sintetica di canale messaggi
  - inviare un normale follow-up su quella stessa conversazione
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
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- Note:
  - Questa lane usa la superficie gateway `chat.send` con campi admin-only sintetici di originating-route così i test possono allegare contesto di canale messaggi senza fingere una consegna esterna.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` non è impostato, il test usa il registro agenti integrato del plugin incorporato `acpx` per l'agente harness ACP selezionato.

Esempio:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Recipe Docker:

```bash
pnpm test:docker:live-acp-bind
```

Recipe Docker a singolo agente:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Note Docker:

- Il runner Docker si trova in `scripts/test-live-acp-bind-docker.sh`.
- Per impostazione predefinita, esegue lo smoke ACP bind contro tutti gli agenti CLI live supportati in sequenza: `claude`, `codex`, poi `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` oppure `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` per restringere la matrix.
- Legge `~/.profile`, prepara il materiale auth CLI corrispondente nel container, installa `acpx` in un prefisso npm scrivibile, poi installa la CLI live richiesta (`@anthropic-ai/claude-code`, `@openai/codex` oppure `@google/gemini-cli`) se manca.
- Dentro Docker, il runner imposta `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` così acpx mantiene disponibili alla CLI harness figlia le variabili d'ambiente del provider provenienti dal profilo caricato.

## Live: smoke dell'harness app-server Codex

- Obiettivo: validare l'harness Codex di proprietà del plugin tramite il normale metodo gateway
  `agent`:
  - caricare il plugin incluso `codex`
  - selezionare `OPENCLAW_AGENT_RUNTIME=codex`
  - inviare un primo turno gateway agent a `codex/gpt-5.4`
  - inviare un secondo turno alla stessa sessione OpenClaw e verificare che il thread app-server
    possa riprendere
  - eseguire `/codex status` e `/codex models` tramite lo stesso percorso
    di comando gateway
  - opzionalmente eseguire due probe shell escalate revisionate da Guardian: un
    comando benigno che dovrebbe essere approvato e un finto upload di segreto che dovrebbe essere
    negato così l'agente chiede conferma
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modello predefinito: `codex/gpt-5.4`
- Probe immagine opzionale: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Probe MCP/tool opzionale: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Probe Guardian opzionale: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Lo smoke imposta `OPENCLAW_AGENT_HARNESS_FALLBACK=none` così un harness Codex
  rotto non può passare ricadendo silenziosamente su PI.
- Auth: `OPENAI_API_KEY` dalla shell/profilo, più eventuali
  `~/.codex/auth.json` e `~/.codex/config.toml` copiati

Recipe locale:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Recipe Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Note Docker:

- Il runner Docker si trova in `scripts/test-live-codex-harness-docker.sh`.
- Legge il `~/.profile` montato, passa `OPENAI_API_KEY`, copia i file auth della CLI Codex
  quando presenti, installa `@openai/codex` in un prefisso npm montato scrivibile,
  prepara il source tree, poi esegue solo il test live dell'harness Codex.
- Docker abilita per impostazione predefinita le probe immagine, MCP/tool e Guardian. Imposta
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oppure
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` oppure
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` quando hai bisogno di una
  esecuzione di debug più ristretta.
- Docker esporta anche `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, in linea con la configurazione del test live così il fallback `openai-codex/*` o PI non può nascondere una regressione dell'harness Codex.

### Recipe live consigliate

Allowlist ristrette ed esplicite sono più rapide e meno flaky:

- Modello singolo, direct (senza gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modello singolo, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling su più provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Focus Google (chiave API Gemini + Antigravity):
  - Gemini (chiave API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Note:

- `google/...` usa l'API Gemini (chiave API).
- `google-antigravity/...` usa il bridge OAuth Antigravity (endpoint agente in stile Cloud Code Assist).
- `google-gemini-cli/...` usa la CLI Gemini locale sulla tua macchina (auth separata + particolarità degli strumenti).
- API Gemini vs CLI Gemini:
  - API: OpenClaw chiama l'API Gemini ospitata da Google via HTTP (chiave API / auth di profilo); questo è ciò che la maggior parte degli utenti intende con “Gemini”.
  - CLI: OpenClaw esegue shell out a un binario `gemini` locale; ha una propria auth e può comportarsi in modo diverso (supporto streaming/tool/version skew).

## Live: matrix dei modelli (cosa copriamo)

Non esiste un “elenco modelli CI” fisso (live è opt-in), ma questi sono i modelli **consigliati** da coprire regolarmente su una macchina di sviluppo con chiavi.

### Set smoke modern (tool calling + immagine)

Questa è l'esecuzione dei “modelli comuni” che ci aspettiamo continui a funzionare:

- OpenAI (non-Codex): `openai/gpt-5.4` (opzionale: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (oppure `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evita i vecchi modelli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Esegui gateway smoke con strumenti + immagine:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling (Read + Exec opzionale)

Scegline almeno uno per ogni famiglia di provider:

- OpenAI: `openai/gpt-5.4` (oppure `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (oppure `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oppure `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Copertura aggiuntiva opzionale (nice to have):

- xAI: `xai/grok-4` (oppure il più recente disponibile)
- Mistral: `mistral/`… (scegli un modello “tools” che hai abilitato)
- Cerebras: `cerebras/`… (se hai accesso)
- LM Studio: `lmstudio/`… (locale; il tool calling dipende dalla modalità API)

### Vision: invio immagine (allegato → messaggio multimodale)

Includi almeno un modello con capability immagini in `OPENCLAW_LIVE_GATEWAY_MODELS` (varianti Claude/Gemini/OpenAI con supporto vision, ecc.) per esercitare la image probe.

### Aggregatori / gateway alternativi

Se hai le chiavi abilitate, supportiamo anche test tramite:

- OpenRouter: `openrouter/...` (centinaia di modelli; usa `openclaw models scan` per trovare candidati con capability tool+image)
- OpenCode: `opencode/...` per Zen e `opencode-go/...` per Go (auth tramite `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Altri provider che puoi includere nella matrix live (se hai credenziali/config):

- Integrati: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Tramite `models.providers` (endpoint personalizzati): `minimax` (cloud/API), più qualsiasi proxy compatibile OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, ecc.)

Suggerimento: non cercare di hardcodare “tutti i modelli” nella documentazione. L'elenco autorevole è qualunque cosa restituisca `discoverModels(...)` sulla tua macchina + tutte le chiavi disponibili.

## Credenziali (non committare mai)

I test live rilevano le credenziali nello stesso modo in cui lo fa la CLI. Implicazioni pratiche:

- Se la CLI funziona, i test live dovrebbero trovare le stesse chiavi.
- Se un test live dice “no creds”, fai debug come faresti per `openclaw models list` / selezione del modello.

- Profili auth per agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (questo è ciò che “profile keys” significa nei test live)
- Configurazione: `~/.openclaw/openclaw.json` (oppure `OPENCLAW_CONFIG_PATH`)
- Directory di stato legacy: `~/.openclaw/credentials/` (copiata nella home live preparata quando presente, ma non è l'archivio principale delle chiavi profilo)
- Le esecuzioni live locali copiano per default nella home temporanea di test la configurazione attiva, i file `auth-profiles.json` per agente, `credentials/` legacy e le directory auth CLI esterne supportate; le home live preparate saltano `workspace/` e `sandboxes/`, e gli override di percorso `agents.*.workspace` / `agentDir` vengono rimossi così le probe restano fuori dal tuo vero workspace host.

Se vuoi basarti su chiavi env (per esempio esportate nel tuo `~/.profile`), esegui i test locali dopo `source ~/.profile`, oppure usa i runner Docker sotto (possono montare `~/.profile` nel container).

## Live Deepgram (trascrizione audio)

- Test: `extensions/deepgram/audio.live.test.ts`
- Abilitazione: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Test: `extensions/byteplus/live.test.ts`
- Abilitazione: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Override modello opzionale: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live ComfyUI workflow media

- Test: `extensions/comfy/comfy.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Ambito:
  - Esercita i percorsi inclusi comfy per immagini, video e `music_generate`
  - Salta ogni capability a meno che `models.providers.comfy.<capability>` non sia configurato
  - Utile dopo modifiche a invio workflow comfy, polling, download o registrazione plugin

## Live generazione immagini

- Test: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Ambito:
  - Enumera ogni plugin provider di generazione immagini registrato
  - Carica le variabili d'ambiente provider mancanti dalla tua login shell (`~/.profile`) prima delle probe
  - Usa per default le chiavi API live/env prima dei profili auth archiviati, così chiavi di test obsolete in `auth-profiles.json` non mascherano le vere credenziali della shell
  - Salta i provider senza auth/profilo/modello utilizzabili
  - Esegue le varianti stock di generazione immagini tramite la capability runtime condivisa:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provider inclusi attualmente coperti:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- Restringimento opzionale:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- Comportamento auth opzionale:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare auth da archivio profili e ignorare override solo env

## Live generazione musica

- Test: `extensions/music-generation-providers.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Ambito:
  - Esercita il percorso condiviso incluso del provider di generazione musica
  - Attualmente copre Google e MiniMax
  - Carica le variabili d'ambiente provider dalla tua login shell (`~/.profile`) prima delle probe
  - Usa per default le chiavi API live/env prima dei profili auth archiviati, così chiavi di test obsolete in `auth-profiles.json` non mascherano le vere credenziali della shell
  - Salta i provider senza auth/profilo/modello utilizzabili
  - Esegue entrambe le modalità runtime dichiarate quando disponibili:
    - `generate` con input solo prompt
    - `edit` quando il provider dichiara `capabilities.edit.enabled`
  - Copertura attuale della lane condivisa:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy separato, non questo sweep condiviso
- Restringimento opzionale:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamento auth opzionale:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare auth da archivio profili e ignorare override solo env

## Live generazione video

- Test: `extensions/video-generation-providers.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Ambito:
  - Esercita il percorso condiviso incluso del provider di generazione video
  - Per default usa il percorso smoke sicuro per release: provider non-FAL, una richiesta text-to-video per provider, prompt aragosta di un secondo e un cap di operazione per provider da `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` per default)
  - Salta FAL per default perché la latenza della coda lato provider può dominare il tempo di release; passa `--video-providers fal` o `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` per eseguirlo esplicitamente
  - Carica le variabili d'ambiente provider dalla tua login shell (`~/.profile`) prima delle probe
  - Usa per default le chiavi API live/env prima dei profili auth archiviati, così chiavi di test obsolete in `auth-profiles.json` non mascherano le vere credenziali della shell
  - Salta i provider senza auth/profilo/modello utilizzabili
  - Esegue solo `generate` per default
  - Imposta `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` per eseguire anche le modalità di trasformazione dichiarate quando disponibili:
    - `imageToVideo` quando il provider dichiara `capabilities.imageToVideo.enabled` e il provider/modello selezionato accetta input immagine locale supportato da buffer nello sweep condiviso
    - `videoToVideo` quando il provider dichiara `capabilities.videoToVideo.enabled` e il provider/modello selezionato accetta input video locale supportato da buffer nello sweep condiviso
  - Provider `imageToVideo` attualmente dichiarati ma saltati nello sweep condiviso:
    - `vydra` perché il `veo3` incluso è solo testo e il `kling` incluso richiede un URL immagine remoto
  - Copertura specifica provider Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - quel file esegue `veo3` text-to-video più una lane `kling` che usa per default una fixture URL immagine remota
  - Copertura live attuale `videoToVideo`:
    - solo `runway` quando il modello selezionato è `runway/gen4_aleph`
  - Provider `videoToVideo` attualmente dichiarati ma saltati nello sweep condiviso:
    - `alibaba`, `qwen`, `xai` perché quei percorsi richiedono attualmente URL di riferimento remoti `http(s)` / MP4
    - `google` perché l'attuale lane condivisa Gemini/Veo usa input locale supportato da buffer e quel percorso non è accettato nello sweep condiviso
    - `openai` perché l'attuale lane condivisa non garantisce accesso org-specific a video inpaint/remix
- Restringimento opzionale:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` per includere ogni provider nello sweep predefinito, incluso FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` per ridurre il cap di operazione di ogni provider in un'esecuzione smoke aggressiva
- Comportamento auth opzionale:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare auth da archivio profili e ignorare override solo env

## Harness live media

- Comando: `pnpm test:live:media`
- Scopo:
  - Esegue le suite live condivise di immagini, musica e video tramite un unico entrypoint nativo del repository
  - Carica automaticamente le variabili d'ambiente provider mancanti da `~/.profile`
  - Restringe automaticamente ogni suite ai provider che al momento hanno auth utilizzabile per default
  - Riutilizza `scripts/test-live.mjs`, così comportamento heartbeat e quiet mode restano coerenti
- Esempi:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runner Docker (controlli opzionali "funziona in Linux")

Questi runner Docker si dividono in due gruppi:

- Runner live-model: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il file live di profile-key corrispondente dentro l'immagine Docker del repository (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la tua directory config locale e workspace (e leggendo `~/.profile` se montato). Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner Docker live usano per default un cap smoke più piccolo così uno sweep Docker completo resta pratico:
  `test:docker:live-models` usa per default `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa per default `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sovrascrivi queste variabili d'ambiente quando
  vuoi esplicitamente la scansione esaustiva più grande.
- `test:docker:all` costruisce una volta l'immagine Docker live tramite `test:docker:live-build`, poi la riutilizza per le due lane Docker live. Costruisce anche una singola immagine condivisa `scripts/e2e/Dockerfile` tramite `test:docker:e2e-build` e la riutilizza per i runner smoke E2E in container che esercitano l'app buildata.
- Runner smoke in container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` e `test:docker:config-reload` avviano uno o più container reali e verificano percorsi di integrazione di livello più alto.

I runner Docker live-model montano in bind anche solo le home auth CLI necessarie (oppure tutte quelle supportate quando l'esecuzione non è ristretta), poi le copiano nella home del container prima dell'esecuzione così OAuth delle CLI esterne può aggiornare i token senza modificare l'archivio auth dell'host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Procedura guidata di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke npm tarball onboarding/canale/agente: `pnpm test:docker:npm-onboard-channel-agent` installa globalmente in Docker il tarball OpenClaw pacchettizzato, configura OpenAI tramite onboarding env-ref più Telegram per default, verifica che l'abilitazione del plugin installi le sue dipendenze runtime on demand, esegue doctor ed esegue un turno agente OpenAI mockato. Riutilizza un tarball prebuildato con `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la ricostruzione host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, oppure cambia canale con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Gateway networking (due container, auth WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Regressione OpenAI Responses `web_search` minimal reasoning: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) esegue un server OpenAI mockato tramite Gateway, verifica che `web_search` alzi `reasoning.effort` da `minimal` a `low`, poi forza il rifiuto dello schema provider e controlla che il dettaglio raw appaia nei log Gateway.
- Bridge canale MCP (Gateway seedato + bridge stdio + smoke raw del notification-frame Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Strumenti MCP bundle Pi (vero server MCP stdio + smoke allow/deny del profilo Pi incorporato): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cleanup MCP Cron/subagent (vero Gateway + teardown del child MCP stdio dopo Cron isolato ed esecuzioni one-shot del subagent): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke di installazione + alias `/plugin` + semantica di riavvio del bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
- Smoke plugin update unchanged: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke metadati config reload: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dipendenze runtime dei plugin inclusi: `pnpm test:docker:bundled-channel-deps` costruisce per default una piccola immagine runner Docker, builda e pacchettizza OpenClaw una volta sull'host, poi monta quel tarball in ogni scenario di installazione Linux. Riutilizza l'immagine con `OPENCLAW_SKIP_DOCKER_BUILD=1`, salta la ricostruzione host dopo una build locale recente con `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, oppure punta a un tarball esistente con `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Restringi le dipendenze runtime dei plugin inclusi mentre iteri disabilitando gli scenari non correlati, per esempio:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Per prebuildare e riutilizzare manualmente l'immagine condivisa built-app:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Override dell'immagine specifici della suite come `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` hanno comunque la precedenza quando impostati. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` punta a un'immagine condivisa remota, gli script la scaricano se non è già locale. I test Docker QR e installer mantengono i propri Dockerfile perché validano il comportamento di package/installazione invece del runtime built-app condiviso.

I runner Docker live-model montano anche in bind il checkout corrente in sola lettura e
lo preparano in una workdir temporanea dentro il container. Questo mantiene snella l'immagine runtime
pur eseguendo Vitest contro i tuoi esatti sorgenti/config locali.
Il passaggio di staging salta grandi cache solo locali e output di build delle app come
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e directory `.build` locali delle app o
output Gradle, così le esecuzioni Docker live non passano minuti a copiare
artifact specifici della macchina.
Impostano anche `OPENCLAW_SKIP_CHANNELS=1` così le probe gateway live non avviano
worker di canale reali Telegram/Discord/ecc. dentro il container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi inoltra anche
`OPENCLAW_LIVE_GATEWAY_*` quando hai bisogno di restringere o escludere la copertura gateway
live da quella lane Docker.
`test:docker:openwebui` è uno smoke di compatibilità di livello più alto: avvia un
container gateway OpenClaw con endpoint HTTP compatibili OpenAI abilitati,
avvia un container Open WebUI fissato contro quel gateway, effettua il login tramite
Open WebUI, verifica che `/api/models` esponga `openclaw/default`, poi invia una
vera richiesta chat tramite il proxy `/api/chat/completions` di Open WebUI.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe dover scaricare
l'immagine Open WebUI e Open WebUI potrebbe dover completare il proprio setup cold-start.
Questa lane si aspetta una chiave modello live utilizzabile, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` per default) è il modo principale per fornirla nelle esecuzioni Dockerizzate.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un
vero account Telegram, Discord o iMessage. Avvia un container Gateway
seedato, avvia un secondo container che esegue `openclaw mcp serve`, quindi
verifica il rilevamento delle conversazioni instradate, la lettura delle trascrizioni, i metadati
degli allegati, il comportamento della coda eventi live, l'instradamento dell'invio in uscita e notifiche in stile Claude su canali +
permessi tramite il vero bridge MCP stdio. Il controllo delle notifiche
ispeziona direttamente i frame stdio MCP raw così lo smoke valida ciò che
il bridge emette davvero, non solo ciò che un particolare SDK client capita di esporre.
`test:docker:pi-bundle-mcp-tools` è deterministico e non richiede una
chiave modello live. Costruisce l'immagine Docker del repository, avvia un vero server probe MCP stdio
dentro il container, materializza quel server tramite il runtime MCP bundle Pi incorporato,
esegue lo strumento, poi verifica che `coding` e `messaging` mantengano
gli strumenti `bundle-mcp` mentre `minimal` e `tools.deny: ["bundle-mcp"]` li filtrano.
`test:docker:cron-mcp-cleanup` è deterministico e non richiede una chiave modello live.
Avvia un Gateway seedato con un vero server probe MCP stdio, esegue un
turno Cron isolato e un turno child one-shot `/subagents spawn`, poi verifica
che il processo figlio MCP termini dopo ogni esecuzione.

Smoke manuale ACP thread in linguaggio naturale (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantieni questo script per flussi di lavoro di regressione/debug. Potrebbe servire di nuovo per la validazione del routing ACP dei thread, quindi non eliminarlo.

Variabili d'ambiente utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinito: `~/.openclaw`) montata su `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinito: `~/.openclaw/workspace`) montata su `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinito: `~/.profile`) montata su `/home/node/.profile` e letta prima di eseguire i test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` per verificare solo le variabili d'ambiente lette da `OPENCLAW_PROFILE_FILE`, usando directory config/workspace temporanee e nessun mount auth CLI esterno
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinito: `~/.cache/openclaw/docker-cli-tools`) montata su `/home/node/.npm-global` per installazioni CLI in cache dentro Docker
- Directory/file auth CLI esterni sotto `$HOME` vengono montati in sola lettura sotto `/host-auth...`, poi copiati in `/home/node/...` prima dell'avvio dei test
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni con provider ristretto montano solo directory/file necessari dedotti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manuale con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, oppure un elenco separato da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l'esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riutilizzare un'immagine `openclaw:local-live` esistente per rerun che non richiedono una ricostruzione
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per garantire che le credenziali provengano dall'archivio profili (non dall'env)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal gateway per lo smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sovrascrivere il prompt di controllo nonce usato dallo smoke Open WebUI
- `OPENWEBUI_IMAGE=...` per sovrascrivere il tag immagine Open WebUI fissato

## Sanity check della documentazione

Esegui i controlli docs dopo modifiche alla documentazione: `pnpm check:docs`.
Esegui la validazione completa degli anchor Mintlify quando hai bisogno anche di controlli sugli heading in-page: `pnpm docs:check-links:anchors`.

## Regressione offline (sicura per CI)

Queste sono regressioni “pipeline reale” senza provider reali:

- Tool calling Gateway (mock OpenAI, vero gateway + loop agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Procedura guidata Gateway (WS `wizard.start`/`wizard.next`, scrive config + auth enforced): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Valutazioni di affidabilità dell'agente (Skills)

Abbiamo già alcuni test sicuri per CI che si comportano come “valutazioni di affidabilità dell'agente”:

- Mock tool-calling tramite il vero gateway + loop agente (`src/gateway/gateway.test.ts`).
- Flussi end-to-end della procedura guidata che validano wiring della sessione ed effetti della configurazione (`src/gateway/gateway.test.ts`).

Cosa manca ancora per Skills (vedi [Skills](/it/tools/skills)):

- **Decisioning:** quando le Skills sono elencate nel prompt, l'agente sceglie la Skill corretta (o evita quelle irrilevanti)?
- **Compliance:** l'agente legge `SKILL.md` prima dell'uso e segue i passaggi/argomenti richiesti?
- **Workflow contracts:** scenari multi-turno che verificano ordine degli strumenti, carryover della cronologia della sessione e confini della sandbox.

Le valutazioni future dovrebbero restare prima di tutto deterministiche:

- Un runner di scenari che usa provider mock per verificare chiamate agli strumenti + ordine, letture dei file Skill e wiring della sessione.
- Una piccola suite di scenari focalizzati sulle Skills (usa vs evita, gating, prompt injection).
- Valutazioni live opzionali (opt-in, protette da env) solo dopo che la suite sicura per CI è in posto.

## Test di contratto (forma di plugin e canali)

I test di contratto verificano che ogni plugin e canale registrato sia conforme al
proprio contratto di interfaccia. Iterano su tutti i plugin rilevati ed eseguono una suite di
verifiche di forma e comportamento. La lane unitaria predefinita `pnpm test`
salta intenzionalmente questi file condivisi di seam e smoke; esegui i comandi di contratto esplicitamente
quando tocchi superfici condivise di canali o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti dei canali: `pnpm test:contracts:channels`
- Solo contratti dei provider: `pnpm test:contracts:plugins`

### Contratti dei canali

Si trovano in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma base del plugin (id, name, capabilities)
- **setup** - Contratto della procedura guidata di setup
- **session-binding** - Comportamento di binding della sessione
- **outbound-payload** - Struttura del payload del messaggio
- **inbound** - Gestione dei messaggi in ingresso
- **actions** - Handler delle azioni del canale
- **threading** - Gestione dell'ID del thread
- **directory** - API directory/roster
- **group-policy** - Applicazione della policy di gruppo

### Contratti di stato dei provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe di stato del canale
- **registry** - Forma del registro plugin

### Contratti dei provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contratto del flusso auth
- **auth-choice** - Scelta/selezione auth
- **catalog** - API del catalogo modelli
- **discovery** - Rilevamento plugin
- **loader** - Caricamento plugin
- **runtime** - Runtime del provider
- **shape** - Forma/interfaccia del plugin
- **wizard** - Procedura guidata di setup

### Quando eseguirli

- Dopo aver modificato export o sottopercorsi del plugin-sdk
- Dopo aver aggiunto o modificato un plugin canale o provider
- Dopo aver rifattorizzato registrazione o rilevamento plugin

I test di contratto vengono eseguiti in CI e non richiedono chiavi API reali.

## Aggiungere regressioni (linee guida)

Quando correggi un problema di provider/modello scoperto in live:

- Aggiungi, se possibile, una regressione sicura per CI (provider mock/stub, oppure cattura l'esatta trasformazione della forma della richiesta)
- Se è intrinsecamente solo live (rate limit, policy auth), mantieni il test live ristretto e opt-in tramite variabili d'ambiente
- Preferisci puntare al livello più piccolo che intercetta il bug:
  - bug di conversione/replay della richiesta del provider → test dei modelli diretti
  - bug della pipeline gateway di sessione/cronologia/strumenti → gateway live smoke o test gateway mock sicuro per CI
- Guardrail sull'attraversamento SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target campionato per classe SecretRef dai metadati del registro (`listSecretTargetRegistryEntries()`), poi verifica che gli exec id dei segmenti di attraversamento vengano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente sugli ID target non classificati così le nuove classi non possono essere saltate in silenzio.
