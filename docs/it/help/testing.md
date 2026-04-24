---
read_when:
    - Eseguire i test in locale o in CI
    - Aggiungere regressioni per bug di modello/provider
    - Debug del comportamento di gateway + agente
summary: 'Kit di test: suite unit/e2e/live, runner Docker e cosa copre ogni test'
title: Testing
x-i18n:
    generated_at: "2026-04-24T08:44:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c88325e0edb49437e7faa2eaf730eb3be59054d8c4bb86e56a42bc39a29a2b1
    source_path: help/testing.md
    workflow: 15
---

OpenClaw ha tre suite Vitest (unit/integration, e2e, live) e un piccolo insieme
di runner Docker. Questa doc è una guida su "come testiamo":

- Cosa copre ogni suite (e cosa deliberatamente _non_ copre).
- Quali comandi eseguire per i flussi di lavoro comuni (locale, pre-push, debugging).
- Come i test live individuano le credenziali e selezionano modelli/provider.
- Come aggiungere regressioni per problemi reali di modelli/provider.

## Avvio rapido

Nella maggior parte dei giorni:

- Gate completo (atteso prima del push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Esecuzione locale più veloce della suite completa su una macchina capiente: `pnpm test:max`
- Ciclo watch Vitest diretto: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Preferisci prima le esecuzioni mirate quando stai iterando su un singolo errore.
- Sito QA supportato da Docker: `pnpm qa:lab:up`
- Lane QA supportata da VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando tocchi i test o vuoi maggiore sicurezza:

- Gate di copertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando esegui il debug di provider/modelli reali (richiede credenziali reali):

- Suite live (probe di modelli + gateway tool/image): `pnpm test:live`
- Punta a un solo file live in silenzio: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Sweep Docker dei modelli live: `pnpm test:docker:live-models`
  - Ogni modello selezionato ora esegue un turno di testo più un piccolo probe in stile lettura-file.
    I modelli i cui metadati dichiarano input `image` eseguono anche un piccolo turno immagine.
    Disabilita i probe extra con `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` o
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` quando isoli i guasti del provider.
  - Copertura CI: i job giornalieri `OpenClaw Scheduled Live And E2E Checks` e quelli manuali
    `OpenClaw Release Checks` chiamano entrambi il workflow riutilizzabile live/E2E con
    `include_live_suites: true`, che include job matrix Docker live separati
    shardati per provider.
  - Per riesecuzioni CI mirate, avvia `OpenClaw Live And E2E Checks (Reusable)`
    con `include_live_suites: true` e `live_models_only: true`.
  - Aggiungi nuovi segreti provider ad alto segnale a `scripts/ci-hydrate-live-auth.sh`
    più `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e i suoi
    chiamanti scheduled/release.
- Smoke nativo Codex bound-chat: `pnpm test:docker:live-codex-bind`
  - Esegue una lane live Docker contro il percorso app-server Codex, associa un DM
    Slack sintetico con `/codex bind`, esercita `/codex fast` e
    `/codex permissions`, poi verifica che una risposta semplice e un allegato immagine
    passino attraverso il binding nativo del Plugin invece di ACP.
- Smoke dei costi Moonshot/Kimi: con `MOONSHOT_API_KEY` impostata, esegui
  `openclaw models list --provider moonshot --json`, poi esegui un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolato contro `moonshot/kimi-k2.6`. Verifica che il JSON riporti Moonshot/K2.6 e che la
  trascrizione dell'assistente memorizzi `usage.cost` normalizzato.

Suggerimento: quando ti serve solo un caso in errore, preferisci restringere i test live tramite le variabili env di allowlist descritte sotto.

## Runner specifici per QA

Questi comandi si affiancano alle suite di test principali quando ti serve il realismo di QA-lab:

CI esegue QA Lab in workflow dedicati. `Parity gate` gira su PR corrispondenti e
da dispatch manuale con provider mock. `QA-Lab - All Lanes` gira ogni notte su
`main` e da dispatch manuale con il parity gate mock, la lane live Matrix e la
lane live Telegram gestita da Convex come job paralleli. `OpenClaw Release Checks`
esegue le stesse lane prima dell'approvazione della release.

- `pnpm openclaw qa suite`
  - Esegue scenari QA supportati dal repo direttamente sull'host.
  - Esegue più scenari selezionati in parallelo per impostazione predefinita con worker
    gateway isolati. `qa-channel` usa di default concorrenza 4 (limitata dal
    numero di scenari selezionati). Usa `--concurrency <count>` per regolare il numero
    di worker, oppure `--concurrency 1` per la vecchia lane seriale.
  - Esce con codice diverso da zero se uno scenario fallisce. Usa `--allow-failures` quando
    vuoi gli artefatti senza un codice di uscita di errore.
  - Supporta le modalità provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` avvia un server provider locale supportato da AIMock per copertura sperimentale di fixture e mock del protocollo senza sostituire la lane `mock-openai` consapevole degli scenari.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA dentro una VM Linux Multipass usa-e-getta.
  - Mantiene lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
  - Riutilizza gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input auth QA supportati pratici per il guest:
    chiavi provider basate su env, il percorso di configurazione provider live QA e `CODEX_HOME`
    quando presente.
  - Le directory di output devono restare sotto la root del repo così il guest può scrivere indietro tramite
    il workspace montato.
  - Scrive il normale report + summary QA più i log Multipass sotto
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA supportato da Docker per lavoro QA in stile operatore.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Costruisce un tarball npm dal checkout corrente, lo installa globalmente in
    Docker, esegue onboarding non interattivo con chiave API OpenAI, configura Telegram
    per default, verifica che l'abilitazione del Plugin installi le dipendenze runtime on demand, esegue doctor e avvia un turno agente locale contro un endpoint OpenAI mockato.
  - Usa `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` per eseguire la stessa lane
    di installazione pacchettizzata con Discord.
- `pnpm test:docker:npm-telegram-live`
  - Installa un pacchetto OpenClaw pubblicato in Docker, esegue onboarding del
    pacchetto installato, configura Telegram tramite la CLI installata, poi riutilizza la
    lane QA Telegram live con quel pacchetto installato come Gateway SUT.
  - Usa come predefinito `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Usa le stesse credenziali Telegram da env o la stessa sorgente di credenziali Convex di
    `pnpm openclaw qa telegram`. Per automazione CI/release, imposta
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` più
    `OPENCLAW_QA_CONVEX_SITE_URL` e il segreto di ruolo. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e un segreto di ruolo Convex sono presenti in CI,
    il wrapper Docker seleziona Convex automaticamente.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` sovrascrive
    `OPENCLAW_QA_CREDENTIAL_ROLE` condiviso solo per questa lane.
  - GitHub Actions espone questa lane come workflow manuale per maintainer
    `NPM Telegram Beta E2E`. Non gira sul merge. Il workflow usa l'ambiente
    `qa-live-shared` e lease di credenziali CI Convex.
- `pnpm test:docker:bundled-channel-deps`
  - Impacchetta e installa la build OpenClaw corrente in Docker, avvia il Gateway
    con OpenAI configurato, poi abilita canali/Plugin inclusi tramite modifiche config.
  - Verifica che il rilevamento setup lasci assenti le dipendenze runtime del Plugin non configurato, che il primo Gateway configurato o l'esecuzione doctor installi on demand le dipendenze runtime di ogni Plugin incluso e che un secondo riavvio non reinstalli dipendenze già attivate.
  - Installa anche una nota baseline npm più vecchia, abilita Telegram prima di eseguire
    `openclaw update --tag <candidate>` e verifica che il
    post-update doctor del candidato ripari le dipendenze runtime del canale incluso senza una riparazione postinstall lato harness.
- `pnpm openclaw qa aimock`
  - Avvia solo il server provider AIMock locale per smoke test diretti del protocollo.
- `pnpm openclaw qa matrix`
  - Esegue la lane QA live Matrix contro un homeserver Tuwunel usa-e-getta supportato da Docker.
  - Questo host QA oggi è solo repo/dev. Le installazioni OpenClaw pacchettizzate non distribuiscono
    `qa-lab`, quindi non espongono `openclaw qa`.
  - I checkout del repo caricano direttamente il runner incluso; non serve alcun passaggio separato di installazione del Plugin.
  - Effettua il provisioning di tre utenti Matrix temporanei (`driver`, `sut`, `observer`) più una stanza privata, poi avvia un gateway child QA con il vero Plugin Matrix come trasporto SUT.
  - Usa per default l'immagine stabile Tuwunel bloccata `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Sovrascrivi con `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando devi testare un'immagine diversa.
  - Matrix non espone flag condivisi di sorgente credenziali perché la lane effettua il provisioning locale di utenti usa-e-getta.
  - Scrive un report QA Matrix, summary, artefatto observed-events e log combinato stdout/stderr sotto `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Esegue la lane QA live Telegram contro un gruppo privato reale usando i token bot driver e SUT da env.
  - Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L'ID gruppo deve essere l'ID numerico della chat Telegram.
  - Supporta `--credential-source convex` per credenziali condivise in pool. Usa la modalità env per default, oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` per scegliere lease condivisi.
  - Esce con codice diverso da zero se uno scenario fallisce. Usa `--allow-failures` quando
    vuoi gli artefatti senza un codice di uscita di errore.
  - Richiede due bot distinti nello stesso gruppo privato, con il bot SUT che espone uno username Telegram.
  - Per un'osservazione stabile bot-to-bot, abilita Bot-to-Bot Communication Mode in `@BotFather` per entrambi i bot e assicurati che il bot driver possa osservare il traffico bot nel gruppo.
  - Scrive un report QA Telegram, summary e artefatto observed-messages sotto `.artifacts/qa-e2e/...`. Gli scenari di risposta includono RTT dalla richiesta di invio del driver alla risposta osservata del SUT.

Le lane di trasporto live condividono un unico contratto standard così i nuovi trasporti non divergono:

`qa-channel` resta la suite QA sintetica ampia e non fa parte della matrice di copertura del trasporto live.

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Credenziali Telegram condivise tramite Convex (v1)

Quando `--credential-source convex` (oppure `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) è abilitato per
`openclaw qa telegram`, QA lab acquisisce un lease esclusivo da un pool supportato da Convex, invia heartbeat
a quel lease mentre la lane è in esecuzione e rilascia il lease allo shutdown.

Scaffold di riferimento del progetto Convex:

- `qa/convex-credential-broker/`

Variabili d'ambiente richieste:

- `OPENCLAW_QA_CONVEX_SITE_URL` (per esempio `https://your-deployment.convex.site`)
- Un segreto per il ruolo selezionato:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` per `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` per `ci`
- Selezione del ruolo credenziale:
  - CLI: `--credential-role maintainer|ci`
  - Predefinito env: `OPENCLAW_QA_CREDENTIAL_ROLE` (predefinito `ci` in CI, `maintainer` altrimenti)

Variabili d'ambiente facoltative:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (predefinito `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (predefinito `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (predefinito `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (predefinito `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (predefinito `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID di trace facoltativo)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` consente URL Convex loopback `http://` solo per sviluppo locale.

`OPENCLAW_QA_CONVEX_SITE_URL` dovrebbe usare `https://` in condizioni normali.

I comandi admin maintainer (pool add/remove/list) richiedono
specificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI per maintainer:

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
  - Pool esaurito / caso ritentabile: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Successo: `{ status: "ok" }` (oppure `2xx` vuoto)
- `POST /release`
  - Richiesta: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Successo: `{ status: "ok" }` (oppure `2xx` vuoto)
- `POST /admin/add` (solo segreto maintainer)
  - Richiesta: `{ kind, actorId, payload, note?, status? }`
  - Successo: `{ status: "ok", credential }`
- `POST /admin/remove` (solo segreto maintainer)
  - Richiesta: `{ credentialId, actorId }`
  - Successo: `{ status: "ok", changed, credential }`
  - Protezione lease attivo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (solo segreto maintainer)
  - Richiesta: `{ kind?, status?, includePayload?, limit? }`
  - Successo: `{ status: "ok", credentials, count }`

Forma del payload per il tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve essere una stringa numerica che rappresenta un ID chat Telegram.
- `admin/add` valida questa forma per `kind: "telegram"` e rifiuta payload malformati.

### Aggiungere un canale a QA

Aggiungere un canale al sistema QA markdown richiede esattamente due cose:

1. Un adattatore di trasporto per il canale.
2. Uno scenario pack che eserciti il contratto del canale.

Non aggiungere una nuova root di comando QA di primo livello quando l'host condiviso `qa-lab` può
gestire il flusso.

`qa-lab` gestisce la meccanica host condivisa:

- la root di comando `openclaw qa`
- startup e teardown della suite
- concorrenza dei worker
- scrittura degli artefatti
- generazione dei report
- esecuzione degli scenari
- alias di compatibilità per gli scenari `qa-channel` più vecchi

I Plugin runner gestiscono il contratto di trasporto:

- come `openclaw qa <runner>` viene montato sotto la root condivisa `qa`
- come il gateway viene configurato per quel trasporto
- come viene controllata la readiness
- come vengono iniettati gli eventi in ingresso
- come vengono osservati i messaggi in uscita
- come vengono esposte trascrizioni e stato di trasporto normalizzato
- come vengono eseguite le azioni supportate dal trasporto
- come viene gestito il reset o la pulizia specifici del trasporto

La soglia minima di adozione per un nuovo canale è:

1. Mantenere `qa-lab` come proprietario della root condivisa `qa`.
2. Implementare il runner di trasporto sulla seam host condivisa `qa-lab`.
3. Mantenere la meccanica specifica del trasporto dentro il Plugin runner o l'harness del canale.
4. Montare il runner come `openclaw qa <runner>` invece di registrare una root di comando concorrente.
   I Plugin runner dovrebbero dichiarare `qaRunners` in `openclaw.plugin.json` ed esportare un array `qaRunnerCliRegistrations` corrispondente da `runtime-api.ts`.
   Mantieni `runtime-api.ts` leggero; l'esecuzione lazy della CLI e del runner dovrebbe restare dietro entrypoint separati.
5. Creare o adattare scenari markdown nelle directory tematiche `qa/scenarios/`.
6. Usare gli helper generici degli scenari per i nuovi scenari.
7. Mantenere funzionanti gli alias di compatibilità esistenti, a meno che il repo non stia facendo una migrazione intenzionale.

La regola decisionale è rigida:

- Se un comportamento può essere espresso una sola volta in `qa-lab`, mettilo in `qa-lab`.
- Se un comportamento dipende da un singolo trasporto di canale, mantienilo in quel Plugin runner o harness del Plugin.
- Se uno scenario richiede una nuova capacità che più di un canale può usare, aggiungi un helper generico invece di un ramo specifico del canale in `suite.ts`.
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
Gli alias di compatibilità esistono per evitare una migrazione forzata in un solo giorno, non come modello per la scrittura dei nuovi scenari.

## Suite di test (cosa gira dove)

Pensa alle suite come a livelli di “realismo crescente” (e di maggiore fragilità/costo):

### Unit / integration (predefinita)

- Comando: `pnpm test`
- Configurazione: le esecuzioni non mirate usano l'insieme shard `vitest.full-*.config.ts` e possono espandere gli shard multi-project in configurazioni per progetto per la pianificazione parallela
- File: inventari core/unit sotto `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e i test node `ui` in allowlist coperti da `vitest.unit.config.ts`
- Ambito:
  - Test unitari puri
  - Test di integrazione in-process (auth gateway, routing, tooling, parsing, config)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Girano in CI
  - Nessuna chiave reale richiesta
  - Dovrebbero essere veloci e stabili
    <AccordionGroup>
    <Accordion title="Progetti, shard e lane con ambito"> - Le esecuzioni non mirate di `pnpm test` usano dodici configurazioni shard più piccole (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un unico enorme processo root-project nativo. Questo riduce il picco RSS su macchine cariche ed evita che il lavoro auto-reply/extension privi di risorse le suite non correlate. - `pnpm test --watch` usa ancora il grafo di progetto root nativo `vitest.config.ts`, perché un ciclo watch multi-shard non è pratico. - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima i target espliciti file/directory attraverso lane con ambito, così `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di pagare il costo completo di avvio del progetto root. - `pnpm test:changed` espande i percorsi git modificati nelle stesse lane con ambito quando il diff tocca solo file sorgente/test instradabili; le modifiche di config/setup continuano a ripiegare sulla riesecuzione ampia del progetto root. - `pnpm check:changed` è il normale smart local gate per lavoro ristretto. Classifica il diff in core, test core, extensions, test extension, app, doc, metadati di release e tooling, poi esegue le lane corrispondenti di typecheck/lint/test. Le modifiche al Plugin SDK pubblico e ai contratti dei plugin includono un passaggio di validazione extension perché le extension dipendono da quei contratti core. I soli version bump dei metadati di release eseguono controlli mirati su version/config/root-dependency invece della suite completa, con una guardia che rifiuta modifiche ai pacchetti fuori dal solo campo di versione di primo livello. - I test unitari leggeri lato import da agenti, comandi, Plugin, helper auto-reply, `plugin-sdk` e aree simili di utilità pura vengono instradati attraverso la lane `unit-fast`, che salta `test/setup-openclaw-runtime.ts`; i file stateful/runtime-heavy restano sulle lane esistenti. - Alcuni file helper sorgente selezionati di `plugin-sdk` e `commands` mappano anche le esecuzioni in modalità changed a test sibling espliciti in quelle lane leggere, così le modifiche agli helper evitano di rieseguire l'intera suite pesante di quella directory. - `auto-reply` ha tre bucket dedicati: helper core di primo livello, test di integrazione `reply.*` di primo livello e il sottoalbero `src/auto-reply/reply/**`. Questo mantiene il lavoro più pesante dell'harness reply fuori dai test economici di status/chunk/token.
    </Accordion>

      <Accordion title="Copertura del runner embedded">
        - Quando modifichi input di discovery dei message-tool o il contesto
          runtime di compattazione, mantieni entrambi i livelli di copertura.
        - Aggiungi regressioni helper mirate per i confini di puro routing e normalizzazione.
        - Mantieni sane le suite di integrazione del runner embedded:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
        - Queste suite verificano che gli ID con ambito e il comportamento di compattazione continuino a passare
          attraverso i veri percorsi `run.ts` / `compact.ts`; i test solo-helper non sono un sostituto sufficiente per quei percorsi di integrazione.
      </Accordion>

      <Accordion title="Pool Vitest e predefiniti di isolamento">
        - La configurazione base Vitest usa come predefinito `threads`.
        - La configurazione Vitest condivisa fissa `isolate: false` e usa il
          runner non isolato attraverso progetti root, config e2e e live.
        - La lane UI root mantiene il suo setup e ottimizzatore `jsdom`, ma gira anch'essa sul
          runner condiviso non isolato.
        - Ogni shard `pnpm test` eredita gli stessi predefiniti `threads` + `isolate: false`
          dalla configurazione Vitest condivisa.
        - `scripts/run-vitest.mjs` aggiunge `--no-maglev` per default ai
          processi Node figli di Vitest per ridurre il churn di compilazione V8 durante grandi esecuzioni locali.
          Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` per confrontare il comportamento V8 standard.
      </Accordion>

      <Accordion title="Iterazione locale veloce">
        - `pnpm changed:lanes` mostra quali lane architetturali attiva un diff.
        - Il pre-commit hook esegue solo formattazione. Rimette in stage i file formattati e
          non esegue lint, typecheck o test.
        - Esegui esplicitamente `pnpm check:changed` prima dell'handoff o del push quando
          ti serve lo smart local gate. Le modifiche al Plugin SDK pubblico e ai contratti dei plugin
          includono un passaggio di validazione extension.
        - `pnpm test:changed` instrada attraverso lane con ambito quando i percorsi modificati
          mappano chiaramente a una suite più piccola.
        - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di routing,
          solo con un limite di worker più alto.
        - L'auto-scaling locale dei worker è intenzionalmente conservativo e arretra
          quando il load average dell'host è già alto, così più esecuzioni
          Vitest concorrenti fanno meno danni per default.
        - La configurazione base Vitest marca progetti/file di configurazione come
          `forceRerunTriggers` così le riesecuzioni in modalità changed restano corrette quando cambia il wiring dei test.
        - La configurazione mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli
          host supportati; imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi
          una posizione cache esplicita per profiling diretto.
      </Accordion>

      <Accordion title="Debug delle prestazioni">
        - `pnpm test:perf:imports` abilita il reporting della durata degli import di Vitest più
          l'output di scomposizione degli import.
        - `pnpm test:perf:imports:changed` limita la stessa vista di profiling ai
          file modificati da `origin/main`.
        - Quando un singolo hot test continua a spendere la maggior parte del tempo negli import di avvio,
          mantieni le dipendenze pesanti dietro una seam locale ristretta `*.runtime.ts` e
          mocka direttamente quella seam invece di fare deep-import di helper runtime solo
          per passarli tramite `vi.mock(...)`.
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta il routing
          `test:changed` con il percorso root-project nativo per quel diff commitato e stampa
          wall time più max RSS macOS.
        - `pnpm test:perf:changed:bench -- --worktree` misura il worktree sporco corrente
          instradando l'elenco dei file modificati attraverso
          `scripts/test-projects.mjs` e la config root Vitest.
        - `pnpm test:perf:profile:main` scrive un profilo CPU del thread principale per
          l'overhead di startup e transform di Vitest/Vite.
        - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la
          suite unit con parallelismo dei file disabilitato.
      </Accordion>
    </AccordionGroup>

### Stabilità (gateway)

- Comando: `pnpm test:stability:gateway`
- Configurazione: `vitest.gateway.config.ts`, forzata a un solo worker
- Ambito:
  - Avvia un vero Gateway loopback con diagnostica abilitata per default
  - Esegue churn sintetico di messaggi gateway, memoria e grandi payload attraverso il percorso degli eventi diagnostici
  - Interroga `diagnostics.stability` tramite la WS RPC del Gateway
  - Copre gli helper di persistenza del bundle di stabilità diagnostico
  - Verifica che il recorder resti limitato, che i campioni RSS sintetici restino sotto il budget di pressione e che la profondità della coda per sessione torni a zero
- Aspettative:
  - Sicuro per CI e senza chiavi
  - Lane ristretta per follow-up di regressione della stabilità, non un sostituto della suite Gateway completa

### E2E (smoke del gateway)

- Comando: `pnpm test:e2e`
- Configurazione: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e test E2E dei Plugin inclusi sotto `extensions/`
- Predefiniti runtime:
  - Usa Vitest `threads` con `isolate: false`, allineato al resto del repo.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per default).
  - Gira in modalità silenziosa per default per ridurre l'overhead di I/O su console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (massimo 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riabilitare output verbose su console.
- Ambito:
  - Comportamento end-to-end del gateway multiistanza
  - Superfici WebSocket/HTTP, pairing node e networking più pesante
- Aspettative:
  - Gira in CI (quando abilitato nella pipeline)
  - Nessuna chiave reale richiesta
  - Più parti in movimento dei test unitari (può essere più lento)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Ambito:
  - Avvia sull'host un gateway OpenShell isolato tramite Docker
  - Crea una sandbox a partire da un Dockerfile locale temporaneo
  - Esercita il backend OpenShell di OpenClaw tramite veri `sandbox ssh-config` + SSH exec
  - Verifica il comportamento del filesystem remoto-canonico tramite il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell'esecuzione predefinita `pnpm test:e2e`
  - Richiede una CLI `openshell` locale più un demone Docker funzionante
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, poi distrugge gateway e sandbox di test
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando esegui manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a un binario CLI non predefinito o a uno script wrapper

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Configurazione: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e test live dei Plugin inclusi sotto `extensions/`
- Predefinito: **abilitato** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - “Questo provider/modello funziona davvero _oggi_ con credenziali reali?”
  - Intercetta cambi di formato del provider, stranezze nelle chiamate agli strumenti, problemi auth e comportamento dei rate limit
- Aspettative:
  - Per progettazione non è stabile in CI (reti reali, policy reali dei provider, quote, outage)
  - Costa denaro / usa rate limit
  - Preferisci eseguire sottoinsiemi ristretti invece di “tutto”
- Le esecuzioni live fanno source di `~/.profile` per recuperare eventuali chiavi API mancanti.
- Per default, le esecuzioni live continuano a isolare `HOME` e copiano config/materiale auth in una home di test temporanea così le fixture unit non possono modificare il tuo vero `~/.openclaw`.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando vuoi intenzionalmente che i test live usino la tua vera home directory.
- `pnpm test:live` ora usa per default una modalità più silenziosa: mantiene l'output di avanzamento `[live] ...`, ma sopprime l'avviso extra su `~/.profile` e silenzia i log di bootstrap gateway / chatter Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi di nuovo i log di avvio completi.
- Rotazione delle chiavi API (specifica per provider): imposta `*_API_KEYS` con formato virgola/punto e virgola o `*_API_KEY_1`, `*_API_KEY_2` (per esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oppure override per live tramite `OPENCLAW_LIVE_*_KEY`; i test ritentano sulle risposte di rate limit.
- Output di avanzamento/heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr così le lunghe chiamate ai provider risultano visibilmente attive anche quando la cattura console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l'intercettazione della console di Vitest così le righe di avanzamento provider/gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli heartbeat direct-model con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli heartbeat gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite dovrei eseguire?

Usa questa tabella decisionale:

- Se modifichi logica/test: esegui `pnpm test` (e `pnpm test:coverage` se hai modificato molto)
- Se tocchi networking gateway / protocollo WS / pairing: aggiungi `pnpm test:e2e`
- Se fai debug di “il mio bot è giù” / guasti specifici del provider / chiamate di strumenti: esegui un `pnpm test:live` ristretto

## Test live (che toccano la rete)

Per la matrix live dei modelli, smoke dei backend CLI, smoke ACP, harness app-server Codex
e tutti i test live dei provider media (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — più la gestione delle credenziali per le esecuzioni live — vedi
[Testing — suite live](/it/help/testing-live).

## Runner Docker (controlli opzionali “funziona su Linux”)

Questi runner Docker si dividono in due categorie:

- Runner live-model: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il loro file live corrispondente con chiave profilo dentro l'immagine Docker del repo (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la tua config dir locale e il workspace (e facendo source di `~/.profile` se montato). Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner live Docker usano per default un cap smoke più piccolo così uno sweep Docker completo resta praticabile:
  `test:docker:live-models` usa come predefinito `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa come predefiniti `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sovrascrivi queste variabili env quando
  vuoi esplicitamente la scansione esaustiva più ampia.
- `test:docker:all` costruisce una volta l'immagine Docker live tramite `test:docker:live-build`, poi la riusa per le due lane Docker live. Costruisce anche una singola immagine condivisa `scripts/e2e/Dockerfile` tramite `test:docker:e2e-build` e la riusa per i runner smoke dei container E2E che esercitano l'app buildata.
- Runner smoke dei container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` e `test:docker:config-reload` avviano uno o più container reali e verificano percorsi di integrazione di livello più alto.

I runner Docker live-model montano anche solo le home auth CLI necessarie (oppure tutte quelle supportate quando l'esecuzione non è ristretta), poi le copiano nella home del container prima dell'esecuzione così l'OAuth delle CLI esterne può aggiornare i token senza modificare il negozio auth dell'host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke del backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke dell'harness app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live di Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Wizard di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/canale/agente da tarball npm: `pnpm test:docker:npm-onboard-channel-agent` installa globalmente in Docker il tarball OpenClaw impacchettato, configura OpenAI tramite onboarding env-ref più Telegram per default, verifica che doctor ripari le dipendenze runtime del Plugin attivato ed esegue un turno agente mockato OpenAI. Riusa un tarball prebuildato con `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la rebuild host con `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, oppure cambia canale con `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke dell'installazione globale Bun: `bash scripts/e2e/bun-global-install-smoke.sh` impacchetta l'albero corrente, lo installa con `bun install -g` in una home isolata e verifica che `openclaw infer image providers --json` restituisca i provider image inclusi invece di bloccarsi. Riusa un tarball prebuildato con `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, salta la build host con `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, oppure copia `dist/` da un'immagine Docker buildata con `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker dell'installer: `bash scripts/test-install-sh-docker.sh` condivide una sola cache npm tra i suoi container root, update e direct-npm. Lo smoke di update usa come predefinito npm `latest` come baseline stabile prima di aggiornare al tarball candidato. I controlli installer non-root mantengono una cache npm isolata così le voci di cache possedute da root non mascherano il comportamento di installazione locale dell'utente. Imposta `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` per riusare la cache root/update/direct-npm tra riesecuzioni locali.
- Install Smoke CI salta l'aggiornamento globale direct-npm duplicato con `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; esegui lo script localmente senza quella env quando serve la copertura diretta di `npm install -g`.
- Networking Gateway (due container, auth WS + salute): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Regressione minimale del reasoning per OpenAI Responses `web_search`: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) esegue un server OpenAI mockato tramite Gateway, verifica che `web_search` alzi `reasoning.effort` da `minimal` a `low`, poi forza il rifiuto dello schema lato provider e controlla che il dettaglio raw compaia nei log Gateway.
- Bridge del canale MCP (Gateway seeded + bridge stdio + smoke del notification-frame raw Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Strumenti bundle MCP Pi (vero server stdio MCP + smoke allow/deny del profilo Pi embedded): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pulizia MCP Cron/subagent (vero Gateway + teardown di child stdio MCP dopo esecuzioni cron isolate e sottoagente one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke install + alias `/plugin` + semantica di riavvio del bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
- Smoke update Plugin invariato: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke dei metadati di reload config: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dipendenze runtime dei Plugin inclusi: `pnpm test:docker:bundled-channel-deps` costruisce per default una piccola immagine runner Docker, compila e impacchetta OpenClaw una volta sull'host, poi monta quel tarball in ciascuno scenario di installazione Linux. Riusa l'immagine con `OPENCLAW_SKIP_DOCKER_BUILD=1`, salta la rebuild host dopo una build locale fresca con `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, oppure punta a un tarball esistente con `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Restringi le dipendenze runtime dei Plugin inclusi durante l'iterazione disabilitando scenari non correlati, per esempio:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Per prebuildare e riusare manualmente l'immagine condivisa dell'app buildata:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Gli override di immagine specifici della suite come `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` continuano ad avere la priorità quando impostati. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` punta a un'immagine condivisa remota, gli script la scaricano se non è già locale. I test Docker QR e installer mantengono i propri Dockerfile perché validano il comportamento del pacchetto/installazione invece del runtime condiviso dell'app buildata.

I runner Docker live-model montano anche in sola lettura il checkout corrente e
lo preparano in una workdir temporanea all'interno del container. Questo mantiene snella l'immagine runtime pur eseguendo Vitest contro la tua esatta sorgente/config locale.
Il passaggio di staging salta grandi cache solo-locali e output di build delle app come
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e directory `.build` locali dell'app o
output Gradle, così le esecuzioni live Docker non passano minuti a copiare artefatti
specifici della macchina.
Impostano anche `OPENCLAW_SKIP_CHANNELS=1` così i probe live del gateway non avviano
veri worker di canali Telegram/Discord/ecc. dentro il container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi inoltra anche
`OPENCLAW_LIVE_GATEWAY_*` quando hai bisogno di restringere o escludere la copertura
live del gateway da quella lane Docker.
`test:docker:openwebui` è uno smoke di compatibilità di livello più alto: avvia un
container gateway OpenClaw con endpoint HTTP compatibili con OpenAI abilitati,
avvia un container Open WebUI bloccato contro quel gateway, effettua l'accesso tramite
Open WebUI, verifica che `/api/models` esponga `openclaw/default`, poi invia una
vera richiesta di chat tramite il proxy `/api/chat/completions` di Open WebUI.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe dover scaricare
l'immagine Open WebUI e Open WebUI potrebbe dover completare il proprio cold-start.
Questa lane si aspetta una chiave di modello live utilizzabile e `OPENCLAW_PROFILE_FILE`
(`~/.profile` per default) è il modo principale per fornirla nelle esecuzioni Dockerizzate.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un
vero account Telegram, Discord o iMessage. Avvia un container Gateway seeded,
avvia un secondo container che esegue `openclaw mcp serve`, poi
verifica discovery delle conversazioni instradate, letture della trascrizione, metadati degli allegati,
comportamento della coda di eventi live, instradamento dell'invio in uscita e notifiche in stile Claude di canale +
permessi tramite il vero bridge stdio MCP. Il controllo delle notifiche
ispeziona direttamente i frame stdio MCP grezzi così lo smoke valida ciò che il
bridge emette realmente, non solo ciò che un particolare SDK client decide di esporre.
`test:docker:pi-bundle-mcp-tools` è deterministico e non richiede una chiave di modello live.
Costruisce l'immagine Docker del repo, avvia un vero server probe stdio MCP
all'interno del container, materializza quel server tramite il runtime bundle
MCP Pi embedded, esegue lo strumento, poi verifica che `coding` e `messaging` mantengano
gli strumenti `bundle-mcp` mentre `minimal` e `tools.deny: ["bundle-mcp"]` li filtrano.
`test:docker:cron-mcp-cleanup` è deterministico e non richiede una chiave di modello live.
Avvia un Gateway seeded con un vero server probe stdio MCP, esegue un turno cron
isolato e un turno child one-shot `/subagents spawn`, poi verifica che il
processo child MCP termini dopo ogni esecuzione.

Smoke manuale ACP plain-language thread (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantieni questo script per flussi di regressione/debug. Potrebbe essere necessario di nuovo per la validazione del routing thread ACP, quindi non eliminarlo.

Variabili env utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinito: `~/.openclaw`) montato in `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinito: `~/.openclaw/workspace`) montato in `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinito: `~/.profile`) montato in `/home/node/.profile` e usato tramite source prima di eseguire i test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` per verificare solo le variabili env caricate da `OPENCLAW_PROFILE_FILE`, usando config/workspace dir temporanee e nessun mount auth CLI esterno
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinito: `~/.cache/openclaw/docker-cli-tools`) montato in `/home/node/.npm-global` per installazioni CLI in cache dentro Docker
- Le dir/file auth delle CLI esterne sotto `$HOME` vengono montate in sola lettura sotto `/host-auth...`, poi copiate in `/home/node/...` prima dell'avvio dei test
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni ristrette per provider montano solo dir/file necessari inferiti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manuale con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oppure una lista separata da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l'esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` per riusare un'immagine `openclaw:local-live` esistente per riesecuzioni che non richiedono rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per assicurarsi che le credenziali provengano dal negozio del profilo (non da env)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal gateway per lo smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sovrascrivere il prompt di controllo nonce usato dallo smoke Open WebUI
- `OPENWEBUI_IMAGE=...` per sovrascrivere il tag immagine Open WebUI bloccato

## Sanity della documentazione

Esegui i controlli docs dopo modifiche alla documentazione: `pnpm check:docs`.
Esegui la validazione completa degli anchor Mintlify quando ti servono anche i controlli sugli heading in-page: `pnpm docs:check-links:anchors`.

## Regressione offline (sicura per CI)

Queste sono regressioni di “pipeline reale” senza provider reali:

- Chiamata di strumenti Gateway (mock OpenAI, vero gateway + ciclo agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, scrive config + auth applicata): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Valutazioni di affidabilità dell'agente (Skills)

Abbiamo già alcuni test sicuri per CI che si comportano come “valutazioni di affidabilità dell'agente”:

- Mock tool-calling tramite il vero gateway + ciclo agente (`src/gateway/gateway.test.ts`).
- Flussi wizard end-to-end che validano il wiring della sessione e gli effetti della configurazione (`src/gateway/gateway.test.ts`).

Cosa manca ancora per Skills (vedi [Skills](/it/tools/skills)):

- **Decisioning:** quando le Skills sono elencate nel prompt, l'agente sceglie la Skill giusta (o evita quelle irrilevanti)?
- **Compliance:** l'agente legge `SKILL.md` prima dell'uso e segue i passaggi/argomenti richiesti?
- **Workflow contracts:** scenari multi-turno che verificano ordine degli strumenti, mantenimento della cronologia di sessione e confini sandbox.

Le valutazioni future dovrebbero restare prima di tutto deterministiche:

- Un runner di scenari che usa provider mock per verificare chiamate degli strumenti + ordine, letture dei file Skill e wiring della sessione.
- Una piccola suite di scenari focalizzati sulle skill (uso vs evitamento, gating, prompt injection).
- Valutazioni live facoltative (opt-in, controllate da env) solo dopo che la suite sicura per CI è stata predisposta.

## Test di contratto (forma di plugin e canali)

I test di contratto verificano che ogni plugin e canale registrato sia conforme al proprio
contratto di interfaccia. Iterano su tutti i plugin rilevati ed eseguono una suite di
assert sulla forma e sul comportamento. La lane unit predefinita `pnpm test`
salta intenzionalmente questi file condivisi di seam e smoke; esegui esplicitamente
i comandi di contratto quando tocchi superfici condivise di canali o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti dei canali: `pnpm test:contracts:channels`
- Solo contratti dei provider: `pnpm test:contracts:plugins`

### Contratti dei canali

Si trovano in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma base del plugin (id, nome, capacità)
- **setup** - Contratto della procedura guidata di setup
- **session-binding** - Comportamento del binding di sessione
- **outbound-payload** - Struttura del payload dei messaggi
- **inbound** - Gestione dei messaggi in ingresso
- **actions** - Handler delle azioni del canale
- **threading** - Gestione del thread ID
- **directory** - API directory/roster
- **group-policy** - Applicazione dei criteri di gruppo

### Contratti di stato dei provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe dello stato del canale
- **registry** - Forma del registro plugin

### Contratti dei provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contratto del flusso auth
- **auth-choice** - Scelta/selezione auth
- **catalog** - API del catalogo dei modelli
- **discovery** - Rilevamento dei plugin
- **loader** - Caricamento dei plugin
- **runtime** - Runtime del provider
- **shape** - Forma/interfaccia del plugin
- **wizard** - Procedura guidata di setup

### Quando eseguirli

- Dopo aver modificato export o subpath del plugin-sdk
- Dopo aver aggiunto o modificato un plugin di canale o provider
- Dopo aver rifattorizzato registrazione o rilevamento dei plugin

I test di contratto girano in CI e non richiedono chiavi API reali.

## Aggiungere regressioni (linee guida)

Quando correggi un problema di provider/modello scoperto in live:

- Aggiungi una regressione sicura per CI se possibile (provider mock/stub, oppure cattura l'esatta trasformazione della forma della richiesta)
- Se è intrinsecamente solo-live (rate limit, policy auth), mantieni il test live ristretto e opt-in tramite variabili env
- Preferisci puntare al livello più piccolo che intercetta il bug:
  - bug di conversione/replay della richiesta del provider → test diretto dei modelli
  - bug della pipeline gateway session/history/tool → smoke live del gateway o test mock gateway sicuro per CI
- Guardrail di traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un target campionato per classe SecretRef dai metadati del registro (`listSecretTargetRegistryEntries()`), poi verifica che gli exec id dei segmenti traversal vengano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente sugli id target non classificati così le nuove classi non possono essere saltate in silenzio.

## Correlati

- [Testing live](/it/help/testing-live)
- [CI](/it/ci)
