---
read_when:
    - Esecuzione dei test in locale o in CI
    - Aggiunta di test di regressione per bug di modelli/provider
    - Debug del comportamento di Gateway + agenti
summary: 'Kit di test: suite unit/e2e/live, runner Docker e cosa copre ogni test'
title: Test
x-i18n:
    generated_at: "2026-04-23T13:58:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0e9bdea78cba7e512358d2e4d428da04a2071188e74af2d5419d2c85eafe15
    source_path: help/testing.md
    workflow: 15
---

# Test

OpenClaw ha tre suite Vitest (unit/integration, e2e, live) e un piccolo insieme di runner Docker.

Questa doc è una guida al “come testiamo”:

- Cosa copre ogni suite (e cosa deliberatamente _non_ copre)
- Quali comandi eseguire per i flussi di lavoro più comuni (locale, pre-push, debug)
- Come i test live individuano le credenziali e selezionano modelli/provider
- Come aggiungere regressioni per problemi reali di modelli/provider

## Avvio rapido

La maggior parte dei giorni:

- Gate completo (atteso prima del push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Esecuzione locale più rapida dell’intera suite su una macchina capiente: `pnpm test:max`
- Loop di watch diretto di Vitest: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi di extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Preferisci prima le esecuzioni mirate quando stai iterando su un singolo errore.
- Sito QA supportato da Docker: `pnpm qa:lab:up`
- Lane QA supportata da VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando tocchi i test o vuoi maggiore confidenza:

- Gate di coverage: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando fai debug di provider/modelli reali (richiede credenziali reali):

- Suite live (modelli + probe tool/immagini di Gateway): `pnpm test:live`
- Esegui un singolo file live in modalità silenziosa: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Sweep live dei modelli Docker: `pnpm test:docker:live-models`
  - Coverage CI: il job giornaliero `OpenClaw Scheduled Live And E2E Checks` e il job manuale
    `OpenClaw Release Checks` chiamano entrambi il workflow riutilizzabile live/E2E con
    `include_live_suites: true`, che include job matrix separati per i modelli live Docker
    suddivisi per provider.
  - Per riesecuzioni CI mirate, avvia `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` e `live_models_only: true`.
  - Aggiungi nuove credenziali di provider ad alto segnale a `scripts/ci-hydrate-live-auth.sh`
    più `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e i relativi chiamanti
    scheduled/release.
- Smoke di costo Moonshot/Kimi: con `MOONSHOT_API_KEY` impostata, esegui
  `openclaw models list --provider moonshot --json`, poi esegui un comando isolato
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  su `moonshot/kimi-k2.6`. Verifica che il JSON riporti Moonshot/K2.6 e che il
  transcript dell’assistente memorizzi `usage.cost` normalizzato.

Suggerimento: quando ti serve solo un caso fallito, preferisci restringere i test live tramite le variabili d’ambiente di allowlist descritte sotto.

## Runner specifici per QA

Questi comandi affiancano le suite di test principali quando ti serve il realismo di qa-lab:

La CI esegue QA Lab in workflow dedicati. `Parity gate` gira sulle PR corrispondenti e
da esecuzione manuale con provider mock. `QA-Lab - All Lanes` gira ogni notte su
`main` e da esecuzione manuale con il gate di parità mock, la lane Matrix live e la
lane Telegram live gestita da Convex come job paralleli. `OpenClaw Release Checks`
esegue le stesse lane prima dell’approvazione del rilascio.

- `pnpm openclaw qa suite`
  - Esegue direttamente sull’host gli scenari QA supportati dal repo.
  - Esegue più scenari selezionati in parallelo per impostazione predefinita con worker
    Gateway isolati. `qa-channel` usa come valore predefinito una concorrenza di 4
    (limitata dal numero di scenari selezionati). Usa `--concurrency <count>` per regolare
    il numero di worker, oppure `--concurrency 1` per la vecchia lane seriale.
  - Termina con codice diverso da zero se uno qualunque degli scenari fallisce. Usa `--allow-failures` quando
    vuoi ottenere gli artifact senza un codice di uscita di errore.
  - Supporta le modalità provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` avvia un server provider locale supportato da AIMock per una copertura
    sperimentale di fixture e mock di protocollo senza sostituire la lane
    `mock-openai` orientata agli scenari.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA all’interno di una VM Linux Multipass usa e getta.
  - Mantiene lo stesso comportamento di selezione degli scenari di `qa suite` sull’host.
  - Riutilizza gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il guest:
    chiavi provider basate su env, il percorso di configurazione del provider live QA e `CODEX_HOME`
    quando presente.
  - Le directory di output devono rimanere sotto la root del repo così il guest può scrivere indietro
    tramite il workspace montato.
  - Scrive il normale report + riepilogo QA più i log Multipass sotto
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA supportato da Docker per lavoro QA in stile operatore.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Costruisce un tarball npm a partire dal checkout corrente, lo installa globalmente in
    Docker, esegue onboarding non interattivo con chiave API OpenAI, configura Telegram
    per impostazione predefinita, verifica che l’abilitazione del plugin installi le dipendenze runtime
    on demand, esegue doctor e lancia un turno di agente locale contro un endpoint
    OpenAI mockato.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` per eseguire la stessa
    lane di installazione pacchettizzata con Discord.
- `pnpm test:docker:bundled-channel-deps`
  - Impacchetta e installa la build OpenClaw corrente in Docker, avvia il Gateway
    con OpenAI configurato, quindi abilita channel/plugin bundled tramite modifiche di config.
  - Verifica che il rilevamento del setup lasci assenti le dipendenze runtime dei plugin non configurati,
    che la prima esecuzione configurata di Gateway o doctor installi on demand le dipendenze runtime
    di ogni plugin bundled e che un secondo riavvio non reinstalli dipendenze
    già attivate.
  - Installa anche una baseline npm precedente nota, abilita Telegram prima di eseguire
    `openclaw update --tag <candidate>`, e verifica che il doctor post-aggiornamento del
    candidato ripari le dipendenze runtime dei channel bundled senza una riparazione postinstall
    dal lato harness.
- `pnpm openclaw qa aimock`
  - Avvia solo il server provider locale AIMock per test smoke diretti del protocollo.
- `pnpm openclaw qa matrix`
  - Esegue la lane QA live Matrix contro un homeserver Tuwunel temporaneo supportato da Docker.
  - Questo host QA oggi è solo per repo/dev. Le installazioni OpenClaw pacchettizzate non distribuiscono
    `qa-lab`, quindi non espongono `openclaw qa`.
  - I checkout del repo caricano direttamente il runner bundled; non serve alcun passaggio separato
    di installazione del plugin.
  - Esegue il provisioning di tre utenti Matrix temporanei (`driver`, `sut`, `observer`) più una room privata, quindi avvia un processo figlio QA gateway con il plugin Matrix reale come trasporto SUT.
  - Usa per impostazione predefinita l’immagine Tuwunel stable fissata `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Sovrascrivila con `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando devi testare un’immagine diversa.
  - Matrix non espone flag condivisi per la sorgente delle credenziali perché la lane esegue localmente il provisioning di utenti temporanei.
  - Scrive un report QA Matrix, un riepilogo, un artifact degli eventi osservati e un log combinato stdout/stderr sotto `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Esegue la lane QA live Telegram contro un gruppo privato reale usando i token bot driver e SUT da env.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’id del gruppo deve essere l’id numerico della chat Telegram.
  - Supporta `--credential-source convex` per credenziali condivise in pool. Usa la modalità env per impostazione predefinita, oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per usare lease condivisi.
  - Termina con codice diverso da zero se uno qualunque degli scenari fallisce. Usa `--allow-failures` quando
    vuoi ottenere gli artifact senza un codice di uscita di errore.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone uno username Telegram.
  - Per un’osservazione stabile bot-to-bot, abilita la modalità Bot-to-Bot Communication Mode in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico dei bot nel gruppo.
  - Scrive un report QA Telegram, un riepilogo e un artifact dei messaggi osservati sotto `.artifacts/qa-e2e/...`. Gli scenari di risposta includono l’RTT dalla richiesta di invio del driver alla risposta SUT osservata.

Le lane di trasporto live condividono un unico contratto standard così i nuovi trasporti non divergono:

`qa-channel` rimane l’ampia suite QA sintetica e non fa parte della matrice di coverage dei trasporti live.

| Lane     | Canary | Gating delle menzioni | Blocco allowlist | Risposta di primo livello | Ripresa dopo riavvio | Follow-up nel thread | Isolamento del thread | Osservazione delle reazioni | Comando help |
| -------- | ------ | --------------------- | ---------------- | ------------------------- | -------------------- | ------------------- | -------------------- | --------------------------- | ------------ |
| Matrix   | x      | x                     | x                | x                         | x                    | x                   | x                    | x                           |              |
| Telegram | x      |                       |                  |                           |                      |                     |                      |                             | x            |

### Credenziali Telegram condivise tramite Convex (v1)

Quando `--credential-source convex` (o `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) è abilitato per
`openclaw qa telegram`, QA lab acquisisce un lease esclusivo da un pool supportato da Convex, invia heartbeat
per quel lease mentre la lane è in esecuzione e rilascia il lease allo spegnimento.

Scaffold di riferimento del progetto Convex:

- `qa/convex-credential-broker/`

Variabili d’ambiente richieste:

- `OPENCLAW_QA_CONVEX_SITE_URL` (per esempio `https://your-deployment.convex.site`)
- Un secret per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione del ruolo delle credenziali:
  - CLI: `--credential-role maintainer|ci`
  - Valore predefinito env: `OPENCLAW_QA_CREDENTIAL_ROLE` (usa come default `ci` in CI, altrimenti `maintainer`)

Variabili d’ambiente facoltative:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predefinito `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predefinito `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predefinito `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predefinito `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predefinito `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id di trace facoltativo)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex `http://` in loopback solo per sviluppo locale.

`OPENCLAW_QA_CONVEX_SITE_URL` dovrebbe usare `https://` nel normale funzionamento.

I comandi admin per maintainer (aggiunta/rimozione/elenco pool) richiedono
specificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI per i maintainer:

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
  - Esaurito/riprovabile: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Successo: `{ status: "ok" }` (o `2xx` vuoto)
- `POST /release`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Successo: `{ status: "ok" }` (o `2xx` vuoto)
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
- `groupId` deve essere una stringa con l’id numerico della chat Telegram.
- `admin/add` valida questa forma per `kind: "telegram"` e rifiuta payload malformati.

### Aggiunta di un canale a QA

Aggiungere un canale al sistema QA Markdown richiede esattamente due cose:

1. Un adapter di trasporto per il canale.
2. Un pacchetto di scenari che eserciti il contratto del canale.

Non aggiungere una nuova root di comando QA di primo livello quando l’host condiviso `qa-lab` può
gestire il flusso.

`qa-lab` possiede la meccanica condivisa dell’host:

- la root di comando `openclaw qa`
- avvio e arresto della suite
- concorrenza dei worker
- scrittura degli artifact
- generazione dei report
- esecuzione degli scenari
- alias di compatibilità per i vecchi scenari `qa-channel`

I plugin runner possiedono il contratto di trasporto:

- come `openclaw qa <runner>` viene montato sotto la root condivisa `qa`
- come il gateway viene configurato per quel trasporto
- come viene verificata la readiness
- come vengono iniettati gli eventi in ingresso
- come vengono osservati i messaggi in uscita
- come vengono esposti transcript e stato di trasporto normalizzato
- come vengono eseguite le azioni supportate dal trasporto
- come viene gestito il reset o cleanup specifico del trasporto

La soglia minima di adozione per un nuovo canale è:

1. Mantenere `qa-lab` come proprietario della root condivisa `qa`.
2. Implementare il runner di trasporto sulla seam host condivisa `qa-lab`.
3. Mantenere la meccanica specifica del trasporto all’interno del plugin runner o harness del canale.
4. Montare il runner come `openclaw qa <runner>` invece di registrare una root di comando concorrente.
   I plugin runner dovrebbero dichiarare `qaRunners` in `openclaw.plugin.json` ed esportare un array `qaRunnerCliRegistrations` corrispondente da `runtime-api.ts`.
   Mantieni `runtime-api.ts` leggero; la CLI lazy e l’esecuzione del runner dovrebbero restare dietro entrypoint separati.
5. Scrivere o adattare scenari Markdown sotto le directory tematiche `qa/scenarios/`.
6. Usare gli helper di scenario generici per i nuovi scenari.
7. Mantenere funzionanti gli alias di compatibilità esistenti, a meno che il repo non stia facendo una migrazione intenzionale.

La regola decisionale è rigida:

- Se un comportamento può essere espresso una sola volta in `qa-lab`, mettilo in `qa-lab`.
- Se un comportamento dipende da un solo trasporto di canale, tienilo in quel plugin runner o harness del plugin.
- Se uno scenario richiede una nuova capability che può essere usata da più di un canale, aggiungi un helper generico invece di un branch specifico di canale in `suite.ts`.
- Se un comportamento ha senso solo per un trasporto, mantieni lo scenario specifico del trasporto e rendilo esplicito nel contratto dello scenario.

I nomi preferiti per i nuovi helper generici di scenario sono:

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
Gli alias di compatibilità esistono per evitare una migrazione in un solo giorno, non come modello per
la scrittura di nuovi scenari.

## Suite di test (cosa viene eseguito dove)

Pensa alle suite come a un “realismo crescente” (e crescente fragilità/costo):

### Unit / integration (predefinita)

- Comando: `pnpm test`
- Config: le esecuzioni non mirate usano il set di shard `vitest.full-*.config.ts` e possono espandere shard multi-project in config per singolo progetto per la pianificazione parallela
- File: inventari core/unit sotto `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e i test node di `ui` in allowlist coperti da `vitest.unit.config.ts`
- Ambito:
  - Test unitari puri
  - Test di integrazione in-process (auth del gateway, routing, tooling, parsing, config)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Viene eseguita in CI
  - Non richiede chiavi reali
  - Deve essere veloce e stabile
- Nota sui project:
  - `pnpm test` non mirato ora esegue dodici config shard più piccole (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un singolo gigantesco processo root-project nativo. Questo riduce l’RSS di picco su macchine sotto carico ed evita che il lavoro di auto-reply/extension affami suite non correlate.
  - `pnpm test --watch` usa ancora il grafo dei project della root nativa `vitest.config.ts`, perché un loop watch multi-shard non è pratico.
  - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima i target espliciti di file/directory attraverso lane con ambito ristretto, così `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di pagare il costo di avvio completo del progetto root.
  - `pnpm test:changed` espande i percorsi git modificati nelle stesse lane con ambito ristretto quando il diff tocca solo file sorgente/test instradabili; le modifiche a config/setup ricadono ancora nella riesecuzione ampia del root-project.
  - `pnpm check:changed` è il normale smart gate locale per lavoro ristretto. Classifica il diff in core, test core, extensions, test extension, app, docs, metadata di rilascio e tooling, quindi esegue le lane corrispondenti di typecheck/lint/test. Le modifiche a Plugin SDK pubblica e contratti plugin includono la validazione delle extension perché le extension dipendono da quei contratti core. I soli version bump nei metadata di rilascio eseguono controlli mirati su versione/config/dipendenze root invece della suite completa, con una guardia che rifiuta modifiche al package fuori dal campo versione di primo livello.
  - I test unitari leggeri rispetto agli import da agenti, comandi, plugin, helper di auto-reply, `plugin-sdk` e aree utilitarie pure simili passano per la lane `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file stateful/runtime-heavy restano sulle lane esistenti.
  - Alcuni file sorgente helper selezionati di `plugin-sdk` e `commands` mappano inoltre le esecuzioni in modalità changed a test sibling espliciti in quelle lane leggere, così le modifiche agli helper evitano di rieseguire l’intera suite pesante per quella directory.
  - `auto-reply` ora ha tre bucket dedicati: helper core di primo livello, test di integrazione `reply.*` di primo livello e il sottoalbero `src/auto-reply/reply/**`. Questo tiene il lavoro più pesante dell’harness reply lontano dai test economici di status/chunk/token.
- Nota sull’embedded runner:
  - Quando cambi gli input di discovery dei message-tool o il contesto runtime di Compaction,
    mantieni entrambi i livelli di coverage.
  - Aggiungi regressioni helper mirate per confini puri di routing/normalizzazione.
  - Mantieni sane anche le suite di integrazione dell’embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Quelle suite verificano che gli id con ambito e il comportamento di Compaction continuino a passare
    attraverso i percorsi reali `run.ts` / `compact.ts`; i soli test helper non sono un
    sostituto sufficiente per quei percorsi di integrazione.
- Nota sul pool:
  - La config base di Vitest ora usa `threads` come predefinito.
  - La config Vitest condivisa fissa anche `isolate: false` e usa il runner non isolato in root project, config e2e e live.
  - La lane UI root mantiene il proprio setup `jsdom` e optimizer, ma ora gira anch’essa sul runner condiviso non isolato.
  - Ogni shard di `pnpm test` eredita gli stessi valori predefiniti `threads` + `isolate: false` dalla config Vitest condivisa.
  - Il launcher condiviso `scripts/run-vitest.mjs` ora aggiunge anche `--no-maglev` per impostazione predefinita ai processi Node figli di Vitest per ridurre il churn di compilazione V8 durante grandi esecuzioni locali. Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` se devi confrontare con il comportamento stock di V8.
- Nota sull’iterazione locale rapida:
  - `pnpm changed:lanes` mostra quali lane architetturali attiva un diff.
  - Il pre-commit hook esegue `pnpm check:changed --staged` dopo formatting/linting dello staged, così i commit solo core non pagano il costo dei test extension a meno che non tocchino contratti pubblici rivolti alle extension. I commit di soli metadata di rilascio restano sulla lane mirata di versione/config/dipendenze root.
  - Se l’esatto insieme di modifiche staged è già stato validato con gate equivalenti o più forti, usa `scripts/committer --fast "<message>" <files...>` per saltare solo la riesecuzione del hook changed-scope. Formatting/linting dello staged vengono comunque eseguiti. Cita i gate completati nel tuo handoff. Questo è accettabile anche dopo che un errore flaky isolato dell’hook è stato rieseguito e passa con prova circoscritta.
  - `pnpm test:changed` passa attraverso lane con ambito ristretto quando i percorsi modificati si mappano chiaramente a una suite più piccola.
  - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di instradamento, solo con un limite di worker più alto.
  - L’auto-scaling locale dei worker ora è intenzionalmente conservativo e riduce anche quando il load average dell’host è già alto, così più esecuzioni Vitest concorrenti fanno meno danni per impostazione predefinita.
  - La config base di Vitest marca i file project/config come `forceRerunTriggers` così le riesecuzioni in modalità changed restano corrette quando cambia il wiring dei test.
  - La config mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli host supportati; imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi una posizione cache esplicita per profiling diretto.
- Nota sul debug delle performance:
  - `pnpm test:perf:imports` abilita il reporting della durata degli import di Vitest più l’output di breakdown degli import.
  - `pnpm test:perf:imports:changed` applica la stessa vista di profiling ai file modificati da `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta `test:changed` instradato con il percorso nativo root-project per quel diff commitatto e stampa wall time più max RSS su macOS.
- `pnpm test:perf:changed:bench -- --worktree` misura l’albero dirty corrente instradando l’elenco dei file modificati attraverso `scripts/test-projects.mjs` e la config root Vitest.
  - `pnpm test:perf:profile:main` scrive un profilo CPU del thread principale per overhead di avvio e transform di Vitest/Vite.
  - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la suite unit con parallelismo file disabilitato.

### Stability (gateway)

- Comando: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, forzata a un solo worker
- Ambito:
  - Avvia un Gateway loopback reale con diagnostica abilitata per impostazione predefinita
  - Fa passare churn sintetico di messaggi gateway, memoria e payload grandi attraverso il percorso di eventi diagnostici
  - Interroga `diagnostics.stability` tramite Gateway WS RPC
  - Copre gli helper di persistenza del bundle di stabilità diagnostica
  - Verifica che il recorder resti bounded, che i campioni RSS sintetici rimangano sotto il budget di pressione e che le profondità delle code per sessione tornino a zero
- Aspettative:
  - Sicura per CI e senza chiavi
  - Lane ristretta per follow-up di regressioni di stabilità, non un sostituto della suite Gateway completa

### E2E (smoke del gateway)

- Comando: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e test E2E dei plugin bundled sotto `extensions/`
- Valori predefiniti runtime:
  - Usa `threads` di Vitest con `isolate: false`, in linea con il resto del repo.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per impostazione predefinita).
  - Gira in modalità silenziosa per impostazione predefinita per ridurre l’overhead di I/O su console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (massimo 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riabilitare l’output verbose su console.
- Ambito:
  - Comportamento end-to-end del gateway multiistanza
  - Superfici WebSocket/HTTP, pairing dei Node e networking più pesante
- Aspettative:
  - Viene eseguita in CI (quando abilitata nella pipeline)
  - Non richiede chiavi reali
  - Ha più parti in movimento rispetto ai test unitari (può essere più lenta)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Ambito:
  - Avvia un gateway OpenShell isolato sull’host tramite Docker
  - Crea una sandbox a partire da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw tramite `sandbox ssh-config` + esecuzione SSH reali
  - Verifica il comportamento canonico del filesystem remoto tramite il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell’esecuzione predefinita `pnpm test:e2e`
  - Richiede una CLI `openshell` locale più un demone Docker funzionante
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, poi distrugge il gateway di test e la sandbox
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando si esegue manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a un binario CLI non predefinito o a uno script wrapper

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Config: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e test live dei plugin bundled sotto `extensions/`
- Predefinito: **abilitata** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - “Questo provider/modello funziona davvero _oggi_ con credenziali reali?”
  - Intercetta cambi di formato del provider, particolarità del tool-calling, problemi di auth e comportamento dei rate limit
- Aspettative:
  - Per progettazione non è stabile in CI (reti reali, policy reali dei provider, quote, outage)
  - Costa denaro / usa i rate limit
  - È preferibile eseguire sottoinsiemi ristretti invece di “tutto”
- Le esecuzioni live leggono `~/.profile` per recuperare eventuali chiavi API mancanti.
- Per impostazione predefinita, le esecuzioni live isolano ancora `HOME` e copiano materiale di config/auth in una home di test temporanea così le fixture unit non possono modificare il tuo `~/.openclaw` reale.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando hai intenzionalmente bisogno che i test live usino la tua home directory reale.
- `pnpm test:live` ora usa per impostazione predefinita una modalità più silenziosa: mantiene l’output di avanzamento `[live] ...`, ma sopprime l’avviso extra su `~/.profile` e silenzia i log di bootstrap del gateway e il chatter Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi riavere i log completi di avvio.
- Rotazione delle chiavi API (specifica per provider): imposta `*_API_KEYS` in formato con virgole/punto e virgola oppure `*_API_KEY_1`, `*_API_KEY_2` (per esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oppure l’override per-live `OPENCLAW_LIVE_*_KEY`; i test ritentano in risposta a rate limit.
- Output di avanzamento/heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr così le chiamate provider lunghe risultano visibilmente attive anche quando la cattura console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l’intercettazione della console di Vitest così le righe di avanzamento provider/gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli heartbeat direct-model con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli heartbeat gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite dovrei eseguire?

Usa questa tabella decisionale:

- Modifica di logica/test: esegui `pnpm test` (e `pnpm test:coverage` se hai cambiato molto)
- Interventi su networking del gateway / protocollo WS / pairing: aggiungi `pnpm test:e2e`
- Debug di “il mio bot è giù” / errori specifici del provider / tool calling: esegui un `pnpm test:live` ristretto

## Live: sweep delle capability del Node Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Obiettivo: invocare **ogni comando attualmente pubblicizzato** da un Node Android connesso e verificare il comportamento del contratto del comando.
- Ambito:
  - Setup precondizionato/manuale (la suite non installa/esegue/abbina l’app).
  - Validazione `node.invoke` del gateway comando per comando per il Node Android selezionato.
- Pre-setup richiesto:
  - App Android già connessa + abbinata al gateway.
  - App mantenuta in foreground.
  - Permessi/consenso alla cattura concessi per le capability che ti aspetti passino.
- Override facoltativi del target:
  - `OPENCLAW_ANDROID_NODE_ID` o `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Dettagli completi del setup Android: [App Android](/it/platforms/android)

## Live: smoke dei modelli (chiavi profilo)

I test live sono divisi in due livelli così possiamo isolare gli errori:

- “Direct model” ci dice se il provider/modello può rispondere in assoluto con la chiave data.
- “Gateway smoke” ci dice se l’intera pipeline gateway+agente funziona per quel modello (sessioni, history, tool, policy sandbox, ecc.).

### Livello 1: completamento direct model (senza gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Obiettivo:
  - Enumerare i modelli rilevati
  - Usare `getApiKeyForModel` per selezionare i modelli per cui hai credenziali
  - Eseguire un piccolo completamento per modello (e regressioni mirate dove necessario)
- Come abilitare:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Imposta `OPENCLAW_LIVE_MODELS=modern` (oppure `all`, alias di modern) per eseguire davvero questa suite; altrimenti viene saltata per mantenere `pnpm test:live` focalizzato sul gateway smoke
- Come selezionare i modelli:
  - `OPENCLAW_LIVE_MODELS=modern` per eseguire l’allowlist modern (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` è un alias per l’allowlist modern
  - oppure `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separata da virgole)
  - Gli sweep modern/all usano per impostazione predefinita un limite curato ad alto segnale; imposta `OPENCLAW_LIVE_MAX_MODELS=0` per uno sweep modern esaustivo o un numero positivo per un limite più piccolo.
- Come selezionare i provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separata da virgole)
- Da dove arrivano le chiavi:
  - Per impostazione predefinita: store dei profili e fallback env
  - Imposta `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre **solo** lo store dei profili
- Perché esiste:
  - Separa “l’API del provider è rotta / la chiave non è valida” da “la pipeline agente del gateway è rotta”
  - Contiene piccole regressioni isolate (esempio: replay reasoning OpenAI Responses/Codex Responses + flussi tool-call)

### Livello 2: Gateway + smoke dell’agente dev (quello che fa davvero "@openclaw")

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Obiettivo:
  - Avviare un gateway in-process
  - Creare/modificare una sessione `agent:dev:*` (override del modello per esecuzione)
  - Iterare sui modelli-con-chiavi e verificare:
    - risposta “significativa” (senza tool)
    - una vera invocazione di tool funziona (probe di lettura)
    - probe di tool extra facoltative (probe exec+read)
    - i percorsi di regressione OpenAI (solo tool-call → follow-up) continuano a funzionare
- Dettagli delle probe (così puoi spiegare rapidamente gli errori):
  - probe `read`: il test scrive un file nonce nel workspace e chiede all’agente di `read`arlo e riecheggiare il nonce.
  - probe `exec+read`: il test chiede all’agente di scrivere via `exec` un nonce in un file temporaneo, poi di `read`arlo.
  - probe immagine: il test allega un PNG generato (gatto + codice randomizzato) e si aspetta che il modello restituisca `cat <CODE>`.
  - Riferimento di implementazione: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Come abilitare:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Come selezionare i modelli:
  - Predefinito: allowlist modern (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` è un alias per l’allowlist modern
  - Oppure imposta `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o elenco separato da virgole) per restringere
  - Gli sweep gateway modern/all usano per impostazione predefinita un limite curato ad alto segnale; imposta `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` per uno sweep modern esaustivo o un numero positivo per un limite più piccolo.
- Come selezionare i provider (evita “tutto OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separata da virgole)
- Le probe tool + immagine sono sempre attive in questo test live:
  - probe `read` + probe `exec+read` (stress dei tool)
  - la probe immagine gira quando il modello dichiara supporto all’input immagine
  - Flusso (alto livello):
    - Il test genera un piccolo PNG con “CAT” + codice casuale (`src/gateway/live-image-probe.ts`)
    - Lo invia tramite `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Il Gateway analizza gli allegati in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L’agente embedded inoltra al modello un messaggio utente multimodale
    - Verifica: la risposta contiene `cat` + il codice (tolleranza OCR: sono ammessi piccoli errori)

Suggerimento: per vedere cosa puoi testare sulla tua macchina (e gli id esatti `provider/model`), esegui:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke del backend CLI (Claude, Codex, Gemini o altre CLI locali)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Obiettivo: validare la pipeline Gateway + agente usando un backend CLI locale, senza toccare la tua config predefinita.
- Gli smoke predefiniti specifici del backend si trovano nella definizione `cli-backend.ts` dell’extension proprietaria.
- Abilitazione:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valori predefiniti:
  - Provider/modello predefinito: `claude-cli/claude-sonnet-4-6`
  - Il comportamento di comando/argomenti/immagine proviene dai metadati del plugin backend CLI proprietario.
- Override (facoltativi):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` per inviare un vero allegato immagine (i percorsi vengono iniettati nel prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` per passare i percorsi dei file immagine come argomenti CLI invece che tramite iniezione nel prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oppure `"list"`) per controllare come vengono passati gli argomenti immagine quando `IMAGE_ARG` è impostato.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` per inviare un secondo turno e validare il flusso di resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` per disabilitare la probe predefinita di continuità stessa-sessione Claude Sonnet -> Opus (impostalo a `1` per forzarla quando il modello selezionato supporta un target di switch).

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
- Esegue lo smoke live del backend CLI dentro l’immagine Docker del repo come utente `node` non root.
- Risolve i metadati smoke della CLI dall’extension proprietaria, poi installa il pacchetto CLI Linux corrispondente (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) in un prefisso scrivibile in cache in `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predefinito: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` richiede OAuth portabile di abbonamento Claude Code tramite `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` oppure `CLAUDE_CODE_OAUTH_TOKEN` da `claude setup-token`. Prima dimostra `claude -p` diretto in Docker, poi esegue due turni Gateway CLI-backend senza preservare le variabili env della chiave API Anthropic. Questa lane subscription disabilita per impostazione predefinita le probe Claude MCP/tool e immagine perché Claude al momento instrada l’uso di app di terze parti tramite fatturazione di uso extra invece che tramite i normali limiti del piano di abbonamento.
- Lo smoke live del backend CLI ora esercita lo stesso flusso end-to-end per Claude, Codex e Gemini: turno di testo, turno di classificazione immagine, poi chiamata tool MCP `cron` verificata tramite la CLI del gateway.
- Lo smoke predefinito di Claude inoltre modifica la sessione da Sonnet a Opus e verifica che la sessione ripresa ricordi ancora una nota precedente.

## Live: smoke del bind ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Obiettivo: validare il flusso reale di conversation-bind ACP con un agente ACP live:
  - inviare `/acp spawn <agent> --bind here`
  - collegare in-place una conversazione sintetica di message-channel
  - inviare un normale follow-up sulla stessa conversazione
  - verificare che il follow-up arrivi nel transcript della sessione ACP collegata
- Abilitazione:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valori predefiniti:
  - Agenti ACP in Docker: `claude,codex,gemini`
  - Agente ACP per `pnpm test:live ...` diretto: `claude`
  - Canale sintetico: contesto conversazione in stile DM Slack
  - Backend ACP: `acpx`
- Override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- Note:
  - Questa lane usa la superficie gateway `chat.send` con campi sintetici di originating-route riservati agli admin così i test possono allegare contesto di message-channel senza fingere una consegna esterna.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` non è impostato, il test usa il registro agenti integrato del plugin `acpx` embedded per l’agente harness ACP selezionato.

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
- Per impostazione predefinita, esegue in sequenza lo smoke ACP bind contro tutti gli agenti CLI live supportati: `claude`, `codex`, poi `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` oppure `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` per restringere la matrice.
- Legge `~/.profile`, prepara nel container il materiale di auth CLI corrispondente, installa `acpx` in un prefisso npm scrivibile, quindi installa la CLI live richiesta (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) se manca.
- Dentro Docker, il runner imposta `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` così acpx mantiene disponibili alla CLI harness figlia le variabili env del provider provenienti dal profilo letto.

## Live: smoke dell’harness app-server Codex

- Obiettivo: validare l’harness Codex posseduto dal plugin tramite il normale
  metodo `agent` del gateway:
  - caricare il plugin bundled `codex`
  - selezionare `OPENCLAW_AGENT_RUNTIME=codex`
  - inviare un primo turno agente del gateway a `codex/gpt-5.4`
  - inviare un secondo turno alla stessa sessione OpenClaw e verificare che il thread
    app-server possa riprendere
  - eseguire `/codex status` e `/codex models` tramite lo stesso percorso di comando
    del gateway
  - facoltativamente eseguire due probe shell escalate revisionate da Guardian: un
    comando benigno che dovrebbe essere approvato e un finto upload di secret che dovrebbe essere
    negato così l’agente chiede conferma
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modello predefinito: `codex/gpt-5.4`
- Probe immagine facoltativa: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Probe MCP/tool facoltativa: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Probe Guardian facoltativa: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Lo smoke imposta `OPENCLAW_AGENT_HARNESS_FALLBACK=none` così un harness Codex
  rotto non può passare tornando silenziosamente a Pi.
- Auth: `OPENAI_API_KEY` dalla shell/profilo, più facoltativi
  `~/.codex/auth.json` e `~/.codex/config.toml` copiati

Ricetta locale:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
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
- Legge il `~/.profile` montato, passa `OPENAI_API_KEY`, copia i file auth della CLI Codex
  quando presenti, installa `@openai/codex` in un prefisso npm montato e scrivibile,
  prepara il source tree, quindi esegue solo il test live dell’harness Codex.
- Docker abilita per impostazione predefinita le probe immagine, MCP/tool e Guardian. Imposta
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oppure
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` oppure
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` quando ti serve un’esecuzione di debug
  più ristretta.
- Docker esporta anche `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, in linea con la config del
  test live così il fallback `openai-codex/*` o Pi non può nascondere una regressione
  dell’harness Codex.

### Ricette live consigliate

Le allowlist ristrette ed esplicite sono le più veloci e le meno flaky:

- Singolo modello, direct (senza gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Singolo modello, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling su più provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Focus Google (chiave API Gemini + Antigravity):
  - Gemini (chiave API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Note:

- `google/...` usa l’API Gemini (chiave API).
- `google-antigravity/...` usa il bridge OAuth Antigravity (endpoint agente in stile Cloud Code Assist).
- `google-gemini-cli/...` usa la CLI Gemini locale sulla tua macchina (auth separata + particolarità degli strumenti).
- API Gemini vs CLI Gemini:
  - API: OpenClaw chiama l’API Gemini ospitata da Google via HTTP (auth con chiave API / profilo); questo è ciò che la maggior parte degli utenti intende con “Gemini”.
  - CLI: OpenClaw esegue una shell verso un binario `gemini` locale; ha una propria auth e può comportarsi in modo diverso (streaming/supporto tool/version skew).

## Live: matrice modelli (cosa copriamo)

Non esiste un “elenco modelli CI” fisso (live è opt-in), ma questi sono i modelli **consigliati** da coprire regolarmente su una macchina di sviluppo con chiavi.

### Set smoke modern (tool calling + immagine)

Questa è l’esecuzione dei “modelli comuni” che ci aspettiamo di mantenere funzionante:

- OpenAI (non-Codex): `openai/gpt-5.4` (facoltativo: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (oppure `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evita i vecchi modelli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Esegui gateway smoke con tool + immagine:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling (Read + Exec facoltativo)

Scegline almeno uno per famiglia di provider:

- OpenAI: `openai/gpt-5.4` (oppure `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (oppure `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oppure `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Coverage aggiuntiva facoltativa (utile averla):

- xAI: `xai/grok-4` (oppure l’ultima disponibile)
- Mistral: `mistral/`… (scegli un modello con supporto `tools` che hai abilitato)
- Cerebras: `cerebras/`… (se hai accesso)
- LM Studio: `lmstudio/`… (locale; il tool calling dipende dalla modalità API)

### Vision: invio immagini (allegato → messaggio multimodale)

Includi almeno un modello capace di gestire immagini in `OPENCLAW_LIVE_GATEWAY_MODELS` (varianti Claude/Gemini/OpenAI con supporto vision, ecc.) per esercitare la probe immagine.

### Aggregatori / gateway alternativi

Se hai chiavi abilitate, supportiamo anche i test tramite:

- OpenRouter: `openrouter/...` (centinaia di modelli; usa `openclaw models scan` per trovare candidati con supporto tool+immagine)
- OpenCode: `opencode/...` per Zen e `opencode-go/...` per Go (auth tramite `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Altri provider che puoi includere nella matrice live (se hai credenziali/config):

- Integrati: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Tramite `models.providers` (endpoint personalizzati): `minimax` (cloud/API), più qualunque proxy compatibile OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, ecc.)

Suggerimento: non provare a codificare rigidamente “tutti i modelli” nella doc. L’elenco autorevole è qualunque cosa restituisca `discoverModels(...)` sulla tua macchina + qualunque chiave sia disponibile.

## Credenziali (non fare mai commit)

I test live scoprono le credenziali nello stesso modo in cui lo fa la CLI. Implicazioni pratiche:

- Se la CLI funziona, i test live dovrebbero trovare le stesse chiavi.
- Se un test live dice “nessuna credenziale”, fai debug nello stesso modo in cui faresti debug di `openclaw models list` / selezione del modello.

- Profili auth per agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (questo è il significato di “profile keys” nei test live)
- Config: `~/.openclaw/openclaw.json` (oppure `OPENCLAW_CONFIG_PATH`)
- Directory di stato legacy: `~/.openclaw/credentials/` (copiata nella home live preparata quando presente, ma non è lo store principale delle chiavi profilo)
- Le esecuzioni live locali copiano per impostazione predefinita la config attiva, i file `auth-profiles.json` per agente, la directory legacy `credentials/` e le directory auth supportate delle CLI esterne in una home di test temporanea; le home live preparate saltano `workspace/` e `sandboxes/`, e gli override di percorso `agents.*.workspace` / `agentDir` vengono rimossi così le probe restano fuori dal tuo workspace host reale.

Se vuoi fare affidamento sulle chiavi env (ad es. esportate nel tuo `~/.profile`), esegui i test locali dopo `source ~/.profile`, oppure usa i runner Docker qui sotto (possono montare `~/.profile` nel container).

## Live Deepgram (trascrizione audio)

- Test: `extensions/deepgram/audio.live.test.ts`
- Abilitazione: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live piano di coding BytePlus

- Test: `extensions/byteplus/live.test.ts`
- Abilitazione: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Override facoltativo del modello: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live media workflow ComfyUI

- Test: `extensions/comfy/comfy.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Ambito:
  - Esercita i percorsi bundled comfy per immagini, video e `music_generate`
  - Salta ogni capability a meno che `models.providers.comfy.<capability>` non sia configurato
  - Utile dopo modifiche a invio workflow comfy, polling, download o registrazione del plugin

## Live generazione immagini

- Test: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Ambito:
  - Enumera ogni plugin provider di generazione immagini registrato
  - Carica le variabili env del provider mancanti dalla tua shell di login (`~/.profile`) prima delle probe
  - Usa per impostazione predefinita le chiavi API live/env prima dei profili auth memorizzati, così chiavi di test obsolete in `auth-profiles.json` non mascherano le credenziali reali della shell
  - Salta i provider senza auth/profilo/modello utilizzabile
  - Esegue le varianti stock di generazione immagini tramite la capability runtime condivisa:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provider bundled attualmente coperti:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- Comportamento auth facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l’auth dallo store dei profili e ignorare gli override solo-env

## Live generazione musica

- Test: `extensions/music-generation-providers.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Ambito:
  - Esercita il percorso condiviso bundled dei provider di generazione musica
  - Attualmente copre Google e MiniMax
  - Carica le variabili env del provider dalla tua shell di login (`~/.profile`) prima delle probe
  - Usa per impostazione predefinita le chiavi API live/env prima dei profili auth memorizzati, così chiavi di test obsolete in `auth-profiles.json` non mascherano le credenziali reali della shell
  - Salta i provider senza auth/profilo/modello utilizzabile
  - Esegue entrambe le modalità runtime dichiarate quando disponibili:
    - `generate` con input solo prompt
    - `edit` quando il provider dichiara `capabilities.edit.enabled`
  - Coverage attuale della lane condivisa:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy separato, non questo sweep condiviso
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamento auth facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l’auth dallo store dei profili e ignorare gli override solo-env

## Live generazione video

- Test: `extensions/video-generation-providers.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Ambito:
  - Esercita il percorso condiviso bundled dei provider di generazione video
  - Usa per impostazione predefinita il percorso smoke sicuro per il rilascio: provider non-FAL, una richiesta text-to-video per provider, prompt lobster di un secondo e un limite di operazione per provider da `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` per impostazione predefinita)
  - Salta FAL per impostazione predefinita perché la latenza della coda lato provider può dominare il tempo di rilascio; passa `--video-providers fal` oppure `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` per eseguirlo esplicitamente
  - Carica le variabili env del provider dalla tua shell di login (`~/.profile`) prima delle probe
  - Usa per impostazione predefinita le chiavi API live/env prima dei profili auth memorizzati, così chiavi di test obsolete in `auth-profiles.json` non mascherano le credenziali reali della shell
  - Salta i provider senza auth/profilo/modello utilizzabile
  - Esegue solo `generate` per impostazione predefinita
  - Imposta `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` per eseguire anche le modalità transform dichiarate quando disponibili:
    - `imageToVideo` quando il provider dichiara `capabilities.imageToVideo.enabled` e il provider/modello selezionato accetta input immagine locale basato su buffer nello sweep condiviso
    - `videoToVideo` quando il provider dichiara `capabilities.videoToVideo.enabled` e il provider/modello selezionato accetta input video locale basato su buffer nello sweep condiviso
  - Provider `imageToVideo` attualmente dichiarati ma saltati nello sweep condiviso:
    - `vydra` perché `veo3` bundled è solo testo e `kling` bundled richiede un URL immagine remoto
  - Coverage Vydra specifica del provider:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - quel file esegue `veo3` text-to-video più una lane `kling` che usa per impostazione predefinita una fixture con URL immagine remoto
  - Coverage live `videoToVideo` attuale:
    - solo `runway` quando il modello selezionato è `runway/gen4_aleph`
  - Provider `videoToVideo` attualmente dichiarati ma saltati nello sweep condiviso:
    - `alibaba`, `qwen`, `xai` perché quei percorsi attualmente richiedono URL di riferimento remoti `http(s)` / MP4
    - `google` perché l’attuale lane condivisa Gemini/Veo usa input locali basati su buffer e quel percorso non è accettato nello sweep condiviso
    - `openai` perché l’attuale lane condivisa non garantisce l’accesso specifico per organizzazione a video inpaint/remix
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` per includere ogni provider nello sweep predefinito, incluso FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` per ridurre il limite di operazione di ogni provider in un’esecuzione smoke aggressiva
- Comportamento auth facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l’auth dallo store dei profili e ignorare gli override solo-env

## Harness live media

- Comando: `pnpm test:live:media`
- Scopo:
  - Esegue le suite live condivise di immagini, musica e video tramite un unico entrypoint nativo del repo
  - Carica automaticamente le variabili env del provider mancanti da `~/.profile`
  - Restringe automaticamente ogni suite ai provider che al momento hanno auth utilizzabile per impostazione predefinita
  - Riutilizza `scripts/test-live.mjs`, così il comportamento di heartbeat e modalità silenziosa resta coerente
- Esempi:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runner Docker (controlli facoltativi “funziona su Linux”)

Questi runner Docker sono divisi in due gruppi:

- Runner live-model: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il file live con chiavi profilo corrispondente dentro l’immagine Docker del repo (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la tua directory config locale e workspace (e leggendo `~/.profile` se montato). Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner live Docker usano per impostazione predefinita un limite smoke più piccolo così uno sweep Docker completo resta praticabile:
  `test:docker:live-models` usa per impostazione predefinita `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa per impostazione predefinita `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sovrascrivi quelle variabili env quando
  vuoi esplicitamente la scansione esaustiva più ampia.
- `test:docker:all` costruisce una volta l’immagine Docker live tramite `test:docker:live-build`, poi la riusa per le due lane Docker live. Costruisce anche un’unica immagine condivisa `scripts/e2e/Dockerfile` tramite `test:docker:e2e-build` e la riusa per i runner smoke E2E in container che esercitano l’app buildata.
- I runner smoke in container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` e `test:docker:config-reload` avviano uno o più container reali e verificano percorsi di integrazione di livello superiore.

I runner Docker live-model montano inoltre solo le home auth CLI necessarie (o tutte quelle supportate quando l’esecuzione non è ristretta), poi le copiano nella home del container prima dell’esecuzione così l’OAuth della CLI esterna può aggiornare i token senza modificare lo store auth dell’host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Wizard di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/canale/agente da tarball npm: `pnpm test:docker:npm-onboard-channel-agent` installa globalmente in Docker il tarball OpenClaw pacchettizzato, configura OpenAI tramite onboarding env-ref più Telegram per impostazione predefinita, verifica che l’abilitazione del plugin installi on demand le sue dipendenze runtime, esegue doctor e lancia un turno agente OpenAI mockato. Riusa un tarball prebuildato con `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la rebuild host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, oppure cambia canale con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Networking Gateway (due container, auth WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Regressione minimale reasoning OpenAI Responses `web_search`: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) esegue un server OpenAI mockato tramite Gateway, verifica che `web_search` alzi `reasoning.effort` da `minimal` a `low`, poi forza il rifiuto dello schema provider e controlla che il dettaglio raw compaia nei log di Gateway.
- Bridge canale MCP (Gateway seedato + bridge stdio + smoke raw del frame di notifica Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Tool MCP del bundle Pi (server MCP stdio reale + smoke allow/deny del profilo Pi embedded): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cleanup MCP Cron/subagent (Gateway reale + teardown del processo figlio MCP stdio dopo esecuzioni isolate di Cron e subagent one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke di installazione + alias `/plugin` + semantica di riavvio del bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
- Smoke invariato di aggiornamento plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke dei metadata di reload config: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dipendenze runtime dei plugin bundled: `pnpm test:docker:bundled-channel-deps` costruisce per impostazione predefinita una piccola immagine runner Docker, builda e pacchettizza OpenClaw una volta sull’host, poi monta quel tarball in ogni scenario di installazione Linux. Riusa l’immagine con `OPENCLAW_SKIP_DOCKER_BUILD=1`, salta la rebuild host dopo una build locale fresca con `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, oppure punta a un tarball esistente con `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Restringi le dipendenze runtime dei plugin bundled durante l’iterazione disabilitando gli scenari non correlati, per esempio:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Per prebuildare e riusare manualmente l’immagine condivisa built-app:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Gli override di immagine specifici della suite, come `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, hanno comunque la precedenza quando sono impostati. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` punta a un’immagine condivisa remota, gli script la scaricano se non è già presente in locale. I test Docker di QR e installer mantengono i propri Dockerfile perché validano il comportamento di package/installazione piuttosto che il runtime condiviso built-app.

I runner Docker live-model montano anche il checkout corrente in sola lettura e
lo preparano in una workdir temporanea dentro il container. Questo mantiene snella l’immagine
runtime pur eseguendo Vitest sul tuo esatto source/config locale.
Il passaggio di staging salta grandi cache solo-locali e output di build delle app come
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e directory di output `.build` o
Gradle locali all’app, così le esecuzioni live Docker non passano minuti a copiare
artifact specifici della macchina.
Impostano anche `OPENCLAW_SKIP_CHANNELS=1` così le probe gateway live non avviano
worker di canale reali Telegram/Discord/ecc. dentro il container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi inoltra anche
`OPENCLAW_LIVE_GATEWAY_*` quando hai bisogno di restringere o escludere la coverage live
gateway da quella lane Docker.
`test:docker:openwebui` è uno smoke di compatibilità di livello superiore: avvia un
container gateway OpenClaw con endpoint HTTP compatibili con OpenAI abilitati,
avvia un container Open WebUI fissato contro quel gateway, effettua il sign-in tramite
Open WebUI, verifica che `/api/models` esponga `openclaw/default`, quindi invia una
vera richiesta chat tramite il proxy `/api/chat/completions` di Open WebUI.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe dover scaricare l’immagine
Open WebUI e Open WebUI potrebbe dover completare il proprio setup a freddo.
Questa lane si aspetta una chiave di modello live utilizzabile, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` per impostazione predefinita) è il modo principale per fornirla nelle esecuzioni Docker.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministica e non richiede un
account reale Telegram, Discord o iMessage. Avvia un container Gateway
seedato, avvia un secondo container che lancia `openclaw mcp serve`, poi
verifica discovery di conversazioni instradate, letture del transcript, metadati degli allegati,
comportamento della coda di eventi live, instradamento dell’invio in uscita e notifiche di canale +
permessi in stile Claude sul vero bridge stdio MCP. Il controllo delle notifiche
ispeziona direttamente i frame raw stdio MCP così lo smoke valida ciò che il
bridge emette realmente, non solo ciò che una specifica SDK client decide di esporre.
`test:docker:pi-bundle-mcp-tools` è deterministico e non richiede una chiave di modello live.
Costruisce l’immagine Docker del repo, avvia un vero server probe stdio MCP
dentro il container, materializza quel server tramite il runtime MCP del bundle Pi embedded,
esegue il tool, poi verifica che `coding` e `messaging` mantengano
i tool `bundle-mcp` mentre `minimal` e `tools.deny: ["bundle-mcp"]` li filtrano.
`test:docker:cron-mcp-cleanup` è deterministico e non richiede una chiave di modello live.
Avvia un Gateway seedato con un vero server probe stdio MCP, esegue un
turno Cron isolato e un turno figlio one-shot `/subagents spawn`, poi verifica
che il processo figlio MCP termini dopo ogni esecuzione.

Smoke manuale ACP thread in linguaggio naturale (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conserva questo script per i flussi di lavoro di regressione/debug. Potrebbe servire di nuovo per la validazione dell’instradamento dei thread ACP, quindi non eliminarlo.

Variabili env utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinita: `~/.openclaw`) montata in `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinita: `~/.openclaw/workspace`) montata in `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinita: `~/.profile`) montata in `/home/node/.profile` e letta prima di eseguire i test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` per verificare solo le variabili env lette da `OPENCLAW_PROFILE_FILE`, usando directory config/workspace temporanee e senza mount auth di CLI esterne
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinita: `~/.cache/openclaw/docker-cli-tools`) montata in `/home/node/.npm-global` per installazioni CLI in cache dentro Docker
- Le directory/file auth di CLI esterne sotto `$HOME` vengono montati in sola lettura sotto `/host-auth...`, poi copiati in `/home/node/...` prima che i test inizino
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni con provider ristretto montano solo le directory/file necessari dedotti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manuale con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o un elenco separato da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l’esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riusare un’immagine `openclaw:local-live` esistente per riesecuzioni che non richiedono una rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per assicurarsi che le credenziali provengano dallo store dei profili (non da env)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal gateway per lo smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sovrascrivere il prompt di controllo nonce usato dallo smoke Open WebUI
- `OPENWEBUI_IMAGE=...` per sovrascrivere il tag immagine Open WebUI fissato

## Controllo della documentazione

Esegui i controlli doc dopo modifiche alla documentazione: `pnpm check:docs`.
Esegui la validazione completa degli anchor Mintlify quando ti servono anche i controlli degli heading nella pagina: `pnpm docs:check-links:anchors`.

## Regressione offline (sicura per CI)

Queste sono regressioni di “pipeline reale” senza provider reali:

- Tool calling del Gateway (OpenAI mockato, gateway reale + loop dell’agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard del Gateway (WS `wizard.start`/`wizard.next`, scrive config + auth enforced): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Valutazioni di affidabilità degli agenti (Skills)

Abbiamo già alcuni test sicuri per CI che si comportano come “valutazioni di affidabilità degli agenti”:

- Tool-calling mockato tramite il gateway reale + loop dell’agente (`src/gateway/gateway.test.ts`).
- Flussi wizard end-to-end che validano wiring della sessione ed effetti della config (`src/gateway/gateway.test.ts`).

Cosa manca ancora per le Skills (vedi [Skills](/it/tools/skills)):

- **Decisioning:** quando le Skills sono elencate nel prompt, l’agente sceglie la skill giusta (o evita quelle irrilevanti)?
- **Compliance:** l’agente legge `SKILL.md` prima dell’uso e segue i passaggi/argomenti richiesti?
- **Workflow contracts:** scenari multi-turn che verificano ordine dei tool, mantenimento della cronologia di sessione e confini della sandbox.

Le future valutazioni dovrebbero restare prima di tutto deterministiche:

- Un runner di scenari che usa provider mock per verificare chiamate ai tool + ordine, letture dei file skill e wiring della sessione.
- Una piccola suite di scenari focalizzati sulle skill (usa vs evita, gating, prompt injection).
- Valutazioni live facoltative (opt-in, protette da env) solo dopo che la suite sicura per CI è disponibile.

## Test di contratto (forma di plugin e canali)

I test di contratto verificano che ogni plugin e canale registrato sia conforme al
proprio contratto di interfaccia. Iterano su tutti i plugin rilevati ed eseguono una suite di
verifiche di forma e comportamento. La lane unit predefinita `pnpm test`
salta intenzionalmente questi file condivisi di seam e smoke; esegui esplicitamente
i comandi dei contratti quando tocchi superfici condivise di canali o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti dei canali: `pnpm test:contracts:channels`
- Solo contratti dei provider: `pnpm test:contracts:plugins`

### Contratti dei canali

Si trovano in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma base del plugin (id, nome, capability)
- **setup** - Contratto del wizard di setup
- **session-binding** - Comportamento del binding di sessione
- **outbound-payload** - Struttura del payload del messaggio
- **inbound** - Gestione dei messaggi in ingresso
- **actions** - Handler delle azioni del canale
- **threading** - Gestione degli id thread
- **directory** - API directory/roster
- **group-policy** - Applicazione della group policy

### Contratti di stato dei provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe di stato del canale
- **registry** - Forma del registro dei plugin

### Contratti dei provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contratto del flusso auth
- **auth-choice** - Scelta/selezione auth
- **catalog** - API del catalogo modelli
- **discovery** - Discovery del plugin
- **loader** - Caricamento del plugin
- **runtime** - Runtime del provider
- **shape** - Forma/interfaccia del plugin
- **wizard** - Wizard di setup

### Quando eseguirli

- Dopo aver modificato export o subpath di plugin-sdk
- Dopo aver aggiunto o modificato un plugin di canale o provider
- Dopo il refactor della registrazione o discovery dei plugin

I test di contratto vengono eseguiti in CI e non richiedono chiavi API reali.

## Aggiunta di regressioni (linee guida)

Quando correggi un problema di provider/modello scoperto in live:

- Aggiungi una regressione sicura per CI se possibile (provider mock/stub, oppure cattura dell’esatta trasformazione della forma della richiesta)
- Se è intrinsecamente solo live (rate limit, policy auth), mantieni il test live ristretto e opt-in tramite variabili env
- Preferisci puntare al layer più piccolo che intercetta il bug:
  - bug di conversione/replay della richiesta provider → test dei modelli diretti
  - bug nella pipeline session/history/tool del gateway → gateway live smoke o test mock del gateway sicuro per CI
- Guardrail di attraversamento SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target campionato per ogni classe SecretRef dai metadati del registro (`listSecretTargetRegistryEntries()`), poi verifica che gli id exec dei segmenti di attraversamento vengano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente sugli id target non classificati così le nuove classi non possono essere saltate silenziosamente.
